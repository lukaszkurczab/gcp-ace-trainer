// Planning target: recognize starts and ends on a line or timeline and choose interval-specific reasoning for overlap, union, insertion, gaps, coverage, concurrency, or selection.
// It should distinguish intervals from arbitrary pairs, points, sliding windows, prefix sums, and generic scheduling.
// Target question count: 14.
// Prefer strategy and signal-recognition items; avoid detailed endpoint, merge, sweep, and complexity mechanics.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeIntervalSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Each item is a range with start and end boundaries, and ordering reveals overlaps or gaps.",
      "distractorExplanations": {
        "frequency_map": "Counts do not preserve range boundaries.",
        "plain_stack": "A stack does not by itself order interval starts and ends.",
        "ignore_boundaries": "Ignoring start and end loses the overlap condition."
      },
      "mentalModelCorrection": "Intervals are about ordering boundaries, then comparing the active or previous range.",
      "mistakeTypes": [
        "wrong_approach",
        "edge_case_missed"
      ],
      "nextAction": "Practice stating which boundary is sorted and what overlap comparison follows.",
      "result": "diagnostic"
    },
    "id": "alg-intervals-naming-001-check",
    "learningStage": "pattern_mechanics",
    "primarySkillAtomId": "reason_about_interval_overlap",
    "prompt": "Choose the interval signal.",
    "roadmapNodeId": "intervals",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "intervals",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_interval_overlap",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "merge_overlaps",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Name interval overlap",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A task gives meeting start and end times and asks whether any meetings overlap. Which reasoning signal matters?",
    "answerFeedback": "Interval overlap is exposed by ordering starts and comparing boundaries.",
    "options": [
      {
        "id": "ordered_boundaries",
        "text": "Order start/end boundaries and compare neighboring ranges.",
        "isCorrect": true
      },
      {
        "id": "frequency_map",
        "text": "Count each time value without boundaries.",
        "isCorrect": false
      },
      {
        "id": "plain_stack",
        "text": "Push every interval and pop arbitrarily.",
        "isCorrect": false
      },
      {
        "id": "ignore_boundaries",
        "text": "Use only the number of intervals.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
