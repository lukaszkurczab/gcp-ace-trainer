import { createAttemptResult, type AttemptResult } from "../../domain/learning";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "./algorithmQuestionTypes";
import type { AlgorithmResponse } from "./domain";

export type AlgorithmScoringStatus = "correct" | "partial" | "incorrect";

export type AlgorithmQuestionScore = Readonly<{
  feedback: string;
  mistakeTypes: AlgorithmQuestion["feedbackModel"]["mistakeTypes"];
  result: AttemptResult;
  status: AlgorithmScoringStatus;
}>;

export function scoreAlgorithmQuestion(question: AlgorithmQuestion, response: AlgorithmResponse): AlgorithmQuestionScore {
  const points = scorePoints(question, response);
  const status: AlgorithmScoringStatus = points.earnedPoints === points.maxPoints
    ? "correct"
    : points.earnedPoints > 0 ? "partial" : "incorrect";
  return {
    feedback: question.feedbackModel.mentalModelCorrection,
    mistakeTypes: status === "correct" ? [] : question.feedbackModel.mistakeTypes,
    result: createAttemptResult({ kind: status, ...points }),
    status,
  };
}

export function getAlgorithmAttemptStatus(result: AttemptResult | undefined): AlgorithmScoringStatus | undefined {
  return result?.kind;
}

function scorePoints(question: AlgorithmQuestion, response: AlgorithmResponse): { earnedPoints: number; maxPoints: number } {
  if (isAlgorithmChoiceQuestion(question)) {
    if (response.kind !== "choice") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected choice.`);
    const correctIds = new Set(question.options.filter((option) => option.isCorrect).map((option) => option.id));
    const selectedIds = new Set(response.selectedOptionIds);
    const selectedCorrectCount = [...selectedIds].filter((id) => correctIds.has(id)).length;
    const selectedIncorrectCount = [...selectedIds].filter((id) => !correctIds.has(id)).length;
    const exact = selectedCorrectCount === correctIds.size && selectedIncorrectCount === 0;
    return { earnedPoints: exact ? correctIds.size : selectedIncorrectCount === 0 ? selectedCorrectCount : 0, maxPoints: correctIds.size };
  }
  if (isAlgorithmOrderingQuestion(question)) {
    if (response.kind !== "ordering") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected ordering.`);
    if (response.orderedSubgoalIds.length !== question.correctOrder.length || new Set(response.orderedSubgoalIds).size !== question.correctOrder.length || response.orderedSubgoalIds.some((id) => !question.correctOrder.includes(id))) {
      throw new Error(`Algorithms ordering response is invalid for ${question.id}.`);
    }
    const correctRelations = new Set(question.correctOrder.slice(0, -1).map((id, index) => `${id}->${question.correctOrder[index + 1]}`));
    const earnedPoints = response.orderedSubgoalIds.slice(0, -1).filter((id, index) => correctRelations.has(`${id}->${response.orderedSubgoalIds[index + 1]}`)).length;
    return { earnedPoints, maxPoints: question.correctOrder.length - 1 };
  }
  if (isAlgorithmComplexityQuestion(question)) {
    if (response.kind !== "complexity") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected complexity.`);
    return {
      earnedPoints: question.correctComplexity.dimensions.filter((dimension) => {
        const selected = response.selectedValuesByDimension[dimension.id];
        if (selected === undefined || ![...dimension.values, ...(dimension.acceptedAliases ?? [])].includes(selected)) {
          throw new Error(`Algorithms complexity response is invalid for ${question.id}:${dimension.id}.`);
        }
        return [...dimension.acceptedValues, ...(dimension.acceptedAliases ?? [])].includes(selected);
      }).length,
      maxPoints: question.correctComplexity.dimensions.length,
    };
  }
  throw new Error(`Unsupported Algorithms question interaction: ${JSON.stringify(question)}`);
}
