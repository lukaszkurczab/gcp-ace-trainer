import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateQuestion, scoreQuestion } from '../../../../../patternly-content/scripts/content/question-contract.mjs';
import { canonicalJson, sha256 as canonicalSha256 } from '../../../../../patternly-content/scripts/build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(here, '../../../../../');
const contentRoot = path.join(repoRoot, 'patternly-content');
const readBytes = (relativePath) => readFileSync(path.join(here, relativePath));
const readJson = (relativePath) => JSON.parse(readBytes(relativePath).toString('utf8'));
const rawSha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');

const manifestPath = 'N08-N09-MANIFEST.json';
const contractPath = 'N08-N09-CONTRACT.json';
const proposalPath = 'review-inputs/N08-B09-v5.json';
const notesPath = 'AUTHOR-N08-B09-v5.json';
const adjudicationPath = 'ROOT-CROSS-N24-v1-ADJUDICATION.json';
const manifestBytes = readBytes(manifestPath);
const contractBytes = readBytes(contractPath);
const proposalBytes = readBytes(proposalPath);
const notesBytes = readBytes(notesPath);
const adjudicationBytes = readBytes(adjudicationPath);
const manifest = JSON.parse(manifestBytes.toString('utf8'));
const contract = JSON.parse(contractBytes.toString('utf8'));
const questions = JSON.parse(proposalBytes.toString('utf8'));
const notes = JSON.parse(notesBytes.toString('utf8'));
const adjudication = JSON.parse(adjudicationBytes.toString('utf8'));
const unit = manifest.units.find((entry) => entry.mentalUnitId === 'OOD-N08-B09');
if (!unit || unit.beforeItems.length !== 18 || questions.length !== 18 || notes.items.length !== 18) {
  throw new Error('Expected the exact 18-item N08-B09 review scope.');
}

const sourcePath = path.join(contentRoot, unit.sourcePath);
const sourceBytes = readFileSync(sourcePath);
if (rawSha256(sourceBytes) !== unit.sourceSha256 || sourceBytes.toString('utf8') !== unit.beforeSourceText) {
  throw new Error('Manifest-bound source bytes differ from the frozen before text.');
}
const sourceQuestions = JSON.parse(sourceBytes.toString('utf8'));
const beforeById = new Map(sourceQuestions.map((question) => [question.questionId, question]));
const priorDraft = JSON.parse(readBytes('review-inputs/N08-B09-v4.json').toString('utf8'));
const priorDraftById = new Map(priorDraft.map((question) => [question.questionId, question]));
const currentById = new Map(questions.map((question) => [question.questionId, question]));
const adjudicationByBefore = new Map(adjudication.identityDecision.map((entry) => [entry.beforeQuestionId, entry]));
const noteByCurrentId = new Map(notes.items.map((entry) => [entry.questionId, entry]));
const checkedItems = [];
const optionLengthRanks = { uniqueShortest: 0, uniqueLongest: 0, middleOrTied: 0 };

