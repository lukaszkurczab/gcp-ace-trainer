import { loadActiveTrainingSession, loadActiveTrainingSessionDraft, loadTrainingAttempts } from "../learningReadModels";
import {
  getForegroundSessionTimerFacade,
  getTrainingLifecycleUseCases,
  PracticeCompletionCheckpointError,
  startTrainingSession,
  type ForegroundSessionTimerEvent,
  type ForegroundTimeProjection,
  type PreparedSession,
  type PracticeCompletionCommandResult,
  type PracticeFinalization,
} from "../trainingLifecycle";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import type { ContentItemRef, TrainingSession } from "../../domain";
import {
  buildAlgorithmInteractionViewModel,
  composeCommittedAlgorithmPracticeFeedback,
  getAlgorithmsInterviewSimulationRemainingMs,
  mutateAlgorithmsInterviewSimulationDraft,
} from "../../tracks/coding-interview";
import { ALGORITHM_MODE_IDS, type AlgorithmModeId, type AlgorithmResponse } from "../../tracks/coding-interview/domain";
import type { AlgorithmsLifecyclePreparationRequest } from "./CodingInterviewFamilyRuntime";
import type { PracticeDurableOperationState, SimulationDurableOperationState } from "../trainingLifecycle";
import { TrainingApplicationFailure } from "../trainingLifecycle";
import type { AlgorithmFeedbackDocument } from "../../content/contracts";
import type { AlgorithmQuestion } from "../../tracks/coding-interview/algorithmQuestionTypes";

const saveAndContinueInFlight = new Map<string, Promise<AlgorithmsSimulationProjection>>();

export type AlgorithmsSessionPosition = Readonly<{ current: number; total: number }>;
export type AlgorithmsPracticeProjection = Readonly<{
  kind: "practice";
  operation: PracticeDurableOperationState;
  session: TrainingSession;
  position: AlgorithmsSessionPosition;
  item: ContentItemRef;
  roadmapNodeId: string;
  prompt: string;
  constraints: readonly string[];
  elapsedForegroundMs: number;
  interaction: ReturnType<typeof buildAlgorithmInteractionViewModel>;
  feedback: Readonly<{
    correctness: "correct" | "partial" | "incorrect";
    reason: string;
    details: AlgorithmFeedbackDocument;
    wrongOptionExplanations: readonly Readonly<{ optionId: string; text: string }>[];
    omittedCorrectOptionExplanations: readonly Readonly<{ optionId: string; text: string }>[];
    controls: readonly Readonly<{ id: string; state: "selected" | "correct" | "incorrect" | "omitted_correct" | "neutral" }> [];
  }> | null;
  response: Readonly<{ source: "local" | "committed" | "materialized"; value: AlgorithmResponse }> | null;
}>;

export type AlgorithmsSimulationProjection = Readonly<{
  kind: "simulation";
  operation: SimulationDurableOperationState;
  session: TrainingSession;
  position: AlgorithmsSessionPosition;
  navigator: readonly Readonly<{ index: number; occurrenceId: string; answered: boolean; current: boolean }>[];
  item: ContentItemRef;
  prompt: string;
  interaction: ReturnType<typeof buildAlgorithmInteractionViewModel>;
  durableDraftRevision: number;
  elapsedForegroundMs: number;
  remainingForegroundMs: number;
}>;

export type AlgorithmsSimulationScreenProjection =
  | Readonly<{ kind: "ready"; projection: AlgorithmsSimulationProjection }>
  | Readonly<{ kind: "unavailable"; operation: Extract<SimulationDurableOperationState, { error: unknown }> }>;

export type AlgorithmsSessionResultProjection = Readonly<{
  completionKind: "abandoned" | "completed";
  sessionId: string;
  totalOccurrences: number;
  answeredOccurrenceIds: readonly string[];
  unansweredOccurrenceIds: readonly string[];
  completedAt: string;
  elapsedForegroundMs: number;
  configuration: Readonly<{
    actualLength: number;
    feedbackTiming: "afterEachAnswer" | "atSessionEnd";
    requestedLength: number;
  }>;
  feedbackItems: readonly Readonly<{
    correctness: "correct" | "partial" | "incorrect";
    details: AlgorithmFeedbackDocument;
    item: ContentItemRef;
    itemId: string;
    occurrenceId: string;
    ordinal: number;
    prompt: string;
    reason: string;
  }>[];
  score: Readonly<{ correctCount: number; partialCount: number; incorrectCount: number; pointsEarned: number; maxPoints: number }> | null;
}>;

