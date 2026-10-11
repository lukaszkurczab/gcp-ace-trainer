import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { CanonicalTrainingRuntime } from "../canonical/CanonicalTrainingRuntime";
import { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import { createTrainingSession, createTrainingSessionDraft, getTrackRegistration, StaleDraftRevisionError, type TrackId, type TrainingSessionDraft } from "../../domain";
import type { TrainingLifecyclePorts } from "./contracts";
import { CanonicalWriteOutcomeError } from "../../storage/errors";
import { MutationCommitFailure } from "../mutationBoundary";
import type { CanonicalWriteAttempt } from "../../storage/repositories/canonicalRecordCodec";
import { STORAGE_KEYS } from "../../storage/keys";

test("training lifecycle resolves every canonical track runtime", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  for (const id of catalog.tracks) assert.ok(catalog.getTrack(id).modes.length > 0);
});

test("lifecycle preserves an explicit review conflict through the practice operation projection", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const runtime = new CanonicalTrainingRuntime(track);
  const mode = track.getMode("coding-interview-learn-approach");
  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId: mode.modeId,
    request: { sessionId: "lifecycle-review-conflict", requestedLength: mode.requestedLengths[0] },
    attempts: [],
    reviews: [],
    now: "2026-10-01T12:00:00.000Z",
  });
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
  const ports = {
    clock: { now: () => "2026-10-01T12:00:00.000Z" },
    sessionIds: { async create() { return prepared.session.id; } },
    tracks: { getTrackRegistration },
    packages: {
      async resolveExactArtifact() { return { track, runtime }; },
      async resolveForPreparation() { return { track, runtime }; },
      async resolveForDiscovery() { return { track, runtime }; },
    },
    repositories: {
      async getActiveSession() { return prepared.session; },
      async getSession() { return null; },
      async getHistory() { return []; },
      async getAttempts() { return []; },
      async getReviews() { return []; },
      async getDraft() { return null; },
      async getResult() { return null; },
      async saveDraft() {},
    },
    mutations: {
      async start() {},
      async submitPractice() { return true; },
      async advance() {},
      async completeWithResult() {},
      async finalize() { return false; },
      async abandon() {},
      async recover() {},
      async reset() {},
    },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(ports);

  await lifecycle.submitPracticeResponse(question.answer);

  assert.deepEqual(await lifecycle.getPracticeOperationState(prepared.session, true), {
    family: "practice",
    kind: "feedback",
    reviewConflict: true,
  });
});

test("a prewrite journal read failure retains and retries the exact frozen practice command", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const runtime = new CanonicalTrainingRuntime(track);
  const mode = track.getMode("coding-interview-learn-approach");
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "frozen-journal-retry", requestedLength: mode.requestedLengths[0] }, attempts: [], reviews: [], now: "2026-10-01T12:00:00.000Z" });
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
  const frozenRecord = { commandIdentity: { version: 1, fingerprint: "a".repeat(64) }, planFingerprint: "b".repeat(64) } as unknown as import("../../storage/repositories/mutationJournalRepository").MutationJournalRecord;
  const retryHandle = Object.freeze({ kind: "retry_mutation_command" as const });
  let submits = 0;
  let retries = 0;
  const ports = {
    clock: { now: () => "2026-10-01T12:00:00.000Z" },
    sessionIds: { async create() { return prepared.session.id; } },
    tracks: { getTrackRegistration },
    packages: { async resolveExactArtifact() { return { track, runtime }; }, async resolveForPreparation() { return { track, runtime }; }, async resolveForDiscovery() { return { track, runtime }; } },
    repositories: {
      async getActiveSession() { return prepared.session; }, async getSession() { return prepared.session; }, async getHistory() { return []; },
      async getAttempts() { return []; }, async getReviews() { return []; }, async getDraft() { return null; }, async getResult() { return null; }, async saveDraft() {},
    },
    mutations: {
      async start() {},
      async submitPractice() { submits += 1; throw new MutationCommitFailure("journal_write", "not_durable", new Error("prewrite storage unavailable"), { operation: "submit_training_outcome", commandFingerprint: frozenRecord.commandIdentity.fingerprint, planFingerprint: frozenRecord.planFingerprint, retryCommand: retryHandle }); },
      async retryMutationCommand(command: unknown, expectedOperation: string) { assert.equal(command, retryHandle); assert.equal(expectedOperation, "submit_training_outcome"); retries += 1; },
      async advance() {}, async completeWithResult() {}, async finalize() { return false; }, async abandon() {}, async recover() {}, async reset() {},
    },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(ports);

  await assert.rejects(lifecycle.submitPracticeResponse(question.answer));
  const failed = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal("error" in failed ? failed.error.allowedAction : null, "retry_same_command");
  await assert.rejects(lifecycle.submitPracticeResponse(question.answer), /uncertain/u);
  await assert.rejects(lifecycle.advancePracticeSession(), /uncertain/u);
  assert.equal(submits, 1);
  await lifecycle.retryPracticeSubmission();
  assert.equal(retries, 1);
  assert.equal((await lifecycle.getPracticeOperationState(prepared.session, true)).kind, "feedback");
});

