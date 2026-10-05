import { readFileSync, writeFileSync } from "node:fs";
import { validateQuestion, scoreQuestion } from "../../../../../patternly-content/scripts/content/question-contract.mjs";
import { canonicalJson, sha256 } from "../../../../../patternly-content/scripts/build.mjs";

const here = new URL("./", import.meta.url);
const read = (name) => readFileSync(new URL(name, here));
const oldBytes = read("review-inputs/N09-B07-v3.json");
const newBytes = read("review-inputs/N09-B07-v4.json");
const manifestBytes = read("N08-N09-MANIFEST.json");
const oldItems = JSON.parse(oldBytes);
const items = JSON.parse(newBytes);
const manifest = JSON.parse(manifestBytes);
if (oldItems.length !== 18 || items.length !== 18) throw new Error("Expected 18 N09-B07 items in each frozen input");
const rows = [];
const changedQuestions = [];
let changedMessages = 0;
let changedOptionLeaves = 0;
for (let i = 0; i < items.length; i += 1) {
  const old = oldItems[i];
  const q = items[i];
  if (old.questionId !== q.questionId) throw new Error(`Question order/ID mismatch at ${i}`);
  const changed = canonicalJson(old) !== canonicalJson(q);
  if (changed) changedQuestions.push(q.questionId);
  const beforeOptions = new Map(old.interaction.options.map((o) => [o.optionId, o.text]));
  const currentOptions = new Map(q.interaction.options.map((o) => [o.optionId, o.text]));
  const optionIdsAdded = [...currentOptions.keys()].filter((id) => !beforeOptions.has(id));
  const optionIdsRemoved = [...beforeOptions.keys()].filter((id) => !currentOptions.has(id));
  const optionTextChanges = [...currentOptions].filter(([id, text]) => beforeOptions.has(id) && beforeOptions.get(id) !== text).map(([id]) => id);
  changedOptionLeaves += optionIdsAdded.length + optionIdsRemoved.length + optionTextChanges.length;
  const oldMessages = new Map(old.feedback.messages.map((m) => [m.targetId, m.text]));
  const messages = new Map(q.feedback.messages.map((m) => [m.targetId, m.text]));
  const oldTargets = [...oldMessages.keys()].sort();
  const currentTargets = [...messages.keys()].sort();
  const targetsChanged = canonicalJson(oldTargets) !== canonicalJson(currentTargets);
  const textChanged = [...messages].filter(([id, text]) => oldMessages.has(id) && oldMessages.get(id) !== text).map(([id]) => id);
  changedMessages += textChanged.length;
  const targets = q.interaction.options.filter((o) => o.optionId !== q.answer.optionId).map((o) => o.optionId).sort();
  const feedbackTargets = q.feedback.messages.map((m) => m.targetId).sort();
  const validation = validateQuestion(q);
  const accepted = scoreQuestion(q, q.answer);
  const distractors = q.interaction.options.filter((o) => o.optionId !== q.answer.optionId);
  const everyDistractorIncorrect = distractors.every((o) => scoreQuestion(q, { type: "choice_single", optionId: o.optionId }).status === "incorrect");
  const reversed = { ...q, interaction: { ...q.interaction, options: [...q.interaction.options].reverse() } };
  const reversedAccepted = scoreQuestion(reversed, q.answer);
  const manifestUnit = manifest.units.find((u) => u.mentalUnitId === q.mentalUnitId);
  const beforeEntry = manifestUnit?.beforeItems.find((entry) => entry.reservedNewQuestionId === q.questionId);
  if (!beforeEntry || sha256(canonicalJson(beforeEntry.beforeQuestion)) !== beforeEntry.beforeQuestionSha256) throw new Error(`Manifest before-object mismatch for ${q.questionId}`);
  rows.push({
    questionId: q.questionId,
    changedFromV3: changed,
    beforeCanonicalSha256: sha256(canonicalJson(old)),
    currentCanonicalSha256: sha256(canonicalJson(q)),
    manifestBeforeCanonicalSha256: beforeEntry.beforeQuestionSha256,
    optionIdsAdded,
    optionIdsRemoved,
    optionTextChanges,
    changedMessageTargetIds: textChanged,
    feedbackTargetSetChanged: targetsChanged,
    valid: validation.valid,
    validationErrors: validation.errors,
    acceptedStatus: accepted.status,
    distractorCount: distractors.length,
    allDistractorsIncorrect: everyDistractorIncorrect,
    reversedAcceptedStatus: reversedAccepted.status,
    feedbackTargetSetExact: canonicalJson(targets) === canonicalJson(feedbackTargets)
  });
}
const expectedTargetRemapQuestions = ["ood-n09-b07-i021", "ood-n09-b07-i026", "ood-n09-b07-i029"];
const actualTargetRemapQuestions = rows.filter((r) => r.feedbackTargetSetChanged).map((r) => r.questionId).sort();
if (canonicalJson(actualTargetRemapQuestions) !== canonicalJson(expectedTargetRemapQuestions)) {
  throw new Error(`Unexpected feedback target remap scope: ${canonicalJson(actualTargetRemapQuestions)}`);
}
const failures = rows.filter((r) => !r.valid || r.acceptedStatus !== "correct" || !r.allDistractorsIncorrect || r.reversedAcceptedStatus !== "correct" || !r.feedbackTargetSetExact);
if (failures.length) throw new Error(`Production contract/scoring failures: ${canonicalJson(failures)}`);
if (changedQuestions.length !== 18 || changedMessages + expectedTargetRemapQuestions.length !== 72 || changedOptionLeaves !== 6) {
  throw new Error(`Unexpected v3-to-v4 delta ${canonicalJson({ changedQuestions: changedQuestions.length, changedMessages, changedOptionLeaves })}`);
}
const receipt = {
  schemaVersion: "bizq01-n09-b07-v4-independent-correction-check-v1",
  method: "Production validateQuestion/scoreQuestion for every accepted answer, every distractor, reversed options, exact diagnostic target set, exact manifest before-object hashes, and canonical whole-object v3-to-v4 diff accounting.",
  frozenInputs: {
    v3: { path: "review-inputs/N09-B07-v3.json", rawSha256: sha256(oldBytes) },
    v4: { path: "review-inputs/N09-B07-v4.json", rawSha256: sha256(newBytes) },
    manifest: { path: "N08-N09-MANIFEST.json", rawSha256: sha256(manifestBytes) }
  },
  totals: {
    questions: rows.length,
    changedWholeObjects: changedQuestions.length,
    unchangedWholeObjects: rows.length - changedQuestions.length,
    changedOptionLeaves,
    changedDiagnosticMessagesWithTargetRemaps: changedMessages + expectedTargetRemapQuestions.length,
    changedDiagnosticMessageTextsAtStableTargets: changedMessages,
    diagnosticTargetRemapQuestions: actualTargetRemapQuestions,
    invalid: rows.filter((r) => !r.valid).length,
    correctAcceptedAnswers: rows.filter((r) => r.acceptedStatus === "correct").length,
    allDistractorsIncorrect: rows.filter((r) => r.allDistractorsIncorrect).length,
    correctAfterReversal: rows.filter((r) => r.reversedAcceptedStatus === "correct").length,
    exactFeedbackTargetSets: rows.filter((r) => r.feedbackTargetSetExact).length
  },
  changedQuestionIds: changedQuestions,
  items: rows
};
writeFileSync(new URL("SEMANTIC-N09-B07-v4-CHECK.json", here), `${JSON.stringify(receipt, null, 2)}\n`);
console.log(JSON.stringify({ totals: receipt.totals, changedQuestionIds: changedQuestions }, null, 2));
