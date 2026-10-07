#!/usr/bin/env node
// Explicit Stage 1 modes only. Runtime effects are never run by tests or source QA.
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, fsyncSync, lstatSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import WebSocket from 'ws';

const APP_ID = 'com.lkurczab.patternly';
const DEVICE_NAME = 'iPhone 17';
const ORIGIN = 'http://127.0.0.1:8081';
const TARGET_URL = 'http://[::1]:8081/json/list';
const DATASET_HASH = 'b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d';
const INSTALLATION_HASH = '498a8a5cbc36ed6331567374098786cc922f8133a4afceb7471ca0d77b4de760';
const SOURCE_PATH = 'src/infrastructure/storage/mmkvClient.ts';
const TOOL_DIRECTORY = 'docs/active/BIZQ-01/guest-removal-34';
const ACCOUNT_BASELINE_PATH = 'docs/active/BIZQ-01/premium-completion-33/RESUME-ACCOUNT-ATTESTATION-2026-10-07-02.json';
const GUEST_BASELINE_PATH = 'docs/active/BIZQ-01/premium-native-path-31/PUBLIC-FINAL33-GUEST-2026-10-07-02.json';
const FINAL_BASELINE_PATH = 'docs/active/BIZQ-01/premium-completion-33/FINAL-GUEST-PRESERVATION-2026-10-07-02.json';
const CANARY_STAGES = new Set(['input_invalid','active_profile_unavailable','expected_guest_mismatch','active_learning_work_present','active_learning_state_unavailable','transition_barrier_failed','protected_baseline_unavailable','canary_enumeration_failed','canary_readback_failed','canary_adapter_operation_failed','canary_cleanup_failed','protected_state_changed','complete']);
const RECON_STAGES = new Set(['complete','canary_family_nonempty','guest_baseline_count_mismatch','input_invalid','active_profile_unavailable','expected_guest_mismatch','active_learning_work_present','active_learning_state_unavailable','protected_state_unavailable','registry_module_unavailable','registry_slots_invalid','registry_baseline_mismatch','logout_control_unavailable','logout_control_baseline_mismatch','secure_store_read_failed']);
const SAFE_FAILURES = new Set([...CANARY_STAGES,...RECON_STAGES,'usage_invalid','inspector_target_list_invalid','inspector_target_list_unavailable','inspector_target_identity_ambiguous','inspector_target_identity_invalid','inspector_enable_failed','inspector_command_timeout','inspector_timeout','inspector_connection','inspector_close_failed','canary_result_invalid','canary_result_not_synchronous','reconciliation_result_invalid','canary_runner_failed','source_context_unavailable','receipt_destination_invalid','receipt_destination_exists','receipt_write_failed','intent_destination_invalid','intent_destination_exists','intent_write_failed','reconciliation_receipt_invalid','inspector_evaluation_failed','inspector_console_result_missing']);

const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const exactKeys = (value, keys) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const safeError = (error) => SAFE_FAILURES.has(error?.message) ? error.message : 'canary_runner_failed';
const identityDigest = (identities) => sha256(JSON.stringify([...identities].sort((a,b) => a.idSha256.localeCompare(b.idSha256))));

export function selectCanaryTarget(targets) {
  if (!Array.isArray(targets)) throw new Error('inspector_target_list_invalid');
  const matches = targets.filter((target) => target?.appId === APP_ID && target?.deviceName === DEVICE_NAME);
  if (matches.length !== 1) throw new Error('inspector_target_identity_ambiguous');
  const target = matches[0];
  if (target.type !== 'node' || typeof target.webSocketDebuggerUrl !== 'string' || !target.webSocketDebuggerUrl.startsWith('ws://[::1]:8081/')) throw new Error('inspector_target_identity_invalid');
  return target;
}

