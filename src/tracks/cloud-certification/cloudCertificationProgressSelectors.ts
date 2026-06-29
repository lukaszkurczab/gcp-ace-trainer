import { CLOUD_CERTIFICATION_TRACK_ID } from "../../domain";
import type {
  ReviewQueueItem,
  TrainingAttempt,
  TrainingAttemptResult,
  TrainingItemTaxonomyRef,
} from "../../domain/training";
import { getReviewQueueItems, getTrainingAttempts } from "../../storage/repositories";
import { type LocalStorageIssue } from "../../storage/storageCodec";
import type { TrackContentAdapter } from "../types";
import {
  cloudCertificationContentAdapter,
} from "./cloudCertificationContentAdapter";

const DEFAULT_RECENT_ATTEMPT_COUNT = 10;

export type CloudCertificationAccuracySummary = {
  correct: number;
  percent: number;
  total: number;
};

export type CloudCertificationRecentAccuracySummary = CloudCertificationAccuracySummary & {
  windowAttemptCount: number;
};

export type CloudCertificationTaxonomyPerformance = {
  axisId: string;
  correctCount: number;
  incorrectCount: number;
  label: string;
  nodeId: string;
  partialCount: number;
  percent: number;
  taxonomyRef: TrainingItemTaxonomyRef;
  totalAttempts: number;
};

export type CloudCertificationMistakeTypeCount = {
  count: number;
  taxonomyRef: TrainingItemTaxonomyRef;
};

export type CloudCertificationProgressViewModel = {
  correctCount: number;
  degraded: boolean;
  dueReviewCount: number;
  examAttemptCount: number;
  firstAttemptAccuracy: CloudCertificationAccuracySummary;
  highPriorityReviewCount: number;
  incorrectCount: number;
  issues: LocalStorageIssue[];
  ok: boolean;
  partialCount: number;
  practiceAttemptCount: number;
  recentAccuracy: CloudCertificationRecentAccuracySummary;
  repeatedMistakeTypes: CloudCertificationMistakeTypeCount[];
  taxonomyPerformance: CloudCertificationTaxonomyPerformance[];
  totalAttempts: number;
  weakTaxonomyNodes: CloudCertificationTaxonomyPerformance[];
};

export type CloudCertificationProgressViewModelInput = {
  attempts: readonly TrainingAttempt[];
  contentAdapter?: TrackContentAdapter;
  issues?: readonly LocalStorageIssue[];
  now?: string;
  recentAttemptCount?: number;
  reviewQueueItems?: readonly ReviewQueueItem[];
};

export async function loadCloudCertificationProgressViewModel(
  input: {
    contentAdapter?: TrackContentAdapter;
    now?: string;
    recentAttemptCount?: number;
  } = {},
): Promise<CloudCertificationProgressViewModel> {
  const [attemptsResult, reviewQueueResult] = await Promise.all([
    getTrainingAttempts(),
    getReviewQueueItems(),
  ]);

  return buildCloudCertificationProgressViewModel({
    attempts: attemptsResult.value,
    contentAdapter: input.contentAdapter,
    issues: [...(attemptsResult.issues ?? []), ...(reviewQueueResult.issues ?? [])],
    now: input.now,
    recentAttemptCount: input.recentAttemptCount,
    reviewQueueItems: reviewQueueResult.value,
  });
}

export function buildCloudCertificationProgressViewModel(
  input: CloudCertificationProgressViewModelInput,
): CloudCertificationProgressViewModel {
  const attempts = input.attempts.filter((attempt) => attempt.trackId === CLOUD_CERTIFICATION_TRACK_ID);
  const reviewQueueItems = (input.reviewQueueItems ?? []).filter(
    (item) => item.trackId === CLOUD_CERTIFICATION_TRACK_ID,
  );
  const recentAttemptCount = input.recentAttemptCount ?? DEFAULT_RECENT_ATTEMPT_COUNT;
  const now = input.now ?? new Date().toISOString();
  const taxonomyPerformance = buildTaxonomyPerformance(
    attempts,
    input.contentAdapter ?? cloudCertificationContentAdapter,
  );

  return {
    correctCount: attempts.filter(isCorrectAttempt).length,
    degraded: (input.issues ?? []).length > 0,
    dueReviewCount: reviewQueueItems.filter((item) => isDue(item, now)).length,
    examAttemptCount: attempts.filter((attempt) => attempt.modeId === "cloud-exam-simulation").length,
    firstAttemptAccuracy: buildFirstAttemptAccuracy(attempts),
    highPriorityReviewCount: reviewQueueItems.filter(isHighPriority).length,
    incorrectCount: attempts.filter(isIncorrectAttempt).length,
    issues: [...(input.issues ?? [])],
    ok: (input.issues ?? []).length === 0,
    partialCount: attempts.filter(isPartialAttempt).length,
    practiceAttemptCount: attempts.filter((attempt) => attempt.modeId === "cloud-practice").length,
    recentAccuracy: buildRecentAccuracy(attempts, recentAttemptCount),
    repeatedMistakeTypes: buildRepeatedMistakeTypes(attempts),
    taxonomyPerformance,
    totalAttempts: attempts.length,
    weakTaxonomyNodes: taxonomyPerformance
      .filter((node) => node.totalAttempts > 0 && node.percent < 100)
      .slice(0, 8),
  };
}

