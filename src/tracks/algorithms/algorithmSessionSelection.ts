import { shuffleArray } from "../../utils";
import type { ReviewQueueItem, TrainingAttempt, TrainingSessionModeId } from "../../domain/training";
import type { TrackContentAdapter } from "../types";
import { ALGORITHMS_SESSION_MODE_ID } from "./algorithmItems";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";
import type { AlgorithmTrainingItem } from "./algorithmContentTypes";
import { algorithmsContentAdapter } from "./algorithmsContentAdapter";
import {
  buildAlgorithmProgressFacts,
  buildAlgorithmWeakAreaRecommendation,
} from "./algorithmProgress";

export type AlgorithmPracticeSessionMode =
  | "learn"
  | "drill"
  | "review"
  | "weakArea"
  | "practice"
  | "default";

export type AlgorithmReviewSource = "dueQueue" | "sessionMisses";

export type SelectAlgorithmSessionItemsInput = {
  attempts?: readonly TrainingAttempt[];
  contentAdapter?: TrackContentAdapter;
  mode: AlgorithmPracticeSessionMode;
  nodeId: AlgorithmRoadmapNodeId;
  now?: string;
  reviewItemIds?: readonly string[];
  reviewQueueItems?: readonly ReviewQueueItem[];
  reviewSource?: AlgorithmReviewSource;
  sessionLength: number;
};

export type AlgorithmMixedPracticeSelectionInput = {
  attempts: readonly TrainingAttempt[];
  currentRoadmapNodeId: AlgorithmRoadmapNodeId;
  items: readonly AlgorithmTrainingItem[];
  roadmapNodes?: readonly AlgorithmRoadmapNode[];
  sessionLength: number;
};

const LEARN_ITEM_TYPES = [
  "approach_primer",
  "approach_naming",
  "worked_example",
] as const;

const DRILL_ITEM_TYPES = [
  "trace_next_step",
  "complexity_check",
  "edge_case_drill",
  "pseudocode_ordering",
  "subgoal_ordering",
] as const;

const reviewPriorityRank: Record<ReviewQueueItem["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export const ALGORITHMS_SESSION_MODE_IDS = {
  default: ALGORITHMS_SESSION_MODE_ID,
  drill: "algorithms-drill",
  learn: "algorithms-learn",
  practice: "algorithms-mixed-practice",
  review: "algorithms-review",
  weakArea: "algorithms-weak-area",
} as const satisfies Record<AlgorithmPracticeSessionMode, TrainingSessionModeId>;

export function getAlgorithmsTrainingSessionModeId(
  mode: AlgorithmPracticeSessionMode,
): TrainingSessionModeId {
  return ALGORITHMS_SESSION_MODE_IDS[mode];
}

export function selectAlgorithmSessionItemsForRoadmapNode(input: {
  contentAdapter?: TrackContentAdapter;
  modeId?: TrainingSessionModeId;
  nodeId: AlgorithmRoadmapNodeId;
  sessionLength: number;
}): readonly AlgorithmTrainingItem[] {
  const adapter = input.contentAdapter ?? algorithmsContentAdapter;
  const modeId = input.modeId ?? ALGORITHMS_SESSION_MODE_ID;

  return shuffleArray(
    adapter.getItemsForMode(modeId)
      .filter((item) => (
        item.trackId === "algorithms" &&
        "roadmapNodeId" in item &&
        item.roadmapNodeId === input.nodeId
      ))
      .map((item) => item as unknown as AlgorithmTrainingItem),
  )
    .slice(0, input.sessionLength);
}

