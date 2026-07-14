import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const pointerRolesBoundariesAndTerminationQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "assign_stable_pointer_roles",
    "secondarySkillAtomIds": [
      "interpret_pointer_responsibilities",
      "state_pointer_invariant"
    ],
    "type": "single_choice",
    "prompt": "What is the strongest way to explain the role of a pointer variable in an algorithm?",
    "options": [
      {
        "id": "responsibility_and_region",
        "text": "State what position it identifies, what region it separates or controls, and what remains true whenever it moves.",
        "isCorrect": true
      },
      {
        "id": "variable_name_only",
        "text": "Use its name, such as left or fast, because the name fully determines its meaning.",
        "isCorrect": false
      },
      {
        "id": "movement_direction_only",
        "text": "State only whether it moves forward or backward.",
        "isCorrect": false
      },
      {
        "id": "current_numeric_value",
        "text": "Describe only its current numeric index.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A pointer is meaningful through the invariant and region associated with it.",
      "mentalModelCorrection": "Names and movement mechanics do not replace a semantic explanation of the pointer's responsibility.",
      "mistakeTypes": [
        "pointer_role_described_only_syntactically"
      ],
      "nextAction": "Complete the sentence: this pointer always identifies...",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_boundary_from_element_position",
    "secondarySkillAtomIds": [
      "interpret_exclusive_boundary",
      "reason_about_half_open_regions"
    ],
    "type": "single_choice",
    "prompt": "An algorithm defines its processed region as [0, boundary).\n\nWhat does boundary represent?",
    "options": [
      {
        "id": "first_position_outside_region",
        "text": "The first position not included in the processed region, which is also the region's length.",
        "isCorrect": true
      },
      {
        "id": "last_processed_index",
        "text": "The final index included in the processed region.",
        "isCorrect": false
      },
      {
        "id": "first_processed_index",
        "text": "The first index included in the processed region.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_cursor",
        "text": "An index with no relationship to the processed region.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The right endpoint of a half-open interval is excluded.",
      "mentalModelCorrection": "An exclusive boundary is not the last valid element index; it points one position beyond the region.",
      "mistakeTypes": [
        "exclusive_boundary_treated_as_inclusive"
      ],
      "nextAction": "Translate [start, end) into included indexes before using either boundary.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_read_pointer_role",
    "secondarySkillAtomIds": [
      "identify_next_unprocessed_item",
      "separate_processed_and_unprocessed_regions"
    ],
    "type": "single_choice",
    "prompt": "In a left-to-right scan, read identifies the next item that has not yet been classified. Which region description is consistent with that role?",
    "options": [
      {
        "id": "prefix_processed_suffix_unprocessed",
        "text": "Indexes before read are processed, and indexes from read onward are not yet processed.",
        "isCorrect": true
      },
      {
        "id": "prefix_unprocessed",
        "text": "Indexes before read are unprocessed, and indexes after read are finalized.",
        "isCorrect": false
      },
      {
        "id": "read_is_last_processed",
        "text": "read always identifies the last item already processed.",
        "isCorrect": false
      },
      {
        "id": "read_is_output_boundary",
        "text": "read necessarily identifies the next destination position in the output.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The pointer marks the frontier between completed observations and remaining input.",
      "mentalModelCorrection": "A read pointer usually advances input progress; it does not automatically describe output progress.",
      "mistakeTypes": [
        "read_pointer_region_misidentified"
      ],
      "nextAction": "State whether the item at read has already been processed before deciding when to increment it.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_write_pointer_role",
    "secondarySkillAtomIds": [
      "identify_next_output_position",
      "interpret_produced_prefix"
    ],
    "type": "single_choice",
    "prompt": "A pointer named write identifies the next position where an output item would be placed. What does [0, write) represent?",
    "options": [
      {
        "id": "completed_output_prefix",
        "text": "The output items already produced.",
        "isCorrect": true
      },
      {
        "id": "unprocessed_input",
        "text": "The input items not yet observed.",
        "isCorrect": false
      },
      {
        "id": "active_window",
        "text": "A candidate window whose validity is still undecided.",
        "isCorrect": false
      },
      {
        "id": "discarded_suffix",
        "text": "Only items permanently rejected from the result.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "write advances only after one output position has been completed.",
      "mentalModelCorrection": "The next-write position is an exclusive boundary for finalized output.",
      "mistakeTypes": [
        "write_pointer_prefix_misinterpreted"
      ],
      "nextAction": "Relate write to produced output count rather than total processed input.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_fast_slow_progression_roles",
    "secondarySkillAtomIds": [
      "distinguish_advancement_responsibilities",
      "reject_name_based_pattern_classification"
    ],
    "type": "single_choice",
    "prompt": "Two pointers are named slow and fast. What must be known before their algorithmic roles can be classified?",
    "options": [
      {
        "id": "advancement_conditions_and_state",
        "text": "What causes each pointer to advance and what progress or state each one represents.",
        "isCorrect": true
      },
      {
        "id": "names_are_sufficient",
        "text": "Nothing else; slow always means output and fast always means input.",
        "isCorrect": false
      },
      {
        "id": "distance_only",
        "text": "Only the numeric distance between the pointers.",
        "isCorrect": false
      },
      {
        "id": "array_length_only",
        "text": "Only the length of the input array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The same names can describe different traversal invariants in different algorithms.",
      "mentalModelCorrection": "Pointer semantics come from advancement rules and represented regions, not conventional variable names.",
      "mistakeTypes": [
        "fast_slow_names_assumed_to_define_roles"
      ],
      "nextAction": "Describe the event responsible for each pointer movement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-roles-boundaries-termination-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_pointer_role_throughout_algorithm",
    "secondarySkillAtomIds": [
      "maintain_stable_pointer_invariant",
      "diagnose_pointer_semantic_reassignment"
    ],
    "type": "mistake_review",
    "prompt": "At the start of a function, right means:\n\n\"the first unprocessed index.\"\n\nLater, without a new phase or invariant, the code begins using right as:\n\n\"the last valid index.\"\n\nWhat is the main review concern?",
    "options": [
      {
        "id": "meaning_changes_without_invariant",
        "text": "The same variable changes semantic roles without an explicit transition, making region and termination reasoning unreliable.",
        "isCorrect": true
      },
      {
        "id": "right_can_only_move_left",
        "text": "A variable named right is never allowed to move forward.",
        "isCorrect": false
      },
      {
        "id": "two_meanings_always_safe",
        "text": "A pointer may represent any region on each line without affecting correctness.",
        "isCorrect": false
      },
      {
        "id": "rename_only_required",
        "text": "Changing the variable name alone proves the logic correct.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The old and new meanings imply different valid ranges, updates, and termination conditions.",
      "mentalModelCorrection": "A pointer should retain one stable invariant within a phase; role transitions must be explicit and re-established.",
      "mistakeTypes": [
        "pointer_meaning_changes_mid_algorithm"
      ],
      "nextAction": "Split the logic into named phases or use separate variables with separately stated invariants.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_valid_array_scan_termination",
    "secondarySkillAtomIds": [
      "prevent_out_of_range_access",
      "interpret_next_unprocessed_index"
    ],
    "type": "single_choice",
    "prompt": "A forward pointer i identifies the next unprocessed array item.\n\nWhich loop condition safely processes every valid index exactly once?",
    "options": [
      {
        "id": "i_less_than_length",
        "text": "i < values.length",
        "isCorrect": true
      },
      {
        "id": "i_less_equal_length",
        "text": "i <= values.length",
        "isCorrect": false
      },
      {
        "id": "i_not_equal_negative_one",
        "text": "i !== -1",
        "isCorrect": false
      },
      {
        "id": "i_less_than_last_index",
        "text": "i < values.length - 1",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Valid array indexes range from 0 through length - 1.",
      "mentalModelCorrection": "An exclusive upper bound permits the last valid item and stops before index length.",
      "mistakeTypes": [
        "forward_scan_bound_off_by_one"
      ],
      "nextAction": "Write the exact valid index interval before choosing the loop comparison.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_out_of_range_boundary_access",
    "secondarySkillAtomIds": [
      "check_bounds_before_indexing",
      "distinguish_boundary_from_element"
    ],
    "type": "mistake_review",
    "prompt": "A loop uses:\n\nwhile (i <= values.length) {\n  process(values[i]);\n  i++;\n}\n\nWhat happens on the final iteration?",
    "options": [
      {
        "id": "reads_index_length",
        "text": "It attempts to process values[values.length], which is outside the valid index range.",
        "isCorrect": true
      },
      {
        "id": "processes_last_item_normally",
        "text": "It processes the final valid element at index values.length.",
        "isCorrect": false
      },
      {
        "id": "skips_first_item",
        "text": "It skips only index zero.",
        "isCorrect": false
      },
      {
        "id": "loop_never_runs",
        "text": "The condition is false for every non-empty array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Array length is an exclusive boundary, not a valid element index.",
      "mentalModelCorrection": "A pointer may legally equal an exclusive boundary only when the code does not index through it.",
      "mistakeTypes": [
        "exclusive_end_indexed_as_element"
      ],
      "nextAction": "Guard every element access with a condition proving the pointer is inside the valid index range.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-roles-boundaries-termination-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_pointer_meeting_and_crossing",
    "secondarySkillAtomIds": [
      "choose_termination_from_candidate_shape",
      "reason_about_remaining_region"
    ],
    "type": "single_choice",
    "prompt": "How should an algorithm decide whether its loop condition should be left < right or left <= right?",
    "options": [
      {
        "id": "depends_on_center_semantics",
        "text": "It depends on whether a single remaining center position is still a valid candidate that must be processed under the invariant.",
        "isCorrect": true
      },
      {
        "id": "always_less_than",
        "text": "Every two-pointer algorithm must use left < right.",
        "isCorrect": false
      },
      {
        "id": "always_less_equal",
        "text": "Every two-pointer algorithm must use left <= right.",
        "isCorrect": false
      },
      {
        "id": "pointer_names_decide",
        "text": "The choice depends only on whether the variables are named left and right.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Different contracts treat a one-position remainder differently.",
      "mentalModelCorrection": "Termination follows from the meaning of the remaining region, not a universal pointer convention.",
      "mistakeTypes": [
        "meeting_and_crossing_rules_generalized_without_contract"
      ],
      "nextAction": "Describe what candidate remains when the pointers meet.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-roles-boundaries-termination-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_premature_pointer_termination",
    "secondarySkillAtomIds": [
      "preserve_unprocessed_boundary_item",
      "review_loop_condition"
    ],
    "type": "mistake_review",
    "prompt": "A forward scan begins at index 0 and uses:\n\nwhile (i < values.length - 1) {\n  process(values[i]);\n  i++;\n}\n\nWhat is the principal bug?",
    "options": [
      {
        "id": "last_index_never_processed",
        "text": "The loop stops before processing the element at index values.length - 1.",
        "isCorrect": true
      },
      {
        "id": "first_index_processed_twice",
        "text": "The element at index 0 is processed twice.",
        "isCorrect": false
      },
      {
        "id": "reads_past_end",
        "text": "The loop accesses values[values.length].",
        "isCorrect": false
      },
      {
        "id": "works_only_for_empty",
        "text": "The loop is correct only for empty arrays.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The condition excludes the final valid index even though it remains unprocessed.",
      "mentalModelCorrection": "A termination condition must become false only after every required candidate has been handled.",
      "mistakeTypes": [
        "pointer_scan_terminates_before_last_item"
      ],
      "nextAction": "Test the loop condition at the first, last, and one-past-last positions.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-roles-boundaries-termination-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "guard_repeated_pointer_advancement",
    "secondarySkillAtomIds": [
      "check_bounds_inside_inner_loop",
      "prevent_pointer_crossing_access"
    ],
    "type": "mistake_review",
    "prompt": "An outer loop guarantees left < right. Inside it, this skip loop runs:\n\nwhile (shouldSkip(values[left])) {\n  left++;\n}\n\nWhy may the outer condition be insufficient for safety?",
    "options": [
      {
        "id": "inner_loop_can_cross_boundary",
        "text": "The inner loop may advance left repeatedly until it meets or crosses right before the outer condition is checked again.",
        "isCorrect": true
      },
      {
        "id": "outer_conditions_never_apply_inside",
        "text": "Outer loop conditions have no relationship to inner code.",
        "isCorrect": false
      },
      {
        "id": "left_cannot_move_inside_loop",
        "text": "Pointers may be advanced only in the outer loop body.",
        "isCorrect": false
      },
      {
        "id": "skip_function_changes_length",
        "text": "Every skip predicate necessarily changes the array length.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Repeated advancement can invalidate the bounds that were true at entry to the outer iteration.",
      "mentalModelCorrection": "Every loop that moves a pointer must independently preserve the conditions required for its next array access.",
      "mistakeTypes": [
        "inner_pointer_loop_uses_stale_bounds"
      ],
      "nextAction": "Include the relevant pointer relation in the inner loop condition.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-roles-boundaries-termination-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_inclusive_and_exclusive_right_boundaries",
    "secondarySkillAtomIds": [
      "maintain_consistent_boundary_convention",
      "derive_region_length"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two region conventions:\n\nA. Inclusive region [left, right].\nB. Half-open region [left, right).\n\nWhich length formulas are correct?",
    "options": [
      {
        "id": "inclusive_plus_one_half_open_difference",
        "text": "A has length right - left + 1; B has length right - left.",
        "isCorrect": true
      },
      {
        "id": "both_plus_one",
        "text": "Both have length right - left + 1.",
        "isCorrect": false
      },
      {
        "id": "both_difference",
        "text": "Both have length right - left.",
        "isCorrect": false
      },
      {
        "id": "inclusive_difference_half_open_plus_one",
        "text": "A has length right - left; B has length right - left + 1.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The inclusive convention contains both endpoints, while the half-open convention excludes right.",
      "mentalModelCorrection": "Length and termination formulas must follow one consistent boundary convention.",
      "mistakeTypes": [
        "inclusive_exclusive_boundary_conventions_mixed"
      ],
      "nextAction": "Write the first few concrete indexes represented by each interval.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-roles-boundaries-termination-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_mixed_boundary_conventions",
    "secondarySkillAtomIds": [
      "review_pointer_length_calculation",
      "maintain_consistent_region_semantics"
    ],
    "type": "mistake_review",
    "prompt": "An algorithm says right is exclusive and the current region is [left, right), but computes:\n\nconst length = right - left + 1;\n\nWhat is wrong?",
    "options": [
      {
        "id": "inclusive_formula_used",
        "text": "The formula treats right as included and overcounts the half-open region by one.",
        "isCorrect": true
      },
      {
        "id": "exclusive_regions_need_minus_one",
        "text": "The length should be right - left - 1.",
        "isCorrect": false
      },
      {
        "id": "right_cannot_be_exclusive",
        "text": "Pointers are never allowed to represent exclusive boundaries.",
        "isCorrect": false
      },
      {
        "id": "formula_always_correct",
        "text": "The formula is correct for every boundary convention.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A half-open interval contains exactly the indexes starting at left and ending before right.",
      "mentalModelCorrection": "Mixing inclusive formulas with exclusive semantics creates off-by-one output and termination errors.",
      "mistakeTypes": [
        "half_open_region_uses_inclusive_length"
      ],
      "nextAction": "Derive formulas from the explicitly declared interval notation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-roles-boundaries-termination-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_pointer_region_and_termination_invariant",
    "secondarySkillAtomIds": [
      "connect_pointer_roles_to_regions",
      "prove_valid_termination"
    ],
    "type": "invariant_identification",
    "prompt": "Which explanation most completely justifies pointer correctness and termination?",
    "options": [
      {
        "id": "roles_regions_progress_and_stop",
        "text": "Each pointer has one stable role, every region between or around the pointers has a defined meaning, each update preserves those meanings and makes progress, and termination occurs exactly when no required item or candidate remains.",
        "isCorrect": true
      },
      {
        "id": "two_indexes_move",
        "text": "Two index variables change during the loop.",
        "isCorrect": false
      },
      {
        "id": "loop_eventually_stops",
        "text": "The loop appears likely to stop on typical inputs.",
        "isCorrect": false
      },
      {
        "id": "names_match_convention",
        "text": "The variables use conventional names such as left, right, read, and write.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Correctness requires semantic preservation, bounded access, measurable progress, and an output-aligned stopping condition.",
      "mentalModelCorrection": "Pointer mechanics are safe only when roles, regions, updates, and termination form one coherent invariant.",
      "mistakeTypes": [
        "pointer_correctness_argument_incomplete"
      ],
      "nextAction": "For each pointer, state its role, legal range, movement event, preserved region, and terminal state.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
