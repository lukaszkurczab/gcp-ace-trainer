import { ALGORITHM_APPROACH_TEMPLATES } from "./algorithmApproaches";
import {
  ALGORITHM_CONTENT_VERSION,
  ALGORITHM_LATER_TRAINING_ITEM_TYPES,
  ALGORITHM_MVP_TRAINING_ITEM_TYPES,
  ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
  type AlgorithmApproachId,
  type AlgorithmPatternFamilyId,
  type AlgorithmTrainingItemType,
} from "./algorithmContentTypes";
import {
  ALGORITHM_PATTERN_FAMILIES,
  ALGORITHM_SKILL_ATOMS,
} from "./algorithmTaxonomy";

export type AlgorithmRoadmapNodeId =
  | "complexity_basics"
  | "array_string_basics"
  | "hash_map_lookup"
  | "two_pointers_pair_scan"
  | "sliding_window_positive"
  | "prefix_sums_range_reasoning"
  | "stack_nested_structure"
  | "binary_search_sorted_input"
  | "strategy_selection_basics"
  | "mixed_pattern_practice"
  | string;

export type AlgorithmRoadmapNodeKind =
  | "foundation"
  | "approach"
  | "mechanics"
  | "contrast"
  | "strategy_selection"
  | "mixed_practice"
  | "later";

export type AlgorithmRoadmapStatus =
  | "available"
  | "draft"
  | "locked"
  | "coming_later";

export type AlgorithmRoadmapPrerequisite = {
  nodeId: AlgorithmRoadmapNodeId;
  reason: string;
};

export type AlgorithmRoadmapLearningObjective = {
  id: string;
  text: string;
};

export type AlgorithmRoadmapNode = {
  approachIds?: readonly AlgorithmApproachId[];
  contentVersion: string;
  id: AlgorithmRoadmapNodeId;
  kind: AlgorithmRoadmapNodeKind;
  label: string;
  learningObjectives: readonly AlgorithmRoadmapLearningObjective[];
  order: number;
  prerequisiteNodeIds: readonly AlgorithmRoadmapNodeId[];
  prerequisites?: readonly AlgorithmRoadmapPrerequisite[];
  primaryPatternFamilyId?: AlgorithmPatternFamilyId;
  recommendedItemTypes: readonly AlgorithmTrainingItemType[];
  shortDescription: string;
  skillAtomIds?: readonly string[];
  status: AlgorithmRoadmapStatus;
};

export type AlgorithmRoadmapEdge = {
  fromNodeId: AlgorithmRoadmapNodeId;
  reason: string;
  toNodeId: AlgorithmRoadmapNodeId;
};

export type AlgorithmRoadmapTrack = {
  contentVersion: string;
  description: string;
  edges: readonly AlgorithmRoadmapEdge[];
  id: string;
  label: string;
  nodes: readonly AlgorithmRoadmapNode[];
  status: AlgorithmRoadmapStatus;
};

export type AlgorithmRoadmapQualityIssueCode =
  | "duplicate_node_id"
  | "duplicate_order"
  | "missing_prerequisite_node"
  | "forward_prerequisite"
  | "unknown_approach_id"
  | "unknown_pattern_family_id"
  | "unknown_skill_atom_id"
  | "unknown_recommended_item_type"
  | "forbidden_visible_term";

export type AlgorithmRoadmapQualityIssue = {
  code: AlgorithmRoadmapQualityIssueCode;
  message: string;
  nodeId?: AlgorithmRoadmapNodeId;
};

export type AlgorithmRoadmapQualityResult = {
  issues: AlgorithmRoadmapQualityIssue[];
  valid: boolean;
};

