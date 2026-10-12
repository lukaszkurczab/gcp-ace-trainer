// Actual default reader/codecs over synthetic memory storage, not native MMKV/UI.
// Run: node --import tsx scripts/qa/measureHomePlanSnapshot.ts
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { HomePlanSnapshotReader } from "../../src/application/homePlanSnapshotReader";
import { contentPackageRuntimeOwner } from "../../src/application/contentPackageRuntimeOwner";
import { composeTrainingLifecycleUseCases } from "../../src/application/bootstrap/trainingLifecycleComposition";
import { recommendLearningPlanMode } from "../../src/application/learningPlan/learningPlanModeRecommendation";
import { productionTrackAdmissionContext } from "../../src/application/tracks/trackAdmissionContext";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setActiveProfileLeaseForTests } from "../../src/infrastructure/storage/mmkvClient";
import { acceptedTargetFromGoal, createDefaultGoal, createTrainingAttempt, createTrainingSession, normalizeLearningPlan, type ReviewQueueEntry } from "../../src/domain";
import { createLearningPlanSlotId } from "../../src/domain/learning/slotIdentity";
import { requireGoalPolicy } from "../../src/domain/tracks/trackGoalPolicies";
import { STORAGE_KEYS } from "../../src/storage/keys";
import { writeCanonicalJson } from "../../src/storage/repositories/canonicalRecordCodec";
import { initializeStorageMetadata } from "../../src/storage/repositories/storageMetadataRepository";
import { saveGoalSnapshot } from "../../src/storage/repositories/goalRepository";
import { saveLearningPlanAtomically } from "../../src/storage/repositories/learningPlanRepository";
import { readLearningPlanInputSnapshot } from "../../src/storage/repositories/learningPlanInputSnapshot";

