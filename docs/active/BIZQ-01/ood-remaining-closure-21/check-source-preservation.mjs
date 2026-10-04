// Run after source activation. Checks real source/preservation, not admission.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {validateTrack, sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const producer = new URL('../../../../../patternly-content/', packet);
const readJson = async url => JSON.parse(await readFile(url));
const before = await readJson(new URL('BEFORE-PRODUCTION.json', packet));
assert.equal(Object.keys(before.untouchedContentFiles).length, 944);
assert.equal(Object.keys(before.immutableProofs).length, 12);
for (const [path, expected] of Object.entries({...before.untouchedContentFiles, ...before.immutableProofs})) {
  assert.equal(sha256(await readFile(new URL(path, producer))), expected, path);
}
const mapBytes = await readFile(new URL('ROOT-N05-PRODUCER-MAP.json', packet));
assert.equal(sha256(mapBytes), '0d95dbf77a32f657197fa4789166a24fd68edad81cd367e9ea7b29c8578e6b70');
const map = JSON.parse(mapBytes);
const registry = await readJson(new URL('ROOT-CURRENT-N05-INPUTS.json', packet));
const oldById = new Map();
const sources = [];
for (const source of map.sourceFiles) {
  const bytes = await readFile(new URL(source.sourceFile, producer));
  assert.equal(sha256(bytes), source.sourceSha256);
  const questions = JSON.parse(bytes);
  const input = registry.units.find(item => item.unit === source.mentalUnitId);
  assert(input);
  const proposalBytes = await readFile(new URL(input.proposal, packet));
  assert.equal(sha256(proposalBytes), input.sha256);
  assert.deepEqual(questions, JSON.parse(proposalBytes));
  assert.equal(questions.length, 17);
  const items = map.sameIdCorrections.filter(item => item.sourceFile === source.sourceFile);
  assert.equal(items.length, 17);
  for (const item of items) {
    assert.equal(item.beforeQuestionId, item.questionId);
    const current = questions.find(q => q.questionId === item.questionId);
    assert.deepEqual(current, item.currentQuestion);
    assert.equal(current.difficulty, item.beforeQuestion.difficulty);
    for (const key of ['trackId', 'nodeId', 'mentalUnitId']) assert.equal(current[key], item.beforeQuestion[key]);
    assert(!oldById.has(item.questionId)); oldById.set(item.questionId, item.beforeQuestion);
  }
  const old = questions.map(q => oldById.get(q.questionId)).sort((a,b) => a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0);
  assert.equal(sha256(JSON.stringify(old)), source.beforeSourceSha256);
  sources.push({path: source.sourceFile, sha256: sha256(bytes), questionCount: questions.length});
}
assert.equal(oldById.size, 153);
const catalog = await readJson(new URL('content/catalog.json', producer));
const expectedCatalog = {...before.catalog, tracks: before.catalog.tracks.map(t => t.trackId === 'object-oriented-design-interview'
  ? {...t, contentVersion: map.contentVersion} : t)};
assert.deepEqual(catalog, expectedCatalog);
const validated = await validateTrack({rootDirectory: fileURLToPath(producer), trackId: 'object-oriented-design-interview'});
assert.equal(validated.questions.length, 1413);
assert.equal(sha256(validated.questions), map.questionSetSha256);
const historical = validated.questions.map(q => oldById.get(q.questionId) ?? q).sort((a,b) => a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0);
assert.equal(sha256(historical), map.beforeQuestionSetSha256);
assert.equal(validated.questions.filter(q => !oldById.has(q.questionId)).length, 1260);
console.log(JSON.stringify({result:'PASS', scope:'Root real153 source objects, sole catalog version,944 untouched files/12 proofs and exact v20 predecessor; not producer/consumer/admission/native acceptance',
  sourceFiles:sources, sameIdCorrections:153, replacements:0, untouchedFiles:944, immutableProofAndEvidenceFiles:12,
  preservedOtherOodQuestions:1260, currentOodQuestions:1413, questionSetSha256:map.questionSetSha256, beforeQuestionSetSha256:map.beforeQuestionSetSha256}, null, 2));
