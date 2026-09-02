import {
  createTrainingAttempt,
  completeTrainingSession,
  createFamilyEnvelope,
  createTrainingSession,
  createTrainingSessionResult,
  contentPackagePinsEqual,
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
import type { AlgorithmRuntimeCatalog } from "../../tracks/coding-interview/algorithmRuntimeCatalog";
import { ALGORITHMS_RECOMMENDATION_POLICY, type AlgorithmsRecommendationPolicy } from "../../tracks/coding-interview/algorithmsBlueprints";
import {
  selectAlgorithmSessionPlan,
  type AlgorithmReviewSource,
  type AlgorithmSelectionScope,
  type AlgorithmSessionSelection,
} from "../../tracks/coding-interview/algorithmSessionSelection";
import { prepareAlgorithmsConditionalReinsertPlan } from "../../tracks/coding-interview/algorithmConditionalReinsert";
import {
  finalizeAlgorithmsInterviewSimulation,
  mutateAlgorithmsInterviewSimulationDraft,
  prepareAlgorithmsInterviewSimulation,
} from "../../tracks/coding-interview/algorithmInterviewSimulation";
import { getAlgorithmQuestionEntries } from "../../tracks/coding-interview/algorithmItems";
import { ALGORITHM_MODE_IDS, getAlgorithmMode, isAlgorithmModeId, type AlgorithmFeedbackMode, type AlgorithmModeDefinition, type AlgorithmModeId } from "../../tracks/coding-interview/domain/algorithmModes";
import type { AlgorithmResponse } from "../../tracks/coding-interview/domain/algorithmResponse";
import { createAlgorithmReviewEntry, updateAlgorithmReviewEntry } from "../../tracks/coding-interview/algorithmReview";
import { getAlgorithmInteractionCompleteness, submitAlgorithmInteraction } from "../../tracks/coding-interview/algorithmInteractionHandlers";
import { createAlgorithmOptionOrder } from "../../tracks/coding-interview/algorithmOptionOrder";

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
  targetMentalUnitId?: string;
}>;

export type AlgorithmsRecommendationAction =
  | Readonly<{ kind: "resume_active_session"; modeId: AlgorithmModeId; sessionId: string; simulationProfileId?: string; topicId: string }>
  | Readonly<{ kind: "start_practice"; modeId: AlgorithmModeId; reviewSource?: AlgorithmReviewSource; scope?: AlgorithmSelectionScope; topicId: string }>
  | Readonly<{ kind: "choose_declared_scope"; modeId: typeof ALGORITHM_MODE_IDS.contrastPractice | typeof ALGORITHM_MODE_IDS.independentPractice; targetMentalUnitId?: string }>
  | Readonly<{ kind: "unavailable"; reason: string }>;

export type CodingInterviewDashboardRecommendation = AlgorithmsRecommendation & Readonly<{ action: AlgorithmsRecommendationAction }>;
export type CodingInterviewDashboard = Readonly<{ recommendation: CodingInterviewDashboardRecommendation }>;

/**
 * Pure Algorithms-family semantics. Application lifecycle use cases own storage,
 * journals and mutation ordering; this class only validates a declared plan and
 * computes deterministic recommendations from supplied canonical evidence.
 */
export type AlgorithmsLifecyclePreparationRequest = Readonly<{
  feedbackMode?: AlgorithmFeedbackMode;
  sessionId: string;
  requestedLength: 10 | 20 | 40;
  reviewItemRefs?: readonly ContentItemRef[];
  reviewSource?: AlgorithmReviewSource;
  scope?: AlgorithmSelectionScope;
}>;

export class CodingInterviewFamilyRuntime implements TrainingFamilyRuntime {
  readonly familyId = "coding_interview" as const;

  constructor(
    private readonly catalog: AlgorithmRuntimeCatalog,
    private readonly recommendationPolicy: AlgorithmsRecommendationPolicy = ALGORITHMS_RECOMMENDATION_POLICY,
    private readonly taxonomyVersion: string,
  ) {
    if (recommendationPolicy.policyId !== "algorithms-recommendations" || recommendationPolicy.policyVersion !== "1") {
      throw new Error("Algorithms recommendation policy identity is unsupported.");
    }
  }

