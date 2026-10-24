import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parseOrigin, selectTarget, request } from './readNativeStartupTrace.mjs';

const prefixes = Object.freeze({ resume: 'patternly:resume:continue:', leave: 'patternly:session:leave:', end: 'patternly:session:abandon:' });
/** Calls an existing enabled React button handler, not a native touch gesture.
 * Only the owner-authorized existing session may be resumed/left/ended. */
export function buildLocalP0ButtonExpression(action, testId, before) {
  const prefix = prefixes[action];
  const active = before?.learning?.sessions?.filter(row => row.status === 'active');
  const hashes = [before?.fingerprint, before?.uidSha256, before?.accountIdSha256, before?.profile?.profileIdSha256, active?.[0]?.idSha256];
  if (!prefix || typeof testId !== 'string' || !testId.startsWith(prefix) || !/^[A-Za-z0-9:_-]+$/u.test(testId.slice(prefix.length)) ||
    !['com.lkurczab.patternly', 'com.lkurczab.patternly.sec03'].includes(before?.appId) || before?.state !== 'authenticated' || before?.profile?.kind !== 'account' ||
    active?.length !== 1 || hashes.some(value => !/^[a-f0-9]{64}$/u.test(value ?? ''))) throw Error('arguments_rejected');
  const expected = { appId: before.appId, fingerprint: before.fingerprint, uid: before.uidSha256, account: before.accountIdSha256, profile: before.profile.profileIdSha256, session: active[0].idSha256 };
  return `(()=>{
    if(!globalThis.HermesInternal||typeof __DEV__==='undefined'||!__DEV__)throw Error('runtime_rejected');
    const expected=${JSON.stringify(expected)},action=${JSON.stringify(action)},testId=${JSON.stringify(testId)};
    const modules=Array.from(__r.getModules().entries());
    const load=path=>{const xs=modules.filter(([,m])=>m.isInitialized&&m.verboseName.endsWith(path));if(xs.length!==1)throw Error('owner_unavailable');return __r(xs[0][0]);};
    const identity=load('src/infrastructure/runtime/environmentIdentity.ts').readEnvironmentIdentity();
    const constants=load('node_modules/expo-constants/build/Constants.js').default;
    if(identity.mode!=='smoke'||identity.apiOrigin!=='http://127.0.0.1:8080'||identity.firebaseProjectId!=='patternly-app-sandbox'||identity.fingerprint!==expected.fingerprint||constants.expoConfig?.extra?.patternlyEnvironmentFingerprint!==expected.fingerprint||constants.expoConfig?.ios?.bundleIdentifier!==expected.appId)throw Error('runtime_rejected');
    const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
    if(hash(testId.slice(${prefix.length}))!==expected.session)throw Error('session_rejected');
    const hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__,actors=[],handlers=new Set();let blocked=false;
    function walk(f){for(let n=f;n;n=n.sibling){const p=n.memoizedProps??{};
      if(p.navigation&&typeof p.navigation.isFocused==='function'&&!p.navigation.isFocused())continue;
      if((n.tag===22&&n.memoizedState!==null)||p.activityState===0||p.mode==='hidden'||p.style?.display==='none')continue;
      const value=p.value;if(value?.state&&typeof value.captureHomeResumeActorFence==='function'&&typeof value.retryAccountSync==='function')actors.push(value);
      if(p.testID===testId){blocked ||= !!p.disabled||!!p.loading||!!p.accessibilityState?.disabled||!!p.accessibilityState?.busy;if(typeof p.onPress==='function')handlers.add(p.onPress);}
      walk(n.child);
    }}
    if(!hook)throw Error('owner_unavailable');for(const id of hook.renderers.keys())for(const root of hook.getFiberRoots(id))walk(root.current);
    if(actors.length!==1)throw Error('actor_rejected');const actor=actors[0],state=actor.state;
    const storage=load('src/infrastructure/storage/mmkvClient.ts'),lease=storage.captureActiveProfileStorageLease(),fence=actor.captureHomeResumeActorFence();
    if(state.kind!=='authenticated'||hash(state.user?.uid??'')!==expected.uid||hash(state.backendUser?.id??'')!==expected.account||!lease||lease.profile.kind!=='account'||hash(lease.profile.id)!==expected.profile||hash(lease.profile.accountId??'')!==expected.account||!storage.isActiveProfileStorageLeaseCurrent(lease)||!fence?.isCurrent())throw Error('actor_rejected');
    if(blocked||handlers.size!==1)throw Error('button_rejected');
    const key=Symbol.for('patternly.local-p0-buttons.v1');const invoked=globalThis[key]??(globalThis[key]=new Set());const command=expected.profile+':'+expected.session+':'+action;
    if(invoked.has(command))throw Error('already_invoked');invoked.add(command);
    // Keep the one-shot marker even if the callback throws or the transport closes.
    try{handlers.values().next().value();}catch{throw Error('callback_failed');}
    return JSON.stringify({schema:'patternly.local-p0-button.v1',action,stage:'invoked',nativeGesture:false});
  })()`;
}

export async function pressLocalP0IosButton(originValue, action, testId, before) {
  const expression = buildLocalP0ButtonExpression(action, testId, before);
  const origin = parseOrigin(originValue);
  const response = await fetch(new URL('/json/list', origin), { signal: AbortSignal.timeout(5000), redirect: 'error' });
  if (!response.ok) throw Error('discovery_failed');
  const endpoint = selectTarget(await response.json(), origin, before.appId);
  const require = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url));
  const WebSocket = require('ws');
  const socket = new WebSocket(endpoint, { origin: `http://127.0.0.1:${origin.port}`, handshakeTimeout: 5000, followRedirects: false, maxPayload: 64 * 1024 });
  try {
    await new Promise((accept, reject) => { socket.once('open', accept); socket.once('error', () => reject(Error('connect_failed'))); });
    const result = await request(socket, 1, 'Runtime.evaluate', { expression, returnByValue: true, silent: true });
    if (result.error) throw Error('invocation_unknown');
    const failure = result.result?.exceptionDetails;
    if (failure) {
      const description = failure.exception?.description ?? failure.text ?? '';
      const category = ['runtime_rejected','owner_unavailable','session_rejected','actor_rejected','button_rejected','already_invoked','callback_failed'].find(value => description.includes(value));
      throw Error(category ?? 'invocation_unknown');
    }
    return JSON.parse(result.result?.result?.value ?? 'null');
  } finally { socket.terminate(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [origin, action, testId, receiptPath, ...extra] = process.argv.slice(2);
  const allowed = new Set(['arguments_rejected','origin_rejected','target_rejected','discovery_failed','connect_failed','read_timeout','transport_closed','runtime_rejected','owner_unavailable','session_rejected','actor_rejected','button_rejected','already_invoked','callback_failed','invocation_unknown']);
  Promise.resolve().then(() => { if (extra.length || !receiptPath) throw Error('arguments_rejected'); return pressLocalP0IosButton(origin, action, testId, JSON.parse(readFileSync(receiptPath, 'utf8'))); })
    .then(value => console.log(JSON.stringify(value)))
    .catch(error => { console.error(JSON.stringify({stage:'local_p0_button',category:allowed.has(error.message)?error.message:'arguments_rejected'}));process.exitCode=1; });
}
