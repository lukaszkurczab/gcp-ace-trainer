import { ALGORITHM_APPROACH_TEMPLATES } from "./algorithmApproaches";
import {
  ALGORITHM_CONTENT_VERSION,
  type AlgorithmApproachId,
  type AlgorithmLearningStage,
  type AlgorithmPatternFamilyId,
} from "./algorithmContentTypes";
import {
  ALGORITHM_QUESTION_TYPES,
  type AlgorithmQuestionType,
} from "./algorithmQuestionTypes";
import {
  ALGORITHM_PATTERN_FAMILIES,
  ALGORITHM_PATTERN_VARIANTS,
  ALGORITHM_PROBLEM_ARCHETYPES,
  ALGORITHM_SKILL_ATOMS,
} from "./algorithmTaxonomy";

export const ALGORITHM_FORBIDDEN_MODEL_TERMS = [
  "readiness",
  "retention",
  "mastery",
  "streak",
  "leaderboard",
  "leetcode",
  "ai-generated",
  "llm-generated",
  "mock",
  "demo",
  "legacy",
  "compatibility",
  "migration",
  "alias",
  "temporary",
  "provisional",
  "placeholder",
  "fallback",
  "draft",
] as const;

export type AlgorithmRoadmapNodeId = string;

export type AlgorithmRoadmapNodeKind =
  | "foundation"
  | "approach"
  | "mechanics"
  | "contrast"
  | "strategy_selection"
  | "mixed_practice";

export type AlgorithmRoadmapStatus = "available";

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
  learningStage: AlgorithmLearningStage;
  minimumActiveItemCount: number;
  order: number;
  patternVariantIds?: readonly string[];
  prerequisiteNodeIds: readonly AlgorithmRoadmapNodeId[];
  prerequisites?: readonly AlgorithmRoadmapPrerequisite[];
  primaryPatternFamilyId?: AlgorithmPatternFamilyId;
  problemArchetypeIds?: readonly string[];
  recommendedItemTypes: readonly AlgorithmQuestionType[];
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
  | "unknown_pattern_variant_id"
  | "unknown_problem_archetype_id"
  | "unknown_skill_atom_id"
  | "unknown_recommended_item_type"
  | "available_node_missing_minimum_active_items"
  | "mixed_practice_marked_beginner"
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

const defaultRecommendedItemTypes = [
  "approach_primer",
  "approach_naming",
  "worked_example",
  "trace_next_step",
  "strategy_choice",
  "complexity_check",
  "solution_comparison",
  "edge_case_drill",
  "common_mistake_diagnosis",
  "test_case_selection",
  "state_selection",
  "output_contract_reasoning",
  "constraint_change",
  "complexity_reasoning",
] as const satisfies readonly AlgorithmQuestionType[];

