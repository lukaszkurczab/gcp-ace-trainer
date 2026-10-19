import test from 'node:test';
import assert from 'node:assert/strict';
import { adjudicateDeadline } from './adjudicateAndroidDeadlineRecovery.mjs';

function fixture() {
  const runId = 'c84afbb2-a2c7-405e-91df-9fd124ace0af', apkSha256 = 'a'.repeat(64);
  const baseline = { idSha256: 'session', modeId: 'certification-exam-simulation', status: 'active',
    startedAt: '2026-10-18T21:35:51.215Z', configurationSha256: 'config', timerKind: 'absoluteDeadline',
    timerDeadlineAt: '2026-10-18T23:35:51.215Z', timerDurationMs: 7200000, revision: 1, digest: 'before', result: null };
  const row = { ...baseline, status: 'completed', completedAt: '2026-10-18T23:36:29.633Z', digest: 'terminal',
    result: { digest: 'result', totalOccurrences: 50, answeredCount: 0, unansweredCount: 50 } };
  const profile = { kind: 'account', idSha256: 'profile', accountSha256: 'account' };
  const binding = { kind: 'verified', accountSha256: 'account', uidSha256: 'uid', verificationRevision: 10 };
  const marker = probe => ({ stage: 'snapshot', runId, inventory: [], accountProbe: { profile, timer: null, session: null, pendingJournal: false, ...probe } });
  return { interruption: { runId, apkSha256, deathConfirmed: true, expectedOccurrences: 50, baseline,
    deadlineMs: Date.parse(baseline.timerDeadlineAt), deviceWallMsAtStop: Date.parse(baseline.startedAt) + 60000,
    originalProcess: { pid: '1', birth: '100' } },
  before: marker({ binding, session: { idSha256: 'session', configurationSha256: 'config' }, deadlineSessions: [baseline] }),
  cold: { stage: 'absolute_deadline_before_lifecycle', snapshotPhase: 'profile_ready_before_lifecycle', runId,
    profileSha256: 'profile', sessionSha256: 'session', configurationSha256: 'config', startedAt: baseline.startedAt,
    timerKind: baseline.timerKind, timerDeadlineAt: baseline.timerDeadlineAt, timerDurationMs: baseline.timerDurationMs,
    observedWallMs: Date.parse(baseline.timerDeadlineAt) + 1000 },
  firstTerminal: marker({ binding: { kind: 'invalidated' }, deadlineSessions: [row] }),
  firstFailure: { apkSha256, category: 'account_scope_rejected', bindingKind: 'invalidated', noManualBindingWrite: true,
    firstRecoveredProcess: { pid: '2', birth: '200' }, terminalFacts: [row] },
  reproofCold: { freshProcess: { pid: '3', birth: '300' }, cold: { runId, stage: 'cold_probe_refused', category: 'probe_scope_unavailable' } },
  reproofTerminal: marker({ binding: { ...binding, verificationRevision: 12 }, deadlineSessions: [row] }) };
}

test('correlates terminal results while retaining the first cold identity gap', () => {
  const proof = adjudicateDeadline(fixture());
  assert.equal(proof.verdict, 'PASS');
  assert.equal(proof.identityQualification.continuousVerifiedBinding, false);
  assert.equal(proof.identityQualification.manualBindingWrite, false);
});
for (const [name, mutate] of [
  ['wrong UID', x => { x.reproofTerminal.accountProbe.binding.uidSha256 = 'other'; }],
  ['wrong APK', x => { x.firstFailure.apkSha256 = 'b'.repeat(64); }],
  ['reused process', x => { x.reproofCold.freshProcess = x.firstFailure.firstRecoveredProcess; }],
  ['changed deadline', x => { x.cold.timerDeadlineAt = '2026-10-19T23:35:51.215Z'; }],
  ['changed result', x => { x.reproofTerminal.accountProbe.deadlineSessions = [{ ...x.reproofTerminal.accountProbe.deadlineSessions[0], result: { digest: 'other' } }]; }],
  ['duplicate session', x => { x.reproofTerminal.accountProbe.deadlineSessions.push(x.reproofTerminal.accountProbe.deadlineSessions[0]); }],
  ['retained active draft', x => { x.reproofTerminal.inventory.push({ key: 'patternly:canonical:v1:active-training-session-draft' }); }],
]) test('refuses ' + name, () => { const x = structuredClone(fixture()); mutate(x); assert.throws(() => adjudicateDeadline(x)); });
