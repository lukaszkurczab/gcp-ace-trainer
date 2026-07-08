export const lowerUpperBoundQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A sorted array may contain duplicates, and the task asks for the first index where nums[i] >= target. What boundary search is this?",
      "mentalModelCorrection": "lower_bound finds the first position whose value is at least the target.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice naming the exact boundary condition before choosing updates.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_any_match": "Any matching index is not enough when the task asks for the first valid boundary.",
        "wrong_upper": "upper_bound finds the first value greater than target, not the first value at least target."
      }
    },
    "id": "alg-binary-search-lower-upper-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A sorted array may contain duplicates, and the task asks for the first index where nums[i] >= target. What boundary search is this?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "This is lower_bound: the first index whose value is greater than or equal to target.",
        "id": "alg-binary-search-lower-upper-001-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "lower_bound: first index where nums[i] >= target."
          },
          {
            "id": "wrong_any_match",
            "text": "classic binary search: any index where nums[i] === target."
          },
          {
            "id": "wrong_upper",
            "text": "upper_bound: first index where nums[i] > target."
          }
        ],
        "prompt": "Choose the boundary search.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize lower bound",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A sorted array may contain duplicates, and the task asks for the first index where nums[i] > target. What boundary search is this?",
      "mentalModelCorrection": "upper_bound finds the first position strictly greater than the target.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice distinguishing >= from > in boundary-search contracts.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_lower": "lower_bound stops at values equal to target; upper_bound skips all equal values.",
        "wrong_last": "The task asks for the first index greater than target, not directly for the last equal index."
      }
    },
    "id": "alg-binary-search-lower-upper-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "upper_bound_contract",
    "prompt": "A sorted array may contain duplicates, and the task asks for the first index where nums[i] > target. What boundary search is this?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "This is upper_bound: the first index whose value is strictly greater than target.",
        "id": "alg-binary-search-lower-upper-002-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "upper_bound: first index where nums[i] > target."
          },
          {
            "id": "wrong_lower",
            "text": "lower_bound: first index where nums[i] >= target."
          },
          {
            "id": "wrong_last",
            "text": "classic search for the last equal target."
          }
        ],
        "prompt": "Choose the boundary search.",
        "status": "active",
        "testedSkillAtomIds": [
          "upper_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
    "title": "Recognize upper bound",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A sorted array is [1, 2, 2, 2, 5], and target is 2. What should lower_bound return?",
      "mentalModelCorrection": "lower_bound returns the first index whose value is at least target, so duplicates matter.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice reading duplicates through the boundary contract, not through any-match search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_middle": "Index 2 is an equal value, but it is not the first equal/valid boundary.",
        "wrong_after_duplicates": "The first value greater than target is upper_bound, not lower_bound."
      }
    },
    "id": "alg-binary-search-lower-upper-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A sorted array is [1, 2, 2, 2, 5], and target is 2. What should lower_bound return?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The first index with value >= 2 is index 1.",
        "id": "alg-binary-search-lower-upper-003-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "1"
          },
          {
            "id": "wrong_middle",
            "text": "2"
          },
          {
            "id": "wrong_after_duplicates",
            "text": "4"
          }
        ],
        "prompt": "Choose the lower_bound index.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Trace lower bound with duplicates",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A sorted array is [1, 2, 2, 2, 5], and target is 2. What should upper_bound return?",
      "mentalModelCorrection": "upper_bound skips all equal values and returns the first strictly greater position.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice distinguishing the first equal boundary from the first greater boundary.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_first_equal": "Index 1 is lower_bound, not upper_bound.",
        "wrong_last_equal": "Index 3 is the last equal value, but upper_bound is one position after it."
      }
    },
    "id": "alg-binary-search-lower-upper-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "upper_bound_contract",
    "prompt": "A sorted array is [1, 2, 2, 2, 5], and target is 2. What should upper_bound return?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The first index with value > 2 is index 4.",
        "id": "alg-binary-search-lower-upper-004-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "4"
          },
          {
            "id": "wrong_first_equal",
            "text": "1"
          },
          {
            "id": "wrong_last_equal",
            "text": "3"
          }
        ],
        "prompt": "Choose the upper_bound index.",
        "status": "active",
        "testedSkillAtomIds": [
          "upper_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Trace upper bound with duplicates",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the first occurrence of target in a sorted array with duplicates. Why is classic binary search that returns immediately on equality insufficient?",
      "mentalModelCorrection": "An equal mid proves target exists, but not that mid is the first occurrence.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_explain_why"
      ],
      "nextAction": "Practice matching the equality behavior to the output contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_any_equal": "Any equal index is valid only for classic found/not-found search.",
        "wrong_unsorted": "The array is sorted; the issue is duplicate boundary semantics."
      }
    },
    "id": "alg-binary-search-lower-upper-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A task asks for the first occurrence of target in a sorted array with duplicates. Why is classic binary search that returns immediately on equality insufficient?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Equality at mid does not prove there is no earlier equal value.",
        "id": "alg-binary-search-lower-upper-005-check",
        "mistakeTypes": [
          "edge_case_missed",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "It may return an equal index that is not the first occurrence."
          },
          {
            "id": "wrong_any_equal",
            "text": "It is sufficient because any equal value is always the first occurrence."
          },
          {
            "id": "wrong_unsorted",
            "text": "It is insufficient only because sorted arrays cannot contain duplicates."
          }
        ],
        "prompt": "Choose why classic equality return is insufficient.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Do not return any equal for first occurrence",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks for the last occurrence of target in a sorted array with duplicates. Which boundary relationship is useful?",
      "mentalModelCorrection": "The last equal index is one position before upper_bound(target).",
      "mistakeTypes": [
        "cannot_explain_why",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice deriving last occurrence from the first greater boundary.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_lower": "lower_bound gives the first equal/greater position, not the last equal position.",
        "wrong_any_match": "Any equal mid is not enough when the task asks for the last occurrence."
      }
    },
    "id": "alg-binary-search-lower-upper-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_first_last_occurrence_from_bounds",
    "prompt": "A task asks for the last occurrence of target in a sorted array with duplicates. Which boundary relationship is useful?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The last occurrence is upper_bound(target) - 1, after confirming target exists.",
        "id": "alg-binary-search-lower-upper-006-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "last occurrence = upper_bound(target) - 1, if that index still equals target."
          },
          {
            "id": "wrong_lower",
            "text": "last occurrence = lower_bound(target), always."
          },
          {
            "id": "wrong_any_match",
            "text": "last occurrence = any index returned by classic binary search."
          }
        ],
        "prompt": "Choose the useful boundary relationship.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_first_last_occurrence_from_bounds"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_first_last_occurrence_from_bounds",
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
    "title": "Derive last occurrence from upper bound",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(log n)",
    "complexityExplanation": "A lower_bound search halves the candidate index range each step and stores only boundary indexes.",
    "feedbackModel": {
      "decisionSignal": "A lower_bound search over n sorted values uses left, right, and mid. What time and extra space should you expect?",
      "mentalModelCorrection": "Boundary search still halves the range like classic binary search.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice explaining boundary search complexity from halving, not from duplicate handling.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-lower-upper-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "A lower_bound search over n sorted values uses left, right, and mid. What time and extra space should you expect?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(log n)",
          "space": "O(1)"
        },
        "feedback": "The search halves the index range and stores only fixed boundary state.",
        "id": "alg-binary-search-lower-upper-007-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_time_complexity"
        ],
        "type": "complexity_pair"
      }
    ],
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
        "nodeId": "lower_upper_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost lower-bound search",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A lower_bound search asks for first index where nums[i] >= target. At mid, nums[mid] >= target. Which update keeps the boundary candidate?",
      "mentalModelCorrection": "mid satisfies the boundary condition, so it may be the first valid index.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice keeping mid when it is still a possible boundary answer.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_discard_mid": "Discarding mid can skip the first valid index if mid is the boundary.",
        "wrong_go_right": "Going right ignores possible earlier valid positions."
      }
    },
    "id": "alg-binary-search-lower-upper-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A lower_bound search asks for first index where nums[i] >= target. At mid, nums[mid] >= target. Which update keeps the boundary candidate?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use right = mid in the standard no-extra-answer-variable lower_bound template.",
        "id": "alg-binary-search-lower-upper-008-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "right = mid, because mid may be the first index >= target."
          },
          {
            "id": "wrong_discard_mid",
            "text": "right = mid - 1, because every valid mid should be discarded."
          },
          {
            "id": "wrong_go_right",
            "text": "left = mid + 1, because a valid mid means the answer is later."
          }
        ],
        "prompt": "Choose the lower_bound update.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Keep valid lower-bound mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A lower_bound search asks for first index where nums[i] >= target. At mid, nums[mid] < target. Which update is correct?",
      "mentalModelCorrection": "mid is too small, so mid and all lower indexes cannot be the first valid index.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice excluding mid only when it is proven impossible.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_mid": "Keeping mid can preserve an impossible candidate and risk non-progress.",
        "wrong_go_left": "Searching left cannot find nums[i] >= target if nums[mid] is already too small in sorted order."
      }
    },
    "id": "alg-binary-search-lower-upper-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A lower_bound search asks for first index where nums[i] >= target. At mid, nums[mid] < target. Which update is correct?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use left = mid + 1 because all positions through mid are too small.",
        "id": "alg-binary-search-lower-upper-009-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "left = mid + 1"
          },
          {
            "id": "wrong_keep_mid",
            "text": "left = mid"
          },
          {
            "id": "wrong_go_left",
            "text": "right = mid"
          }
        ],
        "prompt": "Choose the lower_bound update.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Exclude too-small lower-bound mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An upper_bound search asks for first index where nums[i] > target. At mid, nums[mid] > target. Which update keeps the boundary candidate?",
      "mentalModelCorrection": "mid is a valid greater-than position and may be the first one.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice applying the boundary predicate directly: first value greater than target.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_discard_mid": "Discarding mid may skip the first value greater than target.",
        "wrong_equal_logic": "upper_bound is about > target, not >= target."
      }
    },
    "id": "alg-binary-search-lower-upper-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "upper_bound_contract",
    "prompt": "An upper_bound search asks for first index where nums[i] > target. At mid, nums[mid] > target. Which update keeps the boundary candidate?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use right = mid because mid may be the first index greater than target.",
        "id": "alg-binary-search-lower-upper-010-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "right = mid, because mid may be the first index > target."
          },
          {
            "id": "wrong_discard_mid",
            "text": "right = mid - 1, because any greater value should be removed."
          },
          {
            "id": "wrong_equal_logic",
            "text": "left = mid + 1, because greater values are treated like equal values."
          }
        ],
        "prompt": "Choose the upper_bound update.",
        "status": "active",
        "testedSkillAtomIds": [
          "upper_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Keep valid upper-bound mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An upper_bound search asks for first index where nums[i] > target. At mid, nums[mid] <= target. Which update is correct?",
      "mentalModelCorrection": "mid is not greater than target, so the first greater position must be after mid.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice treating equal values differently in upper_bound than in lower_bound.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_equal": "For upper_bound, equal values are not valid boundary positions.",
        "wrong_go_left": "If nums[mid] <= target, no position at or left of mid can be the first greater value."
      }
    },
    "id": "alg-binary-search-lower-upper-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "upper_bound_contract",
    "prompt": "An upper_bound search asks for first index where nums[i] > target. At mid, nums[mid] <= target. Which update is correct?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use left = mid + 1 because mid is not greater than target.",
        "id": "alg-binary-search-lower-upper-011-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "left = mid + 1"
          },
          {
            "id": "wrong_keep_equal",
            "text": "right = mid, because equal values are valid for upper_bound."
          },
          {
            "id": "wrong_go_left",
            "text": "right = mid - 1, because the answer must be earlier."
          }
        ],
        "prompt": "Choose the upper_bound update.",
        "status": "active",
        "testedSkillAtomIds": [
          "upper_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Skip equal values in upper-bound search",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A lower_bound search over [1, 3, 5, 7] uses target = 4. What should it return?",
      "mentalModelCorrection": "When target is absent, lower_bound returns the insertion position that keeps sorted order.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_explain_why"
      ],
      "nextAction": "Practice treating absence as an insertion-boundary result, not just failure.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_not_found": "Classic found/not-found may return -1, but lower_bound returns a boundary position.",
        "wrong_previous": "Index 1 holds 3, which is less than target and not a valid lower_bound."
      }
    },
    "id": "alg-binary-search-lower-upper-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A lower_bound search over [1, 3, 5, 7] uses target = 4. What should it return?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Index 2 is the first position with value >= 4 and the insertion position for 4.",
        "id": "alg-binary-search-lower-upper-012-check",
        "mistakeTypes": [
          "edge_case_missed",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "2"
          },
          {
            "id": "wrong_not_found",
            "text": "-1"
          },
          {
            "id": "wrong_previous",
            "text": "1"
          }
        ],
        "prompt": "Choose the lower_bound result.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Return insertion position for absent target",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A lower_bound search over [2, 4, 6] uses target = 9. What should it return?",
      "mentalModelCorrection": "If all values are smaller than target, the insertion position is n.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice handling the boundary after the last element.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_last": "The last index holds a value less than target, so it is not the first >= target.",
        "wrong_not_found": "lower_bound returns an insertion boundary, not a classic not-found sentinel."
      }
    },
    "id": "alg-binary-search-lower-upper-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A lower_bound search over [2, 4, 6] uses target = 9. What should it return?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "All values are less than 9, so lower_bound returns n, which is 3.",
        "id": "alg-binary-search-lower-upper-013-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "3"
          },
          {
            "id": "wrong_last",
            "text": "2"
          },
          {
            "id": "wrong_not_found",
            "text": "-1"
          }
        ],
        "prompt": "Choose the lower_bound result.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Return n when target is after all values",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A lower_bound search over [4, 6, 8] uses target = 1. What should it return?",
      "mentalModelCorrection": "If all values are already at least target, the first valid position is index 0.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice handling the boundary before the first element.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_not_found": "lower_bound is an insertion-boundary query, not a pure found/not-found query.",
        "wrong_first_greater": "Index 0 is valid because 4 >= 1; there is no earlier position."
      }
    },
    "id": "alg-binary-search-lower-upper-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A lower_bound search over [4, 6, 8] uses target = 1. What should it return?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The first value is already >= 1, so lower_bound returns 0.",
        "id": "alg-binary-search-lower-upper-014-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "0"
          },
          {
            "id": "wrong_not_found",
            "text": "-1"
          },
          {
            "id": "wrong_first_greater",
            "text": "1"
          }
        ],
        "prompt": "Choose the lower_bound result.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Return zero when target is before all values",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A boundary-search loop ends with left === right. A learner wants to return the last computed mid. What mistake should you diagnose?",
      "mentalModelCorrection": "Boundary search converges through the boundary variable; mid is only a midpoint probe.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice linking the return value to the loop invariant.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_mid": "The last mid may not equal the converged boundary.",
        "wrong_any_equal": "Boundary queries do not return any matching probe; they return the first valid boundary."
      }
    },
    "id": "alg-binary-search-lower-upper-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_boundary_invariant",
    "prompt": "A boundary-search loop ends with left === right. A learner wants to return the last computed mid. What mistake should you diagnose?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The return should use the converged boundary variable, usually left, not the last mid.",
        "id": "alg-binary-search-lower-upper-015-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "They are returning a midpoint probe instead of the converged boundary variable."
          },
          {
            "id": "wrong_mid",
            "text": "They are correct because mid is always the final boundary."
          },
          {
            "id": "wrong_any_equal",
            "text": "They should return mid only when nums[mid] equals target at least once."
          }
        ],
        "prompt": "Choose the mistake diagnosis.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_boundary_invariant"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "binary_search_boundary_invariant",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lower_upper_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Return boundary variable instead of mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A sorted array is [1, 2, 2, 2, 5]. lower_bound(2) returns 1 and upper_bound(2) returns 4. How many times does 2 appear?",
      "mentalModelCorrection": "The count of equal values is upper_bound(target) - lower_bound(target).",
      "mistakeTypes": [
        "cannot_explain_why",
        "edge_case_missed"
      ],
      "nextAction": "Practice using paired boundaries to derive a duplicate count.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_lower_only": "lower_bound gives the start of the equal range, not its length.",
        "wrong_upper_only": "upper_bound gives the end boundary, not the count by itself."
      }
    },
    "id": "alg-binary-search-lower-upper-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_first_last_occurrence_from_bounds",
    "prompt": "A sorted array is [1, 2, 2, 2, 5]. lower_bound(2) returns 1 and upper_bound(2) returns 4. How many times does 2 appear?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The equal range is [1, 4), so the count is 4 - 1 = 3.",
        "id": "alg-binary-search-lower-upper-016-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "3"
          },
          {
            "id": "wrong_lower_only",
            "text": "1"
          },
          {
            "id": "wrong_upper_only",
            "text": "4"
          }
        ],
        "prompt": "Choose the duplicate count.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_first_last_occurrence_from_bounds"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_first_last_occurrence_from_bounds",
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
    "title": "Count duplicates from bounds",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A uses classic binary search and returns any match. Plan B computes lower_bound and verifies nums[index] === target. The task asks for first occurrence. Which plan fits?",
      "mentalModelCorrection": "First occurrence requires a boundary, not just existence of any equal value.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "edge_case_missed"
      ],
      "nextAction": "Practice choosing boundary search when duplicates affect the output contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_classic": "Classic search can land on a later duplicate.",
        "wrong_linear": "A linear scan may find the first occurrence, but it ignores the logarithmic boundary-search option."
      }
    },
    "id": "alg-binary-search-lower-upper-017",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "Plan A uses classic binary search and returns any match. Plan B computes lower_bound and verifies nums[index] === target. The task asks for first occurrence. Which plan fits?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "lower_bound gives the first candidate position; verifying equality confirms target exists.",
        "id": "alg-binary-search-lower-upper-017-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Plan B, because first occurrence is lower_bound(target) if that position equals target."
          },
          {
            "id": "wrong_classic",
            "text": "Plan A, because any matching index is always the first occurrence."
          },
          {
            "id": "wrong_linear",
            "text": "Neither; first occurrence cannot be found in logarithmic time."
          }
        ],
        "prompt": "Choose the fitting plan.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
    "title": "Choose lower bound for first occurrence",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "output contract",
        "duplicates",
        "boundary position"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Plan B, because first occurrence is lower_bound(target) if that position equals target."
        },
        {
          "id": "wrong_classic",
          "text": "Plan A, because any matching index is always the first occurrence."
        },
        {
          "id": "wrong_linear",
          "text": "Neither; first occurrence cannot be found in logarithmic time."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A computes upper_bound(target) - 1 and verifies the index. Plan B returns any equal mid. The task asks for last occurrence. Which plan fits?",
      "mentalModelCorrection": "The last occurrence sits immediately before the first value greater than target.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "edge_case_missed"
      ],
      "nextAction": "Practice converting last occurrence into an upper-bound boundary.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_any_mid": "Any equal mid may be before the final duplicate.",
        "wrong_lower": "lower_bound finds the first equal candidate, not the last."
      }
    },
    "id": "alg-binary-search-lower-upper-018",
    "learningStage": "foundations",
    "primarySkillAtomId": "upper_bound_contract",
    "prompt": "Plan A computes upper_bound(target) - 1 and verifies the index. Plan B returns any equal mid. The task asks for last occurrence. Which plan fits?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "upper_bound(target) - 1 gives the last possible equal index after validation.",
        "id": "alg-binary-search-lower-upper-018-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Plan A, because the last occurrence is just before upper_bound(target)."
          },
          {
            "id": "wrong_any_mid",
            "text": "Plan B, because any equal mid is always the last occurrence."
          },
          {
            "id": "wrong_lower",
            "text": "Use lower_bound(target) directly because it returns the last equal index."
          }
        ],
        "prompt": "Choose the fitting plan.",
        "status": "active",
        "testedSkillAtomIds": [
          "upper_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose upper bound for last occurrence",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "last occurrence",
        "upper boundary",
        "duplicate range"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Plan A, because the last occurrence is just before upper_bound(target)."
        },
        {
          "id": "wrong_any_mid",
          "text": "Plan B, because any equal mid is always the last occurrence."
        },
        {
          "id": "wrong_lower",
          "text": "Use lower_bound(target) directly because it returns the last equal index."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A sorted array is [1, 2, 4, 4, 4, 7]. What are lower_bound(4) and upper_bound(4)?",
      "mentalModelCorrection": "lower_bound marks the start of the equal range; upper_bound marks one past the end.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_explain_why"
      ],
      "nextAction": "Practice reading duplicate ranges as half-open intervals.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_any_pair": "The returned bounds are not any two matching indexes.",
        "wrong_last_index": "upper_bound is not the last equal index; it is one past it."
      }
    },
    "id": "alg-binary-search-lower-upper-019",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_first_last_occurrence_from_bounds",
    "prompt": "A sorted array is [1, 2, 4, 4, 4, 7]. What are lower_bound(4) and upper_bound(4)?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The equal range for 4 is [2, 5), so lower_bound is 2 and upper_bound is 5.",
        "id": "alg-binary-search-lower-upper-019-check",
        "mistakeTypes": [
          "edge_case_missed",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "lower_bound = 2, upper_bound = 5"
          },
          {
            "id": "wrong_any_pair",
            "text": "lower_bound = 3, upper_bound = 4"
          },
          {
            "id": "wrong_last_index",
            "text": "lower_bound = 2, upper_bound = 4"
          }
        ],
        "prompt": "Choose the two bounds.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_first_last_occurrence_from_bounds"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_first_last_occurrence_from_bounds",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lower_upper_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Trace duplicate range bounds",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner says lower_bound and upper_bound are the same when target exists because both find target. What correction should you make?",
      "mentalModelCorrection": "lower_bound can land on the first equal value, while upper_bound lands after the equal run.",
      "mistakeTypes": [
        "cannot_explain_why",
        "edge_case_missed"
      ],
      "nextAction": "Practice explaining the strictness difference between >= and >.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_same": "Duplicates expose the difference: first equal versus first greater.",
        "wrong_no_duplicates": "Even with one occurrence, upper_bound is usually one position after that occurrence."
      }
    },
    "id": "alg-binary-search-lower-upper-020",
    "learningStage": "foundations",
    "primarySkillAtomId": "upper_bound_contract",
    "prompt": "A learner says lower_bound and upper_bound are the same when target exists because both find target. What correction should you make?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "lower_bound finds the first >= target; upper_bound finds the first > target.",
        "id": "alg-binary-search-lower-upper-020-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "lower_bound uses >= target, while upper_bound uses > target."
          },
          {
            "id": "wrong_same",
            "text": "They are the same whenever the target appears at least once."
          },
          {
            "id": "wrong_no_duplicates",
            "text": "They differ only when the target does not exist."
          }
        ],
        "prompt": "Choose the correction.",
        "status": "active",
        "testedSkillAtomIds": [
          "upper_bound_contract"
        ],
        "type": "single_choice"
      }
    ],
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
    "title": "Correct lower versus upper misconception",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the steps for implementing lower_bound(target) on a sorted array.",
      "mentalModelCorrection": "lower_bound is a first-valid-position search: define the predicate, keep valid mid, discard invalid mid, and return the converged boundary.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice deriving lower_bound from the boundary predicate instead of memorizing code.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-lower-upper-021",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "Order the steps for implementing lower_bound(target) on a sorted array.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "define_predicate",
          "initialize_bounds",
          "check_mid",
          "keep_valid_mid",
          "discard_invalid_mid",
          "return_left"
        ],
        "feedback": "lower_bound searches for the first index satisfying nums[i] >= target and returns the converged left boundary.",
        "id": "alg-binary-search-lower-upper-021-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "define_predicate",
            "text": "Define the boundary predicate: nums[i] >= target."
          },
          {
            "id": "initialize_bounds",
            "text": "Initialize bounds over possible insertion positions."
          },
          {
            "id": "check_mid",
            "text": "Check whether nums[mid] satisfies the predicate."
          },
          {
            "id": "keep_valid_mid",
            "text": "If nums[mid] >= target, keep mid by moving right to mid."
          },
          {
            "id": "discard_invalid_mid",
            "text": "If nums[mid] < target, discard mid by moving left to mid + 1."
          },
          {
            "id": "return_left",
            "text": "Return left after the range converges."
          }
        ],
        "prompt": "Tap the lower_bound steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "lower_bound_contract"
        ],
        "type": "order_steps"
      }
    ],
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order lower-bound implementation",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the steps for counting occurrences of target in a sorted array using bounds.",
      "mentalModelCorrection": "Counting duplicates is a range-boundary task: find the start, find the end, then subtract.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice composing lower_bound and upper_bound instead of relying on any one match.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-lower-upper-022",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_first_last_occurrence_from_bounds",
    "prompt": "Order the steps for counting occurrences of target in a sorted array using bounds.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "find_lower",
          "find_upper",
          "subtract_bounds"
        ],
        "feedback": "The equal range is [lower_bound(target), upper_bound(target)), so the count is upper - lower even when target is absent.",
        "id": "alg-binary-search-lower-upper-022-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "find_lower",
            "text": "Find lower_bound(target), the first index with value >= target."
          },
          {
            "id": "find_upper",
            "text": "Find upper_bound(target), the first index with value > target."
          },
          {
            "id": "subtract_bounds",
            "text": "Compute count as upper - lower."
          }
        ],
        "prompt": "Tap the duplicate-count steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_first_last_occurrence_from_bounds"
        ],
        "type": "order_steps"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_first_last_occurrence_from_bounds",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lower_upper_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order duplicate-count bounds",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  }
];
