import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const chooseMapVsSetStateQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_set_for_presence_only_state",
    "secondarySkillAtomIds": [
      "identify_required_per_key_information",
      "avoid_unnecessary_key_value_state"
    ],
    "type": "single_choice",
    "prompt": "An algorithm only needs to answer: \"Have I already seen this value?\" It does not need a count, index, or metadata. Which state representation best matches the contract?",
    "options": [
      {
        "id": "set_of_seen_values",
        "text": "A Set containing each value that has been seen.",
        "isCorrect": true
      },
      {
        "id": "map_to_boolean",
        "text": "A Map from each value to true.",
        "isCorrect": false
      },
      {
        "id": "map_to_count",
        "text": "A Map from each value to the number of times it has appeared.",
        "isCorrect": false
      },
      {
        "id": "map_to_index_array",
        "text": "A Map from each value to every index where it appeared.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Membership is the only query the algorithm needs to support.",
      "mentalModelCorrection": "When the state for a key is only present or absent, the key itself carries all required information.",
      "mistakeTypes": [
        "needless_map_for_presence_state"
      ],
      "nextAction": "List the exact question asked about each key before selecting the collection.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_needless_boolean_map",
    "secondarySkillAtomIds": [
      "choose_set_for_presence_only_state",
      "simplify_state_representation"
    ],
    "type": "mistake_review",
    "prompt": "A duplicate detector maintains:\n\nconst seen = new Map<number, boolean>();\n\nfor (const value of values) {\n  if (seen.get(value) === true) {\n    return true;\n  }\n\n  seen.set(value, true);\n}\n\nWhat is the best review?",
    "options": [
      {
        "id": "replace_with_set",
        "text": "The Map works, but its boolean values add no information; a Set expresses the presence-only contract more directly.",
        "isCorrect": true
      },
      {
        "id": "map_required_for_membership",
        "text": "The Map is required because a Set cannot test whether a key exists.",
        "isCorrect": false
      },
      {
        "id": "store_false_initially",
        "text": "Every possible value should first be inserted with false and later changed to true.",
        "isCorrect": false
      },
      {
        "id": "store_occurrence_count",
        "text": "A duplicate detector must always store the exact occurrence count for every value.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Every stored value in the Map is the same constant boolean.",
      "mentalModelCorrection": "A Map is useful when its associated value carries information beyond key membership.",
      "mistakeTypes": [
        "constant_boolean_map_value"
      ],
      "nextAction": "Remove stored values that do not distinguish one key's state from another.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_map_for_frequency_state",
    "secondarySkillAtomIds": [
      "maintain_per_key_counts",
      "recognize_insufficient_set_state"
    ],
    "type": "single_choice",
    "prompt": "An algorithm must know how many times each value currently occurs. Which representation matches that requirement?",
    "options": [
      {
        "id": "map_value_to_count",
        "text": "A Map from each value to its current occurrence count.",
        "isCorrect": true
      },
      {
        "id": "set_of_values",
        "text": "A Set containing each value that occurs at least once.",
        "isCorrect": false
      },
      {
        "id": "map_value_to_true",
        "text": "A Map from each value to true.",
        "isCorrect": false
      },
      {
        "id": "single_total_count",
        "text": "One number storing the total number of processed elements.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Different keys may have different counts, and the algorithm must preserve those values.",
      "mentalModelCorrection": "A Set can distinguish zero occurrences from at least one occurrence, but not one occurrence from several.",
      "mistakeTypes": [
        "set_used_when_frequency_required"
      ],
      "nextAction": "Use a key-value structure whenever each key needs its own numeric state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-representation-map-vs-set-state-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_set_insufficient_for_duplicate_removal",
    "secondarySkillAtomIds": [
      "maintain_active_multiset_counts",
      "preserve_remaining_duplicate_presence"
    ],
    "type": "solution_comparison",
    "prompt": "A changing active range may contain duplicate values. When one occurrence leaves, the algorithm must still know whether another occurrence of that value remains.\n\nWhich state is sufficient?",
    "options": [
      {
        "id": "map_with_counts",
        "text": "A Map from value to active occurrence count, deleting the key only when its count reaches zero.",
        "isCorrect": true
      },
      {
        "id": "set_delete_on_exit",
        "text": "A Set that deletes the value whenever any occurrence leaves.",
        "isCorrect": false
      },
      {
        "id": "map_to_boolean",
        "text": "A Map from value to true, changing nothing when duplicate occurrences enter.",
        "isCorrect": false
      },
      {
        "id": "single_distinct_total",
        "text": "Only one number storing the current number of distinct values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Removing one occurrence does not necessarily change the key from present to absent.",
      "mentalModelCorrection": "Presence-only state is insufficient when several active occurrences can share one key.",
      "mistakeTypes": [
        "duplicate_multiplicity_lost_by_set"
      ],
      "nextAction": "Ask whether one removal always implies that the key is no longer represented.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_map_for_index_lookup",
    "secondarySkillAtomIds": [
      "align_state_with_index_output",
      "distinguish_presence_from_position"
    ],
    "type": "single_choice",
    "prompt": "A pair-search function must return the original index of a previously seen complement. Which state should it maintain?",
    "options": [
      {
        "id": "map_value_to_index",
        "text": "A Map from each seen value to an original index where that value occurred.",
        "isCorrect": true
      },
      {
        "id": "set_of_seen_values",
        "text": "A Set of seen values, because membership alone identifies the required index.",
        "isCorrect": false
      },
      {
        "id": "map_value_to_boolean",
        "text": "A Map from each value to true.",
        "isCorrect": false
      },
      {
        "id": "set_of_indexes",
        "text": "A Set of processed indexes without storing their associated values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The output requires positional information about the matching key.",
      "mentalModelCorrection": "A Set can prove that a complement exists but cannot recover the index associated with it.",
      "mistakeTypes": [
        "presence_state_disconnected_from_index_output"
      ],
      "nextAction": "Store every piece of information that must later be returned or used to construct the result.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-representation-map-vs-set-state-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_map_for_all_index_groups",
    "secondarySkillAtomIds": [
      "group_metadata_by_key",
      "distinguish_one_index_from_all_indexes"
    ],
    "type": "single_choice",
    "prompt": "A function must return every original index at which each value appears. Which representation fits the output contract?",
    "options": [
      {
        "id": "map_value_to_index_array",
        "text": "A Map from each value to an array of all its original indexes.",
        "isCorrect": true
      },
      {
        "id": "set_of_values",
        "text": "A Set containing each distinct value.",
        "isCorrect": false
      },
      {
        "id": "map_value_to_one_index",
        "text": "A Map from each value to only its most recent index.",
        "isCorrect": false
      },
      {
        "id": "set_of_all_indexes",
        "text": "A Set containing all indexes without grouping them by value.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each key needs a collection of associated positions rather than a presence flag or one scalar.",
      "mentalModelCorrection": "The Map value should model the complete information required for that key.",
      "mistakeTypes": [
        "map_value_too_weak_for_output_contract"
      ],
      "nextAction": "Determine whether each key maps to one result item or a group of result items.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_map_for_grouping",
    "secondarySkillAtomIds": [
      "accumulate_group_members",
      "select_map_value_shape"
    ],
    "type": "single_choice",
    "prompt": "Words must be grouped by a computed signature, with every word having the same signature placed in the same group. Which state is appropriate?",
    "options": [
      {
        "id": "map_signature_to_words",
        "text": "A Map from each signature to an array of words in that group.",
        "isCorrect": true
      },
      {
        "id": "set_of_signatures",
        "text": "A Set containing each signature that has appeared.",
        "isCorrect": false
      },
      {
        "id": "map_signature_to_boolean",
        "text": "A Map from each signature to true.",
        "isCorrect": false
      },
      {
        "id": "set_of_words",
        "text": "A Set of all words without retaining their signature groups.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The algorithm must retain multiple members associated with each grouping key.",
      "mentalModelCorrection": "Presence of a group is not enough when the output must contain the group's members.",
      "mistakeTypes": [
        "set_used_for_grouping_contract"
      ],
      "nextAction": "Choose the Map value type from what must accumulate under each key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-representation-map-vs-set-state-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_map_for_best_value_per_key",
    "secondarySkillAtomIds": [
      "maintain_per_key_optimum",
      "align_state_with_aggregation_contract"
    ],
    "type": "single_choice",
    "prompt": "For every category, an algorithm must retain the highest score observed in that category. Which representation best matches the state?",
    "options": [
      {
        "id": "map_category_to_best_score",
        "text": "A Map from each category to its best score so far.",
        "isCorrect": true
      },
      {
        "id": "set_of_categories",
        "text": "A Set of categories that have appeared.",
        "isCorrect": false
      },
      {
        "id": "map_category_to_true",
        "text": "A Map from each category to true.",
        "isCorrect": false
      },
      {
        "id": "single_global_best",
        "text": "One number containing the best score across all categories.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each category needs its own changing optimum.",
      "mentalModelCorrection": "Presence state cannot answer a query about the best associated value for a key.",
      "mistakeTypes": [
        "presence_state_used_for_per_key_optimum"
      ],
      "nextAction": "Model the exact aggregate that must be updated independently for each key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-representation-map-vs-set-state-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_map_for_per_key_metadata",
    "secondarySkillAtomIds": [
      "store_structured_key_state",
      "distinguish_membership_from_metadata"
    ],
    "type": "single_choice",
    "prompt": "For each user ID, an algorithm must retain a status, last-seen timestamp, and retry count. Which state is appropriate?",
    "options": [
      {
        "id": "map_id_to_metadata",
        "text": "A Map from user ID to an object containing status, lastSeen, and retryCount.",
        "isCorrect": true
      },
      {
        "id": "set_of_user_ids",
        "text": "A Set of user IDs that have appeared.",
        "isCorrect": false
      },
      {
        "id": "map_id_to_boolean",
        "text": "A Map from user ID to true.",
        "isCorrect": false
      },
      {
        "id": "three_global_variables",
        "text": "Three global variables shared by every user ID.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each key owns several associated fields that may differ between keys.",
      "mentalModelCorrection": "A Map value may be structured metadata when one scalar cannot represent the required per-key state.",
      "mistakeTypes": [
        "set_used_when_key_metadata_required"
      ],
      "nextAction": "Define the complete state record associated with one key.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_set_for_stable_deduplication",
    "secondarySkillAtomIds": [
      "track_seen_values",
      "preserve_first_occurrence_order"
    ],
    "type": "single_choice",
    "prompt": "A function emits only the first occurrence of each value while scanning left to right. It only needs to know whether a value has already been emitted. Which state is sufficient?",
    "options": [
      {
        "id": "set_of_emitted_values",
        "text": "A Set of values already emitted.",
        "isCorrect": true
      },
      {
        "id": "map_value_to_all_indexes",
        "text": "A Map from each value to every index where it occurs.",
        "isCorrect": false
      },
      {
        "id": "map_value_to_count",
        "text": "A Map storing the exact total count of every value.",
        "isCorrect": false
      },
      {
        "id": "map_value_to_first_and_last",
        "text": "A Map storing both the first and last index of every value.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The decision for each observation depends only on prior membership.",
      "mentalModelCorrection": "Do not collect counts or positions when the output rule uses only first-seen versus already-seen state.",
      "mistakeTypes": [
        "overmodeled_deduplication_state"
      ],
      "nextAction": "Store no more information than the emission decision requires.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_set_for_pair_existence",
    "secondarySkillAtomIds": [
      "use_presence_for_complement_lookup",
      "align_state_with_boolean_output"
    ],
    "type": "solution_comparison",
    "prompt": "A function scans an array and returns only whether two distinct elements sum to target.\n\nIt checks whether target - current has already been seen before inserting current.\n\nWhich state is sufficient for the seen values?",
    "options": [
      {
        "id": "set_is_sufficient",
        "text": "A Set, because the decision only requires presence of the complement among earlier indexes.",
        "isCorrect": true
      },
      {
        "id": "map_to_index_required",
        "text": "A Map to an index is required even though no index is returned or otherwise used.",
        "isCorrect": false
      },
      {
        "id": "map_to_count_required",
        "text": "A full frequency Map is required for every pair-existence scan.",
        "isCorrect": false
      },
      {
        "id": "map_to_boolean_preferred",
        "text": "A Map from each value to true is necessary because Set membership cannot represent prior occurrence.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The output is boolean, and the scan only asks whether a complement exists in the processed prefix.",
      "mentalModelCorrection": "The collection should match the information consumed by the algorithm, not information a different output contract might require.",
      "mistakeTypes": [
        "map_selected_without_index_or_count_need"
      ],
      "nextAction": "Remove associated values that are never read after insertion.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-representation-map-vs-set-state-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_map_for_exact_frequency_output",
    "secondarySkillAtomIds": [
      "align_state_with_frequency_output",
      "reject_presence_only_frequency_state"
    ],
    "type": "single_choice",
    "prompt": "A function must return the exact number of occurrences of every distinct value. Which representation is required?",
    "options": [
      {
        "id": "map_value_to_frequency",
        "text": "A Map from each distinct value to its exact frequency.",
        "isCorrect": true
      },
      {
        "id": "set_of_distinct_values",
        "text": "A Set of distinct values.",
        "isCorrect": false
      },
      {
        "id": "map_value_to_true",
        "text": "A Map from each value to true.",
        "isCorrect": false
      },
      {
        "id": "single_distinct_count",
        "text": "One number containing only how many distinct values exist.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The returned result contains a separate numeric answer for every key.",
      "mentalModelCorrection": "Knowing which keys exist does not reveal how often each key occurs.",
      "mistakeTypes": [
        "set_state_disconnected_from_frequency_output"
      ],
      "nextAction": "Derive the stored value type directly from the value required in the output.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-representation-map-vs-set-state-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "select_state_for_reachability_or_path_reconstruction",
    "secondarySkillAtomIds": [
      "choose_set_for_visited_state",
      "choose_map_for_parent_metadata"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two graph-search contracts:\n\nA. Determine only whether a node has already been visited.\n\nB. Reconstruct the path by remembering which node discovered each visited node.\n\nWhich state selection is correct?",
    "options": [
      {
        "id": "set_for_a_map_for_b",
        "text": "A can use a Set of visited nodes; B needs a Map from each discovered node to its parent.",
        "isCorrect": true
      },
      {
        "id": "set_for_b",
        "text": "Both can use only a Set because membership is enough to reconstruct parent relationships.",
        "isCorrect": false
      },
      {
        "id": "map_boolean_for_a_and_b",
        "text": "Both require a Map from each node to true.",
        "isCorrect": false
      },
      {
        "id": "map_parent_for_a",
        "text": "A requires parent metadata, while B needs only presence.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The second contract needs associated provenance information for each key.",
      "mentalModelCorrection": "The same keys may require different representations when the downstream output changes.",
      "mistakeTypes": [
        "state_choice_not_updated_for_output_contract"
      ],
      "nextAction": "Ask what information must be recovered after membership has been established.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-representation-map-vs-set-state-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_map_or_set_from_output_contract",
    "secondarySkillAtomIds": [
      "identify_required_per_key_information",
      "avoid_representation_by_habit"
    ],
    "type": "solution_comparison",
    "prompt": "Two versions of a pair-sum task use the same input:\n\nA. Return only whether any valid pair exists.\n\nB. Return the original index of the earlier element in one valid pair.\n\nWhich representation choice is best justified?",
    "options": [
      {
        "id": "set_for_a_map_for_b",
        "text": "A can use a Set of seen values; B needs a Map from seen value to an original index.",
        "isCorrect": true
      },
      {
        "id": "set_for_b_too",
        "text": "Both should use a Set because the underlying pair condition is identical.",
        "isCorrect": false
      },
      {
        "id": "map_boolean_for_b",
        "text": "B should use a Map from value to boolean because booleans preserve original positions.",
        "isCorrect": false
      },
      {
        "id": "map_for_a_always",
        "text": "A must use a Map because Map is always preferable when keys are numeric.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The search condition is similar, but the required result contains different information.",
      "mentalModelCorrection": "Representation choice follows the strongest query or output the state must support, not the broad problem label.",
      "mistakeTypes": [
        "representation_selected_independently_of_output_contract"
      ],
      "nextAction": "For each key, complete the sentence: \"Later I must retrieve...\"",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
