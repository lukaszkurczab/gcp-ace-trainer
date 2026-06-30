export const ALGORITHM_CONTENT_VERSION = "algorithms-core-draft";

export const ALGORITHM_LEARNING_STAGES = [
  "foundations",
  "pattern_mechanics",
  "guided_application",
  "strategy_selection",
  "contrast_practice",
  "independent_attempt",
  "mixed_interview_practice",
] as const;

export type AlgorithmLearningStage = (typeof ALGORITHM_LEARNING_STAGES)[number];

export const ALGORITHM_PATTERN_FAMILY_IDS = [
  "complexity_basics",
  "hash_map_and_set",
  "two_pointers",
  "sliding_window",
  "prefix_sums",
  "sorting_based",
  "stack",
  "binary_search",
] as const;

export type AlgorithmPatternFamilyId = (typeof ALGORITHM_PATTERN_FAMILY_IDS)[number];

export const ALGORITHM_MISTAKE_TYPES = [
  "wrong_approach",
  "brute_force_when_optimized_required",
  "complexity_mismatch",
  "constraint_ignored",
  "invariant_missing",
  "invariant_broken",
  "cannot_trace_algorithm",
  "subgoal_order_wrong",
  "data_structure_mismatch",
  "edge_case_missed",
  "off_by_one",
  "duplicate_handling_error",
  "negative_numbers_assumption_error",
  "empty_input_error",
  "cannot_explain_why",
] as const;

export type AlgorithmMistakeType = (typeof ALGORITHM_MISTAKE_TYPES)[number];

export const ALGORITHM_EVIDENCE_LEVELS = [
  "none",
  "exposed",
  "explained",
  "traced",
  "guided",
  "independent_same_pattern",
  "contrast_success",
  "mixed_success",
  "needs_review",
] as const;

export type AlgorithmEvidenceLevel = (typeof ALGORITHM_EVIDENCE_LEVELS)[number];

export const ALGORITHM_MVP_TRAINING_ITEM_TYPES = [
  "approach_primer",
  "worked_example",
  "trace_drill",
  "strategy_choice",
  "complexity_check",
  "solution_comparison",
  "edge_case_drill",
] as const;

export type AlgorithmMvpTrainingItemType = (typeof ALGORITHM_MVP_TRAINING_ITEM_TYPES)[number];

export const ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES = [
  "subgoal_ordering",
  "pseudocode_parsons",
  "faded_solution",
] as const;

export type AlgorithmSecondStageTrainingItemType =
  (typeof ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES)[number];

export const ALGORITHM_LATER_TRAINING_ITEM_TYPES = [
  "independent_attempt",
  "interview_simulation_problem",
  "full_code_editor",
] as const;

export type AlgorithmLaterTrainingItemType = (typeof ALGORITHM_LATER_TRAINING_ITEM_TYPES)[number];

export type AlgorithmTrainingItemType =
  | AlgorithmMvpTrainingItemType
  | AlgorithmSecondStageTrainingItemType
  | AlgorithmLaterTrainingItemType;

export type AlgorithmContentStatus = "draft" | "active" | "disabled";

export type AlgorithmTaxonomyAxis =
  | "learning_stage"
  | "pattern_family"
  | "pattern_variant"
  | "problem_archetype"
  | "data_structure"
  | "constraint_signal"
  | "decision_signal"
  | "implementation_risk"
  | "mistake_type";

export type AlgorithmTaxonomyRef = {
  axisId: AlgorithmTaxonomyAxis;
  nodeId: string;
  role?: "primary" | "secondary" | "prerequisite" | "mistake_type";
};

export type AlgorithmPatternFamily = {
  commonMistakeTypes: readonly AlgorithmMistakeType[];
  contentVersion: string;
  coreDecisionSignals: readonly string[];
  description: string;
  entryLearningStage: AlgorithmLearningStage;
  id: AlgorithmPatternFamilyId;
  label: string;
  prerequisitePatternFamilyIds: readonly AlgorithmPatternFamilyId[];
};

export type AlgorithmPatternVariant = {
  contentVersion: string;
  decisionSignals: readonly string[];
  description: string;
  id: string;
  label: string;
  learningStage: AlgorithmLearningStage;
  patternFamilyId: AlgorithmPatternFamilyId;
  prerequisitePatternFamilyIds: readonly AlgorithmPatternFamilyId[];
};

export type AlgorithmProblemArchetype = {
  contentVersion: string;
  decisionSignals: readonly string[];
  description: string;
  id: string;
  label: string;
  primaryPatternFamilyIds: readonly AlgorithmPatternFamilyId[];
};

export type AlgorithmSkillAtom = {
  contentVersion: string;
  description: string;
  evidenceRequiredForProgression: readonly AlgorithmEvidenceLevel[];
  id: string;
  label: string;
  mistakeTypes: readonly AlgorithmMistakeType[];
  patternVariantIds?: readonly string[];
  primaryPatternFamilyId: AlgorithmPatternFamilyId;
  problemArchetypeIds?: readonly string[];
  prerequisiteSkillAtomIds: readonly string[];
};

export type AlgorithmFeedbackResult = "correct" | "partial" | "incorrect" | "diagnostic";

export type AlgorithmFeedbackModel = {
  decisionSignal: string;
  mentalModelCorrection: string;
  mistakeTypes: readonly AlgorithmMistakeType[];
  nextAction: string;
  result: AlgorithmFeedbackResult;
};

export type AlgorithmSubgoal = {
  description: string;
  id: string;
  label: string;
  order: number;
};

export type AlgorithmComplexityClass =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n^2)"
  | "O(2^n)"
  | "O(n!)"
  | "other";

export type AlgorithmSolution = {
  approachId: string;
  complexityExplanation?: string;
  id: string;
  pseudocode?: readonly string[];
  spaceComplexity?: AlgorithmComplexityClass;
  subgoalIds?: readonly string[];
  summary: string;
  timeComplexity?: AlgorithmComplexityClass;
  title: string;
};

export type AlgorithmMicroPrompt = {
  expectedSignal?: string;
  id: string;
  prompt: string;
  status: "active" | "disabled";
};

export type AlgorithmActiveCheck = {
  id: string;
  label: string;
  status: "active" | "disabled";
};

export type AlgorithmTrainingItem = {
  acceptableApproachIds?: readonly string[];
  activeChecks?: readonly AlgorithmActiveCheck[];
  complexityExplanation?: string;
  constraintSignal?: string;
  constraints?: readonly string[];
  contentVersion: string;
  difficulty?: "intro" | "easy" | "medium" | "hard";
  expectedApproachIds?: readonly string[];
  expectedSpaceComplexity?: AlgorithmComplexityClass;
  expectedTimeComplexity?: AlgorithmComplexityClass;
  feedbackModel: AlgorithmFeedbackModel;
  id: string;
  learningStage: AlgorithmLearningStage;
  microPrompts?: readonly AlgorithmMicroPrompt[];
  primarySkillAtomId: string;
  prompt: string;
  reasonSignal?: string;
  rejectedApproachIds?: readonly string[];
  secondarySkillAtomIds?: readonly string[];
  solution?: AlgorithmSolution;
  status: AlgorithmContentStatus;
  subgoals?: readonly AlgorithmSubgoal[];
  taxonomyRefs: readonly AlgorithmTaxonomyRef[];
  title: string;
  trackId: "algorithms";
  type: AlgorithmTrainingItemType;
};

export function isAlgorithmMistakeType(value: unknown): value is AlgorithmMistakeType {
  return ALGORITHM_MISTAKE_TYPES.includes(value as AlgorithmMistakeType);
}
