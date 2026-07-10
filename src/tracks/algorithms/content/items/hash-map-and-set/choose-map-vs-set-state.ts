// Planning target: choose Set for presence-only state and Map when each key needs a count, index, group, best value, or metadata.
// It should diagnose insufficient Set state, needless boolean Maps, and state choices disconnected from the output contract.
// Target question count: 14.
// Prefer representation-choice and state-selection items.
export const chooseMapVsSetStateQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A stream asks whether the current reading has appeared before. Which state best matches the signal?",
      "mentalModelCorrection": "Store the value needed for future membership checks, not the whole scanned prefix.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Keep a sorted copy because membership always needs ordering\", but the useful rule is: Store the value needed for future membership checks, not the whole scanned prefix.",
        "wrong_2": "This option leans on \"Track only the previous reading because older values cannot matter\", but the useful rule is: Store the value needed for future membership checks, not the whole scanned prefix."
      }
    },
    "id": "alg-exp-hash-strategy-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A stream asks whether the current reading has appeared before. Which state best matches the signal?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Store the value needed for future membership checks, not the whole scanned prefix.",
        "id": "alg-exp-hash-strategy-001-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Store the value needed for future membership checks, not the whole scanned prefix."
          },
          {
            "id": "wrong_1",
            "text": "Keep a sorted copy because membership always needs ordering."
          },
          {
            "id": "wrong_2",
            "text": "Track only the previous reading because older values cannot matter."
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
    "title": "Choose membership state",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A stream asks whether the current reading has appeared before. Which state best matches the signal?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Store the value needed for future membership checks, not the whole scanned prefix.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Store the value needed for future membership checks, not the whole scanned prefix."
        },
        {
          "id": "wrong_1",
          "text": "Keep a sorted copy because membership always needs ordering."
        },
        {
          "id": "wrong_2",
          "text": "Track only the previous reading because older values cannot matter."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "One task asks whether a tag appears; another asks how often it appears. Which distinction matters?",
      "mentalModelCorrection": "A set is enough for presence; a map is needed when counts or payloads affect the answer.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Presence and frequency require identical state\", but the useful rule is: A set is enough for presence; a map is needed when counts or payloads affect the answer.",
        "wrong_2": "This option leans on \"Counts can always be recovered from a set\", but the useful rule is: A set is enough for presence; a map is needed when counts or payloads affect the answer."
      }
    },
    "id": "alg-exp-hash-identify-003",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "One task asks whether a tag appears; another asks how often it appears. Which distinction matters?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "A set is enough for presence; a map is needed when counts or payloads affect the answer.",
        "id": "alg-exp-hash-identify-003-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "A set is enough for presence; a map is needed when counts or payloads affect the answer."
          },
          {
            "id": "wrong_1",
            "text": "Presence and frequency require identical state."
          },
          {
            "id": "wrong_2",
            "text": "Counts can always be recovered from a set."
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
    "title": "Identify set versus map state",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A solution uses a set for an inventory task where two copies of the same sku matter. What issue should be reviewed?",
      "mentalModelCorrection": "The mistake is losing multiplicity; duplicate values can change the answer.",
      "mistakeTypes": [
        "duplicate_handling_error",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"A set stores duplicate counts automatically\", but the useful rule is: The mistake is losing multiplicity; duplicate values can change the answer.",
        "wrong_2": "This option leans on \"Duplicates never affect lookup-based tasks\", but the useful rule is: The mistake is losing multiplicity; duplicate values can change the answer."
      }
    },
    "id": "alg-exp-hash-mistake-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A solution uses a set for an inventory task where two copies of the same sku matter. What issue should be reviewed?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The mistake is losing multiplicity; duplicate values can change the answer.",
        "id": "alg-exp-hash-mistake-001-check",
        "mistakeTypes": [
          "duplicate_handling_error",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The mistake is losing multiplicity; duplicate values can change the answer."
          },
          {
            "id": "wrong_1",
            "text": "A set stores duplicate counts automatically."
          },
          {
            "id": "wrong_2",
            "text": "Duplicates never affect lookup-based tasks."
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
        "nodeId": "duplicate_handling_error",
        "role": "mistake_type"
      }
    ],
    "title": "Review lost duplicate counts",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "difficulty": "easy"
  }
];

