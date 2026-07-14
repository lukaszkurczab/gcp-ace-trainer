import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const longestShortestAndExactConstraintQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-objective-contract-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_window_answer_contracts",
    "secondarySkillAtomIds": [
      "choose_answer_aggregation",
      "separate_length_existence_and_count"
    ],
    "type": "solution_comparison",
    "prompt": "Compare four sliding-window contracts:\n\nA. Return the longest valid window length.\nB. Return the shortest valid window length.\nC. Determine whether any valid window exists.\nD. Count all valid windows.\n\nWhich answer-state mapping is correct?",
    "options": [
      {
        "id": "max_min_boolean_sum",
        "text": "A uses a maximum, B uses a minimum, C uses a boolean or early return, and D accumulates a count.",
        "isCorrect": true
      },
      {
        "id": "all_use_maximum",
        "text": "All four use the maximum window length because the pointer mechanics are similar.",
        "isCorrect": false
      },
      {
        "id": "all_use_count",
        "text": "All four add the current window length to one shared counter.",
        "isCorrect": false
      },
      {
        "id": "lengths_only",
        "text": "A and B use lengths, while C and D require no answer state.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The same boundary movement can support different observable outputs.",
      "mentalModelCorrection": "Pointer mechanics do not determine the answer rule; the result contract determines how valid windows are recorded.",
      "mistakeTypes": [
        "window_answer_contracts_conflated"
      ],
      "nextAction": "Identify whether the requested output is an optimum, a boolean, or a number of candidates.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-objective-contract-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "update_longest_valid_window",
    "secondarySkillAtomIds": [
      "restore_window_validity_before_recording",
      "maximize_window_length"
    ],
    "type": "single_choice",
    "prompt": "In a longest-window problem, the algorithm expands right and shrinks left while the window is invalid. When should the best length be updated?",
    "options": [
      {
        "id": "after_validity_restored",
        "text": "After shrinking has restored validity, using the current valid length right - left + 1.",
        "isCorrect": true
      },
      {
        "id": "before_shrinking_invalid_window",
        "text": "Immediately after expansion, even when the current window violates the constraint.",
        "isCorrect": false
      },
      {
        "id": "only_when_pointers_meet",
        "text": "Only when left === right.",
        "isCorrect": false
      },
      {
        "id": "after_loop_finishes_only",
        "text": "Only once after every boundary movement has finished.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The longest answer must be chosen from windows that satisfy the contract.",
      "mentalModelCorrection": "An invalid expanded window cannot become the recorded optimum merely because it is large.",
      "mistakeTypes": [
        "longest_window_recorded_before_validity_restored"
      ],
      "nextAction": "Normalize the window first, then compare its length with the current maximum.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_longest_rule_reused_for_counting",
    "secondarySkillAtomIds": [
      "distinguish_optimum_from_enumeration",
      "count_multiple_windows_per_boundary"
    ],
    "type": "mistake_review",
    "prompt": "A counting problem uses:\n\nbest = Math.max(best, right - left + 1);\n\nafter each valid window is established.\n\nWhat is the main problem?",
    "options": [
      {
        "id": "records_only_largest_length",
        "text": "It records only the largest valid length and loses the fact that many distinct valid windows may need to be counted.",
        "isCorrect": true
      },
      {
        "id": "maximum_is_always_count",
        "text": "Nothing; the largest window length always equals the number of valid windows.",
        "isCorrect": false
      },
      {
        "id": "right_must_move_backward",
        "text": "Counting requires right to move backward after every valid window.",
        "isCorrect": false
      },
      {
        "id": "counting_never_uses_windows",
        "text": "Sliding windows cannot be used for counting problems.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "An optimum selects one best candidate, while counting includes every qualifying candidate.",
      "mentalModelCorrection": "A maximum-length update cannot substitute for candidate enumeration or combinatorial counting.",
      "mistakeTypes": [
        "longest_answer_rule_reused_for_count"
      ],
      "nextAction": "Determine how many valid windows are represented by each pointer state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-objective-contract-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "update_shortest_valid_window",
    "secondarySkillAtomIds": [
      "minimize_window_length",
      "shrink_while_valid"
    ],
    "type": "single_choice",
    "prompt": "A shortest-window problem has a condition that remains satisfied while redundant values are removed from the left. Which inner-loop structure is appropriate?",
    "options": [
      {
        "id": "record_then_shrink_while_valid",
        "text": "While the window is valid, record its length as a minimum candidate, remove values[left], and increment left.",
        "isCorrect": true
      },
      {
        "id": "shrink_only_when_invalid",
        "text": "Shrink only while the window is invalid, exactly as in every longest-window problem.",
        "isCorrect": false
      },
      {
        "id": "record_only_largest",
        "text": "Record only the largest valid window before shrinking.",
        "isCorrect": false
      },
      {
        "id": "move_both_on_validity",
        "text": "Move both boundaries together whenever the window becomes valid.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Once a satisfying window exists, removing left-side values may produce a shorter satisfying candidate.",
      "mentalModelCorrection": "Shortest-window searches often continue shrinking while valid rather than stopping at the first valid boundary.",
      "mistakeTypes": [
        "shortest_window_uses_longest_shrink_rule"
      ],
      "nextAction": "Record every valid contraction candidate before removing its current left endpoint.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_shortest_candidate_recorded_too_late",
    "secondarySkillAtomIds": [
      "record_before_destroying_validity",
      "preserve_minimum_candidate"
    ],
    "type": "mistake_review",
    "prompt": "A shortest satisfying-window loop does this:\n\nwhile (isValid()) {\n  remove(values[left]);\n  left++;\n}\n\nbest = Math.min(best, right - left + 1);\n\nWhat can go wrong?",
    "options": [
      {
        "id": "valid_candidates_removed_before_recording",
        "text": "The loop may remove one or more valid candidate windows before their lengths are recorded, and the final state may already be invalid.",
        "isCorrect": true
      },
      {
        "id": "minimum_requires_invalid_window",
        "text": "The minimum should always be computed from the first invalid window.",
        "isCorrect": false
      },
      {
        "id": "left_cannot_move_in_shortest",
        "text": "Shortest-window algorithms must keep left fixed.",
        "isCorrect": false
      },
      {
        "id": "best_must_use_max",
        "text": "The only issue is that Math.max should replace Math.min.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Removing the current left value may destroy the condition that made the current interval a valid candidate.",
      "mentalModelCorrection": "Record a valid candidate before performing the update that may invalidate it.",
      "mistakeTypes": [
        "shortest_window_recorded_after_validity_destroyed"
      ],
      "nextAction": "Move the minimum update to the start of the valid-shrinking loop.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-objective-contract-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "return_early_for_window_existence",
    "secondarySkillAtomIds": [
      "distinguish_existence_from_optimization",
      "recognize_first_sufficient_candidate"
    ],
    "type": "single_choice",
    "prompt": "A problem asks only whether any non-empty valid window exists. What may the algorithm do after proving that the current non-empty window is valid?",
    "options": [
      {
        "id": "return_true",
        "text": "Return true immediately because no better or additional window is required.",
        "isCorrect": true
      },
      {
        "id": "continue_for_longest",
        "text": "Continue until the longest valid window has been found.",
        "isCorrect": false
      },
      {
        "id": "count_all_windows",
        "text": "Enumerate every valid window before returning true.",
        "isCorrect": false
      },
      {
        "id": "return_window_length",
        "text": "Return the current length instead of the required boolean.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The contract is satisfied by one witness.",
      "mentalModelCorrection": "Existence does not require optimization or complete enumeration.",
      "mistakeTypes": [
        "existence_problem_overprocessed_as_optimization"
      ],
      "nextAction": "Return as soon as one candidate satisfies every required condition.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_empty_window_when_nonempty_required",
    "secondarySkillAtomIds": [
      "interpret_empty_window_validity",
      "enforce_nonempty_candidate_contract"
    ],
    "type": "mistake_review",
    "prompt": "A problem asks whether a non-empty subarray contains at most 0 distinct values.\n\nAn implementation starts with an empty window and immediately returns true because its distinct count is 0.\n\nWhat is wrong?",
    "options": [
      {
        "id": "empty_window_not_allowed",
        "text": "The empty window satisfies the numerical constraint but is not an eligible non-empty subarray under the output contract.",
        "isCorrect": true
      },
      {
        "id": "empty_window_has_one_distinct",
        "text": "An empty window should be treated as containing one distinct value.",
        "isCorrect": false
      },
      {
        "id": "at_most_zero_means_exactly_one",
        "text": "At most 0 distinct values means exactly one distinct value.",
        "isCorrect": false
      },
      {
        "id": "existence_never_allows_early_return",
        "text": "Existence problems may never return early.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Constraint satisfaction and candidate eligibility are separate requirements.",
      "mentalModelCorrection": "An empty internal state must not be returned as a solution when the contract requires a non-empty window.",
      "mistakeTypes": [
        "empty_window_accepted_as_nonempty_solution"
      ],
      "nextAction": "Check both the window condition and the minimum permitted candidate length.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-objective-contract-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "maintain_at_most_k_constraint",
    "secondarySkillAtomIds": [
      "shrink_when_distinct_count_exceeds_k",
      "restore_valid_window"
    ],
    "type": "single_choice",
    "prompt": "A window must contain at most k distinct values. When should left advance?",
    "options": [
      {
        "id": "while_distinct_exceeds_k",
        "text": "While the current distinct count is greater than k, removing outgoing values until the window is valid again.",
        "isCorrect": true
      },
      {
        "id": "while_distinct_equals_k",
        "text": "Whenever the distinct count equals k, because equality is invalid.",
        "isCorrect": false
      },
      {
        "id": "only_when_right_reaches_end",
        "text": "Only after right has processed the complete input.",
        "isCorrect": false
      },
      {
        "id": "after_every_expansion",
        "text": "After every right movement, regardless of the distinct count.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The at-most contract permits every count from 0 through k.",
      "mentalModelCorrection": "Equality with k is valid; shrinking is required only after the upper bound is exceeded.",
      "mistakeTypes": [
        "at_most_constraint_treated_as_strictly_less_than"
      ],
      "nextAction": "Shrink only while the maintained quantity violates the stated upper bound.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "count_at_most_k_windows_ending_at_right",
    "secondarySkillAtomIds": [
      "use_suffix_validity_property",
      "derive_right_minus_left_plus_one_count"
    ],
    "type": "single_choice",
    "prompt": "After shrinking, [left, right] contains at most k distinct values.\n\nWhy can a standard at-most-k counting algorithm add:\n\nright - left + 1\n\nto the answer?",
    "options": [
      {
        "id": "all_suffixes_are_valid",
        "text": "Every non-empty suffix ending at right and starting between left and right also contains at most k distinct values.",
        "isCorrect": true
      },
      {
        "id": "one_window_per_element",
        "text": "Each element inside the window represents one occurrence of the same window.",
        "isCorrect": false
      },
      {
        "id": "all_subarrays_are_valid",
        "text": "Every subarray anywhere in the input is now valid.",
        "isCorrect": false
      },
      {
        "id": "length_equals_distinct_count",
        "text": "The window length always equals its number of distinct values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Removing a prefix cannot introduce a new distinct value.",
      "mentalModelCorrection": "The addition counts different valid starting positions for the current right endpoint.",
      "mistakeTypes": [
        "at_most_window_length_count_not_justified"
      ],
      "nextAction": "Prove that every suffix of the normalized window preserves the at-most property.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_counting_only_one_valid_window_per_right",
    "secondarySkillAtomIds": [
      "count_all_valid_suffixes",
      "avoid_boolean_counting_rule"
    ],
    "type": "mistake_review",
    "prompt": "A problem asks for the number of subarrays with at most k distinct values.\n\nAfter establishing a valid window [left, right], the implementation executes:\n\nanswer++;\n\nWhat does it miss?",
    "options": [
      {
        "id": "multiple_valid_starts",
        "text": "It counts only one window ending at right, although every start from left through right forms another valid suffix.",
        "isCorrect": true
      },
      {
        "id": "right_should_decrease",
        "text": "It should decrement right after every valid window.",
        "isCorrect": false
      },
      {
        "id": "at_most_has_only_one_window",
        "text": "Nothing; at most one valid window can end at each right position.",
        "isCorrect": false
      },
      {
        "id": "answer_should_use_maximum",
        "text": "The counter should be replaced with the maximum window length.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A single normalized window compactly represents several valid subarrays sharing the same right endpoint.",
      "mentalModelCorrection": "Counting existence once per right endpoint undercounts when multiple starts remain valid.",
      "mistakeTypes": [
        "only_one_at_most_window_counted_per_right"
      ],
      "nextAction": "Add the number of eligible start positions rather than one boolean witness.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_exact_k_count_from_at_most_counts",
    "secondarySkillAtomIds": [
      "partition_subarrays_by_distinct_count",
      "apply_at_most_difference_identity"
    ],
    "type": "single_choice",
    "prompt": "Which identity correctly counts subarrays containing exactly k distinct values?",
    "options": [
      {
        "id": "at_most_k_minus_at_most_k_minus_one",
        "text": "countAtMost(k) - countAtMost(k - 1)",
        "isCorrect": true
      },
      {
        "id": "at_most_k_plus_at_most_k_minus_one",
        "text": "countAtMost(k) + countAtMost(k - 1)",
        "isCorrect": false
      },
      {
        "id": "longest_difference",
        "text": "longestAtMost(k) - longestAtMost(k - 1)",
        "isCorrect": false
      },
      {
        "id": "count_at_most_k_only",
        "text": "countAtMost(k), because every at-most-k window has exactly k distinct values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The at-most-k set consists of windows with 0 through k distinct values, while at-most-(k - 1) removes all windows below k.",
      "mentalModelCorrection": "The subtraction works because these are counts of nested candidate sets.",
      "mistakeTypes": [
        "exact_k_count_identity_not_recognized"
      ],
      "nextAction": "Express exact equality as the difference between two nested upper-bound sets.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_exact_k_subtraction_for_optimum_lengths",
    "secondarySkillAtomIds": [
      "distinguish_set_counts_from_optima",
      "avoid_invalid_answer_arithmetic"
    ],
    "type": "mistake_review",
    "prompt": "A candidate proposes:\n\nlongestExactlyK =\n  longestAtMostK - longestAtMostKMinusOne;\n\nWhy is this invalid?",
    "options": [
      {
        "id": "optima_do_not_subtract_as_sets",
        "text": "The two longest lengths are separate optima, not counts of nested candidate sets, so their numerical difference need not equal any exactly-k optimum.",
        "isCorrect": true
      },
      {
        "id": "at_most_lengths_are_always_equal",
        "text": "It is invalid only because the two longest lengths are always equal.",
        "isCorrect": false
      },
      {
        "id": "exact_k_never_has_longest",
        "text": "A longest exactly-k window is not a meaningful contract.",
        "isCorrect": false
      },
      {
        "id": "subtraction_requires_sorting",
        "text": "The identity would become valid after sorting the input.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Set cardinalities support subtraction over nested sets; selected maximum values generally do not.",
      "mentalModelCorrection": "Do not transfer an identity for counts to lengths, booleans, or other answer representations.",
      "mistakeTypes": [
        "exact_count_subtraction_reused_for_longest_length"
      ],
      "nextAction": "Solve the exactly-k optimization contract directly with an invariant that preserves equality.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_at_most_width_used_for_exact_k_count",
    "secondarySkillAtomIds": [
      "distinguish_exact_from_at_most_suffixes",
      "avoid_counting_invalid_shorter_suffixes"
    ],
    "type": "mistake_review",
    "prompt": "A window is shrunk until it contains at most k distinct values.\n\nWhenever its distinct count equals k, the implementation adds:\n\nright - left + 1\n\nto count windows with exactly k distinct values.\n\nWhy can this overcount?",
    "options": [
      {
        "id": "some_suffixes_have_fewer_than_k",
        "text": "Some shorter suffixes beginning after left may contain fewer than k distinct values even though the full window contains exactly k.",
        "isCorrect": true
      },
      {
        "id": "full_window_cannot_have_k",
        "text": "A normalized at-most-k window can never contain exactly k distinct values.",
        "isCorrect": false
      },
      {
        "id": "window_length_is_always_one",
        "text": "right - left + 1 always equals one after normalization.",
        "isCorrect": false
      },
      {
        "id": "exact_k_requires_sorted_input",
        "text": "Exactly-k counting works only on sorted arrays.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The at-most property is inherited by every suffix, but exact equality may be lost when a distinguishing value is removed.",
      "mentalModelCorrection": "A width-based count is valid only when every represented start position satisfies the same requested contract.",
      "mistakeTypes": [
        "at_most_suffix_count_reused_for_exact_k"
      ],
      "nextAction": "Use two at-most counts or maintain an additional boundary that separates fewer-than-k suffixes.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-objective-contract-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_exact_k_existence_from_at_most_k",
    "secondarySkillAtomIds": [
      "require_equality_not_upper_bound",
      "avoid_false_exact_match"
    ],
    "type": "single_choice",
    "prompt": "A problem asks whether any non-empty window contains exactly k distinct values. Which condition proves success?",
    "options": [
      {
        "id": "distinct_equals_k",
        "text": "The current eligible window has distinctCount === k.",
        "isCorrect": true
      },
      {
        "id": "distinct_less_equal_k",
        "text": "distinctCount <= k, because every at-most-k window is exactly k.",
        "isCorrect": false
      },
      {
        "id": "window_length_equals_k",
        "text": "The window length equals k, regardless of duplicate values.",
        "isCorrect": false
      },
      {
        "id": "right_equals_k",
        "text": "The right pointer index equals k.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The requested relationship is equality of a maintained quantity.",
      "mentalModelCorrection": "An upper-bound condition includes windows below the target and therefore does not prove exactness.",
      "mistakeTypes": [
        "at_most_window_accepted_for_exact_k_existence"
      ],
      "nextAction": "Check equality after restoring the relevant upper-bound invariant.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_window_count_from_window_length",
    "secondarySkillAtomIds": [
      "interpret_right_minus_left_plus_one",
      "align_numeric_answer_with_contract"
    ],
    "type": "mistake_review",
    "prompt": "A function must return the longest valid window length.\n\nFor every normalized window it executes:\n\nanswer += right - left + 1;\n\nWhat result is it computing instead?",
    "options": [
      {
        "id": "accumulated_window_count_pattern",
        "text": "It is accumulating a quantity used in some counting problems rather than retaining the maximum single-window length.",
        "isCorrect": true
      },
      {
        "id": "maximum_length",
        "text": "It correctly computes the maximum length because addition and maximum are interchangeable.",
        "isCorrect": false
      },
      {
        "id": "minimum_length",
        "text": "It necessarily computes the minimum valid length.",
        "isCorrect": false
      },
      {
        "id": "distinct_count",
        "text": "It computes the number of distinct values in the window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A length describes one candidate; repeated addition aggregates contributions from many pointer states.",
      "mentalModelCorrection": "The expression `right - left + 1` may represent either a candidate length or a number of valid starts, depending on how it is used.",
      "mistakeTypes": [
        "count_and_length_aggregation_confused"
      ],
      "nextAction": "Use `Math.max` for a longest contract and addition only after proving a counting interpretation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-objective-contract-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_window_objective_contract_invariant",
    "secondarySkillAtomIds": [
      "connect_validity_to_answer_update",
      "preserve_contract_specific_recording"
    ],
    "type": "single_choice",
    "prompt": "Which statement most completely explains correctness across longest, shortest, existence, count, at-most, and exactly-k window problems?",
    "options": [
      {
        "id": "validity_and_answer_rule_match_contract",
        "text": "The boundaries and state must describe the current window exactly; shrinking must restore or exploit the required validity relation; and each valid state must be recorded using the contract-specific rule—maximum, minimum, early success, or a proved number of represented windows.",
        "isCorrect": true
      },
      {
        "id": "same_rule_for_every_problem",
        "text": "Once pointer movement is correct, every problem may use the same answer update.",
        "isCorrect": false
      },
      {
        "id": "window_length_always_answer",
        "text": "The current window length is always the required result.",
        "isCorrect": false
      },
      {
        "id": "exact_and_at_most_interchangeable",
        "text": "Exactly-k and at-most-k contracts are interchangeable whenever the same frequency map is used.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Correct boundary state is necessary but not sufficient; the recording rule must preserve the requested output semantics.",
      "mentalModelCorrection": "Sliding-window families often share mechanics while differing critically in validity, contraction, and answer aggregation.",
      "mistakeTypes": [
        "window_objective_and_answer_invariant_incomplete"
      ],
      "nextAction": "For each problem, define the candidate, validity relation, contraction rule, and exact meaning of one answer update.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
