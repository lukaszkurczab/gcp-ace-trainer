import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateQuestion, scoreQuestion } from '../../../../../patternly-content/scripts/content/question-contract.mjs';
import { canonicalJson, sha256 } from '../../../../../patternly-content/scripts/build.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (file) => {
  const bytes = readFileSync(path.join(here, file));
  return { value: JSON.parse(bytes.toString('utf8')), sha256: createHash('sha256').update(bytes).digest('hex') };
};
const groups = [
  { unit: 'B08', before: 'review-inputs/N08-B08-v3.json', current: 'proposals/N08-B08-v4.json', expectedChanged: new Set(['ood-n08-b08-i003', 'ood-n08-b08-i009', 'ood-n08-b08-i014']) },
  { unit: 'B09', before: 'review-inputs/N08-B09-v3.json', current: 'proposals/N08-B09-v4.json', expectedChanged: new Set(Array.from({ length: 18 }, (_, i) => `ood-n08-b09-i${String(i + 1).padStart(3, '0')}`)) }
];
const report = {
  schemaVersion: 'bizq01-n08-b08-b09-v4-author-check-v1',
  scope: 'Proposal structure, exact identity/preservation boundaries, producer question validation, wrong-option target binding, and scoring under original/reversed option order. This is mechanical author verification, not semantic acceptance.',
  totals: { questions: 0, valid: 0, answerCorrect: 0, wrongOptionsIncorrect: 0, reversedCorrect: 0, targetSetsMatch: 0 },
  units: []
};
for (const group of groups) {
  const before = read(group.before);
  const current = read(group.current);
  if (before.value.length !== 18 || current.value.length !== 18) throw new Error(`${group.unit}: expected 18 items in each snapshot`);
  const oldById = new Map(before.value.map((q) => [q.questionId, q]));
  const changed = new Set();
  const items = [];
  for (const q of current.value) {
    const old = oldById.get(q.questionId);
    if (!old) throw new Error(`${group.unit}: new or missing question ID ${q.questionId}`);
    const result = validateQuestion(q);
    if (!result.valid) throw new Error(`${group.unit}/${q.questionId}: ${JSON.stringify(result.errors)}`);
    const answerId = q.answer.optionId;
    if (answerId !== old.answer.optionId) throw new Error(`${group.unit}/${q.questionId}: accepted answer ID changed`);
    const oldOptionIds = old.interaction.options.map((o) => o.optionId).sort();
    const optionIds = q.interaction.options.map((o) => o.optionId).sort();
    if (canonicalJson(oldOptionIds) !== canonicalJson(optionIds)) throw new Error(`${group.unit}/${q.questionId}: option identity set changed`);
    if (canonicalJson(q) !== canonicalJson(old)) changed.add(q.questionId);
    const wrongIds = q.interaction.options.map((o) => o.optionId).filter((id) => id !== answerId);
    const messages = q.feedback.messages.filter((m) => m.kind === 'wrong_option');
    const targets = messages.map((m) => m.targetId);
    const targetSetMatch = targets.length === wrongIds.length && new Set(targets).size === targets.length && wrongIds.every((id) => targets.includes(id)) && messages.every((m) => m.text.trim().length > 0);
    if (!targetSetMatch) throw new Error(`${group.unit}/${q.questionId}: wrong-option diagnostic target mismatch`);
    const answer = scoreQuestion(q, { type: 'choice_single', optionId: answerId });
    const wordCounts = q.interaction.options.map((option) => ({ optionId: option.optionId, words: option.text.trim().split(/\s+/).length }));
    const answerWords = wordCounts.find((option) => option.optionId === answerId).words;
    const answerLengthRank = wordCounts.filter((option) => option.words < answerWords).length;
    const wrong = wrongIds.map((id) => scoreQuestion(q, { type: 'choice_single', optionId: id }));
    const reversed = { ...q, interaction: { ...q.interaction, options: [...q.interaction.options].reverse() } };
    const reverseAnswer = scoreQuestion(reversed, { type: 'choice_single', optionId: answerId });
    if (answer.status !== 'correct' || wrong.some((s) => s.status !== 'incorrect') || reverseAnswer.status !== 'correct') throw new Error(`${group.unit}/${q.questionId}: scoring/reversal mismatch`);
    items.push({ questionId: q.questionId, beforeSha256: sha256(old), currentSha256: sha256(q), valid: result.valid, answerOptionId: answerId, wrongOptionIds: wrongIds, targetSetMatch, answerWordCount: answerWords, answerLengthRank, answerStatus: answer.status, wrongStatuses: wrong.map((x) => x.status), reversedAnswerStatus: reverseAnswer.status });
    report.totals.questions += 1;
    report.totals.valid += Number(result.valid);
    report.totals.answerCorrect += Number(answer.status === 'correct');
    report.totals.wrongOptionsIncorrect += wrong.filter((x) => x.status === 'incorrect').length;
    report.totals.reversedCorrect += Number(reverseAnswer.status === 'correct');
    report.totals.targetSetsMatch += Number(targetSetMatch);
  }
  if (oldById.size !== 18) throw new Error(`${group.unit}: old snapshot has duplicate or missing IDs`);
  for (const id of group.expectedChanged) if (!changed.has(id)) throw new Error(`${group.unit}: expected change missing for ${id}`);
  if (changed.size !== group.expectedChanged.size || [...changed].some((id) => !group.expectedChanged.has(id))) throw new Error(`${group.unit}: changed-object set differs: ${[...changed].join(', ')}`);
  report.units.push({ unit: group.unit, beforePath: group.before, beforeSha256: before.sha256, currentPath: group.current, currentSha256: current.sha256, questionCount: items.length, changedQuestionIds: [...changed].sort(), items });
}
if (report.totals.questions !== 36 || report.totals.valid !== 36 || report.totals.answerCorrect !== 36 || report.totals.wrongOptionsIncorrect !== 108 || report.totals.reversedCorrect !== 36 || report.totals.targetSetsMatch !== 36) throw new Error(`Unexpected totals ${JSON.stringify(report.totals)}`);
writeFileSync(path.join(here, 'AUTHOR-N08-B08-B09-v4-CHECKS.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
