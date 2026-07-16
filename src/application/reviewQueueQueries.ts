import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDisplay,
  type EvidenceRef,
  type ReviewQueueEntry,
  type TrackId,
} from "../domain";
import { getReviewQueueItems } from "../storage/repositories";
import type { StorageIssue } from "../storage/repositories/result";
import { getAlgorithmContentCatalog, getCertificationContentCatalog } from "../content/catalogRepository";

export type ReviewQueueViewItem = { dueAt: string; id: string; isDue: boolean; isOverdue: boolean; itemId: string; mistakeTypeRefs: EvidenceRef[]; prompt: string; reasons: ReviewQueueEntry["reasons"] extends readonly (infer Reason)[] ? Reason[] : never[]; sourceAttemptId: string; taxonomyRefs: EvidenceRef[] };
export type ReviewQueueViewModel = { degraded: boolean; dueItems: ReviewQueueViewItem[]; issues: StorageIssue[]; ok: boolean; overdueItems: ReviewQueueViewItem[]; totalItems: number; trackTitle: string; upcomingItems: ReviewQueueViewItem[] };

export async function loadTrackReviewQueueViewModel(input: { now?: string; trackId: TrackId }): Promise<ReviewQueueViewModel> {
  const result = await getReviewQueueItems();
  return buildTrackReviewQueueViewModel({ issues: result.issues ?? [], now: input.now, reviewQueueItems: result.value, trackId: input.trackId });
}

export function buildTrackReviewQueueViewModel(input: { issues?: readonly StorageIssue[]; now?: string; reviewQueueItems: readonly ReviewQueueEntry[]; trackId: TrackId }): ReviewQueueViewModel {
  const now = input.now ?? new Date().toISOString();
  const items = input.reviewQueueItems.filter((entry) => entry.trackId === input.trackId).map((entry) => buildReviewViewItem(entry, now))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id));
  return { degraded: (input.issues ?? []).length > 0, dueItems: items.filter((item) => item.isDue), issues: [...(input.issues ?? [])], ok: (input.issues ?? []).length === 0, overdueItems: items.filter((item) => item.isOverdue), totalItems: items.length, trackTitle: getTrackDisplay(input.trackId).title, upcomingItems: items.filter((item) => !item.isDue) };
}

function buildReviewViewItem(entry: ReviewQueueEntry, now: string): ReviewQueueViewItem {
  return { dueAt: entry.dueAt, id: entry.id, isDue: entry.dueAt <= now, isOverdue: entry.dueAt < now, itemId: entry.sourceItem.itemId, mistakeTypeRefs: dedupeRefs(entry.taxonomyOrSkillRefs.filter((ref) => ref.axisId === "mistake_type")), prompt: resolvePrompt(entry), reasons: [...entry.reasons], sourceAttemptId: entry.sourceAttemptId, taxonomyRefs: dedupeRefs(entry.taxonomyOrSkillRefs) };
}
function resolvePrompt(entry: ReviewQueueEntry): string {
  if (entry.trackId === ALGORITHMS_TRACK_ID) return getAlgorithmContentCatalog().getItemById(entry.sourceItem.itemId).prompt;
  if (entry.trackId === CLOUD_CERTIFICATION_TRACK_ID) return getCertificationContentCatalog().getItemById(entry.sourceItem.itemId).question;
  return getTrackDisplay(entry.trackId).title;
}
function dedupeRefs(refs: readonly EvidenceRef[]): EvidenceRef[] { return [...new Map(refs.map((ref) => [`${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`, ref])).values()]; }
