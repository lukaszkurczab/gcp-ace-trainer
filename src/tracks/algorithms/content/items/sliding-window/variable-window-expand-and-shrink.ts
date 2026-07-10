export const variableWindowExpandAndShrinkQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-variable-window-expand-shrink-001",
    learningStage: "foundations",
    primarySkillAtomId: "order_variable_window_iteration",
    secondarySkillAtomIds: [
      "expand_right_boundary",
      "restore_validity_by_shrinking_left",
    ],
    type: "subgoal_ordering",
    prompt:
      "Which sequence matches the standard variable-size sliding-window iteration for a longest window under an at-most constraint?",
    options: [
      {
        id: "expand_add_shrink_record",
        text: "Expand right, add the incoming contribution, shrink left while invalid, then evaluate the restored valid window.",
        isCorrect: true,
      },
      {
        id: "record_expand_shrink_add",
        text: "Record the answer, expand right, shrink left, and add the incoming contribution last.",
        isCorrect: false,
      },
      {
        id: "shrink_expand_record_add",
        text: "Shrink left before observing the incoming value, record the answer, then update state.",
        isCorrect: false,
      },
      {
        id: "expand_record_add_shrink",
        text: "Expand right, record the new length before updating state, then shrink once.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The maintained state must first include the new right element, and validity must be completely restored before the current window is recorded.",
      mentalModelCorrection:
        "Expansion changes membership, state updates describe that membership, and shrinking repairs any resulting violation.",
      mistakeTypes: ["variable_window_iteration_order_mismatch"],
      nextAction:
        "Separate boundary movement, state mutation, validity restoration, and answer recording.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-variable-window-expand-shrink-002",
    learningStage: "foundations",
    primarySkillAtomId: "interpret_variable_window_right_pointer",
    secondarySkillAtomIds: [
      "identify_incoming_window_element",
      "maintain_inclusive_window_boundaries",
    ],
    type: "single_choice",
    prompt:
      "In an inclusive window [left, right], what does advancing right by one represent?",
    options: [
      {
        id: "one_new_element_enters",
        text: "One new input element enters the current window and must be added to its maintained state.",
        isCorrect: true,
      },
      {
        id: "left_element_leaves",
        text: "The element at left leaves the current window.",
        isCorrect: false,
      },
      {
        id: "window_becomes_valid",
        text: "The current window becomes valid automatically.",
        isCorrect: false,
      },
      {
        id: "all_remaining_elements_enter",
        text: "Every remaining suffix element enters the window at once.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The right boundary controls expansion by introducing the next observation.",
      mentalModelCorrection:
        "Boundary movement changes window membership and therefore requires a corresponding state update.",
      mistakeTypes: ["right_expansion_membership_misinterpreted"],
      nextAction: "Name the exact element that enters when right advances.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-variable-window-expand-shrink-003",
    learningStage: "foundations",
    primarySkillAtomId: "add_incoming_state_before_validity_check",
    secondarySkillAtomIds: [
      "synchronize_window_state_with_right",
      "avoid_stale_expansion_state",
    ],
    type: "mistake_review",
    prompt: `A loop advances right and immediately checks whether the window is valid.

Only afterward does it execute:

add(values[right]);

What is wrong?`,
    options: [
      {
        id: "state_excludes_incoming_value",
        text: "The boundaries already include values[right], but the maintained state still describes the previous window.",
        isCorrect: true,
      },
      {
        id: "right_must_not_advance",
        text: "right may never advance before left.",
        isCorrect: false,
      },
      {
        id: "incoming_state_is_optional",
        text: "Nothing; validity should ignore the newest window element.",
        isCorrect: false,
      },
      {
        id: "add_must_happen_after_shrink",
        text: "The incoming contribution should be added only after shrinking finishes.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The interval and its state refer to different sets of elements.",
      mentalModelCorrection:
        "Add the incoming contribution before asking whether the expanded interval satisfies the constraint.",
      mistakeTypes: ["validity_checked_with_stale_incoming_state"],
      nextAction:
        "Ensure the state describes exactly [left, right] before evaluating validity.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-004",
    learningStage: "foundations",
    primarySkillAtomId: "shrink_repeatedly_until_window_valid",
    secondarySkillAtomIds: [
      "distinguish_if_from_while_shrink",
      "restore_window_invariant_completely",
    ],
    type: "mistake_review",
    prompt: `A variable window uses:

if (!isValid()) {
  remove(values[left]);
  left++;
}

Why can this be incorrect?`,
    options: [
      {
        id: "one_removal_may_not_be_enough",
        text: "One outgoing element may not repair the violation, so the window can remain invalid after the branch.",
        isCorrect: true,
      },
      {
        id: "if_is_invalid_syntax",
        text: "An if statement is invalid syntax inside a sliding-window loop.",
        isCorrect: false,
      },
      {
        id: "left_must_move_once",
        text: "Every expansion requires exactly one left movement.",
        isCorrect: false,
      },
      {
        id: "right_should_be_removed",
        text: "The incoming right element must always be removed instead.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The amount of required contraction depends on the current state, not on the number of expansions.",
      mentalModelCorrection:
        "Use while when validity must be rechecked after every outgoing update until the invariant is restored.",
      mistakeTypes: ["one_time_shrink_leaves_window_invalid"],
      nextAction:
        "Loop on the live invalidity predicate rather than performing one unconditional repair step.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-variable-window-expand-shrink-005",
    learningStage: "foundations",
    primarySkillAtomId: "choose_variable_window_shrink_condition",
    secondarySkillAtomIds: [
      "restore_at_most_constraint",
      "stop_shrinking_after_validity",
    ],
    type: "single_choice",
    prompt:
      "A longest-window problem requires at most k distinct values. Which shrink condition matches the usual invariant?",
    options: [
      {
        id: "while_distinct_exceeds_k",
        text: "Shrink while distinctCount > k.",
        isCorrect: true,
      },
      {
        id: "while_distinct_equals_k",
        text: "Shrink while distinctCount === k.",
        isCorrect: false,
      },
      {
        id: "while_distinct_below_k",
        text: "Shrink while distinctCount < k.",
        isCorrect: false,
      },
      {
        id: "shrink_once_for_each_right",
        text: "Shrink exactly once after every right expansion.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The window violates an at-most-k contract only when its distinct count exceeds k.",
      mentalModelCorrection:
        "Shrinking repairs invalidity and stops at the first state that satisfies the at-most constraint.",
      mistakeTypes: ["wrong_variable_window_shrink_condition"],
      nextAction:
        "Write the invalidity predicate explicitly and use it as the loop condition.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-variable-window-expand-shrink-006",
    learningStage: "foundations",
    primarySkillAtomId: "remove_outgoing_state_before_left_advance",
    secondarySkillAtomIds: [
      "identify_outgoing_window_element",
      "synchronize_state_with_left_boundary",
    ],
    type: "subgoal_ordering",
    prompt:
      "Which sequence correctly removes the leftmost element from an inclusive window?",
    options: [
      {
        id: "remove_then_increment_left",
        text: "Remove values[left] from the maintained state, then increment left.",
        isCorrect: true,
      },
      {
        id: "increment_then_remove_new_left",
        text: "Increment left, then remove values[left].",
        isCorrect: false,
      },
      {
        id: "increment_without_state_update",
        text: "Increment left without changing the maintained state.",
        isCorrect: false,
      },
      {
        id: "remove_right_then_increment_left",
        text: "Remove values[right], then increment left.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The outgoing element is located at the old left boundary.",
      mentalModelCorrection:
        "State removal must correspond to the element that actually leaves before the boundary changes.",
      mistakeTypes: ["wrong_outgoing_update_order"],
      nextAction:
        "Save or remove the old left element before advancing the boundary.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-007",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_stale_outgoing_sum",
    secondarySkillAtomIds: [
      "subtract_outgoing_contribution",
      "maintain_exact_window_sum",
    ],
    type: "mistake_review",
    prompt: `A sum-based window shrinks with:

left++;

but never subtracts the outgoing value from sum.

What happens to the invariant?`,
    options: [
      {
        id: "sum_contains_removed_values",
        text: "sum continues to include elements before left, so it no longer represents the current window.",
        isCorrect: true,
      },
      {
        id: "sum_updates_automatically",
        text: "Nothing; changing left automatically subtracts the outgoing value.",
        isCorrect: false,
      },
      {
        id: "right_moves_backward",
        text: "right is forced to move backward.",
        isCorrect: false,
      },
      {
        id: "sum_becomes_prefix_length",
        text: "sum begins representing the physical length of the input.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Pointer movement does not mutate an independently maintained aggregate.",
      mentalModelCorrection:
        "Every membership change needs a matching contribution update.",
      mistakeTypes: ["outgoing_sum_contribution_not_removed"],
      nextAction: "Subtract values[left] before incrementing left.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-008",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_stale_outgoing_frequency",
    secondarySkillAtomIds: [
      "decrement_outgoing_frequency",
      "maintain_current_window_counts",
    ],
    type: "mistake_review",
    prompt: `A character leaves the window, but its frequency-map count is not decremented.

Why can later validity checks fail?`,
    options: [
      {
        id: "map_contains_historical_occurrence",
        text: "The map still counts an occurrence outside [left, right], so duplicate or distinct-state decisions can be stale.",
        isCorrect: true,
      },
      {
        id: "frequency_maps_ignore_boundaries",
        text: "Nothing; a window frequency map should describe the complete processed prefix.",
        isCorrect: false,
      },
      {
        id: "right_must_reset",
        text: "The only effect is that right must return to index zero.",
        isCorrect: false,
      },
      {
        id: "left_value_remains_inside",
        text: "The outgoing value remains inside the window after left advances.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Window-local state must stop representing an occurrence as soon as that occurrence exits.",
      mentalModelCorrection:
        "A frequency map for the active window is not a history of every value previously observed.",
      mistakeTypes: ["outgoing_frequency_state_left_stale"],
      nextAction:
        "Decrement the outgoing key and update any derived distinct or duplicate state.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-variable-window-expand-shrink-009",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_monotonic_left_boundary",
    secondarySkillAtomIds: [
      "avoid_reintroducing_discarded_prefix",
      "preserve_linear_window_progress",
    ],
    type: "single_choice",
    prompt:
      "Why does the standard variable-window left boundary move only forward?",
    options: [
      {
        id: "discarded_prefix_never_needed_again",
        text: "The monotonicity argument proves that positions removed from the left cannot be needed for a later window ending farther right.",
        isCorrect: true,
      },
      {
        id: "language_forbids_decrement",
        text: "Programming languages do not allow a left pointer to be decremented.",
        isCorrect: false,
      },
      {
        id: "left_must_equal_right",
        text: "left must always move until it equals right.",
        isCorrect: false,
      },
      {
        id: "all_windows_start_at_zero",
        text: "Every valid window begins at index zero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each left movement permanently excludes a processed prefix under the problem's monotonic validity structure.",
      mentalModelCorrection:
        "Forward-only movement requires a correctness argument about discarded starts, not merely a coding convention.",
      mistakeTypes: ["left_monotonicity_not_justified"],
      nextAction:
        "Explain why a discarded left position cannot become useful after right advances.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-010",
    learningStage: "foundations",
    primarySkillAtomId: "prevent_backward_last_seen_jump",
    secondarySkillAtomIds: [
      "maintain_monotonic_left_boundary",
      "ignore_stale_duplicate_indexes",
    ],
    type: "mistake_review",
    prompt: `A longest-substring-without-repeats solution uses last-seen indexes.

For:

text = "abba"

left has already advanced to index 2. At the final "a", lastSeen["a"] is 0.

Why should the update be:

left = Math.max(left, lastSeen["a"] + 1)

rather than assigning lastSeen["a"] + 1 directly?`,
    options: [
      {
        id: "avoid_moving_left_backward",
        text: "The old occurrence lies outside the current window, and assigning 1 would move left backward and reintroduce discarded positions.",
        isCorrect: true,
      },
      {
        id: "left_must_move_to_right",
        text: "left must always become equal to right after any repeated character.",
        isCorrect: false,
      },
      {
        id: "last_seen_indexes_are_invalid",
        text: "Last-seen indexes cannot be used in a sliding-window algorithm.",
        isCorrect: false,
      },
      {
        id: "a_is_not_duplicate",
        text: "The final a must be ignored because repeated values never affect a window.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A historical occurrence may be located before the active left boundary.",
      mentalModelCorrection:
        "Jump-based updates must preserve left monotonicity and ignore stale indexes outside the current window.",
      mistakeTypes: ["left_boundary_moved_backward_from_stale_index"],
      nextAction:
        "Clamp jump-based boundary updates against the current left value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-variable-window-expand-shrink-011",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_monotonic_right_boundary",
    secondarySkillAtomIds: [
      "process_each_input_position_once",
      "avoid_window_restart",
    ],
    type: "single_choice",
    prompt:
      "In the standard expand-right, shrink-left pattern, what normally happens to right after a window becomes invalid?",
    options: [
      {
        id: "right_stays_while_left_repairs",
        text: "right remains at the incoming element while left moves forward until validity is restored.",
        isCorrect: true,
      },
      {
        id: "right_moves_backward",
        text: "right moves backward until the previous valid window is reconstructed.",
        isCorrect: false,
      },
      {
        id: "right_resets_zero",
        text: "right resets to zero after every violation.",
        isCorrect: false,
      },
      {
        id: "right_matches_left",
        text: "right is immediately assigned the same index as left.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The incoming element remains part of the candidate while earlier elements are removed to repair the constraint.",
      mentalModelCorrection:
        "The pattern explores candidates through monotonic expansion and contraction rather than repeated restarts.",
      mistakeTypes: ["right_boundary_moved_backward_on_invalidity"],
      nextAction:
        "Keep right fixed during the repair loop and remove only outgoing left elements.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-012",
    learningStage: "foundations",
    primarySkillAtomId: "bound_total_variable_window_boundary_movement",
    secondarySkillAtomIds: [
      "recognize_amortized_left_movement",
      "avoid_false_nested_loop_reasoning",
    ],
    type: "complexity_check",
    expectedTimeComplexity: "O(n)",
    expectedSpaceComplexity: "state-dependent",
    complexityExplanation:
      "right advances across the input once, and left also advances at most n times in total. The inner shrink loop does not restart left for every right position.",
    prompt: `A loop advances right from 0 to n - 1. Inside it, a while loop may advance left several times, but left never moves backward.

What is the total number of boundary advances?`,
    options: [
      {
        id: "linear_total",
        text: "O(n), because each boundary crosses at most n positions over the complete execution.",
        isCorrect: true,
      },
      {
        id: "quadratic_nested_syntax",
        text: "O(n²), because a while loop is nested inside a for loop.",
        isCorrect: false,
      },
      {
        id: "constant_two_boundaries",
        text: "O(1), because only two boundary variables exist.",
        isCorrect: false,
      },
      {
        id: "logarithmic_shrinking",
        text: "O(log n), because the window becomes smaller during contraction.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The inner-loop work consumes left positions that are never revisited.",
      mentalModelCorrection:
        "Nested syntax does not imply multiplicative complexity when total pointer movement is globally bounded.",
      mistakeTypes: ["variable_window_shrink_loop_claimed_quadratic"],
      nextAction: "Count total left and right movements across the entire run.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-013",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_nonnegative_sum_window_monotonicity",
    secondarySkillAtomIds: [
      "justify_sum_constraint_shrinking",
      "identify_required_value_precondition",
    ],
    type: "single_choice",
    prompt:
      "Why can a longest-window algorithm for sum <= limit safely shrink from the left when all values are nonnegative?",
    options: [
      {
        id: "removal_cannot_increase_sum",
        text: "Removing a leftmost nonnegative value cannot increase the sum, while adding another nonnegative value cannot decrease it.",
        isCorrect: true,
      },
      {
        id: "sum_is_always_sorted",
        text: "A running sum is automatically sorted.",
        isCorrect: false,
      },
      {
        id: "every_removal_makes_zero",
        text: "Removing one value always resets the sum to zero.",
        isCorrect: false,
      },
      {
        id: "value_signs_irrelevant",
        text: "The same monotonic argument holds for arbitrary positive and negative values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The sign restriction makes expansion and contraction affect the sum in predictable directions.",
      mentalModelCorrection:
        "Sum-based window monotonicity comes from value constraints, not from the existence of a running sum.",
      mistakeTypes: ["sum_window_monotonicity_precondition_missed"],
      nextAction:
        "State how adding and removing one allowed value can change the maintained sum.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-014",
    learningStage: "foundations",
    primarySkillAtomId: "reject_mixed_sign_sum_window_monotonicity",
    secondarySkillAtomIds: [
      "diagnose_invalid_sum_shrinking",
      "recognize_nonmonotonic_window_constraint",
    ],
    type: "mistake_review",
    prompt: `A candidate uses the rule:

"Whenever the window sum exceeds limit, remove values from the left permanently."

The input may contain negative values.

What is the central problem?`,
    options: [
      {
        id: "future_negative_can_restore_discarded_window",
        text: "A later negative value could reduce the sum, so an earlier start discarded during a temporary violation may belong to a later valid longer window.",
        isCorrect: true,
      },
      {
        id: "negative_values_cannot_be_added",
        text: "Negative values cannot participate in a contiguous window.",
        isCorrect: false,
      },
      {
        id: "sum_requires_sorting",
        text: "Every sum-based window must sort the input first.",
        isCorrect: false,
      },
      {
        id: "left_should_move_backward",
        text: "The standard correction is to move left backward whenever a negative value appears.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "Expansion can now either increase or decrease the sum.",
      mentalModelCorrection:
        "Forward-only shrinking is unsafe when future additions can reverse the reason a start position was discarded.",
      mistakeTypes: ["mixed_sign_sum_uses_invalid_window_monotonicity"],
      nextAction:
        "Verify that future expansion cannot restore a permanently discarded candidate start.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-015",
    learningStage: "foundations",
    primarySkillAtomId: "reject_direct_exact_k_invalidity_shrink",
    secondarySkillAtomIds: [
      "distinguish_exact_from_at_most_constraint",
      "avoid_shrinking_underfilled_window",
    ],
    type: "mistake_review",
    prompt: `A longest-window implementation for exactly k distinct values uses:

while (distinctCount !== k) {
  remove(values[left]);
  left++;
}

immediately after each expansion.

Why is this not a valid general shrink rule?`,
    options: [
      {
        id: "below_k_should_expand_not_shrink",
        text: "When distinctCount is below k, the window needs further expansion rather than contraction, so the loop may erase candidates before they can reach exactly k.",
        isCorrect: true,
      },
      {
        id: "exact_k_never_uses_windows",
        text: "Exactly-k problems can never use sliding-window reasoning.",
        isCorrect: false,
      },
      {
        id: "distinct_count_cannot_change",
        text: "Shrinking never changes the number of distinct values.",
        isCorrect: false,
      },
      {
        id: "must_shrink_when_equal",
        text: "The loop should shrink only while distinctCount === k.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Being below k and being above k require different actions.",
      mentalModelCorrection:
        "A canonical shrink-on-invalid loop needs a one-sided violation such as distinctCount > k.",
      mistakeTypes: ["exact_k_treated_as_one_sided_window_validity"],
      nextAction:
        "Use an at-most-k invariant and separately verify or derive exact-k results.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-016",
    learningStage: "foundations",
    primarySkillAtomId: "trace_at_most_distinct_expansion_and_shrink",
    secondarySkillAtomIds: [
      "restore_distinct_count_validity",
      "record_longest_restored_window",
    ],
    type: "edge_case_drill",
    prompt: `Find the longest substring with at most two distinct characters:

text = "eceba"

What maximum length should the expand-and-shrink scan record?`,
    options: [
      {
        id: "length_three",
        text: '3, from "ece".',
        isCorrect: true,
      },
      {
        id: "length_five",
        text: "5, because the entire processed prefix should be recorded before shrinking.",
        isCorrect: false,
      },
      {
        id: "length_two",
        text: "2, because every invalid expansion requires discarding both existing character types.",
        isCorrect: false,
      },
      {
        id: "length_one",
        text: "1, because repeated characters make the window invalid.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        'The window "ece" is valid, while adding b creates three distinct characters and requires repeated shrinking.',
      mentalModelCorrection:
        "The best answer is evaluated after each expansion has been brought back within the at-most constraint.",
      mistakeTypes: ["at_most_distinct_expand_shrink_trace_mismatch"],
      nextAction:
        "Track the frequency map, distinct count, and restored left boundary for every right position.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-017",
    learningStage: "foundations",
    primarySkillAtomId: "trace_repeated_sum_shrinking",
    secondarySkillAtomIds: [
      "apply_nonnegative_sum_monotonicity",
      "shrink_until_sum_within_limit",
    ],
    type: "edge_case_drill",
    prompt: `A nonnegative array window must satisfy sum <= 4.

values = [1, 2, 3]

After right reaches the value 3, the window sum is 6.

What contraction is required?`,
    options: [
      {
        id: "remove_one_and_two",
        text: "Remove 1 and then 2, leaving the valid window [3] with sum 3.",
        isCorrect: true,
      },
      {
        id: "remove_one_only",
        text: "Remove only 1 and stop with sum 5.",
        isCorrect: false,
      },
      {
        id: "remove_three",
        text: "Remove the incoming 3 and restore the previous window.",
        isCorrect: false,
      },
      {
        id: "move_right_backward",
        text: "Move right backward to index 1.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The first outgoing removal does not fully restore the sum constraint.",
      mentalModelCorrection:
        "The shrink loop continues until the live state satisfies the invariant, even if several left movements are needed.",
      mistakeTypes: ["sum_window_stops_after_one_shrink"],
      nextAction: "Recheck the sum after every outgoing subtraction.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-018",
    learningStage: "foundations",
    primarySkillAtomId: "handle_single_element_window_violation",
    secondarySkillAtomIds: [
      "allow_temporarily_empty_window",
      "maintain_state_after_complete_shrink",
    ],
    type: "edge_case_drill",
    prompt: `A nonnegative sum window requires sum <= 5.

The incoming value is 10, and the current window contains only that value.

What should the shrink loop produce?`,
    options: [
      {
        id: "empty_window_zero_sum",
        text: "Remove 10, advance left past right, and leave an empty window with sum 0 before the next expansion.",
        isCorrect: true,
      },
      {
        id: "keep_invalid_singleton",
        text: "Keep [10] because a one-element window cannot be shrunk.",
        isCorrect: false,
      },
      {
        id: "move_right_backward",
        text: "Move right backward and process 10 repeatedly.",
        isCorrect: false,
      },
      {
        id: "set_sum_to_five",
        text: "Clamp the maintained sum to the limit without changing boundaries.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Even a one-element candidate may violate the constraint and must be removed.",
      mentalModelCorrection:
        "A correctly synchronized variable window may become temporarily empty after complete validity restoration.",
      mistakeTypes: ["invalid_single_element_window_not_removed"],
      nextAction:
        "Apply the same shrink invariant until the violating element has left the window.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-019",
    learningStage: "foundations",
    primarySkillAtomId: "compare_one_time_and_complete_window_shrink",
    secondarySkillAtomIds: [
      "review_variable_window_repair_logic",
      "preserve_valid_answer_recording",
    ],
    type: "solution_comparison",
    prompt: `Compare two implementations after adding values[right]:

A.
if (!isValid()) {
  remove(values[left]);
  left++;
}

B.
while (!isValid()) {
  remove(values[left]);
  left++;
}

For a longest window under an at-most constraint, which review is correct?`,
    options: [
      {
        id: "b_restores_invariant",
        text: "B is generally correct because it restores validity completely; A is correct only when one removal is independently proved sufficient.",
        isCorrect: true,
      },
      {
        id: "a_always_correct",
        text: "A is always correct because every right expansion creates at most one violation.",
        isCorrect: false,
      },
      {
        id: "b_is_quadratic",
        text: "B is invalid because the nested while loop necessarily makes the algorithm O(n²).",
        isCorrect: false,
      },
      {
        id: "both_record_invalid_windows",
        text: "Both necessarily produce invalid answers even after shrinking.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The invariant, not the number of code branches, determines how many outgoing removals are needed.",
      mentalModelCorrection:
        "A one-time repair requires a problem-specific proof; the general variable-window template rechecks invalidity in a loop.",
      mistakeTypes: ["single_shrink_assumed_equivalent_to_full_repair"],
      nextAction:
        "Prove whether one removal always restores the exact constraint before replacing while with if.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-variable-window-expand-shrink-020",
    learningStage: "foundations",
    primarySkillAtomId: "state_complete_variable_window_invariant",
    secondarySkillAtomIds: [
      "synchronize_boundaries_and_state",
      "prove_monotonic_window_progress",
    ],
    type: "invariant_identification",
    prompt:
      "Which statement most completely explains correctness for an expand-right, shrink-left variable window?",
    options: [
      {
        id: "complete_expand_shrink_invariant",
        text: "Before recording an answer, the maintained state describes exactly [left, right]; right has introduced each processed element once; left has removed every element before it exactly once; shrinking continues while invalid; and the problem's monotonicity proves discarded starts never need to return.",
        isCorrect: true,
      },
      {
        id: "two_boundaries_are_enough",
        text: "Correctness follows from having variables named left and right.",
        isCorrect: false,
      },
      {
        id: "one_shrink_per_right",
        text: "Both boundaries must move exactly once during every outer iteration.",
        isCorrect: false,
      },
      {
        id: "state_may_describe_prefix",
        text: "The state may include any processed prefix as long as the current window length is computed from left and right.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Correctness connects exact state membership, complete validity restoration, forward-only progress, and a proof that discarded candidates remain impossible.",
      mentalModelCorrection:
        "The template is valid only when boundary movement, state updates, and monotonicity form one coherent invariant.",
      mistakeTypes: ["variable_window_correctness_argument_incomplete"],
      nextAction:
        "Verify the invariant before expansion, after adding, after each removal, and before answer recording.",
      result: "diagnostic",
    },
  },
];