function buildFirstAttemptAccuracy(attempts: readonly TrainingAttempt[]): CloudCertificationAccuracySummary {
  const firstAttempts = new Map<string, TrainingAttempt>();

  sortAttemptsAscending(attempts).forEach((attempt) => {
    if (!firstAttempts.has(attempt.itemId)) {
      firstAttempts.set(attempt.itemId, attempt);
    }
  });

  return buildAccuracySummary([...firstAttempts.values()]);
}

function buildRecentAccuracy(
  attempts: readonly TrainingAttempt[],
  windowAttemptCount: number,
): CloudCertificationRecentAccuracySummary {
  const recentAttempts = sortAttemptsDescending(attempts).slice(0, windowAttemptCount);
  const summary = buildAccuracySummary(recentAttempts);

  return {
    ...summary,
    windowAttemptCount,
  };
}

function buildAccuracySummary(attempts: readonly TrainingAttempt[]): CloudCertificationAccuracySummary {
  const scoredAttempts = attempts.filter(hasResult);
  const correct = scoredAttempts.filter(isCorrectAttempt).length;

  return {
    correct,
    percent: calculatePercent(correct, scoredAttempts.length),
    total: scoredAttempts.length,
  };
}

function buildTaxonomyPerformance(
  attempts: readonly TrainingAttempt[],
  contentAdapter: TrackContentAdapter,
): CloudCertificationTaxonomyPerformance[] {
  const counts = new Map<string, {
    correctCount: number;
    incorrectCount: number;
    partialCount: number;
    taxonomyRef: TrainingItemTaxonomyRef;
    totalAttempts: number;
  }>();

  attempts.forEach((attempt) => {
    const item = contentAdapter.getItemById(attempt.itemId);

    item?.taxonomyRefs.forEach((taxonomyRef) => {
      const key = buildTaxonomyKey(taxonomyRef);
      const current = counts.get(key) ?? {
        correctCount: 0,
        incorrectCount: 0,
        partialCount: 0,
        taxonomyRef,
        totalAttempts: 0,
      };

      counts.set(key, {
        correctCount: current.correctCount + (isCorrectAttempt(attempt) ? 1 : 0),
        incorrectCount: current.incorrectCount + (isIncorrectAttempt(attempt) ? 1 : 0),
        partialCount: current.partialCount + (isPartialAttempt(attempt) ? 1 : 0),
        taxonomyRef,
        totalAttempts: current.totalAttempts + 1,
      });
    });
  });

  return [...counts.values()]
    .map((score) => ({
      axisId: score.taxonomyRef.axisId,
      correctCount: score.correctCount,
      incorrectCount: score.incorrectCount,
      label: score.taxonomyRef.nodeId,
      nodeId: score.taxonomyRef.nodeId,
      partialCount: score.partialCount,
      percent: calculatePercent(score.correctCount, score.totalAttempts),
      taxonomyRef: score.taxonomyRef,
      totalAttempts: score.totalAttempts,
    }))
    .sort(
      (left, right) =>
        left.percent - right.percent ||
        right.totalAttempts - left.totalAttempts ||
        buildTaxonomyKey(left.taxonomyRef).localeCompare(buildTaxonomyKey(right.taxonomyRef)),
    );
}

function buildRepeatedMistakeTypes(
  attempts: readonly TrainingAttempt[],
): CloudCertificationMistakeTypeCount[] {
  const counts = new Map<string, CloudCertificationMistakeTypeCount>();

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

function hasResult(attempt: TrainingAttempt): boolean {
  return attempt.result !== undefined;
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

function isDue(item: ReviewQueueItem, now: string): boolean {
  return new Date(item.dueAt).getTime() <= new Date(now).getTime();
}

function isHighPriority(item: ReviewQueueItem): boolean {
  return item.priority === "high" || item.priority === "urgent";
}

function sortAttemptsAscending(attempts: readonly TrainingAttempt[]): TrainingAttempt[] {
  return [...attempts].sort((left, right) => left.answeredAt.localeCompare(right.answeredAt));
}

function sortAttemptsDescending(attempts: readonly TrainingAttempt[]): TrainingAttempt[] {
  return [...attempts].sort((left, right) => right.answeredAt.localeCompare(left.answeredAt));
}

function calculatePercent(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function buildTaxonomyKey(ref: TrainingItemTaxonomyRef): string {
  return `${ref.trackId ?? ""}:${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`;
}
