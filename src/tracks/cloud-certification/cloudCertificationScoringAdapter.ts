import { CLOUD_CERTIFICATION_TRACK_ID } from "../../domain";
import type {
  TrainingAttemptResponse,
  TrainingAttemptResult,
  TrainingItem,
} from "../../domain/training";
import { DEFAULT_QUESTION_BANK } from "../../features/questions/defaultQuestionBank";
import type { Question } from "../../types";
import { areOptionSetsEqual } from "../../utils";
import type { TrackScoringAdapter } from "../types";
import { isCloudCertificationTrainingItemType } from "./cloudCertificationContentAdapter";

export function createCloudCertificationScoringAdapter(
  questions: readonly Question[] = DEFAULT_QUESTION_BANK,
): TrackScoringAdapter {
  const questionsById = new Map(questions.map((question) => [question.id, question]));

  return {
    scoreAttempt: (
      item: TrainingItem,
      response: TrainingAttemptResponse,
    ): TrainingAttemptResult => scoreCloudCertificationAttempt(item, response, questionsById),
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

export function scoreCloudCertificationAttempt(
  item: TrainingItem,
  response: TrainingAttemptResponse,
  questionsById: ReadonlyMap<string, Question>,
): TrainingAttemptResult {
  if (!isCloudCertificationTrainingItemType(item.type)) {
    throw new Error(`Cloud Certification scoring does not support item type: ${item.type}`);
  }

  if (response.kind !== "option_selection") {
    throw new Error(`Cloud Certification scoring requires option_selection response: ${response.kind}`);
  }

  const question = questionsById.get(item.id);

  if (!question) {
    throw new Error(`Missing Cloud question for training item: ${item.id}`);
  }

  if (areOptionSetsEqual(response.selectedOptionIds, question.correctOptionIds)) {
    return {
      isCorrect: true,
      kind: "correctness",
    };
  }

  if (item.type === "multiple_choice_question") {
    const correctOptionIds = new Set(question.correctOptionIds);
    const earnedPoints = response.selectedOptionIds.filter((optionId) => correctOptionIds.has(optionId)).length;

    return {
      earnedPoints,
      isCorrect: false,
      kind: "partial_credit",
      maxPoints: question.correctOptionIds.length,
    };
  }

  return {
    isCorrect: false,
    kind: "correctness",
  };
}

export const cloudCertificationScoringAdapter = createCloudCertificationScoringAdapter();
