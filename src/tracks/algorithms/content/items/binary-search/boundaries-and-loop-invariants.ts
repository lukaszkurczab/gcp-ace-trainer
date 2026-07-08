export const boundariesAndLoopInvariantsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A classic binary search uses inclusive bounds left and right, both valid indexes. Which loop condition matches that contract?",
      "mentalModelCorrection": "When both endpoints are still candidates, the loop must continue while left <= right.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice matching loop condition to whether right is included or excluded.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_half_open": "left < right is common for half-open or boundary templates, but it skips the final one-candidate check in this inclusive found/not-found contract.",
        "wrong_empty_only": "left === right is a valid one-candidate state, not automatically an empty range."
      }
    },
    "id": "alg-binary-search-boundaries-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_interval_contract",
    "prompt": "A classic binary search uses inclusive bounds left and right, both valid indexes. Which loop condition matches that contract?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "For inclusive [left, right], left === right still means one candidate remains, so use left <= right.",
        "id": "alg-binary-search-boundaries-001-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "while (left <= right), because left === right still contains one candidate."
          },
          {
            "id": "wrong_half_open",
            "text": "while (left < right), because binary search should stop before one candidate remains."
          },
          {
            "id": "wrong_empty_only",
            "text": "while (left === right), because only the final candidate matters."
          }
        ],
        "prompt": "Choose the loop condition.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_interval_contract"
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
        "nodeId": "binary_search_interval_contract",
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
    "title": "Choose inclusive loop condition",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "In classic binary search over a sorted ascending array, nums[mid] is smaller than target. Which update preserves the invariant?",
      "mentalModelCorrection": "If nums[mid] is too small, mid and everything left of it cannot be the target.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice tying each comparison result to the half that becomes impossible.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_right": "Moving right leftward would discard larger values where the target may still exist.",
        "wrong_keep_mid": "Keeping mid can fail to shrink the range when mid equals left."
      }
    },
    "id": "alg-binary-search-boundaries-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "In classic binary search over a sorted ascending array, nums[mid] is smaller than target. Which update preserves the invariant?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use left = mid + 1 because mid is known too small and cannot remain a candidate.",
        "id": "alg-binary-search-boundaries-002-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "left = mid + 1, because mid and lower indexes are too small."
          },
          {
            "id": "wrong_right",
            "text": "right = mid - 1, because the target must be in the smaller half."
          },
          {
            "id": "wrong_keep_mid",
            "text": "left = mid, because mid might still become the answer later."
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
    "title": "Move left after too-small mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "In classic binary search over a sorted ascending array, nums[mid] is greater than target. Which update preserves the invariant?",
      "mentalModelCorrection": "If nums[mid] is too large, mid and everything right of it cannot be the target.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice eliminating exactly the half that cannot contain the target.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left": "Moving left rightward would discard smaller values where the target may still exist.",
        "wrong_keep_mid": "Keeping mid can fail to shrink the range when mid equals right."
      }
    },
    "id": "alg-binary-search-boundaries-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "In classic binary search over a sorted ascending array, nums[mid] is greater than target. Which update preserves the invariant?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use right = mid - 1 because mid is known too large and cannot remain a candidate.",
        "id": "alg-binary-search-boundaries-003-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "right = mid - 1, because mid and higher indexes are too large."
          },
          {
            "id": "wrong_left",
            "text": "left = mid + 1, because the target must be in the larger half."
          },
          {
            "id": "wrong_keep_mid",
            "text": "right = mid, because mid might still become the answer later."
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
    "title": "Move right after too-large mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "An inclusive classic binary search uses while (left <= right). On nums[mid] > target, a teammate writes right = mid. What risk should you catch?",
      "mentalModelCorrection": "In an inclusive found/not-found template, mid is already proven impossible and must be excluded.",
      "mistakeTypes": [
        "edge_case_missed",
        "state_progress_error"
      ],
      "nextAction": "Practice checking whether every update strictly shrinks the inclusive range.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_candidate": "mid is not still a candidate after nums[mid] > target in classic value search.",
        "wrong_style": "This is not just a style choice; it can keep the same range size."
      }
    },
    "id": "alg-binary-search-boundaries-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_loop_progress",
    "prompt": "An inclusive classic binary search uses while (left <= right). On nums[mid] > target, a teammate writes right = mid. What risk should you catch?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "right = mid can fail to exclude mid and may not shrink the range. Use right = mid - 1 in this template.",
        "id": "alg-binary-search-boundaries-004-check",
        "mistakeTypes": [
          "edge_case_missed",
          "state_progress_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The range may not shrink because mid is kept even though it is already too large."
          },
          {
            "id": "wrong_candidate",
            "text": "The update is required because mid might still equal target later."
          },
          {
            "id": "wrong_style",
            "text": "There is no correctness issue; right = mid and right = mid - 1 are interchangeable."
          }
        ],
        "prompt": "Choose the risk.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_loop_progress"
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
        "nodeId": "binary_search_loop_progress",
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
    "title": "Catch inclusive right equals mid risk",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A lower-bound style search uses while (left < right) and keeps the first feasible position as a candidate. feasible(mid) is true. Which update fits?",
      "mentalModelCorrection": "When mid may be the first feasible answer, keep it by moving right to mid.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice distinguishing templates that exclude mid from templates that keep mid as a candidate.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_exclude": "right = mid - 1 can discard the first feasible answer unless an answer variable is separately saved.",
        "wrong_go_right": "If mid is feasible for first-feasible search, larger positions are not needed yet."
      }
    },
    "id": "alg-binary-search-boundaries-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_boundary_invariant",
    "prompt": "A lower-bound style search uses while (left < right) and keeps the first feasible position as a candidate. feasible(mid) is true. Which update fits?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use right = mid because mid may be the first feasible position.",
        "id": "alg-binary-search-boundaries-005-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "right = mid, because mid is feasible and may be the first feasible position."
          },
          {
            "id": "wrong_exclude",
            "text": "right = mid - 1, because feasible positions should always be discarded."
          },
          {
            "id": "wrong_go_right",
            "text": "left = mid + 1, because feasible means the answer is to the right."
          }
        ],
        "prompt": "Choose the boundary update.",
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
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Keep feasible mid in lower-bound template",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A half-open style search has while (left < right), mid = Math.floor((left + right) / 2), and update left = mid when mid is too small. What can go wrong?",
      "mentalModelCorrection": "When mid equals left, left = mid does not shrink the range.",
      "mistakeTypes": [
        "state_progress_error",
        "edge_case_missed"
      ],
      "nextAction": "Practice testing boundary updates on two-candidate ranges.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_shrinks": "With left = 0 and right = 1, mid is 0, so left = mid leaves the range unchanged.",
        "wrong_mid_formula": "The floor mid formula is normal; the problem is the non-shrinking update."
      }
    },
    "id": "alg-binary-search-boundaries-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_loop_progress",
    "prompt": "A half-open style search has while (left < right), mid = Math.floor((left + right) / 2), and update left = mid when mid is too small. What can go wrong?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "On a two-candidate range, mid can equal left, so left = mid does not make progress.",
        "id": "alg-binary-search-boundaries-006-check",
        "mistakeTypes": [
          "state_progress_error",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The range may not shrink when mid equals left, causing an infinite loop."
          },
          {
            "id": "wrong_shrinks",
            "text": "The range always shrinks because mid is recomputed."
          },
          {
            "id": "wrong_mid_formula",
            "text": "The only issue is that mid should never use Math.floor."
          }
        ],
        "prompt": "Choose the failure mode.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_loop_progress"
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
        "nodeId": "binary_search_loop_progress",
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
    "title": "Catch non-shrinking left equals mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The active range is left = 0, right = 1. mid is computed with floor, so mid = 0. The update is left = mid. What does this trace reveal?",
      "mentalModelCorrection": "Small traces expose whether a boundary update makes progress.",
      "mistakeTypes": [
        "state_progress_error",
        "edge_case_missed"
      ],
      "nextAction": "Practice tracing two-element ranges before trusting a binary-search template.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_ok": "The next iteration has the same left, right, and mid.",
        "wrong_exit": "The loop condition left < right remains true when left = 0 and right = 1."
      }
    },
    "id": "alg-binary-search-boundaries-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_loop_progress",
    "prompt": "The active range is left = 0, right = 1. mid is computed with floor, so mid = 0. The update is left = mid. What does this trace reveal?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The update leaves left at 0, so the same range repeats.",
        "id": "alg-binary-search-boundaries-007-check",
        "mistakeTypes": [
          "state_progress_error",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The update does not shrink the range, so the loop can repeat forever."
          },
          {
            "id": "wrong_ok",
            "text": "The update is safe because mid was inside the range."
          },
          {
            "id": "wrong_exit",
            "text": "The update exits immediately because left now equals right."
          }
        ],
        "prompt": "Choose what the trace reveals.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_loop_progress"
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
        "nodeId": "binary_search_loop_progress",
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
    "title": "Trace two-candidate non-progress",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "In ascending classic binary search, nums[mid] < target proves that mid and lower indexes cannot contain target. Which invariant must remain true after moving left to mid + 1?",
      "mentalModelCorrection": "After moving left to mid + 1, every still-possible target index must remain inside the active range.",
      "mistakeTypes": [
        "constraint_ignored",
        "edge_case_missed"
      ],
      "nextAction": "Practice stating the invariant after each boundary movement.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_mid_possible": "mid is too small, so mid itself is no longer possible.",
        "wrong_any_half": "The chosen half must be justified by sorted order and the comparison result."
      }
    },
    "id": "alg-binary-search-boundaries-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_boundary_invariant",
    "prompt": "A binary search update discards the left half through mid because nums[mid] < target. Which invariant must remain true after the update?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "After moving left to mid + 1, every still-possible target index must remain inside the active range.",
        "id": "alg-binary-search-boundaries-008-check",
        "mistakeTypes": [
          "constraint_ignored",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Every still-possible target index remains inside [left, right]."
          },
          {
            "id": "wrong_mid_possible",
            "text": "mid must remain inside the range because it was just inspected."
          },
          {
            "id": "wrong_any_half",
            "text": "Any half may be discarded as long as the range becomes smaller."
          }
        ],
        "prompt": "Choose the invariant.",
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
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Preserve possible-target invariant",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An inclusive classic search exits when left becomes greater than right. What should be returned if no target was found?",
      "mentalModelCorrection": "In a found/not-found search, crossing bounds means the target is absent.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice connecting loop exit state to the problem's output contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_left": "left may be an insertion point, but classic found/not-found usually returns a not-found sentinel.",
        "wrong_mid": "The last mid was already rejected by comparison."
      }
    },
    "id": "alg-binary-search-boundaries-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "classic_binary_search_found_not_found_contract",
    "prompt": "An inclusive classic search exits when left becomes greater than right. What should be returned if no target was found?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Return the not-found value required by the contract, commonly -1.",
        "id": "alg-binary-search-boundaries-009-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Return the not-found sentinel, such as -1."
          },
          {
            "id": "wrong_left",
            "text": "Always return left, because left is the target index."
          },
          {
            "id": "wrong_mid",
            "text": "Return the last mid, because it was the final checked position."
          }
        ],
        "prompt": "Choose the return behavior.",
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
    "title": "Return not-found after crossed bounds",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A half-open lower-bound search uses left = 0 and right = n. What does right = n mean at initialization?",
      "mentalModelCorrection": "In a half-open range [left, right), right is one past the last valid index and can also represent insertion at the end.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice naming whether right is inclusive or exclusive before choosing updates.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_valid_index": "n is not a valid array index.",
        "wrong_bug": "right = n is intentional in half-open templates."
      }
    },
    "id": "alg-binary-search-boundaries-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_interval_contract",
    "prompt": "A half-open lower-bound search uses left = 0 and right = n. What does right = n mean at initialization?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "right is exclusive: the active range is [0, n), and n can be the insertion position after all elements.",
        "id": "alg-binary-search-boundaries-010-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "right is exclusive; the range is [0, n), and n can represent insertion after the last element."
          },
          {
            "id": "wrong_valid_index",
            "text": "right is the last valid index being searched."
          },
          {
            "id": "wrong_bug",
            "text": "right = n is always an out-of-bounds bug in binary search."
          }
        ],
        "prompt": "Choose the meaning of right = n.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_interval_contract"
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
        "nodeId": "binary_search_interval_contract",
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
    "title": "Interpret half-open right bound",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An inclusive classic search initializes right = n instead of right = n - 1. What boundary mistake is present?",
      "mentalModelCorrection": "In an inclusive index range, both bounds must be valid candidate indexes.",
      "mistakeTypes": [
        "edge_case_missed"
      ],
      "nextAction": "Practice matching right initialization to the loop template.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_half_open": "right = n belongs to half-open [left, right), not inclusive [left, right].",
        "wrong_safe": "With inclusive access to nums[mid], right = n can lead to out-of-bounds candidates."
      }
    },
    "id": "alg-binary-search-boundaries-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_interval_contract",
    "prompt": "An inclusive classic search initializes right = n instead of right = n - 1. What boundary mistake is present?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "For inclusive bounds over valid indexes, initialize right = n - 1.",
        "id": "alg-binary-search-boundaries-011-check",
        "mistakeTypes": [
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "It mixes an inclusive template with a half-open right boundary."
          },
          {
            "id": "wrong_half_open",
            "text": "It is correct because every binary search should start with right = n."
          },
          {
            "id": "wrong_safe",
            "text": "It only changes performance, not correctness."
          }
        ],
        "prompt": "Choose the boundary mistake.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_interval_contract"
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
        "nodeId": "binary_search_interval_contract",
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
    "title": "Catch inclusive right initialization bug",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A binary search computes mid once before the loop and never recomputes it after boundary updates. What is the bug?",
      "mentalModelCorrection": "mid must be derived from the current bounds on every iteration.",
      "mistakeTypes": [
        "state_progress_error"
      ],
      "nextAction": "Practice checking which values must be recomputed after state changes.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_ok": "A stale mid no longer represents the active search range.",
        "wrong_only_speed": "This is a correctness/progress issue, not just a performance issue."
      }
    },
    "id": "alg-binary-search-boundaries-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_loop_progress",
    "prompt": "A binary search computes mid once before the loop and never recomputes it after boundary updates. What is the bug?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "mid becomes stale because it is no longer based on the current left and right.",
        "id": "alg-binary-search-boundaries-012-check",
        "mistakeTypes": [
          "state_progress_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "mid becomes stale and may no longer split the current active range."
          },
          {
            "id": "wrong_ok",
            "text": "It is fine because mid should stay stable throughout the search."
          },
          {
            "id": "wrong_only_speed",
            "text": "It only makes the code slower, not less correct."
          }
        ],
        "prompt": "Choose the bug.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_loop_progress"
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
        "nodeId": "binary_search_loop_progress",
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
    "title": "Catch stale mid calculation",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A lower-bound search is looking for the first index where nums[i] >= target. At mid, nums[mid] >= target. Why is right = mid safer than right = mid - 1 in the no-extra-answer-variable template?",
      "mentalModelCorrection": "mid may be the first valid boundary, so the template must keep it inside the candidate range.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice identifying when mid is still a candidate rather than proven impossible.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_discard": "Discarding mid can skip the first valid index.",
        "wrong_classic": "This is not classic found/not-found equality handling; it is boundary search."
      }
    },
    "id": "alg-binary-search-boundaries-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A lower-bound search is looking for the first index where nums[i] >= target. At mid, nums[mid] >= target. Why is right = mid safer than right = mid - 1 in the no-extra-answer-variable template?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "mid is a valid candidate for the first index >= target and must remain in the range.",
        "id": "alg-binary-search-boundaries-013-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "mid might be the first valid index, so it must stay in the candidate range."
          },
          {
            "id": "wrong_discard",
            "text": "mid should be discarded because any valid value is too large."
          },
          {
            "id": "wrong_classic",
            "text": "Equality always means return immediately in every binary-search variant."
          }
        ],
        "prompt": "Choose the reason.",
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
    "title": "Keep possible lower-bound mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A lower-bound search is looking for the first index where nums[i] >= target. At mid, nums[mid] < target. Which update is correct?",
      "mentalModelCorrection": "mid is too small and cannot be the first index meeting the condition.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice excluding mid only when it is proven impossible.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep": "Keeping mid can stall the search and keeps an impossible candidate.",
        "wrong_right": "Moving right leftward discards positions where the first valid index may still exist."
      }
    },
    "id": "alg-binary-search-boundaries-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A lower-bound search is looking for the first index where nums[i] >= target. At mid, nums[mid] < target. Which update is correct?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use left = mid + 1 because mid and everything left of it cannot satisfy nums[i] >= target first.",
        "id": "alg-binary-search-boundaries-014-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "left = mid + 1, because mid is too small to be valid."
          },
          {
            "id": "wrong_keep",
            "text": "left = mid, because mid should remain as a boundary candidate."
          },
          {
            "id": "wrong_right",
            "text": "right = mid, because smaller indexes should be searched next."
          }
        ],
        "prompt": "Choose the update.",
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
    "title": "Exclude impossible lower-bound mid",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A search for the first true value uses a lower-bound template without a separate answer variable. The predicate at mid is true, but the code sets right = mid - 1. What can happen?",
      "mentalModelCorrection": "If mid is true, it may be the first true value, so discarding it can skip the answer.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice keeping possible boundary answers in the active range.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_always_left": "True does not mean mid is impossible; it means a boundary may be at mid or left of mid.",
        "wrong_no_issue": "Without saving mid elsewhere, right = mid - 1 can lose the only correct answer."
      }
    },
    "id": "alg-binary-search-boundaries-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "first_true_update_rule",
    "prompt": "A search for the first true value uses a lower-bound template without a separate answer variable. The predicate at mid is true, but the code sets right = mid - 1. What can happen?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The update can discard mid even though mid may be the first true position.",
        "id": "alg-binary-search-boundaries-015-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "It can discard a possible answer and skip the first true position."
          },
          {
            "id": "wrong_always_left",
            "text": "It is always correct because true values must be removed."
          },
          {
            "id": "wrong_no_issue",
            "text": "There is no issue because mid was checked once already."
          }
        ],
        "prompt": "Choose the bug.",
        "status": "active",
        "testedSkillAtomIds": [
          "first_true_update_rule"
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
        "nodeId": "first_true_update_rule",
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
    "title": "Do not discard possible first true",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A boundary search ends with left === right in a half-open lower-bound template. What does left usually represent?",
      "mentalModelCorrection": "The converged boundary is the first position satisfying the condition, or the insertion position if none exists.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_explain_why"
      ],
      "nextAction": "Practice linking the final boundary variable to the template invariant.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_last_mid": "The last mid is not the stable output contract.",
        "wrong_found_only": "Boundary search can return an insertion position even when no equal value exists."
      }
    },
    "id": "alg-binary-search-boundaries-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "lower_bound_contract",
    "prompt": "A boundary search ends with left === right in a half-open lower-bound template. What does left usually represent?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "left is the converged boundary: the first satisfying position or insertion point.",
        "id": "alg-binary-search-boundaries-016-check",
        "mistakeTypes": [
          "edge_case_missed",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The first satisfying position, or the insertion position if no such value exists."
          },
          {
            "id": "wrong_last_mid",
            "text": "The last mid value, regardless of final bounds."
          },
          {
            "id": "wrong_found_only",
            "text": "Only a confirmed index where nums[left] equals target."
          }
        ],
        "prompt": "Choose what left represents.",
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
    "title": "Interpret converged lower-bound left",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A classic found/not-found search sees nums[mid] === target. A lower-bound search sees nums[mid] >= target. Why can their equality handling differ?",
      "mentalModelCorrection": "Classic search may return any matching index, but boundary search must keep searching for the first valid boundary.",
      "mistakeTypes": [
        "cannot_explain_why",
        "edge_case_missed"
      ],
      "nextAction": "Practice matching equality behavior to the output contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_same": "The output contracts are different; any match is not always enough.",
        "wrong_always_return": "Returning on equality fails when the task asks for first/last occurrence or insertion boundary."
      }
    },
    "id": "alg-binary-search-boundaries-017",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_interval_contract",
    "prompt": "A classic found/not-found search sees nums[mid] === target. A lower-bound search sees nums[mid] >= target. Why can their equality handling differ?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Classic search can return any match; boundary search must preserve the possible first boundary.",
        "id": "alg-binary-search-boundaries-017-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Because classic search needs any match, while boundary search needs the first valid position."
          },
          {
            "id": "wrong_same",
            "text": "They cannot differ; equality always means return mid."
          },
          {
            "id": "wrong_always_return",
            "text": "Boundary search should return mid as soon as nums[mid] equals target."
          }
        ],
        "prompt": "Choose the explanation.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_interval_contract"
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
        "nodeId": "binary_search_interval_contract",
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
    "title": "Match equality handling to contract",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "output contract",
        "equality behavior",
        "candidate boundary"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Because classic search needs any match, while boundary search needs the first valid position."
        },
        {
          "id": "wrong_same",
          "text": "They cannot differ; equality always means return mid."
        },
        {
          "id": "wrong_always_return",
          "text": "Boundary search should return mid as soon as nums[mid] equals target."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the steps for reviewing a binary-search boundary update.",
      "mentalModelCorrection": "A correct review checks the interval contract, the comparison result, whether mid is still possible, and whether the range shrinks.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice reviewing updates by invariant and progress, not by memorized formulas.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-boundaries-018",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_loop_progress",
    "prompt": "Order the steps for reviewing a binary-search boundary update.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "name_interval_contract",
          "interpret_mid_result",
          "decide_mid_possible",
          "choose_update",
          "verify_progress"
        ],
        "feedback": "Start with the interval contract, then use the mid result to decide whether mid stays, choose the update, and confirm progress.",
        "id": "alg-binary-search-boundaries-018-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "name_interval_contract",
            "text": "Name whether the range is inclusive or half-open."
          },
          {
            "id": "interpret_mid_result",
            "text": "Use the comparison or predicate result at mid."
          },
          {
            "id": "decide_mid_possible",
            "text": "Decide whether mid is still a possible answer."
          },
          {
            "id": "choose_update",
            "text": "Move the boundary that removes only impossible candidates."
          },
          {
            "id": "verify_progress",
            "text": "Verify the range strictly shrinks or the loop exits."
          }
        ],
        "prompt": "Tap the review steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_loop_progress"
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
        "nodeId": "binary_search_loop_progress",
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
    "title": "Order boundary-update review",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A teammate changes while (left <= right) to while (left < right) in a classic found/not-found search without changing the return logic. What edge case should you test?",
      "mentalModelCorrection": "The one-candidate range is where the two loop conditions differ.",
      "mistakeTypes": [
        "edge_case_missed",
        "subgoal_order_wrong"
      ],
      "nextAction": "Practice testing the smallest ranges where boundary choices differ.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_large_only": "Large arrays may hide the bug; one-element and final-candidate states expose it.",
        "wrong_duplicates": "Duplicates are not needed to reveal this boundary-condition issue."
      }
    },
    "id": "alg-binary-search-boundaries-019",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_interval_contract",
    "prompt": "A teammate changes while (left <= right) to while (left < right) in a classic found/not-found search without changing the return logic. What edge case should you test?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Test a one-element array or a case where the target is the final remaining candidate.",
        "id": "alg-binary-search-boundaries-019-check",
        "mistakeTypes": [
          "edge_case_missed",
          "subgoal_order_wrong"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "A one-element array or a target that becomes the final remaining candidate."
          },
          {
            "id": "wrong_large_only",
            "text": "Only very large arrays, because binary search bugs appear only at scale."
          },
          {
            "id": "wrong_duplicates",
            "text": "Only arrays with duplicate values."
          }
        ],
        "prompt": "Choose the edge case.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_interval_contract"
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
        "nodeId": "binary_search_interval_contract",
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
    "title": "Test final-candidate edge case",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A mid calculation uses Math.floor((left + right) / 2). In a language with fixed-size integers, what safer formula avoids overflow?",
      "mentalModelCorrection": "Compute the distance first so left + right does not overflow before division.",
      "mistakeTypes": [
        "edge_case_missed"
      ],
      "nextAction": "Practice checking arithmetic safety separately from boundary logic.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_sum_first": "left + right can overflow before division in fixed-size integer languages.",
        "wrong_right_minus": "right - left gives distance, but it still needs to be added back to left."
      }
    },
    "id": "alg-binary-search-boundaries-020",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_loop_progress",
    "prompt": "A mid calculation uses Math.floor((left + right) / 2). In a language with fixed-size integers, what safer formula avoids overflow?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use left + Math.floor((right - left) / 2).",
        "id": "alg-binary-search-boundaries-020-check",
        "mistakeTypes": [
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "left + Math.floor((right - left) / 2)"
          },
          {
            "id": "wrong_sum_first",
            "text": "Math.floor((left + right) / 2), because division prevents overflow."
          },
          {
            "id": "wrong_right_minus",
            "text": "Math.floor((right - left) / 2), because the distance alone is the index."
          }
        ],
        "prompt": "Choose the safer mid formula.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_loop_progress"
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
        "nodeId": "binary_search_loop_progress",
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
    "title": "Use overflow-safe mid formula",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A binary search range shrinks on most examples, but in one branch the update can leave left and right unchanged. What review comment is most accurate?",
      "mentalModelCorrection": "Every branch must either shrink the active range or terminate.",
      "mistakeTypes": [
        "state_progress_error",
        "edge_case_missed"
      ],
      "nextAction": "Practice checking progress for every branch, not only the common branch.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_most": "Most examples passing does not prove every branch makes progress.",
        "wrong_ignore": "A non-progress branch is a correctness risk even if it is rare."
      }
    },
    "id": "alg-binary-search-boundaries-021",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_loop_progress",
    "prompt": "A binary search range shrinks on most examples, but in one branch the update can leave left and right unchanged. What review comment is most accurate?",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Every loop branch must make progress or return; otherwise the loop can get stuck.",
        "id": "alg-binary-search-boundaries-021-check",
        "mistakeTypes": [
          "state_progress_error",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Every branch must strictly shrink the active range or terminate."
          },
          {
            "id": "wrong_most",
            "text": "The code is safe if most examples shrink the range."
          },
          {
            "id": "wrong_ignore",
            "text": "A non-shrinking branch only affects performance, not correctness."
          }
        ],
        "prompt": "Choose the review comment.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_loop_progress"
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
        "nodeId": "binary_search_loop_progress",
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
    "title": "Require progress in every branch",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the full reasoning steps for choosing a binary-search loop template.",
      "mentalModelCorrection": "Choose the output contract first, then interval meaning, then loop condition, updates, and return value.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice deriving the template from the contract instead of memorizing updates.",
      "result": "diagnostic"
    },
    "id": "alg-binary-search-boundaries-022",
    "learningStage": "foundations",
    "primarySkillAtomId": "binary_search_interval_contract",
    "prompt": "Order the full reasoning steps for choosing a binary-search loop template.",
    "roadmapNodeId": "binary_search",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "define_output_contract",
          "choose_interval_meaning",
          "choose_loop_condition",
          "derive_updates",
          "define_return_value"
        ],
        "feedback": "The loop template follows from the output contract and interval invariant.",
        "id": "alg-binary-search-boundaries-022-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "define_output_contract",
            "text": "Define whether the task needs any match, first boundary, last boundary, or insertion point."
          },
          {
            "id": "choose_interval_meaning",
            "text": "Choose what [left, right] or [left, right) means."
          },
          {
            "id": "choose_loop_condition",
            "text": "Choose the loop condition that matches the interval contract."
          },
          {
            "id": "derive_updates",
            "text": "Derive updates that keep possible answers and discard impossible ones."
          },
          {
            "id": "define_return_value",
            "text": "Define what to return after the loop exits."
          }
        ],
        "prompt": "Tap the template-design steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "binary_search_interval_contract"
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
        "nodeId": "binary_search_interval_contract",
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
    "title": "Order binary-search template design",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  }
];
