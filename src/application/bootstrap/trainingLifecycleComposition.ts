import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { OperationProjectionStore } from "../trainingLifecycle/operationProjectionStore";
import {
  commitLearningStateReset,
  installLearningStateResetBarrier,
  commitSessionAbandonment,
  commitSessionCompletion,
  commitTrainingOutcome,
  commitTrainingSessionFinalization,
  commitTrainingSessionAdvance,
  commitTrainingSessionStart,
  recoverPendingMutation,
} from "../learningMutations";
import { commitMutation, commitMutationAfterPreflight, type ExactMutationRetrySeed } from "../learningMutations/commitMutation";
import {
  installTrainingLifecycleUseCases,
  ForegroundSessionTimerFacade,
  installForegroundSessionTimerFacade,
  TrainingLifecycleUseCases,
  type SimulationFinalization,
  type ContentPackageRuntimePort,
  type TrainingSessionIdentityPort,
  type TrainingSessionIdentityRequest,
  type TrainingLifecyclePorts,
  type PremiumSessionAdmissionPort,
} from "../trainingLifecycle";
import { getTrackRegistration, type ReviewMutationCommand, type ReviewQueueEntry, type TrainingSession, type TrainingSessionDraft } from "../../domain";
import {
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  reconcileTrainingSessionDraftWrite,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessionResult,
  getTrainingSessions,
  getActiveForegroundTimer,
  getActiveMutationJournal,
  reconcileMutationJournalWriteAttempt,
  saveActiveForegroundTimer,
  saveTrainingSessionDraft,
  captureTrainingSessionDraftLease,
} from "../../storage/repositories";
import type { CanonicalWriteAttempt } from "../../storage/repositories/canonicalRecordCodec";
import type { ActiveProfileStorageLease, MutationJournalRecord } from "../../storage/repositories/mutationJournalRepository";
import { assertValidMutationJournal, isMutationJournalLeaseCurrent } from "../../storage/repositories/mutationJournalRepository";
import { isTrainingSessionDraft } from "../../storage/repositories/trainingModelGuards";
import { isTrainingSessionDraftLeaseCurrent } from "../../storage/repositories/trainingSessionDraftRepository";
import { trainingSessionIdentity } from "../../infrastructure/identity/trainingSessionIdentity";
import { MutationCommitFailure, type RetryMutationCommandHandle, type RetryableMutationOperation } from "../mutationBoundary";
import type { DraftStorageLeaseHandle, DraftWriteReceipt } from "../trainingLifecycle/contracts";
import { STORAGE_KEYS } from "../../storage/keys";

export type WallClock = Readonly<{ now(): string }>;
export type AdjustableWallClock = WallClock & Readonly<{ advanceBy(milliseconds: number): string }>;
export type TrainingLifecycleCompositionDependencies = Readonly<{
  wallClock?: WallClock;
  sessionIds?: TrainingSessionIdentityPort;
  packages?: ContentPackageRuntimePort;
  premiumSessionAdmission?: PremiumSessionAdmissionPort;
}>;

const realWallClock: WallClock = Object.freeze({ now: () => new Date().toISOString() });
const MAX_ISO_DATE_MILLISECONDS = 8_640_000_000_000_000;

/** A development-only offset preserves production time semantics while allowing legal time travel in audit runs. */
export function createAdjustableWallClock(now: () => string = realWallClock.now): AdjustableWallClock {
  let offsetMilliseconds = 0;
  const timestampAtOffset = (offset: number): string => {
    const baseTimestamp = Date.parse(now());
    const timestamp = baseTimestamp + offset;
    if (!Number.isFinite(baseTimestamp) || !Number.isFinite(timestamp) || Math.abs(timestamp) > MAX_ISO_DATE_MILLISECONDS) {
      throw new Error("Runtime audit clock timestamp must remain within the valid ISO date range.");
    }
    return new Date(timestamp).toISOString();
  };
  return Object.freeze({
    now: () => timestampAtOffset(offsetMilliseconds),
    advanceBy(milliseconds: number) {
      if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0) throw new Error("Runtime audit clock advance must be a positive safe integer.");
      const nextOffset = offsetMilliseconds + milliseconds;
      if (!Number.isSafeInteger(nextOffset)) throw new Error("Runtime audit clock offset exceeds the supported range.");
      const timestamp = timestampAtOffset(nextOffset);
      offsetMilliseconds = nextOffset;
      return timestamp;
    },
  });
}

