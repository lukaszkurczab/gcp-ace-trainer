import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import { createFamilyEnvelope, createTrainingAttempt, type ReviewQueueEntry, type TrainingAttempt } from "../../../domain";
import { buildProgressTabModel } from "./progressTabModel";

type Track = ReturnType<typeof contentPackageRuntimeOwner.getPreparedDiscovery>["track"];
function attempt(track: Track, questionId: string, index: number, kind: "correct" | "partial" | "incorrect" = "correct"): TrainingAttempt {
  const item = { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionId };
  return createTrainingAttempt({ id: `projection:${String(index).padStart(4, "0")}`, sessionId: "projection-session", trackId: track.trackId as TrainingAttempt["trackId"], modeId: "practice", occurrenceId: `projection-occurrence:${index}`, item, response: {}, result: { kind, earnedPoints: kind === "correct" ? 1 : kind === "partial" ? 0.5 : 0, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: "2026-01-01T00:00:00.000Z", committedAt: "2026-01-01T00:00:00.000Z" });
}
function build(track: Track, trainingAttempts: readonly TrainingAttempt[]) {
  return buildProgressTabModel({ activeTrackId: track.trackId, activityRecords: [], trainingAttempts, reviewQueueItems: [], now: "2026-01-15T00:00:00.000Z", timezone: "UTC" });
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

test("Progress excludes foreign/stale evidence and rejects an absent exact question", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const coding = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const design = contentPackageRuntimeOwner.getPreparedDiscovery("frontend-system-design-interview").track;
  for (const track of [coding, design]) {
    const good = attempt(track, track.questions[0]!.questionId, 0);
    const foreign = attempt(track === coding ? design : coding, (track === coding ? design : coding).questions[0]!.questionId, 1);
    const oldItem = { ...good.item, contentVersion: "old-content" };
    const staleVersion = { ...good, id: "stale-version", item: oldItem, reviewEvidence: { ...good.reviewEvidence, sourceItem: oldItem } };
    const oldHashItem = { ...good.item, artifactSha256: "f".repeat(64) };
    const staleHash = { ...good, id: "stale-hash", item: oldHashItem, reviewEvidence: { ...good.reviewEvidence, sourceItem: oldHashItem } };
    const absentItem = { ...good.item, questionId: "not-in-this-package" };
    const absent = { ...good, id: "absent-question", item: absentItem, reviewEvidence: { ...good.reviewEvidence, sourceItem: absentItem } };
    assert.deepEqual(build(track, [staleHash, foreign, staleVersion, good]), build(track, [good]));
    assert.throws(() => build(track, [absent, good]), /absent from its verified package/);
  }
});

test("invalid zero-point durable attempts block Progress instead of inventing coverage", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const invalid = { ...attempt(track, track.questions[0]!.questionId, 21), result: { kind: "correct" as const, earnedPoints: 0, maxPoints: 0 } };
  assert.throws(() => build(track, [invalid]), /invalid/);
});

test("due, repeated-mistake, completed and future-manual reviews preserve node attention and due-first action", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const first = track.questions[0]!;
  const other = track.questions.find((question) => question.nodeId !== first.nodeId)!;
  const entry = (id: string, questionId: string): ReviewQueueEntry => ({
    id, trackId: track.trackId as ReviewQueueEntry["trackId"], sourceAttemptId: `source:${id}`, sourceSessionId: "projection-session", sourceItem: { trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionId }, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], dueAt: "2026-01-01T00:00:00.000Z", createdAt: "2025-12-25T00:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: false, policyVersion: "bizq04-v1", stage: "retention7", status: "active",
  });
  const model = buildProgressTabModel({ activeTrackId: track.trackId, activityRecords: [], trainingAttempts: [], now: "2026-01-15T00:00:00.000Z", timezone: "UTC", reviewQueueItems: [
    entry("due", first.questionId),
    { ...entry("repeated", other.questionId), reasons: ["repeated_mistake"] },
    { ...entry("completed", first.questionId), status: "completed", completedAt: "2026-01-02T00:00:00.000Z", completedByAttemptId: "completed-by" },
    { ...entry("manual", other.questionId), dueAt: "2026-02-01T00:00:00.000Z", reasons: ["scheduled_retrieval", "manual_mark"], manualRequestId: `manual:${"a".repeat(64)}` },
  ] });
  assert.equal(model.reviewQueueCount, 3);
  assert.deepEqual(model.reviewQueueCopyParams, { dueCount: 2, manualCount: 1 });
  assert.equal(model.algorithmsProgress?.currentFocus.statusLabel, "Review due");
  assert.equal(model.algorithmsProgress?.priority.primaryAction.kind, "practiceSession");
  assert.equal(model.reviewAction?.kind, "practiceSession");
  if (model.reviewAction?.kind === "practiceSession") assert.equal(model.reviewAction.params.reviewSource, "due_queue");
});

