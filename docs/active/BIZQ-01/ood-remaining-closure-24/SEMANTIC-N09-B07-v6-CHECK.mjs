import { readFileSync, writeFileSync } from "node:fs";
import { validateQuestion, scoreQuestion } from "../../../../../patternly-content/scripts/content/question-contract.mjs";
import { canonicalJson, sha256 } from "../../../../../patternly-content/scripts/build.mjs";

const here = new URL("./", import.meta.url);
const read = (name) => readFileSync(new URL(name, here));
const oldBytes = read("review-inputs/N09-B07-v5.json");
const newBytes = read("review-inputs/N09-B07-v6.json");
const manifestBytes = read("N08-N09-MANIFEST.json");
const oldItems = JSON.parse(oldBytes);
const items = JSON.parse(newBytes);
const manifest = JSON.parse(manifestBytes);
if (oldItems.length !== 18 || items.length !== 18) throw new Error("Expected 18 N09-B07 items");
const expectedChangedQuestion = "ood-n09-b07-i027";
const expectedChangedPaths = [
  "constraints[0]",
  "feedback.details.boundaryOrTradeoff",
  "feedback.details.errorCorrection",
  "feedback.messages[2].text",
  "feedback.reason"
].sort();
function leafDiffs(before, after, path = "") {
  if (canonicalJson(before) === canonicalJson(after)) return [];
  if (before && after && typeof before === "object" && typeof after === "object" && !Array.isArray(before) && !Array.isArray(after)) {
    return [...new Set([...Object.keys(before), ...Object.keys(after)])].flatMap((key) => leafDiffs(before[key], after[key], path ? `${path}.${key}` : key));
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    const out = [];
    for (let i = 0; i < Math.max(before.length, after.length); i += 1) out.push(...leafDiffs(before[i], after[i], `${path}[${i}]`));
    return out;
  }
  return [path];
}
const changedQuestions = [];
const changedLeavesByQuestion = {};
const rows = [];
for (let i = 0; i < items.length; i += 1) {
  const old = oldItems[i];
  const q = items[i];
  if (old.questionId !== q.questionId) throw new Error(`Question order/ID mismatch at ${i}`);
  const leaves = leafDiffs(old, q).sort();
  if (leaves.length) {
    changedQuestions.push(q.questionId);
    changedLeavesByQuestion[q.questionId] = leaves;
  }
  const unit = manifest.units.find((entry) => entry.mentalUnitId === q.mentalUnitId);
  const manifestRow = unit?.beforeItems.find((entry) => entry.reservedNewQuestionId === q.questionId);
  if (!manifestRow || sha256(canonicalJson(manifestRow.beforeQuestion)) !== manifestRow.beforeQuestionSha256) throw new Error(`Manifest before fingerprint mismatch: ${q.questionId}`);
  const validation = validateQuestion(q);
  const accepted = scoreQuestion(q, q.answer);
  const distractors = q.interaction.options.filter((option) => option.optionId !== q.answer.optionId);
  const allDistractorsIncorrect = distractors.every((option) => scoreQuestion(q, { type: "choice_single", optionId: option.optionId }).status === "incorrect");
  const reversed = { ...q, interaction: { ...q.interaction, options: [...q.interaction.options].reverse() } };
  const reversedAccepted = scoreQuestion(reversed, q.answer);
  const expectedTargets = distractors.map((option) => option.optionId).sort();
  const actualTargets = q.feedback.messages.map((message) => message.targetId).sort();
  rows.push({
    questionId: q.questionId,
    changedFromV5: leaves.length > 0,
    changedLeaves: leaves,
    beforeCanonicalSha256: sha256(canonicalJson(manifestRow.beforeQuestion)),
    v5CanonicalSha256: sha256(canonicalJson(old)),
    v6CanonicalSha256: sha256(canonicalJson(q)),
    valid: validation.valid,
    validationErrors: validation.errors,
    acceptedStatus: accepted.status,
    distractorCount: distractors.length,
    allDistractorsIncorrect,
    reversedAcceptedStatus: reversedAccepted.status,
    exactFeedbackTargetSet: canonicalJson(expectedTargets) === canonicalJson(actualTargets)
  });
}
if (canonicalJson(changedQuestions) !== canonicalJson([expectedChangedQuestion])) throw new Error(`Unexpected changed questions: ${canonicalJson(changedQuestions)}`);
if (canonicalJson(changedLeavesByQuestion[expectedChangedQuestion]) !== canonicalJson(expectedChangedPaths)) throw new Error(`Unexpected i027 leaf delta: ${canonicalJson(changedLeavesByQuestion[expectedChangedQuestion])}`);
const failed = rows.filter((row) => !row.valid || row.acceptedStatus !== "correct" || !row.allDistractorsIncorrect || row.reversedAcceptedStatus !== "correct" || !row.exactFeedbackTargetSet);
if (failed.length) throw new Error(`Production validation/scoring failure: ${canonicalJson(failed)}`);
const receipt = {
  schemaVersion: "bizq01-n09-b07-v6-independent-correction-check-v1",
  method: "Production validateQuestion/scoreQuestion for all accepted answers, distractors, reversed option order and exact feedback target sets; canonical leaf diff v5→v6; original manifest before-object fingerprint bound via reservedNewQuestionId.",
  frozenInputs: {
    v5: { path: "review-inputs/N09-B07-v5.json", rawSha256: sha256(oldBytes) },
    v6: { path: "review-inputs/N09-B07-v6.json", rawSha256: sha256(newBytes) },
    manifest: { path: "N08-N09-MANIFEST.json", rawSha256: sha256(manifestBytes) }
  },
  totals: {
    questions: rows.length,
    changedWholeObjects: changedQuestions.length,
    unchangedWholeObjects: rows.length - changedQuestions.length,
    changedLeafCount: Object.values(changedLeavesByQuestion).flat().length,
    changedQuestionIds: changedQuestions,
    invalid: rows.filter((row) => !row.valid).length,
    correctAcceptedAnswers: rows.filter((row) => row.acceptedStatus === "correct").length,
    allDistractorsIncorrect: rows.filter((row) => row.allDistractorsIncorrect).length,
    correctAfterReversal: rows.filter((row) => row.reversedAcceptedStatus === "correct").length,
    exactFeedbackTargetSets: rows.filter((row) => row.exactFeedbackTargetSet).length
  },
  changedLeavesByQuestion,
  items: rows
};
writeFileSync(new URL("SEMANTIC-N09-B07-v6-CHECK.json", here), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ totals: receipt.totals, changedLeavesByQuestion }, null, 2));
