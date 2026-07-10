// Planning target: this file should contain questions about time, storage, numeric width, input mutation, and cross-cutting review.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 8.
export const complexityOverflowAndMistakeReviewQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A plan builds a prefix-total array for n values before answering range queries. What preprocessing cost should you expect?",
      "mentalModelCorrection": "Prefix preprocessing is linear time and linear extra space.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "id": "alg-exp-prefix-cost-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A plan builds a prefix-total array for n values before answering range queries. What preprocessing cost should you expect?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Prefix preprocessing is linear time and linear extra space.",
        "id": "alg-exp-prefix-cost-001-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "prefix_sums",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "detect_window_failure_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost prefix preprocessing",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Building prefix totals scans once and stores one accumulated value per position.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many queries ask for totals between two indexes in the same array. Original order must be preserved. What time and extra space should you expect?",
      "mentalModelCorrection": "Prefix preprocessing is linear time and linear space.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-002",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many queries ask for totals between two indexes in the same array. Original order must be preserved. What time and extra space should you expect?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Prefix preprocessing is linear time and linear space.",
        "id": "alg-prod-prefix-002-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "prefix_sums",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "detect_window_failure_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 2",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Prefix preprocessing is linear time and linear space.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A range-sum task allows credits and refunds below zero. Extra memory is acceptable only if it changes scaling. What time and extra space should you expect?",
      "mentalModelCorrection": "One scan stores prefix totals for lookup.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-006",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A range-sum task allows credits and refunds below zero. Extra memory is acceptable only if it changes scaling. What time and extra space should you expect?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "One scan stores prefix totals for lookup.",
        "id": "alg-prod-prefix-006-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "prefix_sums",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "detect_window_failure_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 6",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "One scan stores prefix totals for lookup.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A count is needed for ranges ending at each index. Original order must be preserved. What time and extra space should you expect?",
      "mentalModelCorrection": "A frequency map of prefixes grows with distinct prefix totals.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-010",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A count is needed for ranges ending at each index. Original order must be preserved. What time and extra space should you expect?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "A frequency map of prefixes grows with distinct prefix totals.",
        "id": "alg-prod-prefix-010-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "prefix_sums",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "detect_window_failure_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "prefix_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 10",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "A frequency map of prefixes grows with distinct prefix totals.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many queries ask for totals between two indexes in the same array. Empty input is valid. What time and extra space should you expect?",
      "mentalModelCorrection": "Prefix preprocessing is linear time and linear space.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-012",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many queries ask for totals between two indexes in the same array. Empty input is valid. What time and extra space should you expect?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Prefix preprocessing is linear time and linear space.",
        "id": "alg-prod-prefix-012-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "prefix_sums",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "detect_window_failure_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 12",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Prefix preprocessing is linear time and linear space.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A count is needed for ranges ending at each index. The answer asks for values, not code. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Track prefix frequencies, not just the latest prefix total.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Track prefix frequencies, not just the latest prefix total.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Track prefix frequencies, not just the latest prefix total."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-015",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A count is needed for ranges ending at each index. The answer asks for values, not code. Which strategy signal should guide the choice?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Track prefix frequencies, not just the latest prefix total.",
        "id": "alg-prod-prefix-015-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Track prefix frequencies, not just the latest prefix total."
          },
          {
            "id": "wrong_1",
            "text": "Choose the most familiar label before checking the constraint."
          },
          {
            "id": "wrong_2",
            "text": "Start with implementation details before naming the required state."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "prefix_sums",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "detect_window_failure_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "prefix_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 15",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A count is needed for ranges ending at each index. The answer asks for values, not code. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Track prefix frequencies, not just the latest prefix total.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Track prefix frequencies, not just the latest prefix total."
        },
        {
          "id": "wrong_1",
          "text": "Choose the most familiar label before checking the constraint."
        },
        {
          "id": "wrong_2",
          "text": "Start with implementation details before naming the required state."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A count is needed for ranges ending at each index. Empty input is valid. What time and extra space should you expect?",
      "mentalModelCorrection": "A frequency map of prefixes grows with distinct prefix totals.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-020",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A count is needed for ranges ending at each index. Empty input is valid. What time and extra space should you expect?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "A frequency map of prefixes grows with distinct prefix totals.",
        "id": "alg-prod-prefix-020-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "prefix_sums",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "detect_window_failure_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "prefix_counting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 20",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "A frequency map of prefixes grows with distinct prefix totals.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  }
];
