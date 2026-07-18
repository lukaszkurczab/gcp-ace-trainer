import { loadActiveTrainingSession, loadActiveTrainingSessionDraft, loadTrainingAttempts } from "../learningReadModels";
import {
  getTrainingLifecycleUseCases,
  startTrainingSession,
  type PreparedSession,
} from "../trainingLifecycle";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import { getBundledContentAvailability } from "../../content/application/validateBundledContent";
import type { ContentItemRef, TrainingSession } from "../../domain";
import {
  buildAlgorithmInteractionViewModel,
  composeAlgorithmAuthoredFeedback,
  getAlgorithmsInterviewSimulationRemainingMs,
  mutateAlgorithmsInterviewSimulationDraft,
  scoreAlgorithmQuestion,
} from "../../tracks/algorithms";
import { ALGORITHM_MODE_IDS, type AlgorithmModeId, type AlgorithmResponse } from "../../tracks/algorithms/domain";
import { isAlgorithmChoiceQuestion } from "../../tracks/algorithms/algorithmQuestionTypes";
import type { AlgorithmsLifecyclePreparationRequest } from "./AlgorithmsFamilyRuntime";
import { getAlgorithmsSimulationTimerFacade, type AlgorithmsSimulationTimeProjection } from "./AlgorithmsSimulationTimerFacade";

export type AlgorithmsSessionPosition = Readonly<{ current: number; total: number }>;
export type AlgorithmsPracticeProjection = Readonly<{
  kind: "practice";
  session: TrainingSession;
  position: AlgorithmsSessionPosition;
  item: ContentItemRef;
  prompt: string;
  constraints: readonly string[];
  interaction: ReturnType<typeof buildAlgorithmInteractionViewModel>;
  feedback: Readonly<{
    correctness: "correct" | "partial" | "incorrect";
    reason: string;
    details: string;
    wrongOptionExplanations: readonly Readonly<{ optionId: string; text: string }>[];
    omittedCorrectOptionExplanations: readonly Readonly<{ optionId: string; text: string }>[];
    controls: readonly Readonly<{ id: string; state: "selected" | "correct" | "incorrect" | "omitted_correct" | "neutral" }> [];
  }> | null;
}>;

