import { existsSync, readFileSync, realpathSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { createRequire } from "node:module";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { buildEnvironmentProbeExpression } from "./probeEnvironmentGuardIos.mjs";
import { parseOrigin, request, selectTarget } from "./readNativeStartupTrace.mjs";

const appId = "com.lkurczab.patternly.sec03";
export function buildSec03AccountStateExpression({ fingerprint, dependencyPrefix, apiKey, environment, action = "revenuecat", stageKey }) {
  if (!["revenuecat", "package", "observe", "recovery"].includes(action)) throw Error("arguments_rejected");
  if (!/^[a-f0-9]{64}$/u.test(fingerprint ?? "") || !/^test_[A-Za-z0-9]+$/u.test(apiKey ?? "")) throw Error("arguments_rejected");
  if (!environment || environment.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY !== apiKey || environment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN !== "http://127.0.0.1:8080") throw Error("arguments_rejected");
  if (stageKey !== undefined && !/^__sec03RC_[a-f0-9]{32}$/u.test(stageKey)) throw Error("arguments_rejected");
  const preflight = buildEnvironmentProbeExpression("inspect", fingerprint, appId, dependencyPrefix);
  return `(async()=>{
    const stage=value=>{if(${JSON.stringify(stageKey ?? null)})globalThis[${JSON.stringify(stageKey ?? null)}]={kind:'pending',stage:value};};
    stage('preflight');
    const preflight=await ${preflight};
    if(preflight.fingerprint!==${JSON.stringify(fingerprint)} || !preflight.configMatches || preflight.state!=='ready' || !preflight.rootInitialized || !Object.values(preflight.protectedModules).every(Boolean))throw Error('runtime_rejected');
    const modules=Array.from(__r.getModules().entries());
    const load=path=>{const exact=path.startsWith('node_modules/')?${JSON.stringify(dependencyPrefix)}+path.slice(13):path;const matches=modules.filter(([,v])=>v.verboseName===exact);if(matches.length!==1||!matches[0][1].isInitialized)throw Error('owner_unavailable');return __r(matches[0][0]);};
    const identity=load('src/infrastructure/runtime/environmentIdentity.ts');
    if(identity.readEnvironmentIdentity().apiOrigin!=='http://127.0.0.1:8080'||identity.createEnvironmentIdentity(${JSON.stringify(environment)}).fingerprint!==preflight.fingerprint)throw Error('configuration_rejected');
    const constants=load('node_modules/expo-constants/build/Constants.js').default;
    if(constants.expoConfig?.ios?.bundleIdentifier!==${JSON.stringify(appId)})throw Error('runtime_rejected');
    const config=load('src/infrastructure/firebase/publicConfig.ts');
    const firebase=config.readFirebaseClientConfiguration();
    const emulator=config.readDevelopmentFirebaseAuthEmulatorOrigin();
    if(firebase.kind!=='configured'||emulator!=='http://127.0.0.1:19099')throw Error('runtime_rejected');
    const auth=load('src/infrastructure/firebase/firebaseAuthClient.ts').createFirebaseAuthClient({config:firebase.value,authActionOrigin:'http://127.0.0.1:8080',authEmulatorOrigin:emulator});
    const before=auth.getSnapshot();
    if(!before||before.providers.length!==1||before.providers[0]!=='password')throw Error('auth_not_ready');
    const api=load('src/infrastructure/clients/PatternlyApiClientAdapter.ts').createPatternlyApiClient({allowLocalHttpForSimulator:true,apiOrigin:'http://127.0.0.1:8080',getIdToken:auth.getIdToken});
    if(${JSON.stringify(action)}==='observe'){
      const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
      const generation=await auth.getAuthorizationGeneration();
      let account;
      try{const me=await api.getMe();account={kind:'observed',accountIdSha256:hash(me.user.id),subjectMatches:me.user.identity.subject===before.uid};}catch(error){account={kind:'unavailable',category:['authorization_generation_required','authorization_generation_stale','account_not_found'].includes(error.serverCode)?error.serverCode:'local_account_unavailable'};}
      const authRecord=await load('src/infrastructure/firebase/secureAuthPersistence.ts').inspectQ13SecureAuthPersistence(undefined,uid=>uid===before.uid);
      const vault=load('src/infrastructure/security/recoveryOperationVault.ts');
      const vaultRecord=await vault.createSecureRecoveryOperationVault().load();
      const vaultReceipt=await vault.inspectQ13RecoveryOperationVault();
      const profile=load('src/infrastructure/storage/mmkvClient.ts').getActiveStorageProfileOrNull();
      return {schema:'patternly.sec03-protected-state.v1',fingerprint:${JSON.stringify(fingerprint)},appId:${JSON.stringify(appId)},firebaseUidSha256:hash(before.uid),generation,account,auth:authRecord,vault:vaultReceipt,vaultState:vaultRecord?{kind:vaultRecord.kind,status:vaultRecord.status,operationIdSha256:hash(vaultRecord.operationId),...(vaultRecord.kind==='issue'?{savedIntent:vaultRecord.savedIntent,codeCount:vaultRecord.codes?.length??0,firebaseUidMatches:vaultRecord.firebaseUid===before.uid,authorizationGeneration:vaultRecord.authorizationGeneration}:{} )}:null,profile:profile?{kind:profile.kind,profileIdSha256:hash(profile.id),accountIdSha256:profile.accountId?hash(profile.accountId):null}:null};
    }
    stage('local_account_read');
    const me=await api.getMe();
    if(auth.getSnapshot()?.uid!==before.uid||me.user.identity.subject!==before.uid||!/^[0-9a-f-]{36}$/i.test(me.user.id))throw Error('identity_rejected');
    if(${JSON.stringify(action)}==='recovery'){
      const generation=await auth.getAuthorizationGeneration();
      const storage=load('src/infrastructure/storage/mmkvClient.ts');
      const profile=storage.getActiveStorageProfileOrNull();
      if(!Number.isSafeInteger(generation)||generation<1||auth.getSnapshot()?.uid!==before.uid||profile?.kind!=='account'||profile.accountId!==me.user.id||storage.isProfileTransitionActive())throw Error('auth_not_ready');
      const vaultModule=load('src/infrastructure/security/recoveryOperationVault.ts');
      const vault=vaultModule.createSecureRecoveryOperationVault();
      if(await vault.load()!==null)throw Error('vault_not_empty');
      const crypto=load('node_modules/expo-crypto/build/Crypto.js');
      const coordinator=load('src/application/account/recoveryOperationCoordinator.ts').createRecoveryOperationCoordinator({api,auth,vault,newOperationId:()=>crypto.randomUUID()});
      if((await coordinator.load()).kind!=='idle')throw Error('vault_not_empty');
      stage('recovery_issue_attempted');
      const result=await coordinator.startIssue({firebaseUid:before.uid,authorizationGeneration:generation});
      if(result.kind!=='issue'||result.status!=='result_available'||result.codes?.length!==10||result.savedIntent!==false)throw Error('recovery_issue_unresolved');
      const receipt=await vaultModule.inspectQ13RecoveryOperationVault();
      if(receipt.kind!=='observed'||receipt.record!=='present')throw Error('recovery_issue_unresolved');
      const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
      return {schema:'patternly.sec03-recovery-preparation.v1',fingerprint:${JSON.stringify(fingerprint)},appId:${JSON.stringify(appId)},status:result.status,codeCount:result.codes.length,savedIntent:result.savedIntent,operationIdSha256:hash(result.operationId),authorizationGeneration:generation,vault:receipt,interruption:'after_local_result_persistence_and_server_issue_before_saved_intent_and_ACK',scope:'real_coordinator_and_adapters_only_not_Settings_reauth_UX'};
    }
    if(${JSON.stringify(action)}==='package'){
      const storage=load('src/infrastructure/storage/mmkvClient.ts');
      const profile=storage.getActiveStorageProfileOrNull();
      if(profile?.kind!=='account'||profile.accountId!==me.user.id||storage.isProfileTransitionActive())throw Error('profile_not_ready');
      stage('local_package_install_attempted');
      load('src/application/premiumTesting.ts').setPremiumTestingAccess(true);
      const installed=await load('src/content/application/nodePackageInstaller.ts').installPremiumNodeOffer({api,offerId:'aud-04-local-smoke-package-fixture',appVersion:'0.1.0',assertActivationAllowed:()=>{const current=storage.getActiveStorageProfileOrNull();if(auth.getSnapshot()?.uid!==before.uid||current?.kind!=='account'||current.accountId!==me.user.id||storage.isProfileTransitionActive())throw Error('profile_not_ready');}});
      if(installed.identity.nodeId!=='aud04_local_smoke_fixture'||installed.identity.artifactSha256!=='cab88ae60938984308e535b5265bcd487a42f375a860df1bbd6b99012ca4c27b'||installed.artifactBytes.length===0)throw Error('package_failed');
      return {schema:'patternly.sec03-local-package-preparation.v1',fingerprint:${JSON.stringify(fingerprint)},appId:${JSON.stringify(appId)},source:'local_smoke_fixture',identity:installed.identity,artifactBytes:installed.artifactBytes.length,packageBytes:installed.manifest.packageSize};
    }
    const native=load('node_modules/react-native/Libraries/BatchedBridge/NativeModules.js').default?.RNPurchases;
    if(typeof native?.isConfigured!=='function'||typeof native?.getAppUserID!=='function')throw Error('native_unavailable');
    if(await native.isConfigured()!==false)throw Error('sdk_already_configured');
    const purchases=load('src/infrastructure/purchases/index.ts');
    // Test-only cache acceptance. This does not enable checkout UI or a purchase.
    const purchaseConfig=purchases.readPurchaseConfig({EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY:${JSON.stringify(apiKey)}},me.user.id,true);
    if(!purchaseConfig)throw Error('configuration_rejected');
    const adapter=purchases.createPurchasesAdapter(purchases.createRevenueCatGateway(),{platform:'ios',config:purchaseConfig});
    stage('sdk_configure_attempted');
    const configured=await adapter.configure();
    if(configured.status!=='success')throw Error('sdk_configuration_failed');
    stage('customer_info_attempted');
    const customer=await adapter.getCustomerInfo();
    if(customer.status!=='success')throw Error('customer_info_failed');
    const sdkId=await native.getAppUserID();
    if(sdkId!==me.user.id||auth.getSnapshot()?.uid!==before.uid)throw Error('identity_rejected');
    const hash=load('src/infrastructure/identity/sha256.ts').sha256Utf8;
    return {schema:'patternly.sec03-revenuecat-preparation.v1',fingerprint:${JSON.stringify(fingerprint)},appId:${JSON.stringify(appId)},configured:true,customerInfo:'success',identityMatches:true,accountIdSha256:hash(me.user.id),firebaseUidSha256:hash(before.uid)};
  })()`;
}

export async function prepareSec03AccountStateIos(projectRoot, environmentFile, receiptFile, action = "revenuecat") {
  if (!["revenuecat", "package", "observe", "recovery", "status"].includes(action)) throw Error("arguments_rejected");
  const project = realpathSync(projectRoot);
  if (!/^\/private\/tmp\/patternly-sec03-isolated-[A-Za-z0-9]+\/attempt-[0-9]+\/project$/u.test(project)) throw Error("arguments_rejected");
  const run = resolve(project, "..");
  if (resolve(environmentFile) !== resolve(run, "environment-A.json") || !(action === "observe" ? ["state-A-before.json","state-A-after.json","state-A-diagnostic.json"].map(name=>resolve(run,name)).includes(resolve(receiptFile)) : resolve(receiptFile) === resolve(run, action === "package" ? "local-package-A.json" : action === "recovery" ? "recovery-A.json" : "revenuecat-A.json"))
    || (statSync(environmentFile).mode & 0o077) || (statSync(run).mode & 0o077)) throw Error("arguments_rejected");
  if (action !== "status" && (existsSync(receiptFile) || existsSync(resolve(run,"revenuecat-pending.json")))) throw Error("attempt_exists_inspect_first");
  const root = realpathSync(new URL("../../node_modules", import.meta.url));
  if (realpathSync(resolve(project, "node_modules")) !== root) throw Error("arguments_rejected");
  const dependencyPrefix = `${relative(project, root)}/`;
  const environment = JSON.parse(readFileSync(environmentFile, "utf8"));
  if (environment.EXPO_PUBLIC_PATTERNLY_API_ORIGIN !== "http://127.0.0.1:8080") throw Error("arguments_rejected");
  const fingerprint = JSON.parse(readFileSync(resolve(run, "config-A.json"), "utf8")).expo.extra.patternlyEnvironmentFingerprint;
  const identityEnvironment=Object.fromEntries(Object.entries(environment).filter(([key])=>["RUNTIME_MODE","PUBLIC_ENVIRONMENT","BACKEND_E2E","API_ORIGIN","FIREBASE_AUTH_EMULATOR_ORIGIN","FIREBASE_PROJECT_ID","FIREBASE_APP_ID","FIREBASE_AUTH_DOMAIN","REVENUECAT_IOS_API_KEY"].some(suffix=>key===`EXPO_PUBLIC_PATTERNLY_${suffix}`)));

  const origin = parseOrigin("http://127.0.0.1:8081");
  const endpoint = selectTarget(await (await fetch(new URL("/json/list", origin), {signal:AbortSignal.timeout(5000)})).json(), origin, appId);
  const require = createRequire(new URL("../../node_modules/@react-native/dev-middleware/package.json", import.meta.url));
  const WebSocket = require("ws");
  const socket = new WebSocket(endpoint,{origin:origin.origin,handshakeTimeout:5000,maxPayload:128*1024,followRedirects:false});
  const pendingPath=resolve(run,"revenuecat-pending.json");
  const pending=action==='status'?JSON.parse(readFileSync(pendingPath,'utf8')):null;
  if(pending&&(pending.appId!==appId||pending.fingerprint!==fingerprint||!/^__sec03RC_[a-f0-9]{32}$/u.test(pending.key)))throw Error('arguments_rejected');
  const key = pending?.key ?? `__sec03RC_${randomUUID().replaceAll("-", "")}`;
  const expression = buildSec03AccountStateExpression({fingerprint,dependencyPrefix,apiKey:environment.EXPO_PUBLIC_PATTERNLY_REVENUECAT_IOS_API_KEY,environment:identityEnvironment,action:action === "status" ? "revenuecat" : action,stageKey:key});
  let id=0;
  let settled=false;
  const evaluate=async expression=>{const value=await request(socket,++id,"Runtime.evaluate",{expression,returnByValue:true,silent:true});if(value.error||value.result?.exceptionDetails)throw Error("evaluation_rejected");return value.result?.result?.value;};
  try {
    await new Promise((accept,reject)=>{socket.once("open",accept);socket.once("error",()=>reject(Error("connect_failed")));});
    if(action==='status'){
      const value=JSON.parse(await evaluate(`JSON.stringify((()=>{const state=globalThis[${JSON.stringify(key)}];return state??{kind:'unavailable',category:'attempt_state_unavailable'};})())`));
      return {schema:'patternly.sec03-cache-attempt-status.v1',...value};
    }
    writeFileSync(pendingPath,JSON.stringify({schema:"patternly.sec03-rc-pending.v1",key,appId,fingerprint,action,stage:"attempt_unsettled_do_not_retry"})+"\n",{mode:0o600,flag:"wx"});
    await evaluate(`(()=>{globalThis[${JSON.stringify(key)}]={kind:'pending'};Promise.resolve().then(()=>${expression}).then(value=>globalThis[${JSON.stringify(key)}]={kind:'done',value}).catch(error=>{const allowed=['runtime_rejected','owner_unavailable','auth_not_ready','identity_rejected','native_unavailable','sdk_already_configured','configuration_rejected','sdk_configuration_failed','customer_info_failed','profile_not_ready','package_failed','vault_not_empty','recovery_issue_unresolved'];globalThis[${JSON.stringify(key)}]={kind:'failed',category:allowed.includes(error?.message)?error.message:'preparation_failed'};});return 'started';})()`);
    for(let attempt=0;attempt<120;attempt++){
      const value=JSON.parse(await evaluate(`JSON.stringify(globalThis[${JSON.stringify(key)}])`));
      if(value.kind==='done'){settled=true;writeFileSync(receiptFile,JSON.stringify(value.value)+"\n",{mode:0o600,flag:'wx'});return value.value;}
      if(value.kind!=='pending')throw Error(value.category);
      await new Promise(accept=>setTimeout(accept,250));
    }
    throw Error("preparation_timeout_do_not_retry_without_inspection");
  }finally{if(settled)unlinkSync(pendingPath);if(settled&&socket.readyState===WebSocket.OPEN)await evaluate(`delete globalThis[${JSON.stringify(key)}]`).catch(()=>{});socket.terminate();}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const [project,environment,receipt,action = "revenuecat",...extra]=process.argv.slice(2);
  if(!project||!environment||!receipt||extra.length){console.error('{"stage":"sec03_account_state","category":"arguments_rejected"}');process.exitCode=1;}
  else prepareSec03AccountStateIos(project,environment,receipt,action).then(value=>console.log(JSON.stringify(value))).catch(error=>{
    const safe=new Set(['arguments_rejected','runtime_rejected','owner_unavailable','auth_not_ready','identity_rejected','native_unavailable','sdk_already_configured','configuration_rejected','sdk_configuration_failed','customer_info_failed','preparation_failed','preparation_timeout_do_not_retry_without_inspection','evaluation_rejected','connect_failed','target_rejected','configuration_rejected','attempt_exists_inspect_first','profile_not_ready','package_failed','vault_not_empty','recovery_issue_unresolved']);
    console.error(JSON.stringify({stage:'sec03_account_state',category:safe.has(error?.message)?error.message:'preparation_failed'}));process.exitCode=1;
  });
}