export type AlgorithmsInterviewSimulationEntry = Readonly<{
  trackId: "coding-interview-dsa-problem-solving";
  modeId: typeof ALGORITHM_MODE_IDS.interviewSimulation;
  profileId: string;
  requestedLength: 40;
}>;

type StartAlgorithmsSessionInput = Omit<AlgorithmsLifecyclePreparationRequest, "sessionId"> & Readonly<{
  modeId: AlgorithmModeId;
  source?: string;
}>;

/** UI-facing canonical entry points. No storage, runtime, selection or timer ownership leaks into presentation. */
export async function startAlgorithmsSession(input: StartAlgorithmsSessionInput): Promise<PreparedSession> {
  const prepared = await startTrainingSession({
    trackId: "coding-interview-dsa-problem-solving",
    modeId: input.modeId,
    source: input.source,
    request: input,
  });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  return prepared;
}

/** Declared profile identity only; presentation never reinterprets a topic as a simulation profile. */
export function getAlgorithmsInterviewSimulationEntry(): AlgorithmsInterviewSimulationEntry {
  throw new Error("Algorithms Interview Simulation is excluded from the bundled Free package profile.");
}

export async function getAlgorithmsPracticeProjection(): Promise<AlgorithmsPracticeProjection> {
  const [session, attempts] = await Promise.all([requireAlgorithmsSession(), loadTrainingAttempts()]);
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("The active Algorithms session is an Interview Simulation.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("The active Algorithms practice occurrence is unavailable.");
  const question = await contentPackageRuntimeOwner.resolveItem(occurrence.item) as AlgorithmQuestion;
  const lifecycle = getTrainingLifecycleUseCases();
  const pending = await lifecycle.getPendingMutationProjection(session.id);
  const materializedAttempt = attempts.value.find((candidate) => candidate.sessionId === session.id && candidate.occurrenceId === occurrence.occurrenceId);
  const committedAttempt = pending?.practiceOutcome?.attempt.sessionId === session.id && pending.practiceOutcome.attempt.occurrenceId === occurrence.occurrenceId ? pending.practiceOutcome.attempt : null;
  const attempt = materializedAttempt ?? committedAttempt;
  const response = (attempt?.response ?? null) as AlgorithmResponse | null;
  const feedback = attempt && feedbackIsAvailableDuringPractice(session)
    ? composeCommittedAlgorithmPracticeFeedback({ question, attempt: attempt as import("../../domain").TrainingAttempt<AlgorithmResponse> })
    : null;
  const [operation, time] = await Promise.all([
    lifecycle.getPracticeOperationState(session, Boolean(materializedAttempt)),
    getForegroundSessionTimerFacade().projection(session),
  ]);
  return Object.freeze({
    kind: "practice",
    operation,
    session,
    position: position(session),
    item: occurrence.item,
    roadmapNodeId: question.taxonomy.roadmapNodeId,
    prompt: question.prompt,
    constraints: Object.freeze([...(question.constraints ?? [])]),
    elapsedForegroundMs: time.elapsedForegroundMs,
    interaction: buildAlgorithmInteractionViewModel(question, response, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []),
    feedback,
    response: response ? Object.freeze({ source: materializedAttempt ? "materialized" as const : "committed" as const, value: response }) : null,
  });
}

export async function submitAlgorithmsPracticeResponse(response: AlgorithmResponse): Promise<void> {
  await getForegroundSessionTimerFacade().checkpointForResponseSave(await requireAlgorithmsSession());
  await getTrainingLifecycleUseCases().submitPracticeResponse(response);
}

/** Replays the single durable practice operation that is already journaled. */
export async function recoverAlgorithmsPracticeOperation(): Promise<void> {
  await getTrainingLifecycleUseCases().recoverActiveTrainingOperation();
}

export function subscribeAlgorithmsPracticeOperation(sessionId: string, listener: (operation: PracticeDurableOperationState) => void): () => void {
  return getTrainingLifecycleUseCases().subscribeOperationProjection(sessionId, (operation) => {
    if (operation.family === "practice") listener(operation);
  });
}

export async function advanceAlgorithmsPracticeSession(): Promise<TrainingSession> {
  return getTrainingLifecycleUseCases().advancePracticeSession();
}

export async function completeAlgorithmsPracticeSession(): Promise<PracticeCompletionCommandResult<PracticeFinalization>> {
  const session = await requireAlgorithmsSession();
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

export async function retryAlgorithmsPracticeCompletionCheckpoint(expectedSessionId: string): Promise<AlgorithmsPracticeProjection> {
  const session = await requireExactAlgorithmsPractice(expectedSessionId);
  const lifecycle = getTrainingLifecycleUseCases();
  await getForegroundSessionTimerFacade().retryPracticeCompletionCheckpointAfterFailure(session);
  await lifecycle.reconstructOperationProjection(session);
  return getAlgorithmsPracticeProjection();
}

export async function recoverAlgorithmsPracticeCompletionCheckpoint(expectedSessionId: string): Promise<AlgorithmsPracticeProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  const pending = await lifecycle.getExpectedSessionPendingMutation(expectedSessionId);
  if (!pending || pending.operation !== "advance_training_session") throw new TrainingApplicationFailure("resume_unavailable", `No matching final-checkpoint journal exists for ${expectedSessionId}.`);
  await lifecycle.recoverActiveTrainingOperation();
  const session = await requireExactAlgorithmsPractice(expectedSessionId);
  await getForegroundSessionTimerFacade().retryPracticeCompletionCheckpointAfterFailure(session);
  await lifecycle.reconstructOperationProjection(session);
  return getAlgorithmsPracticeProjection();
}

export async function recoverAlgorithmsPracticeCompletion(expectedSessionId: string): Promise<PracticeFinalization> {
  const finalized = await getTrainingLifecycleUseCases().recoverExpectedSessionCompletion(expectedSessionId);
  getForegroundSessionTimerFacade().releaseAfterVerifiedPracticeCompletion(expectedSessionId);
  return finalized;
}

export async function getAlgorithmsSimulationProjection(): Promise<AlgorithmsSimulationProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("The active Algorithms session is not an Interview Simulation.");
  const lifecycle = getTrainingLifecycleUseCases();
  await lifecycle.resumeActiveSession();
  const draft = await requireSimulationDraft(session.id);
  const index = session.currentItemIndex;
  if (!Number.isInteger(index) || index < 0 || index >= session.itemOrder.length) throw new Error("Interview Simulation navigator position is outside the immutable session.");
  const occurrence = session.itemOrder[index]!;
  const question = await contentPackageRuntimeOwner.resolveItem(occurrence.item) as AlgorithmQuestion;
  const time = await getForegroundSessionTimerFacade().projection(session);
  if (time.remainingForegroundMs === undefined) throw new Error("Interview Simulation countdown projection is unavailable.");
  const operation = await lifecycle.getSimulationOperationState(session);
  return Object.freeze({
    kind: "simulation",
    operation,
    session,
    position: { current: index + 1, total: session.actualLength },
    navigator: Object.freeze(session.itemOrder.map((candidate, candidateIndex) => Object.freeze({
      index: candidateIndex,
      occurrenceId: candidate.occurrenceId,
      answered: draft.responsesByOccurrenceId[candidate.occurrenceId] !== undefined,
      current: candidateIndex === index,
    }))),
    item: occurrence.item,
    prompt: question.prompt,
    interaction: buildAlgorithmInteractionViewModel(question, (draft.responsesByOccurrenceId[occurrence.occurrenceId] ?? null) as AlgorithmResponse | null, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []),
    durableDraftRevision: draft.revision,
    elapsedForegroundMs: time.elapsedForegroundMs,
    remainingForegroundMs: time.remainingForegroundMs,
  });
}

