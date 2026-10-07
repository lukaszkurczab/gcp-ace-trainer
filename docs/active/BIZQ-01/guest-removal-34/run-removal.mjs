#!/usr/bin/env node
// Explicit, versioned Stage 2 maintenance command. Importing this file has no runtime effects.
import { createHash, randomBytes } from 'node:crypto';
import { closeSync, fsyncSync, lstatSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import WebSocket from 'ws';

const APP_ID = 'com.lkurczab.patternly';
const DEVICE_NAME = 'iPhone 17';
const ORIGIN = 'http://127.0.0.1:8081';
const TARGET_URL = 'http://[::1]:8081/json/list';
const SOURCE_PATH = 'src/infrastructure/storage/mmkvClient.ts';
const TOOL_DIRECTORY = 'docs/active/BIZQ-01/guest-removal-34';
const RECONCILIATION_PATH = `${TOOL_DIRECTORY}/STAGE1-NATIVE-RECONCILIATION.json`;
const DATASET_HASH = 'b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d';
const INSTALLATION_HASH = '498a8a5cbc36ed6331567374098786cc922f8133a4afceb7471ca0d77b4de760';
const BASELINE_FACTS = Object.freeze({
  profileIdentityInventorySha256: '36b41e67f50b1521f2a71883c9149480a92e4a486376517003baeb4466889916',
  pendingPairInventorySha256: 'e3d2ed0a479658a5af64ea9e00d9bd3cc169a181a2835d37e64f0855306bc135',
  pendingUidInventorySha256: 'b39ddaf01b649f802a2d618ec9cf0d60736daa20f64edcc0e034177a4c7dd03f',
  accountStateSha256: '59e93b2d6c39efd79b1d644283d7ab7f4423239ee1fd535fe00a0a97255a73fb',
  globalStateSha256: '4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
});
const REMOVAL_STAGES = new Set(['complete','preflight','active_profile_unavailable','active_learning_work_present','guest_baseline_mismatch','pending_journal','registry_preflight','logout_baseline_mismatch','replacement_identity_invalid','protected_baseline_mismatch','journal_persist_failed','recovery_failed','transaction_unavailable','replacement_publication_failed']);
const SAFE_FAILURES = new Set(['usage_invalid','baseline_unavailable','inspector_target_list_unavailable','inspector_target_list_invalid','inspector_target_identity_ambiguous','inspector_target_identity_invalid','inspector_enable_failed','inspector_command_timeout','inspector_timeout','inspector_connection','inspector_close_failed','source_context_unavailable','receipt_destination_invalid','receipt_destination_exists','receipt_write_failed','intent_destination_invalid','intent_destination_exists','intent_write_failed','removal_result_invalid','removal_result_missing','inspector_evaluation_failed','initialized_export_unavailable','module_registry_unavailable','module_metadata_unavailable','module_metadata_ambiguous','removal_failed']);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const exactKeys = (value, keys) => !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).sort().join('|') === [...keys].sort().join('|');
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value);
const safeError = error => SAFE_FAILURES.has(error?.message) ? error.message : 'removal_failed';

export function selectRemovalTarget(targets) {
  if (!Array.isArray(targets)) throw new Error('inspector_target_list_invalid');
  const matches = targets.filter(target => target?.appId === APP_ID && target?.deviceName === DEVICE_NAME);
  if (matches.length !== 1) throw new Error('inspector_target_identity_ambiguous');
  const target = matches[0];
  if (target.type !== 'node' || typeof target.webSocketDebuggerUrl !== 'string' || !target.webSocketDebuggerUrl.startsWith('ws://[::1]:8081/')) throw new Error('inspector_target_identity_invalid');
  return target;
}

