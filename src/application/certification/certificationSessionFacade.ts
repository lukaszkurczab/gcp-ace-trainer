import { getCertificationContentCatalog } from "../../content/catalogRepository";
import type { AttemptResultKind, TrainingSession, TrainingSessionDraft } from "../../domain";
import { loadActiveTrainingSession, loadActiveTrainingSessionDraft, loadTrainingAttempts } from "../learningReadModels";
import {
  getForegroundSessionTimerFacade,
  getTrainingLifecycleUseCases,
  PracticeCompletionCheckpointError,
  startTrainingSession,
  TrainingApplicationFailure,
  type ForegroundSessionTimerEvent,
  type ForegroundTimeProjection,
  type PracticeDurableOperationState,
  type PracticeCompletionCommandResult,
  type PracticeFinalization,
  type PreparedSession,
} from "../trainingLifecycle";
import { isCertificationPracticeModeId, type CertificationPracticeModeId, type CertificationQuestion, type CertificationResponse } from "../../tracks/certification";

type CertificationPracticeOpenInput = Readonly<{ modeId: CertificationPracticeModeId; requestedLength?: number; domain?: "setup_environment" | "planning_implementation" | "access_security" | "operations"; competency?: string; source?: string; expectedSessionId?: string }>;
export type CertificationPracticeOpenResult = Readonly<{ kind: "ready"; projection: CertificationPracticeProjection }> | Readonly<{ kind: "active_session_conflict"; session: TrainingSession }>;
export type CertificationExamResumeResult = Readonly<{ kind: "ready"; projection: CertificationExamProjection }> | Readonly<{ kind: "active_session_conflict"; session: TrainingSession }>;
export type CertificationAbandonmentResult =
  | Readonly<{ kind: "abandoned"; session: TrainingSession }>
  | Readonly<{ kind: "retry_same_command"; retry: "abandonment" | "foreground_checkpoint"; session: TrainingSession }>
  | Readonly<{ expectedSessionId: string; kind: "recovery_required"; recovery: "abandonment" | "active_operation" }>;

export type CertificationPracticeProjection = Readonly<{
  session: TrainingSession;
  question: CertificationQuestion;
  occurrenceId: string;
  ordinal: number;
  total: number;
  elapsedForegroundMs: number;
  operation: PracticeDurableOperationState;
  response: Readonly<{ source: "committed" | "materialized"; value: CertificationResponse }> | null;
  feedback: Readonly<{
    result: AttemptResultKind;
    reason: CertificationQuestion["feedback"]["reason"];
    details: CertificationQuestion["feedback"]["details"];
  }> | null;
}>;
export type CertificationExamProjection = Readonly<{
  session: TrainingSession;
  draft: TrainingSessionDraft;
  question: CertificationQuestion;
  occurrenceId: string;
  ordinal: number;
  total: number;
  response: CertificationResponse | null;
  flaggedOccurrenceIds: readonly string[];
  now: string;
}>;

/** A terminal Exam is a valid outcome, not a request to start a replacement session. */
export class CertificationExamExpiredError extends Error {
  constructor(readonly sessionId: string) {
    super("The Cloud exam reached its immutable deadline and was finalized.");
    this.name = "CertificationExamExpiredError";
  }
}

async function startCertificationPracticeSession(input: Readonly<{ modeId: CertificationPracticeModeId; requestedLength?: number; domain?: "setup_environment" | "planning_implementation" | "access_security" | "operations"; competency?: string; source?: string }>): Promise<PreparedSession> {
  const prepared = await startTrainingSession({ trackId: "google-cloud-associate-cloud-engineer", modeId: input.modeId, source: input.source, request: input });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  return prepared;
}

export async function openCertificationPracticeSession(input: CertificationPracticeOpenInput): Promise<CertificationPracticeOpenResult> {
  const active = await loadActiveTrainingSession();
  if (input.expectedSessionId) return resumeExpectedCertificationPractice(active, input.expectedSessionId, input.modeId);
  if (active) return active.trackId === "google-cloud-associate-cloud-engineer" && active.modeId === input.modeId
    ? resumeCertificationPractice(active)
    : Object.freeze({ kind: "active_session_conflict", session: active });
  try {
    await startCertificationPracticeSession(input);
  } catch (cause) {
    if (!(cause instanceof TrainingApplicationFailure) || cause.code !== "active_session_conflict") throw cause;
    const raced = await loadActiveTrainingSession();
    if (!raced) throw cause;
    return raced.trackId === "google-cloud-associate-cloud-engineer" && raced.modeId === input.modeId
      ? resumeCertificationPractice(raced)
      : Object.freeze({ kind: "active_session_conflict", session: raced });
  }
  return Object.freeze({ kind: "ready", projection: await getCertificationPracticeProjection() });
}

