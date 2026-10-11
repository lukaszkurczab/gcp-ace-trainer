import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSession, createTrainingSessionDraft, getTrackRegistration, initialForegroundTimerForSession, type AcceptedSimulationFinalization, type TrainingSessionDraft } from "../../domain";
import { clearPatternlyLocalHistory } from "../../features/home/localReset";
import { installLearningStateResetBarrier } from "./commitLearningStateReset";
import { STORAGE_KEYS } from "../../storage/keys";
import { CanonicalWriteOutcomeError } from "../../storage/errors";
import {
  activatePreparedProfile,
  closeActiveProfileStorage,
  installKeyValueStorageForTests,
  MemoryKeyValueStorage,
  prepareProfileStorage,
  setActiveProfileLeaseForTests,
  selectPreparedAccountProfile,
  selectPreparedGuestProfile,
  setProfileStoragePreparationFactoryForTests,
} from "../../infrastructure/storage/mmkvClient";
import { openProfileStorageRouter } from "../../infrastructure/storage/profileStorageRouter";
import type { StorageManifestStore } from "../../infrastructure/storage/encryptedStorageBootstrap";
import type { CanonicalWriteAttempt } from "../../storage/repositories/canonicalRecordCodec";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { readTrainingSessionEnvelopeProof } from "../../storage/repositories/trainingSessionRepository";
import { acceptSimulationFinalization, readActiveTrainingSessionDraftStateProof, reconcileAcceptedSimulationFinalization } from "../../storage/repositories/trainingSessionDraftRepository";
import {
  getActiveTrainingSessionDraft,
  captureTrainingSessionDraftLease,
  getReviewQueueItems,
  getTrainingAttempts,
  reconcileTrainingSessionDraftWrite,
  saveTrainingSession,
  saveActiveForegroundTimer,
  saveTrainingSessionDraft as persistTrainingSessionDraft,
} from "../../storage/repositories";
import { acceptSimulationFinalizationForTest, installMemoryStorage, session, timestamp } from "../../testing/journalTestSupport";

installLearningStateResetBarrier(async (reset) => reset());

class DraftRouterControl implements StorageManifestStore {
  readonly values = new Map<string, string>();
  async get(key: string) { return this.values.get(key) ?? null; }
  async set(key: string, value: string) { this.values.set(key, value); }
  async remove(key: string) { this.values.delete(key); }
}

const DRAFT_ROUTER_PROFILE_A = "00000000-0000-4000-8000-000000000081";
const DRAFT_ROUTER_PROFILE_B = "00000000-0000-4000-8000-000000000082";
const DRAFT_ROUTER_INSTALLATION = "00000000-0000-4000-8000-000000000083";
const DRAFT_ROUTER_ACCOUNT = "draft-router-account";

async function installDraftRouterOnProfileA() {
  const base = new MemoryKeyValueStorage();
  const control = new DraftRouterControl();
  let identityIndex = 0;
  const router = await openProfileStorageRouter(base, control, {
    identity: { async create() { return { installationId: DRAFT_ROUTER_INSTALLATION, localDatasetId: [DRAFT_ROUTER_PROFILE_A, DRAFT_ROUTER_PROFILE_B][identityIndex++]! }; } },
  });
  await router.selectAccount(DRAFT_ROUTER_ACCOUNT);
  const accountRouter = await router.refresh();
  setProfileStoragePreparationFactoryForTests(async () => ({ base, router: accountRouter }));
  await prepareProfileStorage();
  const guest = await selectPreparedGuestProfile(DRAFT_ROUTER_PROFILE_A);
  activatePreparedProfile(guest.profile.id, guest.profile.kind);
  return { base, control, profileA: guest.profile };
}

async function activateDraftRouterAccount() {
  closeActiveProfileStorage();
  const selected = await selectPreparedAccountProfile(DRAFT_ROUTER_ACCOUNT);
  activatePreparedProfile(selected.profile.id, selected.profile.kind);
  return selected.profile;
}

async function activateDraftRouterGuest(profileId: string) {
  closeActiveProfileStorage();
  const selected = await selectPreparedGuestProfile(profileId);
  activatePreparedProfile(selected.profile.id, selected.profile.kind);
  return selected.profile;
}

