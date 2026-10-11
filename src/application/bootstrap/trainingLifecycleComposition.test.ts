import assert from "node:assert/strict";
import test, { afterEach } from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createTrainingSessionDraft, type TrackId } from "../../domain";
import { bootstrapApplication } from "./applicationBootstrap";
import { DesignInterviewSimulationExpiredError, getDesignInterviewSimulationProjection, getDesignInterviewSimulationResult, openDesignInterviewSimulation, saveDesignInterviewSimulationStage } from "../design-interview/designInterviewSimulationFacade";
import { DesignSimulationDraftDrain } from "../../features/simulation/designSimulationDraftDrain";
import { addReviewQueueItems, addTrainingAttempt, getActiveMutationJournal, getActiveTrainingSession, getActiveTrainingSessionDraft, getReviewQueueItems, getTrainingAttempts, getTrainingSessionResult, getTrainingSessions, provisionGuestInstallation, removeReviewQueueEntry } from "../../storage/repositories";
import { readActiveTrainingSessionDraftStateProof } from "../../storage/repositories/trainingSessionDraftRepository";
import { initializeStorageMetadata } from "../../storage/repositories/storageMetadataRepository";
import { STORAGE_KEYS } from "../../storage/keys";
import {
  captureActiveProfileStorageLease,
  installKeyValueStorageForTests,
  MemoryKeyValueStorage,
  setActiveProfileLeaseForTests,
} from "../../infrastructure/storage/mmkvClient";
import { getForegroundSessionTimerFacade } from "../trainingLifecycle/ForegroundSessionTimerFacade";
import { type ContentPackageRuntimePort } from "../trainingLifecycle/contracts";
import { createAdjustableWallClock, composeTrainingLifecycleUseCases } from "./trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { acceptSimulationFinalizationForTest, attempt as testAttempt, review as testReview } from "../../testing/journalTestSupport";

const PROFILE_A = Object.freeze({ id: "00000000-0000-4000-8000-000000000041", kind: "guest" as const, accountId: null });
const PROFILE_B = Object.freeze({ id: "00000000-0000-4000-8000-000000000042", kind: "guest" as const, accountId: null });
const TRACK_ID = "coding-interview-dsa-problem-solving" as const;
const SIMULATION_PROFILE_ID = "algorithms-interview-simulation-v1";
const DESIGN_TRACK_ID = "object-oriented-design-interview" as TrackId;
const PROBE_BASE_TIME = "2026-10-11T10:00:00.000Z";

afterEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

function composeLifecycle(sessionId: string) {
  return composeTrainingLifecycleUseCases({
    sessionIds: { async create() { return sessionId; } },
    premiumSessionAdmission: { async authorize() { return "allowed"; } },
  });
}

function composeDesignLifecycle(sessionId: string, options: Readonly<{ wallClock?: Readonly<{ now(): string }>; packages?: ContentPackageRuntimePort }> = {}) {
  return composeTrainingLifecycleUseCases({
    ...options,
    sessionIds: { async create() { return sessionId; } },
    premiumSessionAdmission: { async authorize() { return "allowed"; } },
  });
}

