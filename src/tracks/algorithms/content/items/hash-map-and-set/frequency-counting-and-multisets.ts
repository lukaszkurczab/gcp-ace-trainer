// Planning target: frequency maps, multiset semantics, count increment/decrement, exact occurrence matching, and positive remaining availability.
// It should require one precise meaning for every stored count.
// Target question count: 18.
// Prefer frequency traces, state-ordering, and edge-case items.
export const frequencyCountingAndMultisetsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Two inventories match only if each sku appears the same number of times. Which lookup state is needed?",
      "mentalModelCorrection": "Count frequencies when equality depends on multiplicity, not just presence.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Use a set because presence alone captures repeated counts\", but the useful rule is: Count frequencies when equality depends on multiplicity, not just presence.",
        "wrong_2": "This option leans on \"Use two pointers without ordering or boundary signals\", but the useful rule is: Count frequencies when equality depends on multiplicity, not just presence."
      }
    },
    "id": "alg-exp-hash-strategy-004",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Two inventories match only if each sku appears the same number of times. Which lookup state is needed?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Count frequencies when equality depends on multiplicity, not just presence.",
        "id": "alg-exp-hash-strategy-004-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Count frequencies when equality depends on multiplicity, not just presence."
          },
          {
            "id": "wrong_1",
            "text": "Use a set because presence alone captures repeated counts."
          },
          {
            "id": "wrong_2",
            "text": "Use two pointers without ordering or boundary signals."
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
        "nodeId": "frequency_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose frequency map state",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "Two inventories match only if each sku appears the same number of times. Which lookup state is needed?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Count frequencies when equality depends on multiplicity, not just presence.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Count frequencies when equality depends on multiplicity, not just presence."
        },
        {
          "id": "wrong_1",
          "text": "Use a set because presence alone captures repeated counts."
        },
        {
          "id": "wrong_2",
          "text": "Use two pointers without ordering or boundary signals."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pass counts every category in a map. What time and extra space should be expected?",
      "mentalModelCorrection": "A frequency map scan is linear time with linear extra space in the number of distinct keys.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "id": "alg-exp-hash-cost-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pass counts every category in a map. What time and extra space should be expected?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "A frequency map scan is linear time with linear extra space in the number of distinct keys.",
        "id": "alg-exp-hash-cost-001-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
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
        "nodeId": "frequency_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost category counting",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "The scan touches each record once, and the frequency map may store every distinct key.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Two inventories match only if every sku count is equal. Original order must be preserved. What time and extra space should you expect?",
      "mentalModelCorrection": "Counting scans the entries and stores one count per distinct sku.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-002",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Two inventories match only if every sku count is equal. Original order must be preserved. What time and extra space should you expect?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Counting scans the entries and stores one count per distinct sku.",
        "id": "alg-prod-hash-002-check",
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
        "nodeId": "frequency_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 2",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Counting scans the entries and stores one count per distinct sku.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Two inventories match only if every sku count is equal. The answer asks for values, not code. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Use a frequency map because presence alone loses multiplicity.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Use a frequency map because presence alone loses multiplicity.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Use a frequency map because presence alone loses multiplicity."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-007",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Two inventories match only if every sku count is equal. The answer asks for values, not code. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use a frequency map because presence alone loses multiplicity.",
        "id": "alg-prod-hash-007-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use a frequency map because presence alone loses multiplicity."
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
        "nodeId": "frequency_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 7",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "Two inventories match only if every sku count is equal. The answer asks for values, not code. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Use a frequency map because presence alone loses multiplicity.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use a frequency map because presence alone loses multiplicity."
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
      "decisionSignal": "Two inventories match only if every sku count is equal. Empty input is valid. What time and extra space should you expect?",
      "mentalModelCorrection": "Counting scans the entries and stores one count per distinct sku.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-012",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Two inventories match only if every sku count is equal. Empty input is valid. What time and extra space should you expect?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Counting scans the entries and stores one count per distinct sku.",
        "id": "alg-prod-hash-012-check",
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
        "nodeId": "frequency_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 12",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Counting scans the entries and stores one count per distinct sku.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Two inventories match only if every sku count is equal. The input can be large. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Use a frequency map because presence alone loses multiplicity.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Use a frequency map because presence alone loses multiplicity.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Use a frequency map because presence alone loses multiplicity."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-017",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Two inventories match only if every sku count is equal. The input can be large. Which strategy signal should guide the choice?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use a frequency map because presence alone loses multiplicity.",
        "id": "alg-prod-hash-017-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use a frequency map because presence alone loses multiplicity."
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
        "nodeId": "frequency_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 17",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "Two inventories match only if every sku count is equal. The input can be large. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Use a frequency map because presence alone loses multiplicity.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use a frequency map because presence alone loses multiplicity."
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
      "decisionSignal": "Two inventories match only if every sku count is equal. Extra memory is acceptable only if it changes scaling. What time and extra space should you expect?",
      "mentalModelCorrection": "Counting scans the entries and stores one count per distinct sku.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-022",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Two inventories match only if every sku count is equal. Extra memory is acceptable only if it changes scaling. What time and extra space should you expect?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "Counting scans the entries and stores one count per distinct sku.",
        "id": "alg-prod-hash-022-check",
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
        "nodeId": "frequency_map",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production hash lookup baseline 22",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Counting scans the entries and stores one count per distinct sku.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  }
];

