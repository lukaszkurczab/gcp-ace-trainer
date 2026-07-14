import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const bigOBasicsQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal: "In the worst case, the validator reaches all n values before it can return.",
      details:
        "The validator performs O(1) work for each inspected value. If the first invalid value is last, or every value is valid, it performs n inspections, so n × O(1) = O(n). Returning early changes the best case to O(1), but it does not change this worst-case bound.",
      mentalModelCorrection:
        "Worst-case analysis follows the execution that reaches every value, not the early return that happens only on favorable input.",
      mistakeTypes: ["complexity_mismatch"],
      nextAction: "For an early-exit routine, identify the input that delays the exit before naming its worst-case cost.",
      result: "diagnostic",
      distractorExplanations: {
        wrong_constant:
          "This treats an available early return as guaranteed. The invalid value can be last or absent, so one execution still inspects all n values.",
        wrong_quadratic:
          "This assumes pairwise work that the routine never performs. Each value is checked once against the validator rule, rather than against every other value.",
      },
    },
    id: "alg-complexity-big-o-basics-002-check",
    learningStage: "foundations",
    primarySkillAtomId: "derive_time_complexity",
    prompt:
      "A validator receives an array of n values. It checks one value at a time and returns immediately when it finds an invalid value. What is its worst-case time complexity?",
    roadmapNodeId: "complexity_and_constraints",
    status: "active",
    taxonomyRefs: [
      { axisId: "pattern_family", nodeId: "complexity_and_constraints", role: "primary" },
      { axisId: "skill_atom", nodeId: "derive_time_complexity", role: "primary" },
      { axisId: "pattern_variant", nodeId: "big_o_basics", role: "secondary" },
      { axisId: "mistake_type", nodeId: "complexity_mismatch", role: "mistake_type" },
    ],
    title: "Derive worst-case single scan",
    trackId: "algorithms",
    type: "approach_naming",
    instruction:
      "Count the most inspections this validator can perform before it returns.",
    answerFeedback:
      "The worst case performs one constant-time validation for every one of the n values.",
    options: [
      {
        id: "expected_signal",
        text: "O(n), because an invalid value can be last or every value can be valid, requiring n checks.",
        isCorrect: true,
      },
      {
        id: "wrong_constant",
        text: "O(1), because the routine can return as soon as it finds an invalid value.",
        isCorrect: false,
      },
      {
        id: "wrong_quadratic",
        text: "O(n^2), because validation compares many values before returning.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal: "The routine compares each unordered pair once: 1 + 2 + ... + (n - 1) comparisons.",
      details:
        "For the first value there are n - 1 later values to compare; for the next there are n - 2, and so on. That total is n(n - 1) / 2, which grows as O(n^2), with O(1) work per comparison. A shrinking inner range is not repeated halving: its total is still a triangular number here.",
      mentalModelCorrection:
        "Count all pair comparisons, not just outer-loop iterations or the fact that the inner range shrinks.",
      mistakeTypes: ["complexity_mismatch"],
      nextAction: "When a bound shrinks, write the total number of inner iterations before assigning a growth class.",
      result: "diagnostic",
      distractorExplanations: {
        wrong_outer_only:
          "This counts the n outer positions but omits the comparisons made for each position. The omitted inner work sums to about n^2 / 2 comparisons.",
        wrong_logarithmic:
          "This mistakes a linearly shrinking range for repeated halving. The inner counts are n - 1, n - 2, and so on, not n/2, n/4, and so on.",
      },
    },
    id: "alg-complexity-big-o-basics-004-check",
    learningStage: "foundations",
    primarySkillAtomId: "derive_time_complexity",
    prompt:
      "For each index i in an array of n values, a routine compares value i with every later value j. What is the routine's worst-case time complexity?",
    roadmapNodeId: "complexity_and_constraints",
    status: "active",
    taxonomyRefs: [
      { axisId: "pattern_family", nodeId: "complexity_and_constraints", role: "primary" },
      { axisId: "skill_atom", nodeId: "derive_time_complexity", role: "primary" },
      { axisId: "pattern_variant", nodeId: "big_o_basics", role: "secondary" },
      { axisId: "mistake_type", nodeId: "complexity_mismatch", role: "mistake_type" },
    ],
    title: "Derive pair-enumeration cost",
    trackId: "algorithms",
    type: "edge_case_drill",
    instruction: "Add the comparisons made across all outer positions.",
    answerFeedback:
      "The decreasing inner ranges add to about n^2 / 2 comparisons, so the total is quadratic.",
    options: [
      {
        id: "expected_signal",
        text: "O(n^2), because the pair count is (n - 1) + (n - 2) + ... + 1.",
        isCorrect: true,
      },
      {
        id: "wrong_outer_only",
        text: "O(n), because the outer position advances through the array only once.",
        isCorrect: false,
      },
      {
        id: "wrong_logarithmic",
        text: "O(n log n), because the inner range becomes shorter after each outer position.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal: "Every unsuccessful comparison leaves at most half of the candidate range.",
      details:
        "After one comparison at most n / 2 candidates remain, then n / 4, then n / 8. After k comparisons the remaining range is about n / 2^k; reaching one candidate requires k = O(log n). Sortedness makes the discard rule valid, but the repeated constant-factor reduction produces the logarithm.",
      mentalModelCorrection:
        "The logarithm comes from halving the candidate range at every step, not from merely searching an array.",
      mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
      nextAction: "For a range-based routine, write how much of the candidate set remains after each unsuccessful step.",
      result: "diagnostic",
      distractorExplanations: {
        wrong_linear:
          "This treats every array search as a left-to-right scan. Here one comparison eliminates roughly half the candidates instead of examining the next single candidate.",
        wrong_constant:
          "This counts only the first middle comparison. A missing target can require several halvings, and that number grows with n.",
      },
    },
    id: "alg-complexity-big-o-basics-007-check",
    learningStage: "foundations",
    primarySkillAtomId: "derive_time_complexity",
    prompt:
      "A binary search runs on a sorted array of n values. Each comparison checks the middle value and then retains at most half of the remaining candidate range. What is its worst-case time complexity?",
    roadmapNodeId: "complexity_and_constraints",
    status: "active",
    taxonomyRefs: [
      { axisId: "pattern_family", nodeId: "complexity_and_constraints", role: "primary" },
      { axisId: "skill_atom", nodeId: "derive_time_complexity", role: "primary" },
      { axisId: "pattern_variant", nodeId: "big_o_basics", role: "secondary" },
      { axisId: "mistake_type", nodeId: "complexity_mismatch", role: "mistake_type" },
    ],
    title: "Derive repeated-halving cost",
    trackId: "algorithms",
    type: "approach_naming",
    instruction: "Track the size of the candidate range after each unsuccessful comparison.",
    answerFeedback:
      "Each comparison keeps at most half the candidates, so only logarithmically many comparisons are needed.",
    options: [
      {
        id: "expected_signal",
        text: "O(log n), because the candidate range is halved after each unsuccessful comparison.",
        isCorrect: true,
      },
      {
        id: "wrong_linear",
        text: "O(n), because an array can contain n values that might need to be considered.",
        isCorrect: false,
      },
      {
        id: "wrong_constant",
        text: "O(1), because the routine checks the middle value first.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal: "Binary search is logarithmic only when each comparison justifies discarding a constant fraction of candidates.",
      details:
        "On sorted input, comparing the middle value with the target proves that one half cannot contain the target. The next range is therefore at most half as large, giving n, n/2, n/4, and eventually O(log n) comparisons. Names such as left and right do not change the work, and sortedness alone is only a precondition until the algorithm uses it to eliminate a half.",
      mentalModelCorrection:
        "Explain binary search from the discard rule: sorted order permits a middle comparison to remove half the remaining candidates.",
      mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
      nextAction: "Separate an algorithm's enabling precondition from the operation that actually reduces its remaining work.",
      result: "diagnostic",
      distractorExplanations: {
        wrong_names:
          "This uses implementation labels as evidence. Renaming the bounds leaves the same number of comparisons, so the names cannot determine complexity.",
        wrong_sorted_only:
          "This confuses a precondition with the mechanism. Sortedness is useful because it validates the half-discard inference; without that repeated discard, sorted data alone does not force logarithmic work.",
      },
    },
    id: "alg-complexity-big-o-basics-008-check",
    learningStage: "foundations",
    primarySkillAtomId: "derive_time_complexity",
    prompt:
      "A binary-search implementation uses bounds named left and right on a sorted array of n values. Which explanation correctly justifies its O(log n) worst-case time?",
    roadmapNodeId: "complexity_and_constraints",
    status: "active",
    taxonomyRefs: [
      { axisId: "pattern_family", nodeId: "complexity_and_constraints", role: "primary" },
      { axisId: "skill_atom", nodeId: "derive_time_complexity", role: "primary" },
      { axisId: "pattern_variant", nodeId: "big_o_basics", role: "secondary" },
      { axisId: "mistake_type", nodeId: "cannot_explain_why", role: "mistake_type" },
    ],
    title: "Justify the binary-search bound",
    trackId: "algorithms",
    type: "edge_case_drill",
    instruction: "Choose the explanation based on the work eliminated by each comparison.",
    answerFeedback:
      "The cost is logarithmic because each valid comparison eliminates about half the candidates.",
    options: [
      {
        id: "expected_signal",
        text: "Each middle comparison uses sorted order to discard about half the remaining candidate range.",
        isCorrect: true,
      },
      {
        id: "wrong_names",
        text: "The bound is logarithmic because the variables are named left and right.",
        isCorrect: false,
      },
      {
        id: "wrong_sorted_only",
        text: "The bound is logarithmic simply because the input is sorted, even if no range is discarded.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal: "Merge sort does O(n) merging work at each of O(log n) levels of splitting.",
      details:
        "Merge sort divides n values until singleton lists, creating O(log n) levels. At each level, merging processes all n values once, so the total is O(log n) levels × O(n) work per level = O(n log n) in the worst case. This conclusion is specific to merge sort; a sort's name or the fact that it compares values does not by itself establish one universal bound.",
      mentalModelCorrection:
        "Derive merge sort from its levels and per-level merge work rather than assuming that sorting is either a scan or all-pairs comparison.",
      mistakeTypes: ["complexity_mismatch"],
      nextAction: "For divide-and-conquer work, count the levels and the work completed across one level.",
      result: "diagnostic",
      distractorExplanations: {
        wrong_linear:
          "This counts only one merge pass over n values. Merge sort repeats that total-size merge work across logarithmically many split levels.",
        wrong_quadratic:
          "This assumes every pair must be compared. Merge sort merges ordered sublists and processes each value once per level rather than enumerating all pairs.",
      },
    },
    id: "alg-complexity-big-o-basics-009-check",
    learningStage: "foundations",
    primarySkillAtomId: "derive_time_complexity",
    prompt:
      "Merge sort orders n arbitrary values. Under its standard worst-case comparison model, what is its time complexity?",
    roadmapNodeId: "complexity_and_constraints",
    status: "active",
    taxonomyRefs: [
      { axisId: "pattern_family", nodeId: "complexity_and_constraints", role: "primary" },
      { axisId: "skill_atom", nodeId: "derive_time_complexity", role: "primary" },
      { axisId: "pattern_variant", nodeId: "big_o_basics", role: "secondary" },
      { axisId: "mistake_type", nodeId: "complexity_mismatch", role: "mistake_type" },
    ],
    title: "Derive merge-sort cost",
    trackId: "algorithms",
    type: "approach_naming",
    instruction: "Relate merge work across one level to the number of split levels.",
    answerFeedback:
      "Merge sort processes n values across each of logarithmically many levels, giving O(n log n).",
    options: [
      {
        id: "expected_signal",
        text: "O(n log n), because each of O(log n) levels merges a total of n values.",
        isCorrect: true,
      },
      {
        id: "wrong_linear",
        text: "O(n), because a merge pass touches every value once.",
        isCorrect: false,
      },
      {
        id: "wrong_quadratic",
        text: "O(n^2), because sorting must compare every pair of values.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal: "A single scan visits n values; enumerating every unordered pair performs about n^2 / 2 comparisons.",
      details:
        "Plan A does one O(1) operation for each of n values, so it is O(n). Plan B compares each value with every later value, for n(n - 1) / 2 pair comparisons, so it is O(n^2). The number of loop keywords or local variables is not the growth mechanism; total executed operations are.",
      mentalModelCorrection:
        "Compare plans by the total work their operation patterns execute, not by their surface syntax.",
      mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
      nextAction: "Translate a plan into the number of visits or pairs it can execute before comparing its Big-O cost.",
      result: "diagnostic",
      distractorExplanations: {
        wrong_loop_count:
          "This treats the presence of loops as the whole analysis. One loop can run n times, while a nested independent comparison can create roughly n^2 / 2 total operations.",
        wrong_memory:
          "This substitutes a memory heuristic for a time derivation. Variable count does not tell us how many scan visits or pair comparisons execute.",
      },
    },
    id: "alg-complexity-big-o-basics-016-check",
    learningStage: "foundations",
    primarySkillAtomId: "identify_repeated_work",
    prompt:
      "Plan A performs one constant-time check for each of n values. Plan B compares every unordered pair of those n values once. Which time comparison is correct?",
    roadmapNodeId: "complexity_and_constraints",
    status: "active",
    taxonomyRefs: [
      { axisId: "pattern_family", nodeId: "complexity_and_constraints", role: "primary" },
      { axisId: "skill_atom", nodeId: "identify_repeated_work", role: "primary" },
      { axisId: "pattern_variant", nodeId: "big_o_basics", role: "secondary" },
      { axisId: "mistake_type", nodeId: "cannot_explain_why", role: "mistake_type" },
    ],
    title: "Contrast scan and pair work",
    trackId: "algorithms",
    type: "solution_comparison",
    instruction: "Compare the total number of constant-time operations each plan can perform.",
    answerFeedback:
      "One visit per value is linear; one comparison per unordered pair is quadratic.",
    options: [
      {
        id: "expected_signal",
        text: "Plan A is O(n), while Plan B is O(n^2) because its number of pair comparisons grows quadratically.",
        isCorrect: true,
      },
      {
        id: "wrong_loop_count",
        text: "The plans have the same growth rate because both can be written with loops.",
        isCorrect: false,
      },
      {
        id: "wrong_memory",
        text: "The plan with fewer local variables is always the faster plan.",
        isCorrect: false,
      },
    ],
  },
] as const satisfies readonly AlgorithmQuestion[];
