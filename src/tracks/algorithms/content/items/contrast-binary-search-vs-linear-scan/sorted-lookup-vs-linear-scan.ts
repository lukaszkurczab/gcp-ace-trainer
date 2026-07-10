// Planning target: this file should contain questions about contrasting binary search and linear scan for sorted indexed lookup:
// finding whether a target exists; returning any matching index; sorted ascending precondition;
// linear scan being correct but slower; and binary search using sorted order to discard half.
// It should diagnose mistakes such as scanning linearly after noticing sorted order,
// claiming linear scan and binary search have the same growth,
// using binary search without checking that the array is sorted,
// or confusing "correct" with "asymptotically best".
// Target question count: 12.
// Prefer single_choice, solution_comparison, complexity_check, and small trace-style items.
// Avoid lower_bound/upper_bound duplicate-boundary tasks; those belong elsewhere.
type SortedLookupQuestionSpec = {
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
  wrongOptions: readonly { id: string; text: string; explanation: string }[];
  itemType: "single_choice" | "solution_comparison" | "complexity_check" | "edge_case_drill";
  complexity?: { time: "O(log n)" | "O(n)"; space: "O(1)"; explanation: string };
};

const makeSortedLookupQuestion = (spec: SortedLookupQuestionSpec) => ({
  contentVersion: "algorithms-core",
  difficulty: spec.difficulty,
  ...(spec.complexity
    ? {
        complexityExplanation: spec.complexity.explanation,
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
    distractorExplanations: Object.fromEntries(spec.wrongOptions.map((option) => [option.id, option.explanation])),
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
          options: [{ id: spec.correctAnswer, text: spec.correctText }, ...spec.wrongOptions],
          prompt: `For "${spec.title}", choose the correct lookup reasoning.`,
          status: "active",
          testedSkillAtomIds: [spec.primarySkillAtomId],
          type: "single_choice",
        },
  ],
  taxonomyRefs: [
    { axisId: "pattern_family", nodeId: "binary_search", role: "primary" },
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
          comparisonCriteria: ["correctness contract", "sorted precondition", "worst-case growth"],
          kind: "solution_comparison",
          solutions: [
            { id: spec.correctAnswer, text: spec.correctText },
            ...spec.wrongOptions.map(({ id, text }) => ({ id, text })),
          ],
        },
      }
    : {}),
});

