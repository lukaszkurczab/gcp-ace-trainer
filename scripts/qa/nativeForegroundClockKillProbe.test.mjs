import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import { validateMarker, lossBounds, isPreEffectRefusal, needsCleanupKill, isStoppedCompletion } from './nativeForegroundClockKillProbe.mjs';
const initial = { durableElapsedMs: 100, checkpointRevision: 1 };
const marker = { preElapsedMs: 100, baselineElapsedMs: 101, preCheckpointRevision: 1, enterCheckpointRevision: 2, enterCheckpointCount: 1 };
test('owned cleanup sends one kill and requires bounded confirmed death',async()=>{
  const file=readFileSync(new URL('./nativeForegroundClockKillProbe.mjs',import.meta.url),'utf8');
  const body=file.slice(file.indexOf('export async function killOwnedAndConfirm'),file.indexOf('function expressionFor')).replace('export ','');
  for(const remainsAlive of [false,true]) {
    const effects=[];let killed=false,now=0;
    const context=vm.createContext({alive:()=>remainsAlive||!killed,assertOwned:()=>effects.push('owned'),
      process:{kill:()=>{effects.push('kill');killed=true;}},performance:{now:()=>now+=1000},delay:async()=>{}});
    vm.runInContext(body,context);const result=vm.runInContext(`killOwnedAndConfirm(42,'${'a'.repeat(64)}')`,context);
    if(remainsAlive)await assert.rejects(result,/process_death_unconfirmed/);else await result;
    assert.deepEqual(effects,['owned','kill']);
  }
});
test('marker distinguishes enter checkpoint from periodic persistence and rejects extra data', () => {
  assert.deepEqual(validateMarker(marker, initial), marker);
  for (const patch of [{ raw: 'private' }, { preElapsedMs: 0 }, { enterCheckpointRevision: 1 }, { enterCheckpointCount: 2 }]) assert.throws(() => validateMarker({ ...marker, ...patch }, initial));
});
test('conservative loss bounds include event delivery and process death uncertainty', () => {
  const measurement = { marker, sendAtMs: 0, markerAtMs: 100, killAtMs: 5600, deathAtMs: 5620 };
  const recovered = { durableElapsedMs: 5101, sessionElapsedMs: 100, checkpointRevision: 7, running: true };
  assert.deepEqual(lossBounds(measurement, recovered), { expectedLowerMs: 5601, expectedUpperMs: 5722, recoveredElapsedMs: 5101, lossLowerMs: 500, lossUpperMs: 621, uncertaintyMs: 121, periodicCheckpointCount: 5 });
  for (const patch of [{ running: false }, { checkpointRevision: 2 }, { sessionElapsedMs: 5101 }, { durableElapsedMs: 6000 }]) assert.throws(() => lossBounds(measurement, { ...recovered, ...patch }));
  assert.throws(() => lossBounds({ ...measurement, markerAtMs: -1 }, recovered));
  assert.throws(() => lossBounds({ ...measurement, deathAtMs: 11000 }, recovered), /measurement_inconclusive/);
});

test('known allowlisted pre-effect refusal preserves the app; uncertain enter requires bounded cleanup', () => {
  const refusal = { result: { result: { value: { stage: 'pre_effect_refused', category: 'native_clock_preflight_rejected' } } } };
  assert.equal(isPreEffectRefusal(refusal), true);
  assert.equal(needsCleanupKill(true, false, isPreEffectRefusal(refusal)), false);
  for (const message of [null, {}, { error: {}, ...refusal }, { result: { ...refusal.result, exceptionDetails: {} } },
    { result: { result: { value: { ...refusal.result.result.value, raw: 'private' } } } }]) {
    assert.equal(isPreEffectRefusal(message), false);
    assert.equal(needsCleanupKill(true, false, isPreEffectRefusal(message)), true);
  }
  assert.equal(needsCleanupKill(false, false, false), false);
  assert.equal(needsCleanupKill(true, true, false), false);
});

test('acknowledged normal completion stops the clock and preserves the process on a failed measurement', () => {
  const completion = { result: { result: { value: { stage: 'stall_completed_before_kill', clockStopped: true } } } };
  assert.equal(isStoppedCompletion(completion), true);
  assert.equal(needsCleanupKill(true, false, false, isStoppedCompletion(completion)), false);
  for (const message of [null, {}, { result: { result: { value: { stage: 'stall_completed_before_kill', clockStopped: false } } } },
    { result: { ...completion.result, exceptionDetails: {} } },
    { result: { result: { value: { ...completion.result.result.value, raw: 'private' } } } }]) {
    assert.equal(isStoppedCompletion(message), false);
    assert.equal(needsCleanupKill(true, false, false, isStoppedCompletion(message)), true);
  }
});