async function designProfileId(): Promise<string> {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(DESIGN_TRACK_ID);
  const profile = track.simulationProfiles?.find((candidate) => candidate.modeId === "design-interview-simulation");
  assert.ok(profile);
  return profile.profileId;
}

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (cause: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

function reviewForRef(id: string, item: Readonly<{ trackId: string; questionId: string; contentVersion: string; artifactSha256: string }>, sourceSessionId: string) {
  return { ...testReview(id, `prior-${id}`), trackId: item.trackId as TrackId, sourceSessionId, sourceItem: item };
}

test("real composition retains its opaque D receipt for exact readback reconciliation and isolates it from another lifecycle", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);

  const lifecycle = composeLifecycle("composition-d-receipt");
  const prepared = await lifecycle.startSession({
    trackId: TRACK_ID,
    modeId: "coding-interview-simulation",
    request: { scope: { simulationProfileId: SIMULATION_PROFILE_ID } },
  });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  let savedDraft = await getActiveTrainingSessionDraft();
  assert.ok(savedDraft);
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId);
  assert.ok(question);
  const retryDraft = createTrainingSessionDraft({
    ...savedDraft,
    revision: savedDraft.revision + 1,
    responsesByOccurrenceId: { [prepared.session.itemOrder[0]!.occurrenceId]: question.answer },
    flaggedOccurrenceIds: [prepared.session.itemOrder[0]!.occurrenceId],
    updatedAt: new Date(Date.now() + 1_000).toISOString(),
  });

  const draftRawBeforePrewriteFailure = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  const originalGetString = storage.getString.bind(storage);
  const originalSetString = storage.setString.bind(storage);
  const originalRemove = storage.remove.bind(storage);
  let failDraftRepositoryPreflight = false;
  let postCheckpointDraftReads = 0;
  let failAfterDraftWriteReadback = false;
  let draftWriteAwaitingReadback = false;
  let armPrewriteFaultAfterTimerCheckpoint = false;
  let timerCheckpointJournalCleared = false;
  let prewriteFaultOccurred = false;
  storage.getString = (key) => {
    if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT && draftWriteAwaitingReadback) {
      draftWriteAwaitingReadback = false;
      prewriteFaultOccurred = false;
      throw new Error("injected exact D write readback failure");
    }
    if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT && failDraftRepositoryPreflight) {
      postCheckpointDraftReads += 1;
      // The first D read is the lifecycle guard; the second is the repository's exact prewrite envelope capture.
      if (postCheckpointDraftReads === 2) {
        failDraftRepositoryPreflight = false;
        prewriteFaultOccurred = true;
        throw new Error("injected D repository preflight failure");
      }
    }
    return originalGetString(key);
  };
  storage.setString = (key, value) => {
    originalSetString(key, value);
    if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT && failAfterDraftWriteReadback) {
      failAfterDraftWriteReadback = false;
      draftWriteAwaitingReadback = true;
    }
  };
  storage.remove = (key) => {
    originalRemove(key);
    if (key === STORAGE_KEYS.ACTIVE_JOURNAL && armPrewriteFaultAfterTimerCheckpoint) {
      armPrewriteFaultAfterTimerCheckpoint = false;
      timerCheckpointJournalCleared = true;
      failDraftRepositoryPreflight = true;
    }
  };
  armPrewriteFaultAfterTimerCheckpoint = true;
  await assert.rejects(lifecycle.saveSimulationDraft({ draft: retryDraft, expectedPreviousRevision: savedDraft.revision }), /before it changed/u);
  assert.equal(timerCheckpointJournalCleared, true, "prewrite fault is armed only after the actual timer-checkpoint journal is cleared");
  assert.equal(prewriteFaultOccurred, true, "the injected failure is the next D read before the response draft is written");
  assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), draftRawBeforePrewriteFailure, "preflight failure leaves the exact prior draft bytes untouched");
  const retryable = await lifecycle.getSimulationOperationState(prepared.session);
  assert.equal("error" in retryable ? retryable.error.allowedAction : null, "retry_same_command");
  await lifecycle.retrySimulationDraftSave();
  savedDraft = await getActiveTrainingSessionDraft();
  assert.deepEqual(savedDraft, retryDraft);
  assert.equal(captureActiveProfileStorageLease(), originalLease, "the real-composition retry keeps the exact command-entry lease");

  const attemptedDraft = createTrainingSessionDraft({
    ...savedDraft,
    revision: savedDraft.revision + 1,
    responsesByOccurrenceId: { [prepared.session.itemOrder[0]!.occurrenceId]: question.answer },
    flaggedOccurrenceIds: [],
    updatedAt: new Date(Date.now() + 2_000).toISOString(),
  });

  failAfterDraftWriteReadback = true;
  await assert.rejects(lifecycle.saveSimulationDraft({ draft: attemptedDraft, expectedPreviousRevision: savedDraft.revision }), /result is uncertain/u);

  const unresolved = await lifecycle.getSimulationOperationState(prepared.session);
  assert.equal("error" in unresolved ? unresolved.error.allowedAction : null, "reconcile");
  const durableAfterWriteFault = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  assert.ok(durableAfterWriteFault, "the repository write took effect before readback failed");
  assert.equal(captureActiveProfileStorageLease(), originalLease, "the exact profile lease remains active while the receipt is reconciled");

  const foreignLifecycle = composeLifecycle("composition-foreign-lifecycle");
  assert.equal(await foreignLifecycle.reconcileSimulationDraftSave(prepared.session.id), "unknown", "another composition cannot borrow the original lifecycle's opaque receipt");
  await assert.rejects(foreignLifecycle.retrySimulationDraftSave(), /no exact simulation draft command safe to retry/u);
  assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), durableAfterWriteFault);

  assert.equal(await lifecycle.reconcileSimulationDraftSave(prepared.session.id), "verified");
  assert.deepEqual(await getActiveTrainingSessionDraft(), attemptedDraft);
  assert.equal((await lifecycle.getSimulationOperationState(prepared.session)).kind, "editable");
});

