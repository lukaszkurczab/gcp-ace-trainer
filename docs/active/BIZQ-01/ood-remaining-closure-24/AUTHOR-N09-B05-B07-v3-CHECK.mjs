import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQuestion, scoreQuestion } from '../../../../../patternly-content/scripts/content/question-contract.mjs';
import { canonicalJson, sha256 } from '../../../../../patternly-content/scripts/build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relativePath) => {
  const bytes = readFileSync(path.join(here, relativePath));
  return { value: JSON.parse(bytes.toString('utf8')), sha256: createHash('sha256').update(bytes).digest('hex') };
};
const expectedV2 = {
  B05: 'bc2700a32341370d4bd177fc3d3f940718f21e26e9f112fb146e57ff9e020497',
  B06: '8de7e8965b42bc3835282c716a6665617bb20551fc42f5589424c08021596052',
  B07: '99d20efb139d9dafb9a57a2947ba1520f6df468991480863764b1330ec0b6f82'
};
const expectedTargets = {
  B05: [
    'n09b05_i002_remove_old_contract', 'n09b05_i004_breaking_change', 'n09b05_i006_breaking_change',
    'n09b05_i008_breaking_change', 'n09b05_i009_breaking_change', 'n09b05_i010_remove_old_contract',
    'n09b05_i010_breaking_change', 'n09b05_i013_breaking_change', 'n09b05_i014_remove_old_contract',
    'n09b05_i014_breaking_change', 'n09b05_i015_remove_old_contract', 'n09b05_i015_breaking_change',
    'n09b05_i017_remove_old_contract', 'n09b05_i017_breaking_change', 'n09b05_i018_breaking_change',
    'n09b05_i018_remove_old_contract'
  ],
  B06: [
    'n09b06_i009_wrong_boundary', 'n09b06_i011_wrong_boundary', 'n09b06_i011_reconstruct_later',
    'n09b06_i016_overexpose', 'n09b06_i018_reconstruct_later'
  ],
  B07: [
    'n09b07_i025_assumed_cache', 'n09b07_i028_contract_shortcut', 'n09b07_i028_assumed_cache',
    'n09b07_i030_assumed_cache'
  ]
};

const report = {
  schemaVersion: 'patternly-bizq01-n09-v3-message-correction-check-v1',
  method: 'Exact frozen-v2 to v3 structural comparison; production validateQuestion/scoreQuestion; every choice scored in original and reversed option order.',
  totals: { questions: 0, valid: 0, correct: 0, incorrectDistractors: 0, reversedCorrect: 0, exactMessageOnlyObjects: 0, changedMessageLeaves: 0, targetSetsMatch: 0 },
  units: []
};

for (const unit of ['B05', 'B06', 'B07']) {
  const baseline = read(`review-inputs/N09-${unit}-v2.json`);
  if (baseline.sha256 !== expectedV2[unit]) throw new Error(`${unit}: frozen v2 hash mismatch ${baseline.sha256}`);
  const current = read(`proposals/N09-${unit}-v3.json`);
  if (baseline.value.length !== 18 || current.value.length !== 18) throw new Error(`${unit}: expected 18 questions`);
  const byId = new Map(baseline.value.map((question) => [question.questionId, question]));
  const expected = new Set(expectedTargets[unit]);
  const observed = [];
  const items = [];

  for (const question of current.value) {
    const prior = byId.get(question.questionId);
    if (!prior) throw new Error(`${unit}: unexpected question ID ${question.questionId}`);
    const currentWithoutTexts = structuredClone(question);
    const priorWithoutTexts = structuredClone(prior);
    const beforeTextByTarget = new Map(prior.feedback.messages.map((message) => [message.targetId, message.text]));
    for (const message of currentWithoutTexts.feedback.messages) {
      if (!beforeTextByTarget.has(message.targetId)) throw new Error(`${unit}: unexpected feedback target ${message.targetId}`);
      message.text = beforeTextByTarget.get(message.targetId);
    }
    if (canonicalJson(currentWithoutTexts) !== canonicalJson(priorWithoutTexts)) {
      throw new Error(`${unit}/${question.questionId}: a non-message field changed from v2`);
    }
    for (const message of question.feedback.messages) {
      const previous = beforeTextByTarget.get(message.targetId);
      if (message.text !== previous) observed.push(message.targetId);
    }

    const validation = validateQuestion(question);
    const answerId = question.answer.optionId;
    const optionIds = question.interaction.options.map((option) => option.optionId);
    const wrongIds = optionIds.filter((optionId) => optionId !== answerId);
    const targetIds = question.feedback.messages.filter((message) => message.kind === 'wrong_option').map((message) => message.targetId);
    const targetSetMatch = targetIds.length === wrongIds.length && new Set(targetIds).size === targetIds.length && wrongIds.every((id) => targetIds.includes(id));
    const score = scoreQuestion(question, { type: 'choice_single', optionId: answerId });
    const distractorScores = wrongIds.map((optionId) => ({ optionId, status: scoreQuestion(question, { type: 'choice_single', optionId }).status }));
    const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
    const reversedScore = scoreQuestion(reversed, { type: 'choice_single', optionId: answerId });
    const item = {
      questionId: question.questionId,
      v2CanonicalSha256: sha256(prior),
      v3CanonicalSha256: sha256(question),
      validation: validation.valid,
      validationErrors: validation.errors,
      answerOptionId: answerId,
      answerScore: score.status,
      distractorScores,
      reversedAnswerScore: reversedScore.status,
      targetSetMatch
    };
    items.push(item);
    report.totals.questions += 1;
    if (validation.valid) report.totals.valid += 1;
    if (score.status === 'correct') report.totals.correct += 1;
    report.totals.incorrectDistractors += distractorScores.filter((result) => result.status === 'incorrect').length;
    if (reversedScore.status === 'correct') report.totals.reversedCorrect += 1;
    if (targetSetMatch) report.totals.targetSetsMatch += 1;
    report.totals.exactMessageOnlyObjects += 1;
  }
  const sortedObserved = [...observed].sort();
  const sortedExpected = [...expected].sort();
  if (canonicalJson(sortedObserved) !== canonicalJson(sortedExpected)) {
    throw new Error(`${unit}: changed text target set mismatch; observed ${sortedObserved.join(',')}`);
  }
  report.totals.changedMessageLeaves += observed.length;
  report.units.push({
    unit,
    v2Path: `review-inputs/N09-${unit}-v2.json`,
    v2Sha256: baseline.sha256,
    v3Path: `proposals/N09-${unit}-v3.json`,
    v3Sha256: current.sha256,
    changedMessageTargets: sortedObserved,
    questionCount: items.length,
    items
  });
}

if (report.totals.questions !== 54 || report.totals.valid !== 54 || report.totals.correct !== 54 || report.totals.incorrectDistractors !== 216 || report.totals.reversedCorrect !== 54 || report.totals.exactMessageOnlyObjects !== 54 || report.totals.changedMessageLeaves !== 25 || report.totals.targetSetsMatch !== 54) {
  throw new Error(`Unexpected aggregate check results: ${JSON.stringify(report.totals)}`);
}
writeFileSync(path.join(here, 'AUTHOR-N09-B05-B07-v3-CHECKS.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
