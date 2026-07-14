import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const placementBacktrackingQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-placement-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_fixed_slot_placement",
    "secondarySkillAtomIds": [
      "backtracking_position_value_choices",
      "strategy_selection"
    ],
    "type": "single_choice",
    "prompt": "A problem fills one empty board slot at a time. Each slot can accept one of several values if local rules are satisfied. Which backtracking shape fits best?",
    "feedbackModel": {
      "decisionSignal": "The current frame owns a position or slot, and its choices are the legal values that can be placed there.",
      "distractorExplanations": {
        "choose_skip_array": "Choose/skip models subset membership over linear input, not assigning values to fixed board slots.",
        "sliding_window": "There is no contiguous range invariant to maintain.",
        "binary_search": "Board placement has no sorted monotonic discard rule."
      },
      "mentalModelCorrection": "Placement backtracking assigns legal values to positions under constraints.",
      "mistakeTypes": [
        "wrong_pattern_selected",
        "choice_enumeration_misread"
      ],
      "nextAction": "Identify whether the recursion frame chooses an input item, a movement, a segment boundary, or a value for a slot.",
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
        "nodeId": "backtracking_fixed_slot_placement",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_pattern_selected",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "choice_enumeration_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "The current frame owns a position or slot, and its choices are the legal values that can be placed there.",
    "options": [
      {
        "id": "slot_then_values",
        "text": "Choose an empty slot, try each legal value for that slot, recurse, then undo the placement.",
        "isCorrect": true
      },
      {
        "id": "choose_skip_array",
        "text": "For each array element, choose whether to include or skip it.",
        "isCorrect": false
      },
      {
        "id": "sliding_window",
        "text": "Maintain a contiguous window and shrink it when invalid.",
        "isCorrect": false
      },
      {
        "id": "binary_search",
        "text": "Repeatedly discard half of the board using a sorted-order comparison.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_next_slot_state",
    "secondarySkillAtomIds": [
      "backtracking_fixed_slot_placement",
      "backtracking_recursion_state"
    ],
    "type": "single_choice",
    "prompt": "A Sudoku-style solver is filling empty cells. What should the recursion state or helper logic identify before trying values?",
    "feedbackModel": {
      "decisionSignal": "A placement solver needs to know which unfilled position the current frame is responsible for.",
      "distractorExplanations": {
        "sorted_digits": "Sorted digits do not identify which board cell must be assigned next.",
        "result_count_only": "The count of completed boards does not guide the next placement.",
        "left_right_pair": "Two pointers solve ordered pair or range problems, not board-slot assignment."
      },
      "mentalModelCorrection": "Placement state must connect the recursion to the next unresolved slot.",
      "mistakeTypes": [
        "state_model_misread",
        "position_state_missing"
      ],
      "nextAction": "Before enumerating values, identify the slot that this frame is solving.",
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
        "nodeId": "backtracking_next_slot_state",
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
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "A placement solver needs to know which unfilled position the current frame is responsible for.",
    "options": [
      {
        "id": "next_empty_slot",
        "text": "The next empty cell that still needs a value.",
        "isCorrect": true
      },
      {
        "id": "sorted_digits",
        "text": "The digits sorted by numeric value.",
        "isCorrect": false
      },
      {
        "id": "result_count_only",
        "text": "Only the number of completed boards found so far.",
        "isCorrect": false
      },
      {
        "id": "left_right_pair",
        "text": "A left pointer and right pointer moving toward each other.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-backtracking-placement-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_slot_candidate_values",
    "secondarySkillAtomIds": [
      "backtracking_fixed_slot_placement",
      "constraint_state"
    ],
    "type": "single_choice",
    "prompt": "A placement frame has selected an empty cell. The cell can contain digits 1 through 9 only if row, column, and box rules are satisfied. What choices should this frame enumerate?",
    "feedbackModel": {
      "decisionSignal": "Once the slot is chosen, the branch choices are the legal values that can be placed in that slot.",
      "distractorExplanations": {
        "all_future_cells": "Skipping value selection leaves the current slot unresolved.",
        "previous_digits": "Already placed digits are constraint context, not necessarily legal candidates.",
        "complete_boards": "Complete boards are produced after recursive placements, not enumerated before a value is chosen."
      },
      "mentalModelCorrection": "For fixed-slot placement, enumerate legal values for the current slot.",
      "mistakeTypes": [
        "choice_enumeration_misread",
        "constraint_ignored"
      ],
      "nextAction": "Apply local constraints before recursing with a candidate value.",
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
        "nodeId": "backtracking_slot_candidate_values",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "choice_enumeration_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "Once the slot is chosen, the branch choices are the legal values that can be placed in that slot.",
    "options": [
      {
        "id": "legal_digits",
        "text": "Digits 1 through 9 that satisfy the local constraints for this cell.",
        "isCorrect": true
      },
      {
        "id": "all_future_cells",
        "text": "All future empty cells, without trying a value for the current cell.",
        "isCorrect": false
      },
      {
        "id": "previous_digits",
        "text": "Only digits already placed somewhere else on the board.",
        "isCorrect": false
      },
      {
        "id": "complete_boards",
        "text": "Every complete board before placing a digit.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_placement_constraint_check",
    "secondarySkillAtomIds": [
      "backtracking_slot_candidate_values",
      "constraint_pruning"
    ],
    "type": "single_choice",
    "prompt": "A board-placement solver tries value 5 in a cell, but 5 already exists in the same row where duplicates are forbidden. What should happen?",
    "feedbackModel": {
      "decisionSignal": "A local row constraint violation cannot be repaired by filling later cells.",
      "distractorExplanations": {
        "place_anyway": "Later placements do not remove the duplicate value already created in the row.",
        "save_board": "A constraint violation is not a completed valid board.",
        "sort_row": "Sorting the row changes board positions and does not satisfy the placement rules."
      },
      "mentalModelCorrection": "Placement backtracking should validate a candidate before committing recursion to it.",
      "mistakeTypes": [
        "constraint_ignored",
        "pruning_missed"
      ],
      "nextAction": "Treat row, column, box, and diagonal rules as candidate filters.",
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
        "nodeId": "backtracking_placement_constraint_check",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "pruning_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "A local row constraint violation cannot be repaired by filling later cells.",
    "options": [
      {
        "id": "skip_value",
        "text": "Reject this value for the current cell and try another candidate.",
        "isCorrect": true
      },
      {
        "id": "place_anyway",
        "text": "Place it anyway because a later cell may repair the row conflict.",
        "isCorrect": false
      },
      {
        "id": "save_board",
        "text": "Save the board because a duplicate row value completes a branch.",
        "isCorrect": false
      },
      {
        "id": "sort_row",
        "text": "Sort the row so the duplicate becomes valid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_placement_state_restore",
    "secondarySkillAtomIds": [
      "backtracking_path_state_and_undo",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "A solver writes board[row][col] = digit before recursing. What should happen after that recursive branch returns if the solver uses shared mutable board state?",
    "feedbackModel": {
      "decisionSignal": "The placement is branch-local, so the board must be restored before trying sibling values.",
      "distractorExplanations": {
        "leave_digit": "Leaving the digit leaks one branch's placement into other branches.",
        "clear_result": "Result collection is separate from restoring the working board.",
        "sort_board": "Sorting destroys the spatial structure of the board."
      },
      "mentalModelCorrection": "Board placement follows the same apply/recurse/undo discipline as path and visited state.",
      "mistakeTypes": [
        "undo_missing",
        "sibling_state_leak"
      ],
      "nextAction": "Pair each branch-local board assignment with a matching reset.",
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
        "nodeId": "backtracking_placement_state_restore",
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
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "The placement is branch-local, so the board must be restored before trying sibling values.",
    "options": [
      {
        "id": "clear_cell",
        "text": "Restore the cell to empty so sibling branches can try different values.",
        "isCorrect": true
      },
      {
        "id": "leave_digit",
        "text": "Leave the digit in the cell for every sibling branch.",
        "isCorrect": false
      },
      {
        "id": "clear_result",
        "text": "Clear all completed boards.",
        "isCorrect": false
      },
      {
        "id": "sort_board",
        "text": "Sort the board before returning to the caller.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_n_queens_row_state",
    "secondarySkillAtomIds": [
      "backtracking_fixed_slot_placement",
      "n_queens_constraints"
    ],
    "type": "single_choice",
    "prompt": "An N-Queens solver places exactly one queen per row. What can the recursion depth naturally represent?",
    "feedbackModel": {
      "decisionSignal": "If the solver places one queen per row, each recursive level can own one row assignment.",
      "distractorExplanations": {
        "current_column_only": "Queens cannot all share one column, and the current frame usually tries multiple columns.",
        "number_of_diagonals": "Diagonal constraints are legality state, not the recursion depth itself.",
        "sorted_queen_positions": "Sorting placements does not identify the next row to solve."
      },
      "mentalModelCorrection": "A placement problem can use recursion depth as the current slot index, such as the current row.",
      "mistakeTypes": [
        "state_model_misread",
        "position_state_missing"
      ],
      "nextAction": "Choose a stable slot order before deciding which values are legal for each slot.",
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
        "nodeId": "backtracking_n_queens_row_state",
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
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "If the solver places one queen per row, each recursive level can own one row assignment.",
    "options": [
      {
        "id": "current_row",
        "text": "The current row where the next queen must be placed.",
        "isCorrect": true
      },
      {
        "id": "current_column_only",
        "text": "The only column that all queens must share.",
        "isCorrect": false
      },
      {
        "id": "number_of_diagonals",
        "text": "The number of diagonals on the board.",
        "isCorrect": false
      },
      {
        "id": "sorted_queen_positions",
        "text": "The queen positions sorted after every placement.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_n_queens_column_choices",
    "secondarySkillAtomIds": [
      "n_queens_constraints",
      "backtracking_slot_candidate_values"
    ],
    "type": "single_choice",
    "prompt": "An N-Queens solver is placing a queen in row r. If one queen is placed per row, what should the current frame usually enumerate?",
    "feedbackModel": {
      "decisionSignal": "With the row fixed by recursion depth, the choice is which legal column receives the queen.",
      "distractorExplanations": {
        "all_rows_again": "The current row is already the frame's slot; restarting rows duplicates or corrupts assignments.",
        "all_previous_queens": "Previous queens are constraint context, not candidate placements for the current row.",
        "sorted_diagonals": "Diagonal identifiers help validate a column choice but do not replace choosing the column."
      },
      "mentalModelCorrection": "In row-by-row N-Queens, the frame chooses a column for the current row.",
      "mistakeTypes": [
        "choice_enumeration_misread",
        "constraint_state_missing"
      ],
      "nextAction": "Separate the fixed slot from the candidate values that can fill it.",
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
        "nodeId": "backtracking_n_queens_column_choices",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "choice_enumeration_misread",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "With the row fixed by recursion depth, the choice is which legal column receives the queen.",
    "options": [
      {
        "id": "columns",
        "text": "Candidate columns in row r that do not violate column or diagonal constraints.",
        "isCorrect": true
      },
      {
        "id": "all_rows_again",
        "text": "All rows from the beginning of the board.",
        "isCorrect": false
      },
      {
        "id": "all_previous_queens",
        "text": "Only the queen positions already placed.",
        "isCorrect": false
      },
      {
        "id": "sorted_diagonals",
        "text": "Sorted diagonal identifiers without choosing a column.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_n_queens_diagonal_state",
    "secondarySkillAtomIds": [
      "n_queens_constraints",
      "constraint_state"
    ],
    "type": "single_choice",
    "prompt": "In N-Queens, two queens attack each other on a main diagonal when they share which value?",
    "feedbackModel": {
      "decisionSignal": "Cells on the same main diagonal have the same row - col value.",
      "distractorExplanations": {
        "row_only": "Same row is already controlled by placing one queen per row; it is not the diagonal identity.",
        "col_only": "Same column is a column conflict, not a diagonal identity.",
        "row_times_col": "The product of row and column does not identify board diagonals."
      },
      "mentalModelCorrection": "Diagonal constraints can be represented as compact derived state from row and column.",
      "mistakeTypes": [
        "constraint_state_missing",
        "diagonal_reasoning_missed"
      ],
      "nextAction": "For each queen placement, update column, row - col, and row + col constraint sets.",
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
        "nodeId": "backtracking_n_queens_diagonal_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "diagonal_reasoning_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "Cells on the same main diagonal have the same row - col value.",
    "options": [
      {
        "id": "row_minus_col",
        "text": "row - col",
        "isCorrect": true
      },
      {
        "id": "row_only",
        "text": "row only",
        "isCorrect": false
      },
      {
        "id": "col_only",
        "text": "col only",
        "isCorrect": false
      },
      {
        "id": "row_times_col",
        "text": "row * col",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_n_queens_diagonal_state",
    "secondarySkillAtomIds": [
      "n_queens_constraints",
      "constraint_state"
    ],
    "type": "single_choice",
    "prompt": "In N-Queens, two queens attack each other on an anti-diagonal when they share which value?",
    "feedbackModel": {
      "decisionSignal": "Cells on the same anti-diagonal have the same row + col value.",
      "distractorExplanations": {
        "row_minus_col_only": "row - col identifies the other diagonal direction.",
        "row_div_col": "The ratio of coordinates does not identify anti-diagonals.",
        "path_length": "path.length may track how many queens were placed, but not diagonal conflicts."
      },
      "mentalModelCorrection": "N-Queens legality depends on columns and both diagonal directions.",
      "mistakeTypes": [
        "constraint_state_missing",
        "diagonal_reasoning_missed"
      ],
      "nextAction": "Track both diagonal identifiers when validating a queen placement.",
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
        "nodeId": "backtracking_n_queens_diagonal_state",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "diagonal_reasoning_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "Cells on the same anti-diagonal have the same row + col value.",
    "options": [
      {
        "id": "row_plus_col",
        "text": "row + col",
        "isCorrect": true
      },
      {
        "id": "row_minus_col_only",
        "text": "row - col only",
        "isCorrect": false
      },
      {
        "id": "row_div_col",
        "text": "row / col",
        "isCorrect": false
      },
      {
        "id": "path_length",
        "text": "path.length",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_placement_constraint_state_restore",
    "secondarySkillAtomIds": [
      "n_queens_constraints",
      "state_restoration"
    ],
    "type": "single_choice",
    "prompt": "An N-Queens branch adds col, row - col, and row + col to constraint sets before recursion. What must happen after the branch returns?",
    "feedbackModel": {
      "decisionSignal": "The constraint marks belong to the queen placed by this branch and must be undone before sibling placements.",
      "distractorExplanations": {
        "leave_constraints": "Leaving branch-local constraints blocks valid sibling placements.",
        "clear_all_constraints": "Clearing all constraints removes ancestor state that should still apply.",
        "sort_constraints": "Sorting does not restore the parent constraint state."
      },
      "mentalModelCorrection": "Constraint sets are mutable branch state and need exact restoration.",
      "mistakeTypes": [
        "undo_missing",
        "state_restoration_error"
      ],
      "nextAction": "For every constraint marker added by a placement, remove that exact marker after recursion.",
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
        "nodeId": "backtracking_placement_constraint_state_restore",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "undo_missing",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "state_restoration_error",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "The constraint marks belong to the queen placed by this branch and must be undone before sibling placements.",
    "options": [
      {
        "id": "remove_same_constraints",
        "text": "Remove the same column and diagonal identifiers that this branch added.",
        "isCorrect": true
      },
      {
        "id": "leave_constraints",
        "text": "Leave them in the sets so sibling rows cannot use those lines.",
        "isCorrect": false
      },
      {
        "id": "clear_all_constraints",
        "text": "Clear all constraint sets, including ancestor queen placements.",
        "isCorrect": false
      },
      {
        "id": "sort_constraints",
        "text": "Sort the constraint sets before the next branch.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_placement_result_contract",
    "secondarySkillAtomIds": [
      "backtracking_first_vs_all_results",
      "n_queens_constraints"
    ],
    "type": "single_choice",
    "prompt": "An N-Queens problem asks for all valid board arrangements. A branch has placed queens in all n rows without conflicts. What should happen?",
    "feedbackModel": {
      "decisionSignal": "The output contract asks for all arrangements, so one complete board is a result but not the end of the whole search.",
      "distractorExplanations": {
        "return_true_only": "A boolean success signal does not satisfy a collect-all arrangement contract.",
        "discard_board": "Placing n non-conflicting queens completes a valid arrangement.",
        "place_extra_queen": "Adding another queen violates the one-queen-per-row and n-queen contract."
      },
      "mentalModelCorrection": "For collect-all placement problems, completion saves one board and sibling branches still matter.",
      "mistakeTypes": [
        "output_contract_misread",
        "early_return_misused"
      ],
      "nextAction": "Classify whether the board problem asks for existence, one arrangement, count, or all arrangements.",
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
        "nodeId": "backtracking_placement_result_contract",
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
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "The output contract asks for all arrangements, so one complete board is a result but not the end of the whole search.",
    "options": [
      {
        "id": "save_and_continue",
        "text": "Save a snapshot of the arrangement, then allow the search to continue through sibling branches.",
        "isCorrect": true
      },
      {
        "id": "return_true_only",
        "text": "Return true immediately and discard the arrangement.",
        "isCorrect": false
      },
      {
        "id": "discard_board",
        "text": "Discard the board because no more rows remain.",
        "isCorrect": false
      },
      {
        "id": "place_extra_queen",
        "text": "Place one extra queen to prove the board is complete.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "foundational",
    "id": "alg-backtracking-placement-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "backtracking_placement_vs_generate_then_validate",
    "secondarySkillAtomIds": [
      "constraint_pruning",
      "unnecessary_search_space"
    ],
    "type": "single_choice",
    "prompt": "A board-placement problem has strong local constraints. Why is checking constraints before recursion usually better than generating every full board and validating only at the end?",
    "feedbackModel": {
      "decisionSignal": "Local constraints can prove a partial assignment impossible, which cuts off a large invalid subtree.",
      "distractorExplanations": {
        "end_validation_impossible": "End validation is possible but wastes work on branches that were already invalid.",
        "constraints_are_duplicates": "Constraint violations and duplicate outputs are different issues.",
        "recursion_unneeded": "The solver still needs to explore alternative legal placements."
      },
      "mentalModelCorrection": "Backtracking gains power by validating partial assignments before expanding them.",
      "mistakeTypes": [
        "pruning_missed",
        "unnecessary_search_space"
      ],
      "nextAction": "Move constraint checks as close as possible to candidate selection.",
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
        "nodeId": "backtracking_placement_vs_generate_then_validate",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "pruning_missed",
        "role": "mistake_type"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_search_space",
        "role": "mistake_type"
      }
    ],
    "title": "Placement",
    "trackId": "algorithms",
    "answerFeedback": "Local constraints can prove a partial assignment impossible, which cuts off a large invalid subtree.",
    "options": [
      {
        "id": "prune_invalid_prefixes",
        "text": "Invalid partial boards can be rejected early before they expand into many impossible completions.",
        "isCorrect": true
      },
      {
        "id": "end_validation_impossible",
        "text": "A full board can never be validated after it is generated.",
        "isCorrect": false
      },
      {
        "id": "constraints_are_duplicates",
        "text": "Constraint checks are only used to remove duplicate outputs.",
        "isCorrect": false
      },
      {
        "id": "recursion_unneeded",
        "text": "Local constraints remove the need for recursion entirely.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