export function selectAlgorithmSessionItems(
  input: SelectAlgorithmSessionItemsInput,
): readonly AlgorithmTrainingItem[] {
  const adapter = input.contentAdapter ?? algorithmsContentAdapter;
  const selectableItems = getSelectableModeItems(adapter);

  switch (input.mode) {
    case "learn":
      return takeSessionItems(
        selectPreferredRoadmapNodeItems({
          items: selectableItems,
          nodeId: input.nodeId,
          typePriority: LEARN_ITEM_TYPES,
        }),
        input.sessionLength,
      );
    case "drill":
      return takeSessionItems(
        selectPreferredRoadmapNodeItems({
          items: selectableItems,
          nodeId: input.nodeId,
          typePriority: DRILL_ITEM_TYPES,
        }),
        input.sessionLength,
      );
    case "review":
      // sessionMisses is the immediate post-session correction path: it replays the
      // supplied missed ids regardless of dueAt. dueQueue remains the spaced-review
      // source and continues to require dueAt <= now.
      if (input.reviewSource === "sessionMisses") {
        return selectReviewItemsById({
          itemIds: input.reviewItemIds ?? [],
          items: selectableItems,
          sessionLength: input.sessionLength,
        });
      }

      return selectDueReviewItems({
        items: selectableItems,
        now: input.now ?? new Date().toISOString(),
        reviewQueueItems: input.reviewQueueItems ?? [],
        sessionLength: input.sessionLength,
      });
    case "weakArea":
      return selectWeakAreaItems({
        attempts: input.attempts ?? [],
        items: selectableItems,
        nodeId: input.nodeId,
        sessionLength: input.sessionLength,
      });
    case "practice": {
      return buildAlgorithmMixedPracticeSelection({
        attempts: input.attempts ?? [],
        currentRoadmapNodeId: input.nodeId,
        items: selectableItems,
        sessionLength: input.sessionLength,
      });
    }
    case "default":
      return selectAlgorithmSessionItemsForRoadmapNode({
        contentAdapter: adapter,
        nodeId: input.nodeId,
        sessionLength: input.sessionLength,
      });
  }
}

export function buildAlgorithmMixedPracticeSelection(
  input: AlgorithmMixedPracticeSelectionInput,
): readonly AlgorithmTrainingItem[] {
  const roadmapNodes = input.roadmapNodes ?? ALGORITHM_ROADMAP.nodes;
  const availableNodeIds = new Set(
    roadmapNodes
      .filter((node) => node.status === "available")
      .map((node) => node.id),
  );
  const selectableItems = input.items.filter((item) =>
    item.status === "active" &&
    item.roadmapNodeId &&
    availableNodeIds.has(item.roadmapNodeId),
  );
  const unlockedNodeIds = getUnlockedRoadmapNodeIds(input.attempts, selectableItems, roadmapNodes);
  const unlockedItems = selectableItems.filter((item) =>
    item.roadmapNodeId ? unlockedNodeIds.has(item.roadmapNodeId) : false,
  );

  if (unlockedItems.length === 0 || input.sessionLength <= 0) {
    return [];
  }

  const weakRecommendation = buildAlgorithmWeakAreaRecommendation(
    input.attempts,
    unlockedItems,
    roadmapNodes,
    input.currentRoadmapNodeId,
  );
  const weakCandidateOrder = new Map(
    weakRecommendation.candidateItemIds.map((itemId, index) => [itemId, index]),
  );
  const nodeIds = buildMixedPracticeNodeOrder({
    currentRoadmapNodeId: input.currentRoadmapNodeId,
    items: unlockedItems,
    roadmapNodes,
    unlockedNodeIds,
    weakRoadmapNodeId: weakRecommendation.selectedRoadmapNodeId,
  });
  const buckets = nodeIds.map((nodeId) =>
    sortMixedPracticeBucket(
      unlockedItems.filter((item) => item.roadmapNodeId === nodeId),
      weakCandidateOrder,
    ),
  );
  const selectedItemIds = new Set<string>();
  const selectedItemTypes = new Set<string>();
  const selectedItems: AlgorithmTrainingItem[] = [];

  while (selectedItems.length < input.sessionLength) {
    let selectedThisRound = false;

    for (const bucketItems of buckets) {
      const item = selectNextMixedPracticeItem(bucketItems, selectedItemIds, selectedItemTypes);

      if (!item) {
        continue;
      }

      selectedItems.push(item);
      selectedItemIds.add(item.id);
      selectedItemTypes.add(item.type);
      selectedThisRound = true;

      if (selectedItems.length >= input.sessionLength) {
        break;
      }
    }

    if (!selectedThisRound) {
      break;
    }
  }

  return selectedItems;
}

