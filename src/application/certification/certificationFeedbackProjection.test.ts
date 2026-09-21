import assert from "node:assert/strict";
import test from "node:test";

import type { Question } from "../../content/canonical";
import { certificationReviewEvidenceMatches, projectCertificationPracticeFeedback, projectCertificationPracticeQuestion } from "./certificationSessionFacade";

const question = Object.freeze({
  answer: Object.freeze({ optionId: "correct", type: "choice_single" }),
  constraints: Object.freeze(["Select one answer."]),
  feedback: Object.freeze({ details: Object.freeze({ blocks: Object.freeze([Object.freeze({ text: "Full explanation", type: "paragraph" })]) }), reason: "Correct because of the durable contract." }),
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

test("active Certification projection strips answers, explanations and feedback structurally", () => {
  const projected = projectCertificationPracticeQuestion(question);
  assert.deepEqual(projected, {
    constraints: ["Select one answer."],
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
  assert.equal(projectCertificationPracticeFeedback("atSessionEnd", attempt, question), null);
  assert.equal(projectCertificationPracticeFeedback("atSessionEnd", null, question), null);
  assert.deepEqual(projectCertificationPracticeFeedback("afterEachAnswer", attempt, question), {
    controls: [
      { id: "correct", state: "omitted_correct" },
      { id: "wrong", state: "incorrect" },
    ],
    details: question.feedback.details,
    reason: question.feedback.reason,
    result: "incorrect",
    sources: [],
  });
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
