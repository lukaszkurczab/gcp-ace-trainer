export const constraintFirstRejectionQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "n can be 100000, and a candidate plan compares every pair of values. What should you decide first?",
      "mentalModelCorrection": "At this input size, pair enumeration is too expensive before implementation details matter.",
      "mistakeTypes": [
        "brute_force_when_optimized_required",
        "constraint_ignored"
      ],
      "nextAction": "Practice using the input limit before comparing code simplicity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_short_code": "Short code does not make O(n^2) viable when n can be 100000.",
        "wrong_values": "The value range may matter for some strategies, but the first signal here is the number of pair checks."
      }
    },
    "id": "alg-complexity-constraint-first-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "n can be 100000, and a candidate plan compares every pair of values. What should you decide first?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "O(n^2) pair enumeration is not viable for n near 100000.",
        "id": "alg-complexity-constraint-first-001-check",
        "mistakeTypes": [
          "brute_force_when_optimized_required",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Reject the pair-enumeration plan because O(n^2) is too large for n near 100000."
          },
          {
            "id": "wrong_short_code",
            "text": "Prefer the pair-enumeration plan because it is usually the shortest code."
          },
          {
            "id": "wrong_values",
            "text": "Ignore n first and focus on whether the input values are positive or negative."
          }
        ],
        "prompt": "Choose the first strategy decision.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject pair enumeration at 100000",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "n can be 100000, and a candidate plan compares every pair of values.",
    "expectedApproachIds": [
      "apply_input_constraints"
    ],
    "reasonSignal": "Reject the pair-enumeration plan because O(n^2) is too large for n near 100000.",
    "rejectedApproachIds": [
      "brute_force_pair_enumeration"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "Reject the pair-enumeration plan because O(n^2) is too large for n near 100000."
        },
        {
          "id": "wrong_short_code",
          "text": "Prefer the pair-enumeration plan because it is usually the shortest code."
        },
        {
          "id": "wrong_values",
          "text": "Ignore n first and focus on whether the input values are positive or negative."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A teammate says, \"Let's write the double loop first, then check if it passes.\" n can be 100000. What is the reasoning mistake?",
      "mentalModelCorrection": "The constraint should rule out the growth class before implementation starts.",
      "mistakeTypes": [
        "constraint_reasoning_missed",
        "constraint_ignored",
        "brute_force_when_optimized_required"
      ],
      "nextAction": "Practice using constraints as the first filter for candidate strategies.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_style": "The main issue is not style; it is choosing an infeasible growth class.",
        "wrong_memory": "The prompt gives a time-scale problem, not a memory-limit problem."
      }
    },
    "id": "alg-complexity-constraint-first-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A teammate says, \"Let's write the double loop first, then check if it passes.\" n can be 100000. What is the reasoning mistake?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The mistake is implementation-first reasoning; the input limit already rejects the double loop.",
        "id": "alg-complexity-constraint-first-003-check",
        "mistakeTypes": [
          "constraint_reasoning_missed",
          "constraint_ignored",
          "brute_force_when_optimized_required"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "They are treating the constraint as a later validation step instead of using it to reject O(n^2) first."
          },
          {
            "id": "wrong_style",
            "text": "They are mainly choosing a style that will be harder to read."
          },
          {
            "id": "wrong_memory",
            "text": "They are mainly ignoring that the double loop always uses O(n) extra memory."
          }
        ],
        "prompt": "Choose the reasoning mistake.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Catch implementation-first constraint use",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Plan A compares every pair. Plan B scans once and keeps lookup state. n can be 100000. Which comparison should drive the choice?",
      "mentalModelCorrection": "The input limit makes growth rate decisive: O(n) with state is viable where O(n^2) pair checks are not.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice comparing candidate strategies by growth under the given constraint.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_memory": "Lower memory is not enough if the time growth is infeasible.",
        "wrong_lines": "Code length is not the deciding signal when the constraint rules out one growth class."
      }
    },
    "id": "alg-complexity-constraint-first-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "Plan A compares every pair. Plan B scans once and keeps lookup state. n can be 100000. Which comparison should drive the choice?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "For n = 100000, linear time with lookup state is the viable scaling direction; quadratic pair checks are not.",
        "id": "alg-complexity-constraint-first-004-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Plan B trades memory for O(n) time, while Plan A's O(n^2) pair checks do not fit the input limit."
          },
          {
            "id": "wrong_memory",
            "text": "Plan A is better because it avoids lookup memory, regardless of the input limit."
          },
          {
            "id": "wrong_lines",
            "text": "Choose whichever plan has fewer lines of code before estimating growth."
          }
        ],
        "prompt": "Choose the decisive comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Choose viable growth under large n",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "input limit",
        "time growth",
        "state tradeoff"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Plan B trades memory for O(n) time, while Plan A's O(n^2) pair checks do not fit the input limit."
        },
        {
          "id": "wrong_memory",
          "text": "Plan A is better because it avoids lookup memory, regardless of the input limit."
        },
        {
          "id": "wrong_lines",
          "text": "Choose whichever plan has fewer lines of code before estimating growth."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "n is at most 40, and a simple plan checks every pair once. What does the constraint suggest?",
      "mentalModelCorrection": "Small input limits can make brute force acceptable; constraints do not always reject nested loops.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice using the specific limit instead of applying a blanket rule against brute force.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_always_reject": "O(n^2) is not automatically unacceptable; n = 40 is a small bound.",
        "wrong_ignore_limit": "The limit is the key signal for deciding whether this brute force is acceptable."
      }
    },
    "id": "alg-complexity-constraint-first-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "n is at most 40, and a simple plan checks every pair once. What does the constraint suggest?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "With n capped at 40, O(n^2) pair enumeration may be acceptable.",
        "id": "alg-complexity-constraint-first-005-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The small bound means a pair-enumeration plan may be acceptable."
          },
          {
            "id": "wrong_always_reject",
            "text": "Reject the plan automatically because any nested loop is always infeasible."
          },
          {
            "id": "wrong_ignore_limit",
            "text": "Ignore the input limit and choose only by the data structure names."
          }
        ],
        "prompt": "Choose the constraint-based interpretation.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Allow brute force for tiny n",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "brute_force_pair_enumeration"
    ],
    "constraintSignal": "n is at most 40.",
    "expectedApproachIds": [
      "apply_input_constraints"
    ],
    "reasonSignal": "The small bound means a pair-enumeration plan may be acceptable.",
    "rejectedApproachIds": [
      "reject_brute_force_without_checking_limit"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "The small bound means a pair-enumeration plan may be acceptable."
        },
        {
          "id": "wrong_always_reject",
          "text": "Reject the plan automatically because any nested loop is always infeasible."
        },
        {
          "id": "wrong_ignore_limit",
          "text": "Ignore the input limit and choose only by the data structure names."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The same pair-checking approach is considered for two tasks: one has n <= 30, the other has n <= 200000. What should change?",
      "mentalModelCorrection": "The strategy decision changes with the input limit; the same O(n^2) plan can be acceptable for tiny n and infeasible for large n.",
      "mistakeTypes": [
        "constraint_ignored",
        "cannot_explain_why"
      ],
      "nextAction": "Practice making strategy decisions conditional on the actual constraint.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_same": "The same algorithmic idea does not have the same viability under very different bounds.",
        "wrong_syntax": "The syntax of the loop is not the deciding factor; the bound is."
      }
    },
    "id": "alg-complexity-constraint-first-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "The same pair-checking approach is considered for two tasks: one has n <= 30, the other has n <= 200000. What should change?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The pair-checking plan may be acceptable at n <= 30 but should be rejected at n <= 200000.",
        "id": "alg-complexity-constraint-first-006-check",
        "mistakeTypes": [
          "constraint_ignored",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The viability changes: O(n^2) may fit n <= 30 but not n <= 200000."
          },
          {
            "id": "wrong_same",
            "text": "The viability is the same because both tasks compare pairs."
          },
          {
            "id": "wrong_syntax",
            "text": "The decision should depend mainly on whether the loops are written compactly."
          }
        ],
        "prompt": "Choose the constraint-aware comparison.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Compare brute force across bounds",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "input bound",
        "growth class",
        "viability"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "The viability changes: O(n^2) may fit n <= 30 but not n <= 200000."
        },
        {
          "id": "wrong_same",
          "text": "The viability is the same because both tasks compare pairs."
        },
        {
          "id": "wrong_syntax",
          "text": "The decision should depend mainly on whether the loops are written compactly."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "n can be 200000. Plan A sorts once and scans. Plan B checks every pair without sorting. Which strategy signal matters first?",
      "mentalModelCorrection": "O(n log n) is usually a viable candidate at this scale; O(n^2) pair enumeration is not.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice comparing O(n log n) and O(n^2) under large input constraints.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_no_sort": "Avoiding sorting is not automatically better if the alternative is quadratic.",
        "wrong_same": "Both plans inspect input values, but their growth rates are not the same."
      }
    },
    "id": "alg-complexity-constraint-first-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "n can be 200000. Plan A sorts once and scans. Plan B checks every pair without sorting. Which strategy signal matters first?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Sorting once and scanning is O(n log n), while pair enumeration is O(n^2).",
        "id": "alg-complexity-constraint-first-009-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Plan A has O(n log n) growth, while Plan B has O(n^2) growth that does not fit the large n."
          },
          {
            "id": "wrong_no_sort",
            "text": "Plan B is better because it avoids the cost of sorting."
          },
          {
            "id": "wrong_same",
            "text": "Both plans scale the same because both compare values."
          }
        ],
        "prompt": "Choose the strategy signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Prefer sort-scan over pair checks at scale",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "input limit",
        "growth class",
        "candidate viability"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Plan A has O(n log n) growth, while Plan B has O(n^2) growth that does not fit the large n."
        },
        {
          "id": "wrong_no_sort",
          "text": "Plan B is better because it avoids the cost of sorting."
        },
        {
          "id": "wrong_same",
          "text": "Both plans scale the same because both compare values."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task has n <= 100000 and asks for a repeated membership decision. Which candidate should survive the first constraint check?",
      "mentalModelCorrection": "A one-pass lookup plan is a better scaling candidate than scanning previous values for each item.",
      "mistakeTypes": [
        "constraint_ignored",
        "brute_force_when_optimized_required",
        "data_structure_mismatch"
      ],
      "nextAction": "Practice matching repeated membership to a lookup plan under a large n constraint.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_previous_scan": "Scanning previous values for each item becomes quadratic.",
        "wrong_pair": "Pair enumeration solves too broad a problem and violates the input-size constraint."
      }
    },
    "id": "alg-complexity-constraint-first-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A task has n <= 100000 and asks for a repeated membership decision. Which candidate should survive the first constraint check?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "For repeated membership at large n, one pass with lookup state is the viable candidate.",
        "id": "alg-complexity-constraint-first-010-check",
        "mistakeTypes": [
          "constraint_ignored",
          "brute_force_when_optimized_required",
          "data_structure_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "A one-pass scan with lookup state, because it avoids repeated scans."
          },
          {
            "id": "wrong_previous_scan",
            "text": "For each item, scan all previous items to avoid using memory."
          },
          {
            "id": "wrong_pair",
            "text": "Compare all pairs because membership is about relationships between values."
          }
        ],
        "prompt": "Choose the viable candidate.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Keep lookup plan under large n",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [
      "one_pass_lookup_state"
    ],
    "constraintSignal": "n <= 100000 and the repeated operation is membership.",
    "expectedApproachIds": [
      "apply_input_constraints"
    ],
    "reasonSignal": "A one-pass scan with lookup state avoids repeated scans under the large input limit.",
    "rejectedApproachIds": [
      "repeated_previous_scan",
      "brute_force_pair_enumeration"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "A one-pass scan with lookup state, because it avoids repeated scans."
        },
        {
          "id": "wrong_previous_scan",
          "text": "For each item, scan all previous items to avoid using memory."
        },
        {
          "id": "wrong_pair",
          "text": "Compare all pairs because membership is about relationships between values."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A brute force plan would do about n^2 checks. n can be 100000. Which rough scale explains the rejection?",
      "mentalModelCorrection": "The constraint implies an enormous operation count; the exact constant is less important than the quadratic growth.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice using rough operation scale to reject infeasible growth.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_exact": "You do not need an exact runtime; the rough n^2 scale is enough.",
        "wrong_constant": "Constant factors cannot usually rescue 100000^2 pair checks."
      }
    },
    "id": "alg-complexity-constraint-first-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A brute force plan would do about n^2 checks. n can be 100000. Which rough scale explains the rejection?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "100000^2 is about 10^10 checks, which is the rough scale that rejects the plan.",
        "id": "alg-complexity-constraint-first-011-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Around 10^10 checks, which is too large for a normal candidate plan."
          },
          {
            "id": "wrong_exact",
            "text": "The plan cannot be judged until exact machine speed is known."
          },
          {
            "id": "wrong_constant",
            "text": "The plan is probably fine because nested loops can have small constants."
          }
        ],
        "prompt": "Choose the rough-scale reasoning.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Estimate rough quadratic scale",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A solution has a best case that often returns after a few checks, but its worst case compares every pair. n can be 100000. Which signal should drive acceptance?",
      "mentalModelCorrection": "The input constraint must be checked against worst-case growth unless the problem guarantees early exit.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice distinguishing typical early exits from guaranteed bounds.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_best": "A common best case does not make the worst-case constraint disappear.",
        "wrong_examples": "Passing sample inputs does not prove the worst-case growth is viable."
      }
    },
    "id": "alg-complexity-constraint-first-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A solution has a best case that often returns after a few checks, but its worst case compares every pair. n can be 100000. Which signal should drive acceptance?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The worst-case O(n^2) behavior must fit the constraint, unless early exit is guaranteed by the problem.",
        "id": "alg-complexity-constraint-first-012-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The worst-case pair enumeration, because early exit is not guaranteed."
          },
          {
            "id": "wrong_best",
            "text": "The common best case, because many inputs return quickly."
          },
          {
            "id": "wrong_examples",
            "text": "The sample cases, because passing them means the complexity is acceptable."
          }
        ],
        "prompt": "Choose the acceptance signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Use worst-case for constraint fit",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A plan scans once for each possible threshold value from 1 to 100. n can be 100000. What constraint signal makes this different from pair enumeration?",
      "mentalModelCorrection": "A fixed small multiplier is still linear in n, unlike n nested against n.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice distinguishing fixed repeated work from input-sized nested work.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_nested": "Not every repeated scan is O(n^2); the outer count is fixed at 100.",
        "wrong_ignore": "You still need to estimate the repeated work, but the fixed bound changes the result."
      }
    },
    "id": "alg-complexity-constraint-first-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A plan scans once for each possible threshold value from 1 to 100. n can be 100000. What constraint signal makes this different from pair enumeration?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "100 scans is O(100n), which simplifies to O(n); this is not pair enumeration.",
        "id": "alg-complexity-constraint-first-015-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The repeated scan count is fixed at 100, so the plan is still linear in n."
          },
          {
            "id": "wrong_nested",
            "text": "Any repeated scan should be rejected as O(n^2)."
          },
          {
            "id": "wrong_ignore",
            "text": "The input limit means repeated work does not need to be estimated."
          }
        ],
        "prompt": "Choose the correct constraint signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Accept fixed repeated scans",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "n can be 100000. A candidate has an outer loop over n items and an inner loop that always runs at most 5 checks. What should the constraint check conclude?",
      "mentalModelCorrection": "A fixed-size inner loop is a constant multiplier, so the plan is linear, not quadratic.",
      "mistakeTypes": [
        "complexity_mismatch",
        "constraint_ignored"
      ],
      "nextAction": "Practice checking whether an inner loop grows with n or is bounded by a constant.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_quadratic": "Nested syntax alone does not imply O(n^2); the inner bound is fixed.",
        "wrong_unknown": "The prompt gives enough information: the inner loop is capped at 5."
      }
    },
    "id": "alg-complexity-constraint-first-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "n can be 100000. A candidate has an outer loop over n items and an inner loop that always runs at most 5 checks. What should the constraint check conclude?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The plan is O(5n), which is O(n), so this specific nested loop is not rejected as quadratic.",
        "id": "alg-complexity-constraint-first-016-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "It is still O(n), because the inner work is capped by a constant."
          },
          {
            "id": "wrong_quadratic",
            "text": "It must be O(n^2), because there is a loop inside a loop."
          },
          {
            "id": "wrong_unknown",
            "text": "The complexity cannot be estimated because there are two loops."
          }
        ],
        "prompt": "Choose the constraint-check conclusion.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Do not reject fixed inner loop",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "n can be 100000 and q can be 100000. A candidate scans all n items for each query. What should the constraint check notice?",
      "mentalModelCorrection": "Repeated full scans across many queries create O(nq) work, which can be as bad as quadratic at these limits.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice treating repeated queries as part of the input-size constraint.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_single_query": "The plan is not just one scan; it repeats for q queries.",
        "wrong_space": "The issue is repeated time cost, not necessarily extra space."
      }
    },
    "id": "alg-complexity-constraint-first-017",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "n can be 100000 and q can be 100000. A candidate scans all n items for each query. What should the constraint check notice?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Scanning n items for q queries is O(nq), which is not viable when both can be 100000.",
        "id": "alg-complexity-constraint-first-017-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The plan does O(nq) work, so it fails when both n and q are large."
          },
          {
            "id": "wrong_single_query",
            "text": "The plan is O(n), because each individual query scans the list once."
          },
          {
            "id": "wrong_space",
            "text": "The plan is acceptable because it can answer queries without extra memory."
          }
        ],
        "prompt": "Choose the constraint-check signal.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Reject repeated full scans for many queries",
    "trackId": "algorithms",
    "type": "strategy_choice",
    "acceptableApproachIds": [],
    "constraintSignal": "n and q can both be 100000.",
    "expectedApproachIds": [
      "apply_input_constraints"
    ],
    "reasonSignal": "Scanning n items for q queries is O(nq), so it fails when both limits are large.",
    "rejectedApproachIds": [
      "scan_each_query"
    ],
    "responseSpec": {
      "kind": "strategy_selection",
      "strategies": [
        {
          "id": "expected_signal",
          "text": "The plan does O(nq) work, so it fails when both n and q are large."
        },
        {
          "id": "wrong_single_query",
          "text": "The plan is O(n), because each individual query scans the list once."
        },
        {
          "id": "wrong_space",
          "text": "The plan is acceptable because it can answer queries without extra memory."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A plan uses O(n log n) sorting for n = 100000. Another uses O(n^2) pair checks. Which one survives the first constraint screen?",
      "mentalModelCorrection": "The constraint screen does not require proving final correctness; it filters out the infeasible growth class.",
      "mistakeTypes": [
        "constraint_ignored",
        "complexity_mismatch"
      ],
      "nextAction": "Practice using the constraint screen to narrow candidates before detailed design.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_quadratic": "O(n^2) is the plan the constraint screen should reject.",
        "wrong_correctness": "Correctness still matters later, but this step asks which growth class survives."
      }
    },
    "id": "alg-complexity-constraint-first-018",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A plan uses O(n log n) sorting for n = 100000. Another uses O(n^2) pair checks. Which one survives the first constraint screen?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "O(n log n) survives the first constraint screen more plausibly than O(n^2) at n = 100000.",
        "id": "alg-complexity-constraint-first-018-check",
        "mistakeTypes": [
          "constraint_ignored",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The O(n log n) sorting-based candidate survives the first growth check."
          },
          {
            "id": "wrong_quadratic",
            "text": "The O(n^2) pair-check candidate survives because it avoids sorting."
          },
          {
            "id": "wrong_correctness",
            "text": "Neither can be screened by complexity before writing complete code."
          }
        ],
        "prompt": "Choose the candidate that survives the first screen.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Screen O(n log n) against O(n squared)",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "growth class",
        "input limit",
        "first viability screen"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "The O(n log n) sorting-based candidate survives the first growth check."
        },
        {
          "id": "wrong_quadratic",
          "text": "The O(n^2) pair-check candidate survives because it avoids sorting."
        },
        {
          "id": "wrong_correctness",
          "text": "Neither can be screened by complexity before writing complete code."
        }
      ]
    }
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A problem statement says n <= 100000. What should you do before choosing between a nested pair scan and a one-pass plan?",
      "mentalModelCorrection": "Read the constraint, estimate each candidate's growth, then reject candidates that do not fit.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "constraint_ignored"
      ],
      "nextAction": "Practice ordering constraint-first strategy selection.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-constraint-first-019",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A problem statement says n <= 100000. What should you do before choosing between a nested pair scan and a one-pass plan?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "read_limit",
          "estimate_pair_scan",
          "estimate_one_pass",
          "reject_infeasible"
        ],
        "feedback": "Use the input limit first, compare candidate growth, and reject the infeasible plan.",
        "id": "alg-complexity-constraint-first-019-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "read_limit",
            "text": "Read the maximum input size."
          },
          {
            "id": "estimate_pair_scan",
            "text": "Estimate the nested pair scan as quadratic."
          },
          {
            "id": "estimate_one_pass",
            "text": "Estimate the one-pass plan as linear if each step is constant work."
          },
          {
            "id": "reject_infeasible",
            "text": "Reject the candidate whose growth does not fit the limit."
          }
        ],
        "prompt": "Tap the reasoning steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "order_steps"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order constraint-first selection",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A task has n <= 100000. Plan A checks every pair. Plan B uses a one-pass scan but requires careful state. Which first-pass review is correct?",
      "mentalModelCorrection": "The first-pass review should reject the infeasible growth class, then inspect the viable candidate's state and correctness.",
      "mistakeTypes": [
        "constraint_ignored",
        "constraint_reasoning_missed",
        "brute_force_when_optimized_required"
      ],
      "nextAction": "Practice separating first-pass complexity screening from detailed correctness review.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_simplicity": "Simplicity cannot keep an infeasible O(n^2) plan alive under this constraint.",
        "wrong_skip_correctness": "Complexity screening does not prove correctness; it only filters candidate viability."
      }
    },
    "id": "alg-complexity-constraint-first-022",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_input_constraints",
    "prompt": "A task has n <= 100000. Plan A checks every pair. Plan B uses a one-pass scan but requires careful state. Which first-pass review is correct?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "Reject Plan A on growth, then review whether Plan B's state is correct for the problem.",
        "id": "alg-complexity-constraint-first-022-check",
        "mistakeTypes": [
          "constraint_ignored",
          "constraint_reasoning_missed",
          "brute_force_when_optimized_required"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Reject Plan A because O(n^2) does not fit, then inspect Plan B's state for correctness."
          },
          {
            "id": "wrong_simplicity",
            "text": "Keep Plan A because it is simpler, and only optimize after it fails."
          },
          {
            "id": "wrong_skip_correctness",
            "text": "Accept Plan B immediately because any one-pass plan is automatically correct."
          }
        ],
        "prompt": "Choose the correct first-pass review.",
        "status": "active",
        "testedSkillAtomIds": [
          "apply_input_constraints"
        ],
        "type": "single_choice"
      }
    ],
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "apply_input_constraints",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "input_size_constraints",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Screen complexity before state review",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "responseSpec": {
      "comparisonCriteria": [
        "constraint fit",
        "growth class",
        "next correctness review"
      ],
      "kind": "solution_comparison",
      "solutions": [
        {
          "id": "expected_signal",
          "text": "Reject Plan A because O(n^2) does not fit, then inspect Plan B's state for correctness."
        },
        {
          "id": "wrong_simplicity",
          "text": "Keep Plan A because it is simpler, and only optimize after it fails."
        },
        {
          "id": "wrong_skip_correctness",
          "text": "Accept Plan B immediately because any one-pass plan is automatically correct."
        }
      ]
    }
  }
];
