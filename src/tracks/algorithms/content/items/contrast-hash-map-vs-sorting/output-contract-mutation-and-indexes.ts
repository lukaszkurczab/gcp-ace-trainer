export const outputContractMutationAndIndexesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The competing implementations may retain different information or produce different observable behavior.",
      "mentalModelCorrection": "Correctness includes the complete output and mutation contract, not only finding some mathematically related result.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "List the required output fields, ordering rule, tie-breaking rule, and mutation constraints before comparing performance.",
      "result": "diagnostic",
      "distractorExplanations": {
        "complexity_first": "This alternative misses a stated part of the contract: Which asymptotic expression is numerically smaller, regardless of the returned result.",
        "syntax_first": "This alternative misses a stated part of the contract: Which solution uses fewer variables and shorter method names.",
        "hash_first": "This alternative misses a stated part of the contract: Whether one solution contains a Map, because that automatically makes it valid."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "What should be checked before comparing an expected O(n) hash-based solution with an O(n log n) sorting-based solution?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "contract_first",
        "feedback": "Complexity comparisons are meaningful only among correct solutions. A faster strategy is invalid if it destroys required indexes, changes required ordering, mutates protected input, or returns the wrong valid candidate.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "contract_first",
            "text": "Whether each solution preserves the information and behavior required by the output and mutation contract."
          },
          {
            "id": "complexity_first",
            "text": "Which asymptotic expression is numerically smaller, regardless of the returned result."
          },
          {
            "id": "syntax_first",
            "text": "Which solution uses fewer variables and shorter method names."
          },
          {
            "id": "hash_first",
            "text": "Whether one solution contains a Map, because that automatically makes it valid."
          }
        ],
        "prompt": "What should be checked before comparing an expected O(n) hash-based solution with an O(n log n) sorting-based solution?",
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
    "title": "Hash map versus sorting: contract 001",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The output refers to identity in the original input, while the algorithm returns positions in a transformed representation.",
      "mentalModelCorrection": "[2, 3, 5] has the same values but violates the output order; sorting instead solves sorted-unique output.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_changes_values": "This alternative misses a stated part of the contract: Sorting changes the numeric values, so the match is no longer valid.",
        "indexes_require_set": "This alternative misses a stated part of the contract: Original indexes can be returned only by a Set.",
        "sorting_removes_duplicates": "This alternative misses a stated part of the contract: Sorting automatically removes repeated values and therefore all index identity."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-002",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Return distinct values in first-seen order for nums = [5, 2, 5, 3, 2]. Which output matches?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sorted_positions_not_original",
        "feedback": "[2, 3, 5] has the same values but violates the output order; sorting instead solves sorted-unique output.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-002-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sorted_positions_not_original",
            "text": "[5, 2, 3]; a Set iterated in insertion order preserves the required first-seen order."
          },
          {
            "id": "sorting_changes_values",
            "text": "Sorting changes the numeric values, so the match is no longer valid."
          },
          {
            "id": "indexes_require_set",
            "text": "Original indexes can be returned only by a Set."
          },
          {
            "id": "sorting_removes_duplicates",
            "text": "Sorting automatically removes repeated values and therefore all index identity."
          }
        ],
        "prompt": "Return distinct values in first-seen order for nums = [5, 2, 5, 3, 2]. Which output matches?",
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
    "title": "Hash map versus sorting: contract 002",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The algorithm needs sorted value order, original identity, and input immutability simultaneously.",
      "mentalModelCorrection": "A transformation is valid when all contract-relevant metadata is carried into the transformed representation.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Attach identity metadata before reordering data whose original positions still matter.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_nums_directly": "This alternative misses a stated part of the contract: Sort nums in place and treat the sorted positions as original indexes.",
        "copy_values_only": "This alternative misses a stated part of the contract: Copy and sort only the values, then return positions from the copied array.",
        "remove_duplicates_first": "This alternative misses a stated part of the contract: Convert nums to unique values before sorting so indexes become easier to reconstruct."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-003",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The contract requires original indexes and forbids mutation of nums. Which sorting-based preparation can satisfy both requirements?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "copy_value_index_records",
        "feedback": "The copied representation leaves nums unchanged, while each record preserves the original index through the sort.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-003-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "copy_value_index_records",
            "text": "Create a separate array of { value, originalIndex } records and sort that array by value."
          },
          {
            "id": "sort_nums_directly",
            "text": "Sort nums in place and treat the sorted positions as original indexes."
          },
          {
            "id": "copy_values_only",
            "text": "Copy and sort only the values, then return positions from the copied array."
          },
          {
            "id": "remove_duplicates_first",
            "text": "Convert nums to unique values before sorting so indexes become easier to reconstruct."
          }
        ],
        "prompt": "The contract requires original indexes and forbids mutation of nums. Which sorting-based preparation can satisfy both requirements?",
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
    "title": "Hash map versus sorting: contract 003",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The sorting operation is applied directly to the caller-provided collection.",
      "mentalModelCorrection": "A new variable name does not imply a new data structure. Mutation depends on object identity and the operation being performed.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Create a separate representation before sorting when the original input must remain unchanged.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorted_is_copy": "This alternative misses a stated part of the contract: No violation occurs because assigning the result to sorted creates a full copy.",
        "comparator_mutates_numbers": "This alternative misses a stated part of the contract: The comparator changes each numeric value stored in nums.",
        "returning_array_invalid": "This alternative misses a stated part of the contract: A function that receives an array cannot return an array."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-004",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The contract states that nums must remain unchanged. Review:\n\nfunction solve(nums: number[]): number[] {\n  const sorted = nums.sort((a, b) => a - b);\n  // scan sorted\n  return sorted;\n}\n\nWhat contract violation occurs?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "nums_mutated",
        "feedback": "The sorted variable references the same array object. Sorting it changes nums, so the solution violates an explicit non-mutation requirement even if the returned values are otherwise correct.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-004-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "nums_mutated",
            "text": "Sorting through nums.sort changes the original array object supplied by the caller."
          },
          {
            "id": "sorted_is_copy",
            "text": "No violation occurs because assigning the result to sorted creates a full copy."
          },
          {
            "id": "comparator_mutates_numbers",
            "text": "The comparator changes each numeric value stored in nums."
          },
          {
            "id": "returning_array_invalid",
            "text": "A function that receives an array cannot return an array."
          }
        ],
        "prompt": "The contract states that nums must remain unchanged. Review:\n\nfunction solve(nums: number[]): number[] {\n  const sorted = nums.sort((a, b) => a - b);\n  // scan sorted\n  return sorted;\n}\n\nWhat contract violation occurs?",
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
    "title": "Hash map versus sorting: contract 004",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The implementation creates a new array before applying the mutating sort operation.",
      "mentalModelCorrection": "Copying can satisfy a mutation contract, but it has memory cost and does not automatically preserve element identity.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Evaluate input preservation, metadata preservation, and copy cost as separate concerns.",
      "result": "diagnostic",
      "distractorExplanations": {
        "mutates_nums": "This alternative misses a stated part of the contract: It still sorts nums in place because the spread operator preserves array identity.",
        "preserves_indexes": "This alternative misses a stated part of the contract: It automatically preserves every value's original index.",
        "constant_space": "This alternative misses a stated part of the contract: It satisfies immutability without allocating storage proportional to n."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-005",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which statement about this preparation is correct?\n\nconst sorted = [...nums].sort((a, b) => a - b);",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "preserves_nums_uses_copy",
        "feedback": "Copying prevents mutation of the original array, but it does not preserve original index metadata and it incurs linear auxiliary storage.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-005-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "preserves_nums_uses_copy",
            "text": "It preserves nums by sorting a separate array, but the copied representation uses O(n) additional storage."
          },
          {
            "id": "mutates_nums",
            "text": "It still sorts nums in place because the spread operator preserves array identity."
          },
          {
            "id": "preserves_indexes",
            "text": "It automatically preserves every value's original index."
          },
          {
            "id": "constant_space",
            "text": "It satisfies immutability without allocating storage proportional to n."
          }
        ],
        "prompt": "Which statement about this preparation is correct?\n\nconst sorted = [...nums].sort((a, b) => a - b);",
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
    "title": "Hash map versus sorting: contract 005",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The output contract requires value order that differs from the structure's iteration contract.",
      "mentalModelCorrection": "Deterministic iteration order is not the same as sorted iteration order.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Sort the resulting keys when the output contract explicitly requires ascending order.",
      "result": "diagnostic",
      "distractorExplanations": {
        "map_cannot_store_numbers": "This alternative misses a stated part of the contract: JavaScript Map keys cannot be numbers.",
        "keys_returns_counts": "This alternative misses a stated part of the contract: map.keys() returns occurrence counts rather than keys.",
        "map_always_reverse": "This alternative misses a stated part of the contract: Map iteration always returns keys in descending order."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-006",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A JavaScript solution inserts numbers into a Map and later returns [...map.keys()] as an ascending result. What is the error in the reasoning?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "insertion_not_numeric_order",
        "feedback": "A Map can preserve encounter-based insertion order, but it does not sort numeric keys. If ascending output is required, the result still needs an ordering step or an ordered representation.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-006-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "insertion_not_numeric_order",
            "text": "Map iteration follows insertion order, not automatic ascending numeric order."
          },
          {
            "id": "map_cannot_store_numbers",
            "text": "JavaScript Map keys cannot be numbers."
          },
          {
            "id": "keys_returns_counts",
            "text": "map.keys() returns occurrence counts rather than keys."
          },
          {
            "id": "map_always_reverse",
            "text": "Map iteration always returns keys in descending order."
          }
        ],
        "prompt": "A JavaScript solution inserts numbers into a Map and later returns [...map.keys()] as an ascending result. What is the error in the reasoning?",
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
    "title": "Hash map versus sorting: contract 006",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The input contains multiple valid outputs, and the strategies discover them in different orders.",
      "mentalModelCorrection": "Validity of one result does not prove compliance with a contract that specifies which valid result must be selected.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Define whether the caller accepts any valid result or requires a specific deterministic candidate.",
      "result": "diagnostic",
      "distractorExplanations": {
        "first_encounter_pair": "This alternative misses a stated part of the contract: When the contract requires the first pair completed in original encounter order.",
        "smallest_indexes": "This alternative misses a stated part of the contract: When the contract requires the lexicographically smallest original index pair.",
        "same_pair_required": "This alternative misses a stated part of the contract: Never, because all correct algorithms must return the same valid pair."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-007",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "For nums = [3, 2, 4, 1] and target = 5:\n\n- a one-pass complement Map returns values 3 and 2;\n- sorting plus two pointers returns values 1 and 4.\n\nWhen are both results acceptable?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "any_valid_pair",
        "feedback": "Both pairs are mathematically valid. They are interchangeable only under an any-valid-result contract without an additional tie-breaking rule.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-007-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "any_valid_pair",
            "text": "When the contract permits any pair of distinct elements whose values sum to the target."
          },
          {
            "id": "first_encounter_pair",
            "text": "When the contract requires the first pair completed in original encounter order."
          },
          {
            "id": "smallest_indexes",
            "text": "When the contract requires the lexicographically smallest original index pair."
          },
          {
            "id": "same_pair_required",
            "text": "Never, because all correct algorithms must return the same valid pair."
          }
        ],
        "prompt": "For nums = [3, 2, 4, 1] and target = 5:\n\n- a one-pass complement Map returns values 3 and 2;\n- sorting plus two pointers returns values 1 and 4.\n\nWhen are both results acceptable?",
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
    "title": "Hash map versus sorting: contract 007",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The selected result depends on when it becomes valid in the original sequence.",
      "mentalModelCorrection": "Sorting changes the traversal order and therefore may change which otherwise valid result is returned first.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Avoid reordering data when the output is defined by original processing order.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_then_return_first": "This alternative misses a stated part of the contract: Sort by value and return the first valid result found in sorted order.",
        "set_then_sort": "This alternative misses a stated part of the contract: Convert the input to a Set and sort the remaining unique values.",
        "reverse_scan": "This alternative misses a stated part of the contract: Scan from right to left because every valid result is independent of encounter order."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-008",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The contract requires returning the first valid result completed during a left-to-right scan of the original input. Which strategy most directly preserves that meaning?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "one_pass_hash_scan",
        "feedback": "The contract is defined by original encounter order. Processing that order directly and returning at the first proof naturally preserves the required semantics.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-008-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "one_pass_hash_scan",
            "text": "A one-pass hash scan that processes original indexes in order and returns when the current element completes a valid result."
          },
          {
            "id": "sort_then_return_first",
            "text": "Sort by value and return the first valid result found in sorted order."
          },
          {
            "id": "set_then_sort",
            "text": "Convert the input to a Set and sort the remaining unique values."
          },
          {
            "id": "reverse_scan",
            "text": "Scan from right to left because every valid result is independent of encounter order."
          }
        ],
        "prompt": "The contract requires returning the first valid result completed during a left-to-right scan of the original input. Which strategy most directly preserves that meaning?",
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
    "title": "Hash map versus sorting: contract 008",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Several equal-value occurrences can complete the same result, but the contract prefers the earliest index.",
      "mentalModelCorrection": "Lookup-before-insert prevents same-position reuse, and earliest per-value indexes can matter, but neither makes a first found result globally optimal. The contract must govern early return.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "duplicates_cannot_pair": "This alternative misses a stated part of the contract: Two equal values can never appear before a complement.",
        "three_must_come_first": "This alternative misses a stated part of the contract: The larger value must always be returned as the first index.",
        "map_cannot_return_indexes": "This alternative misses a stated part of the contract: A Map cannot be used for any original-index contract."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-009",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The contract requires the lexicographically smallest valid index pair. nums = [2, 4, 6, 8], target = 10. A lookup-before-insert Map returns its first found pair [1, 2] for 4 + 6. What is required?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "earlier_pair_exists",
        "feedback": "Lookup-before-insert prevents same-position reuse, and earliest per-value indexes can matter, but neither makes a first found result globally optimal. The contract must govern early return.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-009-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "earlier_pair_exists",
            "text": "Do not automatically return the first valid pair: [0, 3] is globally lexicographically smaller, so inspect all relevant candidates or use a strategy designed for this tie-break."
          },
          {
            "id": "duplicates_cannot_pair",
            "text": "Two equal values can never appear before a complement."
          },
          {
            "id": "three_must_come_first",
            "text": "The larger value must always be returned as the first index."
          },
          {
            "id": "map_cannot_return_indexes",
            "text": "A Map cannot be used for any original-index contract."
          }
        ],
        "prompt": "The contract requires the lexicographically smallest valid index pair. nums = [2, 4, 6, 8], target = 10. A lookup-before-insert Map returns its first found pair [1, 2] for 4 + 6. What is required?",
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
    "title": "Hash map versus sorting: contract 009",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The contract selects among valid outputs using an ordering over values.",
      "mentalModelCorrection": "Deterministic output requires an explicit selection rule. Encounter order and value order are different rules.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Choose a traversal order aligned with the contract's deterministic selection rule.",
      "result": "diagnostic",
      "distractorExplanations": {
        "first_hash_match": "This alternative misses a stated part of the contract: Return the first match found by a hash scan in original encounter order.",
        "map_iteration": "This alternative misses a stated part of the contract: Return the first two matching keys encountered during Map iteration because Map keys are numerically sorted.",
        "arbitrary_set_match": "This alternative misses a stated part of the contract: Return any matching values from a Set because every valid output is equivalent."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-010",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Multiple valid results may exist. The contract requires returning the valid value pair with the smallest first value, with both returned values in ascending order. Which approach most directly exposes this ordering?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sorted_search",
        "feedback": "The output contract is value-order-based rather than encounter-order-based. A sorted representation makes the relevant ordering explicit, although the search must still implement the exact tie-breaking rule correctly.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-010-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sorted_search",
            "text": "Search an appropriately sorted representation using logic that respects the specified tie-breaking rule."
          },
          {
            "id": "first_hash_match",
            "text": "Return the first match found by a hash scan in original encounter order."
          },
          {
            "id": "map_iteration",
            "text": "Return the first two matching keys encountered during Map iteration because Map keys are numerically sorted."
          },
          {
            "id": "arbitrary_set_match",
            "text": "Return any matching values from a Set because every valid output is equivalent."
          }
        ],
        "prompt": "Multiple valid results may exist. The contract requires returning the valid value pair with the smallest first value, with both returned values in ascending order. Which approach most directly exposes this ordering?",
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
    "title": "Hash map versus sorting: contract 010",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Value equality does not imply element identity when the output references positions.",
      "mentalModelCorrection": "Multiplicity and occurrence identity must survive when distinct duplicate positions are valid or required outputs.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Represent every occurrence separately whenever original indexes are part of the result.",
      "result": "diagnostic",
      "distractorExplanations": {
        "unique_value_set": "This alternative misses a stated part of the contract: A Set containing the equal value once.",
        "sorted_unique_values": "This alternative misses a stated part of the contract: A sorted array with duplicate values removed.",
        "single_value_index": "This alternative misses a stated part of the contract: One record containing the value and an arbitrary one of the two indexes."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-011",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The input contains two equal values at different indexes, and the result must return both original indexes. What representation is required to preserve their distinct identities during sorting?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "separate_value_index_records",
        "feedback": "Equal values may still represent different input elements. Collapsing them into one Set entry or one record destroys the occurrence identity required by the index-returning contract.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-011-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "separate_value_index_records",
            "text": "Separate records for each occurrence, each containing the value and its own original index."
          },
          {
            "id": "unique_value_set",
            "text": "A Set containing the equal value once."
          },
          {
            "id": "sorted_unique_values",
            "text": "A sorted array with duplicate values removed."
          },
          {
            "id": "single_value_index",
            "text": "One record containing the value and an arbitrary one of the two indexes."
          }
        ],
        "prompt": "The input contains two equal values at different indexes, and the result must return both original indexes. What representation is required to preserve their distinct identities during sorting?",
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
    "title": "Hash map versus sorting: contract 011",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "One output describes content, while the other describes where specific occurrences came from.",
      "mentalModelCorrection": "Values and indexes are not interchangeable output formats; they impose different representation requirements.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Derive the stored metadata from the exact fields required in the returned result.",
      "result": "diagnostic",
      "distractorExplanations": {
        "same_information": "This alternative misses a stated part of the contract: The contracts are equivalent because indexes can always be reconstructed from sorted positions.",
        "values_need_more_state": "This alternative misses a stated part of the contract: Returning values always requires more metadata than returning original indexes.",
        "hash_cannot_return_values": "This alternative misses a stated part of the contract: Hash-based state can return indexes but cannot return the associated values."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-012",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which statement correctly distinguishes a value-returning contract from an original-index-returning contract?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "indexes_need_identity",
        "feedback": "A value-only result may remain valid after reordering. An original-index result refers to occurrence identity in the source input and therefore requires explicit preservation of that identity.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-012-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "indexes_need_identity",
            "text": "Returning values may allow raw sorted values, while returning original indexes requires preserving the association between each occurrence and its original position."
          },
          {
            "id": "same_information",
            "text": "The contracts are equivalent because indexes can always be reconstructed from sorted positions."
          },
          {
            "id": "values_need_more_state",
            "text": "Returning values always requires more metadata than returning original indexes."
          },
          {
            "id": "hash_cannot_return_values",
            "text": "Hash-based state can return indexes but cannot return the associated values."
          }
        ],
        "prompt": "Which statement correctly distinguishes a value-returning contract from an original-index-returning contract?",
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
    "title": "Hash map versus sorting: contract 012",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The faster candidates violate separate mandatory parts of the contract.",
      "mentalModelCorrection": "An invalid O(n) solution is not preferable to a correct O(n log n) solution. Repair correctness before optimizing.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Filter out contract-invalid candidates before performing complexity comparison.",
      "result": "diagnostic",
      "distractorExplanations": {
        "a_best": "This alternative misses a stated part of the contract: Solution A should be accepted because expected O(n) is the smallest time bound.",
        "b_best": "This alternative misses a stated part of the contract: Solution B should be accepted because it returns two numeric positions.",
        "all_valid": "This alternative misses a stated part of the contract: All three are valid because they attempt to locate matching values."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-013",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The contract requires original indexes and forbids input mutation.\n\nSolution A runs in expected O(n), but it stores only membership and cannot return indexes.\n\nSolution B sorts nums in place and returns sorted positions.\n\nSolution C copies { value, originalIndex } records, sorts them, and returns original indexes in O(n log n).\n\nWhich review is correct?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "only_c_valid",
        "feedback": "Solution A lacks required result metadata. Solution B mutates the input and returns positions from the wrong representation. Solution C is slower asymptotically but is the only valid implementation as described.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-013-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "only_c_valid",
            "text": "Only Solution C currently satisfies both the output and mutation contracts."
          },
          {
            "id": "a_best",
            "text": "Solution A should be accepted because expected O(n) is the smallest time bound."
          },
          {
            "id": "b_best",
            "text": "Solution B should be accepted because it returns two numeric positions."
          },
          {
            "id": "all_valid",
            "text": "All three are valid because they attempt to locate matching values."
          }
        ],
        "prompt": "The contract requires original indexes and forbids input mutation.\n\nSolution A runs in expected O(n), but it stores only membership and cannot return indexes.\n\nSolution B sorts nums in place and returns sorted positions.\n\nSolution C copies { value, originalIndex } records, sorts them, and returns original indexes in O(n log n).\n\nWhich review is correct?",
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
    "title": "Hash map versus sorting: contract 013",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The algorithm's observable behavior includes returned data, selection order, determinism, and effects on the input.",
      "mentalModelCorrection": "Strategy selection is constrained by information preservation and side effects before it is optimized by asymptotic complexity.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Specify result content, ordering, determinism, occurrence identity, and mutation policy before implementing either strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_always_valid": "This alternative misses a stated part of the contract: Use hashing whenever expected O(n) is available because output ordering and stored metadata can be ignored.",
        "sorting_always_deterministic": "This alternative misses a stated part of the contract: Use raw in-place sorting whenever deterministic output is required because it automatically preserves original indexes and caller state.",
        "any_valid_equals_first": "This alternative misses a stated part of the contract: Treat any valid output as equivalent to the first or earliest valid output because tie-breaking never affects correctness."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-output-contract-014",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which decision rule most accurately captures how output and mutation requirements affect the hash-map-versus-sorting choice?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "contract_driven_strategy",
        "feedback": "Hashing and sorting preserve different properties. The correct choice depends on what the result must contain, which valid result must be selected, whether input order matters, and whether mutation is permitted.",
        "id": "alg-contrast-hash-map-vs-sorting-output-contract-014-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "contract_driven_strategy",
            "text": "Choose a representation that preserves required indexes, order, identity, and tie-breaking semantics; sort only when reordering is compatible with the contract, and copy or decorate data when mutation or metadata loss would otherwise occur."
          },
          {
            "id": "hash_always_valid",
            "text": "Use hashing whenever expected O(n) is available because output ordering and stored metadata can be ignored."
          },
          {
            "id": "sorting_always_deterministic",
            "text": "Use raw in-place sorting whenever deterministic output is required because it automatically preserves original indexes and caller state."
          },
          {
            "id": "any_valid_equals_first",
            "text": "Treat any valid output as equivalent to the first or earliest valid output because tie-breaking never affects correctness."
          }
        ],
        "prompt": "Which decision rule most accurately captures how output and mutation requirements affect the hash-map-versus-sorting choice?",
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
    "title": "Hash map versus sorting: contract 014",
    "trackId": "algorithms",
    "type": "single_choice"
  }
];