const algorithmRoadmapNodes = [
  makeNode({
    id: "complexity_and_constraints",
    kind: "foundation",
    label: "Complexity and constraints",
    learningObjectives: [
      "Reject brute force when input size makes it impossible.",
      "Derive time and space cost before choosing a strategy.",
    ],
    learningStage: "foundations",
    minimumActiveItemCount: 35,
    order: 1,
    prerequisiteNodeIds: [],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    recommendedItemTypes: ["approach_naming", "complexity_check", "solution_comparison"],
    skillAtomIds: [
      "derive_time_complexity",
      "derive_space_complexity",
      "evaluate_time_space_tradeoff",
    ],
  }),
  makeNode({
    id: "arrays_and_strings",
    kind: "foundation",
    label: "Arrays and strings",
    learningObjectives: [
      "Track indexed input shape, boundaries, and duplicates.",
      "Separate linear scan mechanics from higher-level strategies.",
    ],
    learningStage: "foundations",
    minimumActiveItemCount: 30,
    order: 2,
    prerequisiteNodeIds: ["complexity_and_constraints"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    recommendedItemTypes: ["approach_naming", "trace_next_step", "edge_case_drill"],
    skillAtomIds: [
      "track_index_boundary",
      "recognize_adjacent_scan",
      "diagnose_order_destroying_transform",
      "diagnose_off_by_one",
      "trace_scan_index",
      "choose_frequency_state",
      "distinguish_presence_from_count",
      "diagnose_data_structure_mismatch",
      "reason_about_seen_state_complexity",
      "reason_about_frequency_counting_complexity",
      "fixed_alphabet_complexity",
      "apply_string_normalization",
      "normalization_before_comparison",
      "streaming_normalization_tradeoff",
      "preserve_relative_order",
      "use_read_write_boundary",
      "reason_about_order_constraint",
      "trace_write_boundary",
      "distinguish_output_space",
      "distinguish_output_contract",
      "diagnose_duplicate_collapse",
      "initialize_duplicate_collapse",
      "avoid_unnecessary_state",
    ],
  }),
  makeNode({
    approachIds: ["hash_map_complement_lookup"],
    id: "hash_map_and_set",
    kind: "approach",
    label: "Hash map and set",
    learningObjectives: [
      "Choose what state should be remembered for lookup.",
      "Explain why lookup state changes pair or frequency reasoning.",
    ],
    minimumActiveItemCount: 40,
    order: 3,
    patternVariantIds: ["lookup_by_value", "complement_lookup", "seen_set"],
    prerequisiteNodeIds: ["arrays_and_strings"],
    primaryPatternFamilyId: "hash_map_and_set",
    problemArchetypeIds: ["find_pair_with_condition", "group_or_count_values"],
    recommendedItemTypes: ["approach_primer", "worked_example", "trace_next_step", "pseudocode_ordering"],
    skillAtomIds: ["choose_lookup_key"],
  }),
  makeNode({
    approachIds: ["pair_scan_sorted_input"],
    id: "two_pointers",
    kind: "mechanics",
    label: "Two pointers",
    learningObjectives: [
      "Use sorted or coordinated boundaries to decide pointer movement.",
      "Explain which candidates are ruled out by each move.",
    ],
    minimumActiveItemCount: 35,
    order: 4,
    patternVariantIds: ["opposite_ends", "pair_scan_sorted_input"],
    prerequisiteNodeIds: ["arrays_and_strings"],
    primaryPatternFamilyId: "two_pointers",
    problemArchetypeIds: ["find_pair_with_condition"],
    recommendedItemTypes: ["approach_primer", "trace_next_step", "subgoal_ordering"],
    skillAtomIds: ["move_decisive_pointer"],
  }),
  makeNode({
    approachIds: ["positive_sliding_window"],
    id: "sliding_window",
    kind: "mechanics",
    label: "Sliding window",
    learningObjectives: [
      "Maintain a contiguous window invariant while boundaries move.",
      "Recognize the signals that make a simple window valid.",
    ],
    minimumActiveItemCount: 40,
    order: 5,
    patternVariantIds: ["fixed_size_window", "variable_size_positive_numbers", "frequency_constraint"],
    prerequisiteNodeIds: ["two_pointers"],
    primaryPatternFamilyId: "sliding_window",
    problemArchetypeIds: ["find_subarray_with_target"],
    recommendedItemTypes: ["approach_primer", "worked_example", "trace_next_step"],
    skillAtomIds: ["maintain_window_invariant"],
  }),
  makeNode({
    id: "prefix_sums",
    kind: "contrast",
    label: "Prefix sums",
    learningObjectives: [
      "Recognize accumulated range state.",
      "Explain when prefix reasoning is safer than a moving window.",
    ],
    minimumActiveItemCount: 35,
    order: 6,
    patternVariantIds: ["range_sum_query", "subarray_sum_with_hash_map", "when_prefix_beats_window"],
    prerequisiteNodeIds: ["sliding_window"],
    primaryPatternFamilyId: "prefix_sums",
    problemArchetypeIds: ["find_subarray_with_target"],
    recommendedItemTypes: ["solution_comparison", "strategy_choice", "edge_case_drill"],
    skillAtomIds: ["detect_window_failure_signal"],
  }),
  makeNode({
    id: "sorting_based",
    kind: "strategy_selection",
    label: "Sorting based",
    learningObjectives: [
      "Recognize when ordering reveals structure.",
      "Account for sorting cost and original-position side effects.",
    ],
    minimumActiveItemCount: 4,
    order: 7,
    patternVariantIds: ["sort_then_scan", "sort_then_two_pointers", "sorting_cost_recognition"],
    prerequisiteNodeIds: ["complexity_and_constraints"],
    primaryPatternFamilyId: "sorting_based",
    problemArchetypeIds: ["find_pair_with_condition", "group_or_count_values"],
    recommendedItemTypes: ["strategy_choice", "solution_comparison", "complexity_check"],
    skillAtomIds: ["recognize_sorting_tradeoff"],
  }),
  makeNode({
    id: "stack",
    kind: "mechanics",
    label: "Stack",
    learningObjectives: [
      "Use latest unresolved state for nested structures.",
      "Trace push and pop mechanics before comparing stack variants.",
    ],
    minimumActiveItemCount: 30,
    order: 8,
    patternVariantIds: ["nested_structure_validation", "undo_or_previous_state"],
    prerequisiteNodeIds: ["arrays_and_strings"],
    primaryPatternFamilyId: "stack",
    problemArchetypeIds: ["validate_nested_structure"],
    recommendedItemTypes: ["approach_primer", "trace_next_step", "subgoal_ordering"],
    skillAtomIds: ["use_last_unresolved_state"],
  }),
  makeNode({
    id: "binary_search",
    kind: "mechanics",
    label: "Binary search",
    learningObjectives: [
      "Identify ordered input or a monotonic predicate.",
      "Trace why each comparison removes part of the search space.",
    ],
    minimumActiveItemCount: 35,
    order: 9,
    patternVariantIds: ["classic_index_search", "lower_upper_bound", "monotonic_predicate_recognition"],
    prerequisiteNodeIds: ["complexity_and_constraints", "arrays_and_strings"],
    primaryPatternFamilyId: "binary_search",
    problemArchetypeIds: ["find_index_in_sorted_input"],
    recommendedItemTypes: ["approach_primer", "trace_next_step", "complexity_check"],
    skillAtomIds: ["identify_monotonic_predicate"],
  }),
  makeNode({
    id: "strategy_selection_core",
    kind: "strategy_selection",
    label: "Core strategy selection",
    learningObjectives: [
      "Choose among lookup, pointer, window, prefix, sorting, stack, and binary-search approaches.",
      "Justify a strategy with constraint and decision signals.",
    ],
    learningStage: "strategy_selection",
    minimumActiveItemCount: 35,
    order: 10,
    prerequisiteNodeIds: ["hash_map_and_set", "two_pointers", "sliding_window", "prefix_sums", "sorting_based", "stack", "binary_search"],
    recommendedItemTypes: ["strategy_choice", "solution_comparison", "approach_naming"],
    skillAtomIds: ["choose_lookup_key", "move_decisive_pointer", "maintain_window_invariant", "identify_monotonic_predicate"],
  }),
  makeContrastNode({
    id: "contrast_hash_map_vs_sorting",
    label: "Hash map vs sorting",
    order: 11,
    prerequisiteNodeIds: ["hash_map_and_set", "sorting_based"],
    skillAtomIds: ["choose_lookup_key", "recognize_sorting_tradeoff"],
  }),
  makeContrastNode({
    id: "contrast_two_pointers_vs_sliding_window",
    label: "Two pointers vs sliding window",
    order: 12,
    prerequisiteNodeIds: ["two_pointers", "sliding_window"],
    skillAtomIds: ["move_decisive_pointer", "maintain_window_invariant"],
  }),
  makeContrastNode({
    id: "contrast_sliding_window_vs_prefix_sums",
    label: "Sliding window vs prefix sums",
    order: 13,
    prerequisiteNodeIds: ["sliding_window", "prefix_sums"],
    skillAtomIds: ["maintain_window_invariant", "detect_window_failure_signal"],
  }),
  makeContrastNode({
    id: "contrast_stack_vs_monotonic_stack_intro",
    label: "Stack vs monotonic stack intro",
    order: 14,
    prerequisiteNodeIds: ["stack"],
    skillAtomIds: ["use_last_unresolved_state", "maintain_monotonic_stack_invariant"],
  }),
  makeContrastNode({
    id: "contrast_binary_search_vs_linear_scan",
    label: "Binary search vs linear scan",
    order: 15,
    prerequisiteNodeIds: ["arrays_and_strings", "binary_search"],
    skillAtomIds: ["track_index_boundary", "identify_monotonic_predicate"],
  }),
  makeNode({
    id: "linked_list",
    kind: "mechanics",
    label: "Linked list",
    minimumActiveItemCount: 1,
    order: 16,
    patternVariantIds: ["pointer_rewiring", "reverse_list"],
    prerequisiteNodeIds: ["arrays_and_strings"],
    primaryPatternFamilyId: "linked_list",
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["reason_linked_list_rewiring"],
  }),
  makeNode({
    id: "recursion_basics",
    kind: "mechanics",
    label: "Recursion basics",
    minimumActiveItemCount: 1,
    order: 17,
    patternVariantIds: ["base_case_recognition", "recursive_decomposition"],
    prerequisiteNodeIds: ["complexity_and_constraints"],
    primaryPatternFamilyId: "recursion_basics",
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["trace_recursive_base_case"],
  }),
  makeNode({
    id: "tree_traversal",
    kind: "mechanics",
    label: "Tree traversal",
    minimumActiveItemCount: 1,
    order: 18,
    patternVariantIds: ["dfs_preorder_inorder_postorder", "path_accumulation"],
    prerequisiteNodeIds: ["recursion_basics"],
    primaryPatternFamilyId: "tree_traversal",
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["carry_tree_traversal_state"],
  }),
  makeNode({
    id: "heap_priority_queue",
    kind: "mechanics",
    label: "Heap and priority queue",
    minimumActiveItemCount: 1,
    order: 19,
    patternVariantIds: ["top_k", "running_extreme"],
    prerequisiteNodeIds: ["complexity_and_constraints"],
    primaryPatternFamilyId: "heap_priority_queue",
    problemArchetypeIds: ["choose_repeated_extreme"],
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["choose_priority_queue_state"],
  }),
  makeNode({
    id: "intervals",
    kind: "mechanics",
    label: "Intervals",
    minimumActiveItemCount: 1,
    order: 20,
    patternVariantIds: ["merge_overlaps", "sweep_line_intro"],
    prerequisiteNodeIds: ["sorting_based"],
    primaryPatternFamilyId: "intervals",
    problemArchetypeIds: ["merge_or_compare_intervals"],
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["reason_about_interval_overlap"],
  }),
  makeNode({
    id: "backtracking",
    kind: "mechanics",
    label: "Backtracking",
    minimumActiveItemCount: 1,
    order: 21,
    patternVariantIds: ["choice_tree", "constraints_and_pruning"],
    prerequisiteNodeIds: ["recursion_basics"],
    primaryPatternFamilyId: "backtracking",
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["prune_backtracking_choice"],
  }),
  makeNode({
    id: "graph_traversal",
    kind: "mechanics",
    label: "Graph traversal",
    minimumActiveItemCount: 1,
    order: 22,
    patternVariantIds: ["adjacency_representation", "visited_state"],
    prerequisiteNodeIds: ["stack"],
    primaryPatternFamilyId: "graph_traversal",
    problemArchetypeIds: ["traverse_connected_state"],
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["track_graph_visited_state"],
  }),
  makeNode({
    id: "greedy_intro",
    kind: "strategy_selection",
    label: "Greedy intro",
    minimumActiveItemCount: 1,
    order: 23,
    patternVariantIds: ["local_choice_signal", "sorting_plus_greedy"],
    prerequisiteNodeIds: ["sorting_based"],
    primaryPatternFamilyId: "greedy_intro",
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["justify_greedy_choice"],
  }),
  makeNode({
    id: "dynamic_programming_intro",
    kind: "strategy_selection",
    label: "Dynamic programming intro",
    minimumActiveItemCount: 1,
    order: 24,
    patternVariantIds: ["state_definition", "transition_choice"],
    prerequisiteNodeIds: ["recursion_basics"],
    primaryPatternFamilyId: "dynamic_programming_intro",
    problemArchetypeIds: ["define_reusable_state"],
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["define_dynamic_programming_state"],
  }),
  makeNode({
    id: "bit_manipulation",
    kind: "mechanics",
    label: "Bit manipulation",
    minimumActiveItemCount: 1,
    order: 25,
    patternVariantIds: ["bitmask_basics", "set_clear_check_bit"],
    prerequisiteNodeIds: ["complexity_and_constraints"],
    primaryPatternFamilyId: "bit_manipulation",
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["apply_bitmask_state"],
  }),
  makeNode({
    id: "math_and_geometry",
    kind: "mechanics",
    label: "Math and geometry",
    minimumActiveItemCount: 1,
    order: 26,
    patternVariantIds: ["modulo_reasoning", "coordinate_reasoning"],
    prerequisiteNodeIds: ["complexity_and_constraints"],
    primaryPatternFamilyId: "math_and_geometry",
    recommendedItemTypes: ["approach_naming"],
    skillAtomIds: ["reason_about_numeric_structure"],
  }),
  makeNode({
    id: "mixed_pattern_practice",
    kind: "mixed_practice",
    label: "Mixed pattern practice",
    learningObjectives: [
      "Separate similar signals without seeing a pattern label first.",
      "Practice interleaving only after multiple families have prior exposure.",
    ],
    learningStage: "mixed_interview_practice",
    minimumActiveItemCount: 35,
    order: 27,
    prerequisiteNodeIds: [
      "strategy_selection_core",
      "contrast_hash_map_vs_sorting",
      "contrast_two_pointers_vs_sliding_window",
      "contrast_sliding_window_vs_prefix_sums",
    ],
    recommendedItemTypes: ["strategy_choice", "solution_comparison", "edge_case_drill"],
    shortDescription: "Interleaved practice mode after mechanics and contrast exposure.",
    status: "available",
  }),
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
    "Curriculum from foundations through pattern mechanics, strategy selection, contrast practice, and mixed practice.",
  edges: algorithmRoadmapEdges,
  id: "algorithms-core-roadmap",
  label: "Algorithms Core Roadmap",
  nodes: algorithmRoadmapNodes,
  status: "available",
} as const satisfies AlgorithmRoadmapTrack;

export function validateAlgorithmRoadmap(
  roadmap: AlgorithmRoadmapTrack,
): AlgorithmRoadmapQualityResult {
  const issues: AlgorithmRoadmapQualityIssue[] = [];
  const nodesById = new Map<AlgorithmRoadmapNodeId, AlgorithmRoadmapNode>();
  const orders = new Set<number>();
  const approachIds = new Set(ALGORITHM_APPROACH_TEMPLATES.map((approach) => approach.id));
  const patternFamilyIds = new Set(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id));
  const patternVariantIds = new Set(ALGORITHM_PATTERN_VARIANTS.map((variant) => variant.id));
  const problemArchetypeIds = new Set(ALGORITHM_PROBLEM_ARCHETYPES.map((archetype) => archetype.id));
  const skillAtomIds = new Set(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id));
  const itemTypes = new Set<string>(ALGORITHM_QUESTION_TYPES);

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
    validateRoadmapRefs(
      node,
      nodesById,
      approachIds,
      patternFamilyIds,
      patternVariantIds,
      problemArchetypeIds,
      skillAtomIds,
      itemTypes,
      issues,
    );
    validateRoadmapPolicy(node, issues);
    validateRoadmapVisibleValues(node, issues, node.id);
  }

  validateRoadmapVisibleValues(roadmap, issues);

  return {
    issues,
    valid: issues.length === 0,
  };
}

