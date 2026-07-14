// Planning target: this file should contain questions about recognizing the high-level contrast between binary search and linear scan:
// sorted indexed input; monotonic predicate; answer-space feasible/infeasible split;
// versus arbitrary unsorted data where only linear inspection is justified.
// It should diagnose mistakes such as choosing binary search only because the prompt says "search",
// choosing linear scan despite a clear sorted/monotonic half-discard signal,
// assuming every numeric answer is binary-searchable,
// or failing to name what makes binary search legal.
// Target question count: 16.
// Prefer single_choice, strategy_choice, solution_comparison, and mistake-review style items.
// Avoid detailed boundary mechanics; this file is about recognition and legality.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeContrastSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A sorted ascending array stores n values, and the task asks whether target exists. What is the strongest strategy signal?",
      "mentalModelCorrection": "Sorted indexed order lets a comparison with the middle value eliminate one side of the remaining indexes.",
      "mistakeTypes": [
        "structure_signal_missed"
      ],
      "nextAction": "Name the ordered property that makes half-discarding legal before discussing implementation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "search_word": "The wording names the goal, not the structural property that makes binary search correct.",
        "array_always": "An array can be unsorted; indexing alone does not order values."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-001-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Recognize sorted indexed lookup\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "structure_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize sorted indexed lookup",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "classic_index_binary_search"
    ],
    "constraintSignal": "The array is sorted and indexable.",
    "expectedApproachIds": [
      "classic_index_binary_search"
    ],
    "reasonSignal": "A midpoint comparison can prove one side contains no target.",
    "rejectedApproachIds": [
      "linear_scan_default"
    ],
    "instruction": "A sorted ascending array stores n values, and the task asks whether target exists. What is the strongest strategy signal?",
    "answerFeedback": "Sorted indexed order lets a comparison with the middle value eliminate one side of the remaining indexes.",
    "options": [
      {
        "id": "sorted_indexed",
        "text": "Use binary search because sorted indexes let each comparison discard a half.",
        "isCorrect": true
      },
      {
        "id": "search_word",
        "text": "Use binary search because the prompt says search.",
        "explanation": "The wording names the goal, not the structural property that makes binary search correct.",
        "isCorrect": false
      },
      {
        "id": "array_always",
        "text": "Use binary search because the input is an array.",
        "explanation": "An array can be unsorted; indexing alone does not order values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "For increasing candidates x, feasible(x) is false, false, false, true, true, true. What makes binary search legal even though there is no array of stored values?",
      "mentalModelCorrection": "The ordered candidates have a single false-to-true boundary, so one feasibility check can eliminate a side.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "Look for a one-direction feasibility transition when the search domain is an answer range.",
      "result": "diagnostic",
      "distractorExplanations": {
        "numeric_domain": "Numeric order is necessary here, but the monotonic feasibility transition is what makes elimination safe.",
        "boolean_output": "Boolean output can alternate; it must be monotonic over the ordered candidates."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-002-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Recognize monotonic predicate search\", choose the strategy signal.",
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
        "nodeId": "monotonic_predicate_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "monotonic_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize monotonic predicate search",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "For increasing candidates x, feasible(x) is false, false, false, true, true, true. What makes binary search legal even though there is no array of stored values?",
    "answerFeedback": "The ordered candidates have a single false-to-true boundary, so one feasibility check can eliminate a side.",
    "options": [
      {
        "id": "monotonic_boundary",
        "text": "The feasibility predicate is monotonic and exposes one searchable boundary.",
        "isCorrect": true
      },
      {
        "id": "numeric_domain",
        "text": "Any numeric candidate range is automatically binary-searchable.",
        "explanation": "Numeric order is necessary here, but the monotonic feasibility transition is what makes elimination safe.",
        "isCorrect": false
      },
      {
        "id": "boolean_output",
        "text": "Any boolean result supports binary search.",
        "explanation": "Boolean output can alternate; it must be monotonic over the ordered candidates.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "An unsorted array contains customer IDs, and there is one membership query. Which high-level decision is justified from the stated structure?",
      "mentalModelCorrection": "Without sorted order, a midpoint does not prove either half is impossible, so direct inspection is the justified choice.",
      "mistakeTypes": [
        "constraint_ignored"
      ],
      "nextAction": "Reject binary search when no value order or monotonic predicate is supplied.",
      "result": "diagnostic",
      "distractorExplanations": {
        "numeric_ids": "Numeric values do not order their positions in an unsorted array.",
        "membership_binary": "Membership can be solved by different strategies; the structure determines legality."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-003-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Recognize unsorted direct inspection\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize unsorted direct inspection",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "The data is unsorted and only one query is stated.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "No midpoint comparison can eliminate a half of arbitrary-order data.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "An unsorted array contains customer IDs, and there is one membership query. Which high-level decision is justified from the stated structure?",
    "answerFeedback": "Without sorted order, a midpoint does not prove either half is impossible, so direct inspection is the justified choice.",
    "options": [
      {
        "id": "linear_inspection",
        "text": "Inspect the records directly because the array has no ordered half-discard rule.",
        "isCorrect": true
      },
      {
        "id": "numeric_ids",
        "text": "Use binary search because IDs are numeric.",
        "explanation": "Numeric values do not order their positions in an unsorted array.",
        "isCorrect": false
      },
      {
        "id": "membership_binary",
        "text": "Use binary search because membership is a search problem.",
        "explanation": "Membership can be solved by different strategies; the structure determines legality.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A learner can name binary search but cannot explain why its midpoint decision is safe. What explanation is required?",
      "mentalModelCorrection": "Binary search is justified only when order or monotonicity proves that all candidates on one side are impossible.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Explain the eliminated side, not just the algorithm name, before accepting the strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "half_fast": "Speed does not make an unsupported discard correct.",
        "midpoint_exists": "A midpoint exists even when its value gives no information about either side."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-004-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Name the legal discard signal\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Name the legal discard signal",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A learner can name binary search but cannot explain why its midpoint decision is safe. What explanation is required?",
    "answerFeedback": "Binary search is justified only when order or monotonicity proves that all candidates on one side are impossible.",
    "options": [
      {
        "id": "discard_proof",
        "text": "A sorted or monotonic structure proves that the discarded side cannot contain a valid answer.",
        "isCorrect": true
      },
      {
        "id": "half_fast",
        "text": "It is valid because checking half the indexes is faster.",
        "explanation": "Speed does not make an unsupported discard correct.",
        "isCorrect": false
      },
      {
        "id": "midpoint_exists",
        "text": "It is valid because every range has a midpoint.",
        "explanation": "A midpoint exists even when its value gives no information about either side.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The input array is unsorted, but the task has a numeric answer x. Which question determines whether binary search on x is even a candidate?",
      "mentalModelCorrection": "The answer domain must have a monotonic feasibility predicate; the fact that x is numeric is not enough.",
      "mistakeTypes": [
        "state_model_misread"
      ],
      "nextAction": "Define what feasible(x) means and inspect whether its outcomes change direction at most once.",
      "result": "diagnostic",
      "distractorExplanations": {
        "array_sorted": "Answer-space search can be legal without a sorted input array, but it still needs monotonic feasibility.",
        "answer_numeric": "Numeric candidates can have arbitrary feasible and infeasible regions."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-005-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "For \"Separate target space from input order\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Separate target space from input order",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "The input array is unsorted, but the task has a numeric answer x. Which question determines whether binary search on x is even a candidate?",
    "answerFeedback": "The answer domain must have a monotonic feasibility predicate; the fact that x is numeric is not enough.",
    "options": [
      {
        "id": "feasibility_shape",
        "text": "Check whether feasibility over x is monotonic and creates a single boundary.",
        "isCorrect": true
      },
      {
        "id": "array_sorted",
        "text": "Check only whether the original array is sorted.",
        "explanation": "Answer-space search can be legal without a sorted input array, but it still needs monotonic feasibility.",
        "isCorrect": false
      },
      {
        "id": "answer_numeric",
        "text": "Nothing else is needed because x is numeric.",
        "explanation": "Numeric candidates can have arbitrary feasible and infeasible regions.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A prompt says ‘search for a matching record’, but gives an unsorted list and no predicate over ordered candidates. What diagnosis is correct?",
      "mentalModelCorrection": "The word search is not evidence for binary search; the input must expose ordered elimination or a monotonic boundary.",
      "mistakeTypes": [
        "wrong_approach"
      ],
      "nextAction": "Read the data structure and constraints before reacting to search-related wording.",
      "result": "diagnostic",
      "distractorExplanations": {
        "keyword_is_signal": "Natural-language keywords do not establish sorted order or monotonicity.",
        "record_lookup": "Lookup can require linear inspection when records are arbitrary-order."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-006-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Reject keyword-only selection\", choose the strategy signal.",
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
    "title": "Reject keyword-only selection",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A prompt says ‘search for a matching record’, but gives an unsorted list and no predicate over ordered candidates. What diagnosis is correct?",
    "answerFeedback": "The word search is not evidence for binary search; the input must expose ordered elimination or a monotonic boundary.",
    "options": [
      {
        "id": "keyword_not_signal",
        "text": "Reject binary search because the prompt provides no legal discard structure.",
        "isCorrect": true
      },
      {
        "id": "keyword_is_signal",
        "text": "Choose binary search because search is in the prompt.",
        "explanation": "Natural-language keywords do not establish sorted order or monotonicity.",
        "isCorrect": false
      },
      {
        "id": "record_lookup",
        "text": "Choose binary search because lookup tasks always halve candidates.",
        "explanation": "Lookup can require linear inspection when records are arbitrary-order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A learner chooses a left-to-right scan for a sorted array with many indexed membership checks. Which signal did they miss?",
      "mentalModelCorrection": "Sorted indexed order supports logarithmic lookup by eliminating half of the remaining positions per query.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "When a target lookup is order-preserving, compare the scan with the legal halving strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_always_best": "A scan is correct, but it is not asymptotically best when sorted order supports halving.",
        "array_requires_scan": "Indexable sorted arrays are a canonical binary-search structure."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-007-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Do not miss sorted lookup\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "monotonic_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Do not miss sorted lookup",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A learner chooses a left-to-right scan for a sorted array with many indexed membership checks. Which signal did they miss?",
    "answerFeedback": "Sorted indexed order supports logarithmic lookup by eliminating half of the remaining positions per query.",
    "options": [
      {
        "id": "sorted_half_discard",
        "text": "They missed that sorted indexes allow each comparison to eliminate half the candidates.",
        "isCorrect": true
      },
      {
        "id": "scan_always_best",
        "text": "They are correct because a scan is always the safest lookup.",
        "explanation": "A scan is correct, but it is not asymptotically best when sorted order supports halving.",
        "isCorrect": false
      },
      {
        "id": "array_requires_scan",
        "text": "They are correct because arrays must always be scanned.",
        "explanation": "Indexable sorted arrays are a canonical binary-search structure.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "For ordered capacities, every capacity below c is infeasible and every capacity at or above c is feasible. What high-level task shape is present?",
      "mentalModelCorrection": "The feasibility outcomes form a false prefix and true suffix, which is a searchable first-true boundary.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "Translate ordered feasibility outcomes into the boundary the query asks you to locate.",
      "result": "diagnostic",
      "distractorExplanations": {
        "arbitrary_boolean": "The specified false-prefix and true-suffix shape is exactly the needed structure.",
        "input_membership": "The ordered capacity domain and feasibility boundary define a different search space."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-008-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Recognize first feasible candidate\", choose the strategy signal.",
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
        "nodeId": "monotonic_predicate_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "monotonic_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize first feasible candidate",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "monotonic_boundary_binary_search"
    ],
    "constraintSignal": "Feasibility is false below one boundary and true from that boundary onward.",
    "expectedApproachIds": [
      "monotonic_boundary_binary_search"
    ],
    "reasonSignal": "A first-true boundary supports safe half-discarding.",
    "rejectedApproachIds": [
      "linear_scan_default"
    ],
    "instruction": "For ordered capacities, every capacity below c is infeasible and every capacity at or above c is feasible. What high-level task shape is present?",
    "answerFeedback": "The feasibility outcomes form a false prefix and true suffix, which is a searchable first-true boundary.",
    "options": [
      {
        "id": "first_true_boundary",
        "text": "This is a monotonic first-true boundary, so binary search can replace a full scan.",
        "isCorrect": true
      },
      {
        "id": "arbitrary_boolean",
        "text": "It is an arbitrary boolean query with no searchable structure.",
        "explanation": "The specified false-prefix and true-suffix shape is exactly the needed structure.",
        "isCorrect": false
      },
      {
        "id": "input_membership",
        "text": "It is ordinary membership in an unsorted input array.",
        "explanation": "The ordered capacity domain and feasibility boundary define a different search space.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A predicate returns true for some candidates and false for others, but its results alternate as the candidate increases. What is the correct strategy signal?",
      "mentalModelCorrection": "Boolean output alone is insufficient; alternating results do not expose a boundary from which a half can be discarded.",
      "mistakeTypes": [
        "monotonic_assumption_invalid"
      ],
      "nextAction": "Write predicate outcomes in candidate order and reject binary search when they reverse direction.",
      "result": "diagnostic",
      "distractorExplanations": {
        "boolean_search": "The shape of the boolean sequence, not its type, determines legality.",
        "candidate_order": "Ordered candidates need a monotonic predicate to support elimination."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-009-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "For \"Distinguish arbitrary boolean output\", choose the strategy signal.",
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
    "title": "Distinguish arbitrary boolean output",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A predicate returns true for some candidates and false for others, but its results alternate as the candidate increases. What is the correct strategy signal?",
    "answerFeedback": "Boolean output alone is insufficient; alternating results do not expose a boundary from which a half can be discarded.",
    "options": [
      {
        "id": "not_monotonic",
        "text": "The predicate is not monotonic, so binary search is not justified by its boolean return type.",
        "isCorrect": true
      },
      {
        "id": "boolean_search",
        "text": "Use binary search because the result is boolean.",
        "explanation": "The shape of the boolean sequence, not its type, determines legality.",
        "isCorrect": false
      },
      {
        "id": "candidate_order",
        "text": "Use binary search because the candidates are ordered numerically.",
        "explanation": "Ordered candidates need a monotonic predicate to support elimination.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A linear scan returns the correct answer for a sorted array, but the constraints allow n = 1,000,000. What should the strategy review say?",
      "mentalModelCorrection": "Correctness and asymptotic efficiency are separate: a scan may be correct while binary search better fits large sorted input.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "After checking correctness, compare growth rates against the stated input limits.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_invalid": "Sorted order permits binary search but does not make a linear scan incorrect.",
        "same_growth": "A full scan is O(n), while legal repeated halving is O(log n)."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-010-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Do not confuse correctness with efficiency\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Do not confuse correctness with efficiency",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A linear scan returns the correct answer for a sorted array, but the constraints allow n = 1,000,000. What should the strategy review say?",
    "answerFeedback": "Correctness and asymptotic efficiency are separate: a scan may be correct while binary search better fits large sorted input.",
    "options": [
      {
        "id": "correct_but_slower",
        "text": "The scan is correct, but sorted order provides a faster O(log n) lookup than O(n).",
        "isCorrect": true
      },
      {
        "id": "scan_invalid",
        "text": "The scan is incorrect because sorted arrays require binary search.",
        "explanation": "Sorted order permits binary search but does not make a linear scan incorrect.",
        "isCorrect": false
      },
      {
        "id": "same_growth",
        "text": "Both strategies have the same asymptotic growth on an array.",
        "explanation": "A full scan is O(n), while legal repeated halving is O(log n).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Values are sorted, but the data structure only exposes the next item through a linked traversal. Which legality question remains before selecting indexed binary search?",
      "mentalModelCorrection": "Classic binary search needs efficient access to a midpoint; sorted values alone do not supply random access.",
      "mistakeTypes": [
        "data_structure_mismatch"
      ],
      "nextAction": "Check both ordering and the cost of reaching the midpoint in the actual data structure.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorted_sufficient": "A linked traversal may make midpoint access linear and remove the intended benefit.",
        "search_word": "Lookup wording cannot replace the required access and order properties."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-011-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Check indexability as well as order\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Check indexability as well as order",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Values are sorted, but the data structure only exposes the next item through a linked traversal. Which legality question remains before selecting indexed binary search?",
    "answerFeedback": "Classic binary search needs efficient access to a midpoint; sorted values alone do not supply random access.",
    "options": [
      {
        "id": "midpoint_access",
        "text": "Verify that midpoint positions are efficiently indexable; sorted order alone is not enough.",
        "isCorrect": true
      },
      {
        "id": "sorted_sufficient",
        "text": "Use binary search automatically because the values are sorted.",
        "explanation": "A linked traversal may make midpoint access linear and remove the intended benefit.",
        "isCorrect": false
      },
      {
        "id": "search_word",
        "text": "Use binary search because the task is a lookup.",
        "explanation": "Lookup wording cannot replace the required access and order properties.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A sorted status list has outcomes false, false, true, true, true, and the task asks for the first accepted position. What should replace a linear scan?",
      "mentalModelCorrection": "The false-prefix and true-suffix structure lets binary search locate the first accepted position without inspecting every earlier item.",
      "mistakeTypes": [
        "structure_signal_missed"
      ],
      "nextAction": "Name the boundary requested by the output contract before choosing the search strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "linear_only": "A monotonic false-prefix/true-suffix lets binary search skip the prefix safely.",
        "any_true": "The task asks for the first boundary, so the output contract matters."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-012-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Recognize a true-suffix boundary\", choose the strategy signal.",
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
        "nodeId": "monotonic_predicate_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "structure_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize a true-suffix boundary",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "monotonic_boundary_binary_search"
    ],
    "constraintSignal": "The predicate is false before one boundary and true from it onward.",
    "expectedApproachIds": [
      "monotonic_boundary_binary_search"
    ],
    "reasonSignal": "The monotonic suffix supports a first-true binary search.",
    "rejectedApproachIds": [
      "linear_scan_default"
    ],
    "instruction": "A sorted status list has outcomes false, false, true, true, true, and the task asks for the first accepted position. What should replace a linear scan?",
    "answerFeedback": "The false-prefix and true-suffix structure lets binary search locate the first accepted position without inspecting every earlier item.",
    "options": [
      {
        "id": "first_true_binary",
        "text": "Use binary search for the first true boundary because the predicate is monotonic.",
        "isCorrect": true
      },
      {
        "id": "linear_only",
        "text": "Use a linear scan because boundary tasks always require checking from the start.",
        "explanation": "A monotonic false-prefix/true-suffix lets binary search skip the prefix safely.",
        "isCorrect": false
      },
      {
        "id": "any_true",
        "text": "Return any true position because all true positions are equivalent.",
        "explanation": "The task asks for the first boundary, so the output contract matters.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the smallest integer x satisfying a condition, but no relationship between x and condition(x) is stated. What is the correct recognition step?",
      "mentalModelCorrection": "‘Smallest numeric answer’ describes the output, not a binary-search signal; feasibility must be monotonic first.",
      "mistakeTypes": [
        "state_model_misread"
      ],
      "nextAction": "Ask whether every larger candidate remains feasible after the first feasible candidate.",
      "result": "diagnostic",
      "distractorExplanations": {
        "smallest_means_binary": "An optimization target can be non-monotonic and may not expose a searchable boundary.",
        "numeric_always": "Integer order alone does not make condition(x) monotonic."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-013-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "For \"Keep numeric target reasoning separate\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Keep numeric target reasoning separate",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task asks for the smallest integer x satisfying a condition, but no relationship between x and condition(x) is stated. What is the correct recognition step?",
    "answerFeedback": "‘Smallest numeric answer’ describes the output, not a binary-search signal; feasibility must be monotonic first.",
    "options": [
      {
        "id": "prove_feasibility",
        "text": "First establish a monotonic feasibility predicate before considering binary search on x.",
        "isCorrect": true
      },
      {
        "id": "smallest_means_binary",
        "text": "Use binary search because the task asks for the smallest number.",
        "explanation": "An optimization target can be non-monotonic and may not expose a searchable boundary.",
        "isCorrect": false
      },
      {
        "id": "numeric_always",
        "text": "Use binary search because x ranges over integers.",
        "explanation": "Integer order alone does not make condition(x) monotonic.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Which case most clearly justifies a linear scan rather than binary search?",
      "mentalModelCorrection": "An arbitrary-order collection with one query and no monotonic predicate gives no safe way to eliminate a half.",
      "mistakeTypes": [
        "wrong_approach"
      ],
      "nextAction": "Select the strategy from the strongest available structure, not from the word search or target type.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorted_membership": "Sorted indexed membership is a direct classic binary-search signal.",
        "first_feasible": "A monotonic boundary is also a direct binary-search signal."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-014-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Identify the direct-scan case\", choose the strategy signal.",
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
    "title": "Identify the direct-scan case",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "No order or monotonicity links a midpoint result to either side.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Direct inspection is required when every position can still contain the target.",
    "rejectedApproachIds": [
      "classic_index_binary_search",
      "monotonic_boundary_binary_search"
    ],
    "instruction": "Which case most clearly justifies a linear scan rather than binary search?",
    "answerFeedback": "An arbitrary-order collection with one query and no monotonic predicate gives no safe way to eliminate a half.",
    "options": [
      {
        "id": "arbitrary_one_query",
        "text": "An arbitrary-order collection with one query and no monotonic predicate.",
        "isCorrect": true
      },
      {
        "id": "sorted_membership",
        "text": "A sorted indexed array with a target membership query.",
        "explanation": "Sorted indexed membership is a direct classic binary-search signal.",
        "isCorrect": false
      },
      {
        "id": "first_feasible",
        "text": "An ordered candidate domain with a false-prefix/true-suffix feasibility rule.",
        "explanation": "A monotonic boundary is also a direct binary-search signal.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Which statement correctly distinguishes classic lookup from binary search over an answer space?",
      "mentalModelCorrection": "Classic lookup relies on ordered stored values; answer-space search relies on monotonic feasibility over candidate answers.",
      "mistakeTypes": [
        "concept_boundary_confused"
      ],
      "nextAction": "Identify whether the midpoint is an input index or an answer candidate, then name the corresponding structure.",
      "result": "diagnostic",
      "distractorExplanations": {
        "same_signal": "The two variants use different structures even when both involve numeric comparisons.",
        "word_signal": "Prompt wording does not establish either stored order or feasibility monotonicity."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-015-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Contrast stored values with answer candidates\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "concept_boundary_confused",
        "role": "mistake_type"
      }
    ],
    "title": "Contrast stored values with answer candidates",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Which statement correctly distinguishes classic lookup from binary search over an answer space?",
    "answerFeedback": "Classic lookup relies on ordered stored values; answer-space search relies on monotonic feasibility over candidate answers.",
    "options": [
      {
        "id": "two_legal_signals",
        "text": "Stored order supports classic lookup; monotonic feasibility supports answer-space search.",
        "isCorrect": true
      },
      {
        "id": "same_signal",
        "text": "They are legal for the same reason: the target is numeric.",
        "explanation": "The two variants use different structures even when both involve numeric comparisons.",
        "isCorrect": false
      },
      {
        "id": "word_signal",
        "text": "They are legal whenever the prompt uses search terminology.",
        "explanation": "Prompt wording does not establish either stored order or feasibility monotonicity.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A code review contains a binary-search loop, but the input is arbitrary-order and the author cannot state what makes a discarded half impossible. What is the correct review outcome?",
      "mentalModelCorrection": "Without a stated order or monotonicity invariant, the binary-search loop is an unsupported optimization rather than a justified strategy.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Require the structural discard invariant or replace the strategy with direct inspection.",
      "result": "diagnostic",
      "distractorExplanations": {
        "loop_is_enough": "Halving bounds is only correct when the removed side is proven impossible.",
        "faster_is_enough": "An asymptotically smaller but invalid method cannot be accepted."
      }
    },
    "id": "alg-contrast-binary-linear-recognize-016-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Diagnose structure-free binary search\", choose the strategy signal.",
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
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose structure-free binary search",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A code review contains a binary-search loop, but the input is arbitrary-order and the author cannot state what makes a discarded half impossible. What is the correct review outcome?",
    "answerFeedback": "Without a stated order or monotonicity invariant, the binary-search loop is an unsupported optimization rather than a justified strategy.",
    "options": [
      {
        "id": "reject_unsupported_search",
        "text": "Reject the binary-search choice until a sorted or monotonic discard invariant is established.",
        "isCorrect": true
      },
      {
        "id": "loop_is_enough",
        "text": "Accept it because the loop halves its numeric bounds.",
        "explanation": "Halving bounds is only correct when the removed side is proven impossible.",
        "isCorrect": false
      },
      {
        "id": "faster_is_enough",
        "text": "Accept it because O(log n) is always preferable to O(n).",
        "explanation": "An asymptotically smaller but invalid method cannot be accepted.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
