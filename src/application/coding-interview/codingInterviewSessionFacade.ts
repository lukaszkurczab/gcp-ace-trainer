import type { ForegroundTimerLeaveReason } from "../runtime/ForegroundSessionTimer";
import { loadActiveTrainingSession, loadActiveTrainingSessionDraft, loadTrainingAttempts, loadTrainingSession } from "../learningReadModels";
import {
  getForegroundSessionTimerFacade,
  PracticeCompletionCheckpointError,
  getTrainingLifecycleUseCases,
  startTrainingSession,
  type TrainingLifecycleUseCases,
  type ForegroundSessionTimerFacade,
  type ForegroundSessionTimerEvent,
  type ForegroundTimeProjection,
  type PreparedSession,
  type PracticeCompletionCommandResult,
  type PracticeFinalization,
  type SimulationCommandAuthorization,
} from "../trainingLifecycle";
import { contentPackageRuntimeOwner, type ContentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { resolvedContentRefsEqual, type ResolvedContentRef, type TrainingAttempt, type TrainingSession, type TrainingSessionResult } from "../../domain";
import type { TrainingQuestionSummary } from "../trainingLifecycle/contracts";
import { ALGORITHM_MODE_IDS, type AlgorithmModeId, type AlgorithmResponse } from "../../tracks/coding-interview/domain";
import type { AlgorithmsLifecyclePreparationRequest } from "./codingInterviewContracts";
import { simulationHasReviewConflict, type PracticeDurableOperationState, type SimulationDurableOperationState } from "../trainingLifecycle";
import { TrainingApplicationFailure } from "../trainingLifecycle";
import type { CanonicalQuestionResponse, JsonValue } from "../../content/canonical";
import type { ResolvedInteractionItem } from "../contentPackageRuntimeOwner";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { isCanonicalOptionOrder } from "../canonical/canonicalOptionOrder";
import { getProductSimulationModeConfig, ProductModeUnavailableError } from "../../content/canonical/productModeConfig";
import { projectCanonicalSourceEvidence, type CanonicalSourceLink } from "../canonical/canonicalSourceLinks";
import { overallScoreCredit } from "../canonical/overallScoreCredit";
import { isApproachChallengeTrainingAttempt } from "../../tracks/coding-interview/domain/algorithmModes";

const saveAndContinueInFlight = new Map<string, Promise<AlgorithmsSimulationProjection>>();

export type AlgorithmsSessionPosition = Readonly<{ current: number; total: number }>;
export type AlgorithmsPracticeProjection = Readonly<{
  kind: "practice";
  operation: PracticeDurableOperationState;
  session: TrainingSession;
  position: AlgorithmsSessionPosition;
  occurrenceId: string;
  item: ResolvedContentRef;
  roadmapNodeId: string;
  prompt: string;
  constraints: readonly string[];
  elapsedForegroundMs: number;
  interaction: Readonly<{ interactionType: string; model: unknown }>;
  feedback: Readonly<{
    correctness: "correct" | "partial" | "incorrect";
    reason: string;
    details: JsonValue;
    sources?: readonly CanonicalSourceLink[];
    messages?: readonly Readonly<{ kind: string; targetId: string; text: string }>[];
    controls: readonly Readonly<{ id: string; state: "selected" | "correct" | "incorrect" | "omitted_correct" | "neutral" }> [];
  }> | null;
  response: Readonly<{ source: "local" | "committed" | "materialized"; value: unknown }> | null;
}>;

export type AlgorithmsSimulationProjection = Readonly<{
  kind: "simulation";
  operation: SimulationDurableOperationState;
  session: TrainingSession;
  position: AlgorithmsSessionPosition;
  navigator: readonly Readonly<{ index: number; occurrenceId: string; answered: boolean; current: boolean; flagged: boolean }>[];
  item: ResolvedContentRef;
  prompt: string;
  interaction: Readonly<{ interactionType: string; model: unknown }>;
  durableDraftRevision: number;
  elapsedForegroundMs: number;
  remainingForegroundMs: number;
}>;

export type AlgorithmsSimulationScreenProjection =
  | Readonly<{ kind: "ready"; projection: AlgorithmsSimulationProjection }>
  | Readonly<{ kind: "unavailable"; operation: Extract<SimulationDurableOperationState, { error: unknown }> }>;

export type AlgorithmsSessionResultProjection = Readonly<{
  modeId: string;
  completionKind: "abandoned" | "completed";
  reviewConflict?: true;
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
    constraints: readonly string[];
    correctness: "correct" | "partial" | "incorrect" | "unanswered";
    details: JsonValue;
    messages?: readonly Readonly<{ kind: string; targetId: string; text: string }>[];
    sources?: readonly CanonicalSourceLink[];
    interaction: Readonly<{ interactionType: string; model: unknown }>;
    item: ResolvedContentRef;
    questionId: string;
    occurrenceId: string;
    ordinal: number;
    prompt: string;
    reason: string;
    controls: readonly Readonly<{ id: string; state: "selected" | "correct" | "incorrect" | "omitted_correct" | "neutral" }>[];
  }>[];
  score: Readonly<{ correctCount: number; partialCount: number; incorrectCount: number; pointsEarned: number; maxPoints: number }> | null;
  overallPointsEarned: number | null;
}>;

export type AlgorithmsInterviewSimulationEntry = Readonly<{
  trackId: "coding-interview-dsa-problem-solving";
  modeId: typeof ALGORITHM_MODE_IDS.interviewSimulation;
  profileId: string;
  requestedLength: 40;
}>;

/** A Coding practice facade bound to one exact package owner and its lifecycle/timer composition. */
export type AlgorithmsPracticeFacade = Readonly<{
  getProjection(): Promise<AlgorithmsPracticeProjection>;
  submitResponse(response: AlgorithmResponse): Promise<void>;
  submitInteractionResponse(response: unknown): Promise<void>;
  isInteractionResponseComplete(response: unknown): Promise<boolean>;
}>;

export type StartAlgorithmsSessionInput = Omit<AlgorithmsLifecyclePreparationRequest, "sessionId"> & Readonly<{
  modeId: AlgorithmModeId;
  nodeId?: string;
  source?: string;
}>;

