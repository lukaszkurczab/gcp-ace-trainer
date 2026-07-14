import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeBinarySearchSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The input is a sorted ascending array, and the task asks whether a target value exists. Which signal supports binary search?",
      "mentalModelCorrection": "Sorted indexed order lets a mid comparison discard one half of the candidate indexes.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice naming the property that makes half-discarding valid.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_search_word": "The word search is not enough; sorted order is the actual binary-search signal.",
        "wrong_hash_only": "A hash set can solve membership too, but sorted indexed order gives a direct binary-search route."
      }
    },
    "id": "alg-binary-search-recognize-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the binary-search signal.",
    "roadmapNodeId": "binary_search",
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
    "title": "Recognize sorted indexed search",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "classic_index_binary_search"
    ],
    "constraintSignal": "The input is sorted and indexable, so comparisons identify impossible halves.",
    "expectedApproachIds": [
      "classic_index_binary_search"
    ],
    "reasonSignal": "Binary search is valid because sorted order supports half-discarding.",
    "rejectedApproachIds": [
      "linear_scan_default"
    ],
    "instruction": "The input is a sorted ascending array, and the task asks whether a target value exists. Which signal supports binary search?",
    "answerFeedback": "Sorted indexed order lets each comparison safely discard half of the remaining positions.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The array is sorted, so a mid comparison can discard half the indexes.",
        "isCorrect": true
      },
      {
        "id": "wrong_search_word",
        "text": "The task says search, so binary search is always valid.",
        "isCorrect": false
      },
      {
        "id": "wrong_hash_only",
        "text": "Binary search is invalid because membership tasks always require a hash set.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The input array is [7, 1, 5, 3], and the task asks whether 5 exists. Should classic binary search be used directly?",
      "mentalModelCorrection": "Classic binary search needs sorted order; an arbitrary unsorted array does not let mid eliminate a half.",
      "mistakeTypes": [
        "constraint_ignored",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice rejecting binary search when the required ordering precondition is absent.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_target_exists": "Even if the target exists, an unsorted mid comparison does not prove which half is impossible.",
        "wrong_numeric": "Numeric values alone do not create sorted order."
      }
    },
    "id": "alg-binary-search-recognize-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose whether direct binary search is valid.",
    "roadmapNodeId": "binary_search",
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
    "title": "Reject unsorted direct binary search",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "The input is unsorted, so mid comparison does not identify an impossible half.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Classic binary search is not legal without sorted indexed order.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "The input array is [7, 1, 5, 3], and the task asks whether 5 exists. Should classic binary search be used directly?",
    "answerFeedback": "No. The array is unsorted, so classic binary search cannot safely discard either half.",
    "options": [
      {
        "id": "expected_signal",
        "text": "No, because the array is not sorted.",
        "isCorrect": true
      },
      {
        "id": "wrong_target_exists",
        "text": "Yes, because the target is present in the array.",
        "isCorrect": false
      },
      {
        "id": "wrong_numeric",
        "text": "Yes, because all values are numbers.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A predicate over indexes has the shape false, false, false, true, true. What signal makes binary search valid?",
      "mentalModelCorrection": "A monotonic predicate creates one boundary where the answer changes from false to true.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice identifying monotonic boolean structure as a binary-search signal.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_any_boolean": "Boolean output alone is not enough; the predicate must be monotonic.",
        "wrong_sorted_values": "The input values themselves do not need to be sorted if the searched predicate over indexes is monotonic."
      }
    },
    "id": "alg-binary-search-recognize-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose the validity signal.",
    "roadmapNodeId": "binary_search",
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
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize monotonic predicate signal",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A predicate over indexes has the shape false, false, false, true, true. What signal makes binary search valid?",
    "answerFeedback": "The predicate is monotonic, so a mid result tells which side can be discarded.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The predicate is monotonic and has a single false-to-true boundary.",
        "isCorrect": true
      },
      {
        "id": "wrong_any_boolean",
        "text": "The predicate returns booleans, and all boolean predicates are binary-searchable.",
        "isCorrect": false
      },
      {
        "id": "wrong_sorted_values",
        "text": "The underlying values must be sorted, otherwise predicate search is impossible.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A task asks for the minimum capacity that allows all packages to ship within d days. Larger capacities never make shipping harder. Which binary-search signal is present?",
      "mentalModelCorrection": "A monotonic feasible/infeasible split over candidate answers supports binary search on answer.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice recognizing answer-space search when candidates become feasible in one direction.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_index": "The searched space is capacity values, not package indexes.",
        "wrong_sorted_input": "The packages do not need to be sorted if feasibility over capacity is monotonic."
      }
    },
    "id": "alg-binary-search-recognize-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the binary-search signal.",
    "roadmapNodeId": "binary_search",
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
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize answer-space feasibility signal",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "binary_search_on_answer"
    ],
    "constraintSignal": "Candidate answers have a monotonic feasible/infeasible split.",
    "expectedApproachIds": [
      "binary_search_on_answer"
    ],
    "reasonSignal": "Larger capacities preserve feasibility, so a mid capacity can discard one side.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "A task asks for the minimum capacity that allows all packages to ship within d days. Larger capacities never make shipping harder. Which binary-search signal is present?",
    "answerFeedback": "Candidate capacities form a monotonic answer space: too small fails, large enough works.",
    "options": [
      {
        "id": "expected_signal",
        "text": "A monotonic feasible/infeasible split over possible capacity values.",
        "isCorrect": true
      },
      {
        "id": "wrong_index",
        "text": "A sorted package index lookup.",
        "isCorrect": false
      },
      {
        "id": "wrong_sorted_input",
        "text": "A sorted input array signal.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner chooses binary search because the prompt contains the word search, but the input is unsorted and no monotonic predicate is defined. What mistake should you diagnose?",
      "mentalModelCorrection": "Binary search needs a discard rule from sorted order or monotonicity, not just the word search.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking the condition that makes half-discarding legal.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keyword": "Keyword matching is not a valid strategy-selection rule.",
        "wrong_always_search": "Search tasks can require linear scan, hashing, graph search, or other patterns."
      }
    },
    "id": "alg-binary-search-recognize-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the mistake diagnosis.",
    "roadmapNodeId": "binary_search",
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
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject search-keyword reasoning",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A learner chooses binary search because the prompt contains the word search, but the input is unsorted and no monotonic predicate is defined. What mistake should you diagnose?",
    "answerFeedback": "They selected binary search from wording instead of verifying sorted order or monotonicity.",
    "options": [
      {
        "id": "expected_signal",
        "text": "They used a keyword cue instead of verifying a legal half-discard condition.",
        "isCorrect": true
      },
      {
        "id": "wrong_keyword",
        "text": "They are correct because any prompt containing search implies binary search.",
        "isCorrect": false
      },
      {
        "id": "wrong_always_search",
        "text": "They only need to rename the function to binarySearch for the strategy to fit.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A score function over candidate x goes up, down, then up again. The task asks for an x with score(x) >= target. Is binary search on x justified?",
      "mentalModelCorrection": "A numeric candidate range is not enough; the predicate over x must be monotonic.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice rejecting answer search when feasibility can flip more than once.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_numeric": "Numbers can be ordered, but the pass/fail predicate still must be monotonic.",
        "wrong_threshold": "A threshold phrase does not help if the score relation is non-monotonic."
      }
    },
    "id": "alg-binary-search-recognize-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose whether binary search is justified.",
    "roadmapNodeId": "binary_search",
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
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject numeric non-monotonic answer search",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "The candidate predicate is non-monotonic, so a mid result cannot discard one side.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Binary search on answer requires a monotonic feasible/infeasible split.",
    "rejectedApproachIds": [
      "binary_search_on_answer"
    ],
    "instruction": "A score function over candidate x goes up, down, then up again. The task asks for an x with score(x) >= target. Is binary search on x justified?",
    "answerFeedback": "No. If the predicate can flip more than once, a mid result cannot identify one impossible side.",
    "options": [
      {
        "id": "expected_signal",
        "text": "No, because the predicate over x is not monotonic.",
        "isCorrect": true
      },
      {
        "id": "wrong_numeric",
        "text": "Yes, because x is numeric.",
        "isCorrect": false
      },
      {
        "id": "wrong_threshold",
        "text": "Yes, because every threshold condition is binary-searchable.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the first day when a cumulative total reaches at least target. The cumulative total never decreases. Which signal matters?",
      "mentalModelCorrection": "A nondecreasing cumulative value creates a monotonic predicate: total(day) >= target.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice translating cumulative monotonic data into first-true predicate search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_exact": "The value does not need to equal target exactly; the predicate total >= target is monotonic.",
        "wrong_unsorted_raw": "Daily increments may vary; the cumulative total is the monotonic object."
      }
    },
    "id": "alg-binary-search-recognize-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose the binary-search signal.",
    "roadmapNodeId": "binary_search",
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
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize cumulative first-true signal",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks for the first day when a cumulative total reaches at least target. The cumulative total never decreases. Which signal matters?",
    "answerFeedback": "The predicate total(day) >= target is false before the boundary and true after it.",
    "options": [
      {
        "id": "expected_signal",
        "text": "A monotonic first-true predicate over days.",
        "isCorrect": true
      },
      {
        "id": "wrong_exact",
        "text": "Binary search is valid only if some day equals target exactly.",
        "isCorrect": false
      },
      {
        "id": "wrong_unsorted_raw",
        "text": "Binary search is invalid because individual daily increments may be uneven.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A uses classic binary search on an unsorted array. Plan B first sorts the array, then binary-searches several membership queries. Which comparison is relevant?",
      "mentalModelCorrection": "Sorting can create the binary-search precondition, but its preprocessing cost must be justified by the query workload.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice separating direct legality from legality after preprocessing.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_direct": "Direct binary search on the unsorted original array is not legal.",
        "wrong_free_sort": "Sorting is not free; it changes the total cost and may also affect order-sensitive tasks."
      }
    },
    "id": "alg-binary-search-recognize-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the relevant comparison.",
    "roadmapNodeId": "binary_search",
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
    "title": "Distinguish direct and after-sort legality",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Plan A uses classic binary search on an unsorted array. Plan B first sorts the array, then binary-searches several membership queries. Which comparison is relevant?",
    "answerFeedback": "Sorting can make binary search legal for order-insensitive membership queries, but preprocessing cost must be counted.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Plan B may be valid after sorting, but the sort cost must be included and the task must tolerate reordering.",
        "isCorrect": true
      },
      {
        "id": "wrong_direct",
        "text": "Plan A is valid because binary search can be used before sorting.",
        "isCorrect": false
      },
      {
        "id": "wrong_free_sort",
        "text": "Plan B is always O(log n) total because sorting only prepares the input.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task asks whether any pair in an unsorted array sums to target. A learner suggests binary search directly on the original array. What is wrong?",
      "mentalModelCorrection": "Binary search needs an ordered search space; unsorted pair existence does not provide a direct mid-discard rule.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice rejecting binary search when the searched structure is not ordered or monotonic.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_pair_numeric": "Numeric pair sums do not automatically form a searchable monotonic space.",
        "wrong_target": "Having a target value does not create sorted order or a monotonic predicate."
      }
    },
    "id": "alg-binary-search-recognize-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose what is wrong.",
    "roadmapNodeId": "binary_search",
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
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Reject direct binary search for unsorted pair sum",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "The task asks whether any pair in an unsorted array sums to target. A learner suggests binary search directly on the original array. What is wrong?",
    "answerFeedback": "The original array is unsorted and the pair condition does not give a direct half-discard rule.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The searched space is not ordered or monotonic, so direct binary search is not justified.",
        "isCorrect": true
      },
      {
        "id": "wrong_pair_numeric",
        "text": "Binary search is valid because pair sums are numeric.",
        "isCorrect": false
      },
      {
        "id": "wrong_target",
        "text": "Binary search is valid because the prompt gives a target value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the smallest x such that canBuild(x) is true. For every larger x, canBuild is also true. Which strategy family fits?",
      "mentalModelCorrection": "This is a first-feasible boundary over answer values.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice recognizing minimize-feasible answer search from monotonic feasibility.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_classic": "There is no stored target value at a middle index.",
        "wrong_no_binary": "A monotonic feasible split is exactly what answer-space binary search needs."
      }
    },
    "id": "alg-binary-search-recognize-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the strategy family.",
    "roadmapNodeId": "binary_search",
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
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize minimize-feasible answer search",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "binary_search_on_answer"
    ],
    "constraintSignal": "The task asks for the smallest answer value satisfying a monotonic predicate.",
    "expectedApproachIds": [
      "binary_search_on_answer"
    ],
    "reasonSignal": "The feasible region is false-then-true over candidate answers.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "A task asks for the smallest x such that canBuild(x) is true. For every larger x, canBuild is also true. Which strategy family fits?",
    "answerFeedback": "Search candidate x values and find the first feasible one.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Binary search on answer over a monotonic feasible predicate.",
        "isCorrect": true
      },
      {
        "id": "wrong_classic",
        "text": "Classic index search for nums[mid] === x.",
        "isCorrect": false
      },
      {
        "id": "wrong_no_binary",
        "text": "Binary search cannot apply because there is no sorted input array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the maximum x such that canPlace(x) is true. As x grows, canPlace eventually becomes false and stays false. Which signal is present?",
      "mentalModelCorrection": "A true-then-false monotonic predicate supports searching for the last true answer.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice recognizing maximize-feasible search as a monotonic boundary problem.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_first_true": "The useful boundary is not first true; true starts at the low side.",
        "wrong_nonmonotonic": "The prompt says once false, it stays false, which is monotonic."
      }
    },
    "id": "alg-binary-search-recognize-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_candidate_model",
    "prompt": "Choose the signal.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "binary_search_answer_candidate_model",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize maximize-feasible answer search",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks for the maximum x such that canPlace(x) is true. As x grows, canPlace eventually becomes false and stays false. Which signal is present?",
    "answerFeedback": "This is a monotonic true-then-false predicate; search for the last true x.",
    "options": [
      {
        "id": "expected_signal",
        "text": "A last-true boundary over candidate answer values.",
        "isCorrect": true
      },
      {
        "id": "wrong_first_true",
        "text": "A first-true boundary over candidate answer values.",
        "isCorrect": false
      },
      {
        "id": "wrong_nonmonotonic",
        "text": "No binary-search signal, because the predicate changes from true to false.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A sorted array is searched for the first index where nums[i] >= target. Which binary-search family should be recognized?",
      "mentalModelCorrection": "The sorted array creates a boundary query, not a simple any-match lookup.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "edge_case_missed"
      ],
      "nextAction": "Practice distinguishing classic lookup from boundary search when the output asks for first valid index.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_classic": "Classic any-match search can stop at a valid equal index but not necessarily the first boundary.",
        "wrong_answer_space": "The search space is still array indexes, not arbitrary answer values."
      }
    },
    "id": "alg-binary-search-recognize-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "Choose the recognized family.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "lower_bound_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lower_upper_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize boundary search signal",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "lower_bound_binary_search"
    ],
    "constraintSignal": "The output asks for the first index satisfying a sorted-order boundary condition.",
    "expectedApproachIds": [
      "lower_bound_binary_search"
    ],
    "reasonSignal": "The searched property is a boundary over sorted indexes.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "A sorted array is searched for the first index where nums[i] >= target. Which binary-search family should be recognized?",
    "answerFeedback": "This is lower_bound / boundary search over sorted indexes.",
    "options": [
      {
        "id": "expected_signal",
        "text": "lower_bound / boundary binary search.",
        "isCorrect": true
      },
      {
        "id": "wrong_classic",
        "text": "classic binary search that returns any equal match.",
        "isCorrect": false
      },
      {
        "id": "wrong_answer_space",
        "text": "binary search on answer over a feasibility check.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A prompt gives values [1, 4, 9, 16, 25] and asks for the first value greater than 10. Why can binary search help?",
      "mentalModelCorrection": "The sorted order makes the predicate nums[i] > 10 false-then-true over indexes.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice converting sorted comparisons into monotonic index predicates.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_exact": "Binary search can find boundaries, not only exact values.",
        "wrong_unsorted": "The values are sorted, which is the key signal."
      }
    },
    "id": "alg-binary-search-recognize-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "upper_bound_contract",
    "prompt": "Choose why binary search can help.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "upper_bound_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lower_upper_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize sorted boundary predicate",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A prompt gives values [1, 4, 9, 16, 25] and asks for the first value greater than 10. Why can binary search help?",
    "answerFeedback": "The predicate nums[i] > 10 becomes false, false, false, true, true.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Sorted order creates a monotonic false-then-true boundary.",
        "isCorrect": true
      },
      {
        "id": "wrong_exact",
        "text": "Binary search cannot help because 10 is not stored exactly.",
        "isCorrect": false
      },
      {
        "id": "wrong_unsorted",
        "text": "Binary search helps because the numbers are positive, not because they are sorted.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner wants to binary-search the answer because the final answer is an integer. They cannot define a predicate that is false-then-true or true-then-false. What should the review say?",
      "mentalModelCorrection": "Integer answer space alone is not enough; a monotonic decision rule is required.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice requiring a monotonic feasibility check before answer-space binary search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_integer": "Many integer optimization problems are not binary-searchable without monotonicity.",
        "wrong_loop_first": "Writing the loop first hides the missing predicate problem."
      }
    },
    "id": "alg-binary-search-recognize-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the review feedback.",
    "roadmapNodeId": "binary_search",
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
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject integer-only answer-search signal",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A learner wants to binary-search the answer because the final answer is an integer. They cannot define a predicate that is false-then-true or true-then-false. What should the review say?",
    "answerFeedback": "Reject answer-search until a monotonic predicate over candidate answers is defined.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Do not choose binary search on answer without a monotonic predicate.",
        "isCorrect": true
      },
      {
        "id": "wrong_integer",
        "text": "Proceed because integer answers are always binary-searchable.",
        "isCorrect": false
      },
      {
        "id": "wrong_loop_first",
        "text": "Write the binary search loop first and discover the predicate later.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A says: binary search because the input is sorted. Plan B says: binary search because each comparison tells which half cannot contain the target. Which explanation is stronger?",
      "mentalModelCorrection": "Sorted input is the precondition, but the decisive reasoning is that comparisons identify an impossible half.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice explaining why the precondition enables the operation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_precondition_only": "Sorted input is important, but the explanation should connect it to half-discarding.",
        "wrong_variable": "Using left/right/mid variables does not prove binary search is valid."
      }
    },
    "id": "alg-binary-search-recognize-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "Choose the stronger explanation.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Explain signal through discard rule",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Plan A says: binary search because the input is sorted. Plan B says: binary search because each comparison tells which half cannot contain the target. Which explanation is stronger?",
    "answerFeedback": "Plan B connects the precondition to the discard rule, which is the core binary-search reasoning.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Plan B, because it explains how sorted order enables safe half-discarding.",
        "isCorrect": true
      },
      {
        "id": "wrong_precondition_only",
        "text": "Plan A, because naming sorted input is always a complete explanation.",
        "isCorrect": false
      },
      {
        "id": "wrong_variable",
        "text": "Neither; binary search is justified only by using variables named left, right, and mid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A rotated sorted array is not globally sorted, but one half around mid is sorted on each step. Is this still a possible binary-search family?",
      "mentalModelCorrection": "Rotated search can be binary-searchable because each step can identify a sorted half and decide whether target can be there.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice recognizing partial-order binary search separately from classic globally sorted search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_global_only": "Global sorted order is not the only binary-search signal; a reliable discard rule can still exist.",
        "wrong_always": "Rotation alone is not enough; the algorithm must identify which half remains searchable."
      }
    },
    "id": "alg-binary-search-recognize-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_sorted_half_detection",
    "prompt": "Choose whether binary search can fit.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "rotated_array_sorted_half_detection",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize rotated-array discard signal",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A rotated sorted array is not globally sorted, but one half around mid is sorted on each step. Is this still a possible binary-search family?",
    "answerFeedback": "Yes, if each step can identify a sorted half and discard the half that cannot contain target.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Yes, if the sorted half can be identified and used for safe half-discarding.",
        "isCorrect": true
      },
      {
        "id": "wrong_global_only",
        "text": "No, binary search only works on fully sorted arrays and never on rotated arrays.",
        "isCorrect": false
      },
      {
        "id": "wrong_always",
        "text": "Yes, any rotated array can be searched with normal classic binary search without extra reasoning.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the cheapest item in an arbitrary unsorted list under a custom scoring function. The score has no monotonic relationship to index or price. Should binary search be selected?",
      "mentalModelCorrection": "Without sorted order or a monotonic predicate, binary search has no valid half-discard rule.",
      "mistakeTypes": [
        "constraint_ignored",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice rejecting binary search for arbitrary optimization without monotonic structure.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_optimization": "Optimization wording does not imply answer-space binary search.",
        "wrong_price": "Numeric prices do not create monotonicity under an arbitrary custom score."
      }
    },
    "id": "alg-binary-search-recognize-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose whether binary search should be selected.",
    "roadmapNodeId": "binary_search",
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
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject arbitrary unsorted optimization",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "No sorted order or monotonic predicate is present.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Binary search has no legal half-discard rule in this task.",
    "rejectedApproachIds": [
      "classic_index_binary_search",
      "binary_search_on_answer"
    ],
    "instruction": "A task asks for the cheapest item in an arbitrary unsorted list under a custom scoring function. The score has no monotonic relationship to index or price. Should binary search be selected?",
    "answerFeedback": "No. There is no sorted order or monotonic predicate that would justify discarding half.",
    "options": [
      {
        "id": "expected_signal",
        "text": "No, because there is no ordered or monotonic structure to search.",
        "isCorrect": true
      },
      {
        "id": "wrong_optimization",
        "text": "Yes, because optimization tasks should use binary search.",
        "isCorrect": false
      },
      {
        "id": "wrong_price",
        "text": "Yes, because prices are numeric.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the checks for deciding whether binary search is a valid strategy.",
      "mentalModelCorrection": "Binary search is selected only after identifying a searchable ordered range and a valid half-discard rule.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "constraint_ignored"
      ],
      "nextAction": "Practice verifying legality before choosing a binary-search template.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-recognize-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Tap the validity checks in order.",
    "roadmapNodeId": "binary_search",
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
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order binary-search validity checks",
    "trackId": "algorithms",
    "type": "subgoal_ordering",
    "instruction": "Order the checks for deciding whether binary search is a valid strategy.",
    "answerFeedback": "First identify what is being searched, then verify sorted/monotonic structure, define what mid tells you, confirm a half can be discarded, and only then choose the variant.",
    "subgoals": [
      {
        "id": "identify_search_space",
        "text": "Identify what the search space is: indexes, predicate positions, or answer values."
      },
      {
        "id": "check_order_or_monotonicity",
        "text": "Check for sorted order, a monotonic predicate, or monotonic feasibility."
      },
      {
        "id": "define_mid_signal",
        "text": "Define what information checking mid provides."
      },
      {
        "id": "verify_half_discard",
        "text": "Verify that the mid result safely discards one side."
      },
      {
        "id": "choose_variant",
        "text": "Choose classic search, boundary search, predicate search, rotated search, or answer search."
      }
    ],
    "correctOrder": [
      "identify_search_space",
      "check_order_or_monotonicity",
      "define_mid_signal",
      "verify_half_discard",
      "choose_variant"
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
