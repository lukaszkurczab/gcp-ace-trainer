import { createRequire } from 'node:module';
import { readFile, lstat, realpath, unlink } from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute, sep } from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
const APP_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
async function main(){
const require = createRequire(resolve(APP_ROOT, 'package.json'));
const WS = require('ws');
const argumentsByName = new Map();
const args = process.argv.slice(2);
for (let index=0; index<args.length; index++) {
 const name=args[index];
 if(name==='--include-learning'){
  if(argumentsByName.has(name))throw Error('private_input_rejected');
  argumentsByName.set(name,true);
  continue;
 }
 if(!['--private-root','--manifest','--track','--output','--expected'].includes(name) || argumentsByName.has(name) || !args[index+1] || args[index+1].startsWith('--'))throw Error('private_input_rejected');
 argumentsByName.set(name,args[++index]);
}
for(const name of ['--private-root','--manifest','--track','--output'])if(!argumentsByName.has(name))throw Error('private_input_rejected');
const includeLearning=argumentsByName.has('--include-learning');
if(includeLearning && argumentsByName.has('--expected'))throw Error('private_input_rejected');
const privateRoot = resolve(argumentsByName.get('--private-root'));
const rootMetadata = await lstat(privateRoot);
if(!rootMetadata.isDirectory() || rootMetadata.uid!==process.getuid() || (rootMetadata.mode&0o777)!==0o700 || await realpath(privateRoot)!==privateRoot)throw Error('private_root_invalid');
function privatePath(value){if(!value || isAbsolute(value) || value.split(/[\\/]/u).length!==1 || !/^[A-Za-z0-9][A-Za-z0-9._-]*\.json$/u.test(value))throw Error('private_path_invalid');const path=resolve(privateRoot,value);if(dirname(path)!==privateRoot)throw Error('private_path_invalid');return path;}
function manifestPath(value){if(!value || isAbsolute(value))throw Error('private_path_invalid');const path=resolve(privateRoot,value);const inside=relative(privateRoot,path);if(!inside || inside==='..' || inside.startsWith(`..${sep}`) || isAbsolute(inside))throw Error('private_path_invalid');return path;}
async function readPrivateJson(path){const metadata=await lstat(path);if(!metadata.isFile() || metadata.uid!==process.getuid() || (metadata.mode&0o777)!==0o600 || await realpath(path)!==path)throw Error('private_file_invalid');return JSON.parse(await readFile(path,'utf8'));}
const output=privatePath(argumentsByName.get('--output'));
const expectedArgument=argumentsByName.get('--expected');
const expectedPath=expectedArgument?privatePath(expectedArgument):null;
const manifestFile=manifestPath(argumentsByName.get('--manifest'));
const manifest=await readPrivateJson(manifestFile);
if(manifest.schemaVersion!==1 || manifest.stage!=='registered' || manifest.projectId!=='patternly-app-sandbox' || !/^[a-f0-9]{64}$/u.test(manifest.uidSha256??''))throw Error('controlled_manifest_invalid');
const canonical=value=>JSON.stringify(sortValue(value));
function sortValue(value){return Array.isArray(value)?value.map(sortValue):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,sortValue(value[k])])):value;}

