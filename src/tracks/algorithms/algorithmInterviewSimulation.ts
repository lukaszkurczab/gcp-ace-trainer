import {
  completeTrainingSession,
  createFamilyEnvelope,
  createTrainingAttempt,
  createTrainingSession,
  createTrainingSessionDraft,
  createTrainingSessionResult,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionDraft,
  type TrainingSessionResult,
} from "../../domain";
import type { AlgorithmContentCatalog } from "./algorithmContentCatalog";
import { deriveAlgorithmReviewReasons, submitAlgorithmInteraction, validateAlgorithmInteractionItem } from "./algorithmInteractionHandlers";
import { getAlgorithmQuestionEntries } from "./algorithmItems";
import {
  ALGORITHMS_PRACTICE_BLUEPRINT,
  assertAlgorithmsPracticeBlueprint,
  type AlgorithmsInterviewSimulationProfile,
  type AlgorithmsPracticeBlueprint,
} from "./algorithmsBlueprints";
import { ALGORITHM_MODE_IDS } from "./domain/algorithmModes";
import type { AlgorithmResponse } from "./domain/algorithmResponse";
import { selectAlgorithmSessionPlan } from "./algorithmSessionSelection";
import { isAlgorithmChoiceQuestion, isAlgorithmOrderingQuestion, type AlgorithmQuestion } from "./algorithmQuestionTypes";
import { createAlgorithmReviewEntry, updateAlgorithmReviewEntry } from "./algorithmReview";

export const ALGORITHMS_INTERVIEW_SIMULATION_DURATION_MS = 2_700_000;

export type AlgorithmsInterviewSimulationPreparation = Readonly<{
  draft: TrainingSessionDraft;
  session: TrainingSession;
}>;

export type AlgorithmsInterviewSimulationFinalization = Readonly<{
  attempts: readonly TrainingAttempt<AlgorithmResponse>[];
  frozenDraft: TrainingSessionDraft;
  result: TrainingSessionResult;
  reviewMutations: readonly AlgorithmsInterviewSimulationReviewMutation[];
  session: TrainingSession;
}>;

export type AlgorithmsInterviewSimulationReviewMutation = Readonly<{
  action: "put" | "update" | "delete";
  record: ReviewQueueEntry;
  transitionAttemptId: string;
}>;

/** One runtime gate serves manual finish and zero-time expiry with the same frozen draft. */
export class AlgorithmsInterviewSimulationFinalizationGate {
  private command: AlgorithmsInterviewSimulationFinalization | null = null;

  begin(input: Readonly<{
    completedAt: string;
    entries: readonly ReturnType<typeof getAlgorithmQuestionEntries>[number][];
    frozenDraft: TrainingSessionDraft;
    priorAttempts?: readonly TrainingAttempt[];
    reviews?: readonly ReviewQueueEntry[];
    session: TrainingSession;
  }>): AlgorithmsInterviewSimulationFinalization {
    if (this.command) {
      if (this.command.session.id !== input.session.id || this.command.frozenDraft.revision !== input.frozenDraft.revision) {
        throw new Error("Algorithms Interview Simulation finalization is already frozen for a different durable draft revision.");
      }
      return this.command;
    }
    this.command = finalizeAlgorithmsInterviewSimulation(input);
    return this.command;
  }
}

