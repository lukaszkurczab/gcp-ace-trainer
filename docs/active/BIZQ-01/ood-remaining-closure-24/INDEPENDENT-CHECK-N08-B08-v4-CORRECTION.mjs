import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQuestion, scoreQuestion } from '../../../../../patternly-content/scripts/content/question-contract.mjs';
import { canonicalJson, sha256 } from '../../../../../patternly-content/scripts/build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => {
  const bytes = readFileSync(path.join(here, relative));
  return { value: JSON.parse(bytes.toString('utf8')), sha256: createHash('sha256').update(bytes).digest('hex') };
};
const expectedChanged = new Set(['ood-n08-b08-i003', 'ood-n08-b08-i009', 'ood-n08-b08-i014']);
const allowedPaths = new Set(expectedChanged);
const deltaFields = new Set([
  'feedback.details.scenarioApplication',
  'feedback.details.boundaryOrTradeoff',
  'feedback.details.transfer'
]);
const manifest = read('N08-N09-MANIFEST.json');
const before = read('review-inputs/N08-B08-v3.json');
const current = read('review-inputs/N08-B08-v4.json');
if (current.sha256 !== '5a535122196cd793b893cf518a1afcac36aa044166cafdfb009260dbed8fd1f2') {
  throw new Error(`Frozen v4 input hash mismatch: ${current.sha256}`);
}
if (before.value.length !== 18 || current.value.length !== 18) throw new Error('Expected 18 v3 and v4 questions');
const manifestUnit = manifest.value.units.find((unit) => unit.mentalUnitId === 'OOD-N08-B08');
if (!manifestUnit) throw new Error('Missing N08-B08 manifest unit');
const sourceBytes = readFileSync(path.join(here, '../../../../../patternly-content', manifestUnit.sourcePath));
const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');
if (sourceSha256 !== manifestUnit.sourceSha256) throw new Error(`Source does not match manifest: ${sourceSha256}`);
const beforeSource = JSON.parse(manifestUnit.beforeSourceText);
if (beforeSource.length !== 18) throw new Error('Manifest before source count mismatch');

const v3ById = new Map(before.value.map((question) => [question.questionId, question]));
const manifestById = new Map(manifestUnit.beforeItems.map((item) => [item.questionId, item]));
const pathsDiff = (left, right, prefix = '') => {
  if (left === right) return [];
  if (left !== null && right !== null && typeof left === 'object' && typeof right === 'object' && canonicalJson(left) === canonicalJson(right)) return [];
  if (left === null || right === null || typeof left !== 'object' || typeof right !== 'object' || Array.isArray(left) || Array.isArray(right)) {
    return [prefix];
  }
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].flatMap((key) => pathsDiff(left[key], right[key], prefix ? `${prefix}.${key}` : key));
};
const report = {
  schemaVersion: 'patternly-bizq01-independent-n08-b08-v4-correction-check-v1',
  method: 'Frozen-v3/v4 whole-object delta, exact source/manifest binding, production validateQuestion and scoreQuestion for answer, all distractors and reversed answer order.',
  inputs: {
    manifestSha256: manifest.sha256,
    v3ProposalPath: 'review-inputs/N08-B08-v3.json',
    v3ProposalSha256: before.sha256,
    v4ProposalPath: 'review-inputs/N08-B08-v4.json',
    v4ProposalSha256: current.sha256,
    sourcePath: manifestUnit.sourcePath,
    sourceSha256,
    expectedSourceSha256: manifestUnit.sourceSha256
  },
  totals: { questions: 0, valid: 0, acceptedAnswersCorrect: 0, distractorsIncorrect: 0, reversedAnswersCorrect: 0, feedbackTargetSetsMatch: 0, unchangedWholeObjects: 0, correctedWholeObjects: 0 },
  items: []
};

