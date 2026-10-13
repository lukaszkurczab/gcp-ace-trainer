import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {buildReviewExpression} from './openNativeRegularReview.mjs';

const hash='a'.repeat(64),run='12345678-1234-1234-1234-123456789012';
function runtime({ready=true,guestHash=hash,route='Home',duplicate=false,throws=false}={}) {
 let calls=0,leases=0;
 const Home=()=>{};
 const navigation={getState:()=>({index:0,routes:[{name:route}]}),navigate:name=>{assert.equal(name,'MistakesReview');calls++;if(throws)throw Error('uncertain');}};
 const node={type:Home,memoizedProps:{navigation}};
 if(duplicate)node.child={type:Home,memoizedProps:{navigation}};
 const owners={
  'src/infrastructure/runtime/runtimeMode.ts':{isPatternlySmokeRuntime:()=>true},
  'src/infrastructure/storage/mmkvClient.ts':{
   inspectPreparedQ13StorageReadiness:()=>({kind:ready?'ready':'unavailable'}),
   captureActiveProfileStorageLease:()=>{leases++;return {profile:{id:'private-test-id',kind:'guest',accountId:null}};},
   isActiveProfileStorageLeaseCurrent:()=>true,
  },
  'src/infrastructure/identity/sha256.ts':{sha256Utf8:()=>guestHash},
  'src/features/home/HomeScreen.tsx':{HomeScreen:Home},
 };
 const entries=Object.entries(owners),require=id=>entries[id][1];
 require.getModules=()=>new Map(entries.map(([verboseName],id)=>[id,{verboseName,isInitialized:true}]));
 const context=vm.createContext({__DEV__:true,HermesInternal:{},__r:require,__REACT_DEVTOOLS_GLOBAL_HOOK__:{renderers:new Map([[1,{}]]),getFiberRoots:()=>new Set([{current:node}])}});
 return {evaluate:()=>vm.runInContext(buildReviewExpression(hash,run),context),calls:()=>calls,leases:()=>leases};
}
test('cold storage rejects before acquiring a profile owner',()=>{
 const value=runtime({ready:false});assert.equal(value.evaluate().stage,'storage_not_ready');assert.equal(value.leases(),0);assert.equal(value.calls(),0);
});
test('wrong Guest, non-Home route and ambiguous Home cannot navigate',()=>{
 for(const options of [{guestHash:'b'.repeat(64)},{route:'Practice'},{duplicate:true}]){const value=runtime(options);assert.notEqual(value.evaluate().stage,'navigation_requested');assert.equal(value.calls(),0);}
});
test('navigation is one-shot even when dispatch outcome is uncertain',()=>{
 for(const throws of [false,true]){const value=runtime({throws});assert.equal(value.evaluate().stage,throws?'navigation_uncertain':'navigation_requested');assert.equal(value.evaluate().stage,'already_attempted');assert.equal(value.calls(),1);}
});
