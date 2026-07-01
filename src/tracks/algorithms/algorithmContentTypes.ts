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
  "complexity_and_constraints",
  "arrays_and_strings",
  "hash_map_and_set",
  "two_pointers",
  "sliding_window",
  "prefix_sums",
  "sorting_based",
  "stack",
  "monotonic_stack",
  "binary_search",
  "linked_list",
  "recursion_basics",
  "tree_traversal",
  "heap_priority_queue",
  "intervals",
  "backtracking",
  "graph_traversal",
  "greedy_intro",
  "dynamic_programming_intro",
  "bit_manipulation",
  "math_and_geometry",
] as const;

export type AlgorithmPatternFamilyId = (typeof ALGORITHM_PATTERN_FAMILY_IDS)[number];

export type AlgorithmPatternFamilyKind = "real_pattern_family" | "synthetic_practice_grouping";

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
  "approach_naming",
  "worked_example",
  "trace_drill",
  "trace_next_step",
  "strategy_choice",
  "complexity_check",
  "solution_comparison",
  "edge_case_drill",
] as const;

export type AlgorithmMvpTrainingItemType = (typeof ALGORITHM_MVP_TRAINING_ITEM_TYPES)[number];

export const ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES = [
  "subgoal_identification",
  "subgoal_ordering",
  "pseudocode_parsons",
  "pseudocode_ordering",
  "faded_solution",
  "fill_missing_step",
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

export type AlgorithmApproachId =
  | "hash_map_complement_lookup"
  | "pair_scan_sorted_input"
  | "positive_sliding_window"
  | string;

export type AlgorithmTaxonomyAxis =
  | "learning_stage"
  | "pattern_family"
  | "pattern_variant"
  | "problem_archetype"
  | "skill_atom"
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
  kind?: AlgorithmPatternFamilyKind;
  label: string;
  prerequisiteLearningStageIds?: readonly AlgorithmLearningStage[];
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
  prerequisiteLearningStageIds?: readonly AlgorithmLearningStage[];
  prerequisitePatternFamilyIds: readonly AlgorithmPatternFamilyId[];
  prerequisitePatternVariantIds?: readonly string[];
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
  prerequisiteLearningStageIds?: readonly AlgorithmLearningStage[];
  primaryPatternFamilyId: AlgorithmPatternFamilyId;
  problemArchetypeIds?: readonly string[];
  prerequisiteSkillAtomIds: readonly string[];
};

export type AlgorithmApproachStep = {
  description: string;
  id: string;
  label: string;
  order: number;
};

export type AlgorithmInvariant = {
  description: string;
  id: string;
  label: string;
};

export type AlgorithmPseudocodeLine = {
  id: string;
  indentationLevel: number;
  order: number;
  text: string;
};

export type AlgorithmPseudocodeTemplate = {
  id: string;
  language: "pseudocode";
  lines: readonly AlgorithmPseudocodeLine[];
};

export type AlgorithmApproachPitfall = {
  description: string;
  id: string;
  mistakeTypes: readonly AlgorithmMistakeType[];
};

export type AlgorithmApproach = {
  commonMistakeTypes: readonly AlgorithmMistakeType[];
  contentVersion: string;
  description: string;
  id: AlgorithmApproachId;
  invariants: readonly AlgorithmInvariant[];
  label: string;
  patternFamilyId: AlgorithmPatternFamilyId;
  pitfalls: readonly AlgorithmApproachPitfall[];
  pseudocodeTemplate: AlgorithmPseudocodeTemplate;
  status: AlgorithmContentStatus;
  steps: readonly AlgorithmApproachStep[];
  typicalSpaceComplexity: AlgorithmComplexityClass;
  typicalTimeComplexity: AlgorithmComplexityClass;
  whenNotToUseSignals: readonly string[];
  whenToUseSignals: readonly string[];
};

export type AlgorithmApproachTemplate = AlgorithmApproach;

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

export const ALGORITHM_STATIC_MICRO_CHECK_TYPES = [
  "single_choice",
  "multi_select",
  "complexity_pair",
  "order_steps",
  "fill_blank",
  "trace_next_step",
  "select_pseudocode_line",
] as const;

export type AlgorithmStaticMicroCheckType = (typeof ALGORITHM_STATIC_MICRO_CHECK_TYPES)[number];

export type AlgorithmStaticMicroCheckOption = {
  id: string;
  text: string;
};

export type AlgorithmComplexityPairAnswer = {
  space: AlgorithmComplexityClass;
  time: AlgorithmComplexityClass;
};

export type AlgorithmStaticMicroCheckAnswer =
  | string
  | readonly string[]
  | AlgorithmComplexityPairAnswer;

export type AlgorithmStaticMicroCheck = {
  correctAnswer: AlgorithmStaticMicroCheckAnswer;
  expectedAnswer?: AlgorithmStaticMicroCheckAnswer;
  feedback: string;
  id: string;
  mistakeTypes: readonly AlgorithmMistakeType[];
  options?: readonly AlgorithmStaticMicroCheckOption[];
  prompt: string;
  status: "active" | "disabled";
  testedSkillAtomIds: readonly string[];
  type: AlgorithmStaticMicroCheckType;
};

export type AlgorithmTraceStep = {
  description: string;
  id: string;
  order: number;
  state: readonly string[];
};

export type AlgorithmRejectedAlternative = {
  approachId: string;
  reason: string;
};

export type AlgorithmTrainingItem = {
  acceptableApproachIds?: readonly string[];
  approachChoiceReason?: string;
  approachId?: AlgorithmApproachId;
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
  invariant?: AlgorithmInvariant;
  learningStage: AlgorithmLearningStage;
  mechanicsSummary?: string;
  primarySkillAtomId: string;
  problemStatement?: string;
  prompt: string;
  pseudocodeLines?: readonly AlgorithmPseudocodeLine[];
  pseudocodeTemplate?: AlgorithmPseudocodeTemplate;
  pitfalls?: readonly AlgorithmApproachPitfall[];
  reasonSignal?: string;
  rejectedApproachIds?: readonly string[];
  roadmapNodeId?: string;
  secondarySkillAtomIds?: readonly string[];
  solution?: AlgorithmSolution;
  status: AlgorithmContentStatus;
  staticMicroChecks?: readonly AlgorithmStaticMicroCheck[];
  stepByStepTrace?: readonly AlgorithmTraceStep[];
  subgoals?: readonly AlgorithmSubgoal[];
  taxonomyRefs: readonly AlgorithmTaxonomyRef[];
  title: string;
  trackId: "algorithms";
  type: AlgorithmTrainingItemType;
  whenNotToUseSignals?: readonly string[];
  whenToUseSignals?: readonly string[];
  whyNotAlternatives?: readonly AlgorithmRejectedAlternative[];
  commonMistakes?: readonly AlgorithmMistakeType[];
};

export function isAlgorithmMistakeType(value: unknown): value is AlgorithmMistakeType {
  return ALGORITHM_MISTAKE_TYPES.includes(value as AlgorithmMistakeType);
}
