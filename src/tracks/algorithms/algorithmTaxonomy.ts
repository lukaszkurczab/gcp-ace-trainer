import {
  ALGORITHM_CONTENT_VERSION,
  type AlgorithmPatternFamily,
  type AlgorithmPatternFamilyId,
  type AlgorithmPatternVariant,
  type AlgorithmProblemArchetype,
  type AlgorithmSkillAtom,
} from "./algorithmContentTypes";

const familyCopy: Record<
  AlgorithmPatternFamilyId,
  {
    description: string;
    label: string;
    signals: readonly string[];
  }
> = {
  arrays_and_strings: {
    description:
      "Reason about indexed sequences, character data, duplicates, and local scan state.",
    label: "Arrays and strings",
    signals: [
      "Input is an indexed sequence.",
      "Correctness depends on positions, boundaries, or duplicates.",
    ],
  },
  backtracking: {
    description: "Explore a choice tree while pruning invalid partial states.",
    label: "Backtracking",
    signals: [
      "The answer is assembled through reversible choices.",
      "Constraints can prune partial candidates.",
    ],
  },
  binary_search: {
    description:
      "Use ordered structure or a monotonic predicate to shrink the search space.",
    label: "Binary search",
    signals: [
      "The input or answer space has an ordered boundary.",
      "Each check can discard a large ordered region.",
    ],
  },
  bit_manipulation: {
    description:
      "Use bit-level representation for flags, masks, parity, or compact subset state.",
    label: "Bit manipulation",
    signals: [
      "The problem asks about individual bits, masks, parity, or compact set encoding.",
    ],
  },
  complexity_and_constraints: {
    description:
      "Reason from input limits, operation cost, and baseline approaches before choosing a strategy.",
    label: "Complexity and constraints",
    signals: [
      "Large input size makes nested enumeration too expensive.",
      "The prompt asks whether work will scale.",
    ],
  },
  dynamic_programming_intro: {
    description:
      "Define reusable state and transitions when local choices overlap across subproblems.",
    label: "Dynamic programming intro",
    signals: [
      "Choices repeat over overlapping subproblems.",
      "The solution needs a state definition and transition.",
    ],
  },
  graph_traversal: {
    description:
      "Represent relationships and traverse nodes while maintaining visited state.",
    label: "Graph traversal",
    signals: [
      "Entities are connected by edges.",
      "Correctness depends on reachability, components, or dependency order.",
    ],
  },
  greedy_intro: {
    description:
      "Use a locally justified choice when an exchange or ordering argument makes it safe.",
    label: "Greedy intro",
    signals: [
      "A local choice can be justified by ordering or an exchange argument.",
    ],
  },
  hash_map_and_set: {
    description:
      "Remember values, counts, groups, or complements for fast lookup during a scan.",
    label: "Hash map and set",
    signals: [
      "The solution needs quick membership, count, grouping, or complement lookup.",
    ],
  },
  heap_priority_queue: {
    description:
      "Maintain a changing extreme or priority order without sorting everything repeatedly.",
    label: "Heap and priority queue",
    signals: [
      "The next item depends on current priority.",
      "Only the top K or current extreme matters repeatedly.",
    ],
  },
  intervals: {
    description: "Reason about ranges, overlaps, ordering, and active spans.",
    label: "Intervals",
    signals: [
      "Inputs describe start/end ranges.",
      "Ordering reveals overlap, gaps, or active intervals.",
    ],
  },
  linked_list: {
    description:
      "Manipulate node references where pointer order and rewiring define the state.",
    label: "Linked list",
    signals: [
      "The structure is node-linked.",
      "The main risk is pointer movement or rewiring.",
    ],
  },
  math_and_geometry: {
    description:
      "Use formulas, modular reasoning, coordinates, or numeric structure.",
    label: "Math and geometry",
    signals: [
      "The core decision depends on numeric properties, coordinates, or formulas.",
    ],
  },
  monotonic_stack: {
    description:
      "Maintain a stack invariant to resolve next greater, smaller, or boundary questions.",
    label: "Monotonic stack",
    signals: [
      "Unresolved elements wait for a future larger or smaller boundary.",
    ],
  },
  prefix_sums: {
    description:
      "Reuse accumulated values to answer range and subarray questions without recomputing ranges.",
    label: "Prefix sums",
    signals: [
      "The problem asks about range totals, differences, or repeated subarray sums.",
    ],
  },
  recursion_basics: {
    description:
      "Decompose a problem into base cases and smaller calls while tracking call-stack behavior.",
    label: "Recursion basics",
    signals: [
      "The same structure repeats at smaller scale.",
      "A base case controls termination.",
    ],
  },
  sliding_window: {
    description:
      "Maintain a moving contiguous range while updating state needed to test a condition.",
    label: "Sliding window",
    signals: [
      "The answer depends on a contiguous range.",
      "Expanding or shrinking the range updates state predictably.",
    ],
  },
  sorting_based: {
    description:
      "Sort input or derived records when ordering reveals a simpler scan, grouping, or comparison.",
    label: "Sorting based",
    signals: [
      "Ordering simplifies comparisons or grouping.",
      "Sorting preserves the answer and its cost is acceptable.",
    ],
  },
  stack: {
    description:
      "Use last-in-first-out state for nested structures, previous state, or explicit traversal.",
    label: "Stack",
    signals: ["The most recent unresolved element controls the next decision."],
  },
  tree_traversal: {
    description:
      "Traverse hierarchical structure while carrying path, depth, or subtree state.",
    label: "Tree traversal",
    signals: [
      "The input is hierarchical.",
      "The solution depends on subtree, path, depth, or level state.",
    ],
  },
  two_pointers: {
    description:
      "Coordinate moving positions when a comparison or boundary condition determines movement.",
    label: "Two pointers",
    signals: [
      "Two positions can move without checking every pair.",
      "A boundary comparison decides which pointer moves.",
    ],
  },
};

