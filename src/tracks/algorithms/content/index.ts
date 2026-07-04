import type { TrainingItem } from "../../../domain/training";
import type { AlgorithmTrainingItem } from "../algorithmContentTypes";
import { validateAlgorithmTrainingItem } from "../algorithmContentQuality";
import { ALGORITHM_ROADMAP, type AlgorithmRoadmapNodeId } from "../algorithmRoadmap";
import manifest from "./manifest.json";
import arraysAndStringsQuestions from "./items/arrays-and-strings/questions.json";
import binarySearchQuestions from "./items/binary-search/questions.json";
import complexityAndConstraintsQuestions from "./items/complexity-and-constraints/questions.json";
import contrastBinarySearchVsLinearScanQuestions from "./items/contrast-binary-search-vs-linear-scan/questions.json";
import contrastHashMapVsSortingQuestions from "./items/contrast-hash-map-vs-sorting/questions.json";
import contrastSlidingWindowVsPrefixSumsQuestions from "./items/contrast-sliding-window-vs-prefix-sums/questions.json";
import contrastStackVsMonotonicStackIntroQuestions from "./items/contrast-stack-vs-monotonic-stack-intro/questions.json";
import contrastTwoPointersVsSlidingWindowQuestions from "./items/contrast-two-pointers-vs-sliding-window/questions.json";
import hashMapAndSetQuestions from "./items/hash-map-and-set/questions.json";
import mixedPatternPracticeQuestions from "./items/mixed-pattern-practice/questions.json";
import prefixSumsQuestions from "./items/prefix-sums/questions.json";
import slidingWindowQuestions from "./items/sliding-window/questions.json";
import sortingBasedQuestions from "./items/sorting-based/questions.json";
import stackQuestions from "./items/stack/questions.json";
import strategySelectionCoreQuestions from "./items/strategy-selection-core/questions.json";
import twoPointersQuestions from "./items/two-pointers/questions.json";

export type AlgorithmContentGroup = {
  folderName: string;
  itemCount: number;
  items: readonly (AlgorithmTrainingItem & TrainingItem)[];
  questionFile: string;
  roadmapNodeId: AlgorithmRoadmapNodeId;
};

const rawAlgorithmContentGroups = [
  makeContentGroup("arrays_and_strings", "arrays-and-strings", arraysAndStringsQuestions),
  makeContentGroup("binary_search", "binary-search", binarySearchQuestions),
  makeContentGroup("complexity_and_constraints", "complexity-and-constraints", complexityAndConstraintsQuestions),
  makeContentGroup("contrast_binary_search_vs_linear_scan", "contrast-binary-search-vs-linear-scan", contrastBinarySearchVsLinearScanQuestions),
  makeContentGroup("contrast_hash_map_vs_sorting", "contrast-hash-map-vs-sorting", contrastHashMapVsSortingQuestions),
  makeContentGroup("contrast_sliding_window_vs_prefix_sums", "contrast-sliding-window-vs-prefix-sums", contrastSlidingWindowVsPrefixSumsQuestions),
  makeContentGroup("contrast_stack_vs_monotonic_stack_intro", "contrast-stack-vs-monotonic-stack-intro", contrastStackVsMonotonicStackIntroQuestions),
  makeContentGroup("contrast_two_pointers_vs_sliding_window", "contrast-two-pointers-vs-sliding-window", contrastTwoPointersVsSlidingWindowQuestions),
  makeContentGroup("hash_map_and_set", "hash-map-and-set", hashMapAndSetQuestions),
  makeContentGroup("mixed_pattern_practice", "mixed-pattern-practice", mixedPatternPracticeQuestions),
  makeContentGroup("prefix_sums", "prefix-sums", prefixSumsQuestions),
  makeContentGroup("sliding_window", "sliding-window", slidingWindowQuestions),
  makeContentGroup("sorting_based", "sorting-based", sortingBasedQuestions),
  makeContentGroup("stack", "stack", stackQuestions),
  makeContentGroup("strategy_selection_core", "strategy-selection-core", strategySelectionCoreQuestions),
  makeContentGroup("two_pointers", "two-pointers", twoPointersQuestions),
] as const satisfies readonly AlgorithmContentGroup[];

