// Planning target: this file should contain questions about recognizing when linked-list reasoning is central:
// nodes connected by references; local insertion or deletion without shifting later elements;
// unknown-length forward traversal; pointer rewiring; shared tails; cycles;
// and output contracts requiring node reuse rather than array reconstruction.
// It should distinguish linked-list tasks from array indexing, generic two-pointer scans, stacks, queues, and graph traversal.
// It should diagnose mistakes such as choosing a linked list only because data is sequential,
// converting to an array before checking whether node identity must be preserved,
// assuming random access by index is constant time,
// or missing a pointer-rewiring problem hidden behind value-based wording.
// Target question count: 14.
// Prefer single_choice, strategy_choice, solution_comparison, signal-recognition, and mistake-review style items.
// Avoid detailed reversal traces, dummy-node mechanics, cycle proofs, and full complexity calculations.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeLinkedListSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The input is node-linked, so correctness depends on which references change before traversal moves on.",
      "distractorExplanations": {
        "array_index_scan": "Index scans assume random access by position, but linked lists require reference movement.",
        "sort_values_first": "Sorting values does not address the reference rewiring risk.",
        "count_only": "Counting values loses the next-link structure that controls the operation."
      },
      "mentalModelCorrection": "Name the pointer relationship before writing updates: preserve the next node, rewire, then advance.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_trace_algorithm"
      ],
      "nextAction": "Trace one pointer update and say which reference must be saved first.",
      "result": "diagnostic"
    },
    "id": "alg-linked-list-naming-001-check",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "reason_linked_list_rewiring",
    "prompt": "Choose the signal that matches linked-list mechanics.",
    "roadmapNodeId": "linked_list",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "linked_list",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_linked_list_rewiring",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "pointer_rewiring",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Name linked-list rewiring",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task asks you to reverse a singly linked list in place. Which reasoning signal should guide the approach?",
    "answerFeedback": "Linked-list work is controlled by references, so save the next node before changing links.",
    "options": [
      {
        "id": "reference_rewiring",
        "text": "Track next references and rewire them in a safe order.",
        "isCorrect": true
      },
      {
        "id": "array_index_scan",
        "text": "Use direct index access to swap positions.",
        "isCorrect": false
      },
      {
        "id": "sort_values_first",
        "text": "Sort values before changing node links.",
        "isCorrect": false
      },
      {
        "id": "count_only",
        "text": "Count nodes without preserving link direction.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
