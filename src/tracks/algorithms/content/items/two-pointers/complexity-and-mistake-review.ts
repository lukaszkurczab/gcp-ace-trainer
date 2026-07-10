export const complexityAndMistakeReviewQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "The two pointers move monotonically toward each other. Each pointer advances across at most n positions, so the total number of pointer moves is O(n), not O(n²).",
    id: "alg-two-pointers-complexity-review-001",
    learningStage: "foundations",
    primarySkillAtomId: "derive_monotonic_two_pointer_scan_complexity",
    secondarySkillAtomIds: [
      "bound_total_pointer_movement",
      "distinguish_sequential_from_nested_movement",
    ],
    type: "complexity_check",
    prompt: `A sorted-array scan uses:

let left = 0;
let right = values.length - 1;

while (left < right) {
  if (shouldMoveLeft(values[left], values[right])) {
    left++;
  } else {
    right--;
  }
}

Each iteration moves at least one boundary inward. What is the scan complexity?`,
    options: [
      {
        id: "linear_constant_space",
        text: "O(n) time and O(1) auxiliary space.",
        isCorrect: true,
      },
      {
        id: "quadratic_two_pointers",
        text: "O(n²) time because two pointers may each move O(n) times.",
        isCorrect: false,
      },
      {
        id: "logarithmic_halving",
        text: "O(log n) time because the search region becomes smaller.",
        isCorrect: false,
      },
      {
        id: "constant_two_variables",
        text: "O(1) time because only two pointer variables are stored.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Pointer movement is monotonic, and the combined number of boundary advances is bounded by the array length.",
      mentalModelCorrection:
        "Two O(n) movement totals add to O(n); they do not multiply unless one complete traversal occurs inside another.",
      mistakeTypes: ["bounded_pointer_movements_multiplied"],
      nextAction:
        "Count how many times each pointer can advance over the complete execution.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-two-pointers-complexity-review-002",
    learningStage: "foundations",
    primarySkillAtomId: "require_safe_pointer_movement_proof",
    secondarySkillAtomIds: [
      "review_linear_scan_claim",
      "identify_nonmonotonic_pointer_reset",
    ],
    type: "mistake_review",
    prompt: `A reviewer claims:

"This is O(n) because it uses two pointers."

The code sometimes resets right to the end of the array after left advances. What is the best correction?`,
    options: [
      {
        id: "two_pointers_not_sufficient",
        text: "The variable count does not prove linear time; repeated resets may cause right to traverse the same positions many times.",
        isCorrect: true,
      },
      {
        id: "still_linear_by_definition",
        text: "Every algorithm with two indexes is O(n) by definition.",
        isCorrect: false,
      },
      {
        id: "always_logarithmic",
        text: "Resetting a pointer makes the scan O(log n).",
        isCorrect: false,
      },
      {
        id: "space_determines_time",
        text: "The algorithm is O(n) because the pointers use O(1) space.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A pointer may revisit previously traversed positions after a reset.",
      mentalModelCorrection:
        "A linear two-pointer bound requires a movement argument showing that total advances are globally bounded.",
      mistakeTypes: ["linear_big_o_accepted_without_movement_proof"],
      nextAction:
        "Identify whether either pointer can move backward, reset, or rescan a previously covered region.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(s), where s is the auxiliary space used by the sorting algorithm",
    expectedTimeComplexity: "O(n log n)",
    complexityExplanation: "Sorting costs O(n log n), and the subsequent monotonic two-pointer scan costs O(n). Therefore total time is O(n log n). The scan adds O(1) auxiliary space, while total auxiliary space is determined by the sorting implementation.",
    id: "alg-two-pointers-complexity-review-003",
    learningStage: "foundations",
    primarySkillAtomId: "derive_sort_plus_two_pointer_complexity",
    secondarySkillAtomIds: [
      "include_sorting_preprocessing_cost",
      "combine_sort_and_scan_costs",
    ],
    type: "complexity_check",
    prompt:
      "An unsorted array is sorted and then scanned once with opposite-end pointers. What is the total time complexity using an O(n log n) sorting algorithm?",
    options: [
      {
        id: "n_log_n",
        text: "O(n log n), because sorting dominates the O(n) scan.",
        isCorrect: true,
      },
      {
        id: "linear",
        text: "O(n), because the pointer phase is linear.",
        isCorrect: false,
      },
      {
        id: "n_squared",
        text: "O(n²), because sorting and scanning must be multiplied.",
        isCorrect: false,
      },
      {
        id: "log_n",
        text: "O(log n), because the sorted array permits directional elimination.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The input is not initially sorted, so preprocessing is part of the algorithm.",
      mentalModelCorrection:
        "Total cost includes sorting plus scanning: O(n log n + n) simplifies to O(n log n).",
      mistakeTypes: ["sorting_cost_omitted"],
      nextAction:
        "List preprocessing and scan phases separately before simplifying the bound.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-two-pointers-complexity-review-004",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_omitted_sorting_cost",
    secondarySkillAtomIds: [
      "review_sort_plus_scan_claim",
      "distinguish_phase_from_total_complexity",
    ],
    type: "mistake_review",
    prompt: `A pair-sum solution first calls values.sort(...) and then runs a two-pointer scan.

A code comment says:

"Time: O(n), because each pointer crosses the array at most once."

What is missing?`,
    options: [
      {
        id: "sorting_makes_total_nlogn",
        text: "The pointer phase is O(n), but the complete algorithm is O(n log n) because sorting must also be counted.",
        isCorrect: true,
      },
      {
        id: "pointer_phase_is_quadratic",
        text: "The pointer phase is O(n²), so sorting is irrelevant.",
        isCorrect: false,
      },
      {
        id: "sort_is_constant",
        text: "Nothing; built-in sorting is always O(1).",
        isCorrect: false,
      },
      {
        id: "space_only_missing",
        text: "Only the space complexity is missing; the time claim is complete.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The comment proves only the post-sort scan cost.",
      mentalModelCorrection:
        "A correct phase-level bound does not automatically describe the end-to-end algorithm.",
      mistakeTypes: ["scan_cost_reported_as_total_cost"],
      nextAction:
        "Include every mandatory preprocessing step in the final complexity statement.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(1) excluding sort and output",
    expectedTimeComplexity: "O(n²)",
    complexityExplanation:
      "After sorting, each of O(n) anchor positions runs a monotonic O(n) two-pointer scan. Therefore the scan phase is O(n²), and the preceding O(n log n) sort does not dominate it.",
    id: "alg-two-pointers-complexity-review-005",
    learningStage: "foundations",
    primarySkillAtomId: "derive_three_sum_complexity",
    secondarySkillAtomIds: [
      "combine_outer_loop_and_pointer_scan",
      "include_three_sum_sorting_cost",
    ],
    type: "complexity_check",
    prompt: `A standard three-sum strategy:

1. sorts n values,
2. chooses each possible anchor index,
3. runs a linear two-pointer scan over the suffix.

What is the total time complexity?`,
    options: [
      {
        id: "quadratic",
        text: "O(n²), because O(n) anchors each trigger an O(n) scan; sorting is asymptotically smaller.",
        isCorrect: true,
      },
      {
        id: "linear",
        text: "O(n), because the inner scan uses two pointers.",
        isCorrect: false,
      },
      {
        id: "n_log_n",
        text: "O(n log n), because sorting always dominates all later work.",
        isCorrect: false,
      },
      {
        id: "cubic",
        text: "O(n³), because three selected values always require three nested loops.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The linear pointer traversal is repeated for a linear number of anchor choices.",
      mentalModelCorrection:
        "Two pointers reduce the inner pair search, but they do not remove the outer anchor loop.",
      mistakeTypes: ["three_sum_claimed_linear"],
      nextAction:
        "Multiply work that is genuinely nested: anchors times the scan performed for each anchor.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-two-pointers-complexity-review-006",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_three_sum_linear_claim",
    secondarySkillAtomIds: [
      "distinguish_single_scan_from_repeated_scan",
      "review_nested_pointer_work",
    ],
    type: "mistake_review",
    prompt: `A reviewer says:

"Three-sum is O(n) after sorting because left and right each move only forward or backward once."

Why is that reasoning incomplete?`,
    options: [
      {
        id: "movement_bound_restarts_per_anchor",
        text: "The O(n) movement bound applies to one anchor's scan, and a new scan begins for O(n) different anchors.",
        isCorrect: true,
      },
      {
        id: "pointers_move_randomly",
        text: "The pointers are not monotonic within an anchor scan.",
        isCorrect: false,
      },
      {
        id: "sorting_makes_it_cubic",
        text: "Sorting adds another factor of n, making the algorithm O(n³).",
        isCorrect: false,
      },
      {
        id: "three_variables_mean_cubic",
        text: "Any algorithm using three indexes is automatically O(n³).",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The pointer lifecycle restarts inside an outer loop.",
      mentalModelCorrection:
        "A traversal can be linear per invocation while the complete algorithm remains quadratic because that traversal is repeated.",
      mistakeTypes: ["per_anchor_scan_bound_used_as_total"],
      nextAction: "Identify the scope over which each movement bound holds.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "The transformation uses a constant number of indexes and overwrites the input array. Excluding the returned logical length and the input array itself, it uses O(1) auxiliary space.",
    id: "alg-two-pointers-complexity-review-007",
    learningStage: "foundations",
    primarySkillAtomId: "derive_in_place_two_pointer_space",
    secondarySkillAtomIds: [
      "distinguish_input_storage_from_auxiliary_space",
      "recognize_read_write_compaction",
    ],
    type: "complexity_check",
    prompt:
      "A read/write two-pointer transformation overwrites the input array and returns the new logical length. It allocates no second array. What is its auxiliary-space complexity?",
    options: [
      {
        id: "constant",
        text: "O(1), because it uses only a constant amount of extra state.",
        isCorrect: true,
      },
      {
        id: "linear_input",
        text: "O(n), because the input array contains n elements.",
        isCorrect: false,
      },
      {
        id: "quadratic",
        text: "O(n²), because read and write may point to different positions.",
        isCorrect: false,
      },
      {
        id: "logarithmic",
        text: "O(log n), because the written prefix grows gradually.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The algorithm reuses input storage and retains only a few scalar variables.",
      mentalModelCorrection:
        "Auxiliary space excludes storage already occupied by the input unless the contract says otherwise.",
      mistakeTypes: ["input_array_counted_as_auxiliary_space"],
      nextAction:
        "List only newly allocated storage whose size grows with input size.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-two-pointers-complexity-review-008",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_in_place_scan_from_sort_space",
    secondarySkillAtomIds: [
      "qualify_sorting_space_claim",
      "review_auxiliary_space_complexity",
    ],
    type: "mistake_review",
    prompt: `A solution sorts the input with a library sort and then uses O(1) pointer variables.

A reviewer states:

"Auxiliary space is definitely O(1)."

What is the most precise response?`,
    options: [
      {
        id: "depends_on_sort_implementation",
        text: "The pointer scan uses O(1) extra space, but the complete bound also depends on the sorting algorithm's auxiliary-space behavior.",
        isCorrect: true,
      },
      {
        id: "always_linear",
        text: "Any sorting call always requires O(n) auxiliary space.",
        isCorrect: false,
      },
      {
        id: "always_constant",
        text: "The claim is unconditional because sorting never allocates memory.",
        isCorrect: false,
      },
      {
        id: "pointer_count_determines_all_space",
        text: "Only the number of pointer variables matters for the complete algorithm.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The scan and the sort may have different auxiliary-space requirements.",
      mentalModelCorrection:
        "An in-place pointer phase does not prove that every preceding operation is also in-place.",
      mistakeTypes: ["sort_space_omitted_from_total"],
      nextAction:
        "State whether the sorting implementation is in-place or include its documented auxiliary-space cost.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(r)",
    expectedTimeComplexity: "O(n + r)",
    complexityExplanation:
      "The scan performs O(n) pointer work, while materializing r result records requires Θ(r) additional time and output storage.",
    id: "alg-two-pointers-complexity-review-009",
    learningStage: "foundations",
    primarySkillAtomId: "include_output_size_in_pointer_algorithm",
    secondarySkillAtomIds: [
      "derive_output_sensitive_complexity",
      "distinguish_scan_cost_from_output_cost",
    ],
    type: "complexity_check",
    prompt: `A monotonic pointer scan processes n elements and emits r constant-size result records.

What is the appropriate complexity when the output list is included?`,
    options: [
      {
        id: "n_plus_r_time_r_space",
        text: "O(n + r) time and O(r) output space, excluding any other auxiliary state.",
        isCorrect: true,
      },
      {
        id: "linear_constant_regardless",
        text: "O(n) time and O(1) space regardless of how many records are returned.",
        isCorrect: false,
      },
      {
        id: "n_times_r",
        text: "O(nr) time because every output record must be multiplied by the scan length.",
        isCorrect: false,
      },
      {
        id: "r_only",
        text: "O(r) time because pointer movement is free.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every materialized result contributes unavoidable construction and storage cost.",
      mentalModelCorrection:
        "A linear scan does not hide an output that may itself grow with the input.",
      mistakeTypes: ["pointer_output_cost_omitted"],
      nextAction:
        "Introduce an output-size variable whenever the algorithm may emit multiple results.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-two-pointers-complexity-review-010",
    learningStage: "foundations",
    primarySkillAtomId: "account_for_subarray_copying_cost",
    secondarySkillAtomIds: [
      "distinguish_boundary_tracking_from_copying",
      "derive_total_materialization_cost",
    ],
    type: "mistake_review",
    prompt: `The pointer movement of a range scan is O(n), but every time it finds a valid range it executes:

results.push(values.slice(left, right + 1));

A reviewer still claims O(n) total time. What is missing?`,
    options: [
      {
        id: "copy_lengths_must_be_counted",
        text: "Each slice copies the range, so total time and output space must include the sum of all copied lengths.",
        isCorrect: true,
      },
      {
        id: "slice_is_constant",
        text: "Nothing; Array.prototype.slice is O(1) regardless of range length.",
        isCorrect: false,
      },
      {
        id: "pointer_scan_becomes_logarithmic",
        text: "Copying changes the pointer scan itself to O(log n).",
        isCorrect: false,
      },
      {
        id: "only_number_of_ranges_matters",
        text: "Only the number of returned ranges matters; their lengths do not affect copying cost.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The algorithm creates new arrays whose sizes depend on the selected ranges.",
      mentalModelCorrection:
        "Tracking range boundaries can be O(1) per result, but copying complete ranges is proportional to their lengths.",
      mistakeTypes: ["subarray_copying_cost_omitted"],
      nextAction:
        "Sum the lengths of all copied outputs rather than counting only pointer iterations.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(s) excluding output, where s is the auxiliary space used by sorting",
    expectedTimeComplexity: "O(n²)",
    complexityExplanation: "The duplicate-skipping loops advance the same monotonic pointers used by the scan. Their total movement per anchor remains O(n), so the scan phase remains O(n²). The complete auxiliary-space bound also includes the sorting algorithm's O(s) space.",
    id: "alg-two-pointers-complexity-review-011",
    learningStage: "foundations",
    primarySkillAtomId: "account_for_duplicate_skipping_work",
    secondarySkillAtomIds: [
      "bound_duplicate_skip_pointer_movement",
      "avoid_double_counting_pointer_loops",
    ],
    type: "complexity_check",
    prompt: `In sorted three-sum, after finding a result, the code skips repeated left and right values with additional while loops.

How do these loops affect the standard O(n²) time bound?`,
    options: [
      {
        id: "remain_quadratic",
        text: "The bound remains O(n²), because duplicate skipping only advances the same monotonic pointers within each anchor scan.",
        isCorrect: true,
      },
      {
        id: "becomes_cubic",
        text: "The bound becomes O(n³) because every additional while loop adds another multiplicative factor of n.",
        isCorrect: false,
      },
      {
        id: "becomes_linear",
        text: "The bound becomes O(n) because duplicates reduce the number of unique values.",
        isCorrect: false,
      },
      {
        id: "becomes_logarithmic",
        text: "The bound becomes O(n log n) because equal runs are skipped.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Skip loops consume positions that the pointers would otherwise traverse later.",
      mentalModelCorrection:
        "Syntactically separate loops do not multiply complexity when their combined movement shares one bounded monotonic traversal.",
      mistakeTypes: ["duplicate_skip_loops_multiplied"],
      nextAction:
        "Charge each pointer advance once within the enclosing anchor scan.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-two-pointers-complexity-review-012",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_duplicate_skipping_as_constant",
    secondarySkillAtomIds: [
      "recognize_linear_skip_run",
      "derive_total_bounded_skip_cost",
    ],
    type: "mistake_review",
    prompt: `A reviewer says:

"Skipping duplicates is O(1) because all skipped values are equal."

What is the precise correction?`,
    options: [
      {
        id: "one_skip_run_can_be_linear",
        text: "A single duplicate run can contain O(n) values, although total monotonic skipping may still fit within the scan's O(n) movement bound.",
        isCorrect: true,
      },
      {
        id: "equal_values_take_zero_time",
        text: "The claim is correct because comparing equal values has no cost.",
        isCorrect: false,
      },
      {
        id: "every_skip_is_quadratic",
        text: "Every duplicate-skipping loop is O(n²).",
        isCorrect: false,
      },
      {
        id: "duplicates_change_space_only",
        text: "Skipping duplicates affects space complexity but never time complexity.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Equality of values does not limit how many array positions the pointer may cross.",
      mentalModelCorrection:
        "A loop can be linear in isolation yet add no new asymptotic factor when its movement is part of an already bounded traversal.",
      mistakeTypes: ["duplicate_run_assumed_constant_time"],
      nextAction:
        "Separate the cost of one skip loop from the aggregate cost across the complete scan.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-two-pointers-complexity-review-013",
    learningStage: "foundations",
    primarySkillAtomId: "compare_nested_scan_sort_scan_and_three_sum",
    secondarySkillAtomIds: [
      "compare_complete_algorithm_costs",
      "distinguish_pair_search_from_three_sum",
    ],
    type: "solution_comparison",
    prompt: `Compare these strategies on n values:

A. Pair search with two nested loops.
B. Sort, then perform one two-pointer pair scan.
C. Sort, then for every anchor perform a two-pointer suffix scan for three-sum.

Which comparison is correct?`,
    options: [
      {
        id: "n2_nlogn_n2",
        text: "A is O(n²), B is O(n log n), and C is O(n²).",
        isCorrect: true,
      },
      {
        id: "n2_n_n",
        text: "A is O(n²), while B and C are both O(n) because they use two pointers.",
        isCorrect: false,
      },
      {
        id: "n3_nlogn_nlogn",
        text: "A is O(n³), while B and C are O(n log n).",
        isCorrect: false,
      },
      {
        id: "all_n2",
        text: "All three are O(n²) because each considers combinations of values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The pair scan occurs once in B but is repeated for every anchor in C.",
      mentalModelCorrection:
        "The same two-pointer subroutine can contribute different total costs depending on its enclosing control structure.",
      mistakeTypes: ["pair_and_three_sum_complexities_conflated"],
      nextAction: "Count how many times each scan phase is invoked.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-two-pointers-complexity-review-014",
    learningStage: "foundations",
    primarySkillAtomId: "validate_linear_pointer_complexity_argument",
    secondarySkillAtomIds: [
      "prove_no_pointer_position_is_revisited",
      "reject_syntax_based_big_o",
    ],
    type: "mistake_review",
    prompt: `Which explanation provides the strongest justification that a pointer-based scan is O(n)?`,
    options: [
      {
        id: "monotonic_bounded_total_advances",
        text: "Each pointer moves only in one direction, never resets, and can cross at most n positions, so the combined number of advances is O(n).",
        isCorrect: true,
      },
      {
        id: "while_loop_only",
        text: "The code contains one while loop, so it must be O(n).",
        isCorrect: false,
      },
      {
        id: "left_right_names",
        text: "The variables are named left and right, which guarantees linear time.",
        isCorrect: false,
      },
      {
        id: "constant_space_implies_linear",
        text: "The algorithm uses O(1) auxiliary space, so its running time is O(n).",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The explanation gives a global upper bound on all pointer movement.",
      mentalModelCorrection:
        "Big-O follows from bounded work, not from variable names, loop count, or space usage.",
      mistakeTypes: ["pointer_complexity_justified_by_surface_syntax"],
      nextAction:
        "Prove how often each pointer can cross an input position over the complete execution.",
      result: "diagnostic",
    },
  },
];