const algorithmRoadmapNodes = [
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "complexity_basics",
    kind: "foundation",
    label: "Complexity basics",
    learningObjectives: [
      {
        id: "reject-quadratic-for-large-inputs",
        text: "Use input size to reject nested pair enumeration when it will not scale.",
      },
      {
        id: "explain-time-and-space-cost",
        text: "Explain time and space cost before choosing a strategy.",
      },
    ],
    order: 1,
    prerequisiteNodeIds: [],
    primaryPatternFamilyId: "complexity_basics",
    recommendedItemTypes: ["approach_primer", "complexity_check"],
    shortDescription: "Build the constraint and Big O reasoning needed before choosing approaches.",
    skillAtomIds: ["recognize_n2_too_slow_for_large_n"],
    status: "available",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "array_string_basics",
    kind: "foundation",
    label: "Array and string basics",
    learningObjectives: [
      {
        id: "identify-contiguous-input-shapes",
        text: "Recognize contiguous input shapes used by window, prefix, and scan approaches.",
      },
      {
        id: "track-index-boundaries",
        text: "Track index boundaries and empty-input cases without starting from full code.",
      },
    ],
    order: 2,
    prerequisiteNodeIds: ["complexity_basics"],
    recommendedItemTypes: ["trace_drill", "edge_case_drill"],
    shortDescription: "Prepare the input-shape reasoning used by early array and string approaches.",
    skillAtomIds: ["recognize_n2_too_slow_for_large_n"],
    status: "available",
  },
  {
    approachIds: ["hash_map_complement_lookup"],
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "hash_map_lookup",
    kind: "approach",
    label: "Hash map lookup",
    learningObjectives: [
      {
        id: "explain-lookup-state",
        text: "Explain what must be stored before each lookup.",
      },
      {
        id: "choose-complement-lookup",
        text: "Choose complement lookup when a scan needs fast membership checks.",
      },
    ],
    order: 3,
    prerequisiteNodeIds: ["array_string_basics"],
    primaryPatternFamilyId: "hash_map_and_set",
    recommendedItemTypes: ["approach_primer", "worked_example", "trace_next_step"],
    shortDescription: "Learn one-pass lookup mechanics before broader strategy selection.",
    skillAtomIds: ["explain_hash_map_average_lookup"],
    status: "available",
  },
  {
    approachIds: ["sorted_two_pointers_pair_scan"],
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "two_pointers_pair_scan",
    kind: "mechanics",
    label: "Two pointers pair scan",
    learningObjectives: [
      {
        id: "use-sorted-pair-signal",
        text: "Use sorted input and pair comparison to decide which boundary moves.",
      },
      {
        id: "preserve-pointer-invariant",
        text: "Explain why discarded pair boundaries no longer need to be checked.",
      },
    ],
    order: 4,
    prerequisiteNodeIds: ["hash_map_lookup"],
    primaryPatternFamilyId: "two_pointers",
    recommendedItemTypes: ["approach_primer", "trace_next_step", "subgoal_ordering"],
    shortDescription: "Practice boundary movement after hash lookup mechanics are grounded.",
    skillAtomIds: ["choose_two_pointers_for_sorted_pair_condition"],
    status: "available",
  },
  {
    approachIds: ["positive_sliding_window"],
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "sliding_window_positive",
    kind: "mechanics",
    label: "Positive sliding window",
    learningObjectives: [
      {
        id: "maintain-window-state",
        text: "Maintain a contiguous window state while expanding and shrinking.",
      },
      {
        id: "connect-positive-values-to-window-movement",
        text: "Use positive values as the signal that sum movement is predictable.",
      },
    ],
    order: 5,
    prerequisiteNodeIds: ["two_pointers_pair_scan"],
    primaryPatternFamilyId: "sliding_window",
    recommendedItemTypes: ["approach_primer", "worked_example", "trace_next_step"],
    shortDescription: "Teach window mechanics only after boundary reasoning is introduced.",
    skillAtomIds: [
      "maintain_sliding_window_invariant",
      "recognize_positive_numbers_sliding_window_signal",
    ],
    status: "draft",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "prefix_sums_range_reasoning",
    kind: "contrast",
    label: "Prefix sums range reasoning",
    learningObjectives: [
      {
        id: "recognize-range-accumulation",
        text: "Recognize when accumulated range state is a better fit than moving a window.",
      },
      {
        id: "contrast-window-with-prefix",
        text: "Contrast positive-window reasoning with arbitrary range totals.",
      },
    ],
    order: 6,
    prerequisiteNodeIds: ["sliding_window_positive"],
    primaryPatternFamilyId: "prefix_sums",
    recommendedItemTypes: ["solution_comparison", "strategy_choice", "edge_case_drill"],
    shortDescription: "Introduce range reasoning through contrast with sliding window assumptions.",
    skillAtomIds: ["detect_negative_numbers_break_simple_window_sum"],
    status: "draft",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "stack_nested_structure",
    kind: "mechanics",
    label: "Stack nested structure",
    learningObjectives: [
      {
        id: "explain-last-unresolved-state",
        text: "Explain why the latest unresolved item controls nested-structure validation.",
      },
      {
        id: "trace-stack-push-pop",
        text: "Trace push and pop state before comparing this approach with scans.",
      },
    ],
    order: 7,
    prerequisiteNodeIds: ["prefix_sums_range_reasoning"],
    primaryPatternFamilyId: "stack",
    recommendedItemTypes: ["approach_primer", "trace_next_step", "subgoal_ordering"],
    shortDescription: "Add last-in-first-out mechanics as a different state model.",
    skillAtomIds: ["explain_stack_for_nested_structure"],
    status: "draft",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "binary_search_sorted_input",
    kind: "mechanics",
    label: "Binary search sorted input",
    learningObjectives: [
      {
        id: "identify-ordered-boundary",
        text: "Identify sorted input or an ordered boundary before choosing binary search.",
      },
      {
        id: "trace-search-space-reduction",
        text: "Trace how each comparison reduces the remaining search space.",
      },
    ],
    order: 8,
    prerequisiteNodeIds: ["stack_nested_structure"],
    primaryPatternFamilyId: "binary_search",
    recommendedItemTypes: ["approach_primer", "trace_next_step", "complexity_check"],
    shortDescription: "Teach ordered search after several simpler state models are available.",
    skillAtomIds: ["identify_binary_search_sorted_input_signal"],
    status: "draft",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "strategy_selection_basics",
    kind: "strategy_selection",
    label: "Strategy selection basics",
    learningObjectives: [
      {
        id: "choose-from-core-approaches",
        text: "Choose among lookup, pointer, window, prefix, stack, and ordered-search approaches.",
      },
      {
        id: "justify-selection-with-signals",
        text: "Justify an approach with constraint and decision signals instead of labels alone.",
      },
    ],
    order: 9,
    prerequisiteNodeIds: ["binary_search_sorted_input"],
    recommendedItemTypes: ["strategy_choice", "solution_comparison", "approach_naming"],
    shortDescription: "Move from mechanics to strategy recognition across the first core approaches.",
    skillAtomIds: [
      "explain_hash_map_average_lookup",
      "choose_two_pointers_for_sorted_pair_condition",
      "identify_binary_search_sorted_input_signal",
    ],
    status: "draft",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: "mixed_pattern_practice",
    kind: "mixed_practice",
    label: "Mixed pattern practice",
    learningObjectives: [
      {
        id: "separate-similar-signals",
        text: "Separate similar signals across core approaches without seeing the pattern label first.",
      },
      {
        id: "practice-contrast-before-independent-work",
        text: "Practice contrast and item mixing before later independent attempts.",
      },
    ],
    order: 10,
    prerequisiteNodeIds: ["strategy_selection_basics"],
    recommendedItemTypes: ["strategy_choice", "solution_comparison", "edge_case_drill"],
    shortDescription: "Draft endpoint for interleaving after foundations, mechanics, and strategy selection.",
    status: "coming_later",
  },
] as const satisfies readonly AlgorithmRoadmapNode[];