/** Typed failure boundary for presentation; no screen may classify error text. */
export async function getAlgorithmsSimulationScreenProjection(): Promise<AlgorithmsSimulationScreenProjection> {
  try { return Object.freeze({ kind: "ready", projection: await getAlgorithmsSimulationProjection() }); }
  catch (error) { return Object.freeze({ kind: "unavailable", operation: simulationFailureProjection(error) }); }
}

export async function navigateAlgorithmsSimulationTo(index: number): Promise<TrainingSession> {
  return getTrainingLifecycleUseCases().moveSimulationSessionTo(index);
}

/** One navigator command persists a changed response before it changes the durable active occurrence. */
export async function saveAlgorithmsSimulationResponseAndNavigate(input: Readonly<{ occurrenceId: string; response: AlgorithmResponse | null; targetIndex: number }>): Promise<AlgorithmsSimulationProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation can save and jump.");
  const current = session.itemOrder[session.currentItemIndex];
  if (!current || current.occurrenceId !== input.occurrenceId) throw new TrainingApplicationFailure("invalid_response", "Save and jump requires the active Interview Simulation occurrence.");
  if (!Number.isSafeInteger(input.targetIndex) || input.targetIndex < 0 || input.targetIndex >= session.itemOrder.length) {
    throw new TrainingApplicationFailure("invalid_response", "Save and jump requires a valid Interview Simulation target occurrence.");
  }
  const previousRevision = (await requireSimulationDraft(session.id)).revision;
  await saveAlgorithmsSimulationResponse({ occurrenceId: input.occurrenceId, response: input.response });
  const saved = await requireSimulationDraft(session.id);
  const savedResponse = saved.responsesByOccurrenceId[input.occurrenceId];
  if (saved.revision !== previousRevision + 1 || (input.response === null ? savedResponse !== undefined : JSON.stringify(savedResponse) !== JSON.stringify(input.response))) {
    throw new TrainingApplicationFailure("verification_failure", "Save and jump could not verify the durable simulation response revision.");
  }
  const navigated = input.targetIndex === session.currentItemIndex ? session : await navigateAlgorithmsSimulationTo(input.targetIndex);
  if (navigated.currentItemIndex !== input.targetIndex) {
    throw new TrainingApplicationFailure("verification_failure", "Save and jump could not verify the requested simulation position.");
  }
  const projection = await getAlgorithmsSimulationProjection();
  if (projection.session.id !== session.id || projection.position.current !== input.targetIndex + 1 || projection.durableDraftRevision !== saved.revision) {
    throw new TrainingApplicationFailure("verification_failure", "Save and jump could not publish the verified simulation projection.");
  }
  return projection;
}

