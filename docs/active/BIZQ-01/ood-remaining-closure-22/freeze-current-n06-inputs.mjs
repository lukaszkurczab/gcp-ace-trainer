// Fixed prepared inputs for independent whole-cohort review, not an acceptance map.
import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {canonicalJson, sha256, validateTrack} from '../../../../../patternly-content/scripts/build.mjs';

const packet = new URL('./', import.meta.url);
const content = new URL('../../../../../patternly-content/', import.meta.url);
const manifestBytes = await readFile(new URL('N06-MANIFEST.json', packet));
const manifest = JSON.parse(manifestBytes);
const versions = ['v2','v2','v2','v1','v3','v4','v5','v5','v3','v3'];
const units = [], items = [], currentById = new Map();
for (let index = 0; index < versions.length; index++) {
  const unitName = 'B' + String(index + 1).padStart(2, '0');
  const version = versions[index];
  const proposalPath = `review-inputs/N06-${unitName}-${version}.json`;
  const notesPath = index === 0 || index === 2 || index === 3
    ? `review-inputs/AUTHOR-NOTES-N06-${unitName}-${version}.json`
    : `review-inputs/N06-${unitName}-${version}-NOTES.json`;
  const proposalBytes = await readFile(new URL(proposalPath, packet));
  assert(proposalBytes.equals(await readFile(new URL(`proposals/N06-${unitName}.json`, packet))));
  const notesBytes = await readFile(new URL(notesPath, packet));
  const questions = JSON.parse(proposalBytes), notes = JSON.parse(notesBytes);
  assert.equal(questions.length, 18); assert.equal(notes.items.length, 18);
  const unit = manifest.units.find(u => u.mentalUnitId === `OOD-N06-${unitName}`);
  assert(unit); assert.equal(unit.beforeItems.length, 18);
  const checkPath = `ROOT-PROPOSAL-N06-${unitName}-${version}.json`;
  const checkBytes = await readFile(new URL(checkPath, packet));
  const check = JSON.parse(checkBytes);
  assert.equal(check.result, 'PASS'); assert.equal(check.proposalSha256, sha256(proposalBytes));
  for (const question of questions) {
    assert(!currentById.has(question.questionId)); currentById.set(question.questionId, question);
    const entry = unit.beforeItems.find(item => item.questionId === question.questionId);
    assert(entry, 'All current proposals are same-question-ID, not semantic acceptance');
    const note = notes.items.find(item => item.questionId === question.questionId);
    assert(note); assert.equal(note.beforeQuestionId, entry.questionId);
    assert.equal(note.mentalUnitId, unit.mentalUnitId);
    const key = question.interaction.options.find(option => option.optionId === question.answer.optionId);
    const beforeKey = entry.beforeQuestion.interaction.options.find(option => option.optionId === entry.beforeQuestion.answer.optionId);
    assert(key); assert(beforeKey);
    items.push({sourcePath:unit.sourcePath, beforeQuestionId:entry.questionId,
      questionId:question.questionId, mentalUnitId:unit.mentalUnitId,
      beforeWholeQuestionSha256:sha256(canonicalJson(entry.beforeQuestion)),
      currentWholeQuestionSha256:sha256(canonicalJson(question)),
      beforeAcceptedOptionId:beforeKey.optionId, acceptedOptionId:key.optionId,
      beforeAcceptedText:beforeKey.text, acceptedText:key.text,
      identityShape:'same-ID proposal; final independent meaning/map acceptance required'});
  }
  units.push({mentalUnitId:unit.mentalUnitId, version, sourcePath:unit.sourcePath,
    proposalPath, proposalSha256:sha256(proposalBytes), notesPath,
    notesSha256:sha256(notesBytes), rootMechanicalCheckPath:checkPath,
    rootMechanicalCheckSha256:sha256(checkBytes)});
}
assert.equal(items.length, 180);
const track = await validateTrack({rootDirectory:fileURLToPath(content), trackId:manifest.trackId});
assert.equal(track.track.contentVersion, manifest.contentVersion);
assert.equal(sha256(canonicalJson(track.questions)), manifest.questionSetSha256);
for (const item of items) {
  const old = track.questions.find(question => question.questionId === item.beforeQuestionId);
  assert(old); assert.equal(sha256(canonicalJson(old)), item.beforeWholeQuestionSha256);
}
const prospective = track.questions.map(question => currentById.get(question.questionId) ?? question);
const receipt = {stage:'Prepared actual frozen inputs for independent whole180 review; not accepted identity map, producer design or source activation',
  manifestSha256:sha256(manifestBytes), beforeContentVersion:manifest.contentVersion,
  beforeQuestionSetSha256:manifest.questionSetSha256, prospectiveQuestionSetSha256:sha256(canonicalJson(prospective)),
  wholeQuestionCount:track.questions.length, currentProposalCount:180, preservedOtherQuestionCount:1233,
  acceptedN01N05QuestionCount:765, sameIdProposalCount:180, replacementProposalCount:0,
  fingerprintEncoding:'SHA-256 of canonicalJson from existing content builder', units, items};
await writeFile(new URL('ROOT-CURRENT-N06-INPUTS.json', packet), JSON.stringify(receipt, null, 2) + '\n', {flag:'wx'});
console.log(JSON.stringify({result:'PASS', scope:receipt.stage, units:10, proposals:180,
  prospectiveQuestionSetSha256:receipt.prospectiveQuestionSetSha256}));
