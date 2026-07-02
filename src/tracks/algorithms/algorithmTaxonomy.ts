import {
  ALGORITHM_CONTENT_VERSION,
  type AlgorithmPatternFamily,
  type AlgorithmPatternFamilyId,
  type AlgorithmPatternVariant,
  type AlgorithmProblemArchetype,
  type AlgorithmSkillAtom,
} from "./algorithmContentTypes";

const familyCopy: Record<AlgorithmPatternFamilyId, {
  description: string;
  label: string;
  signals: readonly string[];
}> = {
  arrays_and_strings: {
    description: "Reason about indexed sequences, character data, duplicates, and local scan state.",
    label: "Arrays and strings",
    signals: ["Input is an indexed sequence.", "Correctness depends on positions, boundaries, or duplicates."],
  },
  backtracking: {
    description: "Explore a choice tree while pruning invalid partial states.",
    label: "Backtracking",
    signals: ["The answer is assembled through reversible choices.", "Constraints can prune partial candidates."],
  },
  binary_search: {
    description: "Use ordered structure or a monotonic predicate to shrink the search space.",
    label: "Binary search",
    signals: ["The input or answer space has an ordered boundary.", "Each check can discard a large ordered region."],
  },
  bit_manipulation: {
    description: "Use bit-level representation for flags, masks, parity, or compact subset state.",
    label: "Bit manipulation",
    signals: ["The problem asks about individual bits, masks, parity, or compact set encoding."],
  },
  complexity_and_constraints: {
    description: "Reason from input limits, operation cost, and baseline approaches before choosing a strategy.",
    label: "Complexity and constraints",
    signals: ["Large input size makes nested enumeration too expensive.", "The prompt asks whether work will scale."],
  },
  dynamic_programming_intro: {
    description: "Define reusable state and transitions when local choices overlap across subproblems.",
    label: "Dynamic programming intro",
    signals: ["Choices repeat over overlapping subproblems.", "The solution needs a state definition and transition."],
  },
  graph_traversal: {
    description: "Represent relationships and traverse nodes while maintaining visited state.",
    label: "Graph traversal",
    signals: ["Entities are connected by edges.", "Correctness depends on reachability, components, or dependency order."],
  },
  greedy_intro: {
    description: "Use a locally justified choice when an exchange or ordering argument makes it safe.",
    label: "Greedy intro",
    signals: ["A local choice can be justified by ordering or an exchange argument."],
  },
  hash_map_and_set: {
    description: "Remember values, counts, groups, or complements for fast lookup during a scan.",
    label: "Hash map and set",
    signals: ["The solution needs quick membership, count, grouping, or complement lookup."],
  },
  heap_priority_queue: {
    description: "Maintain a changing extreme or priority order without sorting everything repeatedly.",
    label: "Heap and priority queue",
    signals: ["The next item depends on current priority.", "Only the top K or current extreme matters repeatedly."],
  },
  intervals: {
    description: "Reason about ranges, overlaps, ordering, and active spans.",
    label: "Intervals",
    signals: ["Inputs describe start/end ranges.", "Ordering reveals overlap, gaps, or active intervals."],
  },
  linked_list: {
    description: "Manipulate node references where pointer order and rewiring define the state.",
    label: "Linked list",
    signals: ["The structure is node-linked.", "The main risk is pointer movement or rewiring."],
  },
  math_and_geometry: {
    description: "Use formulas, modular reasoning, coordinates, or numeric structure.",
    label: "Math and geometry",
    signals: ["The core decision depends on numeric properties, coordinates, or formulas."],
  },
  monotonic_stack: {
    description: "Maintain a stack invariant to resolve next greater, smaller, or boundary questions.",
    label: "Monotonic stack",
    signals: ["Unresolved elements wait for a future larger or smaller boundary."],
  },
  prefix_sums: {
    description: "Reuse accumulated values to answer range and subarray questions without recomputing ranges.",
    label: "Prefix sums",
    signals: ["The problem asks about range totals, differences, or repeated subarray sums."],
  },
  recursion_basics: {
    description: "Decompose a problem into base cases and smaller calls while tracking call-stack behavior.",
    label: "Recursion basics",
    signals: ["The same structure repeats at smaller scale.", "A base case controls termination."],
  },
  sliding_window: {
    description: "Maintain a moving contiguous range while updating state needed to test a condition.",
    label: "Sliding window",
    signals: ["The answer depends on a contiguous range.", "Expanding or shrinking the range updates state predictably."],
  },
  sorting_based: {
    description: "Sort input or derived records when ordering reveals a simpler scan, grouping, or comparison.",
    label: "Sorting based",
    signals: ["Ordering simplifies comparisons or grouping.", "Sorting preserves the answer and its cost is acceptable."],
  },
  stack: {
    description: "Use last-in-first-out state for nested structures, previous state, or explicit traversal.",
    label: "Stack",
    signals: ["The most recent unresolved element controls the next decision."],
  },
  tree_traversal: {
    description: "Traverse hierarchical structure while carrying path, depth, or subtree state.",
    label: "Tree traversal",
    signals: ["The input is hierarchical.", "The solution depends on subtree, path, depth, or level state."],
  },
  two_pointers: {
    description: "Coordinate moving positions when a comparison or boundary condition determines movement.",
    label: "Two pointers",
    signals: ["Two positions can move without checking every pair.", "A boundary comparison decides which pointer moves."],
  },
};

