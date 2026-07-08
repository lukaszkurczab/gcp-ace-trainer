export const baseCaseAndResultContractQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-base-result-001",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_base_case_contract",
    secondarySkillAtomIds: [
      "backtracking_result_collection",
      "subset_generation",
    ],
    type: "single_choice",
    prompt:
      "A backtracking function generates all subsets by deciding whether to include or skip each element. It has just reached index === nums.length. What should happen?",
    options: [
      {
        id: "save_path_snapshot",
        text: "Save a snapshot of the current path because every include/skip decision has been made.",
      },
      {
        id: "continue_branching",
        text: "Continue branching because more elements might still be added later.",
      },
      {
        id: "discard_path",
        text: "Discard the path because reaching the end means no valid subset was found.",
      },
      {
        id: "sort_path",
        text: "Sort the path before deciding whether it is a valid subset.",
      },
    ],
    correctAnswerId: "save_path_snapshot",
    feedbackModel: {
      decisionSignal:
        "For subset generation, index === nums.length means all include/skip decisions are complete, so the current path is one valid result.",
      distractorExplanations: {
        continue_branching:
          "There are no remaining elements to branch on. Continuing would read beyond the input.",
        discard_path:
          "The empty path and partial paths are valid subsets unless the prompt adds a separate constraint.",
        sort_path:
          "Sorting is unrelated to the subset base case and may change the order contract if order matters.",
      },
      mentalModelCorrection:
        "A base case is not always failure. In generation problems, reaching the end can mean the current path is complete.",
      mistakeTypes: ["base_case_misread", "output_contract_misread"],
      nextAction:
        "Identify whether reaching the end means 'all decisions are complete' or 'no answer exists'.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-002",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_base_case_contract",
    secondarySkillAtomIds: [
      "backtracking_full_input_consumption",
      "constraint_checking",
    ],
    type: "single_choice",
    prompt:
      "A choose/skip search needs subsets whose sum is exactly target. The recursion reaches index === nums.length, but the current sum is not target. What is the correct result contract?",
    options: [
      {
        id: "discard_without_saving",
        text: "Return without saving because all decisions are complete but the path does not satisfy the target.",
      },
      {
        id: "save_anyway",
        text: "Save the path because reaching the end always creates a valid subset.",
      },
      {
        id: "reset_sum",
        text: "Reset the sum to zero and continue from the start.",
      },
      {
        id: "save_if_non_empty",
        text: "Save the path as long as it contains at least one element.",
      },
    ],
    correctAnswerId: "discard_without_saving",
    feedbackModel: {
      decisionSignal:
        "The base case must combine input exhaustion with the output constraint: the path is complete, but it is only valid if its sum equals target.",
      distractorExplanations: {
        save_anyway:
          "Reaching the end completes the decision process, but it does not automatically satisfy the target constraint.",
        reset_sum:
          "Restarting inside the base case would duplicate search and break the recursion contract.",
        save_if_non_empty:
          "Non-empty is not the required result condition. The prompt requires exact target sum.",
      },
      mentalModelCorrection:
        "A base case can be reached with either a valid or invalid complete path. The result contract decides whether to save it.",
      mistakeTypes: ["output_contract_misread", "constraint_ignored"],
      nextAction:
        "At the terminal index, check the exact output condition before collecting a path.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-base-result-003",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_exact_length_contract",
    secondarySkillAtomIds: [
      "combination_generation",
      "backtracking_result_collection",
    ],
    type: "single_choice",
    prompt:
      "A function returns all combinations of exactly k elements. During recursion, path.length becomes k while there are still unused candidates. What should happen?",
    options: [
      {
        id: "save_and_return",
        text: "Save a snapshot of path and return from this branch because the combination already has the required length.",
      },
      {
        id: "keep_adding",
        text: "Keep adding candidates until the input is exhausted.",
      },
      {
        id: "discard_path",
        text: "Discard the path because not all candidates have been considered.",
      },
      {
        id: "clear_path",
        text: "Clear path and continue from the next candidate.",
      },
    ],
    correctAnswerId: "save_and_return",
    feedbackModel: {
      decisionSignal:
        "The output contract is exactly k elements, so path.length === k is a positive completion condition.",
      distractorExplanations: {
        keep_adding:
          "Adding more elements would violate the exact-length contract.",
        discard_path:
          "The goal is not to consume every candidate; it is to build combinations of size k.",
        clear_path:
          "Clearing path would lose a valid result and corrupt the branch state.",
      },
      mentalModelCorrection:
        "Some backtracking base cases depend on the result shape, not on reaching the end of the input.",
      mistakeTypes: ["base_case_misread", "output_contract_misread"],
      nextAction:
        "Check whether the result is complete by length, target, index, or another explicit contract.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-004",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_exact_length_contract",
    secondarySkillAtomIds: [
      "combination_generation",
      "unnecessary_search_space",
    ],
    type: "single_choice",
    prompt:
      "A combination generator needs exactly k selected values. The branch already has k values in path. Why is waiting until index === nums.length a weak base-case choice?",
    options: [
      {
        id: "does_extra_work",
        text: "It keeps exploring candidates even though the current path already satisfies the exact output size.",
      },
      {
        id: "misses_empty_combination",
        text: "It prevents the empty combination from being generated.",
      },
      {
        id: "forces_sorting",
        text: "It requires the input to be sorted before any result can be saved.",
      },
      {
        id: "changes_to_boolean",
        text: "It changes the function from collecting results to returning a boolean.",
      },
    ],
    correctAnswerId: "does_extra_work",
    feedbackModel: {
      decisionSignal:
        "When exact length is the completion contract, continuing after path.length === k explores states that cannot produce a better-shaped result.",
      distractorExplanations: {
        misses_empty_combination:
          "The issue is not the empty combination. The issue is delaying collection after the required size is already reached.",
        forces_sorting:
          "Sorting may help duplicate handling, but it is not caused by the base-case location.",
        changes_to_boolean:
          "A late base case does not automatically change the return type; it makes the search less precise.",
      },
      mentalModelCorrection:
        "The best base case should match the earliest point at which the output contract is fully satisfied.",
      mistakeTypes: ["unnecessary_search_space", "base_case_misread"],
      nextAction:
        "For exact-size outputs, test path.length before spending work on further candidates.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-base-result-005",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_target_reached_contract",
    secondarySkillAtomIds: [
      "target_sum_search",
      "backtracking_result_collection",
    ],
    type: "single_choice",
    prompt:
      "A backtracking search builds combinations whose numbers must sum to target. It tracks remaining = target - currentSum. What does remaining === 0 mean?",
    options: [
      {
        id: "save_current_path",
        text: "The current path exactly satisfies the target and should be collected according to the result contract.",
      },
      {
        id: "branch_failed",
        text: "The branch failed because no remaining target is left.",
      },
      {
        id: "must_add_zero",
        text: "The algorithm must add a zero-valued candidate before saving.",
      },
      {
        id: "restart_search",
        text: "The search should restart from the first candidate.",
      },
    ],
    correctAnswerId: "save_current_path",
    feedbackModel: {
      decisionSignal:
        "remaining === 0 is the positive exact-target base case: the path sums to target.",
      distractorExplanations: {
        branch_failed:
          "A failed overshoot is usually remaining < 0, not remaining === 0.",
        must_add_zero:
          "The path already satisfies the target. Adding more values would usually break an exact-sum contract.",
        restart_search:
          "Restarting is not part of the result contract and would duplicate search.",
      },
      mentalModelCorrection:
        "Exact target problems usually distinguish success at zero from failure below zero.",
      mistakeTypes: ["base_case_misread", "constraint_ignored"],
      nextAction:
        "Separate 'target reached' from 'target exceeded' before writing the terminal condition.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-006",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_target_reached_contract",
    secondarySkillAtomIds: ["constraint_pruning", "target_sum_search"],
    type: "single_choice",
    prompt:
      "In an exact target-sum backtracking problem with only positive numbers, which condition is the positive result base case rather than a failed-branch pruning condition?",
    options: [
      {
        id: "remaining_zero",
        text: "remaining === 0",
      },
      {
        id: "remaining_negative",
        text: "remaining < 0",
      },
      {
        id: "candidate_too_large",
        text: "candidate > remaining",
      },
      {
        id: "index_out_of_bounds",
        text: "index > nums.length",
      },
    ],
    correctAnswerId: "remaining_zero",
    feedbackModel: {
      decisionSignal:
        "A zero remaining target means the current path exactly matches the required sum.",
      distractorExplanations: {
        remaining_negative:
          "This is a failed branch for positive numbers because the path overshot the target.",
        candidate_too_large:
          "This can be a pruning signal for a candidate, not the positive result condition.",
        index_out_of_bounds:
          "An out-of-bounds index is a boundary guard, not a successful result.",
      },
      mentalModelCorrection:
        "Do not group all stopping conditions together. Success, failure, and boundary guards have different meanings.",
      mistakeTypes: ["base_case_misread", "pruning_confused_with_success"],
      nextAction:
        "Label each stopping condition as success, failed branch, or safety boundary.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-007",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_target_reached_contract",
    secondarySkillAtomIds: [
      "backtracking_result_collection",
      "exact_match_contract",
    ],
    type: "single_choice",
    prompt:
      "A branch reaches remaining === 0 in a problem that asks for combinations summing exactly to target. All candidates are positive. What should usually happen after saving the current path?",
    options: [
      {
        id: "return_from_branch",
        text: "Return from this branch because adding more positive numbers would exceed the exact target.",
      },
      {
        id: "continue_adding",
        text: "Continue adding candidates because longer paths may also be valid.",
      },
      {
        id: "remove_first_element",
        text: "Remove the first element from path and keep recursing.",
      },
      {
        id: "reset_remaining",
        text: "Reset remaining to target and continue in the same branch.",
      },
    ],
    correctAnswerId: "return_from_branch",
    feedbackModel: {
      decisionSignal:
        "With positive candidates and an exact-sum contract, remaining === 0 completes the path; further additions would overshoot.",
      distractorExplanations: {
        continue_adding:
          "Longer paths cannot remain valid if every extra candidate is positive.",
        remove_first_element:
          "Removing earlier choices is part of normal undo after the recursive call returns, not the result contract.",
        reset_remaining:
          "Resetting remaining would mix separate branches and duplicate results.",
      },
      mentalModelCorrection:
        "After a positive base case, decide whether the contract allows extension. Exact target with positive values usually does not.",
      mistakeTypes: ["output_contract_misread", "unnecessary_search_space"],
      nextAction:
        "Ask whether any extension of a saved path could still satisfy the same result contract.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-base-result-008",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_boolean_result",
    secondarySkillAtomIds: [
      "backtracking_first_vs_all_results",
      "existence_search",
    ],
    type: "single_choice",
    prompt:
      "A backtracking function only needs to return whether at least one valid configuration exists. A recursive branch finds a valid configuration. What should the result contract do?",
    options: [
      {
        id: "return_true",
        text: "Return true so the success can propagate up the call stack.",
      },
      {
        id: "push_path",
        text: "Push the path into an array of all results and continue every branch.",
      },
      {
        id: "return_false",
        text: "Return false because other branches have not been checked yet.",
      },
      {
        id: "ignore_success",
        text: "Ignore this branch and wait until the full search tree is exhausted.",
      },
    ],
    correctAnswerId: "return_true",
    feedbackModel: {
      decisionSignal:
        "The output is boolean existence, so the first valid configuration is enough to answer the problem.",
      distractorExplanations: {
        push_path:
          "Collecting all paths solves a broader output contract than the prompt asks for.",
        return_false:
          "A valid configuration proves existence, so false would contradict the found result.",
        ignore_success:
          "Exhausting the whole tree is unnecessary when existence has already been proven.",
      },
      mentalModelCorrection:
        "The result type controls whether success is collected, counted, returned immediately, or propagated as a boolean.",
      mistakeTypes: ["output_contract_misread", "unnecessary_search_space"],
      nextAction:
        "Before writing result handling, state whether the function returns boolean, one result, all results, or a count.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-009",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_first_vs_all_results",
    secondarySkillAtomIds: [
      "backtracking_result_collection",
      "output_contract_misread",
    ],
    type: "single_choice",
    prompt:
      "A problem asks for all valid combinations. The first valid combination is found early. What is the correct global result behavior?",
    options: [
      {
        id: "save_and_continue_other_branches",
        text: "Save it, then allow the search to continue so other valid combinations can also be collected.",
      },
      {
        id: "return_from_entire_search",
        text: "Stop the entire search immediately because one valid combination proves the problem is solved.",
      },
      {
        id: "discard_first_result",
        text: "Discard the first result because early results are usually incomplete.",
      },
      {
        id: "replace_result_each_time",
        text: "Keep only the latest valid combination found.",
      },
    ],
    correctAnswerId: "save_and_continue_other_branches",
    feedbackModel: {
      decisionSignal:
        "The output contract says all valid combinations, so one success does not complete the whole search.",
      distractorExplanations: {
        return_from_entire_search:
          "That would be correct for boolean existence or first-solution search, not for collecting all results.",
        discard_first_result:
          "A valid result does not become invalid because it was found early.",
        replace_result_each_time:
          "Replacing results loses earlier valid combinations and violates the collect-all contract.",
      },
      mentalModelCorrection:
        "A branch may be complete while the overall search is not complete.",
      mistakeTypes: ["output_contract_misread", "early_return_misused"],
      nextAction:
        "Separate returning from one branch after saving from terminating the whole search.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-010",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_first_vs_all_results",
    secondarySkillAtomIds: [
      "backtracking_boolean_result",
      "first_solution_contract",
    ],
    type: "single_choice",
    prompt:
      "A problem asks for any one valid arrangement, not all arrangements. A branch finds a valid arrangement. Which result contract is most appropriate?",
    options: [
      {
        id: "return_solution_immediately",
        text: "Return the found arrangement or a success signal immediately so the search can stop.",
      },
      {
        id: "keep_collecting_all",
        text: "Continue searching every branch to collect all possible arrangements.",
      },
      {
        id: "count_only",
        text: "Increment a count and discard the actual arrangement.",
      },
      {
        id: "continue_until_longest",
        text: "Continue until the longest possible arrangement is found.",
      },
    ],
    correctAnswerId: "return_solution_immediately",
    feedbackModel: {
      decisionSignal:
        "The prompt asks for any one valid arrangement, so the first success satisfies the output contract.",
      distractorExplanations: {
        keep_collecting_all:
          "Collecting all arrangements is unnecessary and may be much more expensive.",
        count_only:
          "A count does not satisfy a prompt that asks for an actual arrangement.",
        continue_until_longest:
          "There is no optimization objective for longest arrangement in the prompt.",
      },
      mentalModelCorrection:
        "First-solution, boolean-existence, count, and collect-all problems should not share the same result handling.",
      mistakeTypes: ["output_contract_misread", "unnecessary_search_space"],
      nextAction:
        "Classify the requested output before deciding whether to stop after the first success.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-base-result-011",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_path_snapshot",
    secondarySkillAtomIds: [
      "backtracking_result_collection",
      "mutable_state_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A backtracking function stores valid paths in result. The same path array is mutated with push and pop during search. What should be stored when a valid path is found?",
    options: [
      {
        id: "copy_path",
        text: "A copy of the current path, such as [...path].",
      },
      {
        id: "same_path_reference",
        text: "The path array itself, because it currently contains the correct values.",
      },
      {
        id: "last_element_only",
        text: "Only the last added value, because earlier values are already known.",
      },
      {
        id: "path_length_only",
        text: "Only path.length, because the result can be reconstructed later.",
      },
    ],
    correctAnswerId: "copy_path",
    feedbackModel: {
      decisionSignal:
        "The path array will continue to mutate after the result is saved, so the result needs a snapshot.",
      distractorExplanations: {
        same_path_reference:
          "All saved results would point to the same mutable array and change as backtracking continues.",
        last_element_only:
          "The output contract asks for the full path, not just the newest choice.",
        path_length_only: "Length does not preserve which values were chosen.",
      },
      mentalModelCorrection:
        "Saving a result should freeze the current logical path, not store the mutable work buffer.",
      mistakeTypes: ["mutable_state_leak", "output_contract_misread"],
      nextAction:
        "Whenever path is mutated after recursion, save a snapshot at the positive base case.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-012",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_path_snapshot",
    secondarySkillAtomIds: [
      "mutable_state_reasoning",
      "backtracking_result_collection",
    ],
    type: "single_choice",
    prompt:
      "A result array unexpectedly contains many identical empty arrays after backtracking finishes. Which result-contract mistake most likely caused this?",
    options: [
      {
        id: "stored_mutable_reference",
        text: "The code pushed the mutable path reference instead of a snapshot at the base case.",
      },
      {
        id: "returned_too_early",
        text: "The code returned from the branch immediately after saving a valid path.",
      },
      {
        id: "checked_remaining_zero",
        text: "The code used remaining === 0 as a success condition.",
      },
      {
        id: "used_index_base_case",
        text: "The code checked index === nums.length before saving a subset.",
      },
    ],
    correctAnswerId: "stored_mutable_reference",
    feedbackModel: {
      decisionSignal:
        "Identical final arrays usually mean each result entry points to the same path object after it has been popped back to empty.",
      distractorExplanations: {
        returned_too_early:
          "Returning after saving a complete branch is often correct and does not by itself create shared references.",
        checked_remaining_zero:
          "remaining === 0 can be a valid success condition for exact-target problems.",
        used_index_base_case:
          "index === nums.length can be the correct base case for subset generation.",
      },
      mentalModelCorrection:
        "The result contract includes the representation stored in result, not only the condition that triggers saving.",
      mistakeTypes: ["mutable_state_leak", "result_snapshot_missing"],
      nextAction:
        "Inspect whether result.push receives a snapshot or the live path object.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-013",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_full_input_consumption",
    secondarySkillAtomIds: [
      "string_segmentation",
      "backtracking_result_collection",
    ],
    type: "single_choice",
    prompt:
      "A backtracking function partitions a string into valid segments. It has built some valid segments and index === s.length. What does this usually mean?",
    options: [
      {
        id: "save_segments",
        text: "The whole input has been consumed, so the current segment list can be saved if it satisfies any extra output constraints.",
      },
      {
        id: "continue_splitting",
        text: "Continue choosing more segment endings because more segments may exist after the string ends.",
      },
      {
        id: "discard_always",
        text: "Discard the current segments because reaching the end means the branch failed.",
      },
      {
        id: "merge_segments",
        text: "Merge all segments into one string before deciding whether to save.",
      },
    ],
    correctAnswerId: "save_segments",
    feedbackModel: {
      decisionSignal:
        "For segmentation, consuming the whole string is the positive completion signal, provided the segment list meets the required constraints.",
      distractorExplanations: {
        continue_splitting: "No characters remain to form another segment.",
        discard_always:
          "Reaching the end is exactly what a complete partition should do.",
        merge_segments:
          "Merging segments would destroy the partition structure requested by the problem.",
      },
      mentalModelCorrection:
        "In partitioning problems, the result is complete only when the selected segments cover the entire input.",
      mistakeTypes: ["base_case_misread", "full_input_consumption_missed"],
      nextAction:
        "For string segmentation, check whether every character has been consumed before saving.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-014",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_full_input_consumption",
    secondarySkillAtomIds: [
      "string_segmentation",
      "exact_segment_count_contract",
    ],
    type: "single_choice",
    prompt:
      "A restore-IP style backtracking problem needs exactly 4 valid segments and must use the entire string. Which condition best matches the positive result contract?",
    options: [
      {
        id: "four_segments_and_consumed",
        text: "segments.length === 4 and index === s.length",
      },
      {
        id: "four_segments_only",
        text: "segments.length === 4, even if characters remain unused",
      },
      {
        id: "consumed_only",
        text: "index === s.length, regardless of how many segments were created",
      },
      {
        id: "first_valid_segment",
        text: "The first segment is valid",
      },
    ],
    correctAnswerId: "four_segments_and_consumed",
    feedbackModel: {
      decisionSignal:
        "The output contract has two requirements: exactly four segments and full consumption of the input.",
      distractorExplanations: {
        four_segments_only:
          "Four segments are not enough if some characters were never used.",
        consumed_only:
          "Using all characters is not enough if the required segment count is wrong.",
        first_valid_segment:
          "A valid prefix segment is only a partial path, not a complete result.",
      },
      mentalModelCorrection:
        "When the prompt has multiple completion requirements, the positive base case must check all of them.",
      mistakeTypes: ["output_contract_misread", "partial_solution_saved"],
      nextAction:
        "List every condition that must be true for a result to be complete, not just locally valid.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-015",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_base_case_contract",
    secondarySkillAtomIds: ["parentheses_generation", "exact_length_contract"],
    type: "single_choice",
    prompt:
      "A valid-parentheses generator only recurses into prefixes that satisfy openCount <= n and closeCount <= openCount. It tracks openCount, closeCount, and path. Which condition marks a complete result?",
    options: [
      {
        id: "length_two_n",
        text: "path.length === 2 * n",
      },
      {
        id: "open_equals_close_early",
        text: "openCount === closeCount at any point during construction",
      },
      {
        id: "open_count_n",
        text: "openCount === n, even if closeCount is smaller",
      },
      {
        id: "first_close_added",
        text: "The first closing parenthesis has been added.",
      },
    ],
    correctAnswerId: "length_two_n",
    feedbackModel: {
      decisionSignal:
        "A valid parentheses string with n pairs is complete only after all 2n characters have been placed.",
      distractorExplanations: {
        open_equals_close_early:
          "Counts can be equal in a valid prefix such as an already closed smaller group, but the full string may not be complete yet.",
        open_count_n:
          "All opening parentheses have been used, but closing parentheses may still be missing.",
        first_close_added:
          "Adding a closing parenthesis is just one construction step, not a completion signal.",
      },
      mentalModelCorrection:
        "For generation tasks, a locally valid prefix is not the same as a complete output.",
      mistakeTypes: ["partial_solution_saved", "output_contract_misread"],
      nextAction: "Distinguish prefix validity from final output length.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-016",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_base_case_contract",
    secondarySkillAtomIds: [
      "grid_search_backtracking",
      "boolean_result_contract",
    ],
    type: "single_choice",
    prompt:
      "In a word-search backtracking function, wordIndex tracks the next character to match. What is the positive base case for a boolean search?",
    options: [
      {
        id: "all_chars_matched",
        text: "wordIndex === word.length",
      },
      {
        id: "hit_grid_edge",
        text: "The search reaches any grid boundary.",
      },
      {
        id: "first_char_matched",
        text: "The current cell matches the first character of the word.",
      },
      {
        id: "no_neighbors_left",
        text: "The current cell has no unvisited neighbors.",
      },
    ],
    correctAnswerId: "all_chars_matched",
    feedbackModel: {
      decisionSignal:
        "If wordIndex has advanced past the last character, every character in the word has been matched.",
      distractorExplanations: {
        hit_grid_edge:
          "A boundary can be a guard or failed move condition, not proof that the word was found.",
        first_char_matched:
          "Matching the first character only starts a candidate path.",
        no_neighbors_left:
          "Running out of neighbors may be failure unless the whole word has already been matched.",
      },
      mentalModelCorrection:
        "For boolean path search, success should represent the full target being matched, not a local movement condition.",
      mistakeTypes: ["base_case_misread", "partial_solution_saved"],
      nextAction:
        "Tie the success condition to the target being fully consumed.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-017",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_base_case_contract",
    secondarySkillAtomIds: ["tree_path_reasoning", "leaf_result_contract"],
    type: "single_choice",
    prompt:
      "A recursive search collects root-to-leaf paths in a tree. The current path reaches an internal node whose value already satisfies a partial condition. What should determine whether the path is saved?",
    options: [
      {
        id: "leaf_and_contract",
        text: "Save only when the node is a leaf and the full root-to-leaf path satisfies the requested condition.",
      },
      {
        id: "partial_condition",
        text: "Save immediately when any internal node satisfies the partial condition.",
      },
      {
        id: "left_child_exists",
        text: "Save whenever the node has a left child.",
      },
      {
        id: "path_non_empty",
        text: "Save every non-empty path because every prefix is a root-to-leaf path.",
      },
    ],
    correctAnswerId: "leaf_and_contract",
    feedbackModel: {
      decisionSignal:
        "The output contract is root-to-leaf paths, so a result is complete only at a leaf and only if the full path satisfies the condition.",
      distractorExplanations: {
        partial_condition:
          "An internal node gives only a prefix path, not a complete root-to-leaf result.",
        left_child_exists:
          "Having a child proves the opposite of being a leaf.",
        path_non_empty:
          "A non-empty prefix is not necessarily a root-to-leaf path.",
      },
      mentalModelCorrection:
        "A valid prefix can guide the search, but the result contract decides when a path is complete enough to save.",
      mistakeTypes: ["partial_solution_saved", "output_contract_misread"],
      nextAction:
        "For path problems, identify whether the output asks for prefixes, any path, or complete root-to-leaf paths.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-base-result-018",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_result_collection",
    secondarySkillAtomIds: ["count_result_contract", "output_contract_misread"],
    type: "single_choice",
    prompt:
      "A backtracking problem asks only for the number of valid configurations, not the configurations themselves. A branch reaches a complete valid configuration. What should the result contract usually do?",
    options: [
      {
        id: "increment_count",
        text: "Increment the count and return from that complete branch.",
      },
      {
        id: "store_path",
        text: "Store a copy of path in an array of all configurations.",
      },
      {
        id: "return_path",
        text: "Return the current path as the final answer.",
      },
      {
        id: "ignore_branch",
        text: "Ignore the branch because no concrete configuration was requested.",
      },
    ],
    correctAnswerId: "increment_count",
    feedbackModel: {
      decisionSignal:
        "The requested output is a count, so each complete valid configuration contributes one to the answer.",
      distractorExplanations: {
        store_path:
          "Storing every path solves a heavier collect-all problem than the prompt asks for.",
        return_path:
          "Returning one path loses the count of other valid configurations.",
        ignore_branch:
          "Even without returning the configuration itself, the branch must contribute to the count.",
      },
      mentalModelCorrection:
        "The same success condition can feed different result contracts: collect path, return true, return one solution, or increment count.",
      mistakeTypes: ["output_contract_misread", "unnecessary_memory_usage"],
      nextAction:
        "Match the base-case action to the exact requested return type.",
      result: "diagnostic",
    },
  },
];
