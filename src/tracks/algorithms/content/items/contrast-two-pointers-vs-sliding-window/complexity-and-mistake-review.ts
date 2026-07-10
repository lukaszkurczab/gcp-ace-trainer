export const complexityAndMistakeReviewQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "The right pointer advances at most n times, and the left pointer also advances at most n times across all executions of the inner loop. The nested while loop does not restart from the beginning, so the total pointer movement is O(n).",
    feedbackModel: {
      decisionSignal:
        "Both window boundaries move only forward, even though one of them moves inside a nested loop.",
      mentalModelCorrection:
        "Nested syntax does not imply multiplied complexity. Count the total number of times each monotonic pointer can advance over the entire run.",
      mistakeTypes: ["nested_loop_complexity_mismatch"],
      nextAction:
        "Bound the total advances of left and right separately rather than multiplying the visible loops.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-001",
    learningStage: "foundations",
    primarySkillAtomId: "derive_amortized_window_complexity",
    secondarySkillAtomIds: [
      "count_monotonic_pointer_moves",
      "distinguish_nested_from_quadratic_work",
    ],
    type: "complexity_check",
    prompt: `Consider this variable-size sliding window:

let left = 0;
let sum = 0;

for (let right = 0; right < values.length; right++) {
  sum += values[right];

  while (sum > limit) {
    sum -= values[left];
    left++;
  }
}

Assume all values are non-negative. What is the precise complexity?`,
    options: [
      {
        id: "linear_constant",
        text: "O(n) time and O(1) auxiliary space, because each boundary advances at most n times in total.",
        isCorrect: true,
      },
      {
        id: "quadratic_constant",
        text: "O(n²) time and O(1) auxiliary space, because the while loop is nested inside the for loop.",
        isCorrect: false,
      },
      {
        id: "linear_linear",
        text: "O(n) time and O(n) auxiliary space, because the window may contain n elements.",
        isCorrect: false,
      },
      {
        id: "nlogn_constant",
        text: "O(n log n) time and O(1) auxiliary space, because the window repeatedly changes size.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n²)",
    complexityExplanation:
      "The right pointer is reset to left for every outer-loop iteration. It may therefore scan most of the remaining array repeatedly, producing 1 + 2 + ... + n work in the worst case.",
    feedbackModel: {
      decisionSignal:
        "A pointer named right exists, but it is reinitialized during every outer iteration.",
      mentalModelCorrection:
        "Two pointer variables do not guarantee linear time. Linear convergence requires a global monotonic movement bound across the entire algorithm.",
      mistakeTypes: ["two_pointer_label_complexity_mismatch"],
      nextAction:
        "Check whether pointer progress survives between outer-loop iterations or is repeatedly discarded.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-002",
    learningStage: "foundations",
    primarySkillAtomId: "validate_pointer_movement_invariant",
    secondarySkillAtomIds: [
      "derive_two_pointer_complexity",
      "detect_repeated_scanning",
    ],
    type: "common_mistake_diagnosis",
    prompt: `A reviewer calls the following code O(n) because it uses left and right pointers:

for (let left = 0; left < values.length; left++) {
  let right = left;

  while (right < values.length && canExtend(left, right)) {
    right++;
  }
}

What is wrong with that review?`,
    options: [
      {
        id: "right_resets_quadratic",
        text: "right is reset for every left value, so the same suffixes may be scanned repeatedly and the worst-case time is O(n²).",
        isCorrect: true,
      },
      {
        id: "all_two_pointer_linear",
        text: "Nothing is wrong; any algorithm with left and right variables is O(n).",
        isCorrect: false,
      },
      {
        id: "while_always_quadratic",
        text: "The result is O(n²) solely because every while loop nested inside a for loop multiplies the costs.",
        isCorrect: false,
      },
      {
        id: "distance_logarithmic",
        text: "The result is O(log n) because right moves toward the end of the array.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "Computing the first window costs O(k). Each of the remaining n - k windows is updated by one subtraction and one addition, so the total is O(k + n - k) = O(n).",
    feedbackModel: {
      decisionSignal:
        "A fixed-size window reuses the previous aggregate rather than recalculating every element.",
      mentalModelCorrection:
        "The cost of processing each window depends on the update performed, not on the number of elements conceptually inside the window.",
      mistakeTypes: ["fixed_window_recomputation_mismatch"],
      nextAction:
        "Separate the one-time initialization cost from the constant-cost rolling updates.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-003",
    learningStage: "foundations",
    primarySkillAtomId: "derive_fixed_window_complexity",
    secondarySkillAtomIds: [
      "analyze_rolling_updates",
      "separate_initialization_from_iteration",
    ],
    type: "complexity_check",
    prompt: `A fixed-size window of length k computes its first sum in O(k). Each subsequent step subtracts the outgoing value and adds the incoming value.

What is the total complexity for an array of length n?`,
    options: [
      {
        id: "linear_constant",
        text: "O(n) time and O(1) auxiliary space.",
        isCorrect: true,
      },
      {
        id: "nk_constant",
        text: "O(nk) time and O(1) auxiliary space because every window contains k elements.",
        isCorrect: false,
      },
      {
        id: "k_constant",
        text: "O(k) time and O(1) auxiliary space because the window size never changes.",
        isCorrect: false,
      },
      {
        id: "linear_k",
        text: "O(n) time and O(k) auxiliary space because the algorithm must copy every current window.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "implementation-dependent",
    expectedTimeComplexity: "O(n log n)",
    complexityExplanation:
      "Sorting costs O(n log n), while the inward two-pointer scan costs O(n). The combined time is therefore O(n log n). Auxiliary space depends on whether sorting is in-place and on the sorting implementation.",
    feedbackModel: {
      decisionSignal:
        "The linear pointer scan becomes legal only after a preprocessing step that orders the input.",
      mentalModelCorrection:
        "Complexity must include all work performed by the solution, including preprocessing before the main scan.",
      mistakeTypes: ["preprocessing_cost_omission"],
      nextAction:
        "Write the full cost as preprocessing plus scan before simplifying the dominant term.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-004",
    learningStage: "foundations",
    primarySkillAtomId: "account_for_sorting_preprocessing",
    secondarySkillAtomIds: [
      "derive_two_pointer_complexity",
      "derive_auxiliary_space",
    ],
    type: "single_choice",
    prompt:
      "A solution sorts an unsorted array and then performs one inward two-pointer scan. Which review statement is precise?",
    options: [
      {
        id: "sort_dominates_space_depends",
        text: "The total time is O(n log n), and auxiliary space depends on the sorting implementation.",
        isCorrect: true,
      },
      {
        id: "scan_only_linear",
        text: "The total time is O(n) because the two-pointer phase visits each position at most once.",
        isCorrect: false,
      },
      {
        id: "quadratic_nested",
        text: "The total time is O(n²) because sorting and scanning are two separate stages.",
        isCorrect: false,
      },
      {
        id: "always_constant_space",
        text: "The total time is O(n log n) and auxiliary space is always O(1) because the scan uses only two indexes.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(d)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "Each boundary still advances at most n times, so the scan is amortized O(n). However, a frequency map can contain d distinct values from the active window, where d may grow to n.",
    feedbackModel: {
      decisionSignal:
        "The window stores a map whose size depends on the distinct values currently represented.",
      mentalModelCorrection:
        "A sliding window does not automatically use constant space. Its auxiliary space is determined by the maintained state, not by the number of pointer variables.",
      mistakeTypes: ["state_space_complexity_mismatch"],
      nextAction:
        "Identify every data structure maintained by the window and bound its maximum number of entries.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-005",
    learningStage: "foundations",
    primarySkillAtomId: "derive_window_state_space",
    secondarySkillAtomIds: [
      "derive_amortized_window_complexity",
      "distinguish_pointer_state_from_window_state",
    ],
    type: "complexity_check",
    prompt: `A variable-size window maintains a Map from each distinct value in the current window to its frequency. Both left and right move only forward.

Let d be the maximum number of distinct values simultaneously present in the window. What is the precise complexity?`,
    options: [
      {
        id: "linear_d",
        text: "O(n) time and O(d) auxiliary space, which can become O(n) when all active values are distinct.",
        isCorrect: true,
      },
      {
        id: "linear_constant",
        text: "O(n) time and O(1) auxiliary space because the algorithm uses only two pointers.",
        isCorrect: false,
      },
      {
        id: "quadratic_d",
        text: "O(n²) time and O(d) auxiliary space because the window can shrink inside the outer loop.",
        isCorrect: false,
      },
      {
        id: "linear_window_length_always",
        text: "O(n) time and exactly O(window length) auxiliary space, even when many values repeat.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "The number of operations is bounded by the number of pointer moves. If every iteration advances exactly one boundary and neither boundary moves backward, there can be only O(n) total iterations.",
    feedbackModel: {
      decisionSignal:
        "Each loop iteration performs one constant-cost action and permanently advances one boundary.",
      mentalModelCorrection:
        "Pointer distance describes the current interval size; it is not an additional factor multiplied by the number of iterations.",
      mistakeTypes: ["pointer_distance_operation_mismatch"],
      nextAction:
        "Use total pointer advances as the progress measure instead of multiplying by the distance between pointers.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-006",
    learningStage: "foundations",
    primarySkillAtomId: "count_monotonic_pointer_moves",
    secondarySkillAtomIds: [
      "derive_two_pointer_complexity",
      "choose_progress_measure",
    ],
    type: "common_mistake_diagnosis",
    prompt: `An inward two-pointer loop starts with left = 0 and right = n - 1. Every iteration performs O(1) work and moves exactly one pointer one position inward.

A reviewer argues that the loop is O(n²) because the initial pointer distance is O(n) and the loop may also execute O(n) times. Which response is correct?`,
    options: [
      {
        id: "distance_not_extra_factor",
        text: "The review double-counts the same progress. The distance decreases on every iteration, so the loop executes at most O(n) times.",
        isCorrect: true,
      },
      {
        id: "distance_times_iterations",
        text: "The review is correct because pointer distance must always be multiplied by the iteration count.",
        isCorrect: false,
      },
      {
        id: "two_pointers_logarithmic",
        text: "The loop is O(log n) because two pointers reduce the search space from both ends.",
        isCorrect: false,
      },
      {
        id: "constant_two_variables",
        text: "The loop is O(1) because only two pointer variables are stored.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    feedbackModel: {
      decisionSignal:
        "A complexity claim relies on pointer convergence, but the code allows one boundary to reverse direction.",
      mentalModelCorrection:
        "An O(n) convergence proof needs a monotonic potential or another explicit bound. Pointer names alone do not provide that proof.",
      mistakeTypes: ["invalid_movement_invariant"],
      nextAction:
        "Identify a quantity that strictly progresses toward termination and prove how many times it can change.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-007",
    learningStage: "foundations",
    primarySkillAtomId: "validate_pointer_movement_invariant",
    secondarySkillAtomIds: [
      "prove_algorithm_termination",
      "derive_two_pointer_complexity",
    ],
    type: "single_choice",
    prompt: `A code review states that a loop is O(n) because it has left and right pointers. However, the loop may increment right in one branch and decrement right in another, with no bound on how often those branches alternate.

What is the correct conclusion?`,
    options: [
      {
        id: "cannot_accept_without_progress_bound",
        text: "The O(n) claim is unsupported. The review needs a monotonic progress measure or another bound on the repeated movements.",
        isCorrect: true,
      },
      {
        id: "two_pointers_guarantee_linear",
        text: "The O(n) claim is valid because every algorithm with two pointer variables is linear.",
        isCorrect: false,
      },
      {
        id: "must_be_quadratic",
        text: "The loop must be O(n²) whenever a pointer can move in both directions.",
        isCorrect: false,
      },
      {
        id: "must_be_logarithmic",
        text: "The loop is O(log n) because right repeatedly changes the remaining search range.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "The implementation may terminate after O(n) total pointer movements, but that complexity result does not establish correctness. With arbitrary negative values, extending or shrinking the window does not change the sum monotonically, so the movement rule can discard valid answers.",
    feedbackModel: {
      decisionSignal:
        "The code has a linear movement bound, but the predicate does not support the chosen shrink and expand decisions.",
      mentalModelCorrection:
        "Asymptotic efficiency is relevant only after the algorithm's movement rule is proven correct for the input domain.",
      mistakeTypes: ["correctness_ignored_for_complexity"],
      nextAction:
        "Verify the monotonic relationship required by the window before accepting its runtime advantage.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-008",
    learningStage: "foundations",
    primarySkillAtomId: "prioritize_correctness_before_complexity",
    secondarySkillAtomIds: [
      "validate_window_monotonicity",
      "derive_amortized_window_complexity",
    ],
    type: "solution_comparison",
    prompt: `A candidate uses a variable sliding window to find a contiguous segment whose sum satisfies a threshold. The input may contain arbitrary positive and negative values.

Both boundaries move only forward, so the candidate correctly derives O(n) time. How should the solution be reviewed?`,
    options: [
      {
        id: "reject_invalid_window_rule",
        text: "Reject it unless the movement rule is separately proven correct; negative values can break the monotonic relationship required for safe shrinking or expansion.",
        isCorrect: true,
      },
      {
        id: "accept_linear",
        text: "Accept it because an O(n) implementation is preferable to any slower correct implementation.",
        isCorrect: false,
      },
      {
        id: "reject_as_quadratic",
        text: "Reject it because a variable-size window with a nested while loop is necessarily O(n²).",
        isCorrect: false,
      },
      {
        id: "accept_two_boundaries",
        text: "Accept it because forward-only pointer movement proves both correctness and linear complexity.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    feedbackModel: {
      decisionSignal:
        "One solution has a better asymptotic claim but applies a pattern whose movement rule does not match the problem structure.",
      mentalModelCorrection:
        "A faster invalid algorithm is not a better solution. First verify that each algorithm is legal for the problem, then compare its full cost.",
      mistakeTypes: ["invalid_asymptotic_comparison"],
      nextAction:
        "Evaluate correctness constraints before ranking solutions by Big-O.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-009",
    learningStage: "foundations",
    primarySkillAtomId: "prioritize_correctness_before_complexity",
    secondarySkillAtomIds: [
      "choose_two_pointers_or_sliding_window",
      "account_for_sorting_preprocessing",
    ],
    type: "solution_comparison",
    prompt: `Two solutions are proposed for determining whether an unsorted array contains two distinct values whose sum equals a target:

Solution A sorts the array and performs an inward two-pointer scan.

Solution B keeps a contiguous sliding window over the original array, expanding when its sum is too small and shrinking when its sum is too large.

Which comparison is correct for arbitrary integer arrays?`,
    options: [
      {
        id: "a_correct_b_invalid",
        text: "Solution A is a valid O(n log n) approach. Solution B's O(n) movement bound does not make it correct because pair selection is not represented by a contiguous window and arbitrary integers break the proposed movement rule.",
        isCorrect: true,
      },
      {
        id: "b_better_linear",
        text: "Solution B is better because O(n) is asymptotically faster than Solution A's O(n log n).",
        isCorrect: false,
      },
      {
        id: "both_linear",
        text: "Both solutions are O(n) because both ultimately move two boundaries through the array.",
        isCorrect: false,
      },
      {
        id: "a_invalid_sorting",
        text: "Solution A is invalid because sorting prevents two pointers from finding values that appeared at different original indexes.",
        isCorrect: false,
      },
    ],
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "implementation-dependent",
    expectedTimeComplexity: "O(n²)",
    complexityExplanation:
      "Sorting costs O(n log n). The outer loop runs O(n) times, and each iteration performs an O(n) inward two-pointer scan. The O(n²) search phase dominates the sorting cost.",
    feedbackModel: {
      decisionSignal:
        "The pointer scan is linear for one fixed outer-loop choice, but the entire scan is repeated for O(n) different choices.",
      mentalModelCorrection:
        "A two-pointer subroutine can be O(n) without making the complete algorithm O(n). Include the number of times that subroutine is invoked.",
      mistakeTypes: ["subroutine_cost_scope_mismatch"],
      nextAction:
        "Multiply a subroutine's cost by the number of independent invocations before simplifying the total complexity.",
      result: "diagnostic",
    },
    id: "alg-contrast-two-pointers-window-complexity-010",
    learningStage: "foundations",
    primarySkillAtomId: "derive_composed_two_pointer_complexity",
    secondarySkillAtomIds: [
      "account_for_sorting_preprocessing",
      "distinguish_phase_from_total_complexity",
    ],
    type: "complexity_check",
    prompt: `A solution first sorts an array. It then fixes one element with an outer loop and runs a complete inward two-pointer scan over the remaining suffix for each fixed element.

What is the total worst-case time complexity?`,
    options: [
      {
        id: "quadratic",
        text: "O(n²), because an O(n) two-pointer scan is repeated O(n) times; this dominates the O(n log n) sort.",
        isCorrect: true,
      },
      {
        id: "linear",
        text: "O(n), because every individual two-pointer scan is linear.",
        isCorrect: false,
      },
      {
        id: "nlogn",
        text: "O(n log n), because sorting is always the dominant operation in a two-pointer solution.",
        isCorrect: false,
      },
      {
        id: "cubic",
        text: "O(n³), because the outer loop and the two pointer variables represent three nested dimensions.",
        isCorrect: false,
      },
    ],
  },
];