function profileBytes(base: MemoryKeyValueStorage, profileId: string): ReadonlyMap<string, string> {
  const prefix = `patternly:profile:v1:${profileId}:`;
  return new Map([...base.snapshot()].filter(([key]) => key.startsWith(prefix)));
}

function failNextScopedDraftRead(base: MemoryKeyValueStorage, profileId: string): void {
  base.resetCounters();
  base.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: `patternly:profile:v1:${profileId}:${encodeURIComponent(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT)}`, occurrence: 1 });
}

const draftConfiguration = { answerChanges: "untilFinalSubmission", feedbackMode: "atSessionEnd", kind: "coding_interview", submission: "manualOrForegroundTimeout", timer: "countdownForeground" } as const;

async function saveTrainingSessionDraft(draft: TrainingSessionDraft) {
  return persistTrainingSessionDraft(draft, (await getActiveTrainingSessionDraft())?.revision ?? null);
}

test("an occurrence-keyed draft persists, edits, and resumes without learning side effects", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  const first = createTrainingSessionDraft({
    sessionId: active.id,
    trackId: active.trackId,
    responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["a"] } },
    updatedAt: timestamp,
  });
  const persistedFirst = await persistTrainingSessionDraft(first, null);
  const edited = createTrainingSessionDraft({
    ...persistedFirst,
    responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["b"] } },
    updatedAt: "2026-07-15T10:01:00.000Z",
  });
  const persistedEdited = await persistTrainingSessionDraft(edited, persistedFirst.revision);
  await assert.rejects(
    persistTrainingSessionDraft(createTrainingSessionDraft({ ...persistedEdited, responsesByOccurrenceId: {}, updatedAt: persistedEdited.updatedAt }), persistedFirst.revision),
    /expected revision is stale/,
  );

  const resumed = await getActiveTrainingSessionDraft();
  assert.deepEqual(resumed, persistedEdited);
  assert.ok(Object.isFrozen(resumed));
  assert.ok(Object.isFrozen(resumed?.responsesByOccurrenceId["occurrence-1"]));
  const removed = createTrainingSessionDraft({
    ...persistedEdited,
    responsesByOccurrenceId: {},
    updatedAt: "2026-07-15T10:02:00.000Z",
  });
  const persistedRemoved = await persistTrainingSessionDraft(removed, persistedEdited.revision);
  assert.deepEqual(await getActiveTrainingSessionDraft(), persistedRemoved);
  assert.deepEqual((await getTrainingAttempts()).value, []);
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("draft persistence rejects unknown occurrences and mismatched session scope", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  await assert.rejects(saveTrainingSessionDraft(createTrainingSessionDraft({
    sessionId: active.id,
    trackId: active.trackId,
    responsesByOccurrenceId: { "unknown-occurrence": { selectedOptionIds: ["a"] } },
    updatedAt: timestamp,
  })), /outside the active session plan/);
  await assert.rejects(saveTrainingSessionDraft(createTrainingSessionDraft({
    sessionId: "other-session",
    trackId: active.trackId,
    responsesByOccurrenceId: {},
    updatedAt: timestamp,
  })), /does not match the active session/);
});

test("immediate-feedback sessions cannot persist draft responses", async () => {
  installMemoryStorage();
  const active = session();
  await saveTrainingSession(active);
  await assert.rejects(saveTrainingSessionDraft(createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: timestamp })), /does not permit persisted draft/);
});

test("uncertain draft writes reconcile only the exact attempted envelope and original storage owner", async () => {
  class ReadbackBlockedStorage extends MemoryKeyValueStorage {
    blockDraftRead = false;
    setString(key: string, value: string) { super.setString(key, value); if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT) this.blockDraftRead = true; }
    getString(key: string) { if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT && this.blockDraftRead) throw new Error("readback unavailable"); return super.getString(key); }
  }
  const storage = new ReadbackBlockedStorage();
  installKeyValueStorageForTests(storage);
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  const input = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["a"] } }, updatedAt: timestamp });
  let attempt: CanonicalWriteAttempt<TrainingSessionDraft> | undefined;
  await assert.rejects(persistTrainingSessionDraft(input, null), (error: unknown) => {
    assert.ok(error instanceof CanonicalWriteOutcomeError);
    assert.equal(error.outcome.kind, "unknown");
    attempt = error.attempt as CanonicalWriteAttempt<TrainingSessionDraft>;
    return true;
  });
  storage.blockDraftRead = false;
  assert.ok(attempt);
  assert.equal(await reconcileTrainingSessionDraftWrite(attempt), "verified");

  const saved = await getActiveTrainingSessionDraft();
  assert.equal(saved?.revision, 1);
  assert.deepEqual(saved?.responsesByOccurrenceId, input.responsesByOccurrenceId);
  MemoryKeyValueStorage.prototype.setString.call(storage, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 2, payload: saved }));
  assert.equal(await reconcileTrainingSessionDraftWrite(attempt), "conflict", "a payload-identical envelope with a different physical revision is not the attempted write");
});