function getSelectableModeItems(adapter: TrackContentAdapter): readonly AlgorithmTrainingItem[] {
  return adapter.getItemsForMode(ALGORITHMS_SESSION_MODE_ID)
    .filter(isAlgorithmTrainingItemLike)
    .map((item) => item as unknown as AlgorithmTrainingItem)
    .filter((item) =>
      item.status === "active" &&
      ALGORITHM_ROADMAP.nodes.some((node) => node.id === item.roadmapNodeId && node.status === "available"),
    );
}

function isAlgorithmTrainingItemLike(item: ReturnType<TrackContentAdapter["getItemsForMode"]>[number]): boolean {
  return item.trackId === "algorithms" && "roadmapNodeId" in item && "status" in item;
}

function selectWeakAreaItems(input: {
  attempts: readonly TrainingAttempt[];
  items: readonly AlgorithmTrainingItem[];
  nodeId: AlgorithmRoadmapNodeId;
  sessionLength: number;
}): readonly AlgorithmTrainingItem[] {
  const recommendation = buildAlgorithmWeakAreaRecommendation(
    input.attempts,
    input.items,
    ALGORITHM_ROADMAP.nodes,
    input.nodeId,
  );
  const itemById = new Map(input.items.map((item) => [item.id, item]));
  const selectedItems = recommendation.candidateItemIds.flatMap((itemId) => {
    const item = itemById.get(itemId);
    return item ? [item] : [];
  });

  return takeSessionItems(selectedItems, input.sessionLength);
}

function filterItemsForRoadmapNode(
  items: readonly AlgorithmTrainingItem[],
  nodeId: AlgorithmRoadmapNodeId,
): readonly AlgorithmTrainingItem[] {
  return items.filter((item) => item.roadmapNodeId === nodeId);
}

function selectPreferredRoadmapNodeItems<TType extends string>(input: {
  items: readonly AlgorithmTrainingItem[];
  nodeId: AlgorithmRoadmapNodeId;
  typePriority: readonly TType[];
}): readonly AlgorithmTrainingItem[] {
  const nodeItems = filterItemsForRoadmapNode(input.items, input.nodeId);
  const preferredItems = nodeItems.filter((item) =>
    input.typePriority.includes(item.type as TType),
  );

  return preferredItems.length > 0
    ? sortByTypePriority(preferredItems, input.typePriority)
    : nodeItems;
}

function sortByTypePriority<TType extends string>(
  items: readonly AlgorithmTrainingItem[],
  typePriority: readonly TType[],
): readonly AlgorithmTrainingItem[] {
  return [...items].sort((left, right) => {
    const leftIndex = typePriority.indexOf(left.type as TType);
    const rightIndex = typePriority.indexOf(right.type as TType);

    return normalizeTypePriority(leftIndex) - normalizeTypePriority(rightIndex);
  });
}

