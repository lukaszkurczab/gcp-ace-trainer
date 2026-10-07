#!/usr/bin/env node
// Explicit read-only post-cold evidence command. It never changes app or native storage.
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, fsyncSync, lstatSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import WebSocket from 'ws';
import { readExpectedBaseline } from './run-canary.mjs';

const APP_ID = 'com.lkurczab.patternly';
const DEVICE_NAME = 'iPhone 17';
const ORIGIN = 'http://127.0.0.1:8081';
const TARGET_URL = 'http://[::1]:8081/json/list';
const MMKV_SOURCE = 'src/infrastructure/storage/mmkvClient.ts';
const TOOL_DIRECTORY = 'docs/active/BIZQ-01/guest-removal-34';
const STAGE2_REMOVAL_PATH = `${TOOL_DIRECTORY}/STAGE2-NATIVE-REMOVAL.json`;
const STAGE1_RECONCILIATION_PATH = `${TOOL_DIRECTORY}/STAGE1-NATIVE-RECONCILIATION.json`;
const OLD_DATASET_HASH = 'b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d';
const NEW_DATASET_HASH = '9713fdb2e895fdefbd4f304e3617151f55dfe9b286a226340c2824e1fd2ab6e3';
const JOURNAL_KEY = 'patternly.profile-removal.v1';
const STORAGE_INSTALLATION_KEY = 'patternly:canonical:v1:guest-installation';
const SECURE_KEYS = Object.freeze(['patternly.profile-root.v1.a','patternly.profile-root.v1.b','patternly.local-logout-control.v2',JOURNAL_KEY]);
const SAFE_FAILURES = new Set(['usage_invalid','baseline_unavailable','inspector_target_list_unavailable','inspector_target_list_invalid','inspector_target_identity_ambiguous','inspector_target_identity_invalid','inspector_enable_failed','inspector_command_timeout','inspector_timeout','inspector_connection','inspector_close_failed','source_context_unavailable','receipt_destination_invalid','receipt_destination_exists','receipt_write_failed','postcold_result_invalid','postcold_result_missing','inspector_evaluation_failed','module_registry_unavailable','module_metadata_unavailable','module_metadata_ambiguous','initialized_export_unavailable','active_storage_unavailable','guest_installation_unavailable','guest_identity_mismatch','guest_reconciliation_failed','secure_store_read_failed']);
const POSTCOLD_FAILURES = new Set(['module_registry_unavailable','module_metadata_unavailable','initialized_export_unavailable','active_storage_unavailable','guest_identity_unavailable','guest_identity_mismatch','guest_reconciliation_failed','secure_store_read_failed','registry_slots_invalid','postcold_baseline_mismatch','old_prefix_inspection_failed']);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const isDigest = value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const exactKeys = (value, keys) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const safeError = error => SAFE_FAILURES.has(error?.message) ? error.message : 'postcold_result_invalid';

export function selectPostcoldTarget(targets) {
  if (!Array.isArray(targets)) throw new Error('inspector_target_list_invalid');
  const matches=targets.filter(target=>target?.appId===APP_ID&&target?.deviceName===DEVICE_NAME);
  if(matches.length!==1)throw new Error('inspector_target_identity_ambiguous');
  const target=matches[0];
  if(target.type!=='node'||typeof target.webSocketDebuggerUrl!=='string'||!target.webSocketDebuggerUrl.startsWith('ws://[::1]:8081/'))throw new Error('inspector_target_identity_invalid');
  return target;
}

