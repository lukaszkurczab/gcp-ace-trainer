import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { readFileSync, rmSync, statSync } from 'node:fs';
import {
  executeAfterIntent,
  executeCanaryAfterReconciliation,
  evaluateReconciliationExpression,
  parseArgs,
  persistReceiptAfterCleanClose,
  readExpectedBaseline,
  selectCanaryTarget,
  validateCanaryResult,
  validateReconciliationReceipt,
  validateReconciliationResult,
  writePrivateIntent,
} from './run-canary.mjs';

const validTarget = { type:'node', appId:'com.lkurczab.patternly', deviceName:'iPhone 17', webSocketDebuggerUrl:'ws://[::1]:8081/inspector' };
const hash = 'a'.repeat(64);
const expected = { profileIdentityInventorySha256:hash, pendingPairInventorySha256:hash, pendingUidInventorySha256:hash };
const passedCanary = { schemaVersion:'bizq01-guest-removal-canary-v1', result:'passed', stage:'complete', accountStateSha256:hash, globalStateSha256:hash, protectedAdapterStateSha256:hash, canaryValueSha256:hash, protectedStateUnchanged:true, cleanupVerified:true };
const reconciliation = { schemaVersion:'bizq01-guest-removal-reconciliation-v1',result:'passed',stage:'complete',profileTransitionActive:false,activeLearningWorkPresent:false,guestKind:'guest',selectedGuestMatches:true,installationIdSha256:'498a8a5cbc36ed6331567374098786cc922f8133a4afceb7471ca0d77b4de760',datasetIdSha256:'b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d',accountProfileCount:9,guestProfileCount:1,profileIdentityInventorySha256:hash,guestKeyCount:84,guestRecordCount:81,guestMetadataKeyCount:3,guestKeyInventorySha256:hash,registrySlotAValid:true,registrySlotBValid:true,registrySlotsMatchBaseline:true,logoutControlValid:true,logoutControlMatchesBaseline:true,pendingPairCount:6,pendingPairInventorySha256:hash,pendingUidInventorySha256:hash,blockedPairSha256:null,canaryFamilyKeyCount:0,canaryFamilyKeyInventorySha256:hash,accountStateSha256:hash,globalStateSha256:hash,protectedAdapterStateSha256:hash };

 test('target selection requires one exact existing iPhone 17 node target on loopback',()=>{
  assert.equal(selectCanaryTarget([validTarget]),validTarget);
  assert.throws(()=>selectCanaryTarget([validTarget,{...validTarget}]),/inspector_target_identity_ambiguous/u);
  assert.throws(()=>selectCanaryTarget([{...validTarget,deviceName:'Other'}]),/inspector_target_identity_ambiguous/u);
  assert.throws(()=>selectCanaryTarget([{...validTarget,type:'page'}]),/inspector_target_identity_invalid/u);
  assert.throws(()=>selectCanaryTarget([{...validTarget,webSocketDebuggerUrl:'ws://127.0.0.1:8081/x'}]),/inspector_target_identity_invalid/u);
});

test('canary validator accepts sparse known refusals and only complete consistent pass claims',()=>{
  assert.equal(validateCanaryResult(passedCanary),passedCanary);
  assert.equal(validateCanaryResult({schemaVersion:passedCanary.schemaVersion,result:'failed',stage:'expected_guest_mismatch'}).stage,'expected_guest_mismatch');
  assert.throws(()=>validateCanaryResult({...passedCanary,cleanupVerified:false}),/canary_result_invalid/u);
  assert.throws(()=>validateCanaryResult({...passedCanary,privateValue:'x'}),/canary_result_invalid/u);
  assert.throws(()=>validateCanaryResult({schemaVersion:passedCanary.schemaVersion,result:'failed',stage:'arbitrary_runtime_message'}),/canary_result_invalid/u);
});

test('reconciliation requires exact Guest, 9 accounts, both registry slots, logout baseline, and empty canary namespace',()=>{
  assert.equal(validateReconciliationResult(reconciliation,expected),reconciliation);
  assert.throws(()=>validateReconciliationResult({...reconciliation,canaryFamilyKeyCount:1},expected),/reconciliation_result_invalid/u);
  assert.throws(()=>validateReconciliationResult({...reconciliation,registrySlotBValid:false},expected),/reconciliation_result_invalid/u);
  assert.equal(validateReconciliationResult({schemaVersion:reconciliation.schemaVersion,result:'failed',stage:'canary_family_nonempty'},expected).result,'failed');
});

test('tracked non-secret baselines bind exact Guest, nine accounts, and six pending controls',()=>{
  const baseline=readExpectedBaseline();
  assert.equal(baseline.expectedProfiles.length,10);
  assert.equal(baseline.expectedProfiles.filter((profile)=>profile.kind==='account').length,9);
  assert.equal(baseline.expectedProfiles.filter((profile)=>profile.kind==='guest').length,1);
  assert.equal(baseline.pendingPairHashes.length,6);
  assert.equal(baseline.pendingUidHashes.length,6);
  assert.equal(JSON.parse(readFileSync('docs/active/BIZQ-01/premium-completion-33/FINAL-GUEST-PRESERVATION-2026-10-07-02.json','utf8')).keys,84);
  assert.match(baseline.profileIdentityInventorySha256,/^[a-f0-9]{64}$/u);
});

