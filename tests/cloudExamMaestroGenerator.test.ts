import assert from "node:assert/strict";
import test from "node:test";

import { generateCloudExam, renderCloudExamFlow } from "../scripts/generateCloudExamMaestro";

test("Cloud Exam Maestro generator derives exact immutable selection and legal mixed answers from the pinned artifact", () => {
  const exam = generateCloudExam();
  assert.equal(exam.itemCount, 360);
  assert.equal(exam.actualLength, 50);
  assert.equal(new Set(exam.selection.map((item) => item.itemId)).size, 50);
  assert.equal(exam.selection.filter((item) => item.expectedResult === "correct").length, 25);
  assert.equal(exam.selection.filter((item) => item.expectedResult === "incorrect").length, 25);
  assert.deepEqual(Object.fromEntries(["setup_environment", "planning_implementation", "access_security", "operations"].map((domain) => [domain, exam.selection.filter((item) => item.domain === domain).length])), { setup_environment: 12, planning_implementation: 15, access_security: 13, operations: 10 });
  assert.ok(exam.selection.every((item) => item.selectedOptionIds.length > 0 && item.selectedOptionIds.every((optionId) => item.optionIds.includes(optionId))));
});

test("Cloud Exam Maestro generator uses identity selectors and emits the early, mid, and late recovery form", () => {
  const exam = generateCloudExam();
  for (const checkpoint of [4, 25, 48]) {
    const flow = renderCloudExamFlow(exam, checkpoint);
    assert.match(flow, /patternly:simulation:question:ace-q-\d{4}/);
    assert.match(flow, /patternly:simulation:option:ace-q-\d{4}:[a-z]/);
    assert.match(flow, /patternly:session:counter:certification:cloud-exam-simulation:\[0-9\]\+:ordinal:/);
    assert.equal((flow.match(/- killApp/g) ?? []).length, 1);
    assert.equal((flow.match(/- takeScreenshot: c3-item-/g) ?? []).length, 50);
    assert.doesNotMatch(flow, /(?:point:|text:)/);
  }
});