type CanonicalAlgorithmsStartRequest = Omit<StartAlgorithmsSessionInput, "feedbackMode"> & Readonly<{
  feedbackTiming?: "after_each_durable_submit" | "after_session_completion";
}>;

function toCanonicalAlgorithmsStartRequest(input: StartAlgorithmsSessionInput): CanonicalAlgorithmsStartRequest {
  const { feedbackMode, ...request } = input;
  const feedbackTiming = feedbackMode === "afterEachAnswer"
    ? "after_each_durable_submit"
    : feedbackMode === "atSessionEnd"
      ? "after_session_completion"
      : undefined;
  return { ...request, ...(feedbackTiming ? { feedbackTiming } : {}) };
}

/** One canonical implementation for Coding practice; the exact content owner is a required dependency. */
export function createAlgorithmsPracticeFacade(owner: ContentPackageRuntimeOwner): AlgorithmsPracticeFacade {
  return Object.freeze({
    getProjection: () => projectAlgorithmsPractice(owner, getTrainingLifecycleUseCases(), getForegroundSessionTimerFacade()),
    async submitResponse(response) {
      const session = await requireAlgorithmsSession();
      const occurrence = session.itemOrder[session.currentItemIndex];
      if (!occurrence) throw new Error("The active Algorithms practice occurrence is unavailable.");
      const exactItem = await owner.resolveItem(occurrence.item);
      await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
      await getTrainingLifecycleUseCases().submitPracticeResponse(toCanonicalPracticeResponse(exactItem.question.interactionType, response));
    },
    async submitInteractionResponse(response) {
      const session = await requireAlgorithmsSession();
      const occurrence = session.itemOrder[session.currentItemIndex];
      if (!occurrence) throw new Error("The active Algorithms practice occurrence is unavailable.");
      const exactItem = await owner.resolveItem(occurrence.item);
      if (!exactItem.interactions.isComplete(exactItem.question.questionId, response)) throw new TrainingApplicationFailure("invalid_response", "The exact interaction response is incomplete or invalid.");
      await getForegroundSessionTimerFacade().checkpointForResponseSave(session);
      await getTrainingLifecycleUseCases().submitPracticeResponse(response);
    },
    async isInteractionResponseComplete(response) {
      const session = await requireAlgorithmsSession();
      const occurrence = session.itemOrder[session.currentItemIndex];
      if (!occurrence) throw new Error("The active Algorithms practice occurrence is unavailable.");
      const exactItem = await owner.resolveItem(occurrence.item);
      return exactItem.interactions.isComplete(exactItem.question.questionId, response);
    },
  });
}

function defaultAlgorithmsPracticeFacade(): AlgorithmsPracticeFacade {
  return createAlgorithmsPracticeFacade(contentPackageRuntimeOwner);
}

/** UI-facing canonical entry points delegate to the exact-owner-bound practice facade. */
export async function startAlgorithmsSession(input: StartAlgorithmsSessionInput): Promise<PreparedSession> {
  if (!Object.values(ALGORITHM_MODE_IDS).includes(input.modeId)) throw new TrainingApplicationFailure("unknown_mode", "The legacy Algorithms facade does not start this mode.");
  const prepared = await startTrainingSession({
    trackId: "coding-interview-dsa-problem-solving",
    modeId: input.modeId,
    source: input.source,
    request: toCanonicalAlgorithmsStartRequest(input),
  });
  await getForegroundSessionTimerFacade().initialize(prepared.session);
  return prepared;
}

/** Declared profile identity only; presentation never reinterprets a topic as a simulation profile. */
export function getAlgorithmsInterviewSimulationEntry(): AlgorithmsInterviewSimulationEntry {
  const track = contentPackageRuntimeOwner.getPreparedDiscovery("coding-interview-dsa-problem-solving").track;
  const simulation = getProductSimulationModeConfig(track.trackId, track.simulationProfiles);
  if (simulation.config.modeId !== ALGORITHM_MODE_IDS.interviewSimulation || simulation.profile.profileId !== "algorithms-interview-simulation-v1") {
    throw new ProductModeUnavailableError("Coding Interview Simulation does not match its canonical product profile.");
  }
  return Object.freeze({ trackId: "coding-interview-dsa-problem-solving", modeId: ALGORITHM_MODE_IDS.interviewSimulation, profileId: simulation.profile.profileId, requestedLength: 40 });
}

export async function getAlgorithmsPracticeProjection(): Promise<AlgorithmsPracticeProjection> {
  return defaultAlgorithmsPracticeFacade().getProjection();
}

