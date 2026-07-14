import type { ReviewQueueEntry, TrainingAttempt } from "../../domain";
import { shuffleArray } from "../../utils";
import {
  ALGORITHMS_SESSION_MODE_ID,
  getAlgorithmQuestionEntries,
  type AlgorithmQuestionEntry,
} from "./algorithmItems";
import type { AlgorithmContentGroup } from "./content";
import type { AlgorithmQuestion, AlgorithmQuestionType } from "./algorithmQuestionTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";
import { algorithmContentCatalog, type AlgorithmContentCatalog } from "./algorithmContentCatalog";
import {
  buildAlgorithmProgressFacts,
  buildAlgorithmWeakAreaRecommendation,
  isRoadmapPrerequisiteSatisfied,
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
  contentCatalog?: AlgorithmContentCatalog;
  mode: AlgorithmPracticeSessionMode;
  nodeId: AlgorithmRoadmapNodeId;
  now?: string;
  reviewItemIds?: readonly string[];
  reviewQueueItems?: readonly ReviewQueueEntry[];
  reviewSource?: AlgorithmReviewSource;
  sessionLength: number;
};

export type AlgorithmMixedPracticeSelectionInput = {
  attempts: readonly TrainingAttempt[];
  currentRoadmapNodeId: AlgorithmRoadmapNodeId;
  groups: readonly AlgorithmContentGroup[];
  roadmapNodes?: readonly AlgorithmRoadmapNode[];
  sessionLength: number;
};

const LEARN_ITEM_TYPES = [
  "approach_naming",
  "code_reading",
] as const satisfies readonly AlgorithmQuestionType[];

const DRILL_ITEM_TYPES = [
  "trace_next_step",
  "complexity_check",
  "edge_case_drill",
  "common_mistake_diagnosis",
  "test_case_selection",
  "state_selection",
  "output_contract_reasoning",
  "output_contract_analysis",
  "constraint_change",
  "complexity_reasoning",
  "subgoal_ordering",
  "invariant_identification",
  "invariant_reasoning",
  "counterexample_reasoning",
  "mistake_review",
] as const satisfies readonly AlgorithmQuestionType[];

export const ALGORITHMS_SESSION_MODE_IDS = {
  default: ALGORITHMS_SESSION_MODE_ID,
  drill: "algorithms-drill",
  learn: "algorithms-learn",
  practice: "algorithms-mixed-practice",
  review: "algorithms-review",
  weakArea: "algorithms-weak-area",
} as const satisfies Record<AlgorithmPracticeSessionMode, string>;

export function getAlgorithmsTrainingSessionModeId(
  mode: AlgorithmPracticeSessionMode,
): string {
  return ALGORITHMS_SESSION_MODE_IDS[mode];
}

export function selectAlgorithmSessionItemsForRoadmapNode(input: {
  contentCatalog?: AlgorithmContentCatalog;
  modeId?: string;
  nodeId: AlgorithmRoadmapNodeId;
  sessionLength: number;
}): readonly AlgorithmQuestion[] {
  const catalog = input.contentCatalog ?? algorithmContentCatalog;
  const entries = getSelectableModeEntries(
    catalog,
    input.modeId ?? ALGORITHMS_SESSION_MODE_ID,
  ).filter((entry) => entry.group.roadmapNodeId === input.nodeId);

  return shuffleArray(entries.map((entry) => entry.question)).slice(0, input.sessionLength);
}

export function selectAlgorithmSessionItems(
  input: SelectAlgorithmSessionItemsInput,
): readonly AlgorithmQuestion[] {
  const catalog = input.contentCatalog ?? algorithmContentCatalog;
  const entries = getSelectableModeEntries(catalog, ALGORITHMS_SESSION_MODE_ID);

  switch (input.mode) {
    case "learn":
      return takeQuestions(
        selectPreferredNodeEntries(entries, input.nodeId, LEARN_ITEM_TYPES),
        input.sessionLength,
      );
    case "drill":
      return takeQuestions(
        selectPreferredNodeEntries(entries, input.nodeId, DRILL_ITEM_TYPES),
        input.sessionLength,
      );
    case "review":
      return input.reviewSource === "sessionMisses"
        ? selectReviewQuestionsById(
            input.reviewItemIds ?? [],
            entries,
            input.sessionLength,
          )
        : selectDueReviewQuestions(
            input.reviewQueueItems ?? [],
            entries,
            input.now ?? new Date().toISOString(),
            input.sessionLength,
          );
    case "weakArea":
      return selectWeakAreaQuestions(
        input.attempts ?? [],
        catalog.getGroups(),
        input.nodeId,
        input.sessionLength,
      );
    case "practice":
      return buildAlgorithmMixedPracticeSelection({
        attempts: input.attempts ?? [],
        currentRoadmapNodeId: input.nodeId,
        groups: catalog.getGroups(),
        sessionLength: input.sessionLength,
      });
    case "default":
      return selectAlgorithmSessionItemsForRoadmapNode({
        contentCatalog: catalog,
        nodeId: input.nodeId,
        sessionLength: input.sessionLength,
      });
  }
}

