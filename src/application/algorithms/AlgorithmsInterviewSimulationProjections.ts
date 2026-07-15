import {
  ALGORITHMS_TRACK_ID,
  InvalidTrainingSessionError,
  MissingContentItemError,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionDraft,
} from "../../domain";
import {
  CorruptStoredRecordError,
  JournalMaterializationError,
  JournalVerificationError,
  JournalWriteError,
  StorageDeleteError,
  StorageReadError,
  StorageWriteError,
  UnsupportedStoredRecordError as UnsupportedStorageRecordError,
} from "../../storage/errors";
import type { AlgorithmContentCatalog } from "../../tracks/algorithms/algorithmContentCatalog";
import {
  ALGORITHM_MODE_IDS,
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  scoreAlgorithmQuestion,
  type AlgorithmQuestion,
  type AlgorithmResponse,
} from "../../tracks/algorithms";
import { assertAlgorithmResponseStructure, assertCompleteAlgorithmResponse, type AlgorithmsRuntimeNavigator } from "./AlgorithmsFamilyRuntime";

/**
 * Terminal-only presentation data for the fixed Algorithms Interview Simulation.
 *
 * These values are projections of immutable finalization records.  In particular,
 * this module deliberately has no answer-change metric: the durable model records
 * the final draft response, not its edit history.
 */
export type AlgorithmsInterviewSimulationTerminalProjection = Readonly<{
  sessionId: string;
  completedAt: string;
  foregroundDurationMs: number;
  points: Readonly<{ earned: number; max: number }>;
  submittedAnswerAccuracy: Readonly<{ correct: number; submitted: number; ratio: number | null }>;
  completionRate: Readonly<{ answered: number; total: number; ratio: number }>;
  outcomes: Readonly<{ correct: number; incorrect: number; partial: number; unanswered: number }>;
  flags: readonly AlgorithmsInterviewSimulationFlagProjection[];
  mentalUnitBreakdown: readonly AlgorithmsInterviewSimulationBreakdown[];
  categoryBreakdown: readonly AlgorithmsInterviewSimulationBreakdown[];
  primarySkillBreakdown: readonly AlgorithmsInterviewSimulationBreakdown[];
  recommendation: AlgorithmsInterviewSimulationRecommendation;
  missedRows: readonly AlgorithmsInterviewSimulationReviewRow[];
  unansweredRows: readonly AlgorithmsInterviewSimulationReviewRow[];
  review: AlgorithmsInterviewSimulationReviewOverview;
}>;

export type AlgorithmsInterviewSimulationFlagProjection = Readonly<{
  occurrenceId: string;
  index: number;
  itemId: string;
}>;

export type AlgorithmsInterviewSimulationBreakdown = Readonly<{
  id: string;
  total: number;
  answered: number;
  correct: number;
  partial: number;
  incorrect: number;
  unanswered: number;
  points: Readonly<{ earned: number; max: number }>;
}>;

export type AlgorithmsInterviewSimulationRecommendation = Readonly<{
  kind: "review_missed_primary_skill" | "complete_unanswered" | "continue_roadmap";
  primarySkillAtomId: string | null;
  occurrenceIds: readonly string[];
  nextAction: string | null;
}>;

export type AlgorithmsInterviewSimulationReviewFilter = "all" | "incorrect" | "partial" | "unanswered" | "flagged";

export type AlgorithmsInterviewSimulationReviewOverview = Readonly<{
  rows: readonly AlgorithmsInterviewSimulationReviewRow[];
  counts: Readonly<Record<AlgorithmsInterviewSimulationReviewFilter, number>>;
}>;

export type AlgorithmsInterviewSimulationReviewRow = Readonly<{
  occurrenceId: string;
  index: number;
  itemId: string;
  mentalUnitId: string | null;
  prompt: string;
  title: string | null;
  questionType: AlgorithmQuestion["type"];
  result: "correct" | "partial" | "incorrect" | "unanswered";
  flagged: boolean;
  selectedResponse: AlgorithmsInterviewSimulationResponseProjection | null;
  correctResponse: AlgorithmsInterviewSimulationResponseProjection;
  reason: string;
  details: string | null;
}>;

