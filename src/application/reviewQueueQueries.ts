import {
  getTrackDisplay,
  type EvidenceRef,
  REVIEW_REASONS,
  type ReviewQueueEntry,
  type TrackId,
} from "../domain";
import { getReviewQueueItems, getUnavailableReviewRecords, removeUnavailableReviewEntry, type ContentIdentityUnavailableReviewRecord } from "../storage/repositories";
import type { StorageIssue } from "../storage/repositories/result";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";

export type ReviewQueueViewItem = { dueAt: string; id: string; isDue: boolean; isOverdue: boolean; kind: "available" | "unavailable"; questionId: string; mistakeTypeRefs: EvidenceRef[]; prompt?: string; reasons: ReviewQueueEntry["reasons"] extends readonly (infer Reason)[] ? Reason[] : never[]; sourceAttemptId: string; taxonomyRefs: EvidenceRef[]; unavailableReason?: string };
export type ReviewQueueViewModel = { degraded: boolean; dueItems: ReviewQueueViewItem[]; issues: StorageIssue[]; ok: boolean; overdueItems: ReviewQueueViewItem[]; totalItems: number; trackTitle: string; unavailableItems: ReviewQueueViewItem[]; upcomingItems: ReviewQueueViewItem[] };

export async function loadTrackReviewQueueViewModel(input: { now?: string; trackId: TrackId }): Promise<ReviewQueueViewModel> {
  const [result, unavailableResult] = await Promise.all([getReviewQueueItems(), getUnavailableReviewRecords()]);
  return buildTrackReviewQueueViewModel({
    issues: [...(result.issues ?? []), ...(unavailableResult.issues ?? [])],
    now: input.now,
    reviewQueueItems: result.value,
    trackId: input.trackId,
    unavailableReviewRecords: unavailableResult.value,
  });
}

export async function buildTrackReviewQueueViewModel(input: { issues?: readonly StorageIssue[]; now?: string; reviewQueueItems: readonly ReviewQueueEntry[]; trackId: TrackId; unavailableReviewRecords?: readonly ContentIdentityUnavailableReviewRecord[] }): Promise<ReviewQueueViewModel> {
  const now = input.now ?? new Date().toISOString();
  const items = (await Promise.all(input.reviewQueueItems.filter((entry) => entry.trackId === input.trackId).map((entry) => buildReviewViewItem(entry, now))))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id));
  const unavailableItems = (input.unavailableReviewRecords ?? [])
    .filter((record) => readString(record.review.trackId) === input.trackId)
    .map((record) => buildUnavailableReviewViewItem(record, now))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id));
  return { degraded: (input.issues ?? []).length > 0, dueItems: items.filter((item) => item.isDue), issues: [...(input.issues ?? [])], ok: (input.issues ?? []).length === 0, overdueItems: items.filter((item) => item.isOverdue), totalItems: items.length + unavailableItems.length, trackTitle: getTrackDisplay(input.trackId).title, unavailableItems, upcomingItems: items.filter((item) => !item.isDue) };
}

async function buildReviewViewItem(entry: ReviewQueueEntry, now: string): Promise<ReviewQueueViewItem> {
  return { dueAt: entry.dueAt, id: entry.id, isDue: entry.dueAt <= now, isOverdue: entry.dueAt < now, kind: "available", questionId: entry.sourceItem.questionId, mistakeTypeRefs: dedupeRefs(entry.taxonomyOrSkillRefs.filter((ref) => ref.axisId === "mistake_type")), prompt: await resolvePrompt(entry), reasons: [...entry.reasons], sourceAttemptId: entry.sourceAttemptId, taxonomyRefs: dedupeRefs(entry.taxonomyOrSkillRefs) };
}
async function resolvePrompt(entry: ReviewQueueEntry): Promise<string> {
  const item = await contentPackageRuntimeOwner.resolveItem(entry.sourceItem);
  return item.prompt;
}
function dedupeRefs(refs: readonly EvidenceRef[]): EvidenceRef[] { return [...new Map(refs.map((ref) => [`${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`, ref])).values()]; }

function buildUnavailableReviewViewItem(record: ContentIdentityUnavailableReviewRecord, _now: string): ReviewQueueViewItem {
  const review = record.review;
  const sourceItem = isRecord(review.sourceItem) ? review.sourceItem : {};
  const reasons = Array.isArray(review.reasons) ? review.reasons.filter((reason): reason is ReviewQueueViewItem["reasons"][number] => typeof reason === "string" && REVIEW_REASONS.includes(reason as never)) : [];
  const taxonomyRefs = readEvidenceRefs(review.taxonomyOrSkillRefs);
  return {
    dueAt: readString(review.dueAt) ?? "",
    id: record.reviewId,
    isDue: false,
    isOverdue: false,
    kind: "unavailable",
    questionId: readString(sourceItem.questionId) ?? "",
    mistakeTypeRefs: taxonomyRefs.filter((ref) => ref.axisId === "mistake_type"),
    reasons,
    sourceAttemptId: readString(review.sourceAttemptId) ?? "",
    taxonomyRefs,
    unavailableReason: readString(sourceItem.reason) ?? "content_unavailable",
  };
}

export async function removeUnavailableReview(reviewId: string): Promise<void> {
  await removeUnavailableReviewEntry(reviewId);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readEvidenceRefs(value: unknown): EvidenceRef[] {
  if (!Array.isArray(value)) return [];
  return dedupeRefs(value.flatMap((candidate) => {
    if (!isRecord(candidate) || typeof candidate.axisId !== "string" || typeof candidate.nodeId !== "string") return [];
    return [{ axisId: candidate.axisId, nodeId: candidate.nodeId, ...(typeof candidate.role === "string" ? { role: candidate.role } : {}) }];
  }));
}
