import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { validateQuestion, scoreQuestion } from "../../../../../patternly-content/scripts/content/question-contract.mjs";
import { canonicalJson, sha256 } from "../../../../../patternly-content/scripts/build.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const packet = (name) => path.join(here, name);
const rawSha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const readJson = (name) => {
  const bytes = readFileSync(packet(name));
  return { value: JSON.parse(bytes.toString("utf8")), sha256: rawSha(bytes) };
};

const manifest = readJson("N08-N09-MANIFEST.json");
const units = ["N09-B05", "N09-B06", "N09-B07"];
const report = {
  schemaVersion: "patternly-bizq01-independent-n09-v2-check-v1",
  method: "Repository validateQuestion/scoreQuestion; canonicalJson/sha256 from patternly-content/scripts/build.mjs; score by answer.optionId, including reversed option order.",
  manifestSha256: manifest.sha256,
  units: [],
  totals: { questions: 0, valid: 0, answerScores: 0, wrongScores: 0, reversedCorrectScores: 0, messageTargetSetMatches: 0, wholeObjectBindings: 0, previousToCurrentDiagnosticOnly: 0 },
};

for (const unit of units) {
  const stem = `${unit}-v2`;
  const proposal = readJson(`review-inputs/${stem}.json`);
  const old = readJson(`review-inputs/${unit}-v1.json`);
  const baseline = manifest.value.units.find((entry) => entry.mentalUnitId === `OOD-${unit}`);
  if (!baseline) throw new Error(`Missing baseline manifest unit ${unit}`);
  const beforeQuestions = JSON.parse(baseline.beforeSourceText);
  const beforeItems = baseline.beforeItems;
  const oldById = new Map(old.value.map((question) => [question.questionId, question]));
  if (beforeQuestions.length !== proposal.value.length || beforeItems.length !== proposal.value.length) throw new Error(`Baseline/proposal count mismatch for ${unit}`);
  const items = [];
  for (const [index, question] of proposal.value.entries()) {
    const id = question.questionId;
    const prior = oldById.get(id);
    const before = beforeQuestions[index];
    const mapping = beforeItems[index];
    if (!prior || !before || mapping.questionId !== before.questionId || ![mapping.questionId, mapping.reservedNewQuestionId].includes(id)) throw new Error(`Missing or misaligned v1/before object for ${id}`);
    if (sha256(before) !== mapping.beforeQuestionSha256) throw new Error(`Manifest whole-object fingerprint mismatch for ${id}`);
    const validation = validateQuestion(question);
    const opts = question.interaction.options;
    const answerId = question.answer.optionId;
    const optionIds = opts.map((option) => option.optionId);
    const targetIds = question.feedback.messages.filter((message) => message.kind === "wrong_option").map((message) => message.targetId);
    const expectedTargets = optionIds.filter((optionId) => optionId !== answerId);
    const targetSetMatches = targetIds.length === expectedTargets.length && new Set(targetIds).size === targetIds.length && expectedTargets.every((targetId) => targetIds.includes(targetId));
    const answerScore = scoreQuestion(question, { type: "choice_single", optionId: answerId });
    const wrongScores = expectedTargets.map((optionId) => scoreQuestion(question, { type: "choice_single", optionId }));
    const reversed = { ...question, interaction: { ...question.interaction, options: [...opts].reverse() } };
    const reversedScore = scoreQuestion(reversed, { type: "choice_single", optionId: answerId });
    const v1Normalized = structuredClone(prior);
    const v2Normalized = structuredClone(question);
    delete v1Normalized.feedback.messages;
    delete v2Normalized.feedback.messages;
    const v1v2OutsideMessagesSame = canonicalJson(v1Normalized) === canonicalJson(v2Normalized);
    const item = {
      questionId: id,
      beforeQuestionId: before.questionId,
      reservedNewQuestionId: mapping.reservedNewQuestionId,
      beforeCanonicalSha256: sha256(before),
      v1CanonicalSha256: sha256(prior),
      currentCanonicalSha256: sha256(question),
      answerOptionId: answerId,
      optionIds,
      validation: validation.valid,
      validationErrors: validation.errors,
      answerScore: answerScore.status,
      wrongOptionIds: expectedTargets,
      wrongScores: wrongScores.map((score, index) => ({ optionId: expectedTargets[index], status: score.status })),
      reversedAnswerScore: reversedScore.status,
      diagnosticTargetsMatch: targetSetMatches,
      v1v2OutsideMessagesSame,
    };
    items.push(item);
    report.totals.questions += 1;
    if (validation.valid) report.totals.valid += 1;
    if (answerScore.status === "correct") report.totals.answerScores += 1;
    report.totals.wrongScores += wrongScores.filter((score) => score.status === "incorrect").length;
    if (reversedScore.status === "correct") report.totals.reversedCorrectScores += 1;
    if (targetSetMatches) report.totals.messageTargetSetMatches += 1;
    if (v1v2OutsideMessagesSame) report.totals.previousToCurrentDiagnosticOnly += 1;
    report.totals.wholeObjectBindings += 1;
  }
  report.units.push({
    unit,
    proposalPath: `review-inputs/${stem}.json`,
    proposalSha256: proposal.sha256,
    v1Path: `review-inputs/${unit}-v1.json`,
    v1Sha256: old.sha256,
    baselineSourcePath: baseline.sourcePath,
    baselineSourceSha256: baseline.sourceSha256,
    baselineQuestionCount: beforeQuestions.length,
    questionCount: items.length,
    items,
  });
}

writeFileSync(packet("INDEPENDENT-N09-B05-B07-v2-CHECK.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report.totals));
