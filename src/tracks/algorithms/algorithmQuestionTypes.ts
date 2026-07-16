import { ALGORITHM_CONTENT_VERSION } from "./algorithmContentTypes";

export const ALGORITHM_QUESTION_LEARNING_STAGES = [
  "foundations",
  "pattern_mechanics",
  "guided_application",
  "strategy_selection",
  "contrast_practice",
  "independent_attempt",
  "mixed_interview_practice",
] as const;

export type AlgorithmQuestionLearningStage =
  (typeof ALGORITHM_QUESTION_LEARNING_STAGES)[number];

export const ALGORITHM_QUESTION_DIFFICULTIES = [
  "core",
  "easy",
  "foundational",
  "hard",
  "intro",
  "intermediate",
  "advanced",
  "medium",
] as const;

export type AlgorithmQuestionDifficulty =
  (typeof ALGORITHM_QUESTION_DIFFICULTIES)[number];

export const ALGORITHM_QUESTION_TYPES = [
  "approach_naming",
  "approach_primer",
  "code_reading",
  "common_mistake_diagnosis",
  "complexity_check",
  "complexity_reasoning",
  "constraint_change",
  "counterexample_reasoning",
  "edge_case_drill",
  "invariant_identification",
  "invariant_reasoning",
  "mistake_review",
  "output_contract_analysis",
  "output_contract_reasoning",
  "pseudocode_ordering",
  "single_choice",
  "solution_comparison",
  "state_selection",
  "strategy_choice",
  "subgoal_ordering",
  "test_case_selection",
  "trace_drill",
  "trace_next_step",
  "worked_example",
] as const;

export type AlgorithmQuestionType = (typeof ALGORITHM_QUESTION_TYPES)[number];

export type AlgorithmQuestionOption = {
  explanation?: string;
  id: string;
  isCorrect: boolean;
  text: string;
};

export type AlgorithmQuestionFeedback = {
  decisionSignal: string;
  details?: string;
  distractorExplanations?: Readonly<Record<string, string | undefined>>;
  omittedCorrectOptionExplanations?: Readonly<Record<string, string | undefined>>;
  mentalModelCorrection: string;
  mistakeTypes: readonly string[];
  nextAction: string;
  result: "correct" | "partial" | "incorrect" | "diagnostic";
};

export type AlgorithmQuestionSubgoal = {
  id: string;
  text: string;
};

export type AlgorithmQuestionComplexityDimension = {
  acceptedAliases?: readonly string[];
  acceptedValues: readonly string[];
  id: string;
  values: readonly string[];
};

export type AlgorithmQuestionComplexity = {
  dimensions: readonly AlgorithmQuestionComplexityDimension[];
  maxPoints?: number;
};

type AlgorithmQuestionBase = {
  acceptableApproachIds?: readonly string[];
  answerFeedback?: string;
  complexityExplanation?: string;
  complexityVariables?: Readonly<Record<string, string | undefined>>;
  constraintSignal?: string;
  contentVersion: string;
  difficulty: AlgorithmQuestionDifficulty;
  expectedApproachIds?: readonly string[];
  expectedSpaceComplexity?: string;
  expectedTimeComplexity?: string;
  feedbackModel: AlgorithmQuestionFeedback;
  id: string;
  instruction?: string;
  learningStage: AlgorithmQuestionLearningStage;
  primarySkillAtomId: string;
  prompt: string;
  reasonSignal?: string;
  rejectedApproachIds?: readonly string[];
  roadmapNodeId?: string;
  secondarySkillAtomIds?: readonly string[];
  status?: "active";
  stepByStepTrace?: readonly unknown[];
  taxonomyRefs?: readonly {
    axisId: string;
    nodeId: string;
    role: string;
  }[];
  title?: string;
  trackId?: "algorithms";
  type: AlgorithmQuestionType;
};

export type AlgorithmChoiceQuestion = AlgorithmQuestionBase & {
  correctComplexity?: never;
  correctOrder?: never;
  options: readonly AlgorithmQuestionOption[];
  subgoals?: never;
};

export type AlgorithmOrderingQuestion = AlgorithmQuestionBase & {
  correctComplexity?: never;
  correctOrder: readonly string[];
  options?: never;
  subgoals: readonly AlgorithmQuestionSubgoal[];
};

export type AlgorithmComplexityQuestion = AlgorithmQuestionBase & {
  correctComplexity: AlgorithmQuestionComplexity;
  correctOrder?: never;
  options?: never;
  subgoals?: never;
};

export type AlgorithmQuestion =
  | AlgorithmChoiceQuestion
  | AlgorithmOrderingQuestion
  | AlgorithmComplexityQuestion;

export function isAlgorithmChoiceQuestion(
  question: AlgorithmQuestion,
): question is AlgorithmChoiceQuestion {
  return "options" in question;
}

export function isAlgorithmOrderingQuestion(
  question: AlgorithmQuestion,
): question is AlgorithmOrderingQuestion {
  return "subgoals" in question;
}

export function isAlgorithmComplexityQuestion(
  question: AlgorithmQuestion,
): question is AlgorithmComplexityQuestion {
  return "correctComplexity" in question;
}