export async function saveAlgorithmsSimulationResponse(input: Readonly<{ occurrenceId: string; response: AlgorithmResponse | null }>): Promise<void> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation has a persisted response draft.");
  const draft = await requireSimulationDraft(session.id);
  const nextDraft = mutateAlgorithmsInterviewSimulationDraft({
    entries: ((await contentPackageRuntimeOwner.resolveExact(session.packagePin)).profile.items as readonly AlgorithmQuestion[]).map((question) => ({ question, roadmapNodeId: question.taxonomy.roadmapNodeId })),
    occurrenceId: input.occurrenceId,
    response: input.response,
    session,
    draft,
    updatedAt: getTrainingLifecycleUseCases().currentTime(),
  });
  await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
  await getTrainingLifecycleUseCases().saveSimulationDraft({ draft: nextDraft, expectedPreviousRevision: draft.revision });
}

/** One application command owns the non-final simulation action: save, verify, advance, then publish the next projection. */
export async function saveAlgorithmsSimulationResponseAndContinue(input: Readonly<{ occurrenceId: string; response: AlgorithmResponse }>): Promise<AlgorithmsSimulationProjection> {
  const session = await requireAlgorithmsSession();
  const commandKey = `${session.id}:${input.occurrenceId}:${JSON.stringify(input.response)}`;
  const inFlight = saveAndContinueInFlight.get(commandKey);
  if (inFlight) return inFlight;
  const operation = saveAlgorithmsSimulationResponseAndContinueForSession(session, input);
  saveAndContinueInFlight.set(commandKey, operation);
  try { return await operation; }
  finally { if (saveAndContinueInFlight.get(commandKey) === operation) saveAndContinueInFlight.delete(commandKey); }
}

