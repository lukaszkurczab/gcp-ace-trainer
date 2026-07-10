// Planning target: recognize when keyed hash state is justified: membership, repeated lookup, deduplication, complement lookup, grouping, and identity-based comparison.
// It should distinguish keyed state from sorting, nested scans, bounded-domain indexing, and scalar accumulation.
// Target question count: 14.
// Prefer strategy and signal-recognition items; avoid detailed updates, key construction, and full complexity analysis.
export const recognizeHashStateSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A task repeatedly derives a code and asks whether that code was seen earlier. Which pattern signal should you name?",
      "mentalModelCorrection": "The pattern signal is fast lookup by a derived key.",
      "mistakeTypes": [
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Name it as ordering because the code is comparable\", but the useful rule is: The pattern signal is fast lookup by a derived key.",
        "wrong_2": "This option leans on \"Name it as recursion because earlier state is reused\", but the useful rule is: The pattern signal is fast lookup by a derived key."
      }
    },
    "id": "alg-exp-hash-identify-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A task repeatedly derives a code and asks whether that code was seen earlier. Which pattern signal should you name?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is fast lookup by a derived key.",
        "id": "alg-exp-hash-identify-001-check",
        "mistakeTypes": [
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is fast lookup by a derived key."
          },
          {
            "id": "wrong_1",
            "text": "Name it as ordering because the code is comparable."
          },
          {
            "id": "wrong_2",
            "text": "Name it as recursion because earlier state is reused."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lookup_by_value",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Identify derived-key lookup",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A lookup derives a compact code from each record before matching. The same input is queried many times. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is lookup by derived value.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is lookup by derived value.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is lookup by derived value."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-005",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A lookup derives a compact code from each record before matching. The same input is queried many times. Which pattern signal should be named first?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is lookup by derived value.",
        "id": "alg-prod-hash-005-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is lookup by derived value."
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
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lookup_by_value",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 5",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A lookup derives a compact code from each record before matching. The answer asks for values, not code. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is lookup by derived value.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is lookup by derived value.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is lookup by derived value."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-015",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A lookup derives a compact code from each record before matching. The answer asks for values, not code. Which pattern signal should be named first?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is lookup by derived value.",
        "id": "alg-prod-hash-015-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is lookup by derived value."
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
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "lookup_by_value",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 15",
    "trackId": "algorithms",
    "type": "approach_naming"
  }
];

