export const filteringOutputContractQuestions = [
  {
    "acceptableApproachIds": [],
    "constraintSignal": "Both approaches can preserve order, but they satisfy different output and mutation contracts.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "stable_read_write_boundary"
    ],
    "feedbackModel": {
      "decisionSignal": "Order preservation alone does not decide between the approaches; the mutation/output contract does.",
      "distractorExplanations": {
        "sort_order": "Sorting is a separate order-changing operation; both compared approaches already preserve accepted-value order.",
        "frequency_counts": "Frequency counts solve multiplicity questions, not output/mutation contract selection.",
        "all_pairs": "All-pairs comparison is unrelated to choosing the output contract for filtering."
      },
      "mentalModelCorrection": "First check whether the input may be mutated, then choose in-place compaction or a new output buffer.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Separate order constraints from output-contract constraints.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_contract",
    "prompt": "Two solutions both preserve the order of accepted values: one builds a new result array, the other writes accepted values back into the input with a write boundary. Which extra constraint decides between them?",
    "reasonSignal": "The decisive constraint is whether the task asks for in-place mutation or a new returned array.",
    "rejectedApproachIds": [
      "sort_then_filter",
      "swap_with_end",
      "nested_shift"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary",
      "preserve_relative_order"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "mutation_output_contract",
        "feedback": "If the task requires in-place mutation, use the input buffer and a write boundary. If it asks for a new array or preserved input, build separate output.",
        "id": "alg-prod-array-string-002-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "mutation_output_contract",
            "text": "Whether the task requires in-place mutation or asks for a new returned array."
          },
          {
            "id": "sort_order",
            "text": "Whether the accepted values should be sorted."
          },
          {
            "id": "frequency_counts",
            "text": "Whether values need full frequency counts."
          },
          {
            "id": "all_pairs",
            "text": "Whether every pair of values must be compared."
          }
        ],
        "prompt": "Choose the deciding constraint.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_contract"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Choose between in-place and new-output filtering",
    "trackId": "algorithms",
    "type": "output_contract_reasoning"
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "Remove zeroes from an array while keeping the remaining numbers in the same order.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "stable_order_preserved"
    ],
    "feedbackModel": {
      "decisionSignal": "The same-order requirement is the key constraint because it rules out arbitrary swaps and sorting.",
      "distractorExplanations": {
        "sort_values": "Sorting violates the promise that the remaining values stay in their original relative order.",
        "count_zeroes_only": "Knowing how many zeroes exist does not produce the ordered remaining values by itself.",
        "compare_all_pairs": "This task filters values. It does not compare every value against every other value."
      },
      "mentalModelCorrection": "When order must stay the same, think stable scan first and only then choose the exact mutation strategy.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Treat preserve order as a decision signal, not as a minor implementation detail.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_relative_order",
    "prompt": "A problem asks you to remove all zeroes from an array while keeping the remaining numbers in the same order. Which constraint should shape the approach?",
    "reasonSignal": "The relative order of the kept values must stay the same, so the compaction must be stable.",
    "rejectedApproachIds": [
      "sort_values",
      "count_zeroes_only",
      "all_pairs"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_order_constraint"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "preserve_order",
        "feedback": "The same-order constraint is what points you toward a stable scan or read/write boundary.",
        "id": "alg-prod-array-string-006-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "preserve_order",
            "text": "The relative order of non-zero values must stay the same."
          },
          {
            "id": "sort_values",
            "text": "The values should be sorted after zeroes are removed."
          },
          {
            "id": "count_zeroes_only",
            "text": "Only the number of zeroes matters."
          },
          {
            "id": "compare_all_pairs",
            "text": "Every number must be compared with every other number."
          }
        ],
        "prompt": "Choose the constraint that should guide the design.",
        "status": "active",
        "testedSkillAtomIds": [
          "preserve_relative_order"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "preserve_relative_order",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Spot the stable-order signal",
    "trackId": "algorithms",
    "type": "strategy_choice"
  },
  {
    "complexityExplanation": "The two explanations use different accounting conventions. Counting output memory includes the returned array; auxiliary-space-only analysis may exclude required output storage.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The difference comes from whether the returned output array is counted as extra memory.",
      "distractorExplanations": {
        "one_must_be_wrong": "Both can be valid if they explicitly use different space accounting conventions.",
        "sorting_changes_space": "Sorting is unrelated to this output-versus-auxiliary memory distinction.",
        "input_size_unknown": "The input size can be known while the convention still differs."
      },
      "mentalModelCorrection": "Name the memory accounting convention before comparing space claims.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Ask whether output memory is counted or excluded from auxiliary space.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_space",
    "prompt": "A filtering task returns a new array. Why might one explanation say `O(n)` space while another says `O(1)` auxiliary space excluding output?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_output_contract",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "different_space_conventions",
        "feedback": "Counting output space includes the returned array, giving O(n). Auxiliary-space-only analysis may exclude the required output and count only small variables.",
        "id": "alg-prod-array-string-007-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose why both explanations can appear.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_space"
        ],
        "type": "single_choice",
        "options": [
          {
            "id": "different_space_conventions",
            "text": "They use different conventions: counted output space includes the returned array, auxiliary space may exclude it."
          },
          {
            "id": "one_must_be_wrong",
            "text": "One explanation must always be wrong because space has only one convention."
          },
          {
            "id": "sorting_changes_space",
            "text": "The difference only happens when the output is sorted."
          },
          {
            "id": "input_size_unknown",
            "text": "The difference happens because the input length is unknown."
          }
        ]
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_space",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Separate output space from auxiliary-space convention",
    "trackId": "algorithms",
    "type": "complexity_reasoning"
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "Remove rejected values from an array, but the remaining values do not need to preserve their original order.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "order_can_be_discarded"
    ],
    "feedbackModel": {
      "decisionSignal": "Dropping the order constraint unlocks mutation strategies that would otherwise be invalid.",
      "distractorExplanations": {
        "sorting_required": "Order being irrelevant does not force sorting. It only makes more direct mutations legal.",
        "nested_required": "Removing values still does not require all-pairs comparison.",
        "frequency_required": "A frequency map is only needed when the result depends on counts by value."
      },
      "mentalModelCorrection": "First ask which constraints were relaxed. Then look for the cheaper strategies that become valid.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Compare what changes when order matters versus when it does not.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_order_constraint",
    "prompt": "You need to remove rejected values from an array. What changes if the problem says the remaining values do not need to preserve their original order?",
    "reasonSignal": "Swapping rejected values with the end can become valid because stability is no longer required.",
    "rejectedApproachIds": [
      "sorting_required",
      "nested_required",
      "frequency_required"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "preserve_relative_order"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "swap_allowed",
        "feedback": "Once order no longer matters, end-swaps can be acceptable because they avoid stable shifting or copying.",
        "id": "alg-prod-array-string-011-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "swap_allowed",
            "text": "Swapping rejected values with the end may become acceptable."
          },
          {
            "id": "sorting_required",
            "text": "Sorting becomes required."
          },
          {
            "id": "nested_required",
            "text": "A nested loop becomes required."
          },
          {
            "id": "frequency_required",
            "text": "A frequency map becomes required."
          }
        ],
        "prompt": "Choose what actually changes.",
        "status": "active",
        "testedSkillAtomIds": [
          "reason_about_order_constraint"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_order_constraint",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Relaxing order changes the valid mutation",
    "trackId": "algorithms",
    "type": "constraint_change"
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "Remove rejected values in-place while preserving the order of the kept values.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "stable_compaction"
    ],
    "feedbackModel": {
      "decisionSignal": "Preserve order plus in-place mutation rules out the swap-with-end shortcut.",
      "distractorExplanations": {
        "too_much_memory": "The flaw is order stability, not extra memory: swapping with the end can be done in place.",
        "sort_after": "Sorting after removal creates sorted order, not the original relative order.",
        "count_then_rebuild": "Counting is not required for stable removal, and rebuilding from counts can lose original relative order."
      },
      "mentalModelCorrection": "Stable order is a product constraint, not a nice-to-have implementation preference.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "When you consider a mutation trick, check whether it preserves the exact output order the prompt requires.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-019",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_relative_order",
    "prompt": "A learner wants to remove rejected values by swapping each rejected value with the last unchecked value. Why is that wrong when the kept values must stay in their original order?",
    "reasonSignal": "Swapping with the end changes the relative order of kept values, so the compaction is no longer stable.",
    "rejectedApproachIds": [
      "swap_with_end",
      "sort_after",
      "count_then_rebuild"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_order_constraint"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "swap_with_end",
        "feedback": "The flaw is that swapping with the end can scramble the relative order of values that should be kept. The issue is constraint fit, not memory.",
        "id": "alg-prod-array-string-019-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "swap_with_end",
            "text": "Swapping with the end can move later kept values before earlier kept values."
          },
          {
            "id": "too_much_memory",
            "text": "Swapping with the end is wrong because it always requires O(n) extra memory."
          },
          {
            "id": "sort_after",
            "text": "Sorting after removal restores the original relative order."
          },
          {
            "id": "count_then_rebuild",
            "text": "Counting values is required before any rejected entries can be removed."
          }
        ],
        "prompt": "Choose the statement that identifies the flaw.",
        "status": "active",
        "testedSkillAtomIds": [
          "preserve_relative_order"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "preserve_relative_order",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject the swap-with-end trap when order matters",
    "trackId": "algorithms",
    "type": "strategy_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The write boundary already points at the next free slot in the compacted kept prefix, so the next accepted value should be written there immediately.",
      "distractorExplanations": {
        "write_next_plus_one": "Skipping the current boundary leaves a gap inside the compacted prefix.",
        "write_read_index": "Leaving the value at the read index does not compact it into the next kept slot.",
        "buffer_elsewhere": "A separate buffer can work for a new-output contract, but it misses the in-place write-boundary invariant."
      },
      "mentalModelCorrection": "Read indexes discover values. The write boundary marks the next slot where the kept prefix should grow.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "Trace what `write` means after each accepted and rejected value: it is the next open kept slot, not the last written slot.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-020",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_write_boundary",
    "prompt": "During stable in-place compaction, the kept prefix already occupies indexes 0 and 1, so `write = 2`. The read index is 4 and `arr[4]` should be kept. Where should `arr[4]` be written?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "write_at_boundary",
        "feedback": "The write boundary marks the next open slot in the kept prefix, so the accepted value belongs at index 2.",
        "id": "alg-prod-array-string-020-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "off_by_one"
        ],
        "options": [
          {
            "id": "write_at_boundary",
            "text": "Write it at index 2."
          },
          {
            "id": "write_next_plus_one",
            "text": "Write it at index 3 so index 2 remains a boundary marker."
          },
          {
            "id": "write_read_index",
            "text": "Leave it at index 4 because that is where it was read."
          },
          {
            "id": "buffer_elsewhere",
            "text": "Store it in a new output array until all reads finish."
          }
        ],
        "prompt": "Choose the correct write location.",
        "status": "active",
        "testedSkillAtomIds": [
          "trace_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace the write-boundary invariant",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "The task returns a new filtered array instead of mutating the original input in place.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "new_output_buffer"
    ],
    "feedbackModel": {
      "decisionSignal": "The requested output shape changes the space tradeoff, even if the filtering scan is still linear.",
      "distractorExplanations": {
        "must_be_in_place": "The prompt explicitly asks for a new result array, so reusing the input is not required.",
        "sort_first": "Sorting is unrelated unless the prompt asks for a sorted result.",
        "all_pairs": "Filtering each value still does not require comparing every pair."
      },
      "mentalModelCorrection": "Match the algorithm to the output contract: in-place compaction and returning a new array are different promises.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Read the output requirement before finalizing both the mutation strategy and the space claim.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-025",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_contract",
    "prompt": "A filtering task says, \"return a new array containing the accepted values in order.\" Which statement best matches that contract?",
    "reasonSignal": "Building a new output array is valid here, and it changes the extra-space claim compared with in-place compaction.",
    "rejectedApproachIds": [
      "must_be_in_place",
      "sort_first",
      "all_pairs"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_output_space"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "new_output_space",
        "feedback": "Returning a new ordered result means the algorithm can append accepted values into a separate output array.",
        "id": "alg-prod-array-string-025-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "new_output_space",
            "text": "Returning a new array is valid and usually uses output space proportional to the accepted values."
          },
          {
            "id": "must_be_in_place",
            "text": "The solution must still overwrite the input in place."
          },
          {
            "id": "sort_first",
            "text": "The accepted values must be sorted before they are returned."
          },
          {
            "id": "all_pairs",
            "text": "Returning values requires comparing every pair of elements."
          }
        ],
        "prompt": "Choose the statement that matches the contract.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_contract"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Match the filtering approach to the output contract",
    "trackId": "algorithms",
    "type": "output_contract_reasoning"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The kept prefix before write must contain exactly the accepted values seen so far, in original order.",
      "distractorExplanations": {
        "all_scanned_values": "Rejected values are scanned but must not be included in the kept prefix.",
        "last_read_index": "Read tracks inspection progress; write tracks the kept-prefix boundary.",
        "physical_length": "The physical array length usually stays fixed while the logical kept prefix grows."
      },
      "mentalModelCorrection": "The write boundary is not just an index; it marks the end of a prefix that already satisfies the output contract.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "Before moving read or write, restate what the prefix before write contains.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-029",
    "learningStage": "foundations",
    "primarySkillAtomId": "use_read_write_boundary",
    "prompt": "In stable in-place compaction, which invariant should remain true after each scanned element?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "trace_write_boundary",
      "preserve_relative_order"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "accepted_prefix_in_order",
        "feedback": "Indexes before write contain exactly the accepted values encountered so far, preserving their original relative order.",
        "id": "alg-prod-array-string-029-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "off_by_one"
        ],
        "options": [
          {
            "id": "accepted_prefix_in_order",
            "text": "Indexes before `write` contain exactly the accepted values seen so far, in original order."
          },
          {
            "id": "all_scanned_values",
            "text": "Indexes before `write` contain every scanned value, accepted or rejected."
          },
          {
            "id": "last_read_index",
            "text": "`write` always equals the last read index."
          },
          {
            "id": "physical_length",
            "text": "`write` always equals the physical length of the array."
          }
        ],
        "prompt": "Choose the invariant.",
        "status": "active",
        "testedSkillAtomIds": [
          "use_read_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_read_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "State the write-boundary invariant",
    "trackId": "algorithms",
    "type": "state_selection"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "feedbackModel": {
      "decisionSignal": "Stable in-place compaction reads each element once and keeps only a write boundary, so it is linear time and constant auxiliary space.",
      "mentalModelCorrection": "In-place does not mean no variables. It means the algorithm does not allocate storage proportional to input size.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "For in-place mutation, separate the input buffer from small pointer/counter variables.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-031",
    "learningStage": "foundations",
    "primarySkillAtomId": "use_read_write_boundary",
    "prompt": "An array removes rejected values in-place while preserving the relative order of kept values using a read index and a write boundary. What time and auxiliary space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "space": "O(1)",
          "time": "O(n)"
        },
        "feedback": "The algorithm scans once and only stores indexes or counters, so it uses O(n) time and O(1) auxiliary space.",
        "id": "alg-prod-array-string-031-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and auxiliary space.",
        "status": "active",
        "testedSkillAtomIds": [
          "use_read_write_boundary"
        ],
        "type": "complexity_pair"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_read_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Estimate stable in-place compaction cost",
    "trackId": "algorithms",
    "type": "complexity_check",
    "complexityExplanation": "Stable in-place compaction scans each element once and keeps only constant auxiliary state such as read and write indexes."
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "Remove rejected values in-place while preserving the relative order of accepted values.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "stable_read_write_boundary"
    ],
    "feedbackModel": {
      "decisionSignal": "In-place plus preserve order points to a read index and a write boundary.",
      "distractorExplanations": {
        "swap_with_end": "Swapping with the end can be in-place, but it can scramble the kept values.",
        "sort_then_filter": "Sorting changes the original relative order that must be preserved.",
        "new_output_only": "A new output array can preserve order, but it does not match the in-place contract."
      },
      "mentalModelCorrection": "For stable in-place filtering, read every value and write accepted values at the next open kept slot.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Read the mutation contract and the order contract before choosing the filtering strategy.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-100",
    "learningStage": "foundations",
    "primarySkillAtomId": "use_read_write_boundary",
    "prompt": "An array must remove rejected values in-place while preserving the relative order of accepted values. Which approach matches both constraints?",
    "reasonSignal": "A read/write boundary compacts accepted values in the original order without allocating a separate result.",
    "rejectedApproachIds": [
      "swap_with_end",
      "sort_then_filter",
      "new_output_only"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "preserve_relative_order"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "read_write_boundary",
        "feedback": "A read index scans the original values, and the write boundary grows the kept prefix in order.",
        "id": "alg-prod-array-string-100-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "read_write_boundary",
            "text": "Scan with a read index and write accepted values at a write boundary."
          },
          {
            "id": "swap_with_end",
            "text": "Swap rejected values with the last unchecked value."
          },
          {
            "id": "sort_then_filter",
            "text": "Sort the array, then remove rejected values."
          },
          {
            "id": "new_output_only",
            "text": "Always build a separate output array."
          }
        ],
        "prompt": "Choose the approach that satisfies both constraints.",
        "status": "active",
        "testedSkillAtomIds": [
          "use_read_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_read_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Choose stable in-place filtering",
    "trackId": "algorithms",
    "type": "strategy_choice"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The write pointer marks the next open slot after the kept prefix.",
      "distractorExplanations": {
        "last_read": "The read pointer tracks what has been inspected, not where the next kept value belongs.",
        "last_rejected": "Rejected values do not define the end of the kept prefix.",
        "physical_length": "The physical array length may be unchanged while the logical kept length changes."
      },
      "mentalModelCorrection": "The invariant is about the compacted prefix, not the original read position.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "Before moving pointers, restate what the kept prefix contains and where the next accepted value goes.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-101",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_write_boundary",
    "prompt": "During in-place stable filtering, accepted values already occupy indexes `0..2`. What does `write = 3` mean?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "next_kept_slot",
        "feedback": "`write = 3` means the next accepted value should be written at index 3.",
        "id": "alg-prod-array-string-101-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "off_by_one"
        ],
        "options": [
          {
            "id": "next_kept_slot",
            "text": "Index 3 is the next open slot in the kept prefix."
          },
          {
            "id": "last_read",
            "text": "Index 3 is the last value that was read."
          },
          {
            "id": "last_rejected",
            "text": "Index 3 is the most recent rejected value."
          },
          {
            "id": "physical_length",
            "text": "Index 3 is the physical length of the array."
          }
        ],
        "prompt": "Choose the invariant represented by `write`.",
        "status": "active",
        "testedSkillAtomIds": [
          "trace_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Name the next kept slot",
    "trackId": "algorithms",
    "type": "state_selection"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Rejected values are skipped by the write boundary; only the read pointer advances.",
      "distractorExplanations": {
        "write_rejected": "Writing a rejected value grows the kept prefix with data that should not be kept.",
        "decrement_write": "The write boundary marks the next open kept slot; rejection does not move it backward.",
        "restart_scan": "A rejected value does not require restarting the scan."
      },
      "mentalModelCorrection": "The read pointer always progresses through input; the write pointer moves only when a value is accepted.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "Trace accepted and rejected branches separately.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-102",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_write_boundary",
    "prompt": "In stable in-place filtering, `read = 5` points to a rejected value and `write = 3`. What should happen to the write boundary?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "write_stays",
        "feedback": "Rejected values are not written into the kept prefix, so `write` stays at 3 while the scan advances.",
        "id": "alg-prod-array-string-102-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "off_by_one"
        ],
        "options": [
          {
            "id": "write_stays",
            "text": "`write` stays at 3."
          },
          {
            "id": "write_rejected",
            "text": "Write the rejected value at index 3."
          },
          {
            "id": "decrement_write",
            "text": "Move `write` backward to 2."
          },
          {
            "id": "restart_scan",
            "text": "Restart the scan from index 0."
          }
        ],
        "prompt": "Choose the correct rejected-value branch.",
        "status": "active",
        "testedSkillAtomIds": [
          "trace_write_boundary"
        ],
        "type": "trace_next_step"
      }
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "Because the value is rejected, it does not extend the kept prefix. The read pointer advances, but `write` remains the next open kept slot.",
        "id": "alg-prod-array-string-102-trace-001",
        "order": 1,
        "state": [
          "read = 5 points to a rejected value",
          "write = 3"
        ]
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace rejection in stable compaction",
    "trackId": "algorithms",
    "type": "trace_next_step"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Accepted values are written at the current boundary, then the boundary advances.",
      "distractorExplanations": {
        "advance_without_write": "Advancing without writing loses the accepted value.",
        "write_at_read_only": "Leaving the value at the read index may fail to compact the kept prefix.",
        "write_twice": "Writing twice duplicates the accepted value."
      },
      "mentalModelCorrection": "Accepting a value grows the kept prefix by exactly one slot.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "For accepted values, perform two steps: write at boundary, then increment boundary.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-103",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_write_boundary",
    "prompt": "In stable in-place filtering, `read = 6` points to an accepted value and `write = 3`. What is the correct update?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "write_then_increment",
        "feedback": "Write the accepted value at index 3, then increment `write` to 4.",
        "id": "alg-prod-array-string-103-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "off_by_one"
        ],
        "options": [
          {
            "id": "write_then_increment",
            "text": "Write at index 3, then move `write` to 4."
          },
          {
            "id": "advance_without_write",
            "text": "Move `write` to 4 without writing."
          },
          {
            "id": "write_at_read_only",
            "text": "Leave the value only at index 6."
          },
          {
            "id": "write_twice",
            "text": "Write it at indexes 3 and 4."
          }
        ],
        "prompt": "Choose the accepted-value update.",
        "status": "active",
        "testedSkillAtomIds": [
          "trace_write_boundary"
        ],
        "type": "trace_next_step"
      }
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "The accepted value extends the compacted prefix. It is written to the next open kept slot, then that slot is no longer open.",
        "id": "alg-prod-array-string-103-trace-001",
        "order": 1,
        "state": [
          "read = 6 points to an accepted value",
          "write = 3"
        ]
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Trace acceptance in stable compaction",
    "trackId": "algorithms",
    "type": "trace_next_step"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The write boundary after the scan is the logical length of the compacted kept prefix.",
      "distractorExplanations": {
        "original_length": "The physical input length may still include stale rejected values after the kept prefix.",
        "last_read": "The last read index only says how far scanning went, not how many values were kept.",
        "first_rejected": "The first rejected index is not the final kept length after later accepted values can be written."
      },
      "mentalModelCorrection": "In-place filtering often returns a logical length because the physical buffer can contain leftover data beyond the kept prefix.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_trace_algorithm"
      ],
      "nextAction": "After compaction, read the output from indexes `0` through `write - 1`.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-104",
    "learningStage": "foundations",
    "primarySkillAtomId": "use_read_write_boundary",
    "prompt": "After in-place filtering finishes, `write = 4`. What does that usually represent?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "trace_write_boundary",
      "distinguish_output_contract"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "logical_length",
        "feedback": "`write` is the logical length of the compacted kept prefix.",
        "id": "alg-prod-array-string-104-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_trace_algorithm"
        ],
        "options": [
          {
            "id": "logical_length",
            "text": "The kept prefix has logical length 4."
          },
          {
            "id": "original_length",
            "text": "The original array length must be 4."
          },
          {
            "id": "last_read",
            "text": "The last read index was 4."
          },
          {
            "id": "first_rejected",
            "text": "The first rejected value was at index 4."
          }
        ],
        "prompt": "Choose what the final write boundary represents.",
        "status": "active",
        "testedSkillAtomIds": [
          "use_read_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_read_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Interpret final write as logical length",
    "trackId": "algorithms",
    "type": "state_selection"
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "The prompt asks to return a new array, not mutate the input buffer.",
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "expectedApproachIds": [
      "new_output_buffer"
    ],
    "feedbackModel": {
      "decisionSignal": "Return a new array is an output-contract signal that permits a separate result buffer.",
      "distractorExplanations": {
        "must_mutate_input": "The prompt does not require reusing the input buffer.",
        "swap_with_end": "Swapping with the end changes order and targets an in-place mutation style.",
        "sort_first": "Sorting is unrelated unless sorted output is explicitly requested."
      },
      "mentalModelCorrection": "Output contract controls whether the algorithm should mutate the input or build a separate result.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Underline return a new array and choose the memory model accordingly.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-105",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_contract",
    "prompt": "A filtering task says: \"return a new array of accepted values in the same order.\" Which output contract is being requested?",
    "reasonSignal": "The task asks for a separate result array rather than in-place compaction.",
    "rejectedApproachIds": [
      "must_mutate_input",
      "swap_with_end",
      "sort_first"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_output_space"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "new_output_buffer",
        "feedback": "The words return a new array mean a separate output buffer matches the contract.",
        "id": "alg-prod-array-string-105-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "new_output_buffer",
            "text": "Build and return a separate output array."
          },
          {
            "id": "must_mutate_input",
            "text": "Overwrite the input in place."
          },
          {
            "id": "swap_with_end",
            "text": "Swap rejected values with the end."
          },
          {
            "id": "sort_first",
            "text": "Sort the accepted values before returning them."
          }
        ],
        "prompt": "Choose the output contract.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_contract"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize a new-output filtering contract",
    "trackId": "algorithms",
    "type": "output_contract_reasoning"
  },
  {
    "complexityExplanation": "Building a new filtered output still scans the input once. If output memory is counted, the returned array can grow with the number of accepted values.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(n)",
    "expectedTimeComplexity": "O(n)",
    "feedbackModel": {
      "decisionSignal": "A new returned array changes the space claim when output memory is counted.",
      "mentalModelCorrection": "Separate time for scanning from memory for the returned output.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Ask whether output memory is counted before calling the space constant.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-106",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_space",
    "prompt": "A filter returns a new array of accepted values. If output memory is counted, what time and space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_output_contract",
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(n)"
        },
        "feedback": "The input is scanned once, and the returned output can grow linearly.",
        "id": "alg-prod-array-string-106-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and counted output space.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_space"
        ],
        "type": "complexity_pair"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_space",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Estimate counted output space for filtering",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "complexityExplanation": "Stable in-place compaction scans once and uses only pointer state. The output is represented inside the input buffer.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n)",
    "feedbackModel": {
      "decisionSignal": "The input buffer is reused, so only constant auxiliary pointer state is needed.",
      "mentalModelCorrection": "In-place filtering still uses variables; it just avoids auxiliary storage proportional to input size.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Distinguish auxiliary pointer state from a newly allocated output array.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-107",
    "learningStage": "foundations",
    "primarySkillAtomId": "use_read_write_boundary",
    "prompt": "A filter compacts accepted values into the original array using read/write pointers. What time and auxiliary space should you expect?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n)",
          "space": "O(1)"
        },
        "feedback": "The algorithm scans once and uses only constant auxiliary state such as read and write indexes.",
        "id": "alg-prod-array-string-107-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "prompt": "Choose the expected time and auxiliary space.",
        "status": "active",
        "testedSkillAtomIds": [
          "use_read_write_boundary"
        ],
        "type": "complexity_pair"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_read_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Estimate in-place filtering cost",
    "trackId": "algorithms",
    "type": "complexity_check"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Swap-with-end is only compatible with filtering when original order is not required.",
      "distractorExplanations": {
        "stable_order": "Stable order is the condition that makes swap-with-end invalid.",
        "new_output": "A new output array is a different contract, not the specific reason swap-with-end becomes legal.",
        "frequency_needed": "Filtering rejected values does not require counting by value."
      },
      "mentalModelCorrection": "Mutation shortcuts depend on whether order is part of the output contract.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Before using swap tricks, decide whether stability is required.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-108",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_order_constraint",
    "prompt": "When can swapping a rejected value with the last unchecked value be acceptable in a filtering task?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "preserve_relative_order"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "order_not_required",
        "feedback": "Swap-with-end can be acceptable when the kept values do not need to preserve their original order.",
        "id": "alg-prod-array-string-108-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "order_not_required",
            "text": "When the output does not need to preserve original order."
          },
          {
            "id": "stable_order",
            "text": "When stable order is explicitly required."
          },
          {
            "id": "new_output",
            "text": "Only when the task returns a new array."
          },
          {
            "id": "frequency_needed",
            "text": "Only when a frequency table is also used."
          }
        ],
        "prompt": "Choose the condition that makes swap-with-end viable.",
        "status": "active",
        "testedSkillAtomIds": [
          "reason_about_order_constraint"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_order_constraint",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Allow swap-with-end only without stability",
    "trackId": "algorithms",
    "type": "constraint_change"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Repeated shifting preserves order but repeats work for many rejected values.",
      "distractorExplanations": {
        "read_write_boundary": "A read/write boundary preserves order with one pass.",
        "swap_with_end": "Swap-with-end is efficient but breaks stability when order matters.",
        "sort_first": "Sorting does not preserve the original relative order.",
        "shift_each_time": "Repeated shifting can preserve order, but it repeats suffix movement and is less efficient than a read/write boundary."
      },
      "mentalModelCorrection": "Preserving order does not require shifting the suffix after every rejection.",
      "mistakeTypes": [
        "complexity_mismatch",
        "wrong_approach"
      ],
      "nextAction": "Look for a one-pass stable compaction instead of local shifts after every deletion.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-109",
    "learningStage": "foundations",
    "primarySkillAtomId": "use_read_write_boundary",
    "prompt": "A learner removes each rejected value by immediately shifting all later values left. What is the better stable in-place idea?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "preserve_relative_order",
      "compare_complexity_tradeoffs"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "read_write_boundary",
        "feedback": "A read/write boundary writes accepted values forward once, preserving order without repeated suffix shifts.",
        "id": "alg-prod-array-string-109-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "read_write_boundary",
            "text": "Use a read index and write accepted values to the next kept slot."
          },
          {
            "id": "shift_each_time",
            "text": "Shift all later values after every rejection."
          },
          {
            "id": "swap_with_end",
            "text": "Swap each rejected value with the end even when order matters."
          },
          {
            "id": "sort_first",
            "text": "Sort the array first."
          }
        ],
        "prompt": "Choose the better stable compaction strategy.",
        "status": "active",
        "testedSkillAtomIds": [
          "use_read_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_read_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Replace repeated shifts with write-boundary compaction",
    "trackId": "algorithms",
    "type": "solution_comparison"
  },
  {
    "complexityExplanation": "Immediate shifting can move many elements for many rejected values. In the worst case, those repeated shifts create quadratic time.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedSpaceComplexity": "O(1)",
    "expectedTimeComplexity": "O(n^2)",
    "feedbackModel": {
      "decisionSignal": "The mistaken approach repeats suffix movement after each rejection.",
      "mentalModelCorrection": "Measure the cost of the actual mutation pattern, not just the number of values being removed.",
      "mistakeTypes": [
        "complexity_mismatch",
        "wrong_approach"
      ],
      "nextAction": "Contrast repeated shifting with one-pass read/write compaction.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-110",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_complexity_tradeoffs",
    "prompt": "A mistaken in-place filter shifts all later elements left every time it removes a rejected value. What worst-case time and auxiliary space can that mistaken approach use?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "derive_time_complexity",
      "derive_space_complexity"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": {
          "time": "O(n^2)",
          "space": "O(1)"
        },
        "feedback": "Repeated suffix shifts can create O(n^2) time, even though the mutation uses only constant auxiliary space.",
        "id": "alg-prod-array-string-110-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "wrong_approach"
        ],
        "prompt": "Choose the cost of the mistaken shifting approach.",
        "status": "active",
        "testedSkillAtomIds": [
          "compare_complexity_tradeoffs"
        ],
        "type": "complexity_pair"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "compare_complexity_tradeoffs",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_time_complexity",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "derive_space_complexity",
        "role": "secondary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Measure repeated-shift filtering cost",
    "trackId": "algorithms",
    "type": "complexity_reasoning"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A stable filter must keep accepted values in the same relative order as the input.",
      "distractorExplanations": {
        "same_values_any_order": "That ignores stability; the values are present but order can be wrong.",
        "same_length_only": "Length does not prove the right values or order.",
        "sorted_result": "Sorted order is not the original relative order unless the input already had that order.",
        "six_five_four": "This reverses the kept values instead of preserving their original relative order.",
        "four_six_five": "This moves 6 before 5, so it does not preserve the kept values in input order."
      },
      "mentalModelCorrection": "Stable means relative order of kept values is preserved.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Compare the kept sequence against the original order after rejected values are removed.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-111",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_relative_order",
    "prompt": "Input is `[4, 0, 5, 0, 6]`. A stable filter removes zeroes. Which output satisfies stability?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_order_constraint"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "four_five_six",
        "feedback": "The non-zero values appear in the original order: 4, then 5, then 6.",
        "id": "alg-prod-array-string-111-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "four_five_six",
            "text": "`[4, 5, 6]`"
          },
          {
            "id": "six_five_four",
            "text": "`[6, 5, 4]`"
          },
          {
            "id": "four_six_five",
            "text": "`[4, 6, 5]`"
          },
          {
            "id": "sorted_result",
            "text": "`[5, 4, 6]`"
          }
        ],
        "prompt": "Choose the stable output.",
        "status": "active",
        "testedSkillAtomIds": [
          "preserve_relative_order"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "preserve_relative_order",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Identify stable filtered output",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A swap-with-end filter can move a later kept value before an earlier kept value.",
      "distractorExplanations": {
        "memory_issue": "Swap-with-end is in-place; the flaw here is order, not memory.",
        "count_issue": "The task is not about value frequencies.",
        "boundary_issue": "The example targets stability, not index bounds.",
        "all_rejected": "All rejected values do not expose whether kept values stay in their original relative order.",
        "none_rejected": "If nothing is rejected, swap-with-end never has to move a later kept value into an earlier slot.",
        "single_value": "A single value has no kept-value ordering relationship to break."
      },
      "mentalModelCorrection": "Use a small counterexample where end-swapping visibly breaks the relative order of kept values.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Pick test cases that reveal order scrambling, not merely removal.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-112",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_relative_order",
    "prompt": "A learner removes rejected values by swapping them with the end, but the kept values must stay in order. Which test case best exposes the flaw?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_order_constraint"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "later_kept_moved_before_earlier",
        "feedback": "Swapping `0` with the end can move `3` before `2`, breaking the original relative order of kept values.",
        "id": "alg-prod-array-string-112-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "later_kept_moved_before_earlier",
            "text": "`[1, 0, 2, 3]` with `0` rejected."
          },
          {
            "id": "all_rejected",
            "text": "`[0, 0]` with `0` rejected."
          },
          {
            "id": "none_rejected",
            "text": "`[1, 2]` with no rejected values."
          },
          {
            "id": "single_value",
            "text": "`[0]` with `0` rejected."
          }
        ],
        "prompt": "Choose the order-sensitive counterexample.",
        "status": "active",
        "testedSkillAtomIds": [
          "preserve_relative_order"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "preserve_relative_order",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Pick a counterexample for unstable end-swapping",
    "trackId": "algorithms",
    "type": "test_case_selection"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A new output buffer preserves the input, while in-place compaction overwrites part of it.",
      "distractorExplanations": {
        "same_contract": "They can produce the same kept sequence, but they promise different mutation behavior.",
        "in_place_preserves_input": "In-place compaction is allowed to overwrite positions in the input buffer.",
        "new_output_mutates_required": "Returning a new array does not require mutating the original input."
      },
      "mentalModelCorrection": "Two approaches can be logically equivalent in values but different in mutation contract.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Ask whether callers expect the original input to remain unchanged.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-113",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_contract",
    "prompt": "What is the main contract difference between returning a new filtered array and compacting the input in place?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_output_space"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "mutation_contract_differs",
        "feedback": "A new filtered array leaves the input untouched, while in-place compaction can overwrite the input buffer.",
        "id": "alg-prod-array-string-113-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "mutation_contract_differs",
            "text": "The mutation contract differs: new output preserves input, in-place can overwrite it."
          },
          {
            "id": "same_contract",
            "text": "They are exactly the same contract."
          },
          {
            "id": "in_place_preserves_input",
            "text": "In-place compaction must preserve every original slot unchanged."
          },
          {
            "id": "new_output_mutates_required",
            "text": "Returning a new array requires mutating the original input."
          }
        ],
        "prompt": "Choose the contract difference.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_contract"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Separate new-output and in-place contracts",
    "trackId": "algorithms",
    "type": "output_contract_reasoning"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "If the prompt says preserve the original input, in-place mutation violates the contract.",
      "distractorExplanations": {
        "in_place_allowed": "In-place mutation conflicts with preserving the original input.",
        "swap_allowed": "Swapping is also mutation, so it does not preserve the original input.",
        "sort_input": "Sorting the input mutates or changes the original order."
      },
      "mentalModelCorrection": "Preserve input is an output-contract constraint, not a performance hint.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Check whether the input is allowed to be mutated before choosing in-place strategies.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-114",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_contract",
    "prompt": "A filtering task says the original input must remain unchanged. Which approach matches that contract?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "distinguish_output_space"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "new_output",
        "feedback": "If the original input must remain unchanged, build and return a separate output array.",
        "id": "alg-prod-array-string-114-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "new_output",
            "text": "Build a new array for accepted values."
          },
          {
            "id": "in_place_allowed",
            "text": "Overwrite the input with accepted values."
          },
          {
            "id": "swap_allowed",
            "text": "Swap rejected values with the end of the input."
          },
          {
            "id": "sort_input",
            "text": "Sort the input before filtering."
          }
        ],
        "prompt": "Choose the contract-preserving approach.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_contract"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Preserve input by returning a new array",
    "trackId": "algorithms",
    "type": "output_contract_reasoning"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "If the API returns a length after in-place compaction, values beyond that length are not part of the logical result.",
      "distractorExplanations": {
        "inspect_full_array": "The full physical array may contain stale values after the logical kept prefix.",
        "must_clear_tail": "Clearing the tail can be optional unless the contract requires it.",
        "tail_is_sorted": "No sorted-tail promise follows from compaction."
      },
      "mentalModelCorrection": "In-place APIs often define the result by a prefix length, not by the entire physical buffer.",
      "mistakeTypes": [
        "constraint_ignored",
        "edge_case_missed"
      ],
      "nextAction": "Use the returned length to slice the meaningful prefix.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-115",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_contract",
    "prompt": "An in-place filter returns `newLength = 3`. What part of the array represents the result?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "prefix_only",
        "feedback": "The logical result is the prefix from index 0 through index 2.",
        "id": "alg-prod-array-string-115-check",
        "mistakeTypes": [
          "constraint_ignored",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "prefix_only",
            "text": "Only the first 3 positions."
          },
          {
            "id": "inspect_full_array",
            "text": "The entire physical array."
          },
          {
            "id": "must_clear_tail",
            "text": "Only the values after index 3."
          },
          {
            "id": "tail_is_sorted",
            "text": "The sorted suffix after the prefix."
          }
        ],
        "prompt": "Choose how to read the in-place result.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_contract"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Read only the compacted prefix",
    "trackId": "algorithms",
    "type": "output_contract_reasoning"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "All-rejected input leaves the kept prefix empty, so the write boundary stays at 0.",
      "distractorExplanations": {
        "original_length": "Original length counts scanned values, not kept values.",
        "one_kept": "No value is accepted, so no kept slot is filled.",
        "negative_length": "Logical length cannot become negative."
      },
      "mentalModelCorrection": "The write boundary counts accepted values, not rejected values.",
      "mistakeTypes": [
        "edge_case_missed",
        "cannot_trace_algorithm"
      ],
      "nextAction": "Trace the all-rejected case to verify the initial write boundary is still valid.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-116",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_write_boundary",
    "prompt": "A stable in-place filter starts with `write = 0`. Every input value is rejected. What is the final logical length?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "zero",
        "feedback": "No accepted values are written, so `write` remains 0 and the kept prefix is empty.",
        "id": "alg-prod-array-string-116-check",
        "mistakeTypes": [
          "edge_case_missed",
          "cannot_trace_algorithm"
        ],
        "options": [
          {
            "id": "zero",
            "text": "0."
          },
          {
            "id": "original_length",
            "text": "The original input length."
          },
          {
            "id": "one_kept",
            "text": "1, because the first slot is reserved."
          },
          {
            "id": "negative_length",
            "text": "-1."
          }
        ],
        "prompt": "Choose the final logical length.",
        "status": "active",
        "testedSkillAtomIds": [
          "trace_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "edge_case_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Handle all-rejected in-place filtering",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "All-accepted input moves the write boundary once per value and preserves the full array.",
      "distractorExplanations": {
        "zero": "Zero would mean no values were accepted.",
        "one": "The write boundary advances for every accepted value, not just the first.",
        "needs_new_array": "A new array is not required for in-place compaction when mutation is allowed."
      },
      "mentalModelCorrection": "The final write boundary equals the number of accepted values.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "edge_case_missed"
      ],
      "nextAction": "Trace all-accepted and all-rejected cases as boundary cases for write movement.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-117",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_write_boundary",
    "prompt": "A stable in-place filter scans a 5-element array and every value is accepted. What is the final write boundary?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "five",
        "feedback": "Each accepted value advances `write` once, so after 5 accepted values the boundary is 5.",
        "id": "alg-prod-array-string-117-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "edge_case_missed"
        ],
        "options": [
          {
            "id": "five",
            "text": "5."
          },
          {
            "id": "zero",
            "text": "0."
          },
          {
            "id": "one",
            "text": "1."
          },
          {
            "id": "needs_new_array",
            "text": "There is no write boundary unless a new array is allocated."
          }
        ],
        "prompt": "Choose the final write boundary.",
        "status": "active",
        "testedSkillAtomIds": [
          "trace_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Handle all-accepted in-place filtering",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "In a new-output filter, accepted values are appended in scan order.",
      "distractorExplanations": {
        "preallocate_and_sort": "Sorting violates the original-order output requirement.",
        "write_into_input": "Writing into the input is in-place compaction, not a new-output contract.",
        "append_rejected": "Rejected values should not enter the output."
      },
      "mentalModelCorrection": "For returned arrays, the output grows by appending accepted values as they are encountered.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Trace the output array separately from the input buffer.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-118",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_output_contract",
    "prompt": "A task returns a new filtered array while preserving order. What should happen when the scan sees an accepted value?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "preserve_relative_order",
      "distinguish_output_space"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "append_to_output",
        "feedback": "Appending accepted values as they are encountered preserves their original relative order.",
        "id": "alg-prod-array-string-118-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "append_to_output",
            "text": "Append it to the result array."
          },
          {
            "id": "preallocate_and_sort",
            "text": "Store it for sorting later."
          },
          {
            "id": "write_into_input",
            "text": "Overwrite the input buffer."
          },
          {
            "id": "append_rejected",
            "text": "Append rejected values too."
          }
        ],
        "prompt": "Choose the new-output update.",
        "status": "active",
        "testedSkillAtomIds": [
          "distinguish_output_contract"
        ],
        "type": "trace_next_step"
      }
    ],
    "status": "active",
    "stepByStepTrace": [
      {
        "description": "A new-output filter grows the result by appending accepted values in the same order as the scan.",
        "id": "alg-prod-array-string-118-trace-001",
        "order": 1,
        "state": [
          "The scan sees an accepted value under a return-new-array contract."
        ]
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_output_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Trace append behavior for new-output filtering",
    "trackId": "algorithms",
    "type": "trace_next_step"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Filtering is value selection; sorting is an extra transformation that changes output order.",
      "distractorExplanations": {
        "sort_restores_order": "Sorting creates sorted order, not original relative order.",
        "sort_required": "Filtering does not require sorting unless the prompt asks for sorted output.",
        "frequency_required": "Counts are unrelated unless the filtering condition depends on frequency."
      },
      "mentalModelCorrection": "Do not add transformations that are not in the output contract.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Check whether sorted output is explicitly requested before sorting.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-119",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_relative_order",
    "prompt": "A filtering task says accepted values must remain in their original relative order. Why is sorting before returning the result wrong?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "reason_about_order_constraint"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "sorting_changes_relative_order",
        "feedback": "Sorting can reorder accepted values, violating the original-relative-order constraint.",
        "id": "alg-prod-array-string-119-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "sorting_changes_relative_order",
            "text": "Sorting can change the relative order of accepted values."
          },
          {
            "id": "sort_restores_order",
            "text": "Sorting restores the original relative order."
          },
          {
            "id": "sort_required",
            "text": "Sorting is always required before filtering."
          },
          {
            "id": "frequency_required",
            "text": "Filtering always requires frequency counts."
          }
        ],
        "prompt": "Choose why sorting violates the contract.",
        "status": "active",
        "testedSkillAtomIds": [
          "preserve_relative_order"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "preserve_relative_order",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject sorting when original order matters",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The read pointer must continue across the whole input even when write lags behind.",
      "distractorExplanations": {
        "stop_when_write_lags": "A lagging write pointer only means some values were rejected; unscanned values may still be accepted.",
        "read_equals_write_only": "Read and write are equal only while every scanned value has been accepted.",
        "reset_write": "Resetting the write boundary would discard the kept prefix."
      },
      "mentalModelCorrection": "Read tracks coverage of the original input; write tracks growth of the output prefix.",
      "mistakeTypes": [
        "cannot_trace_algorithm",
        "off_by_one"
      ],
      "nextAction": "Treat read and write as two different invariants, not interchangeable indexes.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-120",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_write_boundary",
    "prompt": "In stable compaction, `read = 6` and `write = 3`. What does it mean that `write` is behind `read`?",
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "some_rejected",
        "feedback": "`write` lagging behind `read` means fewer accepted values have been written than values scanned, usually because some values were rejected.",
        "id": "alg-prod-array-string-120-check",
        "mistakeTypes": [
          "cannot_trace_algorithm",
          "off_by_one"
        ],
        "options": [
          {
            "id": "some_rejected",
            "text": "Some scanned values were rejected, so the kept prefix is shorter than the scanned prefix."
          },
          {
            "id": "stop_when_write_lags",
            "text": "The algorithm must stop immediately."
          },
          {
            "id": "read_equals_write_only",
            "text": "The pointers must always be equal."
          },
          {
            "id": "reset_write",
            "text": "The write boundary should reset to 0."
          }
        ],
        "prompt": "Choose what the pointer relationship means.",
        "status": "active",
        "testedSkillAtomIds": [
          "trace_write_boundary"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_write_boundary",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_trace_algorithm",
        "role": "mistake_type"
      }
    ],
    "title": "Separate read progress from write progress",
    "trackId": "algorithms",
    "type": "state_selection"
  },
  {
    "acceptableApproachIds": [],
    "constraintSignal": "The operation should partition values in place, and preserving original order is not required.",
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "expectedApproachIds": [
      "unstable_in_place_partition"
    ],
    "feedbackModel": {
      "decisionSignal": "In-place partition without stability allows two-ended mutation strategies.",
      "distractorExplanations": {
        "stable_required": "Stability is explicitly not required here, so a stable read/write compaction is not the only valid path.",
        "new_output_required": "Returning a new array is not required by an in-place partition contract.",
        "sort_required": "Partitioning by predicate does not require sorting all values."
      },
      "mentalModelCorrection": "When order is relaxed, cheaper mutation patterns become valid, but they are not valid under stable-output contracts.",
      "mistakeTypes": [
        "constraint_ignored",
        "wrong_approach"
      ],
      "nextAction": "Identify whether the task says stable, preserve order, or order does not matter.",
      "result": "diagnostic"
    },
    "id": "alg-prod-array-string-121",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_order_constraint",
    "prompt": "A task says to partition accepted and rejected values in-place, and the order of values does not matter. Which statement is correct?",
    "reasonSignal": "Unstable in-place partitioning can be valid because the order constraint is relaxed.",
    "rejectedApproachIds": [
      "stable_required",
      "new_output_required",
      "sort_required"
    ],
    "roadmapNodeId": "arrays_and_strings",
    "secondarySkillAtomIds": [
      "preserve_relative_order",
      "use_read_write_boundary"
    ],
    "staticMicroChecks": [
      {
        "correctAnswer": "unstable_partition_allowed",
        "feedback": "When order does not matter, an unstable in-place partition can be valid.",
        "id": "alg-prod-array-string-121-check",
        "mistakeTypes": [
          "constraint_ignored",
          "wrong_approach"
        ],
        "options": [
          {
            "id": "unstable_partition_allowed",
            "text": "An unstable in-place partition can be valid."
          },
          {
            "id": "stable_required",
            "text": "Stable order is still required."
          },
          {
            "id": "new_output_required",
            "text": "A new output array is required."
          },
          {
            "id": "sort_required",
            "text": "The entire array must be sorted."
          }
        ],
        "prompt": "Choose what the relaxed order constraint allows.",
        "status": "active",
        "testedSkillAtomIds": [
          "reason_about_order_constraint"
        ],
        "type": "single_choice"
      }
    ],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "arrays_and_strings",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_order_constraint",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "in_place_update",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Allow unstable partition when order is relaxed",
    "trackId": "algorithms",
    "type": "constraint_change"
  }
];
