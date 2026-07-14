import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const nextGreaterSmallerResolutionQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-resolution-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_unresolved_stack_candidates",
    "secondarySkillAtomIds": [
      "forward_monotonic_stack_scan",
      "next_element_resolution"
    ],
    "type": "single_choice",
    "prompt": "During a forward next-greater scan, what do indexes remaining on the stack represent?",
    "feedbackModel": {
      "decisionSignal": "Each retained position is waiting for a future value that satisfies its comparison contract.",
      "mentalModelCorrection": "The stack is not a collection of completed answers. It stores unresolved candidates from the processed prefix.",
      "mistakeTypes": [
        "stack_state_semantics_mismatch"
      ],
      "nextAction": "Describe what event would allow each stored position to leave the stack.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "unresolved_earlier_indexes",
        "text": "Earlier positions whose next qualifying greater value has not appeared yet.",
        "isCorrect": true
      },
      {
        "id": "resolved_indexes",
        "text": "Positions whose final answers have already been assigned.",
        "isCorrect": false
      },
      {
        "id": "largest_values_only",
        "text": "Only positions containing the largest values in the entire array.",
        "isCorrect": false
      },
      {
        "id": "future_indexes",
        "text": "Positions that have not yet been visited by the scan.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-resolution-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "resolve_next_greater_candidate",
    "secondarySkillAtomIds": [
      "current_value_as_resolver",
      "strict_greater_comparison"
    ],
    "type": "single_choice",
    "prompt": "The stack top represents an earlier value 4. The current value is 7, and the task asks for the next strictly greater value. What does 7 do?",
    "feedbackModel": {
      "decisionSignal": "The current value satisfies the earlier candidate's comparison and is the first such value reached by the forward scan.",
      "mentalModelCorrection": "The contract asks for the next qualifying value, not the greatest value anywhere later.",
      "mistakeTypes": [
        "nearest_qualifying_value_mismatch"
      ],
      "nextAction": "Resolve a candidate as soon as the first future value satisfies its relation.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "resolves_four",
        "text": "It resolves the earlier 4 because it is the first qualifying value encountered to its right.",
        "isCorrect": true
      },
      {
        "id": "waits_for_larger",
        "text": "It does not resolve 4 because a value larger than 7 may appear later.",
        "isCorrect": false
      },
      {
        "id": "answers_current",
        "text": "It assigns 4 as the answer for the current value 7.",
        "isCorrect": false
      },
      {
        "id": "clears_stack",
        "text": "It resolves every stack entry regardless of the stored values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-resolution-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "assign_answer_to_popped_candidate",
    "secondarySkillAtomIds": [
      "resolver_and_resolved_roles",
      "per_index_answer_assignment"
    ],
    "type": "single_choice",
    "prompt": "The current value resolves the index at the top of the stack. Which output position should receive the newly discovered answer?",
    "feedbackModel": {
      "decisionSignal": "The earlier stack entry was waiting for an answer; the current element merely reveals it.",
      "mentalModelCorrection": "The resolver and the resolved candidate play different roles. The answer belongs to the popped position.",
      "mistakeTypes": [
        "answer_assignment_index_mismatch"
      ],
      "nextAction": "Name the waiting candidate and the resolving element separately during each pop.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "popped_index",
        "text": "The popped earlier index.",
        "isCorrect": true
      },
      {
        "id": "current_index",
        "text": "The current index.",
        "isCorrect": false
      },
      {
        "id": "stack_length",
        "text": "The position equal to the new stack length.",
        "isCorrect": false
      },
      {
        "id": "previous_current",
        "text": "The index immediately before the current index.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-resolution-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "repeat_resolution_while_qualified",
    "secondarySkillAtomIds": [
      "multiple_candidate_resolution",
      "while_not_if_pop"
    ],
    "type": "single_choice",
    "prompt": "The current value is greater than several unresolved values consecutively exposed at the stack top. What should the algorithm do?",
    "feedbackModel": {
      "decisionSignal": "One incoming value may be the first qualifying future value for multiple earlier candidates.",
      "mentalModelCorrection": "A single conditional pop can miss other candidates that the same current element also resolves.",
      "mistakeTypes": [
        "insufficient_stack_pop"
      ],
      "nextAction": "Recheck the newly exposed top after every resolution.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "pop_while_qualified",
        "text": "Keep popping and assigning answers while the current value qualifies for the exposed top.",
        "isCorrect": true
      },
      {
        "id": "pop_once",
        "text": "Pop exactly one entry and leave all other qualifying entries unresolved.",
        "isCorrect": false
      },
      {
        "id": "push_before_pop",
        "text": "Push the current index first and stop checking earlier entries.",
        "isCorrect": false
      },
      {
        "id": "resolve_bottom_only",
        "text": "Assign an answer only to the oldest entry at the bottom of the stack.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-resolution-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "select_next_smaller_resolution_condition",
    "secondarySkillAtomIds": [
      "next_smaller_comparison",
      "comparison_direction"
    ],
    "type": "single_choice",
    "prompt": "For a next strictly smaller scan, when should the current value resolve the stack-top candidate?",
    "feedbackModel": {
      "decisionSignal": "The current element must satisfy the exact relation requested by the unresolved earlier candidate.",
      "mentalModelCorrection": "Forward scan direction does not determine greater versus smaller. The output contract determines the comparison.",
      "mistakeTypes": [
        "comparison_direction_mismatch"
      ],
      "nextAction": "Read the condition from the perspective of the unresolved stack entry.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "current_smaller_than_top",
        "text": "When currentValue < values[stackTopIndex].",
        "isCorrect": true
      },
      {
        "id": "current_greater_than_top",
        "text": "When currentValue > values[stackTopIndex].",
        "isCorrect": false
      },
      {
        "id": "current_index_greater",
        "text": "Whenever currentIndex > stackTopIndex.",
        "isCorrect": false
      },
      {
        "id": "current_is_global_minimum",
        "text": "Only when the current value is the smallest value in the whole array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-resolution-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "order_next_element_resolution_steps",
    "secondarySkillAtomIds": [
      "monotonic_stack_iteration_order",
      "push_after_resolution"
    ],
    "type": "subgoal_ordering",
    "prompt": "Order the main steps for processing currentIndex during a forward next-greater scan.",
    "subgoals": [
      {
        "id": "resolve_prior",
        "text": "While the current value qualifies for the stack top, pop that earlier index and assign its answer."
      },
      {
        "id": "push_current",
        "text": "Push currentIndex as a new unresolved candidate."
      },
      {
        "id": "read_current",
        "text": "Read the current value and compare it with the value represented by the stack top."
      }
    ],
    "correctOrder": [
      "read_current",
      "resolve_prior",
      "push_current"
    ],
    "feedbackModel": {
      "decisionSignal": "The current element first acts as a possible resolver and only afterward becomes unresolved itself.",
      "mentalModelCorrection": "Pushing currentIndex too early can make the algorithm compare the current element with itself or block access to earlier candidates.",
      "mistakeTypes": [
        "implementation_order_mismatch"
      ],
      "nextAction": "Separate the current element's resolver role from its later unresolved-candidate role.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-resolution-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_multiple_next_greater_resolutions",
    "secondarySkillAtomIds": [
      "next_greater_trace",
      "multiple_stack_pops"
    ],
    "type": "single_choice",
    "prompt": "The unresolved stack contains indexes whose values, from bottom to top, are [8, 5, 3]. The current value is 6. For a next strictly greater task, which entries are resolved now?",
    "feedbackModel": {
      "decisionSignal": "Six qualifies for each exposed value smaller than six, but not for eight.",
      "mentalModelCorrection": "The pop loop continues across all qualifying top entries and stops at the first unresolved value the current element cannot resolve.",
      "mistakeTypes": [
        "stack_resolution_trace_error"
      ],
      "nextAction": "After each pop, compare the current value with the newly exposed top.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "three_and_five",
        "text": "The entries with values 3 and 5 are resolved; the entry with value 8 remains.",
        "isCorrect": true
      },
      {
        "id": "three_only",
        "text": "Only the entry with value 3 is resolved.",
        "isCorrect": false
      },
      {
        "id": "all_three",
        "text": "All entries are resolved because 6 is the newest value.",
        "isCorrect": false
      },
      {
        "id": "eight_only",
        "text": "Only the entry with value 8 is resolved.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-resolution-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_multiple_next_smaller_resolutions",
    "secondarySkillAtomIds": [
      "next_smaller_trace",
      "multiple_stack_pops"
    ],
    "type": "single_choice",
    "prompt": "The unresolved stack contains values [2, 5, 9] from bottom to top. The current value is 4. For a next strictly smaller task, which values are resolved?",
    "feedbackModel": {
      "decisionSignal": "Four is smaller than nine and five, but it is not smaller than two.",
      "mentalModelCorrection": "The same resolution mechanism supports next-smaller tasks when the comparison direction is reversed correctly.",
      "mistakeTypes": [
        "comparison_direction_mismatch",
        "stack_resolution_trace_error"
      ],
      "nextAction": "Apply the requested relation independently to each newly exposed top.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "nine_and_five",
        "text": "The entries with values 9 and 5 are resolved; the entry with value 2 remains.",
        "isCorrect": true
      },
      {
        "id": "nine_only",
        "text": "Only the entry with value 9 is resolved.",
        "isCorrect": false
      },
      {
        "id": "all_values",
        "text": "All three entries are resolved.",
        "isCorrect": false
      },
      {
        "id": "two_only",
        "text": "Only the entry with value 2 is resolved.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-resolution-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_unresolved_candidate",
    "secondarySkillAtomIds": [
      "candidate_retention",
      "future_resolver_reasoning"
    ],
    "type": "single_choice",
    "prompt": "In a next-greater scan, the current value is smaller than the stack-top value. What should normally happen to that top entry?",
    "feedbackModel": {
      "decisionSignal": "No qualifying future element has yet been observed for the stored candidate.",
      "mentalModelCorrection": "A candidate must not be discarded merely because the current element fails to resolve it. It may still be answered later.",
      "mistakeTypes": [
        "premature_candidate_discard"
      ],
      "nextAction": "Pop only when the current element satisfies the candidate's output contract or dominance proof.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "remain_unresolved",
        "text": "It remains on the stack because the current value does not satisfy its greater-than requirement.",
        "isCorrect": true
      },
      {
        "id": "pop_without_answer",
        "text": "It should be discarded even though no valid resolver has appeared.",
        "isCorrect": false
      },
      {
        "id": "assign_current",
        "text": "The current smaller value should be assigned as its answer.",
        "isCorrect": false
      },
      {
        "id": "move_to_output",
        "text": "It should be copied into the output using its own value as the answer.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-resolution-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "prefer_nearest_qualifying_element",
    "secondarySkillAtomIds": [
      "next_element_semantics",
      "nearest_future_occurrence"
    ],
    "type": "solution_comparison",
    "prompt": "For values [3, 5, 10], a solution returns 10 as the next greater value for 3 because it is the largest later value. What is wrong?",
    "feedbackModel": {
      "decisionSignal": "Next describes the nearest qualifying occurrence in scan order.",
      "mentalModelCorrection": "The task is not asking for the maximum value in the suffix. A later, larger value cannot replace an earlier valid resolver.",
      "mistakeTypes": [
        "nearest_qualifying_value_mismatch"
      ],
      "nextAction": "Stop searching for a candidate as soon as its first valid resolver is encountered.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "five_is_nearest",
        "text": "The answer should be 5 because it is the first later value greater than 3.",
        "isCorrect": true
      },
      {
        "id": "three_has_no_answer",
        "text": "The value 3 has no next greater value because two greater values exist.",
        "isCorrect": false
      },
      {
        "id": "ten_is_correct",
        "text": "The largest later value is always the required answer.",
        "isCorrect": false
      },
      {
        "id": "must_return_index_zero",
        "text": "The result must be the original index of 3.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-resolution-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "push_current_as_unresolved_candidate",
    "secondarySkillAtomIds": [
      "forward_scan_state",
      "current_candidate_lifecycle"
    ],
    "type": "single_choice",
    "prompt": "After the current value has resolved all qualifying earlier stack entries, why is currentIndex usually pushed?",
    "feedbackModel": {
      "decisionSignal": "Resolving earlier elements does not determine the current element's own future answer.",
      "mentalModelCorrection": "One element can act as a resolver now and still remain unresolved with respect to a later qualifying element.",
      "mistakeTypes": [
        "candidate_lifecycle_mismatch"
      ],
      "nextAction": "Track separately what the current value answers and what answer it still needs.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "waits_for_future_resolver",
        "text": "Its own next qualifying value may appear later, so it becomes a new unresolved candidate.",
        "isCorrect": true
      },
      {
        "id": "already_resolved",
        "text": "It has already received its final answer from the entries it popped.",
        "isCorrect": false
      },
      {
        "id": "keeps_stack_nonempty",
        "text": "A monotonic stack is invalid whenever it becomes empty.",
        "isCorrect": false
      },
      {
        "id": "records_global_extreme",
        "text": "Every current value must become the global maximum or minimum.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-resolution-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_single_pop_bug",
    "secondarySkillAtomIds": [
      "while_not_if_pop",
      "missed_candidate_resolution"
    ],
    "type": "solution_comparison",
    "prompt": "A next-greater scan uses `if (current > top) pop()` before pushing current. With unresolved values [8, 5, 3] from bottom to top and current value 6, which incorrect state remains after this code runs?",
    "feedbackModel": {
      "decisionSignal": "One incoming resolver can qualify for several consecutive top candidates.",
      "mentalModelCorrection": "The `if` pops 3, then pushes 6 above 5. But 6 is already the nearest next strictly greater resolver for 5, so leaving 5 on the stack is incorrect.",
      "mistakeTypes": [
        "insufficient_stack_pop"
      ],
      "nextAction": "Test stack code with an incoming value that crosses several retained candidates.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "incorrect_five_remains",
        "text": "[8, 5, 6], leaving 5 unresolved even though 6 is its next strictly greater resolver.",
        "isCorrect": true
      },
      {
        "id": "correct_eight_six",
        "text": "[8, 6], because 6 resolves both 3 and 5 before it is pushed.",
        "isCorrect": false
      },
      {
        "id": "incorrect_eight_five",
        "text": "[8, 5], because current 6 should not be stored after it resolves 3.",
        "isCorrect": false
      },
      {
        "id": "incorrect_six_only",
        "text": "[6], because a resolver must clear every earlier candidate from the stack.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-resolution-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_wrong_answer_target",
    "secondarySkillAtomIds": [
      "popped_candidate_assignment",
      "current_resolver_role"
    ],
    "type": "solution_comparison",
    "prompt": "Inside the pop loop, a solution writes answer[currentIndex] = values[poppedIndex]. What conceptual roles has it reversed?",
    "feedbackModel": {
      "decisionSignal": "The popped index is the unresolved position whose answer has just been discovered.",
      "mentalModelCorrection": "The current element resolves the older entry; the older entry does not become the current element's future answer.",
      "mistakeTypes": [
        "answer_assignment_index_mismatch"
      ],
      "nextAction": "For every assignment, state which index was waiting and which value ended that wait.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "resolver_and_candidate_reversed",
        "text": "It writes an earlier candidate's value as the current element's answer instead of assigning the current resolver to the popped candidate.",
        "isCorrect": true
      },
      {
        "id": "greater_and_smaller_reversed",
        "text": "It necessarily changes a next-greater task into a next-smaller task.",
        "isCorrect": false
      },
      {
        "id": "indexes_and_complexity_reversed",
        "text": "It changes the algorithm from O(n) to O(n²).",
        "isCorrect": false
      },
      {
        "id": "stack_bottom_and_top_reversed",
        "text": "It swaps the physical bottom and top of the stack.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-resolution-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "generalize_greater_and_smaller_resolution",
    "secondarySkillAtomIds": [
      "shared_monotonic_stack_mechanism",
      "comparison_contract_reasoning"
    ],
    "type": "solution_comparison",
    "prompt": "Which statement best unifies forward next-greater and next-smaller scans?",
    "feedbackModel": {
      "decisionSignal": "The candidate lifecycle and forward-resolution process are shared across both task families.",
      "mentalModelCorrection": "The pattern should be derived from the requested qualifier rather than memorized as disconnected greater and smaller code.",
      "mistakeTypes": [
        "template_memorization_without_contract"
      ],
      "nextAction": "Describe the common unresolved-candidate mechanism, then substitute the task-specific comparison.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "same_resolution_different_relation",
        "text": "Both retain unresolved earlier indexes, let the current value resolve every qualifying stack top, and differ mainly in the required comparison relation and maintained order.",
        "isCorrect": true
      },
      {
        "id": "unrelated_templates",
        "text": "They are unrelated algorithms that must be memorized as separate templates.",
        "isCorrect": false
      },
      {
        "id": "same_inequality",
        "text": "Both always pop when currentValue > stackTopValue.",
        "isCorrect": false
      },
      {
        "id": "same_stack_contents",
        "text": "Both must retain exactly the same entries after every input prefix.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-resolution-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_forward_resolution_lifecycle",
    "secondarySkillAtomIds": [
      "next_greater_trace",
      "unresolved_stack_state"
    ],
    "type": "single_choice",
    "prompt": "For values [4, 2, 6], a forward next-greater scan reaches 6 with indexes for 4 and 2 still unresolved. What is the correct resolution outcome?",
    "feedbackModel": {
      "decisionSignal": "Six is the first later value greater than both 2 and 4.",
      "mentalModelCorrection": "One current value can finish several earlier waits, then begin waiting for its own future resolver.",
      "mistakeTypes": [
        "candidate_lifecycle_mismatch",
        "insufficient_stack_pop"
      ],
      "nextAction": "Trace each element through the states unseen, unresolved, resolved, and possibly no-answer.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "six_resolves_both",
        "text": "Six resolves both earlier indexes, and then its own index is pushed as unresolved.",
        "isCorrect": true
      },
      {
        "id": "six_resolves_two_only",
        "text": "Six resolves only 2 because 4 appeared earlier in the stack.",
        "isCorrect": false
      },
      {
        "id": "six_gets_four",
        "text": "The current value 6 receives 4 as its next-greater answer.",
        "isCorrect": false
      },
      {
        "id": "discard_all",
        "text": "All stack entries, including 6, are discarded without assignments.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-resolution-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "justify_forward_next_element_resolution",
    "secondarySkillAtomIds": [
      "nearest_resolution_reasoning",
      "monotonic_stack_strategy_justification"
    ],
    "type": "solution_comparison",
    "prompt": "Which explanation best justifies the forward monotonic-stack process for next greater or next smaller queries?",
    "feedbackModel": {
      "decisionSignal": "A complete explanation identifies retained state, resolution condition, nearest semantics, answer target, repeated popping, and current-position lifecycle.",
      "mentalModelCorrection": "The algorithm is not selecting a global extreme. It incrementally completes waiting candidates at their first valid future occurrence.",
      "mistakeTypes": [
        "weak_resolution_strategy_justification"
      ],
      "nextAction": "Explain who is waiting, what resolves them, where the answer is stored, and why the current element is pushed afterward.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "complete_resolution_model",
        "text": "The stack stores unresolved earlier positions; each current value resolves all exposed candidates for which it is the first qualifying future value, answers are written to the popped positions, and the current position is then retained for possible later resolution.",
        "isCorrect": true
      },
      {
        "id": "largest_suffix_value",
        "text": "The stack stores the largest or smallest value seen anywhere in the remaining suffix.",
        "isCorrect": false
      },
      {
        "id": "one_pop_per_value",
        "text": "Every input value may resolve exactly one earlier candidate, so a single conditional pop is sufficient.",
        "isCorrect": false
      },
      {
        "id": "current_answer_first",
        "text": "Each iteration first assigns the current element's answer from the stack top and then discards all earlier candidates.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
