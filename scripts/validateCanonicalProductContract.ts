import Ajv2020 from "ajv/dist/2020";
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseDocument } from "yaml";

import schema from "../docs/canonical-product-contract.schema.json";

export type CanonicalCodingInterviewModeId =
  | "coding-interview-learn-approach"
  | "coding-interview-guided-practice"
  | "coding-interview-custom-practice"
  | "coding-interview-recognize-patterns"
  | "coding-interview-contrast-practice"
  | "coding-interview-weak-area-review"
  | "coding-interview-independent-practice"
  | "coding-interview-simulation";

export type CanonicalCodingInterviewModeLabel =
  | "Learn Approach"
  | "Guided Practice"
  | "Custom Practice"
  | "Recognize Patterns"
  | "Contrast Practice"
  | "Weak Area Review"
  | "Independent Practice"
  | "Interview Simulation";

export type CanonicalCertificationModeId =
  | "certification-diagnostic-baseline"
  | "certification-focus-practice"
  | "certification-scenario-practice"
  | "certification-weak-area-review"
  | "certification-mixed-practice"
  | "certification-quick-review"
  | "certification-exam-simulation";

export type CanonicalCertificationModeLabel =
  | "Diagnostic Baseline"
  | "Focus Practice"
  | "Scenario Practice"
  | "Weak Area Review"
  | "Mixed Practice"
  | "Quick Review"
  | "Exam Simulation";

export type CanonicalUserCommandId =
  | "submit"
  | "next"
  | "save"
  | "save-and-continue"
  | "navigator-jump"
  | "finish"
  | "leave-resumable"
  | "abandon"
  | "recover"
  | "resume"
  | "resume-editing";

export type CanonicalSessionCtaId =
  | "practice-submit"
  | "practice-next"
  | "practice-finish"
  | "practice-leave-resumable"
  | "practice-abandon"
  | "practice-recover"
  | "simulation-save"
  | "simulation-keep-editing"
  | "simulation-save-and-continue"
  | "simulation-navigator-jump"
  | "simulation-finish"
  | "simulation-leave-resumable"
  | "simulation-abandon"
  | "simulation-recover"
  | "session-resume";

export type CanonicalSimulationMutationKind =
  | "save"
  | "navigation"
  | "timer-checkpoint"
  | "foreground-transition"
  | "finalization"
  | "abandonment";

export type CanonicalSimulationTimerLifecycleCheckpoint =
  | "foreground-enter"
  | "foreground-leave"
  | "draft-save"
  | "finalization"
  | "expiry";

export type CanonicalDesignReferenceApprovalStatus = "APPROVED" | "PENDING" | "REJECTED";

export type CanonicalDesignReference = Readonly<{
  id: string;
  screenStateTarget: string;
  patternPath: string;
  version: number;
  approvalStatus: CanonicalDesignReferenceApprovalStatus;
  owner: string;
}>;

export type CanonicalDesignReferenceUiOwnership = Readonly<{
  sourcePathPrefix: string;
  designReferenceId: string;
}>;

export type CanonicalSimulationOperationStatePresentationId =
  | "saving-response"
  | "save-failed"
  | "response-saved-navigation-failed"
  | "finalizing"
  | "finalization-recovery-required";

export type CanonicalSimulationOperationStateCtaPolicy = Readonly<{
  id: CanonicalSimulationOperationStatePresentationId;
  operationStates: readonly CanonicalSimulationSessionState[];
  allowedCtaIds: readonly CanonicalSessionCtaId[];
}>;

export type CanonicalRequirementTest = Readonly<{
  id: string;
  testPath: string;
  testName: string;
  requirementIds: readonly string[];
}>;

export type CanonicalRequirementTestCoverage = Readonly<{
  requirementId: string;
  tests: readonly CanonicalRequirementTest[];
}>;

export type CanonicalEnvironmentAndPublicLinks = Readonly<{
  requiredValues: readonly ["apiOrigin", "publicWebOrigin", "authActionOrigin", "authRedirectDomain", "privacyUrl", "termsUrl", "supportUrl", "publicDeletionUrl", "iosAssociatedDomain", "androidAppLinkHost", "transactionalSenderDomain"];
  supportedEnvironments: readonly ["sandbox", "production"];
  localConfiguration: "unconfiguredFailsClosed";
  defaultFirebaseDomain: "developmentAndSandboxOnly";
  productionDomainAndSender: "releasePromotionInputs";
  ordinaryFirebaseActionCodes: Readonly<{ expiry: "providerControlled"; singleUse: "providerControlled" }>;
  publicDeletionPossessionToken: Readonly<{ expiryMinutes: 30; singleUse: true }>;
  actionHandlerOutcomes: readonly ["valid", "expired", "alreadyUsed", "malformed", "rateLimited", "remoteFailure"];
  accountEnumeration: "prohibited";
}>;

export type CanonicalUserFacingTaskReadinessInput = Readonly<{
  status: "ready" | "not-ready";
  designReferenceId?: string;
}>;

export type CanonicalPracticeSessionState =
  | "unanswered" | "submitting_before_journal" | "submit_journal_failed" | "commit_pending"
  | "commit_materialization_failed" | "commit_verification_failed" | "verified_pending_clear" | "recovery_required"
  | "feedback" | "advancing" | "advance_failed" | "completing" | "completion_failed" | "completed"
  | "abandoning" | "abandonment_failed_before_journal" | "abandonment_recovery_required" | "abandoned";

export type CanonicalSimulationSessionState =
  | "editable" | "saving" | "save_failed" | "stale_revision" | "navigating" | "navigation_failed"
  | "save_and_continue_advance_recovery"
  | "frozen" | "finalization_journal_pending" | "finalization_journal_failed" | "materializing"
  | "materialization_failed" | "verifying" | "verification_failed" | "verified_pending_clear"
  | "recovery_required" | "timer_recovery_failed" | "missing_draft" | "version_mismatch" | "corrupt_state"
  | "abandoning" | "abandonment_failed_before_journal" | "abandonment_recovery_required" | "abandoned" | "completed";

export type CanonicalSessionStateMachineTrigger =
  | "submit" | "next" | "save" | "navigator_jump" | "finish" | "abandon" | "recover"
  | "validation_rejected" | "journal_write_failed" | "submit_verified" | "advance_verified" | "advance_failed"
  | "completion_verified" | "completion_failed" | "abandonment_verified" | "abandonment_before_journal_failed"
  | "abandonment_recovery_required" | "save_verified" | "save_failed" | "stale_revision" | "navigation_verified"
  | "navigation_failed" | "advance_not_verified_after_saved_response" | "reconstruct" | "finalization_started" | "finalization_verified" | "materialization_failed"
  | "materialization_verified" | "verification_failed" | "verification_verified";

export type CanonicalSessionTransition<State extends string> = Readonly<{
  from: State;
  trigger: CanonicalSessionStateMachineTrigger;
  condition?: "durable_state_not_durable" | "journal_status_durable" | "journal_status_materialized" | "journal_status_verified_pending_clear" | "recovered_active_session";
  to: State;
}>;

export type CanonicalAlgorithmScope =
  | "oneMentalUnit"
  | "guidedPracticeBlueprintForSelectedMentalUnit"
  | "declaredRecognitionSet"
  | "declaredContrastSet"
  | "eligibleDueReviewOrCompletedSessionMisses"
  | "declaredInterleavedScope"
  | "fixedSimulationBlueprint";

export type CanonicalCodingInterviewTimer =
  | Readonly<{ kind: "elapsedForeground" }>
  | Readonly<{ kind: "countdownForeground"; durationMs: 2_700_000 }>;

export type CanonicalCustomPracticeContract = Readonly<{
  modeId: "coding-interview-custom-practice";
  contentBlueprintModeId: "coding-interview-guided-practice";
  mentalUnitSelection: "explicit";
  reinsertOwnership: "profile";
  lifecycle: "sharedOneActiveSession";
}>;

export type CanonicalCodingInterviewReinsertPolicy = Readonly<{
  version: 1;
  eligibleResultKinds: readonly ["incorrect", "partial"];
  maxReinsertsPerSource: 1;
  minInterveningDurableSubmissions: 3;
  variantSelectionOrder: readonly ["compatibleReviewedVariant", "exactSourceFallback"];
  missingValidSlot: "skip";
}>;

export type CanonicalCodingInterviewMode = Readonly<{
  id: CanonicalCodingInterviewModeId;
  label: CanonicalCodingInterviewModeLabel;
  lengths: Readonly<{
    default: 10 | 20 | 40;
    supported: readonly (10 | 20 | 40)[];
  }>;
  scope: CanonicalAlgorithmScope;
  shortening: "allowed" | "blueprintControlled" | "prohibited";
  feedback: Readonly<{
    default: "afterEachAnswer" | "atSessionEnd";
    supported: readonly ("afterEachAnswer" | "atSessionEnd")[];
  }>;
  timer: CanonicalCodingInterviewTimer;
  reinsert: boolean;
}>;

export type CanonicalCertificationDiagnosticConfiguration = Readonly<{
  setupControls: readonly string[];
  sessionLength: 40;
  selectionScope: "fixedDiagnosticBlueprint";
  feedbackTiming: "afterEachDurableSubmit";
  timer: "elapsedForeground";
  shortening: "prohibited";
  reinsert: false;
  reviewBehavior: "domainBreakdown";
  summaryMetrics: readonly string[];
  permittedActions: readonly string[];
}>;

