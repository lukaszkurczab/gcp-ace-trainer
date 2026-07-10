export const plainStackLifoContractQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-plain-lifo-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_plain_stack_lifo_contract",
    secondarySkillAtomIds: ["last_in_first_out", "most_recent_unresolved_item"],
    type: "single_choice",
    prompt:
      "A stream contains nested opening and closing delimiters. Each closing delimiter must match the most recently opened delimiter that has not yet been closed. Which structure best matches this contract?",
    options: [
      {
        id: "plain_stack",
        text: "A plain stack of unresolved opening delimiters.",
      },
      {
        id: "monotonic_stack",
        text: "A monotonic stack that removes opening delimiters when their numeric codes break value order.",
      },
      {
        id: "queue",
        text: "A queue that matches the oldest unresolved opening delimiter first.",
      },
      {
        id: "global_counter",
        text: "One counter containing the total number of opening delimiters.",
      },
    ],
    correctOptionId: "plain_stack",
    feedbackModel: {
      decisionSignal:
        "The required match is determined by recency among unresolved events.",
      mentalModelCorrection:
        "Nested structure requires LIFO order. No value-dominance rule is needed to discard unresolved openers.",
      mistakeTypes: ["strategy_mismatch"],
      nextAction:
        "Ask whether the next event must interact with the newest or oldest unresolved item.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-plain-lifo-002",
    learningStage: "foundations",
    primarySkillAtomId: "match_most_recent_opener",
    secondarySkillAtomIds: ["nested_delimiter_matching", "stack_top_semantics"],
    type: "single_choice",
    prompt:
      'While validating the sequence "([{}])", the scanner reaches the closing brace }. Which unresolved opener should be checked first?',
    options: [
      {
        id: "opening_brace",
        text: "The opening brace { at the top of the stack.",
      },
      {
        id: "opening_parenthesis",
        text: "The opening parenthesis ( at the bottom of the stack.",
      },
      {
        id: "oldest_opener",
        text: "Whichever opening delimiter appeared first.",
      },
      {
        id: "largest_character_code",
        text: "Whichever opening delimiter has the largest character code.",
      },
    ],
    correctOptionId: "opening_brace",
    feedbackModel: {
      decisionSignal:
        "The innermost unresolved opener must close before its containing delimiters.",
      mentalModelCorrection:
        "Nested matching reads from the stack top, not from the oldest stored opener or from a value-order rule.",
      mistakeTypes: ["wrong_stack_end"],
      nextAction:
        "Trace unresolved openers from outermost at the bottom to innermost at the top.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-plain-lifo-003",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_stack_from_queue",
    secondarySkillAtomIds: ["lifo_vs_fifo", "nested_state_resolution"],
    type: "single_choice",
    prompt: "Why would a queue be incorrect for matching nested delimiters?",
    options: [
      {
        id: "queue_uses_oldest",
        text: "It would expose the oldest unresolved opener instead of the most recent one.",
      },
      {
        id: "queue_cannot_store_symbols",
        text: "Queues cannot store delimiter characters.",
      },
      {
        id: "queue_is_quadratic",
        text: "Every queue operation is O(n²).",
      },
      {
        id: "queue_sorts_items",
        text: "A queue automatically sorts delimiters by type.",
      },
    ],
    correctOptionId: "queue_uses_oldest",
    feedbackModel: {
      decisionSignal: "Nested closure order is the reverse of opening order.",
      mentalModelCorrection:
        "FIFO resolves the earliest pending event first, while nesting requires the latest unresolved event first.",
      mistakeTypes: ["stack_queue_confusion"],
      nextAction:
        "Write the required removal order for two nested openers before selecting a structure.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-stack-monotonic-plain-lifo-004",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_undo_stack_contract",
    secondarySkillAtomIds: ["most_recent_action", "reverse_state_restoration"],
    type: "single_choice",
    prompt:
      "An editor's Undo command must revert the most recently completed action that has not already been undone. Which state model is appropriate?",
    options: [
      {
        id: "plain_action_stack",
        text: "Push each completed action and pop the most recent action when Undo is requested.",
      },
      {
        id: "monotonic_action_stack",
        text: "Discard actions whenever their numeric identifiers are not monotonic.",
      },
      {
        id: "action_queue",
        text: "Remove the oldest action whenever Undo is requested.",
      },
      {
        id: "largest_action_only",
        text: "Keep only the action with the largest identifier.",
      },
    ],
    correctOptionId: "plain_action_stack",
    feedbackModel: {
      decisionSignal:
        "The required restoration order is the reverse of execution order.",
      mentalModelCorrection:
        "Undo depends on chronology, not on comparing action values or removing dominated candidates.",
      mistakeTypes: ["strategy_mismatch"],
      nextAction: "Check whether state must be reversed one event at a time.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-plain-lifo-005",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_all_unresolved_stack_items",
    secondarySkillAtomIds: ["unresolved_opener_retention", "plain_stack_state"],
    type: "single_choice",
    prompt:
      "A delimiter scan ends with unresolved opening delimiters still on the stack. What does that final stack state mean?",
    options: [
      {
        id: "invalid_unmatched_openers",
        text: "The sequence is invalid because unmatched openers remain unresolved after the full scan.",
      },
      {
        id: "implementation_error",
        text: "The implementation is incorrect because a stack should always be empty after any scan.",
      },
      {
        id: "valid_outer_openers",
        text: "The sequence is valid because outer openers are allowed to remain after inner pairs close.",
      },
      {
        id: "ignore_openers",
        text: "The remaining openers can be ignored because no closing delimiter caused a mismatch.",
      },
    ],
    correctOptionId: "invalid_unmatched_openers",
    feedbackModel: {
      decisionSignal:
        "The scan has consumed all input, so no future closer remains to resolve any opener.",
      mentalModelCorrection:
        "A nonempty stack is a valid diagnostic state during the scan. At end of input, it proves the delimiter sequence has unmatched openers and is invalid.",
      mistakeTypes: ["premature_unresolved_removal"],
      nextAction:
        "Remove an item only when the event that resolves it actually occurs.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-plain-lifo-006",
    learningStage: "foundations",
    primarySkillAtomId: "reject_value_order_for_lifo_problem",
    secondarySkillAtomIds: ["plain_vs_monotonic_stack", "nesting_contract"],
    type: "solution_comparison",
    prompt:
      "A delimiter solution pops opening symbols whenever their character codes are greater than the current opening symbol so that the stack remains increasing. What is the main flaw?",
    options: [
      {
        id: "removes_unresolved_openers",
        text: "It discards unresolved openers based on an irrelevant value-order rule before their matching closers arrive.",
      },
      {
        id: "character_codes_unavailable",
        text: "Delimiter characters do not have comparable codes.",
      },
      {
        id: "increasing_stack_too_slow",
        text: "An increasing stack makes every operation O(log n).",
      },
      {
        id: "closers_need_sorting",
        text: "Closing delimiters must be sorted before validation.",
      },
    ],
    correctOptionId: "removes_unresolved_openers",
    feedbackModel: {
      decisionSignal:
        "The usefulness of an opener depends on whether it has been matched, not on its relative numeric value.",
      mentalModelCorrection:
        "A monotonic invariant is legal only when it proves removed candidates cannot matter later. Nesting provides no such dominance relation.",
      mistakeTypes: ["irrelevant_monotonic_invariant"],
      nextAction:
        "Define candidate usefulness from the matching contract rather than from available numeric comparisons.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-plain-lifo-007",
    learningStage: "foundations",
    primarySkillAtomId: "trace_plain_stack_nesting",
    secondarySkillAtomIds: ["lifo_trace", "delimiter_state_transition"],
    type: "single_choice",
    prompt:
      "A validator processes the prefix \"({[\". The stack contains ['(', '{', '['] from bottom to top. The next symbol is ]. What should happen?",
    options: [
      {
        id: "pop_square",
        text: "Match ] with the top opener [ and pop only that opener.",
      },
      {
        id: "pop_parenthesis",
        text: "Match ] with the bottom opener ( because it appeared first.",
      },
      {
        id: "pop_all",
        text: "Clear every opener because one matching closer appeared.",
      },
      {
        id: "keep_square",
        text: "Keep [ unresolved and push ] above it.",
      },
    ],
    correctOptionId: "pop_square",
    feedbackModel: {
      decisionSignal: "The top entry is the innermost still-open delimiter.",
      mentalModelCorrection:
        "One closer resolves exactly the most recent compatible opener, leaving outer openers unresolved.",
      mistakeTypes: ["lifo_trace_error"],
      nextAction: "Apply one matching event to one top unresolved opener.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-plain-lifo-008",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_reverse_processing_stack",
    secondarySkillAtomIds: ["reverse_output_order", "stack_push_pop_sequence"],
    type: "single_choice",
    prompt:
      "Items A, B, and C are received in that order, but must later be processed as C, B, A. Which plain-stack behavior provides that order?",
    options: [
      {
        id: "push_then_pop",
        text: "Push A, B, and C, then repeatedly pop from the top.",
      },
      {
        id: "enqueue_then_dequeue",
        text: "Enqueue A, B, and C, then remove from the front.",
      },
      {
        id: "keep_minimum",
        text: "Retain only the lexicographically smallest item.",
      },
      {
        id: "sort_descending",
        text: "Impose a monotonic value invariant while receiving items.",
      },
    ],
    correctOptionId: "push_then_pop",
    feedbackModel: {
      decisionSignal:
        "The requested processing order is exactly the reverse of arrival order.",
      mentalModelCorrection:
        "A plain stack reverses chronological order without requiring any comparison among item values.",
      mistakeTypes: ["lifo_contract_mismatch"],
      nextAction:
        "Compare insertion order directly with required removal order.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "core",
    id: "alg-contrast-stack-monotonic-plain-lifo-009",
    learningStage: "foundations",
    primarySkillAtomId: "detect_mismatched_closer_from_stack_top",
    secondarySkillAtomIds: ["delimiter_type_check", "top_unresolved_opener"],
    type: "single_choice",
    prompt:
      "The unresolved opener stack contains ['(', '['] from bottom to top, and the next symbol is ). What should a correct validator conclude?",
    options: [
      {
        id: "mismatch",
        text: "The sequence is invalid because ) does not match the most recent unresolved opener [.",
      },
      {
        id: "match_bottom",
        text: "The sequence is valid because ) matches the older opener ( at the bottom.",
      },
      {
        id: "discard_square",
        text: "Pop [ without matching it, then match ) with (.",
      },
      {
        id: "push_closer",
        text: "Push ) and postpone the decision until the end.",
      },
    ],
    correctOptionId: "mismatch",
    feedbackModel: {
      decisionSignal:
        "A nested closer must match the current top opener before any outer opener becomes accessible.",
      mentalModelCorrection:
        "Skipping an unresolved inner opener violates nesting order. The algorithm may not search deeper in the stack for a convenient match.",
      mistakeTypes: ["nested_match_order_mismatch"],
      nextAction:
        "Require compatibility with the top before performing any pop.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-plain-lifo-010",
    learningStage: "foundations",
    primarySkillAtomId: "contrast_plain_and_monotonic_candidate_retention",
    secondarySkillAtomIds: [
      "plain_stack_retention",
      "monotonic_candidate_elimination",
    ],
    type: "solution_comparison",
    prompt:
      "Which comparison between a plain stack and a monotonic stack is most accurate?",
    options: [
      {
        id: "lifo_vs_dominance",
        text: "A plain stack retains unresolved items for reverse-order resolution, while a monotonic stack may remove candidates proven unnecessary by an ordering and dominance invariant.",
      },
      {
        id: "same_retention",
        text: "Both must retain every processed item until the full input ends.",
      },
      {
        id: "plain_sorted",
        text: "A plain stack keeps values sorted, while a monotonic stack preserves insertion order.",
      },
      {
        id: "queue_vs_stack",
        text: "A plain stack is FIFO, while a monotonic stack is LIFO.",
      },
    ],
    correctOptionId: "lifo_vs_dominance",
    feedbackModel: {
      decisionSignal:
        "The two structures differ in why entries remain and when an entry may safely be removed.",
      mentalModelCorrection:
        "Both use stack operations, but a monotonic stack adds semantic candidate elimination that a pure LIFO problem does not justify.",
      mistakeTypes: ["plain_monotonic_stack_confusion"],
      nextAction:
        "State whether removal means resolved by the latest event or dominated for all future events.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-plain-lifo-011",
    learningStage: "foundations",
    primarySkillAtomId: "review_premature_plain_stack_pop",
    secondarySkillAtomIds: ["unresolved_item_lifecycle", "safe_stack_pop"],
    type: "solution_comparison",
    prompt:
      "A delimiter validator reads a closing bracket when its stack of unresolved opening delimiters is empty. What should it conclude?",
    options: [
      {
        id: "invalid_no_opener",
        text: "The sequence is invalid because no unresolved opener exists for this closer.",
      },
      {
        id: "ignore_closer",
        text: "Ignore the closer because it has no effect without an opener.",
      },
      {
        id: "push_closer",
        text: "Push the closer so that a later opener can match it.",
      },
      {
        id: "closer_as_opener",
        text: "Treat the closer as its own opener and defer the match decision.",
      },
    ],
    correctOptionId: "invalid_no_opener",
    feedbackModel: {
      decisionSignal:
        "A closer must consume a compatible most-recent unresolved opener, and none exists.",
      mentalModelCorrection:
        "An empty opener stack is not a state to repair or defer. It is direct evidence that this closer has no matching opener, so the sequence is invalid.",
      mistakeTypes: ["premature_unresolved_removal"],
      nextAction:
        "Before matching a closer, check that the stack is nonempty and that its top is the required opener.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "advanced",
    id: "alg-contrast-stack-monotonic-plain-lifo-012",
    learningStage: "foundations",
    primarySkillAtomId: "justify_plain_stack_strategy",
    secondarySkillAtomIds: [
      "lifo_strategy_justification",
      "unresolved_state_retention",
    ],
    type: "solution_comparison",
    prompt:
      "Which explanation best justifies using a plain stack rather than a monotonic stack?",
    options: [
      {
        id: "complete_lifo_justification",
        text: "The task resolves pending items in reverse arrival order, every unresolved item must remain until its matching or undo event occurs, and no value-based dominance rule proves that an earlier item can be discarded.",
      },
      {
        id: "stack_keyword",
        text: "The prompt mentions nesting, so any stack variant is automatically correct.",
      },
      {
        id: "increasing_values",
        text: "The stored items happen to have increasing identifiers.",
      },
      {
        id: "remove_dominated",
        text: "Older unresolved items should be removed whenever a newer item's value is larger.",
      },
    ],
    correctOptionId: "complete_lifo_justification",
    feedbackModel: {
      decisionSignal:
        "The correct strategy follows reverse-order resolution and complete pending-state retention.",
      mentalModelCorrection:
        "A plain stack is selected because LIFO alone models the contract. Adding a monotonic invariant would remove information without a correctness proof.",
      mistakeTypes: ["weak_plain_stack_justification"],
      nextAction:
        "Justify stack choice through removal order, unresolved-item meaning, and legal pop conditions.",
      result: "diagnostic",
    },
  },
];