/** Builds the exact, fixed simulation record before application lifecycle persists it. */
export function prepareAlgorithmsInterviewSimulation(input: Readonly<{
  catalog: AlgorithmContentCatalog;
  contentVersion: string;
  profile: AlgorithmsInterviewSimulationProfile;
  sessionId: string;
  startedAt: string;
  blueprint?: AlgorithmsPracticeBlueprint;
}>): AlgorithmsInterviewSimulationPreparation {
  const blueprint = input.blueprint ?? ALGORITHMS_PRACTICE_BLUEPRINT;
  assertAlgorithmsPracticeBlueprint(blueprint);
  if (input.profile.requiredLength !== 40 || input.profile.foregroundDurationMs !== ALGORITHMS_INTERVIEW_SIMULATION_DURATION_MS) {
    throw new Error("Algorithms Interview Simulation profile is unsupported.");
  }
  const selection = selectAlgorithmSessionPlan({
    contentCatalog: input.catalog,
    mode: ALGORITHM_MODE_IDS.interviewSimulation,
    practiceBlueprint: blueprint,
    scope: { simulationProfile: input.profile },
    sessionLength: 40,
  });
  if (selection.actualLength !== 40 || new Set(selection.items.map((item) => item.id)).size !== 40) {
    throw new Error("Algorithms Interview Simulation requires exactly 40 unique valid content identities.");
  }
  if (selection.items.some((item) => item.contentVersion !== input.contentVersion)) {
    throw new Error("Algorithms Interview Simulation content version does not match the resolved session version.");
  }
  selection.items.forEach(validateAlgorithmInteractionItem);
  const session = createTrainingSession({
    id: input.sessionId,
    trackId: "algorithms",
    modeId: ALGORITHM_MODE_IDS.interviewSimulation,
    configurationSnapshot: {
      answerChanges: "untilFinalSubmission",
      feedbackMode: "atSessionEnd",
      kind: "algorithmsInterviewSimulation",
      simulationBlueprintId: "algorithms-practice",
      simulationBlueprintVersion: blueprint.blueprintVersion,
      simulationProfileId: input.profile.profileId,
      simulationProfileVersion: input.profile.profileVersion,
      submission: "manualOrForegroundTimeout",
      timer: "countdownForeground",
      timerDurationMs: ALGORITHMS_INTERVIEW_SIMULATION_DURATION_MS,
    },
    requestedLength: 40,
    actualLength: 40,
    currentItemIndex: 0,
    itemOrder: selection.items.map((item, index) => ({ occurrenceId: `${input.sessionId}:occurrence:${index}`, item: { contentVersion: item.contentVersion, itemId: item.id, trackId: "algorithms" } })),
    optionOrderByOccurrence: Object.fromEntries(selection.items.map((item, index) => [`${input.sessionId}:occurrence:${index}`, optionOrder(item)])),
    conditionalReinsertSlots: [],
    activeForegroundMs: 0,
    contentVersion: input.contentVersion,
    status: "active",
    startedAt: input.startedAt,
  });
  const draft = createTrainingSessionDraft({ sessionId: session.id, trackId: session.trackId, responsesByOccurrenceId: {}, updatedAt: input.startedAt });
  return Object.freeze({ draft, session });
}

export function getAlgorithmsInterviewSimulationRemainingMs(session: TrainingSession): number {
  assertAlgorithmsInterviewSimulationSession(session);
  return Math.max(0, ALGORITHMS_INTERVIEW_SIMULATION_DURATION_MS - session.activeForegroundMs);
}

/** Replaces one editable response or removes it when response is null; no scoring or feedback is exposed. */
export function mutateAlgorithmsInterviewSimulationDraft(input: Readonly<{
  entries: readonly ReturnType<typeof getAlgorithmQuestionEntries>[number][];
  occurrenceId: string;
  response: AlgorithmResponse | null;
  session: TrainingSession;
  draft: TrainingSessionDraft;
  updatedAt: string;
}>): TrainingSessionDraft {
  assertAlgorithmsInterviewSimulationSession(input.session);
  if (input.draft.sessionId !== input.session.id || input.draft.trackId !== input.session.trackId) throw new Error("Algorithms Interview Simulation draft scope is invalid.");
  const occurrence = input.session.itemOrder.find((item) => item.occurrenceId === input.occurrenceId);
  if (!occurrence) throw new Error(`Algorithms Interview Simulation occurrence ${input.occurrenceId} is unknown.`);
  const question = input.entries.find((entry) => entry.question.id === occurrence.item.itemId)?.question;
  if (!question || question.contentVersion !== occurrence.item.contentVersion) throw new Error("Algorithms Interview Simulation content is unavailable for this occurrence.");
  const responses = { ...input.draft.responsesByOccurrenceId } as Record<string, AlgorithmResponse>;
  if (input.response === null) delete responses[input.occurrenceId];
  else responses[input.occurrenceId] = input.response;
  return createTrainingSessionDraft({ ...input.draft, responsesByOccurrenceId: responses, updatedAt: input.updatedAt });
}

