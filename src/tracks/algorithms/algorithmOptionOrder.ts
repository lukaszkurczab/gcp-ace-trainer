import { shuffleArray } from "../../utils";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "./algorithmQuestionTypes";

export type AlgorithmQuestionDisplayOption = {
  id: string;
  isCorrect?: boolean;
  text: string;
};

export function getShuffledAlgorithmQuestionOptions(
  question: AlgorithmQuestion,
): readonly AlgorithmQuestionDisplayOption[] {
  if (isAlgorithmChoiceQuestion(question)) {
    return shuffleArray(question.options);
  }

  if (isAlgorithmOrderingQuestion(question)) {
    return shuffleArray(
      question.subgoals.map((subgoal) => ({
        id: subgoal.id,
        text: subgoal.text,
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