for (const [index, question] of current.value.entries()) {
  const id = question.questionId;
  const prior = v3ById.get(id);
  const binding = manifestById.get(id);
  const beforeObject = beforeSource[index];
  if (!prior || !binding || !beforeObject || binding.questionId !== beforeObject.questionId) throw new Error(`Missing or misordered whole-object binding for ${id}`);
  if (sha256(beforeObject) !== binding.beforeQuestionSha256) throw new Error(`Manifest fingerprint mismatch for ${id}`);
  if (id !== prior.questionId || question.answer.optionId !== prior.answer.optionId) throw new Error(`Question/key identity changed for ${id}`);
  const changedFields = pathsDiff(prior, question);
  if (changedFields.length === 0) {
    report.totals.unchangedWholeObjects += 1;
  } else {
    if (!expectedChanged.has(id)) throw new Error(`Unexpected whole-object change for ${id}: ${changedFields.join(', ')}`);
    if (canonicalJson([...changedFields].sort()) !== canonicalJson([...deltaFields].sort())) {
      throw new Error(`${id}: changed leaves differ from reviewed v4 delta (${changedFields.join(', ')})`);
    }
    report.totals.correctedWholeObjects += 1;
  }
  const validation = validateQuestion(question);
  if (!validation.valid) throw new Error(`${id}: validation failed ${JSON.stringify(validation.errors)}`);
  const optionIds = question.interaction.options.map((option) => option.optionId);
  const answerId = question.answer.optionId;
  const wrongIds = optionIds.filter((optionId) => optionId !== answerId);
  const wrongMessages = question.feedback.messages.filter((message) => message.kind === 'wrong_option');
  const targetIds = wrongMessages.map((message) => message.targetId);
  const targetSetMatch = targetIds.length === wrongIds.length && new Set(targetIds).size === targetIds.length && wrongIds.every((target) => targetIds.includes(target)) && wrongMessages.every((message) => message.text.trim().length > 0);
  if (!targetSetMatch) throw new Error(`${id}: feedback targets do not cover exact wrong options`);
  const answerScore = scoreQuestion(question, { type: 'choice_single', optionId: answerId });
  const distractorScores = wrongIds.map((optionId) => ({ optionId, status: scoreQuestion(question, { type: 'choice_single', optionId }).status }));
  const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
  const reversedScore = scoreQuestion(reversed, { type: 'choice_single', optionId: answerId });
  if (answerScore.status !== 'correct' || distractorScores.some((score) => score.status !== 'incorrect') || reversedScore.status !== 'correct') {
    throw new Error(`${id}: scoring or reversed-order behavior failed`);
  }
  const item = {
    questionId: id,
    sourceBeforeSha256: binding.beforeQuestionSha256,
    v3CanonicalSha256: sha256(prior),
    v4CanonicalSha256: sha256(question),
    changedFields,
    answerOptionId: answerId,
    answerScore: answerScore.status,
    wrongOptionIds: wrongIds,
    distractorScores,
    reversedAnswerScore: reversedScore.status,
    feedbackTargetsMatch: targetSetMatch,
    validatorErrors: validation.errors
  };
  report.items.push(item);
  report.totals.questions += 1;
  report.totals.valid += 1;
  report.totals.acceptedAnswersCorrect += 1;
  report.totals.distractorsIncorrect += distractorScores.filter((score) => score.status === 'incorrect').length;
  report.totals.reversedAnswersCorrect += 1;
  report.totals.feedbackTargetSetsMatch += Number(targetSetMatch);
}

if (report.totals.questions !== 18 || report.totals.correctedWholeObjects !== 3 || report.totals.unchangedWholeObjects !== 15 || report.totals.valid !== 18 || report.totals.acceptedAnswersCorrect !== 18 || report.totals.distractorsIncorrect !== 54 || report.totals.reversedAnswersCorrect !== 18 || report.totals.feedbackTargetSetsMatch !== 18) {
  throw new Error(`Unexpected aggregate checks: ${JSON.stringify(report.totals)}`);
}
writeFileSync(path.join(here, 'INDEPENDENT-CHECK-N08-B08-v4-CORRECTION.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