export function buildPostcoldExpected(stage1, removal, baseline) {
  const recon=stage1?.reconciliation;
  if(!exactKeys(stage1,['schemaVersion','result','stage','mode','appId','deviceName','sourceRef','sourceSha256','toolSha256','baselineSha256','capturedAt','reconciliation'])
    ||stage1?.schemaVersion!=='bizq01-guest-removal-reconciliation-evidence-v1'||stage1.mode!=='reconcile'||stage1.result!=='passed'||stage1.stage!=='complete'
    ||stage1.appId!==APP_ID||stage1.deviceName!==DEVICE_NAME||recon?.datasetIdSha256!==OLD_DATASET_HASH||recon.profileTransitionActive!==false||recon.activeLearningWorkPresent!==false
    ||typeof stage1.sourceRef!=='string'||!/^[a-f0-9]{40}$/u.test(stage1.sourceRef)||!isDigest(stage1.sourceSha256)||!isDigest(stage1.toolSha256)||!isDigest(stage1.baselineSha256)
    ||recon.canaryFamilyKeyCount!==0||recon.guestKeyCount!==84||recon.guestRecordCount!==81||recon.guestMetadataKeyCount!==3
    ||recon.registrySlotAValid!==true||recon.registrySlotBValid!==true||recon.registrySlotsMatchBaseline!==true||recon.logoutControlValid!==true||recon.logoutControlMatchesBaseline!==true
    ||!isDigest(recon?.profileIdentityInventorySha256)||!isDigest(recon?.accountStateSha256)
    ||!isDigest(recon?.globalStateSha256)||!isDigest(recon?.pendingPairInventorySha256)||!isDigest(recon?.pendingUidInventorySha256)
    ||recon.accountProfileCount!==9||recon.guestProfileCount!==1||recon.pendingPairCount!==6
    ||!exactKeys(removal,['schemaVersion','result','stage','appId','deviceName','sourceRef','sourceSha256','toolSha256','baselineSha256','operationNonceSha256','capturedAt','replacementProfileIdSha256','removedProfileIdSha256','protectedAccountStateSha256','protectedGlobalStateSha256','logoutControlSha256','removedKeyCount'])
    ||removal?.schemaVersion!=='bizq01-guest-removal-34-evidence-v1'||removal.result!=='passed'||removal.stage!=='complete'
    ||removal.appId!==APP_ID||removal.deviceName!==DEVICE_NAME||removal.removedProfileIdSha256!==OLD_DATASET_HASH
    ||typeof removal.sourceRef!=='string'||!/^[a-f0-9]{40}$/u.test(removal.sourceRef)||!isDigest(removal.sourceSha256)||!isDigest(removal.toolSha256)||!isDigest(removal.baselineSha256)||!isDigest(removal.operationNonceSha256)
    ||!Number.isFinite(Date.parse(removal.capturedAt))||!isDigest(removal.replacementProfileIdSha256)||removal.replacementProfileIdSha256!==NEW_DATASET_HASH||removal.removedKeyCount!==84
    ||removal.protectedAccountStateSha256!==recon.accountStateSha256||removal.protectedGlobalStateSha256!==recon.globalStateSha256
    ||!isDigest(removal.logoutControlSha256)||!Array.isArray(baseline?.expectedProfiles)||baseline.expectedProfiles.length!==10)throw new Error('baseline_unavailable');
  const accounts=baseline.expectedProfiles.filter(profile=>profile.kind==='account');
  const oldGuest=baseline.expectedProfiles.filter(profile=>profile.kind==='guest');
  if(accounts.length!==9||oldGuest.length!==1||oldGuest[0].idSha256!==OLD_DATASET_HASH||accounts.some(profile=>!isDigest(profile.idSha256)||(profile.accountIdSha256!==null&&!isDigest(profile.accountIdSha256))))throw new Error('baseline_unavailable');
  const expectedProfiles=[...accounts,{idSha256:removal.replacementProfileIdSha256,kind:'guest',accountIdSha256:null}].sort((a,b)=>a.idSha256.localeCompare(b.idSha256));
  const expectedProfileIdentityInventorySha256=sha256(JSON.stringify(expectedProfiles));
  if(expectedProfileIdentityInventorySha256===recon.profileIdentityInventorySha256)throw new Error('baseline_unavailable');
  return Object.freeze({
    oldDatasetIdSha256:OLD_DATASET_HASH,
    replacementDatasetIdSha256:removal.replacementProfileIdSha256,
    expectedProfiles:Object.freeze(expectedProfiles),
    profileIdentityInventorySha256:expectedProfileIdentityInventorySha256,
    accountStateSha256:removal.protectedAccountStateSha256,
    globalStateSha256:removal.protectedGlobalStateSha256,
    logoutControlSha256:removal.logoutControlSha256,
    pendingPairInventorySha256:recon.pendingPairInventorySha256,
    pendingUidInventorySha256:recon.pendingUidInventorySha256,
    pendingPairCount:recon.pendingPairCount,
    removalReceiptSha256:sha256(JSON.stringify(removal)),
  });
}

