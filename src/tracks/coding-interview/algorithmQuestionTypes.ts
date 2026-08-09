import type {
  PublishedAlgorithmChoiceInteraction,
  PublishedAlgorithmComplexityInteraction,
  PublishedAlgorithmItem,
  PublishedAlgorithmOrderingInteraction,
} from "../../content/contracts";

/** Runtime name retained for family-owned code; its only shape is the published item contract. */
export type AlgorithmQuestion = PublishedAlgorithmItem;
export const ALGORITHM_QUESTION_TYPES = ["approach_naming", "approach_primer", "code_reading", "common_mistake_diagnosis", "complexity_check", "complexity_reasoning", "constraint_change", "counterexample_reasoning", "edge_case_drill", "invariant_identification", "invariant_reasoning", "mistake_review", "output_contract_analysis", "output_contract_reasoning", "pseudocode_ordering", "single_choice", "solution_comparison", "state_selection", "strategy_choice", "subgoal_ordering", "test_case_selection", "trace_drill", "trace_next_step", "worked_example"] as const;
/** Roadmap instructional categories; they are not a field on the published item. */
export type AlgorithmQuestionType = (typeof ALGORITHM_QUESTION_TYPES)[number];
export type AlgorithmChoiceQuestion = Extract<AlgorithmQuestion, Readonly<{ interaction: PublishedAlgorithmChoiceInteraction }>>;
export type AlgorithmOrderingQuestion = Extract<AlgorithmQuestion, Readonly<{ interaction: PublishedAlgorithmOrderingInteraction }>>;
export type AlgorithmComplexityQuestion = Extract<AlgorithmQuestion, Readonly<{ interaction: PublishedAlgorithmComplexityInteraction }>>;
export function isAlgorithmChoiceQuestion(question: AlgorithmQuestion): question is AlgorithmChoiceQuestion { return question.interaction.type === "choice"; }
export function isAlgorithmOrderingQuestion(question: AlgorithmQuestion): question is AlgorithmOrderingQuestion { return question.interaction.type === "ordering"; }
export function isAlgorithmComplexityQuestion(question: AlgorithmQuestion): question is AlgorithmComplexityQuestion { return question.interaction.type === "complexity"; }
