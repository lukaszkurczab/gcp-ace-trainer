import assert from "node:assert/strict";
import test from "node:test";

import type { Question } from "../../content/canonical";
import { canonicalInteractionRegistry } from "../../content/canonical/interactions/registry";
import type { ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import type { TrainingQuestionSummary } from "../trainingLifecycle/contracts";
import { certificationReviewEvidenceMatches, projectCertificationPracticeFeedback, projectCertificationPracticeQuestion } from "./certificationSessionFacade";

const question = Object.freeze({
  trackId: "claude-certified-architect-professional-certification",
  answer: Object.freeze({ optionId: "correct", type: "choice_single" }),
  constraints: Object.freeze(["Select one answer."]),
  feedback: Object.freeze({ details: Object.freeze({ blocks: Object.freeze([Object.freeze({ text: "Full explanation", type: "paragraph" })]) }), messages: Object.freeze([{ kind: "wrong_option", targetId: "wrong", text: "Authored wrong-option explanation." }]), reason: "Correct because of the durable contract." }),
  interaction: Object.freeze({
    options: Object.freeze([
      Object.freeze({ explanation: "Correct option explanation", optionId: "correct", text: "Correct choice" }),
      Object.freeze({ explanation: "Wrong option explanation", optionId: "wrong", text: "Wrong choice" }),
    ]),
    scoringMethod: "exact_selected_set",
    type: "choice_single",
  }),
  nodeId: "solution_design_and_architecture",
  prompt: "Choose the architecture.",
  questionId: "claude-focus-1",
  schemaVersion: "1",
  source: Object.freeze({ kind: "canonical" }),
  tags: Object.freeze([]),
} as unknown as Question);

const matrixQuestion = Object.freeze({
  trackId: "claude-certified-architect-professional-certification",
  answer: Object.freeze({ selectedValueIdsByDimension: Object.freeze({ boundary: Object.freeze(["yes"]), rollout: Object.freeze(["no"]) }), type: "decision_matrix" }),
  constraints: Object.freeze(["Choose one value for each statement."]),
  feedback: Object.freeze({
    details: Object.freeze({ statementExplanations: Object.freeze({ boundary: "The trust boundary must be explicit.", rollout: "Rollout evidence must be measured before expansion." }) }),
    messages: Object.freeze([{ kind: "wrong_value", targetId: "boundary|no", text: "This choice crosses the declared trust boundary." }]),
    reason: "Each statement has its own decision boundary.",
  }),
  interaction: Object.freeze({
    dimensions: Object.freeze([
      Object.freeze({ acceptedValueIds: Object.freeze(["yes"]), dimensionId: "boundary", label: "The model may read customer records.", values: Object.freeze([Object.freeze({ text: "Yes", valueId: "yes" }), Object.freeze({ text: "No", valueId: "no" })]) }),
      Object.freeze({ acceptedValueIds: Object.freeze(["no"]), dimensionId: "rollout", label: "Enable global rollout before monitoring.", values: Object.freeze([Object.freeze({ text: "Yes", valueId: "yes" }), Object.freeze({ text: "No", valueId: "no" })]) }),
    ]),
    scoringMethod: "dimension_exact",
    type: "decision_matrix",
  }),
  mentalUnitId: "security_boundaries",
  nodeId: "security_and_governance",
  prompt: "Review the two controls.",
  questionId: "claude-matrix-feedback-1",
  schemaVersion: "1",
  source: Object.freeze({ kind: "canonical" }),
  tags: Object.freeze([]),
} as unknown as Question);

function exact(value: Question): ResolvedInteractionItem {
  const question: TrainingQuestionSummary = { questionId: value.questionId, trackId: value.trackId, nodeId: value.nodeId, mentalUnitId: value.mentalUnitId, prompt: value.prompt, interactionType: value.interaction.type, difficulty: value.difficulty ?? null, constraints: value.constraints };
  const call = <T>(fn: (question: Question) => T) => fn(value);
  return { question, interactions: {
    isComplete: (_id, response) => call((q) => canonicalInteractionRegistry.isComplete(q, response)),
    evaluate: (_id, response) => call((q) => canonicalInteractionRegistry.evaluate(q, response)),
    presentReview: (_id, response, order) => call((q) => canonicalInteractionRegistry.presentReview(q, response, order)),
    present: (_id, response, order) => call((q) => canonicalInteractionRegistry.present(q, response, order)),
    projectFeedback: (_id, response) => call((q) => canonicalInteractionRegistry.projectFeedback(q, response)),
    projectDiagnostics: (_id, response) => call((q) => canonicalInteractionRegistry.projectDiagnostics(q, response)),
    controlIds: () => call((q) => canonicalInteractionRegistry.controlIds(q)),
    randomizeControlOrder: () => call((q) => canonicalInteractionRegistry.randomizeControlOrder(q)),
  } };
}

test("active Certification projection strips supplementary hints, answers, explanations and feedback structurally", () => {
  const exactQuestion = exact(question);
  const projected = projectCertificationPracticeQuestion(exactQuestion.question, exactQuestion.interactions.present(question.questionId, null).model);
  assert.deepEqual(projected, {
    interaction: {
      options: [
        { optionId: "correct", text: "Correct choice" },
        { optionId: "wrong", text: "Wrong choice" },
      ],
      scoringMethod: "exact_selected_set",
      type: "choice_single",
    },
    nodeId: "solution_design_and_architecture",
    prompt: "Choose the architecture.",
    questionId: "claude-focus-1",
  });
  assert.equal("answer" in projected, false);
  assert.equal("feedback" in projected, false);
  assert.equal(projected.interaction.options.some((option) => "explanation" in option), false);
});

test("deferred feedback remains absent after durable submit while immediate feedback is unchanged", () => {
  const attempt = Object.freeze({ response: Object.freeze({ optionId: "wrong", type: "choice_single" as const }), result: Object.freeze({ kind: "incorrect" as const }) });
  const exactQuestion = exact(question);
  assert.equal(projectCertificationPracticeFeedback("atSessionEnd", attempt, exactQuestion), null);
  assert.equal(projectCertificationPracticeFeedback("atSessionEnd", null, exactQuestion), null);
  assert.deepEqual(projectCertificationPracticeFeedback("afterEachAnswer", attempt, exactQuestion), {
    controls: [
      { id: "correct", state: "omitted_correct" },
      { id: "wrong", state: "incorrect" },
    ],
    details: question.feedback.details,
    messages: [question.feedback.messages?.[0]],
    reason: question.feedback.reason,
    result: "incorrect",
    sources: [],
  });
});

test("immediate Certification feedback returns only authored messages for selected incorrect IDs", () => {
  const withMessages = {
    ...question,
    feedback: {
      ...question.feedback,
      messages: [
        { kind: "wrong_option", targetId: "wrong", text: "Exact authored wrong explanation." },
        { kind: "wrong_option", targetId: "correct", text: "Unrelated wrong explanation." },
      ],
    },
  } as unknown as Question;
  const attempt = Object.freeze({ response: Object.freeze({ optionId: "wrong", type: "choice_single" as const }), result: Object.freeze({ kind: "incorrect" as const }) });
  assert.deepEqual(projectCertificationPracticeFeedback("afterEachAnswer", attempt, exact(withMessages))?.messages, [withMessages.feedback.messages?.[0]]);
});

test("immediate Certification matrix feedback preserves each statement's selected value and authored explanation", () => {
  const response = Object.freeze({ selectedValueIdsByDimension: Object.freeze({ boundary: Object.freeze(["no"]), rollout: Object.freeze(["no"]) }), type: "decision_matrix" as const });
  const attempt = Object.freeze({ response, result: Object.freeze({ kind: "incorrect" as const }) });
  const feedback = projectCertificationPracticeFeedback("afterEachAnswer", attempt, exact(matrixQuestion));
  assert.deepEqual(feedback?.statementRows?.map((row) => ({
    dimensionId: row.dimensionId,
    label: row.label,
    selectedValueIds: row.selectedValueIds,
    correctValueIds: row.correctValueIds,
    explanation: row.explanation,
    messages: row.messages,
  })), [
    {
      dimensionId: "boundary",
      label: "The model may read customer records.",
      selectedValueIds: ["no"],
      correctValueIds: ["yes"],
      explanation: "The trust boundary must be explicit.",
      messages: [{ kind: "wrong_value", targetId: "boundary|no", text: "This choice crosses the declared trust boundary." }],
    },
    {
      dimensionId: "rollout",
      label: "Enable global rollout before monitoring.",
      selectedValueIds: ["no"],
      correctValueIds: ["no"],
      explanation: "Rollout evidence must be measured before expansion.",
      messages: undefined,
    },
  ]);
  assert.deepEqual(feedback?.details, {}, "row-specific explanations are not duplicated in the generic feedback block");
  assert.equal(feedback?.messages, undefined, "row-targeted diagnostics are shown with their statement rows");
  assert.equal(projectCertificationPracticeFeedback("atSessionEnd", attempt, exact(matrixQuestion)), null);
});

test("completed review evidence fails closed when durable outcome aggregates are missing or inconsistent", () => {
  const attempts = [
    { result: { earnedPoints: 1, kind: "correct" as const, maxPoints: 1 } },
    { result: { earnedPoints: 1, kind: "partial" as const, maxPoints: 2 } },
  ];
  const complete = { correctCount: 1, incorrectCount: 0, maxPoints: 3, partialCount: 1, pointsEarned: 2 };
  assert.equal(certificationReviewEvidenceMatches(complete, attempts), true);
  assert.equal(certificationReviewEvidenceMatches({ ...complete, pointsEarned: 3 }, attempts), false);
  const { incorrectCount: _, ...missingCount } = complete;
  assert.equal(certificationReviewEvidenceMatches(missingCount, attempts), false);
  assert.equal(certificationReviewEvidenceMatches(null, attempts), false);
});
