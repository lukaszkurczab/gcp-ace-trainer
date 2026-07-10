// Planning target: this file should contain questions about amortized boundary movement, state/deque memory, output cost, and cross-cutting sliding-window review.
// Diagnose false quadratic claims, hidden state costs, backward boundaries, and stale invariants.
// Target question count: 10.
export const complexityAndMistakeReviewQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A longest segment allows at most k category changes. The edge case appears at the first or last position. What time and extra space should you expect?",
      "mentalModelCorrection": "Both boundaries move forward through the sequence once.",
      "mistakeTypes": ["invariant_missing", "invariant_broken"],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic"
    },
    "difficulty": "medium",
    "id": "alg-prod-window-024",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "maintain_window_invariant",
    "prompt": "A longest segment allows at most k category changes. The edge case appears at the first or last position. What time and extra space should you expect?",
    "roadmapNodeId": "sliding_window",
    "secondarySkillAtomIds": ["choose_lookup_key"],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": { "space": "O(n)", "time": "O(n)" },
        "feedback": "Both boundaries move forward through the sequence once.",
        "id": "alg-prod-window-024-check",
        "mistakeTypes": ["invariant_missing", "invariant_broken"],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": ["maintain_window_invariant"],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      { "axisId": "pattern_family", "nodeId": "sliding_window", "role": "primary" },
      { "axisId": "skill_atom", "nodeId": "maintain_window_invariant", "role": "primary" },
      { "axisId": "pattern_variant", "nodeId": "at_most_k_distinct", "role": "secondary" },
      { "axisId": "mistake_type", "nodeId": "invariant_missing", "role": "mistake_type" }
    ],
    "title": "Production sliding-window baseline 24",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Both boundaries move forward through the sequence once.",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)"
  }
];
