import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { performance } from 'node:perf_hooks';
import { setTimeout as delay } from 'node:timers/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOrigin, selectTarget } from './readNativeStartupTrace.mjs';
import { validateIdentity, readNativeForegroundClockColdReceipt } from './nativeForegroundClockColdReadback.mjs';

const DEVICE = '7F315654-3175-4F3C-BB24-B0263F59360C';
const APP = 'com.lkurczab.patternly';
const ORIGIN = 'http://127.0.0.1:8082';
const STALL_MS = 12_000;
const KILL_DELAY_MS = 5_500;

export function validateMarker(value, initial) {
  if (!value || Object.keys(value).sort().join(',') !== 'baselineElapsedMs,enterCheckpointCount,enterCheckpointRevision,preCheckpointRevision,preElapsedMs'
    || !Object.values(value).every(Number.isSafeInteger)
    || value.preElapsedMs !== initial.durableElapsedMs || value.preCheckpointRevision !== initial.checkpointRevision
    || value.baselineElapsedMs < value.preElapsedMs || value.enterCheckpointRevision !== value.preCheckpointRevision + 1
    || value.enterCheckpointCount !== 1) throw Error('marker_rejected');
  return value;
}
export function lossBounds(measurement, recovered) {
  const { sendAtMs, markerAtMs, killAtMs, deathAtMs, marker } = measurement;
  if (![sendAtMs, markerAtMs, killAtMs, deathAtMs].every(Number.isFinite)
    || !(sendAtMs <= markerAtMs && markerAtMs < killAtMs && killAtMs <= deathAtMs)
    || recovered.running !== true || recovered.checkpointRevision <= marker.enterCheckpointRevision) throw Error('recovery_measurement_rejected');
  const expectedLowerMs = marker.baselineElapsedMs + killAtMs - markerAtMs;
  // Native elapsed is floored to integer milliseconds: include its <1ms quantization.
  const expectedUpperMs = marker.baselineElapsedMs + 1 + deathAtMs - sendAtMs;
  if (expectedUpperMs - expectedLowerMs > 5_000) throw Error('measurement_inconclusive');
  if (recovered.durableElapsedMs < marker.baselineElapsedMs || recovered.durableElapsedMs > expectedUpperMs
    || recovered.sessionElapsedMs !== marker.preElapsedMs) throw Error('recovery_measurement_rejected');
  return { expectedLowerMs, expectedUpperMs, recoveredElapsedMs: recovered.durableElapsedMs,
    lossLowerMs: Math.max(0, expectedLowerMs - recovered.durableElapsedMs),
    lossUpperMs: Math.max(0, expectedUpperMs - recovered.durableElapsedMs),
    uncertaintyMs: expectedUpperMs - expectedLowerMs,
    periodicCheckpointCount: recovered.checkpointRevision - marker.enterCheckpointRevision };
}
export function isPreEffectRefusal(message) {
  if (!message || typeof message !== 'object') return false;
  const value = message.result?.result?.value;
  return !message.error && !message.result?.exceptionDetails && value !== null && typeof value === 'object'
    && Object.keys(value).sort().join(',') === 'category,stage'
    && value.stage === 'pre_effect_refused' && value.category === 'native_clock_preflight_rejected';
}
export function isStoppedCompletion(message) {
  if (!message || typeof message !== 'object') return false;
  const value = message.result?.result?.value;
  return !message.error && !message.result?.exceptionDetails && value !== null && typeof value === 'object'
    && Object.keys(value).sort().join(',') === 'clockStopped,stage'
    && value.stage === 'stall_completed_before_kill' && value.clockStopped === true;
}
export function needsCleanupKill(sent, killIssued, knownPreEffectRefusal, knownStoppedCompletion = false) {
  return sent && !killIssued && !knownPreEffectRefusal && !knownStoppedCompletion;
}
function executableForDevice() {
  const appPath = execFileSync('xcrun', ['simctl', 'get_app_container', DEVICE, APP, 'app'], { encoding: 'utf8' }).trim();
  return join(appPath, 'Patternly');
}
export function assertOwned(pid, binarySha256) {
  const expected = executableForDevice();
  const actual = execFileSync('ps', ['-p', String(pid), '-o', 'comm='], { encoding: 'utf8' }).trim();
  if (actual !== expected || createHash('sha256').update(readFileSync(expected)).digest('hex') !== binarySha256) throw Error('process_ownership_rejected');
}
function alive(pid) {
  try { process.kill(pid, 0); return true; } catch (error) { if (error.code === 'ESRCH') return false; throw Error('process_death_unconfirmed'); }
}
export async function killOwnedAndConfirm(pid,binarySha256) {
  if(!Number.isSafeInteger(pid)||pid<=1||!/^[a-f0-9]{64}$/u.test(binarySha256))throw Error('arguments_rejected');
  if(!alive(pid))return;
  assertOwned(pid,binarySha256);
  process.kill(pid,'SIGKILL');
  const deadline=performance.now()+2_000;
  while(alive(pid)&&performance.now()<deadline)await delay(25);
  if(alive(pid))throw Error('process_death_unconfirmed');
}
function expressionFor(runId, profileHash, sessionHash, initial) {
  return `(()=>{
    let port,before,clock;
    try {
    const modules=Array.from(__r.getModules().entries());
    const load=(suffix)=>{const matches=modules.filter(([,module])=>module.isInitialized===true&&module.verboseName?.endsWith(suffix));if(matches.length!==1)throw Error('owner_unavailable');return __r(matches[0][0]);};
    if(typeof __DEV__==='undefined'||!__DEV__||!load('src/infrastructure/runtime/runtimeMode.ts').isPatternlySmokeRuntime())throw Error('runtime_rejected');
    const storage=load('src/infrastructure/storage/mmkvClient.ts');
    const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
    const lease=storage.captureActiveProfileStorageLease();
    if(!lease||lease.profile.kind!=='guest'||!storage.isActiveProfileStorageLeaseCurrent(lease)||hash(lease.profile.id)!==${JSON.stringify(profileHash)}||storage.getForegroundTimerStorageAuthority()!=='ios-native')throw Error('guest_rejected');
    const admission=load('src/application/tracks/trackAdmissionContext.ts').productionLearningDataAdmissionContext.trackAdmission;
    const session=load('src/storage/repositories/trainingSessionRepository.ts').readActiveTrainingSession(admission);
    const repo=load('src/storage/repositories/foregroundTimerRepository.ts');
    before=repo.readActiveForegroundTimer(admission);
    if(!session||hash(session.id)!==${JSON.stringify(sessionHash)}||session.configurationSnapshot.timer!=='elapsedForeground'||!before
      ||before.accumulatedForegroundMs!==${initial.durableElapsedMs}||session.activeForegroundMs!==before.accumulatedForegroundMs||before.checkpointRevision!==${initial.checkpointRevision})throw Error('baseline_rejected');
    clock=storage.getActiveForegroundClock();
    if(clock.metrics().checkpointCount!==0)throw Error('clock_already_used');
    port=repo.bindActiveForegroundTimerClock(session,admission);
    } catch { return {stage:'pre_effect_refused',category:'native_clock_preflight_rejected'}; }
    const entered=port.enter();
    const baselineElapsedMs=port.elapsed();
    const marker={baselineElapsedMs,preElapsedMs:before.accumulatedForegroundMs,preCheckpointRevision:before.checkpointRevision,enterCheckpointRevision:entered.checkpointRevision,enterCheckpointCount:clock.metrics().checkpointCount};
    console.info(${JSON.stringify(`patternly.persist11.kill.${runId}`)},JSON.stringify(marker));
    const start=performance.now();const wallStart=Date.now();let iterations=0;
    while(performance.now()-start<${STALL_MS}&&Date.now()-wallStart<20000&&iterations<100000000)iterations++;
    // This path invalidates the measurement. Stop the authorized clock after
    // the bounded stall so a delayed host cannot leave it running on Home.
    const stopped=port.pause();
    return {stage:'stall_completed_before_kill',clockStopped:stopped.running===false};
  })()`;
}
export async function runKillProbe({ pid, binarySha256, runId, profileHash, sessionHash }) {
  validateIdentity(runId, profileHash, sessionHash);
  if (!Number.isSafeInteger(pid) || pid <= 1 || !/^[a-f0-9]{64}$/u.test(binarySha256)) throw Error('arguments_rejected');
  assertOwned(pid, binarySha256);
  const initial = await readNativeForegroundClockColdReceipt(ORIGIN, runId, profileHash, sessionHash);
  if (initial.durableElapsedMs !== initial.sessionElapsedMs) throw Error('initial_reconciliation_rejected');
  return runOwnedClockInterruption({ pid, binarySha256, runId, initial,
    expression: expressionFor(runId, profileHash, sessionHash, initial), validate: validateMarker });
}
// Shared host transport/ownership/timing only. Callers keep their own closed
// preflight expression and receipt contract; the fixture has no session S.
export async function runOwnedClockInterruption({ pid, binarySha256, runId, initial, expression, validate, killDelayMs = KILL_DELAY_MS }) {
  if (!Number.isSafeInteger(pid) || pid <= 1 || !/^[a-f0-9]{64}$/u.test(binarySha256)
    || !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u.test(runId)
    || !Number.isInteger(killDelayMs) || killDelayMs < 0 || killDelayMs > 10_000) throw Error('arguments_rejected');
  assertOwned(pid, binarySha256);
  const origin = parseOrigin(ORIGIN);
  const response = await fetch(new URL('/json/list', origin), { signal: AbortSignal.timeout(5_000), redirect: 'error' });
  if (!response.ok) throw Error('discovery_failed');
  const body = await response.text(); if (body.length > 64 * 1024) throw Error('target_rejected');
  const endpoint = selectTarget(JSON.parse(body), origin);
  const WebSocket = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url))('ws');
  const socket = new WebSocket(endpoint, { origin: origin.origin, handshakeTimeout: 5_000, maxPayload: 128 * 1024, followRedirects: false });
  let sent = false;
  let killIssued = false;
  let evaluationCompleted = false;
  let protocolInvalid = false;
  let knownPreEffectRefusal = false;
  let knownStoppedCompletion = false;
  let sendAtMs;
  let markerAtMs;
  let killAtMs;
  let deathAtMs;
  let marker;
  try {
    await new Promise((accept, reject) => { socket.once('open', accept); socket.once('error', () => reject(Error('connect_failed'))); });
    const { request } = await import('./readNativeStartupTrace.mjs');
    await request(socket, 1, 'Runtime.enable');
    const markerPromise = new Promise((accept, reject) => {
      const timer = setTimeout(() => reject(Error('marker_timeout')), 5_000);
      socket.on('message', (bytes) => {
        let message; try { message = JSON.parse(bytes.toString()); } catch { return; }
        if (!message || typeof message !== 'object') return;
        if (message.id === 2) { evaluationCompleted = true; knownPreEffectRefusal = isPreEffectRefusal(message); knownStoppedCompletion = isStoppedCompletion(message); clearTimeout(timer); reject(Error(knownPreEffectRefusal ? 'pre_effect_refused' : 'evaluation_completed_before_death')); }
        if (message.method !== 'Runtime.consoleAPICalled' || message.params?.args?.[0]?.value !== `patternly.persist11.kill.${runId}`) return;
        if (marker) { protocolInvalid = true; clearTimeout(timer); reject(Error('duplicate_marker')); return; }
        try {
          marker = validate(JSON.parse(message.params?.args?.[1]?.value ?? 'null'), initial);
          markerAtMs = performance.now(); clearTimeout(timer); accept();
        } catch { clearTimeout(timer); reject(Error('marker_rejected')); }
      });
    });
    assertOwned(pid, binarySha256);
    sendAtMs = performance.now(); sent = true;
    socket.send(JSON.stringify({ id: 2, method: 'Runtime.evaluate', params: { expression, returnByValue: true, silent: false } }));
    await markerPromise;
    await delay(Math.max(0, markerAtMs + killDelayMs - performance.now()));
    if (evaluationCompleted || protocolInvalid) throw Error('evaluation_completed_before_death');
    assertOwned(pid, binarySha256);
    killAtMs = performance.now(); killIssued = true; process.kill(pid, 'SIGKILL');
    const deadline = performance.now() + 2_000;
    while (alive(pid) && performance.now() < deadline) await delay(25);
    if (alive(pid)) throw Error('process_death_unconfirmed');
    deathAtMs = performance.now();
    if (evaluationCompleted || protocolInvalid) throw Error('evaluation_completed_before_death');
    return { stage: 'killed_during_js_stall', pid, runId, initial, marker, sendAtMs, markerAtMs, killAtMs, deathAtMs,
      requestedStallMs: STALL_MS, requestedKillDelayMs: killDelayMs };
  } finally {
    socket.terminate();
    // Bound an uncertain enter effect. Never repeat SIGKILL or signal a changed
    // executable/PID. Failure remains a failed run, not timing evidence.
    if (needsCleanupKill(sent, killIssued, knownPreEffectRefusal, knownStoppedCompletion) && alive(pid)) { assertOwned(pid, binarySha256); process.kill(pid, 'SIGKILL'); }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [pid, binarySha256, runId, profileHash, sessionHash, authorization, ...extra] = process.argv.slice(2);
  if (authorization !== '--owner-authorized' || extra.length) {
    console.error(JSON.stringify({ stage: 'error', category: 'arguments_rejected' })); process.exitCode = 1;
  } else {
    runKillProbe({ pid: Number(pid), binarySha256, runId, profileHash, sessionHash }).then(value => console.log(JSON.stringify(value))).catch(() => {
      console.error(JSON.stringify({ stage: 'error', category: 'native_kill_probe_failed' })); process.exitCode = 1;
    });
  }
}