export type AlgorithmsInterviewSimulationResponseProjection = Readonly<
  | { kind: "choice"; optionIds: readonly string[] }
  | { kind: "ordering"; subgoalIds: readonly string[] }
  | { kind: "complexity"; valuesByDimension: Readonly<Record<string, string>> }
>;

export type AlgorithmsInterviewSimulationReviewDetail = AlgorithmsInterviewSimulationReviewRow;

export type AlgorithmsInterviewSimulationActiveInspection =
  | Readonly<{ kind: "none" }>
  | Readonly<{
    kind: "resumable";
    resumeInput: Readonly<{ modeId: typeof ALGORITHM_MODE_IDS.interviewSimulation; nodeId: string }>;
    session: Readonly<{
      id: string;
      currentItemIndex: number;
      itemCount: number;
      remainingMs: number;
      navigator: AlgorithmsRuntimeNavigator;
    }>;
  }>
  | Readonly<{ kind: "unavailable"; failure: AlgorithmsRuntimeFailure }>;

export type AlgorithmsRuntimeFailure = Readonly<{
  kind:
    | "content_missing"
    | "content_version_mismatch"
    | "session_conflict"
    | "session_invalid"
    | "journal_failure"
    | "storage_failure"
    | "stored_record_invalid"
    | "unknown";
  disposition: "retryable" | "blocking" | "fatal";
  cause: unknown;
}>;

type TerminalEntry = Readonly<{
  occurrenceId: string;
  index: number;
  question: AlgorithmQuestion;
  attempt: TrainingAttempt<AlgorithmResponse> | null;
  flagged: boolean;
}>;

/**
 * Builds the only results/review projection used by Interview Simulation.
 * It rejects anything other than a completed fixed-profile session so active
 * draft state can never reveal correctness or authored feedback early.
 */
export function buildAlgorithmsInterviewSimulationTerminalProjection(input: Readonly<{
  session: TrainingSession;
  attempts: readonly TrainingAttempt<unknown>[];
  catalog: AlgorithmContentCatalog;
}>): AlgorithmsInterviewSimulationTerminalProjection {
  assertTerminalSimulationSession(input.session);
  const entries = terminalEntries(input.session, input.attempts, input.catalog);
  const rows = Object.freeze(entries.map(toReviewRow));
  const answered = entries.filter((entry) => entry.attempt !== null);
  const missed = rows.filter((row) => row.result === "incorrect" || row.result === "partial");
  const unanswered = rows.filter((row) => row.result === "unanswered");
  const flags = Object.freeze(entries.filter((entry) => entry.flagged).map((entry) => Object.freeze({
    occurrenceId: entry.occurrenceId,
    index: entry.index,
    itemId: entry.question.id,
  })));
  const correct = answered.filter((entry) => entry.attempt!.result.kind === "correct").length;
  const partial = answered.filter((entry) => entry.attempt!.result.kind === "partial").length;
  const incorrect = answered.filter((entry) => entry.attempt!.result.kind === "incorrect").length;
  const points = sumPoints(entries);
  const recommendation = buildRecommendation(entries);
  const overview = Object.freeze({
    rows,
    counts: Object.freeze({
      all: rows.length,
      incorrect: rows.filter((row) => row.result === "incorrect").length,
      partial: rows.filter((row) => row.result === "partial").length,
      unanswered: unanswered.length,
      flagged: flags.length,
    }),
  });
  return Object.freeze({
    sessionId: input.session.id,
    completedAt: input.session.completedAt!,
    foregroundDurationMs: input.session.activeForegroundMs,
    points,
    submittedAnswerAccuracy: Object.freeze({ correct, submitted: answered.length, ratio: answered.length === 0 ? null : correct / answered.length }),
    completionRate: Object.freeze({ answered: answered.length, total: entries.length, ratio: answered.length / entries.length }),
    outcomes: Object.freeze({ correct, partial, incorrect, unanswered: unanswered.length }),
    flags,
    mentalUnitBreakdown: buildBreakdown(entries, (question) => question.roadmapNodeId ?? null),
    categoryBreakdown: buildBreakdown(entries, categoryIds),
    primarySkillBreakdown: buildBreakdown(entries, (question) => [question.primarySkillAtomId]),
    recommendation,
    missedRows: Object.freeze(missed),
    unansweredRows: Object.freeze(unanswered),
    review: overview,
  });
}

