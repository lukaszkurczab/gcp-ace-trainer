import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingAttempt } from "../src/domain";
import {
  AlgorithmInteractionContentError,
  buildAlgorithmInteractionViewModel,
  deriveAlgorithmReviewReasons,
  getAlgorithmInteractionCompleteness,
  scoreAlgorithmQuestion,
  submitAlgorithmInteraction,
  updateAlgorithmReviewEntry,
  validateAlgorithmInteractionItem,
  createAlgorithmReviewEntry,
  type AlgorithmQuestion,
} from "../src/tracks/algorithms";

const feedbackModel = {
  decisionSignal: "The maintained invariant decides the response.",
  details: "The authored details explain the invariant and its application.",
  distractorExplanations: { wrong: "This option violates the stated invariant." },
  mentalModelCorrection: "Unused by the interaction handler.",
  mistakeTypes: ["wrong_pattern_selected"],
  nextAction: "Continue.",
  omittedCorrectOptionExplanations: { rightA: "This required condition is part of the invariant.", rightB: "This required condition is also part of the invariant." },
  result: "diagnostic" as const,
};
const base = { contentVersion: "v1", difficulty: "core" as const, feedbackModel, id: "choice", learningStage: "guided_application" as const, primarySkillAtomId: "invariant", prompt: "Choose every required condition.", type: "single_choice" as const };
const multipleChoice = { ...base, options: [{ id: "rightA", isCorrect: true, text: "Condition A" }, { id: "rightB", isCorrect: true, text: "Condition B" }, { id: "wrong", isCorrect: false, text: "Plausible error" }] } satisfies AlgorithmQuestion;
const ordering = { ...base, id: "ordering", type: "subgoal_ordering" as const, subgoals: [{ id: "a", text: "A" }, { id: "b", text: "B" }, { id: "c", text: "C" }], correctOrder: ["a", "b", "c"] } satisfies AlgorithmQuestion;
const complexity = { ...base, id: "complexity", type: "complexity_check" as const, correctComplexity: { maxPoints: 1, dimensions: [{ id: "amortized_time", values: ["amortized O(1)", "O(n)"], acceptedValues: ["amortized O(1)"], acceptedAliases: ["amortized constant"] }] } } satisfies AlgorithmQuestion;

test("choice handler separates completeness, exact scoring, diagnostics, and authored partial feedback", () => {
  assert.deepEqual(getAlgorithmInteractionCompleteness(multipleChoice, null), { complete: false, missing: ["response"] });
  assert.deepEqual(getAlgorithmInteractionCompleteness(multipleChoice, { kind: "choice", selectedOptionIds: [] }), { complete: false, missing: ["selection"] });
  const submitted = submitAlgorithmInteraction({ question: multipleChoice, response: { kind: "choice", selectedOptionIds: ["rightA"] } });
  assert.equal(submitted.score.status, "partial");
  assert.deepEqual(submitted.score.diagnostics.omittedCorrectOptionIds, ["rightB"]);
  assert.deepEqual(submitted.feedback.omittedCorrectOptionExplanations, [{ optionId: "rightB", text: feedbackModel.omittedCorrectOptionExplanations.rightB }]);
  const wrong = submitAlgorithmInteraction({ question: multipleChoice, response: { kind: "choice", selectedOptionIds: ["rightA", "wrong"] } });
  assert.equal(wrong.score.result.earnedPoints, 0);
  assert.deepEqual(wrong.feedback.wrongOptionExplanations, [{ optionId: "wrong", text: feedbackModel.distractorExplanations.wrong }]);
  assert.throws(() => scoreAlgorithmQuestion(multipleChoice, { kind: "choice", selectedOptionIds: ["rightA", "rightA"] }), /invalid/);
  assert.throws(() => scoreAlgorithmQuestion(multipleChoice, { kind: "choice", selectedOptionIds: ["unknown"] }), /invalid/);
});

test("ordering and content-defined complexity handlers validate and score their declared contracts", () => {
  validateAlgorithmInteractionItem(ordering);
  assert.equal(submitAlgorithmInteraction({ question: ordering, response: { kind: "ordering", orderedSubgoalIds: ["c", "a", "b"] } }).score.status, "partial");
  validateAlgorithmInteractionItem(complexity);
  assert.equal(submitAlgorithmInteraction({ question: complexity, response: { kind: "complexity", selectedValuesByDimension: { amortized_time: "amortized constant" } } }).score.status, "correct");
  assert.equal(submitAlgorithmInteraction({ question: complexity, response: { kind: "complexity", selectedValuesByDimension: { amortized_time: "O(n)" } } }).score.status, "incorrect");
  assert.throws(() => validateAlgorithmInteractionItem({ ...ordering, subgoals: [{ id: "a", text: "A" }], correctOrder: ["a"] }), AlgorithmInteractionContentError);
});

test("renderer and accessibility models conceal scoring inputs until feedback is explicitly composed", () => {
  const view = buildAlgorithmInteractionViewModel(complexity, { kind: "complexity", selectedValuesByDimension: {} });
  assert.deepEqual(view.renderer, { dimensions: [{ id: "amortized_time", values: ["amortized O(1)", "O(n)"] }], kind: "complexity" });
  assert.doesNotMatch(JSON.stringify(view), /acceptedValues|acceptedAliases|amortized constant/);
  assert.doesNotMatch(JSON.stringify(buildAlgorithmInteractionViewModel(multipleChoice, null)), /isCorrect|omittedCorrectOptionExplanations/);
});

test("validators expose content defects and review reasons preserve provenance without duplicate retry evidence", () => {
  assert.throws(() => validateAlgorithmInteractionItem({ ...multipleChoice, feedbackModel: { ...feedbackModel, details: undefined } }), /content defect.*Details/);
  const score = submitAlgorithmInteraction({ question: complexity, response: { kind: "complexity", selectedValuesByDimension: { amortized_time: "O(n)" } } }).score;
  assert.deepEqual(deriveAlgorithmReviewReasons({ priorAttemptsForSameItem: [{ result: { kind: "incorrect" } } as never], score }), ["incorrect", "complexity_error", "repeated_mistake"]);
  const item = { contentVersion: "v1", itemId: "complexity", trackId: "algorithms" } as const;
  const attempt = createTrainingAttempt({ answeredAt: "2026-07-02T00:00:00.000Z", committedAt: "2026-07-02T00:00:00.000Z", id: "attempt:one", item, modeId: "practice", occurrenceId: "occurrence:one", response: { kind: "complexity" as const, selectedValuesByDimension: { amortized_time: "O(n)" } }, result: score.result, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "mistake_type", nodeId: "complexity_error" }] }, sessionId: "session:one", trackId: "algorithms" });
  const review = createAlgorithmReviewEntry(attempt, "2026-07-01T00:00:00.000Z", ["incorrect", "complexity_error"]);
  assert.deepEqual(review.reasons, ["incorrect", "complexity_error"]);
  assert.equal(updateAlgorithmReviewEntry(review, attempt), review);
});
