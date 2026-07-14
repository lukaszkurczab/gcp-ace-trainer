import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const bigOBasicsQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A validator checks each item once and returns as soon as it sees an invalid value. What worst-case signal matters?",
      "mentalModelCorrection": "Early return can improve the best case, but worst-case time is still linear when the invalid value may appear last or not at all.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice distinguishing best-case early exit from worst-case growth.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_constant": "Early exit is not enough to claim O(1); the invalid value may be last or absent.",
        "wrong_quadratic": "There is no repeated scan or nested pair enumeration here."
      }
    },
    "id": "alg-complexity-big-o-basics-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Choose the correct worst-case reasoning.",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "big_o_basics",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize worst-case single scan",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A validator checks each item once and returns as soon as it sees an invalid value. What worst-case signal matters?",
    "answerFeedback": "Worst-case time is O(n) because the scan may need to inspect every item.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Worst-case time is linear because the invalid value may appear last or not appear at all.",
        "isCorrect": true
      },
      {
        "id": "wrong_constant",
        "text": "The routine is constant time because it can return early.",
        "isCorrect": false
      },
      {
        "id": "wrong_quadratic",
        "text": "The routine is quadratic because validation usually compares many values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A teammate calls a pair-comparison routine linear because the outer loop visits each item once. What mistake should you catch?",
      "mentalModelCorrection": "The inner work still runs many times; judging only the outer loop hides the quadratic comparison count.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice counting total repeated work, not only the outer loop iterations.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_space": "Space does not decide the time complexity of the nested comparisons.",
        "wrong_names": "Variable names do not determine growth rate; repeated work does."
      }
    },
    "id": "alg-complexity-big-o-basics-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Choose the reasoning error.",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "big_o_basics",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Catch outer-loop-only reasoning",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A teammate calls a pair-comparison routine linear because the outer loop visits each item once. What mistake should you catch?",
    "answerFeedback": "The mistake is outer-loop-only reasoning; the inner comparisons make the total work quadratic.",
    "options": [
      {
        "id": "expected_signal",
        "text": "They counted only the outer loop and ignored the repeated inner comparisons.",
        "isCorrect": true
      },
      {
        "id": "wrong_space",
        "text": "They focused too much on time and should classify it by memory first.",
        "isCorrect": false
      },
      {
        "id": "wrong_names",
        "text": "They used the wrong variable names for the loop indexes.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A search checks the middle item, then discards half of the remaining range. Which growth-rate signal should you name?",
      "mentalModelCorrection": "The key signal is repeated halving, not the word search or the presence of indexes.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice naming logarithmic growth from range shrinking.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_linear": "Linear search checks candidates one by one; this plan discards half the range each step.",
        "wrong_quadratic": "Quadratic work would require repeated pair-style enumeration, not range halving."
      }
    },
    "id": "alg-complexity-big-o-basics-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Choose the reasoning signal.",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "big_o_basics",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Identify halving signal",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A search checks the middle item, then discards half of the remaining range. Which growth-rate signal should you name?",
    "answerFeedback": "Repeated halving is the signal for logarithmic growth.",
    "options": [
      {
        "id": "expected_signal",
        "text": "Repeated halving of the candidate range points to O(log n).",
        "isCorrect": true
      },
      {
        "id": "wrong_linear",
        "text": "Any search through an array should be treated as O(n).",
        "isCorrect": false
      },
      {
        "id": "wrong_quadratic",
        "text": "Any repeated decision over an array should be treated as O(n^2).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A teammate says binary search is O(log n) because it uses two indexes named left and right. What correction should you make?",
      "mentalModelCorrection": "The complexity comes from discarding half the candidate range each step, not from the variable names.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice explaining growth rate from the operation pattern, not the implementation labels.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_names": "Variable names are not a complexity signal.",
        "wrong_sorted_only": "Sorted input is a required precondition for binary search, but the growth-rate explanation is the halving behavior."
      }
    },
    "id": "alg-complexity-big-o-basics-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "big_o_basics",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Explain logarithmic search",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A teammate says binary search is O(log n) because it uses two indexes named left and right. What correction should you make?",
    "answerFeedback": "The correct explanation is that each step removes about half of the remaining candidates.",
    "options": [
      {
        "id": "expected_signal",
        "text": "It is logarithmic because each check discards about half of the remaining candidate range.",
        "isCorrect": true
      },
      {
        "id": "wrong_names",
        "text": "It is logarithmic because the variables are usually named left and right.",
        "isCorrect": false
      },
      {
        "id": "wrong_sorted_only",
        "text": "It is logarithmic only because the input is sorted; the range shrinking does not matter.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A list of n arbitrary numbers is sorted using a standard efficient comparison sort. Which time cost should you expect?",
      "mentalModelCorrection": "The usual efficient comparison-sort signal is O(n log n); a simple scan would be lower, while all-pairs sorting-style reasoning overstates the expected cost.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice separating sorting cost from a simple scan after sorting.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_linear": "A comparison sort does more than visit each value once.",
        "wrong_quadratic": "Quadratic sorting algorithms exist, but the expected general comparison-sort signal here is O(n log n)."
      }
    },
    "id": "alg-complexity-big-o-basics-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "derive_time_complexity",
    "prompt": "Choose the expected sorting time.",
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
        "nodeId": "derive_time_complexity",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "big_o_basics",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Recognize comparison sort cost",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A list of n arbitrary numbers is sorted using a standard efficient comparison sort. Which time cost should you expect?",
    "answerFeedback": "The usual efficient comparison-sort signal is O(n log n).",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n log n), because comparison sorting grows faster than a single scan but usually below quadratic.",
        "isCorrect": true
      },
      {
        "id": "wrong_linear",
        "text": "O(n), because sorting only needs to touch each value.",
        "isCorrect": false
      },
      {
        "id": "wrong_quadratic",
        "text": "O(n^2), because sorting always compares every pair.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A teammate calls a sort-then-scan plan linear because the final pass is one scan. What mistake should you catch?",
      "mentalModelCorrection": "A later linear scan does not erase the earlier sorting cost.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice adding sequential phases and keeping the dominant term.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_scan": "The scan is real, but it is not the dominant phase.",
        "wrong_space": "The issue in the explanation is time dominance, not auxiliary memory."
      }
    },
    "id": "alg-complexity-big-o-basics-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_sequential_phase_costs",
    "prompt": "Choose the reasoning error.",
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
        "nodeId": "combine_sequential_phase_costs",
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
    "title": "Catch ignored sorting phase",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A teammate calls a sort-then-scan plan linear because the final pass is one scan. What mistake should you catch?",
    "answerFeedback": "The mistake is ignoring the sorting phase, which dominates the later linear scan.",
    "options": [
      {
        "id": "expected_signal",
        "text": "They ignored the earlier sorting phase, which dominates the final scan.",
        "isCorrect": true
      },
      {
        "id": "wrong_scan",
        "text": "They should ignore the final scan because scans never affect total cost.",
        "isCorrect": false
      },
      {
        "id": "wrong_space",
        "text": "They confused time complexity with the number of variables used.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Two plans both use loops. Plan A scans once. Plan B compares every pair. Which comparison is decisive?",
      "mentalModelCorrection": "The decisive difference is total repeated work: one pass is linear, while pair enumeration is quadratic.",
      "mistakeTypes": [
        "complexity_mismatch",
        "cannot_explain_why"
      ],
      "nextAction": "Practice comparing growth signals before comparing implementation details.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_loop_count": "Both plans may contain loops, but the total number of repeated operations is different.",
        "wrong_memory": "Memory can matter, but this comparison asks about the time growth signal."
      }
    },
    "id": "alg-complexity-big-o-basics-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
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
        "nodeId": "identify_repeated_work",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "big_o_basics",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "cannot_explain_why",
        "role": "mistake_type"
      }
    ],
    "title": "Compare scan with pair enumeration",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Two plans both use loops. Plan A scans once. Plan B compares every pair. Which comparison is decisive?",
    "answerFeedback": "A one-pass scan is O(n); comparing every pair is O(n^2).",
    "options": [
      {
        "id": "expected_signal",
        "text": "Plan A does O(n) work, while Plan B does O(n^2) pair work.",
        "isCorrect": true
      },
      {
        "id": "wrong_loop_count",
        "text": "The plans scale the same because both contain loops.",
        "isCorrect": false
      },
      {
        "id": "wrong_memory",
        "text": "The plan with fewer variables is always the faster one.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A plan first sorts, then checks adjacent values. Which operation determines the total time growth?",
      "mentalModelCorrection": "For sequential phases, keep the dominant cost; O(n log n) sorting dominates an O(n) scan.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice reducing O(n log n + n) to O(n log n).",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_scan": "The scan happens, but it is not the dominant term.",
        "wrong_pair": "Adjacent checks after sorting are not all-pairs enumeration."
      }
    },
    "id": "alg-complexity-big-o-basics-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "Choose the dominant operation.",
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
    "title": "Identify dominant sort cost",
    "trackId": "algorithms",
    "type": "approach_naming",
    "instruction": "A plan first sorts, then checks adjacent values. Which operation determines the total time growth?",
    "answerFeedback": "The sort determines the total time because O(n log n) dominates the later O(n) scan.",
    "options": [
      {
        "id": "expected_signal",
        "text": "The sorting phase determines the total time because it dominates the later scan.",
        "isCorrect": true
      },
      {
        "id": "wrong_scan",
        "text": "The final scan determines the total time because it reads the sorted array last.",
        "isCorrect": false
      },
      {
        "id": "wrong_pair",
        "text": "The adjacent checks make the plan quadratic because pairs are involved.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Order these growth-rate signals from lower expected growth to higher expected growth.",
      "mentalModelCorrection": "Halving grows slower than scanning; sorting grows above linear; pair enumeration grows quadratically.",
      "mistakeTypes": [
        "subgoal_order_wrong",
        "complexity_mismatch"
      ],
      "nextAction": "Practice comparing growth classes before attaching them to implementation choices.",
      "result": "diagnostic"
    },
    "id": "alg-complexity-big-o-basics-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
    "prompt": "Tap the signals from lower growth to higher growth.",
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
    "title": "Order basic growth signals",
    "trackId": "algorithms",
    "type": "subgoal_ordering",
    "instruction": "Order these growth-rate signals from lower expected growth to higher expected growth.",
    "answerFeedback": "The expected order is O(log n), O(n), O(n log n), then O(n^2).",
    "subgoals": [
      {
        "id": "halving_range",
        "text": "Halve the candidate range after each check."
      },
      {
        "id": "single_scan",
        "text": "Visit each input value once."
      },
      {
        "id": "comparison_sort",
        "text": "Sort arbitrary values with a comparison sort."
      },
      {
        "id": "pair_enumeration",
        "text": "Compare every value with every later value."
      }
    ],
    "correctOrder": [
      "halving_range",
      "single_scan",
      "comparison_sort",
      "pair_enumeration"
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine scans array A of length n, then separately scans array B of length m. What time should you name?",
      "mentalModelCorrection": "Sequential phases over independent inputs add as O(n + m).",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_product": "Separate scans are sequential, not nested.",
        "wrong_n_only": "The second independent input size still contributes to the total."
      }
    },
    "id": "alg-complexity-big-o-basics-020-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_sequential_phase_costs",
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
        "nodeId": "combine_sequential_phase_costs",
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
    "title": "Cost two independent scans",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A routine scans array A of length n, then separately scans array B of length m. What time should you name?",
    "answerFeedback": "Sequential phases over independent inputs add as O(n + m).",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n + m), because the two input sizes are independent sequential phases.",
        "isCorrect": true
      },
      {
        "id": "wrong_product",
        "text": "O(n * m), because there are two arrays.",
        "isCorrect": false
      },
      {
        "id": "wrong_n_only",
        "text": "O(n), because only the first array determines the cost.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine compares every item in array A of length n with every item in array B of length m. What time signal should you name?",
      "mentalModelCorrection": "Nested work across two independent inputs multiplies as O(n * m).",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_sum": "The arrays are not scanned separately; each A item is paired with each B item.",
        "wrong_square": "Different input sizes should stay as n and m when they are independent."
      }
    },
    "id": "alg-complexity-big-o-basics-021-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
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
        "nodeId": "identify_repeated_work",
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
    "title": "Cost nested independent arrays",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A routine compares every item in array A of length n with every item in array B of length m. What time signal should you name?",
    "answerFeedback": "Nested work across two independent inputs multiplies as O(n * m).",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n * m), because each of n items can be compared with m items.",
        "isCorrect": true
      },
      {
        "id": "wrong_sum",
        "text": "O(n + m), because both arrays are scanned.",
        "isCorrect": false
      },
      {
        "id": "wrong_square",
        "text": "O(n^2), always, because there are two loops.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine scans n values once, then sorts the same n values with an efficient comparison sort. What total time should you expect?",
      "mentalModelCorrection": "Add sequential phases, then keep the dominant term.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_scan": "The later sort is more expensive than the scan.",
        "wrong_multiply": "Sequential phases add; they do not multiply unless nested."
      }
    },
    "id": "alg-complexity-big-o-basics-022-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_sequential_phase_costs",
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
        "nodeId": "combine_sequential_phase_costs",
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
    "title": "Cost scan then sort",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A routine scans n values once, then sorts the same n values with an efficient comparison sort. What total time should you expect?",
    "answerFeedback": "Add sequential phases, then keep the dominant term.",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n log n), because the sorting phase dominates the earlier scan.",
        "isCorrect": true
      },
      {
        "id": "wrong_scan",
        "text": "O(n), because the first phase is a scan.",
        "isCorrect": false
      },
      {
        "id": "wrong_multiply",
        "text": "O(n^2), because two phases always multiply.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine does 5 simple checks for each of n items. Which Big-O time should you name?",
      "mentalModelCorrection": "A fixed number of operations per item is still linear growth.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_keep_constant": "Big-O drops fixed constant multipliers.",
        "wrong_power": "Five checks per item is still constant work per item, not five nested input-sized loops."
      }
    },
    "id": "alg-complexity-big-o-basics-023-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_repeated_work",
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
    "title": "Drop constant multiplier",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A routine does 5 simple checks for each of n items. Which Big-O time should you name?",
    "answerFeedback": "A fixed number of operations per item is still linear growth.",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n), because 5 is a fixed constant multiplier.",
        "isCorrect": true
      },
      {
        "id": "wrong_keep_constant",
        "text": "O(5n), because constants must stay in Big-O labels.",
        "isCorrect": false
      },
      {
        "id": "wrong_power",
        "text": "O(n^5), because there are five checks.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A routine does one pair-enumeration phase and then one single scan. Which total time should you name?",
      "mentalModelCorrection": "When phases are sequential, add their costs and simplify to the dominant term.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_scan": "The earlier quadratic phase dominates the total.",
        "wrong_cube": "Sequential phases add; they do not multiply."
      }
    },
    "id": "alg-complexity-big-o-basics-024-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_sequential_phase_costs",
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
        "nodeId": "combine_sequential_phase_costs",
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
    "title": "Drop lower-order scan",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A routine does one pair-enumeration phase and then one single scan. Which total time should you name?",
    "answerFeedback": "When phases are sequential, add their costs and simplify to the dominant term.",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n^2), because O(n^2 + n) is dominated by O(n^2).",
        "isCorrect": true
      },
      {
        "id": "wrong_scan",
        "text": "O(n), because the final scan is simpler.",
        "isCorrect": false
      },
      {
        "id": "wrong_cube",
        "text": "O(n^3), because the phases should be multiplied.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A plan costs O(n log n) for sorting and O(n) for a final scan. How should the total be simplified?",
      "mentalModelCorrection": "The total is O(n log n + n), which simplifies to O(n log n).",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Practice explaining the repeated work rather than naming only a label.",
      "result": "diagnostic",
      "distractorExplanations": {
        "wrong_scan": "The sort is more expensive than the scan.",
        "wrong_multiply": "Sequential terms are added before simplification, not multiplied."
      }
    },
    "id": "alg-complexity-big-o-basics-025-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "combine_sequential_phase_costs",
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
        "nodeId": "combine_sequential_phase_costs",
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
    "title": "Simplify sort plus scan",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A plan costs O(n log n) for sorting and O(n) for a final scan. How should the total be simplified?",
    "answerFeedback": "The total is O(n log n + n), which simplifies to O(n log n).",
    "options": [
      {
        "id": "expected_signal",
        "text": "O(n log n), because the sort dominates the linear scan.",
        "isCorrect": true
      },
      {
        "id": "wrong_scan",
        "text": "O(n), because scans are the common operation.",
        "isCorrect": false
      },
      {
        "id": "wrong_multiply",
        "text": "O(n^2 log n), because different terms should be multiplied.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