export function validateCanaryResult(value) {
  const required = ['result','schemaVersion','stage'];
  const optional = ['accountStateSha256','canaryValueSha256','cleanupVerified','globalStateSha256','protectedAdapterStateSha256','protectedStateUnchanged'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || required.some((key) => !Object.hasOwn(value,key))
    || Object.keys(value).some((key) => !required.includes(key) && !optional.includes(key))
    || value.schemaVersion !== 'bizq01-guest-removal-canary-v1' || !['passed','failed'].includes(value.result) || !CANARY_STAGES.has(value.stage)) throw new Error('canary_result_invalid');
  if (value.result === 'passed' && (value.stage !== 'complete' || value.cleanupVerified !== true || value.protectedStateUnchanged !== true)) throw new Error('canary_result_invalid');
  if (value.result === 'failed' && value.stage === 'complete') throw new Error('canary_result_invalid');
  for (const key of optional) {
    if (key.endsWith('Sha256') && value[key] !== undefined && !/^[a-f0-9]{64}$/u.test(value[key])) throw new Error('canary_result_invalid');
    if (['cleanupVerified','protectedStateUnchanged'].includes(key) && value[key] !== undefined && typeof value[key] !== 'boolean') throw new Error('canary_result_invalid');
  }
  if (value.result === 'passed' && !['accountStateSha256','canaryValueSha256','globalStateSha256','protectedAdapterStateSha256'].every((key) => /^[a-f0-9]{64}$/u.test(value[key] ?? ''))) throw new Error('canary_result_invalid');
  return value;
}

export function validateReconciliationResult(value, expected) {
  const keys = ['schemaVersion','result','stage','profileTransitionActive','activeLearningWorkPresent','guestKind','selectedGuestMatches','installationIdSha256','datasetIdSha256','accountProfileCount','guestProfileCount','profileIdentityInventorySha256','guestKeyCount','guestRecordCount','guestMetadataKeyCount','guestKeyInventorySha256','registrySlotAValid','registrySlotBValid','registrySlotsMatchBaseline','logoutControlValid','logoutControlMatchesBaseline','pendingPairCount','pendingPairInventorySha256','pendingUidInventorySha256','blockedPairSha256','canaryFamilyKeyCount','canaryFamilyKeyInventorySha256','accountStateSha256','globalStateSha256','protectedAdapterStateSha256'];
  const digests = ['profileIdentityInventorySha256','guestKeyInventorySha256','pendingPairInventorySha256','pendingUidInventorySha256','canaryFamilyKeyInventorySha256','accountStateSha256','globalStateSha256','protectedAdapterStateSha256'];
  if (exactKeys(value, ['schemaVersion','result','stage']) && value.schemaVersion === 'bizq01-guest-removal-reconciliation-v1'
    && value.result === 'failed' && RECON_STAGES.has(value.stage)) return value;
  if (!exactKeys(value,keys) || value.schemaVersion !== 'bizq01-guest-removal-reconciliation-v1' || !['passed','failed'].includes(value.result)
    || !RECON_STAGES.has(value.stage) || typeof value.profileTransitionActive !== 'boolean' || value.activeLearningWorkPresent !== false
    || value.guestKind !== 'guest' || value.selectedGuestMatches !== true || value.installationIdSha256 !== INSTALLATION_HASH || value.datasetIdSha256 !== DATASET_HASH
    || value.accountProfileCount !== 9 || value.guestProfileCount !== 1
    || !Number.isSafeInteger(value.guestKeyCount) || !Number.isSafeInteger(value.guestRecordCount) || !Number.isSafeInteger(value.guestMetadataKeyCount)
    || !['registrySlotAValid','registrySlotBValid','registrySlotsMatchBaseline','logoutControlValid','logoutControlMatchesBaseline'].every((key) => typeof value[key] === 'boolean')
    || !Number.isSafeInteger(value.pendingPairCount) || !Number.isSafeInteger(value.canaryFamilyKeyCount)
    || !digests.every((key) => /^[a-f0-9]{64}$/u.test(value[key] ?? ''))
    || (value.blockedPairSha256 !== null && !/^[a-f0-9]{64}$/u.test(value.blockedPairSha256 ?? ''))) throw new Error('reconciliation_result_invalid');
  if (value.result === 'passed' && (value.stage !== 'complete' || value.profileTransitionActive !== false || value.canaryFamilyKeyCount !== 0 || !value.registrySlotAValid || !value.registrySlotBValid
    || !value.registrySlotsMatchBaseline || !value.logoutControlValid || !value.logoutControlMatchesBaseline
    || value.guestKeyCount !== 84 || value.guestRecordCount !== 81 || value.guestMetadataKeyCount !== 3
    || value.pendingPairCount !== 6 || value.blockedPairSha256 !== null
    || value.profileIdentityInventorySha256 !== expected.profileIdentityInventorySha256
    || value.pendingPairInventorySha256 !== expected.pendingPairInventorySha256 || value.pendingUidInventorySha256 !== expected.pendingUidInventorySha256)) throw new Error('reconciliation_result_invalid');
  return value;
}

