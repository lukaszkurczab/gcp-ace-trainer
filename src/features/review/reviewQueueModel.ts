import type {
  ReviewPriority,
  ReviewReason,
  TrainingItemTaxonomyRef,
} from "../../domain/training";
import type {
  CloudCertificationReviewViewItem,
  CloudCertificationReviewViewModel,
} from "../../tracks";
import type { ExamDomain } from "../../types";
import { getDomainLabel } from "../../utils";

export type ReviewQueueRowStatus = "due" | "overdue" | "unavailable" | "upcoming";

export type ReviewQueueRow = {
  dueAt: string;
  id: string;
  itemId: string;
  mistakeTypeLabels: string[];
  priority: ReviewPriority;
  promptPreview: string;
  reasonLabels: string[];
  sourceAttemptId: string;
  status: ReviewQueueRowStatus;
  taxonomyLabel: string;
  title: string;
};

export type ReviewQueueScreenModel = {
  degraded: boolean;
  dueRows: ReviewQueueRow[];
  emptyDescription: string;
  emptyTitle: string;
  totalCount: number;
  upcomingRows: ReviewQueueRow[];
  warning?: string;
};

const EMPTY_TITLE = "No review items yet";
const EMPTY_DESCRIPTION =
  "Incorrect Cloud Certification practice answers will appear here after they are added to the local review queue.";

export function buildReviewQueueScreenModel(
  viewModel: CloudCertificationReviewViewModel,
): ReviewQueueScreenModel {
  const dueRows = dedupeRows([
    ...viewModel.overdueItems,
    ...viewModel.dueItems,
    ...viewModel.highPriorityItems,
  ]).map(buildReviewQueueRow);

  return {
    degraded: viewModel.degraded,
    dueRows,
    emptyDescription: EMPTY_DESCRIPTION,
    emptyTitle: EMPTY_TITLE,
    totalCount: viewModel.totalItems,
    upcomingRows: viewModel.upcomingItems.map(buildReviewQueueRow),
    warning: viewModel.degraded
      ? "Some local review queue data may be incomplete."
      : undefined,
  };
}

function buildReviewQueueRow(item: CloudCertificationReviewViewItem): ReviewQueueRow {
  const title = item.prompt?.trim() || "Review item unavailable";
  const taxonomyLabel = formatPrimaryTaxonomyLabel(item.taxonomyRefs);
  const status = getRowStatus(item);

  return {
    dueAt: item.dueAt,
    id: item.id,
    itemId: item.itemId,
    mistakeTypeLabels: item.mistakeTypeRefs.map(formatTaxonomyNodeLabel),
    priority: item.priority,
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
  items: readonly CloudCertificationReviewViewItem[],
): CloudCertificationReviewViewItem[] {
  const byId = new Map<string, CloudCertificationReviewViewItem>();

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

function getRowStatus(item: CloudCertificationReviewViewItem): ReviewQueueRowStatus {
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

function getStatusRank(item: CloudCertificationReviewViewItem): number {
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

function formatPrimaryTaxonomyLabel(refs: readonly TrainingItemTaxonomyRef[]): string {
  const domainRef = refs.find((ref) => ref.axisId === "cloud-domain");

  if (domainRef) {
    return formatCloudDomainLabel(domainRef.nodeId);
  }

  const firstRef = refs[0];

  return firstRef ? formatTaxonomyNodeLabel(firstRef) : "Cloud Certification";
}

function formatCloudDomainLabel(nodeId: string): string {
  if (isExamDomain(nodeId)) {
    return getDomainLabel(nodeId);
  }

  return formatNodeId(nodeId);
}

function formatTaxonomyNodeLabel(ref: TrainingItemTaxonomyRef): string {
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

function isExamDomain(value: string): value is ExamDomain {
  return (
    value === "setup_environment" ||
    value === "planning_implementation" ||
    value === "operations" ||
    value === "access_security"
  );
}
