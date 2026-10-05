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
const manifest = read('N08-N09-MANIFEST.json');
const before = read('review-inputs/N08-B09-v3.json');
const current = read('review-inputs/N08-B09-v4.json');
if (current.sha256 !== '9e0251f2010279f88ca52d7e0e039dafae7f342ebd02152294c89662c973df71') {
  throw new Error(`Frozen v4 input SHA mismatch: ${current.sha256}`);
}
if (before.value.length !== 18 || current.value.length !== 18) throw new Error('Expected 18 v3 and v4 questions');
const unit = manifest.value.units.find((entry) => entry.mentalUnitId === 'OOD-N08-B09');
if (!unit || unit.beforeItems.length !== 18) throw new Error('Missing or incomplete N08-B09 manifest binding');
const sourceBytes = readFileSync(path.join(here, '../../../../../patternly-content', unit.sourcePath));
const sourceSha256 = createHash('sha256').update(sourceBytes).digest('hex');
if (sourceSha256 !== unit.sourceSha256) throw new Error(`Current source does not match manifest: ${sourceSha256}`);
const beforeSource = JSON.parse(unit.beforeSourceText);
if (beforeSource.length !== 18) throw new Error('Manifest before-source question count mismatch');

const v3ById = new Map(before.value.map((question) => [question.questionId, question]));
const manifestById = new Map(unit.beforeItems.map((item) => [item.questionId, item]));
const report = {
  schemaVersion: 'patternly-bizq01-independent-n08-b09-v4-check-v1',
  method: 'Production question validation and scoring; exact manifest/source binding; complete option-ID, target-ID and accepted-identity comparison against reviewed v3; every option scored before and after reversing its array.',
  inputs: {
    manifestPath: 'N08-N09-MANIFEST.json',
    manifestSha256: manifest.sha256,
    v3ProposalPath: 'review-inputs/N08-B09-v3.json',
    v3ProposalSha256: before.sha256,
    v4ProposalPath: 'review-inputs/N08-B09-v4.json',
    v4ProposalSha256: current.sha256,
    sourcePath: unit.sourcePath,
    sourceSha256,
    expectedSourceSha256: unit.sourceSha256
  },
  totals: { questions: 0, valid: 0, acceptedAnswerCorrect: 0, wrongOptionsIncorrect: 0, reversedAnswerCorrect: 0, feedbackTargetSetsMatch: 0, v3IdentityContinuity: 0, sourceBeforeBindings: 0 },
  items: []
};

for (const [index, question] of current.value.entries()) {
  const prior = v3ById.get(question.questionId);
  const beforeObject = beforeSource[index];
  const binding = manifestById.get(beforeObject?.questionId);
  if (!prior || !beforeObject || !binding || beforeObject.questionId !== question.questionId || binding.questionId !== question.questionId) {
    throw new Error(`Missing or misordered identity binding for index ${index}`);
  }
  if (sha256(beforeObject) !== binding.beforeQuestionSha256) throw new Error(`Manifest whole-object mismatch for ${question.questionId}`);
  if (question.answer.optionId !== prior.answer.optionId || question.questionId !== prior.questionId) {
    throw new Error(`Question or accepted-answer identity changed for ${question.questionId}`);
  }
  const oldOptions = prior.interaction.options.map((option) => option.optionId).sort();
  const optionIds = question.interaction.options.map((option) => option.optionId).sort();
  if (canonicalJson(oldOptions) !== canonicalJson(optionIds)) throw new Error(`Option identity set changed for ${question.questionId}`);
  const validation = validateQuestion(question);
  if (!validation.valid) throw new Error(`${question.questionId}: ${JSON.stringify(validation.errors)}`);
  const answerId = question.answer.optionId;
  const wrongIds = question.interaction.options.map((option) => option.optionId).filter((id) => id !== answerId);
  const messages = question.feedback.messages.filter((message) => message.kind === 'wrong_option');
  const messageTargets = messages.map((message) => message.targetId);
  const targetsMatch = messageTargets.length === wrongIds.length && new Set(messageTargets).size === messageTargets.length && wrongIds.every((id) => messageTargets.includes(id)) && messages.every((message) => message.text.trim().length > 0);
  if (!targetsMatch) throw new Error(`${question.questionId}: wrong-option feedback targets do not match distractors`);
  const answerScore = scoreQuestion(question, { type: 'choice_single', optionId: answerId });
  const wrongScores = wrongIds.map((optionId) => ({ optionId, status: scoreQuestion(question, { type: 'choice_single', optionId }).status }));
  const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
  const reversedScore = scoreQuestion(reversed, { type: 'choice_single', optionId: answerId });
  if (answerScore.status !== 'correct' || wrongScores.some((result) => result.status !== 'incorrect') || reversedScore.status !== 'correct') {
    throw new Error(`${question.questionId}: scoring failed`);
  }
  const item = {
    questionId: question.questionId,
    beforeCanonicalSha256: sha256(beforeObject),
    v3CanonicalSha256: sha256(prior),
    v4CanonicalSha256: sha256(question),
    acceptedOptionId: answerId,
    optionIds,
    validationErrors: validation.errors,
    answerScore: answerScore.status,
    wrongOptionIds: wrongIds,
    wrongScores,
    reversedAnswerScore: reversedScore.status,
    feedbackTargetsMatch: targetsMatch,
    identityAction: binding.identityAction,
    priorDisposition: binding.priorDisposition
  };
  report.items.push(item);
  report.totals.questions += 1;
  report.totals.valid += 1;
  report.totals.acceptedAnswerCorrect += 1;
  report.totals.wrongOptionsIncorrect += wrongScores.filter((result) => result.status === 'incorrect').length;
  report.totals.reversedAnswerCorrect += 1;
  report.totals.feedbackTargetSetsMatch += Number(targetsMatch);
  report.totals.v3IdentityContinuity += 1;
  report.totals.sourceBeforeBindings += 1;
}

if (report.totals.questions !== 18 || report.totals.valid !== 18 || report.totals.acceptedAnswerCorrect !== 18 || report.totals.wrongOptionsIncorrect !== 54 || report.totals.reversedAnswerCorrect !== 18 || report.totals.feedbackTargetSetsMatch !== 18 || report.totals.v3IdentityContinuity !== 18 || report.totals.sourceBeforeBindings !== 18) {
  throw new Error(`Unexpected totals: ${JSON.stringify(report.totals)}`);
}
writeFileSync(path.join(here, 'INDEPENDENT-CHECK-N08-B09-v4.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
