import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const indicesValuesAndDistanceContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-representation-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_monotonic_stack_entry",
    "secondarySkillAtomIds": [
      "distance_output_contract",
      "index_based_stack_state"
    ],
    "type": "single_choice",
    "prompt": "For each array position, you must return how many positions later the next strictly greater value appears. What should the monotonic stack store?",
    "feedbackModel": {
      "decisionSignal": "The output requires a positional distance between the resolving element and each unresolved occurrence.",
      "mentalModelCorrection": "An index preserves both the unresolved position and access to its value through the input array. A value alone cannot determine the distance.",
      "mistakeTypes": [
        "stack_entry_contract_mismatch"
      ],
      "nextAction": "Derive stack contents from the information required when an entry is eventually resolved.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "indexes",
        "text": "Indexes of unresolved elements.",
        "isCorrect": true
      },
      {
        "id": "values",
        "text": "Only unresolved values.",
        "isCorrect": false
      },
      {
        "id": "distances",
        "text": "Only the distances calculated so far.",
        "isCorrect": false
      },
      {
        "id": "global_maximum",
        "text": "Only the largest value seen so far.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-representation-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "compute_monotonic_stack_distance",
    "secondarySkillAtomIds": [
      "index_difference",
      "resolved_position_distance"
    ],
    "type": "single_choice",
    "prompt": "An unresolved element at index j is resolved by the current element at index i. The required answer is how many positions later the resolver appears. Which expression should be used?",
    "feedbackModel": {
      "decisionSignal": "The output is an index distance from the unresolved occurrence to its resolver.",
      "mentalModelCorrection": "i - j is the number of positions later. i - j - 1 instead counts positions strictly between the occurrences.",
      "mistakeTypes": [
        "value_index_confusion"
      ],
      "nextAction": "Identify whether the requested difference is between positions or stored values.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "positions_strictly_between",
        "text": "i - j - 1",
        "isCorrect": false
      },
      {
        "id": "value_difference",
        "text": "values[i] - values[j]",
        "isCorrect": false
      },
      {
        "id": "index_difference",
        "text": "i - j",
        "isCorrect": true
      },
      {
        "id": "stack_size",
        "text": "The current stack length.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-representation-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_values_through_stored_indexes",
    "secondarySkillAtomIds": [
      "index_stack_comparison",
      "monotonic_order_invariant"
    ],
    "type": "single_choice",
    "prompt": "A monotonic stack stores indexes. Which comparison correctly checks whether the current value is greater than the value represented by the stack top?",
    "feedbackModel": {
      "decisionSignal": "The stack entry is an index identifying an unresolved value in the input.",
      "mentalModelCorrection": "Indexes provide location and identity, but monotonic ordering is usually defined by the corresponding array values.",
      "mistakeTypes": [
        "index_value_comparison_mismatch"
      ],
      "nextAction": "State separately what the stack stores and which property determines its monotonic order.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "compare_array_values",
        "text": "values[currentIndex] > values[stack[stack.length - 1]]",
        "isCorrect": true
      },
      {
        "id": "compare_indexes",
        "text": "currentIndex > stack[stack.length - 1]",
        "isCorrect": false
      },
      {
        "id": "compare_stack_size",
        "text": "values[currentIndex] > stack.length",
        "isCorrect": false
      },
      {
        "id": "compare_distance",
        "text": "currentIndex - stack[stack.length - 1] > 0",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-stack-monotonic-representation-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_value_only_stack_state",
    "secondarySkillAtomIds": [
      "value_output_contract",
      "minimal_stack_state"
    ],
    "type": "single_choice",
    "prompt": "A left-to-right scan emits each next qualifying value immediately when it resolves an unresolved candidate. It never writes a per-index result, and values are unique. Which stack representation may be sufficient?",
    "feedbackModel": {
      "decisionSignal": "The resolver can emit the answer at resolution time, and no future operation needs a position or occurrence identity.",
      "mentalModelCorrection": "Outputting a value does not itself justify values-only state. Store only information that cannot be reconstructed and is required for comparison or resolution.",
      "mistakeTypes": [
        "unnecessary_stack_state"
      ],
      "nextAction": "Check whether any future operation needs position, identity, or access to other input metadata.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "values_only",
        "text": "The unresolved values themselves.",
        "isCorrect": true
      },
      {
        "id": "indexes_required",
        "text": "Indexes are always mandatory in every monotonic-stack problem.",
        "isCorrect": false
      },
      {
        "id": "full_objects",
        "text": "A full copy of the input and every intermediate answer.",
        "isCorrect": false
      },
      {
        "id": "distances_only",
        "text": "Distances without values or positions.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-representation-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_duplicate_occurrence_identity",
    "secondarySkillAtomIds": [
      "duplicate_index_identity",
      "per_position_output"
    ],
    "type": "single_choice",
    "prompt": "The input contains repeated values, and the function must produce one answer for every original index. Why can storing only values be insufficient?",
    "feedbackModel": {
      "decisionSignal": "The output is associated with occurrences, not merely with distinct numeric values.",
      "mentalModelCorrection": "Two equal values may appear at different positions and encounter different qualifying elements. Their indexes preserve separate identities.",
      "mistakeTypes": [
        "duplicate_identity_loss"
      ],
      "nextAction": "Ask whether equal-valued occurrences can require different output entries.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "duplicates_lose_identity",
        "text": "Equal values from different positions become indistinguishable even though their answers or distances may differ.",
        "isCorrect": true
      },
      {
        "id": "duplicates_break_order",
        "text": "A monotonic stack cannot contain equal values under any contract.",
        "isCorrect": false
      },
      {
        "id": "values_use_more_space",
        "text": "A numeric value always uses more memory than an index.",
        "isCorrect": false
      },
      {
        "id": "indexes_remove_duplicates",
        "text": "Storing indexes automatically deletes duplicate input values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-representation-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_value_index_pair_state",
    "secondarySkillAtomIds": [
      "streaming_stack_state",
      "value_and_position_retention"
    ],
    "type": "single_choice",
    "prompt": "Values arrive as a stream and earlier values are not retained in an accessible array. The output requires both comparison by value and distance from the unresolved occurrence. What should each stack entry contain?",
    "feedbackModel": {
      "decisionSignal": "The algorithm needs value information for comparisons and positional information for the eventual distance.",
      "mentalModelCorrection": "Indexes alone are sufficient only when the original value remains accessible through another structure. In a stream, the entry may need to retain both.",
      "mistakeTypes": [
        "insufficient_stack_state"
      ],
      "nextAction": "List every piece of information required at comparison time and resolution time.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "value_index_pair",
        "text": "Both the value and its arrival index.",
        "isCorrect": true
      },
      {
        "id": "index_only",
        "text": "Only the index, even though the earlier value cannot be retrieved elsewhere.",
        "isCorrect": false
      },
      {
        "id": "value_only",
        "text": "Only the value, even though distance is required.",
        "isCorrect": false
      },
      {
        "id": "current_total",
        "text": "Only the total number of values received.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-representation-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_output_position_from_stack_index",
    "secondarySkillAtomIds": [
      "per_index_answer_assignment",
      "resolved_stack_entry"
    ],
    "type": "single_choice",
    "prompt": "A stack stores unresolved indexes. When the current value resolves the top entry, where should the computed answer be written?",
    "feedbackModel": {
      "decisionSignal": "The popped entry represents the earlier occurrence whose answer has just become known.",
      "mentalModelCorrection": "The current element is the resolver, while the popped index identifies the output slot being resolved.",
      "mistakeTypes": [
        "answer_assignment_index_mismatch"
      ],
      "nextAction": "Distinguish the index producing the answer from the index receiving the answer.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "popped_index",
        "text": "At the output position identified by the popped index.",
        "isCorrect": true
      },
      {
        "id": "current_index",
        "text": "Always at the current index.",
        "isCorrect": false
      },
      {
        "id": "stack_length",
        "text": "At the position equal to the current stack size.",
        "isCorrect": false
      },
      {
        "id": "value_as_index",
        "text": "At the position equal to the popped element's numeric value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-representation-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_index_based_distance_resolution",
    "secondarySkillAtomIds": [
      "monotonic_stack_distance_trace",
      "duplicate_occurrence_identity"
    ],
    "type": "single_choice",
    "prompt": "The stack contains unresolved indexes [1, 3]. The current index is 5, and the current value resolves both entries. What distances should be assigned?",
    "feedbackModel": {
      "decisionSignal": "Each unresolved occurrence has its own original position.",
      "mentalModelCorrection": "One current value may resolve several entries, but each distance is calculated independently from its stored index.",
      "mistakeTypes": [
        "distance_assignment_mismatch"
      ],
      "nextAction": "Compute currentIndex - unresolvedIndex separately for every popped entry.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "four_and_two",
        "text": "Index 1 receives 4, and index 3 receives 2.",
        "isCorrect": true
      },
      {
        "id": "two_and_four",
        "text": "Index 1 receives 2, and index 3 receives 4.",
        "isCorrect": false
      },
      {
        "id": "five_for_both",
        "text": "Both receive 5 because the resolver is at index 5.",
        "isCorrect": false
      },
      {
        "id": "stack_positions",
        "text": "They receive 0 and 1 based on their positions inside the stack.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-stack-monotonic-representation-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_value_and_position_outputs",
    "secondarySkillAtomIds": [
      "output_contract_analysis",
      "stack_representation_choice"
    ],
    "type": "solution_comparison",
    "prompt": "Task A asks for the next greater value. Task B asks for the index of the next greater value. Which representation comparison is most accurate?",
    "feedbackModel": {
      "decisionSignal": "The two output contracts preserve different information about the qualifying occurrence.",
      "mentalModelCorrection": "Representation should be derived from what must be returned and what must remain identifiable when the answer is discovered.",
      "mistakeTypes": [
        "output_representation_mismatch"
      ],
      "nextAction": "Separate qualifying value, qualifying position, and distance as distinct output requirements.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "task_b_requires_position",
        "text": "Task B requires preserving positional identity; Task A may use values alone if no other contract detail requires indexes.",
        "isCorrect": true
      },
      {
        "id": "values_for_b_indexes_for_a",
        "text": "Task A requires indexes, while Task B requires only values.",
        "isCorrect": false
      },
      {
        "id": "same_representation_always",
        "text": "Both tasks must always use the same stack representation.",
        "isCorrect": false
      },
      {
        "id": "neither_needs_stack_entries",
        "text": "The current maximum value is sufficient for both tasks.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-representation-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_value_only_distance_bug",
    "secondarySkillAtomIds": [
      "lost_position_metadata",
      "distance_output_contract"
    ],
    "type": "solution_comparison",
    "prompt": "A solution stores only values but must return the distance to the next greater occurrence. When a greater value appears, it subtracts the popped value from the current value. What is the main flaw?",
    "feedbackModel": {
      "decisionSignal": "The output unit is positions, while the stored state contains only numeric values.",
      "mentalModelCorrection": "A representation that omits position cannot later reconstruct positional distance unless that information is retained elsewhere.",
      "mistakeTypes": [
        "lost_position_metadata",
        "value_index_confusion"
      ],
      "nextAction": "Check whether every output unit can be derived from the proposed stored fields.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "numeric_difference_not_distance",
        "text": "The subtraction computes a difference in magnitude, not a difference in positions.",
        "isCorrect": true
      },
      {
        "id": "subtraction_too_slow",
        "text": "Numeric subtraction makes each stack operation O(log n).",
        "isCorrect": false
      },
      {
        "id": "greater_value_unavailable",
        "text": "The current greater value cannot be read during the scan.",
        "isCorrect": false
      },
      {
        "id": "stack_order_reversed",
        "text": "Any subtraction reverses the monotonic order of the stack.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-representation-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_redundant_value_index_pairs",
    "secondarySkillAtomIds": [
      "minimal_stack_state",
      "array_value_lookup"
    ],
    "type": "solution_comparison",
    "prompt": "The complete input array remains accessible, the output requires indexes and distances, and stack entries currently store both value and index. Is the stored value always necessary?",
    "feedbackModel": {
      "decisionSignal": "The index already provides both occurrence identity and indirect value access.",
      "mentalModelCorrection": "Storing a value-index pair may be redundant when the source array remains available and no transformed value must be preserved.",
      "mistakeTypes": [
        "unnecessary_stack_state"
      ],
      "nextAction": "Remove fields that can be derived cheaply and unambiguously from retained state.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "index_may_be_enough",
        "text": "No. The index may be sufficient because it preserves position and can retrieve the value from the array.",
        "isCorrect": true
      },
      {
        "id": "pair_always_required",
        "text": "Yes. Every monotonic-stack entry must contain both fields.",
        "isCorrect": false
      },
      {
        "id": "value_only_better",
        "text": "No. The index should be removed and only the value retained.",
        "isCorrect": false
      },
      {
        "id": "neither_needed",
        "text": "No. The stack can contain empty entries because the array remains accessible.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-stack-monotonic-representation-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "justify_monotonic_stack_representation",
    "secondarySkillAtomIds": [
      "stack_entry_contract",
      "output_driven_state_design"
    ],
    "type": "solution_comparison",
    "prompt": "Which explanation best describes how to choose between values, indexes, and value-index pairs in a monotonic stack?",
    "feedbackModel": {
      "decisionSignal": "The correct representation depends on what information must survive until an unresolved entry is processed.",
      "mentalModelCorrection": "There is no universal stack-entry shape. Representation follows the comparison mechanism, source accessibility, duplicate identity, and output contract.",
      "mistakeTypes": [
        "weak_state_representation_justification"
      ],
      "nextAction": "List required comparison fields, output fields, and derivable fields before defining the stack entry.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "derive_from_contract",
        "text": "Store the minimum information needed for comparison, occurrence identity, and the required output: values may suffice for value-only answers, indexes preserve positions and distances, and pairs are useful when both are needed but values cannot be retrieved elsewhere.",
        "isCorrect": true
      },
      {
        "id": "always_indexes",
        "text": "Always store indexes because values are never useful in stack entries.",
        "isCorrect": false
      },
      {
        "id": "always_values",
        "text": "Always store values because positions can be reconstructed from stack order.",
        "isCorrect": false
      },
      {
        "id": "always_pairs",
        "text": "Always store value-index pairs because extra state cannot cause design mistakes.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
