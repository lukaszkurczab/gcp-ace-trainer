import {
  createTrainingAttempt,
  completeTrainingSession,
  createFamilyEnvelope,
  createTrainingSession,
  createTrainingSessionResult,
  type ContentItemRef,
  type ReviewMutationCommand,
  type ReviewQueueEntry,
  type TrainingAttempt,
  type TrainingSession,
  type TrainingSessionDraft,
} from "../../domain";
import type { PreparedSession, PracticeSubmission, SimulationFinalization, TrainingFamilyRuntime } from "../trainingLifecycle";
import { createAttemptId } from "../learningMutations/identity";
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { AlgorithmContentCatalog } from "../../tracks/algorithms/algorithmContentCatalog";
import { ALGORITHMS_RECOMMENDATION_POLICY, type AlgorithmsRecommendationPolicy } from "../../tracks/algorithms/algorithmsBlueprints";
import {
  selectAlgorithmSessionPlan,
  type AlgorithmReviewSource,
  type AlgorithmSelectionScope,
  type AlgorithmSessionSelection,
} from "../../tracks/algorithms/algorithmSessionSelection";
import { prepareAlgorithmsConditionalReinsertPlan } from "../../tracks/algorithms/algorithmConditionalReinsert";
import {
  finalizeAlgorithmsInterviewSimulation,
  mutateAlgorithmsInterviewSimulationDraft,
  prepareAlgorithmsInterviewSimulation,
} from "../../tracks/algorithms/algorithmInterviewSimulation";
import { getAlgorithmQuestionEntries } from "../../tracks/algorithms/algorithmItems";
import { ALGORITHM_MODE_IDS, getAlgorithmMode, type AlgorithmModeDefinition, type AlgorithmModeId } from "../../tracks/algorithms/domain/algorithmModes";
import type { AlgorithmResponse } from "../../tracks/algorithms/domain/algorithmResponse";
import { createAlgorithmReviewEntry, updateAlgorithmReviewEntry } from "../../tracks/algorithms/algorithmReview";
import { getAlgorithmInteractionCompleteness, submitAlgorithmInteraction } from "../../tracks/algorithms/algorithmInteractionHandlers";
import { isAlgorithmChoiceQuestion, isAlgorithmOrderingQuestion } from "../../tracks/algorithms/algorithmQuestionTypes";

export type AlgorithmsPreparationRequest = Readonly<{
  requestedLength: number;
  reviewItemRefs?: readonly ContentItemRef[];
  scope?: AlgorithmSelectionScope;
}>;

export type AlgorithmsEvidence = Readonly<{
  activeSessionId?: string;
  boundedEvidenceByMentalUnit: Readonly<Record<string, number>>;
  currentMentalUnitId?: string;
  learningStageByMentalUnit: Readonly<Record<string, "absent" | "unstable" | "introduced" | "guided" | "independent">>;
  overdueReviewByMentalUnit: Readonly<Record<string, number>>;
  performanceSignals: Readonly<{
    recognitionBottleneckByMentalUnit?: Readonly<Record<string, number>>;
    repeatedHighRiskMistakesByMentalUnit?: Readonly<Record<string, number>>;
    strategyConfusionByMentalUnit?: Readonly<Record<string, number>>;
  }>;
}>;

export type AlgorithmsRecommendation = Readonly<{
  explanation: string;
  modeId: AlgorithmModeId | "continue_active_session";
  reason: "active_session" | "overdue_review" | "repeated_mistake" | "learn_approach" | "guided_practice" | "contrast_practice" | "recognize_patterns" | "independent_practice" | "learner_choice";
  source?: AlgorithmReviewSource;
}>;

/**
 * Pure Algorithms-family semantics. Application lifecycle use cases own storage,
 * journals and mutation ordering; this class only validates a declared plan and
 * computes deterministic recommendations from supplied canonical evidence.
 */
export type AlgorithmsLifecyclePreparationRequest = Readonly<{
  sessionId: string;
  requestedLength: 10 | 20 | 40;
  reviewItemRefs?: readonly ContentItemRef[];
  reviewSource?: AlgorithmReviewSource;
  scope?: AlgorithmSelectionScope;
}>;

