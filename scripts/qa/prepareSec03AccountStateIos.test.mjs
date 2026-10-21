import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { buildSec03AccountStateExpression } from './prepareSec03AccountStateIos.mjs';
const fingerprint='a'.repeat(64);
const prefix='../../../../../Users/test/patternly/node_modules/';
const options={fingerprint,dependencyPrefix:prefix,apiKey:'test_privatekey',environment:{EXPO_PUBLIC_PATTERNLY_API_ORIGIN:'http://127.0.0.1:8080',EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY:'test_privatekey'}};
function fixture({generation=1,profileKind='account',state='ready',configured=false,subject='private-uid',customerStatus='success',configurationMatches=true}={}){
 const calls=[];const modules=new Map();
 const add=(path,exports)=>modules.set(modules.size,{verboseName:path.startsWith('node_modules/')?prefix+path.slice(13):path,isInitialized:true,exports});
 add('src/infrastructure/runtime/environmentIdentity.ts',{readEnvironmentIdentity:()=>({mode:'smoke',fingerprint,apiOrigin:'http://127.0.0.1:8080'}),createEnvironmentIdentity:()=>({fingerprint:configurationMatches?fingerprint:'c'.repeat(64)})});
 add('node_modules/expo-constants/build/Constants.js',{default:{expoConfig:{ios:{bundleIdentifier:'com.lkurczab.patternly.sec03'},extra:{patternlyEnvironmentFingerprint:fingerprint}}}});
 add('src/infrastructure/runtime/environmentGuard.ts',{createNativeEnvironmentMarkerStore:()=>({}),createEnvironmentGuard:()=>({inspect:async()=>state})});
 add('src/RegularApplicationRoot.tsx',{});add('src/infrastructure/storage/mmkvClient.ts',{getActiveStorageProfileOrNull:()=>({kind:profileKind,accountId:'12345678-1234-4234-8234-123456789012'}),isProfileTransitionActive:()=>false});add('src/content/runtime/nodePackageStorage.ts',{});
 add('src/infrastructure/firebase/publicConfig.ts',{readFirebaseClientConfiguration:()=>({kind:'configured',value:{}}),readDevelopmentFirebaseAuthEmulatorOrigin:()=> 'http://127.0.0.1:19099'});
 add('src/infrastructure/firebase/firebaseAuthClient.ts',{createFirebaseAuthClient:()=>({getSnapshot:()=>({uid:'private-uid',providers:['password']}),getIdToken:async()=> 'secret-token',getAuthorizationGeneration:async()=>generation})});
 add('src/infrastructure/clients/PatternlyApiClientAdapter.ts',{createPatternlyApiClient:input=>{assert.equal(input.apiOrigin,'http://127.0.0.1:8080');return {getMe:async()=>{calls.push('getMe');return {user:{id:'12345678-1234-4234-8234-123456789012',identity:{subject}}};}};}});
 add('node_modules/react-native/Libraries/BatchedBridge/NativeModules.js',{default:{RNPurchases:{isConfigured:async()=>{calls.push('isConfigured');return configured;},getAppUserID:async()=>{calls.push('getAppUserID');return '12345678-1234-4234-8234-123456789012';}}}});
 add('src/infrastructure/purchases/index.ts',{readPurchaseConfig:(env,id,enabled)=>{assert.equal(env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY,'test_privatekey');assert.equal(enabled,true);return {apiKey:env.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY,accountId:id};},createRevenueCatGateway:()=>({}),createPurchasesAdapter:()=>({configure:async()=>{calls.push('configure');return {status:'success'};},getCustomerInfo:async()=>{calls.push('getCustomerInfo');return {status:customerStatus};}})});
 add('node_modules/expo-crypto/build/Crypto.js',{randomUUID:()=> '12345678-1234-4234-8234-123456789012'});
 add('src/application/premiumTesting.ts',{setPremiumTestingAccess:()=>calls.push('premiumTestToggle')});
 add('src/content/application/nodePackageInstaller.ts',{installPremiumNodeOffer:async input=>{assert.equal(input.offerId,'aud-04-local-smoke-package-fixture');assert.equal(typeof input.assertActivationAllowed,'function');input.assertActivationAllowed();calls.push('install');return {identity:{nodeId:'aud04_local_smoke_fixture',artifactSha256:'cab88ae60938984308e535b5265bcd487a42f375a860df1bbd6b99012ca4c27b'},artifactBytes:{length:100},manifest:{packageSize:60}};}});
 add('src/infrastructure/firebase/secureAuthPersistence.ts',{inspectQ13SecureAuthPersistence:async(_,affinity)=>({kind:'observed',userRecord:'present',userRecordAffinity:affinity('private-uid')?'matches_current_sdk_uid':'different_or_unavailable'})});
 add('src/infrastructure/identity/sha256.ts',{sha256Utf8:()=> 'b'.repeat(64)});
 const require=id=>modules.get(id).exports;require.getModules=()=>modules;
 return {context:{HermesInternal:{},__DEV__:true,__r:require},calls};
}
test('RC preparation uses only approved cache operations and redacts identifiers',async()=>{
 const f=fixture();const result=await vm.runInNewContext(buildSec03AccountStateExpression(options),f.context);
 assert.deepEqual(f.calls,['getMe','isConfigured','configure','getCustomerInfo','getAppUserID']);
 assert.equal(result.identityMatches,true);assert.equal(JSON.stringify(result).includes('private'),false);
 assert.equal(JSON.stringify(result).includes('12345678'),false);
});
test('blocked or mismatched identity and configured SDK stop before remote RC effects',async()=>{
 for(const [overrides,error,calls]of [[{state:'mismatch'},/runtime_rejected/,[]],[{configurationMatches:false},/configuration_rejected/,[]],[{subject:'other'},/identity_rejected/,['getMe']],[{configured:true},/sdk_already_configured/,['getMe','isConfigured']]]){
  const f=fixture(overrides);await assert.rejects(vm.runInNewContext(buildSec03AccountStateExpression(options),f.context),error);assert.deepEqual(f.calls,calls);
 }
 assert.throws(()=>buildSec03AccountStateExpression({...options,apiKey:'appl_unapproved'}),/arguments_rejected/);
});
test('customer failure is explicit and no identity read follows failure',async()=>{
 const f=fixture({customerStatus:'failure'});await assert.rejects(vm.runInNewContext(buildSec03AccountStateExpression(options),f.context),/customer_info_failed/);assert.deepEqual(f.calls,['getMe','isConfigured','configure','getCustomerInfo']);
});