export function filterAlgorithmsInterviewSimulationReview(
  projection: AlgorithmsInterviewSimulationTerminalProjection,
  filter: AlgorithmsInterviewSimulationReviewFilter,
): readonly AlgorithmsInterviewSimulationReviewRow[] {
  if (filter === "all") return projection.review.rows;
  if (filter === "flagged") return projection.review.rows.filter((row) => row.flagged);
  return projection.review.rows.filter((row) => row.result === filter);
}

export function getAlgorithmsInterviewSimulationReviewDetail(
  projection: AlgorithmsInterviewSimulationTerminalProjection,
  occurrenceId: string,
): AlgorithmsInterviewSimulationReviewDetail {
  const row = projection.review.rows.find((candidate) => candidate.occurrenceId === occurrenceId);
  if (!row) throw new InvalidTrainingSessionError(`Interview Simulation review occurrence ${occurrenceId} is unavailable.`);
  return row;
}

/**
 * Reads the one active-session slot without creating or replacing a session.
 * Its resumable projection is intentionally scoring-blind: it includes only
 * draft completeness, flags, position, and foreground-time state.
 */
export function inspectActiveAlgorithmsInterviewSimulation(input: Readonly<{
  activeSession: TrainingSession | null;
  activeDraft: TrainingSessionDraft | null;
  catalog: AlgorithmContentCatalog;
}>): AlgorithmsInterviewSimulationActiveInspection {
  if (!input.activeSession) return Object.freeze({ kind: "none" });
  try {
    const session = input.activeSession;
    if (session.status !== "active") throw new InvalidTrainingSessionError("The active session slot contains a terminal session.");
    if (session.trackId !== ALGORITHMS_TRACK_ID) throw new InvalidTrainingSessionError(`Active ${session.trackId} session must be completed or abandoned before Algorithms Interview Simulation can resume.`);
    if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) throw new InvalidTrainingSessionError("The active Algorithms session is not an Interview Simulation.");
    const nodeId = assertExactInterviewSimulationConfiguration(session);
    if (!input.activeDraft || input.activeDraft.sessionId !== session.id || input.activeDraft.trackId !== session.trackId) {
      throw new InvalidTrainingSessionError("Active Interview Simulation is missing its matching persisted draft.");
    }
    const questions = session.itemOrder.map((occurrence) => {
      const question = input.catalog.getItemById(occurrence.item.itemId);
      if (question.contentVersion !== session.contentVersion || occurrence.item.contentVersion !== session.contentVersion) {
        throw new InvalidTrainingSessionError("Active Interview Simulation content version does not match the durable session.");
      }
      return question;
    });
    const responses = input.activeDraft.responsesByOccurrenceId;
    const responseKeys = Object.keys(responses);
    for (const occurrenceId of responseKeys) {
      const index = session.itemOrder.findIndex((occurrence) => occurrence.occurrenceId === occurrenceId);
      if (index < 0) throw new InvalidTrainingSessionError(`Persisted draft occurrence ${occurrenceId} is outside the active session plan.`);
      assertAlgorithmResponseStructure(questions[index]!, responses[occurrenceId]);
    }
    const navigator = buildActiveNavigator(session, questions, responses);
    return Object.freeze({
      kind: "resumable",
      resumeInput: Object.freeze({ modeId: ALGORITHM_MODE_IDS.interviewSimulation, nodeId }),
      session: Object.freeze({
        id: session.id,
        currentItemIndex: session.currentItemIndex,
        itemCount: session.actualLength,
        remainingMs: Math.max(0, 2_700_000 - session.activeForegroundMs),
        navigator,
      }),
    });
  } catch (error) {
    return Object.freeze({ kind: "unavailable", failure: classifyAlgorithmsRuntimeFailure(error) });
  }
}

