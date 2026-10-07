#!/usr/bin/env node
// User-authorized one-use fixture correction; not a product cancellation feature.
import {readFileSync,writeFileSync} from 'node:fs';
import {randomUUID} from 'node:crypto';
import WebSocket from 'ws';
if(process.argv[2]!=='--execute-reviewed')throw new Error('explicit_reviewed_execution_required');
const expected=JSON.parse(readFileSync('docs/active/BIZQ-01/premium-native-path-31/PUBLIC-BEFORE33.json','utf8'));
const marker='[bizq33-repair]:'+randomUUID();
const pages=await(await fetch('http://[::1]:8081/json/list')).json();
const page=pages.find(p=>p.appId==='com.lkurczab.patternly'&&p.deviceName==='iPhone 17');
if(!page?.webSocketDebuggerUrl)throw new Error('existing_inspector_unavailable');
const expression=`(() => { const send=x=>console.log(${JSON.stringify(marker)},JSON.stringify(x));let stage='initialized_modules';(async()=>{
 const modules=[...globalThis.__r.getModules().values()];const initialized=s=>{const m=modules.filter(x=>x.verboseName===s||x.verboseName?.endsWith('/'+s));if(m.length!==1||!m[0].isInitialized)throw new Error();return m[0].publicModule.exports;};
 const mm=initialized('src/infrastructure/storage/mmkvClient.ts'),gr=initialized('src/storage/repositories/guestInstallationRepository.ts'),hash=initialized('src/infrastructure/identity/sha256.ts').sha256Utf8,rt=initialized('src/infrastructure/runtime/runtimeMode.ts'),config=initialized('src/infrastructure/firebase/publicConfig.ts');
 stage='runtime_guard';const fc=config.readFirebaseClientConfiguration();if(rt.readPatternlyRuntimeMode()!=='smoke'||fc.kind!=='configured'||fc.value.projectId!=='patternly-app-sandbox'||config.readDevelopmentFirebaseAuthEmulatorOrigin()!=='http://127.0.0.1:19099')throw new Error();
 stage='guest_guard';const active=mm.getActiveStorageProfileOrNull();const e=${JSON.stringify(expected)};if(!active||active.kind!=='guest'||mm.isProfileTransitionActive()||hash(active.id)!==e.profile.selectedIdSha256)throw new Error();
 const before=await gr.getGuestInstallation();if(!before||before.accountId!==null||before.bindingState!=='adoption_pending'||hash(before.installationId)!==e.guestMarker.installationIdSha256||hash(before.localDatasetId)!==e.guestMarker.localDatasetIdSha256)throw new Error();
 stage='single_canonical_clear';const after=await gr.clearGuestAccountBinding();stage='readback';const verify=await gr.getGuestInstallation();if(!verify||verify.installationId!==before.installationId||verify.localDatasetId!==before.localDatasetId||verify.accountId!==null||verify.bindingState!=='guest'||JSON.stringify(verify)!==JSON.stringify(after))throw new Error();
 send({ok:true,singleCanonicalCall:true,allowedDelta:'adoption_pending -> guest',identityPreserved:true,accountBound:false});
 })().catch(()=>send({ok:false,stage,stopNoRetry:true}));})()`;
const socket=new WebSocket(page.webSocketDebuggerUrl,{origin:'http://127.0.0.1:8081'});let done=false;const timer=setTimeout(()=>finish({ok:false,stage:'inspector_timeout',stopNoRetry:true}),30000);
function finish(r){if(done)return;done=true;clearTimeout(timer);socket.close();writeFileSync('docs/active/BIZQ-01/premium-completion-33/GUEST-REPAIR-RESULT.json',JSON.stringify(r,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(r));if(!r.ok)process.exitCode=1;}
socket.on('open',()=>socket.send(JSON.stringify({id:1,method:'Runtime.enable'})));
socket.on('message',data=>{let e;try{e=JSON.parse(data.toString())}catch{return}if(e.id===1){if(e.error)finish({ok:false,stage:'inspector_enable'});else socket.send(JSON.stringify({id:2,method:'Runtime.evaluate',params:{expression,awaitPromise:false,returnByValue:true}}));return;}if(e.method==='Runtime.consoleAPICalled'&&e.params?.args?.[0]?.value===marker){try{finish(JSON.parse(e.params.args[1].value))}catch{finish({ok:false,stage:'invalid_receipt'})}}});socket.on('error',()=>finish({ok:false,stage:'connection'}));