export async function resumeExpectedCertificationExam(expectedSessionId: string): Promise<CertificationExamResumeResult> {
  const active = await loadActiveTrainingSession();
  if (!active) throw new TrainingApplicationFailure("resume_unavailable", `Expected Cloud exam ${expectedSessionId} is no longer active.`);
  if (active.id !== expectedSessionId || active.trackId !== "google-cloud-associate-cloud-engineer" || active.modeId !== "certification-exam-simulation") {
    return Object.freeze({ kind: "active_session_conflict", session: active });
  }
  const resumed = await getTrainingLifecycleUseCases().resumeActiveSession();
  if (resumed.id !== expectedSessionId || resumed.trackId !== "google-cloud-associate-cloud-engineer" || resumed.modeId !== "certification-exam-simulation") {
    return Object.freeze({ kind: "active_session_conflict", session: resumed });
  }
  return Object.freeze({ kind: "ready", projection: await getCertificationExamProjection() });
}
export async function startCertificationExam(source = "practiceHub"): Promise<PreparedSession> {
  return startTrainingSession({ trackId: "google-cloud-associate-cloud-engineer", modeId: "certification-exam-simulation", source, request: {} });
}
export async function getCertificationPracticeProjection(): Promise<CertificationPracticeProjection> {
  const [session, attempts] = await Promise.all([requireActive(), loadTrainingAttempts()]);
  if (session.modeId === "certification-exam-simulation") throw new Error("The active Cloud session is an exam simulation.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("Cloud practice occurrence is unavailable.");
  const lifecycle = getTrainingLifecycleUseCases();
  const pending = await lifecycle.getPendingMutationProjection(session.id);
  const materializedAttempt = attempts.value.find((candidate) => candidate.sessionId === session.id && candidate.occurrenceId === occurrence.occurrenceId) ?? null;
  const committedAttempt = pending?.practiceOutcome?.attempt.sessionId === session.id && pending.practiceOutcome.attempt.occurrenceId === occurrence.occurrenceId ? pending.practiceOutcome.attempt : null;
  const responseAttempt = materializedAttempt ?? committedAttempt;
  const question = getCertificationContentCatalog().getItemById(occurrence.item.itemId);
  const feedback = materializedAttempt ? Object.freeze({ result: materializedAttempt.result.kind, reason: question.feedback.reason, details: question.feedback.details }) : null;
  const [operation, time] = await Promise.all([
    lifecycle.getPracticeOperationState(session, Boolean(materializedAttempt)),
    getForegroundSessionTimerFacade().projection(session),
  ]);
  const response = responseAttempt ? Object.freeze({ source: materializedAttempt ? "materialized" as const : "committed" as const, value: responseAttempt.response as CertificationResponse }) : null;
  return Object.freeze({ session, question, occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, elapsedForegroundMs: time.elapsedForegroundMs, operation, response, feedback });
}
export async function submitCertificationPracticeResponse(response: CertificationResponse): Promise<void> {
  await getForegroundSessionTimerFacade().checkpointForResponseSave(await requireCertificationPractice());
  await getTrainingLifecycleUseCases().submitPracticeResponse(response);
}
export async function advanceCertificationPracticeSession(): Promise<TrainingSession> { return getTrainingLifecycleUseCases().advancePracticeSession(); }
export async function recoverCertificationPracticeOperation(): Promise<void> { await getTrainingLifecycleUseCases().recoverActiveTrainingOperation(); }
export function subscribeCertificationPracticeOperation(sessionId: string, listener: (operation: PracticeDurableOperationState) => void): () => void {
  return getTrainingLifecycleUseCases().subscribeOperationProjection(sessionId, (operation) => {
    if (operation.family === "practice") listener(operation);
  });
}
export async function completeCertificationPracticeSession(): Promise<PracticeCompletionCommandResult<PracticeFinalization>> {
  const session = await requireCertificationPractice();
  const lifecycle = getTrainingLifecycleUseCases();
  const timer = getForegroundSessionTimerFacade();
  try {
    const finalized = await timer.completePracticeAfterCheckpoint(session, () => lifecycle.completeActivePracticeSession(session.id));
    return Object.freeze({ kind: "verified", value: finalized });
  } catch (cause) {
    if (cause instanceof PracticeCompletionCheckpointError) {
      const pending = await lifecycle.getExpectedSessionPendingMutation(session.id);
      if (pending) {
        if (pending.operation !== "advance_training_session") throw cause;
        return Object.freeze({ expectedSessionId: session.id, kind: "recover_final_checkpoint" });
      }
      return Object.freeze({ expectedSessionId: session.id, kind: "retry_final_checkpoint" });
    }
    const operation = lifecycle.getOperationProjection(session.id);
    if (operation?.family !== "practice" || operation.kind !== "completion_failed") throw cause;
    return Object.freeze({ expectedSessionId: session.id, kind: operation.error.allowedAction === "recover" ? "recover_completion" : "retry_completion", operation });
  }
}

export async function retryCertificationPracticeCompletionCheckpoint(expectedSessionId: string): Promise<CertificationPracticeProjection> {
  const session = await requireExactCertificationPractice(expectedSessionId);
  const lifecycle = getTrainingLifecycleUseCases();
  await getForegroundSessionTimerFacade().retryPracticeCompletionCheckpointAfterFailure(session);
  await lifecycle.reconstructOperationProjection(session);
  return getCertificationPracticeProjection();
}

export async function recoverCertificationPracticeCompletionCheckpoint(expectedSessionId: string): Promise<CertificationPracticeProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  const pending = await lifecycle.getExpectedSessionPendingMutation(expectedSessionId);
  if (!pending || pending.operation !== "advance_training_session") throw new TrainingApplicationFailure("resume_unavailable", `No matching final-checkpoint journal exists for ${expectedSessionId}.`);
  await lifecycle.recoverActiveTrainingOperation();
  const session = await requireExactCertificationPractice(expectedSessionId);
  await getForegroundSessionTimerFacade().retryPracticeCompletionCheckpointAfterFailure(session);
  await lifecycle.reconstructOperationProjection(session);
  return getCertificationPracticeProjection();
}