test("a journal preflight conflict without a write attempt blocks submit, Next, and finish", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const runtime = new CanonicalTrainingRuntime(track);
  const mode = track.getMode("coding-interview-learn-approach");
  const prepared = await runtime.prepare({ trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "blocked-journal-preflight", requestedLength: mode.requestedLengths[0] }, attempts: [], reviews: [], now: "2026-10-01T12:00:00.000Z" });
  const question = track.getQuestion(prepared.session.itemOrder[0]!.item.questionId)!;
  let submitCalls = 0;
  let advanceCalls = 0;
  const ports = {
    clock: { now: () => "2026-10-01T12:00:00.000Z" }, tracks: { getTrackRegistration },
    packages: { async resolveExactArtifact() { return { track, runtime }; } },
    repositories: {
      async getActiveSession() { return prepared.session; }, async getSession() { return prepared.session; }, async getAttempts() { return []; },
      async getReviews() { return []; }, async getDraft() { return null; }, async getPendingMutation() { return null; },
    },
    mutations: {
      async submitPractice() { submitCalls += 1; throw new MutationCommitFailure("journal_write", "not_durable", new Error("conflicting or invalid journal preflight")); },
      async advance() { advanceCalls += 1; }, async recover() {},
    },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(ports);

  await assert.rejects(lifecycle.submitPracticeResponse(question.answer));
  const blocked = await lifecycle.getPracticeOperationState(prepared.session, false);
  assert.equal(blocked.kind, "submit_journal_failed");
  assert.equal("error" in blocked ? blocked.error.allowedAction : null, "none");
  assert.equal("error" in blocked ? blocked.error.retrySafety : null, "retry_forbidden");
  await assert.rejects(lifecycle.submitPracticeResponse(question.answer), /conflict|uncertain|resolve|check/iu);
  await assert.rejects(lifecycle.advancePracticeSession());
  await assert.rejects(lifecycle.completeActivePracticeSession(prepared.session.id));
  assert.equal(submitCalls, 1);
  assert.equal(advanceCalls, 0);
});