const hash = (value: unknown) => createHash("sha256").update(JSON.stringify(value)).digest("hex");
const trackId = "coding-interview-dsa-problem-solving";
const now = "2026-10-02T12:00:00.000Z";
let stage = "package_admission";
class CountedStorage extends MemoryKeyValueStorage {
  readCount = 0;
  readCharacters = 0;
  override getString(key: string) {
    const value = super.getString(key);
    this.readCount++;
    this.readCharacters += value?.length ?? 0;
    return value;
  }
  resetCounts() { this.readCount = 0; this.readCharacters = 0; }
  snapshotHash() { return hash([...this.getAllKeys()].sort().map(key => [key, super.getString(key)])); }
}
async function main() {
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  const mode = resolved.track.getMode("coding-interview-learn-approach");
  const warmups = 1;
  const samples = 7;
  const results = [];
  for (const count of [100, 1000, 10000]) for (const hasPlan of [false, true]) for (const active of [false, true]) {
    stage = "canonical_fixture";
    const storage = new CountedStorage();
    installKeyValueStorageForTests(storage);
    setActiveProfileLeaseForTests({ id: "perf03-synthetic-profile", kind: "guest", accountId: null });
    initializeStorageMetadata();
    const reviewCount = count === 100 ? 0 : count === 1000 ? 100 : 1000;
    const attempts = Array.from({ length: count }, (_, index) => {
      const question = resolved.track.questions[index % resolved.track.questions.length]!;
      const item = { trackId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, questionId: question.questionId };
      const at = new Date(Date.UTC(2026, 8, 1, 0, 0, index)).toISOString();
      return createTrainingAttempt({ id: `perf03-attempt:${index}`, sessionId: `perf03-history:${Math.floor(index / 10)}`, occurrenceId: `perf03-occurrence:${index}`, trackId, modeId: mode.modeId, item, response: {}, result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 }, reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] }, answeredAt: at, committedAt: at, durationMs: 1000 });
    });
    for (const attempt of attempts) writeCanonicalJson(STORAGE_KEYS.trainingAttempt(attempt.id), attempt);
    writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, attempts.map(attempt => attempt.id));
    const sessions = Array.from({ length: count / 10 }, (_, index) => {
      const group = attempts.slice(index * 10, index * 10 + 10);
      return createTrainingSession({ id: `perf03-history:${index}`, trackId, modeId: mode.modeId, configurationSnapshot: { kind: "practice", mode: mode.modeId }, requestedLength: 10, actualLength: 10, currentItemIndex: 9, itemOrder: group.map(attempt => ({ occurrenceId: attempt.occurrenceId, item: attempt.item })), optionOrderByOccurrence: {}, activeForegroundMs: 10000, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, status: "completed", startedAt: group[0]!.answeredAt, completedAt: group[9]!.answeredAt });
    });
    for (const session of sessions) writeCanonicalJson(STORAGE_KEYS.trainingSession(session.id), session);
    writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, sessions.map(session => session.id));
    const reviews: ReviewQueueEntry[] = attempts.slice(0, reviewCount).map((attempt, index) => ({ id: `perf03-review:${index}`, trackId, sourceAttemptId: attempt.id, sourceSessionId: attempt.sessionId, sourceItem: attempt.item, taxonomyOrSkillRefs: [], reasons: ["scheduled_retrieval"], createdAt: attempt.answeredAt, dueAt: "2026-10-01T12:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: false, policyVersion: "bizq04-v1", stage: "retention7", status: "active" }));
    for (const review of reviews) writeCanonicalJson(STORAGE_KEYS.reviewEntry(review.id), review);
    writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, reviews.map(review => review.id));
    if (active) {
      stage = "production_active_session";
      const lifecycle = composeTrainingLifecycleUseCases({ wallClock: { now: () => now }, sessionIds: { create: async () => "perf03-active" } });
      if (mode.selection.kind !== "node") throw Error("perf03_expected_node_mode");
      await lifecycle.startSession({ trackId, modeId: mode.modeId, request: { nodeId: mode.selection.nodeId, requestedLength: 10 } });
    }
    if (hasPlan) {
      stage = "goal_plan_fixture";
      const policy = requireGoalPolicy(trackId);
      const goal = await saveGoalSnapshot({ ...createDefaultGoal(policy), targetDate: "2026-11-30" }, null, policy);
      const executionPolicy = recommendLearningPlanMode({ binding: resolved.runtime.getPlanningModeBinding(), trackId, modes: resolved.track.modes, sessions: [], dueReviewCount: 0 }).executionPolicy;
      const plan = normalizeLearningPlan({ schemaVersion: 2, planId: "perf03-plan", trackId, goalRevision: goal.revision, status: "accepted", timezone: "UTC", contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, minutesPerStudyDay: 60, executionPolicy, planningPolicyIdentity: resolved.planningPolicyIdentity, acceptedTarget: acceptedTargetFromGoal(goal.record), createdAt: "2026-09-01T12:00:00.000Z", updatedAt: "2026-09-01T12:00:00.000Z", planRevision: 1, commandId: "perf03-plan-command", slots: goal.record.preferredDays.map(day => ({ slotId: createLearningPlanSlotId(`perf03-slot:${day}`), day, localTime: "18:00", sessionLength: executionPolicy.practice.requestedLength })) });
      saveLearningPlanAtomically({ policy, plan, expectedGoalRevision: goal.revision, expectedPlanStorageRevision: null });
    }
    stage = "fixture_readback";
    const inputs = readLearningPlanInputSnapshot(trackId, requireGoalPolicy(trackId), productionTrackAdmissionContext);
    if (inputs.attempts.length !== count || inputs.reviews.length !== reviewCount || inputs.sessions?.length !== sessions.length + Number(active) || Boolean(inputs.activeSession) !== active) throw Error("perf03_fixture_readback_mismatch");
    const inputSha256 = storage.snapshotHash();
    const reader = new HomePlanSnapshotReader();
    const read = () => reader.read({ trackId, now, premiumAccess: "allowed" });
    stage = "default_reader_measurement";
    for (let index = 0; index < warmups; index++) await read();
    const measurements = [];
    let outputSha256: string | undefined;
    for (let index = 0; index < samples; index++) {
      storage.resetCounts();
      const start = performance.now();
      const value = await read();
      const elapsedMs = performance.now() - start;
      if (value.kind !== (hasPlan ? "ready" : "none")) throw Error("perf03_unexpected_outcome");
      const digest = hash(value);
      if (outputSha256 && digest !== outputSha256) throw Error("perf03_unstable_outcome");
      outputSha256 = digest;
      measurements.push({ elapsedMs, reads: storage.readCount, readCharacters: storage.readCharacters });
    }
    if (storage.snapshotHash() !== inputSha256) throw Error("perf03_input_changed");
    const sorted = measurements.map(sample => sample.elapsedMs).sort((a, b) => a - b);
    results.push({ attempts: count, reviews: reviewCount, sessions: sessions.length, hasPlan, active, inputSha256, outputSha256, medianMs: sorted[3], p95Ms: sorted[6], measurements });
  }
  stage = "receipt";
  console.log(JSON.stringify({ schema: "patternly.home-plan-snapshot-measurement.v1", runtime: process.version, sourceSha256: hash(readFileSync("src/application/homePlanSnapshotReader.ts", "utf8")), trackId, contentVersion: resolved.track.contentVersion, artifactSha256: resolved.track.artifactSha256, warmups, samples, results }, null, 2));
}
main().catch(() => { console.error(`home_plan_measurement_failed:${stage}`); process.exitCode = 1; });
