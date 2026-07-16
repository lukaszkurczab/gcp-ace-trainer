import type {
  ContentItemRef,
  ReviewMutationCommand,
  ReviewQueueEntry,
  TrackFamilyId,
  TrackId,
  TrainingAttempt,
  TrainingSession,
  TrainingSessionDraft,
  TrainingSessionResult,
} from "../../domain";

export const APPLICATION_FAILURE_CODES = [
  "unknown_track",
  "unknown_family",
  "unknown_mode",
  "unknown_source",
  "missing_content",
  "missing_handler",
  "unresolved_profile",
  "invalid_response",
  "no_active_session",
  "active_session_conflict",
  "persistence_failure",
  "verification_failure",
  "resume_unavailable",
  "summary_unavailable",
] as const;

export type ApplicationFailureCode = (typeof APPLICATION_FAILURE_CODES)[number];

export class TrainingApplicationFailure extends Error {
  constructor(readonly code: ApplicationFailureCode, message: string, readonly cause?: unknown) {
    super(message);
    this.name = "TrainingApplicationFailure";
  }
}

export type TrackRegistrationPort = Readonly<{ id: TrackId; familyId: TrackFamilyId }>;
export interface TrackRegistryPort { getTrackRegistration(trackId: TrackId): TrackRegistrationPort; }

export type PreparedSession = Readonly<{
  session: TrainingSession;
  firstOccurrence: ContentItemRef;
  draft: TrainingSessionDraft | null;
}>;

export type PracticeSubmission = Readonly<{
  attempt: TrainingAttempt<unknown>;
  session: TrainingSession;
  reviewMutations: readonly ReviewMutationCommand[];
}>;

export type SimulationFinalization = Readonly<{
  session: TrainingSession;
  result: TrainingSessionResult;
  attempts: readonly TrainingAttempt<unknown>[];
  reviewMutations: readonly ReviewMutationCommand[];
  frozenDraft: TrainingSessionDraft;
}>;

/** Family-owned deterministic semantics. It cannot read or write repositories. */
export interface TrainingFamilyRuntime {
  readonly familyId: TrackFamilyId;
  prepare(input: Readonly<{ trackId: TrackId; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession>;
  validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void>;
  submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission>;
  finalizeSimulation(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<SimulationFinalization>;
  validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void>;
  queryDashboard(input: Readonly<{ trackId: TrackId; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown>;
  queryProgress(input: Readonly<{ trackId: TrackId; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown>;
  queryReview(input: Readonly<{ trackId: TrackId; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown>;
}

export interface FamilyRuntimeRegistryPort { resolve(familyId: TrackFamilyId): TrainingFamilyRuntime; }

/** Content ownership stays outside family runtimes and is checked per track. */
export interface BundledContentAvailabilityPort {
  requireAvailable(trackId: TrackId, modeId: string): Promise<void>;
  assertPreparedSession(session: TrainingSession): Promise<void>;
  assertActiveSession(session: TrainingSession): Promise<void>;
}

export interface TrainingLifecycleRepositoryPort {
  getActiveSession(): Promise<TrainingSession | null>;
  getSession(sessionId: string): Promise<TrainingSession | null>;
  getHistory(): Promise<readonly TrainingSession[]>;
  getAttempts(): Promise<readonly TrainingAttempt<unknown>[]>;
  getReviews(): Promise<readonly ReviewQueueEntry[]>;
  getDraft(sessionId: string): Promise<TrainingSessionDraft | null>;
  getResult(sessionId: string): Promise<TrainingSessionResult | null>;
  saveDraft(input: Readonly<{ draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void>;
}

/** The only application dependency allowed to mutate canonical records. */
export interface TrainingMutationCoordinatorPort {
  start(input: PreparedSession): Promise<void>;
  submitPractice(input: PracticeSubmission): Promise<void>;
  advance(session: TrainingSession): Promise<void>;
  complete(session: TrainingSession): Promise<void>;
  finalize(input: SimulationFinalization): Promise<void>;
  abandon(session: TrainingSession): Promise<void>;
  recover(): Promise<void>;
  reset(): Promise<void>;
}

export type TrainingLifecyclePorts = Readonly<{
  clock: Readonly<{ now(): string }>;
  tracks: TrackRegistryPort;
  runtimes: FamilyRuntimeRegistryPort;
  content: BundledContentAvailabilityPort;
  repositories: TrainingLifecycleRepositoryPort;
  mutations: TrainingMutationCoordinatorPort;
}>;