test("a transient prerequisite read preserves the exact draft command for a safe revision-checked retry", async () => {
  class OneShotDraftReadFailureStorage extends MemoryKeyValueStorage {
    failNextDraftRead = false;
    setString(key: string, value: string) {
      super.setString(key, value);
      if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION) this.failNextDraftRead = true;
    }
    getString(key: string) {
      if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT && this.failNextDraftRead) {
        this.failNextDraftRead = false;
        throw new Error("temporary prerequisite read failure");
      }
      return super.getString(key);
    }
  }
  const storage = new OneShotDraftReadFailureStorage();
  installKeyValueStorageForTests(storage);
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  const input = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["a"] } }, updatedAt: timestamp });

  await assert.rejects(persistTrainingSessionDraft(input, null), (error: unknown) => {
    assert.ok(error instanceof CanonicalWriteOutcomeError);
    assert.equal(error.outcome.kind, "provenNotApplied");
    assert.equal(error.attempt, undefined);
    return true;
  });
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), false);
  const saved = await persistTrainingSessionDraft(input, null);
  assert.equal(saved.revision, 1);
  assert.deepEqual(saved.responsesByOccurrenceId, input.responsesByOccurrenceId);
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("corrupt draft bytes remain blocked instead of becoming a retryable command", async () => {
  const storage = installMemoryStorage();
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  const corrupt = "{";
  storage.setString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, corrupt);
  const input = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: timestamp });
  await assert.rejects(persistTrainingSessionDraft(input, null), (error: unknown) => {
    assert.equal(error instanceof CanonicalWriteOutcomeError, false);
    return true;
  });
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), corrupt);
});

