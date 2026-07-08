export const duplicateControlQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-duplicate-001",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_sort_before_duplicate_skip",
    secondarySkillAtomIds: [
      "backtracking_duplicate_control",
      "sorting_based_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A backtracking solution wants to skip duplicate values using nums[i] === nums[i - 1]. What should usually happen before this check is reliable?",
    options: [
      {
        id: "sort_first",
        text: "Sort nums so equal values become adjacent.",
      },
      {
        id: "reverse_path",
        text: "Reverse path after every recursive call.",
      },
      {
        id: "clear_result",
        text: "Clear result whenever a duplicate value appears.",
      },
      {
        id: "use_binary_search",
        text: "Binary search for every duplicate value before recursion.",
      },
    ],
    correctAnswerId: "sort_first",
    feedbackModel: {
      decisionSignal:
        "Neighbor-based duplicate checks rely on equal values being adjacent, which sorting provides.",
      distractorExplanations: {
        reverse_path:
          "Reversing the current path does not group equal input candidates.",
        clear_result:
          "Clearing result destroys valid work and does not prevent duplicate branches.",
        use_binary_search:
          "Binary search can locate values in sorted data, but it does not define the duplicate-skip rule for recursion levels.",
      },
      mentalModelCorrection:
        "Duplicate control should be built into candidate enumeration. Sorting makes local duplicate comparisons meaningful.",
      mistakeTypes: ["duplicate_control_misread", "precondition_missed"],
      nextAction:
        "Before using nums[i] === nums[i - 1], check whether the input has been sorted.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-002",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_sort_before_duplicate_skip",
    secondarySkillAtomIds: [
      "backtracking_duplicate_control",
      "choice_filter_misread",
    ],
    type: "single_choice",
    prompt:
      "nums is [1, 2, 1]. A duplicate-skip rule checks only whether nums[i] equals nums[i - 1]. What is the problem if nums is not sorted first?",
    options: [
      {
        id: "duplicates_not_adjacent",
        text: "Equal values may not be adjacent, so the local neighbor check can miss duplicate branches.",
      },
      {
        id: "all_duplicates_removed",
        text: "The check removes every duplicate value from every branch.",
      },
      {
        id: "base_case_breaks",
        text: "The base case can no longer detect when the path is complete.",
      },
      {
        id: "visited_unavailable",
        text: "The algorithm cannot use any visited state after this check.",
      },
    ],
    correctAnswerId: "duplicates_not_adjacent",
    feedbackModel: {
      decisionSignal:
        "Without sorting, duplicate values can be separated, so nums[i] === nums[i - 1] is not a complete duplicate-branch check.",
      distractorExplanations: {
        all_duplicates_removed:
          "The check may miss duplicates rather than remove all of them.",
        base_case_breaks:
          "Base-case logic is separate from whether duplicate candidates are adjacent.",
        visited_unavailable:
          "Visited state can still exist; the issue is the local duplicate comparison.",
      },
      mentalModelCorrection:
        "A duplicate-skip condition is only as good as the ordering assumption behind it.",
      mistakeTypes: ["precondition_missed", "duplicate_control_misread"],
      nextAction:
        "When duplicate control depends on neighboring values, make adjacency true first.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-duplicate-003",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_same_depth_duplicate_skip",
    secondarySkillAtomIds: [
      "subset_generation",
      "backtracking_duplicate_control",
    ],
    type: "single_choice",
    prompt:
      "A sorted subset generator loops from startIndex. At the same recursion depth, nums[i] equals nums[i - 1]. What is the usual duplicate-control action when i > startIndex?",
    options: [
      {
        id: "skip_same_depth_duplicate",
        text: "Skip nums[i] because choosing it would start an equivalent branch at the same depth.",
      },
      {
        id: "skip_all_duplicates_globally",
        text: "Skip every copy of this value in all deeper branches.",
      },
      {
        id: "save_current_path",
        text: "Save the current path because a duplicate was seen.",
      },
      {
        id: "reset_start_index",
        text: "Reset startIndex to 0 and continue.",
      },
    ],
    correctAnswerId: "skip_same_depth_duplicate",
    feedbackModel: {
      decisionSignal:
        "At the same depth, choosing the second equal value as the next candidate creates the same subset branch already represented by the first equal value.",
      distractorExplanations: {
        skip_all_duplicates_globally:
          "Duplicate control is not a global ban on using equal values. Deeper branches may need another copy.",
        save_current_path:
          "Seeing a duplicate candidate is not a completion condition.",
        reset_start_index:
          "Resetting the boundary reintroduces reordered duplicate branches.",
      },
      mentalModelCorrection:
        "Same-depth duplicate skip prevents equivalent branch starts; it does not forbid multiple copies in a path.",
      mistakeTypes: ["duplicate_control_misread", "choice_filter_misread"],
      nextAction:
        "Tie duplicate skipping to the current loop depth, not to the value globally.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-004",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_same_depth_duplicate_skip",
    secondarySkillAtomIds: ["subset_generation", "duplicate_value_vs_index"],
    type: "single_choice",
    prompt:
      "nums is sorted as [1, 1, 2]. A subset problem may validly include both copies of 1. Which duplicate-control rule preserves [1, 1] while avoiding duplicate branches?",
    options: [
      {
        id: "i_gt_start",
        text: "Skip nums[i] only when i > startIndex and nums[i] === nums[i - 1].",
      },
      {
        id: "i_gt_zero",
        text: "Skip nums[i] whenever i > 0 and nums[i] === nums[i - 1].",
      },
      {
        id: "remove_all_second_copies",
        text: "Delete every second copy of each value before backtracking.",
      },
      {
        id: "dedupe_result_after",
        text: "Generate all subsets and remove duplicates from result afterward.",
      },
    ],
    correctAnswerId: "i_gt_start",
    feedbackModel: {
      decisionSignal:
        "i > startIndex skips duplicate choices only at the same depth, while still allowing a deeper branch to choose the second copy.",
      distractorExplanations: {
        i_gt_zero:
          "This skips the second 1 even when it is a valid deeper choice after the first 1 was selected.",
        remove_all_second_copies:
          "Removing duplicate input copies changes the valid output space when multiple copies may be used.",
        dedupe_result_after:
          "Post-processing hides duplicate branch generation instead of preventing it.",
      },
      mentalModelCorrection:
        "Duplicate values can represent distinct input copies. Control equivalent branch starts, not all repeated values.",
      mistakeTypes: [
        "duplicate_value_vs_index_confused",
        "same_depth_rule_missed",
      ],
      nextAction:
        "Check whether a duplicate is being considered at the same depth or after its previous copy was already chosen.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-005",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_same_depth_duplicate_skip",
    secondarySkillAtomIds: [
      "combination_generation",
      "backtracking_start_index_state",
    ],
    type: "single_choice",
    prompt:
      "Why does the common combination duplicate-skip rule use i > startIndex rather than i > 0?",
    options: [
      {
        id: "same_depth_only",
        text: "Because only duplicates chosen as alternatives at the same depth should be skipped.",
      },
      {
        id: "avoid_sorting",
        text: "Because i > startIndex removes the need to sort the input.",
      },
      {
        id: "force_boolean",
        text: "Because i > startIndex changes the result into a boolean existence check.",
      },
      {
        id: "skip_pruning",
        text: "Because i > startIndex replaces all constraint pruning.",
      },
    ],
    correctAnswerId: "same_depth_only",
    feedbackModel: {
      decisionSignal:
        "startIndex marks the beginning of the current depth’s loop, so i > startIndex identifies later duplicate alternatives at that same depth.",
      distractorExplanations: {
        avoid_sorting:
          "The neighbor comparison still relies on sorting equal values together.",
        force_boolean:
          "The duplicate-skip condition does not determine the return type.",
        skip_pruning:
          "Duplicate control and constraint pruning solve different problems.",
      },
      mentalModelCorrection:
        "The depth boundary is what separates an equivalent sibling branch from a valid deeper duplicate copy.",
      mistakeTypes: ["same_depth_rule_missed", "state_model_misread"],
      nextAction:
        "When reading duplicate-skip code, identify the loop depth boundary first.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-006",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_same_depth_duplicate_skip",
    secondarySkillAtomIds: ["combination_generation", "duplicate_control"],
    type: "single_choice",
    prompt:
      "A sorted combination search uses `if (i > 0 && nums[i] === nums[i - 1]) continue`. What is the main risk?",
    options: [
      {
        id: "skips_valid_deeper_copy",
        text: "It may skip a duplicate value even when the previous copy was chosen in an earlier depth and the second copy is valid.",
      },
      {
        id: "never_skips_duplicates",
        text: "It will never skip any duplicate values.",
      },
      {
        id: "turns_into_permutation",
        text: "It automatically turns the search into permutation generation.",
      },
      {
        id: "breaks_sorting",
        text: "It unsorts the input during recursion.",
      },
    ],
    correctAnswerId: "skips_valid_deeper_copy",
    feedbackModel: {
      decisionSignal:
        "i > 0 ignores the current recursion depth and can remove valid configurations that use multiple copies.",
      distractorExplanations: {
        never_skips_duplicates:
          "It does skip duplicates, but too aggressively.",
        turns_into_permutation:
          "The condition does not make order matter; it just filters candidates incorrectly.",
        breaks_sorting: "A condition cannot unsort the array.",
      },
      mentalModelCorrection:
        "Duplicate skip must be scoped to the depth where equivalent sibling branches are created.",
      mistakeTypes: ["same_depth_rule_missed", "valid_result_removed"],
      nextAction:
        "Replace global neighbor skip logic with depth-aware skip logic in combination/subset generation.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-007",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_combination_duplicate_control",
    secondarySkillAtomIds: [
      "combination_generation",
      "same_depth_duplicate_skip",
    ],
    type: "single_choice",
    prompt:
      "In sorted candidates [1a, 1b, 2], a combination search at the same loop depth could choose 1a or 1b as the next value. Why should the branch starting with 1b be skipped?",
    options: [
      {
        id: "equivalent_branch",
        text: "It produces the same value-level combinations as the branch starting with 1a at that depth.",
      },
      {
        id: "index_invalid",
        text: "Index 1 is always invalid in backtracking.",
      },
      {
        id: "value_cannot_repeat",
        text: "The value 1 can never appear more than once in any valid combination.",
      },
      {
        id: "target_already_reached",
        text: "Seeing 1b means the target has already been reached.",
      },
    ],
    correctAnswerId: "equivalent_branch",
    feedbackModel: {
      decisionSignal:
        "Equal values at the same depth represent equivalent choices for the next position in the combination.",
      distractorExplanations: {
        index_invalid:
          "The index is not inherently invalid; the branch is redundant because of value equality at this depth.",
        value_cannot_repeat:
          "Multiple copies may be valid if the input contains them and the rules allow using both.",
        target_already_reached:
          "Duplicate detection is unrelated to target completion.",
      },
      mentalModelCorrection:
        "Duplicate control skips redundant sibling branches, not all repeated values.",
      mistakeTypes: [
        "duplicate_value_vs_index_confused",
        "same_depth_rule_missed",
      ],
      nextAction:
        "Think in terms of equivalent branch roots at the current depth.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-008",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_combination_duplicate_control",
    secondarySkillAtomIds: [
      "choice_filter_misread",
      "backtracking_enumerate_choices",
    ],
    type: "single_choice",
    prompt:
      "In a sorted combination search, when should the same-depth duplicate check usually run?",
    options: [
      {
        id: "before_choose",
        text: "Before choosing the candidate and recursing into that branch.",
      },
      {
        id: "after_result_saved",
        text: "Only after a full result has already been saved.",
      },
      {
        id: "after_path_pop",
        text: "Only after undoing the candidate choice.",
      },
      {
        id: "after_sort_each_path",
        text: "After sorting the current path at every recursion level.",
      },
    ],
    correctAnswerId: "before_choose",
    feedbackModel: {
      decisionSignal:
        "Duplicate control should prevent entering an equivalent branch in the first place.",
      distractorExplanations: {
        after_result_saved:
          "That allows redundant branches to be generated before deduping.",
        after_path_pop:
          "After undo is too late to prevent the redundant branch just explored.",
        after_sort_each_path:
          "Sorting the path does not identify whether this loop candidate starts an equivalent sibling branch.",
      },
      mentalModelCorrection:
        "Skip duplicate candidates during choice enumeration, before committing to the branch.",
      mistakeTypes: ["duplicate_control_misread", "choice_filter_misread"],
      nextAction:
        "Place duplicate-skip checks beside candidate filtering, not result cleanup.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-009",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_combination_duplicate_control",
    secondarySkillAtomIds: ["target_sum_search", "same_depth_duplicate_skip"],
    type: "single_choice",
    prompt:
      "A combination-sum variant uses each candidate at most once and candidates may contain duplicate values. Which rule best avoids duplicate value-level combinations?",
    options: [
      {
        id: "skip_same_depth_duplicate",
        text: "Sort candidates, then skip nums[i] when i > startIndex and nums[i] === nums[i - 1].",
      },
      {
        id: "global_value_set",
        text: "Use one global set of values that can never be chosen again in any branch.",
      },
      {
        id: "dedupe_result_json",
        text: "Generate all branches and dedupe JSON strings of result paths at the end.",
      },
      {
        id: "visited_only",
        text: "Use visited only, with no duplicate-value rule.",
      },
    ],
    correctAnswerId: "skip_same_depth_duplicate",
    feedbackModel: {
      decisionSignal:
        "For at-most-once combinations with duplicate values, sorted same-depth skip removes redundant branch starts while preserving valid copies deeper when allowed.",
      distractorExplanations: {
        global_value_set:
          "A global value set can remove valid branches in unrelated parts of the search tree.",
        dedupe_result_json:
          "Post-processing hides duplicate branch generation and wastes search.",
        visited_only:
          "Visited tracks index usage but does not prevent equal-value branches from producing duplicate value-level combinations.",
      },
      mentalModelCorrection:
        "Index usage and value-level duplicate control are separate concerns.",
      mistakeTypes: ["duplicate_control_misread", "unnecessary_search_space"],
      nextAction:
        "For duplicate-valued combinations, combine sorted order with same-depth skip.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-010",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_permutation_duplicate_control",
    secondarySkillAtomIds: [
      "permutation_generation",
      "backtracking_visited_state",
    ],
    type: "single_choice",
    prompt:
      "A permutation generator receives sorted nums with duplicate values. It already uses visited to avoid reusing the same index. What additional issue remains?",
    options: [
      {
        id: "equal_value_permutations",
        text: "Different duplicate indices can still create the same value-level permutation.",
      },
      {
        id: "no_indices_available",
        text: "visited prevents every index from ever being chosen.",
      },
      {
        id: "path_cannot_store_values",
        text: "A path cannot store duplicate values.",
      },
      {
        id: "sorting_blocks_recursion",
        text: "Sorting prevents recursive calls from running.",
      },
    ],
    correctAnswerId: "equal_value_permutations",
    feedbackModel: {
      decisionSignal:
        "visited controls index reuse, but duplicate values can still swap equal copies and produce identical value sequences.",
      distractorExplanations: {
        no_indices_available:
          "visited only blocks indices already used in the current arrangement.",
        path_cannot_store_values:
          "A path can store duplicate values if the input contains duplicate copies.",
        sorting_blocks_recursion:
          "Sorting only arranges candidates; it does not prevent recursion.",
      },
      mentalModelCorrection:
        "Permutation duplicate control must handle both index usage and equal-value symmetry.",
      mistakeTypes: [
        "duplicate_value_vs_index_confused",
        "permutation_duplicate_control_missed",
      ],
      nextAction:
        "Ask whether swapping equal copies changes the value-level output. If not, control that symmetry.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "hard",
    id: "alg-backtracking-duplicate-011",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_permutation_duplicate_control",
    secondarySkillAtomIds: [
      "permutation_generation",
      "same_depth_duplicate_skip",
    ],
    type: "single_choice",
    prompt:
      "For sorted nums with duplicate values, a unique-permutations search often skips nums[i] when nums[i] === nums[i - 1] and the previous equal index is not visited. What does this prevent?",
    options: [
      {
        id: "using_later_copy_first",
        text: "Starting a permutation branch with a later equal copy before the earlier equal copy has been used.",
      },
      {
        id: "using_two_equal_values",
        text: "Using two equal values in the same permutation even when both copies exist.",
      },
      {
        id: "choosing_any_later_index",
        text: "Choosing any index greater than i.",
      },
      {
        id: "saving_completed_path",
        text: "Saving a completed permutation at the base case.",
      },
    ],
    correctAnswerId: "using_later_copy_first",
    feedbackModel: {
      decisionSignal:
        "If the previous equal copy is unused, choosing the later copy first creates a symmetric duplicate branch.",
      distractorExplanations: {
        using_two_equal_values:
          "Both copies may be needed in a valid permutation; the rule controls their relative branch order.",
        choosing_any_later_index:
          "The rule applies only to equal neighboring values, not all later indices.",
        saving_completed_path:
          "Result saving is separate from duplicate branch prevention.",
      },
      mentalModelCorrection:
        "For duplicate permutations, equal copies need a consistent ordering rule within the current branch.",
      mistakeTypes: [
        "permutation_duplicate_control_missed",
        "duplicate_value_vs_index_confused",
      ],
      nextAction:
        "When values are equal, decide which copy is allowed to represent the branch first.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "hard",
    id: "alg-backtracking-duplicate-012",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_permutation_duplicate_control",
    secondarySkillAtomIds: [
      "permutation_generation",
      "visited_state_reasoning",
    ],
    type: "single_choice",
    prompt:
      "In unique permutations, why does the rule check `!visited[i - 1]` for a previous equal value?",
    options: [
      {
        id: "same_level_symmetry",
        text: "It detects that the earlier equal copy is not part of the current prefix, so choosing the later copy would start a duplicate sibling branch.",
      },
      {
        id: "previous_copy_invalid",
        text: "It proves the previous equal copy is invalid in every permutation.",
      },
      {
        id: "path_complete",
        text: "It proves the current permutation is complete.",
      },
      {
        id: "target_exceeded",
        text: "It proves the numeric target has been exceeded.",
      },
    ],
    correctAnswerId: "same_level_symmetry",
    feedbackModel: {
      decisionSignal:
        "!visited[i - 1] means the earlier equal copy has not been committed in this branch, so the later copy would represent the same choice order.",
      distractorExplanations: {
        previous_copy_invalid:
          "The previous copy is valid; the rule prefers using it before the later equal copy.",
        path_complete: "Duplicate-skip logic does not determine completion.",
        target_exceeded:
          "This rule is about equal-value symmetry, not numeric pruning.",
      },
      mentalModelCorrection:
        "The visited status of the previous duplicate tells whether this is a valid deeper use or a redundant sibling choice.",
      mistakeTypes: [
        "visited_state_misread",
        "permutation_duplicate_control_missed",
      ],
      nextAction:
        "Interpret duplicate-permutation rules in terms of branch symmetry, not value validity.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "hard",
    id: "alg-backtracking-duplicate-013",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_permutation_duplicate_control",
    secondarySkillAtomIds: [
      "permutation_generation",
      "duplicate_value_vs_index",
    ],
    type: "single_choice",
    prompt:
      "nums is [1a, 1b, 2]. A unique-permutation search should still produce permutations containing both 1s. Which rule is wrong?",
    options: [
      {
        id: "global_value_ban",
        text: "Once value 1 has been used anywhere in the path, never allow another 1.",
      },
      {
        id: "index_visited",
        text: "Do not reuse the same input index in one permutation.",
      },
      {
        id: "sorted_duplicate_order",
        text: "Use sorted order plus a duplicate rule to avoid starting symmetric branches.",
      },
      {
        id: "copy_result_path",
        text: "Copy the completed path when saving a result.",
      },
    ],
    correctAnswerId: "global_value_ban",
    feedbackModel: {
      decisionSignal:
        "Duplicate input copies can both be part of a valid permutation; the problem is duplicate branch symmetry, not repeated value usage itself.",
      distractorExplanations: {
        index_visited:
          "Index-level visited is needed to avoid reusing the exact same copy.",
        sorted_duplicate_order:
          "A consistent duplicate-order rule is the correct way to avoid symmetric duplicate permutations.",
        copy_result_path:
          "Copying path preserves completed results and is not a duplicate-control error.",
      },
      mentalModelCorrection:
        "Do not collapse duplicate values into one copy when the input multiplicity matters.",
      mistakeTypes: [
        "duplicate_value_vs_index_confused",
        "valid_result_removed",
      ],
      nextAction: "Distinguish value equality from input-copy identity.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-014",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_duplicate_result_deduping",
    secondarySkillAtomIds: [
      "backtracking_duplicate_control",
      "unnecessary_search_space",
    ],
    type: "single_choice",
    prompt:
      "A backtracking solution generates duplicate subsets, then removes duplicates by serializing every result into a Set. What is the main weakness of this approach?",
    options: [
      {
        id: "hides_bad_search_tree",
        text: "It hides duplicate branch generation instead of preventing equivalent branches during search.",
      },
      {
        id: "cannot_remove_any_duplicates",
        text: "A Set can never remove duplicate serialized values.",
      },
      {
        id: "prevents_sorting",
        text: "Using a Set prevents the input from being sorted.",
      },
      {
        id: "changes_to_binary_search",
        text: "Serializing results turns the algorithm into binary search.",
      },
    ],
    correctAnswerId: "hides_bad_search_tree",
    feedbackModel: {
      decisionSignal:
        "Duplicate control should reduce the search space before recursion enters redundant branches.",
      distractorExplanations: {
        cannot_remove_any_duplicates:
          "A Set may remove serialized duplicates, but that is post-processing rather than correct branch control.",
        prevents_sorting:
          "A Set does not prevent sorting; it is simply the wrong layer for this problem.",
        changes_to_binary_search:
          "Serialization has nothing to do with binary search.",
      },
      mentalModelCorrection:
        "Fix duplicate generation at the branch-choice level, not as cleanup after the full search.",
      mistakeTypes: ["duplicate_control_misread", "unnecessary_search_space"],
      nextAction:
        "Replace result-level dedupe with sorted same-depth skip where appropriate.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-015",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_duplicate_result_deduping",
    secondarySkillAtomIds: [
      "backtracking_duplicate_control",
      "debugging_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A developer says: 'The algorithm is fine because duplicate outputs are removed at the end.' What should the feedback focus on?",
    options: [
      {
        id: "branch_logic_wrong_layer",
        text: "The search is still exploring redundant equivalent branches; duplicate control belongs in candidate selection.",
      },
      {
        id: "more_global_flags",
        text: "Add a side flag that marks the duplicate issue as known.",
      },
      {
        id: "ignore_duplicates",
        text: "Duplicates do not matter in backtracking output.",
      },
      {
        id: "remove_base_case",
        text: "Remove the base case so duplicate outputs are not saved.",
      },
    ],
    correctAnswerId: "branch_logic_wrong_layer",
    feedbackModel: {
      decisionSignal:
        "Correct duplicate control prevents equivalent branches, instead of masking their outputs afterward.",
      distractorExplanations: {
        more_global_flags: "Marking the issue does not fix the search logic.",
        ignore_duplicates:
          "Duplicate outputs violate a unique-result contract.",
        remove_base_case:
          "Removing result collection breaks the algorithm entirely.",
      },
      mentalModelCorrection:
        "Post-processing duplicate results is a symptom-level fix; backtracking should avoid redundant branch creation.",
      mistakeTypes: ["duplicate_control_misread", "wrong_layer_fix"],
      nextAction:
        "Inspect the loop that chooses candidates and add a depth-aware duplicate-skip rule there.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-duplicate-016",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_duplicate_value_vs_index",
    secondarySkillAtomIds: [
      "duplicate_value_vs_index",
      "backtracking_duplicate_control",
    ],
    type: "single_choice",
    prompt:
      "An input contains two equal values at different indices. Which statement best captures the duplicate-control problem?",
    options: [
      {
        id: "same_value_different_copy",
        text: "The copies are different input indices, but choosing them in symmetric ways can produce the same value-level output.",
      },
      {
        id: "same_index",
        text: "Equal values always mean the same input index was used twice.",
      },
      {
        id: "must_delete_one",
        text: "One copy must always be deleted before backtracking starts.",
      },
      {
        id: "no_duplicate_issue",
        text: "Equal values never affect backtracking output.",
      },
    ],
    correctAnswerId: "same_value_different_copy",
    feedbackModel: {
      decisionSignal:
        "Backtracking may need to respect input multiplicity while preventing symmetric branches that produce identical value outputs.",
      distractorExplanations: {
        same_index:
          "Equal values can live at different indices and represent different copies.",
        must_delete_one:
          "Deleting a copy changes valid outputs when multiple copies can be used.",
        no_duplicate_issue:
          "Equal values often create duplicate value-level configurations unless controlled.",
      },
      mentalModelCorrection:
        "Duplicate control is about value-level symmetry over index-level copies.",
      mistakeTypes: [
        "duplicate_value_vs_index_confused",
        "duplicate_control_misread",
      ],
      nextAction:
        "Track whether the problem cares about input copies, value-level outputs, or both.",
      result: "diagnostic",
    },
  },
];