export type CanonicalCertificationFocusConfiguration = Readonly<{
  setupControls: readonly ["topic", "sessionLength"];
  sessionLengths: readonly [10, 20, 40];
  selectionScope: "explicitCloudDomain";
  feedbackTiming: "afterEachDurableSubmit";
  timer: "elapsedForeground";
  shortening: "allowedWithinSelectedTopic";
  reinsert: false;
  reviewBehavior: "domainBreakdown";
  summaryMetrics: readonly string[];
  permittedActions: readonly string[];
}>;

export type CanonicalCertificationScenarioConfiguration = Readonly<{
  setupControls: readonly ["competency", "sessionLength"];
  sessionLengths: readonly [10, 20, 40];
  selectionScope: "explicitApprovedScenarioCompetency";
  feedbackTiming: "afterEachDurableSubmit";
  timer: "elapsedForeground";
  shortening: "allowedWithinSelectedCompetency";
  reinsert: false;
  reviewBehavior: "domainBreakdown";
  summaryMetrics: readonly string[];
  permittedActions: readonly string[];
}>;

export type CanonicalCertificationWeakAreaReviewConfiguration = Readonly<{
  setupControls: readonly ["sessionLength"];
  sessionLengths: readonly [10, 20];
  selectionScope: "eligibleDueReviewEvidence";
  feedbackTiming: "afterEachDurableSubmit";
  timer: "elapsedForeground";
  shortening: "allowedWithinEligibleReviewEvidence";
  reinsert: false;
  reviewBehavior: "resolveAfterTwoConsecutiveDueReviewSuccesses";
  summaryMetrics: readonly string[];
  permittedActions: readonly string[];
}>;

export type CanonicalCertificationMixedPracticeConfiguration = Readonly<{
  setupControls: readonly ["sessionLength"];
  sessionLengths: readonly [10, 20, 40];
  selectionScope: "explicitUniqueInterleavedBlueprint";
  feedbackTiming: "afterEachDurableSubmit";
  timer: "elapsedForeground";
  shortening: "allowedWithinInterleavedBlueprint";
  reinsert: false;
  reviewBehavior: "domainBreakdown";
  summaryMetrics: readonly string[];
  permittedActions: readonly string[];
}>;

export type CanonicalCertificationQuickReviewConfiguration = Readonly<{
  setupControls: readonly [];
  sessionLength: 10;
  selectionScope: "earliestTenEligibleDueReviewEvidence";
  feedbackTiming: "afterEachDurableSubmit";
  timer: "elapsedForeground";
  shortening: "allowedWithinEligibleReviewEvidence";
  reinsert: false;
  reviewBehavior: "resolveAfterTwoConsecutiveDueReviewSuccesses";
  summaryMetrics: readonly string[];
  permittedActions: readonly string[];
}>;

export type CanonicalCertificationMode = Readonly<{
  id: CanonicalCertificationModeId;
  label: CanonicalCertificationModeLabel;
  owner: Readonly<{
    familyId: "certification";
    trackId: "google-cloud-associate-cloud-engineer";
  }>;
  configuration?: CanonicalCertificationDiagnosticConfiguration | CanonicalCertificationFocusConfiguration | CanonicalCertificationScenarioConfiguration | CanonicalCertificationWeakAreaReviewConfiguration | CanonicalCertificationMixedPracticeConfiguration | CanonicalCertificationQuickReviewConfiguration;
}>;

export type CanonicalAccountLifecycleOperation = Readonly<{
  id: string;
  surfaceId: string;
  from: readonly string[];
  inProgress: string;
  success: string;
  failureTransitions: readonly Readonly<{
    failures: readonly string[];
    to: string;
  }>[];
}>;

export type CanonicalAccountDataContract = Readonly<{
  version: 1;
  publicLaunchEntry: Readonly<Record<string, string | boolean>>;
  credentials: Readonly<Record<string, string>>;
  lifecycle: Readonly<{
    initialState: string;
    states: readonly string[];
    operations: readonly CanonicalAccountLifecycleOperation[];
    enumerationPolicy: string;
    resendVerificationResult: string;
    changePendingEmailResult: string;
    verificationLink: Readonly<Record<string, string | number | boolean>>;
    recoveryLink: Readonly<Record<string, string | number | boolean>>;
    publicDeletionLink: Readonly<Record<string, string | number | boolean>>;
  }>;
  dataAuthority: Readonly<{
    localDurabilityAuthority: string;
    remoteConvergenceAuthority: string;
    synchronizationBoundary: string;
    localCommitBeforeRemoteAcknowledgement: string;
    parallelLearningRepository: string;
    indexPolicy: string;
    recordClasses: readonly Readonly<{ id: string; owner: string; remoteSync: string }>[];
    derivedProjections: readonly Readonly<{ id: string; sources: readonly string[]; writable: string; remoteSync: string }>[];
  }>;
  adoption: Readonly<{
    requiresPreviewAndConfirmation: boolean;
    cases: readonly Readonly<{ id: string; result: string }>[];
    recordPolicies: Readonly<Record<string, string>>;
    cancelledOrFailedResult: string;
  }>;
  sync: Readonly<Record<string, string | readonly string[]>>;
  offlineAndExpiry: Readonly<Record<string, string | readonly string[]>>;
  signOutAndDeletion: Readonly<Record<string, unknown>>;
  surfaces: readonly Readonly<{ id: string; states: readonly string[] }>[];
  networkAndPrivacy: Readonly<Record<string, unknown>>;
}>;

export type CanonicalProductContract = Readonly<{
  version: number;
  contractId: "patternly-product-contract";
  authority: Readonly<{
    normativeSource: "canonical-product-contract";
    narrativeDocuments: "non-normative";
  }>;
  requirements: readonly Readonly<{
    id: string;
    statement: string;
  }>[];
  requirementTestCoverage: Readonly<{
    version: 1;
    tests: readonly CanonicalRequirementTest[];
  }>;
  commercialEntitlement: Readonly<Record<string, unknown>>;
  guestAndFree: Readonly<Record<string, unknown>>;
  identityAndAccountSecurity: Readonly<Record<string, unknown>>;
  environmentAndPublicLinks: CanonicalEnvironmentAndPublicLinks;
  learningOwnershipAndSync: Readonly<Record<string, unknown>>;
  productSurfacesAndGoals: Readonly<Record<string, unknown>>;
  learningProducts: Readonly<Record<string, unknown>>;
  contentPackages: Readonly<Record<string, unknown>>;
  analyticsAndReports: Readonly<Record<string, unknown>>;
  backupAndRestore: Readonly<Record<string, unknown>>;
  platformRelease: Readonly<Record<string, unknown>>;
  designAuthority: Readonly<Record<string, unknown>>;
  accountData: CanonicalAccountDataContract;
  userCommands: Readonly<{
    commands: readonly Readonly<{ id: CanonicalUserCommandId }>[];
    sessionCtaMappings: readonly Readonly<{
      ctaId: CanonicalSessionCtaId;
      commandId: CanonicalUserCommandId;
    }>[];
  }>;
  sessionStateMachine: Readonly<{
    practice: Readonly<{
      initialState: "unanswered";
      states: readonly CanonicalPracticeSessionState[];
      transitions: readonly CanonicalSessionTransition<CanonicalPracticeSessionState>[];
    }>;
    simulation: Readonly<{
      initialState: "editable";
      states: readonly CanonicalSimulationSessionState[];
      transitions: readonly CanonicalSessionTransition<CanonicalSimulationSessionState>[];
    }>;
  }>;
  simulationConcurrency: Readonly<{
    scope: "oneActiveSessionPerDevice";
    queueDiscipline: "fifo";
    maxInFlight: 1;
    revalidateActiveSessionAtExecution: true;
    mutationKinds: readonly CanonicalSimulationMutationKind[];
  }>;
  simulationTimerCadence: Readonly<{
    version: 1;
    uiRefreshIntervalMs: 1_000;
    uiRefreshWritesDurably: false;
    durableCheckpointIntervalMs: 15_000;
    maxDurableCheckpointDriftMs: 1_000;
    lifecycleCheckpoints: readonly CanonicalSimulationTimerLifecycleCheckpoint[];
  }>;
  designReferences: Readonly<{
    version: 2;
    references: readonly CanonicalDesignReference[];
    uiOwnership: readonly CanonicalDesignReferenceUiOwnership[];
  }>;
  simulationOperationStateCtas: Readonly<{
    version: 1;
    policies: readonly CanonicalSimulationOperationStateCtaPolicy[];
  }>;
  codingInterview: Readonly<{
    customPractice: CanonicalCustomPracticeContract;
    reinsertPolicy: CanonicalCodingInterviewReinsertPolicy;
    modes: readonly CanonicalCodingInterviewMode[];
  }>;
  certification: Readonly<{
    modes: readonly CanonicalCertificationMode[];
  }>;
}>;

export class CanonicalProductContractValidationError extends Error {
  override name = "CanonicalProductContractValidationError";
}

export class CanonicalUserFacingTaskReadinessError extends Error {
  override name = "CanonicalUserFacingTaskReadinessError";
}

const validateSchema = new Ajv2020({ allErrors: true, strict: true }).compile(schema);

const codingInterviewModeLabels: Readonly<Record<CanonicalCodingInterviewModeId, CanonicalCodingInterviewModeLabel>> = {
  "coding-interview-learn-approach": "Learn Approach",
  "coding-interview-guided-practice": "Guided Practice",
  "coding-interview-custom-practice": "Custom Practice",
  "coding-interview-recognize-patterns": "Recognize Patterns",
  "coding-interview-contrast-practice": "Contrast Practice",
  "coding-interview-weak-area-review": "Weak Area Review",
  "coding-interview-independent-practice": "Independent Practice",
  "coding-interview-simulation": "Interview Simulation",
};

