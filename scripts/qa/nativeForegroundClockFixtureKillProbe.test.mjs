import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {fixtureLossBounds,fixtureInterruptionExpression} from './nativeForegroundClockFixtureKillProbe.mjs';
const runId='12345678-1234-4234-8234-123456789abc';
const initial={protocol:'patternly.native-clock-fixture.v1',stage:'ready',mode:'seed',scenario:'countdown',runId,encrypted:true,errorCategory:null,cleanupVerified:false,
  durableElapsedMs:0,elapsedMs:0,countdownMs:60000,checkpointRevision:1,metrics:{checkpointCount:0}};
const marker={baselineElapsedMs:0,preElapsedMs:0,preCheckpointRevision:1,enterCheckpointRevision:2,enterCheckpointCount:1};
const measurement={runId,initial,marker,requestedKillDelayMs:5500,sendAtMs:0,markerAtMs:100,killAtMs:5600,deathAtMs:5620};
const recovered={...initial,mode:'recover',durableElapsedMs:5000,elapsedMs:5000,checkpointRevision:7,running:true};
test('fixture loss uses independent cap-aware geometry and never pretends to have a session aggregate',()=>{
  assert.deepEqual(fixtureLossBounds(measurement,recovered),{expectedLowerMs:5500,expectedUpperMs:5621,recoveredElapsedMs:5000,lossLowerMs:500,lossUpperMs:621,uncertaintyMs:121,periodicCheckpointCount:5});
  for(const change of [{runId:'another'}, {scenario:'cap'}, {running:false}, {durableElapsedMs:7000,elapsedMs:7000}, {elapsedMs:5001}, {checkpointRevision:1}]) assert.throws(()=>fixtureLossBounds(measurement,{...recovered,...change}));
  const capInitial={...initial,scenario:'cap',durableElapsedMs:59500};
  const capped={...recovered,scenario:'cap',durableElapsedMs:60000,elapsedMs:60000,running:false,checkpointRevision:3};
  assert.equal(fixtureLossBounds({...measurement,initial:capInitial,marker:{...marker,baselineElapsedMs:59500,preElapsedMs:59500}},capped).lossUpperMs,0);
  const overrun={...initial,scenario:'overrun',durableElapsedMs:61000};
  assert.throws(()=>fixtureLossBounds({...measurement,initial:overrun,marker:{...marker,baselineElapsedMs:61000,preElapsedMs:61000}},
    {...recovered,scenario:'overrun',durableElapsedMs:61000,elapsedMs:61000,checkpointRevision:2,running:false}));
  assert.throws(()=>fixtureLossBounds(measurement,{...recovered,checkpointRevision:2}));
  assert.throws(()=>fixtureInterruptionExpression('seed','overrun',runId,overrun));
  assert.equal(fixtureLossBounds({...measurement,requestedKillDelayMs:0,killAtMs:101,deathAtMs:102},{...recovered,durableElapsedMs:0,elapsedMs:0,checkpointRevision:2}).lossUpperMs,103);
  assert.equal(fixtureLossBounds({...measurement,marker:{...marker,baselineElapsedMs:2},requestedKillDelayMs:0,killAtMs:101,deathAtMs:102},
    {...recovered,durableElapsedMs:0,elapsedMs:0,checkpointRevision:2}).lossUpperMs,105);
});
test('actual generated expression refuses wrong cold scope before effects and pauses on natural completion',()=>{
  const expression=fixtureInterruptionExpression('seed','countdown',runId,initial);
  for(const before of [null,{...initial,runId:'foreign'},{...initial,elapsedMs:1},{...initial,metrics:{checkpointCount:1}}]){
    const clock={read:()=>before,enter(){throw Error('must_not_enter');}};
    const result=vm.runInNewContext(expression,{__patternlyNativeClockFixture:clock});
    assert.equal(result.stage,'pre_effect_refused');
  }
  const effects=[];let now=0;
  const clock={read:()=>initial,enter(){effects.push('enter');return {checkpointRevision:2};},elapsed:()=>0,metrics:()=>({checkpointCount:1}),pause(){effects.push('pause');return {running:false};}};
  const result=vm.runInNewContext(expression,{__patternlyNativeClockFixture:clock,console:{info:(...args)=>effects.push(args)},performance:{now:()=>now+=13000},Date});
  assert.equal(result.clockStopped,true);assert.equal(effects[0],'enter');assert.equal(effects.at(-1),'pause');
  assert.deepEqual(JSON.parse(effects[1][1]),marker);
  assert.throws(()=>fixtureInterruptionExpression('cleanup','countdown',runId,initial));
});
