import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const complexitySpaceAndMistakeReviewQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-complexity-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_sliding_window_complexity",
    "secondarySkillAtomIds": [
      "monotonic_boundary_movement",
      "amortized_pointer_analysis"
    ],
    "type": "single_choice",
    "prompt": "A variable sliding-window algorithm advances right from left to right once. Inside the loop, it advances left while the current window is invalid. Why can the total running time still be O(n)?",
    "feedbackModel": {
      "decisionSignal": "The complexity depends on total boundary movement, not on the visual nesting of the loops.",
      "mentalModelCorrection": "The inner loop may execute many times during one outer iteration, but left never moves backward. Across the whole run, left and right each advance at most n times.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Count total pointer movements across the full execution instead of multiplying loop bounds mechanically.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "each_boundary_moves_at_most_n",
        "text": "Both boundaries move only forward, so each advances at most n times across the entire execution.",
        "isCorrect": true
      },
      {
        "id": "while_loop_runs_once",
        "text": "The inner while loop can execute at most once for each right position.",
        "isCorrect": false
      },
      {
        "id": "nested_loops_are_linear",
        "text": "Any nested loops using two indexes are automatically O(n).",
        "isCorrect": false
      },
      {
        "id": "window_state_is_constant",
        "text": "Maintaining constant-size window state makes the number of loop iterations irrelevant.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-complexity-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_prefix_query_complexity",
    "secondarySkillAtomIds": [
      "prefix_preprocessing_cost",
      "batch_query_complexity"
    ],
    "type": "single_choice",
    "prompt": "An immutable array of length n is preprocessed into prefix sums, then q arbitrary range-sum queries are answered. What is the total time complexity?",
    "feedbackModel": {
      "decisionSignal": "The total cost includes both one-time preprocessing and all query answers.",
      "mentalModelCorrection": "O(1) per query describes only the query phase. Building the prefix array still costs O(n), so the complete workload is O(n + q).",
      "mistakeTypes": [
        "omitted_preprocessing_cost"
      ],
      "nextAction": "Separate preprocessing, per-operation work, and the number of operations before combining the costs.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "n_plus_q",
        "text": "O(n + q): O(n) preprocessing and O(1) work for each of q queries.",
        "isCorrect": true
      },
      {
        "id": "q_only",
        "text": "O(q), because every query is answered in constant time.",
        "isCorrect": false
      },
      {
        "id": "n_times_q",
        "text": "O(nq), because the prefix array is consulted for every query.",
        "isCorrect": false
      },
      {
        "id": "log_n_per_query",
        "text": "O(n + q log n), because each query searches the prefix array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-complexity-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_prefix_space_complexity",
    "secondarySkillAtomIds": [
      "auxiliary_space_analysis",
      "prefix_array_storage"
    ],
    "type": "single_choice",
    "prompt": "A solution creates a new prefix-sum array containing n + 1 values. What is its auxiliary-space complexity under the standard model?",
    "feedbackModel": {
      "decisionSignal": "Auxiliary space counts the number of extra stored values, not the cost of computing one value.",
      "mentalModelCorrection": "A separate prefix array stores one additional value per input boundary, so its size is proportional to n.",
      "mistakeTypes": [
        "space_complexity_mismatch"
      ],
      "nextAction": "Count all additional storage whose size depends on the input.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "linear_space",
        "text": "O(n), because the additional prefix array grows with the input size.",
        "isCorrect": true
      },
      {
        "id": "constant_space",
        "text": "O(1), because each prefix value is computed in constant time.",
        "isCorrect": false
      },
      {
        "id": "logarithmic_space",
        "text": "O(log n), because only cumulative values are stored.",
        "isCorrect": false
      },
      {
        "id": "zero_space",
        "text": "O(0), because the prefix values are derived from the input.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-complexity-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "analyze_window_state_space",
    "secondarySkillAtomIds": [
      "frequency_map_space",
      "window_dependent_state"
    ],
    "type": "single_choice",
    "prompt": "A sliding-window solution stores a frequency Map for every distinct value currently in the window. Which space analysis is most accurate?",
    "feedbackModel": {
      "decisionSignal": "The state size depends on how many distinct values must be represented inside the active window.",
      "mentalModelCorrection": "Two pointers do not imply constant auxiliary space. Frequency-based windows may require state proportional to the number of distinct active values.",
      "mistakeTypes": [
        "space_complexity_mismatch"
      ],
      "nextAction": "Analyze the maintained state separately from the pointer variables.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "up_to_window_or_n",
        "text": "O(d), where d is the number of distinct values in the current window, and O(n) in the worst case.",
        "isCorrect": true
      },
      {
        "id": "always_constant",
        "text": "O(1), because sliding-window algorithms use only two pointers.",
        "isCorrect": false
      },
      {
        "id": "always_window_length",
        "text": "Exactly O(k), even when the window size is variable and many values repeat.",
        "isCorrect": false
      },
      {
        "id": "same_as_prefix",
        "text": "Always O(n), because every sliding-window solution stores one entry per input element.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-complexity-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_naive_and_prefix_query_cost",
    "secondarySkillAtomIds": [
      "repeated_range_scan",
      "preprocessing_tradeoff"
    ],
    "type": "solution_comparison",
    "prompt": "An array has length n, and q range-sum queries may each cover nearly the entire array. Solution A scans every requested range. Solution B builds prefix sums once. Which comparison is correct?",
    "feedbackModel": {
      "decisionSignal": "The naive method may revisit O(n) elements for every query, while prefix preprocessing avoids repeated scans.",
      "mentalModelCorrection": "Producing q outputs does not make the work O(q) when each output requires scanning a large range.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Multiply per-query work by the number of queries, then compare it with one-time preprocessing.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "naive_nq_prefix_n_plus_q",
        "text": "Solution A is O(nq) in the worst case, while Solution B is O(n + q).",
        "isCorrect": true
      },
      {
        "id": "both_n_plus_q",
        "text": "Both are O(n + q), because each query produces one output.",
        "isCorrect": false
      },
      {
        "id": "naive_q_prefix_nq",
        "text": "Solution A is O(q), while Solution B is O(nq) because it stores prefixes.",
        "isCorrect": false
      },
      {
        "id": "both_nq",
        "text": "Both are O(nq), because every query depends on array values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-complexity-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_sliding_window_linear_time",
    "secondarySkillAtomIds": [
      "boundary_progress_proof",
      "invalid_pointer_reset"
    ],
    "type": "single_choice",
    "prompt": "A proposed 'sliding-window' algorithm sometimes moves left backward after moving right forward. Can it be classified as O(n) solely because it uses two boundaries?",
    "feedbackModel": {
      "decisionSignal": "The standard linear proof depends on each boundary advancing monotonically and only a bounded number of times.",
      "mentalModelCorrection": "Two pointer variables do not establish O(n). Backtracking boundaries may revisit states and require a different complexity argument.",
      "mistakeTypes": [
        "unsupported_complexity_claim"
      ],
      "nextAction": "State a progress bound for every pointer before claiming amortized linear time.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "no_monotonicity_missing",
        "text": "No. A linear bound requires proving a bounded total number of movements, which backward motion may violate.",
        "isCorrect": true
      },
      {
        "id": "yes_two_boundaries",
        "text": "Yes. Any algorithm with left and right pointers is O(n).",
        "isCorrect": false
      },
      {
        "id": "yes_if_state_constant",
        "text": "Yes, as long as the maintained aggregate uses O(1) space.",
        "isCorrect": false
      },
      {
        "id": "no_always_quadratic",
        "text": "No. Any backward pointer movement automatically makes the algorithm O(n²).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-complexity-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_correctness_before_complexity",
    "secondarySkillAtomIds": [
      "sliding_window_precondition",
      "strategy_validation"
    ],
    "type": "solution_comparison",
    "prompt": "For shortest-subarray-sum-at-least-target with arbitrary positive and negative values, Solution A uses an O(n) variable sliding window whose shrink rule assumes removing the left value always decreases the sum. Solution B uses a correct O(n log n) method. Which should be preferred?",
    "feedbackModel": {
      "decisionSignal": "The lower-complexity solution relies on a monotonicity assumption that is false when negative values are allowed.",
      "mentalModelCorrection": "An invalid O(n) algorithm is not a better solution than a correct O(n log n) algorithm. Correctness and preconditions come before asymptotic comparison.",
      "mistakeTypes": [
        "correctness_before_complexity",
        "invalid_invariant"
      ],
      "nextAction": "Reject approaches whose correctness assumptions do not match the input domain before ranking their complexity.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "correct_n_log_n",
        "text": "Solution B, because Solution A's invariant is invalid for the stated input domain.",
        "isCorrect": true
      },
      {
        "id": "faster_n",
        "text": "Solution A, because O(n) is always preferable to O(n log n).",
        "isCorrect": false
      },
      {
        "id": "both_equivalent",
        "text": "Either one, because negative values affect only constant factors.",
        "isCorrect": false
      },
      {
        "id": "window_after_sort",
        "text": "Solution A, after sorting the input while keeping the same subarray contract.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-complexity-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "analyze_fixed_window_space",
    "secondarySkillAtomIds": [
      "rolling_sum_state",
      "auxiliary_space_analysis"
    ],
    "type": "single_choice",
    "prompt": "A fixed-size sliding-window algorithm maintains only left, right, currentSum, and bestSum. It reads outgoing values directly from the input array. What is its auxiliary-space complexity?",
    "feedbackModel": {
      "decisionSignal": "The algorithm reuses values from the input and stores only a fixed number of scalars.",
      "mentalModelCorrection": "The logical window size does not imply O(k) auxiliary storage when its elements remain in the input and no separate buffer is created.",
      "mistakeTypes": [
        "space_complexity_mismatch"
      ],
      "nextAction": "Distinguish data referenced in the input from additional data structures allocated by the algorithm.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "constant",
        "text": "O(1), because the number of extra variables does not grow with n or k.",
        "isCorrect": true
      },
      {
        "id": "window_size",
        "text": "O(k), because every active window logically contains k values.",
        "isCorrect": false
      },
      {
        "id": "linear",
        "text": "O(n), because the algorithm eventually visits all input values.",
        "isCorrect": false
      },
      {
        "id": "prefix_size",
        "text": "O(n + 1), because every rolling sum is equivalent to a stored prefix.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-complexity-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_prefix_in_place_claim",
    "secondarySkillAtomIds": [
      "mutation_assumption",
      "space_complexity_contract"
    ],
    "type": "single_choice",
    "prompt": "A reviewer claims that prefix sums always use O(1) extra space because the input array can be overwritten with cumulative sums. What is the best response?",
    "feedbackModel": {
      "decisionSignal": "Space complexity depends on whether the implementation may reuse input storage without violating the problem contract.",
      "mentalModelCorrection": "A separate prefix array uses O(n) extra space. An in-place version may use O(1) auxiliary space, but only under an explicit mutation assumption.",
      "mistakeTypes": [
        "unstated_assumption",
        "space_complexity_mismatch"
      ],
      "nextAction": "State mutation assumptions explicitly whenever an in-place implementation changes the space bound.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "depends_on_mutation_contract",
        "text": "That claim is valid only when mutating the input is allowed and no original values are needed later.",
        "isCorrect": true
      },
      {
        "id": "always_true",
        "text": "The claim is always true because a prefix sum needs only the previous prefix while building.",
        "isCorrect": false
      },
      {
        "id": "always_false",
        "text": "The claim is always false because prefix sums require a separate n + 1 array.",
        "isCorrect": false
      },
      {
        "id": "depends_on_positive_values",
        "text": "The claim is valid only when all values are non-negative.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-complexity-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_end_to_end_complexity",
    "secondarySkillAtomIds": [
      "preprocessing_query_tradeoff",
      "correctness_and_complexity_review"
    ],
    "type": "solution_comparison",
    "prompt": "A code review compares two correct solutions for q static range-sum queries over n values. Solution A scans each range in O(length). Solution B builds a separate prefix array and answers each query in O(1). Which review is most accurate?",
    "feedbackModel": {
      "decisionSignal": "The correct comparison includes preprocessing, query workload, auxiliary space, and the number and size of requested ranges.",
      "mentalModelCorrection": "Prefix sums trade O(n) time and storage upfront for O(1) per query. Whether that trade is worthwhile depends on q, range lengths, mutation constraints, and memory limits.",
      "mistakeTypes": [
        "tradeoff_mismatch",
        "omitted_preprocessing_cost"
      ],
      "nextAction": "Compare complete workloads and operational constraints rather than one isolated operation.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "prefix_better_for_many_queries",
        "text": "Solution B uses O(n) preprocessing time and O(n) extra space, then O(q) query time; it is preferable when repeated-query savings justify the storage.",
        "isCorrect": true
      },
      {
        "id": "prefix_always_better",
        "text": "Solution B is always better because O(1) query time dominates every other consideration.",
        "isCorrect": false
      },
      {
        "id": "scan_always_better_space",
        "text": "Solution A is always better because it can use O(1) extra space.",
        "isCorrect": false
      },
      {
        "id": "both_q",
        "text": "Both have O(q) total time because both return q answers.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