export function validateReconciliationReceipt(value, source) {
  if (!exactKeys(value,['schemaVersion','mode','result','stage','appId','deviceName','sourceRef','sourceSha256','toolSha256','baselineSha256','capturedAt','reconciliation'])
    || value.schemaVersion !== 'bizq01-guest-removal-reconciliation-evidence-v1' || value.mode !== 'reconcile' || value.result !== 'passed' || value.stage !== 'complete'
    || value.appId !== APP_ID || value.deviceName !== DEVICE_NAME || value.sourceRef !== source.sourceRef || value.sourceSha256 !== source.sourceSha256
    || value.toolSha256 !== source.toolSha256
    || !/^[a-f0-9]{64}$/u.test(value.baselineSha256 ?? '') || !Number.isFinite(Date.parse(value.capturedAt))
    || Date.now() - Date.parse(value.capturedAt) > 10 * 60 * 1000 || Date.parse(value.capturedAt) > Date.now() + 30_000) throw new Error('reconciliation_receipt_invalid');
  const result = validateReconciliationResult(value.reconciliation,source.baseline);
  if (result.result !== 'passed' || result.canaryFamilyKeyCount !== 0) throw new Error('reconciliation_receipt_invalid');
  return value;
}

export async function executeAfterIntent(writeIntent, invokeEffect) { await writeIntent(); return invokeEffect(); }
export async function executeCanaryAfterReconciliation(receipt, source, writeIntent, invokeEffect) {
  validateReconciliationReceipt(receipt,source);
  return executeAfterIntent(writeIntent,invokeEffect);
}
export function persistReceiptAfterCleanClose(receipt, closedSuccessfully, writeReceipt) {
  if (closedSuccessfully !== true) throw new Error('inspector_close_failed');
  writeReceipt(receipt);
}

export function readExpectedBaseline(readFile = readFileSync) {
  let summary; let account; let guest;
  try {
    summary = JSON.parse(readFile(FINAL_BASELINE_PATH,'utf8'));
    account = JSON.parse(readFile(ACCOUNT_BASELINE_PATH,'utf8'));
    guest = JSON.parse(readFile(GUEST_BASELINE_PATH,'utf8'));
  } catch { throw new Error('source_context_unavailable'); }
  const identities = account?.registry?.profileIdentityHashes;
  const guestIdentities = guest?.registry?.profileIdentityHashes;
  const pendingPairs = guest?.logout?.pendingPairHashes;
  const pendingUids = guest?.logout?.pendingUidHashes;
  const unrelatedPairs = account?.logout?.pendingPairHashes;
  if (summary?.schema !== 'bizq01-final-guest-preservation-v1' || summary.profileIdentitiesExact !== true || summary.unrelatedPendingPairsPreserved !== true
    || summary.newPendingPairCount !== 1 || summary.newPendingUidMatchesOwnedAuthUid !== true || summary.records !== 81 || summary.keys !== 84
    || summary.metadataValuesUnread !== 3 || summary.wholeStoreClaim !== false || account?.ok !== true || account?.readonly !== true
    || account?.registry?.accountProfiles !== 9 || account?.registry?.guestProfiles !== 1 || guest?.ok !== true
    || guest?.profile?.counts?.account !== 9 || guest?.profile?.counts?.guest !== 1 || guest?.profile?.kind !== 'guest'
    || guest?.profile?.selectedIdSha256 !== DATASET_HASH || guest?.profile?.soleGuest !== true || !Array.isArray(identities) || identities.length !== 10
    || !Array.isArray(guestIdentities) || guestIdentities.length !== 10 || !Array.isArray(pendingPairs) || pendingPairs.length !== 6
    || !Array.isArray(pendingUids) || pendingUids.length !== 6 || !Array.isArray(unrelatedPairs) || unrelatedPairs.length !== 5
    || guest?.logout?.blockedPairSha256 !== null || unrelatedPairs.some((pair) => !pendingPairs.includes(pair))
    || pendingPairs.filter((pair) => !unrelatedPairs.includes(pair)).length !== 1
    || guestIdentities.some((entry) => !identities.some((baseline) => baseline.idSha256 === entry.idSha256 && baseline.kind === entry.kind && baseline.accountIdSha256 === entry.accountIdSha256))
    || !identities.some((entry) => entry.idSha256 === DATASET_HASH && entry.kind === 'guest' && entry.accountIdSha256 === null)) throw new Error('source_context_unavailable');
  const expectedProfiles = identities.map(({idSha256,kind,accountIdSha256}) => ({idSha256,kind,accountIdSha256}));
  const profileIdentityInventorySha256 = identityDigest(expectedProfiles);
  const pendingPairInventorySha256 = sha256(JSON.stringify([...pendingPairs].sort()));
  const pendingUidInventorySha256 = sha256(JSON.stringify([...pendingUids].sort()));
  const filesHash = [FINAL_BASELINE_PATH,ACCOUNT_BASELINE_PATH,GUEST_BASELINE_PATH].map((path) => `${path}:${sha256(readFile(path))}`).join('\n');
  return Object.freeze({ expectedProfiles, profileIdentityInventorySha256, pendingPairHashes:Object.freeze([...pendingPairs].sort()),
    pendingUidHashes:Object.freeze([...pendingUids].sort()), pendingPairInventorySha256, pendingUidInventorySha256, baselineSha256:sha256(filesHash) });
}

