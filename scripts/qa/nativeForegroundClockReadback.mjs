import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseOrigin, selectTarget, request } from './readNativeStartupTrace.mjs';

// The repository grants the original encrypted handle. No facade initialize,
// enter, checkpoint, pause, raw mutation, store opening or profile transition.
export const READ_EXPRESSION = `(()=>{
  try {
    const mods=Array.from(__r.getModules().entries());
    const load=(suffix)=>{
      const matches=mods.filter(([,module])=>module.isInitialized===true&&module.verboseName?.endsWith(suffix));
      if(matches.length!==1)throw Error('owner_unavailable');
      return __r(matches[0][0]);
    };
    const admission=load('src/application/tracks/trackAdmissionContext.ts').productionLearningDataAdmissionContext.trackAdmission;
    const storage=load('src/infrastructure/storage/mmkvClient.ts');
    const repo=load('src/storage/repositories/foregroundTimerRepository.ts');
    const session=load('src/storage/repositories/trainingSessionRepository.ts').readActiveTrainingSession(admission);
    const before=repo.readActiveForegroundTimer(admission);
    if(!session||!before||before.accumulatedForegroundMs!==session.activeForegroundMs)return {stage:'refused',category:'timer_session_not_equal'};
    const port=repo.bindActiveForegroundTimerClock(session,admission);
    const after=port.readState();
    return {stage:'bound_read_only',authority:storage.getForegroundTimerStorageAuthority(),
      unchanged:JSON.stringify(before)===JSON.stringify(after),
      elapsedMatches:port.elapsed()===before.accumulatedForegroundMs,
      metrics:storage.getActiveForegroundClock().metrics()};
  } catch {
    return {stage:'failed',category:'native_binding_probe_failed'};
  }
})()`;

export function validateReadback(value) {
  if (!value || Object.keys(value).sort().join(',') !== 'authority,elapsedMatches,metrics,stage,unchanged'
    || value.stage !== 'bound_read_only' || value.authority !== 'ios-native'
    || value.unchanged !== true || value.elapsedMatches !== true) throw Error('native_binding_rejected');
  const metrics = value.metrics;
  if (!metrics || Object.keys(metrics).sort().join(',') !== 'checkpointCount,maxOutstandingMs,maxWriteMs'
    || Object.values(metrics).some((entry) => entry !== 0)) throw Error('native_binding_rejected');
  return value;
}

export async function evaluateNativeForegroundClock(metroUrl, expression) {
  const origin = parseOrigin(metroUrl);
  const response = await fetch(new URL('/json/list', origin), { signal: AbortSignal.timeout(5_000), redirect: 'error' });
  if (!response.ok) throw Error('discovery_failed');
  const body = await response.text();
  if (body.length > 64 * 1024) throw Error('target_rejected');
  const endpoint = selectTarget(JSON.parse(body), origin);
  const WebSocket = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url))('ws');
  const socket = new WebSocket(endpoint, { origin: origin.origin, handshakeTimeout: 5_000, maxPayload: 128 * 1024, followRedirects: false });
  try {
    await new Promise((accept, reject) => {
      socket.once('open', accept);
      socket.once('error', () => reject(Error('connect_failed')));
    });
    const result = await request(socket, 1, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error('native_binding_rejected');
    return result.result?.result?.value;
  } finally { socket.terminate(); }
}

export async function readNativeForegroundClock(metroUrl) {
  return validateReadback(await evaluateNativeForegroundClock(metroUrl, READ_EXPRESSION));
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [origin, ...extra] = process.argv.slice(2);
  if (!origin || extra.length) {
    console.error(JSON.stringify({ stage: 'error', category: 'arguments_rejected' })); process.exitCode = 1;
  } else {
    readNativeForegroundClock(origin).then((value) => console.log(JSON.stringify(value))).catch(() => {
      console.error(JSON.stringify({ stage: 'error', category: 'native_binding_probe_failed' })); process.exitCode = 1;
    });
  }
}
