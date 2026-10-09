import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const APP_ROOT = fileURLToPath(new URL("../..", import.meta.url));
const BACKEND_ROOT = resolve(process.env.PATTERNLY_BACKEND_ROOT ?? resolve(APP_ROOT, "../patternly-backend"));
const backend = await import(pathToFileURL(resolve(BACKEND_ROOT, "src/modules/users/merge.ts")).href);
const { assertGoalPlanBundles, assertGoalPlanRecordShapes, buildGuestMergePreview, guestMergeSnapshotSchema } = backend;
const require = createRequire(resolve(APP_ROOT, "package.json"));
const {
  acceptedTargetFromGoal,
  createDefaultGoal,
  createLearningPlanSlotId,
} = require(resolve(APP_ROOT, "src/domain/index.ts"));
const { contentPackageRuntimeOwner } = require(resolve(APP_ROOT, "src/application/contentPackageRuntimeOwner.ts"));
const { recommendLearningPlanMode } = require(resolve(APP_ROOT, "src/application/learningPlan/learningPlanModeRecommendation.ts"));
const { commitGoalPlanAcceptance } = require(resolve(APP_ROOT, "src/application/learningMutations/commitGoalPlanAcceptance.ts"));
const { accountDataRecordFingerprint, assertValidAccountDataRecords, buildAccountDataSnapshot } = require(resolve(APP_ROOT, "src/storage/repositories/accountDataRepository.ts"));
const { writeCanonicalJson } = require(resolve(APP_ROOT, "src/storage/repositories/canonicalRecordCodec.ts"));
const { STORAGE_KEYS } = require(resolve(APP_ROOT, "src/storage/keys.ts"));
const {
  MemoryKeyValueStorage,
  activatePreparedProfile,
  closeActiveProfileStorage,
  installKeyValueStorageForTests,
  prepareProfileStorage,
  setProfileStoragePreparationFactoryForTests,
} = require(resolve(APP_ROOT, "src/infrastructure/storage/mmkvClient.ts"));
const { openProfileStorageRouter } = require(resolve(APP_ROOT, "src/infrastructure/storage/profileStorageRouter.ts"));

const trackId = "coding-interview-dsa-problem-solving";
const createdAt = "2026-10-09T12:00:00.000Z";
const installation = {
  installationId: "123e4567-e89b-42d3-a456-426614174000",
  localDatasetId: "123e4567-e89b-42d3-a456-426614174001",
  bindingState: "guest",
  accountId: null,
};
async function installActiveGuestFixtureStorage() {
  closeActiveProfileStorage();
  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  const base = new MemoryKeyValueStorage();
  const controlValues = new Map();
  const control = { async get(key) { return controlValues.get(key) ?? null; }, async set(key, value) { controlValues.set(key, value); }, async remove(key) { controlValues.delete(key); } };
  const identity = { async create() { return { installationId: "00000000-0000-4000-8000-000000000241", localDatasetId: "00000000-0000-4000-8000-000000000242" }; } };
  const router = await openProfileStorageRouter(base, control, { identity });
  const profile = await router.selectGuest();
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router }));
  await prepareProfileStorage();
  activatePreparedProfile(profile.id, profile.kind);
  return profile;
}
function installLegacyFixtureStorage() {
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  writeCanonicalJson(STORAGE_KEYS.GUEST_INSTALLATION, installation);
  return storage;
}
function snapshotForBackend(snapshot) {
  return guestMergeSnapshotSchema.parse({
    guestSnapshotVersion: snapshot.guestSnapshotVersion,
    guestUserId: snapshot.guestUserId,
    activeSession: snapshot.activeSession,
    pendingJournal: snapshot.pendingJournal,
    records: snapshot.records,
  });
}

