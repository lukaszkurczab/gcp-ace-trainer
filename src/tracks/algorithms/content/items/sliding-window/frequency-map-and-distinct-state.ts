import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const frequencyMapAndDistinctStateQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-frequency-map-distinct-state-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_required_and_window_frequency_maps",
    "secondarySkillAtomIds": [
      "preserve_target_frequency_contract",
      "track_current_window_frequencies"
    ],
    "type": "single_choice",
    "prompt": "A sliding-window problem compares the current window with a target frequency requirement. What should the two frequency maps represent?",
    "options": [
      {
        "id": "target_fixed_window_dynamic",
        "text": "The target map stores fixed required counts, while the window map stores counts only for the current active window.",
        "isCorrect": true
      },
      {
        "id": "both_global_input",
        "text": "Both maps store frequencies from the complete input.",
        "isCorrect": false
      },
      {
        "id": "both_target",
        "text": "Both maps store the target counts and never change.",
        "isCorrect": false
      },
      {
        "id": "window_stores_indexes",
        "text": "The target map stores counts, while the window map stores only character indexes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "One structure defines the immutable contract; the other mirrors the changing contents of the active window.",
      "mentalModelCorrection": "Target requirements and current-window observations have different lifecycles and should not be conflated.",
      "mistakeTypes": [
        "target_and_window_frequency_roles_conflated"
      ],
      "nextAction": "State which map changes when an element enters or leaves the window.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-frequency-map-distinct-state-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_set_for_duplicate_sensitive_matching",
    "secondarySkillAtomIds": [
      "preserve_value_multiplicity",
      "distinguish_membership_from_frequency"
    ],
    "type": "solution_comparison",
    "prompt": "A window must contain two occurrences of `a` and one occurrence of `b`. Why is a Set insufficient for checking the requirement?",
    "options": [
      {
        "id": "set_loses_multiplicity",
        "text": "A Set records only whether a value is present, so it cannot distinguish one `a` from two `a` values.",
        "isCorrect": true
      },
      {
        "id": "set_cannot_store_strings",
        "text": "A Set cannot store string values.",
        "isCorrect": false
      },
      {
        "id": "set_is_always_unsorted",
        "text": "A Set is insufficient only because its values are not sorted.",
        "isCorrect": false
      },
      {
        "id": "set_uses_too_much_space",
        "text": "A Set always requires asymptotically more space than a frequency map.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The contract depends on how many copies of each value occur.",
      "mentalModelCorrection": "Membership state answers whether a key exists; frequency state answers how many occurrences exist.",
      "mistakeTypes": [
        "set_used_for_duplicate_sensitive_window"
      ],
      "nextAction": "Use a key-to-count structure whenever multiplicity affects validity.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-frequency-map-distinct-state-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_equal_sets_with_different_counts",
    "secondarySkillAtomIds": [
      "compare_frequency_distributions",
      "detect_duplicate_count_mismatch"
    ],
    "type": "mistake_review",
    "prompt": "A candidate says these strings match because they contain the same Set of characters:\n\ntarget = \"aabc\"\nwindow = \"abcc\"\n\nWhat is wrong?",
    "options": [
      {
        "id": "same_keys_different_counts",
        "text": "Both use the keys a, b, and c, but their frequencies differ: the target needs two a values while the window contains two c values.",
        "isCorrect": true
      },
      {
        "id": "sets_preserve_counts",
        "text": "Nothing; equal Sets prove equal character multiplicities.",
        "isCorrect": false
      },
      {
        "id": "order_only_problem",
        "text": "The only problem is that the characters appear in a different order.",
        "isCorrect": false
      },
      {
        "id": "window_too_short",
        "text": "The window contains fewer characters than the target.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The two sequences have equal lengths and equal distinct keys but different per-key counts.",
      "mentalModelCorrection": "Duplicate-sensitive equality requires matching frequency distributions, not merely matching key sets.",
      "mistakeTypes": [
        "equal_distinct_keys_treated_as_equal_frequencies"
      ],
      "nextAction": "Compare the count associated with every required key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-frequency-map-distinct-state-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "update_frequency_for_incoming_value",
    "secondarySkillAtomIds": [
      "synchronize_window_map_with_right_boundary",
      "increment_current_window_count"
    ],
    "type": "single_choice",
    "prompt": "When values[right] enters the active window, how should its window frequency be updated?",
    "options": [
      {
        "id": "increment_incoming_count",
        "text": "Set its count to the previous window count plus one.",
        "isCorrect": true
      },
      {
        "id": "replace_with_one_always",
        "text": "Set its count to one even if the same value is already inside the window.",
        "isCorrect": false
      },
      {
        "id": "decrement_incoming_count",
        "text": "Decrease its count because right moved forward.",
        "isCorrect": false
      },
      {
        "id": "update_target_map",
        "text": "Increase the required count in the target map instead.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The active window gains exactly one occurrence of the incoming value.",
      "mentalModelCorrection": "Boundary movement must be reflected by an equivalent change in the state representing the window.",
      "mistakeTypes": [
        "incoming_window_frequency_not_incremented"
      ],
      "nextAction": "Pair every right-boundary expansion with one increment for the entering key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "increment_distinct_count_on_zero_to_one_transition",
    "secondarySkillAtomIds": [
      "track_positive_frequency_keys",
      "avoid_counting_repeated_occurrences_as_distinct"
    ],
    "type": "single_choice",
    "prompt": "A window maintains both a frequency map and a distinctCount.\n\nWhen should distinctCount increase after an incoming value is added?",
    "options": [
      {
        "id": "zero_to_one",
        "text": "Only when that value's window count changes from 0 to 1.",
        "isCorrect": true
      },
      {
        "id": "every_occurrence",
        "text": "Every time any occurrence enters the window.",
        "isCorrect": false
      },
      {
        "id": "one_to_two",
        "text": "Only when the count changes from 1 to 2.",
        "isCorrect": false
      },
      {
        "id": "target_contains_key",
        "text": "Whenever the target map contains the key, regardless of its current window count.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A key becomes newly distinct only when its first active occurrence enters.",
      "mentalModelCorrection": "Distinct count measures positive-frequency keys, not total observations.",
      "mistakeTypes": [
        "distinct_count_incremented_for_duplicate_occurrence"
      ],
      "nextAction": "Inspect the key's previous count before updating distinct state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "decrement_distinct_count_on_one_to_zero_transition",
    "secondarySkillAtomIds": [
      "remove_last_active_occurrence",
      "synchronize_distinct_count_with_frequency_map"
    ],
    "type": "single_choice",
    "prompt": "An outgoing value's window count changes from 1 to 0.\n\nWhat should happen when distinctCount represents values currently present in the window?",
    "options": [
      {
        "id": "decrement_distinct",
        "text": "Decrease distinctCount because the value no longer has any active occurrence.",
        "isCorrect": true
      },
      {
        "id": "leave_distinct",
        "text": "Leave distinctCount unchanged because the key once appeared in the window.",
        "isCorrect": false
      },
      {
        "id": "increment_distinct",
        "text": "Increase distinctCount because a boundary moved.",
        "isCorrect": false
      },
      {
        "id": "clear_all_state",
        "text": "Reset the complete map and distinctCount.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The final active occurrence of that key has left the window.",
      "mentalModelCorrection": "Distinct state must describe the current interval, not historical membership.",
      "mistakeTypes": [
        "distinct_count_not_decremented_at_zero"
      ],
      "nextAction": "Update distinctCount only on transitions between absent and present states.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "delete_zero_count_frequency_entries",
    "secondarySkillAtomIds": [
      "keep_map_size_equal_to_distinct_count",
      "avoid_stale_frequency_keys"
    ],
    "type": "mistake_review",
    "prompt": "A window frequency map is used like this:\n\nwindowCount.set(outgoing, windowCount.get(outgoing) - 1);\n\nWhen the count becomes 0, the key remains in the map. Later, the algorithm uses windowCount.size as the number of distinct window values.\n\nWhat is the problem?",
    "options": [
      {
        "id": "zero_key_inflates_size",
        "text": "The zero-count key still contributes to Map.size, so the reported distinct count can be too large.",
        "isCorrect": true
      },
      {
        "id": "maps_cannot_store_zero",
        "text": "A Map cannot store the numeric value 0.",
        "isCorrect": false
      },
      {
        "id": "outgoing_should_increment",
        "text": "Outgoing counts should be incremented rather than decremented.",
        "isCorrect": false
      },
      {
        "id": "size_counts_occurrences",
        "text": "Map.size counts every occurrence, so deleting the key would not help.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Map.size counts stored keys regardless of whether their associated counts are positive.",
      "mentalModelCorrection": "If map membership represents active presence, zero-count entries must be removed.",
      "mistakeTypes": [
        "zero_count_key_inflates_distinct_map_size"
      ],
      "nextAction": "Delete a key when its active count reaches zero, or maintain a separate positive-count variable.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-frequency-map-distinct-state-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "remove_correct_outgoing_value",
    "secondarySkillAtomIds": [
      "synchronize_map_with_left_boundary",
      "preserve_retained_window_counts"
    ],
    "type": "mistake_review",
    "prompt": "A window slides from [left, right] to [left + 1, right + 1].\n\nThe implementation decrements the count of values[left + 1].\n\nWhat is wrong?",
    "options": [
      {
        "id": "decrements_retained_value",
        "text": "values[left + 1] remains in the new window; the outgoing value is values[left].",
        "isCorrect": true
      },
      {
        "id": "left_plus_one_is_incoming",
        "text": "values[left + 1] is the new incoming value.",
        "isCorrect": false
      },
      {
        "id": "both_left_values_leave",
        "text": "Both values[left] and values[left + 1] leave during one slide.",
        "isCorrect": false
      },
      {
        "id": "no_decrement_needed",
        "text": "Frequency maps do not need outgoing updates when boundaries move.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A one-position slide removes the old left endpoint and preserves the overlap beginning at left + 1.",
      "mentalModelCorrection": "Outgoing updates must use the value that actually leaves the old interval.",
      "mistakeTypes": [
        "wrong_outgoing_frequency_key_updated"
      ],
      "nextAction": "Capture or process values[left] before advancing the left boundary.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_window_frequency_from_global_frequency",
    "secondarySkillAtomIds": [
      "remove_expired_observations",
      "avoid_historical_count_accumulation"
    ],
    "type": "mistake_review",
    "prompt": "A sliding-window implementation increments frequencies for incoming values but never decrements frequencies for outgoing values. What does the map eventually represent?",
    "options": [
      {
        "id": "processed_prefix_not_window",
        "text": "It represents frequencies from the processed prefix or accumulated history, not frequencies from the current window.",
        "isCorrect": true
      },
      {
        "id": "current_window_automatically",
        "text": "It still represents the current window because left moves forward.",
        "isCorrect": false
      },
      {
        "id": "target_frequencies",
        "text": "It automatically becomes equivalent to the target map.",
        "isCorrect": false
      },
      {
        "id": "only_outgoing_values",
        "text": "It contains only values that have left the window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Changing pointer boundaries does not automatically remove contributions from stored state.",
      "mentalModelCorrection": "Window state must forget expired observations as well as incorporate new observations.",
      "mistakeTypes": [
        "global_or_prefix_counts_used_as_window_counts"
      ],
      "nextAction": "Pair every left-boundary advance with the corresponding frequency decrement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-frequency-map-distinct-state-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_window_distinct_count",
    "secondarySkillAtomIds": [
      "apply_incoming_outgoing_frequency_updates",
      "track_positive_count_keys"
    ],
    "type": "single_choice",
    "prompt": "The current window is:\n\n[a, b, a, c]\n\nWhat are its frequencies and distinct count?",
    "options": [
      {
        "id": "a_two_b_one_c_one_distinct_three",
        "text": "a: 2, b: 1, c: 1; distinct count = 3.",
        "isCorrect": true
      },
      {
        "id": "a_one_b_one_c_one_distinct_four",
        "text": "a: 1, b: 1, c: 1; distinct count = 4.",
        "isCorrect": false
      },
      {
        "id": "a_two_b_one_c_one_distinct_four",
        "text": "a: 2, b: 1, c: 1; distinct count = 4.",
        "isCorrect": false
      },
      {
        "id": "all_one_distinct_three",
        "text": "a: 1, b: 1, c: 1; distinct count = 3.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The key a occurs twice, while three different keys have positive counts.",
      "mentalModelCorrection": "Frequency totals and distinct-key totals describe different properties of the same window.",
      "mistakeTypes": [
        "frequency_and_distinct_count_conflated"
      ],
      "nextAction": "Count occurrences per key first, then count keys with positive frequency.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-frequency-map-distinct-state-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_required_distinct_key_count",
    "secondarySkillAtomIds": [
      "interpret_target_frequency_requirements",
      "distinguish_required_keys_from_total_occurrences"
    ],
    "type": "single_choice",
    "prompt": "A target frequency map is:\n\na -> 2\nb -> 1\nc -> 3\n\nIn a required/formed design, what should required usually equal?",
    "options": [
      {
        "id": "three_distinct_keys",
        "text": "3, the number of distinct target keys whose frequency requirement must be satisfied.",
        "isCorrect": true
      },
      {
        "id": "six_occurrences",
        "text": "6, the total number of required occurrences.",
        "isCorrect": false
      },
      {
        "id": "largest_count",
        "text": "3, only because it is the largest individual frequency.",
        "isCorrect": false
      },
      {
        "id": "zero_initially",
        "text": "0 until the window contains every target occurrence.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "formed tracks satisfied key-level requirements, so required must use the same unit.",
      "mentalModelCorrection": "The target length and the number of distinct frequency constraints are different quantities.",
      "mistakeTypes": [
        "required_uses_total_occurrences_instead_of_keys"
      ],
      "nextAction": "Define the unit counted by formed before initializing required.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "increment_formed_when_requirement_is_reached",
    "secondarySkillAtomIds": [
      "detect_below_to_satisfied_transition",
      "avoid_repeated_formed_increment"
    ],
    "type": "single_choice",
    "prompt": "The target requires three occurrences of x.\n\nThe window count of x changes from 2 to 3 after an incoming value.\n\nWhat should happen to formed?",
    "options": [
      {
        "id": "increment_once",
        "text": "Increment formed once because the requirement for x has just changed from unsatisfied to satisfied.",
        "isCorrect": true
      },
      {
        "id": "add_three",
        "text": "Increase formed by 3 because the target needs three x values.",
        "isCorrect": false
      },
      {
        "id": "leave_unchanged",
        "text": "Leave formed unchanged until the count exceeds 3.",
        "isCorrect": false
      },
      {
        "id": "reset_formed",
        "text": "Reset formed because one key reached its requirement.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The key crosses the threshold from below its requirement to meeting it.",
      "mentalModelCorrection": "formed counts satisfied distinct constraints, not individual matching occurrences.",
      "mistakeTypes": [
        "formed_not_incremented_at_requirement_threshold"
      ],
      "nextAction": "Update formed only when a key crosses between unsatisfied and satisfied states.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_incrementing_formed_for_overcount",
    "secondarySkillAtomIds": [
      "preserve_satisfied_key_state",
      "distinguish_meeting_from_repeatedly_meeting"
    ],
    "type": "mistake_review",
    "prompt": "The target requires two occurrences of a.\n\nThe window count changes:\n\n1 -> 2 -> 3 -> 4\n\nAn implementation increments formed at every count greater than or equal to 2.\n\nWhy is this wrong?",
    "options": [
      {
        "id": "same_key_counted_multiple_times",
        "text": "The requirement for a becomes satisfied only once; additional copies do not create additional satisfied target keys.",
        "isCorrect": true
      },
      {
        "id": "overcounts_make_requirement_invalid",
        "text": "Any count greater than 2 makes the requirement unsatisfied.",
        "isCorrect": false
      },
      {
        "id": "formed_tracks_occurrences",
        "text": "The implementation is correct because formed should equal the number of matching occurrences.",
        "isCorrect": false
      },
      {
        "id": "formed_should_decrease",
        "text": "formed should decrease every time an extra a enters.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A key contributes at most one unit to a key-level formed counter.",
      "mentalModelCorrection": "Increment formed on the transition to satisfaction, not throughout the entire satisfied range.",
      "mistakeTypes": [
        "formed_incremented_repeatedly_for_overcount"
      ],
      "nextAction": "Check for equality with the required count immediately after incrementing the window count.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "decrement_formed_when_requirement_breaks",
    "secondarySkillAtomIds": [
      "detect_satisfied_to_below_transition",
      "handle_outgoing_required_value"
    ],
    "type": "single_choice",
    "prompt": "The target requires two occurrences of b.\n\nThe window count of b changes from 2 to 1 when the left boundary removes one b.\n\nWhat should happen to formed?",
    "options": [
      {
        "id": "decrement_formed",
        "text": "Decrement formed because the requirement for b has changed from satisfied to unsatisfied.",
        "isCorrect": true
      },
      {
        "id": "leave_formed",
        "text": "Leave formed unchanged because b is still present once.",
        "isCorrect": false
      },
      {
        "id": "increment_formed",
        "text": "Increment formed because an outgoing value was processed.",
        "isCorrect": false
      },
      {
        "id": "clear_required",
        "text": "Remove b from the immutable target requirement.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The active count falls below the target threshold.",
      "mentalModelCorrection": "Presence alone is insufficient when the target requires multiple occurrences.",
      "mistakeTypes": [
        "formed_not_decremented_below_requirement"
      ],
      "nextAction": "After decrementing an outgoing required key, test whether its count crossed below the target count.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_formed_when_requirement_remains_satisfied",
    "secondarySkillAtomIds": [
      "handle_outgoing_overrepresented_key",
      "avoid_premature_formed_decrement"
    ],
    "type": "mistake_review",
    "prompt": "The target requires two occurrences of c.\n\nThe window contains four c values, and one leaves:\n\n4 -> 3\n\nAn implementation decrements formed because a required key left the window.\n\nWhat is the correction?",
    "options": [
      {
        "id": "still_satisfied",
        "text": "formed should remain unchanged because the remaining count of 3 still satisfies the required count of 2.",
        "isCorrect": true
      },
      {
        "id": "always_decrement_on_required_outgoing",
        "text": "The implementation is correct because every outgoing required key breaks the requirement.",
        "isCorrect": false
      },
      {
        "id": "formed_increases",
        "text": "formed should increase because the window contains fewer duplicates.",
        "isCorrect": false
      },
      {
        "id": "delete_target_key",
        "text": "The target requirement for c should be deleted after one c leaves.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The key remains at or above its required frequency after the removal.",
      "mentalModelCorrection": "formed changes only when satisfaction status changes, not after every incoming or outgoing occurrence.",
      "mistakeTypes": [
        "formed_decremented_while_requirement_still_satisfied"
      ],
      "nextAction": "Compare the post-removal window count with the immutable required count.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "exclude_irrelevant_keys_from_formed",
    "secondarySkillAtomIds": [
      "track_nonrequired_window_values_safely",
      "scope_formed_to_target_constraints"
    ],
    "type": "single_choice",
    "prompt": "The target requires only a and b.\n\nThe current window also contains several x values. How should x affect formed?",
    "options": [
      {
        "id": "does_not_affect_formed",
        "text": "It should not affect formed because x has no target frequency requirement.",
        "isCorrect": true
      },
      {
        "id": "increments_formed_once",
        "text": "It should increment formed once because x is a distinct window value.",
        "isCorrect": false
      },
      {
        "id": "increments_for_each_x",
        "text": "Each x occurrence should increase formed.",
        "isCorrect": false
      },
      {
        "id": "invalidates_all_requirements",
        "text": "Any irrelevant value automatically resets formed to zero.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "formed measures satisfied target constraints, not all distinct values in the current window.",
      "mentalModelCorrection": "A window map may track irrelevant keys, but target-satisfaction state must remain scoped to required keys.",
      "mistakeTypes": [
        "irrelevant_window_key_changes_formed"
      ],
      "nextAction": "Update formed only inside a check that the changed key exists in the target map.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-017",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_required_and_formed_state",
    "secondarySkillAtomIds": [
      "evaluate_multiple_frequency_requirements",
      "distinguish_satisfied_keys_from_total_matches"
    ],
    "type": "single_choice",
    "prompt": "The target requirements are:\n\na -> 2\nb -> 1\nc -> 2\n\nThe current window frequencies are:\n\na -> 3\nb -> 1\nc -> 1\nx -> 4\n\nWhat are required and formed?",
    "options": [
      {
        "id": "required_three_formed_two",
        "text": "required = 3 and formed = 2, because a and b satisfy their requirements while c does not.",
        "isCorrect": true
      },
      {
        "id": "required_eight_formed_nine",
        "text": "required = 8 and formed = 9, using total required and observed occurrences.",
        "isCorrect": false
      },
      {
        "id": "required_four_formed_three",
        "text": "required = 4 and formed = 3 because x is also distinct.",
        "isCorrect": false
      },
      {
        "id": "required_three_formed_three",
        "text": "required = 3 and formed = 3 because every target key is present at least once.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "There are three distinct target constraints, and exactly two currently meet their required counts.",
      "mentalModelCorrection": "A required key is formed only when its complete multiplicity requirement is met.",
      "mistakeTypes": [
        "required_formed_trace_mismatch"
      ],
      "nextAction": "Evaluate each target key independently against its required frequency.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-frequency-map-distinct-state-018",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_synchronized_frequency_window_invariant",
    "secondarySkillAtomIds": [
      "synchronize_maps_counts_and_boundaries",
      "prove_required_formed_consistency"
    ],
    "type": "single_choice",
    "prompt": "Which invariant most completely supports a sliding window using frequency maps, distinct counts, and required/formed state?",
    "options": [
      {
        "id": "maps_match_window_and_threshold_state",
        "text": "The window map contains exactly the positive frequencies inside the current boundaries; zero-count keys are absent when map size represents distinctness; distinctCount equals the number of positive-frequency window keys; required counts target keys; and formed counts exactly the target keys whose current frequencies meet their requirements.",
        "isCorrect": true
      },
      {
        "id": "map_contains_history",
        "text": "The window map may retain every value ever observed as long as the pointers continue moving.",
        "isCorrect": false
      },
      {
        "id": "formed_counts_occurrences",
        "text": "formed equals the total number of target occurrences currently inside the window.",
        "isCorrect": false
      },
      {
        "id": "sets_are_equivalent",
        "text": "A Set of current values is always equivalent to the frequency map and required/formed state.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Every maintained variable must describe the same current interval and use a clearly defined counting unit.",
      "mentalModelCorrection": "Frequency, distinctness, and requirement satisfaction are related but separate state dimensions that must remain synchronized.",
      "mistakeTypes": [
        "frequency_window_state_invariant_incomplete"
      ],
      "nextAction": "After every incoming or outgoing update, verify map counts, zero-key deletion, distinct state, and threshold transitions.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
