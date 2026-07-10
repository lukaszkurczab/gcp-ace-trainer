// Planning target: this file should contain questions about recognizing when a greedy strategy may be appropriate:
// repeated selection of one locally best feasible candidate, irreversible commitments, consistent ordering, and a possible proof that an optimum begins with the greedy choice.
// It should distinguish greedy from brute force, dynamic programming, backtracking, sorting alone, and arbitrary heuristics.
// It should diagnose choosing greedy only for min/max objectives, treating any one-pass algorithm or sort as greedy, and rejecting irreversible choices.
// Target question count: 16.
// Prefer single_choice, strategy_choice, solution_comparison, signal-recognition, and mistake-review style items.
// Avoid full proof construction, interval traces, and complete DP comparisons; those belong in later files.
export const recognizeGreedySignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A local choice is safe because ordering or an exchange argument preserves the best result.",
      "distractorExplanations": {
        "try_all_subsets": "Trying every subset ignores the local-choice signal.",
        "random_choice": "A greedy choice needs a reason, not arbitrary selection.",
        "memorize_state": "Reusable state is a dynamic-programming signal, not the core greedy signal."
      },
      "mentalModelCorrection": "Greedy reasoning must justify why the local choice cannot make the final answer worse.",
      "mistakeTypes": ["wrong_approach", "cannot_explain_why"],
      "nextAction": "Practice naming the ordering or exchange reason behind the local choice.",
      "result": "diagnostic"
    },
    "id": "alg-greedy-intro-naming-001",
    "learningStage": "strategy_selection",
    "primarySkillAtomId": "justify_greedy_choice",
    "prompt": "A task asks you to choose jobs by earliest finishing time to maximize the number scheduled. What signal supports the approach?",
    "roadmapNodeId": "greedy_intro",
    "staticMicroChecks": [
      {
        "correctAnswer": "safe_local_choice",
        "feedback": "The local choice must be justified by ordering or exchange reasoning.",
        "id": "alg-greedy-intro-naming-001-check",
        "mistakeTypes": ["wrong_approach", "cannot_explain_why"],
        "options": [
          { "id": "safe_local_choice", "text": "The ordered local choice is safe for the final objective." },
          { "id": "try_all_subsets", "text": "Enumerate every subset without using order." },
          { "id": "random_choice", "text": "Pick any job because local choices are always fine." },
          { "id": "memorize_state", "text": "Define a table for every overlapping subproblem." }
        ],
        "prompt": "Choose the greedy signal.",
        "status": "active",
        "testedSkillAtomIds": ["justify_greedy_choice"],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      { "axisId": "pattern_family", "nodeId": "greedy_intro", "role": "primary" },
      { "axisId": "skill_atom", "nodeId": "justify_greedy_choice", "role": "primary" },
      { "axisId": "pattern_variant", "nodeId": "local_choice_signal", "role": "secondary" },
      { "axisId": "mistake_type", "nodeId": "cannot_explain_why", "role": "mistake_type" }
    ],
    "title": "Name greedy local choice",
    "trackId": "algorithms",
    "type": "approach_naming"
  }
];
