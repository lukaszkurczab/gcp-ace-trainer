import { getTrainingLifecycleUseCases } from "../trainingLifecycle";
import { ExactContentArtifactUnavailableError, TrainingApplicationFailure, type ExactArtifactIdentity } from "../trainingLifecycle/contracts";
import type { TrainingSession } from "../../domain";
import { recoverPendingMutation } from "../learningMutations";
import { canPersistTrainingSessionDraft } from "../../domain";
import {
  ApplicationBootstrapStage,
  BootstrapInvariantError,
  describeOperationalFailure,
  observeBootstrapFailure,
  type BootstrapRecoveryStepObserver,
  type BootstrapDiagnosticObserver,
} from "../operationalDiagnostics";
import { encryptedStorageFailureCode, type EncryptedStorageFailureCode } from "../../infrastructure/storage/encryptedStorageBootstrap";
import { cleanupOrphanedAccountDataExports } from "../account/accountDataExportService";
import {
  CanonicalRepositoryBootstrapStep,
  type CanonicalRepositoryBootstrapDependencies,
  StorageMetadataError,
  getActiveTrainingSession,
  getActiveTrainingSessionDraft,
  getTrainingSessions,
  getUnavailableActiveRecords,
  abandonUnavailableActiveSession,
  openCanonicalRepositories,
} from "../../storage/repositories";

export type ApplicationBootstrapState =
  | Readonly<{ kind: "ready"; activeSessionId: string | null }>
  | Readonly<{ kind: "home_ready_resume_unavailable"; activeSessionId: string; reason: "premium_entitlement_denied" | "premium_entitlement_unavailable" }>
  | Readonly<{ kind: "content_identity_unavailable"; sessionIds: readonly string[]; exactMissingIdentity?: ExactArtifactIdentity }>
  | Readonly<{ kind: "blocking"; reason: string; storageFailureCode?: EncryptedStorageFailureCode }>;
export type ActiveSessionResumeOutcome = Readonly<{ kind: "premium_resume_unavailable"; reason: "premium_entitlement_denied" | "premium_entitlement_unavailable" }>;
export type ApplicationBootstrapDependencies = Readonly<{
  repositories?: CanonicalRepositoryBootstrapDependencies;
  diagnosticObserver?: BootstrapDiagnosticObserver;
  recoveryStepObserver?: BootstrapRecoveryStepObserver;
}>;

export { ApplicationBootstrapStage } from "../operationalDiagnostics";

/** Application command boundary for an unavailable active session. */
export async function abandonUnavailableActiveTrainingSession(sessionId: string): Promise<void> {
  await abandonUnavailableActiveSession(sessionId);
}

/**
 * The bootstrap sequence is deliberately linear.  Do not make recovery or
 * repository validation parallel with navigation or content resolution.
 */
