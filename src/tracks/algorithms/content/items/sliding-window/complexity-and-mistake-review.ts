export const complexityAndMistakeReviewQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "right advances at most n times and left also advances at most n times across the complete execution. The movements add to O(n), even though left may advance inside a nested while loop.",
    id: "alg-sliding-window-complexity-review-001",
    learningStage: "foundations",
    primarySkillAtomId: "derive_amortized_window_boundary_complexity",
    secondarySkillAtomIds: [
      "bound_total_left_movement",
      "bound_total_right_movement",
    ],
    type: "complexity_check",
    prompt: `A variable-size sliding window uses:

let left = 0;

for (let right = 0; right < values.length; right++) {
  add(values[right]);

  while (!isValid()) {
    remove(values[left]);
    left++;
  }
}

Both boundaries move only to the right. What is the boundary-movement complexity?`,
    options: [
      {
        id: "linear_amortized",
        text: "O(n), because each boundary crosses each position at most once.",
        isCorrect: true,
      },
      {
        id: "quadratic_nested",
        text: "O(n²), because the while loop is nested inside the for loop.",
        isCorrect: false,
      },
      {
        id: "logarithmic_shrinking",
        text: "O(log n), because the window sometimes becomes smaller.",
        isCorrect: false,
      },
      {
        id: "constant_two_boundaries",
        text: "O(1), because only left and right are stored.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Neither boundary resets or moves backward, so its total movement is globally bounded.",
      mentalModelCorrection:
        "Nested syntax does not imply multiplied complexity when the inner loop consumes movement that cannot be repeated later.",
      mistakeTypes: ["sliding_window_nested_loop_claimed_quadratic"],
      nextAction:
        "Count total boundary advances across the whole execution rather than per outer iteration.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-sliding-window-complexity-review-002",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_false_quadratic_window_claim",
    secondarySkillAtomIds: [
      "distinguish_amortized_from_nested_work",
      "review_monotonic_boundary_movement",
    ],
    type: "mistake_review",
    prompt: `A reviewer says:

"The shrinking loop may execute O(n) times for every right position, so the sliding-window scan is O(n²)."

However, left never decreases or resets. What is the best correction?`,
    options: [
      {
        id: "left_moves_n_total",
        text: "The shrinking loop may run many times in one iteration, but left advances at most n times in total, so all shrink operations together are O(n).",
        isCorrect: true,
      },
      {
        id: "nested_loops_never_quadratic",
        text: "Nested loops can never produce O(n²) time.",
        isCorrect: false,
      },
      {
        id: "right_movement_is_free",
        text: "The scan is O(n) because right-pointer movement has no cost.",
        isCorrect: false,
      },
      {
        id: "while_runs_constant_each_time",
        text: "The shrinking loop is O(1) on every outer iteration.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The same left-pointer advance cannot be charged to multiple outer iterations.",
      mentalModelCorrection:
        "A loop may be linear in one iteration while still contributing only linear aggregate work.",
      mistakeTypes: ["window_shrink_cost_multiplied_by_outer_loop"],
      nextAction:
        "Charge each left increment to the array position permanently removed from the window.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n²)",
    complexityExplanation:
      "Resetting left to zero allows previously traversed positions to be scanned again. If this happens for O(n) right positions, the total number of left movements can become O(n²).",
    id: "alg-sliding-window-complexity-review-003",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_backward_or_reset_window_boundary",
    secondarySkillAtomIds: [
      "identify_repeated_window_rescanning",
      "require_monotonic_boundary_progress",
    ],
    type: "complexity_check",
    prompt: `A purported sliding-window algorithm does this after each right increment:

left = 0;

while (left < right && !isValid(left, right)) {
  left++;
}

What is the worst-case time complexity of the repeated boundary scans?`,
    options: [
      {
        id: "quadratic_rescanning",
        text: "O(n²), because left may rescan a linear prefix for each right position.",
        isCorrect: true,
      },
      {
        id: "linear_two_boundaries",
        text: "O(n), because the code uses left and right.",
        isCorrect: false,
      },
      {
        id: "logarithmic_reset",
        text: "O(log n), because left repeatedly starts from the smallest index.",
        isCorrect: false,
      },
      {
        id: "constant_reset",
        text: "O(1), because assigning left = 0 is constant time.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Previously discarded positions become candidates again after every reset.",
      mentalModelCorrection:
        "The amortized linear proof requires globally monotonic boundaries, not merely forward movement inside one iteration.",
      mistakeTypes: ["window_boundary_reset_hidden_quadratic"],
      nextAction:
        "Check whether any boundary can revisit an index after it has already passed it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity:
      "O(d), where d is the number of distinct values in the current window",
    expectedTimeComplexity: "O(n) expected",
    complexityExplanation:
      "With expected O(1) Map updates, monotonic boundary movement gives O(n) expected time. The frequency Map stores one entry per distinct value currently represented, so its space is O(d), not O(1).",
    id: "alg-sliding-window-complexity-review-004",
    learningStage: "foundations",
    primarySkillAtomId: "account_for_window_frequency_state_space",
    secondarySkillAtomIds: [
      "distinguish_pointer_space_from_state_space",
      "derive_distinct_key_memory",
    ],
    type: "complexity_check",
    prompt: `A sliding window maintains a Map from each distinct value in the current window to its frequency.

Assume zero-frequency entries are deleted. Which complexity statement is precise?`,
    options: [
      {
        id: "linear_expected_d_space",
        text: "O(n) expected time and O(d) auxiliary space, where d is the maximum number of distinct values simultaneously in the window.",
        isCorrect: true,
      },
      {
        id: "linear_constant_space",
        text: "O(n) time and O(1) space because only two boundaries are used.",
        isCorrect: false,
      },
      {
        id: "quadratic_map",
        text: "O(n²) time because the Map may contain multiple keys.",
        isCorrect: false,
      },
      {
        id: "linear_n_space_always",
        text: "O(n) time and exactly O(n) space for every input.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The boundary variables are constant-sized, but the maintained frequency state can grow with window diversity.",
      mentalModelCorrection:
        "Auxiliary-space analysis must include all dynamic state, not only pointer variables.",
      mistakeTypes: ["window_map_memory_omitted"],
      nextAction:
        "Identify the maximum number of keys that can coexist in the maintained state.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(k)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "Each index is inserted into the monotonic deque once and removed at most once from the front or back. Total deque operations are therefore O(n), while the deque may hold up to k candidate indexes for a width-k window.",
    id: "alg-sliding-window-complexity-review-005",
    learningStage: "foundations",
    primarySkillAtomId: "derive_monotonic_deque_window_complexity",
    secondarySkillAtomIds: [
      "amortize_deque_insertions_and_removals",
      "bound_deque_window_memory",
    ],
    type: "complexity_check",
    prompt:
      "A width-k sliding-window maximum uses a monotonic deque of candidate indexes. What are its standard time and auxiliary-space bounds?",
    options: [
      {
        id: "linear_k_space",
        text: "O(n) time and O(k) auxiliary space.",
        isCorrect: true,
      },
      {
        id: "quadratic_k_space",
        text: "O(n²) time and O(k) space because one insertion may remove several deque entries.",
        isCorrect: false,
      },
      {
        id: "linear_constant_space",
        text: "O(n) time and O(1) space because the deque stores only indexes.",
        isCorrect: false,
      },
      {
        id: "n_log_k",
        text: "O(n log k) time because every deque operation performs a binary search.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "An index removed from the deque never returns, so repeated back removals share one global linear bound.",
      mentalModelCorrection:
        "A deque can provide amortized O(1) updates while still using memory proportional to the window width.",
      mistakeTypes: [
        "monotonic_deque_removals_claimed_quadratic",
        "deque_memory_claimed_constant",
      ],
      nextAction:
        "Count how many times one source index can enter and leave the deque.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-sliding-window-complexity-review-006",
    learningStage: "foundations",
    primarySkillAtomId: "evict_expired_deque_indexes",
    secondarySkillAtomIds: [
      "maintain_deque_window_membership",
      "diagnose_stale_window_maximum",
    ],
    type: "mistake_review",
    prompt: `A sliding-window maximum keeps candidate indexes in decreasing value order but never removes:

deque[0] < left

What can happen?`,
    options: [
      {
        id: "expired_index_reported",
        text: "The deque front may refer to an element outside the current window, causing a stale maximum to be reported.",
        isCorrect: true,
      },
      {
        id: "only_space_changes",
        text: "Only memory usage changes; the reported maximum remains correct.",
        isCorrect: false,
      },
      {
        id: "deque_becomes_sorted_ascending",
        text: "The deque automatically changes to ascending value order.",
        isCorrect: false,
      },
      {
        id: "right_moves_backward",
        text: "Failing to evict the front forces right to move backward.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The deque invariant requires every stored index to belong to the active window.",
      mentalModelCorrection:
        "Value monotonicity alone is insufficient; candidate indexes must also satisfy current boundary membership.",
      mistakeTypes: ["expired_deque_index_kept_as_window_candidate"],
      nextAction:
        "Evict front indexes that are smaller than left before reading the window result.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-sliding-window-complexity-review-007",
    learningStage: "foundations",
    primarySkillAtomId: "maintain_frequency_state_during_window_shrink",
    secondarySkillAtomIds: [
      "remove_outgoing_element_effect",
      "diagnose_stale_frequency_invariant",
    ],
    type: "mistake_review",
    prompt: `A window tracks character frequencies. When shrinking, the implementation does:

left++;

but does not decrement the frequency of the character that left the window.

What invariant fails?`,
    options: [
      {
        id: "state_no_longer_matches_window",
        text: "The frequency state no longer describes exactly the elements in the active interval.",
        isCorrect: true,
      },
      {
        id: "window_becomes_unsorted",
        text: "The active interval is no longer sorted.",
        isCorrect: false,
      },
      {
        id: "right_becomes_invalid",
        text: "right immediately becomes an out-of-range index.",
        isCorrect: false,
      },
      {
        id: "only_output_cost_changes",
        text: "The algorithm remains correct; only result-materialization cost changes.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The outgoing value remains represented in state after its index is excluded by left.",
      mentalModelCorrection:
        "Every boundary movement must be paired with the corresponding incremental state update.",
      mistakeTypes: ["window_frequency_state_not_updated_on_shrink"],
      nextAction:
        "Remove the outgoing element's contribution before or while advancing left.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(L) output space",
    expectedTimeComplexity: "O(n + L)",
    complexityExplanation:
      "The boundary scan contributes O(n) work. If the algorithm copies result windows whose total copied length is L, construction requires Θ(L) additional time and output storage.",
    id: "alg-sliding-window-complexity-review-008",
    learningStage: "foundations",
    primarySkillAtomId: "include_materialized_window_output_cost",
    secondarySkillAtomIds: [
      "distinguish_boundary_detection_from_copying",
      "derive_output_sensitive_window_complexity",
    ],
    type: "complexity_check",
    prompt: `A monotonic sliding-window scan is O(n), but every reported result executes:

results.push(values.slice(left, right + 1));

Let L be the sum of the lengths of all copied windows. What is the complete output-sensitive complexity?`,
    options: [
      {
        id: "n_plus_l_time_l_space",
        text: "O(n + L) time and O(L) output space.",
        isCorrect: true,
      },
      {
        id: "linear_constant",
        text: "O(n) time and O(1) space regardless of the copied windows.",
        isCorrect: false,
      },
      {
        id: "n_times_l",
        text: "O(nL) time because scan and output costs must be multiplied.",
        isCorrect: false,
      },
      {
        id: "l_only",
        text: "O(L) time because boundary movement has no cost.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each copied element contributes real construction and storage work.",
      mentalModelCorrection:
        "A linear boundary scan does not imply linear total work when large windows are repeatedly materialized.",
      mistakeTypes: ["window_output_copying_cost_hidden"],
      nextAction:
        "Separate candidate detection cost from the total size of materialized results.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    expectedSpaceComplexity: "O(r) output space",
    expectedTimeComplexity: "O(n + r)",
    complexityExplanation:
      "Monotonic boundary movement costs O(n), and producing r constant-size boundary records costs Θ(r). Unlike copying full windows, each output record has constant size.",
    id: "alg-sliding-window-complexity-review-009",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_window_boundaries_from_window_copies",
    secondarySkillAtomIds: [
      "account_for_constant_size_window_outputs",
      "compare_output_representations",
    ],
    type: "solution_comparison",
    prompt: `Compare two result contracts for the same sliding-window scan:

A. Return r pairs of boundaries [left, right].
B. Return copies of all r window contents with total copied length L.

Which statement is correct?`,
    options: [
      {
        id: "boundaries_r_copies_l",
        text: "A requires O(n + r) time and O(r) output space; B requires O(n + L) time and O(L) output space.",
        isCorrect: true,
      },
      {
        id: "both_n_constant",
        text: "Both require O(n) time and O(1) space because the scan is linear.",
        isCorrect: false,
      },
      {
        id: "boundaries_more_expensive",
        text: "Boundary pairs necessarily cost more than copying the corresponding windows.",
        isCorrect: false,
      },
      {
        id: "both_n_times_r",
        text: "Both require O(nr) time because r results are returned.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Boundary records have constant size, while copied windows may contain many elements.",
      mentalModelCorrection:
        "Output representation can change total complexity even when the search mechanics are identical.",
      mistakeTypes: ["window_output_representation_costs_conflated"],
      nextAction:
        "Define the size of one emitted result before deriving output cost.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-sliding-window-complexity-review-010",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_window_state_boundary_invariant",
    secondarySkillAtomIds: [
      "order_boundary_and_state_updates",
      "diagnose_stale_window_validity_check",
    ],
    type: "mistake_review",
    prompt: `A fixed-width window should evaluate exactly k elements. The code does:

add(values[right]);

if (right - left + 1 > k) {
  left++;
}

recordResultFromState();

The outgoing values[left] contribution is never removed before left advances. What is the best review?`,
    options: [
      {
        id: "state_contains_expired_element",
        text: "The boundaries describe a width-k window, but the maintained state still includes the expired element, so the result is computed from a stale invariant.",
        isCorrect: true,
      },
      {
        id: "window_is_k_plus_one",
        text: "The result is correct because the state should always represent k + 1 elements.",
        isCorrect: false,
      },
      {
        id: "left_should_move_backward",
        text: "The correction is to decrement left after recording.",
        isCorrect: false,
      },
      {
        id: "state_updates_are_optional",
        text: "Incremental state does not need to match the active boundaries exactly.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The logical interval and the stored aggregate describe different sets of elements.",
      mentalModelCorrection:
        "A sliding-window invariant must keep boundaries and incremental state synchronized before validity or output is evaluated.",
      mistakeTypes: ["window_boundaries_and_state_out_of_sync"],
      nextAction:
        "Remove the outgoing element's contribution, advance left, then evaluate state for the resulting window.",
      result: "diagnostic",
    },
  },
];
