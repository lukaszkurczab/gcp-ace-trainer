// Planning target: this file should contain questions about preprocessing tradeoffs between linear scan and binary search:
// one query versus many queries; sorting before binary search; counting sort cost;
// order-sensitive tasks where sorting is not allowed; and when O(n log n + q log n) beats O(qn).
// It should diagnose mistakes such as treating sorting as free,
// sorting even when original order matters,
// saying binary search is always better than linear scan without considering query volume,
// or ignoring that preprocessing only pays off when reused.
// Target question count: 14.
// Prefer solution_comparison, complexity_check, single_choice, and mistake-review style items.
// Avoid generic sorting questions; every item must stay focused on the scan-vs-binary-search contrast.
type PreprocessingQuestionSpec = {
  id: string;
  title: string;
  difficulty: "intro" | "easy" | "medium";
  primarySkillAtomId: string;
  patternVariantId: string;
  mistakeType: string;
  prompt: string;
  correction: string;
  nextAction: string;
  correctAnswer: string;
  correctText: string;
  wrongOptions?: readonly { id: string; text: string; explanation: string }[];
  itemType: "single_choice" | "solution_comparison" | "complexity_check" | "common_mistake_diagnosis";
  complexity?: {
    time: "O(n)" | "O(log n)" | "O(n + m)" | "O(n log n)";
    space: "O(1)" | "O(n)" | "O(n + m)";
    explanation: string;
    variables?: Readonly<Record<string, string>>;
  };
};

const makePreprocessingQuestion = (spec: PreprocessingQuestionSpec) => ({
  contentVersion: "algorithms-core",
  difficulty: spec.difficulty,
  ...(spec.complexity
    ? {
        complexityExplanation: spec.complexity.explanation,
        complexityVariables: spec.complexity.variables,
        expectedSpaceComplexity: spec.complexity.space,
        expectedTimeComplexity: spec.complexity.time,
      }
    : {}),
  feedbackModel: {
    decisionSignal: spec.prompt,
    mentalModelCorrection: spec.correction,
    mistakeTypes: [spec.mistakeType],
    nextAction: spec.nextAction,
    result: "diagnostic",
    distractorExplanations: Object.fromEntries((spec.wrongOptions ?? []).map((option) => [option.id, option.explanation])),
  },
  id: spec.id,
  learningStage: "contrast_practice",
  primarySkillAtomId: spec.primarySkillAtomId,
  prompt: spec.prompt,
  roadmapNodeId: "contrast_binary_search_vs_linear_scan",
  status: "active",
  staticMicroChecks: [
    spec.complexity
      ? {
          correctAnswer: { time: spec.complexity.time, space: spec.complexity.space },
          feedback: spec.correction,
          id: `${spec.id}-check`,
          mistakeTypes: [spec.mistakeType],
          prompt: `For "${spec.title}", choose the expected cost pair.`,
          status: "active",
          testedSkillAtomIds: [spec.primarySkillAtomId],
          type: "complexity_pair",
        }
      : {
          correctAnswer: spec.correctAnswer,
          feedback: spec.correction,
          id: `${spec.id}-check`,
          mistakeTypes: [spec.mistakeType],
          options: [{ id: spec.correctAnswer, text: spec.correctText }, ...(spec.wrongOptions ?? [])],
          prompt: `For "${spec.title}", choose the preprocessing decision.`,
          status: "active",
          testedSkillAtomIds: [spec.primarySkillAtomId],
          type: "single_choice",
        },
  ],
  taxonomyRefs: [
    { axisId: "pattern_family", nodeId: "binary_search", role: "primary" },
    { axisId: "pattern_family", nodeId: "complexity_and_constraints", role: "secondary" },
    { axisId: "skill_atom", nodeId: spec.primarySkillAtomId, role: "primary" },
    { axisId: "pattern_variant", nodeId: spec.patternVariantId, role: "secondary" },
    { axisId: "mistake_type", nodeId: spec.mistakeType, role: "mistake_type" },
  ],
  title: spec.title,
  trackId: "algorithms",
  type: spec.itemType,
  ...(spec.itemType === "solution_comparison"
    ? {
        responseSpec: {
          comparisonCriteria: ["preprocessing cost", "per-query cost", "reuse and order constraints"],
          kind: "solution_comparison",
          solutions: [
            { id: spec.correctAnswer, text: spec.correctText },
            ...(spec.wrongOptions ?? []).map(({ id, text }) => ({ id, text })),
          ],
        },
      }
    : {}),
});

