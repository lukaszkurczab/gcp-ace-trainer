// Read-only, fixed N05 producer-map preparation. Does not activate content.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalJson, sha256} from '../../../../../patternly-content/scripts/build.mjs';
const packet = new URL('./', import.meta.url);
const read = async name => readFile(new URL(name, packet));
const registryBytes = await read('ROOT-CURRENT-N05-INPUTS.json');
assert.equal(sha256(registryBytes), 'f7f50f13bb2f957c6f41442f1e6d79bb843a096fd7911b77103087fde71624ee');
const registry = JSON.parse(registryBytes);
const manifestBytes = await read('N05-MANIFEST.json');
assert.equal(sha256(manifestBytes), registry.manifestSha256);
const manifest = JSON.parse(manifestBytes);
const prospectiveBytes = await read('ROOT-PROSPECTIVE-N05-BINDINGS.json');
const prospective = JSON.parse(prospectiveBytes);
assert.equal(prospective.prospectiveQuestionSetSha256, '6d19a75e8eae86869b3ce31b63ad57a6be13fc30532c22e993db6fbc3d0d4d12');
const noteInputs = [];
const notes = new Map();
for (const name of ['AUTHOR-NOTES-B01-B04.json', 'AUTHOR-NOTES-B05-B09.json']) {
  const bytes = await read(name);
  noteInputs.push({path: name, sha256: sha256(bytes)});
  for (const item of JSON.parse(bytes).items) {
    assert(!notes.has(item.questionId));
    notes.set(item.questionId, item);
  }
}
assert.equal(notes.size, 153);
const oldOptions = new Set();
const currentOptions = new Set();
let oldOptionSlots = 0;
const sameIdCorrections = [];
for (const input of registry.units) {
  const bytes = await read(input.proposal);
  assert.equal(sha256(bytes), input.sha256);
  assert.equal(sha256(await read(input.frozenInput)), input.sha256);
  const questions = JSON.parse(bytes);
  const unit = manifest.units.find(item => item.mentalUnitId === input.unit);
  const source = prospective.sourceFiles.find(item => item.mentalUnitId === input.unit);
  assert(unit && source);
  assert.equal(sha256(await read(`../../../../../patternly-content/${unit.sourceFile}`)), unit.beforeSourceSha256);
  assert.equal(sha256(JSON.stringify(questions)), source.prospectiveSourceSha256);
  assert.equal(questions.length, 17);
  for (const question of questions) {
    const before = unit.items.find(item => item.beforeQuestionId === question.questionId);
    const note = notes.get(question.questionId);
    assert(before && note);
    assert.equal(sha256(canonicalJson(before.beforeQuestion)), before.beforeQuestionSha256);
    assert.equal(note.beforeQuestionId, question.questionId);
    assert.equal(note.identityAction, 'preserve_question_id');
    assert.equal(question.mentalUnitId, unit.mentalUnitId);
    assert.equal(question.nodeId, source.nodeId);
    assert.deepEqual(note.sourceRefs, question.sourceRefs);
    assert(question.interaction.options.some(option => option.optionId === question.answer.optionId));
    for (const option of before.beforeQuestion.interaction.options) {oldOptions.add(option.optionId); oldOptionSlots++;}
    for (const option of question.interaction.options) {
      assert(!currentOptions.has(option.optionId));
      currentOptions.add(option.optionId);
    }
    sameIdCorrections.push({sourceFile: unit.sourceFile, beforeSourceSha256: unit.beforeSourceSha256,
      sourceSha256: source.prospectiveSourceSha256, beforeQuestionId: question.questionId,
      questionId: question.questionId, nodeId: question.nodeId, mentalUnitId: question.mentalUnitId,
      learningObjective: note.learningObjective, confirmedDefects: before.confirmedFinding.findingCodes,
      identityAction: note.identityAction, identityReason: note.identityReason,
      acceptedOptionId: question.answer.optionId, sourceRefs: question.sourceRefs,
      beforeQuestion: before.beforeQuestion, currentQuestion: question});
  }
}
assert.equal(sameIdCorrections.length, 153);
assert.equal(currentOptions.size, 612);
assert.equal(oldOptionSlots, 765);
assert([...currentOptions].every(id => !oldOptions.has(id)));
console.log(JSON.stringify({result: 'PASS', scope: 'Fixed actual N05 same-ID producer-map preparation; not producer/admission acceptance',
  registrySha256: sha256(registryBytes), manifestSha256: sha256(manifestBytes),
  prospectiveBindingsSha256: sha256(prospectiveBytes), noteInputs, oldOptionSlots,
  currentUniqueOptionIds: currentOptions.size, overlapWithOldCohort: 0,
  beforeContentVersion: manifest.beforeContentVersion,
  contentVersion: 'object-oriented-design-interview-authoring-v2026.10.04-bizq01-21',
  beforeQuestionSetSha256: manifest.beforeQuestionSetSha256,
  questionSetSha256: prospective.prospectiveQuestionSetSha256,
  sourceFiles: prospective.sourceFiles.map(({sourceFile, nodeId, mentalUnitId, beforeSourceSha256, prospectiveSourceSha256}) =>
    ({sourceFile, beforeSourceSha256, sourceSha256: prospectiveSourceSha256, nodeId, mentalUnitId})),
  replacements: [], sameIdCorrections}, null, 2));
