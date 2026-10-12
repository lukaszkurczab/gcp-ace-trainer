import assert from "node:assert/strict";
import test from "node:test";
import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import { createTrainingAttempt, type ReviewQueueEntry, type TrainingAttempt } from "../../../domain";
import { buildProgressTabModel } from "./progressTabModel";

type Track = ReturnType<typeof contentPackageRuntimeOwner.getPreparedDiscovery>["track"];
function attempt(track: Track, questionId: string, index: number, kind: "correct" | "partial" | "incorrect" = "correct"): TrainingAttempt {
  const item = { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionId };
  return createTrainingAttempt({ id: `projection:${String(index).padStart(4, "0")}`, sessionId: "projection-session", trackId: track.trackId as TrainingAttempt["trackId"], modeId: "practice", occurrenceId: `projection-occurrence:${index}`, item, response: {}, result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-01-01T00:00:00.000Z", committedAt: "2026-01-01T00:00:00.000Z" });
}
function build(track: Track, trainingAttempts: readonly TrainingAttempt[]) {
  return buildProgressTabModel({ activeTrackId: track.trackId, analytics: {} as never, attempts: [], practiceHistory: [], activityRecords: [], trainingAttempts, now: "2026-01-15T00:00:00.000Z", timezone: "UTC" });
}

test("Progress preserves chronological ID ties, per-node windows and global interleaved trend without mutating history", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const first = track.questions[0]!;
  const other = track.questions.find((question) => question.nodeId !== first.nodeId)!;
  assert.ok(other);
  const history = Object.freeze(Array.from({ length: 30 }, (_, i) => [attempt(track, first.questionId, i * 2, i < 15 ? "partial" : "correct"), attempt(track, other.questionId, i * 2 + 1, "incorrect")]).flat().reverse());
  const before = JSON.stringify(history);
  const model = build(track, history);
  assert.deepEqual(model, build(track, [...history].reverse()));
  const progress = model.algorithmsProgress!;
  assert.equal(progress.currentFocus.nodeId, first.nodeId);
  assert.equal(progress.evidenceSummary.currentFocus.percent, 75);
  assert.equal(progress.evidenceSummary.currentFocus.responseCount, 20);
  assert.deepEqual(progress.effectivenessTrend.points, [0, 50, 50, 50]);
  assert.equal(progress.effectivenessTrend.responseCount, 40);
  assert.equal(progress.trackNodes.find((node) => node.id === other.nodeId)?.effectivenessPercent, 0);
  assert.equal(JSON.stringify(history), before);
});

test("Progress excludes other tracks, stale versions/hashes and absent questions in both affected branches", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const coding = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const design = contentPackageRuntimeOwner.getPreparedDiscovery("frontend-system-design-interview").track;
  for (const track of [coding, design]) {
    const good = attempt(track, track.questions[0]!.questionId, 0);
    const foreign = attempt(track === coding ? design : coding, (track === coding ? design : coding).questions[0]!.questionId, 1);
    const staleVersion = { ...good, id: "stale-version", item: { ...good.item, contentVersion: "old-content" } };
    const staleHash = { ...good, id: "stale-hash", item: { ...good.item, artifactSha256: "f".repeat(64) } };
    const absent = { ...good, id: "absent-question", item: { ...good.item, questionId: "not-in-this-package" } };
    assert.deepEqual(build(track, [absent, staleHash, foreign, staleVersion, good]), build(track, [good]));
  }
});

test("unscored attempts count for practiced coverage but never dilute scored evidence windows", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const question = track.questions[0]!;
  const scored = Array.from({ length: 20 }, (_, i) => attempt(track, question.questionId, i, i < 10 ? "partial" : "correct"));
  const unscored = { ...attempt(track, question.questionId, 21), result: { kind: "correct" as const, earnedPoints: 0, maxPoints: 0 } };
  const before = build(track, scored).algorithmsProgress!;
  const after = build(track, [unscored, ...scored]).algorithmsProgress!;
  assert.deepEqual(after.evidenceSummary, before.evidenceSummary);
  assert.deepEqual(after.effectivenessTrend, before.effectivenessTrend);
  assert.deepEqual(after.trackNodes, before.trackNodes);
  assert.equal(after.diagnostics.outcomeSummary.find((fact) => fact.label === "Correct")?.value, 11);
});