const track = argumentsByName.get('--track');
if(!['google-cloud-associate-cloud-engineer','coding-interview-dsa-problem-solving'].includes(track))throw Error('controlled_track_rejected');
const targets = await (await fetch('http://127.0.0.1:8081/json/list',{signal:AbortSignal.timeout(5000)})).json();
const matches = targets.filter(t => t.type==='node' && t.title === 'com.lkurczab.patternly (iPhone 17)');
if(matches.length !== 1) throw Error('native_target_ambiguous');
const endpoint = new URL(matches[0].webSocketDebuggerUrl);
if(endpoint.protocol!=='ws:' || endpoint.port!=='8081' || !['localhost','127.0.0.1'].includes(endpoint.hostname)) throw Error('target_not_local');
endpoint.hostname = '127.0.0.1';
const ws = new WS(endpoint.href, { origin: 'http://' + endpoint.host });
await new Promise((yes,no) => {const timer=setTimeout(()=>{ws.terminate();no(Error('native_connect_timeout'));},5000);ws.once('open',()=>{clearTimeout(timer);yes();});ws.once('error',()=>{clearTimeout(timer);no(Error('native_connect_failed'));});});
const expression = `(async()=>{
 const modules=Array.from(__r.getModules().entries());
 const load=s=>{const m=modules.filter(([,v])=>v.isInitialized && v.verboseName?.endsWith(s));if(m.length!==1)throw Error('owner_unavailable');return __r(m[0][0]);};
 const track=${JSON.stringify(track)};
 if(typeof __DEV__==='undefined' || !__DEV__ || !load('src/infrastructure/runtime/runtimeMode.ts').isPatternlySmokeRuntime())throw Error('controlled_runtime_required');
 const mmkv=load('src/infrastructure/storage/mmkvClient.ts');
 const lease=mmkv.captureActiveProfileStorageLease();
 if(!lease || !mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('lease_unavailable');
 const profile=mmkv.getActiveStorageProfileOrNull();
 if(profile?.kind!=='account')throw Error('controlled_account_required');
 const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
 const apps=load('node_modules/firebase/app/dist/esm/index.esm.js').getApps().filter(a=>a.name==='patternly');
 if(apps.length!==1)throw Error('firebase_owner_unavailable');
 const auth=load('node_modules/firebase/auth/dist/esm/index.esm.js').getAuth(apps[0]);
 const uid=auth.currentUser?.uid;
 if(!uid)throw Error('actor_unavailable');
 const binding=await mmkv.readActiveAccountIdentityBinding(lease);
 if(binding.kind!=='verified' || binding.binding.verified!==true || binding.binding.firebaseUid!==uid || binding.binding.profileId!==profile.id || binding.binding.accountId!==profile.accountId || binding.binding.profileKind!==profile.kind || auth.currentUser?.uid!==uid || !mmkv.isActiveProfileStorageLeaseCurrent(lease))throw Error('verified_binding_required');
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
 let learning;
 if(${JSON.stringify(includeLearning)}){
  const input=load('src/storage/repositories/learningPlanInputSnapshot.ts').readLearningPlanInputSnapshot(track);
  if(!Array.isArray(input.sessions))throw Error('learning_snapshot_incomplete');
  const sessions=input.sessions.filter(value=>value.trackId===track);
  const attempts=input.attempts.filter(value=>value.trackId===track);
  const reviews=input.reviews.filter(value=>value.trackId===track);
  learning={applicationNow:load('src/application/trainingLifecycle/applicationLifecycle.ts').getApplicationCurrentTime(),sessions,attempts,reviews};
 }
 if(auth.currentUser?.uid!==uid || !mmkv.isActiveProfileStorageLeaseCurrent(lease) || mmkv.getActiveStorageProfileOrNull()?.id!==profile.id)throw Error('lease_changed');
 const pair={bindingVerified:true,track,profileId:profile.id,uidSha256:hash(uid),leaseCurrent:true,goal,plan,journal,receipt,goalRead,planRead,journalSha256:journal?hash(canonical(journal)):null,goalSha256:goal?hash(canonical(goal)):null};
 return ${JSON.stringify(includeLearning)}?{schemaVersion:2,stage:'native_readonly_learning_snapshot',capturedAt:new Date().toISOString(),...pair,learning}:{schemaVersion:1,stage:'native_readonly_pair_snapshot',capturedAt:new Date().toISOString(),...pair};
})()`;
let requestId=0;
const pending=new Map();
ws.on('message',data=>{try{const m=JSON.parse(data);pending.get(m.id)?.(m);}catch{}});
const evaluate=expression=>new Promise((yes,no)=>{const id=++requestId;const timer=setTimeout(()=>{pending.delete(id);no(Error('native_read_timeout'));},5000);pending.set(id,r=>{pending.delete(id);clearTimeout(timer);if(r.error||r.result?.exceptionDetails)no(Error('native_owner_read_rejected'));else yes(r.result?.result?.value);});ws.send(JSON.stringify({id,method:'Runtime.evaluate',params:{expression,returnByValue:true}}));});
const key='__patternlyBizq03PairRead_'+randomUUID().replaceAll('-','');
let snapshot;
try{
 const started=await evaluate(`(()=>{const k=${JSON.stringify(key)};if(Object.hasOwn(globalThis,k))return 'occupied';globalThis[k]={kind:'pending'};const settle=v=>{if(Object.hasOwn(globalThis,k)&&globalThis[k]?.kind==='pending')globalThis[k]=v;};Promise.resolve().then(()=>${expression}).then(value=>settle({kind:'done',value})).catch(()=>settle({kind:'failed'}));return 'started';})()`);
 if(started!=='started')throw Error('native_capture_start_rejected');
 for(let n=0;n<100;n++){const result=JSON.parse(await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}]??{kind:'missing'})`));if(result.kind==='done'){snapshot=result.value;break;}if(result.kind!=='pending')throw Error('native_owner_read_rejected');await new Promise(r=>setTimeout(r,25));}
 if(!snapshot)throw Error('native_capture_timeout');
}finally{
 await evaluate(`delete globalThis[${JSON.stringify(key)}]`).catch(()=>{});
 await new Promise(resolveClose=>{const timer=setTimeout(()=>{ws.terminate();resolveClose();},1000);ws.once('close',()=>{clearTimeout(timer);resolveClose();});ws.close();});
}
if(snapshot.uidSha256!==manifest.uidSha256)throw Error('controlled_actor_mismatch');
let recoveryMatches=null;
if(expectedPath){
 const previous=await readPrivateJson(expectedPath);
 if(previous.schemaVersion!==1 || previous.stage!=='native_readonly_pair_snapshot' || previous.bindingVerified!==true || previous.track!==track || !Number.isFinite(Date.parse(previous.capturedAt)))throw Error('expected_provenance_invalid');
 const record=previous.journal?.writes?.[0]?.record;
 const digest=v=>createHash('sha256').update(canonical(v),'utf8').digest('hex');
 if(!previous.journal || !previous.goal || digest(previous.journal)!==previous.journalSha256 || digest(previous.goal)!==previous.goalSha256)throw Error('expected_digest_invalid');
 const receipt=previous.receipt;
 if(!record || previous.plan!==null || previous.goalRead!=='blocked' || previous.planRead!=='blocked' || previous.journal.status!=='journal_durable' || previous.journal.operation!=='accept_goal_plan' || previous.journal.proposalId!==record.proposalId || previous.journal.trackId!==track || previous.journal.writes.length!==1 || previous.journal.writes[0].kind!=='accept_goal_plan' || record.cause!=='proposal_acceptance' || record.proposalId!==previous.journal.proposalId || record.trackId!==track || record.goal.trackId!==track || record.plan.trackId!==track || record.beforeGoal!==null || record.beforePlan!==null || record.expectedGoalRevision!==null || record.expectedPlanStorageRevision!==null || record.profileId!==previous.profileId || record.plan.status!=='accepted' || record.plan.planRevision!==1 || record.plan.goalRevision!==(record.expectedGoalRevision??0)+1 || record.goal.status!=='active' || previous.goal.revision!==record.plan.goalRevision || canonical(previous.goal.payload)!==canonical(record.goal) || receipt?.checkpoint!=='interrupted' || !/^[A-Za-z0-9_-]{16,128}$/u.test(receipt.nonce??'') || receipt.proposalId!==record.proposalId || receipt.trackId!==track || receipt.goalBeforeAbsent!==true || receipt.planBeforeAbsent!==true || receipt.actorFenceCurrent!==true || receipt.profileLeaseCurrent!==true || receipt.profileMatches!==true || receipt.journalSha256!==previous.journalSha256 || receipt.goalReadbackSha256!==previous.goalSha256 || receipt.planBeforeSha256!==null || receipt.journalExact!==true || receipt.goalReadbackExact!==true || receipt.planStillAbsent!==true || receipt.callbackConsumed!==true || previous.profileId!==snapshot.profileId || previous.uidSha256!==snapshot.uidSha256)throw Error('expected_checkpoint_rejected');
 recoveryMatches=snapshot.receipt===null && snapshot.journal===null && snapshot.goalRead==='readable' && snapshot.planRead==='readable' && snapshot.bindingVerified===true && snapshot.leaseCurrent===true && snapshot.goal?.revision===record.plan.goalRevision && snapshot.plan?.revision===(record.expectedPlanStorageRevision??0)+1 && snapshot.plan.payload.goalRevision===snapshot.goal.revision && canonical(snapshot.goal?.payload)===canonical(record.goal) && canonical(snapshot.plan?.payload)===canonical(record.plan);
 if(!recoveryMatches)throw Error('recovery_pair_mismatch');
}
let created=false;try{const file=await import('node:fs/promises').then(fs=>fs.open(output,'wx',0o600));created=true;try{await file.writeFile(JSON.stringify(snapshot));await file.sync();}finally{await file.close();}}catch(error){if(created)await unlink(output).catch(()=>{});throw Error('private_snapshot_write_failed');}
const status={stage:includeLearning?'native_learning_readonly':'native_pair_readonly',receiptPresent:!!snapshot.receipt,journalPresent:!!snapshot.journal,goalPresent:!!snapshot.goal,planPresent:!!snapshot.plan,goalRead:snapshot.goalRead,planRead:snapshot.planRead,controlledActorMatches:true,recoveryMatches,privateOutputWritten:true};
if(includeLearning)status.learningIncluded=true;
console.log(JSON.stringify(status));

}
main().catch(error=>{const categories=new Set(['private_input_rejected','controlled_track_rejected','private_root_invalid','private_path_invalid','private_file_invalid','controlled_manifest_invalid','controlled_actor_mismatch','native_target_ambiguous','target_not_local','native_read_timeout','native_connect_timeout','native_connect_failed','native_owner_read_rejected','native_capture_start_rejected','native_capture_timeout','expected_provenance_invalid','expected_digest_invalid','expected_checkpoint_rejected','recovery_pair_mismatch','private_snapshot_write_failed']);console.error(JSON.stringify({stage:'native_pair_readback_stopped',category:categories.has(error?.message)?error.message:'readback_or_private_input_rejected',storageMutationAttempted:false}));process.exitCode=1;});