const mvpFamilyIds = [
  "complexity_and_constraints",
  "arrays_and_strings",
  "hash_map_and_set",
  "two_pointers",
  "sliding_window",
  "prefix_sums",
  "sorting_based",
  "stack",
  "monotonic_stack",
  "binary_search",
] as const satisfies readonly AlgorithmPatternFamilyId[];

const futureFamilyIds = [
  "linked_list",
  "recursion_basics",
  "tree_traversal",
  "heap_priority_queue",
  "intervals",
  "backtracking",
  "graph_traversal",
  "greedy_intro",
  "dynamic_programming_intro",
  "bit_manipulation",
  "math_and_geometry",
] as const satisfies readonly AlgorithmPatternFamilyId[];

export const ALGORITHM_PATTERN_FAMILIES = [
  ...mvpFamilyIds.map((id) => makeFamily(id, id === "complexity_and_constraints" || id === "arrays_and_strings" ? [] : ["complexity_and_constraints"])),
  ...futureFamilyIds.map((id) => makeFamily(id, ["complexity_and_constraints", "arrays_and_strings"])),
] as const satisfies readonly AlgorithmPatternFamily[];

const variantsByFamily = {
  arrays_and_strings: [
    "indexed_scan",
    "frequency_counting",
    "in_place_update",
    "string_normalization",
    "duplicate_handling",
  ],
  backtracking: [
    "choice_tree",
    "constraints_and_pruning",
    "combinations",
    "permutations",
    "subsets",
  ],
  binary_search: [
    "classic_index_search",
    "lower_upper_bound",
    "rotated_array_search",
    "binary_search_on_answer",
    "monotonic_predicate_recognition",
  ],
  bit_manipulation: [
    "bitmask_basics",
    "xor_properties",
    "set_clear_check_bit",
    "subset_bitmask_intro",
  ],
  complexity_and_constraints: [
    "big_o_basics",
    "input_size_constraints",
    "time_vs_space_tradeoff",
    "brute_force_as_baseline",
    "operations_cost",
  ],
  dynamic_programming_intro: [
    "one_dimensional_dp",
    "take_or_skip",
    "grid_dp",
    "subsequence_dp",
    "knapsack_intro",
    "state_definition",
    "transition_choice",
  ],
  graph_traversal: [
    "adjacency_representation",
    "bfs_unweighted_shortest_path",
    "dfs_connected_components",
    "visited_state",
    "topological_sort_intro",
    "union_find_intro",
  ],
  greedy_intro: [
    "local_choice_signal",
    "sorting_plus_greedy",
    "interval_greedy",
    "greedy_vs_dp_contrast",
  ],
  hash_map_and_set: [
    "lookup_by_value",
    "frequency_map",
    "complement_lookup",
    "seen_set",
    "grouping_by_key",
  ],
  heap_priority_queue: [
    "top_k",
    "running_extreme",
    "merge_k_sorted",
    "scheduling_by_priority",
  ],
  intervals: [
    "merge_overlaps",
    "insert_interval",
    "meeting_rooms",
    "sweep_line_intro",
  ],
  linked_list: [
    "pointer_rewiring",
    "fast_slow_pointers",
    "cycle_detection",
    "reverse_list",
    "merge_lists",
  ],
  math_and_geometry: [
    "modulo_reasoning",
    "counting_formula",
    "gcd_lcm",
    "coordinate_reasoning",
    "rectangle_overlap",
  ],
  monotonic_stack: [
    "next_greater_element",
    "next_smaller_element",
    "histogram_boundary_reasoning",
    "monotonic_invariant",
  ],
  prefix_sums: [
    "range_sum_query",
    "subarray_sum_with_hash_map",
    "difference_array_intro",
    "prefix_counting",
    "when_prefix_beats_window",
  ],
  recursion_basics: [
    "base_case_recognition",
    "recursive_decomposition",
    "call_stack_trace",
    "recursion_vs_iteration",
  ],
  sliding_window: [
    "fixed_size_window",
    "variable_size_positive_numbers",
    "frequency_constraint",
    "at_most_k_distinct",
    "minimum_covering_window",
    "when_sliding_window_fails",
  ],
  sorting_based: [
    "sort_then_scan",
    "sort_then_two_pointers",
    "custom_ordering",
    "sorting_to_reveal_structure",
    "sorting_cost_recognition",
  ],
  stack: [
    "nested_structure_validation",
    "expression_like_processing",
    "undo_or_previous_state",
    "stack_for_dfs_simulation",
  ],
  tree_traversal: [
    "dfs_preorder_inorder_postorder",
    "bfs_level_order",
    "recursive_tree_reasoning",
    "path_accumulation",
    "tree_height_depth",
  ],
  two_pointers: [
    "opposite_ends",
    "same_direction",
    "pair_scan_sorted_input",
    "partitioning",
    "duplicate_skipping",
  ],
} as const satisfies Record<AlgorithmPatternFamilyId, readonly string[]>;

