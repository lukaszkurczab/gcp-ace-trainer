// Planning target: this file should contain questions about negative values and other cases that invalidate standard sum-based variable sliding-window reasoning:
// sums decreasing when the right boundary expands; sums increasing when the left boundary is removed;
// non-monotonic validity; target-sum and at-most/at-least constraints; and recognizing when prefix-based state or another pattern is needed.
// It should teach that contiguous input and a numeric threshold are not enough to justify a variable sliding window.
// It should diagnose mistakes such as assuming shrinking always decreases the sum,
// applying a non-negative-window proof to mixed-sign data,
// replacing an invalid window with plain prefix sums without explaining how the desired range is selected,
// or claiming prefix sums alone solve every subarray-target problem.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, counterexample reasoning, and mistake-review style items.
// Avoid fully teaching prefix-sum-plus-hash-map, monotonic deque, balanced trees, or other advanced replacement algorithms; identify the invalid assumption and the required kind of alternative state.
export const negativeValuesAndInvalidWindowAssumptionsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A range-sum task includes readings that can be below zero. Which contrast edge case matters?",
      "mentalModelCorrection": "When values may lower the range total, prefix state avoids assuming shrink direction is predictable.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "wrong_approach"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Negative values make a positive-window invariant safer\", but the useful rule is: When values may lower the range total, prefix state avoids assuming shrink direction is predictable.",
        "wrong_2": "This option leans on \"Range totals do not depend on value signs\", but the useful rule is: When values may lower the range total, prefix state avoids assuming shrink direction is predictable."
      }
    },
    "id": "alg-contrast-window-prefix-negative-001",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "A range-sum task includes readings that can be below zero. Which contrast edge case matters?",
    "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "When values may lower the range total, prefix state avoids assuming shrink direction is predictable.",
        "id": "alg-contrast-window-prefix-negative-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "When values may lower the range total, prefix state avoids assuming shrink direction is predictable."
          },
          {
            "id": "wrong_1",
            "text": "Negative values make a positive-window invariant safer."
          },
          {
            "id": "wrong_2",
            "text": "Range totals do not depend on value signs."
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
        "nodeId": "when_prefix_beats_window",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "negative_numbers_assumption_error",
        "role": "mistake_type"
      }
    ],
    "title": "Contrast negative range values",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "difficulty": "easy"
  }
]
