import { createAttemptResult, type AttemptResult } from "../../domain/learning";
import type { DesignQuestion } from "./designRuntimeCatalog";
import type { DesignResponse } from "./designTypes";

export function scoreDesignQuestion(question: DesignQuestion, response: DesignResponse): AttemptResult {
  if (question.interaction.type === "choice" && response.kind === "choice") {
    const accepted = new Set(question.interaction.acceptedOptionIds);
    const selected = new Set(response.selectedOptionIds);
    const correct = [...selected].filter((id) => accepted.has(id)).length;
    const wrong = [...selected].filter((id) => !accepted.has(id)).length;
    if (correct === accepted.size && wrong === 0) return createAttemptResult({ earnedPoints: accepted.size, kind: "correct", maxPoints: accepted.size });
    if (wrong === 0 && correct > 0) return createAttemptResult({ earnedPoints: correct, kind: "partial", maxPoints: accepted.size });
    return createAttemptResult({ earnedPoints: 0, kind: "incorrect", maxPoints: accepted.size });
  }
  if (question.interaction.type === "ordering" && response.kind === "ordering") {
    const expected = question.interaction.canonicalOrder;
    const submitted = response.orderedElementIds;
    const maxPoints = Math.max(1, expected.length - 1);
    const earnedPoints = expected.slice(0, -1).reduce((score, id, index) => score + (submitted[index] === id && submitted[index + 1] === expected[index + 1] ? 1 : 0), 0);
    return createAttemptResult({ earnedPoints, kind: earnedPoints === maxPoints ? "correct" : earnedPoints > 0 ? "partial" : "incorrect", maxPoints });
  }
  if (question.interaction.type === "decision_matrix" && response.kind === "decision_matrix") {
    const maxPoints = question.interaction.dimensions.length;
    const earnedPoints = question.interaction.dimensions.reduce((score, dimension) => score + (dimension.acceptedValueIds.includes(response.selectedValueIdsByDimension[dimension.dimensionId] ?? "") ? 1 : 0), 0);
    return createAttemptResult({ earnedPoints, kind: earnedPoints === maxPoints ? "correct" : earnedPoints > 0 ? "partial" : "incorrect", maxPoints });
  }
  throw new Error("Design response interaction does not match the question interaction.");
}
