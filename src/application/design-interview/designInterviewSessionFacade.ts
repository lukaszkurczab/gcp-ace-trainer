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
import type { JsonValue } from "../../content/canonical";
import type { CanonicalChoiceFeedbackState } from "../canonical/canonicalInteractionPresentation";
import { projectCanonicalSourceEvidence, type CanonicalSourceLink } from "../canonical/canonicalSourceLinks";
import type { TrainingQuestionSummary } from "../trainingLifecycle/contracts";

type DesignOpenInput = Readonly<{ modeId: DesignInterviewModeId; requestedLength?: number; source?: string; expectedSessionId?: string; trackId: TrackId }>;
export type DesignInterviewPracticeProjection = Readonly<{
  session: TrainingSession;
  question: TrainingQuestionSummary;
  interaction: Readonly<{ interactionType: string; model: unknown }>;
  occurrenceId: string;
  ordinal: number;
  total: number;
  elapsedForegroundMs: number;
  operation: PracticeDurableOperationState;
  response: Readonly<{ source: "committed" | "materialized"; value: unknown }> | null;
  feedback: Readonly<{ controls: readonly Readonly<{ id: string; state: CanonicalChoiceFeedbackState }>[]; result: AttemptResultKind; reason: string; details: JsonValue; sources: readonly CanonicalSourceLink[]; messages?: readonly Readonly<{ kind: string; targetId: string; text: string }>[] }> | null;
}>;
export type DesignInterviewOpenResult = Readonly<{ kind: "ready"; projection: DesignInterviewPracticeProjection }> | Readonly<{ kind: "active_session_conflict"; session: TrainingSession }>;
export type DesignInterviewAbandonmentResult = Readonly<{ kind: "abandoned"; session: TrainingSession }> | Readonly<{ kind: "retry_same_command"; retry: "abandonment" | "foreground_checkpoint"; session: TrainingSession }> | Readonly<{ kind: "reconcile_required"; expectedSessionId: string }> | Readonly<{ kind: "recovery_required"; recovery: "abandonment" | "active_operation"; expectedSessionId: string }>;

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
  const exact = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
  const question = exact.question;
  const interaction = exact.interactions.present(question.questionId, responseAttempt?.response ?? null, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []);
  let feedback: DesignInterviewPracticeProjection["feedback"] = null;
  if (materializedAttempt) {
    const projected = exact.interactions.projectFeedback(question.questionId, materializedAttempt.response);
    if (!projected) throw new TrainingApplicationFailure("verification_failure", "The exact Design interaction feedback is unavailable.");
    feedback = Object.freeze({ controls: projectInteractionControls(exact.interactions.projectDiagnostics(question.questionId, materializedAttempt.response)), result: materializedAttempt.result.kind, reason: projected.reason, details: projected.details, sources: projectCanonicalSourceEvidence({ sourceRefs: question.sourceRefs, feedback: projected }), ...(projected.messages === undefined ? {} : { messages: projected.messages }) });
  }
  const [operation, time] = await Promise.all([lifecycle.getPracticeOperationState(session, Boolean(materializedAttempt)), getForegroundSessionTimerFacade().projection(session)]);
  const response = responseAttempt ? Object.freeze({ source: materializedAttempt ? "materialized" as const : "committed" as const, value: responseAttempt.response }) : null;
  return Object.freeze({ session, question, interaction, occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, elapsedForegroundMs: time.elapsedForegroundMs, operation, response, feedback });
}

export async function submitDesignInterviewPracticeResponse(response: unknown): Promise<void> {
  const session = await requireActiveDesignSession();
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new TrainingApplicationFailure("missing_content", "Design Interview question is unavailable.");
  const exact = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
  if (!exact.interactions.isComplete(exact.question.questionId, response)) throw new TrainingApplicationFailure("invalid_response", "The exact Design interaction response is incomplete or invalid.");
  await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
  await getTrainingLifecycleUseCases().submitPracticeResponse(response);
}

function projectInteractionControls(value: unknown): readonly Readonly<{ id: string; state: CanonicalChoiceFeedbackState }>[] {
  if (!Array.isArray(value) || value.some((entry) => !entry || typeof entry !== "object" || typeof (entry as { id?: unknown }).id !== "string" || !["correct", "incorrect", "omitted_correct", "neutral"].includes(String((entry as { state?: unknown }).state)))) throw new TrainingApplicationFailure("verification_failure", "Design interaction diagnostics are unavailable.");
  return Object.freeze(value.map((entry) => Object.freeze({ id: (entry as { id: string }).id, state: (entry as { state: CanonicalChoiceFeedbackState }).state })));
}
export async function retryDesignInterviewPracticeResponse(): Promise<void> { await getTrainingLifecycleUseCases().retryPracticeSubmission(); }

