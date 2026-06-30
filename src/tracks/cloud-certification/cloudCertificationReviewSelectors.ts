import { CLOUD_CERTIFICATION_TRACK_ID } from "../../domain";
import type {
  ReviewPriority,
  ReviewQueueItem,
  ReviewReason,
  TrainingItemTaxonomyRef,
} from "../../domain/training";
import { getReviewQueueItems } from "../../storage/repositories";
import { type LocalStorageIssue } from "../../storage/storageCodec";
import type { TrackContentAdapter } from "../types";
import { cloudCertificationContentAdapter } from "./cloudCertificationContentAdapter";

export type CloudCertificationReviewViewItem = {
  dueAt: string;
  id: string;
  isDue: boolean;
  isOverdue: boolean;
  itemId: string;
  mistakeTypeRefs: TrainingItemTaxonomyRef[];
  priority: ReviewPriority;
  prompt?: string;
  reasons: ReviewReason[];
  sourceAttemptId: string;
  taxonomyRefs: TrainingItemTaxonomyRef[];
};

export type CloudCertificationReviewViewModel = {
  degraded: boolean;
  dueItems: CloudCertificationReviewViewItem[];
  highPriorityItems: CloudCertificationReviewViewItem[];
  issues: LocalStorageIssue[];
  ok: boolean;
  overdueItems: CloudCertificationReviewViewItem[];
  totalItems: number;
  upcomingItems: CloudCertificationReviewViewItem[];
};

export type CloudCertificationReviewViewModelInput = {
  contentAdapter?: TrackContentAdapter;
  issues?: readonly LocalStorageIssue[];
  now?: string;
  reviewQueueItems: readonly ReviewQueueItem[];
};

export async function loadCloudCertificationReviewViewModel(
  input: {
    contentAdapter?: TrackContentAdapter;
    now?: string;
  } = {},
): Promise<CloudCertificationReviewViewModel> {
  const reviewQueueResult = await getReviewQueueItems();

  return buildCloudCertificationReviewViewModel({
    contentAdapter: input.contentAdapter,
    issues: reviewQueueResult.issues ?? [],
    now: input.now,
    reviewQueueItems: reviewQueueResult.value,
  });
}

export function buildCloudCertificationReviewViewModel(
  input: CloudCertificationReviewViewModelInput,
): CloudCertificationReviewViewModel {
  const now = input.now ?? new Date().toISOString();
  const items = input.reviewQueueItems
    .filter((item) => item.trackId === CLOUD_CERTIFICATION_TRACK_ID)
    .map((item) => buildReviewViewItem(item, input.contentAdapter ?? cloudCertificationContentAdapter, now))
    .sort((left, right) => left.dueAt.localeCompare(right.dueAt) || left.id.localeCompare(right.id));

  return {
    degraded: (input.issues ?? []).length > 0,
    dueItems: items.filter((item) => item.isDue),
    highPriorityItems: items.filter((item) => item.priority === "high" || item.priority === "urgent"),
    issues: [...(input.issues ?? [])],
    ok: (input.issues ?? []).length === 0,
    overdueItems: items.filter((item) => item.isOverdue),
    totalItems: items.length,
    upcomingItems: items.filter((item) => !item.isDue),
  };
}

function buildReviewViewItem(
  item: ReviewQueueItem,
  contentAdapter: TrackContentAdapter,
  now: string,
): CloudCertificationReviewViewItem {
  const contentItem = contentAdapter.getItemById(item.itemId);
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
    prompt: contentItem?.prompt,
    reasons: item.reasons,
    sourceAttemptId: item.sourceAttemptId,
    taxonomyRefs: dedupeTaxonomyRefs([
      ...(contentItem?.taxonomyRefs ?? []),
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