function normalizeTypePriority(index: number): number {
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function selectDueReviewItems(input: {
  items: readonly AlgorithmTrainingItem[];
  now: string;
  reviewQueueItems: readonly ReviewQueueItem[];
  sessionLength: number;
}): readonly AlgorithmTrainingItem[] {
  const itemById = new Map(input.items.map((item) => [item.id, item]));
  const selectedItemIds = new Set<string>();
  const selectedItems: AlgorithmTrainingItem[] = [];

  for (const reviewItem of [...input.reviewQueueItems]
    .filter((item) => item.trackId === "algorithms" && item.dueAt <= input.now)
    .sort(compareReviewQueueItems)) {
    const item = itemById.get(reviewItem.itemId);

    if (item && !selectedItemIds.has(item.id)) {
      selectedItems.push(item);
      selectedItemIds.add(item.id);
    }
  }

  return takeSessionItems(selectedItems, input.sessionLength);
}

function selectReviewItemsById(input: {
  itemIds: readonly string[];
  items: readonly AlgorithmTrainingItem[];
  sessionLength: number;
}): readonly AlgorithmTrainingItem[] {
  const itemById = new Map(input.items.map((item) => [item.id, item]));
  const selectedItemIds = new Set<string>();
  const selectedItems: AlgorithmTrainingItem[] = [];

  for (const itemId of input.itemIds) {
    const item = itemById.get(itemId);

    if (item && !selectedItemIds.has(item.id)) {
      selectedItems.push(item);
      selectedItemIds.add(item.id);
    }
  }

  return takeSessionItems(selectedItems, input.sessionLength);
}

function compareReviewQueueItems(left: ReviewQueueItem, right: ReviewQueueItem): number {
  return (
    reviewPriorityRank[left.priority] - reviewPriorityRank[right.priority] ||
    left.dueAt.localeCompare(right.dueAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function buildMixedPracticeNodeOrder(input: {
  currentRoadmapNodeId: AlgorithmRoadmapNodeId;
  items: readonly AlgorithmTrainingItem[];
  roadmapNodes: readonly AlgorithmRoadmapNode[];
  unlockedNodeIds: ReadonlySet<AlgorithmRoadmapNodeId>;
  weakRoadmapNodeId: AlgorithmRoadmapNodeId;
}): readonly AlgorithmRoadmapNodeId[] {
  const nodeIdsWithItems = new Set(
    input.items.flatMap((item) => item.roadmapNodeId ? [item.roadmapNodeId] : []),
  );
  const orderedNodeIds = input.roadmapNodes
    .filter((node) =>
      node.status === "available" &&
      input.unlockedNodeIds.has(node.id) &&
      nodeIdsWithItems.has(node.id),
    )
    .sort((left, right) => left.order - right.order)
    .map((node) => node.id);

  return dedupeRoadmapNodeIds([
    input.weakRoadmapNodeId,
    input.currentRoadmapNodeId,
    ...orderedNodeIds,
  ]).filter((nodeId) => input.unlockedNodeIds.has(nodeId) && nodeIdsWithItems.has(nodeId));
}

function sortMixedPracticeBucket(
  items: readonly AlgorithmTrainingItem[],
  weakCandidateOrder: ReadonlyMap<string, number>,
): readonly AlgorithmTrainingItem[] {
  return [...items].sort((left, right) => (
    (weakCandidateOrder.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
    (weakCandidateOrder.get(right.id) ?? Number.MAX_SAFE_INTEGER)
  ));
}

function selectNextMixedPracticeItem(
  items: readonly AlgorithmTrainingItem[],
  selectedItemIds: ReadonlySet<string>,
  selectedItemTypes: ReadonlySet<string>,
): AlgorithmTrainingItem | undefined {
  return (
    items.find((item) => !selectedItemIds.has(item.id) && !selectedItemTypes.has(item.type)) ??
    items.find((item) => !selectedItemIds.has(item.id))
  );
}

function dedupeRoadmapNodeIds(
  nodeIds: readonly AlgorithmRoadmapNodeId[],
): readonly AlgorithmRoadmapNodeId[] {
  const seen = new Set<AlgorithmRoadmapNodeId>();
  const dedupedNodeIds: AlgorithmRoadmapNodeId[] = [];

  for (const nodeId of nodeIds) {
    if (!seen.has(nodeId)) {
      dedupedNodeIds.push(nodeId);
      seen.add(nodeId);
    }
  }

  return dedupedNodeIds;
}

function getUnlockedRoadmapNodeIds(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmTrainingItem[],
  roadmapNodes: readonly AlgorithmRoadmapNode[] = ALGORITHM_ROADMAP.nodes,
): Set<AlgorithmRoadmapNodeId> {
  const progress = buildAlgorithmProgressFacts(attempts, items, roadmapNodes);
  const completedNodeIds = new Set(
    progress.nodeProgress
      .filter((node) => node.status === "completed")
      .map((node) => node.nodeId),
  );

  return new Set(
    roadmapNodes
      .filter((node) =>
        node.status === "available" &&
        items.some((item) => item.roadmapNodeId === node.id) &&
        (
          node.id === progress.activeRoadmapNode.id ||
          completedNodeIds.has(node.id) ||
          node.prerequisiteNodeIds.every((nodeId) => completedNodeIds.has(nodeId))
        ),
      )
      .map((node) => node.id),
  );
}

function takeSessionItems(
  items: readonly AlgorithmTrainingItem[],
  sessionLength: number,
): readonly AlgorithmTrainingItem[] {
  return items.slice(0, sessionLength);
}