/**
 * The only production composition of family semantics, canonical persistence,
 * content identity and wall clock. Presentation imports the lifecycle facade,
 * never these dependencies.
 */
export function composeTrainingLifecycleUseCases(dependencies: TrainingLifecycleCompositionDependencies = {}): TrainingLifecycleUseCases {
  const developmentAuditability = isDevelopmentRuntimeAuditabilityBuild();
  const wallClock = dependencies.wallClock ?? (developmentAuditability ? createAdjustableWallClock() : realWallClock);
  const adjustableWallClock = isAdjustableWallClock(wallClock) ? wallClock : null;
  let monotonicAuditOffsetMs = 0;
  const monotonicNow = () => (globalThis.performance?.now?.() ?? Date.now()) + monotonicAuditOffsetMs;
  const sessionIds = dependencies.sessionIds ?? (developmentAuditability ? developmentAuditSessionIdentity : trainingSessionIdentity);
  const draftLeaseByHandle = new WeakMap<object, ActiveProfileStorageLease>();
  const draftAttemptByReceipt = new WeakMap<object, CanonicalWriteAttempt<TrainingSessionDraft>>();
  const retryCommandByHandle = new WeakMap<object, ExactMutationRetrySeed>();
  const projectRetryableFailure = (error: unknown): unknown => {
    if (!(error instanceof MutationCommitFailure) || error.retrySeed === undefined) return error;
    const seed = retrySeedFromUnknown(error.retrySeed);
    if (!seed || !isRetryableMutationOperation(seed.record.operation) || !isMutationJournalLeaseCurrent(seed.lease)
      || seed.record.commandIdentity.fingerprint !== error.commandProof?.commandFingerprint
      || seed.record.planFingerprint !== error.commandProof?.planFingerprint) {
      return new MutationCommitFailure(error.phase, error.durableState, error.cause, error.commandProof);
    }
    const handle = Object.freeze({ kind: "retry_mutation_command" }) as RetryMutationCommandHandle;
    retryCommandByHandle.set(handle, seed);
    return new MutationCommitFailure(error.phase, error.durableState, error.cause, Object.freeze({
      operation: seed.record.operation,
      commandFingerprint: error.commandProof?.commandFingerprint ?? seed.record.commandIdentity.fingerprint,
      planFingerprint: error.commandProof?.planFingerprint ?? seed.record.planFingerprint,
      ...(error.commandProof?.attempt !== undefined ? { attempt: error.commandProof.attempt } : {}),
      retryCommand: handle,
    }));
  };
  const captureDraftLease = (): DraftStorageLeaseHandle | null => {
    const lease = captureTrainingSessionDraftLease();
    if (!lease) return null;
    const handle = Object.freeze({ kind: "draft_storage_lease" }) as DraftStorageLeaseHandle;
    draftLeaseByHandle.set(handle, lease);
    return handle;
  };
  const resolveDraftLease = (handle: DraftStorageLeaseHandle | null): Readonly<{ valid: boolean; lease: ActiveProfileStorageLease | null }> => {
    if (handle === null) return { valid: true, lease: null };
    const lease = draftLeaseByHandle.get(handle);
    return lease ? { valid: true, lease } : { valid: false, lease: null };
  };
  const captureDraftReceipt = (value: unknown): DraftWriteReceipt | null => {
    if (!isCanonicalDraftWriteAttempt(value)) return null;
    const receipt = Object.freeze({ kind: "draft_write_receipt" }) as DraftWriteReceipt;
    draftAttemptByReceipt.set(receipt, value);
    return receipt;
  };
  const ports: TrainingLifecyclePorts = {
    clock: wallClock,
    sessionIds,
    tracks: { getTrackRegistration },
    packages: dependencies.packages ?? contentPackageRuntimeOwner,
    premiumSessionAdmission: dependencies.premiumSessionAdmission,
    repositories: {
      async getActiveSession() { return getActiveTrainingSession(); },
      async getSession(sessionId) { return (await getTrainingSessions()).value.find((session) => session.id === sessionId) ?? null; },
      async getHistory() { return (await getTrainingSessions()).value; },
      async getAttempts() { return (await getTrainingAttempts()).value; },
      async getReviews() { return (await getReviewQueueItems()).value; },
      async getDraft(sessionId) {
        const draft = await getActiveTrainingSessionDraft();
        return draft?.sessionId === sessionId ? draft : null;
      },
      async getResult(sessionId) { return getTrainingSessionResult(sessionId); },
      captureDraftStorageLease: captureDraftLease,
      captureDraftWriteReceipt: captureDraftReceipt,
      async saveDraft(input) {
        const resolved = resolveDraftLease(input.lease);
        if (!resolved.valid) throw new Error("The original draft storage lease is unknown.");
        if (!isTrainingSessionDraftLeaseCurrent(resolved.lease)) throw new Error("The original draft storage lease is stale.");
        await saveTrainingSessionDraft(input.draft, input.expectedPreviousRevision, resolved.lease);
      },
      async reconcileDraftWrite(receipt) {
        const attempt = draftAttemptByReceipt.get(receipt);
        return attempt ? reconcileTrainingSessionDraftWrite(attempt) : "conflict";
      },
      async getPendingMutation() {
        const pending = await getActiveMutationJournal();
        if (!pending || pending.operation === "accept_goal_plan" || pending.operation === "resolve_account_sync_conflict") return null;
        const attempt = pending.writes.find((write): write is Extract<typeof pending.writes[number], { kind: "put_attempt" }> => write.kind === "put_attempt");
        const reviews: ReviewMutationCommand[] = [];
        for (const write of pending.writes) {
          if (write.kind === "put_review_entry" || write.kind === "put_review_entry_for_attempt" || write.kind === "update_review_entry") {
            reviews.push({ kind: "upsert", entry: write.record, transitionAttemptId: write.kind === "put_review_entry" ? write.record.sourceAttemptId : write.transitionId });
          }
          if (write.kind === "delete_review_entry" || write.kind === "delete_review_entry_for_attempt") {
            reviews.push({ kind: "remove", entry: write.record, ...(write.kind === "delete_review_entry_for_attempt" ? { transitionAttemptId: write.transitionId } : {}) });
          }
        }
        const frozenDraft = pending.writes.find((write): write is Extract<typeof pending.writes[number], { kind: "delete_active_session_draft" }> => write.kind === "delete_active_session_draft");
        const result = pending.writes.find((write): write is Extract<typeof pending.writes[number], { kind: "put_session_result" }> => write.kind === "put_session_result");
        return Object.freeze({
          operation: pending.operation, status: pending.status, sessionId: pending.sessionId, trackId: pending.trackId,
          commandFingerprint: pending.commandIdentity.fingerprint, planFingerprint: pending.planFingerprint,
          ...(attempt ? { practiceOutcome: Object.freeze({ attempt: attempt.record, submittedResponse: attempt.record.response, reviewMutations: Object.freeze(reviews) }) } : {}),
          ...(pending.operation === "complete_training_session" && result ? { practiceCompletion: Object.freeze({ resultId: result.record.id }) } : {}),
          ...(frozenDraft && result ? { simulationFinalization: Object.freeze({ frozenDraftRevision: frozenDraft.record.revision, resultId: result.record.id }) } : {}),
        });
      },
      async reconcilePendingMutationWrite(proof) {
        if (!proof.attempt || typeof proof.attempt !== "object") return "unknown";
        return reconcileMutationJournalWriteAttempt(proof.attempt, proof);
      },
    },
    mutations: {
      async start(input) { await commitTrainingSessionStart({ session: input.session, draft: input.draft, createdAt: input.session.startedAt }); },
      async submitPractice(input) {
        const reviews = input.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry);
        const resolvedReviews = input.reviewMutations.filter((mutation) => mutation.kind === "remove").map((mutation) => mutation.entry);
        try {
          return await commitTrainingOutcome({ attempt: input.attempt, session: input.session, reviews, resolvedReviews, reviewBaseline: input.reviewBaseline, reviewSnapshotConflict: input.reviewSnapshotConflict, createdAt: input.attempt.committedAt });
        } catch (error) { throw projectRetryableFailure(error); }
      },
      async retryMutationCommand(command, expectedOperation) {
        const seed = retryCommandByHandle.get(command);
        if (!seed || seed.record.operation !== expectedOperation || !isMutationJournalLeaseCurrent(seed.lease)) throw new Error("The exact retry command, expected operation, or its original profile lease is unavailable.");
        try {
          if (seed.preflight) await commitMutationAfterPreflight(() => Promise.resolve(seed.record), seed.preflight, undefined, seed.lease);
          else await commitMutation(seed.record, seed.lease);
        }
        catch (error) { throw projectRetryableFailure(error); }
      },
      async advance(session) { await commitTrainingSessionAdvance(session, wallClock.now()); },
      async completeWithResult(input) { await commitSessionCompletion(input.session, input.result, input.session.completedAt ?? wallClock.now()); },
      async finalize(input) { return commitFinalization(input, wallClock); },
      async abandon(session, preflight) {
        try { await commitSessionAbandonment(session, session.completedAt ?? wallClock.now(), preflight); }
        catch (error) { throw projectRetryableFailure(error); }
      },
      async recover() { await recoverPendingMutation(); },
      async reset() { await commitLearningStateReset(wallClock.now()); },
    },
    ...(developmentAuditability && adjustableWallClock ? { runtimeAuditability: { advanceWallClockBy: (milliseconds: number) => adjustableWallClock.advanceBy(milliseconds) } } : {}),
  };
  const lifecycle = new TrainingLifecycleUseCases(ports, new OperationProjectionStore());
  installTrainingLifecycleUseCases(lifecycle);
  const timerFacade = new ForegroundSessionTimerFacade({
    repository: { getActive: getActiveForegroundTimer, save: saveActiveForegroundTimer },
    lifecycle,
    tracks: { getTrackRegistration },
    monotonicClock: { now: monotonicNow },
    wallClock,
    schedule: (callback) => setInterval(callback, 1_000),
    cancel: (handle) => clearInterval(handle),
    finalize: async (_session, authorization) => lifecycle.finalizeSimulation(authorization),
    getActiveSession: getActiveTrainingSession,
    ...(developmentAuditability ? {
      advanceMonotonicClockBy(milliseconds: number) {
        if (!Number.isSafeInteger(milliseconds) || milliseconds <= 0 || !Number.isSafeInteger(monotonicAuditOffsetMs + milliseconds)) {
          throw new Error("Runtime audit monotonic clock advance must be a positive safe integer.");
        }
        monotonicAuditOffsetMs += milliseconds;
      },
    } : {}),
  });
  lifecycle.installSimulationDraftSaveBoundary((session, authorization, commit) => timerFacade.saveDraftAtResponseBoundary(session, authorization, commit));
  installForegroundSessionTimerFacade(timerFacade);
  installLearningStateResetBarrier((reset) => timerFacade.runLocalLearningReset(reset));
  return lifecycle;
}

