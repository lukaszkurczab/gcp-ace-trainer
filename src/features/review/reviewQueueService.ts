import { ALGORITHMS_TRACK_ID, CLOUD_CERTIFICATION_TRACK_ID, getTrackDisplay, type EvidenceRef, type ReviewQueueEntry, type TrackId } from "../../domain";
import { getReviewQueueItems } from "../../storage/repositories";
import type { LocalStorageIssue } from "../../storage/storageCodec";
import { algorithmContentCatalog } from "../../tracks/algorithms";
import { certificationContentCatalog } from "../../tracks/cloud-certification";
import type { ReviewQueueViewItem, ReviewQueueViewModel } from "./reviewQueueModel";

export type BuildTrackReviewQueueViewModelInput = { issues?: readonly LocalStorageIssue[]; now?: string; reviewQueueItems: readonly ReviewQueueEntry[]; trackId: TrackId };

export async function loadTrackReviewQueueViewModel(input: { now?: string; trackId: TrackId }): Promise<ReviewQueueViewModel> {
  const result = await getReviewQueueItems();
  return buildTrackReviewQueueViewModel({ issues: result.issues ?? [], now: input.now, reviewQueueItems: result.value, trackId: input.trackId });
}

export function buildTrackReviewQueueViewModel(input: BuildTrackReviewQueueViewModelInput): ReviewQueueViewModel {
  const now = input.now ?? new Date().toISOString();
  const items = input.reviewQueueItems.filter((entry) => entry.trackId === input.trackId).map((entry) => buildReviewViewItem(entry, now))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id));
  return { degraded: (input.issues ?? []).length > 0, dueItems: items.filter((item) => item.isDue), issues: [...(input.issues ?? [])], ok: (input.issues ?? []).length === 0, overdueItems: items.filter((item) => item.isOverdue), totalItems: items.length, trackTitle: getTrackDisplay(input.trackId).title, upcomingItems: items.filter((item) => !item.isDue) };
}

function buildReviewViewItem(entry: ReviewQueueEntry, now: string): ReviewQueueViewItem {
  return { dueAt: entry.dueAt, id: entry.id, isDue: entry.dueAt <= now, isOverdue: entry.dueAt < now, itemId: entry.sourceItem.itemId, mistakeTypeRefs: dedupeRefs(entry.taxonomyOrSkillRefs.filter((ref) => ref.axisId === "mistake_type")), prompt: resolvePrompt(entry), reasons: [...entry.reasons], sourceAttemptId: entry.sourceAttemptId, taxonomyRefs: dedupeRefs(entry.taxonomyOrSkillRefs) };
}

function resolvePrompt(entry: ReviewQueueEntry): string {
  if (entry.trackId === ALGORITHMS_TRACK_ID) return algorithmContentCatalog.getItemById(entry.sourceItem.itemId).prompt;
  if (entry.trackId === CLOUD_CERTIFICATION_TRACK_ID) return certificationContentCatalog.getItemById(entry.sourceItem.itemId).question;
  return getTrackDisplay(entry.trackId).title;
}

function dedupeRefs(refs: readonly EvidenceRef[]): EvidenceRef[] {
  return [...new Map(refs.map((ref) => [`${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`, ref])).values()];
}