export function validatePostcoldResult(value, expected) {
  const keys=['schemaVersion','result','stage','profileTransitionActive','activeLearningWorkPresent','guestKind','selectedGuestMatches','datasetIdSha256','installationIdSha256','accountProfileCount','guestProfileCount','profileIdentityInventorySha256','guestKeyCount','guestRecordCount','guestMetadataKeyCount','guestKeyInventorySha256','canaryFamilyKeyCount','canaryFamilyKeyInventorySha256','oldPrefixKeyCount','registrySlotAValid','registrySlotBValid','registrySlotsMatchExpected','oldGuestAbsentBothSlots','replacementSelectedBothSlots','logoutControlValid','logoutControlMatchesRemoval','pendingPairCount','pendingPairInventorySha256','pendingUidInventorySha256','removalJournalAbsent','accountStateSha256','globalStateSha256','logoutControlSha256'];
  const digestFields=['datasetIdSha256','installationIdSha256','profileIdentityInventorySha256','guestKeyInventorySha256','canaryFamilyKeyInventorySha256','pendingPairInventorySha256','pendingUidInventorySha256','accountStateSha256','globalStateSha256','logoutControlSha256'];
  if(exactKeys(value,['schemaVersion','result','stage'])&&value.schemaVersion==='bizq01-guest-removal-postcold-v1'&&value.result==='failed'&&POSTCOLD_FAILURES.has(value.stage))return value;
  if(!exactKeys(value,keys)||value.schemaVersion!=='bizq01-guest-removal-postcold-v1'||value.result!=='passed'||value.stage!=='complete'
    ||typeof value.profileTransitionActive!=='boolean'||typeof value.activeLearningWorkPresent!=='boolean'||typeof value.selectedGuestMatches!=='boolean'
    ||!['guest','unknown'].includes(value.guestKind)||!['registrySlotAValid','registrySlotBValid','registrySlotsMatchExpected','oldGuestAbsentBothSlots','replacementSelectedBothSlots','logoutControlValid','logoutControlMatchesRemoval','removalJournalAbsent'].every(key=>typeof value[key]==='boolean')
    ||!['accountProfileCount','guestProfileCount','guestKeyCount','guestRecordCount','guestMetadataKeyCount','canaryFamilyKeyCount','oldPrefixKeyCount','pendingPairCount'].every(key=>Number.isSafeInteger(value[key]))
    ||!digestFields.every(key=>isDigest(value[key])))throw new Error('postcold_result_invalid');
  if(value.profileTransitionActive!==false||value.activeLearningWorkPresent!==false||value.guestKind!=='guest'||value.selectedGuestMatches!==true
    ||value.datasetIdSha256!==expected.replacementDatasetIdSha256||value.profileIdentityInventorySha256!==expected.profileIdentityInventorySha256
    ||value.accountProfileCount!==9||value.guestProfileCount!==1||value.guestKeyCount!==3||value.guestRecordCount!==0||value.guestMetadataKeyCount!==3||value.canaryFamilyKeyCount!==0||value.oldPrefixKeyCount!==0
    ||!value.registrySlotAValid||!value.registrySlotBValid||!value.registrySlotsMatchExpected||!value.oldGuestAbsentBothSlots||!value.replacementSelectedBothSlots
    ||!value.logoutControlValid||!value.logoutControlMatchesRemoval||value.pendingPairCount!==expected.pendingPairCount
    ||value.pendingPairInventorySha256!==expected.pendingPairInventorySha256||value.pendingUidInventorySha256!==expected.pendingUidInventorySha256||!value.removalJournalAbsent
    ||value.accountStateSha256!==expected.accountStateSha256||value.globalStateSha256!==expected.globalStateSha256||value.logoutControlSha256!==expected.logoutControlSha256)throw new Error('postcold_result_invalid');
  return value;
}

