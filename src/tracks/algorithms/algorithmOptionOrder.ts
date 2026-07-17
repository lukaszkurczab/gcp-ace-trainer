import { shuffleArray } from "../../utils";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "./algorithmQuestionTypes";

export type AlgorithmQuestionDisplayOption = {
  id: string;
  text: string;
};

export function getShuffledAlgorithmQuestionOptions(
  question: AlgorithmQuestion,
): readonly AlgorithmQuestionDisplayOption[] {
  if (isAlgorithmChoiceQuestion(question)) {
    return shuffleArray(question.interaction.options.map((option) => ({ id: option.id, text: option.text })));
  }

  if (isAlgorithmOrderingQuestion(question)) {
    return shuffleArray(
      question.interaction.elements.map((element) => ({
        id: element.id,
        text: element.text,
      })),
    );
  }

  if (isAlgorithmComplexityQuestion(question)) {
    return [];
  }

  return assertUnreachableQuestion(question);
}

function assertUnreachableQuestion(question: never): never {
  throw new Error(`Unsupported Algorithms question interaction: ${JSON.stringify(question)}`);
}
