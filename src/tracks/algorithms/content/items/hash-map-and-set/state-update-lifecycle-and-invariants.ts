export const stateUpdateLifecycleAndInvariantsQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-keyed-state-lifecycle-001",
    learningStage: "foundations",
    primarySkillAtomId: "define_stable_keyed_state_invariant",
    secondarySkillAtomIds: [
      "interpret_active_count_entries",
      "distinguish_missing_key_from_stored_value",
    ],
    type: "invariant_identification",
    prompt: `A Map represents active occurrence counts and deletes a key when its count reaches zero.

Which invariant is precise?`,
    options: [
      {
        id: "present_means_positive_absent_means_zero",
        text: "For every key, a present entry stores its exact positive active count, while an absent key represents an active count of zero.",
        isCorrect: true,
      },
      {
        id: "present_means_seen",
        text: "A present entry means only that the key appeared at some time, regardless of its current count.",
        isCorrect: false,
      },
      {
        id: "missing_means_uncomputed",
        text: "Every absent key means that its count has not yet been computed.",
        isCorrect: false,
      },
      {
        id: "zero_and_missing_interchangeable_without_policy",
        text: "Zero counts and missing entries may be interpreted differently on each lookup.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The representation keeps only keys with positive active availability.",
      mentalModelCorrection:
        "A keyed-state invariant must define both stored entries and missing keys consistently.",
      mistakeTypes: ["keyed_state_invariant_undefined"],
      nextAction:
        "State what presence, absence, and every permitted stored value mean.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-keyed-state-lifecycle-002",
    learningStage: "foundations",
    primarySkillAtomId: "order_count_consumption_updates",
    secondarySkillAtomIds: [
      "validate_positive_availability",
      "decrement_or_delete_count",
    ],
    type: "subgoal_ordering",
    prompt:
      "A Map stores remaining positive availability and omits exhausted keys. Which sequence correctly consumes one occurrence?",
    options: [
      {
        id: "lookup_validate_update",
        text: "Look up the count, reject if the key is missing, then decrement it or delete the key when the new count becomes zero.",
        isCorrect: true,
      },
      {
        id: "decrement_then_validate",
        text: "Write count - 1 first and reject only after the stored value becomes negative.",
        isCorrect: false,
      },
      {
        id: "delete_then_lookup",
        text: "Delete the key first, then look up how many occurrences had been available.",
        isCorrect: false,
      },
      {
        id: "validate_without_update",
        text: "Check that the key exists but leave its count unchanged after consumption.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Consumption is legal only when availability exists, and successful consumption must change the state by exactly one.",
      mentalModelCorrection:
        "The lifecycle is read, validate, then mutate without creating an invalid intermediate count.",
      mistakeTypes: ["count_consumption_order_mismatch"],
      nextAction: "Keep invalid requests from modifying the Map.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-keyed-state-lifecycle-003",
    learningStage: "foundations",
    primarySkillAtomId: "increment_existing_or_missing_count",
    secondarySkillAtomIds: [
      "initialize_missing_count",
      "preserve_existing_count",
    ],
    type: "mistake_review",
    prompt: `A frequency-building loop performs:

counts.set(value, 1);

for every observation. What is the problem?`,
    options: [
      {
        id: "overwrites_existing_count",
        text: "Every repeated occurrence overwrites the previous count with 1 instead of incrementing it.",
        isCorrect: true,
      },
      {
        id: "one_is_invalid_count",
        text: "A newly observed key must begin at count 0.",
        isCorrect: false,
      },
      {
        id: "set_cannot_update",
        text: "Map.set cannot update an existing key.",
        isCorrect: false,
      },
      {
        id: "must_delete_first",
        text: "The key must be deleted before every increment.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The stored count should represent all relevant occurrences, not only the latest one.",
      mentalModelCorrection:
        "A missing key begins from zero; an existing key must preserve and extend its prior state.",
      mistakeTypes: ["count_increment_resets_existing_state"],
      nextAction: "Update the count as `(counts.get(value) ?? 0) + 1`.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-keyed-state-lifecycle-004",
    learningStage: "foundations",
    primarySkillAtomId: "trace_count_decrement_and_deletion",
    secondarySkillAtomIds: [
      "delete_zero_count_key",
      "maintain_positive_count_invariant",
    ],
    type: "edge_case_drill",
    prompt: `The Map initially contains:

"a" → 2

The algorithm consumes "a" twice and deletes a key when its count reaches zero. What is the state after each consumption?`,
    options: [
      {
        id: "one_then_missing",
        text: 'After the first: "a" → 1. After the second: the key "a" is absent.',
        isCorrect: true,
      },
      {
        id: "one_then_zero_stored",
        text: 'After the first: "a" → 1. After the second: "a" → 0 remains stored.',
        isCorrect: false,
      },
      {
        id: "missing_after_first",
        text: "The key is deleted after the first consumption because it has been used once.",
        isCorrect: false,
      },
      {
        id: "two_then_one",
        text: "The count remains 2 after the first consumption and becomes 1 after the second.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each successful consumption removes one available occurrence, and the representation omits zero-count keys.",
      mentalModelCorrection:
        "Deletion is the final state transition when a positive count is decremented to zero.",
      mistakeTypes: ["count_deletion_trace_mismatch"],
      nextAction: "Trace the lifecycle as 2 → 1 → absent.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-005",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_missing_from_stored_zero",
    secondarySkillAtomIds: [
      "use_map_has_for_presence",
      "avoid_truthiness_state_checks",
    ],
    type: "code_reading",
    prompt: `Consider:

const state = new Map<string, number>();
state.set("x", 0);

What do these expressions return?

state.has("x")
state.get("x")`,
    options: [
      {
        id: "true_and_zero",
        text: "true and 0, because the key exists with a stored zero value.",
        isCorrect: true,
      },
      {
        id: "false_and_undefined",
        text: "false and undefined, because zero removes the key automatically.",
        isCorrect: false,
      },
      {
        id: "false_and_zero",
        text: "false and 0, because Map.has uses truthiness.",
        isCorrect: false,
      },
      {
        id: "true_and_undefined",
        text: "true and undefined, because Map.get cannot return zero.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Map membership is independent of whether the associated value is truthy.",
      mentalModelCorrection:
        "A missing key and a key storing zero are distinct Map states unless the application deliberately forbids stored zero counts.",
      mistakeTypes: ["missing_and_zero_conflated"],
      nextAction:
        "Use Map.has when the distinction between absence and a stored value matters.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-006",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_cached_false_value",
    secondarySkillAtomIds: [
      "distinguish_false_from_uncomputed",
      "use_membership_for_cache_lookup",
    ],
    type: "mistake_review",
    prompt: `A cache stores boolean computation results:

const cached = results.get(key);

if (!cached) {
  results.set(key, compute(key));
}

Why can this recompute an already cached result?`,
    options: [
      {
        id: "false_is_treated_as_missing",
        text: "A valid stored result of false enters the branch because false is falsy.",
        isCorrect: true,
      },
      {
        id: "get_deletes_false",
        text: "Map.get automatically deletes keys whose value is false.",
        isCorrect: false,
      },
      {
        id: "booleans_invalid_in_map",
        text: "A Map cannot store boolean values.",
        isCorrect: false,
      },
      {
        id: "true_is_uncomputed",
        text: "A stored true value represents an uncomputed result.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The domain of valid computed results includes false.",
      mentalModelCorrection:
        "Truthiness cannot distinguish cached false from a missing entry.",
      mistakeTypes: ["cached_false_treated_as_uncomputed"],
      nextAction:
        "Use results.has(key) to test whether computation has already occurred.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-007",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_stored_undefined_from_missing",
    secondarySkillAtomIds: [
      "use_map_has_for_undefined_values",
      "design_uncomputed_state_representation",
    ],
    type: "single_choice",
    prompt: `A Map is allowed to store undefined as a legitimate computed value.

Which statement is correct?`,
    options: [
      {
        id: "get_ambiguous_has_distinguishes",
        text: "Map.get(key) alone cannot distinguish a missing key from a key storing undefined, but Map.has(key) can.",
        isCorrect: true,
      },
      {
        id: "undefined_cannot_be_stored",
        text: "Map refuses to store undefined values.",
        isCorrect: false,
      },
      {
        id: "get_returns_special_missing",
        text: "Map.get returns a separate built-in missing sentinel when the key is absent.",
        isCorrect: false,
      },
      {
        id: "has_false_for_undefined",
        text: "Map.has returns false whenever the stored value is undefined.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Both absence and a stored undefined value produce undefined from Map.get.",
      mentalModelCorrection:
        "When undefined is part of the value domain, membership must be checked separately or a different sentinel must be used.",
      mistakeTypes: ["stored_undefined_conflated_with_missing"],
      nextAction:
        "Define whether undefined means a computed value or absence, and choose the lookup protocol accordingly.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-008",
    learningStage: "foundations",
    primarySkillAtomId: "choose_nullish_default_for_valid_falsy_state",
    secondarySkillAtomIds: [
      "distinguish_nullish_from_falsy",
      "preserve_zero_and_false_values",
    ],
    type: "solution_comparison",
    prompt: `A stored value may legitimately be 0 or false. Compare:

A. state.get(key) || fallback
B. state.get(key) ?? fallback

Which review is correct?`,
    options: [
      {
        id: "nullish_preserves_zero_false",
        text: "B preserves stored 0 and false, while A replaces them because both are falsy.",
        isCorrect: true,
      },
      {
        id: "both_replace_only_missing",
        text: "Both expressions use fallback only when the key is missing.",
        isCorrect: false,
      },
      {
        id: "or_preserves_false",
        text: "A preserves false but replaces only zero.",
        isCorrect: false,
      },
      {
        id: "nullish_detects_map_membership",
        text: "B fully distinguishes a missing key from a key explicitly storing undefined.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Logical OR reacts to all falsy values, while nullish coalescing reacts only to null or undefined.",
      mentalModelCorrection:
        "Use a defaulting operation whose missing-value semantics match the permitted stored-value domain.",
      mistakeTypes: ["falsy_and_nullish_defaults_conflated"],
      nextAction:
        "List all legitimate stored values before selecting `||`, `??`, or `Map.has`.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-009",
    learningStage: "foundations",
    primarySkillAtomId: "prevent_negative_remaining_counts",
    secondarySkillAtomIds: [
      "validate_before_decrement",
      "preserve_nonnegative_count_invariant",
    ],
    type: "mistake_review",
    prompt: `A remaining-availability Map uses this update:

const next = (counts.get(key) ?? 0) - 1;
counts.set(key, next);

if (next < 0) {
  return false;
}

What is the principal lifecycle problem?`,
    options: [
      {
        id: "invalid_state_written_before_rejection",
        text: "An unavailable request writes a negative count before it is rejected, violating the state invariant.",
        isCorrect: true,
      },
      {
        id: "zero_must_be_negative",
        text: "The code is wrong because exhausted availability should be represented by -1.",
        isCorrect: false,
      },
      {
        id: "decrement_must_be_two",
        text: "Every request should reduce availability by two.",
        isCorrect: false,
      },
      {
        id: "missing_should_default_one",
        text: "A missing key must always default to one available occurrence.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The representation promises nonnegative or positive counts, but the code temporarily stores an impossible value.",
      mentalModelCorrection:
        "Validate availability before mutation so failed operations leave keyed state unchanged.",
      mistakeTypes: ["invalid_negative_count_committed"],
      nextAction:
        "Read the current count, reject missing or zero availability, and only then write the decremented state.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-keyed-state-lifecycle-010",
    learningStage: "foundations",
    primarySkillAtomId: "trace_keyed_count_lifecycle",
    secondarySkillAtomIds: [
      "increment_frequency_count",
      "consume_and_delete_count",
    ],
    type: "edge_case_drill",
    prompt: `A positive-count Map starts empty and processes:

1. add "k"
2. add "k"
3. consume "k"
4. consume "k"

Zero-count keys are deleted. Which sequence describes the state of "k"?`,
    options: [
      {
        id: "one_two_one_absent",
        text: "1 → 2 → 1 → absent",
        isCorrect: true,
      },
      {
        id: "one_one_zero_negative",
        text: "1 → 1 → 0 → -1",
        isCorrect: false,
      },
      {
        id: "present_present_absent_absent",
        text: "1 → 1 → absent → absent",
        isCorrect: false,
      },
      {
        id: "zero_one_two_one",
        text: "0 → 1 → 2 → 1",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Adds increase multiplicity, consumes decrease it, and the final transition removes the exhausted entry.",
      mentalModelCorrection:
        "A count has a complete lifecycle from absence to positive state and back to absence.",
      mistakeTypes: ["keyed_count_lifecycle_trace_mismatch"],
      nextAction:
        "Apply exactly one state transition for each add or consume event.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-011",
    learningStage: "foundations",
    primarySkillAtomId: "align_map_size_with_zero_count_policy",
    secondarySkillAtomIds: [
      "interpret_live_key_count",
      "delete_exhausted_entries",
    ],
    type: "mistake_review",
    prompt: `A Map is intended to contain only keys with positive remaining counts. After decrementing a count from 1 to 0, the implementation stores key → 0.

Why can this break later reasoning?`,
    options: [
      {
        id: "presence_and_size_no_longer_mean_active",
        text: "Map.has(key) and Map.size no longer describe keys with positive availability, contradicting the intended invariant.",
        isCorrect: true,
      },
      {
        id: "map_rejects_zero",
        text: "JavaScript Map throws when zero is used as a value.",
        isCorrect: false,
      },
      {
        id: "zero_increases_size_twice",
        text: "Setting zero creates two entries for the same key.",
        isCorrect: false,
      },
      {
        id: "zero_becomes_false_key",
        text: "The numeric value zero changes the key into boolean false.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The chosen representation equates key presence with positive active state.",
      mentalModelCorrection:
        "Zero-count deletion is not merely cleanup when membership and size are used as semantic shortcuts.",
      mistakeTypes: ["zero_entry_violates_positive_only_invariant"],
      nextAction:
        "Delete the entry when its count becomes zero or redefine all dependent checks consistently.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-012",
    learningStage: "foundations",
    primarySkillAtomId: "compare_zero_count_representations",
    secondarySkillAtomIds: [
      "maintain_consistent_missing_semantics",
      "choose_zero_count_key_policy",
    ],
    type: "solution_comparison",
    prompt: `Two designs represent exhausted counts:

A. Retain key → 0 and test count > 0.
B. Delete the key and treat absence as zero.

Which review is correct?`,
    options: [
      {
        id: "both_valid_if_consistent",
        text: "Both can be correct, but membership, size, and update logic must follow the chosen representation consistently.",
        isCorrect: true,
      },
      {
        id: "only_a_valid",
        text: "Only A is valid because deleting a key always loses required history.",
        isCorrect: false,
      },
      {
        id: "only_b_valid",
        text: "Only B is valid because Maps are never allowed to store zero.",
        isCorrect: false,
      },
      {
        id: "interchangeable_per_lookup",
        text: "The implementation may switch between both meanings without changing any checks.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The logical count can be represented by an explicit zero or by absence.",
      mentalModelCorrection:
        "Representation choices are flexible, but the invariant cannot change opportunistically between operations.",
      mistakeTypes: ["zero_count_representation_used_inconsistently"],
      nextAction:
        "Document one zero-state policy and derive membership and size checks from it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-013",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_uncomputed_from_computed_values",
    secondarySkillAtomIds: [
      "design_cache_state_lifecycle",
      "preserve_false_zero_and_undefined_results",
    ],
    type: "solution_comparison",
    prompt: `A cache computation may legitimately return false, 0, or undefined. The cache must distinguish each computed result from "not computed yet."

Which design is strongest?`,
    options: [
      {
        id: "membership_marks_computed",
        text: "Use Map.has(key) to determine whether computation occurred, then use Map.get(key) to retrieve the stored result.",
        isCorrect: true,
      },
      {
        id: "truthiness_marks_computed",
        text: "Treat any truthy result as computed and every falsy result as uncomputed.",
        isCorrect: false,
      },
      {
        id: "undefined_only_missing",
        text: "Use Map.get(key) === undefined as the complete test, even though undefined is a valid result.",
        isCorrect: false,
      },
      {
        id: "convert_results_to_boolean",
        text: "Convert every computed result to boolean so all value distinctions disappear.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every ordinary falsy value belongs to the valid result domain.",
      mentalModelCorrection:
        "Computation status is membership metadata, while the stored value is the computation result.",
      mistakeTypes: ["uncomputed_state_conflated_with_valid_falsy_result"],
      nextAction:
        "Separate whether a result exists from what that result equals.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-keyed-state-lifecycle-014",
    learningStage: "foundations",
    primarySkillAtomId: "state_consumable_map_iteration_invariant",
    secondarySkillAtomIds: [
      "prove_count_update_lifecycle",
      "distinguish_missing_zero_and_invalid_counts",
    ],
    type: "invariant_identification",
    prompt: `A Map is initialized from available items, stores only positive remaining counts, and is updated after each successfully processed request.

Which invariant should hold after every request prefix?`,
    options: [
      {
        id: "remaining_supply_positive_entries",
        text: "For every key, its stored value equals initial supply minus successfully consumed requests; keys with zero remaining supply are absent, and no stored count is zero or negative.",
        isCorrect: true,
      },
      {
        id: "original_supply_unchanged",
        text: "Every stored count remains equal to the original supply regardless of consumption.",
        isCorrect: false,
      },
      {
        id: "request_count_only",
        text: "Every stored value equals the number of requests observed for that key, including rejected requests.",
        isCorrect: false,
      },
      {
        id: "missing_means_uncomputed",
        text: "Every missing key means that its initial supply has not yet been calculated.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The state represents remaining consumable supply after the successfully processed prefix.",
      mentalModelCorrection:
        "A stable invariant links initialization, successful updates, deletion at zero, and the meaning of absence.",
      mistakeTypes: ["count_lifecycle_invariant_incomplete"],
      nextAction:
        "Express current state as initial keyed state minus committed operations.",
      result: "diagnostic",
    },
  },
];
