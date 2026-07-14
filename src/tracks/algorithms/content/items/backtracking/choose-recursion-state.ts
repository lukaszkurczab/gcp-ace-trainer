import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const chooseRecursionStateQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-state-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_index_state",
    "secondarySkillAtomIds": [
      "backtracking_recursion_state",
      "subset_generation"
    ],
    "type": "single_choice",
    "prompt": "A backtracking function generates subsets by deciding for each number whether to include it or skip it. What state must each recursive call carry to know which number is being decided next?",
    "feedbackModel": {
      "decisionSignal": "A choose/skip recursion makes one decision per input position, so it needs the current index.",
      "distractorExplanations": {
        "visited": "Visited is useful when any unused element can be chosen next, such as permutations. Choose/skip only moves forward by position.",
        "left_right": "Two pointers solve ordered pair/range problems, not binary include/skip recursion.",
        "sorted_path": "Sorting the path does not tell the recursion which input element is being decided next."
      },
      "mentalModelCorrection": "For binary include/skip search, the core progress state is the input position currently under decision.",
      "mistakeTypes": [
        "state_model_misread",
        "wrong_pattern_selected"
      ],
      "nextAction": "Before writing choices, identify what unit of progress each recursive level represents.",
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
        "nodeId": "backtracking_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_pattern_selected",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "A choose/skip recursion makes one decision per input position, so it needs the current index.",
    "options": [
      {
        "id": "index",
        "text": "The current index in the input array.",
        "isCorrect": true
      },
      {
        "id": "visited",
        "text": "A visited array marking every number used in any previous subset.",
        "isCorrect": false
      },
      {
        "id": "left_right",
        "text": "A left pointer and a right pointer moving toward each other.",
        "isCorrect": false
      },
      {
        "id": "sorted_path",
        "text": "The current path sorted after every choice.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_index_state",
    "secondarySkillAtomIds": [
      "choose_skip_branching",
      "backtracking_recursion_state"
    ],
    "type": "single_choice",
    "prompt": "In a choose/skip recursion over nums, the current call is deciding nums[index]. What should the next recursive state do after either including or skipping this value?",
    "feedbackModel": {
      "decisionSignal": "After include or skip, the branch has finished the decision for the current position, so progress moves to the next index.",
      "distractorExplanations": {
        "keep_same_index": "Keeping the same index would repeat the same decision and can create infinite recursion.",
        "reset_index": "Restarting from zero duplicates decisions already represented by the current branch.",
        "move_index_backward": "Moving backward breaks the one-decision-per-position contract of choose/skip recursion."
      },
      "mentalModelCorrection": "The recursive state should advance exactly when the current decision has been resolved.",
      "mistakeTypes": [
        "state_progress_error",
        "recursion_state_misread"
      ],
      "nextAction": "For each branch, state which input decision has just been consumed.",
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
        "nodeId": "backtracking_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_progress_error",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "recursion_state_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "After include or skip, the branch has finished the decision for the current position, so progress moves to the next index.",
    "options": [
      {
        "id": "advance_index",
        "text": "Call recursion with index + 1 because the decision for nums[index] is complete.",
        "isCorrect": true
      },
      {
        "id": "keep_same_index",
        "text": "Call recursion with the same index so the same number can be reconsidered.",
        "isCorrect": false
      },
      {
        "id": "reset_index",
        "text": "Reset index to 0 so every branch can start from the beginning.",
        "isCorrect": false
      },
      {
        "id": "move_index_backward",
        "text": "Call recursion with index - 1 to check earlier choices again.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_index_state",
    "secondarySkillAtomIds": [
      "choose_skip_branching",
      "backtracking_path_state"
    ],
    "type": "single_choice",
    "prompt": "A recursive subset search stores the current path but does not pass an index. Why is that state incomplete?",
    "feedbackModel": {
      "decisionSignal": "The recursion needs both the partial output and the progress marker through the input.",
      "distractorExplanations": {
        "no_sorted_order": "Sorting is not required for basic subset generation and does not replace progress state.",
        "no_stack_top": "Subset generation is not governed by last-in-first-out structure.",
        "no_target_sum": "A remaining target is needed only when the prompt has a target-sum constraint."
      },
      "mentalModelCorrection": "Path records the partial answer; index records where the recursion is in the input.",
      "mistakeTypes": [
        "state_model_misread",
        "missing_progress_state"
      ],
      "nextAction": "Separate partial-result state from input-progress state.",
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
        "nodeId": "backtracking_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "missing_progress_state",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "The recursion needs both the partial output and the progress marker through the input.",
    "options": [
      {
        "id": "no_next_position",
        "text": "The path says what has been chosen, but not which input position should be decided next.",
        "isCorrect": true
      },
      {
        "id": "no_sorted_order",
        "text": "The path cannot be valid unless it is sorted after every recursive call.",
        "isCorrect": false
      },
      {
        "id": "no_stack_top",
        "text": "The path must expose a stack top before any next choice can be made.",
        "isCorrect": false
      },
      {
        "id": "no_target_sum",
        "text": "Every subset problem must carry a remaining target.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-state-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_start_index_state",
    "secondarySkillAtomIds": [
      "combination_generation",
      "backtracking_recursion_state"
    ],
    "type": "single_choice",
    "prompt": "A function builds combinations by looping over candidates at each depth. It should never go back to earlier positions. What state tells the next call where its loop may begin?",
    "feedbackModel": {
      "decisionSignal": "Combination recursion needs a boundary that prevents later levels from reusing or reordering earlier candidates.",
      "distractorExplanations": {
        "global_seen": "A global set would block values across unrelated branches. The restriction is about position order within one branch.",
        "left_right": "Two pointers are not the loop boundary for combination generation.",
        "current_sum_only": "The sum does not tell the recursion which candidate indices are still legal."
      },
      "mentalModelCorrection": "For combinations, startIndex is the state that encodes forward-only candidate selection.",
      "mistakeTypes": [
        "state_model_misread",
        "order_constraint_missed"
      ],
      "nextAction": "When order should not create separate results, look for a forward boundary like startIndex.",
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
        "nodeId": "backtracking_start_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "order_constraint_missed",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Combination recursion needs a boundary that prevents later levels from reusing or reordering earlier candidates.",
    "options": [
      {
        "id": "start_index",
        "text": "startIndex, the first candidate index allowed for the next level.",
        "isCorrect": true
      },
      {
        "id": "global_seen",
        "text": "A global set of all values ever used by any branch.",
        "isCorrect": false
      },
      {
        "id": "left_right",
        "text": "Two pointers around the remaining candidate range.",
        "isCorrect": false
      },
      {
        "id": "current_sum_only",
        "text": "Only the current sum of the selected values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_start_index_state",
    "secondarySkillAtomIds": [
      "combination_generation",
      "no_reuse_contract"
    ],
    "type": "single_choice",
    "prompt": "A combination generator chooses candidate at index i. Each input value may be used at most once. What should the next recursive start state usually be?",
    "feedbackModel": {
      "decisionSignal": "For no-reuse combinations, choosing index i consumes that position and the next level starts after it.",
      "distractorExplanations": {
        "i": "Keeping i is used when the same candidate may be reused. That violates the at-most-once contract.",
        "zero": "Restarting at zero allows reordered duplicates such as [a, b] and [b, a].",
        "nums_length": "Jumping to the end prevents building combinations with more than one chosen value."
      },
      "mentalModelCorrection": "The next start position encodes whether a candidate can be reused and whether order matters.",
      "mistakeTypes": [
        "state_progress_error",
        "reuse_contract_misread"
      ],
      "nextAction": "After choosing candidate i, decide whether reuse is allowed before choosing i or i + 1.",
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
        "nodeId": "backtracking_start_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_progress_error",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "reuse_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "For no-reuse combinations, choosing index i consumes that position and the next level starts after it.",
    "options": [
      {
        "id": "i_plus_one",
        "text": "i + 1, so the next level can only use later candidates.",
        "isCorrect": true
      },
      {
        "id": "i",
        "text": "i, so the same candidate can be chosen again.",
        "isCorrect": false
      },
      {
        "id": "zero",
        "text": "0, so the next level can choose any candidate again.",
        "isCorrect": false
      },
      {
        "id": "nums_length",
        "text": "nums.length, so the branch immediately stops after one choice.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_start_index_state",
    "secondarySkillAtomIds": [
      "combination_generation",
      "backtracking_visited_state"
    ],
    "type": "single_choice",
    "prompt": "A problem asks for combinations where order does not matter. Which state choice best prevents generating the same combination in different orders?",
    "feedbackModel": {
      "decisionSignal": "A forward start boundary prevents the same unordered set from being generated through different pick orders.",
      "distractorExplanations": {
        "visited_only": "Visited allows any unused element next, which is appropriate for permutations but can generate reordered combinations.",
        "current_min": "The smallest value does not reliably define which indices are legal next.",
        "path_string": "Comparing serialized paths deduplicates after the fact instead of modeling the search state correctly."
      },
      "mentalModelCorrection": "For combinations, encode order-insensitivity in the recursion state instead of cleaning duplicates later.",
      "mistakeTypes": [
        "state_model_misread",
        "duplicate_control_misread"
      ],
      "nextAction": "Use startIndex when the same selected set should appear only once.",
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
        "nodeId": "backtracking_start_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "duplicate_control_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "A forward start boundary prevents the same unordered set from being generated through different pick orders.",
    "options": [
      {
        "id": "start_index",
        "text": "Use startIndex so each deeper level only considers later candidates.",
        "isCorrect": true
      },
      {
        "id": "visited_only",
        "text": "Use only visited so every unused element can be chosen at every depth.",
        "isCorrect": false
      },
      {
        "id": "current_min",
        "text": "Track only the smallest selected value.",
        "isCorrect": false
      },
      {
        "id": "path_string",
        "text": "Convert path to a string and compare it with previous paths.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_start_index_state",
    "secondarySkillAtomIds": [
      "combination_generation",
      "ordering_constraint"
    ],
    "type": "single_choice",
    "prompt": "A branch has selected nums[2] in a combination problem. The next recursive call starts its loop at index 0. What state mistake does this create?",
    "feedbackModel": {
      "decisionSignal": "Restarting the loop from zero loses the forward-only boundary that makes combinations order-insensitive.",
      "distractorExplanations": {
        "misses_later_candidates": "Starting at zero does not miss later candidates; it considers too many earlier ones.",
        "forces_boolean_result": "The start index does not determine the return type.",
        "removes_path": "Loop start does not automatically clear path."
      },
      "mentalModelCorrection": "The start boundary is part of the semantic state, not a minor loop detail.",
      "mistakeTypes": [
        "state_progress_error",
        "order_constraint_missed"
      ],
      "nextAction": "Track whether the next level is allowed to revisit earlier indices.",
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
        "nodeId": "backtracking_start_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_progress_error",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "order_constraint_missed",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Restarting the loop from zero loses the forward-only boundary that makes combinations order-insensitive.",
    "options": [
      {
        "id": "reordered_combinations",
        "text": "It allows earlier candidates to be chosen after later ones, creating reordered duplicates.",
        "isCorrect": true
      },
      {
        "id": "misses_later_candidates",
        "text": "It prevents candidates after index 2 from ever being considered.",
        "isCorrect": false
      },
      {
        "id": "forces_boolean_result",
        "text": "It changes the result from a list of combinations into a boolean.",
        "isCorrect": false
      },
      {
        "id": "removes_path",
        "text": "It clears the path before the next recursive call.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-state-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_state",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "backtracking_recursion_state"
    ],
    "type": "single_choice",
    "prompt": "A function generates all permutations of distinct values. At each position, it may choose any value not already used in the current arrangement. What state is needed?",
    "feedbackModel": {
      "decisionSignal": "Permutation generation needs to choose any unused element at each depth, so the state must remember used positions.",
      "distractorExplanations": {
        "start_index": "startIndex prevents going back to earlier indices, which would miss valid permutations.",
        "left_pointer": "A single forward pointer cannot represent arbitrary unused choices.",
        "prefix_sum": "Prefix sums summarize ranges and do not track used candidates."
      },
      "mentalModelCorrection": "Permutations need per-arrangement usage state, not a forward-only combination boundary.",
      "mistakeTypes": [
        "state_model_misread",
        "permutation_combination_confused"
      ],
      "nextAction": "Ask whether the next position may use an earlier input index that is not yet used.",
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
        "nodeId": "backtracking_visited_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "permutation_combination_confused",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Permutation generation needs to choose any unused element at each depth, so the state must remember used positions.",
    "options": [
      {
        "id": "visited",
        "text": "A visited structure marking which input positions are already used in the current path.",
        "isCorrect": true
      },
      {
        "id": "start_index",
        "text": "A startIndex that only allows later candidates at deeper levels.",
        "isCorrect": false
      },
      {
        "id": "left_pointer",
        "text": "A single pointer that moves left to right once.",
        "isCorrect": false
      },
      {
        "id": "prefix_sum",
        "text": "A prefix-sum array over the input values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_state",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "backtracking_start_index_state"
    ],
    "type": "single_choice",
    "prompt": "Why is startIndex alone the wrong state for generating all permutations?",
    "feedbackModel": {
      "decisionSignal": "Permutation order matters, so later positions must be able to choose any still-unused index, including earlier ones.",
      "distractorExplanations": {
        "allows_duplicate_values": "Duplicates depend on input values and duplicate-control logic, not startIndex alone.",
        "cannot_store_result": "Saving results is a base-case/result-contract issue, not the reason startIndex is wrong.",
        "forces_grid_coordinates": "Grid coordinates are unrelated to permutation state."
      },
      "mentalModelCorrection": "startIndex models combinations; visited models arbitrary unused choices.",
      "mistakeTypes": [
        "state_model_misread",
        "permutation_combination_confused"
      ],
      "nextAction": "Classify whether order matters before choosing startIndex or visited.",
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
        "nodeId": "backtracking_visited_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "permutation_combination_confused",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Permutation order matters, so later positions must be able to choose any still-unused index, including earlier ones.",
    "options": [
      {
        "id": "blocks_earlier_unused",
        "text": "It blocks earlier indices at deeper levels even if those values have not been used yet.",
        "isCorrect": true
      },
      {
        "id": "allows_duplicate_values",
        "text": "It always creates duplicate values even when all input values are distinct.",
        "isCorrect": false
      },
      {
        "id": "cannot_store_result",
        "text": "It prevents the algorithm from saving a completed path.",
        "isCorrect": false
      },
      {
        "id": "forces_grid_coordinates",
        "text": "It requires row and col to be passed as state.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_state",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "backtracking_path_state"
    ],
    "type": "single_choice",
    "prompt": "In permutation generation, path contains the current arrangement prefix. What additional state tells the recursion which candidates can still be used?",
    "feedbackModel": {
      "decisionSignal": "The recursion must know which input positions are already part of the current arrangement.",
      "distractorExplanations": {
        "remaining_sum": "A remaining target is needed for target-sum constraints, not ordinary permutation generation.",
        "window_start": "Permutation candidates are not governed by a contiguous sliding window.",
        "last_sorted_value": "For permutations, sorted order is not the construction rule; arbitrary unused choices are allowed."
      },
      "mentalModelCorrection": "Path is the partial output; visited is the legality state for future choices.",
      "mistakeTypes": [
        "state_model_misread",
        "missing_usage_state"
      ],
      "nextAction": "Separate what has been built from what is still legal to choose.",
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
        "nodeId": "backtracking_visited_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "missing_usage_state",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "The recursion must know which input positions are already part of the current arrangement.",
    "options": [
      {
        "id": "visited",
        "text": "visited, because path alone may not safely identify all used input positions.",
        "isCorrect": true
      },
      {
        "id": "remaining_sum",
        "text": "remaining, because every permutation must reduce a target.",
        "isCorrect": false
      },
      {
        "id": "window_start",
        "text": "windowStart, because the valid candidates form a contiguous window.",
        "isCorrect": false
      },
      {
        "id": "last_sorted_value",
        "text": "lastSortedValue, because candidates must be picked in sorted order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_state",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "mutable_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A permutation search marks visited[i] = true when nums[i] is added to the current path. What does visited represent?",
    "feedbackModel": {
      "decisionSignal": "In backtracking, visited usually describes usage within the current branch, not permanent global exclusion.",
      "distractorExplanations": {
        "global_never_use_again": "Other branches still need to use the same values in different positions.",
        "sorted_prefix": "Visited does not encode sorted order.",
        "failed_candidates": "A value used in one arrangement is not globally invalid."
      },
      "mentalModelCorrection": "Backtracking state is often branch-local and must be restored when the branch ends.",
      "mistakeTypes": [
        "visited_state_misread",
        "global_state_confused"
      ],
      "nextAction": "Ask whether a state marker should survive across sibling branches or only within one branch.",
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
        "nodeId": "backtracking_visited_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "visited_state_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "global_state_confused",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "In backtracking, visited usually describes usage within the current branch, not permanent global exclusion.",
    "options": [
      {
        "id": "current_arrangement_usage",
        "text": "Values used in the current candidate arrangement.",
        "isCorrect": true
      },
      {
        "id": "global_never_use_again",
        "text": "Values that can never be used again in any later branch.",
        "isCorrect": false
      },
      {
        "id": "sorted_prefix",
        "text": "Values that are smaller than the previous chosen value.",
        "isCorrect": false
      },
      {
        "id": "failed_candidates",
        "text": "Values that have already proven impossible in every configuration.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-state-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_remaining_target_state",
    "secondarySkillAtomIds": [
      "target_sum_search",
      "backtracking_recursion_state"
    ],
    "type": "single_choice",
    "prompt": "A backtracking search builds combinations that must sum to target. Which state most directly tells each recursive call how much more value is needed?",
    "feedbackModel": {
      "decisionSignal": "remaining carries the target-sum progress needed to evaluate and continue the current branch.",
      "distractorExplanations": {
        "path_sorted": "Sorting the chosen values does not directly tell how far the branch is from the target.",
        "visited_global": "A global visited set would incorrectly block candidates across branches.",
        "right_pointer": "A single pointer does not encode how much target value remains."
      },
      "mentalModelCorrection": "State should carry the facts that future recursive calls need for decisions.",
      "mistakeTypes": [
        "state_model_misread",
        "constraint_state_missing"
      ],
      "nextAction": "When a constraint has a running quantity, decide whether carrying the remaining quantity simplifies state.",
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
        "nodeId": "backtracking_remaining_target_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "remaining carries the target-sum progress needed to evaluate and continue the current branch.",
    "options": [
      {
        "id": "remaining",
        "text": "remaining target after subtracting the values already chosen.",
        "isCorrect": true
      },
      {
        "id": "path_sorted",
        "text": "The current path sorted in ascending order.",
        "isCorrect": false
      },
      {
        "id": "visited_global",
        "text": "A global visited set shared by all branches.",
        "isCorrect": false
      },
      {
        "id": "right_pointer",
        "text": "A right pointer starting from the end of the array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_remaining_target_state",
    "secondarySkillAtomIds": [
      "target_sum_search",
      "minimal_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A target-sum backtracking function recomputes sum(path) at every recursive call. Which state would make the recursion state clearer and cheaper?",
    "feedbackModel": {
      "decisionSignal": "The running sum or remaining target is part of the branch state and avoids deriving it repeatedly from path.",
      "distractorExplanations": {
        "path_string": "Serializing path adds overhead and does not directly model target progress.",
        "sorted_input_copy": "Sorting the input at every call is unrelated to the branch's accumulated sum.",
        "result_length": "The number of completed results does not help decide whether the current branch can reach target."
      },
      "mentalModelCorrection": "Do not force every decision-relevant fact to be reconstructed from path when it can be carried as canonical state.",
      "mistakeTypes": [
        "redundant_state_derivation",
        "state_model_misread"
      ],
      "nextAction": "Look for values repeatedly recomputed from the branch and decide whether they belong in state.",
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
        "nodeId": "backtracking_remaining_target_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "redundant_state_derivation",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "The running sum or remaining target is part of the branch state and avoids deriving it repeatedly from path.",
    "options": [
      {
        "id": "remaining",
        "text": "Pass remaining target or currentSum as part of the recursive state.",
        "isCorrect": true
      },
      {
        "id": "path_string",
        "text": "Convert path into a comma-separated string at every level.",
        "isCorrect": false
      },
      {
        "id": "sorted_input_copy",
        "text": "Copy and sort the entire input at every recursive call.",
        "isCorrect": false
      },
      {
        "id": "result_length",
        "text": "Pass only the number of results collected so far.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_remaining_target_state",
    "secondarySkillAtomIds": [
      "candidate_reuse_contract",
      "backtracking_start_index_state"
    ],
    "type": "single_choice",
    "prompt": "A combination-sum search allows the same positive candidate to be reused multiple times. After choosing candidate i, what recursive state best reflects that reuse is allowed?",
    "feedbackModel": {
      "decisionSignal": "Reuse means the chosen candidate can remain available at the next level, while remaining must reflect the value just taken.",
      "distractorExplanations": {
        "i_plus_one_only": "Moving to i + 1 forbids reusing candidate i, which contradicts the prompt.",
        "reset_remaining": "Resetting remaining loses the progress made by choosing the candidate.",
        "mark_global_visited": "Global visited would prevent reuse and also affect unrelated branches."
      },
      "mentalModelCorrection": "The next start state and the remaining target together encode candidate reuse rules.",
      "mistakeTypes": [
        "reuse_contract_misread",
        "state_progress_error"
      ],
      "nextAction": "After a choice, update every state field that the choice logically changes.",
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
        "nodeId": "backtracking_remaining_target_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "reuse_contract_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_progress_error",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Reuse means the chosen candidate can remain available at the next level, while remaining must reflect the value just taken.",
    "options": [
      {
        "id": "same_start_and_reduced_remaining",
        "text": "Call with the same start position i and reduced remaining.",
        "isCorrect": true
      },
      {
        "id": "i_plus_one_only",
        "text": "Call with i + 1 and unchanged remaining.",
        "isCorrect": false
      },
      {
        "id": "reset_remaining",
        "text": "Reset remaining to target and keep the same path.",
        "isCorrect": false
      },
      {
        "id": "mark_global_visited",
        "text": "Mark candidate i globally visited so it is never used again.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-state-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_path_state",
    "secondarySkillAtomIds": [
      "backtracking_result_collection",
      "combination_generation"
    ],
    "type": "single_choice",
    "prompt": "A problem asks to return the actual combinations, not just whether they exist. What state is needed to represent the partial combination being built?",
    "feedbackModel": {
      "decisionSignal": "If the output must include actual combinations, the recursion needs a partial output state.",
      "distractorExplanations": {
        "boolean_found": "A boolean can answer existence but cannot reconstruct the chosen values.",
        "result_count": "A count loses the contents of each combination.",
        "middle_index": "The middle index does not represent the branch's selected values."
      },
      "mentalModelCorrection": "When the result contains configurations, the branch usually needs a path-like state.",
      "mistakeTypes": [
        "output_contract_misread",
        "state_model_misread"
      ],
      "nextAction": "Match state to the requested output representation.",
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
        "nodeId": "backtracking_path_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "If the output must include actual combinations, the recursion needs a partial output state.",
    "options": [
      {
        "id": "path",
        "text": "path, the current list of chosen values.",
        "isCorrect": true
      },
      {
        "id": "boolean_found",
        "text": "Only a boolean found flag.",
        "isCorrect": false
      },
      {
        "id": "result_count",
        "text": "Only the number of combinations found so far.",
        "isCorrect": false
      },
      {
        "id": "middle_index",
        "text": "Only the middle index of the input array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_path_state",
    "secondarySkillAtomIds": [
      "backtracking_boolean_result",
      "minimal_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A search only returns true or false for whether any valid configuration exists. Which statement about path state is most accurate?",
    "feedbackModel": {
      "decisionSignal": "Boolean existence may only require enough state to continue and validate the branch, not to reconstruct the output.",
      "distractorExplanations": {
        "always_required": "Path is required when the output needs a configuration or when constraints depend on it, but not always.",
        "must_store_all_paths": "Collecting all paths solves a broader problem than boolean existence.",
        "path_replaces_index": "Path and progress state answer different questions."
      },
      "mentalModelCorrection": "State should be sufficient for the requested result, not automatically maximal.",
      "mistakeTypes": [
        "unnecessary_state",
        "output_contract_misread"
      ],
      "nextAction": "Decide whether the final answer requires reconstructing choices or only proving existence.",
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
        "nodeId": "backtracking_path_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_state",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Boolean existence may only require enough state to continue and validate the branch, not to reconstruct the output.",
    "options": [
      {
        "id": "may_not_need_full_path",
        "text": "A full path may be unnecessary if other state is enough to decide existence.",
        "isCorrect": true
      },
      {
        "id": "always_required",
        "text": "A full path is always required for every backtracking problem.",
        "isCorrect": false
      },
      {
        "id": "must_store_all_paths",
        "text": "The function must store every valid path before returning true.",
        "isCorrect": false
      },
      {
        "id": "path_replaces_index",
        "text": "path always replaces the need for index or position state.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_path_state",
    "secondarySkillAtomIds": [
      "count_result_contract",
      "minimal_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A backtracking problem asks only for the count of valid configurations. Which state decision is usually better than storing every full path?",
    "feedbackModel": {
      "decisionSignal": "Counting requires recognizing valid completions, not necessarily retaining every configuration.",
      "distractorExplanations": {
        "store_all_paths": "That can work but uses unnecessary memory when the output only asks for a count.",
        "drop_all_state": "The recursion still needs enough state to know what branches are valid.",
        "use_global_visited_forever": "Global branch pruning by visited can remove valid configurations from sibling branches."
      },
      "mentalModelCorrection": "Minimal state depends on the output contract: count does not require preserving every path.",
      "mistakeTypes": [
        "unnecessary_state",
        "output_contract_misread"
      ],
      "nextAction": "For count outputs, identify the smallest state needed to validate and count completions.",
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
        "nodeId": "backtracking_path_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_state",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Counting requires recognizing valid completions, not necessarily retaining every configuration.",
    "options": [
      {
        "id": "carry_count_relevant_state",
        "text": "Carry the state needed to validate branches and increment a count at completion.",
        "isCorrect": true
      },
      {
        "id": "store_all_paths",
        "text": "Store every valid path and count the result array at the end.",
        "isCorrect": false
      },
      {
        "id": "drop_all_state",
        "text": "Drop index, constraints, and path because only a number is returned.",
        "isCorrect": false
      },
      {
        "id": "use_global_visited_forever",
        "text": "Use one global visited set for all branches to reduce the number of paths.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_count_state",
    "secondarySkillAtomIds": [
      "parentheses_generation",
      "constraint_state"
    ],
    "type": "single_choice",
    "prompt": "A function generates valid parentheses strings with n pairs. Besides path, what state is needed to know whether '(' or ')' can still be added?",
    "feedbackModel": {
      "decisionSignal": "The legality of the next parenthesis depends on how many opens and closes have already been used.",
      "distractorExplanations": {
        "start_index": "There is no input array of candidates being consumed by forward index.",
        "visited_cells": "Grid visited state is unrelated to parentheses generation.",
        "prefix_sums": "Prefix sums do not encode the open/close constraints."
      },
      "mentalModelCorrection": "When constraints depend on counts, those counts often belong in the recursion state.",
      "mistakeTypes": [
        "constraint_state_missing",
        "state_model_misread"
      ],
      "nextAction": "Identify which quantities determine whether each possible next choice is legal.",
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
        "nodeId": "backtracking_count_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "The legality of the next parenthesis depends on how many opens and closes have already been used.",
    "options": [
      {
        "id": "open_close_counts",
        "text": "openCount and closeCount.",
        "isCorrect": true
      },
      {
        "id": "start_index",
        "text": "startIndex over the original string.",
        "isCorrect": false
      },
      {
        "id": "visited_cells",
        "text": "visited cells in a grid.",
        "isCorrect": false
      },
      {
        "id": "prefix_sums",
        "text": "prefix sums of the current path.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-019-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_count_state",
    "secondarySkillAtomIds": [
      "constraint_state",
      "minimal_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A constrained generator can derive openCount and closeCount by scanning path at every call. Why might passing the counts as state be preferable?",
    "feedbackModel": {
      "decisionSignal": "Counts are part of the branch's constraint state and avoid repeated derivation from path.",
      "distractorExplanations": {
        "avoid_base_case": "The generator still needs a completion condition.",
        "force_sorting": "Sorting is unrelated to parentheses constraints.",
        "replace_all_choices": "Counts guide legal choices; they do not eliminate choice enumeration."
      },
      "mentalModelCorrection": "Good recursion state carries compact facts that are repeatedly needed for decisions.",
      "mistakeTypes": [
        "redundant_state_derivation",
        "constraint_state_missing"
      ],
      "nextAction": "Look for constraints that are repeatedly computed from path and consider carrying them as state.",
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
        "nodeId": "backtracking_count_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "redundant_state_derivation",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Counts are part of the branch's constraint state and avoid repeated derivation from path.",
    "options": [
      {
        "id": "direct_constraint_state",
        "text": "The counts are decision-relevant facts and can be updated directly with each choice.",
        "isCorrect": true
      },
      {
        "id": "avoid_base_case",
        "text": "Passing counts removes the need for any base case.",
        "isCorrect": false
      },
      {
        "id": "force_sorting",
        "text": "Passing counts lets the path be sorted after each call.",
        "isCorrect": false
      },
      {
        "id": "replace_all_choices",
        "text": "Passing counts means the recursion no longer needs to choose the next character.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-state-020-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_partition_index_state",
    "secondarySkillAtomIds": [
      "string_segmentation",
      "backtracking_path_state"
    ],
    "type": "single_choice",
    "prompt": "A function partitions a string into valid segments. What state tells the next recursive call where the next segment must begin?",
    "feedbackModel": {
      "decisionSignal": "In segmentation, the state must record how much of the string has already been consumed.",
      "distractorExplanations": {
        "visited": "Segments consume a contiguous prefix in order; characters are not arbitrary reusable choices.",
        "right_pointer_only": "A single end pointer does not identify the next unconsumed start position.",
        "sorted_segments": "Sorting segments destroys their original order and does not show where to continue."
      },
      "mentalModelCorrection": "Partitioning state is usually anchored at the next unconsumed index.",
      "mistakeTypes": [
        "state_model_misread",
        "full_input_consumption_missed"
      ],
      "nextAction": "For string partitioning, track the boundary between consumed and unconsumed input.",
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
        "nodeId": "backtracking_partition_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "full_input_consumption_missed",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "In segmentation, the state must record how much of the string has already been consumed.",
    "options": [
      {
        "id": "index",
        "text": "index, the first unconsumed character of the string.",
        "isCorrect": true
      },
      {
        "id": "visited",
        "text": "visited, because each character can be used by any segment later.",
        "isCorrect": false
      },
      {
        "id": "right_pointer_only",
        "text": "Only a right pointer from the end of the string.",
        "isCorrect": false
      },
      {
        "id": "sorted_segments",
        "text": "The selected segments sorted alphabetically.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-021-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_partition_index_state",
    "secondarySkillAtomIds": [
      "string_segmentation",
      "exact_segment_count_contract"
    ],
    "type": "single_choice",
    "prompt": "A restore-IP style search must build exactly 4 segments from a string. Besides index, what state or derived state is needed to know how many segments have already been chosen?",
    "feedbackModel": {
      "decisionSignal": "The exact-segment constraint depends on how many segments have been selected so far.",
      "distractorExplanations": {
        "visited_chars": "Segmentation consumes characters in order and does not need arbitrary visited markers.",
        "max_char": "The largest character does not encode segment count.",
        "left_right_sum": "Character-code sums do not represent progress through segment count."
      },
      "mentalModelCorrection": "When the output has a fixed number of parts, the recursion needs state that represents part count.",
      "mistakeTypes": [
        "constraint_state_missing",
        "output_contract_misread"
      ],
      "nextAction": "List the constraints that define a complete output and ensure state can track progress toward each one.",
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
        "nodeId": "backtracking_partition_index_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "The exact-segment constraint depends on how many segments have been selected so far.",
    "options": [
      {
        "id": "segments_length",
        "text": "segments.length or an equivalent segmentCount.",
        "isCorrect": true
      },
      {
        "id": "visited_chars",
        "text": "A visited array for every character in the string.",
        "isCorrect": false
      },
      {
        "id": "max_char",
        "text": "The largest character seen so far.",
        "isCorrect": false
      },
      {
        "id": "left_right_sum",
        "text": "The sum of the leftmost and rightmost character codes.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-state-022-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_position_state",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "word_search_state"
    ],
    "type": "single_choice",
    "prompt": "A word-search function tries to match a word by moving through neighboring grid cells. What state identifies both the current grid position and the progress through the word?",
    "feedbackModel": {
      "decisionSignal": "Grid word search needs spatial state plus target-progress state.",
      "distractorExplanations": {
        "start_index_only": "wordIndex alone does not tell which grid cell the search is currently on.",
        "path_sum": "A numeric sum does not encode position or matched character progress.",
        "left_right_grid": "Two-pointer state is not enough for four-direction grid movement."
      },
      "mentalModelCorrection": "Grid backtracking state usually combines position, progress through the target, and branch-local usage.",
      "mistakeTypes": [
        "state_model_misread",
        "position_state_missing"
      ],
      "nextAction": "For grid search, identify both where you are and what target progress has been made.",
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
        "nodeId": "backtracking_grid_position_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "position_state_missing",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Grid word search needs spatial state plus target-progress state.",
    "options": [
      {
        "id": "row_col_word_index",
        "text": "row, col, and wordIndex.",
        "isCorrect": true
      },
      {
        "id": "start_index_only",
        "text": "startIndex in the word only.",
        "isCorrect": false
      },
      {
        "id": "path_sum",
        "text": "The numeric sum of visited cell values.",
        "isCorrect": false
      },
      {
        "id": "left_right_grid",
        "text": "A left pointer and a right pointer over the grid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-023-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_state",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "path_local_state"
    ],
    "type": "single_choice",
    "prompt": "A grid path search cannot use the same cell twice in one candidate path. What should visited mean in this backtracking state?",
    "feedbackModel": {
      "decisionSignal": "The no-reuse rule applies within one candidate path; sibling paths may still need the same cells.",
      "distractorExplanations": {
        "visited_forever": "Global permanent visited would incorrectly block valid paths that start elsewhere or take a different route.",
        "visited_row_only": "The constraint is cell-level, not row-level.",
        "visited_target_chars": "Matching characters somewhere in the grid does not track which cells the current path has used."
      },
      "mentalModelCorrection": "Backtracking visited state is often path-local and must reflect the current candidate configuration.",
      "mistakeTypes": [
        "visited_state_misread",
        "global_state_confused"
      ],
      "nextAction": "Ask whether a visited marker belongs to one branch or the whole search.",
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
        "nodeId": "backtracking_visited_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "visited_state_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "global_state_confused",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "The no-reuse rule applies within one candidate path; sibling paths may still need the same cells.",
    "options": [
      {
        "id": "visited_in_current_path",
        "text": "Cells already used in the current path.",
        "isCorrect": true
      },
      {
        "id": "visited_forever",
        "text": "Cells that can never be used again by any later path.",
        "isCorrect": false
      },
      {
        "id": "visited_row_only",
        "text": "Rows that have at least one matching cell.",
        "isCorrect": false
      },
      {
        "id": "visited_target_chars",
        "text": "Characters from the word that appeared anywhere in the grid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-state-024-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_minimal_state",
    "secondarySkillAtomIds": [
      "minimal_state_reasoning",
      "backtracking_recursion_state"
    ],
    "type": "single_choice",
    "prompt": "A recursive word search already passes wordIndex and uses the original word. It also passes currentString, which is always word.slice(0, wordIndex). What is the best assessment of this state?",
    "feedbackModel": {
      "decisionSignal": "Good recursion state should be sufficient but not redundant; wordIndex already captures prefix progress against the fixed word.",
      "distractorExplanations": {
        "required_state": "wordIndex directly identifies how many characters have been matched.",
        "replacement_for_position": "Matched prefix progress does not identify the current grid cell.",
        "duplicate_control": "Duplicate path control is a different concern and is not solved by storing the prefix string."
      },
      "mentalModelCorrection": "Avoid passing derived state when a smaller canonical state already determines the same information.",
      "mistakeTypes": [
        "unnecessary_state",
        "redundant_state_derivation"
      ],
      "nextAction": "For each state field, ask whether it contains new information or can be derived from other fields.",
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
        "nodeId": "backtracking_minimal_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_state",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "redundant_state_derivation",
        "role": "mistake_type"
      }
    ],
    "title": "State",
    "trackId": "algorithms",
    "answerFeedback": "Good recursion state should be sufficient but not redundant; wordIndex already captures prefix progress against the fixed word.",
    "options": [
      {
        "id": "redundant_state",
        "text": "currentString is redundant because wordIndex already defines the matched prefix.",
        "isCorrect": true
      },
      {
        "id": "required_state",
        "text": "currentString is required because wordIndex cannot represent progress.",
        "isCorrect": false
      },
      {
        "id": "replacement_for_position",
        "text": "currentString replaces the need for row and col.",
        "isCorrect": false
      },
      {
        "id": "duplicate_control",
        "text": "currentString is mainly needed to skip duplicate grid paths.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
