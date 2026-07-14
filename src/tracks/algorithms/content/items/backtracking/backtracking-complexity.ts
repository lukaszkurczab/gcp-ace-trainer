import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const backtrackingComplexityQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-complexity-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_output_size_reasoning",
    "secondarySkillAtomIds": [
      "subset_generation",
      "complexity_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A function returns all subsets of n distinct values. What lower bound does the output size impose?",
    "feedbackModel": {
      "decisionSignal": "Each element can be included or skipped, creating 2^n possible subsets.",
      "distractorExplanations": {
        "n_only": "n counts input elements, not subset outputs.",
        "log_n": "The output itself is exponentially large, so logarithmic total output time is impossible.",
        "one_result": "Different include/skip choices produce different subsets that must be returned."
      },
      "mentalModelCorrection": "When the prompt asks to return all configurations, output size is part of the complexity.",
      "mistakeTypes": [
        "complexity_misread",
        "output_contract_misread"
      ],
      "nextAction": "Estimate how many results the contract may require before judging the algorithm.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_output_size_reasoning",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "Each element can be included or skipped, creating 2^n possible subsets.",
    "options": [
      {
        "id": "two_power_n",
        "text": "It must be able to output 2^n subsets.",
        "isCorrect": true
      },
      {
        "id": "n_only",
        "text": "It only needs to output n subsets.",
        "isCorrect": false
      },
      {
        "id": "log_n",
        "text": "It can output all subsets in O(log n).",
        "isCorrect": false
      },
      {
        "id": "one_result",
        "text": "It only needs one subset because all subsets are equivalent.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-complexity-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_output_size_reasoning",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "complexity_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A function returns all permutations of n distinct values. What output-size growth should you expect?",
    "feedbackModel": {
      "decisionSignal": "The first position has n choices, the next has n - 1, and so on, producing n! orderings.",
      "distractorExplanations": {
        "linear": "Linear growth understates the number of possible orderings.",
        "constant": "One ordering would be sorting or a single arrangement, not all permutations.",
        "logarithmic": "Binary-style reduction is unrelated to enumerating all orderings."
      },
      "mentalModelCorrection": "Permutation generation has factorial output size when all values are distinct.",
      "mistakeTypes": [
        "complexity_misread",
        "output_contract_misread"
      ],
      "nextAction": "Look for ordered arrangement output; if all arrangements are requested, expect factorial growth.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_output_size_reasoning",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "The first position has n choices, the next has n - 1, and so on, producing n! orderings.",
    "options": [
      {
        "id": "factorial",
        "text": "n! permutations.",
        "isCorrect": true
      },
      {
        "id": "linear",
        "text": "n permutations.",
        "isCorrect": false
      },
      {
        "id": "constant",
        "text": "One permutation.",
        "isCorrect": false
      },
      {
        "id": "logarithmic",
        "text": "log n permutations.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-complexity-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_output_size_reasoning",
    "secondarySkillAtomIds": [
      "combination_generation",
      "exact_length_contract"
    ],
    "type": "single_choice",
    "prompt": "A function returns all combinations of exactly k values from n distinct candidates. Which expression best describes the number of possible outputs?",
    "feedbackModel": {
      "decisionSignal": "Exact-size combinations choose k elements from n without treating different orders as separate outputs.",
      "distractorExplanations": {
        "n_factorial": "n! describes all ordered permutations, not unordered size-k combinations.",
        "two_n_only": "2n is not the number of include/skip subsets or size-k combinations.",
        "one": "A fixed output size does not mean only one possible combination exists."
      },
      "mentalModelCorrection": "Combination output size depends on choosing which k candidates are included, not their order.",
      "mistakeTypes": [
        "complexity_misread",
        "permutation_combination_confused"
      ],
      "nextAction": "Separate unordered selection count from ordered arrangement count.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_output_size_reasoning",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "permutation_combination_confused",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "Exact-size combinations choose k elements from n without treating different orders as separate outputs.",
    "options": [
      {
        "id": "n_choose_k",
        "text": "C(n, k), the number of k-element subsets.",
        "isCorrect": true
      },
      {
        "id": "n_factorial",
        "text": "n!, because order always matters.",
        "isCorrect": false
      },
      {
        "id": "two_n_only",
        "text": "2n, because each candidate has two states.",
        "isCorrect": false
      },
      {
        "id": "one",
        "text": "One output, because k is fixed.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-complexity-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_output_size_reasoning",
    "secondarySkillAtomIds": [
      "backtracking_result_collection",
      "unnecessary_search_space"
    ],
    "type": "single_choice",
    "prompt": "A problem asks to return all valid configurations. Why can even an optimal backtracking solution still take exponential time?",
    "feedbackModel": {
      "decisionSignal": "If the output can contain exponentially many configurations, producing them already requires exponential total work.",
      "distractorExplanations": {
        "backtracking_always_bad": "Backtracking is appropriate when the output contract requires enumerating configurations.",
        "recursion_slow": "The dominant cost is the search/output space, not recursion syntax itself.",
        "sorting_missing": "Sorting may help pruning or duplicate control, but it does not remove inherent output size."
      },
      "mentalModelCorrection": "Do not judge enumeration algorithms only by input size; include required output size.",
      "mistakeTypes": [
        "complexity_misread",
        "output_contract_misread"
      ],
      "nextAction": "Ask whether the requested result list can itself be large.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_output_size_reasoning",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "If the output can contain exponentially many configurations, producing them already requires exponential total work.",
    "options": [
      {
        "id": "many_outputs",
        "text": "Because the number of valid outputs itself may be exponential.",
        "isCorrect": true
      },
      {
        "id": "backtracking_always_bad",
        "text": "Because backtracking is always the wrong strategy.",
        "isCorrect": false
      },
      {
        "id": "recursion_slow",
        "text": "Because recursive calls are always slower than loops by definition.",
        "isCorrect": false
      },
      {
        "id": "sorting_missing",
        "text": "Because exponential time only happens when input is not sorted.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-complexity-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_pruning_complexity",
    "secondarySkillAtomIds": [
      "constraint_pruning",
      "complexity_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A sorted positive combination-sum search uses pruning when candidate > remaining. What is the best complexity assessment?",
    "feedbackModel": {
      "decisionSignal": "Safe pruning cuts impossible branches, but the algorithm may still need to enumerate many valid outputs.",
      "distractorExplanations": {
        "always_linear": "Pruning does not guarantee linear time for combinational output.",
        "removes_recursion": "The search still explores legal alternatives.",
        "invalidates_results": "Safe pruning preserves correctness by skipping only impossible branches."
      },
      "mentalModelCorrection": "Pruning improves the search tree but does not erase output-size lower bounds.",
      "mistakeTypes": [
        "complexity_misread",
        "pruning_misread"
      ],
      "nextAction": "Separate worst-case output requirements from avoidable invalid branches.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_pruning_complexity",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "pruning_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "Safe pruning cuts impossible branches, but the algorithm may still need to enumerate many valid outputs.",
    "options": [
      {
        "id": "reduces_explored_states",
        "text": "Pruning can reduce explored states, but it does not change the fact that many valid combinations may need to be output.",
        "isCorrect": true
      },
      {
        "id": "always_linear",
        "text": "Pruning makes the algorithm always O(n).",
        "isCorrect": false
      },
      {
        "id": "removes_recursion",
        "text": "Pruning removes the need for recursive search.",
        "isCorrect": false
      },
      {
        "id": "invalidates_results",
        "text": "Any pruning invalidates the result contract.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-complexity-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_complexity_branching_depth",
    "secondarySkillAtomIds": [
      "backtracking_enumerate_choices",
      "complexity_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A backtracking search has up to b legal choices at each level and depth d. What rough search-tree size should you consider before pruning?",
    "feedbackModel": {
      "decisionSignal": "Branching search can multiply choices across levels, producing exponential growth in depth.",
      "distractorExplanations": {
        "b_plus_d": "Adding branching factor and depth ignores multiplication across levels.",
        "log_b_d": "Logarithmic growth is associated with repeated discard, not full branching.",
        "constant": "A branching search does not remain constant as depth grows."
      },
      "mentalModelCorrection": "Backtracking cost is shaped by branching factor times recursion depth.",
      "mistakeTypes": [
        "complexity_misread",
        "branching_factor_misread"
      ],
      "nextAction": "Estimate both how many choices each frame has and how many levels the search can reach.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_complexity_branching_depth",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "branching_factor_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "Branching search can multiply choices across levels, producing exponential growth in depth.",
    "options": [
      {
        "id": "b_power_d",
        "text": "O(b^d) possible branches.",
        "isCorrect": true
      },
      {
        "id": "b_plus_d",
        "text": "O(b + d) possible branches.",
        "isCorrect": false
      },
      {
        "id": "log_b_d",
        "text": "O(log d) possible branches.",
        "isCorrect": false
      },
      {
        "id": "constant",
        "text": "O(1) possible branches.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-complexity-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_complexity_branching_depth",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "word_search_state"
    ],
    "type": "single_choice",
    "prompt": "In word search on a grid, why is the search often described as branching by neighboring moves over the length of the word?",
    "feedbackModel": {
      "decisionSignal": "Grid word search explores adjacent path choices for each target character position.",
      "distractorExplanations": {
        "sort_per_character": "Sorting destroys adjacency and is not part of the movement model.",
        "binary_discard": "There is no sorted monotonic half-discard rule.",
        "one_global_visit": "Path search uses branch-local visited; cells may be reconsidered in sibling paths."
      },
      "mentalModelCorrection": "The depth is tied to target progress, and the branching comes from legal neighboring moves.",
      "mistakeTypes": [
        "complexity_misread",
        "grid_movement_misread"
      ],
      "nextAction": "For path search, estimate choices per step and the maximum path length.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_complexity_branching_depth",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "grid_movement_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "Grid word search explores adjacent path choices for each target character position.",
    "options": [
      {
        "id": "move_per_character",
        "text": "Each matched character may branch into neighboring cells for the next character.",
        "isCorrect": true
      },
      {
        "id": "sort_per_character",
        "text": "Each character requires sorting the whole grid.",
        "isCorrect": false
      },
      {
        "id": "binary_discard",
        "text": "Each character discards half of the board by sorted order.",
        "isCorrect": false
      },
      {
        "id": "one_global_visit",
        "text": "Each cell is visited once globally and never reconsidered.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-complexity-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_complexity_vs_direct_check",
    "secondarySkillAtomIds": [
      "strategy_selection",
      "wrong_pattern_selected"
    ],
    "type": "single_choice",
    "prompt": "A task only asks whether a string contains two equal adjacent characters. Why is backtracking complexity unjustified here?",
    "feedbackModel": {
      "decisionSignal": "The problem has a simple local adjacency condition over the original order, not branching choices.",
      "distractorExplanations": {
        "needs_all_subsets": "Subsets ignore adjacency and solve a different problem.",
        "needs_permutations": "Permutations change order and create unnecessary search.",
        "needs_grid_moves": "The input is a string, not a grid path problem."
      },
      "mentalModelCorrection": "Backtracking is unjustified when a direct deterministic check answers the exact contract.",
      "mistakeTypes": [
        "wrong_pattern_selected",
        "unnecessary_search_space"
      ],
      "nextAction": "Before accepting exponential search, check whether a direct scan or lookup answers the task.",
      "result": "diagnostic"
    },
    "roadmapNodeId": "backtracking",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "backtracking",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "backtracking_complexity_vs_direct_check",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_pattern_selected",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_search_space",
        "role": "mistake_type"
      }
    ],
    "title": "Complexity",
    "trackId": "algorithms",
    "answerFeedback": "The problem has a simple local adjacency condition over the original order, not branching choices.",
    "options": [
      {
        "id": "direct_scan_enough",
        "text": "A direct scan checks every adjacent pair once, so there is no configuration space to enumerate.",
        "isCorrect": true
      },
      {
        "id": "needs_all_subsets",
        "text": "The task requires all subsets of characters.",
        "isCorrect": false
      },
      {
        "id": "needs_permutations",
        "text": "The task requires every possible ordering of the string.",
        "isCorrect": false
      },
      {
        "id": "needs_grid_moves",
        "text": "The task requires moving through neighboring grid cells.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
