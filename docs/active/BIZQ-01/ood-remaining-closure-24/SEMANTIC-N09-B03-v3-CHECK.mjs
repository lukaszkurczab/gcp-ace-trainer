import { readFileSync, writeFileSync } from "node:fs";
import { validateQuestion, scoreQuestion } from "../../../../../patternly-content/scripts/content/question-contract.mjs";
import { canonicalJson, sha256 } from "../../../../../patternly-content/scripts/build.mjs";

const here = new URL("./", import.meta.url);
const readBytes = (name) => readFileSync(new URL(name, here));
const beforeBytes = readBytes("review-inputs/N09-B03-v2.json");
const currentBytes = readBytes("review-inputs/N09-B03-v3.json");
const manifestBytes = readBytes("N08-N09-MANIFEST.json");
const crossBytes = readBytes("CROSS-UNIT-N24-CURRENT-v1.json");
const before = JSON.parse(beforeBytes);
const current = JSON.parse(currentBytes);
const manifest = JSON.parse(manifestBytes);
if (before.length !== 18 || current.length !== 18) throw new Error("Expected 18 N09-B03 questions per frozen proposal");
const changed = [];
const rows = [];
for (let index = 0; index < 18; index += 1) {
  const oldQuestion = before[index];
  const question = current[index];
  if (oldQuestion.questionId !== question.questionId) throw new Error(`Question ID changed at index ${index}`);
  const changedWhole = canonicalJson(oldQuestion) !== canonicalJson(question);
  if (changedWhole) changed.push(question.questionId);
  const validation = validateQuestion(question);
  const accepted = scoreQuestion(question, question.answer);
  const distractors = question.interaction.options.filter((option) => option.optionId !== question.answer.optionId);
  const distractorResults = distractors.map((option) => scoreQuestion(question, { type: "choice_single", optionId: option.optionId }));
  const reversed = { ...question, interaction: { ...question.interaction, options: [...question.interaction.options].reverse() } };
  const reversedAccepted = scoreQuestion(reversed, question.answer);
  const expectedTargets = distractors.map((option) => option.optionId).sort();
  const actualTargets = question.feedback.messages.map((message) => message.targetId).sort();
  const targetSetExact = canonicalJson(expectedTargets) === canonicalJson(actualTargets);
  rows.push({
    questionId: question.questionId,
    changedFromV2: changedWhole,
    beforeCanonicalSha256: sha256(canonicalJson(oldQuestion)),
    currentCanonicalSha256: sha256(canonicalJson(question)),
    valid: validation.valid,
    validationErrors: validation.errors,
    acceptedStatus: accepted.status,
    distractorCount: distractors.length,
    allDistractorsIncorrect: distractorResults.every((result) => result.status === "incorrect"),
    reversedAcceptedStatus: reversedAccepted.status,
    feedbackTargetSetExact: targetSetExact
  });
}
if (canonicalJson(changed) !== canonicalJson(["ood-n09-b03-i007"])) throw new Error(`Unexpected changed whole objects: ${changed.join(", ")}`);
const invalid = rows.filter((row) => !row.valid).length;
const correct = rows.filter((row) => row.acceptedStatus === "correct").length;
const allWrong = rows.filter((row) => row.allDistractorsIncorrect).length;
const reversedCorrect = rows.filter((row) => row.reversedAcceptedStatus === "correct").length;
const targetSets = rows.filter((row) => row.feedbackTargetSetExact).length;
if (invalid || correct !== 18 || allWrong !== 18 || reversedCorrect !== 18 || targetSets !== 18) {
  throw new Error(`Production checks failed: ${canonicalJson({ invalid, correct, allWrong, reversedCorrect, targetSets })}`);
}
const unit = manifest.units.find((entry) => entry.mentalUnitId === "OOD-N09-B03");
const oldItem = unit.beforeItems.find((entry) => entry.questionId === "ood-n09-b03-i007");
const oldQuestion = oldItem.beforeQuestion;
if (sha256(canonicalJson(oldQuestion)) !== oldItem.beforeQuestionSha256) throw new Error("Manifest before-object hash mismatch");
const oldAcceptedQuestion = JSON.parse(readBytes("../../../../../patternly-content/content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B03.json").toString("utf8"))
  .find((question) => question.questionId === "ood-n02-b03-i027");
if (!oldAcceptedQuestion) throw new Error("Accepted N02-B03-i027 comparison item was not found");
const receipt = {
  schemaVersion: "bizq01-n09-b03-v3-correction-independent-check-v1",
  method: "Production validateQuestion/scoreQuestion; every distractor; reversed option order; exact feedback target set; whole-object v2-to-v3 diff; manifest before-object and accepted N02 cross-pair canonical bindings.",
  frozenInputs: {
    v2: { path: "review-inputs/N09-B03-v2.json", rawSha256: sha256(beforeBytes) },
    v3: { path: "review-inputs/N09-B03-v3.json", rawSha256: sha256(currentBytes) },
    manifest: { path: "N08-N09-MANIFEST.json", rawSha256: sha256(manifestBytes) },
    crossReview: { path: "CROSS-UNIT-N24-CURRENT-v1.json", rawSha256: sha256(crossBytes) }
  },
  changedQuestionIds: changed,
  totals: { questions: rows.length, changed: changed.length, unchanged: rows.length - changed.length, invalid: invalid, correctAcceptedAnswers: correct, allDistractorsIncorrect: allWrong, correctAfterReversal: reversedCorrect, exactFeedbackTargetSets: targetSets },
  correctedQuestion: {
    questionId: "ood-n09-b03-i007",
    manifestBeforeCanonicalSha256: sha256(canonicalJson(oldQuestion)),
    manifestBeforeCanonicalSha256Expected: oldItem.beforeQuestionSha256,
    currentCanonicalSha256: rows.find((row) => row.questionId === "ood-n09-b03-i007").currentCanonicalSha256,
    beforeKeyOptionId: oldQuestion.answer.optionId,
    beforeKeyText: oldQuestion.interaction.options.find((option) => option.optionId === oldQuestion.answer.optionId).text,
    currentKeyOptionId: current.find((question) => question.questionId === "ood-n09-b03-i007").answer.optionId,
    currentKeyText: current.find((question) => question.questionId === "ood-n09-b03-i007").interaction.options.find((option) => option.optionId === current.find((question) => question.questionId === "ood-n09-b03-i007").answer.optionId).text,
    acceptedOptionIdentityChanged: oldQuestion.answer.optionId !== current.find((question) => question.questionId === "ood-n09-b03-i007").answer.optionId
  },
  overlapControl: {
    acceptedQuestionId: oldAcceptedQuestion.questionId,
    sourcePath: "content/object-oriented-design-interview/objects_responsibilities_encapsulation_and_invariants/OOD-N02-B03.json",
    canonicalSha256: sha256(canonicalJson(oldAcceptedQuestion)),
    keyText: oldAcceptedQuestion.interaction.options.find((option) => option.optionId === oldAcceptedQuestion.answer.optionId).text
  },
  items: rows
};
writeFileSync(new URL("SEMANTIC-N09-B03-v3-CHECK.json", here), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ totals: receipt.totals, changedQuestionIds: changed }, null, 2));
