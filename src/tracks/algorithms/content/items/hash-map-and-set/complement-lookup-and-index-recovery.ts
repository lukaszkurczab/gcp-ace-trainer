export const complementLookupAndIndexRecoveryQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-001",
    learningStage: "foundations",
    primarySkillAtomId: "interpret_complement_lookup_state",
    secondarySkillAtomIds: [
      "interpret_map_entries_as_prior_candidates",
      "distinguish_current_from_seen_values",
    ],
    type: "single_choice",
    prompt: `A one-pass pair-sum algorithm maintains:

const seen = new Map<number, number>();

Before processing values[currentIndex], what should seen represent?`,
    options: [
      {
        id: "prior_values_to_indexes",
        text: "Values from earlier indexes mapped to indexes where those values occurred.",
        isCorrect: true,
      },
      {
        id: "all_values_including_current",
        text: "Every value in the array, including the current value and all future values.",
        isCorrect: false,
      },
      {
        id: "only_valid_pairs",
        text: "Only values already confirmed to belong to a valid pair.",
        isCorrect: false,
      },
      {
        id: "indexes_to_complements",
        text: "Current and future indexes mapped to the complements they may eventually need.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current element may pair only with candidates that have already been processed.",
      mentalModelCorrection:
        "The Map represents the processed prefix. Its entries are prior candidates available to pair with the current item.",
      mistakeTypes: ["seen_map_semantics_misinterpreted"],
      nextAction:
        "State the exact prefix represented by the Map before each lookup.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-002",
    learningStage: "foundations",
    primarySkillAtomId: "order_complement_lookup_before_insert",
    secondarySkillAtomIds: [
      "avoid_self_pairing",
      "maintain_prior_candidate_invariant",
    ],
    type: "subgoal_ordering",
    prompt:
      "Which operation order correctly processes one item in a one-pass complement lookup?",
    options: [
      {
        id: "compute_lookup_insert",
        text: "Compute target - current, look it up among prior values, and insert the current value only if no pair has been returned.",
        isCorrect: true,
      },
      {
        id: "insert_compute_lookup",
        text: "Insert the current value, compute target - current, and then search the Map.",
        isCorrect: false,
      },
      {
        id: "insert_future_lookup",
        text: "Insert all remaining values first and then search for the current complement.",
        isCorrect: false,
      },
      {
        id: "lookup_current_then_complement",
        text: "Look up the current value itself, insert its complement, and advance.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The lookup should consider only indexes strictly earlier than the current index.",
      mentalModelCorrection:
        "Lookup-before-insert makes distinct-index pairing part of the state invariant.",
      mistakeTypes: ["complement_lookup_order_mismatch"],
      nextAction:
        "Ensure the current index is not represented in seen until after its lookup finishes.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-003",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_insert_before_lookup_self_pair",
    secondarySkillAtomIds: [
      "avoid_self_pairing",
      "review_complement_lookup_code",
    ],
    type: "mistake_review",
    prompt: `Review this code:

for (let i = 0; i < values.length; i++) {
  seen.set(values[i], i);

  const complement = target - values[i];

  if (seen.has(complement)) {
    return [seen.get(complement), i];
  }
}

What is the main correctness problem?`,
    options: [
      {
        id: "current_can_match_itself",
        text: "The current value is inserted before lookup, so when values[i] equals its own complement, the code can return index i twice.",
        isCorrect: true,
      },
      {
        id: "map_cannot_store_numbers",
        text: "A Map cannot use numeric values as keys.",
        isCorrect: false,
      },
      {
        id: "complement_must_be_inserted",
        text: "The code should insert complement instead of values[i] because actual values are irrelevant.",
        isCorrect: false,
      },
      {
        id: "loop_must_start_at_one",
        text: "The only issue is that the loop begins at index zero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "After insertion, seen no longer represents only prior indexes.",
      mentalModelCorrection:
        "The current element must not become available as its own earlier partner.",
      mistakeTypes: ["current_item_inserted_before_lookup"],
      nextAction: "Move the insertion after the unsuccessful complement check.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-004",
    learningStage: "foundations",
    primarySkillAtomId: "trace_one_pass_complement_lookup",
    secondarySkillAtomIds: ["compute_pair_complement", "recover_prior_index"],
    type: "single_choice",
    prompt: `Trace a lookup-before-insert algorithm:

values = [2, 7, 11, 15]
target = 9

What happens when currentIndex reaches 1?`,
    options: [
      {
        id: "find_two_at_zero",
        text: "The current value is 7, its complement is 2, and the Map returns prior index 0, producing [0, 1].",
        isCorrect: true,
      },
      {
        id: "find_seven_at_one",
        text: "The current value is 7, and the Map returns current index 1 for value 7.",
        isCorrect: false,
      },
      {
        id: "find_eleven_at_two",
        text: "The algorithm must continue until index 2 because complements can only be found after two prior insertions.",
        isCorrect: false,
      },
      {
        id: "no_pair",
        text: "No pair is found because 2 and 7 are not adjacent after being inserted into the Map.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Before index 1 is processed, seen contains 2 mapped to index 0.",
      mentalModelCorrection:
        "The current item asks whether its needed partner already exists in the processed prefix.",
      mistakeTypes: ["complement_lookup_trace_mismatch"],
      nextAction: "Write the Map contents immediately before each lookup.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-005",
    learningStage: "foundations",
    primarySkillAtomId: "handle_duplicate_values_in_complement_lookup",
    secondarySkillAtomIds: [
      "avoid_self_pairing",
      "distinguish_equal_values_from_equal_indexes",
    ],
    type: "edge_case_drill",
    prompt: `The input is:

values = [3, 3]
target = 6

What should a correct lookup-before-insert algorithm return?`,
    options: [
      {
        id: "zero_one",
        text: "[0, 1], because the second 3 can pair with the earlier 3 at a distinct index.",
        isCorrect: true,
      },
      {
        id: "zero_zero",
        text: "[0, 0], because one occurrence of 3 may be reused.",
        isCorrect: false,
      },
      {
        id: "no_pair_duplicates_invalid",
        text: "No pair, because equal numeric values cannot form a valid pair.",
        isCorrect: false,
      },
      {
        id: "one_one",
        text: "[1, 1], because the current value is inserted before checking its complement.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Distinct elements means distinct indexes, not distinct numeric values.",
      mentalModelCorrection:
        "Lookup-before-insert rejects self-pairing while still permitting two separate occurrences of the same value.",
      mistakeTypes: ["duplicate_values_rejected_as_pair"],
      nextAction: "Track index identity separately from value equality.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-006",
    learningStage: "foundations",
    primarySkillAtomId: "reject_single_element_self_pair",
    secondarySkillAtomIds: [
      "avoid_self_pairing",
      "enforce_distinct_pair_indexes",
    ],
    type: "edge_case_drill",
    prompt: `The input is:

values = [4]
target = 8

What should the algorithm return?`,
    options: [
      {
        id: "no_pair",
        text: "No pair, because the only index cannot be used twice.",
        isCorrect: true,
      },
      {
        id: "zero_zero",
        text: "[0, 0], because 4 is its own complement.",
        isCorrect: false,
      },
      {
        id: "zero_one",
        text: "[0, 1], because the missing second index can be inferred.",
        isCorrect: false,
      },
      {
        id: "value_pair",
        text: "[4, 4], because output indexes are unnecessary when the value is its own complement.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The Map is empty when the only value is checked.",
      mentalModelCorrection:
        "A numeric identity such as 4 + 4 = 8 does not create a second array element.",
      mistakeTypes: ["single_element_self_pair_accepted"],
      nextAction:
        "Verify that the retrieved partner comes from a strictly earlier index.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-007",
    learningStage: "foundations",
    primarySkillAtomId: "choose_map_for_original_index_recovery",
    secondarySkillAtomIds: [
      "align_lookup_state_with_output_contract",
      "store_prior_value_index",
    ],
    type: "single_choice",
    prompt:
      "A one-pass pair-sum function must return original indexes rather than only true or false. What should each Map entry store?",
    options: [
      {
        id: "value_to_prior_index",
        text: "A prior value as the key and an original index where it appeared as the associated value.",
        isCorrect: true,
      },
      {
        id: "value_only_set",
        text: "Only the value, because membership automatically reveals its original index.",
        isCorrect: false,
      },
      {
        id: "index_to_boolean",
        text: "The prior index mapped to true, without storing the value at that index.",
        isCorrect: false,
      },
      {
        id: "complement_to_current_index",
        text: "Every future complement mapped to the current index before any lookup occurs.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A successful lookup must recover positional information about the prior candidate.",
      mentalModelCorrection:
        "The Map value should contain the information required to construct the output.",
      mistakeTypes: ["lookup_state_missing_original_index"],
      nextAction:
        "Derive the stored value type directly from the required return value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-008",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_set_insufficient_for_index_recovery",
    secondarySkillAtomIds: [
      "distinguish_presence_from_index_state",
      "align_state_with_output_contract",
    ],
    type: "solution_comparison",
    prompt: `Two implementations detect a complement among prior values:

A. Uses a Set<number>.
B. Uses a Map<number, number> from value to original index.

The function must return both indexes. Which review is correct?`,
    options: [
      {
        id: "map_supports_required_output",
        text: "Both can detect presence, but only B directly retains the earlier index required for the result.",
        isCorrect: true,
      },
      {
        id: "set_returns_index",
        text: "A Set is sufficient because Set.has returns the index of the matching key.",
        isCorrect: false,
      },
      {
        id: "map_cannot_handle_duplicates",
        text: "Only A works because a Map cannot contain duplicate numeric values.",
        isCorrect: false,
      },
      {
        id: "both_return_indexes",
        text: "Both representations preserve exactly the same positional information.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Membership and index recovery are different state requirements.",
      mentalModelCorrection:
        "A Set answers whether a partner exists but not where that partner occurred.",
      mistakeTypes: ["set_used_for_index_return_contract"],
      nextAction:
        "Check whether every piece of the returned answer can be reconstructed from the chosen state.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-complement-lookup-index-recovery-009",
    learningStage: "foundations",
    primarySkillAtomId: "use_map_has_for_index_lookup",
    secondarySkillAtomIds: [
      "handle_zero_index_map_value",
      "distinguish_missing_from_falsy_value",
    ],
    type: "mistake_review",
    prompt: `Review this check:

const priorIndex = seen.get(complement);

if (priorIndex) {
  return [priorIndex, currentIndex];
}

Why can it fail?`,
    options: [
      {
        id: "zero_index_is_falsy",
        text: "A valid prior index can be 0, which is falsy, so the pair may be missed.",
        isCorrect: true,
      },
      {
        id: "get_never_returns_numbers",
        text: "Map.get cannot return numeric values.",
        isCorrect: false,
      },
      {
        id: "indexes_start_at_one",
        text: "Array indexes begin at one, so zero should never be stored.",
        isCorrect: false,
      },
      {
        id: "complement_must_be_boolean",
        text: "The complement must first be converted to a boolean key.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The absence marker undefined and the valid stored value 0 are both falsy.",
      mentalModelCorrection:
        "Use seen.has(complement) to test membership when Map values may legitimately be falsy.",
      mistakeTypes: ["map_index_zero_treated_as_missing"],
      nextAction:
        "Separate membership testing from retrieval of the associated index.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-complement-lookup-index-recovery-010",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_first_index_when_contract_requires_earliest",
    secondarySkillAtomIds: [
      "handle_duplicate_map_overwrites",
      "align_duplicate_policy_with_output_contract",
    ],
    type: "solution_comparison",
    prompt: `The function must return a valid pair whose earlier index is as small as possible.

When the same value appears again before a match is found, which insertion policy better supports that contract?`,
    options: [
      {
        id: "keep_first_index",
        text: "Insert the value only if it is not already present, preserving its earliest index.",
        isCorrect: true,
      },
      {
        id: "overwrite_with_latest",
        text: "Always overwrite the stored index with the latest occurrence.",
        isCorrect: false,
      },
      {
        id: "delete_duplicate_key",
        text: "Delete the value whenever a duplicate is observed.",
        isCorrect: false,
      },
      {
        id: "store_current_before_lookup",
        text: "Overwrite the index before lookup so the current position becomes the preferred partner.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Duplicate values offer several possible prior indexes, but the output contract prefers the earliest.",
      mentalModelCorrection:
        "Whether duplicate keys should overwrite depends on which occurrence the result must recover.",
      mistakeTypes: ["duplicate_index_policy_disconnected_from_output"],
      nextAction:
        "Define whether the Map should retain the first, latest, or all indexes for each value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-complement-lookup-index-recovery-011",
    learningStage: "foundations",
    primarySkillAtomId: "evaluate_duplicate_overwrite_for_any_pair_contract",
    secondarySkillAtomIds: [
      "handle_duplicate_map_entries",
      "distinguish_any_pair_from_earliest_pair",
    ],
    type: "single_choice",
    prompt:
      "A function may return any valid pair and needs only one prior index per value. Is overwriting a value's earlier index with a later prior index necessarily incorrect?",
    options: [
      {
        id: "not_if_any_pair",
        text: "No. It may still produce a valid distinct-index pair, although it changes which pair is returned.",
        isCorrect: true,
      },
      {
        id: "always_incorrect",
        text: "Yes. A Map entry may never be updated after its first insertion.",
        isCorrect: false,
      },
      {
        id: "causes_self_pair_automatically",
        text: "Yes. Any overwrite automatically pairs the current index with itself.",
        isCorrect: false,
      },
      {
        id: "duplicates_must_use_set",
        text: "Yes. Duplicate values require replacing the Map with a Set.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The retained index remains earlier than a future current index and still represents a valid candidate.",
      mentalModelCorrection:
        "Duplicate overwrite policy is part of the output-selection contract, not universally a correctness error.",
      mistakeTypes: ["duplicate_overwrite_assumed_always_invalid"],
      nextAction:
        "Separate validity requirements from deterministic or earliest-pair requirements.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-012",
    learningStage: "foundations",
    primarySkillAtomId: "trace_complement_lookup_with_negative_values",
    secondarySkillAtomIds: ["compute_pair_complement", "recover_prior_index"],
    type: "single_choice",
    prompt: `Trace the lookup:

values = [-4, 6, 1, 9]
target = 2

At currentIndex = 1, what happens?`,
    options: [
      {
        id: "find_negative_four",
        text: "The current value is 6, its complement is -4, and prior index 0 is found.",
        isCorrect: true,
      },
      {
        id: "complement_is_four",
        text: "The complement is 4, so no pair is found.",
        isCorrect: false,
      },
      {
        id: "negative_keys_invalid",
        text: "The lookup fails because Map keys cannot be negative.",
        isCorrect: false,
      },
      {
        id: "must_wait_for_nine",
        text: "The algorithm must wait until it encounters a positive complement.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The complement calculation is target - current: 2 - 6 = -4.",
      mentalModelCorrection:
        "Complement lookup works with negative keys exactly as it does with positive keys.",
      mistakeTypes: ["negative_complement_trace_mismatch"],
      nextAction:
        "Compute the needed prior value algebraically without assuming its sign.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-013",
    learningStage: "foundations",
    primarySkillAtomId: "handle_zero_duplicate_pair",
    secondarySkillAtomIds: [
      "avoid_self_pairing",
      "handle_duplicate_values_in_complement_lookup",
    ],
    type: "edge_case_drill",
    prompt: `The input is:

values = [0, 0]
target = 0

How should lookup-before-insert behave?`,
    options: [
      {
        id: "second_zero_finds_first",
        text: "The first zero is inserted after its failed lookup; the second zero finds it and returns [0, 1].",
        isCorrect: true,
      },
      {
        id: "first_zero_pairs_itself",
        text: "The first zero immediately returns [0, 0].",
        isCorrect: false,
      },
      {
        id: "zero_cannot_be_map_key",
        text: "No pair is found because zero cannot be used as a Map key.",
        isCorrect: false,
      },
      {
        id: "zero_is_missing",
        text: "The second lookup fails because a stored zero key is treated as absent.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The key is zero, while its associated index is also allowed to be zero.",
      mentalModelCorrection:
        "Map.has correctly distinguishes a stored zero key from absence, and insertion order preserves distinct indexes.",
      mistakeTypes: ["zero_duplicate_pair_mishandled"],
      nextAction: "Test both zero keys and zero index values explicitly.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-complement-lookup-index-recovery-014",
    learningStage: "foundations",
    primarySkillAtomId: "trace_complement_lookup_with_repeated_values",
    secondarySkillAtomIds: [
      "handle_duplicate_map_entries",
      "recover_valid_prior_candidate",
    ],
    type: "single_choice",
    prompt: `A Map preserves the first index for each value.

values = [1, 1, 2]
target = 3

What pair is returned when index 2 is processed?`,
    options: [
      {
        id: "zero_two",
        text: "[0, 2], because complement 1 maps to its preserved first index.",
        isCorrect: true,
      },
      {
        id: "one_two",
        text: "[1, 2], because duplicate values must always overwrite earlier indexes.",
        isCorrect: false,
      },
      {
        id: "zero_one",
        text: "[0, 1], because two occurrences of 1 sum to 3.",
        isCorrect: false,
      },
      {
        id: "no_pair",
        text: "No pair, because a duplicated complement cannot be stored in a Map.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "At index 2, the needed prior value is 1, and the chosen duplicate policy retains index 0.",
      mentalModelCorrection:
        "The Map can store one selected representative index for repeated values.",
      mistakeTypes: ["repeated_value_index_trace_mismatch"],
      nextAction:
        "Track both the key and the duplicate-retention policy during the trace.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-complement-lookup-index-recovery-015",
    learningStage: "foundations",
    primarySkillAtomId: "state_seen_map_prefix_invariant",
    secondarySkillAtomIds: [
      "maintain_prior_candidate_invariant",
      "prove_distinct_pair_indexes",
    ],
    type: "single_choice",
    prompt:
      "Which invariant most directly explains why lookup-before-insert cannot return the same index twice?",
    options: [
      {
        id: "seen_contains_only_smaller_indexes",
        text: "Before index i is checked, every index stored in seen is strictly smaller than i.",
        isCorrect: true,
      },
      {
        id: "seen_contains_no_duplicates",
        text: "The Map never contains two equal values.",
        isCorrect: false,
      },
      {
        id: "complement_differs_from_current",
        text: "The complement is always numerically different from the current value.",
        isCorrect: false,
      },
      {
        id: "current_index_is_positive",
        text: "The current index is always greater than zero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The partner index comes from a completed prefix that excludes the current position.",
      mentalModelCorrection:
        "Distinctness follows from temporal ordering of state, even when the two numeric values are equal.",
      mistakeTypes: ["distinct_index_invariant_not_understood"],
      nextAction: "Express the Map domain in terms of processed index bounds.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-complement-lookup-index-recovery-016",
    learningStage: "foundations",
    primarySkillAtomId: "compute_correct_pair_complement",
    secondarySkillAtomIds: [
      "translate_pair_equation",
      "review_complement_lookup_code",
    ],
    type: "mistake_review",
    prompt: `A candidate computes:

const complement = current - target;

Which correction is required for the equation:

prior + current = target?`,
    options: [
      {
        id: "target_minus_current",
        text: "Use target - current, because prior must equal target minus the current value.",
        isCorrect: true,
      },
      {
        id: "current_plus_target",
        text: "Use current + target, because both values contribute to the sum.",
        isCorrect: false,
      },
      {
        id: "absolute_difference",
        text: "Use Math.abs(current - target), because complements cannot be negative.",
        isCorrect: false,
      },
      {
        id: "target_divided_by_current",
        text: "Use target / current, because the two values share the target.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Rearranging prior + current = target gives prior = target - current.",
      mentalModelCorrection:
        "The lookup key must represent the exact earlier value that would complete the target.",
      mistakeTypes: ["complement_formula_reversed"],
      nextAction:
        "Derive the lookup expression algebraically before implementing it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-complement-lookup-index-recovery-017",
    learningStage: "foundations",
    primarySkillAtomId: "return_prior_and_current_indexes",
    secondarySkillAtomIds: [
      "recover_original_pair_indexes",
      "interpret_map_entry_direction",
    ],
    type: "single_choice",
    prompt: `The Map stores:

seen.set(value, originalIndex);

At currentIndex, seen.has(complement) is true. Which result directly follows from that representation?`,
    options: [
      {
        id: "stored_index_and_current",
        text: "[seen.get(complement), currentIndex]",
        isCorrect: true,
      },
      {
        id: "complement_and_current_value",
        text: "[complement, values[currentIndex]]",
        isCorrect: false,
      },
      {
        id: "current_twice",
        text: "[currentIndex, currentIndex]",
        isCorrect: false,
      },
      {
        id: "stored_value_and_complement",
        text: "[seen.get(values[currentIndex]), complement]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The key identifies the needed prior value, while the associated Map value stores its original index.",
      mentalModelCorrection:
        "Read the output fields from the declared key-value semantics rather than from variable names alone.",
      mistakeTypes: ["map_key_value_roles_reversed"],
      nextAction:
        "State separately what the Map key means and what its associated value means.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-complement-lookup-index-recovery-018",
    learningStage: "foundations",
    primarySkillAtomId: "compare_complement_lookup_orderings",
    secondarySkillAtomIds: [
      "avoid_self_pairing",
      "handle_duplicate_values_in_complement_lookup",
    ],
    type: "solution_comparison",
    prompt: `Compare two one-pass implementations:

Solution A:
1. Look up target - current.
2. If absent, insert current.

Solution B:
1. Insert current.
2. Look up target - current.

Which comparison is correct?`,
    options: [
      {
        id: "a_preserves_prior_candidate_semantics",
        text: "Solution A keeps Map entries limited to prior candidates, preventing self-pairing while still allowing equal values at different indexes.",
        isCorrect: true,
      },
      {
        id: "b_better_for_duplicates",
        text: "Solution B is required for duplicates because the current value must be inserted before it can pair with an earlier equal value.",
        isCorrect: false,
      },
      {
        id: "both_equivalent",
        text: "The two orders are always equivalent because Map insertion and lookup are constant-time operations.",
        isCorrect: false,
      },
      {
        id: "a_cannot_find_equal_values",
        text: "Solution A cannot find pairs such as [3, 3] because the second 3 is not inserted before lookup.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "When the second equal value is processed, the first occurrence is already present even though the current occurrence is not.",
      mentalModelCorrection:
        "Lookup-before-insert separates valid duplicate pairing from invalid reuse of the current element.",
      mistakeTypes: ["lookup_and_insert_order_assumed_equivalent"],
      nextAction:
        "Test both implementations on a single self-complementing value and on two equal occurrences.",
      result: "diagnostic",
    },
  },
];
