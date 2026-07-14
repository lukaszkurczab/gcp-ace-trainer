import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const mergeAndIntersectionOfSortedSequencesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "interpret_unconsumed_source_pointers",
    "secondarySkillAtomIds": [
      "coordinate_two_sorted_inputs",
      "state_merge_pointer_invariant"
    ],
    "type": "single_choice",
    "prompt": "In a two-input merge or intersection scan, what should pointers i and j represent?",
    "options": [
      {
        "id": "first_unconsumed_items",
        "text": "The first unconsumed item in each sorted input.",
        "isCorrect": true
      },
      {
        "id": "last_emitted_items",
        "text": "The last item already emitted from each input.",
        "isCorrect": false
      },
      {
        "id": "arbitrary_candidates",
        "text": "Any two positions whose values seem promising.",
        "isCorrect": false
      },
      {
        "id": "output_positions",
        "text": "The next two positions to be written in the output.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "All positions before each pointer have already been consumed according to the output contract.",
      "mentalModelCorrection": "The pointers divide each source into a consumed prefix and an unconsumed suffix.",
      "mistakeTypes": [
        "sorted_source_pointer_semantics_mismatch"
      ],
      "nextAction": "State what is known about every element before and at each pointer.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_merge_pointer_by_smaller_value",
    "secondarySkillAtomIds": [
      "merge_sorted_sequences",
      "preserve_sorted_output"
    ],
    "type": "single_choice",
    "prompt": "During a stable ascending merge:\n\nleft[i] = 3\nright[j] = 7\n\nWhat should happen next?",
    "options": [
      {
        "id": "emit_left_advance_i",
        "text": "Emit 3 and advance i, because 3 is the smallest remaining source item.",
        "isCorrect": true
      },
      {
        "id": "emit_right_advance_j",
        "text": "Emit 7 and advance j.",
        "isCorrect": false
      },
      {
        "id": "advance_both",
        "text": "Advance both pointers because the values were compared.",
        "isCorrect": false
      },
      {
        "id": "discard_three",
        "text": "Discard 3 because it is smaller than the other candidate.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sorted suffixes guarantee that no later item in either source can precede the smaller current candidate.",
      "mentalModelCorrection": "A merge consumes the smaller current item, not both compared items.",
      "mistakeTypes": [
        "merge_advances_both_on_inequality"
      ],
      "nextAction": "Emit only the source item proven to be next in sorted order.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_equal_values_in_stable_merge",
    "secondarySkillAtomIds": [
      "preserve_cross_input_stability",
      "choose_tie_policy"
    ],
    "type": "single_choice",
    "prompt": "A stable merge gives items from the left input precedence when comparison keys are equal.\n\nIf left[i].key === right[j].key, what should the algorithm do?",
    "options": [
      {
        "id": "emit_left_first",
        "text": "Emit left[i] and advance i.",
        "isCorrect": true
      },
      {
        "id": "emit_right_first",
        "text": "Emit right[j] and advance j.",
        "isCorrect": false
      },
      {
        "id": "discard_one_duplicate",
        "text": "Emit one arbitrary item and discard the other as a duplicate.",
        "isCorrect": false
      },
      {
        "id": "advance_both_without_output",
        "text": "Advance both pointers without emitting either item.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The tie policy is part of the stability contract.",
      "mentalModelCorrection": "Equal sort keys do not imply duplicate elimination; both source items may still belong in the merged output.",
      "mistakeTypes": [
        "stable_merge_tie_policy_ignored"
      ],
      "nextAction": "Define which source wins ties and still preserve the other item for a later step.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "append_remaining_merge_suffix",
    "secondarySkillAtomIds": [
      "handle_exhausted_source",
      "preserve_unconsumed_items"
    ],
    "type": "mistake_review",
    "prompt": "A merge loop stops as soon as either input is exhausted:\n\nwhile (i < left.length && j < right.length) {\n  // emit one current item\n}\n\nThe function then returns immediately. What can be lost?",
    "options": [
      {
        "id": "remaining_suffix",
        "text": "The unconsumed suffix of the input that still has items remaining.",
        "isCorrect": true
      },
      {
        "id": "already_emitted_prefix",
        "text": "The prefix already written to the result.",
        "isCorrect": false
      },
      {
        "id": "only_duplicate_values",
        "text": "Only duplicate values, which never belong in a merge.",
        "isCorrect": false
      },
      {
        "id": "nothing",
        "text": "Nothing, because exhausting either input proves both are exhausted.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The loop condition guarantees only that at least one input ended.",
      "mentalModelCorrection": "A standard merge must append the remaining sorted suffix from the non-exhausted source.",
      "mistakeTypes": [
        "merge_suffix_dropped"
      ],
      "nextAction": "After the joint loop, consume each source's remaining suffix.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_sorted_merge",
    "secondarySkillAtomIds": [
      "coordinate_two_sorted_inputs",
      "append_remaining_merge_suffix"
    ],
    "type": "edge_case_drill",
    "prompt": "Merge in ascending order:\n\nleft = [1, 4, 8]\nright = [2, 3, 9]\n\nWhat is the result?",
    "options": [
      {
        "id": "one_two_three_four_eight_nine",
        "text": "[1, 2, 3, 4, 8, 9]",
        "isCorrect": true
      },
      {
        "id": "one_four_eight_two_three_nine",
        "text": "[1, 4, 8, 2, 3, 9]",
        "isCorrect": false
      },
      {
        "id": "two_three_nine",
        "text": "[2, 3, 9]",
        "isCorrect": false
      },
      {
        "id": "one_two_three_four",
        "text": "[1, 2, 3, 4]",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "At each step, the smaller first unconsumed item is emitted.",
      "mentalModelCorrection": "The final result includes every item from both inputs, including the final suffix.",
      "mistakeTypes": [
        "sorted_merge_trace_mismatch"
      ],
      "nextAction": "Track i, j, and the output after each comparison.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_intersection_pointer_movement",
    "secondarySkillAtomIds": [
      "eliminate_smaller_nonmatching_value",
      "intersect_sorted_sequences"
    ],
    "type": "single_choice",
    "prompt": "During sorted intersection:\n\na[i] = 2\nb[j] = 5\n\nWhat should happen?",
    "options": [
      {
        "id": "advance_i",
        "text": "Advance i, because 2 cannot match 5 or any later value in b.",
        "isCorrect": true
      },
      {
        "id": "advance_j",
        "text": "Advance j, because 5 is larger.",
        "isCorrect": false
      },
      {
        "id": "advance_both",
        "text": "Advance both because the current values do not match.",
        "isCorrect": false
      },
      {
        "id": "emit_two",
        "text": "Emit 2 because it is the smaller value.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Every later value in b is at least 5, so the current 2 can never find a match.",
      "mentalModelCorrection": "On inequality, sorted intersection advances only the pointer at the smaller value.",
      "mistakeTypes": [
        "intersection_advances_both_on_inequality"
      ],
      "nextAction": "Discard only the current value proven unable to match any remaining value.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "advance_both_on_intersection_match",
    "secondarySkillAtomIds": [
      "consume_matched_occurrences",
      "intersect_sorted_sequences"
    ],
    "type": "single_choice",
    "prompt": "During multiset intersection:\n\na[i] = 4\nb[j] = 4\n\nWhat should happen after emitting one 4?",
    "options": [
      {
        "id": "advance_both",
        "text": "Advance both pointers, because one occurrence from each source has been consumed.",
        "isCorrect": true
      },
      {
        "id": "advance_i_only",
        "text": "Advance only i so the same occurrence in b can match repeatedly.",
        "isCorrect": false
      },
      {
        "id": "advance_j_only",
        "text": "Advance only j so the same occurrence in a can match repeatedly.",
        "isCorrect": false
      },
      {
        "id": "keep_both",
        "text": "Keep both pointers unchanged and emit 4 again.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "A multiset match pairs one available occurrence from each input.",
      "mentalModelCorrection": "Both matched source occurrences must be consumed exactly once.",
      "mistakeTypes": [
        "matched_occurrence_reused"
      ],
      "nextAction": "Treat a successful equality as consumption from both sources.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sorted-merge-intersection-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_set_and_multiset_intersection",
    "secondarySkillAtomIds": [
      "handle_duplicate_runs",
      "select_intersection_output_contract"
    ],
    "type": "solution_comparison",
    "prompt": "Intersect:\n\na = [2, 2, 2, 5]\nb = [2, 2, 7]\n\nWhich outputs correspond to the two contracts?",
    "options": [
      {
        "id": "set_one_multiset_two",
        "text": "Set intersection: [2]. Multiset intersection: [2, 2].",
        "isCorrect": true
      },
      {
        "id": "both_one",
        "text": "Both contracts return [2].",
        "isCorrect": false
      },
      {
        "id": "both_three",
        "text": "Both contracts return [2, 2, 2].",
        "isCorrect": false
      },
      {
        "id": "set_two_multiset_one",
        "text": "Set intersection: [2, 2]. Multiset intersection: [2].",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Set semantics emit a shared value once; multiset semantics emit it according to shared occurrence availability.",
      "mentalModelCorrection": "Duplicate-skipping behavior must follow the requested output contract.",
      "mistakeTypes": [
        "set_and_multiset_intersection_conflated"
      ],
      "nextAction": "Decide whether the result represents shared values or shared occurrences.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sorted-merge-intersection-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_accidental_multiset_deduplication",
    "secondarySkillAtomIds": [
      "preserve_duplicate_matches",
      "review_intersection_duplicate_skipping"
    ],
    "type": "mistake_review",
    "prompt": "The required output is multiset intersection. After emitting a matched value, the implementation skips every equal value in both inputs.\n\nWhy can this be wrong?",
    "options": [
      {
        "id": "drops_additional_shared_occurrences",
        "text": "It may discard additional occurrences that should also be emitted up to the smaller duplicate count.",
        "isCorrect": true
      },
      {
        "id": "multiset_requires_unique_values",
        "text": "It is correct because multiset output must contain each value only once.",
        "isCorrect": false
      },
      {
        "id": "duplicates_cannot_match",
        "text": "Duplicate values are never eligible for intersection.",
        "isCorrect": false
      },
      {
        "id": "must_skip_only_smaller_input",
        "text": "The only correction is to skip duplicates in exactly one arbitrary input.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Each equal pair of available occurrences may contribute another output item.",
      "mentalModelCorrection": "Skipping an entire duplicate run implements distinct set semantics unless multiplicity has already been counted separately.",
      "mistakeTypes": [
        "multiset_intersection_accidentally_deduplicated"
      ],
      "nextAction": "Advance once per matched occurrence under multiset semantics.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sorted-merge-intersection-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "deduplicate_set_intersection_output",
    "secondarySkillAtomIds": [
      "skip_duplicate_runs_after_match",
      "preserve_distinct_result_contract"
    ],
    "type": "mistake_review",
    "prompt": "The required output is a distinct set intersection.\n\nThe implementation emits one value whenever a[i] === b[j], then advances both pointers by one without any duplicate handling.\n\nWhat can happen?",
    "options": [
      {
        "id": "same_value_emitted_multiple_times",
        "text": "A shared duplicate run may cause the same value to be emitted repeatedly.",
        "isCorrect": true
      },
      {
        "id": "all_matches_are_lost",
        "text": "No equal value can ever be emitted.",
        "isCorrect": false
      },
      {
        "id": "suffix_is_always_dropped",
        "text": "The implementation necessarily loses the final suffix of both inputs.",
        "isCorrect": false
      },
      {
        "id": "output_becomes_unsorted",
        "text": "Advancing both pointers makes the output unsorted.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Equal runs may contain several matched occurrence pairs for one distinct value.",
      "mentalModelCorrection": "Set intersection needs an explicit policy that emits a shared key once and then moves beyond its duplicate run.",
      "mistakeTypes": [
        "set_intersection_duplicate_output"
      ],
      "nextAction": "After emitting a distinct match, skip all remaining equal occurrences in both inputs.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "stop_intersection_when_one_input_ends",
    "secondarySkillAtomIds": [
      "reason_about_unmatchable_suffix",
      "distinguish_merge_from_intersection_suffix"
    ],
    "type": "single_choice",
    "prompt": "Why may a sorted intersection algorithm stop when either input is exhausted?",
    "options": [
      {
        "id": "no_partner_remains",
        "text": "Every remaining item in the other input lacks any unconsumed partner to match.",
        "isCorrect": true
      },
      {
        "id": "remaining_suffix_is_already_output",
        "text": "The remaining suffix has already been emitted implicitly.",
        "isCorrect": false
      },
      {
        "id": "suffix_values_are_duplicates",
        "text": "All remaining values must be duplicates.",
        "isCorrect": false
      },
      {
        "id": "both_inputs_always_end_together",
        "text": "Sorted inputs always become exhausted on the same iteration.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Intersection requires one occurrence or member from each source.",
      "mentalModelCorrection": "Unlike merge, intersection does not append an unmatched suffix.",
      "mistakeTypes": [
        "merge_suffix_rule_applied_to_intersection"
      ],
      "nextAction": "Ask whether unmatched source items belong to the requested output relation.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-sorted-merge-intersection-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_empty_sorted_input",
    "secondarySkillAtomIds": [
      "reason_about_merge_edge_cases",
      "reason_about_intersection_edge_cases"
    ],
    "type": "edge_case_drill",
    "prompt": "One input is empty:\n\na = []\nb = [1, 2, 3]\n\nWhich statement is correct?",
    "options": [
      {
        "id": "merge_b_intersection_empty",
        "text": "The merge is [1, 2, 3], while the intersection is empty.",
        "isCorrect": true
      },
      {
        "id": "both_empty",
        "text": "Both merge and intersection are empty.",
        "isCorrect": false
      },
      {
        "id": "both_b",
        "text": "Both merge and intersection are [1, 2, 3].",
        "isCorrect": false
      },
      {
        "id": "invalid_input",
        "text": "Neither operation is defined when one input is empty.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Merge preserves all source items; intersection preserves only shared items.",
      "mentalModelCorrection": "The two operations have different suffix and empty-input contracts.",
      "mistakeTypes": [
        "merge_and_intersection_empty_case_conflated"
      ],
      "nextAction": "Apply the output relation directly when one source contributes no items.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sorted-merge-intersection-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_internal_source_stability",
    "secondarySkillAtomIds": [
      "understand_stable_merge",
      "preserve_relative_order_within_input"
    ],
    "type": "single_choice",
    "prompt": "The two sorted inputs are consecutive runs from one original sequence, so every item in the left run originally preceded every item in the right run. What does a stable merge require?",
    "options": [
      {
        "id": "preserve_relative_order",
        "text": "Preserve relative order within each run and emit the left-run item first when comparison keys are equal.",
        "isCorrect": true
      },
      {
        "id": "deduplicate_equal_keys",
        "text": "Collapse all records with equal keys into one record.",
        "isCorrect": false
      },
      {
        "id": "right_wins_ties",
        "text": "Always emit the right-run item first when keys are equal.",
        "isCorrect": false
      },
      {
        "id": "sort_equal_items_by_identity",
        "text": "Reorder equal-key records by object identity.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The left run represents records that appeared earlier in the original sequence.",
      "mentalModelCorrection": "Stable merge preserves the original relative order of equal-key records; for consecutive runs, the left run must win cross-run ties.",
      "mistakeTypes": [
        "stable_merge_original_order_not_preserved"
      ],
      "nextAction": "Tie the equality branch to the original ordering relationship between the two runs.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sorted-merge-intersection-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "diagnose_advancing_both_on_merge_inequality",
    "secondarySkillAtomIds": [
      "preserve_unconsumed_merge_candidate",
      "review_merge_pointer_updates"
    ],
    "type": "mistake_review",
    "prompt": "A merge implementation does this on every comparison:\n\nif (left[i] <= right[j]) {\n  result.push(left[i]);\n} else {\n  result.push(right[j]);\n}\n\ni++;\nj++;\n\nWhat is the bug?",
    "options": [
      {
        "id": "unemitted_item_is_skipped",
        "text": "The pointer for the source whose item was not emitted also advances, so that unconsumed item is lost.",
        "isCorrect": true
      },
      {
        "id": "both_must_move_faster",
        "text": "Both pointers should advance by two instead.",
        "isCorrect": false
      },
      {
        "id": "comparison_must_use_equality_only",
        "text": "Merge should compare only whether the values are equal.",
        "isCorrect": false
      },
      {
        "id": "result_must_be_set",
        "text": "The output must be a Set rather than an array.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Only one source item is consumed and emitted per iteration.",
      "mentalModelCorrection": "A pointer advances exactly when its current source item has been consumed.",
      "mistakeTypes": [
        "merge_unconsumed_item_skipped"
      ],
      "nextAction": "Tie each pointer update to emission from its own source.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sorted-merge-intersection-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_multiset_sorted_intersection",
    "secondarySkillAtomIds": [
      "consume_matched_occurrences",
      "eliminate_smaller_nonmatching_value"
    ],
    "type": "edge_case_drill",
    "prompt": "Under multiset semantics, intersect:\n\na = [1, 2, 2, 4, 6]\nb = [2, 2, 2, 4, 5]\n\nWhat is the result?",
    "options": [
      {
        "id": "two_two_four",
        "text": "[2, 2, 4]",
        "isCorrect": true
      },
      {
        "id": "two_four",
        "text": "[2, 4]",
        "isCorrect": false
      },
      {
        "id": "two_two_two_four",
        "text": "[2, 2, 2, 4]",
        "isCorrect": false
      },
      {
        "id": "one_two_two_four",
        "text": "[1, 2, 2, 4]",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "The shared count of 2 is min(2, 3), and 4 appears once in both inputs.",
      "mentalModelCorrection": "Multiset intersection consumes matched copies from both sorted sources.",
      "mistakeTypes": [
        "multiset_sorted_intersection_trace_mismatch"
      ],
      "nextAction": "Advance both pointers once for each emitted occurrence.",
      "result": "diagnostic"
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intermediate",
    "id": "alg-sorted-merge-intersection-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "state_sorted_two_input_scan_invariant",
    "secondarySkillAtomIds": [
      "prove_consumed_prefix_correctness",
      "coordinate_two_sorted_inputs"
    ],
    "type": "invariant_identification",
    "prompt": "Which invariant best supports correctness for a merge or intersection scan over two sorted inputs?",
    "options": [
      {
        "id": "prefixes_consumed_suffixes_unprocessed",
        "text": "All items before i and j have been fully handled according to the output contract, and i and j identify the smallest remaining candidates in their respective suffixes.",
        "isCorrect": true
      },
      {
        "id": "pointers_have_equal_indexes",
        "text": "The two pointers always have the same numeric index.",
        "isCorrect": false
      },
      {
        "id": "both_move_every_iteration",
        "text": "Both pointers advance on every iteration.",
        "isCorrect": false
      },
      {
        "id": "output_contains_only_equal_values",
        "text": "The output always contains only values that appeared in both inputs, even during a merge.",
        "isCorrect": false
      }
    ],
    "feedbackModel": {
      "decisionSignal": "Sorted suffixes make the two current items the only candidates that can be next consumed.",
      "mentalModelCorrection": "The invariant connects consumed prefixes, unconsumed suffixes, and the exact output relation being implemented.",
      "mistakeTypes": [
        "sorted_two_input_invariant_incomplete"
      ],
      "nextAction": "State what has been consumed and why the current pointer values are the next relevant candidates.",
      "result": "diagnostic"
    }
  }
] as const satisfies readonly AlgorithmQuestion[];
