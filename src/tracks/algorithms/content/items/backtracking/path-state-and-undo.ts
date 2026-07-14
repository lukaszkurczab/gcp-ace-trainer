import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const pathStateAndUndoQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-undo-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_push_pop_discipline",
    "secondarySkillAtomIds": [
      "backtracking_path_state_and_undo",
      "backtracking_sibling_state_isolation"
    ],
    "type": "single_choice",
    "prompt": "A backtracking branch chooses a candidate by doing path.push(candidate) before recursion. What should usually happen after that recursive call returns?",
    "feedbackModel": {
      "decisionSignal": "The branch temporarily adds one choice to the shared path, so it must remove that same choice before the next sibling branch.",
      "distractorExplanations": {
        "clear_result": "Result collection is separate from restoring the current branch state.",
        "sort_path": "Sorting does not restore the path to the parent frame's state.",
        "keep_choice": "Leaving the choice in path leaks one branch's decision into sibling branches."
      },
      "mentalModelCorrection": "Backtracking uses symmetric state changes: apply the choice, recurse, then undo that choice.",
      "mistakeTypes": [
        "undo_missing",
        "sibling_state_leak"
      ],
      "nextAction": "Pair every path.push made by a frame with a corresponding path.pop before trying the next sibling.",
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
        "nodeId": "backtracking_push_pop_discipline",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "sibling_state_leak",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "The branch temporarily adds one choice to the shared path, so it must remove that same choice before the next sibling branch.",
    "options": [
      {
        "id": "pop_choice",
        "text": "Call path.pop() to remove the candidate added by this branch.",
        "isCorrect": true
      },
      {
        "id": "clear_result",
        "text": "Clear the entire result array.",
        "isCorrect": false
      },
      {
        "id": "sort_path",
        "text": "Sort path so the next sibling branch starts ordered.",
        "isCorrect": false
      },
      {
        "id": "keep_choice",
        "text": "Leave the candidate in path for every later sibling branch.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_push_pop_discipline",
    "secondarySkillAtomIds": [
      "backtracking_path_state_and_undo",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A recursion frame appends exactly one value to path before calling dfs. What should its undo step remove?",
    "feedbackModel": {
      "decisionSignal": "Each frame is responsible for undoing the state change it made, not for clearing parent state.",
      "distractorExplanations": {
        "whole_path": "Clearing the whole path removes choices owned by ancestor frames.",
        "first_choice": "The current frame should undo its own latest append, not an ancestor's choice.",
        "random_choice": "Backtracking path state is ordered branch state; removing an arbitrary value corrupts it."
      },
      "mentalModelCorrection": "Undo must be local and symmetric: restore the parent state exactly.",
      "mistakeTypes": [
        "over_undo",
        "state_restoration_error"
      ],
      "nextAction": "Identify which mutation belongs to the current frame and undo only that mutation.",
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
        "nodeId": "backtracking_push_pop_discipline",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "over_undo",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Each frame is responsible for undoing the state change it made, not for clearing parent state.",
    "options": [
      {
        "id": "same_choice",
        "text": "Exactly the one value this frame appended.",
        "isCorrect": true
      },
      {
        "id": "whole_path",
        "text": "The entire path, including parent choices.",
        "isCorrect": false
      },
      {
        "id": "first_choice",
        "text": "The first value ever added to path.",
        "isCorrect": false
      },
      {
        "id": "random_choice",
        "text": "Any value from path, because order does not matter.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-undo-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_push_pop_discipline",
    "secondarySkillAtomIds": [
      "backtracking_path_state_and_undo",
      "control_flow_reasoning"
    ],
    "type": "single_choice",
    "prompt": "Which order correctly explores a candidate branch using a shared mutable path?",
    "feedbackModel": {
      "decisionSignal": "The child call must see the chosen value, and the parent must restore path afterward.",
      "distractorExplanations": {
        "push_pop_recurse": "The choice is removed before the child call, so the recursive branch does not include it.",
        "pop_push_recurse": "Popping before choosing removes parent state and corrupts the path.",
        "recurse_push_pop": "The recursive call happens before the candidate is applied."
      },
      "mentalModelCorrection": "The canonical mutable-path sequence is apply, recurse, undo.",
      "mistakeTypes": [
        "undo_order_error",
        "state_restoration_error"
      ],
      "nextAction": "Read each branch as a transaction: apply its mutation, explore, then roll it back.",
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
        "nodeId": "backtracking_push_pop_discipline",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_order_error",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "The child call must see the chosen value, and the parent must restore path afterward.",
    "options": [
      {
        "id": "push_recurse_pop",
        "text": "path.push(choice); dfs(...); path.pop();",
        "isCorrect": true
      },
      {
        "id": "push_pop_recurse",
        "text": "path.push(choice); path.pop(); dfs(...);",
        "isCorrect": false
      },
      {
        "id": "pop_push_recurse",
        "text": "path.pop(); path.push(choice); dfs(...);",
        "isCorrect": false
      },
      {
        "id": "recurse_push_pop",
        "text": "dfs(...); path.push(choice); path.pop();",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_sibling_state_isolation",
    "secondarySkillAtomIds": [
      "backtracking_push_pop_discipline",
      "branch_local_state"
    ],
    "type": "single_choice",
    "prompt": "A parent frame loops over candidates A, B, and C. What should be true about path before each sibling candidate is tried?",
    "feedbackModel": {
      "decisionSignal": "Sibling branches must start from the same parent context so each candidate is tested independently.",
      "distractorExplanations": {
        "accumulate_siblings": "That leaks choices from earlier sibling branches into later ones.",
        "empty_always": "Ancestor choices still belong in the path and should not be removed by this frame.",
        "sorted_by_sibling": "Sorting does not restore the parent frame's exact path."
      },
      "mentalModelCorrection": "Backtracking isolates sibling branches by restoring branch-local mutations after each recursive call.",
      "mistakeTypes": [
        "sibling_state_leak",
        "over_undo"
      ],
      "nextAction": "Before each loop iteration, verify that only ancestor choices remain in path.",
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
        "nodeId": "backtracking_sibling_state_isolation",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "sibling_state_leak",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "over_undo",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Sibling branches must start from the same parent context so each candidate is tested independently.",
    "options": [
      {
        "id": "same_parent_state",
        "text": "path should be restored to the same parent state before trying each sibling.",
        "isCorrect": true
      },
      {
        "id": "accumulate_siblings",
        "text": "path should keep all previous sibling choices.",
        "isCorrect": false
      },
      {
        "id": "empty_always",
        "text": "path should always be empty, even if parent frames chose values.",
        "isCorrect": false
      },
      {
        "id": "sorted_by_sibling",
        "text": "path should be sorted by the current sibling candidate.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_sibling_state_isolation",
    "secondarySkillAtomIds": [
      "backtracking_push_pop_discipline",
      "debugging_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A combinations function does path.push(1), recurses, but forgets path.pop(). The next sibling tries candidate 2. What is the likely bug?",
    "feedbackModel": {
      "decisionSignal": "Without undo, the previous sibling's candidate remains in the shared path.",
      "distractorExplanations": {
        "missing_base_case_only": "The immediate issue is state leakage between siblings, not necessarily the base case.",
        "duplicates_removed": "Missing undo creates incorrect branches; it does not solve duplicate control.",
        "path_immutable": "A shared array path is mutable unless copied or treated immutably."
      },
      "mentalModelCorrection": "For shared mutable path, missing pop contaminates later branches.",
      "mistakeTypes": [
        "undo_missing",
        "sibling_state_leak"
      ],
      "nextAction": "Trace path contents before and after each sibling loop iteration.",
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
        "nodeId": "backtracking_sibling_state_isolation",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "sibling_state_leak",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Without undo, the previous sibling's candidate remains in the shared path.",
    "options": [
      {
        "id": "leaked_choice",
        "text": "The branch for 2 may incorrectly start with 1 already in path.",
        "isCorrect": true
      },
      {
        "id": "missing_base_case_only",
        "text": "The only possible bug is that the base case cannot run.",
        "isCorrect": false
      },
      {
        "id": "duplicates_removed",
        "text": "The missing pop automatically removes duplicate outputs.",
        "isCorrect": false
      },
      {
        "id": "path_immutable",
        "text": "Nothing changes because arrays used as path are always immutable.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_sibling_state_isolation",
    "secondarySkillAtomIds": [
      "backtracking_push_pop_discipline",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A recursive frame adds one candidate to path but then calls path.pop() twice after recursion. What is the main risk?",
    "feedbackModel": {
      "decisionSignal": "Undoing more than this frame changed corrupts the caller's state.",
      "distractorExplanations": {
        "does_not_undo": "Calling pop twice does undo the current candidate, but then goes too far.",
        "creates_sorted_path": "Popping values does not sort the path.",
        "forces_duplicate_skip": "Duplicate-control rules are unrelated to the number of pops."
      },
      "mentalModelCorrection": "Under-undo leaks this branch; over-undo destroys parent context.",
      "mistakeTypes": [
        "over_undo",
        "state_restoration_error"
      ],
      "nextAction": "Keep mutation and undo counts symmetric for each recursion frame.",
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
        "nodeId": "backtracking_sibling_state_isolation",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "over_undo",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Undoing more than this frame changed corrupts the caller's state.",
    "options": [
      {
        "id": "removes_parent_choice",
        "text": "It may remove a choice that belongs to an ancestor frame.",
        "isCorrect": true
      },
      {
        "id": "does_not_undo",
        "text": "It leaves the current candidate in path forever.",
        "isCorrect": false
      },
      {
        "id": "creates_sorted_path",
        "text": "It sorts the path accidentally.",
        "isCorrect": false
      },
      {
        "id": "forces_duplicate_skip",
        "text": "It activates duplicate-control logic.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_shared_mutable_state",
    "secondarySkillAtomIds": [
      "backtracking_path_state_and_undo",
      "branch_local_state"
    ],
    "type": "single_choice",
    "prompt": "A backtracking function uses one shared path array throughout the search. Why can this be correct?",
    "feedbackModel": {
      "decisionSignal": "A shared mutable path is safe when branch-local mutations are undone before control returns to the parent.",
      "distractorExplanations": {
        "arrays_are_copied": "push mutates the same array; it does not copy it.",
        "siblings_share_choices": "Sibling branches should share ancestor choices, not each other's branch choices.",
        "result_clears_path": "Saving a result does not automatically restore the working path."
      },
      "mentalModelCorrection": "Backtracking often relies on shared mutable state plus strict restoration discipline.",
      "mistakeTypes": [
        "mutable_state_misread",
        "sibling_state_leak"
      ],
      "nextAction": "Treat each branch mutation as branch-local unless it is deliberately copied into result.",
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
        "nodeId": "backtracking_shared_mutable_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "mutable_state_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "sibling_state_leak",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "A shared mutable path is safe when branch-local mutations are undone before control returns to the parent.",
    "options": [
      {
        "id": "disciplined_mutation",
        "text": "Because each branch applies a choice, recurses, and restores path before siblings run.",
        "isCorrect": true
      },
      {
        "id": "arrays_are_copied",
        "text": "Because JavaScript arrays are automatically copied on every push.",
        "isCorrect": false
      },
      {
        "id": "siblings_share_choices",
        "text": "Because sibling branches should inherit each other's choices.",
        "isCorrect": false
      },
      {
        "id": "result_clears_path",
        "text": "Because saving a result automatically clears path.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-undo-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_mark_unmark",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "backtracking_visited_state"
    ],
    "type": "single_choice",
    "prompt": "A permutation branch chooses nums[i] and sets visited[i] = true before recursion. What should happen after that branch returns?",
    "feedbackModel": {
      "decisionSignal": "visited[i] marks use in the current permutation branch, so it must be restored after that branch.",
      "distractorExplanations": {
        "leave_true": "That would incorrectly prevent sibling permutations from using nums[i].",
        "mark_all": "Only the chosen index belongs to this branch's mutation.",
        "clear_result": "Result cleanup is unrelated to visited restoration."
      },
      "mentalModelCorrection": "Visited for permutations is branch-local usage state, not permanent exclusion.",
      "mistakeTypes": [
        "undo_missing",
        "visited_state_misread"
      ],
      "nextAction": "Pair each visited[i] = true with visited[i] = false after recursion.",
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
        "nodeId": "backtracking_visited_mark_unmark",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "visited_state_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "visited[i] marks use in the current permutation branch, so it must be restored after that branch.",
    "options": [
      {
        "id": "unmark",
        "text": "Set visited[i] back to false so sibling branches may use that index.",
        "isCorrect": true
      },
      {
        "id": "leave_true",
        "text": "Leave visited[i] true forever for the rest of the search.",
        "isCorrect": false
      },
      {
        "id": "mark_all",
        "text": "Set every visited entry to true.",
        "isCorrect": false
      },
      {
        "id": "clear_result",
        "text": "Clear all saved permutations.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_mark_unmark",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "sibling_state_isolation"
    ],
    "type": "single_choice",
    "prompt": "A permutation search marks index 0 as visited in one branch and never unmarks it. What can happen?",
    "feedbackModel": {
      "decisionSignal": "A stale visited mark blocks a candidate that should be available again outside the branch that used it.",
      "distractorExplanations": {
        "only_more_duplicates": "The common failure is missing valid branches, not only producing duplicates.",
        "auto_complete": "Visited marks do not create completion.",
        "sorts_input": "Visited state does not sort the input."
      },
      "mentalModelCorrection": "Branch-local visited state must not leak into sibling branches.",
      "mistakeTypes": [
        "undo_missing",
        "valid_result_removed"
      ],
      "nextAction": "Trace whether each visited mark is cleared before returning to the parent loop.",
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
        "nodeId": "backtracking_visited_mark_unmark",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "valid_result_removed",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "A stale visited mark blocks a candidate that should be available again outside the branch that used it.",
    "options": [
      {
        "id": "miss_valid_permutations",
        "text": "Later sibling branches may miss valid permutations that need index 0.",
        "isCorrect": true
      },
      {
        "id": "only_more_duplicates",
        "text": "The only effect is generating more duplicate permutations.",
        "isCorrect": false
      },
      {
        "id": "auto_complete",
        "text": "The algorithm automatically completes every permutation earlier.",
        "isCorrect": false
      },
      {
        "id": "sorts_input",
        "text": "The input becomes sorted by visited status.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_mark_unmark",
    "secondarySkillAtomIds": [
      "permutation_generation",
      "branch_local_state"
    ],
    "type": "single_choice",
    "prompt": "In permutation backtracking, why is visited usually not a permanent global exclusion set?",
    "feedbackModel": {
      "decisionSignal": "visited enforces usage within the current arrangement; sibling arrangements reset that local usage.",
      "distractorExplanations": {
        "no_need_for_state": "Permutation search needs to avoid reusing the same index inside one arrangement.",
        "all_indices_same": "Distinct indices are separate input copies or positions.",
        "visited_is_result": "visited is working state, not the result collection."
      },
      "mentalModelCorrection": "Branch-local usage constraints must be restored between alternative arrangements.",
      "mistakeTypes": [
        "visited_state_misread",
        "global_state_confused"
      ],
      "nextAction": "Distinguish constraints inside one candidate solution from restrictions across the entire search.",
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
        "nodeId": "backtracking_visited_mark_unmark",
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
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "visited enforces usage within the current arrangement; sibling arrangements reset that local usage.",
    "options": [
      {
        "id": "different_positions",
        "text": "The same input index can be used in different permutations, just not twice in the same permutation.",
        "isCorrect": true
      },
      {
        "id": "no_need_for_state",
        "text": "Permutation search does not need any usage state.",
        "isCorrect": false
      },
      {
        "id": "all_indices_same",
        "text": "All input indices represent the same candidate.",
        "isCorrect": false
      },
      {
        "id": "visited_is_result",
        "text": "visited stores the final list of permutations.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_visited_mark_unmark",
    "secondarySkillAtomIds": [
      "state_restoration",
      "debugging_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A branch sets visited[i] = true, recurses, and then sets visited[j] = false where j may be different from i. What is wrong?",
    "feedbackModel": {
      "decisionSignal": "Undo must target the exact state field changed by the current branch.",
      "distractorExplanations": {
        "always_correct": "visited affects correctness by controlling candidate legality.",
        "result_missing_copy": "Path snapshotting is a separate issue from restoring the wrong visited index.",
        "base_case_removed": "Changing visited does not remove the base case."
      },
      "mentalModelCorrection": "State restoration is exact: undo the same location and value that this frame changed.",
      "mistakeTypes": [
        "state_restoration_error",
        "visited_state_misread"
      ],
      "nextAction": "Store or reuse the same candidate index for both mark and unmark.",
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
        "nodeId": "backtracking_visited_mark_unmark",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "visited_state_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Undo must target the exact state field changed by the current branch.",
    "options": [
      {
        "id": "wrong_marker_restored",
        "text": "The undo step may restore the wrong marker and leave this branch's marker leaked.",
        "isCorrect": true
      },
      {
        "id": "always_correct",
        "text": "Any visited entry can be cleared because visited only affects performance.",
        "isCorrect": false
      },
      {
        "id": "result_missing_copy",
        "text": "The result path was not copied.",
        "isCorrect": false
      },
      {
        "id": "base_case_removed",
        "text": "The base case is removed by changing visited.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_mutable_board_restore",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "shared_mutable_state"
    ],
    "type": "single_choice",
    "prompt": "A word-search branch marks a cell by replacing board[row][col] with '#'. What must it save before doing that?",
    "feedbackModel": {
      "decisionSignal": "To restore a mutated grid cell, the branch needs the original value it overwrote.",
      "distractorExplanations": {
        "result_length": "Result count does not restore the board cell.",
        "sorted_row": "Sorting is unrelated and would change board structure.",
        "all_neighbors": "Neighbor paths are search choices, not the value needed for restoration."
      },
      "mentalModelCorrection": "Before mutating shared input state, capture exactly what must be restored.",
      "mistakeTypes": [
        "mutable_state_leak",
        "state_restoration_error"
      ],
      "nextAction": "Store original cell value, mark the cell, recurse, then write the original value back.",
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
        "nodeId": "backtracking_mutable_board_restore",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "mutable_state_leak",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "To restore a mutated grid cell, the branch needs the original value it overwrote.",
    "options": [
      {
        "id": "original_char",
        "text": "The original character from board[row][col].",
        "isCorrect": true
      },
      {
        "id": "result_length",
        "text": "The current number of saved results.",
        "isCorrect": false
      },
      {
        "id": "sorted_row",
        "text": "A sorted copy of the whole row.",
        "isCorrect": false
      },
      {
        "id": "all_neighbors",
        "text": "Every possible neighbor path from the cell.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_mutable_board_restore",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A grid backtracking branch branch-locally mutates board[r][c]. Why must the board be restored before returning to the caller?",
    "feedbackModel": {
      "decisionSignal": "Branch-local board mutation is branch-local state and should not leak to sibling branches.",
      "distractorExplanations": {
        "mutation_saves_result": "Marking a cell is working-state mutation, not result collection.",
        "restore_sorts_board": "Restoration returns the original value; it does not sort the grid.",
        "avoid_all_bounds": "Bounds checks are still required for grid coordinates."
      },
      "mentalModelCorrection": "Shared mutable input must be returned to its prior state after each candidate path.",
      "mistakeTypes": [
        "mutable_state_leak",
        "undo_missing"
      ],
      "nextAction": "Verify that every branch-local board write has a matching restore before return.",
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
        "nodeId": "backtracking_mutable_board_restore",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "mutable_state_leak",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Branch-local board mutation is branch-local state and should not leak to sibling branches.",
    "options": [
      {
        "id": "siblings_need_original",
        "text": "Sibling branches and caller frames need to see the same board state the branch received.",
        "isCorrect": true
      },
      {
        "id": "mutation_saves_result",
        "text": "The mutation itself saves the completed result.",
        "isCorrect": false
      },
      {
        "id": "restore_sorts_board",
        "text": "Restoring the cell sorts the board.",
        "isCorrect": false
      },
      {
        "id": "avoid_all_bounds",
        "text": "Restoring the board removes the need for bounds checks.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_mutable_board_restore",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "failure_path_cleanup"
    ],
    "type": "single_choice",
    "prompt": "A grid branch marks a cell as used, explores neighbors, and finds no valid path. Should the cell still be restored?",
    "feedbackModel": {
      "decisionSignal": "Failure of one path does not justify corrupting the board for other paths.",
      "distractorExplanations": {
        "leave_failed_mark": "A cell that fails in one path may still be valid in another path context.",
        "restore_only_success": "Restoration is about shared-state cleanup, not result success.",
        "delete_cell": "Deleting the cell changes the input structure."
      },
      "mentalModelCorrection": "Backtracking cleanup must run after both successful and failed branch exploration.",
      "mistakeTypes": [
        "failure_cleanup_missing",
        "mutable_state_leak"
      ],
      "nextAction": "Place restoration after exploration regardless of the branch outcome.",
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
        "nodeId": "backtracking_mutable_board_restore",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "failure_cleanup_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "mutable_state_leak",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Failure of one path does not justify corrupting the board for other paths.",
    "options": [
      {
        "id": "restore_even_on_failure",
        "text": "Yes. Failed branches must also restore the shared state they changed.",
        "isCorrect": true
      },
      {
        "id": "leave_failed_mark",
        "text": "No. Failed cells should remain marked forever.",
        "isCorrect": false
      },
      {
        "id": "restore_only_success",
        "text": "Only if the branch succeeds.",
        "isCorrect": false
      },
      {
        "id": "delete_cell",
        "text": "No. The failed cell should be removed from the grid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_running_state_restore",
    "secondarySkillAtomIds": [
      "target_sum_search",
      "shared_mutable_state"
    ],
    "type": "single_choice",
    "prompt": "A target-sum backtracking function mutates currentSum with `currentSum += nums[i]` before recursion. What should happen after that branch returns?",
    "feedbackModel": {
      "decisionSignal": "If currentSum is shared mutable branch state, the branch must undo the exact numeric change it made.",
      "distractorExplanations": {
        "reset_zero": "Resetting to zero may remove ancestor contributions that should remain.",
        "sort_sum": "A numeric sum cannot be sorted into path state.",
        "leave_sum": "Leaving the increase contaminates sibling branches with this candidate's value."
      },
      "mentalModelCorrection": "Running mutable state follows the same apply/recurse/undo discipline as path and visited.",
      "mistakeTypes": [
        "running_state_leak",
        "state_restoration_error"
      ],
      "nextAction": "For every `+= value` branch mutation, look for the matching `-= value` restoration.",
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
        "nodeId": "backtracking_running_state_restore",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "running_state_leak",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "If currentSum is shared mutable branch state, the branch must undo the exact numeric change it made.",
    "options": [
      {
        "id": "subtract_same_value",
        "text": "Subtract nums[i] to restore currentSum to the parent state.",
        "isCorrect": true
      },
      {
        "id": "reset_zero",
        "text": "Reset currentSum to zero after every recursive call.",
        "isCorrect": false
      },
      {
        "id": "sort_sum",
        "text": "Sort currentSum with the path.",
        "isCorrect": false
      },
      {
        "id": "leave_sum",
        "text": "Leave currentSum increased for sibling branches.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_running_state_restore",
    "secondarySkillAtomIds": [
      "target_sum_search",
      "immutable_state_update"
    ],
    "type": "single_choice",
    "prompt": "A recursive call passes `remaining - nums[i]` as an argument instead of mutating a shared remaining variable. What undo is needed for remaining after the call?",
    "feedbackModel": {
      "decisionSignal": "Passing a computed value to the child does not mutate the parent's variable, so there is no shared remaining state to restore.",
      "distractorExplanations": {
        "add_back_parent": "Adding back is needed when the parent variable was mutated, not when a new argument value was passed.",
        "reset_target": "Resetting to target would ignore ancestor choices.",
        "clear_path": "Path restoration is separate from whether remaining was passed immutably."
      },
      "mentalModelCorrection": "Undo is required for shared mutable state, not for local computed values passed to child calls.",
      "mistakeTypes": [
        "mutable_vs_immutable_state_confused",
        "unnecessary_undo"
      ],
      "nextAction": "Classify each state update as mutation of shared state or construction of a child argument.",
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
        "nodeId": "backtracking_running_state_restore",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "mutable_vs_immutable_state_confused",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_undo",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Passing a computed value to the child does not mutate the parent's variable, so there is no shared remaining state to restore.",
    "options": [
      {
        "id": "none_for_value_arg",
        "text": "No explicit undo for remaining is needed because the parent remaining value was not mutated.",
        "isCorrect": true
      },
      {
        "id": "add_back_parent",
        "text": "Always add nums[i] back to a shared remaining variable.",
        "isCorrect": false
      },
      {
        "id": "reset_target",
        "text": "Reset remaining to the original target at every return.",
        "isCorrect": false
      },
      {
        "id": "clear_path",
        "text": "Clear path because remaining was passed by value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_path_snapshot",
    "secondarySkillAtomIds": [
      "backtracking_result_collection",
      "shared_mutable_state"
    ],
    "type": "single_choice",
    "prompt": "A complete branch does `result.push(path)`, then later recursion continues and calls path.pop(). What is the bug?",
    "feedbackModel": {
      "decisionSignal": "If result stores the same mutable path object, later undo operations mutate what appears to be saved.",
      "distractorExplanations": {
        "path_copied": "The problem is the opposite: the path was not copied.",
        "base_case_missing": "The base case may have been reached; the issue is how the result was stored.",
        "duplicates_removed": "Undoing path does not perform duplicate control."
      },
      "mentalModelCorrection": "When saving a mutable working path, store a snapshot such as [...path].",
      "mistakeTypes": [
        "result_snapshot_missing",
        "mutable_state_misread"
      ],
      "nextAction": "Use result.push([...path]) or an equivalent copy when path will be mutated later.",
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
        "nodeId": "backtracking_path_snapshot",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "result_snapshot_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "mutable_state_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "If result stores the same mutable path object, later undo operations mutate what appears to be saved.",
    "options": [
      {
        "id": "stored_reference",
        "text": "The result stores a reference to the mutable path, so later mutations can change saved results.",
        "isCorrect": true
      },
      {
        "id": "path_copied",
        "text": "The path was copied too early.",
        "isCorrect": false
      },
      {
        "id": "base_case_missing",
        "text": "The base case cannot have been reached.",
        "isCorrect": false
      },
      {
        "id": "duplicates_removed",
        "text": "path.pop() removes duplicate results automatically.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-undo-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_path_snapshot",
    "secondarySkillAtomIds": [
      "backtracking_result_collection",
      "debugging_reasoning"
    ],
    "type": "single_choice",
    "prompt": "After running a backtracking function, every saved result is empty or identical to the final path state. What is the most likely result-storage mistake?",
    "feedbackModel": {
      "decisionSignal": "All saved entries pointing to the same mutable path object will reflect later mutations to that object.",
      "distractorExplanations": {
        "too_many_snapshots": "Extra copies may be inefficient, but they do not make all saved results mutate together.",
        "bounds_before_read": "Safe grid guard order does not explain identical saved path references.",
        "sorted_input": "Sorting input does not cause every saved result to share one mutable path."
      },
      "mentalModelCorrection": "Saved results must be independent snapshots of the working state.",
      "mistakeTypes": [
        "result_snapshot_missing",
        "shared_reference_bug"
      ],
      "nextAction": "Inspect result.push calls and ensure they copy mutable structures before storing.",
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
        "nodeId": "backtracking_path_snapshot",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "result_snapshot_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "shared_reference_bug",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "All saved entries pointing to the same mutable path object will reflect later mutations to that object.",
    "options": [
      {
        "id": "no_snapshot",
        "text": "The code stored the shared path reference instead of copying it when saving.",
        "isCorrect": true
      },
      {
        "id": "too_many_snapshots",
        "text": "The code copied path too often.",
        "isCorrect": false
      },
      {
        "id": "bounds_before_read",
        "text": "The grid bounds check ran before reading the cell.",
        "isCorrect": false
      },
      {
        "id": "sorted_input",
        "text": "The input was sorted before recursion.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "hard",
    "id": "alg-backtracking-undo-019-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_early_return_cleanup",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A word-search function marks board[r][c] = '#'. Then it does `if (dfs(next)) return true;` before restoring board[r][c]. What is the cleanup problem?",
    "feedbackModel": {
      "decisionSignal": "Any return path that exits before cleanup can leak a branch-local mutation into the caller's state.",
      "distractorExplanations": {
        "return_true_restores": "Returning a boolean does not undo mutations.",
        "dfs_never_runs": "The recursive call can run; the issue is what happens if it succeeds.",
        "path_snapshot_missing_only": "Path snapshotting is separate from board restoration."
      },
      "mentalModelCorrection": "Early success must not bypass restoration of shared mutable state.",
      "mistakeTypes": [
        "early_return_cleanup_missing",
        "mutable_state_leak"
      ],
      "nextAction": "Store the recursive result, restore state, then return based on that result.",
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
        "nodeId": "backtracking_early_return_cleanup",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "early_return_cleanup_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "mutable_state_leak",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Any return path that exits before cleanup can leak a branch-local mutation into the caller's state.",
    "options": [
      {
        "id": "early_return_skips_restore",
        "text": "The early return can skip restoring the original cell value.",
        "isCorrect": true
      },
      {
        "id": "return_true_restores",
        "text": "Returning true automatically restores the board.",
        "isCorrect": false
      },
      {
        "id": "dfs_never_runs",
        "text": "The recursive call will never execute.",
        "isCorrect": false
      },
      {
        "id": "path_snapshot_missing_only",
        "text": "The only possible issue is that path was not copied into result.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "hard",
    "id": "alg-backtracking-undo-020-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_early_return_cleanup",
    "secondarySkillAtomIds": [
      "shared_mutable_state",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A branch mutates shared state before recursion and may return early on success. Which structure best preserves correctness?",
    "feedbackModel": {
      "decisionSignal": "Every exit path from a branch-local mutation must restore the parent state before returning.",
      "distractorExplanations": {
        "return_before_cleanup": "This leaks state whenever the child succeeds.",
        "cleanup_only_failure": "Successful branches also need to restore shared state unless the function explicitly owns and discards it.",
        "global_cleanup_later": "Late global cleanup cannot protect sibling branches that run before the end."
      },
      "mentalModelCorrection": "Think try/finally: cleanup belongs to the branch that performed the mutation, regardless of outcome.",
      "mistakeTypes": [
        "early_return_cleanup_missing",
        "state_restoration_error"
      ],
      "nextAction": "Audit every return path after a mutation and ensure restoration happens first.",
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
        "nodeId": "backtracking_early_return_cleanup",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "early_return_cleanup_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      }
    ],
    "title": "Undo",
    "trackId": "algorithms",
    "answerFeedback": "Every exit path from a branch-local mutation must restore the parent state before returning.",
    "options": [
      {
        "id": "cleanup_before_return",
        "text": "Capture the child result, restore the shared state, then return the child result.",
        "isCorrect": true
      },
      {
        "id": "return_before_cleanup",
        "text": "Return immediately on success and skip cleanup.",
        "isCorrect": false
      },
      {
        "id": "cleanup_only_failure",
        "text": "Restore state only when the child fails.",
        "isCorrect": false
      },
      {
        "id": "global_cleanup_later",
        "text": "Wait until the whole algorithm finishes and then clean all shared state once.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
