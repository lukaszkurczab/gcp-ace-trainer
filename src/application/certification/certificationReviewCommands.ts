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
import type { CertificationQuestion } from "../../tracks/certification";

export async function setQuestionNeedsReview(
  input: Readonly<{
    question: CertificationQuestion;
    sourceAttemptId?: string;
    sourceItem: ContentItemRef;
    sourceSessionId: string;
  }>,
  needsReview: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const { question, sourceItem, sourceSessionId } = input;
  if (sourceItem.trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID || sourceItem.itemId !== question.id || !sourceSessionId.trim()) {
    throw new Error("Certification review source does not match the reviewed answer identity.");
  }
  const exactQuestion = await contentPackageRuntimeOwner.resolveItem<CertificationQuestion>(sourceItem);
  if (exactQuestion.id !== question.id) throw new Error("Certification review question does not match its exact content package pin.");
  const existing = (await getReviewQueueItems()).value.find(
    (entry) => entry.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID &&
      entry.sourceItem.itemId === question.id &&
      entry.sourceItem.contentVersion === sourceItem.contentVersion &&
      contentPackagePinsEqual(entry.sourceItem.packagePin, sourceItem.packagePin),
  );
  if (!needsReview) {
    if (existing) await commitReviewEntryRemoval(existing, now);
    return;
  }
  const created = {
    id: `review:manual:${sourceItem.packagePin.packageIdentity}:${sourceItem.packagePin.packageVersion}:${sourceItem.packagePin.contentReleaseId}:${question.id}`,
    trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
    sourceAttemptId: input.sourceAttemptId ?? `manual-mark:${sourceSessionId}:${question.id}:${now}`,
    sourceSessionId,
    reasons: ["manual_mark"],
    dueAt: now,
    createdAt: now,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
    sourceItem,
    taxonomyOrSkillRefs: [{ axisId: "cloud-domain", nodeId: question.domain }],
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
    transitionId: `manual-review:${sourceItem.packagePin.packageIdentity}:${sourceItem.packagePin.packageVersion}:${sourceItem.packagePin.contentReleaseId}:${question.id}:${now}`,
    createdAt: now,
  });
}
