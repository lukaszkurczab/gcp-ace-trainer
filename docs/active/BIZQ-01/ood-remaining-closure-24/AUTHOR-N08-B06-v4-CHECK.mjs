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
const before = read('review-inputs/N08-B06-v3.json');
const current = read('proposals/N08-B06-v4.json');
const notes = read('AUTHOR-N08-B06-v4.json');
if (before.value.length !== 18 || current.value.length !== 18 || notes.value.items.length !== 18) throw new Error('Expected 18 questions and 18 notes.');
if (notes.value.proposalSha256 !== current.sha256 || notes.value.previousSha256 !== before.sha256) throw new Error('Proposal note hash bindings do not match exact bytes.');
const oldById = new Map(before.value.map((q) => [q.questionId, q]));
const changedIds = [];
const items = [];
for (const q of current.value) {
  const old = oldById.get(q.questionId);
  if (!old) throw new Error(`Unexpected question ID ${q.questionId}`);
  if (canonicalJson(q) !== canonicalJson(old)) changedIds.push(q.questionId);
  const validation = validateQuestion(q);
  if (!validation.valid) throw new Error(`${q.questionId}: ${JSON.stringify(validation.errors)}`);
  const answerId = q.answer.optionId;
  if (answerId !== old.answer.optionId) throw new Error(`${q.questionId}: accepted option ID changed`);
  const optionIds = q.interaction.options.map((o) => o.optionId);
  const wrongIds = optionIds.filter((id) => id !== answerId);
  const targets = q.feedback.messages.filter((m) => m.kind === 'wrong_option').map((m) => m.targetId);
  if (targets.length !== 3 || new Set(targets).size !== 3 || wrongIds.some((id) => !targets.includes(id))) throw new Error(`${q.questionId}: diagnostic targets mismatch`);
  const answer = scoreQuestion(q, { type: 'choice_single', optionId: answerId });
  const wrong = wrongIds.map((id) => scoreQuestion(q, { type: 'choice_single', optionId: id }));
  const reversed = { ...q, interaction: { ...q.interaction, options: [...q.interaction.options].reverse() } };
  const reversedAnswer = scoreQuestion(reversed, { type: 'choice_single', optionId: answerId });
  if (answer.status !== 'correct' || wrong.some((x) => x.status !== 'incorrect') || reversedAnswer.status !== 'correct') throw new Error(`${q.questionId}: score/reversal mismatch`);
  items.push({ questionId: q.questionId, beforeCanonicalSha256: sha256(old), currentCanonicalSha256: sha256(q), valid: validation.valid, acceptedOptionId: answerId, wrongOptionIds: wrongIds, answerStatus: answer.status, wrongStatuses: wrong.map((x) => x.status), reversedAnswerStatus: reversedAnswer.status });
}
if (changedIds.length !== 1 || changedIds[0] !== 'ood-n08-b06-i008') throw new Error(`Expected only i008 changed, got ${changedIds.join(',')}`);
const i008 = current.value.find((q) => q.questionId === 'ood-n08-b06-i008');
if (!i008.prompt.includes('published, current request throughout both checks') || !i008.prompt.includes('no intermediate split may be visible')) throw new Error('i008 visible-parent premise is absent.');
if (i008.interaction.options.find((o) => o.optionId === 'owner_preserves_contract')?.text !== oldById.get(i008.questionId).interaction.options.find((o) => o.optionId === 'owner_preserves_contract')?.text) throw new Error('Accepted key text changed.');
const report = {
  schemaVersion: 'bizq01-n08-b06-v4-author-check-v1',
  method: 'Exact v3-to-v4 whole-object comparison, production validateQuestion/scoreQuestion for each option, and reversed-option answer scoring. Mechanical checks only; semantic acceptance remains independent.',
  beforePath: 'review-inputs/N08-B06-v3.json', beforeSha256: before.sha256,
  currentPath: 'proposals/N08-B06-v4.json', currentSha256: current.sha256,
  notesPath: 'AUTHOR-N08-B06-v4.json', notesSha256: notes.sha256,
  totals: { questions: items.length, valid: items.filter((x) => x.valid).length, correctAnswers: items.filter((x) => x.answerStatus === 'correct').length, incorrectDistractors: items.reduce((n, x) => n + x.wrongStatuses.filter((s) => s === 'incorrect').length, 0), reversedCorrect: items.filter((x) => x.reversedAnswerStatus === 'correct').length, changedQuestionIds: changedIds },
  items
};
if (report.totals.valid !== 18 || report.totals.correctAnswers !== 18 || report.totals.incorrectDistractors !== 54 || report.totals.reversedCorrect !== 18) throw new Error(`Unexpected aggregate counts: ${JSON.stringify(report.totals)}`);
writeFileSync(path.join(here, 'AUTHOR-N08-B06-v4-CHECKS.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
