// Planning target: this file should contain questions about recognizing when dynamic programming is a justified strategy:
// repeated subproblems; the same state reached through multiple decision paths;
// a result that can be composed from smaller state results; and a finite reusable state space.
// It should distinguish DP from plain recursion, brute-force enumeration, greedy choice, divide and conquer, and simple linear accumulation.
// It should diagnose mistakes such as choosing DP only because the prompt asks for a minimum or maximum,
// assuming every recursive solution is dynamic programming, memoizing states that are never repeated,
// or rejecting DP because the original problem statement does not explicitly mention subproblems.
// Target question count: 16.
// Prefer single_choice, strategy_choice, solution_comparison, recursion-tree comparison, and mistake-review style items.
// Avoid detailed state design, recurrence formulas, memo-table code, and advanced DP families; those belong in later files.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeDpSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The problem repeats overlapping subproblems, so the solution needs a state definition and transition.",
      "distractorExplanations": {
        "greedy_only": "A local choice is not justified when subproblems overlap and choices interact.",
        "plain_recursion": "Plain recursion repeats work unless reusable state is defined.",
        "sort_only": "Sorting alone does not define reusable subproblem state."
      },
      "mentalModelCorrection": "Dynamic programming starts by naming what each state means before writing transitions.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "invariant_missing"
      ],
      "nextAction": "Practice stating the state definition in one sentence.",
      "result": "diagnostic"
    },
    "id": "alg-dynamic-programming-intro-naming-001-check",
    "learningStage": "strategy_selection",
    "primarySkillAtomId": "define_dynamic_programming_state",
    "prompt": "Choose the dynamic-programming signal.",
    "roadmapNodeId": "dynamic_programming_intro",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "dynamic_programming_intro",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "define_dynamic_programming_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "state_definition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "invariant_missing",
        "role": "mistake_type"
      }
    ],
    "title": "Name dynamic-programming state",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks for the best score after a sequence of choices where later choices depend on earlier results. Which signal matters first?",
    "answerFeedback": "Overlapping subproblems call for a clear state definition and transition.",
    "options": [
      {
        "id": "state_and_transition",
        "text": "Define reusable state and the transition between states.",
        "isCorrect": true
      },
      {
        "id": "greedy_only",
        "text": "Always take the locally largest value.",
        "isCorrect": false
      },
      {
        "id": "plain_recursion",
        "text": "Recurse without storing any repeated result.",
        "isCorrect": false
      },
      {
        "id": "sort_only",
        "text": "Sort the input and stop there.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
