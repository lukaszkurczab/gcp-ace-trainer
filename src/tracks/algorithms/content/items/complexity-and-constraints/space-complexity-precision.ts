export const spaceComplexityPrecisionQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan visits n values once but stores only a fixed running total.",
    "feedbackModel": {
      "decisionSignal": "A routine scans n numbers and stores only currentSum and bestSum. What extra space should you expect?",
      "mentalModelCorrection": "A fixed number of scalar variables is constant extra space.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice separating the size of the input from the size of the auxiliary state.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A routine scans n numbers and stores only currentSum and bestSum. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(1)"
        },
        "feedback": "The scan is linear, and currentSum plus bestSum is fixed-size auxiliary state.",
        "id": "alg-complexity-space-precision-001-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost scan with two running sums",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A scan keeps current value, previous value, and best answer. Which space signal should you name?",
      "mentalModelCorrection": "Current, previous, and best are a constant-size running summary.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice recognizing fixed running state in scans.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_linear": "Seeing n input values does not mean storing n auxiliary values.",
        "wrong_map": "No later membership lookup is needed, so a map is not implied."
      }
    },
    "id": "alg-complexity-space-precision-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A scan keeps current value, previous value, and best answer. Which space signal should you name?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The extra space is O(1) because the scan stores a fixed number of values.",
        "id": "alg-complexity-space-precision-002-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "O(1), because the scan stores only a fixed running summary."
          },
          {
            "id": "wrong_linear",
            "text": "O(n), because the scan has processed n values."
          },
          {
            "id": "wrong_map",
            "text": "O(n), because every scan should store a map of previous values."
          }
        ],
        "prompt": "Choose the correct space signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Identify fixed running summary",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The loop scans n values once and stores only counters for a fixed set of categories.",
    "feedbackModel": {
      "decisionSignal": "A routine scans n events and counts how many are success, warning, or error. What time and extra space should you expect?",
      "mentalModelCorrection": "Counters for a fixed number of categories are constant extra space.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice distinguishing fixed category counters from maps that grow with input.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A routine scans n events and counts how many are success, warning, or error. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(1)"
        },
        "feedback": "There are n events to scan, but only three counters are stored.",
        "id": "alg-complexity-space-precision-003-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost fixed-category counters",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan visits each id once, and the set can grow to hold every distinct id.",
    "feedbackModel": {
      "decisionSignal": "A routine scans n account ids and inserts each unseen id into a set. What time and extra space should you expect?",
      "mentalModelCorrection": "A set variable is not constant space when its contents can grow with input size.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice counting collection contents, not only variable names.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A routine scans n account ids and inserts each unseen id into a set. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "The scan is linear, and the set may store up to n distinct ids.",
        "id": "alg-complexity-space-precision-004-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost seen-id set storage",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A teammate says a set is O(1) space because it is one variable. What correction should you make?",
      "mentalModelCorrection": "Auxiliary space counts the values stored inside the collection.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice counting collection capacity as part of auxiliary space.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_one_variable": "One variable can reference a collection with many stored values.",
        "wrong_ignore_contents": "The collection contents are exactly what auxiliary space must count."
      }
    },
    "id": "alg-complexity-space-precision-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A teammate says a set is O(1) space because it is one variable. What correction should you make?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "A set can be O(n) auxiliary space if it stores up to n input-derived values.",
        "id": "alg-complexity-space-precision-005-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Count the number of values stored inside the set, not just the variable holding it."
          },
          {
            "id": "wrong_one_variable",
            "text": "The set is O(1) because the code declares only one set variable."
          },
          {
            "id": "wrong_ignore_contents",
            "text": "Collection contents do not count as auxiliary space."
          }
        ],
        "prompt": "Choose the correction.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Correct one-variable set reasoning",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A frequency map stores one entry per distinct value. n values are scanned, and there can be d distinct values. Which space signal is most precise?",
      "mentalModelCorrection": "The map grows with the number of distinct keys, bounded by n.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice using distinct-key count when it is more precise than raw n.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_n_only": "O(n) is a valid upper bound, but d distinct keys is the more precise signal here.",
        "wrong_constant": "The map is not constant if the number of distinct keys grows."
      }
    },
    "id": "alg-complexity-space-precision-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A frequency map stores one entry per distinct value. n values are scanned, and there can be d distinct values. Which space signal is most precise?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The map stores d distinct keys, so O(d) is precise and O(n) is the upper bound.",
        "id": "alg-complexity-space-precision-006-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "O(d), bounded by O(n), because the map stores one entry per distinct value."
          },
          {
            "id": "wrong_n_only",
            "text": "Exactly O(n) in all cases, even if there are only a few distinct values."
          },
          {
            "id": "wrong_constant",
            "text": "O(1), because the map is one variable."
          }
        ],
        "prompt": "Choose the most precise space signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Use distinct-key map space",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The algorithm mutates the input array in place and stores only read/write indexes plus counters.",
    "feedbackModel": {
      "decisionSignal": "A filter-like routine compacts valid items inside the original array using read and write indexes. What time and extra space should you expect?",
      "mentalModelCorrection": "In-place compaction can avoid auxiliary output storage.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice distinguishing in-place mutation from creating a new result collection.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A filter-like routine compacts valid items inside the original array using read and write indexes. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(1)"
        },
        "feedback": "The routine scans n items and stores only fixed indexes while mutating the original array.",
        "id": "alg-complexity-space-precision-007-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost in-place compaction state",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan visits n values and creates a new result array that can contain up to n values.",
    "feedbackModel": {
      "decisionSignal": "A filter scans n values and pushes matching items into a new result array. What time and returned-output storage should you expect?",
      "mentalModelCorrection": "The scan is linear, and the returned result array can grow with the number of matches.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice counting created output storage when the contract returns a new collection.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "account_for_output_space",
    "prompt": "A filter scans n values and pushes matching items into a new result array. What time and returned-output storage should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "The scan is linear, and the new result array may store up to n matching items.",
        "id": "alg-complexity-space-precision-008-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "account_for_output_space"
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
        "nodeId": "account_for_output_space",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "output_space_contract",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost new filter result storage",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A function returns all matching pairs, and there may be many of them. What output-space warning should you name?",
      "mentalModelCorrection": "Auxiliary state may be small, but the returned output can grow with the number of produced pairs.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice comparing in-place and new-output contracts separately from time.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_same": "Both scan once, but they do not necessarily use the same extra space.",
        "wrong_time_only": "The question asks for space, not only time."
      }
    },
    "id": "alg-complexity-space-precision-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "account_for_output_space",
    "prompt": "A function returns all matching pairs, and there may be many of them. What output-space warning should you name?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Plan A can be O(1) extra space, while Plan B can use O(n) space for the returned array.",
        "id": "alg-complexity-space-precision-009-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Plan A can use O(1) extra space; Plan B can use O(n) for the new result array."
          },
          {
            "id": "wrong_same",
            "text": "They have the same space because both scan the same input once."
          },
          {
            "id": "wrong_time_only",
            "text": "Only time matters because both plans are O(n)."
          }
        ],
        "prompt": "Choose the decisive space comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "account_for_output_space"
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
        "nodeId": "account_for_output_space",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "output_space_contract",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Compare in-place and new-output space",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "mutation contract",
        "returned collection",
        "auxiliary space"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Plan A can use O(1) extra space; Plan B can use O(n) for the new result array."
        },
        {
          "id": "wrong_same",
          "text": "They have the same space because both scan the same input once."
        },
        {
          "id": "wrong_time_only",
          "text": "Only time matters because both plans are O(n)."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A routine builds and returns a list of all accepted records. What should the space answer say about output storage?",
      "mentalModelCorrection": "State whether you are counting auxiliary working state, returned output storage, or both.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking whether output size is part of the contract.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_counters": "The routine is not storing only counters; it returns all matching pairs.",
        "wrong_constant": "Returning a large result list is not constant space."
      }
    },
    "id": "alg-complexity-space-precision-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "account_for_output_space",
    "prompt": "A routine builds and returns a list of all accepted records. What should the space answer say about output storage?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The result list itself can require O(n^2) output space.",
        "id": "alg-complexity-space-precision-010-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The output list can grow to O(n^2) because it stores all matching pairs."
          },
          {
            "id": "wrong_counters",
            "text": "The space is O(1) because pair generation can use two loop indexes."
          },
          {
            "id": "wrong_constant",
            "text": "The output list does not count as space because it is returned."
          }
        ],
        "prompt": "Choose the space warning.",
        "status": "active",
        "testedSkillAtomIds": [
          "account_for_output_space"
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
        "nodeId": "account_for_output_space",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "output_space_contract",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Notice large output space",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A pair routine only returns the count of matching pairs, not the pairs themselves. What space signal should you name?",
      "mentalModelCorrection": "Counting many conceptual pairs can still use constant extra space if only a scalar count is stored.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice separating conceptual combinations from stored output.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_output_pairs": "The routine does not store the pairs; it stores only the count.",
        "wrong_time_space_mix": "Time may be quadratic, but space depends on what is stored."
      }
    },
    "id": "alg-complexity-space-precision-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A pair routine only returns the count of matching pairs, not the pairs themselves. What space signal should you name?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The extra space can be O(1) because only a scalar count is stored.",
        "id": "alg-complexity-space-precision-011-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "O(1), because only a scalar count is stored."
          },
          {
            "id": "wrong_output_pairs",
            "text": "O(n^2), because there may be O(n^2) conceptual pairs."
          },
          {
            "id": "wrong_time_space_mix",
            "text": "O(n), because every pair routine must store the input again."
          }
        ],
        "prompt": "Choose the correct space signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "fixed_domain_or_constant_bound",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Separate counted pairs from stored pairs",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The scan visits n values once and stores values in buckets. Across all buckets, up to n input values may be stored.",
    "feedbackModel": {
      "decisionSignal": "A routine scans n records and groups them into a map from status to arrays of records. What time and extra space should you expect?",
      "mentalModelCorrection": "Even if the number of statuses is fixed, the arrays can store many records.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice counting stored values inside map buckets.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A routine scans n records and groups them into a map from status to arrays of records. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "The map has fixed status keys, but the bucket arrays can collectively store n records.",
        "id": "alg-complexity-space-precision-012-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
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
    "title": "Cost fixed-key buckets with many records",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A map has only three fixed keys, but each key points to an array of input records. What space mistake should you catch?",
      "mentalModelCorrection": "Fixed key count does not imply constant space when the values stored under those keys grow.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice counting nested collection contents, not only top-level keys.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_fixed_keys": "The keys are fixed, but the arrays under them can grow.",
        "wrong_map_variable": "The map variable can reference storage proportional to input size."
      }
    },
    "id": "alg-complexity-space-precision-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A map has only three fixed keys, but each key points to an array of input records. What space mistake should you catch?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The mistake is counting only fixed keys and ignoring that the bucket arrays can store n records.",
        "id": "alg-complexity-space-precision-013-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Counting only the fixed keys and ignoring the growing arrays stored as values."
          },
          {
            "id": "wrong_fixed_keys",
            "text": "Assuming the map must be O(n) because every map always grows by key count."
          },
          {
            "id": "wrong_map_variable",
            "text": "Ignoring time complexity because the map is stored in one variable."
          }
        ],
        "prompt": "Choose the space mistake.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Catch fixed-key bucket mistake",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A routine returns only true or false. A teammate says the boolean result alone proves O(1) extra space. What is missing from that reasoning?",
      "mentalModelCorrection": "The result type is not enough; you must check whether the algorithm stores seen values or other input-growing state.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming the operation that requires memory before choosing set/map.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_constant": "The returned boolean is small, but the algorithm may still store seen values while computing it.",
        "wrong_always_set": "Some boolean scans need only counters or flags; memory depends on the operation, not the answer type."
      }
    },
    "id": "alg-complexity-space-precision-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "separate_time_and_space_complexity",
    "prompt": "A routine returns only true or false. A teammate says the boolean result alone proves O(1) extra space. What is missing from that reasoning?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The result type is not enough; check whether the algorithm stores seen values or other input-growing state.",
        "id": "alg-complexity-space-precision-014-check",
        "mistakeTypes": [
          "data_structure_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The result type is not enough; you must check whether the algorithm stores seen values or other input-growing state."
          },
          {
            "id": "wrong_constant",
            "text": "A boolean result always means O(1) auxiliary space."
          },
          {
            "id": "wrong_always_set",
            "text": "A boolean result always requires a set, because every yes/no question needs memory."
          }
        ],
        "prompt": "Choose the correct memory reasoning.",
        "status": "active",
        "testedSkillAtomIds": [
          "separate_time_and_space_complexity"
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
        "nodeId": "separate_time_and_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Avoid automatic set for boolean result",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "complexityExplanation": "The algorithm scans once and keeps only the current best candidate plus its count.",
    "feedbackModel": {
      "decisionSignal": "A majority-candidate scan keeps only candidate and count while reading n values. What time and extra space should you expect?",
      "mentalModelCorrection": "Some problems can be solved with a small running summary instead of a frequency map.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice recognizing when map storage is unnecessary because the state contract is small.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A majority-candidate scan keeps only candidate and count while reading n values. What time and extra space should you expect?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(1)"
        },
        "feedback": "The scan is linear and stores only candidate plus count.",
        "id": "alg-complexity-space-precision-015-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "data_structure_mismatch"
        ],
        "prompt": "Choose the expected time and extra space cost.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Prefer candidate-count state when enough",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the review steps for auxiliary-space accounting.",
      "mentalModelCorrection": "First identify what is stored, then check whether its size grows with input, then separate auxiliary state from returned output when the contract requires it.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "complexity_mismatch"
      ],
      "nextAction": "Practice reviewing storage contents before naming space complexity.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-space-precision-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "Order the review steps for auxiliary-space accounting.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "identify_storage",
          "check_growth",
          "separate_output",
          "name_space"
        ],
        "feedback": "Space accounting starts from what is stored and whether it grows with input, then handles returned output explicitly.",
        "id": "alg-complexity-space-precision-016-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "identify_storage",
            "text": "Identify every variable or collection that stores extra data."
          },
          {
            "id": "check_growth",
            "text": "Check whether each stored structure grows with input size or distinct values."
          },
          {
            "id": "separate_output",
            "text": "Separate auxiliary state from output storage required by the contract."
          },
          {
            "id": "name_space",
            "text": "Name the final extra-space complexity."
          }
        ],
        "prompt": "Tap the space-review steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order auxiliary-space review",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A function receives an input array of n values and scans it using two counters. It does not allocate another collection. What auxiliary space should you name?",
      "mentalModelCorrection": "Auxiliary space counts extra working storage, not the input already supplied to the function.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_input": "Auxiliary space excludes the already-provided input.",
        "wrong_future": "Space should describe the stated algorithm, not a possible different one."
      }
    },
    "id": "alg-complexity-space-precision-017",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_space_complexity",
    "prompt": "A function receives an input array of n values and scans it using two counters. It does not allocate another collection. What auxiliary space should you name?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Auxiliary space counts extra working storage, not the input already supplied to the function.",
        "id": "alg-complexity-space-precision-017-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "O(1), because the input array itself is not auxiliary space."
          },
          {
            "id": "wrong_input",
            "text": "O(n), because the input array has n values."
          },
          {
            "id": "wrong_future",
            "text": "O(n^2), because the function could compare values later."
          }
        ],
        "prompt": "Choose the correct complexity reasoning.",
        "status": "active",
        "testedSkillAtomIds": [
          "derive_space_complexity"
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
        "nodeId": "derive_space_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "auxiliary_space_accounting",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Exclude input from auxiliary space",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine emits every matching item and there may be r matches. What should a precise space answer mention?",
      "mentalModelCorrection": "Name the auxiliary state separately from returned output storage.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_never": "Some analyses report output storage separately, and the answer should state the convention.",
        "wrong_square": "Output size depends on the number of matches, here r."
      }
    },
    "id": "alg-complexity-space-precision-018",
    "learningStage": "foundations",
    "primarySkillAtomId": "account_for_output_space",
    "prompt": "A routine emits every matching item and there may be r matches. What should a precise space answer mention?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Name the auxiliary state separately from returned output storage.",
        "id": "alg-complexity-space-precision-018-check",
        "mistakeTypes": [
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Auxiliary state may be small, but the returned output can be O(r)."
          },
          {
            "id": "wrong_never",
            "text": "Returned output never matters in complexity discussion."
          },
          {
            "id": "wrong_square",
            "text": "The output must be O(n^2) whenever matches are returned."
          }
        ],
        "prompt": "Choose the correct complexity reasoning.",
        "status": "active",
        "testedSkillAtomIds": [
          "account_for_output_space"
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
        "nodeId": "account_for_output_space",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "output_space_contract",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Report output size separately",
    "trackId": "algorithms",
    "type": "single_choice"
  }
];
