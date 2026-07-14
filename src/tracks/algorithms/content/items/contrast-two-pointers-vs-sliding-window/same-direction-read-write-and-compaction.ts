import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const sameDirectionReadWriteAndCompactionQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_read_write_two_pointer_roles",
    "secondarySkillAtomIds": [
      "distinguish_compaction_from_sliding_window",
      "interpret_processed_prefix"
    ],
    "type": "single_choice",
    "prompt": "An in-place filtering algorithm uses:\n\n- read to inspect each original element,\n- write to mark where the next accepted element should be stored.\n\nWhat do the two pointers represent?",
    "options": [
      {
        "id": "scan_and_output_roles",
        "text": "Two different roles: read scans observations, while write tracks the next position in the compacted output prefix.",
        "isCorrect": true
      },
      {
        "id": "window_boundaries",
        "text": "The boundaries of one candidate window whose contents must satisfy a validity condition.",
        "isCorrect": false
      },
      {
        "id": "independent_candidates",
        "text": "Two independent candidate values that should be compared with each other.",
        "isCorrect": false
      },
      {
        "id": "unprocessed_range",
        "text": "The first and last positions of the unprocessed suffix.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "One pointer observes input while the other identifies the next output slot.",
      "mentalModelCorrection": "The pointers do not bound one candidate range. Their distance reflects how many values were rejected, not a window contract.",
      "mistakeTypes": [
        "read_write_roles_treated_as_window"
      ],
      "nextAction": "Name the operational responsibility of each pointer before interpreting the range between them.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "advance_write_only_for_accepted_values",
    "secondarySkillAtomIds": [
      "apply_in_place_filtering_contract",
      "maintain_compacted_prefix"
    ],
    "type": "single_choice",
    "prompt": "An algorithm removes rejected values in place:\n\nlet write = 0;\n\nfor (let read = 0; read < values.length; read++) {\n  if (shouldKeep(values[read])) {\n    values[write] = values[read];\n    write++;\n  }\n}\n\nWhy does write advance only inside the condition?",
    "options": [
      {
        "id": "accepted_values_fill_prefix",
        "text": "Because write counts accepted values and must continue pointing to the next free position in the compacted prefix.",
        "isCorrect": true
      },
      {
        "id": "write_tracks_read_distance",
        "text": "Because write must remain exactly one position behind read.",
        "isCorrect": false
      },
      {
        "id": "rejected_values_form_window",
        "text": "Because rejected values stay inside an active window until an outgoing element is removed.",
        "isCorrect": false
      },
      {
        "id": "write_moves_on_rejection",
        "text": "It should also advance for rejected values so that both pointers remain synchronized.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "write represents output length, not traversal progress.",
      "mentalModelCorrection": "A rejected value consumes no output position. Advancing write would leave a gap or preserve rejected data in the logical result.",
      "mistakeTypes": [
        "write_advanced_for_rejected_value"
      ],
      "nextAction": "Tie write movement to creation of one new valid output element.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_compaction_distance_from_window_length",
    "secondarySkillAtomIds": [
      "interpret_read_write_distance",
      "reject_false_window_state"
    ],
    "type": "single_choice",
    "prompt": "During stable compaction, read = 9 and write = 6.\n\nWhat does the distance between them most directly indicate?",
    "options": [
      {
        "id": "rejected_or_skipped_count",
        "text": "Three observed positions have not produced retained output positions, assuming both started at zero.",
        "isCorrect": true
      },
      {
        "id": "active_window_length",
        "text": "The current candidate window has length four and must be evaluated as one range.",
        "isCorrect": false
      },
      {
        "id": "outgoing_elements",
        "text": "Three elements must now be removed from a maintained rolling aggregate.",
        "isCorrect": false
      },
      {
        "id": "invalid_state",
        "text": "The algorithm is invalid because read and write must always remain adjacent.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "read counts observations while write counts accepted output positions.",
      "mentalModelCorrection": "Their separation records filtering progress. It is not automatically the size of a semantically meaningful range.",
      "mistakeTypes": [
        "write_read_distance_called_window_length"
      ],
      "nextAction": "Ask whether the algorithm maintains any property of every element between write and read.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "order_stable_compaction_subgoals",
    "secondarySkillAtomIds": [
      "inspect_before_writing",
      "advance_read_each_iteration",
      "advance_write_after_acceptance"
    ],
    "type": "subgoal_ordering",
    "prompt": "Which sequence correctly processes one observation in a stable read/write compaction algorithm?",
    "options": [
      {
        "id": "inspect_write_advance_write_then_read",
        "text": "Inspect values[read]; if accepted, copy it to values[write] and advance write; then continue by advancing read.",
        "isCorrect": true
      },
      {
        "id": "advance_write_then_inspect",
        "text": "Advance write first; inspect values[read]; then decide whether the newly reserved output slot should remain empty.",
        "isCorrect": false
      },
      {
        "id": "remove_outgoing_then_inspect",
        "text": "Remove the outgoing contribution at write; inspect values[read]; then shrink while invalid.",
        "isCorrect": false
      },
      {
        "id": "write_every_value_then_validate",
        "text": "Copy every observed value to values[write], advance both pointers, and later remove rejected values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "An output slot should be consumed only after the observation has been accepted.",
      "mentalModelCorrection": "The decision precedes write advancement. There is no window-validity phase or outgoing contribution.",
      "mistakeTypes": [
        "compaction_subgoal_order_mismatch"
      ],
      "nextAction": "Structure each iteration as observe, decide, optionally emit.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_stable_in_place_filtering",
    "secondarySkillAtomIds": [
      "maintain_stable_output_order",
      "advance_write_only_for_accepted_values"
    ],
    "type": "single_choice",
    "prompt": "A stable in-place filter keeps only positive values:\n\nvalues = [3, -1, 2, 0, 5]\n\nWhat should the retained prefix contain after processing all elements?",
    "options": [
      {
        "id": "three_two_five",
        "text": "[3, 2, 5]",
        "isCorrect": true
      },
      {
        "id": "five_three_two",
        "text": "[5, 3, 2]",
        "isCorrect": false
      },
      {
        "id": "three_negative_two",
        "text": "[3, -1, 2]",
        "isCorrect": false
      },
      {
        "id": "three_two_zero_five",
        "text": "[3, 2, 0, 5]",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Accepted values are emitted in the same order in which read observes them.",
      "mentalModelCorrection": "Stable compaction removes rejected values without rearranging the retained ones.",
      "mistakeTypes": [
        "stable_compaction_trace_mismatch"
      ],
      "nextAction": "Append each accepted observation to a conceptual output list before mapping that list back onto the prefix.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_stable_compaction_order",
    "secondarySkillAtomIds": [
      "distinguish_stable_from_unstable_filtering",
      "maintain_processed_prefix"
    ],
    "type": "solution_comparison",
    "prompt": "The contract says: \"Remove rejected values in place while preserving the relative order of retained values.\"\n\nWhich implementation strategy satisfies that contract?",
    "options": [
      {
        "id": "read_left_to_right_write_prefix",
        "text": "Scan left to right and write each accepted value into the next output position.",
        "isCorrect": true
      },
      {
        "id": "swap_with_last",
        "text": "Whenever a value is rejected, replace it with the last unprocessed value.",
        "isCorrect": false
      },
      {
        "id": "sort_retained_values",
        "text": "Collect accepted values at the front and sort them afterward.",
        "isCorrect": false
      },
      {
        "id": "move_large_values_first",
        "text": "Prefer writing larger accepted values earlier to reduce later overwrites.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The retained sequence must preserve observation order.",
      "mentalModelCorrection": "Filling holes from the end may compact the array, but it can reorder retained values and violate stability.",
      "mistakeTypes": [
        "stable_order_lost_during_compaction"
      ],
      "nextAction": "Check whether accepted elements appear in output in the same relative order as in input.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-same-direction-compaction-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorted_duplicate_collapse",
    "secondarySkillAtomIds": [
      "interpret_write_as_unique_prefix_length",
      "compare_observation_with_last_retained_value"
    ],
    "type": "single_choice",
    "prompt": "A sorted array must be compacted so that each distinct value appears once.\n\nWhich read/write interpretation is most useful?",
    "options": [
      {
        "id": "read_observes_write_builds_unique_prefix",
        "text": "read observes the next sorted value, while write identifies the end or next slot of the unique retained prefix.",
        "isCorrect": true
      },
      {
        "id": "window_contains_duplicates",
        "text": "read and write bound a variable window that remains valid while every value inside it is duplicated.",
        "isCorrect": false
      },
      {
        "id": "endpoint_pair_search",
        "text": "read and write are independent candidates whose sum determines whether one is a duplicate.",
        "isCorrect": false
      },
      {
        "id": "write_tracks_rejected_suffix",
        "text": "write marks the beginning of a suffix containing only rejected duplicates.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sorted order makes duplicates adjacent, and the retained prefix summarizes the distinct values already accepted.",
      "mentalModelCorrection": "The algorithm compares an observation with retained output state; it does not maintain one candidate window between the pointers.",
      "mistakeTypes": [
        "duplicate_collapse_classified_as_window"
      ],
      "nextAction": "Describe write in terms of the logical unique output rather than pointer distance.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-same-direction-compaction-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_duplicate_collapse_pointer_movement",
    "secondarySkillAtomIds": [
      "advance_read_after_every_observation",
      "advance_write_for_new_distinct_value"
    ],
    "type": "single_choice",
    "prompt": "A sorted duplicate-collapse scan observes values[read] equal to the most recently retained value.\n\nWhich movement is correct?",
    "options": [
      {
        "id": "advance_read_only",
        "text": "Advance read only, because the observation is consumed but does not create a new retained output value.",
        "isCorrect": true
      },
      {
        "id": "advance_both",
        "text": "Advance both pointers so that their distance continues representing the duplicate window size.",
        "isCorrect": false
      },
      {
        "id": "advance_write_only",
        "text": "Advance write only because the retained prefix must reserve a position for every observation.",
        "isCorrect": false
      },
      {
        "id": "shrink_until_distinct",
        "text": "Run a shrink loop that removes outgoing values until the current range becomes distinct.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The duplicate has been inspected but should not extend the logical result.",
      "mentalModelCorrection": "read advances for consumed input; write advances only when output grows.",
      "mistakeTypes": [
        "write_advanced_for_duplicate"
      ],
      "nextAction": "Separate consumption of an observation from emission of a retained value.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-same-direction-compaction-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_sorted_duplicate_collapse",
    "secondarySkillAtomIds": [
      "maintain_unique_prefix",
      "advance_write_for_new_distinct_value"
    ],
    "type": "single_choice",
    "prompt": "A sorted array is compacted to one occurrence per distinct value:\n\nvalues = [1, 1, 2, 2, 2, 4]\n\nWhat should the logical retained prefix contain?",
    "options": [
      {
        "id": "one_two_four",
        "text": "[1, 2, 4]",
        "isCorrect": true
      },
      {
        "id": "one_one_two",
        "text": "[1, 1, 2]",
        "isCorrect": false
      },
      {
        "id": "four_two_one",
        "text": "[4, 2, 1]",
        "isCorrect": false
      },
      {
        "id": "one_two_two_four",
        "text": "[1, 2, 2, 4]",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Only the first observation from each adjacent duplicate group extends the unique output prefix.",
      "mentalModelCorrection": "The resulting prefix contains retained values, not one representative for every pointer movement.",
      "mistakeTypes": [
        "duplicate_collapse_trace_mismatch"
      ],
      "nextAction": "Track the last retained value and emit only when the observation differs from it.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_outgoing_update_in_compaction",
    "secondarySkillAtomIds": [
      "distinguish_output_state_from_window_state",
      "recognize_absence_of_removable_range_state"
    ],
    "type": "single_choice",
    "prompt": "A learner proposes this change to an in-place filter:\n\n\"Whenever read advances, subtract or remove the element at write because it is leaving the range between the pointers.\"\n\nWhy is that reasoning incorrect?",
    "options": [
      {
        "id": "no_window_aggregate_exists",
        "text": "The algorithm does not maintain an aggregate for the range between write and read; write marks an output position, not an outgoing window boundary.",
        "isCorrect": true
      },
      {
        "id": "outgoing_is_read",
        "text": "The reasoning is almost correct, but read rather than write is always the outgoing boundary.",
        "isCorrect": false
      },
      {
        "id": "remove_only_when_rejected",
        "text": "An outgoing contribution should be removed only when the observed value is rejected.",
        "isCorrect": false
      },
      {
        "id": "distance_must_remain_fixed",
        "text": "Removal is unnecessary only because read and write must remain a fixed distance apart.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "No maintained state corresponds to all elements inside the pointer interval.",
      "mentalModelCorrection": "Window updates are meaningful only when the pointers are boundaries of one represented range. Compaction pointers have different semantic roles.",
      "mistakeTypes": [
        "outgoing_element_removed_without_window_state"
      ],
      "nextAction": "Identify the exact state that an alleged outgoing update would modify before adding such logic.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "maintain_processed_compaction_prefix",
    "secondarySkillAtomIds": [
      "interpret_logical_output_length",
      "separate_processed_and_unprocessed_regions"
    ],
    "type": "single_choice",
    "prompt": "During stable filtering, all indexes below write contain accepted values in their original relative order.\n\nWhat does the half-open range [0, write) represent?",
    "options": [
      {
        "id": "completed_output_prefix",
        "text": "The completed logical output produced from the observations processed so far.",
        "isCorrect": true
      },
      {
        "id": "current_sliding_window",
        "text": "The current candidate window awaiting a validity check.",
        "isCorrect": false
      },
      {
        "id": "rejected_prefix",
        "text": "The portion of the input known to contain only rejected values.",
        "isCorrect": false
      },
      {
        "id": "unprocessed_prefix",
        "text": "The observations that read has not yet inspected.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "write is the logical output length after processing the current input prefix.",
      "mentalModelCorrection": "The prefix before write is finalized retained output, not a movable candidate range.",
      "mistakeTypes": [
        "processed_prefix_state_misinterpreted"
      ],
      "nextAction": "Partition the array conceptually into retained output, observed-but-not-retained space, and unprocessed input.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-same-direction-compaction-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_variable_window_for_compaction_contract",
    "secondarySkillAtomIds": [
      "choose_read_write_over_sliding_window",
      "interpret_in_place_output_contract"
    ],
    "type": "solution_comparison",
    "prompt": "The task is:\n\n\"Remove all values that fail a predicate in place, preserve the order of retained values, and return the new logical length.\"\n\nWhich design better matches the contract?",
    "options": [
      {
        "id": "read_write_compaction",
        "text": "Use read to inspect every value and write to append each accepted value to the retained prefix.",
        "isCorrect": true
      },
      {
        "id": "variable_window_shrink",
        "text": "Treat the region between left and right as a variable window and shrink it repeatedly whenever it contains a rejected value.",
        "isCorrect": false
      },
      {
        "id": "opposite_end_elimination",
        "text": "Compare values at both ends and discard whichever endpoint fails the predicate.",
        "isCorrect": false
      },
      {
        "id": "fixed_window",
        "text": "Maintain a fixed-size range whose length equals the number of accepted values seen so far.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The output is a stable sequence of independently accepted observations, not one valid contiguous subarray of the original input.",
      "mentalModelCorrection": "A shrink loop solves a range-validity problem. Compaction instead builds a logical output prefix.",
      "mistakeTypes": [
        "variable_window_used_for_compaction"
      ],
      "nextAction": "Classify whether the task asks for a subarray boundary or a rewritten retained sequence.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_all_rejected_compaction_edge_case",
    "secondarySkillAtomIds": [
      "interpret_zero_length_output",
      "keep_write_stationary_on_rejection"
    ],
    "type": "edge_case_drill",
    "prompt": "A stable in-place filter rejects every element in a non-empty array. Where should write finish if it starts at zero?",
    "options": [
      {
        "id": "zero",
        "text": "At zero, because no observation created an element in the retained output prefix.",
        "isCorrect": true
      },
      {
        "id": "array_length",
        "text": "At the array length, because write must advance once for every processed observation.",
        "isCorrect": false
      },
      {
        "id": "last_index",
        "text": "At the final array index, because one slot must remain reserved for rejected values.",
        "isCorrect": false
      },
      {
        "id": "same_as_read_minus_one",
        "text": "One position behind read, because the pointer distance represents a size-one window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "write counts retained output elements.",
      "mentalModelCorrection": "Processing an observation advances read, but rejecting it does not increase logical output length.",
      "mistakeTypes": [
        "all_rejected_write_position_mismatch"
      ],
      "nextAction": "Derive the final write value from the number of accepted elements.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-same-direction-compaction-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_all_accepted_compaction_edge_case",
    "secondarySkillAtomIds": [
      "recognize_no_gap_compaction",
      "preserve_input_order"
    ],
    "type": "edge_case_drill",
    "prompt": "A stable in-place filter accepts every element. How should read and write behave?",
    "options": [
      {
        "id": "advance_together",
        "text": "Both advance once per observation, so write finishes at the original length and the logical output is unchanged.",
        "isCorrect": true
      },
      {
        "id": "write_stays_zero",
        "text": "write remains at zero because no rejected value creates a gap.",
        "isCorrect": false
      },
      {
        "id": "write_moves_only_after_gap",
        "text": "write should begin advancing only after read finds the first rejected value.",
        "isCorrect": false
      },
      {
        "id": "shrink_complete_range",
        "text": "The algorithm should shrink the full-array window until only one accepted value remains.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Every observation extends the retained output by one value.",
      "mentalModelCorrection": "Even when the write is effectively a self-assignment, it still represents growth of the logical retained prefix.",
      "mistakeTypes": [
        "all_accepted_write_position_mismatch"
      ],
      "nextAction": "Check that write equals the number of accepted observations in every edge case.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
