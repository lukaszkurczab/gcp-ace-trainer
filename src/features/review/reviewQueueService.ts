import type { TrackId } from "../../domain";
import { getTrackDefinition } from "../../domain";
import type { ReviewQueueItem, TrainingItemTaxonomyRef } from "../../domain/training";
import { getReviewQueueItems } from "../../storage/repositories";
import type { LocalStorageIssue } from "../../storage/storageCodec";
import {
  getTrackAdapter,
  type TrackContentAdapter,
} from "../../tracks";
import type {
  ReviewQueueViewItem,
  ReviewQueueViewModel,
} from "./reviewQueueModel";

export type BuildTrackReviewQueueViewModelInput = {
  contentAdapter?: TrackContentAdapter;
  issues?: readonly LocalStorageIssue[];
  now?: string;
  reviewQueueItems: readonly ReviewQueueItem[];
  trackId: TrackId;
};

export async function loadTrackReviewQueueViewModel(input: {
  now?: string;
  trackId: TrackId;
}): Promise<ReviewQueueViewModel> {
  const reviewQueueResult = await getReviewQueueItems();

  return buildTrackReviewQueueViewModel({
    issues: reviewQueueResult.issues ?? [],
    now: input.now,
    reviewQueueItems: reviewQueueResult.value,
    trackId: input.trackId,
  });
}

export function buildTrackReviewQueueViewModel(
  input: BuildTrackReviewQueueViewModelInput,
): ReviewQueueViewModel {
  const now = input.now ?? new Date().toISOString();
  const track = getTrackDefinition(input.trackId);
  const contentAdapter = input.contentAdapter ?? getTrackAdapter(input.trackId).content;
  const items = input.reviewQueueItems
    .filter((item) => item.trackId === input.trackId)
    .map((item) => buildReviewViewItem(item, contentAdapter, now))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id));

  return {
    degraded: (input.issues ?? []).length > 0,
    dueItems: items.filter((item) => item.isDue),
    highPriorityItems: items.filter((item) => item.priority === "high" || item.priority === "urgent"),
    issues: [...(input.issues ?? [])],
    ok: (input.issues ?? []).length === 0,
    overdueItems: items.filter((item) => item.isOverdue),
    totalItems: items.length,
    trackTitle: track.title,
    upcomingItems: items.filter((item) => !item.isDue),
  };
}

function buildReviewViewItem(
  item: ReviewQueueItem,
  contentAdapter: TrackContentAdapter,
  now: string,
): ReviewQueueViewItem {
  const reviewContent = contentAdapter.getReviewContent(item.itemId);
  const isDue = new Date(item.dueAt).getTime() <= new Date(now).getTime();
  const isOverdue = new Date(item.dueAt).getTime() < new Date(now).getTime();

  return {
    dueAt: item.dueAt,
    id: item.id,
    isDue,
    isOverdue,
    itemId: item.itemId,
    mistakeTypeRefs: dedupeTaxonomyRefs(item.mistakeTypeRefs ?? []),
    priority: item.priority,
    prompt: reviewContent?.prompt,
    reasons: item.reasons,
    sourceAttemptId: item.sourceAttemptId,
    taxonomyRefs: dedupeTaxonomyRefs([
      ...(reviewContent?.taxonomyRefs ?? []),
      ...(item.taxonomyRefs ?? []),
      ...(item.mistakeTypeRefs ?? []),
    ]),
  };
}

function dedupeTaxonomyRefs(refs: readonly TrainingItemTaxonomyRef[]): TrainingItemTaxonomyRef[] {
  const byKey = new Map<string, TrainingItemTaxonomyRef>();

  refs.forEach((ref) => {
    byKey.set(buildTaxonomyKey(ref), ref);
  });

  return [...byKey.values()];
}

function buildTaxonomyKey(ref: TrainingItemTaxonomyRef): string {
  return `${ref.trackId ?? ""}:${ref.axisId}:${ref.nodeId}:${ref.role ?? ""}`;
}
