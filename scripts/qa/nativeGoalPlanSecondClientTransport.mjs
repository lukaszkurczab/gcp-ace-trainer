import { createRequire } from 'node:module';
import { readFile, lstat, realpath, unlink } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
let requestedMode = null;
let postIntentDurable = false;
let postRequestStarted = false;
async function main(){
const operationModeArgument=process.argv.indexOf('--mode');
const operationMode=operationModeArgument>=0?process.argv[operationModeArgument+1]:null;
if(!['validate','post'].includes(operationMode))throw Error('private_input_rejected');
requestedMode = operationMode;
const require = createRequire(resolve(APP_ROOT, 'package.json'));
const WS = require('ws');
const argumentsByName = new Map();
const args = process.argv.slice(2);
for (let index=0; index<args.length; index++) {
 const name=args[index];
 if(!['--private-root','--manifest','--track','--output','--request','--local-before','--producer-receipt','--producer-input','--mode'].includes(name) || argumentsByName.has(name) || !args[index+1] || args[index+1].startsWith('--'))throw Error('private_input_rejected');
 argumentsByName.set(name,args[++index]);
}
for(const name of ['--private-root','--manifest','--track','--output','--request','--local-before','--producer-receipt','--producer-input','--mode'])if(!argumentsByName.has(name))throw Error('private_input_rejected');
const privateRoot = resolve(argumentsByName.get('--private-root'));
const rootMetadata = await lstat(privateRoot);
if(!rootMetadata.isDirectory() || rootMetadata.uid!==process.getuid() || (rootMetadata.mode&0o777)!==0o700 || await realpath(privateRoot)!==privateRoot)throw Error('private_root_invalid');
function privatePath(value){if(!value || isAbsolute(value) || value.split(/[\\/]/u).length!==1 || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/u.test(value))throw Error('private_path_invalid');const path=resolve(privateRoot,value);if(dirname(path)!==privateRoot)throw Error('private_path_invalid');return path;}
function manifestPath(value){if(!value || isAbsolute(value))throw Error('private_path_invalid');const path=resolve(privateRoot,value);const inside=relative(privateRoot,path);if(!inside || inside==='..' || inside.startsWith(`..${sep}`) || isAbsolute(inside))throw Error('private_path_invalid');return path;}
async function readPrivateJson(path){const metadata=await lstat(path);if(!metadata.isFile() || metadata.uid!==process.getuid() || (metadata.mode&0o777)!==0o600 || await realpath(path)!==path)throw Error('private_file_invalid');return JSON.parse(await readFile(path,'utf8'));}
const output=privatePath(argumentsByName.get('--output'));
try{await lstat(output);throw Error('private_output_exists');}catch(error){if(error.code!=='ENOENT')throw error;}
const manifestFile=manifestPath(argumentsByName.get('--manifest'));
const manifest=await readPrivateJson(manifestFile);
if(manifest.schemaVersion!==1 || manifest.stage!=='registered' || manifest.projectId!=='patternly-app-sandbox' || !/^[a-f0-9]{64}$/u.test(manifest.uidSha256??''))throw Error('controlled_manifest_invalid');
if(manifest.operation!=='bizq03_second_client_transport' || !['profileId','accountId','localDatasetId','installationId'].every(k=>typeof manifest[k]==='string'&&manifest[k].length>0))throw Error('controlled_manifest_invalid');
const syncRequest=await readPrivateJson(privatePath(argumentsByName.get('--request')));
const localBefore=await readPrivateJson(privatePath(argumentsByName.get('--local-before')));
if(localBefore.journal!==null || localBefore.bindingVerified!==true || localBefore.leaseCurrent!==true || !localBefore.goal || !localBefore.plan || localBefore.uidSha256!==manifest.uidSha256 || syncRequest.mutations?.length!==2 || new Set(syncRequest.mutations.map(m=>m.recordType)).size!==2 || !syncRequest.mutations.every(m=>['goal','learning_plan'].includes(m.recordType) && m.trackId==='coding-interview-dsa-problem-solving'))throw Error('private_input_rejected');
const intentOutput=privatePath(argumentsByName.get('--output').replace(/\.json$/u,'.intent.json'));
const canonical=value=>JSON.stringify(sortValue(value));
function sortValue(value){return Array.isArray(value)?value.map(sortValue):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,sortValue(value[k])])):value;}