test('reconciliation reads only the three named SecureStore controls without invoking the accessibility accessor',()=>{
  const expression=evaluateReconciliationExpression('private-marker',{profileIdentityInventorySha256:hash,pendingPairHashes:[],pendingUidHashes:[]});
  assert.match(expression,/const options=\{keychainService:'com\.lkurczab\.patternly\.encrypted-storage'\}/u);
  assert.match(expression,/\['patternly\.profile-root\.v1\.a','patternly\.profile-root\.v1\.b'\]/u);
  assert.match(expression,/getSecureItem\.call\(secure,'patternly\.local-logout-control\.v2',options\)/u);
  assert.doesNotMatch(expression,/WHEN_UNLOCKED_THIS_DEVICE_ONLY/u);
});

test('reconciliation receipt binds exact app, source, tool, and clean result before canary mode',()=>{
  const source={sourceRef:'1'.repeat(40),sourceSha256:hash,toolSha256:'b'.repeat(64),baseline:{...expected}};
  const receipt={schemaVersion:'bizq01-guest-removal-reconciliation-evidence-v1',mode:'reconcile',result:'passed',stage:'complete',appId:'com.lkurczab.patternly',deviceName:'iPhone 17',sourceRef:source.sourceRef,sourceSha256:source.sourceSha256,toolSha256:source.toolSha256,baselineSha256:hash,capturedAt:new Date().toISOString(),reconciliation};
  assert.equal(validateReconciliationReceipt(receipt,source),receipt);
  assert.throws(()=>validateReconciliationReceipt({...receipt,toolSha256:'c'.repeat(64)},source),/reconciliation_receipt_invalid/u);
  assert.throws(()=>validateReconciliationReceipt({...receipt,reconciliation:{...reconciliation,canaryFamilyKeyCount:1}},source),/reconciliation_result_invalid/u);
});

test('a passed receipt with an active transition barrier is rejected before intent or canary command',async()=>{
  const source={sourceRef:'1'.repeat(40),sourceSha256:hash,toolSha256:'b'.repeat(64),baseline:{...expected}};
  const receipt={schemaVersion:'bizq01-guest-removal-reconciliation-evidence-v1',mode:'reconcile',result:'passed',stage:'complete',appId:'com.lkurczab.patternly',deviceName:'iPhone 17',sourceRef:source.sourceRef,sourceSha256:source.sourceSha256,toolSha256:source.toolSha256,baselineSha256:hash,capturedAt:new Date().toISOString(),reconciliation:{...reconciliation,profileTransitionActive:true}};
  const events=[];
  await assert.rejects(executeCanaryAfterReconciliation(receipt,source,()=>{events.push('intent')},()=>{events.push('native_command')}),/reconciliation_result_invalid/u);
  assert.deepEqual(events,[]);
});

test('CLI requires an explicit mode and keeps outputs directly under private tmp',()=>{
  assert.throws(()=>parseArgs(['--receipt','/private/tmp/a.json']),/usage_invalid/u);
  const receiptPath=`/private/tmp/bizq01-reconcile-${randomUUID()}.json`;
  assert.equal(parseArgs(['reconcile','--receipt',receiptPath]).mode,'reconcile');
  assert.throws(()=>parseArgs(['reconcile','--receipt','/private/tmp/subdir/a.json']),/receipt_destination_invalid/u);
  assert.equal(parseArgs(['canary','--receipt',`/private/tmp/${randomUUID()}.json`,'--intent',`/private/tmp/${randomUUID()}.intent.json`,'--reconciliation',`/private/tmp/${randomUUID()}.receipt.json`]).mode,'canary');
});

test('fsynced private effect intent is written before invoking the mutating command',async()=>{
  const path=`/private/tmp/bizq01-effect-intent-${randomUUID()}.json`;const events=[];
  try{
    const value={schemaVersion:'bizq01-guest-removal-effect-intent-v1',nonce:'d'.repeat(64)};
    await executeAfterIntent(()=>{writePrivateIntent(path,value);events.push('intent')},()=>{events.push('command');return 'sent'});
    assert.deepEqual(events,['intent','command']);
    assert.deepEqual(JSON.parse(readFileSync(path,'utf8')),value);
    assert.equal(statSync(path).mode & 0o077,0);
  }finally{try{rmSync(path)}catch{}}
});

test('a malformed or uncleanly closed Inspector run cannot write a receipt',()=>{
  let wrote=false;
  assert.throws(()=>persistReceiptAfterCleanClose({result:'passed'},false,()=>{wrote=true}),/inspector_close_failed/u);
  assert.equal(wrote,false);
  persistReceiptAfterCleanClose({result:'passed'},true,()=>{wrote=true});
  assert.equal(wrote,true);
});
