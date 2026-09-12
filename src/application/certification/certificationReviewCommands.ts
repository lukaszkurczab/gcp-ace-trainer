import {
  contentPackagePinsEqual,
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  type ContentItemRef,
  type ReviewQueueEntry,
} from "../../domain";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getReviewQueueItems } from "../../storage/repositories";
import {
  commitReviewEntryChange,
  commitReviewEntryRemoval,
} from "../learningMutations";
import type { Question } from "../../content/canonical";

export async function setQuestionNeedsReview(
  input: Readonly<{
    question: Question;
    sourceAttemptId?: string;
    sourceItem: ContentItemRef;
    sourceSessionId: string;
  }>,
  needsReview: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const { question, sourceItem, sourceSessionId } = input;
  if (sourceItem.trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID || sourceItem.itemId !== question.questionId || !sourceSessionId.trim()) {
    throw new Error("Certification review source does not match the reviewed answer identity.");
  }
  const exactQuestion = await contentPackageRuntimeOwner.resolveItem(sourceItem);
  if (exactQuestion.questionId !== question.questionId) throw new Error("Certification review question does not match its exact content package pin.");
  const existing = (await getReviewQueueItems()).value.find(
    (entry) => entry.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID &&
      entry.sourceItem.itemId === question.questionId &&
      entry.sourceItem.contentVersion === sourceItem.contentVersion &&
      contentPackagePinsEqual(entry.sourceItem.packagePin, sourceItem.packagePin),
  );
  if (!needsReview) {
    if (existing) await commitReviewEntryRemoval(existing, now);
    return;
  }
  const created = {
    id: `review:manual:${sourceItem.packagePin.packageIdentity}:${sourceItem.packagePin.packageVersion}:${sourceItem.packagePin.contentReleaseId}:${question.questionId}`,
    trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
    sourceAttemptId: input.sourceAttemptId ?? `manual-mark:${sourceSessionId}:${question.questionId}:${now}`,
    sourceSessionId,
    reasons: ["manual_mark"],
    dueAt: now,
    createdAt: now,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
    sourceItem,
    taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }],
  } satisfies ReviewQueueEntry;
  const record = existing
    ? {
      ...existing,
      reasons: [...new Set([...existing.reasons, "manual_mark" as const])],
      dueAt: now,
      consecutiveAfterDueSuccesses: 0,
      persistent: true,
    }
    : created;
  await commitReviewEntryChange({
    record,
    isUpdate: Boolean(existing),
    transitionId: `manual-review:${sourceItem.packagePin.packageIdentity}:${sourceItem.packagePin.packageVersion}:${sourceItem.packagePin.contentReleaseId}:${question.questionId}:${now}`,
    createdAt: now,
  });
}
