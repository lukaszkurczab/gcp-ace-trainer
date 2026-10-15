import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';

// Sanitized receipts only. This checker does not operate a device, Auth or storage.
const [directory,...extra]=process.argv.slice(2);
if(!directory||extra.length)throw Error('arguments_rejected');
const manifest=(await stat(directory)).isFile()?JSON.parse(await readFile(directory,'utf8')):null;
if(manifest&&manifest.schema!=='patternly.recovery15-residual-evidence.v1')throw Error('manifest_rejected');
const read=async name=>manifest?manifest.receipts[name]:JSON.parse(await readFile(resolve(directory,name),'utf8'));
const revoke=await read('revoke-sdk-held-final.json');
const restored=await read('revoke-restored.json');
assert.equal(revoke.fault.hits[0].stage,'sdk-session-before-local-ack');
assert.equal(revoke.fault.hits[0].uidSha256,revoke.uidSha256);
assert.equal(revoke.fault.hits[0].authorizationGeneration,2);
assert.equal(revoke.logout.pending.length,1);
assert.deepEqual(revoke.logout.blocked,revoke.logout.pending[0]);
assert.notEqual(revoke.pidMarker,restored.pidMarker);
assert.equal(restored.state,'authenticated');
assert.equal(restored.uidSha256,revoke.uidSha256);
assert.equal(restored.authorizationGeneration,2);
assert.deepEqual(restored.logout.pending,[]);
assert.deepEqual(restored.logout.completed,revoke.logout.pending);
const intent=await read('deletion-intent-before-cold.json');
const proof=await read('deletion-after-intent-cold.json');
const beforeSend=await read('deletion-remote-before-send.json');
const remoteProof=await read('deletion-remote-proof.json');
const held=await read('deletion-proof-only-held.json');
const pending=await read('deletion-local-cleanup-pending.json');
const complete=await read('deletion-complete-after-cold.json');
const remote=await read('deletion-remote-final.json');
assert.equal(intent.deletion.status,'remotePending');
assert.ok(intent.fault.hits.some(x=>x.stage==='durable-intent-before-deletion-send'));
assert.equal(beforeSend.authExists,true);
assert.equal(beforeSend.userExists,true);
assert.equal(beforeSend.operations.length,0);
assert.notEqual(intent.pidMarker,proof.pidMarker);
assert.equal(proof.deletion.status,'remoteDeleted');
assert.ok(proof.fault.hits.some(x=>x.stage==='remote-proof-before-local-cleanup'&&x.status===200));
for(const receipt of [proof,held,pending,complete])for(const key of ['operationIdSha256','operationSecretSha256','accountIdSha256'])assert.equal(receipt.deletion[key],intent.deletion[key]);
for(const receipt of [held,pending,complete])assert.equal(receipt.deletion.proofIdSha256,proof.deletion.proofIdSha256);
for(const receipt of [remoteProof,remote]){
  assert.equal(receipt.fixtureOnly,true);
  assert.equal(receipt.authExists,false);
  assert.equal(receipt.userExists,false);
  assert.equal(receipt.operations.length,1);
  const op=receipt.operations[0];
  assert.equal(op.status,'complete');
  assert.equal(op.proofStatus,'deleted');
  for(const key of ['operationIdSha256','operationSecretSha256','proofIdSha256'])assert.equal(op[key],complete.deletion[key]);
}
assert.equal(held.uidSha256,null);
assert.ok(held.fault.hits.some(x=>x.stage==='remote-proof-before-local-cleanup'&&x.status===200));
assert.equal(pending.state,'deletionPending');
assert.equal(pending.uidSha256,null);
assert.equal(pending.deletion.status,'localCleanupPending');
assert.equal(pending.fault.hits[0].stage,'after-one-local-learning-removal');
assert.equal(pending.fault.hits[0].remainingLearningKeys,1);
assert.notEqual(pending.pidMarker,complete.pidMarker);
assert.equal(complete.state,'signedOut');
assert.equal(complete.uidSha256,null);
assert.equal(complete.deletion.status,'complete');
assert.equal(complete.deletion.lastFailureCode,null);
assert.equal(complete.fault.action,null);
const before=await read('owner-ready-before-switch.json');
const final=await read('owner-ready-final.json');
const normal=await read('owner-normal-final.json');
assert.equal(final.state,'authenticated');
assert.equal(final.uidSha256,before.uidSha256);
assert.deepEqual(final.profile,before.profile);
assert.equal(normal.fault,null,'ordinary entrypoint has no fault prelude');
assert.deepEqual(final.learning,before.learning);
for(const key of ['pendingMutationCount','remoteAccountRevision','outboxSha256','acknowledgedSha256'])assert.deepEqual(final.sync[key],before.sync[key]);
const inventoryNames=['fixture-inventory-seeded.json','deletion-proof-inventory.json','deletion-local-cleanup-inventory.json','deletion-complete-inventory.json'];
const inventories=(await Promise.all(inventoryNames.map(read))).map(x=>x.inventory??x);
const fixtureProfile=inventories[0].profileInventories.find(x=>x.kind==='account'&&x.profileIdSha256!==before.profile.profileIdSha256);
assert.ok(fixtureProfile);
const category=(profile,name)=>profile.categoryInventories.find(x=>x.category===name);
assert.deepEqual(inventories.map(i=>category(i.profileInventories.find(p=>p.profileIdSha256===fixtureProfile.profileIdSha256),'learningProgress').keyCount),[2,2,1,0]);
for(const inventory of [...inventories,final.inventory]){
  assert.equal(inventory.complete,true);
  assert.equal(inventory.profileCount,3);
  for(const old of before.inventory.profileInventories){
    const current=inventory.profileInventories.find(x=>x.profileIdSha256===old.profileIdSha256);
    assert.ok(current);
    if(old.kind==='guest')assert.deepEqual(current,old);
    else for(const c of old.categoryInventories){
      if(['profileLifecycle','premiumCache'].includes(c.category))continue;
      assert.deepEqual(category(current,c.category),c);
    }
  }
  assert.deepEqual(inventory.globalInventories,before.inventory.globalInventories);
  assert.deepEqual(inventory.secureControl,before.inventory.secureControl);
}
const remoteOwner=await read('owner-remote-final.json');
const revokeRemote=await read('revoke-remote-sdk-held.json');
assert.deepEqual(remoteOwner,revokeRemote,'fixture deletion does not alter owner14 remote data');
const source=await read('source-copy-final.json');
assert.equal(source.runtimeSourceCount,707);
assert.deepEqual(source.different,[]);
assert.equal(source.entryRestored,true);
console.log(JSON.stringify({result:'PASS_RESIDUAL15_NATIVE',revokeAfterSdkBeforeAck:true,deletionIntentProofCleanupRestarts:true,deletionWithoutAuth:true,preservedLearningRecords:7,fixtureLearningKeys:[2,2,1,0],guestPopulated:false,normalEntryRestored:true}));
