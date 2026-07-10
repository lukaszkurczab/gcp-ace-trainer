// Planning target: this file should contain questions about choosing between prefix sums, difference arrays, and sliding windows.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 10.
export const differenceArraysAndSlidingWindowBoundaryQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many operations add a value across an index range, then final values are requested once. Which accumulated-state signal fits?",
      "mentalModelCorrection": "A difference array fits when many range increments are applied before final values are read.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "complexity_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Update every covered index for every operation without checking operation count\", but the useful rule is: A difference array fits when many range increments are applied before final values are read.",
        "wrong_2": "This option leans on \"Use binary search because ranges have boundaries\", but the useful rule is: A difference array fits when many range increments are applied before final values are read."
      }
    },
    "id": "alg-exp-prefix-strategy-004",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many operations add a value across an index range, then final values are requested once. Which accumulated-state signal fits?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "A difference array fits when many range increments are applied before final values are read.",
        "id": "alg-exp-prefix-strategy-004-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "A difference array fits when many range increments are applied before final values are read."
          },
          {
            "id": "wrong_1",
            "text": "Update every covered index for every operation without checking operation count."
          },
          {
            "id": "wrong_2",
            "text": "Use binary search because ranges have boundaries."
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
        "nodeId": "difference_array_intro",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose difference-style accumulation",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "Many operations add a value across an index range, then final values are requested once. Which accumulated-state signal fits?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "A difference array fits when many range increments are applied before final values are read.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "A difference array fits when many range increments are applied before final values are read."
        },
        {
          "id": "wrong_1",
          "text": "Update every covered index for every operation without checking operation count."
        },
        {
          "id": "wrong_2",
          "text": "Use binary search because ranges have boundaries."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many operations add a value across a range, then final values are read once. Empty input is valid. What mistake should be reviewed?",
      "mentalModelCorrection": "Review applying every update to every covered index without checking operation count.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Review applying every update to every covered index without checking operation count.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Review applying every update to every covered index without checking operation count."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-004",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many operations add a value across a range, then final values are read once. Empty input is valid. What mistake should be reviewed?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Review applying every update to every covered index without checking operation count.",
        "id": "alg-prod-prefix-004-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Review applying every update to every covered index without checking operation count."
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
        "nodeId": "difference_array_intro",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 4",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many operations add a value across a range, then final values are read once. The input can be large. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is batched range updates.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is batched range updates.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is batched range updates."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-009",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many operations add a value across a range, then final values are read once. The input can be large. Which pattern signal should be named first?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is batched range updates.",
        "id": "alg-prod-prefix-009-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is batched range updates."
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
        "nodeId": "difference_array_intro",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 9",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many operations add a value across a range, then final values are read once. Extra memory is acceptable only if it changes scaling. What mistake should be reviewed?",
      "mentalModelCorrection": "Review applying every update to every covered index without checking operation count.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Review applying every update to every covered index without checking operation count.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Review applying every update to every covered index without checking operation count."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-014",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many operations add a value across a range, then final values are read once. Extra memory is acceptable only if it changes scaling. What mistake should be reviewed?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Review applying every update to every covered index without checking operation count.",
        "id": "alg-prod-prefix-014-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Review applying every update to every covered index without checking operation count."
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
        "nodeId": "difference_array_intro",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 14",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many operations add a value across a range, then final values are read once. Duplicate values are allowed. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is batched range updates.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is batched range updates.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is batched range updates."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-019",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many operations add a value across a range, then final values are read once. Duplicate values are allowed. Which pattern signal should be named first?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is batched range updates.",
        "id": "alg-prod-prefix-019-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is batched range updates."
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
        "nodeId": "difference_array_intro",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 19",
    "trackId": "algorithms",
    "type": "approach_naming"
  }
];
