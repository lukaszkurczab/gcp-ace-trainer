import { beginStartupSpan } from "../../infrastructure/diagnostics/startupTrace";
import type { TrackQuestionPresentation } from "../../domain/tracks/trackAdmission";
import { certificationQuestionPresentation } from "./certificationQuestionPresentation";
import { isCaseAttemptEvidence, sessionCaseStates } from "../../domain/learning/caseEvidence";
import type { ForegroundTimerLeaveReason } from "../runtime/ForegroundSessionTimer";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { type AttemptResultKind, type CompletedTrainingSession, type TrackId, type TrainingSession, type TrainingSessionDraft } from "../../domain";
import { getTrackRegistration } from "../../domain";
import { loadActiveTrainingSession, loadActiveTrainingSessionDraft, loadTrainingAttempts, loadTrainingSession, loadTrainingSessionResult } from "../learningReadModels";
import {
  getForegroundSessionTimerFacade,
  getTrainingLifecycleUseCases,
  PracticeCompletionCheckpointError,
  startTrainingSession,
  TrainingApplicationFailure,
  type ForegroundSessionTimerEvent,
  type ForegroundTimeProjection,
  type PracticeDurableOperationState,
  type SimulationDurableOperationState,
  type PracticeCompletionCommandResult,
  type PracticeFinalization,
  type PreparedSession,
} from "../trainingLifecycle";
import { isCertificationPracticeModeId, type CertificationDomain, type CertificationPracticeModeId } from "../../tracks/certification";
import { type CanonicalQuestionResponse, type JsonValue } from "../../content/canonical";
import type { CanonicalChoiceFeedbackState } from "../canonical/canonicalInteractionPresentation";
import { projectCanonicalSourceEvidence, type CanonicalSourceLink } from "../canonical/canonicalSourceLinks";
import type { ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import type { TrainingQuestionSummary } from "../trainingLifecycle/contracts";
import { projectCertificationExamReview, type CertificationExamReviewProjection } from "./certificationExamReviewProjection";
import { projectCertificationPracticeReview, type CertificationPracticeReviewProjection } from "./certificationPracticeReviewProjection";
import { captureProfileReadFence } from "../profileReadFence";
export { certificationReviewEvidenceMatches } from "./certificationPracticeReviewProjection";
export type { CertificationDiagnosticReport, CertificationPracticeReviewItem, CertificationPracticeReviewProjection } from "./certificationPracticeReviewProjection";

export type CertificationPracticeOpenInput = Readonly<{ modeId: CertificationPracticeModeId; requestedLength?: number; preset?: "single_case"; caseId?: string; domain?: CertificationDomain; nodeId?: string; mentalUnitId?: string; expectedContentVersion?: string; expectedArtifactSha256?: string; competency?: string; feedbackMode?: "afterEachAnswer" | "atSessionEnd"; reviewSource?: "due_queue" | "manual_request"; source?: string; expectedSessionId?: string; trackId: TrackId }>;
export type CertificationPracticeOpenResult = Readonly<{ kind: "ready"; projection: CertificationPracticeProjection }> | Readonly<{ kind: "active_session_conflict"; session: TrainingSession }>;
export type CertificationExamResumeResult = Readonly<{ kind: "ready"; projection: CertificationExamProjection }> | Readonly<{ kind: "active_session_conflict"; session: TrainingSession }>;
export type CertificationAbandonmentResult =
  | Readonly<{ kind: "abandoned"; session: TrainingSession }>
  | Readonly<{ kind: "retry_same_command"; retry: "abandonment" | "foreground_checkpoint"; session: TrainingSession }>
  | Readonly<{ expectedSessionId: string; kind: "reconcile_required" }>
  | Readonly<{ expectedSessionId: string; kind: "recovery_required"; recovery: "abandonment" | "active_operation" }>;

export type CertificationPracticeProjection = Readonly<{
  questionPresentation: TrackQuestionPresentation;
  session: TrainingSession;
  question: CertificationPracticeQuestion;
  occurrenceId: string;
  ordinal: number;
  total: number;
  elapsedForegroundMs: number;
  operation: PracticeDurableOperationState;
  response: Readonly<{ source: "committed" | "materialized"; value: CanonicalQuestionResponse }> | null;
  feedback: Readonly<{
    controls: readonly Readonly<{ id: string; state: CanonicalChoiceFeedbackState }>[];
    messages?: readonly Readonly<{ kind: string; targetId: string; text: string }>[];
    result: AttemptResultKind;
    reason: string;
    details: JsonValue;
    sources: readonly CanonicalSourceLink[];
  }> | null;
}>;
export type CertificationPracticeQuestion = Readonly<{
  interaction:
    | Readonly<{ type: "choice_single"; scoringMethod: "exact_selected_set"; options: readonly Readonly<{ optionId: string; text: string }>[] }>
    | Readonly<{ type: "choice_multiple"; scoringMethod: "exact_selected_set"; options: readonly Readonly<{ optionId: string; text: string }>[] }>;
  nodeId: string;
  prompt: string;
  questionId: string;
}>;
export type CertificationExamProjection = Readonly<{
  session: TrainingSession;
  draft: TrainingSessionDraft;
  question: TrainingQuestionSummary;
  interaction: Readonly<{ interactionType: string; model: unknown }>;
  occurrenceId: string;
  ordinal: number;
  total: number;
  response: unknown | null;
  flaggedOccurrenceIds: readonly string[];
  now: string;
  operation: SimulationDurableOperationState;
}>;

/** A terminal Exam is a valid outcome, not a request to start a replacement session. */
export class CertificationExamExpiredError extends Error {
  constructor(readonly sessionId: string) {
    super("The Cloud exam reached its immutable deadline and was finalized.");
    this.name = "CertificationExamExpiredError";
  }
}

export function buildCertificationPracticeStartCommand(input: CertificationPracticeOpenInput) {
  const feedbackTiming = input.feedbackMode === "atSessionEnd" ? "after_session_completion" : input.feedbackMode === "afterEachAnswer" ? "after_each_durable_submit" : undefined;
  const { expectedContentVersion, expectedArtifactSha256, ...request } = input;
  return { trackId: input.trackId, modeId: input.modeId, source: input.source, request: { ...request, ...(expectedContentVersion === undefined ? {} : { expectedContentVersion }), ...(expectedArtifactSha256 === undefined ? {} : { expectedArtifactSha256 }), ...(feedbackTiming ? { feedbackTiming } : {}) } } as const;
}

async function startCertificationPracticeSession(input: CertificationPracticeOpenInput): Promise<PreparedSession> {
  const prepared = await startTrainingSession(buildCertificationPracticeStartCommand(input));
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  return prepared;
}

export async function openCertificationPracticeSession(input: CertificationPracticeOpenInput): Promise<CertificationPracticeOpenResult> {
  const active = await loadActiveTrainingSession();
  if (input.expectedSessionId) return resumeExpectedCertificationPractice(active, input.expectedSessionId, input.modeId, input.trackId);
  if (active) return active.trackId === (input.trackId) && active.modeId === input.modeId
    ? resumeCertificationPractice(active)
    : Object.freeze({ kind: "active_session_conflict", session: active });
  try {
    await startCertificationPracticeSession(input);
  } catch (cause) {
    if (!(cause instanceof TrainingApplicationFailure) || cause.code !== "active_session_conflict") throw cause;
    const raced = await loadActiveTrainingSession();
    if (!raced) throw cause;
    return raced.trackId === (input.trackId) && raced.modeId === input.modeId
      ? resumeCertificationPractice(raced)
      : Object.freeze({ kind: "active_session_conflict", session: raced });
  }
  return Object.freeze({ kind: "ready", projection: await getCertificationPracticeProjection() });
}

export async function resumeExpectedCertificationExam(trackId: TrackId, expectedSessionId: string): Promise<CertificationExamResumeResult> {
  const active = await loadActiveTrainingSession();
  if (!active) throw new TrainingApplicationFailure("resume_unavailable", `Expected Cloud exam ${expectedSessionId} is no longer active.`);
  if (active.id !== expectedSessionId || active.trackId !== trackId || active.modeId !== "certification-exam-simulation") {
    return Object.freeze({ kind: "active_session_conflict", session: active });
  }
  const resumed = await getTrainingLifecycleUseCases().resumeActiveSession();
  if (resumed.id !== expectedSessionId || resumed.trackId !== trackId || resumed.modeId !== "certification-exam-simulation") {
    return Object.freeze({ kind: "active_session_conflict", session: resumed });
  }
  return Object.freeze({ kind: "ready", projection: await getCertificationExamProjection() });
}
export async function startCertificationExam(trackId: TrackId, source = "practiceHub"): Promise<PreparedSession> {
  return startTrainingSession({ trackId, modeId: "certification-exam-simulation", source, request: {} });
}
export async function getCertificationPracticeProjection(): Promise<CertificationPracticeProjection> {
  const [initialSession, attempts] = await Promise.all([requireActive(), loadTrainingAttempts()]);
  let session = initialSession;
  if (session.modeId === "certification-exam-simulation") throw new Error("The active Cloud session is an exam simulation.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("Cloud practice occurrence is unavailable.");
  const lifecycle = getTrainingLifecycleUseCases();
  const pending = await lifecycle.getPendingMutationProjection(session.id);
  const materializedAttempt = attempts.value.find((candidate) => candidate.sessionId === session.id && candidate.occurrenceId === occurrence.occurrenceId) ?? null;
  const committedAttempt = pending?.practiceOutcome?.attempt.sessionId === session.id && pending.practiceOutcome.attempt.occurrenceId === occurrence.occurrenceId ? pending.practiceOutcome.attempt : null;
  const responseAttempt = materializedAttempt ?? committedAttempt;
  const resolvedQuestion = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
  const question = resolvedQuestion.question;
  const presentation = resolvedQuestion.interactions.present(question.questionId, responseAttempt?.response ?? null, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []);
  const feedbackMode = certificationFeedbackModeFromSession(session);
  const feedback = projectCertificationPracticeFeedback(feedbackMode, materializedAttempt, resolvedQuestion);
  const caseEvidence = materializedAttempt?.reviewEvidence.evidence?.details;
  if (feedback && isCaseAttemptEvidence(caseEvidence) && sessionCaseStates(session).some(state => state.caseId === caseEvidence.caseId && state.caseVersion === caseEvidence.caseVersion)) session = await lifecycle.recordCaseExposure("solution");
  const [operation, time] = await Promise.all([
    lifecycle.getPracticeOperationState(session, Boolean(materializedAttempt)),
    getForegroundSessionTimerFacade().projection(session),
  ]);
  const response = responseAttempt ? Object.freeze({ source: materializedAttempt ? "materialized" as const : "committed" as const, value: responseAttempt.response as CanonicalQuestionResponse }) : null;
  return Object.freeze({ session, questionPresentation: certificationQuestionPresentation(session.trackId), question: projectCertificationPracticeQuestion(question, presentation.model), occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, elapsedForegroundMs: time.elapsedForegroundMs, operation, response, feedback });
}
export async function submitCertificationPracticeResponse(response: CanonicalQuestionResponse): Promise<void> {
  const endCheckpoint = beginStartupSpan("practice_response_checkpoint");
  try { await getForegroundSessionTimerFacade().checkpointForResponseSave(await requireCertificationPractice()); }
  finally { endCheckpoint(); }
  const endAnswer = beginStartupSpan("practice_answer_command");
  try { await getTrainingLifecycleUseCases().submitPracticeResponse(response); }
  finally { endAnswer(); }
}
export async function retryCertificationPracticeResponse(): Promise<void> { await getTrainingLifecycleUseCases().retryPracticeSubmission(); }

/** Reads complete, exact evidence only after verified Certification Practice completion. */
export async function getCertificationPracticeReviewProjection(sessionId: string): Promise<CertificationPracticeReviewProjection> {
  const assertCurrentProfile = captureProfileReadFence();
  const lifecycle = getTrainingLifecycleUseCases();
  const [result, session, attemptsRecord] = await Promise.all([
    lifecycle.loadSummary(sessionId),
    lifecycle.loadSessionRecord(sessionId),
    loadTrainingAttempts(),
  ]);
  if (session.id !== sessionId) {
    throw new TrainingApplicationFailure("summary_unavailable", "Answer review requires one verified completed Certification Practice session.");
  }
  assertCurrentProfile();
  let diagnosticContext: Parameters<typeof projectCertificationPracticeReview>[0]["diagnosticContext"];
  if (session.modeId === "certification-diagnostic-baseline" && session.trackId === "google-cloud-associate-cloud-engineer") {
    const exact = await contentPackageRuntimeOwner.resolveExactArtifact({ trackId: session.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256 });
    assertCurrentProfile();
    const diagnosticMode = exact.track.getMode("certification-diagnostic-baseline");
    const focusMode = exact.track.getMode("certification-focus-practice");
    if (diagnosticMode.selection.kind !== "exact_ordered_questions" || focusMode.selection.kind !== "node") {
      throw new TrainingApplicationFailure("summary_unavailable", "The verified diagnostic package has no matching Focus practice scope.");
    }
    diagnosticContext = {
      diagnosticQuestionIds: diagnosticMode.selection.questionIds,
      exposureHistoryAvailable: (attemptsRecord.issues?.length ?? 0) === 0,
      focusPool: exact.track.getPool(focusMode.modeId),
      focusMinimumActualLength: focusMode.minimumActualLength,
    };
  }
  const projection = await projectCertificationPracticeReview({
    attempts: attemptsRecord.value,
    ...(diagnosticContext ? { diagnosticContext } : {}),
    resolveQuestion: async (item) => {
      assertCurrentProfile();
      const question = await contentPackageRuntimeOwner.resolveItem(item);
      assertCurrentProfile();
      return question;
    },
    result,
    session: session as CompletedTrainingSession,
  });
  assertCurrentProfile();
  return projection;
}

/** Reads and validates the complete immutable Certification Exam result and review. */
export async function getCertificationExamReviewProjection(sessionId: string): Promise<CertificationExamReviewProjection> {
  const assertCurrentProfile = captureProfileReadFence();
  const lifecycle = getTrainingLifecycleUseCases();
  const [result, session, attemptsRecord] = await Promise.all([
    lifecycle.loadSummary(sessionId),
    lifecycle.loadSessionRecord(sessionId),
    loadTrainingAttempts(),
  ]);
  if (session.id !== sessionId || session.status !== "completed" || !session.completedAt || getTrackRegistration(session.trackId).familyId !== "certification" || session.modeId !== "certification-exam-simulation" ||
    result.sessionId !== session.id || result.trackId !== session.trackId || result.completedAt !== session.completedAt || result.evidence.familyId !== "certification") {
    throw new TrainingApplicationFailure("summary_unavailable", "Answer review requires one verified completed Certification Exam session.");
  }
  assertCurrentProfile();
  const exact = await contentPackageRuntimeOwner.resolveExactArtifact({ trackId: session.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256 });
  assertCurrentProfile();
  const profiles = exact.track.simulationProfiles?.filter((candidate): candidate is import("../../content/canonical").CanonicalSimulationProfile => candidate.profileId === session.configurationSnapshot.simulationProfileId && candidate.profileVersion === session.configurationSnapshot.simulationProfileVersion && candidate.familyId === "certification" && candidate.modeId === "certification-exam-simulation");
  const profile = profiles?.length === 1 ? profiles[0] : undefined;
  if (!profile) throw new TrainingApplicationFailure("summary_unavailable", "The exact Certification Exam profile is unavailable.");
  const projection = await projectCertificationExamReview({
    attempts: attemptsRecord.value,
    profile,
    questionsById: new Map(exact.track.questions.map((question) => [question.questionId, question])),
    resolveItem: async (item) => {
      assertCurrentProfile();
      const resolved = await contentPackageRuntimeOwner.resolveItem(item);
      assertCurrentProfile();
      return resolved;
    },
    result,
    session: session as CompletedTrainingSession,
  });
  assertCurrentProfile();
  return projection;
}
export async function advanceCertificationPracticeSession(): Promise<TrainingSession> {
  const endAdvance = beginStartupSpan("practice_advance_command");
  try { return await getTrainingLifecycleUseCases().advancePracticeSession(); }
  finally { endAdvance(); }
}
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
export async function retryCertificationAbandonmentCommand(expectedSessionId: string): Promise<CertificationAbandonmentResult> {
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
    const active = await loadActiveTrainingSession();
    if (active?.id === expectedSessionId) {
      const operation = await lifecycle.getPracticeOperationState(active, false);
      if (operation.kind === "abandonment_recovery_required" && operation.error.allowedAction === "reconcile") return Object.freeze({ expectedSessionId, kind: "reconcile_required" });
    }
    try {
      return Object.freeze({ kind: "abandoned", session: await lifecycle.recoverExpectedSessionAbandonment(expectedSessionId) });
    } catch {
      // A non-durable failure must still be classified from the exact active session below.
    }
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

export async function reconcileCertificationPracticeAbandonment(expectedSessionId: string): Promise<"verified" | "conflict" | "unknown"> {
  const session = await requireActive();
  if (session.id !== expectedSessionId || !isCertificationPracticeModeId(session.modeId)) throw new TrainingApplicationFailure("resume_unavailable", `Certification practice session ${expectedSessionId} is not the exact active session.`);
  const lifecycle = getTrainingLifecycleUseCases();
  const result = await lifecycle.reconcileUncertainMutation(session.id);
  if (result !== "verified") return result;
  try { await lifecycle.recoverExpectedSessionAbandonment(session.id); return "verified"; }
  catch { return "unknown"; }
}

export async function enterCertificationPracticeForeground(): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().enterForeground(await requireCertificationPractice());
}

export async function leaveCertificationPracticeForeground(reason: ForegroundTimerLeaveReason = "session_exit"): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().leaveForeground(await requireCertificationPractice(), reason);
}

export function subscribeCertificationPracticeProjectionRefresh(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
  return getForegroundSessionTimerFacade().subscribe(listener);
}

export async function getCertificationExamProjection(expectedTrackId?: TrackId): Promise<CertificationExamProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  const initial = await requireActive();
  if (expectedTrackId !== undefined && initial.trackId !== expectedTrackId) throw new TrainingApplicationFailure("resume_unavailable", "The active Certification Exam belongs to a different track.");
  const initialOperation = await lifecycle.getSimulationOperationState(initial);
  const unresolved = initialOperation.kind !== "editable";
  if (!unresolved) await assertCertificationExamIsActive();
  const [session, draft] = await Promise.all([requireActive(), loadActiveTrainingSessionDraft()]);
  if ((expectedTrackId !== undefined && session.trackId !== expectedTrackId) || session.id !== initial.id || session.modeId !== "certification-exam-simulation" || !draft || draft.sessionId !== session.id) throw new Error("The active Cloud exam draft is unavailable.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("Cloud exam occurrence is unavailable.");
  const raw = draft.responsesByOccurrenceId[occurrence.occurrenceId] ?? null;
  const question = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
  if (question.question.questionId !== occurrence.item.questionId || (raw !== null && !question.interactions.isComplete(question.question.questionId, raw))) throw new TrainingApplicationFailure("invalid_response", "Cloud exam response does not match its exact interaction.");
  const interaction = question.interactions.present(question.question.questionId, raw, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []);
  return Object.freeze({ session, draft, question: question.question, interaction, occurrenceId: occurrence.occurrenceId, ordinal: session.currentItemIndex + 1, total: session.actualLength, response: raw, flaggedOccurrenceIds: draft.flaggedOccurrenceIds, now: lifecycle.currentTime(), operation: await lifecycle.getSimulationOperationState(session) });
}

export async function reconcileCertificationExamOperation(): Promise<"verified" | "conflict" | "unknown"> {
  const session = await requireActive();
  if (session.modeId !== "certification-exam-simulation") throw new TrainingApplicationFailure("invalid_response", "Only the active Certification Exam can reconcile its draft save.");
  return getTrainingLifecycleUseCases().reconcileSimulationDraftSave(session.id);
}
export async function retryCertificationExamDraftSave(): Promise<void> {
  await getTrainingLifecycleUseCases().retrySimulationDraftSave();
}
export async function recoverCertificationExamOperation(): Promise<string | null> {
  const session = await requireActive();
  if (session.modeId !== "certification-exam-simulation") throw new TrainingApplicationFailure("invalid_response", "Only the active Certification Exam can recover its pending operation.");
  await getTrainingLifecycleUseCases().recoverActiveTrainingOperation();
  const [active, completed, result] = await Promise.all([loadActiveTrainingSession(), loadTrainingSession(session.id), loadTrainingSessionResult(session.id)]);
  return !active && completed?.status === "completed" && result?.sessionId === session.id ? session.id : null;
}
export async function saveCertificationExamResponse(input: Readonly<{ occurrenceId: string; response: CanonicalQuestionResponse }>): Promise<void> {
  await assertCertificationExamIsActive();
  const projection = await getCertificationExamProjection();
  if (projection.occurrenceId !== input.occurrenceId) throw new Error("Cloud exam response does not belong to the active occurrence.");
  const draft = { ...projection.draft, revision: projection.draft.revision + 1, updatedAt: getTrainingLifecycleUseCases().currentTime(), responsesByOccurrenceId: { ...projection.draft.responsesByOccurrenceId, [input.occurrenceId]: input.response } } as TrainingSessionDraft;
  await getTrainingLifecycleUseCases().saveSimulationDraft({ draft, expectedPreviousRevision: projection.draft.revision });
}

export async function reconcileCertificationPracticeResponse(): Promise<"verified" | "conflict" | "unknown"> {
  const session = await requireActive();
  if (!isCertificationPracticeModeId(session.modeId)) throw new TrainingApplicationFailure("invalid_response", "Only active Certification Practice can reconcile a submitted response.");
  return getTrainingLifecycleUseCases().reconcileUncertainMutation(session.id);
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

async function resumeExpectedCertificationPractice(active: TrainingSession | null, expectedSessionId: string, modeId: CertificationPracticeModeId, trackId: TrackId): Promise<CertificationPracticeOpenResult> {
  if (!active) throw new TrainingApplicationFailure("resume_unavailable", `Expected Cloud practice session ${expectedSessionId} is no longer active.`);
  if (active.id !== expectedSessionId || active.trackId !== trackId || active.modeId !== modeId || !isCertificationPracticeModeId(active.modeId)) {
    return Object.freeze({ kind: "active_session_conflict", session: active });
  }
  return resumeCertificationPractice(active);
}

async function resumeCertificationPractice(expected: TrainingSession): Promise<CertificationPracticeOpenResult> {
  const resumed = await getTrainingLifecycleUseCases().resumeActiveSession();
  if (resumed.id !== expected.id || resumed.trackId !== expected.trackId || resumed.modeId !== expected.modeId || !isCertificationPracticeModeId(resumed.modeId)) {
    return Object.freeze({ kind: "active_session_conflict", session: resumed });
  }
  await getForegroundSessionTimerFacade().restoreForResume(resumed);
  return Object.freeze({ kind: "ready", projection: await getCertificationPracticeProjection() });
}

function certificationFeedbackModeFromSession(session: TrainingSession): "afterEachAnswer" | "atSessionEnd" {
  const feedbackMode = session.configurationSnapshot.feedbackMode;
  if (feedbackMode !== "afterEachAnswer" && feedbackMode !== "atSessionEnd") {
    throw new TrainingApplicationFailure("corrupt_state", "Certification Practice is missing its immutable feedback timing.");
  }
  return feedbackMode;
}

/** Removes answer material before a practice question crosses the application boundary. */
export function projectCertificationPracticeQuestion(question: TrainingQuestionSummary, model: unknown): CertificationPracticeQuestion {
  if (question.interactionType !== "choice_single" && question.interactionType !== "choice_multiple") {
    throw new TrainingApplicationFailure("missing_content", "Certification Practice requires a declared choice interaction.");
  }
  const renderer = (model as { renderer?: { kind?: string; options?: readonly Readonly<{ id: string; text: string }>[] } }).renderer;
  if (renderer?.kind !== "choice" || !Array.isArray(renderer.options) || renderer.options.some((option) => typeof option.id !== "string" || typeof option.text !== "string")) {
    throw new TrainingApplicationFailure("missing_content", "Certification Practice choice presentation is unavailable.");
  }
  const options = Object.freeze(renderer.options.map((option) => Object.freeze({ optionId: option.id, text: option.text })));
  return Object.freeze({
    interaction: Object.freeze({ type: question.interactionType, scoringMethod: "exact_selected_set", options }),
    nodeId: question.nodeId,
    prompt: question.prompt,
    questionId: question.questionId,
  });
}

/** Deferred sessions expose committed response state, but never correctness before completion. */
export function projectCertificationPracticeFeedback(
  feedbackMode: "afterEachAnswer" | "atSessionEnd",
  attempt: Readonly<{ response: unknown; result: Readonly<{ kind: AttemptResultKind }> }> | null,
  exact: ResolvedInteractionItem,
): CertificationPracticeProjection["feedback"] {
  if (!attempt || feedbackMode !== "afterEachAnswer") return null;
  const question = exact.question;
  const feedback = exact.interactions.projectFeedback(question.questionId, attempt.response);
  if (!feedback || (question.interactionType !== "choice_single" && question.interactionType !== "choice_multiple")) return null;
  return Object.freeze({ controls: projectInteractionControls(exact.interactions.projectDiagnostics(question.questionId, attempt.response)), ...(feedback.messages === undefined ? {} : { messages: feedback.messages }), result: attempt.result.kind, reason: feedback.reason, details: feedback.details, sources: projectCanonicalSourceEvidence({ sourceRefs: question.sourceRefs, feedback }) });
}

function projectInteractionControls(value: unknown): readonly Readonly<{ id: string; state: CanonicalChoiceFeedbackState }>[] {
  if (!Array.isArray(value) || value.some((entry) => !entry || typeof entry !== "object" || typeof (entry as { id?: unknown }).id !== "string" || !["correct", "incorrect", "omitted_correct", "neutral"].includes(String((entry as { state?: unknown }).state)))) {
    throw new TrainingApplicationFailure("verification_failure", "Certification Practice feedback controls are unavailable.");
  }
  return Object.freeze(value.map((entry) => Object.freeze({ id: (entry as { id: string }).id, state: (entry as { state: CanonicalChoiceFeedbackState }).state })));
}

async function requireActive(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (!session || getTrackRegistration(session.trackId).familyId !== "certification") throw new Error("No active Certification session is available.");
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
