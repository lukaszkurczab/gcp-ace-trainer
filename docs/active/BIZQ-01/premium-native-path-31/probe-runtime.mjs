#!/usr/bin/env node
// No-effect probe: only initialized public exports and named NONSECRET control records.
import { randomUUID } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import WebSocket from 'ws';
const output = process.argv[2];
if (!output?.startsWith('docs/active/BIZQ-01/premium-native-path-31/')) throw new Error('owned_output_required');
const marker = `[bizq31-public-probe]:${randomUUID()}`;
const pages = await (await fetch('http://[::1]:8081/json/list', { signal: AbortSignal.timeout(5000) })).json();
const page = pages.find(p => p.appId === 'com.lkurczab.patternly' && p.deviceName === 'iPhone 17');
if (!page?.webSocketDebuggerUrl) throw new Error('existing_iphone17_inspector_unavailable');
const expression = `(() => {
  const marker = ${JSON.stringify(marker)};
  let stage = 'initialized_modules';
  const send = value => console.log(marker, JSON.stringify(value));
  (async () => {
    const registry = globalThis.__r;
    if (typeof registry?.getModules !== 'function') throw new Error();
    const modules = [...registry.getModules().values()];
    const initialized = suffix => {
      const matches = modules.filter(m => m.verboseName === suffix || m.verboseName?.endsWith('/'+suffix));
      if (matches.length !== 1 || matches[0].isInitialized !== true) throw new Error();
      return matches[0].publicModule.exports;
    };
    const mmkv = initialized('src/infrastructure/storage/mmkvClient.ts');
    const secure = initialized('node_modules/expo-secure-store/build/SecureStore.js');
    const sha = initialized('src/infrastructure/identity/sha256.ts').sha256Utf8;
    const guest = initialized('src/storage/repositories/guestInstallationRepository.ts');
    const runtime = initialized('src/infrastructure/runtime/runtimeMode.ts');
    const api = initialized('src/infrastructure/clients/PatternlyApiClientAdapter.ts');
    const legal = initialized('src/legal/legalVariables.ts').legalVariables;
    const config = initialized('src/infrastructure/firebase/publicConfig.ts');
    if (typeof sha !== 'function' || typeof secure.getItemAsync !== 'function' || typeof api.createPatternlyApiClient !== 'function') throw new Error();
    stage = 'published_guest';
    const active = mmkv.getActiveStorageProfileOrNull();
    if (!active || !['guest','legacy_guest'].includes(active.kind) || mmkv.isProfileTransitionActive()) throw new Error();
    stage = 'local_runtime_binding';
    const firebase = config.readFirebaseClientConfiguration();
    if (runtime.readPatternlyRuntimeMode() !== 'smoke' || firebase.kind !== 'configured' || firebase.value.projectId !== 'patternly-app-sandbox' || config.readDevelopmentFirebaseAuthEmulatorOrigin() !== 'http://127.0.0.1:19099') throw new Error();
    if (typeof legal.documentVersion?.en !== 'string') throw new Error();
    stage = 'nonsecret_registry_read';
    const options = { keychainAccessible: secure.WHEN_UNLOCKED_THIS_DEVICE_ONLY, keychainService: 'com.lkurczab.patternly.encrypted-storage' };
    const slots = await Promise.all(['patternly.profile-root.v1.a','patternly.profile-root.v1.b'].map(k => secure.getItemAsync(k, options)));
    const roots = slots.map(raw => {
      if (raw === null) return null;
      const value = JSON.parse(raw);
      const { checksum, ...body } = value;
      if (sha(JSON.stringify(body)) !== checksum || body.version !== 1 || !Number.isSafeInteger(body.generation) || !Array.isArray(body.profiles)) throw new Error();
      return value;
    }).filter(Boolean).sort((a,b) => b.generation-a.generation);
    if (!roots.length || (roots.length === 2 && roots[0].generation === roots[1].generation)) throw new Error();
    const root = roots[0];
    const selected = root.profiles.find(p => p.id === root.selectedProfileId);
    if (!selected || selected.id !== active.id || selected.kind !== active.kind) throw new Error();
    const counts = root.profiles.reduce((r,p) => { r[p.kind] = (r[p.kind] || 0)+1; return r; }, {});
    stage = 'nonsecret_logout_read';
    const controlRaw = await secure.getItemAsync('patternly.local-logout-control.v2', options);
    const control = controlRaw === null ? { version:2,blocked:null,pending:[],completed:[] } : JSON.parse(controlRaw);
    if (control.version !== 2 || !Array.isArray(control.pending) || !Array.isArray(control.completed)) throw new Error();
    const pairHash = p => { if (typeof p?.uid !== 'string' || typeof p.operationId !== 'string') throw new Error(); return sha(JSON.stringify({uid:p.uid,operationId:p.operationId})); };
    const pendingPairs = control.pending.map(pairHash).sort();
    const completedPairs = control.completed.map(pairHash).sort();
    stage = 'limited_guest_marker_projection';
    const installation = await guest.getGuestInstallation();
    if (!installation) throw new Error();
    send({ ok:true, readonly:true, runtimeMode:'smoke', project:'patternly-app-sandbox',
      profile:{kind:active.kind,selectedIdSha256:sha(active.id),transitionActive:false,counts,soleGuest:((counts.guest||0)+(counts.legacy_guest||0))===1},
      registry:{generation:root.generation,selectedMatchesActive:true,profileIdentityHashes:root.profiles.map(p => ({idSha256:sha(p.id),kind:p.kind,accountIdSha256:p.accountId===null?null:sha(p.accountId)}))},
      logout:{present:controlRaw!==null,blockedPairSha256:control.blocked===null?null:pairHash(control.blocked),pendingPairHashes:pendingPairs,completedPairHashes:completedPairs,pendingUidHashes:control.pending.map(p=>sha(p.uid)).sort()},
      guestMarker:{bindingState:installation.bindingState,accountBound:installation.accountId!==null,installationIdSha256:sha(installation.installationId),localDatasetIdSha256:sha(installation.localDatasetId)},
      canonicalApiExportAvailable:true,legalDocumentVersion:legal.documentVersion.en,
      limits:'Named NONSECRET SDK controls and limitedGuestmarker projection only; no encryptionkey/token/configvalues, no init/bootstrap/migration/writes; notwhole-store'});
  })().catch(() => send({ok:false,stage}));
})()`;
const socket = new WebSocket(page.webSocketDebuggerUrl, { origin:'http://127.0.0.1:8081' });
let finished = false;
const timeout = setTimeout(() => finish({ok:false,stage:'inspector_timeout'}), 30000);
function finish(result) {
  if (finished) return;
  finished = true; clearTimeout(timeout); socket.close();
  writeFileSync(output, JSON.stringify(result,null,2)+'\n', {flag:'wx'});
  console.log(JSON.stringify(result));
  if (!result.ok) process.exitCode=1;
}
socket.on('open', () => socket.send(JSON.stringify({id:1,method:'Runtime.enable'})));
socket.on('message', data => {
  let event; try {event=JSON.parse(data.toString());} catch {return;}
  if (event.id===1) { if (event.error) finish({ok:false,stage:'inspector_enable'}); else socket.send(JSON.stringify({id:2,method:'Runtime.evaluate',params:{expression,awaitPromise:false,returnByValue:true}})); return; }
  if (event.method!=='Runtime.consoleAPICalled' || event.params?.args?.[0]?.value!==marker) return;
  try {finish(JSON.parse(event.params.args[1].value));} catch {finish({ok:false,stage:'probe_message'});}
});
socket.on('error', () => finish({ok:false,stage:'inspector_connection'}));
