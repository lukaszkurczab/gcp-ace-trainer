#!/usr/bin/env node
// Historical cold receipts omitted countdownMs. Recover only that constant
// from an exactly unchanged session/configuration, never from wall-clock time.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { lossBounds, preservationChanges } from './androidForegroundClockKillProbe.mjs';

export function adjudicateCountdown(marker, cold, interruption, identity) {
  const before = marker.inventory.filter(item => item.sessionContentSha256);
  const after = cold.inventory.filter(item => item.sessionContentSha256);
  if (marker.timerKind !== 'countdownForeground' || cold.countdownMs !== undefined
    || before.length !== 1 || after.length !== 1 || before[0].key !== after[0].key
    || before[0].sha256 !== after[0].sha256 || before[0].sessionContentSha256 !== after[0].sessionContentSha256
    || cold.snapshotPhase !== 'profile_ready_before_lifecycle' || interruption.stage !== 'process_death_confirmed'
    || interruption.caseId !== marker.preparedCaseId || interruption.runId !== marker.runId
    || identity.originalProcess.pid !== interruption.originalProcess.pid || identity.originalProcess.birth !== interruption.originalProcess.birth
    || interruption.processBeforeKill.pid !== interruption.originalProcess.pid || interruption.processBeforeKill.birth !== interruption.originalProcess.birth
    || (identity.freshProcess.pid === identity.originalProcess.pid && identity.freshProcess.birth === identity.originalProcess.birth)) throw Error('adjudication_scope_rejected');
  const derivedCold = { ...cold, countdownMs: marker.countdownMs };
  const measurement = lossBounds(marker, derivedCold, interruption.times);
  const changes = preservationChanges(marker.inventory, cold.inventory);
  if (changes.some(item => item.category !== 'timer_checkpoint')) throw Error('adjudication_preservation_rejected');
  return { ...measurement, changes, derivedField: { name: 'cold.countdownMs', value: marker.countdownMs,
    basis: 'Same profile/session/configuration/start, exact session envelope and content digest; original cold receipt unchanged.' },
    scope: 'Derived adjudication of an actual production countdown interruption; original harness omitted the constant duration.' };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 3) throw Error('arguments_invalid');
    const root = resolve(process.argv[2]);
    const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
    const result = adjudicateCountdown(read('marker.json'), read('cold.json'), read('interruption.json'), read('cold-identity.json'));
    writeFileSync(resolve(root, 'adjudication.json'), JSON.stringify(result, null, 2), { flag: 'wx', mode: 0o600 });
    console.log(JSON.stringify({ stage: 'derived_adjudication', verdict: result.verdict, lossUpperMs: result.lossUpperMs }));
  } catch { console.error(JSON.stringify({ stage: 'adjudication_refused' })); process.exitCode = 1; }
}
