export const timeSpaceTradeoffsQuestions = [
  {
    "complexityExplanation": "A single scan visits each input value once. The lookup state can grow with the number of values seen so far.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "feedbackModel": {
      "decisionSignal": "n can be 100000. You scan once and keep a lookup of values seen so far. What time and space cost should you expect?",
      "mentalModelCorrection": "Use the constraint first, then choose mechanics that avoid nested pair enumeration. The lookup trades O(n) auxiliary space for one linear scan.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Compare the cost of one scan with lookup state against checking every pair.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-constraint-pair-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "separate_time_and_space_complexity",
    "prompt": "n can be 100000. You scan once and keep a lookup of values seen so far. What time and space cost should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(n)",
          "time": "O(n)"
        },
        "feedback": "One pass is linear, and the lookup can store up to n values from the scan.",
        "id": "alg-check-complexity-pair-001",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the time and space pair for a one-pass lookup scan.",
        "status": "active",
        "testedSkillAtomIds": [
          "separate_time_and_space_complexity"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "separate_time_and_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Constraint-first cost check",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A duplicate checker scans n values. Plan A scans all previous values for each item. Plan B keeps a seen set. Which tradeoff matters?",
      "mentalModelCorrection": "A seen set uses extra memory to replace repeated previous-value scans with lookup checks.",
      "mistakeTypes": [
        "brute_force_when_optimized_required",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice identifying when lookup state removes repeated scans.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_avoid_memory": "Avoiding memory can create O(n^2) repeated scans.",
        "wrong_pair": "Pair enumeration solves the duplicate check but does unnecessary repeated work."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A duplicate checker scans n values. Plan A scans all previous values for each item. Plan B keeps a seen set. Which tradeoff matters?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The seen set can reduce time from repeated scans to one pass, at the cost of O(n) extra space.",
        "id": "alg-complexity-time-space-tradeoff-001-check",
        "mistakeTypes": [
          "brute_force_when_optimized_required",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use O(n) extra space for a seen set to avoid O(n^2) repeated previous-value scans."
          },
          {
            "id": "wrong_avoid_memory",
            "text": "Avoid the set because any extra memory is worse than repeated scans."
          },
          {
            "id": "wrong_pair",
            "text": "Compare every pair because duplicate checking is always about pair enumeration."
          }
        ],
        "prompt": "Choose the decisive tradeoff.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Trade seen set for repeated scans",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "one_pass_lookup_state"
    ],
    "constraintSignal": "The repeated operation is membership among previously seen values.",
    "expectedApproachIds": [
      "evaluate_time_space_tradeoff"
    ],
    "reasonSignal": "A seen set uses O(n) extra space to avoid O(n^2) repeated previous-value scans.",
    "rejectedApproachIds": [
      "repeated_previous_scan"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use O(n) extra space for a seen set to avoid O(n^2) repeated previous-value scans."
        },
        {
          "id": "wrong_avoid_memory",
          "text": "Avoid the set because any extra memory is worse than repeated scans."
        },
        {
          "id": "wrong_pair",
          "text": "Compare every pair because duplicate checking is always about pair enumeration."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan visits n values once, and the set may store up to n distinct values.",
    "feedbackModel": {
      "decisionSignal": "A one-pass duplicate checker inserts each value into a seen set and checks membership before inserting. What time and extra space should you expect?",
      "mentalModelCorrection": "Expected hash lookups make the scan linear, while the set contents can grow with the input.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice counting both lookup time and collection storage.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-time-space-tradeoff-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A one-pass duplicate checker inserts each value into a seen set and checks membership before inserting. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "Expected set operations are constant per value, and the set may store n values.",
        "id": "alg-complexity-time-space-tradeoff-002-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost one-pass duplicate set",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A teammate says the seen-set solution is O(1) space because there is only one set variable. What correction should you make?",
      "mentalModelCorrection": "Space is about how many values the set can hold, not how many variable names are declared.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice counting collection contents as auxiliary space.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_variable": "One variable can reference a collection that grows to n values.",
        "wrong_time": "The issue is auxiliary storage, not lookup time."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A teammate says the seen-set solution is O(1) space because there is only one set variable. What correction should you make?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "A set can use O(n) extra space when it stores up to n input-derived values.",
        "id": "alg-complexity-time-space-tradeoff-003-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Count the set contents; one set variable can still store O(n) values."
          },
          {
            "id": "wrong_variable",
            "text": "Agree that one variable always means O(1) space."
          },
          {
            "id": "wrong_time",
            "text": "Correct them by saying set lookup is always O(n)."
          }
        ],
        "prompt": "Choose the correction.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Correct one-set-variable space claim",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A two-sum checker can either scan all pairs or keep complements in a set while scanning once. n can be large. Which strategy signal matters?",
      "mentalModelCorrection": "The set stores needed complements so each later value can be checked by lookup instead of pair enumeration.",
      "mistakeTypes": [
        "brute_force_when_optimized_required",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice recognizing complement lookup as a time-space tradeoff.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_pair": "All-pairs search is O(n^2) and ignores the lookup opportunity.",
        "wrong_sort_only": "Sorting may be another valid family in some variants, but the signal here is one-pass complement lookup."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A two-sum checker can either scan all pairs or keep complements in a set while scanning once. n can be large. Which strategy signal matters?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Complement lookup trades O(n) extra space for expected O(n) time.",
        "id": "alg-complexity-time-space-tradeoff-004-check",
        "mistakeTypes": [
          "brute_force_when_optimized_required",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "A set can store seen values or complements so each value is checked by lookup instead of all-pairs search."
          },
          {
            "id": "wrong_pair",
            "text": "All pairs must be scanned because the task asks about two values."
          },
          {
            "id": "wrong_sort_only",
            "text": "The only valid improvement is sorting; lookup state cannot help."
          }
        ],
        "prompt": "Choose the strategy signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Use complement lookup instead of pairs",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "one_pass_lookup_state"
    ],
    "constraintSignal": "The task repeatedly asks whether a needed complement has appeared.",
    "expectedApproachIds": [
      "evaluate_time_space_tradeoff"
    ],
    "reasonSignal": "Lookup state can replace all-pairs search with expected constant membership checks.",
    "rejectedApproachIds": [
      "brute_force_pair_enumeration"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "A set can store seen values or complements so each value is checked by lookup instead of all-pairs search."
        },
        {
          "id": "wrong_pair",
          "text": "All pairs must be scanned because the task asks about two values."
        },
        {
          "id": "wrong_sort_only",
          "text": "The only valid improvement is sorting; lookup state cannot help."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan processes each value once and stores seen values or needed complements in a set that can grow to n entries.",
    "feedbackModel": {
      "decisionSignal": "A one-pass two-sum plan keeps a set of seen values and checks whether target - current exists. What time and extra space should you expect?",
      "mentalModelCorrection": "The speedup comes from expected constant membership lookup; the cost is linear auxiliary storage.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice naming both sides of a lookup-state tradeoff.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-time-space-tradeoff-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A one-pass two-sum plan keeps a set of seen values and checks whether target - current exists. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "Each value is processed once, and the seen set may grow to n entries.",
        "id": "alg-complexity-time-space-tradeoff-005-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost one-pass two-sum lookup",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A frequency question asks for the most common value. Plan A repeatedly counts each candidate by scanning the array. Plan B builds a frequency map once. Which comparison is decisive?",
      "mentalModelCorrection": "A frequency map pays O(n) storage to avoid repeated full-array counting.",
      "mistakeTypes": [
        "brute_force_when_optimized_required",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice recognizing repeated counting as a map-building signal.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_recount": "Recounting for each candidate repeats the same full scan.",
        "wrong_constant_space": "Constant space is not automatically better when it creates dominant repeated work."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A frequency question asks for the most common value. Plan A repeatedly counts each candidate by scanning the array. Plan B builds a frequency map once. Which comparison is decisive?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The frequency map replaces repeated full scans with one pass plus stored counts.",
        "id": "alg-complexity-time-space-tradeoff-006-check",
        "mistakeTypes": [
          "brute_force_when_optimized_required",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Plan B uses O(n) possible map storage to avoid repeated full-array counts."
          },
          {
            "id": "wrong_recount",
            "text": "Plan A is better because counting by scanning uses no map."
          },
          {
            "id": "wrong_constant_space",
            "text": "Always choose the plan with O(1) extra space before considering time."
          }
        ],
        "prompt": "Choose the decisive comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Trade frequency map for repeated counts",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "repeated counting",
        "map storage",
        "total time"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Plan B uses O(n) possible map storage to avoid repeated full-array counts."
        },
        {
          "id": "wrong_recount",
          "text": "Plan A is better because counting by scanning uses no map."
        },
        {
          "id": "wrong_constant_space",
          "text": "Always choose the plan with O(1) extra space before considering time."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan processes n values once. The map stores one count per distinct value d, and d is bounded by n, so the supported worst-case auxiliary-space label is O(n).",
    "feedbackModel": {
      "decisionSignal": "A frequency map is built while scanning n values, and there are d distinct values. What time and extra space should you expect?",
      "mentalModelCorrection": "Frequency storage grows with distinct keys, not with the number of map variables.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice naming distinct-key space when it is available.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-time-space-tradeoff-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A frequency map is built while scanning n values, and there are d distinct values. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "The scan is O(n), and the map stores up to n distinct keys in the worst case.",
        "id": "alg-complexity-time-space-tradeoff-007-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost frequency map by distinct keys",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A plan avoids a map by scanning the whole array each time it needs a value's count. What time-space mistake should you catch?",
      "mentalModelCorrection": "Avoiding memory can move the cost into repeated full scans.",
      "mistakeTypes": [
        "brute_force_when_optimized_required",
        "constraint_ignored"
      ],
      "nextAction": "Practice identifying when O(1) space creates unacceptable repeated work.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_memory_only": "Low memory is not enough if the repeated scan dominates total time.",
        "wrong_one_count": "The issue is repeated counting, not one isolated scan."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A plan avoids a map by scanning the whole array each time it needs a value's count. What time-space mistake should you catch?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The plan saves memory but creates repeated full-array scans.",
        "id": "alg-complexity-time-space-tradeoff-008-check",
        "mistakeTypes": [
          "brute_force_when_optimized_required",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "It optimizes for O(1) space while creating repeated scans that can dominate time."
          },
          {
            "id": "wrong_memory_only",
            "text": "It is always better because it uses less memory."
          },
          {
            "id": "wrong_one_count",
            "text": "It is always O(n) total because a count can be found with one scan."
          }
        ],
        "prompt": "Choose the time-space mistake.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Catch low-memory repeated scans",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task asks whether each value is present in an allowlist. The allowlist has k values and there are n checks. Plan A uses array.includes on the allowlist each time. Plan B builds an allowSet first. Which comparison matters?",
      "mentalModelCorrection": "Building a set can turn repeated allowlist scans into expected constant lookups.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "complexity_mismatch"
      ],
      "nextAction": "Practice recognizing repeated membership against a reused collection.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_includes": "Array includes can scan k values on every check.",
        "wrong_no_build": "The build cost can pay off when many checks reuse the same allowlist."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A task asks whether each value is present in an allowlist. The allowlist has k values and there are n checks. Plan A uses array.includes on the allowlist each time. Plan B builds an allowSet first. Which comparison matters?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The set plan pays O(k) space/build cost to avoid O(k) scan per check.",
        "id": "alg-complexity-time-space-tradeoff-009-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Plan B pays O(k) memory to make n membership checks expected O(1) instead of scanning k each time."
          },
          {
            "id": "wrong_includes",
            "text": "Plan A is always better because includes is a built-in method."
          },
          {
            "id": "wrong_no_build",
            "text": "Plan B is always worse because preprocessing has any cost at all."
          }
        ],
        "prompt": "Choose the decisive comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Trade allowlist set for repeated membership",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "allowlist size",
        "number of checks",
        "membership cost"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Plan B pays O(k) memory to make n membership checks expected O(1) instead of scanning k each time."
        },
        {
          "id": "wrong_includes",
          "text": "Plan A is always better because includes is a built-in method."
        },
        {
          "id": "wrong_no_build",
          "text": "Plan B is always worse because preprocessing has any cost at all."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(k)",
    "expectedTimeComplexity": "O(n + m)",
    "complexityExplanation": "Building the set from m allowlist values costs O(m), then n expected constant lookups cost O(n). The set stores k allowed values when k names that allowlist size.",
    "feedbackModel": {
      "decisionSignal": "You build a set from m allowlist values, then perform n membership checks against it. What total time and extra space should you expect?",
      "mentalModelCorrection": "Prebuilding lookup state has a build cost and storage cost, but can make each check expected constant.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice combining preprocessing-like build cost with repeated lookup cost.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-time-space-tradeoff-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "You build a set from m allowlist values, then perform n membership checks against it. What total time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n + m)",
          "space": "O(k)"
        },
        "feedback": "The build costs O(m), the n lookups cost O(n) expected total, and the set stores the allowlist values.",
        "id": "alg-complexity-time-space-tradeoff-010-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected total time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost prebuilt allowlist set",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "There is only one membership check against a small allowlist. Which set-building claim should you be cautious about?",
      "mentalModelCorrection": "Lookup state pays off when reused; one small check may not justify building a set.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking reuse before paying memory/build cost.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_always_set": "A set is not automatically better when there is no repeated lookup.",
        "wrong_never_set": "This does not mean sets are bad; it means reuse matters."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "There is only one membership check against a small allowlist. Which set-building claim should you be cautious about?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Do not assume set preprocessing pays off when the lookup is not repeated.",
        "id": "alg-complexity-time-space-tradeoff-011-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Building a set may not pay off when there is only one small membership check."
          },
          {
            "id": "wrong_always_set",
            "text": "Always build a set before any membership check."
          },
          {
            "id": "wrong_never_set",
            "text": "Never build a set because arrays can also check membership."
          }
        ],
        "prompt": "Choose the cautious tradeoff claim.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Question set build for one lookup",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A scan needs only the maximum value seen so far. A teammate suggests storing every previous value in a set. What should you say?",
      "mentalModelCorrection": "Extra memory is justified by a needed future lookup; a running maximum only needs fixed state.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "complexity_mismatch"
      ],
      "nextAction": "Practice rejecting unnecessary lookup state when fixed running state is enough.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_set": "A set stores more state than the task needs.",
        "wrong_future_lookup": "The prompt does not require asking whether arbitrary previous values appeared."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A scan needs only the maximum value seen so far. A teammate suggests storing every previous value in a set. What should you say?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "A running maximum needs O(1) state; storing all previous values is unnecessary.",
        "id": "alg-complexity-time-space-tradeoff-012-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Use a fixed running maximum; no lookup set is needed."
          },
          {
            "id": "wrong_set",
            "text": "Store every previous value because sets are generally safer."
          },
          {
            "id": "wrong_future_lookup",
            "text": "Use a set because every scan might need future membership lookup."
          }
        ],
        "prompt": "Choose the correct memory decision.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Reject unnecessary set for running maximum",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "constant_running_state"
    ],
    "constraintSignal": "The task only needs the maximum value seen so far.",
    "expectedApproachIds": [
      "evaluate_time_space_tradeoff"
    ],
    "reasonSignal": "A running maximum needs constant state; storing all previous values is unnecessary.",
    "rejectedApproachIds": [
      "unnecessary_lookup_state"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Use a fixed running maximum; no lookup set is needed."
        },
        {
          "id": "wrong_set",
          "text": "Store every previous value because sets are generally safer."
        },
        {
          "id": "wrong_future_lookup",
          "text": "Use a set because every scan might need future membership lookup."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A keeps a map of last seen indexes for each character. Plan B, for each position, scans backward to find the previous same character. Which tradeoff matters?",
      "mentalModelCorrection": "Last-seen state stores previous positions so each lookup avoids a backward scan.",
      "mistakeTypes": [
        "brute_force_when_optimized_required",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice recognizing last-seen maps as memory used to remove repeated search.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_backward": "Backward scanning can repeat work for many positions.",
        "wrong_no_memory": "Avoiding memory is not enough when it causes repeated search."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "Plan A keeps a map of last seen indexes for each character. Plan B, for each position, scans backward to find the previous same character. Which tradeoff matters?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The last-seen map trades storage for direct access to previous positions.",
        "id": "alg-complexity-time-space-tradeoff-016-check",
        "mistakeTypes": [
          "brute_force_when_optimized_required",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The map stores last positions so each step avoids scanning backward."
          },
          {
            "id": "wrong_backward",
            "text": "Backward scanning is always better because it stores no map."
          },
          {
            "id": "wrong_no_memory",
            "text": "The plan with less memory is automatically more scalable."
          }
        ],
        "prompt": "Choose the decisive tradeoff.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "fixed_domain_or_constant_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Use last-seen map to avoid backward scans",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "last seen state",
        "backward scan cost",
        "memory tradeoff"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "The map stores last positions so each step avoids scanning backward."
        },
        {
          "id": "wrong_backward",
          "text": "Backward scanning is always better because it stores no map."
        },
        {
          "id": "wrong_no_memory",
          "text": "The plan with less memory is automatically more scalable."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan processes n characters once. The last-seen map stores one entry for each distinct character d, and d is bounded by n, so the supported worst-case auxiliary-space label is O(n).",
    "feedbackModel": {
      "decisionSignal": "A scan over n characters stores the last seen index for each distinct character. There are d distinct characters. What time and extra space should you expect?",
      "mentalModelCorrection": "Last-seen storage grows with distinct keys, bounded by n.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice naming distinct-character state rather than only n.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-time-space-tradeoff-017",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A scan over n characters stores the last seen index for each distinct character. There are d distinct characters. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "The scan is O(n), and the map stores up to n distinct characters in the worst case.",
        "id": "alg-complexity-time-space-tradeoff-017-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "complexity_pair"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "fixed_domain_or_constant_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost last-seen character map",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A problem has a tiny fixed alphabet of 26 lowercase letters. A plan stores counts in an array of length 26. What space signal should you name?",
      "mentalModelCorrection": "A fixed-size count array is constant auxiliary space relative to input length.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice distinguishing fixed-domain memory from input-growing memory.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_n": "The count array length is fixed at 26, not proportional to n.",
        "wrong_no_memory": "It uses extra memory, but that memory is constant relative to input length."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-018",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A problem has a tiny fixed alphabet of 26 lowercase letters. A plan stores counts in an array of length 26. What space signal should you name?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The count array uses O(1) auxiliary space because the alphabet size is fixed.",
        "id": "alg-complexity-time-space-tradeoff-018-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "O(1), because the count array size is fixed at 26."
          },
          {
            "id": "wrong_n",
            "text": "O(n), because every frequency counter is linear space."
          },
          {
            "id": "wrong_no_memory",
            "text": "O(0), because fixed-size arrays do not count as memory."
          }
        ],
        "prompt": "Choose the correct space signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize fixed-alphabet count space",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task compares two strings for anagram equality. Plan A sorts both strings. Plan B counts characters in a fixed alphabet. Which tradeoff is relevant?",
      "mentalModelCorrection": "A fixed-size count array can avoid sorting while using constant auxiliary space for a fixed alphabet.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "complexity_mismatch"
      ],
      "nextAction": "Practice choosing count state only when the domain and operation fit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_sort_only": "Sorting is valid, but counting may reduce time when the character domain is fixed.",
        "wrong_unbounded_map": "For a fixed alphabet, a length-26 array is not O(n) auxiliary space."
      }
    },
    "id": "alg-complexity-time-space-tradeoff-019",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "A task compares two strings for anagram equality. Plan A sorts both strings. Plan B counts characters in a fixed alphabet. Which tradeoff is relevant?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Fixed-domain counting can avoid sorting with constant-size auxiliary counts.",
        "id": "alg-complexity-time-space-tradeoff-019-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Counting with a fixed-size array can trade small constant memory for linear time."
          },
          {
            "id": "wrong_sort_only",
            "text": "Sorting is the only viable strategy because any counting structure is O(n) space."
          },
          {
            "id": "wrong_unbounded_map",
            "text": "Use an unbounded map even though the prompt gives a fixed alphabet."
          }
        ],
        "prompt": "Choose the relevant tradeoff.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Trade fixed counts for sorting",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "fixed domain",
        "count storage",
        "sort avoidance"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Counting with a fixed-size array can trade small constant memory for linear time."
        },
        {
          "id": "wrong_sort_only",
          "text": "Sorting is the only viable strategy because any counting structure is O(n) space."
        },
        {
          "id": "wrong_unbounded_map",
          "text": "Use an unbounded map even though the prompt gives a fixed alphabet."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the reasoning steps for deciding whether extra lookup memory is worth using.",
      "mentalModelCorrection": "First identify repeated membership/search, then estimate repeated-scan cost, then count lookup storage, then decide if the tradeoff improves scaling.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice justifying memory by the repeated operation it removes.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-time-space-tradeoff-020",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_time_space_tradeoff",
    "prompt": "Order the reasoning steps for deciding whether extra lookup memory is worth using.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "identify_repeated_lookup",
          "estimate_without_memory",
          "estimate_storage",
          "compare_scaling"
        ],
        "feedback": "Use memory deliberately: name the repeated lookup, estimate the no-memory cost, count storage, then compare scaling.",
        "id": "alg-complexity-time-space-tradeoff-020-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "identify_repeated_lookup",
            "text": "Identify the repeated membership or search operation."
          },
          {
            "id": "estimate_without_memory",
            "text": "Estimate the cost if each lookup is handled by scanning."
          },
          {
            "id": "estimate_storage",
            "text": "Estimate how many values the set or map may store."
          },
          {
            "id": "compare_scaling",
            "text": "Compare whether the added memory improves total scaling."
          }
        ],
        "prompt": "Tap the tradeoff reasoning steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "evaluate_time_space_tradeoff"
        ],
        "type": "order_steps"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "evaluate_time_space_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "time_space_tradeoff",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order lookup-memory tradeoff reasoning",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  }
];
