import { REVIEW_CYCLE_POLICY_VERSION, isLegacyUnqualifiedReviewEntry, manualRequestIdForEntry, retainReviewQueueEntryIdentity, type ReviewCycleStage, type ReviewQueueEntry } from "./reviewQueueEntry";
import type { TrainingAttempt } from "./trainingAttempt";

/** The shared BIZQ-04 transition contract. Families decide eligibility and when to invoke it. */
export function createOrUpdateErrorCycle(existing: ReviewQueueEntry | undefined, attempt: TrainingAttempt<unknown>, consumeMatchedManualIntent = false): ReviewQueueEntry {
  const errorReason = attempt.result.kind === "partial" ? "partial" : "incorrect";
  const fields = { dueAt: addDaysIso(attempt.answeredAt, 1), lastReviewedAt: attempt.answeredAt, persistent: true,
    reasons: [errorReason] as readonly ("incorrect" | "partial" | "manual_mark")[], consecutiveAfterDueSuccesses: 0,
    policyVersion: REVIEW_CYCLE_POLICY_VERSION, stage: "repair24" as const, status: "active" as const };
  if (existing) {
    const preserveManualIntent = existing.reasons.includes("manual_mark") && !consumeMatchedManualIntent;
    const manualRequestId = preserveManualIntent ? manualRequestIdForEntry(existing) : undefined;
    if (preserveManualIntent && !manualRequestId) throw new Error("An unbound manual review request cannot be carried into a new repair cycle.");
    const reasons = preserveManualIntent ? [errorReason, "manual_mark"] as const : [errorReason] as const;
    const { manualRequestId: _previousManualRequestId, ...withoutManualRequestId } = existing;
    return retainReviewQueueEntryIdentity(existing, { ...withoutManualRequestId, ...fields, reasons,
      ...(manualRequestId ? { manualRequestId } : {}) });
  }
  return { id: `review:${attempt.id}`, trackId: attempt.trackId, sourceAttemptId: attempt.id, sourceSessionId: attempt.sessionId,
    sourceItem: attempt.item, taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs, createdAt: attempt.answeredAt, ...fields };
}

export function createMaintenanceCycle(attempt: TrainingAttempt<unknown>): ReviewQueueEntry {
  return { id: `review:${attempt.id}`, trackId: attempt.trackId, sourceAttemptId: attempt.id, sourceSessionId: attempt.sessionId,
    sourceItem: attempt.item, taxonomyOrSkillRefs: attempt.reviewEvidence.taxonomyOrSkillRefs, reasons: ["scheduled_retrieval"],
    dueAt: addDaysIso(attempt.answeredAt, 7), createdAt: attempt.answeredAt, consecutiveAfterDueSuccesses: 0, persistent: false,
    policyVersion: REVIEW_CYCLE_POLICY_VERSION, stage: "retention7", status: "active" };
}

export function transitionQualifiedSuccess(existing: ReviewQueueEntry, attempt: TrainingAttempt<unknown>): ReviewQueueEntry {
  if (!existing.dueAt || Date.parse(attempt.answeredAt) < Date.parse(existing.dueAt)) throw new Error("A review cycle can advance only after its due instant.");
  let stage: ReviewCycleStage;
  let intervalDays: number;
  let persistent = false;
  let reasons: ReviewQueueEntry["reasons"] = ["scheduled_retrieval"];
  let successes = 0;
  if (isLegacyUnqualifiedReviewEntry(existing)) {
    if (existing.persistent && existing.reasons.some((reason) => reason === "incorrect" || reason === "partial")) { stage = "repair7"; intervalDays = 7; persistent = true; reasons = existing.reasons.filter((reason) => reason !== "manual_mark"); successes = 1; }
    else if (existing.persistent) { stage = "retention7"; intervalDays = 7; }
    else { stage = "retention14"; intervalDays = 14; }
  } else {
    switch (existing.stage) {
      case "repair24": stage = "repair7"; intervalDays = 7; persistent = true; reasons = existing.reasons.filter((reason) => reason !== "manual_mark"); successes = 1; break;
      case "repair7": stage = "retention14"; intervalDays = 14; break;
      case "manual_requested": stage = "retention7"; intervalDays = 7; break;
      case "retention7": stage = "retention14"; intervalDays = 14; break;
      case "retention14": stage = "retention28"; intervalDays = 28; break;
      case "retention28": {
        const { dueAt: _dueAt, ...withoutDue } = existing;
        const { manualRequestId: _manualRequestId, ...withoutManualRequestId } = withoutDue;
        return retainReviewQueueEntryIdentity(existing, { ...withoutManualRequestId, policyVersion: REVIEW_CYCLE_POLICY_VERSION, stage: "retention28", status: "completed",
          completedAt: attempt.answeredAt, completedByAttemptId: attempt.id, lastReviewedAt: attempt.answeredAt,
          reasons: ["scheduled_retrieval"], persistent: false, consecutiveAfterDueSuccesses: 0 });
      }
      default: throw new Error("An unknown legacy review record cannot receive qualified credit.");
    }
  }
  const { manualRequestId: _manualRequestId, ...withoutManualRequestId } = existing;
  return retainReviewQueueEntryIdentity(existing, { ...withoutManualRequestId, dueAt: addDaysIso(attempt.answeredAt, intervalDays), lastReviewedAt: attempt.answeredAt,
    policyVersion: REVIEW_CYCLE_POLICY_VERSION, stage, status: "active", persistent, reasons, consecutiveAfterDueSuccesses: successes });
}

export function consumeManualRequest(existing: ReviewQueueEntry): ReviewQueueEntry {
  if (!existing.reasons.includes("manual_mark") || !manualRequestIdForEntry(existing)) throw new Error("A matched manual request is unavailable.");
  const reasons = existing.reasons.filter((reason) => reason !== "manual_mark");
  if (!reasons.length) throw new Error("A manual request cannot consume its only active review reason before its due time.");
  const { manualRequestId: _manualRequestId, ...withoutManualRequestId } = existing;
  return retainReviewQueueEntryIdentity(existing, { ...withoutManualRequestId, reasons });
}

function addDaysIso(value: string, days: number): string { const date = new Date(value); date.setUTCDate(date.getUTCDate() + days); return date.toISOString(); }
