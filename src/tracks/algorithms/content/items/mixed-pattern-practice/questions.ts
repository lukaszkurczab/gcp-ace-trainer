import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const mixedPatternPracticeQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A sort would simplify comparison, but original neighbor relationships are required. The input can be large. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Reject sorting when it changes the output contract.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Reject sorting when it changes the output contract.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Reject sorting when it changes the output contract."
      }
    },
    "difficulty": "hard",
    "id": "alg-prod-mixed-025-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "track_index_boundary",
    "prompt": "Choose the reasoning signal that should guide the strategy.",
    "roadmapNodeId": "mixed_pattern_practice",
    "secondarySkillAtomIds": [
      "detect_window_failure_signal",
      "move_decisive_pointer"
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "track_index_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "sorting_cost_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Production mixed-practice baseline 25",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "detect_window_failure_signal",
      "move_decisive_pointer"
    ],
    "constraintSignal": "A sort would simplify comparison, but original neighbor relationships are required. The input can be large. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "track_index_boundary"
    ],
    "reasonSignal": "Reject sorting when it changes the output contract.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "instruction": "A sort would simplify comparison, but original neighbor relationships are required. The input can be large. Which strategy signal should guide the choice?",
    "answerFeedback": "Reject sorting when it changes the output contract.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Reject sorting when it changes the output contract.",
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
