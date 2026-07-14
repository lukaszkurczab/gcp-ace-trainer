import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeSlidingWindowSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_contiguous_active_interval_signal",
    "secondarySkillAtomIds": [
      "recognize_incremental_window_state",
      "distinguish_window_from_selected_positions"
    ],
    "type": "single_choice",
    "prompt": "Which problem property most strongly suggests a sliding-window strategy?",
    "options": [
      {
        "id": "contiguous_candidate_with_incremental_state",
        "text": "The candidate is one contiguous interval, and its state can be updated when an element enters or leaves.",
        "isCorrect": true
      },
      {
        "id": "two_selected_values",
        "text": "Only two independently selected values determine the candidate.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_range_queries",
        "text": "Many unrelated range queries must be answered after preprocessing.",
        "isCorrect": false
      },
      {
        "id": "noncontiguous_selection",
        "text": "The result may freely skip positions inside its first and last selected indexes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A window represents every element in one active contiguous interval whose boundaries move through the input.",
      "mentalModelCorrection": "Two boundaries alone do not define a sliding window; the complete interval and its maintained state must form the current candidate.",
      "mistakeTypes": [
        "sliding_window_signal_not_recognized"
      ],
      "nextAction": "Identify whether every position between the boundaries belongs to the current candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_fixed_size_window_signal",
    "secondarySkillAtomIds": [
      "recognize_complete_length_k_windows",
      "recognize_rolling_aggregate_opportunity"
    ],
    "type": "single_choice",
    "prompt": "A task asks for the maximum sum among every contiguous block of exactly k elements. Which signal is present?",
    "options": [
      {
        "id": "fixed_size_rolling_window",
        "text": "Each candidate is a complete length-k interval, and consecutive candidates differ by one outgoing and one incoming element.",
        "isCorrect": true
      },
      {
        "id": "opposite_end_pair_search",
        "text": "Only the first and last values of the array should be compared as a pair.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_prefix_queries",
        "text": "The task consists of unrelated range queries supplied independently.",
        "isCorrect": false
      },
      {
        "id": "noncontiguous_k_selection",
        "text": "Any k values may be selected while skipping positions.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The candidate length is fixed, and adjacent candidates overlap in k - 1 positions.",
      "mentalModelCorrection": "Fixed-size windows should usually reuse state rather than recompute each complete block.",
      "mistakeTypes": [
        "fixed_size_window_signal_missed"
      ],
      "nextAction": "Name the value leaving and the value entering when the interval shifts once.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_sliding_window_from_prefix_sums",
    "secondarySkillAtomIds": [
      "recognize_dynamic_active_interval",
      "recognize_independent_range_queries"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two tasks:\n\nA. Find the longest contiguous segment satisfying a condition while moving through the array.\nB. Answer thousands of independent sum queries for arbitrary ranges.\n\nWhich classification is correct?",
    "options": [
      {
        "id": "window_then_prefix_sums",
        "text": "A suggests a sliding window; B suggests prefix sums.",
        "isCorrect": true
      },
      {
        "id": "prefix_then_window",
        "text": "A suggests prefix sums; B suggests a sliding window.",
        "isCorrect": false
      },
      {
        "id": "both_windows",
        "text": "Both are sliding-window problems because both involve ranges.",
        "isCorrect": false
      },
      {
        "id": "both_pair_searches",
        "text": "Both are pair-oriented two-pointer problems because each range has two boundaries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A evolves one active candidate interval; B evaluates unrelated requested intervals from precomputed cumulative state.",
      "mentalModelCorrection": "Sliding windows traverse overlapping candidates, while prefix sums provide direct aggregate access for arbitrary ranges.",
      "mistakeTypes": [
        "sliding_window_and_prefix_sums_conflated"
      ],
      "nextAction": "Ask whether the boundaries evolve as one scan or arrive as independent queries.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_sliding_window_from_pair_two_pointers",
    "secondarySkillAtomIds": [
      "recognize_interval_candidate",
      "recognize_endpoint_pair_candidate"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two candidate definitions:\n\nA. Every value between left and right contributes to the maintained condition.\nB. Only values[left] and values[right] form the current candidate.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "window_then_pair_pointers",
        "text": "A describes a sliding window; B describes pair-oriented two pointers.",
        "isCorrect": true
      },
      {
        "id": "both_windows",
        "text": "Both describe sliding windows because both use left and right.",
        "isCorrect": false
      },
      {
        "id": "both_pair_pointers",
        "text": "Both describe endpoint-pair searches because each candidate has two boundaries.",
        "isCorrect": false
      },
      {
        "id": "prefix_then_binary",
        "text": "A describes prefix sums; B describes binary search.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A evaluates the complete contiguous interior, while B evaluates two selected positions.",
      "mentalModelCorrection": "Classify the semantic candidate rather than the names or number of pointer variables.",
      "mistakeTypes": [
        "sliding_window_and_pair_two_pointers_conflated"
      ],
      "nextAction": "List which input elements participate in evaluating one current candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-sliding-window-signal-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_when_window_elimination_is_unavailable",
    "secondarySkillAtomIds": [
      "distinguish_window_from_interval_enumeration",
      "require_safe_boundary_movement"
    ],
    "type": "single_choice",
    "prompt": "A property must be checked for every contiguous subarray, but a failed interval gives no information about whether moving left or right preserves possible answers. What is the best assessment?",
    "options": [
      {
        "id": "window_not_automatically_justified",
        "text": "A standard variable-size sliding window is not justified; enumeration, prefix-based state, or another problem-specific method may be required.",
        "isCorrect": true
      },
      {
        "id": "move_left_after_every_failure",
        "text": "Move left after every failure because every interval problem supports shrinking.",
        "isCorrect": false
      },
      {
        "id": "move_both_boundaries",
        "text": "Move both boundaries after each check so every interval is eventually covered.",
        "isCorrect": false
      },
      {
        "id": "contiguity_is_sufficient",
        "text": "The task is automatically a sliding-window problem because the candidates are contiguous.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "No comparison supplies a safe rule for permanently discarding intervals associated with one boundary.",
      "mentalModelCorrection": "Contiguity is necessary for a window candidate but does not by itself justify variable-size boundary movement.",
      "mistakeTypes": [
        "sliding_window_forced_without_movement_rule"
      ],
      "nextAction": "State what becomes impossible after each proposed boundary movement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_sliding_window_for_noncontiguous_selection",
    "secondarySkillAtomIds": [
      "distinguish_subarray_from_subsequence",
      "recognize_mandatory_interior_membership"
    ],
    "type": "mistake_review",
    "prompt": "A task asks for the longest subsequence satisfying a condition. Selected values may skip arbitrary positions.\n\nA reviewer proposes a sliding window because the result has a first and last selected index.\n\nWhat is wrong?",
    "options": [
      {
        "id": "subsequence_is_not_contiguous",
        "text": "A sliding window includes every position between its boundaries, while a subsequence may omit interior positions.",
        "isCorrect": true
      },
      {
        "id": "subsequences_have_no_order",
        "text": "A subsequence does not preserve the original order of selected values.",
        "isCorrect": false
      },
      {
        "id": "windows_require_sorted_input",
        "text": "The only issue is that sliding windows require sorted arrays.",
        "isCorrect": false
      },
      {
        "id": "first_last_make_window",
        "text": "The proposal is correct because any selection has a first and last index.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Interior membership is optional for the requested selection.",
      "mentalModelCorrection": "A pair of outer indexes does not turn a non-contiguous selection into a window.",
      "mistakeTypes": [
        "noncontiguous_selection_called_sliding_window"
      ],
      "nextAction": "Check whether every index between the candidate boundaries must be selected.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-sliding-window-signal-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_mixed_sign_exact_sum_window",
    "secondarySkillAtomIds": [
      "recognize_nonmonotonic_sum_state",
      "choose_prefix_sum_for_exact_target"
    ],
    "type": "mistake_review",
    "prompt": "A candidate wants to find a contiguous subarray whose sum equals target.\n\nThe array may contain positive and negative values. They propose:\n\n- expand right when the sum is too small,\n- shrink left when the sum is too large.\n\nWhat is the central flaw?",
    "options": [
      {
        "id": "mixed_signs_break_directional_sum_rule",
        "text": "With mixed signs, expanding may decrease the sum and shrinking may increase it, so the comparison does not justify either movement.",
        "isCorrect": true
      },
      {
        "id": "exact_sum_never_uses_ranges",
        "text": "An exact-sum problem can never involve contiguous subarrays.",
        "isCorrect": false
      },
      {
        "id": "negative_values_must_be_removed",
        "text": "The input must be filtered so only positive values remain.",
        "isCorrect": false
      },
      {
        "id": "both_boundaries_should_move",
        "text": "The strategy becomes valid by moving both boundaries after every comparison.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The maintained sum is not monotonic under expansion or contraction.",
      "mentalModelCorrection": "An ordinary target-sum window relies on value-domain constraints; mixed-sign exact sums commonly require prefix-sum state instead.",
      "mistakeTypes": [
        "mixed_sign_exact_sum_uses_invalid_window"
      ],
      "nextAction": "Test whether adding or removing one permitted value always moves the sum in a predictable direction.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-sliding-window-signal-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_mixed_sign_shortest_sum_window",
    "secondarySkillAtomIds": [
      "require_monotonic_shrink_behavior",
      "reject_invalid_at_least_target_window"
    ],
    "type": "mistake_review",
    "prompt": "A task asks for the shortest contiguous subarray with sum at least target.\n\nThe input may contain negative values. A solution shrinks left whenever the current sum reaches target.\n\nWhy is the ordinary window rule unsafe?",
    "options": [
      {
        "id": "removing_negative_can_raise_sum",
        "text": "Removing a left value may increase or decrease the sum depending on its sign, so the usual shrink invariant does not hold.",
        "isCorrect": true
      },
      {
        "id": "shortest_never_uses_windows",
        "text": "Shortest-range problems can never use sliding windows.",
        "isCorrect": false
      },
      {
        "id": "negative_target_required",
        "text": "The method is valid only when target is negative.",
        "isCorrect": false
      },
      {
        "id": "right_should_move_backward",
        "text": "The only correction is to move right backward after every valid interval.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The effect of removing the outgoing value is not directionally predictable.",
      "mentalModelCorrection": "Shortest-window contraction is valid only when shrinking has a known effect on the maintained constraint.",
      "mistakeTypes": [
        "mixed_sign_shortest_sum_uses_invalid_window"
      ],
      "nextAction": "Prove that removing the leftmost permitted value changes the state monotonically.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_nonnegative_sum_window_signal",
    "secondarySkillAtomIds": [
      "recognize_monotonic_sum_expansion",
      "recognize_safe_sum_contraction"
    ],
    "type": "single_choice",
    "prompt": "Which constraint makes a variable-size sum window especially plausible for finding the longest contiguous subarray with sum at most target?",
    "options": [
      {
        "id": "all_values_nonnegative",
        "text": "All values are nonnegative, so expanding cannot decrease the sum and shrinking cannot increase it.",
        "isCorrect": true
      },
      {
        "id": "values_have_mixed_signs",
        "text": "Values may have arbitrary signs, so every movement changes the sum unpredictably.",
        "isCorrect": false
      },
      {
        "id": "array_is_unsorted",
        "text": "The array is unsorted, which alone guarantees safe window movement.",
        "isCorrect": false
      },
      {
        "id": "target_is_even",
        "text": "The target is even, so boundary movement is monotonic.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The value domain makes the sum respond predictably to adding and removing elements.",
      "mentalModelCorrection": "Sliding-window validity often depends on input constraints that create monotonic boundary effects.",
      "mistakeTypes": [
        "valid_nonnegative_sum_window_signal_missed"
      ],
      "nextAction": "Describe how the maintained sum changes under each possible boundary movement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_missed_rolling_update",
    "secondarySkillAtomIds": [
      "replace_repeated_fixed_window_rescanning",
      "track_incoming_and_outgoing_values"
    ],
    "type": "mistake_review",
    "prompt": "A solution computes the sum of every length-k contiguous block by looping through all k elements again for each starting index.\n\nWhat sliding-window opportunity was missed?",
    "options": [
      {
        "id": "reuse_previous_window_sum",
        "text": "Reuse the previous sum by subtracting the outgoing value and adding the incoming value.",
        "isCorrect": true
      },
      {
        "id": "sort_each_window",
        "text": "Sort every length-k block before computing its sum.",
        "isCorrect": false
      },
      {
        "id": "move_opposite_ends",
        "text": "Compare only the first and last values of each block.",
        "isCorrect": false
      },
      {
        "id": "use_noncontiguous_selection",
        "text": "Skip interior values because only the boundaries affect a window sum.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Consecutive fixed-size windows overlap except for one departing and one arriving value.",
      "mentalModelCorrection": "A rolling window carries forward the aggregate instead of rebuilding it from the overlapping contents.",
      "mistakeTypes": [
        "fixed_size_windows_repeatedly_rescanned"
      ],
      "nextAction": "Write the next state as previous state minus outgoing plus incoming.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-sliding-window-signal-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_window_classification_by_pointer_names",
    "secondarySkillAtomIds": [
      "classify_by_candidate_semantics",
      "distinguish_search_bounds_from_window_bounds"
    ],
    "type": "mistake_review",
    "prompt": "A reviewer says:\n\n\"The code uses variables named left and right, so it is a sliding-window algorithm.\"\n\nWhat is the best correction?",
    "options": [
      {
        "id": "names_do_not_define_window",
        "text": "It is a sliding window only if left and right delimit one active contiguous candidate whose state is maintained as the boundaries move.",
        "isCorrect": true
      },
      {
        "id": "names_must_be_start_end",
        "text": "It becomes a sliding window only after renaming the variables start and end.",
        "isCorrect": false
      },
      {
        "id": "all_two_pointer_code_is_window",
        "text": "The statement is correct because every two-pointer algorithm is a sliding window.",
        "isCorrect": false
      },
      {
        "id": "right_must_move_backward",
        "text": "Sliding windows require right to move from the end toward the beginning.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Variable names reveal no invariant about the interval between them.",
      "mentalModelCorrection": "A window is defined by candidate membership and maintained state, not surface syntax.",
      "mistakeTypes": [
        "sliding_window_classified_by_variable_names"
      ],
      "nextAction": "State what the interval contains and whether its complete contents form the candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-sliding-window-signal-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_incrementally_maintainable_window_state",
    "secondarySkillAtomIds": [
      "identify_incoming_state_update",
      "identify_outgoing_state_update"
    ],
    "type": "single_choice",
    "prompt": "Which property makes a contiguous-range condition suitable for efficient sliding-window maintenance?",
    "options": [
      {
        "id": "state_supports_add_and_remove",
        "text": "The relevant state can be updated when the right element enters and when the left element leaves.",
        "isCorrect": true
      },
      {
        "id": "state_requires_full_recomputation",
        "text": "Every boundary movement requires rebuilding all information from the complete interval.",
        "isCorrect": false
      },
      {
        "id": "only_endpoint_values_known",
        "text": "Only the two boundary values are meaningful, and the interior never participates.",
        "isCorrect": false
      },
      {
        "id": "candidate_skips_interior",
        "text": "The candidate may omit arbitrary interior values while retaining the same boundaries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Window movement changes membership locally at its boundaries.",
      "mentalModelCorrection": "The pattern is strongest when candidate state can be synchronized with those local membership changes.",
      "mistakeTypes": [
        "incremental_window_state_signal_missed"
      ],
      "nextAction": "Define explicit add-incoming and remove-outgoing operations for the maintained state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-sliding-window-signal-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_fixed_window_from_monotonic_variable_window",
    "secondarySkillAtomIds": [
      "recognize_predetermined_boundary_schedule",
      "allow_mixed_sign_fixed_window_rolling"
    ],
    "type": "solution_comparison",
    "prompt": "An array contains mixed positive and negative values.\n\nA. Find the maximum sum among blocks of exactly k consecutive elements.\nB. Find a variable-length block whose sum reaches a target by expanding when low and shrinking when high.\n\nWhich assessment is correct?",
    "options": [
      {
        "id": "fixed_valid_variable_not_proved",
        "text": "A still supports a fixed-size rolling window; B is not justified without a monotonic movement argument.",
        "isCorrect": true
      },
      {
        "id": "both_invalid_with_negative_values",
        "text": "Neither can use a window because any negative value invalidates all sliding-window techniques.",
        "isCorrect": false
      },
      {
        "id": "both_valid_by_contiguity",
        "text": "Both are valid sliding windows because both candidates are contiguous.",
        "isCorrect": false
      },
      {
        "id": "variable_valid_fixed_invalid",
        "text": "B is valid because it compares the sum with a target, while A requires full rescanning.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A has a predetermined one-step shift, while B needs the sum comparison to justify an irreversible boundary choice.",
      "mentalModelCorrection": "Mixed signs break many variable-size sum rules but do not prevent rolling state across fixed-size windows.",
      "mistakeTypes": [
        "fixed_and_variable_sum_window_preconditions_conflated"
      ],
      "nextAction": "Separate scheduled fixed-size movement from comparison-driven variable-size movement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-sliding-window-signal-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "classify_sliding_window_and_contrast_signals",
    "secondarySkillAtomIds": [
      "compare_contiguous_range_techniques",
      "reject_invalid_window_selection"
    ],
    "type": "solution_comparison",
    "prompt": "Match each task to the strongest classification:\n\nA. Maintain a frequency map for one contiguous active substring.\nB. Answer independent immutable range-sum queries.\nC. Compare two selected sorted endpoint values.\nD. Choose elements while freely skipping indexes.\nE. Compute every complete length-k block by rolling one incoming and one outgoing contribution.\nF. Use sum-based expansion and contraction on mixed-sign input without a monotonic proof.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "variable_window_prefix_pair_noncontiguous_fixed_window_invalid",
        "text": "A: variable sliding window; B: prefix sums; C: pair-oriented two pointers; D: non-window selection; E: fixed-size sliding window; F: invalid window rule.",
        "isCorrect": true
      },
      {
        "id": "all_windows",
        "text": "All six are sliding-window tasks because each may refer to indexes or ranges.",
        "isCorrect": false
      },
      {
        "id": "prefix_window_window_fixed_pair_valid",
        "text": "A: prefix sums; B: sliding window; C: sliding window; D: fixed window; E: pair search; F: valid variable window.",
        "isCorrect": false
      },
      {
        "id": "all_equivalent_if_linear",
        "text": "The classifications are interchangeable whenever an implementation can be made linear.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each task differs in candidate membership, maintained state, query workload, or legality of boundary movement.",
      "mentalModelCorrection": "Sliding-window recognition requires both a contiguous active candidate and a correct boundary-update model.",
      "mistakeTypes": [
        "sliding_window_contrast_signals_conflated"
      ],
      "nextAction": "For each task, identify candidate membership, state ownership, and the proof supporting its next boundary movement.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
