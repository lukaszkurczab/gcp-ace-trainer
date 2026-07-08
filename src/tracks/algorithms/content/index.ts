import type { TrainingItem } from "../../../domain/training";
import {
  type ContentPackGroup,
  type ContentPackGroupManifest,
  type ContentPackManifest,
  validateContentPackManifest,
} from "../../contentPack";
import type { AlgorithmTrainingItem } from "../algorithmContentTypes";
import { ALGORITHM_CONTENT_VERSION } from "../algorithmContentTypes";
import { validateAlgorithmTrainingItem } from "../algorithmContentQuality";
import { ALGORITHM_ROADMAP, type AlgorithmRoadmapNodeId } from "../algorithmRoadmap";
import manifest from "./manifest.json";
import arraysAndStringsQuestions from "./items/arrays-and-strings";
import backtrackingQuestions from "./items/backtracking/questions.json";
import binarySearchQuestions from "./items/binary-search/questions.json";
import bitManipulationQuestions from "./items/bit-manipulation/questions.json";
import complexityAndConstraintsQuestions from "./items/complexity-and-constraints/questions.json";
import contrastBinarySearchVsLinearScanQuestions from "./items/contrast-binary-search-vs-linear-scan/questions.json";
import contrastHashMapVsSortingQuestions from "./items/contrast-hash-map-vs-sorting/questions.json";
import contrastSlidingWindowVsPrefixSumsQuestions from "./items/contrast-sliding-window-vs-prefix-sums/questions.json";
import contrastStackVsMonotonicStackIntroQuestions from "./items/contrast-stack-vs-monotonic-stack-intro/questions.json";
import contrastTwoPointersVsSlidingWindowQuestions from "./items/contrast-two-pointers-vs-sliding-window/questions.json";
import dynamicProgrammingIntroQuestions from "./items/dynamic-programming-intro/questions.json";
import graphTraversalQuestions from "./items/graph-traversal/questions.json";
import greedyIntroQuestions from "./items/greedy-intro/questions.json";
import hashMapAndSetQuestions from "./items/hash-map-and-set/questions.json";
import heapPriorityQueueQuestions from "./items/heap-priority-queue/questions.json";
import intervalsQuestions from "./items/intervals/questions.json";
import linkedListQuestions from "./items/linked-list/questions.json";
import mathAndGeometryQuestions from "./items/math-and-geometry/questions.json";
import mixedPatternPracticeQuestions from "./items/mixed-pattern-practice/questions.json";
import prefixSumsQuestions from "./items/prefix-sums/questions.json";
import recursionBasicsQuestions from "./items/recursion-basics/questions.json";
import slidingWindowQuestions from "./items/sliding-window/questions.json";
import sortingBasedQuestions from "./items/sorting-based/questions.json";
import stackQuestions from "./items/stack/questions.json";
import strategySelectionCoreQuestions from "./items/strategy-selection-core/questions.json";
import treeTraversalQuestions from "./items/tree-traversal/questions.json";
import twoPointersQuestions from "./items/two-pointers/questions.json";

export type AlgorithmContentGroup = ContentPackGroup<
  AlgorithmTrainingItem & TrainingItem,
  AlgorithmRoadmapNodeId
>;

export const algorithmContentManifest = manifest as ContentPackManifest<
  "algorithms",
  AlgorithmRoadmapNodeId
>;

const algorithmQuestionFilesByPath = {
  "items/arrays-and-strings/questions.json": arraysAndStringsQuestions,
  "items/backtracking/questions.json": backtrackingQuestions,
  "items/binary-search/questions.json": binarySearchQuestions,
  "items/bit-manipulation/questions.json": bitManipulationQuestions,
  "items/complexity-and-constraints/questions.json": complexityAndConstraintsQuestions,
  "items/contrast-binary-search-vs-linear-scan/questions.json": contrastBinarySearchVsLinearScanQuestions,
  "items/contrast-hash-map-vs-sorting/questions.json": contrastHashMapVsSortingQuestions,
  "items/contrast-sliding-window-vs-prefix-sums/questions.json": contrastSlidingWindowVsPrefixSumsQuestions,
  "items/contrast-stack-vs-monotonic-stack-intro/questions.json": contrastStackVsMonotonicStackIntroQuestions,
  "items/contrast-two-pointers-vs-sliding-window/questions.json": contrastTwoPointersVsSlidingWindowQuestions,
  "items/dynamic-programming-intro/questions.json": dynamicProgrammingIntroQuestions,
  "items/graph-traversal/questions.json": graphTraversalQuestions,
  "items/greedy-intro/questions.json": greedyIntroQuestions,
  "items/hash-map-and-set/questions.json": hashMapAndSetQuestions,
  "items/heap-priority-queue/questions.json": heapPriorityQueueQuestions,
  "items/intervals/questions.json": intervalsQuestions,
  "items/linked-list/questions.json": linkedListQuestions,
  "items/math-and-geometry/questions.json": mathAndGeometryQuestions,
  "items/mixed-pattern-practice/questions.json": mixedPatternPracticeQuestions,
  "items/prefix-sums/questions.json": prefixSumsQuestions,
  "items/recursion-basics/questions.json": recursionBasicsQuestions,
  "items/sliding-window/questions.json": slidingWindowQuestions,
  "items/sorting-based/questions.json": sortingBasedQuestions,
  "items/stack/questions.json": stackQuestions,
  "items/strategy-selection-core/questions.json": strategySelectionCoreQuestions,
  "items/tree-traversal/questions.json": treeTraversalQuestions,
  "items/two-pointers/questions.json": twoPointersQuestions,
} as const satisfies Record<string, unknown>;

