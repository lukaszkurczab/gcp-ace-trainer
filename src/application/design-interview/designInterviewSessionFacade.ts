import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import type { AttemptResultKind, TrackId, TrainingSession } from "../../domain";
import { loadActiveTrainingSession, loadTrainingAttempts } from "../learningReadModels";
import {
  getForegroundSessionTimerFacade,
  getTrainingLifecycleUseCases,
  PracticeCompletionCheckpointError,
  startTrainingSession,
  TrainingApplicationFailure,
  type ForegroundSessionTimerEvent,
  type ForegroundTimeProjection,
  type PracticeCompletionCommandResult,
  type PracticeDurableOperationState,
  type PracticeFinalization,
  type PreparedSession,
} from "../trainingLifecycle";
import { DESIGN_INTERVIEW_MODE_IDS, type DesignInterviewModeId } from "../../tracks/design-interview/designModes";
import type { DesignQuestion } from "../../tracks/design-interview/designRuntimeCatalog";
import type { DesignResponse } from "../../tracks/design-interview/designTypes";

type DesignOpenInput = Readonly<{ modeId: DesignInterviewModeId; requestedLength?: number; source?: string; expectedSessionId?: string; trackId: TrackId }>;
export type DesignInterviewPracticeProjection = Readonly<{
  session: TrainingSession;
  question: DesignQuestion;
  occurrenceId: string;
  ordinal: number;
  total: number;
  elapsedForegroundMs: number;
  operation: PracticeDurableOperationState;
  response: Readonly<{ source: "committed" | "materialized"; value: DesignResponse }> | null;
  feedback: Readonly<{ result: AttemptResultKind; reason: DesignQuestion["feedback"]["reason"]; details: DesignQuestion["feedback"]["details"] }> | null;
}>;
export type DesignInterviewOpenResult = Readonly<{ kind: "ready"; projection: DesignInterviewPracticeProjection }> | Readonly<{ kind: "active_session_conflict"; session: TrainingSession }>;
export type DesignInterviewAbandonmentResult = Readonly<{ kind: "abandoned"; session: TrainingSession }> | Readonly<{ kind: "retry_same_command"; retry: "abandonment" | "foreground_checkpoint"; session: TrainingSession }> | Readonly<{ kind: "recovery_required"; recovery: "abandonment" | "active_operation"; expectedSessionId: string }>;

export async function openDesignInterviewPracticeSession(input: DesignOpenInput): Promise<DesignInterviewOpenResult> {
  const active = await loadActiveTrainingSession();
  if (input.expectedSessionId) {
    if (!active || active.id !== input.expectedSessionId || active.trackId !== input.trackId || !isDesignMode(active.modeId)) throw new TrainingApplicationFailure("resume_unavailable", `Expected Design Interview session ${input.expectedSessionId} is unavailable.`);
    await getTrainingLifecycleUseCases().resumeActiveSession();
    return Object.freeze({ kind: "ready", projection: await getDesignInterviewPracticeProjection() });
  }
  if (active) return active.trackId === input.trackId && active.modeId === input.modeId ? Object.freeze({ kind: "ready", projection: await resumeDesignSession(active) }) : Object.freeze({ kind: "active_session_conflict", session: active });
  try {
    await startDesignInterviewPracticeSession(input);
  } catch (cause) {
    if (!(cause instanceof TrainingApplicationFailure) || cause.code !== "active_session_conflict") throw cause;
    const raced = await loadActiveTrainingSession();
    if (!raced) throw cause;
    return raced.trackId === input.trackId && raced.modeId === input.modeId ? Object.freeze({ kind: "ready", projection: await resumeDesignSession(raced) }) : Object.freeze({ kind: "active_session_conflict", session: raced });
  }
  return Object.freeze({ kind: "ready", projection: await getDesignInterviewPracticeProjection() });
}

async function startDesignInterviewPracticeSession(input: DesignOpenInput): Promise<PreparedSession> {
  const prepared = await startTrainingSession({ trackId: input.trackId, modeId: input.modeId, source: input.source, request: input });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  return prepared;
}

async function resumeDesignSession(session: TrainingSession): Promise<DesignInterviewPracticeProjection> {
  const resumed = await getTrainingLifecycleUseCases().resumeActiveSession();
  if (resumed.id !== session.id) throw new TrainingApplicationFailure("resume_unavailable", "The exact Design Interview session could not be resumed.");
  return getDesignInterviewPracticeProjection();
}

