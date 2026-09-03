import assert from "node:assert/strict";
import test from "node:test";
import { buildCertificationExamSummaries, getCertificationQuestionMaxPoints, scoreCertificationQuestion } from "./";
import { makeCompletedExamProjectionInputs, makeQuestion } from "../../testing/fixtures";

test("Certification single-choice scores correct, incorrect, and unanswered responses", () => {
  const question = makeQuestion();
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["a"] }).kind, "correct");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["b"] }).kind, "incorrect");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: [] }).kind, "incorrect");
});

test("Certification multiple-choice distinguishes exact, proper subset, and wrong-option responses", () => {
  const question = makeQuestion({ type: "multiple", correctOptionIds: ["a", "c"] });
  assert.equal(getCertificationQuestionMaxPoints(question), 2);
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["c", "a"] }).kind, "correct");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["a"] }).kind, "partial");
  assert.equal(scoreCertificationQuestion(question, { kind: "option_selection", selectedOptionIds: ["a", "b"] }).kind, "incorrect");
});

test("exam scoring reports raw count and percentage with unanswered diagnostics and no pass inference", async () => {
  const questions = [makeQuestion({ id: "one" }), makeQuestion({ id: "two" }), makeQuestion({ id: "three" })];
  const { session, attempts, resolveItem } = makeCompletedExamProjectionInputs(questions, { one: ["a"], two: ["b"] });
  const summary = (await buildCertificationExamSummaries([session], attempts, resolveItem))[0]!;
  assert.equal(summary.correctCount, 1);
  assert.equal(summary.questionCount, 3);
  assert.equal(summary.scorePercent, 33);
  assert.deepEqual(summary.unansweredQuestionIds, ["three"]);
  assert.equal("passedTrainingThreshold" in summary, false);
});
