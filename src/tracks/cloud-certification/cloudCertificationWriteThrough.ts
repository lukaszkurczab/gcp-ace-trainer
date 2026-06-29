import type { ReviewQueueItem, TrainingAttempt } from "../../domain/training";
import { addReviewQueueItems, addTrainingAttempt } from "../../storage/repositories";
import { recordStorageIssue } from "../../storage/localStorage";
import { getStorageErrorMessage, type LocalStorageIssue } from "../../storage/storageCodec";
import type { AttemptSummary, PracticeAnswerRecord } from "../../types";
import {
  createCloudReviewQueueItemsFromTrainingAttempts,
  mapAttemptSummaryToTrainingAttempts,
  mapPracticeAnswerRecordToTrainingAttempt,
} from "./cloudCertificationAttemptBridge";

export type CloudCertificationWriteThroughResult = {
  attemptsWritten: number;
  issues: LocalStorageIssue[];
  ok: boolean;
  reviewQueueItemsWritten: number;
};

export async function writeThroughPracticeAnswerRecord(
  record: PracticeAnswerRecord,
): Promise<CloudCertificationWriteThroughResult> {
  const attempt = mapPracticeAnswerRecordToTrainingAttempt(record);

  return writeThroughTrainingAttempts([attempt]);
}

export async function writeThroughAttemptSummary(
  summary: AttemptSummary,
): Promise<CloudCertificationWriteThroughResult> {
  return writeThroughTrainingAttempts(mapAttemptSummaryToTrainingAttempts(summary));
}

async function writeThroughTrainingAttempts(
  attempts: readonly TrainingAttempt[],
): Promise<CloudCertificationWriteThroughResult> {
  const issues: LocalStorageIssue[] = [];
  let attemptsWritten = 0;
  let reviewQueueItemsWritten = 0;

  try {
    for (const attempt of attempts) {
      const result = await addTrainingAttempt(attempt);
      issues.push(...(result.issues ?? []));

      if (result.ok) {
        attemptsWritten += 1;
      }
    }

    const reviewQueueItems = createCloudReviewQueueItemsFromTrainingAttempts(attempts);
    reviewQueueItemsWritten = await writeReviewQueueItems(reviewQueueItems, issues);
  } catch (error) {
    issues.push({
      key: "cloud-certification-write-through",
      message: getStorageErrorMessage(error),
      operation: "write",
    });
  }

  issues.forEach(recordStorageIssue);

  return {
    attemptsWritten,
    issues,
    ok: issues.length === 0,
    reviewQueueItemsWritten,
  };
}

async function writeReviewQueueItems(
  reviewQueueItems: readonly ReviewQueueItem[],
  issues: LocalStorageIssue[],
): Promise<number> {
  if (reviewQueueItems.length === 0) {
    return 0;
  }

  const result = await addReviewQueueItems([...reviewQueueItems]);
  issues.push(...(result.issues ?? []));

  return result.ok ? reviewQueueItems.length : 0;
}
