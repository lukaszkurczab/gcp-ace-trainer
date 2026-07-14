import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const monotonicInvariantDirectionQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-invariant-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "define_monotonic_stack_direction",
    "secondarySkillAtomIds": [
      "bottom_to_top_order",
      "explicit_stack_invariant"
    ],
    "type": "single_choice",
    "prompt": "A stack is described as monotonically increasing from bottom to top. Which sequence of stored values satisfies that invariant?",
    "feedbackModel": {
      "decisionSignal": "The direction is defined explicitly from the bottom entry toward the top entry.",
      "mentalModelCorrection": "An increasing stack requires each higher entry to satisfy the declared increasing relation with the entry below it.",
      "mistakeTypes": [
        "monotonic_direction_mismatch"
      ],
      "nextAction": "Always state both the comparison relation and whether it is read bottom-to-top or top-to-bottom.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "one_three_seven",
        "text": "[1, 3, 7], where 1 is at the bottom and 7 is at the top.",
        "isCorrect": true
      },
      {
        "id": "seven_three_one",
        "text": "[7, 3, 1], where 7 is at the bottom and 1 is at the top.",
        "isCorrect": false
      },
      {
        "id": "three_one_seven",
        "text": "[3, 1, 7], where 3 is at the bottom and 7 is at the top.",
        "isCorrect": false
      },
      {
        "id": "any_order",
        "text": "Any sequence, because increasing refers to the input rather than the stack.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-invariant-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_input_and_stack_monotonicity",
    "secondarySkillAtomIds": [
      "stack_invariant",
      "input_order_reasoning"
    ],
    "type": "single_choice",
    "prompt": "The input is [5, 1, 4, 2]. A developer says a monotonic stack cannot be used because the input itself is not monotonic. What is wrong with that reasoning?",
    "feedbackModel": {
      "decisionSignal": "The algorithm selectively removes candidates so that the retained unresolved entries satisfy an order.",
      "mentalModelCorrection": "Monotonic stack describes the state of the auxiliary stack, not a required property of the input sequence.",
      "mistakeTypes": [
        "input_stack_invariant_confusion"
      ],
      "nextAction": "Describe which stored candidates remain after each input value is processed.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "stack_not_input",
        "text": "The maintained stack must satisfy the monotonic invariant; the original input does not need to be monotonic.",
        "isCorrect": true
      },
      {
        "id": "input_is_increasing",
        "text": "The input is actually increasing when read from right to left.",
        "isCorrect": false
      },
      {
        "id": "stack_sorts_input",
        "text": "A monotonic stack permanently sorts the original input.",
        "isCorrect": false
      },
      {
        "id": "monotonicity_optional",
        "text": "Neither the stack nor the input needs any ordering invariant.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-invariant-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "restore_increasing_stack_invariant",
    "secondarySkillAtomIds": [
      "monotonic_pop_condition",
      "full_invariant_restoration"
    ],
    "type": "single_choice",
    "prompt": "A stack must remain strictly increasing from bottom to top. Its values are [2, 5, 8], and the current value is 4. What should happen before 4 is pushed?",
    "feedbackModel": {
      "decisionSignal": "Every value above the insertion point must satisfy the strict increasing relation after the push.",
      "mentalModelCorrection": "Checking or removing only the first conflicting top is insufficient when the next exposed entry also violates the invariant.",
      "mistakeTypes": [
        "incomplete_invariant_restoration"
      ],
      "nextAction": "Continue popping while the exposed top conflicts with the value being inserted.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "pop_eight_five",
        "text": "Pop 8 and 5, then push 4, leaving [2, 4].",
        "isCorrect": true
      },
      {
        "id": "pop_eight_only",
        "text": "Pop only 8, then push 4, leaving [2, 5, 4].",
        "isCorrect": false
      },
      {
        "id": "push_immediately",
        "text": "Push 4 without popping, leaving [2, 5, 8, 4].",
        "isCorrect": false
      },
      {
        "id": "clear_stack",
        "text": "Clear the entire stack and push only 4.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-invariant-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "restore_decreasing_stack_invariant",
    "secondarySkillAtomIds": [
      "monotonic_pop_condition",
      "stack_direction_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A stack must remain strictly decreasing from bottom to top. Its values are [9, 6, 3], and the current value is 7. Which entries must be removed before pushing 7?",
    "feedbackModel": {
      "decisionSignal": "In a decreasing bottom-to-top stack, every lower entry must be greater than the entry above it.",
      "mentalModelCorrection": "After removing 3, the exposed 6 still conflicts with pushing 7 above it. Restoration must continue until the full order is valid.",
      "mistakeTypes": [
        "reversed_monotonic_inequality"
      ],
      "nextAction": "Simulate the stack after the proposed push, not only the first comparison.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "pop_three_six",
        "text": "Pop 3 and 6, then push 7, leaving [9, 7].",
        "isCorrect": true
      },
      {
        "id": "pop_three_only",
        "text": "Pop only 3, then push 7, leaving [9, 6, 7].",
        "isCorrect": false
      },
      {
        "id": "pop_nine",
        "text": "Pop 9 because it is greater than 7.",
        "isCorrect": false
      },
      {
        "id": "pop_none",
        "text": "Push 7 directly because the current top is smaller.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-invariant-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "connect_next_greater_to_stack_order",
    "secondarySkillAtomIds": [
      "next_greater_candidate_state",
      "decreasing_stack_invariant"
    ],
    "type": "single_choice",
    "prompt": "During a left-to-right strict next-greater scan, unresolved values are kept non-increasing from bottom to top. Why may a larger current value pop smaller values from the top?",
    "feedbackModel": {
      "decisionSignal": "The stack contains unresolved candidates, and the current value satisfies their requested greater-than relation.",
      "mentalModelCorrection": "Equal unresolved values may remain for a strict relation. The maintained non-increasing order exposes candidates that the current resolver can settle; it does not sort the input.",
      "mistakeTypes": [
        "weak_invariant_justification"
      ],
      "nextAction": "Explain what each retained entry is waiting for and what event makes it removable.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "current_resolves_smaller",
        "text": "The current value is the first processed value to the right that qualifies as greater for those top entries.",
        "isCorrect": true
      },
      {
        "id": "smaller_values_are_duplicates",
        "text": "Every smaller value is a duplicate of the current value.",
        "isCorrect": false
      },
      {
        "id": "stack_must_store_largest",
        "text": "The stack is allowed to retain only the global maximum.",
        "isCorrect": false
      },
      {
        "id": "popping_sorts_input",
        "text": "Popping places the original input into ascending order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-invariant-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "connect_next_smaller_to_stack_order",
    "secondarySkillAtomIds": [
      "next_smaller_candidate_state",
      "increasing_stack_invariant"
    ],
    "type": "single_choice",
    "prompt": "For a left-to-right strict next-smaller scan that preserves equal unresolved values, which stack order naturally exposes entries a smaller current value can resolve?",
    "feedbackModel": {
      "decisionSignal": "Larger unresolved candidates are exposed at the top, so a smaller current value can resolve them consecutively.",
      "mentalModelCorrection": "For a strict next-smaller query, equal values may remain. A non-decreasing bottom-to-top stack exposes larger unresolved candidates at the top for consecutive resolution.",
      "mistakeTypes": [
        "stack_direction_mismatch"
      ],
      "nextAction": "Derive the order from which unresolved values the current greater or smaller value should eliminate.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "increasing_bottom_to_top",
        "text": "Values non-decreasing from bottom to top.",
        "isCorrect": true
      },
      {
        "id": "decreasing_bottom_to_top",
        "text": "Values decreasing from bottom to top.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_order",
        "text": "Any order, because only the current value matters.",
        "isCorrect": false
      },
      {
        "id": "input_order",
        "text": "The exact order in which all values appeared, without any popping.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-invariant-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_dominated_stack_candidate",
    "secondarySkillAtomIds": [
      "candidate_dominance",
      "safe_stack_pop"
    ],
    "type": "solution_comparison",
    "prompt": "For nearest previous smaller queries, an older value 8 at index 2 is below a newer value 5 at index 6. Future positions are to the right, and both values are smaller than a future current value 10. Can the older 8 ever be the nearest qualifying answer while 5 remains?",
    "feedbackModel": {
      "decisionSignal": "The retained candidate offers no future answer that the newer candidate cannot provide at least as well.",
      "mentalModelCorrection": "Monotonic stacks remove candidates whose continued presence cannot improve any future result under the contract.",
      "mistakeTypes": [
        "dominated_candidate_retained"
      ],
      "nextAction": "Ask whether the older entry can still win any future comparison or positional tie.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "older_candidate_dominated",
        "text": "No. The newer 5 is closer and also qualifies, so 8 cannot win while 5 remains available.",
        "isCorrect": true
      },
      {
        "id": "newer_candidate_invalid",
        "text": "Yes. The older 8 is numerically larger, so it is always the stronger boundary.",
        "isCorrect": false
      },
      {
        "id": "all_candidates_required",
        "text": "Yes. Nearest previous queries must retain every processed candidate until the scan ends.",
        "isCorrect": false
      },
      {
        "id": "distance_irrelevant",
        "text": "No. Candidate position is irrelevant once both values are smaller than the current value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-invariant-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "require_explicit_monotonic_direction",
    "secondarySkillAtomIds": [
      "invariant_precision",
      "stack_order_orientation"
    ],
    "type": "solution_comparison",
    "prompt": "A code review says only, 'This uses an increasing stack.' Why is that description incomplete?",
    "feedbackModel": {
      "decisionSignal": "The label increasing is ambiguous without orientation and comparison strictness.",
      "mentalModelCorrection": "A usable invariant must make it possible to determine whether a concrete stack state is valid.",
      "mistakeTypes": [
        "ambiguous_invariant_description"
      ],
      "nextAction": "State the exact adjacent-entry relation from bottom to top.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "direction_and_strictness_missing",
        "text": "It does not state whether values increase bottom-to-top or top-to-bottom, or whether equality is allowed.",
        "isCorrect": true
      },
      {
        "id": "input_length_missing",
        "text": "It does not state the exact number of input values.",
        "isCorrect": false
      },
      {
        "id": "stack_api_missing",
        "text": "It does not name the programming-language methods used for push and pop.",
        "isCorrect": false
      },
      {
        "id": "complexity_missing",
        "text": "Any invariant description must contain only a Big-O bound.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-invariant-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_single_top_check",
    "secondarySkillAtomIds": [
      "while_pop_restoration",
      "full_stack_invariant"
    ],
    "type": "single_choice",
    "prompt": "A solution uses an if statement to pop at most one conflicting stack top before pushing the current value. When is this insufficient?",
    "feedbackModel": {
      "decisionSignal": "Removing one entry may expose another entry that violates the same required relation.",
      "mentalModelCorrection": "Invariant restoration is condition-based, not limited to one mutation per input item.",
      "mistakeTypes": [
        "incomplete_invariant_restoration"
      ],
      "nextAction": "Use repeated checking until the exposed top is compatible or the stack is empty.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "multiple_conflicts",
        "text": "When several consecutive top entries conflict with the current value and all must be removed to restore the invariant.",
        "isCorrect": true
      },
      {
        "id": "stack_empty",
        "text": "Only when the stack is empty.",
        "isCorrect": false
      },
      {
        "id": "current_is_first",
        "text": "Only for the first input element.",
        "isCorrect": false
      },
      {
        "id": "values_are_distinct",
        "text": "Only when every input value is distinct.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-invariant-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_monotonic_stack_restoration",
    "secondarySkillAtomIds": [
      "increasing_stack_trace",
      "candidate_removal"
    ],
    "type": "single_choice",
    "prompt": "A strictly increasing bottom-to-top stack contains [1, 4, 6, 9]. The current value is 5. What stack remains after restoring the invariant and pushing 5?",
    "feedbackModel": {
      "decisionSignal": "Values 9 and 6 conflict with placing 5 above them, while 4 remains compatible.",
      "mentalModelCorrection": "Pop exactly the suffix that violates the relation. Entries below the first compatible top remain useful.",
      "mistakeTypes": [
        "monotonic_trace_error"
      ],
      "nextAction": "Evaluate the exposed top again after every pop.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "one_four_five",
        "text": "[1, 4, 5]",
        "isCorrect": true
      },
      {
        "id": "one_four_six_five",
        "text": "[1, 4, 6, 5]",
        "isCorrect": false
      },
      {
        "id": "one_five",
        "text": "[1, 5]",
        "isCorrect": false
      },
      {
        "id": "five_only",
        "text": "[5]",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-invariant-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "select_pop_condition_from_invariant",
    "secondarySkillAtomIds": [
      "strictly_increasing_stack",
      "comparison_direction"
    ],
    "type": "single_choice",
    "prompt": "A stack must be strictly increasing from bottom to top. Which generic condition should remove the current top before pushing currentValue?",
    "feedbackModel": {
      "decisionSignal": "After the push, the previous top must be strictly smaller than the new top.",
      "mentalModelCorrection": "Any top that is greater than or equal to the incoming value would violate strict increasing order.",
      "mistakeTypes": [
        "pop_condition_mismatch"
      ],
      "nextAction": "Derive the pop condition by negating the relation that must hold after insertion.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "top_greater_or_equal_current",
        "text": "Pop while stackTopValue >= currentValue.",
        "isCorrect": true
      },
      {
        "id": "top_less_current",
        "text": "Pop while stackTopValue < currentValue.",
        "isCorrect": false
      },
      {
        "id": "top_not_equal_current",
        "text": "Pop while stackTopValue != currentValue.",
        "isCorrect": false
      },
      {
        "id": "current_index_greater",
        "text": "Pop while currentIndex > stackTopIndex.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-invariant-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "select_decreasing_stack_pop_condition",
    "secondarySkillAtomIds": [
      "strictly_decreasing_stack",
      "comparison_direction"
    ],
    "type": "single_choice",
    "prompt": "A stack must be strictly decreasing from bottom to top. Which condition restores the invariant before pushing currentValue?",
    "feedbackModel": {
      "decisionSignal": "The previous top must remain strictly greater than the newly pushed value.",
      "mentalModelCorrection": "A top smaller than or equal to currentValue cannot remain directly below it in a strictly decreasing stack.",
      "mistakeTypes": [
        "reversed_monotonic_inequality"
      ],
      "nextAction": "Write the required post-push relation, then remove every top that violates it.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "top_less_or_equal_current",
        "text": "Pop while stackTopValue <= currentValue.",
        "isCorrect": true
      },
      {
        "id": "top_greater_current",
        "text": "Pop while stackTopValue > currentValue.",
        "isCorrect": false
      },
      {
        "id": "top_equal_current_only",
        "text": "Pop only while stackTopValue === currentValue.",
        "isCorrect": false
      },
      {
        "id": "current_index_smaller",
        "text": "Pop while currentIndex < stackTopIndex.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-invariant-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_candidate_usefulness_invariant",
    "secondarySkillAtomIds": [
      "unresolved_candidate_state",
      "safe_candidate_elimination"
    ],
    "type": "solution_comparison",
    "prompt": "Which description best captures what entries remaining in an introductory monotonic stack should represent?",
    "feedbackModel": {
      "decisionSignal": "Stack membership has semantic meaning beyond satisfying a numeric order.",
      "mentalModelCorrection": "The monotonic invariant compresses the processed prefix into candidates that may still matter.",
      "mistakeTypes": [
        "stack_state_semantics_mismatch"
      ],
      "nextAction": "Define both the ordering invariant and the unresolved-candidate meaning of each stored entry.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "useful_unresolved_candidates",
        "text": "Processed candidates that remain unresolved and have not been proven dominated or irrelevant for future inputs.",
        "isCorrect": true
      },
      {
        "id": "all_processed_values",
        "text": "Every processed value, regardless of whether it can still affect an answer.",
        "isCorrect": false
      },
      {
        "id": "sorted_copy",
        "text": "A complete sorted copy of the processed input.",
        "isCorrect": false
      },
      {
        "id": "resolved_answers",
        "text": "Only entries whose final answers are already known.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-invariant-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "justify_monotonic_stack_invariant",
    "secondarySkillAtomIds": [
      "explicit_stack_invariant",
      "candidate_dominance_reasoning"
    ],
    "type": "solution_comparison",
    "prompt": "Which explanation gives the strongest definition of a monotonic-stack invariant?",
    "feedbackModel": {
      "decisionSignal": "A complete invariant defines order, orientation, strictness, entry meaning, and restoration behavior.",
      "mentalModelCorrection": "A label such as increasing stack is not sufficient to prove concrete state transitions or candidate elimination.",
      "mistakeTypes": [
        "weak_invariant_justification"
      ],
      "nextAction": "State the exact order and explain why every retained and removed candidate is treated correctly.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "complete_invariant",
        "text": "From bottom to top, retained values satisfy the declared strict or non-strict order; every entry is an unresolved candidate, and conflicting or dominated top entries are removed before the current entry is pushed.",
        "isCorrect": true
      },
      {
        "id": "increasing_label",
        "text": "The algorithm uses an increasing stack.",
        "isCorrect": false
      },
      {
        "id": "sorted_input",
        "text": "The input becomes monotonic after the algorithm scans it.",
        "isCorrect": false
      },
      {
        "id": "top_check_only",
        "text": "The current value is compared with the top once, and the rest of the stack does not need an invariant.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