async function projectAlgorithmsPractice(
  owner: ContentPackageRuntimeOwner,
  lifecycle: TrainingLifecycleUseCases,
  timer: ForegroundSessionTimerFacade,
): Promise<AlgorithmsPracticeProjection> {
  const [session, attempts] = await Promise.all([requireAlgorithmsSession(), loadTrainingAttempts()]);
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("The active Algorithms session is an Interview Simulation.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("The active Algorithms practice occurrence is unavailable.");
  const exactItem = await owner.resolveItem(occurrence.item);
  const question = exactItem.question;
  const pending = await lifecycle.getPendingMutationProjection(session.id);
  const materializedAttempt = attempts.value.find((candidate) => candidate.sessionId === session.id && candidate.occurrenceId === occurrence.occurrenceId);
  const committedAttempt = pending?.practiceOutcome?.attempt.sessionId === session.id && pending.practiceOutcome.attempt.occurrenceId === occurrence.occurrenceId ? pending.practiceOutcome.attempt : null;
  const attempt = materializedAttempt ?? committedAttempt;
  const response = attempt?.response ?? null;
  const feedbackProjection = response ? exactItem.interactions.projectFeedback(question.questionId, response) : null;
  const feedback = attempt && feedbackIsAvailableDuringPractice(session) && feedbackProjection
    ? { correctness: attempt.result.kind, reason: feedbackProjection.reason, details: feedbackProjection.details, ...(feedbackProjection.messages === undefined ? {} : { messages: feedbackProjection.messages }), sources: projectCanonicalSourceEvidence({ sourceRefs: question.sourceRefs, feedback: feedbackProjection }), controls: projectInteractionControls(exactItem.interactions.projectDiagnostics(question.questionId, response)) }
    : null;
  const [operation, time] = await Promise.all([
    lifecycle.getPracticeOperationState(session, Boolean(materializedAttempt)),
    timer.projection(session),
  ]);
  return Object.freeze({
    kind: "practice",
    operation,
    session,
    position: position(session),
    occurrenceId: occurrence.occurrenceId,
    item: occurrence.item,
    roadmapNodeId: question.nodeId,
    prompt: question.prompt,
    constraints: Object.freeze([...(question.constraints ?? [])]),
    elapsedForegroundMs: time.elapsedForegroundMs,
    interaction: exactItem.interactions.present(question.questionId, response, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []),
    feedback,
    response: response ? Object.freeze({ source: materializedAttempt ? "materialized" as const : "committed" as const, value: response }) : null,
  });
}

export async function submitAlgorithmsPracticeResponse(response: AlgorithmResponse): Promise<void> {
  return defaultAlgorithmsPracticeFacade().submitResponse(response);
}
/** Extension responses stay opaque through the feature facade and exact family runtime. */
export async function submitAlgorithmsPracticeInteractionResponse(response: unknown): Promise<void> {
  return defaultAlgorithmsPracticeFacade().submitInteractionResponse(response);
}
export async function isAlgorithmsPracticeInteractionResponseComplete(response: unknown): Promise<boolean> {
  return defaultAlgorithmsPracticeFacade().isInteractionResponseComplete(response);
}
export async function retryAlgorithmsPracticeResponse(): Promise<void> { await requireAlgorithmsSession(); await getTrainingLifecycleUseCases().retryPracticeSubmission(); }

export function toCanonicalPracticeResponse(interactionType: string, response: AlgorithmResponse): CanonicalQuestionResponse {
  if (response.kind === "choice") {
    if (interactionType === "choice_single") {
      if (response.selectedOptionIds.length !== 1) throw new Error("A canonical single-choice response requires exactly one option.");
      return Object.freeze({ type: "choice_single", optionId: response.selectedOptionIds[0]! });
    }
    if (interactionType === "choice_multiple") {
      return Object.freeze({ type: "choice_multiple", optionIds: Object.freeze([...response.selectedOptionIds]) });
    }
  }
  if (response.kind === "ordering" && interactionType === "ordering") {
    return Object.freeze({ type: "ordering", orderedElementIds: Object.freeze([...response.orderedSubgoalIds]) });
  }
  if (response.kind === "complexity" && (interactionType === "complexity" || interactionType === "decision_matrix")) {
    const selectedValueIdsByDimension = Object.freeze(Object.fromEntries(
      Object.entries(response.selectedValuesByDimension).map(([dimensionId, valueIds]) => [dimensionId, Object.freeze([...valueIds])]),
    ));
    return Object.freeze({ type: interactionType, selectedValueIdsByDimension }) as CanonicalQuestionResponse;
  }
  throw new Error(`Response kind ${response.kind} does not match canonical interaction ${interactionType}.`);
}

/** Replays the single durable practice operation that is already journaled. */
export async function recoverAlgorithmsPracticeOperation(): Promise<void> {
  await requireAlgorithmsSession();
  await getTrainingLifecycleUseCases().recoverActiveTrainingOperation();
}

export function subscribeAlgorithmsPracticeOperation(sessionId: string, listener: (operation: PracticeDurableOperationState) => void): () => void {
  let active = true;
  const unsubscribe = getTrainingLifecycleUseCases().subscribeOperationProjection(sessionId, (operation) => {
    if (operation.family !== "practice") return;
    void loadTrainingSession(sessionId).then((session) => {
      if (active && session && isLegacyAlgorithmsSession(session)) listener(operation);
    }).catch(() => undefined);
  });
  return () => { active = false; unsubscribe(); };
}

export async function advanceAlgorithmsPracticeSession(): Promise<TrainingSession> {
  await requireAlgorithmsSession();
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
  await requireExactAlgorithmsPractice(expectedSessionId);
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
  const lifecycle = getTrainingLifecycleUseCases();
  await requireExactLegacyPracticeCompletionRecovery(expectedSessionId, lifecycle);
  const finalized = await lifecycle.recoverExpectedSessionCompletion(expectedSessionId);
  getForegroundSessionTimerFacade().releaseAfterVerifiedPracticeCompletion(expectedSessionId);
  return finalized;
}

export async function getAlgorithmsSimulationProjection(authorization?: SimulationCommandAuthorization): Promise<AlgorithmsSimulationProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("The active Algorithms session is not an Interview Simulation.");
  const lifecycle = getTrainingLifecycleUseCases();
  if (authorization) return getAlgorithmsSimulationProjectionForSession(session, lifecycle, authorization);
  return lifecycle.withAuthorizedSimulationCommand(session.id, (ownedAuthorization) => getAlgorithmsSimulationProjectionForSession(session, lifecycle, ownedAuthorization));
}

async function getAlgorithmsSimulationProjectionForSession(
  session: TrainingSession,
  lifecycle: ReturnType<typeof getTrainingLifecycleUseCases>,
  authorization: SimulationCommandAuthorization,
): Promise<AlgorithmsSimulationProjection> {
  await lifecycle.resumeActiveSession(authorization);
  const draft = await requireSimulationDraft(session.id);
  const index = session.currentItemIndex;
  if (!Number.isInteger(index) || index < 0 || index >= session.itemOrder.length) throw new Error("Interview Simulation navigator position is outside the immutable session.");
  const occurrence = session.itemOrder[index]!;
  const exactItem = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
  const question = exactItem.question;
  const time = await getForegroundSessionTimerFacade().projection(session, authorization);
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
      flagged: draft.flaggedOccurrenceIds.includes(candidate.occurrenceId),
    }))),
    item: occurrence.item,
    prompt: question.prompt,
    interaction: exactItem.interactions.present(question.questionId, draft.responsesByOccurrenceId[occurrence.occurrenceId] ?? null, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []),
    durableDraftRevision: draft.revision,
    elapsedForegroundMs: time.elapsedForegroundMs,
    remainingForegroundMs: time.remainingForegroundMs!,
  });
}

