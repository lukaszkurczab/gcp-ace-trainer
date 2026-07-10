export const recognizeHashMapVsSortingStrategySignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The alternatives produce different forms of usable structure rather than merely different runtimes.",
      "mentalModelCorrection": "Name the lookup or ordering capability the algorithm needs before ranking implementation costs.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Describe the required operation as either access-by-key or reasoning-from-order.",
      "result": "diagnostic",
      "distractorExplanations": {
        "smaller_big_o": "This alternative misses a stated part of the contract: Which strategy is usually described with the smaller Big-O expression.",
        "available_method_names": "This alternative misses a stated part of the contract: Whether the language provides built-in Map and sort methods.",
        "input_contains_numbers": "This alternative misses a stated part of the contract: Whether the input contains numeric values that can be compared."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Before comparing a hash-based solution with a sorting-based solution, what should the learner identify first?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "required_structure",
        "feedback": "The strategy signal comes from the structure required for correctness. Hash-based state provides access by key, while sorting creates order that later logic can exploit.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "required_structure",
            "text": "Whether the solution needs keyed access to prior information or an ordered representation that creates adjacency, runs, or deterministic traversal."
          },
          {
            "id": "smaller_big_o",
            "text": "Which strategy is usually described with the smaller Big-O expression."
          },
          {
            "id": "available_method_names",
            "text": "Whether the language provides built-in Map and sort methods."
          },
          {
            "id": "input_contains_numbers",
            "text": "Whether the input contains numeric values that can be compared."
          }
        ],
        "prompt": "Before comparing a hash-based solution with a sorting-based solution, what should the learner identify first?",
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
    "title": "Hash map versus sorting: recognize 001",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The current element must be checked against information accumulated from earlier elements.",
      "mentalModelCorrection": "Seen-before reasoning is about keyed membership, not about placing equal values next to one another.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use a Set when all previously observed occurrences of a value can be represented by one membership entry.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorted_runs": "This alternative misses a stated part of the contract: Sort the entire input to create equal-value runs before processing any element.",
        "running_extremes": "This alternative misses a stated part of the contract: Track only the smallest and largest values encountered.",
        "adjacent_raw_values": "This alternative misses a stated part of the contract: Compare the current value only with its previous unsorted neighbor."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "During a left-to-right scan, the algorithm must answer: “Have I already encountered this exact value?” Which strategy signal is present?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "seen_set",
        "feedback": "The question asks for membership among previously processed values. That is a direct keyed-lookup signal and requires only seen-before state.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-002-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "seen_set",
            "text": "Maintain hash-based seen-before state keyed by value."
          },
          {
            "id": "sorted_runs",
            "text": "Sort the entire input to create equal-value runs before processing any element."
          },
          {
            "id": "running_extremes",
            "text": "Track only the smallest and largest values encountered."
          },
          {
            "id": "adjacent_raw_values",
            "text": "Compare the current value only with its previous unsorted neighbor."
          }
        ],
        "prompt": "During a left-to-right scan, the algorithm must answer: “Have I already encountered this exact value?” Which strategy signal is present?",
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
    "title": "Hash map versus sorting: recognize 002",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "acceptableApproachIds": [],
    "rejectedApproachIds": [
      "choose_without_contract"
    ],
    "reasonSignal": "Seen-before reasoning is about keyed membership, not about placing equal values next to one another.",
    "constraintSignal": "The current element must be checked against information accumulated from earlier elements."
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Different positive counts lead to different algorithmic decisions or outputs.",
      "mentalModelCorrection": "A Set answers whether a key exists; a frequency Map answers how many times it has occurred.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Choose count-valued keyed state whenever multiplicity affects correctness.",
      "result": "diagnostic",
      "distractorExplanations": {
        "seen_set": "This alternative misses a stated part of the contract: A Set recording only whether each value has appeared.",
        "sorted_boolean": "This alternative misses a stated part of the contract: One boolean recording whether the input is sorted.",
        "previous_value": "This alternative misses a stated part of the contract: A single variable containing the previous input element."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The algorithm must know the exact number of occurrences of each distinct value while scanning an unsorted input. Which structure does the contract call for?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "frequency_map",
        "feedback": "Exact frequency reasoning requires keyed state whose value changes with every occurrence. Membership alone cannot distinguish one occurrence from several.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-003-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "frequency_map",
            "text": "A hash map from each value to its current count."
          },
          {
            "id": "seen_set",
            "text": "A Set recording only whether each value has appeared."
          },
          {
            "id": "sorted_boolean",
            "text": "One boolean recording whether the input is sorted."
          },
          {
            "id": "previous_value",
            "text": "A single variable containing the previous input element."
          }
        ],
        "prompt": "The algorithm must know the exact number of occurrences of each distinct value while scanning an unsorted input. Which structure does the contract call for?",
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
    "title": "Hash map versus sorting: recognize 003",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "acceptableApproachIds": [],
    "rejectedApproachIds": [
      "choose_without_contract"
    ],
    "reasonSignal": "A Set answers whether a key exists; a frequency Map answers how many times it has occurred.",
    "constraintSignal": "Different positive counts lead to different algorithmic decisions or outputs."
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The required result includes information attached to an earlier occurrence.",
      "mentalModelCorrection": "Keyed lookup can retrieve stored metadata; sorting raw values may destroy the association being requested.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Store the exact metadata that must be recovered when the key is found.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_raw_values": "This alternative misses a stated part of the contract: Sort raw values and use their sorted positions as original indexes.",
        "presence_only_set": "This alternative misses a stated part of the contract: Store only value presence because presence always reveals the original position.",
        "adjacent_scan": "This alternative misses a stated part of the contract: Compare adjacent unsorted values until the original index becomes known."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-004",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The algorithm processes an unsorted array and must later recover where a previously seen matching value occurred. What strategy signal does this create?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "keyed_metadata_lookup",
        "feedback": "The algorithm needs more than membership: it needs to retrieve metadata associated with a key. That is a Map signal rather than a presence-only Set signal.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-004-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "keyed_metadata_lookup",
            "text": "Store metadata such as an original index under a value-based hash key."
          },
          {
            "id": "sort_raw_values",
            "text": "Sort raw values and use their sorted positions as original indexes."
          },
          {
            "id": "presence_only_set",
            "text": "Store only value presence because presence always reveals the original position."
          },
          {
            "id": "adjacent_scan",
            "text": "Compare adjacent unsorted values until the original index becomes known."
          }
        ],
        "prompt": "The algorithm processes an unsorted array and must later recover where a previously seen matching value occurred. What strategy signal does this create?",
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
    "title": "Hash map versus sorting: recognize 004",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "acceptableApproachIds": [],
    "rejectedApproachIds": [
      "choose_without_contract"
    ],
    "reasonSignal": "Keyed lookup can retrieve stored metadata; sorting raw values may destroy the association being requested.",
    "constraintSignal": "The required result includes information attached to an earlier occurrence."
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The algorithm derives the exact key it wants to retrieve rather than searching by relative order.",
      "mentalModelCorrection": "When the required counterpart can be named directly, keyed access is the relevant capability.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Express the needed counterpart as a key and determine what prior information must be stored under that key.",
      "result": "diagnostic",
      "distractorExplanations": {
        "ordered_run_scan": "This alternative misses a stated part of the contract: A scan of equal-value runs created by sorting.",
        "global_minimum": "This alternative misses a stated part of the contract: Tracking only the smallest value seen so far.",
        "adjacent_comparison": "This alternative misses a stated part of the contract: Comparing the current value only with the previous raw input value."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-005",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "For each current value, an algorithm computes another required value and asks whether that required value has already appeared. What is the strongest strategy signal?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "derived_key_hash_lookup",
        "feedback": "The current value determines a key that must be queried against prior state. That is the defining signal of complement-style keyed lookup.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-005-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "derived_key_hash_lookup",
            "text": "A hash lookup using the computed required value as the key."
          },
          {
            "id": "ordered_run_scan",
            "text": "A scan of equal-value runs created by sorting."
          },
          {
            "id": "global_minimum",
            "text": "Tracking only the smallest value seen so far."
          },
          {
            "id": "adjacent_comparison",
            "text": "Comparing the current value only with the previous raw input value."
          }
        ],
        "prompt": "For each current value, an algorithm computes another required value and asks whether that required value has already appeared. What is the strongest strategy signal?",
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
    "title": "Hash map versus sorting: recognize 005",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The next phase depends on neighboring values representing the same equivalence class.",
      "mentalModelCorrection": "Sorting is not chosen merely because values are comparable; it is chosen because ordered adjacency enables the required reasoning.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "State which useful adjacency or ordering invariant sorting will create.",
      "result": "diagnostic",
      "distractorExplanations": {
        "map_for_sorted_order": "This alternative misses a stated part of the contract: Insert values into a hash map because hash maps automatically place equal keys next to each other.",
        "raw_adjacent_scan": "This alternative misses a stated part of the contract: Compare neighboring values without any preprocessing.",
        "index_only_state": "This alternative misses a stated part of the contract: Store only the current array index."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The later scan becomes simple only if equal values are placed next to one another. Original encounter order is irrelevant. Which strategy signal is present?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sort_for_adjacency",
        "feedback": "Sorting is useful here because it creates the structural invariant needed by the later scan: equal values become contiguous.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-006-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sort_for_adjacency",
            "text": "Sort the values to create equal-value adjacency."
          },
          {
            "id": "map_for_sorted_order",
            "text": "Insert values into a hash map because hash maps automatically place equal keys next to each other."
          },
          {
            "id": "raw_adjacent_scan",
            "text": "Compare neighboring values without any preprocessing."
          },
          {
            "id": "index_only_state",
            "text": "Store only the current array index."
          }
        ],
        "prompt": "The later scan becomes simple only if equal values are placed next to one another. Original encounter order is irrelevant. Which strategy signal is present?",
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
    "title": "Hash map versus sorting: recognize 006",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "acceptableApproachIds": [],
    "rejectedApproachIds": [
      "choose_without_contract"
    ],
    "reasonSignal": "Sorting is not chosen merely because values are comparable; it is chosen because ordered adjacency enables the required reasoning.",
    "constraintSignal": "The next phase depends on neighboring values representing the same equivalence class."
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The algorithm wants to reason locally about complete groups of equal values.",
      "mentalModelCorrection": "A keyed structure can aggregate by value, but it does not create a sequential run for a later ordered scan.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use sorting when the subsequent algorithm is expressed in terms of run boundaries and neighboring values.",
      "result": "diagnostic",
      "distractorExplanations": {
        "seen_set": "This alternative misses a stated part of the contract: Use a Set, because membership exposes the beginning and end of every run.",
        "value_to_index_map": "This alternative misses a stated part of the contract: Map each value to one arbitrary index and infer the run boundaries from it.",
        "original_order_scan": "This alternative misses a stated part of the contract: Scan the unsorted input and assume equal values are already contiguous."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-007",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A solution should process each distinct value as one contiguous run and detect when the value changes. Which preprocessing best creates the required structure?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sort_into_runs",
        "feedback": "Run-based processing requires a representation in which all equal values are adjacent. Sorting creates that representation directly.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-007-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sort_into_runs",
            "text": "Sort the values so equal elements form contiguous runs."
          },
          {
            "id": "seen_set",
            "text": "Use a Set, because membership exposes the beginning and end of every run."
          },
          {
            "id": "value_to_index_map",
            "text": "Map each value to one arbitrary index and infer the run boundaries from it."
          },
          {
            "id": "original_order_scan",
            "text": "Scan the unsorted input and assume equal values are already contiguous."
          }
        ],
        "prompt": "A solution should process each distinct value as one contiguous run and detect when the value changes. Which preprocessing best creates the required structure?",
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
    "title": "Hash map versus sorting: recognize 007",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "acceptableApproachIds": [],
    "rejectedApproachIds": [
      "choose_without_contract"
    ],
    "reasonSignal": "A keyed structure can aggregate by value, but it does not create a sequential run for a later ordered scan.",
    "constraintSignal": "The algorithm wants to reason locally about complete groups of equal values."
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The required sequence is defined by value order rather than insertion or encounter order.",
      "mentalModelCorrection": "Fast access by key and ordered traversal are separate capabilities.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Identify whether determinism means insertion order, value order, or another explicit tie-breaking rule.",
      "result": "diagnostic",
      "distractorExplanations": {
        "plain_hash_iteration": "This alternative misses a stated part of the contract: A plain hash map because keyed access automatically implies ascending iteration.",
        "seen_before_set": "This alternative misses a stated part of the contract: A seen Set because membership determines numeric order.",
        "first_encounter_scan": "This alternative misses a stated part of the contract: A left-to-right scan of the original input without reordering."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-008",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The output must visit distinct values in ascending order, independent of their original encounter order. Which capability is required?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "order_producing_preprocessing",
        "feedback": "Keyed access does not inherently create the required numeric ordering. If ascending traversal is part of the contract, the strategy must explicitly produce that order.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-008-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "order_producing_preprocessing",
            "text": "An order-producing step such as sorting the relevant values or keys."
          },
          {
            "id": "plain_hash_iteration",
            "text": "A plain hash map because keyed access automatically implies ascending iteration."
          },
          {
            "id": "seen_before_set",
            "text": "A seen Set because membership determines numeric order."
          },
          {
            "id": "first_encounter_scan",
            "text": "A left-to-right scan of the original input without reordering."
          }
        ],
        "prompt": "The output must visit distinct values in ascending order, independent of their original encounter order. Which capability is required?",
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
    "title": "Hash map versus sorting: recognize 008",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "expectedApproachIds": [
      "choose_lookup_key"
    ],
    "acceptableApproachIds": [],
    "rejectedApproachIds": [
      "choose_without_contract"
    ],
    "reasonSignal": "Fast access by key and ordered traversal are separate capabilities.",
    "constraintSignal": "The required sequence is defined by value order rather than insertion or encounter order."
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The algorithm needs both a deterministic equivalence key and efficient access to the corresponding group.",
      "mentalModelCorrection": "Hashing and sorting can cooperate when they provide different required structures.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Name separately how equivalent inputs receive the same key and how items sharing that key are accumulated.",
      "result": "diagnostic",
      "distractorExplanations": {
        "map_canonicalizes_raw_input": "This alternative misses a stated part of the contract: A Map alone automatically recognizes differently ordered raw collections as equivalent.",
        "sorting_stores_groups": "This alternative misses a stated part of the contract: Sorting automatically creates and retains all group buckets without another structure.",
        "strategies_exclusive": "This alternative misses a stated part of the contract: Hashing and sorting cannot appear in the same valid grouping solution."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-009",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Equivalent collections may arrive in different element orders. The algorithm needs one deterministic representation for each equivalence class and then must store all matching collections together. Which description is most accurate?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sort_key_then_map_group",
        "feedback": "Canonicalization and group storage are separate needs. Sorting may normalize the representation, while keyed state retrieves the bucket for that representation.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-009-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sort_key_then_map_group",
            "text": "Sorting can construct a canonical key, and a Map can store the group associated with that key."
          },
          {
            "id": "map_canonicalizes_raw_input",
            "text": "A Map alone automatically recognizes differently ordered raw collections as equivalent."
          },
          {
            "id": "sorting_stores_groups",
            "text": "Sorting automatically creates and retains all group buckets without another structure."
          },
          {
            "id": "strategies_exclusive",
            "text": "Hashing and sorting cannot appear in the same valid grouping solution."
          }
        ],
        "prompt": "Equivalent collections may arrive in different element orders. The algorithm needs one deterministic representation for each equivalence class and then must store all matching collections together. Which description is most accurate?",
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
    "title": "Hash map versus sorting: recognize 009",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The decision is based on a topic keyword rather than the operation required for correctness.",
      "mentalModelCorrection": "Problem vocabulary is not a substitute for identifying presence, count, ordering, or identity requirements.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Replace the word duplicate with the exact required question: presence, count, first repeat, ordered run, or distinct output.",
      "result": "diagnostic",
      "distractorExplanations": {
        "duplicates_require_sorting": "This alternative misses a stated part of the contract: Every duplicate-related task must use sorting instead.",
        "hash_maps_cannot_detect_duplicates": "This alternative misses a stated part of the contract: Hash-based state cannot be used for duplicate detection.",
        "strategy_depends_on_value_size": "This alternative misses a stated part of the contract: The strategy should be selected only from the maximum numeric value."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-010",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A developer says: \"The prompt mentions duplicates, so the solution must use a hash map.\" What is wrong with this reasoning?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "duplicate_word_not_signal",
        "feedback": "The relevant signal is the information and ordering the task requires. Different duplicate contracts legitimately favor different representations.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-010-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "duplicate_word_not_signal",
            "text": "Duplicate-related tasks may require seen-before state, exact counts, sorted equal-value runs, or encounter-order preservation; the word duplicates alone does not select one strategy."
          },
          {
            "id": "duplicates_require_sorting",
            "text": "Every duplicate-related task must use sorting instead."
          },
          {
            "id": "hash_maps_cannot_detect_duplicates",
            "text": "Hash-based state cannot be used for duplicate detection."
          },
          {
            "id": "strategy_depends_on_value_size",
            "text": "The strategy should be selected only from the maximum numeric value."
          }
        ],
        "prompt": "A developer says: \"The prompt mentions duplicates, so the solution must use a hash map.\" What is wrong with this reasoning?",
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
    "title": "Hash map versus sorting: recognize 010",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The proposed strategy has no stated connection between sorted order and the required result.",
      "mentalModelCorrection": "A transformation should be chosen for what it enables, not merely because it is available.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Complete the sentence: “After sorting, the algorithm can safely…”",
      "result": "diagnostic",
      "distractorExplanations": {
        "sortable_values_require_hashing": "This alternative misses a stated part of the contract: Any values that can be ordered must instead be stored in a hash map.",
        "sorting_only_for_numbers": "This alternative misses a stated part of the contract: Sorting is valid only for numeric values.",
        "ordered_values_cannot_hash": "This alternative misses a stated part of the contract: Values that support comparison cannot also be used as hash keys."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-011",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A developer chooses sorting only because “the values can be ordered.” Why is that insufficient?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "ordering_must_enable_reasoning",
        "feedback": "Comparability makes sorting possible, but it does not make sorting useful. The strategy needs a concrete invariant or output behavior created by the order.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-011-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "ordering_must_enable_reasoning",
            "text": "Sorting is justified only when the created order enables required adjacency, runs, traversal, canonicalization, or another correctness-relevant operation."
          },
          {
            "id": "sortable_values_require_hashing",
            "text": "Any values that can be ordered must instead be stored in a hash map."
          },
          {
            "id": "sorting_only_for_numbers",
            "text": "Sorting is valid only for numeric values."
          },
          {
            "id": "ordered_values_cannot_hash",
            "text": "Values that support comparison cannot also be used as hash keys."
          }
        ],
        "prompt": "A developer chooses sorting only because “the values can be ordered.” Why is that insufficient?",
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
    "title": "Hash map versus sorting: recognize 011",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The conclusion is based only on one complexity label and ignores whether the representation supports the required operations.",
      "mentalModelCorrection": "Performance ranks valid strategies; it does not make an unsuitable representation correct.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Verify the required access pattern, ordering, metadata, and output contract before comparing runtime.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hashing_never_best": "This alternative misses a stated part of the contract: Hashing is never appropriate because expected complexity cannot be used in algorithm analysis.",
        "sorting_always_faster": "This alternative misses a stated part of the contract: Sorting is automatically faster because it creates a deterministic order.",
        "both_always_equivalent": "This alternative misses a stated part of the contract: The two strategies always preserve the same information, so only syntax matters."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-012",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A reviewer says: \"Hashing has expected O(n) time, so it is automatically the best strategy.\" Which response is correct?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "structure_and_contract_first",
        "feedback": "Expected linear time can be attractive, but the strategy must first produce the structure and output behavior required by the problem.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-012-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "structure_and_contract_first",
            "text": "Expected time does not override requirements for ordered traversal, deterministic value order, canonical representation, mutation limits, or information that the chosen hash state does not preserve."
          },
          {
            "id": "hashing_never_best",
            "text": "Hashing is never appropriate because expected complexity cannot be used in algorithm analysis."
          },
          {
            "id": "sorting_always_faster",
            "text": "Sorting is automatically faster because it creates a deterministic order."
          },
          {
            "id": "both_always_equivalent",
            "text": "The two strategies always preserve the same information, so only syntax matters."
          }
        ],
        "prompt": "A reviewer says: \"Hashing has expected O(n) time, so it is automatically the best strategy.\" Which response is correct?",
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
    "title": "Hash map versus sorting: recognize 012",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The learner must identify what each representation makes easy for subsequent logic.",
      "mentalModelCorrection": "Hashing and sorting are not merely two runtime profiles for the same state.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Ask whether the next operation knows the key it wants or instead needs relationships revealed by order.",
      "result": "diagnostic",
      "distractorExplanations": {
        "same_structure": "This alternative misses a stated part of the contract: Both strategies primarily create the same ordered sequence, but with different syntax.",
        "hash_creates_order": "This alternative misses a stated part of the contract: Hashing primarily creates ascending order, while sorting primarily stores value-to-index mappings.",
        "only_complexity_differs": "This alternative misses a stated part of the contract: The strategies have no structural difference and can be selected only by comparing Big-O."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-013",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which comparison most accurately distinguishes the primary strategy signals of hashing and sorting?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "lookup_vs_order",
        "feedback": "The fundamental contrast is capability: direct access by key versus preprocessing that exposes useful order relationships.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-013-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "lookup_vs_order",
            "text": "Hash-based state supports retrieving information by a known key; sorting creates an order from which adjacency, runs, or ordered traversal can be derived."
          },
          {
            "id": "same_structure",
            "text": "Both strategies primarily create the same ordered sequence, but with different syntax."
          },
          {
            "id": "hash_creates_order",
            "text": "Hashing primarily creates ascending order, while sorting primarily stores value-to-index mappings."
          },
          {
            "id": "only_complexity_differs",
            "text": "The strategies have no structural difference and can be selected only by comparing Big-O."
          }
        ],
        "prompt": "Which comparison most accurately distinguishes the primary strategy signals of hashing and sorting?",
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
    "title": "Hash map versus sorting: recognize 013",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The problem must be translated from surface vocabulary into a required access or ordering capability.",
      "mentalModelCorrection": "Strategy recognition precedes detailed complexity analysis: first name the structure that makes the solution correct.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "State in one sentence what the chosen representation enables that the alternative does not provide directly.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_for_duplicates": "This alternative misses a stated part of the contract: Choose hashing whenever the prompt mentions duplicates, frequencies, or matching values.",
        "sort_when_comparable": "This alternative misses a stated part of the contract: Choose sorting whenever the input values support a comparator.",
        "choose_smallest_big_o_first": "This alternative misses a stated part of the contract: Choose the strategy with the smallest familiar Big-O before checking what state or ordering the solution needs."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-recognize-014",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which decision rule best captures the strategy signal in the hash-map-versus-sorting contrast?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "name_required_structure",
        "feedback": "The correct strategy follows from the operation the representation must support. Keyed retrieval and order-producing preprocessing are distinct capabilities, and some solutions legitimately require both.",
        "id": "alg-contrast-hash-map-vs-sorting-recognize-014-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "name_required_structure",
            "text": "Choose hash-based state when later logic needs access by value or derived key, and choose sorting when later logic needs order-created adjacency, runs, deterministic traversal, or canonical form; combine them when both structures are required."
          },
          {
            "id": "hash_for_duplicates",
            "text": "Choose hashing whenever the prompt mentions duplicates, frequencies, or matching values."
          },
          {
            "id": "sort_when_comparable",
            "text": "Choose sorting whenever the input values support a comparator."
          },
          {
            "id": "choose_smallest_big_o_first",
            "text": "Choose the strategy with the smallest familiar Big-O before checking what state or ordering the solution needs."
          }
        ],
        "prompt": "Which decision rule best captures the strategy signal in the hash-map-versus-sorting contrast?",
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
    "title": "Hash map versus sorting: recognize 014",
    "trackId": "algorithms",
    "type": "single_choice"
  }
];
