import assert from "node:assert/strict";
import test from "node:test";

import { EXAM_BLUEPRINT, EXAM_QUESTION_COUNT } from "../src/constants";
import { buildExamQuestionViewsFromSession, selectExamQuestions } from "../src/features/exam/examGeneration";
import type { ExamDomain } from "../src/types";
import { makeQuestionBank, makeSession } from "./fixtures";

test("selects exact exam blueprint distribution", () => {
  const result = selectExamQuestions(makeQuestionBank());

  assert.equal(result.ok, true);

  if (!result.ok) {
    return;
  }

  assert.equal(result.questions.length, EXAM_QUESTION_COUNT);

  Object.entries(EXAM_BLUEPRINT).forEach(([domain, expectedCount]) => {
    assert.equal(result.questions.filter((question) => question.domain === domain).length, expectedCount);
  });
});

test("reports missing domains when bank is incomplete", () => {
  const result = selectExamQuestions(makeQuestionBank().filter((question) => question.domain !== "operations"));

  assert.equal(result.ok, false);

  if (result.ok) {
    return;
  }

  assert.equal(result.missing.operations?.required, EXAM_BLUEPRINT.operations);
  assert.equal(result.missing.operations?.available, 0);
});

test("option shuffling preserves option ids for scoring", () => {
  const selection = selectExamQuestions(makeQuestionBank());

  assert.equal(selection.ok, true);

  if (!selection.ok) {
    return;
  }

  const session = makeSession(selection.questions);
  const views = buildExamQuestionViewsFromSession(session, selection.questions);

  views.forEach((question) => {
    const originalIds = new Set(question.options.map((option) => option.id));
    const shuffledIds = new Set(question.shuffledOptions.map((option) => option.id));
    assert.deepEqual(shuffledIds, originalIds);
  });
});