test("a failure before accepted finalization leaves the exact saved response editable", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  initializeStorageMetadata();
  const profileId = await designProfileId();
  let failNextExactResolution = false;
  const packages: ContentPackageRuntimePort = {
    resolveForPreparation: contentPackageRuntimeOwner.resolveForPreparation.bind(contentPackageRuntimeOwner),
    async resolveExactArtifact(input) {
      if (failNextExactResolution) {
        failNextExactResolution = false;
        throw new Error("injected pre-journal exact runtime resolution failure");
      }
      return contentPackageRuntimeOwner.resolveExactArtifact(input);
    },
    resolveForDiscovery: contentPackageRuntimeOwner.resolveForDiscovery.bind(contentPackageRuntimeOwner),
  };
  const wallClock = createAdjustableWallClock(() => PROBE_BASE_TIME);
  const lifecycle = composeDesignLifecycle("persist09-prefreeze-read", { wallClock, packages });
  await contentPackageRuntimeOwner.resolveForDiscovery(DESIGN_TRACK_ID, "design_interview");
  const projection = await openDesignInterviewSimulation({ trackId: DESIGN_TRACK_ID, profileId });
  await saveDesignInterviewSimulationStage("requirements", "Verified durable response before finalization.");
  const draftBefore = await getActiveTrainingSessionDraft();
  assert.ok(draftBefore);
  const before = storage.snapshot();
  const sessionKey = STORAGE_KEYS.trainingSession(projection.session.id);
  const sessionBytesBefore = before.get(sessionKey);
  const pointerBytesBefore = before.get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  const draftBytesBefore = before.get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  assert.ok(sessionBytesBefore);
  assert.ok(pointerBytesBefore);
  assert.ok(draftBytesBefore);
  assert.equal(draftBefore.revision, 2);
  assert.equal(await getActiveMutationJournal(), null);

  failNextExactResolution = true;
  await assert.rejects(lifecycle.finalizeSimulation());
  assert.equal(await getActiveMutationJournal(), null, "the injected failure occurs before any finalization journal is durable");
  assert.deepEqual({
    session: storage.snapshot().get(sessionKey),
    pointer: storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION),
    draft: storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT),
  }, { session: sessionBytesBefore, pointer: pointerBytesBefore, draft: draftBytesBefore });
  const operationImmediatelyAfterFailure = await lifecycle.getSimulationOperationState(projection.session);

  let restored!: ReturnType<typeof composeDesignLifecycle>;
  const bootstrapped = await bootstrapApplication(
    () => contentPackageRuntimeOwner.verifyBundledPackages(),
    async () => { await restored.resumeActiveSession(); },
    async () => { restored = composeDesignLifecycle("persist09-reconstructed", { wallClock, packages }); },
  );
  assert.deepEqual(bootstrapped, { kind: "ready", activeSessionId: projection.session.id });
  const operation = await restored.getSimulationOperationState(projection.session);
  const draftBeforeEdit = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
  const saveAllowed = await saveDesignInterviewSimulationStage("requirements", "Edited after pre-acceptance failure.").then(() => true, () => false);
  assert.deepEqual({
    saveAllowed,
    preBootstrapEditable: operationImmediatelyAfterFailure.kind === "editable",
    reconstructedAsEditable: operation.kind === "editable",
    sessionBytesUnchanged: storage.snapshot().get(sessionKey) === sessionBytesBefore,
    pointerBytesUnchanged: storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION) === pointerBytesBefore,
    draftWasStillPlainEditableRecord: Boolean(draftBeforeEdit && !JSON.parse(draftBeforeEdit).payload.kind),
    journalAbsent: await getActiveMutationJournal() === null,
  }, {
    saveAllowed: true,
    preBootstrapEditable: true,
    reconstructedAsEditable: true,
    sessionBytesUnchanged: true,
    pointerBytesUnchanged: true,
    draftWasStillPlainEditableRecord: true,
    journalAbsent: true,
  }, "pre-acceptance preparation failure must not masquerade as an accepted frozen command");
  assert.notEqual(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), draftBytesBefore, "the ordinary save is available after a pre-acceptance failure");
});

test("a failure after accepted D finalization remains frozen and production bootstrap completes the exact command", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  initializeStorageMetadata();
  const profileId = await designProfileId();
  let failAcceptedResumeOnce = true;
  const packages: ContentPackageRuntimePort = {
    resolveForPreparation: contentPackageRuntimeOwner.resolveForPreparation.bind(contentPackageRuntimeOwner),
    async resolveExactArtifact(input) {
      const resolved = await contentPackageRuntimeOwner.resolveExactArtifact(input);
      return {
        ...resolved,
        runtime: new Proxy(resolved.runtime, {
          get(target, property, receiver) {
            if (property === "validateResume") {
              return async (value: Parameters<typeof target.validateResume>[0]) => {
                const proof = readActiveTrainingSessionDraftStateProof();
                if (failAcceptedResumeOnce && proof && "kind" in proof.state && proof.state.kind === "accepted_simulation_finalization") {
                  failAcceptedResumeOnce = false;
                  throw new Error("injected post-acceptance runtime verification failure");
                }
                return target.validateResume(value);
              };
            }
            return Reflect.get(target, property, receiver) as unknown;
          },
        }),
      };
    },
    resolveForDiscovery: contentPackageRuntimeOwner.resolveForDiscovery.bind(contentPackageRuntimeOwner),
  };
  const wallClock = createAdjustableWallClock(() => PROBE_BASE_TIME);
  const lifecycle = composeDesignLifecycle("persist09-postaccept", { wallClock, packages });
  await contentPackageRuntimeOwner.resolveForDiscovery(DESIGN_TRACK_ID, "design_interview");
  const projection = await openDesignInterviewSimulation({ trackId: DESIGN_TRACK_ID, profileId });
  await saveDesignInterviewSimulationStage("requirements", "Verified durable response accepted before recovery.");
  const sessionKey = STORAGE_KEYS.trainingSession(projection.session.id);
  const sessionBytesBefore = storage.snapshot().get(sessionKey);
  const pointerBytesBefore = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  const draftBefore = await getActiveTrainingSessionDraft();
  assert.ok(sessionBytesBefore && pointerBytesBefore && draftBefore);
  await assert.rejects(lifecycle.finalizeSimulation());
  assert.equal(await getActiveMutationJournal(), null, "the injected error follows D acceptance but precedes journal persistence");
  const acceptedProof = readActiveTrainingSessionDraftStateProof();
  assert.ok(acceptedProof && "kind" in acceptedProof.state && acceptedProof.state.kind === "accepted_simulation_finalization");
  assert.equal(acceptedProof.state.acceptance.sessionId, projection.session.id);
  assert.equal(storage.snapshot().get(sessionKey), sessionBytesBefore);
  assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), pointerBytesBefore);
  const operationImmediatelyAfterFailure = await lifecycle.getSimulationOperationState(projection.session);
  assert.notEqual(operationImmediatelyAfterFailure.kind, "editable");
  assert.equal(await saveDesignInterviewSimulationStage("requirements", "Must remain frozen.").then(() => true, () => false), false);

  let restored!: ReturnType<typeof composeDesignLifecycle>;
  const bootstrapped = await bootstrapApplication(
    () => contentPackageRuntimeOwner.verifyBundledPackages(),
    async () => { await restored.resumeActiveSession(); },
    async () => { restored = composeDesignLifecycle("persist09-postaccept-reconstructed", { wallClock, packages }); },
  );
  assert.deepEqual(bootstrapped, { kind: "ready", activeSessionId: null });
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.equal((await getTrainingSessions()).value.find((candidate) => candidate.id === projection.session.id)?.status, "completed");
  assert.ok(await getTrainingSessionResult(projection.session.id));
  assert.equal((await getTrainingAttempts()).value.filter((attempt) => attempt.sessionId === projection.session.id).length, 0);
  assert.equal((await getReviewQueueItems()).value.filter((entry) => entry.sourceSessionId === projection.session.id).length, 0);
});

