export const oppositeDirectionSortedSearchQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_opposite_end_pair_search",
    secondarySkillAtomIds: [
      "use_sorted_order_for_pair_elimination",
      "interpret_endpoint_candidates",
    ],
    type: "strategy_choice",
    prompt:
      "A sorted array must be searched for two distinct values whose sum equals a target. Which pointer interpretation matches the standard opposite-direction strategy?",
    options: [
      {
        id: "endpoint_pair_candidates",
        text: "left and right identify the current candidate pair, and sorted order determines which endpoint can be discarded.",
        isCorrect: true,
      },
      {
        id: "active_window_boundaries",
        text: "left and right bound one contiguous range whose interior sum determines validity.",
        isCorrect: false,
      },
      {
        id: "read_write_positions",
        text: "left reads input while right marks the next output position.",
        isCorrect: false,
      },
      {
        id: "independent_random_guesses",
        text: "left and right are moved experimentally until a pair happens to match.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The objective concerns two selected endpoint values, and sorted order provides a legal elimination rule.",
      mentalModelCorrection:
        "Opposite-end pair search is not a sliding window. The interior elements are remaining candidates, not part of one evaluated range.",
      mistakeTypes: ["opposite_end_pair_roles_misclassified"],
      nextAction:
        "State what pair is currently tested and which candidates become impossible after each comparison.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-002",
    learningStage: "foundations",
    primarySkillAtomId: "move_left_when_pair_sum_too_small",
    secondarySkillAtomIds: [
      "justify_pair_sum_movement",
      "eliminate_small_left_candidate",
    ],
    type: "single_choice",
    prompt: `A sorted ascending array is searched for target sum 12.

values[left] = 3
values[right] = 7

What movement is justified?`,
    options: [
      {
        id: "increment_left",
        text: "Move left rightward, because keeping 3 and choosing any smaller right endpoint cannot increase the sum to 12.",
        isCorrect: true,
      },
      {
        id: "decrement_right",
        text: "Move right leftward, because reducing the larger value will increase the sum.",
        isCorrect: false,
      },
      {
        id: "move_both",
        text: "Move both pointers because the current pair failed.",
        isCorrect: false,
      },
      {
        id: "retry_same_pair",
        text: "Keep both pointers unchanged and recompute the same sum.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current sum is too small, and only replacing the smaller endpoint with a larger value can move it upward.",
      mentalModelCorrection:
        "Pointer movement follows a monotonic consequence of sorted order, not trial and error.",
      mistakeTypes: ["pair_sum_too_small_moves_wrong_boundary"],
      nextAction:
        "Ask which endpoint replacement can move the sum in the required direction.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-003",
    learningStage: "foundations",
    primarySkillAtomId: "move_right_when_pair_sum_too_large",
    secondarySkillAtomIds: [
      "justify_pair_sum_movement",
      "eliminate_large_right_candidate",
    ],
    type: "single_choice",
    prompt: `A sorted ascending array is searched for target sum 10.

values[left] = 4
values[right] = 9

What movement is justified?`,
    options: [
      {
        id: "decrement_right",
        text: "Move right leftward, because keeping 9 and choosing any larger left endpoint cannot reduce the sum to 10.",
        isCorrect: true,
      },
      {
        id: "increment_left",
        text: "Move left rightward, because increasing the smaller value will reduce the sum.",
        isCorrect: false,
      },
      {
        id: "move_both",
        text: "Move both pointers whenever the sum is too large.",
        isCorrect: false,
      },
      {
        id: "restart",
        text: "Reset left to zero and right to the end.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current sum is too large, and only replacing the larger endpoint with a smaller value can move it downward.",
      mentalModelCorrection:
        "The sorted order proves that the current right endpoint cannot participate in a valid pair with any remaining left candidate.",
      mistakeTypes: ["pair_sum_too_large_moves_wrong_boundary"],
      nextAction:
        "Identify the endpoint whose replacement moves the sum toward the target.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-004",
    learningStage: "foundations",
    primarySkillAtomId: "prove_left_candidate_elimination",
    secondarySkillAtomIds: [
      "use_sorted_order_for_pair_elimination",
      "state_eliminated_candidate_set",
    ],
    type: "invariant_identification",
    prompt: `In a sorted ascending array, values[left] + values[right] < target.

What exactly has been proved about values[left]?`,
    options: [
      {
        id: "cannot_pair_with_any_remaining_right",
        text: "It cannot form the target with any index from left + 1 through right, because all those values are at most values[right].",
        isCorrect: true,
      },
      {
        id: "cannot_pair_with_any_array_value",
        text: "It cannot form the target with any value anywhere in the array, including already discarded larger values.",
        isCorrect: false,
      },
      {
        id: "right_is_invalid",
        text: "Only values[right] has been disproved as a candidate.",
        isCorrect: false,
      },
      {
        id: "interior_is_valid",
        text: "Every interior value must form a valid pair with values[left].",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The largest partner still available to the current left value already produces a sum below target.",
      mentalModelCorrection:
        "A legal pointer move should eliminate a precisely described set of impossible pairs.",
      mistakeTypes: ["left_elimination_proof_missing"],
      nextAction:
        "Name all possible partners still available to the endpoint being discarded.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-005",
    learningStage: "foundations",
    primarySkillAtomId: "prove_right_candidate_elimination",
    secondarySkillAtomIds: [
      "use_sorted_order_for_pair_elimination",
      "state_eliminated_candidate_set",
    ],
    type: "invariant_identification",
    prompt: `In a sorted ascending array, values[left] + values[right] > target.

What exactly has been proved about values[right]?`,
    options: [
      {
        id: "cannot_pair_with_any_remaining_left",
        text: "It cannot form the target with any index from left through right - 1, because all those values are at least values[left].",
        isCorrect: true,
      },
      {
        id: "left_is_only_invalid",
        text: "Only values[left] has been disproved as a candidate.",
        isCorrect: false,
      },
      {
        id: "right_cannot_pair_anywhere",
        text: "It cannot pair with any earlier value already removed from consideration.",
        isCorrect: false,
      },
      {
        id: "all_interior_pairs_invalid",
        text: "Every pair formed entirely inside the interval is invalid.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The smallest remaining partner for the current right value already produces a sum above target.",
      mentalModelCorrection:
        "Discarding right is justified because no remaining partner can make its sum smaller enough.",
      mistakeTypes: ["right_elimination_proof_missing"],
      nextAction:
        "Use the smallest remaining partner to prove that the right endpoint is impossible.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-006",
    learningStage: "foundations",
    primarySkillAtomId: "terminate_opposite_end_search_on_crossing",
    secondarySkillAtomIds: [
      "enforce_distinct_pair_indexes",
      "recognize_exhausted_candidate_pairs",
    ],
    type: "single_choice",
    prompt:
      "Why does a two-value search usually continue while left < right rather than left <= right?",
    options: [
      {
        id: "distinct_indexes_required",
        text: "Because left === right would use the same array position twice, while the pair requires two distinct indexes.",
        isCorrect: true,
      },
      {
        id: "equal_indexes_unsorted",
        text: "Because the array stops being sorted when the pointers meet.",
        isCorrect: false,
      },
      {
        id: "meeting_means_match",
        text: "Because pointer equality automatically means the target was found.",
        isCorrect: false,
      },
      {
        id: "right_must_remain_positive",
        text: "Because right is not allowed to become zero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The candidate is a pair of distinct source positions.",
      mentalModelCorrection:
        "Pointer crossing or meeting means no untested distinct endpoint pair remains.",
      mistakeTypes: ["same_index_reused_as_pair"],
      nextAction:
        "Tie the loop condition directly to the number of distinct candidate positions required.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-007",
    learningStage: "foundations",
    primarySkillAtomId: "trace_sorted_pair_sum_search",
    secondarySkillAtomIds: [
      "move_left_when_pair_sum_too_small",
      "move_right_when_pair_sum_too_large",
    ],
    type: "edge_case_drill",
    prompt: `Trace pair-sum search:

values = [1, 3, 4, 6, 8]
target = 10

Which pair is found?`,
    options: [
      {
        id: "four_six",
        text: "[4, 6]",
        isCorrect: true,
      },
      {
        id: "one_eight",
        text: "[1, 8]",
        isCorrect: false,
      },
      {
        id: "three_eight",
        text: "[3, 8]",
        isCorrect: false,
      },
      {
        id: "no_pair",
        text: "No pair exists.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "1 + 8 is too small, then 3 + 8 is too large, then 3 + 6 is too small, and 4 + 6 matches.",
      mentalModelCorrection:
        "Each comparison removes one endpoint candidate using sorted-order reasoning.",
      mistakeTypes: ["sorted_pair_sum_trace_mismatch"],
      nextAction:
        "Record left, right, sum, and the eliminated endpoint after each step.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-008",
    learningStage: "foundations",
    primarySkillAtomId: "reject_opposite_end_search_on_unsorted_input",
    secondarySkillAtomIds: [
      "identify_sorted_order_precondition",
      "diagnose_invalid_elimination_rule",
    ],
    type: "mistake_review",
    prompt: `A candidate applies opposite-end pair-sum movement directly to:

values = [8, 1, 6, 3]
target = 9

What is the core problem?`,
    options: [
      {
        id: "movement_not_justified",
        text: "Without sorted order, moving an endpoint does not eliminate a monotonic set of impossible partners.",
        isCorrect: true,
      },
      {
        id: "target_must_be_even",
        text: "Opposite-end search works only for even targets.",
        isCorrect: false,
      },
      {
        id: "array_too_short",
        text: "The array must contain at least five elements.",
        isCorrect: false,
      },
      {
        id: "right_must_start_middle",
        text: "The only error is that right should begin at the middle index.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Endpoint values no longer bound the values available between them.",
      mentalModelCorrection:
        "The movement rule depends on sorted order, not merely on having two endpoints.",
      mistakeTypes: ["opposite_end_logic_used_on_unsorted_input"],
      nextAction:
        "Verify the monotonic ordering precondition before using endpoint elimination.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-009",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_closest_pair_sum_contract",
    secondarySkillAtomIds: [
      "track_best_pair_distance",
      "use_sorted_order_for_closest_search",
    ],
    type: "strategy_choice",
    prompt:
      "A sorted array must return the pair whose sum is closest to a target. What additional state is needed beyond left and right?",
    options: [
      {
        id: "best_pair_and_error",
        text: "The best pair seen so far and its absolute distance from the target.",
        isCorrect: true,
      },
      {
        id: "all_interior_values",
        text: "A copy of every value between left and right.",
        isCorrect: false,
      },
      {
        id: "duplicate_count_only",
        text: "Only the number of duplicate endpoint values.",
        isCorrect: false,
      },
      {
        id: "running_prefix_sum",
        text: "A prefix sum of the entire array.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The algorithm may never encounter an exact target sum and must preserve the best candidate encountered.",
      mentalModelCorrection:
        "Closest search uses the same directional movement but has an optimization output rather than a boolean exact-match output.",
      mistakeTypes: ["closest_sum_state_under_modeled"],
      nextAction:
        "Define how one candidate pair is compared with the current best.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-010",
    learningStage: "foundations",
    primarySkillAtomId: "move_closest_sum_pointers_monotonically",
    secondarySkillAtomIds: [
      "justify_closest_sum_movement",
      "track_best_before_movement",
    ],
    type: "subgoal_ordering",
    prompt:
      "Which sequence correctly processes one candidate in closest-pair-sum search?",
    options: [
      {
        id: "evaluate_record_move",
        text: "Compute the current sum, update the best pair if its error is smaller, then move left for a low sum or right for a high sum.",
        isCorrect: true,
      },
      {
        id: "move_then_record",
        text: "Move a pointer first, then record the pair that was just skipped.",
        isCorrect: false,
      },
      {
        id: "record_only_exact",
        text: "Record a pair only when its sum exactly equals the target.",
        isCorrect: false,
      },
      {
        id: "move_both_by_error",
        text: "Move both pointers whenever the current error is nonzero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current endpoint pair is a valid optimization candidate before either endpoint is discarded.",
      mentalModelCorrection:
        "Evaluate and record the candidate before applying the sorted-order elimination step.",
      mistakeTypes: ["closest_sum_candidate_recorded_after_movement"],
      nextAction: "Separate candidate evaluation from pointer elimination.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-011",
    learningStage: "foundations",
    primarySkillAtomId: "trace_closest_pair_sum",
    secondarySkillAtomIds: [
      "track_best_pair_distance",
      "move_closest_sum_pointers_monotonically",
    ],
    type: "edge_case_drill",
    prompt: `Find the pair sum closest to 15:

values = [1, 4, 7, 10]

Which pair is optimal?`,
    options: [
      {
        id: "four_ten",
        text: "[4, 10], with sum 14 and absolute error 1.",
        isCorrect: true,
      },
      {
        id: "seven_ten",
        text: "[7, 10], with absolute error 2.",
        isCorrect: false,
      },
      {
        id: "one_ten",
        text: "[1, 10], with absolute error 4.",
        isCorrect: false,
      },
      {
        id: "four_seven",
        text: "[4, 7], with absolute error 4.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The smallest absolute error among all candidate pairs is 1.",
      mentalModelCorrection:
        "Closest-sum output compares absolute errors even when no exact sum exists.",
      mistakeTypes: ["closest_pair_trace_mismatch"],
      nextAction:
        "Update the best candidate before applying the directional pointer movement.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-012",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_sorted_pair_difference_contract",
    secondarySkillAtomIds: [
      "maintain_nonnegative_pair_difference",
      "coordinate_same_direction_difference_search",
    ],
    type: "single_choice",
    prompt:
      "For a sorted array, a search asks whether there are distinct indexes i < j such that values[j] - values[i] equals a nonnegative target difference. Which pointer arrangement is most natural?",
    options: [
      {
        id: "two_forward_pointers",
        text: "Two pointers moving left to right, with the larger-index pointer representing the minuend.",
        isCorrect: true,
      },
      {
        id: "opposite_ends_always",
        text: "One pointer at each end, because every sorted pair problem must start with opposite ends.",
        isCorrect: false,
      },
      {
        id: "sliding_window_sum",
        text: "A variable-size window whose interior sum equals the difference.",
        isCorrect: false,
      },
      {
        id: "single_pointer",
        text: "One pointer, because a difference never needs two values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The expression values[j] - values[i] has an ordered smaller and larger endpoint.",
      mentalModelCorrection:
        "Not every sorted two-pointer search is opposite-direction. Pair-difference search commonly uses two forward-moving positions.",
      mistakeTypes: ["pair_difference_forced_into_opposite_ends"],
      nextAction:
        "Choose pointer directions from the monotonic behavior of the target expression.",
      result: "diagnostic",
    },
  },


  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-015",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_trial_and_error_pointer_movement",
    secondarySkillAtomIds: [
      "require_sorted_elimination_argument",
      "reject_arbitrary_pointer_updates",
    ],
    type: "mistake_review",
    prompt: `A candidate explains:

"If the current pair is wrong, I move whichever pointer feels more promising."

What is missing?`,
    options: [
      {
        id: "formal_elimination_rule",
        text: "A proof from sorted order that the moved endpoint cannot participate in any valid remaining pair.",
        isCorrect: true,
      },
      {
        id: "randomization",
        text: "The pointer choice should be randomized rather than explained.",
        isCorrect: false,
      },
      {
        id: "more_pointer_names",
        text: "The variables should be renamed low and high.",
        isCorrect: false,
      },
      {
        id: "binary_search",
        text: "Every failed pair must trigger binary search.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "A correct movement permanently discards candidates.",
      mentalModelCorrection:
        "Pointer search is valid only when each movement is backed by a monotonic elimination argument.",
      mistakeTypes: ["pointer_movement_based_on_trial_and_error"],
      nextAction:
        "State which candidate pairs are eliminated and why none can satisfy the target.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-016",
    learningStage: "foundations",
    primarySkillAtomId: "handle_duplicate_values_in_pair_sum",
    secondarySkillAtomIds: [
      "distinguish_equal_values_from_same_index",
      "preserve_valid_duplicate_pair",
    ],
    type: "edge_case_drill",
    prompt: `Search for target sum 8:

values = [1, 4, 4, 7]

Which result is valid?`,
    options: [
      {
        id: "two_fours",
        text: "The two distinct occurrences of 4 form a valid pair.",
        isCorrect: true,
      },
      {
        id: "one_four_reused",
        text: "One occurrence of 4 may be used twice.",
        isCorrect: false,
      },
      {
        id: "duplicates_invalid",
        text: "Equal numeric values can never form a pair.",
        isCorrect: false,
      },
      {
        id: "one_seven",
        text: "1 and 7 form the target 8 only if they are adjacent.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "Distinctness applies to indexes, not numeric values.",
      mentalModelCorrection:
        "Sorted pair search may return duplicate values when they come from separate positions.",
      mistakeTypes: ["duplicate_value_pair_rejected"],
      nextAction:
        "Check pointer positions rather than requiring different endpoint values.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-017",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_original_indexes_after_sorting",
    secondarySkillAtomIds: [
      "distinguish_value_output_from_index_output",
      "review_sorting_output_contract",
    ],
    type: "solution_comparison",
    prompt:
      "A pair-sum function sorts the values before using opposite-end pointers, but the required output is the pair's original indexes. Which review is correct?",
    options: [
      {
        id: "retain_original_index_metadata",
        text: "Sorting plain values loses direct original positions, so each value must retain its original index or another index-recovery strategy is needed.",
        isCorrect: true,
      },
      {
        id: "sorted_indexes_are_original",
        text: "The final left and right positions are automatically the original indexes.",
        isCorrect: false,
      },
      {
        id: "indexes_not_affected",
        text: "Sorting changes values but never changes their positions.",
        isCorrect: false,
      },
      {
        id: "return_values_instead",
        text: "The function may return values because output contracts do not affect representation.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Sorting changes the positional relationship between values and the original input.",
      mentalModelCorrection:
        "A correct search strategy may still violate the output contract if required metadata is discarded.",
      mistakeTypes: ["sorted_pair_search_loses_original_indexes"],
      nextAction:
        "Attach original-index metadata before sorting when original positions must be returned.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-018",
    learningStage: "foundations",
    primarySkillAtomId: "state_opposite_end_search_invariant",
    secondarySkillAtomIds: [
      "track_remaining_candidate_pairs",
      "prove_eliminated_pairs_impossible",
    ],
    type: "invariant_identification",
    prompt:
      "Which invariant best describes an exact pair-sum search over sorted values?",
    options: [
      {
        id: "all_valid_remaining_pairs_within_bounds",
        text: "Any still-possible valid pair uses two distinct indexes within [left, right], and every discarded endpoint has been proved unable to participate in a valid remaining pair.",
        isCorrect: true,
      },
      {
        id: "interior_is_current_window",
        text: "Every value between left and right belongs to one current candidate subarray.",
        isCorrect: false,
      },
      {
        id: "pointers_move_randomly",
        text: "The pointers may move in any direction as long as the interval becomes smaller.",
        isCorrect: false,
      },
      {
        id: "endpoints_always_closest",
        text: "The current endpoints always form the closest possible pair before comparison.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The search region represents surviving candidate positions, not one evaluated range.",
      mentalModelCorrection:
        "Correctness comes from preserving all possible solutions while eliminating only impossible endpoint candidates.",
      mistakeTypes: ["opposite_end_search_invariant_incomplete"],
      nextAction:
        "State both where any remaining solution must lie and why discarded positions cannot be used.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-019",
    learningStage: "foundations",
    primarySkillAtomId: "compare_exact_and_closest_sum_contracts",
    secondarySkillAtomIds: [
      "distinguish_boolean_search_from_optimization",
      "choose_answer_recording_policy",
    ],
    type: "solution_comparison",
    prompt: `Compare two sorted pair problems:

A. Determine whether any pair sums exactly to target.
B. Return the pair whose sum is closest to target.

Which distinction is correct?`,
    options: [
      {
        id: "closest_tracks_best",
        text: "A may return immediately on equality or finish with failure; B must retain the best candidate seen even when equality never occurs.",
        isCorrect: true,
      },
      {
        id: "same_output_logic",
        text: "Both should record a result only after an exact match.",
        isCorrect: false,
      },
      {
        id: "exact_needs_all_pairs",
        text: "A must enumerate every pair, while B can use directional elimination.",
        isCorrect: false,
      },
      {
        id: "closest_moves_randomly",
        text: "B cannot use sorted-order movement because closeness has no directional information.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The first contract asks for feasibility, while the second asks for an optimum.",
      mentalModelCorrection:
        "The movement rule can remain similar while the answer-state lifecycle changes.",
      mistakeTypes: ["exact_and_closest_sum_contracts_conflated"],
      nextAction:
        "Separate candidate elimination from result-recording requirements.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-020",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_incorrect_crossing_behavior",
    secondarySkillAtomIds: [
      "terminate_after_candidate_exhaustion",
      "avoid_pointer_reset_without_proof",
    ],
    type: "mistake_review",
    prompt: `After left meets or crosses right without finding an exact pair, an implementation resets both pointers and tries different movements.

What is the best review?`,
    options: [
      {
        id: "termination_means_search_exhausted",
        text: "With correct monotonic elimination, meeting or crossing means no untested distinct candidate pair remains, so resetting only repeats work.",
        isCorrect: true,
      },
      {
        id: "reset_required",
        text: "Resetting is required because termination proves only the final endpoint pair failed.",
        isCorrect: false,
      },
      {
        id: "termination_means_match",
        text: "Pointer meeting or crossing proves an exact match exists.",
        isCorrect: false,
      },
      {
        id: "move_outward",
        text: "The pointers should continue moving outward beyond the array.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each prior movement permanently eliminated one endpoint's impossible candidate pairs.",
      mentalModelCorrection:
        "Crossing is a correctness termination condition only because the elimination proof preserves and exhausts all possible pairs.",
      mistakeTypes: ["pointer_reset_after_search_exhaustion"],
      nextAction:
        "Use the invariant to explain why no untested distinct pair remains after crossing.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-opposite-direction-sorted-search-021",
    learningStage: "foundations",
    primarySkillAtomId: "trace_pair_sum_with_negative_values",
    secondarySkillAtomIds: [
      "apply_sorted_sum_movement_with_negatives",
      "avoid_positivity_assumption",
    ],
    type: "edge_case_drill",
    prompt: `Trace exact pair-sum search:

  values = [-8, -3, 1, 4, 10]
  target = 5

  Which pair is found?`,
    options: [
      {
        id: "one_four",
        text: "[1, 4]",
        isCorrect: true,
      },
      {
        id: "minus_eight_ten",
        text: "[-8, 10]",
        isCorrect: false,
      },
      {
        id: "minus_three_ten",
        text: "[-3, 10]",
        isCorrect: false,
      },
      {
        id: "no_pair",
        text: "No pair exists.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Sorted-order movement remains valid with negative values because it depends on ordering, not positivity.",
      mentalModelCorrection:
        "From -8 + 10 = 2, move left; from -3 + 10 = 7, move right; then 1 + 4 = 5.",
      mistakeTypes: ["pair_sum_movement_assumed_to_require_positive_values"],
      nextAction:
        "Apply the same low-sum and high-sum elimination rules regardless of sign.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-opposite-direction-sorted-search-022",
    learningStage: "foundations",
    primarySkillAtomId: "trace_unsuccessful_pair_sum_search",
    secondarySkillAtomIds: [
      "terminate_on_pointer_meeting",
      "recognize_exhausted_pair_candidates",
    ],
    type: "edge_case_drill",
    prompt: `Trace exact pair-sum search:

  values = [1, 2, 4, 9]
  target = 8

  What is the result?`,
    options: [
      {
        id: "no_pair",
        text: "No pair exists; the pointers terminate after all surviving endpoint candidates are eliminated.",
        isCorrect: true,
      },
      {
        id: "four_four",
        text: "[4, 4], reusing the same array position.",
        isCorrect: false,
      },
      {
        id: "one_nine",
        text: "[1, 9]",
        isCorrect: false,
      },
      {
        id: "two_nine",
        text: "[2, 9]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The pointers meet without an exact sum after every discarded endpoint has been proved impossible.",
      mentalModelCorrection:
        "Failure is established by candidate exhaustion, not by testing every pair explicitly.",
      mistakeTypes: ["unsuccessful_pair_search_termination_misread"],
      nextAction:
        "Trace the eliminated endpoint after each comparison.",
      result: "diagnostic",
    },
  },
];