test("a D retry is fenced to its original router profile when another profile has the same session id", async () => {
  const { base, profileA } = await installDraftRouterOnProfileA();
  try {
    const active = { ...session(), id: "same-session-across-profiles", modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
    await saveTrainingSession(active);
    const lease = captureTrainingSessionDraftLease();
    assert.ok(lease);
    const input = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["A-answer"] } }, updatedAt: timestamp });
    failNextScopedDraftRead(base, profileA.id);
    await assert.rejects(persistTrainingSessionDraft(input, null, lease!), (error: unknown) => {
      assert.ok(error instanceof CanonicalWriteOutcomeError);
      assert.equal(error.outcome.kind, "provenNotApplied");
      return true;
    });
    base.setFailurePlan(null);

    const profileB = await activateDraftRouterAccount();
    await saveTrainingSession(active);
    const beforeA = profileBytes(base, profileA.id);
    const beforeB = profileBytes(base, profileB.id);
    base.resetCounters();
    await assert.rejects(persistTrainingSessionDraft(input, null, lease!), /profile lease changed/u);
    assert.equal(base.operations.length, 0, "stale lease rejection happens before any profile preflight read");
    assert.deepEqual(profileBytes(base, profileA.id), beforeA);
    assert.deepEqual(profileBytes(base, profileB.id), beforeB);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("a same-profile generation change rejects an old D retry lease", async () => {
  const { base, control, profileA } = await installDraftRouterOnProfileA();
  try {
    const active = { ...session(), id: "same-session-generation-aba", modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
    await saveTrainingSession(active);
    const oldLease = captureTrainingSessionDraftLease();
    assert.ok(oldLease);
    const input = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["frozen-answer"] } }, updatedAt: timestamp });
    failNextScopedDraftRead(base, profileA.id);
    await assert.rejects(persistTrainingSessionDraft(input, null, oldLease!), (error: unknown) => error instanceof CanonicalWriteOutcomeError && error.outcome.kind === "provenNotApplied");
    base.setFailurePlan(null);

    setProfileStoragePreparationFactoryForTests(async () => {
      const router = await openProfileStorageRouter(base, control, {
        identity: { async create() { return { installationId: DRAFT_ROUTER_INSTALLATION, localDatasetId: profileA.id }; } },
      });
      return { base, router };
    });
    await prepareProfileStorage();
    activatePreparedProfile(profileA.id, profileA.kind);
    const newLease = captureTrainingSessionDraftLease();
    assert.equal(newLease?.profile.id, oldLease!.profile.id);
    assert.notEqual(newLease?.generation, oldLease!.generation);
    const before = profileBytes(base, profileA.id);
    base.resetCounters();
    await assert.rejects(persistTrainingSessionDraft(input, null, oldLease!), /profile lease changed/u);
    assert.equal(base.operations.length, 0);
    assert.deepEqual(profileBytes(base, profileA.id), before);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("a profile switch during the final journal await blocks D before setString", async () => {
  const { base, profileA } = await installDraftRouterOnProfileA();
  try {
    const active = { ...session(), id: "same-session-final-await-switch", modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
    await saveTrainingSession(active);
    const leaseA = captureTrainingSessionDraftLease();
    assert.ok(leaseA);
    const profileB = await activateDraftRouterAccount();
    await saveTrainingSession(active);
    await activateDraftRouterGuest(profileA.id);
    const input = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["frozen-answer"] } }, updatedAt: timestamp });
    const beforeA = profileBytes(base, profileA.id);
    const beforeB = profileBytes(base, profileB.id);
    const journalKey = `patternly:profile:v1:${profileA.id}:${encodeURIComponent(STORAGE_KEYS.ACTIVE_JOURNAL)}`;
    const readString = base.getString.bind(base);
    let journalReads = 0;
    base.getString = (key: string) => {
      const value = readString(key);
      if (key === journalKey && ++journalReads === 2) {
        // This runs in the final getActiveMutationJournal() read, immediately
        // before saveTrainingSessionDraft resumes from its last await.
        installKeyValueStorageForTests(base);
        setActiveProfileLeaseForTests(profileB);
      }
      return value;
    };
    base.resetCounters();
    await assert.rejects(persistTrainingSessionDraft(input, null, leaseA!), /profile lease changed during preflight/u);
    assert.equal(journalReads, 2, "the changed lease was injected during the final journal read");
    assert.equal(base.operations.some((operation) => operation.kind === "write"), false, "no setString occurs after the final-await owner change");
    assert.deepEqual(profileBytes(base, profileA.id), beforeA);
    assert.deepEqual(profileBytes(base, profileB.id), beforeB);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
    installMemoryStorage();
  }
});

test("the unchanged original D lease permits an exact transport-failure retry", async () => {
  const { base, profileA } = await installDraftRouterOnProfileA();
  try {
    const active = { ...session(), id: "same-session-exact-retry", modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
    await saveTrainingSession(active);
    const lease = captureTrainingSessionDraftLease();
    assert.ok(lease);
    const input = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { "occurrence-1": { selectedOptionIds: ["frozen-answer"] } }, updatedAt: timestamp });
    failNextScopedDraftRead(base, profileA.id);
    await assert.rejects(persistTrainingSessionDraft(input, null, lease!), (error: unknown) => error instanceof CanonicalWriteOutcomeError && error.outcome.kind === "provenNotApplied");
    base.setFailurePlan(null);
    const saved = await persistTrainingSessionDraft(input, null, lease!);
    assert.equal(saved.revision, 1);
    assert.deepEqual(saved.responsesByOccurrenceId, input.responsesByOccurrenceId);
  } finally {
    closeActiveProfileStorage();
    setProfileStoragePreparationFactoryForTests(null);
  }
});

test("clear local history removes the resumable draft", async () => {
  installMemoryStorage();
  const active = { ...session(), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  await saveTrainingSessionDraft(createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: timestamp }));
  await clearPatternlyLocalHistory();
  assert.equal(await getActiveTrainingSessionDraft(), null);
});

