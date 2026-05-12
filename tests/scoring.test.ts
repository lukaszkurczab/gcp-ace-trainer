import assert from "node:assert/strict";
import test from "node:test";

import { scoreExamSession } from "../src/features/exam/scoringService";
import { makeQuestion, makeSession } from "./fixtures";

test("scores single choice correct, incorrect, and unanswered answers", () => {
  const questions = [
    makeQuestion({ id: "single-correct", domain: "setup_environment", correctOptionIds: ["a"] }),
    makeQuestion({ id: "single-incorrect", domain: "setup_environment", correctOptionIds: ["a"] }),
    makeQuestion({ id: "unanswered", domain: "operations", correctOptionIds: ["a"] })
  ];
  const session = makeSession(questions, {
    "single-correct": ["a"],
    "single-incorrect": ["b"]
  });
  const score = scoreExamSession(session, questions, "2026-01-01T12:00:00.000Z");

  assert.equal(score.correctCount, 1);
  assert.equal(score.totalQuestions, 3);
  assert.equal(score.scorePercent, 33);
  assert.deepEqual(score.incorrectQuestionIds, ["single-incorrect"]);
  assert.deepEqual(score.unansweredQuestionIds, ["unanswered"]);
});

test("scores multiple select only on exact option-set match", () => {
  const questions = [
    makeQuestion({ id: "multi-exact", type: "multiple", correctOptionIds: ["a", "c"] }),
    makeQuestion({ id: "multi-partial", type: "multiple", correctOptionIds: ["a", "c"] })
  ];
  const session = makeSession(questions, {
    "multi-exact": ["c", "a"],
    "multi-partial": ["a"]
  });
  const score = scoreExamSession(session, questions, "2026-01-01T12:00:00.000Z");

  assert.equal(score.correctCount, 1);
  assert.equal(score.answers.find((answer) => answer.questionId === "multi-exact")?.isCorrect, true);
  assert.equal(score.answers.find((answer) => answer.questionId === "multi-partial")?.isCorrect, false);
});

test("calculates domain and tag scores and preserves flagged ids", () => {
  const questions = [
    makeQuestion({ id: "domain-a", domain: "operations", tags: ["ops"] }),
    makeQuestion({ id: "domain-b", domain: "operations", tags: ["ops"] }),
    makeQuestion({ id: "domain-c", domain: "access_security", tags: ["iam"] })
  ];
  const session = makeSession(questions, {
    "domain-a": ["a"],
    "domain-b": ["b"],
    "domain-c": ["a"]
  });
  const score = scoreExamSession(session, questions, "2026-01-01T12:00:00.000Z");

  assert.equal(score.domainScores.find((item) => item.domain === "operations")?.percent, 50);
  assert.equal(score.domainScores.find((item) => item.domain === "access_security")?.percent, 100);
  assert.equal(score.tagScores.find((item) => item.tag === "ops")?.percent, 50);
  assert.deepEqual(score.flaggedQuestionIds, ["domain-a"]);
});