/** Maps known durability/content/session errors to an explicit presentation state. */
export function classifyAlgorithmsRuntimeFailure(error: unknown): AlgorithmsRuntimeFailure {
  if (error instanceof MissingContentItemError) return Object.freeze({ kind: "content_missing", disposition: "blocking", cause: error });
  if (error instanceof StorageReadError || error instanceof StorageWriteError || error instanceof StorageDeleteError) return Object.freeze({ kind: "storage_failure", disposition: "retryable", cause: error });
  if (error instanceof JournalWriteError || error instanceof JournalMaterializationError || error instanceof JournalVerificationError) return Object.freeze({ kind: "journal_failure", disposition: "retryable", cause: error });
  if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStorageRecordError) return Object.freeze({ kind: "stored_record_invalid", disposition: "fatal", cause: error });
  if (error instanceof InvalidTrainingSessionError) return Object.freeze({ kind: "session_invalid", disposition: "blocking", cause: error });
  const message = error instanceof Error ? error.message : "";
  if (/content version|content.*mismatch/i.test(message)) return Object.freeze({ kind: "content_version_mismatch", disposition: "blocking", cause: error });
  if (/active .*session|configuration does not match|already started|terminal session/i.test(message)) return Object.freeze({ kind: "session_conflict", disposition: "blocking", cause: error });
  return Object.freeze({ kind: "unknown", disposition: "fatal", cause: error });
}

function assertTerminalSimulationSession(session: TrainingSession): void {
  if (session.trackId !== ALGORITHMS_TRACK_ID || session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) {
    throw new InvalidTrainingSessionError("Terminal projection requires an Algorithms Interview Simulation session.");
  }
  if (session.status !== "completed" || !session.completedAt) {
    throw new InvalidTrainingSessionError("Interview Simulation results are available only after finalization completes.");
  }
  assertExactInterviewSimulationConfiguration(session);
}

function assertExactInterviewSimulationConfiguration(session: TrainingSession): string {
  if (session.actualLength !== 40 || session.requestedLength !== 40) throw new InvalidTrainingSessionError("Interview Simulation requires exactly 40 items.");
  const snapshot = session.configurationSnapshot;
  const nodeId = snapshot.nodeId;
  const expected: Readonly<Record<string, unknown>> = {
    answerChanges: "untilFinalSubmission",
    feedbackMode: "atSessionEnd",
    kind: "algorithms",
    mode: ALGORITHM_MODE_IDS.interviewSimulation,
    navigation: "free",
    nodeId,
    reinsertEnabled: false,
    reviewItemRefs: [],
    reviewSource: "none",
    sessionLength: 40,
    submission: "manualOrForegroundTimeout",
    timer: "countdownForeground",
    timerDurationMs: 2_700_000,
  };
  if (typeof nodeId !== "string" || !nodeId.trim() || Object.keys(snapshot).length !== Object.keys(expected).length || Object.keys(expected).some((key) => !sameConfigurationValue(snapshot[key], expected[key]))) {
    throw new InvalidTrainingSessionError("Interview Simulation configuration does not match its fixed profile.");
  }
  return nodeId;
}

