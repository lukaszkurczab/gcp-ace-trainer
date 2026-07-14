// Planning target: this file should contain questions about identifying structural signals in the input and objective:
// sorted order; contiguous ranges; repeated prefix relationships; hierarchical data; graph connectivity; local adjacency;
// latest unresolved context; best-next candidate; overlapping subproblems; monotonic predicates; repeated range queries;
// and choose-explore-undo structure.
// It should teach that a signal is a mathematical or structural property, not merely a keyword in the prompt.
// It should diagnose choosing sliding window whenever the word substring appears, choosing binary search whenever input is sorted,
// choosing dynamic programming whenever recursion is possible, choosing a heap whenever the task asks for a maximum,
// or missing a useful invariant because the prompt uses unfamiliar domain language.
// Target question count: 18.
// Prefer single_choice, signal-recognition, representation selection, cross-pattern comparison, and mistake-review style items.
// Avoid full implementation plans and detailed traces.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const inputPropertiesAndStructuralSignalsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "feedbackModel": {
      "decisionSignal": "A sorted input asks for the first position satisfying a condition. Duplicate values are allowed. Which strategy signal should guide the choice?",
      "mentalModelCorrection": "Choose binary search because an ordered boundary can be preserved.",
      "mistakeTypes": [
        "wrong_approach",
        "cannot_explain_why"
      ],
      "nextAction": "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_1": "This option leans on \"Choose the most familiar label before checking the constraint\", but the useful rule is: Choose binary search because an ordered boundary can be preserved.",
        "wrong_2": "This option leans on \"Start with implementation details before naming the required state\", but the useful rule is: Choose binary search because an ordered boundary can be preserved."
      }
    },
    "difficulty": "hard",
    "id": "alg-prod-strategy-019-check",
    "learningStage": "strategy_selection",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Choose the reasoning signal that should guide the strategy.",
    "roadmapNodeId": "strategy_selection_core",
    "secondarySkillAtomIds": [
      "maintain_window_invariant",
      "identify_monotonic_predicate"
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "monotonic_predicate_recognition",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Production strategy-selection baseline 19",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "maintain_window_invariant",
      "identify_monotonic_predicate"
    ],
    "constraintSignal": "A sorted input asks for the first position satisfying a condition. Duplicate values are allowed. Which strategy signal should guide the choice?",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "reasonSignal": "Choose binary search because an ordered boundary can be preserved.",
    "rejectedApproachIds": [
      "label_only",
      "implementation_first"
    ],
    "instruction": "A sorted input asks for the first position satisfying a condition. Duplicate values are allowed. Which strategy signal should guide the choice?",
    "answerFeedback": "Choose binary search because an ordered boundary can be preserved.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Choose binary search because an ordered boundary can be preserved.",
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