const developmentAuditSessionIdentity: TrainingSessionIdentityPort = Object.freeze({
  async create({ trackId, modeId }: TrainingSessionIdentityRequest) {
    const sessions = (await getTrainingSessions()).value;
    const maximumSuffix = sessions.reduce((maximum, session) => {
      if (session.trackId !== trackId || !session.id.startsWith(`${trackId}:`)) return maximum;
      const suffix = session.id.slice(session.id.lastIndexOf(":") + 1);
      if (!/^[1-9]\d*$/.test(suffix)) return maximum;
      const numericSuffix = Number(suffix);
      if (!Number.isSafeInteger(numericSuffix)) throw new Error("Development audit session identity suffix exceeds the supported range.");
      return Math.max(maximum, numericSuffix);
    }, 0);
    if (maximumSuffix === Number.MAX_SAFE_INTEGER) throw new Error("Development audit session identity space is exhausted.");
    return `${trackId}:${modeId}:${maximumSuffix + 1}`;
  },
});

async function commitFinalization(input: SimulationFinalization, wallClock: WallClock): Promise<boolean> {
  const existingById = new Map((await getReviewQueueItems()).value.map((review) => [review.id, review]));
  return commitTrainingSessionFinalization({
    session: input.session,
    attempts: input.attempts,
    reviewMutations: input.reviewMutations.map((mutation) => ({
      action: mutation.kind === "remove" ? "delete" as const : existingById.has(mutation.entry.id) ? "update" as const : "put" as const,
      record: mutation.entry,
      transitionAttemptId: mutation.transitionAttemptId ?? mutation.entry.sourceAttemptId,
    })),
    reviewBaseline: input.reviewBaseline,
    result: input.result,
    cleanup: { kind: "training_session_draft", draft: input.frozenDraft, submittedOccurrenceIds: input.attempts.map((attempt) => attempt.occurrenceId) },
    createdAt: input.session.completedAt ?? wallClock.now(),
  });
}

