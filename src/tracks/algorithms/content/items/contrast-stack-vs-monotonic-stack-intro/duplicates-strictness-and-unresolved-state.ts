import { canonicalizeContrastQuestions } from "./canonicalize-contrast-questions";

const rawduplicatesStrictnessAndUnresolvedStateQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-duplicates-001",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_strict_and_non_strict_next_greater",
    secondarySkillAtomIds: [
      "monotonic_stack_pop_condition",
      "duplicate_value_handling",
    ],
    type: "single_choice",
    prompt:
      "The task asks for the next strictly greater value to the right. The current value equals the value represented by the stack top. Should the current value resolve that stack entry?",
    options: [
      {
        id: "no_equal_not_greater",
        text: "No. Equality does not satisfy a strictly-greater contract.",
      },
      {
        id: "yes_equal_counts",
        text: "Yes. Any value that is not smaller counts as strictly greater.",
      },
      {
        id: "yes_if_nearer",
        text: "Yes, but only when the equal value is the nearest occurrence.",
      },
      {
        id: "depends_on_index",
        text: "Yes, whenever the current index is larger than the stack-top index.",
      },
    ],
    correctOptionId: "no_equal_not_greater",
    feedbackModel: {
      decisionSignal:
        "The output contract requires a value greater than the unresolved value, not greater than or equal to it.",
      mentalModelCorrection:
        "Nearest position does not override the comparison contract. An equal value cannot resolve a strictly-greater query.",
      mistakeTypes: ["strictness_mismatch"],
      nextAction:
        "Translate the output phrase directly into the comparison used by the pop condition.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-duplicates-002",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_greater_or_equal_resolution",
    secondarySkillAtomIds: ["equality_resolution", "monotonic_stack_contract"],
    type: "single_choice",
    prompt:
      "The task asks for the next value to the right that is greater than or equal to the current value. The stack top represents value 7, and the current value is also 7. What should happen?",
    options: [
      {
        id: "resolve_with_equal",
        text: "The current index resolves the stack-top entry because equality satisfies the contract.",
      },
      {
        id: "keep_waiting",
        text: "The stack-top entry must remain unresolved until a value strictly greater than 7 appears.",
      },
      {
        id: "discard_both",
        text: "Both equal values should be removed without producing an answer.",
      },
      {
        id: "replace_answer_with_zero",
        text: "The earlier value should receive 0 because equal values are ambiguous.",
      },
    ],
    correctOptionId: "resolve_with_equal",
    feedbackModel: {
      decisionSignal: "The contract explicitly includes equality.",
      mentalModelCorrection:
        "A memorized strict comparison would skip a valid nearest answer. The inequality must follow the exact query.",
      mistakeTypes: ["equality_contract_mismatch"],
      nextAction:
        "Write the qualifying relation before choosing whether equal values pop.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-duplicates-003",
    learningStage: "foundations",
    primarySkillAtomId: "select_next_smaller_pop_condition",
    secondarySkillAtomIds: [
      "strict_smaller_query",
      "monotonic_stack_direction",
    ],
    type: "single_choice",
    prompt:
      "For a next strictly smaller element task, when should the current value resolve an unresolved stack-top value?",
    options: [
      {
        id: "current_less_than_top",
        text: "When currentValue < stackTopValue.",
      },
      {
        id: "current_less_or_equal_top",
        text: "When currentValue <= stackTopValue.",
      },
      {
        id: "current_greater_than_top",
        text: "When currentValue > stackTopValue.",
      },
      {
        id: "current_not_equal_top",
        text: "Whenever currentValue != stackTopValue.",
      },
    ],
    correctOptionId: "current_less_than_top",
    feedbackModel: {
      decisionSignal:
        "The current value must satisfy the unresolved entry's strictly-smaller requirement.",
      mentalModelCorrection:
        "Equality does not satisfy a strict query. The pop condition must represent the requested relation, not only the stack's visual order.",
      mistakeTypes: ["pop_condition_mismatch"],
      nextAction:
        "Read the comparison from the perspective of the unresolved stack entry.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-duplicates-004",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_nearest_valid_occurrence",
    secondarySkillAtomIds: [
      "duplicate_plateau_reasoning",
      "nearest_answer_contract",
    ],
    type: "single_choice",
    prompt:
      "The task asks for the nearest next greater-or-equal element. Values contain a plateau [5, 5, 5]. Why should an earlier 5 be resolved by the immediately following 5 instead of waiting for a later value?",
    options: [
      {
        id: "nearest_equal_qualifies",
        text: "Equality qualifies, and the first qualifying index is the nearest valid answer.",
      },
      {
        id: "later_value_always_better",
        text: "Later values are always preferred because they provide more context.",
      },
      {
        id: "duplicates_have_no_answer",
        text: "Equal values can never resolve one another in a monotonic-stack task.",
      },
      {
        id: "all_duplicates_share_last",
        text: "Every duplicate must be resolved by the last equal value in the plateau.",
      },
    ],
    correctOptionId: "nearest_equal_qualifies",
    feedbackModel: {
      decisionSignal:
        "The contract combines a non-strict comparison with nearest-position semantics.",
      mentalModelCorrection:
        "Once the first qualifying value appears, waiting longer would violate the nearest-answer requirement.",
      mistakeTypes: ["nearest_occurrence_mismatch"],
      nextAction:
        "Check both dimensions of the contract: value relation and positional priority.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-duplicates-005",
    learningStage: "foundations",
    primarySkillAtomId: "keep_equal_values_for_strict_query",
    secondarySkillAtomIds: [
      "strict_greater_duplicates",
      "unresolved_candidate_preservation",
    ],
    type: "solution_comparison",
    prompt:
      "For next strictly greater values, a solution pops stack entries while currentValue >= stackTopValue. What is the main duplicate-related risk?",
    options: [
      {
        id: "equal_wrongly_resolves",
        text: "An equal current value may incorrectly resolve an entry that still requires a strictly greater value.",
      },
      {
        id: "greater_values_never_pop",
        text: "A strictly greater current value will never resolve any earlier entry.",
      },
      {
        id: "stack_becomes_unsorted",
        text: "Allowing equality in the comparison makes monotonic order impossible.",
      },
      {
        id: "duplicates_force_quadratic",
        text: "Equal values automatically make the algorithm O(n²).",
      },
    ],
    correctOptionId: "equal_wrongly_resolves",
    feedbackModel: {
      decisionSignal:
        "The pop condition includes equality even though the output contract excludes it.",
      mentalModelCorrection:
        "A monotonic invariant may allow several valid inequality conventions, but only one matches the requested answer semantics.",
      mistakeTypes: ["strictness_mismatch"],
      nextAction:
        "Test the implementation on two adjacent equal values before accepting its pop rule.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-duplicates-006",
    learningStage: "foundations",
    primarySkillAtomId: "pop_equal_values_for_non_strict_query",
    secondarySkillAtomIds: [
      "greater_or_equal_duplicates",
      "nearest_resolution",
    ],
    type: "solution_comparison",
    prompt:
      "For next greater-or-equal values, a solution keeps equal values on the stack and waits only for a strictly greater value. What error can this cause?",
    options: [
      {
        id: "misses_nearest_equal",
        text: "It can skip an equal value that already satisfies the contract and is the nearest valid answer.",
      },
      {
        id: "returns_too_many_answers",
        text: "It will assign multiple answers to the same unresolved index.",
      },
      {
        id: "uses_too_little_space",
        text: "Keeping equal values reduces the stack size below the required minimum.",
      },
      {
        id: "changes_input_order",
        text: "The input array will be reordered.",
      },
    ],
    correctOptionId: "misses_nearest_equal",
    feedbackModel: {
      decisionSignal:
        "Equality qualifies and the first qualifying occurrence must be used.",
      mentalModelCorrection:
        "Keeping equal candidates unresolved is correct only for a strict comparison contract.",
      mistakeTypes: ["equality_resolution_mismatch"],
      nextAction:
        "Use a duplicate plateau to verify whether the implementation preserves the nearest qualifying position.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-duplicates-007",
    learningStage: "foundations",
    primarySkillAtomId: "assign_unresolved_default",
    secondarySkillAtomIds: ["no_qualifying_element", "sentinel_contract"],
    type: "single_choice",
    prompt:
      "The contract says to return -1 when no next greater element exists. After the scan, several indexes remain on the stack. What should happen?",
    options: [
      {
        id: "assign_minus_one",
        text: "Assign -1 to every still-unresolved index.",
      },
      {
        id: "throw_error",
        text: "Treat the remaining stack as an algorithm failure.",
      },
      {
        id: "assign_zero",
        text: "Assign 0 because it is the default numeric value.",
      },
      {
        id: "reuse_last_value",
        text: "Assign the final array value to every unresolved index.",
      },
    ],
    correctOptionId: "assign_minus_one",
    feedbackModel: {
      decisionSignal:
        "Remaining entries represent elements for which no qualifying future value appeared.",
      mentalModelCorrection:
        "Unresolved state at the end is often an expected outcome defined by the output contract, not evidence that the algorithm failed.",
      mistakeTypes: ["unresolved_state_mishandling"],
      nextAction:
        "Initialize or finalize answers using the exact sentinel specified by the problem.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-duplicates-008",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_contract_specific_sentinel",
    secondarySkillAtomIds: [
      "default_answer_semantics",
      "output_contract_analysis",
    ],
    type: "single_choice",
    prompt:
      "A task specifies null when no previous smaller value exists. A developer initializes every answer to 0. Why is this unsafe?",
    options: [
      {
        id: "zero_may_be_valid_value",
        text: "Zero may be a legitimate smaller value, and it does not match the specified sentinel contract.",
      },
      {
        id: "null_is_faster",
        text: "Returning null improves the algorithm's asymptotic complexity.",
      },
      {
        id: "zero_breaks_stack_order",
        text: "Initializing answers to zero changes the stack's monotonic order.",
      },
      {
        id: "numbers_cannot_use_zero",
        text: "Monotonic-stack outputs may never contain zero.",
      },
    ],
    correctOptionId: "zero_may_be_valid_value",
    feedbackModel: {
      decisionSignal:
        "The sentinel must be distinguishable from valid answers and must match the declared API contract.",
      mentalModelCorrection:
        "A convenient language default is not automatically a correct problem default.",
      mistakeTypes: ["sentinel_contract_mismatch"],
      nextAction:
        "Verify that the chosen fallback cannot be confused with a legitimate result.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-duplicates-009",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_duplicate_plateaus",
    secondarySkillAtomIds: ["strict_next_greater", "duplicate_stack_entries"],
    type: "single_choice",
    prompt:
      "For values [4, 4, 6], the task asks for the next strictly greater value. What should be returned for the two 4s?",
    options: [
      {
        id: "six_for_both",
        text: "Both should receive 6.",
      },
      {
        id: "second_four_then_six",
        text: "The first should receive 4, and the second should receive 6.",
      },
      {
        id: "minus_one_for_first",
        text: "The first should receive -1 because an equal value appears before 6.",
      },
      {
        id: "four_for_both",
        text: "Both should receive 4 because equality is sufficient.",
      },
    ],
    correctOptionId: "six_for_both",
    feedbackModel: {
      decisionSignal:
        "Equal values do not resolve a strict query, so both remain unresolved until 6 appears.",
      mentalModelCorrection:
        "Duplicate entries may coexist on the stack when the comparison is strict, and one later value can resolve all of them.",
      mistakeTypes: ["duplicate_plateau_misread"],
      nextAction:
        "Trace whether equality resolves, preserves, or removes each unresolved entry.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-duplicates-010",
    learningStage: "foundations",
    primarySkillAtomId: "reject_invented_flush_value",
    secondarySkillAtomIds: ["end_of_scan_resolution", "comparison_semantics"],
    type: "solution_comparison",
    prompt:
      "At the end of a next-greater scan, a developer appends an artificial value Infinity so that every remaining stack entry is popped. What is the main semantic risk?",
    options: [
      {
        id: "invented_answer",
        text: "Infinity may be treated as a real qualifying next value even though no such input element exists.",
      },
      {
        id: "stack_cannot_pop_all",
        text: "A monotonic stack may never be emptied at the end.",
      },
      {
        id: "infinity_is_too_slow",
        text: "Comparing against Infinity changes each pop to O(log n).",
      },
      {
        id: "duplicates_disappear",
        text: "Appending Infinity removes duplicate values from the original array.",
      },
    ],
    correctOptionId: "invented_answer",
    feedbackModel: {
      decisionSignal:
        "The output must refer to actual qualifying elements or the specified no-answer sentinel.",
      mentalModelCorrection:
        "A synthetic flush value is unsafe unless the algorithm explicitly prevents it from becoming an output and preserves the original comparison semantics.",
      mistakeTypes: ["invented_sentinel_semantics"],
      nextAction:
        "Separate stack cleanup from assigning answers based on real input positions.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-duplicates-011",
    learningStage: "foundations",
    primarySkillAtomId: "select_equality_policy_from_contract",
    secondarySkillAtomIds: [
      "comparison_contract_reasoning",
      "monotonic_stack_invariant",
    ],
    type: "solution_comparison",
    prompt:
      "Two implementations differ only in their pop condition: one uses current > top, and the other uses current >= top. Which review is most accurate?",
    options: [
      {
        id: "contract_determines_choice",
        text: "Either may be correct depending on whether the task asks for a strict or non-strict qualifying value and how duplicates must be resolved.",
      },
      {
        id: "greater_always_correct",
        text: "current > top is always correct because strict stacks are safer.",
      },
      {
        id: "greater_equal_always_correct",
        text: "current >= top is always correct because it removes more entries.",
      },
      {
        id: "same_behavior",
        text: "The conditions are equivalent whenever the input contains integers.",
      },
    ],
    correctOptionId: "contract_determines_choice",
    feedbackModel: {
      decisionSignal:
        "Equality policy is part of the output semantics, not a universal stack convention.",
      mentalModelCorrection:
        "The maintained monotonic order and the answer relation must be designed together.",
      mistakeTypes: ["memorized_inequality"],
      nextAction:
        "Write the exact qualifier—greater, greater-or-equal, smaller, or smaller-or-equal—before reviewing the condition.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-duplicates-012",
    learningStage: "foundations",
    primarySkillAtomId: "justify_duplicate_and_unresolved_policy",
    secondarySkillAtomIds: [
      "strictness_reasoning",
      "unresolved_default_handling",
    ],
    type: "solution_comparison",
    prompt:
      "Which explanation best describes correct handling of duplicates and unresolved entries in an introductory monotonic-stack task?",
    options: [
      {
        id: "complete_policy",
        text: "Derive whether equal values qualify from the output contract, preserve the nearest valid occurrence, and assign the specified sentinel to entries that never encounter a qualifying value.",
      },
      {
        id: "always_pop_equals",
        text: "Always pop equal values because duplicate stack entries are invalid.",
      },
      {
        id: "always_keep_equals",
        text: "Always keep equal values because equality can never answer a monotonic-stack query.",
      },
      {
        id: "unresolved_is_error",
        text: "Any remaining stack entry proves the algorithm failed and should throw an exception.",
      },
    ],
    correctOptionId: "complete_policy",
    feedbackModel: {
      decisionSignal:
        "Correctness depends on comparison strictness, positional semantics, and the declared no-answer result.",
      mentalModelCorrection:
        "There is no universal duplicate policy. Equality and finalization must both be derived from the exact task contract.",
      mistakeTypes: ["weak_duplicate_policy_justification"],
      nextAction:
        "State the qualifying comparison, nearest-answer rule, and unresolved sentinel explicitly.",
      result: "diagnostic",
    },
  },
];

export const duplicatesStrictnessAndUnresolvedStateQuestions = canonicalizeContrastQuestions(rawduplicatesStrictnessAndUnresolvedStateQuestions, "monotonic_stack", "next_greater_element");
