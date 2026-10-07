import test from 'node:test';
import assert from 'node:assert/strict';
import { executeWithDurableIntent, evaluateRemovalExpression, expectedRemovalState, persistAfterCleanClose, selectRemovalTarget, validateRemovalResult, writePrivateJson } from './run-removal.mjs';

const sha = 'a'.repeat(64);
function reconciliation() {
  return {schemaVersion:'bizq01-guest-removal-reconciliation-evidence-v1',mode:'reconcile',result:'passed',stage:'complete',appId:'com.lkurczab.patternly',deviceName:'iPhone 17',sourceRef:'a'.repeat(40),sourceSha256:sha,toolSha256:sha,baselineSha256:sha,reconciliation:{
    schemaVersion:'bizq01-guest-removal-reconciliation-v1',result:'passed',stage:'complete',profileTransitionActive:false,activeLearningWorkPresent:false,guestKind:'guest',selectedGuestMatches:true,
    installationIdSha256:'498a8a5cbc36ed6331567374098786cc922f8133a4afceb7471ca0d77b4de760',datasetIdSha256:'b880a3a8d1530601f6f1ed2f244078468f09f51f9d68ba5f6d3cec95cfa5e52d',accountProfileCount:9,guestProfileCount:1,profileIdentityInventorySha256:'36b41e67f50b1521f2a71883c9149480a92e4a486376517003baeb4466889916',guestKeyCount:84,guestRecordCount:81,guestMetadataKeyCount:3,guestKeyInventorySha256:sha,
    registrySlotAValid:true,registrySlotBValid:true,registrySlotsMatchBaseline:true,logoutControlValid:true,logoutControlMatchesBaseline:true,pendingPairCount:6,pendingPairInventorySha256:'e3d2ed0a479658a5af64ea9e00d9bd3cc169a181a2835d37e64f0855306bc135',pendingUidInventorySha256:'b39ddaf01b649f802a2d618ec9cf0d60736daa20f64edcc0e034177a4c7dd03f',blockedPairSha256:null,
    canaryFamilyKeyCount:0,canaryFamilyKeyInventorySha256:sha,accountStateSha256:'59e93b2d6c39efd79b1d644283d7ab7f4423239ee1fd535fe00a0a97255a73fb',globalStateSha256:'4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',protectedAdapterStateSha256:sha,
  }};
}

test('Stage 2 expected state is derived only from a complete exact-baseline Stage 1 receipt', () => {
  const expected=expectedRemovalState(reconciliation());
  assert.deepEqual(Object.keys(expected).sort(),['accountStateSha256','datasetIdSha256','globalStateSha256','guestKeyCount','installationIdSha256','pendingPairInventorySha256','pendingUidInventorySha256','profileIdentityInventorySha256'].sort());
  assert.equal(expected.guestKeyCount,84);
  const bad=reconciliation();bad.reconciliation.profileTransitionActive=true;
  assert.throws(()=>expectedRemovalState(bad),/baseline_unavailable/);
  const badCount=reconciliation();badCount.reconciliation.accountProfileCount=8;
  assert.throws(()=>expectedRemovalState(badCount),/baseline_unavailable/);
});

test('target requires one exact app/device Node inspector on IPv6 loopback', () => {
  const target={appId:'com.lkurczab.patternly',deviceName:'iPhone 17',type:'node',webSocketDebuggerUrl:'ws://[::1]:8081/devtools/page/1'};
  assert.equal(selectRemovalTarget([target]),target);
  assert.throws(()=>selectRemovalTarget([target,{...target}]),/inspector_target_identity_ambiguous/);
  assert.throws(()=>selectRemovalTarget([{...target,deviceName:'other'}]),/inspector_target_identity_ambiguous/);
  assert.throws(()=>selectRemovalTarget([{...target,type:'page'}]),/inspector_target_identity_invalid/);
});

test('native expression uses the initialized maintenance export and async console completion, not Promise by-value', () => {
  const expression=evaluateRemovalExpression('[private-marker]',expectedRemovalState(reconciliation()));
  assert.match(expression,/removeOriginalGuest34/);
  assert.match(expression,/Promise\.resolve\(run\(expected\)\)\.then/);
  assert.match(expression,/console\.log\(marker,JSON\.stringify\(x\)\)/);
  assert.doesNotMatch(expression,/awaitPromise:true|\.get\(.*\)\(\)/);
  assert.match(expression,/isInitialized/);
});

test('removal completion accepts digest-only protected facts and refuses fabricated or malformed success', () => {
  const value={schemaVersion:'bizq01-guest-removal-34-v1',result:'passed',stage:'complete',replacementProfileIdSha256:sha,removedProfileIdSha256:sha,protectedAccountStateSha256:sha,protectedGlobalStateSha256:sha,logoutControlSha256:sha,removedKeyCount:84};
  assert.equal(validateRemovalResult(value),value);
  assert.throws(()=>validateRemovalResult({...value,removedProfileIdSha256:'raw-id'}),/removal_result_invalid/);
  assert.throws(()=>validateRemovalResult({...value,removedKeyCount:0}),/removal_result_invalid/);
  assert.throws(()=>validateRemovalResult({...value,unreviewed:true}),/removal_result_invalid/);
});

test('durable private intent precedes the native effect; receipt waits for successful close', async () => {
  const order=[];
  const value=await executeWithDurableIntent(async()=>order.push('intent-fsynced'),async()=>{order.push('native-command');return 'result'});
  assert.equal(value,'result');assert.deepEqual(order,['intent-fsynced','native-command']);
  assert.throws(()=>persistAfterCleanClose({},false,()=>order.push('receipt')),/inspector_close_failed/);
  assert.equal(order.includes('receipt'),false);
  persistAfterCleanClose({},true,()=>order.push('receipt'));
  assert.equal(order.at(-1),'receipt');
});

test('private intent flushes file bytes and its directory entry before effect dispatch', () => {
  const calls=[];
  const fs={openSync:(path,flags,mode)=>{calls.push(['open',path,flags,mode]);return path.endsWith('.json')?1:2;},writeFileSync:(fd,data,encoding)=>calls.push(['write',fd,encoding,JSON.parse(data).schemaVersion]),fsyncSync:fd=>calls.push(['fsync',fd]),closeSync:fd=>calls.push(['close',fd])};
  writePrivateJson('/private/tmp/intent.json',{schemaVersion:'private-test'},'intent_write_failed',fs);
  assert.deepEqual(calls,[['open','/private/tmp/intent.json','wx',0o600],['write',1,'utf8','private-test'],['fsync',1],['close',1],['open','/private/tmp','r',undefined],['fsync',2],['close',2]]);
});
