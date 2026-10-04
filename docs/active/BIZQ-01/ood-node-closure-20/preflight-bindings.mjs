// Read-only byte/object bindings using the actual producer loader and hashing.
// Usage: node preflight-bindings.mjs ROOT-FINAL-REVIEW-INPUTS-v2.json
// This establishes reproducible inputs, never semantic approval or admission.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateTrack, sha256 } from '../../../../../patternly-content/scripts/build.mjs';

const packet = fileURLToPath(new URL('./', import.meta.url));
const producer = resolve(packet, '../../../../../patternly-content');
const inputName = process.argv[2];
assert(inputName && basename(inputName) === inputName, 'Pass one packet-local input filename');
const inputBytes = await readFile(resolve(packet, inputName));
const inputs = JSON.parse(inputBytes);
const manifestBytes = await readFile(resolve(packet, 'MANIFEST.json'));
assert.equal(sha256(manifestBytes), '74f929fef0122d1d75412e07d6b86ab2b634056dd0ed0a98a7051baca7e0eec0');
const manifest = JSON.parse(manifestBytes);
assert.equal(inputs.units.length, 9);
assert.equal(new Set(inputs.units.map(u => u.unit)).size, 9);
const current = await validateTrack({ rootDirectory: producer, trackId: 'object-oriented-design-interview' });
const beforeHash = sha256(current.questions);
assert.equal(beforeHash, '6f493ddd0ebfbbd5fa7acf98e17de69420360925f498791a683aca5f1d7f1f53');
const owners = (await Promise.all(['AUTHOR-NOTES-B01-B04.json', 'AUTHOR-NOTES-B05-B09.json']
  .map(async f => JSON.parse(await readFile(resolve(packet, f)))))).flatMap(n => n.items);
const replacements = new Map();
const bindings = [];
let optionCases = 0;
for (const input of inputs.units) {
  const unit = manifest.files.find(u => u.mentalUnitId === input.unit);
  assert(unit, 'Unknown manifest unit');
  const rawBefore = await readFile(resolve(producer, unit.path));
  assert.equal(sha256(rawBefore), unit.sha256);
  const oldQuestions = JSON.parse(rawBefore);
  assert.equal(sha256(JSON.stringify(oldQuestions)), unit.sha256, 'Compact encoding must reproduce actual source bytes');
  assert.deepEqual(oldQuestions, unit.items.map(i => i.oldQuestion));
  const bytes = await readFile(resolve(packet, input.proposalPath));
  assert.equal(sha256(bytes), input.proposalSha256);
  assert.deepEqual(bytes, await readFile(resolve(packet, 'proposals', `${input.unit}.json`)));
  const questions = JSON.parse(bytes);
  const noteBytes = await readFile(resolve(packet, input.notesPath));
  assert.equal(sha256(noteBytes), input.notesSha256);
  const notes = JSON.parse(noteBytes).items;
  assert.deepEqual(notes, owners.filter(n => n.mentalUnitId === input.unit));
  assert.equal(questions.length, 18);
  assert.equal(notes.length, 18);
  const report = JSON.parse(await readFile(resolve(packet, input.structuralEvidence)));
  assert.equal(report.verdict, 'PASS');
  const result = report.units.find(u => u.unit === input.unit);
  assert.equal(result.proposalSha256, input.proposalSha256, 'Reusable check must bind these bytes');
  const identityActions = notes.map((n, i) => {
    const m = unit.items[i];
    assert.equal(n.beforeQuestionId, m.itemId);
    assert.equal(n.questionId, questions[i].questionId);
    const newIdentity = n.identityAction === 'replace_question_with_new_id';
    assert(newIdentity || n.identityAction === 'preserve_question_id');
    assert.equal(n.questionId, newIdentity ? m.reservedReplacementId : m.itemId);
    if (newIdentity) assert(!current.questions.some(q => q.questionId === n.questionId), 'New ID is already occupied');
    replacements.set(m.itemId, questions[i]);
    return { beforeQuestionId: m.itemId, questionId: n.questionId, identityAction: n.identityAction };
  });
  assert.equal(result.replaced, identityActions.filter(i => i.identityAction === 'replace_question_with_new_id').length);
  assert.equal(result.retained, identityActions.filter(i => i.identityAction === 'preserve_question_id').length);
  const cases = questions.reduce((n, q) => n + q.interaction.options.length * 2, 0);
  assert.equal(cases, input.optionCases);
  optionCases += cases;
  bindings.push({ unit: input.unit, sourcePath: unit.path, beforeSourceSha256: unit.sha256,
    proposalSha256: input.proposalSha256, notesSha256: input.notesSha256,
    proposedSourceSha256: sha256(JSON.stringify(questions)),
    sourceEncoding: 'JSON.stringify(questionArray), compact UTF-8, no final newline', identityActions });
}
assert.equal(replacements.size, 162);
const proposed = current.questions.map(q => replacements.get(q.questionId) ?? q)
  .sort((a, b) => a.questionId < b.questionId ? -1 : a.questionId > b.questionId ? 1 : 0);
assert.equal(new Set(proposed.map(q => q.questionId)).size, 1413);
const untouched = current.questions.filter(q => !replacements.has(q.questionId));
assert.equal(untouched.length, 1251);
for (const q of untouched) assert.deepEqual(proposed.find(p => p.questionId === q.questionId), q);
const actions = bindings.flatMap(b => b.identityActions);
console.log(JSON.stringify({ scope: 'Read-only exact frozen proposals/notes, actual compact source encoding and real producer question-set hash; not semantic approval, activation, admission or native acceptance',
  inputBindings: inputName, inputSha256: sha256(inputBytes), manifestSha256: sha256(manifestBytes),
  questionCount: 1413, proposalQuestionCount: 162, reusedMatchingScoringCases: optionCases,
  unchangedNonN04Objects: untouched.length, beforeQuestionSetSha256: beforeHash,
  proposedQuestionSetSha256: sha256(proposed),
  declaredReplacementCount: actions.filter(a => a.identityAction === 'replace_question_with_new_id').length,
  declaredRetainedCount: actions.filter(a => a.identityAction === 'preserve_question_id').length,
  units: bindings }, null, 2));
