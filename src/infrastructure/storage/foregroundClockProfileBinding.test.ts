import { applySynchronousForegroundTimerRaw } from "./foregroundTimerRawCas";
import test from "node:test";
import assert from "node:assert/strict";
import { activatePreparedProfile, applyActiveForegroundTimerRaw, beginProfileTransition, closeActiveProfileStorage, getActiveForegroundClock, getForegroundTimerStorageAuthority, getKeyValueStorage, isProfileTransitionActive, installKeyValueStorageForTests, MemoryKeyValueStorage, onProfileTransitionChanged, prepareProfileStorage, setProfileStoragePreparationFactoryForTests } from "./mmkvClient";
import { foregroundTimerPhysicalKey, openProfileStorageRouter } from "./profileStorageRouter";
import { captureLearningStateResetTargetPlan } from "../../storage/repositories/learningStateResetRepository";
import { STORAGE_KEYS } from "../../storage/keys";
import { createForegroundClockCapability, type BoundForegroundClockDriver, type ForegroundClockScope } from "./foregroundClockCapability";
import { createTrainingSession, initialForegroundTimerForSession } from "../../domain";
import { session as testSession } from "../../testing/journalTestSupport";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { saveTrainingSession } from "../../storage/repositories/trainingSessionRepository";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { bindActiveForegroundTimerClock } from "../../storage/repositories/foregroundTimerRepository";
import { productionTrackAdmissionContext } from "../../application/tracks/trackAdmissionContext";

async function fixture(revokeFails = false, authority: "ios" | "android" = "ios", nativeUnavailable = false, observeArm?: BoundForegroundClockDriver["arm"]) {
  const base = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(base);
  const values = new Map<string, string>();
  const control = { async get(key: string) { return values.get(key) ?? null; }, async set(key: string, value: string) { values.set(key, value); }, async remove(key: string) { values.delete(key); } };
  const router = await openProfileStorageRouter(base, control, { identity: { async create() { return { installationId: "11111111-1111-4111-8111-111111111111", localDatasetId: "22222222-2222-4222-8222-222222222222" }; } } });
  const events: string[] = [];
  let scope: ForegroundClockScope | null = null;
  let grants = 0;
  let runIntent = true;
  const driver: BoundForegroundClockDriver = {
    read: () => base.getString(foregroundTimerPhysicalKey(router.profile.id)),
    apply(_token, before, after) {
      base.applyForegroundTimerRaw(before, after, foregroundTimerPhysicalKey(router.profile.id));
      return after;
    },
    arm(...args) { if (!observeArm) throw new Error("synthetic clock does not model native timing"); observeArm(...args); },
    enter() { throw new Error("synthetic clock does not model native timing"); },
    checkpoint() { throw new Error("synthetic clock does not model native timing"); },
    pause() { throw new Error("synthetic clock does not model native timing"); },
    quiesce() { events.push("quiesce"); runIntent = false; return undefined; },
    elapsed() { throw new Error("synthetic clock does not model native timing"); },
    metrics: () => '{"maxOutstandingMs":0,"maxWriteMs":0,"checkpointCount":0}',
    revoke() { events.push("drain"); if (revokeFails) throw new Error("foreground_clock_write_unknown"); },
  };
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router,
    nativeForegroundClockPlatform: authority,
    claimForegroundClock(candidate: ForegroundClockScope) {
      scope = candidate; grants++;
      if (nativeUnavailable) throw new Error("foreground_clock_native_owner_unavailable");
      return createForegroundClockCapability(driver, "synthetic-token", candidate);
    },
  }));
  const prepared = await prepareProfileStorage();
  activatePreparedProfile(prepared.id, prepared.kind);
  return { base, router, events, scope: () => scope!, grants: () => grants, runIntent: () => runIntent };
}

test("profile publication grants lazily, derives the router T key and drains before transition listeners", async () => {
  const state = await fixture();
  assert.equal(state.grants(), 0);
  applyActiveForegroundTimerRaw(undefined, "synthetic-record");
  assert.equal(state.grants(), 1);
  const capability = getActiveForegroundClock();
  assert.equal(state.scope().physicalKey, foregroundTimerPhysicalKey(state.router.profile.id));
  assert.equal(state.scope().profileId, state.router.profile.id);
  assert.equal(state.scope().isCurrent(), true);
  assert.equal(state.base.getString(state.scope().physicalKey), "synthetic-record");
  const unsubscribe = onProfileTransitionChanged(() => state.events.push("transition-listener"));
  try {
    beginProfileTransition();
    assert.deepEqual(state.events, ["drain", "transition-listener"]);
    assert.equal(state.scope().isCurrent(), false);
    assert.throws(() => capability.read(), /lease_stale/);
    assert.throws(() => applyActiveForegroundTimerRaw("synthetic-record", undefined), /profile_unavailable/);
  } finally { unsubscribe(); closeActiveProfileStorage(); setProfileStoragePreparationFactoryForTests(null); }
});

test("closing a published profile drains before removing its active grant", async () => {
  const state = await fixture();
  const capability = getActiveForegroundClock();
  closeActiveProfileStorage();
  assert.deepEqual(state.events, ["drain"]);
  assert.throws(() => capability.read(), /lease_stale/);
  setProfileStoragePreparationFactoryForTests(null);
});

test("rejected reset validates corrupt evidence before changing native timer intent or bytes", async () => {
  const state = await fixture();
  getActiveForegroundClock();
  getKeyValueStorage().setString(STORAGE_KEYS.TRAINING_SESSION_INDEX, "corrupt-index");
  const before = state.base.snapshot();
  try {
    assert.throws(() => captureLearningStateResetTargetPlan({ isAdmittedTrackId: () => true }));
    assert.deepEqual(state.base.snapshot(), before);
    assert.equal(state.runIntent(), true);
    assert.deepEqual(state.events, []);
  } finally { closeActiveProfileStorage(); setProfileStoragePreparationFactoryForTests(null); }
});