export function parsePostcoldArgs(argv) {
  if(argv.length!==3||argv[0]!=='postcold'||argv[1]!=='--receipt')throw new Error('usage_invalid');
  const path=resolve(argv[2]??'');
  if(!argv[2]||dirname(path)!=='/private/tmp'||basename(path).length<5)throw new Error('receipt_destination_invalid');
  try{lstatSync(path);throw new Error('receipt_destination_exists')}catch(error){if(error?.code!=='ENOENT')throw error;}
  return Object.freeze({receiptPath:path});
}

export function evaluatePostcoldExpression(marker, expected) {
  return `(() => {
    const marker=${JSON.stringify(marker)}, expected=${JSON.stringify(expected)};
    const own=(o,k)=>{if(!o||(typeof o!=='object'&&typeof o!=='function'))return undefined;const d=Object.getOwnPropertyDescriptor(o,k);return d&&Object.prototype.hasOwnProperty.call(d,'value')?d.value:undefined;};
    const send=x=>console.log(marker,JSON.stringify(x));
    const fail=stage=>send({schemaVersion:'bizq01-guest-removal-postcold-v1',result:'failed',stage});
    const metro=globalThis.__r,getModules=own(metro,'getModules');if(typeof getModules!=='function')return fail('module_registry_unavailable');
    let modules;try{modules=getModules.call(metro)}catch{return fail('module_metadata_unavailable')}if(!modules)return fail('module_registry_unavailable');
    const all=[...modules.values()];const initialized=path=>{const found=all.filter(m=>{const n=own(m,'verboseName');return typeof n==='string'&&(n===path||n.endsWith('/'+path));});if(found.length!==1||own(found[0],'isInitialized')!==true)return null;return own(own(found[0],'publicModule'),'exports');};
    const mmkv=initialized(${JSON.stringify(MMKV_SOURCE)}),secure=initialized('node_modules/expo-secure-store/build/SecureStore.js'),shaMod=initialized('src/infrastructure/identity/sha256.ts'),sha=own(shaMod,'sha256Utf8');
    const getStorage=own(mmkv,'getKeyValueStorage'),inspect=own(mmkv,'inspectBizq01GuestRemoval34Canary'),inspectOldPrefix=own(mmkv,'inspectRemovedOriginalGuest34'),active=own(mmkv,'getActiveStorageProfileOrNull'),getSecureItem=own(secure,'getItemAsync');
    if(typeof getStorage!=='function'||typeof inspect!=='function'||typeof inspectOldPrefix!=='function'||typeof active!=='function'||typeof getSecureItem!=='function'||typeof sha!=='function')return fail('initialized_export_unavailable');
    const isHash=x=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
    const identity=raw=>{if(typeof raw!=='string')return null;let e;try{e=JSON.parse(raw)}catch{return null}if(!e||typeof e!=='object'||Object.keys(e).sort().join('|')!=='payload|revision|schemaIdentity'||e.schemaIdentity!=='patternly:canonical:v1'||!Number.isSafeInteger(e.revision)||e.revision<1)return null;const p=e.payload;if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join('|')!=='accountId|bindingState|installationId|localDatasetId'||p.bindingState!=='guest'||p.accountId!==null||typeof p.installationId!=='string'||typeof p.localDatasetId!=='string')return null;return{datasetIdSha256:sha(p.localDatasetId),installationIdSha256:sha(p.installationId),datasetId:p.localDatasetId};};
    const parseSlot=raw=>{if(typeof raw!=='string')return null;let r;try{r=JSON.parse(raw)}catch{return null}if(!r||typeof r!=='object'||Object.keys(r).sort().join('|')!=='checksum|generation|legacyProfileId|profiles|selectedProfileId|version'||r.version!==1||!Number.isSafeInteger(r.generation)||r.generation<1||r.legacyProfileId!==null||typeof r.selectedProfileId!=='string'||!Array.isArray(r.profiles))return null;const {checksum,...body}=r;if(!isHash(checksum)||sha(JSON.stringify(body))!==checksum||r.profiles.length!==10)return null;const ids=[];for(const p of r.profiles){if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join('|')!=='accountId|id|kind'||typeof p.id!=='string'||!/^([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i.test(p.id)||(p.kind!=='account'&&p.kind!=='guest')||(p.kind==='account'&&(typeof p.accountId!=='string'||!p.accountId.trim()))||(p.kind==='guest'&&p.accountId!==null))return null;ids.push({idSha256:sha(p.id),kind:p.kind,accountIdSha256:p.accountId===null?null:sha(p.accountId)});}ids.sort((a,b)=>a.idSha256.localeCompare(b.idSha256));const selectedGuest=r.profiles.filter(p=>p.kind==='guest').length===1&&sha(r.selectedProfileId)===expected.replacementDatasetIdSha256;return{generation:r.generation,ids,inventorySha256:sha(JSON.stringify(ids)),selectedGuest,oldAbsent:ids.every(p=>p.idSha256!==expected.oldDatasetIdSha256),selectedIdSha256:sha(r.selectedProfileId)};};
    const sendFailure=stage=>fail(stage);
    (async()=>{try{
      const storage=getStorage.call(mmkv),getString=own(storage,'getString');if(typeof getString!=='function')return sendFailure('active_storage_unavailable');
      const marker=identity(getString.call(storage,${JSON.stringify(STORAGE_INSTALLATION_KEY)}));if(!marker||marker.datasetIdSha256!==expected.replacementDatasetIdSha256)return sendFailure('guest_identity_mismatch');
      const state=inspect.call(mmkv,marker.datasetIdSha256,marker.installationIdSha256);const oldPrefix=inspectOldPrefix.call(mmkv,marker.datasetIdSha256,marker.installationIdSha256);const current=active.call(mmkv);
      if(!oldPrefix||oldPrefix.result!=='observed'||oldPrefix.stage!=='complete'||oldPrefix.oldPrefixKeyCount!==0)return sendFailure('old_prefix_inspection_failed');
      if(!state||state.result!=='observed'||!current||typeof current!=='object'||own(current,'kind')!=='guest'||own(current,'id')!==marker.datasetId)return sendFailure('guest_reconciliation_failed');
      const options={keychainService:'com.lkurczab.patternly.encrypted-storage'};const raw=await Promise.all(${JSON.stringify(SECURE_KEYS)}.map(k=>getSecureItem.call(secure,k,options)));
      const a=parseSlot(raw[0]),b=parseSlot(raw[1]);if(!a||!b)return sendFailure('registry_slots_invalid');
      const expectedSet=JSON.stringify(expected.expectedProfiles), registryMatches=JSON.stringify(a.ids)===expectedSet&&JSON.stringify(b.ids)===expectedSet&&a.inventorySha256===expected.profileIdentityInventorySha256&&b.inventorySha256===expected.profileIdentityInventorySha256;
      let logout;try{logout=raw[2]===null?null:JSON.parse(raw[2])}catch{logout=null}const logoutValid=!!logout&&Object.keys(logout).sort().join('|')==='blocked|completed|pending|version'&&logout.version===2&&logout.blocked===null&&Array.isArray(logout.pending)&&logout.pending.length===expected.pendingPairCount&&Array.isArray(logout.completed)&&logout.completed.length===0;
      const pairHash=p=>{if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join('|')!=='operationId|uid'||typeof p.uid!=='string'||typeof p.operationId!=='string')throw new Error('bad');return sha(JSON.stringify({uid:p.uid,operationId:p.operationId}))};
      let pairInventory='0'.repeat(64),uidInventory='0'.repeat(64);try{if(logoutValid){const pairs=logout.pending.map(pairHash).sort(),uids=logout.pending.map(p=>sha(p.uid)).sort();pairInventory=sha(JSON.stringify(pairs));uidInventory=sha(JSON.stringify(uids));}}catch{}
      const journalAbsent=raw[3]===null,logoutHash=typeof raw[2]==='string'?sha(raw[2]):'0'.repeat(64);const identitiesExpected=state.profileIdentityInventorySha256===expected.profileIdentityInventorySha256;
      const passed=state.profileTransitionActive===false&&state.activeLearningWorkPresent===false&&state.guestKind==='guest'&&state.selectedGuestMatches===true&&state.datasetIdSha256===expected.replacementDatasetIdSha256
        &&state.guestKeyCount===3&&state.guestRecordCount===0&&state.guestMetadataKeyCount===3&&state.canaryFamilyKeyCount===0
        &&state.accountStateSha256===expected.accountStateSha256&&state.globalStateSha256===expected.globalStateSha256&&identitiesExpected
        &&registryMatches&&a.generation!==b.generation&&a.oldAbsent&&b.oldAbsent&&a.selectedGuest&&b.selectedGuest&&a.selectedIdSha256===marker.datasetIdSha256&&b.selectedIdSha256===marker.datasetIdSha256
        &&logoutValid&&pairInventory===expected.pendingPairInventorySha256&&uidInventory===expected.pendingUidInventorySha256&&logoutHash===expected.logoutControlSha256&&journalAbsent;
      if(!passed)return sendFailure('postcold_baseline_mismatch');
      send({schemaVersion:'bizq01-guest-removal-postcold-v1',result:'passed',stage:'complete',profileTransitionActive:false,activeLearningWorkPresent:false,guestKind:'guest',selectedGuestMatches:true,datasetIdSha256:marker.datasetIdSha256,installationIdSha256:marker.installationIdSha256,accountProfileCount:state.accountProfileCount,guestProfileCount:state.guestProfileCount,profileIdentityInventorySha256:state.profileIdentityInventorySha256,guestKeyCount:state.guestKeyCount,guestRecordCount:state.guestRecordCount,guestMetadataKeyCount:state.guestMetadataKeyCount,guestKeyInventorySha256:state.guestKeyInventorySha256,canaryFamilyKeyCount:state.canaryFamilyKeyCount,canaryFamilyKeyInventorySha256:state.canaryFamilyKeyInventorySha256,oldPrefixKeyCount:oldPrefix.oldPrefixKeyCount,registrySlotAValid:true,registrySlotBValid:true,registrySlotsMatchExpected:true,oldGuestAbsentBothSlots:true,replacementSelectedBothSlots:true,logoutControlValid:true,logoutControlMatchesRemoval:true,pendingPairCount:logout.pending.length,pendingPairInventorySha256:pairInventory,pendingUidInventorySha256:uidInventory,removalJournalAbsent:true,accountStateSha256:state.accountStateSha256,globalStateSha256:state.globalStateSha256,logoutControlSha256:logoutHash});
    }catch{sendFailure('secure_store_read_failed')}})();
  })()`;
}

