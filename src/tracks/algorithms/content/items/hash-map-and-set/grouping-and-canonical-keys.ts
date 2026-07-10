// Planning target: grouping by equivalence keys, canonical representations, Map buckets, normalized forms, and key-construction costs.
// It should require equivalent values to share a key without application-level collisions.
// Target question count: 16.
// Prefer key-selection and representation-review items.
export const groupingAndCanonicalKeysQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Words need to be grouped when their sorted letters match. What should the lookup key represent?",
      "mentalModelCorrection": "Store the normalized key as the map key and append the original word to that key's group.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Use the current index as the key because each word has one position\", but the useful rule is: Store the normalized key as the map key and append the original word to that key's group.",
        "wrong_2": "This option leans on \"Use the first character only because it is quick to read\", but the useful rule is: Store the normalized key as the map key and append the original word to that key's group."
      }
    },
    "id": "alg-hash-map-group-key-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Words need to be grouped when their sorted letters match. What should the lookup key represent?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Store the normalized key as the map key and append the original word to that key's group.",
        "id": "alg-hash-map-group-key-001-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Store the normalized key as the map key and append the original word to that key's group."
          },
          {
            "id": "wrong_1",
            "text": "Use the current index as the key because each word has one position."
          },
          {
            "id": "wrong_2",
            "text": "Use the first character only because it is quick to read."
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose a grouping key",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Records should be grouped when their cleaned address text matches. What should the map key represent?",
      "mentalModelCorrection": "Use the normalized address as the key because grouping depends on equivalent forms.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Use insertion order as the key because it is stable\", but the useful rule is: Use the normalized address as the key because grouping depends on equivalent forms.",
        "wrong_2": "This option leans on \"Use the first raw character even when formatting differs\", but the useful rule is: Use the normalized address as the key because grouping depends on equivalent forms."
      }
    },
    "id": "alg-exp-hash-strategy-002",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Records should be grouped when their cleaned address text matches. What should the map key represent?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use the normalized address as the key because grouping depends on equivalent forms.",
        "id": "alg-exp-hash-strategy-002-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use the normalized address as the key because grouping depends on equivalent forms."
          },
          {
            "id": "wrong_1",
            "text": "Use insertion order as the key because it is stable."
          },
          {
            "id": "wrong_2",
            "text": "Use the first raw character even when formatting differs."
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose normalized grouping key",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "Records should be grouped when their cleaned address text matches. What should the map key represent?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Use the normalized address as the key because grouping depends on equivalent forms.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use the normalized address as the key because grouping depends on equivalent forms."
        },
        {
          "id": "wrong_1",
          "text": "Use insertion order as the key because it is stable."
        },
        {
          "id": "wrong_2",
          "text": "Use the first raw character even when formatting differs."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Events should be grouped by day. What map role does the day value play?",
      "mentalModelCorrection": "The key should be the bucket identity; the value can store the records that share it.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"The day is only a display label, not part of state\", but the useful rule is: The key should be the bucket identity; the value can store the records that share it.",
        "wrong_2": "This option leans on \"The whole event list must be the key\", but the useful rule is: The key should be the bucket identity; the value can store the records that share it."
      }
    },
    "id": "alg-exp-hash-identify-002",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Events should be grouped by day. What map role does the day value play?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The key should be the bucket identity; the value can store the records that share it.",
        "id": "alg-exp-hash-identify-002-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The key should be the bucket identity; the value can store the records that share it."
          },
          {
            "id": "wrong_1",
            "text": "The day is only a display label, not part of state."
          },
          {
            "id": "wrong_2",
            "text": "The whole event list must be the key."
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Identify grouping key role",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Plan A compares every new record with all existing groups. Plan B computes a group key and appends to that bucket. Which comparison is decisive?",
      "mentalModelCorrection": "The grouping key plan wins because it turns repeated comparisons into direct bucket access.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "complexity_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Plan A is stronger because it avoids choosing a key\", but the useful rule is: The grouping key plan wins because it turns repeated comparisons into direct bucket access.",
        "wrong_2": "This option leans on \"Both plans require the same comparisons after every record\", but the useful rule is: The grouping key plan wins because it turns repeated comparisons into direct bucket access."
      }
    },
    "id": "alg-exp-hash-comparison-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Plan A compares every new record with all existing groups. Plan B computes a group key and appends to that bucket. Which comparison is decisive?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The grouping key plan wins because it turns repeated comparisons into direct bucket access.",
        "id": "alg-exp-hash-comparison-001-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The grouping key plan wins because it turns repeated comparisons into direct bucket access."
          },
          {
            "id": "wrong_1",
            "text": "Plan A is stronger because it avoids choosing a key."
          },
          {
            "id": "wrong_2",
            "text": "Both plans require the same comparisons after every record."
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Compare grouping approaches",
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
          "text": "The grouping key plan wins because it turns repeated comparisons into direct bucket access."
        },
        {
          "id": "wrong_1",
          "text": "Plan A is stronger because it avoids choosing a key."
        },
        {
          "id": "wrong_2",
          "text": "Both plans require the same comparisons after every record."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Events should be grouped by the same normalized day. Duplicate values are allowed. Which comparison is decisive?",
      "mentalModelCorrection": "Grouping keys avoid comparing each event with every prior group.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Grouping keys avoid comparing each event with every prior group.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Grouping keys avoid comparing each event with every prior group."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-003",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Events should be grouped by the same normalized day. Duplicate values are allowed. Which comparison is decisive?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Grouping keys avoid comparing each event with every prior group.",
        "id": "alg-prod-hash-003-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Grouping keys avoid comparing each event with every prior group."
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 3",
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
          "text": "Grouping keys avoid comparing each event with every prior group."
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
      "decisionSignal": "Events should be grouped by the same normalized day. The edge case appears at the first or last position. What time and extra space should you expect?",
      "mentalModelCorrection": "Each event is assigned once and buckets can store all events.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-008",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Events should be grouped by the same normalized day. The edge case appears at the first or last position. What time and extra space should you expect?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Each event is assigned once and buckets can store all events.",
        "id": "alg-prod-hash-008-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "complexity_pair"
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 8",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Each event is assigned once and buckets can store all events.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Events should be grouped by the same normalized day. The same input is queried many times. Which comparison is decisive?",
      "mentalModelCorrection": "Grouping keys avoid comparing each event with every prior group.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Grouping keys avoid comparing each event with every prior group.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Grouping keys avoid comparing each event with every prior group."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-013",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Events should be grouped by the same normalized day. The same input is queried many times. Which comparison is decisive?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Grouping keys avoid comparing each event with every prior group.",
        "id": "alg-prod-hash-013-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Grouping keys avoid comparing each event with every prior group."
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 13",
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
          "text": "Grouping keys avoid comparing each event with every prior group."
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
      "decisionSignal": "Events should be grouped by the same normalized day. Original order must be preserved. What time and extra space should you expect?",
      "mentalModelCorrection": "Each event is assigned once and buckets can store all events.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-018",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Events should be grouped by the same normalized day. Original order must be preserved. What time and extra space should you expect?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Each event is assigned once and buckets can store all events.",
        "id": "alg-prod-hash-018-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "complexity_pair"
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 18",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Each event is assigned once and buckets can store all events.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Events should be grouped by the same normalized day. The answer asks for values, not code. Which comparison is decisive?",
      "mentalModelCorrection": "Grouping keys avoid comparing each event with every prior group.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Grouping keys avoid comparing each event with every prior group.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Grouping keys avoid comparing each event with every prior group."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-023",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Events should be grouped by the same normalized day. The answer asks for values, not code. Which comparison is decisive?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Grouping keys avoid comparing each event with every prior group.",
        "id": "alg-prod-hash-023-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Grouping keys avoid comparing each event with every prior group."
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
        "nodeId": "grouping_by_key",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 23",
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
          "text": "Grouping keys avoid comparing each event with every prior group."
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

