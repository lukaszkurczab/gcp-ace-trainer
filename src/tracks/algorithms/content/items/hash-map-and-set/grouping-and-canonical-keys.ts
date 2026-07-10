export const groupingAndCanonicalKeysQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-001",
    learningStage: "foundations",
    primarySkillAtomId: "define_canonical_grouping_key_contract",
    secondarySkillAtomIds: [
      "model_equivalence_relation",
      "prevent_grouping_key_collisions",
    ],
    type: "single_choice",
    prompt:
      "Which property must a grouping key satisfy for the application's equivalence relation?",
    options: [
      {
        id: "equivalent_same_nonequivalent_different",
        text: "Equivalent items must produce the same key, and non-equivalent items must not produce the same key within the supported input domain.",
        isCorrect: true,
      },
      {
        id: "all_items_unique",
        text: "Every input item must produce a different key, including equivalent items.",
        isCorrect: false,
      },
      {
        id: "same_length_same_key",
        text: "Items of the same encoded length should produce the same key.",
        isCorrect: false,
      },
      {
        id: "collisions_resolved_by_bucket",
        text: "Any key is sufficient because items placed in the same Map bucket are automatically equivalent.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The key defines which items are placed in the same bucket.",
      mentalModelCorrection:
        "A grouping key must represent the equivalence relation itself. Map lookup does not verify that accidentally colliding items are equivalent.",
      mistakeTypes: ["canonical_key_contract_mismatch"],
      nextAction:
        "Test both directions: equivalent inputs share a key, and different equivalence classes do not.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-002",
    learningStage: "foundations",
    primarySkillAtomId: "choose_canonical_anagram_key",
    secondarySkillAtomIds: [
      "normalize_order_independent_content",
      "group_by_equivalence_key",
    ],
    type: "single_choice",
    prompt:
      "Lowercase words should be grouped when they contain exactly the same characters with the same multiplicities, regardless of order. Which key is valid?",
    options: [
      {
        id: "sorted_characters",
        text: "The word's characters sorted into a canonical string.",
        isCorrect: true,
      },
      {
        id: "word_length",
        text: "The number of characters in the word.",
        isCorrect: false,
      },
      {
        id: "first_character",
        text: "The first character of the original word.",
        isCorrect: false,
      },
      {
        id: "set_of_characters",
        text: "The distinct characters with duplicate occurrences removed.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Order is irrelevant, but exact character multiplicity remains relevant.",
      mentalModelCorrection:
        "The canonical key must remove only irrelevant differences. Removing duplicate characters loses required frequency information.",
      mistakeTypes: ["canonical_key_loses_multiplicity"],
      nextAction:
        "Identify which input differences should disappear and which must remain encoded.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-grouping-canonical-keys-003",
    learningStage: "foundations",
    primarySkillAtomId: "choose_frequency_signature_key",
    secondarySkillAtomIds: [
      "encode_exact_symbol_counts",
      "serialize_composite_key_safely",
    ],
    type: "solution_comparison",
    prompt: `For lowercase English words, two canonical-key strategies are proposed:

A. Sort every word's characters.
B. Count the 26 letters and serialize the complete count vector.

Which review is correct?`,
    options: [
      {
        id: "both_valid_if_vector_unambiguous",
        text: "Both can be valid; B must encode all 26 counts unambiguously so different frequency vectors cannot share a key.",
        isCorrect: true,
      },
      {
        id: "set_of_present_letters_enough",
        text: "B only needs to record which letters have positive counts.",
        isCorrect: false,
      },
      {
        id: "sorting_only_possible",
        text: "Only A can be canonical because numeric count vectors cannot represent anagrams.",
        isCorrect: false,
      },
      {
        id: "count_sum_is_enough",
        text: "B can use the sum of all letter counts because words with equal length are equivalent.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "An anagram class is determined by the complete frequency of every supported character.",
      mentalModelCorrection:
        "Different canonical representations may model the same equivalence relation, provided none discard or ambiguously encode required information.",
      mistakeTypes: ["frequency_signature_incomplete"],
      nextAction:
        "Verify that the serialized vector can be decoded into exactly one count assignment.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-004",
    learningStage: "foundations",
    primarySkillAtomId: "normalize_case_insensitive_grouping_key",
    secondarySkillAtomIds: [
      "preserve_original_group_members",
      "separate_key_from_output_value",
    ],
    type: "single_choice",
    prompt:
      "Strings should be grouped case-insensitively, but the output must retain each original spelling. Which design matches that contract?",
    options: [
      {
        id: "normalized_key_original_bucket_value",
        text: "Use a normalized form such as lowercase as the Map key, but append the original string to the bucket.",
        isCorrect: true,
      },
      {
        id: "normalize_and_output_only_key",
        text: "Lowercase every string and store only the lowercase result in the output groups.",
        isCorrect: false,
      },
      {
        id: "original_string_as_key",
        text: "Use each unchanged original string as the key, because output preservation automatically makes grouping case-insensitive.",
        isCorrect: false,
      },
      {
        id: "string_length_key",
        text: "Use string length as the key because case changes do not affect length.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The grouping comparison and the returned representation have different requirements.",
      mentalModelCorrection:
        "A canonical key may normalize an item without requiring the original item itself to be replaced in the output.",
      mistakeTypes: ["normalized_key_confused_with_output_value"],
      nextAction:
        "Store the canonical representation as the key and the required original representation as the bucket member.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-grouping-canonical-keys-005",
    learningStage: "foundations",
    primarySkillAtomId: "canonicalize_unordered_pair_key",
    secondarySkillAtomIds: [
      "normalize_symmetric_components",
      "serialize_composite_key_safely",
    ],
    type: "single_choice",
    prompt:
      "Pairs [a, b] and [b, a] should belong to the same group, while other unordered pairs should remain separate. Which key strategy is appropriate?",
    options: [
      {
        id: "order_pair_then_serialize",
        text: "Place the two components in a deterministic order, then serialize the ordered pair unambiguously.",
        isCorrect: true,
      },
      {
        id: "original_order_serialization",
        text: "Serialize the components in their original order.",
        isCorrect: false,
      },
      {
        id: "first_component_only",
        text: "Use whichever component appears first as the key.",
        isCorrect: false,
      },
      {
        id: "pair_length",
        text: "Use the number of components, which is always two.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Component order is irrelevant to equivalence, but component identities remain relevant.",
      mentalModelCorrection:
        "Canonicalization should remove the irrelevant permutation without collapsing different component combinations.",
      mistakeTypes: ["unordered_pair_not_canonicalized"],
      nextAction:
        "Normalize symmetric components into one deterministic order before key construction.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-grouping-canonical-keys-006",
    learningStage: "foundations",
    primarySkillAtomId: "canonicalize_equivalent_fraction_key",
    secondarySkillAtomIds: [
      "normalize_ratio_representation",
      "handle_canonical_sign",
    ],
    type: "single_choice",
    prompt:
      "Fractions should be grouped by numeric equality, so 1/2, 2/4, and -3/-6 are equivalent. Which key is appropriate?",
    options: [
      {
        id: "reduced_fraction_normalized_sign",
        text: "Reduce numerator and denominator by their greatest common divisor and normalize the sign to one fixed location.",
        isCorrect: true,
      },
      {
        id: "raw_numerator_denominator",
        text: "Use the original numerator and denominator without normalization.",
        isCorrect: false,
      },
      {
        id: "numerator_plus_denominator",
        text: "Use numerator + denominator.",
        isCorrect: false,
      },
      {
        id: "absolute_values_only",
        text: "Use only the absolute numerator and denominator, ignoring the fraction's sign.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Several syntactic forms represent the same mathematical value.",
      mentalModelCorrection:
        "A canonical representation chooses one normalized form for each equivalence class while preserving distinctions such as positive versus negative values.",
      mistakeTypes: ["equivalent_ratio_forms_not_normalized"],
      nextAction:
        "Reduce common factors and define one consistent sign convention.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-grouping-canonical-keys-007",
    learningStage: "foundations",
    primarySkillAtomId: "detect_ambiguous_composite_key_concatenation",
    secondarySkillAtomIds: [
      "prevent_application_level_key_collision",
      "serialize_composite_key_safely",
    ],
    type: "mistake_review",
    prompt: `A grouping key for two string fields is constructed as:

const key = first + second;

What is the main problem?`,
    options: [
      {
        id: "component_boundaries_are_lost",
        text: 'Different tuples such as ["ab", "c"] and ["a", "bc"] both produce "abc".',
        isCorrect: true,
      },
      {
        id: "concatenation_changes_character_order",
        text: "String concatenation automatically sorts the characters.",
        isCorrect: false,
      },
      {
        id: "map_rejects_string_keys",
        text: "A Map cannot use a concatenated string as a key.",
        isCorrect: false,
      },
      {
        id: "every_composite_key_collides",
        text: "All composite string keys collide regardless of encoding.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The serialized key does not preserve where one component ends and the next begins.",
      mentalModelCorrection:
        "Hash-table collisions are not the only concern. Application-level serialization can make genuinely different inputs produce the exact same key value.",
      mistakeTypes: ["ambiguous_composite_key_concatenation"],
      nextAction:
        "Use an encoding that preserves component boundaries and types.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-grouping-canonical-keys-008",
    learningStage: "foundations",
    primarySkillAtomId: "choose_collision_safe_composite_key_encoding",
    secondarySkillAtomIds: [
      "serialize_structured_key",
      "preserve_component_boundaries",
    ],
    type: "solution_comparison",
    prompt: `Two arbitrary strings must form one composite grouping key.

Solution A:
first + "|" + second

Solution B:
JSON.stringify([first, second])

The input strings may themselves contain "|". Which review is strongest?`,
    options: [
      {
        id: "structured_serialization_safer",
        text: "Solution B preserves the two-component structure without relying on a separator that may also occur in the data.",
        isCorrect: true,
      },
      {
        id: "separator_always_safe",
        text: "Solution A is always collision-free because adding any separator makes concatenation unambiguous.",
        isCorrect: false,
      },
      {
        id: "json_loses_order",
        text: "Solution B is invalid because array serialization ignores component order.",
        isCorrect: false,
      },
      {
        id: "both_collapse_components",
        text: "Both solutions necessarily collapse every pair with the same combined character count.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A delimiter is safe only when its presence in components is impossible or properly escaped.",
      mentalModelCorrection:
        "Composite-key encoding must remain unambiguous for every supported application input, not merely common examples.",
      mistakeTypes: ["unsafe_delimiter_composite_key"],
      nextAction:
        "Use structured serialization, escaping, or length-prefixed components.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-grouping-canonical-keys-009",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_reference_identity_as_content_key",
    secondarySkillAtomIds: [
      "understand_map_object_key_identity",
      "choose_primitive_canonical_key",
    ],
    type: "mistake_review",
    prompt: `A JavaScript grouping algorithm creates a fresh object for every item:

const key = { category: item.category, level: item.level };

const bucket = groups.get(key) ?? [];
groups.set(key, bucket);

Why will equivalent items usually fail to share a bucket?`,
    options: [
      {
        id: "objects_use_reference_identity",
        text: "Different object instances are different Map keys even when their properties contain equal values.",
        isCorrect: true,
      },
      {
        id: "maps_cannot_use_objects",
        text: "JavaScript Map does not allow objects as keys.",
        isCorrect: false,
      },
      {
        id: "property_order_is_random",
        text: "Object property values are deleted when the object is inserted into a Map.",
        isCorrect: false,
      },
      {
        id: "bucket_must_be_set",
        text: "The failure occurs only because each bucket is an array rather than a Set.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The code reconstructs an equal-looking but distinct reference for every observation.",
      mentalModelCorrection:
        "Map object keys use identity, not structural equality. Content-based grouping needs a shared interned object or a canonical primitive representation.",
      mistakeTypes: ["fresh_object_used_as_structural_map_key"],
      nextAction:
        "Encode the relevant fields into a stable primitive key or reuse one canonical object identity.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-010",
    learningStage: "foundations",
    primarySkillAtomId: "append_item_to_map_bucket",
    secondarySkillAtomIds: [
      "initialize_group_bucket",
      "preserve_existing_group_members",
    ],
    type: "single_choice",
    prompt: `Which operation correctly adds item to the bucket associated with key?

const groups = new Map<string, Item[]>();`,
    options: [
      {
        id: "get_or_create_then_push",
        text: `const bucket = groups.get(key) ?? [];
bucket.push(item);
groups.set(key, bucket);`,
        isCorrect: true,
      },
      {
        id: "overwrite_with_single_item",
        text: "groups.set(key, [item]);",
        isCorrect: false,
      },
      {
        id: "store_key_as_bucket",
        text: "groups.set(key, [key]);",
        isCorrect: false,
      },
      {
        id: "append_without_assignment",
        text: "groups.get(key)?.push(item);",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The operation must preserve prior members and create a bucket when the key is first observed.",
      mentalModelCorrection:
        "Grouping is accumulation. Each equivalent observation extends an existing bucket rather than replacing it.",
      mistakeTypes: ["map_bucket_not_initialized_or_preserved"],
      nextAction:
        "Implement get-or-create semantics before appending the current item.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-011",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_bucket_overwrite",
    secondarySkillAtomIds: [
      "preserve_all_group_members",
      "review_map_grouping_update",
    ],
    type: "mistake_review",
    prompt: `A grouping loop performs:

for (const item of items) {
  const key = canonicalize(item);
  groups.set(key, [item]);
}

What is the principal bug?`,
    options: [
      {
        id: "replaces_existing_bucket",
        text: "Every equivalent item replaces the previous bucket, so only the final item for each key remains.",
        isCorrect: true,
      },
      {
        id: "canonical_keys_must_be_numbers",
        text: "Canonical keys cannot be strings or other primitive values.",
        isCorrect: false,
      },
      {
        id: "items_must_be_keys",
        text: "The original item should be used as the Map key and the canonical form as the bucket value.",
        isCorrect: false,
      },
      {
        id: "one_item_per_group_required",
        text: "There is no bug because a group may contain at most one item.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Map.set replaces the value associated with an existing key.",
      mentalModelCorrection:
        "A grouping bucket must accumulate every member of the equivalence class.",
      mistakeTypes: ["group_bucket_overwritten"],
      nextAction:
        "Retrieve the existing bucket, append the item, and only initialize a new bucket when necessary.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-012",
    learningStage: "foundations",
    primarySkillAtomId: "reject_under_specific_grouping_key",
    secondarySkillAtomIds: [
      "detect_application_level_key_collision",
      "preserve_equivalence_class_distinctions",
    ],
    type: "mistake_review",
    prompt:
      "Words are grouped as anagrams using only their first character as the key. What is wrong with that representation?",
    options: [
      {
        id: "non_equivalent_words_collide",
        text: 'Non-anagrams such as "cat" and "car" share the key "c" and are incorrectly placed in one group.',
        isCorrect: true,
      },
      {
        id: "equivalent_words_never_share_first",
        text: "Anagrams always begin with different characters, so no valid group can form.",
        isCorrect: false,
      },
      {
        id: "first_character_too_expensive",
        text: "Reading the first character costs more than sorting the complete word.",
        isCorrect: false,
      },
      {
        id: "map_resolves_equivalence",
        text: "The key is sufficient because Map automatically separates non-equivalent values inside the same bucket.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The key preserves too little information to distinguish separate equivalence classes.",
      mentalModelCorrection:
        "A compact key is useful only when it remains complete enough to prevent domain-level collisions.",
      mistakeTypes: ["grouping_key_too_weak"],
      nextAction:
        "Construct a counterexample pair of non-equivalent items that receives the same proposed key.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-013",
    learningStage: "foundations",
    primarySkillAtomId: "reject_over_specific_grouping_key",
    secondarySkillAtomIds: [
      "remove_irrelevant_identity_from_key",
      "ensure_equivalent_items_share_key",
    ],
    type: "mistake_review",
    prompt: `Equivalent items should be grouped by normalized value, but the key is constructed as:

const key = normalizedValue + ":" + originalIndex;

What is the problem?`,
    options: [
      {
        id: "index_splits_equivalent_items",
        text: "The original index differs for every occurrence, so equivalent items receive different keys and cannot share a bucket.",
        isCorrect: true,
      },
      {
        id: "index_causes_hash_collision",
        text: "Indexes are invalid in keys because every numeric index hashes to the same bucket.",
        isCorrect: false,
      },
      {
        id: "normalized_value_should_be_removed",
        text: "The normalized value is unnecessary; the index alone identifies the equivalence class.",
        isCorrect: false,
      },
      {
        id: "key_needs_more_fields",
        text: "The key is too weak because it needs the complete original item and timestamp as well.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The key includes information that is irrelevant to equivalence but unique to each observation.",
      mentalModelCorrection:
        "Canonical keys should retain all equivalence-relevant information and exclude differences that equivalent items are allowed to have.",
      mistakeTypes: ["grouping_key_too_specific"],
      nextAction:
        "Remove fields that vary within one intended equivalence class.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-grouping-canonical-keys-014",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_duplicate_group_members",
    secondarySkillAtomIds: [
      "distinguish_group_membership_from_distinct_membership",
      "align_bucket_contents_with_output_contract",
    ],
    type: "edge_case_drill",
    prompt: `The input contains:

["eat", "eat", "tea"]

The output must preserve every input occurrence while grouping anagrams. What should the shared bucket contain?`,
    options: [
      {
        id: "eat_eat_tea",
        text: '["eat", "eat", "tea"]',
        isCorrect: true,
      },
      {
        id: "eat_tea",
        text: '["eat", "tea"] because duplicate group members should be removed.',
        isCorrect: false,
      },
      {
        id: "canonical_key_only",
        text: "Only the canonical key, because buckets should not retain original values.",
        isCorrect: false,
      },
      {
        id: "one_last_item",
        text: '["tea"] because each later equivalent item replaces the earlier one.',
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The grouping contract preserves occurrences rather than only distinct member values.",
      mentalModelCorrection:
        "A canonical key determines bucket membership; it does not imply deduplication inside the bucket.",
      mistakeTypes: ["duplicate_group_occurrences_lost"],
      nextAction:
        "Clarify whether the output contains items, distinct items, or counts before choosing the bucket representation.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-grouping-canonical-keys-015",
    learningStage: "foundations",
    primarySkillAtomId: "align_group_bucket_with_output_contract",
    secondarySkillAtomIds: [
      "choose_bucket_value_representation",
      "separate_grouping_key_from_aggregate",
    ],
    type: "solution_comparison",
    prompt: `Two grouping outputs are considered:

A. Return every original item grouped by canonical key.
B. Return only the number of items in each canonical group.

Which Map value selection is appropriate?`,
    options: [
      {
        id: "array_for_a_count_for_b",
        text: "A should map each key to a bucket of original items; B can map each key to a numeric count.",
        isCorrect: true,
      },
      {
        id: "set_for_b_only",
        text: "Both require a Set of canonical keys because the key itself contains every output item.",
        isCorrect: false,
      },
      {
        id: "count_for_a",
        text: "A needs only a count because original items can always be reconstructed from the canonical key.",
        isCorrect: false,
      },
      {
        id: "array_for_b_required",
        text: "B must retain every original item even when only group sizes are returned.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The two outputs require different information to remain associated with each key.",
      mentalModelCorrection:
        "The canonical key determines equivalence, while the Map value should be chosen from the result that must be produced for that class.",
      mistakeTypes: ["group_bucket_state_disconnected_from_output"],
      nextAction:
        "For one equivalence class, list exactly what the final output must recover.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(nm)",
    expectedTimeComplexity: "O(nm log m)",
    complexityExplanation:
      "Sorting the m characters of each of n strings costs O(m log m) per string, producing O(nm log m) key-construction time. Retaining all original strings and canonical keys uses O(nm) total character storage in the general case.",
    id: "alg-grouping-canonical-keys-016",
    learningStage: "foundations",
    primarySkillAtomId: "account_for_canonical_key_construction_cost",
    secondarySkillAtomIds: [
      "derive_grouping_signature_complexity",
      "distinguish_map_access_from_key_generation",
    ],
    type: "complexity_check",
    prompt: `An algorithm groups n strings of length m by sorting the characters of every string to construct its canonical key.

Under the standard expected-cost Map model, what is the dominant time complexity?`,
    options: [
      {
        id: "n_m_log_m",
        text: "O(nm log m), because key construction sorts m characters for each of n strings.",
        isCorrect: true,
      },
      {
        id: "n",
        text: "Expected O(n), because each completed key is inserted into a Map in expected O(1) time.",
        isCorrect: false,
      },
      {
        id: "m_log_m",
        text: "O(m log m), because all strings share the same grouping Map.",
        isCorrect: false,
      },
      {
        id: "n_squared",
        text: "O(n²), because every new group must be compared with every previous group.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The non-constant work occurs before the Map lookup: every item must be converted into its canonical representation.",
      mentalModelCorrection:
        "Expected O(1) Map access does not include sorting, normalization, serialization, or hashing work required to construct a key.",
      mistakeTypes: ["canonical_key_construction_cost_omitted"],
      nextAction:
        "Derive per-item normalization cost and multiply it by the number of items.",
      result: "diagnostic",
    },
  },
];
