export const sortedAdjacencyRunsAndOrderQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Correctness depends on which values are adjacent after ordering by value.",
      "mentalModelCorrection": "Sorting is justified by the structure produced by order, not merely because the values are sortable.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "State which adjacency, run, or rank relationship becomes visible after sorting.",
      "result": "diagnostic",
      "distractorExplanations": {
        "exact_key_lookup": "This alternative misses a stated part of the contract: The algorithm knows an exact key and needs only to determine whether that key has appeared.",
        "seen_before": "This alternative misses a stated part of the contract: The algorithm must answer whether the current value was encountered earlier in the original scan.",
        "single_frequency": "This alternative misses a stated part of the contract: The algorithm needs only the count associated with one known value."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Which requirement is the strongest signal that sorting may provide useful structure rather than merely an alternative implementation?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "neighbor_relationships",
        "feedback": "Sorting creates global order. That order makes equal values adjacent and exposes relationships between neighboring values or ranks. Hash-based state supports keyed access but does not directly create those relationships.",
        "id": "alg-contrast-hash-map-vs-sorting-order-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "neighbor_relationships",
            "text": "The algorithm must reason about equal values, neighboring ranks, or gaps between consecutive values in global value order."
          },
          {
            "id": "exact_key_lookup",
            "text": "The algorithm knows an exact key and needs only to determine whether that key has appeared."
          },
          {
            "id": "seen_before",
            "text": "The algorithm must answer whether the current value was encountered earlier in the original scan."
          },
          {
            "id": "single_frequency",
            "text": "The algorithm needs only the count associated with one known value."
          }
        ],
        "prompt": "Which requirement is the strongest signal that sorting may provide useful structure rather than merely an alternative implementation?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 001",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The implementation uses local adjacency as evidence about the entire collection.",
      "mentalModelCorrection": "Continue when current === previous + 1, close at a larger gap, and emit a singleton as [value, value].",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "loop_needs_map": "This alternative misses a stated part of the contract: Any loop that checks duplicates must also contain a Map.",
        "strict_equality_invalid": "This alternative misses a stated part of the contract: Strict equality cannot be used for duplicate detection.",
        "full_scan_required": "This alternative misses a stated part of the contract: A duplicate check may never return before reaching the final element."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-002",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "values = [8, 2, 3, 7, 1, 11] sort to [1, 2, 3, 7, 8, 11]. Which maximal consecutive ranges result?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "equal_values_may_be_separated",
        "feedback": "Continue when current === previous + 1, close at a larger gap, and emit a singleton as [value, value].",
        "id": "alg-contrast-hash-map-vs-sorting-order-002-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "equal_values_may_be_separated",
            "text": "[1, 3], [7, 8], [11, 11]"
          },
          {
            "id": "loop_needs_map",
            "text": "Any loop that checks duplicates must also contain a Map."
          },
          {
            "id": "strict_equality_invalid",
            "text": "Strict equality cannot be used for duplicate detection."
          },
          {
            "id": "full_scan_required",
            "text": "A duplicate check may never return before reaching the final element."
          }
        ],
        "prompt": "values = [8, 2, 3, 7, 1, 11] sort to [1, 2, 3, 7, 8, 11]. Which maximal consecutive ranges result?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 002",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The scan groups consecutive equal values until the value changes.",
      "mentalModelCorrection": "A run is not limited to pairs and does not exclude values occurring once.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "End a run only when the next value differs or the array ends.",
      "result": "diagnostic",
      "distractorExplanations": {
        "duplicate_runs_only": "This alternative misses a stated part of the contract: [1, 1], [3, 3, 3], [8, 8]",
        "fixed_pairs": "This alternative misses a stated part of the contract: [1, 1], [3, 3], [3, 6], [8, 8]",
        "distinct_values": "This alternative misses a stated part of the contract: [1], [3], [6], [8]"
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-003",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "After sorting, the values are:\n\n[1, 1, 3, 3, 3, 6, 8, 8]\n\nWhich maximal equal-value runs does a correct scan identify?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "correct_runs",
        "feedback": "A maximal run contains every consecutive occurrence of one value. Singleton values also form runs of length one.",
        "id": "alg-contrast-hash-map-vs-sorting-order-003-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "correct_runs",
            "text": "[1, 1], [3, 3, 3], [6], [8, 8]"
          },
          {
            "id": "duplicate_runs_only",
            "text": "[1, 1], [3, 3, 3], [8, 8]"
          },
          {
            "id": "fixed_pairs",
            "text": "[1, 1], [3, 3], [3, 6], [8, 8]"
          },
          {
            "id": "distinct_values",
            "text": "[1], [3], [6], [8]"
          }
        ],
        "prompt": "After sorting, the values are:\n\n[1, 1, 3, 3, 3, 6, 8, 8]\n\nWhich maximal equal-value runs does a correct scan identify?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 003",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The output requires both uniqueness and ascending order.",
      "mentalModelCorrection": "Deduplication and ordering are separate properties. A membership structure alone does not necessarily provide the required value order.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the sorted runs to decide where each distinct output value begins.",
      "result": "diagnostic",
      "distractorExplanations": {
        "plain_seen_set_iteration": "This alternative misses a stated part of the contract: Insert values into a Set and assume its iteration order is ascending.",
        "frequency_map_only": "This alternative misses a stated part of the contract: Build counts and return Map keys without any ordering step.",
        "first_occurrence_output": "This alternative misses a stated part of the contract: Emit each value on its first original encounter and preserve that encounter order."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-004",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The required output is every distinct value exactly once in ascending order. Which strategy most directly creates the needed output structure?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sort_then_skip_equal_neighbors",
        "feedback": "Sorting simultaneously creates ascending value order and groups duplicates. A run scan can then emit one representative per distinct value.",
        "id": "alg-contrast-hash-map-vs-sorting-order-004-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sort_then_skip_equal_neighbors",
            "text": "Sort the values, then emit the first value of each maximal equal-value run."
          },
          {
            "id": "plain_seen_set_iteration",
            "text": "Insert values into a Set and assume its iteration order is ascending."
          },
          {
            "id": "frequency_map_only",
            "text": "Build counts and return Map keys without any ordering step."
          },
          {
            "id": "first_occurrence_output",
            "text": "Emit each value on its first original encounter and preserve that encounter order."
          }
        ],
        "prompt": "The required output is every distinct value exactly once in ascending order. Which strategy most directly creates the needed output structure?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 004",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The contract distinguishes the set of output values from the order in which they must be returned.",
      "mentalModelCorrection": "Presence-based uniqueness does not imply rank-ordered output.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Separate the questions “which values?” and “in what order?”",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_always_sorted": "This alternative misses a stated part of the contract: A Set represents uniqueness and automatically orders numeric values from smallest to largest.",
        "sorting_loses_uniqueness": "This alternative misses a stated part of the contract: Sorting prevents duplicate values from being identified.",
        "identical_semantics": "This alternative misses a stated part of the contract: Both always preserve the same encounter order and output ordering."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-005",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "How does a Set differ from sorting followed by deduplication when the output contract requires distinct values?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "set_unique_sort_ordered_unique",
        "feedback": "A Set is sufficient when only uniqueness matters. When the result itself must be sorted, an explicit ordering step remains necessary.",
        "id": "alg-contrast-hash-map-vs-sorting-order-005-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "set_unique_sort_ordered_unique",
            "text": "A Set directly represents uniqueness, while sorting plus deduplication also directly establishes ascending value order."
          },
          {
            "id": "set_always_sorted",
            "text": "A Set represents uniqueness and automatically orders numeric values from smallest to largest."
          },
          {
            "id": "sorting_loses_uniqueness",
            "text": "Sorting prevents duplicate values from being identified."
          },
          {
            "id": "identical_semantics",
            "text": "Both always preserve the same encounter order and output ordering."
          }
        ],
        "prompt": "How does a Set differ from sorting followed by deduplication when the output contract requires distinct values?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 005",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Frequency information exists, but its traversal order does not satisfy the required value ordering.",
      "mentalModelCorrection": "Hashing and sorting may cooperate: hashing aggregates counts, while sorting orders the resulting keys.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Reuse the Map for counts and add ordering only to the distinct keys.",
      "result": "diagnostic",
      "distractorExplanations": {
        "iterate_map_directly": "This alternative misses a stated part of the contract: Iterate the Map directly because keyed lookup guarantees ascending key order.",
        "discard_counts": "This alternative misses a stated part of the contract: Convert the Map to a Set so the values become ordered.",
        "recount_original": "This alternative misses a stated part of the contract: Rescan the original input without using the Map or any ordering step."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-006",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A frequency Map has already been built, but the result must list value-frequency records in ascending value order. What additional step is required?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sort_distinct_keys",
        "feedback": "The Map already supplies counts by key. Sorting the distinct keys adds the rank order required by the output contract.",
        "id": "alg-contrast-hash-map-vs-sorting-order-006-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sort_distinct_keys",
            "text": "Collect the distinct keys and sort them before producing the records."
          },
          {
            "id": "iterate_map_directly",
            "text": "Iterate the Map directly because keyed lookup guarantees ascending key order."
          },
          {
            "id": "discard_counts",
            "text": "Convert the Map to a Set so the values become ordered."
          },
          {
            "id": "recount_original",
            "text": "Rescan the original input without using the Map or any ordering step."
          }
        ],
        "prompt": "A frequency Map has already been built, but the result must list value-frequency records in ascending value order. What additional step is required?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 006",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The calculation depends on predecessor-successor relationships by value.",
      "mentalModelCorrection": "Neighboring values in rank order are not necessarily neighbors in the input or in a hash structure.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Construct the ordered distinct sequence before comparing consecutive ranks.",
      "result": "diagnostic",
      "distractorExplanations": {
        "seen_set_only": "This alternative misses a stated part of the contract: A Set queried only for exact membership.",
        "frequency_map_only": "This alternative misses a stated part of the contract: A frequency Map traversed without establishing value order.",
        "original_neighbors": "This alternative misses a stated part of the contract: The adjacent positions in the original unsorted input."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-007",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The task requires examining the gap between every pair of consecutive distinct values in ascending rank order. Which structure is directly useful?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sorted_distinct_values",
        "feedback": "Consecutive ranks are defined only after values are placed in global order. Exact-key hash access does not directly reveal which distinct value comes next.",
        "id": "alg-contrast-hash-map-vs-sorting-order-007-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sorted_distinct_values",
            "text": "A sorted sequence of the distinct values."
          },
          {
            "id": "seen_set_only",
            "text": "A Set queried only for exact membership."
          },
          {
            "id": "frequency_map_only",
            "text": "A frequency Map traversed without establishing value order."
          },
          {
            "id": "original_neighbors",
            "text": "The adjacent positions in the original unsorted input."
          }
        ],
        "prompt": "The task requires examining the gap between every pair of consecutive distinct values in ascending rank order. Which structure is directly useful?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 007",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Each calculation compares one ranked value with its immediate successor.",
      "mentalModelCorrection": "A gap is the difference between neighboring values in sorted distinct order, not the value itself or a cumulative difference.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Compare indexes i - 1 and i in the ordered distinct representation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "seven_five_eight": "This alternative misses a stated part of the contract: 7, 5, and 8",
        "three_seven_eight": "This alternative misses a stated part of the contract: 3, 7, and 8",
        "two_five_nine_ten": "This alternative misses a stated part of the contract: 2, 5, 9, and 10"
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-008",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The values are sorted and deduplicated into:\n\n[2, 5, 9, 10]\n\nWhat gaps are examined between consecutive distinct values?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "three_four_one",
        "feedback": "The consecutive gaps are 5 - 2 = 3, 9 - 5 = 4, and 10 - 9 = 1.",
        "id": "alg-contrast-hash-map-vs-sorting-order-008-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "three_four_one",
            "text": "3, 4, and 1"
          },
          {
            "id": "seven_five_eight",
            "text": "7, 5, and 8"
          },
          {
            "id": "three_seven_eight",
            "text": "3, 7, and 8"
          },
          {
            "id": "two_five_nine_ten",
            "text": "2, 5, 9, and 10"
          }
        ],
        "prompt": "The values are sorted and deduplicated into:\n\n[2, 5, 9, 10]\n\nWhat gaps are examined between consecutive distinct values?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 008",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The solution requires both exact per-value metadata and ordered traversal.",
      "mentalModelCorrection": "Keyed access and rank order are complementary capabilities rather than mutually exclusive choices.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Separate aggregation from the order in which aggregated records must be consumed.",
      "result": "diagnostic",
      "distractorExplanations": {
        "frequency_map_iteration_only": "This alternative misses a stated part of the contract: Build a frequency Map and assume its iteration order equals numeric rank order.",
        "seen_set_only": "This alternative misses a stated part of the contract: Use only a Set because exact counts can be recovered from membership.",
        "original_scan": "This alternative misses a stated part of the contract: Scan the original input and treat encounter order as ascending value order."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-009",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The result must process values from smallest to largest and, for each value, use its exact frequency. Which design is most appropriate?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "frequency_map_plus_sorted_keys",
        "feedback": "The Map supplies keyed frequency information, while sorting the distinct keys supplies the required rank order. The strategies serve different parts of the contract.",
        "id": "alg-contrast-hash-map-vs-sorting-order-009-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "frequency_map_plus_sorted_keys",
            "text": "Build a frequency Map, sort its distinct keys, and retrieve each key's count during the ordered traversal."
          },
          {
            "id": "frequency_map_iteration_only",
            "text": "Build a frequency Map and assume its iteration order equals numeric rank order."
          },
          {
            "id": "seen_set_only",
            "text": "Use only a Set because exact counts can be recovered from membership."
          },
          {
            "id": "original_scan",
            "text": "Scan the original input and treat encounter order as ascending value order."
          }
        ],
        "prompt": "The result must process values from smallest to largest and, for each value, use its exact frequency. Which design is most appropriate?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 009",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "All occurrences of one value are contiguous and processed before the scan moves to another value.",
      "mentalModelCorrection": "Sorting can convert global frequency reasoning into local run-length reasoning.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Update the best result when the current run ends and after the final run.",
      "result": "diagnostic",
      "distractorExplanations": {
        "all_original_indexes": "This alternative misses a stated part of the contract: A list of every original index for every value.",
        "seen_set": "This alternative misses a stated part of the contract: Only a Set of values encountered in previous runs.",
        "complete_pair_matrix": "This alternative misses a stated part of the contract: A matrix comparing every value with every other value."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-010",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "After sorting, a scan must identify the value with the longest contiguous equal-value run. What state is sufficient during the scan?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "current_and_best_run",
        "feedback": "Sorted adjacency means the complete frequency of the current value is represented by the current run length. Only local run state and the best result must be retained.",
        "id": "alg-contrast-hash-map-vs-sorting-order-010-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "current_and_best_run",
            "text": "The current run value and length, plus the best run found so far."
          },
          {
            "id": "all_original_indexes",
            "text": "A list of every original index for every value."
          },
          {
            "id": "seen_set",
            "text": "Only a Set of values encountered in previous runs."
          },
          {
            "id": "complete_pair_matrix",
            "text": "A matrix comparing every value with every other value."
          }
        ],
        "prompt": "After sorting, a scan must identify the value with the longest contiguous equal-value run. What state is sufficient during the scan?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 010",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The implementation stores data that never influences the result.",
      "mentalModelCorrection": "Use frequency state only when multiplicity matters. Do not infer that every duplicate-related output needs exact counts.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Retain only information needed to distinguish the required output values and their order.",
      "result": "diagnostic",
      "distractorExplanations": {
        "map_cannot_store_counts": "This alternative misses a stated part of the contract: A Map cannot represent occurrence counts.",
        "sorting_cannot_deduplicate": "This alternative misses a stated part of the contract: Sorting cannot be used to identify repeated values.",
        "counts_destroy_order": "This alternative misses a stated part of the contract: Storing a count permanently prevents the values from being sorted later."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-011",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The only required output is the distinct values in ascending order. A solution builds a full frequency Map even though the counts are never used. What is the main issue?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "unneeded_count_state",
        "feedback": "The Map solution may still be correct if its keys are later sorted, but exact counts are unnecessary when the contract needs only ordered uniqueness.",
        "id": "alg-contrast-hash-map-vs-sorting-order-011-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "unneeded_count_state",
            "text": "It stores multiplicity information that the output does not require; sorting and skipping equal runs can produce the ordered distinct result directly."
          },
          {
            "id": "map_cannot_store_counts",
            "text": "A Map cannot represent occurrence counts."
          },
          {
            "id": "sorting_cannot_deduplicate",
            "text": "Sorting cannot be used to identify repeated values."
          },
          {
            "id": "counts_destroy_order",
            "text": "Storing a count permanently prevents the values from being sorted later."
          }
        ],
        "prompt": "The only required output is the distinct values in ascending order. A solution builds a full frequency Map even though the counts are never used. What is the main issue?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 011",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The representation satisfies uniqueness but not the required rank order.",
      "mentalModelCorrection": "The precondition already supplies the adjacency structure needed for a run scan.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_keeps_duplicates": "This alternative misses a stated part of the contract: The Set retains both occurrences of 2.",
        "spread_changes_numbers": "This alternative misses a stated part of the contract: Spreading a Set changes numeric keys into strings.",
        "set_iteration_random": "This alternative misses a stated part of the contract: Set iteration necessarily produces a different random order on every call."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-012",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Input is guaranteed sorted ascending and you need distinct values or maximal equal-value runs. What should you do?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "iteration_not_ascending",
        "feedback": "The precondition already supplies the adjacency structure needed for a run scan.",
        "id": "alg-contrast-hash-map-vs-sorting-order-012-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "iteration_not_ascending",
            "text": "Scan the existing sorted input directly; do not rebuild a Set or sort again."
          },
          {
            "id": "set_keeps_duplicates",
            "text": "The Set retains both occurrences of 2."
          },
          {
            "id": "spread_changes_numbers",
            "text": "Spreading a Set changes numeric keys into strings."
          },
          {
            "id": "set_iteration_random",
            "text": "Set iteration necessarily produces a different random order on every call."
          }
        ],
        "prompt": "Input is guaranteed sorted ascending and you need distinct values or maximal equal-value runs. What should you do?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 012",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The desired value is known directly, and no result depends on relative value order.",
      "mentalModelCorrection": "Hash map versus sorting does not require either transformation. With one membership query and no reuse, a linear scan is simplest and needs no extra state.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_for_adjacency": "This alternative misses a stated part of the contract: Sort the values so x becomes adjacent to values equal to x.",
        "frequency_runs": "This alternative misses a stated part of the contract: Sort and count every maximal equal-value run before checking x.",
        "rank_traversal": "This alternative misses a stated part of the contract: Traverse every value in ascending rank order until all values have been processed."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-013",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "There is one exact membership query for a known value in an unsorted array, no existing index, no later reuse, and no order requirement. Which choice is justified?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "keyed_membership",
        "feedback": "Hash map versus sorting does not require either transformation. With one membership query and no reuse, a linear scan is simplest and needs no extra state.",
        "id": "alg-contrast-hash-map-vs-sorting-order-013-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "keyed_membership",
            "text": "Perform a direct linear scan; Set construction and sorting are unjustified preprocessing for one query."
          },
          {
            "id": "sort_for_adjacency",
            "text": "Sort the values so x becomes adjacent to values equal to x."
          },
          {
            "id": "frequency_runs",
            "text": "Sort and count every maximal equal-value run before checking x."
          },
          {
            "id": "rank_traversal",
            "text": "Traverse every value in ascending rank order until all values have been processed."
          }
        ],
        "prompt": "There is one exact membership query for a known value in an unsorted array, no existing index, no later reuse, and no order requirement. Which choice is justified?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 013",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The contract needs both multiplicity and sorted records, while the number of distinct values may be smaller than the input length.",
      "mentalModelCorrection": "This can help when d is small and state already exists, but it is not universally faster; key construction and d matter.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "map_iteration_only": "This alternative misses a stated part of the contract: Count with a Map and return its entries directly as ascending output.",
        "set_only": "This alternative misses a stated part of the contract: Use a Set because it retains exact counts for each distinct value.",
        "raw_adjacency": "This alternative misses a stated part of the contract: Compare adjacent original values and emit a record whenever they differ."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-014",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "n is total occurrences and d is distinct values. A frequency Map already exists and count records must be ascending. Which analysis is accurate?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "count_then_sort_keys",
        "feedback": "This can help when d is small and state already exists, but it is not universally faster; key construction and d matter.",
        "id": "alg-contrast-hash-map-vs-sorting-order-014-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "count_then_sort_keys",
            "text": "Sort only d keys: expected O(n) aggregation plus O(d log d) key sorting plus O(d) traversal; sorting all n occurrences is O(n log n)."
          },
          {
            "id": "map_iteration_only",
            "text": "Count with a Map and return its entries directly as ascending output."
          },
          {
            "id": "set_only",
            "text": "Use a Set because it retains exact counts for each distinct value."
          },
          {
            "id": "raw_adjacency",
            "text": "Compare adjacent original values and emit a record whenever they differ."
          }
        ],
        "prompt": "n is total occurrences and d is distinct values. A frequency Map already exists and count records must be ascending. Which analysis is accurate?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 014",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The problem distinguishes physical input neighbors from predecessor-successor relationships by value.",
      "mentalModelCorrection": "Sorting changes which pairs are neighbors and thereby exposes global rank relationships.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Specify whether neighboring means adjacent positions in the input or consecutive values after sorting.",
      "result": "diagnostic",
      "distractorExplanations": {
        "ten_two": "This alternative misses a stated part of the contract: 10 and 2",
        "two_eight": "This alternative misses a stated part of the contract: 2 and 8",
        "eight_three": "This alternative misses a stated part of the contract: 8 and 3"
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-015",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The original input is:\n\n[10, 2, 8, 3]\n\nAfter sorting:\n\n[2, 3, 8, 10]\n\nWhich pair is adjacent in rank order but not adjacent in the original input?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "two_three",
        "feedback": "Values 2 and 3 are consecutive after ordering by value, but they occur at indexes 1 and 3 in the original input.",
        "id": "alg-contrast-hash-map-vs-sorting-order-015-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "two_three",
            "text": "2 and 3"
          },
          {
            "id": "ten_two",
            "text": "10 and 2"
          },
          {
            "id": "two_eight",
            "text": "2 and 8"
          },
          {
            "id": "eight_three",
            "text": "8 and 3"
          }
        ],
        "prompt": "The original input is:\n\n[10, 2, 8, 3]\n\nAfter sorting:\n\n[2, 3, 8, 10]\n\nWhich pair is adjacent in rank order but not adjacent in the original input?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 015",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The choice depends on whether later reasoning consumes order or direct key access.",
      "mentalModelCorrection": "Do not select either strategy from surface keywords. Name the structure required by the complete contract.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Complete one sentence before implementing: “The representation must make ___ directly available.”",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_for_all_duplicates": "This alternative misses a stated part of the contract: Use hashing whenever repeated values are mentioned, even when the output must be sorted.",
        "sort_everything": "This alternative misses a stated part of the contract: Use sorting whenever values support comparison, even when no later step uses their order.",
        "same_capabilities": "This alternative misses a stated part of the contract: Treat hashing and sorting as equivalent because both automatically provide keyed lookup and ascending traversal."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-order-016",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Which decision rule best captures the contrast between hash-based state and sorting when global order may matter?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "structure_driven_choice",
        "feedback": "Sorting is valuable when its global order enables the next step. Hashing is valuable when the algorithm knows the key it needs and does not require rank relationships or sorted traversal.",
        "id": "alg-contrast-hash-map-vs-sorting-order-016-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "structure_driven_choice",
            "text": "Use sorting when correctness depends on equal-value adjacency, maximal runs, neighboring ranks, gaps, or sorted output; use hash-based state when direct keyed access fully satisfies an order-independent contract."
          },
          {
            "id": "hash_for_all_duplicates",
            "text": "Use hashing whenever repeated values are mentioned, even when the output must be sorted."
          },
          {
            "id": "sort_everything",
            "text": "Use sorting whenever values support comparison, even when no later step uses their order."
          },
          {
            "id": "same_capabilities",
            "text": "Treat hashing and sorting as equivalent because both automatically provide keyed lookup and ascending traversal."
          }
        ],
        "prompt": "Which decision rule best captures the contrast between hash-based state and sorting when global order may matter?",
        "status": "active",
        "testedSkillAtomIds": [
          "recognize_sorting_tradeoff"
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: order 016",
    "trackId": "algorithms",
    "type": "single_choice"
  }
];