test("a profile lease generation change during accepted runtime finalization preserves all canonical bytes", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  initializeStorageMetadata();
  const profileId = await designProfileId();
  const runtimeEntered = deferred<void>();
  const releaseRuntime = deferred<void>();
  let holdFinalize = false;
  const packages: ContentPackageRuntimePort = {
    resolveForPreparation: contentPackageRuntimeOwner.resolveForPreparation.bind(contentPackageRuntimeOwner),
    async resolveExactArtifact(input) {
      const resolved = await contentPackageRuntimeOwner.resolveExactArtifact(input);
      return {
        ...resolved,
        runtime: new Proxy(resolved.runtime, {
          get(target, property, receiver) {
            if (property === "finalizeSimulation") {
              return async (value: Parameters<typeof target.finalizeSimulation>[0]) => {
                if (holdFinalize) {
                  holdFinalize = false;
                  runtimeEntered.resolve();
                  await releaseRuntime.promise;
                }
                return target.finalizeSimulation(value);
              };
            }
            return Reflect.get(target, property, receiver) as unknown;
          },
        }),
      };
    },
    resolveForDiscovery: contentPackageRuntimeOwner.resolveForDiscovery.bind(contentPackageRuntimeOwner),
  };
  const lifecycle = composeDesignLifecycle("persist09-lease-race", { wallClock: createAdjustableWallClock(() => PROBE_BASE_TIME), packages });
  await contentPackageRuntimeOwner.resolveForDiscovery(DESIGN_TRACK_ID, "design_interview");
  const projection = await openDesignInterviewSimulation({ trackId: DESIGN_TRACK_ID, profileId });
  await saveDesignInterviewSimulationStage("requirements", "Lease-bound response before finalization.");
  const sessionKey = STORAGE_KEYS.trainingSession(projection.session.id);
  const draftKey = STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT;
  const before = storage.snapshot();
  const sessionBytes = before.get(sessionKey);
  const pointerBytes = before.get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  const draftBytes = before.get(draftKey);
  assert.ok(sessionBytes && pointerBytes && draftBytes);
  assert.equal(await getActiveMutationJournal(), null);

  holdFinalize = true;
  const finalization = lifecycle.finalizeSimulation();
  await runtimeEntered.promise;
  const acceptedBytes = storage.snapshot().get(draftKey);
  assert.ok(acceptedBytes && JSON.parse(acceptedBytes).payload.kind === "accepted_simulation_finalization");
  setActiveProfileLeaseForTests(PROFILE_B);
  setActiveProfileLeaseForTests(PROFILE_A);
  releaseRuntime.resolve();
  await assert.rejects(finalization, /original profile lease changed before finalization/u);

  assert.equal(storage.snapshot().get(sessionKey), sessionBytes, "the stale original generation cannot complete the session");
  assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), pointerBytes, "the active pointer remains byte-identical");
  assert.equal(storage.snapshot().get(draftKey), acceptedBytes, "the exact accepted response remains frozen and unchanged");
  assert.equal(await getActiveMutationJournal(), null, "lease rejection precedes the finalization journal");
  assert.deepEqual((await getTrainingAttempts()).value.filter((attempt) => attempt.sessionId === projection.session.id), []);
  assert.equal((await getTrainingSessions()).value.find((candidate) => candidate.id === projection.session.id)?.status, "active");
});

