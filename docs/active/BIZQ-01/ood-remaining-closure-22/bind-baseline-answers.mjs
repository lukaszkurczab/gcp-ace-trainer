// Evidence for position-independent old accepted meaning; not semantic acceptance.
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {canonicalJson, sha256} from '../../../../../patternly-content/scripts/build.mjs';
import {scoreQuestion} from '../../../../../patternly-content/scripts/content/question-contract.mjs';

const bytes = await readFile(new URL('N06-MANIFEST.json', import.meta.url));
const manifest = JSON.parse(bytes);
const items = [];
for (const unit of manifest.units) {
  for (const entry of unit.beforeItems) {
    const question = entry.beforeQuestion;
    assert.equal(question.answer.type, 'choice_single');
    const accepted = question.interaction.options.filter(option => option.optionId === question.answer.optionId);
    assert.equal(accepted.length, 1);
    assert.equal(scoreQuestion(question, {type:'choice_single', optionId:accepted[0].optionId}).earnedPoints, 1);
    items.push({questionId:question.questionId, mentalUnitId:question.mentalUnitId,
      beforeWholeObjectSha256:sha256(canonicalJson(question)), acceptedOptionId:accepted[0].optionId,
      acceptedText:accepted[0].text, zeroBasedArrayIndex:question.interaction.options.indexOf(accepted[0])});
  }
}
assert.equal(items.length, 180);
console.log(JSON.stringify({scope:'Actual frozen baseline accepted options resolved by answer.optionId and existing scorer; array index is evidence only, never answer identity', manifestSha256:sha256(bytes), questionCount:items.length, items}, null, 2));
