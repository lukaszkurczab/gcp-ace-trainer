export const partitioningAndBoundaryPlacementQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-partition-boundary-placement-001",
    learningStage: "foundations",
    primarySkillAtomId: "interpret_partition_regions",
    secondarySkillAtomIds: [
      "identify_accepted_prefix",
      "identify_unprocessed_suffix",
    ],
    type: "invariant_identification",
    prompt: `An accepted-prefix compaction uses:

- read to inspect each value,
- write to mark the next position for an accepted value.

Before processing values[read], what do the regions represent?`,
    options: [
      {
        id: "accepted_prefix_then_unclassified_gap",
        text: "[0, write) contains accepted values, [write, read) contains processed values not placed in the accepted prefix, and [read, n) is unprocessed.",
        isCorrect: true,
      },
      {
        id: "active_window",
        text: "[write, read] is one active candidate window whose complete contents determine validity.",
        isCorrect: false,
      },
      {
        id: "accepted_suffix",
        text: "[read, n) contains accepted values, while [0, write) is unprocessed.",
        isCorrect: false,
      },
      {
        id: "all_processed",
        text: "Every position in the array has already been classified.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "write describes produced accepted output, while read separates processed input from unprocessed input.",
      mentalModelCorrection:
        "Partition pointers define semantic regions rather than merely two moving indexes.",
      mistakeTypes: ["partition_regions_misidentified"],
      nextAction:
        "Name the meaning of every interval before reasoning about pointer updates.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-partition-boundary-placement-002",
    learningStage: "foundations",
    primarySkillAtomId: "place_accepted_value_at_partition_boundary",
    secondarySkillAtomIds: [
      "advance_write_after_acceptance",
      "maintain_accepted_prefix",
    ],
    type: "subgoal_ordering",
    prompt: `An accepted-prefix compaction moves values satisfying predicate into the prefix while preserving their encounter order.

When values[read] is accepted, which operation order is correct?`,
    options: [
      {
        id: "write_then_advance",
        text: "Copy the accepted value into position write, then increment write.",
        isCorrect: true,
      },
      {
        id: "advance_then_write",
        text: "Increment write first and place the accepted value at the new position.",
        isCorrect: false,
      },
      {
        id: "advance_read_only",
        text: "Advance read without changing write because acceptance does not affect the prefix.",
        isCorrect: false,
      },
      {
        id: "reset_write",
        text: "Reset write to zero whenever an accepted value is found.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "write identifies the next free position in the accepted prefix.",
      mentalModelCorrection:
        "The accepted value fills the current boundary slot before that boundary advances.",
      mistakeTypes: ["partition_write_boundary_advanced_too_early"],
      nextAction:
        "Treat write as the destination to fill, not the last position already filled.",
      result: "diagnostic",
    },
  },


  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-005",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_stable_and_unstable_partition",
    secondarySkillAtomIds: [
      "analyze_partition_stability_contract",
      "review_swap_based_partition",
    ],
    type: "solution_comparison",
    prompt: `Compare two contracts:

A. Produce a stable accepted prefix; the suffix has no required meaning.
B. Produce a fully stable two-way partition; both accepted and rejected values must preserve relative order.

Which statement is correct?`,
    options: [
      {
        id: "prefix_compaction_not_full_stable_partition",
        text: "A left-to-right read/write compaction directly satisfies A, but it does not by itself guarantee B because rejected values may be overwritten or reordered.",
        isCorrect: true,
      },
      {
        id: "same_contract",
        text: "The two contracts are equivalent whenever two pointers are used.",
        isCorrect: false,
      },
      {
        id: "suffix_swaps_are_stable",
        text: "Arbitrary swaps with the suffix always preserve both groups' relative order.",
        isCorrect: false,
      },
      {
        id: "stability_only_affects_space",
        text: "The difference affects only auxiliary space, not observable output.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The first contract specifies only the accepted subsequence; the second specifies the order and preservation of both categories.",
      mentalModelCorrection:
        "Stable accepted-prefix compaction is weaker than a full stable partition.",
      mistakeTypes: ["accepted_prefix_stability_confused_with_full_partition_stability"],
      nextAction:
        "State whether rejected elements must remain present and preserve relative order.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-006",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_value_during_partition_swap",
    secondarySkillAtomIds: [
      "avoid_lost_partition_elements",
      "perform_safe_in_place_swap",
    ],
    type: "mistake_review",
    prompt: `A permutation-preserving partition must retain every input element exactly once across its two output regions.

The implementation attempts this swap:

values[write] = values[read];
values[read] = values[write];

when write !== read.

What is wrong?`,
    options: [
      {
        id: "original_write_value_is_lost",
        text: "The first assignment overwrites values[write], so the second assignment cannot recover its original value.",
        isCorrect: true,
      },
      {
        id: "swap_requires_equal_values",
        text: "A swap is valid only when both positions already contain equal values.",
        isCorrect: false,
      },
      {
        id: "read_must_be_smaller",
        text: "The code fails only when read is numerically smaller than write.",
        isCorrect: false,
      },
      {
        id: "two_assignments_are_enough",
        text: "The code is a complete swap because both indexes receive assignments.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The contract requires the original value at both positions to survive the swap.",
      mentalModelCorrection:
        "The first assignment destroys the original values[write], so this is not a permutation-preserving swap.",
      mistakeTypes: ["partition_swap_loses_element"],
      nextAction:
        "Use a temporary variable or a language-level swap expression.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-partition-boundary-placement-007",
    learningStage: "foundations",
    primarySkillAtomId: "return_partition_boundary",
    secondarySkillAtomIds: [
      "interpret_write_as_accepted_count",
      "distinguish_boundary_from_last_index",
    ],
    type: "output_contract_analysis",
    prompt: `A partition places all accepted values into [0, write).

The function must return the number of accepted values. What should it return?`,
    options: [
      {
        id: "write",
        text: "write, because it is both the exclusive boundary and the accepted count.",
        isCorrect: true,
      },
      {
        id: "write_minus_one",
        text: "write - 1, because it is the last accepted index even when no value was accepted.",
        isCorrect: false,
      },
      {
        id: "read",
        text: "read, because it counts all processed values.",
        isCorrect: false,
      },
      {
        id: "array_length",
        text: "The full array length because the physical array was not resized.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The half-open accepted prefix contains exactly write positions.",
      mentalModelCorrection:
        "An exclusive boundary, a count, and the last valid index are related but not interchangeable.",
      mistakeTypes: ["partition_boundary_return_mismatch"],
      nextAction: "Translate [0, write) directly into a length of write.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-008",
    learningStage: "foundations",
    primarySkillAtomId: "place_partition_predicate_on_current_item",
    secondarySkillAtomIds: [
      "classify_unprocessed_observation",
      "avoid_testing_destination_state",
    ],
    type: "mistake_review",
    prompt: `A read/write partition decides whether to advance write using:

if (predicate(values[write])) {
  write++;
}

instead of testing values[read].

Why is this incorrect?`,
    options: [
      {
        id: "tests_destination_not_observation",
        text: "write identifies an output destination, while read identifies the new source item that must be classified.",
        isCorrect: true,
      },
      {
        id: "write_values_always_rejected",
        text: "Every value at write is guaranteed to fail the predicate.",
        isCorrect: false,
      },
      {
        id: "predicate_requires_two_values",
        text: "Partition predicates must always compare values[read] and values[write].",
        isCorrect: false,
      },
      {
        id: "read_never_used",
        text: "The only issue is that read should be removed from the algorithm.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "The current unprocessed input item is located at read.",
      mentalModelCorrection:
        "The predicate classifies observations; write controls placement after classification.",
      mistakeTypes: ["partition_predicate_applied_to_wrong_pointer"],
      nextAction:
        "Evaluate the predicate on the source observation before deciding whether to write it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-009",
    learningStage: "foundations",
    primarySkillAtomId: "handle_equal_values_in_partition",
    secondarySkillAtomIds: [
      "apply_predicate_consistently",
      "distinguish_value_equality_from_category",
    ],
    type: "edge_case_drill",
    prompt: `A partition contract is:

"Place values strictly less than pivot into the prefix."

pivot = 5
values = [5, 3, 5, 2]

Which values belong in the accepted prefix?`,
    options: [
      {
        id: "three_two",
        text: "[3, 2]",
        isCorrect: true,
      },
      {
        id: "five_three_five_two",
        text: "[5, 3, 5, 2]",
        isCorrect: false,
      },
      {
        id: "five_five",
        text: "[5, 5]",
        isCorrect: false,
      },
      {
        id: "three_five_two",
        text: "[3, 5, 2]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Equality does not satisfy a strictly-less-than predicate.",
      mentalModelCorrection:
        "Values equal to the pivot need an explicit category decision; they are not automatically accepted or discarded by pointer mechanics.",
      mistakeTypes: ["partition_equality_contract_misapplied"],
      nextAction:
        "Read the predicate literally and classify pivot-equal values explicitly.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-010",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_two_way_from_three_way_partition",
    secondarySkillAtomIds: [
      "recognize_partition_category_count",
      "reject_under_modeled_equal_region",
    ],
    type: "mistake_review",
    prompt: `A two-way partition guarantees only:

- values satisfying predicate are before boundary,
- values not satisfying predicate are at or after boundary.

A reviewer claims this also produces separate < pivot, = pivot, and > pivot regions.

What is the best correction?`,
    options: [
      {
        id: "two_way_does_not_separate_false_categories",
        text: "The false side may mix values equal to and greater than the pivot, so a separate equality region is not guaranteed.",
        isCorrect: true,
      },
      {
        id: "two_way_always_three_way",
        text: "The claim is correct because every boolean predicate implicitly creates three regions.",
        isCorrect: false,
      },
      {
        id: "equal_values_disappear",
        text: "Equal values are removed automatically during two-way partitioning.",
        isCorrect: false,
      },
      {
        id: "boundary_is_equal_region",
        text: "The single returned boundary always identifies the complete equality region.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A boolean predicate defines only accepted and not-accepted categories.",
      mentalModelCorrection:
        "Two-way partitioning cannot promise three independently organized categories without additional state and movement rules.",
      mistakeTypes: ["two_way_partition_treated_as_three_way"],
      nextAction:
        "Count the semantic categories guaranteed by the predicate and invariant.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-011",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_invalid_partition_boundary_movement",
    secondarySkillAtomIds: [
      "advance_boundary_only_after_placement",
      "preserve_accepted_prefix_invariant",
    ],
    type: "mistake_review",
    prompt: `A partition increments write whenever it sees an accepted value, but sometimes skips copying or swapping that value into values[write].

What invariant can fail?`,
    options: [
      {
        id: "prefix_may_contain_rejected_value",
        text: "[0, write) may no longer contain only accepted values because the boundary advanced without filling its previous destination correctly.",
        isCorrect: true,
      },
      {
        id: "suffix_becomes_sorted",
        text: "The unprocessed suffix may become sorted accidentally.",
        isCorrect: false,
      },
      {
        id: "read_moves_backward",
        text: "read is forced to move backward.",
        isCorrect: false,
      },
      {
        id: "predicate_changes",
        text: "The predicate itself changes meaning after write advances.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The boundary claims one more accepted output position than was actually produced.",
      mentalModelCorrection:
        "Pointer movement is valid only after the region it defines has been made correct.",
      mistakeTypes: ["partition_boundary_advanced_without_placement"],
      nextAction:
        "Complete the write or swap before extending the accepted region.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-partition-boundary-placement-012",
    learningStage: "foundations",
    primarySkillAtomId: "handle_empty_partition_result",
    secondarySkillAtomIds: [
      "return_zero_boundary",
      "reason_about_partition_edge_cases",
    ],
    type: "edge_case_drill",
    prompt: `A partition accepts positive values.

values = [-3, 0, -1]

What boundary should it return if the boundary equals the accepted count?`,
    options: [
      {
        id: "zero",
        text: "0",
        isCorrect: true,
      },
      {
        id: "minus_one",
        text: "-1",
        isCorrect: false,
      },
      {
        id: "three",
        text: "3",
        isCorrect: false,
      },
      {
        id: "one",
        text: "1 because zero lies between negative and positive values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal: "No observation satisfies the accepted predicate.",
      mentalModelCorrection:
        "An empty accepted prefix is represented by the half-open range [0, 0).",
      mistakeTypes: ["empty_partition_boundary_mismatch"],
      nextAction:
        "Initialize write to zero and advance it only after accepted placement.",
      result: "diagnostic",
    },
  },


  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-partition-boundary-placement-015",
    learningStage: "foundations",
    primarySkillAtomId: "state_two_ended_partition_invariant",
    secondarySkillAtomIds: [
      "identify_classified_partition_regions",
      "identify_unclassified_partition_region",
    ],
    type: "invariant_identification",
    prompt: `A two-ended partition maintains left and right around the unclassified region.

Which invariant is precise?`,
    options: [
      {
        id: "accepted_left_rejected_right",
        text: "[0, left) contains accepted values, [right + 1, n) contains rejected values, and [left, right] is still unclassified.",
        isCorrect: true,
      },
      {
        id: "whole_array_classified",
        text: "Every position is already classified before each iteration.",
        isCorrect: false,
      },
      {
        id: "middle_is_output_window",
        text: "[left, right] is one valid output window whose interior must be preserved.",
        isCorrect: false,
      },
      {
        id: "left_and_right_are_outputs",
        text: "left and right are both next-write positions for the same output prefix.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The pointers delimit the only region whose values have not yet been assigned to a partition side.",
      mentalModelCorrection:
        "Two-ended partitioning grows classified regions from both sides.",
      mistakeTypes: ["two_ended_partition_regions_misidentified"],
      nextAction:
        "Name the guarantee on each side before moving either pointer.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-016",
    learningStage: "foundations",
    primarySkillAtomId: "swap_misplaced_partition_values",
    secondarySkillAtomIds: [
      "coordinate_partition_boundaries",
      "advance_after_partition_swap",
    ],
    type: "subgoal_ordering",
    prompt: `In a two-ended partition:

- values[left] belongs on the rejected side,
- values[right] belongs on the accepted side.

What should happen?`,
    options: [
      {
        id: "swap_then_move_both",
        text: "Swap the two values, then increment left and decrement right.",
        isCorrect: true,
      },
      {
        id: "move_both_without_swap",
        text: "Move both pointers without swapping.",
        isCorrect: false,
      },
      {
        id: "swap_keep_both",
        text: "Swap the values but leave both pointers unchanged.",
        isCorrect: false,
      },
      {
        id: "overwrite_left",
        text: "Copy values[right] into values[left] without preserving values[left].",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each misplaced value belongs in the region controlled by the opposite pointer.",
      mentalModelCorrection:
        "The swap classifies both current positions, so both boundaries may advance afterward.",
      mistakeTypes: ["partition_swap_or_boundary_update_incorrect"],
      nextAction:
        "Move a boundary only after its current position satisfies that region's predicate.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-partition-boundary-placement-017",
    learningStage: "foundations",
    primarySkillAtomId: "interpret_two_way_partition_boundary",
    secondarySkillAtomIds: [
      "return_first_rejected_position",
      "avoid_stability_overclaim",
    ],
    type: "output_contract_analysis",
    prompt: `A two-way partition terminates with boundary = left and guarantees:

- every index below boundary satisfies predicate,
- every index at or above boundary does not.

What may be returned and claimed?`,
    options: [
      {
        id: "boundary_and_membership_only",
        text: "Return boundary as the accepted count and first rejected position; relative order is not guaranteed unless stability was separately maintained.",
        isCorrect: true,
      },
      {
        id: "last_accepted_index",
        text: "Return boundary as the last accepted index.",
        isCorrect: false,
      },
      {
        id: "three_categories",
        text: "Claim that boundary also identifies separate equal and greater-than regions.",
        isCorrect: false,
      },
      {
        id: "stable_both_sides",
        text: "Claim that both sides automatically preserve original order.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The boundary is exclusive for the accepted region, while stability is a separate postcondition.",
      mentalModelCorrection:
        "A correct two-way membership partition does not automatically provide stable ordering.",
      mistakeTypes: ["partition_boundary_or_stability_overclaimed"],
      nextAction:
        "Separate boundary semantics, category membership, and ordering guarantees.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-partition-boundary-placement-018",
    learningStage: "foundations",
    primarySkillAtomId: "terminate_two_ended_partition",
    secondarySkillAtomIds: [
      "recognize_empty_unclassified_region",
      "avoid_reprocessing_partition_boundary",
    ],
    type: "single_choice",
    prompt:
      "Why may a two-ended partition stop when left > right?",
    options: [
      {
        id: "no_unclassified_positions",
        text: "Because the unclassified region [left, right] is empty.",
        isCorrect: true,
      },
      {
        id: "pointers_found_equal_values",
        text: "Because pointer crossing proves the endpoint values are equal.",
        isCorrect: false,
      },
      {
        id: "array_is_sorted",
        text: "Because every partition operation also fully sorts the array.",
        isCorrect: false,
      },
      {
        id: "one_position_remains",
        text: "Because exactly one unclassified position still remains.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Every position lies in one of the two classified outer regions.",
      mentalModelCorrection:
        "Crossing terminates partitioning because no unclassified index remains, not because values became ordered globally.",
      mistakeTypes: ["partition_crossing_termination_misread"],
      nextAction:
        "Express the unclassified region as an interval and determine when it becomes empty.",
      result: "diagnostic",
    },
  },
];
