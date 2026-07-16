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
  diagnostics: Readonly<{
    brokenOrderingRelations: readonly string[];
    incorrectComplexityDimensionIds: readonly string[];
    omittedCorrectOptionIds: readonly string[];
    selectedWrongOptionIds: readonly string[];
  }>;
  mistakeTypes: AlgorithmQuestion["feedbackModel"]["mistakeTypes"];
  result: AttemptResult;
  status: AlgorithmScoringStatus;
}>;

export function scoreAlgorithmQuestion(question: AlgorithmQuestion, response: AlgorithmResponse): AlgorithmQuestionScore {
  const { diagnostics, points } = scorePoints(question, response);
  const status: AlgorithmScoringStatus = points.earnedPoints === points.maxPoints
    ? "correct"
    : points.earnedPoints > 0 ? "partial" : "incorrect";
  return {
    diagnostics,
    mistakeTypes: status === "correct" ? [] : question.feedbackModel.mistakeTypes,
    result: createAttemptResult({ kind: status, ...points }),
    status,
  };
}

export function getAlgorithmAttemptStatus(result: AttemptResult | undefined): AlgorithmScoringStatus | undefined {
  return result?.kind;
}

function scorePoints(question: AlgorithmQuestion, response: AlgorithmResponse): Readonly<{
  diagnostics: AlgorithmQuestionScore["diagnostics"];
  points: { earnedPoints: number; maxPoints: number };
}> {
  const emptyDiagnostics = (): AlgorithmQuestionScore["diagnostics"] => Object.freeze({
    brokenOrderingRelations: Object.freeze([]),
    incorrectComplexityDimensionIds: Object.freeze([]),
    omittedCorrectOptionIds: Object.freeze([]),
    selectedWrongOptionIds: Object.freeze([]),
  });
  if (isAlgorithmChoiceQuestion(question)) {
    if (response.kind !== "choice") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected choice.`);
    const correctIds = new Set(question.options.filter((option) => option.isCorrect).map((option) => option.id));
    const availableIds = new Set(question.options.map((option) => option.id));
    if (new Set(response.selectedOptionIds).size !== response.selectedOptionIds.length || response.selectedOptionIds.some((id) => !availableIds.has(id))) {
      throw new Error(`Algorithms choice response is invalid for ${question.id}.`);
    }
    const selectedIds = new Set(response.selectedOptionIds);
    const omittedCorrectOptionIds = [...correctIds].filter((id) => !selectedIds.has(id));
    const selectedWrongOptionIds = [...selectedIds].filter((id) => !correctIds.has(id));
    const selectedCorrectCount = selectedIds.size - selectedWrongOptionIds.length;
    const selectedIncorrectCount = selectedWrongOptionIds.length;
    const exact = selectedCorrectCount === correctIds.size && selectedIncorrectCount === 0;
    return Object.freeze({ diagnostics: Object.freeze({ ...emptyDiagnostics(), omittedCorrectOptionIds: Object.freeze(omittedCorrectOptionIds), selectedWrongOptionIds: Object.freeze(selectedWrongOptionIds) }), points: { earnedPoints: exact ? correctIds.size : selectedIncorrectCount === 0 ? selectedCorrectCount : 0, maxPoints: correctIds.size } });
  }
  if (isAlgorithmOrderingQuestion(question)) {
    if (response.kind !== "ordering") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected ordering.`);
    if (response.orderedSubgoalIds.length !== question.correctOrder.length || new Set(response.orderedSubgoalIds).size !== question.correctOrder.length || response.orderedSubgoalIds.some((id) => !question.correctOrder.includes(id))) {
      throw new Error(`Algorithms ordering response is invalid for ${question.id}.`);
    }
    const correctRelations = new Set(question.correctOrder.slice(0, -1).map((id, index) => `${id}->${question.correctOrder[index + 1]}`));
    const earnedPoints = response.orderedSubgoalIds.slice(0, -1).filter((id, index) => correctRelations.has(`${id}->${response.orderedSubgoalIds[index + 1]}`)).length;
    const brokenOrderingRelations = [...correctRelations].filter((relation) => !response.orderedSubgoalIds.slice(0, -1).some((id, index) => relation === `${id}->${response.orderedSubgoalIds[index + 1]}`));
    return Object.freeze({ diagnostics: Object.freeze({ ...emptyDiagnostics(), brokenOrderingRelations: Object.freeze(brokenOrderingRelations) }), points: { earnedPoints, maxPoints: question.correctOrder.length - 1 } });
  }
  if (isAlgorithmComplexityQuestion(question)) {
    if (response.kind !== "complexity") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected complexity.`);
    const dimensionIds = new Set(question.correctComplexity.dimensions.map((dimension) => dimension.id));
    if (Object.keys(response.selectedValuesByDimension).some((dimensionId) => !dimensionIds.has(dimensionId))) {
      throw new Error(`Algorithms complexity response is invalid for ${question.id}: unknown dimension.`);
    }
    const incorrectComplexityDimensionIds: string[] = [];
    const earnedPoints = question.correctComplexity.dimensions.filter((dimension) => {
        const selected = response.selectedValuesByDimension[dimension.id];
        if (selected === undefined || ![...dimension.values, ...(dimension.acceptedAliases ?? [])].includes(selected)) {
          throw new Error(`Algorithms complexity response is invalid for ${question.id}:${dimension.id}.`);
        }
        const correct = [...dimension.acceptedValues, ...(dimension.acceptedAliases ?? [])].includes(selected);
        if (!correct) incorrectComplexityDimensionIds.push(dimension.id);
        return correct;
      }).length;
    return Object.freeze({ diagnostics: Object.freeze({ ...emptyDiagnostics(), incorrectComplexityDimensionIds: Object.freeze(incorrectComplexityDimensionIds) }), points: { earnedPoints, maxPoints: question.correctComplexity.maxPoints ?? question.correctComplexity.dimensions.length } });
  }
  throw new Error(`Unsupported Algorithms question interaction: ${JSON.stringify(question)}`);
}
