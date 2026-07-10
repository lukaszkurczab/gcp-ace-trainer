// Planning target: this file should contain questions about recognizing the high-level contrast between general two-pointer techniques and sliding window:
// two independent candidate positions; opposite-end convergence; read/write roles; pair elimination;
// versus two boundaries representing one current contiguous range with maintained window state.
// It should teach that seeing variables named left and right is not enough to classify an algorithm as sliding window.
// It should diagnose mistakes such as calling every two-pointer loop a sliding window,
// using a window when the pointers represent an independent pair,
// choosing opposite-end pointers for an unsorted pair problem without a valid elimination rule,
// or missing a contiguous-range optimization signal that requires maintained window state.
// Target question count: 14.
// Prefer single_choice, strategy_choice, solution_comparison, and mistake-review style items.
// Avoid detailed pointer traces, shrink mechanics, sorting tradeoffs, and full complexity analysis; those belong in later files.
export const recognizeTwoPointersVsSlidingWindowStrategySignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "What separates a sliding-window problem from a two-boundary pair scan?",
      "mentalModelCorrection": "Use window reasoning only when the answer is a contiguous range with maintainable state.",
      "mistakeTypes": ["wrong_approach", "invariant_missing"],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Any solution with two indexes is a sliding window\", but the useful rule is: Use window reasoning only when the answer is a contiguous range with maintainable state.",
        "wrong_2": "This option leans on \"Contiguous range state and pair boundary state are equivalent\", but the useful rule is: Use window reasoning only when the answer is a contiguous range with maintainable state."
      }
    },
    "id": "alg-contrast-pointers-window-001",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "maintain_window_invariant",
    "prompt": "What separates a sliding-window problem from a two-boundary pair scan?",
    "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
    "secondarySkillAtomIds": ["move_decisive_pointer"],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Use window reasoning only when the answer is a contiguous range with maintainable state.",
        "id": "alg-contrast-pointers-window-001-check",
        "mistakeTypes": ["wrong_approach", "invariant_missing"],
        "options": [
          { "id": "expected_signal", "text": "Use window reasoning only when the answer is a contiguous range with maintainable state." },
          { "id": "wrong_1", "text": "Any solution with two indexes is a sliding window." },
          { "id": "wrong_2", "text": "Contiguous range state and pair boundary state are equivalent." }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": ["maintain_window_invariant"],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      { "axisId": "pattern_family", "nodeId": "sliding_window", "role": "primary" },
      { "axisId": "skill_atom", "nodeId": "maintain_window_invariant", "role": "primary" },
      { "axisId": "pattern_variant", "nodeId": "variable_size_positive_numbers", "role": "secondary" },
      { "axisId": "mistake_type", "nodeId": "wrong_approach", "role": "mistake_type" }
    ],
    "title": "Contrast pointers with window",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": ["move_decisive_pointer"],
    "constraintSignal": "What separates a sliding-window problem from a two-boundary pair scan?",
    "expectedApproachIds": ["maintain_window_invariant"],
    "reasonSignal": "Use window reasoning only when the answer is a contiguous range with maintainable state.",
    "rejectedApproachIds": ["label_only", "implementation_first"],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        { "id": "expected_signal", "text": "Use window reasoning only when the answer is a contiguous range with maintainable state." },
        { "id": "wrong_1", "text": "Any solution with two indexes is a sliding window." },
        { "id": "wrong_2", "text": "Contiguous range state and pair boundary state are equivalent." }
      ]
    },
    "difficulty": "medium"
  }
];
