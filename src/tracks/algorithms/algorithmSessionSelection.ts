import { shuffleArray } from "../../utils";
import type { ReviewQueueItem, TrainingAttempt, TrainingSessionModeId } from "../../domain/training";
import type { TrackContentAdapter } from "../types";
import { ALGORITHMS_SESSION_MODE_ID } from "./algorithmItems";
import { ALGORITHM_ROADMAP, type AlgorithmRoadmapNodeId } from "./algorithmRoadmap";
import type { AlgorithmTrainingItem } from "./algorithmContentTypes";
import { algorithmsContentAdapter } from "./algorithmsContentAdapter";
import { buildAlgorithmProgressFacts } from "./algorithmProgress";
import { getAlgorithmAttemptStatus } from "./algorithmsScoringAdapter";

export type AlgorithmPracticeSessionMode =
  | "learn"
  | "drill"
  | "review"
  | "weakArea"
  | "practice"
  | "default";

export type SelectAlgorithmSessionItemsInput = {
  attempts?: readonly TrainingAttempt[];
  contentAdapter?: TrackContentAdapter;
  mode: AlgorithmPracticeSessionMode;
  nodeId: AlgorithmRoadmapNodeId;
  now?: string;
  reviewQueueItems?: readonly ReviewQueueItem[];
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

const MIN_WEAK_AREA_ATTEMPTS_PER_NODE = 2;

const reviewPriorityRank: Record<ReviewQueueItem["priority"], number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

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
        sortByTypePriority(
          filterItemsForRoadmapNode(selectableItems, input.nodeId)
            .filter((item) => LEARN_ITEM_TYPES.includes(item.type as typeof LEARN_ITEM_TYPES[number])),
          LEARN_ITEM_TYPES,
        ),
        input.sessionLength,
      );
    case "drill":
      return takeSessionItems(
        sortByTypePriority(
          filterItemsForRoadmapNode(selectableItems, input.nodeId)
            .filter((item) => DRILL_ITEM_TYPES.includes(item.type as typeof DRILL_ITEM_TYPES[number])),
          DRILL_ITEM_TYPES,
        ),
        input.sessionLength,
      );
    case "review":
      return selectDueReviewItems({
        items: selectableItems,
        now: input.now ?? new Date().toISOString(),
        reviewQueueItems: input.reviewQueueItems ?? [],
        sessionLength: input.sessionLength,
      });
    case "weakArea":
      return takeSessionItems(
        filterItemsForRoadmapNode(
          selectableItems,
          getWeakestRoadmapNodeId(input.attempts ?? [], selectableItems) ?? input.nodeId,
        ),
        input.sessionLength,
      );
    case "practice": {
      const unlockedNodeIds = getUnlockedRoadmapNodeIds(input.attempts ?? [], selectableItems);

      return takeSessionItems(
        selectableItems.filter((item) =>
          item.roadmapNodeId ? unlockedNodeIds.has(item.roadmapNodeId) : false,
        ),
        input.sessionLength,
      );
    }
    case "default":
      return selectAlgorithmSessionItemsForRoadmapNode({
        contentAdapter: adapter,
        nodeId: input.nodeId,
        sessionLength: input.sessionLength,
      });
  }
}

function getSelectableModeItems(adapter: TrackContentAdapter): readonly AlgorithmTrainingItem[] {
  return adapter.getItemsForMode(ALGORITHMS_SESSION_MODE_ID)
    .filter(isAlgorithmTrainingItemLike)
    .map((item) => item as unknown as AlgorithmTrainingItem);
}

function isAlgorithmTrainingItemLike(item: ReturnType<TrackContentAdapter["getItemsForMode"]>[number]): boolean {
  return item.trackId === "algorithms" && "roadmapNodeId" in item && "status" in item;
}

function filterItemsForRoadmapNode(
  items: readonly AlgorithmTrainingItem[],
  nodeId: AlgorithmRoadmapNodeId,
): readonly AlgorithmTrainingItem[] {
  return items.filter((item) => item.roadmapNodeId === nodeId);
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

function compareReviewQueueItems(left: ReviewQueueItem, right: ReviewQueueItem): number {
  return (
    reviewPriorityRank[left.priority] - reviewPriorityRank[right.priority] ||
    left.dueAt.localeCompare(right.dueAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id)
  );
}

function getWeakestRoadmapNodeId(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmTrainingItem[],
): AlgorithmRoadmapNodeId | undefined {
  const itemById = new Map(items.map((item) => [item.id, item]));
  const statsByNodeId = new Map<AlgorithmRoadmapNodeId, { attempts: number; score: number }>();

  for (const attempt of attempts) {
    if (attempt.trackId !== "algorithms") {
      continue;
    }

    const item = itemById.get(attempt.itemId);
    const nodeId = item?.roadmapNodeId;
    const status = getAlgorithmAttemptStatus(attempt.result);

    if (!nodeId || !status) {
      continue;
    }

    const current = statsByNodeId.get(nodeId) ?? { attempts: 0, score: 0 };
    statsByNodeId.set(nodeId, {
      attempts: current.attempts + 1,
      score: current.score + getStatusScore(status),
    });
  }

  return [...statsByNodeId.entries()]
    .filter(([, stats]) => stats.attempts >= MIN_WEAK_AREA_ATTEMPTS_PER_NODE)
    .sort(([leftNodeId, leftStats], [rightNodeId, rightStats]) =>
      leftStats.score / leftStats.attempts - rightStats.score / rightStats.attempts ||
      rightStats.attempts - leftStats.attempts ||
      getRoadmapNodeOrder(leftNodeId) - getRoadmapNodeOrder(rightNodeId),
    )[0]?.[0];
}

function getStatusScore(status: NonNullable<ReturnType<typeof getAlgorithmAttemptStatus>>): number {
  if (status === "correct") return 1;
  if (status === "partial") return 0.5;
  return 0;
}

function getUnlockedRoadmapNodeIds(
  attempts: readonly TrainingAttempt[],
  items: readonly AlgorithmTrainingItem[],
): Set<AlgorithmRoadmapNodeId> {
  const progress = buildAlgorithmProgressFacts(attempts, items, ALGORITHM_ROADMAP.nodes);
  const completedNodeIds = new Set(
    progress.nodeProgress
      .filter((node) => node.status === "completed")
      .map((node) => node.nodeId),
  );

  return new Set(
    ALGORITHM_ROADMAP.nodes
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

function getRoadmapNodeOrder(nodeId: AlgorithmRoadmapNodeId): number {
  return ALGORITHM_ROADMAP.nodes.find((node) => node.id === nodeId)?.order ?? Number.MAX_SAFE_INTEGER;
}

function takeSessionItems(
  items: readonly AlgorithmTrainingItem[],
  sessionLength: number,
): readonly AlgorithmTrainingItem[] {
  return items.slice(0, sessionLength);
}
