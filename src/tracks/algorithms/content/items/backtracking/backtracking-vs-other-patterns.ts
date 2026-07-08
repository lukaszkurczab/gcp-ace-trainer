export const backtrackingVsOtherPatternsQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-strategy-001",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_linear_scan",
    secondarySkillAtomIds: ["array_string_scan", "strategy_selection"],
    type: "single_choice",
    prompt:
      "You need to check whether a string contains two equal adjacent characters. Which strategy is most appropriate?",
    options: [
      {
        id: "linear_scan",
        text: "Scan the string once and compare each character with its previous neighbor.",
      },
      {
        id: "backtracking",
        text: "Use backtracking to try all possible character positions and undo each choice.",
      },
      {
        id: "sorting",
        text: "Sort the characters first, then check adjacent sorted characters.",
      },
      {
        id: "hash_set",
        text: "Store all seen characters in a set and return true on a repeat.",
      },
    ],
    correctAnswerId: "linear_scan",
    feedbackModel: {
      decisionSignal:
        "The prompt asks about local adjacency in the original order, so a single left-to-right scan is enough.",
      distractorExplanations: {
        backtracking:
          "There is no decision tree or reversible choice. Trying configurations would solve a much broader problem than needed.",
        sorting:
          "Sorting destroys the original neighbor relationships, which are the core of the prompt.",
        hash_set:
          "A set can detect repeated characters, but not whether the repeat is adjacent in the original string.",
      },
      mentalModelCorrection:
        "Use backtracking only when the problem asks you to explore possible configurations. Local neighbor checks usually need a direct scan.",
      mistakeTypes: ["wrong_pattern_selected", "constraint_ignored"],
      nextAction:
        "Before choosing backtracking, ask whether the task contains choices that can branch. If not, prefer the direct scan.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-strategy-002",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_hash_lookup",
    secondarySkillAtomIds: ["choose_lookup_key", "strategy_selection"],
    type: "single_choice",
    prompt:
      "Given an array of numbers and a target, return whether any two numbers add up to the target. Which strategy is most appropriate?",
    options: [
      {
        id: "hash_set_lookup",
        text: "Scan once and store seen numbers so each complement can be checked in O(1).",
      },
      {
        id: "backtracking",
        text: "Generate all possible subsets and stop when one subset sums to the target.",
      },
      {
        id: "prefix_sums",
        text: "Build prefix sums and compare every range sum to the target.",
      },
      {
        id: "stack",
        text: "Push numbers onto a stack and pop when the running sum is too large.",
      },
    ],
    correctAnswerId: "hash_set_lookup",
    feedbackModel: {
      decisionSignal:
        "The task needs a pair existence check, and each choice has a direct complement lookup.",
      distractorExplanations: {
        backtracking:
          "Backtracking explores combinations, but this prompt only needs one pair. Generating subsets is unnecessary.",
        prefix_sums:
          "Prefix sums help with contiguous range sums. A pair can use elements from any positions.",
        stack:
          "A stack helps with nested or last-in-first-out structure. This task has no stack discipline.",
      },
      mentalModelCorrection:
        "Do not generate configurations when a direct membership test answers the question.",
      mistakeTypes: ["wrong_pattern_selected", "unnecessary_search_space"],
      nextAction:
        "Look for complement, membership, or count signals before considering backtracking.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-003",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_hash_lookup",
    secondarySkillAtomIds: ["choose_lookup_key", "combinational_search"],
    type: "single_choice",
    prompt:
      "Given distinct numbers, return all subsets whose sum is exactly target. Each number may be used at most once. Which strategy is most appropriate?",
    options: [
      {
        id: "backtracking",
        text: "Explore choose/skip decisions for each number and collect paths whose sum reaches target.",
      },
      {
        id: "hash_set_lookup",
        text: "Store every number in a set and check whether target minus the current number exists.",
      },
      {
        id: "sorting_only",
        text: "Sort the numbers and return the first prefix whose sum reaches target.",
      },
      {
        id: "sliding_window",
        text: "Move a contiguous window while its sum is below or above target.",
      },
    ],
    correctAnswerId: "backtracking",
    feedbackModel: {
      decisionSignal:
        "The result requires all valid subsets, so the algorithm must explore a decision tree of included and excluded elements.",
      distractorExplanations: {
        hash_set_lookup:
          "A complement lookup handles pair existence, not all multi-element subsets.",
        sorting_only:
          "Sorting may help with pruning, but it does not by itself explore all valid combinations.",
        sliding_window:
          "Sliding window applies to contiguous ranges. A subset can skip arbitrary elements.",
      },
      mentalModelCorrection:
        "When the output is a set of possible configurations, the search space usually has to be generated explicitly.",
      mistakeTypes: ["wrong_pattern_selected", "output_contract_misread"],
      nextAction:
        "Separate pair lookup problems from configuration-generation problems.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-strategy-004",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_sorting",
    secondarySkillAtomIds: ["sorting_based_reasoning", "duplicate_reasoning"],
    type: "single_choice",
    prompt:
      "You need to check whether two strings are anagrams of each other. Which strategy is most appropriate?",
    options: [
      {
        id: "sorting_or_counting",
        text: "Sort both strings or count character frequencies and compare the normalized representation.",
      },
      {
        id: "backtracking",
        text: "Generate every permutation of the first string and check whether one equals the second.",
      },
      {
        id: "two_pointers",
        text: "Use two pointers from both ends and compare mirrored characters.",
      },
      {
        id: "prefix_sums",
        text: "Build prefix sums for both strings and compare range totals.",
      },
    ],
    correctAnswerId: "sorting_or_counting",
    feedbackModel: {
      decisionSignal:
        "An anagram check needs equality of character multiset, not enumeration of possible orders.",
      distractorExplanations: {
        backtracking:
          "Generating permutations is exponentially larger than comparing counts or sorted forms.",
        two_pointers:
          "Two pointers do not compare character frequencies unless the input has a special ordering constraint.",
        prefix_sums:
          "Prefix sums are for numeric ranges, not character multiset equality.",
      },
      mentalModelCorrection:
        "If order can be normalized away, use sorting or counting instead of exploring arrangements.",
      mistakeTypes: ["wrong_pattern_selected", "complexity_misread"],
      nextAction:
        "Ask whether the task needs one normalized representation or all possible arrangements.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-005",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_sorting",
    secondarySkillAtomIds: ["permutation_search", "duplicate_control"],
    type: "single_choice",
    prompt:
      "Given a list of distinct values, return every possible ordering of those values. Which strategy is most appropriate?",
    options: [
      {
        id: "backtracking",
        text: "Build a path by choosing each unused value, recurse, then undo the choice.",
      },
      {
        id: "sorting",
        text: "Sort the values once and return the sorted list.",
      },
      {
        id: "hash_set_lookup",
        text: "Put all values in a set and read them back in any order.",
      },
      {
        id: "binary_search",
        text: "Binary search each value after sorting the list.",
      },
    ],
    correctAnswerId: "backtracking",
    feedbackModel: {
      decisionSignal:
        "The output asks for every ordering, so the algorithm must branch over unused choices at each position.",
      distractorExplanations: {
        sorting:
          "Sorting returns one canonical order, not all possible orders.",
        hash_set_lookup:
          "A set can track membership, but it does not enumerate ordered arrangements.",
        binary_search:
          "Binary search locates values in sorted input. It does not generate permutations.",
      },
      mentalModelCorrection:
        "Sorting organizes input; backtracking enumerates possible configurations.",
      mistakeTypes: ["wrong_pattern_selected", "output_contract_misread"],
      nextAction:
        "When the required output size itself is factorial or combinational, expect explicit enumeration.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-006",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_two_pointers",
    secondarySkillAtomIds: ["move_decisive_pointer", "strategy_selection"],
    type: "single_choice",
    prompt:
      "Given a sorted array, return whether any pair sums to target. Which strategy is most appropriate?",
    options: [
      {
        id: "two_pointers",
        text: "Move one pointer from the left and one from the right based on the current sum.",
      },
      {
        id: "backtracking",
        text: "Try every possible subset and backtrack when the sum exceeds target.",
      },
      {
        id: "sliding_window",
        text: "Expand and shrink a contiguous window until its sum equals target.",
      },
      {
        id: "tree_traversal",
        text: "Treat the array as a tree and traverse left and right children.",
      },
    ],
    correctAnswerId: "two_pointers",
    feedbackModel: {
      decisionSignal:
        "Sorted order gives a monotonic pointer movement rule for pair sums.",
      distractorExplanations: {
        backtracking:
          "The task asks for a pair, not arbitrary configurations. Sorted order removes the need for branching.",
        sliding_window:
          "A sliding window represents a contiguous range. A pair is not a window.",
        tree_traversal:
          "The input is a sorted array, not an existing tree structure.",
      },
      mentalModelCorrection:
        "When sorted input gives a safe left/right movement rule, prefer two pointers over search-tree enumeration.",
      mistakeTypes: ["wrong_pattern_selected", "monotonic_signal_missed"],
      nextAction:
        "Look for sorted input plus pair/outer-bound signals before reaching for backtracking.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-007",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_sliding_window",
    secondarySkillAtomIds: [
      "sliding_window_invariant",
      "string_window_reasoning",
    ],
    type: "single_choice",
    prompt:
      "Given a string, return the length of the longest substring with at most k distinct characters. Which strategy is most appropriate?",
    options: [
      {
        id: "sliding_window",
        text: "Maintain a contiguous window, character counts, and shrink while the distinct count exceeds k.",
      },
      {
        id: "backtracking",
        text: "Generate every subsequence and keep the longest one with at most k distinct characters.",
      },
      {
        id: "sorting",
        text: "Sort the characters and count the longest group with at most k distinct characters.",
      },
      {
        id: "binary_search",
        text: "Binary search for each character position in the original string.",
      },
    ],
    correctAnswerId: "sliding_window",
    feedbackModel: {
      decisionSignal:
        "The prompt asks for a longest contiguous substring with a locally maintainable window invariant.",
      distractorExplanations: {
        backtracking:
          "Backtracking over subsequences changes the problem. A substring must remain contiguous.",
        sorting: "Sorting destroys substring contiguity and original order.",
        binary_search:
          "There is no monotonic search target over sorted positions.",
      },
      mentalModelCorrection:
        "Contiguous substring constraints often point to sliding window, not backtracking.",
      mistakeTypes: ["wrong_pattern_selected", "contiguity_missed"],
      nextAction:
        "Identify whether the selected characters must form a contiguous range before choosing a strategy.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-008",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_sliding_window",
    secondarySkillAtomIds: ["subsequence_vs_substring", "combinational_search"],
    type: "single_choice",
    prompt:
      "Given a string, return all subsequences of length k that contain no repeated character. Which strategy is most appropriate?",
    options: [
      {
        id: "backtracking",
        text: "Choose or skip characters while tracking the path and used characters until the path length is k.",
      },
      {
        id: "sliding_window",
        text: "Maintain a window of length k and slide it across the string.",
      },
      {
        id: "prefix_sums",
        text: "Build prefix sums for character codes and compare range totals.",
      },
      {
        id: "two_pointers",
        text: "Move two pointers inward from both ends and collect matching characters.",
      },
    ],
    correctAnswerId: "backtracking",
    feedbackModel: {
      decisionSignal:
        "Subsequences are non-contiguous choices, and the output asks for all valid selections.",
      distractorExplanations: {
        sliding_window:
          "Sliding window only considers contiguous substrings, not subsequences that can skip positions.",
        prefix_sums:
          "Prefix sums summarize contiguous ranges and do not enumerate character selections.",
        two_pointers:
          "Two pointers are useful when movement rules are monotonic or pair-based. This task branches over include/skip decisions.",
      },
      mentalModelCorrection:
        "Use sliding window for contiguous ranges; use backtracking when valid choices can skip positions and must be enumerated.",
      mistakeTypes: ["wrong_pattern_selected", "contiguity_missed"],
      nextAction:
        "Separate substring signals from subsequence signals before selecting the pattern.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-009",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_prefix_sums",
    secondarySkillAtomIds: ["prefix_sum_range_reasoning", "strategy_selection"],
    type: "single_choice",
    prompt:
      "You need to answer many queries asking for the sum of elements between indices l and r in a fixed array. Which strategy is most appropriate?",
    options: [
      {
        id: "prefix_sums",
        text: "Precompute prefix sums so each range sum can be answered by subtraction.",
      },
      {
        id: "backtracking",
        text: "Try all possible subsets inside the range and collect the sums.",
      },
      {
        id: "sorting",
        text: "Sort the array and use the sorted positions for each query.",
      },
      {
        id: "stack",
        text: "Push values from l to r onto a stack and pop them to compute the sum.",
      },
    ],
    correctAnswerId: "prefix_sums",
    feedbackModel: {
      decisionSignal:
        "The task asks for repeated contiguous range sums on fixed data, which prefix sums answer directly.",
      distractorExplanations: {
        backtracking:
          "There are no choices to explore. Each query identifies one fixed range.",
        sorting:
          "Sorting changes indices, so it breaks the meaning of l and r.",
        stack: "A stack adds no useful structure for static range-sum queries.",
      },
      mentalModelCorrection:
        "When a query asks for a property of a fixed range, summarize the range instead of exploring configurations.",
      mistakeTypes: ["wrong_pattern_selected", "range_contract_misread"],
      nextAction:
        "Look for repeated range-query signals before considering recursive search.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-strategy-010",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_stack",
    secondarySkillAtomIds: ["use_last_unresolved_state", "strategy_selection"],
    type: "single_choice",
    prompt:
      "Given a string of brackets, return whether every opening bracket is closed in the correct order. Which strategy is most appropriate?",
    options: [
      {
        id: "stack",
        text: "Push opening brackets and require each closing bracket to match the top of the stack.",
      },
      {
        id: "backtracking",
        text: "Try all possible ways to pair opening and closing brackets and undo invalid pairings.",
      },
      {
        id: "sliding_window",
        text: "Maintain a window with equal numbers of opening and closing brackets.",
      },
      {
        id: "binary_search",
        text: "Binary search for the matching closing bracket of each opening bracket.",
      },
    ],
    correctAnswerId: "stack",
    feedbackModel: {
      decisionSignal:
        "The problem has a last-opened, first-closed nesting rule, which is exactly stack structure.",
      distractorExplanations: {
        backtracking:
          "The pairings are not arbitrary choices. The nesting order determines the only valid next match.",
        sliding_window:
          "Equal counts inside a window do not guarantee correct nesting order.",
        binary_search:
          "There is no sorted monotonic predicate for matching brackets.",
      },
      mentalModelCorrection:
        "Do not treat every pairing problem as search. Nested order usually points to a stack.",
      mistakeTypes: ["wrong_pattern_selected", "structure_signal_missed"],
      nextAction:
        "When the newest unresolved item must be handled first, test the stack model before considering backtracking.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-backtracking-strategy-011",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_binary_search",
    secondarySkillAtomIds: ["identify_monotonic_predicate", "strategy_selection"],
    type: "single_choice",
    prompt:
      "Given a sorted array and a target value, return the index of the target if it exists. Which strategy is most appropriate?",
    options: [
      {
        id: "binary_search",
        text: "Repeatedly compare the target with the middle value and discard the impossible half.",
      },
      {
        id: "backtracking",
        text: "Recursively try both halves and backtrack if the target is not found.",
      },
      {
        id: "hash_map",
        text: "Build a map from value to index before every lookup.",
      },
      {
        id: "two_pointers",
        text: "Move one pointer from each end until they meet at the target.",
      },
    ],
    correctAnswerId: "binary_search",
    feedbackModel: {
      decisionSignal:
        "Sorted input gives a monotonic discard rule: one comparison eliminates half the search space.",
      distractorExplanations: {
        backtracking:
          "There is no reversible choice tree. The sorted order tells you which branch is impossible.",
        hash_map:
          "A map can help with many repeated arbitrary lookups, but the prompt already gives sorted input suitable for binary search.",
        two_pointers:
          "Two pointers are more useful for pair/range movement, not locating one target by ordered comparisons.",
      },
      mentalModelCorrection:
        "If each comparison proves one side impossible, use binary search rather than exploring both sides.",
      mistakeTypes: ["wrong_pattern_selected", "monotonic_signal_missed"],
      nextAction:
        "Look for sorted input plus a target and a safe discard rule.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-012",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_recursion_basics",
    secondarySkillAtomIds: ["recursion_basics", "strategy_selection"],
    type: "single_choice",
    prompt:
      "Compute the factorial of n recursively. Which description best matches the needed strategy?",
    options: [
      {
        id: "recursion_basics",
        text: "Reduce n toward a base case and combine the returned value.",
      },
      {
        id: "backtracking",
        text: "Try multiple choices at each level and undo each choice after recursion returns.",
      },
      {
        id: "sliding_window",
        text: "Maintain a moving range of values from 1 to n.",
      },
      {
        id: "heap",
        text: "Always extract the largest remaining number and multiply it into the result.",
      },
    ],
    correctAnswerId: "recursion_basics",
    feedbackModel: {
      decisionSignal:
        "Factorial has one recursive subproblem per call and no branching choices to undo.",
      distractorExplanations: {
        backtracking:
          "Backtracking is not the same as recursion. It requires a branching choice space and reversible state.",
        sliding_window: "There is no contiguous window invariant to maintain.",
        heap: "A priority queue is unnecessary because the order of multiplication is fixed by the recurrence.",
      },
      mentalModelCorrection:
        "Recursion becomes backtracking only when recursive calls explore alternative choices.",
      mistakeTypes: ["wrong_pattern_selected", "recursion_overgeneralized"],
      nextAction:
        "For every recursive problem, ask whether each call has one required next step or many possible choices.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-013",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_recursion_basics",
    secondarySkillAtomIds: ["recursion_basics", "combinational_search"],
    type: "single_choice",
    prompt:
      "Generate every valid string of n pairs of parentheses. Which strategy is most appropriate?",
    options: [
      {
        id: "backtracking",
        text: "Build the string by choosing '(' or ')' when valid, recurse, and undo the added character.",
      },
      {
        id: "recursion_basics",
        text: "Use a single recursive call that reduces n until it reaches zero.",
      },
      {
        id: "stack_validation",
        text: "Push and pop brackets to validate one already-built string.",
      },
      {
        id: "sorting",
        text: "Sort all brackets so opening brackets come before closing brackets.",
      },
    ],
    correctAnswerId: "backtracking",
    feedbackModel: {
      decisionSignal:
        "The task asks to generate all valid configurations under constraints, so each position branches over valid choices.",
      distractorExplanations: {
        recursion_basics:
          "A single recurrence is not enough because each position may have multiple valid choices.",
        stack_validation:
          "A stack can validate a completed candidate, but it does not generate all valid strings.",
        sorting:
          "Sorting brackets creates one invalid block-like arrangement, not all valid nested configurations.",
      },
      mentalModelCorrection:
        "Backtracking is recursive generation with constraints and undo; stack validation checks one existing sequence.",
      mistakeTypes: ["wrong_pattern_selected", "output_contract_misread"],
      nextAction:
        "Distinguish generating all valid outputs from validating one candidate output.",
      result: "diagnostic",
    },
  },

  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    id: "alg-backtracking-strategy-014",
    learningStage: "foundations",
    primarySkillAtomId: "backtracking_vs_tree_traversal",
    secondarySkillAtomIds: ["tree_traversal", "strategy_selection"],
    type: "single_choice",
    prompt:
      "Given the root of a binary tree, return the sum of all node values. Which strategy is most appropriate?",
    options: [
      {
        id: "tree_traversal",
        text: "Traverse the existing tree and accumulate each node value once.",
      },
      {
        id: "backtracking",
        text: "Generate possible tree paths, undo each path choice, and collect valid configurations.",
      },
      {
        id: "binary_search",
        text: "Use the middle node value to discard half of the tree.",
      },
      {
        id: "prefix_sums",
        text: "Build prefix sums over the tree nodes and answer range queries.",
      },
    ],
    correctAnswerId: "tree_traversal",
    feedbackModel: {
      decisionSignal:
        "The input already is a tree, and the task only requires visiting each existing node once.",
      distractorExplanations: {
        backtracking:
          "Backtracking generates a decision tree of possible choices. Here the tree structure already exists and no choices need undoing.",
        binary_search:
          "A general binary tree does not provide the ordering guarantee needed to discard half the search space.",
        prefix_sums:
          "Prefix sums are for ordered linear ranges, not a general tree sum.",
      },
      mentalModelCorrection:
        "Traversing an existing tree is not the same as generating a search tree of choices.",
      mistakeTypes: ["wrong_pattern_selected", "structure_signal_missed"],
      nextAction:
        "Ask whether the tree is input data to visit or an implicit decision tree to generate.",
      result: "diagnostic",
    },
  },
];