test("accepted replay blocks scoped review additions, removals, and changes while preserving unrelated A/R", async () => {
  for (const mutation of ["add", "remove", "change"] as const) {
    const storage = new MemoryKeyValueStorage();
    installKeyValueStorageForTests(storage);
    setActiveProfileLeaseForTests(PROFILE_A);
    initializeStorageMetadata();
    const wallClock = createAdjustableWallClock(() => PROBE_BASE_TIME);
    const lifecycle = composeDesignLifecycle(`persist09-review-proof-${mutation}`, { wallClock });
    await contentPackageRuntimeOwner.resolveForDiscovery(DESIGN_TRACK_ID, "design_interview");
    const profileId = await designProfileId();
    const projection = await openDesignInterviewSimulation({ trackId: DESIGN_TRACK_ID, profileId });
    await saveDesignInterviewSimulationStage("requirements", `Scoped review proof ${mutation}.`);
    const contentRef = projection.session.itemOrder[0]!.item;
    const scoped = reviewForRef("persist09-scoped-review", contentRef, projection.session.id);
    const unrelatedRef = { ...contentRef, questionId: `${contentRef.questionId}-unrelated` };
    const unrelated = reviewForRef("persist09-unrelated-review", unrelatedRef, "unrelated-session");
    if (mutation !== "add") await addReviewQueueItems([scoped]);
    await addReviewQueueItems([unrelated]);
    const unrelatedAttempt = testAttempt("persist09-unrelated-attempt", "unrelated-session");
    await addTrainingAttempt(unrelatedAttempt);
    const draft = await getActiveTrainingSessionDraft();
    assert.ok(draft);
    await acceptSimulationFinalizationForTest(projection.session, draft, PROBE_BASE_TIME);
    if (mutation === "add") {
      await addReviewQueueItems([scoped]);
    } else if (mutation === "remove") {
      await removeReviewQueueEntry(scoped.id);
    } else {
      await addReviewQueueItems([{ ...scoped, dueAt: "2026-10-12T10:00:00.000Z" }]);
    }
    const acceptedBytes = storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT);
    const unrelatedReviewBytes = storage.snapshot().get(STORAGE_KEYS.reviewEntry(unrelated.id));
    const unrelatedAttemptBytes = storage.snapshot().get(STORAGE_KEYS.trainingAttempt(unrelatedAttempt.id));
    const scopedReviewBytes = storage.snapshot().get(STORAGE_KEYS.reviewEntry(scoped.id));

    await assert.rejects(lifecycle.recoverActiveTrainingOperation(), /Review evidence changed after finalization acceptance/u);
    assert.equal(await getActiveMutationJournal(), null, `${mutation} of a scoped review blocks before journaling outcomes`);
    assert.equal(storage.snapshot().get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), acceptedBytes, "the accepted full response wrapper is retained");
    assert.equal(storage.snapshot().get(STORAGE_KEYS.reviewEntry(unrelated.id)), unrelatedReviewBytes, "unrelated R remains byte-identical");
    assert.equal(storage.snapshot().get(STORAGE_KEYS.trainingAttempt(unrelatedAttempt.id)), unrelatedAttemptBytes, "unrelated A remains byte-identical");
    assert.equal(storage.snapshot().get(STORAGE_KEYS.reviewEntry(scoped.id)), scopedReviewBytes, "the intentional scoped review mutation remains untouched by blocked replay");
  }
});

test("an unknown D acceptance retains its receipt across same-process projection and profile away/back", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  initializeStorageMetadata();
  const profileId = await designProfileId();
  const lifecycle = composeDesignLifecycle("persist09-unknown-acceptance");
  await contentPackageRuntimeOwner.resolveForDiscovery(DESIGN_TRACK_ID, "design_interview");
  const projection = await openDesignInterviewSimulation({ trackId: DESIGN_TRACK_ID, profileId });
  await saveDesignInterviewSimulationStage("requirements", "Preserve this response through unknown acceptance.");
  const originalGetString = storage.getString.bind(storage);
  const originalSetString = storage.setString.bind(storage);
  const draftKey = STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT;
  let failDraftReads = 0;
  storage.getString = (key) => {
    if (key === draftKey && failDraftReads > 0) { failDraftReads -= 1; throw new Error("injected accepted-D readback uncertainty"); }
    return originalGetString(key);
  };
  storage.setString = (key, value) => {
    originalSetString(key, value);
    if (key === draftKey) failDraftReads = 2;
  };

  await assert.rejects(lifecycle.finalizeSimulation());
  assert.equal(failDraftReads, 0, "the write readback and immediate exact receipt reconciliation both failed after D changed");
  const acceptedBytes = originalGetString(draftKey);
  assert.ok(acceptedBytes && JSON.parse(acceptedBytes).payload.kind === "accepted_simulation_finalization");
  assert.equal((await lifecycle.getSimulationOperationState(projection.session)).kind, "finalization_journal_failed");
  failDraftReads = 1;
  const retained = await lifecycle.reconstructOperationProjection(projection.session);
  assert.equal(retained.kind, "finalization_journal_failed", "unknown projection is retained without trusting a fresh D read");
  assert.equal(failDraftReads, 1, "reconstruction did not consume the injected D read failure or project editable");

  failDraftReads = 0;
  setActiveProfileLeaseForTests(PROFILE_B);
  setActiveProfileLeaseForTests(PROFILE_A);
  await assert.rejects(lifecycle.recoverActiveTrainingOperation(), /original command and profile lease are retained/u);
  assert.equal(originalGetString(draftKey), acceptedBytes, "the original expired lease cannot rewrite or clear accepted D");
  assert.equal((await lifecycle.getSimulationOperationState(projection.session)).kind, "finalization_journal_failed");

  let restored!: ReturnType<typeof composeDesignLifecycle>;
  const bootstrapped = await bootstrapApplication(
    () => contentPackageRuntimeOwner.verifyBundledPackages(),
    async () => { await restored.resumeActiveSession(); },
    async () => { restored = composeDesignLifecycle("persist09-unknown-fresh-lease"); },
  );
  assert.deepEqual(bootstrapped, { kind: "ready", activeSessionId: null });
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.equal((await getTrainingSessions()).value.find((candidate) => candidate.id === projection.session.id)?.status, "completed");
});