export function expectedRemovalState(receipt) {
  const expected = receipt?.reconciliation;
  if (receipt?.schemaVersion !== 'bizq01-guest-removal-reconciliation-evidence-v1' || receipt.mode !== 'reconcile' || receipt.result !== 'passed'
    || receipt.stage !== 'complete' || receipt.appId !== APP_ID || receipt.deviceName !== DEVICE_NAME
    || typeof receipt.sourceRef !== 'string' || !/^[a-f0-9]{40}$/u.test(receipt.sourceRef) || !digest(receipt.sourceSha256) || !digest(receipt.toolSha256) || !digest(receipt.baselineSha256)
    || !exactKeys(expected, ['schemaVersion','result','stage','profileTransitionActive','activeLearningWorkPresent','guestKind','selectedGuestMatches','installationIdSha256','datasetIdSha256','accountProfileCount','guestProfileCount','profileIdentityInventorySha256','guestKeyCount','guestRecordCount','guestMetadataKeyCount','guestKeyInventorySha256','registrySlotAValid','registrySlotBValid','registrySlotsMatchBaseline','logoutControlValid','logoutControlMatchesBaseline','pendingPairCount','pendingPairInventorySha256','pendingUidInventorySha256','blockedPairSha256','canaryFamilyKeyCount','canaryFamilyKeyInventorySha256','accountStateSha256','globalStateSha256','protectedAdapterStateSha256'])
    || expected.schemaVersion !== 'bizq01-guest-removal-reconciliation-v1' || expected.result !== 'passed' || expected.stage !== 'complete'
    || expected.profileTransitionActive !== false || expected.activeLearningWorkPresent !== false || expected.guestKind !== 'guest' || expected.selectedGuestMatches !== true
    || expected.installationIdSha256 !== INSTALLATION_HASH || expected.datasetIdSha256 !== DATASET_HASH
    || expected.accountProfileCount !== 9 || expected.guestProfileCount !== 1 || expected.guestKeyCount !== 84 || expected.guestRecordCount !== 81 || expected.guestMetadataKeyCount !== 3
    || expected.registrySlotAValid !== true || expected.registrySlotBValid !== true || expected.registrySlotsMatchBaseline !== true
    || expected.logoutControlValid !== true || expected.logoutControlMatchesBaseline !== true || expected.pendingPairCount !== 6 || expected.blockedPairSha256 !== null
    || expected.canaryFamilyKeyCount !== 0 || !['datasetIdSha256','installationIdSha256','profileIdentityInventorySha256','pendingPairInventorySha256','pendingUidInventorySha256','accountStateSha256','globalStateSha256'].every(key => digest(expected[key]))
    || ['profileIdentityInventorySha256','pendingPairInventorySha256','pendingUidInventorySha256','accountStateSha256','globalStateSha256'].some(key => expected[key] !== BASELINE_FACTS[key])) throw new Error('baseline_unavailable');
  return Object.freeze({
    datasetIdSha256: expected.datasetIdSha256,
    installationIdSha256: expected.installationIdSha256,
    profileIdentityInventorySha256: expected.profileIdentityInventorySha256,
    accountStateSha256: expected.accountStateSha256,
    globalStateSha256: expected.globalStateSha256,
    pendingPairInventorySha256: expected.pendingPairInventorySha256,
    pendingUidInventorySha256: expected.pendingUidInventorySha256,
    guestKeyCount: expected.guestKeyCount,
  });
}

export function validateRemovalResult(value) {
  const base = ['schemaVersion','result','stage'];
  const fields = ['replacementProfileIdSha256','removedProfileIdSha256','protectedAccountStateSha256','protectedGlobalStateSha256','logoutControlSha256','removedKeyCount'];
  if (!value || typeof value !== 'object' || Array.isArray(value) || base.some(key => !Object.hasOwn(value,key))
    || Object.keys(value).some(key => !base.includes(key) && !fields.includes(key)) || value.schemaVersion !== 'bizq01-guest-removal-34-v1'
    || !['passed','failed'].includes(value.result) || !REMOVAL_STAGES.has(value.stage)) throw new Error('removal_result_invalid');
  if (value.result === 'passed' && (value.stage !== 'complete' || fields.slice(0,5).some(key => !digest(value[key])) || value.removedKeyCount !== 84)) throw new Error('removal_result_invalid');
  for (const key of fields.slice(0,5)) if (value[key] !== undefined && !digest(value[key])) throw new Error('removal_result_invalid');
  if (value.removedKeyCount !== undefined && (!Number.isSafeInteger(value.removedKeyCount) || value.removedKeyCount < 0)) throw new Error('removal_result_invalid');
  return value;
}

export function parseRemovalArgs(argv) {
  if (argv[0] !== 'remove' || argv.length !== 5 || argv[1] !== '--intent' || argv[3] !== '--receipt') throw new Error('usage_invalid');
  const pathFor = (value, kind) => {
    const path = resolve(value);
    if (dirname(path) !== '/private/tmp' || basename(path).length < 5) throw new Error(`${kind}_destination_invalid`);
    try { lstatSync(path); throw new Error(`${kind}_destination_exists`); } catch (error) { if (error?.code !== 'ENOENT') throw error; }
    return path;
  };
  const intentPath = pathFor(argv[2], 'intent'); const receiptPath = pathFor(argv[4], 'receipt');
  if (intentPath === receiptPath) throw new Error('usage_invalid');
  return Object.freeze({ intentPath, receiptPath });
}