export const ALGORITHM_PATTERN_VARIANTS = Object.entries(variantsByFamily).flatMap(
  ([patternFamilyId, variantIds]) =>
    variantIds.map((variantId) => ({
      contentVersion: ALGORITHM_CONTENT_VERSION,
      decisionSignals: [`Use ${formatLabel(variantId)} when its signal is present in the problem shape.`],
      description: `Practice the ${formatLabel(variantId)} variant within ${familyCopy[patternFamilyId as AlgorithmPatternFamilyId].label}.`,
      id: variantId,
      label: formatLabel(variantId),
      learningStage: getVariantLearningStage(patternFamilyId as AlgorithmPatternFamilyId),
      patternFamilyId: patternFamilyId as AlgorithmPatternFamilyId,
      prerequisiteLearningStageIds: patternFamilyId === "complexity_and_constraints" ? [] : ["foundations"],
      prerequisitePatternFamilyIds:
        patternFamilyId === "complexity_and_constraints" || patternFamilyId === "arrays_and_strings"
          ? []
          : ["complexity_and_constraints"],
      prerequisitePatternVariantIds: [],
    })),
) as readonly AlgorithmPatternVariant[];

export const ALGORITHM_PROBLEM_ARCHETYPES = [
  makeArchetype("analyze_scaling_limit", "Analyze scaling limit", ["complexity_and_constraints"]),
  makeArchetype("scan_indexed_sequence", "Scan indexed sequence", ["arrays_and_strings"]),
  makeArchetype("find_pair_with_condition", "Find pair with condition", ["hash_map_and_set", "two_pointers", "sorting_based"]),
  makeArchetype("find_subarray_with_target", "Find subarray with target", ["sliding_window", "prefix_sums"]),
  makeArchetype("group_or_count_values", "Group or count values", ["hash_map_and_set", "sorting_based"]),
  makeArchetype("validate_nested_structure", "Validate nested structure", ["stack"]),
  makeArchetype("resolve_next_boundary", "Resolve next boundary", ["monotonic_stack", "stack"]),
  makeArchetype("find_index_in_sorted_input", "Find index in sorted input", ["binary_search"]),
  makeArchetype("merge_or_compare_intervals", "Merge or compare intervals", ["intervals", "sorting_based"]),
  makeArchetype("choose_repeated_extreme", "Choose repeated extreme", ["heap_priority_queue"]),
  makeArchetype("traverse_connected_state", "Traverse connected state", ["graph_traversal"]),
  makeArchetype("define_reusable_state", "Define reusable state", ["dynamic_programming_intro"]),
] as const satisfies readonly AlgorithmProblemArchetype[];

