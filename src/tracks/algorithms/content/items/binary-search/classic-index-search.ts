export const classicIndexSearchQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A sorted ascending array stores numbers, and you need to find whether target exists at some index. Which strategy signal fits?",
      "mentalModelCorrection": "Classic binary search is valid when the array is sorted and the task is to find a stored target value.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming the sorted indexed search signal before writing boundaries.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_linear": "Linear scan works, but sorted order gives a stronger halving strategy.",
        "wrong_answer_search": "The task searches for a stored value at an index, not a minimum feasible answer."
      }
    },
    "id": "alg-binary-search-classic-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "A sorted ascending array stores numbers, and you need to find whether target exists at some index. Which strategy signal fits?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Sorted indexed lookup is the classic binary search signal.",
        "id": "alg-binary-search-classic-001-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use classic binary search because sorted order lets each comparison discard half the indexes."
          },
          {
            "id": "wrong_linear",
            "text": "Use linear scan because every search problem should inspect values from left to right."
          },
          {
            "id": "wrong_answer_search",
            "text": "Use binary search on answer because every numeric target is an answer-space problem."
          }
        ],
        "prompt": "Choose the strategy signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_binary_search_signal"
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
    "title": "Recognize classic sorted lookup",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "classic_index_binary_search"
    ],
    "constraintSignal": "The input is a sorted indexed array and the target is a stored value.",
    "expectedApproachIds": [
      "classic_index_binary_search"
    ],
    "reasonSignal": "Sorted order lets each mid comparison discard half of the remaining indexes.",
    "rejectedApproachIds": [
      "linear_scan_default",
      "binary_search_on_answer"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use classic binary search because sorted order lets each comparison discard half the indexes."
        },
        {
          "id": "wrong_linear",
          "text": "Use linear scan because every search problem should inspect values from left to right."
        },
        {
          "id": "wrong_answer_search",
          "text": "Use binary search on answer because every numeric target is an answer-space problem."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(log n)",
    "complexityExplanation": "Each comparison checks the middle item and discards about half of the remaining index range. Only boundary indexes and mid are stored.",
    "feedbackModel": {
      "decisionSignal": "A classic binary search runs over a sorted array of n numbers using left, right, and mid indexes. What time and extra space should you expect?",
      "mentalModelCorrection": "The logarithmic time comes from halving the active index range, not from the number of variables.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice explaining O(log n) from range halving.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-classic-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "A classic binary search runs over a sorted array of n numbers using left, right, and mid indexes. What time and extra space should you expect?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(log n)",
          "space": "O(1)"
        },
        "feedback": "Binary search halves the remaining candidate range and stores only fixed index state.",
        "id": "alg-binary-search-classic-002-check",
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
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost classic binary search",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Why does classic binary search run in O(log n) on a sorted indexed array?",
      "mentalModelCorrection": "The active range shrinks by about half after each comparison.",
      "mistakeTypes": [
        "cannot_explain_why",
        "complexity_mismatch"
      ],
      "nextAction": "Practice tying the Big-O label to the halving operation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_variable_names": "Variable names such as left and right do not cause logarithmic growth.",
        "wrong_sorted_only": "Sorted order is the required precondition, but the time explanation is the repeated halving."
      }
    },
    "id": "alg-binary-search-classic-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Why does classic binary search run in O(log n) on a sorted indexed array?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The key reason is that every comparison removes about half of the remaining candidates.",
        "id": "alg-binary-search-classic-003-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Each mid comparison discards about half of the remaining index range."
          },
          {
            "id": "wrong_variable_names",
            "text": "The algorithm is O(log n) because it uses variables named left, right, and mid."
          },
          {
            "id": "wrong_sorted_only",
            "text": "The algorithm is O(log n) only because the array is sorted; the halving does not matter."
          }
        ],
        "prompt": "Choose the correct explanation.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_time_complexity"
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
        "nodeId": "derive_time_complexity",
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
    "title": "Explain halving growth",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A classic binary search checks nums[mid] and finds nums[mid] === target. What should happen?",
      "mentalModelCorrection": "In classic found/not-found search, any matching index satisfies the contract.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice matching equality behavior to the output contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_searching": "Keeping the search going is needed for first/last occurrence variants, not for classic any-match lookup.",
        "wrong_discard": "A matching mid is not impossible; it is the desired result."
      }
    },
    "id": "alg-binary-search-classic-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_found_not_found_contract",
    "prompt": "A classic binary search checks nums[mid] and finds nums[mid] === target. What should happen?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Return mid because the classic contract accepts any matching target index.",
        "id": "alg-binary-search-classic-004-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Return mid, because a valid target index has been found."
          },
          {
            "id": "wrong_keep_searching",
            "text": "Always continue left to find the first occurrence."
          },
          {
            "id": "wrong_discard",
            "text": "Discard mid because equality does not decide which half to search."
          }
        ],
        "prompt": "Choose the equality behavior.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_found_not_found_contract"
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
        "nodeId": "classic_binary_search_found_not_found_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Return on exact match",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In a sorted ascending array, nums[mid] is smaller than target during classic binary search. Which half becomes impossible?",
      "mentalModelCorrection": "If nums[mid] is too small, mid and all lower indexes are too small.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice explaining the discarded half from sorted order.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_right": "The right half contains larger values and may still contain target.",
        "wrong_mid_only": "Sorted order also rules out everything left of mid."
      }
    },
    "id": "alg-binary-search-classic-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "In a sorted ascending array, nums[mid] is smaller than target during classic binary search. Which half becomes impossible?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The left side through mid is impossible because those values are <= nums[mid] and therefore too small.",
        "id": "alg-binary-search-classic-005-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Indexes at mid and to the left of mid become impossible."
          },
          {
            "id": "wrong_right",
            "text": "Indexes to the right of mid become impossible."
          },
          {
            "id": "wrong_mid_only",
            "text": "Only mid becomes impossible; sorted order gives no information about the left side."
          }
        ],
        "prompt": "Choose the impossible half.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_discard_rule"
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
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Discard too-small left half",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In a sorted ascending array, nums[mid] is greater than target during classic binary search. Which half becomes impossible?",
      "mentalModelCorrection": "If nums[mid] is too large, mid and all higher indexes are too large.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice using sorted order to discard exactly the impossible side.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left": "The left half contains smaller values and may still contain target.",
        "wrong_mid_only": "Sorted order also rules out everything right of mid."
      }
    },
    "id": "alg-binary-search-classic-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "In a sorted ascending array, nums[mid] is greater than target during classic binary search. Which half becomes impossible?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The right side from mid onward is impossible because those values are >= nums[mid] and therefore too large.",
        "id": "alg-binary-search-classic-006-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Indexes at mid and to the right of mid become impossible."
          },
          {
            "id": "wrong_left",
            "text": "Indexes to the left of mid become impossible."
          },
          {
            "id": "wrong_mid_only",
            "text": "Only mid becomes impossible; sorted order gives no information about the right side."
          }
        ],
        "prompt": "Choose the impossible half.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_discard_rule"
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
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Discard too-large right half",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A classic binary search over sorted ascending values has nums[mid] < target. Which boundary update should follow?",
      "mentalModelCorrection": "Since mid is too small, the next candidate range starts after mid.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice choosing the boundary movement from the comparison result.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_right": "Moving right leftward searches smaller values, but target must be larger than nums[mid].",
        "wrong_keep_mid": "Keeping mid does not remove a proven-impossible value and can risk non-progress."
      }
    },
    "id": "alg-binary-search-classic-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "A classic binary search over sorted ascending values has nums[mid] < target. Which boundary update should follow?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use left = mid + 1 because target can only be to the right.",
        "id": "alg-binary-search-classic-007-check",
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
            "id": "wrong_right",
            "text": "right = mid - 1"
          },
          {
            "id": "wrong_keep_mid",
            "text": "left = mid"
          }
        ],
        "prompt": "Choose the boundary update.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_discard_rule"
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
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Update left after smaller mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A classic binary search over sorted ascending values has nums[mid] > target. Which boundary update should follow?",
      "mentalModelCorrection": "Since mid is too large, the next candidate range ends before mid.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice choosing the boundary movement from the comparison result.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left": "Moving left rightward searches larger values, but target must be smaller than nums[mid].",
        "wrong_keep_mid": "Keeping mid does not remove a proven-impossible value and can risk non-progress."
      }
    },
    "id": "alg-binary-search-classic-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "A classic binary search over sorted ascending values has nums[mid] > target. Which boundary update should follow?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use right = mid - 1 because target can only be to the left.",
        "id": "alg-binary-search-classic-008-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "right = mid - 1"
          },
          {
            "id": "wrong_left",
            "text": "left = mid + 1"
          },
          {
            "id": "wrong_keep_mid",
            "text": "right = mid"
          }
        ],
        "prompt": "Choose the boundary update.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_discard_rule"
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
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Update right after larger mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Trace classic binary search on nums = [2, 5, 9, 14, 20], target = 14. Start left = 0, right = 4. What happens after checking mid = 2?",
      "mentalModelCorrection": "nums[2] is 9, which is smaller than 14, so the left side through mid is impossible.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice tracing the comparison result into a boundary update.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left_half": "The target is larger than nums[mid], so searching left would discard the target.",
        "wrong_return": "nums[mid] is not equal to target yet."
      }
    },
    "id": "alg-binary-search-classic-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "Trace classic binary search on nums = [2, 5, 9, 14, 20], target = 14. Start left = 0, right = 4. What happens after checking mid = 2?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "nums[2] = 9 is smaller than 14, so set left = 3.",
        "id": "alg-binary-search-classic-009-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Set left = 3 because nums[2] is too small."
          },
          {
            "id": "wrong_left_half",
            "text": "Set right = 1 because target must be in the left half."
          },
          {
            "id": "wrong_return",
            "text": "Return 2 because mid is the checked index."
          }
        ],
        "prompt": "Choose the next trace step.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_discard_rule"
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
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Trace smaller mid update",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Trace classic binary search on nums = [2, 5, 9, 14, 20], target = 14. After left becomes 3 and right is 4, mid = 3. What should happen?",
      "mentalModelCorrection": "nums[3] equals target, so classic binary search can return that index.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice recognizing when the classic search contract is already satisfied.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_continue": "First/last occurrence logic is not required by this classic found/not-found contract.",
        "wrong_right": "nums[mid] is not too large; it equals target."
      }
    },
    "id": "alg-binary-search-classic-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_found_not_found_contract",
    "prompt": "Trace classic binary search on nums = [2, 5, 9, 14, 20], target = 14. After left becomes 3 and right is 4, mid = 3. What should happen?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "nums[3] = 14, so return index 3.",
        "id": "alg-binary-search-classic-010-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Return 3 because nums[3] equals target."
          },
          {
            "id": "wrong_continue",
            "text": "Continue left because every duplicate-aware search must find the first match."
          },
          {
            "id": "wrong_right",
            "text": "Set right = 2 because the checked value is too large."
          }
        ],
        "prompt": "Choose the next trace step.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_found_not_found_contract"
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
        "nodeId": "classic_binary_search_found_not_found_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Trace exact match return",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A classic binary search over nums = [1, 4, 7] searches for target = 6. After all candidates are discarded, left > right. What should the function return?",
      "mentalModelCorrection": "In a classic found/not-found contract, crossed bounds mean target is absent.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice linking the loop exit state to the not-found contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left": "left may be an insertion point in another variant, but this classic contract asks for found/not-found.",
        "wrong_last_mid": "The last mid was inspected and rejected."
      }
    },
    "id": "alg-binary-search-classic-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_found_not_found_contract",
    "prompt": "A classic binary search over nums = [1, 4, 7] searches for target = 6. After all candidates are discarded, left > right. What should the function return?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Return the not-found sentinel, commonly -1.",
        "id": "alg-binary-search-classic-011-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Return -1 or the contract's not-found sentinel."
          },
          {
            "id": "wrong_left",
            "text": "Return left because it is always the target index."
          },
          {
            "id": "wrong_last_mid",
            "text": "Return the last mid because it was closest to target."
          }
        ],
        "prompt": "Choose the not-found behavior.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_found_not_found_contract"
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
        "nodeId": "classic_binary_search_found_not_found_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Return sentinel when absent",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner wants to use classic binary search on [8, 1, 5, 3] to find target = 5. What precondition is missing?",
      "mentalModelCorrection": "Classic binary search requires sorted order so a mid comparison can discard a half safely.",
      "mistakeTypes": [
        "constraint_ignored",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice checking the sorted precondition before choosing classic index search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_numeric": "Numeric values alone are not enough; they must be ordered.",
        "wrong_target_exists": "Knowing the target exists does not make mid comparisons safe without sorted order."
      }
    },
    "id": "alg-binary-search-classic-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "A learner wants to use classic binary search on [8, 1, 5, 3] to find target = 5. What precondition is missing?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The array is not sorted, so a mid comparison does not justify discarding half.",
        "id": "alg-binary-search-classic-012-check",
        "mistakeTypes": [
          "constraint_ignored",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Sorted order is missing."
          },
          {
            "id": "wrong_numeric",
            "text": "Numeric values are missing."
          },
          {
            "id": "wrong_target_exists",
            "text": "A guarantee that target exists is missing; sorted order is optional."
          }
        ],
        "prompt": "Choose the missing precondition.",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_binary_search_signal"
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
    "title": "Reject classic search on unsorted input",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "The array is not sorted, so mid comparison does not identify an impossible half.",
    "expectedApproachIds": [
      "linear_scan_default"
    ],
    "reasonSignal": "Classic binary search requires sorted indexed order.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Sorted order is missing."
        },
        {
          "id": "wrong_numeric",
          "text": "Numeric values are missing."
        },
        {
          "id": "wrong_target_exists",
          "text": "A guarantee that target exists is missing; sorted order is optional."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A scans a sorted array from left to right. Plan B uses classic binary search. The task only needs any index of target. Which comparison is decisive?",
      "mentalModelCorrection": "Sorted order lets binary search discard half the range each step, while linear scan removes one value at a time.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice choosing binary search when the sorted-indexed precondition fits the contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_scan": "Linear scan is simpler but does not use the sorted order to reduce search work.",
        "wrong_same": "Both can find the target, but their growth rates differ."
      }
    },
    "id": "alg-binary-search-classic-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "Plan A scans a sorted array from left to right. Plan B uses classic binary search. The task only needs any index of target. Which comparison is decisive?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Binary search is O(log n), while linear scan is O(n).",
        "id": "alg-binary-search-classic-013-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Binary search uses sorted order to reduce the candidate range by half, giving O(log n)."
          },
          {
            "id": "wrong_scan",
            "text": "Linear scan is better because it checks values in the same order as the array."
          },
          {
            "id": "wrong_same",
            "text": "They scale the same because both inspect array values."
          }
        ],
        "prompt": "Choose the decisive comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_discard_rule"
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
        "nodeId": "classic_binary_search_discard_rule",
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
    "title": "Prefer binary search over linear scan",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "sorted input",
        "discarded candidates",
        "growth rate"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Binary search uses sorted order to reduce the candidate range by half, giving O(log n)."
        },
        {
          "id": "wrong_scan",
          "text": "Linear scan is better because it checks values in the same order as the array."
        },
        {
          "id": "wrong_same",
          "text": "They scale the same because both inspect array values."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner says classic binary search works because target is numeric. What correction should you make?",
      "mentalModelCorrection": "The needed property is ordered indexed data, not numeric type alone.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming the property that makes half-discarding valid.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_numeric": "Numeric values can still be unsorted.",
        "wrong_target": "Knowing a target value does not itself create discardable halves."
      }
    },
    "id": "alg-binary-search-classic-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "A learner says classic binary search works because target is numeric. What correction should you make?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Classic binary search needs sorted order so comparisons identify impossible halves.",
        "id": "alg-binary-search-classic-014-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "It works because sorted order makes half-discarding valid, not because the target is numeric."
          },
          {
            "id": "wrong_numeric",
            "text": "They are correct; any numeric target can be found with binary search."
          },
          {
            "id": "wrong_target",
            "text": "It works only if the target is guaranteed to exist."
          }
        ],
        "prompt": "Choose the correction.",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_binary_search_signal"
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
    "title": "Correct numeric-target misconception",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A classic search runs on an empty sorted array. left = 0 and right = -1. What should happen?",
      "mentalModelCorrection": "The search range is empty immediately, so the loop should not run and the function should return not found.",
      "mistakeTypes": [
        "edge_case_missed"
      ],
      "nextAction": "Practice checking empty and one-element arrays against the chosen loop condition.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_mid": "There is no valid mid index in an empty array.",
        "wrong_found": "Sorted order does not imply the target exists."
      }
    },
    "id": "alg-binary-search-classic-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_found_not_found_contract",
    "prompt": "A classic search runs on an empty sorted array. left = 0 and right = -1. What should happen?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The inclusive range is empty because left > right, so return not found.",
        "id": "alg-binary-search-classic-015-check",
        "mistakeTypes": [
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The loop should not run, and the function should return the not-found sentinel."
          },
          {
            "id": "wrong_mid",
            "text": "Compute mid = 0 and inspect nums[0]."
          },
          {
            "id": "wrong_found",
            "text": "Return 0 because an empty sorted array has a valid insertion point."
          }
        ],
        "prompt": "Choose the empty-array behavior.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_found_not_found_contract"
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
        "nodeId": "classic_binary_search_found_not_found_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Handle empty classic search",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the steps for classic binary search over a sorted indexed array.",
      "mentalModelCorrection": "Classic binary search repeatedly compares the middle value, returns on match, and otherwise discards the impossible half.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice deriving the control flow from the sorted-order invariant.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-classic-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "Order the steps for classic binary search over a sorted indexed array.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "confirm_sorted",
          "set_bounds",
          "check_mid",
          "return_if_equal",
          "discard_half",
          "return_not_found"
        ],
        "feedback": "Start from the sorted precondition, set bounds, compare mid, return on equality, otherwise discard the impossible half until no candidates remain.",
        "id": "alg-binary-search-classic-016-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "confirm_sorted",
            "text": "Confirm the array is sorted in the direction the comparisons assume."
          },
          {
            "id": "set_bounds",
            "text": "Initialize left and right to cover the candidate index range."
          },
          {
            "id": "check_mid",
            "text": "Compare nums[mid] with target."
          },
          {
            "id": "return_if_equal",
            "text": "Return mid if nums[mid] equals target."
          },
          {
            "id": "discard_half",
            "text": "Move one boundary to discard the half that cannot contain target."
          },
          {
            "id": "return_not_found",
            "text": "Return the not-found sentinel when no candidates remain."
          }
        ],
        "prompt": "Tap the classic binary-search steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "classic_binary_search_discard_rule"
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
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order classic binary-search flow",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  }
];
