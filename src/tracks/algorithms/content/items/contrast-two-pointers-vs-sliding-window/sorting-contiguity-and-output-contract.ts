import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const sortingContiguityAndOutputContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_sorting_against_output_contract",
    "secondarySkillAtomIds": [
      "recognize_sorted_pair_elimination",
      "distinguish_values_from_original_positions"
    ],
    "type": "single_choice",
    "prompt": "An unsorted array must be checked for whether any two distinct values sum to a target. The result only needs to be true or false. What effect does sorting have on the contract?",
    "options": [
      {
        "id": "sorting_preserves_pair_existence",
        "text": "Sorting changes positions but preserves whether such a pair of values exists, so it may legally enable opposite-end elimination.",
        "isCorrect": true
      },
      {
        "id": "sorting_destroys_pair_existence",
        "text": "Sorting invalidates the task because the two values may no longer be adjacent.",
        "isCorrect": false
      },
      {
        "id": "sorting_creates_contiguous_window",
        "text": "Sorting converts the task into finding one contiguous range whose complete sum equals the target.",
        "isCorrect": false
      },
      {
        "id": "sorting_only_valid_for_indexes",
        "text": "Sorting is legal only when the required result is the pair's original indexes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The output concerns existence of two values, not their adjacency or original positions.",
      "mentalModelCorrection": "Sorting may reorder candidates without changing which numeric value pairs exist.",
      "mistakeTypes": [
        "sorting_rejected_despite_value_only_pair_contract"
      ],
      "nextAction": "Identify which properties of the input must remain observable in the returned result.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_original_contiguity",
    "secondarySkillAtomIds": [
      "recognize_subarray_contract",
      "reject_sorting_before_window_search"
    ],
    "type": "mistake_review",
    "prompt": "A task asks for the longest contiguous subarray in the original input whose sum satisfies a condition.\n\nA candidate sorts the values first and then applies a sliding window. What is the central mistake?",
    "options": [
      {
        "id": "sorting_destroys_original_adjacency",
        "text": "Sorting changes which elements are adjacent, so ranges in the sorted array are not necessarily subarrays of the original input.",
        "isCorrect": true
      },
      {
        "id": "sliding_window_requires_sorted_input",
        "text": "Sliding window is invalid because it can only be used on unsorted arrays.",
        "isCorrect": false
      },
      {
        "id": "sorting_removes_values",
        "text": "Sorting may delete duplicate values needed by the original subarray.",
        "isCorrect": false
      },
      {
        "id": "subarray_means_pair",
        "text": "A subarray result should contain only two endpoint values rather than every value between them.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The required answer is defined by adjacency in the original sequence.",
      "mentalModelCorrection": "Sorting preserves values but replaces the original neighborhood structure on which a subarray contract depends.",
      "mistakeTypes": [
        "sorting_before_original_subarray_search"
      ],
      "nextAction": "Before sorting, ask whether the output must correspond to consecutive original indexes.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_pair_from_contiguous_range_contract",
    "secondarySkillAtomIds": [
      "recognize_non_adjacent_pair_requirement",
      "reject_sliding_window_for_independent_pair"
    ],
    "type": "strategy_choice",
    "prompt": "A task asks for any two array elements whose values satisfy a relationship. The elements may occur anywhere and do not need to be adjacent. Which interpretation is correct?",
    "options": [
      {
        "id": "independent_pair_candidates",
        "text": "The answer consists of two selected positions, so pair-search reasoning is more relevant than maintaining every element between them as one window.",
        "isCorrect": true
      },
      {
        "id": "all_between_are_answer",
        "text": "Every value between the selected positions must be included because two indexes always define a sliding window.",
        "isCorrect": false
      },
      {
        "id": "must_return_subarray",
        "text": "The task implicitly asks for a contiguous subarray beginning at the first element and ending at the second.",
        "isCorrect": false
      },
      {
        "id": "adjacency_required",
        "text": "The two elements must become adjacent before they can be considered a pair.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The contract selects two elements independently rather than one complete contiguous range.",
      "mentalModelCorrection": "Two answer indexes do not imply that the interior belongs to the answer.",
      "mistakeTypes": [
        "sliding_window_used_for_non_adjacent_pair"
      ],
      "nextAction": "State whether interior positions contribute to the candidate result.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-sorting-contiguity-output-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_original_indexes_through_sorting",
    "secondarySkillAtomIds": [
      "distinguish_sorted_positions_from_original_indexes",
      "evaluate_pair_output_contract"
    ],
    "type": "solution_comparison",
    "prompt": "A pair-sum task requires returning the two original indexes.\n\nSolution A sorts the raw values and returns the two indexes used in the sorted array.\n\nSolution B sorts records of the form { value, originalIndex } and returns the stored original indexes.\n\nWhich review is correct?",
    "options": [
      {
        "id": "only_decorated_sort_preserves_indexes",
        "text": "Solution B preserves the required mapping. Solution A returns sorted positions, which generally differ from original indexes.",
        "isCorrect": true
      },
      {
        "id": "both_preserve_indexes",
        "text": "Both preserve original indexes because sorting moves values and indexes together automatically.",
        "isCorrect": false
      },
      {
        "id": "only_raw_sort_valid",
        "text": "Solution A is correct because the result should always use positions from the final sorted representation.",
        "isCorrect": false
      },
      {
        "id": "neither_can_sort",
        "text": "Neither may sort because returning original indexes makes any reordering impossible.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The result must refer to positions in the original input, not the transformed search representation.",
      "mentalModelCorrection": "Sorting is still possible, but positional identity must be carried explicitly through the transformation.",
      "mistakeTypes": [
        "original_indexes_lost_after_sorting"
      ],
      "nextAction": "Track whether each transformed value still retains a mapping to its source position.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_value_only_pair_output",
    "secondarySkillAtomIds": [
      "evaluate_sorting_against_output_contract",
      "distinguish_values_from_indexes"
    ],
    "type": "single_choice",
    "prompt": "A task asks to return one pair of numeric values that sums to a target. It does not require their original positions or original order. Which statement is precise?",
    "options": [
      {
        "id": "sorting_can_preserve_required_output",
        "text": "Sorting can still satisfy the contract because the requested values remain available even though their positions change.",
        "isCorrect": true
      },
      {
        "id": "sorting_always_invalid",
        "text": "Sorting is invalid whenever the input was originally unsorted.",
        "isCorrect": false
      },
      {
        "id": "must_return_interval",
        "text": "The result must include every value between the two values in sorted order.",
        "isCorrect": false
      },
      {
        "id": "must_preserve_original_order",
        "text": "The pair must be returned in the same left-to-right order in which the values appeared originally.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The output contract retains value identity but not positional identity.",
      "mentalModelCorrection": "A transformation is legal when it preserves all information the result must expose.",
      "mistakeTypes": [
        "value_output_confused_with_index_output"
      ],
      "nextAction": "List the exact fields the caller expects from the returned answer.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_contiguous_range_output",
    "secondarySkillAtomIds": [
      "interpret_window_boundaries_as_output_range",
      "preserve_original_order"
    ],
    "type": "single_choice",
    "prompt": "A function must return the start and end indexes of one qualifying contiguous range in the original array. Which strategy property is required?",
    "options": [
      {
        "id": "boundaries_share_original_range",
        "text": "The boundaries must describe one range of consecutive original indexes whose complete contents satisfy the condition.",
        "isCorrect": true
      },
      {
        "id": "any_two_candidate_indexes",
        "text": "Any two independently selected indexes may be returned as long as their endpoint values satisfy the condition.",
        "isCorrect": false
      },
      {
        "id": "sorted_range_indexes",
        "text": "The function may sort first and return start and end positions from the sorted array.",
        "isCorrect": false
      },
      {
        "id": "only_values_needed",
        "text": "The implementation only needs to preserve the two boundary values, not the indexes between them.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The returned indexes define an inclusive original subarray.",
      "mentalModelCorrection": "For a range output, the relationship between all indexes from start through end is part of the contract.",
      "mistakeTypes": [
        "independent_pair_returned_as_contiguous_range"
      ],
      "nextAction": "Verify that every index between the returned boundaries belongs to the candidate answer.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_length_only_window_output",
    "secondarySkillAtomIds": [
      "recognize_contiguous_substring_contract",
      "distinguish_output_form_from_internal_boundaries"
    ],
    "type": "strategy_choice",
    "prompt": "A task asks only for the length of the longest contiguous substring satisfying a maintainable condition. Which observation is most relevant?",
    "options": [
      {
        "id": "window_can_track_range_and_return_length",
        "text": "A sliding window can maintain one current substring and update the best length without returning the substring itself.",
        "isCorrect": true
      },
      {
        "id": "length_means_no_contiguity",
        "text": "Because only a number is returned, original contiguity no longer matters.",
        "isCorrect": false
      },
      {
        "id": "sort_then_measure",
        "text": "Sorting is safe because the output is only a length rather than actual indexes.",
        "isCorrect": false
      },
      {
        "id": "endpoint_pair_length",
        "text": "The length should be computed from two independent candidate positions whose interior is irrelevant.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Although the output is only a number, that number is defined by a contiguous range in the original input.",
      "mentalModelCorrection": "Returning less information does not remove structural constraints from the answer being measured.",
      "mistakeTypes": [
        "length_only_output_treated_as_order_independent"
      ],
      "nextAction": "Separate the form of the returned value from the structure of the candidate it summarizes.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_in_place_prefix_output_contract",
    "secondarySkillAtomIds": [
      "choose_read_write_compaction",
      "distinguish_transformed_prefix_from_subarray"
    ],
    "type": "strategy_choice",
    "prompt": "A task requires modifying an array in place so that all retained values occupy a stable prefix, then returning the new logical length. Which strategy matches the output contract?",
    "options": [
      {
        "id": "read_write_compaction",
        "text": "Same-direction read/write pointers that build the transformed output prefix.",
        "isCorrect": true
      },
      {
        "id": "sliding_window_range",
        "text": "A sliding window that returns the boundaries of one original contiguous valid range.",
        "isCorrect": false
      },
      {
        "id": "opposite_end_pair",
        "text": "Opposite-end pointers that return the two retained endpoint values.",
        "isCorrect": false
      },
      {
        "id": "sorted_pair_search",
        "text": "Sort the values and search for one endpoint pair whose distance equals the output length.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The required result is a rewritten prefix rather than a selected original range.",
      "mentalModelCorrection": "Compaction constructs output positions; it does not preserve one active candidate interval.",
      "mistakeTypes": [
        "range_strategy_used_for_transformed_prefix_output"
      ],
      "nextAction": "Determine whether the function selects from the original input or rewrites a logical output sequence.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_pointer_interval_as_automatic_output",
    "secondarySkillAtomIds": [
      "distinguish_search_region_from_candidate_range",
      "interpret_opposite_end_pointers"
    ],
    "type": "mistake_review",
    "prompt": "During a sorted pair search, left and right currently point to indexes 2 and 8.\n\nA learner says that indexes 2 through 8 form the algorithm's current output range. What is the best correction?",
    "options": [
      {
        "id": "interval_is_remaining_search_region",
        "text": "The interval is primarily the remaining search region; the current pair candidate consists only of the two endpoint positions.",
        "isCorrect": true
      },
      {
        "id": "all_indexes_are_output",
        "text": "The learner is correct because every index between two pointers automatically belongs to the answer.",
        "isCorrect": false
      },
      {
        "id": "interior_only_is_output",
        "text": "Only indexes strictly between left and right form the output; the endpoints are excluded.",
        "isCorrect": false
      },
      {
        "id": "range_is_fixed_window",
        "text": "The interval is a fixed-size window because both pointers currently have fixed values.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The algorithm evaluates a pair and uses the surrounding interval to describe candidates not yet eliminated.",
      "mentalModelCorrection": "A search region and a returned contiguous range are different abstractions, even when both are written with two boundaries.",
      "mistakeTypes": [
        "search_interval_assumed_to_be_output_range"
      ],
      "nextAction": "Identify which positions directly participate in the current result calculation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-sorting-contiguity-output-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_subsequence_relative_order",
    "secondarySkillAtomIds": [
      "distinguish_subsequence_from_sorted_selection",
      "evaluate_sorting_against_order_contract"
    ],
    "type": "mistake_review",
    "prompt": "A task asks whether the original array contains a subsequence with a required property. The chosen elements need not be adjacent, but their original relative order matters.\n\nA candidate sorts the array before searching. What is wrong?",
    "options": [
      {
        "id": "sorting_changes_subsequence_order",
        "text": "Sorting may create an order of values that never occurred as a subsequence in the original input.",
        "isCorrect": true
      },
      {
        "id": "subsequence_requires_adjacency",
        "text": "Sorting is wrong because every subsequence must consist of adjacent elements.",
        "isCorrect": false
      },
      {
        "id": "sorting_removes_non_adjacent_values",
        "text": "Sorting is wrong because it removes all pairs of non-adjacent values.",
        "isCorrect": false
      },
      {
        "id": "subsequence_is_value_only",
        "text": "Sorting is always safe because a subsequence depends only on which values exist.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A subsequence preserves original left-to-right order even though it may skip positions.",
      "mentalModelCorrection": "Non-contiguous does not mean order-independent.",
      "mistakeTypes": [
        "sorting_before_original_subsequence_search"
      ],
      "nextAction": "Check separately whether the answer requires adjacency and whether it requires relative order.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sorting-contiguity-output-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_subarray_subsequence_and_pair",
    "secondarySkillAtomIds": [
      "classify_output_structure",
      "preserve_required_input_relationships"
    ],
    "type": "single_choice",
    "prompt": "Which distinction between a subarray, a subsequence, and a pair is precise?",
    "options": [
      {
        "id": "correct_structure_distinction",
        "text": "A subarray uses consecutive original indexes; a subsequence preserves original order but may skip indexes; a general pair may require neither adjacency nor a particular order unless stated.",
        "isCorrect": true
      },
      {
        "id": "all_are_contiguous",
        "text": "All three require consecutive indexes because each can be represented using two endpoints.",
        "isCorrect": false
      },
      {
        "id": "subsequence_is_sorted",
        "text": "A subsequence is any set of values after sorting them into ascending order.",
        "isCorrect": false
      },
      {
        "id": "pair_includes_interior",
        "text": "A pair includes both selected values and every original value between their indexes.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The three contracts preserve different amounts of the input's positional structure.",
      "mentalModelCorrection": "Strategy choice depends on exactly which positional relationships the answer must retain.",
      "mistakeTypes": [
        "output_structure_terms_conflated"
      ],
      "nextAction": "Translate each contract into explicit constraints on indexes.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-sorting-contiguity-output-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "prioritize_output_contract_before_strategy_cost",
    "secondarySkillAtomIds": [
      "reject_big_o_first_strategy_selection",
      "validate_candidate_result_form"
    ],
    "type": "solution_comparison",
    "prompt": "Two approaches are proposed:\n\n- Approach A has an attractive asymptotic bound but returns two independent values.\n- Approach B is designed to return one contiguous original range, as required by the task.\n\nHow should they be compared first?",
    "options": [
      {
        "id": "validate_contract_before_speed",
        "text": "First verify whether each approach can produce the required contiguous result; compare efficiency only among approaches that satisfy the contract.",
        "isCorrect": true
      },
      {
        "id": "choose_faster_regardless",
        "text": "Choose Approach A immediately because asymptotic speed is more important than output form.",
        "isCorrect": false
      },
      {
        "id": "two_values_define_range",
        "text": "Treat Approach A as valid because any two returned values implicitly define a contiguous range.",
        "isCorrect": false
      },
      {
        "id": "all_two_pointer_outputs_equivalent",
        "text": "Both outputs are interchangeable because both approaches can use two pointers.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The approaches produce different kinds of answers.",
      "mentalModelCorrection": "Complexity cannot compensate for returning an object that does not satisfy the problem's required result form.",
      "mistakeTypes": [
        "big_o_chosen_before_output_contract"
      ],
      "nextAction": "Reject contract-incompatible strategies before ranking the remaining candidates.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-sorting-contiguity-output-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_duplicate_index_identity",
    "secondarySkillAtomIds": [
      "preserve_original_indexes_through_sorting",
      "enforce_distinct_pair_indexes"
    ],
    "type": "edge_case_drill",
    "prompt": "The input is:\n\nvalues = [4, 1, 4]\n\nThe task requires returning original indexes of two distinct elements summing to 8.\n\nWhat must a sorting-based representation preserve?",
    "options": [
      {
        "id": "both_four_source_indexes",
        "text": "The separate original indexes of both occurrences of 4, so the result can return indexes 0 and 2.",
        "isCorrect": true
      },
      {
        "id": "one_value_record",
        "text": "Only one record for the numeric value 4, because equal values are interchangeable.",
        "isCorrect": false
      },
      {
        "id": "sorted_positions",
        "text": "Only the two positions occupied by 4 in the sorted array.",
        "isCorrect": false
      },
      {
        "id": "contiguous_interval",
        "text": "Every original index between the two occurrences, because the output is a range.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Equal values may correspond to distinct valid source elements.",
      "mentalModelCorrection": "Value equality does not erase index identity when the output contract requires original positions.",
      "mistakeTypes": [
        "duplicate_source_indexes_collapsed_after_sorting"
      ],
      "nextAction": "Represent each occurrence as a separate value-index record.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-contrast-sorting-contiguity-output-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "select_strategy_from_order_and_output_constraints",
    "secondarySkillAtomIds": [
      "evaluate_sorting_against_contiguity",
      "distinguish_pair_range_and_prefix_outputs"
    ],
    "type": "solution_comparison",
    "prompt": "Consider three tasks on an array:\n\nA. Return one pair of values whose sum equals a target; original indexes are irrelevant.\n\nB. Return the longest qualifying contiguous range from the original array.\n\nC. Remove rejected values in place and return the retained prefix length.\n\nWhich strategy mapping is most appropriate at a high level?",
    "options": [
      {
        "id": "pair_window_compaction",
        "text": "A may sort and use opposite-end pair search; B should preserve original order and may use a sliding window; C suggests same-direction read/write compaction.",
        "isCorrect": true
      },
      {
        "id": "sort_all_three",
        "text": "Sort all three inputs first because ordering always improves pointer algorithms.",
        "isCorrect": false
      },
      {
        "id": "window_all_three",
        "text": "Use sliding window for all three because each implementation can contain left and right indexes.",
        "isCorrect": false
      },
      {
        "id": "opposite_ends_all_three",
        "text": "Use opposite-end pointers for all three because every result can be described using two positions.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The tasks require three different result structures: selected values, an original contiguous range, and a rewritten prefix.",
      "mentalModelCorrection": "Strategy follows the semantic contract and preserved relationships, not a preference for one pointer shape.",
      "mistakeTypes": [
        "strategy_selected_without_output_contract_analysis"
      ],
      "nextAction": "Classify the required output before deciding whether input reordering or range maintenance is legal.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
