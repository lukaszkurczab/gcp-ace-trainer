import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const taxonomyAndPointerRoleSemanticsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_two_pointer_window_taxonomy",
    "secondarySkillAtomIds": [
      "recognize_sliding_window_specialization",
      "classify_pointer_techniques_by_semantics"
    ],
    "type": "single_choice",
    "prompt": "Which statement best describes the relationship between two pointers and sliding window?",
    "options": [
      {
        "id": "window_specialized_two_boundaries",
        "text": "Sliding window is a specialized two-boundary technique in which the boundaries represent one current contiguous range with maintained state.",
        "isCorrect": true
      },
      {
        "id": "fully_disjoint",
        "text": "They are disjoint categories because a sliding window does not use pointers.",
        "isCorrect": false
      },
      {
        "id": "fully_identical",
        "text": "They are identical categories because every algorithm with two indexes maintains a window.",
        "isCorrect": false
      },
      {
        "id": "names_distinguish",
        "text": "They differ only in naming: left and right indicate sliding window, while other names indicate two pointers.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sliding window has the additional semantic requirement that two boundaries describe one maintained contiguous range.",
      "mentalModelCorrection": "Two pointers is a broader family. Sliding window is one possible interpretation of two moving boundaries, not a separate implementation shape.",
      "mistakeTypes": [
        "two_pointers_and_window_treated_as_disjoint"
      ],
      "nextAction": "Classify the represented state before deciding whether the narrower sliding-window label applies.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_overbroad_sliding_window_classification",
    "secondarySkillAtomIds": [
      "interpret_pointer_roles",
      "reject_surface_syntax_classification"
    ],
    "type": "mistake_review",
    "prompt": "A learner says:\n\n\"Any algorithm with two moving indexes is a sliding-window algorithm.\"\n\nWhat is the most precise correction?",
    "options": [
      {
        "id": "roles_may_not_be_boundaries",
        "text": "Two indexes may instead represent independent candidates, read/write positions, different traversal speeds, or source/destination positions; only some pairs bound one maintained window.",
        "isCorrect": true
      },
      {
        "id": "all_same_direction_are_windows",
        "text": "The statement is wrong only for opposite-direction pointers; every same-direction pair is a window.",
        "isCorrect": false
      },
      {
        "id": "window_requires_three_indexes",
        "text": "Sliding window requires at least three indexes, so no two-index algorithm can qualify.",
        "isCorrect": false
      },
      {
        "id": "variable_names_decide",
        "text": "The statement becomes correct whenever the indexes are named left and right.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The same number of indexes can support several different invariants and algorithmic roles.",
      "mentalModelCorrection": "Pattern identity comes from what the indexes mean, not from counting how many variables move.",
      "mistakeTypes": [
        "every_two_pointer_loop_called_window"
      ],
      "nextAction": "Explain the responsibility of each pointer and the meaning of any region between them.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "infer_pointer_roles_from_operations",
    "secondarySkillAtomIds": [
      "recognize_read_write_roles",
      "reject_pointer_name_semantics"
    ],
    "type": "code_reading",
    "prompt": "Consider:\n\nlet left = 0;\n\nfor (let right = 0; right < values.length; right++) {\n  if (shouldKeep(values[right])) {\n    values[left] = values[right];\n    left++;\n  }\n}\n\nWhat roles do left and right actually have?",
    "options": [
      {
        "id": "left_write_right_read",
        "text": "left is the next write position, and right is the read position scanning observations.",
        "isCorrect": true
      },
      {
        "id": "window_boundaries",
        "text": "left and right are boundaries of one valid contiguous window.",
        "isCorrect": false
      },
      {
        "id": "independent_pair",
        "text": "left and right are independent candidate elements being tested as a pair.",
        "isCorrect": false
      },
      {
        "id": "left_source_right_destination",
        "text": "left reads the source value, and right identifies where the value should be written.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "right inspects each input element, while left advances only when an output element is produced.",
      "mentalModelCorrection": "Names such as left and right do not force boundary semantics. Operations reveal that these are read/write roles.",
      "mistakeTypes": [
        "pointer_names_assumed_to_determine_role"
      ],
      "nextAction": "Describe which pointer consumes input and which pointer grows the output.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_same_direction_roles_from_window_boundaries",
    "secondarySkillAtomIds": [
      "interpret_same_direction_pointer_movement",
      "recognize_absence_of_window_state"
    ],
    "type": "single_choice",
    "prompt": "Two pointers move from left to right through the same array. What is required before classifying them as sliding-window boundaries?",
    "options": [
      {
        "id": "range_has_semantic_state",
        "text": "The algorithm must treat the contiguous region between them as one current candidate and maintain state describing that region.",
        "isCorrect": true
      },
      {
        "id": "same_direction_is_enough",
        "text": "Nothing else; same-direction movement automatically defines a sliding window.",
        "isCorrect": false
      },
      {
        "id": "distance_changes",
        "text": "Their distance only needs to change during execution.",
        "isCorrect": false
      },
      {
        "id": "left_moves_less",
        "text": "The pointer named left must move fewer times than the pointer named right.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sliding-window boundaries jointly represent a range whose complete contents matter.",
      "mentalModelCorrection": "Movement direction and pointer distance are insufficient without a range-level invariant.",
      "mistakeTypes": [
        "same_direction_pair_automatically_called_window"
      ],
      "nextAction": "Identify whether any maintained state corresponds exactly to the elements inside the pointer interval.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_independent_candidates_from_boundaries",
    "secondarySkillAtomIds": [
      "interpret_endpoint_candidate_pair",
      "interpret_active_contiguous_range"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two algorithms:\n\nA. It evaluates only values[left] and values[right] as the current candidate pair.\n\nB. It maintains a sum representing every element from left through right.\n\nWhich interpretation is correct?",
    "options": [
      {
        "id": "a_pair_b_window",
        "text": "A uses independent candidate positions; B uses boundaries of one current sliding window.",
        "isCorrect": true
      },
      {
        "id": "both_windows",
        "text": "Both are sliding windows because both have an interval between left and right.",
        "isCorrect": false
      },
      {
        "id": "both_pairs",
        "text": "Both evaluate only two independent candidates because only two pointers are stored.",
        "isCorrect": false
      },
      {
        "id": "a_window_b_read_write",
        "text": "A is a sliding window, while B is a read/write compaction technique.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The decisive difference is whether the interior contributes to the represented candidate state.",
      "mentalModelCorrection": "An interval can be merely a search region in one algorithm and the actual candidate range in another.",
      "mistakeTypes": [
        "candidate_pair_and_window_boundaries_conflated"
      ],
      "nextAction": "List every input position that contributes to the current candidate evaluation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_slow_fast_pointer_roles",
    "secondarySkillAtomIds": [
      "distinguish_traversal_roles_from_window",
      "infer_roles_from_advancement_conditions"
    ],
    "type": "code_reading",
    "prompt": "An array scan uses two indexes:\n\n- fast advances after every observation,\n- slow advances only when the observation satisfies a condition.\n\nWhich semantic description is strongest?",
    "options": [
      {
        "id": "fast_scans_slow_tracks_progress",
        "text": "fast scans the input, while slow tracks a more selective form of progress such as retained output or the next processed position.",
        "isCorrect": true
      },
      {
        "id": "variable_window",
        "text": "slow and fast necessarily bound a variable-size sliding window.",
        "isCorrect": false
      },
      {
        "id": "independent_pair",
        "text": "slow and fast are independent pair candidates because they may point to different values.",
        "isCorrect": false
      },
      {
        "id": "fixed_window",
        "text": "Their distance is the required fixed window size.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The pointers differ by advancement policy and operational responsibility.",
      "mentalModelCorrection": "Names such as slow and fast describe traversal behavior, but do not imply that the region between them is an active candidate.",
      "mistakeTypes": [
        "slow_fast_pair_treated_as_window"
      ],
      "nextAction": "State what event causes each pointer to advance and what progress that movement represents.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_source_destination_pointer_roles",
    "secondarySkillAtomIds": [
      "distinguish_copying_roles_from_window",
      "name_pointer_responsibilities"
    ],
    "type": "single_choice",
    "prompt": "A transformation copies selected elements from source[sourceIndex] into destination[destinationIndex].\n\nHow should the two indexes be interpreted?",
    "options": [
      {
        "id": "source_and_destination_positions",
        "text": "They identify a source observation and a destination output slot; they do not jointly bound one candidate window.",
        "isCorrect": true
      },
      {
        "id": "window_boundaries",
        "text": "They are boundaries of a window spanning both arrays.",
        "isCorrect": false
      },
      {
        "id": "endpoint_pair",
        "text": "They are independent values being tested for a pair relationship.",
        "isCorrect": false
      },
      {
        "id": "discarded_interval",
        "text": "Every position numerically between the two indexes is a discarded region.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each index belongs to a different side of a data transfer.",
      "mentalModelCorrection": "Pointer roles may describe data flow rather than boundaries within one shared candidate range.",
      "mistakeTypes": [
        "source_destination_roles_called_window"
      ],
      "nextAction": "Name which data structure each pointer indexes and whether any shared interval exists at all.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_active_window_invariant",
    "secondarySkillAtomIds": [
      "name_represented_region",
      "align_window_state_with_boundaries"
    ],
    "type": "invariant_identification",
    "prompt": "Which invariant most clearly identifies left and right as sliding-window boundaries?",
    "options": [
      {
        "id": "state_matches_inclusive_range",
        "text": "The maintained state describes exactly the elements at indexes left through right, and the current candidate is that contiguous range.",
        "isCorrect": true
      },
      {
        "id": "left_not_greater_than_right",
        "text": "left is never greater than right.",
        "isCorrect": false
      },
      {
        "id": "both_move_forward",
        "text": "Both indexes move only forward.",
        "isCorrect": false
      },
      {
        "id": "distance_records_rejections",
        "text": "The distance between the indexes equals the number of rejected observations.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A window invariant binds both the represented range and the state maintained for that range.",
      "mentalModelCorrection": "Ordering and monotonic movement are common mechanics, but they do not define window semantics.",
      "mistakeTypes": [
        "window_invariant_not_stated"
      ],
      "nextAction": "Name both the current range and the state guaranteed to correspond to it.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_processed_prefix_invariant",
    "secondarySkillAtomIds": [
      "interpret_write_pointer",
      "distinguish_processed_prefix_from_active_candidate"
    ],
    "type": "invariant_identification",
    "prompt": "In a read/write transformation, write is the number of accepted elements produced so far.\n\nWhich invariant best describes [0, write)?",
    "options": [
      {
        "id": "completed_output_prefix",
        "text": "It is the completed logical output prefix containing accepted observations in their required order.",
        "isCorrect": true
      },
      {
        "id": "active_candidate_window",
        "text": "It is the current candidate window whose validity may still change.",
        "isCorrect": false
      },
      {
        "id": "discarded_prefix",
        "text": "It contains only rejected values that can no longer be used.",
        "isCorrect": false
      },
      {
        "id": "unprocessed_prefix",
        "text": "It contains values that the read pointer has not yet observed.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "write represents produced output length rather than a movable range boundary.",
      "mentalModelCorrection": "A finalized processed prefix is structurally different from an active window that may continue changing.",
      "mistakeTypes": [
        "processed_prefix_called_active_window"
      ],
      "nextAction": "State whether the region is finalized output, a current candidate, or unprocessed input.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_region_between_read_and_write",
    "secondarySkillAtomIds": [
      "name_discarded_or_overwritable_region",
      "reject_automatic_window_interpretation"
    ],
    "type": "mistake_review",
    "prompt": "During in-place filtering, read is ahead of write.\n\nA reviewer calls [write, read) the current active window. What is missing from that claim?",
    "options": [
      {
        "id": "region_has_no_candidate_invariant",
        "text": "The reviewer has not shown that the region is one candidate or that any maintained state describes all of it; it may simply be rejected or overwritable space.",
        "isCorrect": true
      },
      {
        "id": "window_must_be_closed",
        "text": "The only problem is that a window must use a closed interval rather than a half-open interval.",
        "isCorrect": false
      },
      {
        "id": "read_must_be_left",
        "text": "The names are reversed because the pointer farther right must be called left.",
        "isCorrect": false
      },
      {
        "id": "distance_too_large",
        "text": "The region becomes a window only when its length is at most two.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A numerical interval exists, but no range-level candidate meaning has been established.",
      "mentalModelCorrection": "Not every area between two indexes is algorithmically meaningful as a window.",
      "mistakeTypes": [
        "pointer_gap_assumed_to_be_active_window"
      ],
      "nextAction": "Describe what the region contains and whether the algorithm evaluates or maintains it as one unit.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "classify_renamed_pointer_roles",
    "secondarySkillAtomIds": [
      "infer_semantics_independent_of_names",
      "recognize_window_boundaries"
    ],
    "type": "code_reading",
    "prompt": "An algorithm uses variables named start and cursor. It maintains currentSum as the sum of every element from start through cursor.\n\nHow should start and cursor be classified?",
    "options": [
      {
        "id": "window_boundaries_despite_names",
        "text": "They are sliding-window boundaries because their shared range is the current candidate represented by currentSum.",
        "isCorrect": true
      },
      {
        "id": "not_window_without_left_right",
        "text": "They cannot be window boundaries because they are not named left and right.",
        "isCorrect": false
      },
      {
        "id": "read_write_positions",
        "text": "start is a destination position and cursor is a source position.",
        "isCorrect": false
      },
      {
        "id": "independent_candidates",
        "text": "They are independent pair candidates because two separate indexes are involved.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The maintained sum corresponds to the complete contiguous region between the two indexes.",
      "mentalModelCorrection": "Semantic invariants remain the same even when pointer variables use different names.",
      "mistakeTypes": [
        "nonstandard_names_hide_window_roles"
      ],
      "nextAction": "Replace variable names mentally with descriptions of the state they delimit.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_pointer_semantics_across_algorithms",
    "secondarySkillAtomIds": [
      "distinguish_search_region_from_active_range",
      "distinguish_output_prefix_from_active_range"
    ],
    "type": "solution_comparison",
    "prompt": "Three algorithms each use two indexes:\n\nA. The indexes identify the two values currently compared as a candidate pair.\n\nB. The indexes bound a contiguous range represented by a maintained count.\n\nC. One index scans input while the other marks the next output position.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "pair_window_read_write",
        "text": "A uses independent candidates, B uses sliding-window boundaries, and C uses read/write roles.",
        "isCorrect": true
      },
      {
        "id": "all_windows",
        "text": "All three are sliding windows because every pair of indexes encloses a range.",
        "isCorrect": false
      },
      {
        "id": "all_independent",
        "text": "All three use independent candidates because the indexes may contain different values.",
        "isCorrect": false
      },
      {
        "id": "window_pair_source_destination",
        "text": "A uses a window, B uses independent candidates, and C uses opposite-end pair elimination.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each algorithm assigns a different invariant and responsibility to its indexes.",
      "mentalModelCorrection": "Identical surface structures can encode different algorithmic abstractions.",
      "mistakeTypes": [
        "pointer_role_taxonomy_conflated"
      ],
      "nextAction": "Classify each pointer pair by current candidate meaning, maintained state, and movement responsibility.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_pointer_region_semantics_explicitly",
    "secondarySkillAtomIds": [
      "differentiate_active_processed_and_discarded_regions",
      "write_algorithm_invariants"
    ],
    "type": "single_choice",
    "prompt": "Which explanation gives the most useful semantic account of a two-pointer algorithm?",
    "options": [
      {
        "id": "roles_regions_and_invariant",
        "text": "right scans new observations, left marks the beginning of the current candidate range, and the maintained state corresponds exactly to [left, right].",
        "isCorrect": true
      },
      {
        "id": "two_variables_move",
        "text": "The algorithm has two variables, and both of them move.",
        "isCorrect": false
      },
      {
        "id": "left_before_right",
        "text": "left usually remains numerically smaller than right.",
        "isCorrect": false
      },
      {
        "id": "names_show_pattern",
        "text": "The variables are named left and right, so the algorithm is a sliding window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A useful explanation identifies responsibilities, represented regions, and correspondence between state and indexes.",
      "mentalModelCorrection": "Mechanical observations do not explain why the pointers exist or what correctness invariant they maintain.",
      "mistakeTypes": [
        "pointer_roles_described_only_syntactically"
      ],
      "nextAction": "State what each pointer controls and what every relevant array region currently means.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-taxonomy-pointer-role-semantics-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "classify_algorithm_from_pointer_invariant",
    "secondarySkillAtomIds": [
      "understand_two_pointer_window_taxonomy",
      "interpret_pointer_roles"
    ],
    "type": "mistake_review",
    "prompt": "A code review says:\n\n\"This is not a two-pointer algorithm because it is a sliding window.\"\n\nWhat is the best response?",
    "options": [
      {
        "id": "labels_can_overlap",
        "text": "The labels can overlap: if two moving boundaries represent one maintained contiguous range, the algorithm is both a two-pointer technique and, more specifically, a sliding window.",
        "isCorrect": true
      },
      {
        "id": "review_is_correct",
        "text": "The review is correct because an algorithm must belong to exactly one pattern category.",
        "isCorrect": false
      },
      {
        "id": "window_not_two_boundaries",
        "text": "Sliding window is unrelated to pointer movement and therefore cannot be a two-pointer technique.",
        "isCorrect": false
      },
      {
        "id": "depends_on_names",
        "text": "It is two pointers only when the variables are explicitly named pointerOne and pointerTwo.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "One label describes the broad mechanism, while the other describes a more specific represented state.",
      "mentalModelCorrection": "Algorithmic pattern categories may be hierarchical rather than mutually exclusive.",
      "mistakeTypes": [
        "pattern_categories_assumed_mutually_exclusive"
      ],
      "nextAction": "Use the broadest valid category and then add the more specific semantic classification.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
