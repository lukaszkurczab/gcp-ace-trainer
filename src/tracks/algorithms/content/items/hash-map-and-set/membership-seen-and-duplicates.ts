export const membershipSeenAndDuplicatesQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-001",
    learningStage: "foundations",
    primarySkillAtomId: "state_seen_set_prefix_invariant",
    secondarySkillAtomIds: [
      "interpret_seen_before_state",
      "distinguish_current_from_processed_values",
    ],
    type: "single_choice",
    prompt: `A duplicate-detection scan is about to process values[i].

What should the Set named seen contain at that moment?`,
    options: [
      {
        id: "values_before_i",
        text: "Exactly the distinct values from indexes 0 through i - 1.",
        isCorrect: true,
      },
      {
        id: "values_through_i",
        text: "The distinct values from indexes 0 through i, including the current value.",
        isCorrect: false,
      },
      {
        id: "future_values",
        text: "The distinct values from the unprocessed suffix beginning at i.",
        isCorrect: false,
      },
      {
        id: "duplicates_only",
        text: "Only values already confirmed to occur more than once.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The membership test asks whether the current value occurred at an earlier index.",
      mentalModelCorrection:
        "Before the lookup, seen represents the processed prefix and excludes the current observation.",
      mistakeTypes: ["seen_set_prefix_invariant_mismatch"],
      nextAction:
        "Describe seen using an explicit index range before reviewing the update order.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-002",
    learningStage: "foundations",
    primarySkillAtomId: "order_duplicate_lookup_before_add",
    secondarySkillAtomIds: [
      "check_seen_before_state",
      "avoid_current_value_self_match",
    ],
    type: "subgoal_ordering",
    prompt:
      "Which sequence correctly processes one value when detecting whether any duplicate exists?",
    options: [
      {
        id: "check_return_or_add",
        text: "Check seen.has(value); return true if present; otherwise add value and continue.",
        isCorrect: true,
      },
      {
        id: "add_then_check",
        text: "Add value first, then check seen.has(value).",
        isCorrect: false,
      },
      {
        id: "clear_check_add",
        text: "Clear seen, check membership, then add value.",
        isCorrect: false,
      },
      {
        id: "add_delete_check",
        text: "Add value, immediately delete it, then check membership.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The lookup must ask whether an earlier occurrence exists before the current occurrence enters the state.",
      mentalModelCorrection:
        "Lookup-before-add preserves the distinction between prior membership and the current observation.",
      mistakeTypes: ["duplicate_detection_order_mismatch"],
      nextAction:
        "Keep the current value outside seen until its seen-before test is complete.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-003",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_add_before_duplicate_check",
    secondarySkillAtomIds: [
      "avoid_current_value_self_match",
      "review_set_membership_order",
    ],
    type: "mistake_review",
    prompt: `Review this code:

const seen = new Set<number>();

for (const value of values) {
  seen.add(value);

  if (seen.has(value)) {
    return true;
  }
}

What is the main bug?`,
    options: [
      {
        id: "every_current_value_is_present",
        text: "Every value is present immediately after being added, so the function returns true on the first iteration.",
        isCorrect: true,
      },
      {
        id: "set_cannot_detect_duplicates",
        text: "A Set cannot be used for duplicate detection.",
        isCorrect: false,
      },
      {
        id: "has_removes_the_value",
        text: "seen.has(value) removes the value before the next iteration.",
        isCorrect: false,
      },
      {
        id: "add_must_happen_twice",
        text: "Each value must be added twice before membership can be checked.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The mutation makes the lookup trivially true for the current value.",
      mentalModelCorrection:
        "The question is whether the value was already present, not whether it is present after insertion.",
      mistakeTypes: ["set_add_before_has"],
      nextAction: "Move the membership check before the insertion.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-004",
    learningStage: "foundations",
    primarySkillAtomId: "trace_seen_set_duplicate_detection",
    secondarySkillAtomIds: [
      "maintain_processed_prefix_set",
      "detect_seen_before_value",
    ],
    type: "single_choice",
    prompt: `Trace lookup-before-add duplicate detection:

values = [2, 1, 2]

What happens when the final 2 is processed?`,
    options: [
      {
        id: "two_already_present",
        text: "seen contains {2, 1}, so membership succeeds and the algorithm reports a duplicate.",
        isCorrect: true,
      },
      {
        id: "seen_contains_only_one",
        text: "seen contains only {1}, because the earlier 2 was removed automatically.",
        isCorrect: false,
      },
      {
        id: "final_two_added_first",
        text: "The final 2 is added first and then treated as its own earlier occurrence.",
        isCorrect: false,
      },
      {
        id: "non_adjacent_not_detected",
        text: "No duplicate is found because equal values must be adjacent.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The Set retains distinct values from the entire processed prefix, not only the previous position.",
      mentalModelCorrection:
        "Seen-before membership detects duplicates separated by any number of intervening values.",
      mistakeTypes: ["non_adjacent_duplicate_trace_mismatch"],
      nextAction: "Write the Set contents before each membership check.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-005",
    learningStage: "foundations",
    primarySkillAtomId: "trace_unique_seen_set_state",
    secondarySkillAtomIds: [
      "maintain_processed_prefix_set",
      "recognize_no_duplicate_result",
    ],
    type: "single_choice",
    prompt: `A duplicate detector processes:

values = [4, 1, 3]

No early return occurs. What does seen contain after the complete scan?`,
    options: [
      {
        id: "four_one_three",
        text: "{4, 1, 3}",
        isCorrect: true,
      },
      {
        id: "three_only",
        text: "{3}, because only the latest observation remains relevant.",
        isCorrect: false,
      },
      {
        id: "empty",
        text: "An empty Set, because all values were unique.",
        isCorrect: false,
      },
      {
        id: "duplicates_only",
        text: "Only values that occurred at least twice, so no entries.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every unique processed value is added and no operation removes it.",
      mentalModelCorrection:
        "seen represents distinct values from the processed prefix, not a collection of confirmed duplicates.",
      mistakeTypes: ["seen_set_final_state_mismatch"],
      nextAction:
        "Apply one membership check and one insertion for every first occurrence.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-006",
    learningStage: "foundations",
    primarySkillAtomId: "handle_empty_duplicate_input",
    secondarySkillAtomIds: [
      "initialize_empty_seen_set",
      "reason_about_duplicate_edge_cases",
    ],
    type: "edge_case_drill",
    prompt: "What should duplicate detection return for an empty array?",
    options: [
      {
        id: "false",
        text: "false, because no value occurs more than once.",
        isCorrect: true,
      },
      {
        id: "true",
        text: "true, because the empty state is encountered repeatedly.",
        isCorrect: false,
      },
      {
        id: "depends_on_set",
        text: "It depends on whether the Set was initialized before the loop.",
        isCorrect: false,
      },
      {
        id: "one_duplicate",
        text: "true, because an empty array contains one implicit empty value.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "No observation is processed and no membership check succeeds.",
      mentalModelCorrection:
        "An empty collection contains no pair of equal occurrences.",
      mistakeTypes: ["empty_duplicate_input_mismatch"],
      nextAction:
        "Apply the duplicate definition directly: at least two indexes must hold equal values.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-007",
    learningStage: "foundations",
    primarySkillAtomId: "handle_single_value_duplicate_input",
    secondarySkillAtomIds: [
      "avoid_single_value_self_duplicate",
      "reason_about_duplicate_edge_cases",
    ],
    type: "edge_case_drill",
    prompt: `What should duplicate detection return for:

values = [9]`,
    options: [
      {
        id: "false",
        text: "false, because one occurrence cannot be a duplicate of itself.",
        isCorrect: true,
      },
      {
        id: "true_after_add",
        text: "true, because 9 is present in seen after it is added.",
        isCorrect: false,
      },
      {
        id: "true_positive_number",
        text: "true, because every positive number is considered previously seen.",
        isCorrect: false,
      },
      {
        id: "depends_on_value",
        text: "It depends on whether the value is zero or nonzero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "A duplicate requires two distinct occurrences.",
      mentalModelCorrection:
        "Membership after insertion is not evidence of an earlier matching index.",
      mistakeTypes: ["single_value_treated_as_duplicate"],
      nextAction:
        "Check membership while seen still represents only earlier observations.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-008",
    learningStage: "foundations",
    primarySkillAtomId: "handle_zero_duplicate_values",
    secondarySkillAtomIds: [
      "detect_seen_before_value",
      "avoid_truthiness_membership_logic",
    ],
    type: "edge_case_drill",
    prompt: `A correct Set-based scan processes:

values = [0, 5, 0]

What result should it produce?`,
    options: [
      {
        id: "true",
        text: "true, because the final 0 is already a member of seen.",
        isCorrect: true,
      },
      {
        id: "false_zero_falsy",
        text: "false, because zero is falsy and therefore cannot be stored reliably.",
        isCorrect: false,
      },
      {
        id: "false_not_adjacent",
        text: "false, because the two zero values are not adjacent.",
        isCorrect: false,
      },
      {
        id: "true_because_five",
        text: "true only because 5 lies between the two zero values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "Set membership is not based on JavaScript truthiness.",
      mentalModelCorrection:
        "Zero is a normal Set key and can be detected as a previously seen value.",
      mistakeTypes: ["zero_membership_confused_with_truthiness"],
      nextAction: "Use seen.has(value) rather than truthiness-based checks.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-membership-seen-duplicates-009",
    learningStage: "foundations",
    primarySkillAtomId: "handle_nan_set_membership",
    secondarySkillAtomIds: [
      "understand_same_value_zero_set_equality",
      "reason_about_javascript_set_edge_cases",
    ],
    type: "edge_case_drill",
    prompt: `In JavaScript, what should a Set-based duplicate detector return for:

values = [NaN, 2, NaN]`,
    options: [
      {
        id: "true_same_value_zero",
        text: "true, because Set uses SameValueZero equality, under which NaN matches NaN.",
        isCorrect: true,
      },
      {
        id: "false_nan_not_equal",
        text: "false, because NaN !== NaN under the === operator.",
        isCorrect: false,
      },
      {
        id: "throws",
        text: "It throws because NaN cannot be inserted into a Set.",
        isCorrect: false,
      },
      {
        id: "depends_on_position",
        text: "It returns true only when the two NaN values are adjacent.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "JavaScript Set membership uses SameValueZero rather than ===.",
      mentalModelCorrection:
        "NaN values are treated as the same Set member even though direct strict equality between them is false.",
      mistakeTypes: ["nan_set_equality_mismatch"],
      nextAction:
        "Use the collection's actual equality semantics when reasoning about membership edge cases.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-010",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_seen_set_reset_inside_loop",
    secondarySkillAtomIds: [
      "preserve_processed_prefix_state",
      "detect_unintended_state_reset",
    ],
    type: "mistake_review",
    prompt: `Review this code:

for (const value of values) {
  const seen = new Set<number>();

  if (seen.has(value)) {
    return true;
  }

  seen.add(value);
}

Why does it fail to detect duplicates?`,
    options: [
      {
        id: "set_recreated_each_iteration",
        text: "A new empty Set is created for every observation, so no earlier value survives into the next iteration.",
        isCorrect: true,
      },
      {
        id: "set_must_be_array",
        text: "The state fails because duplicate detection requires an array rather than a Set.",
        isCorrect: false,
      },
      {
        id: "has_before_add",
        text: "The only problem is that has is called before add.",
        isCorrect: false,
      },
      {
        id: "loop_forbidden",
        text: "A Set cannot be used inside a for-of loop.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The state lifetime covers only one iteration instead of the complete processed prefix.",
      mentalModelCorrection:
        "Seen-before state must persist across observations to represent earlier values.",
      mistakeTypes: ["seen_set_reinitialized_per_iteration"],
      nextAction: "Create the Set once before the scan begins.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-011",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_seen_value_deletion",
    secondarySkillAtomIds: [
      "preserve_processed_prefix_state",
      "detect_non_adjacent_duplicates",
    ],
    type: "mistake_review",
    prompt: `A duplicate detector performs:

for (const value of values) {
  if (seen.has(value)) {
    return true;
  }

  seen.add(value);
  seen.delete(value);
}

What behavior does this create?`,
    options: [
      {
        id: "forgets_every_observation",
        text: "It forgets each value immediately, so later occurrences cannot be recognized as seen before.",
        isCorrect: true,
      },
      {
        id: "correct_memory_cleanup",
        text: "It correctly reduces memory while preserving duplicate detection.",
        isCorrect: false,
      },
      {
        id: "detects_only_nonadjacent",
        text: "It detects non-adjacent duplicates but not adjacent duplicates.",
        isCorrect: false,
      },
      {
        id: "delete_marks_duplicate",
        text: "Deleting a value marks it as duplicated inside the Set.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The Set no longer retains the processed prefix's values after each iteration.",
      mentalModelCorrection:
        "For global duplicate detection, earlier membership remains relevant until the scan ends.",
      mistakeTypes: ["seen_value_deleted_too_early"],
      nextAction:
        "Remove deletion unless the problem explicitly uses a bounded active region rather than the complete prefix.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-012",
    learningStage: "foundations",
    primarySkillAtomId: "count_distinct_values_with_set",
    secondarySkillAtomIds: [
      "interpret_set_size",
      "distinguish_occurrences_from_distinct_values",
    ],
    type: "single_choice",
    prompt: `After processing:

values = [3, 1, 3, 2, 1]

What does new Set(values).size equal?`,
    options: [
      {
        id: "three",
        text: "3, because the distinct values are 3, 1, and 2.",
        isCorrect: true,
      },
      {
        id: "five",
        text: "5, because five observations were processed.",
        isCorrect: false,
      },
      {
        id: "two",
        text: "2, because two values occur more than once.",
        isCorrect: false,
      },
      {
        id: "one",
        text: "1, because only one Set object is created.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Set size counts unique keys, not observations or duplicate groups.",
      mentalModelCorrection:
        "Repeated insertions of an existing member do not increase Set size.",
      mistakeTypes: ["set_size_semantics_mismatch"],
      nextAction:
        "Enumerate the distinct values before calculating the Set size.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-013",
    learningStage: "foundations",
    primarySkillAtomId: "use_seen_set_for_stable_deduplication",
    secondarySkillAtomIds: [
      "emit_first_occurrence_only",
      "preserve_input_order",
    ],
    type: "single_choice",
    prompt: `A left-to-right scan emits a value only when it is not already in seen.

For:

values = [2, 1, 2, 3, 1]

What output is produced?`,
    options: [
      {
        id: "two_one_three",
        text: "[2, 1, 3]",
        isCorrect: true,
      },
      {
        id: "one_two_three",
        text: "[1, 2, 3]",
        isCorrect: false,
      },
      {
        id: "two_two_one_one",
        text: "[2, 2, 1, 1]",
        isCorrect: false,
      },
      {
        id: "three_only",
        text: "[3]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The first occurrence is emitted and recorded; later occurrences are skipped.",
      mentalModelCorrection:
        "Seen-state deduplication can preserve first-occurrence order without sorting.",
      mistakeTypes: ["stable_deduplication_trace_mismatch"],
      nextAction: "Append a value only on its first failed membership check.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-membership-seen-duplicates-014",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_global_from_adjacent_duplicate_detection",
    secondarySkillAtomIds: [
      "recognize_seen_set_requirement",
      "detect_non_adjacent_duplicates",
    ],
    type: "solution_comparison",
    prompt: `Two solutions check for duplicates:

A. Compare each value only with the immediately previous value.

B. Check each value against a Set of all values from the processed prefix.

Which review is correct for an unsorted array?`,
    options: [
      {
        id: "only_set_detects_general_duplicates",
        text: "B detects both adjacent and non-adjacent duplicates; A can miss repeated values separated by other elements.",
        isCorrect: true,
      },
      {
        id: "both_equivalent",
        text: "Both are equivalent because duplicate values always occur next to each other.",
        isCorrect: false,
      },
      {
        id: "previous_only_stronger",
        text: "A is stronger because retaining older values can create false duplicate matches.",
        isCorrect: false,
      },
      {
        id: "set_only_adjacent",
        text: "B detects only adjacent duplicates because Set stores one most recent value.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "An unsorted input provides no guarantee that equal values are adjacent.",
      mentalModelCorrection:
        "Global seen-before state covers the entire processed prefix, while neighbor comparison remembers only one observation.",
      mistakeTypes: ["adjacent_comparison_used_for_global_duplicates"],
      nextAction:
        "Test the strategy on a duplicate separated by at least one different value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-membership-seen-duplicates-015",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_conditional_seen_set_reset",
    secondarySkillAtomIds: [
      "preserve_global_seen_state",
      "detect_unintended_state_reset",
    ],
    type: "mistake_review",
    prompt: `A scan clears seen whenever the current value differs from the previous value:

if (i > 0 && values[i] !== values[i - 1]) {
  seen.clear();
}

Why is this incorrect for detecting any duplicate in an unsorted array?`,
    options: [
      {
        id: "forgets_earlier_segments",
        text: "It forgets values from earlier parts of the array, so a later non-adjacent repetition may be missed.",
        isCorrect: true,
      },
      {
        id: "clear_does_not_remove_values",
        text: "Set.clear leaves all members in place, so the reset has no effect.",
        isCorrect: false,
      },
      {
        id: "different_values_are_duplicates",
        text: "The reset is wrong because two different adjacent values already constitute a duplicate.",
        isCorrect: false,
      },
      {
        id: "set_must_reset_on_every_change",
        text: "The reset is required because seen may only represent one run of equal values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The contract concerns repetition anywhere in the input, not only inside one consecutive run.",
      mentalModelCorrection:
        "A reset changes the represented region. Global duplicate detection requires the complete processed prefix to remain represented.",
      mistakeTypes: ["seen_set_cleared_between_value_runs"],
      nextAction:
        "Reset state only when the problem explicitly begins a new independent scope.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-membership-seen-duplicates-016",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_seen_set_iteration_invariant",
    secondarySkillAtomIds: [
      "prove_duplicate_detection_correctness",
      "state_processed_prefix_semantics",
    ],
    type: "single_choice",
    prompt: `Which invariant precisely describes a correct lookup-before-add duplicate scan after index i has been processed without returning true?`,
    options: [
      {
        id: "set_equals_distinct_processed_values",
        text: "seen contains exactly the distinct values from indexes 0 through i, and each of those values has occurred exactly once in that processed prefix.",
        isCorrect: true,
      },
      {
        id: "set_contains_duplicates_only",
        text: "seen contains exactly the values that have already occurred at least twice.",
        isCorrect: false,
      },
      {
        id: "set_contains_unprocessed_values",
        text: "seen contains exactly the values that will occur after index i.",
        isCorrect: false,
      },
      {
        id: "set_contains_current_only",
        text: "seen contains only values[i], because older values are no longer relevant.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every first occurrence is added, and any second occurrence would have caused an immediate return.",
      mentalModelCorrection:
        "When no duplicate has been found, the Set equals the processed prefix's distinct values and every represented value has appeared once so far.",
      mistakeTypes: ["seen_set_iteration_invariant_incomplete"],
      nextAction:
        "Connect the Set contents with both membership and occurrence multiplicity in the processed prefix.",
      result: "diagnostic",
    },
  },
];
