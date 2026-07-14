import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeHashStateSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_membership_lookup_signal",
    "secondarySkillAtomIds": [
      "recognize_seen_before_state",
      "choose_keyed_state_for_repeated_membership"
    ],
    "type": "strategy_choice",
    "prompt": "While scanning an unsorted array, the algorithm must repeatedly answer: \"Has this value appeared earlier?\" Which strategy signal is strongest?",
    "options": [
      {
        "id": "seen_set",
        "text": "Maintain keyed seen-before state, such as a Set of values from the processed prefix.",
        "isCorrect": true
      },
      {
        "id": "scalar_count",
        "text": "Maintain one scalar containing the number of processed elements.",
        "isCorrect": false
      },
      {
        "id": "running_sum",
        "text": "Maintain the sum of all processed values.",
        "isCorrect": false
      },
      {
        "id": "two_endpoints",
        "text": "Compare only the first and last processed values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The query is repeated and is addressed by the current value as a key.",
      "mentalModelCorrection": "Keyed state is justified when future decisions repeatedly ask for information associated with a particular value.",
      "mistakeTypes": [
        "membership_signal_not_recognized"
      ],
      "nextAction": "Complete the question the algorithm asks in the form: \"What state is stored for this key?\"",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_deduplication_hash_signal",
    "secondarySkillAtomIds": [
      "recognize_presence_only_state",
      "preserve_first_encounter_order"
    ],
    "type": "strategy_choice",
    "prompt": "A function must emit only the first occurrence of each value while preserving encounter order. Which state best supports the decision for each observation?",
    "options": [
      {
        "id": "set_of_emitted_values",
        "text": "A Set of values already emitted.",
        "isCorrect": true
      },
      {
        "id": "global_duplicate_flag",
        "text": "One boolean indicating whether any duplicate has appeared.",
        "isCorrect": false
      },
      {
        "id": "running_minimum",
        "text": "One scalar containing the smallest value seen.",
        "isCorrect": false
      },
      {
        "id": "opposite_end_pair",
        "text": "Two endpoint indexes compared as an independent pair.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each observation needs a membership answer for its own value.",
      "mentalModelCorrection": "Stable deduplication requires per-value seen state; one global scalar cannot distinguish which values were emitted.",
      "mistakeTypes": [
        "deduplication_keyed_state_missed"
      ],
      "nextAction": "Identify the exact value whose prior presence determines whether the current item is retained.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_repeated_key_lookup_signal",
    "secondarySkillAtomIds": [
      "associate_metadata_with_key",
      "choose_map_for_repeated_lookup"
    ],
    "type": "single_choice",
    "prompt": "A stream of updates repeatedly refers to users by userId and must retrieve the current state for that specific user. Which representation is the natural starting point?",
    "options": [
      {
        "id": "map_by_user_id",
        "text": "A Map keyed by userId with the user's current state as the associated value.",
        "isCorrect": true
      },
      {
        "id": "single_current_user",
        "text": "One variable containing the state of the most recently updated user.",
        "isCorrect": false
      },
      {
        "id": "running_update_count",
        "text": "One scalar counting all updates across every user.",
        "isCorrect": false
      },
      {
        "id": "sorted_update_history_only",
        "text": "A list sorted by update time without any state indexed by userId.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The algorithm repeatedly retrieves and modifies state addressed by a stable identity.",
      "mentalModelCorrection": "When updates name a key directly, keyed state avoids treating unrelated entities as one aggregate.",
      "mistakeTypes": [
        "repeated_identity_lookup_signal_missed"
      ],
      "nextAction": "Identify the field used to address the state that must be retrieved repeatedly.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_complement_lookup_signal",
    "secondarySkillAtomIds": [
      "translate_pair_condition_to_lookup",
      "recognize_prior_candidate_state"
    ],
    "type": "strategy_choice",
    "prompt": "While scanning values, a pair condition can be rewritten as: \"For the current value, has the required partner value appeared earlier?\" Which strategy signal is present?",
    "options": [
      {
        "id": "keyed_complement_lookup",
        "text": "Maintain prior candidates keyed by value and look up the required complement.",
        "isCorrect": true
      },
      {
        "id": "contiguous_window",
        "text": "Maintain every element between two boundaries as one contiguous window.",
        "isCorrect": false
      },
      {
        "id": "scalar_accumulation",
        "text": "Maintain only the sum of all values processed so far.",
        "isCorrect": false
      },
      {
        "id": "read_write_compaction",
        "text": "Use one pointer to read and another to overwrite rejected values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The current item determines one specific partner key that can be queried directly.",
      "mentalModelCorrection": "Complement lookup is keyed candidate retrieval, not a property of the complete interval between two positions.",
      "mistakeTypes": [
        "complement_lookup_signal_not_recognized"
      ],
      "nextAction": "Rewrite the relationship to isolate the prior value required by the current observation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_grouping_by_key_signal",
    "secondarySkillAtomIds": [
      "associate_items_with_equivalence_class",
      "choose_map_buckets"
    ],
    "type": "strategy_choice",
    "prompt": "Items must be divided into groups so that all items with the same category identifier appear in the same bucket. Which strategy fits?",
    "options": [
      {
        "id": "map_category_to_bucket",
        "text": "Use a Map from category identifier to the bucket of items assigned to that category.",
        "isCorrect": true
      },
      {
        "id": "set_of_categories_only",
        "text": "Use only a Set of category identifiers, even though the group members must be returned.",
        "isCorrect": false
      },
      {
        "id": "single_output_bucket",
        "text": "Append every item to one global array without retaining category associations.",
        "isCorrect": false
      },
      {
        "id": "endpoint_comparison",
        "text": "Compare only the first and last items to determine all groups.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Every item belongs to a bucket addressed by an equivalence key.",
      "mentalModelCorrection": "Grouping requires keyed association between each class identifier and the state accumulated for that class.",
      "mistakeTypes": [
        "grouping_hash_signal_missed"
      ],
      "nextAction": "Identify the value that names an equivalence class and the information accumulated under it.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_cross_collection_membership_signal",
    "secondarySkillAtomIds": [
      "choose_set_for_reference_collection",
      "recognize_repeated_membership_queries"
    ],
    "type": "solution_comparison",
    "prompt": "One collection contains allowed codes. A second, much longer collection must be filtered by repeatedly asking whether each code is allowed. Which high-level design is appropriate?",
    "options": [
      {
        "id": "set_allowed_codes",
        "text": "Store the allowed codes in a Set and query membership for each item in the second collection.",
        "isCorrect": true
      },
      {
        "id": "one_allowed_boolean",
        "text": "Store one boolean indicating whether the allowed collection is non-empty.",
        "isCorrect": false
      },
      {
        "id": "running_sum_codes",
        "text": "Add all allowed codes into one scalar and compare each item with that sum.",
        "isCorrect": false
      },
      {
        "id": "window_over_both_collections",
        "text": "Treat the two collections as boundaries of one sliding window.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Many observations query membership against the same reusable reference collection.",
      "mentalModelCorrection": "Repeated lookup by value is the hash-state signal; the two collections do not form one contiguous candidate range.",
      "mistakeTypes": [
        "cross_collection_membership_signal_missed"
      ],
      "nextAction": "Precompute the state that answers the repeated per-item query.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-hash-state-signal-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_reference_identity_set_signal",
    "secondarySkillAtomIds": [
      "track_visited_object_instances",
      "understand_identity_based_membership"
    ],
    "type": "strategy_choice",
    "prompt": "A traversal must avoid processing the same object instance twice. Different objects with identical properties must still be treated as separate instances. Which state matches the contract in JavaScript?",
    "options": [
      {
        "id": "set_of_object_references",
        "text": "A Set of the object references already processed.",
        "isCorrect": true
      },
      {
        "id": "set_of_stringified_objects",
        "text": "A Set of serialized property values that intentionally merges equal-looking objects.",
        "isCorrect": false
      },
      {
        "id": "single_processed_count",
        "text": "One scalar containing how many objects have been processed.",
        "isCorrect": false
      },
      {
        "id": "sort_objects",
        "text": "Sort the objects and assume adjacent objects share reference identity.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Membership is defined by JavaScript object identity rather than structural equality.",
      "mentalModelCorrection": "Set can directly track object references when the contract concerns whether the exact same instance was seen.",
      "mistakeTypes": [
        "identity_membership_signal_missed"
      ],
      "nextAction": "Determine whether equality means the same reference or merely equal contents.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_hash_state_for_scalar_accumulation",
    "secondarySkillAtomIds": [
      "recognize_scalar_state_signal",
      "avoid_unnecessary_keyed_state"
    ],
    "type": "mistake_review",
    "prompt": "A function only needs the total sum of all numeric values. A candidate proposes storing every value in a Map before calculating the sum. What is the best review?",
    "options": [
      {
        "id": "scalar_is_sufficient",
        "text": "Keyed state is not justified; one running total represents all information required by the output.",
        "isCorrect": true
      },
      {
        "id": "map_required_for_numbers",
        "text": "A Map is required because numeric values cannot be accumulated directly.",
        "isCorrect": false
      },
      {
        "id": "set_required",
        "text": "A Set is required so duplicate values do not contribute more than once.",
        "isCorrect": false
      },
      {
        "id": "group_by_value",
        "text": "Every sum problem should first group equal values into buckets.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The required state is one aggregate over all observations, not information retrieved by individual key.",
      "mentalModelCorrection": "Hash state is unnecessary when one scalar can fully summarize the processed input for the required result.",
      "mistakeTypes": [
        "hash_state_used_for_scalar_problem"
      ],
      "nextAction": "Ask whether future decisions retrieve state for a specific key or only update one global aggregate.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_bounded_domain_indexing_alternative",
    "secondarySkillAtomIds": [
      "choose_direct_indexed_state",
      "distinguish_hashing_from_bounded_domain_lookup"
    ],
    "type": "solution_comparison",
    "prompt": "An algorithm tracks which lowercase English letters have appeared. The domain is permanently limited to the 26 letters a–z. Which representation is a reasonable alternative to hash state?",
    "options": [
      {
        "id": "fixed_boolean_array",
        "text": "A fixed-size boolean array indexed by letter position.",
        "isCorrect": true
      },
      {
        "id": "nested_pair_scan",
        "text": "A new nested scan over the complete processed prefix for every character.",
        "isCorrect": false
      },
      {
        "id": "single_seen_boolean",
        "text": "One boolean shared by all 26 letters.",
        "isCorrect": false
      },
      {
        "id": "running_character_sum",
        "text": "One scalar formed by adding character codes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Keys come from a small, fixed, directly indexable domain.",
      "mentalModelCorrection": "Keyed lookup does not always require a hash table. Bounded domains can often use direct indexed storage.",
      "mistakeTypes": [
        "hash_table_assumed_required_for_all_membership"
      ],
      "nextAction": "Check whether every possible key can be mapped to a compact fixed index.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorting_duplicate_alternative",
    "secondarySkillAtomIds": [
      "distinguish_hashing_from_sorting",
      "recognize_adjacent_equal_values_after_sorting"
    ],
    "type": "solution_comparison",
    "prompt": "An array may be reordered, and the only required result is whether any duplicate value exists. Which statement is correct?",
    "options": [
      {
        "id": "hash_or_sort_are_possible",
        "text": "A seen Set is one valid strategy, while sorting and checking adjacent values is another valid high-level strategy.",
        "isCorrect": true
      },
      {
        "id": "only_hashing",
        "text": "Hash state is mandatory because sorting cannot expose duplicate values.",
        "isCorrect": false
      },
      {
        "id": "only_scalar",
        "text": "A single duplicate count is sufficient without remembering or ordering values.",
        "isCorrect": false
      },
      {
        "id": "sliding_window_required",
        "text": "A variable-size sliding window is required because duplicates define a contiguous range.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Reordering is legal, and sorting can place equal values next to one another.",
      "mentalModelCorrection": "Recognizing a hash-state signal does not mean hashing is the only legal solution.",
      "mistakeTypes": [
        "hashing_treated_as_only_duplicate_strategy"
      ],
      "nextAction": "Check whether input reordering is permitted and whether ordering exposes the needed relationship.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-hash-state-signal-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_when_nested_pair_enumeration_is_required",
    "secondarySkillAtomIds": [
      "distinguish_keyed_lookup_from_arbitrary_pair_predicate",
      "avoid_forcing_hash_state"
    ],
    "type": "strategy_choice",
    "prompt": "A task must emit every pair of records satisfying an arbitrary comparison function. No single lookup key can be derived from one record to identify all matching partners. Which observation is most precise?",
    "options": [
      {
        "id": "hash_signal_not_established",
        "text": "A keyed hash strategy is not automatically justified; direct pair enumeration or another structure matching the predicate may be required.",
        "isCorrect": true
      },
      {
        "id": "set_of_records_solves_all_pairs",
        "text": "Putting the records in a Set automatically identifies every matching pair.",
        "isCorrect": false
      },
      {
        "id": "map_any_field",
        "text": "Choosing any record field as a Map key guarantees that all valid partners can be recovered.",
        "isCorrect": false
      },
      {
        "id": "scalar_match_count",
        "text": "One scalar containing the number of processed records is sufficient to emit the pairs.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The predicate does not expose a stable key that maps one observation to its possible matches.",
      "mentalModelCorrection": "Hash state helps only when the required relationship can be queried meaningfully by key.",
      "mistakeTypes": [
        "hash_state_forced_without_lookup_key"
      ],
      "nextAction": "Explain what exact key would retrieve all and only the relevant prior candidates.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-recognize-hash-state-signal-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_per_key_aggregation_signal",
    "secondarySkillAtomIds": [
      "associate_aggregate_with_key",
      "choose_map_over_global_scalar"
    ],
    "type": "strategy_choice",
    "prompt": "A stream contains transactions for many accounts. The algorithm must maintain a separate running total for each accountId. Which signal is present?",
    "options": [
      {
        "id": "map_account_to_total",
        "text": "Per-key aggregation: use accountId to retrieve and update that account's total.",
        "isCorrect": true
      },
      {
        "id": "single_total",
        "text": "One global total is sufficient because all transactions are numeric.",
        "isCorrect": false
      },
      {
        "id": "set_accounts_only",
        "text": "A Set of account IDs is sufficient because membership contains each account's balance.",
        "isCorrect": false
      },
      {
        "id": "opposite_end_scan",
        "text": "Compare transactions from both ends to determine each account's total.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The same operation must maintain an independent aggregate for every identity.",
      "mentalModelCorrection": "A global accumulator loses which portion of the total belongs to each key.",
      "mistakeTypes": [
        "per_key_aggregation_signal_missed"
      ],
      "nextAction": "Identify whether the aggregate is global or separately owned by each key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-hash-state-signal-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_hash_grouping_from_sorted_output",
    "secondarySkillAtomIds": [
      "separate_state_lookup_from_output_order",
      "recognize_sorting_requirement"
    ],
    "type": "mistake_review",
    "prompt": "A task requires values to be returned in ascending order. A candidate chooses a Map solely because it offers keyed lookup. What is missing from the reasoning?",
    "options": [
      {
        "id": "ordering_contract_not_addressed",
        "text": "Keyed lookup does not itself satisfy ascending output order; the strategy must separately account for ordering.",
        "isCorrect": true
      },
      {
        "id": "maps_are_always_descending",
        "text": "Maps always return keys in descending order, so they can never be used.",
        "isCorrect": false
      },
      {
        "id": "hashing_automatically_sorts",
        "text": "Nothing is missing because hashing automatically orders keys.",
        "isCorrect": false
      },
      {
        "id": "membership_is_enough",
        "text": "A Set membership check determines the correct ascending position of every value.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The stated requirement concerns result order rather than lookup by identity.",
      "mentalModelCorrection": "Hash state and sorting solve different needs and may need to be combined or compared separately.",
      "mistakeTypes": [
        "hash_lookup_confused_with_ordering_strategy"
      ],
      "nextAction": "Separate the state-access requirement from the final output-order requirement.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-recognize-hash-state-signal-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "justify_hash_state_from_required_queries",
    "secondarySkillAtomIds": [
      "reject_hashing_by_habit",
      "classify_state_requirements"
    ],
    "type": "mistake_review",
    "prompt": "A review says:\n\n\"Use a Map because Maps are fast.\"\n\nWhich replacement explanation would properly justify keyed hash state?",
    "options": [
      {
        "id": "specific_repeated_key_query",
        "text": "Future observations repeatedly need to retrieve state associated with a specific value or identity, so that state should be indexed by the queried key.",
        "isCorrect": true
      },
      {
        "id": "map_is_modern",
        "text": "Map is a modern JavaScript collection and should therefore replace all arrays and scalar variables.",
        "isCorrect": false
      },
      {
        "id": "two_variables_exist",
        "text": "The algorithm has at least two variables, which is enough to require a Map.",
        "isCorrect": false
      },
      {
        "id": "input_is_large",
        "text": "The input may be large, so keyed state is correct even when no lookup by key is performed.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The representation should be derived from the operations the algorithm must support.",
      "mentalModelCorrection": "Hash state is justified by repeated key-addressed queries, not by a generic preference for a data structure.",
      "mistakeTypes": [
        "hash_state_justified_only_by_vague_speed_claim"
      ],
      "nextAction": "Name the exact lookup question and the key used to answer it.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