test("D owner accepts and reads the exact tagged finalization envelope with one revision bump", async () => {
  const storage = installMemoryStorage();
  const active = { ...session("active", "accepted-d-owner-probe"), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
  await saveTrainingSession(active);
  const draft = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: { "occurrence-1": { z: 1, a: 2 } }, updatedAt: timestamp });
  await persistTrainingSessionDraft(draft, null);
  const draftBefore = readActiveTrainingSessionDraftStateProof();
  const sessionBefore = readTrainingSessionEnvelopeProof(active.id);
  assert.ok(draftBefore && !(("kind" in draftBefore.state) && draftBefore.state.kind === "accepted_simulation_finalization"));
  assert.ok(sessionBefore);
  const acceptanceIdentity = {
    sessionId: active.id,
    trackId: active.trackId,
    familyId: getTrackRegistration(active.trackId).familyId,
    trigger: "manual" as const,
    capturedAt: timestamp,
    semanticsVersion: "simulation-finalization-v1" as const,
    sessionRevision: sessionBefore.revision,
    sessionDigest: sessionBefore.digest,
    priorDraftEnvelopeRevision: draftBefore.revision,
    priorDraftEnvelopeDigest: draftBefore.digest,
    reviewProofs: [],
  };
  const accepted: AcceptedSimulationFinalization = {
    kind: "accepted_simulation_finalization", version: 1, responseDraft: draft,
    acceptance: { ...acceptanceIdentity, commandId: sha256Utf8(canonicalSerialize(acceptanceIdentity)) },
  };
  const outcome = await acceptSimulationFinalization(accepted, { revision: draftBefore.revision, digest: draftBefore.digest }, captureTrainingSessionDraftLease(), []);
  assert.equal(outcome.kind, "verified");
  const after = readActiveTrainingSessionDraftStateProof();
  assert.ok(after && "kind" in after.state && after.state.kind === "accepted_simulation_finalization");
  assert.equal(after.revision, draftBefore.revision + 1);
  assert.equal(canonicalSerialize(after.state), canonicalSerialize(accepted));
  assert.equal(await reconcileAcceptedSimulationFinalization(accepted, outcome.attempt), "verified");
  const exactAcceptedBytes = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  assert.ok(exactAcceptedBytes);
  assert.equal(await reconcileAcceptedSimulationFinalization(accepted), "verified", "cold reconciliation verifies the exact accepted envelope");
  MemoryKeyValueStorage.prototype.setString.call(storage, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, JSON.stringify(JSON.parse(exactAcceptedBytes), null, 2));
  assert.equal(await reconcileAcceptedSimulationFinalization(accepted), "conflict", "whitespace-only raw-byte changes do not prove the accepted write");
  const envelope = JSON.parse(exactAcceptedBytes) as Record<string, unknown>;
  const reorderedEnvelope = { payload: envelope.payload, revision: envelope.revision, schemaIdentity: envelope.schemaIdentity };
  MemoryKeyValueStorage.prototype.setString.call(storage, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, JSON.stringify(reorderedEnvelope));
  assert.equal(await reconcileAcceptedSimulationFinalization(accepted), "conflict", "a reordered raw envelope is not the canonical exact accepted-after state");
});

