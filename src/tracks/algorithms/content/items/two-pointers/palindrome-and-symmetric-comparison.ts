export const palindromeAndSymmetricComparisonQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-palindrome-symmetric-comparison-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_mirrored_pointer_roles",
    secondarySkillAtomIds: [
      "distinguish_symmetric_positions_from_window",
      "interpret_opposite_end_comparison",
    ],
    type: "single_choice",
    prompt: "In a standard palindrome check, what do left and right represent?",
    options: [
      {
        id: "mirrored_positions",
        text: "The next pair of mirrored positions whose values, after any contract-required normalization, must match.",
        isCorrect: true,
      },
      {
        id: "active_window_boundaries",
        text: "The boundaries of one candidate substring whose complete interior state determines validity.",
        isCorrect: false,
      },
      {
        id: "independent_pair_search",
        text: "Two arbitrary characters being tested as one candidate pair among many possible pairs.",
        isCorrect: false,
      },
      {
        id: "read_write_positions",
        text: "A source position and the next output position for compaction.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The comparison is determined by positional symmetry around the string's center.",
      mentalModelCorrection:
        "Palindrome pointers identify corresponding mirrored positions, not a general sliding window.",
      mistakeTypes: ["palindrome_pointers_called_window_boundaries"],
      nextAction:
        "State which position on the opposite side corresponds to each current pointer.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-palindrome-symmetric-comparison-002",
    learningStage: "foundations",
    primarySkillAtomId: "advance_both_after_symmetric_match",
    secondarySkillAtomIds: [
      "consume_mirrored_pair",
      "maintain_palindrome_invariant",
    ],
    type: "single_choice",
    prompt: `A palindrome scan compares characters[left] and characters[right], and they match.

What should happen next?`,
    options: [
      {
        id: "move_both_inward",
        text: "Increment left and decrement right because both mirrored positions have been verified.",
        isCorrect: true,
      },
      {
        id: "move_left_only",
        text: "Increment left only and compare the next left character with the same right character.",
        isCorrect: false,
      },
      {
        id: "move_right_only",
        text: "Decrement right only and reuse the same left character.",
        isCorrect: false,
      },
      {
        id: "keep_both",
        text: "Keep both pointers unchanged and verify the same pair again.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A successful comparison consumes one verified position from each side.",
      mentalModelCorrection:
        "Mirrored positions advance symmetrically after a match; one-sided movement breaks the positional pairing.",
      mistakeTypes: ["palindrome_advances_only_one_pointer"],
      nextAction:
        "Tie each pointer movement to consumption of its verified mirrored character.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-palindrome-symmetric-comparison-003",
    learningStage: "foundations",
    primarySkillAtomId: "return_early_on_palindrome_mismatch",
    secondarySkillAtomIds: [
      "recognize_irrecoverable_symmetric_mismatch",
      "avoid_unnecessary_scanning",
    ],
    type: "single_choice",
    prompt:
      "Why may a strict palindrome check return false immediately when the current mirrored characters differ?",
    options: [
      {
        id: "fixed_pair_mismatch_proves_failure",
        text: "Those two positions are required to match under the palindrome definition, and no later pointer movement can repair them.",
        isCorrect: true,
      },
      {
        id: "all_later_pairs_also_differ",
        text: "Because every remaining mirrored pair must also differ.",
        isCorrect: false,
      },
      {
        id: "mismatch_means_unsorted",
        text: "Because a mismatch proves the string is not sorted.",
        isCorrect: false,
      },
      {
        id: "right_must_reset",
        text: "Because right would otherwise need to return to the end.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current comparison is mandatory for the complete symmetric contract.",
      mentalModelCorrection:
        "Palindrome checking is not a search for some compatible pairing; each mirrored position has one required partner.",
      mistakeTypes: ["palindrome_mismatch_not_treated_as_final"],
      nextAction:
        "Identify whether the pair relationship is optional or fixed by position.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-palindrome-symmetric-comparison-004",
    learningStage: "foundations",
    primarySkillAtomId: "handle_palindrome_center",
    secondarySkillAtomIds: [
      "terminate_on_pointer_meeting",
      "reason_about_odd_length_palindrome",
    ],
    type: "edge_case_drill",
    prompt: `A strict palindrome scan processes:

"radar"

What should happen when left and right both reach the center character "d"?`,
    options: [
      {
        id: "terminate_successfully",
        text: "The scan may terminate successfully because every pair outside the center has already matched.",
        isCorrect: true,
      },
      {
        id: "center_needs_second_copy",
        text: "The center character must be matched with a second distinct occurrence.",
        isCorrect: false,
      },
      {
        id: "return_false",
        text: "The scan must return false because left and right refer to the same index.",
        isCorrect: false,
      },
      {
        id: "restart_from_ends",
        text: "The pointers should reset and verify the string again.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "An odd-length palindrome may contain one unpaired center position.",
      mentalModelCorrection:
        "Only positions strictly outside the center require mirrored partners.",
      mistakeTypes: ["palindrome_center_mishandled"],
      nextAction:
        "Use a loop condition such as left < right when the center needs no separate comparison.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-palindrome-symmetric-comparison-005",
    learningStage: "foundations",
    primarySkillAtomId: "normalize_before_symmetric_comparison",
    secondarySkillAtomIds: [
      "perform_case_insensitive_comparison",
      "separate_raw_from_normalized_character",
    ],
    type: "single_choice",
    prompt:
      "A palindrome contract ignores letter case. How should the endpoint comparison be performed?",
    options: [
      {
        id: "compare_same_normalized_form",
        text: "Convert both current characters using the same case normalization and compare the normalized values.",
        isCorrect: true,
      },
      {
        id: "normalize_left_only",
        text: "Lowercase only the left character and compare it with the raw right character.",
        isCorrect: false,
      },
      {
        id: "compare_character_codes_distance",
        text: "Treat characters as equal whenever their character codes differ by a fixed amount.",
        isCorrect: false,
      },
      {
        id: "ignore_all_letter_differences",
        text: "Treat every pair of letters as equal once case-insensitive mode is enabled.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The equivalence rule applies symmetrically to both compared values.",
      mentalModelCorrection:
        "Normalization must map both sides into the same comparison domain.",
      mistakeTypes: ["one_sided_case_normalization"],
      nextAction:
        "Apply one explicit normalization function to both characters before equality testing.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-palindrome-symmetric-comparison-006",
    learningStage: "foundations",
    primarySkillAtomId: "skip_ignorable_characters_safely",
    secondarySkillAtomIds: [
      "maintain_bounds_while_skipping",
      "find_next_comparable_character",
    ],
    type: "subgoal_ordering",
    prompt:
      "A palindrome contract ignores non-alphanumeric characters. Which sequence safely processes each comparison?",
    options: [
      {
        id: "skip_left_skip_right_check_bounds_compare",
        text: "Move left past ignorable characters while left < right, move right past ignorable characters while left < right, then compare if left < right.",
        isCorrect: true,
      },
      {
        id: "compare_then_skip",
        text: "Compare the raw endpoint characters first and skip them only after a mismatch.",
        isCorrect: false,
      },
      {
        id: "skip_without_bounds",
        text: "Skip ignorable characters on both sides without checking whether the pointers cross.",
        isCorrect: false,
      },
      {
        id: "skip_left_only",
        text: "Skip ignorable characters only from the left side because right already moves backward.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Skipping can move pointers multiple positions and may exhaust the remaining range.",
      mentalModelCorrection:
        "Each skip loop must preserve safe bounds before indexing or comparing characters.",
      mistakeTypes: ["unsafe_skip_order_or_bounds"],
      nextAction:
        "Guard every skip and final comparison with the pointer relation.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-palindrome-symmetric-comparison-007",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_unsafe_palindrome_skip_loop",
    secondarySkillAtomIds: [
      "prevent_out_of_bounds_character_access",
      "maintain_skip_loop_bounds",
    ],
    type: "mistake_review",
    prompt: `Review this loop inside a scan whose active comparison condition is left < right:

while (!isAlphanumeric(text[left])) {
  left++;
}

What safety condition is missing?`,
    options: [
      {
        id: "left_must_not_cross_right",
        text: "The skip loop must also test left < right before reading text[left].",
        isCorrect: true,
      },
      {
        id: "left_must_move_by_two",
        text: "left must advance by two so it cannot stop on punctuation.",
        isCorrect: false,
      },
      {
        id: "right_must_reset",
        text: "right must be reset to the final index during every left skip.",
        isCorrect: false,
      },
      {
        id: "alphanumeric_check_must_mutate",
        text: "isAlphanumeric must remove the character from the string.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Repeated advancement may invalidate the pointer relation before the outer loop is checked again.",
      mentalModelCorrection:
        "The safe form is equivalent to `while (left < right && !isAlphanumeric(text[left]))`.",
      mistakeTypes: ["palindrome_skip_reads_out_of_bounds"],
      nextAction:
        "Include the active pointer bound in every inner loop that advances a pointer.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-palindrome-symmetric-comparison-008",
    learningStage: "foundations",
    primarySkillAtomId: "trace_normalized_palindrome_comparison",
    secondarySkillAtomIds: [
      "skip_ignorable_characters_safely",
      "normalize_before_symmetric_comparison",
    ],
    type: "edge_case_drill",
    prompt: `The contract ignores spaces, punctuation, and letter case.

How should the string:

"A man, a plan, a canal: Panama"

be classified?`,
    options: [
      {
        id: "palindrome",
        text: "It is a palindrome after normalization and skipping ignorable characters.",
        isCorrect: true,
      },
      {
        id: "not_palindrome_spaces",
        text: "It is not a palindrome because the spaces do not have mirrored spaces.",
        isCorrect: false,
      },
      {
        id: "not_palindrome_case",
        text: "It is not a palindrome because A and a are different raw characters.",
        isCorrect: false,
      },
      {
        id: "cannot_use_two_pointers",
        text: "The presence of punctuation prevents opposite-end comparison.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The comparison domain contains only normalized alphanumeric characters.",
      mentalModelCorrection:
        "Correctness follows the stated normalization contract, not raw string equality.",
      mistakeTypes: ["normalized_palindrome_contract_ignored"],
      nextAction:
        "Determine which characters participate and how participating characters are normalized.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-palindrome-symmetric-comparison-009",
    learningStage: "foundations",
    primarySkillAtomId: "handle_all_ignorable_input",
    secondarySkillAtomIds: [
      "reason_about_empty_normalized_sequence",
      "maintain_safe_skip_bounds",
    ],
    type: "edge_case_drill",
    prompt:
      'Under a contract that ignores every non-alphanumeric character, how should the input "... !!!" be classified?',
    options: [
      {
        id: "palindrome_empty_normalized",
        text: "As a palindrome, because its normalized comparable sequence is empty.",
        isCorrect: true,
      },
      {
        id: "not_palindrome_no_letters",
        text: "As not a palindrome because at least one letter is required.",
        isCorrect: false,
      },
      {
        id: "out_of_bounds_required",
        text: "The result is undefined because both pointers must eventually index a letter.",
        isCorrect: false,
      },
      {
        id: "compare_punctuation",
        text: "As a palindrome only if the punctuation characters match exactly in mirrored positions.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "After removing ignored characters, no mismatching comparable pair exists.",
      mentalModelCorrection:
        "An empty normalized sequence satisfies the usual palindrome definition, provided the skip logic terminates safely.",
      mistakeTypes: ["all_ignorable_input_mishandled"],
      nextAction:
        "Define the result for empty normalized content and ensure the pointer loops can reach it safely.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-palindrome-symmetric-comparison-010",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_one_sided_ignorable_skipping",
    secondarySkillAtomIds: [
      "skip_ignorable_characters_on_both_sides",
      "preserve_mirrored_comparison_alignment",
    ],
    type: "mistake_review",
    prompt: `A normalized palindrome check skips punctuation on the left but never skips it on the right.

What can go wrong?`,
    options: [
      {
        id: "compares_valid_left_to_ignored_right",
        text: "A valid left character may be compared with an ignorable right character, causing a false mismatch.",
        isCorrect: true,
      },
      {
        id: "right_never_needed",
        text: "Nothing; normalization is required only on one side.",
        isCorrect: false,
      },
      {
        id: "left_becomes_sorted",
        text: "The left half becomes sorted independently of the right half.",
        isCorrect: false,
      },
      {
        id: "all_punctuation_matches",
        text: "Every punctuation character automatically equals every alphanumeric character.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Both pointers must identify the next comparable character under the same filtering rule.",
      mentalModelCorrection:
        "Symmetric comparison requires symmetric preprocessing and advancement behavior.",
      mistakeTypes: ["ignorable_characters_skipped_one_side_only"],
      nextAction:
        "Advance each side independently until both point to comparable characters or cross.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-palindrome-symmetric-comparison-011",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_unsafe_global_normalization_assumption",
    secondarySkillAtomIds: [
      "scope_normalization_to_contract",
      "preserve_semantic_equivalence",
    ],
    type: "mistake_review",
    prompt: `A reviewer says:

"Just remove every character that is not an English letter and lowercase the rest."

Why is that not universally safe?`,
    options: [
      {
        id: "normalization_must_match_contract",
        text: "The allowed character set and normalization rules are part of the problem contract; digits or non-English letters may be meaningful inputs.",
        isCorrect: true,
      },
      {
        id: "lowercase_never_valid",
        text: "Lowercasing is never permitted in palindrome checks.",
        isCorrect: false,
      },
      {
        id: "punctuation_always_meaningful",
        text: "Every punctuation mark must always participate in comparison.",
        isCorrect: false,
      },
      {
        id: "normalization_requires_sorting",
        text: "Characters must be sorted before they can be normalized.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Normalization defines which differences are ignored and may change the semantic input.",
      mentalModelCorrection:
        "Do not invent a normalization policy broader or narrower than the stated equivalence contract.",
      mistakeTypes: ["normalization_policy_not_grounded_in_contract"],
      nextAction:
        "Specify participating characters and the exact equivalence transformation before implementing it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-palindrome-symmetric-comparison-012",
    learningStage: "foundations",
    primarySkillAtomId: "state_normalized_palindrome_invariant",
    secondarySkillAtomIds: [
      "prove_verified_outer_pairs",
      "maintain_safe_symmetric_bounds",
    ],
    type: "invariant_identification",
    prompt:
      "Which invariant best describes a normalized palindrome scan after each successful comparison?",
    options: [
      {
        id: "outer_comparable_pairs_verified",
        text: "All comparable characters outside [left, right] have been matched with their mirrored normalized partner, and left and right delimit the next unverified comparable region.",
        isCorrect: true,
      },
      {
        id: "interior_is_valid_window",
        text: "Every raw character inside [left, right] forms one valid sliding window.",
        isCorrect: false,
      },
      {
        id: "only_left_prefix_verified",
        text: "Only the characters before left have been checked; the right suffix remains unrelated.",
        isCorrect: false,
      },
      {
        id: "pointers_may_cross_ignored_bounds",
        text: "The pointers may move beyond each other before bounds are checked because ignored characters cannot cause errors.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each iteration verifies one normalized mirrored pair and shrinks the unverified center region.",
      mentalModelCorrection:
        "The invariant combines symmetric verification, normalization semantics, and safe pointer bounds.",
      mistakeTypes: ["normalized_palindrome_invariant_incomplete"],
      nextAction:
        "State what has been verified on both sides and what remains unverified between the pointers.",
      result: "diagnostic",
    },
  },
];