const certificationModeLabels: Readonly<Record<CanonicalCertificationModeId, CanonicalCertificationModeLabel>> = {
  "certification-diagnostic-baseline": "Diagnostic Baseline",
  "certification-focus-practice": "Focus Practice",
  "certification-scenario-practice": "Scenario Practice",
  "certification-weak-area-review": "Weak Area Review",
  "certification-mixed-practice": "Mixed Practice",
  "certification-quick-review": "Quick Review",
  "certification-exam-simulation": "Exam Simulation",
};

const canonicalSessionCtaCommands: Readonly<Record<CanonicalSessionCtaId, CanonicalUserCommandId>> = {
  "practice-submit": "submit",
  "practice-next": "next",
  "practice-finish": "finish",
  "practice-leave-resumable": "leave-resumable",
  "practice-abandon": "abandon",
  "practice-recover": "recover",
  "simulation-save": "save",
  "simulation-keep-editing": "resume-editing",
  "simulation-save-and-continue": "save-and-continue",
  "simulation-navigator-jump": "navigator-jump",
  "simulation-finish": "finish",
  "simulation-leave-resumable": "leave-resumable",
  "simulation-abandon": "abandon",
  "simulation-recover": "recover",
  "session-resume": "resume",
};

const canonicalPracticeSessionStates: readonly CanonicalPracticeSessionState[] = [
  "unanswered", "submitting_before_journal", "submit_journal_failed", "commit_pending", "commit_materialization_failed", "commit_verification_failed", "verified_pending_clear", "recovery_required", "feedback", "advancing", "advance_failed", "completing", "completion_failed", "completed", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned",
];

const canonicalSimulationSessionStates: readonly CanonicalSimulationSessionState[] = [
  "editable", "saving", "save_failed", "stale_revision", "navigating", "navigation_failed", "save_and_continue_advance_recovery", "frozen", "finalization_journal_pending", "finalization_journal_failed", "materializing", "materialization_failed", "verifying", "verification_failed", "verified_pending_clear", "recovery_required", "timer_recovery_failed", "missing_draft", "version_mismatch", "corrupt_state", "abandoning", "abandonment_failed_before_journal", "abandonment_recovery_required", "abandoned", "completed",
];

const canonicalSimulationMutationKinds: readonly CanonicalSimulationMutationKind[] = [
  "save", "navigation", "timer-checkpoint", "foreground-transition", "finalization", "abandonment",
];

const canonicalSimulationTimerLifecycleCheckpoints: readonly CanonicalSimulationTimerLifecycleCheckpoint[] = [
  "foreground-enter", "foreground-leave", "draft-save", "finalization", "expiry",
];

const canonicalSimulationOperationStatePresentationIds: readonly CanonicalSimulationOperationStatePresentationId[] = [
  "saving-response", "save-failed", "response-saved-navigation-failed", "finalizing", "finalization-recovery-required",
];

const canonicalAccountLifecycleOperationIds = [
  "register", "verifyIdentity", "resendVerification", "changePendingEmail", "signIn", "requestRecovery", "resetPassword", "completeInitialSync", "enterOffline", "restoreNetwork", "expireSession", "reauthenticate", "signOut", "deleteAccount", "completeRemoteDeletionCleanup",
] as const;

const canonicalAccountLifecycleSurfaceByOperation = {
  register: "register",
  verifyIdentity: "verifyIdentity",
  resendVerification: "verifyIdentity",
  changePendingEmail: "verifyIdentity",
  signIn: "signIn",
  requestRecovery: "forgotPassword",
  resetPassword: "resetPassword",
  completeInitialSync: "dataAdoption",
  enterOffline: "syncStatus",
  restoreNetwork: "syncStatus",
  expireSession: "sessionExpiredReauthentication",
  reauthenticate: "sessionExpiredReauthentication",
  signOut: "signOut",
  deleteAccount: "deleteAccount",
  completeRemoteDeletionCleanup: "syncStatus",
} as const;

const canonicalAccountRecordClassIds = [
  "storageMetadata", "accountBinding", "syncMetadataAndOutbox", "applicationSettings", "notificationSettings", "activeTrack", "activeSessionReference", "trainingSession", "trainingSessionResult", "trainingAttempt", "reviewQueueEntry", "simulationDraft", "foregroundTimer", "mutationJournal", "accountDeletionIntent",
] as const;

const canonicalAccountDerivedProjectionIds = ["familyNeutralEvidence", "familyProgress"] as const;

const canonicalAccountAdoptionCaseIds = [
  "emptyLocalEmptyRemote", "populatedLocalEmptyRemote", "emptyLocalPopulatedRemote", "populatedLocalPopulatedRemote", "activeGuestSession", "divergentRecord",
] as const;

const canonicalAccountSurfaceIds = [
  "accountEntry", "register", "verifyIdentity", "signIn", "forgotPassword", "resetPassword", "sessionExpiredReauthentication", "accountProfile", "dataAdoption", "syncStatus", "signOut", "deleteAccount", "publicDeleteRequest",
] as const;

const canonicalPracticeSessionTransitions: readonly CanonicalSessionTransition<CanonicalPracticeSessionState>[] = [
  { from: "unanswered", trigger: "submit", to: "submitting_before_journal" }, { from: "unanswered", trigger: "abandon", to: "abandoning" },
  { from: "submitting_before_journal", trigger: "validation_rejected", to: "unanswered" }, { from: "submitting_before_journal", trigger: "journal_write_failed", to: "submit_journal_failed" }, { from: "submitting_before_journal", trigger: "materialization_failed", to: "commit_materialization_failed" }, { from: "submitting_before_journal", trigger: "verification_failed", to: "commit_verification_failed" }, { from: "submitting_before_journal", trigger: "submit_verified", to: "feedback" },
  { from: "submit_journal_failed", trigger: "submit", to: "submitting_before_journal" },
  { from: "commit_pending", trigger: "recover", to: "unanswered" }, { from: "commit_materialization_failed", trigger: "recover", to: "feedback" }, { from: "commit_verification_failed", trigger: "recover", to: "feedback" }, { from: "verified_pending_clear", trigger: "recover", to: "feedback" }, { from: "recovery_required", trigger: "recover", to: "unanswered" },
  { from: "feedback", trigger: "next", to: "advancing" }, { from: "feedback", trigger: "abandon", to: "abandoning" }, { from: "feedback", trigger: "finish", to: "completing" },
  { from: "advancing", trigger: "advance_verified", to: "unanswered" }, { from: "advancing", trigger: "advance_failed", to: "advance_failed" }, { from: "advance_failed", trigger: "next", to: "advancing" },
  { from: "completing", trigger: "completion_verified", to: "completed" }, { from: "completing", trigger: "completion_failed", to: "completion_failed" }, { from: "completion_failed", trigger: "finish", condition: "durable_state_not_durable", to: "completing" }, { from: "completion_failed", trigger: "recover", condition: "journal_status_durable", to: "completing" }, { from: "completion_failed", trigger: "recover", condition: "journal_status_materialized", to: "completing" }, { from: "completion_failed", trigger: "recover", condition: "journal_status_verified_pending_clear", to: "completing" },
  { from: "abandoning", trigger: "abandonment_verified", to: "abandoned" }, { from: "abandoning", trigger: "abandonment_before_journal_failed", to: "abandonment_failed_before_journal" }, { from: "abandoning", trigger: "abandonment_recovery_required", to: "abandonment_recovery_required" }, { from: "abandonment_failed_before_journal", trigger: "abandon", to: "abandoning" },
];

const canonicalSimulationSessionTransitions: readonly CanonicalSessionTransition<CanonicalSimulationSessionState>[] = [
  { from: "editable", trigger: "save", to: "saving" }, { from: "editable", trigger: "navigator_jump", to: "navigating" }, { from: "editable", trigger: "finish", to: "frozen" }, { from: "editable", trigger: "abandon", to: "abandoning" },
  { from: "saving", trigger: "save_verified", to: "editable" }, { from: "saving", trigger: "save_failed", to: "save_failed" }, { from: "saving", trigger: "stale_revision", to: "stale_revision" }, { from: "save_failed", trigger: "save", to: "saving" }, { from: "stale_revision", trigger: "save", to: "saving" },
  { from: "navigating", trigger: "navigation_verified", to: "editable" }, { from: "navigating", trigger: "navigation_failed", to: "navigation_failed" }, { from: "navigating", trigger: "advance_not_verified_after_saved_response", to: "save_and_continue_advance_recovery" }, { from: "navigation_failed", trigger: "navigator_jump", condition: "durable_state_not_durable", to: "navigating" }, { from: "navigation_failed", trigger: "reconstruct", condition: "journal_status_durable", to: "materializing" }, { from: "navigation_failed", trigger: "reconstruct", condition: "journal_status_materialized", to: "verifying" }, { from: "navigation_failed", trigger: "reconstruct", condition: "journal_status_verified_pending_clear", to: "verified_pending_clear" }, { from: "save_and_continue_advance_recovery", trigger: "recover", to: "navigating" },
  { from: "frozen", trigger: "finalization_started", to: "finalization_journal_pending" }, { from: "finalization_journal_pending", trigger: "finalization_verified", to: "completed" }, { from: "finalization_journal_pending", trigger: "journal_write_failed", to: "finalization_journal_failed" }, { from: "finalization_journal_pending", trigger: "materialization_failed", to: "materialization_failed" }, { from: "finalization_journal_pending", trigger: "verification_failed", to: "verification_failed" }, { from: "finalization_journal_failed", trigger: "finish", to: "frozen" }, { from: "materializing", trigger: "recover", condition: "recovered_active_session", to: "editable" }, { from: "verifying", trigger: "recover", condition: "recovered_active_session", to: "editable" }, { from: "verified_pending_clear", trigger: "recover", condition: "recovered_active_session", to: "editable" },
  { from: "abandoning", trigger: "abandonment_verified", to: "abandoned" }, { from: "abandoning", trigger: "abandonment_before_journal_failed", to: "abandonment_failed_before_journal" }, { from: "abandoning", trigger: "abandonment_recovery_required", to: "abandonment_recovery_required" }, { from: "abandonment_failed_before_journal", trigger: "abandon", to: "abandoning" }, { from: "abandonment_recovery_required", trigger: "reconstruct", condition: "journal_status_durable", to: "materializing" }, { from: "abandonment_recovery_required", trigger: "reconstruct", condition: "journal_status_materialized", to: "verifying" }, { from: "abandonment_recovery_required", trigger: "reconstruct", condition: "journal_status_verified_pending_clear", to: "verified_pending_clear" },
];