/** Typed failure boundary for presentation; no screen may classify error text. */
export async function getAlgorithmsSimulationScreenProjection(): Promise<AlgorithmsSimulationScreenProjection> {
  try { return Object.freeze({ kind: "ready", projection: await getAlgorithmsSimulationProjection() }); }
  catch (error) { return Object.freeze({ kind: "unavailable", operation: simulationFailureProjection(error) }); }
}

export async function navigateAlgorithmsSimulationTo(index: number, authorization?: SimulationCommandAuthorization): Promise<TrainingSession> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new TrainingApplicationFailure("invalid_response", "Only an Interview Simulation can navigate its session.");
  return getTrainingLifecycleUseCases().moveSimulationSessionTo(index, authorization);
}

/** One navigator command persists a changed response before it changes the durable active occurrence. */
export async function saveAlgorithmsSimulationResponseAndNavigate(input: Readonly<{ occurrenceId: string; response: AlgorithmResponse | null; targetIndex: number }>): Promise<AlgorithmsSimulationProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation can save and jump.");
  return getTrainingLifecycleUseCases().withAuthorizedSimulationCommand(session.id, (authorization) => saveAlgorithmsSimulationResponseAndNavigateForSession(session, input, authorization));
}

async function saveAlgorithmsSimulationResponseAndNavigateForSession(session: TrainingSession, input: Readonly<{ occurrenceId: string; response: AlgorithmResponse | null; targetIndex: number }>, authorization: SimulationCommandAuthorization): Promise<AlgorithmsSimulationProjection> {
  const current = session.itemOrder[session.currentItemIndex];
  if (!current || current.occurrenceId !== input.occurrenceId) throw new TrainingApplicationFailure("invalid_response", "Save and jump requires the active Interview Simulation occurrence.");
  if (!Number.isSafeInteger(input.targetIndex) || input.targetIndex < 0 || input.targetIndex >= session.itemOrder.length) {
    throw new TrainingApplicationFailure("invalid_response", "Save and jump requires a valid Interview Simulation target occurrence.");
  }
  const previousRevision = (await requireSimulationDraft(session.id)).revision;
  const expectedResponse = await saveAlgorithmsSimulationResponseForSession(session, { occurrenceId: input.occurrenceId, response: input.response }, authorization);
  const saved = await requireSimulationDraft(session.id);
  const savedResponse = saved.responsesByOccurrenceId[input.occurrenceId];
  if (saved.revision !== previousRevision + 1 || (expectedResponse === null ? savedResponse !== undefined : JSON.stringify(savedResponse) !== JSON.stringify(expectedResponse))) {
    throw new TrainingApplicationFailure("verification_failure", "Save and jump could not verify the durable simulation response revision.");
  }
  const navigated = input.targetIndex === session.currentItemIndex ? session : await navigateAlgorithmsSimulationTo(input.targetIndex, authorization);
  if (navigated.currentItemIndex !== input.targetIndex) {
    throw new TrainingApplicationFailure("verification_failure", "Save and jump could not verify the requested simulation position.");
  }
  const projection = await getAlgorithmsSimulationProjection(authorization);
  if (projection.session.id !== session.id || projection.position.current !== input.targetIndex + 1 || projection.durableDraftRevision !== saved.revision) {
    throw new TrainingApplicationFailure("verification_failure", "Save and jump could not publish the verified simulation projection.");
  }
  return projection;
}

export async function saveAlgorithmsSimulationResponse(input: Readonly<{ occurrenceId: string; response: AlgorithmResponse | null }>): Promise<CanonicalQuestionResponse | null> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation has a persisted response draft.");
  return getTrainingLifecycleUseCases().withAuthorizedSimulationCommand(session.id, (authorization) => saveAlgorithmsSimulationResponseForSession(session, input, authorization));
}

async function saveAlgorithmsSimulationResponseForSession(session: TrainingSession, input: Readonly<{ occurrenceId: string; response: AlgorithmResponse | null }>, authorization: SimulationCommandAuthorization): Promise<CanonicalQuestionResponse | null> {
  const lifecycle = getTrainingLifecycleUseCases();
  const draft = await requireSimulationDraft(session.id);
  const occurrence = session.itemOrder.find((item) => item.occurrenceId === input.occurrenceId);
  if (!occurrence) throw new Error(`Algorithms Interview Simulation occurrence ${input.occurrenceId} is unknown.`);
  const question = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
  const response = input.response === null ? null : toCanonicalPracticeResponse(question.question.interactionType, input.response);
  const responses = { ...draft.responsesByOccurrenceId };
  if (input.response === null) delete responses[input.occurrenceId];
  else responses[input.occurrenceId] = response!;
  const nextDraft = Object.freeze({ ...draft, revision: draft.revision + 1, responsesByOccurrenceId: Object.freeze(responses), updatedAt: lifecycle.currentTime() });
  await lifecycle.saveSimulationDraft({ draft: nextDraft, expectedPreviousRevision: draft.revision, authorization });
  return response;
}

export async function toggleAlgorithmsSimulationFlag(occurrenceId: string): Promise<AlgorithmsSimulationProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation supports durable flags.");
  return getTrainingLifecycleUseCases().withAuthorizedSimulationCommand(session.id, async (authorization) => {
    const lifecycle = getTrainingLifecycleUseCases();
    const draft = await requireSimulationDraft(session.id);
    if (!session.itemOrder.some((occurrence) => occurrence.occurrenceId === occurrenceId)) {
      throw new TrainingApplicationFailure("invalid_response", "The requested Interview Simulation flag occurrence is unavailable.");
    }
    const flaggedOccurrenceIds = draft.flaggedOccurrenceIds.includes(occurrenceId)
      ? draft.flaggedOccurrenceIds.filter((candidate) => candidate !== occurrenceId)
      : [...draft.flaggedOccurrenceIds, occurrenceId];
    await lifecycle.saveSimulationDraft({
      draft: Object.freeze({ ...draft, revision: draft.revision + 1, flaggedOccurrenceIds: Object.freeze(flaggedOccurrenceIds), updatedAt: lifecycle.currentTime() }),
      expectedPreviousRevision: draft.revision,
      authorization,
    });
    const projection = await getAlgorithmsSimulationProjection(authorization);
    if (projection.durableDraftRevision !== draft.revision + 1 || projection.navigator.find((item) => item.occurrenceId === occurrenceId)?.flagged !== flaggedOccurrenceIds.includes(occurrenceId)) {
      throw new TrainingApplicationFailure("verification_failure", "Interview Simulation flag could not be verified in the durable projection.");
    }
    return projection;
  });
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
  return getTrainingLifecycleUseCases().withAuthorizedSimulationCommand(session.id, (authorization) => saveAlgorithmsSimulationResponseAndContinueAuthorized(session, input, authorization));
}