export function writePrivateJson(path, value, failureCategory, fileSystem = {openSync,writeFileSync,fsyncSync,closeSync}) {
  let fd; let directoryFd;
  try {
    fd = fileSystem.openSync(path, 'wx', 0o600);
    fileSystem.writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fileSystem.fsyncSync(fd);
    fileSystem.closeSync(fd); fd = undefined;
    directoryFd = fileSystem.openSync(dirname(path), 'r');
    fileSystem.fsyncSync(directoryFd);
    fileSystem.closeSync(directoryFd); directoryFd = undefined;
  } catch { throw new Error(failureCategory); }
  finally { if (fd !== undefined) fileSystem.closeSync(fd); if (directoryFd !== undefined) fileSystem.closeSync(directoryFd); }
}

export async function executeWithDurableIntent(writeIntent, invoke) { await writeIntent(); return invoke(); }
export function persistAfterCleanClose(value, closeSucceeded, writeReceipt) {
  if (closeSucceeded !== true) throw new Error('inspector_close_failed');
  writeReceipt(value);
}

function sourceContext(expected) {
  const head = spawnSync('git', ['rev-parse','HEAD'], {encoding:'utf8',stdio:['ignore','pipe','ignore']});
  if (head.status !== 0 || !/^[a-f0-9]{40}$/u.test(head.stdout.trim())) throw new Error('source_context_unavailable');
  return { sourceRef: head.stdout.trim(), sourceSha256: sha256(readFileSync(SOURCE_PATH)), toolSha256: sha256(readFileSync(`${TOOL_DIRECTORY}/run-removal.mjs`)), expected };
}

export function evaluateRemovalExpression(marker, expected) {
  return `(() => {
    const marker=${JSON.stringify(marker)}, expected=${JSON.stringify(expected)};
    const own=(o,k)=>{if(!o||(typeof o!=='object'&&typeof o!=='function'))return undefined;const d=Object.getOwnPropertyDescriptor(o,k);return d&&Object.prototype.hasOwnProperty.call(d,'value')?d.value:undefined;};
    const send=x=>console.log(marker,JSON.stringify(x));
    const fail=stage=>send({schemaVersion:'bizq01-guest-removal-34-v1',result:'failed',stage});
    const metro=globalThis.__r, getModules=own(metro,'getModules');if(typeof getModules!=='function')return fail('module_registry_unavailable');
    let modules;try{modules=getModules.call(metro)}catch{return fail('module_metadata_unavailable')}if(!modules)return fail('module_registry_unavailable');
    const path=${JSON.stringify(SOURCE_PATH)};const found=[...modules.values()].filter(m=>{const name=own(m,'verboseName');return typeof name==='string'&&(name===path||name.endsWith('/'+path));});
    if(found.length!==1||own(found[0],'isInitialized')!==true)return fail('module_metadata_ambiguous');
    const exports=own(own(found[0],'publicModule'),'exports'),run=own(exports,'removeOriginalGuest34');if(typeof run!=='function')return fail('initialized_export_unavailable');
    try { Promise.resolve(run(expected)).then(value=>send(value),()=>fail('transaction_unavailable')); } catch { fail('transaction_unavailable'); }
    return {schemaVersion:'bizq01-guest-removal-runner-v1',armed:true};
  })()`;
}

function consoleResult(packet, marker) {
  if (packet?.method !== 'Runtime.consoleAPICalled') return null;
  const args = packet.params?.args;
  if (args?.[0]?.value !== marker || typeof args?.[1]?.value !== 'string') return null;
  try { return JSON.parse(args[1].value); } catch { throw new Error('removal_result_invalid'); }
}

