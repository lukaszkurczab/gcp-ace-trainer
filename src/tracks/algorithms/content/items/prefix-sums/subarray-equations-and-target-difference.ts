// Planning target: this file should contain questions about deriving contiguous-subarray equations from prefix differences.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 18.
export const subarrayEquationsAndTargetDifferenceQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Current prefix total is 11 and target subarray sum is 7. Which earlier prefix total would prove a matching range exists?",
      "mentalModelCorrection": "Look for an earlier prefix total of 4, because 11 minus target 7 equals 4.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "negative_numbers_assumption_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Look for prefix total 18 because target should be added\", but the useful rule is: Look for an earlier prefix total of 4, because 11 minus target 7 equals 4.",
        "wrong_2": "This option leans on \"Ignore earlier totals and only inspect the current element\", but the useful rule is: Look for an earlier prefix total of 4, because 11 minus target 7 equals 4."
      }
    },
    "id": "alg-prefix-trace-needed-total-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Current prefix total is 11 and target subarray sum is 7. Which earlier prefix total would prove a matching range exists?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Look for an earlier prefix total of 4, because 11 minus target 7 equals 4.",
        "id": "alg-prefix-trace-needed-total-001-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "negative_numbers_assumption_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Look for an earlier prefix total of 4, because 11 minus target 7 equals 4."
          },
          {
            "id": "wrong_1",
            "text": "Look for prefix total 18 because target should be added."
          },
          {
            "id": "wrong_2",
            "text": "Ignore earlier totals and only inspect the current element."
          }
        ],
        "prompt": "Choose the next trace step.",
        "status": "active",
        "testedSkillAtomIds": [
          "detect_window_failure_signal"
        ],
        "type": "trace_next_step"
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
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace needed prefix total",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "stepByStepTrace": [
      {
        "description": "Look for an earlier prefix total of 4, because 11 minus target 7 equals 4.",
        "id": "alg-prefix-trace-needed-total-001-trace-001",
        "order": 1,
        "state": [
          "Current prefix total is 11 and target subarray sum is 7. Which earlier prefix total would prove a matching range exists?"
        ]
      }
    ],
    "difficulty": "easy"
  }
];