test("Design expiry waits for a pre-deadline draft save and finalizes its verified revision", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  initializeStorageMetadata();
  await provisionGuestInstallation();
  const profileId = await designProfileId();
  const exactResolutionEntered = deferred<void>();
  const releaseExactResolution = deferred<void>();
  let holdNextExactResolution = false;
  let finalizedDraftRevision: number | null = null;
  const packages: ContentPackageRuntimePort = {
    resolveForPreparation: contentPackageRuntimeOwner.resolveForPreparation.bind(contentPackageRuntimeOwner),
    async resolveExactArtifact(input) {
      const resolved = await contentPackageRuntimeOwner.resolveExactArtifact(input);
      if (holdNextExactResolution) {
        holdNextExactResolution = false;
        exactResolutionEntered.resolve();
        await releaseExactResolution.promise;
      }
      return {
        ...resolved,
        runtime: new Proxy(resolved.runtime, {
          get(target, property, receiver) {
            if (property === "finalizeSimulation") {
              return async (input: Parameters<typeof target.finalizeSimulation>[0]) => {
                finalizedDraftRevision = input.draft.revision;
                return target.finalizeSimulation(input);
              };
            }
            return Reflect.get(target, property, receiver) as unknown;
          },
        }),
      };
    },
    resolveForDiscovery: contentPackageRuntimeOwner.resolveForDiscovery.bind(contentPackageRuntimeOwner),
  };
  const wallClock = createAdjustableWallClock(() => PROBE_BASE_TIME);
  const lifecycle = composeDesignLifecycle("persist10-deferred-design-save", { wallClock, packages });
  await contentPackageRuntimeOwner.resolveForDiscovery(DESIGN_TRACK_ID, "design_interview");
  const projection = await openDesignInterviewSimulation({ trackId: DESIGN_TRACK_ID, profileId });
  await saveDesignInterviewSimulationStage("requirements", "Verified before the deadline.");
  const baselineDraft = await getActiveTrainingSessionDraft();
  assert.ok(baselineDraft);
  assert.equal(baselineDraft.revision, 2);
  const deadlineAt = projection.session.configurationSnapshot.timerDeadlineAt as string;
  assert.equal(typeof deadlineAt, "string");
  const initialAttempts = (await getTrainingAttempts()).value;
  const initialReviews = (await getReviewQueueItems()).value;
  const initialSessions = (await getTrainingSessions()).value;
  let drainRefreshFailure: unknown;

  const drain = new DesignSimulationDraftDrain(
    saveDesignInterviewSimulationStage,
    async () => { try { await getDesignInterviewSimulationProjection(); } catch (error) { drainRefreshFailure = error; } },
    () => undefined,
    60_000,
  );
  drain.seedDurable({ requirements: "Verified before the deadline." });
  holdNextExactResolution = true;
  const deferredSave = drain.request("requirements", "Deferred verified response.");
  const flush = drain.flush();
  await exactResolutionEntered.promise;
  assert.equal(drain.isSaving(), true);

  const deadlineMilliseconds = Date.parse(deadlineAt!);
  assert.ok(deadlineMilliseconds > Date.parse(wallClock.now()));
  wallClock.advanceBy(deadlineMilliseconds - Date.parse(wallClock.now()) + 1);
  let expirySettled = false;
  const expiry = getDesignInterviewSimulationProjection().then(
    () => { expirySettled = true; return "projected" as const; },
    (error: unknown) => { expirySettled = true; if (error instanceof DesignInterviewSimulationExpiredError) return "expired" as const; throw error; },
  );
  await new Promise<void>((resolve) => setImmediate(resolve));
  assert.equal(expirySettled, false, "expiry projection must wait behind the active session-owned save lane");

  releaseExactResolution.resolve();
  await Promise.all([deferredSave, flush]);
  assert.equal(await expiry, "expired");
  assert.ok(drainRefreshFailure instanceof DesignInterviewSimulationExpiredError);
  assert.equal(drain.isSaved({ requirements: "Deferred verified response." }), true);

  const finalDraft = await getActiveTrainingSessionDraft();
  const result = await getTrainingSessionResult(projection.session.id);
  const finalizedSession = (await getTrainingSessions()).value.find((candidate) => candidate.id === projection.session.id);
  assert.equal(finalDraft, null);
  assert.ok(result);
  assert.equal(finalizedDraftRevision, 3, "the real finalizer receives the exact post-gate D revision");
  assert.ok(finalizedSession);
  assert.equal(finalizedSession.status, "completed");
  assert.equal(finalizedSession.completedAt, wallClock.now());
  assert.deepEqual((await getTrainingAttempts()).value, initialAttempts, "Design finalization does not create ordinary attempts");
  assert.deepEqual((await getReviewQueueItems()).value, initialReviews, "Design finalization does not mutate the review queue");
  assert.equal((await getTrainingSessions()).value.filter((candidate) => candidate.id === projection.session.id).length, 1);
  assert.deepEqual((await getTrainingSessions()).value.map((candidate) => candidate.id), initialSessions.map((candidate) => candidate.id));
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), undefined);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT), undefined);
  assert.equal(await getActiveMutationJournal(), null);
  const resultProjection = await getDesignInterviewSimulationResult(projection.session.id);
  assert.equal(resultProjection.responsesByStage.requirements, "Deferred verified response.");
  assert.equal(resultProjection.stageCompleteness.requirements, true);
  const terminalRawState = storage.snapshot();

  for (let launch = 0; launch < 2; launch += 1) {
    let restored!: ReturnType<typeof composeDesignLifecycle>;
    const bootstrapped = await bootstrapApplication(
      () => contentPackageRuntimeOwner.verifyBundledPackages(),
      async () => { await restored.resumeActiveSession(); },
      async () => { restored = composeDesignLifecycle(`persist10-bootstrap-${launch}`, { wallClock, packages }); },
    );
    assert.deepEqual(bootstrapped, { kind: "ready", activeSessionId: null });
    assert.deepEqual(storage.snapshot(), terminalRawState, "each production bootstrap preserves the terminal canonical raw state");
  }
});

