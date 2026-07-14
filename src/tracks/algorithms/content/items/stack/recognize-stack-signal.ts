// Planning target: this file should contain questions about recognizing LIFO strategy signals: newest unresolved context, nesting, delimiters, expression work, undo, deferred work, and recent-item cancellation.
// Distinguish stacks from queues, recursion, ordinary storage, arbitrary two pointers, and monotonic stacks.
// Target question count: 14.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeStackSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "Expression-like tokens need the most recent operator context. The answer asks for values, not code. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Push context when entering a nested segment and pop it when closing.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "edge_case_missed"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Push context when entering a nested segment and pop it when closing.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Push context when entering a nested segment and pop it when closing."
      }
    },
    "difficulty": "medium",
    "id": "alg-prod-stack-015-check",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "use_last_unresolved_state",
    "prompt": "Choose the reasoning signal that should guide the strategy.",
    "roadmapNodeId": "stack",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "stack",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_last_unresolved_state",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "expression_like_processing",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Production stack baseline 15",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "Expression-like tokens need the most recent operator context. The answer asks for values, not code. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "use_last_unresolved_state"
    ],
    "reasonSignal": "Push context when entering a nested segment and pop it when closing.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "instruction": "Expression-like tokens need the most recent operator context. The answer asks for values, not code. Which strategy signal should guide the choice?",
    "answerFeedback": "Push context when entering a nested segment and pop it when closing.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Push context when entering a nested segment and pop it when closing.",
        "isCorrect": true
      },
      {
        "id": "wrong_1",
        "text": "Choose the most familiar label before checking the constraint.",
        "isCorrect": false
      },
      {
        "id": "wrong_2",
        "text": "Start with implementation details before naming the required state.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
