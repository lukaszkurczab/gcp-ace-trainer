import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const monotonicPredicateSearchQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A boolean predicate over versions looks like false, false, false, true, true. What binary-search boundary is this?",
      "mentalModelCorrection": "A monotonic false-then-true sequence supports searching for the first true position.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice naming the boundary in the predicate sequence before choosing updates.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_any_true": "Any true value is not enough when the task asks for the first true boundary.",
        "wrong_last_true": "The sequence becomes true and stays true, so the meaningful boundary is the first true."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose the boundary search.",
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
    "title": "Recognize first true predicate",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A boolean predicate over versions looks like false, false, false, true, true. What binary-search boundary is this?",
    "answerFeedback": "This is a first-true search over a monotonic predicate.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Search for the first true position.",
        "isCorrect": true
      },
      {
        "id": "wrong_any_true",
        "text": "Search for any true position and return immediately.",
        "isCorrect": false
      },
      {
        "id": "wrong_last_true",
        "text": "Search for the last true position.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A boolean predicate over indexes looks like true, true, true, false, false. What boundary can binary search find?",
      "mentalModelCorrection": "A monotonic true-then-false sequence supports searching for the last true position.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice identifying the direction of the monotonic predicate before writing the update rule.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_first_true": "The first true is trivial at the start; the useful boundary is where true stops.",
        "wrong_first_false_only": "First false is also derivable, but if the task asks for the final working position, the boundary is last true."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose the boundary search.",
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
    "title": "Recognize last true predicate",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A boolean predicate over indexes looks like true, true, true, false, false. What boundary can binary search find for the final working position?",
    "answerFeedback": "The final working position is the last true index.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Search for the last true position.",
        "isCorrect": true
      },
      {
        "id": "wrong_first_true",
        "text": "Search for the first true position.",
        "isCorrect": false
      },
      {
        "id": "wrong_first_false_only",
        "text": "Return any false position because false marks failure.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In a first-bad-version style task, isBad(version) is false before the first bad version and true from that version onward. At mid, isBad(mid) is true. Which update preserves the first bad candidate?",
      "mentalModelCorrection": "If mid is bad, it may be the first bad version, so keep it and search left.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice keeping mid when it may be the boundary answer.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_go_right": "Going right skips earlier versions that may include the first bad version.",
        "wrong_discard_mid": "Discarding mid can skip the first bad version unless a separate answer variable is saved."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "Choose the boundary update.",
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
    "title": "Keep bad mid as first-bad candidate",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "In a first-bad-version style task, isBad(version) is false before the first bad version and true from that version onward. At mid, isBad(mid) is true. Which update preserves the first bad candidate?",
    "answerFeedback": "Use right = mid in a lower-bound style template because mid may be the first bad version.",
    "options": [
      {
        "id": "expected_signal",
        "text": "right = mid, because mid is bad and may be the first bad version.",
        "isCorrect": true
      },
      {
        "id": "wrong_go_right",
        "text": "left = mid + 1, because bad means later versions should be searched.",
        "isCorrect": false
      },
      {
        "id": "wrong_discard_mid",
        "text": "right = mid - 1, because every bad version should be discarded.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In a first-bad-version style task, isBad(mid) is false. Which update is forced?",
      "mentalModelCorrection": "If mid is still good, the first bad version must be after mid.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice discarding the side proven impossible by the predicate result.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_mid": "A good mid cannot be the first bad version.",
        "wrong_go_left": "Earlier versions are also good under the monotonic first-bad assumption."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "Choose the boundary update.",
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
    "title": "Discard good mid before first bad",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "In a first-bad-version style task, isBad(mid) is false. Which update is forced?",
    "answerFeedback": "Use left = mid + 1 because mid and earlier versions cannot be first bad.",
    "options": [
      {
        "id": "expected_signal",
        "text": "left = mid + 1, because the first bad version must be later.",
        "isCorrect": true
      },
      {
        "id": "wrong_keep_mid",
        "text": "left = mid, because mid may become bad in a later iteration.",
        "isCorrect": false
      },
      {
        "id": "wrong_go_left",
        "text": "right = mid, because a good version means the answer is earlier.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A predicate sequence is false, true, false, true as the index increases. Can binary search safely find the first true by discarding halves?",
      "mentalModelCorrection": "Binary search over predicates requires monotonicity; alternating values do not identify one impossible half.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking monotonicity before choosing predicate binary search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_numeric_indexes": "Numeric indexes alone are not enough; the predicate must be monotonic.",
        "wrong_any_true": "The existence of true values does not make the first true searchable by halving."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose whether binary search is valid.",
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
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject non-monotonic predicate",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A predicate sequence is false, true, false, true as the index increases. Can binary search safely find the first true by discarding halves?",
    "answerFeedback": "No. The predicate is not monotonic, so a mid result does not identify which half can be discarded.",
    "options": [
      {
        "id": "expected_signal",
        "text": "No, because the predicate is not monotonic.",
        "isCorrect": true
      },
      {
        "id": "wrong_numeric_indexes",
        "text": "Yes, because indexes are numeric and can always be binary searched.",
        "isCorrect": false
      },
      {
        "id": "wrong_any_true",
        "text": "Yes, because the sequence contains true values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A search wants the last true in a true, true, true, false, false predicate. At mid, predicate(mid) is true. Which direction should the search move?",
      "mentalModelCorrection": "For last true, a true mid is valid but there may be a later true, so search right while preserving mid as a candidate.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice distinguishing first-true and last-true update directions.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_go_left": "Going left is the first-true pattern, not the last-true pattern.",
        "wrong_return": "One true mid does not prove it is the last true."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "last_true_update_rule",
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
    "title": "Move right for last true",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A search wants the last true in a true, true, true, false, false predicate. At mid, predicate(mid) is true. Which direction should the search move?",
    "answerFeedback": "A true mid may be the answer, but the last true may be to the right.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Search right while keeping mid as a valid candidate.",
        "isCorrect": true
      },
      {
        "id": "wrong_go_left",
        "text": "Search left because true always means the answer is earlier.",
        "isCorrect": false
      },
      {
        "id": "wrong_return",
        "text": "Return mid immediately because it is true.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A search wants the last true in a true, true, true, false, false predicate. At mid, predicate(mid) is false. Which side can be discarded?",
      "mentalModelCorrection": "If mid is false in a true-then-false sequence, mid and everything right of it cannot be last true.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice deriving the discarded side from predicate direction.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_right": "The right side is false or later, so it cannot contain a true boundary.",
        "wrong_keep_false": "A false mid cannot be the last true answer."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "last_true_update_rule",
    "prompt": "Choose the discarded side.",
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
    "title": "Discard false suffix for last true",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A search wants the last true in a true, true, true, false, false predicate. At mid, predicate(mid) is false. Which side can be discarded?",
    "answerFeedback": "Discard mid and the right side; the last true must be to the left.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Discard mid and the right side.",
        "isCorrect": true
      },
      {
        "id": "wrong_right",
        "text": "Discard the left side because false means the answer is later.",
        "isCorrect": false
      },
      {
        "id": "wrong_keep_false",
        "text": "Keep mid because false may still be the last true.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A first-true search sees predicate(mid) === true and returns mid immediately. What mistake should you diagnose?",
      "mentalModelCorrection": "A true mid proves a valid position exists, but not that mid is the first true.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_explain_why"
      ],
      "nextAction": "Practice distinguishing any true from first true.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_any_true": "Returning any true value is not enough for a boundary contract.",
        "wrong_false_side": "The false side has already been ruled out only after the correct boundary update."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "first_true_update_rule",
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
    "title": "Do not return any true for first true",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A first-true search sees predicate(mid) === true and returns mid immediately. What mistake should you diagnose?",
    "answerFeedback": "mid may be true but not first; the search must continue left while keeping mid as a candidate.",
    "options": [
      {
        "id": "expected_signal",
        "text": "It returns any true position instead of searching for the first true boundary.",
        "isCorrect": true
      },
      {
        "id": "wrong_any_true",
        "text": "It is correct because any true position is always the first true.",
        "isCorrect": false
      },
      {
        "id": "wrong_false_side",
        "text": "It should search right because true means earlier positions are impossible.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A first-true search ends with left === right. What does left represent in the standard lower-bound style template?",
      "mentalModelCorrection": "left is the converged first position where the predicate is true, or the end boundary if none is true.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_explain_why"
      ],
      "nextAction": "Practice connecting the post-loop boundary to the predicate invariant.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_mid": "mid is only the last probe; the boundary variable is the output.",
        "wrong_any_true": "The result is not any true position; it is the first true boundary."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Choose what left represents.",
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
    "title": "Interpret first-true post-loop boundary",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A first-true search ends with left === right. What does left represent in the standard lower-bound style template?",
    "answerFeedback": "left is the first true boundary, or the end position if no true value exists.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The first true position, or the end boundary if no true exists.",
        "isCorrect": true
      },
      {
        "id": "wrong_mid",
        "text": "The last computed mid, regardless of final bounds.",
        "isCorrect": false
      },
      {
        "id": "wrong_any_true",
        "text": "Any position that was ever checked as true.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Trace first-true search on predicate values [false, false, true, true]. Start left = 0, right = 4, mid = 2. predicate(mid) is true. What should happen next?",
      "mentalModelCorrection": "mid is true and may be the first true, so keep it and search the left side.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice tracing first-true updates on a small predicate array.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_go_right": "Going right skips possible earlier true positions.",
        "wrong_return": "mid is true, but first true could still be earlier."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "Choose the next trace step.",
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
    "title": "Trace true mid in first-true search",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "Trace first-true search on predicate values [false, false, true, true]. Start left = 0, right = 4, mid = 2. predicate(mid) is true. What should happen next?",
    "answerFeedback": "Set right = mid, so right becomes 2.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Set right = 2 to keep mid as a possible first true.",
        "isCorrect": true
      },
      {
        "id": "wrong_go_right",
        "text": "Set left = 3 because true means the answer is later.",
        "isCorrect": false
      },
      {
        "id": "wrong_return",
        "text": "Return 2 immediately because predicate(2) is true.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Trace first-true search on predicate values [false, false, true, true]. After right becomes 2, left = 0 and mid = 1. predicate(mid) is false. What should happen next?",
      "mentalModelCorrection": "A false mid is before the first true, so discard it and everything left of it.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice tracing the false branch in a first-true search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_mid": "mid is false and cannot be the first true.",
        "wrong_go_left": "Earlier values are also false under the monotonic predicate."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "Choose the next trace step.",
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
    "title": "Trace false mid in first-true search",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "Trace first-true search on predicate values [false, false, true, true]. After right becomes 2, left = 0 and mid = 1. predicate(mid) is false. What should happen next?",
    "answerFeedback": "Set left = mid + 1, so left becomes 2.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Set left = 2 because mid is false.",
        "isCorrect": true
      },
      {
        "id": "wrong_keep_mid",
        "text": "Set left = 1 because mid may still become true.",
        "isCorrect": false
      },
      {
        "id": "wrong_go_left",
        "text": "Set right = 1 because false means the answer is earlier.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner copies the first-true update rule into a last-true task. What mistake should you diagnose?",
      "mentalModelCorrection": "Update direction depends on what true means and which boundary is requested.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming the predicate direction and requested boundary before reusing a template.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_template": "Binary search templates are not interchangeable without matching the boundary contract.",
        "wrong_complexity": "The issue is correctness of updates, not the O(log n) iteration count."
      }
    },
    "id": "alg-binary-search-monotonic-predicate-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "last_true_update_rule",
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
    "title": "Diagnose copied predicate template",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A learner copies the first-true update rule into a last-true task. What mistake should you diagnose?",
    "answerFeedback": "They reused a boundary template without checking predicate direction and target boundary.",
    "options": [
      {
        "id": "expected_signal",
        "text": "They ignored that update direction depends on whether the task wants first true or last true.",
        "isCorrect": true
      },
      {
        "id": "wrong_template",
        "text": "They are correct because all monotonic predicate searches use identical updates.",
        "isCorrect": false
      },
      {
        "id": "wrong_complexity",
        "text": "They only need to mention O(log n); the boundary direction does not matter.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the reasoning steps for searching a monotonic boolean predicate.",
      "mentalModelCorrection": "First identify the predicate shape, then the requested boundary, then choose updates that preserve candidate answers.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice deriving predicate binary search from boundary semantics.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-monotonic-predicate-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "monotonic_predicate_boundary",
    "prompt": "Tap the predicate-search reasoning steps in order.",
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order monotonic predicate reasoning",
    "trackId": "algorithms",
    "type": "subgoal_ordering",
    "instruction": "Order the reasoning steps for searching a monotonic boolean predicate.",
    "answerFeedback": "Predicate search starts by proving monotonicity, naming the true/false shape, choosing the boundary, deriving updates, and returning the converged boundary.",
    "subgoals": [
      {
        "id": "verify_monotonicity",
        "text": "Verify that the predicate changes in only one direction."
      },
      {
        "id": "name_shape",
        "text": "Name the shape: false-then-true or true-then-false."
      },
      {
        "id": "choose_boundary",
        "text": "Choose the requested boundary: first true, first false, last true, or last false."
      },
      {
        "id": "derive_updates",
        "text": "Derive updates that keep possible boundary candidates and discard impossible ones."
      },
      {
        "id": "return_boundary",
        "text": "Return the converged boundary variable after the loop."
      }
    ],
    "correctOrder": [
      "verify_monotonicity",
      "name_shape",
      "choose_boundary",
      "derive_updates",
      "return_boundary"
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
