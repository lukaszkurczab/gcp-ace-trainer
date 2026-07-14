import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const amortizedComplexityAndMistakeReviewQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-complexity-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_stack_operation_complexity",
    "secondarySkillAtomIds": [
      "stack_push_pop_top",
      "constant_time_stack_operations"
    ],
    "type": "single_choice",
    "prompt": "A stack uses a dynamic array and operates only at its end. Which cost statement is precise under the standard dynamic-array model?",
    "feedbackModel": {
      "decisionSignal": "top and ordinary pop inspect the end directly; a push may trigger an occasional resize.",
      "mentalModelCorrection": "Expected and amortized are different claims. The occasional O(n) resize makes push amortized O(1), while top and ordinary pop remain O(1) worst-case operations.",
      "mistakeTypes": [
        "operation_complexity_mismatch"
      ],
      "nextAction": "Analyze where the data structure performs each operation rather than using its total size as the operation cost.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "push_amortized_pop_top_worst_case",
        "text": "top and ordinary pop are O(1) worst-case; push is O(1) amortized because a resize can cost O(n).",
        "isCorrect": true
      },
      {
        "id": "logarithmic",
        "text": "Each operation is O(log n) because the stack remains ordered.",
        "isCorrect": false
      },
      {
        "id": "linear",
        "text": "Each operation is O(n) because the stack may contain n elements.",
        "isCorrect": false
      },
      {
        "id": "push_linear_others_constant",
        "text": "Every push is O(n), while pop and top are O(1).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-complexity-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_plain_stack_scan_complexity",
    "secondarySkillAtomIds": [
      "single_pass_stack_processing",
      "linear_scan_complexity"
    ],
    "type": "single_choice",
    "prompt": "An algorithm scans n tokens once. For each token, it performs a constant number of stack push, pop, or top operations. What is its time complexity?",
    "feedbackModel": {
      "decisionSignal": "There are n processed tokens and only constant work is performed for each token.",
      "mentalModelCorrection": "O(1) per iteration repeated n times gives O(n) total work.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Multiply the number of processed items by the bounded work performed for each item.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "linear",
        "text": "O(n).",
        "isCorrect": true
      },
      {
        "id": "quadratic",
        "text": "O(n²), because the stack can contain n tokens.",
        "isCorrect": false
      },
      {
        "id": "logarithmic",
        "text": "O(log n), because stack operations inspect only the top.",
        "isCorrect": false
      },
      {
        "id": "constant",
        "text": "O(1), because every individual stack operation is constant time.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-complexity-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_monotonic_stack_amortized_complexity",
    "secondarySkillAtomIds": [
      "bounded_total_pops",
      "push_once_pop_once"
    ],
    "type": "single_choice",
    "prompt": "A monotonic-stack algorithm scans n values. Each value is pushed once and, after being popped, is never inserted again. What is the total number of pushes and pops?",
    "feedbackModel": {
      "decisionSignal": "Each input item has a bounded lifetime: one insertion and at most one removal.",
      "mentalModelCorrection": "The inner pop loop may remove many items during one iteration, but those same items cannot be removed again later.",
      "mistakeTypes": [
        "amortized_complexity_mismatch"
      ],
      "nextAction": "Count how many times each element can participate in an expensive operation across the complete execution.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "linear_total",
        "text": "At most n pushes and n pops, so O(n) total stack modifications.",
        "isCorrect": true
      },
      {
        "id": "quadratic_total",
        "text": "Up to n pushes and n pops for every input value, so O(n²).",
        "isCorrect": false
      },
      {
        "id": "logarithmic_total",
        "text": "O(log n), because the stack is monotonic.",
        "isCorrect": false
      },
      {
        "id": "constant_total",
        "text": "O(1), because only the top element is accessed.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-complexity-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_nested_loop_quadratic_assumption",
    "secondarySkillAtomIds": [
      "amortized_loop_analysis",
      "bounded_element_lifetime"
    ],
    "type": "single_choice",
    "prompt": "A monotonic-stack implementation contains a while loop inside a for loop. The while loop pops stack elements while the current value violates the monotonic order. Why is the algorithm not automatically O(n²)?",
    "feedbackModel": {
      "decisionSignal": "The inner-loop iterations consume elements whose removal cannot be repeated.",
      "mentalModelCorrection": "Visual nesting does not determine complexity. Total work depends on how often operations can occur over the full run.",
      "mistakeTypes": [
        "nested_loop_complexity_misread"
      ],
      "nextAction": "Aggregate the total number of pops instead of multiplying the apparent loop bounds.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "popped_once",
        "text": "Every element removed by the inner loop is popped at most once across the entire execution.",
        "isCorrect": true
      },
      {
        "id": "while_constant",
        "text": "The while loop is guaranteed to execute exactly once per for-loop iteration.",
        "isCorrect": false
      },
      {
        "id": "nested_not_quadratic",
        "text": "Nested loops are never quadratic when one loop uses a stack.",
        "isCorrect": false
      },
      {
        "id": "monotonic_means_log",
        "text": "Maintaining monotonic order changes the inner loop to O(log n).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-complexity-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "require_bounded_total_pop_proof",
    "secondarySkillAtomIds": [
      "amortized_complexity_proof",
      "stack_reinsertion_analysis"
    ],
    "type": "solution_comparison",
    "prompt": "A reviewer claims that a stack-based algorithm is O(n) because it has one outer scan, but popped elements may later be pushed again many times. Which assessment is correct?",
    "feedbackModel": {
      "decisionSignal": "The usual monotonic-stack proof depends on each element having a bounded number of pushes and pops.",
      "mentalModelCorrection": "If elements can repeatedly re-enter the stack, the standard push-once-pop-once argument no longer applies.",
      "mistakeTypes": [
        "unsupported_complexity_claim"
      ],
      "nextAction": "Bound every category of stack operation, including reinsertion, before claiming amortized linear time.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "proof_missing",
        "text": "The O(n) claim is unproven because total stack operations may exceed a constant multiple of n.",
        "isCorrect": true
      },
      {
        "id": "outer_loop_enough",
        "text": "The algorithm is O(n) because the outer loop runs n times.",
        "isCorrect": false
      },
      {
        "id": "stack_guarantees_linear",
        "text": "Every algorithm using a stack is automatically linear.",
        "isCorrect": false
      },
      {
        "id": "reinsertions_do_not_count",
        "text": "Only the first push of each element contributes to complexity.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-complexity-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_monotonic_stack_space_complexity",
    "secondarySkillAtomIds": [
      "worst_case_stack_size",
      "auxiliary_space_analysis"
    ],
    "type": "single_choice",
    "prompt": "What is the worst-case auxiliary-space complexity of a monotonic stack processing n values?",
    "feedbackModel": {
      "decisionSignal": "An input already matching the maintained order may cause no elements to be popped during the scan.",
      "mentalModelCorrection": "Amortized O(n) time does not imply constant space. The stack may hold one entry for every input element.",
      "mistakeTypes": [
        "space_complexity_mismatch"
      ],
      "nextAction": "Construct the input ordering that maximizes the number of simultaneously retained stack entries.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "linear",
        "text": "O(n), because all values may remain on the stack at the same time.",
        "isCorrect": true
      },
      {
        "id": "constant",
        "text": "O(1), because only the top element is read.",
        "isCorrect": false
      },
      {
        "id": "logarithmic",
        "text": "O(log n), because monotonic order compresses the values.",
        "isCorrect": false
      },
      {
        "id": "quadratic",
        "text": "O(n²), because the algorithm may compare many pairs.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-complexity-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_logarithmic_monotonic_stack_claim",
    "secondarySkillAtomIds": [
      "monotonic_order_semantics",
      "stack_operation_complexity"
    ],
    "type": "single_choice",
    "prompt": "A developer says that push and pop on a monotonic stack are O(log n) because the stored values remain ordered. What is wrong with this claim?",
    "feedbackModel": {
      "decisionSignal": "No binary search, tree traversal, or ordered insertion position is used.",
      "mentalModelCorrection": "Monotonicity is preserved by popping from the top and pushing at the top, both constant-time operations.",
      "mistakeTypes": [
        "operation_complexity_mismatch"
      ],
      "nextAction": "Derive complexity from the actual primitive operations, not from the word ordered.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "top_only_operations",
        "text": "The stack modifies only its top; monotonic order is an invariant, not a balanced-search operation.",
        "isCorrect": true
      },
      {
        "id": "operations_are_linear",
        "text": "Push and pop must scan the full ordered stack, so each is O(n).",
        "isCorrect": false
      },
      {
        "id": "order_not_maintained",
        "text": "A monotonic stack does not maintain any order among its values.",
        "isCorrect": false
      },
      {
        "id": "log_only_for_numbers",
        "text": "O(log n) applies only when the stack stores strings rather than numbers.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-complexity-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_plain_and_monotonic_stack_complexity",
    "secondarySkillAtomIds": [
      "stack_scan_complexity",
      "amortized_monotonic_processing"
    ],
    "type": "solution_comparison",
    "prompt": "Solution A performs one scan and a constant number of ordinary stack operations per item. Solution B performs one scan and may pop many monotonic-stack entries during an iteration, but each entry is pushed once and popped at most once. Which comparison is correct?",
    "feedbackModel": {
      "decisionSignal": "The algorithms use different proofs but both perform only O(n) total primitive operations.",
      "mentalModelCorrection": "A direct constant-per-item analysis and an amortized push-once-pop-once analysis can lead to the same asymptotic result.",
      "mistakeTypes": [
        "complexity_comparison_mismatch"
      ],
      "nextAction": "Identify whether the linear bound is per iteration or amortized over element lifetimes.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "both_linear",
        "text": "Both are O(n) time; A uses a direct per-item bound, while B uses an amortized total-operation bound.",
        "isCorrect": true
      },
      {
        "id": "a_linear_b_quadratic",
        "text": "A is O(n), while B is O(n²) because it contains a nested while loop.",
        "isCorrect": false
      },
      {
        "id": "a_quadratic_b_linear",
        "text": "A is O(n²) because the stack can contain n items, while B is O(n).",
        "isCorrect": false
      },
      {
        "id": "both_logarithmic",
        "text": "Both are O(log n) because stack access occurs at one end.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-complexity-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_correctness_before_complexity",
    "secondarySkillAtomIds": [
      "monotonic_stack_invariant",
      "strategy_validation"
    ],
    "type": "solution_comparison",
    "prompt": "A proposed monotonic-stack solution runs in claimed O(n) time, but it pops an entry before that entry's required answer can be determined and does not preserve the missing information elsewhere. Which review is correct?",
    "feedbackModel": {
      "decisionSignal": "A pop permanently removes a candidate, so the invariant must prove that its answer is resolved or its information is no longer needed.",
      "mentalModelCorrection": "A valid amortized bound does not establish semantic correctness. Candidate elimination must be justified independently.",
      "mistakeTypes": [
        "correctness_before_complexity",
        "invalid_stack_invariant"
      ],
      "nextAction": "Verify why every popped entry can be discarded before evaluating the implementation's speed.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "fast_but_incorrect",
        "text": "The complexity claim is irrelevant until the pop invariant is corrected; the algorithm may discard unresolved candidates.",
        "isCorrect": true
      },
      {
        "id": "accept_linear",
        "text": "The solution should be accepted because O(n) is optimal.",
        "isCorrect": false
      },
      {
        "id": "space_fixes_correctness",
        "text": "The solution becomes correct as long as the stack uses O(n) space.",
        "isCorrect": false
      },
      {
        "id": "monotonicity_proves_correctness",
        "text": "Maintaining monotonic order automatically proves every pop is safe.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-complexity-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "justify_monotonic_stack_complexity",
    "secondarySkillAtomIds": [
      "amortized_analysis",
      "worst_case_space"
    ],
    "type": "solution_comparison",
    "prompt": "Which explanation gives the most complete complexity analysis for a correct monotonic-stack scan over n items?",
    "feedbackModel": {
      "decisionSignal": "A complete review separately bounds total operations and maximum simultaneously stored state.",
      "mentalModelCorrection": "Amortized time and worst-case space answer different questions. Both must be justified from element lifetimes and stack occupancy.",
      "mistakeTypes": [
        "weak_complexity_justification"
      ],
      "nextAction": "State the push bound, pop bound, total time, and maximum stack size explicitly.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "complete_analysis",
        "text": "Each item is pushed once and popped at most once, so total processing is O(n); the stack may retain all n items in the worst case, so auxiliary space is O(n).",
        "isCorrect": true
      },
      {
        "id": "nested_quadratic",
        "text": "The nested while loop makes time O(n²), and the stack uses O(1) space because only its top is inspected.",
        "isCorrect": false
      },
      {
        "id": "ordered_logarithmic",
        "text": "Monotonic ordering makes every operation O(log n), giving O(n log n) time and O(log n) space.",
        "isCorrect": false
      },
      {
        "id": "outer_loop_only",
        "text": "The algorithm is O(n) only because the outer loop runs n times; the number of pops and stack size do not need analysis.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
