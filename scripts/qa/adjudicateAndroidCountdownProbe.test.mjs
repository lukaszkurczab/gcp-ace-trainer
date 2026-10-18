import assert from 'node:assert/strict';
import test from 'node:test';
import { adjudicateCountdown } from './adjudicateAndroidCountdownProbe.mjs';

function evidence() {
  const process = { pid: '11', birth: '100' };
  const inventory = [{ key: 'session', sha256: 'same', sessionContentSha256: 'same-content' },
    { key: 'patternly:canonical:v1:active-foreground-timer', sha256: 'before' }];
  const common = { runId: 'run', profileSha256: 'profile', sessionSha256: 'session', configurationSha256: 'config',
    startedAt: 'start', timerKind: 'countdownForeground', running: true };
  return [{ ...common, stage: 'stall_started', preparedCaseId: 'case', elapsedMs: 1000, durableElapsedMs: 900,
    countdownMs: 60000, inventory },
  { ...common, stage: 'cold_before_sync', snapshotPhase: 'profile_ready_before_lifecycle', durableElapsedMs: 1500,
    inventory: [inventory[0], { ...inventory[1], sha256: 'after' }] },
  { caseId: 'case', runId: 'run', stage: 'process_death_confirmed', originalProcess: process, processBeforeKill: process,
    times: { sendAt: 0, markerAt: 10, killAt: 1000, deathAt: 1100 } },
  { originalProcess: process, freshProcess: { pid: '12', birth: '200' } }];
}

test('derived constant preserves original receipt and includes transport uncertainty', () => {
  const args = evidence(), original = JSON.stringify(args);
  const result = adjudicateCountdown(...args);
  assert.equal(result.verdict, 'PASS');
  assert.equal(result.lossUpperMs, 601);
  assert.equal(result.derivedField.value, 60000);
  assert.equal(JSON.stringify(args), original);
});

test('derivation refuses changed configuration, session bytes, process lineage or unrelated data', () => {
  const mutations = [
    args => { args[1].configurationSha256 = 'other'; },
    args => { args[1].inventory[0] = { ...args[1].inventory[0], sha256: 'changed' }; },
    args => { args[1].inventory[0] = { ...args[1].inventory[0], sessionContentSha256: 'changed' }; },
    args => { args[2].processBeforeKill = { pid: '99', birth: '300' }; },
    args => { args[3].freshProcess = args[3].originalProcess; },
    args => { args[1].inventory.push({ key: 'unrelated', sha256: 'new' }); },
    args => { args[0].countdownMs = Infinity; },
    args => { args[1].countdownMs = 60000; },
  ];
  for (const mutate of mutations) {
    const args = evidence(); mutate(args);
    assert.throws(() => adjudicateCountdown(...args));
  }
});
