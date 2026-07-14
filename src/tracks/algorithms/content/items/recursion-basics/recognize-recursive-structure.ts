// Planning target: this file should contain questions about recognizing recursive problem structure:
// a problem defined in terms of a smaller instance of the same problem; nested or hierarchical data;
// repeated removal of one unit; natural descent toward a boundary; and work that must resume after a nested subproblem returns.
// It should distinguish recursion from loops, backtracking, dynamic programming, divide and conquer, and ordinary function composition.
// It should diagnose mistakes such as calling any repeated function use recursion, choosing recursion only because a tree appears in the prompt,
// using recursion when the state does not become smaller, or missing a recursive structure because the prompt does not explicitly mention self-calls.
// Target question count: 14.
// Prefer single_choice, strategy_choice, solution_comparison, signal-recognition, and mistake-review style items.
// Avoid detailed stack traces, base-case code, recursion trees, and complexity calculations.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeRecursiveStructureQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The same work repeats on a smaller input until a base case stops the calls.",
      "distractorExplanations": {
        "global_sort": "Sorting does not explain the repeated smaller call or the stopping condition.",
        "hash_lookup": "Lookup state may help some problems, but recursion is signaled by decomposition and a base case.",
        "two_boundaries": "Two moving boundaries are not the main signal here."
      },
      "mentalModelCorrection": "Name the base case first, then state how each call makes the problem smaller.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "edge_case_missed"
      ],
      "nextAction": "Practice identifying the base case before tracing recursive calls.",
      "result": "diagnostic"
    },
    "id": "alg-recursion-basics-naming-001-check",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "trace_recursive_base_case",
    "prompt": "Choose the signal that matches recursion.",
    "roadmapNodeId": "recursion_basics",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "recursion_basics",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_recursive_base_case",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "base_case_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Name recursion base case",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A function processes a nested structure by handling one part, then calling itself on the remaining smaller structure. What signal matters first?",
    "answerFeedback": "Recursive reasoning starts with the stopping condition and the smaller repeated call.",
    "options": [
      {
        "id": "base_case_then_smaller_call",
        "text": "Identify the base case and the smaller call.",
        "isCorrect": true
      },
      {
        "id": "global_sort",
        "text": "Sort all values before processing.",
        "isCorrect": false
      },
      {
        "id": "hash_lookup",
        "text": "Store every value for constant-time lookup.",
        "isCorrect": false
      },
      {
        "id": "two_boundaries",
        "text": "Move two pointers toward each other.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