test("due, repeated-mistake, completed and future-manual reviews preserve node attention and due-first action", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const first = track.questions[0]!;
  const other = track.questions.find((question) => question.nodeId !== first.nodeId)!;
  const entry = (id: string, questionId: string): ReviewQueueEntry => ({
    id, trackId: track.trackId as ReviewQueueEntry["trackId"], sourceAttemptId: `source:${id}`, sourceSessionId: "projection-session", sourceItem: { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionId }, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: "2026-01-01T00:00:00.000Z", createdAt: "2025-12-25T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: false, policyVersion: "bizq04-v1", stage: "retention7", status: "active",
  });
  const model = buildProgressTabModel({ activeTrackId: track.trackId, analytics: {} as never, attempts: [], practiceHistory: [], activityRecords: [], trainingAttempts: [], now: "2026-01-15T00:00:00.000Z", timezone: "UTC", reviewQueueItems: [
    entry("due", first.questionId),
    { ...entry("repeated", other.questionId), reasons: ["repeated_mistake"] },
    { ...entry("completed", first.questionId), status: "completed", completedAt: "2026-01-02T00:00:00.000Z", completedByAttemptId: "completed-by" },
    { ...entry("manual", other.questionId), dueAt: "2026-02-01T00:00:00.000Z", reasons: ["scheduled_retrieval", "manual_mark"], manualRequestId: `manual:${"a".repeat(64)}` },
  ] });
  assert.equal(model.reviewQueueCount, 3);
  assert.deepEqual(model.reviewQueueCopyParams, { dueCount: 2, manualCount: 1 });
  assert.equal(model.algorithmsProgress?.currentFocus.statusLabel, "Needs remediation");
  assert.equal(model.algorithmsProgress?.priority.primaryAction.kind, "practiceSession");
  assert.equal(model.reviewAction?.kind, "practiceSession");
  if (model.reviewAction?.kind === "practiceSession") assert.equal(model.reviewAction.params.reviewSource, "due_queue");
});

test("facts retain their broader identity predicate while evidence and the actionable queue retain exact binding", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const good = attempt(track, track.questions[0]!.questionId, 0);
  // Deliberately inconsistent read-model input to lock existing distinct predicates,
  // not a fixture claimed to be admitted by the persistence/domain contract.
  const mismatched = { ...good, item: { ...good.item, trackId: "frontend-system-design-interview" } };
  const review: ReviewQueueEntry = { id: "broader-facts", trackId: "frontend-system-design-interview", sourceItem: { ...good.item, contentVersion: "other-version" }, sourceAttemptId: "source:broader", sourceSessionId: "session:broader", taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], createdAt: "2025-12-25T00:00:00.000Z", dueAt: "2026-01-01T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: false, status: "active" };
  const model = buildProgressTabModel({ activeTrackId: track.trackId, analytics: {} as never, attempts: [], practiceHistory: [], activityRecords: [], trainingAttempts: [mismatched], reviewQueueItems: [review, { ...review, id: "broader-facts-second" }], now: "2026-01-15T00:00:00.000Z", timezone: "UTC" });
  assert.equal(model.algorithmsProgress?.currentFocus.practicedLabel, `1 of ${track.questions.filter((question) => question.nodeId === track.questions[0]!.nodeId).length}`);
  assert.equal(model.algorithmsProgress?.currentFocus.statusLabel, "Needs remediation");
  assert.equal(model.algorithmsProgress?.evidenceSummary.currentFocus.responseCount, 0);
  assert.equal(model.reviewQueueCount, 0);
  assert.equal(model.reviewActionEnabled, false);
});