test("Android selects its native scoped owner and cannot fall back to JS CAS", async () => {
  const state = await fixture(false, "android");
  try {
    assert.equal(getForegroundTimerStorageAuthority(), "android-native");
    applyActiveForegroundTimerRaw(undefined, "android-checkpoint");
    assert.equal(state.base.getString(foregroundTimerPhysicalKey(state.router.profile.id)), "android-checkpoint");
    assert.equal(state.grants(), 1);
    assert.equal(getActiveForegroundClock().read(), "android-checkpoint");
  } finally { closeActiveProfileStorage(); setProfileStoragePreparationFactoryForTests(null); }
});

for (const platform of ["android", "ios"] as const) test(`an unavailable ${platform} module leaves native authority and performs no JS write`, async () => {
  const state = await fixture(false, platform, true);
  const before = state.base.snapshot();
  try {
    assert.equal(getForegroundTimerStorageAuthority(), `${platform}-native`);
    assert.throws(() => applyActiveForegroundTimerRaw(undefined, "candidate"), /native_owner_unavailable/);
    assert.equal(getForegroundTimerStorageAuthority(), `${platform}-native`);
    assert.deepEqual(state.base.snapshot(), before);
  } finally { closeActiveProfileStorage(); setProfileStoragePreparationFactoryForTests(null); }
});

test("raw fixture test CAS writes only the profile T key and respects conflict and transition fences", async () => {
  const base = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(base);
  const values = new Map<string, string>();
  const control = { async get(key: string) { return values.get(key) ?? null; }, async set(key: string, value: string) { values.set(key, value); }, async remove(key: string) { values.delete(key); } };
  const router = await openProfileStorageRouter(base, control, { identity: { async create() { return { installationId: "11111111-1111-4111-8111-111111111111", localDatasetId: "22222222-2222-4222-8222-222222222222" }; } } });
  const physicalKey = foregroundTimerPhysicalKey(router.profile.id);
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router,
    foregroundTimerCasForTests: (before, after) => applySynchronousForegroundTimerRaw(base, physicalKey, before, after),
  }));
  const prepared = await prepareProfileStorage();
  activatePreparedProfile(prepared.id, prepared.kind);
  try {
    assert.equal(getForegroundTimerStorageAuthority(), "memory-test");
    const original = base.snapshot();
    applyActiveForegroundTimerRaw(undefined, "fixture-T");
    assert.equal(base.getString(physicalKey), "fixture-T");
    assert.equal(base.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), undefined);
    const expected = new Map(original);
    expected.set(physicalKey, "fixture-T");
    assert.deepEqual(base.snapshot(), expected);
    assert.throws(() => applyActiveForegroundTimerRaw("stale", "other-T"), /foreground_clock_conflict/);
    assert.deepEqual(base.snapshot(), expected);
    applyActiveForegroundTimerRaw("stale", "fixture-T"); // exact-after replay
    assert.deepEqual(base.snapshot(), expected);
    beginProfileTransition();
    assert.throws(() => applyActiveForegroundTimerRaw("fixture-T", undefined), /foreground_clock_profile_unavailable/);
    assert.deepEqual(base.snapshot(), expected);
  } finally { closeActiveProfileStorage(); setProfileStoragePreparationFactoryForTests(null); }
});

// Keep terminal: the unknown fence intentionally cannot be cleared by a new
// preparation factory. Node isolates this synthetic state from other test files.
test("production repository passes the exact admitted countdown duration to the scoped native grant", async () => {
  const arms: Parameters<BoundForegroundClockDriver["arm"]>[] = [];
  const state = await fixture(false, "ios", false, (...args) => arms.push(args));
  try {
    initializeStorageMetadata();
    const session = createTrainingSession({ ...testSession(), modeId: "coding-interview-simulation",
      configurationSnapshot: { kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
        navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 60_000 } });
    await saveTrainingSession(session, productionTrackAdmissionContext);
    writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, initialForegroundTimerForSession(session, "coding_interview"));
    bindActiveForegroundTimerClock(session, productionTrackAdmissionContext);
    assert.equal(arms.length, 1);
    assert.equal(arms[0]![2], "coding_interview");
    assert.equal(arms[0]![3], session.id);
    assert.equal(arms[0]![4], session.trackId);
    assert.equal(arms[0]![5], 60_000);
    assert.equal(arms[0]![1], state.base.getString(foregroundTimerPhysicalKey(state.router.profile.id)));
    const before = state.base.snapshot();
    const invalid = createTrainingSession({ ...session, configurationSnapshot: { ...session.configurationSnapshot, timerDurationMs: 0 } });
    assert.throws(() => bindActiveForegroundTimerClock(invalid, productionTrackAdmissionContext), /countdown_invalid/);
    assert.equal(arms.length, 1);
    assert.deepEqual(state.base.snapshot(), before);
  } finally { closeActiveProfileStorage(); setProfileStoragePreparationFactoryForTests(null); }
});

test("unknown revoke blocks both profile continuation and a second native effect", async () => {
  const state = await fixture(true);
  getActiveForegroundClock();
  assert.throws(() => beginProfileTransition(), /write_unknown/);
  assert.equal(isProfileTransitionActive(), true);
  assert.deepEqual(state.events, ["drain"]);
  assert.throws(() => closeActiveProfileStorage(), /revoke_unknown/);
  assert.throws(() => setProfileStoragePreparationFactoryForTests(null), /revoke_unknown/);
  assert.throws(() => applyActiveForegroundTimerRaw(undefined, "candidate"), /profile_unavailable/);
  assert.deepEqual(state.events, ["drain"]);
});