test("a dirty Design response is excluded when expiry wins before its save starts", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  initializeStorageMetadata();
  await provisionGuestInstallation();
  const profileId = await designProfileId();
  const wallClock = createAdjustableWallClock(() => PROBE_BASE_TIME);
  composeDesignLifecycle("persist10-dirty-at-expiry", { wallClock });
  await contentPackageRuntimeOwner.resolveForDiscovery(DESIGN_TRACK_ID, "design_interview");
  const projection = await openDesignInterviewSimulation({ trackId: DESIGN_TRACK_ID, profileId });
  await saveDesignInterviewSimulationStage("requirements", "Last verified before expiry.");
  const drain = new DesignSimulationDraftDrain(
    saveDesignInterviewSimulationStage,
    async () => { try { await getDesignInterviewSimulationProjection(); } catch { /* The screen reports terminal expiry separately. */ } },
    () => undefined,
    60_000,
  );
  drain.seedDurable({ requirements: "Last verified before expiry." });
  const dirtySave = drain.request("requirements", "Dirty and never started before expiry.");
  const deadline = Date.parse(String(projection.session.configurationSnapshot.timerDeadlineAt));
  wallClock.advanceBy(deadline - Date.parse(wallClock.now()) + 1);

  await assert.rejects(getDesignInterviewSimulationProjection(), (error: unknown) => error instanceof DesignInterviewSimulationExpiredError);
  const terminalRawState = storage.snapshot();
  const flush = drain.flush();
  await Promise.all([
    assert.rejects(dirtySave),
    assert.rejects(flush),
  ]);
  assert.deepEqual(storage.snapshot(), terminalRawState, "the post-expiry save attempt cannot change terminal canonical bytes");
  const terminalResult = await getTrainingSessionResult(projection.session.id);
  assert.ok(terminalResult);
  const details = terminalResult.evidence.details as Record<string, unknown>;
  const responses = details.responsesByStage as Record<string, unknown>;
  assert.equal(responses.requirements, "Last verified before expiry.");
  assert.notEqual(responses.requirements, "Dirty and never started before expiry.");
  assert.equal(drain.hasDirty(), true, "the UI drain retains the unsaved local edit for its blocked terminal flow");
  assert.equal(await getActiveTrainingSessionDraft(), null);
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), undefined);
});

test("real composition rejects the original frozen journal retry after the same-profile lease changes away and back", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);

  const lifecycle = composeLifecycle("composition-journal-lease-aba");
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId);
  assert.ok(question);
  const journalWritesBeforeSubmit = storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.submitPracticeResponse(question.answer));
  storage.setFailurePlan(null);

  const failed = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in failed ? failed.error.allowedAction : null, "retry_same_command");
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length, journalWritesBeforeSubmit);

  setActiveProfileLeaseForTests(PROFILE_B);
  setActiveProfileLeaseForTests(PROFILE_A);
  const currentLease = captureActiveProfileStorageLease();
  assert.ok(currentLease);
  assert.notEqual(currentLease, originalLease, "returning to profile A creates a new lease generation");
  assert.equal(currentLease.profile.id, originalLease.profile.id);
  const beforeRejectedRetry = storage.snapshot();

  await assert.rejects(lifecycle.retryPracticeSubmission());

  const blocked = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in blocked ? blocked.error.allowedAction : null, "none");
  assert.equal(await getActiveMutationJournal(), null);
  assert.deepEqual(storage.snapshot(), beforeRejectedRetry, "stale original command cannot write into the replacement lease");
});