export const algorithmContentGroups = validateAlgorithmContentGroups(
  algorithmContentManifest.groups.map(makeContentGroup),
);

export const algorithmContentItems = orderAlgorithmContentItems(algorithmContentGroups);

function makeContentGroup(
  groupManifest: ContentPackGroupManifest<AlgorithmRoadmapNodeId>,
): AlgorithmContentGroup {
  const items = readQuestionFile(groupManifest.questionFile);

  return {
    folderName: groupManifest.folderName,
    itemCount: Array.isArray(items) ? items.length : 0,
    items: items as readonly (AlgorithmTrainingItem & TrainingItem)[],
    questionFile: groupManifest.questionFile,
    roadmapNodeId: groupManifest.roadmapNodeId,
  };
}

function readQuestionFile(questionFile: string): unknown {
  return algorithmQuestionFilesByPath[questionFile as keyof typeof algorithmQuestionFilesByPath];
}

function validateAlgorithmContentGroups(
  groups: readonly AlgorithmContentGroup[],
): readonly AlgorithmContentGroup[] {
  const issues = validateContentPackManifest({
    expectedContentVersion: ALGORITHM_CONTENT_VERSION,
    expectedTrackId: "algorithms",
    getItemId: (item) => item.id,
    getItemTrackId: (item) => item.trackId,
    groups,
    manifest: algorithmContentManifest,
  });
  const roadmapNodesById = new Map(ALGORITHM_ROADMAP.nodes.map((node) => [node.id, node]));
  const manifestQuestionFiles = new Set(algorithmContentManifest.groups.map((group) => group.questionFile));

  for (const questionFile of Object.keys(algorithmQuestionFilesByPath)) {
    if (!manifestQuestionFiles.has(questionFile)) {
      issues.push(`Algorithms content imports ${questionFile}, but the file is not listed in the manifest.`);
    }
  }

  for (const group of groups) {
    const roadmapNode = roadmapNodesById.get(group.roadmapNodeId);

    if (!roadmapNode) {
      issues.push(`Algorithms content group references unknown roadmap node: ${group.roadmapNodeId}.`);
    }

    for (const item of group.items) {
      const itemLabel = item.id || `${group.roadmapNodeId}:unknown-item`;

      if (item.roadmapNodeId !== group.roadmapNodeId) {
        issues.push(
          `Algorithms content item ${itemLabel} is stored under ${group.roadmapNodeId} but references ${String(item.roadmapNodeId)}.`,
        );
      }

      if (item.status === "active") {
        const itemRoadmapNode = item.roadmapNodeId ? roadmapNodesById.get(item.roadmapNodeId) : undefined;

        if (!itemRoadmapNode) {
          issues.push(`Active Algorithms content item ${itemLabel} references unknown roadmap node: ${String(item.roadmapNodeId)}.`);
        }
      }

      for (const issue of validateAlgorithmTrainingItem(item).issues) {
        issues.push(`Algorithms content item ${itemLabel}: ${issue.message}`);
      }
    }
  }

  if (issues.length > 0) {
    throw new Error(issues.join("\n"));
  }

  return groups;
}

function orderAlgorithmContentItems(
  groups: readonly AlgorithmContentGroup[],
): readonly (AlgorithmTrainingItem & TrainingItem)[] {
  const itemsById = new Map(groups.flatMap((group) => group.items.map((item) => [item.id, item] as const)));
  const orderedItems: (AlgorithmTrainingItem & TrainingItem)[] = [];
  const issues: string[] = [];
  const orderedItemIds = new Set<string>();

  for (const itemId of algorithmContentManifest.itemOrder ?? []) {
    if (orderedItemIds.has(itemId)) {
      issues.push(`Algorithms content manifest itemOrder duplicates item: ${itemId}.`);
      continue;
    }

    orderedItemIds.add(itemId);

    const item = itemsById.get(itemId);

    if (!item) {
      issues.push(`Algorithms content manifest itemOrder references missing item: ${itemId}.`);
      continue;
    }

    orderedItems.push(item);
  }

  if (orderedItems.length !== itemsById.size) {
    const missingOrderedIds = [...itemsById.keys()].filter((itemId) => !orderedItemIds.has(itemId));
    issues.push(`Algorithms content manifest itemOrder omits items: ${missingOrderedIds.join(", ")}.`);
  }

  if (issues.length > 0) {
    throw new Error(issues.join("\n"));
  }

  return orderedItems;
}
