export const membershipDuplicatesAndFrequencyQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The competing strategies retain different information about the input.",
      "mentalModelCorrection": "Choose state from the output and correctness contract, not from familiar syntax or a preferred data structure.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Classify each task as presence-only, count-sensitive, or encounter-order-sensitive before selecting a strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "variable_names": "This alternative misses a stated part of the contract: Does the implementation use variable names such as seen, count, or sorted?",
        "numeric_values": "This alternative misses a stated part of the contract: Are the input values numerically large or small?",
        "preferred_structure": "This alternative misses a stated part of the contract: Which data structure is most familiar to the developer?"
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which question should be answered first when choosing between a Set, a frequency Map, and sorting equal values next to each other?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "required_information",
        "feedback": "The required information determines the representation. A Set records presence, a frequency Map records multiplicity, and sorting exposes equal-value runs but changes encounter order.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "required_information",
            "text": "Does the task require only presence, exact occurrence counts, or information tied to original encounter order?"
          },
          {
            "id": "variable_names",
            "text": "Does the implementation use variable names such as seen, count, or sorted?"
          },
          {
            "id": "numeric_values",
            "text": "Are the input values numerically large or small?"
          },
          {
            "id": "preferred_structure",
            "text": "Which data structure is most familiar to the developer?"
          }
        ],
        "prompt": "Which question should be answered first when choosing between a Set, a frequency Map, and sorting equal values next to each other?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "foundations",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 001",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The result is boolean and can be decided on the second occurrence of any value.",
      "mentalModelCorrection": "Use the smallest state that preserves the information needed for correctness.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Store membership rather than counts when every positive count is treated identically.",
      "result": "diagnostic",
      "distractorExplanations": {
        "frequency_map": "This alternative misses a stated part of the contract: A Map containing the final exact frequency of every value.",
        "index_lists": "This alternative misses a stated part of the contract: A Map from each value to an array of all indexes where it appears.",
        "running_sum": "This alternative misses a stated part of the contract: A single running sum of all processed values."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "An unsorted array must be checked for whether any value appears more than once. The function may return immediately after finding a duplicate. Which hash-based state is sufficient?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "seen_set",
        "feedback": "Duplicate existence requires only knowing whether the current value has appeared before. Exact counts and complete index lists store information the contract does not require.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-002-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "seen_set",
            "text": "A Set of previously seen values."
          },
          {
            "id": "frequency_map",
            "text": "A Map containing the final exact frequency of every value."
          },
          {
            "id": "index_lists",
            "text": "A Map from each value to an array of all indexes where it appears."
          },
          {
            "id": "running_sum",
            "text": "A single running sum of all processed values."
          }
        ],
        "prompt": "An unsorted array must be checked for whether any value appears more than once. The function may return immediately after finding a duplicate. Which hash-based state is sufficient?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "foundations",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 002",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The contract is defined by when a repeated occurrence is encountered during the scan.",
      "mentalModelCorrection": "The first repeated value is determined by the position of the repeated occurrence, not by value size or first-occurrence position.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Mark the exact scan position where each value becomes repeated.",
      "result": "diagnostic",
      "distractorExplanations": {
        "five": "This alternative misses a stated part of the contract: 5",
        "four": "This alternative misses a stated part of the contract: 4",
        "null": "This alternative misses a stated part of the contract: No value is returned."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-003",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A scan returns the first value whose current occurrence has been seen before:\n\nconst seen = new Set<number>();\n\nfor (const value of nums) {\n  if (seen.has(value)) {\n    return value;\n  }\n\n  seen.add(value);\n}\n\nFor nums = [5, 2, 4, 2, 5], what is returned?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "two",
        "feedback": "The second occurrence of 2 is encountered before the second occurrence of 5. The algorithm follows original scan order rather than selecting the smallest or earliest first occurrence.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-003-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "two",
            "text": "2"
          },
          {
            "id": "five",
            "text": "5"
          },
          {
            "id": "four",
            "text": "4"
          },
          {
            "id": "null",
            "text": "No value is returned."
          }
        ],
        "prompt": "A scan returns the first value whose current occurrence has been seen before:\n\nconst seen = new Set<number>();\n\nfor (const value of nums) {\n  if (seen.has(value)) {\n    return value;\n  }\n\n  seen.add(value);\n}\n\nFor nums = [5, 2, 4, 2, 5], what is returned?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 003",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The implementation compares only neighboring positions without first establishing an ordering invariant.",
      "mentalModelCorrection": "Adjacency is meaningful for duplicate detection only after equal values have been brought together.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Either sort before adjacent comparison or use seen-before hash state during the unsorted scan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "loop_starts_one": "This alternative misses a stated part of the contract: Every duplicate scan must start at index 0.",
        "strict_equality": "This alternative misses a stated part of the contract: Strict equality cannot compare numeric values.",
        "return_too_early": "This alternative misses a stated part of the contract: Duplicate detection is incorrect whenever it returns before scanning the full array."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-004",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A developer checks only adjacent values:\n\nfor (let i = 1; i < nums.length; i++) {\n  if (nums[i] === nums[i - 1]) {\n    return true;\n  }\n}\n\nreturn false;\n\nWhy is this incorrect for a general unsorted array?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "duplicates_not_adjacent",
        "feedback": "Adjacent comparison works only when an ordering or grouping invariant guarantees that equal values are contiguous. An unsorted array provides no such guarantee.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-004-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "duplicates_not_adjacent",
            "text": "Equal values may exist at non-adjacent positions unless the array has first been sorted or otherwise grouped."
          },
          {
            "id": "loop_starts_one",
            "text": "Every duplicate scan must start at index 0."
          },
          {
            "id": "strict_equality",
            "text": "Strict equality cannot compare numeric values."
          },
          {
            "id": "return_too_early",
            "text": "Duplicate detection is incorrect whenever it returns before scanning the full array."
          }
        ],
        "prompt": "A developer checks only adjacent values:\n\nfor (let i = 1; i < nums.length; i++) {\n  if (nums[i] === nums[i - 1]) {\n    return true;\n  }\n}\n\nreturn false;\n\nWhy is this incorrect for a general unsorted array?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 004",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The input has an established total order by value.",
      "mentalModelCorrection": "Sorting does not calculate frequencies directly; it creates contiguous runs from which multiplicity can be observed.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "State the equal-values-form-a-run invariant before relying on adjacent comparisons.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_removes_unique_values": "This alternative misses a stated part of the contract: Sorting removes every value that appears only once.",
        "sorting_adds_counts": "This alternative misses a stated part of the contract: Sorting stores the exact frequency inside each array element.",
        "adjacent_means_original": "This alternative misses a stated part of the contract: Adjacent positions in sorted order are also adjacent in the original input."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-005",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "After an array has been sorted by value, why is comparing adjacent elements sufficient to detect duplicate existence?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "equal_values_contiguous",
        "feedback": "Sorting groups equal values together. Therefore any value with multiplicity of at least two creates at least one equal adjacent pair.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-005-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "equal_values_contiguous",
            "text": "All occurrences of an equal value form one contiguous run in sorted order."
          },
          {
            "id": "sorting_removes_unique_values",
            "text": "Sorting removes every value that appears only once."
          },
          {
            "id": "sorting_adds_counts",
            "text": "Sorting stores the exact frequency inside each array element."
          },
          {
            "id": "adjacent_means_original",
            "text": "Adjacent positions in sorted order are also adjacent in the original input."
          }
        ],
        "prompt": "After an array has been sorted by value, why is comparing adjacent elements sufficient to detect duplicate existence?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 005",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The output distinguishes one occurrence from two, three, or more occurrences.",
      "mentalModelCorrection": "Presence and frequency are different contracts. A Set cannot reconstruct information it never stored.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use count-valued state whenever different positive frequencies lead to different outputs.",
      "result": "diagnostic",
      "distractorExplanations": {
        "seen_set": "This alternative misses a stated part of the contract: A Set containing every value seen at least once.",
        "duplicate_boolean": "This alternative misses a stated part of the contract: One boolean indicating whether any duplicate has appeared.",
        "last_value": "This alternative misses a stated part of the contract: A variable containing only the most recently processed value."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The result must report exactly how many times each distinct value occurs. Which state directly satisfies that contract during an unsorted scan?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "frequency_map",
        "feedback": "Exact counts require multiplicity information. A Set collapses every positive occurrence count into the same present state.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-006-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "frequency_map",
            "text": "A Map from value to occurrence count."
          },
          {
            "id": "seen_set",
            "text": "A Set containing every value seen at least once."
          },
          {
            "id": "duplicate_boolean",
            "text": "One boolean indicating whether any duplicate has appeared."
          },
          {
            "id": "last_value",
            "text": "A variable containing only the most recently processed value."
          }
        ],
        "prompt": "The result must report exactly how many times each distinct value occurs. Which state directly satisfies that contract during an unsorted scan?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "foundations",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 006",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The answer is decidable at the first repeated occurrence, but the implementation insists on completing global counting first.",
      "mentalModelCorrection": "Exact counts are not automatically better state. Extra information may add work and obscure the actual contract.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Prefer one-pass seen-before state when only the second encounter matters.",
      "result": "diagnostic",
      "distractorExplanations": {
        "map_cannot_count": "This alternative misses a stated part of the contract: A Map cannot represent exact frequencies.",
        "two_passes_incorrect": "This alternative misses a stated part of the contract: Any algorithm containing two sequential passes is incorrect.",
        "set_preserves_counts": "This alternative misses a stated part of the contract: A Set would provide the same exact counts with less memory."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-007",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A function needs only to return the first value encountered for a second time. The implementation first builds exact frequencies for the entire array and then performs another scan. What is the main design issue?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "stores_more_than_needed",
        "feedback": "The frequency-map approach can be made correct, but it computes more information than required and cannot return until after preprocessing. Seen-before state is sufficient for the encounter-order contract.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-007-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "stores_more_than_needed",
            "text": "It stores complete count information and delays the answer even though a seen Set can return on the first repeated occurrence."
          },
          {
            "id": "map_cannot_count",
            "text": "A Map cannot represent exact frequencies."
          },
          {
            "id": "two_passes_incorrect",
            "text": "Any algorithm containing two sequential passes is incorrect."
          },
          {
            "id": "set_preserves_counts",
            "text": "A Set would provide the same exact counts with less memory."
          }
        ],
        "prompt": "A function needs only to return the first value encountered for a second time. The implementation first builds exact frequencies for the entire array and then performs another scan. What is the main design issue?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 007",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The decision changes when the same present value reaches a higher occurrence count.",
      "mentalModelCorrection": "Membership can answer count greater than zero, not arbitrary multiplicity thresholds.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Store and update a count when the stopping condition depends on the number of occurrences.",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_cannot_store_numbers": "This alternative misses a stated part of the contract: A Set cannot store numeric values.",
        "set_requires_sorting": "This alternative misses a stated part of the contract: A Set can be queried only after the input is sorted.",
        "set_uses_too_many_indexes": "This alternative misses a stated part of the contract: A Set stores every original index rather than each distinct value."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-008",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The task asks whether any value occurs at least three times. Why is a simple final Set of unique values insufficient?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "set_loses_multiplicity",
        "feedback": "All positive occurrence counts collapse to one membership state in a Set. Detecting a threshold above one requires counts or another state that distinguishes repeated occurrences.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-008-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "set_loses_multiplicity",
            "text": "The Set records only whether each value appears, not whether it appears once, twice, or at least three times."
          },
          {
            "id": "set_cannot_store_numbers",
            "text": "A Set cannot store numeric values."
          },
          {
            "id": "set_requires_sorting",
            "text": "A Set can be queried only after the input is sorted."
          },
          {
            "id": "set_uses_too_many_indexes",
            "text": "A Set stores every original index rather than each distinct value."
          }
        ],
        "prompt": "The task asks whether any value occurs at least three times. Why is a simple final Set of unique values insufficient?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 008",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The state changes on every occurrence, including occurrences after the first.",
      "mentalModelCorrection": "A frequency Map preserves repeated updates for the same key rather than treating later occurrences as irrelevant.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Trace the previous count and the incremented count separately for each processed value.",
      "result": "diagnostic",
      "distractorExplanations": {
        "one_one_one": "This alternative misses a stated part of the contract: 4 -> 1, 1 -> 1, 7 -> 1",
        "three_three_three": "This alternative misses a stated part of the contract: 4 -> 3, 1 -> 3, 7 -> 3",
        "two_one_zero": "This alternative misses a stated part of the contract: 4 -> 2, 1 -> 1, 7 -> 0"
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-009",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A frequency Map is built for:\n\nnums = [4, 1, 4, 4, 1, 7]\n\nWhat are the final counts for 4, 1, and 7?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "three_two_one",
        "feedback": "Each occurrence increments only its own value's count. The final Map represents exact multiplicity rather than mere membership.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-009-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "three_two_one",
            "text": "4 -> 3, 1 -> 2, 7 -> 1"
          },
          {
            "id": "one_one_one",
            "text": "4 -> 1, 1 -> 1, 7 -> 1"
          },
          {
            "id": "three_three_three",
            "text": "4 -> 3, 1 -> 3, 7 -> 3"
          },
          {
            "id": "two_one_zero",
            "text": "4 -> 2, 1 -> 1, 7 -> 0"
          }
        ],
        "prompt": "A frequency Map is built for:\n\nnums = [4, 1, 4, 4, 1, 7]\n\nWhat are the final counts for 4, 1, and 7?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 009",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Every positive occurrence count contributes exactly one to the result.",
      "mentalModelCorrection": "Do not store counts when all nonzero counts are equivalent under the output contract.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use Set size when the result is the cardinality of the observed value set.",
      "result": "diagnostic",
      "distractorExplanations": {
        "frequency_map_required": "This alternative misses a stated part of the contract: Build exact frequencies because a distinct-value count always requires occurrence counts.",
        "index_map": "This alternative misses a stated part of the contract: Store every value with all of its original indexes.",
        "duplicate_flag": "This alternative misses a stated part of the contract: Track only whether any duplicate has occurred."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The task asks only for the number of distinct values in an unsorted array. Which hash-based representation is sufficient?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "unique_set",
        "feedback": "Distinct-value counting depends only on which values are present. Multiplicity beyond the first occurrence does not affect the answer.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-010-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "unique_set",
            "text": "Insert every value into a Set and return the Set size."
          },
          {
            "id": "frequency_map_required",
            "text": "Build exact frequencies because a distinct-value count always requires occurrence counts."
          },
          {
            "id": "index_map",
            "text": "Store every value with all of its original indexes."
          },
          {
            "id": "duplicate_flag",
            "text": "Track only whether any duplicate has occurred."
          }
        ],
        "prompt": "The task asks only for the number of distinct values in an unsorted array. Which hash-based representation is sufficient?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "foundations",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 010",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The result depends on positions in the original encounter sequence.",
      "mentalModelCorrection": "Sorting preserves value multiplicity but not the temporal semantics of when a repeat is encountered.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use one-pass seen state when the result is defined by the first repeated encounter.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_removes_duplicates": "This alternative misses a stated part of the contract: Sorting deletes repeated values before the scan begins.",
        "equal_runs_invalid": "This alternative misses a stated part of the contract: Equal-value runs cannot be used to identify duplicated values.",
        "hashing_required_for_numbers": "This alternative misses a stated part of the contract: Numeric duplicate tasks can be solved only with hashing."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-011",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The input is:\n\nnums = [8, 3, 5, 3, 8]\n\nThe contract is to return the first value encountered for a second time.\n\nWhy is sorting the values before scanning equal runs a poor fit for this contract?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sorting_loses_encounter_order",
        "feedback": "The required answer is 3 because its second occurrence appears first. Sorted order can reveal which values are duplicated, but not which duplicate was completed first in the original scan.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-011-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sorting_loses_encounter_order",
            "text": "Sorting groups duplicates by value but removes the original order that determines whether 3 or 8 becomes repeated first."
          },
          {
            "id": "sorting_removes_duplicates",
            "text": "Sorting deletes repeated values before the scan begins."
          },
          {
            "id": "equal_runs_invalid",
            "text": "Equal-value runs cannot be used to identify duplicated values."
          },
          {
            "id": "hashing_required_for_numbers",
            "text": "Numeric duplicate tasks can be solved only with hashing."
          }
        ],
        "prompt": "The input is:\n\nnums = [8, 3, 5, 3, 8]\n\nThe contract is to return the first value encountered for a second time.\n\nWhy is sorting the values before scanning equal runs a poor fit for this contract?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 011",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The claim chooses a strategy from one asymptotic property while ignoring workload and contract constraints.",
      "mentalModelCorrection": "Sorting is not automatically O(1) auxiliary space: runtime, recursion stack, buffers, and copying determine workspace. Memory alone is not enough.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hashing_always_required": "This alternative misses a stated part of the contract: The claim is correct because duplicates cannot be detected after sorting.",
        "sorting_always_linear": "This alternative misses a stated part of the contract: The claim is wrong only because sorting is also always O(n).",
        "both_have_identical_behavior": "This alternative misses a stated part of the contract: The strategies are interchangeable because they preserve the same order and memory usage."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-012",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "When is sorting a reasonable duplicate-detection choice under memory constraints?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "constraints_may_favor_sorting",
        "feedback": "Sorting is not automatically O(1) auxiliary space: runtime, recursion stack, buffers, and copying determine workspace. Memory alone is not enough.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-012-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "constraints_may_favor_sorting",
            "text": "When encounter order is irrelevant, mutation is allowed or copying is acceptable, sorted data can be reused, or the chosen sort has an explicitly acceptable workspace bound."
          },
          {
            "id": "hashing_always_required",
            "text": "The claim is correct because duplicates cannot be detected after sorting."
          },
          {
            "id": "sorting_always_linear",
            "text": "The claim is wrong only because sorting is also always O(n)."
          },
          {
            "id": "both_have_identical_behavior",
            "text": "The strategies are interchangeable because they preserve the same order and memory usage."
          }
        ],
        "prompt": "When is sorting a reasonable duplicate-detection choice under memory constraints?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 012",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Sorted order guarantees that leaving a value's run means no later occurrence of that value will appear.",
      "mentalModelCorrection": "Sorting can replace keyed counting with local run-length state because equal values become adjacent.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Emit a frequency when the value changes or when the scan reaches the end of the array.",
      "result": "diagnostic",
      "distractorExplanations": {
        "global_seen_boolean": "This alternative misses a stated part of the contract: Only whether any duplicate has appeared anywhere.",
        "original_indexes": "This alternative misses a stated part of the contract: Every original index from before the array was sorted.",
        "running_sum": "This alternative misses a stated part of the contract: Only the sum of all values in the current prefix."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-013",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A sorted array must be converted into value-frequency records without using a Map. What information should a linear scan track?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "run_value_and_length",
        "feedback": "Equal values are contiguous after sorting. Counting the length of each contiguous run produces exact frequencies without keyed lookup state.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-013-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "run_value_and_length",
            "text": "The current run's value and the number of consecutive times it has appeared."
          },
          {
            "id": "global_seen_boolean",
            "text": "Only whether any duplicate has appeared anywhere."
          },
          {
            "id": "original_indexes",
            "text": "Every original index from before the array was sorted."
          },
          {
            "id": "running_sum",
            "text": "Only the sum of all values in the current prefix."
          }
        ],
        "prompt": "A sorted array must be converted into value-frequency records without using a Map. What information should a linear scan track?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 013",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Frequency is represented by the length of each maximal equal-value run.",
      "mentalModelCorrection": "Do not count transitions; count all elements belonging to the run, including its first element.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Initialize each new run with count 1 and remember to emit the final run after the loop.",
      "result": "diagnostic",
      "distractorExplanations": {
        "one_one_four_one_nine_one": "This alternative misses a stated part of the contract: 1 -> 1, 4 -> 1, 9 -> 1",
        "one_three_four_three_nine_three": "This alternative misses a stated part of the contract: 1 -> 3, 4 -> 3, 9 -> 3",
        "one_two_four_one_nine_zero": "This alternative misses a stated part of the contract: 1 -> 2, 4 -> 1, 9 -> 0"
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-014",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A sorted array is:\n\n[1, 1, 1, 4, 4, 9]\n\nWhich run-length frequencies should a correct scan produce?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "one_three_four_two_nine_one",
        "feedback": "The first run contains three 1s, the second contains two 4s, and the final run contains one 9.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-014-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "one_three_four_two_nine_one",
            "text": "1 -> 3, 4 -> 2, 9 -> 1"
          },
          {
            "id": "one_one_four_one_nine_one",
            "text": "1 -> 1, 4 -> 1, 9 -> 1"
          },
          {
            "id": "one_three_four_three_nine_three",
            "text": "1 -> 3, 4 -> 3, 9 -> 3"
          },
          {
            "id": "one_two_four_one_nine_zero",
            "text": "1 -> 2, 4 -> 1, 9 -> 0"
          }
        ],
        "prompt": "A sorted array is:\n\n[1, 1, 1, 4, 4, 9]\n\nWhich run-length frequencies should a correct scan produce?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 014",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The boolean result becomes irreversible as soon as one repeated occurrence is found.",
      "mentalModelCorrection": "A presence-only duplicate scan can stop at the first proof instead of computing complete frequencies.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Identify the earliest point where the result can no longer change.",
      "result": "diagnostic",
      "distractorExplanations": {
        "index_zero": "This alternative misses a stated part of the contract: Index 0, because 6 will appear again later.",
        "index_four": "This alternative misses a stated part of the contract: Index 4, after every duplicated value has been encountered twice.",
        "after_loop": "This alternative misses a stated part of the contract: Only after the entire array has been scanned."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-015",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A duplicate-existence scan processes:\n\nnums = [6, 2, 9, 6, 2]\n\nIt checks seen.has(value) before inserting value.\n\nAt which input position can it first return true?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "index_three",
        "feedback": "At index 3, 6 is already present in the Set from index 0. Duplicate existence is established immediately; later duplicates do not need to be processed.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-015-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "index_three",
            "text": "Index 3, when the second 6 is encountered."
          },
          {
            "id": "index_zero",
            "text": "Index 0, because 6 will appear again later."
          },
          {
            "id": "index_four",
            "text": "Index 4, after every duplicated value has been encountered twice."
          },
          {
            "id": "after_loop",
            "text": "Only after the entire array has been scanned."
          }
        ],
        "prompt": "A duplicate-existence scan processes:\n\nnums = [6, 2, 9, 6, 2]\n\nIt checks seen.has(value) before inserting value.\n\nAt which input position can it first return true?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 015",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Multiple duplicated values exist and the two strategies traverse them in different orders.",
      "mentalModelCorrection": "Finding some duplicate is different from selecting the first repeated encounter or the smallest duplicated value.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Define the duplicate selection rule before comparing returned values.",
      "result": "diagnostic",
      "distractorExplanations": {
        "both_return_nine": "This alternative misses a stated part of the contract: Both must return 9 because it appears first in the original array.",
        "both_return_four": "This alternative misses a stated part of the contract: Both must return 4 because it is numerically smaller.",
        "sorting_cannot_find_duplicates": "This alternative misses a stated part of the contract: The sorted solution cannot detect either duplicated value."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-016",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "For nums = [9, 4, 7, 9, 4]:\n\n- a one-pass seen Set returns the first value encountered again;\n- a sort-then-scan solution returns the first duplicated value in sorted order.\n\nWhich statement is correct?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "different_valid_contracts",
        "feedback": "The second 9 appears before the second 4 in original scan order. After sorting, 4 is the first value that forms an equal run. The strategies answer different questions unless the contract specifies which duplicate to return.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-016-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "different_valid_contracts",
            "text": "The Set returns 9, while sorting may return 4; each matches a different selection contract."
          },
          {
            "id": "both_return_nine",
            "text": "Both must return 9 because it appears first in the original array."
          },
          {
            "id": "both_return_four",
            "text": "Both must return 4 because it is numerically smaller."
          },
          {
            "id": "sorting_cannot_find_duplicates",
            "text": "The sorted solution cannot detect either duplicated value."
          }
        ],
        "prompt": "For nums = [9, 4, 7, 9, 4]:\n\n- a one-pass seen Set returns the first value encountered again;\n- a sort-then-scan solution returns the first duplicated value in sorted order.\n\nWhich statement is correct?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 016",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The alternatives trade expected linear time and keyed memory against sorting preprocessing and implementation-dependent workspace.",
      "mentalModelCorrection": "Duplicate existence does not always require a Set; the allowed mutation, workspace bound, and worst-case preference make sorting valid here.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "both_linear_constant_space": "This alternative misses a stated part of the contract: Both approaches always take O(n) time and O(1) auxiliary space.",
        "hash_constant_total": "This alternative misses a stated part of the contract: The Set approach takes expected O(1) total time because each lookup is expected O(1).",
        "sorting_quadratic": "This alternative misses a stated part of the contract: Sorting followed by scanning takes O(n²) because it has two phases."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-017",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Duplicate existence only; encounter order is irrelevant, mutation is allowed, sort workspace is explicitly acceptable, and deterministic comparison-sort time is preferred. Which choice is valid?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_hash_vs_sort",
        "feedback": "Duplicate existence does not always require a Set; the allowed mutation, workspace bound, and worst-case preference make sorting valid here.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-017-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_hash_vs_sort",
            "text": "Sorting plus an adjacent scan is a deliberate valid choice under all stated contract and implementation constraints."
          },
          {
            "id": "both_linear_constant_space",
            "text": "Both approaches always take O(n) time and O(1) auxiliary space."
          },
          {
            "id": "hash_constant_total",
            "text": "The Set approach takes expected O(1) total time because each lookup is expected O(1)."
          },
          {
            "id": "sorting_quadratic",
            "text": "Sorting followed by scanning takes O(n²) because it has two phases."
          }
        ],
        "prompt": "Duplicate existence only; encounter order is irrelevant, mutation is allowed, sort workspace is explicitly acceptable, and deterministic comparison-sort time is preferred. Which choice is valid?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 017",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The correct strategy depends on whether multiplicity and encounter order affect the result.",
      "mentalModelCorrection": "Duplicate-related tasks are not one category with one universal implementation. Presence, counts, and encounter order are separate contracts.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Write the minimum information the algorithm must retain before selecting the data structure or transformation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "map_for_every_duplicate": "This alternative misses a stated part of the contract: Use a Map for every task involving repeated values because it always has the best time, space, and output semantics.",
        "set_for_all_counts": "This alternative misses a stated part of the contract: Use a Set for exact frequencies because membership implicitly records the number of occurrences.",
        "sorting_preserves_encounter_order": "This alternative misses a stated part of the contract: Use sorting when the first repeated value in original encounter order is required because sorting preserves that order."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-membership-018",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which decision rule most accurately distinguishes Set state, frequency Map state, and sorting with equal-value runs?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "contract_driven_choice",
        "feedback": "The strategies retain different information. Set state answers presence and seen-before questions, frequency maps preserve counts, and sorting creates contiguous equal-value runs while discarding original encounter order.",
        "id": "alg-contrast-hash-map-vs-sorting-membership-018-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "contract_driven_choice",
            "text": "Use a Set for seen-or-present state, a frequency Map when exact multiplicity is required during unsorted processing, and sorted runs when reordered value grouping is acceptable and encounter order is irrelevant."
          },
          {
            "id": "map_for_every_duplicate",
            "text": "Use a Map for every task involving repeated values because it always has the best time, space, and output semantics."
          },
          {
            "id": "set_for_all_counts",
            "text": "Use a Set for exact frequencies because membership implicitly records the number of occurrences."
          },
          {
            "id": "sorting_preserves_encounter_order",
            "text": "Use sorting when the first repeated value in original encounter order is required because sorting preserves that order."
          }
        ],
        "prompt": "Which decision rule most accurately distinguishes Set state, frequency Map state, and sorting with equal-value runs?",
        "status": "active",
        "testedSkillAtomIds": [
          "choose_lookup_key"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "independent_attempt",
        "role": "primary"
      },
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
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: membership 018",
    "trackId": "algorithms",
    "type": "single_choice"
  }
];
