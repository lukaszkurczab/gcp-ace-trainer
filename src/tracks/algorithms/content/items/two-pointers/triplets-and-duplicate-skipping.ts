export const tripletsAndDuplicateSkippingQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_sorted_anchor_pair_scan",
    secondarySkillAtomIds: ["fix_triplet_anchor", "scan_remaining_suffix"],
    type: "strategy_choice",
    prompt:
      "Which high-level structure matches the standard sorted three-sum strategy?",
    options: [
      {
        id: "sort_anchor_suffix_scan",
        text: "Sort the values, fix one anchor, and search the suffix with opposite-direction pointers for the required remaining sum.",
        isCorrect: true,
      },
      {
        id: "single_endpoint_scan",
        text: "Sort the values and inspect only the first and last elements once.",
        isCorrect: false,
      },
      {
        id: "one_contiguous_window",
        text: "Treat every value between two boundaries as one triplet candidate.",
        isCorrect: false,
      },
      {
        id: "three_independent_pointers",
        text: "Move three pointers independently without assigning one of them a stable anchor role.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Fixing one value reduces the triplet condition to a sorted two-value relationship in the remaining suffix.",
      mentalModelCorrection:
        "The anchor is held constant while the inner pointers coordinate the pair search.",
      mistakeTypes: ["three_sum_structure_not_recognized"],
      nextAction:
        "Rewrite the triplet target as a pair target after choosing one anchor.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-002",
    learningStage: "foundations",
    primarySkillAtomId: "derive_inner_pair_target",
    secondarySkillAtomIds: ["fix_triplet_anchor", "reduce_triplet_to_pair_sum"],
    type: "single_choice",
    prompt: `The required triplet sum is target, and values[anchor] is fixed.

What sum must the two suffix pointers find?`,
    options: [
      {
        id: "target_minus_anchor",
        text: "target - values[anchor]",
        isCorrect: true,
      },
      {
        id: "target_plus_anchor",
        text: "target + values[anchor]",
        isCorrect: false,
      },
      {
        id: "anchor_minus_target",
        text: "values[anchor] - target",
        isCorrect: false,
      },
      {
        id: "target_divided_by_three",
        text: "target / 3 regardless of the anchor value.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The anchor already contributes one term to the required total.",
      mentalModelCorrection:
        "Fixing the anchor turns `a + b + c = target` into `b + c = target - a`.",
      mistakeTypes: ["inner_pair_target_derived_incorrectly"],
      nextAction:
        "Algebraically isolate the sum that remains after the anchor is fixed.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-003",
    learningStage: "foundations",
    primarySkillAtomId: "initialize_triplet_suffix_pointers",
    secondarySkillAtomIds: [
      "prevent_anchor_index_reuse",
      "define_suffix_search_region",
    ],
    type: "single_choice",
    prompt: `After fixing an anchor at index i in a sorted array, where should the inner pointers usually begin?`,
    options: [
      {
        id: "i_plus_one_and_end",
        text: "left = i + 1 and right = values.length - 1.",
        isCorrect: true,
      },
      {
        id: "i_and_end",
        text: "left = i and right = values.length - 1.",
        isCorrect: false,
      },
      {
        id: "zero_and_i_minus_one",
        text: "left = 0 and right = i - 1.",
        isCorrect: false,
      },
      {
        id: "both_at_i",
        text: "left = i and right = i.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The pair must use two positions strictly after the fixed anchor.",
      mentalModelCorrection:
        "The inner suffix excludes the anchor so one array position cannot fill multiple triplet roles.",
      mistakeTypes: ["triplet_anchor_index_reused"],
      nextAction:
        "Define the unconsumed suffix as the positions after the anchor.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-004",
    learningStage: "foundations",
    primarySkillAtomId: "move_left_for_small_triplet_sum",
    secondarySkillAtomIds: [
      "justify_inner_pointer_movement",
      "use_sorted_suffix_monotonicity",
    ],
    type: "single_choice",
    prompt: `For a fixed anchor in a sorted array:

values[anchor] + values[left] + values[right] < target

Which movement is justified?`,
    options: [
      {
        id: "increment_left",
        text: "Increment left, because replacing its value with a larger suffix value is the available way to increase the sum.",
        isCorrect: true,
      },
      {
        id: "decrement_right",
        text: "Decrement right, because replacing the largest value with a smaller one increases the sum.",
        isCorrect: false,
      },
      {
        id: "advance_anchor",
        text: "Immediately abandon the anchor without checking any other suffix pair.",
        isCorrect: false,
      },
      {
        id: "move_both",
        text: "Move both inner pointers whenever the sum is too small.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The anchor is fixed and the current sum needs to increase.",
      mentalModelCorrection:
        "Sorted order determines which operand can move the sum in the required direction.",
      mistakeTypes: ["small_triplet_sum_moves_wrong_pointer"],
      nextAction:
        "Hold the anchor fixed and identify which pair operand must become larger.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-005",
    learningStage: "foundations",
    primarySkillAtomId: "move_right_for_large_triplet_sum",
    secondarySkillAtomIds: [
      "justify_inner_pointer_movement",
      "use_sorted_suffix_monotonicity",
    ],
    type: "single_choice",
    prompt: `For a fixed anchor in a sorted array:

values[anchor] + values[left] + values[right] > target

Which movement is justified?`,
    options: [
      {
        id: "decrement_right",
        text: "Decrement right, because replacing its value with a smaller suffix value can reduce the sum.",
        isCorrect: true,
      },
      {
        id: "increment_left",
        text: "Increment left, because increasing the middle value reduces the sum.",
        isCorrect: false,
      },
      {
        id: "move_both",
        text: "Move both pointers because the current triplet failed.",
        isCorrect: false,
      },
      {
        id: "restart_suffix",
        text: "Reset both inner pointers to their initial positions.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current total is too large while the anchor remains fixed.",
      mentalModelCorrection:
        "The sorted suffix permits directional reduction by moving the larger endpoint inward.",
      mistakeTypes: ["large_triplet_sum_moves_wrong_pointer"],
      nextAction: "Identify which pair operand must become smaller.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-006",
    learningStage: "foundations",
    primarySkillAtomId: "prove_inner_pair_scan_monotonicity",
    secondarySkillAtomIds: [
      "eliminate_suffix_candidates",
      "preserve_possible_triplets",
    ],
    type: "invariant_reasoning",
    prompt: `For a fixed anchor, the current triplet sum is below target.

Why can the current left position be discarded?`,
    options: [
      {
        id: "largest_partner_still_too_small",
        text: "Even paired with the largest remaining right value, the current left value produces too small a total, so no smaller right partner can make it valid.",
        isCorrect: true,
      },
      {
        id: "left_failed_once",
        text: "Any position that participates in one failed triplet can never participate in another triplet.",
        isCorrect: false,
      },
      {
        id: "right_is_always_valid",
        text: "The right position is guaranteed to belong to the answer.",
        isCorrect: false,
      },
      {
        id: "anchor_must_change",
        text: "A low sum proves that the fixed anchor is invalid for every possible pair.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "right is already the largest available partner for the current left value.",
      mentalModelCorrection:
        "The inner scan is monotonic because each movement eliminates a complete set of impossible suffix pairs.",
      mistakeTypes: ["inner_scan_movement_lacks_elimination_proof"],
      nextAction:
        "State what all alternative partners for the discarded endpoint look like under sorted order.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-007",
    learningStage: "foundations",
    primarySkillAtomId: "skip_duplicate_triplet_anchors",
    secondarySkillAtomIds: [
      "prevent_duplicate_triplet_output",
      "recognize_redundant_anchor_value",
    ],
    type: "single_choice",
    prompt: `The sorted array has:

values[i] === values[i - 1]

and i > 0. Why should the second equal anchor usually be skipped when unique value triplets are required?`,
    options: [
      {
        id: "same_anchor_value_repeats_search",
        text: "It would search the same value-based suffix relationships already considered for the previous equal anchor.",
        isCorrect: true,
      },
      {
        id: "equal_values_cannot_be_used",
        text: "A valid triplet may never contain repeated numeric values.",
        isCorrect: false,
      },
      {
        id: "anchor_indexes_must_be_consecutive",
        text: "Only the first array index may be used as an anchor.",
        isCorrect: false,
      },
      {
        id: "sorting_removes_duplicates",
        text: "Sorting has already deleted the duplicate value physically.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The output contract distinguishes value triplets rather than source-index triplets.",
      mentalModelCorrection:
        "Skipping an equal anchor prevents repeating an equivalent search; it does not forbid equal values in a valid triplet.",
      mistakeTypes: ["duplicate_anchor_not_skipped"],
      nextAction:
        "Skip an anchor only when it equals the immediately previous sorted anchor value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-008",
    learningStage: "foundations",
    primarySkillAtomId: "skip_anchor_duplicates_at_correct_time",
    secondarySkillAtomIds: [
      "preserve_first_anchor_occurrence",
      "avoid_skipping_all_repeated_values",
    ],
    type: "mistake_review",
    prompt: `A sorted three-sum input is:

values = [-1, -1, 2]
target = 0

Before processing anchor i, the loop skips it whenever:

values[i] === values[i + 1]

What valid result can be lost?`,
    options: [
      {
        id: "duplicate_anchor_needed_as_pair_value",
        text: "[-1, -1, 2], because skipping the first -1 leaves no second -1 in the suffix of the later anchor.",
        isCorrect: true,
      },
      {
        id: "nothing_lost",
        text: "Nothing; processing the last occurrence of every anchor value is always equivalent.",
        isCorrect: false,
      },
      {
        id: "duplicates_never_valid",
        text: "No result is lost because valid triplets cannot contain equal values.",
        isCorrect: false,
      },
      {
        id: "sorting_removed_duplicate",
        text: "No result is lost because sorting physically merged the two -1 values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The earlier equal anchor may need the later equal occurrence as one of its two suffix values.",
      mentalModelCorrection:
        "Process the first occurrence of an anchor value and skip later equal anchors, not the reverse.",
      mistakeTypes: ["anchor_duplicate_skipped_before_first_representative"],
      nextAction:
        "Use `i > 0 && values[i] === values[i - 1]` to skip repeated anchors.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-009",
    learningStage: "foundations",
    primarySkillAtomId: "advance_both_after_triplet_match",
    secondarySkillAtomIds: [
      "consume_matched_pair_positions",
      "continue_search_for_same_anchor",
    ],
    type: "single_choice",
    prompt:
      "After emitting a valid value triplet for the current anchor, what basic pointer movement is required before continuing?",
    options: [
      {
        id: "move_both_inward",
        text: "Increment left and decrement right because the current pair positions have been consumed.",
        isCorrect: true,
      },
      {
        id: "move_left_only",
        text: "Increment only left so the same right position is immediately reused with no duplicate policy.",
        isCorrect: false,
      },
      {
        id: "move_right_only",
        text: "Decrement only right so the same left position is immediately reused.",
        isCorrect: false,
      },
      {
        id: "keep_both",
        text: "Keep both pointers unchanged and emit the same triplet again.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The matched pair has already produced its value triplet for the fixed anchor.",
      mentalModelCorrection:
        "Both pair positions must progress after a match before duplicate skipping or further search.",
      mistakeTypes: ["triplet_match_does_not_advance_both_pointers"],
      nextAction:
        "Consume the matched pair, then move beyond duplicate values if uniqueness is required.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-010",
    learningStage: "foundations",
    primarySkillAtomId: "skip_inner_duplicates_after_match",
    secondarySkillAtomIds: [
      "prevent_duplicate_triplet_output",
      "preserve_unseen_pair_values",
    ],
    type: "subgoal_ordering",
    prompt:
      "When unique value triplets are required, which post-match sequence is coherent?",
    options: [
      {
        id: "record_move_skip_equal_runs",
        text: "Record the triplet, move both pointers inward, then skip values equal to the pair values that were just used.",
        isCorrect: true,
      },
      {
        id: "skip_before_record",
        text: "Skip both duplicate runs before recording the current matching triplet.",
        isCorrect: false,
      },
      {
        id: "record_without_movement",
        text: "Record the triplet repeatedly until one pointer changes for another reason.",
        isCorrect: false,
      },
      {
        id: "skip_all_future_values",
        text: "After one match, skip every remaining suffix value for the anchor.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current distinct pair must be emitted once before equivalent repeated pair values are bypassed.",
      mentalModelCorrection:
        "Duplicate skipping follows successful consumption; doing it too early can erase the valid result.",
      mistakeTypes: ["inner_duplicates_skipped_at_wrong_time"],
      nextAction:
        "Save the matched pair values or compare against the just-consumed positions while skipping.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-011",
    learningStage: "foundations",
    primarySkillAtomId: "justify_consuming_both_positions_after_match",
    secondarySkillAtomIds: [
      "use_sorted_pair_monotonicity_after_match",
      "prevent_duplicate_triplet_output",
    ],
    type: "invariant_reasoning",
    prompt: `For a fixed anchor, the current pair produces exactly target.

Under a unique-value-triplet contract, why may both left and right be moved inward after recording the result?`,
    options: [
      {
        id: "same_endpoint_alternatives_cannot_add_new_value_triplet",
        text: "With the same right value, any larger left value would overshoot or repeat the same value; with the same left value, any smaller right value would undershoot or repeat the same value.",
        isCorrect: true,
      },
      {
        id: "matched_indexes_cannot_appear_again",
        text: "Any index used in one result is forbidden from appearing in another result for a different anchor.",
        isCorrect: false,
      },
      {
        id: "all_remaining_pairs_invalid",
        text: "One match proves every remaining pair for the anchor is invalid.",
        isCorrect: false,
      },
      {
        id: "movement_is_arbitrary",
        text: "Both pointers move only because three-sum convention requires it.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Sorted order and the exact-sum equality eliminate new value combinations that retain either matched endpoint value.",
      mentalModelCorrection:
        "Moving both after a match follows a monotonic argument and the unique-value output contract.",
      mistakeTypes: ["post_match_movement_not_justified"],
      nextAction:
        "Explain separately what happens when one matched endpoint is retained and the other moves.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-012",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_duplicate_values_from_index_reuse",
    secondarySkillAtomIds: [
      "allow_equal_values_at_distinct_indexes",
      "enforce_three_distinct_positions",
    ],
    type: "edge_case_drill",
    prompt: `For target 0, the sorted array contains:

[-2, 1, 1]

Which statement is correct?`,
    options: [
      {
        id: "valid_distinct_indexes",
        text: "[-2, 1, 1] is valid because the equal values come from two distinct indexes.",
        isCorrect: true,
      },
      {
        id: "invalid_repeated_value",
        text: "It is invalid because a triplet may not contain the same numeric value twice.",
        isCorrect: false,
      },
      {
        id: "one_index_can_fill_both",
        text: "It is valid even if the array contains only one occurrence of 1, because that index can be reused.",
        isCorrect: false,
      },
      {
        id: "sorting_merges_indexes",
        text: "Sorting combines equal values into one source position.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Triplet distinctness applies to positions, while numeric values may repeat when enough occurrences exist.",
      mentalModelCorrection:
        "Duplicate suppression controls repeated outputs; it does not ban legitimate repeated values.",
      mistakeTypes: ["equal_triplet_values_confused_with_index_reuse"],
      nextAction:
        "Verify `anchor < left < right` rather than requiring three different numbers.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-013",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_duplicate_triplet_outputs",
    secondarySkillAtomIds: [
      "skip_duplicate_anchors",
      "skip_duplicate_inner_values",
    ],
    type: "mistake_review",
    prompt: `A sorted three-sum implementation correctly finds valid sums but returns:

[-1, 0, 1]
[-1, 0, 1]

Which omission most directly explains this?`,
    options: [
      {
        id: "missing_duplicate_control",
        text: "It does not consistently skip repeated anchor values or repeated matched pair values.",
        isCorrect: true,
      },
      {
        id: "sorting_should_be_removed",
        text: "Sorting creates duplicate output and must be removed.",
        isCorrect: false,
      },
      {
        id: "target_should_change",
        text: "The target must be adjusted after every match.",
        isCorrect: false,
      },
      {
        id: "only_one_pointer_needed",
        text: "Using two inner pointers inherently duplicates every result.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Multiple index combinations can represent the same value triplet.",
      mentalModelCorrection:
        "Unique output requires suppressing equivalent values at both the anchor and inner-pair levels.",
      mistakeTypes: ["duplicate_value_triplets_emitted"],
      nextAction:
        "Audit duplicate handling separately for anchors, left values, and right values.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-triplets-duplicate-skipping-014",
    learningStage: "foundations",
    primarySkillAtomId: "trace_unique_triplet_search",
    secondarySkillAtomIds: [
      "fix_triplet_anchor",
      "skip_duplicate_triplet_values",
    ],
    type: "edge_case_drill",
    prompt: `Find unique triplets summing to 0:

values = [-1, 0, 1, 2, -1, -4]

Which result set is correct?`,
    options: [
      {
        id: "two_unique_triplets",
        text: "[[-1, -1, 2], [-1, 0, 1]]",
        isCorrect: true,
      },
      {
        id: "duplicate_zero_triplet",
        text: "[[-1, -1, 2], [-1, 0, 1], [-1, 0, 1]]",
        isCorrect: false,
      },
      {
        id: "one_triplet",
        text: "[[-1, 0, 1]]",
        isCorrect: false,
      },
      {
        id: "invalid_reused_one",
        text: "[[-4, 2, 2], [-1, 0, 1]]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The sorted scan finds two distinct value combinations and suppresses equivalent duplicate-index combinations.",
      mentalModelCorrection:
        "Unique triplet output preserves each valid value combination once while still allowing repeated values backed by distinct positions.",
      mistakeTypes: ["unique_triplet_trace_mismatch"],
      nextAction:
        "Sort, process one representative per anchor value, and skip matched duplicate runs.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-015",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_skipping_inner_duplicates_before_match",
    secondarySkillAtomIds: [
      "preserve_valid_duplicate_pair",
      "apply_duplicate_policy_contextually",
    ],
    type: "mistake_review",
    prompt: `For target 0, the sorted input is:

values = [-2, 1, 1]

Before evaluating the current sum, the implementation runs:

while (left < right && values[left] === values[left + 1]) {
  left++;
}

What valid result can be lost?`,
    options: [
      {
        id: "minus_two_one_one",
        text: "[-2, 1, 1], because skipping the first 1 makes left meet right before the pair is evaluated.",
        isCorrect: true,
      },
      {
        id: "nothing_lost",
        text: "Nothing; inner duplicates may always be skipped before evaluating the current pair.",
        isCorrect: false,
      },
      {
        id: "duplicate_values_invalid",
        text: "No result is lost because valid triplets cannot contain two equal values.",
        isCorrect: false,
      },
      {
        id: "anchor_reused",
        text: "Only a result that reuses the anchor index can be lost.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The equal values may be two required occurrences rather than redundant representations of an already processed pair.",
      mentalModelCorrection:
        "Inner duplicates may be skipped only after the corresponding value combination has been evaluated or consumed.",
      mistakeTypes: ["inner_duplicate_skipped_before_candidate_evaluation"],
      nextAction:
        "Evaluate the current pair first; after a match, move and then skip repeated values.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-016",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_triplet_index_order",
    secondarySkillAtomIds: [
      "prevent_index_reuse",
      "terminate_inner_scan_on_crossing",
    ],
    type: "invariant_identification",
    prompt:
      "Which index relationship should remain true while evaluating a triplet for anchor i?",
    options: [
      {
        id: "anchor_left_right_order",
        text: "i < left < right",
        isCorrect: true,
      },
      {
        id: "left_anchor_right",
        text: "left < i < right",
        isCorrect: false,
      },
      {
        id: "all_equal",
        text: "i === left === right",
        isCorrect: false,
      },
      {
        id: "right_before_anchor",
        text: "right < left < i",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The anchor is fixed before the pair suffix, and the pair requires two distinct positions.",
      mentalModelCorrection:
        "Ordered pointer positions encode the no-reuse constraint directly.",
      mistakeTypes: ["triplet_pointer_index_order_invalid"],
      nextAction:
        "Initialize the pair after the anchor and continue only while left < right.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-017",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_unique_values_from_unique_indexes",
    secondarySkillAtomIds: [
      "interpret_triplet_output_contract",
      "choose_duplicate_skipping_policy",
    ],
    type: "solution_comparison",
    prompt: `Compare two output contracts:

A. Return every distinct index triplet whose values sum to target.
B. Return every distinct value triplet whose values sum to target.

Which statement is correct?`,
    options: [
      {
        id: "duplicate_skipping_depends_on_contract",
        text: "Standard value-based duplicate skipping fits B, but it may incorrectly suppress different index triplets required by A.",
        isCorrect: true,
      },
      {
        id: "same_duplicate_policy",
        text: "Both contracts always require skipping every equal value position.",
        isCorrect: false,
      },
      {
        id: "indexes_never_distinct",
        text: "A and B are identical because equal values always have the same index.",
        isCorrect: false,
      },
      {
        id: "value_contract_needs_all_indexes",
        text: "B must return every index combination even when the value triplet repeats.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The identity of an output may be defined by source positions or by numeric values.",
      mentalModelCorrection:
        "Duplicate skipping is an output-contract decision, not an unconditional property of three-sum.",
      mistakeTypes: ["value_and_index_triplet_contracts_conflated"],
      nextAction:
        "Define what makes two returned triplets equal before suppressing duplicates.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-triplets-duplicate-skipping-018",
    learningStage: "foundations",
    primarySkillAtomId: "state_unique_triplet_scan_invariant",
    secondarySkillAtomIds: [
      "prove_anchor_suffix_search_correctness",
      "prove_duplicate_suppression_correctness",
    ],
    type: "invariant_identification",
    prompt:
      "Which invariant most completely supports a sorted unique-value triplet search?",
    options: [
      {
        id: "anchors_processed_suffix_candidates_preserved",
        text: "Earlier distinct anchor values have been fully searched; for the current anchor, left and right delimit all remaining suffix pairs that may reach the target; moved positions are eliminated by sorted-order proof, and skipped duplicates would only repeat an already represented value triplet.",
        isCorrect: true,
      },
      {
        id: "three_pointers_move_together",
        text: "The anchor, left, and right pointers all advance on every iteration.",
        isCorrect: false,
      },
      {
        id: "duplicates_never_valid",
        text: "Every repeated numeric value is excluded from all candidate triplets.",
        isCorrect: false,
      },
      {
        id: "current_sum_controls_anchor",
        text: "Every low or high inner sum immediately proves the anchor should be discarded.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Correctness combines anchor coverage, monotonic pair elimination, distinct indexes, and contract-driven duplicate suppression.",
      mentalModelCorrection:
        "The algorithm is not merely three moving indexes; each phase and duplicate rule preserves a specific candidate-space invariant.",
      mistakeTypes: ["unique_triplet_scan_invariant_incomplete"],
      nextAction:
        "Explain separately why anchors, inner pointer moves, and duplicate skips cannot remove an unreported required result.",
      result: "diagnostic",
    },
  },
];
