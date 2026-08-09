import {
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  type ReviewQueueEntry,
} from "../../domain";
import { getCertificationContentCatalog } from "../../content/catalogRepository";
import { getReviewQueueItems } from "../../storage/repositories";
import {
  commitReviewEntryChange,
  commitReviewEntryRemoval,
} from "../learningMutations";
import type { CertificationQuestion } from "../../tracks/certification";

export async function setQuestionNeedsReview(
  question: CertificationQuestion,
  needsReview: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const existing = (await getReviewQueueItems()).value.find(
    (entry) => entry.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID && entry.sourceItem.itemId === question.id,
  );
  if (!needsReview) {
    if (existing) await commitReviewEntryRemoval(existing, now);
    return;
  }
  const created = {
    id: `review:manual:${question.id}`,
    trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
    sourceAttemptId: `manual-mark:${question.id}:${now}`,
    sourceSessionId: `manual-mark:${question.id}`,
    reasons: ["manual_mark"],
    dueAt: now,
    createdAt: now,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
    sourceItem: getCertificationContentCatalog().toContentItemRef(question),
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
    transitionId: `manual-review:${question.id}:${now}`,
    createdAt: now,
  });
}
