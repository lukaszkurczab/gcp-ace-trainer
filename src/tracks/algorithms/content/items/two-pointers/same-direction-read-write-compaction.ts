export const sameDirectionReadWriteCompactionQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-001",
    learningStage: "foundations",
    primarySkillAtomId: "state_read_write_compaction_invariant",
    secondarySkillAtomIds: [
      "interpret_accepted_output_prefix",
      "interpret_processed_input_prefix",
    ],
    type: "invariant_identification",
    prompt: `A stable read/write compaction scans left to right.

Before processing values[read], which invariant is precise?`,
    options: [
      {
        id: "accepted_output_from_processed_prefix",
        text: "Positions [0, write) contain exactly the accepted output from the processed input prefix [0, read), in original relative order.",
        isCorrect: true,
      },
      {
        id: "all_processed_values",
        text: "Positions [0, write) contain every value from [0, read), including rejected values.",
        isCorrect: false,
      },
      {
        id: "unprocessed_output",
        text: "Positions [0, write) contain values that have not yet been inspected.",
        isCorrect: false,
      },
      {
        id: "suffix_is_final",
        text: "Positions [write, values.length) already contain the final rejected output.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "read measures input progress, while write measures accepted output progress.",
      mentalModelCorrection:
        "The compacted prefix is derived only from the processed prefix and contains accepted values in encounter order.",
      mistakeTypes: ["read_write_compaction_invariant_mismatch"],
      nextAction:
        "State separately what has been read and what has been written.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-002",
    learningStage: "foundations",
    primarySkillAtomId: "advance_write_after_acceptance",
    secondarySkillAtomIds: [
      "place_accepted_value",
      "maintain_compacted_prefix",
    ],
    type: "subgoal_ordering",
    prompt:
      "When values[read] satisfies the filter predicate, which operation order preserves the compaction invariant?",
    options: [
      {
        id: "write_value_then_advance",
        text: "Assign values[write] = values[read], then increment write.",
        isCorrect: true,
      },
      {
        id: "advance_then_write",
        text: "Increment write first, then assign to values[write].",
        isCorrect: false,
      },
      {
        id: "advance_without_write",
        text: "Increment write without placing the accepted value.",
        isCorrect: false,
      },
      {
        id: "move_read_backward",
        text: "Decrement read so the accepted value can be inspected again.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "write identifies the next free position in the accepted output prefix.",
      mentalModelCorrection:
        "The current destination must be filled before the produced-output boundary advances.",
      mistakeTypes: ["write_advanced_before_accepted_value_placement"],
      nextAction:
        "Treat write as the next destination, not the last completed destination.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-003",
    learningStage: "foundations",
    primarySkillAtomId: "keep_write_fixed_for_rejected_value",
    secondarySkillAtomIds: [
      "distinguish_input_progress_from_output_progress",
      "avoid_gaps_in_compacted_prefix",
    ],
    type: "single_choice",
    prompt:
      "What should happen to write when values[read] is rejected by the filter predicate?",
    options: [
      {
        id: "write_unchanged",
        text: "write remains unchanged because no output item was produced.",
        isCorrect: true,
      },
      {
        id: "write_increments",
        text: "write increments because every processed input consumes an output position.",
        isCorrect: false,
      },
      {
        id: "write_decrements",
        text: "write decrements because a rejected value removes a previously accepted item.",
        isCorrect: false,
      },
      {
        id: "write_resets",
        text: "write resets to zero so the compacted prefix can be rebuilt.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "write counts accepted output items rather than inspected input items.",
      mentalModelCorrection:
        "Rejected values advance read but do not extend the logical output.",
      mistakeTypes: ["write_advanced_for_rejected_observation"],
      nextAction:
        "Move write only when one accepted item is committed to the prefix.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-004",
    learningStage: "foundations",
    primarySkillAtomId: "trace_stable_filter_compaction",
    secondarySkillAtomIds: [
      "preserve_accepted_relative_order",
      "return_logical_length",
    ],
    type: "edge_case_drill",
    prompt: `Filter positive values in place:

values = [-2, 4, 1, -3, 5]

What logical output should occupy the prefix, and what length should be returned?`,
    options: [
      {
        id: "four_one_five_length_three",
        text: "Prefix [4, 1, 5] with logical length 3.",
        isCorrect: true,
      },
      {
        id: "five_one_four_length_three",
        text: "Prefix [5, 1, 4] with logical length 3.",
        isCorrect: false,
      },
      {
        id: "negative_values_length_two",
        text: "Prefix [-2, -3] with logical length 2.",
        isCorrect: false,
      },
      {
        id: "full_array_length_five",
        text: "The complete array remains logical output with length 5.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Accepted values are emitted in the same order in which read encounters them.",
      mentalModelCorrection:
        "Stable compaction changes physical placement without changing accepted relative order.",
      mistakeTypes: ["stable_filter_compaction_trace_mismatch"],
      nextAction:
        "Append each accepted value to the next logical output position.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-005",
    learningStage: "foundations",
    primarySkillAtomId: "interpret_compaction_logical_length",
    secondarySkillAtomIds: [
      "distinguish_length_from_last_index",
      "interpret_write_as_output_count",
    ],
    type: "single_choice",
    prompt:
      "After a read/write compaction finishes, what does the final write value represent?",
    options: [
      {
        id: "logical_length_and_next_free_position",
        text: "The logical output length and the first position outside the compacted prefix.",
        isCorrect: true,
      },
      {
        id: "last_output_index",
        text: "The index of the final accepted value in every case.",
        isCorrect: false,
      },
      {
        id: "processed_input_count_only",
        text: "The number of input values inspected, including rejects.",
        isCorrect: false,
      },
      {
        id: "physical_array_length",
        text: "The physical length of the mutated array.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The compacted output occupies the half-open range [0, write).",
      mentalModelCorrection:
        "A logical length is an exclusive boundary, not the last valid index.",
      mistakeTypes: ["write_pointer_length_semantics_misread"],
      nextAction: "Translate [0, write) into exactly write output elements.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-006",
    learningStage: "foundations",
    primarySkillAtomId: "interpret_unspecified_compaction_suffix",
    secondarySkillAtomIds: [
      "separate_logical_output_from_physical_storage",
      "avoid_suffix_semantics_assumption",
    ],
    type: "output_contract_analysis",
    prompt: `A compaction returns logical length k.

What can generally be assumed about values[k] through the physical end of the array?`,
    options: [
      {
        id: "no_output_meaning",
        text: "They have no guaranteed output meaning unless the contract explicitly defines the suffix.",
        isCorrect: true,
      },
      {
        id: "all_rejected_in_order",
        text: "They must contain every rejected value in original order.",
        isCorrect: false,
      },
      {
        id: "all_cleared",
        text: "They must be reset to undefined or zero.",
        isCorrect: false,
      },
      {
        id: "also_accepted",
        text: "They remain part of the accepted logical output.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The postcondition guarantees only the logical prefix and returned length.",
      mentalModelCorrection:
        "Physical storage beyond the logical boundary may contain stale, duplicated, or overwritten values.",
      mistakeTypes: ["unspecified_compaction_suffix_treated_as_output"],
      nextAction:
        "Restrict consumers to indexes below the returned logical length.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-007",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_sorted_duplicate_compaction",
    secondarySkillAtomIds: [
      "use_adjacent_distinctness_in_sorted_data",
      "maintain_unique_prefix",
    ],
    type: "strategy_choice",
    prompt:
      "A sorted array must be deduplicated in place so each distinct value appears once in the prefix. Which read/write interpretation is appropriate?",
    options: [
      {
        id: "read_candidates_write_unique",
        text: "read scans candidates, while write tracks the length of the unique prefix already produced.",
        isCorrect: true,
      },
      {
        id: "two_endpoint_pair",
        text: "read and write identify an opposite-end pair whose sum is evaluated.",
        isCorrect: false,
      },
      {
        id: "window_boundaries",
        text: "read and write bound a contiguous window whose interior contains one duplicate group.",
        isCorrect: false,
      },
      {
        id: "arbitrary_positions",
        text: "The pointers may change roles depending on the current value.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Sorted order makes duplicate membership decidable from the latest accepted distinct value.",
      mentalModelCorrection:
        "The write boundary describes produced unique output, while read discovers the next candidate.",
      mistakeTypes: ["sorted_dedup_pointer_roles_misclassified"],
      nextAction:
        "State what the unique prefix contains before each read step.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-008",
    learningStage: "foundations",
    primarySkillAtomId: "trace_sorted_duplicate_removal",
    secondarySkillAtomIds: [
      "preserve_one_copy_per_run",
      "derive_unique_logical_length",
    ],
    type: "edge_case_drill",
    prompt: `Deduplicate this sorted array in place:

values = [1, 1, 2, 2, 2, 5]

What logical prefix and length should result?`,
    options: [
      {
        id: "one_two_five_length_three",
        text: "Prefix [1, 2, 5] with logical length 3.",
        isCorrect: true,
      },
      {
        id: "one_one_two_five_length_four",
        text: "Prefix [1, 1, 2, 5] with logical length 4.",
        isCorrect: false,
      },
      {
        id: "one_two_two_five_length_four",
        text: "Prefix [1, 2, 2, 5] with logical length 4.",
        isCorrect: false,
      },
      {
        id: "unchanged_length_six",
        text: "The logical output remains the full array with length 6.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each equal run contributes exactly its first distinct value to the output prefix.",
      mentalModelCorrection:
        "The logical result is determined by distinct runs, not physical array size.",
      mistakeTypes: ["sorted_dedup_trace_mismatch"],
      nextAction:
        "Advance write only when read finds a value different from the latest accepted value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-read-write-compaction-009",
    learningStage: "foundations",
    primarySkillAtomId: "compare_candidate_with_latest_written_value",
    secondarySkillAtomIds: [
      "maintain_unique_prefix",
      "avoid_comparing_against_stale_position",
    ],
    type: "single_choice",
    prompt: `In sorted duplicate removal, write is the next free output position and write > 0.

Which comparison determines whether values[read] is a new distinct value?`,
    options: [
      {
        id: "compare_to_write_minus_one",
        text: "Compare values[read] with values[write - 1], the latest distinct value already written.",
        isCorrect: true,
      },
      {
        id: "compare_to_write",
        text: "Compare values[read] with values[write], even though write is the next free destination.",
        isCorrect: false,
      },
      {
        id: "compare_to_first",
        text: "Compare every candidate only with values[0].",
        isCorrect: false,
      },
      {
        id: "compare_to_last_physical",
        text: "Compare every candidate with the final physical array element.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The compacted prefix ends at write - 1.",
      mentalModelCorrection:
        "The next destination is not yet part of the produced output and may contain stale data.",
      mistakeTypes: ["dedup_candidate_compared_to_next_free_slot"],
      nextAction: "Compare against the last completed output position.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-read-write-compaction-010",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_write_advancement_for_duplicates",
    secondarySkillAtomIds: [
      "preserve_unique_prefix_length",
      "separate_read_and_write_progress",
    ],
    type: "mistake_review",
    prompt: `A sorted deduplication loop increments write on every read iteration, including when values[read] duplicates the latest accepted value.

What fails?`,
    options: [
      {
        id: "duplicates_consume_output_positions",
        text: "Duplicate observations create logical output positions, so the prefix length no longer equals the number of distinct values.",
        isCorrect: true,
      },
      {
        id: "read_stops_moving",
        text: "read can no longer advance through the array.",
        isCorrect: false,
      },
      {
        id: "sorted_order_breaks",
        text: "The physical input immediately becomes unsorted.",
        isCorrect: false,
      },
      {
        id: "all_values_are_removed",
        text: "Every distinct value is deleted from the output.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "write must advance only when a new logical output item is produced.",
      mentalModelCorrection:
        "Input progress occurs for every observation; output progress occurs only for accepted observations.",
      mistakeTypes: ["write_advanced_for_duplicate_reject"],
      nextAction: "Place the write increment inside the distinct-value branch.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-read-write-compaction-011",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_overwriting_unread_input",
    secondarySkillAtomIds: [
      "maintain_write_not_ahead_of_read",
      "preserve_future_source_values",
    ],
    type: "mistake_review",
    prompt: `An in-place compaction allows write to become greater than read and then executes:

values[write] = values[read];

Why is that representation dangerous?`,
    options: [
      {
        id: "may_overwrite_future_input",
        text: "write may point into the unprocessed suffix, so the assignment can destroy a value before read inspects it.",
        isCorrect: true,
      },
      {
        id: "accepted_values_must_move_left",
        text: "Accepted values are never allowed to remain at their current position.",
        isCorrect: false,
      },
      {
        id: "write_must_always_equal_zero",
        text: "write is valid only while it remains zero.",
        isCorrect: false,
      },
      {
        id: "array_assignment_is_invalid",
        text: "JavaScript arrays cannot assign one indexed value to another.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "Unread input must remain intact until its read turn.",
      mentalModelCorrection:
        "Standard stable compaction keeps write at or behind read, making leftward or self-copying safe.",
      mistakeTypes: ["compaction_overwrites_unread_input"],
      nextAction:
        "Prove that every destination is outside the unprocessed suffix.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-read-write-compaction-012",
    learningStage: "foundations",
    primarySkillAtomId: "prove_write_does_not_exceed_read",
    secondarySkillAtomIds: [
      "derive_compaction_pointer_order",
      "protect_unprocessed_suffix",
    ],
    type: "invariant_reasoning",
    prompt:
      "Why does a standard stable filtering compaction maintain write <= read?",
    options: [
      {
        id: "accepted_count_not_greater_than_processed_count",
        text: "write equals the number of accepted items from the processed prefix, which cannot exceed the number of processed items represented by read.",
        isCorrect: true,
      },
      {
        id: "pointer_names_define_order",
        text: "A variable named write is required by JavaScript to be smaller than read.",
        isCorrect: false,
      },
      {
        id: "all_values_rejected",
        text: "The relation holds only because every value is assumed to be rejected.",
        isCorrect: false,
      },
      {
        id: "array_is_sorted",
        text: "The relation follows only when the array is sorted.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Produced output cannot contain more items than the input observations processed so far.",
      mentalModelCorrection:
        "The safe pointer ordering follows from count semantics, not from naming or sortedness.",
      mistakeTypes: ["write_read_order_not_justified"],
      nextAction: "Express each pointer as a count over the processed prefix.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-013",
    learningStage: "foundations",
    primarySkillAtomId: "handle_empty_compaction_input",
    secondarySkillAtomIds: [
      "return_zero_logical_length",
      "avoid_invalid_initial_access",
    ],
    type: "edge_case_drill",
    prompt:
      "What should a filtering compaction return for an empty input array?",
    options: [
      {
        id: "zero",
        text: "0, because the accepted output prefix is empty.",
        isCorrect: true,
      },
      {
        id: "minus_one",
        text: "-1, because there is no last accepted index.",
        isCorrect: false,
      },
      {
        id: "one",
        text: "1, because write starts at the first output position.",
        isCorrect: false,
      },
      {
        id: "undefined",
        text: "undefined, because compaction is not defined for empty arrays.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The returned value is a count or logical length.",
      mentalModelCorrection:
        "An empty half-open output prefix [0, 0) has length zero.",
      mistakeTypes: ["empty_compaction_length_mismatch"],
      nextAction:
        "Initialize write to zero and avoid reading an initial element unless the input is non-empty.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-read-write-compaction-014",
    learningStage: "foundations",
    primarySkillAtomId: "initialize_sorted_dedup_write_pointer",
    secondarySkillAtomIds: [
      "handle_first_unique_value",
      "guard_empty_sorted_input",
    ],
    type: "solution_comparison",
    prompt: `A sorted deduplication algorithm treats the first value as already accepted.

Which initialization is coherent for a non-empty array?`,
    options: [
      {
        id: "write_one_read_one",
        text: "Set write = 1 and begin read at 1, so [0, write) initially contains the first distinct value.",
        isCorrect: true,
      },
      {
        id: "write_zero_read_one_without_special_rule",
        text: "Set write = 0 and read = 1 while still treating [0, write) as containing the first value.",
        isCorrect: false,
      },
      {
        id: "write_length",
        text: "Set write to values.length because every physical value is already accepted.",
        isCorrect: false,
      },
      {
        id: "read_zero_write_one_then_compare_negative",
        text: "Start read at 0 and compare each candidate with values[write - 2].",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "For non-empty input, the first sorted run contributes one accepted value immediately.",
      mentalModelCorrection:
        "Initialization must make the invariant true before the first loop iteration.",
      mistakeTypes: ["sorted_dedup_initial_invariant_invalid"],
      nextAction:
        "Handle empty input first, then establish a one-item unique prefix.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-read-write-compaction-015",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_accidental_unstable_filtering",
    secondarySkillAtomIds: [
      "preserve_accepted_encounter_order",
      "distinguish_compaction_from_partition_swaps",
    ],
    type: "mistake_review",
    prompt: `A filter must preserve accepted encounter order. The implementation swaps rejected values with arbitrary elements from the end of the array.

What is the concern?`,
    options: [
      {
        id: "accepted_order_may_change",
        text: "Suffix swaps can reorder accepted values, so the algorithm no longer implements stable read/write compaction.",
        isCorrect: true,
      },
      {
        id: "all_swaps_are_invalid",
        text: "Any in-place swap is illegal in every array algorithm.",
        isCorrect: false,
      },
      {
        id: "suffix_items_are_always_rejected",
        text: "The strategy is safe because every item in the suffix is guaranteed to be rejected before inspection.",
        isCorrect: false,
      },
      {
        id: "logical_length_becomes_physical",
        text: "Swapping automatically changes the physical array length.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Stable filtering requires accepted values to be emitted in read order.",
      mentalModelCorrection:
        "An in-place filter is not automatically stable; the movement policy must preserve relative order.",
      mistakeTypes: ["unstable_partition_used_for_stable_compaction"],
      nextAction: "Write accepted values sequentially as read encounters them.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-016",
    learningStage: "foundations",
    primarySkillAtomId: "handle_all_accepted_compaction",
    secondarySkillAtomIds: [
      "allow_self_assignment",
      "derive_full_logical_length",
    ],
    type: "edge_case_drill",
    prompt: `Every value satisfies the predicate:

values = [2, 4, 6]

What should the final logical length be?`,
    options: [
      {
        id: "three",
        text: "3",
        isCorrect: true,
      },
      {
        id: "zero",
        text: "0, because no values needed to move left.",
        isCorrect: false,
      },
      {
        id: "two",
        text: "2, because the final valid index is 2.",
        isCorrect: false,
      },
      {
        id: "six",
        text: "6, because the accepted values sum to 12.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every processed observation produces one logical output item.",
      mentalModelCorrection:
        "A value remains part of the compacted result even when its write destination equals its read position.",
      mistakeTypes: ["unchanged_accepted_values_not_counted"],
      nextAction:
        "Advance write for every accepted item, including safe self-assignments.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-read-write-compaction-017",
    learningStage: "foundations",
    primarySkillAtomId: "handle_all_rejected_compaction",
    secondarySkillAtomIds: [
      "preserve_zero_length_prefix",
      "avoid_write_progress_without_output",
    ],
    type: "edge_case_drill",
    prompt: `No value satisfies the predicate:

values = [1, 3, 5]

What should the final write value be?`,
    options: [
      {
        id: "zero",
        text: "0",
        isCorrect: true,
      },
      {
        id: "three",
        text: "3, because read processed three values.",
        isCorrect: false,
      },
      {
        id: "minus_one",
        text: "-1, because no accepted index exists.",
        isCorrect: false,
      },
      {
        id: "one",
        text: "1, because write must advance at least once.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "No output item was produced from the processed input.",
      mentalModelCorrection: "Input completion does not imply output growth.",
      mistakeTypes: ["write_tracks_processed_instead_of_accepted_count"],
      nextAction: "Keep write unchanged on every rejection.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-read-write-compaction-018",
    learningStage: "foundations",
    primarySkillAtomId: "review_complete_read_write_compaction",
    secondarySkillAtomIds: [
      "maintain_stable_output_prefix",
      "protect_unprocessed_input",
    ],
    type: "invariant_identification",
    prompt:
      "Which statement most completely explains correctness for stable same-direction compaction?",
    options: [
      {
        id: "processed_prefix_maps_to_output_prefix",
        text: "Before each step, [0, write) is exactly the accepted sequence from [0, read); write <= read protects unread input; accepted values are written at write and advance it, while rejected values advance only read.",
        isCorrect: true,
      },
      {
        id: "both_pointers_always_advance",
        text: "Both pointers advance on every iteration, ensuring they finish together.",
        isCorrect: false,
      },
      {
        id: "suffix_contains_rejects",
        text: "Correctness requires the suffix to contain all rejected values in stable order.",
        isCorrect: false,
      },
      {
        id: "two_indexes_are_enough",
        text: "The existence of read and write variables is sufficient to prove stable compaction.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The explanation connects region meaning, pointer ordering, update rules, stability, and safe in-place mutation.",
      mentalModelCorrection:
        "Read/write mechanics are correct only when every update preserves the accepted-output invariant and leaves unread input intact.",
      mistakeTypes: ["read_write_compaction_correctness_argument_incomplete"],
      nextAction:
        "Verify the invariant before and after both the accepted and rejected branches.",
      result: "diagnostic",
    },
  },
];
