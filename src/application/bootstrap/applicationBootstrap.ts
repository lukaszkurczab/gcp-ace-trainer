import { getTrainingLifecycleUseCases } from "../trainingLifecycle";
import { recoverPendingMutation } from "../learningMutations";
import { canPersistTrainingSessionDraft } from "../../domain";
import {
  ApplicationBootstrapStage,
  BootstrapInvariantError,
  describeOperationalFailure,
  observeBootstrapFailure,
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
import type { ContentIdentityMigrationBootstrapStep } from "../../storage/repositories/contentIdentityMigrationBootstrap";

export type ApplicationBootstrapState =
  | Readonly<{ kind: "ready"; activeSessionId: string | null }>
  | Readonly<{ kind: "content_identity_unavailable"; sessionIds: readonly string[] }>
  | Readonly<{ kind: "blocking"; reason: string; storageFailureCode?: EncryptedStorageFailureCode }>;
export type ApplicationBootstrapDependencies = Readonly<{
  repositories?: CanonicalRepositoryBootstrapDependencies;
  diagnosticObserver?: BootstrapDiagnosticObserver;
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
  resolveActiveSession: (sessionId: string) => Promise<void>,
  prepareLifecycle?: () => Promise<void>,
  dependencies: ApplicationBootstrapDependencies = {},
): Promise<ApplicationBootstrapState> {
  let stage = ApplicationBootstrapStage.OpeningStorage;
  let currentRepositoryStep: CanonicalRepositoryBootstrapStep | undefined;
  let currentContentIdentityMigrationStep: ContentIdentityMigrationBootstrapStep | undefined;
  try {
    try { cleanupOrphanedAccountDataExports(); } catch { /* cache cleanup is retried on the next launch */ }
    const repositoryDependencies = dependencies.repositories;
    const migrationDependencies = repositoryDependencies?.contentIdentityMigration;
    await openCanonicalRepositories({
      ...repositoryDependencies,
      contentIdentityMigration: {
        ...migrationDependencies,
        onStep: (step) => {
          currentContentIdentityMigrationStep = step;
          try { migrationDependencies?.onStep?.(step); } catch { /* diagnostic observers are best-effort */ }
        },
      },
      onStep: (step) => {
        currentRepositoryStep = step;
        if (step !== CanonicalRepositoryBootstrapStep.ContentIdentityMigration) currentContentIdentityMigrationStep = undefined;
        try { repositoryDependencies?.onStep?.(step); } catch { /* diagnostic observers are best-effort */ }
      },
    });
    currentRepositoryStep = undefined;
    currentContentIdentityMigrationStep = undefined;
    const unavailableActive = (await getUnavailableActiveRecords()).value;
    if (unavailableActive.length > 0) {
      return {
        kind: "content_identity_unavailable",
        sessionIds: Object.freeze(unavailableActive.map((record) => record.sessionId)),
      };
    }
    stage = ApplicationBootstrapStage.RecoveringLearningState;
    if (prepareLifecycle) {
      await prepareLifecycle();
      const lifecycle = getTrainingLifecycleUseCases();
      const beforeRecovery = await getActiveTrainingSession();
      if (beforeRecovery) await lifecycle.reconstructOperationProjection(beforeRecovery);
      await lifecycle.recoverPendingJournal();
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
    await resolveActiveSession(activeSession.id);
    return { kind: "ready", activeSessionId: activeSession.id };
  } catch (error) {
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
      currentRepositoryStep === CanonicalRepositoryBootstrapStep.ContentIdentityMigration ? currentContentIdentityMigrationStep : undefined,
    );
    return result;
  }
}
