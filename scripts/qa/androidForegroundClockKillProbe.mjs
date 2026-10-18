#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const APP = 'com.lkurczab.patternly';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

export function lossBounds(marker, cold, times) {
  if (marker.stage !== 'stall_started' || cold.stage !== 'cold_before_sync'
    || marker.runId !== cold.runId || marker.profileSha256 !== cold.profileSha256 || marker.sessionSha256 !== cold.sessionSha256
    || marker.configurationSha256 !== cold.configurationSha256 || marker.startedAt !== cold.startedAt
    || marker.timerKind !== cold.timerKind
    || !Number.isSafeInteger(marker.elapsedMs) || !Number.isSafeInteger(cold.durableElapsedMs)
    || cold.durableElapsedMs < marker.durableElapsedMs) throw Error('measurement_scope_rejected');
  const { sendAt, markerAt, killAt, deathAt, background } = times;
  if (![sendAt, markerAt, killAt, deathAt].every(Number.isFinite) || !(sendAt <= markerAt && markerAt < killAt && killAt <= deathAt)) throw Error('measurement_order_rejected');
  // Elapsed was sampled somewhere between command send and marker readback.
  // Include 1ms flooring. Bounds include readback/kill transport uncertainty.
  let backgroundMin = 0, backgroundMax = 0;
  if (background) {
    const { exitSendAt, backgroundConfirmedAt, foregroundSendAt, foregroundConfirmedAt } = background;
    if (![exitSendAt, backgroundConfirmedAt, foregroundSendAt, foregroundConfirmedAt].every(Number.isFinite)
      || !(markerAt <= exitSendAt && exitSendAt <= backgroundConfirmedAt && backgroundConfirmedAt <= foregroundSendAt
        && foregroundSendAt <= foregroundConfirmedAt && foregroundConfirmedAt <= killAt)) throw Error('measurement_order_rejected');
    backgroundMin = foregroundSendAt - backgroundConfirmedAt;
    backgroundMax = foregroundConfirmedAt - exitSendAt;
  }
  const countdown = marker.timerKind === 'countdownForeground';
  if (countdown && (!Number.isSafeInteger(marker.countdownMs) || marker.countdownMs <= 0 || marker.countdownMs !== cold.countdownMs)) throw Error('measurement_scope_rejected');
  const expected = delta => countdown ? Math.max(marker.elapsedMs, Math.min(marker.countdownMs, marker.elapsedMs + delta)) : marker.elapsedMs + delta;
  const lower = expected(Math.max(0, killAt - markerAt - backgroundMax));
  const upper = expected(1 + Math.max(0, deathAt - sendAt - backgroundMin));
  const expired = countdown && cold.durableElapsedMs >= marker.countdownMs;
  if ((!marker.running && !(countdown && marker.elapsedMs >= marker.countdownMs)) || cold.running !== !expired) throw Error('measurement_scope_rejected');
  if (marker.elapsedMs < marker.durableElapsedMs || cold.durableElapsedMs > upper) throw Error('measurement_scope_rejected');
  return { lossLowerMs: Math.max(0, lower - cold.durableElapsedMs), lossUpperMs: Math.max(0, upper - cold.durableElapsedMs),
    uncertaintyMs: upper - lower, recoveredElapsedMs: cold.durableElapsedMs,
    backgroundMinMs: backgroundMin, backgroundMaxMs: backgroundMax,
    verdict: lower - cold.durableElapsedMs > 5_000 ? 'FAIL' : upper - cold.durableElapsedMs <= 5_000 ? 'PASS' : 'INCONCLUSIVE' };
}

export function preservationChanges(before, after) {
  const left = new Map(before.map(entry => [entry.key, entry]));
  const right = new Map(after.map(entry => [entry.key, entry]));
  return [...new Set([...left.keys(), ...right.keys()])].filter(key => left.get(key)?.sha256 !== right.get(key)?.sha256).map(key => {
    const a = left.get(key), b = right.get(key);
    const category = a && b && key === 'patternly:canonical:v1:active-foreground-timer' ? 'timer_checkpoint'
      : a?.sessionContentSha256 && a.sessionContentSha256 === b?.sessionContentSha256 ? 'session_elapsed_only'
      : /^patternly:premium-cache:v[12]$/u.test(key) ? 'premium_cache_requires_review' : 'unexplained_change';
    return { key, category };
  });
}