export async function getDesignInterviewPracticeProjection(): Promise<DesignInterviewPracticeProjection> {
  const [session, attempts] = await Promise.all([requireActiveDesignSession(), loadTrainingAttempts()]);
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("Design Interview occurrence is unavailable.");
  const lifecycle = getTrainingLifecycleUseCases();
  const pending = await lifecycle.getPendingMutationProjection(session.id);
  const materializedAttempt = attempts.value.find((candidate) => candidate.sessionId === session.id && candidate.occurrenceId === occurrence.occurrenceId) ?? null;
  const committedAttempt = pending?.practiceOutcome?.attempt.sessionId === session.id && pending.practiceOutcome.attempt.occurrenceId === occurrence.occurrenceId ? pending.practiceOutcome.attempt : null;
  const responseAttempt = materializedAttempt ?? committedAttempt;
  const question = await contentPackageRuntimeOwner.resolveItem<DesignQuestion>(occurrence.item);
  const feedback = materializedAttempt ? Object.freeze({ result: materializedAttempt.result.kind, reason: question.feedback.reason, details: question.feedback.details }) : null;
  const [operation, time] = await Promise.all([lifecycle.getPracticeOperationState(session, Boolean(materializedAttempt)), getForegroundSessionTimerFacade().projection(session)]);
  const response = responseAttempt ? Object.freeze({ source: materializedAttempt ? "materialized" as const : "committed" as const, value: responseAttempt.response as DesignResponse }) : null;
  return Object.freeze({ session, question, occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, elapsedForegroundMs: time.elapsedForegroundMs, operation, response, feedback });
}

export async function submitDesignInterviewPracticeResponse(response: DesignResponse): Promise<void> {
  await getForegroundSessionTimerFacade().checkpointForResponseSave(await requireActiveDesignSession());
  await getTrainingLifecycleUseCases().submitPracticeResponse(response);
}
export async function advanceDesignInterviewPracticeSession(): Promise<TrainingSession> { return getTrainingLifecycleUseCases().advancePracticeSession(); }
export async function recoverDesignInterviewPracticeOperation(): Promise<void> { await getTrainingLifecycleUseCases().recoverActiveTrainingOperation(); }
export function subscribeDesignInterviewPracticeOperation(sessionId: string, listener: (operation: PracticeDurableOperationState) => void): () => void { return getTrainingLifecycleUseCases().subscribeOperationProjection(sessionId, (operation) => { if (operation.family === "practice") listener(operation); }); }
export function subscribeDesignInterviewPracticeProjectionRefresh(listener: (event: ForegroundSessionTimerEvent) => void): () => void { return getForegroundSessionTimerFacade().subscribe(listener); }
export async function enterDesignInterviewPracticeForeground(): Promise<ForegroundTimeProjection> { return getForegroundSessionTimerFacade().enterForeground(await requireActiveDesignSession()); }
export async function leaveDesignInterviewPracticeForeground(): Promise<ForegroundTimeProjection> { return getForegroundSessionTimerFacade().leaveForeground(await requireActiveDesignSession()); }

