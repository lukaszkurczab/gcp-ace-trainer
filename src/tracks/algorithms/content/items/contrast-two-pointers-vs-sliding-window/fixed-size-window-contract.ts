import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const fixedSizeWindowContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_fixed_size_window_contract",
    "secondarySkillAtomIds": [
      "represent_contiguous_window_with_boundaries",
      "distinguish_window_boundaries_from_candidates"
    ],
    "type": "single_choice",
    "prompt": "In a fixed-size sliding window with size k, what do left and right represent?",
    "options": [
      {
        "id": "same_contiguous_range",
        "text": "They are the boundaries of one contiguous range, and every recorded window must satisfy right - left + 1 === k.",
        "isCorrect": true
      },
      {
        "id": "independent_candidates",
        "text": "They are two independent candidate indexes whose values are compared with each other.",
        "isCorrect": false
      },
      {
        "id": "optional_boundaries",
        "text": "They mark an approximate range whose size may vary whenever the current aggregate changes.",
        "isCorrect": false
      },
      {
        "id": "processed_unprocessed",
        "text": "left marks all processed elements, while right marks all elements that remain unprocessed.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The problem asks about every contiguous range containing exactly k elements.",
      "mentalModelCorrection": "The two indexes are not independent candidates. Together they describe one window with a fixed length.",
      "mistakeTypes": [
        "independent_pointer_interpretation"
      ],
      "nextAction": "Write the invariant right - left + 1 === k for every window that contributes a result.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "order_fixed_window_updates",
    "secondarySkillAtomIds": [
      "add_incoming_window_contribution",
      "remove_outgoing_window_contribution",
      "record_complete_window"
    ],
    "type": "subgoal_ordering",
    "prompt": "A loop advances right from left to right and maintains a rolling sum for windows of exactly k elements.\n\nWhich sequence correctly processes each complete window?",
    "options": [
      {
        "id": "add_record_remove_advance",
        "text": "Add values[right]; once the window is complete, record its sum; remove values[left]; then increment left.",
        "isCorrect": true
      },
      {
        "id": "record_add_remove_advance",
        "text": "Record the sum; add values[right]; remove values[left]; then increment left.",
        "isCorrect": false
      },
      {
        "id": "add_remove_record_advance",
        "text": "Add values[right]; immediately remove values[left]; record the sum; then increment left.",
        "isCorrect": false
      },
      {
        "id": "add_record_conditional_shrink",
        "text": "Add values[right]; record the sum; shrink only when the sum exceeds a threshold.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The current complete window must be measured before its outgoing element is removed.",
      "mentalModelCorrection": "The incoming contribution completes the new window. Record that window first, then prepare the state for the next one.",
      "mistakeTypes": [
        "fixed_window_update_order_mismatch"
      ],
      "nextAction": "Separate processing the current window from preparing the next window.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_fixed_window_rolling_sum",
    "secondarySkillAtomIds": [
      "add_incoming_window_contribution",
      "remove_outgoing_window_contribution"
    ],
    "type": "single_choice",
    "prompt": "A rolling sum processes:\n\nvalues = [5, 2, 4, 1]\nk = 3\n\nWhat sums should be recorded, in order?",
    "options": [
      {
        "id": "eleven_seven",
        "text": "[11, 7]",
        "isCorrect": true
      },
      {
        "id": "five_seven_eleven_twelve",
        "text": "[5, 7, 11, 12]",
        "isCorrect": false
      },
      {
        "id": "eleven_twelve",
        "text": "[11, 12]",
        "isCorrect": false
      },
      {
        "id": "seven_five",
        "text": "[7, 5]",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "There are two complete contiguous windows: [5, 2, 4] and [2, 4, 1].",
      "mentalModelCorrection": "Moving to the second window adds 1 but also removes the outgoing 5.",
      "mistakeTypes": [
        "rolling_sum_trace_mismatch"
      ],
      "nextAction": "For every shift, explicitly name the incoming and outgoing elements.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_missing_outgoing_update",
    "secondarySkillAtomIds": [
      "maintain_fixed_window_aggregate",
      "remove_outgoing_window_contribution"
    ],
    "type": "single_choice",
    "prompt": "Review this attempted fixed-window sum:\n\nlet left = 0;\nlet sum = 0;\n\nfor (let right = 0; right < values.length; right++) {\n  sum += values[right];\n\n  if (right - left + 1 === k) {\n    results.push(sum);\n    left++;\n  }\n}\n\nWhat is the main bug?",
    "options": [
      {
        "id": "outgoing_not_removed",
        "text": "The code advances left without subtracting values[left], so sum continues to contain elements outside the next window.",
        "isCorrect": true
      },
      {
        "id": "right_should_decrement",
        "text": "right must move backward whenever left moves forward.",
        "isCorrect": false
      },
      {
        "id": "record_before_complete",
        "text": "The code records windows before they contain k elements.",
        "isCorrect": false
      },
      {
        "id": "left_should_reset",
        "text": "left must be reset to zero after every recorded window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The boundary moves, but the maintained aggregate is not updated to match the new boundary.",
      "mentalModelCorrection": "Window state and window indexes must describe the same range. Moving left requires removing the contribution that left leaves behind.",
      "mistakeTypes": [
        "outgoing_contribution_not_removed"
      ],
      "nextAction": "Pair every left increment with removal of the old values[left] contribution.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_fixed_from_variable_window_movement",
    "secondarySkillAtomIds": [
      "preserve_exact_window_size",
      "reject_conditional_fixed_window_shrinking"
    ],
    "type": "solution_comparison",
    "prompt": "A task asks for the maximum sum among all contiguous ranges of exactly k elements.\n\nWhich movement strategy matches that contract?",
    "options": [
      {
        "id": "shift_once_after_complete",
        "text": "Whenever a complete size-k window is recorded, remove its leftmost contribution and move left forward exactly once.",
        "isCorrect": true
      },
      {
        "id": "shrink_when_sum_large",
        "text": "Shrink repeatedly while the current sum exceeds the best sum seen so far.",
        "isCorrect": false
      },
      {
        "id": "shrink_when_negative",
        "text": "Shrink only when the outgoing value is negative.",
        "isCorrect": false
      },
      {
        "id": "move_independently",
        "text": "Move left and right independently according to which endpoint currently has the larger value.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Every candidate range must contain exactly k elements, regardless of its values.",
      "mentalModelCorrection": "A fixed-size contract determines when left moves. The aggregate does not decide whether the window should shrink.",
      "mistakeTypes": [
        "conditional_shrinking_in_fixed_window"
      ],
      "nextAction": "Derive pointer movement from the required size, not from a validity condition.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "record_only_complete_fixed_windows",
    "secondarySkillAtomIds": [
      "detect_incomplete_initial_window",
      "validate_window_size_before_recording"
    ],
    "type": "single_choice",
    "prompt": "Review this implementation:\n\nlet left = 0;\nlet sum = 0;\nlet best = -Infinity;\n\nfor (let right = 0; right < values.length; right++) {\n  sum += values[right];\n  best = Math.max(best, sum);\n\n  if (right - left + 1 === k) {\n    sum -= values[left];\n    left++;\n  }\n}\n\nWhy is it incorrect for finding the best sum of exactly k elements?",
    "options": [
      {
        "id": "records_partial_windows",
        "text": "It updates best before checking that the current range contains k elements, so incomplete initial ranges can be accepted.",
        "isCorrect": true
      },
      {
        "id": "removes_too_late",
        "text": "It must remove values[left] before adding values[right].",
        "isCorrect": false
      },
      {
        "id": "needs_nested_loop",
        "text": "A fixed-size window requires a nested loop to verify every element in the current range.",
        "isCorrect": false
      },
      {
        "id": "best_requires_zero",
        "text": "best must start at zero for every fixed-size window problem.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The result is updated for ranges of sizes 1, 2, and so on before the first size-k range exists.",
      "mentalModelCorrection": "Only a complete window satisfying the exact size contract may contribute to the answer.",
      "mistakeTypes": [
        "incomplete_window_recorded"
      ],
      "nextAction": "Place result recording inside the branch that proves the window size is exactly k.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The first window is built once, and every subsequent window is derived with one incoming addition and one outgoing subtraction.",
    "id": "alg-contrast-fixed-size-window-contract-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_rolling_fixed_window_update",
    "secondarySkillAtomIds": [
      "avoid_recomputing_fixed_windows",
      "derive_fixed_window_complexity"
    ],
    "type": "solution_comparison",
    "prompt": "Two implementations compute the sum of every contiguous range of k elements.\n\nSolution A starts a new inner loop for every starting index and sums all k elements again.\n\nSolution B computes the first sum once, then adds the incoming value and removes the outgoing value after each shift.\n\nWhich comparison is correct?",
    "options": [
      {
        "id": "rolling_linear_recompute_nk",
        "text": "Both can produce the same results, but Solution B is O(n), while Solution A is O(nk) in the general case.",
        "isCorrect": true
      },
      {
        "id": "both_linear",
        "text": "Both are O(n) because both inspect the same set of windows.",
        "isCorrect": false
      },
      {
        "id": "recompute_more_correct",
        "text": "Solution A is more correct because a valid window must always be reconstructed from scratch.",
        "isCorrect": false
      },
      {
        "id": "rolling_k_space",
        "text": "Solution B requires O(k) auxiliary space because it must copy every active window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The outgoing contribution can be reversed, so most work from the previous window can be reused.",
      "mentalModelCorrection": "Conceptually containing k values does not require processing all k values again after every one-position shift.",
      "mistakeTypes": [
        "fixed_window_recomputed_from_scratch"
      ],
      "nextAction": "Identify which contribution enters and which leaves when adjacent windows overlap.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_fixed_window_size_one",
    "secondarySkillAtomIds": [
      "record_complete_window",
      "reason_about_fixed_window_edge_cases"
    ],
    "type": "edge_case_drill",
    "prompt": "For an input containing n elements and k = 1, how should a correct fixed-size window behave?",
    "options": [
      {
        "id": "each_element_one_window",
        "text": "Every individual element is a complete window, so exactly n windows are recorded.",
        "isCorrect": true
      },
      {
        "id": "no_sliding_needed_no_windows",
        "text": "No windows are recorded because a sliding window requires at least two elements.",
        "isCorrect": false
      },
      {
        "id": "one_full_array_window",
        "text": "The entire array is treated as one window because k is the smallest allowed size.",
        "isCorrect": false
      },
      {
        "id": "n_minus_one_windows",
        "text": "Exactly n - 1 windows are recorded because each shift needs an outgoing and incoming element.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A contiguous range of exactly one element is valid at every array position.",
      "mentalModelCorrection": "The first window is already complete when the first element is added.",
      "mistakeTypes": [
        "fixed_window_k_one_edge_case"
      ],
      "nextAction": "Test the invariant right - left + 1 === k with k equal to one.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_full_length_fixed_window",
    "secondarySkillAtomIds": [
      "count_complete_fixed_windows",
      "reason_about_fixed_window_edge_cases"
    ],
    "type": "edge_case_drill",
    "prompt": "An array has n elements and the required fixed window size is also n. How many complete windows exist?",
    "options": [
      {
        "id": "exactly_one",
        "text": "Exactly one: the entire array.",
        "isCorrect": true
      },
      {
        "id": "n",
        "text": "n, because right visits every index.",
        "isCorrect": false
      },
      {
        "id": "n_minus_one",
        "text": "n - 1, because the first index only initializes the window.",
        "isCorrect": false
      },
      {
        "id": "zero",
        "text": "Zero, because the window cannot shift to a second position.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A complete window does not need to have a later neighboring window.",
      "mentalModelCorrection": "When k equals n, the initial completed range is also the only valid range.",
      "mistakeTypes": [
        "full_length_window_count_mismatch"
      ],
      "nextAction": "Use the complete-window count n - k + 1 for valid values of k.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-fixed-size-window-contract-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "maintain_removable_fixed_window_count",
    "secondarySkillAtomIds": [
      "add_incoming_window_contribution",
      "remove_outgoing_window_contribution",
      "trace_fixed_window_state"
    ],
    "type": "single_choice",
    "prompt": "A size-3 window maintains the number of odd values rather than their sum.\n\nvalues = [1, 2, 5, 4]\n\nThe first window [1, 2, 5] contains 2 odd values. What count should the next window [2, 5, 4] contain, and how is it obtained?",
    "options": [
      {
        "id": "one_remove_odd_add_even",
        "text": "1; remove the contribution of outgoing 1 and add the contribution of incoming 4.",
        "isCorrect": true
      },
      {
        "id": "two_no_update",
        "text": "2; the window size remains three, so the count cannot change.",
        "isCorrect": false
      },
      {
        "id": "three_add_only",
        "text": "3; add incoming 4 without changing the previous count.",
        "isCorrect": false
      },
      {
        "id": "zero_remove_all",
        "text": "0; all state must be reset whenever the window moves.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The maintained state is a sum of per-element contributions: one for odd and zero for even.",
      "mentalModelCorrection": "Rolling-window state need not be a numeric sum of the original values. It only needs removable incoming and outgoing contributions.",
      "mistakeTypes": [
        "removable_state_update_mismatch"
      ],
      "nextAction": "Define each element's contribution, then update the aggregate when that element enters or leaves.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-fixed-size-window-contract-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_window_boundaries_from_candidates",
    "secondarySkillAtomIds": [
      "represent_contiguous_window_with_boundaries",
      "derive_fixed_window_left_boundary"
    ],
    "type": "single_choice",
    "prompt": "A learner says:\n\n\"Because left and right stay k - 1 positions apart, this is just a two-pointer algorithm comparing two elements separated by k - 1 indexes.\"\n\nWhat is the best correction?",
    "options": [
      {
        "id": "boundaries_include_middle",
        "text": "left and right bound one contiguous window that also includes every element between them; they are not merely two selected candidates.",
        "isCorrect": true
      },
      {
        "id": "same_pattern_always",
        "text": "The learner is correct because all algorithms with two indexes are the same pattern.",
        "isCorrect": false
      },
      {
        "id": "only_endpoints_matter",
        "text": "Only values[left] and values[right] belong to the window; middle elements are ignored.",
        "isCorrect": false
      },
      {
        "id": "distance_should_vary",
        "text": "A fixed-size window is valid only when the distance between left and right changes during the scan.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The answer depends on the complete contiguous range rather than only on two endpoint values.",
      "mentalModelCorrection": "The indexes define the boundaries of a collection of k elements. The maintained state summarizes that whole collection.",
      "mistakeTypes": [
        "window_treated_as_endpoint_pair"
      ],
      "nextAction": "Translate [left, right] into the explicit set of indexes left through right.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-fixed-size-window-contract-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_fixed_window_recording_count",
    "secondarySkillAtomIds": [
      "record_complete_window",
      "detect_fixed_window_off_by_one"
    ],
    "type": "edge_case_drill",
    "prompt": "An array has length 7 and k = 3.\n\nA correct implementation records a result whenever it has formed another complete size-3 window. How many results should it record, and what are the starting indexes?",
    "options": [
      {
        "id": "five_zero_to_four",
        "text": "5 results, starting at indexes 0, 1, 2, 3, and 4.",
        "isCorrect": true
      },
      {
        "id": "four_zero_to_three",
        "text": "4 results, starting at indexes 0, 1, 2, and 3.",
        "isCorrect": false
      },
      {
        "id": "seven_every_index",
        "text": "7 results, one for every value visited by right.",
        "isCorrect": false
      },
      {
        "id": "three_zero_to_two",
        "text": "3 results, because each window contains three elements.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A starting index is valid when k elements still fit between it and the end of the array.",
      "mentalModelCorrection": "The number of complete fixed-size windows is n - k + 1, not n, k, or n - k.",
      "mistakeTypes": [
        "fixed_window_count_off_by_one"
      ],
      "nextAction": "Check both the first valid start, zero, and the final valid start, n - k.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