function sourceContext(baseline) {
  const head = spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8',stdio:['ignore','pipe','ignore']});
  if (head.status !== 0 || !/^[a-f0-9]{40}$/u.test(head.stdout.trim())) throw new Error('source_context_unavailable');
  return {sourceRef:head.stdout.trim(),sourceSha256:sha256(readFileSync(SOURCE_PATH)),toolSha256:sha256(readFileSync(`${TOOL_DIRECTORY}/run-canary.mjs`)),canarySourceSha256:sha256(readFileSync(SOURCE_PATH)),baseline};
}
function privatePath(path,kind) {
  const absolute = resolve(path ?? '');
  if (!path || dirname(absolute) !== '/private/tmp' || basename(absolute).length < 5) throw new Error(`${kind}_destination_invalid`);
  try { lstatSync(absolute); throw new Error(`${kind}_destination_exists`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
  return absolute;
}
function readPrivateJson(path) {
  const absolute = resolve(path ?? '');
  if (!path || dirname(absolute) !== '/private/tmp') throw new Error('reconciliation_receipt_invalid');
  const stat = lstatSync(absolute);
  if (!stat.isFile() || (stat.mode & 0o077) !== 0) throw new Error('reconciliation_receipt_invalid');
  try { return JSON.parse(readFileSync(absolute,'utf8')); } catch { throw new Error('reconciliation_receipt_invalid'); }
}
export function writePrivateIntent(path, value, fileSystem = {openSync,writeFileSync,fsyncSync,closeSync}) {
  let fd;
  try {
    fd = fileSystem.openSync(path,'wx',0o600);
    fileSystem.writeFileSync(fd,`${JSON.stringify(value,null,2)}\n`,'utf8');
    fileSystem.fsyncSync(fd);
  } catch { throw new Error('intent_write_failed'); }
  finally { if (fd !== undefined) fileSystem.closeSync(fd); }
}
export function writePrivateReceipt(path, value) {
  try { writePrivateIntent(path,value); } catch { throw new Error('receipt_write_failed'); }
}
export function parseArgs(argv) {
  if (!['reconcile','canary'].includes(argv[0])) throw new Error('usage_invalid');
  const mode = argv[0]; const args = {};
  for (let i=1;i<argv.length;i+=2) {
    const key=argv[i]; const value=argv[i+1];
    if (!['--receipt','--intent','--reconciliation'].includes(key) || !value || args[key]) throw new Error('usage_invalid');
    args[key]=value;
  }
  if (mode==='reconcile' && (!args['--receipt'] || args['--intent'] || args['--reconciliation'])) throw new Error('usage_invalid');
  if (mode==='canary' && (!args['--receipt'] || !args['--intent'] || !args['--reconciliation'])) throw new Error('usage_invalid');
  if (mode==='canary' && (resolve(args['--receipt'])===resolve(args['--intent']) || resolve(args['--receipt'])===resolve(args['--reconciliation']) || resolve(args['--intent'])===resolve(args['--reconciliation']))) throw new Error('usage_invalid');
  return Object.freeze({mode,receiptPath:privatePath(args['--receipt'],'receipt'),intentPath:mode==='canary'?privatePath(args['--intent'],'intent'):null,reconciliationPath:args['--reconciliation']?resolve(args['--reconciliation']):null});
}

function evaluateCanaryExpression(nonce) {
  return `(() => {
    const expectedDatasetHash=${JSON.stringify(DATASET_HASH)}, expectedInstallationHash=${JSON.stringify(INSTALLATION_HASH)}, nonce=${JSON.stringify(nonce)};
    const own=(o,k)=>{if(!o||(typeof o!=='object'&&typeof o!=='function'))return undefined;const d=Object.getOwnPropertyDescriptor(o,k);return d&&Object.prototype.hasOwnProperty.call(d,'value')?d.value:undefined;};
    const metro=globalThis.__r, getModules=own(metro,'getModules'); if(typeof getModules!=='function')return {schemaVersion:'bizq01-guest-removal-canary-runner-v1',ok:false,stage:'module_registry_unavailable'};let modules;try{modules=getModules.call(metro)}catch{return {schemaVersion:'bizq01-guest-removal-canary-runner-v1',ok:false,stage:'module_metadata_unavailable'}};if(!modules)return {schemaVersion:'bizq01-guest-removal-canary-runner-v1',ok:false,stage:'module_registry_unavailable'};
    const found=[...modules.values()].filter(m=>{const n=own(m,'verboseName');return typeof n==='string'&&(n===${JSON.stringify(SOURCE_PATH)}||n.endsWith('/'+${JSON.stringify(SOURCE_PATH)}));});
    if(found.length!==1||own(found[0],'isInitialized')!==true)return {schemaVersion:'bizq01-guest-removal-canary-runner-v1',ok:false,stage:'module_metadata_ambiguous'};
    const ex=own(own(found[0],'publicModule'),'exports'),run=own(ex,'runBizq01GuestRemoval34Canary');
    if(typeof run!=='function')return {schemaVersion:'bizq01-guest-removal-canary-runner-v1',ok:false,stage:'initialized_export_unavailable'};
    const receipt=run(expectedDatasetHash,expectedInstallationHash,nonce);
    if(!receipt||typeof receipt!=='object'||typeof own(receipt,'then')==='function')return {schemaVersion:'bizq01-guest-removal-canary-runner-v1',ok:false,stage:'canary_result_not_synchronous'};
    return {schemaVersion:'bizq01-guest-removal-canary-runner-v1',ok:true,receipt};
  })()`;
}

export function evaluateReconciliationExpression(marker, baseline) {
  return `(() => {
    const marker=${JSON.stringify(marker)}, expectedDatasetHash=${JSON.stringify(DATASET_HASH)}, expectedInstallationHash=${JSON.stringify(INSTALLATION_HASH)};
    const expectedInventory=${JSON.stringify(baseline.profileIdentityInventorySha256)}, expectedPairs=${JSON.stringify(baseline.pendingPairHashes)}, expectedUids=${JSON.stringify(baseline.pendingUidHashes)};
    const own=(o,k)=>{if(!o||(typeof o!=='object'&&typeof o!=='function'))return undefined;const d=Object.getOwnPropertyDescriptor(o,k);return d&&Object.prototype.hasOwnProperty.call(d,'value')?d.value:undefined;};
    const send=x=>console.log(marker,JSON.stringify(x));
    const fail=stage=>send({schemaVersion:'bizq01-guest-removal-reconciliation-v1',result:'failed',stage});
    const metro=globalThis.__r,getModules=own(metro,'getModules');if(typeof getModules!=='function')return fail('registry_module_unavailable');let modules;try{modules=getModules.call(metro)}catch{return fail('registry_module_unavailable')}if(!modules)return fail('registry_module_unavailable');
    const all=[...modules.values()];
    const initialized=suffix=>{const found=all.filter(m=>{const n=own(m,'verboseName');return typeof n==='string'&&(n===suffix||n.endsWith('/'+suffix));});if(found.length!==1||own(found[0],'isInitialized')!==true)return null;return own(own(found[0],'publicModule'),'exports');};
    const mmkv=initialized(${JSON.stringify(SOURCE_PATH)}), secure=initialized('node_modules/expo-secure-store/build/SecureStore.js'), shaMod=initialized('src/infrastructure/identity/sha256.ts'), sha=own(shaMod,'sha256Utf8');
    const inspect=own(mmkv,'inspectBizq01GuestRemoval34Canary'), getSecureItem=own(secure,'getItemAsync');
    if(typeof inspect!=='function'||typeof getSecureItem!=='function'||typeof sha!=='function')return fail('registry_module_unavailable');
    (async()=>{
      try {
        const adapter=inspect.call(mmkv,expectedDatasetHash,expectedInstallationHash);
        if(adapter?.result!=='observed'||adapter.activeLearningWorkPresent!==false||adapter.selectedGuestMatches!==true)return fail(adapter?.stage||'active_profile_unavailable');
        const options={keychainService:'com.lkurczab.patternly.encrypted-storage'};
        const raw=await Promise.all(['patternly.profile-root.v1.a','patternly.profile-root.v1.b'].map(k=>getSecureItem.call(secure,k,options)).concat([getSecureItem.call(secure,'patternly.local-logout-control.v2',options)]));
        const parseSlot=value=>{if(typeof value!=='string')return null;let parsed;try{parsed=JSON.parse(value)}catch{return null}if(!parsed||typeof parsed!=='object'||Object.keys(parsed).sort().join('|')!=='checksum|generation|legacyProfileId|profiles|selectedProfileId|version')return null;const {checksum,...body}=parsed;if(body.version!==1||!Number.isSafeInteger(body.generation)||body.generation<1||body.legacyProfileId!==null||typeof body.selectedProfileId!=='string'||!Array.isArray(body.profiles)||sha(JSON.stringify(body))!==checksum)return null;const identities=body.profiles.map(p=>{if(!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).sort().join('|')!=='accountId|id|kind'||typeof p.id!=='string'||(p.kind!=='account'&&p.kind!=='guest')||(p.kind==='account'&&typeof p.accountId!=='string')||(p.kind==='guest'&&p.accountId!==null))return null;return{idSha256:sha(p.id),kind:p.kind,accountIdSha256:p.accountId===null?null:sha(p.accountId)}});if(identities.some(p=>p===null))return null;identities.sort((a,b)=>a.idSha256.localeCompare(b.idSha256));const guest=body.profiles.find(p=>p.kind==='guest');return{generation:body.generation,identities,digest:sha(JSON.stringify(identities)),selectedGuest:!!guest&&sha(body.selectedProfileId)===sha(guest.id)}};
        const a=parseSlot(raw[0]),b=parseSlot(raw[1]);if(!a||!b)return fail('registry_slots_invalid');
        const latest=a.generation>b.generation?a:b;
        const registryMatches=a.generation!==b.generation&&a.digest===expectedInventory&&b.digest===expectedInventory&&a.digest===b.digest&&latest.selectedGuest&&a.identities.length===10&&a.identities.filter(p=>p.kind==='account').length===9&&a.identities.filter(p=>p.kind==='guest').length===1&&a.identities.some(p=>p.kind==='guest'&&p.idSha256===expectedDatasetHash)&&adapter.profileIdentityInventorySha256===expectedInventory&&adapter.accountProfileCount===9&&adapter.guestProfileCount===1;
        if(!registryMatches)return fail('registry_baseline_mismatch');
        if(adapter.guestKeyCount!==84||adapter.guestRecordCount!==81||adapter.guestMetadataKeyCount!==3)return fail('guest_baseline_count_mismatch');
        let control;try{control=raw[2]===null?null:JSON.parse(raw[2])}catch{control=null}if(!control||Object.keys(control).sort().join('|')!=='blocked|completed|pending|version'||control.version!==2||control.blocked!==null||!Array.isArray(control.pending)||!Array.isArray(control.completed))return fail('logout_control_unavailable');
        const pairHash=p=>{if(!p||typeof p.uid!=='string'||typeof p.operationId!=='string'||Object.keys(p).sort().join('|')!=='operationId|uid')throw new Error('logout_control_baseline_mismatch');return sha(JSON.stringify({uid:p.uid,operationId:p.operationId}))};
        const pairs=control.pending.map(pairHash).sort(),uids=control.pending.map(p=>sha(p.uid)).sort(),completed=control.completed.map(pairHash);
        if(JSON.stringify(pairs)!==JSON.stringify([...expectedPairs].sort())||JSON.stringify(uids)!==JSON.stringify([...expectedUids].sort())||completed.length!==0)return fail('logout_control_baseline_mismatch');
        const cleanFamily=adapter.canaryFamilyKeyCount===0;
        send({schemaVersion:'bizq01-guest-removal-reconciliation-v1',result:cleanFamily?'passed':'failed',stage:cleanFamily?'complete':'canary_family_nonempty',profileTransitionActive:adapter.profileTransitionActive,activeLearningWorkPresent:false,guestKind:adapter.guestKind,selectedGuestMatches:true,installationIdSha256:adapter.installationIdSha256,datasetIdSha256:adapter.datasetIdSha256,accountProfileCount:9,guestProfileCount:1,profileIdentityInventorySha256:adapter.profileIdentityInventorySha256,guestKeyCount:adapter.guestKeyCount,guestRecordCount:adapter.guestRecordCount,guestMetadataKeyCount:adapter.guestMetadataKeyCount,guestKeyInventorySha256:adapter.guestKeyInventorySha256,registrySlotAValid:true,registrySlotBValid:true,registrySlotsMatchBaseline:true,logoutControlValid:true,logoutControlMatchesBaseline:true,pendingPairCount:pairs.length,pendingPairInventorySha256:sha(JSON.stringify(pairs)),pendingUidInventorySha256:sha(JSON.stringify(uids)),blockedPairSha256:null,canaryFamilyKeyCount:adapter.canaryFamilyKeyCount,canaryFamilyKeyInventorySha256:adapter.canaryFamilyKeyInventorySha256,accountStateSha256:adapter.accountStateSha256,globalStateSha256:adapter.globalStateSha256,protectedAdapterStateSha256:adapter.protectedAdapterStateSha256});
      }catch(error){const allowed=new Set(['input_invalid','active_profile_unavailable','expected_guest_mismatch','active_learning_work_present','active_learning_state_unavailable','protected_state_unavailable','secure_store_read_failed','registry_slots_invalid','registry_baseline_mismatch','logout_control_unavailable','logout_control_baseline_mismatch']);fail(allowed.has(error?.message)?error.message:'secure_store_read_failed')}
    })();
  })()`;
}

function resultFromConsole(packet, marker) {
  if (packet?.method !== 'Runtime.consoleAPICalled') return null;
  const args=packet.params?.args;
  if(args?.[0]?.value!==marker||typeof args?.[1]?.value!=='string')return null;
  try{return JSON.parse(args[1].value)}catch{throw new Error('reconciliation_result_invalid')}
}

async function inspect(target, mode, source, paths) {
  const socket=new WebSocket(target.webSocketDebuggerUrl,{origin:ORIGIN});
  let id=0, failure=null, consoleResult=null, closeOk=false, timer;
  const pending=new Map();
  const command=(method,params={})=>new Promise((resolvePromise,reject)=>{const commandId=++id;const timeout=setTimeout(()=>reject(new Error('inspector_command_timeout')),10000);pending.set(commandId,{resolve:packet=>{clearTimeout(timeout);resolvePromise(packet)}});socket.send(JSON.stringify({id:commandId,method,params}))});
  let resolveClose;const closed=new Promise(resolvePromise=>{resolveClose=resolvePromise});
  socket.once('close',code=>{closeOk=code===1000;resolveClose(closeOk)});socket.once('error',()=>{failure='inspector_connection';resolveClose(false)});
  socket.on('message',data=>{let packet;try{packet=JSON.parse(data.toString())}catch{return}if(pending.has(packet.id)){const waiter=pending.get(packet.id);pending.delete(packet.id);waiter.resolve(packet)}if(mode==='reconcile'&&!consoleResult){try{consoleResult=resultFromConsole(packet,source.marker)}catch{failure='reconciliation_result_invalid'}}});
  timer=setTimeout(()=>{failure=mode==='reconcile'?'inspector_console_result_missing':'inspector_timeout';socket.close()},30000);
  let output=null;
  try{
    await new Promise((resolvePromise,reject)=>{if(socket.readyState===WebSocket.OPEN)resolvePromise();else{socket.once('open',resolvePromise);socket.once('error',()=>reject(new Error('inspector_connection')))}});
    const enabled=await command('Runtime.enable');if(enabled.error)throw new Error('inspector_enable_failed');
    if(mode==='canary'){
      const intent={schemaVersion:'bizq01-guest-removal-effect-intent-v1',mode,nonce:source.nonce,appId:APP_ID,deviceName:DEVICE_NAME,sourceRef:source.sourceRef,sourceSha256:source.sourceSha256,toolSha256:source.toolSha256,canarySourceSha256:source.canarySourceSha256,baselineSha256:source.baseline.baselineSha256,effect:'one_unregistered_profile_canary_set_read_enumerate_remove',createdAt:new Date().toISOString()};
      const evaluated=await executeCanaryAfterReconciliation(source.reconciliationReceipt,source,()=>writePrivateIntent(paths.intentPath,intent),()=>command('Runtime.evaluate',{expression:evaluateCanaryExpression(source.nonce),awaitPromise:false,returnByValue:true,silent:true}));
      const result=evaluated?.result?.result?.value;if(evaluated.error||!result||result.schemaVersion!=='bizq01-guest-removal-canary-runner-v1')throw new Error('canary_result_invalid');if(!result.ok)throw new Error(SAFE_FAILURES.has(result.stage)?result.stage:'canary_result_invalid');output=validateCanaryResult(result.receipt);
    }else{
      const marker=`[bizq01-guest-removal-reconcile]:${source.marker}`;source.marker=marker;
      const evaluated=await command('Runtime.evaluate',{expression:evaluateReconciliationExpression(marker,source.baseline),awaitPromise:false,returnByValue:false,silent:true});if(evaluated.error||evaluated.result?.exceptionDetails)throw new Error('inspector_evaluation_failed');
      const start=Date.now();while(!consoleResult&&!failure&&Date.now()-start<25000)await new Promise(resolvePromise=>setTimeout(resolvePromise,20));if(!consoleResult)throw new Error(failure??'inspector_console_result_missing');output=validateReconciliationResult(consoleResult,source.baseline);
    }
  }catch(error){failure=safeError(error)}finally{clearTimeout(timer);if(socket.readyState===WebSocket.OPEN)socket.close(1000)}
  await closed;if(!closeOk||failure)throw new Error(failure??'inspector_close_failed');return output;
}

async function main(){
  try{
    const paths=parseArgs(process.argv.slice(2));const baseline=readExpectedBaseline();const source=sourceContext(baseline);
    const response=await fetch(TARGET_URL,{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('inspector_target_list_unavailable');const target=selectCanaryTarget(await response.json());
    let result;let nonce;
    if(paths.mode==='canary'){
      const prior=readPrivateJson(paths.reconciliationPath);validateReconciliationReceipt(prior,source);source.reconciliationReceipt=prior;nonce=randomBytes(32).toString('hex');source.nonce=nonce;
    }else source.marker=randomBytes(24).toString('hex');
    result=await inspect(target,paths.mode,source,paths);
    const common={mode:paths.mode,appId:APP_ID,deviceName:DEVICE_NAME,sourceRef:source.sourceRef,sourceSha256:source.sourceSha256,toolSha256:source.toolSha256,baselineSha256:baseline.baselineSha256,capturedAt:new Date().toISOString()};
    const receipt=paths.mode==='reconcile'?{schemaVersion:'bizq01-guest-removal-reconciliation-evidence-v1',result:result.result,stage:result.stage,...common,reconciliation:result}:{schemaVersion:'bizq01-guest-removal-canary-evidence-v1',result:result.result,stage:result.stage,...common,nonceSha256:sha256(nonce),accountStateSha256:result.accountStateSha256,globalStateSha256:result.globalStateSha256,protectedAdapterStateSha256:result.protectedAdapterStateSha256,canaryValueSha256:result.canaryValueSha256,protectedStateUnchanged:result.protectedStateUnchanged,cleanupVerified:result.cleanupVerified};
    persistReceiptAfterCleanClose(receipt,true,value=>writePrivateReceipt(paths.receiptPath,value));
    process.stdout.write(JSON.stringify({mode:paths.mode,result:receipt.result,stage:receipt.stage,evidence:'private_receipt_written'})+'\n');
    if(receipt.result!=='passed')process.exitCode=1;
  }catch(error){process.stderr.write(`${safeError(error)}\n`);process.exitCode=1}
}
if(import.meta.url===`file://${process.argv[1]}`)await main();
