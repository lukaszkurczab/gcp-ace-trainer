// Planning target: this file should contain questions about opposite-direction two pointers for pair and symmetry reasoning:
// pointers starting at both ends; sorted-order elimination; moving left or right based on a comparison;
// pair-sum existence; closest-pair style reasoning; palindrome-style mirrored comparisons;
// and proving why one movement cannot discard a valid answer.
// It should contrast independent endpoint candidates with a sliding window whose interior is maintained as one aggregate state.
// It should diagnose mistakes such as calling the entire interval an active sliding window when only the endpoint pair matters,
// moving both pointers after every comparison, applying sorted pair elimination to unsorted data,
// reversing the movement rule, or claiming the method works because the range becomes smaller without proving elimination correctness.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, invariant reasoning, and small trace-style items.
// Avoid full three-sum, k-sum, container-area, and advanced pair-optimization curricula.
export const oppositeEndsPairSearchQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A sorted pair task asks for two values, not a contiguous range. Why is a window signal weak?",
      "mentalModelCorrection": "Two pointers are stronger when a pair comparison rules out one boundary without maintaining a whole range.",
      "mistakeTypes": ["wrong_approach", "invariant_missing"],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"A contiguous range is implied by any sorted input\", but the useful rule is: Two pointers are stronger when a pair comparison rules out one boundary without maintaining a whole range.",
        "wrong_2": "This option leans on \"A window is better because it also has left and right boundaries\", but the useful rule is: Two pointers are stronger when a pair comparison rules out one boundary without maintaining a whole range."
      }
    },
    "id": "alg-contrast-window-pointers-001",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "move_decisive_pointer",
    "prompt": "A sorted pair task asks for two values, not a contiguous range. Why is a window signal weak?",
    "roadmapNodeId": "contrast_two_pointers_vs_sliding_window",
    "secondarySkillAtomIds": ["maintain_window_invariant"],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Two pointers are stronger when a pair comparison rules out one boundary without maintaining a whole range.",
        "id": "alg-contrast-window-pointers-001-check",
        "mistakeTypes": ["wrong_approach", "invariant_missing"],
        "options": [
          { "id": "expected_signal", "text": "Two pointers are stronger when a pair comparison rules out one boundary without maintaining a whole range." },
          { "id": "wrong_1", "text": "A contiguous range is implied by any sorted input." },
          { "id": "wrong_2", "text": "A window is better because it also has left and right boundaries." }
        ],
        "prompt": "Choose the reasoning signal that should guide the strategy.",
        "status": "active",
        "testedSkillAtomIds": ["move_decisive_pointer"],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      { "axisId": "pattern_family", "nodeId": "two_pointers", "role": "primary" },
      { "axisId": "skill_atom", "nodeId": "move_decisive_pointer", "role": "primary" },
      { "axisId": "pattern_variant", "nodeId": "pair_scan_sorted_input", "role": "secondary" },
      { "axisId": "mistake_type", "nodeId": "wrong_approach", "role": "mistake_type" }
    ],
    "title": "Contrast window with pointers",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": ["decision signal", "constraint fit", "state needed"],
      "kind": "solution_comparison",
      "solutions": [
        { "id": "expected_signal", "text": "Two pointers are stronger when a pair comparison rules out one boundary without maintaining a whole range." },
        { "id": "wrong_1", "text": "A contiguous range is implied by any sorted input." },
        { "id": "wrong_2", "text": "A window is better because it also has left and right boundaries." }
      ]
    },
    "difficulty": "medium"
  }
];