export async function recoverCertificationPracticeCompletion(expectedSessionId: string): Promise<PracticeFinalization> {
  const finalized = await getTrainingLifecycleUseCases().recoverExpectedSessionCompletion(expectedSessionId);
  getForegroundSessionTimerFacade().releaseAfterVerifiedPracticeCompletion(expectedSessionId);
  return finalized;
}
export async function abandonCertificationSession(expectedSessionId: string): Promise<CertificationAbandonmentResult> {
  const session = await requireActive();
  if (session.id !== expectedSessionId || !isCertificationPracticeModeId(session.modeId)) throw new TrainingApplicationFailure("resume_unavailable", `Certification practice session ${expectedSessionId} is not the exact active session.`);
  const lifecycle = getTrainingLifecycleUseCases();
  if (session.configurationSnapshot.timer === "elapsedForeground" || session.configurationSnapshot.timer === "countdownForeground") {
    try {
      await getForegroundSessionTimerFacade().leaveForeground(session);
    } catch (cause) {
      const pending = await lifecycle.getPendingMutationProjection(expectedSessionId);
      if (pending) {
        if (pending.sessionId !== expectedSessionId) throw cause;
        return Object.freeze({
          expectedSessionId,
          kind: "recovery_required",
          recovery: pending.operation === "abandon_training_session" ? "abandonment" : "active_operation",
        });
      }
      const active = await loadActiveTrainingSession();
      if (active?.id === expectedSessionId) return Object.freeze({ kind: "retry_same_command", retry: "foreground_checkpoint", session: active });
      throw cause;
    }
  }
  return abandonCertificationSessionAfterTimerLeave(lifecycle, expectedSessionId);
}

