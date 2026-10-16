import type {
  AttemptResult,
  ReviewMutationCommand,
  ReviewQueueEntry,
  ResolvedContentRef,
  TrackFamilyId,
  TrackId,
  TrainingAttempt,
  TrainingSession,
  TrainingSessionDraft,
  AcceptedSimulationFinalization,
  TrainingSessionResult,
  JournalOperation,
} from "../../domain";
import type { PackageCompletionRule } from "../../domain/learning/packageCompletionRule";
import type { CanonicalProductSimulationProfile } from "../../content/canonical/questionTypes";
import type { ProductModeConfig } from "../../content/canonical/productModeConfig";
import type { LearningPlanningPolicy } from "../../content/canonical/planningPolicy";
import type { CanonicalFeedbackProjection, InteractionEvaluation, ReviewInteractionPresentation } from "../../content/canonical/interactions/shared";
import type { RetryMutationCommandHandle, RetryableMutationOperation } from "../mutationBoundary";

/** Opaque application handles. The canonical repository adapter validates each handle by identity. */
export type DraftStorageLeaseHandle = Readonly<{ kind: "draft_storage_lease" }>;
export type DraftWriteReceipt = Readonly<{ kind: "draft_write_receipt" }>;

/** Family-owned metadata only. Interaction/answer payloads remain behind the exact interaction port. */
export type TrainingQuestionSummary = Readonly<{
  questionId: string;
  trackId: string;
  nodeId: string;
  mentalUnitId: string;
  prompt: string;
  interactionType: string;
  difficulty: string | null;
  constraints?: readonly string[];
  sourceRefs?: readonly string[];
  contentDomainId?: string;
  caseRecipe?: import("../../content/canonical/caseRecipe").CaseRecipe;
  questionRelation?: Readonly<{ counterpartQuestionId: string; kind: "near_variant" | "condition_contrast"; changedCondition: string; decisionBoundary: string }>;
}>;

/** Bound to one verified exact package; family code addresses only stable question identity. */
export interface TrainingInteractionPort {
  evaluate(questionId: string, response: unknown): InteractionEvaluation;
  isComplete(questionId: string, response: unknown): boolean;
  controlIds(questionId: string): readonly string[];
  randomizeControlOrder(questionId: string): boolean;
}
/** Exact-package presentation operations; lifecycle families need only the narrower scoring port. */
export interface TrainingPresentationPort extends TrainingInteractionPort {
  present(questionId: string, response: unknown, displayOrder?: readonly string[]): Readonly<{ interactionType: string; model: unknown }>;
  projectDiagnostics(questionId: string, response: unknown): unknown;
  projectFeedback(questionId: string, response: unknown): CanonicalFeedbackProjection;
  presentReview(questionId: string, response: unknown | null, displayOrder?: readonly string[]): ReviewInteractionPresentation;
}

/** Neutral package projection passed across the lifecycle/family boundary. */
export interface TrainingCatalog {
  readonly trackId: TrackId;
  readonly contentVersion: string;
  readonly artifactSha256: string;
  readonly trainingIdentity?: Readonly<{ contentVersion: string; artifactSha256: string }>;
  readonly contentReleaseId: string;
  readonly questions: readonly TrainingQuestionSummary[];
  readonly completionRule?: PackageCompletionRule;
  readonly simulationProfiles?: readonly CanonicalProductSimulationProfile[];
  readonly planningPolicy?: LearningPlanningPolicy;
  readonly modes: readonly ProductModeConfig[];
  getQuestion(questionId: string): TrainingQuestionSummary | undefined;
  getQuestionsForNode(nodeId: string): readonly TrainingQuestionSummary[];
  getQuestionsForMentalUnit(mentalUnitId: string): readonly TrainingQuestionSummary[];
  getMode(modeId: string): ProductModeConfig;
  getPool(modeId: string): readonly TrainingQuestionSummary[];
}

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
  "timer_recovery_failure",
  "submit_journal_failed",
  "commit_materialization_failed",
  "commit_verification_failed",
  "advance_failed",
  "stale_revision",
  "missing_draft",
  "version_mismatch",
  "corrupt_state",
  "finalization_journal_failed",
  "finalization_materialization_failed",
  "finalization_verification_failed",
  "resume_unavailable",
  "summary_unavailable",
  "premium_entitlement_denied",
  "premium_entitlement_unavailable",
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