export class AlgorithmsFamilyRuntime implements TrainingFamilyRuntime {
  readonly familyId = "algorithms" as const;

  constructor(
    private readonly catalog: AlgorithmContentCatalog,
    private readonly recommendationPolicy: AlgorithmsRecommendationPolicy = ALGORITHMS_RECOMMENDATION_POLICY,
    private readonly taxonomyVersion: string,
  ) {
    if (recommendationPolicy.policyId !== "algorithms-recommendations" || recommendationPolicy.policyVersion !== "1") {
      throw new Error("Algorithms recommendation policy identity is unsupported.");
    }
  }

  async prepare(input: Readonly<{ trackId: string; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession> {
    if (input.trackId !== "algorithms") throw new Error(`Algorithms runtime cannot prepare track ${input.trackId}.`);
    const mode = getAlgorithmMode(input.modeId);
    const request = preparationRequest(input.request);
    if (!mode.profile.supportedLengths.includes(request.requestedLength)) throw new Error(`Algorithms mode ${mode.id} does not support requested length ${request.requestedLength}.`);
    if (mode.id === ALGORITHM_MODE_IDS.interviewSimulation) {
      const profileId = request.scope?.simulationProfileId;
      if (!profileId || request.requestedLength !== 40) throw new Error("Algorithms Interview Simulation requires its declared 40-item profile.");
      const prepared = await this.prepareInterviewSimulation({
        contentVersion: this.catalog.getContentVersion(),
        taxonomyVersion: this.taxonomyVersion,
        profileId,
        sessionId: request.sessionId,
        startedAt: input.now,
      });
      return Object.freeze({ session: prepared.session, firstOccurrence: prepared.session.itemOrder[0]!.item, draft: prepared.draft });
    }
    const selection = this.prepareSelection({
      attempts: input.attempts,
      modeId: mode.id,
      now: input.now,
      request,
      reviews: input.reviews,
      source: request.reviewSource,
    });
    const blueprint = this.catalog.bank.practiceBlueprints.find((candidate) => candidate.modeId === mode.id);
    if (!blueprint || selection.actualLength !== selection.items.length || selection.items.length === 0) throw new Error(`Algorithms mode ${mode.id} has no valid declared practice plan.`);
    const base = {
      id: request.sessionId,
      trackId: "algorithms",
      modeId: mode.id,
      configurationSnapshot: practiceConfiguration(mode, blueprint),
      requestedLength: request.requestedLength,
      actualLength: selection.actualLength,
      currentItemIndex: 0,
      itemOrder: selection.items.map((item, index) => ({ occurrenceId: `${request.sessionId}:occurrence:${index}`, item: this.catalog.toContentItemRef(item) })),
      optionOrderByOccurrence: Object.fromEntries(selection.items.map((item, index) => [`${request.sessionId}:occurrence:${index}`, optionOrder(item)])),
      conditionalReinsertSlots: [],
      activeForegroundMs: 0,
      contentVersion: this.catalog.getContentVersion(),
      taxonomyVersion: this.taxonomyVersion,
      status: "active" as const,
      startedAt: input.now,
    };
    const initial = createTrainingSession({ ...base, planFingerprint: await createContentSessionPlanFingerprint(base) });
    const planned = this.prepareConditionalReinsertPlan({
      optionOrderByItemId: Object.fromEntries(this.catalog.getItems().map((item) => [item.id, optionOrder(item)])),
      reviewedItemRefs: [...(request.reviewItemRefs ?? []), ...input.reviews.map((review) => review.sourceItem)],
      reviewSource: request.reviewSource,
      session: initial,
    });
    const session = createTrainingSession({ ...planned, planFingerprint: await createContentSessionPlanFingerprint(planned as TrainingSession & { taxonomyVersion: string }) });
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft: null });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    assertAlgorithmsSession(input.session, this.catalog.getContentVersion(), this.taxonomyVersion);
    const simulation = input.session.modeId === ALGORITHM_MODE_IDS.interviewSimulation;
    if (simulation && (!input.draft || input.draft.sessionId !== input.session.id || input.draft.trackId !== input.session.trackId || input.draft.familyId !== this.familyId)) {
      throw new Error("Algorithms Interview Simulation requires its exact persisted draft.");
    }
    if (!simulation && input.draft) throw new Error("Algorithms practice cannot resume with a simulation draft.");
  }