export const ALGORITHM_SKILL_ATOMS = [
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Use input constraints to reject nested pair enumeration when the input can be very large.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "derive_time_complexity",
    label: "Derive time complexity from constraints",
    mistakeTypes: [
      "brute_force_when_optimized_required",
      "complexity_mismatch",
      "constraint_ignored",
    ],
    patternVariantIds: ["input_size_constraints", "operations_cost"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: [],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Track index boundaries and duplicates while scanning arrays or strings.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "track_index_boundary",
    label: "Track index boundaries",
    mistakeTypes: ["edge_case_missed", "off_by_one"],
    patternVariantIds: ["indexed_scan", "duplicate_handling"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Choose the value, count, or complement that should be stored for later lookup.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "choose_lookup_key",
    label: "Choose lookup key",
    mistakeTypes: ["data_structure_mismatch", "cannot_explain_why"],
    patternVariantIds: ["lookup_by_value", "complement_lookup", "seen_set"],
    primaryPatternFamilyId: "hash_map_and_set",
    problemArchetypeIds: ["find_pair_with_condition", "group_or_count_values"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Coordinate sorted boundaries and move the pointer ruled out by the comparison.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "move_decisive_pointer",
    label: "Move decisive pointer",
    mistakeTypes: ["wrong_approach", "constraint_ignored", "off_by_one"],
    patternVariantIds: ["pair_scan_sorted_input", "opposite_ends"],
    primaryPatternFamilyId: "two_pointers",
    problemArchetypeIds: ["find_pair_with_condition"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Track what must remain true as a contiguous window expands and shrinks.",
    evidenceRequiredForProgression: ["traced", "guided"],
    id: "maintain_window_invariant",
    label: "Maintain window invariant",
    mistakeTypes: ["invariant_missing", "invariant_broken", "cannot_trace_algorithm"],
    patternVariantIds: ["variable_size_positive_numbers", "frequency_constraint"],
    primaryPatternFamilyId: "sliding_window",
    problemArchetypeIds: ["find_subarray_with_target"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Detect when values or constraints break a simple moving-window assumption.",
    evidenceRequiredForProgression: ["contrast_success", "needs_review"],
    id: "detect_window_failure_signal",
    label: "Detect window failure signal",
    mistakeTypes: [
      "negative_numbers_assumption_error",
      "invariant_broken",
      "wrong_approach",
    ],
    patternVariantIds: ["when_sliding_window_fails", "when_prefix_beats_window"],
    primaryPatternFamilyId: "prefix_sums",
    problemArchetypeIds: ["find_subarray_with_target"],
    prerequisiteSkillAtomIds: ["maintain_window_invariant"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Recognize when sorting reveals structure and when its cost or side effects make it weaker.",
    evidenceRequiredForProgression: ["explained", "contrast_success"],
    id: "recognize_sorting_tradeoff",
    label: "Recognize sorting tradeoff",
    mistakeTypes: ["wrong_approach", "complexity_mismatch", "constraint_ignored"],
    patternVariantIds: ["sort_then_scan", "sort_then_two_pointers", "sorting_cost_recognition"],
    primaryPatternFamilyId: "sorting_based",
    problemArchetypeIds: ["find_pair_with_condition", "group_or_count_values"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Use the latest unresolved item when validating nested or previous-state structure.",
    evidenceRequiredForProgression: ["explained", "traced"],
    id: "use_last_unresolved_state",
    label: "Use last unresolved state",
    mistakeTypes: ["data_structure_mismatch", "cannot_trace_algorithm", "edge_case_missed"],
    patternVariantIds: ["nested_structure_validation", "undo_or_previous_state"],
    primaryPatternFamilyId: "stack",
    problemArchetypeIds: ["validate_nested_structure"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Maintain increasing or decreasing stack state to resolve future boundaries.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "maintain_monotonic_stack_invariant",
    label: "Maintain monotonic stack invariant",
    mistakeTypes: ["invariant_missing", "invariant_broken", "cannot_trace_algorithm"],
    patternVariantIds: ["next_greater_element", "monotonic_invariant"],
    primaryPatternFamilyId: "monotonic_stack",
    problemArchetypeIds: ["resolve_next_boundary"],
    prerequisiteSkillAtomIds: ["use_last_unresolved_state"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Identify an ordered yes/no boundary that makes repeated halving valid.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "identify_monotonic_predicate",
    label: "Identify monotonic predicate",
    mistakeTypes: ["wrong_approach", "constraint_ignored", "off_by_one"],
    patternVariantIds: ["classic_index_search", "monotonic_predicate_recognition"],
    primaryPatternFamilyId: "binary_search",
    problemArchetypeIds: ["find_index_in_sorted_input"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
] as const satisfies readonly AlgorithmSkillAtom[];

function makeFamily(
  id: AlgorithmPatternFamilyId,
  prerequisitePatternFamilyIds: readonly AlgorithmPatternFamilyId[],
): AlgorithmPatternFamily {
  const copy = familyCopy[id];
  return {
    commonMistakeTypes: [
      "wrong_approach",
      "constraint_ignored",
      "cannot_explain_why",
    ],
    contentVersion: ALGORITHM_CONTENT_VERSION,
    coreDecisionSignals: copy.signals,
    description: copy.description,
    entryLearningStage: id === "complexity_and_constraints" || id === "arrays_and_strings"
      ? "foundations"
      : "pattern_mechanics",
    id,
    label: copy.label,
    prerequisiteLearningStageIds: id === "complexity_and_constraints" ? [] : ["foundations"],
    prerequisitePatternFamilyIds,
  };
}

function makeArchetype(
  id: string,
  label: string,
  primaryPatternFamilyIds: readonly AlgorithmPatternFamilyId[],
): AlgorithmProblemArchetype {
  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    decisionSignals: [`${label} depends on choosing the right structure before implementation details.`],
    description: `${label} problems train transfer across related algorithmic patterns.`,
    id,
    label,
    primaryPatternFamilyIds,
  };
}

function getVariantLearningStage(patternFamilyId: AlgorithmPatternFamilyId) {
  return patternFamilyId === "complexity_and_constraints" || patternFamilyId === "arrays_and_strings"
    ? "foundations"
    : "pattern_mechanics";
}

function formatLabel(id: string): string {
  return id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
