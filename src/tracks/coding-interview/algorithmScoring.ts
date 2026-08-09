import { createAttemptResult, type AttemptResult } from "../../domain/learning";
import { isAlgorithmChoiceQuestion, isAlgorithmComplexityQuestion, isAlgorithmOrderingQuestion, type AlgorithmQuestion } from "./algorithmQuestionTypes";
import type { AlgorithmResponse } from "./domain";

export type AlgorithmScoringStatus = "correct" | "partial" | "incorrect";
export type AlgorithmQuestionScore = Readonly<{
  diagnostics: Readonly<{ brokenOrderingRelations: readonly string[]; incorrectComplexityDimensionIds: readonly string[]; omittedCorrectOptionIds: readonly string[]; selectedWrongOptionIds: readonly string[] }>;
  mistakeTypes: readonly string[];
  result: AttemptResult;
  status: AlgorithmScoringStatus;
}>;
const emptyDiagnostics = () => Object.freeze({ brokenOrderingRelations: Object.freeze([]), incorrectComplexityDimensionIds: Object.freeze([]), omittedCorrectOptionIds: Object.freeze([]), selectedWrongOptionIds: Object.freeze([]) });

export function scoreAlgorithmQuestion(question: AlgorithmQuestion, response: AlgorithmResponse): AlgorithmQuestionScore {
  const { diagnostics, points } = scorePoints(question, response);
  const status: AlgorithmScoringStatus = points.earnedPoints === points.maxPoints ? "correct" : points.earnedPoints > 0 ? "partial" : "incorrect";
  return Object.freeze({ diagnostics, mistakeTypes: Object.freeze([]), result: createAttemptResult({ kind: status, ...points }), status });
}
export function getAlgorithmAttemptStatus(result: AttemptResult | undefined): AlgorithmScoringStatus | undefined { return result?.kind; }

function scorePoints(question: AlgorithmQuestion, response: AlgorithmResponse): Readonly<{ diagnostics: AlgorithmQuestionScore["diagnostics"]; points: { earnedPoints: number; maxPoints: number } }> {
  if (isAlgorithmChoiceQuestion(question)) {
    if (response.kind !== "choice") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected choice.`);
    const { acceptedOptionIds, options, selectionMode } = question.interaction;
    if (new Set(response.selectedOptionIds).size !== response.selectedOptionIds.length || response.selectedOptionIds.some((id) => !options.some((option) => option.id === id))) throw new Error(`Algorithms choice response is invalid for ${question.id}.`);
    const accepted = new Set(acceptedOptionIds); const selected = new Set(response.selectedOptionIds); const wrong = [...selected].filter((id) => !accepted.has(id)); const omitted = [...accepted].filter((id) => !selected.has(id));
    const exact = wrong.length === 0 && omitted.length === 0;
    const partial = selectionMode === "multiple" && wrong.length === 0 && selected.size > 0 && selected.size < accepted.size;
    return Object.freeze({ diagnostics: Object.freeze({ ...emptyDiagnostics(), omittedCorrectOptionIds: Object.freeze(omitted), selectedWrongOptionIds: Object.freeze(wrong) }), points: { earnedPoints: exact ? accepted.size : partial ? selected.size : 0, maxPoints: accepted.size } });
  }
  if (isAlgorithmOrderingQuestion(question)) {
    if (response.kind !== "ordering") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected ordering.`);
    const order = question.interaction.canonicalOrder;
    if (response.orderedSubgoalIds.length !== order.length || new Set(response.orderedSubgoalIds).size !== order.length || response.orderedSubgoalIds.some((id) => !order.includes(id))) throw new Error(`Algorithms ordering response is invalid for ${question.id}.`);
    const relations = new Set(order.slice(0, -1).map((id, index) => `${id}->${order[index + 1]}`)); const actual = response.orderedSubgoalIds.slice(0, -1).map((id, index) => `${id}->${response.orderedSubgoalIds[index + 1]}`); const earnedPoints = actual.filter((relation) => relations.has(relation)).length;
    return Object.freeze({ diagnostics: Object.freeze({ ...emptyDiagnostics(), brokenOrderingRelations: Object.freeze([...relations].filter((relation) => !actual.includes(relation))) }), points: { earnedPoints, maxPoints: question.scoringContract.maxPoints } });
  }
  if (isAlgorithmComplexityQuestion(question)) {
    if (response.kind !== "complexity") throw new Error(`Algorithms response kind mismatch for ${question.id}: expected complexity.`);
    const interaction = question.interaction; const dimensions = new Set(interaction.checkedDimensions);
    if (Object.keys(response.selectedValuesByDimension).some((id) => !dimensions.has(id))) throw new Error(`Algorithms complexity response is invalid for ${question.id}: unknown dimension.`);
    const incorrect: string[] = []; const earnedPoints = interaction.checkedDimensions.filter((dimension) => {
      const selected = response.selectedValuesByDimension[dimension];
      if (!selected) throw new Error(`Algorithms complexity response is invalid for ${question.id}:${dimension}.`);
      const legal = interaction.availableValuesByDimension[dimension] ?? [];
      const normalized = interaction.normalizedAliasesByDimension[dimension]?.[selected] ?? selected;
      if (!legal.includes(normalized)) throw new Error(`Algorithms complexity response is invalid for ${question.id}:${dimension}.`);
      const correct = interaction.acceptedValuesByDimension[dimension]?.includes(normalized) ?? false; if (!correct) incorrect.push(dimension); return correct;
    }).length;
    return Object.freeze({ diagnostics: Object.freeze({ ...emptyDiagnostics(), incorrectComplexityDimensionIds: Object.freeze(incorrect) }), points: { earnedPoints, maxPoints: question.scoringContract.maxPoints } });
  }
  throw new Error("Unsupported Algorithms interaction.");
}
