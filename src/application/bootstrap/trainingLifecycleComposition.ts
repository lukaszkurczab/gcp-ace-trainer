import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { OperationProjectionStore } from "../trainingLifecycle/operationProjectionStore";
import {
  commitLearningStateReset,
  commitSessionAbandonment,
  commitSessionCompletion,
  commitTrainingOutcome,
  commitTrainingSessionFinalization,
  commitTrainingSessionAdvance,
  commitTrainingSessionStart,
  recoverPendingMutation,
} from "../learningMutations";
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
} from "../trainingLifecycle";
import { getTrackRegistration, type ReviewMutationCommand, type ReviewQueueEntry, type TrainingSession } from "../../domain";
import {
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getReviewQueueItems,
  getTrainingAttempts,
  getTrainingSessionResult,
  getTrainingSessions,
  getActiveForegroundTimer,
  getActiveMutationJournal,
  saveActiveForegroundTimer,
  saveTrainingSessionDraft,
} from "../../storage/repositories";
import { trainingSessionIdentity } from "../../infrastructure/identity/trainingSessionIdentity";

export type WallClock = Readonly<{ now(): string }>;
export type AdjustableWallClock = WallClock & Readonly<{ advanceBy(milliseconds: number): string }>;
export type TrainingLifecycleCompositionDependencies = Readonly<{
  wallClock?: WallClock;
  sessionIds?: TrainingSessionIdentityPort;
  packages?: ContentPackageRuntimePort;
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
  const sessionIds = dependencies.sessionIds ?? (developmentAuditability ? developmentAuditSessionIdentity : trainingSessionIdentity);
  const ports: TrainingLifecyclePorts = {
    clock: wallClock,
    sessionIds,
    tracks: { getTrackRegistration },
    packages: dependencies.packages ?? contentPackageRuntimeOwner,
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
      async saveDraft(input) { await saveTrainingSessionDraft(input.draft, input.expectedPreviousRevision); },
      async getPendingMutation() {
        const pending = await getActiveMutationJournal();
        if (!pending) return null;
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
    },
    mutations: {
      async start(input) { await commitTrainingSessionStart({ session: input.session, draft: input.draft, createdAt: input.session.startedAt }); },
      async submitPractice(input) {
        const reviews = input.reviewMutations.filter((mutation) => mutation.kind === "upsert").map((mutation) => mutation.entry);
        const resolvedReviews = input.reviewMutations.filter((mutation) => mutation.kind === "remove").map((mutation) => mutation.entry);
        await commitTrainingOutcome({ attempt: input.attempt, session: input.session, reviews, resolvedReviews, createdAt: input.attempt.committedAt });
      },
      async advance(session) { await commitTrainingSessionAdvance(session, wallClock.now()); },
      async completeWithResult(input) { await commitSessionCompletion(input.session, input.result, input.session.completedAt ?? wallClock.now()); },
      async finalize(input) { await commitFinalization(input, wallClock); },
      async abandon(session) { await commitSessionAbandonment(session, session.completedAt ?? wallClock.now()); },
      async recover() { await recoverPendingMutation(); },
      async reset() { await commitLearningStateReset(wallClock.now()); },
    },
    ...(developmentAuditability && adjustableWallClock ? { runtimeAuditability: { advanceWallClockBy: (milliseconds: number) => adjustableWallClock.advanceBy(milliseconds) } } : {}),
  };
  const lifecycle = new TrainingLifecycleUseCases(ports, new OperationProjectionStore());
  installTrainingLifecycleUseCases(lifecycle);
  installForegroundSessionTimerFacade(new ForegroundSessionTimerFacade({
    repository: { getActive: getActiveForegroundTimer, save: saveActiveForegroundTimer },
    lifecycle,
    tracks: { getTrackRegistration },
    monotonicClock: { now: () => globalThis.performance?.now?.() ?? Date.now() },
    wallClock,
    schedule: (callback) => setInterval(callback, 1_000),
    cancel: (handle) => clearInterval(handle),
    finalize: async () => lifecycle.finalizeSimulation(),
  }));
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

async function commitFinalization(input: SimulationFinalization, wallClock: WallClock): Promise<void> {
  const existingById = new Map((await getReviewQueueItems()).value.map((review) => [review.id, review]));
  await commitTrainingSessionFinalization({
    session: input.session,
    attempts: input.attempts,
    reviewMutations: input.reviewMutations.map((mutation) => ({
      action: mutation.kind === "remove" ? "delete" as const : existingById.has(mutation.entry.id) ? "update" as const : "put" as const,
      record: mutation.entry,
      transitionAttemptId: mutation.transitionAttemptId ?? mutation.entry.sourceAttemptId,
    })),
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

export async function resumePersistedTrainingSession(): Promise<TrainingSession> {
  return composeTrainingLifecycleUseCases().resumeActiveSession();
}