export const algorithmContentGroups = validateAlgorithmContentGroups(rawAlgorithmContentGroups);

export const algorithmContentItems = orderAlgorithmContentItems(algorithmContentGroups);

function makeContentGroup(
  roadmapNodeId: AlgorithmRoadmapNodeId,
  folderName: string,
  items: unknown,
): AlgorithmContentGroup {
  const questionFile = `items/${folderName}/questions.json`;

  return {
    folderName,
    itemCount: Array.isArray(items) ? items.length : 0,
    items: items as readonly (AlgorithmTrainingItem & TrainingItem)[],
    questionFile,
    roadmapNodeId,
  };
}

function validateAlgorithmContentGroups(
  groups: readonly AlgorithmContentGroup[],
): readonly AlgorithmContentGroup[] {
  const issues: string[] = [];
  const itemIds = new Set<string>();
  const roadmapNodesById = new Map(ALGORITHM_ROADMAP.nodes.map((node) => [node.id, node]));
  const manifestGroupsByNodeId = new Map(
    manifest.groups.map((group) => [group.roadmapNodeId, group]),
  );

  if (manifest.trackId !== "algorithms") {
    issues.push(`Algorithms content manifest trackId must be "algorithms"; received ${String(manifest.trackId)}.`);
  }

  for (const group of groups) {
    const manifestGroup = manifestGroupsByNodeId.get(group.roadmapNodeId);

    if (!manifestGroup) {
      issues.push(`Algorithms content group missing from manifest: ${group.roadmapNodeId}.`);
    } else {
      if (manifestGroup.folderName !== group.folderName) {
        issues.push(`Algorithms content group ${group.roadmapNodeId} folder mismatch: ${group.folderName}.`);
      }
      if (manifestGroup.questionFile !== group.questionFile) {
        issues.push(`Algorithms content group ${group.roadmapNodeId} question file mismatch: ${group.questionFile}.`);
      }
      if (manifestGroup.itemCount !== group.items.length) {
        issues.push(`Algorithms content group ${group.roadmapNodeId} item count mismatch: ${group.items.length}.`);
      }
    }

    const roadmapNode = roadmapNodesById.get(group.roadmapNodeId);

    if (!roadmapNode) {
      issues.push(`Algorithms content group references unknown roadmap node: ${group.roadmapNodeId}.`);
    }

    for (const item of group.items) {
      const itemLabel = item.id || `${group.roadmapNodeId}:unknown-item`;

      if (item.trackId !== "algorithms") {
        issues.push(`Algorithms content item ${itemLabel} has invalid trackId: ${String(item.trackId)}.`);
      }

      if (item.roadmapNodeId !== group.roadmapNodeId) {
        issues.push(
          `Algorithms content item ${itemLabel} is stored under ${group.roadmapNodeId} but references ${String(item.roadmapNodeId)}.`,
        );
      }

      if (itemIds.has(item.id)) {
        issues.push(`Duplicate Algorithms content item id: ${item.id}.`);
      } else {
        itemIds.add(item.id);
      }

      if (item.status === "active") {
        const itemRoadmapNode = item.roadmapNodeId ? roadmapNodesById.get(item.roadmapNodeId) : undefined;

        if (!itemRoadmapNode) {
          issues.push(`Active Algorithms content item ${itemLabel} references unknown roadmap node: ${String(item.roadmapNodeId)}.`);
        } else if (itemRoadmapNode.status !== "available") {
          issues.push(`Active Algorithms content item ${itemLabel} references unavailable roadmap node: ${itemRoadmapNode.id}.`);
        }
      }

      for (const issue of validateAlgorithmTrainingItem(item).issues) {
        issues.push(`Algorithms content item ${itemLabel}: ${issue.message}`);
      }
    }
  }

  if (manifest.itemCount !== itemIds.size) {
    issues.push(`Algorithms content manifest item count mismatch: ${itemIds.size}.`);
  }

  if (manifest.groups.length !== groups.length) {
    issues.push(`Algorithms content manifest group count mismatch: ${groups.length}.`);
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

  for (const itemId of manifest.itemOrder) {
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
