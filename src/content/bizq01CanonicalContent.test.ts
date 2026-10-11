import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion, type Question } from "./canonical";
import { toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { detailLines } from "../features/practice/feedbackDetails";
import { CanonicalTrainingRuntime } from "../application/canonical/CanonicalTrainingRuntime";
import { composeCanonicalFeedback, projectCanonicalChoiceFeedbackControls, projectCanonicalChoiceFeedbackMessages } from "../application/canonical/canonicalInteractionPresentation";
import type { ReviewQueueEntry } from "../domain";

const trackId = "backend-system-design-interview";
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"));
const BESD_COHORT_PROOF_PATH = path.join(contentRoot, "evidence/business-quality/bizq-01-besd-cohort-15.json");
const BESD_COHORT_PROOF_SHA256 = "548e65b0ec000419d719f7ba5da3ae7c3e1225fe5bb09917a11edef803af4cb3";
const changed = [
  { questionId: "besd-n02-b01-i017", replacedId: "besd-n02-b01-i002", optionId: "command_status_completion" },
  { questionId: "besd-n04-b01-i019", replacedId: "besd-n04-b01-i002", optionId: "service_scoped_derived_cache" },
];

test("BIZQ-01 bundled loader and pre-submit projection preserve the corrected source contract", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
  assert.notDeepEqual(track.trainingIdentity, { contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 });
  assert.equal(track.planningPolicyIdentity?.contentVersion, track.contentVersion);
  for (const expected of changed) {
    assert.equal(track.getQuestion(expected.replacedId), undefined, "replaced IDs must not resolve to new meanings");
    const question = track.getQuestion(expected.questionId)!;
    assert.ok(question);
    assert.equal(question.interaction.type, "choice_single");
    if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error("Expected authored single choice");
    assert.equal(question.answer.optionId, expected.optionId);
    const view = toCanonicalQuestionViewModel(question);
    assert.deepEqual(Object.keys(view).sort(), ["constraints", "interaction", "itemId", "prompt"]);
    assert.deepEqual(view.constraints, question.constraints);
    assert.ok(view.constraints.every((text) => !/^\s*the\s+primary\s+decision\s+is\b/i.test(text)));
    assert.ok(!JSON.stringify(view).includes(question.feedback.reason));
    assert.ok(!JSON.stringify(view).includes(String(question.feedback.details)));
    assert.deepEqual(detailLines(question.feedback.details), [question.feedback.details]);
    for (const option of question.interaction.options) {
      const result = scoreCanonicalQuestion(question, { type: "choice_single", optionId: option.optionId });
      assert.equal(result.kind, option.optionId === expected.optionId ? "correct" : "incorrect");
      if (option.optionId !== expected.optionId) {
        assert.ok(question.feedback.messages?.some((message) => message.kind === "wrong_option" && message.targetId === option.optionId && message.text.trim()));
      }
    }
  }
});
test("BESD B02-B09 cohort of 134 questions scores and presents feedback by stable option identity", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
  const proofBytes = await readFile(BESD_COHORT_PROOF_PATH);
  const proofSha256 = createHash("sha256").update(proofBytes).digest("hex");
  assert.match(BESD_COHORT_PROOF_SHA256, /^[a-f0-9]{64}$/u, "the reviewed producer proof SHA must be pinned in this consumer test");
  assert.equal(proofSha256, BESD_COHORT_PROOF_SHA256, "the app test consumes only the reviewed immutable cohort proof");
  const proof = JSON.parse(proofBytes.toString("utf8")) as {
    schemaVersion: string;
    trackId: string;
    beforeProducerCommit: string;
    contentVersion: string;
    replacements: readonly Readonly<{
      beforeQuestionId: string;
      questionId: string;
      mentalUnitId: string;
      beforeQuestion: Question;
      currentQuestion: Question;
    }>[];
  };
  assert.equal(proof.schemaVersion, "patternly-bizq-semantic-replacement-v1");
  assert.equal(proof.trackId, trackId);
  assert.equal(proof.beforeProducerCommit, "0f4e6912d7d0cdb1a1c41b9d7885d7e867f80f34");
  assert.equal(proof.replacements.length, 134);
  const units = [
    { id: "BESD-N02-B02", count: 16 },
    { id: "BESD-N02-B03", count: 17 },
    { id: "BESD-N02-B04", count: 17 },
    { id: "BESD-N02-B05", count: 17 },
    { id: "BESD-N02-B06", count: 16 },
    { id: "BESD-N02-B07", count: 17 },
    { id: "BESD-N02-B08", count: 16 },
    { id: "BESD-N02-B09", count: 18 },
  ] as const;
  let total = 0;
  for (const unit of units) {
    const expectedIds = Array.from({ length: unit.count }, (_, index) => `besd-${unit.id.slice("BESD-".length).toLowerCase()}-i${String(index + 1 + unit.count).padStart(3, "0")}`);
    const replacements = proof.replacements.filter((replacement) => replacement.mentalUnitId === unit.id);
    assert.equal(replacements.length, unit.count, `${unit.id} has the reviewed replacement count`);
    assert.deepEqual(replacements.map((replacement) => replacement.questionId).sort(), expectedIds.sort(), `${unit.id} proof pins the exact current question IDs`);
    const questions = track.questions.filter((question) => question.mentalUnitId === unit.id);
    assert.deepEqual(questions.map((question) => question.questionId).sort(), expectedIds.sort(), `${unit.id} contains the exact reviewed question IDs`);
    for (const replacement of replacements) {
      assert.equal(replacement.currentQuestion.questionId, replacement.questionId);
      assert.equal(replacement.currentQuestion.mentalUnitId, unit.id);
      assert.deepEqual(track.getQuestion(replacement.questionId), replacement.currentQuestion, `${replacement.questionId} is exactly the reviewed current question`);
      if (replacement.beforeQuestionId !== replacement.questionId) assert.equal(track.getQuestion(replacement.beforeQuestionId), undefined, `${replacement.beforeQuestionId} is retired when identity changed`);
    }
    assert.ok(!questions.every((question) => question.answer.type === "choice_single" && question.answer.optionId === "primary_decision"), `${unit.id} must not use a fixed primary_decision answer key throughout`);
    for (const question of questions) {
      total += 1;
      assert.equal(question.interaction.type, "choice_single", `${question.questionId} uses the reviewed single-choice consumer path`);
      if (question.interaction.type !== "choice_single" || question.answer.type !== "choice_single") throw new Error(`Expected single-choice contract for ${question.questionId}`);

      const correctId = question.answer.optionId;
      const optionIds = question.interaction.options.map((option) => option.optionId);
      assert.ok(optionIds.includes(correctId), `${question.questionId} answer references an option by stable ID`);
      const authoredWrongIds = question.interaction.options.map((option) => option.optionId).filter((id) => id !== correctId).sort();
      const wrongMessages = (question.feedback.messages ?? []).filter((message) => message.kind === "wrong_option");
      assert.deepEqual(wrongMessages.map((message) => message.targetId).sort(), authoredWrongIds, `${question.questionId} has one authored message per wrong option and none for the answer`);
      assert.doesNotMatch(JSON.stringify(question.feedback.details), /The distractors either/iu, `${question.questionId} has specific feedback rather than the retired generic correction`);

      const view = toCanonicalQuestionViewModel(question);
      assert.deepEqual(Object.keys(view).sort(), ["constraints", "interaction", "itemId", "prompt"]);
      assert.equal(view.prompt, question.prompt);
      assert.deepEqual(view.constraints, question.constraints ?? []);
      assert.equal(view.interaction.kind, "choice");
      if (view.interaction.kind !== "choice") throw new Error(`Expected choice interaction projection for ${question.questionId}`);
      assert.deepEqual(view.interaction.options, question.interaction.options.map((option) => ({ id: option.optionId, selected: false, text: option.text })));
      assert.ok(view.constraints.every((constraint) => !/the primary decision is|the correct answer is|select the correct option/iu.test(constraint)), `${question.questionId} pre-submit constraints do not disclose the answer`);

      const reordered = {
        ...question,
        interaction: { ...question.interaction, options: [...question.interaction.options].reverse() },
      } as typeof question;
      for (const optionId of optionIds) {
        const response = { type: "choice_single" as const, optionId };
        const expectedKind = optionId === correctId ? "correct" : "incorrect";
        const originalScore = scoreCanonicalQuestion(question, response);
        const reorderedScore = scoreCanonicalQuestion(reordered, response);
        assert.equal(originalScore.kind, expectedKind, `${question.questionId}/${optionId} score follows the stable answer ID`);
        assert.deepEqual(reorderedScore, originalScore, `${question.questionId}/${optionId} score is invariant under option order`);

        const controls = new Map(projectCanonicalChoiceFeedbackControls(reordered, response).map((control) => [control.id, control.state]));
        assert.equal(controls.get(optionId), expectedKind === "correct" ? "correct" : "incorrect");
        assert.equal(controls.get(correctId), expectedKind === "correct" ? "correct" : "omitted_correct");
        const delivered = projectCanonicalChoiceFeedbackMessages(reordered, response) ?? [];
        const expectedMessages = optionId === correctId ? [] : wrongMessages.filter((message) => message.targetId === optionId);
        if (optionId !== correctId) assert.equal(expectedMessages.length, 1, `${question.questionId}/${optionId} has a matching stable-ID explanation`);
        assert.deepEqual(delivered, expectedMessages, `${question.questionId}/${optionId} presents only feedback for the selected wrong option`);
        assert.deepEqual(composeCanonicalFeedback(reordered, response).messages, expectedMessages, `${question.questionId}/${optionId} composed feedback preserves the authored target`);
      }
    }
  }
  assert.equal(total, 134);
});

test("BIZQ-01 replaced identities from an old package do not enter current due retrieval", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
  assert.notDeepEqual(track.trainingIdentity, { contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 });
  const now = "2026-10-02T12:00:00.000Z";
  const reviews: ReviewQueueEntry[] = changed.map((item, index) => ({
    id: `bizq-old-review-${index}`, trackId, sourceAttemptId: `old-attempt-${index}`, sourceSessionId: "old-session",
    sourceItem: { trackId, questionId: item.replacedId, contentVersion: "backend-system-design-interview-candidate-v2026.08.15", artifactSha256: "0".repeat(64) },
    taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: now, createdAt: now, consecutiveAfterDueSuccesses: 0, persistent: false,
  }));
  const projection = await new CanonicalTrainingRuntime(track).queryReview({ trackId, reviews, now });
  assert.equal((projection as { due: readonly ReviewQueueEntry[] }).due.length, 0);
});
