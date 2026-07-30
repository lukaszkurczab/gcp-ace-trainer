import type {
  EvidenceRef,
  ReviewReason,
} from "../../domain";
import type { StorageIssue } from "../../application/learningReadModels";
import type { CertificationDomain } from "../../tracks/cloud-certification";
import { getDomainLabel } from "../../utils";

export type ReviewQueueRowStatus = "due" | "overdue" | "unavailable" | "upcoming";

export type ReviewTaxonomyLabel =
  | Readonly<{ kind: "authored"; value: string }>
  | Readonly<{ kind: "translation-key"; value: string }>;

export type ReviewQueueRow = {
  dueAt: string;
  id: string;
  itemId: string;
  mistakeTypeLabels: string[];
  promptPreview: string;
  reasonLabels: string[];
  sourceAttemptId: string;
  status: ReviewQueueRowStatus;
  taxonomyLabel: ReviewTaxonomyLabel;
  title: string;
};

export type ReviewQueueScreenModel = {
  degraded: boolean;
  dueRows: ReviewQueueRow[];
  emptyDescription: string;
  emptyTitle: string;
  trackTitle: string;
  totalCount: number;
  upcomingRows: ReviewQueueRow[];
  warning?: string;
};

export type ReviewQueueViewItem = {
  dueAt: string;
  id: string;
  isDue: boolean;
  isOverdue: boolean;
  itemId: string;
  mistakeTypeRefs: EvidenceRef[];
  prompt?: string;
  reasons: ReviewReason[];
  sourceAttemptId: string;
  taxonomyRefs: EvidenceRef[];
};

export type ReviewQueueViewModel = {
  degraded: boolean;
  dueItems: ReviewQueueViewItem[];
  issues: readonly StorageIssue[];
  ok: boolean;
  overdueItems: ReviewQueueViewItem[];
  totalItems: number;
  trackTitle: string;
  upcomingItems: ReviewQueueViewItem[];
};

const EMPTY_TITLE = "No review items yet";

export function buildReviewQueueScreenModel(
  viewModel: ReviewQueueViewModel,
): ReviewQueueScreenModel {
  const dueRows = dedupeRows([
    ...viewModel.overdueItems,
    ...viewModel.dueItems,
  ]).map((item) => buildReviewQueueRow(item, viewModel.trackTitle));

  return {
    degraded: viewModel.degraded,
    dueRows,
    emptyDescription: "Incorrect or partial answers from this track will appear here after they are added to review.",
    emptyTitle: EMPTY_TITLE,
    trackTitle: viewModel.trackTitle,
    totalCount: viewModel.totalItems,
    upcomingRows: viewModel.upcomingItems.map((item) =>
      buildReviewQueueRow(item, viewModel.trackTitle)
    ),
    warning: viewModel.degraded
      ? "Some local review queue data may be incomplete."
      : undefined,
  };
}

function buildReviewQueueRow(
  item: ReviewQueueViewItem,
  trackTitle: string,
): ReviewQueueRow {
  const title = item.prompt?.trim() || "Review item unavailable";
  const taxonomyLabel = formatPrimaryTaxonomyLabel(
    item.taxonomyRefs,
    trackTitle,
  );
  const status = getRowStatus(item);

  return {
    dueAt: item.dueAt,
    id: item.id,
    itemId: item.itemId,
    mistakeTypeLabels: item.mistakeTypeRefs.map(formatTaxonomyNodeLabel),
    promptPreview:
      status === "unavailable"
        ? "Content metadata is unavailable for this review item."
        : title,
    reasonLabels: item.reasons.map(formatReviewReason),
    sourceAttemptId: item.sourceAttemptId,
    status,
    taxonomyLabel,
    title,
  };
}

function dedupeRows(
  items: readonly ReviewQueueViewItem[],
): ReviewQueueViewItem[] {
  const byId = new Map<string, ReviewQueueViewItem>();

  items.forEach((item) => {
    byId.set(item.id, item);
  });

  return [...byId.values()].sort(
    (left, right) =>
      getStatusRank(left) - getStatusRank(right) ||
      left.dueAt.localeCompare(right.dueAt) ||
      left.id.localeCompare(right.id),
  );
}

function getRowStatus(item: ReviewQueueViewItem): ReviewQueueRowStatus {
  if (!item.prompt) {
    return "unavailable";
  }

  if (item.isOverdue) {
    return "overdue";
  }

  if (item.isDue) {
    return "due";
  }

  return "upcoming";
}

function getStatusRank(item: ReviewQueueViewItem): number {
  const status = getRowStatus(item);

  switch (status) {
    case "overdue":
      return 0;
    case "due":
      return 1;
    case "unavailable":
      return 2;
    case "upcoming":
      return 3;
  }
}

function formatPrimaryTaxonomyLabel(
  refs: readonly EvidenceRef[],
  trackTitle: string,
): ReviewTaxonomyLabel {
  const domainRef = refs.find((ref) => ref.axisId === "cloud-domain");

  if (domainRef) {
    return formatCloudDomainLabel(domainRef.nodeId);
  }

  const firstRef = refs[0];

  return firstRef
    ? { kind: "authored", value: formatTaxonomyNodeLabel(firstRef) }
    : { kind: "translation-key", value: trackTitle };
}

function formatCloudDomainLabel(nodeId: string): ReviewTaxonomyLabel {
  if (isExamDomain(nodeId)) {
    return {
      kind: "translation-key",
      value: getDomainLabel(nodeId),
    };
  }

  return {
    kind: "authored",
    value: formatNodeId(nodeId),
  };
}

function formatTaxonomyNodeLabel(ref: EvidenceRef): string {
  return formatNodeId(ref.nodeId);
}

function formatReviewReason(reason: ReviewReason): string {
  return formatNodeId(reason);
}

function formatNodeId(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isExamDomain(value: string): value is CertificationDomain {
  return (
    value === "setup_environment" ||
    value === "planning_implementation" ||
    value === "operations" ||
    value === "access_security"
  );
}