async function invoke(target, source, intentPath) {
  const socket = new WebSocket(target.webSocketDebuggerUrl, {origin:ORIGIN});
  let id=0, failure=null, result=null, closeOk=false, timer;
  const pending=new Map();
  const command=(method,params={})=>new Promise((resolvePromise,reject)=>{const commandId=++id;const timeout=setTimeout(()=>reject(new Error('inspector_command_timeout')),10000);pending.set(commandId,{resolve:packet=>{clearTimeout(timeout);resolvePromise(packet)}});socket.send(JSON.stringify({id:commandId,method,params}));});
  let resolveClose;const closed=new Promise(resolvePromise=>{resolveClose=resolvePromise});
  socket.once('close',code=>{closeOk=code===1000;resolveClose(closeOk)});socket.once('error',()=>{failure='inspector_connection';resolveClose(false)});
  socket.on('message',data=>{let packet;try{packet=JSON.parse(data.toString())}catch{return}if(pending.has(packet.id)){const waiter=pending.get(packet.id);pending.delete(packet.id);waiter.resolve(packet)}if(!result){try{result=consoleResult(packet,source.marker)}catch{failure='removal_result_invalid'}}});
  timer=setTimeout(()=>{failure='removal_result_missing';socket.close()},120000);
  try {
    await new Promise((resolvePromise,reject)=>{if(socket.readyState===WebSocket.OPEN)resolvePromise();else{socket.once('open',resolvePromise);socket.once('error',()=>reject(new Error('inspector_connection')))}});
    const enabled=await command('Runtime.enable');if(enabled.error)throw new Error('inspector_enable_failed');
    const operationNonce=randomBytes(32).toString('hex');source.operationNonce=operationNonce;
    const intent={schemaVersion:'bizq01-guest-removal-34-intent-v1',operationNonce,appId:APP_ID,deviceName:DEVICE_NAME,sourceRef:source.sourceRef,sourceSha256:source.sourceSha256,toolSha256:source.toolSha256,baselineSha256:sha256(JSON.stringify(source.expected)),effect:'remove_exact_original_guest_with_durable_recovery',createdAt:new Date().toISOString()};
    source.marker=`[bizq01-guest-removal-34]:${intent.operationNonce}`;
    await executeWithDurableIntent(()=>writePrivateJson(intentPath,intent,'intent_write_failed'),async()=>{
      const evaluated=await command('Runtime.evaluate',{expression:evaluateRemovalExpression(source.marker,source.expected),awaitPromise:false,returnByValue:false,silent:true});
      if(evaluated.error||evaluated.result?.exceptionDetails)throw new Error('inspector_evaluation_failed');
      const start=Date.now();while(!result&&!failure&&Date.now()-start<110000)await new Promise(resolvePromise=>setTimeout(resolvePromise,25));
      if(!result)throw new Error(failure??'removal_result_missing');
    });
  } catch(error) { failure=safeError(error); }
  finally { clearTimeout(timer); if(socket.readyState===WebSocket.OPEN)socket.close(1000); }
  await closed;
  if(!closeOk||failure)throw new Error(failure??'inspector_close_failed');
  return Object.freeze({ result: validateRemovalResult(result), operationNonceSha256: sha256(source.operationNonce) });
}

async function main() {
  try {
    const paths=parseRemovalArgs(process.argv.slice(2));
    const baseline=JSON.parse(readFileSync(RECONCILIATION_PATH,'utf8'));
    const expected=expectedRemovalState(baseline);const source=sourceContext(expected);
    const response=await fetch(TARGET_URL,{signal:AbortSignal.timeout(5000)});if(!response.ok)throw new Error('inspector_target_list_unavailable');
    const target=selectRemovalTarget(await response.json());const invocation=await invoke(target,source,paths.intentPath);const result=invocation.result;
    const receipt={schemaVersion:'bizq01-guest-removal-34-evidence-v1',result:result.result,stage:result.stage,appId:APP_ID,deviceName:DEVICE_NAME,sourceRef:source.sourceRef,sourceSha256:source.sourceSha256,toolSha256:source.toolSha256,baselineSha256:sha256(JSON.stringify(expected)),operationNonceSha256:invocation.operationNonceSha256,capturedAt:new Date().toISOString(),replacementProfileIdSha256:result.replacementProfileIdSha256,removedProfileIdSha256:result.removedProfileIdSha256,protectedAccountStateSha256:result.protectedAccountStateSha256,protectedGlobalStateSha256:result.protectedGlobalStateSha256,logoutControlSha256:result.logoutControlSha256,removedKeyCount:result.removedKeyCount};
    persistAfterCleanClose(receipt,true,value=>writePrivateJson(paths.receiptPath,value,'receipt_write_failed'));
    process.stdout.write(JSON.stringify({mode:'remove',result:receipt.result,stage:receipt.stage,evidence:'private_receipt_written'})+'\n');
    if(result.result!=='passed')process.exitCode=1;
  } catch(error) { process.stderr.write(`${safeError(error)}\n`);process.exitCode=1; }
}
if(import.meta.url===`file://${process.argv[1]}`)await main();