async function saveAlgorithmsSimulationResponseAndContinueAuthorized(session: TrainingSession, input: Readonly<{ occurrenceId: string; response: AlgorithmResponse }>, authorization: SimulationCommandAuthorization): Promise<AlgorithmsSimulationProjection> {
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation can save and continue.");
  const current = session.itemOrder[session.currentItemIndex];
  if (!current || current.occurrenceId !== input.occurrenceId) throw new TrainingApplicationFailure("invalid_response", "Save and continue requires the active Interview Simulation occurrence.");
  if (session.currentItemIndex >= session.itemOrder.length - 1) throw new TrainingApplicationFailure("invalid_response", "The final Interview Simulation occurrence cannot save and continue.");
  const previousRevision = (await requireSimulationDraft(session.id)).revision;
  const expectedResponse = await saveAlgorithmsSimulationResponseForSession(session, input, authorization);
  const saved = await requireSimulationDraft(session.id);
  if (saved.revision !== previousRevision + 1 || JSON.stringify(saved.responsesByOccurrenceId[input.occurrenceId]) !== JSON.stringify(expectedResponse)) {
    throw new TrainingApplicationFailure("verification_failure", "Save and continue could not verify the durable simulation response revision.");
  }
  let advanced: TrainingSession;
  try { advanced = await navigateAlgorithmsSimulationTo(session.currentItemIndex + 1, authorization); }
  catch (error) {
    getTrainingLifecycleUseCases().markSimulationSaveAndContinueAdvanceRecovery(session.id, error);
    throw error;
  }
  if (advanced.currentItemIndex !== session.currentItemIndex + 1) {
    throw new TrainingApplicationFailure("verification_failure", "Save and continue could not verify the durable simulation position.");
  }
  const projection = await getAlgorithmsSimulationProjection(authorization);
  if (projection.session.id !== session.id || projection.position.current !== advanced.currentItemIndex + 1 || projection.durableDraftRevision !== saved.revision) {
    throw new TrainingApplicationFailure("verification_failure", "Save and continue could not publish the verified next simulation projection.");
  }
  return projection;
}

/** Recovery continues a response already verified as durable; it never writes that response again. */
export async function recoverAlgorithmsSimulationSaveAndContinue(input: Readonly<{ occurrenceId: string }>): Promise<AlgorithmsSimulationProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation can recover save and continue.");
  return getTrainingLifecycleUseCases().withAuthorizedSimulationCommand(session.id, (authorization) => recoverAlgorithmsSimulationSaveAndContinueAuthorized(session, input, authorization));
}

async function recoverAlgorithmsSimulationSaveAndContinueAuthorized(initialSession: TrainingSession, input: Readonly<{ occurrenceId: string }>, authorization: SimulationCommandAuthorization): Promise<AlgorithmsSimulationProjection> {
  let session = initialSession;
  const sourceIndex = session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === input.occurrenceId);
  if (sourceIndex < 0 || sourceIndex >= session.itemOrder.length - 1 || session.currentItemIndex !== sourceIndex) {
    throw new TrainingApplicationFailure("invalid_response", "Save-and-continue recovery requires its still-active non-final occurrence.");
  }
  const draft = await requireSimulationDraft(session.id);
  if (draft.responsesByOccurrenceId[input.occurrenceId] === undefined) {
    throw new TrainingApplicationFailure("missing_draft", "Save-and-continue recovery requires the durable response it is continuing from.");
  }
  const lifecycle = getTrainingLifecycleUseCases();
  await lifecycle.recoverActiveTrainingOperation(authorization);
  session = await requireAlgorithmsSession();
  if (session.currentItemIndex === sourceIndex) await navigateAlgorithmsSimulationTo(sourceIndex + 1, authorization);
  if (session.currentItemIndex !== sourceIndex + 1) {
    throw new TrainingApplicationFailure("verification_failure", "Save-and-continue recovery could not verify the next simulation position.");
  }
  const projection = await getAlgorithmsSimulationProjection(authorization);
  if (projection.durableDraftRevision !== draft.revision || projection.position.current !== sourceIndex + 2) {
    throw new TrainingApplicationFailure("verification_failure", "Save-and-continue recovery could not publish the verified next simulation projection.");
  }
  return projection;
}

/** Restores response editing only after the lifecycle proves that the failed save made no durable draft change. */
export async function resumeAlgorithmsSimulationEditingAfterSaveFailure(): Promise<void> {
  await requireAlgorithmsSimulationSession();
  await getTrainingLifecycleUseCases().resumeEditableSimulationAfterSaveFailure();
}

/** Retries the exact D command previously proven not applied; it never rebuilds from current storage. */
export async function retryAlgorithmsSimulationSave(): Promise<void> {
  await requireAlgorithmsSimulationSession();
  await getTrainingLifecycleUseCases().retrySimulationDraftSave();
}

export async function resumeAlgorithmsSimulationEditingAfterStaleConflict(): Promise<void> {
  await requireAlgorithmsSimulationSession();
  await getTrainingLifecycleUseCases().resumeEditableSimulationAfterStaleConflict();
}

/** Read-only confirmation of the exact draft write whose acknowledgement was lost. */
export async function reconcileAlgorithmsSimulationSave(): Promise<"verified" | "conflict" | "unknown"> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new TrainingApplicationFailure("invalid_response", "Only an Interview Simulation can reconcile a draft save.");
  return getTrainingLifecycleUseCases().reconcileSimulationDraftSave(session.id);
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
  const authorization = await getTrainingLifecycleUseCases().authorizeActiveSimulationCommand(session.id);
  await getForegroundSessionTimerFacade().finalizeCountdownManually(session, authorization);
}

