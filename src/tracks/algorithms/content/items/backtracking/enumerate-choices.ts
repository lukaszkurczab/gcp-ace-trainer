export const enumerateChoicesQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-choices-001",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_choose_skip_choices",
    secondarySkillAtomIds: [
      "backtracking_enumerate_choices",
      "subset_generation",
    ],
    type: "single_choice",
    prompt:
      "A subset generator processes nums[index]. At this recursion level, what choices should be enumerated?",
    options: [
      {
        id: "include_or_skip",
        text: "Include nums[index] or skip nums[index].",
      },
      {
        id: "all_pairs",
        text: "Compare nums[index] with every later number.",
      },
      {
        id: "sort_or_reverse",
        text: "Sort the path or reverse the path.",
      },
      {
        id: "left_or_right_pointer",
        text: "Move either the left pointer or the right pointer.",
      },
    ],
    correctAnswerId: "include_or_skip",
    feedbackModel: {
      decisionSignal:
        "Subset choose/skip recursion branches on whether the current input element belongs in the partial subset.",
      distractorExplanations: {
        all_pairs:
          "Pair comparison solves a different relationship problem; it does not enumerate subset membership.",
        sort_or_reverse:
          "Sorting or reversing changes representation but is not a branch over including the current element.",
        left_or_right_pointer:
          "Two-pointer movement is not the choice structure for subset generation.",
      },
      mentalModelCorrection:
        "At each recursion level, name the decision being made. For subsets, the decision is include or exclude the current item.",
      mistakeTypes: ["choice_enumeration_misread", "wrong_pattern_selected"],
      nextAction:
        "For choose/skip search, write the two branches before thinking about loops or pruning.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-002",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_choose_skip_choices",
    secondarySkillAtomIds: ["backtracking_index_state", "subset_generation"],
    type: "single_choice",
    prompt:
      "A choose/skip recursion has already decided nums[0..index-1]. What should the current frame decide?",
    options: [
      {
        id: "current_item_membership",
        text: "Whether nums[index] is included in the current path.",
      },
      {
        id: "all_remaining_permutations",
        text: "Every possible ordering of all remaining elements.",
      },
      {
        id: "final_result_copy",
        text: "Whether to copy the final result array.",
      },
      {
        id: "duplicate_skip_only",
        text: "Only whether nums[index] is a duplicate of nums[index - 1].",
      },
    ],
    correctAnswerId: "current_item_membership",
    feedbackModel: {
      decisionSignal:
        "The frame owns exactly one membership decision: include or exclude the current indexed item.",
      distractorExplanations: {
        all_remaining_permutations:
          "Permuting remaining elements is a different choice model where order matters.",
        final_result_copy:
          "Copying a result is a result-contract action, not the current branching choice.",
        duplicate_skip_only:
          "Duplicate handling may affect whether a branch is allowed, but it is not the core choose/skip decision.",
      },
      mentalModelCorrection:
        "Choice enumeration should match the unit of work represented by the current recursion frame.",
      mistakeTypes: ["choice_enumeration_misread", "state_model_misread"],
      nextAction: "Ask: what single decision does this frame control?",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-003",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_choose_skip_choices",
    secondarySkillAtomIds: [
      "backtracking_enumerate_choices",
      "binary_branching",
    ],
    type: "single_choice",
    prompt:
      "A problem asks whether any subset satisfies a condition. The recursion uses binary include/exclude decisions. Which choice structure matches that model?",
    options: [
      {
        id: "two_branches_per_index",
        text: "For each index, branch once with the value included and once with it excluded.",
      },
      {
        id: "loop_all_unused",
        text: "At each level, loop over every unused value as the next ordered position.",
      },
      {
        id: "four_grid_directions",
        text: "At each level, try up, down, left, and right moves.",
      },
      {
        id: "single_greedy_pick",
        text: "Pick the locally best value and never explore alternatives.",
      },
    ],
    correctAnswerId: "two_branches_per_index",
    feedbackModel: {
      decisionSignal:
        "Binary subset search enumerates two alternatives for each element: chosen or not chosen.",
      distractorExplanations: {
        loop_all_unused:
          "Looping over every unused value models permutations or ordered construction, not binary membership.",
        four_grid_directions: "Directional choices belong to grid path search.",
        single_greedy_pick:
          "Backtracking requires exploring alternatives; a single greedy pick discards branches.",
      },
      mentalModelCorrection:
        "Backtracking choices are the legal alternatives at the current decision point, not every possible action from every pattern.",
      mistakeTypes: ["choice_enumeration_misread", "wrong_pattern_selected"],
      nextAction:
        "Classify the branch shape: binary include/skip, loop over candidates, directional moves, or split points.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-choices-004",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_loop_choices_from_start",
    secondarySkillAtomIds: [
      "combination_generation",
      "backtracking_start_index_state",
    ],
    type: "single_choice",
    prompt:
      "A combination generator has startIndex. At the current depth, which candidates should it enumerate?",
    options: [
      {
        id: "from_start_to_end",
        text: "Loop over candidates from startIndex to the end of the array.",
      },
      {
        id: "from_zero_every_time",
        text: "Loop over all candidates from index 0 at every depth.",
      },
      {
        id: "only_previous_candidate",
        text: "Only reconsider the candidate chosen by the parent frame.",
      },
      {
        id: "only_middle_candidate",
        text: "Only try the middle candidate.",
      },
    ],
    correctAnswerId: "from_start_to_end",
    feedbackModel: {
      decisionSignal:
        "Combination recursion enumerates each legal next candidate from the current forward boundary.",
      distractorExplanations: {
        from_zero_every_time:
          "Starting from zero can generate the same combination in different orders.",
        only_previous_candidate:
          "That would block other legal candidates at this depth.",
        only_middle_candidate:
          "There is no rule that only the middle candidate is legal.",
      },
      mentalModelCorrection:
        "startIndex defines the candidate range for the current frame’s loop.",
      mistakeTypes: ["choice_range_misread", "order_constraint_missed"],
      nextAction:
        "For combination recursion, identify the first legal candidate index before writing the loop.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-005",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_loop_choices_from_start",
    secondarySkillAtomIds: ["combination_generation", "choice_range_reasoning"],
    type: "single_choice",
    prompt:
      "A branch is building combinations where order does not matter. The previous choice was at index i. Which next choice range avoids reordering the same combination?",
    options: [
      {
        id: "later_indices",
        text: "Only indices after i.",
      },
      {
        id: "all_indices",
        text: "All indices from 0 again.",
      },
      {
        id: "earlier_only",
        text: "Only indices before i.",
      },
      {
        id: "same_index_only",
        text: "Only index i forever.",
      },
    ],
    correctAnswerId: "later_indices",
    feedbackModel: {
      decisionSignal:
        "For no-reuse unordered combinations, later choices must come from later indices to avoid reordered duplicates.",
      distractorExplanations: {
        all_indices: "This allows [a, b] and [b, a] as separate branches.",
        earlier_only:
          "Earlier-only movement reverses the same ordering issue and misses forward combinations.",
        same_index_only:
          "Choosing only the same index prevents normal multi-candidate combinations.",
      },
      mentalModelCorrection:
        "The legal choice range should encode whether order matters and whether reuse is allowed.",
      mistakeTypes: ["choice_range_misread", "duplicate_control_misread"],
      nextAction:
        "After choosing i, decide whether the next frame starts at i, i + 1, or all unused indices.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-006",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_loop_choices_from_start",
    secondarySkillAtomIds: [
      "combination_generation",
      "candidate_reuse_contract",
    ],
    type: "single_choice",
    prompt:
      "A combination-sum problem allows reusing the same candidate multiple times. After choosing candidate i, which next candidate range should remain available?",
    options: [
      {
        id: "i_to_end",
        text: "Loop from i again so the same candidate may be reused.",
      },
      {
        id: "i_plus_one_to_end",
        text: "Loop from i + 1 so the same candidate is forbidden.",
      },
      {
        id: "zero_to_i_minus_one",
        text: "Loop only over earlier candidates.",
      },
      {
        id: "none",
        text: "Stop enumerating choices immediately after one candidate.",
      },
    ],
    correctAnswerId: "i_to_end",
    feedbackModel: {
      decisionSignal:
        "Reuse means the chosen candidate remains legal for the next depth, so enumeration can start at i.",
      distractorExplanations: {
        i_plus_one_to_end:
          "That encodes at-most-once use, not reusable candidates.",
        zero_to_i_minus_one:
          "Earlier-only choices reintroduce ordering problems and miss legal repeated use of i.",
        none: "Stopping after one candidate prevents multi-value combinations.",
      },
      mentalModelCorrection:
        "The next loop boundary is how candidate reuse rules become search behavior.",
      mistakeTypes: ["reuse_contract_misread", "choice_range_misread"],
      nextAction:
        "For each candidate choice, ask whether that same candidate may appear again later in the same path.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-007",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_loop_choices_from_start",
    secondarySkillAtomIds: [
      "combination_generation",
      "backtracking_enumerate_choices",
    ],
    type: "single_choice",
    prompt:
      "A combination search loops from startIndex. What does each loop iteration represent?",
    options: [
      {
        id: "next_candidate_choice",
        text: "One possible next candidate to append to the current path.",
      },
      {
        id: "complete_result",
        text: "A complete result that should always be saved immediately.",
      },
      {
        id: "failed_branch",
        text: "A branch that must be pruned before recursion.",
      },
      {
        id: "undo_step",
        text: "The step that removes the previous candidate from path.",
      },
    ],
    correctAnswerId: "next_candidate_choice",
    feedbackModel: {
      decisionSignal:
        "The loop enumerates alternatives for the next choice at this depth.",
      distractorExplanations: {
        complete_result:
          "A candidate choice is not necessarily a complete output.",
        failed_branch:
          "Some candidates may later be pruned, but the loop itself enumerates choices.",
        undo_step:
          "Undo happens after exploring a chosen branch; it is not what the loop iteration represents.",
      },
      mentalModelCorrection:
        "Choice enumeration is about listing legal next moves, not saving, pruning, or undoing.",
      mistakeTypes: ["choice_enumeration_misread", "concept_boundary_confused"],
      nextAction:
        "Label loop iterations as candidate alternatives before adding result or pruning logic.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-choices-008",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_unused_element_choices",
    secondarySkillAtomIds: [
      "permutation_generation",
      "backtracking_visited_state",
    ],
    type: "single_choice",
    prompt:
      "A permutation generator is filling the next position in path. Which choices should the current frame enumerate?",
    options: [
      {
        id: "every_unused_element",
        text: "Every element not yet used in the current path.",
      },
      {
        id: "only_later_elements",
        text: "Only elements after startIndex.",
      },
      {
        id: "only_adjacent_elements",
        text: "Only elements adjacent to the last chosen value.",
      },
      {
        id: "only_smallest_element",
        text: "Only the smallest unused element.",
      },
    ],
    correctAnswerId: "every_unused_element",
    feedbackModel: {
      decisionSignal:
        "Each permutation position may be filled by any input element not already used in the current arrangement.",
      distractorExplanations: {
        only_later_elements:
          "That combination-style boundary would miss permutations where an earlier unused element appears later.",
        only_adjacent_elements:
          "Permutation generation has no adjacency requirement unless the prompt adds one.",
        only_smallest_element:
          "Choosing only the smallest unused element produces one ordering, not all permutations.",
      },
      mentalModelCorrection:
        "For permutations, the legal choice set is all unused elements, not a forward suffix.",
      mistakeTypes: [
        "permutation_combination_confused",
        "choice_range_misread",
      ],
      nextAction:
        "Ask whether each position can use any unused element or only later candidates.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-009",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_unused_element_choices",
    secondarySkillAtomIds: [
      "permutation_generation",
      "backtracking_start_index_state",
    ],
    type: "single_choice",
    prompt:
      "A permutation branch has used nums[2] first. Why should the next frame still be allowed to choose nums[0] if it is unused?",
    options: [
      {
        id: "order_matters",
        text: "Because permutations care about order, and earlier indices can appear after later indices.",
      },
      {
        id: "combinations_need_it",
        text: "Because combinations require every earlier index after a later one.",
      },
      {
        id: "target_sum",
        text: "Because choosing nums[0] always reduces remaining target.",
      },
      {
        id: "base_case",
        text: "Because choosing nums[0] immediately completes the result.",
      },
    ],
    correctAnswerId: "order_matters",
    feedbackModel: {
      decisionSignal:
        "Permutation choice enumeration is based on unused status, not forward index order.",
      distractorExplanations: {
        combinations_need_it:
          "Combinations usually avoid choosing earlier indices after later ones to prevent reorder duplicates.",
        target_sum:
          "This prompt is about ordering choices, not target-sum progress.",
        base_case:
          "Choosing an earlier unused value does not automatically complete the permutation.",
      },
      mentalModelCorrection:
        "When order matters, index order cannot be used as the only legality boundary.",
      mistakeTypes: [
        "permutation_combination_confused",
        "choice_enumeration_misread",
      ],
      nextAction:
        "For each ordered-position problem, enumerate all unused candidates at that position.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-010",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_unused_element_choices",
    secondarySkillAtomIds: [
      "permutation_generation",
      "visited_state_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A permutation generator loops over all indices at every depth. Which candidate should be skipped during enumeration?",
    options: [
      {
        id: "already_visited",
        text: "Any index already marked visited in the current path.",
      },
      {
        id: "less_than_previous_index",
        text: "Any index smaller than the previous chosen index.",
      },
      {
        id: "greater_than_previous_index",
        text: "Any index greater than the previous chosen index.",
      },
      {
        id: "all_even_indices",
        text: "Every even index.",
      },
    ],
    correctAnswerId: "already_visited",
    feedbackModel: {
      decisionSignal:
        "Permutation enumeration tries all positions but filters out candidates already used in the current arrangement.",
      distractorExplanations: {
        less_than_previous_index:
          "Skipping earlier unused indices would incorrectly impose combination ordering.",
        greater_than_previous_index:
          "Skipping later indices would also miss valid permutations.",
        all_even_indices:
          "Index parity is irrelevant unless the prompt adds such a constraint.",
      },
      mentalModelCorrection:
        "The loop range can be broad while the legal choice filter uses visited state.",
      mistakeTypes: ["visited_state_misread", "choice_filter_misread"],
      nextAction:
        "Separate the loop range from the condition that makes a candidate legal.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-011",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_unused_element_choices",
    secondarySkillAtomIds: [
      "permutation_generation",
      "backtracking_enumerate_choices",
    ],
    type: "single_choice",
    prompt:
      "A function must generate all arrangements of three distinct values. At the first position, how many candidate choices should be considered?",
    options: [
      {
        id: "three",
        text: "Three choices, one for each input value.",
      },
      {
        id: "one",
        text: "One choice, the first input value only.",
      },
      {
        id: "two",
        text: "Two choices, include or skip the first value.",
      },
      {
        id: "zero",
        text: "No choices until the base case is reached.",
      },
    ],
    correctAnswerId: "three",
    feedbackModel: {
      decisionSignal:
        "For arrangements, the first position can be filled by any of the three distinct values.",
      distractorExplanations: {
        one: "Choosing only the first value produces only arrangements that start with that value.",
        two: "Include/skip is subset branching, not ordered-position filling.",
        zero: "The base case is reached after choices are made, not before enumeration begins.",
      },
      mentalModelCorrection:
        "The number of choices at a level depends on what the current slot can legally contain.",
      mistakeTypes: [
        "choice_enumeration_misread",
        "permutation_combination_confused",
      ],
      nextAction:
        "For ordered construction, count the legal unused candidates for the current slot.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-012",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_reuse_candidate_choices",
    secondarySkillAtomIds: ["candidate_reuse_contract", "target_sum_search"],
    type: "single_choice",
    prompt:
      "A target-sum combination search allows each candidate to be used unlimited times. The current frame is choosing the next value. Which choice model fits?",
    options: [
      {
        id: "current_and_later",
        text: "Try the current candidate and later candidates, allowing the current candidate to remain available after it is chosen.",
      },
      {
        id: "later_only",
        text: "Try only later candidates after each choice.",
      },
      {
        id: "unused_only",
        text: "Try only candidates not used anywhere in the current path.",
      },
      {
        id: "first_only",
        text: "Always choose only the first candidate.",
      },
    ],
    correctAnswerId: "current_and_later",
    feedbackModel: {
      decisionSignal:
        "Unlimited reuse means the choice that was just taken can still be a legal next choice.",
      distractorExplanations: {
        later_only: "Later-only enumeration encodes at-most-once use.",
        unused_only:
          "Unused-only enumeration is for permutations or no-reuse arrangements.",
        first_only:
          "Always choosing the first candidate ignores other legal branches.",
      },
      mentalModelCorrection:
        "Choice enumeration must reflect the candidate reuse contract.",
      mistakeTypes: ["reuse_contract_misread", "choice_range_misread"],
      nextAction:
        "Before enumerating candidates, classify each candidate as reusable or consumed after choice.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-013",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_reuse_candidate_choices",
    secondarySkillAtomIds: [
      "candidate_reuse_contract",
      "combination_generation",
    ],
    type: "single_choice",
    prompt:
      "A combination search does not allow reusing a candidate. Which enumeration choice would violate that contract?",
    options: [
      {
        id: "start_at_i_again",
        text: "After choosing candidate i, starting the next loop at i again.",
      },
      {
        id: "start_at_i_plus_one",
        text: "After choosing candidate i, starting the next loop at i + 1.",
      },
      {
        id: "loop_from_start_index",
        text: "Looping from the current startIndex at this depth.",
      },
      {
        id: "skip_illegal_candidate",
        text: "Skipping a candidate that fails a constraint.",
      },
    ],
    correctAnswerId: "start_at_i_again",
    feedbackModel: {
      decisionSignal:
        "Starting at i again keeps the same candidate available, which permits reuse.",
      distractorExplanations: {
        start_at_i_plus_one:
          "This is the usual no-reuse combination transition.",
        loop_from_start_index:
          "The current depth should enumerate legal candidates from its start boundary.",
        skip_illegal_candidate:
          "Skipping illegal candidates respects constraints; it does not violate no-reuse.",
      },
      mentalModelCorrection:
        "The post-choice loop boundary determines whether the chosen candidate can appear again.",
      mistakeTypes: ["reuse_contract_misread", "choice_range_misread"],
      nextAction:
        "Check the recursive call’s next start value against the reuse rule.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-choices-014",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_directional_grid_choices",
    secondarySkillAtomIds: [
      "grid_search_backtracking",
      "backtracking_enumerate_choices",
    ],
    type: "single_choice",
    prompt:
      "A grid path search can move one step up, down, left, or right from the current cell. What choices should the current frame enumerate?",
    options: [
      {
        id: "four_directions",
        text: "The four neighboring directions.",
      },
      {
        id: "all_cells",
        text: "Every cell in the entire grid.",
      },
      {
        id: "all_unused_numbers",
        text: "Every unused number in the input array.",
      },
      {
        id: "include_or_skip_cell",
        text: "Include or skip the current cell without moving.",
      },
    ],
    correctAnswerId: "four_directions",
    feedbackModel: {
      decisionSignal:
        "The movement rules define the legal next choices as neighboring directions from the current position.",
      distractorExplanations: {
        all_cells:
          "Most grid path rules do not allow jumping to arbitrary cells.",
        all_unused_numbers:
          "Unused-number choices belong to permutation-style array problems.",
        include_or_skip_cell:
          "Grid movement requires choosing a next move, not a subset membership decision for the current cell.",
      },
      mentalModelCorrection:
        "In grid backtracking, enumerate the legal moves from the current coordinate.",
      mistakeTypes: ["choice_enumeration_misread", "grid_movement_misread"],
      nextAction:
        "Translate movement rules into a fixed set of candidate directions.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-015",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_directional_grid_choices",
    secondarySkillAtomIds: ["grid_search_backtracking", "constraint_pruning"],
    type: "single_choice",
    prompt:
      "A word-search call is at cell (r, c). The algorithm has four directional moves. How should it handle a direction that leads out of bounds?",
    options: [
      {
        id: "enumerate_then_reject",
        text: "Treat it as a candidate move, then reject it with the bounds constraint before recursing deeper.",
      },
      {
        id: "wrap_grid",
        text: "Wrap around to the opposite side of the grid.",
      },
      {
        id: "save_result",
        text: "Save the current path because an edge was reached.",
      },
      {
        id: "switch_to_permutation",
        text: "Switch to choosing every unused cell in the grid.",
      },
    ],
    correctAnswerId: "enumerate_then_reject",
    feedbackModel: {
      decisionSignal:
        "Directions are enumerated as possible moves, but each move must pass legality checks before deeper recursion.",
      distractorExplanations: {
        wrap_grid:
          "Wrapping is not legal unless explicitly stated by the prompt.",
        save_result:
          "Reaching an edge is not a completion condition by itself.",
        switch_to_permutation:
          "Choosing arbitrary unused cells violates the grid movement rule.",
      },
      mentalModelCorrection:
        "Enumeration lists candidate moves; constraints decide which candidates are legal enough to recurse into.",
      mistakeTypes: ["choice_filter_misread", "grid_movement_misread"],
      nextAction:
        "Separate generating candidate moves from validating those moves.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-016",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_directional_grid_choices",
    secondarySkillAtomIds: ["grid_search_backtracking", "word_search_state"],
    type: "single_choice",
    prompt:
      "A grid search allows diagonal movement as well as up, down, left, and right. What changes in choice enumeration?",
    options: [
      {
        id: "include_diagonals",
        text: "The frame should enumerate all legal movement directions, including diagonals.",
      },
      {
        id: "still_four",
        text: "The frame should always enumerate exactly four directions regardless of prompt rules.",
      },
      {
        id: "all_cells",
        text: "The frame should enumerate every cell because diagonals are allowed.",
      },
      {
        id: "no_moves",
        text: "Diagonal movement removes the need to enumerate moves.",
      },
    ],
    correctAnswerId: "include_diagonals",
    feedbackModel: {
      decisionSignal:
        "Choice enumeration must match the movement rules given by the problem.",
      distractorExplanations: {
        still_four:
          "Four directions are only correct when the prompt restricts movement to cardinal neighbors.",
        all_cells:
          "Allowing diagonals expands local neighbors; it does not allow arbitrary jumps.",
        no_moves: "The search still needs to choose a next movement direction.",
      },
      mentalModelCorrection:
        "Do not hardcode a backtracking choice set; derive it from the problem’s legal moves.",
      mistakeTypes: ["choice_enumeration_misread", "constraint_ignored"],
      nextAction:
        "Read the allowed movement model before defining the directions array.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-choices-017",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_split_point_choices",
    secondarySkillAtomIds: [
      "string_segmentation",
      "backtracking_enumerate_choices",
    ],
    type: "single_choice",
    prompt:
      "A string partitioning function is at index start and must choose the next segment. What should it enumerate?",
    options: [
      {
        id: "end_positions",
        text: "Possible end positions for the next segment starting at start.",
      },
      {
        id: "all_permutations",
        text: "All permutations of the string characters.",
      },
      {
        id: "left_right_swaps",
        text: "Pairs of characters to swap from both ends.",
      },
      {
        id: "global_seen_segments",
        text: "All segments ever used by any previous branch.",
      },
    ],
    correctAnswerId: "end_positions",
    feedbackModel: {
      decisionSignal:
        "Partitioning choices are possible segment boundaries from the next unconsumed index.",
      distractorExplanations: {
        all_permutations:
          "Partitioning preserves input order and chooses cuts, not character permutations.",
        left_right_swaps:
          "Swapping characters changes the string rather than choosing segment boundaries.",
        global_seen_segments:
          "Segments can recur in different branches unless the prompt forbids them; global history is not the choice set.",
      },
      mentalModelCorrection:
        "For segmentation, the branch choice is where the next segment ends.",
      mistakeTypes: ["choice_enumeration_misread", "string_partition_misread"],
      nextAction:
        "Represent partitioning choices as cut/end positions rather than element orderings.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-018",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_split_point_choices",
    secondarySkillAtomIds: ["string_segmentation", "constraint_pruning"],
    type: "single_choice",
    prompt:
      "A restore-IP style search is choosing the next segment. Each segment can have length 1 to 3. Which choices should the current frame enumerate?",
    options: [
      {
        id: "lengths_one_to_three",
        text: "Candidate segment lengths 1, 2, and 3 from the current index, subject to validity checks.",
      },
      {
        id: "all_remaining_lengths",
        text: "Every possible length from 1 to the end of the string.",
      },
      {
        id: "only_length_three",
        text: "Only length 3, because IP segments can have up to three digits.",
      },
      {
        id: "characters_sorted",
        text: "All sorted versions of the remaining characters.",
      },
    ],
    correctAnswerId: "lengths_one_to_three",
    feedbackModel: {
      decisionSignal:
        "The prompt limits each segment to at most three characters, so only those segment lengths are legal candidates.",
      distractorExplanations: {
        all_remaining_lengths:
          "Lengths greater than 3 violate the segment-size rule.",
        only_length_three: "Segments may be length 1 or 2 as well as 3.",
        characters_sorted:
          "Sorting characters destroys the original segmentation order.",
      },
      mentalModelCorrection:
        "Choice enumeration should include all legal candidate shapes, not too few and not impossible ones.",
      mistakeTypes: ["choice_range_misread", "constraint_ignored"],
      nextAction:
        "Convert each structural constraint into the range of candidate choices at this frame.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-019",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_split_point_choices",
    secondarySkillAtomIds: ["palindrome_partitioning", "string_segmentation"],
    type: "single_choice",
    prompt:
      "A palindrome partitioning search is at index start. It can choose any next substring s[start..end] that is a palindrome. What does the loop enumerate before filtering by palindrome validity?",
    options: [
      {
        id: "end_positions",
        text: "Possible end positions for the next substring.",
      },
      {
        id: "unused_characters",
        text: "Any unused characters from anywhere in the string.",
      },
      {
        id: "all_stack_states",
        text: "All possible stack contents.",
      },
      {
        id: "sorted_prefixes",
        text: "Sorted versions of every prefix.",
      },
    ],
    correctAnswerId: "end_positions",
    feedbackModel: {
      decisionSignal:
        "The next partition piece must start at the current index, so alternatives are possible end boundaries.",
      distractorExplanations: {
        unused_characters:
          "Partitioning consumes contiguous substrings in order, not arbitrary unused characters.",
        all_stack_states:
          "Stack states are unrelated to choosing substring boundaries.",
        sorted_prefixes: "Sorting changes substring content and order.",
      },
      mentalModelCorrection:
        "Partitioning enumerates cuts over the original order, then validates each candidate segment.",
      mistakeTypes: ["string_partition_misread", "choice_enumeration_misread"],
      nextAction:
        "For partitioning, name the next cut boundary before adding validity checks.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-choices-020",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_constrained_symbol_choices",
    secondarySkillAtomIds: ["parentheses_generation", "constraint_state"],
    type: "single_choice",
    prompt:
      "A valid-parentheses generator builds the next character. Which choices should the current frame consider?",
    options: [
      {
        id: "open_or_close_when_legal",
        text: "Add '(' if opens remain, and add ')' if it would not violate the prefix rule.",
      },
      {
        id: "any_ascii_character",
        text: "Try every ASCII character.",
      },
      {
        id: "only_open",
        text: "Always add '(' until the string reaches length 2n.",
      },
      {
        id: "sort_existing_path",
        text: "Sort the current path and then recurse.",
      },
    ],
    correctAnswerId: "open_or_close_when_legal",
    feedbackModel: {
      decisionSignal:
        "The next symbol has two possible forms, but each is legal only under count and prefix constraints.",
      distractorExplanations: {
        any_ascii_character:
          "The output alphabet is restricted to parentheses.",
        only_open: "Using only '(' cannot generate valid balanced strings.",
        sort_existing_path:
          "Sorting existing characters is not a next-symbol choice and destroys sequence structure.",
      },
      mentalModelCorrection:
        "Constrained generation enumerates the possible next symbols that keep the partial output valid.",
      mistakeTypes: ["choice_enumeration_misread", "constraint_ignored"],
      nextAction:
        "List the output alphabet, then apply the constraints that make each symbol legal.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-021",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_constrained_symbol_choices",
    secondarySkillAtomIds: [
      "parentheses_generation",
      "prefix_validity_reasoning",
    ],
    type: "single_choice",
    prompt:
      "A parentheses generator has openCount === closeCount and openCount < n. Which next-character choice is legal?",
    options: [
      {
        id: "open_only",
        text: "Only '(' is legal because adding ')' would make closes exceed opens.",
      },
      {
        id: "close_only",
        text: "Only ')' is legal because the counts are balanced.",
      },
      {
        id: "both_always",
        text: "Both '(' and ')' are always legal whenever counts are equal.",
      },
      {
        id: "neither",
        text: "No character is legal when counts are equal.",
      },
    ],
    correctAnswerId: "open_only",
    feedbackModel: {
      decisionSignal:
        "When opens and closes are equal, adding a close would create an invalid prefix with more closes than opens.",
      distractorExplanations: {
        close_only: "A close at this point would violate the prefix rule.",
        both_always:
          "Both are not always legal; legality depends on the prefix constraint and remaining counts.",
        neither:
          "Adding an open is legal if the maximum number of opens has not been reached.",
      },
      mentalModelCorrection:
        "Choice enumeration for constrained strings depends on the current counts, not only on the character set.",
      mistakeTypes: ["constraint_ignored", "choice_filter_misread"],
      nextAction:
        "Evaluate each candidate symbol against the prefix rule before recursing.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-choices-022",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_position_value_choices",
    secondarySkillAtomIds: [
      "candidate_value_choices",
      "backtracking_enumerate_choices",
    ],
    type: "single_choice",
    prompt:
      "A placement-style backtracking problem fills one empty slot at a time. The current slot can accept values 1 through 9 if they satisfy local rules. What should this frame enumerate?",
    options: [
      {
        id: "candidate_values",
        text: "Candidate values 1 through 9 that are legal for the current slot.",
      },
      {
        id: "future_slots_only",
        text: "Only future slots, without trying values for the current slot.",
      },
      {
        id: "previous_values",
        text: "Only values already placed in earlier slots.",
      },
      {
        id: "all_result_arrays",
        text: "Every complete result array before choosing a value.",
      },
    ],
    correctAnswerId: "candidate_values",
    feedbackModel: {
      decisionSignal:
        "When the frame owns a position or slot, its choices are the legal values that can be placed there.",
      distractorExplanations: {
        future_slots_only:
          "Skipping the current slot leaves the frame’s decision unresolved.",
        previous_values:
          "Previously placed values are state/context, not necessarily legal choices for this slot.",
        all_result_arrays:
          "Complete results are produced after choices, not enumerated before placing a value.",
      },
      mentalModelCorrection:
        "Some backtracking frames choose a value for a fixed position rather than choosing an input element or split point.",
      mistakeTypes: ["choice_enumeration_misread", "state_model_misread"],
      nextAction:
        "Identify whether the frame is choosing an item, a move, a split, a symbol, or a value for a slot.",
      result: "diagnostic",
    },
  },
];
