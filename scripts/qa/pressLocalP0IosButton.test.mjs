import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import vm from 'node:vm';
import { buildLocalP0ButtonExpression } from './pressLocalP0IosButton.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const before = { fingerprint: 'a'.repeat(64), appId: 'com.lkurczab.patternly', state: 'authenticated', uidSha256: hash('uid'), accountIdSha256: hash('account'), profile: {kind:'account',profileIdSha256:hash('profile')}, learning:{sessions:[{status:'active',idSha256:hash('session-u')}]}};
const id = 'patternly:resume:continue:session-u';
function runtime(change = {}) {
  let calls = 0;
  const actor = { state:{kind:'authenticated',user:{uid:'uid'},backendUser:{id:'account'}}, captureHomeResumeActorFence:()=>({isCurrent:()=>true}), retryAccountSync(){} };
  const lease = {profile:{id:'profile',kind:'account',accountId:'account'}};
  const handler = ()=>{calls++;};
  const button = {memoizedProps:{testID:change.testId??id,onPress:handler,disabled:change.disabled??false}};
  const root = {current:{memoizedProps:{value:actor},child:button}};
  if(change.foreignActor) actor.state.user.uid='other';
  if(change.ambiguous) button.sibling={memoizedProps:{testID:id,onPress:()=>{calls++;}}};
  const values = new Map([
    ['src/infrastructure/runtime/environmentIdentity.ts',{readEnvironmentIdentity:()=>({mode:change.mode??'smoke',apiOrigin:'http://127.0.0.1:8080',firebaseProjectId:'patternly-app-sandbox',fingerprint:before.fingerprint})}],
    ['node_modules/expo-constants/build/Constants.js',{default:{expoConfig:{extra:{patternlyEnvironmentFingerprint:before.fingerprint},ios:{bundleIdentifier:before.appId}}}}],
    ['src/infrastructure/identity/sha256.ts',{sha256Utf8:hash}],
    ['src/infrastructure/storage/mmkvClient.ts',{captureActiveProfileStorageLease:()=>lease,isActiveProfileStorageLeaseCurrent:()=>true}],
  ]);
  const modules = new Map([...values].map(([name,value],index)=>[index,{verboseName:name,isInitialized:name!==change.closed,value}]));
  const require = key=>modules.get(key).value;require.getModules=()=>modules;
  return {context:vm.createContext({__DEV__:true,HermesInternal:{},__r:require,__REACT_DEVTOOLS_GLOBAL_HOOK__:{renderers:new Map([[1,{}]]),getFiberRoots:()=>new Set([root])}}),calls:()=>calls};
}
test('the operator cannot choose unrelated actions or another session from a valid receipt',()=>{
  assert.throws(()=>buildLocalP0ButtonExpression('delete',id,before),/arguments_rejected/);
  assert.throws(()=>buildLocalP0ButtonExpression('end',id,before),/arguments_rejected/);
  const r=runtime();assert.throws(()=>vm.runInContext(buildLocalP0ButtonExpression('resume',id,{...before,learning:{sessions:[{status:'active',idSha256:hash('different')}]}}),r.context),/session_rejected/);assert.equal(r.calls(),0);
});
test('cloud, foreign actor, disabled/ambiguous button and uninitialized storage never invoke',()=>{
  for(const change of [{mode:'sandbox'},{foreignActor:true},{disabled:true},{ambiguous:true},{closed:'src/infrastructure/storage/mmkvClient.ts'}]) {
    const r=runtime(change);assert.throws(()=>vm.runInContext(buildLocalP0ButtonExpression('resume',id,before),r.context),/runtime_rejected|actor_rejected|button_rejected|owner_unavailable/);assert.equal(r.calls(),0);
  }
});
test('one matching enabled handler is invoked once; a repeated command cannot duplicate it',()=>{
  for (const [action,testId] of [['resume',id],['leave','patternly:session:leave:session-u'],['end','patternly:session:abandon:session-u']]) {
    const r=runtime({testId}),source=buildLocalP0ButtonExpression(action,testId,before);
    assert.deepEqual(JSON.parse(vm.runInContext(source,r.context)),{schema:'patternly.local-p0-button.v1',action,stage:'invoked',nativeGesture:false});
    assert.equal(r.calls(),1);assert.throws(()=>vm.runInContext(source,r.context),/already_invoked/);assert.equal(r.calls(),1);
  }
});