test("real composition retries the exact prewrite practice command once under the original lease", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);
  const lifecycle = composeLifecycle("composition-journal-same-lease-retry");
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(TRACK_ID);
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId);
  assert.ok(question);
  const journalWritesBefore = storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.submitPracticeResponse(question.answer));
  storage.setFailurePlan(null);

  const retryable = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in retryable ? retryable.error.allowedAction : null, "retry_same_command");
  assert.equal(await getActiveMutationJournal(), null, "the pre-set failure did not create a journal");
  assert.deepEqual((await getTrainingAttempts()).value, []);
  const beforeWrongRetry = storage.snapshot();
  await assert.rejects(lifecycle.retryExpectedSessionAbandonment(prepared.session.id), /no exact abandonment command safe to retry/u);
  assert.deepEqual(storage.snapshot(), beforeWrongRetry, "a practice command handle cannot be used as an abandonment command");
  await lifecycle.retryPracticeSubmission();

  const attempts = (await getTrainingAttempts()).value;
  assert.equal(attempts.length, 1);
  assert.deepEqual(attempts[0]?.response, question.answer);
  assert.equal(attempts[0]?.sessionId, prepared.session.id);
  assert.equal((await getActiveTrainingSession())?.currentItemIndex, prepared.session.currentItemIndex, "submission does not silently advance the occurrence");
  assert.equal(await getActiveMutationJournal(), null);
  assert.equal(captureActiveProfileStorageLease(), originalLease, "the retry uses the exact lease captured before the first await");
  await assert.rejects(lifecycle.retryPracticeSubmission(), /no exact frozen command safe to retry/u);
  assert.equal((await getTrainingAttempts()).value.length, 1, "a completed frozen command cannot materialize twice");
  assert.ok(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length > journalWritesBefore);
});

test("real composition retries the exact prewrite abandonment under its original eligibility checks", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  let now = "2026-10-11T10:00:00.000Z";
  let exactResolutions = 0;
  const packages = {
    resolveForPreparation: contentPackageRuntimeOwner.resolveForPreparation.bind(contentPackageRuntimeOwner),
    async resolveExactArtifact(input: Parameters<typeof contentPackageRuntimeOwner.resolveExactArtifact>[0]) {
      exactResolutions += 1;
      return contentPackageRuntimeOwner.resolveExactArtifact(input);
    },
    resolveForDiscovery: contentPackageRuntimeOwner.resolveForDiscovery.bind(contentPackageRuntimeOwner),
  };
  const lifecycle = composeTrainingLifecycleUseCases({
    wallClock: { now: () => now },
    packages,
    sessionIds: { async create() { return "composition-abandonment-exact-retry"; } },
  });
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const exactResolutionsBeforeAbandonment = exactResolutions;
  const writesBefore = storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.abandonActiveSession());
  storage.setFailurePlan(null);

  const failed = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in failed ? failed.error.allowedAction : null, "retry_same_command");
  assert.equal(await getActiveMutationJournal(), null, "the prewrite transport failure did not persist a journal");
  assert.equal(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length, writesBefore);
  assert.equal((await getActiveTrainingSession())?.id, prepared.session.id);
  const beforeWrongRetry = storage.snapshot();
  await assert.rejects(lifecycle.retryPracticeSubmission(), /no exact frozen command safe to retry/u);
  assert.deepEqual(storage.snapshot(), beforeWrongRetry, "an abandonment handle cannot be used as a practice submission");

  now = "2026-10-11T10:01:00.000Z";
  const abandoned = await lifecycle.retryExpectedSessionAbandonment(prepared.session.id);
  assert.equal(abandoned.status, "abandoned");
  assert.equal(abandoned.completedAt, "2026-10-11T10:00:00.000Z", "retry used the frozen abandonment record instead of rebuilding it with the later clock");
  assert.equal(await getActiveTrainingSession(), null);
  assert.equal(await getActiveMutationJournal(), null);
  assert.ok(exactResolutions >= exactResolutionsBeforeAbandonment + 3, "retry reran exact content eligibility in the original preflight");
  assert.ok(storage.operations.filter((operation) => operation.kind === "write" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length > writesBefore);
});

test("real composition refuses an abandonment retry after the original same-profile lease is replaced", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  setActiveProfileLeaseForTests(PROFILE_A);
  const originalLease = captureActiveProfileStorageLease();
  assert.ok(originalLease);
  const lifecycle = composeLifecycle("composition-abandonment-lease-aba");
  const prepared = await lifecycle.startSession({ trackId: TRACK_ID, modeId: "coding-interview-learn-approach", request: { requestedLength: 10 } });
  const journalReadsBefore = storage.operations.filter((operation) => operation.kind === "read" && operation.key === STORAGE_KEYS.ACTIVE_JOURNAL).length;
  storage.setFailurePlan({ kind: "fail_on_key_read_occurrence", key: STORAGE_KEYS.ACTIVE_JOURNAL, occurrence: journalReadsBefore + 2 });
  await assert.rejects(lifecycle.abandonActiveSession());
  storage.setFailurePlan(null);
  assert.equal((await lifecycle.getPracticeOperationState(prepared.session, false)).kind, "abandonment_failed_before_journal");

  setActiveProfileLeaseForTests(PROFILE_B);
  setActiveProfileLeaseForTests(PROFILE_A);
  const replacementLease = captureActiveProfileStorageLease();
  assert.ok(replacementLease);
  assert.notEqual(replacementLease, originalLease);
  assert.equal(replacementLease.profile.id, originalLease.profile.id);
  const beforeRetry = storage.snapshot();
  await assert.rejects(lifecycle.retryExpectedSessionAbandonment(prepared.session.id));
  const blocked = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in blocked ? blocked.error.allowedAction : null, null, "the canonical active session is reprojected without exposing a retry for the stale command");
  assert.deepEqual(storage.snapshot(), beforeRetry, "the stale frozen abandonment cannot write through a replacement lease generation");
});
