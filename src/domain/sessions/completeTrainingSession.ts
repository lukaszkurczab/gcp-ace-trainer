import type { TrainingAttempt, TrainingAttemptResult, TrainingSession } from "../training";

export type TrainingSessionSummary = {
  answeredCount: number;
  correctCount: number;
  partialCount: number;
  reviewCandidateCount: number;
  totalItemCount: number;
};

export type CompletedTrainingSessionResult = {
  session: TrainingSession;
  summary: TrainingSessionSummary;
};

export type CompleteTrainingSessionInput = {
  attempts: readonly TrainingAttempt[];
  completedAt: string;
  session: TrainingSession;
};

export function completeTrainingSession(input: CompleteTrainingSessionInput): CompletedTrainingSessionResult {
  if (input.session.status !== "active") {
    throw new Error(`Cannot complete a ${input.session.status} training session.`);
  }

  const sessionAttempts = input.attempts.filter((attempt) => attempt.sessionId === input.session.id);

  return {
    session: {
      ...input.session,
      completedAt: input.completedAt,
      status: "completed",
    },
    summary: {
      answeredCount: sessionAttempts.length,
      correctCount: sessionAttempts.filter((attempt) => attempt.result && isCorrectResult(attempt.result)).length,
      partialCount: sessionAttempts.filter((attempt) => attempt.result?.kind === "partial_credit").length,
      reviewCandidateCount: sessionAttempts.filter((attempt) => attempt.result && isReviewCandidateResult(attempt.result)).length,
      totalItemCount: input.session.itemRefs.length,
    },
  };
}

function isCorrectResult(result: TrainingAttemptResult): boolean {
  if (result.kind === "correctness") {
    return result.isCorrect;
  }

  if (result.kind === "partial_credit") {
    return result.isCorrect === true || result.earnedPoints >= result.maxPoints;
  }

  if (result.kind === "mixed") {
    return result.isCorrect === true;
  }

  return false;
}

function isReviewCandidateResult(result: TrainingAttemptResult): boolean {
  if (result.kind === "correctness") {
    return !result.isCorrect;
  }

  if (result.kind === "partial_credit") {
    return result.earnedPoints < result.maxPoints;
  }

  if (result.kind === "strategy_quality") {
    return result.quality !== "strong";
  }

  if (result.kind === "mixed") {
    return result.isCorrect === false || result.components.some(isReviewCandidateResult);
  }

  return false;
}