function hasExactValues<T>(actual: readonly T[], expected: readonly T[]): boolean {
  return actual.length === expected.length && actual.every((value, index) => value === expected[index]);
}

function hasExactTransitions<State extends string>(actual: readonly CanonicalSessionTransition<State>[], expected: readonly CanonicalSessionTransition<State>[]): boolean {
  return actual.length === expected.length && actual.every((transition, index) => {
    const expectedTransition = expected[index];
    return expectedTransition !== undefined && transition.from === expectedTransition.from && transition.trigger === expectedTransition.trigger && transition.condition === expectedTransition.condition && transition.to === expectedTransition.to;
  });
}

export type CanonicalSessionTransitionInput =
  | Readonly<{ family: "practice"; from: CanonicalPracticeSessionState; trigger: CanonicalSessionStateMachineTrigger; condition?: CanonicalSessionTransition<string>["condition"]; to: CanonicalPracticeSessionState }>
  | Readonly<{ family: "simulation"; from: CanonicalSimulationSessionState; trigger: CanonicalSessionStateMachineTrigger; condition?: CanonicalSessionTransition<string>["condition"]; to: CanonicalSimulationSessionState }>;

export type CanonicalSimulationMutationAdmissionInput = Readonly<{
  kind: string;
  inFlightKinds: readonly string[];
}>;

/** A transition is valid only when the closed contract declares its complete edge. */
export function isDeclaredCanonicalSessionTransition(contract: CanonicalProductContract, input: CanonicalSessionTransitionInput): boolean {
  const transitions = input.family === "practice" ? contract.sessionStateMachine.practice.transitions : contract.sessionStateMachine.simulation.transitions;
  return transitions.some((transition) => transition.from === input.from && transition.trigger === input.trigger && transition.condition === input.condition && transition.to === input.to);
}

/** A simulation mutation may start only when its one active-session lane is empty. */
export function canStartCanonicalSimulationMutation(contract: CanonicalProductContract, input: CanonicalSimulationMutationAdmissionInput): boolean {
  const concurrency = contract.simulationConcurrency;
  const isKnownKind = (kind: string): kind is CanonicalSimulationMutationKind => concurrency.mutationKinds.includes(kind as CanonicalSimulationMutationKind);
  return concurrency.scope === "oneActiveSessionPerDevice"
    && concurrency.queueDiscipline === "fifo"
    && concurrency.maxInFlight === 1
    && concurrency.revalidateActiveSessionAtExecution
    && isKnownKind(input.kind)
    && input.inFlightKinds.every(isKnownKind)
    && input.inFlightKinds.length < concurrency.maxInFlight;
}

/** A ready user-facing task must identify a registered reference that is explicitly approved. */
export function resolveCanonicalUserFacingTaskDesignReference(
  contract: CanonicalProductContract,
  input: CanonicalUserFacingTaskReadinessInput,
): CanonicalDesignReference | undefined {
  if (input.status !== "ready") return undefined;
  if (!input.designReferenceId) {
    throw new CanonicalUserFacingTaskReadinessError("A ready user-facing task must name a design reference.");
  }

  const reference = contract.designReferences.references.find((candidate) => candidate.id === input.designReferenceId);
  if (!reference) {
    throw new CanonicalUserFacingTaskReadinessError(`A ready user-facing task names an unknown design reference: ${input.designReferenceId}`);
  }
  if (reference.approvalStatus !== "APPROVED" || reference.owner !== "product-owner") {
    throw new CanonicalUserFacingTaskReadinessError(`A ready user-facing task requires an APPROVED design reference: ${input.designReferenceId}`);
  }
  return reference;
}

/** Returns the complete, closed requirement-to-test index derived from canonical test declarations. */
export function getCanonicalRequirementTestCoverage(contract: CanonicalProductContract): readonly CanonicalRequirementTestCoverage[] {
  return contract.requirements.map((requirement) => ({
    requirementId: requirement.id,
    tests: contract.requirementTestCoverage.tests.filter((test) => test.requirementIds.includes(requirement.id)),
  }));
}

