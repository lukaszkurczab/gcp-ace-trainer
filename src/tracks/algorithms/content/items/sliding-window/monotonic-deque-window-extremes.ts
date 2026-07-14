import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const monotonicDequeWindowExtremesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-monotonic-deque-window-extremes-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_monotonic_deque_entries",
    "secondarySkillAtomIds": [
      "store_window_candidate_indexes",
      "separate_position_from_value"
    ],
    "type": "single_choice",
    "prompt": "What should a standard monotonic deque store while computing fixed-window maxima or minima?",
    "options": [
      {
        "id": "candidate_indexes",
        "text": "Indexes of elements that are still eligible to become the extreme value of a current or future window.",
        "isCorrect": true
      },
      {
        "id": "all_window_values",
        "text": "Every value currently inside the window, in its original order.",
        "isCorrect": false
      },
      {
        "id": "extreme_value_only",
        "text": "Only the current maximum or minimum value, with no positional information.",
        "isCorrect": false
      },
      {
        "id": "window_boundaries",
        "text": "Only the left and right window boundaries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each stored entry needs both a comparable value through its index and an age for stale-window eviction.",
      "mentalModelCorrection": "The deque stores surviving extreme candidates, not the complete window.",
      "mistakeTypes": [
        "monotonic_deque_role_misidentified"
      ],
      "nextAction": "For each deque entry, explain why it may still become the answer before it expires.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-monotonic-deque-window-extremes-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "maintain_decreasing_deque_for_window_maximum",
    "secondarySkillAtomIds": [
      "interpret_deque_front_as_maximum",
      "maintain_monotonic_candidate_values"
    ],
    "type": "single_choice",
    "prompt": "Which value ordering should indexes in a deque maintain for fixed-window maximum queries?",
    "options": [
      {
        "id": "nonincreasing_values",
        "text": "Their referenced values should be nonincreasing from front to back, so the front references the maximum.",
        "isCorrect": true
      },
      {
        "id": "nondecreasing_values",
        "text": "Their referenced values should be nondecreasing from front to back, so the back references the maximum.",
        "isCorrect": false
      },
      {
        "id": "sorted_indexes_only",
        "text": "Only the indexes must be numerically sorted; referenced values may appear in any order.",
        "isCorrect": false
      },
      {
        "id": "alternating_values",
        "text": "Values should alternate between larger and smaller candidates.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Every candidate behind the front has a value no larger than the front candidate.",
      "mentalModelCorrection": "For maxima, the deque is monotonic by referenced values while indexes remain ordered by arrival time.",
      "mistakeTypes": [
        "maximum_deque_order_reversed"
      ],
      "nextAction": "Read candidate values from front to back and verify that none increases.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-monotonic-deque-window-extremes-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "maintain_increasing_deque_for_window_minimum",
    "secondarySkillAtomIds": [
      "interpret_deque_front_as_minimum",
      "reverse_maximum_dominance_rule"
    ],
    "type": "single_choice",
    "prompt": "How does the monotonic ordering change when computing fixed-window minima instead of maxima?",
    "options": [
      {
        "id": "nondecreasing_values",
        "text": "Referenced values should be nondecreasing from front to back, making the front the minimum.",
        "isCorrect": true
      },
      {
        "id": "same_decreasing_order",
        "text": "The deque remains nonincreasing, and the front still gives the minimum.",
        "isCorrect": false
      },
      {
        "id": "indexes_move_backward",
        "text": "Indexes must be stored in decreasing arrival order.",
        "isCorrect": false
      },
      {
        "id": "store_negative_indexes",
        "text": "Every index should be negated before insertion.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Minimum candidates eliminate larger values behind them rather than smaller values.",
      "mentalModelCorrection": "Maximum and minimum deques use symmetric dominance rules with opposite value ordering.",
      "mistakeTypes": [
        "minimum_deque_uses_maximum_order"
      ],
      "nextAction": "Reverse each value comparison while preserving the same stale-index logic.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-monotonic-deque-window-extremes-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "evict_stale_deque_indexes",
    "secondarySkillAtomIds": [
      "derive_current_window_start",
      "preserve_window_membership"
    ],
    "type": "single_choice",
    "prompt": "For a complete window ending at right with size k, the window starts at:\n\nwindowStart = right - k + 1\n\nWhich deque entries are stale?",
    "options": [
      {
        "id": "indexes_before_window_start",
        "text": "Indexes strictly smaller than windowStart.",
        "isCorrect": true
      },
      {
        "id": "indexes_equal_window_start",
        "text": "Indexes equal to windowStart, because the left endpoint is excluded.",
        "isCorrect": false
      },
      {
        "id": "indexes_after_right",
        "text": "Indexes larger than right.",
        "isCorrect": false
      },
      {
        "id": "all_nonfront_indexes",
        "text": "Every index except the deque front.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A fixed window contains the inclusive index range [right - k + 1, right].",
      "mentalModelCorrection": "An index expires only after it falls strictly before the current inclusive left boundary.",
      "mistakeTypes": [
        "stale_deque_boundary_off_by_one"
      ],
      "nextAction": "Write the current inclusive window interval before choosing the eviction comparison.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "evict_stale_indexes_from_deque_front",
    "secondarySkillAtomIds": [
      "preserve_index_arrival_order",
      "diagnose_wrong_end_eviction"
    ],
    "type": "mistake_review",
    "prompt": "A deque stores candidate indexes in increasing arrival order.\n\nWhen an index leaves the window, the implementation removes an entry from the back.\n\nWhat is wrong?",
    "options": [
      {
        "id": "oldest_indexes_are_at_front",
        "text": "Stale entries are the oldest indexes and therefore appear at the front, not the back.",
        "isCorrect": true
      },
      {
        "id": "stale_entries_are_always_back",
        "text": "Nothing; the newest candidate is always the first to expire.",
        "isCorrect": false
      },
      {
        "id": "both_ends_must_be_removed",
        "text": "Every eviction must remove one entry from both ends.",
        "isCorrect": false
      },
      {
        "id": "indexes_need_reverse_order",
        "text": "The only valid repair is to store indexes in decreasing numeric order.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Indexes are appended as right moves forward, so age increases toward the front.",
      "mentalModelCorrection": "The front handles expiration; the back handles value dominance.",
      "mistakeTypes": [
        "stale_index_evicted_from_wrong_deque_end"
      ],
      "nextAction": "Associate each deque end with one responsibility: age at the front and dominance at the back.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "remove_dominated_maximum_candidates",
    "secondarySkillAtomIds": [
      "apply_latest_tie_policy",
      "clean_deque_back_before_insertion"
    ],
    "type": "single_choice",
    "prompt": "A window-maximum deque uses a latest-equal-value tie policy.\n\nBefore appending index right, which cleanup is correct?",
    "options": [
      {
        "id": "pop_smaller_or_equal_from_back",
        "text": "Remove indexes from the back while values[deque.back] <= values[right].",
        "isCorrect": true
      },
      {
        "id": "pop_larger_from_front",
        "text": "Remove indexes from the front while values[deque.front] > values[right].",
        "isCorrect": false
      },
      {
        "id": "remove_one_smaller_only",
        "text": "Remove at most one smaller value from the back.",
        "isCorrect": false
      },
      {
        "id": "clear_deque",
        "text": "Clear the entire deque whenever the incoming value is not smaller than the front.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A newer value that is at least as large will outlive and dominate every smaller-or-equal candidate behind it.",
      "mentalModelCorrection": "Dominance cleanup proceeds repeatedly from the back until monotonic order is restored.",
      "mistakeTypes": [
        "maximum_dominance_rule_incorrect"
      ],
      "nextAction": "Remove every trailing candidate that can no longer beat or outlive the incoming value.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_incomplete_dominance_cleanup",
    "secondarySkillAtomIds": [
      "use_while_for_dominance_cleanup",
      "restore_full_monotonic_order"
    ],
    "type": "mistake_review",
    "prompt": "A maximum deque inserts a new value using:\n\nif (\n  deque.length > 0 &&\n  values[deque[deque.length - 1]] < values[right]\n) {\n  deque.pop();\n}\n\ndeque.push(right);\n\nWhy is one conditional removal insufficient?",
    "options": [
      {
        "id": "multiple_trailing_candidates_may_be_dominated",
        "text": "Several trailing candidates may be smaller than the incoming value, so all of them must be removed to restore monotonic order.",
        "isCorrect": true
      },
      {
        "id": "no_candidate_should_be_removed",
        "text": "Dominance cleanup should never remove existing candidates.",
        "isCorrect": false
      },
      {
        "id": "front_must_also_be_popped_once",
        "text": "The repair is to pop exactly one entry from the front.",
        "isCorrect": false
      },
      {
        "id": "incoming_index_should_not_be_added",
        "text": "The incoming index must be discarded whenever any smaller value exists.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The incoming value may dominate an entire decreasing suffix of candidates.",
      "mentalModelCorrection": "Monotonicity is a global deque property and may require repeated back removal.",
      "mistakeTypes": [
        "dominance_cleanup_removes_only_one_candidate"
      ],
      "nextAction": "Replace the single conditional with a bounds-safe while loop.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "prefer_index_based_monotonic_deque",
    "secondarySkillAtomIds": [
      "support_stale_eviction",
      "support_extreme_index_output"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two deque representations:\n\nA. Store candidate indexes.\nB. Store only candidate values.\n\nWhich advantage does A provide directly?",
    "options": [
      {
        "id": "position_and_value_available",
        "text": "It exposes both candidate age for stale eviction and the original index of the current extreme, while the value remains available through the input array.",
        "isCorrect": true
      },
      {
        "id": "indexes_remove_need_for_values",
        "text": "Indexes make value comparisons unnecessary.",
        "isCorrect": false
      },
      {
        "id": "values_cannot_be_compared",
        "text": "A value-only deque can never compare numeric values.",
        "isCorrect": false
      },
      {
        "id": "indexes_sort_input",
        "text": "Storing indexes automatically sorts the input array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Window membership is positional, and some contracts also require the extreme's source index.",
      "mentalModelCorrection": "Indexes preserve identity and age without sacrificing access to values.",
      "mistakeTypes": [
        "value_only_deque_preferred_without_position_reasoning"
      ],
      "nextAction": "List every operation that requires an element's value, index, or age.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_value_only_duplicate_ambiguity",
    "secondarySkillAtomIds": [
      "preserve_equal_candidate_occurrences",
      "track_candidate_expiration_by_index"
    ],
    "type": "mistake_review",
    "prompt": "A value-only maximum deque removes equal duplicates and stores each candidate value at most once.\n\nThe input contains equal maxima at different indexes.\n\nWhy can stale eviction become incorrect?",
    "options": [
      {
        "id": "equal_occurrences_have_different_expiration_times",
        "text": "Equal values from different positions leave the window at different times, but the representation no longer records which occurrence remains.",
        "isCorrect": true
      },
      {
        "id": "equal_values_expire_together",
        "text": "There is no issue because equal numeric values always leave the window simultaneously.",
        "isCorrect": false
      },
      {
        "id": "duplicates_cannot_be_maxima",
        "text": "Equal values are ineligible to be window maxima.",
        "isCorrect": false
      },
      {
        "id": "window_size_becomes_unknown",
        "text": "The physical window size can no longer be calculated.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Expiration depends on source position rather than numeric equality.",
      "mentalModelCorrection": "Collapsing equal values without indexes or multiplicity information loses candidate identity.",
      "mistakeTypes": [
        "value_only_deque_loses_duplicate_expiration"
      ],
      "nextAction": "Store indexes, or explicitly preserve enough occurrence information to distinguish expiration times.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-monotonic-deque-window-extremes-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "emit_extreme_only_for_complete_window",
    "secondarySkillAtomIds": [
      "recognize_first_complete_fixed_window",
      "avoid_premature_output"
    ],
    "type": "mistake_review",
    "prompt": "A fixed-window maximum implementation emits values[deque.front] after processing every right index, starting at right = 0.\n\nThe required window size is k > 1.\n\nWhat is wrong?",
    "options": [
      {
        "id": "early_outputs_are_incomplete_windows",
        "text": "Outputs produced before right reaches k - 1 describe prefixes smaller than the required window size.",
        "isCorrect": true
      },
      {
        "id": "front_is_never_maximum",
        "text": "The deque front cannot represent a maximum before the final input index.",
        "isCorrect": false
      },
      {
        "id": "right_must_start_at_k",
        "text": "The scan should begin at right = k and ignore the first k values.",
        "isCorrect": false
      },
      {
        "id": "only_last_window_matters",
        "text": "Only the final window should ever produce an output.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The first complete size-k window ends at index k - 1.",
      "mentalModelCorrection": "Maintaining candidates for a partial prefix does not make that prefix an eligible fixed-size output window.",
      "mistakeTypes": [
        "window_extreme_emitted_before_window_complete"
      ],
      "nextAction": "Emit only when right >= k - 1.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "order_monotonic_deque_window_updates",
    "secondarySkillAtomIds": [
      "evict_before_reading_front",
      "restore_monotonicity_before_output"
    ],
    "type": "subgoal_ordering",
    "prompt": "Which sequence correctly processes an incoming index right for a fixed-window maximum?",
    "options": [
      {
        "id": "evict_dominate_append_emit",
        "text": "Evict stale front indexes, remove dominated back indexes, append right, then emit the front if the window is complete.",
        "isCorrect": true
      },
      {
        "id": "emit_then_evict",
        "text": "Emit the front first, then remove stale entries and insert right.",
        "isCorrect": false
      },
      {
        "id": "append_then_clear",
        "text": "Append right, clear all older indexes, and emit regardless of window size.",
        "isCorrect": false
      },
      {
        "id": "dominate_from_front",
        "text": "Remove dominated values from the front, append right, and never perform stale eviction.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Before output, every deque entry must belong to the window and the front must be the best surviving candidate.",
      "mentalModelCorrection": "Output is safe only after both membership and monotonic-candidate invariants have been restored.",
      "mistakeTypes": [
        "monotonic_deque_update_order_invalid"
      ],
      "nextAction": "Before reading the front, verify freshness, dominance order, and window completeness.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-monotonic-deque-window-extremes-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_fixed_window_maximum_deque",
    "secondarySkillAtomIds": [
      "apply_stale_eviction",
      "apply_maximum_dominance_cleanup"
    ],
    "type": "edge_case_drill",
    "prompt": "Compute the maximum of every window of size 3:\n\nvalues = [1, 3, -1, -3, 5, 3, 6, 7]\n\nWhich output is correct?",
    "options": [
      {
        "id": "three_three_five_five_six_seven",
        "text": "[3, 3, 5, 5, 6, 7]",
        "isCorrect": true
      },
      {
        "id": "one_three_negative_one_negative_three_five_three",
        "text": "[1, 3, -1, -3, 5, 3]",
        "isCorrect": false
      },
      {
        "id": "three_five_six_seven",
        "text": "[3, 5, 6, 7]",
        "isCorrect": false
      },
      {
        "id": "three_three_five_six_seven",
        "text": "[3, 3, 5, 6, 7]",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each output corresponds to one complete consecutive window of three values.",
      "mentalModelCorrection": "The deque front changes only when the current maximum expires or a larger incoming value dominates it.",
      "mistakeTypes": [
        "fixed_window_maximum_trace_mismatch"
      ],
      "nextAction": "Track the deque indexes after stale eviction and dominance cleanup at every right position.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_earliest_equal_extreme_index",
    "secondarySkillAtomIds": [
      "choose_strict_dominance_cleanup",
      "implement_earliest_tie_contract"
    ],
    "type": "single_choice",
    "prompt": "A window-maximum function must return the earliest index when multiple equal maxima exist.\n\nWhen inserting a new value, how should equal values at the deque back be handled?",
    "options": [
      {
        "id": "keep_older_equal",
        "text": "Keep older equal candidates and remove only strictly smaller back values.",
        "isCorrect": true
      },
      {
        "id": "remove_older_equal",
        "text": "Remove every smaller-or-equal back value so the newest equal index replaces the older one.",
        "isCorrect": false
      },
      {
        "id": "remove_front_equal",
        "text": "Remove the front whenever its value equals the incoming value.",
        "isCorrect": false
      },
      {
        "id": "clear_all_equal_values",
        "text": "Remove every occurrence of the maximum value from the deque.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "An older equal candidate has the same value and satisfies the requested earliest-index tie rule while it remains inside the window.",
      "mentalModelCorrection": "Strict versus non-strict dominance cleanup encodes observable tie behavior.",
      "mistakeTypes": [
        "earliest_extreme_tie_policy_uses_latest_candidate"
      ],
      "nextAction": "Use a strict comparison when older equal candidates must retain precedence.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_latest_equal_extreme_index",
    "secondarySkillAtomIds": [
      "choose_nonstrict_dominance_cleanup",
      "implement_latest_tie_contract"
    ],
    "type": "single_choice",
    "prompt": "A window-maximum function must return the latest index when multiple equal maxima exist.\n\nWhat should happen when the incoming value equals values[deque.back]?",
    "options": [
      {
        "id": "remove_older_equal",
        "text": "Remove the older equal candidate from the back so the newer equal index remains.",
        "isCorrect": true
      },
      {
        "id": "keep_older_equal_only",
        "text": "Discard the incoming index and keep only the older equal candidate.",
        "isCorrect": false
      },
      {
        "id": "remove_front_unconditionally",
        "text": "Remove the deque front regardless of its age.",
        "isCorrect": false
      },
      {
        "id": "emit_both_indexes",
        "text": "Return both equal indexes even though the contract requests one latest index.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The newer equal candidate has the same value, expires later, and satisfies the latest-index tie rule.",
      "mentalModelCorrection": "Removing equal back candidates is correct only when the tie contract permits or requires newer-index precedence.",
      "mistakeTypes": [
        "latest_extreme_tie_policy_keeps_older_candidate"
      ],
      "nextAction": "Use a non-strict dominance comparison when newer equal candidates should replace older ones.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_deque_front_and_back_responsibilities",
    "secondarySkillAtomIds": [
      "separate_stale_and_dominance_removal",
      "review_monotonic_deque_operations"
    ],
    "type": "solution_comparison",
    "prompt": "Which mapping of deque ends to responsibilities is correct?\n\nA. Remove indexes that left the window.\nB. Remove candidates dominated by the incoming value.\nC. Read the current extreme.",
    "options": [
      {
        "id": "front_back_front",
        "text": "A uses the front, B uses the back, and C reads the front.",
        "isCorrect": true
      },
      {
        "id": "back_front_back",
        "text": "A uses the back, B uses the front, and C reads the back.",
        "isCorrect": false
      },
      {
        "id": "front_front_back",
        "text": "A and B both use only the front, while C reads the back.",
        "isCorrect": false
      },
      {
        "id": "back_back_back",
        "text": "All three operations use only the back.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Arrival order places the oldest candidate at the front, while monotonic cleanup removes trailing dominated candidates.",
      "mentalModelCorrection": "The deque's two ends support different invariants rather than interchangeable removal operations.",
      "mistakeTypes": [
        "deque_end_responsibilities_conflated"
      ],
      "nextAction": "Classify each operation as age-based, value-dominance-based, or answer-reading.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-monotonic-deque-window-extremes-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_monotonic_deque_window_invariant",
    "secondarySkillAtomIds": [
      "prove_extreme_candidate_survival",
      "connect_freshness_dominance_and_output"
    ],
    "type": "invariant_identification",
    "prompt": "Which invariant most completely explains a correct index-based deque for fixed-window maxima?",
    "options": [
      {
        "id": "fresh_increasing_indexes_decreasing_values",
        "text": "Deque indexes are in increasing arrival order, every stored index belongs to the current window before output, referenced values are nonincreasing from front to back under the chosen tie policy, and every removed back candidate is dominated by a newer value.",
        "isCorrect": true
      },
      {
        "id": "all_window_indexes_stored",
        "text": "The deque stores every index in the current window, regardless of whether it can still become the maximum.",
        "isCorrect": false
      },
      {
        "id": "values_sorted_globally",
        "text": "The input values are globally sorted after each insertion.",
        "isCorrect": false
      },
      {
        "id": "front_freshness_optional",
        "text": "The front may refer to an expired index as long as its value is large enough.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The front is a valid maximum only when candidate age, monotonic value order, and dominance elimination are all correct.",
      "mentalModelCorrection": "A monotonic deque is not merely sorted storage; it is a filtered sequence of fresh, undominated candidates.",
      "mistakeTypes": [
        "monotonic_deque_correctness_invariant_incomplete"
      ],
      "nextAction": "Before every output, verify index order, freshness, value monotonicity, and the tie policy.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