test("ordinary session and timer writers recheck accepted D after their awaited preflight", async () => {
  for (const writer of ["session", "timer"] as const) {
    const storage = installMemoryStorage();
    const active = {
      ...session("active", `accepted-writer-race-${writer}`),
      modeId: "coding-interview-simulation",
      configurationSnapshot: draftConfiguration,
    };
    await saveTrainingSession(active);
    const draft = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: timestamp });
    await persistTrainingSessionDraft(draft, null);
    const timer = initialForegroundTimerForSession(active, getTrackRegistration(active.trackId).familyId);
    assert.ok(timer);
    await saveActiveForegroundTimer(timer, null);

    const plainDraftBytes = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
    assert.ok(plainDraftBytes);
    await acceptSimulationFinalizationForTest(active, draft);
    const acceptedBytes = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
    assert.ok(acceptedBytes && JSON.parse(acceptedBytes).payload.kind === "accepted_simulation_finalization");
    MemoryKeyValueStorage.prototype.setString.call(storage, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, plainDraftBytes);

    const triggerKey = writer === "session" ? STORAGE_KEYS.TRAINING_SESSION_INDEX : STORAGE_KEYS.ACTIVE_TRAINING_SESSION;
    const originalGetString = storage.getString.bind(storage);
    let acceptanceWonDuringAwait = false;
    storage.getString = (key) => {
      if (!acceptanceWonDuringAwait && key === triggerKey) {
        acceptanceWonDuringAwait = true;
        MemoryKeyValueStorage.prototype.setString.call(storage, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, acceptedBytes);
      }
      return originalGetString(key);
    };

    if (writer === "session") {
      const before = storage.snapshot().get(STORAGE_KEYS.trainingSession(active.id));
      await assert.rejects(saveTrainingSession(createTrainingSession({ ...active, activeForegroundMs: active.activeForegroundMs + 1 })), /accepted simulation finalization owns/u);
      assert.equal(storage.snapshot().get(STORAGE_KEYS.trainingSession(active.id)), before, "session bytes remain untouched when acceptance wins during session preflight");
    } else {
      const before = storage.snapshot().get(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
      await assert.rejects(saveActiveForegroundTimer({ ...timer, accumulatedForegroundMs: timer.accumulatedForegroundMs + 1 }, timer.checkpointRevision), /accepted simulation finalization freezes/u);
      assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), before, "timer bytes remain untouched when acceptance wins during timer preflight");
    }
    assert.equal(acceptanceWonDuringAwait, true, `${writer} preflight reached its awaited storage boundary`);
    assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), acceptedBytes, "the accepted wrapper remains exact after the ordinary writer is refused");
  }
});

test("D owner rejects recomputed semantic and source-proof forgeries before changing bytes", async () => {
  for (const forgedField of ["commandId", "responseDraft", "responseEncoding", "sessionDigest", "semanticsVersion"] as const) {
    const storage = installMemoryStorage();
    const active = { ...session("active", `accepted-forgery-${forgedField}`), modeId: "coding-interview-simulation", configurationSnapshot: draftConfiguration };
    await saveTrainingSession(active);
    const draft = createTrainingSessionDraft({ sessionId: active.id, trackId: active.trackId, responsesByOccurrenceId: {}, updatedAt: timestamp });
    await persistTrainingSessionDraft(draft, null);
    const prior = readActiveTrainingSessionDraftStateProof();
    assert.ok(prior && !("kind" in prior.state));
    const priorBytes = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
    assert.ok(priorBytes);
    const accepted = await acceptSimulationFinalizationForTest(active, draft);
    MemoryKeyValueStorage.prototype.setString.call(storage, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, priorBytes);
    let forged: AcceptedSimulationFinalization;
    if (forgedField === "commandId") {
      forged = { ...accepted, acceptance: { ...accepted.acceptance, commandId: "f".repeat(64) } };
    } else if (forgedField === "responseDraft") {
      forged = { ...accepted, responseDraft: createTrainingSessionDraft({ ...accepted.responseDraft, updatedAt: "2026-07-16T10:00:00.000Z" }) };
    } else if (forgedField === "responseEncoding") {
      forged = { ...accepted, responseDraft: { ...accepted.responseDraft, responsesByOccurrenceId: { "occurrence-1": { a: 2, z: 1 } } } };
    } else if (forgedField === "semanticsVersion") {
      forged = { ...accepted, acceptance: { ...accepted.acceptance, semanticsVersion: "simulation-finalization-v2" as AcceptedSimulationFinalization["acceptance"]["semanticsVersion"] } };
    } else {
      const identity = { ...accepted.acceptance, sessionDigest: "a".repeat(64) };
      const { commandId: _oldCommandId, ...preimage } = identity;
      forged = { ...accepted, acceptance: { ...identity, commandId: sha256Utf8(canonicalSerialize(preimage)) } };
    }
    const outcome = await acceptSimulationFinalization(forged, { revision: prior.revision, digest: prior.digest }, captureTrainingSessionDraftLease(), []);
    assert.notEqual(outcome.kind, "verified", `${forgedField} forgery must fail its owner check`);
    assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), priorBytes, `${forgedField} forgery leaves the exact prior D bytes unchanged`);
  }
});
