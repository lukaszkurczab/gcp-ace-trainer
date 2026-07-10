export const repeatedRangeQueriesAndPreprocessingQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-repeated-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_repeated_static_range_queries",
    secondarySkillAtomIds: [
      "prefix_sum_preprocessing",
      "independent_range_queries",
    ],
    type: "single_choice",
    prompt:
      "An immutable array of length n will receive many independent range-sum queries. Each query provides inclusive indexes left and right. Which strategy best matches this workload?",
    options: [
      {
        id: "prefix_once",
        text: "Build one prefix-sum array, then answer every query from two prefix boundaries.",
      },
      {
        id: "scan_every_range",
        text: "Scan every requested range from left through right.",
      },
      {
        id: "one_moving_window",
        text: "Maintain one window and move it from the previous query to the next.",
      },
      {
        id: "rebuild_per_query",
        text: "Build a new prefix array before answering each query.",
      },
    ],
    correctOptionId: "prefix_once",
    feedbackModel: {
      decisionSignal:
        "The same static input serves many independently specified ranges.",
      mentalModelCorrection:
        "Prefix preprocessing is valuable because one cumulative representation is reused across all queries.",
      mistakeTypes: ["strategy_mismatch"],
      nextAction:
        "Check whether one preprocessing pass can be amortized across many future range answers.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-repeated-002",
    learningStage: "foundations",
    primarySkillAtomId: "derive_prefix_query_total_complexity",
    secondarySkillAtomIds: [
      "prefix_preprocessing_cost",
      "batch_query_complexity",
    ],
    type: "single_choice",
    prompt:
      "A prefix array is built in O(n) time, and q range-sum queries are each answered in O(1). What is the total time complexity?",
    options: [
      {
        id: "n_plus_q",
        text: "O(n + q).",
      },
      {
        id: "q",
        text: "O(q), because query time is constant.",
      },
      {
        id: "nq",
        text: "O(nq), because every query uses the prefix array.",
      },
      {
        id: "n_log_q",
        text: "O(n log q).",
      },
    ],
    correctOptionId: "n_plus_q",
    feedbackModel: {
      decisionSignal:
        "The full workload includes both preprocessing and all query answers.",
      mentalModelCorrection:
        "O(1) per query does not erase the initial O(n) construction cost.",
      mistakeTypes: ["omitted_preprocessing_cost"],
      nextAction:
        "Add one-time preprocessing to the cost of all repeated operations.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-repeated-003",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_rebuilding_prefix_state",
    secondarySkillAtomIds: ["preprocessing_reuse", "static_input_contract"],
    type: "single_choice",
    prompt:
      "A developer rebuilds the full prefix-sum array before answering every query, even though the input never changes. What is the main problem?",
    options: [
      {
        id: "repeated_preprocessing",
        text: "The same O(n) preprocessing work is repeated unnecessarily for every query.",
      },
      {
        id: "prefixes_require_updates",
        text: "Prefix sums cannot be used when more than one query exists.",
      },
      {
        id: "queries_must_be_sorted",
        text: "Queries must be sorted before a prefix array can be built.",
      },
      {
        id: "prefixes_change_input",
        text: "Every prefix array necessarily mutates the original input.",
      },
    ],
    correctOptionId: "repeated_preprocessing",
    feedbackModel: {
      decisionSignal:
        "The source data is static, so the same cumulative state remains valid for every query.",
      mentalModelCorrection:
        "Preprocessing should be performed once and reused until the underlying data changes.",
      mistakeTypes: ["unnecessary_recomputation"],
      nextAction:
        "Identify which computed state remains valid across repeated operations.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-sliding-window-prefix-repeated-004",
    learningStage: "foundations",
    primarySkillAtomId: "compare_prefix_and_naive_range_scans",
    secondarySkillAtomIds: ["repeated_range_scan", "preprocessing_tradeoff"],
    type: "solution_comparison",
    prompt:
      "Each of q queries may cover almost the entire array. Solution A scans every requested range. Solution B builds prefix sums once. Which comparison is correct?",
    options: [
      {
        id: "a_nq_b_n_plus_q",
        text: "A is O(nq) in the worst case, while B is O(n + q).",
      },
      {
        id: "both_q",
        text: "Both are O(q), because both return q answers.",
      },
      {
        id: "a_n_b_q",
        text: "A is O(n), while B is O(q).",
      },
      {
        id: "both_nq",
        text: "Both are O(nq), because both depend on the array.",
      },
    ],
    correctOptionId: "a_nq_b_n_plus_q",
    feedbackModel: {
      decisionSignal:
        "The naive approach may revisit almost all n values for every query.",
      mentalModelCorrection:
        "Repeated range scans multiply per-query range length by the number of queries.",
      mistakeTypes: ["complexity_mismatch"],
      nextAction:
        "Estimate the worst-case work of one query before multiplying by q.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-repeated-005",
    learningStage: "foundations",
    primarySkillAtomId: "apply_inclusive_prefix_boundaries",
    secondarySkillAtomIds: [
      "inclusive_range_contract",
      "prefix_boundary_selection",
    ],
    type: "single_choice",
    prompt:
      "A prefix array uses prefix[i] = sum of values[0 through i - 1]. Which expression returns the sum of the inclusive range [left, right]?",
    options: [
      {
        id: "right_plus_one_minus_left",
        text: "prefix[right + 1] - prefix[left]",
      },
      {
        id: "right_minus_left",
        text: "prefix[right] - prefix[left]",
      },
      {
        id: "right_plus_one_minus_left_plus_one",
        text: "prefix[right + 1] - prefix[left + 1]",
      },
      {
        id: "right_minus_left_minus_one",
        text: "prefix[right] - prefix[left - 1]",
      },
    ],
    correctOptionId: "right_plus_one_minus_left",
    feedbackModel: {
      decisionSignal:
        "The prefix definition uses half-open coverage [0, i), while the requested range includes right.",
      mentalModelCorrection:
        "The cumulative state immediately after right is prefix[right + 1], and prefix[left] removes everything before left.",
      mistakeTypes: ["prefix_boundary_error"],
      nextAction:
        "Translate the requested inclusive range into half-open prefix boundaries.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-repeated-006",
    learningStage: "foundations",
    primarySkillAtomId: "apply_half_open_prefix_boundaries",
    secondarySkillAtomIds: [
      "half_open_range_contract",
      "prefix_boundary_selection",
    ],
    type: "single_choice",
    prompt:
      "A query contract uses the half-open range [left, right), and prefix[i] stores the sum of values[0 through i - 1]. Which expression is correct?",
    options: [
      {
        id: "right_minus_left",
        text: "prefix[right] - prefix[left]",
      },
      {
        id: "right_plus_one_minus_left",
        text: "prefix[right + 1] - prefix[left]",
      },
      {
        id: "right_minus_left_plus_one",
        text: "prefix[right] - prefix[left + 1]",
      },
      {
        id: "right_plus_one_minus_left_plus_one",
        text: "prefix[right + 1] - prefix[left + 1]",
      },
    ],
    correctOptionId: "right_minus_left",
    feedbackModel: {
      decisionSignal:
        "The query boundaries already use the same half-open convention as the prefix definition.",
      mentalModelCorrection:
        "No right-boundary adjustment is needed when the requested range is already [left, right).",
      mistakeTypes: ["range_contract_mismatch"],
      nextAction:
        "Write both the prefix definition and query interval notation before choosing indexes.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-repeated-007",
    learningStage: "foundations",
    primarySkillAtomId: "trace_prefix_range_query",
    secondarySkillAtomIds: ["inclusive_range_sum", "prefix_query_trace"],
    type: "single_choice",
    prompt:
      "For values = [3, 5, 2, 4], the prefix array is [0, 3, 8, 10, 14]. What is the sum of the inclusive range [1, 3]?",
    options: [
      {
        id: "eleven",
        text: "11, from prefix[4] - prefix[1].",
      },
      {
        id: "six",
        text: "6, from prefix[3] - prefix[1].",
      },
      {
        id: "nine",
        text: "9, from prefix[4] - prefix[2].",
      },
      {
        id: "fourteen",
        text: "14, from prefix[4] alone.",
      },
    ],
    correctOptionId: "eleven",
    feedbackModel: {
      decisionSignal: "The inclusive range contains values 5, 2, and 4.",
      mentalModelCorrection:
        "Subtract the cumulative sum before left from the cumulative sum immediately after right.",
      mistakeTypes: ["prefix_boundary_error"],
      nextAction:
        "Verify the query by listing the included values before applying the formula.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-repeated-008",
    learningStage: "foundations",
    primarySkillAtomId: "handle_prefix_query_from_zero",
    secondarySkillAtomIds: ["left_boundary_zero", "prefix_sentinel"],
    type: "single_choice",
    prompt:
      "Why is a prefix array of length n + 1 with prefix[0] = 0 useful for queries that begin at index 0?",
    options: [
      {
        id: "uniform_formula",
        text: "It allows the same subtraction formula to work without a special left-boundary case.",
      },
      {
        id: "faster_construction",
        text: "It reduces preprocessing from O(n) to O(1).",
      },
      {
        id: "removes_storage",
        text: "It avoids storing any cumulative sums.",
      },
      {
        id: "sorts_prefixes",
        text: "It guarantees that prefix values are sorted.",
      },
    ],
    correctOptionId: "uniform_formula",
    feedbackModel: {
      decisionSignal:
        "The empty prefix represents the sum before the first input element.",
      mentalModelCorrection:
        "A zero sentinel makes prefix[right + 1] - prefix[0] valid for ranges beginning at zero.",
      mistakeTypes: ["missing_prefix_sentinel"],
      nextAction:
        "Use an explicit empty-prefix state to simplify boundary logic.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-repeated-009",
    learningStage: "foundations",
    primarySkillAtomId: "reject_single_window_for_arbitrary_queries",
    secondarySkillAtomIds: ["arbitrary_query_order", "query_access_pattern"],
    type: "solution_comparison",
    prompt:
      "Queries arrive in the order [100, 150], [2, 8], [70, 95]. A developer proposes maintaining one sliding window across the queries. What is the main issue?",
    options: [
      {
        id: "queries_are_unrelated",
        text: "The requested ranges jump independently, so one monotonic rolling range does not naturally preserve reusable state.",
      },
      {
        id: "window_cannot_sum",
        text: "Sliding windows cannot maintain numeric sums.",
      },
      {
        id: "prefixes_require_sorted_queries",
        text: "Prefix sums work only when query ranges are sorted.",
      },
      {
        id: "queries_overlap",
        text: "Any overlap between queries makes preprocessing invalid.",
      },
    ],
    correctOptionId: "queries_are_unrelated",
    feedbackModel: {
      decisionSignal:
        "The next query is not derived from the previous range by one controlled boundary update.",
      mentalModelCorrection:
        "A rolling window is suited to neighboring ranges in a traversal, not arbitrary externally supplied boundaries.",
      mistakeTypes: ["query_access_pattern_mismatch"],
      nextAction:
        "Check whether successive query boundaries move monotonically and locally.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-sliding-window-prefix-repeated-010",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_static_input_requirement",
    secondarySkillAtomIds: ["prefix_validity", "input_update_contract"],
    type: "single_choice",
    prompt:
      "A prefix array is built once. Later, the original array changes before more queries are answered. What must be considered?",
    options: [
      {
        id: "prefix_state_stale",
        text: "The stored prefix values may be stale because they describe the old array state.",
      },
      {
        id: "queries_become_windows",
        text: "Every later query automatically becomes a sliding-window problem.",
      },
      {
        id: "updates_do_not_matter",
        text: "Prefix sums remain valid because only query boundaries affect them.",
      },
      {
        id: "reorder_queries",
        text: "Sorting the queries restores the correctness of the old prefix array.",
      },
    ],
    correctOptionId: "prefix_state_stale",
    feedbackModel: {
      decisionSignal:
        "Prefix preprocessing encodes cumulative values from a specific static version of the input.",
      mentalModelCorrection:
        "Changing one source value affects every later prefix boundary unless the representation is updated or rebuilt.",
      mistakeTypes: ["stale_preprocessed_state"],
      nextAction:
        "Verify whether the input remains unchanged throughout the query workload.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-repeated-011",
    learningStage: "foundations",
    primarySkillAtomId: "evaluate_prefix_preprocessing_tradeoff",
    secondarySkillAtomIds: [
      "query_volume_analysis",
      "preprocessing_amortization",
    ],
    type: "solution_comparison",
    prompt:
      "Array length is n, but only one very short range query will ever be asked. Which assessment is most accurate?",
    options: [
      {
        id: "prefix_not_automatic",
        text: "Building O(n) prefix state may be unnecessary; directly scanning the short requested range may be cheaper for this workload.",
      },
      {
        id: "prefix_always_required",
        text: "Any range query requires prefix sums.",
      },
      {
        id: "window_required",
        text: "Any contiguous range requires sliding window.",
      },
      {
        id: "preprocessing_free",
        text: "Prefix preprocessing should be ignored because it happens only once.",
      },
    ],
    correctOptionId: "prefix_not_automatic",
    feedbackModel: {
      decisionSignal:
        "There is no repeated workload over which to amortize full-array preprocessing.",
      mentalModelCorrection:
        "Prefix sums are a trade-off, not a mandatory response to every range query.",
      mistakeTypes: ["unnecessary_preprocessing"],
      nextAction:
        "Compare preprocessing cost with the number and expected size of future queries.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-repeated-012",
    learningStage: "foundations",
    primarySkillAtomId: "review_inclusive_range_off_by_one",
    secondarySkillAtomIds: ["inclusive_right_boundary", "prefix_query_formula"],
    type: "single_choice",
    prompt:
      "A developer answers an inclusive query [left, right] using prefix[right] - prefix[left], where prefix[i] represents values before index i. Which value is accidentally excluded?",
    options: [
      {
        id: "right_value",
        text: "The value at index right.",
      },
      {
        id: "left_value",
        text: "The value at index left.",
      },
      {
        id: "value_before_left",
        text: "The value at index left - 1.",
      },
      {
        id: "no_value",
        text: "No value; the formula is correct.",
      },
    ],
    correctOptionId: "right_value",
    feedbackModel: {
      decisionSignal: "prefix[right] stops immediately before index right.",
      mentalModelCorrection:
        "An inclusive right boundary requires using the prefix state after right, not before it.",
      mistakeTypes: ["off_by_one_error"],
      nextAction:
        "Mark whether each prefix boundary lies before or after the corresponding input index.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-repeated-013",
    learningStage: "foundations",
    primarySkillAtomId: "compare_range_count_preprocessing",
    secondarySkillAtomIds: ["predicate_prefix_count", "repeated_count_queries"],
    type: "single_choice",
    prompt:
      "An immutable array receives many queries asking how many values in [left, right] satisfy value > 0. Which preprocessing is appropriate?",
    options: [
      {
        id: "prefix_positive_count",
        text: "Build a prefix count where each positive value contributes 1 and every other value contributes 0.",
      },
      {
        id: "single_global_count",
        text: "Count all positive values once and return that count for every range.",
      },
      {
        id: "one_window",
        text: "Maintain one window even though query boundaries are unrelated.",
      },
      {
        id: "prefix_minimum",
        text: "Store the minimum value in every prefix and subtract two minima.",
      },
    ],
    correctOptionId: "prefix_positive_count",
    feedbackModel: {
      decisionSignal:
        "The requested aggregate is an additive count over many static ranges.",
      mentalModelCorrection:
        "Repeated count queries can use the same prefix-subtraction structure after encoding each element as a zero-or-one contribution.",
      mistakeTypes: ["aggregate_encoding_mismatch"],
      nextAction:
        "Check whether the range property can be represented as independent additive contributions.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-sliding-window-prefix-repeated-014",
    learningStage: "foundations",
    primarySkillAtomId: "justify_prefix_query_strategy",
    secondarySkillAtomIds: ["preprocessing_reuse", "strategy_justification"],
    type: "solution_comparison",
    prompt:
      "Which explanation best justifies prefix sums for repeated static range queries?",
    options: [
      {
        id: "complete_justification",
        text: "The input is unchanged, one O(n) cumulative preprocessing pass can be reused, and each independently supplied range can then be answered from two stored boundaries.",
      },
      {
        id: "sum_keyword",
        text: "The prompt mentions sums, so prefix sums are automatically required.",
      },
      {
        id: "contiguous_keyword",
        text: "The queries are contiguous, so one sliding window and one prefix array are equivalent.",
      },
      {
        id: "query_only_cost",
        text: "Each query is O(1), so the total algorithm is O(q) regardless of preprocessing.",
      },
    ],
    correctOptionId: "complete_justification",
    feedbackModel: {
      decisionSignal:
        "A complete justification connects static data, repeated reuse, arbitrary query boundaries, and total cost.",
      mentalModelCorrection:
        "Prefix sums are selected because their stored cumulative states match the query contract, not because of isolated keywords.",
      mistakeTypes: ["weak_strategy_justification"],
      nextAction:
        "State the preprocessing cost, reuse condition, query mechanism, and input mutability assumption.",
      result: "diagnostic",
    },
  },
];