export async function completeDesignInterviewPracticeSession(): Promise<PracticeCompletionCommandResult<PracticeFinalization>> {
  const session = await requireActiveDesignSession();
  const lifecycle = getTrainingLifecycleUseCases();
  try {
    const finalized = await getForegroundSessionTimerFacade().completePracticeAfterCheckpoint(session, () => lifecycle.completeActivePracticeSession(session.id));
    return Object.freeze({ kind: "verified", value: finalized });
  } catch (cause) {
    if (cause instanceof PracticeCompletionCheckpointError) {
      const pending = await lifecycle.getExpectedSessionPendingMutation(session.id);
      return Object.freeze({ expectedSessionId: session.id, kind: pending ? "recover_final_checkpoint" as const : "retry_final_checkpoint" as const });
    }
    const operation = lifecycle.getOperationProjection(session.id);
    if (operation?.family !== "practice" || operation.kind !== "completion_failed") throw cause;
    return Object.freeze({ expectedSessionId: session.id, kind: operation.error.allowedAction === "recover" ? "recover_completion" as const : "retry_completion" as const, operation });
  }
}
export async function retryDesignInterviewPracticeCompletionCheckpoint(expectedSessionId: string): Promise<DesignInterviewPracticeProjection> {
  const session = await requireExactDesignSession(expectedSessionId);
  const lifecycle = getTrainingLifecycleUseCases();
  await getForegroundSessionTimerFacade().retryPracticeCompletionCheckpointAfterFailure(session);
  await lifecycle.reconstructOperationProjection(session);
  return getDesignInterviewPracticeProjection();
}
export async function recoverDesignInterviewPracticeCompletionCheckpoint(expectedSessionId: string): Promise<DesignInterviewPracticeProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  const pending = await lifecycle.getExpectedSessionPendingMutation(expectedSessionId);
  if (!pending || pending.operation !== "advance_training_session") throw new TrainingApplicationFailure("resume_unavailable", `No matching final-checkpoint journal exists for ${expectedSessionId}.`);
  await lifecycle.recoverActiveTrainingOperation();
  const session = await requireExactDesignSession(expectedSessionId);
  await getForegroundSessionTimerFacade().retryPracticeCompletionCheckpointAfterFailure(session);
  await lifecycle.reconstructOperationProjection(session);
  return getDesignInterviewPracticeProjection();
}
export async function recoverDesignInterviewPracticeCompletion(expectedSessionId: string): Promise<PracticeFinalization> {
  const finalized = await getTrainingLifecycleUseCases().recoverExpectedSessionCompletion(expectedSessionId);
  getForegroundSessionTimerFacade().releaseAfterVerifiedPracticeCompletion(expectedSessionId);
  return finalized;
}
export async function abandonDesignInterviewSession(expectedSessionId: string): Promise<DesignInterviewAbandonmentResult> {
  const session = await requireActiveDesignSession();
  if (session.id !== expectedSessionId) throw new TrainingApplicationFailure("resume_unavailable", `Design Interview session ${expectedSessionId} is not the exact active session.`);
  const lifecycle = getTrainingLifecycleUseCases();
  try {
    await getForegroundSessionTimerFacade().leaveForeground(session);
    return Object.freeze({ kind: "abandoned", session: await lifecycle.abandonActiveSession() });
  } catch (cause) {
    const pending = await lifecycle.getPendingMutationProjection(expectedSessionId);
    if (pending) return Object.freeze({ expectedSessionId, kind: "recovery_required", recovery: pending.operation === "abandon_training_session" ? "abandonment" : "active_operation" });
    const active = await loadActiveTrainingSession();
    if (active?.id === expectedSessionId) return Object.freeze({ kind: "retry_same_command", retry: "foreground_checkpoint", session: active });
    throw cause;
  }
}
export async function retryDesignInterviewAbandonmentAfterCheckpointFailure(expectedSessionId: string): Promise<DesignInterviewAbandonmentResult> {
  const session = await requireExactDesignSession(expectedSessionId);
  await getForegroundSessionTimerFacade().retryLeaveForegroundAfterCheckpointFailure(session);
  return abandonDesignInterviewSessionAfterTimerLeave(expectedSessionId);
}
export async function recoverDesignInterviewPreAbandonmentCheckpoint(expectedSessionId: string): Promise<void> {
  const lifecycle = getTrainingLifecycleUseCases();
  await lifecycle.recoverActiveTrainingOperation();
  const session = await requireExactDesignSession(expectedSessionId);
  await getForegroundSessionTimerFacade().retryLeaveForegroundAfterCheckpointFailure(session);
  await lifecycle.reconstructOperationProjection(session);
}
export async function recoverDesignInterviewAbandonment(expectedSessionId: string): Promise<TrainingSession> { return getTrainingLifecycleUseCases().recoverExpectedSessionAbandonment(expectedSessionId); }

async function requireActiveDesignSession(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (!session || session.status !== "active" || !isDesignMode(session.modeId)) throw new TrainingApplicationFailure("no_active_session", "No active Design Interview session is available.");
  return session;
}
async function requireExactDesignSession(expectedSessionId: string): Promise<TrainingSession> {
  const session = await requireActiveDesignSession();
  if (session.id !== expectedSessionId) throw new TrainingApplicationFailure("resume_unavailable", `Design Interview session ${expectedSessionId} is not the exact active session.`);
  return session;
}
async function abandonDesignInterviewSessionAfterTimerLeave(expectedSessionId: string): Promise<DesignInterviewAbandonmentResult> {
  const lifecycle = getTrainingLifecycleUseCases();
  try {
    return Object.freeze({ kind: "abandoned", session: await lifecycle.abandonActiveSession() });
  } catch (cause) {
    const pending = await lifecycle.getPendingMutationProjection(expectedSessionId);
    if (pending) return Object.freeze({ expectedSessionId, kind: "recovery_required" as const, recovery: pending.operation === "abandon_training_session" ? "abandonment" as const : "active_operation" as const });
    try { return Object.freeze({ kind: "abandoned", session: await lifecycle.recoverExpectedSessionAbandonment(expectedSessionId) }); }
    catch { /* Classify the exact active state below. */ }
    const active = await loadActiveTrainingSession();
    if (active?.id === expectedSessionId) {
      const operation = await lifecycle.getPracticeOperationState(active, false);
      if (operation.kind === "abandonment_failed_before_journal" && operation.error.allowedAction === "retry_same_command") return Object.freeze({ kind: "retry_same_command" as const, retry: "abandonment" as const, session: active });
    }
    throw cause;
  }
}
function isDesignMode(value: string): value is DesignInterviewModeId { return DESIGN_INTERVIEW_MODE_IDS.includes(value as DesignInterviewModeId); }
