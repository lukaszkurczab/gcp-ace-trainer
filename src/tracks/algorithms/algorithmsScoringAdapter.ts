import { ALGORITHMS_TRACK_ID } from "../../domain";
import type {
  ComplexityAnswer,
  TrainingAttemptResponse,
  TrainingAttemptResult,
  TrainingItem,
} from "../../domain/training";
import type { TrackScoringAdapter } from "../types";
import type {
  AlgorithmComplexityPairAnswer,
  AlgorithmStaticMicroCheck,
  AlgorithmStaticMicroCheckAnswer,
  AlgorithmTrainingItem,
} from "./algorithmContentTypes";

export type AlgorithmScoringStatus = "correct" | "partial" | "incorrect";

export type AlgorithmSubmittedAnswer =
  | string
  | readonly string[]
  | {
      space?: string;
      time?: string;
    };

export type AlgorithmStaticCheckScore = {
  feedback: string;
  mistakeTypes: AlgorithmStaticMicroCheck["mistakeTypes"];
  result: TrainingAttemptResult;
  status: AlgorithmScoringStatus;
};

export function createAlgorithmsScoringAdapter(): TrackScoringAdapter {
  return {
    scoreAttempt: (
      item: TrainingItem,
      response: TrainingAttemptResponse,
    ): TrainingAttemptResult => scoreAlgorithmsAttempt(item, response),
    trackId: ALGORITHMS_TRACK_ID,
  };
}

export function scoreAlgorithmsAttempt(
  item: TrainingItem,
  response: TrainingAttemptResponse,
): TrainingAttemptResult {
  const algorithmItem = asAlgorithmTrainingItem(item);
  const check = getActiveAlgorithmStaticMicroCheck(algorithmItem);
  const answer = answerFromTrainingResponse(check, response);

  return scoreAlgorithmStaticMicroCheck(check, answer).result;
}

export function getActiveAlgorithmStaticMicroCheck(
  item: AlgorithmTrainingItem,
): AlgorithmStaticMicroCheck {
  const check = item.staticMicroChecks?.find((candidate) => candidate.status === "active");

  if (!check) {
    throw new Error(`Algorithms item has no active static micro-check: ${item.id}`);
  }

  return check;
}

export function scoreAlgorithmStaticMicroCheck(
  check: AlgorithmStaticMicroCheck,
  answer: AlgorithmSubmittedAnswer,
): AlgorithmStaticCheckScore {
  if (check.status !== "active") {
    throw new Error(`Cannot score disabled Algorithms micro-check: ${check.id}`);
  }

  const points = scoreStaticAnswer(check, answer);
  const status = getStatus(points.earnedPoints, points.maxPoints);

  return {
    feedback: check.feedback,
    mistakeTypes: status === "correct" ? [] : check.mistakeTypes,
    result: toTrainingAttemptResult(status, points),
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

function scoreStaticAnswer(
  check: AlgorithmStaticMicroCheck,
  answer: AlgorithmSubmittedAnswer,
): { earnedPoints: number; maxPoints: number } {
  if (check.type === "single_choice" || check.type === "select_pseudocode_line" || check.type === "trace_next_step") {
    assertStringAnswer(check.correctAnswer, check.id);
    return {
      earnedPoints: answer === check.correctAnswer ? 1 : 0,
      maxPoints: 1,
    };
  }

  if (check.type === "multi_select") {
    const expected = assertStringArrayAnswer(check.correctAnswer, check.id);
    const selected = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
    const expectedSet = new Set(expected);
    const selectedSet = new Set(selected);
    const matchedCount = [...selectedSet].filter((id) => expectedSet.has(id)).length;
    const exact = matchedCount === expectedSet.size && selectedSet.size === expectedSet.size;

    return {
      earnedPoints: exact ? expectedSet.size : matchedCount,
      maxPoints: expectedSet.size,
    };
  }

  if (check.type === "order_steps") {
    const expected = assertStringArrayAnswer(check.correctAnswer, check.id);
    const selected = Array.isArray(answer) ? answer : typeof answer === "string" ? [answer] : [];
    const positionMatches = expected.filter((id, index) => selected[index] === id).length;

    return {
      earnedPoints: positionMatches,
      maxPoints: expected.length,
    };
  }

  if (check.type === "complexity_pair") {
    const expected = assertComplexityPairAnswer(check.correctAnswer, check.id);
    const selected = isComplexityAnswer(answer) ? answer : {};

    return {
      earnedPoints: (selected.time === expected.time ? 1 : 0) + (selected.space === expected.space ? 1 : 0),
      maxPoints: 2,
    };
  }

  if (check.type === "fill_blank") {
    assertStringAnswer(check.correctAnswer, check.id);
    return {
      earnedPoints: answer === check.correctAnswer ? 1 : 0,
      maxPoints: 1,
    };
  }

  throw new Error(`Unsupported Algorithms micro-check type: ${check.type}`);
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

function answerFromTrainingResponse(
  check: AlgorithmStaticMicroCheck,
  response: TrainingAttemptResponse,
): AlgorithmSubmittedAnswer {
  if (check.type === "complexity_pair") {
    if (response.kind !== "complexity_analysis") {
      throw new Error(`Algorithms response kind mismatch for ${check.id}: expected complexity_analysis.`);
    }

    return response.selectedComplexityAnswer;
  }

  if (response.kind !== "option_selection") {
    throw new Error(`Algorithms response kind mismatch for ${check.id}: expected option_selection.`);
  }

  if (check.type === "single_choice" || check.type === "select_pseudocode_line" || check.type === "trace_next_step") {
    return response.selectedOptionIds[0] ?? "";
  }

  return response.selectedOptionIds;
}

function getStatus(earnedPoints: number, maxPoints: number): AlgorithmScoringStatus {
  if (earnedPoints >= maxPoints) {
    return "correct";
  }

  return earnedPoints > 0 ? "partial" : "incorrect";
}

function assertStringAnswer(
  value: AlgorithmStaticMicroCheckAnswer,
  checkId: string,
): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Algorithms micro-check ${checkId} requires a single static answer.`);
  }
}

function assertStringArrayAnswer(
  value: AlgorithmStaticMicroCheckAnswer,
  checkId: string,
): readonly string[] {
  if (!Array.isArray(value)) {
    throw new Error(`Algorithms micro-check ${checkId} requires an ordered static answer list.`);
  }

  return value;
}

function assertComplexityPairAnswer(
  value: AlgorithmStaticMicroCheckAnswer,
  checkId: string,
): AlgorithmComplexityPairAnswer {
  if (!isComplexityPairAnswer(value)) {
    throw new Error(`Algorithms micro-check ${checkId} requires a time and space answer.`);
  }

  return value;
}

function isComplexityPairAnswer(value: AlgorithmStaticMicroCheckAnswer): value is AlgorithmComplexityPairAnswer {
  return typeof value === "object" && !Array.isArray(value) && "time" in value && "space" in value;
}

function isComplexityAnswer(value: AlgorithmSubmittedAnswer): value is ComplexityAnswer {
  return typeof value === "object" && !Array.isArray(value);
}

function asAlgorithmTrainingItem(item: TrainingItem): AlgorithmTrainingItem {
  return item as unknown as AlgorithmTrainingItem;
}

export const algorithmsScoringAdapter = createAlgorithmsScoringAdapter();
