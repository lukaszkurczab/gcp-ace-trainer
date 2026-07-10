// Planning target: membership, seen-before state, distinct values, and duplicate detection.
// It should teach that the Set equals the processed prefix's values and diagnose wrong lookup/add order or unintended state resets.
// Target question count: 16.
// Prefer traces, ordering, and edge-case items.
export const membershipSeenAndDuplicatesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Target is 12. Seen values are {3, 8}. Current value is 5. The needed value is 7, which is not seen. What happens next?",
      "mentalModelCorrection": "Record that 5 has now been seen, because the current value did not complete the condition.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Return a pair because 5 is now available\", but the useful rule is: Record that 5 has now been seen, because the current value did not complete the condition.",
        "wrong_2": "This option leans on \"Clear the seen state because this value did not match\", but the useful rule is: Record that 5 has now been seen, because the current value did not complete the condition."
      }
    },
    "id": "alg-hash-map-trace-store-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Target is 12. Seen values are {3, 8}. Current value is 5. The needed value is 7, which is not seen. What happens next?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Record that 5 has now been seen, because the current value did not complete the condition.",
        "id": "alg-hash-map-trace-store-001-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Record that 5 has now been seen, because the current value did not complete the condition."
          },
          {
            "id": "wrong_1",
            "text": "Return a pair because 5 is now available."
          },
          {
            "id": "wrong_2",
            "text": "Clear the seen state because this value did not match."
          }
        ],
        "prompt": "Choose the next trace step.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "trace_next_step"
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
        "nodeId": "seen_set",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace a non-match lookup update",
    "trackId": "algorithms",
    "type": "trace_next_step",
    "stepByStepTrace": [
      {
        "description": "Record that 5 has now been seen, because the current value did not complete the condition.",
        "id": "alg-hash-map-trace-store-001-trace-001",
        "order": 1,
        "state": [
          "Target is 12. Seen values are {3, 8}. Current value is 5. The needed value is 7, which is not seen. What happens next?"
        ]
      }
    ],
    "difficulty": "easy"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A stream asks whether a tag has appeared earlier. Empty input is valid. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Use a seen set when only membership matters.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Use a seen set when only membership matters.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Use a seen set when only membership matters."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-004",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A stream asks whether a tag has appeared earlier. Empty input is valid. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use a seen set when only membership matters.",
        "id": "alg-prod-hash-004-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use a seen set when only membership matters."
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
        "nodeId": "seen_set",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 4",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A stream asks whether a tag has appeared earlier. Empty input is valid. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Use a seen set when only membership matters.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use a seen set when only membership matters."
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
      "decisionSignal": "A stream asks whether a tag has appeared earlier. The input can be large. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is prior membership state.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is prior membership state.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is prior membership state."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-009",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A stream asks whether a tag has appeared earlier. The input can be large. Which pattern signal should be named first?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is prior membership state.",
        "id": "alg-prod-hash-009-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is prior membership state."
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
        "nodeId": "seen_set",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 9",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A stream asks whether a tag has appeared earlier. Extra memory is acceptable only if it changes scaling. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Use a seen set when only membership matters.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Use a seen set when only membership matters.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Use a seen set when only membership matters."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-014",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A stream asks whether a tag has appeared earlier. Extra memory is acceptable only if it changes scaling. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use a seen set when only membership matters.",
        "id": "alg-prod-hash-014-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use a seen set when only membership matters."
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
        "nodeId": "seen_set",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 14",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A stream asks whether a tag has appeared earlier. Extra memory is acceptable only if it changes scaling. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Use a seen set when only membership matters.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use a seen set when only membership matters."
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
      "decisionSignal": "A stream asks whether a tag has appeared earlier. Duplicate values are allowed. Which pattern signal should be named first?",
      "mentalModelCorrection": "The pattern signal is prior membership state.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: The pattern signal is prior membership state.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: The pattern signal is prior membership state."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-019",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A stream asks whether a tag has appeared earlier. Duplicate values are allowed. Which pattern signal should be named first?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pattern signal is prior membership state.",
        "id": "alg-prod-hash-019-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The pattern signal is prior membership state."
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
        "nodeId": "seen_set",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 19",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A stream asks whether a tag has appeared earlier. The edge case appears at the first or last position. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Use a seen set when only membership matters.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Use a seen set when only membership matters.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Use a seen set when only membership matters."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-024",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A stream asks whether a tag has appeared earlier. The edge case appears at the first or last position. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use a seen set when only membership matters.",
        "id": "alg-prod-hash-024-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use a seen set when only membership matters."
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
        "nodeId": "seen_set",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 24",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A stream asks whether a tag has appeared earlier. The edge case appears at the first or last position. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Use a seen set when only membership matters.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use a seen set when only membership matters."
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

