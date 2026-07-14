import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const hiddenOperationCostQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A loop visits n strings, and for each string it calls hasDigit(s), which scans that string. What cost signal is easy to miss?",
      "mentalModelCorrection": "The outer loop count is not enough; the helper scans characters inside each string.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice counting both the number of strings and the total characters scanned.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_outer_only": "The outer loop is one pass over strings, but the helper does additional work inside each iteration.",
        "wrong_constant_helper": "A helper is not automatically constant time; its body scans the current string."
      }
    },
    "id": "alg-complexity-hidden-cost-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the hidden cost signal.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "multi_input_dimension_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Notice helper scan inside loop",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A loop visits n strings, and for each string it calls hasDigit(s), which scans that string. What cost signal is easy to miss?",
    "answerFeedback": "The hidden cost is the character scan inside hasDigit(s), so total work depends on total string length, not only n.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The helper scans characters, so total work depends on all characters processed, not only the number of strings.",
        "isCorrect": true
      },
      {
        "id": "wrong_outer_only",
        "text": "The routine is O(n) because there is one visible loop over strings.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant_helper",
        "text": "The helper is constant time because it is written as a separate function.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "complexityExplanation": "The outer loop runs for n strings, and each helper call can scan up to m characters. Only counters and flags are stored.",
    "feedbackModel": {
      "decisionSignal": "A loop processes n strings. Each string has length at most m, and the loop body scans the whole current string. What time and extra space should you expect?",
      "mentalModelCorrection": "When the loop body scans a string, the total cost includes both n and m.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice naming a second input dimension when each item has internal size.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_outer_only": "Counting only the visible outer loop misses input-growing work inside the loop body.",
        "wrong_constant_builtin": "A helper or built-in call can still scan, copy, sort, or allocate input-growing data."
      }
    },
    "id": "alg-complexity-hidden-cost-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the correct cost reasoning.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "multi_input_dimension_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost loop over strings with inner scan",
    "trackId": "algorithms",
    "type": "complexity_reasoning",
    "instruction": "A loop processes n strings. Each string has length at most m, and the loop body scans the whole current string. What time and extra space should you expect?",
    "answerFeedback": "The loop can scan up to m characters for each of n strings, while storing only fixed state.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The outer loop runs for n strings and each body scan can inspect up to m characters, so include both dimensions in the total cost.",
        "isCorrect": true
      },
      {
        "id": "wrong_outer_only",
        "text": "O(n), because only the outer loop or top-level expression should be counted.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant_builtin",
        "text": "O(1), because the operation is written as one helper or built-in call.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A routine loops over log lines and calls parseFields(line), which scans the full line. Some lines are much longer than others. Which input dimension should be named?",
      "mentalModelCorrection": "Use total characters when item sizes vary; n alone hides the real scan cost.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice using total input size when records have variable length.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_line_count": "Line count alone ignores that each line can have a different length.",
        "wrong_max_only": "Maximum length can form a bound, but the more precise signal is total characters scanned."
      }
    },
    "id": "alg-complexity-hidden-cost-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the input dimension that should be named.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "multi_input_dimension_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Use total characters for variable lines",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A routine loops over log lines and calls parseFields(line), which scans the full line. Some lines are much longer than others. Which input dimension should be named?",
    "answerFeedback": "The hidden dimension is total characters across all lines.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Total characters across all lines, because each line is scanned.",
        "isCorrect": true
      },
      {
        "id": "wrong_line_count",
        "text": "Only the number of lines, because the code has one loop over lines.",
        "isCorrect": false
      },
      {
        "id": "wrong_max_only",
        "text": "Only the longest line, because shorter lines do not affect total work.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A loop over n words calls word.toLowerCase() and then scans the lowercase copy. What cost should not be treated as free?",
      "mentalModelCorrection": "Creating and scanning a transformed string both depend on word length.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice noticing string transformation cost inside loop bodies.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_free_transform": "String conversion usually creates or processes characters; it is not free.",
        "wrong_outer_only": "The outer loop count does not include the character work inside each iteration."
      }
    },
    "id": "alg-complexity-hidden-cost-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the cost that should not be treated as free.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Count string normalization inside loop",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A loop over n words calls word.toLowerCase() and then scans the lowercase copy. What cost should not be treated as free?",
    "answerFeedback": "Lowercasing and scanning both process characters, so the body cost depends on word length.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The character work from creating and scanning the lowercase string.",
        "isCorrect": true
      },
      {
        "id": "wrong_free_transform",
        "text": "String conversion is metadata-only and should be ignored.",
        "isCorrect": false
      },
      {
        "id": "wrong_outer_only",
        "text": "Only the n word iterations matter because the loop body is one line.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A single visible loop repeatedly builds prefix = text.slice(0, i). Why is calling the loop O(n) suspicious?",
      "mentalModelCorrection": "The body copies more characters as i grows, so total copied characters can be quadratic.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice looking for copying work hidden behind slice/substr operations.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_visible_loop": "One visible loop is not enough if the loop body copies a growing prefix.",
        "wrong_constant_slice": "Slice is not constant when it copies a substring proportional to its length."
      }
    },
    "id": "alg-complexity-hidden-cost-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose why the O(n) claim is suspicious.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Question single-loop slice claim",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A single visible loop repeatedly builds prefix = text.slice(0, i). Why is calling the loop O(n) suspicious?",
    "answerFeedback": "Each slice can copy i characters, so total copied characters grow quadratically.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The slice copies a growing number of characters inside the loop.",
        "isCorrect": true
      },
      {
        "id": "wrong_visible_loop",
        "text": "It is definitely O(n) because there is only one visible loop.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant_slice",
        "text": "It is O(n) because slice only changes indexes and never copies.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A loop over n arrays calls copyOf(currentArray) each time. Each currentArray can have length k. What hidden cost should be counted?",
      "mentalModelCorrection": "Copying an array is proportional to the number of copied elements.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice multiplying outer iterations by copied item count.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_reference_only": "The prompt says copy, not reference assignment.",
        "wrong_outer_only": "The outer loop is not the full cost because each body copies k elements."
      }
    },
    "id": "alg-complexity-hidden-cost-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the hidden operation cost.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Count array copy inside loop",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A loop over n arrays calls copyOf(currentArray) each time. Each currentArray can have length k. What hidden cost should be counted?",
    "answerFeedback": "The hidden cost is copying k elements inside each of n iterations.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Copying k elements inside each loop iteration.",
        "isCorrect": true
      },
      {
        "id": "wrong_reference_only",
        "text": "Only assigning one reference inside each iteration.",
        "isCorrect": false
      },
      {
        "id": "wrong_outer_only",
        "text": "Only the n outer iterations, because copying is a helper call.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "complexityExplanation": "The outer loop runs n times, and each filter can scan up to k items and create a filtered intermediate collection.",
    "feedbackModel": {
      "decisionSignal": "A loop runs n times. In each iteration it calls items.filter(predicate) on a list of length k. What time and extra space should you expect?",
      "mentalModelCorrection": "filter is a scan over the list and can allocate a result collection.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice counting higher-order collection operations inside loops.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_outer_only": "Counting only the visible outer loop misses input-growing work inside the loop body.",
        "wrong_constant_builtin": "A helper or built-in call can still scan, copy, sort, or allocate input-growing data."
      }
    },
    "id": "alg-complexity-hidden-cost-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the correct cost reasoning.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost filter inside loop",
    "trackId": "algorithms",
    "type": "complexity_reasoning",
    "instruction": "A loop runs n times. In each iteration it calls items.filter(predicate) on a list of length k. What time and extra space should you expect?",
    "answerFeedback": "Each filter scans k items, and the largest filtered result can hold up to k items.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The loop runs n times and each filter can scan k items, so the repeated filter work dominates.",
        "isCorrect": true
      },
      {
        "id": "wrong_outer_only",
        "text": "O(n), because only the outer loop or top-level expression should be counted.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant_builtin",
        "text": "O(1), because the operation is written as one helper or built-in call.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A visible loop over users calls transactions.map(...) inside each iteration. Each user can have k transactions. What should you check before calling the routine O(n)?",
      "mentalModelCorrection": "A map over k transactions is repeated inside the outer user loop.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice treating map/filter/reduce as loops when they appear inside another loop.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_map_constant": "map is a traversal over the collection, not a constant-time expression.",
        "wrong_one_loop": "Higher-order calls can hide loops even when the code shows one explicit loop."
      }
    },
    "id": "alg-complexity-hidden-cost-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose what must be checked.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Notice map traversal inside loop",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A visible loop over users calls transactions.map(...) inside each iteration. Each user can have k transactions. What should you check before calling the routine O(n)?",
    "answerFeedback": "Check the map cost over k transactions inside each outer iteration.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Whether the map traverses k transactions inside each user iteration.",
        "isCorrect": true
      },
      {
        "id": "wrong_map_constant",
        "text": "Nothing; map is a single expression, so it is constant time.",
        "isCorrect": false
      },
      {
        "id": "wrong_one_loop",
        "text": "Only the explicit user loop matters because no inner loop is written.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "complexityExplanation": "The outer loop runs n times, and each reduce scans k values. If the reducer stores only a scalar total, extra space stays constant.",
    "feedbackModel": {
      "decisionSignal": "A loop over n accounts calls reduce over k balances for each account and stores only the total. What time and extra space should you expect?",
      "mentalModelCorrection": "reduce still scans its input collection; the scalar result does not remove the traversal cost.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice counting reduce as a traversal even when it returns one value.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_outer_only": "Counting only the visible outer loop misses input-growing work inside the loop body.",
        "wrong_constant_builtin": "A helper or built-in call can still scan, copy, sort, or allocate input-growing data."
      }
    },
    "id": "alg-complexity-hidden-cost-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the correct cost reasoning.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost reduce inside outer loop",
    "trackId": "algorithms",
    "type": "complexity_reasoning",
    "instruction": "A loop over n accounts calls reduce over k balances for each account and stores only the total. What time and extra space should you expect?",
    "answerFeedback": "Each reduce scans k balances, and only one total is stored at a time.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The outer loop runs n times and each reduce scans k balances, while only a scalar total is stored.",
        "isCorrect": true
      },
      {
        "id": "wrong_outer_only",
        "text": "O(n), because only the outer loop or top-level expression should be counted.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant_builtin",
        "text": "O(1), because the operation is written as one helper or built-in call.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "complexityExplanation": "The outer loop runs n times, and each iteration sorts a group of size k. Sorting a copied group can also use O(k) extra space.",
    "feedbackModel": {
      "decisionSignal": "A loop processes n groups. For each group, it sorts a copied list of k items. What time and extra space should you expect?",
      "mentalModelCorrection": "Sorting inside an outer loop multiplies the sort cost by the number of groups.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice counting repeated sorting, not only the outer loop.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_outer_only": "Counting only the visible outer loop misses input-growing work inside the loop body.",
        "wrong_constant_builtin": "A helper or built-in call can still scan, copy, sort, or allocate input-growing data."
      }
    },
    "id": "alg-complexity-hidden-cost-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the correct cost reasoning.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost sorting each group",
    "trackId": "algorithms",
    "type": "complexity_reasoning",
    "instruction": "A loop processes n groups. For each group, it sorts a copied list of k items. What time and extra space should you expect?",
    "answerFeedback": "Each of n groups sorts k items, and the copied group can use O(k) extra space.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Sorting happens inside the outer loop, so the per-group sort cost is repeated for each group.",
        "isCorrect": true
      },
      {
        "id": "wrong_outer_only",
        "text": "O(n), because only the outer loop or top-level expression should be counted.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant_builtin",
        "text": "O(1), because the operation is written as one helper or built-in call.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A function loops over n records and calls sortTags(record.tags) inside the loop. Each tag list can have length k. What makes O(n) the wrong default?",
      "mentalModelCorrection": "The loop body sorts k tags, so each iteration has more than constant work.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice identifying sorting hidden behind helper names.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_helper_name": "A helper name does not make the work constant; its implementation matters.",
        "wrong_record_count": "Record count is only the outer dimension; tag sorting adds another cost."
      }
    },
    "id": "alg-complexity-hidden-cost-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose why O(n) is the wrong default.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Notice sorting hidden in helper",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A function loops over n records and calls sortTags(record.tags) inside the loop. Each tag list can have length k. What makes O(n) the wrong default?",
    "answerFeedback": "sortTags can cost O(k log k) per record, so the loop body is not constant.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The helper sorts k tags inside each record iteration.",
        "isCorrect": true
      },
      {
        "id": "wrong_helper_name",
        "text": "Nothing; helper calls are treated as constant unless they are written inline.",
        "isCorrect": false
      },
      {
        "id": "wrong_record_count",
        "text": "Only n records matter because tags belong to the records.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A routine loops over n items and calls findMatch(items, item) inside each iteration. findMatch scans the full items array. Which growth signal should you name?",
      "mentalModelCorrection": "A full scan hidden inside each outer iteration creates quadratic work.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice identifying nested work hidden behind search helpers.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_one_loop": "The helper call hides a full scan, so the routine is not just one pass.",
        "wrong_constant_find": "findMatch is not constant if it scans the full array."
      }
    },
    "id": "alg-complexity-hidden-cost-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the growth signal.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Identify hidden full-array search",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A routine loops over n items and calls findMatch(items, item) inside each iteration. findMatch scans the full items array. Which growth signal should you name?",
    "answerFeedback": "The hidden full scan inside each outer iteration creates O(n^2) time.",
    "options": [
      {
        "id": "expected_signal",
        "text": "A hidden nested scan: n outer iterations times an O(n) helper scan.",
        "isCorrect": true
      },
      {
        "id": "wrong_one_loop",
        "text": "A single-pass scan, because only one loop is visible at the call site.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant_find",
        "text": "Constant-time lookup, because findMatch returns only one item.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A review sees only one explicit for-loop, but the loop body calls isUniqueSoFar(prefix), which scans the prefix. What review comment is most accurate?",
      "mentalModelCorrection": "The visible structure hides a growing scan in the helper.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice reviewing helper cost before accepting a linear-time claim.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_linear_claim": "A single explicit loop is not sufficient evidence for O(n).",
        "wrong_ignore_prefix": "The prefix length grows, so the helper cost grows too."
      }
    },
    "id": "alg-complexity-hidden-cost-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the most accurate review comment.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Review growing-prefix helper",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A review sees only one explicit for-loop, but the loop body calls isUniqueSoFar(prefix), which scans the prefix. What review comment is most accurate?",
    "answerFeedback": "The helper scans a growing prefix, so the total work may be quadratic.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Check the helper: scanning a growing prefix can make the total work O(n^2).",
        "isCorrect": true
      },
      {
        "id": "wrong_linear_claim",
        "text": "Accept O(n) because only one loop is visible in the caller.",
        "isCorrect": false
      },
      {
        "id": "wrong_ignore_prefix",
        "text": "Ignore the prefix length because helper names are not part of complexity.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A loop over n items calls binarySearch(sortedItems, target) each time. sortedItems has n values. What should you count inside the loop body?",
      "mentalModelCorrection": "Binary search is not constant; it contributes O(log n) work per outer iteration.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice multiplying outer iterations by logarithmic helper cost.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_constant": "Binary search is faster than a scan, but it is not O(1).",
        "wrong_linear_helper": "Binary search halves the range, so each helper call is O(log n), not O(n)."
      }
    },
    "id": "alg-complexity-hidden-cost-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the loop-body cost.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Count binary search inside loop",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A loop over n items calls binarySearch(sortedItems, target) each time. sortedItems has n values. What should you count inside the loop body?",
    "answerFeedback": "Each binary search costs O(log n), so n calls produce O(n log n) time.",
    "options": [
      {
        "id": "expected_signal",
        "text": "An O(log n) helper call inside each of n iterations.",
        "isCorrect": true
      },
      {
        "id": "wrong_constant",
        "text": "A constant-time helper call because binary search is fast.",
        "isCorrect": false
      },
      {
        "id": "wrong_linear_helper",
        "text": "An O(n) helper call because all searches over arrays are linear.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A loop over n items calls set.has(item) on a hash set. What makes this different from calling array.includes(item)?",
      "mentalModelCorrection": "The hidden cost depends on the operation: expected O(1) hash lookup differs from O(n) array scan.",
      "mistakeTypes": [
        "complexity_mismatch",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice checking the cost of the specific membership operation used.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_same": "Both are membership checks, but they do not have the same expected cost.",
        "wrong_names": "The operation's data structure matters more than the method name alone."
      }
    },
    "id": "alg-complexity-hidden-cost-019-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the operation-cost difference.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Compare hidden membership operation cost",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A loop over n items calls set.has(item) on a hash set. What makes this different from calling array.includes(item)?",
    "answerFeedback": "Hash set membership is expected O(1), while array includes scans and can be O(n).",
    "options": [
      {
        "id": "expected_signal",
        "text": "set.has is expected O(1), while array.includes may scan the array.",
        "isCorrect": true
      },
      {
        "id": "wrong_same",
        "text": "They are the same because both ask whether an item exists.",
        "isCorrect": false
      },
      {
        "id": "wrong_names",
        "text": "The method with the shorter name is usually faster.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A loop over n records calls JSON.stringify(record) to create a comparison key. Each record can contain k fields. What hidden dimension should be counted?",
      "mentalModelCorrection": "Serialization walks the record contents, so the loop body is proportional to record size.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice counting serialization or formatting work inside loops.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_constant": "Serialization is not constant when record size varies.",
        "wrong_records_only": "The number of records is only one dimension; each record has internal size."
      }
    },
    "id": "alg-complexity-hidden-cost-021-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the hidden input dimension.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Count serialization inside loop",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A loop over n records calls JSON.stringify(record) to create a comparison key. Each record can contain k fields. What hidden dimension should be counted?",
    "answerFeedback": "The hidden dimension is the size of each record, such as k fields or total serialized content.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The record size, because serialization walks the record contents.",
        "isCorrect": true
      },
      {
        "id": "wrong_constant",
        "text": "No hidden dimension; stringify is one function call, so it is constant.",
        "isCorrect": false
      },
      {
        "id": "wrong_records_only",
        "text": "Only n records matter because each record is one item.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the steps for reviewing complexity when a loop body calls a helper.",
      "mentalModelCorrection": "First count outer iterations, then inspect helper cost, then multiply or sum the repeated work.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "complexity_mismatch"
      ],
      "nextAction": "Practice expanding helper calls before naming Big-O.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-hidden-cost-022-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Tap the review steps in order.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order hidden helper cost review",
    "trackId": "algorithms",
    "type": "subgoal_ordering",
    "instruction": "Order the steps for reviewing complexity when a loop body calls a helper.",
    "answerFeedback": "Do not stop at the outer loop. Inspect the helper and combine its cost with the number of calls.",
    "subgoals": [
      {
        "id": "count_outer_iterations",
        "text": "Count how many times the helper is called."
      },
      {
        "id": "inspect_helper_body",
        "text": "Inspect whether the helper scans, copies, sorts, or allocates."
      },
      {
        "id": "estimate_helper_cost",
        "text": "Estimate the helper cost in terms of input size."
      },
      {
        "id": "combine_repeated_work",
        "text": "Combine the helper cost with the number of calls."
      }
    ],
    "correctOrder": [
      "count_outer_iterations",
      "inspect_helper_body",
      "estimate_helper_cost",
      "combine_repeated_work"
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The input has up to 100000 strings. A candidate compares each string with every later string. Which signal rejects the plan before string details?",
      "mentalModelCorrection": "The pair count alone is already too large; string comparison cost would only add more work.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice rejecting infeasible pair counts before analyzing deeper operation costs.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_string_length": "String length may add hidden cost, but the pair count already rejects the plan.",
        "wrong_sorting": "Sorting is not described by the candidate plan; the immediate problem is pair enumeration."
      }
    },
    "id": "alg-complexity-constraint-first-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the rejecting signal.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "multi_input_dimension_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject pair count before string cost",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "The input has up to 100000 strings. A candidate compares each string with every later string. Which signal rejects the plan before string details?",
    "answerFeedback": "Comparing every pair of 100000 strings is already O(n^2), before counting the cost of each string comparison.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The O(n^2) number of string pairs already violates the input limit.",
        "isCorrect": true
      },
      {
        "id": "wrong_string_length",
        "text": "Only the maximum string length matters; the number of pairs can be ignored.",
        "isCorrect": false
      },
      {
        "id": "wrong_sorting",
        "text": "The plan should be accepted because strings can usually be sorted.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine does arr.filter(...).map(...).reduce(...) over the same n-item array. What cost signal should you name?",
      "mentalModelCorrection": "Count each array method pass, then combine sequential passes by addition.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_cubed": "Sequential passes add to O(3n), which simplifies to O(n).",
        "wrong_constant": "A compact expression can still scan the collection."
      }
    },
    "id": "alg-complexity-hidden-cost-023-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the correct complexity reasoning.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost chained array methods",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A routine does arr.filter(...).map(...).reduce(...) over the same n-item array. What cost signal should you name?",
    "answerFeedback": "Count each array method pass, then combine sequential passes by addition.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The operations are sequential passes over n items, so the total is still O(n), not O(n^3).",
        "isCorrect": true
      },
      {
        "id": "wrong_cubed",
        "text": "It is O(n^3), because there are three collection methods.",
        "isCorrect": false
      },
      {
        "id": "wrong_constant",
        "text": "It is O(1), because each method is one expression.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine maps over n values and, inside the callback, calls otherValues.includes(value), where otherValues can also have n values. What time signal should you name?",
      "mentalModelCorrection": "The hidden includes scan sits inside the map callback, making nested work.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_map_only": "The callback work is not constant when includes can scan another n values.",
        "wrong_builtin_constant": "Array includes can scan through the array."
      }
    },
    "id": "alg-complexity-hidden-cost-024-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the correct complexity reasoning.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "hidden_operation_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost map with includes",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A routine maps over n values and, inside the callback, calls otherValues.includes(value), where otherValues can also have n values. What time signal should you name?",
    "answerFeedback": "The hidden includes scan sits inside the map callback, making nested work.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The map runs n times and each includes can scan n values, so the total time can be O(n^2).",
        "isCorrect": true
      },
      {
        "id": "wrong_map_only",
        "text": "O(n), because map is one pass.",
        "isCorrect": false
      },
      {
        "id": "wrong_builtin_constant",
        "text": "O(1), because includes is a built-in membership operation.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A list of n strings is sorted, and comparing two strings can inspect up to m characters. What hidden cost should be included?",
      "mentalModelCorrection": "Include comparator cost when sorting values whose comparison is not constant-time.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_sort_only": "String comparison can inspect characters until it finds a difference or reaches the end.",
        "wrong_m_only": "The sort performs many comparisons, not just one."
      }
    },
    "id": "alg-complexity-hidden-cost-025-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "Choose the correct complexity reasoning.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "multi_input_dimension_cost",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost string comparator sort",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A list of n strings is sorted, and comparing two strings can inspect up to m characters. What hidden cost should be included?",
    "answerFeedback": "Include comparator cost when sorting values whose comparison is not constant-time.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The sort does O(n log n) comparisons, and each comparison can cost O(m), so the character cost can make it O(n log n * m).",
        "isCorrect": true
      },
      {
        "id": "wrong_sort_only",
        "text": "Only O(n log n), because string comparison is always constant.",
        "isCorrect": false
      },
      {
        "id": "wrong_m_only",
        "text": "Only O(m), because comparing strings is the only operation.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
