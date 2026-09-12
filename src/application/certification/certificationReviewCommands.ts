import {
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  resolvedContentRefsEqual,
  type ResolvedContentRef,
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
    sourceItem: ResolvedContentRef;
    sourceSessionId: string;
  }>,
  needsReview: boolean,
): Promise<void> {
  const now = new Date().toISOString();
  const { question, sourceItem, sourceSessionId } = input;
  if (sourceItem.trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID || sourceItem.questionId !== question.questionId || !sourceSessionId.trim()) {
    throw new Error("Certification review source does not match the reviewed answer identity.");
  }
  const exactQuestion = await contentPackageRuntimeOwner.resolveItem(sourceItem);
  if (exactQuestion.questionId !== sourceItem.questionId) throw new Error("Certification review question does not match its exact content artifact.");
  const existing = (await getReviewQueueItems()).value.find(
    (entry) => entry.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID &&
      resolvedContentRefsEqual(entry.sourceItem, sourceItem),
  );
  if (!needsReview) {
    if (existing) await commitReviewEntryRemoval(existing, now);
    return;
  }
  const created = {
    id: `review:manual:${sourceItem.artifactSha256}:${sourceItem.questionId}`,
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
    transitionId: `manual-review:${sourceItem.artifactSha256}:${sourceItem.questionId}:${now}`,
    createdAt: now,
  });
}