const algorithmRoadmapEdges = algorithmRoadmapNodes.flatMap((node) =>
  node.prerequisiteNodeIds.map((prerequisiteNodeId) => ({
    fromNodeId: prerequisiteNodeId,
    reason: "Roadmap sequence prerequisite.",
    toNodeId: node.id,
  })),
);

export const ALGORITHM_ROADMAP = {
  contentVersion: ALGORITHM_CONTENT_VERSION,
  description:
    "Draft learning path from foundations through mechanics, strategy selection, and later mixed practice.",
  edges: algorithmRoadmapEdges,
  id: "algorithms-core-roadmap",
  label: "Algorithms Core Roadmap",
  nodes: algorithmRoadmapNodes,
  status: "draft",
} as const satisfies AlgorithmRoadmapTrack;

export function validateAlgorithmRoadmap(
  roadmap: AlgorithmRoadmapTrack,
): AlgorithmRoadmapQualityResult {
  const issues: AlgorithmRoadmapQualityIssue[] = [];
  const nodesById = new Map<AlgorithmRoadmapNodeId, AlgorithmRoadmapNode>();
  const orders = new Set<number>();
  const approachIds = new Set(ALGORITHM_APPROACH_TEMPLATES.map((approach) => approach.id));
  const patternFamilyIds = new Set(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id));
  const skillAtomIds = new Set(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id));
  const itemTypes = new Set<string>([
    ...ALGORITHM_MVP_TRAINING_ITEM_TYPES,
    ...ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
    ...ALGORITHM_LATER_TRAINING_ITEM_TYPES,
  ]);

  for (const node of roadmap.nodes) {
    if (nodesById.has(node.id)) {
      issues.push({
        code: "duplicate_node_id",
        message: `Duplicate roadmap node id: ${node.id}.`,
        nodeId: node.id,
      });
    } else {
      nodesById.set(node.id, node);
    }

    if (orders.has(node.order)) {
      issues.push({
        code: "duplicate_order",
        message: `Duplicate roadmap node order: ${node.order}.`,
        nodeId: node.id,
      });
    } else {
      orders.add(node.order);
    }
  }

  for (const node of roadmap.nodes) {
    validateRoadmapRefs(node, nodesById, approachIds, patternFamilyIds, skillAtomIds, itemTypes, issues);
    validateRoadmapVisibleValues(node, issues);
  }

  validateRoadmapVisibleValues(roadmap, issues);

  return {
    issues,
    valid: issues.length === 0,
  };
}

