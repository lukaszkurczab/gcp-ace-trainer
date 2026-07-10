export const frequencyCountingAndMultisetsQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-001",
    learningStage: "foundations",
    primarySkillAtomId: "define_frequency_count_semantics",
    secondarySkillAtomIds: [
      "interpret_frequency_map_entries",
      "state_per_key_invariant",
    ],
    type: "single_choice",
    prompt:
      "While building a frequency Map from left to right, what should counts.get(value) mean after processing an input prefix?",
    options: [
      {
        id: "processed_occurrences",
        text: "The number of occurrences of value in the processed prefix.",
        isCorrect: true,
      },
      {
        id: "future_occurrences",
        text: "The number of times value will appear in the unprocessed suffix.",
        isCorrect: false,
      },
      {
        id: "presence_boolean",
        text: "Whether value has appeared, encoded as an arbitrary positive number.",
        isCorrect: false,
      },
      {
        id: "global_processed_count",
        text: "The total number of all values processed so far.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each Map entry should describe one key using a stable, testable invariant.",
      mentalModelCorrection:
        "A frequency count is not merely a truthy marker. It represents an exact number of occurrences in a defined region of the input.",
      mistakeTypes: ["frequency_count_semantics_undefined"],
      nextAction:
        "Complete the sentence: counts.get(x) equals the number of x values in...",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-002",
    learningStage: "foundations",
    primarySkillAtomId: "increment_frequency_count",
    secondarySkillAtomIds: [
      "initialize_missing_count",
      "maintain_exact_occurrence_count",
    ],
    type: "single_choice",
    prompt: `Which update correctly records one newly observed occurrence of value?

const counts = new Map<number, number>();`,
    options: [
      {
        id: "default_zero_plus_one",
        text: "counts.set(value, (counts.get(value) ?? 0) + 1);",
        isCorrect: true,
      },
      {
        id: "always_one",
        text: "counts.set(value, 1);",
        isCorrect: false,
      },
      {
        id: "increment_key",
        text: "counts.set(value + 1, counts.get(value) ?? 0);",
        isCorrect: false,
      },
      {
        id: "boolean_presence",
        text: "counts.set(value, counts.has(value) ? 1 : 0);",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The update must preserve prior occurrences and add exactly one new occurrence.",
      mentalModelCorrection:
        "Missing keys represent a prior count of zero; existing keys must be incremented rather than overwritten.",
      mistakeTypes: ["frequency_increment_overwrites_prior_count"],
      nextAction: "Read the old count, default it to zero, and add one.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-003",
    learningStage: "foundations",
    primarySkillAtomId: "trace_frequency_map_construction",
    secondarySkillAtomIds: [
      "increment_frequency_count",
      "interpret_frequency_map_entries",
    ],
    type: "single_choice",
    prompt: `A frequency Map is built from:

values = [4, 2, 4, 4, 2]

What counts should it contain?`,
    options: [
      {
        id: "four_three_two_two",
        text: "4 → 3 and 2 → 2.",
        isCorrect: true,
      },
      {
        id: "four_one_two_one",
        text: "4 → 1 and 2 → 1.",
        isCorrect: false,
      },
      {
        id: "four_four_two_two",
        text: "4 → 4 and 2 → 2.",
        isCorrect: false,
      },
      {
        id: "four_two_two_three",
        text: "4 → 2 and 2 → 3.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each occurrence increments exactly one count associated with its value.",
      mentalModelCorrection:
        "The Map stores occurrence multiplicity, not merely the set of distinct keys.",
      mistakeTypes: ["frequency_construction_trace_mismatch"],
      nextAction:
        "Update only the current value's count after every observation.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-004",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_set_from_multiset_state",
    secondarySkillAtomIds: [
      "recognize_duplicate_multiplicity",
      "choose_frequency_map_for_multiset",
    ],
    type: "solution_comparison",
    prompt: `Compare these collections:

A = [5, 5, 8]
B = [5, 8]

Why is a Set insufficient for deciding whether they represent the same multiset?`,
    options: [
      {
        id: "same_keys_different_counts",
        text: "Both produce the distinct-key set {5, 8}, but the occurrence count of 5 differs.",
        isCorrect: true,
      },
      {
        id: "set_cannot_store_numbers",
        text: "A Set cannot store numeric values.",
        isCorrect: false,
      },
      {
        id: "multisets_ignore_duplicates",
        text: "It is sufficient because multisets ignore duplicate occurrences.",
        isCorrect: false,
      },
      {
        id: "order_is_only_difference",
        text: "A Set is insufficient only because it changes the order of the values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Multiset equality depends on both key membership and multiplicity.",
      mentalModelCorrection:
        "A Set answers whether a key occurs at least once. A multiset count distinguishes one occurrence from several.",
      mistakeTypes: ["set_used_for_multiset_equality"],
      nextAction:
        "For every distinct value, compare its exact occurrence count.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-005",
    learningStage: "foundations",
    primarySkillAtomId: "define_remaining_availability_count",
    secondarySkillAtomIds: [
      "interpret_consumable_multiset_state",
      "state_per_key_invariant",
    ],
    type: "single_choice",
    prompt:
      "A Map is built from available inventory and then decremented as requests consume items. During the consumption phase, what should counts.get(key) mean?",
    options: [
      {
        id: "unconsumed_available_occurrences",
        text: "The number of unconsumed occurrences of key still available.",
        isCorrect: true,
      },
      {
        id: "original_total_forever",
        text: "The original total number of occurrences, even after items are consumed.",
        isCorrect: false,
      },
      {
        id: "processed_request_count",
        text: "The total number of requests processed for every key combined.",
        isCorrect: false,
      },
      {
        id: "boolean_seen_state",
        text: "Whether key has appeared in either input, regardless of remaining availability.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The count decreases when one occurrence is consumed.",
      mentalModelCorrection:
        "A mutable count must retain one consistent meaning throughout the phase in which it is used.",
      mistakeTypes: ["remaining_count_semantics_undefined"],
      nextAction:
        "Define the count as available occurrences before writing the decrement logic.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-006",
    learningStage: "foundations",
    primarySkillAtomId: "order_multiset_consumption_steps",
    secondarySkillAtomIds: [
      "check_positive_availability",
      "decrement_frequency_count",
    ],
    type: "subgoal_ordering",
    prompt:
      "Which sequence correctly consumes one requested occurrence from a frequency Map of remaining availability?",
    options: [
      {
        id: "read_check_positive_decrement",
        text: "Read the current count, reject if it is missing or zero, otherwise decrement it by one.",
        isCorrect: true,
      },
      {
        id: "decrement_then_check",
        text: "Decrement the count first and reject only if it later becomes negative.",
        isCorrect: false,
      },
      {
        id: "check_key_only_no_decrement",
        text: "Check whether the key exists and leave its count unchanged.",
        isCorrect: false,
      },
      {
        id: "increment_on_consumption",
        text: "Increment the count because one more request for the key has been observed.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Consumption is legal only when at least one occurrence remains available.",
      mentalModelCorrection:
        "Validate positive availability before mutating the state; then consume exactly one occurrence.",
      mistakeTypes: ["multiset_consumption_order_mismatch"],
      nextAction: "Use the sequence inspect, validate, consume.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-frequency-counting-multisets-007",
    learningStage: "foundations",
    primarySkillAtomId: "check_positive_remaining_count",
    secondarySkillAtomIds: [
      "distinguish_key_presence_from_availability",
      "handle_zero_count_entries",
    ],
    type: "mistake_review",
    prompt: `A Map retains keys whose remaining count has reached zero.

The code checks:

if (!counts.has(requested)) {
  return false;
}

Why is this insufficient?`,
    options: [
      {
        id: "key_can_exist_with_zero_count",
        text: "The key may still exist with count 0, so membership does not prove that an occurrence remains available.",
        isCorrect: true,
      },
      {
        id: "has_cannot_check_map_keys",
        text: "Map.has cannot test whether a key exists.",
        isCorrect: false,
      },
      {
        id: "zero_means_one_available",
        text: "A zero count conventionally means that one occurrence remains.",
        isCorrect: false,
      },
      {
        id: "must_check_negative_only",
        text: "Availability should be accepted whenever the count is not negative.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Key presence and positive multiplicity are different states when zero entries are retained.",
      mentalModelCorrection:
        "A consumable multiset requires counts.get(key) > 0, unless zero-count keys are deleted consistently.",
      mistakeTypes: ["map_membership_confused_with_positive_availability"],
      nextAction: "Check the stored count, not only the existence of the key.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-frequency-counting-multisets-008",
    learningStage: "foundations",
    primarySkillAtomId: "choose_zero_count_key_policy",
    secondarySkillAtomIds: [
      "maintain_consistent_multiset_representation",
      "distinguish_presence_from_count",
    ],
    type: "solution_comparison",
    prompt: `Two implementations represent remaining availability:

A. Keeps keys with count 0 and checks count > 0 before consumption.

B. Deletes a key when its count reaches 0 and uses has(key) for availability.

Which review is correct?`,
    options: [
      {
        id: "both_consistent",
        text: "Both can be correct if their zero-count policy and availability checks remain consistent.",
        isCorrect: true,
      },
      {
        id: "only_keep_zero",
        text: "Only A can be correct because deleting a zero-count key loses required positive availability.",
        isCorrect: false,
      },
      {
        id: "only_delete_zero",
        text: "Only B can be correct because frequency Maps are never allowed to store zero.",
        isCorrect: false,
      },
      {
        id: "both_wrong",
        text: "Both are wrong because multiset counts must remain equal to their original totals.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The two representations encode zero availability differently but can answer the same logical query.",
      mentalModelCorrection:
        "The important requirement is semantic consistency between stored state and the operations that inspect it.",
      mistakeTypes: ["zero_count_policy_treated_as_universal_rule"],
      nextAction:
        "Document whether zero means a retained entry or an absent key, then use that policy everywhere.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-009",
    learningStage: "foundations",
    primarySkillAtomId: "trace_multiset_consumption",
    secondarySkillAtomIds: [
      "decrement_frequency_count",
      "check_positive_availability",
    ],
    type: "single_choice",
    prompt: `Available values are:

["a", "a", "b"]

The requests are processed in this order:

["a", "b", "a"]

What happens?`,
    options: [
      {
        id: "all_succeed_counts_zero",
        text: "All requests succeed; the remaining counts of both a and b become zero.",
        isCorrect: true,
      },
      {
        id: "third_a_fails",
        text: "The third request fails because duplicate values can only be consumed once.",
        isCorrect: false,
      },
      {
        id: "b_fails",
        text: "The request for b fails because b appeared after a in the available input.",
        isCorrect: false,
      },
      {
        id: "one_a_remains",
        text: "All requests succeed and one occurrence of a remains.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The available multiset contains exactly two a occurrences and one b occurrence.",
      mentalModelCorrection:
        "Each successful request consumes one occurrence rather than removing the entire key immediately.",
      mistakeTypes: ["multiset_consumption_trace_mismatch"],
      nextAction:
        "Subtract one from the requested key after every successful consumption.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-010",
    learningStage: "foundations",
    primarySkillAtomId: "detect_exhausted_multiset_key",
    secondarySkillAtomIds: [
      "check_positive_availability",
      "handle_duplicate_requests",
    ],
    type: "edge_case_drill",
    prompt: `Available values are:

[7, 7]

Requests are:

[7, 7, 7]

When should the algorithm reject the requests?`,
    options: [
      {
        id: "third_request",
        text: "On the third request, because the two available occurrences have already been consumed.",
        isCorrect: true,
      },
      {
        id: "first_request",
        text: "On the first request, because duplicated inventory is invalid.",
        isCorrect: false,
      },
      {
        id: "never",
        text: "Never, because the key 7 remains present in the Map.",
        isCorrect: false,
      },
      {
        id: "second_request",
        text: "On the second request, because one key may be consumed only once.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Availability is measured in occurrences, not merely in distinct keys.",
      mentalModelCorrection:
        "A key remains consumable exactly while its remaining count is positive.",
      mistakeTypes: ["exhausted_duplicate_availability_ignored"],
      nextAction:
        "Trace the count through 2, 1, 0 before processing the third request.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-011",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_exact_multiset_equality",
    secondarySkillAtomIds: [
      "compare_per_key_counts",
      "distinguish_multiset_from_set_equality",
    ],
    type: "single_choice",
    prompt: "Which condition precisely defines equality of two multisets?",
    options: [
      {
        id: "same_count_for_every_key",
        text: "Every possible key has the same occurrence count in both collections.",
        isCorrect: true,
      },
      {
        id: "same_distinct_keys",
        text: "Both collections contain the same distinct keys, regardless of their counts.",
        isCorrect: false,
      },
      {
        id: "same_length_only",
        text: "Both collections have the same total length.",
        isCorrect: false,
      },
      {
        id: "same_first_and_last",
        text: "Both collections have equal first and last values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "Multiset identity includes multiplicity for every key.",
      mentalModelCorrection:
        "Equal total size or equal distinct membership does not imply equal per-key occurrence counts.",
      mistakeTypes: ["multiset_equality_definition_mismatch"],
      nextAction: "Compare exact counts under every distinct key.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-012",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_false_multiset_match",
    secondarySkillAtomIds: [
      "compare_per_key_counts",
      "reason_about_duplicate_distribution",
    ],
    type: "edge_case_drill",
    prompt: `Compare:

A = [1, 1, 2]
B = [1, 2, 2]

They have the same length and the same distinct keys. Are they equal as multisets?`,
    options: [
      {
        id: "not_equal_counts_differ",
        text: "No. A contains two 1s and one 2, while B contains one 1 and two 2s.",
        isCorrect: true,
      },
      {
        id: "equal_same_keys",
        text: "Yes, because both contain the distinct keys 1 and 2.",
        isCorrect: false,
      },
      {
        id: "equal_same_length",
        text: "Yes, because both contain three total elements.",
        isCorrect: false,
      },
      {
        id: "not_equal_order",
        text: "No, only because the elements appear in a different order.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The total number of elements assigned to each key differs.",
      mentalModelCorrection:
        "Multiset comparison ignores order but preserves exact duplicate counts.",
      mistakeTypes: ["same_keys_and_length_assumed_same_multiset"],
      nextAction: "Write the count vector for each distinct key.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-frequency-counting-multisets-013",
    learningStage: "foundations",
    primarySkillAtomId: "handle_empty_multiset_edge_case",
    secondarySkillAtomIds: [
      "initialize_frequency_state",
      "recognize_empty_multiset_equality",
    ],
    type: "edge_case_drill",
    prompt: "What frequency state represents an empty collection?",
    options: [
      {
        id: "empty_map",
        text: "An empty Map with no positive-count keys.",
        isCorrect: true,
      },
      {
        id: "one_empty_key",
        text: "A Map containing an empty-string key with count 1.",
        isCorrect: false,
      },
      {
        id: "all_keys_zero",
        text: "A Map containing every possible key with count 0.",
        isCorrect: false,
      },
      {
        id: "undefined_counts",
        text: "A Map in which every missing key is treated as having count 1.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "No value has a positive occurrence count.",
      mentalModelCorrection:
        "Missing keys naturally represent zero occurrences; an empty input therefore needs no entries.",
      mistakeTypes: ["empty_multiset_representation_mismatch"],
      nextAction:
        "Treat absence as zero unless the representation explicitly requires zero-count entries.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-frequency-counting-multisets-014",
    learningStage: "foundations",
    primarySkillAtomId: "prevent_negative_frequency_counts",
    secondarySkillAtomIds: [
      "check_positive_availability",
      "preserve_multiset_invariant",
    ],
    type: "mistake_review",
    prompt: `A consumption algorithm performs:

counts.set(key, (counts.get(key) ?? 0) - 1);

if (counts.get(key)! < 0) {
  return false;
}

What is the main review concern?`,
    options: [
      {
        id: "mutates_invalid_state_before_rejection",
        text: "It mutates the Map into an invalid negative-count state before establishing that an occurrence is available.",
        isCorrect: true,
      },
      {
        id: "negative_counts_are_required",
        text: "The check is wrong because unavailable keys should continue decreasing indefinitely.",
        isCorrect: false,
      },
      {
        id: "decrement_should_be_two",
        text: "Every consumption should decrement by two to represent both the key and its occurrence.",
        isCorrect: false,
      },
      {
        id: "missing_means_one",
        text: "A missing key should default to one rather than zero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A valid remaining-availability count should never become negative.",
      mentalModelCorrection:
        "Reject an unavailable request before mutating state, rather than using negative counts as delayed error detection.",
      mistakeTypes: ["frequency_decrement_before_availability_check"],
      nextAction:
        "Read and validate the old count before writing the new count.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-frequency-counting-multisets-015",
    learningStage: "foundations",
    primarySkillAtomId: "compare_required_and_available_frequencies",
    secondarySkillAtomIds: [
      "check_exact_occurrence_requirements",
      "reject_presence_only_matching",
    ],
    type: "single_choice",
    prompt: `Available inventory contains a key x twice. A requirement Map needs x three times.

Which check correctly detects that the requirement cannot be satisfied?`,
    options: [
      {
        id: "available_less_than_required",
        text: "(available.get(x) ?? 0) < required.get(x)!",
        isCorrect: true,
      },
      {
        id: "available_has_key",
        text: "available.has(x)",
        isCorrect: false,
      },
      {
        id: "required_has_key",
        text: "required.has(x)",
        isCorrect: false,
      },
      {
        id: "available_nonzero",
        text: "(available.get(x) ?? 0) > 0",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The requirement concerns three occurrences, not merely presence of the key.",
      mentalModelCorrection:
        "Positive availability can still be insufficient when the required multiplicity is larger.",
      mistakeTypes: ["positive_count_assumed_sufficient_for_required_count"],
      nextAction:
        "Compare the available and required counts numerically for each key.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-frequency-counting-multisets-016",
    learningStage: "foundations",
    primarySkillAtomId: "compare_multiset_matching_strategies",
    secondarySkillAtomIds: [
      "compare_frequency_maps",
      "consume_remaining_counts",
    ],
    type: "solution_comparison",
    prompt: `Two approaches test exact multiset equality after first confirming equal total lengths:

A. Build two frequency Maps and compare every key's count.

B. Build a frequency Map from the first collection, decrement it for every value in the second, and reject any unavailable value.

Which review is correct?`,
    options: [
      {
        id: "both_valid_with_precise_invariants",
        text: "Both can be correct: A compares final occurrence totals, while B maintains remaining unmatched occurrences.",
        isCorrect: true,
      },
      {
        id: "only_two_maps",
        text: "Only A can be correct because decrementing a frequency count always destroys required information.",
        isCorrect: false,
      },
      {
        id: "only_consumption",
        text: "Only B can be correct because two Maps cannot represent exact counts.",
        isCorrect: false,
      },
      {
        id: "both_presence_only",
        text: "Both are equivalent to comparing Sets of distinct values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The approaches use different but internally consistent meanings for their counts.",
      mentalModelCorrection:
        "A count may mean total occurrences or remaining unmatched occurrences, but that meaning must remain precise within the chosen approach.",
      mistakeTypes: ["different_count_invariants_assumed_incompatible"],
      nextAction:
        "Write the count invariant for each implementation before reviewing its updates.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-frequency-counting-multisets-017",
    learningStage: "foundations",
    primarySkillAtomId: "interpret_map_size_with_zero_counts",
    secondarySkillAtomIds: [
      "distinguish_stored_keys_from_positive_keys",
      "choose_zero_count_key_policy",
    ],
    type: "mistake_review",
    prompt: `A consumption Map keeps entries after their counts reach zero.

After all requested occurrences are consumed, a reviewer checks:

return counts.size === 0;

Why can this be wrong?`,
    options: [
      {
        id: "zero_entries_still_contribute_to_size",
        text: "Map.size counts stored keys even when their associated counts are zero.",
        isCorrect: true,
      },
      {
        id: "size_counts_occurrences",
        text: "Map.size returns the sum of all occurrence counts rather than the number of keys.",
        isCorrect: false,
      },
      {
        id: "size_is_always_zero",
        text: "Map.size remains zero until the Map contains a negative count.",
        isCorrect: false,
      },
      {
        id: "zero_counts_mean_unconsumed",
        text: "A zero count means that one unmatched occurrence remains.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Stored-key count is not the same as positive-occurrence count under this representation.",
      mentalModelCorrection:
        "Either delete exhausted keys or inspect the counts themselves when determining whether availability remains.",
      mistakeTypes: ["map_size_used_with_retained_zero_counts"],
      nextAction:
        "Align emptiness checks with the chosen zero-count representation.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-frequency-counting-multisets-018",
    learningStage: "foundations",
    primarySkillAtomId: "state_remaining_multiset_invariant",
    secondarySkillAtomIds: [
      "prove_frequency_decrement_correctness",
      "maintain_nonnegative_counts",
    ],
    type: "single_choice",
    prompt:
      "Which invariant precisely describes a Map built from available values and decremented while processing a request prefix?",
    options: [
      {
        id: "available_minus_consumed",
        text: "For every key x, counts.get(x) equals occurrences of x in the available collection minus occurrences of x consumed from the processed request prefix, and it never becomes negative.",
        isCorrect: true,
      },
      {
        id: "all_seen_occurrences",
        text: "For every key x, counts.get(x) equals all occurrences seen in both collections combined.",
        isCorrect: false,
      },
      {
        id: "boolean_membership",
        text: "For every key x, any numeric count means only that x appeared somewhere.",
        isCorrect: false,
      },
      {
        id: "future_requests",
        text: "For every key x, counts.get(x) equals the number of future requests for x that have not yet been read.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each successful request removes exactly one occurrence from the available multiset.",
      mentalModelCorrection:
        "A precise invariant connects initial counts, processed consumption, current state, and the prohibition on overconsumption.",
      mistakeTypes: ["remaining_multiset_invariant_incomplete"],
      nextAction:
        "Express each current count as initial supply minus processed demand.",
      result: "diagnostic",
    },
  },
];
