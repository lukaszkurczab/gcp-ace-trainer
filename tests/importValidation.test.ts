import assert from "node:assert/strict";
import test from "node:test";

import { validateQuestionImport } from "../src/features/import/questionImport";
import { makeQuestion } from "./fixtures";

const validQuestion = makeQuestion();

test("rejects invalid JSON and non-array JSON", () => {
  assert.equal(validateQuestionImport("{", [], "append").canImport, false);
  assert.equal(validateQuestionImport("{}", [], "append").parseError, "Top-level JSON value must be an array.");
});

test("rejects required field and enum validation failures", () => {
  const result = validateQuestionImport(
    JSON.stringify([
      {
        id: "",
        domain: "bad",
        difficulty: "bad",
        type: "bad",
        question: "",
        options: [{ id: "a" }],
        correctOptionIds: [],
        explanation: ""
      }
    ]),
    [],
    "append"
  );

  assert.equal(result.canImport, false);
  assert.equal(result.invalidQuestions, 1);
  assert.ok(result.errors.some((error) => error.includes("domain is invalid")));
  assert.ok(result.errors.some((error) => error.includes("difficulty is invalid")));
  assert.ok(result.errors.some((error) => error.includes("type must be single or multiple")));
});

test("rejects bad correct option references and single choice with multiple correct answers", () => {
  const result = validateQuestionImport(
    JSON.stringify([
      {
        ...validQuestion,
        correctOptionIds: ["a", "missing"]
      }
    ]),
    [],
    "append"
  );

  assert.equal(result.canImport, false);
  assert.ok(result.errors.some((error) => error.includes("every correctOptionId")));
  assert.ok(result.errors.some((error) => error.includes("single choice questions")));
});

test("rejects duplicate ids inside import and against existing bank in append mode", () => {
  const duplicateImport = validateQuestionImport(JSON.stringify([validQuestion, validQuestion]), [], "append");
  const duplicateExisting = validateQuestionImport(JSON.stringify([validQuestion]), [validQuestion], "append");
  const replaceExisting = validateQuestionImport(JSON.stringify([validQuestion]), [validQuestion], "replace");

  assert.equal(duplicateImport.canImport, false);
  assert.deepEqual(duplicateImport.duplicateIds, [validQuestion.id]);
  assert.equal(duplicateExisting.canImport, false);
  assert.deepEqual(duplicateExisting.duplicateIds, [validQuestion.id]);
  assert.equal(replaceExisting.canImport, true);
});

test("allows successful append and replace for valid arrays", () => {
  const append = validateQuestionImport(JSON.stringify([validQuestion]), [], "append");
  const replace = validateQuestionImport(JSON.stringify([validQuestion]), [makeQuestion({ id: "old" })], "replace");

  assert.equal(append.canImport, true);
  assert.equal(append.validQuestions, 1);
  assert.equal(replace.canImport, true);
  assert.equal(replace.questions[0]?.id, validQuestion.id);
});