  async submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission> {
    assertAlgorithmsSession(input.session, this.catalog.getContentVersion(), this.taxonomyVersion);
    if (input.session.modeId === ALGORITHM_MODE_IDS.interviewSimulation) throw new Error("Algorithms Interview Simulation does not submit per-item responses.");
    const occurrence = input.session.itemOrder[input.session.currentItemIndex];
    if (!occurrence) throw new Error("Algorithms practice has no current occurrence.");
    const question = this.catalog.getItemById(occurrence.item.itemId);
    const response = input.response as AlgorithmResponse;
    const submitted = submitAlgorithmInteraction({ question, response });
    const attempt = createTrainingAttempt({
      id: await createAttemptId(input.session.id, occurrence.occurrenceId, response),
      sessionId: input.session.id,
      trackId: input.session.trackId,
      modeId: input.session.modeId,
      occurrenceId: occurrence.occurrenceId,
      item: occurrence.item,
      response,
      result: submitted.score.result,
      reviewEvidence: {
        sourceItem: occurrence.item,
        taxonomyOrSkillRefs: [
          { axisId: "roadmap_node", nodeId: question.taxonomy.roadmapNodeId, role: "primary" },
          { axisId: "mental_unit", nodeId: question.taxonomy.primaryMentalUnitId, role: "primary" },
          { axisId: "skill_atom", nodeId: question.taxonomy.primarySkillAtomId, role: "primary" },
        ],
      },
      answeredAt: input.now,
      committedAt: input.now,
    });
    const existing = input.reviews.find((review) => sameContent(review.sourceItem, occurrence.item));
    const reviewMutations: readonly ReviewMutationCommand[] = !existing
      ? [Object.freeze({ kind: "upsert" as const, entry: createAlgorithmReviewEntry(attempt, undefined, submitted.score.status === "correct" ? [] : undefined), transitionAttemptId: attempt.id })]
      : (() => {
          const updated = updateAlgorithmReviewEntry(existing, attempt);
          return updated
            ? [Object.freeze({ kind: "upsert" as const, entry: updated, transitionAttemptId: attempt.id })]
            : [Object.freeze({ kind: "remove" as const, entry: existing, transitionAttemptId: attempt.id })];
        })();
    return Object.freeze({ attempt, session: input.session, reviewMutations });
  }

  async finalizeSimulation(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<SimulationFinalization> {
    await this.validateResume({ session: input.session, draft: input.draft });
    const finalized = this.finalizeInterviewSimulation({
      completedAt: input.now,
      entries: getAlgorithmQuestionEntries(this.catalog.getItems()),
      frozenDraft: input.draft,
      priorAttempts: input.attempts,
      reviews: input.reviews,
      session: input.session,
    });
    return Object.freeze({
      attempts: finalized.attempts,
      frozenDraft: finalized.frozenDraft,
      result: finalized.result,
      reviewMutations: finalized.reviewMutations.map((mutation) => Object.freeze({
        kind: mutation.action === "delete" ? "remove" as const : "upsert" as const,
        entry: mutation.record,
        transitionAttemptId: mutation.transitionAttemptId,
      })),
      session: finalized.session,
    });
  }

  async finalizePractice(input: Readonly<{ session: TrainingSession; attempts: readonly TrainingAttempt<unknown>[]; now: string }>) {
    assertAlgorithmsSession(input.session, this.catalog.getContentVersion(), this.taxonomyVersion);
    if (input.session.modeId === ALGORITHM_MODE_IDS.interviewSimulation || input.session.configurationSnapshot.submission !== "perItem") {
      throw new Error("Algorithms Interview Simulation does not use ordinary practice finalization.");
    }
    const occurrences = new Map(input.session.itemOrder.map((occurrence) => [occurrence.occurrenceId, occurrence]));
    const attempts = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);
    if (attempts.length !== input.session.actualLength || new Set(attempts.map((attempt) => attempt.occurrenceId)).size !== attempts.length || attempts.some((attempt) => !occurrences.has(attempt.occurrenceId))) {
      throw new Error("Algorithms practice finalization requires exactly one durable attempt for every immutable occurrence.");
    }
    const correctCount = attempts.filter((attempt) => attempt.result.kind === "correct").length;
    const partialCount = attempts.filter((attempt) => attempt.result.kind === "partial").length;
    const incorrectCount = attempts.filter((attempt) => attempt.result.kind === "incorrect").length;
    const pointsEarned = attempts.reduce((sum, attempt) => sum + attempt.result.earnedPoints, 0);
    const maxPoints = attempts.reduce((sum, attempt) => sum + attempt.result.maxPoints, 0);
    const session = completeTrainingSession(input.session, input.now);
    const result = createTrainingSessionResult({
      id: `${session.id}:result`, sessionId: session.id, trackId: session.trackId,
      totalOccurrences: session.actualLength,
      answeredOccurrenceIds: session.itemOrder.map((occurrence) => occurrence.occurrenceId),
      unansweredOccurrenceIds: [], completedAt: input.now,
      evidence: createFamilyEnvelope({ familyId: this.familyId, details: { correctCount, partialCount, incorrectCount, pointsEarned, maxPoints, activeForegroundMs: session.activeForegroundMs } }),
    });
    return Object.freeze({ session, result });
  }

