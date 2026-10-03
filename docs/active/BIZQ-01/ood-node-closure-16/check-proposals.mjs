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
const requested = process.argv.slice(3);
const units = requested.length ? manifest.units.filter(unit => requested.includes(unit.unit.slice(-3))) : manifest.units;
assert.equal(units.length, requested.length || 7, 'unknown/duplicate unit selection');
let optionCases = 0;
const results = units.map(unit => {
  assert.equal(hash(readFileSync(resolve(producer, unit.path))), unit.sourceSha256, 'current source changed during proposal review');
  const bytes = readFileSync(resolve(directory, `PROPOSED-${unit.unit.slice(-3)}.json`));
  const rows = JSON.parse(bytes);
  assert.equal(rows.length, 17);
  let soleLongestCorrect = 0;
  let repeatedReasonApplication = 0;
  for (const [index, row] of rows.entries()) {
    const question = row.question ?? row;
    const expected = unit.items[index];
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
assert.equal(hash(readFileSync(resolve(producer, 'content/object-oriented-design-interview/requirements_use_cases_domain_vocabulary_and_model_boundaries/OOD-N01-B01.json'))), manifest.acceptedB01.sourceSha256);
const result = { result: 'PASS', interpretation: 'proposal schema/identity/fixed-ID scoring and reversal only; style counts are warnings, not semantic verdicts or numeric gates', questionCount: results.length * 17, optionCases, units: results };
writeFileSync(process.argv[2], `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result));