export async function abandonAlgorithmsSession(): Promise<TrainingSession> {
  const session = await requireAlgorithmsSession();
  await getForegroundSessionTimerFacade().leaveForeground(session);
  return getTrainingLifecycleUseCases().abandonActiveSession();
}

export async function enterAlgorithmsSimulationForeground(): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().enterForeground(await requireAlgorithmsSession());
}

export async function leaveAlgorithmsSimulationForeground(reason: ForegroundTimerLeaveReason = "session_exit"): Promise<ForegroundTimeProjection> {
  return getForegroundSessionTimerFacade().leaveForeground(await requireAlgorithmsSession(), reason);
}

/** Presentation receives application-owned projection refreshes; it never runs a countdown. */
export function subscribeAlgorithmsSimulationProjectionRefresh(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
  return subscribeLegacyAlgorithmsTimerEvents(listener);
}

export async function enterAlgorithmsPracticeForeground(): Promise<ForegroundTimeProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Interview Simulation must use its simulation foreground boundary.");
  return getForegroundSessionTimerFacade().enterForeground(session);
}

export async function leaveAlgorithmsPracticeForeground(reason: ForegroundTimerLeaveReason = "session_exit"): Promise<ForegroundTimeProjection> {
  const session = await requireAlgorithmsSession();
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Interview Simulation must use its simulation foreground boundary.");
  return getForegroundSessionTimerFacade().leaveForeground(session, reason);
}

export function subscribeAlgorithmsPracticeProjectionRefresh(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
  return subscribeLegacyAlgorithmsTimerEvents(listener);
}

export async function getAlgorithmsPracticeResultProjection(sessionId: string): Promise<AlgorithmsSessionResultProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  let session: TrainingSession;
  let result: TrainingSessionResult;
  let integrity: ValidatedCompletedResult;
  try {
    const exactSession = await loadTrainingSession(sessionId);
    if (!exactSession || !isLegacyAlgorithmsSession(exactSession)) throw completedResultUnavailable();
    const [loadedResult, history, attempts] = await Promise.all([
      lifecycle.loadSummary(sessionId),
      lifecycle.queryHistory(),
      loadTrainingAttempts(),
    ]);
    result = loadedResult;
    const found = history.find((candidate) => candidate.id === sessionId);
    if (!found) throw completedResultUnavailable();
    session = found;
    integrity = await validateCompletedCodingResult(session, result, attempts.value);
  } catch (error) {
    if (error instanceof TrainingApplicationFailure && error.code === "summary_unavailable") throw error;
    throw completedResultUnavailable(error);
  }
  const feedbackTiming = feedbackTimingFromSession(session);
  const simulationOperation = session.status === "completed" && session.modeId === ALGORITHM_MODE_IDS.interviewSimulation
    ? await lifecycle.getSimulationOperationState(session)
    : null;
  const reviewConflict = simulationOperation ? simulationHasReviewConflict(simulationOperation) : false;
  return Object.freeze({
    completionKind: "completed",
    modeId: session.modeId,
    ...(reviewConflict ? { reviewConflict: true as const } : {}),
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
    feedbackItems: completedFeedbackItems(session, integrity.items, integrity.attemptsByOccurrenceId),
    score: resultScore(result.evidence.details),
    overallPointsEarned: [...integrity.attemptsByOccurrenceId.values()].reduce((sum, attempt) => sum + overallScoreCredit(attempt.result), 0),
  });
}

/** Reads a completed practice occurrence without starting or mutating a session. */
export async function getAlgorithmsPracticeReviewProjection(sessionId: string, occurrenceId: string): Promise<AlgorithmsSessionResultProjection> {
  const result = await getAlgorithmsPracticeSummaryProjection(sessionId);
  if (result.sessionId !== sessionId || result.completionKind !== "completed") {
    throw new Error("Answer review requires this completed practice session.");
  }
  if (!result.feedbackItems.some((item) => item.occurrenceId === occurrenceId)) {
    throw new Error("This question does not belong to the completed practice result.");
  }
  return result;
}

export async function getAlgorithmsPracticeSummaryProjection(sessionId: string): Promise<AlgorithmsSessionResultProjection> {
  const lifecycle = getTrainingLifecycleUseCases();
  const session = await lifecycle.loadSessionRecord(sessionId);
  if (!isLegacyAlgorithmsSession(session)) throw new TrainingApplicationFailure("summary_unavailable", "This session is not available through the legacy Algorithms summary.");
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
    modeId: session.modeId,
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
    overallPointsEarned: null,
  });
}

async function requireAlgorithmsSession(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (session && isApproachChallengeTrainingAttempt(session.trackId, session.modeId)) {
    throw new TrainingApplicationFailure("resume_unavailable", "Approach Challenge sessions are unavailable through the legacy Algorithms facade.");
  }
  if (!session || !isLegacyAlgorithmsSession(session)) throw new Error("No active legacy Algorithms session is available.");
  return session;
}

async function requireExactAlgorithmsPractice(expectedSessionId: string): Promise<TrainingSession> {
  const session = await requireAlgorithmsSession();
  if (session.id !== expectedSessionId || session.configurationSnapshot.submission !== "perItem") throw new TrainingApplicationFailure("resume_unavailable", `Algorithms practice session ${expectedSessionId} is not the exact active session.`);
  return session;
}

async function requireExactLegacyPracticeCompletionRecovery(
  expectedSessionId: string,
  lifecycle: ReturnType<typeof getTrainingLifecycleUseCases>,
): Promise<TrainingSession> {
  if (!expectedSessionId.trim()) throw new TrainingApplicationFailure("invalid_response", "Completion recovery requires an expected session identity.");
  const session = await loadTrainingSession(expectedSessionId);
  if (!session || !isLegacyAlgorithmsSession(session) || session.configurationSnapshot.submission !== "perItem") {
    throw new TrainingApplicationFailure("resume_unavailable", `Session ${expectedSessionId} is not an exact legacy Algorithms practice session.`);
  }
  const pending = await lifecycle.getExpectedSessionPendingMutation(expectedSessionId);
  if (pending) {
    if (pending.trackId !== session.trackId || pending.operation !== "complete_training_session" || !pending.practiceCompletion) {
      throw new TrainingApplicationFailure("resume_unavailable", `Pending mutation does not own completion for ${expectedSessionId}.`);
    }
  } else if (session.status !== "completed") {
    throw new TrainingApplicationFailure("resume_unavailable", `Session ${expectedSessionId} has no exact pending completion to recover.`);
  }
  return session;
}

