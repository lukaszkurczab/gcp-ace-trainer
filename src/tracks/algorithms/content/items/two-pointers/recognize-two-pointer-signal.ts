import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeTwoPointerSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorted_pair_relationship_signal",
    "secondarySkillAtomIds": [
      "recognize_monotonic_candidate_elimination",
      "distinguish_pair_search_from_window"
    ],
    "type": "strategy_choice",
    "prompt": "A sorted array must be checked for two distinct values whose sum equals a target. Which signal most strongly supports a two-pointer strategy?",
    "options": [
      {
        "id": "sorted_pair_monotonicity",
        "text": "Changing the smaller or larger endpoint moves the pair sum predictably, allowing impossible candidates to be eliminated.",
        "isCorrect": true
      },
      {
        "id": "contiguous_range_state",
        "text": "Every value between two boundaries contributes to one maintained range aggregate.",
        "isCorrect": false
      },
      {
        "id": "single_target_position",
        "text": "The search asks for one target value at one unknown sorted index.",
        "isCorrect": false
      },
      {
        "id": "keyed_prior_lookup",
        "text": "The current value determines a key that should be looked up among previously seen values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The candidate is a relationship between two selected sorted values, and order provides a safe directional elimination rule.",
      "mentalModelCorrection": "Two pointers are justified by coordinated candidate elimination, not merely by the presence of a sorted array.",
      "mistakeTypes": [
        "sorted_pair_signal_not_recognized"
      ],
      "nextAction": "Explain how each comparison proves that one endpoint cannot belong to any remaining solution.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_symmetric_comparison_signal",
    "secondarySkillAtomIds": [
      "recognize_mirrored_positions",
      "distinguish_symmetry_from_pair_search"
    ],
    "type": "strategy_choice",
    "prompt": "A string must be checked by comparing characters in mirrored positions from the outside toward the center. Which strategy fits?",
    "options": [
      {
        "id": "opposite_end_symmetric_pointers",
        "text": "Use one pointer at each end and move both inward after each valid mirrored comparison.",
        "isCorrect": true
      },
      {
        "id": "sliding_window",
        "text": "Maintain a variable-size window whose complete interior determines validity.",
        "isCorrect": false
      },
      {
        "id": "binary_search",
        "text": "Repeatedly inspect the middle character and discard half of the string.",
        "isCorrect": false
      },
      {
        "id": "hash_grouping",
        "text": "Group characters by value and ignore their positions.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each position has one predetermined mirrored partner.",
      "mentalModelCorrection": "Symmetric comparison uses coordinated endpoints because correctness depends on positional correspondence, not on a range aggregate.",
      "mistakeTypes": [
        "symmetric_comparison_signal_missed"
      ],
      "nextAction": "Identify the unique counterpart associated with each current position.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_read_write_compaction_signal",
    "secondarySkillAtomIds": [
      "recognize_in_place_output_prefix",
      "distinguish_read_write_from_window"
    ],
    "type": "strategy_choice",
    "prompt": "An array must be filtered in place so retained values occupy a prefix while preserving encounter order. Which signal supports coordinated pointers?",
    "options": [
      {
        "id": "read_and_write_progress",
        "text": "One pointer scans source items while another marks the next output position.",
        "isCorrect": true
      },
      {
        "id": "pair_sum_relationship",
        "text": "Two endpoint values must be combined to reach a target.",
        "isCorrect": false
      },
      {
        "id": "active_contiguous_candidate",
        "text": "The complete region between two boundaries is one candidate whose state changes as it expands.",
        "isCorrect": false
      },
      {
        "id": "keyed_membership",
        "text": "Every current value should be looked up in a Set of prior values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Input progress and output progress are separate responsibilities.",
      "mentalModelCorrection": "Two pointers may coordinate source and destination positions even when no pair of values is compared.",
      "mistakeTypes": [
        "read_write_signal_not_recognized"
      ],
      "nextAction": "Ask whether one cursor consumes input while another grows a logical output region.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorted_merge_signal",
    "secondarySkillAtomIds": [
      "coordinate_ordered_inputs",
      "recognize_first_unconsumed_candidates"
    ],
    "type": "strategy_choice",
    "prompt": "Two individually sorted sequences must be merged into one sorted result. Which representation is the natural starting point?",
    "options": [
      {
        "id": "one_pointer_per_input",
        "text": "Maintain one pointer to the first unconsumed item in each input and consume the smaller current item.",
        "isCorrect": true
      },
      {
        "id": "one_global_sum",
        "text": "Maintain a scalar sum of all values from both inputs.",
        "isCorrect": false
      },
      {
        "id": "binary_search_each_output_slot",
        "text": "Binary-search both arrays independently for every output position.",
        "isCorrect": false
      },
      {
        "id": "set_union",
        "text": "Insert all values into a Set, even though duplicates and sorted output must be preserved.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each sorted suffix exposes its smallest remaining candidate at its pointer.",
      "mentalModelCorrection": "Coordinated pointers are appropriate when progress must be synchronized across multiple ordered sources.",
      "mistakeTypes": [
        "sorted_merge_signal_not_recognized"
      ],
      "nextAction": "Identify the next unconsumed candidate from each source.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_partition_boundary_signal",
    "secondarySkillAtomIds": [
      "separate_processed_and_unprocessed_regions",
      "recognize_output_boundary"
    ],
    "type": "strategy_choice",
    "prompt": "An in-place pass must place values satisfying a predicate before a returned boundary. Which two-pointer signal is present?",
    "options": [
      {
        "id": "scan_and_partition_boundary",
        "text": "One pointer scans unclassified values while another marks the boundary of the accepted region.",
        "isCorrect": true
      },
      {
        "id": "mirrored_positions",
        "text": "The pointers identify symmetric positions around the center.",
        "isCorrect": false
      },
      {
        "id": "binary_half_discard",
        "text": "A midpoint comparison discards half of the remaining search interval.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_two_indexes",
        "text": "Any two indexes are sufficient because partitioning is defined by pointer count.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The algorithm maintains semantic regions whose boundary changes as observations are classified.",
      "mentalModelCorrection": "Partition pointers are justified by region ownership and placement responsibility.",
      "mistakeTypes": [
        "partition_pointer_signal_missed"
      ],
      "nextAction": "Name the accepted, processed, and unprocessed regions.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-two-pointer-signal-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_monotonic_candidate_elimination_signal",
    "secondarySkillAtomIds": [
      "require_safe_pointer_movement",
      "distinguish_elimination_from_trial_and_error"
    ],
    "type": "single_choice",
    "prompt": "Which property most strongly justifies moving coordinated pointers without revisiting discarded positions?",
    "options": [
      {
        "id": "monotonic_elimination_rule",
        "text": "Each comparison proves that a whole set of candidates involving one pointer position cannot satisfy the contract.",
        "isCorrect": true
      },
      {
        "id": "two_variables_exist",
        "text": "The implementation contains exactly two index variables.",
        "isCorrect": false
      },
      {
        "id": "input_is_large",
        "text": "The input is large enough that nested loops seem undesirable.",
        "isCorrect": false
      },
      {
        "id": "pointer_names",
        "text": "The variables are named left and right.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A pointer movement permanently removes candidates while preserving every possible solution.",
      "mentalModelCorrection": "Two-pointer correctness comes from a safe elimination invariant, not from syntax or performance hopes.",
      "mistakeTypes": [
        "two_pointer_signal_based_on_variable_count"
      ],
      "nextAction": "State which candidates become impossible after each movement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_two_pointers_from_sliding_window",
    "secondarySkillAtomIds": [
      "recognize_active_range_state",
      "recognize_independent_pointer_roles"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two tasks:\n\nA. Find two sorted values whose relationship satisfies a target.\nB. Find the longest contiguous range satisfying a condition over every value inside it.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "pair_two_pointers_range_window",
        "text": "A suggests pair-oriented two pointers; B suggests a sliding window with maintained range state.",
        "isCorrect": true
      },
      {
        "id": "both_pair_pointers",
        "text": "Both use endpoint pair comparison because both may contain variables named left and right.",
        "isCorrect": false
      },
      {
        "id": "both_windows",
        "text": "Both are sliding windows because every pair of indexes encloses an interval.",
        "isCorrect": false
      },
      {
        "id": "window_for_pair",
        "text": "A requires a sliding window, while B requires independent endpoint candidates.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The first objective depends on selected positions; the second depends on the complete contiguous interior.",
      "mentalModelCorrection": "Classify the semantic candidate before classifying the pointer pattern.",
      "mistakeTypes": [
        "two_pointers_and_window_conflated"
      ],
      "nextAction": "List which input elements contribute to evaluating one current candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_two_pointers_from_binary_search",
    "secondarySkillAtomIds": [
      "recognize_half_discard_rule",
      "recognize_boundary_progression"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two sorted-input signals:\n\nA. One midpoint comparison determines which half cannot contain the answer.\nB. Two current candidates move monotonically while eliminating endpoint possibilities.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "binary_then_two_pointer",
        "text": "A suggests binary search; B suggests coordinated pointers.",
        "isCorrect": true
      },
      {
        "id": "two_pointer_then_binary",
        "text": "A suggests two pointers; B suggests binary search.",
        "isCorrect": false
      },
      {
        "id": "both_binary",
        "text": "Both are binary search because sorted order is involved.",
        "isCorrect": false
      },
      {
        "id": "both_two_pointer",
        "text": "Both are two pointers because each algorithm tracks interval boundaries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Binary search discards a fraction through a midpoint predicate; two pointers coordinate moving candidate positions.",
      "mentalModelCorrection": "Sorted input alone does not determine the strategy. The legal discard rule does.",
      "mistakeTypes": [
        "binary_search_and_two_pointer_signals_conflated"
      ],
      "nextAction": "Ask whether progress comes from midpoint halving or endpoint/cursor advancement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-two-pointer-signal-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_two_pointers_from_nested_enumeration",
    "secondarySkillAtomIds": [
      "recognize_absence_of_monotonic_elimination",
      "avoid_forcing_pointer_strategy"
    ],
    "type": "strategy_choice",
    "prompt": "A task must examine every pair because its arbitrary pair predicate provides no ordering or monotonic rule for discarding candidates. What is the best assessment?",
    "options": [
      {
        "id": "two_pointer_signal_absent",
        "text": "A standard two-pointer strategy is not justified; explicit pair enumeration or another problem-specific structure may be necessary.",
        "isCorrect": true
      },
      {
        "id": "two_indexes_make_two_pointers",
        "text": "Two nested loop indexes already prove that the algorithm is a two-pointer optimization.",
        "isCorrect": false
      },
      {
        "id": "move_ends_randomly",
        "text": "Start at both ends and move arbitrary pointers until all pairs have somehow been covered.",
        "isCorrect": false
      },
      {
        "id": "binary_search_predicate",
        "text": "Any pair predicate automatically supports binary search.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "No comparison safely eliminates a structured set of untested pairs.",
      "mentalModelCorrection": "Two pointers do not replace enumeration unless the problem supplies a monotonic progression or region invariant.",
      "mistakeTypes": [
        "two_pointers_forced_without_elimination_rule"
      ],
      "nextAction": "Explain why a moved pointer position can never be needed again.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_two_pointers_from_hash_lookup",
    "secondarySkillAtomIds": [
      "recognize_keyed_prior_state",
      "recognize_sorted_elimination"
    ],
    "type": "solution_comparison",
    "prompt": "Two pair-search descriptions are given:\n\nA. For each current value, look up the required prior partner by key.\nB. On sorted values, compare endpoint candidates and discard one endpoint using order.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "hash_then_two_pointer",
        "text": "A suggests keyed hash state; B suggests two pointers.",
        "isCorrect": true
      },
      {
        "id": "two_pointer_then_hash",
        "text": "A suggests two pointers; B suggests hash lookup.",
        "isCorrect": false
      },
      {
        "id": "both_hash",
        "text": "Both require a Map because all pair problems use keyed state.",
        "isCorrect": false
      },
      {
        "id": "both_two_pointer",
        "text": "Both are two-pointer strategies because both process one current value at a time.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "One strategy retrieves a partner from stored keyed state; the other eliminates candidates through sorted positional movement.",
      "mentalModelCorrection": "Similar output goals may support different state and movement models.",
      "mistakeTypes": [
        "hash_and_two_pointer_signals_conflated"
      ],
      "nextAction": "Ask whether the partner is retrieved by key or reached through ordered pointer movement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-two-pointer-signal-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_arbitrary_two_index_classification",
    "secondarySkillAtomIds": [
      "require_coordinated_pointer_roles",
      "classify_by_invariant_not_syntax"
    ],
    "type": "mistake_review",
    "prompt": "A reviewer says:\n\n\"The algorithm uses indexes i and j, so it is a two-pointer algorithm.\"\n\nWhat is the best correction?",
    "options": [
      {
        "id": "coordination_and_invariant_required",
        "text": "Two indexes count as a meaningful two-pointer technique only when their coordinated roles and movements maintain a useful invariant or eliminate candidates.",
        "isCorrect": true
      },
      {
        "id": "names_must_be_left_right",
        "text": "It is two pointers only if the variables are renamed left and right.",
        "isCorrect": false
      },
      {
        "id": "all_nested_loops_are_two_pointer",
        "text": "The statement is correct because every pair of loop indexes is a two-pointer optimization.",
        "isCorrect": false
      },
      {
        "id": "exactly_opposite_directions",
        "text": "Two pointers are valid only when one moves right and the other moves left.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Pattern identity depends on semantics and coordination rather than variable count.",
      "mentalModelCorrection": "Two-pointer techniques include several movement shapes, but each needs stable pointer responsibilities.",
      "mistakeTypes": [
        "arbitrary_two_indexes_called_two_pointers"
      ],
      "nextAction": "Describe how the movement of one pointer changes what the other pointer may still need to consider.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-two-pointer-signal-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_same_direction_coordination_signal",
    "secondarySkillAtomIds": [
      "recognize_progress_frontiers",
      "reject_opposite_direction_only_definition"
    ],
    "type": "single_choice",
    "prompt": "Which task can legitimately use two pointers that both move left to right?",
    "options": [
      {
        "id": "merge_or_read_write",
        "text": "Coordinating two sorted inputs or separating input progress from output progress.",
        "isCorrect": true
      },
      {
        "id": "only_palindrome",
        "text": "Only mirrored palindrome comparison.",
        "isCorrect": false
      },
      {
        "id": "none",
        "text": "None; two-pointer algorithms require opposite movement.",
        "isCorrect": false
      },
      {
        "id": "binary_midpoint",
        "text": "Repeatedly checking a midpoint and discarding half.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Pointers may represent separate monotonic progress frontiers rather than opposite endpoints.",
      "mentalModelCorrection": "Two-pointer is a broader coordination pattern, not a synonym for inward movement.",
      "mistakeTypes": [
        "two_pointers_defined_as_opposite_direction_only"
      ],
      "nextAction": "Classify each pointer by responsibility rather than direction alone.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-two-pointer-signal-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_pointer_precondition_signal",
    "secondarySkillAtomIds": [
      "verify_sorted_or_structural_precondition",
      "avoid_using_pointer_rule_without_support"
    ],
    "type": "mistake_review",
    "prompt": "A candidate proposes endpoint movement because it worked on several examples, but cannot identify any sorted, symmetric, or region-based invariant. What is the main concern?",
    "options": [
      {
        "id": "no_safe_movement_basis",
        "text": "There is no demonstrated reason that discarded positions can never be part of a valid solution.",
        "isCorrect": true
      },
      {
        "id": "more_examples_needed_only",
        "text": "The strategy becomes correct after testing enough random examples.",
        "isCorrect": false
      },
      {
        "id": "pointers_need_hash_map",
        "text": "Every two-pointer algorithm must also maintain a hash table.",
        "isCorrect": false
      },
      {
        "id": "must_move_both",
        "text": "The only missing requirement is that both pointers move on every iteration.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Pointer movement permanently changes the candidate space.",
      "mentalModelCorrection": "Empirical success does not replace a structural argument for safe elimination or region preservation.",
      "mistakeTypes": [
        "pointer_strategy_selected_by_examples_only"
      ],
      "nextAction": "Identify the input property that makes every movement irreversible and safe.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-two-pointer-signal-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "classify_two_pointer_signal_by_roles",
    "secondarySkillAtomIds": [
      "recognize_two_pointer_families",
      "distinguish_pointer_roles_from_surface_shape"
    ],
    "type": "solution_comparison",
    "prompt": "Match each task to its pointer signal:\n\nA. Compare mirrored string positions.\nB. Merge two sorted inputs.\nC. Compact accepted values in place.\nD. Search sorted endpoints using monotonic elimination.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "symmetric_source_source_read_write_endpoints",
        "text": "A: opposite mirrored positions; B: one unconsumed pointer per source; C: read/write progress; D: endpoint candidate elimination.",
        "isCorrect": true
      },
      {
        "id": "all_windows",
        "text": "All four are sliding windows because each can use two indexes.",
        "isCorrect": false
      },
      {
        "id": "all_pair_search",
        "text": "All four compare two independently selected values as a pair.",
        "isCorrect": false
      },
      {
        "id": "all_binary_search",
        "text": "All four are binary search because their candidate regions become smaller.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The tasks share coordinated pointer movement but assign different semantic roles to those pointers.",
      "mentalModelCorrection": "Recognize the broad pattern first, then classify the specific roles and invariant.",
      "mistakeTypes": [
        "two_pointer_role_families_conflated"
      ],
      "nextAction": "For each task, name what each pointer identifies and why it moves.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