test("an uncertain simulation draft blocks retry and finalization until its exact write is reconciled", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
  const question = track.questions[0]!;
  const session = createTrainingSession({
    id: "uncertain-simulation-save",
    trackId: track.trackId,
    modeId: "coding-interview-simulation",
    configurationSnapshot: {
      kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
      navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 60_000,
      simulationProfileId: "algorithms-interview-simulation-v1", simulationProfileVersion: "1",
      simulationBlueprintId: "coding-interview-interview-simulation-v1", simulationBlueprintVersion: "1",
      simulationPoolId: "algorithms-interview-simulation-v1", simulationPoolVersion: "1",
    },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "uncertain-simulation-save:occurrence:0", item: { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 } }],
    optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 0,
    contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, taxonomyVersion: "canonical-content-v1",
    planFingerprint: "b".repeat(64), status: "active", startedAt: "2026-10-11T00:00:00.000Z",
  });
  const draft = createTrainingSessionDraft({ sessionId: session.id, trackId: track.trackId, familyId: "coding_interview", responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: "2026-10-11T00:00:00.000Z" });
  const attempt = {
    key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
    priorRaw: undefined,
    afterRaw: "attempted-draft",
    envelope: { schemaIdentity: "patternly:canonical:v1", revision: 1, payload: draft },
    storage: {},
    lease: null,
  } as unknown as CanonicalWriteAttempt<TrainingSessionDraft>;
  const receipt = Object.freeze({ kind: "draft_write_receipt" as const });
  let saveCalls = 0;
  let finalizeCalls = 0;
  let reconciliations = 0;
  let conflictNextSave = false;
  const runtime = {
    familyId: "coding_interview",
    validateDraftCommand: async () => undefined,
    finalizeSimulation: async () => ({ session: { ...session, status: "completed", completedAt: "2026-10-11T00:00:00.000Z" }, result: { sessionId: session.id } }),
  } as unknown as import("./contracts").TrainingFamilyRuntime;
  const ports = {
    clock: { now: () => "2026-10-11T00:00:00.000Z" },
    tracks: { getTrackRegistration },
    packages: { async resolveExactArtifact() { return { track, runtime }; } },
    repositories: {
      captureDraftStorageLease() { return null; },
      captureDraftWriteReceipt(received: unknown) { assert.equal(received, attempt); return receipt; },
      async getActiveSession() { return session; },
      async getDraft() { return draft; },
      async getAttempts() { return []; },
      async getReviews() { return []; },
      async getPendingMutation() { return null; },
      async getResult() { return null; },
      async saveDraft() {
        saveCalls += 1;
        if (saveCalls === 1) throw new CanonicalWriteOutcomeError(attempt.key, { kind: "unknown", cause: new Error("readback unavailable"), attempt });
        if (conflictNextSave) throw new CanonicalWriteOutcomeError(attempt.key, { kind: "conflict", cause: new Error("invalid prior draft envelope") });
      },
      async reconcileDraftWrite(received: unknown) {
        assert.equal(received, receipt);
        reconciliations += 1;
        return "verified" as const;
      },
    },
    mutations: {
      async finalize() { finalizeCalls += 1; return false; },
      async recover() {},
    },
    premiumSessionAdmission: { async authorize() { return "allowed" as const; } },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(ports);
  const input = { draft: { ...draft, revision: 1, responsesByOccurrenceId: { [session.itemOrder[0]!.occurrenceId]: { kind: "choice", selectedOptionIds: ["a"] } } }, expectedPreviousRevision: 0 };

  await assert.rejects(lifecycle.saveSimulationDraft(input), /result is uncertain/u);
  const unresolved = await lifecycle.getSimulationOperationState(session);
  assert.equal("error" in unresolved ? unresolved.error.allowedAction : null, "reconcile");
  await assert.rejects(lifecycle.saveSimulationDraft(input), /uncertain result/u);
  await assert.rejects(lifecycle.finalizeSimulation(), /save result is uncertain/u);
  assert.equal(saveCalls, 1);
  assert.equal(finalizeCalls, 0);
  assert.equal(await lifecycle.reconcileSimulationDraftSave(session.id), "verified");
  assert.equal(reconciliations, 1);
  assert.equal((await lifecycle.getSimulationOperationState(session)).kind, "editable");

  await lifecycle.saveSimulationDraft(input);
  assert.equal(saveCalls, 2);
  conflictNextSave = true;
  await assert.rejects(lifecycle.saveSimulationDraft(input));
  const blockedPreflight = await lifecycle.getSimulationOperationState(session);
  assert.equal(blockedPreflight.kind, "save_failed");
  assert.equal("error" in blockedPreflight ? blockedPreflight.error.allowedAction : null, "none");
  assert.equal("error" in blockedPreflight ? blockedPreflight.error.retrySafety : null, "retry_forbidden");
  await assert.rejects(lifecycle.saveSimulationDraft(input), /uncertain/u);
  await assert.rejects(lifecycle.finalizeSimulation(), /uncertain/u);
  assert.equal(saveCalls, 3);
  assert.equal(finalizeCalls, 0);
});