type AlgorithmRoadmapNodeInput = Omit<
  Partial<AlgorithmRoadmapNode>,
  "learningObjectives"
> & {
  id: string;
  kind: AlgorithmRoadmapNodeKind;
  label: string;
  order: number;
  learningObjectives?: readonly (AlgorithmRoadmapLearningObjective | string)[];
};

function makeNode(input: AlgorithmRoadmapNodeInput): AlgorithmRoadmapNode {
  const learningObjectives = (input.learningObjectives ??
    [`Practice ${input.label} reasoning with active checks before implementation details.`])
    .map((objective, index) =>
      typeof objective === "string"
        ? {
            id: `${input.id}-objective-${index + 1}`,
            text: objective,
          }
        : objective,
    );

  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    id: input.id,
    kind: input.kind,
    label: input.label,
    learningObjectives,
    learningStage: input.learningStage ?? "pattern_mechanics",
    minimumActiveItemCount: input.minimumActiveItemCount ?? 1,
    order: input.order,
    prerequisiteNodeIds: input.prerequisiteNodeIds ?? ["complexity_and_constraints"],
    recommendedItemTypes: input.recommendedItemTypes ?? defaultRecommendedItemTypes,
    shortDescription: input.shortDescription ??
      `Practice ${input.label} reasoning with active checks before implementation details.`,
    status: input.status ?? "available",
    ...(input.approachIds ? { approachIds: input.approachIds } : {}),
    ...(input.patternVariantIds ? { patternVariantIds: input.patternVariantIds } : {}),
    ...(input.primaryPatternFamilyId ? { primaryPatternFamilyId: input.primaryPatternFamilyId } : {}),
    ...(input.problemArchetypeIds ? { problemArchetypeIds: input.problemArchetypeIds } : {}),
    ...(input.skillAtomIds ? { skillAtomIds: input.skillAtomIds } : {}),
  };
}