async function main(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 2) {
    if (!['--adb', '--run-id', '--output', '--mode', '--subject', '--kill-delay-ms', '--background-ms'].includes(args[index]) || !args[index + 1]) throw Error('arguments_invalid');
    options[args[index]] = args[index + 1];
  }
  const runId = options['--run-id'];
  const commands = ['inventory', 'snapshot', 'stall-kill', 'fixture-seed-elapsed', 'fixture-seed-countdown', 'fixture-seed-cap', 'fixture-seed-overrun', 'fixture-enter', 'fixture-pause', 'fixture-conflict', 'fixture-cleanup'];
  const fixture = options['--subject'] === 'fixture' || options['--mode']?.startsWith('fixture-');
  const killDelayMs = Number(options['--kill-delay-ms'] ?? 6500);
  const backgroundMs = Number(options['--background-ms'] ?? 0);
  if (!UUID.test(runId ?? '') || !options['--output'] || !commands.includes(options['--mode'])
    || !['production', 'fixture'].includes(options['--subject'] ?? 'production')
    || !Number.isInteger(killDelayMs) || killDelayMs < 0 || killDelayMs > 8000
    || !Number.isInteger(backgroundMs) || backgroundMs < 0 || backgroundMs > 4000
    || (backgroundMs > 0 && killDelayMs < backgroundMs + 1000)) throw Error('arguments_invalid');
  const adb = options['--adb'] ?? 'adb';
  const call = (args, allowFailure = false) => {
    const r = spawnSync(adb, args, { encoding: 'utf8', timeout: 10_000, maxBuffer: 8 * 1024 * 1024 });
    if (!allowFailure && (r.error || r.status !== 0)) throw Error('adb_operation_failed');
    return r;
  };
  const devices = call(['devices']).stdout.split('\n').map(line => line.match(/^(\S+)\s+device\s*$/u)?.[1]).filter(Boolean);
  if (devices.length !== 1) throw Error('single_device_required');
  const shell = (args, allowFailure = false) => call(['-s', devices[0], 'shell', ...args], allowFailure);
  if (shell(['run-as', APP, 'id'], true).status !== 0) throw Error('instrumented_apk_required');
  const processIdentity = () => {
    const pid = shell(['pidof', APP]).stdout.trim();
    if (!/^\d+$/u.test(pid)) throw Error('process_identity_rejected');
    const name = shell(['run-as', APP, 'cat', `/proc/${pid}/cmdline`]).stdout.replace(/\0/gu, '').trim();
    const stat = shell(['run-as', APP, 'cat', `/proc/${pid}/stat`]).stdout;
    const birth = stat.slice(stat.lastIndexOf(')') + 2).trim().split(/\s+/u)[19];
    if (name !== APP || !/^\d+$/u.test(birth ?? '')) throw Error('process_identity_rejected');
    return { pid, birth };
  };
  const originalProcess = processIdentity();
  const caseId = randomUUID();
  const output = resolve(options['--output'], caseId);
  mkdirSync(output, { recursive: true, mode: 0o700 });
  const save = (name, data) => writeFileSync(resolve(output, name), JSON.stringify(data, null, 2), { mode: 0o600 });
  const relative = `files/android-clock-probe-${runId}`;
  const read = name => {
    const r = shell(['run-as', APP, 'cat', `${relative}/${name}`], true);
    if (r.status !== 0) return null;
    try { const value = JSON.parse(r.stdout); return value.runId === runId ? value : null; } catch { return null; }
  };
  const poll = async (name, milliseconds) => {
    const until = performance.now() + milliseconds;
    do { const value = read(name); if (value) return value; await delay(50); } while (performance.now() < until);
    throw Error('receipt_timeout');
  };
  const stopAndConfirm = async () => {
    shell(['cmd', 'activity', 'stop-app', '--user', 'current', APP]);
    const until = performance.now() + 2_000;
    while (shell(['pidof', APP], true).stdout.trim()) {
      if (performance.now() > until) throw Error('process_death_unconfirmed');
      await delay(25);
    }
    return performance.now();
  };
  const stall = options['--mode'] === 'stall-kill';
  const action = stall ? (fixture ? 'fixture-stall' : 'stall') : options['--mode'] === 'snapshot' ? (fixture ? 'fixture-snapshot' : 'snapshot') : options['--mode'];
  const coldFile = fixture ? 'fixture-cold.json' : 'cold.json';
  // Only this run's non-authoritative receipt is removed, never application data.
  if (stall) shell(['run-as', APP, 'rm', '-f', `${relative}/${coldFile}`]);
  const sendAt = performance.now();
  shell(['am', 'start', '-a', 'android.intent.action.VIEW', '-d', `com.lkurczab.patternly://android-clock-probe/${runId}/${caseId}/${action}`, '-n', `${APP}/.MainActivity`]);
  const marker = await poll(`${caseId}.json`, 10_000);
  const markerAt = performance.now();
  save('marker.json', marker);
  if (marker.stage !== (stall ? 'stall_started' : 'snapshot')) throw Error(marker.stage === 'pre_effect_refused' ? 'pre_effect_refused' : 'effect_unconfirmed');
  if (!stall) {
    if (options['--mode'] === 'fixture-cleanup') {
      const current = processIdentity();
      if (!marker.cleanupPendingColdRestart || current.pid !== originalProcess.pid || current.birth !== originalProcess.birth) throw Error('stall_or_identity_rejected');
      const deathAt = await stopAndConfirm();
      save('cleanup-interruption.json', { caseId, runId, stage: 'process_death_confirmed', originalProcess, deathAt });
      shell(['am', 'start', '-n', `${APP}/.MainActivity`]);
      const cleaned = await poll(`fixture-cleanup-${caseId}.json`, 45_000);
      const fresh = processIdentity();
      if (cleaned.stage !== 'fixture_cleanup_verified' || cleaned.caseId !== caseId || cleaned.cleanupVerified !== true
        || (fresh.pid === originalProcess.pid && fresh.birth === originalProcess.birth)) throw Error('effect_unconfirmed');
      save('cleanup-cold.json', cleaned);
      console.log(JSON.stringify({ caseId, output, stage: 'cleanup_verified_after_cold_restart' })); return;
    }
    console.log(JSON.stringify({ caseId, output, stage: 'snapshot_collected' })); return;
  }
  const resumed = () => shell(['dumpsys', 'activity', 'activities']).stdout.split('\n').some(line => (line.includes('topResumedActivity=') || line.includes('mResumedActivity:')) && line.includes(`${APP}/.MainActivity`));
  if (!resumed()) throw Error('stall_or_identity_rejected');
  let background;
  if (backgroundMs) {
    await delay(300);
    const exitSendAt = performance.now();
    shell(['input', 'keyevent', 'KEYCODE_HOME']);
    if (resumed()) throw Error('lifecycle_unconfirmed');
    const backgroundConfirmedAt = performance.now();
    await delay(backgroundMs);
    const foregroundSendAt = performance.now();
    shell(['am', 'start', '-n', `${APP}/.MainActivity`]);
    if (!resumed()) throw Error('lifecycle_unconfirmed');
    const foregroundConfirmedAt = performance.now();
    background = { exitSendAt, backgroundConfirmedAt, foregroundSendAt, foregroundConfirmedAt };
  }
  await delay(Math.max(0, killDelayMs - (performance.now() - markerAt)));
  const currentProcess = processIdentity();
  if (currentProcess.pid !== originalProcess.pid || currentProcess.birth !== originalProcess.birth
    || read(coldFile) !== null || read(`${caseId}.json`)?.stage !== 'stall_started' || !resumed()) throw Error('stall_or_identity_rejected');
  const killAt = performance.now();
  const deathAt = await stopAndConfirm();
  const times = { sendAt, markerAt, killAt, deathAt, background };
  save('interruption.json', { caseId, runId, times, stage: 'process_death_confirmed' });
  shell(['am', 'start', '-n', `${APP}/.MainActivity`]);
  // Normal navigation may be required to restore the paused session. Leave the
  // owned app running; no automatic retry, session creation or data cleanup.
  const cold = await poll(coldFile, 45_000);
  save('cold.json', cold);
  const result = lossBounds(marker, cold, times);
  const changes = preservationChanges(marker.inventory, cold.inventory);
  const preservationVerdict = changes.some(change => change.category.endsWith('requires_review') || change.category === 'unexplained_change')
    ? 'REQUIRES_CATEGORY_REVIEW' : 'USER_CONTENT_EQUAL';
  save('result.json', { caseId, runId, ...result, changes, preservationVerdict });
  console.log(JSON.stringify({ caseId, output, ...result, changedKeyCount: changes.length, preservationVerdict }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => {
    const known = new Set(['arguments_invalid', 'adb_operation_failed', 'single_device_required', 'instrumented_apk_required', 'receipt_timeout', 'pre_effect_refused', 'effect_unconfirmed', 'lifecycle_unconfirmed', 'process_identity_rejected', 'stall_or_identity_rejected', 'process_death_unconfirmed', 'measurement_scope_rejected', 'measurement_order_rejected']);
    console.error(JSON.stringify({ stage: 'probe_failed', category: known.has(error.message) ? error.message : 'probe_failed' }));
    process.exitCode = 1;
  });
}
