import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const rotatedArraySearchQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A sorted ascending array was rotated, and you need to find a target. What is the first reasoning signal for rotated binary search?",
      "mentalModelCorrection": "A rotated sorted array is not globally sorted, so each step must detect which half is currently sorted.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice identifying the sorted half before deciding which side to discard.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_classic": "Normal nums[mid] versus target reasoning assumes the whole active range is sorted, which rotation can break.",
        "wrong_linear": "Linear scan works, but the rotated sorted structure can still support half-discarding."
      }
    },
    "id": "alg-binary-search-rotated-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_sorted_half_detection",
    "prompt": "Choose the first reasoning signal.",
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
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize sorted-half signal",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "rotated_array_search"
    ],
    "constraintSignal": "The array is rotated sorted, so one half of the current range can be identified as sorted.",
    "expectedApproachIds": [
      "rotated_array_search"
    ],
    "reasonSignal": "The sorted half gives the legal half-discard rule.",
    "rejectedApproachIds": [
      "classic_index_binary_search"
    ],
    "instruction": "A sorted ascending array was rotated, and you need to find a target. What is the first reasoning signal for rotated binary search?",
    "answerFeedback": "In rotated search, first detect which half is sorted, then decide whether target can be inside it.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Detect which half of the current range is sorted.",
        "isCorrect": true
      },
      {
        "id": "wrong_classic",
        "text": "Use normal binary search exactly as if the whole range were globally sorted.",
        "isCorrect": false
      },
      {
        "id": "wrong_linear",
        "text": "Give up immediately and scan linearly because rotation destroys all order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In a rotated sorted array without duplicates, nums[left] <= nums[mid]. What does that tell you?",
      "mentalModelCorrection": "If nums[left] <= nums[mid], the left half is sorted.",
      "mistakeTypes": [
        "cannot_explain_why",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice detecting sorted half before comparing the target range.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_right_sorted": "The comparison nums[left] <= nums[mid] directly proves the left half is sorted.",
        "wrong_target_found": "This comparison does not mean target has been found; it only identifies order structure."
      }
    },
    "id": "alg-binary-search-rotated-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_sorted_half_detection",
    "prompt": "Choose what the comparison proves.",
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Detect sorted left half",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "In a rotated sorted array without duplicates, nums[left] <= nums[mid]. What does that tell you?",
    "answerFeedback": "The range from left through mid is sorted.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The left half is sorted.",
        "isCorrect": true
      },
      {
        "id": "wrong_right_sorted",
        "text": "The right half is definitely the sorted half.",
        "isCorrect": false
      },
      {
        "id": "wrong_target_found",
        "text": "target must equal nums[mid].",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In a rotated sorted array without duplicates, nums[left] > nums[mid]. What does that usually tell you?",
      "mentalModelCorrection": "If the left half crosses the rotation break, the right half is sorted.",
      "mistakeTypes": [
        "cannot_explain_why",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice identifying the sorted side before deciding where target can live.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left_sorted": "nums[left] > nums[mid] means the left half wraps across the rotation break.",
        "wrong_invalid": "Rotation does not make binary search impossible; it changes the discard rule."
      }
    },
    "id": "alg-binary-search-rotated-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_sorted_half_detection",
    "prompt": "Choose what the comparison proves.",
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Detect sorted right half",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "In a rotated sorted array without duplicates, nums[left] > nums[mid]. What does that usually tell you?",
    "answerFeedback": "The right half is sorted when the left half crosses the rotation break.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The right half is sorted.",
        "isCorrect": true
      },
      {
        "id": "wrong_left_sorted",
        "text": "The left half is sorted.",
        "isCorrect": false
      },
      {
        "id": "wrong_invalid",
        "text": "No half can ever be discarded in a rotated array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The left half is sorted, nums[mid] is not target, and nums[left] <= target < nums[mid]. Which side should remain active?",
      "mentalModelCorrection": "When the left half is sorted and nums[left] <= target < nums[mid], target can only remain in that left half.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice using the sorted half's value range to choose the active side.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_right": "Discarding the left half would lose the sorted side whose half-open value range contains target.",
        "wrong_mid_only": "nums[mid] is already known not to be target; containment also needs nums[left] <= target."
      }
    },
    "id": "alg-binary-search-rotated-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_target_containment",
    "prompt": "Choose the active side.",
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
        "nodeId": "rotated_array_target_containment",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Keep sorted left half when target fits",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "The left half is sorted, nums[mid] is not target, and nums[left] <= target < nums[mid]. Which side should remain active?",
    "answerFeedback": "Keep the left half because nums[left] <= target < nums[mid].",
    "options": [
      {
        "id": "expected_signal",
        "text": "Keep the left half and move right toward mid.",
        "isCorrect": true
      },
      {
        "id": "wrong_right",
        "text": "Discard the left half and search only right.",
        "isCorrect": false
      },
      {
        "id": "wrong_mid_only",
        "text": "Ignore nums[left] and compare only nums[mid] with target.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The left half is sorted, nums[mid] is not target, and target does not satisfy nums[left] <= target < nums[mid]. Which side can be discarded?",
      "mentalModelCorrection": "When the sorted left half does not satisfy nums[left] <= target < nums[mid], that half cannot contain target.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice discarding the sorted half only after checking whether target fits inside it.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_left": "The sorted left half cannot contain target when target fails nums[left] <= target < nums[mid].",
        "wrong_no_discard": "The sorted-half range test gives a legal discard rule."
      }
    },
    "id": "alg-binary-search-rotated-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_target_containment",
    "prompt": "Choose the discard decision.",
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
        "nodeId": "rotated_array_target_containment",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Discard sorted left half when target does not fit",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "The left half is sorted, nums[mid] is not target, and target does not satisfy nums[left] <= target < nums[mid]. Which side can be discarded?",
    "answerFeedback": "Discard the left half because target is outside nums[left] <= target < nums[mid].",
    "options": [
      {
        "id": "expected_signal",
        "text": "Discard the left half.",
        "isCorrect": true
      },
      {
        "id": "wrong_keep_left",
        "text": "Keep the left half because sorted halves are always preferred.",
        "isCorrect": false
      },
      {
        "id": "wrong_no_discard",
        "text": "Do not discard either half because rotation makes every comparison useless.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The right half is sorted, nums[mid] is not target, and nums[mid] < target <= nums[right]. Which side should remain active?",
      "mentalModelCorrection": "When the right half is sorted and nums[mid] < target <= nums[right], target can only remain in that right half.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice applying the same sorted-half range test to the right side.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left": "Discarding the right half would lose the sorted side whose half-open value range contains target.",
        "wrong_mid_only": "nums[mid] is already known not to be target; containment also needs target <= nums[right]."
      }
    },
    "id": "alg-binary-search-rotated-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_target_containment",
    "prompt": "Choose the active side.",
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
        "nodeId": "rotated_array_target_containment",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Keep sorted right half when target fits",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "The right half is sorted, nums[mid] is not target, and nums[mid] < target <= nums[right]. Which side should remain active?",
    "answerFeedback": "Keep the right half because nums[mid] < target <= nums[right].",
    "options": [
      {
        "id": "expected_signal",
        "text": "Keep the right half and move left past mid.",
        "isCorrect": true
      },
      {
        "id": "wrong_left",
        "text": "Discard the right half and search only left.",
        "isCorrect": false
      },
      {
        "id": "wrong_mid_only",
        "text": "Ignore nums[right] and compare only nums[mid] with target.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The right half is sorted, nums[mid] is not target, and target does not satisfy nums[mid] < target <= nums[right]. Which side can be discarded?",
      "mentalModelCorrection": "When the sorted right half does not satisfy nums[mid] < target <= nums[right], that half cannot contain target.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice using the sorted half to discard exactly the impossible side.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_right": "The sorted right half cannot contain target when target fails nums[mid] < target <= nums[right].",
        "wrong_no_discard": "A sorted-half range test gives enough structure to discard one side."
      }
    },
    "id": "alg-binary-search-rotated-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_target_containment",
    "prompt": "Choose the discard decision.",
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
        "nodeId": "rotated_array_target_containment",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Discard sorted right half when target does not fit",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "The right half is sorted, nums[mid] is not target, and target does not satisfy nums[mid] < target <= nums[right]. Which side can be discarded?",
    "answerFeedback": "Discard the right half because target is outside nums[mid] < target <= nums[right].",
    "options": [
      {
        "id": "expected_signal",
        "text": "Discard the right half.",
        "isCorrect": true
      },
      {
        "id": "wrong_keep_right",
        "text": "Keep the right half because sorted halves are always preferred.",
        "isCorrect": false
      },
      {
        "id": "wrong_no_discard",
        "text": "Do not discard either half because the whole array is rotated.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Trace nums = [4, 5, 6, 7, 0, 1, 2], target = 0. Start left = 0, right = 6, mid = 3. nums[mid] = 7. Which half is sorted and does target fit there?",
      "mentalModelCorrection": "The left half [4, 5, 6, 7] is sorted, but target 0 is outside that range, so search right.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice tracing sorted-half detection before moving boundaries.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left": "The left half is sorted, but target 0 is not between 4 and 7.",
        "wrong_classic": "Normal nums[mid] > target would suggest left, but rotation requires sorted-half reasoning."
      }
    },
    "id": "alg-binary-search-rotated-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_target_containment",
    "prompt": "Choose the trace interpretation.",
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
        "nodeId": "rotated_array_target_containment",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Trace rotated search toward pivot side",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "Trace nums = [4, 5, 6, 7, 0, 1, 2], target = 0. Start left = 0, right = 6, mid = 3. nums[mid] = 7. Which half is sorted and does target fit there?",
    "answerFeedback": "The left half is sorted, but target is not inside it, so the right half remains active.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Left half is sorted; target does not fit there, so search right.",
        "isCorrect": true
      },
      {
        "id": "wrong_left",
        "text": "Left half is sorted; target fits there, so search left.",
        "isCorrect": false
      },
      {
        "id": "wrong_classic",
        "text": "Because nums[mid] > target, always search left as in normal binary search.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Trace nums = [6, 7, 0, 1, 2, 4, 5], target = 7. Start left = 0, right = 6, mid = 3. nums[mid] = 1. Which half is sorted and where should target be searched?",
      "mentalModelCorrection": "The right half [1, 2, 4, 5] is sorted, but target 7 is outside it, so search left.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice using the sorted-right range to discard it when target does not fit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_right": "The right half is sorted, but values 1 through 5 cannot contain target 7.",
        "wrong_classic": "Normal nums[mid] < target would suggest right, but rotation changes the reasoning."
      }
    },
    "id": "alg-binary-search-rotated-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_target_containment",
    "prompt": "Choose the trace interpretation.",
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
        "nodeId": "rotated_array_target_containment",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Trace rotated search toward left side",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "Trace nums = [6, 7, 0, 1, 2, 4, 5], target = 7. Start left = 0, right = 6, mid = 3. nums[mid] = 1. Which half is sorted and where should target be searched?",
    "answerFeedback": "The right half is sorted, but target is not inside its value range, so search left.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Right half is sorted; target does not fit there, so search left.",
        "isCorrect": true
      },
      {
        "id": "wrong_right",
        "text": "Right half is sorted; target fits there, so search right.",
        "isCorrect": false
      },
      {
        "id": "wrong_classic",
        "text": "Because nums[mid] < target, always search right as in normal binary search.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner uses only nums[mid] < target to choose right and nums[mid] > target to choose left in a rotated array. What mistake should you diagnose?",
      "mentalModelCorrection": "In a rotated array, nums[mid] compared with target is not enough; you must first know which half is sorted.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice reviewing whether the algorithm has a valid half-discard rule.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_classic": "That comparison rule belongs to globally sorted classic binary search.",
        "wrong_rotation_irrelevant": "Rotation changes which side may contain larger or smaller values."
      }
    },
    "id": "alg-binary-search-rotated-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_sorted_half_detection",
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
    "title": "Diagnose copied classic update rule",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A learner uses only nums[mid] < target to choose right and nums[mid] > target to choose left in a rotated array. What mistake should you diagnose?",
    "answerFeedback": "They copied classic binary search and ignored sorted-half detection.",
    "options": [
      {
        "id": "expected_signal",
        "text": "They ignored which half is sorted before discarding a side.",
        "isCorrect": true
      },
      {
        "id": "wrong_classic",
        "text": "They are correct because rotated search uses the same update rule as classic search.",
        "isCorrect": false
      },
      {
        "id": "wrong_rotation_irrelevant",
        "text": "They only need to check whether the target is numeric.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A treats the rotated array as globally sorted. Plan B first detects which half is sorted, then checks whether target fits in that half. Which plan has the correct reasoning?",
      "mentalModelCorrection": "Rotated search needs sorted-half detection because global sorted assumptions are broken.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice comparing a copied classic-search plan with the rotated-search reasoning contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_plan_a": "Global sorted assumptions can discard the half that still contains target.",
        "wrong_linear_only": "A rotated array still has enough structure for binary search when the sorted half is identified."
      }
    },
    "id": "alg-binary-search-rotated-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_target_containment",
    "prompt": "Choose the correct reasoning plan.",
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
        "nodeId": "rotated_array_target_containment",
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
    "title": "Compare classic and rotated reasoning",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Plan A treats the rotated array as globally sorted. Plan B first detects which half is sorted, then checks whether target fits in that half. Which plan has the correct reasoning?",
    "answerFeedback": "Plan B uses the rotated-array invariant: one side is sorted and can be tested against target.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Plan B, because it uses sorted-half detection before discarding a side.",
        "isCorrect": true
      },
      {
        "id": "wrong_plan_a",
        "text": "Plan A, because rotated arrays can be handled exactly like globally sorted arrays.",
        "isCorrect": false
      },
      {
        "id": "wrong_linear_only",
        "text": "Neither; rotation always forces O(n) scan.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "In rotated search with many duplicates, nums[left], nums[mid], and nums[right] can all be equal. What edge case should you recognize?",
      "mentalModelCorrection": "Duplicates can hide which half is sorted, so the clean O(log n) discard rule may not apply directly.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_explain_why"
      ],
      "nextAction": "Practice separating the distinct-values rotated search model from the duplicates-heavy edge case.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_always_half": "Equal boundaries may prevent identifying a uniquely sorted half.",
        "wrong_no_effect": "Duplicates can affect the ability to discard half safely."
      }
    },
    "id": "alg-binary-search-rotated-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_duplicate_ambiguity",
    "prompt": "Choose the edge-case warning.",
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
        "nodeId": "rotated_array_duplicate_ambiguity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "rotated_array_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize duplicate ambiguity edge case",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "In rotated search with many duplicates, nums[left], nums[mid], and nums[right] can all be equal. What edge case should you recognize?",
    "answerFeedback": "Duplicates can obscure the sorted-half signal and may force cautious boundary shrinking.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The sorted half may be ambiguous, so the clean half-discard rule can break down.",
        "isCorrect": true
      },
      {
        "id": "wrong_always_half",
        "text": "One half is always clearly sorted even when all boundary values are equal.",
        "isCorrect": false
      },
      {
        "id": "wrong_no_effect",
        "text": "Duplicates never change rotated search reasoning.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the reasoning steps for binary search in a rotated sorted array without duplicates.",
      "mentalModelCorrection": "Rotated search first checks equality, then identifies the sorted half, then tests whether target fits there, then updates boundaries.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "cannot_explain_why"
      ],
      "nextAction": "Practice deriving rotated-search updates from sorted-half containment.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-rotated-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "rotated_array_sorted_half_detection",
    "prompt": "Tap the rotated-search reasoning steps in order.",
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
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order rotated-search reasoning",
    "trackId": "algorithms",
    "type": "subgoal_ordering",
    "instruction": "Order the reasoning steps for binary search in a rotated sorted array without duplicates.",
    "answerFeedback": "Rotated search depends on equality check, sorted-half detection, target containment, safe discard, and progress.",
    "subgoals": [
      {
        "id": "check_mid_equal",
        "text": "Check whether nums[mid] equals target."
      },
      {
        "id": "identify_sorted_half",
        "text": "Identify whether the left or right half is sorted."
      },
      {
        "id": "test_target_range",
        "text": "Check whether target lies inside the sorted half's value range."
      },
      {
        "id": "discard_impossible_half",
        "text": "Discard the half that cannot contain target."
      },
      {
        "id": "preserve_progress",
        "text": "Move boundaries so the active range strictly shrinks."
      }
    ],
    "correctOrder": [
      "check_mid_equal",
      "identify_sorted_half",
      "test_target_range",
      "discard_impossible_half",
      "preserve_progress"
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
