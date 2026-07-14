import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const prefixSumsTwoPointersAndInvalidCasesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_sliding_window_from_prefix_sum",
    "secondarySkillAtomIds": [
      "recognize_dynamic_contiguous_interval",
      "recognize_static_range_query"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two tasks:\n\nA. Find the longest contiguous segment satisfying a condition while scanning once.\nB. Answer many sum queries for arbitrary fixed ranges [left, right].\n\nWhich classification is most appropriate?",
    "options": [
      {
        "id": "window_then_prefix_sum",
        "text": "A suggests a sliding window; B suggests prefix sums.",
        "isCorrect": true
      },
      {
        "id": "prefix_sum_then_window",
        "text": "A suggests prefix sums; B suggests a sliding window.",
        "isCorrect": false
      },
      {
        "id": "both_sliding_window",
        "text": "Both are sliding-window tasks because both involve range boundaries.",
        "isCorrect": false
      },
      {
        "id": "both_general_two_pointers",
        "text": "Both are general two-pointer pair searches because each uses two indexes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A maintains and changes one active contiguous candidate; B computes independent range aggregates from preprocessed cumulative state.",
      "mentalModelCorrection": "Sliding windows optimize a moving interval, while prefix sums answer range queries without simulating interval movement.",
      "mistakeTypes": [
        "sliding_window_and_prefix_sum_conflated"
      ],
      "nextAction": "Ask whether boundaries evolve as one candidate or identify independent query ranges.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_prefix_sum_range_query_signal",
    "secondarySkillAtomIds": [
      "use_cumulative_range_state",
      "support_mixed_sign_range_sums"
    ],
    "type": "single_choice",
    "prompt": "An array contains positive and negative values. The task asks for the sum of thousands of arbitrary contiguous ranges without modifying the array. Which technique is the strongest default?",
    "options": [
      {
        "id": "prefix_sums",
        "text": "Build prefix sums and answer each range sum by subtracting two cumulative values.",
        "isCorrect": true
      },
      {
        "id": "variable_sliding_window",
        "text": "Maintain one variable-size window and reuse it for every unrelated query.",
        "isCorrect": false
      },
      {
        "id": "opposite_end_two_pointers",
        "text": "Move pointers inward from both ends for every query.",
        "isCorrect": false
      },
      {
        "id": "difference_array",
        "text": "Store range-update deltas even though the task asks only for range queries.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The input is static and the workload consists of many independent contiguous range-sum queries.",
      "mentalModelCorrection": "Prefix sums work with mixed signs because they compute exact aggregates rather than relying on monotonic window movement.",
      "mistakeTypes": [
        "range_queries_assigned_to_sliding_window"
      ],
      "nextAction": "Separate preprocessing for arbitrary queries from online optimization of one moving interval.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_sliding_window_from_general_two_pointers",
    "secondarySkillAtomIds": [
      "recognize_contiguous_window_state",
      "recognize_selected_pair_relation"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two candidates:\n\nA. Every element between left and right contributes to the maintained sum.\nB. Only values[left] and values[right] form the current candidate pair.\n\nWhich distinction is correct?",
    "options": [
      {
        "id": "window_then_pair_pointers",
        "text": "A describes a sliding window; B describes pair-oriented two pointers.",
        "isCorrect": true
      },
      {
        "id": "both_windows",
        "text": "Both describe sliding windows because an interval exists between the pointers.",
        "isCorrect": false
      },
      {
        "id": "both_pair_pointers",
        "text": "Both describe pair-oriented two pointers because only the boundaries matter.",
        "isCorrect": false
      },
      {
        "id": "prefix_then_difference",
        "text": "A describes prefix sums; B describes a difference array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A evaluates the complete contiguous interior, while B evaluates two selected positions.",
      "mentalModelCorrection": "The same pointer names can represent either an active interval or independent endpoint candidates.",
      "mistakeTypes": [
        "window_and_pair_two_pointers_classified_by_shape"
      ],
      "nextAction": "List exactly which elements contribute to evaluating the current candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_difference_array_from_prefix_sum",
    "secondarySkillAtomIds": [
      "recognize_range_update_workload",
      "recognize_range_query_workload"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two workloads:\n\nA. Apply many additions to complete ranges, then reconstruct the final array once.\nB. Keep the array unchanged and answer many range-sum queries.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "difference_then_prefix",
        "text": "A suggests a difference array; B suggests prefix sums.",
        "isCorrect": true
      },
      {
        "id": "prefix_then_difference",
        "text": "A suggests prefix sums; B suggests a difference array.",
        "isCorrect": false
      },
      {
        "id": "both_windows",
        "text": "Both require sliding windows because each operation has left and right boundaries.",
        "isCorrect": false
      },
      {
        "id": "both_pair_searches",
        "text": "Both are general two-pointer searches over endpoint values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Difference arrays encode boundary changes for updates; prefix sums encode cumulative state for queries.",
      "mentalModelCorrection": "Both use cumulative reconstruction ideas, but they solve opposite workload directions.",
      "mistakeTypes": [
        "difference_array_and_prefix_sum_conflated"
      ],
      "nextAction": "Ask whether ranges are being modified or merely measured.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_nonmonotonic_sum_window_with_mixed_signs",
    "secondarySkillAtomIds": [
      "diagnose_mixed_sign_window_movement",
      "require_safe_shrink_rule"
    ],
    "type": "mistake_review",
    "prompt": "A candidate wants the shortest contiguous subarray with sum at least target.\n\nThe array may contain negative values. Their rule is:\n\n- expand right while the sum is too small,\n- shrink left while the sum is large enough.\n\nWhy is this ordinary sliding-window rule unsafe?",
    "options": [
      {
        "id": "mixed_signs_break_sum_monotonicity",
        "text": "With negative values, expanding may decrease the sum and shrinking may increase it, so the comparison does not justify irreversible boundary movement.",
        "isCorrect": true
      },
      {
        "id": "negative_values_cannot_be_summed",
        "text": "Subarray sums are undefined when the input contains negative values.",
        "isCorrect": false
      },
      {
        "id": "left_must_never_move",
        "text": "A sliding window is valid only when the left boundary remains fixed.",
        "isCorrect": false
      },
      {
        "id": "target_must_be_negative",
        "text": "The strategy becomes valid only when target is negative.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The maintained aggregate lacks the monotonic behavior required by the proposed expand-and-shrink rule.",
      "mentalModelCorrection": "Contiguity alone does not justify a sliding window; boundary movement must preserve all possible answers.",
      "mistakeTypes": [
        "mixed_sign_sum_uses_nonmonotonic_window"
      ],
      "nextAction": "Test how adding or removing one negative value changes the maintained sum.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_non_contiguous_subsequence_not_window",
    "secondarySkillAtomIds": [
      "distinguish_subarray_from_subsequence",
      "reject_window_for_skipped_positions"
    ],
    "type": "mistake_review",
    "prompt": "A task asks for the longest subsequence satisfying a condition, and selected elements may skip arbitrary indexes. A reviewer recommends a sliding window because the result has a beginning and an end. What is wrong?",
    "options": [
      {
        "id": "window_requires_contiguous_membership",
        "text": "A sliding window represents every element in one contiguous interval, while a subsequence may omit interior positions.",
        "isCorrect": true
      },
      {
        "id": "subsequences_have_no_indexes",
        "text": "A subsequence never refers to positions in the original input.",
        "isCorrect": false
      },
      {
        "id": "windows_require_sorted_input",
        "text": "The only issue is that sliding windows require sorted arrays.",
        "isCorrect": false
      },
      {
        "id": "two_boundaries_make_it_valid",
        "text": "The recommendation is correct because any chosen elements have a first and last index.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Interior membership is optional for a subsequence but mandatory for a window.",
      "mentalModelCorrection": "A first and last selected position do not turn a non-contiguous selection into a contiguous candidate.",
      "mistakeTypes": [
        "noncontiguous_subsequence_called_sliding_window"
      ],
      "nextAction": "Check whether every index between the candidate boundaries must belong to the candidate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_technique_selection_by_label",
    "secondarySkillAtomIds": [
      "classify_by_invariant",
      "avoid_keyword_driven_pattern_choice"
    ],
    "type": "mistake_review",
    "prompt": "A reviewer says:\n\n\"The prompt contains the words contiguous range, so the solution must use a sliding window.\"\n\nWhat is the best correction?",
    "options": [
      {
        "id": "contiguity_not_sufficient",
        "text": "Contiguity is only one signal; the task also needs maintainable state and a safe rule for advancing or shrinking boundaries.",
        "isCorrect": true
      },
      {
        "id": "all_ranges_use_prefix_sums",
        "text": "Every contiguous-range problem must instead use prefix sums.",
        "isCorrect": false
      },
      {
        "id": "keywords_define_algorithms",
        "text": "The statement is correct because algorithm choice follows prompt vocabulary.",
        "isCorrect": false
      },
      {
        "id": "windows_need_two_targets",
        "text": "A sliding window is valid only when the prompt contains two numeric targets.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The task description does not yet establish a monotonic or otherwise safe boundary-update invariant.",
      "mentalModelCorrection": "Pattern recognition should use candidate semantics and movement proofs rather than isolated keywords.",
      "mistakeTypes": [
        "sliding_window_selected_by_problem_label"
      ],
      "nextAction": "Explain what state changes when each boundary moves and why no valid answer is lost.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_technique_selection_by_big_o",
    "secondarySkillAtomIds": [
      "prioritize_correctness_preconditions",
      "distinguish_complexity_from_strategy_validity"
    ],
    "type": "mistake_review",
    "prompt": "Two proposed solutions are both described as O(n):\n\nA. A sliding window whose shrink rule is not valid for the input.\nB. A prefix-based method with a proved invariant.\n\nA candidate chooses A because \"sliding windows are the standard O(n) technique.\"\n\nWhat is the central mistake?",
    "options": [
      {
        "id": "same_big_o_does_not_prove_correctness",
        "text": "Asymptotic time does not establish that a technique's movement rule is correct for the problem.",
        "isCorrect": true
      },
      {
        "id": "prefix_methods_cannot_be_linear",
        "text": "Prefix-based methods can never run in O(n).",
        "isCorrect": false
      },
      {
        "id": "sliding_windows_are_always_faster",
        "text": "The candidate is correct because sliding windows dominate every other linear method.",
        "isCorrect": false
      },
      {
        "id": "only_space_matters",
        "text": "The choice should depend only on which method uses fewer variable names.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The proposed window lacks a correctness argument even though its loop may be linear.",
      "mentalModelCorrection": "Complexity compares valid algorithms; it cannot repair an invalid invariant.",
      "mistakeTypes": [
        "strategy_selected_by_big_o_alone"
      ],
      "nextAction": "Prove correctness before comparing time and space bounds.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_between_prefix_sums_and_sliding_window",
    "secondarySkillAtomIds": [
      "recognize_exact_range_enumeration",
      "recognize_monotonic_window_optimization"
    ],
    "type": "solution_comparison",
    "prompt": "Which pairing is most appropriate?\n\nA. Count contiguous subarrays whose sum equals target when values may be negative.\nB. Find the longest contiguous subarray with sum at most target when every value is nonnegative.",
    "options": [
      {
        "id": "prefix_hash_then_window",
        "text": "A suggests prefix sums with frequency lookup; B supports a sliding window.",
        "isCorrect": true
      },
      {
        "id": "window_then_prefix",
        "text": "A supports an ordinary sliding window; B requires only static prefix sums.",
        "isCorrect": false
      },
      {
        "id": "both_ordinary_windows",
        "text": "Both support the same expand-and-shrink window rule regardless of signs.",
        "isCorrect": false
      },
      {
        "id": "both_difference_arrays",
        "text": "Both should encode range updates with a difference array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Mixed signs break ordinary sum-window monotonicity in A, while nonnegative values make exceeding and restoring the bound monotonic in B.",
      "mentalModelCorrection": "The same sum vocabulary can require different techniques depending on input constraints and output contract.",
      "mistakeTypes": [
        "sum_problem_constraints_ignored_in_strategy_choice"
      ],
      "nextAction": "Check how adding or removing one element affects the constraint under the stated value domain.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-window-contrast-prefix-two-pointers-invalid-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "classify_window_prefix_pointer_and_difference_cases",
    "secondarySkillAtomIds": [
      "compare_range_technique_signals",
      "reject_nonmonotonic_window"
    ],
    "type": "solution_comparison",
    "prompt": "Match each task to the strongest classification:\n\nA. Maintain one contiguous active interval whose state changes incrementally.\nB. Answer many immutable range-sum queries.\nC. Compare two selected sorted endpoint values.\nD. Apply many range increments and reconstruct final values.\nE. Shrink a sum window on mixed-sign input without any monotonic proof.\n\nWhich mapping is correct?",
    "options": [
      {
        "id": "window_prefix_two_pointer_difference_invalid",
        "text": "A: sliding window; B: prefix sums; C: general two pointers; D: difference array; E: invalid window rule.",
        "isCorrect": true
      },
      {
        "id": "all_windows",
        "text": "All five are sliding-window techniques because all may use boundaries.",
        "isCorrect": false
      },
      {
        "id": "prefix_window_difference_two_pointer_valid",
        "text": "A: prefix sums; B: sliding window; C: difference array; D: two pointers; E: valid sliding window.",
        "isCorrect": false
      },
      {
        "id": "all_linear_equivalent",
        "text": "All five are interchangeable whenever they can be implemented in O(n).",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each technique is defined by a different state model, workload, or candidate-elimination invariant.",
      "mentalModelCorrection": "Range boundaries and similar complexity do not make these techniques equivalent.",
      "mistakeTypes": [
        "range_techniques_and_invalid_window_conflated"
      ],
      "nextAction": "For each task, identify whether it maintains, queries, updates, compares, or invalidly discards a range.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
