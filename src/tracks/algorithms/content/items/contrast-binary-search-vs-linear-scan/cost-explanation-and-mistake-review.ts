import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const costExplanationAndMistakeReviewQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A reviewer says a target scan is O(n) because its loop variable is named i. Which explanation identifies the actual source of the growth rate?",
      "mentalModelCorrection": "Big-O follows the amount of work as input grows. A worst-case scan is linear because it may inspect every one of the n positions.",
      "mistakeTypes": [
        "cannot_explain_why",
        "complexity_misread"
      ],
      "nextAction": "Replace name-based explanations with an explicit statement about how many input positions the algorithm may visit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "variable_name": "The identifier i is conventional but has no effect on how many iterations execute.",
        "equality_operator": "Using an equality comparison does not determine the number of values that must be checked.",
        "numeric_target": "A numeric target does not reduce the work when the input has no order that supports elimination."
      }
    },
    "id": "alg-contrast-binary-linear-cost-002-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "derive_time_complexity",
    "secondarySkillAtomIds": [
      "identify_repeated_work"
    ],
    "prompt": "Choose the valid cost explanation.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_repeated_work",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "operations_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Explain why scanning is linear",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A reviewer says a target scan is O(n) because its loop variable is named i. Which explanation identifies the actual source of the growth rate?",
    "answerFeedback": "Linear time comes from potentially inspecting all n positions, not from syntax or variable names.",
    "options": [
      {
        "id": "inspect_all_positions",
        "text": "In the worst case, the scan visits each of the n positions once.",
        "isCorrect": true
      },
      {
        "id": "variable_name",
        "text": "The loop is O(n) because the index variable is named i.",
        "isCorrect": false
      },
      {
        "id": "equality_operator",
        "text": "The loop is O(n) because it uses === inside the condition.",
        "isCorrect": false
      },
      {
        "id": "numeric_target",
        "text": "The loop is O(n) because the target happens to be a number.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A function uses variables named left, right, and mid on an unsorted array, then discards one side after each comparison. Its author calls it a correct O(log n) search. What is the strongest review?",
      "mentalModelCorrection": "Names and shrinking indexes do not prove binary search is valid. A half may be discarded only when sorted order or a monotonic predicate proves that half impossible.",
      "mistakeTypes": [
        "cannot_explain_why",
        "precondition_missed",
        "complexity_misread"
      ],
      "nextAction": "Before accepting a logarithmic-search claim, require an explicit ordered or monotonic half-discard argument.",
      "result": "diagnostic",
      "distractorExplanations": {
        "names_prove_logarithmic": "Conventional boundary names describe code shape, not the legality or correctness of discarding data.",
        "shrinking_is_enough": "A range can shrink quickly while removing the target; progress alone does not establish a valid search rule.",
        "numeric_target_is_enough": "The target's numeric type does not impose order on the array or monotonicity on the decision rule."
      }
    },
    "id": "alg-contrast-binary-linear-cost-004-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "secondarySkillAtomIds": [
      "derive_time_complexity"
    ],
    "prompt": "Choose the correct code-review conclusion.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "precondition_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose a name-based logarithmic claim",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A function uses variables named left, right, and mid on an unsorted array, then discards one side after each comparison. Its author calls it a correct O(log n) search. What is the strongest review?",
    "answerFeedback": "A logarithmic search needs a correct rule that proves one ordered region cannot contain the answer.",
    "options": [
      {
        "id": "require_discard_proof",
        "text": "Reject the claim until sorted order or a monotonic predicate justifies every discarded half.",
        "isCorrect": true
      },
      {
        "id": "names_prove_logarithmic",
        "text": "Accept it because left, right, and mid are the standard binary-search variable names.",
        "isCorrect": false
      },
      {
        "id": "shrinking_is_enough",
        "text": "Accept it because any loop that shrinks an interval is both correct and O(log n).",
        "isCorrect": false
      },
      {
        "id": "numeric_target_is_enough",
        "text": "Accept it because comparing numeric targets always creates a searchable order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "You must answer one membership query on an unsorted array, and preprocessing is not allowed. Compare a full linear scan with a middle-based routine that discards one side without any ordering proof.",
      "mentalModelCorrection": "A slower correct method beats a faster-looking invalid method. The middle-based routine is not a valid O(log n) solution when no half-discard rule exists.",
      "mistakeTypes": [
        "wrong_approach",
        "precondition_missed"
      ],
      "nextAction": "Eliminate approaches that cannot prove correctness before comparing their asymptotic costs.",
      "result": "diagnostic",
      "distractorExplanations": {
        "claimed_binary": "The routine may perform few comparisons, but it can discard the side containing the target because the array is unsorted.",
        "choose_by_label": "The word binary does not establish either correctness or logarithmic behavior for this input."
      }
    },
    "id": "alg-contrast-binary-linear-cost-005-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "secondarySkillAtomIds": [
      "compare_complexity_tradeoffs"
    ],
    "prompt": "Choose the defensible solution comparison.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "compare_complexity_tradeoffs",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Reject a faster-looking invalid search",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "You must answer one membership query on an unsorted array, and preprocessing is not allowed. Which comparison is correct?",
    "answerFeedback": "The linear scan is correct in O(n); the middle-based routine has no legal discard rule and is not a valid competitor.",
    "options": [
      {
        "id": "linear_correct",
        "text": "Choose the O(n) linear scan because it checks every still-possible position and is correct on unsorted input.",
        "isCorrect": true
      },
      {
        "id": "claimed_binary",
        "text": "Choose the claimed O(log n) routine because fewer comparisons matter more than whether a discarded side can contain the target.",
        "isCorrect": false
      },
      {
        "id": "choose_by_label",
        "text": "Choose whichever implementation is named binarySearch because the name determines the strategy and cost.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the earliest original index whose value satisfies an arbitrary condition. The input is unsorted, and original order is part of the result. Which cost review is accurate?",
      "mentalModelCorrection": "Linear scan is not automatically inferior. Here it preserves the required order and directly proves the earliest match; sorting would change the evidence the output depends on.",
      "mistakeTypes": [
        "wrong_approach",
        "order_constraint_missed"
      ],
      "nextAction": "Before ranking asymptotic costs, check whether preprocessing changes the order or output contract the task requires.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_then_binary": "Sorting may enable binary lookup, but it destroys the original-index order needed to identify the earliest matching position.",
        "numeric_index": "Indexes being numeric does not make the arbitrary condition monotonic across positions.",
        "linear_always_bad": "An O(n) method can be the correct and appropriate method when every earlier position must be ruled out."
      }
    },
    "id": "alg-contrast-binary-linear-cost-006-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "diagnose_order_destroying_transform",
    "secondarySkillAtomIds": [
      "compare_complexity_tradeoffs"
    ],
    "prompt": "Choose the review that respects both cost and output contract.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "diagnose_order_destroying_transform",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "compare_complexity_tradeoffs",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "indexed_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "order_constraint_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize when linear scan is appropriate",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task asks for the earliest original index whose value satisfies an arbitrary condition. The input is unsorted, and original order is part of the result. Which cost review is accurate?",
    "answerFeedback": "A left-to-right scan correctly preserves original order and may need O(n) checks to prove the earliest match.",
    "options": [
      {
        "id": "linear_preserves_contract",
        "text": "Use a linear scan: O(n) is appropriate because earlier original positions must be checked and order cannot be changed.",
        "isCorrect": true
      },
      {
        "id": "sort_then_binary",
        "text": "Sort first and use binary search because O(log n) lookup is always better, even if the original index changes.",
        "isCorrect": false
      },
      {
        "id": "numeric_index",
        "text": "Binary-search the indexes because indexes are numeric, regardless of how the condition behaves.",
        "isCorrect": false
      },
      {
        "id": "linear_always_bad",
        "text": "Reject the linear scan solely because any O(n) method is unacceptable when binary search exists.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "complexityVariables": {
      "n": "number of values in the array",
      "q": "number of membership queries"
    },
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An unsorted array of n values will answer q membership queries. Original order is irrelevant, and the sorted result can be reused. Which total-cost comparison is correct?",
      "mentalModelCorrection": "Repeated scans cost O(qn). Sorting once and reusing that work costs O(n log n + q log n), because preprocessing and query phases are sequential and each query halves the sorted range.",
      "mistakeTypes": [
        "complexity_mismatch",
        "reuse_contract_misread"
      ],
      "nextAction": "Write preprocessing cost once, then add q times the per-query cost; do not erase or multiply sequential phases.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_is_free": "The q binary searches cost O(q log n), but producing the sorted array still costs O(n log n).",
        "multiply_phases": "Sorting and querying happen sequentially, so their costs are added rather than multiplied into O(qn log n).",
        "binary_unsorted": "Without sorting or another ordered structure, binary search cannot legally discard half of the original unsorted array."
      }
    },
    "id": "alg-contrast-binary-linear-cost-007-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "secondarySkillAtomIds": [
      "compare_complexity_tradeoffs",
      "recognize_binary_search_signal"
    ],
    "prompt": "Choose the correct total-cost comparison.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "compare_complexity_tradeoffs",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "reuse_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Compare repeated-query totals",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "An unsorted array of n values will answer q membership queries. Original order is irrelevant, and the sorted result can be reused. Which total-cost comparison is correct?",
    "answerFeedback": "Repeated scans cost O(qn), while reusable sorting plus binary searches costs O(n log n + q log n).",
    "options": [
      {
        "id": "correct_totals",
        "text": "Repeated scans: O(qn). Sort once plus q binary searches: O(n log n + q log n).",
        "isCorrect": true
      },
      {
        "id": "sorting_is_free",
        "text": "Repeated scans: O(qn). Sort once plus q binary searches: O(q log n), because one-time sorting is free.",
        "isCorrect": false
      },
      {
        "id": "multiply_phases",
        "text": "Repeated scans: O(qn). Sort once plus q binary searches: O(qn log n), because sorting and queries must be multiplied.",
        "isCorrect": false
      },
      {
        "id": "binary_unsorted",
        "text": "Repeated scans: O(qn). Binary-search the unsorted array q times in O(q log n) without preprocessing.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "complexityVariables": {
      "n": "number of values sorted once",
      "q": "number of later membership queries"
    },
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "An engineer sorts n values once, then answers q membership queries with binary search. The review states the entire plan is O(q log n). What cost was omitted?",
      "mentalModelCorrection": "Sorting is preprocessing work, not free setup. The complete total is O(n log n + q log n).",
      "mistakeTypes": [
        "complexity_mismatch",
        "reuse_contract_misread"
      ],
      "nextAction": "List every sequential phase before simplifying: build or preprocess once, then multiply only the per-query work by q.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_constant": "A comparison sort over n values is not O(1); its cost grows as O(n log n).",
        "multiply_sequential": "The sort finishes before the queries begin, so sequential costs are added instead of multiplied.",
        "no_order_needed": "The sorted structure is exactly what makes the later half-discard rule legal for ordinary value lookup."
      }
    },
    "id": "alg-contrast-binary-linear-cost-008-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "secondarySkillAtomIds": [
      "recognize_sorting_tradeoff"
    ],
    "prompt": "Choose the correct review correction.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "sorting_based",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Account for one-time sorting",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "An engineer sorts n values once, then answers q membership queries with binary search. The review states the entire plan is O(q log n). What cost was omitted?",
    "answerFeedback": "The omitted O(n log n) sorting phase makes the total O(n log n + q log n).",
    "options": [
      {
        "id": "include_sorting",
        "text": "Include the one-time O(n log n) sort, giving O(n log n + q log n) total time.",
        "isCorrect": true
      },
      {
        "id": "sorting_constant",
        "text": "No cost was omitted because sorting once is O(1) regardless of n.",
        "isCorrect": false
      },
      {
        "id": "multiply_sequential",
        "text": "Replace the total with O(qn log n) because every query multiplies the completed sort.",
        "isCorrect": false
      },
      {
        "id": "no_order_needed",
        "text": "Remove the sort entirely and keep O(q log n), because binary search does not need ordered data.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "For increasing numeric candidates x, a predicate returns true, false, true, false. A developer proposes binary search because x is numeric. What is wrong with the reasoning?",
      "mentalModelCorrection": "Numeric candidates do not guarantee a searchable boundary. Binary search needs a monotonic true/false transition so one side can be discarded safely.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "wrong_approach"
      ],
      "nextAction": "Write the predicate outcomes in candidate order and verify that they change direction at most once before choosing binary search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "numeric_implies_order": "The candidate values are ordered numerically, but the predicate outcomes are not monotonic across that order.",
        "boolean_implies_boundary": "Returning booleans is insufficient; the sequence of booleans must form a single searchable transition.",
        "fewer_checks_wins": "Performing fewer checks is useful only when those checks preserve correctness and cannot skip a valid answer."
      }
    },
    "id": "alg-contrast-binary-linear-cost-010-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "secondarySkillAtomIds": [
      "recognize_binary_search_signal"
    ],
    "prompt": "Choose the precise diagnosis.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "binary_search_answer_feasibility_predicate",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "monotonic_assumption_invalid",
        "role": "mistake_type"
      }
    ],
    "title": "Reject numeric-only binary-search reasoning",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "For increasing numeric candidates x, a predicate returns true, false, true, false. A developer proposes binary search because x is numeric. What is wrong with the reasoning?",
    "answerFeedback": "The alternating outcomes provide no single boundary, so a half cannot be discarded safely.",
    "options": [
      {
        "id": "predicate_not_monotonic",
        "text": "The predicate is non-monotonic, so numeric order does not justify discarding either half.",
        "isCorrect": true
      },
      {
        "id": "numeric_implies_order",
        "text": "The reasoning is valid because every numeric domain automatically supports binary search.",
        "isCorrect": false
      },
      {
        "id": "boolean_implies_boundary",
        "text": "The reasoning is valid because any boolean predicate has a first-true or last-true boundary.",
        "isCorrect": false
      },
      {
        "id": "fewer_checks_wins",
        "text": "The reasoning is valid because an approach that checks fewer candidates is preferable even when it can skip answers.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "feedbackModel": {
      "decisionSignal": "Two functions are both named searchTarget. One may inspect all n items; the other legally halves a sorted candidate range. Which statement about their Big-O is correct?",
      "mentalModelCorrection": "Keywords and function names do not determine complexity. The scan is O(n) because it may visit every item; the halving search is O(log n) because each legal step removes about half the candidates.",
      "mistakeTypes": [
        "complexity_misread",
        "cannot_explain_why"
      ],
      "nextAction": "Describe the repeated operation and how the remaining work shrinks instead of inferring cost from names or problem wording.",
      "result": "diagnostic",
      "distractorExplanations": {
        "both_log_search_word": "The word search describes the goal, not the number of operations performed as n grows.",
        "both_linear_array": "Using an array does not force a full traversal when sorted order supports legal halving.",
        "target_value_controls": "Big-O is measured against input dimensions and performed work, not the magnitude of the target value by itself."
      }
    },
    "id": "alg-contrast-binary-linear-cost-011-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "derive_time_complexity",
    "secondarySkillAtomIds": [
      "recognize_binary_search_signal"
    ],
    "prompt": "Choose the valid complexity statement.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "operations_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Ignore search keywords when deriving cost",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Two functions are both named searchTarget. One may inspect all n items; the other legally halves a sorted candidate range. Which statement about their Big-O is correct?",
    "answerFeedback": "The scan is O(n), while legal repeated halving is O(log n); the shared name is irrelevant.",
    "options": [
      {
        "id": "work_pattern_controls",
        "text": "Complexity follows the work pattern: visiting up to n items is O(n), while legal halving is O(log n).",
        "isCorrect": true
      },
      {
        "id": "both_log_search_word",
        "text": "Both are O(log n) because their names contain the word search.",
        "isCorrect": false
      },
      {
        "id": "both_linear_array",
        "text": "Both are O(n) because both receive an array.",
        "isCorrect": false
      },
      {
        "id": "target_value_controls",
        "text": "Their complexity is determined by the numeric size of target rather than by n or the performed operations.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Solution A linearly checks an arbitrary boolean sequence and always finds an existing true value. Solution B probes logarithmically but assumes a false-false-true-true boundary that the input does not guarantee. Which comparison is sound?",
      "mentalModelCorrection": "Asymptotic ranking starts after correctness and preconditions are established. An invalid logarithmic routine is not better than a correct linear scan.",
      "mistakeTypes": [
        "wrong_approach",
        "monotonic_assumption_invalid",
        "cannot_explain_why"
      ],
      "nextAction": "When comparing solutions, first state each correctness precondition; only then compare time and space among the approaches that remain valid.",
      "result": "diagnostic",
      "distractorExplanations": {
        "logarithmic_always_wins": "Fewer probes do not compensate for discarding regions under a false monotonicity assumption.",
        "call_it_log_anyway": "A loop can execute logarithmically and still be an incorrect solution; runtime alone does not validate the result.",
        "linear_always_preferred": "Linear scan is appropriate in this scenario, but legal binary search remains preferable when the required ordered boundary actually exists."
      }
    },
    "id": "alg-contrast-binary-linear-cost-012-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "secondarySkillAtomIds": [
      "recognize_binary_search_signal",
      "binary_search_answer_feasibility_predicate"
    ],
    "prompt": "Choose the sound solution review.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "compare_complexity_tradeoffs",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "binary_search_answer_feasibility_predicate",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Rank correctness before asymptotic speed",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Solution A linearly checks an arbitrary boolean sequence and always finds an existing true value. Solution B probes logarithmically but assumes a false-false-true-true boundary that the input does not guarantee. Which comparison is sound?",
    "answerFeedback": "Solution A is valid in O(n); Solution B cannot be ranked as a solution until monotonicity is guaranteed.",
    "options": [
      {
        "id": "correctness_first",
        "text": "Choose A for this input; compare asymptotic costs only after B's monotonic-boundary precondition is satisfied.",
        "isCorrect": true
      },
      {
        "id": "logarithmic_always_wins",
        "text": "Choose B because O(log n) is always preferable to O(n), even when the assumed boundary may not exist.",
        "isCorrect": false
      },
      {
        "id": "call_it_log_anyway",
        "text": "Call B the better solution as long as its loop performs O(log n) probes, regardless of whether it can miss true values.",
        "isCorrect": false
      },
      {
        "id": "linear_always_preferred",
        "text": "Choose A because linear scan is always better than binary search, including on guaranteed monotonic input.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
