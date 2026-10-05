import { readFileSync, writeFileSync } from "node:fs";
import { validateQuestion, scoreQuestion } from "../../../../../patternly-content/scripts/content/question-contract.mjs";
import { canonicalJson, sha256 } from "../../../../../patternly-content/scripts/build.mjs";

const here = new URL("./", import.meta.url);
const readJson = (name) => JSON.parse(readFileSync(new URL(name, here), "utf8"));
const beforePath = "review-inputs/N08-B06-v3.json";
const currentPath = "review-inputs/N08-B06-v4.json";
const beforeBytes = readFileSync(new URL(beforePath, here));
const currentBytes = readFileSync(new URL(currentPath, here));
const before = JSON.parse(beforeBytes);
const current = JSON.parse(currentBytes);
if (before.length !== 18 || current.length !== 18) throw new Error("Expected 18 B06 questions in each frozen input");

const rows = [];
for (let index = 0; index < current.length; index += 1) {
  const oldQuestion = before[index];
  const question = current[index];
  if (oldQuestion.questionId !== question.questionId) throw new Error(`Question identity/order changed at ${index}`);
  const validation = validateQuestion(question);
  const accepted = scoreQuestion(question, question.answer);
  const distractors = question.interaction.options.filter((option) => option.optionId !== question.answer.optionId);
  const distractorResults = distractors.map((option) => scoreQuestion(question, { type: "choice_single", optionId: option.optionId }));
  const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
  const reversedAccepted = scoreQuestion(reversed, question.answer);
  const feedbackTargets = question.feedback.messages.map((message) => message.targetId);
  const expectedTargets = distractors.map((option) => option.optionId);
  const targetSetExact = feedbackTargets.length === expectedTargets.length
    && expectedTargets.every((id) => feedbackTargets.includes(id))
    && feedbackTargets.every((id) => expectedTargets.includes(id));
  rows.push({
    questionId: question.questionId,
    beforeCanonicalSha256: sha256(canonicalJson(oldQuestion)),
    currentCanonicalSha256: sha256(canonicalJson(question)),
    changed: canonicalJson(oldQuestion) !== canonicalJson(question),
    valid: validation.valid,
    validationErrors: validation.errors,
    acceptedStatus: accepted.status,
    distractorStatuses: distractorResults.map((result) => result.status),
    reversedAcceptedStatus: reversedAccepted.status,
    feedbackTargetSetExact: targetSetExact
  });
}

const changed = rows.filter((row) => row.changed).map((row) => row.questionId);
const totals = {
  questions: rows.length,
  changedQuestions: changed.length,
  unchangedQuestions: rows.length - changed.length,
  invalidQuestions: rows.filter((row) => !row.valid).length,
  correctAcceptedAnswers: rows.filter((row) => row.acceptedStatus === "correct").length,
  incorrectDistractors: rows.reduce((sum, row) => sum + row.distractorStatuses.filter((status) => status === "incorrect").length, 0),
  correctAfterOptionReversal: rows.filter((row) => row.reversedAcceptedStatus === "correct").length,
  exactFeedbackTargetSets: rows.filter((row) => row.feedbackTargetSetExact).length
};
if (canonicalJson(changed) !== canonicalJson(["ood-n08-b06-i008"])) throw new Error(`Unexpected changed objects: ${changed.join(", ")}`);
if (totals.invalidQuestions !== 0 || totals.correctAcceptedAnswers !== 18 || totals.incorrectDistractors !== 54
  || totals.correctAfterOptionReversal !== 18 || totals.exactFeedbackTargetSets !== 18) {
  throw new Error(`Production contract/scoring check failed: ${canonicalJson(totals)}`);
}

const receipt = {
  schemaVersion: "bizq01-n08-b06-v4-correction-independent-check-v1",
  method: "Repository canonicalJson fingerprints, production validateQuestion/scoreQuestion, all options, reversed option order, exact feedback target set, and whole-object v3-to-v4 comparison.",
  before: { path: beforePath, rawSha256: sha256(beforeBytes) },
  current: { path: currentPath, rawSha256: sha256(currentBytes) },
  totals,
  items: rows
};
writeFileSync(new URL("SEMANTIC-N08-B06-v4-CORRECTION-CHECK.json", here), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ totals, changed }, null, 2));
