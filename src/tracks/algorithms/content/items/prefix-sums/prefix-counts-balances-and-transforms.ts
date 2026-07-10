// Planning target: this file should contain questions about transformed cumulative states, counts, balances, parity, XOR, and parallel prefixes.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 14.
export const prefixCountsBalancesAndTransformsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A count is needed for ranges ending at each index. The same input is queried many times. Which strategy signal should guide the choice?",
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
    "id": "alg-prod-prefix-005",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A count is needed for ranges ending at each index. The same input is queried many times. Which strategy signal should guide the choice?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Track prefix frequencies, not just the latest prefix total.",
        "id": "alg-prod-prefix-005-check",
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
    "title": "Production prefix baseline 5",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "A count is needed for ranges ending at each index. The same input is queried many times. Which strategy signal should guide the choice?",
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
  }
];
