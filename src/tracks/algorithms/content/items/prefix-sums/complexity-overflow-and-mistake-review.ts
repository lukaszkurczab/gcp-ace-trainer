export const complexityOverflowAndMistakeReviewQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(d)",
    expectedTimeComplexity: "O(n) expected",
    complexityExplanation:
      "Both boundaries move only forward, so they advance O(n) times in total. With expected O(1) Map updates, the complete scan takes expected O(n) time. The frequency map stores at most d distinct values simultaneously present in the window.",
    id: "alg-window-complexity-overflow-review-001",
    learningStage: "foundations",
    primarySkillAtomId: "qualify_linear_window_complexity",
    secondarySkillAtomIds: [
      "include_state_operation_cost",
      "bound_frequency_map_storage",
    ],
    type: "complexity_check",
    prompt:
      "A variable-size window uses a frequency Map. Both boundaries move only forward, and each Map lookup or update is expected O(1). Which complexity statement is precise?",
    options: [
      {
        id: "expected_linear_with_distinct_storage",
        text: "Expected O(n) time and O(d) auxiliary space, where d is the maximum number of distinct values simultaneously stored.",
        isCorrect: true,
      },
      {
        id: "worst_case_constant_space",
        text: "O(n) worst-case time and O(1) space because the algorithm stores only one Map object.",
        isCorrect: false,
      },
      {
        id: "quadratic_due_to_two_boundaries",
        text: "O(n²) time because both left and right may each reach n.",
        isCorrect: false,
      },
      {
        id: "constant_due_to_map",
        text: "O(1) time because every individual Map operation is expected O(1).",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Total boundary movement is linear, but the cost and size of the maintained state must still be included.",
      mentalModelCorrection:
        "A linear pointer schedule does not make storage constant, and expected constant-time hashing does not establish a worst-case guarantee.",
      mistakeTypes: [
        "window_complexity_ignores_state_operations",
        "map_object_treated_as_constant_space",
      ],
      nextAction:
        "State the boundary-movement bound, operation-cost assumption, and maximum number of stored keys separately.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(n) temporary per iteration in the worst case",
    expectedTimeComplexity: "O(n²)",
    complexityExplanation:
      "Although the boundaries move forward, copying a current window of length O(n) on O(n) iterations can perform O(n²) total element-copying work. The temporary copied window may also require O(n) space.",
    id: "alg-window-complexity-overflow-review-002",
    learningStage: "foundations",
    primarySkillAtomId: "detect_hidden_window_copy_cost",
    secondarySkillAtomIds: [
      "include_helper_operation_complexity",
      "avoid_linear_loop_surface_analysis",
    ],
    type: "mistake_review",
    prompt: `A scan moves right once through the input, but on every iteration it executes:

const current = values.slice(left, right + 1);

Assume slice copies every selected element. Why is claiming O(n) time unsafe?`,
    options: [
      {
        id: "copied_lengths_can_sum_quadratically",
        text: "The copied window can have length O(n) on O(n) iterations, so the total copying cost can be O(n²).",
        isCorrect: true,
      },
      {
        id: "slice_is_always_constant",
        text: "The O(n) claim is correct because slice is always O(1).",
        isCorrect: false,
      },
      {
        id: "two_boundaries_force_quadratic",
        text: "The code is O(n²) only because it contains both left and right variables.",
        isCorrect: false,
      },
      {
        id: "copying_affects_space_only",
        text: "Copying changes only space complexity and can never affect running time.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The loop body contains work proportional to the current window length.",
      mentalModelCorrection:
        "Complexity must include helper operations, allocations, and copies rather than counting only visible pointer advances.",
      mistakeTypes: ["hidden_window_copy_cost_ignored"],
      nextAction:
        "Sum the lengths of all copied intervals across the complete execution.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-complexity-overflow-review-003",
    learningStage: "foundations",
    primarySkillAtomId: "compare_window_state_storage_bounds",
    secondarySkillAtomIds: [
      "distinguish_scalar_map_and_deque_space",
      "bound_simultaneous_window_state",
    ],
    type: "solution_comparison",
    prompt: `Under standard implementations, which auxiliary-space comparison is correct?

A. A fixed-window sum maintained in one numeric accumulator.
B. A frequency map for at most d distinct active values.
C. An index-based monotonic deque for a window of width k.`,
    options: [
      {
        id: "constant_d_k",
        text: "A uses O(1), B uses O(d), and C uses O(k) auxiliary space.",
        isCorrect: true,
      },
      {
        id: "all_constant_objects",
        text: "All three use O(1) because each algorithm stores only one state object.",
        isCorrect: false,
      },
      {
        id: "all_linear_input",
        text: "All three necessarily use O(n) auxiliary space.",
        isCorrect: false,
      },
      {
        id: "n_constant_d",
        text: "A uses O(n), B uses O(1), and C uses O(d).",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Space depends on the maximum number of simultaneously stored entries, not the number of variables or container objects.",
      mentalModelCorrection:
        "A scalar aggregate, a keyed frequency structure, and a deque have different capacity bounds.",
      mistakeTypes: ["window_state_container_count_used_as_space_bound"],
      nextAction:
        "Identify the maximum number of values or indexes each structure can hold at one time.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-complexity-overflow-review-004",
    learningStage: "foundations",
    primarySkillAtomId: "separate_auxiliary_and_output_space",
    secondarySkillAtomIds: [
      "account_for_copied_window_output",
      "compare_boundaries_with_materialized_values",
    ],
    type: "complexity_check",
    prompt: `An algorithm finds the optimal window using O(1) auxiliary state.

Implementation A returns [bestLeft, bestRight].
Implementation B returns values.slice(bestLeft, bestRight + 1), whose length is L.

Which space statement is precise?`,
    options: [
      {
        id: "boundaries_constant_copy_linear_output",
        text: "A has O(1) result space, while B requires O(L) output space even though the search itself still uses O(1) auxiliary space.",
        isCorrect: true,
      },
      {
        id: "both_constant",
        text: "Both require O(1) total space because the search uses only scalar variables.",
        isCorrect: false,
      },
      {
        id: "both_linear_auxiliary",
        text: "Both require O(n) auxiliary space because the input contains n values.",
        isCorrect: false,
      },
      {
        id: "copy_changes_auxiliary_only",
        text: "B uses O(L) auxiliary space but no output space.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Materializing the selected values allocates storage proportional to the returned window length.",
      mentalModelCorrection:
        "Auxiliary working memory and memory required by the requested output should be reported separately.",
      mistakeTypes: ["output_space_omitted_from_window_analysis"],
      nextAction:
        "Classify every allocation as input, auxiliary state, temporary storage, or returned output.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-complexity-overflow-review-005",
    learningStage: "foundations",
    primarySkillAtomId: "choose_safe_window_sum_width",
    secondarySkillAtomIds: [
      "derive_maximum_aggregate_magnitude",
      "avoid_32_bit_accumulator_overflow",
    ],
    type: "single_choice",
    prompt: `A TypeScript function sums windows where:

n <= 100_000
|values[i]| <= 1_000_000_000

The absolute sum can therefore reach about 10^14.

Which accumulator choice is appropriate?`,
    options: [
      {
        id: "number_safe_under_bound",
        text: "A JavaScript Number is exact for these integer bounds, but a signed 32-bit accumulator would be unsafe.",
        isCorrect: true,
      },
      {
        id: "signed_32_bit_safe",
        text: "A signed 32-bit integer is sufficient because each individual value fits in 32 bits.",
        isCorrect: false,
      },
      {
        id: "boolean_accumulator",
        text: "A boolean is sufficient because only window validity matters.",
        isCorrect: false,
      },
      {
        id: "number_always_exact",
        text: "A JavaScript Number is exact for integer sums of any magnitude.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The accumulator must hold the aggregate bound, not merely one input element.",
      mentalModelCorrection:
        "Numeric-width analysis multiplies the largest contribution by the maximum number of contributions that may coexist.",
      mistakeTypes: ["window_sum_width_based_only_on_element_width"],
      nextAction:
        "Compute the largest possible absolute aggregate and compare it with the accumulator's exact range.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-window-complexity-overflow-review-006",
    learningStage: "foundations",
    primarySkillAtomId: "detect_unsafe_javascript_integer_aggregate",
    secondarySkillAtomIds: [
      "respect_number_safe_integer_limit",
      "preserve_exact_threshold_comparisons",
    ],
    type: "mistake_review",
    prompt: `A TypeScript algorithm uses integer inputs whose possible window sum can exceed Number.MAX_SAFE_INTEGER.

It compares the rolling sum with an exact integer target to decide when to shrink.

What is the risk?`,
    options: [
      {
        id: "rounded_sum_can_change_decision",
        text: "The Number value may no longer represent every integer exactly, so equality and threshold decisions can be wrong.",
        isCorrect: true,
      },
      {
        id: "number_throws_automatically",
        text: "JavaScript automatically throws an overflow exception before any inaccurate comparison occurs.",
        isCorrect: false,
      },
      {
        id: "only_printing_is_affected",
        text: "Loss of integer precision can affect formatting but never algorithmic comparisons.",
        isCorrect: false,
      },
      {
        id: "window_length_prevents_overflow",
        text: "Using two moving boundaries guarantees that the numeric sum stays safe.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The validity invariant depends on exact comparison of an aggregate outside Number's safe-integer range.",
      mentalModelCorrection:
        "A mathematically correct window rule can fail when its numeric representation cannot preserve the required values.",
      mistakeTypes: ["unsafe_number_precision_breaks_window_validity"],
      nextAction:
        "Use BigInt or another exact representation when all operands are integers and the derived bound exceeds the safe-integer range.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-complexity-overflow-review-007",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_mutating_input_for_window_eviction",
    secondarySkillAtomIds: [
      "preserve_original_input_indexes",
      "include_array_shift_cost",
    ],
    type: "mistake_review",
    prompt: `A JavaScript implementation simulates left-boundary movement with:

values.shift();

The contract requires preserving the input and returning original indexes.

What are the main problems?`,
    options: [
      {
        id: "mutation_index_loss_and_linear_shift",
        text: "shift mutates the caller's array, changes the meaning of original indexes, and typically moves remaining elements in O(n) time.",
        isCorrect: true,
      },
      {
        id: "shift_is_pointer_only",
        text: "There is no problem because shift only changes a logical pointer in O(1).",
        isCorrect: false,
      },
      {
        id: "mutation_improves_contract",
        text: "Mutating the array makes original-index output more reliable.",
        isCorrect: false,
      },
      {
        id: "only_space_changes",
        text: "shift affects only auxiliary space and cannot alter correctness or time complexity.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Physical removal is observably different from advancing an index into an unchanged array.",
      mentalModelCorrection:
        "Use a left boundary for logical eviction unless mutation is explicitly allowed and its cost is acceptable.",
      mistakeTypes: [
        "window_algorithm_mutates_read_only_input",
        "array_shift_hides_linear_eviction_cost",
      ],
      nextAction:
        "Keep the input unchanged and represent the active start with an index.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-complexity-overflow-review-008",
    learningStage: "foundations",
    primarySkillAtomId: "review_window_solution_nonfunctional_contracts",
    secondarySkillAtomIds: [
      "audit_complexity_numeric_and_mutation_assumptions",
      "separate_working_state_from_output_cost",
    ],
    type: "invariant_identification",
    prompt:
      "Which review statement most completely evaluates a sliding-window solution beyond its core boundary logic?",
    options: [
      {
        id: "complete_cross_cutting_review",
        text: "Include all helper-operation costs, bound total stored state, separate auxiliary and output space, prove the accumulator can represent every possible aggregate exactly, and verify that preprocessing or eviction does not violate the input-mutation contract.",
        isCorrect: true,
      },
      {
        id: "two_pointers_imply_linear",
        text: "The solution is automatically O(n), O(1), numerically safe, and non-mutating whenever it uses left and right pointers.",
        isCorrect: false,
      },
      {
        id: "correct_examples_are_sufficient",
        text: "Passing several examples removes the need to inspect overflow, hidden copies, or mutation.",
        isCorrect: false,
      },
      {
        id: "only_boundary_invariant_matters",
        text: "Once the current boundaries are correct, runtime, storage, numeric representation, and side effects cannot affect correctness.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Production correctness includes resource assumptions, numeric representation, result allocation, and observable side effects.",
      mentalModelCorrection:
        "A valid window invariant is necessary but does not by itself establish the full implementation contract.",
      mistakeTypes: ["window_cross_cutting_review_incomplete"],
      nextAction:
        "Audit time, auxiliary storage, output storage, numeric bounds, and mutation independently after proving the core algorithm.",
      result: "diagnostic",
    },
  },
];

