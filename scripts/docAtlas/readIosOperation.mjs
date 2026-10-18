import { createRequire } from 'node:module';
import { parseOrigin, selectTarget, request } from '../qa/readNativeStartupTrace.mjs';

// Read only initialized owners: no submit, refresh, bootstrap, recovery or raw payload output.
export async function readIosOperation(metroUrl, debuggerOriginUrl, sessionId) {
  const metro = parseOrigin(metroUrl);
  const debuggerOrigin = parseOrigin(debuggerOriginUrl);
  if (metro.port !== debuggerOrigin.port || !/^[a-zA-Z0-9:_-]{1,240}$/u.test(sessionId)) throw Error('arguments_rejected');
  const response = await fetch(new URL('/json/list', metro), { signal: AbortSignal.timeout(5000), redirect: 'error' });
  const body = await response.text();
  if (!response.ok || body.length > 65536) throw Error('discovery_rejected');
  const endpoint = selectTarget(JSON.parse(body), metro, 'com.lkurczab.patternly');
  const WS = createRequire(new URL('../../package.json', import.meta.url))('ws');
  const socket = new WS(endpoint, { origin: debuggerOrigin.origin, handshakeTimeout: 5000, maxPayload: 16384, followRedirects: false });
  try {
    await new Promise((yes, no) => { socket.once('open', yes); socket.once('error', () => no(Error('connect_failed'))); });
    const expression = `(()=>{
      let category="owner_discovery";
      try {
        const modules=Array.from(__r.getModules().entries());
        const load=s=>{const m=modules.filter(([,v])=>v.isInitialized&&v.verboseName?.endsWith(s));if(m.length!==1)throw Error('owner_unavailable');return __r(m[0][0]);};
        category='runtime_check';
        if(typeof __DEV__==='undefined'||!__DEV__||!load('src/infrastructure/runtime/runtimeMode.ts').isPatternlySmokeRuntime())throw Error('runtime_rejected');
        category='lease_read';
        const mmkv=load('src/infrastructure/storage/mmkvClient.ts');
        const lease=mmkv.captureActiveProfileStorageLease();
        if(!lease||!mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('lease_rejected');
        const sid=${JSON.stringify(sessionId)};
        category='operation_projection_read';
        const op=load('src/application/trainingLifecycle/applicationLifecycle.ts').getTrainingOperationProjection(sid);
        category='journal_presence_read';
        const journalPresent=load('src/storage/repositories/mutationJournalRepository.ts').hasPendingMutationJournal();
        category='readers_discovery';
        const admission=load('src/application/tracks/trackAdmissionContext.ts').productionTrackAdmissionContext;
        const sessions=load('src/storage/repositories/trainingSessionRepository.ts');
        const evidence=load('src/storage/repositories/trainingAttemptRepository.ts');
        category='active_session_read';
        const active=sessions.readActiveTrainingSession(admission);
        if(!active||active.id!==sid)throw Error('session_rejected');
        category='attempt_read';
        const attempts=evidence.readTrainingAttempts(admission);
        category='lease_verify';
        const occurrence=active.itemOrder[active.currentItemIndex];
        const sessionAttempts=attempts.value.filter(a=>a.sessionId===sid);
        if(!occurrence||!mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('lease_rejected');
        return JSON.stringify({schema:'patternly.atlas.operation-read.v1',stage:'read_only',kind:op?.kind??null,durableState:op?.error?.durableState??null,allowedAction:op?.error?.allowedAction??null,retrySafety:op?.error?.retrySafety??null,journalPresent,ordinal:active.currentItemIndex+1,materializedCurrentAttempts:sessionAttempts.filter(a=>a.occurrenceId===occurrence.occurrenceId).length,materializedSessionAttempts:sessionAttempts.length});
      } catch { return JSON.stringify({stage:'owner_read_unavailable',category}); }
    })()`;
    const result = await request(socket, 1, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error('read_rejected');
    const value = JSON.parse(result.result?.result?.value ?? 'null');
    if (value?.stage === 'owner_read_unavailable' && ['owner_discovery','runtime_check','lease_read','operation_projection_read','journal_presence_read','readers_discovery','active_session_read','attempt_read','lease_verify'].includes(value.category)) throw Error(`owner_read_unavailable:${value.category}`);
    const keys = ['schema','stage','kind','durableState','allowedAction','retrySafety','journalPresent','ordinal','materializedCurrentAttempts','materializedSessionAttempts'];
    if (!value || value.stage !== 'read_only' || Object.keys(value).length !== keys.length || Object.keys(value).some(key => !keys.includes(key)) || value.schema !== 'patternly.atlas.operation-read.v1' || typeof value.journalPresent !== 'boolean') throw Error('read_rejected');
    for (const key of ['kind','durableState','allowedAction','retrySafety']) if (value[key] !== null && (typeof value[key] !== 'string' || !/^[a-z_]{1,60}$/u.test(value[key]))) throw Error('read_rejected');
    for (const key of ['ordinal','materializedCurrentAttempts','materializedSessionAttempts']) if (!Number.isSafeInteger(value[key]) || value[key] < 0 || value[key] > 100000) throw Error('read_rejected');
    return value;
  } finally { socket.close(); }
}

if (process.argv[1] && new URL(`file://${process.argv[1]}`).href === import.meta.url) {
  const [metro, debuggerOrigin, sessionId, ...extra] = process.argv.slice(2);
  if (extra.length) { console.error('atlas/arguments-rejected'); process.exitCode = 1; }
  else readIosOperation(metro, debuggerOrigin, sessionId).then(value => console.log(JSON.stringify(value, null, 2))).catch(error => { console.error(error?.message?.startsWith('owner_read_unavailable:') ? `atlas/${error.message}` : 'atlas/operation-read-unavailable; verify the one existing iPhone 17 target, smoke runtime and initialized owners'); process.exitCode = 1; });
}
