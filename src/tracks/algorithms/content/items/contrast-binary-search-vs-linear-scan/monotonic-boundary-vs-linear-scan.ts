// Planning target: this file should contain questions contrasting linear scan with binary search over a monotonic boundary:
// first true; first value >= threshold; last true; false-false-true-true;
// true-true-false-false; and recognizing when a linear scan can be improved because the predicate is monotonic.
// It should diagnose mistakes such as scanning from left to right despite a clear monotonic boundary,
// applying binary search to a non-monotonic predicate,
// returning any true instead of the boundary,
// or reversing the direction of the update because the meaning of true/false was not named.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, and small trace-style items.
// Avoid full binary-search-on-answer optimization scenarios; this file is about the contrast with linear scan.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const monotonicBoundaryVsLinearScanQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A boolean sequence over ordered indexes is false, false, true, true. The task asks for the first true index. Which strategy fits the structure?",
      "mentalModelCorrection": "The false prefix and true suffix form a monotonic first-true boundary that binary search can locate.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "Name the requested boundary before choosing whether a linear scan is necessary.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_only": "A monotonic boundary lets binary search skip blocks of known false values.",
        "any_true": "The output contract asks specifically for the first true index."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-001-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Find the first true boundary\", choose the boundary reasoning.",
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
    "title": "Find the first true boundary",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "monotonic_boundary_binary_search"
    ],
    "constraintSignal": "The predicate is monotonic over the ordered boundary candidates.",
    "expectedApproachIds": [
      "monotonic_boundary_binary_search"
    ],
    "reasonSignal": "The false prefix and true suffix form a monotonic first-true boundary that binary search can locate.",
    "rejectedApproachIds": [
      "linear_scan_default"
    ],
    "instruction": "A boolean sequence over ordered indexes is false, false, true, true. The task asks for the first true index. Which strategy fits the structure?",
    "answerFeedback": "The false prefix and true suffix form a monotonic first-true boundary that binary search can locate.",
    "options": [
      {
        "id": "first_true_binary",
        "text": "Use binary search for the first true boundary instead of scanning the entire prefix.",
        "isCorrect": true
      },
      {
        "id": "scan_only",
        "text": "Scan left to right because the first true value must be encountered in order.",
        "explanation": "A monotonic boundary lets binary search skip blocks of known false values.",
        "isCorrect": false
      },
      {
        "id": "any_true",
        "text": "Return any true index because all true positions satisfy the predicate.",
        "explanation": "The output contract asks specifically for the first true index.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A boolean sequence over ordered indexes is true, true, false, false. The task asks for the last true index. What is the key contrast with a linear scan?",
      "mentalModelCorrection": "The true prefix and false suffix expose a monotonic last-true boundary, so binary search can avoid checking every later false index.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "Match the update rule to last-true semantics rather than reusing first-true reasoning unchanged.",
      "result": "diagnostic",
      "distractorExplanations": {
        "first_true_rule": "The boundary direction differs: last true keeps a true midpoint as a candidate on the left side.",
        "linear_required": "A monotonic true-prefix/false-suffix still supports safe halving."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-002-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Find the last true boundary\", choose the boundary reasoning.",
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
    "title": "Find the last true boundary",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A boolean sequence over ordered indexes is true, true, false, false. The task asks for the last true index. What is the key contrast with a linear scan?",
    "answerFeedback": "The true prefix and false suffix expose a monotonic last-true boundary, so binary search can avoid checking every later false index.",
    "options": [
      {
        "id": "last_true_binary",
        "text": "Use a last-true binary search because the predicate changes from true to false once.",
        "isCorrect": true
      },
      {
        "id": "first_true_rule",
        "text": "Use first-true reasoning because both tasks search a boolean sequence.",
        "explanation": "The boundary direction differs: last true keeps a true midpoint as a candidate on the left side.",
        "isCorrect": false
      },
      {
        "id": "linear_required",
        "text": "Scan all values because last true cannot be found by halving.",
        "explanation": "A monotonic true-prefix/false-suffix still supports safe halving.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In a sorted ascending array, the task asks for the first index whose value is at least threshold. Why can binary search improve on a linear scan?",
      "mentalModelCorrection": "The predicate nums[i] >= threshold is false before the first qualifying value and true from that point onward.",
      "mistakeTypes": [
        "structure_signal_missed"
      ],
      "nextAction": "Turn the threshold comparison into a false-prefix/true-suffix boundary before coding.",
      "result": "diagnostic",
      "distractorExplanations": {
        "any_ge_value": "The requested first index requires preserving the boundary contract.",
        "linear_threshold": "Sorted order groups all values below the threshold before all qualifying values."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-003-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "For \"Recognize first value at a threshold\", choose the boundary reasoning.",
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
        "nodeId": "structure_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize first value at a threshold",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "In a sorted ascending array, the task asks for the first index whose value is at least threshold. Why can binary search improve on a linear scan?",
    "answerFeedback": "The predicate nums[i] >= threshold is false before the first qualifying value and true from that point onward.",
    "options": [
      {
        "id": "first_ge_boundary",
        "text": "The first value >= threshold is a first-true boundary in the sorted array.",
        "isCorrect": true
      },
      {
        "id": "any_ge_value",
        "text": "Return any qualifying value because the threshold predicate is enough.",
        "explanation": "The requested first index requires preserving the boundary contract.",
        "isCorrect": false
      },
      {
        "id": "linear_threshold",
        "text": "A threshold always requires scanning from index zero.",
        "explanation": "Sorted order groups all values below the threshold before all qualifying values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "During a first-true search, predicate(mid) is true. Which side remains capable of containing the answer?",
      "mentalModelCorrection": "True at mid means mid may be the first true position, so mid and the left side remain candidates.",
      "mistakeTypes": [
        "subgoal_order_wrong"
      ],
      "nextAction": "Keep a true midpoint for first-true search and continue looking left for an earlier boundary.",
      "result": "diagnostic",
      "distractorExplanations": {
        "discard_mid_left": "For first true, a true midpoint is a valid boundary candidate and earlier positions may also be true.",
        "discard_right": "The right side can be discarded, but the search still must distinguish mid from an earlier true position."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-004-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "For \"Keep a true midpoint for first true\", choose the boundary reasoning.",
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
        "nodeId": "first_true_update_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Keep a true midpoint for first true",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "During a first-true search, predicate(mid) is true. Which side remains capable of containing the answer?",
    "answerFeedback": "True at mid means mid may be the first true position, so mid and the left side remain candidates.",
    "options": [
      {
        "id": "keep_left_and_mid",
        "text": "Keep mid and search the left side because an earlier true position may exist.",
        "isCorrect": true
      },
      {
        "id": "discard_mid_left",
        "text": "Discard mid and the left side because true means the answer is to the right.",
        "explanation": "For first true, a true midpoint is a valid boundary candidate and earlier positions may also be true.",
        "isCorrect": false
      },
      {
        "id": "discard_right",
        "text": "Discard the right side and return mid immediately.",
        "explanation": "The right side can be discarded, but the search still must distinguish mid from an earlier true position.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "During a first-true search, predicate(mid) is false. Which candidate region remains possible?",
      "mentalModelCorrection": "A false midpoint cannot be the first true position, and monotonicity rules out every position at or before mid.",
      "mistakeTypes": [
        "subgoal_order_wrong"
      ],
      "nextAction": "For first true, move strictly right after a false midpoint.",
      "result": "diagnostic",
      "distractorExplanations": {
        "keep_left": "Monotonicity says positions at or before a false mid are also false.",
        "return_false": "A false midpoint cannot satisfy a first-true output contract."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-005-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "For \"Move right after false for first true\", choose the boundary reasoning.",
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
        "nodeId": "first_true_update_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Move right after false for first true",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "During a first-true search, predicate(mid) is false. Which candidate region remains possible?",
    "answerFeedback": "A false midpoint cannot be the first true position, and monotonicity rules out every position at or before mid.",
    "options": [
      {
        "id": "right_of_mid",
        "text": "Discard mid and everything left of it; only positions after mid can be first true.",
        "isCorrect": true
      },
      {
        "id": "keep_left",
        "text": "Keep the left side because an earlier position may still be true.",
        "explanation": "Monotonicity says positions at or before a false mid are also false.",
        "isCorrect": false
      },
      {
        "id": "return_false",
        "text": "Return mid because it is the first inspected boundary candidate.",
        "explanation": "A false midpoint cannot satisfy a first-true output contract.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "During a last-true search, predicate(mid) is true. Which direction preserves the boundary candidate?",
      "mentalModelCorrection": "True at mid means mid may be the last true position, while later true positions may still exist to the right.",
      "mistakeTypes": [
        "subgoal_order_wrong"
      ],
      "nextAction": "For last true, keep mid and continue right after a true midpoint.",
      "result": "diagnostic",
      "distractorExplanations": {
        "search_left_only": "The last true boundary may be at mid or later in the true prefix.",
        "discard_mid": "Testing mid as true does not remove it from a last-true candidate set."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-006-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "last_true_update_rule",
    "prompt": "For \"Keep a true midpoint for last true\", choose the boundary reasoning.",
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
        "nodeId": "last_true_update_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Keep a true midpoint for last true",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "During a last-true search, predicate(mid) is true. Which direction preserves the boundary candidate?",
    "answerFeedback": "True at mid means mid may be the last true position, while later true positions may still exist to the right.",
    "options": [
      {
        "id": "keep_mid_search_right",
        "text": "Keep mid and search right to look for a later true position.",
        "isCorrect": true
      },
      {
        "id": "search_left_only",
        "text": "Search left because true means the boundary must be earlier.",
        "explanation": "The last true boundary may be at mid or later in the true prefix.",
        "isCorrect": false
      },
      {
        "id": "discard_mid",
        "text": "Discard mid because it has already been tested.",
        "explanation": "Testing mid as true does not remove it from a last-true candidate set.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "During a last-true search, predicate(mid) is false in a true-prefix/false-suffix sequence. Which region can still contain the answer?",
      "mentalModelCorrection": "A false midpoint and every later position are false under the monotonic contract, so only the left side remains possible.",
      "mistakeTypes": [
        "subgoal_order_wrong"
      ],
      "nextAction": "For last true, move left after a false midpoint and do not keep mid as a valid answer.",
      "result": "diagnostic",
      "distractorExplanations": {
        "search_right": "The false suffix means later indexes cannot be true.",
        "keep_false": "A false midpoint cannot satisfy the last-true output contract."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-007-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "last_true_update_rule",
    "prompt": "For \"Move left after false for last true\", choose the boundary reasoning.",
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
        "nodeId": "last_true_update_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Move left after false for last true",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "During a last-true search, predicate(mid) is false in a true-prefix/false-suffix sequence. Which region can still contain the answer?",
    "answerFeedback": "A false midpoint and every later position are false under the monotonic contract, so only the left side remains possible.",
    "options": [
      {
        "id": "left_of_mid",
        "text": "Discard mid and the right side; the last true must be before mid.",
        "isCorrect": true
      },
      {
        "id": "search_right",
        "text": "Search right because later indexes are closer to the last position.",
        "explanation": "The false suffix means later indexes cannot be true.",
        "isCorrect": false
      },
      {
        "id": "keep_false",
        "text": "Keep mid because every boundary search keeps the midpoint.",
        "explanation": "A false midpoint cannot satisfy the last-true output contract.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Predicate outcomes over ordered indexes are false, true, false, true. A learner asks binary search for the first true index. What must be rejected?",
      "mentalModelCorrection": "The predicate reverses after becoming true, so there is no single false-prefix/true-suffix boundary to search.",
      "mistakeTypes": [
        "monotonic_assumption_invalid"
      ],
      "nextAction": "Verify the whole predicate shape before applying first-true update rules.",
      "result": "diagnostic",
      "distractorExplanations": {
        "first_true_exists": "Existence of true values does not make the true region a suffix.",
        "first_true_rule_anyway": "First-true updates require monotonic predicate outcomes, not merely boolean output."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-008-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "binary_search_answer_feasibility_predicate",
    "prompt": "For \"Reject a non-monotonic boundary claim\", choose the boundary reasoning.",
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
    "title": "Reject a non-monotonic boundary claim",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "linear_scan_default"
    ],
    "constraintSignal": "The predicate is monotonic over the ordered boundary candidates.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "The predicate reverses after becoming true, so there is no single false-prefix/true-suffix boundary to search.",
    "rejectedApproachIds": [
      "monotonic_boundary_binary_search"
    ],
    "instruction": "Predicate outcomes over ordered indexes are false, true, false, true. A learner asks binary search for the first true index. What must be rejected?",
    "answerFeedback": "The predicate reverses after becoming true, so there is no single false-prefix/true-suffix boundary to search.",
    "options": [
      {
        "id": "no_single_boundary",
        "text": "Reject binary search because the non-monotonic results do not define one first-true boundary.",
        "isCorrect": true
      },
      {
        "id": "first_true_exists",
        "text": "Accept it because at least one true value exists.",
        "explanation": "Existence of true values does not make the true region a suffix.",
        "isCorrect": false
      },
      {
        "id": "first_true_rule_anyway",
        "text": "Apply first-true updates because the result is boolean.",
        "explanation": "First-true updates require monotonic predicate outcomes, not merely boolean output.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A monotonic sequence is false, false, true, true, and the task asks for the first true index. Why is returning the first true value encountered by an arbitrary midpoint insufficient?",
      "mentalModelCorrection": "A midpoint that is true proves a valid candidate, not that no earlier true position exists.",
      "mistakeTypes": [
        "output_contract_misread"
      ],
      "nextAction": "Preserve the boundary contract after finding a valid midpoint; continue toward the requested edge.",
      "result": "diagnostic",
      "distractorExplanations": {
        "any_satisfies": "The task asks for the first true index, not any satisfying index.",
        "linear_only": "Binary search can return boundaries when its updates preserve the boundary invariant."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-009-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Do not return any true for a boundary task\", choose the boundary reasoning.",
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
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Do not return any true for a boundary task",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A monotonic sequence is false, false, true, true, and the task asks for the first true index. Why is returning the first true value encountered by an arbitrary midpoint insufficient?",
    "answerFeedback": "A midpoint that is true proves a valid candidate, not that no earlier true position exists.",
    "options": [
      {
        "id": "boundary_not_any",
        "text": "Any true midpoint is not enough; the algorithm must continue left to prove it is the first true.",
        "isCorrect": true
      },
      {
        "id": "any_satisfies",
        "text": "Return immediately because any true index satisfies the predicate.",
        "explanation": "The task asks for the first true index, not any satisfying index.",
        "isCorrect": false
      },
      {
        "id": "linear_only",
        "text": "Switch to a full linear scan because binary search cannot return boundaries.",
        "explanation": "Binary search can return boundaries when its updates preserve the boundary invariant.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A first-true query runs over a monotonic predicate that is false for every candidate. What should the result represent?",
      "mentalModelCorrection": "An all-false sequence has no first true position, so the not-found boundary must remain explicit.",
      "mistakeTypes": [
        "edge_case_missed"
      ],
      "nextAction": "Define the no-boundary result before relying on a first-true loop.",
      "result": "diagnostic",
      "distractorExplanations": {
        "last_index": "An exhausted interval does not create a valid true boundary.",
        "first_checked": "A false candidate cannot satisfy a first-true output contract."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-010-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "For \"Handle an all-false first-true search\", choose the boundary reasoning.",
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
        "nodeId": "first_true_update_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Handle an all-false first-true search",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A first-true query runs over a monotonic predicate that is false for every candidate. What should the result represent?",
    "answerFeedback": "An all-false sequence has no first true position, so the not-found boundary must remain explicit.",
    "options": [
      {
        "id": "no_true_boundary",
        "text": "Return the explicit not-found result because no candidate satisfies the predicate.",
        "isCorrect": true
      },
      {
        "id": "last_index",
        "text": "Return the last index because the search interval became empty there.",
        "explanation": "An exhausted interval does not create a valid true boundary.",
        "isCorrect": false
      },
      {
        "id": "first_checked",
        "text": "Return the first checked candidate even though it is false.",
        "explanation": "A false candidate cannot satisfy a first-true output contract.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A last-true query runs over a monotonic predicate that is true for every candidate. Which boundary should be returned?",
      "mentalModelCorrection": "When every candidate is true, the last valid position is the final candidate in the search domain.",
      "mistakeTypes": [
        "edge_case_missed"
      ],
      "nextAction": "Test all-true and all-false shapes against the boundary contract, not only mixed sequences.",
      "result": "diagnostic",
      "distractorExplanations": {
        "no_true": "Last-true search needs a true position; an all-true domain has one at the end.",
        "first_index": "The contract asks for the last true, not the first true."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-011-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "last_true_update_rule",
    "prompt": "For \"Handle an all-true last-true search\", choose the boundary reasoning.",
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
        "nodeId": "last_true_update_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Handle an all-true last-true search",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A last-true query runs over a monotonic predicate that is true for every candidate. Which boundary should be returned?",
    "answerFeedback": "When every candidate is true, the last valid position is the final candidate in the search domain.",
    "options": [
      {
        "id": "final_index",
        "text": "Return the final candidate index because it is the last true position.",
        "isCorrect": true
      },
      {
        "id": "no_true",
        "text": "Return not-found because there was no false-to-true transition.",
        "explanation": "Last-true search needs a true position; an all-true domain has one at the end.",
        "isCorrect": false
      },
      {
        "id": "first_index",
        "text": "Return the first index because it is the first true encountered.",
        "explanation": "The contract asks for the last true, not the first true.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A developer says ‘true means move right’ without saying whether the task asks for first true or last true. Why is that explanation unsafe?",
      "mentalModelCorrection": "The meaning of a true midpoint depends on the requested boundary: first true moves left, while last true moves right.",
      "mistakeTypes": [
        "state_model_misread"
      ],
      "nextAction": "State the boundary contract and what true or false proves before writing updates.",
      "result": "diagnostic",
      "distractorExplanations": {
        "true_always_right": "True moves right for last true but left for first true when mid remains a candidate.",
        "direction_irrelevant": "A wrong direction can return the wrong boundary despite valid monotonicity."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-012-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Name the predicate direction\", choose the boundary reasoning.",
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
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Name the predicate direction",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A developer says ‘true means move right’ without saying whether the task asks for first true or last true. Why is that explanation unsafe?",
    "answerFeedback": "The meaning of a true midpoint depends on the requested boundary: first true moves left, while last true moves right.",
    "options": [
      {
        "id": "boundary_semantics_first",
        "text": "Name first-true or last-true semantics before choosing the direction for a true midpoint.",
        "isCorrect": true
      },
      {
        "id": "true_always_right",
        "text": "True always means move right in binary search.",
        "explanation": "True moves right for last true but left for first true when mid remains a candidate.",
        "isCorrect": false
      },
      {
        "id": "direction_irrelevant",
        "text": "The direction does not matter if the predicate is monotonic.",
        "explanation": "A wrong direction can return the wrong boundary despite valid monotonicity.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A left-to-right scan checks a million ordered candidates even though the predicate is false before one boundary and true after it. What improvement is justified?",
      "mentalModelCorrection": "The monotonic boundary lets binary search skip large regions while preserving the requested first- or last-boundary result.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "Replace repeated linear inspection with boundary reasoning when the predicate has one direction of change.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_only_correct": "Binary search discovers the boundary through ordered elimination, not sequential visitation.",
        "arbitrary_binary": "Large size does not compensate for a missing monotonicity guarantee."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-013-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Prefer boundary search over a scan\", choose the boundary reasoning.",
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
    "title": "Prefer boundary search over a scan",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A left-to-right scan checks a million ordered candidates even though the predicate is false before one boundary and true after it. What improvement is justified?",
    "answerFeedback": "The monotonic boundary lets binary search skip large regions while preserving the requested first- or last-boundary result.",
    "options": [
      {
        "id": "boundary_binary_search",
        "text": "Use binary search for the monotonic boundary instead of scanning all candidates.",
        "isCorrect": true
      },
      {
        "id": "scan_only_correct",
        "text": "Keep the scan because boundary results must be discovered in order.",
        "explanation": "Binary search discovers the boundary through ordered elimination, not sequential visitation.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_binary",
        "text": "Use binary search for any predicate because the domain is large.",
        "explanation": "Large size does not compensate for a missing monotonicity guarantee.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A reviewer accepts an O(n) scan for a first-true query even though the false-prefix/true-suffix invariant is explicitly guaranteed. What should the review flag?",
      "mentalModelCorrection": "The scan is correct but leaves a clear logarithmic improvement unused; the monotonic boundary is the intended strategy signal.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Separate ‘works’ from ‘fits the available structure and constraints’ in strategy review.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_wrong": "A scan can still return the correct boundary; it is simply slower.",
        "same_growth": "Sequential inspection is O(n), while safe halving is O(log n)."
      }
    },
    "id": "alg-contrast-binary-linear-boundary-014-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "For \"Reject linear scan after a boundary is proven\", choose the boundary reasoning.",
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
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Reject linear scan after a boundary is proven",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A reviewer accepts an O(n) scan for a first-true query even though the false-prefix/true-suffix invariant is explicitly guaranteed. What should the review flag?",
    "answerFeedback": "The scan is correct but leaves a clear logarithmic improvement unused; the monotonic boundary is the intended strategy signal.",
    "options": [
      {
        "id": "missed_log_improvement",
        "text": "Flag the scan as correct but asymptotically weaker than binary search for the guaranteed boundary.",
        "isCorrect": true
      },
      {
        "id": "scan_wrong",
        "text": "Flag it as incorrect because scans cannot process monotonic predicates.",
        "explanation": "A scan can still return the correct boundary; it is simply slower.",
        "isCorrect": false
      },
      {
        "id": "same_growth",
        "text": "Accept it as equivalent because both methods inspect the same candidate domain.",
        "explanation": "Sequential inspection is O(n), while safe halving is O(log n).",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
