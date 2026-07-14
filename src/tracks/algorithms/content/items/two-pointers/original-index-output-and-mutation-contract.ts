import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const originalIndexOutputAndMutationContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-output-mutation-contract-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_original_indexes_through_sorting",
    "secondarySkillAtomIds": [
      "attach_identity_metadata_before_sort",
      "distinguish_sorted_position_from_original_index"
    ],
    "type": "single_choice",
    "prompt": "A pair-search algorithm sorts the input before scanning, but the result must contain original indexes. Which representation preserves the required identity?",
    "options": [
      {
        "id": "value_and_original_index",
        "text": "Sort records containing both the value and its original index.",
        "isCorrect": true
      },
      {
        "id": "sorted_values_only",
        "text": "Sort only the values and return the final pointer positions.",
        "isCorrect": false
      },
      {
        "id": "set_of_values",
        "text": "Store the values in a Set because membership preserves original positions.",
        "isCorrect": false
      },
      {
        "id": "sorted_index_is_original",
        "text": "Use the index after sorting because sorting does not change positional identity.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sorting changes positions, so original identity must travel with each value.",
      "mentalModelCorrection": "A sorted index describes the transformed representation, not the element's original source position.",
      "mistakeTypes": [
        "original_index_metadata_lost_during_sort"
      ],
      "nextAction": "Attach every output-relevant identity field before applying a reordering transformation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-output-mutation-contract-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_sorted_indexes_returned_as_original",
    "secondarySkillAtomIds": [
      "distinguish_sorted_position_from_original_index",
      "review_sort_based_pointer_output"
    ],
    "type": "mistake_review",
    "prompt": "The original input is:\n\nvalues = [8, 2, 6]\n\nAfter sorting, the array is [2, 6, 8]. A pointer search finds the pair at sorted positions [0, 2] and returns [0, 2].\n\nWhy can that result violate the contract?",
    "options": [
      {
        "id": "positions_refer_to_sorted_array",
        "text": "The returned positions refer to the sorted representation; the corresponding original indexes are [1, 0].",
        "isCorrect": true
      },
      {
        "id": "pair_values_are_wrong",
        "text": "The values 2 and 8 cannot form any valid pair.",
        "isCorrect": false
      },
      {
        "id": "indexes_must_be_sorted",
        "text": "Original indexes must always be returned in ascending order, so [1, 0] would also be invalid.",
        "isCorrect": false
      },
      {
        "id": "sorting_preserves_indexes",
        "text": "There is no violation because array indexes remain attached to values after sorting.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The pointer positions are coordinates in the sorted array.",
      "mentalModelCorrection": "Returning pointer positions is correct only when the output contract asks for positions in the transformed representation.",
      "mistakeTypes": [
        "sorted_positions_returned_as_original_indexes"
      ],
      "nextAction": "Translate each selected sorted record back through its stored original index.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-output-mutation-contract-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "respect_non_mutating_input_contract",
    "secondarySkillAtomIds": [
      "distinguish_in_place_sort_from_copy_sort",
      "review_sorting_side_effects"
    ],
    "type": "solution_comparison",
    "prompt": "A function may use sorting internally, but its contract says the caller's input array must remain unchanged.\n\nWhich design satisfies the contract?",
    "options": [
      {
        "id": "copy_then_sort",
        "text": "Create a copy containing the needed values or records, sort the copy, and leave the original array untouched.",
        "isCorrect": true
      },
      {
        "id": "sort_original",
        "text": "Sort the original array because internal preprocessing is never observable.",
        "isCorrect": false
      },
      {
        "id": "sort_then_reverse",
        "text": "Sort the original array and reverse it before returning.",
        "isCorrect": false
      },
      {
        "id": "document_mutation",
        "text": "Mutate the input and mention the side effect only in a code comment.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "JavaScript Array.prototype.sort mutates the array on which it is called.",
      "mentalModelCorrection": "A correct pointer strategy can still violate the function contract through unintended preprocessing mutation.",
      "mistakeTypes": [
        "non_mutating_contract_violated_by_sort"
      ],
      "nextAction": "Copy before sorting whenever caller-visible input order must be preserved.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-output-mutation-contract-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_value_output_from_index_output",
    "secondarySkillAtomIds": [
      "align_pointer_result_with_output_contract",
      "avoid_unnecessary_identity_state"
    ],
    "type": "output_contract_analysis",
    "prompt": "A sorted pair-search function must return only the two matching values, not their original indexes. Which statement is correct?",
    "options": [
      {
        "id": "sorted_values_can_be_returned",
        "text": "The endpoint values may be returned directly; original-index metadata is unnecessary unless another contract requires it.",
        "isCorrect": true
      },
      {
        "id": "indexes_always_required",
        "text": "Every pointer solution must preserve original indexes even when only values are returned.",
        "isCorrect": false
      },
      {
        "id": "return_pointer_positions",
        "text": "The function should return pointer positions because positions and values are interchangeable.",
        "isCorrect": false
      },
      {
        "id": "return_full_sorted_array",
        "text": "The complete sorted array must be returned along with the pair.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The required result contains values rather than source identities.",
      "mentalModelCorrection": "Preserve only the metadata required by the actual output and tie-breaking contracts.",
      "mistakeTypes": [
        "state_overmodeled_for_value_output"
      ],
      "nextAction": "List the exact fields that must appear in the returned result.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-output-mutation-contract-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "satisfy_earliest_result_tie_contract",
    "secondarySkillAtomIds": [
      "preserve_original_order_metadata",
      "distinguish_any_result_from_earliest_result"
    ],
    "type": "mistake_review",
    "prompt": "A sorted two-pointer search returns the first valid pair it encounters.\n\nThe specification instead requires the valid pair with the smallest first original index, breaking ties by the smallest second original index.\n\nWhat is the problem?",
    "options": [
      {
        "id": "pointer_encounter_order_not_required_order",
        "text": "The first match encountered in sorted order is not guaranteed to be earliest under the original-index tie rule, and ordinary pointer movement may skip other index-distinct candidates relevant to that rule.",
        "isCorrect": true
      },
      {
        "id": "two_pointers_cannot_find_pairs",
        "text": "Two-pointer search cannot find any valid pair after sorting.",
        "isCorrect": false
      },
      {
        "id": "tie_rules_never_matter",
        "text": "Any valid pair satisfies every pair-return contract.",
        "isCorrect": false
      },
      {
        "id": "sorted_values_equal_original_order",
        "text": "Sorting automatically places pairs in earliest original-index order.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sorted encounter order and original-index lexicographic order are different orderings.",
      "mentalModelCorrection": "Preserving original indexes is necessary but not sufficient; the search must also consider every candidate that could win the specified tie-break.",
      "mistakeTypes": [
        "arbitrary_pair_returned_under_earliest_contract"
      ],
      "nextAction": "Use a strategy proven to inspect all tie-relevant candidates, then compare them by the required original-index tuple.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-output-mutation-contract-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_stable_tie_order",
    "secondarySkillAtomIds": [
      "retain_original_order_for_equal_keys",
      "define_deterministic_tie_breaking"
    ],
    "type": "solution_comparison",
    "prompt": "Records are sorted by score before a pointer-based merge. For equal scores, the output must preserve original input order.\n\nWhich design supports the contract?",
    "options": [
      {
        "id": "stable_sort_or_original_index_tie",
        "text": "Use a stable sort, or include originalIndex as an explicit tie-breaker.",
        "isCorrect": true
      },
      {
        "id": "arbitrary_equal_order",
        "text": "Allow equal-score records to appear in any order because their comparison keys are equal.",
        "isCorrect": false
      },
      {
        "id": "reverse_equal_records",
        "text": "Reverse equal-score runs so the output differs from the input.",
        "isCorrect": false
      },
      {
        "id": "deduplicate_equal_scores",
        "text": "Keep only one record for each score.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Equal comparison keys do not erase record identity or the required relative ordering.",
      "mentalModelCorrection": "Tie behavior is part of deterministic output correctness, not an implementation detail.",
      "mistakeTypes": [
        "stable_tie_contract_ignored"
      ],
      "nextAction": "Define how equal-key records are ordered before relying on sorted traversal.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-output-mutation-contract-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_compacted_prefix_output",
    "secondarySkillAtomIds": [
      "understand_logical_output_length",
      "distinguish_prefix_from_stale_suffix"
    ],
    "type": "single_choice",
    "prompt": "An in-place compaction returns write = k after moving all retained values into indexes [0, k).\n\nWhat part of the array is the logical output?",
    "options": [
      {
        "id": "prefix_zero_to_k",
        "text": "Only the prefix at indexes 0 through k - 1.",
        "isCorrect": true
      },
      {
        "id": "complete_array",
        "text": "The entire physical array, including every position after k.",
        "isCorrect": false
      },
      {
        "id": "suffix_from_k",
        "text": "Only the suffix beginning at index k.",
        "isCorrect": false
      },
      {
        "id": "original_positions_only",
        "text": "Only retained values that remained at their original indexes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "write represents the number of produced output items and the next free output position.",
      "mentalModelCorrection": "In-place compaction often returns a logical length rather than clearing or resizing the physical suffix.",
      "mistakeTypes": [
        "compacted_suffix_treated_as_output"
      ],
      "nextAction": "Read only the returned logical prefix unless the contract explicitly requires physical resizing.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-output-mutation-contract-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_stale_compacted_suffix",
    "secondarySkillAtomIds": [
      "interpret_compacted_prefix_output",
      "avoid_suffix_semantics_assumption"
    ],
    "type": "mistake_review",
    "prompt": "After in-place filtering, the array is:\n\n[2, 4, 6, 4, 6]\n\nand the returned logical length is 3.\n\nA caller treats the final two values as additional retained output. What is wrong?",
    "options": [
      {
        "id": "suffix_is_unspecified_stale_storage",
        "text": "Only [2, 4, 6] is logical output; the suffix may contain stale or overwritten values with no output meaning.",
        "isCorrect": true
      },
      {
        "id": "length_should_be_five",
        "text": "The logical length must equal the physical array length.",
        "isCorrect": false
      },
      {
        "id": "suffix_is_rejected_output",
        "text": "The suffix is guaranteed to contain rejected values in their original order.",
        "isCorrect": false
      },
      {
        "id": "duplicates_extend_output",
        "text": "Repeated retained values after the prefix automatically extend the logical result.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The algorithm guarantees only the produced prefix and its length.",
      "mentalModelCorrection": "Memory beyond the logical output boundary is not automatically a second meaningful region.",
      "mistakeTypes": [
        "stale_suffix_given_output_semantics"
      ],
      "nextAction": "Use the returned length as the exclusive output boundary.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-pointer-output-mutation-contract-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_count_length_and_contents_outputs",
    "secondarySkillAtomIds": [
      "align_compaction_return_value",
      "avoid_output_shape_mismatch"
    ],
    "type": "output_contract_analysis",
    "prompt": "A compaction function's contract is:\n\n\"Mutate the input so retained values occupy the prefix and return the retained count.\"\n\nWhich return value is correct?",
    "options": [
      {
        "id": "write_count",
        "text": "The final write index, because it equals the number of retained values.",
        "isCorrect": true
      },
      {
        "id": "full_array",
        "text": "The entire mutated array instead of the required count.",
        "isCorrect": false
      },
      {
        "id": "last_retained_index",
        "text": "write - 1, even when no values are retained.",
        "isCorrect": false
      },
      {
        "id": "read_index",
        "text": "The final read index, because every observed value is retained.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "write counts how many output elements have been produced.",
      "mentalModelCorrection": "Count, last index, logical length, and returned contents are different output contracts.",
      "mistakeTypes": [
        "compaction_return_contract_mismatch"
      ],
      "nextAction": "Translate the requested output noun directly into the maintained pointer state.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-output-mutation-contract-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_input_order_in_compaction",
    "secondarySkillAtomIds": [
      "recognize_stable_read_write_compaction",
      "avoid_unjustified_reordering"
    ],
    "type": "solution_comparison",
    "prompt": "A filter must retain qualifying values in their original relative order.\n\nWhich in-place strategy matches the contract?",
    "options": [
      {
        "id": "left_to_right_read_write",
        "text": "Scan left to right and write each retained value to the next output position.",
        "isCorrect": true
      },
      {
        "id": "swap_with_suffix",
        "text": "Swap rejected values with arbitrary items from the suffix, even if retained order changes.",
        "isCorrect": false
      },
      {
        "id": "sort_retained_values",
        "text": "Sort the retained values before writing them.",
        "isCorrect": false
      },
      {
        "id": "write_from_end",
        "text": "Write retained values from right to left without compensating for reversed order.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The output contract includes stable relative order among retained observations.",
      "mentalModelCorrection": "An in-place transformation may be correct as a membership filter yet still violate an ordering requirement.",
      "mistakeTypes": [
        "compaction_reorders_retained_values"
      ],
      "nextAction": "Choose write order from the required output order, not merely from available storage.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-output-mutation-contract-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "account_for_copying_output_contract",
    "secondarySkillAtomIds": [
      "distinguish_view_from_materialized_copy",
      "review_range_return_behavior"
    ],
    "type": "solution_comparison",
    "prompt": "A pointer scan identifies the best range as boundaries [bestLeft, bestRight].\n\nCompare two contracts:\n\nA. Return only the boundaries.\nB. Return a new array containing the range values.\n\nWhich statement is correct?",
    "options": [
      {
        "id": "b_requires_copy",
        "text": "A can return two indexes, while B must materialize or otherwise provide the requested range contents.",
        "isCorrect": true
      },
      {
        "id": "same_output",
        "text": "Both contracts are satisfied by returning [bestLeft, bestRight].",
        "isCorrect": false
      },
      {
        "id": "boundaries_require_more_storage",
        "text": "A necessarily requires more output storage than copying the range.",
        "isCorrect": false
      },
      {
        "id": "copy_changes_original",
        "text": "B must overwrite the original array because new arrays cannot contain range values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "One output describes identity by position, while the other requires the actual sequence values.",
      "mentalModelCorrection": "Finding boundaries and materializing contents are separate responsibilities with different output behavior.",
      "mistakeTypes": [
        "range_boundaries_returned_instead_of_copy"
      ],
      "nextAction": "Check whether the caller needs coordinates, a view, or an independent copied result.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-pointer-output-mutation-contract-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_pointer_output_and_mutation_invariant",
    "secondarySkillAtomIds": [
      "preserve_required_identity_metadata",
      "separate_logical_output_from_storage"
    ],
    "type": "invariant_identification",
    "prompt": "Which invariant most completely supports a pointer transformation that preserves original identity, mutates a compacted prefix, and returns a logical length?",
    "options": [
      {
        "id": "prefix_contains_correct_records_with_identity",
        "text": "The prefix [0, write) contains exactly the produced records in required order with all output-relevant original metadata preserved; positions at or after write have no promised output meaning.",
        "isCorrect": true
      },
      {
        "id": "whole_array_is_output",
        "text": "Every physical array position always belongs to the logical output.",
        "isCorrect": false
      },
      {
        "id": "sorted_positions_are_identity",
        "text": "Any current array position may be returned as the original identity after reordering.",
        "isCorrect": false
      },
      {
        "id": "any_valid_tie_is_correct",
        "text": "Tie-breaking and original order are irrelevant once the correct values appear somewhere in the array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Correctness combines output contents, ordering, identity metadata, mutation boundaries, and suffix semantics.",
      "mentalModelCorrection": "Pointer mechanics are correct only when the maintained regions and returned metadata satisfy the complete observable contract.",
      "mistakeTypes": [
        "pointer_output_mutation_invariant_incomplete"
      ],
      "nextAction": "State what the produced prefix guarantees, what identity fields survive, and what the suffix does not guarantee.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
