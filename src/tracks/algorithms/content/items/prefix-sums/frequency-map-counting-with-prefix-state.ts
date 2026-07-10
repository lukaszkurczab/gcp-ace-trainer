// Planning target: this file should contain questions about frequencies of earlier prefix states and lookup-before-update counting.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 18.
export const frequencyMapCountingWithPrefixStateQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A scan must detect whether any earlier range sums to a target, and values may be negative. What lookup state fits?",
      "mentalModelCorrection": "Store earlier prefix totals so current total minus target can prove a matching subarray.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "negative_numbers_assumption_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Store only the current element because earlier totals cannot matter\", but the useful rule is: Store earlier prefix totals so current total minus target can prove a matching subarray.",
        "wrong_2": "This option leans on \"Use a positive window even when shrink direction can fail\", but the useful rule is: Store earlier prefix totals so current total minus target can prove a matching subarray."
      }
    },
    "id": "alg-exp-prefix-strategy-003",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A scan must detect whether any earlier range sums to a target, and values may be negative. What lookup state fits?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Store earlier prefix totals so current total minus target can prove a matching subarray.",
        "id": "alg-exp-prefix-strategy-003-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "negative_numbers_assumption_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Store earlier prefix totals so current total minus target can prove a matching subarray."
          },
          {
            "id": "wrong_1",
            "text": "Store only the current element because earlier totals cannot matter."
          },
          {
            "id": "wrong_2",
            "text": "Use a positive window even when shrink direction can fail."
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
        "nodeId": "subarray_sum_with_hash_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose prefix lookup state",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A scan must detect whether any earlier range sums to a target, and values may be negative. What lookup state fits?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Store earlier prefix totals so current total minus target can prove a matching subarray.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Store earlier prefix totals so current total minus target can prove a matching subarray."
        },
        {
          "id": "wrong_1",
          "text": "Store only the current element because earlier totals cannot matter."
        },
        {
          "id": "wrong_2",
          "text": "Use a positive window even when shrink direction can fail."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A scan must detect whether any subarray reaches a target sum. Duplicate values are allowed. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is prefix lookup by needed prior total.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is prefix lookup by needed prior total.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is prefix lookup by needed prior total."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-003",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A scan must detect whether any subarray reaches a target sum. Duplicate values are allowed. Which pattern signal should be named first?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is prefix lookup by needed prior total.",
        "id": "alg-prod-prefix-003-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is prefix lookup by needed prior total."
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
        "nodeId": "subarray_sum_with_hash_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 3",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A scan must detect whether any subarray reaches a target sum. The edge case appears at the first or last position. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Store earlier prefix totals and check current minus target.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Store earlier prefix totals and check current minus target.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Store earlier prefix totals and check current minus target."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-008",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A scan must detect whether any subarray reaches a target sum. The edge case appears at the first or last position. Which strategy signal should guide the choice?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Store earlier prefix totals and check current minus target.",
        "id": "alg-prod-prefix-008-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Store earlier prefix totals and check current minus target."
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
        "nodeId": "subarray_sum_with_hash_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 8",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A scan must detect whether any subarray reaches a target sum. The edge case appears at the first or last position. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Store earlier prefix totals and check current minus target.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Store earlier prefix totals and check current minus target."
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
      "decisionSignal": "A scan must detect whether any subarray reaches a target sum. The same input is queried many times. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is prefix lookup by needed prior total.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is prefix lookup by needed prior total.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is prefix lookup by needed prior total."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-013",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A scan must detect whether any subarray reaches a target sum. The same input is queried many times. Which pattern signal should be named first?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is prefix lookup by needed prior total.",
        "id": "alg-prod-prefix-013-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is prefix lookup by needed prior total."
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
        "nodeId": "subarray_sum_with_hash_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 13",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A scan must detect whether any subarray reaches a target sum. Original order must be preserved. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Store earlier prefix totals and check current minus target.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Store earlier prefix totals and check current minus target.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Store earlier prefix totals and check current minus target."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-018",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A scan must detect whether any subarray reaches a target sum. Original order must be preserved. Which strategy signal should guide the choice?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Store earlier prefix totals and check current minus target.",
        "id": "alg-prod-prefix-018-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Store earlier prefix totals and check current minus target."
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
        "nodeId": "subarray_sum_with_hash_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 18",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A scan must detect whether any subarray reaches a target sum. Original order must be preserved. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Store earlier prefix totals and check current minus target.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Store earlier prefix totals and check current minus target."
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
  }
];
