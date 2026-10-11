import assert from "node:assert/strict";
import test from "node:test";

import { createTrainingSessionDraft, type TrainingSessionDraft } from "../../domain";
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
import {
  getActiveTrainingSessionDraft,
  captureTrainingSessionDraftLease,
  getReviewQueueItems,
  getTrainingAttempts,
  reconcileTrainingSessionDraftWrite,
  saveTrainingSession,
  saveTrainingSessionDraft as persistTrainingSessionDraft,
} from "../../storage/repositories";
import { installMemoryStorage, session, timestamp } from "../../testing/journalTestSupport";

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