/** Validates that every declared requirement is covered by real, uniquely identified tests. */
export function validateCanonicalRequirementTestCoverage(contract: CanonicalProductContract): void {
  const requirementIds = new Set(contract.requirements.map((requirement) => requirement.id));
  const tests = contract.requirementTestCoverage.tests;
  const duplicateTestId = tests.find((test, index) => tests.findIndex((candidate) => candidate.id === test.id) !== index);
  if (duplicateTestId) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical requirement test identifier: ${duplicateTestId.id}`);
  }

  const testWithUnknownRequirement = tests.find((test) => test.requirementIds.find((requirementId) => !requirementIds.has(requirementId)) !== undefined);
  if (testWithUnknownRequirement) {
    const requirementId = testWithUnknownRequirement.requirementIds.find((candidate) => !requirementIds.has(candidate));
    throw new CanonicalProductContractValidationError(`Canonical requirement test references an unknown requirement: ${testWithUnknownRequirement.id} -> ${requirementId}`);
  }

  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const testRoot = resolve(repositoryRoot, "tests");
  const testWithEscapedPath = tests.find((test) => {
    const path = resolve(repositoryRoot, test.testPath);
    const relativePath = relative(testRoot, path);
    return relativePath === "" || relativePath === ".." || relativePath.startsWith("../") || relativePath.startsWith("..\\") || isAbsolute(relativePath);
  });
  if (testWithEscapedPath) {
    throw new CanonicalProductContractValidationError(`Canonical requirement test path must resolve within tests: ${testWithEscapedPath.testPath}`);
  }

  const testWithMissingSource = tests.find((test) => {
    const path = resolve(repositoryRoot, test.testPath);
    return !existsSync(path) || !statSync(path).isFile();
  });
  if (testWithMissingSource) {
    throw new CanonicalProductContractValidationError(`Canonical requirement test path does not resolve to a file: ${testWithMissingSource.testPath}`);
  }

  const testWithMissingName = tests.find((test) => !readFileSync(resolve(repositoryRoot, test.testPath), "utf8").includes(`test(${JSON.stringify(test.testName)}`));
  if (testWithMissingName) {
    throw new CanonicalProductContractValidationError(`Canonical requirement test name does not resolve in its test path: ${testWithMissingName.id}`);
  }

  const uncoveredRequirement = getCanonicalRequirementTestCoverage(contract).find((coverage) => coverage.tests.length === 0);
  if (uncoveredRequirement) {
    throw new CanonicalProductContractValidationError(`Canonical requirement has no mapped test: ${uncoveredRequirement.requirementId}`);
  }
}

export function parseCanonicalProductContract(source: string): CanonicalProductContract {
  const document = parseDocument(source, { uniqueKeys: true });
  if (document.errors.length > 0) {
    throw new CanonicalProductContractValidationError(`Invalid canonical product contract YAML: ${document.errors.map((error) => error.message).join("; ")}`);
  }

  const contract: unknown = document.toJS();
  if (!validateSchema(contract)) {
    throw new CanonicalProductContractValidationError(`Invalid canonical product contract: ${validateSchema.errors?.map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`).join("; ")}`);
  }

  const requirementIds = (contract as CanonicalProductContract).requirements.map((requirement) => requirement.id);
  const duplicateIds = requirementIds.filter((id, index) => requirementIds.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract requirement identifier: ${duplicateIds[0]}`);
  }

  validateCanonicalRequirementTestCoverage(contract as CanonicalProductContract);

  const target = contract as CanonicalProductContract;
  const commercial = target.commercialEntitlement;
  if (commercial.freeAccess !== "permanent"
    || !hasExactValues(commercial.premiumProducts as readonly string[], ["fixedDuration30Day", "fixedDuration90Day", "recurring"])
    || commercial.entitlement !== "oneAccountBoundPremiumForAllPremiumContentInAllTracks"
    || commercial.tiers !== "prohibited"
    || commercial.trackSlots !== "prohibited"
    || commercial.storeFreeTrialRequired !== false
    || commercial.purchaseRequires !== "verifiedPatternlyAccount"
    || commercial.guestPurchase !== "prohibited"
    || commercial.revenueCatAppUserId !== "stableOpaquePatternlyAccountIdNeverEmail"
    || !hasExactValues(commercial.authorityChain as readonly string[], ["storeTransaction", "revenueCatNormalization", "patternlyBackendProjection", "boundedDeviceCache"])
    || commercial.paidDownloadAuthority !== "patternlyBackendEntitlementOnly"
    || commercial.crossPlatformPremium !== "required"
    || commercial.offlineVerificationGraceDays !== 7
    || commercial.deviceMayNotAdvanceVerifiedAt !== true
    || commercial.startedEntitledSessionCompletion !== "allowedOnStartingDevice"
    || commercial.downgradeHistory !== "remainsReadableAndIndependentOfEntitlement"
    || commercial.restorePurchases !== "storeThenRevenueCatThenBackendWithExplicitAccountConflict"
    || commercial.accountDeletionStoreBilling !== "independentNoAutomaticCancelRefundOrExpiry"
    || !hasExactValues(commercial.deletionChoices as readonly string[], ["manageSubscription", "deleteNow", "scheduleAtPaidPeriodEndWhenSupported"])) {
    throw new CanonicalProductContractValidationError("Canonical commercial contract must preserve one Free/Premium entitlement and store-to-backend authority without tiers or track slots");
  }

  const guest = target.guestAndFree;
  const guestAdoption = guest.adoption as Readonly<Record<string, unknown>>;
  if (guest.guestIdentity !== "localInstallation"
    || guest.installationRecord !== "opaqueInstallationIdAndLocalDatasetIdGuestBoundBeforeRecovery"
    || guest.firebaseAnonymousAuthentication !== "prohibited"
    || guest.firstLearningValueRequiresAccount !== false
    || guest.freeNodePerProductionTrack !== "exactlyOne"
    || guest.completeFreeNodeBundled !== "required"
    || guest.freeNodeExperienceProfile !== "trackOwnedVersionedClosedSubsetOfCompleteValidModes"
    || !hasExactValues(guest.allowedCapabilities as readonly string[], ["trackSwitching", "goals", "attempts", "review", "activity", "progress", "settings", "offlineLearning"])
    || !hasExactValues(guest.prohibitedCapabilities as readonly string[], ["synchronization", "crossDeviceRestore", "premiumPurchase", "premiumPackageDownload", "uninstallRecovery"])
    || guest.freeSessionContent !== "freeNodeOnlyWithoutPremiumFiller"
    || guest.freeReviewContent !== "eligibleFreeNodeEvidenceOnly"
    || !(guest.prohibitedCapabilities as readonly string[]).includes("premiumPurchase")
    || !(guest.prohibitedCapabilities as readonly string[]).includes("premiumPackageDownload")
    || guestAdoption.preview !== "required"
    || guestAdoption.confirmation !== "explicit"
    || guestAdoption.newEmptyAccountDefault !== "preserveGuestData"
    || guestAdoption.discard !== "explicitDestructiveChoice"
    || guestAdoption.existingAccount !== "deterministicLocalVersusAccountPlan"
    || guestAdoption.silentMergeOrDiscard !== "prohibited"
    || guestAdoption.convergenceVerification !== "requiredBeforeBinding"
    || guestAdoption.activeGuestSession !== "finishOrExplicitlyAbandonBeforeAdoption") {
    throw new CanonicalProductContractValidationError("Canonical guest contract must provide local first value, strict Free filtering, and explicit lossless adoption");
  }

  const identity = target.identityAndAccountSecurity;
  if (!hasExactValues(identity.methods as readonly string[], ["emailPassword", "signInWithApple", "signInWithGoogle", "recoveryCodes"])
    || identity.identity !== "oneFirebaseUidAndOnePatternlyAccount"
    || identity.providerLinking !== "proofThroughExistingUsableMethod"
    || identity.automaticMergeByEmail !== "prohibited"
    || identity.unlinkLastUsableMethod !== "prohibited"
    || identity.recoveryCodeCount !== 8
    || identity.recoveryCodeStorage !== "strongHashesAndMetadataOnly"
    || identity.recoveryCodeDisplay !== "once"
    || identity.recoveryCodeReuse !== "prohibited"
    || identity.regenerateInvalidatesPriorCodes !== true
    || identity.recoverySession !== "narrowShortLived"
    || identity.successfulRecovery !== "newCredentialOrProviderThenRevokeAllPriorSessions"
    || identity.manualSupportTakeoverWithoutMethodOrCode !== "prohibited"
    || identity.passwordAndEmailChange !== "recentReauthenticationWithNewEmailVerification"
    || identity.signOutAllDevices !== "revokeRefreshTokensAndEnforceRevocationForProtectedApi"
    || identity.termsAcceptance !== "versionedAndSeparateFromAnalyticsConsent") {
    throw new CanonicalProductContractValidationError("Canonical identity contract must preserve linked providers, eight hashed recovery codes, and revocation enforcement");
  }

  const links = target.environmentAndPublicLinks;
  const ordinaryCodes = links.ordinaryFirebaseActionCodes;
  const deletionToken = links.publicDeletionPossessionToken;
  if (!hasExactValues(links.requiredValues, ["apiOrigin", "publicWebOrigin", "authActionOrigin", "authRedirectDomain", "privacyUrl", "termsUrl", "supportUrl", "publicDeletionUrl", "iosAssociatedDomain", "androidAppLinkHost", "transactionalSenderDomain"])
    || !hasExactValues(links.supportedEnvironments, ["sandbox", "production"])
    || links.localConfiguration !== "unconfiguredFailsClosed"
    || ordinaryCodes.expiry !== "providerControlled" || ordinaryCodes.singleUse !== "providerControlled"
    || deletionToken.expiryMinutes !== 30 || deletionToken.singleUse !== true
    || links.defaultFirebaseDomain !== "developmentAndSandboxOnly"
    || links.productionDomainAndSender !== "releasePromotionInputs"
    || !hasExactValues(links.actionHandlerOutcomes, ["valid", "expired", "alreadyUsed", "malformed", "rateLimited", "remoteFailure"])
    || links.accountEnumeration !== "prohibited") {
    throw new CanonicalProductContractValidationError("Canonical public-link contract must keep ordinary action codes provider-controlled and only deletion possession at thirty minutes");
  }

  const syncTarget = target.learningOwnershipAndSync;
  if (syncTarget.activeSessionLimit !== "onePerDeviceAcrossTracks"
    || syncTarget.currentTrackId !== "accountOwnedAndSynchronized"
    || syncTarget.independentActiveSessionsAcrossDevices !== "allowed"
    || syncTarget.crossDeviceActiveSessionResume !== "prohibited"
    || !hasExactValues(syncTarget.deviceOnlyRecords as readonly string[], ["activeSessionPointer", "activeSession", "draft", "currentPosition", "foregroundTimer", "mutationJournal"])
    || syncTarget.deviceOnlyRemoteSync !== "never"
    || !hasExactValues(syncTarget.mutationOrder as readonly string[], ["validate", "persistLocalJournal", "materializeAndVerifyLocalRecords", "clearLocalJournal", "enqueueCompactIdempotentOperation", "synchronizeOpportunistically"])
    || !hasExactValues(syncTarget.syncTriggers as readonly string[], ["coldStart", "networkReturn", "staleForegroundReturn", "terminalSessionEnd", "goalChange", "currentTrackChange", "entitlementUpdate", "explicitRetry"])
    || syncTarget.backgroundSyncPromise !== "prohibited"
    || syncTarget.transfer !== "incrementalPaginated"
    || !hasExactValues(syncTarget.bootstrapProjection as readonly string[], ["accountProfile", "entitlement", "currentTrack", "goals", "perTrackProgress", "currentTrackDueReview", "recentActivity", "revisionCursors"])
    || syncTarget.exactHistory !== "onDemandAndLocallyCached"
    || !hasExactValues(syncTarget.canonicalFacts as readonly string[], ["terminalSessionSummary", "attempts", "results", "reviewMutations", "stableContentReferences"])
    || syncTarget.derivedProjections !== "rebuildableNeverSoleAuthority") {
    throw new CanonicalProductContractValidationError("Canonical synchronization contract must keep active session state device-owned and use incremental explicit-trigger synchronization");
  }

  const surfaces = target.productSurfacesAndGoals;
  const goals = surfaces.goals as Readonly<Record<string, unknown>>;
  if (!hasExactValues(surfaces.primaryTabs as readonly string[], ["Today", "Practice", "Progress", "Settings"])
    || surfaces.activity !== "nestedUnderProgress"
    || surfaces.launchLanguage !== "EnglishOnly"
    || surfaces.languageRoute !== "absentUntilRealSecondLanguage"
    || surfaces.todayJob !== "oneMostUsefulExecutableNextAction"
    || surfaces.practiceJob !== "manualCurrentTrackLearningWorkspace"
    || surfaces.progressJob !== "evidenceOfHowLearningChanges"
    || surfaces.activityJob !== "paginatedTerminalSessionHistory"
    || surfaces.manualSessionChoicePrecedence !== "wins"
    || !hasExactValues(surfaces.recommendationPriority as readonly string[], ["resumeActiveLocalSession", "overdueReview", "missingWeeklyPlanSession", "repeatedHighSignalMistake", "continueCurrentNode", "nextRoadmapNode"])
    || goals.ownership !== "perTrack"
    || goals.invalidTemplates !== "prohibited"
    || !hasExactValues(goals.affects as readonly string[], ["recommendations", "weeklyPlanning", "reminders", "suggestedSessionCadence"])
    || !hasExactValues(goals.doesNotAffect as readonly string[], ["entitlement", "contentLocking", "scoring", "mastery", "streaks", "punitiveMessaging"])) {
    throw new CanonicalProductContractValidationError("Canonical surface contract must use four primary tabs, nested Activity, and non-entitling per-track goals");
  }

  const products = target.learningProducts;
  const families = products.families as Readonly<Record<string, unknown>>;
  const codingInterview = products.codingInterview as Readonly<Record<string, unknown>>;
  if (!hasExactValues(families.ids as readonly string[], ["certification", "coding_interview", "design_interview"])
    || families.userVisible !== false
    || !hasExactValues(products.launchTrackScope as readonly string[], ["coding-interview-dsa-problem-solving", "backend-system-design-interview", "object-oriented-design-interview", "frontend-system-design-interview", "google-cloud-associate-cloud-engineer", "aws-certified-solutions-architect-associate", "microsoft-azure-administrator-associate-az-104", "microsoft-azure-ai-fundamentals-ai-901"])
    || !hasExactValues(products.targetTracks as readonly string[], ["coding-interview-dsa-problem-solving", "backend-system-design-interview", "object-oriented-design-interview", "frontend-system-design-interview", "google-cloud-associate-cloud-engineer", "aws-certified-solutions-architect-associate", "microsoft-azure-administrator-associate-az-104", "microsoft-azure-ai-fundamentals-ai-901"])
    || !hasExactValues(products.targetTrackBriefRequiredFields as readonly string[], ["jobToBeDone", "targetLearner", "internalFamily", "taxonomyOutline", "freeNodeId", "validModes", "goalTemplates", "progressDimensions", "packageContentPlan", "launchCommercialGate"])
    || products.emptyPlaceholderOrComingSoonTracks !== "prohibited"
    || products.productionRegistryAdmission !== "realFreeVerticalAndCompleteCoreLoop"
    || products.representativeProofsBeforeBroadCopying !== "required"
    || codingInterview.targetFamilyId !== "coding_interview"
    || codingInterview.userFacingName !== "Coding Interview: DSA & Problem Solving"
    || codingInterview.permanentAlgorithmsAlias !== "prohibited"
    || codingInterview.migration !== "atomicOrBoundedPrerequisiteBeforeRegistryAdmission"
    || codingInterview.productBoundary !== "strategyFirstNotOnlineJudge"
    || codingInterview.implementationPlanningObjective !== "mandatory") {
    throw new CanonicalProductContractValidationError("Canonical learning products must keep internal-only families, one exact eight-track launch scope, and the Coding Interview boundary without aliases or placeholders");
  }

  const packages = target.contentPackages;
  if (packages.freeNodes !== "bundledComplete"
    || packages.premiumUnit !== "immutableCompressedWholeNodePackage"
    || packages.objectStore !== "cloudStorage"
    || packages.manifestStore !== "firestore"
    || packages.authorization !== "cloudRunIdentityAndBackendEntitlement"
    || packages.downloadUrl !== "shortLivedSigned"
    || packages.perQuestionFirestoreFetching !== "prohibited"
    || !hasExactValues(packages.manifestRequiredFields as readonly string[], ["trackId", "nodeId", "contentReleaseId", "packageVersion", "schemaVersion", "promptLocale", "feedbackLocale", "itemCount", "compressedSize", "sha256", "immutableObjectIdentityGeneration", "minimumAppVersion", "publishedAt"])
    || packages.publishedMutation !== "prohibited"
    || packages.correction !== "newObjectAndVersion"
    || !hasExactValues(packages.activationOrder as readonly string[], ["temporaryDownload", "checksumVerification", "schemaValidation", "semanticValidation", "versionedPersistence", "atomicPointerActivation"])
    || packages.validationFailure !== "retainPreviousVerifiedPackage"
    || packages.sessionVersionPinning !== "exact"
    || packages.silentVersionSubstitution !== "prohibited"
    || packages.reviewResolution !== "groupReferencesByPackageAndFetchOnlyMissingVerifiedPackages"
    || packages.cacheEviction !== "neverRemoveActiveSessionPinnedPackage"
    || packages.freeNodePackageAdmission !== "immutableFactualProfileAndClosureEvidenceOnly"
    || packages.futureLocales !== "reuseStableEvidenceIdentities") {
    throw new CanonicalProductContractValidationError("Canonical package contract must use immutable authorized whole-node packages with verified atomic activation and exact pinning");
  }

  const analytics = target.analyticsAndReports;
  const reports = analytics.contentReports as Readonly<Record<string, unknown>>;
  if (analytics.analyticsProvider !== "firebaseAnalytics"
    || analytics.crashProvider !== "firebaseCrashlytics"
    || analytics.consentGate !== "failClosed"
    || analytics.termsAsAnalyticsConsent !== "prohibited"
    || analytics.rawFirestoreEventStream !== "prohibited"
    || analytics.eventVocabulary !== "closed"
    || !hasExactValues(analytics.forbiddenEventFields as readonly string[], ["email", "password", "token", "promptText", "optionText", "learnerResponse", "reason", "details", "draft", "reportFreeText", "rawPrivateException", "storePurchaseToken"])
    || reports.accountLinkDefault !== "unlinked"
    || !hasExactValues(reports.requiredUserFields as readonly string[], ["category", "description"])
    || !hasExactValues(reports.automaticContext as readonly string[], ["reportId", "itemId", "releasePackageId", "trackNode", "modeRoute", "locales", "appBuild", "platform", "timestamp"])
    || reports.accountOrContactLink !== "explicitOptIn"
    || !hasExactValues(reports.prohibitedAutomaticAttachments as readonly string[], ["learnerResponse", "fullPrompt", "fullFeedback", "email", "accountId"])
    || reports.ordinaryRawRetentionDays !== 30
    || reports.importantRetention !== "untilFixReleasedPlus30Days"
    || reports.identifiableRawMaximumDays !== 180
    || !hasExactValues(reports.offlineStates as readonly string[], ["queued", "retry", "failed", "accepted"])) {
    throw new CanonicalProductContractValidationError("Canonical analytics and report contract must fail closed and prohibit automatic private learning or identity attachments");
  }

  const backup = target.backupAndRestore;
  if (backup.firestorePitrDays !== 7
    || backup.purpose !== "disasterRecoveryNotUserAccountRecovery"
    || backup.scheduledLongTermExportAtLaunch !== "prohibited"
    || backup.restoreRunbook !== "required"
    || backup.sanitizedSandboxDrill !== "required"
    || backup.deletionTombstoneReconciliation !== "required"
    || backup.deletedAccountResurrection !== "prohibited"
    || backup.localPlatformBackupForCanonicalLearningAndCache !== "excluded") {
    throw new CanonicalProductContractValidationError("Canonical backup contract must preserve seven-day PITR and prohibit deleted-account resurrection");
  }

  const platform = target.platformRelease;
  if (platform.expoSdkBeforeFinalFreeze !== 57
    || platform.iosMinimum !== "16.4"
    || platform.iosDevices !== "iPhoneOnly"
    || platform.ipadSupportClaim !== "prohibited"
    || platform.androidMinimumApi !== 28
    || platform.androidTargetApi !== 36
    || platform.orientation !== "portrait"
    || !hasExactValues(platform.appearances as readonly string[], ["Light", "Dark", "System"])
    || platform.textScalingPercent !== 200
    || platform.evidenceDevices !== "phonesOnly"
    || platform.physicalDeviceEvidence !== "optionalNonBlocking") {
    throw new CanonicalProductContractValidationError("Canonical platform contract must preserve the exact phone-only release matrix");
  }

  const design = target.designAuthority;
  if (design.brand !== "onePatternlyBrand"
    || design.trackIdentity !== "subordinateAccentsAndSharedGrammarSymbolsNotSubBrands"
    || design.qualityTarget !== "focusedFlagshipSoloSustainable"
    || design.visualTerritory !== "dispersedAmbiguityToRecognizedOrderedPattern"
    || design.mark !== "emergingPThroughStructureAndNegativeSpace"
    || design.illustration !== "sparseDiagrammaticSharedPrimitives"
    || design.motion !== "restrainedFunctionalWithReducedMotion"
    || design.haptics !== "sparseSemanticAfterVerifiedBoundaries"
    || !hasExactValues(design.figmaSpaces as readonly string[], ["PatternlyBrandLab", "PatternlyDesignSystem", "PatternlyProduct"])
    || design.exploration !== "threeDirectionsToTwoFinalistsToOneSystem"
    || design.actualVisualApprovalAuthority !== "productOwnerOnly"
    || !hasExactValues(design.handoffStates as readonly string[], ["FIGMA_DRAFT", "FIGMA_REVIEW", "FIGMA_APPROVED", "IMPLEMENTED", "VISUALLY_VERIFIED", "HANDED_OFF", "CODE_CANONICAL"])
    || design.figmaProductionDependency !== "prohibited"
    || design.storybookProductionDependency !== "prohibited"
    || design.storybook !== "developmentOnlyProductionComponentsTypedFixtures"
    || design.postHandoffOperationalAuthority !== "repositoryTokensAssetsProductionComponentsStorybookTestsAndBaselines"
    || design.paidFigmaOrdinaryDevelopmentDependencyAfterHandoff !== "prohibited") {
    throw new CanonicalProductContractValidationError("Canonical design authority must require owner approval, repository handoff, and no production Figma or Storybook dependency");
  }

  const accountData = (contract as CanonicalProductContract).accountData;
  if (!hasExactValues(accountData.lifecycle.operations.map((operation) => operation.id), canonicalAccountLifecycleOperationIds)) {
    throw new CanonicalProductContractValidationError("Canonical account lifecycle must declare exactly its operations in canonical order");
  }
  const operationWithWrongSurface = accountData.lifecycle.operations.find((operation) =>
    canonicalAccountLifecycleSurfaceByOperation[operation.id as keyof typeof canonicalAccountLifecycleSurfaceByOperation] !== operation.surfaceId,
  );
  if (operationWithWrongSurface) {
    throw new CanonicalProductContractValidationError(`Canonical account lifecycle operation maps to the wrong surface: ${operationWithWrongSurface.id}`);
  }
  const enterOffline = accountData.lifecycle.operations.find((operation) => operation.id === "enterOffline");
  const hasCanonicalEnterOffline = Boolean(
    enterOffline &&
    hasExactValues(enterOffline.from, ["authenticatedReady"]) &&
    enterOffline.inProgress === "offlineAuthenticated" &&
    enterOffline.success === "offlineAuthenticated",
  );
  const invalidOfflineEdge = accountData.lifecycle.operations.find((operation) => {
    const targets = [
      operation.inProgress,
      operation.success,
      ...operation.failureTransitions.map((transition) => transition.to),
    ];
    if (!targets.includes("offlineAuthenticated")) return false;
    const isCanonicalEntry = operation.id === "enterOffline" && hasCanonicalEnterOffline;
    const isTrueOfflineSelfLoop = operation.from.every((state) => state === "offlineAuthenticated");
    return !isCanonicalEntry && !isTrueOfflineSelfLoop;
  });
  if (!hasCanonicalEnterOffline || invalidOfflineEdge) {
    throw new CanonicalProductContractValidationError("Canonical account lifecycle must prohibit offline entry before successful initial sync");
  }
  if (!hasExactValues(accountData.dataAuthority.recordClasses.map((recordClass) => recordClass.id), canonicalAccountRecordClassIds)) {
    throw new CanonicalProductContractValidationError("Canonical account data authority must declare exactly its record classes in canonical order");
  }
  const deviceSessionRecords = new Map(accountData.dataAuthority.recordClasses.map((recordClass) => [recordClass.id, recordClass]));
  if (deviceSessionRecords.get("activeSessionReference")?.owner !== "device" || deviceSessionRecords.get("activeSessionReference")?.remoteSync !== "never"
    || deviceSessionRecords.get("trainingSession")?.owner !== "device" || deviceSessionRecords.get("trainingSession")?.remoteSync !== "terminalFactsOnly"
    || deviceSessionRecords.get("simulationDraft")?.owner !== "device" || deviceSessionRecords.get("simulationDraft")?.remoteSync !== "never"
    || deviceSessionRecords.get("foregroundTimer")?.owner !== "device" || deviceSessionRecords.get("foregroundTimer")?.remoteSync !== "never"
    || deviceSessionRecords.get("mutationJournal")?.remoteSync !== "never") {
    throw new CanonicalProductContractValidationError("Canonical active session pointer, session, draft, timer, and mutation journal must remain device-owned and unsynchronized");
  }
  if (!hasExactValues(accountData.dataAuthority.derivedProjections.map((projection) => projection.id), canonicalAccountDerivedProjectionIds)) {
    throw new CanonicalProductContractValidationError("Canonical account data authority must declare exactly its derived projections in canonical order");
  }
  if (!hasExactValues(accountData.adoption.cases.map((adoptionCase) => adoptionCase.id), canonicalAccountAdoptionCaseIds)) {
    throw new CanonicalProductContractValidationError("Canonical account adoption contract must declare exactly its cases in canonical order");
  }
  if (!hasExactValues(accountData.surfaces.map((surface) => surface.id), canonicalAccountSurfaceIds)) {
    throw new CanonicalProductContractValidationError("Canonical account surface map must declare exactly its surfaces in canonical order");
  }
  const operationWithUnsourcedFailure = accountData.lifecycle.operations.find((operation) => {
    const surface = accountData.surfaces.find((candidate) => candidate.id === operation.surfaceId);
    return !surface || operation.failureTransitions.some((transition) => transition.failures.some((failure) => !surface.states.includes(failure)));
  });
  if (operationWithUnsourcedFailure) {
    throw new CanonicalProductContractValidationError(`Canonical account lifecycle failure is missing from its surface: ${operationWithUnsourcedFailure.id}`);
  }

  const userCommandIds = (contract as CanonicalProductContract).userCommands.commands.map((command) => command.id);
  const duplicateUserCommandIds = userCommandIds.filter((id, index) => userCommandIds.indexOf(id) !== index);
  if (duplicateUserCommandIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract user command identifier: ${duplicateUserCommandIds[0]}`);
  }

  const sessionCtaMappings = (contract as CanonicalProductContract).userCommands.sessionCtaMappings;
  const sessionCtaIds = sessionCtaMappings.map((mapping) => mapping.ctaId);
  const duplicateSessionCtaIds = sessionCtaIds.filter((id, index) => sessionCtaIds.indexOf(id) !== index);
  if (duplicateSessionCtaIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract session CTA identifier: ${duplicateSessionCtaIds[0]}`);
  }

  const mappingWithUnknownCommand = sessionCtaMappings.find((mapping) => !userCommandIds.includes(mapping.commandId));
  if (mappingWithUnknownCommand) {
    throw new CanonicalProductContractValidationError(`Canonical session CTA must reference a declared user command: ${mappingWithUnknownCommand.ctaId}`);
  }

  const missingSessionCta = (Object.keys(canonicalSessionCtaCommands) as CanonicalSessionCtaId[]).find(
    (ctaId) => !sessionCtaIds.includes(ctaId),
  );
  if (missingSessionCta) {
    throw new CanonicalProductContractValidationError(`Canonical session CTA is missing exactly one command mapping: ${missingSessionCta}`);
  }

  const sessionCtaWithWrongCommand = sessionCtaMappings.find(
    (mapping) => canonicalSessionCtaCommands[mapping.ctaId] !== mapping.commandId,
  );
  if (sessionCtaWithWrongCommand) {
    throw new CanonicalProductContractValidationError(`Canonical session CTA command mapping does not match its intent: ${sessionCtaWithWrongCommand.ctaId}`);
  }

  const stateMachine = (contract as CanonicalProductContract).sessionStateMachine;
  if (!hasExactValues(stateMachine.practice.states, canonicalPracticeSessionStates)) {
    throw new CanonicalProductContractValidationError("Canonical Practice session state machine must declare exactly the durable operation states in canonical order");
  }
  if (!hasExactValues(stateMachine.simulation.states, canonicalSimulationSessionStates)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation session state machine must declare exactly the durable operation states in canonical order");
  }
  if (!hasExactTransitions(stateMachine.practice.transitions, canonicalPracticeSessionTransitions)) {
    throw new CanonicalProductContractValidationError("Canonical Practice session state machine must declare exactly its allowed triggered transitions");
  }
  if (!hasExactTransitions(stateMachine.simulation.transitions, canonicalSimulationSessionTransitions)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation session state machine must declare exactly its allowed triggered transitions");
  }

  const simulationConcurrency = (contract as CanonicalProductContract).simulationConcurrency;
  if (!hasExactValues(simulationConcurrency.mutationKinds, canonicalSimulationMutationKinds)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation concurrency contract must declare exactly its serialized mutation kinds in canonical order");
  }

  const simulationTimerCadence = (contract as CanonicalProductContract).simulationTimerCadence;
  if (!hasExactValues(simulationTimerCadence.lifecycleCheckpoints, canonicalSimulationTimerLifecycleCheckpoints)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation timer cadence must declare exactly its lifecycle checkpoints in canonical order");
  }

  const operationStateCtas = (contract as CanonicalProductContract).simulationOperationStateCtas;
  if (!hasExactValues(operationStateCtas.policies.map((policy) => policy.id), canonicalSimulationOperationStatePresentationIds)) {
    throw new CanonicalProductContractValidationError("Canonical Simulation operation-state CTA policies must declare exactly the approved presentation states in canonical order");
  }
  const policyWithDuplicateOperationState = operationStateCtas.policies.find((policy) => new Set(policy.operationStates).size !== policy.operationStates.length);
  if (policyWithDuplicateOperationState) {
    throw new CanonicalProductContractValidationError(`Canonical Simulation operation-state CTA policy duplicates an operation state: ${policyWithDuplicateOperationState.id}`);
  }
  const policyWithDuplicateCta = operationStateCtas.policies.find((policy) => new Set(policy.allowedCtaIds).size !== policy.allowedCtaIds.length);
  if (policyWithDuplicateCta) {
    throw new CanonicalProductContractValidationError(`Canonical Simulation operation-state CTA policy duplicates a CTA: ${policyWithDuplicateCta.id}`);
  }

  const designReferences = (contract as CanonicalProductContract).designReferences.references;
  const duplicateDesignReferenceIds = designReferences
    .map((reference) => reference.id)
    .filter((id, index, ids) => ids.indexOf(id) !== index);
  if (duplicateDesignReferenceIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical design reference identifier: ${duplicateDesignReferenceIds[0]}`);
  }
  const uiOwnership = (contract as CanonicalProductContract).designReferences.uiOwnership;
  const duplicateUiOwnershipPrefixes = uiOwnership
    .map((ownership) => ownership.sourcePathPrefix)
    .filter((prefix, index, prefixes) => prefixes.indexOf(prefix) !== index);
  if (duplicateUiOwnershipPrefixes.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical design reference UI ownership prefix: ${duplicateUiOwnershipPrefixes[0]}`);
  }
  const ownershipWithUnknownReference = uiOwnership.find((ownership) => !designReferences.some((reference) => reference.id === ownership.designReferenceId));
  if (ownershipWithUnknownReference) {
    throw new CanonicalProductContractValidationError(`Canonical design reference UI ownership names an unknown reference: ${ownershipWithUnknownReference.designReferenceId}`);
  }

  const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const designRoot = resolve(repositoryRoot, "docs/designs");
  const escapedPattern = designReferences.find((reference) => {
    const path = resolve(repositoryRoot, reference.patternPath);
    const relativePath = relative(designRoot, path);
    return relativePath === "" || relativePath === ".." || relativePath.startsWith("../") || relativePath.startsWith("..\\") || isAbsolute(relativePath);
  });
  if (escapedPattern) {
    throw new CanonicalProductContractValidationError(`Canonical design reference pattern path must resolve within docs/designs: ${escapedPattern.patternPath}`);
  }

  const missingPattern = designReferences.find((reference) => {
    const path = resolve(repositoryRoot, reference.patternPath);
    return !existsSync(path) || !statSync(path).isFile();
  });
  if (missingPattern) {
    throw new CanonicalProductContractValidationError(`Canonical design reference pattern path does not resolve to a file: ${missingPattern.patternPath}`);
  }

  const codingInterviewModeIds = (contract as CanonicalProductContract).codingInterview.modes.map((mode) => mode.id);
  const duplicateCodingInterviewModeIds = codingInterviewModeIds.filter((id, index) => codingInterviewModeIds.indexOf(id) !== index);
  if (duplicateCodingInterviewModeIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract Coding Interview mode identifier: ${duplicateCodingInterviewModeIds[0]}`);
  }

  const modeWithMismatchedLabel = (contract as CanonicalProductContract).codingInterview.modes.find(
    (mode) => codingInterviewModeLabels[mode.id] !== mode.label,
  );
  if (modeWithMismatchedLabel) {
    throw new CanonicalProductContractValidationError(`Coding Interview mode label does not match its identifier: ${modeWithMismatchedLabel.id}`);
  }

  const certificationModeIds = (contract as CanonicalProductContract).certification.modes.map((mode) => mode.id);
  const duplicateCertificationModeIds = certificationModeIds.filter((id, index) => certificationModeIds.indexOf(id) !== index);
  if (duplicateCertificationModeIds.length > 0) {
    throw new CanonicalProductContractValidationError(`Duplicate canonical product contract Certification mode identifier: ${duplicateCertificationModeIds[0]}`);
  }

  const certificationModeWithMismatchedLabel = (contract as CanonicalProductContract).certification.modes.find(
    (mode) => certificationModeLabels[mode.id] !== mode.label,
  );
  if (certificationModeWithMismatchedLabel) {
    throw new CanonicalProductContractValidationError(`Certification mode label does not match its identifier: ${certificationModeWithMismatchedLabel.id}`);
  }
  const diagnosticBaseline = (contract as CanonicalProductContract).certification.modes.find((mode) => mode.id === "certification-diagnostic-baseline");
  if (!diagnosticBaseline || !diagnosticBaseline.configuration || !("sessionLength" in diagnosticBaseline.configuration) || diagnosticBaseline.configuration.sessionLength !== 40 || diagnosticBaseline.configuration.shortening !== "prohibited" || diagnosticBaseline.configuration.reinsert || diagnosticBaseline.configuration.timer !== "elapsedForeground" || diagnosticBaseline.configuration.feedbackTiming !== "afterEachDurableSubmit" || diagnosticBaseline.configuration.setupControls.length !== 0) {
    throw new CanonicalProductContractValidationError("Certification Diagnostic Baseline must preserve its approved fixed 40-item shared-practice configuration.");
  }
  const focusPractice = (contract as CanonicalProductContract).certification.modes.find((mode) => mode.id === "certification-focus-practice");
  if (!focusPractice || !focusPractice.configuration || !("sessionLengths" in focusPractice.configuration) || !hasExactValues(focusPractice.configuration.setupControls, ["topic", "sessionLength"]) || !hasExactValues(focusPractice.configuration.sessionLengths, [10, 20, 40]) || focusPractice.configuration.selectionScope !== "explicitCloudDomain" || focusPractice.configuration.shortening !== "allowedWithinSelectedTopic" || focusPractice.configuration.reinsert || focusPractice.configuration.timer !== "elapsedForeground" || focusPractice.configuration.feedbackTiming !== "afterEachDurableSubmit") {
    throw new CanonicalProductContractValidationError("Certification Focus Practice must preserve its explicit single-domain shared-practice configuration.");
  }
  const scenarioPractice = (contract as CanonicalProductContract).certification.modes.find((mode) => mode.id === "certification-scenario-practice");
  if (!scenarioPractice || !scenarioPractice.configuration || !("sessionLengths" in scenarioPractice.configuration) || !hasExactValues(scenarioPractice.configuration.setupControls, ["competency", "sessionLength"]) || !hasExactValues(scenarioPractice.configuration.sessionLengths, [10, 20, 40]) || scenarioPractice.configuration.selectionScope !== "explicitApprovedScenarioCompetency" || scenarioPractice.configuration.shortening !== "allowedWithinSelectedCompetency" || scenarioPractice.configuration.reinsert || scenarioPractice.configuration.timer !== "elapsedForeground" || scenarioPractice.configuration.feedbackTiming !== "afterEachDurableSubmit") {
    throw new CanonicalProductContractValidationError("Certification Scenario Practice must preserve its explicit approved-competency shared-practice configuration.");
  }
  const weakAreaReview = (contract as CanonicalProductContract).certification.modes.find((mode) => mode.id === "certification-weak-area-review");
  if (!weakAreaReview || !weakAreaReview.configuration || !("sessionLengths" in weakAreaReview.configuration) || !hasExactValues(weakAreaReview.configuration.setupControls, ["sessionLength"]) || !hasExactValues(weakAreaReview.configuration.sessionLengths, [10, 20]) || weakAreaReview.configuration.selectionScope !== "eligibleDueReviewEvidence" || weakAreaReview.configuration.shortening !== "allowedWithinEligibleReviewEvidence" || weakAreaReview.configuration.reinsert || weakAreaReview.configuration.timer !== "elapsedForeground" || weakAreaReview.configuration.feedbackTiming !== "afterEachDurableSubmit" || weakAreaReview.configuration.reviewBehavior !== "resolveAfterTwoConsecutiveDueReviewSuccesses") {
    throw new CanonicalProductContractValidationError("Certification Weak Area Review must preserve its due-evidence shared-practice configuration.");
  }
  const mixedPractice = (contract as CanonicalProductContract).certification.modes.find((mode) => mode.id === "certification-mixed-practice");
  if (!mixedPractice || !mixedPractice.configuration || !("sessionLengths" in mixedPractice.configuration) || !hasExactValues(mixedPractice.configuration.setupControls, ["sessionLength"]) || !hasExactValues(mixedPractice.configuration.sessionLengths, [10, 20, 40]) || mixedPractice.configuration.selectionScope !== "explicitUniqueInterleavedBlueprint" || mixedPractice.configuration.shortening !== "allowedWithinInterleavedBlueprint" || mixedPractice.configuration.reinsert || mixedPractice.configuration.timer !== "elapsedForeground" || mixedPractice.configuration.feedbackTiming !== "afterEachDurableSubmit" || mixedPractice.configuration.reviewBehavior !== "domainBreakdown") {
    throw new CanonicalProductContractValidationError("Certification Mixed Practice must preserve its unique interleaved shared-practice configuration.");
  }

  const modeWithUnsupportedDefaultLength = (contract as CanonicalProductContract).codingInterview.modes.find(
    (mode) => !mode.lengths.supported.includes(mode.lengths.default),
  );
  if (modeWithUnsupportedDefaultLength) {
    throw new CanonicalProductContractValidationError(`Coding Interview mode default length must be supported: ${modeWithUnsupportedDefaultLength.id}`);
  }

  const modeWithUnsupportedDefaultFeedback = (contract as CanonicalProductContract).codingInterview.modes.find(
    (mode) => !mode.feedback.supported.includes(mode.feedback.default),
  );
  if (modeWithUnsupportedDefaultFeedback) {
    throw new CanonicalProductContractValidationError(`Coding Interview mode default feedback must be supported: ${modeWithUnsupportedDefaultFeedback.id}`);
  }

  const customPractice = (contract as CanonicalProductContract).codingInterview.customPractice;
  const customPracticeMode = (contract as CanonicalProductContract).codingInterview.modes.find(
    (mode) => mode.id === customPractice.modeId,
  );
  if (!customPracticeMode) {
    throw new CanonicalProductContractValidationError("Custom Practice contract must reference its declared Coding Interview mode");
  }

  const customPracticeHasExpectedModeConfiguration =
    hasExactValues(customPracticeMode.lengths.supported, [10, 20, 40]) &&
    customPracticeMode.lengths.default === 20 &&
    hasExactValues(customPracticeMode.feedback.supported, ["afterEachAnswer", "atSessionEnd"]) &&
    customPracticeMode.feedback.default === "afterEachAnswer" &&
    customPracticeMode.scope === "guidedPracticeBlueprintForSelectedMentalUnit" &&
    customPracticeMode.reinsert;
  if (!customPracticeHasExpectedModeConfiguration) {
    throw new CanonicalProductContractValidationError("Custom Practice mode must preserve its declared lengths, feedback, Guided Practice mental-unit blueprint, and reinsert profile");
  }

  return contract as CanonicalProductContract;
}

export function loadCanonicalProductContract(): CanonicalProductContract {
  const contractPath = resolve(dirname(fileURLToPath(import.meta.url)), "../docs/canonical-product-contract.yaml");
  return parseCanonicalProductContract(readFileSync(contractPath, "utf8"));
}