test("a safe draft retry reuses the exact prior response and revision, then blocks when newer D exists", async () => {
  const track = (await loadCanonicalRuntimeCatalog()).getTrack("coding-interview-dsa-problem-solving");
  const question = track.questions[0]!;
  const session = createTrainingSession({
    id: "retry-simulation-save",
    trackId: track.trackId,
    modeId: "coding-interview-simulation",
    configurationSnapshot: {
      kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
      navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 60_000,
      simulationProfileId: "algorithms-interview-simulation-v1", simulationProfileVersion: "1",
      simulationBlueprintId: "coding-interview-interview-simulation-v1", simulationBlueprintVersion: "1",
      simulationPoolId: "algorithms-interview-simulation-v1", simulationPoolVersion: "1",
    },
    requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "retry-simulation-save:occurrence:0", item: { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 } }],
    optionOrderByOccurrence: {}, conditionalReinsertSlots: [], activeForegroundMs: 0,
    contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, taxonomyVersion: "canonical-content-v1",
    planFingerprint: "c".repeat(64), status: "active", startedAt: "2026-10-11T00:00:00.000Z",
  });
  const initialDraft = createTrainingSessionDraft({ sessionId: session.id, trackId: track.trackId, familyId: "coding_interview", revision: 0, responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: "2026-10-11T00:00:00.000Z" });
  const submittedResponse = { kind: "choice", selectedOptionIds: ["original-option"] } as const;
  const input = { draft: createTrainingSessionDraft({ ...initialDraft, revision: 1, responsesByOccurrenceId: { [session.itemOrder[0]!.occurrenceId]: submittedResponse } }), expectedPreviousRevision: 0 };
  const received: Array<{ draft: TrainingSessionDraft; expectedPreviousRevision: number; lease: { profile: { id: string; kind: "guest"; accountId: null }; generation: number } | null }> = [];
  const lease = Object.freeze({ profile: Object.freeze({ id: "lease-owner", kind: "guest" as const, accountId: null }), generation: 7 });
  const events: string[] = [];
  let captures = 0;
  let currentRevision = 0;
  const runtime = { familyId: "coding_interview", async validateDraftCommand() {} } as unknown as import("./contracts").TrainingFamilyRuntime;
  const ports = {
    clock: { now: () => "2026-10-11T00:00:00.000Z" }, tracks: { getTrackRegistration },
    packages: { async resolveExactArtifact() { return { track, runtime }; } },
    repositories: {
      captureDraftStorageLease() { captures += 1; events.push("capture"); return lease; },
      async getActiveSession() { events.push("active-session"); return session; }, async getDraft() { return initialDraft; }, async getAttempts() { return []; }, async getReviews() { return []; },
      async getPendingMutation() { return null; }, async saveDraft(command: { draft: TrainingSessionDraft; expectedPreviousRevision: number; lease: typeof lease | null }) {
        received.push(command);
        if (received.length === 1) throw new CanonicalWriteOutcomeError(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, { kind: "provenNotApplied", cause: new Error("write not attempted") });
        if (command.expectedPreviousRevision !== currentRevision) throw new StaleDraftRevisionError(command.expectedPreviousRevision, currentRevision);
      },
    },
    premiumSessionAdmission: { async authorize() { return "allowed" as const; } },
  } as unknown as TrainingLifecyclePorts;
  const lifecycle = new TrainingLifecycleUseCases(ports);

  await assert.rejects(lifecycle.saveSimulationDraft(input), /before it changed/u);
  const retryable = await lifecycle.getSimulationOperationState(session);
  assert.equal("error" in retryable ? retryable.error.allowedAction : null, "retry_same_command");
  currentRevision = 1;
  await assert.rejects(lifecycle.retrySimulationDraftSave(), /revision is stale/u);
  assert.equal(received.length, 2);
  assert.deepEqual(received[1], received[0]);
  assert.equal(received[0]?.lease, lease, "the retry carries the original lease object");
  assert.equal(captures, 1, "an exact retry never captures a new profile lease");
  assert.equal(events[0], "capture", "the command lease is captured before asynchronous active-session reads");
  assert.deepEqual(received[1]?.draft.responsesByOccurrenceId[session.itemOrder[0]!.occurrenceId], submittedResponse);
  assert.equal(received[1]?.expectedPreviousRevision, 0);
  assert.equal((await lifecycle.getSimulationOperationState(session)).kind, "stale_revision");
  const stale = await lifecycle.getSimulationOperationState(session);
  assert.equal("error" in stale ? stale.error.allowedAction : null, "none");
});
