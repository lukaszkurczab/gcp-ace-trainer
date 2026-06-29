import type { TrainingAttempt, TrainingItemTaxonomyRef } from "../../domain/training";
import { createCloudReviewQueueItemsFromTrainingAttempts } from "./cloudCertificationAttemptBridge";

export type CloudTrainingAttemptTaxonomyCount = {
  count: number;
  taxonomyRef: TrainingItemTaxonomyRef;
};

export type CloudTrainingAttemptSummary = {
  attemptsByTaxonomy: CloudTrainingAttemptTaxonomyCount[];
  correctCount: number;
  incorrectCount: number;
  partialCount: number;
  reviewCandidateCount: number;
  totalAttempts: number;
};

export function buildCloudTrainingAttemptSummary(
  attempts: readonly TrainingAttempt[],
): CloudTrainingAttemptSummary {
  return {
    attemptsByTaxonomy: buildAttemptsByTaxonomy(attempts),
    correctCount: attempts.filter(isCorrectAttempt).length,
    incorrectCount: attempts.filter(isIncorrectAttempt).length,
    partialCount: attempts.filter(isPartialAttempt).length,
    reviewCandidateCount: createCloudReviewQueueItemsFromTrainingAttempts(attempts).length,
    totalAttempts: attempts.length,
  };
}

function isCorrectAttempt(attempt: TrainingAttempt): boolean {
  const result = attempt.result;

  if (!result) {
    return false;
  }

  if (result.kind === "correctness") {
    return result.isCorrect;
  }

  if (result.kind === "partial_credit") {
    return result.earnedPoints >= result.maxPoints;
  }

  if (result.kind === "mixed") {
    return result.isCorrect === true;
  }

  return false;
}

function isIncorrectAttempt(attempt: TrainingAttempt): boolean {
  const result = attempt.result;

  if (!result) {
    return false;
  }

  if (result.kind === "correctness") {
    return !result.isCorrect;
  }

  if (result.kind === "mixed") {
    return result.isCorrect === false;
  }

  return false;
}

function isPartialAttempt(attempt: TrainingAttempt): boolean {
  const result = attempt.result;

  return result?.kind === "partial_credit" && result.earnedPoints < result.maxPoints;
}

function buildAttemptsByTaxonomy(attempts: readonly TrainingAttempt[]): CloudTrainingAttemptTaxonomyCount[] {
  const counts = new Map<string, CloudTrainingAttemptTaxonomyCount>();

  attempts.forEach((attempt) => {
    attempt.mistakeTypeRefs?.forEach((taxonomyRef) => {
      const key = buildTaxonomyKey(taxonomyRef);
      const current = counts.get(key);

      counts.set(key, {
        count: (current?.count ?? 0) + 1,
        taxonomyRef,
      });
    });
  });

  return [...counts.values()].sort(
    (left, right) =>
      right.count - left.count ||
      buildTaxonomyKey(left.taxonomyRef).localeCompare(buildTaxonomyKey(right.taxonomyRef)),
  );
}

function buildTaxonomyKey(ref: TrainingItemTaxonomyRef): string {
  return `${ref.trackId ?? ""}:${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`;
}
