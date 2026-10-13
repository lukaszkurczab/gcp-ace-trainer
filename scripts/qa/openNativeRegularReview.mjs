import {createRequire} from 'node:module';
import {randomUUID} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parseOrigin,selectTarget,request} from './readNativeStartupTrace.mjs';

const KEY='__patternlyPerf06RegularReviewV1';

// Closed, one-shot navigation probe. Never accepts a route or arbitrary runtime expression.
export function buildReviewExpression(expectedGuestHash,runId) {
 if(!/^[a-f0-9]{64}$/u.test(expectedGuestHash)||!/^[a-f0-9-]{36}$/u.test(runId))throw Error('arguments_rejected');
 return `(()=>{
  const key=${JSON.stringify(KEY)};
  if(globalThis[key]!==undefined)return {stage:"already_attempted"};
  const operation={runId:${JSON.stringify(runId)},stage:"pending"};globalThis[key]=operation;
  const fail=(stage)=>{operation.stage=stage;return {stage};};
  if(typeof __DEV__==="undefined"||!__DEV__||!globalThis.HermesInternal||globalThis[Symbol.for("patternly.perf06.list-measurement.v1")])return fail("runtime_rejected");
  if(typeof __r?.getModules!=="function")return fail("owner_unavailable");
  const modules=Array.from(__r.getModules().entries());
  const load=(suffix)=>{const found=modules.filter(([,m])=>m.isInitialized&&typeof m.verboseName==="string"&&m.verboseName.endsWith(suffix));if(found.length!==1)throw Error("owner_unavailable");return __r(found[0][0]);};
  try{
   const runtime=load("src/infrastructure/runtime/runtimeMode.ts");
   if(!runtime.isPatternlySmokeRuntime())return fail("runtime_rejected");
   const storage=load("src/infrastructure/storage/mmkvClient.ts");
   if(storage.inspectPreparedQ13StorageReadiness().kind!=="ready")return fail("storage_not_ready");
   const lease=storage.captureActiveProfileStorageLease();
   if(!lease||!storage.isActiveProfileStorageLeaseCurrent(lease)||lease.profile.kind!=="guest"||lease.profile.accountId!==null)return fail("guest_rejected");
   const hash=load("src/infrastructure/identity/sha256.ts").sha256Utf8;
   if(hash(lease.profile.id)!==${JSON.stringify(expectedGuestHash)})return fail("guest_rejected");
   const Home=load("src/features/home/HomeScreen.tsx").HomeScreen;
   const hook=globalThis.__REACT_DEVTOOLS_GLOBAL_HOOK__;
   if(!hook?.renderers||typeof hook.getFiberRoots!=="function")return fail("navigation_unavailable");
   const stack=[];for(const id of hook.renderers.keys())for(const root of hook.getFiberRoots(id))stack.push(root.current);
   const seen=new Set(),found=[];
   while(stack.length){const node=stack.pop();if(!node||seen.has(node))continue;if(seen.size>=5000)return fail("tree_limit");seen.add(node);if(node.type===Home)found.push(node.memoizedProps?.navigation);if(node.child)stack.push(node.child);if(node.sibling)stack.push(node.sibling);}
   if(found.length!==1||typeof found[0]?.navigate!=="function"||typeof found[0]?.getState!=="function")return fail("navigation_unavailable");
   const navigation=found[0],state=navigation.getState();
   if(state?.routes?.[state.index]?.name!=="Home")return fail("route_rejected");
   if(!storage.isActiveProfileStorageLeaseCurrent(lease))return fail("guest_changed");
   operation.stage="navigation_pending";
   navigation.navigate("MistakesReview");
   operation.stage="navigation_requested";return {stage:operation.stage,visited:seen.size};
  }catch{return fail(operation.stage==="navigation_pending"?"navigation_uncertain":"owner_unavailable");}
 })()`;
}

export async function openNativeRegularReview(expectedGuestHash,{statusOnly=false}={}) {
 const metro=parseOrigin('http://127.0.0.1:8082');
 const response=await fetch(new URL('/json/list',metro),{signal:AbortSignal.timeout(5000),redirect:'error'});
 if(!response.ok)throw Error('discovery_failed');
 const body=await response.text();if(body.length>65536)throw Error('target_rejected');
 const endpoint=selectTarget(JSON.parse(body),metro);
 const WebSocket=createRequire(new URL('../../node_modules/@react-native/dev-middleware/package.json',import.meta.url))('ws');
 const socket=new WebSocket(endpoint,{origin:metro.origin,handshakeTimeout:5000,maxPayload:131072,followRedirects:false});
 try{
  await new Promise((accept,reject)=>{socket.once('open',accept);socket.once('error',()=>reject(Error('connect_failed')));});
  const expression=statusOnly?`(()=>{const value=globalThis[${JSON.stringify(KEY)}];return {stage:value?.stage??"not_attempted"};})()`:buildReviewExpression(expectedGuestHash,randomUUID());
  const result=await request(socket,1,'Runtime.evaluate',{expression,returnByValue:true,silent:true});
  if(result.error||result.result?.exceptionDetails)throw Error('evaluation_uncertain');
  const value=result.result?.result?.value;
  if(!value||typeof value.stage!=='string'||!/^[a-z_]{1,40}$/u.test(value.stage))throw Error('evaluation_uncertain');
  return {schema:'patternly.perf06.regular-review.v1',...value};
 }finally{socket.terminate();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const [argument,...extra]=process.argv.slice(2);
 if(extra.length||(!/^[a-f0-9]{64}$/u.test(argument??'')&&argument!=='--status')){console.error('arguments_rejected');process.exitCode=1;}
 else openNativeRegularReview(argument,{statusOnly:argument==='--status'}).then(value=>{console.log(JSON.stringify(value));if(value.stage!=='navigation_requested')process.exitCode=1;}).catch(()=>{console.error('navigation_observation_uncertain_use_status_and_UI_do_not_retry');process.exitCode=1;});
}
