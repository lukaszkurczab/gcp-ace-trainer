import { canonicalizeContrastQuestions } from "./canonicalize-contrast-questions";

const rawpreviousBoundaryAndAnswerOwnershipQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-previous-boundary-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_previous_boundary_lookup",
    secondarySkillAtomIds: ["nearest_previous_candidate", "left_to_right_scan"],
    type: "single_choice",
    prompt:
      "For each position, you need the nearest previous strictly greater value. During a left-to-right scan, what should the current position do after invalid stack candidates are removed?",
    options: [
      {
        id: "read_remaining_top",
        text: "Use the remaining stack top as its nearest previous qualifying position.",
      },
      {
        id: "use_last_popped",
        text: "Use the last popped position as its previous greater answer.",
      },
      {
        id: "answer_popped_entries",
        text: "Assign the current value as the previous greater answer for every popped entry.",
      },
      {
        id: "read_stack_bottom",
        text: "Use the oldest qualifying position at the bottom of the stack.",
      },
    ],
    correctOptionId: "read_remaining_top",
    feedbackModel: {
      decisionSignal:
        "The current item owns the answer, and the nearest qualifying earlier candidate is the closest one still retained at the top.",
      mentalModelCorrection:
        "Popped entries failed the current item's boundary contract. The surviving top, not a removed candidate, provides the answer.",
      mistakeTypes: ["answer_ownership_mismatch"],
      nextAction:
        "Identify whether the current item is resolving earlier candidates or querying retained earlier state for its own answer.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-previous-boundary-002",
    learningStage: "foundations",
    primarySkillAtomId: "remove_invalid_previous_boundary_candidates",
    secondarySkillAtomIds: ["previous_greater_lookup", "stack_top_validation"],
    type: "single_choice",
    prompt:
      "The task asks for the nearest previous strictly greater value. The current value is 7, and the stack top represents value 5. What should happen before reading the answer?",
    options: [
      {
        id: "pop_five",
        text: "Pop the value 5 because it cannot be the current value's previous greater boundary.",
      },
      {
        id: "use_five",
        text: "Use 5 because it is the nearest previous value.",
      },
      {
        id: "assign_seven_to_five",
        text: "Assign 7 as the previous greater answer for the earlier value 5.",
      },
      {
        id: "clear_stack",
        text: "Clear every earlier candidate regardless of its value.",
      },
    ],
    correctOptionId: "pop_five",
    feedbackModel: {
      decisionSignal:
        "A previous strictly greater boundary must have a value greater than the current value.",
      mentalModelCorrection:
        "Positional nearness matters only among candidates that satisfy the required value relation.",
      mistakeTypes: ["invalid_previous_boundary_candidate"],
      nextAction:
        "Remove candidates that fail the current item's qualifier before reading the top.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-previous-boundary-003",
    learningStage: "foundations",
    primarySkillAtomId: "read_boundary_after_restoring_invariant",
    secondarySkillAtomIds: ["pop_before_read", "previous_boundary_ordering"],
    type: "single_choice",
    prompt:
      "Why must a previous-boundary algorithm remove invalid top entries before reading the stack top as the current item's answer?",
    options: [
      {
        id: "top_may_not_qualify",
        text: "The initial top may be nearest in position but fail the required greater-or-smaller relation.",
      },
      {
        id: "pop_changes_current",
        text: "Popping changes the current input value into a qualifying value.",
      },
      {
        id: "bottom_is_always_answer",
        text: "Removing entries is required before reading the stack bottom.",
      },
      {
        id: "all_pops_are_answers",
        text: "Every popped item must be reported as the current item's boundary.",
      },
    ],
    correctOptionId: "top_may_not_qualify",
    feedbackModel: {
      decisionSignal:
        "The top is meaningful only after the stack has been filtered for the current item's contract.",
      mentalModelCorrection:
        "Reading before restoration can return a nearby but invalid boundary.",
      mistakeTypes: ["read_before_invariant_restoration"],
      nextAction:
        "Use the sequence remove invalid candidates, read surviving top, then push current.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-previous-boundary-004",
    learningStage: "foundations",
    primarySkillAtomId: "select_previous_smaller_candidate_rule",
    secondarySkillAtomIds: ["previous_smaller_lookup", "comparison_direction"],
    type: "single_choice",
    prompt:
      "For the nearest previous strictly smaller value, which stack-top candidates must be removed before reading the current item's answer?",
    options: [
      {
        id: "pop_greater_or_equal",
        text: "Pop while stackTopValue >= currentValue.",
      },
      {
        id: "pop_less_than",
        text: "Pop while stackTopValue < currentValue.",
      },
      {
        id: "pop_only_greater",
        text: "Pop only while stackTopValue > currentValue, keeping equal values as valid.",
      },
      {
        id: "pop_by_index",
        text: "Pop while stackTopIndex < currentIndex.",
      },
    ],
    correctOptionId: "pop_greater_or_equal",
    feedbackModel: {
      decisionSignal:
        "After filtering, the remaining top must be strictly smaller than the current value.",
      mentalModelCorrection:
        "Greater and equal candidates both fail a strict previous-smaller contract.",
      mistakeTypes: ["comparison_direction_mismatch"],
      nextAction:
        "Negate the required surviving relation to derive the pop condition.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-previous-boundary-005",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_previous_lookup_from_next_resolution",
    secondarySkillAtomIds: [
      "answer_ownership",
      "monotonic_stack_scan_semantics",
    ],
    type: "solution_comparison",
    prompt:
      "Which comparison correctly distinguishes a forward next-greater scan from a forward previous-greater lookup?",
    options: [
      {
        id: "popped_vs_current_owner",
        text: "In next-greater resolution, the current value assigns answers to popped earlier indexes; in previous-greater lookup, the current index reads its own answer from the surviving top.",
      },
      {
        id: "same_answer_owner",
        text: "In both tasks, every popped entry is the answer for the current index.",
      },
      {
        id: "current_always_answered",
        text: "In both tasks, the current index receives its answer before any stack mutation.",
      },
      {
        id: "top_never_used",
        text: "Neither task uses the remaining stack top after popping.",
      },
    ],
    correctOptionId: "popped_vs_current_owner",
    feedbackModel: {
      decisionSignal:
        "The same pop mechanics can support different ownership of the discovered answer.",
      mentalModelCorrection:
        "Code shape alone does not determine semantics. You must identify whether popped candidates are being resolved or merely removed from the current item's boundary search.",
      mistakeTypes: ["next_previous_semantics_confusion"],
      nextAction:
        "For every assignment, state explicitly which index owns the answer.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-previous-boundary-006",
    learningStage: "foundations",
    primarySkillAtomId: "reject_popped_candidate_as_previous_boundary",
    secondarySkillAtomIds: [
      "previous_boundary_candidate_filtering",
      "answer_ownership",
    ],
    type: "single_choice",
    prompt:
      "A previous-greater implementation pops values smaller than or equal to the current value and then assigns the last popped index as the current item's answer. What is wrong?",
    options: [
      {
        id: "popped_failed_contract",
        text: "The popped index was removed precisely because it does not qualify as a previous greater boundary.",
      },
      {
        id: "last_popped_too_old",
        text: "The last popped index is always the oldest earlier position.",
      },
      {
        id: "current_should_answer_popped",
        text: "Every previous-boundary task must assign the current value to all popped entries.",
      },
      {
        id: "stack_must_remain_full",
        text: "Previous-boundary algorithms may never pop candidates.",
      },
    ],
    correctOptionId: "popped_failed_contract",
    feedbackModel: {
      decisionSignal:
        "Popping is a rejection step for the current item's previous-boundary search.",
      mentalModelCorrection:
        "The answer comes from the nearest surviving qualifier, not from a candidate proven invalid.",
      mistakeTypes: ["popped_candidate_used_as_boundary"],
      nextAction:
        "Interpret each pop as eliminating an answer candidate for the current position.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-previous-boundary-007",
    learningStage: "foundations",
    primarySkillAtomId: "trace_previous_greater_boundary",
    secondarySkillAtomIds: [
      "previous_greater_trace",
      "nearest_boundary_selection",
    ],
    type: "single_choice",
    prompt:
      "The stack contains indexes whose values are [9, 6, 4] from bottom to top. The current value is 5. For a nearest previous strictly greater query, what happens?",
    options: [
      {
        id: "pop_four_use_six",
        text: "Pop 4, then use 6 as the current item's previous greater value.",
      },
      {
        id: "use_four",
        text: "Use 4 because it is nearest in position.",
      },
      {
        id: "pop_four_and_six_use_nine",
        text: "Pop both 4 and 6, then use 9.",
      },
      {
        id: "four_gets_five",
        text: "Assign 5 as the answer for the earlier value 4.",
      },
    ],
    correctOptionId: "pop_four_use_six",
    feedbackModel: {
      decisionSignal:
        "Four fails the greater-than relation, while six is the nearest surviving greater value.",
      mentalModelCorrection:
        "The scan removes only invalid suffix candidates and stops at the first qualifying previous boundary.",
      mistakeTypes: ["previous_boundary_trace_error"],
      nextAction:
        "Filter from the top until the nearest valid earlier candidate is exposed.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-previous-boundary-008",
    learningStage: "foundations",
    primarySkillAtomId: "trace_previous_smaller_boundary",
    secondarySkillAtomIds: [
      "previous_smaller_trace",
      "nearest_boundary_selection",
    ],
    type: "single_choice",
    prompt:
      "The stack contains values [2, 5, 8] from bottom to top. The current value is 6. For a nearest previous strictly smaller query, what is the correct result?",
    options: [
      {
        id: "pop_eight_use_five",
        text: "Pop 8 and use 5 as the nearest previous smaller value.",
      },
      {
        id: "use_eight",
        text: "Use 8 because it is the current top.",
      },
      {
        id: "pop_all_use_none",
        text: "Pop 8, 5, and 2, leaving no previous smaller value.",
      },
      {
        id: "eight_gets_six",
        text: "Assign 6 as the answer for the earlier value 8.",
      },
    ],
    correctOptionId: "pop_eight_use_five",
    feedbackModel: {
      decisionSignal:
        "Eight fails the smaller-than relation, while five is both smaller and nearer than two.",
      mentalModelCorrection:
        "The remaining top is the nearest qualifying previous position after invalid candidates are removed.",
      mistakeTypes: ["previous_boundary_trace_error"],
      nextAction:
        "Stop popping at the first earlier value that satisfies the current item's qualifier.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-previous-boundary-009",
    learningStage: "foundations",
    primarySkillAtomId: "compute_previous_boundary_distance",
    secondarySkillAtomIds: ["span_distance", "index_based_boundary"],
    type: "single_choice",
    prompt:
      "The current index is 7, and its nearest previous qualifying boundary is at index 3. What is the positional distance to that boundary?",
    options: [
      {
        id: "four",
        text: "4, computed as 7 - 3.",
      },
      {
        id: "ten",
        text: "10, computed as 7 + 3.",
      },
      {
        id: "three",
        text: "3, because the boundary index itself is the distance.",
      },
      {
        id: "depends_on_values",
        text: "The distance must be computed by subtracting the two array values.",
      },
    ],
    correctOptionId: "four",
    feedbackModel: {
      decisionSignal:
        "The requested span is defined by the positions of the current item and its previous boundary.",
      mentalModelCorrection:
        "Boundary values determine qualification, while indexes determine distance.",
      mistakeTypes: ["value_index_confusion"],
      nextAction:
        "Separate the comparison field from the output-distance field.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-previous-boundary-010",
    learningStage: "foundations",
    primarySkillAtomId: "handle_missing_previous_boundary",
    secondarySkillAtomIds: [
      "empty_stack_after_filtering",
      "previous_boundary_sentinel",
    ],
    type: "single_choice",
    prompt:
      "After removing all invalid candidates, the stack is empty. What does that mean for the current item's previous-boundary query?",
    options: [
      {
        id: "no_qualifying_previous",
        text: "No earlier position satisfies the required boundary relation, so the specified no-boundary result should be used.",
      },
      {
        id: "last_popped_is_answer",
        text: "The last removed candidate becomes the boundary.",
      },
      {
        id: "algorithm_failed",
        text: "The algorithm failed because a monotonic stack may not become empty.",
      },
      {
        id: "current_is_boundary",
        text: "The current position is its own previous boundary.",
      },
    ],
    correctOptionId: "no_qualifying_previous",
    feedbackModel: {
      decisionSignal:
        "Every retained earlier candidate was rejected by the current item's qualifier.",
      mentalModelCorrection:
        "An empty stack is a legitimate semantic result: there is no qualifying previous boundary.",
      mistakeTypes: ["missing_boundary_mishandling"],
      nextAction:
        "Map an empty filtered stack to the exact sentinel or span rule defined by the output contract.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-previous-boundary-011",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_nearest_previous_boundary",
    secondarySkillAtomIds: [
      "stack_top_nearest_property",
      "candidate_dominance",
    ],
    type: "solution_comparison",
    prompt:
      "Why does the remaining stack top represent the nearest previous qualifying position rather than merely some qualifying position?",
    options: [
      {
        id: "later_retained_candidates_on_top",
        text: "Indexes are processed left to right and pushed in order, so among surviving qualifiers the most recent position is closest to the current index and appears at the top.",
      },
      {
        id: "largest_value_on_top",
        text: "The stack top always contains the largest value in the entire processed prefix.",
      },
      {
        id: "pops_sort_indexes",
        text: "Popping sorts all indexes numerically from nearest to farthest.",
      },
      {
        id: "bottom_candidates_invalid",
        text: "Every stack entry below the top is necessarily invalid for the current item.",
      },
    ],
    correctOptionId: "later_retained_candidates_on_top",
    feedbackModel: {
      decisionSignal:
        "Insertion order preserves recency among candidates that survive the value-based filtering.",
      mentalModelCorrection:
        "Lower stack entries may also qualify, but the top is the nearest one because it was processed most recently.",
      mistakeTypes: ["nearest_boundary_justification_mismatch"],
      nextAction:
        "Combine positional insertion order with the maintained candidate-filtering invariant.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-previous-boundary-012",
    learningStage: "foundations",
    primarySkillAtomId: "validate_previous_boundary_scan_direction",
    secondarySkillAtomIds: [
      "left_to_right_previous_lookup",
      "scan_direction_contract",
    ],
    type: "solution_comparison",
    prompt:
      "A solution scans from right to left but keeps the same invariant and assignment logic designed for a left-to-right previous-greater lookup. What is the main issue?",
    options: [
      {
        id: "processed_side_changed",
        text: "The stack now represents elements to the right, so it no longer contains previous candidates unless the invariant and answer interpretation are redesigned.",
      },
      {
        id: "right_to_left_never_valid",
        text: "Monotonic stacks may never scan from right to left.",
      },
      {
        id: "complexity_becomes_quadratic",
        text: "Changing scan direction automatically changes O(n) time to O(n²).",
      },
      {
        id: "indexes_become_values",
        text: "Right-to-left scanning causes stored indexes to become numeric values.",
      },
    ],
    correctOptionId: "processed_side_changed",
    feedbackModel: {
      decisionSignal:
        "Scan direction determines whether retained processed entries lie before or after the current position.",
      mentalModelCorrection:
        "A reverse scan can be valid, but it changes previous-versus-next semantics and requires corresponding invariant and assignment changes.",
      mistakeTypes: ["scan_direction_semantics_mismatch"],
      nextAction:
        "State which side of the current index has already been processed before interpreting the stack.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-previous-boundary-013",
    learningStage: "foundations",
    primarySkillAtomId: "review_every_pop_as_current_answer_bug",
    secondarySkillAtomIds: ["candidate_filtering", "current_answer_ownership"],
    type: "solution_comparison",
    prompt:
      "A previous-smaller implementation treats every popped index as a possible answer for the current item and returns the last one popped. Why is this reasoning incorrect?",
    options: [
      {
        id: "popped_entries_are_rejected",
        text: "Popped entries fail the current item's previous-smaller requirement; only the surviving top can qualify.",
      },
      {
        id: "first_popped_is_always_answer",
        text: "The first popped entry is always the correct nearest boundary.",
      },
      {
        id: "all_popped_entries_qualify",
        text: "Every popped entry qualifies, but only one may be returned for performance reasons.",
      },
      {
        id: "current_has_no_owner",
        text: "Previous-boundary tasks do not assign any answer to the current item.",
      },
    ],
    correctOptionId: "popped_entries_are_rejected",
    feedbackModel: {
      decisionSignal:
        "The pop loop removes candidates that violate the required relation.",
      mentalModelCorrection:
        "In previous-boundary lookup, pops are filtering actions, not a sequence of potential answers for the current item.",
      mistakeTypes: ["pop_semantics_mismatch"],
      nextAction:
        "Label each stack mutation as rejection, resolution, or answer retrieval.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-previous-boundary-014",
    learningStage: "foundations",
    primarySkillAtomId: "justify_previous_boundary_strategy",
    secondarySkillAtomIds: [
      "answer_ownership_reasoning",
      "nearest_boundary_invariant",
    ],
    type: "solution_comparison",
    prompt:
      "Which explanation best describes a forward monotonic-stack algorithm for nearest previous greater or smaller boundaries?",
    options: [
      {
        id: "complete_boundary_model",
        text: "For each current position, remove earlier candidates that fail the required relation, read the remaining top as the nearest qualifying previous boundary if one exists, then push the current position for later items.",
      },
      {
        id: "popped_entries_are_answers",
        text: "Pop all conflicting entries and use the final popped entry as the current position's boundary.",
      },
      {
        id: "same_as_next_resolution",
        text: "Assign the current value as the answer for every popped entry and do not compute an answer for the current position.",
      },
      {
        id: "read_before_filtering",
        text: "Read the initial stack top as the answer, then remove invalid candidates afterward.",
      },
    ],
    correctOptionId: "complete_boundary_model",
    feedbackModel: {
      decisionSignal:
        "A complete model defines filtering order, answer ownership, nearest semantics, empty-state handling, and the current candidate's lifecycle.",
      mentalModelCorrection:
        "Previous-boundary lookup uses the surviving top for the current item's answer. Popped entries are excluded candidates, not automatically resolved outputs.",
      mistakeTypes: ["weak_previous_boundary_justification"],
      nextAction:
        "Explain the iteration as filter, read, then push, and state why the surviving top is nearest.",
      result: "diagnostic",
    },
  },
];

export const previousBoundaryAndAnswerOwnershipQuestions = canonicalizeContrastQuestions(rawpreviousBoundaryAndAnswerOwnershipQuestions, "monotonic_stack", "monotonic_invariant");