export async function retryCertificationAbandonmentAfterCheckpointFailure(expectedSessionId: string): Promise<CertificationAbandonmentResult> {
  const session = await requireActive();
  if (session.id !== expectedSessionId || !isCertificationPracticeModeId(session.modeId)) throw new TrainingApplicationFailure("resume_unavailable", `Certification practice session ${expectedSessionId} is not the exact active session.`);
  await getForegroundSessionTimerFacade().retryLeaveForegroundAfterCheckpointFailure(session);
  return abandonCertificationSessionAfterTimerLeave(getTrainingLifecycleUseCases(), expectedSessionId);
}

export async function recoverCertificationPreAbandonmentCheckpoint(expectedSessionId: string): Promise<void> {
  const lifecycle = getTrainingLifecycleUseCases();
  await lifecycle.recoverActiveTrainingOperation();
  const session = await requireActive();
  if (session.id !== expectedSessionId || !isCertificationPracticeModeId(session.modeId)) throw new TrainingApplicationFailure("resume_unavailable", `Certification practice session ${expectedSessionId} is not the exact active session after timer recovery.`);
  await getForegroundSessionTimerFacade().retryLeaveForegroundAfterCheckpointFailure(session);
  await lifecycle.reconstructOperationProjection(session);
}

async function abandonCertificationSessionAfterTimerLeave(lifecycle: ReturnType<typeof getTrainingLifecycleUseCases>, expectedSessionId: string): Promise<CertificationAbandonmentResult> {
  try {
    return Object.freeze({ kind: "abandoned", session: await lifecycle.abandonActiveSession() });
  } catch (cause) {
    const pending = await lifecycle.getPendingMutationProjection(expectedSessionId);
    if (pending) {
      if (pending.sessionId !== expectedSessionId) throw cause;
      return Object.freeze({
        expectedSessionId,
        kind: "recovery_required",
        recovery: pending.operation === "abandon_training_session" ? "abandonment" : "active_operation",
      });
    }
    try {
      return Object.freeze({ kind: "abandoned", session: await lifecycle.recoverExpectedSessionAbandonment(expectedSessionId) });
    } catch {
      // A non-durable failure must still be classified from the exact active session below.
    }
    const active = await loadActiveTrainingSession();
    if (active?.id === expectedSessionId) {
      const operation = await lifecycle.getPracticeOperationState(active, false);
      if (operation.kind === "abandonment_failed_before_journal" && operation.error.allowedAction === "retry_same_command") {
        return Object.freeze({ kind: "retry_same_command", retry: "abandonment", session: active });
      }
    }
    throw cause;
  }
}

export async function recoverCertificationPracticeAbandonment(expectedSessionId: string): Promise<TrainingSession> {
  return getTrainingLifecycleUseCases().recoverExpectedSessionAbandonment(expectedSessionId);
}

export async function enterCertificationPracticeForeground(): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().enterForeground(await requireCertificationPractice());
}

export async function leaveCertificationPracticeForeground(): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().leaveForeground(await requireCertificationPractice());
}

export function subscribeCertificationPracticeProjectionRefresh(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
  return getForegroundSessionTimerFacade().subscribe(listener);
}