export type AlgorithmsSimulationProjection = Readonly<{
  kind: "simulation";
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

export type AlgorithmsSessionResultProjection = Readonly<{
  sessionId: string;
  totalOccurrences: number;
  answeredOccurrenceIds: readonly string[];
  unansweredOccurrenceIds: readonly string[];
  completedAt: string;
  score: Readonly<{ correctCount: number; partialCount: number; incorrectCount: number; pointsEarned: number; maxPoints: number }> | null;
}>;

export type AlgorithmsInterviewSimulationEntry = Readonly<{
  trackId: "algorithms";
  modeId: typeof ALGORITHM_MODE_IDS.interviewSimulation;
  profileId: string;
  requestedLength: 40;
}>;

type StartAlgorithmsSessionInput = Omit<AlgorithmsLifecyclePreparationRequest, "sessionId"> & Readonly<{
  modeId: AlgorithmModeId;
  source?: string;
}>;

let sessionSequence = 0;

/** UI-facing canonical entry points. No storage, runtime, selection or timer ownership leaks into presentation. */
export async function startAlgorithmsSession(input: StartAlgorithmsSessionInput): Promise<PreparedSession> {
  const prepared = await startTrainingSession({
    trackId: "algorithms",
    modeId: input.modeId,
    source: input.source,
    request: { ...input, sessionId: nextSessionId(input.modeId) },
  });
  if (prepared.session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) {
    await getAlgorithmsSimulationTimerFacade().initialize(prepared.session);
  }
  return prepared;
}

/** Declared profile identity only; presentation never reinterprets a topic as a simulation profile. */
export function getAlgorithmsInterviewSimulationEntry(): AlgorithmsInterviewSimulationEntry {
  const availability = getBundledContentAvailability("algorithms");
  if (availability.kind !== "available" || !availability.declaredModes.includes(ALGORITHM_MODE_IDS.interviewSimulation)) {
    throw new Error("Algorithms Interview Simulation content is unavailable.");
  }
  const profiles = getAlgorithmContentCatalog().bank.simulationProfiles;
  if (profiles.length !== 1 || profiles[0]?.totalOccurrences !== 40) {
    throw new Error("Algorithms Interview Simulation requires exactly one validated declared profile.");
  }
  return Object.freeze({ trackId: "algorithms", modeId: ALGORITHM_MODE_IDS.interviewSimulation, profileId: profiles[0].profileId, requestedLength: 40 });
}

export async function getAlgorithmsPracticeProjection(): Promise<AlgorithmsPracticeProjection> {
  const [session, attempts] = await Promise.all([requireAlgorithmsSession(), loadTrainingAttempts()]);
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("The active Algorithms session is an Interview Simulation.");
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new Error("The active Algorithms practice occurrence is unavailable.");
  const question = getAlgorithmContentCatalog().getItemById(occurrence.item.itemId);
  const attempt = attempts.value.find((candidate) => candidate.sessionId === session.id && candidate.occurrenceId === occurrence.occurrenceId);
  const response = (attempt?.response ?? null) as AlgorithmResponse | null;
  const feedback = attempt
    ? (() => {
        const score = scoreAlgorithmQuestion(question, response!);
        const authored = composeAlgorithmAuthoredFeedback(question, score);
        return Object.freeze({ correctness: attempt.result.kind, ...authored, controls: feedbackControls(question, response!, score) });
      })()
    : null;
  return Object.freeze({
    kind: "practice",
    session,
    position: position(session),
    item: occurrence.item,
    prompt: question.prompt,
    constraints: Object.freeze([...(question.constraints ?? [])]),
    interaction: buildAlgorithmInteractionViewModel(question, response),
    feedback,
  });
}

export async function submitAlgorithmsPracticeResponse(response: AlgorithmResponse): Promise<void> {
  await getTrainingLifecycleUseCases().submitPracticeResponse(response);
}

export async function advanceAlgorithmsPracticeSession(): Promise<TrainingSession> {
  return getTrainingLifecycleUseCases().advancePracticeSession();
}

export async function completeAlgorithmsPracticeSession(): Promise<AlgorithmsSessionResultProjection> {
  const finalized = await getTrainingLifecycleUseCases().completeActivePracticeSession();
  return getAlgorithmsPracticeResultProjection(finalized.session.id);
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
  const question = getAlgorithmContentCatalog().getItemById(occurrence.item.itemId);
  const time = await getAlgorithmsSimulationTimerFacade().projection(session);
  return Object.freeze({
    kind: "simulation",
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
    interaction: buildAlgorithmInteractionViewModel(question, (draft.responsesByOccurrenceId[occurrence.occurrenceId] ?? null) as AlgorithmResponse | null),
    durableDraftRevision: draft.revision,
    elapsedForegroundMs: time.elapsedForegroundMs,
    remainingForegroundMs: time.remainingForegroundMs,
  });
}

export async function navigateAlgorithmsSimulationTo(index: number): Promise<TrainingSession> {
  return getTrainingLifecycleUseCases().moveSimulationSessionTo(index);
}

export async function saveAlgorithmsSimulationResponse(input: Readonly<{ occurrenceId: string; response: AlgorithmResponse | null }>): Promise<void> {
  const session = await requireAlgorithmsSession();
  if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Only an Interview Simulation has a persisted response draft.");
  const draft = await requireSimulationDraft(session.id);
  const nextDraft = mutateAlgorithmsInterviewSimulationDraft({
    entries: getAlgorithmContentCatalog().getItems().map((question) => ({ question, roadmapNodeId: question.taxonomy.roadmapNodeId })),
    occurrenceId: input.occurrenceId,
    response: input.response,
    session,
    draft,
    updatedAt: new Date().toISOString(),
  });
  await getAlgorithmsSimulationTimerFacade().checkpointForDraftSave(session);
  await getTrainingLifecycleUseCases().saveSimulationDraft({ draft: nextDraft, expectedPreviousRevision: draft.revision });
}

export async function finalizeAlgorithmsSimulation(): Promise<void> {
  const session = await requireAlgorithmsSession();
  await getAlgorithmsSimulationTimerFacade().checkpointForFinalization(session);
  await getTrainingLifecycleUseCases().finalizeSimulation();
}

export async function abandonAlgorithmsSession(): Promise<TrainingSession> {
  const session = await requireAlgorithmsSession();
  if (session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) await getAlgorithmsSimulationTimerFacade().leaveForeground(session);
  return getTrainingLifecycleUseCases().abandonActiveSession();
}

export async function enterAlgorithmsSimulationForeground(): Promise<AlgorithmsSimulationTimeProjection> {
  return getAlgorithmsSimulationTimerFacade().enterForeground(await requireAlgorithmsSession());
}

export async function leaveAlgorithmsSimulationForeground(): Promise<AlgorithmsSimulationTimeProjection> {
  return getAlgorithmsSimulationTimerFacade().leaveForeground(await requireAlgorithmsSession());
}

export async function getAlgorithmsPracticeResultProjection(sessionId: string): Promise<AlgorithmsSessionResultProjection> {
  const result = await getTrainingLifecycleUseCases().loadSummary(sessionId);
  if (result.trackId !== "algorithms") throw new Error("The completed session is not an Algorithms result.");
  return Object.freeze({
    sessionId: result.sessionId,
    totalOccurrences: result.totalOccurrences,
    answeredOccurrenceIds: Object.freeze([...result.answeredOccurrenceIds]),
    unansweredOccurrenceIds: Object.freeze([...result.unansweredOccurrenceIds]),
    completedAt: result.completedAt,
    score: resultScore(result.evidence.details),
  });
}

async function requireAlgorithmsSession(): Promise<TrainingSession> {
  const session = await loadActiveTrainingSession();
  if (!session || session.trackId !== "algorithms") throw new Error("No active Algorithms session is available.");
  return session;
}

async function requireSimulationDraft(sessionId: string) {
  const lifecycle = getTrainingLifecycleUseCases();
  // The lifecycle owns validation; this facade intentionally never infers a draft.
  await lifecycle.resumeActiveSession();
  const session = await loadActiveTrainingSession();
  if (!session || session.id !== sessionId) throw new Error("The active Interview Simulation changed while loading its draft.");
  const draft = await loadActiveTrainingSessionDraft();
  if (!draft || draft.sessionId !== sessionId) throw new Error("The active Interview Simulation draft is unavailable.");
  return draft;
}

function position(session: TrainingSession): AlgorithmsSessionPosition {
  return Object.freeze({ current: session.currentItemIndex + 1, total: session.actualLength });
}

function nextSessionId(modeId: string): string {
  sessionSequence += 1;
  return `algorithms:${modeId}:${Date.now().toString(36)}:${sessionSequence}`;
}

function emptyDiagnostics() {
  return Object.freeze({
    brokenOrderingRelations: Object.freeze([] as string[]),
    incorrectComplexityDimensionIds: Object.freeze([] as string[]),
    omittedCorrectOptionIds: Object.freeze([] as string[]),
    selectedWrongOptionIds: Object.freeze([] as string[]),
  });
}

function feedbackControls(
  question: ReturnType<ReturnType<typeof getAlgorithmContentCatalog>["getItemById"]>,
  response: AlgorithmResponse,
  score: ReturnType<typeof scoreAlgorithmQuestion>,
): readonly Readonly<{ id: string; state: "selected" | "correct" | "incorrect" | "omitted_correct" | "neutral" }>[] {
  if (!isAlgorithmChoiceQuestion(question) || response.kind !== "choice") return Object.freeze([]);
  const selected = new Set(response.selectedOptionIds);
  const accepted = new Set(question.interaction.acceptedOptionIds);
  return Object.freeze(question.interaction.options.map((option) => Object.freeze({
    id: option.id,
    state: selected.has(option.id) && score.diagnostics.selectedWrongOptionIds.includes(option.id)
      ? "incorrect" as const
      : !selected.has(option.id) && score.diagnostics.omittedCorrectOptionIds.includes(option.id)
        ? "omitted_correct" as const
        : selected.has(option.id) && accepted.has(option.id)
          ? "correct" as const
          : selected.has(option.id)
            ? "selected" as const
            : "neutral" as const,
  })));
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