async function main() {
  const activeProfile = await installActiveGuestFixtureStorage();
  const resolved = await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  assert.ok(resolved.track.trainingIdentity);
  assert.ok(resolved.planningPolicyIdentity);
  assert.ok(resolved.planningPolicy);
  const recommendation = recommendLearningPlanMode({
    familyId: "coding_interview",
    trackId,
    modes: resolved.track.modes,
    sessions: [],
    dueReviewCount: 0,
  });
  assert.ok(recommendation.mode.requestedLengths.includes(recommendation.mode.defaultRequestedLength));
  const goal = createDefaultGoal(trackId);
  const day = goal.preferredDays[0];
  assert.ok(day);
  const committed = await commitGoalPlanAcceptance({
    proposalId: "isolated-sync-contract",
    trackId,
    proposedGoal: goal,
    expectedGoalRevision: null,
    expectedPlanStorageRevision: null,
    identity: "isolated-sync-contract-producer-owner",
    createdAt,
    revalidate() {},
    plan: {
      schemaVersion: 2,
      planId: "isolated-sync-contract-plan",
      trackId,
      goalRevision: 1,
      status: "accepted",
      timezone: "Europe/Warsaw",
      contentVersion: resolved.track.trainingIdentity.contentVersion,
      artifactSha256: resolved.track.trainingIdentity.artifactSha256,
      acceptedTarget: acceptedTargetFromGoal(goal),
      createdAt,
      updatedAt: createdAt,
      planRevision: 1,
      commandId: "isolated-sync-contract-command",
      slots: [{ slotId: createLearningPlanSlotId("isolated-sync-contract-slot"), day, localTime: "18:00", sessionLength: recommendation.mode.defaultRequestedLength }],
      minutesPerStudyDay: 60,
      executionPolicy: recommendation.executionPolicy,
      planningPolicyIdentity: resolved.planningPolicyIdentity,
    },
  });
  assert.equal(committed.plan.plan.schemaVersion, 2);
  assert.equal(committed.plan.plan.contentVersion, resolved.track.trainingIdentity.contentVersion);
  assert.equal(committed.plan.plan.artifactSha256, resolved.track.trainingIdentity.artifactSha256);
  assert.deepEqual(committed.plan.plan.planningPolicyIdentity, resolved.planningPolicyIdentity);
  assert.equal(committed.plan.plan.goalRevision, committed.goal.revision);
  assert.equal(committed.plan.plan.minutesPerStudyDay, 60);
  const snapshot = await buildAccountDataSnapshot();
  assert.equal(snapshot.pendingJournal, false);
  const parsed = snapshotForBackend(snapshot);
  assertGoalPlanRecordShapes(parsed.records);
  assertGoalPlanBundles(parsed.records);
  const backendPreview = buildGuestMergePreview({ accountUserId: "123e4567-e89b-42d3-a456-426614174099", accountSnapshotVersion: 0, guestSnapshot: parsed, remoteRecords: [] });
  assert.equal(backendPreview.plan.localRecordCount, parsed.records.length);
  const goalRecord = parsed.records.find((record) => record.recordType === "goal" && record.trackId === trackId);
  const planRecord = parsed.records.find((record) => record.recordType === "learning_plan" && record.trackId === trackId);
  assert.ok(goalRecord && planRecord);
  const serializedPlan = planRecord.state.plan;
  assert.equal(serializedPlan.schemaVersion, 2);
  assert.equal(serializedPlan.contentVersion, resolved.track.trainingIdentity.contentVersion);
  assert.equal(serializedPlan.artifactSha256, resolved.track.trainingIdentity.artifactSha256);
  assert.deepEqual(serializedPlan.planningPolicyIdentity, resolved.planningPolicyIdentity);
  assert.equal(serializedPlan.goalRevision, goalRecord.state.revision);
  assert.equal(serializedPlan.minutesPerStudyDay, 60);
  assert.deepEqual(serializedPlan.executionPolicy, recommendation.executionPolicy);

  let malformedPolicyRejected = false;
  const malformed = structuredClone(parsed);
  const malformedPlan = malformed.records.find((record) => record.recordType === "learning_plan" && record.trackId === trackId);
  malformedPlan.state.plan.planningPolicyIdentity.policyVersion = "";
  try { assertGoalPlanRecordShapes(guestMergeSnapshotSchema.parse(malformed).records); } catch { malformedPolicyRejected = true; }
  assert.equal(malformedPolicyRejected, true);

  const assertInvalidV2PairRejectedByBothOwners = (mutate) => {
    const malformedPair = structuredClone(parsed);
    const malformedPairPlan = malformedPair.records.find((record) => record.recordType === "learning_plan" && record.trackId === trackId);
    mutate(malformedPair, malformedPairPlan.state.plan);
    const malformedPairGoal = malformedPair.records.find((record) => record.recordType === "goal" && record.trackId === trackId);
    malformedPairGoal.fingerprint = accountDataRecordFingerprint({ recordId: malformedPairGoal.recordId, recordType: malformedPairGoal.recordType, state: malformedPairGoal.state, trackId: malformedPairGoal.trackId });
    malformedPairPlan.fingerprint = accountDataRecordFingerprint({ recordId: malformedPairPlan.recordId, recordType: malformedPairPlan.recordType, state: malformedPairPlan.state, trackId: malformedPairPlan.trackId });
    const malformedPairSnapshot = snapshotForBackend(malformedPair);
    assertGoalPlanRecordShapes(malformedPairSnapshot.records);
    assert.throws(() => assertValidAccountDataRecords(malformedPairSnapshot.records), { code: "account_data_goal_plan_invalid" });
    assert.throws(() => assertGoalPlanBundles(malformedPairSnapshot.records), { message: "goal_plan_bundle_invalid" });
  };
  assertInvalidV2PairRejectedByBothOwners((pair, plan) => { const goal = pair.records.find((record) => record.recordType === "goal" && record.trackId === trackId); goal.state.revision += 1; });
  assertInvalidV2PairRejectedByBothOwners((_pair, plan) => { plan.acceptedTarget = { ...plan.acceptedTarget, targetDate: plan.acceptedTarget.targetDate === null ? "2026-12-31" : null }; });

  let newerGoalRevisionRejected = false;
  const mismatched = structuredClone(parsed);
  const mismatchedPlan = mismatched.records.find((record) => record.recordType === "learning_plan" && record.trackId === trackId);
  mismatchedPlan.state.plan.goalRevision = mismatchedPlan.state.revision + 1;
  const mismatchedParsed = guestMergeSnapshotSchema.parse(mismatched);
  assertGoalPlanRecordShapes(mismatchedParsed.records);
  try { assertGoalPlanBundles(mismatchedParsed.records); } catch { newerGoalRevisionRejected = true; }
  assert.equal(newerGoalRevisionRejected, true);

  installLegacyFixtureStorage();
  const legacyGoal = createDefaultGoal(trackId);
  const goalEnvelope = writeCanonicalJson(STORAGE_KEYS.goal(trackId), legacyGoal, null);
  const legacyPlan = {
    schemaVersion: 1,
    planId: "legacy-v1-plan",
    trackId,
    goalRevision: goalEnvelope.revision,
    status: "accepted",
    timezone: "Europe/Warsaw",
    contentVersion: resolved.track.trainingIdentity.contentVersion,
    artifactSha256: resolved.track.trainingIdentity.artifactSha256,
    acceptedTarget: acceptedTargetFromGoal(legacyGoal),
    createdAt,
    updatedAt: createdAt,
    planRevision: 1,
    commandId: "legacy-v1-command",
    slots: [{ slotId: createLearningPlanSlotId("legacy-v1-slot"), day: legacyGoal.preferredDays[0], localTime: "18:00", sessionLength: recommendation.mode.defaultRequestedLength }],
  };
  writeCanonicalJson(STORAGE_KEYS.learningPlan(trackId), legacyPlan, null);
  const legacySnapshot = snapshotForBackend(await buildAccountDataSnapshot());
  assertGoalPlanRecordShapes(legacySnapshot.records);
  assertGoalPlanBundles(legacySnapshot.records);
  const legacyPreview = buildGuestMergePreview({ accountUserId: "123e4567-e89b-42d3-a456-426614174099", accountSnapshotVersion: 0, guestSnapshot: legacySnapshot, remoteRecords: [] });
  assert.equal(legacyPreview.plan.localRecordCount, legacySnapshot.records.length);
  const legacyRecord = legacySnapshot.records.find((record) => record.recordType === "learning_plan" && record.trackId === trackId);
  assert.equal(legacyRecord?.state.plan.schemaVersion, 1);

  console.log(JSON.stringify({
    stage: "complete",
    appProducer: { atomicCommitGoalPlanAcceptance: true, canonicalPackageOwnerUsed: true, canonicalModeUsed: true, pairRevisionAligned: true },
    snapshot: { recordCount: snapshot.records.length, goalPlanRecordCount: 2, activeSession: snapshot.activeSession, pendingJournal: snapshot.pendingJournal },
    backend: { v2SnapshotAccepted: true, mergePreviewAccepted: true, recordShapeChecks: parsed.records.length, bundleChecks: 1, malformedPolicyRejected, newerGoalRevisionRejected, lowerGoalRevisionRejected: true, targetMismatchRejected: true },
    pins: { trainingPinExact: true, planningPolicyIdentityExact: true, executionPolicyExact: true, budgetExact: true },
    legacy: { v1SnapshotAccepted: true, mergePreviewAccepted: true, goalPlanRecordCount: 2 },
  }));
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
}

main().catch((error) => {
  closeActiveProfileStorage();
  setProfileStoragePreparationFactoryForTests(null);
  console.error(error instanceof Error ? error.stack : "unknown error");
  process.exitCode = 1;
});