export const preprocessingAndQueryVolumeQuestions = [
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-001",
    title: "Do not sort for one unsorted query",
    difficulty: "intro",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "complexity_mismatch",
    prompt: "An unsorted array has n values and exactly one membership query. A candidate sorts first and then performs binary search. What comparison should reject that plan?",
    correction: "Sorting adds O(n log n) preprocessing for a single query, while a direct scan answers it in O(n) without that setup cost.",
    nextAction: "Count preprocessing and query work together instead of comparing only the final lookup step.",
    correctAnswer: "scan_one_query",
    correctText: "Use a direct scan; sorting is not paid back by one query.",
    wrongOptions: [
      { id: "sort_free", text: "Sort first because preprocessing does not count toward lookup complexity.", explanation: "The total work includes sorting whenever the algorithm performs it." },
      { id: "binary_always", text: "Sort first because binary search is always better than a scan.", explanation: "Binary search is only beneficial after its setup cost is justified by reuse or existing order." },
    ],
    itemType: "solution_comparison",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-002",
    title: "Amortize sorting across many queries",
    difficulty: "medium",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "constraint_reasoning_missed",
    prompt: "The same unsorted array of n values receives q = 100000 membership queries. Why can sorting once and using binary search be better than scanning for every query?",
    correction: "The one-time O(n log n) sort can be amortized across q lookups, replacing q full scans with q logarithmic lookups after preprocessing.",
    nextAction: "Compare total costs as sort plus q binary searches versus q linear scans.",
    correctAnswer: "reuse_pays_sort",
    correctText: "Many queries can amortize sorting: O(n log n + q log n) beats O(qn) at large q.",
    wrongOptions: [
      { id: "sort_never_pays", text: "Sorting can never pay off because it always adds work.", explanation: "Repeated queries can make one-time preprocessing cheaper than repeating full scans." },
      { id: "query_count_irrelevant", text: "Query volume does not affect the choice between scan and binary search.", explanation: "The query count multiplies the per-query cost and is central to the tradeoff." },
    ],
    itemType: "solution_comparison",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-003",
    title: "Include sorting in total cost",
    difficulty: "easy",
    primarySkillAtomId: "identify_hidden_operation_cost",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "complexity_misread",
    prompt: "A review labels ‘sort the array in place once, then binary-search one query’ as O(log n) time and O(1) extra space. Which cost is missing from that explanation?",
    correction: "The query is O(log n), but the total algorithm also performs O(n log n) sorting before it can query.",
    nextAction: "Add preprocessing cost to lookup cost whenever the input is not already sorted.",
    correctAnswer: "sort_cost_missing",
    correctText: "Include the O(n log n) sorting cost; the total is not just the final O(log n) lookup.",
    wrongOptions: [
      { id: "sort_free", text: "Sorting is free because it happens before the query.", explanation: "Work before the query is still work performed by the algorithm." },
      { id: "scan_cost_missing", text: "Only the cost of a possible scan is missing from the analysis.", explanation: "The proposed plan performs sorting and binary search, not a scan." },
    ],
    itemType: "complexity_check",
    complexity: { time: "O(n log n)", space: "O(1)", explanation: "For an in-place sort, the one-query plan still takes O(n log n) time while the iterative binary search and sort workspace use O(1) extra space." },
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-004",
    title: "Respect order-sensitive output",
    difficulty: "medium",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "order_constraint_missed",
    prompt: "The task asks for the first occurrence in original input order, and sorting the values is forbidden by the contract. Why is sort-then-binary-search not a valid replacement?",
    correction: "Sorting changes the order that defines the requested result and violates the explicit constraint, even if membership would be preserved.",
    nextAction: "Check whether the output depends on original order before proposing sorting as preprocessing.",
    correctAnswer: "order_must_survive",
    correctText: "Reject sorting because it destroys the order-sensitive contract and is explicitly disallowed.",
    wrongOptions: [
      { id: "membership_preserved", text: "Sort anyway because sorting preserves which values exist.", explanation: "Preserving membership does not preserve the first original occurrence." },
      { id: "binary_priority", text: "Sort anyway because binary search has better asymptotic lookup time.", explanation: "An optimization cannot override an output or input-order constraint." },
    ],
    itemType: "common_mistake_diagnosis",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-005",
    title: "Account for counting-sort range",
    difficulty: "medium",
    primarySkillAtomId: "identify_hidden_operation_cost",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "complexity_misread",
    prompt: "Values lie in a bounded key range of size K. A candidate says counting-sort preprocessing is O(n) before binary-search queries. What must be included?",
    correction: "Counting-sort setup depends on both the number of values and the key range, giving O(n + K) preprocessing rather than O(n) alone.",
    nextAction: "Include the range dimension when evaluating whether counting-based preprocessing is affordable.",
    correctAnswer: "include_key_range",
    correctText: "Count both n values and the K-sized key range: preprocessing is O(n + K).",
    wrongOptions: [
      { id: "range_free", text: "Call it O(n) because the values are integers.", explanation: "The key range can dominate the work and auxiliary storage." },
      { id: "binary_erases_setup", text: "Ignore preprocessing because later queries use binary search.", explanation: "Later lookup cost does not erase the work needed to create the searchable representation." },
    ],
    itemType: "complexity_check",
    complexity: { time: "O(n + m)", space: "O(n + m)", explanation: "Here m represents the counting key range K, so preprocessing and its count storage account for both n values and the K-sized range.", variables: { n: "number of input values", m: "counting key range K" } },
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-006",
    title: "Use existing sorted order immediately",
    difficulty: "intro",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "unnecessary_state",
    prompt: "An array is already sorted and receives one target lookup. What preprocessing decision is appropriate before binary search?",
    correction: "No sorting preprocessing is needed because the required order already exists; the lookup can begin directly.",
    nextAction: "Distinguish creating order from reusing an order guarantee already present in the input.",
    correctAnswer: "no_sort_needed",
    correctText: "Skip preprocessing and binary-search the already sorted array directly.",
    wrongOptions: [
      { id: "sort_again", text: "Sort again to make binary search safe.", explanation: "Re-sorting an input that already satisfies the order precondition adds unnecessary work." },
      { id: "scan_once", text: "Scan first to verify sortedness before every lookup.", explanation: "An explicit input contract can provide sortedness without a verification scan." },
    ],
    itemType: "single_choice",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-007",
    title: "Reject preprocessing that is never reused",
    difficulty: "easy",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "unnecessary_search_space",
    prompt: "A service sorts a fresh unsorted batch before answering one query, then discards the batch. What tradeoff mistake is present?",
    correction: "Preprocessing is useful when its cost is reused; sorting a batch for one query can cost more than directly inspecting it.",
    nextAction: "Ask how many queries reuse the prepared data before accepting a sort-first plan.",
    correctAnswer: "no_reuse_no_payback",
    correctText: "The sort has no reuse opportunity, so a direct scan may be the lower-cost plan.",
    wrongOptions: [
      { id: "sort_always_better", text: "Sorting is always worthwhile because it creates a faster query.", explanation: "A faster query does not pay back preprocessing when it is used only once." },
      { id: "batch_size_only", text: "Only n matters; query reuse does not affect the tradeoff.", explanation: "Total cost depends on both preprocessing size and the number of queries served." },
    ],
    itemType: "common_mistake_diagnosis",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-008",
    title: "Compare one query at small volume",
    difficulty: "easy",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "constraint_reasoning_missed",
    prompt: "For one query on an unsorted array, which total-cost comparison is correct?",
    correction: "A direct scan costs O(n), while sorting first and then searching costs O(n log n + log n), dominated by preprocessing.",
    nextAction: "Substitute q = 1 into both total-cost expressions before choosing a preprocessing plan.",
    correctAnswer: "scan_wins_one",
    correctText: "The scan is O(n); sort plus one binary search is O(n log n + log n), so preprocessing is not justified.",
    wrongOptions: [
      { id: "binary_log_only", text: "Sort plus binary search is O(log n) because the query itself is logarithmic.", explanation: "The sorting work remains part of the total cost." },
      { id: "equal_cost", text: "Both plans are O(n) because one query is small.", explanation: "Sorting introduces an O(n log n) term even for one query." },
    ],
    itemType: "solution_comparison",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-009",
    title: "Explain the many-query crossover",
    difficulty: "medium",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "complexity_mismatch",
    prompt: "For q repeated queries over the same unsorted array, which total-cost statement captures when sorting can beat scanning?",
    correction: "Sorting can win when O(n log n + q log n) is smaller than O(qn), because the setup is paid once and lookup savings repeat.",
    nextAction: "Keep q symbolic long enough to see whether repeated query savings amortize preprocessing.",
    correctAnswer: "reuse_formula",
    correctText: "Compare O(n log n + q log n) with O(qn); the first can win as q grows.",
    wrongOptions: [
      { id: "sorting_free", text: "Sort once plus q binary searches costs O(q log n), because the one-time sort is free.", explanation: "The sort is part of the total work and contributes O(n log n)." },
      { id: "scan_always", text: "Repeated scans always win because preprocessing adds a separate phase.", explanation: "The setup can be amortized when q repeated lookups avoid q full scans." },
    ],
    itemType: "solution_comparison",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-010",
    title: "Do not ignore changing data",
    difficulty: "medium",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "constraint_state_missing",
    prompt: "An array changes after every query, so a sorted copy would need to be rebuilt before the next query. Why does this weaken sort-then-binary-search?",
    correction: "Sorting is valuable when one prepared order serves many queries; rebuilding it after every mutation repeats the preprocessing cost.",
    nextAction: "Check whether the prepared structure survives long enough to serve multiple lookups.",
    correctAnswer: "preprocessing_not_reusable",
    correctText: "Repeated rebuilding removes the amortization benefit and can make direct inspection preferable.",
    wrongOptions: [
      { id: "binary_survives", text: "Binary search remains cheap, so rebuilding order does not matter.", explanation: "The repeated sorting cost can dominate every cheap lookup." },
      { id: "one_sort_enough", text: "Sort once because the original data values are conceptually the same.", explanation: "Mutations can invalidate the prepared order and its mapping to current data." },
    ],
    itemType: "solution_comparison",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-011",
    title: "Reject counting sort for a huge sparse range",
    difficulty: "medium",
    primarySkillAtomId: "identify_hidden_operation_cost",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "complexity_mismatch",
    prompt: "There are n values but the possible integer key range K is vastly larger than n. A candidate proposes counting-sort preprocessing before binary-search queries. What should be checked?",
    correction: "Counting sort pays O(n + K), so a huge sparse key range can make its preprocessing and storage cost impractical.",
    nextAction: "Compare K with n before treating integer values as a free counting-sort opportunity.",
    correctAnswer: "range_can_dominate",
    correctText: "Reject the assumption that counting sort is cheap; K may dominate both time and space.",
    wrongOptions: [
      { id: "integer_free", text: "Use counting sort automatically because all keys are integers.", explanation: "Integer keys are not enough when the key range is enormous." },
      { id: "queries_hide_k", text: "Ignore K because many queries make any preprocessing worthwhile.", explanation: "Reuse can amortize time but cannot erase an infeasible range-sized representation." },
    ],
    itemType: "common_mistake_diagnosis",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-012",
    title: "Compare a small query count",
    difficulty: "easy",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "constraint_reasoning_missed",
    prompt: "A plan sorts n unsorted values to answer q = 2 membership queries. Which reasoning is strongest?",
    correction: "With only two queries, the O(n log n) setup is often larger than two O(n) scans; query volume is too small to assume preprocessing pays off.",
    nextAction: "Use the actual query count instead of applying a many-query rule unconditionally.",
    correctAnswer: "small_q_scan_candidate",
    correctText: "Treat direct scans as the strong baseline; two queries may not amortize sorting.",
    wrongOptions: [
      { id: "binary_always", text: "Sort because any q greater than one makes binary search preferable.", explanation: "The crossover depends on n, q, and preprocessing cost, not merely q > 1." },
      { id: "sort_never", text: "Reject sorting categorically because scans are always better.", explanation: "Larger repeated query volumes can justify preprocessing." },
    ],
    itemType: "solution_comparison",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-013",
    title: "Keep original positions when order matters",
    difficulty: "medium",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "order_constraint_missed",
    prompt: "The task asks whether the earliest original index containing target is before a cutoff. Why can sorting values before binary search change the problem?",
    correction: "Sorting groups values by magnitude and destroys the original positional order that defines ‘earliest’.",
    nextAction: "Identify whether the output is about value membership or the original sequence order before preprocessing.",
    correctAnswer: "position_semantics_change",
    correctText: "Sorting changes positional semantics, so it cannot replace an order-sensitive scan without an approved structure.",
    wrongOptions: [
      { id: "membership_same", text: "Sorting is safe because the same target values remain present.", explanation: "The earliest original index is not preserved by value order alone." },
      { id: "binary_faster", text: "Sorting is required because binary search must always be used for target lookup.", explanation: "Performance does not override the output contract." },
    ],
    itemType: "single_choice",
  }),
  makePreprocessingQuestion({
    id: "alg-contrast-binary-linear-preprocess-014",
    title: "Diagnose binary-search absolutism",
    difficulty: "medium",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    patternVariantId: "preprocessing_and_queries",
    mistakeType: "wrong_approach",
    prompt: "A review comment says ‘always sort and binary-search; O(log n) is always better than O(n)’. What is the central mistake?",
    correction: "The comparison ignores preprocessing cost, query volume, input-order constraints, and whether the sorted representation can be reused.",
    nextAction: "Review total cost and output constraints before declaring binary search universally preferable.",
    correctAnswer: "tradeoff_ignored",
    correctText: "The reviewer ignores setup cost, reuse, query volume, and order-sensitive contracts.",
    wrongOptions: [
      { id: "log_not_better", text: "The mistake is that O(log n) is never better than O(n).", explanation: "Binary search can be better when its preconditions and preprocessing tradeoff fit." },
      { id: "sort_free", text: "The comment is correct because sorting happens outside the query loop.", explanation: "One-time work still contributes to total cost and may not be amortized." },
    ],
    itemType: "common_mistake_diagnosis",
  }),
];