function sameConfigurationValue(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

function terminalEntries(session: TrainingSession, attempts: readonly TrainingAttempt<unknown>[], catalog: AlgorithmContentCatalog): readonly TerminalEntry[] {
  const attemptsByOccurrence = new Map<string, TrainingAttempt<AlgorithmResponse>>();
  for (const rawAttempt of attempts) {
    if (rawAttempt.sessionId !== session.id) continue;
    if (rawAttempt.trackId !== ALGORITHMS_TRACK_ID || rawAttempt.modeId !== session.modeId) throw new InvalidTrainingSessionError(`Attempt ${rawAttempt.id} does not belong to the terminal Interview Simulation.`);
    const occurrence = session.itemOrder.find((candidate) => candidate.occurrenceId === rawAttempt.occurrenceId);
    if (!occurrence || occurrence.item.itemId !== rawAttempt.item.itemId || occurrence.item.contentVersion !== rawAttempt.item.contentVersion) throw new InvalidTrainingSessionError(`Attempt ${rawAttempt.id} is outside the immutable Interview Simulation plan.`);
    if (attemptsByOccurrence.has(rawAttempt.occurrenceId)) throw new InvalidTrainingSessionError(`Interview Simulation occurrence ${rawAttempt.occurrenceId} has duplicate immutable attempts.`);
    const question = catalog.getItemById(rawAttempt.item.itemId);
    if (question.contentVersion !== session.contentVersion) throw new InvalidTrainingSessionError("Terminal Interview Simulation content version does not match the active catalog.");
    const attempt = rawAttempt as TrainingAttempt<AlgorithmResponse>;
    assertCompleteAlgorithmResponse(question, attempt.response);
    const scored = scoreAlgorithmQuestion(question, attempt.response).result;
    if (!sameConfigurationValue(scored, attempt.result)) throw new InvalidTrainingSessionError(`Attempt ${attempt.id} contradicts canonical Algorithms scoring.`);
    attemptsByOccurrence.set(attempt.occurrenceId, attempt);
  }
  return Object.freeze(session.itemOrder.map((occurrence, index) => {
    const question = catalog.getItemById(occurrence.item.itemId);
    if (question.contentVersion !== session.contentVersion || occurrence.item.contentVersion !== session.contentVersion) throw new InvalidTrainingSessionError("Terminal Interview Simulation content version does not match the immutable plan.");
    return Object.freeze({ occurrenceId: occurrence.occurrenceId, index, question, attempt: attemptsByOccurrence.get(occurrence.occurrenceId) ?? null, flagged: session.flaggedOccurrenceIds.includes(occurrence.occurrenceId) });
  }));
}

function toReviewRow(entry: TerminalEntry): AlgorithmsInterviewSimulationReviewRow {
  const result = entry.attempt?.result.kind ?? "unanswered";
  return Object.freeze({
    occurrenceId: entry.occurrenceId,
    index: entry.index,
    itemId: entry.question.id,
    mentalUnitId: entry.question.roadmapNodeId ?? null,
    prompt: entry.question.prompt,
    title: entry.question.title ?? null,
    questionType: entry.question.type,
    result,
    flagged: entry.flagged,
    selectedResponse: entry.attempt ? responseProjection(entry.attempt.response) : null,
    correctResponse: correctResponseProjection(entry.question),
    reason: entry.question.feedbackModel.mentalModelCorrection,
    details: entry.question.feedbackModel.details ?? entry.question.answerFeedback ?? entry.question.complexityExplanation ?? null,
  });
}

function responseProjection(response: AlgorithmResponse): AlgorithmsInterviewSimulationResponseProjection {
  if (response.kind === "choice") return Object.freeze({ kind: "choice", optionIds: Object.freeze([...response.selectedOptionIds]) });
  if (response.kind === "ordering") return Object.freeze({ kind: "ordering", subgoalIds: Object.freeze([...response.orderedSubgoalIds]) });
  return Object.freeze({ kind: "complexity", valuesByDimension: Object.freeze({ ...response.selectedValuesByDimension }) });
}

function correctResponseProjection(question: AlgorithmQuestion): AlgorithmsInterviewSimulationResponseProjection {
  if (isAlgorithmChoiceQuestion(question)) return Object.freeze({ kind: "choice", optionIds: Object.freeze(question.options.filter((option) => option.isCorrect).map((option) => option.id)) });
  if (isAlgorithmOrderingQuestion(question)) return Object.freeze({ kind: "ordering", subgoalIds: Object.freeze([...question.correctOrder]) });
  if (isAlgorithmComplexityQuestion(question)) return Object.freeze({ kind: "complexity", valuesByDimension: Object.freeze(Object.fromEntries(question.correctComplexity.dimensions.map((dimension) => [dimension.id, dimension.acceptedValues[0]!]))) });
  throw new InvalidTrainingSessionError("Unsupported Algorithms question.");
}

function sumPoints(entries: readonly TerminalEntry[]): Readonly<{ earned: number; max: number }> {
  return Object.freeze(entries.reduce((totals, entry) => ({
    earned: totals.earned + (entry.attempt?.result.earnedPoints ?? 0),
    max: totals.max + (entry.attempt?.result.maxPoints ?? maxPoints(entry.question)),
  }), { earned: 0, max: 0 }));
}

function maxPoints(question: AlgorithmQuestion): number {
  if (isAlgorithmChoiceQuestion(question)) return question.options.filter((option) => option.isCorrect).length;
  if (isAlgorithmOrderingQuestion(question)) return question.correctOrder.length - 1;
  if (isAlgorithmComplexityQuestion(question)) return question.correctComplexity.dimensions.length;
  throw new InvalidTrainingSessionError("Unsupported Algorithms question.");
}

function categoryIds(question: AlgorithmQuestion): readonly string[] {
  return [...new Set((question.taxonomyRefs ?? []).filter((reference) => reference.axisId === "pattern_family" || reference.axisId === "problem_archetype").map((reference) => `${reference.axisId}:${reference.nodeId}`))];
}

function buildBreakdown(entries: readonly TerminalEntry[], identify: (question: AlgorithmQuestion) => string | readonly string[] | null): readonly AlgorithmsInterviewSimulationBreakdown[] {
  const groups = new Map<string, TerminalEntry[]>();
  for (const entry of entries) {
    const ids = identify(entry.question);
    for (const id of (ids === null ? [] : typeof ids === "string" ? [ids] : ids)) groups.set(id, [...(groups.get(id) ?? []), entry]);
  }
  return Object.freeze([...groups.entries()].map(([id, group]) => {
    const answered = group.filter((entry) => entry.attempt !== null);
    return Object.freeze({
      id,
      total: group.length,
      answered: answered.length,
      correct: answered.filter((entry) => entry.attempt!.result.kind === "correct").length,
      partial: answered.filter((entry) => entry.attempt!.result.kind === "partial").length,
      incorrect: answered.filter((entry) => entry.attempt!.result.kind === "incorrect").length,
      unanswered: group.length - answered.length,
      points: sumPoints(group),
    });
  }).sort((left, right) => left.id.localeCompare(right.id)));
}

function buildRecommendation(entries: readonly TerminalEntry[]): AlgorithmsInterviewSimulationRecommendation {
  const missed = entries.filter((entry) => entry.attempt?.result.kind === "incorrect" || entry.attempt?.result.kind === "partial");
  if (missed.length > 0) {
    const bySkill = new Map<string, TerminalEntry[]>();
    for (const entry of missed) bySkill.set(entry.question.primarySkillAtomId, [...(bySkill.get(entry.question.primarySkillAtomId) ?? []), entry]);
    const [skill, group] = [...bySkill.entries()].sort((left, right) => {
      const leftWeight = left[1].reduce((total, entry) => total + (entry.attempt!.result.kind === "incorrect" ? 2 : 1), 0);
      const rightWeight = right[1].reduce((total, entry) => total + (entry.attempt!.result.kind === "incorrect" ? 2 : 1), 0);
      return rightWeight - leftWeight || left[0].localeCompare(right[0]);
    })[0]!;
    const representative = group[0]!;
    return Object.freeze({ kind: "review_missed_primary_skill", primarySkillAtomId: skill, occurrenceIds: Object.freeze(group.map((entry) => entry.occurrenceId)), nextAction: representative.question.feedbackModel.nextAction || null });
  }
  const unanswered = entries.filter((entry) => entry.attempt === null);
  if (unanswered.length > 0) return Object.freeze({ kind: "complete_unanswered", primarySkillAtomId: null, occurrenceIds: Object.freeze(unanswered.map((entry) => entry.occurrenceId)), nextAction: null });
  return Object.freeze({ kind: "continue_roadmap", primarySkillAtomId: null, occurrenceIds: Object.freeze([]), nextAction: null });
}

function buildActiveNavigator(session: TrainingSession, questions: readonly AlgorithmQuestion[], responses: Readonly<Record<string, unknown>>): AlgorithmsRuntimeNavigator {
  const flags = new Set(session.flaggedOccurrenceIds);
  const occurrences = session.itemOrder.map((occurrence, index) => {
    const response = responses[occurrence.occurrenceId];
    let answerState: "unanswered" | "partial" | "complete" = "unanswered";
    if (response !== undefined) {
      try { assertCompleteAlgorithmResponse(questions[index]!, response); answerState = "complete"; }
      catch { answerState = "partial"; }
    }
    return Object.freeze({ occurrenceId: occurrence.occurrenceId, index, answerState, flagged: flags.has(occurrence.occurrenceId) });
  });
  return Object.freeze({
    occurrences: Object.freeze(occurrences),
    counts: Object.freeze({
      total: occurrences.length,
      unanswered: occurrences.filter((occurrence) => occurrence.answerState === "unanswered").length,
      partial: occurrences.filter((occurrence) => occurrence.answerState === "partial").length,
      complete: occurrences.filter((occurrence) => occurrence.answerState === "complete").length,
      flagged: occurrences.filter((occurrence) => occurrence.flagged).length,
    }),
  });
}
