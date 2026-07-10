export const complexityAndMistakeReviewQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(d)",
    expectedTimeComplexity: "O(n) expected",
    complexityExplanation:
      "Under the standard expected-cost hash-table model, each membership check and insertion costs expected O(1). Across n elements, the scan therefore takes expected O(n) time. The Set stores at most d distinct keys.",
    id: "alg-hash-state-complexity-review-001",
    learningStage: "foundations",
    primarySkillAtomId: "derive_expected_hash_scan_complexity",
    secondarySkillAtomIds: [
      "derive_distinct_key_space",
      "distinguish_input_size_from_distinct_keys",
    ],
    type: "complexity_check",
    prompt: `An algorithm scans n values:

const seen = new Set<number>();

for (const value of values) {
  if (seen.has(value)) {
    return true;
  }

  seen.add(value);
}

Let d be the number of distinct values inserted before termination. Under the standard expected-cost hash-table model, what is the precise complexity?`,
    options: [
      {
        id: "expected_linear_distinct_space",
        text: "Expected O(n) time and O(d) auxiliary space.",
        isCorrect: true,
      },
      {
        id: "worst_case_linear_constant_space",
        text: "Guaranteed O(n) worst-case time and O(1) auxiliary space.",
        isCorrect: false,
      },
      {
        id: "quadratic_distinct_space",
        text: "O(n²) time and O(d) auxiliary space because both has and add are called inside the loop.",
        isCorrect: false,
      },
      {
        id: "expected_linear_input_space_only",
        text: "Expected O(n) time and always exactly O(n) auxiliary space, even when every value is identical.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The loop performs a constant number of expected-cost hash operations per processed element.",
      mentalModelCorrection:
        "Hash state grows with the number of stored distinct keys, which may be smaller than the number of processed elements.",
      mistakeTypes: ["hash_scan_complexity_mismatch"],
      nextAction:
        "Count hash operations across the scan and bound the maximum number of simultaneously stored keys.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-hash-state-complexity-review-002",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_expected_from_worst_case_hash_cost",
    secondarySkillAtomIds: [
      "review_hash_complexity_claim",
      "state_hash_table_model_explicitly",
    ],
    type: "mistake_review",
    prompt: `A code review states:

"This solution is guaranteed O(n) worst-case because Map.has, Map.get, and Map.set are O(1)."

What is the most precise correction?`,
    options: [
      {
        id: "expected_not_unconditional",
        text: "Hash-table operations are normally treated as expected or amortized O(1) under a standard hashing model; that does not provide an unconditional O(1) worst-case guarantee per operation.",
        isCorrect: true,
      },
      {
        id: "all_map_operations_linear",
        text: "Every Map operation is always O(n), so the complete scan is necessarily O(n²).",
        isCorrect: false,
      },
      {
        id: "map_operations_logarithmic",
        text: "Map operations are guaranteed O(log n), so the complete scan is guaranteed O(n log n).",
        isCorrect: false,
      },
      {
        id: "guarantee_is_correct",
        text: "The review is fully correct because hash tables cannot experience collisions or resizing.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The review turns a standard expected-cost assumption into an unconditional worst-case guarantee.",
      mentalModelCorrection:
        "State whether a hash-based bound is expected, amortized, or worst-case instead of writing O(1) without a model.",
      mistakeTypes: ["expected_hash_cost_called_worst_case_guarantee"],
      nextAction:
        "Attach the correct complexity qualifier to each hash-table operation and to the complete algorithm.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(d)",
    expectedTimeComplexity: "O(n) expected",
    complexityExplanation:
      "The algorithm performs expected O(1) work for each of n observations. One count is stored for each distinct key, so auxiliary space is O(d), with O(n) as the worst case when all values are distinct.",
    id: "alg-hash-state-complexity-review-003",
    learningStage: "foundations",
    primarySkillAtomId: "derive_frequency_map_space",
    secondarySkillAtomIds: [
      "derive_distinct_key_space",
      "maintain_per_key_count",
    ],
    type: "complexity_check",
    prompt: `A scan builds a frequency Map for n values. Let d be the number of distinct values.

Which complexity statement is precise under the expected hash-table model?`,
    options: [
      {
        id: "expected_linear_d_space",
        text: "Expected O(n) time and O(d) auxiliary space; the space becomes O(n) in the all-distinct case.",
        isCorrect: true,
      },
      {
        id: "expected_linear_constant_space",
        text: "Expected O(n) time and O(1) auxiliary space because each Map entry stores only one count.",
        isCorrect: false,
      },
      {
        id: "quadratic_n_space",
        text: "O(n²) time and O(n) auxiliary space because every count may be incremented many times.",
        isCorrect: false,
      },
      {
        id: "distinct_time_input_space",
        text: "O(d) time and exactly O(n) auxiliary space because duplicate observations require separate entries.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Repeated occurrences update an existing entry rather than allocating another key.",
      mentalModelCorrection:
        "The number of observations determines scan time, while the number of distinct stored keys determines Map space.",
      mistakeTypes: ["frequency_map_space_mismatch"],
      nextAction:
        "Use separate variables for total observations and distinct keys.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(dk)",
    expectedTimeComplexity: "O(nk) expected",
    complexityExplanation:
      "Constructing and hashing a fresh key of length k costs O(k), even if the subsequent bucket lookup is expected O(1). Repeating that work for n records costs expected O(nk). Storing d such keys requires O(dk) key storage.",
    id: "alg-hash-state-complexity-review-004",
    learningStage: "foundations",
    primarySkillAtomId: "account_for_hash_key_construction_cost",
    secondarySkillAtomIds: [
      "account_for_key_hashing_cost",
      "derive_composite_key_space",
    ],
    type: "complexity_check",
    prompt: `An algorithm processes n records. For each record, it constructs a fresh canonical string key of length Θ(k), hashes it, and performs a Map lookup.

There are d distinct stored keys. What is the precise expected complexity?`,
    options: [
      {
        id: "nk_time_dk_space",
        text: "Expected O(nk) time and O(dk) key space, ignoring additional stored metadata.",
        isCorrect: true,
      },
      {
        id: "n_time_d_space",
        text: "Expected O(n) time and O(d) space because every Map operation is expected O(1), regardless of key size.",
        isCorrect: false,
      },
      {
        id: "nk_time_constant_space",
        text: "Expected O(nk) time and O(1) space because all keys are stored inside the Map.",
        isCorrect: false,
      },
      {
        id: "n_plus_k_time",
        text: "Expected O(n + k) time because the key is constructed only once for the complete input.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The hash operation cannot inspect a newly constructed length-k key in constant time independent of k.",
      mentalModelCorrection:
        "Expected O(1) describes table access after accounting for the work needed to construct and hash the key.",
      mistakeTypes: ["key_construction_cost_omitted"],
      nextAction:
        "Expand one Map operation into key construction, hashing, and table access before deriving the total.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedTimeComplexity: "O(nm log m) expected",
    complexityExplanation:
      "Sorting the m symbols of each item costs O(m log m). Performing that preprocessing for n items dominates the expected O(1) Map access associated with each completed signature.",
    id: "alg-hash-state-complexity-review-005",
    learningStage: "foundations",
    primarySkillAtomId: "include_signature_preprocessing_cost",
    secondarySkillAtomIds: [
      "account_for_key_construction_cost",
      "combine_preprocessing_and_hash_lookup",
    ],
    type: "mistake_review",
    prompt: `A grouping algorithm processes n strings of length m. For each string, it sorts its characters to create a signature and then inserts that signature into a Map.

A reviewer calls the algorithm expected O(n) because there is one Map insertion per string. What is missing?`,
    options: [
      {
        id: "per_string_sorting_cost",
        text: "Creating each signature costs O(m log m), so the complete expected time is O(nm log m), excluding output copying.",
        isCorrect: true,
      },
      {
        id: "map_insertion_is_quadratic",
        text: "Map insertion is O(n²), so the complete algorithm is O(n³).",
        isCorrect: false,
      },
      {
        id: "string_length_never_matters",
        text: "Nothing is missing because key construction is always included in expected O(1) Map insertion.",
        isCorrect: false,
      },
      {
        id: "only_one_sort_total",
        text: "The sorting cost is only O(m log m) because all strings share the same Map.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The lookup key is produced by a non-constant preprocessing operation for every input item.",
      mentalModelCorrection:
        "A hash lookup does not absorb the cost of computing the key supplied to it.",
      mistakeTypes: ["signature_preprocessing_ignored"],
      nextAction:
        "Add the per-item key-generation cost before multiplying by the number of items.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(d + r)",
    expectedTimeComplexity: "O(n + r) expected",
    complexityExplanation:
      "The hash-based scan costs expected O(n), but materializing r output records requires Θ(r) additional work and space. The full bound must therefore include the output size.",
    id: "alg-hash-state-complexity-review-006",
    learningStage: "foundations",
    primarySkillAtomId: "include_output_size_in_hash_algorithm_complexity",
    secondarySkillAtomIds: [
      "derive_output_sensitive_complexity",
      "distinguish_search_cost_from_materialization_cost",
    ],
    type: "complexity_check",
    prompt: `A hash-based algorithm scans n items and emits every matching result. Let r be the number of emitted results, and let d be the maximum number of stored keys.

What is the appropriate expected complexity when the result list is materialized?`,
    options: [
      {
        id: "n_plus_r_time_d_plus_r_space",
        text: "Expected O(n + r) time and O(d + r) space including the returned output.",
        isCorrect: true,
      },
      {
        id: "linear_regardless_of_output",
        text: "Expected O(n) time and O(d) space regardless of how many results are returned.",
        isCorrect: false,
      },
      {
        id: "r_only",
        text: "O(r) time and O(r) space because input scanning is hidden by output generation.",
        isCorrect: false,
      },
      {
        id: "n_times_r",
        text: "O(nr) time because each output item must be multiplied by the input length.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every returned result must be constructed and stored at least once.",
      mentalModelCorrection:
        "An output-sensitive algorithm cannot claim a bound smaller than the size of the output it explicitly materializes.",
      mistakeTypes: ["output_cost_omitted"],
      nextAction:
        "Add an output-size variable whenever the number of returned records is not bounded by a constant.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-hash-state-complexity-review-007",
    learningStage: "foundations",
    primarySkillAtomId: "compare_hash_scan_nested_scan_and_sorting",
    secondarySkillAtomIds: [
      "derive_nested_scan_complexity",
      "derive_sort_then_scan_complexity",
    ],
    type: "solution_comparison",
    prompt: `Three solutions determine whether any pair satisfies a target condition:

A. Check every pair with nested scans.
B. Perform one hash-based scan with expected O(1) lookups.
C. Sort with a guaranteed O(n log n) sort, then perform a linear two-pointer scan.

Which time comparison is precise?`,
    options: [
      {
        id: "quadratic_expected_linear_nlogn",
        text: "A is O(n²); B is expected O(n); C is O(n log n) because sorting dominates the linear scan.",
        isCorrect: true,
      },
      {
        id: "all_linear",
        text: "All three are O(n) because each eventually examines array elements.",
        isCorrect: false,
      },
      {
        id: "hash_guaranteed_linear",
        text: "A is O(n²); B is guaranteed O(n) worst-case; C is O(n).",
        isCorrect: false,
      },
      {
        id: "sorting_quadratic",
        text: "A and C are both O(n²), while B is O(log n).",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The approaches enumerate candidate pairs, use expected hash lookup, or pay a sorting preprocessing cost.",
      mentalModelCorrection:
        "Compare the complete dominant work of each solution and preserve the expected qualifier for hashing.",
      mistakeTypes: ["strategy_complexity_comparison_mismatch"],
      nextAction:
        "Write preprocessing plus scan costs separately before simplifying each approach.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-hash-state-complexity-review-008",
    learningStage: "foundations",
    primarySkillAtomId: "choose_complexity_claim_for_required_guarantee",
    secondarySkillAtomIds: [
      "distinguish_expected_from_deterministic_bounds",
      "compare_hashing_with_guaranteed_sorting",
    ],
    type: "solution_comparison",
    prompt: `A system requires a deterministic worst-case time bound.

Solution A uses a hash table and is expected O(n) under the standard hashing model.

Solution B uses a sorting algorithm with a guaranteed O(n log n) worst-case bound, followed by a linear scan.

Which review is correct?`,
    options: [
      {
        id: "b_has_stronger_worst_case_guarantee",
        text: "Solution A has the better expected bound, but Solution B provides the stronger stated worst-case guarantee.",
        isCorrect: true,
      },
      {
        id: "a_guaranteed_because_expected",
        text: "Solution A already guarantees O(n) worst-case because expected and worst-case bounds are interchangeable.",
        isCorrect: false,
      },
      {
        id: "b_expected_only",
        text: "Solution B has only an expected O(n log n) bound because every sorting algorithm is hash-based.",
        isCorrect: false,
      },
      {
        id: "choose_only_smaller_big_o",
        text: "Solution A must be selected because O(n) is smaller, regardless of the required guarantee.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The requirement concerns the type of guarantee, not only the asymptotic expression.",
      mentalModelCorrection:
        "An expected faster algorithm and a deterministically bounded algorithm satisfy different performance contracts.",
      mistakeTypes: ["expected_bound_used_for_worst_case_requirement"],
      nextAction:
        "Match expected, amortized, and worst-case claims to the requirement before comparing their growth rates.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedTimeComplexity: "O(n) expected",
    complexityExplanation:
      "A constant number of expected O(1) hash operations is performed per iteration. Three such operations produce approximately 3n primitive operations, which remains expected O(n).",
    id: "alg-hash-state-complexity-review-009",
    learningStage: "foundations",
    primarySkillAtomId: "combine_constant_hash_operations_per_iteration",
    secondarySkillAtomIds: [
      "ignore_constant_factors_in_big_o",
      "derive_expected_hash_scan_complexity",
    ],
    type: "mistake_review",
    prompt: `Each iteration performs:

- one Map.has call,
- one Map.get call when present,
- and one Map.set call.

A reviewer claims the loop is O(n³) because it contains three Map operations inside an n-iteration loop. What is the correction?`,
    options: [
      {
        id: "constant_operations_linear",
        text: "A constant number of expected O(1) operations per iteration gives expected O(n) total time, not O(n³).",
        isCorrect: true,
      },
      {
        id: "three_operations_quadratic",
        text: "The loop is O(n²) because has and set interact with each other.",
        isCorrect: false,
      },
      {
        id: "review_correct",
        text: "The reviewer is correct because the number of statements inside a loop becomes an exponent.",
        isCorrect: false,
      },
      {
        id: "constant_total",
        text: "The complete loop is O(1) because every individual Map operation is expected O(1).",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The number of hash operations per iteration does not grow with n.",
      mentalModelCorrection:
        "Sequential constant-cost operations add; they do not create nested multiplicative factors.",
      mistakeTypes: ["constant_hash_operations_multiplied_as_exponents"],
      nextAction:
        "Write the total as n multiplied by the constant amount of expected work per iteration.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(w)",
    expectedTimeComplexity: "O(n) expected",
    complexityExplanation:
      "Although n keys may be inserted over the full execution, deletions can keep only w distinct keys active simultaneously. Auxiliary space is determined by peak live state, not cumulative insertions.",
    id: "alg-hash-state-complexity-review-010",
    learningStage: "foundations",
    primarySkillAtomId: "derive_peak_hash_state_space",
    secondarySkillAtomIds: [
      "distinguish_peak_space_from_cumulative_allocations",
      "derive_active_distinct_key_space",
    ],
    type: "complexity_check",
    prompt: `A scan performs n expected O(1) hash-table updates. Keys are also deleted, and at most w distinct keys are present in the table at any one time.

What is the appropriate auxiliary-space bound?`,
    options: [
      {
        id: "peak_w",
        text: "O(w), because space is determined by the maximum number of simultaneously live entries.",
        isCorrect: true,
      },
      {
        id: "always_n",
        text: "Always O(n), because n insertion operations occur over the complete execution.",
        isCorrect: false,
      },
      {
        id: "constant_due_to_deletion",
        text: "O(1), because deleting any key prevents the table from using asymptotic space.",
        isCorrect: false,
      },
      {
        id: "n_times_w",
        text: "O(nw), because cumulative insertions must be multiplied by peak table size.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Auxiliary space measures the largest live state at one moment, not the total number of updates over time.",
      mentalModelCorrection:
        "Deletion can reduce peak space below total processed input, but it does not automatically make the state constant-sized.",
      mistakeTypes: ["cumulative_hash_insertions_confused_with_peak_space"],
      nextAction:
        "Bound the maximum number of keys simultaneously retained by the algorithm.",
      result: "diagnostic",
    },
  },
];
