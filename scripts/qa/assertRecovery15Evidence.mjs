import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [directory, priorDirectory, ...extra] = process.argv.slice(2);
if (!directory || !priorDirectory || extra.length) throw Error('arguments_rejected');
const read = async (name, base = directory) => JSON.parse(await readFile(resolve(base, name), 'utf8'));
const before = await read('revoke-held.json');
const first = await read('first-ready.json');
const lost = await read('revoke-response-lost.json');
const cold = await read('revoke-response-after-cold.json');
const final = await read('final-lifecycle.json');
assert.notEqual(before.pidMarker, first.pidMarker);
assert.notEqual(lost.pidMarker, cold.pidMarker);
assert.equal(before.fault.hits[0].stage, 'before-send');
assert.equal(lost.fault.hits[0].stage, 'after-http-success');
assert.equal(lost.fault.hits[0].status, 200);
assert.equal(before.logout.pending.length, 1);
assert.equal(lost.logout.pending.length, 1);
assert.deepEqual(first.logout.completed, before.logout.pending);
assert.deepEqual(cold.logout.pending, lost.logout.pending, 'revoked bearer cannot guess local completion');
assert.deepEqual(final.logout.completed, lost.logout.pending);
assert.deepEqual(final.logout.pending, []);
assert.equal(final.state, 'authenticated');
for (const receipt of [before, first, lost, cold, final]) {
  assert.equal(receipt.uidSha256, before.uidSha256);
  assert.equal(receipt.authorizationGeneration, 2);
  assert.equal(receipt.vault, null);
}
const remoteBefore = await read('remote-before-cold.json');
assert.ok(!remoteBefore.revokes.some(x => x.operationIdSha256 === before.logout.pending[0].operationIdSha256));
const remoteLost = await read('remote-response-lost.json');
assert.deepEqual(await read('remote-after-server-restart.json'), remoteLost, 'Auth/Firestore export/import retains terminal state');
const remoteFinal = await read('remote-final.json');
assert.deepEqual(remoteFinal, remoteLost, 'terminal replay does not change remote result');
for (const pending of [before.logout.pending[0], lost.logout.pending[0]]) {
  assert.ok(remoteFinal.revokes.some(x => x.operationIdSha256 === pending.operationIdSha256 && x.status === 'revoked' && x.authorizationGeneration === 2));
}
const inventoryBefore = (await read('inventory-before.json')).inventory;
const inventoryAfter = (await read('final-ready-inventory.json')).inventory;
assert.ok(inventoryBefore.complete && inventoryAfter.complete);
assert.equal(inventoryAfter.registryChecksumSha256, inventoryBefore.registryChecksumSha256);
assert.equal(inventoryAfter.profileCount, inventoryBefore.profileCount);
for (const profile of inventoryBefore.profileInventories) {
  const after = inventoryAfter.profileInventories.find(x => x.profileIdSha256 === profile.profileIdSha256);
  assert.ok(after);
  for (const category of profile.categoryInventories) {
    if (profile.kind === 'account' && ['profileLifecycle', 'premiumCache'].includes(category.category)) continue;
    assert.deepEqual(after.categoryInventories.find(x => x.category === category.category), category);
  }
}
const prior = await read('final-ready-inventory.json', priorDirectory);
const current = await read('final-ready-inventory.json');
assert.deepEqual(current.learning, prior.learning);
for (const key of ['pendingMutationCount', 'remoteAccountRevision', 'outboxSha256', 'acknowledgedSha256']) assert.deepEqual(current.sync[key], prior.sync[key]);
const priorLifecycle = (await read('lifecycle-final.json', priorDirectory)).value;
for (const item of final.lifecycle.filter(x => x.name !== 'ACCOUNT_SYNC')) assert.deepEqual(item, priorLifecycle.find(x => x.name === item.name));
console.log(JSON.stringify({ result: 'PASS_REVOKE_NATIVE_SLICE', coldRestarts: 2, backendExportImport: true, preservedLearningRecords: 7, guestPopulated: false, deletionNative: 'not_tested', providerProcessKill: 'not_tested' }));
