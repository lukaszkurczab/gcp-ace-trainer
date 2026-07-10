// Planning target: this file should contain questions about recognizing prefix preprocessing and prefix-state signals.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 14.
export const recognizePrefixSumSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A subarray-sum task allows negative values. Which signal should make you question a simple sum window?",
      "mentalModelCorrection": "Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Negative values make shrinking the left boundary always increase the sum\", but the useful rule is: Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior.",
        "wrong_2": "This option leans on \"A window is always valid for any contiguous sum task\", but the useful rule is: Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior."
      }
    },
    "id": "alg-prefix-window-failure-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A subarray-sum task allows negative values. Which signal should make you question a simple sum window?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior.",
        "id": "alg-prefix-window-failure-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior."
          },
          {
            "id": "wrong_1",
            "text": "Negative values make shrinking the left boundary always increase the sum."
          },
          {
            "id": "wrong_2",
            "text": "A window is always valid for any contiguous sum task."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Detect when a window fails",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A subarray-sum task allows negative values. Which signal should make you question a simple sum window?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior."
        },
        {
          "id": "wrong_1",
          "text": "Negative values make shrinking the left boundary always increase the sum."
        },
        {
          "id": "wrong_2",
          "text": "A window is always valid for any contiguous sum task."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Two range-sum plans are proposed for data that may rise and fall: moving sum window or prefix totals with lookup. Which comparison is decisive?",
      "mentalModelCorrection": "A prefix-sum plan handles negative values because it does not depend on shrink movement being predictable.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "invariant_broken"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"The moving window is safer because it stores less state\", but the useful rule is: A prefix-sum plan handles negative values because it does not depend on shrink movement being predictable.",
        "wrong_2": "This option leans on \"Negative values do not affect any contiguous range method\", but the useful rule is: A prefix-sum plan handles negative values because it does not depend on shrink movement being predictable."
      }
    },
    "id": "alg-prefix-vs-window-comparison-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Two range-sum plans are proposed for data that may rise and fall: moving sum window or prefix totals with lookup. Which comparison is decisive?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "A prefix-sum plan handles negative values because it does not depend on shrink movement being predictable.",
        "id": "alg-prefix-vs-window-comparison-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "invariant_broken"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "A prefix-sum plan handles negative values because it does not depend on shrink movement being predictable."
          },
          {
            "id": "wrong_1",
            "text": "The moving window is safer because it stores less state."
          },
          {
            "id": "wrong_2",
            "text": "Negative values do not affect any contiguous range method."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Compare prefix with window",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "decision signal",
        "constraint fit",
        "state needed"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "A prefix-sum plan handles negative values because it does not depend on shrink movement being predictable."
        },
        {
          "id": "wrong_1",
          "text": "The moving window is safer because it stores less state."
        },
        {
          "id": "wrong_2",
          "text": "Negative values do not affect any contiguous range method."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A contiguous sum task allows credits and refunds, so values may be below zero. Which strategy signal matters?",
      "mentalModelCorrection": "Use prefix totals because negative values can make simple shrink decisions unreliable.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Use a positive-number window because the target is a sum\", but the useful rule is: Use prefix totals because negative values can make simple shrink decisions unreliable.",
        "wrong_2": "This option leans on \"Ignore signs and shrink whenever the total is too high\", but the useful rule is: Use prefix totals because negative values can make simple shrink decisions unreliable."
      }
    },
    "id": "alg-exp-prefix-strategy-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A contiguous sum task allows credits and refunds, so values may be below zero. Which strategy signal matters?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use prefix totals because negative values can make simple shrink decisions unreliable.",
        "id": "alg-exp-prefix-strategy-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use prefix totals because negative values can make simple shrink decisions unreliable."
          },
          {
            "id": "wrong_1",
            "text": "Use a positive-number window because the target is a sum."
          },
          {
            "id": "wrong_2",
            "text": "Ignore signs and shrink whenever the total is too high."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Choose prefix for mixed signs",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A contiguous sum task allows credits and refunds, so values may be below zero. Which strategy signal matters?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Use prefix totals because negative values can make simple shrink decisions unreliable.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use prefix totals because negative values can make simple shrink decisions unreliable."
        },
        {
          "id": "wrong_1",
          "text": "Use a positive-number window because the target is a sum."
        },
        {
          "id": "wrong_2",
          "text": "Ignore signs and shrink whenever the total is too high."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A window sum may rise or fall after either boundary moves. Which signal suggests prefix reasoning instead?",
      "mentalModelCorrection": "The failure signal is loss of monotonic behavior in the range total.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "invariant_broken"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Every contiguous sum has predictable movement\", but the useful rule is: The failure signal is loss of monotonic behavior in the range total.",
        "wrong_2": "This option leans on \"Prefix state only works for positive values\", but the useful rule is: The failure signal is loss of monotonic behavior in the range total."
      }
    },
    "id": "alg-exp-prefix-identify-003",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A window sum may rise or fall after either boundary moves. Which signal suggests prefix reasoning instead?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The failure signal is loss of monotonic behavior in the range total.",
        "id": "alg-exp-prefix-identify-003-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "invariant_broken"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The failure signal is loss of monotonic behavior in the range total."
          },
          {
            "id": "wrong_1",
            "text": "Every contiguous sum has predictable movement."
          },
          {
            "id": "wrong_2",
            "text": "Prefix state only works for positive values."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Identify window failure signal",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Plan A shrinks a window when the total is high. Plan B checks current prefix minus target in a map. Values can be negative. Which plan fits better?",
      "mentalModelCorrection": "Prefix lookup is safer when value signs break the simple window invariant.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Plan A is safer because it stores less state\", but the useful rule is: Prefix lookup is safer when value signs break the simple window invariant.",
        "wrong_2": "This option leans on \"Value signs do not affect range-sum mechanics\", but the useful rule is: Prefix lookup is safer when value signs break the simple window invariant."
      }
    },
    "id": "alg-exp-prefix-comparison-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Plan A shrinks a window when the total is high. Plan B checks current prefix minus target in a map. Values can be negative. Which plan fits better?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Prefix lookup is safer when value signs break the simple window invariant.",
        "id": "alg-exp-prefix-comparison-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Prefix lookup is safer when value signs break the simple window invariant."
          },
          {
            "id": "wrong_1",
            "text": "Plan A is safer because it stores less state."
          },
          {
            "id": "wrong_2",
            "text": "Value signs do not affect range-sum mechanics."
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
    "title": "Compare prefix lookup with window",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "decision signal",
        "constraint fit",
        "state needed"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Prefix lookup is safer when value signs break the simple window invariant."
        },
        {
          "id": "wrong_1",
          "text": "Plan A is safer because it stores less state."
        },
        {
          "id": "wrong_2",
          "text": "Value signs do not affect range-sum mechanics."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A range-sum solution shrinks left whenever total exceeds target, but the input may contain refunds. What should be reviewed?",
      "mentalModelCorrection": "The mistake is applying a positive-only window invariant after the prompt allows values below zero.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "invariant_broken"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Refunds make the shrink rule more reliable\", but the useful rule is: The mistake is applying a positive-only window invariant after the prompt allows values below zero.",
        "wrong_2": "This option leans on \"The target value alone decides whether a window is safe\", but the useful rule is: The mistake is applying a positive-only window invariant after the prompt allows values below zero."
      }
    },
    "id": "alg-exp-prefix-mistake-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A range-sum solution shrinks left whenever total exceeds target, but the input may contain refunds. What should be reviewed?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The mistake is applying a positive-only window invariant after the prompt allows values below zero.",
        "id": "alg-exp-prefix-mistake-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "invariant_broken"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The mistake is applying a positive-only window invariant after the prompt allows values below zero."
          },
          {
            "id": "wrong_1",
            "text": "Refunds make the shrink rule more reliable."
          },
          {
            "id": "wrong_2",
            "text": "The target value alone decides whether a window is safe."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Review invalid positive-window assumption",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "difficulty": "easy"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A range-sum task allows credits and refunds below zero. The input can be large. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Use prefix totals because simple shrink movement is not reliable.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Use prefix totals because simple shrink movement is not reliable.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Use prefix totals because simple shrink movement is not reliable."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A range-sum task allows credits and refunds below zero. The input can be large. Which strategy signal should guide the choice?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use prefix totals because simple shrink movement is not reliable.",
        "id": "alg-prod-prefix-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use prefix totals because simple shrink movement is not reliable."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 1",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A range-sum task allows credits and refunds below zero. The input can be large. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Use prefix totals because simple shrink movement is not reliable.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use prefix totals because simple shrink movement is not reliable."
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
      "decisionSignal": "A range-sum task allows credits and refunds below zero. Duplicate values are allowed. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Use prefix totals because simple shrink movement is not reliable.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Use prefix totals because simple shrink movement is not reliable.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Use prefix totals because simple shrink movement is not reliable."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-011",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A range-sum task allows credits and refunds below zero. Duplicate values are allowed. Which strategy signal should guide the choice?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use prefix totals because simple shrink movement is not reliable.",
        "id": "alg-prod-prefix-011-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use prefix totals because simple shrink movement is not reliable."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 11",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A range-sum task allows credits and refunds below zero. Duplicate values are allowed. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Use prefix totals because simple shrink movement is not reliable.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use prefix totals because simple shrink movement is not reliable."
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
      "decisionSignal": "A range-sum task allows credits and refunds below zero. The edge case appears at the first or last position. What time and extra space should you expect?",
      "mentalModelCorrection": "One scan stores prefix totals for lookup.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-016",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A range-sum task allows credits and refunds below zero. The edge case appears at the first or last position. What time and extra space should you expect?",
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
        "id": "alg-prod-prefix-016-check",
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
    "title": "Production prefix baseline 16",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "One scan stores prefix totals for lookup.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  }
];