function consoleResult(packet,marker){
  if(packet?.method!=='Runtime.consoleAPICalled')return null;const args=packet.params?.args;if(args?.[0]?.value!==marker||typeof args?.[1]?.value!=='string')return null;
  try{return JSON.parse(args[1].value)}catch{throw new Error('postcold_result_invalid')}
}

export function writePrivateReceipt(path,value,fileSystem={openSync,writeFileSync,fsyncSync,closeSync}){
  let fd;let directoryFd;
  try{fd=fileSystem.openSync(path,'wx',0o600);fileSystem.writeFileSync(fd,`${JSON.stringify(value,null,2)}\n`,'utf8');fileSystem.fsyncSync(fd);fileSystem.closeSync(fd);fd=undefined;directoryFd=fileSystem.openSync(dirname(path),'r');fileSystem.fsyncSync(directoryFd);fileSystem.closeSync(directoryFd);directoryFd=undefined;}
  catch{throw new Error('receipt_write_failed')}
  finally{if(fd!==undefined)fileSystem.closeSync(fd);if(directoryFd!==undefined)fileSystem.closeSync(directoryFd)}
}

export function persistAfterCleanClose(value,closed,write){if(closed!==true)throw new Error('inspector_close_failed');write(value);}

async function inspect(target,marker,expected){
  const socket=new WebSocket(target.webSocketDebuggerUrl,{origin:ORIGIN});let id=0,failure=null,result=null,closeOk=false,timer;const pending=new Map();
  const command=(method,params={})=>new Promise((resolvePromise,reject)=>{const commandId=++id;const timeout=setTimeout(()=>reject(new Error('inspector_command_timeout')),10000);pending.set(commandId,{resolve:packet=>{clearTimeout(timeout);resolvePromise(packet)}});socket.send(JSON.stringify({id:commandId,method,params}));});
  let resolveClose;const closed=new Promise(resolvePromise=>{resolveClose=resolvePromise});socket.once('close',code=>{closeOk=code===1000;resolveClose(closeOk)});socket.once('error',()=>{failure='inspector_connection';resolveClose(false)});
  socket.on('message',data=>{let packet;try{packet=JSON.parse(data.toString())}catch{return}if(pending.has(packet.id)){const waiter=pending.get(packet.id);pending.delete(packet.id);waiter.resolve(packet)}if(!result){try{result=consoleResult(packet,marker)}catch{failure='postcold_result_invalid'}}});
  timer=setTimeout(()=>{failure='postcold_result_missing';socket.close()},45000);
  try{await new Promise((resolvePromise,reject)=>{if(socket.readyState===WebSocket.OPEN)resolvePromise();else{socket.once('open',resolvePromise);socket.once('error',()=>reject(new Error('inspector_connection')))}});
    const enabled=await command('Runtime.enable');if(enabled.error)throw new Error('inspector_enable_failed');const evaluated=await command('Runtime.evaluate',{expression:evaluatePostcoldExpression(marker,expected),awaitPromise:false,returnByValue:false,silent:true});
    if(evaluated.error||evaluated.result?.exceptionDetails)throw new Error('inspector_evaluation_failed');const start=Date.now();while(!result&&!failure&&Date.now()-start<40000)await new Promise(resolvePromise=>setTimeout(resolvePromise,20));if(!result)throw new Error(failure??'postcold_result_missing');
  }catch(error){failure=safeError(error)}finally{clearTimeout(timer);if(socket.readyState===WebSocket.OPEN)socket.close(1000)}
  await closed;if(!closeOk||failure)throw new Error(failure??'inspector_close_failed');return validatePostcoldResult(result,expected);
}

