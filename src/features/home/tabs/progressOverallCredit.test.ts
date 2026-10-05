import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import type { TrainingAttempt } from "../../../domain";
import { buildProgressTabModel } from "./progressTabModel";

function attempt(trackId: string, contentVersion: string, artifactSha256: string, questionId: string, index: number, kind: "correct" | "partial"): TrainingAttempt {
  const item = { trackId, contentVersion, artifactSha256, questionId };
  const score = { kind, earnedPoints: kind === "correct" ? 1 : 0.5, maxPoints: 1 } as const;
  const at = new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString();
  return {
    id: `overall-credit:${trackId}:${index}`,
    sessionId: `overall-credit-session:${trackId}`,
    trackId: trackId as TrainingAttempt["trackId"],
    modeId: "practice",
    occurrenceId: `overall-credit-occurrence:${index}`,
    item,
    response: {},
    result: score,
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: at,
    committedAt: at,
  } as TrainingAttempt;
}

test("progress areas and Coding effectiveness exclude raw partial points from overall credit", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const design = contentPackageRuntimeOwner.getPreparedDiscovery("frontend-system-design-interview").track;
  const designQuestion = design.questions[0]!;
  const designAttempts = [
    attempt(design.trackId, design.contentVersion, design.artifactSha256, designQuestion.questionId, 1, "correct"),
    attempt(design.trackId, design.contentVersion, design.artifactSha256, designQuestion.questionId, 2, "partial"),
  ];
  const areaModel = buildProgressTabModel({
    activeTrackId: design.trackId,
    analytics: {} as never,
    attempts: [],
    activityRecords: [],
    practiceHistory: [],
    trainingAttempts: designAttempts,
    now: "2026-01-01T01:00:00.000Z",
  });
  const area = areaModel.performanceScores[0];
  assert.ok(area);
  assert.equal(area.correct, 1);
  assert.equal(area.total, 2);
  assert.equal(area.detail, "1/2 points");
  assert.equal(area.percent, 50);

  const coding = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const codingQuestion = coding.questions[0]!;
  const codingAttempts = Array.from({ length: 20 }, (_, index) => attempt(
    coding.trackId,
    coding.contentVersion,
    coding.artifactSha256,
    codingQuestion.questionId,
    index,
    index < 10 ? "partial" : "correct",
  ));
  const codingModel = buildProgressTabModel({
    activeTrackId: "coding-interview-dsa-problem-solving",
    analytics: {} as never,
    attempts: [],
    activityRecords: [],
    practiceHistory: [],
    trainingAttempts: codingAttempts,
    now: "2026-01-01T01:00:00.000Z",
  });
  assert.equal(codingModel.algorithmsProgress?.evidenceSummary.currentFocus.percent, 50);
});
