import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog, scoreCanonicalQuestion } from "./canonical";
import { toCanonicalQuestionViewModel } from "../features/practice/canonicalQuestionViewModel";
import { detailLines } from "../features/practice/feedbackDetails";
import { CanonicalTrainingRuntime } from "../application/canonical/CanonicalTrainingRuntime";
import type { ReviewQueueEntry } from "../domain";

const trackId = "backend-system-design-interview";
const changed = [
  { questionId: "besd-n02-b01-i017", replacedId: "besd-n02-b01-i002", optionId: "command_status_completion" },
  { questionId: "besd-n04-b01-i019", replacedId: "besd-n04-b01-i002", optionId: "service_scoped_derived_cache" },
];

test("BIZQ-01 bundled loader and pre-submit projection preserve the corrected source contract", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
  assert.equal(track.contentVersion, "backend-system-design-interview-authoring-v2026.10.02-bizq01-01");
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

test("BIZQ-01 replaced identities from an old package do not enter current due retrieval", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(trackId);
  const now = "2026-10-02T12:00:00.000Z";
  const reviews: ReviewQueueEntry[] = changed.map((item, index) => ({
    id: `bizq-old-review-${index}`, trackId, sourceAttemptId: `old-attempt-${index}`, sourceSessionId: "old-session",
    sourceItem: { trackId, questionId: item.replacedId, contentVersion: "backend-system-design-interview-candidate-v2026.08.15", artifactSha256: "0".repeat(64) },
    taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: now, createdAt: now, consecutiveAfterDueSuccesses: 0, persistent: false,
  }));
  const projection = await new CanonicalTrainingRuntime(track).queryReview({ trackId, reviews, now });
  assert.equal((projection as { due: readonly ReviewQueueEntry[] }).due.length, 0);
});
