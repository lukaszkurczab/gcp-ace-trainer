// Planning target: this file should contain questions contrasting linear scan with binary search over a monotonic boundary:
// first true; first value >= threshold; last true; false-false-true-true;
// true-true-false-false; and recognizing when a linear scan can be improved because the predicate is monotonic.
// It should diagnose mistakes such as scanning from left to right despite a clear monotonic boundary,
// applying binary search to a non-monotonic predicate,
// returning any true instead of the boundary,
// or reversing the direction of the update because the meaning of true/false was not named.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, and small trace-style items.
// Avoid full binary-search-on-answer optimization scenarios; this file is about the contrast with linear scan.
type BoundaryQuestionSpec = {
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
  itemType: "single_choice" | "solution_comparison" | "edge_case_drill" | "strategy_choice" | "common_mistake_diagnosis";
  expectedApproachIds?: readonly string[];
  acceptableApproachIds?: readonly string[];
  rejectedApproachIds?: readonly string[];
};

const makeBoundaryQuestion = (spec: BoundaryQuestionSpec) => ({
  contentVersion: "algorithms-core",
  difficulty: spec.difficulty,
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
    {
      correctAnswer: spec.correctAnswer,
      feedback: spec.correction,
      id: `${spec.id}-check`,
      mistakeTypes: [spec.mistakeType],
      options: [{ id: spec.correctAnswer, text: spec.correctText }, ...spec.wrongOptions],
      prompt: `For "${spec.title}", choose the boundary reasoning.`,
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
  ...(spec.itemType === "strategy_choice"
    ? {
        acceptableApproachIds: spec.acceptableApproachIds ?? [],
        constraintSignal: "The predicate is monotonic over the ordered boundary candidates.",
        expectedApproachIds: spec.expectedApproachIds,
        reasonSignal: spec.correction,
        rejectedApproachIds: spec.rejectedApproachIds,
        responseSpec: {
          kind: "strategy_selection",
          strategies: [{ id: spec.correctAnswer, text: spec.correctText }, ...spec.wrongOptions],
        },
      }
    : {}),
  ...(spec.itemType === "solution_comparison"
    ? {
        responseSpec: {
          comparisonCriteria: ["boundary contract", "monotonicity", "update direction"],
          kind: "solution_comparison",
          solutions: [
            { id: spec.correctAnswer, text: spec.correctText },
            ...spec.wrongOptions.map(({ id, text }) => ({ id, text })),
          ],
        },
      }
    : {}),
});

export const monotonicBoundaryVsLinearScanQuestions = [
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-001",
    title: "Find the first true boundary",
    difficulty: "intro",
    primarySkillAtomId: "monotonic_predicate_boundary",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "monotonic_signal_missed",
    prompt: "A boolean sequence over ordered indexes is false, false, true, true. The task asks for the first true index. Which strategy fits the structure?",
    correction: "The false prefix and true suffix form a monotonic first-true boundary that binary search can locate.",
    nextAction: "Name the requested boundary before choosing whether a linear scan is necessary.",
    correctAnswer: "first_true_binary",
    correctText: "Use binary search for the first true boundary instead of scanning the entire prefix.",
    wrongOptions: [
      { id: "scan_only", text: "Scan left to right because the first true value must be encountered in order.", explanation: "A monotonic boundary lets binary search skip blocks of known false values." },
      { id: "any_true", text: "Return any true index because all true positions satisfy the predicate.", explanation: "The output contract asks specifically for the first true index." },
    ],
    itemType: "strategy_choice",
    expectedApproachIds: ["monotonic_boundary_binary_search"],
    acceptableApproachIds: ["monotonic_boundary_binary_search"],
    rejectedApproachIds: ["linear_scan_default"],
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-002",
    title: "Find the last true boundary",
    difficulty: "intro",
    primarySkillAtomId: "monotonic_predicate_boundary",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "monotonic_signal_missed",
    prompt: "A boolean sequence over ordered indexes is true, true, false, false. The task asks for the last true index. What is the key contrast with a linear scan?",
    correction: "The true prefix and false suffix expose a monotonic last-true boundary, so binary search can avoid checking every later false index.",
    nextAction: "Match the update rule to last-true semantics rather than reusing first-true reasoning unchanged.",
    correctAnswer: "last_true_binary",
    correctText: "Use a last-true binary search because the predicate changes from true to false once.",
    wrongOptions: [
      { id: "first_true_rule", text: "Use first-true reasoning because both tasks search a boolean sequence.", explanation: "The boundary direction differs: last true keeps a true midpoint as a candidate on the left side." },
      { id: "linear_required", text: "Scan all values because last true cannot be found by halving.", explanation: "A monotonic true-prefix/false-suffix still supports safe halving." },
    ],
    itemType: "solution_comparison",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-003",
    title: "Recognize first value at a threshold",
    difficulty: "easy",
    primarySkillAtomId: "lower_bound_contract",
    patternVariantId: "lower_upper_bound",
    mistakeType: "structure_signal_missed",
    prompt: "In a sorted ascending array, the task asks for the first index whose value is at least threshold. Why can binary search improve on a linear scan?",
    correction: "The predicate nums[i] >= threshold is false before the first qualifying value and true from that point onward.",
    nextAction: "Turn the threshold comparison into a false-prefix/true-suffix boundary before coding.",
    correctAnswer: "first_ge_boundary",
    correctText: "The first value >= threshold is a first-true boundary in the sorted array.",
    wrongOptions: [
      { id: "any_ge_value", text: "Return any qualifying value because the threshold predicate is enough.", explanation: "The requested first index requires preserving the boundary contract." },
      { id: "linear_threshold", text: "A threshold always requires scanning from index zero.", explanation: "Sorted order groups all values below the threshold before all qualifying values." },
    ],
    itemType: "single_choice",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-004",
    title: "Keep a true midpoint for first true",
    difficulty: "easy",
    primarySkillAtomId: "first_true_update_rule",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "subgoal_order_wrong",
    prompt: "During a first-true search, predicate(mid) is true. Which side remains capable of containing the answer?",
    correction: "True at mid means mid may be the first true position, so mid and the left side remain candidates.",
    nextAction: "Keep a true midpoint for first-true search and continue looking left for an earlier boundary.",
    correctAnswer: "keep_left_and_mid",
    correctText: "Keep mid and search the left side because an earlier true position may exist.",
    wrongOptions: [
      { id: "discard_mid_left", text: "Discard mid and the left side because true means the answer is to the right.", explanation: "For first true, a true midpoint is a valid boundary candidate and earlier positions may also be true." },
      { id: "discard_right", text: "Discard the right side and return mid immediately.", explanation: "The right side can be discarded, but the search still must distinguish mid from an earlier true position." },
    ],
    itemType: "edge_case_drill",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-005",
    title: "Move right after false for first true",
    difficulty: "easy",
    primarySkillAtomId: "first_true_update_rule",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "subgoal_order_wrong",
    prompt: "During a first-true search, predicate(mid) is false. Which candidate region remains possible?",
    correction: "A false midpoint cannot be the first true position, and monotonicity rules out every position at or before mid.",
    nextAction: "For first true, move strictly right after a false midpoint.",
    correctAnswer: "right_of_mid",
    correctText: "Discard mid and everything left of it; only positions after mid can be first true.",
    wrongOptions: [
      { id: "keep_left", text: "Keep the left side because an earlier position may still be true.", explanation: "Monotonicity says positions at or before a false mid are also false." },
      { id: "return_false", text: "Return mid because it is the first inspected boundary candidate.", explanation: "A false midpoint cannot satisfy a first-true output contract." },
    ],
    itemType: "edge_case_drill",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-006",
    title: "Keep a true midpoint for last true",
    difficulty: "easy",
    primarySkillAtomId: "last_true_update_rule",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "subgoal_order_wrong",
    prompt: "During a last-true search, predicate(mid) is true. Which direction preserves the boundary candidate?",
    correction: "True at mid means mid may be the last true position, while later true positions may still exist to the right.",
    nextAction: "For last true, keep mid and continue right after a true midpoint.",
    correctAnswer: "keep_mid_search_right",
    correctText: "Keep mid and search right to look for a later true position.",
    wrongOptions: [
      { id: "search_left_only", text: "Search left because true means the boundary must be earlier.", explanation: "The last true boundary may be at mid or later in the true prefix." },
      { id: "discard_mid", text: "Discard mid because it has already been tested.", explanation: "Testing mid as true does not remove it from a last-true candidate set." },
    ],
    itemType: "edge_case_drill",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-007",
    title: "Move left after false for last true",
    difficulty: "easy",
    primarySkillAtomId: "last_true_update_rule",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "subgoal_order_wrong",
    prompt: "During a last-true search, predicate(mid) is false in a true-prefix/false-suffix sequence. Which region can still contain the answer?",
    correction: "A false midpoint and every later position are false under the monotonic contract, so only the left side remains possible.",
    nextAction: "For last true, move left after a false midpoint and do not keep mid as a valid answer.",
    correctAnswer: "left_of_mid",
    correctText: "Discard mid and the right side; the last true must be before mid.",
    wrongOptions: [
      { id: "search_right", text: "Search right because later indexes are closer to the last position.", explanation: "The false suffix means later indexes cannot be true." },
      { id: "keep_false", text: "Keep mid because every boundary search keeps the midpoint.", explanation: "A false midpoint cannot satisfy the last-true output contract." },
    ],
    itemType: "single_choice",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-008",
    title: "Reject a non-monotonic boundary claim",
    difficulty: "medium",
    primarySkillAtomId: "binary_search_answer_feasibility_predicate",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "monotonic_assumption_invalid",
    prompt: "Predicate outcomes over ordered indexes are false, true, false, true. A learner asks binary search for the first true index. What must be rejected?",
    correction: "The predicate reverses after becoming true, so there is no single false-prefix/true-suffix boundary to search.",
    nextAction: "Verify the whole predicate shape before applying first-true update rules.",
    correctAnswer: "no_single_boundary",
    correctText: "Reject binary search because the non-monotonic results do not define one first-true boundary.",
    wrongOptions: [
      { id: "first_true_exists", text: "Accept it because at least one true value exists.", explanation: "Existence of true values does not make the true region a suffix." },
      { id: "first_true_rule_anyway", text: "Apply first-true updates because the result is boolean.", explanation: "First-true updates require monotonic predicate outcomes, not merely boolean output." },
    ],
    itemType: "strategy_choice",
    expectedApproachIds: ["linear_scan_default"],
    acceptableApproachIds: ["linear_scan_default"],
    rejectedApproachIds: ["monotonic_boundary_binary_search"],
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-009",
    title: "Do not return any true for a boundary task",
    difficulty: "medium",
    primarySkillAtomId: "monotonic_predicate_boundary",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "output_contract_misread",
    prompt: "A monotonic sequence is false, false, true, true, and the task asks for the first true index. Why is returning the first true value encountered by an arbitrary midpoint insufficient?",
    correction: "A midpoint that is true proves a valid candidate, not that no earlier true position exists.",
    nextAction: "Preserve the boundary contract after finding a valid midpoint; continue toward the requested edge.",
    correctAnswer: "boundary_not_any",
    correctText: "Any true midpoint is not enough; the algorithm must continue left to prove it is the first true.",
    wrongOptions: [
      { id: "any_satisfies", text: "Return immediately because any true index satisfies the predicate.", explanation: "The task asks for the first true index, not any satisfying index." },
      { id: "linear_only", text: "Switch to a full linear scan because binary search cannot return boundaries.", explanation: "Binary search can return boundaries when its updates preserve the boundary invariant." },
    ],
    itemType: "common_mistake_diagnosis",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-010",
    title: "Handle an all-false first-true search",
    difficulty: "easy",
    primarySkillAtomId: "first_true_update_rule",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "edge_case_missed",
    prompt: "A first-true query runs over a monotonic predicate that is false for every candidate. What should the result represent?",
    correction: "An all-false sequence has no first true position, so the not-found boundary must remain explicit.",
    nextAction: "Define the no-boundary result before relying on a first-true loop.",
    correctAnswer: "no_true_boundary",
    correctText: "Return the explicit not-found result because no candidate satisfies the predicate.",
    wrongOptions: [
      { id: "last_index", text: "Return the last index because the search interval became empty there.", explanation: "An exhausted interval does not create a valid true boundary." },
      { id: "first_checked", text: "Return the first checked candidate even though it is false.", explanation: "A false candidate cannot satisfy a first-true output contract." },
    ],
    itemType: "edge_case_drill",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-011",
    title: "Handle an all-true last-true search",
    difficulty: "easy",
    primarySkillAtomId: "last_true_update_rule",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "edge_case_missed",
    prompt: "A last-true query runs over a monotonic predicate that is true for every candidate. Which boundary should be returned?",
    correction: "When every candidate is true, the last valid position is the final candidate in the search domain.",
    nextAction: "Test all-true and all-false shapes against the boundary contract, not only mixed sequences.",
    correctAnswer: "final_index",
    correctText: "Return the final candidate index because it is the last true position.",
    wrongOptions: [
      { id: "no_true", text: "Return not-found because there was no false-to-true transition.", explanation: "Last-true search needs a true position; an all-true domain has one at the end." },
      { id: "first_index", text: "Return the first index because it is the first true encountered.", explanation: "The contract asks for the last true, not the first true." },
    ],
    itemType: "edge_case_drill",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-012",
    title: "Name the predicate direction",
    difficulty: "medium",
    primarySkillAtomId: "monotonic_predicate_boundary",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "state_model_misread",
    prompt: "A developer says ‘true means move right’ without saying whether the task asks for first true or last true. Why is that explanation unsafe?",
    correction: "The meaning of a true midpoint depends on the requested boundary: first true moves left, while last true moves right.",
    nextAction: "State the boundary contract and what true or false proves before writing updates.",
    correctAnswer: "boundary_semantics_first",
    correctText: "Name first-true or last-true semantics before choosing the direction for a true midpoint.",
    wrongOptions: [
      { id: "true_always_right", text: "True always means move right in binary search.", explanation: "True moves right for last true but left for first true when mid remains a candidate." },
      { id: "direction_irrelevant", text: "The direction does not matter if the predicate is monotonic.", explanation: "A wrong direction can return the wrong boundary despite valid monotonicity." },
    ],
    itemType: "common_mistake_diagnosis",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-013",
    title: "Prefer boundary search over a scan",
    difficulty: "intro",
    primarySkillAtomId: "monotonic_predicate_boundary",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "monotonic_signal_missed",
    prompt: "A left-to-right scan checks a million ordered candidates even though the predicate is false before one boundary and true after it. What improvement is justified?",
    correction: "The monotonic boundary lets binary search skip large regions while preserving the requested first- or last-boundary result.",
    nextAction: "Replace repeated linear inspection with boundary reasoning when the predicate has one direction of change.",
    correctAnswer: "boundary_binary_search",
    correctText: "Use binary search for the monotonic boundary instead of scanning all candidates.",
    wrongOptions: [
      { id: "scan_only_correct", text: "Keep the scan because boundary results must be discovered in order.", explanation: "Binary search discovers the boundary through ordered elimination, not sequential visitation." },
      { id: "arbitrary_binary", text: "Use binary search for any predicate because the domain is large.", explanation: "Large size does not compensate for a missing monotonicity guarantee." },
    ],
    itemType: "solution_comparison",
  }),
  makeBoundaryQuestion({
    id: "alg-contrast-binary-linear-boundary-014",
    title: "Reject linear scan after a boundary is proven",
    difficulty: "medium",
    primarySkillAtomId: "monotonic_predicate_boundary",
    patternVariantId: "monotonic_predicate_recognition",
    mistakeType: "complexity_mismatch",
    prompt: "A reviewer accepts an O(n) scan for a first-true query even though the false-prefix/true-suffix invariant is explicitly guaranteed. What should the review flag?",
    correction: "The scan is correct but leaves a clear logarithmic improvement unused; the monotonic boundary is the intended strategy signal.",
    nextAction: "Separate ‘works’ from ‘fits the available structure and constraints’ in strategy review.",
    correctAnswer: "missed_log_improvement",
    correctText: "Flag the scan as correct but asymptotically weaker than binary search for the guaranteed boundary.",
    wrongOptions: [
      { id: "scan_wrong", text: "Flag it as incorrect because scans cannot process monotonic predicates.", explanation: "A scan can still return the correct boundary; it is simply slower." },
      { id: "same_growth", text: "Accept it as equivalent because both methods inspect the same candidate domain.", explanation: "Sequential inspection is O(n), while safe halving is O(log n)." },
    ],
    itemType: "solution_comparison",
  }),
];
