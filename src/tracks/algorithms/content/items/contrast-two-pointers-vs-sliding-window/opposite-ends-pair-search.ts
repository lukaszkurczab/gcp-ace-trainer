export const oppositeEndsPairSearchQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_opposite_ends_pair_search",
    secondarySkillAtomIds: [
      "distinguish_endpoint_pair_from_window",
      "interpret_two_pointer_state",
    ],
    type: "single_choice",
    prompt:
      "In an opposite-direction two-pointer pair search, what does the current state [left, right] usually represent?",
    options: [
      {
        id: "one_endpoint_pair",
        text: "One candidate pair formed by values[left] and values[right]; the interior is not automatically maintained as one aggregate state.",
        isCorrect: true,
      },
      {
        id: "entire_active_window",
        text: "One active sliding window whose sum or frequency state must include every value from left through right.",
        isCorrect: false,
      },
      {
        id: "two_independent_scans",
        text: "Two unrelated scans that can move without affecting which candidate pairs remain possible.",
        isCorrect: false,
      },
      {
        id: "processed_prefix_suffix",
        text: "A processed prefix ending at left and a processed suffix beginning at right.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The algorithm evaluates a relationship between the two endpoint values rather than an aggregate over the entire interval.",
      mentalModelCorrection:
        "The interval between the pointers describes the remaining search region, but the current candidate is the endpoint pair.",
      mistakeTypes: ["endpoint_pair_treated_as_sliding_window"],
      nextAction:
        "State explicitly whether the decision uses only values[left] and values[right] or all elements between them.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-002",
    learningStage: "foundations",
    primarySkillAtomId: "choose_pair_sum_pointer_movement",
    secondarySkillAtomIds: [
      "use_sorted_order_for_elimination",
      "prove_left_pointer_elimination",
    ],
    type: "single_choice",
    prompt: `A sorted ascending array is searched for two distinct values whose sum equals target.

The current pair satisfies:

values[left] + values[right] < target

Which movement is justified?`,
    options: [
      {
        id: "increment_left",
        text: "Increment left, because pairing the current left value with any index smaller than right would produce an equal or smaller sum.",
        isCorrect: true,
      },
      {
        id: "decrement_right",
        text: "Decrement right, because a smaller right value will increase the sum toward target.",
        isCorrect: false,
      },
      {
        id: "move_both",
        text: "Move both pointers inward because every comparison should discard both endpoint values.",
        isCorrect: false,
      },
      {
        id: "either_pointer",
        text: "Move either pointer arbitrarily because the remaining interval becomes smaller in both cases.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current left value already fails when paired with the largest remaining right value.",
      mentalModelCorrection:
        "Sorted order proves that keeping left and choosing a smaller right cannot repair a sum that is already too small.",
      mistakeTypes: ["pair_sum_low_movement_mismatch"],
      nextAction:
        "For the endpoint being discarded, compare its current partner with every alternative partner still available.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-003",
    learningStage: "foundations",
    primarySkillAtomId: "choose_pair_sum_pointer_movement",
    secondarySkillAtomIds: [
      "use_sorted_order_for_elimination",
      "prove_right_pointer_elimination",
    ],
    type: "single_choice",
    prompt: `A sorted ascending array is searched for two distinct values whose sum equals target.

The current pair satisfies:

values[left] + values[right] > target

Which movement is justified?`,
    options: [
      {
        id: "decrement_right",
        text: "Decrement right, because pairing the current right value with any index larger than left would produce an equal or larger sum.",
        isCorrect: true,
      },
      {
        id: "increment_left",
        text: "Increment left, because a larger left value will reduce the sum toward target.",
        isCorrect: false,
      },
      {
        id: "move_both",
        text: "Move both pointers because both endpoint values participated in a failed comparison.",
        isCorrect: false,
      },
      {
        id: "restart",
        text: "Reset left to zero and decrement right because elimination cannot be performed incrementally.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current right value already produces too large a sum with the smallest remaining left value.",
      mentalModelCorrection:
        "Sorted order proves that keeping right and choosing a larger left cannot repair a sum that is already too large.",
      mistakeTypes: ["pair_sum_high_movement_mismatch"],
      nextAction:
        "Identify which endpoint cannot participate in any valid remaining pair under the current comparison.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-004",
    learningStage: "foundations",
    primarySkillAtomId: "trace_opposite_ends_pair_search",
    secondarySkillAtomIds: [
      "choose_pair_sum_pointer_movement",
      "detect_pair_sum_match",
    ],
    type: "single_choice",
    prompt: `Trace pair-sum search on:

values = [1, 3, 4, 6, 8, 11]
target = 10

The search starts at 1 and 11. Which pointer movements occur before the pair 4 and 6 is found?`,
    options: [
      {
        id: "right_left_right_left",
        text: "right inward, left inward, right inward, left inward.",
        isCorrect: true,
      },
      {
        id: "left_right_left_right",
        text: "left inward, right inward, left inward, right inward.",
        isCorrect: false,
      },
      {
        id: "both_both",
        text: "Both pointers inward twice.",
        isCorrect: false,
      },
      {
        id: "right_right_left_left",
        text: "right inward twice, then left inward twice.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each movement follows whether the current sum is above or below 10.",
      mentalModelCorrection:
        "The movement sequence is comparison-dependent: 12 is too large, 9 too small, 11 too large, and 9 too small.",
      mistakeTypes: ["pair_sum_trace_mismatch"],
      nextAction:
        "Write the current endpoint values and sum before choosing each movement.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-005",
    learningStage: "foundations",
    primarySkillAtomId: "validate_sorted_pair_search_precondition",
    secondarySkillAtomIds: [
      "use_sorted_order_for_elimination",
      "reject_unsupported_pointer_movement",
    ],
    type: "solution_comparison",
    prompt: `Two implementations search for a pair summing to target.

Solution A applies opposite-end elimination to an ascending sorted array.

Solution B applies the same movement rules directly to an arbitrary unsorted array.

Which review is correct?`,
    options: [
      {
        id: "only_a_justified",
        text: "Solution A has a valid elimination argument. Solution B is not generally correct because index movement no longer guarantees that values become larger or smaller.",
        isCorrect: true,
      },
      {
        id: "both_valid",
        text: "Both are correct because moving pointers inward eventually compares enough pairs.",
        isCorrect: false,
      },
      {
        id: "only_b_valid",
        text: "Solution B is preferable because sorting destroys the relationship between the values.",
        isCorrect: false,
      },
      {
        id: "sorting_only_performance",
        text: "Both are equally correct; sorting affects only runtime and never the movement proof.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The elimination rule assumes that moving an index has a predictable effect on its value.",
      mentalModelCorrection:
        "Sorted order is a correctness precondition for this pair-sum movement rule, not merely a performance optimization.",
      mistakeTypes: ["sorted_elimination_applied_to_unsorted_data"],
      nextAction:
        "Before using value-based pointer movement, verify the ordering relationship between neighboring indexes.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-opposite-ends-pair-search-006",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_unsafe_dual_pointer_movement",
    secondarySkillAtomIds: [
      "preserve_uneliminated_endpoint",
      "trace_opposite_ends_pair_search",
    ],
    type: "single_choice",
    prompt: `A candidate moves both pointers inward after every failed comparison.

Consider:

values = [1, 2, 3, 5, 9]
target = 8

Why is that rule unsafe?`,
    options: [
      {
        id: "skips_three_five",
        text: "After 1 + 9 is too large, moving both pointers discards 5 even though the valid pair 3 + 5 remains.",
        isCorrect: true,
      },
      {
        id: "cannot_move_two_variables",
        text: "An algorithm is never allowed to update two pointer variables in one iteration.",
        isCorrect: false,
      },
      {
        id: "requires_window_sum",
        text: "The algorithm must first compute the sum of every value between the pointers.",
        isCorrect: false,
      },
      {
        id: "nine_must_remain",
        text: "The value 9 must remain because the larger endpoint is always more likely to form the target.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The comparison proves that one endpoint is impossible, but it does not necessarily eliminate the other endpoint.",
      mentalModelCorrection:
        "A failed pair comparison usually justifies discarding one side. Moving both can remove an endpoint that still has a valid partner.",
      mistakeTypes: ["both_pointers_moved_after_failed_comparison"],
      nextAction:
        "For each pointer movement, state which endpoint is being eliminated and prove why none of its remaining pairs can work.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-007",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_reversed_pair_sum_movement",
    secondarySkillAtomIds: [
      "choose_pair_sum_pointer_movement",
      "reason_from_sorted_order",
    ],
    type: "single_choice",
    prompt: `A sorted pair-sum implementation uses this rule:

if (sum < target) {
  right--;
} else if (sum > target) {
  left++;
}

What is wrong with it?`,
    options: [
      {
        id: "moves_sum_wrong_direction",
        text: "Both movements push the sum in the wrong direction: decreasing right cannot increase a low sum, and increasing left cannot decrease a high sum.",
        isCorrect: true,
      },
      {
        id: "rules_are_correct",
        text: "Nothing is wrong because either inward movement reduces the remaining search range.",
        isCorrect: false,
      },
      {
        id: "should_move_both",
        text: "Each branch should move both pointers instead of one.",
        isCorrect: false,
      },
      {
        id: "comparisons_reversed_only",
        text: "Only the comparison operators are wrong; the pointer movements themselves are always interchangeable.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "In ascending order, left movement raises the lower endpoint and right movement lowers the upper endpoint.",
      mentalModelCorrection:
        "Pointer direction must change the pair sum toward the target while preserving the elimination proof.",
      mistakeTypes: ["reversed_pair_sum_movement_rule"],
      nextAction:
        "State how each possible pointer movement changes the endpoint value before selecting a branch.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-opposite-ends-pair-search-008",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_pair_search_invariant",
    secondarySkillAtomIds: [
      "prove_candidate_elimination",
      "reason_about_remaining_search_region",
    ],
    type: "single_choice",
    prompt:
      "Which invariant best supports a correct opposite-end search for a target sum in a sorted array?",
    options: [
      {
        id: "remaining_pairs_inside",
        text: "If a valid pair has not already been found or eliminated, at least one valid candidate pair still has both indexes within the inclusive range from left to right.",
        isCorrect: true,
      },
      {
        id: "whole_interval_valid",
        text: "Every value between left and right currently belongs to one valid sliding window.",
        isCorrect: false,
      },
      {
        id: "endpoints_always_closest",
        text: "The current endpoint pair is always the closest possible pair to the target.",
        isCorrect: false,
      },
      {
        id: "both_endpoints_invalid",
        text: "After every failed comparison, both current endpoint values are invalid for all remaining pairs.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each movement should remove only candidates that the latest comparison has proven impossible.",
      mentalModelCorrection:
        "The interval represents the unexplored candidate-index region, not one aggregate window or a guarantee about the current pair.",
      mistakeTypes: ["pair_search_invariant_mismatch"],
      nextAction:
        "After each branch, identify the exact row or column of candidate pairs that has been eliminated.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-opposite-ends-pair-search-009",
    learningStage: "foundations",
    primarySkillAtomId: "prove_pair_search_elimination",
    secondarySkillAtomIds: [
      "reject_shrinking_range_as_correctness_proof",
      "validate_pointer_movement_invariant",
    ],
    type: "single_choice",
    prompt: `A reviewer defends a pointer movement by saying:

"It must be correct because every iteration makes the interval smaller."

What is the best response?`,
    options: [
      {
        id: "termination_not_correctness",
        text: "A shrinking interval helps prove termination, but correctness also requires proving that the discarded endpoint cannot participate in any valid remaining pair.",
        isCorrect: true,
      },
      {
        id: "shrinking_is_sufficient",
        text: "The reviewer is correct because every terminating two-pointer algorithm is also correct.",
        isCorrect: false,
      },
      {
        id: "interval_must_grow",
        text: "The interval should sometimes grow; otherwise valid pairs cannot be discovered.",
        isCorrect: false,
      },
      {
        id: "only_runtime_matters",
        text: "No correctness proof is needed once the scan is known to be linear.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Progress toward termination and preservation of valid answers are separate proof obligations.",
      mentalModelCorrection:
        "Making the search space smaller is useful only when the removed portion has been proven irrelevant.",
      mistakeTypes: ["termination_confused_with_elimination_correctness"],
      nextAction:
        "For each branch, prove both progress and answer preservation separately.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-opposite-ends-pair-search-010",
    learningStage: "foundations",
    primarySkillAtomId: "choose_closest_pair_pointer_movement",
    secondarySkillAtomIds: [
      "use_sorted_order_for_closest_pair",
      "prove_left_pointer_elimination",
    ],
    type: "single_choice",
    prompt: `A sorted array is searched for the pair whose sum is closest to target.

The current endpoint sum is below target. Why is advancing left the justified movement?`,
    options: [
      {
        id: "smaller_right_worsens_low_sum",
        text: "For the current left value, replacing right with any smaller value would make the sum even lower and therefore cannot improve this below-target candidate.",
        isCorrect: true,
      },
      {
        id: "left_always_moves",
        text: "left should advance after every closest-pair comparison regardless of the current sum.",
        isCorrect: false,
      },
      {
        id: "discard_both",
        text: "Both endpoints can be discarded because the current pair is not an exact match.",
        isCorrect: false,
      },
      {
        id: "interval_sum_increases",
        text: "Advancing left increases the sum of all values in the interval, which is the maintained window state.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current right endpoint is already the largest partner available to the current left endpoint.",
      mentalModelCorrection:
        "When even that largest partner leaves the sum too low, smaller partners cannot produce a closer value on the target side.",
      mistakeTypes: ["closest_pair_movement_without_elimination_proof"],
      nextAction:
        "Compare the current endpoint with all alternative partners it could still use before discarding it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-opposite-ends-pair-search-011",
    learningStage: "foundations",
    primarySkillAtomId: "trace_closest_pair_search",
    secondarySkillAtomIds: [
      "record_closest_pair_candidate",
      "choose_closest_pair_pointer_movement",
    ],
    type: "single_choice",
    prompt: `Find the pair sum closest to 12:

values = [1, 4, 6, 10]

The algorithm starts with 1 and 10. Which pair remains the best after the complete opposite-end scan?`,
    options: [
      {
        id: "one_ten",
        text: "1 and 10, with sum 11 and distance 1 from the target.",
        isCorrect: true,
      },
      {
        id: "four_ten",
        text: "4 and 10, with sum 14 and distance 2 from the target.",
        isCorrect: false,
      },
      {
        id: "four_six",
        text: "4 and 6, with sum 10 and distance 2 from the target.",
        isCorrect: false,
      },
      {
        id: "six_ten",
        text: "6 and 10, because the two largest values must produce the closest sum.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The first candidate has distance 1; later candidates reached by valid movements have distance 2.",
      mentalModelCorrection:
        "The current candidate must be compared with the best-so-far before its endpoint is eliminated.",
      mistakeTypes: ["closest_pair_trace_mismatch"],
      nextAction:
        "Track the current sum, absolute distance, and best distance as separate values.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-012",
    learningStage: "foundations",
    primarySkillAtomId: "apply_mirrored_palindrome_comparison",
    secondarySkillAtomIds: [
      "move_both_pointers_after_mirrored_match",
      "reason_about_symmetric_pairs",
    ],
    type: "single_choice",
    prompt: `A palindrome check compares characters at left and right.

When the two characters are equal, what is the correct next step?`,
    options: [
      {
        id: "move_both_inward",
        text: "Increment left and decrement right because that mirrored pair has been verified.",
        isCorrect: true,
      },
      {
        id: "move_left_only",
        text: "Increment only left because right must remain available for another comparison.",
        isCorrect: false,
      },
      {
        id: "move_based_on_order",
        text: "Move the pointer whose character is alphabetically smaller.",
        isCorrect: false,
      },
      {
        id: "update_window_state",
        text: "Add both characters to an aggregate representing the active interval.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The task pairs each position with exactly one mirrored position.",
      mentalModelCorrection:
        "Unlike pair-sum elimination, a successful symmetry comparison fully resolves both endpoints, so both may move.",
      mistakeTypes: ["palindrome_pointer_movement_mismatch"],
      nextAction:
        "Distinguish moving both after a verified mirrored match from moving both after an unresolved pair-sum comparison.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-013",
    learningStage: "foundations",
    primarySkillAtomId: "detect_palindrome_mismatch",
    secondarySkillAtomIds: [
      "prove_mirrored_symmetry_failure",
      "terminate_on_decisive_comparison",
    ],
    type: "single_choice",
    prompt: `During a direct palindrome check, characters[left] !== characters[right].

What should the algorithm conclude?`,
    options: [
      {
        id: "return_false",
        text: "Return false immediately because this required mirrored pair does not match.",
        isCorrect: true,
      },
      {
        id: "move_smaller_character",
        text: "Move the pointer with the alphabetically smaller character and continue searching.",
        isCorrect: false,
      },
      {
        id: "move_both_and_retry",
        text: "Move both pointers inward because the interior may still be symmetric.",
        isCorrect: false,
      },
      {
        id: "shrink_longer_side",
        text: "Shrink whichever side currently contains more characters.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A palindrome requires every mirrored pair to match; there is no alternative partner for either endpoint.",
      mentalModelCorrection:
        "This is symmetry verification, not pair search. A mismatch disproves the complete property rather than triggering candidate elimination.",
      mistakeTypes: ["palindrome_mismatch_treated_as_pair_search"],
      nextAction:
        "Ask whether endpoints have alternative partners or one required mirrored partner.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-014",
    learningStage: "foundations",
    primarySkillAtomId: "handle_palindrome_center_edge_case",
    secondarySkillAtomIds: [
      "reason_about_odd_length_symmetry",
      "define_two_pointer_termination",
    ],
    type: "edge_case_drill",
    prompt:
      "What should happen when an odd-length palindrome check reaches a state where left === right?",
    options: [
      {
        id: "center_requires_no_pair",
        text: "The center character needs no separate partner, so all required mirrored comparisons have succeeded.",
        isCorrect: true,
      },
      {
        id: "compare_center_with_itself",
        text: "The center must be compared with itself repeatedly until both pointers leave the string.",
        isCorrect: false,
      },
      {
        id: "odd_never_palindrome",
        text: "The string must be rejected because one character remains unpaired.",
        isCorrect: false,
      },
      {
        id: "restart_from_ends",
        text: "The pointers must return to both ends to verify the center belongs to the interval.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every non-center position has already been matched with its mirror.",
      mentalModelCorrection:
        "A single middle character is symmetric around itself and does not require another comparison.",
      mistakeTypes: ["palindrome_center_edge_case_mismatch"],
      nextAction:
        "Use left < right as the set of states that still contain an unverified mirrored pair.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-opposite-ends-pair-search-015",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_pair_search_from_sliding_window",
    secondarySkillAtomIds: [
      "interpret_endpoint_pair_state",
      "recognize_contiguous_window_aggregate",
    ],
    type: "solution_comparison",
    prompt: `Compare these tasks:

Task A: In a sorted array, determine whether two distinct values sum to target.

Task B: Find a contiguous range of fixed length k with the largest sum.

Which distinction is correct?`,
    options: [
      {
        id: "pair_endpoints_vs_window_aggregate",
        text: "Task A evaluates independent endpoint candidates and eliminates pairs using sorted order. Task B maintains one contiguous window whose aggregate includes every element inside it.",
        isCorrect: true,
      },
      {
        id: "both_active_windows",
        text: "Both maintain the entire interval between left and right as one active sum.",
        isCorrect: false,
      },
      {
        id: "both_endpoint_pairs",
        text: "Both use only values[left] and values[right]; interior values never affect either answer.",
        isCorrect: false,
      },
      {
        id: "movement_rules_interchangeable",
        text: "The movement rules are interchangeable because both algorithms use two indexes.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "One answer concerns two selected values, while the other concerns every value in a contiguous range.",
      mentalModelCorrection:
        "The number and names of pointers do not define the pattern. The meaning of the represented state does.",
      mistakeTypes: ["pair_search_and_window_state_conflated"],
      nextAction:
        "Describe exactly which input elements contribute to the current candidate answer.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-opposite-ends-pair-search-016",
    learningStage: "foundations",
    primarySkillAtomId: "enforce_distinct_pair_indexes",
    secondarySkillAtomIds: [
      "handle_pair_search_small_input",
      "reason_about_duplicate_values",
    ],
    type: "edge_case_drill",
    prompt: `The task asks whether two distinct array elements sum to 8.

Which statement about these inputs is correct?

A: [4]
B: [4, 4]`,
    options: [
      {
        id: "single_false_duplicate_true",
        text: "A is false because one index cannot be used twice; B is true because the two equal values occur at distinct indexes.",
        isCorrect: true,
      },
      {
        id: "both_true",
        text: "Both are true because 4 + 4 equals 8, regardless of how many elements exist.",
        isCorrect: false,
      },
      {
        id: "both_false",
        text: "Both are false because opposite-end search requires the endpoint values to be different.",
        isCorrect: false,
      },
      {
        id: "single_true_duplicate_false",
        text: "A is true because the same endpoint may be reused, while B is false because duplicates are not allowed.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Distinct elements means distinct indexes, not necessarily distinct numeric values.",
      mentalModelCorrection:
        "A pair search requires left < right. Equal values are valid when they come from two separate positions.",
      mistakeTypes: ["pair_index_distinctness_mismatch"],
      nextAction:
        "Separate the constraint on indexes from the possible equality of their stored values.",
      result: "diagnostic",
    },
  },
];