  async validateDraftCommand(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    await this.validateResume({ session: input.session, draft: input.draft });
    if (!Number.isSafeInteger(input.expectedPreviousRevision) || input.expectedPreviousRevision < 1) throw new Error("Algorithms simulation draft revision is invalid.");
    for (const [occurrenceId, response] of Object.entries(input.draft.responsesByOccurrenceId)) {
      const occurrence = input.session.itemOrder.find((candidate) => candidate.occurrenceId === occurrenceId);
      if (!occurrence) throw new Error(`Algorithms simulation draft response ${occurrenceId} is outside its immutable session.`);
      const completeness = getAlgorithmInteractionCompleteness(this.catalog.getItemById(occurrence.item.itemId), response as AlgorithmResponse);
      if (!completeness.complete) throw new Error(`Algorithms simulation draft response ${occurrenceId} is incomplete.`);
    }
  }

  async queryDashboard(input: Readonly<{ trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== "algorithms") throw new Error("Algorithms dashboard requested for another track.");
    return Object.freeze({ recommendation: this.recommend({ evidence: algorithmEvidence(input.attempts, input.reviews) }) });
  }

  async queryProgress(input: Readonly<{ trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== "algorithms") throw new Error("Algorithms progress requested for another track.");
    return Object.freeze({ attemptCount: input.attempts.length, dueReviewCount: input.reviews.filter((review) => review.dueAt <= input.now).length });
  }

  async queryReview(input: Readonly<{ trackId: string; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== "algorithms") throw new Error("Algorithms review requested for another track.");
    return Object.freeze({ due: Object.freeze(input.reviews.filter((review) => review.dueAt <= input.now)) });
  }

  prepareSelection(input: Readonly<{
    attempts: readonly TrainingAttempt[];
    modeId: AlgorithmModeId;
    now: string;
    request: AlgorithmsPreparationRequest;
    reviews: readonly ReviewQueueEntry[];
    source?: AlgorithmReviewSource;
  }>): AlgorithmSessionSelection {
    return selectAlgorithmSessionPlan({
      attempts: input.attempts,
      contentCatalog: this.catalog,
      mode: input.modeId,
      now: input.now,
      reviewItemRefs: input.request.reviewItemRefs,
      reviewQueueItems: input.reviews,
      reviewSource: input.source,
      scope: input.request.scope,
      sessionLength: input.request.requestedLength,
    });
  }

  /** Prepares immutable conditional branches; lifecycle use cases persist the returned session. */
  prepareConditionalReinsertPlan(input: Readonly<{
    optionOrderByItemId: Readonly<Record<string, readonly string[]>>;
    reviewedItemRefs: readonly ContentItemRef[];
    reviewSource?: AlgorithmReviewSource;
    session: TrainingSession;
  }>): TrainingSession {
    return prepareAlgorithmsConditionalReinsertPlan({
      entries: getAlgorithmQuestionEntries(this.catalog.getItems()),
      compatibilitySets: this.catalog.bank.compatibilitySets,
      mode: input.session.modeId as AlgorithmModeId,
      optionOrderByItemId: input.optionOrderByItemId,
      reviewedItemRefs: input.reviewedItemRefs,
      reviewSource: input.reviewSource,
      session: input.session,
    });
  }

