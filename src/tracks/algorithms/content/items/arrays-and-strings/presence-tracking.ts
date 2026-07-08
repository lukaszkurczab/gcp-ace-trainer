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
    "id": "alg-prod-array-string-073",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_presence_from_count",
    "prompt": "A task asks whether any value appears more than once anywhere in an array. Which state is enough to detect that?",
    "reasonSignal": "A seen set is enough for duplicate-anywhere detection because only presence before the current value matters.",
    "rejectedApproachIds": [
      "adjacent_scan",
      "first_last_only"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "choose_frequency_state"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "seen_values",
        "feedback": "For duplicate-anywhere detection, a seen set is enough because you only need to know whether the value appeared earlier.",
        "id": "alg-prod-array-string-073-check",
        "mistakeTypes": [
          "wrong_approach",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "seen_values",
            "text": "A set of values already seen."
          },
          {
            "id": "adjacent_scan",
            "text": "Only compare each value with its neighbor."
          },
          {
            "id": "first_last_only",
            "text": "Only compare the first and last values."
          },
          {
            "id": "sort_required",
            "text": "Sorting is the only valid approach."
          }
        ],
        "prompt": "Choose the state that fits duplicate-anywhere detection.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_presence_from_count"
        ],
        "type": "single_choice"
      }
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
    "type": "strategy_choice"
  },
  {
    "complexityExplanation": "A seen-set duplicate check scans once and can store up to k distinct values.",
    "complexityVariables": {
      "k": "number of distinct values stored",
      "n": "input length"
    },
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(k)",
    "expectedTimeComplexity": "O(n)",
    "feedbackModel": {
      "decisionSignal": "Duplicate-anywhere detection with a seen set is a one-pass lookup problem.",
      "mentalModelCorrection": "A set avoids nested comparisons, but it still uses space for distinct values.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "For hash-backed state, count scans separately from stored distinct keys.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-075",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_seen_state_complexity",
    "prompt": "You detect whether an array contains any duplicate by scanning once and storing seen values in a set. What time and extra space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(k)"
        },
        "feedback": "The scan is O(n), and the seen set can store up to k distinct values.",
        "id": "alg-prod-array-string-075-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "reason_about_seen_state_complexity"
        ],
        "type": "complexity_pair"
      }
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
        "nodeId": "reason_about_seen_state_complexity",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
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
    "title": "Estimate seen-set duplicate detection",
    "trackId": "algorithms",
    "type": "complexity_check"
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
    "id": "alg-prod-array-string-076",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "prompt": "A learner sorts an array to find whether any value appears twice. What is the main tradeoff compared with using a seen set?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_seen_state_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "sorting_pays_ordering_cost",
        "feedback": "Sorting can group duplicates, but it pays ordering cost when a seen set can detect repeats directly.",
        "id": "alg-prod-array-string-076-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "sorting_pays_ordering_cost",
            "text": "Sorting pays ordering cost even though only duplicate presence is needed."
          },
          {
            "id": "counting_direct",
            "text": "Sorting is always more direct than seen-state lookup."
          },
          {
            "id": "presence_impossible",
            "text": "A seen set cannot detect duplicates."
          },
          {
            "id": "adjacent_original",
            "text": "Sorted adjacency preserves original adjacency."
          }
        ],
        "prompt": "Choose the tradeoff.",
        "status": "active",
        "testedSkillAtomIds": [
          "compare_complexity_tradeoffs"
        ],
        "type": "single_choice"
      }
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
    "type": "solution_comparison"
  }
];
