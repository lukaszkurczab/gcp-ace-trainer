import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const outputOrderAndOccurrenceContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-keyed-output-order-contract-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_lookup_from_output_order",
    "secondarySkillAtomIds": [
      "analyze_output_order_contract",
      "avoid_unjustified_order_assumptions"
    ],
    "type": "single_choice",
    "prompt": "A Map provides fast lookup by key. What must be checked separately before using its entries as the final output?",
    "options": [
      {
        "id": "required_output_order",
        "text": "Whether the Map's iteration order matches the output order required by the problem.",
        "isCorrect": true
      },
      {
        "id": "key_lookup_implies_sorted",
        "text": "Nothing; keyed lookup automatically produces keys in sorted order.",
        "isCorrect": false
      },
      {
        "id": "map_has_no_iteration",
        "text": "Whether Map supports iteration at all.",
        "isCorrect": false
      },
      {
        "id": "values_must_be_boolean",
        "text": "Whether every associated value is a boolean.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Efficient access and required presentation order are separate concerns.",
      "mentalModelCorrection": "A keyed collection can retrieve state by key without arranging results according to a requested ordering contract.",
      "mistakeTypes": [
        "keyed_lookup_assumed_to_satisfy_output_order"
      ],
      "nextAction": "State the required output order explicitly before choosing how to materialize results.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-keyed-output-order-contract-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_map_insertion_order",
    "secondarySkillAtomIds": [
      "reason_about_javascript_map_iteration",
      "distinguish_insertion_order_from_sorted_order"
    ],
    "type": "edge_case_drill",
    "prompt": "In JavaScript, what key order is produced by:\n\nconst counts = new Map<number, number>();\n\ncounts.set(8, 1);\ncounts.set(2, 1);\ncounts.set(5, 1);\n\nconst keys = [...counts.keys()];",
    "options": [
      {
        "id": "eight_two_five",
        "text": "[8, 2, 5], because Map iterates distinct keys in insertion order.",
        "isCorrect": true
      },
      {
        "id": "two_five_eight",
        "text": "[2, 5, 8], because numeric Map keys are automatically sorted.",
        "isCorrect": false
      },
      {
        "id": "five_two_eight",
        "text": "[5, 2, 8], because Map iterates in reverse insertion order.",
        "isCorrect": false
      },
      {
        "id": "unspecified",
        "text": "The order is unspecified and may change on every iteration.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "JavaScript Map preserves insertion order for iteration.",
      "mentalModelCorrection": "Insertion order is deterministic, but it is not the same as ascending key order.",
      "mistakeTypes": [
        "map_insertion_order_confused_with_sorted_order"
      ],
      "nextAction": "Sort the materialized keys explicitly when the output contract requires numeric order.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-keyed-output-order-contract-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_set_insertion_order",
    "secondarySkillAtomIds": [
      "preserve_first_encounter_order",
      "reason_about_javascript_set_iteration"
    ],
    "type": "edge_case_drill",
    "prompt": "What does this JavaScript expression produce?\n\n[...new Set([4, 2, 4, 3, 2])]",
    "options": [
      {
        "id": "four_two_three",
        "text": "[4, 2, 3], preserving the first encounter order of each distinct value.",
        "isCorrect": true
      },
      {
        "id": "two_three_four",
        "text": "[2, 3, 4], because Set sorts distinct values.",
        "isCorrect": false
      },
      {
        "id": "four_two_four_three_two",
        "text": "[4, 2, 4, 3, 2], because Set preserves duplicate occurrences.",
        "isCorrect": false
      },
      {
        "id": "three_two_four",
        "text": "[3, 2, 4], because Set preserves last encounter order.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The first insertion establishes a distinct value's iteration position; repeated additions do not create new entries.",
      "mentalModelCorrection": "Set deduplication naturally preserves first distinct encounter order, not sorted order or every occurrence.",
      "mistakeTypes": [
        "set_iteration_order_misinterpreted"
      ],
      "nextAction": "Track only the first insertion of each distinct key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-keyed-output-order-contract-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_first_occurrence_index",
    "secondarySkillAtomIds": [
      "choose_duplicate_index_policy",
      "align_state_with_first_occurrence_output"
    ],
    "type": "solution_comparison",
    "prompt": "A function must return the first index at which each distinct value appears.\n\nWhich update policy matches the contract?",
    "options": [
      {
        "id": "insert_only_when_missing",
        "text": "Store the index only when the value is not already in the Map.",
        "isCorrect": true
      },
      {
        "id": "overwrite_every_time",
        "text": "Overwrite the stored index every time the value is encountered.",
        "isCorrect": false
      },
      {
        "id": "store_set_membership_only",
        "text": "Use only a Set because membership reveals the first index.",
        "isCorrect": false
      },
      {
        "id": "sort_values_first",
        "text": "Sort the values first and use their positions in the sorted array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Later occurrences must not replace the earliest source position.",
      "mentalModelCorrection": "Duplicate-update policy determines whether a Map represents first occurrence, last occurrence, or another selected occurrence.",
      "mistakeTypes": [
        "first_occurrence_overwritten"
      ],
      "nextAction": "Define whether an existing key should be preserved or replaced before writing the update.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-keyed-output-order-contract-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_last_occurrence_index",
    "secondarySkillAtomIds": [
      "choose_duplicate_index_policy",
      "align_state_with_last_occurrence_output"
    ],
    "type": "single_choice",
    "prompt": "A function must return the last index at which each distinct value appears.\n\nWhich Map update is appropriate while scanning left to right?",
    "options": [
      {
        "id": "overwrite_with_current_index",
        "text": "Set value → currentIndex on every occurrence.",
        "isCorrect": true
      },
      {
        "id": "insert_only_first",
        "text": "Insert the key only when it is currently missing.",
        "isCorrect": false
      },
      {
        "id": "store_boolean",
        "text": "Store value → true because last position can be inferred from membership.",
        "isCorrect": false
      },
      {
        "id": "delete_on_duplicate",
        "text": "Delete the key whenever another occurrence is found.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each later observation is a newer candidate for the required last position.",
      "mentalModelCorrection": "Overwriting is correct when the stored meaning is explicitly the most recent index.",
      "mistakeTypes": [
        "last_occurrence_not_updated"
      ],
      "nextAction": "Maintain the invariant that each stored index equals the latest processed occurrence.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-keyed-output-order-contract-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_occurrence_value_from_iteration_position",
    "secondarySkillAtomIds": [
      "understand_map_existing_key_order",
      "reason_about_duplicate_overwrite"
    ],
    "type": "edge_case_drill",
    "prompt": "What key order and stored indexes result from:\n\nconst lastIndex = new Map<string, number>();\n\n[\"b\", \"a\", \"b\"].forEach((value, index) => {\n  lastIndex.set(value, index);\n});",
    "options": [
      {
        "id": "b_then_a_indexes_two_one",
        "text": "Keys iterate as [\"b\", \"a\"], with b → 2 and a → 1.",
        "isCorrect": true
      },
      {
        "id": "a_then_b_indexes_one_two",
        "text": "Keys iterate as [\"a\", \"b\"], because updating b moves it to the end.",
        "isCorrect": false
      },
      {
        "id": "b_a_b_three_entries",
        "text": "Keys iterate as [\"b\", \"a\", \"b\"], preserving every occurrence.",
        "isCorrect": false
      },
      {
        "id": "alphabetical",
        "text": "Keys iterate alphabetically, with a before b.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Updating an existing Map key changes its associated value but does not change its original insertion position.",
      "mentalModelCorrection": "A Map can simultaneously preserve first key-insertion order and store the latest metadata for that key.",
      "mistakeTypes": [
        "map_overwrite_assumed_to_reorder_key"
      ],
      "nextAction": "Track key order and associated values as separate dimensions of Map state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-keyed-output-order-contract-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_delete_and_reinsert_order",
    "secondarySkillAtomIds": [
      "reason_about_javascript_map_iteration",
      "distinguish_update_from_reinsertion"
    ],
    "type": "edge_case_drill",
    "prompt": "What key order results from:\n\nconst state = new Map<string, number>();\n\nstate.set(\"a\", 1);\nstate.set(\"b\", 2);\nstate.delete(\"a\");\nstate.set(\"a\", 3);\n\nconst keys = [...state.keys()];",
    "options": [
      {
        "id": "b_then_a",
        "text": "[\"b\", \"a\"], because deleting and re-adding a creates a new insertion position.",
        "isCorrect": true
      },
      {
        "id": "a_then_b",
        "text": "[\"a\", \"b\"], because a permanently retains its first historical position.",
        "isCorrect": false
      },
      {
        "id": "a_b_a",
        "text": "[\"a\", \"b\", \"a\"], because Map keeps deleted entries in iteration.",
        "isCorrect": false
      },
      {
        "id": "b_only",
        "text": "[\"b\"], because a deleted key can never be added again.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Deletion removes the key and its existing position from the Map.",
      "mentalModelCorrection": "Updating an existing key preserves order, but deleting and later re-adding it places it at the end.",
      "mistakeTypes": [
        "map_reinsertion_order_mismatch"
      ],
      "nextAction": "Distinguish set-on-existing-key from delete-followed-by-new-insertion.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-keyed-output-order-contract-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "produce_sorted_key_output",
    "secondarySkillAtomIds": [
      "separate_storage_from_presentation_order",
      "materialize_and_sort_keys"
    ],
    "type": "solution_comparison",
    "prompt": "A frequency Map is populated in encounter order, but the required output is an array of [value, count] pairs sorted by ascending numeric value.\n\nWhich design is correct?",
    "options": [
      {
        "id": "materialize_then_sort",
        "text": "Build the Map for lookup and counting, then materialize its entries and sort them by numeric key before returning.",
        "isCorrect": true
      },
      {
        "id": "return_map_entries_directly",
        "text": "Return [...counts.entries()] directly because Map automatically sorts numeric keys.",
        "isCorrect": false
      },
      {
        "id": "sort_counts_only",
        "text": "Sort only the count values, leaving their keys in encounter order.",
        "isCorrect": false
      },
      {
        "id": "use_set",
        "text": "Replace the Map with a Set because Set iteration is numerically sorted.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The required order is key-based rather than encounter-based.",
      "mentalModelCorrection": "The internal representation may optimize updates while a separate materialization step enforces presentation order.",
      "mistakeTypes": [
        "map_iteration_used_for_sorted_output"
      ],
      "nextAction": "Apply an explicit comparator to the final entries when sorted output is required.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-keyed-output-order-contract-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_distinct_encounter_order",
    "secondarySkillAtomIds": [
      "choose_set_for_first_encounter_order",
      "avoid_unnecessary_sorting"
    ],
    "type": "output_contract_analysis",
    "prompt": "A function must return each distinct value once, ordered by its first appearance in the input. Which representation naturally supports that contract?",
    "options": [
      {
        "id": "set_in_scan_order",
        "text": "Insert values into a Set while scanning left to right, then iterate the Set.",
        "isCorrect": true
      },
      {
        "id": "sort_distinct_values",
        "text": "Insert values into a Set and sort them numerically before returning.",
        "isCorrect": false
      },
      {
        "id": "last_index_map_sorted_by_index_desc",
        "text": "Store only last indexes and return keys in descending last-index order.",
        "isCorrect": false
      },
      {
        "id": "frequency_map_sorted_by_count",
        "text": "Sort keys by frequency because frequency determines first encounter order.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "First distinct insertion order and the required output order are the same.",
      "mentalModelCorrection": "Insertion-order iteration is useful when the contract explicitly asks for encounter order, but not for unrelated orderings.",
      "mistakeTypes": [
        "encounter_order_contract_not_recognized"
      ],
      "nextAction": "Match the collection's iteration semantics to the exact requested order.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-keyed-output-order-contract-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "order_output_by_original_index",
    "secondarySkillAtomIds": [
      "retain_original_positions",
      "sort_results_by_occurrence_metadata"
    ],
    "type": "solution_comparison",
    "prompt": "A Map groups records by category. The output must list categories according to the earliest original index of any record in each category.\n\nWhich approach satisfies the contract?",
    "options": [
      {
        "id": "store_first_index_then_sort",
        "text": "Store each category's first original index, then sort the categories by that stored index before returning them.",
        "isCorrect": true
      },
      {
        "id": "sort_category_names",
        "text": "Sort categories alphabetically because keyed lookup already preserves original indexes.",
        "isCorrect": false
      },
      {
        "id": "use_last_index",
        "text": "Store only each category's last index and rely on Map iteration for earliest-order output.",
        "isCorrect": false
      },
      {
        "id": "return_bucket_object",
        "text": "Return the Map directly because any Map iteration order represents earliest occurrence.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The ordering field is original-position metadata, not the key itself.",
      "mentalModelCorrection": "When output order depends on associated metadata, preserve that metadata and order results explicitly by it.",
      "mistakeTypes": [
        "original_index_order_not_materialized"
      ],
      "nextAction": "Store the position that defines output precedence and use it as the final sort key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-keyed-output-order-contract-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "enforce_deterministic_group_output",
    "secondarySkillAtomIds": [
      "distinguish_group_membership_from_group_order",
      "define_tie_breaker"
    ],
    "type": "mistake_review",
    "prompt": "A specification requires groups to be returned by descending size, with alphabetical key order used when two groups have equal size.\n\nThe implementation returns [...groups.entries()] without sorting.\n\nWhat is missing?",
    "options": [
      {
        "id": "explicit_primary_and_tie_sort",
        "text": "An explicit sort by descending bucket size and then ascending key as the tie-breaker.",
        "isCorrect": true
      },
      {
        "id": "map_already_sorts_by_size",
        "text": "Nothing; Map automatically orders entries by associated array length.",
        "isCorrect": false
      },
      {
        "id": "insertion_order_is_size_order",
        "text": "Nothing, provided larger groups happened to receive their first item earlier.",
        "isCorrect": false
      },
      {
        "id": "set_conversion",
        "text": "The entries should be converted to a Set, which applies both required ordering rules.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The requested order depends on computed bucket metadata and an explicit tie-breaking rule.",
      "mentalModelCorrection": "Deterministic insertion order does not imply conformance to an arbitrary deterministic output specification.",
      "mistakeTypes": [
        "deterministic_iteration_confused_with_required_order"
      ],
      "nextAction": "Encode both the primary comparator and every required tie-breaker.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-keyed-output-order-contract-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "select_state_from_occurrence_and_order_contract",
    "secondarySkillAtomIds": [
      "distinguish_first_and_last_occurrence",
      "separate_lookup_state_from_output_order"
    ],
    "type": "output_contract_analysis",
    "prompt": "A function must return one record per distinct value:\n\n- include its first original index,\n- include its last original index,\n- and order records by ascending first index.\n\nWhich design best matches the contract?",
    "options": [
      {
        "id": "map_first_last_then_sort",
        "text": "Map each value to { firstIndex, lastIndex }, preserve firstIndex after insertion, update lastIndex on repeats, then sort records by firstIndex.",
        "isCorrect": true
      },
      {
        "id": "set_only",
        "text": "Use a Set of values because membership contains both occurrence indexes.",
        "isCorrect": false
      },
      {
        "id": "map_last_only_iteration",
        "text": "Store only the last index and return Map entries in insertion order.",
        "isCorrect": false
      },
      {
        "id": "sort_input_first",
        "text": "Sort the input values first, then use sorted positions as the original first and last indexes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each key requires two occurrence fields, and the final ordering depends on one of those fields.",
      "mentalModelCorrection": "The Map stores lookup metadata; a separate ordering step enforces the returned sequence contract.",
      "mistakeTypes": [
        "state_and_output_order_contract_under_modeled"
      ],
      "nextAction": "List the metadata needed per key and the field that determines final result order.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