test('package uses canonical installer in authenticated profile and never configures RC',async()=>{
 const f=fixture();const result=await vm.runInNewContext(buildSec03AccountStateExpression({...options,action:'package'}),f.context);
 assert.deepEqual(f.calls,['getMe','premiumTestToggle','install']);assert.equal(result.source,'local_smoke_fixture');
 const guest=fixture({profileKind:'guest'});await assert.rejects(vm.runInNewContext(buildSec03AccountStateExpression({...options,action:'package'}),guest.context),/profile_not_ready/);assert.deepEqual(guest.calls,['getMe']);
});
test('attempt retains a safe observable stage before SDK effect',async()=>{
 const f=fixture({customerStatus:'failure'});const key='__sec03RC_'+'a'.repeat(32);f.context.globalThis=f.context;
 await assert.rejects(vm.runInNewContext(buildSec03AccountStateExpression({...options,stageKey:key}),f.context),/customer_info_failed/);
 assert.equal(f.context[key].stage,'customer_info_attempted');assert.equal(JSON.stringify(f.context[key]).includes('private'),false);
});

test('state observation emits only hashes and scalar affinity, with no SDK effect',async()=>{
 const f=fixture();const result=await vm.runInNewContext(buildSec03AccountStateExpression({...options,action:'observe'}),f.context);
 assert.equal(result.auth.userRecordAffinity,'matches_current_sdk_uid');assert.equal(result.account.subjectMatches,true);assert.deepEqual(f.calls,['getMe']);
 assert.equal(JSON.stringify(result).includes('private-uid'),false);assert.equal(JSON.stringify(result).includes('12345678'),false);
});