export async function bootstrapApplication(
  prepareContentPackages: () => Promise<unknown>,
  resolveActiveSession: (sessionId: string) => Promise<void | ActiveSessionResumeOutcome>,
  prepareLifecycle?: (observeRecoveryStep?: BootstrapRecoveryStepObserver) => Promise<void>,
  dependencies: ApplicationBootstrapDependencies = {},
): Promise<ApplicationBootstrapState> {
  let stage = ApplicationBootstrapStage.OpeningStorage;
  let currentRepositoryStep: CanonicalRepositoryBootstrapStep | undefined;
  let resumingSession: TrainingSession | null = null;
  const reportRecoveryStep: BootstrapRecoveryStepObserver = (step) => {
    try { dependencies.recoveryStepObserver?.(step); } catch { /* Diagnostics are best-effort. */ }
  };
  try {
    const repositoryDependencies = dependencies.repositories;
    await openCanonicalRepositories({
      ...repositoryDependencies,
      onStep: (step) => {
        currentRepositoryStep = step;
        try { repositoryDependencies?.onStep?.(step); } catch { /* diagnostic observers are best-effort */ }
      },
    });
    // Profile storage is selected while opening repositories. Clean only after
    // that selection so a launch never removes another profile's export.
    try { cleanupOrphanedAccountDataExports(); } catch { /* cache cleanup is retried on the next launch */ }
    currentRepositoryStep = undefined;
    const unavailableActive = (await getUnavailableActiveRecords()).value;
    if (unavailableActive.length > 0) {
      return {
        kind: "content_identity_unavailable",
        sessionIds: Object.freeze(unavailableActive.map((record) => record.sessionId)),
      };
    }
    stage = ApplicationBootstrapStage.RecoveringLearningState;
    if (prepareLifecycle) {
      await prepareLifecycle(reportRecoveryStep);
      const lifecycle = getTrainingLifecycleUseCases();
      reportRecoveryStep("pending_journal_recovery");
      await lifecycle.recoverPendingJournal();
      reportRecoveryStep(null);
      reportRecoveryStep("active_session_read");
      const activeAfterRecovery = await getActiveTrainingSession();
      reportRecoveryStep(null);
      if (activeAfterRecovery) {
        reportRecoveryStep("operation_projection_reconstruction");
        await lifecycle.reconstructOperationProjection(activeAfterRecovery);
        reportRecoveryStep(null);
      }
    } else {
      // Test-only/headless bootstrap has no lifecycle composition to install.
      await recoverPendingMutation();
    }
    stage = ApplicationBootstrapStage.VerifyingContent;
    await prepareContentPackages();
    // A Cloud Exam may pass its absolute deadline while the process is not
    // running. Resolve that terminal state before deciding whether there is a
    // resumable active session.
    stage = ApplicationBootstrapStage.ValidatingActiveSession;
    if (prepareLifecycle) await getTrainingLifecycleUseCases().finalizeExpiredSimulationIfDue();
    const activeSession = await getActiveTrainingSession();
    resumingSession = activeSession;
    const sessions = (await getTrainingSessions()).value;
    const activeRecords = sessions.filter((session) => session.status === "active");
    if (!activeSession && activeRecords.length > 0) {
      throw new BootstrapInvariantError("active_session_records_without_reference", "An active training session exists without an active-session reference.");
    }
    if (activeSession && (activeRecords.length !== 1 || activeRecords[0]?.id !== activeSession.id)) {
      throw new BootstrapInvariantError("active_session_reference_inconsistent", "The active-session reference is inconsistent with canonical session records.");
    }
    if (!activeSession) return { kind: "ready", activeSessionId: null };
    const draft = await getActiveTrainingSessionDraft();
    if (canPersistTrainingSessionDraft(activeSession) && !draft) {
      throw new BootstrapInvariantError("active_session_draft_missing", "The active session requires a missing canonical draft.");
    }
    if (draft && (draft.sessionId !== activeSession.id || draft.trackId !== activeSession.trackId)) {
      throw new BootstrapInvariantError("active_session_draft_mismatch", "The canonical draft does not match the active session.");
    }
    stage = ApplicationBootstrapStage.ResumingSession;
    const resumeOutcome = await resolveActiveSession(activeSession.id);
    if (resumeOutcome?.kind === "premium_resume_unavailable") {
      const [latestActiveSession, latestSessions, latestDraft] = await Promise.all([
        getActiveTrainingSession(),
        getTrainingSessions(),
        getActiveTrainingSessionDraft(),
      ]);
      const latestActiveRecords = latestSessions.value.filter((session) => session.status === "active");
      if (!sameJsonSnapshot(activeSession, latestActiveSession)
        || latestActiveRecords.length !== 1 || latestActiveRecords[0]?.id !== activeSession.id
        || !sameJsonSnapshot(draft, latestDraft)) {
        throw new BootstrapInvariantError("active_session_changed_during_resume", "The active session changed while its Premium access was being checked.");
      }
      return { kind: "home_ready_resume_unavailable", activeSessionId: activeSession.id, reason: resumeOutcome.reason };
    }
    return { kind: "ready", activeSessionId: activeSession.id };
  } catch (error) {
    if (stage === ApplicationBootstrapStage.ResumingSession && resumingSession && error instanceof TrainingApplicationFailure
      && error.code === "resume_unavailable" && error.cause instanceof ExactContentArtifactUnavailableError
      && sameExactIdentity(error.cause.identity, resumingSession)) {
      observeBootstrapFailure(dependencies.diagnosticObserver, stage, error, currentRepositoryStep);
      return {
        kind: "content_identity_unavailable",
        sessionIds: Object.freeze([resumingSession.id]),
        exactMissingIdentity: Object.freeze({
          trackId: resumingSession.trackId,
          contentVersion: resumingSession.contentVersion,
          artifactSha256: resumingSession.artifactSha256,
        }),
      };
    }
    const storageFailureCode = encryptedStorageFailureCode(error);
    const result: ApplicationBootstrapState = error instanceof StorageMetadataError
      ? { kind: "blocking", reason: error.code }
      : {
      kind: "blocking",
      reason: describeOperationalFailure(error, "Application bootstrap failed."),
      ...(storageFailureCode ? { storageFailureCode } : {}),
    };
    observeBootstrapFailure(
      dependencies.diagnosticObserver,
      stage,
      error,
      currentRepositoryStep,
    );
    return result;
  } finally {
    // A timed-out presentation keeps its step while this promise is pending. Once
    // bootstrap settles, even a non-throwing unavailable result ends that attempt.
    reportRecoveryStep(null);
  }
}

function sameExactIdentity(identity: ExactArtifactIdentity, session: TrainingSession): boolean {
  return identity.trackId === session.trackId && identity.contentVersion === session.contentVersion && identity.artifactSha256 === session.artifactSha256;
}

function sameJsonSnapshot(left: unknown, right: unknown): boolean {
  try { return JSON.stringify(left) === JSON.stringify(right); }
  catch { return false; }
}
