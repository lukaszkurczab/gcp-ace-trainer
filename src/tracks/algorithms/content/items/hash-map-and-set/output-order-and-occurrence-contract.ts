// Planning target: first/last occurrence, encounter order, sorted output, original indexes, deterministic results, and Map/Set iteration-order limits.
// It should teach that keyed lookup does not automatically satisfy an ordering contract.
// Target question count: 12.
// Prefer output-contract and edge-case items.
export const outputOrderAndOccurrenceContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A lookup derives a compact code from each record before matching. Original order must be preserved. What mistake should be reviewed?",
      "mentalModelCorrection": "Review using the full record as a key when the prompt defines equivalence differently.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Review using the full record as a key when the prompt defines equivalence differently.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Review using the full record as a key when the prompt defines equivalence differently."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-010",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A lookup derives a compact code from each record before matching. Original order must be preserved. What mistake should be reviewed?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Review using the full record as a key when the prompt defines equivalence differently.",
        "id": "alg-prod-hash-010-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Review using the full record as a key when the prompt defines equivalence differently."
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
    "title": "Production hash lookup baseline 10",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A lookup derives a compact code from each record before matching. Empty input is valid. What mistake should be reviewed?",
      "mentalModelCorrection": "Review using the full record as a key when the prompt defines equivalence differently.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "duplicate_handling_error"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Review using the full record as a key when the prompt defines equivalence differently.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Review using the full record as a key when the prompt defines equivalence differently."
      }
    },
    "difficulty": "easy",
    "id": "alg-prod-hash-020",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A lookup derives a compact code from each record before matching. Empty input is valid. What mistake should be reviewed?",
    "roadmapNodeId": "hash_map_and_set",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Review using the full record as a key when the prompt defines equivalence differently.",
        "id": "alg-prod-hash-020-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "duplicate_handling_error"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Review using the full record as a key when the prompt defines equivalence differently."
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
    "title": "Production hash lookup baseline 20",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  }
];

