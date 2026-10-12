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
  assert.deepEqual(fixture.previews[0]?.feedback.sources, [
    { host: "www.anthropic.com", url: "https://www.anthropic.com/engineering/building-effective-agents", role: "documentation" },
    {
      host: "anthropic-partners.skilljar.com",
      url: "https://anthropic-partners.skilljar.com/path/claude-certified-architect-professional/claude-platform-solution-design",
      role: "course",
      title: "Module 1 · Claude Platform & Solution Design: Architect",
      section: "M1-S10 · Decompose the request",
      requiresAccount: true,
    },
  ]);
  assert.deepEqual(fixture.previews[1]?.feedback.sources, [
    { host: "platform.claude.com", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview", role: "documentation" },
    {
      host: "anthropic-partners.skilljar.com",
      url: "https://anthropic-partners.skilljar.com/path/claude-certified-architect-professional/enterprise-integration-production",
      role: "course",
      title: "Enterprise Integration & Production: Architect Module 2",
      section: "M2-S02 · Evals as acceptance criteria: building quality into the build process",
      requiresAccount: true,
    },
  ]);
});

test("fixture construction uses canonical runtime methods and has no persistence path", () => {
  const source = readFileSync("src/testing/certificationPracticeAnswerFixture.ts", "utf8");
  assert.match(source, /createCanonicalTrainingFamilyRuntime\(track\)/);
  assert.match(source, /runtime\.validateResume/);
  assert.match(source, /runtime\.submitPractice/);
  assert.match(source, /runtime\.finalizePractice/);
  assert.match(source, /projectCertificationPracticeFeedback\("afterEachAnswer", submission\.attempt, exact\)/);
  assert.match(source, /source projector[\s\S]*in-memory course-backed question/);
  assert.doesNotMatch(source, /content\/generated\/canonical-content\/claude-certified-architect-professional-certification\.json/);
  assert.doesNotMatch(source, /storage\/repositories|TrainingMutationCoordinator|installTrainingLifecycleUseCases|MMKV|SecureStore|Firebase/);
});