function makeContrastNode(input: {
  id: string;
  label: string;
  minimumActiveItemCount?: number;
  order: number;
  prerequisiteNodeIds: readonly string[];
  skillAtomIds: readonly string[];
}): AlgorithmRoadmapNode {
  return makeNode({
    id: input.id,
    kind: "contrast",
    label: input.label,
    learningObjectives: [
      {
        id: `${input.id}-decision-signal`,
        text: `Contrast ${input.label} using decision signals, constraints, and failure modes.`,
      },
    ],
    learningStage: "contrast_practice",
    minimumActiveItemCount: input.minimumActiveItemCount ?? 2,
    order: input.order,
    prerequisiteNodeIds: input.prerequisiteNodeIds,
    recommendedItemTypes: ["strategy_choice", "solution_comparison", "edge_case_drill"],
    skillAtomIds: input.skillAtomIds,
  });
}

function validateRoadmapRefs(
  node: AlgorithmRoadmapNode,
  nodesById: ReadonlyMap<AlgorithmRoadmapNodeId, AlgorithmRoadmapNode>,
  approachIds: ReadonlySet<string>,
  patternFamilyIds: ReadonlySet<string>,
  patternVariantIds: ReadonlySet<string>,
  problemArchetypeIds: ReadonlySet<string>,
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

  for (const patternVariantId of node.patternVariantIds ?? []) {
    if (!patternVariantIds.has(patternVariantId)) {
      issues.push({
        code: "unknown_pattern_variant_id",
        message: `Unknown roadmap pattern variant id: ${patternVariantId}.`,
        nodeId: node.id,
      });
    }
  }

  for (const problemArchetypeId of node.problemArchetypeIds ?? []) {
    if (!problemArchetypeIds.has(problemArchetypeId)) {
      issues.push({
        code: "unknown_problem_archetype_id",
        message: `Unknown roadmap problem archetype id: ${problemArchetypeId}.`,
        nodeId: node.id,
      });
    }
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

function validateRoadmapPolicy(
  node: AlgorithmRoadmapNode,
  issues: AlgorithmRoadmapQualityIssue[],
): void {
  if (node.status === "available" && node.minimumActiveItemCount < 1) {
    issues.push({
      code: "available_node_missing_minimum_active_items",
      message: `Available roadmap node must define a minimum active item threshold: ${node.id}.`,
      nodeId: node.id,
    });
  }

  if (node.id === "mixed_pattern_practice" && node.learningStage !== "mixed_interview_practice") {
    issues.push({
      code: "mixed_practice_marked_beginner",
      message: "Mixed pattern practice must remain an advanced practice mode.",
      nodeId: node.id,
    });
  }
}

function validateRoadmapVisibleValues(
  value: unknown,
  issues: AlgorithmRoadmapQualityIssue[],
  nodeId?: AlgorithmRoadmapNodeId,
): void {
  const serialized = JSON.stringify(value).toLowerCase();

  for (const forbiddenTerm of ALGORITHM_FORBIDDEN_MODEL_TERMS) {
    if (serialized.includes(forbiddenTerm)) {
      issues.push({
        code: "forbidden_visible_term",
        message: `Roadmap visible values include forbidden term: ${forbiddenTerm}.`,
        nodeId,
      });
    }
  }
}