  /** Simulation semantics remain family-owned; lifecycle use cases persist the returned records. */
  prepareInterviewSimulation(input: Omit<Parameters<typeof prepareAlgorithmsInterviewSimulation>[0], "catalog">) {
    return prepareAlgorithmsInterviewSimulation({ ...input, catalog: this.catalog });
  }

  mutateInterviewSimulationDraft(input: Parameters<typeof mutateAlgorithmsInterviewSimulationDraft>[0]) {
    return mutateAlgorithmsInterviewSimulationDraft(input);
  }

  finalizeInterviewSimulation(input: Parameters<typeof finalizeAlgorithmsInterviewSimulation>[0]) {
    return finalizeAlgorithmsInterviewSimulation(input);
  }

  recommend(input: Readonly<{ evidence: AlgorithmsEvidence; learnerChoice?: AlgorithmModeId }>): AlgorithmsRecommendation {
    if (input.learnerChoice) {
      if (!Object.values(ALGORITHM_MODE_IDS).includes(input.learnerChoice)) throw new Error("Algorithms learner choice is not a supported mode.");
      return Object.freeze({ explanation: "Learner-selected supported mode for this session.", modeId: input.learnerChoice, reason: "learner_choice" });
    }
    const evidence = input.evidence;
    if (evidence.activeSessionId) return Object.freeze({ explanation: "Continue or deliberately abandon the active session.", modeId: "continue_active_session", reason: "active_session" });
    const overdue = firstPositive(evidence.overdueReviewByMentalUnit);
    if (overdue) return Object.freeze({ explanation: `Review due for ${overdue}.`, modeId: ALGORITHM_MODE_IDS.weakAreaReview, reason: "overdue_review", source: "due_queue" });
    const repeated = firstAtLeast(evidence.performanceSignals.repeatedHighRiskMistakesByMentalUnit, this.recommendationPolicy.repeatedMistakeThreshold);
    if (repeated) return Object.freeze({ explanation: `Address repeated high-risk mistake in ${repeated}.`, modeId: ALGORITHM_MODE_IDS.weakAreaReview, reason: "repeated_mistake", source: "due_queue" });
    const absent = firstValue(evidence.learningStageByMentalUnit, (stage) => stage === "absent" || stage === "unstable");
    if (absent) return Object.freeze({ explanation: `Build the approach for ${absent}.`, modeId: ALGORITHM_MODE_IDS.learnApproach, reason: "learn_approach" });
    const bounded = firstBelow(evidence.boundedEvidenceByMentalUnit, this.recommendationPolicy.minimumBoundedEvidence);
    if (bounded) return Object.freeze({ explanation: `Continue guided practice in ${bounded}: evidence is still bounded.`, modeId: ALGORITHM_MODE_IDS.guidedPractice, reason: "guided_practice" });
    const contrast = firstPositive(evidence.performanceSignals.strategyConfusionByMentalUnit);
    if (contrast) return Object.freeze({ explanation: `Practise the strategy contrast in ${contrast}.`, modeId: ALGORITHM_MODE_IDS.contrastPractice, reason: "contrast_practice" });
    const recognition = firstPositive(evidence.performanceSignals.recognitionBottleneckByMentalUnit);
    if (recognition) return Object.freeze({ explanation: `Pattern recognition is the current bottleneck in ${recognition}.`, modeId: ALGORITHM_MODE_IDS.recognizePatterns, reason: "recognize_patterns" });
    return Object.freeze({ explanation: "Use independent practice across the declared roadmap scope.", modeId: ALGORITHM_MODE_IDS.independentPractice, reason: "independent_practice" });
  }
}

