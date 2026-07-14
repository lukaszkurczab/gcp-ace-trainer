import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const presenceTrackingQuestions = [
  {
    "acceptableApproachIds": [],
    "constraintSignal": "The prompt asks whether any value appears more than once anywhere in the input.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "seen_set"
    ],
    "feedbackModel": {
      "decisionSignal": "Duplicate-anywhere detection needs memory of previously seen values, not adjacency.",
      "distractorExplanations": {
        "adjacent_scan": "Adjacent scan misses duplicates that are separated, such as `[1, 2, 1]`.",
        "first_last_only": "Only checking the ends ignores duplicates in the middle.",
        "sort_required": "Sorting can work, but a seen set detects duplicates directly in one pass."
      },
      "mentalModelCorrection": "Duplicate anywhere is not the same as adjacent duplicate.",
      "mistakeTypes": [
        "wrong_approach",
        "constraint_ignored"
      ],
      "nextAction": "Ask whether duplicates must be adjacent or can occur anywhere.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-073-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "Choose the state that fits duplicate-anywhere detection.",
    "reasonSignal": "A seen set is enough for duplicate-anywhere detection because only presence before the current value matters.",
    "rejectedApproachIds": [
      "adjacent_scan",
      "first_last_only"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
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
        "nodeId": "distinguish_presence_from_count",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "presence_tracking",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Separate duplicate-anywhere from adjacent duplicate",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "instruction": "A task asks whether any value appears more than once anywhere in an array. Which state is enough to detect that?",
    "answerFeedback": "For duplicate-anywhere detection, a seen set is enough because you only need to know whether the value appeared earlier.",
    "options": [
      {
        "id": "seen_values",
        "text": "A set of values already seen.",
        "isCorrect": true
      },
      {
        "id": "adjacent_scan",
        "text": "Only compare each value with its neighbor.",
        "isCorrect": false
      },
      {
        "id": "first_last_only",
        "text": "Only compare the first and last values.",
        "isCorrect": false
      },
      {
        "id": "sort_required",
        "text": "Sorting is the only valid approach.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Sorting groups equal values, but it changes the tradeoff from hash state to ordering cost.",
      "distractorExplanations": {
        "counting_direct": "Counting or seen-set lookup is usually more direct when sorted output is not required.",
        "presence_impossible": "Presence tracking is possible with a hash set.",
        "adjacent_original": "After sorting, adjacency no longer reflects original positions."
      },
      "mentalModelCorrection": "Sorting can make duplicates adjacent, but it pays O(n log n) unless special constraints apply.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Ask whether sorted order is needed or merely a side effect.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-076-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "prompt": "Choose the tradeoff.",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_seen_state_complexity"
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
        "nodeId": "compare_complexity_tradeoffs",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_seen_state_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "presence_tracking",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Compare sorting with seen-state duplicate detection",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A learner sorts an array to find whether any value appears twice. What is the main tradeoff compared with using a seen set?",
    "answerFeedback": "Sorting can group duplicates, but it pays ordering cost when a seen set can detect repeats directly.",
    "options": [
      {
        "id": "sorting_pays_ordering_cost",
        "text": "Sorting pays ordering cost even though only duplicate presence is needed.",
        "isCorrect": true
      },
      {
        "id": "counting_direct",
        "text": "Sorting is always more direct than seen-state lookup.",
        "isCorrect": false
      },
      {
        "id": "presence_impossible",
        "text": "A seen set cannot detect duplicates.",
        "isCorrect": false
      },
      {
        "id": "adjacent_original",
        "text": "Sorted adjacency preserves original adjacency.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