  async prepare(input: Readonly<{ trackId: string; modeId: string; source?: string; request: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PreparedSession> {
    if (input.trackId !== "coding-interview-dsa-problem-solving") throw new Error(`Algorithms runtime cannot prepare track ${input.trackId}.`);
    const mode = getAlgorithmMode(input.modeId);
    const request = preparationRequest(input.request);
    if (!mode.profile.supportedLengths.includes(request.requestedLength)) throw new Error(`Algorithms mode ${mode.id} does not support requested length ${request.requestedLength}.`);
    this.catalog.assertModeAvailable(mode.id, request.requestedLength);
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
    const blueprint = this.catalog.getPracticeBlueprint(mode.contentBlueprintModeId);
    if (!blueprint || selection.actualLength !== selection.items.length || selection.items.length === 0) throw new Error(`Algorithms mode ${mode.id} has no valid declared practice plan.`);
    const base = {
      id: request.sessionId,
      trackId: "coding-interview-dsa-problem-solving",
      modeId: mode.id,
      configurationSnapshot: practiceConfiguration(mode, blueprint, request.feedbackMode, request.reviewSource),
      requestedLength: request.requestedLength,
      actualLength: selection.actualLength,
      currentItemIndex: 0,
      itemOrder: selection.items.map((item, index) => ({ occurrenceId: `${request.sessionId}:occurrence:${index}`, item: this.catalog.toContentItemRef(item) })),
      optionOrderByOccurrence: Object.fromEntries(selection.items.map((item, index) => {
        const occurrenceId = `${request.sessionId}:occurrence:${index}`;
        return [occurrenceId, createAlgorithmOptionOrder(item, occurrenceId)];
      })),
      conditionalReinsertSlots: [],
      activeForegroundMs: 0,
      contentVersion: this.catalog.getContentVersion(),
      packagePin: this.catalog.getPackagePin(),
      status: "active" as const,
      startedAt: input.now,
    };
    const initial = createTrainingSession(base);
    const reviewedItemRefs = [...(request.reviewItemRefs ?? []), ...input.reviews.map((review) => review.sourceItem)];
    const planned = this.prepareConditionalReinsertPlan({
      optionOrderByItemId: Object.fromEntries(reviewedItemRefs
        .filter((ref) => ref.trackId === "coding-interview-dsa-problem-solving" && ref.contentVersion === this.catalog.getContentVersion())
        .map((ref) => {
          const item = this.catalog.getItemById(ref.itemId);
          return [item.id, createAlgorithmOptionOrder(item, `${request.sessionId}:reinsert:${item.id}`)];
        })),
      reviewedItemRefs,
      reviewSource: request.reviewSource,
      session: initial,
    });
    const identified = { ...planned, taxonomyVersion: this.taxonomyVersion };
    const session = createTrainingSession({ ...identified, planFingerprint: await createContentSessionPlanFingerprint(identified as TrainingSession & { taxonomyVersion: string }) });
    return Object.freeze({ session, firstOccurrence: session.itemOrder[0]!.item, draft: null });
  }

  async validateResume(input: Readonly<{ session: TrainingSession; draft: TrainingSessionDraft | null }>): Promise<void> {
    assertAlgorithmsSession(input.session, this.catalog.getContentVersion(), this.taxonomyVersion, this.catalog.getPackagePin());
    const simulation = input.session.modeId === ALGORITHM_MODE_IDS.interviewSimulation;
    if (simulation && (!input.draft || input.draft.sessionId !== input.session.id || input.draft.trackId !== input.session.trackId || input.draft.familyId !== this.familyId)) {
      throw new Error("Algorithms Interview Simulation requires its exact persisted draft.");
    }
    if (!simulation && input.draft) throw new Error("Algorithms practice cannot resume with a simulation draft.");
  }

  async submitPractice(input: Readonly<{ session: TrainingSession; response: unknown; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<PracticeSubmission> {
    assertAlgorithmsSession(input.session, this.catalog.getContentVersion(), this.taxonomyVersion, this.catalog.getPackagePin());
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
          const updated = updateAlgorithmReviewEntry(existing, attempt, { eligibleForPersistentResolution: isAlgorithmsDueQueueReviewSession(input.session) });
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
    assertAlgorithmsSession(input.session, this.catalog.getContentVersion(), this.taxonomyVersion, this.catalog.getPackagePin());
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

  async queryDashboard(input: Readonly<{ activeSession: TrainingSession | null; trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<CodingInterviewDashboard> {
    if (input.trackId !== "coding-interview-dsa-problem-solving") throw new Error("Algorithms dashboard requested for another track.");
    const recommendation = this.recommend({ evidence: algorithmEvidence(input.attempts, input.reviews, input.now, input.activeSession) });
    return Object.freeze({ recommendation: Object.freeze({ ...recommendation, action: this.actionForRecommendation(recommendation, input.activeSession) }) });
  }

  async queryProgress(input: Readonly<{ trackId: string; attempts: readonly TrainingAttempt<unknown>[]; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== "coding-interview-dsa-problem-solving") throw new Error("Algorithms progress requested for another track.");
    return Object.freeze({ attemptCount: input.attempts.length, dueReviewCount: input.reviews.filter((review) => review.dueAt <= input.now).length });
  }

  async queryReview(input: Readonly<{ trackId: string; reviews: readonly ReviewQueueEntry[]; now: string }>): Promise<unknown> {
    if (input.trackId !== "coding-interview-dsa-problem-solving") throw new Error("Algorithms review requested for another track.");
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
      compatibilitySets: this.catalog.getCompatibilitySets(),
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
      return Object.freeze({ explanation: "Use the practice mode you selected for this session.", modeId: input.learnerChoice, reason: "learner_choice" });
    }
    const evidence = input.evidence;
    if (evidence.activeSessionId) return Object.freeze({ explanation: "Continue where you left off, or end this session.", modeId: "continue_active_session", reason: "active_session" });
    const overdue = firstPositive(evidence.overdueReviewByMentalUnit);
    if (overdue) return Object.freeze({ explanation: `Review due for ${learnerMentalUnitLabel(overdue)}.`, modeId: ALGORITHM_MODE_IDS.weakAreaReview, reason: "overdue_review", source: "due_queue", targetMentalUnitId: overdue });
    const repeated = firstAtLeast(evidence.performanceSignals.repeatedHighRiskMistakesByMentalUnit, this.recommendationPolicy.repeatedMistakeThreshold);
    if (repeated) return Object.freeze({ explanation: `Review ${learnerMentalUnitLabel(repeated)} to address a repeated mistake.`, modeId: ALGORITHM_MODE_IDS.weakAreaReview, reason: "repeated_mistake", source: "due_queue", targetMentalUnitId: repeated });
    const absent = firstValue(evidence.learningStageByMentalUnit, (stage) => stage === "absent" || stage === "unstable");
    if (absent) return Object.freeze({ explanation: `Build the approach for ${learnerMentalUnitLabel(absent)}.`, modeId: ALGORITHM_MODE_IDS.learnApproach, reason: "learn_approach", targetMentalUnitId: absent });
    const bounded = firstBelow(evidence.boundedEvidenceByMentalUnit, this.recommendationPolicy.minimumBoundedEvidence);
    if (bounded) return Object.freeze({ explanation: `Practice ${learnerMentalUnitLabel(bounded)} with guidance before moving on.`, modeId: ALGORITHM_MODE_IDS.guidedPractice, reason: "guided_practice", targetMentalUnitId: bounded });
    const contrast = firstPositive(evidence.performanceSignals.strategyConfusionByMentalUnit);
    if (contrast && this.isModeAvailable(ALGORITHM_MODE_IDS.contrastPractice, 10)) return Object.freeze({ explanation: `Compare strategies for ${learnerMentalUnitLabel(contrast)}.`, modeId: ALGORITHM_MODE_IDS.contrastPractice, reason: "contrast_practice", targetMentalUnitId: contrast });
    const recognition = firstPositive(evidence.performanceSignals.recognitionBottleneckByMentalUnit);
    if (recognition && this.isModeAvailable(ALGORITHM_MODE_IDS.recognizePatterns, 10)) return Object.freeze({ explanation: `Practice recognizing when to use ${learnerMentalUnitLabel(recognition)}.`, modeId: ALGORITHM_MODE_IDS.recognizePatterns, reason: "recognize_patterns", targetMentalUnitId: recognition });
    const targetMentalUnitId = this.catalog.getItems()[0]?.taxonomy.primaryMentalUnitId;
    if (targetMentalUnitId && this.isModeAvailable(ALGORITHM_MODE_IDS.independentPractice, 10)) return Object.freeze({ explanation: "Choose a topic for independent practice.", modeId: ALGORITHM_MODE_IDS.independentPractice, reason: "independent_practice", targetMentalUnitId });
    if (targetMentalUnitId && this.isModeAvailable(ALGORITHM_MODE_IDS.guidedPractice, 10)) return Object.freeze({ explanation: `Practice ${learnerMentalUnitLabel(targetMentalUnitId)} with guidance.`, modeId: ALGORITHM_MODE_IDS.guidedPractice, reason: "guided_practice", targetMentalUnitId });
    return Object.freeze({ explanation: "No executable Algorithms practice mode is available in this package.", modeId: ALGORITHM_MODE_IDS.learnApproach, reason: "learn_approach" });
  }

  private actionForRecommendation(recommendation: AlgorithmsRecommendation, activeSession: TrainingSession | null): AlgorithmsRecommendationAction {
    if (recommendation.reason === "active_session") return this.resumeAction(activeSession);
    if (!this.isModeAvailable(recommendation.modeId, 10)) return Object.freeze({ kind: "unavailable", reason: "This recommendation is unavailable in the installed Free package." });
    if (recommendation.modeId === ALGORITHM_MODE_IDS.weakAreaReview) return this.practiceAction(recommendation.modeId, recommendation.targetMentalUnitId, { reviewSource: recommendation.source });
    if (recommendation.modeId === ALGORITHM_MODE_IDS.learnApproach || recommendation.modeId === ALGORITHM_MODE_IDS.guidedPractice) {
      return this.practiceAction(recommendation.modeId, recommendation.targetMentalUnitId);
    }
    if (recommendation.modeId === ALGORITHM_MODE_IDS.recognizePatterns) return this.recognitionAction(recommendation.targetMentalUnitId);
    if (recommendation.modeId === ALGORITHM_MODE_IDS.contrastPractice) {
      if (!recommendation.targetMentalUnitId) return Object.freeze({ kind: "unavailable", reason: "The contrast recommendation has no declared Algorithms target." });
      return Object.freeze({ kind: "choose_declared_scope", modeId: ALGORITHM_MODE_IDS.contrastPractice, targetMentalUnitId: recommendation.targetMentalUnitId });
    }
    if (recommendation.modeId === ALGORITHM_MODE_IDS.independentPractice) {
      return Object.freeze({ kind: "choose_declared_scope", modeId: ALGORITHM_MODE_IDS.independentPractice });
    }
    return Object.freeze({ kind: "unavailable", reason: "This recommendation requires an explicitly selected declared practice scope." });
  }

  private practiceAction(modeId: AlgorithmModeId, mentalUnitId: string | undefined, options: Readonly<{ reviewSource?: AlgorithmReviewSource }> = {}): AlgorithmsRecommendationAction {
    if (!mentalUnitId) return Object.freeze({ kind: "unavailable", reason: "The recommendation has no declared Algorithms scope." });
    const topicId = this.topicForMentalUnit(mentalUnitId);
    if (!topicId) return Object.freeze({ kind: "unavailable", reason: `No unique roadmap topic is declared for ${mentalUnitId}.` });
    return Object.freeze({ kind: "start_practice", modeId, ...(options.reviewSource ? { reviewSource: options.reviewSource } : {}), topicId });
  }

  private resumeAction(session: TrainingSession | null): AlgorithmsRecommendationAction {
    if (!session || session.trackId !== "coding-interview-dsa-problem-solving" || session.status !== "active" || !isAlgorithmModeId(session.modeId)) {
      return Object.freeze({ kind: "unavailable", reason: "The active Algorithms session is no longer available to resume." });
    }
    const item = session.itemOrder[session.currentItemIndex]?.item;
    if (!item) return Object.freeze({ kind: "unavailable", reason: "The active Algorithms session has no current item." });
    if (!this.isModeAvailable(session.modeId, session.requestedLength)) return Object.freeze({ kind: "unavailable", reason: "The active Algorithms session mode is unavailable in the installed Free package." });
    let topicId: string;
    try { topicId = this.catalog.getItemById(item.itemId).taxonomy.roadmapNodeId; }
    catch { return Object.freeze({ kind: "unavailable", reason: "The active Algorithms session item is unavailable in the current content artifact." }); }
    if (session.modeId !== ALGORITHM_MODE_IDS.interviewSimulation) return Object.freeze({ kind: "resume_active_session", modeId: session.modeId, sessionId: session.id, topicId });
    const profileId = session.configurationSnapshot.simulationProfileId;
    if (typeof profileId !== "string" || !this.catalog.getSimulationProfile(profileId)) {
      return Object.freeze({ kind: "unavailable", reason: "The active Interview Simulation profile is unavailable." });
    }
    return Object.freeze({ kind: "resume_active_session", modeId: session.modeId, sessionId: session.id, simulationProfileId: profileId, topicId });
  }

  private isModeAvailable(modeId: string, requestedLength: number): boolean {
    try {
      this.catalog.assertModeAvailable(modeId, requestedLength);
      return true;
    } catch {
      return false;
    }
  }

  private topicForMentalUnit(mentalUnitId: string): string | null {
    const topicIds = [...new Set(this.catalog.getItemsForMentalUnit(mentalUnitId).map((item) => item.taxonomy.roadmapNodeId))];
    return topicIds.length === 1 ? topicIds[0]! : null;
  }

  private recognitionAction(mentalUnitId: string | undefined): AlgorithmsRecommendationAction {
    if (!mentalUnitId) return Object.freeze({ kind: "unavailable", reason: "The recognition recommendation has no declared Algorithms target." });
    const matches = this.catalog.getRecognitionSets().filter((set) => [
      ...(set.taxonomyScope.mentalUnitIds ?? []),
      ...(set.taxonomyScope.primaryMentalUnitIds ?? []),
    ].includes(mentalUnitId));
    if (matches.length !== 1) return Object.freeze({ kind: "unavailable", reason: matches.length === 0 ? "No declared recognition set covers this Algorithms target." : "More than one declared recognition set covers this Algorithms target." });
    const topicIds = [...new Set(matches[0]!.itemIds.map((itemId) => this.catalog.getItemById(itemId).taxonomy.roadmapNodeId))];
    if (topicIds.length !== 1) return Object.freeze({ kind: "unavailable", reason: "The declared recognition set does not belong to one Algorithms roadmap topic." });
    return Object.freeze({ kind: "start_practice", modeId: ALGORITHM_MODE_IDS.recognizePatterns, scope: { recognitionSetId: matches[0]!.setId }, topicId: topicIds[0]! });
  }
}

function learnerMentalUnitLabel(mentalUnitId: string): string {
  const words = mentalUnitId.replaceAll("_", " ").trim();
  return words.replace(/^./, (letter) => letter.toUpperCase());
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
  if (value.reinsertEnabled !== undefined) {
    throw new Error("Algorithms reinsert behavior is profile-owned and cannot be overridden by the learner.");
  }
  if (value.feedbackMode !== undefined && value.feedbackMode !== "afterEachAnswer" && value.feedbackMode !== "atSessionEnd") {
    throw new Error("Algorithms feedback mode must be afterEachAnswer or atSessionEnd.");
  }
  if (value.reviewSource !== undefined && value.reviewSource !== "due_queue" && value.reviewSource !== "session_misses") {
    throw new Error("Algorithms review source must be due_queue or session_misses.");
  }
  if (value.reviewItemRefs !== undefined && !Array.isArray(value.reviewItemRefs)) {
    throw new Error("Algorithms review item refs must be an array.");
  }
  if (value.reviewItemRefs !== undefined && value.reviewSource !== "session_misses") {
    throw new Error("Algorithms review item refs require the session_misses review source.");
  }
  if (Array.isArray(value.reviewItemRefs) && !value.reviewItemRefs.every(isAlgorithmsContentItemRef)) {
    throw new Error("Algorithms review item refs must contain only Algorithms content item references.");
  }
  return value as AlgorithmsLifecyclePreparationRequest;
}

function isAlgorithmsContentItemRef(value: unknown): value is ContentItemRef {
  return isRecord(value) && value.trackId === "coding-interview-dsa-problem-solving" &&
    typeof value.itemId === "string" && Boolean(value.itemId.trim()) &&
    typeof value.contentVersion === "string" && Boolean(value.contentVersion.trim());
}

function practiceConfiguration(mode: AlgorithmModeDefinition, blueprint: { blueprintId: string; blueprintVersion: string }, requestedFeedbackMode: AlgorithmFeedbackMode | undefined, reviewSource: AlgorithmReviewSource | undefined): Readonly<Record<string, string | number | boolean>> {
  if (mode.id === ALGORITHM_MODE_IDS.weakAreaReview ? !reviewSource : reviewSource !== undefined) {
    throw new Error("Algorithms review source must match the declared practice mode.");
  }
  if (mode.id === ALGORITHM_MODE_IDS.customPractice && requestedFeedbackMode === undefined) {
    throw new Error("Algorithms Custom Practice requires an explicit feedback mode.");
  }
  const feedbackMode = requestedFeedbackMode ?? mode.profile.feedbackMode;
  if (!mode.profile.supportedFeedbackModes.includes(feedbackMode)) {
    throw new Error(`Algorithms mode ${mode.id} does not support feedback mode ${feedbackMode}.`);
  }
  return Object.freeze({
    kind: "algorithmsPractice",
    blueprintId: blueprint.blueprintId,
    blueprintVersion: blueprint.blueprintVersion,
    feedbackMode,
    answerChanges: mode.profile.answerChanges,
    navigation: mode.profile.navigation,
    submission: mode.profile.submission,
    timer: mode.profile.timer.kind,
    ...(reviewSource ? { reviewSource } : {}),
    ...(mode.profile.timer.kind === "countdownForeground" ? { timerDurationMs: mode.profile.timer.durationMs } : {}),
    reinsertEnabled: mode.profile.reinsertEnabled,
  });
}

/** Only the declared due-queue session context may advance persistent review retention. */
function isAlgorithmsDueQueueReviewSession(session: TrainingSession): boolean {
  return session.modeId === ALGORITHM_MODE_IDS.weakAreaReview && session.configurationSnapshot.reviewSource === "due_queue";
}

function assertAlgorithmsSession(session: TrainingSession, contentVersion: string, taxonomyVersion: string, packagePin: TrainingSession["packagePin"]): void {
  if (session.trackId !== "coding-interview-dsa-problem-solving" || session.contentVersion !== contentVersion || !contentPackagePinsEqual(session.packagePin, packagePin) || session.taxonomyVersion !== taxonomyVersion || !session.planFingerprint) {
    throw new Error("Algorithms session does not match the exact bundled content identity.");
  }
  getAlgorithmMode(session.modeId);
}

function sameContent(left: ContentItemRef, right: ContentItemRef): boolean {
  return left.trackId === right.trackId && left.contentVersion === right.contentVersion && left.itemId === right.itemId && contentPackagePinsEqual(left.packagePin, right.packagePin);
}

function algorithmEvidence(attempts: readonly TrainingAttempt<unknown>[], reviews: readonly ReviewQueueEntry[], now: string, activeSession: TrainingSession | null): AlgorithmsEvidence {
  const boundedEvidenceByMentalUnit: Record<string, number> = {};
  const learningStageByMentalUnit: Record<string, "absent" | "unstable" | "introduced" | "guided" | "independent"> = {};
  const overdueReviewByMentalUnit: Record<string, number> = {};
  const repeatedHighRiskMistakesByMentalUnit: Record<string, number> = {};
  const strategyConfusionByMentalUnit: Record<string, number> = {};
  const recognitionBottleneckByMentalUnit: Record<string, number> = {};
  for (const attempt of attempts) {
    for (const reference of attempt.reviewEvidence.taxonomyOrSkillRefs.filter((reference) => reference.axisId === "mental_unit")) {
      boundedEvidenceByMentalUnit[reference.nodeId] = (boundedEvidenceByMentalUnit[reference.nodeId] ?? 0) + 1;
      learningStageByMentalUnit[reference.nodeId] = attempt.result.kind === "correct" ? "guided" : "unstable";
    }
  }
  for (const review of reviews) {
    for (const reference of review.taxonomyOrSkillRefs.filter((reference) => reference.axisId === "mental_unit")) {
      if (review.dueAt <= now) overdueReviewByMentalUnit[reference.nodeId] = (overdueReviewByMentalUnit[reference.nodeId] ?? 0) + 1;
      if (review.persistent && review.reasons.includes("repeated_mistake")) repeatedHighRiskMistakesByMentalUnit[reference.nodeId] = (repeatedHighRiskMistakesByMentalUnit[reference.nodeId] ?? 0) + 1;
      if (review.reasons.includes("wrong_strategy")) strategyConfusionByMentalUnit[reference.nodeId] = (strategyConfusionByMentalUnit[reference.nodeId] ?? 0) + 1;
      if (review.reasons.includes("wrong_pattern")) recognitionBottleneckByMentalUnit[reference.nodeId] = (recognitionBottleneckByMentalUnit[reference.nodeId] ?? 0) + 1;
    }
  }
  return Object.freeze({
    ...(activeSession?.trackId === "coding-interview-dsa-problem-solving" && activeSession.status === "active" ? { activeSessionId: activeSession.id } : {}),
    boundedEvidenceByMentalUnit,
    learningStageByMentalUnit,
    overdueReviewByMentalUnit,
    performanceSignals: Object.freeze({ recognitionBottleneckByMentalUnit, repeatedHighRiskMistakesByMentalUnit, strategyConfusionByMentalUnit }),
  });
}


function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