const patternFamilyIds = [
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
  ...patternFamilyIds.map((id) =>
    makeFamily(
      id,
      id === "complexity_and_constraints" || id === "arrays_and_strings"
        ? []
        : ["complexity_and_constraints"],
    ),
  ),
] as const satisfies readonly AlgorithmPatternFamily[];

const variantsByFamily = {
  arrays_and_strings: [
    "indexed_scan",
    "frequency_counting",
    "presence_tracking",
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
    "hidden_operation_cost",
    "preprocessing_and_queries",
    "auxiliary_space_accounting",
    "time_space_tradeoff",
    "output_space_contract",
    "fixed_domain_or_constant_bound",
    "multi_input_dimension_cost",
    "dominant_term_reasoning",
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

export const ALGORITHM_PATTERN_VARIANTS = Object.entries(
  variantsByFamily,
).flatMap(([patternFamilyId, variantIds]) =>
  variantIds.map((variantId) => ({
    contentVersion: ALGORITHM_CONTENT_VERSION,
    decisionSignals: [
      `Use ${formatLabel(variantId)} when its signal is present in the problem shape.`,
    ],
    description: `Practice the ${formatLabel(variantId)} variant within ${familyCopy[patternFamilyId as AlgorithmPatternFamilyId].label}.`,
    id: variantId,
    label: formatLabel(variantId),
    learningStage: getVariantLearningStage(
      patternFamilyId as AlgorithmPatternFamilyId,
    ),
    patternFamilyId: patternFamilyId as AlgorithmPatternFamilyId,
    prerequisiteLearningStageIds:
      patternFamilyId === "complexity_and_constraints" ? [] : ["foundations"],
    prerequisitePatternFamilyIds:
      patternFamilyId === "complexity_and_constraints" ||
      patternFamilyId === "arrays_and_strings"
        ? []
        : ["complexity_and_constraints"],
    prerequisitePatternVariantIds: [],
  })),
) as readonly AlgorithmPatternVariant[];

export const ALGORITHM_PROBLEM_ARCHETYPES = [
  makeArchetype("analyze_scaling_limit", "Analyze scaling limit", [
    "complexity_and_constraints",
  ]),
  makeArchetype("scan_indexed_sequence", "Scan indexed sequence", [
    "arrays_and_strings",
  ]),
  makeArchetype("find_pair_with_condition", "Find pair with condition", [
    "hash_map_and_set",
    "two_pointers",
    "sorting_based",
  ]),
  makeArchetype("find_subarray_with_target", "Find subarray with target", [
    "sliding_window",
    "prefix_sums",
  ]),
  makeArchetype("group_or_count_values", "Group or count values", [
    "hash_map_and_set",
    "sorting_based",
  ]),
  makeArchetype("validate_nested_structure", "Validate nested structure", [
    "stack",
  ]),
  makeArchetype("resolve_next_boundary", "Resolve next boundary", [
    "monotonic_stack",
    "stack",
  ]),
  makeArchetype("find_index_in_sorted_input", "Find index in sorted input", [
    "binary_search",
  ]),
  makeArchetype("merge_or_compare_intervals", "Merge or compare intervals", [
    "intervals",
    "sorting_based",
  ]),
  makeArchetype("choose_repeated_extreme", "Choose repeated extreme", [
    "heap_priority_queue",
  ]),
  makeArchetype("traverse_connected_state", "Traverse connected state", [
    "graph_traversal",
  ]),
  makeArchetype("define_reusable_state", "Define reusable state", [
    "dynamic_programming_intro",
  ]),
] as const satisfies readonly AlgorithmProblemArchetype[];

const backtrackingContentSkillAtomIds = [
  "array_string_scan",
  "backtracking_base_case_contract",
  "backtracking_boolean_result",
  "backtracking_capacity_pruning",
  "backtracking_character_mismatch_pruning",
  "backtracking_choose_skip_choices",
  "backtracking_combination_duplicate_control",
  "backtracking_complexity_branching_depth",
  "backtracking_complexity_vs_direct_check",
  "backtracking_constrained_symbol_choices",
  "backtracking_constraint_pruning",
  "backtracking_count_state",
  "backtracking_directional_grid_choices",
  "backtracking_duplicate_control",
  "backtracking_duplicate_result_deduping",
  "backtracking_duplicate_value_vs_index",
  "backtracking_early_return_cleanup",
  "backtracking_enumerate_choices",
  "backtracking_exact_length_contract",
  "backtracking_exact_segment_count",
  "backtracking_first_vs_all_results",
  "backtracking_fixed_slot_placement",
  "backtracking_full_input_consumption",
  "backtracking_full_string_consumption",
  "backtracking_grid_bounds_guard",
  "backtracking_grid_bounds_pruning",
  "backtracking_grid_cell_restore",
  "backtracking_grid_direction_model",
  "backtracking_grid_path_completion",
  "backtracking_grid_per_path_visited",
  "backtracking_grid_position_state",
  "backtracking_grid_vs_traversal",
  "backtracking_index_state",
  "backtracking_loop_choices_from_start",
  "backtracking_minimal_state",
  "backtracking_mutable_board_restore",
  "backtracking_n_queens_column_choices",
  "backtracking_n_queens_diagonal_state",
  "backtracking_n_queens_row_state",
  "backtracking_next_slot_state",
  "backtracking_next_unconsumed_index",
  "backtracking_ordered_segment_path",
  "backtracking_output_size_reasoning",
  "backtracking_partition_index_state",
  "backtracking_partitioning_segmentation",
  "backtracking_path_snapshot",
  "backtracking_path_state",
  "backtracking_path_state_and_undo",
  "backtracking_permutation_duplicate_control",
  "backtracking_placement_constraint_check",
  "backtracking_placement_constraint_state_restore",
  "backtracking_placement_result_contract",
  "backtracking_placement_state_restore",
  "backtracking_placement_vs_generate_then_validate",
  "backtracking_position_value_choices",
  "backtracking_prefix_validity_pruning",
  "backtracking_pruning_assumption_check",
  "backtracking_pruning_complexity",
  "backtracking_push_pop_discipline",
  "backtracking_recursion_state",
  "backtracking_remaining_target_state",
  "backtracking_result_collection",
  "backtracking_reuse_candidate_choices",
  "backtracking_running_state_restore",
  "backtracking_same_depth_duplicate_skip",
  "backtracking_segment_boundary_choice",
  "backtracking_segment_capacity_pruning",
  "backtracking_segment_validation",
  "backtracking_segment_validity_pruning",
  "backtracking_shared_mutable_state",
  "backtracking_sibling_state_isolation",
  "backtracking_slot_candidate_values",
  "backtracking_sort_before_duplicate_skip",
  "backtracking_sorted_candidate_pruning",
  "backtracking_split_point_choices",
  "backtracking_start_index_state",
  "backtracking_target_overshoot_pruning",
  "backtracking_target_reached_contract",
  "backtracking_unused_element_choices",
  "backtracking_visited_mark_unmark",
  "backtracking_visited_pruning",
  "backtracking_visited_state",
  "backtracking_vs_binary_search",
  "backtracking_vs_hash_lookup",
  "backtracking_vs_linear_scan",
  "backtracking_vs_memoized_search",
  "backtracking_vs_prefix_sums",
  "backtracking_vs_recursion_basics",
  "backtracking_vs_sliding_window",
  "backtracking_vs_sorting",
  "backtracking_vs_stack",
  "backtracking_vs_tree_traversal",
  "backtracking_vs_two_pointers",
  "backtracking_word_index_progress",
  "binary_branching",
  "boolean_result_contract",
  "boundary_guard_reasoning",
  "branch_local_state",
  "candidate_reuse_contract",
  "candidate_value_choices",
  "choice_filter_misread",
  "choice_range_reasoning",
  "choose_skip_branching",
  "combination_generation",
  "combinational_search",
  "complexity_reasoning",
  "constraint_checking",
  "constraint_pruning",
  "constraint_reasoning",
  "constraint_state",
  "control_flow_reasoning",
  "count_result_contract",
  "debugging_reasoning",
  "duplicate_control",
  "duplicate_reasoning",
  "duplicate_value_vs_index",
  "exact_length_contract",
  "exact_match_contract",
  "exact_segment_count_contract",
  "existence_search",
  "failure_path_cleanup",
  "first_solution_contract",
  "grid_search_backtracking",
  "grid_traversal",
  "immutable_state_update",
  "leaf_result_contract",
  "memoization_state_key",
  "minimal_state_reasoning",
  "mutable_state_reasoning",
  "n_queens_constraints",
  "no_reuse_contract",
  "ordering_constraint",
  "output_contract_misread",
  "output_size_reasoning",
  "overlapping_subproblems",
  "palindrome_partitioning",
  "parentheses_generation",
  "partial_solution_reasoning",
  "path_local_state",
  "permutation_generation",
  "permutation_search",
  "prefix_sum_range_reasoning",
  "prefix_validity_reasoning",
  "read_order_reasoning",
  "recursion_basics",
  "remaining_capacity_reasoning",
  "restore_ip_segmentation",
  "same_depth_duplicate_skip",
  "shared_mutable_state",
  "sibling_state_isolation",
  "sliding_window_invariant",
  "sorting_based_reasoning",
  "state_model_misread",
  "state_restoration",
  "strategy_selection",
  "string_segmentation",
  "string_window_reasoning",
  "subsequence_vs_substring",
  "subset_generation",
  "target_sum_search",
  "tree_path_reasoning",
  "tree_traversal",
  "unnecessary_search_space",
  "valid_prefix_reasoning",
  "visited_state_reasoning",
  "word_break_segmentation",
  "word_search_state",
  "wrong_pattern_selected",
] as const satisfies readonly string[];

const backtrackingContentSkillAtoms = backtrackingContentSkillAtomIds.map((id) => ({
  contentVersion: ALGORITHM_CONTENT_VERSION,
  description: `${formatLabel(id)} reasoning for canonical backtracking practice.`,
  evidenceRequiredForProgression: ["explained", "guided"],
  id,
  label: formatLabel(id),
  mistakeTypes: ["wrong_pattern_selected", "state_model_misread"],
  patternVariantIds: ["choice_tree", "constraints_and_pruning"],
  primaryPatternFamilyId: "backtracking",
  prerequisiteSkillAtomIds: ["prune_backtracking_choice"],
})) satisfies readonly AlgorithmSkillAtom[];

const binarySearchSkillAtoms = [
  makeBinarySearchSkillAtom({
    description:
      "Recognize when ordered indexed data or a monotonic decision boundary makes halving valid.",
    id: "recognize_binary_search_signal",
    label: "Recognize binary-search signal",
    mistakeTypes: ["wrong_approach", "constraint_ignored", "data_structure_mismatch"],
    patternVariantIds: ["classic_index_search", "monotonic_predicate_recognition"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Identify the comparison and interval invariant that prove one half of the active search space can be discarded.",
    id: "identify_legal_half_discard_rule",
    label: "Identify legal half-discard rule",
    mistakeTypes: ["invariant_missing", "invariant_broken", "cannot_explain_why"],
    patternVariantIds: ["classic_index_search", "lower_upper_bound"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Use an ascending mid comparison to prove which side cannot contain a stored target.",
    id: "classic_binary_search_discard_rule",
    label: "Apply classic discard rule",
    mistakeTypes: ["invariant_broken", "off_by_one", "cannot_explain_why"],
    patternVariantIds: ["classic_index_search"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Return a matching index when found and the explicit not-found contract when all candidates are exhausted.",
    id: "classic_binary_search_found_not_found_contract",
    label: "Use classic found/not-found contract",
    mistakeTypes: ["edge_case_missed", "output_contract_misread"],
    patternVariantIds: ["classic_index_search"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Keep every still-possible target or boundary position inside the active search interval.",
    id: "binary_search_boundary_invariant",
    label: "Maintain binary-search boundary invariant",
    mistakeTypes: ["invariant_missing", "invariant_broken", "off_by_one"],
    patternVariantIds: ["classic_index_search", "lower_upper_bound"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Ensure every binary-search branch strictly shrinks the active range and recomputes derived state.",
    id: "binary_search_loop_progress",
    label: "Ensure binary-search loop progress",
    mistakeTypes: ["state_progress_error", "edge_case_missed", "invariant_broken"],
    patternVariantIds: ["classic_index_search", "lower_upper_bound"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Match inclusive or half-open loop conditions, initial bounds, and return values to the interval contract.",
    id: "binary_search_interval_contract",
    label: "Match binary-search interval contract",
    mistakeTypes: ["range_contract_misread", "edge_case_missed", "off_by_one"],
    patternVariantIds: ["classic_index_search", "lower_upper_bound"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Find the first position where nums[i] is greater than or equal to the target.",
    id: "lower_bound_contract",
    label: "Apply lower-bound contract",
    mistakeTypes: ["range_contract_misread", "duplicate_handling_error", "off_by_one"],
    patternVariantIds: ["lower_upper_bound"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Find the first position where nums[i] is strictly greater than the target.",
    id: "upper_bound_contract",
    label: "Apply upper-bound contract",
    mistakeTypes: ["range_contract_misread", "duplicate_handling_error", "off_by_one"],
    patternVariantIds: ["lower_upper_bound"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Derive first occurrence, last occurrence, and duplicate counts from lower and upper boundaries.",
    id: "derive_first_last_occurrence_from_bounds",
    label: "Derive occurrences from bounds",
    mistakeTypes: ["output_contract_misread", "duplicate_handling_error", "cannot_explain_why"],
    patternVariantIds: ["lower_upper_bound"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Define the searched numeric answer separately from indexes or stored input values.",
    id: "binary_search_answer_candidate_model",
    label: "Model answer-space candidate",
    mistakeTypes: ["state_model_misread", "wrong_approach", "constraint_ignored"],
    patternVariantIds: ["binary_search_on_answer"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Define and validate a monotonic feasibility predicate over answer candidates.",
    id: "binary_search_answer_feasibility_predicate",
    label: "Define answer feasibility predicate",
    mistakeTypes: ["monotonic_assumption_invalid", "monotonic_signal_missed", "constraint_ignored"],
    patternVariantIds: ["binary_search_on_answer", "monotonic_predicate_recognition"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Move answer-space bounds in the direction implied by feasible and infeasible candidate checks.",
    id: "binary_search_answer_update_direction",
    label: "Update answer-search bounds",
    mistakeTypes: ["state_progress_error", "invariant_broken", "off_by_one"],
    patternVariantIds: ["binary_search_on_answer"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Choose tight lower and upper bounds for a binary search over candidate answers.",
    id: "binary_search_answer_bounds",
    label: "Choose answer-search bounds",
    mistakeTypes: ["boundary_guard_missed", "constraint_ignored", "edge_case_missed"],
    patternVariantIds: ["binary_search_on_answer"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Identify the boundary in a monotonic boolean sequence, including first-true and last-true shapes.",
    id: "monotonic_predicate_boundary",
    label: "Identify monotonic predicate boundary",
    mistakeTypes: ["monotonic_signal_missed", "monotonic_assumption_invalid", "off_by_one"],
    patternVariantIds: ["monotonic_predicate_recognition"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Keep true mid as a possible answer and discard the false prefix in first-true searches.",
    id: "first_true_update_rule",
    label: "Apply first-true update rule",
    mistakeTypes: ["invariant_broken", "off_by_one", "subgoal_order_wrong"],
    patternVariantIds: ["monotonic_predicate_recognition"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Keep true mid as a possible answer and discard the false suffix in last-true searches.",
    id: "last_true_update_rule",
    label: "Apply last-true update rule",
    mistakeTypes: ["invariant_broken", "off_by_one", "subgoal_order_wrong"],
    patternVariantIds: ["monotonic_predicate_recognition"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Detect which half of a rotated sorted array is currently sorted.",
    id: "rotated_array_sorted_half_detection",
    label: "Detect rotated sorted half",
    mistakeTypes: ["structure_signal_missed", "wrong_layer_fix", "cannot_explain_why"],
    patternVariantIds: ["rotated_array_search"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Use inclusive and exclusive containment bounds to decide whether target can be inside the sorted half.",
    id: "rotated_array_target_containment",
    label: "Test rotated target containment",
    mistakeTypes: ["range_contract_misread", "subgoal_order_wrong", "edge_case_missed"],
    patternVariantIds: ["rotated_array_search"],
  }),
  makeBinarySearchSkillAtom({
    description:
      "Recognize when duplicates hide the sorted-half signal in rotated array search.",
    id: "rotated_array_duplicate_ambiguity",
    label: "Handle rotated duplicate ambiguity",
    mistakeTypes: ["duplicate_handling_error", "structure_signal_missed", "edge_case_missed"],
    patternVariantIds: ["rotated_array_search"],
  }),
] as const satisfies readonly AlgorithmSkillAtom[];

export const ALGORITHM_SKILL_ATOMS: readonly AlgorithmSkillAtom[] = [
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Use input constraints to reject nested pair enumeration when the input can be very large.",
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
    description:
      "Use explicit input limits before choosing a strategy or accepting brute force.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "apply_input_constraints",
    label: "Apply input constraints",
    mistakeTypes: [
      "brute_force_when_optimized_required",
      "constraint_ignored",
      "constraint_reasoning_missed",
    ],
    patternVariantIds: ["input_size_constraints"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Count repeated work before deciding whether a plan scales.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "identify_repeated_work",
    label: "Identify repeated work",
    mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
    patternVariantIds: ["big_o_basics", "dominant_term_reasoning"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Notice work hidden inside helpers, built-ins, callbacks, copies, or comparators.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "identify_hidden_operation_cost",
    label: "Identify hidden operation cost",
    mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
    patternVariantIds: ["hidden_operation_cost", "multi_input_dimension_cost"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Combine sequential phases without multiplying work that is not nested.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "combine_sequential_phase_costs",
    label: "Combine sequential phase costs",
    mistakeTypes: ["complexity_mismatch", "subgoal_order_wrong"],
    patternVariantIds: ["dominant_term_reasoning", "multi_input_dimension_cost"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Combine preprocessing, per-query, auxiliary-space, and total multi-query costs.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "combine_preprocessing_and_query_costs",
    label: "Combine preprocessing and query costs",
    mistakeTypes: ["complexity_mismatch", "reuse_contract_misread"],
    patternVariantIds: ["preprocessing_and_queries"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity", "derive_space_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Evaluate when extra lookup, count, or preprocessing state is worth its memory cost.",
    evidenceRequiredForProgression: ["explained", "contrast_success"],
    id: "evaluate_time_space_tradeoff",
    label: "Evaluate time-space tradeoff",
    mistakeTypes: ["complexity_mismatch", "unnecessary_memory_usage"],
    patternVariantIds: ["time_space_tradeoff", "auxiliary_space_accounting"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity", "derive_space_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Separate required returned output storage from auxiliary working memory.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "account_for_output_space",
    label: "Account for output space",
    mistakeTypes: ["complexity_mismatch", "output_contract_misread"],
    patternVariantIds: ["output_space_contract", "auxiliary_space_accounting"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_space_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "State time and auxiliary space as separate claims instead of collapsing both into one label.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "separate_time_and_space_complexity",
    label: "Separate time and space complexity",
    mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
    patternVariantIds: ["auxiliary_space_accounting", "big_o_basics"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity", "derive_space_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Separate extra output storage from working memory when stating space complexity.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "derive_space_complexity",
    label: "Derive space complexity",
    mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
    patternVariantIds: ["time_vs_space_tradeoff", "operations_cost"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Compare competing approaches by weighing their time, space, and output-shape tradeoffs.",
    evidenceRequiredForProgression: ["explained", "contrast_success"],
    id: "compare_complexity_tradeoffs",
    label: "Compare complexity tradeoffs",
    mistakeTypes: [
      "complexity_mismatch",
      "wrong_approach",
      "cannot_explain_why",
    ],
    patternVariantIds: ["time_vs_space_tradeoff", "operations_cost"],
    primaryPatternFamilyId: "complexity_and_constraints",
    problemArchetypeIds: ["analyze_scaling_limit"],
    prerequisiteSkillAtomIds: [
      "derive_time_complexity",
      "derive_space_complexity",
    ],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Track index boundaries and duplicates while scanning arrays or strings.",
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
    description:
      "Recognize that adjacent or previous-value prompts call for a local scan instead of global state.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "recognize_adjacent_scan",
    label: "Recognize adjacent scan",
    mistakeTypes: [
      "wrong_approach",
      "constraint_ignored",
      "cannot_explain_why",
    ],
    patternVariantIds: ["indexed_scan"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Diagnose when sorting or another transformation invalidates original positional evidence.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "diagnose_order_destroying_transform",
    label: "Diagnose order-destroying transform",
    mistakeTypes: [
      "wrong_approach",
      "constraint_ignored",
      "cannot_explain_why",
    ],
    patternVariantIds: ["indexed_scan"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["recognize_adjacent_scan"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Diagnose boundary mistakes around the first index or previous-value access in a scan.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "diagnose_off_by_one",
    label: "Diagnose off-by-one scan bug",
    mistakeTypes: ["off_by_one", "edge_case_missed", "cannot_trace_algorithm"],
    patternVariantIds: ["indexed_scan", "duplicate_handling"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Trace which index is processed next in a left-to-right scan without skipping or rereading work.",
    evidenceRequiredForProgression: ["traced", "guided"],
    id: "trace_scan_index",
    label: "Trace scan index",
    mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
    patternVariantIds: ["indexed_scan"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Choose per-value counts when multiplicity matters instead of weaker presence-only state.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "choose_frequency_state",
    label: "Choose frequency state",
    mistakeTypes: ["data_structure_mismatch", "cannot_explain_why"],
    patternVariantIds: ["frequency_counting"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["group_or_count_values"],
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Distinguish a presence check from a count comparison when duplicates change the answer.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "distinguish_presence_from_count",
    label: "Distinguish presence from count",
    mistakeTypes: [
      "data_structure_mismatch",
      "cannot_explain_why",
      "wrong_approach",
    ],
    patternVariantIds: ["frequency_counting"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["group_or_count_values"],
    prerequisiteSkillAtomIds: ["choose_frequency_state"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Diagnose when a learner picked a weaker data structure such as a set for a count-based requirement.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "diagnose_data_structure_mismatch",
    label: "Diagnose data-structure mismatch",
    mistakeTypes: [
      "data_structure_mismatch",
      "cannot_explain_why",
      "wrong_approach",
    ],
    patternVariantIds: ["frequency_counting"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["group_or_count_values"],
    prerequisiteSkillAtomIds: ["distinguish_presence_from_count"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Reason about the time and space cost of seen-state lookup when the set can grow with distinct values.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "reason_about_seen_state_complexity",
    label: "Reason about seen-state complexity",
    mistakeTypes: ["complexity_mismatch", "data_structure_mismatch"],
    patternVariantIds: ["presence_tracking"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["group_or_count_values"],
    prerequisiteSkillAtomIds: [
      "distinguish_presence_from_count",
      "derive_space_complexity",
    ],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Reason about the time and space cost of frequency counting when the bucket count can grow with distinct values.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "reason_about_frequency_counting_complexity",
    label: "Reason about frequency-counting complexity",
    mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
    patternVariantIds: ["frequency_counting"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["group_or_count_values"],
    prerequisiteSkillAtomIds: [
      "choose_frequency_state",
      "derive_space_complexity",
    ],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Use a fixed bounded alphabet to tighten frequency-table space from variable buckets to constant space.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "fixed_alphabet_complexity",
    label: "Use fixed-alphabet complexity caveat",
    mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
    patternVariantIds: ["frequency_counting"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["group_or_count_values"],
    prerequisiteSkillAtomIds: ["reason_about_frequency_counting_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Apply explicit normalization rules such as stripping spaces or folding case before using string equality.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "apply_string_normalization",
    label: "Apply string normalization",
    mistakeTypes: ["constraint_ignored", "wrong_approach"],
    patternVariantIds: ["string_normalization"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Recognize that normalization must happen before comparison when the prompt defines semantic equality.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "normalization_before_comparison",
    label: "Normalize before comparison",
    mistakeTypes: [
      "constraint_ignored",
      "wrong_approach",
      "cannot_explain_why",
    ],
    patternVariantIds: ["string_normalization"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["apply_string_normalization"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Trade full normalized copies for streaming normalization when the input is large and memory is constrained.",
    evidenceRequiredForProgression: ["explained", "contrast_success"],
    id: "streaming_normalization_tradeoff",
    label: "Use streaming normalization tradeoff",
    mistakeTypes: [
      "complexity_mismatch",
      "wrong_approach",
      "constraint_ignored",
    ],
    patternVariantIds: ["string_normalization"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: [
      "normalization_before_comparison",
      "derive_space_complexity",
    ],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Preserve the original relative order of kept values when the output contract requires stability.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "preserve_relative_order",
    label: "Preserve relative order",
    mistakeTypes: [
      "constraint_ignored",
      "wrong_approach",
      "cannot_explain_why",
    ],
    patternVariantIds: ["in_place_update"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Use a read index and write boundary to compact kept values in place without breaking order.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "use_read_write_boundary",
    label: "Use read/write boundary",
    mistakeTypes: ["cannot_trace_algorithm", "wrong_approach", "off_by_one"],
    patternVariantIds: ["in_place_update"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["preserve_relative_order"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Reason about whether an order-preservation requirement keeps or eliminates candidate mutation strategies.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "reason_about_order_constraint",
    label: "Reason about order constraint",
    mistakeTypes: [
      "constraint_ignored",
      "wrong_approach",
      "cannot_explain_why",
    ],
    patternVariantIds: ["in_place_update"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["preserve_relative_order"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Trace where the next kept value should be written when a stable compaction scan accepts it.",
    evidenceRequiredForProgression: ["traced", "guided"],
    id: "trace_write_boundary",
    label: "Trace write boundary",
    mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
    patternVariantIds: ["in_place_update"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["use_read_write_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Distinguish extra output space from in-place working state when the task returns a new filtered result.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "distinguish_output_space",
    label: "Distinguish output space",
    mistakeTypes: [
      "complexity_mismatch",
      "constraint_ignored",
      "cannot_explain_why",
    ],
    patternVariantIds: ["in_place_update"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: [
      "derive_space_complexity",
      "use_read_write_boundary",
    ],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Match the implementation to the prompt's output contract instead of assuming in-place mutation is required.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "distinguish_output_contract",
    label: "Distinguish output contract",
    mistakeTypes: [
      "constraint_ignored",
      "complexity_mismatch",
      "wrong_approach",
    ],
    patternVariantIds: ["in_place_update"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["distinguish_output_space"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Diagnose why a sorted duplicate-collapse scan fails when it mishandles the first unique value.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "diagnose_duplicate_collapse",
    label: "Diagnose duplicate collapse",
    mistakeTypes: [
      "duplicate_handling_error",
      "off_by_one",
      "cannot_trace_algorithm",
    ],
    patternVariantIds: ["duplicate_handling"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Initialize sorted duplicate collapse so the first unique value is preserved before later comparisons.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "initialize_duplicate_collapse",
    label: "Initialize duplicate collapse",
    mistakeTypes: [
      "duplicate_handling_error",
      "off_by_one",
      "edge_case_missed",
    ],
    patternVariantIds: ["duplicate_handling"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["diagnose_duplicate_collapse"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Avoid heavier state when sorted order already exposes the duplicate boundary the algorithm needs.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "avoid_unnecessary_state",
    label: "Avoid unnecessary state",
    mistakeTypes: [
      "wrong_approach",
      "complexity_mismatch",
      "cannot_explain_why",
    ],
    patternVariantIds: ["duplicate_handling"],
    primaryPatternFamilyId: "arrays_and_strings",
    problemArchetypeIds: ["scan_indexed_sequence"],
    prerequisiteSkillAtomIds: ["diagnose_duplicate_collapse"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Choose the value, count, or complement that should be stored for later lookup.",
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
    description:
      "Coordinate sorted boundaries and move the pointer ruled out by the comparison.",
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
    description:
      "Track what must remain true as a contiguous window expands and shrinks.",
    evidenceRequiredForProgression: ["traced", "guided"],
    id: "maintain_window_invariant",
    label: "Maintain window invariant",
    mistakeTypes: [
      "invariant_missing",
      "invariant_broken",
      "cannot_trace_algorithm",
    ],
    patternVariantIds: [
      "variable_size_positive_numbers",
      "frequency_constraint",
    ],
    primaryPatternFamilyId: "sliding_window",
    problemArchetypeIds: ["find_subarray_with_target"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Detect when values or constraints break a simple moving-window assumption.",
    evidenceRequiredForProgression: ["contrast_success", "needs_review"],
    id: "detect_window_failure_signal",
    label: "Detect window failure signal",
    mistakeTypes: [
      "negative_numbers_assumption_error",
      "invariant_broken",
      "wrong_approach",
    ],
    patternVariantIds: [
      "when_sliding_window_fails",
      "when_prefix_beats_window",
    ],
    primaryPatternFamilyId: "prefix_sums",
    problemArchetypeIds: ["find_subarray_with_target"],
    prerequisiteSkillAtomIds: ["maintain_window_invariant"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Recognize when sorting reveals structure and when its cost or side effects make it weaker.",
    evidenceRequiredForProgression: ["explained", "contrast_success"],
    id: "recognize_sorting_tradeoff",
    label: "Recognize sorting tradeoff",
    mistakeTypes: [
      "wrong_approach",
      "complexity_mismatch",
      "constraint_ignored",
    ],
    patternVariantIds: [
      "sort_then_scan",
      "sort_then_two_pointers",
      "sorting_cost_recognition",
    ],
    primaryPatternFamilyId: "sorting_based",
    problemArchetypeIds: ["find_pair_with_condition", "group_or_count_values"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Use the latest unresolved item when validating nested or previous-state structure.",
    evidenceRequiredForProgression: ["explained", "traced"],
    id: "use_last_unresolved_state",
    label: "Use last unresolved state",
    mistakeTypes: [
      "data_structure_mismatch",
      "cannot_trace_algorithm",
      "edge_case_missed",
    ],
    patternVariantIds: [
      "nested_structure_validation",
      "undo_or_previous_state",
    ],
    primaryPatternFamilyId: "stack",
    problemArchetypeIds: ["validate_nested_structure"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Maintain increasing or decreasing stack state to resolve future boundaries.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "maintain_monotonic_stack_invariant",
    label: "Maintain monotonic stack invariant",
    mistakeTypes: [
      "invariant_missing",
      "invariant_broken",
      "cannot_trace_algorithm",
    ],
    patternVariantIds: ["next_greater_element", "monotonic_invariant"],
    primaryPatternFamilyId: "monotonic_stack",
    problemArchetypeIds: ["resolve_next_boundary"],
    prerequisiteSkillAtomIds: ["use_last_unresolved_state"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Identify an ordered yes/no boundary that makes repeated halving valid.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "identify_monotonic_predicate",
    label: "Identify monotonic predicate",
    mistakeTypes: ["wrong_approach", "constraint_ignored", "off_by_one"],
    patternVariantIds: [
      "classic_index_search",
      "monotonic_predicate_recognition",
    ],
    primaryPatternFamilyId: "binary_search",
    problemArchetypeIds: ["find_index_in_sorted_input"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  ...binarySearchSkillAtoms,
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Track which links change before moving pointers in a node-based sequence.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "reason_linked_list_rewiring",
    label: "Reason about linked-list rewiring",
    mistakeTypes: [
      "data_structure_mismatch",
      "cannot_trace_algorithm",
      "edge_case_missed",
    ],
    patternVariantIds: ["pointer_rewiring", "reverse_list"],
    primaryPatternFamilyId: "linked_list",
    prerequisiteSkillAtomIds: ["track_index_boundary"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Name the base case and smaller repeated call before tracing recursive work.",
    evidenceRequiredForProgression: ["explained", "traced"],
    id: "trace_recursive_base_case",
    label: "Trace recursive base case",
    mistakeTypes: [
      "subgoal_order_wrong",
      "cannot_trace_algorithm",
      "edge_case_missed",
    ],
    patternVariantIds: ["base_case_recognition", "recursive_decomposition"],
    primaryPatternFamilyId: "recursion_basics",
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Carry path, depth, or subtree state while choosing a tree traversal order.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "carry_tree_traversal_state",
    label: "Carry tree traversal state",
    mistakeTypes: [
      "subgoal_order_wrong",
      "cannot_trace_algorithm",
      "edge_case_missed",
    ],
    patternVariantIds: ["dfs_preorder_inorder_postorder", "path_accumulation"],
    primaryPatternFamilyId: "tree_traversal",
    prerequisiteSkillAtomIds: ["trace_recursive_base_case"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Choose a heap when the next decision repeatedly depends on the current extreme or priority.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "choose_priority_queue_state",
    label: "Choose priority-queue state",
    mistakeTypes: [
      "data_structure_mismatch",
      "wrong_approach",
      "complexity_mismatch",
    ],
    patternVariantIds: ["top_k", "running_extreme"],
    primaryPatternFamilyId: "heap_priority_queue",
    problemArchetypeIds: ["choose_repeated_extreme"],
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Sort interval boundaries before reasoning about overlap, gaps, or active ranges.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "reason_about_interval_overlap",
    label: "Reason about interval overlap",
    mistakeTypes: ["wrong_approach", "edge_case_missed", "cannot_explain_why"],
    patternVariantIds: ["merge_overlaps", "sweep_line_intro"],
    primaryPatternFamilyId: "intervals",
    problemArchetypeIds: ["merge_or_compare_intervals"],
    prerequisiteSkillAtomIds: ["recognize_sorting_tradeoff"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Separate reversible choices from constraints that can prune a partial candidate.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "prune_backtracking_choice",
    label: "Prune backtracking choice",
    mistakeTypes: [
      "constraint_ignored",
      "subgoal_order_wrong",
      "cannot_explain_why",
    ],
    patternVariantIds: ["choice_tree", "constraints_and_pruning"],
    primaryPatternFamilyId: "backtracking",
    prerequisiteSkillAtomIds: ["trace_recursive_base_case"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Represent edges and mark visited state before traversing connected data.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "track_graph_visited_state",
    label: "Track graph visited state",
    mistakeTypes: [
      "data_structure_mismatch",
      "cannot_trace_algorithm",
      "edge_case_missed",
    ],
    patternVariantIds: ["adjacency_representation", "visited_state"],
    primaryPatternFamilyId: "graph_traversal",
    problemArchetypeIds: ["traverse_connected_state"],
    prerequisiteSkillAtomIds: ["use_last_unresolved_state"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Identify the ordering or exchange signal that makes a local choice safe.",
    evidenceRequiredForProgression: ["explained", "contrast_success"],
    id: "justify_greedy_choice",
    label: "Justify greedy choice",
    mistakeTypes: [
      "wrong_approach",
      "constraint_ignored",
      "cannot_explain_why",
    ],
    patternVariantIds: ["local_choice_signal", "sorting_plus_greedy"],
    primaryPatternFamilyId: "greedy_intro",
    prerequisiteSkillAtomIds: ["recognize_sorting_tradeoff"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Define reusable state and transitions before filling dynamic programming results.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "define_dynamic_programming_state",
    label: "Define dynamic-programming state",
    mistakeTypes: [
      "subgoal_order_wrong",
      "invariant_missing",
      "cannot_explain_why",
    ],
    patternVariantIds: ["state_definition", "transition_choice"],
    primaryPatternFamilyId: "dynamic_programming_intro",
    problemArchetypeIds: ["define_reusable_state"],
    prerequisiteSkillAtomIds: ["trace_recursive_base_case"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Use masks or bit properties when compact state or parity is the central signal.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "apply_bitmask_state",
    label: "Apply bitmask state",
    mistakeTypes: [
      "data_structure_mismatch",
      "wrong_approach",
      "cannot_explain_why",
    ],
    patternVariantIds: ["bitmask_basics", "set_clear_check_bit"],
    primaryPatternFamilyId: "bit_manipulation",
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description:
      "Use numeric structure, formulas, or coordinates before trying broad search.",
    evidenceRequiredForProgression: ["explained", "guided"],
    id: "reason_about_numeric_structure",
    label: "Reason about numeric structure",
    mistakeTypes: [
      "wrong_approach",
      "constraint_ignored",
      "cannot_explain_why",
    ],
    patternVariantIds: ["modulo_reasoning", "coordinate_reasoning"],
    primaryPatternFamilyId: "math_and_geometry",
    prerequisiteSkillAtomIds: ["derive_time_complexity"],
  },
  ...backtrackingContentSkillAtoms,
] as const satisfies readonly AlgorithmSkillAtom[];

function makeBinarySearchSkillAtom(
  input: Pick<
    AlgorithmSkillAtom,
    "description" | "id" | "label" | "mistakeTypes" | "patternVariantIds"
  >,
): AlgorithmSkillAtom {
  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: input.description,
    evidenceRequiredForProgression: ["explained", "guided"],
    id: input.id,
    label: input.label,
    mistakeTypes: input.mistakeTypes,
    patternVariantIds: input.patternVariantIds,
    primaryPatternFamilyId: "binary_search",
    problemArchetypeIds: ["find_index_in_sorted_input"],
    prerequisiteSkillAtomIds: ["identify_monotonic_predicate"],
  };
}

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
    entryLearningStage:
      id === "complexity_and_constraints" || id === "arrays_and_strings"
        ? "foundations"
        : "pattern_mechanics",
    id,
    label: copy.label,
    prerequisiteLearningStageIds:
      id === "complexity_and_constraints" ? [] : ["foundations"],
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
    decisionSignals: [
      `${label} depends on choosing the right structure before implementation details.`,
    ],
    description: `${label} problems train transfer across related algorithmic patterns.`,
    id,
    label,
    primaryPatternFamilyIds,
  };
}

function getVariantLearningStage(patternFamilyId: AlgorithmPatternFamilyId) {
  return patternFamilyId === "complexity_and_constraints" ||
    patternFamilyId === "arrays_and_strings"
    ? "foundations"
    : "pattern_mechanics";
}

function formatLabel(id: string): string {
  return id
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
