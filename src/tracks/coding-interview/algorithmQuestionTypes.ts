import type {
  PublishedAlgorithmChoiceInteraction,
  PublishedAlgorithmComplexityInteraction,
  PublishedAlgorithmItem,
  PublishedAlgorithmOrderingInteraction,
} from "../../content/contracts";
export { ALGORITHM_QUESTION_TYPES, type AlgorithmQuestionType } from "./algorithmContentTypes";

/** Runtime name retained for family-owned code; its only shape is the published item contract. */
export type AlgorithmQuestion = PublishedAlgorithmItem;
export type AlgorithmChoiceQuestion = Extract<AlgorithmQuestion, Readonly<{ interaction: PublishedAlgorithmChoiceInteraction }>>;
export type AlgorithmOrderingQuestion = Extract<AlgorithmQuestion, Readonly<{ interaction: PublishedAlgorithmOrderingInteraction }>>;
export type AlgorithmComplexityQuestion = Extract<AlgorithmQuestion, Readonly<{ interaction: PublishedAlgorithmComplexityInteraction }>>;
export function isAlgorithmChoiceQuestion(question: AlgorithmQuestion): question is AlgorithmChoiceQuestion { return question.interaction.type === "choice"; }
export function isAlgorithmOrderingQuestion(question: AlgorithmQuestion): question is AlgorithmOrderingQuestion { return question.interaction.type === "ordering"; }
export function isAlgorithmComplexityQuestion(question: AlgorithmQuestion): question is AlgorithmComplexityQuestion { return question.interaction.type === "complexity"; }
