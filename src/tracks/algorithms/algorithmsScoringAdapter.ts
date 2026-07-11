import { ALGORITHMS_TRACK_ID } from "../../domain";
import type {
  TrainingAttemptResponse,
  TrainingAttemptResult,
} from "../../domain/training";
import type { TrackScoringAdapter } from "../types";
import {
  isAlgorithmChoiceQuestion,
  isAlgorithmComplexityQuestion,
  isAlgorithmOrderingQuestion,
  type AlgorithmQuestion,
} from "./algorithmQuestionTypes";

export type AlgorithmScoringStatus = "correct" | "partial" | "incorrect";

export type AlgorithmQuestionScore = {
  feedback: string;
  mistakeTypes: AlgorithmQuestion["feedbackModel"]["mistakeTypes"];
  result: TrainingAttemptResult;
  status: AlgorithmScoringStatus;
};

export function createAlgorithmsScoringAdapter(): TrackScoringAdapter<AlgorithmQuestion> {
  return {
    scoreAttempt: (question, response) => scoreAlgorithmQuestion(question, response).result,
    trackId: ALGORITHMS_TRACK_ID,
  };
}

export function scoreAlgorithmQuestion(
  question: AlgorithmQuestion,
  response: TrainingAttemptResponse,
): AlgorithmQuestionScore {
  const score = getQuestionPoints(question, response);
  const status = getStatus(score.earnedPoints, score.maxPoints);

  return {
    feedback: question.feedbackModel.mentalModelCorrection,
    mistakeTypes: status === "correct" ? [] : question.feedbackModel.mistakeTypes,
    result: toTrainingAttemptResult(status, score),
    status,
  };
}

export function getAlgorithmAttemptStatus(
  result: TrainingAttemptResult | undefined,
): AlgorithmScoringStatus | undefined {
  if (!result) {
    return undefined;
  }

  if (result.kind === "correctness") {
    return result.isCorrect ? "correct" : "incorrect";
  }

  if (result.kind === "partial_credit") {
    if (result.earnedPoints >= result.maxPoints) {
      return "correct";
    }

    return result.earnedPoints > 0 ? "partial" : "incorrect";
  }

  if (result.kind === "mixed") {
    if (result.isCorrect === true) {
      return "correct";
    }

    if (result.components.some((component) => getAlgorithmAttemptStatus(component) === "partial")) {
      return "partial";
    }

    return result.isCorrect === false ? "incorrect" : undefined;
  }

  return undefined;
}

function getQuestionPoints(
  question: AlgorithmQuestion,
  response: TrainingAttemptResponse,
): { earnedPoints: number; maxPoints: number } {
  if (isAlgorithmChoiceQuestion(question)) {
    if (response.kind !== "option_selection") {
      throw new Error(`Algorithms response kind mismatch for ${question.id}: expected option_selection.`);
    }

    const correctIds = new Set(
      question.options.filter((option) => option.isCorrect).map((option) => option.id),
    );
    const selectedIds = new Set(response.selectedOptionIds);
    const selectedCorrectCount = [...selectedIds].filter((id) => correctIds.has(id)).length;
    const selectedIncorrectCount = [...selectedIds].filter((id) => !correctIds.has(id)).length;
    const exact = selectedCorrectCount === correctIds.size && selectedIncorrectCount === 0;

    return {
      earnedPoints: exact ? correctIds.size : Math.max(0, selectedCorrectCount - selectedIncorrectCount),
      maxPoints: correctIds.size,
    };
  }

  if (isAlgorithmOrderingQuestion(question)) {
    if (response.kind !== "option_selection") {
      throw new Error(`Algorithms response kind mismatch for ${question.id}: expected option_selection.`);
    }

    return {
      earnedPoints: question.correctOrder.filter(
        (subgoalId, index) => response.selectedOptionIds[index] === subgoalId,
      ).length,
      maxPoints: question.correctOrder.length,
    };
  }

  if (isAlgorithmComplexityQuestion(question)) {
    if (response.kind !== "complexity_check") {
      throw new Error(`Algorithms response kind mismatch for ${question.id}: expected complexity_check.`);
    }

    return {
      earnedPoints:
        (response.selectedComplexityAnswer.time === question.correctComplexity.time ? 1 : 0) +
        (response.selectedComplexityAnswer.space === question.correctComplexity.space ? 1 : 0),
      maxPoints: 2,
    };
  }

  return assertUnreachableQuestion(question);
}

function getStatus(earnedPoints: number, maxPoints: number): AlgorithmScoringStatus {
  if (earnedPoints >= maxPoints) {
    return "correct";
  }

  return earnedPoints > 0 ? "partial" : "incorrect";
}

function toTrainingAttemptResult(
  status: AlgorithmScoringStatus,
  points: { earnedPoints: number; maxPoints: number },
): TrainingAttemptResult {
  if (status === "partial") {
    return {
      earnedPoints: points.earnedPoints,
      isCorrect: false,
      kind: "partial_credit",
      maxPoints: points.maxPoints,
    };
  }

  return {
    isCorrect: status === "correct",
    kind: "correctness",
  };
}

function assertUnreachableQuestion(question: never): never {
  throw new Error(`Unsupported Algorithms question interaction: ${JSON.stringify(question)}`);
}

export const algorithmsScoringAdapter = createAlgorithmsScoringAdapter();
