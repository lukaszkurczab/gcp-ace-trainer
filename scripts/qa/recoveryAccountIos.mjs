import { createRequire } from 'node:module';
import { readFile, lstat, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { parseOrigin, request, selectTarget } from './readNativeStartupTrace.mjs';

// Bounded development-only commands for the retained local recovery fixture.
// Run commands sequentially. Faults affect only this JS process and vanish on kill.
const [action, originValue, fingerprint, inputPath, outputPath, ...extra] = process.argv.slice(2);
const fixtureActions = ['prepare-deletion', 'delete-detached', 'retry-deletion-detached', 'seed-deletion-learning', 'hold-deletion', 'hold-deletion-proof', 'fail-deletion-cleanup'];
const actions = new Set(['inspect', 'inspect-inventory', 'probe-fault-ports', 'sign-in', 'sign-in-detached', 'account-sign-out', 'reauthenticate', 'issue', 'retry', 'saved', 'local-sign-out', 'consume', 'export-codes', 'lose-issue-response', 'lose-issue-ack-response', 'lose-consume-response', 'hold-consume-ack', 'hold-revoke', 'hold-revoke-completion', 'lose-revoke-response', 'restore-fetch', 'restart-auth-owner', 'retry-detached', ...fixtureActions]);
const safeCategories = new Set(['arguments_rejected', 'runtime_rejected', 'environment_identity_rejected', 'firebase_emulator_rejected', 'owner_unavailable', 'actor_unavailable', 'state_rejected', 'input_rejected', 'evaluation_rejected', 'read_timeout', 'operation_failed']);
try {
  if (extra.length || !actions.has(action) || !/^[a-f0-9]{64}$/u.test(fingerprint ?? '')) throw Error('arguments_rejected');
  const origin = parseOrigin(originValue);
  let input = null;
  if (['sign-in', 'sign-in-detached', 'reauthenticate', 'issue', 'consume', ...fixtureActions].includes(action)) {
    const info = await lstat(inputPath);
    if (!info.isFile() || (info.mode & 0o077) !== 0) throw Error('input_rejected');
    const value = JSON.parse(await readFile(inputPath, 'utf8'));
    if (fixtureActions.includes(action)) {
      if (value.fixtureOnly !== true || !/^[a-f0-9]{64}$/u.test(value.accountIdSha256 ?? '') || !/^[a-f0-9]{64}$/u.test(value.uidSha256 ?? '')) throw Error('input_rejected');
      if (action === 'prepare-deletion' && (typeof value.password !== 'string' || !value.password)) throw Error('input_rejected');
      input = { accountIdSha256: value.accountIdSha256, uidSha256: value.uidSha256, password: action === 'prepare-deletion' ? value.password : null };
    } else if (action === 'consume') {
      if (!Array.isArray(value.codes) || !/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u.test(value.codes[0])) throw Error('input_rejected');
      input = { code: value.codes[0] };
    } else {
      if (typeof value.password !== 'string' || !value.password || typeof value.email !== 'string') throw Error('input_rejected');
      input = { password: value.password, email: value.email };
    }
  }
  if (action === 'export-codes' && !outputPath) throw Error('arguments_rejected');
  const expression = `(async()=>{
    if(!globalThis.HermesInternal||typeof __DEV__==='undefined'||!__DEV__)throw Error('runtime_rejected');
    const entries=Array.from(__r.getModules().entries());
    const load=p=>{const xs=entries.filter(([,m])=>m.isInitialized&&m.verboseName.endsWith(p));if(xs.length!==1)throw Error('owner_unavailable');return __r(xs[0][0]);};
    const identity=load('src/infrastructure/runtime/environmentIdentity.ts').readEnvironmentIdentity();
    const constants=load('node_modules/expo-constants/build/Constants.js').default;
    if(identity.mode!=='smoke'||identity.fingerprint!==${JSON.stringify(fingerprint)}||constants.expoConfig?.ios?.bundleIdentifier!=='com.lkurczab.patternly.sec03')throw Error('environment_identity_rejected');
    const actors=[],hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    for(const id of hook.renderers.keys())for(const root of hook.getFiberRoots(id)){const walk=f=>{if(!f)return;const v=f.memoizedProps?.value;if(v?.state&&typeof v.retryRecoveryOperation==='function')actors.push(v);walk(f.child);walk(f.sibling);};walk(root.current);}
    if(actors.length!==1)throw Error('actor_unavailable');
    const actor=actors[0],hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
    const sdk=load('node_modules/@firebase/auth/dist/rn/index.js'),apps=load('node_modules/@firebase/app/dist/index.cjs.js').getApps().filter(a=>a.options.projectId==='patternly-app-sandbox');
    if(apps.length!==1)throw Error('runtime_rejected');const auth=sdk.getAuth(apps[0]);
    if(auth.config.emulator?.url!=='http://127.0.0.1:19099/'||auth.app.options.projectId!=='patternly-app-sandbox')throw Error('firebase_emulator_rejected');
    const action=${JSON.stringify(action)},input=${JSON.stringify(input)};
    if(action==='probe-fault-ports'){
      const secure=load('node_modules/expo-secure-store/build/ExpoSecureStore.js').default;
      const codec=load('src/storage/repositories/canonicalRecordCodec.ts');
      const probe=(object,key)=>{const original=object[key],wrapper=(...args)=>original(...args);let writable=false;try{object[key]=wrapper;writable=object[key]===wrapper;}finally{object[key]=original;}return {callable:typeof original==='function',writable,restored:object[key]===original};};
      return {secureCompletion:probe(secure,'setValueWithKeyAsync'),secureDeletion:probe(secure,'deleteValueWithKeyAsync'),canonicalRemove:probe(codec,'removeCanonicalValue')};
    }
    const faultKey='__patternlyRecovery14Fault';
    if(${JSON.stringify(fixtureActions)}.includes(action)){
      const storage=load('src/infrastructure/storage/mmkvClient.ts');
      const profile=storage.getActiveStorageProfileOrNull()??storage.capturePreparedProfileStorageLease()?.profile;
      const marker=!auth.currentUser&&profile?.kind==='account'?load('src/storage/repositories/accountLifecycleRepository.ts').getPreparedAccountDeletionState(profile.id):null;
      const accountId=actor.state.backendUser?.id??actor.state.accountId??actor.state.profile?.accountId??marker?.accountId;
      const authlessAllowed=['retry-deletion-detached','hold-deletion-proof','fail-deletion-cleanup'].includes(action)&&['signedOut','loading','deletionPending'].includes(actor.state.kind)&&marker?.accountUidHash===input.uidSha256&&['remotePending','remoteDeleted','localCleanupPending'].includes(marker.status);
      if((auth.currentUser?hash(auth.currentUser.uid)!==input.uidSha256:!authlessAllowed)||profile?.kind!=='account'||hash(profile.accountId)!==input.accountIdSha256||hash(accountId??'')!==input.accountIdSha256)throw Error('state_rejected');
    }
    if(action==='hold-revoke-completion'){
      const control=await load('src/infrastructure/storage/localLogoutControl.ts').createNativeLocalLogoutControl().read();
      if(control.pending.length!==1)throw Error('state_rejected');const p=control.pending[0];
      return load('scripts/qa/recoveryNativeFault.cjs').arm(action,{uidSha256:hash(p.uid),operationIdSha256:hash(p.operationId)});
    }
    if(action==='restore-fetch'||action.startsWith('lose-')||action.startsWith('hold-')||action==='fail-deletion-cleanup')return load('scripts/qa/recoveryNativeFault.cjs').arm(action,input);
    if(action==='seed-deletion-learning'){
      const policy=load('src/domain/tracks/trackGoalPolicies.ts').requireGoalPolicy('coding-interview-dsa-problem-solving');
      await load('src/storage/repositories/goalRepository.ts').saveGoal(load('src/domain/index.ts').createDefaultGoal(policy),policy);
      await load('src/storage/repositories/activeTrackRepository.ts').saveActiveTrackId('coding-interview-dsa-problem-solving');
      return {seeded:true};
    }
    if(action==='export-codes'){
      const r=actor.recoveryOperation;
      if(r.kind!=='issue'||r.status!=='result_available'||r.savedIntent||r.needsAccountResolution||r.codes?.length!==10)throw Error('state_rejected');
      return {codes:r.codes,operationIdSha256:hash(r.operationId),codesSha256:hash(JSON.stringify(r.codes))};
    }
    if(action==='inspect-inventory'){
      const full=await load('src/infrastructure/storage/mmkvClient.ts').inspectPreparedQ13StorageInventory();
      if(full.kind!=='observed'||!full.complete)throw Error('state_rejected');
      const {packagePointerSources,...inventory}=full;return inventory;
    }
    if(action==='inspect'){
      const v=await load('src/infrastructure/security/recoveryOperationVault.ts').createSecureRecoveryOperationVault().load();
      const r=actor.recoveryOperation;
      const claims=auth.currentUser?await sdk.getIdTokenResult(auth.currentUser,false):null;
      const secure=load('node_modules/expo-secure-store/build/ExpoSecureStore.js').default;
      const rawControl=await secure.getValueWithKeyAsync('patternly.local-logout-control.v2',{keychainService:'com.lkurczab.patternly.encrypted-storage'});
      const control=rawControl?JSON.parse(rawControl):{blocked:null,pending:[],completed:[]};
      const pair=p=>p?{uidSha256:hash(p.uid),operationIdSha256:hash(p.operationId)}:null;
      const storage=load('src/infrastructure/storage/mmkvClient.ts');
      const lifecycleRepo=load('src/storage/repositories/accountLifecycleRepository.ts');
      const prepared=storage.capturePreparedProfileStorageLease();
      const deletion=storage.getActiveStorageProfileOrNull()?lifecycleRepo.getAccountDeletionState():prepared?.profile.kind==='account'?lifecycleRepo.getPreparedAccountDeletionState(prepared.profile.id):null;
      const deletionReceipt=deletion?{status:deletion.status,operationIdSha256:hash(deletion.operationId),operationSecretSha256:hash(deletion.operationSecret),proofIdSha256:deletion.proofId?hash(deletion.proofId):null,accountIdSha256:hash(deletion.accountId),lastFailureCode:deletion.lastFailureCode}:null;
      const lifecycle=storage.getActiveStorageProfileOrNull()?(()=>{const s=storage.getKeyValueStorage(),k=load('src/storage/keys.ts').STORAGE_KEYS;return ['METADATA','GUEST_INSTALLATION','GUEST_ACCESS','ACTIVE_JOURNAL','ACCOUNT_SYNC','ACCOUNT_SIGN_OUT','ACCOUNT_DELETION','CONTENT_REPORT_OUTBOX'].map(name=>{const raw=s.getString(k[name]);if(raw===undefined)return {name,present:false};return {name,present:true,fields:Object.fromEntries(Object.entries(JSON.parse(raw)).map(([field,value])=>[field,hash(JSON.stringify(value))]))};});})():null;
      return {state:actor.state.kind,pidMarker:globalThis.__recovery14ProcessMarker??(globalThis.__recovery14ProcessMarker=${JSON.stringify(randomUUID())}),uidSha256:auth.currentUser?hash(auth.currentUser.uid):null,authorizationGeneration:claims?.claims.authorizationGeneration??null,logout:{blocked:pair(control.blocked),pending:control.pending.map(pair),completed:control.completed.map(pair)},deletion:deletionReceipt,lifecycle,recovery:{kind:r.kind,status:r.status??null,needsAccountResolution:r.needsAccountResolution??null,codeCount:r.codes?.length??0},vault:v?{kind:v.kind,operationIdSha256:hash(v.operationId),status:v.status,authorizationGeneration:v.authorizationGeneration??v.expectedAuthorizationGeneration,expectedUidSha256:v.expectedFirebaseUid?hash(v.expectedFirebaseUid):null,savedIntent:v.savedIntent??null,codeCount:v.codes?.length??0,codesSha256:v.codes?hash(JSON.stringify(v.codes)):null,codeSha256:v.code?hash(v.code):null}:null,fault:globalThis[faultKey]?{action:globalThis[faultKey].action,hits:globalThis[faultKey].hits}:null};
    }
    let result;
    if(action==='restart-auth-owner'){actor.retrySessionRestore();return {scheduled:true};}
    if(action==='retry-detached'){void actor.retryRecoveryOperation().catch(()=>{});return {scheduled:true};}
    if(action==='sign-in-detached'){void actor.signIn(input.email,input.password).catch(()=>{});return {scheduled:true};}
    if(action==='delete-detached'||action==='retry-deletion-detached'){void (action==='delete-detached'?actor.deleteAccount():actor.retryPendingDeletion()).then(result=>globalThis.__b4DeletionResult={kind:result.kind,failure:result.failure??null}).catch(()=>{});return {scheduled:true};}
    if(action==='account-sign-out')result=await actor.signOut();
    else if(action==='prepare-deletion')result=await actor.prepareDeletion({kind:'password',password:input.password});
    else if(action==='sign-in')result=await actor.signIn(input.email,input.password);
    else if(action==='reauthenticate')result=await actor.reauthenticateForExport({kind:'password',password:input.password});
    else if(action==='issue')result=await actor.issueRecoveryCodes({kind:'password',password:input.password});
    else if(action==='retry')result=await actor.retryRecoveryOperation();
    else if(action==='saved')result=await actor.confirmRecoveryCodesSaved();
    else if(action==='local-sign-out'){await sdk.signOut(auth);result={kind:'success',next:'local-signed-out'};}
    else if(action==='consume')result=await actor.consumeRecoveryCode(input.code);
    return {kind:result.kind,...(result.kind==='failure'?{failure:result.failure}:{next:result.next})};
  })()`;
  const response = await fetch(new URL('/json/list', origin), { signal: AbortSignal.timeout(5000), redirect: 'error' });
  const endpoint = selectTarget(await response.json(), origin, 'com.lkurczab.patternly.sec03');
  const require = createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json', import.meta.url));
  const WebSocket = require('ws');
  const socket = new WebSocket(endpoint, { origin: `http://127.0.0.1:${origin.port}`, handshakeTimeout: 5000, maxPayload: 256 * 1024, followRedirects: false });
  let sequence = 0;
  const key = `__recovery14Command_${randomUUID().replaceAll('-', '')}`;
  const evaluate = async source => {
    const result = await request(socket, ++sequence, 'Runtime.evaluate', { expression: source, returnByValue: true, silent: true });
    if (result.error || result.result?.exceptionDetails) throw Error('evaluation_rejected');
    return result.result?.result?.value;
  };
  try {
    await new Promise((resolve, reject) => { socket.once('open', resolve); socket.once('error', () => reject(Error('operation_failed'))); });
    await new Promise(resolve => setTimeout(resolve, 300));
    await evaluate(`(()=>{globalThis[${JSON.stringify(key)}]={kind:'pending'};Promise.resolve().then(()=>${expression}).then(value=>globalThis[${JSON.stringify(key)}]={kind:'done',value}).catch(e=>globalThis[${JSON.stringify(key)}]={kind:'failed',category:${JSON.stringify([...safeCategories])}.includes(e?.message)?e.message:'operation_failed'});return 'scheduled';})()`);
    for (let attempt = 0; attempt < 100; attempt++) {
      const result = JSON.parse(await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}])`));
      if (result.kind === 'done') {
        if (outputPath) await writeFile(outputPath, `${JSON.stringify(result.value)}\n`, { mode: 0o600, flag: 'wx' });
        console.log(JSON.stringify(action === 'export-codes' ? { privateFileWritten: true } : result.value));
        break;
      }
      if (result.kind !== 'pending') throw Error(result.category);
      if (attempt === 99) throw Error('read_timeout');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  } finally { socket.terminate(); }
} catch (error) {
  console.error(JSON.stringify({ stage: 'recovery_ios', category: safeCategories.has(error?.message) ? error.message : 'operation_failed' }));
  process.exitCode = 1;
}
