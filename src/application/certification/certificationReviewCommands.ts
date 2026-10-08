import {
  GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
  isActiveReviewQueueEntry,
  retainReviewQueueEntryIdentity,
  resolvedContentRefsEqual,
  type ReviewQueueEntry,
} from "../../domain";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { getReviewQueueSnapshot } from "../../storage/repositories/reviewQueueRepository";
import { captureProfileReadFence } from "../profileReadFence";
import { commitReviewEntryChange } from "../learningMutations";
import { createIdentityFingerprint } from "../learningMutations/identity";
import { createIdentityNonce } from "../../infrastructure/identity/identityNonce";

export async function setQuestionNeedsReview(
  input: Readonly<{
    sourceAttemptId?: string;
    sourceItem: ReviewQueueEntry["sourceItem"];
    sourceSessionId: string;
  }>,
  needsReview: boolean,
): Promise<void> {
  const assertCurrentProfile = captureProfileReadFence();
  const now = new Date().toISOString();
  const { sourceItem, sourceSessionId } = input;
  if (sourceItem.trackId !== GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID || !sourceSessionId.trim()) {
    throw new Error("Certification review source does not match the reviewed answer identity.");
  }
  const exactQuestion = await contentPackageRuntimeOwner.resolveItem(sourceItem);
  assertCurrentProfile();
  if (exactQuestion.questionId !== sourceItem.questionId) {
    throw new Error("Certification review question does not match its exact content artifact.");
  }

  await commitReviewEntryChange(async () => {
    const snapshot = (await getReviewQueueSnapshot()).value;
    assertCurrentProfile();
    const existing = snapshot.entries.find((entry) => entry.trackId === GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID &&
      resolvedContentRefsEqual(entry.sourceItem, sourceItem) && isActiveReviewQueueEntry(entry));
    const expectedRevisionOverrides = (id: string) => [
      { target: `review:${id}`, revision: snapshot.revisions[id] ?? null },
      { target: "review_index", revision: snapshot.indexRevision },
    ];

    if (!needsReview) {
      if (!existing?.reasons.includes("manual_mark")) return null;
      const nonce = createIdentityNonce();
      const transitionId = `manual-review:${nonce}`;
      const reasons = existing.reasons.filter((reason) => reason !== "manual_mark");
      if (reasons.length === 0) {
        return { action: "delete", createdAt: now, record: existing, transitionId, expectedRevisionOverrides: expectedRevisionOverrides(existing.id) };
      }
      const legacyManualScheduled = existing.policyVersion === undefined && existing.stage === undefined &&
        existing.persistent && reasons.length === 1 && reasons[0] === "scheduled_retrieval";
      const record = retainReviewQueueEntryIdentity(existing, {
        ...existing,
        reasons,
        manualRequestId: undefined,
        ...(legacyManualScheduled ? { persistent: false } : {}),
      });
      const { manualRequestId: _removed, ...withoutManualRequestId } = record;
      return { action: "update", createdAt: now, record: withoutManualRequestId, transitionId, expectedRevisionOverrides: expectedRevisionOverrides(existing.id) };
    }

    if (existing) {
      if (existing.manualRequestId) return null;
      if (existing.reasons.includes("manual_mark") && !existing.persistent && existing.policyVersion === undefined && existing.stage === undefined) {
        throw new Error("An unknown historical manual review shape cannot be marked available.");
      }
      const nonce = createIdentityNonce();
      const manualRequestId = `manual:${await createIdentityFingerprint({ action: "manual-review-request", trackId: sourceItem.trackId,
        sourceItem, sourceAttemptId: input.sourceAttemptId ?? existing.sourceAttemptId, sourceSessionId, requestedAt: now, nonce })}`;
      const transitionId = `manual-review:${nonce}`;
      const record = retainReviewQueueEntryIdentity(existing, { ...existing, reasons: existing.reasons.includes("manual_mark") ? existing.reasons : [...existing.reasons, "manual_mark"], manualRequestId });
      return { action: "update", createdAt: now, record, transitionId, expectedRevisionOverrides: expectedRevisionOverrides(existing.id) };
    }

    const nonce = createIdentityNonce();
    const manualRequestId = `manual:${await createIdentityFingerprint({ action: "manual-review-request", trackId: sourceItem.trackId, sourceItem,
      sourceAttemptId: input.sourceAttemptId ?? `manual-mark:${sourceSessionId}:${exactQuestion.questionId}:${now}`, sourceSessionId, requestedAt: now, nonce })}`;
    const transitionId = `manual-review:${nonce}`;
    const id = `review:manual:${nonce}`;
    const record: ReviewQueueEntry = {
      id,
      trackId: GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID,
      sourceAttemptId: input.sourceAttemptId ?? `manual-mark:${sourceSessionId}:${exactQuestion.questionId}:${now}`,
      sourceSessionId,
      reasons: ["manual_mark"],
      dueAt: now,
      createdAt: now,
      consecutiveAfterDueSuccesses: 0,
      persistent: true,
      manualRequestId,
      sourceItem,
      taxonomyOrSkillRefs: [{ axisId: "node", nodeId: exactQuestion.nodeId, role: "primary" }],
      policyVersion: "bizq04-v1",
      stage: "manual_requested",
      status: "active",
    };
    return { action: "put", createdAt: now, record, transitionId, expectedRevisionOverrides: expectedRevisionOverrides(record.id) };
  }, assertCurrentProfile);
}