const producerReceipt=await readPrivateJson(privatePath(argumentsByName.get('--producer-receipt')));
const producerInputPath=privatePath(argumentsByName.get('--producer-input'));
const producerInput=await readPrivateJson(producerInputPath);
const digest=v=>createHash('sha256').update(v).digest('hex');
const canonicalIdentity=require(resolve(APP_ROOT,'src/infrastructure/identity/canonicalSerialization.ts'));
if(producerReceipt.schemaVersion!=='patternly-second-client-producer-receipt-v1' || producerReceipt.sourceInputSha256!==digest(await readFile(producerInputPath)) || producerReceipt.serializedRequestSha256!==digest(await readFile(privatePath(argumentsByName.get('--request')))) || producerReceipt.requestSha256!==digest(canonicalIdentity.canonicalJsonV1({schema:'canonical-json-v1',payload:syncRequest})) || canonical(producerReceipt.request)!==canonical(syncRequest) || producerReceipt.accountId!==manifest.accountId || producerInput.accountId!==manifest.accountId || producerInput.nextPageToken!==null || producerReceipt.remoteAccountRevision!==syncRequest.expectedAccountRevision || producerInput.accountRevision!==syncRequest.expectedAccountRevision)throw Error('producer_provenance_rejected');
const producerSourcePath=resolve(dirname(fileURLToPath(import.meta.url)),'goalPlanSecondClientProducer.mjs');
const producerSourceMeta=await lstat(producerSourcePath);
if(!producerSourceMeta.isFile() || producerSourceMeta.isSymbolicLink() || producerSourceMeta.uid!==process.getuid() || await realpath(producerSourcePath)!==producerSourcePath || producerReceipt.producerScriptSha256!==digest(await readFile(producerSourcePath)) || producerReceipt.producerVersion!=='patternly-second-client-memory-producer-v2' || typeof producerReceipt.producerRunId!=='string')throw Error('producer_source_rejected');
if(producerReceipt.exactOutbox?.length!==2 || producerReceipt.canonicalBatch?.length!==2 || canonical(producerReceipt.exactOutbox)!==canonical(producerReceipt.canonicalBatch) || new Set(syncRequest.mutations.map(m=>m.mutationId)).size!==2 || producerReceipt.installation?.installationId!==syncRequest.deviceId || producerReceipt.installation?.accountId!==manifest.accountId || producerReceipt.memoryProfile?.accountId!==manifest.accountId || producerReceipt.memoryProfile?.kind!=='account')throw Error('producer_batch_rejected');
for(const mutation of syncRequest.mutations){
 const entry=producerReceipt.canonicalBatch.find(e=>e.recordType===mutation.recordType && e.trackId===mutation.trackId && e.recordId===mutation.targetId);
 const baseline=producerReceipt.baselineRecords.find(e=>e.recordType===mutation.recordType && e.trackId===mutation.trackId && e.recordId===mutation.targetId);
 if(!entry || !baseline || mutation.targetId!=='coding-interview-dsa-problem-solving' || mutation.mutationId!==entry.mutationId || mutation.kind!=='node' || mutation.expectedVersion!==entry.expectedVersion || mutation.expectedVersion!==baseline.version || mutation.fingerprint!==entry.fingerprint || canonical(mutation.state)!==canonical(entry.state) || entry.fingerprint!==digest(canonicalIdentity.canonicalSerialize({recordId:entry.recordId,recordType:entry.recordType,state:entry.state,trackId:entry.trackId})))throw Error('producer_entry_rejected');
 const envelope=producerReceipt.committedGoalPlanEnvelopes[mutation.recordType==='goal'?'goal':'learningPlan'];
 if(!envelope || mutation.state.revision!==envelope.revision || canonical(mutation.state[mutation.recordType==='goal'?'record':'plan'])!==canonical(envelope.payload))throw Error('producer_pair_rejected');
}
if(producerReceipt.committedGoalPlanEnvelopes.learningPlan.payload.goalRevision!==producerReceipt.committedGoalPlanEnvelopes.goal.revision || localBefore.accountId!==manifest.accountId || localBefore.profileId!==manifest.profileId)throw Error('producer_pair_rejected');
const track = argumentsByName.get('--track'); if(track!=='coding-interview-dsa-problem-solving')throw Error('controlled_track_rejected');
if(!['google-cloud-associate-cloud-engineer','coding-interview-dsa-problem-solving'].includes(track))throw Error('controlled_track_rejected');
const targets = await (await fetch('http://127.0.0.1:8081/json/list',{signal:AbortSignal.timeout(5000)})).json();
const matches = targets.filter(t => t.type==='node' && t.title === 'com.lkurczab.patternly (iPhone 17)');
if(matches.length !== 1) throw Error('native_target_ambiguous');
const endpoint = new URL(matches[0].webSocketDebuggerUrl);
if(endpoint.protocol!=='ws:' || endpoint.port!=='8081' || !['localhost','127.0.0.1'].includes(endpoint.hostname)) throw Error('target_not_local');
endpoint.hostname = '127.0.0.1';
const ws = new WS(endpoint.href, { origin: 'http://' + endpoint.host });
await new Promise((yes,no) => {const timer=setTimeout(()=>{ws.terminate();no(Error('native_connect_timeout'));},5000);ws.once('open',()=>{clearTimeout(timer);yes();});ws.once('error',()=>{clearTimeout(timer);no(Error('native_connect_failed'));});});
const sourceGoalRow=producerInput.records.find(r=>r.recordType==='goal'&&r.trackId===track&&(r.recordId??r.targetId)===track);
const sourceGoal=sourceGoalRow?.state?.record;
const competingGoal=producerReceipt.committedGoalPlanEnvelopes.goal.payload;
const competingPlan=producerReceipt.committedGoalPlanEnvelopes.learningPlan.payload;
const dateOnly=value=>typeof value==='string'&&/^\d{4}-\d{2}-\d{2}$/u.test(value)&&Number.isFinite(Date.parse(value+'T00:00:00.000Z'))&&new Date(value+'T00:00:00.000Z').toISOString().slice(0,10)===value;
if(!sourceGoal || !dateOnly(competingGoal.targetDate) || competingGoal.targetDate===sourceGoal.targetDate || competingGoal.targetDate===localBefore.goal.payload.targetDate || competingPlan.acceptedTarget.targetDate!==competingGoal.targetDate || producerReceipt.targetChange?.beforeTargetDate!==(sourceGoal.targetDate??null) || producerReceipt.targetChange?.afterTargetDate!==competingGoal.targetDate)throw Error('producer_target_change_rejected');
if(sourceGoal.targetDate!==undefined){if(!dateOnly(sourceGoal.targetDate) || producerReceipt.targetChange.kind!=='advance_target_date' || new Date(Date.parse(sourceGoal.targetDate+'T00:00:00.000Z')+86400000).toISOString().slice(0,10)!==competingGoal.targetDate)throw Error('producer_target_change_rejected');}else if(producerReceipt.targetChange.kind!=='introduce_target_date')throw Error('producer_target_change_rejected');
const sortBaseline=records=>[...records].sort((a,b)=>canonical(a)<canonical(b)?-1:canonical(a)>canonical(b)?1:0);
const baselineCanonical=canonical(sortBaseline(producerReceipt.baselineRecords));
const localGoalCanonical=canonical(localBefore.goal); const localPlanCanonical=canonical(localBefore.plan);
const expression = `(async()=>{
 const modules=Array.from(__r.getModules().entries());
 const load=s=>{const m=modules.filter(([,v])=>v.isInitialized && v.verboseName?.endsWith(s));if(m.length!==1)throw Error('owner_unavailable');return __r(m[0][0]);};
 const track=${JSON.stringify(track)};
 if(typeof __DEV__==='undefined' || !__DEV__ || !load('src/infrastructure/runtime/runtimeMode.ts').isPatternlySmokeRuntime())throw Error('controlled_runtime_required');
 const mmkv=load('src/infrastructure/storage/mmkvClient.ts');
 const lease=mmkv.captureActiveProfileStorageLease();
 if(!lease || !mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('lease_unavailable');
 const profile=mmkv.getActiveStorageProfileOrNull();
 if(profile?.kind!=='account' || profile.id!==${JSON.stringify(manifest.profileId)} || profile.accountId!==${JSON.stringify(manifest.accountId)})throw Error('controlled_account_required');
 const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
 const apps=load('node_modules/firebase/app/dist/esm/index.esm.js').getApps().filter(a=>a.name==='patternly');
 if(apps.length!==1)throw Error('firebase_owner_unavailable');
 const auth=load('node_modules/firebase/auth/dist/esm/index.esm.js').getAuth(apps[0]);
 const uid=auth.currentUser?.uid;
 if(!uid || hash(uid)!==${JSON.stringify(manifest.uidSha256)})throw Error('controlled_actor_mismatch');
 const binding=await mmkv.readActiveAccountIdentityBinding(lease);
 if(binding.kind!=='verified' || binding.binding.verified!==true || binding.binding.firebaseUid!==uid || binding.binding.profileId!==profile.id || binding.binding.accountId!==profile.accountId || binding.binding.profileKind!==profile.kind || auth.currentUser?.uid!==uid || !mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('verified_binding_required');
 const installation=await load('src/storage/repositories/guestInstallationRepository.ts').getGuestInstallation();
 if(installation?.bindingState!=='account_bound' || installation.accountId!==profile.accountId || installation.localDatasetId!==${JSON.stringify(manifest.localDatasetId)} || installation.installationId!==${JSON.stringify(manifest.installationId)} || !mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('controlled_dataset_changed');
 const apiFactory=load('src/infrastructure/clients/PatternlyApiClientAdapter.ts').createPatternlyApiClient;
 const appCheck=load('src/infrastructure/clients/patternlyAppCheckToken.ts').getPatternlyAppCheckToken;
 const api=apiFactory({allowLocalHttpForSimulator:true,apiOrigin:'http://127.0.0.1:8080',getAppCheckToken:appCheck,getIdToken:async()=>{if(auth.currentUser?.uid!==uid)throw Error('actor_changed');const token=await auth.currentUser.getIdToken();const marker=await load('src/storage/repositories/guestInstallationRepository.ts').getGuestInstallation();if(auth.currentUser?.uid!==uid || !mmkv.isActiveProfileStorageLeaseCurrent(lease) || mmkv.getActiveStorageProfileOrNull()?.id!==profile.id || marker?.bindingState!=='account_bound' || marker.accountId!==profile.accountId || marker.installationId!==installation.installationId || marker.localDatasetId!==installation.localDatasetId)throw Error('actor_changed');return token;}});
 const remoteBefore=await api.getProgress();
 if(remoteBefore.nextPageToken!==null || remoteBefore.accountRevision!==${JSON.stringify(syncRequest.expectedAccountRevision)} || remoteBefore.generation!==${JSON.stringify(producerInput.generation)} || profile.accountId!==${JSON.stringify(localBefore.accountId)} || profile.id!==${JSON.stringify(localBefore.profileId)})throw Error('second_client_baseline_changed');
 const remoteProgress=remoteBefore;
 const liveGoal=remoteBefore.records.find(r=>r.recordType==='goal'&&r.trackId===track&&(r.recordId??r.targetId)===track);
 if(!liveGoal || load('src/infrastructure/identity/canonicalSerialization.ts').canonicalSerialize(liveGoal.state.record)!==${JSON.stringify(canonical(sourceGoal))})throw Error('second_client_target_baseline_changed');
 const producerRecords=${JSON.stringify(producerReceipt.canonicalBatch)};
 const accountRepo=load('src/storage/repositories/accountDataRepository.ts');
 accountRepo.assertValidAccountDataRecords(producerRecords);
 const syncEnvelopeBefore=accountRepo.readAccountSyncStateEnvelope();
 const projectBaseline=records=>records.map(r=>({recordId:r.recordId??r.targetId,recordType:r.recordType,trackId:r.trackId,version:r.version,fingerprint:r.fingerprint})).sort((a,b)=>canonicalForBaseline(a)<canonicalForBaseline(b)?-1:canonicalForBaseline(a)>canonicalForBaseline(b)?1:0);
 const canonicalForBaseline=load('src/infrastructure/identity/canonicalSerialization.ts').canonicalSerialize;
 if(canonicalForBaseline(projectBaseline(remoteBefore.records))!==${JSON.stringify(baselineCanonical)})throw Error('second_client_baseline_changed');
 if(auth.currentUser?.uid!==uid || !mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('actor_changed');
 const keys=load('src/storage/keys.ts').STORAGE_KEYS;
 const codec=load('src/storage/repositories/canonicalRecordCodec.ts');
 const goalGuard=load('src/domain/goals/goalContracts.ts').isGoalRecordShapeForTrack;
 const planGuard=load('src/domain/index.ts').isLearningPlanV1ForTrack;
 const goal=codec.readCanonicalEnvelope(keys.goal(track),v=>goalGuard(v,track));
 const plan=codec.readCanonicalEnvelope(keys.learningPlan(track),v=>planGuard(v,track));
 const journal=load('src/storage/repositories/mutationJournalRepository.ts').readActiveMutationJournal();
 const canonical=load('src/infrastructure/identity/canonicalSerialization.ts').canonicalSerialize;
 const receipt=load('src/application/runtimeAuditability/goalPlanAcceptanceInterruptionCommand.ts').getDevelopmentGoalPlanAcceptanceInterruptionReceipt();
 const guardedRead=(read)=>{try{read();return 'readable';}catch{return 'blocked';}};
 const goalReader=load('src/storage/repositories/goalRepository.ts');
 const planReader=load('src/storage/repositories/learningPlanRepository.ts');
 const goalRead=guardedRead(()=>goalReader.readGoalSnapshot(track));
 const planRead=guardedRead(()=>planReader.getLearningPlanSnapshot(track));
 if(auth.currentUser?.uid!==uid || !mmkv.isActiveProfileStorageLeaseCurrent(lease) || mmkv.getActiveStorageProfileOrNull()?.id!==profile.id)throw Error('lease_changed');
 if(journal!==null || canonical(goal)!==${JSON.stringify(localGoalCanonical)} || canonical(plan)!==${JSON.stringify(localPlanCanonical)})throw Error('local_pair_changed');
 if(${JSON.stringify(operationMode)}==='validate')return {validationOnly:true,accountId:profile.accountId,schemaVersion:1,stage:'native_second_client_preflight',capturedAt:new Date().toISOString(),bindingVerified:true,leaseCurrent:true,track,profileId:profile.id,uidSha256:hash(uid),goal,plan,journal,receipt,goalRead,planRead,remoteProgress,syncEnvelopeBefore,producerRequestSha256:${JSON.stringify(producerReceipt.requestSha256)}};
 const syncResponse=await api.syncProgress(${JSON.stringify(syncRequest)});
 const remoteAfter=await api.getProgress();
 const expectedAccountRevision=remoteBefore.accountRevision+syncResponse.applied.length;
 if(syncResponse.accountRevision!==expectedAccountRevision || syncResponse.applied.length!==2 || syncResponse.duplicates.length!==0 || syncResponse.conflicts.length!==0 || syncResponse.accountRevisionConflict || remoteAfter.accountRevision!==expectedAccountRevision || remoteAfter.generation!==remoteBefore.generation || remoteAfter.nextPageToken!==null)throw Error('second_client_post_result_unconfirmed');
 for(const m of ${JSON.stringify(syncRequest.mutations)}){for(const rows of [syncResponse.applied,remoteAfter.records]){const r=rows.find(r=>r.recordType===m.recordType && r.trackId===m.trackId && (r.recordId??r.targetId)===m.targetId);if(!r || r.version!==m.expectedVersion+1 || r.fingerprint!==m.fingerprint || canonical(r.state)!==canonical(m.state))throw Error('second_client_remote_pair_unconfirmed');}}
 const syncEnvelopeAfter=accountRepo.readAccountSyncStateEnvelope();
 if(canonical(syncEnvelopeBefore)!==canonical(syncEnvelopeAfter) || load('src/storage/repositories/mutationJournalRepository.ts').readActiveMutationJournal()!==null || canonical(codec.readCanonicalEnvelope(keys.goal(track),v=>goalGuard(v,track)))!==canonical(goal) || canonical(codec.readCanonicalEnvelope(keys.learningPlan(track),v=>planGuard(v,track)))!==canonical(plan))throw Error('native_witness_changed_after_post');
 if(auth.currentUser?.uid!==uid || !mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('actor_changed_after_post');
 return {syncEnvelopeBefore,syncEnvelopeAfter,syncResponse,remoteAfter,accountId:profile.accountId,remoteProgress,httpCapability:'canonical_second_client_post',schemaVersion:1,stage:'native_readonly_pair_snapshot',capturedAt:new Date().toISOString(),bindingVerified:true,track,profileId:profile.id,uidSha256:hash(uid),leaseCurrent:true,goal,plan,journal,receipt,goalRead,planRead,journalSha256:journal?hash(canonical(journal)):null,goalSha256:goal?hash(canonical(goal)):null};
})()`;
let requestId=0;
const pending=new Map();
ws.on('message',data=>{try{const m=JSON.parse(data);pending.get(m.id)?.(m);}catch{}});
const evaluate=expression=>new Promise((yes,no)=>{const id=++requestId;const timer=setTimeout(()=>{pending.delete(id);no(Error('native_read_timeout'));},5000);pending.set(id,r=>{pending.delete(id);clearTimeout(timer);if(r.error||r.result?.exceptionDetails)no(Error('native_owner_read_rejected'));else yes(r.result?.result?.value);});ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));});
const key='__patternlyBizq03PairRead_'+randomUUID().replaceAll('-','');
let snapshot;
if(operationMode==='post'){const intentFile=await import('node:fs/promises').then(fs=>fs.open(intentOutput,'wx',0o600));try{await intentFile.writeFile(JSON.stringify({stage:'second_client_post_intent',request:syncRequest,localBeforeCapturedAt:localBefore.capturedAt,requestSha256:producerReceipt.requestSha256,producerReceiptSha256:digest(canonical(producerReceipt)),manifestSha256:digest(canonical(manifest))}));await intentFile.sync();}finally{await intentFile.close();}
const directoryHandle=await import('node:fs/promises').then(fs=>fs.open(privateRoot,'r'));try{await directoryHandle.sync();}finally{await directoryHandle.close();}postIntentDurable=true;}
try{
 if(operationMode==='post')postRequestStarted=true;
 const started=await evaluate(`(()=>{const k=${JSON.stringify(key)};if(Object.hasOwn(globalThis,k))return 'occupied';globalThis[k]={kind:'pending'};const settle=v=>{if(Object.hasOwn(globalThis,k)&&globalThis[k]?.kind==='pending')globalThis[k]=v;};Promise.resolve().then(()=>${expression}).then(value=>settle({kind:'done',value})).catch(()=>settle({kind:'failed'}));return 'started';})()`);
 if(started!=='started')throw Error('native_capture_start_rejected');
 for(let n=0;n<1000;n++){const result=JSON.parse(await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}]??{kind:'missing'})`));if(result.kind==='done'){snapshot=result.value;break;}if(result.kind!=='pending')throw Error('native_owner_read_rejected');await new Promise(r=>setTimeout(r,25));}
 if(!snapshot)throw Error('native_capture_timeout');
}finally{
 await evaluate(`delete globalThis[${JSON.stringify(key)}]`).catch(()=>{});
 await new Promise(resolveClose=>{const timer=setTimeout(()=>{ws.terminate();resolveClose();},1000);ws.once('close',()=>{clearTimeout(timer);resolveClose();});ws.close();});
}
if(snapshot.uidSha256!==manifest.uidSha256)throw Error('controlled_actor_mismatch');
let created=false;try{const file=await import('node:fs/promises').then(fs=>fs.open(output,'wx',0o600));created=true;try{await file.writeFile(JSON.stringify(snapshot));await file.sync();}finally{await file.close();}}catch(error){if(created)await unlink(output).catch(()=>{});throw Error('private_snapshot_write_failed');}
console.log(JSON.stringify({stage:'native_second_client_post_receipt',receiptPresent:!!snapshot.receipt,journalPresent:!!snapshot.journal,goalPresent:!!snapshot.goal,planPresent:!!snapshot.plan,goalRead:snapshot.goalRead,planRead:snapshot.planRead,controlledActorMatches:true,privateOutputWritten:true,validationOnly:snapshot.validationOnly===true}));

}
main().catch(error=>{const categories=new Set(['private_input_rejected','controlled_track_rejected','private_root_invalid','private_path_invalid','private_file_invalid','controlled_manifest_invalid','controlled_actor_mismatch','native_target_ambiguous','target_not_local','native_read_timeout','native_connect_timeout','native_connect_failed','native_owner_read_rejected','native_capture_start_rejected','native_capture_timeout','expected_provenance_invalid','expected_digest_invalid','expected_checkpoint_rejected','recovery_pair_mismatch','private_snapshot_write_failed','private_output_exists']);console.error(JSON.stringify({stage:'native_pair_readback_stopped',category:categories.has(error?.message)?error.message:'readback_or_private_input_rejected',remoteMutationMayHaveBeenAttempted:postRequestStarted,repeatForbidden:postIntentDurable}));process.exitCode=1;});