export type TrainingSessionIdentityRequest = Readonly<{ trackId: TrackId; modeId: string }>;
export interface TrainingSessionIdentityPort { create(input: TrainingSessionIdentityRequest): Promise<string>; }

export type PreparedSession = Readonly<{
  session: TrainingSession;
  firstOccurrence: ResolvedContentRef;
  draft: TrainingSessionDraft | null;
}>;
export type PracticeSubmission = Readonly<{
  attempt: TrainingAttempt<unknown>;
  session: TrainingSession;
  reviewMutations: readonly ReviewMutationCommand[];
  reviewBaseline?: readonly ReviewQueueEntry[];
  reviewSnapshotConflict?: boolean;
}>;

export type SimulationFinalization = Readonly<{
  session: TrainingSession;
  result: TrainingSessionResult;
  attempts: readonly TrainingAttempt<unknown>[];
  reviewMutations: readonly ReviewMutationCommand[];
  frozenDraft: TrainingSessionDraft;
  reviewBaseline?: readonly ReviewQueueEntry[];
}>;

export type PracticeFinalization = Readonly<{
  session: TrainingSession;
  result: TrainingSessionResult;
}>;

/** Family-owned roles used only when Home/proposal requests a new plan. */
export type FamilyPlanningModeBinding = Readonly<{
  trackId: TrackId;
  diagnosticModeId: string | null;
  practiceModeId: string;
  dueReviewModeId: string | null;
}>;

