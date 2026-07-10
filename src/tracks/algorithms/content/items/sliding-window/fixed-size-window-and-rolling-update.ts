export const fixedSizeWindowAndRollingUpdateQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_complete_fixed_size_window",
    secondarySkillAtomIds: [
      "distinguish_partial_from_complete_window",
      "enforce_exact_window_width",
    ],
    type: "single_choice",
    prompt: `A sliding-window algorithm must evaluate contiguous windows of exactly k elements.

When is the current inclusive window [left, right] complete?`,
    options: [
      {
        id: "size_equals_k",
        text: "When right - left + 1 === k.",
        isCorrect: true,
      },
      {
        id: "size_less_equal_k",
        text: "Whenever right - left + 1 <= k.",
        isCorrect: false,
      },
      {
        id: "right_equals_k",
        text: "Whenever right === k.",
        isCorrect: false,
      },
      {
        id: "left_equals_zero",
        text: "Only while left === 0.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The fixed-size contract requires exactly k included positions.",
      mentalModelCorrection:
        "A growing prefix smaller than k is initialization state, not a valid complete window.",
      mistakeTypes: ["partial_window_treated_as_complete"],
      nextAction:
        "Derive the current width from the declared boundary convention before recording a result.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-002",
    learningStage: "foundations",
    primarySkillAtomId: "initialize_first_fixed_window",
    secondarySkillAtomIds: [
      "accumulate_first_k_elements",
      "delay_recording_until_complete",
    ],
    type: "subgoal_ordering",
    prompt:
      "Which sequence correctly initializes a maximum-sum scan over windows of width k?",
    options: [
      {
        id: "build_first_window_then_record",
        text: "Accumulate the first k elements, then use that complete sum to initialize the best result.",
        isCorrect: true,
      },
      {
        id: "record_each_partial_sum",
        text: "Treat every prefix sum before k elements are present as a candidate window.",
        isCorrect: false,
      },
      {
        id: "skip_first_window",
        text: "Begin comparison only after adding element k, so the first width-k window is never evaluated.",
        isCorrect: false,
      },
      {
        id: "initialize_best_zero",
        text: "Initialize the best sum to 0 and avoid computing the first complete window.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The first valid candidate consists of indexes 0 through k - 1.",
      mentalModelCorrection:
        "Best-state initialization should come from a real complete candidate, especially when values may be negative.",
      mistakeTypes: ["first_complete_window_not_used_for_initialization"],
      nextAction:
        "Establish one valid width-k window before comparing later candidates.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-003",
    learningStage: "foundations",
    primarySkillAtomId: "apply_fixed_window_rolling_update",
    secondarySkillAtomIds: [
      "add_incoming_contribution",
      "remove_outgoing_contribution",
    ],
    type: "single_choice",
    prompt: `The current width-k window covers indexes [left, right].

To slide it one position right, which sum update is correct?`,
    options: [
      {
        id: "subtract_outgoing_add_incoming",
        text: "Subtract values[left], increment both boundaries, and add the new values[right].",
        isCorrect: true,
      },
      {
        id: "add_incoming_only",
        text: "Increment right and add values[right] without removing values[left].",
        isCorrect: false,
      },
      {
        id: "subtract_new_left",
        text: "Increment left first and subtract the value at the new left boundary.",
        isCorrect: false,
      },
      {
        id: "recalculate_unrelated_prefix",
        text: "Replace the sum with the sum of all values before left.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Exactly one old element leaves and exactly one new element enters during a one-position slide.",
      mentalModelCorrection:
        "Rolling state must remove the outgoing contribution and add the incoming contribution exactly once.",
      mistakeTypes: ["fixed_window_rolling_update_incomplete"],
      nextAction:
        "Name the element leaving the old interval and the element entering the new interval.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-fixed-size-window-rolling-update-004",
    learningStage: "foundations",
    primarySkillAtomId: "identify_fixed_window_outgoing_index",
    secondarySkillAtomIds: [
      "derive_eviction_index_from_right",
      "maintain_exact_window_width",
    ],
    type: "single_choice",
    prompt: `A one-pass implementation adds values[right] on every iteration.

Once right >= k, which element must be removed so the maintained sum represents the latest width-k window?`,
    options: [
      {
        id: "right_minus_k",
        text: "values[right - k], because that is the element immediately before the new width-k window.",
        isCorrect: true,
      },
      {
        id: "right_minus_k_plus_one",
        text: "values[right - k + 1], because it is the first element that should remain in the window.",
        isCorrect: false,
      },
      {
        id: "right",
        text: "values[right], because every incoming element must be removed immediately.",
        isCorrect: false,
      },
      {
        id: "zero_always",
        text: "values[0], regardless of how far the window has moved.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "After adding index right, the desired window begins at right - k + 1, so index right - k has just expired.",
      mentalModelCorrection:
        "Evict the element outside the new window, not the new leftmost element that must remain.",
      mistakeTypes: ["wrong_fixed_window_eviction_index"],
      nextAction:
        "Write the exact inclusive indexes of the new width-k window.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-fixed-size-window-rolling-update-005",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_wrong_outgoing_element",
    secondarySkillAtomIds: [
      "preserve_new_leftmost_element",
      "review_rolling_sum_eviction",
    ],
    type: "mistake_review",
    prompt: `A width-3 window currently covers indexes [2, 4].

To slide to [3, 5], the code subtracts values[3] and adds values[5].

What is wrong?`,
    options: [
      {
        id: "subtracts_retained_element",
        text: "values[3] remains inside the new window; the outgoing contribution is values[2].",
        isCorrect: true,
      },
      {
        id: "incoming_index_wrong",
        text: "values[5] is not part of the new window.",
        isCorrect: false,
      },
      {
        id: "both_old_elements_leave",
        text: "Both values[2] and values[3] should be subtracted.",
        isCorrect: false,
      },
      {
        id: "no_value_should_leave",
        text: "Sliding a fixed-size window never removes an old value.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The overlap between the old and new windows contains indexes 3 and 4.",
      mentalModelCorrection:
        "Only the old left boundary exits during a one-position fixed-window slide.",
      mistakeTypes: ["new_left_value_evicted_instead_of_old_left"],
      nextAction:
        "Compare the old and new index sets and remove only their difference.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-fixed-size-window-rolling-update-006",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_recording_k_plus_one_window",
    secondarySkillAtomIds: [
      "evict_before_evaluating_fixed_window",
      "synchronize_sum_and_boundaries",
    ],
    type: "mistake_review",
    prompt: `A loop adds values[right] to windowSum and immediately compares windowSum with bestSum.

Only afterward, when the width exceeds k, it removes values[left] and increments left.

What can happen?`,
    options: [
      {
        id: "records_oversized_window",
        text: "The comparison may evaluate a k + 1 element sum as though it were a valid width-k candidate.",
        isCorrect: true,
      },
      {
        id: "first_window_is_always_skipped",
        text: "The first complete width-k window can never be evaluated.",
        isCorrect: false,
      },
      {
        id: "window_becomes_too_small",
        text: "The maintained sum always represents k - 1 elements.",
        isCorrect: false,
      },
      {
        id: "only_space_is_affected",
        text: "The result remains correct; only auxiliary space changes.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The state is evaluated while it still includes both the expired and incoming elements.",
      mentalModelCorrection:
        "For exact-width candidates, shrink an oversized window before recording or comparing it.",
      mistakeTypes: ["k_plus_one_window_recorded_as_valid"],
      nextAction:
        "Ensure the maintained state represents exactly k elements at the moment of evaluation.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-007",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_recording_incomplete_fixed_window",
    secondarySkillAtomIds: [
      "recognize_initial_growth_phase",
      "record_only_exact_width_candidates",
    ],
    type: "mistake_review",
    prompt: `A width-4 maximum-sum scan updates bestSum after adding every new value, including when the current prefix contains only one, two, or three elements.

Why is this incorrect?`,
    options: [
      {
        id: "partial_prefixes_not_candidates",
        text: "Those prefixes are not complete width-4 windows and must not compete with valid candidates.",
        isCorrect: true,
      },
      {
        id: "prefixes_are_never_contiguous",
        text: "Prefixes are not contiguous ranges.",
        isCorrect: false,
      },
      {
        id: "best_sum_requires_sorting",
        text: "A maximum sum cannot be tracked before the array is sorted.",
        isCorrect: false,
      },
      {
        id: "only_final_window_valid",
        text: "Only the last width-4 window is a valid candidate.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The output contract compares only ranges containing exactly four elements.",
      mentalModelCorrection:
        "Initialization work may build state incrementally without producing valid outputs at every step.",
      mistakeTypes: ["incomplete_fixed_window_recorded"],
      nextAction:
        "Gate best-state updates on the exact window-width condition.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-008",
    learningStage: "foundations",
    primarySkillAtomId: "trace_fixed_window_rolling_sum",
    secondarySkillAtomIds: [
      "apply_incoming_outgoing_update",
      "compare_complete_window_sums",
    ],
    type: "edge_case_drill",
    prompt: `Find the maximum sum of a width-3 window:

values = [2, 1, 5, 1, 3, 2]

What maximum sum is found?`,
    options: [
      {
        id: "nine",
        text: "9, from the window [5, 1, 3].",
        isCorrect: true,
      },
      {
        id: "eight",
        text: "8, from the first window [2, 1, 5].",
        isCorrect: false,
      },
      {
        id: "twelve",
        text: "12, from combining non-contiguous large values.",
        isCorrect: false,
      },
      {
        id: "six",
        text: "6, because only the last window is considered.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The complete window sums are 8, 7, 9, and 6.",
      mentalModelCorrection:
        "Each next sum reuses the overlapping contribution while replacing one outgoing value with one incoming value.",
      mistakeTypes: ["fixed_window_rolling_trace_mismatch"],
      nextAction:
        "List each exact-width interval and update its sum from the preceding interval.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-009",
    learningStage: "foundations",
    primarySkillAtomId: "handle_unit_window_width",
    secondarySkillAtomIds: [
      "reason_about_k_equals_one",
      "treat_each_element_as_complete_window",
    ],
    type: "edge_case_drill",
    prompt: `A maximum-sum fixed-window function receives:

values = [-4, 7, 2]
k = 1

What is the correct result?`,
    options: [
      {
        id: "seven",
        text: "7, because each individual element is one complete width-1 window.",
        isCorrect: true,
      },
      {
        id: "five",
        text: "5, because adjacent values must still be combined.",
        isCorrect: false,
      },
      {
        id: "zero",
        text: "0, because a width-1 window has no outgoing value.",
        isCorrect: false,
      },
      {
        id: "invalid_k",
        text: "No result, because k must be greater than 1.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A one-element contiguous range exactly satisfies a width of one.",
      mentalModelCorrection:
        "The rolling-window model still applies at k = 1; each slide replaces the previous single element.",
      mistakeTypes: ["unit_window_width_rejected_or_mishandled"],
      nextAction:
        "Apply the exact-width definition directly to the smallest valid k.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-010",
    learningStage: "foundations",
    primarySkillAtomId: "handle_full_input_window_width",
    secondarySkillAtomIds: [
      "reason_about_k_equals_n",
      "recognize_single_complete_window",
    ],
    type: "edge_case_drill",
    prompt: `A fixed-width scan receives:

values = [3, -1, 4]
k = values.length

How many complete candidate windows exist?`,
    options: [
      {
        id: "one_window",
        text: "Exactly one: the complete input array.",
        isCorrect: true,
      },
      {
        id: "three_windows",
        text: "Three, one beginning at every index.",
        isCorrect: false,
      },
      {
        id: "zero_windows",
        text: "None, because k must be smaller than the input length.",
        isCorrect: false,
      },
      {
        id: "two_windows",
        text: "Two, because both boundaries may move once.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Only start index 0 leaves enough elements to form a width-n range.",
      mentalModelCorrection:
        "When k equals n, initialization produces the only valid candidate and no slide is possible.",
      mistakeTypes: ["full_input_window_count_misunderstood"],
      nextAction: "Use n - k + 1 to count complete fixed-width windows.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-fixed-size-window-rolling-update-011",
    learningStage: "foundations",
    primarySkillAtomId: "handle_unrealizable_fixed_window_width",
    secondarySkillAtomIds: [
      "recognize_no_complete_window",
      "avoid_partial_fallback",
    ],
    type: "output_contract_analysis",
    prompt: `A fixed-width function returns null when no complete candidate exists.

values = [3, 8]
k = 4

What should it return?`,
    options: [
      {
        id: "null_no_complete_window",
        text: "null, because the input cannot contain four contiguous elements.",
        isCorrect: true,
      },
      {
        id: "sum_eleven",
        text: "11, using the largest available partial window.",
        isCorrect: false,
      },
      {
        id: "pad_missing_values",
        text: "11 after treating two missing elements as zero.",
        isCorrect: false,
      },
      {
        id: "return_eight",
        text: "8, because one element may substitute for a larger window.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "No start position can produce the exact requested width.",
      mentalModelCorrection:
        "Do not silently replace an exact-width contract with a best-effort partial range.",
      mistakeTypes: ["missing_no_complete_fixed_window_case"],
      nextAction:
        "Validate candidate existence before initializing rolling state from k elements.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "The first window is computed once, and every later window is derived with one subtraction and one addition. There are n - k + 1 windows, so the total time is O(n) with constant rolling state.",
    id: "alg-fixed-size-window-rolling-update-012",
    learningStage: "foundations",
    primarySkillAtomId: "derive_fixed_window_rolling_complexity",
    secondarySkillAtomIds: [
      "avoid_repeated_window_rescanning",
      "reuse_overlapping_window_state",
    ],
    type: "complexity_check",
    prompt:
      "A width-k sum is initialized once, then each later window subtracts one outgoing value and adds one incoming value. What are the standard complexity bounds?",
    options: [
      {
        id: "linear_constant",
        text: "O(n) time and O(1) auxiliary space.",
        isCorrect: true,
      },
      {
        id: "n_times_k",
        text: "O(nk) time because every window contains k elements.",
        isCorrect: false,
      },
      {
        id: "quadratic",
        text: "O(n²) time because two boundaries are used.",
        isCorrect: false,
      },
      {
        id: "constant",
        text: "O(1) time because each individual update is constant.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each slide performs constant new work instead of rebuilding the overlapping aggregate.",
      mentalModelCorrection:
        "Constant work per candidate yields linear total time because the number of candidate windows grows with n.",
      mistakeTypes: ["rolling_fixed_window_claimed_n_times_k"],
      nextAction:
        "Separate first-window initialization from constant-time updates for later windows.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(nk)",
    complexityExplanation:
      "There are O(n) complete windows in the worst case, and summing k elements from scratch for each one costs O(k), producing O(nk) total time.",
    id: "alg-fixed-size-window-rolling-update-013",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_repeated_fixed_window_rescanning",
    secondarySkillAtomIds: [
      "compare_rescanning_with_rolling_state",
      "identify_redundant_overlap_work",
    ],
    type: "complexity_check",
    prompt: `For every possible start index, an implementation computes:

let sum = 0;

for (let offset = 0; offset < k; offset++) {
  sum += values[start + offset];
}

What is the resulting time complexity?`,
    options: [
      {
        id: "n_times_k",
        text: "O(nk) in the worst case, because each of O(n) windows is summed from scratch over k elements.",
        isCorrect: true,
      },
      {
        id: "linear",
        text: "O(n), because neighboring windows overlap.",
        isCorrect: false,
      },
      {
        id: "logarithmic",
        text: "O(log n), because start advances monotonically.",
        isCorrect: false,
      },
      {
        id: "constant",
        text: "O(1), because sum is a scalar variable.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The implementation does not reuse the overlap between neighboring windows.",
      mentalModelCorrection:
        "Overlapping candidates enable a rolling optimization only when prior aggregate state is actually reused.",
      mistakeTypes: ["fixed_windows_recomputed_from_scratch"],
      nextAction:
        "Replace each full rescan with removal of the outgoing value and addition of the incoming value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-fixed-size-window-rolling-update-014",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_stale_outgoing_contribution",
    secondarySkillAtomIds: [
      "keep_rolling_state_aligned_with_boundaries",
      "remove_expired_window_value",
    ],
    type: "mistake_review",
    prompt: `A width-k scan increments left and right correctly, but its rolling sum only adds each incoming value and never subtracts the value passed by left.

What does windowSum represent after several slides?`,
    options: [
      {
        id: "accumulated_history_not_current_window",
        text: "It contains contributions from expired positions and no longer represents exactly the current window.",
        isCorrect: true,
      },
      {
        id: "current_window_correctly",
        text: "It still represents the current window because boundary movement automatically changes the scalar sum.",
        isCorrect: false,
      },
      {
        id: "only_outgoing_values",
        text: "It contains only values that have already left the window.",
        isCorrect: false,
      },
      {
        id: "always_k_plus_one",
        text: "It always represents exactly k + 1 elements regardless of how many slides occur.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Changing index boundaries does not automatically remove values from stored aggregate state.",
      mentalModelCorrection:
        "Every element leaving the logical interval must also leave the rolling representation.",
      mistakeTypes: ["expired_values_remain_in_rolling_state"],
      nextAction:
        "Pair every left-boundary advance with removal of the outgoing contribution.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-fixed-size-window-rolling-update-015",
    learningStage: "foundations",
    primarySkillAtomId: "order_fixed_window_slide_updates",
    secondarySkillAtomIds: [
      "preserve_old_outgoing_index",
      "evaluate_new_complete_window",
    ],
    type: "subgoal_ordering",
    prompt: `The current complete window is [left, right], and the next incoming index is right + 1.

Which sequence safely derives and evaluates the next complete window?`,
    options: [
      {
        id: "remove_old_add_new_move_record",
        text: "Remove values[left], add values[right + 1], increment left and right, then evaluate the resulting width-k window.",
        isCorrect: true,
      },
      {
        id: "move_left_then_remove",
        text: "Increment left, remove values[left], then add the incoming value.",
        isCorrect: false,
      },
      {
        id: "add_record_remove",
        text: "Add the incoming value, evaluate the oversized state, then remove the outgoing value.",
        isCorrect: false,
      },
      {
        id: "move_both_without_state",
        text: "Increment both boundaries without changing the rolling state.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The old left value must be identified before the boundary stops referring to it, and evaluation must occur after state matches the new interval.",
      mentalModelCorrection:
        "Update order must preserve access to the outgoing value and synchronize state before recording.",
      mistakeTypes: ["fixed_window_slide_updates_ordered_incorrectly"],
      nextAction:
        "Describe the old interval, the outgoing index, the incoming index, and the new interval in sequence.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-fixed-size-window-rolling-update-016",
    learningStage: "foundations",
    primarySkillAtomId: "state_fixed_window_rolling_invariant",
    secondarySkillAtomIds: [
      "synchronize_boundaries_and_rolling_state",
      "prove_complete_window_coverage",
    ],
    type: "invariant_identification",
    prompt:
      "Which invariant most completely supports a fixed-size rolling-window scan?",
    options: [
      {
        id: "state_matches_exact_complete_window",
        text: "Whenever a candidate is evaluated, [left, right] contains exactly k elements, the rolling state equals the aggregate of exactly those elements, all earlier complete windows have been processed, and the next slide removes the old left contribution and adds one new right contribution.",
        isCorrect: true,
      },
      {
        id: "state_contains_recent_values",
        text: "The rolling state contains some recently observed values, even if it does not match the current boundaries.",
        isCorrect: false,
      },
      {
        id: "partial_windows_are_candidates",
        text: "Every growing prefix and every oversized interval is a valid width-k candidate.",
        isCorrect: false,
      },
      {
        id: "each_window_rescanned",
        text: "Correctness requires every complete window to be summed again from scratch.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Correctness requires exact width, aggregate-boundary agreement, complete candidate coverage, and one-for-one rolling updates.",
      mentalModelCorrection:
        "A fixed-size window is not merely two moving indexes; its boundaries and maintained state must describe the same exact candidate.",
      mistakeTypes: ["fixed_window_rolling_invariant_incomplete"],
      nextAction:
        "Verify width, state membership, candidate coverage, outgoing removal, and incoming addition after every slide.",
      result: "diagnostic",
    },
  },
];
