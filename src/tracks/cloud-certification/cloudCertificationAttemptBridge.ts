import { CLOUD_CERTIFICATION_TRACK_ID } from "../../domain";
import type {
  ReviewQueueItem,
  TrainingAttempt,
  TrainingAttemptConfidence,
  TrainingAttemptResult,
  TrainingItemTaxonomyRef,
  TrainingItemType,
} from "../../domain/training";
import type {
  AnswerRecord,
  AttemptSummary,
  Confidence,
  MistakeReason,
  PracticeAnswerRecord,
  Question,
} from "../../types";
import type { TrackReviewContext } from "../types";
import { cloudCertificationReviewAdapter } from "./cloudCertificationReviewAdapter";

export const CLOUD_PRACTICE_MODE_ID = "cloud-practice";
export const CLOUD_EXAM_SIMULATION_MODE_ID = "cloud-exam-simulation";

export function mapPracticeAnswerRecordToTrainingAttempt(record: PracticeAnswerRecord): TrainingAttempt {
  const question = record.questionSnapshot;
  const result = mapLegacyAnswerResult({
    correctOptionIds: record.correctOptionIds,
    isCorrect: record.isCorrect,
    question,
    selectedOptionIds: record.selectedOptionIds,
  });
  const confidence = mapCloudConfidenceToTrainingAttemptConfidence(record.confidence);
  const mistakeTypeRefs = record.mistakeReason
    ? [mapCloudMistakeReasonToTaxonomyRef(record.mistakeReason)]
    : undefined;

  return {
    answeredAt: record.answeredAt,
    confidence,
    feedbackSignals: buildFeedbackSignals(result),
    id: record.id,
    itemId: record.questionId,
    itemType: mapCloudQuestionTypeToTrainingItemType(question),
    mistakeTypeRefs,
    modeId: CLOUD_PRACTICE_MODE_ID,
    response: {
      kind: "option_selection",
      selectedOptionIds: record.selectedOptionIds,
    },
    result,
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

export function mapAttemptSummaryToTrainingAttempts(summary: AttemptSummary): TrainingAttempt[] {
  return summary.answers
    .filter((answer) => answer.isAnswered)
    .map((answer) => mapExamAnswerRecordToTrainingAttempt(summary, answer));
}

export function createCloudReviewQueueItemsFromTrainingAttempts(
  attempts: readonly TrainingAttempt[],
  context?: TrackReviewContext,
): ReviewQueueItem[] {
  return attempts.flatMap((attempt) =>
    cloudCertificationReviewAdapter.createReviewQueueItems(attempt, undefined, context),
  );
}

export function mapCloudQuestionTypeToTrainingItemType(question: Question): TrainingItemType {
  return question.type === "single" ? "single_choice_question" : "multiple_choice_question";
}

export function mapCloudConfidenceToTrainingAttemptConfidence(
  confidence: Confidence | undefined,
): TrainingAttemptConfidence | undefined {
  if (!confidence) {
    return undefined;
  }

  if (confidence === "sure") {
    return "high";
  }

  if (confidence === "guess") {
    return "low";
  }

  return "unsure";
}

export function mapCloudMistakeReasonToTaxonomyRef(reason: MistakeReason): TrainingItemTaxonomyRef {
  return {
    axisId: "cloud-mistake-type",
    nodeId: reason,
    role: "mistake_type",
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

function mapExamAnswerRecordToTrainingAttempt(summary: AttemptSummary, answer: AnswerRecord): TrainingAttempt {
  const result = mapLegacyAnswerResult({
    correctOptionIds: answer.correctOptionIds,
    isCorrect: answer.isCorrect,
    question: answer.questionSnapshot,
    selectedOptionIds: answer.selectedOptionIds,
  });
  const confidence = mapCloudConfidenceToTrainingAttemptConfidence(answer.confidence);
  const mistakeTypeRefs = answer.mistakeReason
    ? [mapCloudMistakeReasonToTaxonomyRef(answer.mistakeReason)]
    : undefined;

  return {
    answeredAt: answer.answeredAt || summary.completedAt || summary.startedAt,
    confidence,
    durationSeconds: answer.elapsedSeconds,
    feedbackSignals: buildFeedbackSignals(result),
    id: `attempt:${summary.id}:${answer.questionId}`,
    itemId: answer.questionId,
    itemType: mapCloudQuestionTypeToTrainingItemType(answer.questionSnapshot),
    mistakeTypeRefs,
    modeId: CLOUD_EXAM_SIMULATION_MODE_ID,
    response: {
      kind: "option_selection",
      selectedOptionIds: answer.selectedOptionIds,
    },
    result,
    sessionId: summary.id,
    trackId: CLOUD_CERTIFICATION_TRACK_ID,
  };
}

function mapLegacyAnswerResult(input: {
  correctOptionIds: readonly string[];
  isCorrect: boolean;
  question: Question;
  selectedOptionIds: readonly string[];
}): TrainingAttemptResult {
  if (input.isCorrect) {
    return {
      isCorrect: true,
      kind: "correctness",
    };
  }

  if (input.question.type === "multiple") {
    const correctOptionIds = new Set(input.correctOptionIds);
    const earnedPoints = input.selectedOptionIds.filter((optionId) => correctOptionIds.has(optionId)).length;

    return {
      earnedPoints,
      isCorrect: false,
      kind: "partial_credit",
      maxPoints: input.correctOptionIds.length,
    };
  }

  return {
    isCorrect: false,
    kind: "correctness",
  };
}

function buildFeedbackSignals(result: TrainingAttemptResult): TrainingAttempt["feedbackSignals"] {
  if (result.kind === "correctness") {
    return result.isCorrect ? ["correct"] : ["incorrect", "review_recommended"];
  }

  if (result.kind === "partial_credit") {
    return result.earnedPoints >= result.maxPoints ? ["correct"] : ["partially_correct", "review_recommended"];
  }

  return undefined;
}