async function saveAlgorithmsSimulationResponseAndContinueForSession(session: TrainingSession, input: Readonly<{ occurrenceId: string; response: AlgorithmResponse }>): Promise<AlgorithmsSimulationProjection> {
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation can save and continue.");
  const current = session.itemOrder[session.currentItemIndex];
  if (!current || current.occurrenceId !== input.occurrenceId) throw new TrainingApplicationFailure("invalid_response", "Save and continue requires the active Interview Simulation occurrence.");
  if (session.currentItemIndex >= session.itemOrder.length - 1) throw new TrainingApplicationFailure("invalid_response", "The final Interview Simulation occurrence cannot save and continue.");
  const previousRevision = (await requireSimulationDraft(session.id)).revision;
  await saveAlgorithmsSimulationResponse(input);
  const saved = await requireSimulationDraft(session.id);
  if (saved.revision !== previousRevision + 1 || saved.responsesByOccurrenceId[input.occurrenceId] === undefined) {
    throw new TrainingApplicationFailure("verification_failure", "Save and continue could not verify the durable simulation response revision.");
  }
  let advanced: TrainingSession;
  try { advanced = await navigateAlgorithmsSimulationTo(session.currentItemIndex + 1); }
  catch (error) {
    getTrainingLifecycleUseCases().markSimulationSaveAndContinueAdvanceRecovery(session.id, error);
    throw error;
  }
  if (advanced.currentItemIndex !== session.currentItemIndex + 1) {
    throw new TrainingApplicationFailure("verification_failure", "Save and continue could not verify the durable simulation position.");
  }
  const projection = await getAlgorithmsSimulationProjection();
  if (projection.session.id !== session.id || projection.position.current !== advanced.currentItemIndex + 1 || projection.durableDraftRevision !== saved.revision) {
    throw new TrainingApplicationFailure("verification_failure", "Save and continue could not publish the verified next simulation projection.");
  }
  return projection;
}

/** Recovery continues a response already verified as durable; it never writes that response again. */
export async function recoverAlgorithmsSimulationSaveAndContinue(input: Readonly<{ occurrenceId: string }>): Promise<AlgorithmsSimulationProjection> {
  let session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation can recover save and continue.");
  const sourceIndex = session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === input.occurrenceId);
  if (sourceIndex < 0 || sourceIndex >= session.itemOrder.length - 1 || session.currentItemIndex !== sourceIndex) {
    throw new TrainingApplicationFailure("invalid_response", "Save-and-continue recovery requires its still-active non-final occurrence.");
  }
  const draft = await requireSimulationDraft(session.id);
  if (draft.responsesByOccurrenceId[input.occurrenceId] === undefined) {
    throw new TrainingApplicationFailure("missing_draft", "Save-and-continue recovery requires the durable response it is continuing from.");
  }
  const lifecycle = getTrainingLifecycleUseCases();
  await lifecycle.recoverActiveTrainingOperation();
  session = await requireAlgorithmsSession();
  if (session.currentItemIndex === sourceIndex) await navigateAlgorithmsSimulationTo(sourceIndex + 1);
  if (session.currentItemIndex !== sourceIndex + 1) {
    throw new TrainingApplicationFailure("verification_failure", "Save-and-continue recovery could not verify the next simulation position.");
  }
  const projection = await getAlgorithmsSimulationProjection();
  if (projection.durableDraftRevision !== draft.revision || projection.position.current !== sourceIndex + 2) {
    throw new TrainingApplicationFailure("verification_failure", "Save-and-continue recovery could not publish the verified next simulation projection.");
  }
  return projection;
}

/** Restores response editing only after the lifecycle proves that the failed save made no durable draft change. */
export async function resumeAlgorithmsSimulationEditingAfterSaveFailure(): Promise<void> {
  await getTrainingLifecycleUseCases().resumeEditableSimulationAfterSaveFailure();
}

/** Replays only the exact durable Simulation operation that the lifecycle exposes as recoverable. */
export async function recoverAlgorithmsSimulationOperation(): Promise<void> {
  const session = await requireAlgorithmsSession();
  const lifecycle = getTrainingLifecycleUseCases();
  const operation = await lifecycle.getSimulationOperationState(session);
  if (!("error" in operation) || operation.error.allowedAction !== "recover") {
    throw new TrainingApplicationFailure("invalid_response", "The current simulation operation does not allow recovery.");
  }
  await lifecycle.recoverActiveTrainingOperation();
}

export async function finalizeAlgorithmsSimulation(): Promise<void> {
  const session = await requireAlgorithmsSession();
  await getForegroundSessionTimerFacade().finalizeCountdownManually(session);
}

export async function abandonAlgorithmsSession(): Promise<TrainingSession> {
  const session = await requireAlgorithmsSession();
  await getForegroundSessionTimerFacade().leaveForeground(session);
  return getTrainingLifecycleUseCases().abandonActiveSession();
}

export async function enterAlgorithmsSimulationForeground(): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().enterForeground(await requireAlgorithmsSession());
}

export async function leaveAlgorithmsSimulationForeground(): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().leaveForeground(await requireAlgorithmsSession());
}