/** Scores only the frozen durable draft and deliberately omits feedback from the returned outcome. */
export function finalizeAlgorithmsInterviewSimulation(input: Readonly<{
  entries: readonly ReturnType<typeof getAlgorithmQuestionEntries>[number][];
  frozenDraft: TrainingSessionDraft;
  priorAttempts?: readonly TrainingAttempt[];
  reviews?: readonly ReviewQueueEntry[];
  session: TrainingSession;
  completedAt: string;
}>): AlgorithmsInterviewSimulationFinalization {
  assertAlgorithmsInterviewSimulationSession(input.session);
  if (input.frozenDraft.sessionId !== input.session.id || input.frozenDraft.trackId !== input.session.trackId) throw new Error("Algorithms Interview Simulation finalization draft scope is invalid.");
  const entryById = new Map(input.entries.map((entry) => [entry.question.id, entry.question]));
  const attempts: TrainingAttempt<AlgorithmResponse>[] = [];
  const reviewMutations: AlgorithmsInterviewSimulationReviewMutation[] = [];
  const unansweredOccurrenceIds: string[] = [];
  let correctCount = 0;
  let partialCount = 0;
  let incorrectCount = 0;
  let pointsEarned = 0;
  let maxPoints = 0;
  for (const occurrence of input.session.itemOrder) {
    const question = entryById.get(occurrence.item.itemId);
    if (!question || question.contentVersion !== occurrence.item.contentVersion) throw new Error(`Algorithms Interview Simulation content ${occurrence.item.itemId} is unavailable.`);
    validateAlgorithmInteractionItem(question);
    maxPoints += maximumPointsFor(question);
    const response = input.frozenDraft.responsesByOccurrenceId[occurrence.occurrenceId] as AlgorithmResponse | undefined;
    if (!response) {
      unansweredOccurrenceIds.push(occurrence.occurrenceId);
      continue;
    }
    const submitted = submitAlgorithmInteraction({ question, response });
    pointsEarned += submitted.score.result.earnedPoints;
    if (submitted.score.status === "correct") correctCount += 1;
    else if (submitted.score.status === "partial") partialCount += 1;
    else incorrectCount += 1;
    const attempt = createTrainingAttempt({
      id: `${input.session.id}:attempt:${occurrence.occurrenceId}`,
      sessionId: input.session.id,
      trackId: "algorithms",
      modeId: input.session.modeId,
      occurrenceId: occurrence.occurrenceId,
      item: occurrence.item,
      response,
      result: { kind: submitted.score.status, earnedPoints: submitted.score.result.earnedPoints, maxPoints: submitted.score.result.maxPoints },
      reviewEvidence: { sourceItem: occurrence.item, taxonomyOrSkillRefs: question.taxonomyRefs?.map(({ axisId, nodeId, role }) => ({ axisId, nodeId, role })) ?? [] },
      answeredAt: input.completedAt,
      committedAt: input.completedAt,
    });
    attempts.push(attempt);
    const existing = input.reviews?.filter((review) => sameContent(review.sourceItem, attempt.item)).sort((left, right) => left.id.localeCompare(right.id))[0];
    if (!existing) {
      const reasons = deriveAlgorithmReviewReasons({ priorAttemptsForSameItem: (input.priorAttempts ?? []).filter((prior) => sameContent(prior.item, attempt.item)), score: submitted.score });
      reviewMutations.push(Object.freeze({ action: "put", record: createAlgorithmReviewEntry(attempt, undefined, reasons), transitionAttemptId: attempt.id }));
    } else {
      const updated = updateAlgorithmReviewEntry(existing, attempt);
      if (!updated) reviewMutations.push(Object.freeze({ action: "delete", record: existing, transitionAttemptId: attempt.id }));
      else if (updated !== existing) reviewMutations.push(Object.freeze({ action: "update", record: updated, transitionAttemptId: attempt.id }));
    }
  }
  const session = completeTrainingSession(input.session, input.completedAt);
  const answeredOccurrenceIds = attempts.map((attempt) => attempt.occurrenceId);
  const result = createTrainingSessionResult({
    id: `${input.session.id}:result`,
    sessionId: input.session.id,
    trackId: "algorithms",
    totalOccurrences: input.session.itemOrder.length,
    answeredOccurrenceIds,
    unansweredOccurrenceIds,
    completedAt: input.completedAt,
    evidence: createFamilyEnvelope({ familyId: "algorithms", details: { activeForegroundMs: input.session.activeForegroundMs, correctCount, incorrectCount, maxPoints, partialCount, pointsEarned, unansweredCount: unansweredOccurrenceIds.length } }),
  });
  return Object.freeze({ attempts: Object.freeze(attempts), frozenDraft: input.frozenDraft, result, reviewMutations: Object.freeze(reviewMutations), session });
}

function assertAlgorithmsInterviewSimulationSession(session: TrainingSession): void {
  if (session.trackId !== "algorithms" || session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation || session.actualLength !== 40 || session.requestedLength !== 40 || session.configurationSnapshot.timer !== "countdownForeground" || session.configurationSnapshot.timerDurationMs !== ALGORITHMS_INTERVIEW_SIMULATION_DURATION_MS || session.conditionalReinsertSlots?.length) {
    throw new Error("Training session is not a canonical Algorithms Interview Simulation.");
  }
}

function optionOrder(question: AlgorithmQuestion): readonly string[] {
  if (isAlgorithmChoiceQuestion(question)) return question.options.map((option) => option.id);
  if (isAlgorithmOrderingQuestion(question)) return question.subgoals.map((subgoal) => subgoal.id);
  return [];
}

function maximumPointsFor(question: AlgorithmQuestion): number {
  if (isAlgorithmChoiceQuestion(question)) return question.options.filter((option) => option.isCorrect).length;
  if (isAlgorithmOrderingQuestion(question)) return question.correctOrder.length - 1;
  return question.correctComplexity.maxPoints ?? question.correctComplexity.dimensions.length;
}

function sameContent(left: { contentVersion: string; itemId: string; trackId: string }, right: { contentVersion: string; itemId: string; trackId: string }): boolean {
  return left.trackId === right.trackId && left.contentVersion === right.contentVersion && left.itemId === right.itemId;
}
