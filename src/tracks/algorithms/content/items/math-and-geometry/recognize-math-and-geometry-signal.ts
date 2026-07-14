// Planning target: this file should contain questions about recognizing when a mathematical identity or geometric representation is the core of the solution:
// divisibility; modular cycles; repeated numeric structure; factor relationships;
// coordinate differences; orientation; area; overlap; transformations; and direct formula-based reasoning.
// It should distinguish math-and-geometry problems from generic simulation, brute force, graph traversal, dynamic programming, and data-structure selection.
// It should teach learners to derive the represented quantity before selecting a formula.
// It should diagnose mistakes such as using a memorized formula without matching its variables,
// choosing simulation when a closed-form invariant exists,
// treating every coordinate problem as graph traversal,
// or assuming every numeric task belongs to dynamic programming.
// Target question count: 14.
// Prefer single_choice, strategy_choice, representation selection, solution_comparison, and mistake-review style items.
// Avoid detailed modulo cases, prime traces, cross-product signs, and full complexity calculations.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeMathAndGeometrySignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The prompt depends on numeric structure, formulas, modular behavior, or coordinates.",
      "distractorExplanations": {
        "nested_search": "Broad search ignores the numeric relationship that can simplify the work.",
        "hash_everything": "A lookup table is not the first signal when a formula or coordinate rule decides the answer.",
        "stack_state": "Last-in-first-out state is unrelated to numeric structure."
      },
      "mentalModelCorrection": "Name the numeric or coordinate property before choosing data structures.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Practice stating the formula or coordinate relation in plain language.",
      "result": "diagnostic"
    },
    "id": "alg-math-and-geometry-naming-001-check",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "reason_about_numeric_structure",
    "prompt": "Choose the math-and-geometry signal.",
    "roadmapNodeId": "math_and_geometry",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "math_and_geometry",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_numeric_structure",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "coordinate_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Name coordinate reasoning",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks whether two rectangles overlap using their corner coordinates. Which signal should guide the approach?",
    "answerFeedback": "Rectangle overlap is decided by coordinate inequalities, not broad enumeration.",
    "options": [
      {
        "id": "coordinate_relation",
        "text": "Use the coordinate relationship between rectangle boundaries.",
        "isCorrect": true
      },
      {
        "id": "nested_search",
        "text": "Enumerate every possible point in both rectangles.",
        "isCorrect": false
      },
      {
        "id": "hash_everything",
        "text": "Store every coordinate in a lookup table first.",
        "isCorrect": false
      },
      {
        "id": "stack_state",
        "text": "Use only the most recent coordinate pair.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
