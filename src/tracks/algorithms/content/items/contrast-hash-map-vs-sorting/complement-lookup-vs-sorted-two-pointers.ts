// Planning target: this file should contain questions contrasting hash-based complement lookup with sorting plus two pointers:
// one-pass complement lookup; lookup-before-insert ordering; preventing reuse of the same element;
// duplicate values; multiplicity; returning pair existence; returning values; returning original indexes;
// sorting value-index pairs; and the different contracts produced by the two strategies.
// It should diagnose mistakes such as inserting the current value before checking its complement and then reusing the same element,
// using a Set when the task requires original indexes,
// sorting raw values and losing index identity,
// assuming two pointers work before sorting,
// or claiming both strategies preserve the same output semantics.
// Target question count: 18.
// Prefer single_choice, solution_comparison, edge_case_drill, mistake-review, and small trace-style items.
// Avoid broad two-pointer curriculum and avoid pair problems where hash state and sorting are not genuine competing approaches.
export const complementLookupVsSortedTwoPointersQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A pair task needs fast membership checks and original positions still matter. Which contrast signal is strongest?",
      "mentalModelCorrection": "Use lookup when preserving original relationships matters more than ordering the whole input.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Sorting is always preferable when pairs are involved\", but the useful rule is: Use lookup when preserving original relationships matters more than ordering the whole input.",
        "wrong_2": "This option leans on \"Original positions never affect pair tasks\", but the useful rule is: Use lookup when preserving original relationships matters more than ordering the whole input."
      }
    },
    "id": "alg-contrast-hash-sorting-001",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A pair task needs fast membership checks and original positions still matter. Which contrast signal is strongest?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [
      "recognize_sorting_tradeoff"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use lookup when preserving original relationships matters more than ordering the whole input.",
        "id": "alg-contrast-hash-sorting-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use lookup when preserving original relationships matters more than ordering the whole input."
          },
          {
            "id": "wrong_1",
            "text": "Sorting is always preferable when pairs are involved."
          },
          {
            "id": "wrong_2",
            "text": "Original positions never affect pair tasks."
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
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Contrast lookup with sorting",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "recognize_sorting_tradeoff"
    ],
    "constraintSignal": "A pair task needs fast membership checks and original positions still matter. Which contrast signal is strongest?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Use lookup when preserving original relationships matters more than ordering the whole input.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use lookup when preserving original relationships matters more than ordering the whole input."
        },
        {
          "id": "wrong_1",
          "text": "Sorting is always preferable when pairs are involved."
        },
        {
          "id": "wrong_2",
          "text": "Original positions never affect pair tasks."
        }
      ]
    },
    "difficulty": "medium"
  }
]
