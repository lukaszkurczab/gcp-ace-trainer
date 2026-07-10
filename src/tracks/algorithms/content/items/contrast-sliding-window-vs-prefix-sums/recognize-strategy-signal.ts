// Planning target: this file should contain questions about recognizing the high-level strategy contrast between sliding window and prefix sums:
// maintaining one evolving contiguous range; incrementally adding and removing boundary elements;
// versus preprocessing cumulative state to answer arbitrary static range queries.
// It should teach the learner to identify whether the task asks to optimize over many candidate windows,
// process one current window online, or answer independently specified ranges.
// It should diagnose mistakes such as choosing sliding window only because the prompt mentions a subarray,
// choosing prefix sums only because the task mentions sums,
// confusing one moving range with many unrelated range queries,
// or comparing Big-O before identifying the required query and update contract.
// Target question count: 14.
// Prefer single_choice, strategy_choice, solution_comparison, and mistake-review style items.
// Avoid detailed pointer mechanics, prefix-index formulas, negative-number edge cases, and full complexity accounting; those belong in later files.
export const recognizeSlidingWindowVsPrefixSumsStrategySignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Which signal should push a range-sum problem away from sliding window and toward prefix state?",
      "mentalModelCorrection": "Prefix sums handle range totals when window movement no longer gives a safe invariant.",
      "mistakeTypes": [
        "negative_numbers_assumption_error",
        "invariant_broken"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"A moving window is always safe for every range sum\", but the useful rule is: Prefix sums handle range totals when window movement no longer gives a safe invariant.",
        "wrong_2": "This option leans on \"Prefix state cannot represent ranges that start later than index 0\", but the useful rule is: Prefix sums handle range totals when window movement no longer gives a safe invariant."
      }
    },
    "id": "alg-contrast-window-prefix-001",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "detect_window_failure_signal",
    "prompt": "Which signal should push a range-sum problem away from sliding window and toward prefix state?",
    "roadmapNodeId": "contrast_sliding_window_vs_prefix_sums",
    "secondarySkillAtomIds": [
      "maintain_window_invariant"
    ],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Prefix sums handle range totals when window movement no longer gives a safe invariant.",
        "id": "alg-contrast-window-prefix-001-check",
        "mistakeTypes": [
          "negative_numbers_assumption_error",
          "invariant_broken"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Prefix sums handle range totals when window movement no longer gives a safe invariant."
          },
          {
            "id": "wrong_1",
            "text": "A moving window is always safe for every range sum."
          },
          {
            "id": "wrong_2",
            "text": "Prefix state cannot represent ranges that start later than index 0."
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
    "title": "Contrast window with prefix sums",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant"
    ],
    "constraintSignal": "Which signal should push a range-sum problem away from sliding window and toward prefix state?",
    "expectedApproachIds": [
      "detect_window_failure_signal"
    ],
    "reasonSignal": "Prefix sums handle range totals when window movement no longer gives a safe invariant.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Prefix sums handle range totals when window movement no longer gives a safe invariant."
        },
        {
          "id": "wrong_1",
          "text": "A moving window is always safe for every range sum."
        },
        {
          "id": "wrong_2",
          "text": "Prefix state cannot represent ranges that start later than index 0."
        }
      ]
    },
    "difficulty": "medium"
  }
]