function firstPositive(values: Readonly<Record<string, number>> | undefined): string | undefined {
  return firstValue(values, (value) => Number.isFinite(value) && value > 0);
}
function firstAtLeast(values: Readonly<Record<string, number>> | undefined, threshold: number): string | undefined {
  return firstValue(values, (value) => Number.isFinite(value) && value >= threshold);
}
function firstBelow(values: Readonly<Record<string, number>>, threshold: number): string | undefined {
  return firstValue(values, (value) => Number.isFinite(value) && value < threshold);
}
function firstValue<T>(values: Readonly<Record<string, T>> | undefined, predicate: (value: T) => boolean): string | undefined {
  return Object.keys(values ?? {}).sort().find((key) => predicate((values ?? {})[key]!));
}

function preparationRequest(value: unknown): AlgorithmsLifecyclePreparationRequest {
  if (!isRecord(value) || typeof value.sessionId !== "string" || !value.sessionId.trim() ||
    (value.requestedLength !== 10 && value.requestedLength !== 20 && value.requestedLength !== 40)) {
    throw new Error("Algorithms session preparation requires a sessionId and a supported requestedLength.");
  }
  return value as AlgorithmsLifecyclePreparationRequest;
}

function practiceConfiguration(mode: AlgorithmModeDefinition, blueprint: { blueprintId: string; blueprintVersion: string }): Readonly<Record<string, string | number | boolean>> {
  return Object.freeze({
    kind: "algorithmsPractice",
    blueprintId: blueprint.blueprintId,
    blueprintVersion: blueprint.blueprintVersion,
    feedbackMode: mode.profile.feedbackMode,
    answerChanges: mode.profile.answerChanges,
    navigation: mode.profile.navigation,
    submission: mode.profile.submission,
    timer: mode.profile.timer.kind,
    ...(mode.profile.timer.kind === "countdownForeground" ? { timerDurationMs: mode.profile.timer.durationMs } : {}),
    reinsertEnabled: mode.profile.reinsertEnabled,
  });
}

function optionOrder(item: ReturnType<AlgorithmContentCatalog["getItemById"]>): readonly string[] {
  if (isAlgorithmChoiceQuestion(item)) return item.interaction.options.map((option) => option.id);
  if (isAlgorithmOrderingQuestion(item)) return item.interaction.elements.map((element) => element.id);
  return [];
}

function assertAlgorithmsSession(session: TrainingSession, contentVersion: string, taxonomyVersion: string): void {
  if (session.trackId !== "algorithms" || session.contentVersion !== contentVersion || session.taxonomyVersion !== taxonomyVersion || !session.planFingerprint) {
    throw new Error("Algorithms session does not match the exact bundled content identity.");
  }
  getAlgorithmMode(session.modeId);
}

function sameContent(left: ContentItemRef, right: ContentItemRef): boolean {
  return left.trackId === right.trackId && left.contentVersion === right.contentVersion && left.itemId === right.itemId;
}

function algorithmEvidence(attempts: readonly TrainingAttempt<unknown>[], reviews: readonly ReviewQueueEntry[]): AlgorithmsEvidence {
  const boundedEvidenceByMentalUnit: Record<string, number> = {};
  const learningStageByMentalUnit: Record<string, "absent" | "unstable" | "introduced" | "guided" | "independent"> = {};
  const overdueReviewByMentalUnit: Record<string, number> = {};
  for (const attempt of attempts) {
    for (const reference of attempt.reviewEvidence.taxonomyOrSkillRefs.filter((reference) => reference.axisId === "mental_unit")) {
      boundedEvidenceByMentalUnit[reference.nodeId] = (boundedEvidenceByMentalUnit[reference.nodeId] ?? 0) + 1;
      learningStageByMentalUnit[reference.nodeId] = attempt.result.kind === "correct" ? "guided" : "unstable";
    }
  }
  for (const review of reviews) {
    for (const reference of review.taxonomyOrSkillRefs.filter((reference) => reference.axisId === "mental_unit")) {
      overdueReviewByMentalUnit[reference.nodeId] = (overdueReviewByMentalUnit[reference.nodeId] ?? 0) + 1;
    }
  }
  return Object.freeze({
    boundedEvidenceByMentalUnit,
    learningStageByMentalUnit,
    overdueReviewByMentalUnit,
    performanceSignals: {},
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
