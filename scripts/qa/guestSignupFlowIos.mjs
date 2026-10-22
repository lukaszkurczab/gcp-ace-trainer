// Native integration probe for the local smoke runtime. Test accounts only;
// never clears profiles, emulator databases, or pre-existing learning data.
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { request, selectTarget, parseOrigin } from './readNativeStartupTrace.mjs';
const [action, runId] = process.argv.slice(2);
if (!['inspect','guest','seed','register','transfer','discard','continue','signout','remote','ui-register','ui-continue'].includes(action) || !/^[a-f0-9-]{36}$/.test(runId ?? '')) throw Error('arguments_rejected');
const directory = resolve('.agent/private/guest-signup-flow-20261022', runId);
mkdirSync(directory, { recursive:true, mode:0o700 });
const credentialPath = resolve(directory, 'credentials.json');
let credentials;
try { credentials=JSON.parse(readFileSync(credentialPath,'utf8')); } catch {
 if(action!=='inspect'&&action!=='guest')throw Error('fixture_not_initialized');
 credentials={email:`guest-flow-${runId}@example.test`,password:`Qa9!${randomUUID()}`};
 writeFileSync(credentialPath,JSON.stringify(credentials),{mode:0o600,flag:'wx'});
}
const origin=parseOrigin('http://127.0.0.1:8081');
const require=createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json',import.meta.url));const WS=require('ws');
const endpoint=selectTarget(await (await fetch(new URL('/json/list',origin))).json(),origin);
const socket=new WS(endpoint,{origin:origin.origin});await new Promise((a,r)=>{socket.once('open',a);socket.once('error',r)});
const key=`__guestFlowResult_${randomUUID().replaceAll('-','')}`;
const prelude=`const mods=Array.from(__r.getModules().entries());const load=p=>{const matches=mods.filter(([,m])=>m.verboseName.endsWith(p));if(matches.length!==1)throw Error('module_unavailable');return __r(matches[0][0]);};
const env=load('src/infrastructure/runtime/environmentIdentity.ts').readEnvironmentIdentity();
if(!__DEV__||!globalThis.HermesInternal||env.mode!=='smoke'||env.apiOrigin!=='http://127.0.0.1:8080'||env.fingerprint!=='4d8001befde58a6e36643f99ab09bc29c4a6175337d33163105be15dfc69748e')throw Error('runtime_rejected');
const hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;const findActor=()=>{const xs=[];for(const id of hook.renderers.keys())for(const root of hook.getFiberRoots(id)){const walk=f=>{if(!f)return;const v=f.memoizedProps?.value;if(v?.state&&typeof v.confirmAdoption==='function'&&typeof v.continueAsGuest==='function')xs.push(v);walk(f.child);walk(f.sibling);};walk(root.current);}if(xs.length!==1)throw Error('actor_unavailable');return xs[0];};
const actor=findActor(),storage=load('src/infrastructure/storage/mmkvClient.ts'),hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
const admission=load('src/application/tracks/trackAdmissionContext.ts');
const records=load('src/storage/repositories/accountDataRepository.ts');
const runId=${JSON.stringify(runId)},credential=${JSON.stringify(credentials)};
const ensureOwned=()=>{if(actor.state.user?.email!==credential.email)throw Error('fixture_actor_rejected');};
const inspect=async()=>{const p=storage.getActiveStorageProfileOrNull();const binding=p?.kind==='account'?await storage.readActiveAccountIdentityBinding(storage.captureActiveProfileStorageLease()):null;const snapshot=p?await records.buildAccountDataSnapshot(admission.productionLearningDataAdmissionContext):null;globalThis.__guestFlowRuntimeMarker??=Math.random().toString(16).slice(2);return {state:findActor().state.kind,status:findActor().state.accountData?.status,profile:p?.kind,profileIdHash:p?hash(p.id):null,runtimeMarker:globalThis.__guestFlowRuntimeMarker,ownedAccount:findActor().state.user?.email===credential.email,binding:binding?.kind??null,homeFenceCurrent:findActor().captureHomeResumeActorFence()?.isCurrent()??false,recordCount:snapshot?.records.length??null,records:snapshot?.records.map(r=>({type:r.recordType,id:hash(r.recordId??r.targetId),fingerprint:r.fingerprint,hash:hash(JSON.stringify(r.state))})),choice:findActor().state.accountData?.guestAdoptionChoice,preview:findActor().state.accountData?.preview?.plan};};`;
const bodies={
inspect:'return await inspect();',
guest:`if(!['signedOut','guest'].includes(actor.state.kind))throw Error('guest_precondition_rejected');const result=await actor.continueAsGuest();return {result,inspection:await inspect()};`,
seed:`if(actor.state.kind!=='guest'||storage.getActiveStorageProfileOrNull()?.kind!=='guest')throw Error('guest_precondition_rejected');const before=await inspect();if(before.recordCount!==0)throw Error('nonempty_guest_rejected');
const d=load('src/domain/index.ts'),track='coding-interview-dsa-problem-solving';const policy=load('src/domain/tracks/trackGoalPolicies.ts').requireGoalPolicy(track);
await load('src/storage/repositories/activeTrackRepository.ts').saveActiveTrackId(track);
await load('src/storage/repositories/goalRepository.ts').saveGoal(d.createDefaultGoal(policy),policy);
const sha='a'.repeat(64),at=new Date().toISOString(),occurrence='guest-flow-occurrence';
const session=d.createTrainingSession({id:'guest-flow-'+runId,trackId:track,modeId:'guided',configurationSnapshot:{kind:'practice'},requestedLength:1,actualLength:1,currentItemIndex:0,itemOrder:[{occurrenceId:occurrence,item:{trackId:track,questionId:'two-sum-001',contentVersion:'guest-flow-fixture',artifactSha256:sha}}],optionOrderByOccurrence:{},activeForegroundMs:0,contentVersion:'guest-flow-fixture',artifactSha256:sha,status:'completed',startedAt:at,completedAt:at});
await load('src/storage/repositories/trainingSessionRepository.ts').saveTrainingSession(session,admission.productionTrackAdmissionContext);
const result=d.createTrainingSessionResult({id:session.id+':result',sessionId:session.id,trackId:track,totalOccurrences:1,answeredOccurrenceIds:[occurrence],unansweredOccurrenceIds:[],completedAt:at,evidence:d.createFamilyEnvelope({familyId:'coding_interview',details:{activeForegroundMs:0,correctCount:1,partialCount:0,incorrectCount:0,pointsEarned:1,maxPoints:1}})});
await load('src/storage/repositories/trainingSessionResultRepository.ts').saveTrainingSessionResult(result,admission.productionTrackAdmissionContext);return await inspect();`,
register:`if(actor.state.kind!=='guest')throw Error('guest_precondition_rejected');return {result:await actor.register(credential.email,credential.password,true,'en'),inspection:await inspect()};`,
transfer:`ensureOwned();if(actor.state.accountData?.status!=='previewReady')throw Error('preview_required');return {result:await actor.setGuestAdoptionChoice('transfer'),inspection:await inspect()};`,
discard:`ensureOwned();if(actor.state.accountData?.status!=='previewReady')throw Error('preview_required');return {result:await actor.setGuestAdoptionChoice('discard'),inspection:await inspect()};`,
continue:`ensureOwned();if(actor.state.accountData?.status!=='previewReady')throw Error('preview_required');const preview=actor.state.accountData.preview;if(preview.plan.conflictRecordIds.length||preview.preview.goalPlanConflictGroups.length)throw Error('unexpected_fixture_conflict');const result=actor.state.accountData.guestAdoptionChoice==='discard'?await actor.discardGuestData():await actor.confirmAdoption([],[]);return {result,inspection:await inspect()};`,
signout:`ensureOwned();return {result:await actor.signOut()};`,
remote:`ensureOwned();const config=load('src/infrastructure/firebase/publicConfig.ts').readFirebaseClientConfiguration();if(config.kind!=='configured')throw Error('configuration_rejected');const auth=load('src/infrastructure/firebase/firebaseAuthClient.ts').createFirebaseAuthClient({config:config.value,authActionOrigin:'http://127.0.0.1:8080',authEmulatorOrigin:'http://127.0.0.1:19099'});if(auth.getSnapshot()?.email!==credential.email)throw Error('fixture_actor_rejected');const api=load('src/infrastructure/clients/PatternlyApiClientAdapter.ts').createPatternlyApiClient({allowLocalHttpForSimulator:true,apiOrigin:'http://127.0.0.1:8080',getIdToken:auth.getIdToken});const remote=await api.getProgress();return {recordCount:remote.records.length,records:remote.records.map(r=>({type:r.recordType,id:hash(r.recordId??r.targetId),fingerprint:r.fingerprint,hash:hash(JSON.stringify(r.state))})),revision:remote.accountRevision};`
};
let sequence=0;
async function evaluate(expression){const r=await request(socket,++sequence,'Runtime.evaluate',{expression,returnByValue:true,silent:true});if(r.error||r.result?.exceptionDetails)throw Error('evaluation_failed');return r.result?.result?.value;}
try {
 if (action.startsWith('ui-')) {
  await evaluate(`(()=>{${prelude};if(${JSON.stringify(action)}==='ui-register'&&actor.state.kind!=='guest')throw Error('guest_precondition_rejected');if(${JSON.stringify(action)}==='ui-continue'){ensureOwned();if(actor.state.accountData?.status!=='previewReady')throw Error('preview_required');}return true;})()`);
  socket.terminate();
  const phase=action.slice(3),outputDirectory=resolve(directory,action+'-'+Date.now());mkdirSync(outputDirectory,{recursive:true,mode:0o700});
  const flow=fileURLToPath(new URL(`./flows/guest-signup-${phase}-ios.yaml`,import.meta.url));
  const result=spawnSync('maestro',['--device','7F315654-3175-4F3C-BB24-B0263F59360C','test','-e',`GUEST_FLOW_EMAIL=${credentials.email}`,'-e',`GUEST_FLOW_PASSWORD=${credentials.password}`,'--test-output-dir',outputDirectory,flow],{env:{...process.env,GUEST_FLOW_EMAIL:credentials.email,GUEST_FLOW_PASSWORD:credentials.password},encoding:'utf8',timeout:180000});
  writeFileSync(resolve(outputDirectory,'output.log'),`${result.stdout}\n${result.stderr}`,{mode:0o600});
  console.log(JSON.stringify({action,runId,status:result.status,category:result.error?.code??null,outputDirectory}));process.exit(result.status??1);
 }
 await evaluate(`(()=>{globalThis[${JSON.stringify(key)}]={kind:'pending'};Promise.resolve().then(async()=>{${prelude}\n${bodies[action]}}).then(value=>globalThis[${JSON.stringify(key)}]={kind:'done',value},()=>globalThis[${JSON.stringify(key)}]={kind:'failed',category:'native_operation_failed'});return true})()`);
 let receipt;
 for(let i=0;i<240;i++){const v=await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}]??{kind:'runtime_reloaded'})`);const r=JSON.parse(v);if(r.kind!=='pending'){receipt=r;break;}await new Promise(a=>setTimeout(a,200));}
 if(!receipt)throw Error('operation_timeout');
 writeFileSync(resolve(directory,`${Date.now()}-${action}.json`),JSON.stringify(receipt,null,2),{mode:0o600});
 console.log(JSON.stringify({action,runId,...receipt}));if(receipt.kind!=='done'||receipt.value?.result?.kind==='failure')process.exitCode=1;
}finally{if(socket.readyState===WS.OPEN)await evaluate(`delete globalThis[${JSON.stringify(key)}]`).catch(()=>{});socket.terminate();}
