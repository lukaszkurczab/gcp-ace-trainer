import type { ContentItemRef, ReviewQueueEntry, TrainingAttempt } from "../../domain";
import { shuffleArray } from "../../utils";
import {
  getFirstUsableAlgorithmRoadmapNode,
  getAlgorithmQuestionEntries,
  isAlgorithmRoadmapNodeSelectable,
  type AlgorithmQuestionEntry,
} from "./algorithmItems";
import type { AlgorithmContentGroup } from "./algorithmContentCatalog";
import type { AlgorithmQuestion, AlgorithmQuestionType } from "./algorithmQuestionTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";
import { getAlgorithmContentCatalog } from "../../content/catalogRepository";
import type { AlgorithmContentCatalog } from "./algorithmContentCatalog";
import {
  buildAlgorithmProgressFacts,
  buildAlgorithmWeakAreaRecommendation,
  isRoadmapPrerequisiteSatisfied,
} from "./algorithmProgress";
import {
  ALGORITHM_MODE_IDS,
  getAlgorithmMode,
  type AlgorithmModeId,
} from "./domain/algorithmModes";
import {
  selectAlgorithmReviewItems,
  type AlgorithmReviewSource,
} from "./algorithmReviewSelection";

export type { AlgorithmReviewSource } from "./algorithmReviewSelection";
export type AlgorithmSessionEntryPoint =
  | "topic_default"
  | "pattern_recognition"
  | "contrast"
  | "due_queue"
  | "session_misses"
  | "mixed_practice"
  | "timed_validation";

export type SelectAlgorithmSessionItemsInput = {
  attempts?: readonly TrainingAttempt[];
  contentCatalog?: AlgorithmContentCatalog;
  mode: AlgorithmModeId;
  nodeId: AlgorithmRoadmapNodeId;
  now?: string;
  reviewItemRefs?: readonly ContentItemRef[];
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

export const ALGORITHM_ENTRY_MODE_IDS = Object.freeze({
  topic_default: ALGORITHM_MODE_IDS.guidedPractice,
  pattern_recognition: ALGORITHM_MODE_IDS.recognizePatterns,
  contrast: ALGORITHM_MODE_IDS.contrastPractice,
  due_queue: ALGORITHM_MODE_IDS.weakAreaReview,
  session_misses: ALGORITHM_MODE_IDS.weakAreaReview,
  mixed_practice: ALGORITHM_MODE_IDS.independentPractice,
  timed_validation: ALGORITHM_MODE_IDS.interviewSimulation,
} as const satisfies Record<AlgorithmSessionEntryPoint, AlgorithmModeId>);

export function getAlgorithmModeIdForEntryPoint(
  entryPoint: AlgorithmSessionEntryPoint,
): AlgorithmModeId {
  const modeId: AlgorithmModeId | undefined = ALGORITHM_ENTRY_MODE_IDS[entryPoint];
  if (!modeId) throw new Error(`Unknown Algorithms entry point: ${entryPoint}`);
  return modeId;
}

export function resolveAlgorithmSessionNode(
  nodeId?: string,
): AlgorithmRoadmapNode {
  if (nodeId === undefined) {
    return getFirstUsableAlgorithmRoadmapNode();
  }

  const node = getAlgorithmSessionNodeById(nodeId);
  if (!isAlgorithmRoadmapNodeSelectable(node)) {
    throw new Error(`Unknown or unavailable Algorithms topic: ${nodeId}`);
  }
  return node;
}

export function getAlgorithmSessionNodeById(nodeId: string): AlgorithmRoadmapNode {
  const node = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`Unknown Algorithms topic: ${nodeId}`);
  return node;
}

export function selectAlgorithmSessionItemsForRoadmapNode(input: {
  contentCatalog?: AlgorithmContentCatalog;
  modeId?: string;
  nodeId: AlgorithmRoadmapNodeId;
  sessionLength: number;
}): readonly AlgorithmQuestion[] {
  const catalog = input.contentCatalog ?? getAlgorithmContentCatalog();
  const entries = getSelectableModeEntries(
    catalog,
    input.modeId ?? ALGORITHM_MODE_IDS.guidedPractice,
  ).filter((entry) => entry.group.roadmapNodeId === input.nodeId);

  return shuffleArray(entries.map((entry) => entry.question)).slice(0, input.sessionLength);
}

export function selectAlgorithmSessionItems(
  input: SelectAlgorithmSessionItemsInput,
): readonly AlgorithmQuestion[] {
  const mode = getAlgorithmMode(input.mode);
  if (mode.id === ALGORITHM_MODE_IDS.weakAreaReview && !input.reviewSource) {
    throw new Error("Algorithms Weak Area Review requires due_queue or session_misses source.");
  }
  const catalog = input.contentCatalog ?? getAlgorithmContentCatalog();
  const entries = getSelectableModeEntries(catalog, input.mode);

  switch (input.mode) {
    case ALGORITHM_MODE_IDS.learnApproach:
      return takeQuestions(
        selectPreferredNodeEntries(entries, input.nodeId, LEARN_ITEM_TYPES),
        input.sessionLength,
      );
    case ALGORITHM_MODE_IDS.guidedPractice:
      return takeQuestions(
        selectPreferredNodeEntries(entries, input.nodeId, DRILL_ITEM_TYPES),
        input.sessionLength,
      );
    case ALGORITHM_MODE_IDS.recognizePatterns:
    case ALGORITHM_MODE_IDS.contrastPractice:
      return takeQuestions(
        selectPreferredNodeEntries(entries, input.nodeId, mode.itemTypes),
        input.sessionLength,
      );
    case ALGORITHM_MODE_IDS.weakAreaReview:
      return selectAlgorithmReviewItems({
        entries,
        reviewedItemRefs: [
          ...(input.attempts ?? []).map((attempt) => attempt.item),
          ...(input.reviewQueueItems ?? []).map((entry) => entry.sourceItem),
        ].filter((ref) => ref.trackId === "algorithms"),
        requestedLength: input.sessionLength,
        source: input.reviewSource === "session_misses"
          ? { itemRefs: input.reviewItemRefs ?? [], kind: "session_misses" }
          : {
              kind: "due_queue",
              now: input.now ?? new Date().toISOString(),
              reviewQueueItems: (input.reviewQueueItems ?? [])
                .filter((entry) => entry.sourceItem.trackId === "algorithms"),
            },
      }).items;
    case ALGORITHM_MODE_IDS.independentPractice:
    case ALGORITHM_MODE_IDS.interviewSimulation:
      return buildAlgorithmMixedPracticeSelection({
        attempts: input.attempts ?? [],
        currentRoadmapNodeId: input.nodeId,
        groups: catalog.getGroups(),
        sessionLength: input.sessionLength,
      });
    default:
      throw new Error(`Unknown Algorithms mode id: ${input.mode}`);
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
