export const variableWindowMonotonicityAndShrinkQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-variable-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_variable_window_contract",
    secondarySkillAtomIds: [
      "contiguous_range_optimization",
      "window_validity_predicate",
    ],
    type: "single_choice",
    prompt:
      "You need the longest contiguous substring containing at most k distinct characters. Which high-level strategy best matches the contract?",
    options: [
      {
        id: "variable_window",
        text: "Expand right, track character frequencies, and shrink left until the window contains at most k distinct characters again.",
      },
      {
        id: "fixed_window",
        text: "Choose one fixed window length before scanning and never change it.",
      },
      {
        id: "plain_prefix_sums",
        text: "Build one scalar prefix array and subtract two entries to identify the longest valid substring.",
      },
      {
        id: "reset_on_violation",
        text: "Clear all state and restart after every character that causes more than k distinct values.",
      },
    ],
    correctOptionId: "variable_window",
    feedbackModel: {
      decisionSignal:
        "The task asks for the longest contiguous range satisfying a removable validity constraint.",
      mentalModelCorrection:
        "A variable window can preserve useful overlap while adjusting its left boundary until the active range becomes valid.",
      mistakeTypes: ["strategy_mismatch"],
      nextAction:
        "Define the validity predicate and determine whether removing leftmost elements can restore it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-variable-002",
    learningStage: "foundations",
    primarySkillAtomId: "validate_variable_window_monotonicity",
    secondarySkillAtomIds: [
      "removable_constraint",
      "safe_left_boundary_progress",
    ],
    type: "single_choice",
    prompt:
      "Which property is essential for a standard variable-size sliding window?",
    options: [
      {
        id: "predictable_validity_change",
        text: "Window validity must change predictably enough that moving left can safely restore the constraint without revisiting discarded starts.",
      },
      {
        id: "sorted_input",
        text: "The input must always be sorted.",
      },
      {
        id: "constant_window_length",
        text: "Every valid candidate must have the same length.",
      },
      {
        id: "scalar_sum_only",
        text: "The complete window state must fit in one numeric variable.",
      },
    ],
    correctOptionId: "predictable_validity_change",
    feedbackModel: {
      decisionSignal:
        "The algorithm permanently discards earlier left boundaries.",
      mentalModelCorrection:
        "Sliding window is legal only when the invariant explains why a discarded boundary never needs to return.",
      mistakeTypes: ["missing_window_precondition"],
      nextAction:
        "State what expansion can violate and why repeated removal from the left can restore validity.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-variable-003",
    learningStage: "foundations",
    primarySkillAtomId: "shrink_until_window_valid",
    secondarySkillAtomIds: ["variable_window_repair", "while_not_if_shrink"],
    type: "single_choice",
    prompt:
      "After adding a new value, a window violates the constraint by more than one outgoing element can repair. Which control flow is required?",
    options: [
      {
        id: "while_invalid",
        text: "Keep moving left and updating state while the window remains invalid.",
      },
      {
        id: "single_if",
        text: "Move left exactly once and continue even if the window is still invalid.",
      },
      {
        id: "reset_window",
        text: "Discard the entire window and restart from the current right boundary.",
      },
      {
        id: "record_invalid",
        text: "Record the current range before attempting to restore validity.",
      },
    ],
    correctOptionId: "while_invalid",
    feedbackModel: {
      decisionSignal:
        "One right-boundary expansion may require removing multiple leftmost contributions.",
      mentalModelCorrection:
        "The invariant must hold before the algorithm treats the current range as a valid candidate.",
      mistakeTypes: ["insufficient_shrink"],
      nextAction:
        "Use a loop whenever one boundary move may not fully restore the constraint.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-variable-004",
    learningStage: "foundations",
    primarySkillAtomId: "record_longest_valid_window",
    secondarySkillAtomIds: [
      "candidate_recording_order",
      "window_validity_restoration",
    ],
    type: "single_choice",
    prompt:
      "For a longest-valid-window problem, when should the current length be compared with the best length?",
    options: [
      {
        id: "after_restoring_validity",
        text: "After the shrink loop has restored the validity invariant.",
      },
      {
        id: "immediately_after_expand",
        text: "Immediately after adding the rightmost value, even if the window is invalid.",
      },
      {
        id: "before_adding_right",
        text: "Before the new rightmost value is included.",
      },
      {
        id: "only_at_end",
        text: "Only once after the full scan, using the final window.",
      },
    ],
    correctOptionId: "after_restoring_validity",
    feedbackModel: {
      decisionSignal:
        "Only valid windows are eligible for the longest-valid result.",
      mentalModelCorrection:
        "Recording before repair can preserve a longer but illegal range.",
      mistakeTypes: ["recorded_invalid_candidate"],
      nextAction:
        "Place candidate evaluation after the invariant-restoration phase.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-variable-005",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_window_state_during_shrink",
    secondarySkillAtomIds: ["incremental_state_update", "avoid_full_reset"],
    type: "single_choice",
    prompt:
      "A frequency-based window becomes invalid after adding one character. Why is incrementally removing characters from the left usually better than clearing the entire window?",
    options: [
      {
        id: "preserves_overlap",
        text: "It preserves the valid suffix information shared with future candidate windows.",
      },
      {
        id: "reset_changes_input",
        text: "Clearing the window would mutate the original string.",
      },
      {
        id: "frequencies_cannot_reset",
        text: "A frequency structure cannot be cleared.",
      },
      {
        id: "left_must_stay_zero",
        text: "The left boundary is required to remain at index zero.",
      },
    ],
    correctOptionId: "preserves_overlap",
    feedbackModel: {
      decisionSignal:
        "Future candidates overlap heavily with the current range.",
      mentalModelCorrection:
        "Sliding window gains efficiency by retaining all still-relevant contributions instead of rebuilding state from scratch.",
      mistakeTypes: ["unnecessary_window_reset"],
      nextAction:
        "Remove only the contributions that must expire to restore validity.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-006",
    learningStage: "foundations",
    primarySkillAtomId: "order_variable_window_subgoals",
    secondarySkillAtomIds: [
      "window_update_order",
      "candidate_evaluation_order",
    ],
    type: "subgoal_ordering",
    prompt:
      "Order the steps for a longest-valid variable sliding-window iteration after choosing the next right boundary.",
    subgoals: [
      {
        id: "include_right",
        text: "Add the new rightmost element to the maintained window state.",
      },
      {
        id: "repair_window",
        text: "While the validity constraint is violated, remove the leftmost contribution and advance left.",
      },
      {
        id: "record_candidate",
        text: "Compare the restored valid window with the best result.",
      },
    ],
    correctOrder: ["include_right", "repair_window", "record_candidate"],
    feedbackModel: {
      decisionSignal:
        "The new element may invalidate the current range, so candidate evaluation must follow repair.",
      mentalModelCorrection:
        "The standard iteration is expand, restore the invariant, then evaluate the valid candidate.",
      mistakeTypes: ["implementation_order_mismatch"],
      nextAction:
        "Separate state mutation, invariant repair, and result recording into explicit phases.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-007",
    learningStage: "foundations",
    primarySkillAtomId: "trace_repeated_window_shrink",
    secondarySkillAtomIds: ["frequency_window_trace", "while_not_if_shrink"],
    type: "single_choice",
    prompt:
      "A window must contain at most two distinct characters. After adding the next character, it contains four distinct characters. What must happen before recording a candidate?",
    options: [
      {
        id: "shrink_until_two",
        text: "Advance left repeatedly, updating frequencies, until at most two distinct characters remain.",
      },
      {
        id: "shrink_once",
        text: "Remove exactly one character from the left, regardless of the remaining distinct count.",
      },
      {
        id: "record_four",
        text: "Record the current length because it is the largest window seen so far.",
      },
      {
        id: "skip_right",
        text: "Ignore the newly added character without changing the window boundaries.",
      },
    ],
    correctOptionId: "shrink_until_two",
    feedbackModel: {
      decisionSignal:
        "The violation amount can require several expirations before the invariant is restored.",
      mentalModelCorrection:
        "One left move is not a complete repair rule. The algorithm must test validity again after every removal.",
      mistakeTypes: ["insufficient_shrink"],
      nextAction:
        "Continue shrinking until the predicate itself becomes true, not for a fixed number of steps.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-008",
    learningStage: "foundations",
    primarySkillAtomId: "define_variable_window_invariant",
    secondarySkillAtomIds: [
      "processed_prefix_reasoning",
      "active_window_contract",
    ],
    type: "single_choice",
    prompt:
      "For the longest substring with at most k distinct characters, which invariant should hold when the best answer is updated?",
    options: [
      {
        id: "active_window_valid",
        text: "The frequency state exactly describes the range [left, right], and that range contains at most k distinct characters.",
      },
      {
        id: "prefix_all_valid",
        text: "Every substring ending before right must still be stored.",
      },
      {
        id: "window_always_longest",
        text: "The current window must already be the globally longest answer.",
      },
      {
        id: "left_zero",
        text: "The left boundary must still equal zero.",
      },
    ],
    correctOptionId: "active_window_valid",
    feedbackModel: {
      decisionSignal:
        "Candidate evaluation relies on both accurate state and a satisfied validity predicate.",
      mentalModelCorrection:
        "The window need not already be globally optimal; it only needs to be a correctly represented valid candidate.",
      mistakeTypes: ["invalid_window_invariant"],
      nextAction:
        "Define what the maintained state represents and which predicate must hold before result updates.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-009",
    learningStage: "foundations",
    primarySkillAtomId: "justify_discarded_left_boundaries",
    secondarySkillAtomIds: [
      "safe_candidate_elimination",
      "monotonic_left_progress",
    ],
    type: "single_choice",
    prompt:
      "Why can a valid variable sliding-window algorithm permanently advance left instead of reconsidering an earlier left boundary later?",
    options: [
      {
        id: "earlier_start_cannot_help",
        text: "The proof shows that keeping the discarded prefix cannot restore the required validity for the current or later right boundary under the same constraint.",
      },
      {
        id: "left_values_are_small",
        text: "Values near the left side are always less useful than later values.",
      },
      {
        id: "arrays_are_contiguous",
        text: "Contiguous ranges never need earlier starting positions.",
      },
      {
        id: "prefixes_store_history",
        text: "A prefix array automatically remembers every discarded candidate.",
      },
    ],
    correctOptionId: "earlier_start_cannot_help",
    feedbackModel: {
      decisionSignal:
        "Advancing left eliminates candidate starts from all future consideration.",
      mentalModelCorrection:
        "That elimination is correct only when the validity structure proves the discarded contribution cannot become useful again.",
      mistakeTypes: ["unsupported_candidate_elimination"],
      nextAction:
        "Explain what future expansion can and cannot change about a discarded invalid prefix.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-010",
    learningStage: "foundations",
    primarySkillAtomId: "record_shortest_valid_window",
    secondarySkillAtomIds: ["shortest_window_objective", "shrink_while_valid"],
    type: "single_choice",
    prompt:
      "For a shortest contiguous range satisfying a monotonic at-least constraint over non-negative contributions, what should happen once the window becomes valid?",
    options: [
      {
        id: "record_then_shrink_while_valid",
        text: "Record the current length, then keep shrinking while the window remains valid to search for a shorter candidate.",
      },
      {
        id: "stop_shrinking",
        text: "Keep the first valid range ending at right and never move left again.",
      },
      {
        id: "expand_more",
        text: "Continue expanding right before recording any candidate.",
      },
      {
        id: "reset_all_state",
        text: "Discard the complete window and restart after right.",
      },
    ],
    correctOptionId: "record_then_shrink_while_valid",
    feedbackModel: {
      decisionSignal:
        "For a shortest-valid objective, a valid range may still contain removable leftmost elements.",
      mentalModelCorrection:
        "Longest-valid problems repair invalid windows; shortest-valid problems often exploit validity by shrinking as far as possible.",
      mistakeTypes: ["objective_update_mismatch"],
      nextAction:
        "Derive whether shrinking is used to restore validity or improve an already valid candidate.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-011",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_longest_and_shortest_window_updates",
    secondarySkillAtomIds: ["longest_valid_window", "shortest_valid_window"],
    type: "solution_comparison",
    prompt:
      "Which comparison between longest-valid and shortest-valid variable-window problems is most accurate?",
    options: [
      {
        id: "different_recording_logic",
        text: "Longest-valid usually records after invalidity has been repaired, while shortest-valid may record repeatedly while shrinking an already valid window.",
      },
      {
        id: "same_recording_logic",
        text: "Both objectives always record only once after the full scan.",
      },
      {
        id: "shortest_never_shrinks",
        text: "Shortest-valid problems never advance the left boundary.",
      },
      {
        id: "longest_resets",
        text: "Longest-valid problems must clear the entire window after every violation.",
      },
    ],
    correctOptionId: "different_recording_logic",
    feedbackModel: {
      decisionSignal:
        "The objective determines whether shrinking repairs an illegal range or improves a legal one.",
      mentalModelCorrection:
        "The same boundary mechanism can support different optimization contracts, but result-update timing changes.",
      mistakeTypes: ["objective_contract_mismatch"],
      nextAction:
        "Identify whether the algorithm wants the widest valid range or the narrowest valid range.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-012",
    learningStage: "foundations",
    primarySkillAtomId: "update_frequency_state_on_removal",
    secondarySkillAtomIds: [
      "distinct_count_tracking",
      "window_state_consistency",
    ],
    type: "single_choice",
    prompt:
      "A frequency-based window removes the leftmost character. Its count becomes zero. What update is required?",
    options: [
      {
        id: "remove_key_or_decrement_distinct",
        text: "Remove the zero-count entry or otherwise decrement the maintained distinct-character count.",
      },
      {
        id: "keep_distinct_unchanged",
        text: "Leave the distinct count unchanged because the character appeared earlier.",
      },
      {
        id: "clear_map",
        text: "Clear every frequency entry.",
      },
      {
        id: "move_right_back",
        text: "Move right backward to reprocess the removed character.",
      },
    ],
    correctOptionId: "remove_key_or_decrement_distinct",
    feedbackModel: {
      decisionSignal:
        "A value is distinct in the active window only while its active frequency is positive.",
      mentalModelCorrection:
        "State must reflect the current range, not the entire processed prefix.",
      mistakeTypes: ["stale_window_state"],
      nextAction:
        "Update derived validity counters whenever an element's active frequency crosses zero.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-variable-013",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_prefix_sum_range_selection_overclaim",
    secondarySkillAtomIds: [
      "range_evaluation_vs_selection",
      "variable_length_optimization",
    ],
    type: "single_choice",
    prompt:
      "A teammate proposes plain prefix sums for finding the longest variable-length range satisfying a constraint. What question must still be answered?",
    options: [
      {
        id: "how_boundaries_selected",
        text: "How the algorithm will efficiently select the correct pair of prefix boundaries among all possible ranges.",
      },
      {
        id: "whether_sum_exists",
        text: "Whether prefix sums can store any numeric values.",
      },
      {
        id: "whether_input_contiguous",
        text: "Whether an array is a contiguous data structure in memory.",
      },
      {
        id: "whether_right_moves",
        text: "Whether the right boundary variable has an integer type.",
      },
    ],
    correctOptionId: "how_boundaries_selected",
    feedbackModel: {
      decisionSignal:
        "Prefix subtraction evaluates a chosen range but does not automatically optimize over all boundary pairs.",
      mentalModelCorrection:
        "A representation of range values is not the same as a mechanism for selecting the optimal variable-length range.",
      mistakeTypes: ["incomplete_strategy_justification"],
      nextAction:
        "Separate computing one candidate's value from discovering which candidate should be used.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-variable-014",
    learningStage: "foundations",
    primarySkillAtomId: "review_variable_window_reset_bug",
    secondarySkillAtomIds: [
      "incremental_shrink",
      "overlapping_candidate_preservation",
    ],
    type: "solution_comparison",
    prompt:
      "A solution for the longest substring with at most k distinct characters clears all frequency state and sets left = right whenever the constraint is violated. What is the main flaw?",
    options: [
      {
        id: "discards_useful_suffix",
        text: "It discards a suffix of the current range that may already be a valid start for a longer future answer.",
      },
      {
        id: "right_cannot_equal_left",
        text: "A valid window may never contain only one character.",
      },
      {
        id: "frequency_maps_are_required",
        text: "A frequency map cannot be cleared in constant time.",
      },
      {
        id: "prefix_sums_needed",
        text: "Every longest-substring problem requires prefix sums instead.",
      },
    ],
    correctOptionId: "discards_useful_suffix",
    feedbackModel: {
      decisionSignal:
        "The violating range may contain a large valid suffix after only part of its left side is removed.",
      mentalModelCorrection:
        "Incremental shrink preserves maximal overlap. Full reset throws away candidates that have not been disproven.",
      mistakeTypes: ["premature_candidate_discard"],
      nextAction: "Remove only enough state to restore the invariant.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-variable-015",
    learningStage: "foundations",
    primarySkillAtomId: "verify_window_candidate_after_shrink",
    secondarySkillAtomIds: ["post_shrink_boundary_state", "valid_range_length"],
    type: "single_choice",
    prompt:
      "After the shrink loop ends, what range does right - left + 1 represent under inclusive boundaries?",
    options: [
      {
        id: "current_restored_window",
        text: "The length of the current window whose state has just been restored to validity.",
      },
      {
        id: "discarded_prefix",
        text: "The number of elements removed from the left.",
      },
      {
        id: "processed_prefix",
        text: "The number of all elements processed so far.",
      },
      {
        id: "future_window",
        text: "The length of the next window before its right element is added.",
      },
    ],
    correctOptionId: "current_restored_window",
    feedbackModel: {
      decisionSignal:
        "Both boundaries refer to the active inclusive range after all required removals.",
      mentalModelCorrection:
        "Candidate length must be computed from the final repaired boundaries, not from their pre-shrink positions.",
      mistakeTypes: ["boundary_length_mismatch"],
      nextAction:
        "Compute range length only after all boundary updates for the iteration are complete.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-variable-016",
    learningStage: "foundations",
    primarySkillAtomId: "prove_variable_window_linear_progress",
    secondarySkillAtomIds: [
      "monotonic_boundary_movement",
      "amortized_window_analysis",
    ],
    type: "single_choice",
    prompt:
      "Why does repeatedly shrinking inside an outer right-boundary loop not automatically make a valid variable sliding-window algorithm quadratic?",
    options: [
      {
        id: "both_boundaries_monotonic",
        text: "Each boundary moves only forward and therefore advances at most n times across the entire scan.",
      },
      {
        id: "while_runs_once",
        text: "The shrink loop is guaranteed to execute at most once per right boundary.",
      },
      {
        id: "frequency_map_constant",
        text: "Using a frequency map makes every nested loop linear.",
      },
      {
        id: "all_nested_loops_linear",
        text: "Any nested loops with different variables are O(n).",
      },
    ],
    correctOptionId: "both_boundaries_monotonic",
    feedbackModel: {
      decisionSignal:
        "Complexity depends on total movement across all iterations.",
      mentalModelCorrection:
        "Left may move many times during one iteration, but it never returns to earlier positions.",
      mistakeTypes: ["unsupported_complexity_claim"],
      nextAction:
        "Bound the lifetime movement of each pointer instead of multiplying loop appearances.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-variable-017",
    learningStage: "foundations",
    primarySkillAtomId: "reject_non_monotonic_shrink_rule",
    secondarySkillAtomIds: [
      "window_precondition_validation",
      "safe_boundary_elimination",
    ],
    type: "solution_comparison",
    prompt:
      "A proposed variable-window solution moves left whenever the current range violates a condition, but the author cannot explain why removing the leftmost element moves the condition toward validity. Which review is correct?",
    options: [
      {
        id: "proof_missing",
        text: "The strategy is not justified until the effect of removal and the safety of discarding that start are proven.",
      },
      {
        id: "contiguous_is_enough",
        text: "The strategy is valid because the candidates are contiguous.",
      },
      {
        id: "two_pointers_are_enough",
        text: "The strategy is valid because both left and right pointers move.",
      },
      {
        id: "prefixes_make_it_valid",
        text: "Adding a prefix array automatically validates the same shrink rule.",
      },
    ],
    correctOptionId: "proof_missing",
    feedbackModel: {
      decisionSignal:
        "The algorithm permanently eliminates candidate starts based on the shrink rule.",
      mentalModelCorrection:
        "Pointer movement is an inference. Without predictable validity behavior, the inference may discard a required answer.",
      mistakeTypes: ["invalid_window_invariant"],
      nextAction:
        "State how expansion and removal affect the predicate before accepting the window pattern.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-variable-018",
    learningStage: "foundations",
    primarySkillAtomId: "justify_variable_window_strategy",
    secondarySkillAtomIds: [
      "monotonic_validity_reasoning",
      "strategy_justification",
    ],
    type: "solution_comparison",
    prompt: "Which explanation best justifies using a variable sliding window?",
    options: [
      {
        id: "complete_justification",
        text: "The task optimizes a contiguous range, the maintained state can be updated at both boundaries, and the validity condition lets left advance monotonically without losing a future candidate.",
      },
      {
        id: "subarray_keyword",
        text: "The prompt contains the word subarray, so sliding window must apply.",
      },
      {
        id: "two_pointer_shape",
        text: "The implementation has left and right variables, which proves both correctness and O(n) time.",
      },
      {
        id: "prefix_not_needed",
        text: "Prefix sums are unnecessary, so sliding window is automatically correct.",
      },
    ],
    correctOptionId: "complete_justification",
    feedbackModel: {
      decisionSignal:
        "A valid justification connects range shape, maintained state, monotonic repair, and safe candidate elimination.",
      mentalModelCorrection:
        "Variable sliding window is established by its invariant and boundary behavior, not by keywords or code shape.",
      mistakeTypes: ["weak_strategy_justification"],
      nextAction:
        "Justify the approach through state updates, validity restoration, and the reason discarded starts never return.",
      result: "diagnostic",
    },
  },
];
