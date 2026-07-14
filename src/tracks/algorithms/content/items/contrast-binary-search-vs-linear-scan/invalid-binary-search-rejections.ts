import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const invalidBinarySearchRejectionsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The array [7, 1, 5, 3] is unsorted, and the task asks whether 5 exists. What must be checked before using classic binary search?",
      "mentalModelCorrection": "Classic binary search is legal only when order lets a mid comparison prove that one side cannot contain the target.",
      "mistakeTypes": [
        "constraint_ignored",
        "data_structure_mismatch"
      ],
      "nextAction": "Before choosing binary search, name the ordering or monotonicity property that justifies discarding a half.",
      "result": "diagnostic",
      "distractorExplanations": {
        "target_present": "The target being present says nothing about whether an unsorted half can be discarded.",
        "numeric_values": "Numeric values do not create an order relation between their indexes."
      }
    },
    "id": "alg-contrast-binary-linear-reject-001-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the legality check.",
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
    "title": "Reject unsorted direct search",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "The array [7, 1, 5, 3] is unsorted, and the task asks whether 5 exists. What must be checked before using classic binary search?",
    "answerFeedback": "No half can be rejected from a mid comparison because the indexes are not ordered by value.",
    "options": [
      {
        "id": "missing_order",
        "text": "Reject direct binary search because the array has no sorted order.",
        "isCorrect": true
      },
      {
        "id": "target_present",
        "text": "Use binary search because the target is guaranteed to be present.",
        "isCorrect": false
      },
      {
        "id": "numeric_values",
        "text": "Use binary search because every array value is numeric.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A learner compares target with the middle value of [2, 9, 4, 8, 5] and immediately discards the left half. What is the precise flaw?",
      "mentalModelCorrection": "A comparison discards a half only when the remaining indexes have a known value order; an arbitrary permutation provides no such guarantee.",
      "mistakeTypes": [
        "unsafe_pruning",
        "cannot_explain_why"
      ],
      "nextAction": "For every discarded half, state the invariant that proves every value there is impossible.",
      "result": "diagnostic",
      "distractorExplanations": {
        "midpoint_sufficient": "Inspecting one midpoint gives no information about the other values in an unsorted half.",
        "target_magnitude": "The target's magnitude does not order the array indexes."
      }
    },
    "id": "alg-contrast-binary-linear-reject-002-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the flaw in the discard step.",
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
        "nodeId": "unsafe_pruning",
        "role": "mistake_type"
      }
    ],
    "title": "Require proof before discarding",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A learner compares target with the middle value of [2, 9, 4, 8, 5] and immediately discards the left half. What is the precise flaw?",
    "answerFeedback": "Without sorted order, the left half may contain values on either side of the midpoint value, including target.",
    "options": [
      {
        "id": "no_half_proof",
        "text": "The midpoint does not prove that the discarded half is impossible.",
        "isCorrect": true
      },
      {
        "id": "midpoint_sufficient",
        "text": "Any midpoint comparison always makes one half impossible.",
        "isCorrect": false
      },
      {
        "id": "target_magnitude",
        "text": "The target's numeric size automatically orders the indexes.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A prompt says ‘search for a customer ID’, but the IDs are stored in arbitrary order and no ordered index is provided. Which strategy choice is justified?",
      "mentalModelCorrection": "The word search names the goal, not the algorithm; without order or monotonicity, direct inspection is the justified baseline.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Ignore search-related wording until the input structure supplies a legal discard rule.",
      "result": "diagnostic",
      "distractorExplanations": {
        "keyword_binary": "A keyword cannot establish sorted indexed order.",
        "numeric_binary": "Customer IDs being numeric still does not order their storage positions."
      }
    },
    "id": "alg-contrast-binary-linear-reject-003-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the justified strategy.",
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
    "title": "Do not select by search wording",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "The records are arbitrary-order data with no ordered index or monotonic predicate.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Direct inspection is justified because no legal binary-search discard rule exists.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "A prompt says ‘search for a customer ID’, but the IDs are stored in arbitrary order and no ordered index is provided. Which strategy choice is justified?",
    "answerFeedback": "With no ordered structure or monotonic predicate, a direct scan is the justified strategy choice.",
    "options": [
      {
        "id": "direct_inspection",
        "text": "Inspect the available records directly because no half-discard rule is given.",
        "isCorrect": true
      },
      {
        "id": "keyword_binary",
        "text": "Use binary search because the prompt contains the word search.",
        "isCorrect": false
      },
      {
        "id": "numeric_binary",
        "text": "Use binary search because customer IDs are numbers.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "For indexes i = 0..6, a predicate is true exactly when i is even. Can binary search find a true index by treating this as a boolean search?",
      "mentalModelCorrection": "Boolean output is not enough; binary search needs the boolean results to be monotonic across the ordered candidate indexes.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "wrong_approach"
      ],
      "nextAction": "Write the predicate outcomes in index order and check whether they cross one boundary only once.",
      "result": "diagnostic",
      "distractorExplanations": {
        "boolean_boundary": "A predicate can return booleans while still alternating and having no single boundary.",
        "numeric_indexes": "Ordered indexes provide a domain order, but not monotonic predicate outcomes."
      }
    },
    "id": "alg-contrast-binary-linear-reject-004-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Judge whether the predicate is searchable.",
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
    "title": "Reject alternating boolean outcomes",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "For indexes i = 0..6, a predicate is true exactly when i is even. Can binary search find a true index by treating this as a boolean search?",
    "answerFeedback": "The outcomes true, false, true, false, ... are non-monotonic, so a midpoint result cannot identify an impossible side.",
    "options": [
      {
        "id": "alternating_invalid",
        "text": "No; the alternating predicate has no single true/false boundary.",
        "isCorrect": true
      },
      {
        "id": "boolean_boundary",
        "text": "Yes; every boolean predicate automatically has a searchable boundary.",
        "isCorrect": false
      },
      {
        "id": "numeric_indexes",
        "text": "Yes; numeric indexes alone make every predicate binary-searchable.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A predicate over increasing candidates has outcomes false, true, false, true. What prevents binary search from finding the first true candidate?",
      "mentalModelCorrection": "First-true search requires a false prefix followed by a true suffix; later reversals invalidate half-discarding.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "monotonic_signal_missed"
      ],
      "nextAction": "Confirm that once feasibility becomes true, it stays true before using first-true reasoning.",
      "result": "diagnostic",
      "distractorExplanations": {
        "first_true_exists": "Even if true candidates exist, a later false result means a midpoint cannot classify a whole half.",
        "ordered_candidates": "Candidate order is necessary but does not make predicate results monotonic."
      }
    },
    "id": "alg-contrast-binary-linear-reject-005-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose the reason binary search is invalid.",
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
        "nodeId": "monotonic_assumption_invalid",
        "role": "mistake_type"
      }
    ],
    "title": "Require one predicate boundary",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A predicate over increasing candidates has outcomes false, true, false, true. What prevents binary search from finding the first true candidate?",
    "answerFeedback": "The true-to-false reversal means there is no first-true boundary that separates all remaining candidates.",
    "options": [
      {
        "id": "reversal_breaks_boundary",
        "text": "The result reverses after true, so no single first-true boundary exists.",
        "isCorrect": true
      },
      {
        "id": "first_true_exists",
        "text": "Binary search is valid because at least one true candidate exists.",
        "isCorrect": false
      },
      {
        "id": "ordered_candidates",
        "text": "Binary search is valid because the candidate values are numerically ordered.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "For x = 1..7, the feasibility outcomes are true, true, false, true, true, false, true. A candidate proposes binary search for any feasible x. What should the review reject?",
      "mentalModelCorrection": "A numeric answer range is searchable only when feasibility changes monotonically; repeated true/false regions do not support safe halving.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "constraint_reasoning_missed"
      ],
      "nextAction": "List feasibility by increasing x and reject binary search when the outcome changes direction more than once.",
      "result": "diagnostic",
      "distractorExplanations": {
        "numeric_range": "A numeric domain supplies order, but the feasibility rule still has to preserve that order.",
        "any_feasible": "The existence of feasible answers does not tell a midpoint which side contains all feasible answers."
      }
    },
    "id": "alg-contrast-binary-linear-reject-006-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the review decision.",
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
        "nodeId": "monotonic_assumption_invalid",
        "role": "mistake_type"
      }
    ],
    "title": "Reject split feasibility regions",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "For x = 1..7, the feasibility outcomes are true, true, false, true, true, false, true. A candidate proposes binary search for any feasible x. What should the review reject?",
    "answerFeedback": "Feasible regions recur after infeasible candidates, so no half can be discarded from one midpoint check.",
    "options": [
      {
        "id": "multiple_regions",
        "text": "Reject it because feasibility is split into multiple regions rather than one monotonic side.",
        "isCorrect": true
      },
      {
        "id": "numeric_range",
        "text": "Accept it because every numeric range supports binary search.",
        "isCorrect": false
      },
      {
        "id": "any_feasible",
        "text": "Accept it because binary search only needs one feasible answer to exist.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The score f(x) for increasing x goes up, down, then up again, and the task asks for an x with f(x) >= 100. Why is answer-space binary search unjustified?",
      "mentalModelCorrection": "A threshold on a non-monotonic score does not produce one feasible suffix or prefix, so a midpoint cannot eliminate a side.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "wrong_approach"
      ],
      "nextAction": "Separate ‘numeric score’ from ‘monotonic feasibility’ before selecting an answer-space search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "threshold_present": "A threshold comparison is not enough when the score can cross it multiple times.",
        "numeric_score": "Numeric output does not imply monotonic behavior over the candidate domain."
      }
    },
    "id": "alg-contrast-binary-linear-reject-007-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the legality diagnosis.",
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
        "nodeId": "monotonic_assumption_invalid",
        "role": "mistake_type"
      }
    ],
    "title": "Require monotonic score feasibility",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "The numeric candidate domain is ordered, but its threshold feasibility is not monotonic.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "A direct inspection is required when the threshold may be crossed in multiple separated regions.",
    "rejectedApproachIds": [
      "binary_search_on_answer"
    ],
    "instruction": "The score f(x) for increasing x goes up, down, then up again, and the task asks for an x with f(x) >= 100. Why is answer-space binary search unjustified?",
    "answerFeedback": "The threshold can be satisfied in separated regions, so a midpoint check cannot rule out either whole side.",
    "options": [
      {
        "id": "score_non_monotonic",
        "text": "The score is non-monotonic, so the feasible candidates need not form one prefix or suffix.",
        "isCorrect": true
      },
      {
        "id": "threshold_present",
        "text": "The method is valid because any threshold creates a binary-search boundary.",
        "isCorrect": false
      },
      {
        "id": "numeric_score",
        "text": "The method is valid because f(x) returns numeric values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A sorted array [1, 2, 3, 4, 5] is queried for an index whose value is even. Does sorted input alone make this predicate binary-searchable?",
      "mentalModelCorrection": "Sorted values do not make every derived predicate monotonic; here the evenness results alternate false and true.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "structure_signal_missed"
      ],
      "nextAction": "Check the actual predicate sequence, not just whether the underlying values are sorted.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorted_always": "Sorted input supports comparisons on value ranges, not arbitrary predicates over those values.",
        "parity_boundary": "Even values can recur after odd values, so parity has no single boundary in this order."
      }
    },
    "id": "alg-contrast-binary-linear-reject-008-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose whether sorted input is sufficient.",
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
        "nodeId": "monotonic_assumption_invalid",
        "role": "mistake_type"
      }
    ],
    "title": "Do not generalize sorted order",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A sorted array [1, 2, 3, 4, 5] is queried for an index whose value is even. Does sorted input alone make this predicate binary-searchable?",
    "answerFeedback": "The predicate values are false, true, false, true, false, which are not monotonic.",
    "options": [
      {
        "id": "sorted_not_enough",
        "text": "No; the evenness predicate alternates and does not define one boundary.",
        "isCorrect": true
      },
      {
        "id": "sorted_always",
        "text": "Yes; sorted input makes every boolean predicate monotonic.",
        "isCorrect": false
      },
      {
        "id": "parity_boundary",
        "text": "Yes; the first even value proves all later values are even.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A predicate P(i) asks whether the item at index i has a particular label. Labels may appear at any positions. What is missing for binary search?",
      "mentalModelCorrection": "An ordered index range is not sufficient when P(i) can switch truth values arbitrarily; the predicate must preserve a one-direction boundary.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "data_structure_mismatch"
      ],
      "nextAction": "Ask whether P(i) being false or true at mid proves anything about all indexes on either side.",
      "result": "diagnostic",
      "distractorExplanations": {
        "index_order": "Index order exists, but arbitrary labels do not turn it into a monotonic predicate.",
        "boolean_result": "Boolean output describes the type of result, not the shape of results across indexes."
      }
    },
    "id": "alg-contrast-binary-linear-reject-009-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the missing legality condition.",
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
    "title": "Require ordered predicate results",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A predicate P(i) asks whether the item at index i has a particular label. Labels may appear at any positions. What is missing for binary search?",
    "answerFeedback": "Without labels grouped into a monotonic prefix or suffix, a midpoint label cannot eliminate the other indexes.",
    "options": [
      {
        "id": "monotonic_label_order",
        "text": "A monotonic arrangement of labels or another ordered predicate result is missing.",
        "isCorrect": true
      },
      {
        "id": "index_order",
        "text": "Nothing is missing because indexes are always ordered numerically.",
        "isCorrect": false
      },
      {
        "id": "boolean_result",
        "text": "Nothing is missing because P(i) returns a boolean.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A candidate checks P(mid) on a non-monotonic predicate, sees false, and discards every index at or below mid. What makes that discard unsound?",
      "mentalModelCorrection": "A false midpoint eliminates the left side only when all earlier candidates must also be false; non-monotonic predicates provide no such implication.",
      "mistakeTypes": [
        "unsafe_pruning",
        "monotonic_assumption_invalid"
      ],
      "nextAction": "Translate every half-discard into an implication about the entire half and verify that the predicate guarantees it.",
      "result": "diagnostic",
      "distractorExplanations": {
        "false_means_left": "False at one point does not imply false at earlier points when the predicate can reverse.",
        "midpoint_center": "Being the midpoint gives an index position, not a relation between predicate values."
      }
    },
    "id": "alg-contrast-binary-linear-reject-010-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose why the discard is unsound.",
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
        "nodeId": "unsafe_pruning",
        "role": "mistake_type"
      }
    ],
    "title": "Prove a discarded half",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A candidate checks P(mid) on a non-monotonic predicate, sees false, and discards every index at or below mid. What makes that discard unsound?",
    "answerFeedback": "A non-monotonic predicate may be true earlier even when it is false at mid, so the discarded side can contain a valid answer.",
    "options": [
      {
        "id": "earlier_true_possible",
        "text": "Earlier candidates may still be true; P(mid) does not classify the whole left side.",
        "isCorrect": true
      },
      {
        "id": "false_means_left",
        "text": "The discard is always sound because false at mid means all earlier results are false.",
        "isCorrect": false
      },
      {
        "id": "midpoint_center",
        "text": "The discard is sound because mid is the center of the numeric range.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task asks for an index where an arbitrary property holds in an unsorted collection. Which strategy is justified when no grouping or monotonic order is supplied?",
      "mentalModelCorrection": "An arbitrary property may occur anywhere, so each inspected midpoint leaves both sides possible; direct inspection is required for correctness.",
      "mistakeTypes": [
        "wrong_approach",
        "structure_signal_missed"
      ],
      "nextAction": "Choose binary search only after proving that the property groups candidates into an eliminable side.",
      "result": "diagnostic",
      "distractorExplanations": {
        "index_target": "Searching for an index does not make the property ordered over indexes.",
        "midpoint_rule": "A midpoint is useful only when its result constrains the whole left or right region."
      }
    },
    "id": "alg-contrast-binary-linear-reject-011-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the justified strategy.",
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
    "title": "Do not search arbitrary positions by halves",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "The property can occur at any index and no ordered or monotonic structure is provided.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Direct inspection preserves correctness because neither side can be ruled out from a midpoint.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "The task asks for an index where an arbitrary property holds in an unsorted collection. Which strategy is justified when no grouping or monotonic order is supplied?",
    "answerFeedback": "Because the property may occur at any position, direct inspection is required unless another structure is provided.",
    "options": [
      {
        "id": "inspect_candidates",
        "text": "Inspect candidates directly because neither order nor monotonicity permits elimination.",
        "isCorrect": true
      },
      {
        "id": "index_target",
        "text": "Use binary search because the output is an index.",
        "isCorrect": false
      },
      {
        "id": "midpoint_rule",
        "text": "Use binary search because every property can be tested at the midpoint.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A developer says ‘the target is 10^9, so binary search is required’ for an unsorted array of IDs. What assumption should be corrected?",
      "mentalModelCorrection": "The magnitude of the target is unrelated to whether array positions are ordered or whether a monotonic candidate predicate exists.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Inspect the data structure and predicate shape before using the numeric range of a target as a strategy signal.",
      "result": "diagnostic",
      "distractorExplanations": {
        "large_target": "A large value does not make unsorted positions comparable by value.",
        "answer_space": "An answer range is searchable only if checking a candidate yields monotonic feasibility information."
      }
    },
    "id": "alg-contrast-binary-linear-reject-012-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the corrected assumption.",
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
    "title": "Reject numeric-magnitude reasoning",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A developer says ‘the target is 10^9, so binary search is required’ for an unsorted array of IDs. What assumption should be corrected?",
    "answerFeedback": "Binary search depends on ordered candidates or monotonic feasibility, not on how large the target number is.",
    "options": [
      {
        "id": "magnitude_not_signal",
        "text": "Target magnitude is not a binary-search signal; the unsorted storage still requires direct inspection.",
        "isCorrect": true
      },
      {
        "id": "large_target",
        "text": "Binary search is required whenever the target exceeds a fixed numeric threshold.",
        "isCorrect": false
      },
      {
        "id": "answer_space",
        "text": "Every numeric target automatically defines a monotonic answer space.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A function returns whether candidate x is valid, but its results are true for x = 2, false for x = 3, and true for x = 4. What should a reviewer say?",
      "mentalModelCorrection": "A boolean feasibility function is binary-searchable only when validity stays on one side of a single transition.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "cannot_explain_why"
      ],
      "nextAction": "Test adjacent candidate values for reversals before treating a boolean function as a boundary predicate.",
      "result": "diagnostic",
      "distractorExplanations": {
        "bool_enough": "Returning true or false does not guarantee that valid candidates are contiguous.",
        "first_valid": "The first observed valid candidate does not prove that later invalid candidates cannot occur."
      }
    },
    "id": "alg-contrast-binary-linear-reject-013-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose the reviewer diagnosis.",
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
    "title": "Reject reversing feasibility",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A function returns whether candidate x is valid, but its results are true for x = 2, false for x = 3, and true for x = 4. What should a reviewer say?",
    "answerFeedback": "The true-to-false-to-true pattern breaks the single-transition contract required for binary search.",
    "options": [
      {
        "id": "validity_reverses",
        "text": "Reject binary search because validity reverses and does not form one contiguous side.",
        "isCorrect": true
      },
      {
        "id": "bool_enough",
        "text": "Accept binary search because any boolean function defines a boundary.",
        "isCorrect": false
      },
      {
        "id": "first_valid",
        "text": "Accept binary search because finding one valid candidate proves later candidates are valid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for an exact x such that g(x) = 50, but g is an arbitrary numeric function with no increasing or decreasing guarantee. Is numeric equality enough for binary search?",
      "mentalModelCorrection": "Exact numeric output does not provide a direction for discarding candidates unless g has a known monotonic relation to x.",
      "mistakeTypes": [
        "monotonic_assumption_invalid",
        "wrong_approach"
      ],
      "nextAction": "Identify what comparison with g(mid) proves about all candidates on one side before halving an answer range.",
      "result": "diagnostic",
      "distractorExplanations": {
        "exact_numeric": "An exact numeric target is still arbitrary when function values can rise and fall.",
        "compare_mid": "Comparing g(mid) with 50 gives direction only when the function order is known."
      }
    },
    "id": "alg-contrast-binary-linear-reject-014-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "Choose whether equality supplies the needed structure.",
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
        "nodeId": "monotonic_assumption_invalid",
        "role": "mistake_type"
      }
    ],
    "title": "Do not equate numeric with searchable",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "The answer domain is numeric, but g has no monotonic relation to x.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Direct inspection is required because g(mid) cannot prove either side is impossible.",
    "rejectedApproachIds": [
      "binary_search_on_answer"
    ],
    "instruction": "A task asks for an exact x such that g(x) = 50, but g is an arbitrary numeric function with no increasing or decreasing guarantee. Is numeric equality enough for binary search?",
    "answerFeedback": "Without a monotonic relation between x and g(x), a comparison at mid cannot safely choose a side.",
    "options": [
      {
        "id": "no_function_order",
        "text": "No; arbitrary function values give no legal direction for discarding candidates.",
        "isCorrect": true
      },
      {
        "id": "exact_numeric",
        "text": "Yes; every exact numeric target supports binary search over x.",
        "isCorrect": false
      },
      {
        "id": "compare_mid",
        "text": "Yes; g(mid) being above or below 50 always classifies one half.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A reviewer sees code that always removes one half after checking mid, but the explanation only says ‘mid was not the answer’. What contract is missing?",
      "mentalModelCorrection": "Rejecting mid itself is not enough; the removed half must be proven unable to contain a valid answer by sorted order or monotonicity.",
      "mistakeTypes": [
        "unsafe_pruning",
        "cannot_explain_why"
      ],
      "nextAction": "Require a structural reason for every half removal, not merely a failed midpoint check.",
      "result": "diagnostic",
      "distractorExplanations": {
        "midpoint_failed": "A failed midpoint check identifies one invalid candidate, not an entire half.",
        "loop_progress": "Shrinking the range improves termination but cannot repair an unsound discard rule."
      }
    },
    "id": "alg-contrast-binary-linear-reject-015-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the missing correctness contract.",
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
        "nodeId": "unsafe_pruning",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose unsupported half removal",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A reviewer sees code that always removes one half after checking mid, but the explanation only says ‘mid was not the answer’. What contract is missing?",
    "answerFeedback": "A midpoint failure alone does not classify neighboring candidates; the algorithm needs sorted or monotonic structure to justify the removed half.",
    "options": [
      {
        "id": "half_discard_proof",
        "text": "The code must prove that the removed half cannot contain a valid answer.",
        "isCorrect": true
      },
      {
        "id": "midpoint_failed",
        "text": "The removed half is always safe because mid itself was not the answer.",
        "isCorrect": false
      },
      {
        "id": "loop_progress",
        "text": "The removed half is safe whenever the interval becomes smaller.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The prompt asks to find whether a value occurs in a small unsorted list and gives no order, monotonic predicate, or indexed structure. Which answer best captures the safe strategy decision?",
      "mentalModelCorrection": "When no candidate-elimination structure exists, direct inspection is correct even if binary search would sound faster in the abstract.",
      "mistakeTypes": [
        "wrong_approach",
        "structure_signal_missed"
      ],
      "nextAction": "State the missing binary-search precondition before comparing its asymptotic cost with a scan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "speed_first": "A faster method that is not legal is not a valid strategy choice.",
        "sorted_assumed": "The absence of an explicit order cannot be replaced with an assumption that the list happens to be sorted."
      }
    },
    "id": "alg-contrast-binary-linear-reject-016-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "Choose the safe strategy decision.",
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
    "title": "Choose direct inspection without structure",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "The list is unsorted and supplies no monotonic predicate or ordered index.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Direct inspection is the only justified search decision from the stated structure.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "The prompt asks to find whether a value occurs in a small unsorted list and gives no order, monotonic predicate, or indexed structure. Which answer best captures the safe strategy decision?",
    "answerFeedback": "A direct scan is the safe choice because the prompt supplies no structure that can justify eliminating a half.",
    "options": [
      {
        "id": "scan_required",
        "text": "Use direct inspection; no sorted or monotonic structure makes binary search legal.",
        "isCorrect": true
      },
      {
        "id": "speed_first",
        "text": "Use binary search because its theoretical cost is lower than a scan.",
        "isCorrect": false
      },
      {
        "id": "sorted_assumed",
        "text": "Use binary search after assuming the list is sorted unless the prompt disproves it.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
