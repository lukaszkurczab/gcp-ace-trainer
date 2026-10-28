import assert from "node:assert/strict";
import test from "node:test";
import { installMemoryStorage, session as oldSession, timestamp } from "../../testing/journalTestSupport";
import { setActiveProfileLeaseForTests, captureActiveProfileStorageLease } from "../../infrastructure/storage/mmkvClient";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createCanonicalTrainingFamilyRuntime } from "../canonicalTrainingFamilyComposition";
import { buildTrainingSessionStartJournal, commitTrainingSessionStart } from "../learningMutations/commitTrainingSessionStart";
import { installPersist13StartPauseHook } from "./persist13ResetPauseHook";
import { bootstrapApplication } from "../bootstrap/applicationBootstrap";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getTrainingLifecycleUseCases } from "../trainingLifecycle/applicationLifecycle";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { provisionGuestInstallation, getActiveMutationJournal, getTrainingSessions, getTrainingAttempts, getReviewQueueItems } from "../../storage/repositories";
import { productionLearningDataAdmissionContext as context, productionTrackAdmissionContext as trackContext } from "../tracks/trackAdmissionContext";
import { hashPersist13PhysicalSnapshot, expectedPersist13StartRecoverySnapshot, fixtureStoreIds, assertPersist13StartRecoveryEntry, isPersist13StartCapability, isPersist13StartRecovery, type Persist13StartCapability, type Persist13StartRecovery, persist13FixturePhysicalKey } from "./persist13ResetFixtureProtocol";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../../storage/keys";