/** Presentation receives application-owned projection refreshes; it never runs a countdown. */
export function subscribeAlgorithmsSimulationProjectionRefresh(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
  return getForegroundSessionTimerFacade().subscribe(listener);
}

export async function enterAlgorithmsPracticeForeground(): Promise<ForegroundTimeProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Interview Simulation must use its simulation foreground boundary.");
  return getForegroundSessionTimerFacade().enterForeground(session);
}

export async function leaveAlgorithmsPracticeForeground(): Promise<ForegroundTimeProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Interview Simulation must use its simulation foreground boundary.");
  return getForegroundSessionTimerFacade().leaveForeground(session);
}

export function subscribeAlgorithmsPracticeProjectionRefresh(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
  return getForegroundSessionTimerFacade().subscribe(listener);
}

export async function getAlgorithmsPracticeResultProjection(sessionId: string): Promise<AlgorithmsSessionResultProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  const [result, history, attempts] = await Promise.all([
    lifecycle.loadSummary(sessionId),
    lifecycle.queryHistory(),
    loadTrainingAttempts(),
  ]);
  const session = history.find((candidate) => candidate.id === sessionId);
  if (!session || session.trackId !== "coding-interview-dsa-problem-solving" || session.status !== "completed" || result.trackId !== "coding-interview-dsa-problem-solving") {
    throw new Error("The completed session is not an Algorithms result.");
  }
  const feedbackTiming = feedbackTimingFromSession(session);
  return Object.freeze({
    completionKind: "completed",
    sessionId: result.sessionId,
    totalOccurrences: result.totalOccurrences,
    answeredOccurrenceIds: Object.freeze([...result.answeredOccurrenceIds]),
    unansweredOccurrenceIds: Object.freeze([...result.unansweredOccurrenceIds]),
    completedAt: result.completedAt,
    elapsedForegroundMs: session.activeForegroundMs,
    configuration: Object.freeze({
      actualLength: session.actualLength,
      feedbackTiming,
      requestedLength: session.requestedLength,
    }),
    feedbackItems: feedbackTiming === "atSessionEnd"
      ? await completedFeedbackItems(session, attempts.value)
      : Object.freeze([]),
    score: resultScore(result.evidence.details),
  });
}

export async function getAlgorithmsPracticeSummaryProjection(sessionId: string): Promise<AlgorithmsSessionResultProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  const session = await lifecycle.loadSessionRecord(sessionId);
  if (session.status === "completed") return getAlgorithmsPracticeResultProjection(sessionId);
  if (session.status !== "abandoned" || session.trackId !== "coding-interview-dsa-problem-solving" || !session.completedAt || session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) {
    throw new Error("Only a completed or explicitly ended Algorithms practice session has a summary.");
  }
  const attempts = (await loadTrainingAttempts()).value.filter((attempt) => attempt.sessionId === session.id);
  const answeredOccurrenceIds = session.itemOrder
    .filter((occurrence) => attempts.some((attempt) => attempt.occurrenceId === occurrence.occurrenceId))
    .map((occurrence) => occurrence.occurrenceId);
  const answered = new Set(answeredOccurrenceIds);
  return Object.freeze({
    completionKind: "abandoned",
    sessionId: session.id,
    totalOccurrences: session.actualLength,
    answeredOccurrenceIds: Object.freeze(answeredOccurrenceIds),
    unansweredOccurrenceIds: Object.freeze(session.itemOrder.filter((occurrence) => !answered.has(occurrence.occurrenceId)).map((occurrence) => occurrence.occurrenceId)),
    completedAt: session.completedAt,
    elapsedForegroundMs: session.activeForegroundMs,
    configuration: Object.freeze({
      actualLength: session.actualLength,
      feedbackTiming: feedbackTimingFromSession(session),
      requestedLength: session.requestedLength,
    }),
    feedbackItems: Object.freeze([]),
    score: null,
  });
}

async function requireAlgorithmsSession(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (!session || session.trackId !== "coding-interview-dsa-problem-solving") throw new Error("No active Algorithms session is available.");
  return session;
}

async function requireExactAlgorithmsPractice(expectedSessionId: string): Promise<TrainingSession> {
  const session = await requireAlgorithmsSession();
  if (session.id !== expectedSessionId || session.configurationSnapshot.submission !== "perItem") throw new TrainingApplicationFailure("resume_unavailable", `Algorithms practice session ${expectedSessionId} is not the exact active session.`);
  return session;
}