test("Progress rejects inconsistent durable track identity rather than showing broader fake coverage", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const good = attempt(track, track.questions[0]!.questionId, 0);
  const mismatched = { ...good, item: { ...good.item, trackId: "frontend-system-design-interview" } };
  assert.throws(() => build(track, [mismatched]), /invalid/);
});


test("Claude Progress counts supported answers as activity without inflating independent performance", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("claude-certified-architect-professional-certification").track;
  const question = track.questions[0]!;
  const independent = attempt(track, question.questionId, 0, "incorrect");
  const base = attempt(track, question.questionId, 1, "correct");
  const supported = createTrainingAttempt({ ...base, reviewEvidence: { ...base.reviewEvidence, evidence: createFamilyEnvelope({ familyId: "certification", details: {
    policyVersion: "claude-case-evidence-v1", caseId: "policy-case", caseVersion: "v1", stepId: "contrast", role: "contrast", assistanceBeforeSubmit: true, priorExposure: "known", revealPolicy: "after_durable_submit",
  } }) } });
  const before = build(track, [independent]);
  const after = build(track, [independent, supported]);
  assert.deepEqual(after.performanceScores, before.performanceScores);
  assert.equal(after.metrics.find(metric => metric.label === "Answered")?.value, 2);
  assert.deepEqual(build(track, [supported]).performanceScores, []);
  const knownIndependent = createTrainingAttempt({ ...supported, reviewEvidence: { ...supported.reviewEvidence, evidence: createFamilyEnvelope({ familyId: "certification", details: { ...supported.reviewEvidence.evidence!.details as Record<string, unknown>, assistanceBeforeSubmit: false } }) } });
  const known = build(track, [independent, knownIndependent]);
  assert.equal(known.performanceScores[0]?.percent, 50);
  assert.equal(known.performanceScores[0]?.total, 2);
});


test("Claude Progress keeps historical due obligations and their exact retained question even when absent from discovery", async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("claude-certified-architect-professional-certification").track;
  const retained = JSON.parse(readFileSync(new URL("../../../content/generated/retained-content/claude-pre-qle-v2.json", import.meta.url), "utf8"));
  const old = retained.artifact.questions.find((q: { questionId: string }) => !track.getQuestion(q.questionId));
  assert.ok(old, "actual retained package has a replaced question absent from discovery");
  const entry: ReviewQueueEntry = { id: "historical-due", trackId: track.trackId as ReviewQueueEntry["trackId"], sourceAttemptId: "historical-attempt", sourceSessionId: "historical-session", sourceItem: { trackId: track.trackId, questionId: old.questionId, contentVersion: retained.lock.contentVersion, artifactSha256: retained.lock.sha256 }, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], createdAt: "2026-01-01T00:00:00.000Z", dueAt: "2026-01-15T00:00:00.000Z", status: "active", consecutiveAfterDueSuccesses: 0, persistent: false, policyVersion: "bizq04-v1", stage: "retention7" };
  const buildReviews = (reviews: readonly ReviewQueueEntry[], now = "2026-01-15T00:00:00.000Z") => buildProgressTabModel({ activeTrackId: track.trackId, activityRecords: [], trainingAttempts: [], reviewQueueItems: reviews, now, timezone: "UTC" });
  const before = JSON.stringify(entry);
  const model = buildReviews([entry]);
  assert.equal(model.reviewQueueCount, 1);
  assert.equal(model.emptyState.reviewAction, true);
  assert.equal(model.emptyState.title, "No performance evidence for this version yet");
  assert.equal(model.emptyState.description, "Earlier activity and reviews remain available.");
  assert.equal(model.reviewAction?.kind, "canonicalReviewQueue");
  assert.equal(model.metrics.find(metric => metric.label === "Due review")?.value, 1);
  const resolved = await contentPackageRuntimeOwner.resolveItem(entry.sourceItem);
  assert.deepEqual(resolved.question.prompt, old.prompt);
  assert.equal(JSON.stringify(entry), before);
  assert.equal(buildReviews([{ ...entry, trackId: "frontend-system-design-interview" }]).reviewQueueCount, 0);
  assert.equal(buildReviews([{ ...entry, sourceItem: { ...entry.sourceItem, trackId: "frontend-system-design-interview" } }]).reviewQueueCount, 0);
  assert.equal(buildReviews([{ ...entry, dueAt: "2026-01-15T01:30:00.000+02:00" }]).reviewQueueCount, 1);
  assert.equal(buildReviews([{ ...entry, dueAt: "2026-01-14T23:30:00.000-02:00" }]).reviewQueueCount, 0);
});
