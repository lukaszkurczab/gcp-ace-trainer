export const validityInvariantAndAnswerTimingQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-window-validity-answer-timing-001",
    learningStage: "foundations",
    primarySkillAtomId: "state_sliding_window_validity_invariant",
    secondarySkillAtomIds: [
      "synchronize_window_state_with_boundaries",
      "distinguish_valid_and_invalid_windows",
    ],
    type: "invariant_identification",
    prompt:
      "Which invariant must hold whenever a sliding-window algorithm evaluates or records the current interval [left, right]?",
    options: [
      {
        id: "state_matches_current_interval",
        text: "The maintained state describes exactly the elements in [left, right], and the algorithm knows whether that interval satisfies the required validity condition.",
        isCorrect: true,
      },
      {
        id: "state_includes_processed_prefix",
        text: "The maintained state may include any previously processed elements as long as right never moves backward.",
        isCorrect: false,
      },
      {
        id: "boundaries_define_validity",
        text: "The interval is valid automatically whenever left <= right.",
        isCorrect: false,
      },
      {
        id: "answer_proves_state",
        text: "The state is correct whenever the current interval is longer than the recorded answer.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Answer correctness depends on the state and boundaries referring to the same current candidate.",
      mentalModelCorrection:
        "Pointer positions, maintained state, and the validity predicate must remain synchronized.",
      mistakeTypes: ["window_validity_invariant_incomplete"],
      nextAction:
        "State which elements are represented by the maintained state before checking validity.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-window-validity-answer-timing-002",
    learningStage: "foundations",
    primarySkillAtomId: "record_longest_window_after_restoring_validity",
    secondarySkillAtomIds: [
      "maximize_valid_window_length",
      "shrink_until_valid",
    ],
    type: "subgoal_ordering",
    prompt:
      "A variable-size window seeks the longest substring containing at most k distinct characters. Which order is correct after right advances?",
    options: [
      {
        id: "add_shrink_record",
        text: "Add the incoming character to state, shrink while the window is invalid, then record the current valid length.",
        isCorrect: true,
      },
      {
        id: "record_add_shrink",
        text: "Record the length first, then add the incoming character and repair validity.",
        isCorrect: false,
      },
      {
        id: "add_record_shrink",
        text: "Add the incoming character, record the length even if invalid, then shrink.",
        isCorrect: false,
      },
      {
        id: "shrink_record_add",
        text: "Shrink before adding the incoming character, record the result, and update state last.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A longest valid answer may be recorded only after the current interval has been restored to validity.",
      mentalModelCorrection:
        "Expansion creates a candidate, restoration establishes legality, and only then may maximization use its length.",
      mistakeTypes: ["longest_window_recorded_before_validity_restored"],
      nextAction: "Place the maximum update after the invalidity-repair loop.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-003",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_invalid_longest_window_recording",
    secondarySkillAtomIds: [
      "reject_invalid_maximum_candidate",
      "review_answer_update_position",
    ],
    type: "mistake_review",
    prompt: `A longest-window implementation does this:

add(values[right]);

best = Math.max(best, right - left + 1);

while (!isValid()) {
  remove(values[left]);
  left++;
}

What is the principal bug?`,
    options: [
      {
        id: "invalid_interval_can_update_best",
        text: "The maximum may be updated using an invalid interval before shrinking restores the constraint.",
        isCorrect: true,
      },
      {
        id: "right_must_move_backward",
        text: "right must move backward whenever the interval becomes invalid.",
        isCorrect: false,
      },
      {
        id: "maximum_requires_invalid_windows",
        text: "Longest-window problems should maximize over invalid intervals before repairing them.",
        isCorrect: false,
      },
      {
        id: "remove_must_happen_after_left",
        text: "The only issue is that left must increment before the outgoing value is removed.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current candidate may violate the output contract immediately after expansion.",
      mentalModelCorrection:
        "Length alone does not qualify an interval as an answer; validity must be established first.",
      mistakeTypes: ["invalid_window_used_as_maximum"],
      nextAction:
        "Move the answer update below the complete validity-restoration loop.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-004",
    learningStage: "foundations",
    primarySkillAtomId: "use_while_to_restore_window_validity",
    secondarySkillAtomIds: [
      "distinguish_single_shrink_from_complete_repair",
      "maintain_at_most_constraint",
    ],
    type: "mistake_review",
    prompt: `A window must contain at most two distinct values.

After adding values[right], the code uses:

if (distinctCount > 2) {
  remove(values[left]);
  left++;
}

Why may this be insufficient?`,
    options: [
      {
        id: "one_removal_may_not_restore_validity",
        text: "Removing one element may leave the same outgoing value elsewhere in the window, so the distinct count can remain above two.",
        isCorrect: true,
      },
      {
        id: "if_never_allowed",
        text: "An if statement may never appear inside a sliding-window algorithm.",
        isCorrect: false,
      },
      {
        id: "must_remove_right",
        text: "The incoming right value must always be removed instead.",
        isCorrect: false,
      },
      {
        id: "distinct_count_drops_every_removal",
        text: "One removal always decreases the distinct count by exactly one.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The validity violation can survive more than one left-boundary movement.",
      mentalModelCorrection:
        "Use a while loop when the invariant must be restored completely before the current interval is recorded.",
      mistakeTypes: ["if_used_when_multiple_shrinks_required"],
      nextAction:
        "Continue shrinking until the validity predicate itself becomes true.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-005",
    learningStage: "foundations",
    primarySkillAtomId: "trace_invalid_maximum_candidate",
    secondarySkillAtomIds: [
      "record_only_valid_longest_windows",
      "restore_distinct_constraint",
    ],
    type: "edge_case_drill",
    prompt: `The task is to find the longest substring with at most two distinct characters.

text = "eceb"

After adding "b", the current interval "eceb" has three distinct characters.

Which action is correct?`,
    options: [
      {
        id: "shrink_before_recording_four",
        text: "Shrink until at most two distinct characters remain; do not record length 4 as a valid maximum.",
        isCorrect: true,
      },
      {
        id: "record_four_then_shrink",
        text: "Record length 4 because it is the longest interval seen, then repair validity.",
        isCorrect: false,
      },
      {
        id: "remove_b",
        text: "Remove the incoming character immediately because right may never create an invalid interval.",
        isCorrect: false,
      },
      {
        id: "reset_window",
        text: "Reset both boundaries to the start of the string.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The four-character interval violates the at-most-two-distinct output contract.",
      mentalModelCorrection:
        "A maximum is taken over valid candidates, not over every temporarily constructed interval.",
      mistakeTypes: ["invalid_distinct_window_recorded_as_longest"],
      nextAction:
        "Restore the distinct constraint before comparing the length with the best answer.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-window-validity-answer-timing-006",
    learningStage: "foundations",
    primarySkillAtomId: "record_shortest_window_while_valid",
    secondarySkillAtomIds: [
      "minimize_valid_window_length",
      "shrink_valid_window_greedily",
    ],
    type: "subgoal_ordering",
    prompt:
      "A nonnegative array is searched for the shortest contiguous subarray whose sum is at least target. Which order is correct after adding values[right]?",
    options: [
      {
        id: "add_then_record_and_shrink_while_valid",
        text: "Add the incoming value, then while the sum is at least target, record the current length and remove the outgoing value.",
        isCorrect: true,
      },
      {
        id: "add_shrink_until_invalid_then_record",
        text: "Add the incoming value, shrink until the sum is below target, then record that invalid interval.",
        isCorrect: false,
      },
      {
        id: "record_only_before_any_shrink",
        text: "Record at most one interval for each right position and never test shorter intervals ending there.",
        isCorrect: false,
      },
      {
        id: "shrink_only_when_invalid",
        text: "Shrink only while the sum is below target.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every valid interval ending at the current right boundary may have a shorter valid suffix.",
      mentalModelCorrection:
        "For shortest valid windows, record before each shrink and continue contracting while validity remains true.",
      mistakeTypes: ["shortest_window_not_recorded_during_valid_shrinking"],
      nextAction:
        "Place the minimum update inside the loop whose condition represents validity.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-007",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_late_shortest_window_recording",
    secondarySkillAtomIds: [
      "record_before_invalidating_window",
      "avoid_missing_last_valid_candidate",
    ],
    type: "mistake_review",
    prompt: `A shortest-window implementation shrinks while the window is valid:

while (isValid()) {
  remove(values[left]);
  left++;
}

best = Math.min(best, right - left + 1);

Why is this answer update too late?`,
    options: [
      {
        id: "window_is_already_invalid",
        text: "The loop stops only after validity has been lost, so the recorded boundaries describe an invalid interval and the last valid interval was skipped.",
        isCorrect: true,
      },
      {
        id: "minimum_must_use_full_array",
        text: "A minimum window must always begin at index zero.",
        isCorrect: false,
      },
      {
        id: "shrinking_never_allowed",
        text: "Shortest-window algorithms may not move left after finding validity.",
        isCorrect: false,
      },
      {
        id: "best_must_update_before_add",
        text: "The answer must be updated before the incoming value enters the state.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The loop condition is false when control reaches the answer update.",
      mentalModelCorrection:
        "Record each valid candidate before removing the element that may destroy validity.",
      mistakeTypes: ["minimum_recorded_after_window_became_invalid"],
      nextAction:
        "Move the minimum update to the beginning of the validity-controlled shrink loop.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-008",
    learningStage: "foundations",
    primarySkillAtomId: "record_shortest_candidate_before_shrink",
    secondarySkillAtomIds: [
      "preserve_current_valid_boundaries",
      "minimize_before_state_mutation",
    ],
    type: "single_choice",
    prompt:
      "In a shortest covering-window algorithm, why should the current interval be recorded before removing values[left]?",
    options: [
      {
        id: "removal_may_destroy_validity",
        text: "The current interval is known to be valid, but removing its leftmost element may make it invalid.",
        isCorrect: true,
      },
      {
        id: "left_cannot_move_after_record",
        text: "The left pointer is not allowed to move after any answer has been recorded.",
        isCorrect: false,
      },
      {
        id: "removal_always_preserves_validity",
        text: "Removal always preserves validity, so recording order is irrelevant.",
        isCorrect: false,
      },
      {
        id: "right_must_be_removed_first",
        text: "The incoming right element must be removed before any answer is considered.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The validity proof applies to the current boundaries before the outgoing state update.",
      mentalModelCorrection:
        "Answer timing must use the last state known to satisfy the contract.",
      mistakeTypes: ["shortest_candidate_recorded_after_destructive_shrink"],
      nextAction:
        "Record the candidate while its validity proof still applies.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-009",
    learningStage: "foundations",
    primarySkillAtomId: "use_while_to_minimize_valid_window",
    secondarySkillAtomIds: [
      "find_shortest_suffix_for_right_boundary",
      "avoid_single_shrink_minimum",
    ],
    type: "mistake_review",
    prompt: `A shortest-window algorithm uses:

if (isValid()) {
  best = Math.min(best, right - left + 1);
  remove(values[left]);
  left++;
}

What can be missed?`,
    options: [
      {
        id: "shorter_valid_suffix_same_right",
        text: "After one removal, the window may still be valid, and an even shorter valid interval ending at the same right position may exist.",
        isCorrect: true,
      },
      {
        id: "longer_invalid_prefix",
        text: "The algorithm may fail to record longer invalid intervals.",
        isCorrect: false,
      },
      {
        id: "right_must_move_left",
        text: "right should move backward after every valid interval.",
        isCorrect: false,
      },
      {
        id: "minimum_requires_no_shrink",
        text: "A shortest-window algorithm should never shrink a valid interval.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "One right boundary can support several nested valid windows with different left boundaries.",
      mentalModelCorrection:
        "Shortest-window search must continue shrinking while validity survives.",
      mistakeTypes: ["if_used_instead_of_while_for_shortest_window"],
      nextAction:
        "Replace the one-time valid branch with a loop over all valid contractions.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-010",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_longest_and_shortest_shrink_objectives",
    secondarySkillAtomIds: [
      "restore_validity_for_longest",
      "exploit_validity_for_shortest",
    ],
    type: "solution_comparison",
    prompt: `Compare two objectives:

A. Longest window satisfying an at-most constraint.
B. Shortest window satisfying an at-least or coverage constraint.

Which shrink behavior is correct?`,
    options: [
      {
        id: "longest_repairs_shortest_minimizes",
        text: "A shrinks while invalid and records after validity is restored; B records and shrinks while valid.",
        isCorrect: true,
      },
      {
        id: "both_shrink_while_invalid",
        text: "Both shrink only while invalid and record after repair.",
        isCorrect: false,
      },
      {
        id: "both_shrink_while_valid",
        text: "Both shrink while valid because every objective prefers smaller windows.",
        isCorrect: false,
      },
      {
        id: "longest_shrinks_while_valid",
        text: "A should minimize every valid window before recording, while B should preserve the widest valid window.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The maximizing problem repairs illegal expansion; the minimizing problem exploits legal contraction.",
      mentalModelCorrection:
        "The direction of the optimization determines whether validity triggers recording or invalidity triggers repair.",
      mistakeTypes: ["longest_and_shortest_shrink_rules_reused"],
      nextAction:
        "State whether shrinking is repairing the candidate or optimizing an already valid candidate.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-011",
    learningStage: "foundations",
    primarySkillAtomId: "update_incoming_state_before_validity_check",
    secondarySkillAtomIds: [
      "synchronize_right_boundary_and_state",
      "avoid_stale_window_validity",
    ],
    type: "mistake_review",
    prompt: `An iteration moves right to a new element and immediately checks isValid().

Only after that check does it add values[right] to the maintained sum or frequency state.

What is wrong?`,
    options: [
      {
        id: "state_excludes_new_right_value",
        text: "The boundaries include the incoming element, but the state still describes the previous window, so the validity result is stale.",
        isCorrect: true,
      },
      {
        id: "right_must_never_move_first",
        text: "right may move only after left has moved during the same iteration.",
        isCorrect: false,
      },
      {
        id: "validity_never_uses_state",
        text: "A validity check should depend only on pointer names, not maintained state.",
        isCorrect: false,
      },
      {
        id: "incoming_values_are_ignored",
        text: "Incoming values should never be added to a sliding-window state.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The interval and state refer to different candidate memberships.",
      mentalModelCorrection:
        "Add the incoming contribution before evaluating the expanded window.",
      mistakeTypes: ["validity_checked_before_incoming_state_update"],
      nextAction:
        "Synchronize state with the new right boundary before checking the constraint.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-012",
    learningStage: "foundations",
    primarySkillAtomId: "remove_outgoing_state_before_advancing_left",
    secondarySkillAtomIds: [
      "synchronize_left_boundary_and_state",
      "avoid_removing_wrong_window_element",
    ],
    type: "mistake_review",
    prompt: `A shrink step does this:

left++;
remove(values[left]);

Which element is incorrectly removed from the maintained state?`,
    options: [
      {
        id: "new_left_instead_of_outgoing",
        text: "It removes the new left element rather than the element that actually left the window.",
        isCorrect: true,
      },
      {
        id: "right_element",
        text: "It necessarily removes values[right].",
        isCorrect: false,
      },
      {
        id: "no_element",
        text: "Incrementing left clears the outgoing contribution automatically.",
        isCorrect: false,
      },
      {
        id: "all_elements",
        text: "It removes every value between left and right.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The outgoing element is located at the old left boundary.",
      mentalModelCorrection:
        "Remove values[left] from state before incrementing left, unless the old index was saved separately.",
      mistakeTypes: ["wrong_outgoing_element_removed"],
      nextAction:
        "Tie the state removal to the boundary position that is leaving the interval.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-013",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_complete_window_validity_state",
    secondarySkillAtomIds: [
      "synchronize_required_and_formed_state",
      "avoid_premature_covering_window_validity",
    ],
    type: "mistake_review",
    prompt: `A minimum-covering-window algorithm marks the window valid as soon as every required key appears at least once.

Some required keys need multiple occurrences.

What state is incomplete?`,
    options: [
      {
        id: "required_multiplicities_not_satisfied",
        text: "Presence alone does not prove coverage; the algorithm must know whether each required key has reached its required frequency.",
        isCorrect: true,
      },
      {
        id: "window_length_missing",
        text: "Validity depends only on whether the current window is longer than the target string.",
        isCorrect: false,
      },
      {
        id: "right_boundary_missing",
        text: "The algorithm needs a second right boundary.",
        isCorrect: false,
      },
      {
        id: "all_global_counts_required",
        text: "The algorithm should use counts from the entire input instead of the current window.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A key can be present while still occurring fewer times than required.",
      mentalModelCorrection:
        "Answer timing is correct only when the validity state models the complete output constraint.",
      mistakeTypes: ["covering_window_validity_uses_incomplete_state"],
      nextAction:
        "Track when each required key crosses into and out of its satisfied-frequency state.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-014",
    learningStage: "foundations",
    primarySkillAtomId: "trace_shortest_sum_answer_timing",
    secondarySkillAtomIds: [
      "record_each_valid_contraction",
      "find_minimum_nonnegative_sum_window",
    ],
    type: "edge_case_drill",
    prompt: `Find the shortest contiguous subarray with sum at least 7:

values = [2, 3, 1, 2, 4, 3]

When right reaches the final 3, the current valid window can be repeatedly shrunk.

Which minimum should eventually be recorded?`,
    options: [
      {
        id: "length_two_four_three",
        text: "Length 2 for [4, 3].",
        isCorrect: true,
      },
      {
        id: "length_six",
        text: "Length 6 because the full array is the first interval considered.",
        isCorrect: false,
      },
      {
        id: "length_three",
        text: "Length 3 because only one left movement may occur for each right position.",
        isCorrect: false,
      },
      {
        id: "length_one",
        text: "Length 1 because the final value 3 is positive.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Several valid windows may end at the same right boundary, and each contraction must be evaluated.",
      mentalModelCorrection:
        "The shortest candidate is often found only after multiple valid shrink steps for one expansion.",
      mistakeTypes: ["shortest_sum_window_stops_shrinking_too_early"],
      nextAction:
        "Record the length before every shrink while the sum remains at least the target.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-window-validity-answer-timing-015",
    learningStage: "foundations",
    primarySkillAtomId: "compute_inclusive_window_length",
    secondarySkillAtomIds: [
      "align_answer_with_boundary_convention",
      "avoid_window_length_off_by_one",
    ],
    type: "single_choice",
    prompt:
      "A sliding window uses inclusive boundaries left and right. What length should be recorded for the current interval?",
    options: [
      {
        id: "right_minus_left_plus_one",
        text: "right - left + 1",
        isCorrect: true,
      },
      {
        id: "right_minus_left",
        text: "right - left",
        isCorrect: false,
      },
      {
        id: "left_minus_right_plus_one",
        text: "left - right + 1",
        isCorrect: false,
      },
      {
        id: "right_plus_left",
        text: "right + left",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "Both endpoint indexes belong to an inclusive interval.",
      mentalModelCorrection:
        "Correct answer timing can still produce a wrong result when the recorded boundary representation uses the wrong length formula.",
      mistakeTypes: ["inclusive_window_length_off_by_one"],
      nextAction: "Enumerate the indexes in a small interval such as [2, 4].",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-016",
    learningStage: "foundations",
    primarySkillAtomId: "recompute_validity_after_state_mutation",
    secondarySkillAtomIds: [
      "avoid_stale_validity_flag",
      "synchronize_shrink_loop_condition",
    ],
    type: "mistake_review",
    prompt: `A covering-window implementation computes:

const valid = formed === required;

and then enters:

while (valid) {
  remove(values[left]);
  left++;
}

Why is this dangerous?`,
    options: [
      {
        id: "valid_flag_never_changes",
        text: "The stored boolean does not reflect state mutations inside the loop, so the loop may continue after the window becomes invalid.",
        isCorrect: true,
      },
      {
        id: "boolean_cannot_control_loop",
        text: "A while loop may never use a boolean condition.",
        isCorrect: false,
      },
      {
        id: "formed_never_changes",
        text: "Removing elements can never change formed.",
        isCorrect: false,
      },
      {
        id: "required_must_decrease",
        text: "required should be decremented after every left movement.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The state determining validity can change during every shrink step.",
      mentalModelCorrection:
        "The loop condition must be derived from current synchronized state, not a stale pre-loop snapshot.",
      mistakeTypes: ["stale_validity_boolean_controls_shrinking"],
      nextAction:
        "Check the live validity expression after every outgoing-state update.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-017",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_over_shrinking_longest_valid_window",
    secondarySkillAtomIds: [
      "preserve_widest_valid_candidate",
      "distinguish_repair_from_minimization",
    ],
    type: "mistake_review",
    prompt: `The task is to find the longest window satisfying an at-most constraint.

After restoring validity, the implementation continues shrinking while the window remains valid in order to make it "as tight as possible."

What is wrong with that objective?`,
    options: [
      {
        id: "discarding_longer_valid_candidates",
        text: "It discards valid width even though the objective is to maximize length; shrinking should stop once validity is restored.",
        isCorrect: true,
      },
      {
        id: "valid_windows_must_be_minimal",
        text: "Every valid window must be minimized before it can update a maximum.",
        isCorrect: false,
      },
      {
        id: "left_must_never_move",
        text: "Longest-window algorithms are never allowed to move left.",
        isCorrect: false,
      },
      {
        id: "right_should_shrink",
        text: "The correction is to decrement right while the window remains valid.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current valid interval is itself a candidate for the maximum.",
      mentalModelCorrection:
        "For longest at-most problems, shrink repairs invalidity rather than minimizes a valid window.",
      mistakeTypes: ["longest_window_uses_shortest_window_shrink_objective"],
      nextAction:
        "Stop contraction at the first valid left boundary for the current right position.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-window-validity-answer-timing-018",
    learningStage: "foundations",
    primarySkillAtomId: "review_complete_window_validity_and_answer_timing",
    secondarySkillAtomIds: [
      "connect_state_validity_and_answer_update",
      "choose_objective_aligned_shrink_loop",
    ],
    type: "invariant_identification",
    prompt:
      "Which statement most completely explains validity and answer timing in a variable-size sliding window?",
    options: [
      {
        id: "state_matches_window_and_timing_matches_objective",
        text: "State must exactly represent [left, right]; incoming and outgoing updates must precede validity decisions that depend on them; longest valid windows are recorded after invalidity is repaired, while shortest valid windows are recorded during every valid contraction before validity is lost.",
        isCorrect: true,
      },
      {
        id: "record_every_expansion",
        text: "Every expanded interval should update both the longest and shortest answers before any state checks.",
        isCorrect: false,
      },
      {
        id: "one_shrink_per_expansion",
        text: "At most one left movement is needed after each right movement, regardless of the constraint.",
        isCorrect: false,
      },
      {
        id: "boundaries_alone_prove_validity",
        text: "If left and right remain inside the input, the current interval is automatically a valid answer.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Correctness requires synchronized state, a live validity predicate, complete restoration or contraction, and objective-specific answer placement.",
      mentalModelCorrection:
        "Sliding-window answer updates are consequences of the invariant and optimization contract, not a fixed line that can be reused in every template.",
      mistakeTypes: ["window_validity_and_answer_timing_reasoning_incomplete"],
      nextAction:
        "For each algorithm, mark when state becomes current, when validity is guaranteed, and which valid candidates the objective requires recording.",
      result: "diagnostic",
    },
  },
];