function isLegacyAlgorithmsSession(session: TrainingSession): boolean {
  return session.trackId === "coding-interview-dsa-problem-solving" && !isApproachChallengeTrainingAttempt(session.trackId, session.modeId) &&
    Object.values(ALGORITHM_MODE_IDS).includes(session.modeId as AlgorithmModeId);
}

async function requireAlgorithmsSimulationSession(): Promise<TrainingSession> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new TrainingApplicationFailure("invalid_response", "This session is not an Interview Simulation.");
  return session;
}

function subscribeLegacyAlgorithmsTimerEvents(listener: (event: ForegroundSessionTimerEvent) => void): () => void {
  let active = true;
  const unsubscribe = getForegroundSessionTimerFacade().subscribe((event) => {
    void loadTrainingSession(event.sessionId).then((session) => {
      if (active && session && isLegacyAlgorithmsSession(session)) listener(event);
    }).catch(() => undefined);
  });
  return () => { active = false; unsubscribe(); };
}

async function requireSimulationDraft(sessionId: string) {
  const lifecycle = getTrainingLifecycleUseCases();
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

type ValidatedCompletedResult = Readonly<{
  items: readonly ResolvedInteractionItem[];
  attemptsByOccurrenceId: ReadonlyMap<string, TrainingAttempt<unknown>>;
}>;

function completedResultUnavailable(cause?: unknown): TrainingApplicationFailure {
  return new TrainingApplicationFailure("summary_unavailable", "Completed Coding result does not match its saved session plan and committed attempts.", cause);
}

async function validateCompletedCodingResult(
  session: TrainingSession,
  result: TrainingSessionResult,
  allAttempts: readonly TrainingAttempt<unknown>[],
): Promise<ValidatedCompletedResult> {
  const trackId = "coding-interview-dsa-problem-solving";
  const details = result.evidence?.details as Record<string, unknown> | undefined;
  const occurrenceIds = session.itemOrder.map((occurrence) => occurrence.occurrenceId);
  const occurrenceIdSet = new Set(occurrenceIds);
  const answered = new Set(result.answeredOccurrenceIds);
  const unanswered = new Set(result.unansweredOccurrenceIds);
  const validTime = (value: unknown): value is string => typeof value === "string" && Number.isFinite(Date.parse(value));

  if (session.trackId !== trackId || session.status !== "completed" || !validTime(session.completedAt) ||
    !Number.isInteger(session.actualLength) || session.actualLength !== session.itemOrder.length || session.itemOrder.length === 0 ||
    occurrenceIdSet.size !== occurrenceIds.length ||
    !result.id.trim() || result.sessionId !== session.id || result.trackId !== trackId ||
    !validTime(result.completedAt) || Date.parse(result.completedAt) !== Date.parse(session.completedAt) || result.totalOccurrences !== session.actualLength ||
    !details || result.evidence.familyId !== "coding_interview" ||
    answered.size !== result.answeredOccurrenceIds.length || unanswered.size !== result.unansweredOccurrenceIds.length ||
    [...answered].some((id) => unanswered.has(id)) || answered.size + unanswered.size !== session.actualLength ||
    [...answered, ...unanswered].some((id) => !occurrenceIdSet.has(id)) ||
    JSON.stringify(result.answeredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => answered.has(id))) ||
    JSON.stringify(result.unansweredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => unanswered.has(id)))) {
    throw completedResultUnavailable();
  }

  if (session.planFingerprint !== undefined) {
    if (!session.taxonomyVersion || await createContentSessionPlanFingerprint(session as TrainingSession & { taxonomyVersion: string }) !== session.planFingerprint) throw completedResultUnavailable();
  }

  const exact = await contentPackageRuntimeOwner.resolveExactArtifact({ trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256 });
  if (exact.track.trackId !== trackId || exact.track.contentVersion !== session.contentVersion || exact.track.artifactSha256 !== session.artifactSha256) throw completedResultUnavailable();
  const items: ResolvedInteractionItem[] = [];
  for (const occurrence of session.itemOrder) {
    if (occurrence.item.trackId !== trackId || occurrence.item.contentVersion !== session.contentVersion || occurrence.item.artifactSha256 !== session.artifactSha256) throw completedResultUnavailable();
    const item = await contentPackageRuntimeOwner.resolveItem(occurrence.item);
    if (item.question.trackId !== occurrence.item.trackId || item.question.questionId !== occurrence.item.questionId ||
      !isCanonicalOptionOrder(item.question, session.optionOrderByOccurrence[occurrence.occurrenceId], item.interactions)) throw completedResultUnavailable();
    items.push(item);
  }

  const attemptsByOccurrenceId = new Map<string, TrainingAttempt<unknown>>();
  for (const attempt of allAttempts) {
    if (attempt.sessionId !== session.id) continue;
    const index = occurrenceIds.indexOf(attempt.occurrenceId);
    const item = index >= 0 ? items[index] : undefined;
    const occurrence = index >= 0 ? session.itemOrder[index] : undefined;
    if (!item || !occurrence || attemptsByOccurrenceId.has(attempt.occurrenceId) || attempt.trackId !== trackId || attempt.modeId !== session.modeId ||
      !resolvedContentRefsEqual(attempt.item, occurrence.item) || !item.interactions.isComplete(item.question.questionId, attempt.response)) throw completedResultUnavailable();
    const scored = item.interactions.evaluate(item.question.questionId, attempt.response).result;
    if (!scored) throw completedResultUnavailable();
    const scoredComponents = scored.components ?? [];
    const storedComponents = attempt.result.components ?? [];
    if (scored.kind !== attempt.result.kind || scored.earnedPoints !== attempt.result.earnedPoints || scored.maxPoints !== attempt.result.maxPoints ||
      scoredComponents.length !== storedComponents.length || scoredComponents.some((component, componentIndex) => {
        const stored = storedComponents[componentIndex];
        return !stored || component.id !== stored.id || component.earnedPoints !== stored.earnedPoints || component.maxPoints !== stored.maxPoints;
      })) throw completedResultUnavailable();
    attemptsByOccurrenceId.set(attempt.occurrenceId, attempt);
  }

  const expectedAnswered = occurrenceIds.filter((id) => attemptsByOccurrenceId.has(id));
  const expectedUnanswered = occurrenceIds.filter((id) => !attemptsByOccurrenceId.has(id));
  if (JSON.stringify(expectedAnswered) !== JSON.stringify(result.answeredOccurrenceIds) ||
    JSON.stringify(expectedUnanswered) !== JSON.stringify(result.unansweredOccurrenceIds)) throw completedResultUnavailable();

  const totals = [...attemptsByOccurrenceId.values()].reduce((current, attempt) => ({
    correctCount: current.correctCount + Number(attempt.result.kind === "correct"),
    partialCount: current.partialCount + Number(attempt.result.kind === "partial"),
    incorrectCount: current.incorrectCount + Number(attempt.result.kind === "incorrect"),
    pointsEarned: current.pointsEarned + attempt.result.earnedPoints,
    maxPoints: current.maxPoints + attempt.result.maxPoints,
  }), { correctCount: 0, partialCount: 0, incorrectCount: 0, pointsEarned: 0, maxPoints: 0 });
  if (Object.entries(totals).some(([key, value]) => details[key] !== value)) throw completedResultUnavailable();

  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) await validateCodingSimulationResult(session, result);
  else if (session.configurationSnapshot.kind !== "practice" || session.configurationSnapshot.submission !== "perItem" ||
    !Object.values(ALGORITHM_MODE_IDS).includes(session.modeId as AlgorithmModeId)) throw completedResultUnavailable();

  try { feedbackTimingFromSession(session); }
  catch { throw completedResultUnavailable(); }

  return Object.freeze({ items: Object.freeze(items), attemptsByOccurrenceId });
}

