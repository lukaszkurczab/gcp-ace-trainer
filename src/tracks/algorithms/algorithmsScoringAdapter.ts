import { ALGORITHMS_TRACK_ID } from "../../domain";
import type {
  ComplexityAnswer,
  TrainingAttemptResponse,
  TrainingAttemptResult,
  TrainingItem,
} from "../../domain/training";
import type { TrackScoringAdapter } from "../types";

export type AlgorithmsAnswerKey = Readonly<Record<string, AlgorithmsExpectedAnswer>>;

export type AlgorithmsExpectedAnswer =
  | {
      expectedPatternId: string;
      kind: "pattern_selection";
    }
  | {
      expectedStrategyId: string;
      kind: "strategy_selection";
    }
  | {
      expectedComplexityAnswer: ComplexityAnswer;
      kind: "complexity_analysis";
    }
  | {
      expectedSolutionId: string;
      kind: "solution_comparison";
    };

export function createAlgorithmsScoringAdapter(
  answerKey: AlgorithmsAnswerKey = {},
): TrackScoringAdapter {
  return {
    scoreAttempt: (
      item: TrainingItem,
      response: TrainingAttemptResponse,
    ): TrainingAttemptResult => scoreAlgorithmsAttempt(item, response, answerKey),
    trackId: ALGORITHMS_TRACK_ID,
  };
}

export function scoreAlgorithmsAttempt(
  item: TrainingItem,
  response: TrainingAttemptResponse,
  answerKey: AlgorithmsAnswerKey,
): TrainingAttemptResult {
  const expected = answerKey[item.id];

  if (!expected) {
    throw new Error(`Missing Algorithms scoring metadata for training item: ${item.id}`);
  }

  if (expected.kind !== response.kind) {
    throw new Error(`Algorithms response kind mismatch for ${item.id}: expected ${expected.kind}, got ${response.kind}`);
  }

  if (expected.kind === "pattern_selection" && response.kind === "pattern_selection") {
    return {
      isCorrect: response.selectedPatternId === expected.expectedPatternId,
      kind: "correctness",
    };
  }

  if (expected.kind === "strategy_selection" && response.kind === "strategy_selection") {
    const isStrong = response.selectedStrategyId === expected.expectedStrategyId;

    return {
      kind: "strategy_quality",
      quality: isStrong ? "strong" : "weak",
      score: isStrong ? 1 : 0,
    };
  }

  if (expected.kind === "complexity_analysis" && response.kind === "complexity_analysis") {
    const earnedPoints = countMatchingComplexityDimensions(
      response.selectedComplexityAnswer,
      expected.expectedComplexityAnswer,
    );
    const maxPoints = countExpectedComplexityDimensions(expected.expectedComplexityAnswer);

    return {
      earnedPoints,
      isCorrect: earnedPoints === maxPoints,
      kind: "partial_credit",
      maxPoints,
    };
  }

  if (expected.kind === "solution_comparison" && response.kind === "solution_comparison") {
    return {
      isCorrect: response.selectedSolutionId === expected.expectedSolutionId,
      kind: "correctness",
    };
  }

  throw new Error(`Algorithms scoring does not support item type: ${item.type}`);
}

function countMatchingComplexityDimensions(selected: ComplexityAnswer, expected: ComplexityAnswer): number {
  return (["time", "space"] as const).filter((dimension) => {
    const expectedValue = expected[dimension];
    return expectedValue !== undefined && selected[dimension] === expectedValue;
  }).length;
}

function countExpectedComplexityDimensions(expected: ComplexityAnswer): number {
  const count = (["time", "space"] as const).filter((dimension) => expected[dimension] !== undefined).length;
  return Math.max(count, 1);
}

export const algorithmsScoringAdapter = createAlgorithmsScoringAdapter();
