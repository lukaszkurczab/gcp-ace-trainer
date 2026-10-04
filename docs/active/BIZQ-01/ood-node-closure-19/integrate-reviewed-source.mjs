// One fixed reviewed package, not a general admission or authoring pipeline.
import assert from 'node:assert/strict';
import { readFile, writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sha256, validateTrack } from '../../../../../patternly-content/scripts/build.mjs';

const packet = fileURLToPath(new URL('./', import.meta.url));
const repo = resolve(packet, '../../../../../patternly-content');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const baseCommit = '90a1d83859c2be83c5266ffe981f487d3c29aeeb';
const trackId = 'object-oriented-design-interview';
const version = 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-19';
const priorVersion = 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-17';
const beforeQset = '4cf59f42c9e257118e1c2b1d4358753b67c80328f34c6c8350274baff7ffcbcc';
const proofRelative = 'evidence/business-quality/bizq-01-ood-node-closure-19.json';
const proposalHashes = [
  'c23224df332377b45f718bc10d903a7c9fe645954dd9778f30af503bbabef58b',
  'd70ee871a3ee7087c1b5d3d03f2feaedf041fd1d1cbb6267df2439a953abd237',
  '830a1fb12385d084279054f3d32db5261af24e7501700847b75e25f1c83ef0de',
  '25c09577a8ebcb0116dd1bf5ce2a763eaa011e8f58f42ebeb3e00f0591126360',
  '19912a8a5278b7fe5a88ac1864aca04327ff255ee46dd04b29c68ed0c21d7d32',
  'c7fc7970481fadc0795617e64af14e8cbcce8452d01bb3c45ca65fd6d75952ad',
  '846d741c52339153cf0ad2b72813ce2672908de733591aaf6afcd7dd42b00fc0',
  '68ca04a4849f4d1c7e20ff9592c4dbd2a028f7be86e51241015f91d3f7e56058',
  'd3327d2c3e1d42ca3079ac9a74dd05aba9e684bd2fee39115324b46cd84bbb19'
];
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(), baseCommit);
assert.equal(await access(resolve(repo, proofRelative)).then(() => true, () => false), false, 'Never overwrite the immutable proof');
// Reproduction starts at baseCommit with VERIFIER-PREPARATION.patch applied.
for (const [file, expected] of [
  ['SEMANTIC-REVIEW-B01-B04-v1.md', '396ac238572ba01ac0f62e00662382980ce0629c71260833c7fb2093d2c97d56'],
  ['SEMANTIC-REVIEW-B05-B09-v1.md', '449be3007ea9e571e68e5121c4d6bdacda7ec456b993b8c0561fd3b272b5ae2f'],
  ['SEMANTIC-CROSS-UNIT-v1.md', '96c0c9afc0ff8e54aae150d5a43dcbc907d29b7ba971efe8e12206e6ec6ccd99']
]) assert.equal(hash(await readFile(resolve(packet, file))), expected, 'Reviewed evidence changed');
const manifestBytes = await readFile(resolve(packet, 'MANIFEST.json'));
assert.equal(hash(manifestBytes), 'c344367f12072c110761664825bd95c6f40334eea89296cb56e9787ab847fe73');
const manifest = JSON.parse(manifestBytes);
const expectedUnits = Array.from({ length: 9 }, (_, i) => `OOD-N03-B${String(i + 1).padStart(2, '0')}`);
assert.deepEqual(manifest.units.map(u => u.unitId), expectedUnits);
const notes = new Map();
for (const [file, expectedHash] of [
  ['AUTHOR-NOTES-B01-B04.json', 'f66e00a55958eb51f535ef69edf2d938446493c8a7458101f187c2dc676cbc2e'],
  ['AUTHOR-NOTES-B05-B09.json', '1d5f8268f505a5decc7bfbdf5740a8896bb8415f31738ea77feec3d30a17f8e7']
]) {
  const bytes = await readFile(resolve(packet, file)); assert.equal(hash(bytes), expectedHash);
  for (const note of JSON.parse(bytes).items) { assert(!notes.has(note.beforeQuestionId)); notes.set(note.beforeQuestionId, note); }
}
assert.equal(notes.size, 162);
const validatedBefore = await validateTrack({ rootDirectory: repo, trackId });
assert.equal(sha256([...validatedBefore.questions].sort((a, b) => a.questionId < b.questionId ? -1 : 1)), beforeQset);
const scope = 'BIZQ-01 OOD source19, fixed nine-unit N03 cohort of 162 semantic replacements; not full-bank acceptance';
const identityReason = 'Whole-object review confirms each replacement changes the primary decision or accepted-answer meaning; the retired question and option identities remain only in immutable migration evidence.';
const confirmedDefects = [
  'The former generic lens-plus-invariant-owner choice lacked the decisive unit-specific facts required to assess its declared modeling decision.',
  'The former generic alternatives and coordinator-style error diagnosis did not explain the actual unit-specific choices.'
];
const sources = [], replacements = [], writes = [];
for (const [index, unit] of manifest.units.entries()) {
  const beforeBytes = await readFile(resolve(repo, unit.sourcePath));
  assert.equal(hash(beforeBytes), unit.sourceSha256);
  const before = JSON.parse(beforeBytes);
  assert.deepEqual(Buffer.from(JSON.stringify(before)), beforeBytes, 'Exact compact predecessor source');
  const proposedBytes = await readFile(resolve(packet, 'proposals', `${unit.unitId}.json`));
  assert.equal(hash(proposedBytes), proposalHashes[index]);
  const proposed = JSON.parse(proposedBytes); assert.equal(proposed.length, 18);
  const currentBytes = Buffer.from(JSON.stringify(proposed));
  const source = { sourceFile: unit.sourcePath, beforeSourceSha256: hash(beforeBytes), sourceSha256: hash(currentBytes), nodeId: proposed[0].nodeId, mentalUnitId: unit.unitId };
  sources.push(source); writes.push([resolve(repo, unit.sourcePath), currentBytes]);
  for (const [i, q] of proposed.entries()) {
    const map = unit.items[i]; const note = notes.get(map.oldQuestionId);
    assert.equal(note.identityAction, 'replace_question_with_new_id');
    assert.equal(q.questionId, map.proposedQuestionId); assert.equal(before[i].questionId, map.oldQuestionId);
    assert.equal(note.questionId, q.questionId); assert.equal(note.mentalUnitId, q.mentalUnitId);
    assert.deepEqual(note.sourceRefs, q.sourceRefs);
    replacements.push({ ...source, beforeQuestionId: before[i].questionId, questionId: q.questionId, nodeId: q.nodeId, mentalUnitId: q.mentalUnitId, learningObjective: note.learningObjective, confirmedDefects, identityAction: note.identityAction, identityReason: note.identityReason, acceptedOptionId: q.answer.optionId, sourceRefs: q.sourceRefs, beforeQuestion: before[i], currentQuestion: q });
  }
}
const retired = new Set(replacements.map(r => r.beforeQuestionId));
const currentQuestions = validatedBefore.questions.filter(q => !retired.has(q.questionId)).concat(replacements.map(r => r.currentQuestion)).sort((a, b) => a.questionId < b.questionId ? -1 : 1);
assert.equal(currentQuestions.length, 1413);
const proof = { schemaVersion: 'patternly-bizq-semantic-replacement-v1', scope, trackId, beforeProducerCommit: baseCommit, beforeContentVersion: priorVersion, contentVersion: version, beforeQuestionSetSha256: beforeQset, questionSetSha256: sha256(currentQuestions), sourceFiles: sources, identityAction: 'replace_question_with_new_id', identityReason, confirmedDefects, replacements };
const descriptor = { ...proof, path: proofRelative, replacements: replacements.map(({ beforeQuestion, currentQuestion, confirmedDefects: defects, ...item }) => item) };
function frozenLiteral(value, indent = 0) {
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  const pad = ' '.repeat(indent), next = ' '.repeat(indent + 2);
  if (Array.isArray(value)) return `Object.freeze([\n${value.map(v => next + frozenLiteral(v, indent + 2)).join(',\n')}\n${pad}])`;
  return `Object.freeze({\n${Object.entries(value).map(([k, v]) => next + JSON.stringify(k) + ': ' + frozenLiteral(v, indent + 2)).join(',\n')}\n${pad}})`;
}
const verifierPath = resolve(repo, 'scripts/content/verify-migration.mjs');
let verifier = await readFile(verifierPath, 'utf8');
assert.equal(hash(Buffer.from(verifier)), '1ec151499dd424df4f52f1375ec1bd63dea2bc9c13f64c34b7f7dc9d754bfe75', 'Apply only the verified preparation patch at the fixed predecessor');
assert(!verifier.includes('const BIZQ01_OOD_COHORT19_PROOF'));
const insert = 'const BIZQ01_OOD_COHORT17_ROOT_KEYS ='; assert.equal(verifier.split(insert).length, 2);
verifier = verifier.replace(insert, `const BIZQ01_OOD_COHORT19_PROOF = ${frozenLiteral(descriptor)};\n\n${insert}`);
assert.equal(verifier.split('if (accepted !== BIZQ01_OOD_COHORT17_PROOF) {').length, 2);
verifier = verifier.replace('if (accepted !== BIZQ01_OOD_COHORT17_PROOF) {', 'if (accepted !== BIZQ01_OOD_COHORT17_PROOF && accepted !== BIZQ01_OOD_COHORT19_PROOF) {');
const dispatch = '  if (version === BIZQ01_OOD_COHORT17_PROOF.contentVersion) {';
assert.equal(verifier.split(dispatch).length, 2);
verifier = verifier.replace(dispatch, '  if (version === BIZQ01_OOD_COHORT19_PROOF.contentVersion) {\n    const cohort = await validateBizq01OodClosedCohortProof(contentRoot, canonical, evidence, BIZQ01_OOD_COHORT19_PROOF);\n    if (!cohort) fail("EVIDENCE_MEMBERSHIP", "The source19 OOD version requires its fixed 162-question closure proof.");\n    return cohort;\n  }\n' + dispatch);
const guard = 'BIZQ01_OOD_COHORT16_PROOF.path, BIZQ01_OOD_COHORT17_PROOF.path]';
assert.equal(verifier.split(guard).length, 2);
verifier = verifier.replace(guard, 'BIZQ01_OOD_COHORT16_PROOF.path, BIZQ01_OOD_COHORT17_PROOF.path, BIZQ01_OOD_COHORT19_PROOF.path]');
const catalogPath = resolve(repo, 'content/catalog.json');
const catalogText = await readFile(catalogPath, 'utf8');
const catalog = JSON.parse(catalogText);
assert.equal(catalog.tracks.find(t => t.trackId === trackId).contentVersion, priorVersion);
assert.equal(catalogText.split(priorVersion).length, 2);
const nextCatalogText = catalogText.replace(priorVersion, version);
// All reads and assertions precede owned writes. Final verification runs in a fresh process.
for (const [target, bytes] of writes) await writeFile(target, bytes);
await writeFile(catalogPath, nextCatalogText);
await writeFile(resolve(repo, proofRelative), JSON.stringify(proof, null, 2) + '\n');
await writeFile(verifierPath, verifier);
const result = { result: 'INTEGRATED_PENDING_VERIFICATION', contentVersion: version, beforeProducerCommit: baseCommit, questionSetSha256: proof.questionSetSha256, proofSha256: hash(await readFile(resolve(repo, proofRelative))), replacements: 162, retained: 0, sourceFiles: sources, limits: 'Reviewed fixed source installation only; proof/canonical/build/preservation/consumer/admission/independent final gates remain pending.' };
await writeFile(resolve(packet, 'ROOT-SOURCE-INTEGRATION.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