for (const binding of unit.beforeItems) {
  const before = beforeById.get(binding.questionId);
  const current = currentById.get(binding.reservedNewQuestionId);
  const adjudicated = adjudicationByBefore.get(binding.questionId);
  const note = noteByCurrentId.get(binding.reservedNewQuestionId);
  if (!before || !current || !adjudicated || !note) throw new Error(`Missing binding for ${binding.questionId}`);
  if (canonicalSha256(before) !== binding.beforeQuestionSha256) throw new Error(`Before-object fingerprint mismatch: ${binding.questionId}`);
  if (adjudicated.reservedQuestionId !== current.questionId || note.beforeQuestionId !== before.questionId) {
    throw new Error(`Reserved identity mapping mismatch: ${binding.questionId}`);
  }
  if (current.mentalUnitId !== before.mentalUnitId || current.nodeId !== before.nodeId || current.trackId !== before.trackId ||
      current.type !== before.type || current.difficulty !== before.difficulty ||
      current.interaction.type !== before.interaction.type || current.interaction.scoringMethod !== before.interaction.scoringMethod) {
    throw new Error(`Taxonomy/runtime contract changed: ${binding.questionId}`);
  }
  const oldOptionIds = new Set(before.interaction.options.map((option) => option.optionId));
  const currentOptionIds = current.interaction.options.map((option) => option.optionId);
  if (currentOptionIds.length !== 4 || new Set(currentOptionIds).size !== 4 || currentOptionIds.some((id) => oldOptionIds.has(id))) {
    throw new Error(`Replacement option IDs are not fresh/unique within ${current.questionId}`);
  }

  const validation = validateQuestion(current);
  if (!validation.valid) throw new Error(`${current.questionId}: ${JSON.stringify(validation.errors)}`);
  const correctId = current.answer.optionId;
  const wrongIds = currentOptionIds.filter((id) => id !== correctId);
  const targetIds = current.feedback.messages.filter((message) => message.kind === 'wrong_option').map((message) => message.targetId);
  if (targetIds.length !== 3 || new Set(targetIds).size !== 3 || wrongIds.some((id) => !targetIds.includes(id))) {
    throw new Error(`Wrong-option feedback targets do not match ${current.questionId}`);
  }
  const acceptedScore = scoreQuestion(current, { type: 'choice_single', optionId: correctId });
  const wrongScores = wrongIds.map((optionId) => scoreQuestion(current, { type: 'choice_single', optionId }));
  const reversed = { ...current, interaction: { ...current.interaction, options: [...current.interaction.options].reverse() } };
  const reversedScore = scoreQuestion(reversed, { type: 'choice_single', optionId: correctId });
  if (acceptedScore.status !== 'correct' || wrongScores.some((score) => score.status !== 'incorrect') || reversedScore.status !== 'correct') {
    throw new Error(`Scoring or option reversal changed the key for ${current.questionId}`);
  }
  if (note.currentWholeSha256 !== canonicalSha256(current) || note.beforeWholeSha256 !== canonicalSha256(before)) {
    throw new Error(`Author-note fingerprints do not bind ${current.questionId}`);
  }
  const wordCounts = current.interaction.options.map((option) => option.text.trim().split(/\s+/u).length);
  const keyWords = wordCounts[current.interaction.options.findIndex((option) => option.optionId === correctId)];
  const min = Math.min(...wordCounts);
  const max = Math.max(...wordCounts);
  if (keyWords === min && wordCounts.filter((count) => count === min).length === 1) optionLengthRanks.uniqueShortest++;
  else if (keyWords === max && wordCounts.filter((count) => count === max).length === 1) optionLengthRanks.uniqueLongest++;
  else optionLengthRanks.middleOrTied++;

  const prior = priorDraftById.get(before.questionId);
  checkedItems.push({
    beforeQuestionId: before.questionId,
    beforeSha256: canonicalSha256(before),
    priorDraftQuestionId: prior?.questionId ?? null,
    currentQuestionId: current.questionId,
    currentSha256: canonicalSha256(current),
    identity: 'reserved replacement ID; option identities refreshed',
    valid: true,
    answerStatus: acceptedScore.status,
    wrongStatuses: wrongScores.map((score) => score.status),
    reversedAnswerStatus: reversedScore.status,
    feedbackTargetsMatch: true
  });
}

if (currentById.size !== 18 || sourceQuestions.length !== 18 || notes.proposalSha256 !== rawSha256(proposalBytes)) {
  throw new Error('Unexpected item count or notes/proposal hash mismatch.');
}

const report = {
  schemaVersion: 'patternly-bizq01-independent-n08-b09-v5-check-v1',
  scope: 'Independent exact input/source binding and production validator/scorer check for N08-B09 v5; semantic conclusions are recorded in the companion review.',
  inputs: {
    proposalPath,
    proposalSha256: rawSha256(proposalBytes),
    manifestPath,
    manifestSha256: rawSha256(manifestBytes),
    contractPath,
    contractSha256: rawSha256(contractBytes),
    sourcePath: path.relative(repoRoot, sourcePath),
    sourceSha256: rawSha256(sourceBytes),
    notesPath,
    notesSha256: rawSha256(notesBytes),
    identityAdjudicationPath: adjudicationPath,
    identityAdjudicationSha256: rawSha256(adjudicationBytes)
  },
  totals: {
    questions: checkedItems.length,
    valid: checkedItems.filter((item) => item.valid).length,
    acceptedCorrect: checkedItems.filter((item) => item.answerStatus === 'correct').length,
    wrongIncorrect: checkedItems.reduce((sum, item) => sum + item.wrongStatuses.filter((status) => status === 'incorrect').length, 0),
    reversedCorrect: checkedItems.filter((item) => item.reversedAnswerStatus === 'correct').length,
    feedbackTargetsMatch: checkedItems.filter((item) => item.feedbackTargetsMatch).length,
    reservedIdentityBindings: checkedItems.filter((item) => item.identity.startsWith('reserved replacement')).length,
    optionLengthRankObservation: optionLengthRanks
  },
  items: checkedItems
};
writeFileSync(path.join(here, 'INDEPENDENT-CHECK-N08-B09-v5.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
