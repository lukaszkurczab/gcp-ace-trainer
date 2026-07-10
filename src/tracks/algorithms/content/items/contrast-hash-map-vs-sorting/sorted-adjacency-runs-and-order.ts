// Planning target: this file should contain questions about cases where sorting creates useful global structure:
// equal values becoming adjacent; scanning maximal equal-value runs; ordered deduplication;
// deterministic sorted output; neighboring-value comparisons; gaps; ranges; and traversing values in rank order.
// It should contrast this with hash-based state, which supports keyed lookup but does not directly create sorted adjacency or rank order.
// It should diagnose mistakes such as checking only adjacent original elements for global duplicates,
// assuming Map or Set iteration always provides the required sorted order,
// using frequency state when the output itself must be ordered,
// or sorting when order is irrelevant and direct keyed lookup fully satisfies the contract.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, and small trace-style items.
// Avoid specific sorting algorithm mechanics, broad interval algorithms, and questions where ordering is not relevant to the hash-versus-sort decision.
export const sortedAdjacencyRunsAndOrderQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Values only need to be grouped by closeness after ordering; original positions are irrelevant. Which side of the contrast is stronger?",
      "mentalModelCorrection": "Sorting is stronger when adjacency after ordering directly reveals the needed relationship and original order is irrelevant.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Use lookup only because lookup can store values\", but the useful rule is: Sorting is stronger when adjacency after ordering directly reveals the needed relationship and original order is irrelevant.",
        "wrong_2": "This option leans on \"Avoid ordering even when adjacency is the actual signal\", but the useful rule is: Sorting is stronger when adjacency after ordering directly reveals the needed relationship and original order is irrelevant."
      }
    },
    "id": "alg-contrast-sorting-hash-001",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Values only need to be grouped by closeness after ordering; original positions are irrelevant. Which side of the contrast is stronger?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [
      "choose_lookup_key"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Sorting is stronger when adjacency after ordering directly reveals the needed relationship and original order is irrelevant.",
        "id": "alg-contrast-sorting-hash-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Sorting is stronger when adjacency after ordering directly reveals the needed relationship and original order is irrelevant."
          },
          {
            "id": "wrong_1",
            "text": "Use lookup only because lookup can store values."
          },
          {
            "id": "wrong_2",
            "text": "Avoid ordering even when adjacency is the actual signal."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "sort_then_scan",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Contrast sorting with lookup",
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
          "text": "Sorting is stronger when adjacency after ordering directly reveals the needed relationship and original order is irrelevant."
        },
        {
          "id": "wrong_1",
          "text": "Use lookup only because lookup can store values."
        },
        {
          "id": "wrong_2",
          "text": "Avoid ordering even when adjacency is the actual signal."
        }
      ]
    },
    "difficulty": "medium"
  }
]
