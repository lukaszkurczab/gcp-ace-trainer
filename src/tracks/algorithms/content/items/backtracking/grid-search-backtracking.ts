import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const gridSearchBacktrackingQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_vs_traversal",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "strategy_selection"
    ],
    "type": "single_choice",
    "prompt": "A problem asks whether a word can be formed by moving through adjacent grid cells without reusing a cell in the same path. Why is this grid backtracking rather than ordinary grid traversal?",
    "feedbackModel": {
      "decisionSignal": "The task explores candidate paths, and a cell can be unavailable in one path but available again in a sibling path after undo.",
      "distractorExplanations": {
        "visit_every_cell_once": "That describes traversal-style visited logic, which would incorrectly block valid alternative paths.",
        "sort_cells": "Sorting destroys spatial adjacency and does not model path choices.",
        "binary_search_rows": "The grid is searched by adjacent moves, not by sorted row lookup."
      },
      "mentalModelCorrection": "Grid backtracking is path search over reversible choices, not just visiting cells once.",
      "mistakeTypes": [
        "wrong_pattern_selected",
        "global_state_confused"
      ],
      "nextAction": "Ask whether visited should be global for traversal or local to one candidate path.",
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
        "nodeId": "backtracking_grid_vs_traversal",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_pattern_selected",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "global_state_confused",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "The task explores candidate paths, and a cell can be unavailable in one path but available again in a sibling path after undo.",
    "options": [
      {
        "id": "path_choices_with_undo",
        "text": "Because the search explores alternative paths and must undo path-local cell usage between branches.",
        "isCorrect": true
      },
      {
        "id": "visit_every_cell_once",
        "text": "Because every grid cell should be visited once globally and never reconsidered.",
        "isCorrect": false
      },
      {
        "id": "sort_cells",
        "text": "Because the grid cells should be sorted before searching.",
        "isCorrect": false
      },
      {
        "id": "binary_search_rows",
        "text": "Because each row can be binary searched for the next character.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_vs_traversal",
    "secondarySkillAtomIds": [
      "grid_traversal",
      "visited_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A flood-fill problem needs to recolor one connected component. Each cell in the component should be processed once. Which visited model is most appropriate?",
    "feedbackModel": {
      "decisionSignal": "Flood fill visits an existing component; it does not enumerate alternative candidate paths that need cell reuse across branches.",
      "distractorExplanations": {
        "path_local_visited": "Path-local undo is for path enumeration/search, not simple component traversal.",
        "no_bounds": "Grid traversal still needs bounds checks before accessing cells.",
        "word_index": "There is no target word being matched."
      },
      "mentalModelCorrection": "Not every DFS over a grid is backtracking. Traversal and path search use different visited semantics.",
      "mistakeTypes": [
        "wrong_pattern_selected",
        "visited_state_misread"
      ],
      "nextAction": "Classify whether the grid task processes cells/components or explores possible paths.",
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
        "nodeId": "backtracking_grid_vs_traversal",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_pattern_selected",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "visited_state_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "Flood fill visits an existing component; it does not enumerate alternative candidate paths that need cell reuse across branches.",
    "options": [
      {
        "id": "global_component_visited",
        "text": "Use visited globally for the traversal so each component cell is processed once.",
        "isCorrect": true
      },
      {
        "id": "path_local_visited",
        "text": "Mark and unmark every cell so sibling paths can reuse it.",
        "isCorrect": false
      },
      {
        "id": "no_bounds",
        "text": "Avoid bounds checks because flood fill stops naturally.",
        "isCorrect": false
      },
      {
        "id": "word_index",
        "text": "Track wordIndex to know which character should match next.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_per_path_visited",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "path_local_state"
    ],
    "type": "single_choice",
    "prompt": "In word search, a cell is marked visited while exploring one path. Why must that cell usually become available again after the branch returns?",
    "feedbackModel": {
      "decisionSignal": "The no-reuse constraint applies inside one candidate path, not permanently across the whole search.",
      "distractorExplanations": {
        "global_never_reuse": "That would turn path-local visited into global traversal visited and miss valid paths.",
        "sort_order": "Grid cells are spatial positions, not sorted candidates.",
        "base_case": "Unmarking restores state; it is not the success condition."
      },
      "mentalModelCorrection": "A grid cell can be illegal for the current path and still legal for another path.",
      "mistakeTypes": [
        "global_state_confused",
        "visited_state_misread"
      ],
      "nextAction": "After each recursive path attempt, restore path-local visited state before trying siblings.",
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
        "nodeId": "backtracking_grid_per_path_visited",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "global_state_confused",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "visited_state_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "The no-reuse constraint applies inside one candidate path, not permanently across the whole search.",
    "options": [
      {
        "id": "sibling_paths_may_need_it",
        "text": "Because a different sibling path may legally use that cell as part of a different candidate path.",
        "isCorrect": true
      },
      {
        "id": "global_never_reuse",
        "text": "Because once any branch uses a cell, no later branch should ever use it.",
        "isCorrect": false
      },
      {
        "id": "sort_order",
        "text": "Because the cell needs to be sorted back into the grid.",
        "isCorrect": false
      },
      {
        "id": "base_case",
        "text": "Because unmarking the cell proves the whole word has been matched.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-grid-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_word_index_progress",
    "secondarySkillAtomIds": [
      "backtracking_grid_position_state",
      "word_search_state"
    ],
    "type": "single_choice",
    "prompt": "A word-search DFS is currently at board[row][col]. What state is needed to know which character this cell must match?",
    "feedbackModel": {
      "decisionSignal": "wordIndex connects the current grid cell to the exact next character required by the target word.",
      "distractorExplanations": {
        "start_index": "A linear start index over cells does not represent progress through the word.",
        "result_count": "The number of completed results does not tell which character should match now.",
        "sorted_letters": "Sorted letters lose adjacency and sequence order."
      },
      "mentalModelCorrection": "Grid position and target progress are separate pieces of state that work together.",
      "mistakeTypes": [
        "state_model_misread",
        "target_progress_missing"
      ],
      "nextAction": "For ordered target matching, track both where you are and which target symbol is next.",
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
        "nodeId": "backtracking_word_index_progress",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_model_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "target_progress_missing",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "wordIndex connects the current grid cell to the exact next character required by the target word.",
    "options": [
      {
        "id": "word_index",
        "text": "wordIndex, the position in the target word currently being matched.",
        "isCorrect": true
      },
      {
        "id": "start_index",
        "text": "startIndex in the list of all grid cells.",
        "isCorrect": false
      },
      {
        "id": "result_count",
        "text": "The number of words found so far.",
        "isCorrect": false
      },
      {
        "id": "sorted_letters",
        "text": "The sorted letters of the whole board.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_word_index_progress",
    "secondarySkillAtomIds": [
      "backtracking_minimal_state",
      "word_search_state"
    ],
    "type": "single_choice",
    "prompt": "A word-search implementation passes both wordIndex and currentWord, where currentWord is always word.slice(0, wordIndex). What is the best assessment?",
    "feedbackModel": {
      "decisionSignal": "The target word is fixed, and wordIndex already tells how many characters have been matched.",
      "distractorExplanations": {
        "word_index_redundant": "The grid position does not reveal how much of the word has been matched.",
        "both_required_for_bounds": "Bounds checks depend on row and col, not currentWord.",
        "sort_current_word": "Sorting the prefix would destroy the ordered word contract."
      },
      "mentalModelCorrection": "Prefer compact canonical state over derived state that can drift or add noise.",
      "mistakeTypes": [
        "unnecessary_state",
        "redundant_state_derivation"
      ],
      "nextAction": "Remove state fields that can be derived directly from fixed input and existing progress markers.",
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
        "nodeId": "backtracking_word_index_progress",
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
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "The target word is fixed, and wordIndex already tells how many characters have been matched.",
    "options": [
      {
        "id": "current_word_redundant",
        "text": "currentWord is redundant because wordIndex already defines the matched prefix.",
        "isCorrect": true
      },
      {
        "id": "word_index_redundant",
        "text": "wordIndex is redundant because the grid position alone defines the matched prefix.",
        "isCorrect": false
      },
      {
        "id": "both_required_for_bounds",
        "text": "Both are required to check grid bounds.",
        "isCorrect": false
      },
      {
        "id": "sort_current_word",
        "text": "currentWord should be sorted before every move.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-grid-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_direction_model",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "backtracking_enumerate_choices"
    ],
    "type": "single_choice",
    "prompt": "A grid path problem allows movement only up, down, left, and right. From a current cell, what is the correct movement model?",
    "feedbackModel": {
      "decisionSignal": "The prompt defines local orthogonal movement, so choices are limited to adjacent up/down/left/right cells.",
      "distractorExplanations": {
        "any_matching_cell": "Matching value does not override the movement rule.",
        "same_row_only": "The prompt also allows vertical movement.",
        "sorted_cells": "Sorted value order ignores spatial adjacency."
      },
      "mentalModelCorrection": "Grid choices come from the legal movement model, not from all cells that look useful.",
      "mistakeTypes": [
        "grid_movement_misread",
        "constraint_ignored"
      ],
      "nextAction": "Convert the movement rule into the exact neighbor offsets before recursing.",
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
        "nodeId": "backtracking_grid_direction_model",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "grid_movement_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "The prompt defines local orthogonal movement, so choices are limited to adjacent up/down/left/right cells.",
    "options": [
      {
        "id": "orthogonal_neighbors",
        "text": "Try only the four orthogonal neighboring cells.",
        "isCorrect": true
      },
      {
        "id": "any_matching_cell",
        "text": "Jump to any cell in the grid that has the needed value.",
        "isCorrect": false
      },
      {
        "id": "same_row_only",
        "text": "Move only to cells in the same row.",
        "isCorrect": false
      },
      {
        "id": "sorted_cells",
        "text": "Move through cells in sorted value order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_direction_model",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "constraint_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A word-search prompt allows only adjacent moves. A later cell elsewhere in the board matches the next character. Why is jumping there invalid?",
    "feedbackModel": {
      "decisionSignal": "Grid path validity requires both target-character match and legal spatial movement.",
      "distractorExplanations": {
        "duplicates_word": "Equal characters are not duplicate-control errors by themselves.",
        "base_case_reached": "A local character match is not the same as completing the whole word.",
        "visited_global": "Global pre-visiting all matches would prevent valid search rather than enforce adjacency."
      },
      "mentalModelCorrection": "A candidate grid move must satisfy all movement and content constraints.",
      "mistakeTypes": [
        "grid_movement_misread",
        "constraint_ignored"
      ],
      "nextAction": "Check adjacency before treating a matching cell as a valid next step.",
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
        "nodeId": "backtracking_grid_direction_model",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "grid_movement_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "Grid path validity requires both target-character match and legal spatial movement.",
    "options": [
      {
        "id": "violates_adjacency",
        "text": "Because matching the character is not enough; the next cell must also be adjacent to the current cell.",
        "isCorrect": true
      },
      {
        "id": "duplicates_word",
        "text": "Because matching characters are always duplicates that must be skipped.",
        "isCorrect": false
      },
      {
        "id": "base_case_reached",
        "text": "Because finding any matching character means the word is complete.",
        "isCorrect": false
      },
      {
        "id": "visited_global",
        "text": "Because every matching cell was already globally visited before the search began.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-grid-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_bounds_guard",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "boundary_guard_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A recursive grid call receives row and col. Why should the bounds check run before reading board[row][col]?",
    "feedbackModel": {
      "decisionSignal": "Bounds is a safety and correctness guard that must happen before accessing the grid at that coordinate.",
      "distractorExplanations": {
        "speed_only": "This is not merely performance; reading an invalid coordinate is incorrect.",
        "sort_board": "Sorting is unrelated to safe coordinate access.",
        "save_result": "Out-of-bounds movement is usually a failed move, not a success signal."
      },
      "mentalModelCorrection": "Grid recursion must validate coordinates before using them.",
      "mistakeTypes": [
        "boundary_guard_missed",
        "read_order_error"
      ],
      "nextAction": "Order grid guards so bounds checks come before cell reads, visited checks, and character comparisons.",
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
        "nodeId": "backtracking_grid_bounds_guard",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "boundary_guard_missed",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "read_order_error",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "Bounds is a safety and correctness guard that must happen before accessing the grid at that coordinate.",
    "options": [
      {
        "id": "avoid_invalid_access",
        "text": "Because out-of-bounds coordinates do not refer to a valid cell and may cause invalid memory/index access.",
        "isCorrect": true
      },
      {
        "id": "speed_only",
        "text": "Only because it makes the code faster, not because correctness depends on it.",
        "isCorrect": false
      },
      {
        "id": "sort_board",
        "text": "Because the board must be sorted before a cell is read.",
        "isCorrect": false
      },
      {
        "id": "save_result",
        "text": "Because reading an out-of-bounds cell means a result was found.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_bounds_guard",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "read_order_reasoning"
    ],
    "type": "single_choice",
    "prompt": "Which guard order is safest in a word-search DFS call?",
    "feedbackModel": {
      "decisionSignal": "Bounds must be validated before any grid access, and visited should be checked before committing to a reused cell.",
      "distractorExplanations": {
        "char_then_bounds": "Reading board[row][col] before bounds can access an invalid coordinate.",
        "visited_after_recurse": "Visited must block illegal reuse before deeper recursion.",
        "save_then_validate": "A path should not be saved before the current move is known to be legal."
      },
      "mentalModelCorrection": "Grid guard order is part of correctness, not a formatting preference.",
      "mistakeTypes": [
        "read_order_error",
        "boundary_guard_missed"
      ],
      "nextAction": "Write guard checks in the order required to make each later check safe.",
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
        "nodeId": "backtracking_grid_bounds_guard",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "read_order_error",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "boundary_guard_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "Bounds must be validated before any grid access, and visited should be checked before committing to a reused cell.",
    "options": [
      {
        "id": "bounds_then_visited_then_char",
        "text": "Check bounds, then visited, then whether board[row][col] matches word[wordIndex].",
        "isCorrect": true
      },
      {
        "id": "char_then_bounds",
        "text": "Check board[row][col] first, then check bounds afterward.",
        "isCorrect": false
      },
      {
        "id": "visited_after_recurse",
        "text": "Recurse first, then check whether the cell was visited.",
        "isCorrect": false
      },
      {
        "id": "save_then_validate",
        "text": "Save the path first, then validate the move.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_per_path_visited",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "visited_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "In grid path backtracking, what does visited[row][col] usually mean?",
    "feedbackModel": {
      "decisionSignal": "For path search, visited enforces the no-reuse rule inside one candidate path.",
      "distractorExplanations": {
        "forbidden_forever": "That would incorrectly block sibling paths from using the cell.",
        "cell_matches_word": "Visited records path usage, not whether the character matches.",
        "cell_is_boundary": "Boundary status is checked from coordinates, not visited state."
      },
      "mentalModelCorrection": "Visited in grid backtracking is usually branch-local state.",
      "mistakeTypes": [
        "visited_state_misread",
        "global_state_confused"
      ],
      "nextAction": "Ask whether the cell should be unavailable only in this path or across the entire traversal.",
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
        "nodeId": "backtracking_grid_per_path_visited",
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
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "For path search, visited enforces the no-reuse rule inside one candidate path.",
    "options": [
      {
        "id": "used_in_current_path",
        "text": "This cell is already used in the current candidate path.",
        "isCorrect": true
      },
      {
        "id": "forbidden_forever",
        "text": "This cell is forbidden for all future branches in the whole search.",
        "isCorrect": false
      },
      {
        "id": "cell_matches_word",
        "text": "This cell matches every remaining character in the word.",
        "isCorrect": false
      },
      {
        "id": "cell_is_boundary",
        "text": "This cell is outside the board boundary.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_per_path_visited",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A grid path search marks visited[row][col] = true before exploring neighbors. What should happen after all neighbor branches from that cell have been explored?",
    "feedbackModel": {
      "decisionSignal": "The visited mark belongs to the current path, so it must be undone when the path choice is finished.",
      "distractorExplanations": {
        "leave_marked": "Leaving it marked turns path-local state into global state and can block valid sibling paths.",
        "mark_all_neighbors": "Only cells actually used in the current path should be marked.",
        "clear_entire_grid": "The grid contents are input data and should not be destroyed."
      },
      "mentalModelCorrection": "Grid backtracking requires restoring path-local marks after exploring a branch.",
      "mistakeTypes": [
        "undo_missing",
        "global_state_confused"
      ],
      "nextAction": "Pair each path-local mark with a corresponding unmark before returning.",
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
        "nodeId": "backtracking_grid_per_path_visited",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "global_state_confused",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "The visited mark belongs to the current path, so it must be undone when the path choice is finished.",
    "options": [
      {
        "id": "unmark_cell",
        "text": "Set visited[row][col] back to false before returning to the caller.",
        "isCorrect": true
      },
      {
        "id": "leave_marked",
        "text": "Leave it marked so no other branch can ever use it.",
        "isCorrect": false
      },
      {
        "id": "mark_all_neighbors",
        "text": "Mark all neighbors visited even if they were not used.",
        "isCorrect": false
      },
      {
        "id": "clear_entire_grid",
        "text": "Clear the whole grid data structure.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_per_path_visited",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A word-search implementation marks cells visited but never unmarks them. What failure can this cause?",
    "feedbackModel": {
      "decisionSignal": "Without unmarking, a branch-local path constraint leaks into unrelated branches.",
      "distractorExplanations": {
        "creates_duplicate_words_only": "The common failure is missing valid paths, not merely duplicating results.",
        "removes_bounds_need": "Visited does not replace coordinate bounds checks.",
        "sorts_grid": "Visited state does not sort the grid."
      },
      "mentalModelCorrection": "State leakage across sibling branches is a core backtracking bug.",
      "mistakeTypes": [
        "undo_missing",
        "global_state_confused"
      ],
      "nextAction": "Verify every branch-local mutation is restored before the function returns.",
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
        "nodeId": "backtracking_grid_per_path_visited",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "global_state_confused",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "Without unmarking, a branch-local path constraint leaks into unrelated branches.",
    "options": [
      {
        "id": "blocks_sibling_paths",
        "text": "It can block valid sibling paths that should be allowed to reuse the cell in a different path.",
        "isCorrect": true
      },
      {
        "id": "creates_duplicate_words_only",
        "text": "It only creates duplicate words, but never misses valid ones.",
        "isCorrect": false
      },
      {
        "id": "removes_bounds_need",
        "text": "It removes the need for bounds checks.",
        "isCorrect": false
      },
      {
        "id": "sorts_grid",
        "text": "It implicitly sorts the grid by visited status.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_cell_restore",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "mutable_state_reasoning"
    ],
    "type": "single_choice",
    "prompt": "Instead of a separate visited matrix, a word-search solution branch-locally writes '#' into board[row][col] to mark the cell as used. What must happen before returning from that branch?",
    "feedbackModel": {
      "decisionSignal": "Branch-local board mutation is branch-local visited state, so the original cell value must be restored for sibling branches.",
      "distractorExplanations": {
        "leave_hash": "Leaving the marker corrupts input state for other branches.",
        "sort_row": "Sorting changes spatial structure and does not restore the cell.",
        "delete_cell": "Deleting a grid cell destroys the board shape."
      },
      "mentalModelCorrection": "Mutating the board can replace visited only if the mutation is fully restored.",
      "mistakeTypes": [
        "mutable_state_leak",
        "undo_missing"
      ],
      "nextAction": "Store the original cell value before marking it and restore it after neighbor exploration.",
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
        "nodeId": "backtracking_grid_cell_restore",
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
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "Branch-local board mutation is branch-local visited state, so the original cell value must be restored for sibling branches.",
    "options": [
      {
        "id": "restore_original_char",
        "text": "Restore the original character in board[row][col].",
        "isCorrect": true
      },
      {
        "id": "leave_hash",
        "text": "Leave '#' in the board so later searches avoid the cell globally.",
        "isCorrect": false
      },
      {
        "id": "sort_row",
        "text": "Sort the row so '#' moves to the beginning.",
        "isCorrect": false
      },
      {
        "id": "delete_cell",
        "text": "Delete the cell from the board.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_cell_restore",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A grid search branch-locally mutates board[row][col] to mark the current path. Why is restoring the cell necessary even if this branch fails?",
    "feedbackModel": {
      "decisionSignal": "Failure of one candidate path should not corrupt shared grid input for other candidate paths.",
      "distractorExplanations": {
        "failure_means_success": "Restoration preserves state; it does not change a failed branch into a successful one.",
        "restore_sorts_board": "The board is spatial input, not sorted data.",
        "avoid_base_case": "State restoration and result completion are separate concerns."
      },
      "mentalModelCorrection": "Backtracking must restore shared mutable state regardless of whether the explored branch succeeds or fails.",
      "mistakeTypes": [
        "mutable_state_leak",
        "undo_missing"
      ],
      "nextAction": "Place restoration on every return path from a branch-local board mutation.",
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
        "nodeId": "backtracking_grid_cell_restore",
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
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "Failure of one candidate path should not corrupt shared grid input for other candidate paths.",
    "options": [
      {
        "id": "siblings_need_original",
        "text": "Sibling branches may still need to read the original character from that cell.",
        "isCorrect": true
      },
      {
        "id": "failure_means_success",
        "text": "A failed branch becomes successful only after the cell is restored.",
        "isCorrect": false
      },
      {
        "id": "restore_sorts_board",
        "text": "Restoring the cell sorts the board back into order.",
        "isCorrect": false
      },
      {
        "id": "avoid_base_case",
        "text": "Restoring removes the need for a base case.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_word_index_progress",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "partial_solution_reasoning"
    ],
    "type": "single_choice",
    "prompt": "In word search, the current cell matches word[wordIndex], but wordIndex is not the final character. Why is returning true immediately incorrect?",
    "feedbackModel": {
      "decisionSignal": "A local character match advances the path, but success requires matching the full target word in order.",
      "distractorExplanations": {
        "cell_mismatch": "The cell does match; the issue is that the full word is not complete yet.",
        "visited_global": "Global visited would corrupt path search and does not prove completion.",
        "sort_word": "Sorting the word changes the target sequence."
      },
      "mentalModelCorrection": "Do not confuse a valid local step with a complete path solution.",
      "mistakeTypes": [
        "partial_solution_saved",
        "base_case_misread"
      ],
      "nextAction": "After a match, advance wordIndex and continue unless the full word has been consumed.",
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
        "nodeId": "backtracking_word_index_progress",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "partial_solution_saved",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "base_case_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "A local character match advances the path, but success requires matching the full target word in order.",
    "options": [
      {
        "id": "only_prefix_matched",
        "text": "Only a prefix has been matched; the remaining characters still need a valid adjacent path.",
        "isCorrect": true
      },
      {
        "id": "cell_mismatch",
        "text": "The current cell must not match the current character.",
        "isCorrect": false
      },
      {
        "id": "visited_global",
        "text": "Matching one character means all cells should be globally marked visited.",
        "isCorrect": false
      },
      {
        "id": "sort_word",
        "text": "The word must be sorted before the search can continue.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-grid-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_grid_path_completion",
    "secondarySkillAtomIds": [
      "grid_search_backtracking",
      "backtracking_first_vs_all_results"
    ],
    "type": "single_choice",
    "prompt": "A maze problem asks for all valid paths from start to destination. One branch reaches the destination. What should the search do at the overall level?",
    "feedbackModel": {
      "decisionSignal": "The output contract asks for all paths, so one successful branch is a completed result but not the end of the whole search.",
      "distractorExplanations": {
        "stop_entire_search": "That would be correct for existence or first-path search, not collect-all paths.",
        "discard_path": "A path that reaches the destination satisfies the path-completion condition.",
        "mark_destination_global": "Globally forbidding the destination would prevent other valid paths from completing."
      },
      "mentalModelCorrection": "In collect-all grid path search, a branch can be complete while sibling branches still need exploration.",
      "mistakeTypes": [
        "output_contract_misread",
        "early_return_misused"
      ],
      "nextAction": "Classify grid search output as existence, one path, shortest path, or all paths before deciding when to stop.",
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
        "nodeId": "backtracking_grid_path_completion",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "early_return_misused",
        "role": "mistake_type"
      }
    ],
    "title": "Grid",
    "trackId": "algorithms",
    "answerFeedback": "The output contract asks for all paths, so one successful branch is a completed result but not the end of the whole search.",
    "options": [
      {
        "id": "save_path_and_continue_siblings",
        "text": "Save that path, then continue exploring other branches that may lead to different valid paths.",
        "isCorrect": true
      },
      {
        "id": "stop_entire_search",
        "text": "Stop the entire search immediately because one path exists.",
        "isCorrect": false
      },
      {
        "id": "discard_path",
        "text": "Discard the path because reaching the destination ends the branch.",
        "isCorrect": false
      },
      {
        "id": "mark_destination_global",
        "text": "Mark the destination globally forbidden for all later branches.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
