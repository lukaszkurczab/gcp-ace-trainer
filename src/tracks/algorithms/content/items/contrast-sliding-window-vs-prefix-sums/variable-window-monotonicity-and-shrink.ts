// Planning target: this file should contain questions about the legality and mechanics of variable-size sliding windows:
// expanding the right boundary; updating window state; shrinking while a constraint is violated;
// preserving a valid candidate; longest or shortest valid contiguous range; and proving that discarded left boundaries never need to return.
// It should teach that variable sliding window requires a condition whose validity changes predictably as the window expands or shrinks.
// It should diagnose mistakes such as shrinking only once when the window may still be invalid,
// recording the answer before restoring validity,
// moving left for a condition that is not monotonic under removal,
// resetting the window instead of incrementally shrinking it,
// or using prefix sums as if they directly select the optimal variable-length range.
// Target question count: 18.
// Prefer single_choice, solution_comparison, edge_case_drill, subgoal_ordering, and small trace-style items.
// Avoid full negative-number treatment, prefix-sum-plus-hash-map mechanics, and monotonic-deque solutions; those belong elsewhere.
export const variableWindowMonotonicityAndShrinkQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "All values are positive and the task asks for the shortest range with enough total. Why can window reasoning be stronger than prefix lookup?",
      "mentalModelCorrection": "A positive-only range with predictable expansion and shrink movement keeps the window invariant valid.",
      "mistakeTypes": [
        "wrong_approach",
        "invariant_missing"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Prefix lookup is always required for every range total\", but the useful rule is: A positive-only range with predictable expansion and shrink movement keeps the window invariant valid.",
        "wrong_2": "This option leans on \"Positive values make boundary movement unpredictable\", but the useful rule is: A positive-only range with predictable expansion and shrink movement keeps the window invariant valid."
      }
    },
    "id": "alg-contrast-prefix-window-001",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "maintain_window_invariant",
    "prompt": "All values are positive and the task asks for the shortest range with enough total. Why can window reasoning be stronger than prefix lookup?",
    "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
    "secondarySkillAtomIds": [
      "detect_window_failure_signal"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "A positive-only range with predictable expansion and shrink movement keeps the window invariant valid.",
        "id": "alg-contrast-prefix-window-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "invariant_missing"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "A positive-only range with predictable expansion and shrink movement keeps the window invariant valid."
          },
          {
            "id": "wrong_1",
            "text": "Prefix lookup is always required for every range total."
          },
          {
            "id": "wrong_2",
            "text": "Positive values make boundary movement unpredictable."
          }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "maintain_window_invariant"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "sliding_window",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "maintain_window_invariant",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "variable_size_positive_numbers",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Contrast prefix with window",
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
          "text": "A positive-only range with predictable expansion and shrink movement keeps the window invariant valid."
        },
        {
          "id": "wrong_1",
          "text": "Prefix lookup is always required for every range total."
        },
        {
          "id": "wrong_2",
          "text": "Positive values make boundary movement unpredictable."
        }
      ]
    },
    "difficulty": "medium"
  }
]