export function buildAlgorithmMixedPracticeSelection(
  input: AlgorithmMixedPracticeSelectionInput,
): readonly AlgorithmQuestion[] {
  const roadmapNodes = input.roadmapNodes ?? ALGORITHM_ROADMAP.nodes;
  const selectableEntries = getSelectableEntries(input.groups, roadmapNodes);
  const unlockedNodeIds = getUnlockedRoadmapNodeIds(
    input.attempts,
    input.groups,
    roadmapNodes,
  );
  const unlockedEntries = selectableEntries.filter((entry) =>
    unlockedNodeIds.has(entry.group.roadmapNodeId),
  );

  if (unlockedEntries.length === 0 || input.sessionLength <= 0) {
    return [];
  }

  const weakRecommendation = buildAlgorithmWeakAreaRecommendation(
    input.attempts,
    input.groups,
    roadmapNodes,
    input.currentRoadmapNodeId,
  );
  const weakCandidateOrder = new Map(
    weakRecommendation.candidateItemIds.map((itemId, index) => [itemId, index]),
  );
  const nodeIds = buildMixedPracticeNodeOrder(
    input.currentRoadmapNodeId,
    unlockedEntries,
    roadmapNodes,
    unlockedNodeIds,
    weakRecommendation.selectedRoadmapNodeId,
  );
  const buckets = nodeIds.map((nodeId) =>
    sortMixedPracticeBucket(
      unlockedEntries.filter((entry) => entry.group.roadmapNodeId === nodeId),
      weakCandidateOrder,
    ),
  );
  const selectedIds = new Set<string>();
  const selectedTypes = new Set<AlgorithmQuestionType>();
  const selected: AlgorithmQuestion[] = [];

  while (selected.length < input.sessionLength) {
    let selectedThisRound = false;

    for (const bucket of buckets) {
      const entry = selectNextMixedPracticeEntry(bucket, selectedIds, selectedTypes);

      if (!entry) continue;

      selected.push(entry.question);
      selectedIds.add(entry.question.id);
      selectedTypes.add(entry.question.type);
      selectedThisRound = true;

      if (selected.length >= input.sessionLength) break;
    }

    if (!selectedThisRound) break;
  }

  return selected;
}

function getSelectableModeEntries(
  catalog: AlgorithmContentCatalog,
  modeId: string,
): readonly AlgorithmQuestionEntry[] {
  const modeItemIds = new Set(catalog.getItemsForMode(modeId).map((question) => question.id));

  return getSelectableEntries(catalog.getGroups(), ALGORITHM_ROADMAP.nodes)
    .filter((entry) => modeItemIds.has(entry.question.id));
}

