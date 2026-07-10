export const variableWindowValidityAndShrinkQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_variable_sliding_window_contract",
    secondarySkillAtomIds: [
      "interpret_window_boundaries",
      "recognize_maintained_window_state",
    ],
    type: "single_choice",
    prompt:
      "What do left and right represent in a variable-size sliding window?",
    options: [
      {
        id: "boundaries_of_current_range",
        text: "They are the boundaries of one current contiguous range whose state and validity are maintained as elements enter and leave.",
        isCorrect: true,
      },
      {
        id: "independent_candidates",
        text: "They are two independent candidate positions whose endpoint values alone determine the answer.",
        isCorrect: false,
      },
      {
        id: "fixed_distance",
        text: "They must remain a fixed distance apart throughout the scan.",
        isCorrect: false,
      },
      {
        id: "processed_and_unprocessed",
        text: "left marks finalized output while right marks the next destination position.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The objective concerns every element inside one contiguous range, and the range may grow or shrink.",
      mentalModelCorrection:
        "The pointers jointly describe one candidate range rather than two unrelated values.",
      mistakeTypes: ["variable_window_treated_as_endpoint_pair"],
      nextAction:
        "State what aggregate or validity condition corresponds exactly to the range from left through right.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-002",
    learningStage: "foundations",
    primarySkillAtomId: "order_variable_window_operations",
    secondarySkillAtomIds: [
      "expand_right_boundary",
      "restore_window_validity",
      "record_valid_window",
    ],
    type: "subgoal_ordering",
    prompt: `A variable window finds the longest contiguous range whose sum is at most limit. All values are non-negative.

Which order correctly processes a new right boundary?`,
    options: [
      {
        id: "expand_update_shrink_record",
        text: "Include values[right], update the sum, shrink from left while the sum exceeds limit, then record the restored valid window.",
        isCorrect: true,
      },
      {
        id: "record_expand_shrink",
        text: "Record the current range, include values[right], then shrink once if necessary.",
        isCorrect: false,
      },
      {
        id: "shrink_record_expand",
        text: "Shrink the old range, record it, and then include values[right].",
        isCorrect: false,
      },
      {
        id: "expand_record_shrink",
        text: "Include values[right], record the range immediately, and restore validity afterward.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The newly expanded range may be invalid and therefore cannot yet contribute to the longest-valid-range answer.",
      mentalModelCorrection:
        "First update state for the incoming element, then restore the invariant, and only then use the range as a valid candidate.",
      mistakeTypes: ["variable_window_subgoal_order_mismatch"],
      nextAction:
        "Separate expansion, validity restoration, and answer recording into explicit phases.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-003",
    learningStage: "foundations",
    primarySkillAtomId: "shrink_until_window_is_valid",
    secondarySkillAtomIds: [
      "distinguish_while_from_single_shrink",
      "maintain_window_sum",
    ],
    type: "mistake_review",
    prompt: `A longest-window algorithm uses non-negative values and requires sum <= 3.

Before the latest expansion, the window is [1, 1, 1]. The incoming value is 3.

Why is this code incorrect?

if (sum > 3) {
  sum -= values[left];
  left++;
}`,
    options: [
      {
        id: "one_removal_may_not_restore",
        text: "Removing one outgoing value leaves the sum at 5, so the window remains invalid; shrinking must continue while the condition is violated.",
        isCorrect: true,
      },
      {
        id: "left_must_never_move",
        text: "left should not move because only right may change in a variable window.",
        isCorrect: false,
      },
      {
        id: "incoming_should_be_ignored",
        text: "The incoming value should be skipped instead of added to the current state.",
        isCorrect: false,
      },
      {
        id: "reset_entire_sum",
        text: "The sum must always be reset to zero after an invalid expansion.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "One expansion can violate the constraint by more than one outgoing contribution can repair.",
      mentalModelCorrection:
        "The shrink phase is complete only when the validity invariant has actually been restored.",
      mistakeTypes: ["window_shrunk_only_once"],
      nextAction:
        "Use the validity condition itself as the loop condition for left-boundary movement.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-004",
    learningStage: "foundations",
    primarySkillAtomId: "record_after_restoring_window_validity",
    secondarySkillAtomIds: [
      "reject_invalid_window_candidate",
      "maintain_longest_valid_range",
    ],
    type: "single_choice",
    prompt: `A function finds the longest contiguous range with sum <= limit.

Why should it update bestLength after the shrink loop rather than immediately after adding values[right]?`,
    options: [
      {
        id: "candidate_must_be_valid",
        text: "Because the expanded range may violate the constraint, and an invalid range must not be recorded as a candidate answer.",
        isCorrect: true,
      },
      {
        id: "right_not_part_of_window",
        text: "Because values[right] does not belong to the window until the next iteration.",
        isCorrect: false,
      },
      {
        id: "best_only_after_left_moves",
        text: "Because a result can be recorded only on iterations where left moved.",
        isCorrect: false,
      },
      {
        id: "record_before_expansion",
        text: "Because the previous window is always longer than the newly expanded one.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The answer contract accepts only ranges satisfying the maintained validity condition.",
      mentalModelCorrection:
        "Expansion creates a provisional range. It becomes an answer candidate only after validity is known.",
      mistakeTypes: ["answer_recorded_before_validity_restoration"],
      nextAction:
        "Place longest-valid-range recording after the invariant-restoring loop.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-005",
    learningStage: "foundations",
    primarySkillAtomId: "choose_boundary_for_window_shrinking",
    secondarySkillAtomIds: [
      "expand_right_boundary",
      "remove_leftmost_contribution",
    ],
    type: "single_choice",
    prompt: `A window over non-negative values has just expanded to include values[right], and its sum now exceeds the allowed limit.

Which boundary should move to restore validity?`,
    options: [
      {
        id: "increment_left",
        text: "Move left forward while removing outgoing contributions, because this reduces the current contiguous range.",
        isCorrect: true,
      },
      {
        id: "increment_right",
        text: "Move right farther forward without changing left, because a larger range is more likely to become valid.",
        isCorrect: false,
      },
      {
        id: "decrement_right",
        text: "Move right backward and reprocess the same incoming element indefinitely.",
        isCorrect: false,
      },
      {
        id: "move_both_once",
        text: "Move both boundaries exactly once regardless of whether the range becomes valid.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "right represents expansion into new input, while left controls removal from the current range.",
      mentalModelCorrection:
        "When expansion violates the constraint, validity is restored by discarding elements from the left side of the represented range.",
      mistakeTypes: ["wrong_window_boundary_moved"],
      nextAction:
        "Tie right movement to observation and left movement to removal from the active range.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-006",
    learningStage: "foundations",
    primarySkillAtomId: "shrink_window_incrementally",
    secondarySkillAtomIds: [
      "preserve_candidate_suffixes",
      "reject_full_window_reset",
    ],
    type: "counterexample_reasoning",
    prompt: `A longest-window solution resets the complete range whenever it becomes invalid:

left = right + 1;
sum = 0;

For values = [2, 1, 1] and limit = 2, what does this reset lose?`,
    options: [
      {
        id: "loses_two_ones",
        text: "It discards the suffix beginning at the first 1 and therefore misses the valid length-2 range [1, 1].",
        isCorrect: true,
      },
      {
        id: "loses_two_alone",
        text: "It loses the first value 2, even though 2 can never belong to a valid range.",
        isCorrect: false,
      },
      {
        id: "nothing_lost",
        text: "Nothing; every invalid expansion proves that all values currently in the range must be discarded.",
        isCorrect: false,
      },
      {
        id: "must_reset_farther",
        text: "The reset is too small and should instead move left beyond the end of the array.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "An invalid range can contain a shorter valid suffix that should remain available for future expansions.",
      mentalModelCorrection:
        "Incremental shrinking removes only as much as necessary; resetting the whole range destroys reusable candidates.",
      mistakeTypes: ["entire_window_reset_after_violation"],
      nextAction:
        "Remove outgoing elements one at a time until validity returns.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-007",
    learningStage: "foundations",
    primarySkillAtomId: "prove_monotonic_window_shrinking",
    secondarySkillAtomIds: [
      "justify_discarded_left_boundaries",
      "use_non_negative_sum_monotonicity",
    ],
    type: "invariant_reasoning",
    prompt: `A window over non-negative values requires sum <= limit.

Why can a left boundary discarded while the current sum is too large remain discarded permanently?`,
    options: [
      {
        id: "future_expansion_cannot_repair_old_start",
        text: "Keeping that earlier start already produces an invalid sum, and future right expansions can only preserve or increase the sum.",
        isCorrect: true,
      },
      {
        id: "left_never_moves_backward_by_convention",
        text: "Because two-pointer code conventionally forbids left from moving backward, even without a correctness argument.",
        isCorrect: false,
      },
      {
        id: "all_removed_values_invalid",
        text: "Because every removed value is individually larger than limit.",
        isCorrect: false,
      },
      {
        id: "right_will_decrease_sum",
        text: "Because future right movements will decrease the sum and make the removed start unnecessary.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Non-negative incoming values provide the monotonic relationship needed for permanent elimination.",
      mentalModelCorrection:
        "Forward-only movement must be justified by the validity rule, not merely by the desired code shape.",
      mistakeTypes: ["discarded_left_boundary_not_justified"],
      nextAction:
        "Explain how future expansion affects a range that starts at the discarded index.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-008",
    learningStage: "foundations",
    primarySkillAtomId: "validate_window_monotonicity_assumption",
    secondarySkillAtomIds: [
      "reject_unsupported_shrink_rule",
      "reason_from_counterexample",
    ],
    type: "counterexample_reasoning",
    prompt: `A candidate applies the usual "shrink while sum > limit" rule to arbitrary positive and negative values.

For values = [5, -10, 5] and limit = 0, why is that movement rule unsafe for finding the longest valid range?`,
    options: [
      {
        id: "future_negative_can_restore_old_start",
        text: "The first value 5 is discarded immediately, but the later -10 makes the full range [5, -10, 5] valid with sum 0.",
        isCorrect: true,
      },
      {
        id: "negative_values_cannot_be_summed",
        text: "Sliding windows cannot maintain a sum when any value is negative.",
        isCorrect: false,
      },
      {
        id: "full_range_is_invalid",
        text: "The rule is safe because the full range has sum greater than zero.",
        isCorrect: false,
      },
      {
        id: "must_move_right_backward",
        text: "The only correction is to move right backward whenever a negative value is found.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Future expansion can decrease the sum, so a currently invalid earlier start may become valid later.",
      mentalModelCorrection:
        "A shrink rule is valid only when the problem supplies the monotonic relationship required to eliminate old boundaries permanently.",
      mistakeTypes: ["shrink_rule_used_without_monotonicity"],
      nextAction:
        "Before applying a standard window rule, prove how incoming and outgoing values affect validity.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-009",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_window_validity_from_endpoint_comparison",
    secondarySkillAtomIds: [
      "interpret_contiguous_range_state",
      "reject_opposite_end_pair_logic",
    ],
    type: "solution_comparison",
    prompt: `A task asks for the longest contiguous range whose total cost is at most a budget.

Which interpretation matches the objective?`,
    options: [
      {
        id: "maintain_all_range_costs",
        text: "Maintain the combined cost of every element in one current contiguous range and adjust its boundaries as validity changes.",
        isCorrect: true,
      },
      {
        id: "compare_endpoint_costs",
        text: "Compare only values[left] and values[right] and move whichever endpoint is more expensive.",
        isCorrect: false,
      },
      {
        id: "independent_pair",
        text: "Treat left and right as two independently selected items whose interior does not matter.",
        isCorrect: false,
      },
      {
        id: "mirrored_comparison",
        text: "Compare mirrored endpoint costs and move both whenever they are equal.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every element inside the selected range contributes to whether that range satisfies the budget.",
      mentalModelCorrection:
        "This is a window-validity problem, not an endpoint-pair comparison problem.",
      mistakeTypes: ["opposite_end_logic_used_for_range_objective"],
      nextAction:
        "Identify whether validity depends on two selected values or on the full range aggregate.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-010",
    learningStage: "foundations",
    primarySkillAtomId: "trace_longest_valid_variable_window",
    secondarySkillAtomIds: [
      "restore_window_validity",
      "record_longest_valid_range",
    ],
    type: "single_choice",
    prompt: `Trace the longest-window algorithm for:

values = [2, 1, 2, 1]
limit = 3

All values are non-negative. What maximum valid length is recorded?`,
    options: [
      {
        id: "length_two",
        text: "2",
        isCorrect: true,
      },
      {
        id: "length_one",
        text: "1",
        isCorrect: false,
      },
      {
        id: "length_three",
        text: "3",
        isCorrect: false,
      },
      {
        id: "length_four",
        text: "4",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each length-2 range has sum 3, while every length-3 range has sum greater than 3.",
      mentalModelCorrection:
        "Record the window only after any invalid expansion has been repaired.",
      mistakeTypes: ["longest_window_trace_mismatch"],
      nextAction:
        "Track left, right, current sum, and best length after each restored-validity step.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-011",
    learningStage: "foundations",
    primarySkillAtomId: "order_shortest_qualifying_window_operations",
    secondarySkillAtomIds: [
      "record_shortest_qualifying_range",
      "shrink_while_range_remains_qualifying",
    ],
    type: "subgoal_ordering",
    prompt: `All values are positive. A function finds the shortest contiguous range whose sum is at least target.

Which order correctly handles each incoming value?`,
    options: [
      {
        id: "expand_then_record_and_shrink_while_qualified",
        text: "Add the incoming value; while the sum is at least target, record the current length and remove values[left] to test a shorter range.",
        isCorrect: true,
      },
      {
        id: "shrink_until_below_then_record",
        text: "Shrink until the sum falls below target, then record that non-qualifying range.",
        isCorrect: false,
      },
      {
        id: "record_every_expansion",
        text: "Record every expanded range before checking whether its sum reaches target.",
        isCorrect: false,
      },
      {
        id: "move_right_when_qualified",
        text: "When the range qualifies, keep left fixed and move right farther to search for a shorter range.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Once a range qualifies, moving left forward is the operation that can make it shorter.",
      mentalModelCorrection:
        "For shortest qualifying ranges, record before each shrink that may destroy qualification.",
      mistakeTypes: ["shortest_window_operation_order_mismatch"],
      nextAction:
        "Tie answer recording to the state in which the current range still satisfies the qualification threshold.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-012",
    learningStage: "foundations",
    primarySkillAtomId: "record_shortest_window_before_shrinking",
    secondarySkillAtomIds: [
      "preserve_current_qualifying_candidate",
      "maintain_shortest_range",
    ],
    type: "mistake_review",
    prompt: `A shortest-range search uses positive values and target = 5.

For the range [2, 3], the sum is exactly 5. The implementation removes 2 before recording a candidate.

What answer can it miss?`,
    options: [
      {
        id: "misses_length_two",
        text: "It can miss the valid length-2 range [2, 3], because after removing 2 the remaining range no longer reaches the target.",
        isCorrect: true,
      },
      {
        id: "misses_length_one_three",
        text: "It misses the length-1 range [3], which already reaches target 5.",
        isCorrect: false,
      },
      {
        id: "misses_no_candidate",
        text: "It misses nothing because answers should only be recorded after the current range becomes invalid.",
        isCorrect: false,
      },
      {
        id: "must_reset_range",
        text: "It should discard both values and restart after every exact match.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current range is a qualifying candidate before the outgoing contribution is removed.",
      mentalModelCorrection:
        "When optimizing for minimum length, record each still-valid range before attempting to shorten it.",
      mistakeTypes: ["shortest_candidate_recorded_after_removal"],
      nextAction:
        "Update the best length at the start of each qualifying shrink-loop iteration.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-013",
    learningStage: "foundations",
    primarySkillAtomId: "handle_no_valid_nonempty_window",
    secondarySkillAtomIds: [
      "allow_empty_restored_window",
      "reason_about_window_edge_cases",
    ],
    type: "edge_case_drill",
    prompt: `A function finds the longest non-empty range with sum <= 1.

values = [2, 3]

All values are non-negative. What result should it return if zero represents "no valid non-empty range"?`,
    options: [
      {
        id: "zero",
        text: "0",
        isCorrect: true,
      },
      {
        id: "one",
        text: "1",
        isCorrect: false,
      },
      {
        id: "two",
        text: "2",
        isCorrect: false,
      },
      {
        id: "negative_one_required",
        text: "-1 is always required for every sliding-window problem with no result.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each individual value exceeds the limit, so every expanded range must shrink back to empty.",
      mentalModelCorrection:
        "A variable window may temporarily become empty after validity restoration.",
      mistakeTypes: ["no_valid_window_edge_case_mismatch"],
      nextAction:
        "Define the no-result convention separately from the pointer mechanics.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-014",
    learningStage: "foundations",
    primarySkillAtomId: "handle_empty_input_window",
    secondarySkillAtomIds: [
      "reason_about_window_edge_cases",
      "initialize_best_window_length",
    ],
    type: "edge_case_drill",
    prompt:
      "What should a longest-valid-range scan record for an empty input when the result is a length?",
    options: [
      {
        id: "zero",
        text: "0, because no non-empty contiguous range exists.",
        isCorrect: true,
      },
      {
        id: "one",
        text: "1, because the initial pointer position counts as a window.",
        isCorrect: false,
      },
      {
        id: "negative_length",
        text: "-1, because an empty input always has a negative range length.",
        isCorrect: false,
      },
      {
        id: "infinite",
        text: "Infinity, because no range violates the condition.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "No right-boundary expansion occurs, so no candidate range is created.",
      mentalModelCorrection:
        "Pointer initialization does not itself represent a non-empty window.",
      mistakeTypes: ["empty_input_window_length_mismatch"],
      nextAction:
        "Initialize length-based answers using the task's explicit no-range convention.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-variable-window-validity-015",
    learningStage: "foundations",
    primarySkillAtomId: "handle_zero_value_window_edge_case",
    secondarySkillAtomIds: [
      "preserve_valid_zero_sum_range",
      "record_full_valid_window",
    ],
    type: "edge_case_drill",
    prompt: `A longest-window task requires sum <= 0.

values = [0, 0, 0, 0]

All values are non-negative. What maximum length should be recorded?`,
    options: [
      {
        id: "four",
        text: "4",
        isCorrect: true,
      },
      {
        id: "zero",
        text: "0",
        isCorrect: false,
      },
      {
        id: "one",
        text: "1",
        isCorrect: false,
      },
      {
        id: "three",
        text: "3",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Adding zero never violates the sum constraint, so the range can continue expanding.",
      mentalModelCorrection:
        "A zero budget does not imply an empty result when zero-valued elements are permitted.",
      mistakeTypes: ["zero_value_window_edge_case_mismatch"],
      nextAction:
        "Evaluate the actual maintained state rather than assuming a zero limit forces immediate shrinking.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-016",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_simple_window_violation_count",
    secondarySkillAtomIds: [
      "update_state_on_window_entry",
      "update_state_on_window_exit",
      "restore_count_based_validity",
    ],
    type: "single_choice",
    prompt: `A window may contain at most one marked element. The maintained state is markedCount.

What updates are required when a marked value enters or leaves the current range?`,
    options: [
      {
        id: "increment_on_entry_decrement_on_exit",
        text: "Increment markedCount when the marked value enters and decrement it when that value leaves from the left.",
        isCorrect: true,
      },
      {
        id: "increment_only",
        text: "Increment markedCount on entry but never decrement it because historical observations remain relevant.",
        isCorrect: false,
      },
      {
        id: "compare_endpoints_only",
        text: "Ignore markedCount and compare whether the two endpoint values are both marked.",
        isCorrect: false,
      },
      {
        id: "reset_on_every_shrink",
        text: "Reset markedCount to zero whenever left moves, regardless of what remains inside the range.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The validity state must correspond exactly to the elements currently inside the window.",
      mentalModelCorrection:
        "Both incoming and outgoing elements must update any removable state maintained for the range.",
      mistakeTypes: ["window_state_not_updated_on_exit"],
      nextAction:
        "Define how each possible element changes state when entering and apply the inverse change when it leaves.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-017",
    learningStage: "foundations",
    primarySkillAtomId: "state_variable_window_invariant",
    secondarySkillAtomIds: [
      "name_active_candidate_range",
      "prove_forward_only_left_movement",
    ],
    type: "invariant_reasoning",
    prompt: `For a longest-range window over non-negative values with sum <= limit, which invariant is most useful after the shrink loop?`,
    options: [
      {
        id: "current_range_valid_removed_starts_unnecessary",
        text: "The range [left, right] is valid, its maintained sum matches exactly that range, and earlier removed starts cannot produce a valid range ending at right or any later position.",
        isCorrect: true,
      },
      {
        id: "endpoints_form_target_pair",
        text: "values[left] and values[right] form the best independent pair seen so far.",
        isCorrect: false,
      },
      {
        id: "all_prefixes_valid",
        text: "Every range beginning before left is valid because it contains more elements.",
        isCorrect: false,
      },
      {
        id: "window_has_fixed_length",
        text: "The distance between left and right remains constant after every expansion.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The invariant must connect boundary positions, maintained state, current validity, and eliminated starts.",
      mentalModelCorrection:
        "A useful window invariant explains both what the current range means and why discarded boundaries never need to return.",
      mistakeTypes: ["variable_window_invariant_incomplete"],
      nextAction:
        "State the current candidate, the exact state it owns, and the justification for permanent boundary movement.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-variable-window-validity-018",
    learningStage: "foundations",
    primarySkillAtomId: "choose_window_over_endpoint_pair_logic",
    secondarySkillAtomIds: [
      "recognize_full_range_validity",
      "distinguish_pair_elimination_from_window_shrinking",
    ],
    type: "solution_comparison",
    prompt: `The objective is to find the longest contiguous range containing at most two disallowed elements.

Solution A maintains the number of disallowed elements between left and right and shrinks from left when the count exceeds two.

Solution B compares only whether values[left] and values[right] are disallowed and moves one endpoint based on that comparison.

Which review is correct?`,
    options: [
      {
        id: "solution_a_matches_range_contract",
        text: "Solution A matches the contract because validity depends on every element in the range; Solution B ignores disallowed elements in the interior.",
        isCorrect: true,
      },
      {
        id: "solution_b_is_pair_elimination",
        text: "Solution B is correct because every range can be classified using only its two endpoints.",
        isCorrect: false,
      },
      {
        id: "both_equivalent",
        text: "Both are equivalent because left and right enclose the same indexes.",
        isCorrect: false,
      },
      {
        id: "neither_can_use_two_boundaries",
        text: "Neither is valid because a count-based condition cannot be maintained with two boundaries.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Interior elements directly determine whether the candidate range satisfies the constraint.",
      mentalModelCorrection:
        "Window shrinking responds to aggregate range validity, while opposite-end movement responds to a relationship between selected endpoint candidates.",
      mistakeTypes: ["endpoint_pair_logic_used_for_window_validity"],
      nextAction:
        "Identify every element that contributes to the validity condition before choosing pointer semantics.",
      result: "diagnostic",
    },
  },
];
