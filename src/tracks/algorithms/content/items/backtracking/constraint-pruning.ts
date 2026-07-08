export const constraintPruningQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-pruning-001",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_target_overshoot_pruning",
    secondarySkillAtomIds: [
      "backtracking_constraint_pruning",
      "target_sum_search",
    ],
    type: "single_choice",
    prompt:
      "A backtracking search uses only positive numbers to build combinations that sum to target. The branch reaches remaining < 0. What should happen?",
    options: [
      {
        id: "prune_branch",
        text: "Return from this branch because adding more positive numbers cannot repair the overshoot.",
      },
      {
        id: "save_path",
        text: "Save the current path because the branch has passed the target.",
      },
      {
        id: "reset_remaining",
        text: "Reset remaining to target and continue from the same path.",
      },
      {
        id: "sort_path",
        text: "Sort the current path and keep searching.",
      },
    ],
    correctAnswerId: "prune_branch",
    feedbackModel: {
      decisionSignal:
        "With positive candidates, remaining < 0 means the branch has overshot the target and cannot recover by adding more values.",
      distractorExplanations: {
        save_path: "Passing the target is not success in an exact-sum problem.",
        reset_remaining:
          "Resetting remaining breaks the branch state and duplicates search.",
        sort_path:
          "Sorting the chosen values does not change their sum or repair the overshoot.",
      },
      mentalModelCorrection:
        "Pruning means stopping a branch because the current partial state can no longer lead to a valid result.",
      mistakeTypes: ["pruning_missed", "constraint_ignored"],
      nextAction:
        "For target problems, separate exact success from overshoot failure.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-002",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_pruning_assumption_check",
    secondarySkillAtomIds: [
      "backtracking_target_overshoot_pruning",
      "constraint_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A backtracking search prunes with `if (currentSum > target) return`. Under which constraint is this pruning safe?",
    options: [
      {
        id: "non_negative_future_values",
        text: "All future candidates are non-negative or positive, so the sum cannot decrease later.",
      },
      {
        id: "values_may_be_negative",
        text: "Candidates may include negative numbers later in the path.",
      },
      {
        id: "input_unsorted",
        text: "The input is unsorted but contains arbitrary integers.",
      },
      {
        id: "path_non_empty",
        text: "The current path already contains at least one value.",
      },
    ],
    correctAnswerId: "non_negative_future_values",
    feedbackModel: {
      decisionSignal:
        "Overshoot pruning is safe only when future choices cannot reduce the accumulated sum.",
      distractorExplanations: {
        values_may_be_negative:
          "A negative future value could bring the sum back down to target.",
        input_unsorted:
          "Unsorted arbitrary integers do not guarantee monotonic sum growth.",
        path_non_empty:
          "Whether the path is non-empty does not prove the sum cannot decrease later.",
      },
      mentalModelCorrection:
        "A pruning rule is valid only when the constraints prove the branch cannot be repaired.",
      mistakeTypes: ["unsafe_pruning", "constraint_ignored"],
      nextAction:
        "Before pruning on a numeric bound, check whether future choices can reverse that bound.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-pruning-003",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_target_overshoot_pruning",
    secondarySkillAtomIds: [
      "backtracking_base_case_contract",
      "target_sum_search",
    ],
    type: "single_choice",
    prompt:
      "In an exact target-sum backtracking problem with positive numbers, which condition is a failed-branch pruning signal rather than a successful result?",
    options: [
      {
        id: "remaining_negative",
        text: "remaining < 0",
      },
      {
        id: "remaining_zero",
        text: "remaining === 0",
      },
      {
        id: "path_saved",
        text: "The current path has just been saved to result.",
      },
      {
        id: "target_matched",
        text: "The current path sums exactly to target.",
      },
    ],
    correctAnswerId: "remaining_negative",
    feedbackModel: {
      decisionSignal:
        "remaining < 0 means the branch overshot the exact target; with positive numbers it cannot become valid later.",
      distractorExplanations: {
        remaining_zero:
          "remaining === 0 is the positive exact-target result condition, not failed-branch pruning.",
        path_saved:
          "Saving a path happens after success, not as a pruning signal.",
        target_matched:
          "Matching the target is success, not a reason to classify the branch as impossible.",
      },
      mentalModelCorrection:
        "Do not group all stopping conditions together. Success and failed-branch pruning are different.",
      mistakeTypes: ["pruning_confused_with_success", "base_case_misread"],
      nextAction:
        "Label each stopping condition as success, failed branch, or boundary guard.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-004",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_sorted_candidate_pruning",
    secondarySkillAtomIds: [
      "backtracking_target_overshoot_pruning",
      "sorting_based_reasoning",
    ],
    type: "single_choice",
    prompt:
      "Candidates are sorted ascending and all are positive. In a loop, candidates[i] > remaining. What is the strongest safe pruning action?",
    options: [
      {
        id: "break_loop",
        text: "Break the loop because every later candidate is at least as large and will also exceed remaining.",
      },
      {
        id: "continue_loop",
        text: "Continue to later candidates because one of them may be smaller.",
      },
      {
        id: "save_path",
        text: "Save the current path because the next candidate is too large.",
      },
      {
        id: "restart_loop",
        text: "Restart the loop from index 0.",
      },
    ],
    correctAnswerId: "break_loop",
    feedbackModel: {
      decisionSignal:
        "Sorted ascending positive candidates make the overshoot monotonic across the rest of the loop.",
      distractorExplanations: {
        continue_loop:
          "Later candidates cannot be smaller in a sorted ascending list.",
        save_path:
          "A too-large next candidate does not prove the current path is a complete valid result.",
        restart_loop:
          "Restarting loses the current loop boundary and duplicates search.",
      },
      mentalModelCorrection:
        "Sorted order can turn one failed candidate check into a loop-level pruning rule.",
      mistakeTypes: ["monotonic_signal_missed", "pruning_missed"],
      nextAction:
        "When using sorted candidates, decide whether failure of the current candidate also proves failure of later candidates.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-005",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_pruning_assumption_check",
    secondarySkillAtomIds: [
      "backtracking_sorted_candidate_pruning",
      "sorting_based_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A loop over unsorted positive candidates sees candidates[i] > remaining. Why is `break` unsafe here?",
    options: [
      {
        id: "later_may_fit",
        text: "A later unsorted candidate may be smaller and still fit within remaining.",
      },
      {
        id: "negative_may_reduce",
        text: "Positive numbers may become negative after sorting.",
      },
      {
        id: "path_must_be_empty",
        text: "Pruning is only valid when the current path is empty.",
      },
      {
        id: "remaining_is_irrelevant",
        text: "remaining never matters in target-sum backtracking.",
      },
    ],
    correctAnswerId: "later_may_fit",
    feedbackModel: {
      decisionSignal:
        "Without sorted order, one candidate being too large says nothing about candidates later in the loop.",
      distractorExplanations: {
        negative_may_reduce:
          "The issue is not sign change; the issue is lack of ordering.",
        path_must_be_empty:
          "Path emptiness is not what makes break safe or unsafe.",
        remaining_is_irrelevant: "remaining is central to target-sum pruning.",
      },
      mentalModelCorrection:
        "Use `break` only when the loop order proves every later option fails the same constraint.",
      mistakeTypes: ["unsafe_pruning", "monotonic_assumption_invalid"],
      nextAction:
        "Check whether candidate order supports loop-level pruning or only candidate-level skipping.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-006",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_sorted_candidate_pruning",
    secondarySkillAtomIds: [
      "backtracking_pruning_assumption_check",
      "target_sum_search",
    ],
    type: "single_choice",
    prompt:
      "Candidates are sorted ascending and positive. In target-sum combination search, the current candidate exceeds remaining. Why is `break` better than `continue`?",
    options: [
      {
        id: "break_skips_proven_failures",
        text: "Because every later candidate is also too large, so continuing would only check proven failures.",
      },
      {
        id: "continue_changes_result",
        text: "Because continue would save an incorrect result immediately.",
      },
      {
        id: "break_undoes_path",
        text: "Because break automatically removes the last value from path.",
      },
      {
        id: "continue_restarts_search",
        text: "Because continue restarts recursion from the root call.",
      },
    ],
    correctAnswerId: "break_skips_proven_failures",
    feedbackModel: {
      decisionSignal:
        "Sorted positive candidates make later loop iterations impossible once the current candidate is too large.",
      distractorExplanations: {
        continue_changes_result:
          "continue does not save a result; it just checks later loop items unnecessarily.",
        break_undoes_path:
          "break does not perform undo. State restoration is separate.",
        continue_restarts_search:
          "continue moves to the next loop iteration, not to the root call.",
      },
      mentalModelCorrection:
        "Pruning is strongest when a constraint failure proves an entire suffix of choices impossible.",
      mistakeTypes: ["pruning_missed", "control_flow_misread"],
      nextAction:
        "Decide whether the failed check applies only to one candidate or to all remaining candidates.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-007",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_pruning_assumption_check",
    secondarySkillAtomIds: [
      "backtracking_target_overshoot_pruning",
      "constraint_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A target-sum search allows negative numbers. The current sum is greater than target. What is the safest assessment of pruning this branch immediately?",
    options: [
      {
        id: "unsafe_with_negatives",
        text: "It is unsafe because a later negative number could reduce the sum back to target.",
      },
      {
        id: "always_safe",
        text: "It is always safe because currentSum > target can never be repaired.",
      },
      {
        id: "must_save",
        text: "The branch should be saved because it crossed the target.",
      },
      {
        id: "sort_path_first",
        text: "Sorting the current path makes the pruning safe.",
      },
    ],
    correctAnswerId: "unsafe_with_negatives",
    feedbackModel: {
      decisionSignal:
        "Negative future choices can reverse an overshoot, so currentSum > target is not enough to prove failure.",
      distractorExplanations: {
        always_safe:
          "That is true only under monotonic sum constraints such as all positive future values.",
        must_save: "Crossing target is not exact target success.",
        sort_path_first:
          "Sorting chosen values does not change their sum or future feasibility.",
      },
      mentalModelCorrection:
        "Pruning must be justified by the input constraints, not by a pattern copied from a different problem.",
      mistakeTypes: ["unsafe_pruning", "constraint_ignored"],
      nextAction:
        "Check whether future choices can undo the condition you want to prune on.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-008",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_target_overshoot_pruning",
    secondarySkillAtomIds: ["candidate_reuse_contract", "constraint_reasoning"],
    type: "single_choice",
    prompt:
      "A combination search allows reusing the same positive candidate. The branch has remaining < 0. Does reuse make this branch recoverable?",
    options: [
      {
        id: "still_prune",
        text: "No. Reusing positive candidates can only decrease remaining further, so the branch should be pruned.",
      },
      {
        id: "reuse_repairs",
        text: "Yes. Reusing the same candidate can increase remaining back toward zero.",
      },
      {
        id: "save_due_to_reuse",
        text: "Yes. Reuse means any overshot branch is a valid repeated combination.",
      },
      {
        id: "ignore_remaining",
        text: "remaining should be ignored whenever reuse is allowed.",
      },
    ],
    correctAnswerId: "still_prune",
    feedbackModel: {
      decisionSignal:
        "Candidate reuse changes which choices are allowed next, but positive values still cannot repair an overshoot.",
      distractorExplanations: {
        reuse_repairs:
          "Choosing another positive candidate reduces remaining even more.",
        save_due_to_reuse:
          "Reuse does not turn an overshot exact-target path into a valid result.",
        ignore_remaining: "remaining is still the main target-progress state.",
      },
      mentalModelCorrection:
        "Reuse and pruning are separate concerns: reuse controls candidate availability, while positivity controls overshoot safety.",
      mistakeTypes: ["reuse_contract_misread", "pruning_missed"],
      nextAction:
        "When evaluating pruning, focus on whether future allowed choices can repair the failed constraint.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-pruning-009",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_capacity_pruning",
    secondarySkillAtomIds: [
      "backtracking_constraint_pruning",
      "exact_length_contract",
    ],
    type: "single_choice",
    prompt:
      "A search must build combinations of exactly k elements. The current path already has more than k elements. What should happen?",
    options: [
      {
        id: "prune_branch",
        text: "Return from this branch because it already violates the exact-length contract.",
      },
      {
        id: "save_path",
        text: "Save the path because it has at least k elements.",
      },
      {
        id: "continue_until_end",
        text: "Continue until all candidates have been consumed.",
      },
      {
        id: "sort_and_trim",
        text: "Sort the path and trim it down to k elements.",
      },
    ],
    correctAnswerId: "prune_branch",
    feedbackModel: {
      decisionSignal:
        "An exact-size result cannot be repaired by adding more choices once path.length > k.",
      distractorExplanations: {
        save_path: "The contract is exactly k, not at least k.",
        continue_until_end:
          "Consuming more candidates cannot make an oversized path exact again.",
        sort_and_trim:
          "Trimming would change the choices represented by the branch rather than respecting the search path.",
      },
      mentalModelCorrection:
        "Prune when the partial result has already violated a non-repairable output constraint.",
      mistakeTypes: ["constraint_ignored", "pruning_missed"],
      nextAction:
        "Check whether the current path has exceeded a hard output limit.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-010",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_capacity_pruning",
    secondarySkillAtomIds: [
      "exact_length_contract",
      "remaining_capacity_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A combination search needs exactly k elements. path.length is 2, k is 5, and only 2 candidates remain. What does this imply?",
    options: [
      {
        id: "prune_not_enough",
        text: "Prune the branch because even choosing every remaining candidate would reach only 4 elements.",
      },
      {
        id: "save_now",
        text: "Save the path because it has already chosen some valid elements.",
      },
      {
        id: "restart",
        text: "Restart from the beginning of the candidate list.",
      },
      {
        id: "ignore_k",
        text: "Ignore k because path length is only checked at the end.",
      },
    ],
    correctAnswerId: "prune_not_enough",
    feedbackModel: {
      decisionSignal:
        "The branch cannot reach the required size because path.length + remainingCandidates < k.",
      distractorExplanations: {
        save_now:
          "A partial path of length 2 does not satisfy an exact length of 5.",
        restart:
          "Restarting duplicates choices and breaks the current branch boundary.",
        ignore_k:
          "The exact-length requirement is a core constraint, not just an end-of-search detail.",
      },
      mentalModelCorrection:
        "Pruning can also detect too little remaining capacity, not only too much accumulated state.",
      mistakeTypes: ["capacity_pruning_missed", "output_contract_misread"],
      nextAction:
        "Compare what the branch has with the maximum it can still add.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-011",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_capacity_pruning",
    secondarySkillAtomIds: [
      "combination_generation",
      "remaining_capacity_reasoning",
    ],
    type: "single_choice",
    prompt:
      "Which condition safely prunes a branch for combinations of exactly k elements?",
    options: [
      {
        id: "not_enough_candidates",
        text: "path.length + remainingCandidates < k",
      },
      {
        id: "path_non_empty",
        text: "path.length > 0",
      },
      {
        id: "index_even",
        text: "index is even",
      },
      {
        id: "result_has_one",
        text: "result already contains one valid combination",
      },
    ],
    correctAnswerId: "not_enough_candidates",
    feedbackModel: {
      decisionSignal:
        "If even taking every remaining candidate cannot reach k, the branch cannot satisfy the exact-size contract.",
      distractorExplanations: {
        path_non_empty:
          "A non-empty path may still become a valid size-k combination.",
        index_even: "Index parity does not imply impossibility.",
        result_has_one:
          "Finding one result does not prune other branches when the output asks for all combinations.",
      },
      mentalModelCorrection:
        "Capacity pruning compares required future choices with available future choices.",
      mistakeTypes: ["capacity_pruning_missed", "irrelevant_condition_used"],
      nextAction:
        "For exact-size generation, calculate whether the branch can still reach the required size.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-012",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_capacity_pruning",
    secondarySkillAtomIds: [
      "string_segmentation",
      "exact_segment_count_contract",
    ],
    type: "single_choice",
    prompt:
      "A string segmentation search must produce exactly 4 segments. The current path already contains 5 segments. What should happen?",
    options: [
      {
        id: "prune_too_many_segments",
        text: "Prune the branch because it has exceeded the exact segment count.",
      },
      {
        id: "merge_segments",
        text: "Merge two segments so the branch has 4 again.",
      },
      {
        id: "save_if_string_consumed",
        text: "Save it if the whole string has been consumed.",
      },
      {
        id: "continue_splitting",
        text: "Continue splitting because more segments may repair the count.",
      },
    ],
    correctAnswerId: "prune_too_many_segments",
    feedbackModel: {
      decisionSignal:
        "Once the branch exceeds an exact segment count, adding more segments cannot make it valid.",
      distractorExplanations: {
        merge_segments:
          "Backtracking should not mutate previous choices to repair a branch that violated the contract.",
        save_if_string_consumed:
          "Full string consumption is not enough when the exact segment count is wrong.",
        continue_splitting:
          "More splitting only increases the segment count further.",
      },
      mentalModelCorrection:
        "Exact output limits create pruning conditions when the partial result already exceeds them.",
      mistakeTypes: ["constraint_ignored", "pruning_missed"],
      nextAction:
        "For fixed-part outputs, prune branches that already use too many parts.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-pruning-013",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_prefix_validity_pruning",
    secondarySkillAtomIds: ["parentheses_generation", "constraint_reasoning"],
    type: "single_choice",
    prompt:
      "A generator builds parentheses strings. The current prefix has closeCount > openCount. What should happen?",
    options: [
      {
        id: "prune_prefix",
        text: "Prune the branch because a prefix with more closes than opens can never become valid.",
      },
      {
        id: "save_prefix",
        text: "Save the prefix because the counts are different.",
      },
      {
        id: "add_open_until_fixed",
        text: "Keep adding '(' until openCount catches up.",
      },
      {
        id: "sort_parentheses",
        text: "Sort the parentheses so '(' comes before ')'.",
      },
    ],
    correctAnswerId: "prune_prefix",
    feedbackModel: {
      decisionSignal:
        "A valid parentheses string cannot have any prefix with more closing brackets than opening brackets.",
      distractorExplanations: {
        save_prefix: "The prefix violates the validity rule.",
        add_open_until_fixed:
          "Once a prefix is invalid, later characters cannot change the fact that the prefix was invalid.",
        sort_parentheses:
          "Sorting destroys the generated sequence and does not repair prefix validity.",
      },
      mentalModelCorrection:
        "Some constraints apply to every prefix, so a broken prefix is permanently invalid.",
      mistakeTypes: ["prefix_constraint_missed", "pruning_missed"],
      nextAction:
        "For sequence generation, ask whether validity must hold for every prefix or only at the end.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-014",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_prefix_validity_pruning",
    secondarySkillAtomIds: ["parentheses_generation", "constraint_state"],
    type: "single_choice",
    prompt:
      "A valid-parentheses generator for n pairs has openCount > n. What does this mean?",
    options: [
      {
        id: "prune_too_many_opens",
        text: "The branch should be pruned because it has used more opening parentheses than allowed.",
      },
      {
        id: "save_if_close_count_zero",
        text: "The branch should be saved if no closing parentheses have been used yet.",
      },
      {
        id: "continue_with_closes",
        text: "The branch should continue because closing parentheses can reduce openCount.",
      },
      {
        id: "reset_counts",
        text: "The counts should be reset to zero and recursion should continue.",
      },
    ],
    correctAnswerId: "prune_too_many_opens",
    feedbackModel: {
      decisionSignal:
        "The branch has exceeded a hard count limit; later choices cannot remove already placed opening parentheses.",
      distractorExplanations: {
        save_if_close_count_zero:
          "Using too many openings violates the output contract regardless of closeCount.",
        continue_with_closes:
          "Adding closing parentheses does not undo the fact that too many openings were used.",
        reset_counts:
          "Resetting counts breaks the branch state rather than pruning the invalid branch.",
      },
      mentalModelCorrection:
        "Count constraints create pruning when a partial sequence already exceeds the allowed amount.",
      mistakeTypes: ["constraint_ignored", "pruning_missed"],
      nextAction:
        "Track whether a count limit is a soft target or a hard maximum.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-015",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_prefix_validity_pruning",
    secondarySkillAtomIds: ["valid_prefix_reasoning", "constraint_reasoning"],
    type: "single_choice",
    prompt:
      "A backtracking generator builds a sequence where every prefix must satisfy a rule. The current prefix already violates that rule. Why is pruning valid?",
    options: [
      {
        id: "prefix_cannot_be_repaired",
        text: "Appending more items cannot change the fact that this earlier prefix was invalid.",
      },
      {
        id: "result_already_complete",
        text: "The result is complete whenever a prefix violates a rule.",
      },
      {
        id: "duplicates_removed",
        text: "Invalid prefixes are the same thing as duplicate outputs.",
      },
      {
        id: "undo_unnecessary",
        text: "Pruning means no state ever has to be undone.",
      },
    ],
    correctAnswerId: "prefix_cannot_be_repaired",
    feedbackModel: {
      decisionSignal:
        "When validity is prefix-based, a broken prefix remains broken no matter how the branch continues.",
      distractorExplanations: {
        result_already_complete:
          "A rule violation is failed-branch pruning, not completion.",
        duplicates_removed:
          "Duplicate control and prefix validity are different concerns.",
        undo_unnecessary:
          "State restoration may still be needed after returning from the branch.",
      },
      mentalModelCorrection:
        "Pruning relies on impossibility: no continuation can turn this partial state into a valid result.",
      mistakeTypes: [
        "pruning_confused_with_success",
        "constraint_reasoning_missed",
      ],
      nextAction:
        "Identify whether the violated condition applies to the current prefix permanently.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-016",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_segment_validity_pruning",
    secondarySkillAtomIds: ["string_segmentation", "constraint_reasoning"],
    type: "single_choice",
    prompt:
      "A string partitioning search tries a candidate segment. The segment is invalid under the problem rules. What should happen to that candidate?",
    options: [
      {
        id: "skip_candidate",
        text: "Skip or prune that candidate segment and avoid recursing with it.",
      },
      {
        id: "recurse_anyway",
        text: "Recurse anyway because a later segment can make this segment valid.",
      },
      {
        id: "save_segments",
        text: "Save the current segment list because an invalid segment ends the branch.",
      },
      {
        id: "sort_segment",
        text: "Sort the characters inside the segment and continue.",
      },
    ],
    correctAnswerId: "skip_candidate",
    feedbackModel: {
      decisionSignal:
        "If a selected segment itself violates the rules, adding later segments cannot repair that segment.",
      distractorExplanations: {
        recurse_anyway:
          "Later segments do not change the validity of the already chosen segment.",
        save_segments: "An invalid segment is not a completed valid partition.",
        sort_segment:
          "Sorting changes the segment content/order and does not respect the original partition.",
      },
      mentalModelCorrection:
        "Validate each candidate part before committing recursion to it.",
      mistakeTypes: ["constraint_ignored", "pruning_missed"],
      nextAction:
        "For partitioning, separate candidate validation from full-result completion.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-017",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_segment_validity_pruning",
    secondarySkillAtomIds: [
      "string_segmentation",
      "remaining_capacity_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A restore-IP style search has remainingSegments left. The number of remaining characters is too small to give each segment at least one character. What should happen?",
    options: [
      {
        id: "prune_too_few_chars",
        text: "Prune the branch because the remaining characters cannot fill the required segments.",
      },
      {
        id: "save_partial_ip",
        text: "Save the partial result because fewer characters means the search is simpler.",
      },
      {
        id: "reuse_characters",
        text: "Reuse earlier characters to fill the missing segments.",
      },
      {
        id: "ignore_segment_count",
        text: "Ignore the remaining segment count and continue.",
      },
    ],
    correctAnswerId: "prune_too_few_chars",
    feedbackModel: {
      decisionSignal:
        "If the remaining input cannot satisfy the minimum size of remaining parts, no continuation can produce a valid segmentation.",
      distractorExplanations: {
        save_partial_ip:
          "A partial segmentation is not a complete valid result.",
        reuse_characters:
          "Segmentation consumes the input in order; characters are not reusable.",
        ignore_segment_count:
          "The exact segment count is part of the output contract.",
      },
      mentalModelCorrection:
        "Capacity pruning applies to partitioning too: remaining input must be able to fill remaining required parts.",
      mistakeTypes: ["capacity_pruning_missed", "output_contract_misread"],
      nextAction:
        "Compare remaining input length against minimum and maximum possible part sizes.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-pruning-018",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_grid_bounds_pruning",
    secondarySkillAtomIds: ["grid_search_backtracking", "constraint_pruning"],
    type: "single_choice",
    prompt:
      "A grid backtracking move would go to row = -1. What should the search do with this move?",
    options: [
      {
        id: "prune_out_of_bounds",
        text: "Reject the move because it is outside the grid.",
      },
      {
        id: "wrap_to_last_row",
        text: "Wrap to the last row and continue.",
      },
      {
        id: "save_path",
        text: "Save the path because reaching outside the grid means success.",
      },
      {
        id: "mark_all_visited",
        text: "Mark every cell visited and return true.",
      },
    ],
    correctAnswerId: "prune_out_of_bounds",
    feedbackModel: {
      decisionSignal:
        "Out-of-bounds coordinates do not represent a valid cell, so that move cannot continue the path.",
      distractorExplanations: {
        wrap_to_last_row:
          "Wrapping changes the movement rules unless the prompt explicitly defines a toroidal grid.",
        save_path:
          "Leaving the grid is not a success condition for ordinary grid search.",
        mark_all_visited: "Marking unrelated cells corrupts the branch state.",
      },
      mentalModelCorrection:
        "Grid pruning starts with safety guards: the move must point to a valid cell before any deeper search.",
      mistakeTypes: ["boundary_guard_missed", "constraint_ignored"],
      nextAction: "Check grid bounds before reading or recursing into a cell.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-019",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_visited_pruning",
    secondarySkillAtomIds: ["grid_search_backtracking", "path_local_state"],
    type: "single_choice",
    prompt:
      "A grid path search cannot reuse a cell within the same candidate path. The next move points to a cell already marked visited in the current path. What should happen?",
    options: [
      {
        id: "prune_visited_cell",
        text: "Reject this move because it would reuse a cell in the same path.",
      },
      {
        id: "accept_if_letter_matches",
        text: "Accept the move as long as the cell's letter matches.",
      },
      {
        id: "clear_visited_global",
        text: "Clear the entire visited structure and continue.",
      },
      {
        id: "save_path_immediately",
        text: "Save the current path because it found a repeated cell.",
      },
    ],
    correctAnswerId: "prune_visited_cell",
    feedbackModel: {
      decisionSignal:
        "The branch-specific no-reuse constraint makes already visited cells illegal for the current path.",
      distractorExplanations: {
        accept_if_letter_matches:
          "Matching content does not override the no-reuse constraint.",
        clear_visited_global:
          "Clearing visited would erase the path-local usage state needed for correctness.",
        save_path_immediately:
          "A repeated cell is a violation, not a completed result.",
      },
      mentalModelCorrection:
        "A candidate move must satisfy all local constraints, not just the character/value match.",
      mistakeTypes: ["visited_constraint_missed", "constraint_ignored"],
      nextAction:
        "For path-local visited rules, check visited before committing to the move.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-pruning-020",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_character_mismatch_pruning",
    secondarySkillAtomIds: ["grid_search_backtracking", "word_search_state"],
    type: "single_choice",
    prompt:
      "A word-search branch is trying to match word[wordIndex]. The current grid cell contains a different character. What should happen?",
    options: [
      {
        id: "prune_mismatch",
        text: "Reject this branch because this path cannot match the word at the current position.",
      },
      {
        id: "skip_word_char",
        text: "Skip word[wordIndex] and try to match the next character from this cell.",
      },
      {
        id: "save_partial",
        text: "Save the path because it matched earlier characters.",
      },
      {
        id: "sort_word",
        text: "Sort the word so this cell can match a different position.",
      },
    ],
    correctAnswerId: "prune_mismatch",
    feedbackModel: {
      decisionSignal:
        "The path must match the word in order; a character mismatch at the current index makes this branch invalid.",
      distractorExplanations: {
        skip_word_char:
          "Skipping a required character changes the target word contract.",
        save_partial:
          "Matching a prefix is not enough if the full word has not been matched.",
        sort_word:
          "Sorting changes the target sequence and destroys the word-search contract.",
      },
      mentalModelCorrection:
        "In ordered target matching, each step must match the exact next required symbol.",
      mistakeTypes: ["constraint_ignored", "partial_solution_saved"],
      nextAction:
        "Tie grid movement to the target-progress state before recursing deeper.",
      result: "diagnostic",
    },
  },
];
