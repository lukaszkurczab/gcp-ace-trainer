// Planning target: this file should contain questions about static preprocessing, update invalidation, and dynamic-query boundaries.
// Preserve this mental-unit boundary and avoid duplicating neighboring units.
// Target question count: 12.
export const multipleQueriesStaticVsDynamicInputQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many queries ask for the total between two indexes in the same array. What state should be prepared?",
      "mentalModelCorrection": "Store each prefix total so a range total can be computed from two accumulated values.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Recompute each queried range from scratch without considering query count\", but the useful rule is: Store each prefix total so a range total can be computed from two accumulated values.",
        "wrong_2": "This option leans on \"Keep only the largest element seen so far\", but the useful rule is: Store each prefix total so a range total can be computed from two accumulated values."
      }
    },
    "id": "alg-prefix-range-query-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many queries ask for the total between two indexes in the same array. What state should be prepared?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Store each prefix total so a range total can be computed from two accumulated values.",
        "id": "alg-prefix-range-query-001-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Store each prefix total so a range total can be computed from two accumulated values."
          },
          {
            "id": "wrong_1",
            "text": "Recompute each queried range from scratch without considering query count."
          },
          {
            "id": "wrong_2",
            "text": "Keep only the largest element seen so far."
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
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Name range-sum state",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A fixed array receives many total-between-indexes queries. Which state should be prepared?",
      "mentalModelCorrection": "Precompute prefix totals when many range queries reuse the same sequence.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Recompute every range because each query is short to describe\", but the useful rule is: Precompute prefix totals when many range queries reuse the same sequence.",
        "wrong_2": "This option leans on \"Use a stack because queries have endpoints\", but the useful rule is: Precompute prefix totals when many range queries reuse the same sequence."
      }
    },
    "id": "alg-exp-prefix-strategy-002",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A fixed array receives many total-between-indexes queries. Which state should be prepared?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Precompute prefix totals when many range queries reuse the same sequence.",
        "id": "alg-exp-prefix-strategy-002-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Precompute prefix totals when many range queries reuse the same sequence."
          },
          {
            "id": "wrong_1",
            "text": "Recompute every range because each query is short to describe."
          },
          {
            "id": "wrong_2",
            "text": "Use a stack because queries have endpoints."
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
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Choose range-query prefix state",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "A fixed array receives many total-between-indexes queries. Which state should be prepared?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Precompute prefix totals when many range queries reuse the same sequence.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Precompute prefix totals when many range queries reuse the same sequence."
        },
        {
          "id": "wrong_1",
          "text": "Recompute every range because each query is short to describe."
        },
        {
          "id": "wrong_2",
          "text": "Use a stack because queries have endpoints."
        }
      ]
    },
    "difficulty": "medium"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A dashboard asks for totals over many date ranges in the same list. Which pattern signal should be named?",
      "mentalModelCorrection": "The signal is repeated range totals; prefix state answers each range from accumulated endpoints.",
      "mistakeTypes": [
        "cannot_explain_why",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"The signal is sorting because dates are ordered\", but the useful rule is: The signal is repeated range totals; prefix state answers each range from accumulated endpoints.",
        "wrong_2": "This option leans on \"The signal is stack state because ranges are nested in the UI\", but the useful rule is: The signal is repeated range totals; prefix state answers each range from accumulated endpoints."
      }
    },
    "id": "alg-exp-prefix-identify-001",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A dashboard asks for totals over many date ranges in the same list. Which pattern signal should be named?",
    "roadmapNodeId": "prefix_sums",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The signal is repeated range totals; prefix state answers each range from accumulated endpoints.",
        "id": "alg-exp-prefix-identify-001-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The signal is repeated range totals; prefix state answers each range from accumulated endpoints."
          },
          {
            "id": "wrong_1",
            "text": "The signal is sorting because dates are ordered."
          },
          {
            "id": "wrong_2",
            "text": "The signal is stack state because ranges are nested in the UI."
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
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Identify repeated range-total signal",
    "trackId": "algorithms",
    "type": "approach_naming",
    "difficulty": "intro"
  },
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Many queries ask for totals between two indexes in the same array. The answer asks for values, not code. Which comparison is decisive?",
      "mentalModelCorrection": "Preprocessing beats recomputing each range when query count is large.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Preprocessing beats recomputing each range when query count is large.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Preprocessing beats recomputing each range when query count is large."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-007",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many queries ask for totals between two indexes in the same array. The answer asks for values, not code. Which comparison is decisive?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Preprocessing beats recomputing each range when query count is large.",
        "id": "alg-prod-prefix-007-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Preprocessing beats recomputing each range when query count is large."
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
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 7",
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
          "text": "Preprocessing beats recomputing each range when query count is large."
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
      "decisionSignal": "Many queries ask for totals between two indexes in the same array. The input can be large. Which comparison is decisive?",
      "mentalModelCorrection": "Preprocessing beats recomputing each range when query count is large.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Preprocessing beats recomputing each range when query count is large.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Preprocessing beats recomputing each range when query count is large."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-prefix-017",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Many queries ask for totals between two indexes in the same array. The input can be large. Which comparison is decisive?",
    "roadmapNodeId": "prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Preprocessing beats recomputing each range when query count is large.",
        "id": "alg-prod-prefix-017-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Preprocessing beats recomputing each range when query count is large."
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
        "nodeId": "range_sum_query",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Production prefix baseline 17",
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
          "text": "Preprocessing beats recomputing each range when query count is large."
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
