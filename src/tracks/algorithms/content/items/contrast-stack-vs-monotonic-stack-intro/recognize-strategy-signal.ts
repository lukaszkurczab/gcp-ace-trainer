export const recognizeStackVsMonotonicStackStrategySignalQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-recognize-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_plain_stack_signal",
    secondarySkillAtomIds: ["nested_structure", "most_recent_unresolved_state"],
    type: "single_choice",
    prompt:
      "A validator must match every closing delimiter with the most recently seen unmatched opening delimiter. Which strategy best matches this contract?",
    options: [
      {
        id: "plain_stack",
        text: "Use a plain stack that retains unmatched opening delimiters in arrival order.",
      },
      {
        id: "monotonic_stack",
        text: "Use a monotonic stack that removes opening delimiters according to their character values.",
      },
      {
        id: "queue",
        text: "Use a queue so that the oldest unmatched opening delimiter is checked first.",
      },
      {
        id: "running_extreme",
        text: "Keep only the smallest opening delimiter seen so far.",
      },
    ],
    correctOptionId: "plain_stack",
    feedbackModel: {
      decisionSignal:
        "The required relationship is most-recent unresolved matching.",
      mentalModelCorrection:
        "Nested delimiters require LIFO order. There is no value-dominance relationship that justifies monotonic candidate elimination.",
      mistakeTypes: ["strategy_signal_mismatch"],
      nextAction:
        "Determine whether the next event must interact with the newest unresolved item or with an ordered candidate set.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-recognize-002",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_plain_stack_signal",
    secondarySkillAtomIds: ["undo_contract", "reverse_order_restoration"],
    type: "single_choice",
    prompt:
      "An editor must undo actions in the reverse order in which they were completed. Which structure provides the required behavior without an additional value-order invariant?",
    options: [
      {
        id: "plain_stack",
        text: "A plain stack of completed actions.",
      },
      {
        id: "monotonic_stack",
        text: "A monotonic stack ordered by action identifier.",
      },
      {
        id: "priority_queue",
        text: "A priority queue ordered by action size.",
      },
      {
        id: "prefix_state",
        text: "A prefix array of cumulative action counts.",
      },
    ],
    correctOptionId: "plain_stack",
    feedbackModel: {
      decisionSignal:
        "Undo is governed by reverse chronology rather than greater-or-smaller relationships.",
      mentalModelCorrection:
        "A plain LIFO stack already models the contract. Adding monotonic ordering would discard or reorder valid history.",
      mistakeTypes: ["unnecessary_monotonic_invariant"],
      nextAction: "Check whether item priority comes from recency alone.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-recognize-003",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_reverse_processing_stack",
    secondarySkillAtomIds: ["lifo_processing", "reverse_arrival_order"],
    type: "strategy_choice",
    prompt:
      "Items arrive as A, B, C, D and later must be processed as D, C, B, A. No comparison between item values is required. Which strategy is appropriate?",
    options: [
      {
        id: "plain_stack",
        text: "Push every item onto a plain stack and later pop them.",
      },
      {
        id: "monotonic_stack",
        text: "Remove items until their values become increasing.",
      },
      {
        id: "queue",
        text: "Enqueue every item and remove from the front.",
      },
      {
        id: "sorted_array",
        text: "Sort the items by value before processing.",
      },
    ],
    correctOptionId: "plain_stack",
    feedbackModel: {
      decisionSignal:
        "The required output order is exactly the reverse of arrival order.",
      mentalModelCorrection:
        "Reversal is a pure LIFO signal. It does not require candidate dominance or an ordered stack.",
      mistakeTypes: ["lifo_contract_mismatch"],
      nextAction:
        "Compare insertion order with required removal order before considering value relationships.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-recognize-004",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_monotonic_stack_signal",
    secondarySkillAtomIds: [
      "nearest_greater_relationship",
      "ordered_candidate_elimination",
    ],
    type: "single_choice",
    prompt:
      "For every array position, you must identify the nearest later value that is greater. Which high-level strategy signal is present?",
    options: [
      {
        id: "monotonic_candidates",
        text: "Retain unresolved candidates in a monotonic stack and eliminate them when a qualifying later value appears.",
      },
      {
        id: "plain_lifo_history",
        text: "Retain every processed value solely because it was seen recently.",
      },
      {
        id: "nested_matching",
        text: "Match each value with the most recently opened structural token.",
      },
      {
        id: "global_maximum",
        text: "Keep only the largest value in the complete array.",
      },
    ],
    correctOptionId: "monotonic_candidates",
    feedbackModel: {
      decisionSignal:
        "The task asks for a directional nearest greater relationship across unresolved candidates.",
      mentalModelCorrection:
        "A plain stack supplies LIFO access but does not by itself define which candidates have become irrelevant for future greater-value queries.",
      mistakeTypes: ["missing_monotonic_invariant"],
      nextAction:
        "Look for nearest greater-or-smaller relationships that permit ordered candidate elimination.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-recognize-005",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_monotonic_boundary_signal",
    secondarySkillAtomIds: [
      "directional_boundary_query",
      "previous_smaller_relationship",
    ],
    type: "strategy_choice",
    prompt:
      "For each position, a task asks for the nearest earlier position containing a smaller value. Which strategy most naturally represents the useful candidates?",
    options: [
      {
        id: "monotonic_stack",
        text: "A monotonic stack of candidate boundaries maintained according to value order.",
      },
      {
        id: "plain_stack",
        text: "A plain stack that keeps every earlier position until the scan ends.",
      },
      {
        id: "undo_stack",
        text: "A stack that removes only the most recently performed action.",
      },
      {
        id: "delimiter_stack",
        text: "A stack that matches opening and closing symbols.",
      },
    ],
    correctOptionId: "monotonic_stack",
    feedbackModel: {
      decisionSignal:
        "The answer is a directional nearest boundary defined by a value relationship.",
      mentalModelCorrection:
        "Boundary queries often require discarding candidates that cannot be the nearest useful smaller or greater boundary.",
      mistakeTypes: ["strategy_signal_mismatch"],
      nextAction:
        "Identify whether stack entries are retained by recency alone or by future boundary usefulness.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-recognize-006",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_plain_and_monotonic_stack",
    secondarySkillAtomIds: ["stack_order_invariant", "lifo_base_contract"],
    type: "solution_comparison",
    prompt:
      "Which statement correctly describes the relationship between a plain stack and a monotonic stack?",
    options: [
      {
        id: "stack_plus_invariant",
        text: "A monotonic stack still uses LIFO operations but adds an order invariant that controls which candidates remain.",
      },
      {
        id: "different_data_structure",
        text: "A monotonic stack is not a stack because it can remove more than one item.",
      },
      {
        id: "sorted_input_requirement",
        text: "A monotonic stack is a plain stack used only when the original input is already sorted.",
      },
      {
        id: "queue_with_order",
        text: "A monotonic stack removes items from the bottom like an ordered queue.",
      },
    ],
    correctOptionId: "stack_plus_invariant",
    feedbackModel: {
      decisionSignal:
        "Both structures push and pop at the top, but only one maintains candidate order and dominance semantics.",
      mentalModelCorrection:
        "Monotonic stack is a specialized use of a stack, not a separate removal discipline or an input-sorting requirement.",
      mistakeTypes: ["plain_monotonic_stack_confusion"],
      nextAction:
        "Describe both the shared LIFO mechanics and the additional candidate-order invariant.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-recognize-007",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_input_from_stack_monotonicity",
    secondarySkillAtomIds: [
      "auxiliary_state_invariant",
      "unsorted_input_processing",
    ],
    type: "single_choice",
    prompt:
      "The input values are irregular and unsorted. Does that prevent the use of a monotonic stack?",
    options: [
      {
        id: "no_stack_is_monotonic",
        text: "No. The auxiliary stack is maintained monotonically even when the input is not.",
      },
      {
        id: "yes_input_must_be_sorted",
        text: "Yes. Monotonic-stack algorithms require a sorted input array.",
      },
      {
        id: "yes_unless_reversed",
        text: "Yes, unless the input is first reversed.",
      },
      {
        id: "only_plain_stack",
        text: "Yes. Unsorted input permits only a plain stack.",
      },
    ],
    correctOptionId: "no_stack_is_monotonic",
    feedbackModel: {
      decisionSignal:
        "The term monotonic describes the retained candidate state.",
      mentalModelCorrection:
        "The algorithm filters an arbitrary input stream into an ordered stack. It does not assume the original sequence already has that order.",
      mistakeTypes: ["input_stack_invariant_confusion"],
      nextAction:
        "Identify exactly which collection is claimed to satisfy the monotonic invariant.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-recognize-008",
    learningStage: "foundations",
    primarySkillAtomId: "reject_monotonic_stack_keyword_matching",
    secondarySkillAtomIds: [
      "contract_first_strategy_selection",
      "plain_stack_signal",
    ],
    type: "solution_comparison",
    prompt:
      "A prompt explicitly says, 'Use a stack to support Undo.' A developer chooses a monotonic stack because it is a more advanced stack variant. What is wrong with that choice?",
    options: [
      {
        id: "no_order_relationship",
        text: "Undo requires reverse chronological retention, but provides no greater-or-smaller relationship that justifies candidate elimination.",
      },
      {
        id: "monotonic_too_fast",
        text: "A monotonic stack would make Undo operations faster than allowed.",
      },
      {
        id: "plain_stack_cannot_store_actions",
        text: "A plain stack cannot store structured action records.",
      },
      {
        id: "undo_requires_queue",
        text: "Undo must process the oldest action first.",
      },
    ],
    correctOptionId: "no_order_relationship",
    feedbackModel: {
      decisionSignal:
        "The problem names a stack because of LIFO behavior, not because candidates are ordered by value.",
      mentalModelCorrection:
        "A specialized pattern should be selected only when its additional invariant serves the required relationship.",
      mistakeTypes: ["unnecessary_monotonic_invariant"],
      nextAction:
        "Ask what correctness role the proposed value order would play.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-recognize-009",
    learningStage: "foundations",
    primarySkillAtomId: "reject_plain_stack_for_ordered_candidates",
    secondarySkillAtomIds: ["nearest_greater_query", "candidate_dominance"],
    type: "solution_comparison",
    prompt:
      "A next-greater solution pushes every processed index onto a plain stack and never removes candidates based on value relationships. What essential mechanism is missing?",
    options: [
      {
        id: "ordered_candidate_elimination",
        text: "An invariant explaining when the current value resolves or dominates retained candidates.",
      },
      {
        id: "delimiter_matching",
        text: "A mapping between opening and closing delimiters.",
      },
      {
        id: "reverse_actions",
        text: "A way to undo processed values in reverse order.",
      },
      {
        id: "fifo_removal",
        text: "Removal from the bottom of the stack.",
      },
    ],
    correctOptionId: "ordered_candidate_elimination",
    feedbackModel: {
      decisionSignal:
        "The task depends on greater-than relationships among unresolved positions.",
      mentalModelCorrection:
        "Plain LIFO storage alone does not compress candidates or expose the relevant greater-or-smaller relationships.",
      mistakeTypes: ["missing_monotonic_invariant"],
      nextAction:
        "Define which unresolved candidates remain useful after each incoming value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-recognize-010",
    learningStage: "foundations",
    primarySkillAtomId: "select_stack_strategy_from_relationship",
    secondarySkillAtomIds: [
      "strategy_contract_analysis",
      "data_structure_name_bias",
    ],
    type: "single_choice",
    prompt:
      "What should determine whether a task uses a plain stack or a monotonic stack?",
    options: [
      {
        id: "required_relationship",
        text: "Whether the contract needs pure LIFO resolution or ordered elimination of greater-or-smaller candidates.",
      },
      {
        id: "word_stack",
        text: "Whether the prompt contains the word stack.",
      },
      {
        id: "numeric_input",
        text: "Whether the input contains numbers.",
      },
      {
        id: "array_length",
        text: "Whether the array contains more than ten elements.",
      },
    ],
    correctOptionId: "required_relationship",
    feedbackModel: {
      decisionSignal:
        "The two strategies differ in the semantic relationship represented by retained entries.",
      mentalModelCorrection:
        "Data-structure names and input types are weak signals. Strategy follows the required removal and candidate-usefulness contract.",
      mistakeTypes: ["keyword_pattern_matching"],
      nextAction:
        "State why an entry remains and what event permits its removal.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-recognize-011",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_unresolved_retention_models",
    secondarySkillAtomIds: [
      "plain_stack_pending_state",
      "monotonic_candidate_state",
    ],
    type: "solution_comparison",
    prompt:
      "Compute the global maximum value in an array. Which strategy fits this task?",
    options: [
      {
        id: "plain_stack",
        text: "A plain stack that retains every value until the scan ends.",
      },
      {
        id: "running_maximum",
        text: "A running maximum during one linear scan.",
      },
      {
        id: "monotonic_stack",
        text: "A monotonic stack that retains unresolved greater candidates.",
      },
      {
        id: "sorting",
        text: "Sort the array and select the last value.",
      },
    ],
    correctOptionId: "running_maximum",
    feedbackModel: {
      decisionSignal:
        "The task asks for one global aggregate, not for LIFO matching or nearest unresolved boundaries.",
      mentalModelCorrection:
        "A running maximum preserves exactly the state needed for a global maximum. A stack adds retention semantics that this task does not require.",
      mistakeTypes: ["stack_state_semantics_mismatch"],
      nextAction:
        "Describe the semantic lifecycle of one retained entry in each strategy.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-recognize-012",
    learningStage: "foundations",
    primarySkillAtomId: "compare_plain_and_monotonic_stack_tasks",
    secondarySkillAtomIds: [
      "nested_matching_signal",
      "directional_extreme_signal",
    ],
    type: "solution_comparison",
    prompt:
      "Task A validates properly nested brackets. Task B finds the nearest previous smaller value for each array position. Which strategy assignment is correct?",
    options: [
      {
        id: "plain_a_monotonic_b",
        text: "Task A uses a plain LIFO stack; Task B uses a monotonic candidate stack.",
      },
      {
        id: "monotonic_a_plain_b",
        text: "Task A uses a monotonic stack; Task B uses a plain stack without an order invariant.",
      },
      {
        id: "plain_both",
        text: "Both use only plain stacks because both remove from the top.",
      },
      {
        id: "monotonic_both",
        text: "Both use monotonic stacks because both contain unresolved entries.",
      },
    ],
    correctOptionId: "plain_a_monotonic_b",
    feedbackModel: {
      decisionSignal:
        "The first task resolves nesting by recency, while the second filters directional boundary candidates by value.",
      mentalModelCorrection:
        "Shared stack mechanics do not make the semantic invariants interchangeable.",
      mistakeTypes: ["strategy_contrast_mismatch"],
      nextAction:
        "Classify each task by its required relationship rather than by its shared use of push and pop.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-recognize-013",
    learningStage: "foundations",
    primarySkillAtomId: "review_candidate_elimination_legality",
    secondarySkillAtomIds: ["dominance_requirement", "safe_stack_removal"],
    type: "solution_comparison",
    prompt:
      "A proposed stack solution removes an unresolved entry because a newer value is larger. What must be established before this removal is valid?",
    options: [
      {
        id: "older_cannot_matter",
        text: "The newer value or current event makes the older entry resolved or unable to affect any required future answer.",
      },
      {
        id: "newer_is_recent",
        text: "The newer entry appeared later, which is sufficient in every stack problem.",
      },
      {
        id: "values_are_numeric",
        text: "Both entries contain comparable numeric values.",
      },
      {
        id: "stack_remains_nonempty",
        text: "At least one entry remains after the pop.",
      },
    ],
    correctOptionId: "older_cannot_matter",
    feedbackModel: {
      decisionSignal:
        "Monotonic popping is a permanent candidate-elimination decision.",
      mentalModelCorrection:
        "A value comparison alone does not justify removal. The problem contract must prove that the discarded entry is resolved or dominated.",
      mistakeTypes: ["unsupported_candidate_elimination"],
      nextAction:
        "Explain what future answer the removed entry can no longer provide.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-recognize-014",
    learningStage: "foundations",
    primarySkillAtomId: "justify_plain_vs_monotonic_stack_choice",
    secondarySkillAtomIds: [
      "strategy_justification",
      "relationship_driven_selection",
    ],
    type: "solution_comparison",
    prompt:
      "After preprocessing a static array, answer arbitrary range-sum queries. Which strategy fits this task?",
    options: [
      {
        id: "monotonic_stack",
        text: "A monotonic stack that keeps candidate boundaries in value order.",
      },
      {
        id: "prefix_sums",
        text: "Prefix sums, subtracting two prefix values for each query.",
      },
      {
        id: "plain_stack",
        text: "A plain stack that stores values in their input order.",
      },
      {
        id: "running_maximum",
        text: "A running maximum, because sums and maxima are both aggregates.",
      },
    ],
    correctOptionId: "prefix_sums",
    feedbackModel: {
      decisionSignal:
        "The same static array serves many additive range queries after a one-time preprocessing step.",
      mentalModelCorrection:
        "Neither stack variant provides constant-time arbitrary range sums. Prefix sums make each query a subtraction of two stored cumulative totals.",
      mistakeTypes: ["weak_strategy_justification"],
      nextAction:
        "Justify the structure through what entries represent, why they remain, and when they may be safely removed.",
      result: "diagnostic",
    },
  },
];