function completedFeedbackItems(
  session: TrainingSession,
  items: readonly ResolvedInteractionItem[],
  attemptsByOccurrenceId: ReadonlyMap<string, TrainingAttempt<unknown>>,
): AlgorithmsSessionResultProjection["feedbackItems"] {
  return Object.freeze(session.itemOrder.map((occurrence, index) => {
    const attempt = attemptsByOccurrenceId.get(occurrence.occurrenceId);
    const item = items[index]!;
    const question = item.question;
    const review = item.interactions.presentReview(question.questionId, attempt?.response ?? null, session.optionOrderByOccurrence[occurrence.occurrenceId] ?? []);
    const feedback = review.feedback;
    if (!feedback) throw completedResultUnavailable();
    return Object.freeze({
      constraints: Object.freeze([...(question.constraints ?? [])]),
      correctness: attempt?.result.kind ?? "unanswered",
      details: feedback.details,
      ...(feedback.messages === undefined ? {} : { messages: feedback.messages }),
      sources: projectCanonicalSourceEvidence({ sourceRefs: question.sourceRefs, feedback }),
      interaction: Object.freeze({ interactionType: review.interactionType, model: review.model }),
      item: occurrence.item,
      questionId: occurrence.item.questionId,
      occurrenceId: occurrence.occurrenceId,
      ordinal: index + 1,
      prompt: question.prompt,
      reason: feedback.reason,
      controls: projectInteractionControls(review.diagnostics),
    });
  }));
}

async function validateCodingSimulationResult(session: TrainingSession, result: Awaited<ReturnType<ReturnType<typeof getTrainingLifecycleUseCases>["loadSummary"]>>): Promise<void> {
  const exact = await contentPackageRuntimeOwner.resolveExactArtifact({ trackId: session.trackId, contentVersion: session.contentVersion, artifactSha256: session.artifactSha256 });
  const profile = getProductSimulationModeConfig(exact.track.trackId, exact.track.simulationProfiles).profile;
  const details = result.evidence.details as Record<string, unknown>;
  const occurrenceIds = session.itemOrder.map((occurrence) => occurrence.occurrenceId);
  const answered = new Set(result.answeredOccurrenceIds);
  const unanswered = new Set(result.unansweredOccurrenceIds);
  if (profile.familyId !== "coding_interview" || profile.modeId !== ALGORITHM_MODE_IDS.interviewSimulation ||
    session.actualLength !== 40 || session.requestedLength !== 40 || session.itemOrder.length !== 40 ||
    session.configurationSnapshot.kind !== "algorithmsInterviewSimulation" || session.configurationSnapshot.simulationProfileId !== profile.profileId ||
    session.configurationSnapshot.simulationProfileVersion !== profile.profileVersion || result.totalOccurrences !== 40 ||
    answered.size !== result.answeredOccurrenceIds.length || unanswered.size !== result.unansweredOccurrenceIds.length ||
    [...answered].some((id) => unanswered.has(id)) || answered.size + unanswered.size !== 40 ||
    JSON.stringify(result.answeredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => answered.has(id))) ||
    JSON.stringify(result.unansweredOccurrenceIds) !== JSON.stringify(occurrenceIds.filter((id) => unanswered.has(id))) ||
    details.profileId !== profile.profileId || details.profileVersion !== profile.profileVersion) {
    throw new TrainingApplicationFailure("summary_unavailable", "Coding Mock result does not match its completed session and exact 40-question profile.");
  }
}

function projectInteractionControls(value: unknown): readonly Readonly<{ id: string; state: "selected" | "correct" | "incorrect" | "omitted_correct" | "neutral" }>[] {
  if (!Array.isArray(value)) return Object.freeze([]);
  const controls = value.flatMap((entry) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) return [];
    const candidate = entry as Record<string, unknown>;
    if (typeof candidate.id !== "string" || !["selected", "correct", "incorrect", "omitted_correct", "neutral"].includes(String(candidate.state))) return [];
    return [Object.freeze({ id: candidate.id, state: candidate.state as "selected" | "correct" | "incorrect" | "omitted_correct" | "neutral" })];
  });
  return Object.freeze(controls);
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
