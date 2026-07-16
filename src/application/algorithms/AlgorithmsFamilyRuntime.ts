import type { ContentItemRef, ReviewQueueEntry, TrainingAttempt, TrainingSession } from "../../domain";
import { AlgorithmContentCatalog } from "../../tracks/algorithms/algorithmContentCatalog";
import {
  ALGORITHMS_PRACTICE_BLUEPRINT,
  ALGORITHMS_RECOMMENDATION_POLICY,
  assertAlgorithmsPracticeBlueprint,
  type AlgorithmsPracticeBlueprint,
  type AlgorithmsRecommendationPolicy,
} from "../../tracks/algorithms/algorithmsBlueprints";
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
import { ALGORITHM_MODE_IDS, type AlgorithmModeId } from "../../tracks/algorithms/domain/algorithmModes";

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
export class AlgorithmsFamilyRuntime {
  readonly familyId = "algorithms" as const;

  constructor(
    private readonly catalog: AlgorithmContentCatalog,
    private readonly blueprint: AlgorithmsPracticeBlueprint = ALGORITHMS_PRACTICE_BLUEPRINT,
    private readonly recommendationPolicy: AlgorithmsRecommendationPolicy = ALGORITHMS_RECOMMENDATION_POLICY,
  ) {
    assertAlgorithmsPracticeBlueprint(blueprint);
    if (recommendationPolicy.policyId !== "algorithms-recommendations" || recommendationPolicy.policyVersion !== "1") {
      throw new Error("Algorithms recommendation policy identity is unsupported.");
    }
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
      practiceBlueprint: this.blueprint,
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
      entries: getAlgorithmQuestionEntries(this.catalog.getGroups()),
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
