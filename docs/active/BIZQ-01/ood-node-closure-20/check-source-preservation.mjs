// Run after the implementation owner finishes source writes. This does not run
// the migration verifier or establish producer/admission/native acceptance.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { validateTrack, sha256 } from '../../../../../patternly-content/scripts/build.mjs';
const packet = fileURLToPath(new URL('./', import.meta.url));
const producer = resolve(packet, '../../../../../patternly-content');
const json = async path => JSON.parse(await readFile(path));
const before = await json(resolve(packet, 'BEFORE-PRODUCTION.json'));
assert.equal(before.head, '98a7d0519005290cd2c0380d04b08a7b1bdebcde');
const manifestBytes = await readFile(resolve(packet, 'MANIFEST.json'));
assert.equal(sha256(manifestBytes), '74f929fef0122d1d75412e07d6b86ab2b634056dd0ed0a98a7051baca7e0eec0');
const manifest = JSON.parse(manifestBytes);
const bindingBytes = await readFile(resolve(packet, 'ROOT-FINAL-BINDINGS-v2.json'));
assert.equal(sha256(bindingBytes), '0572a16b6baef2256f417e5c7c6df0b501b0bc7dbe350dc18dcd23a879c3c6f3');
const bindings = JSON.parse(bindingBytes);
assert.equal(Object.keys(before.untouchedContentFiles).length, 944);
assert.equal(Object.keys(before.immutableProofs).length, 11);
for (const [path, expected] of Object.entries({ ...before.untouchedContentFiles, ...before.immutableProofs })) {
  assert.equal(sha256(await readFile(resolve(producer, path))), expected, `Preserved file changed: ${path}`);
}
const oldByCurrentId = new Map();
const files = [];
for (const input of bindings.units) {
  const unit = manifest.files.find(u => u.mentalUnitId === input.unit);
  const raw = await readFile(resolve(producer, input.sourcePath));
  assert.equal(sha256(raw), input.proposedSourceSha256, 'Actual compact source differs from approved bytes');
  const questions = JSON.parse(raw);
  const proposed = await json(resolve(packet, 'proposals', `${input.unit}.json`));
  assert.deepEqual(questions, proposed, 'Actual whole source objects differ from frozen proposal');
  assert.equal(questions.length, 18);
  const old = unit.items.map(i => i.oldQuestion);
  assert.equal(sha256(JSON.stringify(old)), input.beforeSourceSha256);
  for (const [i, action] of input.identityActions.entries()) {
    assert.equal(questions[i].questionId, action.questionId);
    assert.equal(old[i].questionId, action.beforeQuestionId);
    oldByCurrentId.set(action.questionId, old[i]);
  }
  files.push({ path: input.sourcePath, sourceSha256: sha256(raw), questionCount: 18 });
}
assert.equal(oldByCurrentId.size, 162);
const catalog = await json(resolve(producer, 'content/catalog.json'));
const expectedCatalog = { ...before.catalog, tracks: before.catalog.tracks.map(t => t.trackId === 'object-oriented-design-interview'
  ? { ...t, contentVersion: 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-20' } : t) };
assert.deepEqual(catalog, expectedCatalog, 'Catalog changes extend beyond OOD content version');
const validated = await validateTrack({ rootDirectory: producer, trackId: 'object-oriented-design-interview' });
assert.equal(validated.questions.length, 1413);
assert.equal(sha256(validated.questions), bindings.proposedQuestionSetSha256);
const historical = validated.questions.map(q => oldByCurrentId.get(q.questionId) ?? q)
  .sort((a, b) => a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0);
assert.equal(sha256(historical), bindings.beforeQuestionSetSha256, 'Exact whole predecessor question set not restored');
assert.equal(validated.questions.filter(q => !oldByCurrentId.has(q.questionId)).length, 1251);
console.log(JSON.stringify({ verdict: 'PASS', scope: 'Actual source bytes/whole objects, preservation inventory, sole catalog-version change and exact whole OOD predecessor; not migration/producer/consumer/admission/native acceptance',
  baselineCommit: before.head, changedSourceFiles: files, changedN04Objects: 162,
  semanticReplacements: 144, sameIdCorrections: 18, untouchedContentFiles: 944,
  immutableProofAndEvidenceFiles: 11, unchangedNonN04OodObjects: 1251, oodQuestionCount: 1413,
  beforeQuestionSetSha256: bindings.beforeQuestionSetSha256,
  currentQuestionSetSha256: bindings.proposedQuestionSetSha256 }, null, 2));
