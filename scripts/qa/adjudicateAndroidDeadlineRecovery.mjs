#!/usr/bin/env node
// Read-only correlation after an ordinary positive identity reproof. Never
// turns the first cold's invalidated binding into a verified-binding claim.
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { pathToFileURL } from 'node:url';

const uuid = /^[a-f0-9-]{36}$/u;
const assert = condition => { if (!condition) throw Error('adjudication_scope_rejected'); };
const facts = row => Object.fromEntries(Object.entries(row).filter(([key]) => !['revision', 'digest'].includes(key)));
const sameProcess = (a, b) => a?.pid === b?.pid && a?.birth === b?.birth;
const validProcess = p => /^\d+$/u.test(p?.pid ?? '') && /^\d+$/u.test(p?.birth ?? '');

export function adjudicateDeadline(input) {
  const { interruption: i, before, cold, firstTerminal: first, firstFailure: failure, reproofCold: reproof, reproofTerminal: after } = input;
  const a = before.accountProbe, b = first.accountProbe, c = after.accountProbe;
  assert(uuid.test(i.runId) && /^[a-f0-9]{64}$/u.test(i.apkSha256) && i.deathConfirmed
    && Number.isInteger(i.expectedOccurrences) && i.expectedOccurrences >= 1 && i.expectedOccurrences <= 200);
  for (const marker of [before, first, after]) assert(marker.stage === 'snapshot' && marker.runId === i.runId);
  assert(a.binding.kind === 'verified' && b.binding.kind === 'invalidated' && c.binding.kind === 'verified');
  for (const probe of [a, b, c]) assert(probe.profile.kind === 'account'
    && probe.profile.idSha256 === a.profile.idSha256 && probe.profile.accountSha256 === a.profile.accountSha256);
  for (const binding of [a.binding, c.binding]) assert(binding.accountSha256 === a.profile.accountSha256
    && binding.uidSha256 === a.binding.uidSha256);
  assert(c.binding.verificationRevision >= a.binding.verificationRevision);
  const baseline = i.baseline;
  assert(Number.isSafeInteger(i.deadlineMs) && Date.parse(baseline.timerDeadlineAt) === i.deadlineMs && i.deviceWallMsAtStop < i.deadlineMs);
  assert(baseline.status === 'active' && baseline.result === null && !a.timer && !a.pendingJournal
    && a.session?.idSha256 === baseline.idSha256 && a.session.configurationSha256 === baseline.configurationSha256);
  assert(isDeepStrictEqual(a.deadlineSessions.filter(row => row.idSha256 === baseline.idSha256), [baseline]));
  for (const [key, value] of Object.entries({ stage: 'absolute_deadline_before_lifecycle', snapshotPhase: 'profile_ready_before_lifecycle',
    profileSha256: a.profile.idSha256, sessionSha256: baseline.idSha256, configurationSha256: baseline.configurationSha256,
    startedAt: baseline.startedAt, timerKind: 'absoluteDeadline', timerDeadlineAt: baseline.timerDeadlineAt, timerDurationMs: baseline.timerDurationMs })) assert(cold[key] === value);
  assert(cold.runId === i.runId && cold.observedWallMs >= i.deadlineMs);
  assert(reproof.cold.runId === i.runId && reproof.cold.stage === 'cold_probe_refused' && reproof.cold.category === 'probe_scope_unavailable');
  assert(failure.apkSha256 === i.apkSha256 && failure.category === 'account_scope_rejected'
    && failure.bindingKind === 'invalidated' && failure.noManualBindingWrite === true);
  for (const p of [i.originalProcess, failure.firstRecoveredProcess, reproof.freshProcess]) assert(validProcess(p));
  assert(!sameProcess(i.originalProcess, failure.firstRecoveredProcess) && !sameProcess(failure.firstRecoveredProcess, reproof.freshProcess)
    && !sameProcess(i.originalProcess, reproof.freshProcess));
  const rows = [b, c].map(probe => probe.deadlineSessions.filter(row => row.idSha256 === baseline.idSha256));
  assert(rows.every(list => list.length === 1));
  const row = rows[0][0];
  assert(isDeepStrictEqual(row, rows[1][0]) && isDeepStrictEqual(failure.terminalFacts, b.deadlineSessions));
  assert(row.status === 'completed' && ['certification-exam-simulation', 'design-interview-simulation'].includes(row.modeId));
  for (const key of ['idSha256', 'modeId', 'startedAt', 'configurationSha256', 'timerKind', 'timerDeadlineAt', 'timerDurationMs']) assert(row[key] === baseline[key]);
  assert(row.result?.totalOccurrences === i.expectedOccurrences && row.result.answeredCount === 0
    && row.result.unansweredCount === i.expectedOccurrences && Date.parse(row.completedAt) >= i.deadlineMs);
  for (const marker of [first, after]) {
    const probe = marker.accountProbe;
    assert(!probe.session && !probe.timer && !probe.pendingJournal);
    assert(!marker.inventory.some(entry => ['active-training-session', 'active-training-session-draft', 'active-foreground-timer', 'journal:active']
      .some(key => entry.key === 'patternly:canonical:v1:' + key)));
  }
  return { verdict: 'PASS', scope: 'Natural deadline and identical terminal result across two cold starts; identity reverified on later ordinary boot',
    runId: i.runId, apkSha256: i.apkSha256, verifiedIdentity: { profileSha256: a.profile.idSha256, accountSha256: a.profile.accountSha256, uidSha256: a.binding.uidSha256 },
    terminalFacts: facts(row), canonicalRevision: row.revision, canonicalEnvelopeDigest: row.digest,
    originalProcess: failure.firstRecoveredProcess, freshProcess: reproof.freshProcess,
    activeSessionTimerJournalAbsent: true, activeDraftAbsent: true,
    identityQualification: { firstColdBinding: 'invalidated', reproofBinding: 'verified', continuousVerifiedBinding: false, manualBindingWrite: false },
    originalFailureRetained: true, clockMutationRepeated: false, finalizationRepeatedByTool: false };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    assert(process.argv.length === 4);
    const config = JSON.parse(readFileSync(resolve(process.argv[2]), 'utf8')), inputs = {}, evidence = [];
    for (const key of ['interruption', 'before', 'cold', 'firstTerminal', 'firstFailure', 'reproofCold', 'reproofTerminal']) {
      const path = resolve(config[key]), bytes = readFileSync(path);
      inputs[key] = JSON.parse(bytes);
      evidence.push({ role: key, path, sha256: createHash('sha256').update(bytes).digest('hex') });
      if (['before', 'firstTerminal', 'reproofTerminal'].includes(key)) {
        assert(basename(path) === 'marker.json' && uuid.test(basename(dirname(path))));
        for (const name of ['artifact-before.json', 'artifact-after.json']) {
          const artifact = JSON.parse(readFileSync(resolve(dirname(path), name), 'utf8'));
          assert(artifact.apkSha256 === inputs.interruption.apkSha256);
        }
      }
    }
    const proof = adjudicateDeadline(inputs);
    writeFileSync(resolve(process.argv[3]), JSON.stringify({ ...proof, evidence }, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ stage: 'deadline_adjudicated', verdict: proof.verdict, continuousVerifiedBinding: false }));
  } catch { console.error(JSON.stringify({ stage: 'deadline_adjudication_refused' })); process.exitCode = 1; }
}
