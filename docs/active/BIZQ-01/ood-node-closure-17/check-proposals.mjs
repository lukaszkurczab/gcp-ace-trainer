import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { validateQuestion, scoreQuestion } from '../../../../../patternly-content/scripts/content/question-contract.mjs';
const directory = dirname(fileURLToPath(import.meta.url));
const app = resolve(directory, '../../../..');
const producer = resolve(app, '../patternly-content');
const manifest = JSON.parse(readFileSync(resolve(directory, 'PREFLIGHT-MANIFEST.json'), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
// Exact current-source and accepted-N01 pins fixed at preflight; the manifest cannot redefine scope.
const FIXED_UNITS = [
  {
    "unit": "OOD-N02-B01",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B01.json",
    "sourceSha256": "0fdcd70fa6df580662c77a3b163f714f54633471577130acddd0234ec1786b46"
  },
  {
    "unit": "OOD-N02-B02",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B02.json",
    "sourceSha256": "1db97e9e36b24e19f53d70509de137b1f987c19a47f0cd2c9243e40a1d2f8042"
  },
  {
    "unit": "OOD-N02-B03",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B03.json",
    "sourceSha256": "57493bbfa63bf607ed2d1026f346e2e1c991fe22b46d7e557c685924c2b0e0c1"
  },
  {
    "unit": "OOD-N02-B04",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B04.json",
    "sourceSha256": "8873e113b42716532352589e8bf896e4896b0580b1adc57f8c7513d48f197e9a"
  },
  {
    "unit": "OOD-N02-B05",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B05.json",
    "sourceSha256": "a91532674af030117f673fd934ffbdc383569300bc790a8c6109ea2811a0c2a0"
  },
  {
    "unit": "OOD-N02-B06",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B06.json",
    "sourceSha256": "aa4e039351ff6bf2d4903889e642fbba88469141542d61add8ccda69a26f5e70"
  },
  {
    "unit": "OOD-N02-B07",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B07.json",
    "sourceSha256": "bfe5b9062b4c33f042b6c6cda31909d1780a82232ff0d5e75b3fdee56612f82e"
  },
  {
    "unit": "OOD-N02-B08",
    "path": "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B08.json",
    "sourceSha256": "4021e846165b3418bdf6dcdf1ee4771a43d6ece7d845dbb37f559385a0fcaa8b"
  }
];
const FIXED_N01 = [
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json",
    "sha256": "224c0d2d9fd5c367a0c8a7a8c0e139ca827d308d7d60fdce7d18c627ba1dbfa0"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B02.json",
    "sha256": "215397c1609b3f058dee249c6ef54c43a4a0696e9aa94c80c673a046b6b8b5a9"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B03.json",
    "sha256": "3fe8c393ee1d336cd1ea2fb39ceae7c9eb891184ab0e4dc26b07285a26b70575"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B04.json",
    "sha256": "24ff127bcf9b1a1e9eae5e0ac51e048a590661ff16e67c3469fee78cd8e153a5"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B05.json",
    "sha256": "9a8bc00943bf65ea36223f9d5513c7cfa26df7357e77e99848faf3c88235556d"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B06.json",
    "sha256": "d09097dc78773ac03587b649e4d4e78f672208ef554b21eb76dfb801d7393c7b"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B07.json",
    "sha256": "a3e7964e959f710e2d2029e8b98c7f3b9135deaee7f98ada02f3862fa60a5e43"
  },
  {
    "path": "content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B08.json",
    "sha256": "0c1053f6c6e722dc6954c4dc56cfbeed407d9ad9082ed3550129acb565612319"
  }
];
assert.equal(manifest.node, 'objects_responsibilities_encapsulation_and_invariants');
assert.equal(manifest.scopeCount, 152);
assert.deepEqual(manifest.units.map(unit => unit.unit), FIXED_UNITS.map(unit => unit.unit));
assert.deepEqual(manifest.acceptedN01Sources, FIXED_N01);
const oldIds = new Set();
const newIds = new Set();
for (const [unitIndex, unit] of manifest.units.entries()) {
  const fixed = FIXED_UNITS[unitIndex];
  assert.equal(unit.path, fixed.path);
  assert.equal(unit.sourceSha256, fixed.sourceSha256);
  const sourceBytes = readFileSync(resolve(producer, fixed.path));
  assert.equal(hash(sourceBytes), fixed.sourceSha256, 'fixed preflight source bytes changed');
  const source = JSON.parse(sourceBytes);
  assert.equal(source.length, 19);
  assert.equal(unit.items.length, 19);
  for (const [index, item] of unit.items.entries()) {
    const prefix = `ood-n02-b${String(unitIndex + 1).padStart(2, '0')}-i`;
    const oldId = `${prefix}${String(index + 1).padStart(3, '0')}`;
    const newId = `${prefix}${String(index + 20).padStart(3, '0')}`;
    assert.equal(item.oldItemId, oldId);
    assert.equal(item.newItemId, newId);
    assert.equal(item.oldObject.questionId, oldId);
    assert.equal(item.oldObject.nodeId, manifest.node);
    assert.equal(item.oldObject.mentalUnitId, fixed.unit);
    assert.deepEqual(item.oldObject, source[index]);
    assert.ok(!oldIds.has(oldId) && !newIds.has(newId), 'duplicate fixed mapping');
    oldIds.add(oldId); newIds.add(newId);
  }
}
assert.equal(oldIds.size, 152); assert.equal(newIds.size, 152);
for (const pinned of FIXED_N01) assert.equal(hash(readFileSync(resolve(producer, pinned.path))), pinned.sha256, 'accepted N01 source changed');
const requested = process.argv.slice(3);
const units = requested.length ? manifest.units.filter(unit => requested.includes(unit.unit.slice(-3))) : manifest.units;
assert.equal(units.length, requested.length || 8, 'unknown/duplicate unit selection');
let optionCases = 0;
const results = units.map(unit => {
  assert.equal(hash(readFileSync(resolve(producer, unit.path))), unit.sourceSha256, 'current source changed during proposal review');
  const bytes = readFileSync(resolve(directory, `PROPOSED-${unit.unit.slice(-3)}.json`));
  const rows = JSON.parse(bytes);
  assert.equal(rows.length, 19);
  let soleLongestCorrect = 0;
  let repeatedReasonApplication = 0;
  for (const [index, row] of rows.entries()) {
    const question = row.question ?? row;
    const expected = unit.items[index];
    assert.equal(typeof row.learningObjective, 'string');
    assert.ok(row.learningObjective.trim(), 'explicit objective missing');
    if (row.question) {
      assert.equal(row.beforeQuestionId, expected.oldItemId);
      assert.equal(row.questionId, expected.newItemId);
    }
    assert.equal(question.questionId, expected.newItemId);
    assert.equal(question.trackId, expected.oldObject.trackId);
    assert.equal(question.nodeId, expected.oldObject.nodeId);
    assert.equal(question.mentalUnitId, unit.unit);
    assert.equal(question.interaction.type, expected.oldObject.interaction.type);
    assert.equal(question.interaction.scoringMethod, expected.oldObject.interaction.scoringMethod);
    const validation = validateQuestion(question);
    assert(validation.valid, `${question.questionId}: ${validation.errors.join('; ')}`);
    const options = question.interaction.options;
    const correct = options.find(option => option.optionId === question.answer.optionId);
    const words = text => text.trim().split(/\s+/u).length;
    if (options.filter(option => option !== correct).every(option => words(correct.text) > words(option.text))) soleLongestCorrect++;
    if (question.feedback.reason === question.feedback.details.scenarioApplication) repeatedReasonApplication++;
    for (const option of options) {
      const accepted = option.optionId === question.answer.optionId;
      for (const candidate of [question, { ...question, interaction: { ...question.interaction, options: [...options].reverse() } }]) {
        const score = scoreQuestion(candidate, { type: 'choice_single', optionId: option.optionId });
        assert.equal(score.earnedPoints, accepted ? 1 : 0, `${question.questionId}/${option.optionId}`);
        assert.equal(score.status, accepted ? 'correct' : 'incorrect');
        optionCases++;
      }
    }
  }
  return { unit: unit.unit, proposalSha256: hash(bytes), questionCount: rows.length, advisory: { soleLongestCorrect, repeatedReasonApplication } };
});
for (const preserved of manifest.acceptedN01Sources) assert.equal(hash(readFileSync(resolve(producer, preserved.path))), preserved.sha256, 'accepted N01 source changed');
const result = { result: 'PASS', interpretation: 'proposal schema/identity/fixed-ID scoring and reversal only; style counts are warnings, not semantic verdicts or numeric gates', questionCount: results.length * 19, optionCases, units: results };
writeFileSync(process.argv[2], `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