const runId = "c81d4a31-e064-4f87-9b41-174d0e3923b3";
const pre = "before_start_journal_write", post = "after_start_journal_durable_before_materialization";
test("legal runtime start recovers through production bootstrap twice; invalid historical fixture rejected before recovery", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("coding-interview-dsa-problem-solving"); const runtime = createCanonicalTrainingFamilyRuntime(track);
  await assert.rejects(runtime.validateResume({ session: { ...oldSession(), modeId: "coding-interview-learn-approach" }, draft: null }));
  const names = ["EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE","EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE","EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO","EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID","EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE"];
  const original = Object.fromEntries(names.map(k => [k, process.env[k]])); const dev = Object.getOwnPropertyDescriptor(globalThis, "__DEV__");
  try {
    for (const stage of [pre, post] as const) {
      const storage = installMemoryStorage(); setActiveProfileLeaseForTests({ id: runId, kind: "guest", accountId: null });
      const identity = { async create() { return { installationId: "fe2f706e-0515-4c23-8d54-0f3a9cb9fa8e", localDatasetId: runId }; } };
      await provisionGuestInstallation(identity);
      await contentPackageRuntimeOwner.verifyBundledPackages();
      const resolved = await contentPackageRuntimeOwner.resolveForPreparation({ trackId: track.trackId, familyId: "coding_interview", modeId: "coding-interview-learn-approach" });
      const prepared = await resolved.runtime.prepare({ trackId: track.trackId, modeId: "coding-interview-learn-approach", request: { sessionId: `legal-${stage}`, requestedLength: 10 }, attempts: [], reviews: [], now: timestamp });
      await resolved.runtime.validateResume(prepared); assert.equal(prepared.session.actualLength, 10); assert.equal(prepared.session.configurationSnapshot.timer, "elapsedForeground");
      const input = { ...prepared, createdAt: timestamp }; const plan = await buildTrainingSessionStartJournal(input);
      const snapshot = () => hashPersist13PhysicalSnapshot([...storage.getAllKeys()].map(key => [persist13FixturePhysicalKey(runId, key), storage.getString(key)] as const).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0), sha256Utf8);
      const baseline = snapshot();
      Object.defineProperty(globalThis, "__DEV__", { configurable: true, value: true });
      Object.assign(process.env, { EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke", EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: "seed", EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO: "start_cutpoint", EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID: runId, EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE: stage });
      installPersist13StartPauseHook({ commandFingerprint: plan.commandIdentity.fingerprint, planFingerprint: plan.planFingerprint, lease: captureActiveProfileStorageLease()! }, stage, async () => { throw Error("paused"); });
      await assert.rejects(commitTrainingSessionStart(input));
      const before = snapshot(); const j = await getActiveMutationJournal(context);
      const expected = expectedPersist13StartRecoverySnapshot(before, runId, j);
      const capability: Persist13StartCapability = { schema: "patternly:persist13-start-capability.v2", resumeValidated: true, requestedLength: 10, runId, stage, ...fixtureStoreIds(runId), profile: { id: runId, kind: "guest", accountId: null }, leaseGeneration: 2, commandFingerprint: plan.commandIdentity.fingerprint, planFingerprint: plan.planFingerprint, baseline, sessionIdSha256: sha256Utf8(prepared.session.id), capability: "production_start_commit_raw_mmkv", recoveryRun: false, phase: "paused", journalStatus: j ? "journal_durable" : "absent", journalSha256: j ? sha256Utf8(JSON.stringify(j)) : null, after: before, changedPhysicalKeys: j ? [persist13FixturePhysicalKey(runId, STORAGE_KEYS.ACTIVE_JOURNAL)] : [], targetsAbsent: true, callbackPending: true };
      assert.equal(isPersist13StartCapability(capability, runId, stage), true);
      assert.throws(() => assertPersist13StartRecoveryEntry({ ...capability, schema: "patternly:persist13-start-capability.v1" }, null, before, runId, stage), /version_or_scope/u);
      assert.throws(() => assertPersist13StartRecoveryEntry(capability, null, [], runId, stage), /snapshot_mismatch/u);
      assert.throws(() => assertPersist13StartRecoveryEntry({ ...capability, extra: true }, null, before, runId, stage), /version_or_scope/u);
      const evidence: Persist13StartRecovery = { schema: "patternly:persist13-start-recovery.v1", runId, stage, phase: "prepared", commandFingerprint: plan.commandIdentity.fingerprint, planFingerprint: plan.planFingerprint, before, expectedAfter: expected, firstAfter: null, secondAfter: null };
      assert.equal(isPersist13StartRecovery(evidence, capability), true);
      assert.throws(() => assertPersist13StartRecoveryEntry(capability, evidence, before, runId, stage), /evidence_unresolved/u);
      for (let pass = 0; pass < 2; pass++) {
        const boot = await bootstrapApplication(() => contentPackageRuntimeOwner.verifyBundledPackages(), async id => {
          const active = await getTrainingLifecycleUseCases().resumeActiveSession(); assert.equal(active.id, id);
          await getForegroundSessionTimerFacade().restoreForResume(active);
        }, async () => { composeTrainingLifecycleUseCases({ packages: contentPackageRuntimeOwner }); }, { repositories: { guestInstallationIdentity: identity } });
        assert.equal(boot.kind, "ready", JSON.stringify(boot)); assert.deepEqual(snapshot(), expected); assert.equal(await getActiveMutationJournal(context), null);
        assert.equal((await getTrainingSessions(trackContext)).value.length, stage === post ? 1 : 0);
        assert.equal((await getTrainingAttempts(trackContext)).value.length, 0); assert.equal((await getReviewQueueItems(trackContext)).value.length, 0);
      }
      const first: Persist13StartRecovery = { ...evidence, phase: "boot1_complete", firstAfter: expected };
      const secondPrepared: Persist13StartRecovery = { ...first, phase: "prepared" };
      assert.equal(isPersist13StartRecovery(secondPrepared, capability), true);
      assert.throws(() => assertPersist13StartRecoveryEntry(capability, secondPrepared, expected, runId, stage), /evidence_unresolved/u);
      assert.equal(isPersist13StartRecovery(first, capability), true); assert.doesNotThrow(() => assertPersist13StartRecoveryEntry(capability, first, expected, runId, stage));
      assert.equal(isPersist13StartRecovery({ ...first, phase: "complete", secondAfter: expected }, capability), true);
      assert.equal(isPersist13StartRecovery({ ...first, phase: "complete", secondAfter: [] }, capability), false);
    }
  } finally { if (dev) Object.defineProperty(globalThis, "__DEV__", dev); else Reflect.deleteProperty(globalThis, "__DEV__"); for (const [key, value] of Object.entries(original)) if (value === undefined) delete process.env[key]; else process.env[key] = value; }
});