function validateRoadmapRefs(
  node: AlgorithmRoadmapNode,
  nodesById: ReadonlyMap<AlgorithmRoadmapNodeId, AlgorithmRoadmapNode>,
  approachIds: ReadonlySet<string>,
  patternFamilyIds: ReadonlySet<string>,
  skillAtomIds: ReadonlySet<string>,
  itemTypes: ReadonlySet<string>,
  issues: AlgorithmRoadmapQualityIssue[],
): void {
  for (const prerequisiteNodeId of node.prerequisiteNodeIds) {
    const prerequisiteNode = nodesById.get(prerequisiteNodeId);

    if (!prerequisiteNode) {
      issues.push({
        code: "missing_prerequisite_node",
        message: `Roadmap prerequisite does not exist: ${prerequisiteNodeId}.`,
        nodeId: node.id,
      });
      continue;
    }

    if (prerequisiteNode.order >= node.order) {
      issues.push({
        code: "forward_prerequisite",
        message: `Roadmap prerequisite must come before dependent node: ${prerequisiteNodeId} -> ${node.id}.`,
        nodeId: node.id,
      });
    }
  }

  for (const approachId of node.approachIds ?? []) {
    if (!approachIds.has(approachId)) {
      issues.push({
        code: "unknown_approach_id",
        message: `Unknown roadmap approach id: ${approachId}.`,
        nodeId: node.id,
      });
    }
  }

  if (node.primaryPatternFamilyId && !patternFamilyIds.has(node.primaryPatternFamilyId)) {
    issues.push({
      code: "unknown_pattern_family_id",
      message: `Unknown roadmap pattern family id: ${node.primaryPatternFamilyId}.`,
      nodeId: node.id,
    });
  }

  for (const skillAtomId of node.skillAtomIds ?? []) {
    if (!skillAtomIds.has(skillAtomId)) {
      issues.push({
        code: "unknown_skill_atom_id",
        message: `Unknown roadmap skill atom id: ${skillAtomId}.`,
        nodeId: node.id,
      });
    }
  }

  for (const itemType of node.recommendedItemTypes) {
    if (!itemTypes.has(itemType)) {
      issues.push({
        code: "unknown_recommended_item_type",
        message: `Unknown roadmap recommended item type: ${itemType}.`,
        nodeId: node.id,
      });
    }
  }
}

function validateRoadmapVisibleValues(
  value: unknown,
  issues: AlgorithmRoadmapQualityIssue[],
  nodeId?: AlgorithmRoadmapNodeId,
): void {
  const serialized = JSON.stringify(value).toLowerCase();
  const tokens = new Set(serialized.split(/[^a-z0-9]+/).filter(Boolean));

  for (const forbiddenTerm of FORBIDDEN_ROADMAP_VISIBLE_TERMS) {
    if (tokens.has(forbiddenTerm)) {
      issues.push({
        code: "forbidden_visible_term",
        message: `Roadmap visible values include forbidden term: ${forbiddenTerm}.`,
        nodeId,
      });
    }
  }
}

const FORBIDDEN_ROADMAP_VISIBLE_TERMS = [
  "readiness",
  "retention",
  "mastery",
  "mastered",
  "strong",
  "weak",
  "streak",
  "level",
  "badge",
  "leaderboard",
  "leetcode",
  "ai",
  "llm",
  "chat",
  "generated",
] as const;