export async function getCertificationExamProjection(): Promise<CertificationExamProjection> {
  await assertCertificationExamIsActive();
  const [session, draft] = await Promise.all([requireActive(), loadActiveTrainingSessionDraft()]);
  if (session.modeId !== "certification-exam-simulation" || !draft || draft.sessionId !== session.id) throw new Error("The active Cloud exam draft is unavailable.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("Cloud exam occurrence is unavailable.");
  const raw = draft.responsesByOccurrenceId[occurrence.occurrenceId] ?? null;
  return Object.freeze({ session, draft, question: getCertificationContentCatalog().getItemById(occurrence.item.itemId), occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, response: raw as CertificationResponse | null, flaggedOccurrenceIds: draft.flaggedOccurrenceIds, now: getTrainingLifecycleUseCases().currentTime() });
}
export async function saveCertificationExamResponse(input: Readonly<{ occurrenceId: string; response: CertificationResponse }>): Promise<void> {
  await assertCertificationExamIsActive();
  const projection = await getCertificationExamProjection();
  if (projection.occurrenceId !== input.occurrenceId) throw new Error("Cloud exam response does not belong to the active occurrence.");
  const draft = { ...projection.draft, revision: projection.draft.revision + 1, updatedAt: getTrainingLifecycleUseCases().currentTime(), responsesByOccurrenceId: { ...projection.draft.responsesByOccurrenceId, [input.occurrenceId]: input.response } } as TrainingSessionDraft;
  await getTrainingLifecycleUseCases().saveSimulationDraft({ draft, expectedPreviousRevision: projection.draft.revision });
}
export async function toggleCertificationExamFlag(occurrenceId: string): Promise<void> {
  await assertCertificationExamIsActive();
  const projection = await getCertificationExamProjection();
  if (!projection.session.itemOrder.some((occurrence) => occurrence.occurrenceId === occurrenceId)) throw new Error("Cloud exam flag does not belong to the active session.");
  const flaggedOccurrenceIds = projection.draft.flaggedOccurrenceIds.includes(occurrenceId)
    ? projection.draft.flaggedOccurrenceIds.filter((id) => id !== occurrenceId)
    : [...projection.draft.flaggedOccurrenceIds, occurrenceId];
  const draft = { ...projection.draft, revision: projection.draft.revision + 1, updatedAt: getTrainingLifecycleUseCases().currentTime(), flaggedOccurrenceIds } as TrainingSessionDraft;
  await getTrainingLifecycleUseCases().saveSimulationDraft({ draft, expectedPreviousRevision: projection.draft.revision });
}
export async function navigateCertificationExamTo(index: number): Promise<TrainingSession> { await assertCertificationExamIsActive(); return getTrainingLifecycleUseCases().moveSimulationSessionTo(index); }
export async function finalizeCertificationExam(): Promise<string> {
  const lifecycle = getTrainingLifecycleUseCases();
  const expiredSessionId = await lifecycle.finalizeExpiredSimulationIfDue();
  if (expiredSessionId) return expiredSessionId;
  const session = await requireActive();
  await lifecycle.finalizeSimulation();
  return session.id;
}
async function assertCertificationExamIsActive(): Promise<void> {
  const expiredSessionId = await getTrainingLifecycleUseCases().finalizeExpiredSimulationIfDue();
  if (expiredSessionId) throw new CertificationExamExpiredError(expiredSessionId);
}

async function resumeExpectedCertificationPractice(active: TrainingSession | null, expectedSessionId: string, modeId: CertificationPracticeModeId): Promise<CertificationPracticeOpenResult> {
  if (!active) throw new TrainingApplicationFailure("resume_unavailable", `Expected Cloud practice session ${expectedSessionId} is no longer active.`);
  if (active.id !== expectedSessionId || active.trackId !== "google-cloud-associate-cloud-engineer" || active.modeId !== modeId || !isCertificationPracticeModeId(active.modeId)) {
    return Object.freeze({ kind: "active_session_conflict", session: active });
  }
  return resumeCertificationPractice(active);
}

async function resumeCertificationPractice(expected: TrainingSession): Promise<CertificationPracticeOpenResult> {
  const resumed = await getTrainingLifecycleUseCases().resumeActiveSession();
  if (resumed.id !== expected.id || resumed.trackId !== "google-cloud-associate-cloud-engineer" || resumed.modeId !== expected.modeId || !isCertificationPracticeModeId(resumed.modeId)) {
    return Object.freeze({ kind: "active_session_conflict", session: resumed });
  }
  await getForegroundSessionTimerFacade().restoreForResume(resumed);
  return Object.freeze({ kind: "ready", projection: await getCertificationPracticeProjection() });
}

async function requireActive(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (!session || session.trackId !== "google-cloud-associate-cloud-engineer") throw new Error("No active Cloud Certification session is available.");
  return session;
}

async function requireCertificationPractice(): Promise<TrainingSession> {
  const session = await requireActive();
  if (session.modeId === "certification-exam-simulation") throw new Error("The active Cloud session is an exam simulation.");
  return session;
}

async function requireExactCertificationPractice(expectedSessionId: string): Promise<TrainingSession> {
  const session = await requireCertificationPractice();
  if (session.id !== expectedSessionId) throw new TrainingApplicationFailure("resume_unavailable", `Certification practice session ${expectedSessionId} is not the exact active session.`);
  return session;
}
