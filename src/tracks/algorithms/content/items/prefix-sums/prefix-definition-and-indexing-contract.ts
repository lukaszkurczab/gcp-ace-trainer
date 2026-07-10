// Planning target: this file should contain questions about prefix definitions, sentinel identity, n+1 storage, and prefix boundaries.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 18.
export const prefixDefinitionAndIndexingContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A prefix-total lookup should detect a target range that begins at index 0. Which edge state is needed?",
      "mentalModelCorrection": "The empty prefix before index 0 must be represented so a valid range can start at the first element.",
      "mistakeTypes": [
        "empty_input_error",
        "off_by_one"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Only store prefixes after two elements have been scanned\", but the useful rule is: The empty prefix before index 0 must be represented so a valid range can start at the first element.",
        "wrong_2": "This option leans on \"Ranges starting at index 0 cannot be found by prefix state\", but the useful rule is: The empty prefix before index 0 must be represented so a valid range can start at the first element."
      }
    },
    "id": "alg-prefix-empty-prefix-edge-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A prefix-total lookup should detect a target range that begins at index 0. Which edge state is needed?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The empty prefix before index 0 must be represented so a valid range can start at the first element.",
        "id": "alg-prefix-empty-prefix-edge-001-check",
        "mistakeTypes": [
          "empty_input_error",
          "off_by_one"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The empty prefix before index 0 must be represented so a valid range can start at the first element."
          },
          {
            "id": "wrong_1",
            "text": "Only store prefixes after two elements have been scanned."
          },
          {
            "id": "wrong_2",
            "text": "Ranges starting at index 0 cannot be found by prefix state."
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
        "nodeId": "empty_input_error",
        "role": "mistake_type"
      }
    ],
    "title": "Handle range starting at zero",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "difficulty": "easy"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A prefix formula should handle ranges that start at the first element. Which boundary signal is needed?",
      "mentalModelCorrection": "The empty prefix lets a range beginning at index zero be represented by the same formula.",
      "mistakeTypes": [
        "empty_input_error",
        "off_by_one"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Ranges must start after index zero\", but the useful rule is: The empty prefix lets a range beginning at index zero be represented by the same formula.",
        "wrong_2": "This option leans on \"The first prefix can be skipped because it has no previous value\", but the useful rule is: The empty prefix lets a range beginning at index zero be represented by the same formula."
      }
    },
    "id": "alg-exp-prefix-identify-002",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A prefix formula should handle ranges that start at the first element. Which boundary signal is needed?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The empty prefix lets a range beginning at index zero be represented by the same formula.",
        "id": "alg-exp-prefix-identify-002-check",
        "mistakeTypes": [
          "empty_input_error",
          "off_by_one"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The empty prefix lets a range beginning at index zero be represented by the same formula."
          },
          {
            "id": "wrong_1",
            "text": "Ranges must start after index zero."
          },
          {
            "id": "wrong_2",
            "text": "The first prefix can be skipped because it has no previous value."
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
        "nodeId": "empty_input_error",
        "role": "mistake_type"
      }
    ],
    "title": "Identify empty-prefix boundary",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  }
];
