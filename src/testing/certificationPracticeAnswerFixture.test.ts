import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createCertificationPracticeAnswerFixture } from "./certificationPracticeAnswerFixture";

test("practice answer fixture completes ten canonical submissions with the exact mixed interaction outcomes", async () => {
  const fixture = await createCertificationPracticeAnswerFixture();
  assert.equal(fixture.session.status, "completed");
  assert.equal(fixture.session.actualLength, 10);
  assert.equal(fixture.attempts.length, 10);
  assert.deepEqual(fixture.projection.items.slice(0, 5).map((item) => [item.questionId, item.result]), [
    ["CCARP-D01-O01-boundary", "correct"],
    ["CCARP-D01-O01-diagnosis", "incorrect"],
    ["CCARP-D01-O01-transfer", "correct"],
    ["CCARP-D01-O02-transfer", "partial"],
    ["CCARP-D01-O03-transfer", "incorrect"],
  ]);
  assert.deepEqual(fixture.result.evidence.details, { activeForegroundMs: 0, correctCount: 7, partialCount: 1, incorrectCount: 2, pointsEarned: 15, maxPoints: 22 });
  assert.deepEqual(fixture.previews.map((preview) => preview.feedback.result), ["correct", "incorrect", "correct", "partial", "incorrect"]);
});

test("fixture construction uses canonical runtime methods and has no persistence path", () => {
  const source = readFileSync("src/testing/certificationPracticeAnswerFixture.ts", "utf8");
  assert.match(source, /new CanonicalTrainingRuntime/);
  assert.match(source, /runtime\.validateResume/);
  assert.match(source, /runtime\.submitPractice/);
  assert.match(source, /runtime\.finalizePractice/);
  assert.doesNotMatch(source, /storage\/repositories|TrainingMutationCoordinator|installTrainingLifecycleUseCases|MMKV|SecureStore|Firebase/);
});