function isDevelopmentRuntimeAuditabilityBuild(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__;
}

function isAdjustableWallClock(value: WallClock): value is AdjustableWallClock {
  return "advanceBy" in value && typeof value.advanceBy === "function";
}

function isCanonicalDraftWriteAttempt(value: unknown): value is CanonicalWriteAttempt<TrainingSessionDraft> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const attempt = value as Partial<CanonicalWriteAttempt<unknown>>;
  if (attempt.key !== STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT || typeof attempt.afterRaw !== "string"
    || !(attempt.priorRaw === undefined || typeof attempt.priorRaw === "string")
    || !attempt.envelope || typeof attempt.envelope !== "object" || Array.isArray(attempt.envelope)
    || !attempt.storage || typeof attempt.storage !== "object") return false;
  const envelope = attempt.envelope as Partial<CanonicalWriteAttempt<unknown>["envelope"]>;
  return envelope.schemaIdentity === "patternly:canonical:v1" && Number.isSafeInteger(envelope.revision)
    && (envelope.revision ?? 0) > 0 && isTrainingSessionDraft(envelope.payload);
}

function retrySeedFromUnknown(value: unknown): ExactMutationRetrySeed | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const seed = value as Readonly<{ record?: unknown; lease?: unknown; preflight?: unknown }>;
  if (!seed.record || typeof seed.record !== "object" || Array.isArray(seed.record)
    || !(seed.lease === null || (seed.lease && typeof seed.lease === "object"))
    || !(seed.preflight === undefined || typeof seed.preflight === "function")) return null;
  try {
    assertValidMutationJournal(seed.record);
    if (!isDeepFrozen(seed.record)) return null;
    return { record: seed.record as MutationJournalRecord, lease: seed.lease as ActiveProfileStorageLease | null, ...(typeof seed.preflight === "function" ? { preflight: seed.preflight as () => Promise<void> } : {}) };
  } catch { return null; }
}

function isRetryableMutationOperation(value: unknown): value is RetryableMutationOperation {
  return value === "submit_training_outcome" || value === "abandon_training_session";
}

function isDeepFrozen(value: unknown): boolean {
  if (!value || typeof value !== "object") return true;
  if (!Object.isFrozen(value)) return false;
  return Object.values(value).every(isDeepFrozen);
}

export async function resumePersistedTrainingSession(): Promise<TrainingSession> {
  return composeTrainingLifecycleUseCases().resumeActiveSession();
}