export const sortedLookupVsLinearScanQuestions = [
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-001",
    title: "Choose binary search for sorted membership",
    difficulty: "intro",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "classic_index_search",
    mistakeType: "monotonic_signal_missed",
    prompt: "A sorted array [3, 8, 12, 19, 27] is searched for 19. Which lookup strategy best uses the stated structure?",
    correction: "Sorted indexed values let each comparison discard all values on one side of the midpoint.",
    nextAction: "Use sorted order as the reason for choosing binary search, not just as a descriptive detail.",
    correctAnswer: "binary_sorted_lookup",
    correctText: "Use binary search because sorted indexed order supports safe half-discarding.",
    wrongOptions: [
      { id: "linear_default", text: "Use a left-to-right scan because scans work on every array.", explanation: "A scan is correct, but it ignores the sorted structure that can reduce the lookup growth." },
      { id: "random_half", text: "Inspect an arbitrary half because any half is equally informative.", explanation: "Only the midpoint comparison combined with sorted order identifies an impossible side." },
    ],
    itemType: "solution_comparison",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-002",
    title: "Treat not-found as a valid binary-search result",
    difficulty: "easy",
    primarySkillAtomId: "classic_binary_search_found_not_found_contract",
    patternVariantId: "classic_index_search",
    mistakeType: "output_contract_misread",
    prompt: "A sorted array does not contain target after the active interval is exhausted. What does this say about binary search versus a linear scan?",
    correction: "Binary search can correctly report absence after every candidate has been eliminated; not-found is part of the lookup contract.",
    nextAction: "Keep the absence result explicit rather than treating an exhausted interval as an algorithm failure.",
    correctAnswer: "not_found_valid",
    correctText: "Binary search is correct when the interval is exhausted and the target is absent.",
    wrongOptions: [
      { id: "scan_required_absence", text: "A linear scan is required because only a scan can prove absence.", explanation: "Sorted elimination can prove that no remaining index contains the target." },
      { id: "last_mid_answer", text: "Return the last midpoint because a lookup must always return an index.", explanation: "The output contract must represent absence rather than inventing a matching index." },
    ],
    itemType: "edge_case_drill",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-003",
    title: "Compare lookup growth rates",
    difficulty: "intro",
    primarySkillAtomId: "derive_time_complexity",
    patternVariantId: "classic_index_search",
    mistakeType: "complexity_misread",
    prompt: "What worst-case time should be compared for a full scan and binary search on the same sorted array of n indexed values?",
    correction: "A scan may inspect all n positions, while binary search repeatedly halves a legal active range.",
    nextAction: "Derive complexity from how the remaining candidates shrink, not from the shared lookup goal.",
    correctAnswer: "linear_vs_log",
    correctText: "The scan is O(n); binary search is O(log n) when sorted indexed order is available.",
    wrongOptions: [
      { id: "both_linear", text: "Both are O(n) because both receive an array.", explanation: "Array input does not force a full traversal when order supports halving." },
      { id: "both_log", text: "Both are O(log n) because both are called searches.", explanation: "The name search does not determine the number of inspected positions." },
    ],
    itemType: "complexity_check",
    complexity: { time: "O(log n)", space: "O(1)", explanation: "The binary-search lookup halves the active sorted interval on each comparison and stores constant state." },
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-004",
    title: "Verify sorted precondition",
    difficulty: "intro",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "classic_index_search",
    mistakeType: "precondition_missed",
    prompt: "A candidate writes binary search for [4, 1, 9, 3, 7] without checking the input contract. What review point matters first?",
    correction: "Classic binary search needs sorted ascending or descending order; an arbitrary permutation cannot justify a half discard.",
    nextAction: "Check the ordering precondition before reviewing midpoint arithmetic or loop boundaries.",
    correctAnswer: "verify_sorted",
    correctText: "Reject the direct binary-search assumption until the input is guaranteed to be sorted.",
    wrongOptions: [
      { id: "midpoint_code", text: "Review midpoint arithmetic first; sortedness is an implementation detail.", explanation: "Correct midpoint arithmetic cannot make an unsorted input searchable by halves." },
      { id: "target_present", text: "Accept it if the target exists somewhere in the array.", explanation: "Presence of a target does not identify which half contains it." },
    ],
    itemType: "single_choice",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-005",
    title: "Return any matching index",
    difficulty: "easy",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "classic_index_search",
    mistakeType: "output_contract_misread",
    prompt: "A sorted array contains duplicate target values, and the task asks for any index where target occurs. What is the relevant contrast?",
    correction: "Classic binary search may return any matching midpoint; locating the first or last duplicate is a different boundary contract.",
    nextAction: "Read whether the output asks for any match or a specific duplicate boundary before selecting the variant.",
    correctAnswer: "any_match_classic",
    correctText: "Classic binary search is sufficient because any matching index satisfies the contract.",
    wrongOptions: [
      { id: "linear_duplicates", text: "Use a scan because duplicates make binary search invalid.", explanation: "Duplicates do not invalidate finding any match in a sorted array." },
      { id: "boundary_required", text: "Always search for the first occurrence even when any index is accepted.", explanation: "Extra boundary work is not required by an any-match output contract." },
    ],
    itemType: "solution_comparison",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-006",
    title: "Trace a legal half discard",
    difficulty: "easy",
    primarySkillAtomId: "classic_binary_search_discard_rule",
    patternVariantId: "classic_index_search",
    mistakeType: "subgoal_order_wrong",
    prompt: "In [1, 4, 7, 9, 13], mid points to 7 and target is 9. Which reasoning step is legal next?",
    correction: "Because the array is sorted and 7 is below 9, the indexes at and left of mid cannot contain 9.",
    nextAction: "Connect the midpoint comparison to the exact impossible side before moving the boundary.",
    correctAnswer: "discard_left",
    correctText: "Discard mid and the left side; only the right side can contain 9.",
    wrongOptions: [
      { id: "discard_right", text: "Discard the right side because mid is smaller than target.", explanation: "Sorted ascending order places larger possible values to the right, not the left." },
      { id: "scan_left", text: "Scan left linearly because a midpoint comparison is not enough.", explanation: "Sorted order makes the left-side elimination safe in this case." },
    ],
    itemType: "edge_case_drill",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-007",
    title: "Diagnose scanning after seeing sorted order",
    difficulty: "medium",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "classic_index_search",
    mistakeType: "monotonic_signal_missed",
    prompt: "A learner scans every element of a sorted indexed array even though the constraints make a full scan expensive. What mistake should be diagnosed?",
    correction: "The scan remains correct, but it ignores the sorted half-discard signal that improves worst-case lookup time.",
    nextAction: "When a scan is correct, still ask whether the input structure supports a more efficient legal strategy.",
    correctAnswer: "ignored_sorted_signal",
    correctText: "They missed the opportunity to use sorted order for O(log n) lookup.",
    wrongOptions: [
      { id: "scan_incorrect", text: "The scan is incorrect because sorted input cannot be scanned.", explanation: "Scanning is correct; it is simply slower in the worst case." },
      { id: "same_complexity", text: "There is no performance difference because both inspect an array.", explanation: "Binary search can inspect logarithmically many positions when its precondition holds." },
    ],
    itemType: "solution_comparison",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-008",
    title: "Account for linear early exit",
    difficulty: "easy",
    primarySkillAtomId: "derive_time_complexity",
    patternVariantId: "classic_index_search",
    mistakeType: "complexity_misread",
    prompt: "A linear scan stops as soon as it finds target in a sorted array. What worst-case comparison remains valid?",
    correction: "Early exit improves favorable cases, but a missing or late target can still force inspection of all n positions.",
    nextAction: "Separate best-case early exit from the worst-case growth used for strategy comparison.",
    correctAnswer: "scan_worst_case_linear",
    correctText: "The scan remains O(n) in the worst case despite early exit.",
    wrongOptions: [
      { id: "scan_log", text: "The scan becomes O(log n) because it can stop early.", explanation: "Early exit does not bound the number of checks by a logarithm for every input." },
      { id: "scan_constant", text: "The scan is O(1) because it returns immediately when target is found.", explanation: "The worst case includes targets near the end and absent targets." },
    ],
    itemType: "complexity_check",
    complexity: { time: "O(n)", space: "O(1)", explanation: "The scan stores constant state but may visit all n sorted positions when target is late or absent." },
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-009",
    title: "Require random access for logarithmic lookup",
    difficulty: "medium",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "classic_index_search",
    mistakeType: "data_structure_mismatch",
    prompt: "A sorted sequence is exposed only through an iterator that advances from the beginning. Why is the usual O(log n) indexed binary-search contrast not automatic?",
    correction: "The value order is useful, but reaching a midpoint may itself require linear traversal when random access is unavailable.",
    nextAction: "Include midpoint access cost when deciding whether sorted order gives the intended binary-search benefit.",
    correctAnswer: "access_cost_matters",
    correctText: "Check midpoint access; sorted values alone do not guarantee logarithmic indexed lookup.",
    wrongOptions: [
      { id: "order_always_enough", text: "Use binary search automatically because the sequence is sorted.", explanation: "Without efficient midpoint access, the repeated traversal can erase the expected benefit." },
      { id: "iterator_unsorted", text: "Assume the iterator is unsorted because it cannot jump by index.", explanation: "Access capability and value order are separate properties." },
    ],
    itemType: "single_choice",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-010",
    title: "Keep correctness separate from best growth",
    difficulty: "intro",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "classic_index_search",
    mistakeType: "concept_boundary_confused",
    prompt: "Which statement is accurate for a target lookup in a sorted array?",
    correction: "A linear scan can be correct, while binary search is asymptotically preferable when sorted indexed order is guaranteed.",
    nextAction: "State both whether a strategy is correct and whether another legal strategy has better growth.",
    correctAnswer: "both_correct_binary_faster",
    correctText: "Both can be correct, but binary search has better worst-case growth on sorted indexed input.",
    wrongOptions: [
      { id: "only_binary_correct", text: "Only binary search can return the correct target result.", explanation: "A scan still checks values directly and can return a correct result." },
      { id: "same_growth", text: "Both have the same worst-case growth because they inspect the same array.", explanation: "One can inspect all n positions while the other legally halves the active interval." },
    ],
    itemType: "solution_comparison",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-011",
    title: "Reject binary search after order is lost",
    difficulty: "medium",
    primarySkillAtomId: "recognize_binary_search_signal",
    patternVariantId: "classic_index_search",
    mistakeType: "precondition_missed",
    prompt: "An array was sorted earlier, then values were reordered in place before the lookup. Can the old sortedness assumption still justify binary search?",
    correction: "Binary search requires the current lookup view to preserve the sorted order; historical preprocessing does not repair a reordered array.",
    nextAction: "Check the structure at the moment of lookup, not only how it was initialized.",
    correctAnswer: "current_order_required",
    correctText: "No; binary search is justified only if the current array remains sorted.",
    wrongOptions: [
      { id: "history_enough", text: "Yes; it was sorted once, so its values remain searchable by halves.", explanation: "Reordering can place smaller and larger values on either side of mid." },
      { id: "target_numeric", text: "Yes; numeric targets restore the lost order automatically.", explanation: "Target type does not change the current array arrangement." },
    ],
    itemType: "single_choice",
  }),
  makeSortedLookupQuestion({
    id: "alg-contrast-binary-linear-sorted-012",
    title: "Count the indexed lookup work",
    difficulty: "easy",
    primarySkillAtomId: "derive_time_complexity",
    patternVariantId: "classic_index_search",
    mistakeType: "cannot_explain_why",
    prompt: "Why does classic binary search use O(log n) comparisons on a sorted indexed array instead of O(n)?",
    correction: "Each comparison removes roughly half of the still-possible indexes, so only logarithmically many halvings fit before the interval is empty.",
    nextAction: "Explain the shrinking candidate count rather than memorizing the complexity label.",
    correctAnswer: "halving_count",
    correctText: "The active interval is halved repeatedly, and only O(log n) halvings are possible.",
    wrongOptions: [
      { id: "one_check", text: "It is O(log n) because the target is checked only once.", explanation: "Binary search performs multiple midpoint comparisons; the logarithm comes from interval shrinkage." },
      { id: "array_size_irrelevant", text: "It is O(log n) because array length does not affect lookup work.", explanation: "The number of halvings grows with n, even though it grows slowly." },
    ],
    itemType: "complexity_check",
    complexity: { time: "O(log n)", space: "O(1)", explanation: "Repeated halving gives O(log n) comparisons and an iterative lookup needs only constant extra state." },
  }),
];