/** Family-owned deterministic semantics. It cannot read or write repositories. */
export interface TrainingFamilyRuntime {
  readonly familyId: TrackFamilyId;
  readonly interactions: TrainingInteractionPort;
  /** Lazily requested by planning flows; pure session resume does not need planning roles. */
  getPlanningModeBinding(): FamilyPlanningModeBinding;
  prepare(input: Readonly<{ trackId: TrackId; modeId: string; source?: string; request: unknown; sessions?: readonly TrainingSession[]; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession>;
  validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void>;
  submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission>;
  finalizePractice(input: Readonly<{ session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[]; now: string }>): Promise<PracticeFinalization>;
  finalizeSimulation(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<SimulationFinalization>;
  validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void>;
  queryDashboard(input: Readonly<{ activeSession: TrainingSession | null; trackId: TrackId; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown>;
  queryReview(input: Readonly<{ trackId: TrackId; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown>;
}

export type ContentPackageRuntimeResolution = Readonly<{
  track: TrainingCatalog;
  runtime: TrainingFamilyRuntime;
}>;

export type ExactArtifactIdentity = Pick<ResolvedContentRef, "trackId" | "contentVersion" | "artifactSha256">;

/** A verified catalog and retained-package lookup proved one exact pin absent. */
export class ExactContentArtifactUnavailableError extends Error {
  readonly code = "exact_artifact_unavailable" as const;
  constructor(readonly identity: ExactArtifactIdentity) {
    super("The exact verified content artifact is unavailable.");
    this.name = "ExactContentArtifactUnavailableError";
  }
}

/** Sole verified package-to-family-runtime authority for preparation, exact resume, review, and discovery. */
export interface ContentPackageRuntimePort {
  resolveForPreparation(input: Readonly<{ trackId: TrackId; familyId: TrackFamilyId; modeId: string; nodeId?: string; caseId?: string }>): Promise<ContentPackageRuntimeResolution>;
  resolveExactArtifact(input: Pick<ResolvedContentRef, "trackId" | "contentVersion" | "artifactSha256">): Promise<ContentPackageRuntimeResolution>;
  resolveForDiscovery(trackId: TrackId, familyId: TrackFamilyId): Promise<ContentPackageRuntimeResolution>;
}

export interface TrainingLifecycleRepositoryPort {
  getActiveSession(): Promise<TrainingSession | null>;
  getSession(sessionId: string): Promise<TrainingSession | null>;
  getHistory(): Promise<readonly TrainingSession[]>;
  getAttempts(): Promise<readonly TrainingAttempt<unknown>[]>;
  getReviews(): Promise<readonly ReviewQueueEntry[]>;
  getDraft(sessionId: string): Promise<TrainingSessionDraft | null>;
  getDraftStateProof?(): Promise<Readonly<{ state: TrainingSessionDraft | AcceptedSimulationFinalization; revision: number; digest: string }> | null>;
  getSessionEnvelopeProof?(sessionId: string): Promise<Readonly<{ session: TrainingSession; revision: number; digest: string }> | null>;
  getFinalizationReviews?(refs: readonly ResolvedContentRef[]): Promise<Readonly<{ entries: readonly ReviewQueueEntry[]; proofs: AcceptedSimulationFinalization["acceptance"]["reviewProofs"] }>>;
  acceptFinalization?(accepted: AcceptedSimulationFinalization, expected: Readonly<{ revision: number; digest: string }>, lease: DraftStorageLeaseHandle | null, reviewRefs: readonly ResolvedContentRef[]): Promise<"verified" | "conflict" | "unknown" | "not_applied">;
  reconcileAcceptedFinalization?(accepted: AcceptedSimulationFinalization): Promise<"verified" | "not_applied" | "conflict" | "unknown">;
  verifyAcceptedFinalizationProof?(accepted: AcceptedSimulationFinalization, proof: Readonly<{ state: TrainingSessionDraft | AcceptedSimulationFinalization; revision: number; digest: string }>): boolean;
  isDraftStorageLeaseCurrent?(lease: DraftStorageLeaseHandle | null): boolean;
  getResult(sessionId: string): Promise<TrainingSessionResult | null>;
  captureDraftStorageLease(): DraftStorageLeaseHandle | null;
  captureDraftWriteReceipt?(attempt: unknown): DraftWriteReceipt | null;
  saveDraft(input: Readonly<{ draft: TrainingSessionDraft; expectedPreviousRevision: number; lease: DraftStorageLeaseHandle | null }>): Promise<void>;
  reconcileDraftWrite?(receipt: DraftWriteReceipt): Promise<"verified" | "conflict" | "unknown">;
  reconcilePendingMutationWrite?(proof: Readonly<{ commandFingerprint: string; planFingerprint: string; attempt?: unknown }>): Promise<"verified" | "conflict" | "unknown">;
  getPendingMutation?(): Promise<PendingMutationProjection | null>;
}

/** The lifecycle receives a deliberate application projection, never a raw storage record. */
export type PendingMutationProjection = Readonly<{
  operation: JournalOperation;
  status: "journal_durable" | "materialized" | "verified_pending_clear";
  sessionId: string;
  trackId: string;
  commandFingerprint: string;
  planFingerprint: string;
  practiceOutcome?: Readonly<{
    attempt: TrainingAttempt<unknown>;
    submittedResponse: unknown;
    reviewMutations: readonly ReviewMutationCommand[];
  }>;
  practiceCompletion?: Readonly<{ resultId: string }>;
  simulationFinalization?: Readonly<{ frozenDraftRevision: number; resultId: string }>;
}>;

/** The only application dependency allowed to mutate canonical records. */
export interface TrainingMutationCoordinatorPort {
  start(input: PreparedSession): Promise<void>;
  submitPractice(input: PracticeSubmission): Promise<boolean>;
  retryMutationCommand(command: RetryMutationCommandHandle, expectedOperation: RetryableMutationOperation): Promise<void>;
  advance(session: TrainingSession): Promise<void>;
  completeWithResult(input: PracticeFinalization): Promise<void>;
  finalize(input: SimulationFinalization, acceptedFinalization?: AcceptedSimulationFinalization, lease?: DraftStorageLeaseHandle | null): Promise<boolean>;
  abandon(session: TrainingSession, preflight?: () => Promise<void>): Promise<void>;
  recover(): Promise<void>;
  reset(): Promise<void>;
}

export type PremiumSessionAdmissionResult = "allowed" | "denied" | "unavailable";
export interface PremiumSessionAdmissionPort {
  authorize(): Promise<PremiumSessionAdmissionResult>;
}

/** Development audit commands may adjust only an injected application clock. */
export interface RuntimeAuditabilityPort {
  advanceWallClockBy(milliseconds: number): string;
}

export type TrainingLifecyclePorts = Readonly<{
  clock: Readonly<{ now(): string }>;
  sessionIds: TrainingSessionIdentityPort;
  tracks: TrackRegistryPort;
  packages: ContentPackageRuntimePort;
  repositories: TrainingLifecycleRepositoryPort;
  mutations: TrainingMutationCoordinatorPort;
  premiumSessionAdmission?: PremiumSessionAdmissionPort;
  runtimeAuditability?: RuntimeAuditabilityPort;
}>;
