import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const preprocessingAndQueriesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A fixed array receives many range-sum queries. What preprocessing signal should you recognize?",
      "mentalModelCorrection": "When many queries reuse the same array, prefix sums can move work from each query into one preparation pass.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice separating preprocessing cost from per-query cost.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_recompute": "Recomputing each range ignores that many queries reuse the same fixed array.",
        "wrong_sort": "Sorting changes order and does not directly answer original-index range sums."
      }
    },
    "id": "alg-complexity-preprocessing-queries-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the preprocessing signal.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize prefix preprocessing",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A fixed array receives many range-sum queries. What preprocessing signal should you recognize?",
    "answerFeedback": "A prefix-sum array preprocesses the fixed input once and makes each range query constant time.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Build prefix sums once, then answer each range sum from two stored totals.",
        "isCorrect": true
      },
      {
        "id": "wrong_recompute",
        "text": "Scan the requested range from scratch for every query because each query is separate.",
        "isCorrect": false
      },
      {
        "id": "wrong_sort",
        "text": "Sort the array first because sorted data is always easier to query.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "After prefix sums are built, a range-sum query asks for sum(left..right). What per-query cost should you expect?",
      "mentalModelCorrection": "A prefix-sum query uses two stored totals and constant arithmetic.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice distinguishing build cost from query cost.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_range_length": "Range length matters for recomputation, not for a prefix-sum lookup.",
        "wrong_build_again": "The prefix array is already built; do not rebuild it per query."
      }
    },
    "id": "alg-complexity-preprocessing-queries-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the per-query cost.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost one prefix query",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "After prefix sums are built, a range-sum query asks for sum(left..right). What per-query cost should you expect?",
    "answerFeedback": "Each query is O(1) after preprocessing because it reads two prefix totals.",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(1), because the query reads two prefix totals and subtracts them.",
        "isCorrect": true
      },
      {
        "id": "wrong_range_length",
        "text": "O(right - left), because every queried value must still be scanned.",
        "isCorrect": false
      },
      {
        "id": "wrong_build_again",
        "text": "O(n), because the prefix array must be rebuilt for every query.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "You build prefix sums for n values, then answer q range-sum queries. What total time signal should you name?",
      "mentalModelCorrection": "The full cost combines one O(n) build with q constant-time queries.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice writing total cost across preprocessing and query phases.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_n_only": "O(n) describes only the build, not the q query phase.",
        "wrong_nq": "O(nq) describes scanning the array for each query, not prefix queries."
      }
    },
    "id": "alg-complexity-preprocessing-queries-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the total time signal.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Combine prefix build and query cost",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "You build prefix sums for n values, then answer q range-sum queries. What total time signal should you name?",
    "answerFeedback": "Total time is O(n + q): O(n) to build and O(1) for each of q queries.",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n + q): build prefix sums once, then answer q constant-time queries.",
        "isCorrect": true
      },
      {
        "id": "wrong_n_only",
        "text": "O(n), because the preprocessing scan is the only important cost.",
        "isCorrect": false
      },
      {
        "id": "wrong_nq",
        "text": "O(nq), because every query must scan all n values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A scans each requested range. Plan B builds prefix sums once and answers each query by subtraction. q is large. Which comparison is decisive?",
      "mentalModelCorrection": "When many queries reuse the same input, preprocessing can replace repeated range scans.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice comparing per-query recomputation with reusable preprocessing.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_no_space": "Avoiding O(n) space can be worse if it causes many repeated scans.",
        "wrong_each_query_isolated": "The queries are not isolated; they reuse the same fixed array."
      }
    },
    "id": "alg-complexity-preprocessing-queries-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the decisive comparison.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Compare recomputation with prefix sums",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Plan A scans each requested range. Plan B builds prefix sums once and answers each query by subtraction. q is large. Which comparison is decisive?",
    "answerFeedback": "Prefix sums spend O(n) space and build time to avoid repeated range scans across many queries.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Plan B pays O(n) once so q queries become O(1) each, avoiding repeated range scans.",
        "isCorrect": true
      },
      {
        "id": "wrong_no_space",
        "text": "Plan A is better because it uses less memory, regardless of q.",
        "isCorrect": false
      },
      {
        "id": "wrong_each_query_isolated",
        "text": "Treat every query as unrelated, so preprocessing cannot help.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "n and q can both be 100000. A candidate scans all n values for every query. What total cost should reject it?",
      "mentalModelCorrection": "Repeated full scans create O(nq), which is too large when both dimensions are large.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice treating query count as a separate input dimension.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_single_query": "O(n) only describes one query, not q repeated queries.",
        "wrong_space": "Low extra space does not rescue repeated O(nq) time."
      }
    },
    "id": "alg-complexity-preprocessing-queries-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the rejecting total cost.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject scan per query",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "n and q can both be 100000.",
    "expectedApproachIds": [
      "combine_preprocessing_and_query_costs"
    ],
    "reasonSignal": "O(nq) is not viable when both n and q are large.",
    "rejectedApproachIds": [
      "scan_each_query"
    ],
    "instruction": "n and q can both be 100000. A candidate scans all n values for every query. What total cost should reject it?",
    "answerFeedback": "Scanning n values for each of q queries is O(nq), which fails when both are large.",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(nq), because q queries each scan n values.",
        "isCorrect": true
      },
      {
        "id": "wrong_single_query",
        "text": "O(n), because one query scans the array once.",
        "isCorrect": false
      },
      {
        "id": "wrong_space",
        "text": "O(1), because the plan does not allocate query storage.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A fixed array has one range-sum query. Which preprocessing claim should you be cautious about?",
      "mentalModelCorrection": "Preprocessing pays off mainly when the prepared state is reused across many queries.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking query count before choosing a preprocessing-heavy plan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_always_prefix": "Prefix sums are useful, but one query may not justify building a full prefix array.",
        "wrong_sort": "Sorting is unrelated to preserving original index ranges."
      }
    },
    "id": "alg-complexity-preprocessing-queries-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the cautious preprocessing claim.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Question preprocessing for one query",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A fixed array has one range-sum query. Which preprocessing claim should you be cautious about?",
    "answerFeedback": "With one query, scanning that range may be simpler than building O(n) prefix state.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Do not assume prefix preprocessing pays off when there is only one query.",
        "isCorrect": true
      },
      {
        "id": "wrong_always_prefix",
        "text": "Always build prefix sums because every range query requires preprocessing.",
        "isCorrect": false
      },
      {
        "id": "wrong_sort",
        "text": "Sort first because one query is too small for prefix sums.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A builds prefix sums in O(n), then answers one query in O(1). Plan B scans only the requested range of length k once. Which comparison is more precise?",
      "mentalModelCorrection": "For one query, compare O(n) preprocessing with the actual one-time scan length.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice comparing preprocessing cost to actual query reuse.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_query_only": "Counting only O(1) query time ignores the O(n) preprocessing.",
        "wrong_prefix_always": "Prefix sums are not automatically best when there is no reuse."
      }
    },
    "id": "alg-complexity-preprocessing-queries-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the precise comparison.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Compare one query with preprocessing",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Plan A builds prefix sums in O(n), then answers one query in O(1). Plan B scans only the requested range of length k once. Which comparison is more precise?",
    "answerFeedback": "For one query, Plan A costs O(n) total, while Plan B costs O(k) for the scanned range.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Plan A is O(n) total for one query; Plan B is O(k) for the one scanned range.",
        "isCorrect": true
      },
      {
        "id": "wrong_query_only",
        "text": "Plan A is always O(1) because the final query is constant time.",
        "isCorrect": false
      },
      {
        "id": "wrong_prefix_always",
        "text": "Plan A is always better because preprocessing is a standard optimization.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "q range queries each scan a range of length k on average. No preprocessing is used. What total cost should you expect?",
      "mentalModelCorrection": "Repeated query cost depends on query count multiplied by average range length.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice using q and range length instead of only n.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_q_only": "q counts queries, but each query still does k work.",
        "wrong_nq_always": "O(nq) is the worst case when each query scans about n values; the prompt gives average length k."
      }
    },
    "id": "alg-complexity-preprocessing-queries-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the total cost without preprocessing.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Cost repeated average-length ranges",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "q range queries each scan a range of length k on average. No preprocessing is used. What total cost should you expect?",
    "answerFeedback": "q queries times k scanned values per query gives O(q * k).",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(q * k), because each of q queries scans about k values.",
        "isCorrect": true
      },
      {
        "id": "wrong_q_only",
        "text": "O(q), because there are q queries.",
        "isCorrect": false
      },
      {
        "id": "wrong_nq_always",
        "text": "Always O(nq), even when ranges are much shorter than n.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A prefix array is built for immutable data. Later the original array changes between queries. What must you reconsider?",
      "mentalModelCorrection": "Preprocessed state is valid only while it matches the underlying data.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking whether preprocessing can be reused safely.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_reuse_blindly": "A stale prefix array can answer the wrong values after updates.",
        "wrong_no_preprocessing": "Updates do not make preprocessing impossible, but they change the maintenance cost."
      }
    },
    "id": "alg-complexity-preprocessing-queries-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose what must be reconsidered.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Check preprocessing reuse after updates",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A prefix array is built for immutable data. Later the original array changes between queries. What must you reconsider?",
    "answerFeedback": "You must account for update or rebuild cost, because the preprocessed state can become stale.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Whether the prefix state must be updated or rebuilt after data changes.",
        "isCorrect": true
      },
      {
        "id": "wrong_reuse_blindly",
        "text": "Nothing; prefix sums stay correct after any array update.",
        "isCorrect": false
      },
      {
        "id": "wrong_no_preprocessing",
        "text": "All preprocessing must be rejected whenever data can change.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Order the reasoning steps for many range-total queries on a fixed array.",
      "mentalModelCorrection": "Start with reuse, then decide whether preprocessing reduces repeated query work.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "constraint_ignored"
      ],
      "nextAction": "Practice ordering preprocessing reasoning before writing mechanics.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-preprocessing-queries-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Tap the steps in order.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order preprocessing reasoning",
    "trackId": "algorithms",
    "type": "subgoal_ordering",
    "instruction": "Order the reasoning steps for many range-total queries on a fixed array.",
    "answerFeedback": "The key sequence is reuse: fixed input, many queries, repeated recomputation cost, then preprocessing.",
    "subgoals": [
      {
        "id": "notice_fixed_input",
        "text": "Notice that all queries reuse the same fixed array."
      },
      {
        "id": "notice_many_queries",
        "text": "Notice that many range queries will arrive."
      },
      {
        "id": "estimate_recompute_cost",
        "text": "Estimate the repeated cost of scanning ranges independently."
      },
      {
        "id": "choose_preprocessing",
        "text": "Choose preprocessing if it reduces total repeated work."
      }
    ],
    "correctOrder": [
      "notice_fixed_input",
      "notice_many_queries",
      "estimate_recompute_cost",
      "choose_preprocessing"
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A teammate says the prefix-sum plan is O(1) because each query is O(1). What correction should you make?",
      "mentalModelCorrection": "Per-query cost is not the full algorithm cost; preprocessing and space must be counted too.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming build time, query time, total time, and space separately.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_query_only": "This ignores the O(n) preprocessing phase.",
        "wrong_reject": "The plan is not wrong; the explanation is incomplete."
      }
    },
    "id": "alg-complexity-preprocessing-queries-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the best correction.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Correct query-only complexity claim",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A teammate says the prefix-sum plan is O(1) because each query is O(1). What correction should you make?",
    "answerFeedback": "Prefix sums have O(n) preprocessing and O(n) space, even though each query is O(1).",
    "options": [
      {
        "id": "expected_signal",
        "text": "Say each query is O(1), but the full plan also has O(n) preprocessing and O(n) space.",
        "isCorrect": true
      },
      {
        "id": "wrong_query_only",
        "text": "Agree that the whole plan is O(1) because query time is the only cost.",
        "isCorrect": false
      },
      {
        "id": "wrong_reject",
        "text": "Reject prefix sums because any preprocessing makes the plan worse.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A fixed array receives many queries asking for the minimum value in a range. Which warning should you notice before applying prefix sums?",
      "mentalModelCorrection": "Prefix sums work for additive totals; not every range query has the same preprocessing structure.",
      "mistakeTypes": [
        "data_structure_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking whether the operation matches the preprocessing structure.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_prefix_all": "Prefix sums do not directly answer arbitrary range minimum queries.",
        "wrong_scan_only": "Many queries may still justify preprocessing, but not necessarily prefix sums."
      }
    },
    "id": "alg-complexity-preprocessing-queries-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the warning.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Do not overgeneralize prefix sums",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A fixed array receives many queries asking for the minimum value in a range. Which warning should you notice before applying prefix sums?",
    "answerFeedback": "Prefix sums support additive range totals, not arbitrary range minimum queries.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Prefix sums fit additive totals, not arbitrary range minimum queries.",
        "isCorrect": true
      },
      {
        "id": "wrong_prefix_all",
        "text": "Prefix sums answer every type of range query after O(n) preprocessing.",
        "isCorrect": false
      },
      {
        "id": "wrong_scan_only",
        "text": "No preprocessing can ever help range minimum queries.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A fixed array has n values and q range-total queries. Which answer correctly separates the phases?",
      "mentalModelCorrection": "A good complexity answer names preprocessing, per-query work, total time, and extra space separately.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice giving complete multi-phase complexity contracts.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_query_only": "This omits preprocessing and space.",
        "wrong_scan_each": "This describes recomputation, not the prefix-sum plan."
      }
    },
    "id": "alg-complexity-preprocessing-queries-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "Choose the complete phase-separated answer.",
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
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Separate preprocessing query total and space",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A fixed array has n values and q range-total queries. Which answer correctly separates the phases?",
    "answerFeedback": "The complete prefix-sum contract is O(n) build, O(1) per query, O(n + q) total time, and O(n) extra space.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Preprocess O(n), query O(1), total O(n + q), extra space O(n).",
        "isCorrect": true
      },
      {
        "id": "wrong_query_only",
        "text": "The algorithm is simply O(1), because each query is O(1).",
        "isCorrect": false
      },
      {
        "id": "wrong_scan_each",
        "text": "Preprocess O(1), query O(n), total O(nq), extra space O(1).",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
