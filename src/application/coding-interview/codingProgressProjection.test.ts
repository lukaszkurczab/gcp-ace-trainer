import assert from "node:assert/strict";
import test from "node:test";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { projectLearningEvidence } from "../learningPlan/learningEvidenceProjection";
import type { ReviewQueueEntry } from "../../domain";
import { projectCodingProgress } from "./codingProgressProjection";

test("Coding Progress resolves each legacy due review once across the full roadmap", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const questions = [...new Map(track.questions.map(question => [question.nodeId, question])).values()];
  assert.ok(questions.length > 1);
  const now = "2026-11-02T12:00:00.000Z";
  const reviews: readonly ReviewQueueEntry[] = Object.freeze(Array.from({ length: 1_000 }, (_, index) => {
    const question = questions[index % questions.length]!;
    return Object.freeze({
      id: `progress-review:${index}`, trackId: track.trackId,
      sourceAttemptId: `attempt:${index}`, sourceSessionId: "progress-session",
      sourceItem: Object.freeze({ trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionId: question.questionId }),
      taxonomyOrSkillRefs: Object.freeze([]), reasons: Object.freeze(["repeated_mistake" as const]),
      createdAt: "2026-11-01T00:00:00.000Z", dueAt: "2026-11-02T00:00:00.000Z",
      consecutiveAfterDueSuccesses: 0, persistent: true, policyVersion: "bizq04-v1" as const,
      stage: "retention7" as const, status: "active" as const,
    });
  }));
  const evidence = projectLearningEvidence({ profile: track, attempts: [], reviews, now });
  const before = JSON.stringify(evidence);
  let questionLookups = 0;
  const model = projectCodingProgress({ ...track, getQuestion(questionId) {
    questionLookups++;
    return track.getQuestion(questionId);
  } }, evidence, now);

  assert.equal(model.reviewQueueCount, reviews.length);
  assert.equal(model.algorithmsProgress?.currentFocus.statusLabel, "Needs remediation");
  assert.equal(model.reviewAction?.kind, "practiceSession");
  if (model.reviewAction?.kind === "practiceSession") assert.equal(model.reviewAction.params.reviewSource, "due_queue");
  assert.equal(model.algorithmsProgress?.roadmapSummary.allNodes.length, questions.length);
  assert.equal(JSON.stringify(evidence), before, "projection preserves durable evidence");
  assert.equal(questionLookups, reviews.length, "review resolution must scale with reviews, independently of roadmap size");
});
