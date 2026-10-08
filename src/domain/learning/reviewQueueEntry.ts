import type { ReviewEvidence } from "./reviewEvidence";
import type { TrackId } from "./trackIdentity";
import { resolvedContentRefsEqual } from "./resolvedContentRef";

export const REVIEW_REASONS = [
  "incorrect", "partial", "hint_used", "wrong_pattern", "wrong_strategy", "complexity_error",
  "repeated_mistake", "scheduled_retrieval", "weak_taxonomy_area", "manual_mark",
] as const;

export type ReviewReason = (typeof REVIEW_REASONS)[number];

export const REVIEW_CYCLE_POLICY_VERSION = "bizq04-v1" as const;
export const REVIEW_CYCLE_STAGES = ["repair24", "repair7", "manual_requested", "retention7", "retention14", "retention28"] as const;
export type ReviewCycleStage = (typeof REVIEW_CYCLE_STAGES)[number];

export type ReviewSourceSnapshot = Readonly<{
  source: "due_queue" | "manual_request";
  reviewEntryId: string;
  sourceAttemptId: string;
  /** Present on automatic snapshots to bind either the exact overlay or its absence. */
  manualRequestId?: string;
  dueAt: string;
  policyVersion: string;
  stage: ReviewCycleStage | "legacy_active_unqualified";
}>;

export type ReviewQueueEntry = ReviewEvidence & Readonly<{
  id: string;
  trackId: TrackId;
  sourceAttemptId: string;
  sourceSessionId: string;
  reasons: readonly ReviewReason[];
  dueAt?: string;
  createdAt: string;
  consecutiveAfterDueSuccesses: number;
  persistent: boolean;
  lastReviewedAt?: string;
  policyVersion?: string;
  stage?: ReviewCycleStage;
  manualRequestId?: string;
  status?: "active" | "completed";
  completedAt?: string;
  completedByAttemptId?: string;
}>;

export function isActiveReviewQueueEntry(entry: ReviewQueueEntry): boolean {
  if (entry.status === "completed") return false;
  return entry.status === "active" || (entry.status === undefined && entry.dueAt !== undefined);
}

export function isLegacyUnqualifiedReviewEntry(entry: ReviewQueueEntry): boolean {
  return entry.status === undefined && entry.policyVersion === undefined && entry.stage === undefined &&
    entry.dueAt !== undefined && entry.consecutiveAfterDueSuccesses <= 1 &&
    ((entry.persistent && entry.reasons.length === 1 && (entry.reasons[0] === "incorrect" || entry.reasons[0] === "partial")) ||
      (entry.persistent && entry.reasons.length === 1 && entry.reasons[0] === "manual_mark") ||
      (entry.persistent && entry.reasons.length === 2 && entry.reasons.includes("manual_mark") && entry.reasons.some((reason) => reason === "incorrect" || reason === "partial" || reason === "scheduled_retrieval")) ||
      (!entry.persistent && entry.reasons.length === 2 && entry.reasons.includes("manual_mark") && entry.reasons.includes("scheduled_retrieval") && isManualRequestId(entry.manualRequestId)) ||
      (!entry.persistent && entry.reasons.length === 1 && entry.reasons[0] === "scheduled_retrieval"));
}

export function isManualRequestId(value: unknown): value is string {
  return typeof value === "string" && (/^manual:[a-f0-9]{64}$/u.test(value) || /^legacy-manual:[^:\r\n]+:[^:\r\n]+:[^:\r\n]+$/u.test(value));
}

export function manualRequestIdForEntry(entry: ReviewQueueEntry): string | undefined {
  if (isManualRequestId(entry.manualRequestId)) return entry.manualRequestId;
  if (!entry.reasons.includes("manual_mark") || !isKnownManualLegacyShape(entry)) return undefined;
  return `legacy-manual:${encodeURIComponent(entry.id)}:${encodeURIComponent(entry.sourceAttemptId)}:${encodeURIComponent(entry.dueAt ?? "")}`;
}

export function createReviewSourceSnapshot(entry: ReviewQueueEntry, source: ReviewSourceSnapshot["source"] = "due_queue", now?: string): ReviewSourceSnapshot {
  if (!isActiveReviewQueueEntry(entry) || !entry.dueAt) throw new Error("A review source snapshot requires an active entry with a due instant.");
  const legacy = entry.policyVersion === undefined && entry.stage === undefined;
  if (legacy && !isLegacyUnqualifiedReviewEntry(entry)) throw new Error("An unknown legacy review record is unavailable for due selection.");
  if (!legacy && (!entry.policyVersion || !entry.stage)) throw new Error("A review record has incomplete cycle provenance.");
  const manualRequestId = manualRequestIdForEntry(entry);
  if (source === "manual_request" && (!manualRequestId ||
    (now !== undefined && (!Number.isFinite(Date.parse(now)) || Date.parse(entry.dueAt) <= Date.parse(now))))) {
    throw new Error("A manual review source snapshot requires a valid future-due manual request.");
  }
  return Object.freeze({ source, reviewEntryId: entry.id, sourceAttemptId: entry.sourceAttemptId,
    ...(manualRequestId ? { manualRequestId } : {}), dueAt: entry.dueAt,
    policyVersion: entry.policyVersion ?? "legacy-unqualified", stage: entry.stage ?? "legacy_active_unqualified" });
}

function isKnownManualLegacyShape(entry: ReviewQueueEntry): boolean {
  if (entry.policyVersion === undefined && entry.stage === undefined && entry.status === undefined) return isLegacyUnqualifiedReviewEntry(entry);
  return entry.status === "active" && entry.stage === "manual_requested" && entry.policyVersion === REVIEW_CYCLE_POLICY_VERSION &&
    entry.persistent && entry.reasons.length === 1 && entry.reasons[0] === "manual_mark";
}

export function matchesReviewSourceSnapshot(snapshot: ReviewSourceSnapshot, entry: ReviewQueueEntry): boolean {
  try {
    const current = createReviewSourceSnapshot(entry, snapshot.source);
    return current.source === snapshot.source && current.reviewEntryId === snapshot.reviewEntryId && current.sourceAttemptId === snapshot.sourceAttemptId &&
      current.manualRequestId === snapshot.manualRequestId &&
      current.dueAt === snapshot.dueAt && current.policyVersion === snapshot.policyVersion && current.stage === snapshot.stage;
  } catch { return false; }
}

export function retainReviewQueueEntryIdentity(existing: ReviewQueueEntry, updated: ReviewQueueEntry): ReviewQueueEntry {
  if (existing.trackId !== updated.trackId || existing.sourceItem.trackId !== updated.sourceItem.trackId ||
    !resolvedContentRefsEqual(existing.sourceItem, updated.sourceItem)) {
    throw new Error("A review update must preserve its canonical resolved content identity.");
  }
  return {
    ...updated,
    id: existing.id,
    sourceAttemptId: existing.sourceAttemptId,
    sourceSessionId: existing.sourceSessionId,
    sourceItem: existing.sourceItem,
    taxonomyOrSkillRefs: existing.taxonomyOrSkillRefs,
    createdAt: existing.createdAt,
  };
}