function getSelectableEntries(
  groups: readonly AlgorithmContentGroup[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): readonly AlgorithmQuestionEntry[] {
  const selectableNodeIds = new Set(
    roadmapNodes
      .filter((node) =>
        (groups.find((group) => group.roadmapNodeId === node.id)?.questions.length ?? 0) >=
        node.minimumActiveItemCount,
      )
      .map((node) => node.id),
  );

  return getAlgorithmQuestionEntries(groups).filter((entry) =>
    selectableNodeIds.has(entry.group.roadmapNodeId),
  );
}

function selectPreferredNodeEntries(
  entries: readonly AlgorithmQuestionEntry[],
  nodeId: AlgorithmRoadmapNodeId,
  typePriority: readonly AlgorithmQuestionType[],
): readonly AlgorithmQuestionEntry[] {
  const nodeEntries = entries.filter((entry) => entry.group.roadmapNodeId === nodeId);
  const preferred = nodeEntries.filter((entry) => typePriority.includes(entry.question.type));

  return [...(preferred.length > 0 ? preferred : nodeEntries)].sort((left, right) =>
    normalizeTypePriority(typePriority.indexOf(left.question.type)) -
    normalizeTypePriority(typePriority.indexOf(right.question.type)),
  );
}

function normalizeTypePriority(index: number): number {
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

function selectWeakAreaQuestions(
  attempts: readonly TrainingAttempt[],
  groups: readonly AlgorithmContentGroup[],
  nodeId: AlgorithmRoadmapNodeId,
  sessionLength: number,
): readonly AlgorithmQuestion[] {
  const recommendation = buildAlgorithmWeakAreaRecommendation(
    attempts,
    groups,
    ALGORITHM_ROADMAP.nodes,
    nodeId,
  );
  const questionsById = new Map(
    groups.flatMap((group) => group.questions).map((question) => [question.id, question]),
  );

  return recommendation.candidateItemIds.flatMap((itemId) => {
    const question = questionsById.get(itemId);
    return question ? [question] : [];
  }).slice(0, sessionLength);
}

function selectDueReviewQuestions(
  reviewQueueItems: readonly ReviewQueueEntry[],
  entries: readonly AlgorithmQuestionEntry[],
  now: string,
  sessionLength: number,
): readonly AlgorithmQuestion[] {
  const questionsById = new Map(entries.map((entry) => [entry.question.id, entry.question]));
  const selectedIds = new Set<string>();
  const selected: AlgorithmQuestion[] = [];

  for (const reviewItem of [...reviewQueueItems]
    .filter((item) => item.trackId === "algorithms" && item.dueAt <= now)
    .sort(compareReviewQueueItems)) {
    const question = questionsById.get(reviewItem.sourceItem.itemId);

    if (question && !selectedIds.has(question.id)) {
      selected.push(question);
      selectedIds.add(question.id);
    }
  }

  return selected.slice(0, sessionLength);
}

function selectReviewQuestionsById(
  itemIds: readonly string[],
  entries: readonly AlgorithmQuestionEntry[],
  sessionLength: number,
): readonly AlgorithmQuestion[] {
  const questionsById = new Map(entries.map((entry) => [entry.question.id, entry.question]));
  const selectedIds = new Set<string>();
  const selected: AlgorithmQuestion[] = [];

  for (const itemId of itemIds) {
    const question = questionsById.get(itemId);

    if (question && !selectedIds.has(question.id)) {
      selected.push(question);
      selectedIds.add(question.id);
    }
  }

  return selected.slice(0, sessionLength);
}

function compareReviewQueueItems(left: ReviewQueueEntry, right: ReviewQueueEntry): number {
  return left.dueAt.localeCompare(right.dueAt) ||
    left.createdAt.localeCompare(right.createdAt) ||
    left.id.localeCompare(right.id);
}

function buildMixedPracticeNodeOrder(
  currentRoadmapNodeId: AlgorithmRoadmapNodeId,
  entries: readonly AlgorithmQuestionEntry[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
  unlockedNodeIds: ReadonlySet<AlgorithmRoadmapNodeId>,
  weakRoadmapNodeId: AlgorithmRoadmapNodeId,
): readonly AlgorithmRoadmapNodeId[] {
  const nodeIdsWithQuestions = new Set(entries.map((entry) => entry.group.roadmapNodeId));
  const orderedNodeIds = roadmapNodes
    .filter((node) => unlockedNodeIds.has(node.id) && nodeIdsWithQuestions.has(node.id))
    .sort((left, right) => left.order - right.order)
    .map((node) => node.id);

  return dedupeRoadmapNodeIds([
    weakRoadmapNodeId,
    currentRoadmapNodeId,
    ...orderedNodeIds,
  ]).filter((nodeId) => unlockedNodeIds.has(nodeId) && nodeIdsWithQuestions.has(nodeId));
}

function sortMixedPracticeBucket(
  entries: readonly AlgorithmQuestionEntry[],
  weakCandidateOrder: ReadonlyMap<string, number>,
): readonly AlgorithmQuestionEntry[] {
  return [...entries].sort((left, right) =>
    (weakCandidateOrder.get(left.question.id) ?? Number.MAX_SAFE_INTEGER) -
    (weakCandidateOrder.get(right.question.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

function selectNextMixedPracticeEntry(
  entries: readonly AlgorithmQuestionEntry[],
  selectedIds: ReadonlySet<string>,
  selectedTypes: ReadonlySet<AlgorithmQuestionType>,
): AlgorithmQuestionEntry | undefined {
  return entries.find((entry) =>
    !selectedIds.has(entry.question.id) && !selectedTypes.has(entry.question.type),
  ) ?? entries.find((entry) => !selectedIds.has(entry.question.id));
}

function dedupeRoadmapNodeIds(
  nodeIds: readonly AlgorithmRoadmapNodeId[],
): readonly AlgorithmRoadmapNodeId[] {
  return [...new Set(nodeIds)];
}

function getUnlockedRoadmapNodeIds(
  attempts: readonly TrainingAttempt[],
  groups: readonly AlgorithmContentGroup[],
  roadmapNodes: readonly AlgorithmRoadmapNode[],
): Set<AlgorithmRoadmapNodeId> {
  const progress = buildAlgorithmProgressFacts(attempts, groups, roadmapNodes);
  const completedNodeIds = new Set(
    progress.nodeProgress
      .filter((node) => isRoadmapPrerequisiteSatisfied(node.status))
      .map((node) => node.nodeId),
  );
  const nodesWithQuestions = new Set(groups.map((group) => group.roadmapNodeId));

  return new Set(
    roadmapNodes
      .filter((node) =>
        nodesWithQuestions.has(node.id) &&
        (node.id === progress.activeRoadmapNode.id ||
          completedNodeIds.has(node.id) ||
          node.prerequisiteNodeIds.every((nodeId) => completedNodeIds.has(nodeId))),
      )
      .map((node) => node.id),
  );
}

function takeQuestions(
  entries: readonly AlgorithmQuestionEntry[],
  sessionLength: number,
): readonly AlgorithmQuestion[] {
  return entries.slice(0, sessionLength).map((entry) => entry.question);
}