export async function reconcileDesignInterviewPracticeResponse(): Promise<"verified" | "conflict" | "unknown"> {
  const active = await loadActiveTrainingSession();
  if (!active || active.status !== "active" || !isDesignMode(active.modeId)) throw new TrainingApplicationFailure("no_active_session", "An active Design Interview Practice session is required to reconcile its response.");
  return getTrainingLifecycleUseCases().reconcileUncertainMutation(active.id);
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
    const operation = await lifecycle.getPracticeOperationState(session, false);
    if (operation.kind === "abandonment_recovery_required" && operation.error.allowedAction === "reconcile") return Object.freeze({ expectedSessionId, kind: "reconcile_required" });
    if (operation.kind === "abandonment_failed_before_journal" && operation.error.allowedAction === "retry_same_command") return Object.freeze({ kind: "retry_same_command", retry: "abandonment", session });
    if (operation.kind === "abandonment_failed_before_journal") throw cause;
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
export async function retryDesignInterviewAbandonmentCommand(expectedSessionId: string): Promise<DesignInterviewAbandonmentResult> {
  const lifecycle = getTrainingLifecycleUseCases();
  try { return Object.freeze({ kind: "abandoned", session: await lifecycle.retryExpectedSessionAbandonment(expectedSessionId) }); }
  catch (cause) {
    const pending = await lifecycle.getPendingMutationProjection(expectedSessionId);
    if (pending?.operation === "abandon_training_session") return Object.freeze({ expectedSessionId, kind: "recovery_required", recovery: "abandonment" });
    const active = await loadActiveTrainingSession();
    if (active?.id === expectedSessionId) {
      const operation = await lifecycle.getPracticeOperationState(active, false);
      if (operation.kind === "abandonment_recovery_required" && operation.error.allowedAction === "reconcile") return Object.freeze({ expectedSessionId, kind: "reconcile_required" });
      if (operation.kind === "abandonment_recovery_required" && operation.error.allowedAction === "recover") return Object.freeze({ expectedSessionId, kind: "recovery_required", recovery: "abandonment" });
      if (operation.kind === "abandonment_failed_before_journal" && operation.error.allowedAction === "retry_same_command") return Object.freeze({ kind: "retry_same_command", retry: "abandonment", session: active });
    }
    throw cause;
  }
}
export async function recoverDesignInterviewPreAbandonmentCheckpoint(expectedSessionId: string): Promise<void> {
  const lifecycle = getTrainingLifecycleUseCases();
  await lifecycle.recoverActiveTrainingOperation();
  const session = await requireExactDesignSession(expectedSessionId);
  await getForegroundSessionTimerFacade().retryLeaveForegroundAfterCheckpointFailure(session);
  await lifecycle.reconstructOperationProjection(session);
}
export async function recoverDesignInterviewAbandonment(expectedSessionId: string): Promise<TrainingSession> { return getTrainingLifecycleUseCases().recoverExpectedSessionAbandonment(expectedSessionId); }
export async function reconcileDesignInterviewAbandonment(expectedSessionId: string): Promise<"verified" | "conflict" | "unknown"> {
  const session = await requireExactDesignSession(expectedSessionId);
  const lifecycle = getTrainingLifecycleUseCases();
  const result = await lifecycle.reconcileUncertainMutation(session.id);
  if (result !== "verified") return result;
  try { await lifecycle.recoverExpectedSessionAbandonment(session.id); return "verified"; }
  catch { return "unknown"; }
}

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
    const active = await loadActiveTrainingSession();
    if (active?.id === expectedSessionId) {
      const operation = await lifecycle.getPracticeOperationState(active, false);
      if (operation.kind === "abandonment_recovery_required" && operation.error.allowedAction === "reconcile") return Object.freeze({ expectedSessionId, kind: "reconcile_required" as const });
    }
    try { return Object.freeze({ kind: "abandoned", session: await lifecycle.recoverExpectedSessionAbandonment(expectedSessionId) }); }
    catch { /* Classify the exact active state below. */ }
    if (active?.id === expectedSessionId) {
      const operation = await lifecycle.getPracticeOperationState(active, false);
      if (operation.kind === "abandonment_failed_before_journal" && operation.error.allowedAction === "retry_same_command") return Object.freeze({ kind: "retry_same_command" as const, retry: "abandonment" as const, session: active });
    }
    throw cause;
  }
}
function isDesignMode(value: string): value is DesignInterviewModeId { return DESIGN_INTERVIEW_MODE_IDS.includes(value as DesignInterviewModeId); }
