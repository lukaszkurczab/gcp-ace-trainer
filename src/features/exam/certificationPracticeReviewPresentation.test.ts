import assert from "node:assert/strict";
import test from "node:test";

import type { CertificationPracticeReviewItem } from "../../application/certification";
import { buildCertificationPracticeReviewControl, certificationPracticeReviewOptionState } from "./certificationPracticeReviewPresentation";

function item(input: Readonly<{ correctOptionIds: readonly string[]; selectedOptionIds: readonly string[]; selectionMode: "single" | "multiple" }>): CertificationPracticeReviewItem {
  return {
    constraints: [],
    correctOptionIds: input.correctOptionIds,
    details: { text: "Explanation" },
    item: { artifactSha256: "a".repeat(64), contentVersion: "test", questionId: "q1", trackId: "claude-certified-architect-professional-certification" },
    occurrenceId: "q1:1",
    options: [
      { optionId: "a", text: "A" },
      { optionId: "b", text: "B" },
      { optionId: "c", text: "C" },
      { optionId: "d", text: "D" },
    ],
    ordinal: 1,
    prompt: "Question",
    questionId: "q1",
    reason: "Reason",
    result: "incorrect",
    selectedOptionIds: input.selectedOptionIds,
    selectionMode: input.selectionMode,
  };
}

test("completed single-select review distinguishes the learner answer from the omitted correct answer", () => {
  assert.deepEqual(buildCertificationPracticeReviewControl(item({ correctOptionIds: ["a"], selectedOptionIds: ["b"], selectionMode: "single" })).options.map(({ id, state }) => ({ id, state })), [
    { id: "a", state: "omitted_correct" },
    { id: "b", state: "incorrect" },
    { id: "c", state: "neutral" },
    { id: "d", state: "neutral" },
  ]);
});

test("completed multi-select review preserves every selected, correct and omitted state", () => {
  assert.deepEqual(buildCertificationPracticeReviewControl(item({ correctOptionIds: ["a", "c"], selectedOptionIds: ["a", "b"], selectionMode: "multiple" })).options.map(({ id, state }) => ({ id, state })), [
    { id: "a", state: "correct" },
    { id: "b", state: "incorrect" },
    { id: "c", state: "omitted_correct" },
    { id: "d", state: "neutral" },
  ]);
  assert.equal(certificationPracticeReviewOptionState(true, true), "correct");
});
