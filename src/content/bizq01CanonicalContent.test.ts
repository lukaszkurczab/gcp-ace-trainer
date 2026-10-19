import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import test from "node:test";
import { scoreCanonicalQuestion } from "./canonical";
import { createCanonicalQuestionCatalog } from "./canonical/questionCatalog";
import { canonicalInteractionRegistry } from "./canonical/interactions/registry";
import { PRODUCT_MODE_CONFIGS } from "./canonical/productModeConfig";
import { toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { detailLines } from "../features/practice/feedbackDetails";
import { createCanonicalTrainingFamilyRuntime } from "../application/canonicalTrainingFamilyComposition";
import { composeCanonicalFeedback, projectCanonicalChoiceFeedbackControls, projectCanonicalChoiceFeedbackMessages } from "../application/canonical/canonicalInteractionPresentation";
import type { ReviewQueueEntry } from "../domain";

const trackId = "backend-system-design-interview";
const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"));
const currentTrackPromise = (async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "patternly-bizq01-current-source-"));
  try {
    const { buildAll } = await import(pathToFileURL(path.join(contentRoot, "scripts/build.mjs")).href);
    const producer = await buildAll({ rootDirectory: contentRoot, outputRoot });
    const artifact = JSON.parse(await readFile(path.join(outputRoot, `${trackId}.json`), "utf8")) as unknown;
    const lock = producer.lock.tracks.find((entry: { trackId: string }) => entry.trackId === trackId);
    assert.ok(lock, `current CONTENT build emits a ${trackId} lock`);
    const catalog = await createCanonicalQuestionCatalog(artifact, lock, trackId, async (value: string) => createHash("sha256").update(value).digest("hex"));
    const modes = PRODUCT_MODE_CONFIGS.filter((mode) => mode.trackId === trackId);
    const track = {
      trackId,
      contentVersion: catalog.contentVersion,
      artifactSha256: catalog.artifactSha256,
      contentReleaseId: catalog.artifactMetadata.contentReleaseId,
      questions: catalog.questions,
      interactions: canonicalInteractionRegistry,
      modes,
      getQuestion: (questionId: string) => catalog.getQuestionById(questionId),
      getQuestionsForNode: (nodeId: string) => catalog.getQuestionsByNodeId(nodeId),
      getQuestionsForMentalUnit: (mentalUnitId: string) => catalog.getQuestionsByMentalUnitId(mentalUnitId),
      getMode: (modeId: string) => {
        const mode = modes.find((candidate) => candidate.modeId === modeId);
        if (!mode) throw new Error(`Canonical mode ${trackId}/${modeId} is unavailable.`);
        return mode;
      },
      getPool: (modeId: string) => {
        const selection = track.getMode(modeId).selection;
        if (selection.kind === "exact_ordered_questions") return selection.questionIds.map((id) => catalog.getQuestionById(id)).filter((question) => question !== undefined);
        const questions = catalog.getQuestionsByNodeId(selection.nodeId);
        return selection.kind === "node" && selection.mentalUnitId ? questions.filter((question) => question.mentalUnitId === selection.mentalUnitId) : questions;
      },
    };
    return { catalog, track };
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
})();
const changed = [
  { questionId: "besd-n02-b01-i017", replacedId: "besd-n02-b01-i002", optionId: "command_status_completion" },
  { questionId: "besd-n04-b01-i019", replacedId: "besd-n04-b01-i002", optionId: "service_scoped_derived_cache" },
];

test("BIZQ-01 current source and APP catalog preserve the corrected pre-submit contract", async () => {
  const { catalog: track } = await currentTrackPromise;
  for (const expected of changed) {
    const question = track.getQuestionById(expected.questionId)!;
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
test("current BESD B02-B09 questions score and present feedback by stable option identity", async () => {
  const { catalog: track } = await currentTrackPromise;
  const units = ["BESD-N02-B02", "BESD-N02-B03", "BESD-N02-B04", "BESD-N02-B05", "BESD-N02-B06", "BESD-N02-B07", "BESD-N02-B08", "BESD-N02-B09"] as const;
  let total = 0;
  for (const unit of units) {
    const questions = track.questions.filter((question) => question.mentalUnitId === unit);
    assert.ok(questions.length > 0, `${unit} has current questions`);
    assert.ok(!questions.every((question) => question.answer.type === "choice_single" && question.answer.optionId === "primary_decision"), `${unit} must not use a fixed primary_decision answer key throughout`);
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
      assert.equal(view.interaction.interactionType, question.interaction.type);
      const presentation = view.interaction.model as { renderer: { options: readonly { id: string; selected: boolean; text: string }[] } };
      assert.deepEqual(presentation.renderer.options, question.interaction.options.map((option) => ({ id: option.optionId, selected: false, text: option.text })));
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
        assert.deepEqual(composeCanonicalFeedback(reordered, response, scoreCanonicalQuestion(reordered, response)).messages, expectedMessages, `${question.questionId}/${optionId} composed feedback preserves the authored target`);
      }
    }
  }
  assert.ok(total > 0, "current questions across B02-B09 are exercised without freezing the bank's total size");
});

test("BIZQ-01 current review retrieval keeps current items and excludes stale-package references", async () => {
  const { ContentPackageRuntimeOwner } = await import("../application/contentPackageRuntimeOwner");
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  const current = await owner.resolveForDiscovery(trackId, "design_interview");
  const track = current.track;
  const now = "2026-10-02T12:00:00.000Z";
  const currentReview: ReviewQueueEntry = {
    id: "bizq-current-review", trackId, sourceAttemptId: "current-attempt", sourceSessionId: "current-session",
    sourceItem: { trackId, questionId: changed[0]!.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 },
    taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: now, createdAt: now, consecutiveAfterDueSuccesses: 0, persistent: false,
  };
  const staleReviews: ReviewQueueEntry[] = changed.map((item, index) => ({
    id: `bizq-stale-review-${index}`, trackId, sourceAttemptId: `stale-attempt-${index}`, sourceSessionId: "stale-session",
    sourceItem: { trackId, questionId: item.replacedId, contentVersion: "backend-system-design-interview-candidate-v2026.08.15", artifactSha256: "0".repeat(64) },
    taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: now, createdAt: now, consecutiveAfterDueSuccesses: 0, persistent: false,
  }));
  const projection = await current.runtime.queryReview({ trackId, reviews: [currentReview, ...staleReviews], now });
  const due = (projection as { due: readonly ReviewQueueEntry[] }).due;
  assert.deepEqual(due.map((entry) => entry.sourceItem.questionId), [changed[0]!.questionId],
    "current exact-package retrieval retains the valid item and excludes stale package references; stale identity is not historical-availability proof");
});
