export const reasoningOrderAndMistakesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Order the reasoning steps for choosing a strategy from input constraints.",
      "mentalModelCorrection": "Start with the input limit, count repeated work, estimate growth, then choose a plan that fits.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "constraint_ignored"
      ],
      "nextAction": "Practice using constraints before implementation details.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-reasoning-order-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "Order the reasoning steps for choosing a strategy from input constraints.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "read_limit",
          "count_repeated_work",
          "estimate_growth",
          "choose_viable_plan"
        ],
        "feedback": "Read the largest input size first, estimate repeated work, translate it into growth, then keep only viable plans.",
        "id": "alg-complexity-reasoning-order-001-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "read_limit",
            "text": "Read the largest input size."
          },
          {
            "id": "count_repeated_work",
            "text": "Count how often the repeated operation can run."
          },
          {
            "id": "estimate_growth",
            "text": "Translate the repeated work into growth."
          },
          {
            "id": "choose_viable_plan",
            "text": "Choose a plan whose growth fits the limit."
          }
        ],
        "prompt": "Tap the steps in the correct order.",
        "status": "active",
        "testedSkillAtomIds": [
          "identify_repeated_work"
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "dominant_term_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order constraint-based strategy reasoning",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A teammate chooses a double loop first and says they will check constraints after it works. What mistake should you diagnose?",
      "mentalModelCorrection": "Constraints are a first-pass filter for strategy viability, not a final check after implementation.",
      "mistakeTypes": [
        "constraint_reasoning_missed",
        "constraint_ignored"
      ],
      "nextAction": "Practice rejecting implementation-first reasoning when the input limit already rules out a plan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_style": "The core issue is not code style; it is using constraints too late.",
        "wrong_testing": "Tests do not replace an upfront growth check against the input limit."
      }
    },
    "id": "alg-complexity-reasoning-order-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "A teammate chooses a double loop first and says they will check constraints after it works. What mistake should you diagnose?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "This is implementation-first reasoning: the constraint should screen the strategy before coding.",
        "id": "alg-complexity-reasoning-order-002-check",
        "mistakeTypes": [
          "constraint_reasoning_missed",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "They are using constraints too late instead of screening the strategy before implementation."
          },
          {
            "id": "wrong_style",
            "text": "They are mainly choosing a code style that may be harder to read."
          },
          {
            "id": "wrong_testing",
            "text": "They only need more test cases before complexity matters."
          }
        ],
        "prompt": "Choose the reasoning mistake.",
        "status": "active",
        "testedSkillAtomIds": [
          "identify_repeated_work"
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "dominant_term_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_ignored",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose implementation-first reasoning",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A review must choose between two explanations of the same solution: one names the Big-O label only, the other explains repeated work. Which is better?",
      "mentalModelCorrection": "A useful complexity explanation names the operation pattern that causes the growth.",
      "mistakeTypes": [
        "cannot_explain_why",
        "complexity_mismatch"
      ],
      "nextAction": "Practice justifying Big-O labels with the repeated work that creates them.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_label_only": "A label without the operation pattern is weak diagnostic feedback.",
        "wrong_variable_names": "Variable names do not explain growth."
      }
    },
    "id": "alg-complexity-reasoning-order-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "A review must choose between two explanations of the same solution: one names the Big-O label only, the other explains repeated work. Which is better?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "The better explanation connects the Big-O label to the repeated work pattern.",
        "id": "alg-complexity-reasoning-order-007-check",
        "mistakeTypes": [
          "cannot_explain_why",
          "complexity_mismatch"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "The explanation that says which repeated operation creates the growth."
          },
          {
            "id": "wrong_label_only",
            "text": "The explanation that only says O(n^2), because labels are enough."
          },
          {
            "id": "wrong_variable_names",
            "text": "The explanation that focuses on whether the loop variables are named clearly."
          }
        ],
        "prompt": "Choose the better explanation style.",
        "status": "active",
        "testedSkillAtomIds": [
          "identify_repeated_work"
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "dominant_term_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Prefer operation-pattern explanation",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner sees two loops and immediately says O(n^2). The inner loop always runs at most 4 times. What mistake should you diagnose?",
      "mentalModelCorrection": "Nested syntax alone is not enough; the inner bound must grow with input size to create quadratic work.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice checking whether repeated work is input-sized or constant-bounded.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_nested": "A loop inside a loop is not automatically quadratic.",
        "wrong_unknown": "The prompt gives the missing bound: the inner loop is capped at 4."
      }
    },
    "id": "alg-complexity-reasoning-order-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "A learner sees two loops and immediately says O(n^2). The inner loop always runs at most 4 times. What mistake should you diagnose?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "They are using nested-loop syntax as the signal instead of checking whether the inner work grows with n.",
        "id": "alg-complexity-reasoning-order-008-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "They assumed nested syntax means O(n^2) without checking the constant inner bound."
          },
          {
            "id": "wrong_nested",
            "text": "They are correct because every nested loop is O(n^2)."
          },
          {
            "id": "wrong_unknown",
            "text": "The complexity cannot be reasoned about because there are two loops."
          }
        ],
        "prompt": "Choose the mistake diagnosis.",
        "status": "active",
        "testedSkillAtomIds": [
          "identify_repeated_work"
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "dominant_term_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose nested-loop overgeneralization",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner sees one loop and immediately says O(n). The loop body calls a helper that scans the whole input. What mistake should you diagnose?",
      "mentalModelCorrection": "One visible loop does not guarantee linear time when the body hides another scan.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice inspecting loop body cost before naming complexity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_one_loop": "A helper can hide repeated work.",
        "wrong_helper_constant": "A helper is not automatically constant time."
      }
    },
    "id": "alg-complexity-reasoning-order-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "A learner sees one loop and immediately says O(n). The loop body calls a helper that scans the whole input. What mistake should you diagnose?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "They counted only outer iterations and ignored the hidden scan inside the helper.",
        "id": "alg-complexity-reasoning-order-009-check",
        "mistakeTypes": [
          "complexity_mismatch",
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "They counted the visible loop but ignored the helper's full-input scan."
          },
          {
            "id": "wrong_one_loop",
            "text": "They are correct because one visible loop is always O(n)."
          },
          {
            "id": "wrong_helper_constant",
            "text": "They are correct because helper calls are always O(1)."
          }
        ],
        "prompt": "Choose the mistake diagnosis.",
        "status": "active",
        "testedSkillAtomIds": [
          "identify_repeated_work"
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "dominant_term_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose hidden-helper oversight",
    "trackId": "algorithms",
    "type": "edge_case_drill"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner gives only the final complexity pair but cannot say why. What feedback should they receive?",
      "mentalModelCorrection": "Correct labels are weaker without the repeated-work signal that explains them.",
      "mistakeTypes": [
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming the exact operation pattern that causes the complexity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_label_enough": "A correct label without reasoning is fragile and hard to transfer.",
        "wrong_code_first": "Writing code does not replace explaining the cost model."
      }
    },
    "id": "alg-complexity-reasoning-order-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "A learner gives only the final complexity pair but cannot say why. What feedback should they receive?",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": "expected_signal",
        "feedback": "They should connect the complexity label to the repeated operation pattern.",
        "id": "alg-complexity-reasoning-order-011-check",
        "mistakeTypes": [
          "cannot_explain_why"
        ],
        "options": [
          {
            "id": "expected_signal",
            "text": "Name the repeated operation pattern that produces the time and space growth."
          },
          {
            "id": "wrong_label_enough",
            "text": "No feedback is needed if the final Big-O label is correct."
          },
          {
            "id": "wrong_code_first",
            "text": "Skip reasoning and write the implementation first."
          }
        ],
        "prompt": "Choose the best feedback.",
        "status": "active",
        "testedSkillAtomIds": [
          "identify_repeated_work"
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "dominant_term_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Require explanation beyond Big-O label",
    "trackId": "algorithms",
    "type": "approach_naming"
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order the review steps when a proposed solution might be too slow.",
      "mentalModelCorrection": "A useful review goes from constraints to repeated work to growth to the specific mistake.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "constraint_ignored"
      ],
      "nextAction": "Practice structuring complexity feedback instead of jumping to a label.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-reasoning-order-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "Order the review steps when a proposed solution might be too slow.",
    "roadmapNodeId": "complexity_and_constraints",
    "status": "active",
    "staticMicroChecks": [
      {
        "correctAnswer": [
          "read_constraints",
          "find_repeated_work",
          "estimate_big_o",
          "name_mistake"
        ],
        "feedback": "First read constraints, then find repeated work, estimate growth, and name the reasoning mistake.",
        "id": "alg-complexity-reasoning-order-012-check",
        "mistakeTypes": [
          "subgoal_order_wrong",
          "constraint_ignored"
        ],
        "options": [
          {
            "id": "read_constraints",
            "text": "Read the input limits and query counts."
          },
          {
            "id": "find_repeated_work",
            "text": "Find the operation that repeats with input size."
          },
          {
            "id": "estimate_big_o",
            "text": "Estimate the growth class."
          },
          {
            "id": "name_mistake",
            "text": "Name the specific reasoning mistake if the plan does not fit."
          }
        ],
        "prompt": "Tap the review steps in order.",
        "status": "active",
        "testedSkillAtomIds": [
          "identify_repeated_work"
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "dominant_term_reasoning",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Order complexity review steps",
    "trackId": "algorithms",
    "type": "subgoal_ordering"
  }
];
