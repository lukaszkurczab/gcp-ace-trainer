import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const negativeValuesAndInvalidWindowAssumptionsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-negative-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_variable_window_monotonicity",
    "secondarySkillAtomIds": [
      "negative_value_effect",
      "sliding_window_precondition"
    ],
    "type": "single_choice",
    "prompt": "A variable sliding-window solution assumes that adding the next array value can never decrease the current sum. Which input condition is required for that assumption?",
    "feedbackModel": {
      "decisionSignal": "The proof depends on expansion changing the sum in one predictable direction.",
      "mentalModelCorrection": "A negative incoming value can reduce the sum, so right-boundary expansion is not monotonic unless element contributions are non-negative.",
      "mistakeTypes": [
        "missing_precondition"
      ],
      "nextAction": "State how adding one element affects validity before choosing variable sliding window.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "non_negative_values",
        "text": "Every array value must be non-negative.",
        "isCorrect": true
      },
      {
        "id": "sorted_values",
        "text": "The array must be sorted in ascending order.",
        "isCorrect": false
      },
      {
        "id": "distinct_values",
        "text": "Every array value must be unique.",
        "isCorrect": false
      },
      {
        "id": "positive_target",
        "text": "The target must be greater than zero.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-negative-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_invalid_shrink_assumption",
    "secondarySkillAtomIds": [
      "negative_outgoing_value",
      "window_sum_update"
    ],
    "type": "single_choice",
    "prompt": "A window currently has sum 8 and its leftmost value is -5. What happens to the sum when that value is removed?",
    "feedbackModel": {
      "decisionSignal": "Removing a contribution means subtracting that contribution from the aggregate.",
      "mentalModelCorrection": "Subtracting a negative value increases the sum. Therefore shrinking does not always reduce a mixed-sign window sum.",
      "mistakeTypes": [
        "invalid_shrink_assumption"
      ],
      "nextAction": "Test window-update rules with a negative outgoing element.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "sum_increases",
        "text": "The sum increases to 13.",
        "isCorrect": true
      },
      {
        "id": "sum_decreases",
        "text": "The sum decreases to 3.",
        "isCorrect": false
      },
      {
        "id": "sum_stays",
        "text": "The sum remains 8 because only the left boundary changes.",
        "isCorrect": false
      },
      {
        "id": "cannot_update",
        "text": "The new sum cannot be determined without recomputing the whole window.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-negative-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_keyword_based_window_selection",
    "secondarySkillAtomIds": [
      "contiguous_range_signal",
      "numeric_threshold_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A task asks for a contiguous subarray whose sum is at least a target. The array may contain positive and negative values. Which conclusion is justified?",
    "feedbackModel": {
      "decisionSignal": "Contiguity identifies a range problem, but does not prove that boundary movement is monotonic.",
      "mentalModelCorrection": "Pattern selection must follow from how validity changes when boundaries move, not from the words contiguous and target.",
      "mistakeTypes": [
        "keyword_pattern_matching"
      ],
      "nextAction": "Separate the range shape from the invariant needed by the algorithm.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "window_not_automatically_valid",
        "text": "The contiguous-range wording suggests range reasoning, but a standard variable sliding window still requires a monotonic validity argument.",
        "isCorrect": true
      },
      {
        "id": "always_sliding_window",
        "text": "A numeric threshold over a contiguous subarray always implies variable sliding window.",
        "isCorrect": false
      },
      {
        "id": "always_prefix_array_only",
        "text": "Plain prefix sums alone always identify the optimal range.",
        "isCorrect": false
      },
      {
        "id": "sorting_first",
        "text": "Sorting the array preserves the subarray contract and restores monotonicity.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-negative-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "construct_window_counterexample",
    "secondarySkillAtomIds": [
      "mixed_sign_counterexample",
      "expansion_monotonicity"
    ],
    "type": "single_choice",
    "prompt": "Which sequence is a direct counterexample to the claim that expanding a sum-based window always increases its sum?",
    "feedbackModel": {
      "decisionSignal": "A single negative incoming value is enough to reverse the expected direction of change.",
      "mentalModelCorrection": "Monotonic expansion is a property of the allowed contribution domain, not of contiguous windows in general.",
      "mistakeTypes": [
        "unsupported_monotonicity_claim"
      ],
      "nextAction": "Try the smallest mixed-sign input when reviewing a monotonicity proof.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "five_negative_six",
        "text": "[5, -6], because the sum changes from 5 to -1 after expansion.",
        "isCorrect": true
      },
      {
        "id": "one_two",
        "text": "[1, 2], because the sum changes from 1 to 3.",
        "isCorrect": false
      },
      {
        "id": "zero_four",
        "text": "[0, 4], because the sum changes from 0 to 4.",
        "isCorrect": false
      },
      {
        "id": "three_three",
        "text": "[3, 3], because the sum changes from 3 to 6.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-negative-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_at_most_window_condition",
    "secondarySkillAtomIds": [
      "at_most_sum_constraint",
      "negative_value_effect"
    ],
    "type": "solution_comparison",
    "prompt": "You need the longest contiguous subarray whose sum is at most target. Solution A uses a variable window and shrinks whenever the sum exceeds target. The input may contain negative values. Which assessment is correct?",
    "feedbackModel": {
      "decisionSignal": "Validity can change in either direction when a mixed-sign value enters or leaves.",
      "mentalModelCorrection": "An invalid current window does not imply that advancing left is the only useful next step. A future negative value may make a longer range valid.",
      "mistakeTypes": [
        "invalid_window_invariant"
      ],
      "nextAction": "Check whether an invalid window can become valid again solely by expanding right.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "proof_invalid",
        "text": "The strategy needs a different proof or different state because later negative values may restore validity without moving left.",
        "isCorrect": true
      },
      {
        "id": "always_correct",
        "text": "The strategy is always correct because shrinking reduces every window sum.",
        "isCorrect": false
      },
      {
        "id": "correct_if_target_positive",
        "text": "The strategy is correct whenever target is positive.",
        "isCorrect": false
      },
      {
        "id": "correct_after_sorting",
        "text": "The strategy becomes correct after sorting the values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-negative-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_at_least_window_condition",
    "secondarySkillAtomIds": [
      "at_least_sum_constraint",
      "negative_value_effect"
    ],
    "type": "solution_comparison",
    "prompt": "A proposed algorithm finds the shortest subarray with sum at least target by shrinking while the current sum is valid. Why does the standard proof fail when negative values are allowed?",
    "feedbackModel": {
      "decisionSignal": "The usual shrink proof assumes removing the left value changes the aggregate predictably.",
      "mentalModelCorrection": "With mixed signs, removing one element may either increase or decrease the sum, so the first invalid shrink position does not define a safe boundary.",
      "mistakeTypes": [
        "invalid_shrink_assumption"
      ],
      "nextAction": "Write the sum update as currentSum - outgoingValue and inspect both signs.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "removal_can_increase_sum",
        "text": "Removing a negative leftmost value can increase the sum, so shrink behavior is not monotonic.",
        "isCorrect": true
      },
      {
        "id": "target_may_be_negative",
        "text": "The proof fails only when target itself is negative.",
        "isCorrect": false
      },
      {
        "id": "prefixes_require_sorting",
        "text": "The proof fails because prefix sums are not sorted.",
        "isCorrect": false
      },
      {
        "id": "shortest_requires_bfs",
        "text": "Every shortest-range problem must be solved with breadth-first search.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-negative-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_prefix_values_from_complete_solution",
    "secondarySkillAtomIds": [
      "prefix_state_requirement",
      "range_selection_logic"
    ],
    "type": "single_choice",
    "prompt": "After rejecting variable sliding window for a mixed-sign subarray problem, a teammate says, 'Use prefix sums instead.' What is missing from that answer?",
    "feedbackModel": {
      "decisionSignal": "Prefix sums represent range sums, but they do not automatically search all valid boundary pairs efficiently.",
      "mentalModelCorrection": "A representation is not a complete algorithm. The solution still needs state or ordering that selects the relevant earlier prefix.",
      "mistakeTypes": [
        "incomplete_strategy_justification"
      ],
      "nextAction": "Ask what earlier prefix information is needed and how it will be queried.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "selection_mechanism",
        "text": "An explanation of how relationships between prefix states will identify the required range under the output contract.",
        "isCorrect": true
      },
      {
        "id": "positive_target",
        "text": "A guarantee that the target is positive.",
        "isCorrect": false
      },
      {
        "id": "sorted_input",
        "text": "A guarantee that the original array is sorted.",
        "isCorrect": false
      },
      {
        "id": "constant_window_size",
        "text": "A guarantee that all candidate ranges have one fixed length.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-negative-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_plain_prefix_overclaim",
    "secondarySkillAtomIds": [
      "subarray_target_search",
      "prefix_pair_reasoning"
    ],
    "type": "single_choice",
    "prompt": "Which statement about plain prefix sums is most accurate for subarray-target problems?",
    "feedbackModel": {
      "decisionSignal": "Prefix subtraction answers the value of a known range; many problems still require finding which range should be used.",
      "mentalModelCorrection": "Prefix sums transform range aggregates into relationships between boundaries, but another mechanism may be needed to search those relationships efficiently.",
      "mistakeTypes": [
        "prefix_sum_overgeneralization"
      ],
      "nextAction": "Separate range evaluation from range discovery.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "representation_not_selection",
        "text": "They let a chosen range sum be computed from two prefix states, but additional logic may be required to choose the correct pair of boundaries.",
        "isCorrect": true
      },
      {
        "id": "solve_all_targets",
        "text": "They automatically solve every exact, at-most, and at-least subarray target problem in O(n).",
        "isCorrect": false
      },
      {
        "id": "only_non_negative",
        "text": "They can be built only when all array values are non-negative.",
        "isCorrect": false
      },
      {
        "id": "same_as_window",
        "text": "They maintain exactly the same active-state invariant as a variable sliding window.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-negative-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_required_alternative_state",
    "secondarySkillAtomIds": [
      "prefix_based_search_state",
      "mixed_sign_subarray_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A mixed-sign subarray problem invalidates monotonic left/right movement. What kind of replacement should be considered next?",
    "feedbackModel": {
      "decisionSignal": "Mixed signs break local monotonic boundary decisions, so the algorithm may need information about multiple prior boundaries.",
      "mentalModelCorrection": "The replacement usually needs richer historical state than one current range, although the exact structure depends on the output contract.",
      "mistakeTypes": [
        "replacement_strategy_mismatch"
      ],
      "nextAction": "Identify what relationship between current and earlier prefixes represents a valid answer.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "prefix_relationship_state",
        "text": "State that tracks or searches relationships among earlier prefix values rather than relying only on one current window.",
        "isCorrect": true
      },
      {
        "id": "same_window_new_names",
        "text": "The same sliding window with left and right renamed start and end.",
        "isCorrect": false
      },
      {
        "id": "global_total",
        "text": "One scalar containing the sum of the entire array.",
        "isCorrect": false
      },
      {
        "id": "sorted_original_values",
        "text": "Sorting the values and then treating adjacent positions as a subarray.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-negative-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_fixed_and_variable_window_validity",
    "secondarySkillAtomIds": [
      "fixed_window_sum",
      "negative_value_scope"
    ],
    "type": "single_choice",
    "prompt": "An array contains negative values, and the task asks for the maximum sum among all subarrays of exactly length k. Does the presence of negative values invalidate a rolling fixed-size window?",
    "feedbackModel": {
      "decisionSignal": "A fixed-size rolling window does not choose pointer movement from a sum threshold.",
      "mentalModelCorrection": "Negative values invalidate specific monotonic variable-window proofs, not the exact arithmetic update between neighboring fixed-size windows.",
      "mistakeTypes": [
        "overgeneralized_negative_value_rule"
      ],
      "nextAction": "Ask whether boundary movement depends on aggregate validity or only on fixed length.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "no_fixed_window_still_valid",
        "text": "No. The next fixed-size range is still obtained exactly by removing the outgoing value and adding the incoming value.",
        "isCorrect": true
      },
      {
        "id": "yes_all_windows_invalid",
        "text": "Yes. Any negative value makes every sliding-window technique incorrect.",
        "isCorrect": false
      },
      {
        "id": "yes_unless_sorted",
        "text": "Yes, unless the array is sorted first.",
        "isCorrect": false
      },
      {
        "id": "only_if_target_positive",
        "text": "It is valid only when the best possible sum is positive.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-negative-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "detect_missed_longer_candidate",
    "secondarySkillAtomIds": [
      "premature_window_shrink",
      "mixed_sign_counterexample"
    ],
    "type": "single_choice",
    "prompt": "For an at-most-sum problem, a window becomes invalid and the algorithm immediately moves left. Which mixed-sign possibility shows that this movement may discard a useful answer?",
    "feedbackModel": {
      "decisionSignal": "An invalid prefix of a future candidate range may become valid after expansion when new contributions can be negative.",
      "mentalModelCorrection": "Shrinking immediately is safe only when future expansion cannot reverse the validity direction required by the objective.",
      "mistakeTypes": [
        "premature_candidate_elimination"
      ],
      "nextAction": "Ask whether a future right-boundary move can restore a range that is currently invalid.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "future_negative_restores_validity",
        "text": "A later negative value could reduce the sum and make the longer window valid again.",
        "isCorrect": true
      },
      {
        "id": "future_positive_keeps_invalid",
        "text": "A later positive value could make the sum even larger.",
        "isCorrect": false
      },
      {
        "id": "left_value_is_zero",
        "text": "The outgoing value could be zero.",
        "isCorrect": false
      },
      {
        "id": "target_is_integer",
        "text": "The target could be an integer rather than a floating-point value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-negative-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_non_monotonic_window_trace",
    "secondarySkillAtomIds": [
      "window_sum_trace",
      "negative_incoming_value"
    ],
    "type": "single_choice",
    "prompt": "A current window contains [6, 4] with sum 10. Expanding it adds -8. Which observation matters for variable-window correctness?",
    "feedbackModel": {
      "decisionSignal": "The same right-boundary movement can increase or decrease the aggregate depending on the incoming sign.",
      "mentalModelCorrection": "Without directional behavior, the algorithm cannot infer validity changes solely from moving right.",
      "mistakeTypes": [
        "non_monotonic_validity"
      ],
      "nextAction": "Trace at least one positive and one negative incoming contribution when checking monotonicity.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "expansion_reduces_sum",
        "text": "The sum falls to 2, proving that expansion does not have one fixed effect on validity.",
        "isCorrect": true
      },
      {
        "id": "window_length_invalid",
        "text": "The window becomes invalid because it contains three elements.",
        "isCorrect": false
      },
      {
        "id": "negative_must_be_removed",
        "text": "The incoming negative value must immediately be removed from every valid window.",
        "isCorrect": false
      },
      {
        "id": "prefix_sum_impossible",
        "text": "A prefix sum cannot represent the new sum.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-negative-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_correctness_before_complexity",
    "secondarySkillAtomIds": [
      "invalid_linear_window",
      "correct_alternative_strategy"
    ],
    "type": "solution_comparison",
    "prompt": "Solution A claims O(n) time using a variable window, but its proof assumes all values are non-negative while the input allows mixed signs. Solution B uses richer prefix-based state and runs in O(n log n). Which review is correct?",
    "feedbackModel": {
      "decisionSignal": "The stated time bound belongs to an algorithm whose correctness precondition is not satisfied.",
      "mentalModelCorrection": "Complexity comparisons are meaningful only between correct algorithms for the actual input domain.",
      "mistakeTypes": [
        "correctness_before_complexity"
      ],
      "nextAction": "Validate assumptions before ranking candidate approaches by Big-O.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "prefer_correct_solution",
        "text": "Prefer Solution B unless Solution A can provide a valid proof for mixed signs.",
        "isCorrect": true
      },
      {
        "id": "prefer_lower_big_o",
        "text": "Prefer Solution A because O(n) is always better than O(n log n).",
        "isCorrect": false
      },
      {
        "id": "both_correct",
        "text": "Both are correct because they process contiguous ranges.",
        "isCorrect": false
      },
      {
        "id": "reject_prefix_state",
        "text": "Reject Solution B because prefix-based approaches cannot handle negative values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-negative-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "justify_strategy_rejection",
    "secondarySkillAtomIds": [
      "monotonicity_requirement",
      "alternative_state_requirement"
    ],
    "type": "solution_comparison",
    "prompt": "Which explanation best rejects a standard sum-based variable sliding window for a mixed-sign target problem?",
    "feedbackModel": {
      "decisionSignal": "A complete strategic explanation identifies the broken invariant and the type of additional state the replacement must provide.",
      "mentalModelCorrection": "Rejecting one pattern is not enough. The reasoning should explain why candidate elimination fails and what information is missing.",
      "mistakeTypes": [
        "weak_strategy_justification"
      ],
      "nextAction": "State the invalid assumption, its consequence, and the kind of alternative state required.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "complete_rejection",
        "text": "Boundary movement is not monotonic: expanding may lower the sum and shrinking may raise it, so one current window cannot safely eliminate candidate ranges; a method using relationships among multiple prefix states is needed.",
        "isCorrect": true
      },
      {
        "id": "negative_values_are_slow",
        "text": "Negative numbers make arithmetic slower, so the window would exceed the time limit.",
        "isCorrect": false
      },
      {
        "id": "prefix_sums_always_work",
        "text": "Sliding window is invalid, but a plain prefix array automatically returns the required optimal range.",
        "isCorrect": false
      },
      {
        "id": "contiguous_ranges_need_sorting",
        "text": "Sliding window is invalid because every contiguous-range problem must first sort the input.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
