import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const slidingWindowBinarySearchAndInvalidCasesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-two-pointer-contrast-invalid-cases-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_two_pointers_from_binary_search",
    "secondarySkillAtomIds": [
      "recognize_midpoint_half_discard",
      "recognize_endpoint_candidate_elimination"
    ],
    "type": "solution_comparison",
    "prompt": "Which mapping is correct?\n\nA. Inspect a midpoint and prove that one half cannot contain the answer.\nB. Compare two current positions and prove that one endpoint cannot belong to any remaining answer.",
    "options": [
      {
        "id": "binary_then_two_pointer",
        "text": "A describes binary search; B describes a two-pointer elimination rule.",
        "isCorrect": true
      },
      {
        "id": "two_pointer_then_binary",
        "text": "A describes two pointers; B describes binary search.",
        "isCorrect": false
      },
      {
        "id": "both_binary",
        "text": "Both are binary search because their candidate regions shrink.",
        "isCorrect": false
      },
      {
        "id": "both_two_pointer",
        "text": "Both are two-pointer techniques because each tracks two boundaries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Binary search discards a half through a midpoint predicate; two pointers advance candidate positions monotonically.",
      "mentalModelCorrection": "A shrinking interval is not enough to identify binary search or two pointers.",
      "mistakeTypes": [
        "binary_search_and_two_pointer_rules_conflated"
      ],
      "nextAction": "Identify whether progress comes from midpoint halving or coordinated cursor movement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-two-pointer-contrast-invalid-cases-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_opposite_ends_on_unsorted_sum",
    "secondarySkillAtomIds": [
      "require_sorted_order_precondition",
      "diagnose_invalid_endpoint_elimination"
    ],
    "type": "mistake_review",
    "prompt": "A candidate searches for a target sum in this unsorted array:\n\n[9, 1, 6, 3, 8]\n\nThey start at both ends and move left or right depending on whether the current sum is too small or too large.\n\nWhat is the central flaw?",
    "options": [
      {
        "id": "unsorted_movement_discards_without_proof",
        "text": "Without sorted order, changing an endpoint does not predictably increase or decrease the sum, so valid pairs may be discarded.",
        "isCorrect": true
      },
      {
        "id": "target_sum_needs_three_pointers",
        "text": "Every target-sum problem requires at least three pointers.",
        "isCorrect": false
      },
      {
        "id": "endpoints_must_start_middle",
        "text": "The pointers should both start near the middle instead.",
        "isCorrect": false
      },
      {
        "id": "sum_comparison_is_never_valid",
        "text": "Pointer movement may never depend on whether a sum is too small or too large.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The endpoint values do not bound the values between them in an unsorted input.",
      "mentalModelCorrection": "Opposite-end sum movement is valid because of sorted monotonicity, not because endpoints are convenient.",
      "mistakeTypes": [
        "opposite_ends_used_on_unsorted_target_sum"
      ],
      "nextAction": "State the input property that proves the moved endpoint cannot be part of a valid remaining pair.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-two-pointer-contrast-invalid-cases-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "require_safe_candidate_elimination_proof",
    "secondarySkillAtomIds": [
      "preserve_possible_answers",
      "reject_trial_and_error_pointer_movement"
    ],
    "type": "single_choice",
    "prompt": "What must be true before a two-pointer algorithm may permanently move past a candidate position?",
    "options": [
      {
        "id": "all_answers_using_position_impossible",
        "text": "The invariant and input structure prove that no still-valid answer can require that discarded position.",
        "isCorrect": true
      },
      {
        "id": "candidate_failed_once",
        "text": "The current pair failed once, so both positions may be discarded.",
        "isCorrect": false
      },
      {
        "id": "pointer_has_moved_often",
        "text": "The pointer has already moved several times.",
        "isCorrect": false
      },
      {
        "id": "alternative_looks_better",
        "text": "Another candidate appears more promising in the current example.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Pointer movement removes candidates from future consideration.",
      "mentalModelCorrection": "A failed current comparison is insufficient unless it rules out every remaining relation involving the moved position.",
      "mistakeTypes": [
        "pointer_move_lacks_safe_elimination_proof"
      ],
      "nextAction": "Describe the complete set of candidates eliminated by the move.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-two-pointer-contrast-invalid-cases-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_relation_without_monotonic_elimination",
    "secondarySkillAtomIds": [
      "distinguish_arbitrary_pair_predicate",
      "avoid_forcing_two_pointer_strategy"
    ],
    "type": "strategy_choice",
    "prompt": "A task tests pairs with an arbitrary function `compatible(a, b)`. The values are not ordered by any property related to that function, and one failed pair reveals nothing about neighboring candidates. What is the best assessment?",
    "options": [
      {
        "id": "two_pointer_not_justified",
        "text": "A standard monotonic two-pointer elimination strategy is not justified.",
        "isCorrect": true
      },
      {
        "id": "move_both_after_failure",
        "text": "Move both pointers inward after every failed comparison.",
        "isCorrect": false
      },
      {
        "id": "sort_by_any_field",
        "text": "Sort by any available field and endpoint elimination becomes valid.",
        "isCorrect": false
      },
      {
        "id": "two_indexes_are_enough",
        "text": "Any pair predicate supports two pointers as long as two indexes are used.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The relation supplies no monotonic consequence from a comparison.",
      "mentalModelCorrection": "Two pointers cannot safely compress arbitrary pair enumeration without a structural elimination rule.",
      "mistakeTypes": [
        "two_pointers_forced_for_nonmonotonic_relation"
      ],
      "nextAction": "Explain what a failed comparison proves about adjacent or remaining candidates.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-two-pointer-contrast-invalid-cases-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_every_range_as_sliding_window",
    "secondarySkillAtomIds": [
      "distinguish_search_interval_from_active_window",
      "classify_by_candidate_semantics"
    ],
    "type": "mistake_review",
    "prompt": "A reviewer says:\n\n\"The algorithm has left and right boundaries around remaining candidates, so it is a sliding window.\"\n\nWhat is the best correction?",
    "options": [
      {
        "id": "range_alone_not_window",
        "text": "A bounded candidate region is not necessarily a window; a sliding window maintains one contiguous candidate and state over its interior.",
        "isCorrect": true
      },
      {
        "id": "all_boundaries_are_windows",
        "text": "The statement is correct because every interval is a sliding window.",
        "isCorrect": false
      },
      {
        "id": "only_names_wrong",
        "text": "It becomes a window if the variables are renamed start and end.",
        "isCorrect": false
      },
      {
        "id": "windows_need_sorted_input",
        "text": "It is not a window only because sliding windows require sorted arrays.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The interval may represent surviving candidates rather than one evaluated range.",
      "mentalModelCorrection": "Pattern classification follows the invariant maintained between the boundaries.",
      "mistakeTypes": [
        "candidate_interval_called_window_by_shape"
      ],
      "nextAction": "State whether the interior is active data or merely unresolved search space.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-two-pointer-contrast-invalid-cases-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_precondition",
    "secondarySkillAtomIds": [
      "require_legal_half_discard_rule",
      "distinguish_sortedness_from_searchability"
    ],
    "type": "mistake_review",
    "prompt": "An input is sorted, so a candidate immediately proposes binary search for a pair relationship.\n\nWhat additional justification is required?",
    "options": [
      {
        "id": "midpoint_must_discard_half",
        "text": "There must be a predicate at a chosen search dimension whose result safely excludes one half of the remaining candidates.",
        "isCorrect": true
      },
      {
        "id": "sorted_is_always_enough",
        "text": "None; every problem on sorted input is binary search.",
        "isCorrect": false
      },
      {
        "id": "two_values_require_two_binary_searches",
        "text": "Every pair problem requires exactly two independent binary searches.",
        "isCorrect": false
      },
      {
        "id": "midpoint_name_required",
        "text": "The implementation only needs a variable named mid.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sortedness helps only when the decision predicate supports directional half elimination.",
      "mentalModelCorrection": "Binary search is justified by a legal discard rule, not by sorted data alone.",
      "mistakeTypes": [
        "binary_search_selected_from_sortedness_only"
      ],
      "nextAction": "State what midpoint answer implies about every candidate in one half.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-two-pointer-contrast-invalid-cases-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_advancing_both_after_failed_pair",
    "secondarySkillAtomIds": [
      "preserve_uneliminated_endpoint",
      "require_endpoint_specific_proof"
    ],
    "type": "mistake_review",
    "prompt": "A sorted pair-search implementation moves both endpoints inward whenever the current pair fails.\n\nWhy is that generally unsafe?",
    "options": [
      {
        "id": "one_endpoint_may_still_form_answer",
        "text": "The comparison may justify discarding only one endpoint; the other may still form a valid pair with a different remaining value.",
        "isCorrect": true
      },
      {
        "id": "both_pointers_must_never_move",
        "text": "Two pointers are never allowed to move during the same iteration.",
        "isCorrect": false
      },
      {
        "id": "failure_proves_both_invalid",
        "text": "It is safe because one failed pair disproves both endpoint values.",
        "isCorrect": false
      },
      {
        "id": "moving_both_is_binary_search",
        "text": "Moving both endpoints automatically turns the algorithm into binary search.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A failed relation between two values does not usually invalidate each value independently.",
      "mentalModelCorrection": "Discard only the endpoint covered by the monotonic elimination argument.",
      "mistakeTypes": [
        "both_endpoints_discarded_without_proof"
      ],
      "nextAction": "For each moved pointer, separately prove that no remaining answer can use its current position.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-two-pointer-contrast-invalid-cases-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "classify_endpoint_pair_not_window",
    "secondarySkillAtomIds": [
      "distinguish_endpoint_values_from_range_contents",
      "avoid_shape_based_window_classification"
    ],
    "type": "code_reading",
    "prompt": "A loop repeatedly evaluates only:\n\nvalues[left] + values[right]\n\nNo aggregate over values[left..right] is maintained.\n\nWhich classification is precise?",
    "options": [
      {
        "id": "endpoint_pair_search",
        "text": "It is an endpoint-pair search, not a sliding window, because only the two selected values define the candidate.",
        "isCorrect": true
      },
      {
        "id": "sliding_window",
        "text": "It is a sliding window because left and right enclose an interval.",
        "isCorrect": false
      },
      {
        "id": "binary_search",
        "text": "It is binary search because the interval becomes smaller.",
        "isCorrect": false
      },
      {
        "id": "hash_lookup",
        "text": "It is hash lookup because a sum is computed.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Interior values are unresolved candidates rather than members of one evaluated range.",
      "mentalModelCorrection": "Classify the semantic candidate, not the visual presence of two boundaries.",
      "mistakeTypes": [
        "endpoint_pair_code_called_sliding_window"
      ],
      "nextAction": "List exactly which elements contribute to the current validity test.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-two-pointer-contrast-invalid-cases-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "classify_active_range_as_sliding_window",
    "secondarySkillAtomIds": [
      "recognize_range_frequency_state",
      "distinguish_window_from_pair_search"
    ],
    "type": "code_reading",
    "prompt": "A loop maintains a frequency Map for every value in [left, right], expands right, and shrinks left until the range contains at most k distinct values.\n\nWhich classification is precise?",
    "options": [
      {
        "id": "sliding_window",
        "text": "It is a sliding window because the complete contiguous range and its maintained state define validity.",
        "isCorrect": true
      },
      {
        "id": "endpoint_pair",
        "text": "It is an endpoint-pair search because only values[left] and values[right] matter.",
        "isCorrect": false
      },
      {
        "id": "binary_search",
        "text": "It is binary search because left eventually moves rightward.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_two_indexes",
        "text": "It has no recognizable pattern because both indexes move.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The maintained state represents every element in one active contiguous interval.",
      "mentalModelCorrection": "Sliding windows are a specialized coordinated-pointer pattern with range-wide state.",
      "mistakeTypes": [
        "active_range_state_not_recognized_as_window"
      ],
      "nextAction": "Determine whether adding or removing a boundary element changes aggregate state for the candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-two-pointer-contrast-invalid-cases-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_binary_search_without_one_dimensional_predicate",
    "secondarySkillAtomIds": [
      "recognize_two_dimensional_pair_space",
      "require_half_discard_rule"
    ],
    "type": "mistake_review",
    "prompt": "A sorted array pair problem asks for indexes i and j satisfying:\n\nvalues[i] + values[j] === target\n\nA candidate proposes one binary search over the entire pair problem without fixing either index.\n\nWhat is missing?",
    "options": [
      {
        "id": "no_single_midpoint_pair_predicate",
        "text": "The candidate space has two varying indexes, and no single midpoint predicate has been shown to discard half of all remaining pairs.",
        "isCorrect": true
      },
      {
        "id": "binary_search_never_handles_sums",
        "text": "Binary search can never be used in any problem involving sums.",
        "isCorrect": false
      },
      {
        "id": "sortedness_is_enough",
        "text": "Nothing; sortedness alone makes every pair problem one-dimensional.",
        "isCorrect": false
      },
      {
        "id": "must_use_hash",
        "text": "Every pair problem must use a hash table.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The unresolved search space is a set of index pairs rather than one ordered index interval.",
      "mentalModelCorrection": "Binary search needs a monotonic predicate over one chosen search dimension.",
      "mistakeTypes": [
        "pair_space_treated_as_single_binary_search_interval"
      ],
      "nextAction": "Identify the exact variable being binary-searched and what each predicate result eliminates.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-two-pointer-contrast-invalid-cases-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_hash_lookup_for_streaming_complement",
    "secondarySkillAtomIds": [
      "recognize_one_pass_prior_state",
      "reject_sorting_when_order_must_remain"
    ],
    "type": "strategy_choice",
    "prompt": "An unsorted stream must be processed in one pass without reordering. For each current value, the algorithm must determine whether its exact complement appeared earlier. Which strategy fits?",
    "options": [
      {
        "id": "hash_lookup",
        "text": "Store previously seen values in keyed hash state and query the derived complement.",
        "isCorrect": true
      },
      {
        "id": "opposite_end_pointers",
        "text": "Treat the stream's first and last observed values as sorted endpoints.",
        "isCorrect": false
      },
      {
        "id": "sliding_window",
        "text": "Treat every previously observed value as one contiguous active window.",
        "isCorrect": false
      },
      {
        "id": "binary_search_unsorted_prefix",
        "text": "Binary-search the unsorted processed prefix directly.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The needed partner is addressed by an exact derived key in prior state.",
      "mentalModelCorrection": "When sorting is unavailable and prior membership is the required operation, hash lookup is the natural model.",
      "mistakeTypes": [
        "streaming_complement_forced_into_pointer_search"
      ],
      "nextAction": "Express the required prior observation as a lookup key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-two-pointer-contrast-invalid-cases-017",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_ambiguous_opposite_end_difference_movement",
    "secondarySkillAtomIds": [
      "recognize_missing_endpoint_elimination",
      "distinguish_same_direction_difference_search"
    ],
    "type": "mistake_review",
    "prompt": "A sorted array is searched for an exact nonnegative difference:\n\nvalues[j] - values[i] === target\n\nA candidate starts at opposite ends. When the current difference is too large, they cannot justify whether to increment i or decrement j.\n\nWhat does this reveal?",
    "options": [
      {
        "id": "opposite_end_elimination_not_established",
        "text": "The comparison does not prove which endpoint is impossible, so the standard opposite-end elimination rule has not been established.",
        "isCorrect": true
      },
      {
        "id": "move_both",
        "text": "Both endpoints may always be discarded when the difference is too large.",
        "isCorrect": false
      },
      {
        "id": "sortedness_guarantees_choice",
        "text": "Any arbitrary endpoint movement is safe because the input is sorted.",
        "isCorrect": false
      },
      {
        "id": "difference_requires_window",
        "text": "Every difference problem must be represented as a sliding window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Both endpoint movements can reduce the difference, but neither endpoint has been independently disproved.",
      "mentalModelCorrection": "Exact sorted-difference search is commonly modeled with two forward pointers because that representation supplies directional movement rules.",
      "mistakeTypes": [
        "opposite_end_difference_search_lacks_safe_move"
      ],
      "nextAction": "Choose pointer roles from the monotonic behavior of the expression, not from the presence of sorted data alone.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
