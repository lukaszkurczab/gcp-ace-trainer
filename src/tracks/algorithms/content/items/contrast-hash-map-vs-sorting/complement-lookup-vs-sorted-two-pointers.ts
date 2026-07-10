export const complementLookupVsSortedTwoPointersQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The task asks only for pair existence in an unsorted array and allows expected linear-time hash lookup.",
      "mentalModelCorrection": "Two pointers need value ordering. A Set can solve pair existence without sorting when no index metadata is required.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Identify whether the output requires existence, values, or original indexes before choosing the stored hash state.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_then_binary_search": "This alternative misses a stated part of the contract: Sort the array and run binary search for every element.",
        "unsorted_two_pointers": "This alternative misses a stated part of the contract: Place one pointer at each end of the unsorted array and move them according to the current sum.",
        "all_pairs": "This alternative misses a stated part of the contract: Generate every possible pair and stop when one reaches the target."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "You receive an unsorted array and need only determine whether any two distinct elements sum to a target. You want expected O(n) time and do not need to preserve the pair's original indexes. Which strategy best matches that contract?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "one_pass_set",
        "feedback": "A one-pass Set lookup provides expected O(n) time and O(n) extra space. Checking before inserting ensures that the matching value comes from an earlier, distinct array position.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-001-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "one_pass_set",
            "text": "Scan once, check whether target - current is already in a Set, and insert the current value after the check."
          },
          {
            "id": "sort_then_binary_search",
            "text": "Sort the array and run binary search for every element."
          },
          {
            "id": "unsorted_two_pointers",
            "text": "Place one pointer at each end of the unsorted array and move them according to the current sum."
          },
          {
            "id": "all_pairs",
            "text": "Generate every possible pair and stop when one reaches the target."
          }
        ],
        "prompt": "You receive an unsorted array and need only determine whether any two distinct elements sum to a target. You want expected O(n) time and do not need to preserve the pair's original indexes. Which strategy best matches that contract?",
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
    "title": "Hash map versus sorting: complement 001",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The current element becomes visible in the hash state before the algorithm proves that a previous matching element exists.",
      "mentalModelCorrection": "Hash membership proves that some inserted occurrence exists. Therefore only earlier elements should be inserted when processing the current position.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Rewrite the loop so it checks for the complement first and inserts the current value only after the check fails.",
      "result": "diagnostic",
      "distractorExplanations": {
        "duplicates_ignored": "This alternative misses a stated part of the contract: A Set can never solve a pair-existence problem when duplicate values are present.",
        "target_mutated": "This alternative misses a stated part of the contract: Computing target - value changes the target during iteration.",
        "requires_sorting": "This alternative misses a stated part of the contract: Hash lookup is valid only after the array has been sorted."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Consider this implementation:\n\nconst seen = new Set<number>();\n\nfor (const value of nums) {\n  seen.add(value);\n\n  if (seen.has(target - value)) {\n    return true;\n  }\n}\n\nreturn false;\n\nWhat is the main correctness problem?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "self_reuse",
        "feedback": "The lookup must happen before insertion. Otherwise a single occurrence of target / 2 can be inserted and immediately reused as both elements of the pair.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-002-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "self_reuse",
            "text": "The current value is inserted before lookup, so it can incorrectly match itself when target - value equals value."
          },
          {
            "id": "duplicates_ignored",
            "text": "A Set can never solve a pair-existence problem when duplicate values are present."
          },
          {
            "id": "target_mutated",
            "text": "Computing target - value changes the target during iteration."
          },
          {
            "id": "requires_sorting",
            "text": "Hash lookup is valid only after the array has been sorted."
          }
        ],
        "prompt": "Consider this implementation:\n\nconst seen = new Set<number>();\n\nfor (const value of nums) {\n  seen.add(value);\n\n  if (seen.has(target - value)) {\n    return true;\n  }\n}\n\nreturn false;\n\nWhat is the main correctness problem?",
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
    "title": "Hash map versus sorting: complement 002",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A one-element input exposes whether the implementation distinguishes a value from a second occurrence of that value.",
      "mentalModelCorrection": "The equation value + value = target is insufficient. The contract requires two distinct array positions.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use single-element and target-equals-double-value cases when reviewing complement lookup implementations.",
      "result": "diagnostic",
      "distractorExplanations": {
        "false_should_false": "This alternative misses a stated part of the contract: It returns false, which is correct because the complement is not present.",
        "true_should_true": "This alternative misses a stated part of the contract: It returns true, which is correct because 5 + 5 equals 10.",
        "throws": "This alternative misses a stated part of the contract: It throws because a Set cannot store the value 5 twice."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-003",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The following insert-before-lookup algorithm runs on:\n\nnums = [5]\ntarget = 10\n\nfor (const value of nums) {\n  seen.add(value);\n\n  if (seen.has(target - value)) {\n    return true;\n  }\n}\n\nWhat does the algorithm return, and what should the correct answer be?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "true_should_false",
        "feedback": "After inserting 5, the lookup for 10 - 5 finds that same inserted 5. The algorithm therefore reuses index 0 twice and produces a false positive.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-003-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "true_should_false",
            "text": "It returns true, but the correct answer is false because there is only one array element."
          },
          {
            "id": "false_should_false",
            "text": "It returns false, which is correct because the complement is not present."
          },
          {
            "id": "true_should_true",
            "text": "It returns true, which is correct because 5 + 5 equals 10."
          },
          {
            "id": "throws",
            "text": "It throws because a Set cannot store the value 5 twice."
          }
        ],
        "prompt": "The following insert-before-lookup algorithm runs on:\n\nnums = [5]\ntarget = 10\n\nfor (const value of nums) {\n  seen.add(value);\n\n  if (seen.has(target - value)) {\n    return true;\n  }\n}\n\nWhat does the algorithm return, and what should the correct answer be?",
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
    "title": "Hash map versus sorting: complement 003",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The pair uses equal values but distinct positions.",
      "mentalModelCorrection": "Set deduplication does not break one-pass existence checking because time order distinguishes the second occurrence from the first.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Separate value uniqueness in the Set from the number of distinct array positions encountered during the scan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_removes_duplicate": "This alternative misses a stated part of the contract: The Set removes the second 3, so the algorithm incorrectly returns false.",
        "first_matches_itself": "This alternative misses a stated part of the contract: The first 3 immediately matches itself and returns true.",
        "sorting_required": "This alternative misses a stated part of the contract: The algorithm cannot handle equal-value pairs unless the array is sorted first."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-004",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A correct lookup-before-insert Set algorithm processes:\n\nnums = [3, 3]\ntarget = 6\n\nWhat happens?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "second_matches_first",
        "feedback": "A Set does not need to store both occurrences simultaneously for this one-pass existence contract. The second occurrence can match the first occurrence already stored in the Set.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-004-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "second_matches_first",
            "text": "The first 3 is inserted; the second 3 finds its complement in the Set, so the algorithm returns true."
          },
          {
            "id": "set_removes_duplicate",
            "text": "The Set removes the second 3, so the algorithm incorrectly returns false."
          },
          {
            "id": "first_matches_itself",
            "text": "The first 3 immediately matches itself and returns true."
          },
          {
            "id": "sorting_required",
            "text": "The algorithm cannot handle equal-value pairs unless the array is sorted first."
          }
        ],
        "prompt": "A correct lookup-before-insert Set algorithm processes:\n\nnums = [3, 3]\ntarget = 6\n\nWhat happens?",
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
    "title": "Hash map versus sorting: complement 004",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The required output contains original positions, not merely pair existence or pair values.",
      "mentalModelCorrection": "The hash structure must store the information needed to construct the final result. Membership alone is insufficient for an index-returning contract.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Derive the stored hash payload directly from the fields required in the returned result.",
      "result": "diagnostic",
      "distractorExplanations": {
        "value_set": "This alternative misses a stated part of the contract: A Set containing only the previously seen values.",
        "index_set": "This alternative misses a stated part of the contract: A Set containing only the indexes already visited.",
        "sorted_values": "This alternative misses a stated part of the contract: A sorted array containing only the values and no original index metadata."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The task must return the original indexes of any two distinct elements whose values sum to the target. Which hash state is most appropriate for a one-pass solution?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "value_to_index_map",
        "feedback": "A Set can prove that a complement was seen, but it cannot identify where it occurred. A value-to-index Map preserves the metadata required by the output contract.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-005-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "value_to_index_map",
            "text": "A Map from each previously seen value to one of its original indexes."
          },
          {
            "id": "value_set",
            "text": "A Set containing only the previously seen values."
          },
          {
            "id": "index_set",
            "text": "A Set containing only the indexes already visited."
          },
          {
            "id": "sorted_values",
            "text": "A sorted array containing only the values and no original index metadata."
          }
        ],
        "prompt": "The task must return the original indexes of any two distinct elements whose values sum to the target. Which hash state is most appropriate for a one-pass solution?",
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
    "title": "Hash map versus sorting: complement 005",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The search succeeds at the value level but cannot satisfy the requested output.",
      "mentalModelCorrection": "Sorting preserves values and multiplicity, but not the meaning of their current array positions relative to the original input.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "When indexes are required, sort records such as { value, originalIndex } rather than sorting raw values.",
      "result": "diagnostic",
      "distractorExplanations": {
        "target_value": "This alternative misses a stated part of the contract: Sorting changes the target into a different number.",
        "value_multiplicity": "This alternative misses a stated part of the contract: Sorting automatically removes all duplicate values.",
        "pair_existence": "This alternative misses a stated part of the contract: A sorted array can no longer be used to determine whether a pair exists."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A solution sorts the raw numeric array and then uses two pointers. It finds two values that sum to the target, but the task requires their original indexes. What information has the solution lost?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "index_identity",
        "feedback": "Sorting raw values changes their positions. Without carrying each value's original index, the solution cannot reconstruct the required index pair.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-006-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "index_identity",
            "text": "It has lost the association between each value and its position in the original array."
          },
          {
            "id": "target_value",
            "text": "Sorting changes the target into a different number."
          },
          {
            "id": "value_multiplicity",
            "text": "Sorting automatically removes all duplicate values."
          },
          {
            "id": "pair_existence",
            "text": "A sorted array can no longer be used to determine whether a pair exists."
          }
        ],
        "prompt": "A solution sorts the raw numeric array and then uses two pointers. It finds two values that sum to the target, but the task requires their original indexes. What information has the solution lost?",
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
    "title": "Hash map versus sorting: complement 006",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The strategy needs both sorted values for pointer movement and original indexes for the output.",
      "mentalModelCorrection": "Transformation is safe only when every piece of information required by the contract survives the transformation.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Represent each sortable item as a record whenever the result depends on pre-transformation identity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_values": "This alternative misses a stated part of the contract: Sort the original numeric array and treat the sorted positions as original indexes.",
        "sort_indexes": "This alternative misses a stated part of the contract: Sort the indexes numerically without considering their associated values.",
        "deduplicate_then_sort": "This alternative misses a stated part of the contract: Remove duplicate values and then sort the remaining values."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-007",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which preprocessing step allows a sorting-plus-two-pointers solution to return original indexes correctly?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "sort_pairs",
        "feedback": "Sorting value-index records gives two pointers the value ordering they require while retaining the metadata needed to return original positions.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-007-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "sort_pairs",
            "text": "Create { value, originalIndex } records and sort those records by value."
          },
          {
            "id": "sort_values",
            "text": "Sort the original numeric array and treat the sorted positions as original indexes."
          },
          {
            "id": "sort_indexes",
            "text": "Sort the indexes numerically without considering their associated values."
          },
          {
            "id": "deduplicate_then_sort",
            "text": "Remove duplicate values and then sort the remaining values."
          }
        ],
        "prompt": "Which preprocessing step allows a sorting-plus-two-pointers solution to return original indexes correctly?",
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
    "title": "Hash map versus sorting: complement 007",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The pointer rule depends on interpreting a sum as too small or too large.",
      "mentalModelCorrection": "Pointer movement is justified by an ordering invariant, not by the existence of two pointer variables.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Before applying two pointers, state what ordering property makes each pointer movement safe.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hashing_required": "This alternative misses a stated part of the contract: Two-pointer algorithms are valid only when a hash table has already been built.",
        "duplicates_forbidden": "This alternative misses a stated part of the contract: Two pointers cannot process arrays containing duplicate values.",
        "indexes_unavailable": "This alternative misses a stated part of the contract: Two pointers can never return array indexes."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Why is the standard left/right two-pointer pair-sum procedure not generally correct on an unsorted array?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "no_monotonic_direction",
        "feedback": "After sorting, increasing the left pointer cannot decrease its value and decreasing the right pointer cannot increase its value. That ordering makes directional elimination valid. An unsorted array provides no such guarantee.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-008-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "no_monotonic_direction",
            "text": "Without sorted values, the current sum does not tell us which pointer movement can safely discard candidates."
          },
          {
            "id": "hashing_required",
            "text": "Two-pointer algorithms are valid only when a hash table has already been built."
          },
          {
            "id": "duplicates_forbidden",
            "text": "Two pointers cannot process arrays containing duplicate values."
          },
          {
            "id": "indexes_unavailable",
            "text": "Two pointers can never return array indexes."
          }
        ],
        "prompt": "Why is the standard left/right two-pointer pair-sum procedure not generally correct on an unsorted array?",
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
    "title": "Hash map versus sorting: complement 008",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The hash solution returns according to scan and discovery order.",
      "mentalModelCorrection": "A one-pass complement lookup does not wait to inspect every possible pair. It returns when the current item completes a pair with prior state.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Trace the contents of the Map before each lookup rather than listing all mathematically valid pairs first.",
      "result": "diagnostic",
      "distractorExplanations": {
        "two_three": "This alternative misses a stated part of the contract: [2, 3], because 6 + 3 also equals 9.",
        "zero_three": "This alternative misses a stated part of the contract: [0, 3], because the first and last values are checked before adjacent values.",
        "no_pair": "This alternative misses a stated part of the contract: No pair, because the array has not been sorted."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-009",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A one-pass Map solution processes:\n\nnums = [8, 1, 6, 3]\ntarget = 9\n\nFor each index i, it first checks whether target - nums[i] is in the Map and then stores nums[i] -> i.\n\nWhich index pair is returned first?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "zero_one",
        "feedback": "Index 0 stores 8. At index 1, the current value is 1 and its complement 8 is already mapped to index 0, so the algorithm returns [0, 1] immediately.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-009-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "zero_one",
            "text": "[0, 1], because the value 1 finds the previously stored complement 8."
          },
          {
            "id": "two_three",
            "text": "[2, 3], because 6 + 3 also equals 9."
          },
          {
            "id": "zero_three",
            "text": "[0, 3], because the first and last values are checked before adjacent values."
          },
          {
            "id": "no_pair",
            "text": "No pair, because the array has not been sorted."
          }
        ],
        "prompt": "A one-pass Map solution processes:\n\nnums = [8, 1, 6, 3]\ntarget = 9\n\nFor each index i, it first checks whether target - nums[i] is in the Map and then stores nums[i] -> i.\n\nWhich index pair is returned first?",
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
    "title": "Hash map versus sorting: complement 009",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Equal values are valid when they come from two distinct records representing two distinct input positions.",
      "mentalModelCorrection": "Sorting rearranges records but does not merge duplicate occurrences. Each record retains its own identity.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Distinguish the pointer positions in the sorted record array from the original indexes stored inside those records.",
      "result": "diagnostic",
      "distractorExplanations": {
        "zero_one": "This alternative misses a stated part of the contract: [0, 1]",
        "zero_three": "This alternative misses a stated part of the contract: [0, 3]",
        "none": "This alternative misses a stated part of the contract: No pair, because duplicate values cannot be used by two pointers."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-010",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The input is:\n\nnums = [7, 2, 5, 2]\ntarget = 4\n\nA solution creates and sorts these records by value:\n\n[\n  { value: 2, originalIndex: 1 },\n  { value: 2, originalIndex: 3 },\n  { value: 5, originalIndex: 2 },\n  { value: 7, originalIndex: 0 }\n]\n\nWhich original index pair does the two-pointer search return?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "one_three",
        "feedback": "The two distinct sorted records containing value 2 sum to 4. Their preserved original indexes are 1 and 3.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-010-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "one_three",
            "text": "[1, 3]"
          },
          {
            "id": "zero_one",
            "text": "[0, 1]"
          },
          {
            "id": "zero_three",
            "text": "[0, 3]"
          },
          {
            "id": "none",
            "text": "No pair, because duplicate values cannot be used by two pointers."
          }
        ],
        "prompt": "The input is:\n\nnums = [7, 2, 5, 2]\ntarget = 4\n\nA solution creates and sorts these records by value:\n\n[\n  { value: 2, originalIndex: 1 },\n  { value: 2, originalIndex: 3 },\n  { value: 5, originalIndex: 2 },\n  { value: 7, originalIndex: 0 }\n]\n\nWhich original index pair does the two-pointer search return?",
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
    "title": "Hash map versus sorting: complement 010",
    "trackId": "algorithms",
    "type": "single_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The state was built from the entire array, so scan order no longer proves that a separate earlier occurrence exists.",
      "mentalModelCorrection": "Membership answers whether a value exists. Multiplicity answers whether enough distinct occurrences exist to satisfy the pair contract.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Whenever a pair may contain equal values, check whether the chosen state represents occurrence counts or only membership.",
      "result": "diagnostic",
      "distractorExplanations": {
        "membership_only": "This alternative misses a stated part of the contract: It is enough for the Map to contain y, even when x === y and its count is 1.",
        "both_counts_two": "This alternative misses a stated part of the contract: Both values must always occur at least twice.",
        "different_values_only": "This alternative misses a stated part of the contract: x and y must always be different because equal values would reuse the same element."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-011",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Suppose the entire array has been converted into a frequency Map. For a current value x and complement y = target - x, which rule correctly verifies that two distinct elements exist?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "count_rule",
        "feedback": "Different values require one occurrence of each. Equal values require two occurrences because the pair must use two distinct positions.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-011-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "count_rule",
            "text": "If x !== y, both counts must be at least 1; if x === y, the count of x must be at least 2."
          },
          {
            "id": "membership_only",
            "text": "It is enough for the Map to contain y, even when x === y and its count is 1."
          },
          {
            "id": "both_counts_two",
            "text": "Both values must always occur at least twice."
          },
          {
            "id": "different_values_only",
            "text": "x and y must always be different because equal values would reuse the same element."
          }
        ],
        "prompt": "Suppose the entire array has been converted into a frequency Map. For a current value x and complement y = target - x, which rule correctly verifies that two distinct elements exist?",
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
    "title": "Hash map versus sorting: complement 011",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The current element is already present in state before its complement check, and the state stores no multiplicity.",
      "mentalModelCorrection": "Whole-array membership and one-pass prior-element membership are different contracts, even though both use a Set.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Ask whether the hash state represents all values, only previous values, or values with occurrence counts.",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_loses_sort_order": "This alternative misses a stated part of the contract: The Set is incorrect because it does not store the values in sorted order.",
        "target_requires_map": "This alternative misses a stated part of the contract: The number 8 can be searched only with a Map, not a Set.",
        "loop_skips_four": "This alternative misses a stated part of the contract: The loop skips 4 because Sets remove values from the original array."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-012",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A developer writes:\n\nconst values = new Set(nums);\n\nfor (const value of nums) {\n  if (values.has(target - value)) {\n    return true;\n  }\n}\n\nreturn false;\n\nWhy is this incorrect for nums = [4] and target = 8?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "set_cannot_prove_second_occurrence",
        "feedback": "Because the Set was built from the whole array, finding 4 does not distinguish the current occurrence from another occurrence. A frequency count, index-aware state, or lookup-before-insert scan is needed.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-012-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "set_cannot_prove_second_occurrence",
            "text": "The Set proves that value 4 exists, but it cannot prove that a second occurrence exists at another index."
          },
          {
            "id": "set_loses_sort_order",
            "text": "The Set is incorrect because it does not store the values in sorted order."
          },
          {
            "id": "target_requires_map",
            "text": "The number 8 can be searched only with a Map, not a Set."
          },
          {
            "id": "loop_skips_four",
            "text": "The loop skips 4 because Sets remove values from the original array."
          }
        ],
        "prompt": "A developer writes:\n\nconst values = new Set(nums);\n\nfor (const value of nums) {\n  if (values.has(target - value)) {\n    return true;\n  }\n}\n\nreturn false;\n\nWhy is this incorrect for nums = [4] and target = 8?",
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
    "title": "Hash map versus sorting: complement 012",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The strategies retain different metadata after their state transformations.",
      "mentalModelCorrection": "Algorithmic correctness includes satisfying the output contract, not merely detecting that some numerical pair exists.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Evaluate a strategy by both its search logic and the information available when the result must be constructed.",
      "result": "diagnostic",
      "distractorExplanations": {
        "same_contract": "This alternative misses a stated part of the contract: Both strategies automatically preserve exactly the same output information.",
        "set_only_indexes": "This alternative misses a stated part of the contract: Only raw sorting can return original indexes because sorted positions are the original positions.",
        "map_no_values": "This alternative misses a stated part of the contract: A Map can return indexes but cannot determine the values at those indexes."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which statement correctly compares sorting raw values with a one-pass value-to-index Map?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "raw_sort_values_only",
        "feedback": "Raw sorting retains the values needed for pair search but destroys their original positional identity. A value-to-index Map stores that identity explicitly.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-013-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "raw_sort_values_only",
            "text": "Sorting raw values can support pair existence or returning pair values, but it cannot reliably return original indexes; the Map can preserve original indexes."
          },
          {
            "id": "same_contract",
            "text": "Both strategies automatically preserve exactly the same output information."
          },
          {
            "id": "set_only_indexes",
            "text": "Only raw sorting can return original indexes because sorted positions are the original positions."
          },
          {
            "id": "map_no_values",
            "text": "A Map can return indexes but cannot determine the values at those indexes."
          }
        ],
        "prompt": "Which statement correctly compares sorting raw values with a one-pass value-to-index Map?",
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
    "title": "Hash map versus sorting: complement 013",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The input contains more than one valid pair, and the contract does not specify which pair to prefer.",
      "mentalModelCorrection": "Do not store index metadata when values suffice, and do not expect a Set to recover original indexes it never stored.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "must_return_same": "This alternative misses a stated part of the contract: Both strategies must return the same pair because the target is identical.",
        "hash_invalid": "This alternative misses a stated part of the contract: The Map result is invalid because 3 appears before 2.",
        "two_pointer_invalid": "This alternative misses a stated part of the contract: The two-pointer result is invalid because 1 and 4 were not adjacent in the original array."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-014",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A complement task may return only values or the original indexes. What is the minimal appropriate state?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "different_valid_pairs",
        "feedback": "Do not store index metadata when values suffice, and do not expect a Set to recover original indexes it never stored.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-014-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "different_valid_pairs",
            "text": "A Set of prior values can return [complement, current] values; use Map<value, index> only when original indexes are required."
          },
          {
            "id": "must_return_same",
            "text": "Both strategies must return the same pair because the target is identical."
          },
          {
            "id": "hash_invalid",
            "text": "The Map result is invalid because 3 appears before 2."
          },
          {
            "id": "two_pointer_invalid",
            "text": "The two-pointer result is invalid because 1 and 4 were not adjacent in the original array."
          }
        ],
        "prompt": "A complement task may return only values or the original indexes. What is the minimal appropriate state?",
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
    "title": "Hash map versus sorting: complement 014",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The comparison must include preprocessing, search, and metadata preservation costs.",
      "mentalModelCorrection": "The linear two-pointer phase does not erase the sorting cost that made directional movement legal.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Express complexity as the sum of all required phases rather than describing only the final scan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "both_constant_space": "This alternative misses a stated part of the contract: Both approaches use O(1) extra space because neither stores all possible pairs.",
        "hash_guaranteed_constant": "This alternative misses a stated part of the contract: The Map solution has guaranteed O(1) total time because each lookup is O(1).",
        "sorting_linear": "This alternative misses a stated part of the contract: Sorting plus two pointers is O(n) because the final pointer scan visits each record at most once."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-015",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The task returns original indexes of any valid pair. Which complexity comparison is accurate?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_n_vs_nlogn",
        "feedback": "The hash approach performs expected constant-time operations for each element. The sorting approach must include the O(n log n) preprocessing cost; preserving original indexes generally requires a separate array of records.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-015-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_n_vs_nlogn",
            "text": "A one-pass Map uses expected O(n) time and O(n) space; sorting value-index records uses O(n log n) time, followed by an O(n) two-pointer scan, and requires O(n) record storage."
          },
          {
            "id": "both_constant_space",
            "text": "Both approaches use O(1) extra space because neither stores all possible pairs."
          },
          {
            "id": "hash_guaranteed_constant",
            "text": "The Map solution has guaranteed O(1) total time because each lookup is O(1)."
          },
          {
            "id": "sorting_linear",
            "text": "Sorting plus two pointers is O(n) because the final pointer scan visits each record at most once."
          }
        ],
        "prompt": "The task returns original indexes of any valid pair. Which complexity comparison is accurate?",
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
    "title": "Hash map versus sorting: complement 015",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The sorted representation is a separate structure rather than the original input array.",
      "mentalModelCorrection": "Sorting is not inherently incompatible with original indexes or immutability. The representation being sorted determines what is preserved.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Distinguish sorting the original values from sorting a copied metadata-preserving representation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "only_a_correct": "This alternative misses a stated part of the contract: Only A can return original indexes; sorting any representation always destroys index identity.",
        "only_b_correct": "This alternative misses a stated part of the contract: Only B is correct because complement lookup cannot handle duplicate values.",
        "b_mutates_nums": "This alternative misses a stated part of the contract: B violates the contract because sorting a newly created record array mutates nums."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-016",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "The contract is:\n\n- return any pair of original indexes;\n- do not mutate nums.\n\nSolution A scans nums with a value-to-index Map and checks before insertion.\n\nSolution B creates a new array of { value, originalIndex } records, sorts that new array, and uses two pointers.\n\nWhich assessment is correct?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "both_correct_different_cost",
        "feedback": "A copied array of value-index records preserves both nums and original index metadata. The strategies therefore can satisfy the same broad contract, although their complexity and pair-selection order differ.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-016-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "both_correct_different_cost",
            "text": "Both can satisfy the contract; A has expected O(n) time, while B has O(n log n) time because of sorting."
          },
          {
            "id": "only_a_correct",
            "text": "Only A can return original indexes; sorting any representation always destroys index identity."
          },
          {
            "id": "only_b_correct",
            "text": "Only B is correct because complement lookup cannot handle duplicate values."
          },
          {
            "id": "b_mutates_nums",
            "text": "B violates the contract because sorting a newly created record array mutates nums."
          }
        ],
        "prompt": "The contract is:\n\n- return any pair of original indexes;\n- do not mutate nums.\n\nSolution A scans nums with a value-to-index Map and checks before insertion.\n\nSolution B creates a new array of { value, originalIndex } records, sorts that new array, and uses two pointers.\n\nWhich assessment is correct?",
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
    "title": "Hash map versus sorting: complement 016",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The returned pair may contain the current index twice.",
      "mentalModelCorrection": "The temporal invariant should be: before processing index i, the Map contains only indexes smaller than i.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "State and preserve the Map invariant explicitly: it represents only previously processed elements.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_map": "This alternative misses a stated part of the contract: Sort the Map by key before every complement lookup.",
        "store_target": "This alternative misses a stated part of the contract: Store target as a key before starting the loop.",
        "skip_duplicates": "This alternative misses a stated part of the contract: Skip every value that has appeared before so equal-value pairs cannot be returned."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-017",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Review this implementation:\n\nconst indexByValue = new Map<number, number>();\n\nfor (let i = 0; i < nums.length; i++) {\n  indexByValue.set(nums[i], i);\n\n  const complementIndex = indexByValue.get(target - nums[i]);\n\n  if (complementIndex !== undefined) {\n    return [complementIndex, i];\n  }\n}\n\nreturn null;\n\nWhich change is required?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "lookup_then_insert",
        "feedback": "Inserting the current value first allows complementIndex to equal i when nums[i] equals its own complement. Looking up first restricts the Map to earlier, distinct indexes.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-017-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "lookup_then_insert",
            "text": "Look up the complement before inserting nums[i], and insert nums[i] only if no pair was returned."
          },
          {
            "id": "sort_map",
            "text": "Sort the Map by key before every complement lookup."
          },
          {
            "id": "store_target",
            "text": "Store target as a key before starting the loop."
          },
          {
            "id": "skip_duplicates",
            "text": "Skip every value that has appeared before so equal-value pairs cannot be returned."
          }
        ],
        "prompt": "Review this implementation:\n\nconst indexByValue = new Map<number, number>();\n\nfor (let i = 0; i < nums.length; i++) {\n  indexByValue.set(nums[i], i);\n\n  const complementIndex = indexByValue.get(target - nums[i]);\n\n  if (complementIndex !== undefined) {\n    return [complementIndex, i];\n  }\n}\n\nreturn null;\n\nWhich change is required?",
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
    "title": "Hash map versus sorting: complement 017",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The comparison concerns not only whether a pair can be found, but also what information survives and what result the caller expects.",
      "mentalModelCorrection": "Algorithm choice is a combination of correctness preconditions, output contract, state representation, and complexity—not merely choosing between O(n) and O(n log n).",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Before implementing either strategy, write down the required result, tie-breaking rule, mutation constraints, and metadata that must be preserved.",
      "result": "diagnostic",
      "distractorExplanations": {
        "always_same_semantics": "This alternative misses a stated part of the contract: They are interchangeable implementations that always preserve the same data and return the same pair.",
        "hash_existence_only": "This alternative misses a stated part of the contract: Hash lookup can determine only existence, while two pointers are required whenever a result must be returned.",
        "sorting_indexes_automatic": "This alternative misses a stated part of the contract: Sorting raw values automatically preserves original indexes and gives the same index contract as a value-to-index Map."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complement-018",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which design statement most accurately describes the relationship between hash-based complement lookup and sorting plus two pointers?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "contract_depends_on_state",
        "feedback": "The broad pair-sum goal can be solved by either strategy, but the exact implementation must preserve the required output data. The strategies have different preprocessing costs, mutation risks, traversal orders, and default result semantics.",
        "id": "alg-contrast-hash-map-vs-sorting-complement-018-check",
        "mistakeTypes": [
          "wrong_approach",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "contract_depends_on_state",
            "text": "Both can solve pair existence and can return values or original indexes when their state preserves the required metadata, but they may differ in complexity, input mutation, and which valid pair is returned."
          },
          {
            "id": "always_same_semantics",
            "text": "They are interchangeable implementations that always preserve the same data and return the same pair."
          },
          {
            "id": "hash_existence_only",
            "text": "Hash lookup can determine only existence, while two pointers are required whenever a result must be returned."
          },
          {
            "id": "sorting_indexes_automatic",
            "text": "Sorting raw values automatically preserves original indexes and gives the same index contract as a value-to-index Map."
          }
        ],
        "prompt": "Which design statement most accurately describes the relationship between hash-based complement lookup and sorting plus two pointers?",
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
    "title": "Hash map versus sorting: complement 018",
    "trackId": "algorithms",
    "type": "single_choice"
  }
];