async function requireSimulationDraft(sessionId: string) {
  const lifecycle = getTrainingLifecycleUseCases();
  // The lifecycle owns validation; this facade intentionally never infers a draft.
  await lifecycle.resumeActiveSession();
  const session = await loadActiveTrainingSession();
  if (!session || session.id !== sessionId) throw new TrainingApplicationFailure("corrupt_state", "The active Interview Simulation changed while loading its draft.");
  const draft = await loadActiveTrainingSessionDraft();
  if (!draft || draft.sessionId !== sessionId) throw new TrainingApplicationFailure("missing_draft", "The active Interview Simulation draft is unavailable.");
  return draft;
}

function simulationFailureProjection(error: unknown): Extract<SimulationDurableOperationState, { error: unknown }> {
  const code = error instanceof TrainingApplicationFailure ? error.code : "corrupt_state";
  const operation = code === "timer_recovery_failure" ? "timer_recovery_failed"
    : code === "missing_draft" ? "missing_draft"
      : code === "version_mismatch" ? "version_mismatch"
        : code === "stale_revision" ? "stale_revision" : "corrupt_state";
  const command = operation === "timer_recovery_failed" ? "simulation_resume" : operation === "stale_revision" ? "simulation_save" : "simulation_resume";
  return Object.freeze({ kind: operation, error: Object.freeze({ operation: command, durableState: "not_durable", retrySafety: "retry_forbidden", allowedAction: "none", prohibitedFallback: "The UI will not reconstruct an Algorithms simulation from local state." }) }) as Extract<SimulationDurableOperationState, { error: unknown }>;
}

function position(session: TrainingSession): AlgorithmsSessionPosition {
  return Object.freeze({ current: session.currentItemIndex + 1, total: session.actualLength });
}

function feedbackIsAvailableDuringPractice(session: TrainingSession): boolean {
  return feedbackTimingFromSession(session) === "afterEachAnswer";
}

function feedbackTimingFromSession(session: TrainingSession): "afterEachAnswer" | "atSessionEnd" {
  const timing = session.configurationSnapshot.feedbackMode;
  if (timing === "afterEachAnswer" || timing === "atSessionEnd") return timing;
  throw new Error("Algorithms session is missing its canonical feedback timing.");
}

async function completedFeedbackItems(session: TrainingSession, attempts: readonly import("../../domain").TrainingAttempt<unknown>[]): Promise<AlgorithmsSessionResultProjection["feedbackItems"]> {
  const attemptsByOccurrenceId = new Map<string, import("../../domain").TrainingAttempt<unknown>>();
  for (const attempt of attempts) {
    if (attempt.sessionId !== session.id) continue;
    if (attemptsByOccurrenceId.has(attempt.occurrenceId)) throw new Error("Completed Algorithms session has duplicate attempts for one occurrence.");
    attemptsByOccurrenceId.set(attempt.occurrenceId, attempt);
  }
  const questions = await Promise.all(session.itemOrder.map((occurrence) => contentPackageRuntimeOwner.resolveItem(occurrence.item) as Promise<AlgorithmQuestion>));
  return Object.freeze(session.itemOrder.flatMap((occurrence, index) => {
    const attempt = attemptsByOccurrenceId.get(occurrence.occurrenceId);
    if (!attempt) return [];
    const question = questions[index]!;
    const feedback = composeCommittedAlgorithmPracticeFeedback({
      question,
      attempt: attempt as import("../../domain").TrainingAttempt<AlgorithmResponse>,
    });
    return [Object.freeze({
      correctness: feedback.correctness,
      details: feedback.details,
      item: occurrence.item,
      itemId: occurrence.item.itemId,
      occurrenceId: occurrence.occurrenceId,
      ordinal: index + 1,
      prompt: question.prompt,
      reason: feedback.reason,
    })];
  }));
}

function resultScore(value: unknown): AlgorithmsSessionResultProjection["score"] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const details = value as Record<string, unknown>;
  const fields = ["correctCount", "partialCount", "incorrectCount", "pointsEarned", "maxPoints"] as const;
  if (!fields.every((field) => typeof details[field] === "number" && Number.isFinite(details[field]))) return null;
  return Object.freeze({
    correctCount: details.correctCount as number,
    partialCount: details.partialCount as number,
    incorrectCount: details.incorrectCount as number,
    pointsEarned: details.pointsEarned as number,
    maxPoints: details.maxPoints as number,
  });
}
