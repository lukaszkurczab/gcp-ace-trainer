import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const binarySearchOnAnswerQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The array is not searched for a stored value. Instead, the task asks for the smallest capacity that makes a schedule possible. What should be searched?",
      "mentalModelCorrection": "Binary search on answer searches candidate answer values, not array indexes.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming the candidate answer before writing boundary updates.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_index": "There is no target stored at an index; the searchable space is possible capacities.",
        "wrong_linear_scan": "Trying every capacity may work conceptually, but binary search can reduce the answer-space search if feasibility is monotonic."
      }
    },
    "id": "alg-binary-search-answer-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_candidate_model",
    "prompt": "Choose the correct search space.",
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
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize answer-space search",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "binary_search_on_answer"
    ],
    "constraintSignal": "The task asks for the smallest value that makes a condition possible.",
    "expectedApproachIds": [
      "binary_search_on_answer"
    ],
    "reasonSignal": "Search candidate answer values instead of array indexes.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "The array is not searched for a stored value. Instead, the task asks for the smallest capacity that makes a schedule possible. What should be searched?",
    "answerFeedback": "The search space is candidate answer values, such as possible capacities.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Search possible answer values, such as candidate capacities.",
        "isCorrect": true
      },
      {
        "id": "wrong_index",
        "text": "Search array indexes because all binary search must compare nums[mid].",
        "isCorrect": false
      },
      {
        "id": "wrong_linear_scan",
        "text": "Try every possible capacity one by one because the input array is not sorted.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A task asks for the minimum eating speed that finishes all piles within h hours. What is the candidate answer?",
      "mentalModelCorrection": "For binary search on answer, mid represents a proposed answer value, not an input index.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice stating what mid means before defining the feasibility check.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_pile_index": "The candidate is not which pile to inspect; it is a possible speed.",
        "wrong_hour_index": "h is a constraint for feasibility, not the searched index."
      }
    },
    "id": "alg-binary-search-answer-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_candidate_model",
    "prompt": "Choose what mid should represent.",
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
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Define candidate speed",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks for the minimum eating speed that finishes all piles within h hours. What is the candidate answer?",
    "answerFeedback": "The candidate answer is a speed value. The feasibility check asks whether that speed finishes within h hours.",
    "options": [
      {
        "id": "expected_signal",
        "text": "A proposed eating speed.",
        "isCorrect": true
      },
      {
        "id": "wrong_pile_index",
        "text": "The index of the middle pile.",
        "isCorrect": false
      },
      {
        "id": "wrong_hour_index",
        "text": "The index of the current hour.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A candidate capacity is tested by simulating whether all packages can ship within d days. What role does this simulation play?",
      "mentalModelCorrection": "The simulation is the feasibility check for a proposed answer.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice separating candidate generation from feasibility testing.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_sorting": "The check does not sort the input; it tests whether one candidate answer works.",
        "wrong_final_answer": "A single feasible candidate is not automatically the minimum feasible candidate."
      }
    },
    "id": "alg-binary-search-answer-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the role of the simulation.",
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
    "title": "Recognize feasibility check",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A candidate capacity is tested by simulating whether all packages can ship within d days. What role does this simulation play?",
    "answerFeedback": "The simulation is the feasibility predicate: canShip(capacity).",
    "options": [
      {
        "id": "expected_signal",
        "text": "It is the feasibility check for the proposed capacity.",
        "isCorrect": true
      },
      {
        "id": "wrong_sorting",
        "text": "It sorts packages so classic binary search can compare indexes.",
        "isCorrect": false
      },
      {
        "id": "wrong_final_answer",
        "text": "It proves the first feasible capacity is the final answer without searching lower values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "You are minimizing a feasible capacity. canShip(mid) is true. Which boundary update preserves the chance to find a smaller feasible answer?",
      "mentalModelCorrection": "If mid is feasible while minimizing, keep mid as a candidate and search the lower half.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice linking predicate result to the optimization direction.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_go_right": "Going right searches larger feasible values and can skip the minimum.",
        "wrong_discard_mid": "If mid is feasible, discarding it with right = mid - 1 can be valid only in a different inclusive template with saved answer; the key reasoning is to keep a feasible candidate."
      }
    },
    "id": "alg-binary-search-answer-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_update_direction",
    "prompt": "Choose the update for minimizing a feasible answer.",
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
        "nodeId": "binary_search_answer_update_direction",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Update bounds after feasible mid",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "You are minimizing a feasible capacity. canShip(mid) is true. Which boundary update preserves the chance to find a smaller feasible answer?",
    "answerFeedback": "For a lower-bound style template, use right = mid when mid is feasible.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Move right to mid, because mid works and smaller values may also work.",
        "isCorrect": true
      },
      {
        "id": "wrong_go_right",
        "text": "Move left to mid + 1, because feasible means you should search larger answers.",
        "isCorrect": false
      },
      {
        "id": "wrong_discard_mid",
        "text": "Throw away mid without recording it, because any feasible value is too large.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "You are minimizing a feasible speed. canFinish(mid) is false. Which boundary update is forced?",
      "mentalModelCorrection": "If the candidate is too small and infeasible, all smaller values are also infeasible under a monotonic feasibility predicate.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice discarding the infeasible side from the monotonic answer space.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left_side": "Searching smaller values after an infeasible speed cannot produce a feasible speed.",
        "wrong_keep_mid": "An infeasible mid cannot be the minimum feasible answer."
      }
    },
    "id": "alg-binary-search-answer-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_update_direction",
    "prompt": "Choose the update after an infeasible mid.",
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
        "nodeId": "binary_search_answer_update_direction",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Update bounds after infeasible mid",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "You are minimizing a feasible speed. canFinish(mid) is false. Which boundary update is forced?",
    "answerFeedback": "If mid is too small, move left to mid + 1.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Move left to mid + 1, because mid and smaller speeds cannot work.",
        "isCorrect": true
      },
      {
        "id": "wrong_left_side",
        "text": "Move right to mid, because smaller speeds should be tested next.",
        "isCorrect": false
      },
      {
        "id": "wrong_keep_mid",
        "text": "Return mid because false means the candidate is near the boundary.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "You are maximizing a feasible length. canCut(mid) is true. Which direction should the search move?",
      "mentalModelCorrection": "When maximizing, a feasible mid means you should try larger candidates while remembering that mid works.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice distinguishing minimize-feasible from maximize-feasible updates.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_minimize": "Moving right down is the minimization pattern, not the maximization pattern.",
        "wrong_return": "One feasible candidate is not automatically the maximum feasible candidate."
      }
    },
    "id": "alg-binary-search-answer-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_update_direction",
    "prompt": "Choose the maximizing update direction.",
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
        "nodeId": "binary_search_answer_update_direction",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Update bounds for maximizing feasible answer",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "You are maximizing a feasible length. canCut(mid) is true. Which direction should the search move?",
    "answerFeedback": "If mid works and you want the maximum feasible value, search larger values.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Move left upward to try larger lengths, while preserving mid as feasible.",
        "isCorrect": true
      },
      {
        "id": "wrong_minimize",
        "text": "Move right downward because feasible always means go left.",
        "isCorrect": false
      },
      {
        "id": "wrong_return",
        "text": "Return mid immediately because a feasible value has been found.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A proposed answer predicate produces true, false, true, false as the candidate grows. What should you conclude?",
      "mentalModelCorrection": "Binary search on answer requires a monotonic split, not alternating feasibility.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice verifying monotonicity before choosing binary search on answer.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_binary_anyway": "Without monotonicity, a mid result does not tell which half can be discarded.",
        "wrong_sort_answers": "Sorting candidate values does not fix a non-monotonic predicate."
      }
    },
    "id": "alg-binary-search-answer-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the correct conclusion.",
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
    "title": "Reject non-monotonic feasibility",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "The predicate does not split answer candidates into one monotonic false/true region.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Binary search cannot discard a half when feasibility alternates.",
    "rejectedApproachIds": [
      "binary_search_on_answer"
    ],
    "instruction": "A proposed answer predicate produces true, false, true, false as the candidate grows. What should you conclude?",
    "answerFeedback": "The predicate is not monotonic, so binary search on answer is not justified.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Reject binary search on answer because feasibility is not monotonic.",
        "isCorrect": true
      },
      {
        "id": "wrong_binary_anyway",
        "text": "Use binary search anyway because the candidates are numeric.",
        "isCorrect": false
      },
      {
        "id": "wrong_sort_answers",
        "text": "Sort the answers first so the predicate becomes monotonic.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A teammate says the answer-search solution is O(log R) because binary search has O(log R) iterations. What correction should you make?",
      "mentalModelCorrection": "The feasibility check is part of each iteration and must be included.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice including checkCost in binary search on answer.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_iterations_only": "O(log R) counts only candidates tested, not the work to test each candidate.",
        "wrong_index_search": "Classic index binary search may have O(log n) comparisons, but answer search often has a non-constant predicate."
      }
    },
    "id": "alg-binary-search-answer-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Choose the correction.",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Correct missing check-cost claim",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A teammate says the answer-search solution is O(log R) because binary search has O(log R) iterations. What correction should you make?",
    "answerFeedback": "The full time is O(log R * checkCost), not just O(log R).",
    "options": [
      {
        "id": "expected_signal",
        "text": "Include the feasibility-check cost: total time is O(log R * checkCost).",
        "isCorrect": true
      },
      {
        "id": "wrong_iterations_only",
        "text": "Agree that O(log R) is complete because only the number of mids matters.",
        "isCorrect": false
      },
      {
        "id": "wrong_index_search",
        "text": "Replace R with n because all binary search complexity must be O(log n).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "For shipping packages within d days, what are good initial bounds for the minimum feasible capacity?",
      "mentalModelCorrection": "The capacity must be at least the heaviest package and at most the sum of all packages.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice deriving answer-space bounds from the problem constraints.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_zero": "Capacity below the heaviest package cannot ship that package.",
        "wrong_n": "The number of packages is not a capacity bound."
      }
    },
    "id": "alg-binary-search-answer-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_bounds",
    "prompt": "Choose the answer-space bounds.",
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
        "nodeId": "binary_search_answer_bounds",
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
    "title": "Derive capacity search bounds",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "For shipping packages within d days, what are good initial bounds for the minimum feasible capacity?",
    "answerFeedback": "Use low = maxWeight and high = totalWeight.",
    "options": [
      {
        "id": "expected_signal",
        "text": "low = heaviest package, high = sum of all package weights.",
        "isCorrect": true
      },
      {
        "id": "wrong_zero",
        "text": "low = 0, high = heaviest package.",
        "isCorrect": false
      },
      {
        "id": "wrong_n",
        "text": "low = 0, high = number of packages.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A problem asks for the minimum possible largest subarray sum after splitting an array into k parts. What is the searched answer?",
      "mentalModelCorrection": "The searched value is a limit on the largest part sum, not a split index.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice translating optimization wording into a candidate answer variable.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_split_index": "The split positions are not the binary-searched value.",
        "wrong_array_mid": "The middle input value is not the candidate largest allowed sum."
      }
    },
    "id": "alg-binary-search-answer-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_candidate_model",
    "prompt": "Choose the searched answer.",
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
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Define largest-sum candidate",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A problem asks for the minimum possible largest subarray sum after splitting an array into k parts. What is the searched answer?",
    "answerFeedback": "Search the candidate maximum allowed subarray sum.",
    "options": [
      {
        "id": "expected_signal",
        "text": "A candidate value for the largest allowed subarray sum.",
        "isCorrect": true
      },
      {
        "id": "wrong_split_index",
        "text": "The index where the first split should be placed.",
        "isCorrect": false
      },
      {
        "id": "wrong_array_mid",
        "text": "The middle element of the input array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "For a candidate largest subarray sum X, the check greedily counts how many parts are needed if no part may exceed X. What makes this predicate monotonic?",
      "mentalModelCorrection": "Increasing X cannot require more parts, so feasibility changes in one direction.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice explaining why a feasibility check forms a monotonic split.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_random": "The number of needed parts is not arbitrary as X increases.",
        "wrong_index_order": "Monotonicity comes from the candidate limit, not from sorted input values."
      }
    },
    "id": "alg-binary-search-answer-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the monotonicity explanation.",
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
    "title": "Explain monotonic largest-sum check",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "For a candidate largest subarray sum X, the check greedily counts how many parts are needed if no part may exceed X. What makes this predicate monotonic?",
    "answerFeedback": "Larger X makes the constraint looser, so feasibility cannot flip from true back to false.",
    "options": [
      {
        "id": "expected_signal",
        "text": "As X increases, the limit becomes looser, so a feasible X stays feasible for larger X.",
        "isCorrect": true
      },
      {
        "id": "wrong_random",
        "text": "The check is monotonic because greedy algorithms are always monotonic.",
        "isCorrect": false
      },
      {
        "id": "wrong_index_order",
        "text": "The check is monotonic only if the input array is sorted.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the maximum minimum distance between placed items. A check says whether distance mid is achievable. If achievable, what should happen?",
      "mentalModelCorrection": "For maximum feasible answer, a true predicate means try a larger distance.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice recognizing maximize-feasible answer search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_minimize": "Moving smaller is the minimize-feasible pattern.",
        "wrong_return": "One achievable distance does not prove it is the maximum achievable distance."
      }
    },
    "id": "alg-binary-search-answer-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_update_direction",
    "prompt": "Choose the update direction.",
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
        "nodeId": "binary_search_answer_update_direction",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Maximize feasible distance",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A task asks for the maximum minimum distance between placed items. A check says whether distance mid is achievable. If achievable, what should happen?",
    "answerFeedback": "If mid is achievable and the goal is maximum distance, search larger distances.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Keep mid as feasible and try larger distances.",
        "isCorrect": true
      },
      {
        "id": "wrong_minimize",
        "text": "Move to smaller distances because feasible means the answer is too high.",
        "isCorrect": false
      },
      {
        "id": "wrong_return",
        "text": "Return mid immediately because any feasible distance is good enough.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A tries every possible answer from low to high and runs a check each time. Plan B binary-searches the answer range and runs the same check. Which comparison matters?",
      "mentalModelCorrection": "Binary search reduces the number of checked candidates from R to log R when the predicate is monotonic.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice comparing linear answer scanning with logarithmic answer search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_same": "Both use the same check, but they call it a different number of times.",
        "wrong_classic": "The improvement is not from searching array indexes; it is from reducing candidate answer checks."
      }
    },
    "id": "alg-binary-search-answer-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Choose the decisive comparison.",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Compare answer scan with answer binary search",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Plan A tries every possible answer from low to high and runs a check each time. Plan B binary-searches the answer range and runs the same check. Which comparison matters?",
    "answerFeedback": "The binary-search plan calls the check O(log R) times instead of O(R) times.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Plan B reduces check calls from O(R) to O(log R) if the predicate is monotonic.",
        "isCorrect": true
      },
      {
        "id": "wrong_same",
        "text": "The plans are equivalent because both use the same feasibility check.",
        "isCorrect": false
      },
      {
        "id": "wrong_classic",
        "text": "Plan B is valid only if the input array itself is sorted.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A problem asks for the exact candidate value where score(candidate) equals target. The score goes up and down as candidate increases. Is binary search on answer justified?",
      "mentalModelCorrection": "Binary search needs a monotonic direction; exact equality against a non-monotonic score does not provide one.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice rejecting answer search when mid does not tell which side to discard.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_numeric": "Numeric candidates are not enough; the predicate must be monotonic.",
        "wrong_exact": "Exact target wording does not create a monotonic feasible/infeasible split."
      }
    },
    "id": "alg-binary-search-answer-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose whether answer search is justified.",
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
    "title": "Reject exact non-monotonic answer search",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "The score is non-monotonic as the candidate answer changes.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "A non-monotonic score does not let binary search discard one side.",
    "rejectedApproachIds": [
      "binary_search_on_answer"
    ],
    "instruction": "A problem asks for the exact candidate value where score(candidate) equals target. The score goes up and down as candidate increases. Is binary search on answer justified?",
    "answerFeedback": "No. If the score is non-monotonic, a mid result does not identify the half to discard.",
    "options": [
      {
        "id": "expected_signal",
        "text": "No, because the candidate-to-score relationship is not monotonic.",
        "isCorrect": true
      },
      {
        "id": "wrong_numeric",
        "text": "Yes, because the candidate values are numeric.",
        "isCorrect": false
      },
      {
        "id": "wrong_exact",
        "text": "Yes, because binary search is best for exact target values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "You are minimizing the first feasible answer over candidates that look like false false false true true. Where should the final answer be after a lower-bound style loop?",
      "mentalModelCorrection": "For first feasible search, the boundary variable left converges to the first true candidate.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice connecting lower-bound convergence to answer search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_mid": "mid is only the last tested candidate, not necessarily the boundary after convergence.",
        "wrong_right_plus": "The returned boundary depends on the template; for lower-bound style, left is the first feasible candidate."
      }
    },
    "id": "alg-binary-search-answer-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_candidate_model",
    "prompt": "Choose the final answer location.",
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Return first feasible answer",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "You are minimizing the first feasible answer over candidates that look like false false false true true. Where should the final answer be after a lower-bound style loop?",
    "answerFeedback": "The boundary converges to the first true candidate.",
    "options": [
      {
        "id": "expected_signal",
        "text": "At left, the first feasible candidate.",
        "isCorrect": true
      },
      {
        "id": "wrong_mid",
        "text": "At the last computed mid, because mid is always the answer.",
        "isCorrect": false
      },
      {
        "id": "wrong_right_plus",
        "text": "At right + 1 regardless of the loop template.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Classic binary search compares nums[mid] to target. Binary search on answer calls feasible(mid). What is the key difference?",
      "mentalModelCorrection": "Answer search uses mid as a candidate solution and asks whether that solution satisfies a monotonic condition.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice distinguishing index lookup from answer-space optimization.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_same": "Both halve a range, but they compare different things.",
        "wrong_sorted_array": "Answer search does not require the input array itself to be sorted; it requires monotonic feasibility over answers."
      }
    },
    "id": "alg-binary-search-answer-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_candidate_model",
    "prompt": "Choose the key difference.",
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
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Contrast index search with answer search",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Classic binary search compares nums[mid] to target. Binary search on answer calls feasible(mid). What is the key difference?",
    "answerFeedback": "In answer search, mid is a candidate answer, and feasible(mid) decides which side to discard.",
    "options": [
      {
        "id": "expected_signal",
        "text": "mid represents a candidate answer, not an index value to match against target.",
        "isCorrect": true
      },
      {
        "id": "wrong_same",
        "text": "There is no difference; every binary search compares nums[mid] with target.",
        "isCorrect": false
      },
      {
        "id": "wrong_sorted_array",
        "text": "Answer search is valid only when the input array is sorted.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A feasibility check for speed mid returns true when the work can be finished in time. If speed mid works, what can you infer about larger speeds?",
      "mentalModelCorrection": "For speed-based feasibility, larger speeds are at least as capable as mid.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice stating the monotonic direction before updating bounds.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_smaller": "Smaller speeds may fail; larger speeds preserve or improve feasibility.",
        "wrong_unknown": "The task gives the monotonic relationship: faster speed cannot make completion harder."
      }
    },
    "id": "alg-binary-search-answer-019-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the monotonic inference.",
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
    "title": "Infer monotonic direction for speed",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A feasibility check for speed mid returns true when the work can be finished in time. If speed mid works, what can you infer about larger speeds?",
    "answerFeedback": "All larger speeds also work under this predicate.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Larger speeds should also be feasible.",
        "isCorrect": true
      },
      {
        "id": "wrong_smaller",
        "text": "Only smaller speeds are guaranteed feasible.",
        "isCorrect": false
      },
      {
        "id": "wrong_unknown",
        "text": "Nothing can be inferred, so binary search cannot update either side.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the steps for designing a binary-search-on-answer solution.",
      "mentalModelCorrection": "Define the candidate answer, prove monotonic feasibility, choose bounds, then binary search using the predicate.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice designing answer search before writing boundary code.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-answer-020-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_answer_candidate_model",
    "prompt": "Tap the design steps in order.",
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order answer-search design steps",
    "trackId": "algorithms",
    "type": "subgoal_ordering",
    "instruction": "Order the steps for designing a binary-search-on-answer solution.",
    "answerFeedback": "Answer search starts with what mid means, then feasibility, monotonicity, bounds, and only then the loop.",
    "subgoals": [
      {
        "id": "define_candidate",
        "text": "Define what candidate answer mid represents."
      },
      {
        "id": "define_predicate",
        "text": "Define feasible(mid)."
      },
      {
        "id": "prove_monotonicity",
        "text": "Check that feasibility changes monotonically."
      },
      {
        "id": "choose_bounds",
        "text": "Choose low and high from valid answer limits."
      },
      {
        "id": "run_binary_search",
        "text": "Run binary search using the predicate result."
      }
    ],
    "correctOrder": [
      "define_candidate",
      "define_predicate",
      "prove_monotonicity",
      "choose_bounds",
      "run_binary_search"
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A feasibility check itself sorts n items before testing mid. The answer range has size R. What cost warning should you give?",
      "mentalModelCorrection": "The check cost may dominate each iteration; binary search does not make the check free.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice auditing the feasibility check before accepting the final complexity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_log_only": "O(log R) ignores the sort inside each check.",
        "wrong_sort_once": "The prompt says the check sorts inside each candidate test; that repeats unless moved out safely."
      }
    },
    "id": "alg-binary-search-answer-021-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Choose the cost warning.",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "binary_search_on_answer",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Audit expensive feasibility check",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A feasibility check itself sorts n items before testing mid. The answer range has size R. What cost warning should you give?",
    "answerFeedback": "If sorting happens inside each check, the total can be O(log R * n log n).",
    "options": [
      {
        "id": "expected_signal",
        "text": "The total includes repeated check cost, so sorting inside the check gives O(log R * n log n).",
        "isCorrect": true
      },
      {
        "id": "wrong_log_only",
        "text": "The total is still O(log R), because binary search controls the loop count.",
        "isCorrect": false
      },
      {
        "id": "wrong_sort_once",
        "text": "The sort is automatically counted once even if it appears inside feasible(mid).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner wants to binary-search possible answers but cannot define feasible(x). What should the review say?",
      "mentalModelCorrection": "Without a predicate that tells whether a candidate works, binary search on answer has no direction.",
      "mistakeTypes": [
        "cannot_explain_why",
        "constraint_ignored"
      ],
      "nextAction": "Practice requiring a concrete monotonic feasibility check before choosing answer search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_continue": "Boundary code without a predicate cannot decide which side to discard.",
        "wrong_numeric": "A numeric answer range alone is not enough."
      }
    },
    "id": "alg-binary-search-answer-022-check",
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
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Require feasibility predicate",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A learner wants to binary-search possible answers but cannot define feasible(x). What should the review say?",
    "answerFeedback": "Ask for a monotonic feasibility predicate first; otherwise binary search has no valid update rule.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Define a monotonic feasible(x) predicate before choosing binary search on answer.",
        "isCorrect": true
      },
      {
        "id": "wrong_continue",
        "text": "Write the binary search loop first and fill in feasible(x) later.",
        "isCorrect": false
      },
      {
        "id": "wrong_numeric",
        "text": "Proceed because any numeric answer range can be binary searched.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