async function main(){
  try{
    const paths=parsePostcoldArgs(process.argv.slice(2));const baseline=readExpectedBaseline();const stage1=JSON.parse(readFileSync(STAGE1_RECONCILIATION_PATH,'utf8'));const removal=JSON.parse(readFileSync(STAGE2_REMOVAL_PATH,'utf8'));const expected=buildPostcoldExpected(stage1,removal,baseline);
    const head=spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});if(head.status!==0||!/^[a-f0-9]{40}$/u.test(head.stdout.trim()))throw new Error('source_context_unavailable');
    const response=await fetch(TARGET_URL,{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('inspector_target_list_unavailable');const target=selectPostcoldTarget(await response.json());
    const marker=`[bizq01-guest-removal-postcold]:${randomBytes(24).toString('hex')}`;const result=await inspect(target,marker,expected);
    const receipt={schemaVersion:'bizq01-guest-removal-postcold-evidence-v1',result:result.result,stage:result.stage,appId:APP_ID,deviceName:DEVICE_NAME,sourceRef:head.stdout.trim(),mmkvSourceSha256:sha256(readFileSync(MMKV_SOURCE)),toolSha256:sha256(readFileSync(`${TOOL_DIRECTORY}/run-postcold.mjs`)),removalReceiptSha256:expected.removalReceiptSha256,capturedAt:new Date().toISOString(),postcold:result};
    persistAfterCleanClose(receipt,true,value=>writePrivateReceipt(paths.receiptPath,value));process.stdout.write(JSON.stringify({mode:'postcold',result:receipt.result,stage:receipt.stage,evidence:'private_receipt_written'})+'\n');if(result.result!=='passed')process.exitCode=1;
  }catch(error){process.stderr.write(`${safeError(error)}\n`);process.exitCode=1}
}
if(import.meta.url===`file://${process.argv[1]}`)await main();
