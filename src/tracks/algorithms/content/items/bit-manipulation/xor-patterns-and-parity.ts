import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const xorPatternsAndParityQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "XOR cancels identical values: a value XORed with itself becomes 0.",
      "mentalModelCorrection": "The identity x ^ x = 0 is the base cancellation rule behind XOR duplicate-pair reasoning.",
      "mistakeTypes": [
        "xor_identity_misunderstood",
        "cancellation_model_missing"
      ],
      "nextAction": "Memorize the two base identities first: x ^ x = 0 and x ^ 0 = x.",
      "result": "diagnostic",
      "distractorExplanations": {
        "returns_x": "That describes x ^ 0, not x ^ x.",
        "returns_one": "XOR is not a boolean 'different?' result here; it operates bit by bit on the value.",
        "returns_double": "XOR is not addition. Equal values cancel instead of adding."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_xor_self_cancellation",
    "prompt": "Which identity is correct for x ^ x?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "understand_xor_self_cancellation",
        "role": "primary"
      }
    ],
    "title": "Understand XOR self-cancellation",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is x ^ x for any integer x?",
    "answerFeedback": "Correct. XORing a value with itself cancels it to 0.",
    "options": [
      {
        "id": "zero",
        "text": "0.",
        "isCorrect": true
      },
      {
        "id": "returns_x",
        "text": "x.",
        "isCorrect": false
      },
      {
        "id": "returns_one",
        "text": "1.",
        "isCorrect": false
      },
      {
        "id": "returns_double",
        "text": "2 * x.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Zero does not change a value under XOR.",
      "mentalModelCorrection": "The identity x ^ 0 = x explains why a remaining unmatched value survives after all pairs cancel.",
      "mistakeTypes": [
        "xor_identity_misunderstood",
        "cancellation_model_missing"
      ],
      "nextAction": "Use x ^ 0 = x to explain why the final accumulator can hold the unpaired value.",
      "result": "diagnostic",
      "distractorExplanations": {
        "zero": "That would be true for x ^ x, not x ^ 0.",
        "one": "XOR with 0 preserves every bit of x; it does not collapse to 1.",
        "bitwise_not": "XOR with all 1s flips bits; XOR with 0 preserves them."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_xor_zero_identity",
    "prompt": "Which identity is correct for x ^ 0?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "understand_xor_zero_identity",
        "role": "primary"
      }
    ],
    "title": "Understand XOR with zero",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is x ^ 0 for any integer x?",
    "answerFeedback": "Correct. XOR with 0 leaves the value unchanged.",
    "options": [
      {
        "id": "returns_x",
        "text": "x.",
        "isCorrect": true
      },
      {
        "id": "zero",
        "text": "0.",
        "isCorrect": false
      },
      {
        "id": "one",
        "text": "1.",
        "isCorrect": false
      },
      {
        "id": "bitwise_not",
        "text": "The bitwise opposite of x.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The pairs cancel regardless of where they appear in the sequence.",
      "mentalModelCorrection": "XOR cancellation is order-independent: the same values can be regrouped into cancelling pairs.",
      "mistakeTypes": [
        "xor_order_independence_missed",
        "cancellation_model_missing"
      ],
      "nextAction": "Group equal values mentally even if they are not adjacent.",
      "result": "diagnostic",
      "distractorExplanations": {
        "adjacent_only": "XOR cancellation does not require equal values to be adjacent.",
        "sorted_required": "Sorting is unnecessary for XOR cancellation because order does not change the result.",
        "first_pair_only": "All equal pairs cancel, not only the first pair encountered."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_xor_order_independence",
    "prompt": "What makes XOR cancellation independent of adjacency?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_xor_order_independence",
        "role": "primary"
      }
    ],
    "title": "Recognize order-independent cancellation",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Why can XOR find the single unpaired value even when equal pairs are not adjacent?",
    "answerFeedback": "Correct. XOR is order-independent for this cancellation reasoning, so equal values cancel wherever they appear.",
    "options": [
      {
        "id": "order_independent",
        "text": "Because XOR cancellation does not depend on the order of values.",
        "isCorrect": true
      },
      {
        "id": "adjacent_only",
        "text": "Because XOR only cancels adjacent equal values.",
        "isCorrect": false
      },
      {
        "id": "sorted_required",
        "text": "Because the array must be sorted before XOR works.",
        "isCorrect": false
      },
      {
        "id": "first_pair_only",
        "text": "Because XOR cancels only the first repeated pair.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The values 1 and 2 each appear twice, so they cancel; 4 appears once and remains.",
      "mentalModelCorrection": "When every value appears exactly twice except one, XORing all values leaves the single value.",
      "mistakeTypes": [
        "xor_trace_error",
        "one_unpaired_assumption_missed"
      ],
      "nextAction": "Pair equal values first, then apply x ^ x = 0 and x ^ 0 = x.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_zero": "The result would be zero only if every value appeared an even number of times.",
        "result_three": "XOR is not arithmetic addition or subtraction.",
        "result_all_values": "XOR cancellation collapses paired values; it does not return the whole list."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_xor_pair_cancellation",
    "prompt": "Trace XOR cancellation for [4, 1, 2, 1, 2].",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_xor_pair_cancellation",
        "role": "primary"
      }
    ],
    "title": "Trace one unpaired value",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What remains after XORing all values in [4, 1, 2, 1, 2]?",
    "answerFeedback": "Correct. 1 cancels with 1, 2 cancels with 2, and 4 remains.",
    "options": [
      {
        "id": "result_four",
        "text": "4.",
        "isCorrect": true
      },
      {
        "id": "result_zero",
        "text": "0.",
        "isCorrect": false
      },
      {
        "id": "result_three",
        "text": "3.",
        "isCorrect": false
      },
      {
        "id": "result_all_values",
        "text": "[4, 1, 2, 1, 2].",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The prompt guarantees exactly one value remains after all duplicate pairs cancel.",
      "mentalModelCorrection": "XOR is appropriate only when the occurrence assumptions match cancellation: paired values cancel and one odd-occurring value remains.",
      "mistakeTypes": [
        "one_unpaired_assumption_missed",
        "xor_overused_for_duplicates"
      ],
      "nextAction": "Before using XOR, state the exact multiplicity assumption.",
      "result": "diagnostic",
      "distractorExplanations": {
        "arbitrary_duplicates": "Arbitrary duplicate patterns do not guarantee that XOR returns a meaningful single answer.",
        "exact_counts": "If exact counts are needed, frequency counting is the safer model.",
        "sorted_order": "Sorting is not the reason XOR works; pair cancellation is."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_xor_cancellation_assumptions",
    "prompt": "When is XOR cancellation valid for one remaining value?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "validate_xor_cancellation_assumptions",
        "role": "primary"
      }
    ],
    "title": "Validate the pair-cancellation assumption",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which assumption makes the classic XOR 'single number' approach valid?",
    "answerFeedback": "Correct. XOR works when all other values cancel in pairs and one value remains.",
    "options": [
      {
        "id": "pairs_plus_one",
        "text": "Every value appears exactly twice except one value that appears once.",
        "isCorrect": true
      },
      {
        "id": "arbitrary_duplicates",
        "text": "Values may repeat any number of times, and XOR will still list all duplicates.",
        "isCorrect": false
      },
      {
        "id": "exact_counts",
        "text": "The task needs exact counts for every value.",
        "isCorrect": false
      },
      {
        "id": "sorted_order",
        "text": "The array is sorted, so XOR can compare neighbors.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A value appearing three times has odd parity, so one copy remains under XOR cancellation.",
      "mentalModelCorrection": "XOR preserves parity of occurrence, not exact count. Odd occurrences leave the value; even occurrences cancel to zero.",
      "mistakeTypes": [
        "parity_model_missed",
        "xor_frequency_confused"
      ],
      "nextAction": "Reduce each value's occurrence count to odd or even before applying XOR reasoning.",
      "result": "diagnostic",
      "distractorExplanations": {
        "cancels_all_three": "Two copies cancel, but the third copy remains.",
        "stores_count_three": "XOR does not store the exact count 3.",
        "invalid_always": "Odd occurrence can be reasoned about with XOR parity, as long as the expected result is parity-based."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_xor_occurrence_parity",
    "prompt": "What does XOR preserve about three equal occurrences?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_xor_occurrence_parity",
        "role": "primary"
      }
    ],
    "title": "Reason about odd occurrence parity",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "If the same value appears three times in an XOR accumulation, what is its net effect?",
    "answerFeedback": "Correct. Two copies cancel and one copy remains because three is odd.",
    "options": [
      {
        "id": "one_copy_remains",
        "text": "One copy remains.",
        "isCorrect": true
      },
      {
        "id": "cancels_all_three",
        "text": "All three copies cancel to zero.",
        "isCorrect": false
      },
      {
        "id": "stores_count_three",
        "text": "The accumulator stores the count 3.",
        "isCorrect": false
      },
      {
        "id": "invalid_always",
        "text": "XOR cannot reason about odd/even occurrence at all.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A value appearing four times has even parity, so all copies cancel under XOR.",
      "mentalModelCorrection": "Even occurrence counts cancel to zero under XOR because equal values can be paired.",
      "mistakeTypes": [
        "parity_model_missed",
        "xor_trace_error"
      ],
      "nextAction": "Pair equal occurrences: every pair contributes zero.",
      "result": "diagnostic",
      "distractorExplanations": {
        "one_copy_remains": "One copy remains for odd occurrence counts, not even counts.",
        "stores_count_four": "XOR does not store exact counts.",
        "returns_value_times_four": "XOR is not multiplication or addition."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_xor_occurrence_parity",
    "prompt": "What does XOR preserve about four equal occurrences?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reason_about_xor_occurrence_parity",
        "role": "primary"
      }
    ],
    "title": "Reason about even occurrence parity",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "If the same value appears four times in an XOR accumulation, what is its net effect?",
    "answerFeedback": "Correct. Four copies form two cancelling pairs, so the net effect is zero.",
    "options": [
      {
        "id": "cancels_to_zero",
        "text": "It cancels to zero.",
        "isCorrect": true
      },
      {
        "id": "one_copy_remains",
        "text": "One copy remains.",
        "isCorrect": false
      },
      {
        "id": "stores_count_four",
        "text": "The accumulator stores the count 4.",
        "isCorrect": false
      },
      {
        "id": "returns_value_times_four",
        "text": "The result is the value multiplied by 4.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task needs exact frequencies, but XOR only preserves odd/even parity.",
      "mentalModelCorrection": "Use hash map frequency counting when counts beyond parity matter.",
      "mistakeTypes": [
        "xor_frequency_confused",
        "frequency_need_missed"
      ],
      "nextAction": "Ask whether the output needs count values, count thresholds, or only odd/even occurrence.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_xor": "XOR cannot tell whether a value appeared three times or five times; both are odd.",
        "use_or": "OR also loses count information and only accumulates bit presence.",
        "use_sorting_as_only_option": "Sorting can group values, but the key mental model is exact frequency counting."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_xor_parity_from_frequency_counts",
    "prompt": "Why does exact frequency counting not fit XOR?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_xor_parity_from_frequency_counts",
        "role": "primary"
      }
    ],
    "title": "Separate parity from exact frequency",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A problem asks for the exact number of times each value appears. Why is XOR the wrong main tool?",
    "answerFeedback": "Correct. XOR preserves parity-style cancellation, not exact frequency counts.",
    "options": [
      {
        "id": "xor_loses_counts",
        "text": "XOR loses exact count information and keeps only parity-style effects.",
        "isCorrect": true
      },
      {
        "id": "use_xor",
        "text": "XOR is ideal because it stores every frequency exactly.",
        "isCorrect": false
      },
      {
        "id": "use_or",
        "text": "OR should replace XOR because OR stores counts exactly.",
        "isCorrect": false
      },
      {
        "id": "use_sorting_as_only_option",
        "text": "The only possible solution is sorting; hash maps cannot count.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "More than one value may remain after cancellation, so the final XOR is a combined value, not a list of answers.",
      "mentalModelCorrection": "Classic XOR cancellation returns one meaningful value only when the assumptions guarantee a single odd-occurring result.",
      "mistakeTypes": [
        "multiple_unmatched_values_ignored",
        "xor_assumption_invalid"
      ],
      "nextAction": "Check how many values can remain after pair cancellation before trusting the final XOR.",
      "result": "diagnostic",
      "distractorExplanations": {
        "returns_both_values": "A single XOR value does not directly list both unmatched values.",
        "always_valid": "The classic single-number trick depends on a single remaining value.",
        "returns_zero": "The final XOR may be nonzero, but that does not mean it identifies one original value."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_xor_when_multiple_values_may_remain",
    "prompt": "Why does basic XOR fail when two values may remain?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reject_xor_when_multiple_values_may_remain",
        "role": "primary"
      }
    ],
    "title": "Reject basic XOR when multiple values remain",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "An array may contain two different values that appear once, while all others appear twice. Why is the basic 'XOR all values and return the result' approach insufficient?",
    "answerFeedback": "Correct. XORing all values would produce the XOR of the two unmatched values, not directly return both values.",
    "options": [
      {
        "id": "combined_xor_not_both",
        "text": "The final XOR combines the two unmatched values instead of directly listing both.",
        "isCorrect": true
      },
      {
        "id": "returns_both_values",
        "text": "It directly returns both values as a pair.",
        "isCorrect": false
      },
      {
        "id": "always_valid",
        "text": "It is always valid for any number of unmatched values.",
        "isCorrect": false
      },
      {
        "id": "returns_zero",
        "text": "It must always return zero when there are two unmatched values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "XOR flips parity each time the same category is seen.",
      "mentalModelCorrection": "XOR is useful for parity toggling because applying the same toggle twice returns to the previous state.",
      "mistakeTypes": [
        "parity_toggle_model_missed",
        "xor_identity_misunderstood"
      ],
      "nextAction": "Model odd/even state as a bit that flips on each occurrence.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_or": "OR can set a seen bit, but it cannot flip back to even after a second occurrence.",
        "use_and": "AND is for checking/filtering, not toggling parity.",
        "exact_count_required": "Exact counts are unnecessary when only odd/even state matters."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "model_parity_with_xor_toggle",
    "prompt": "Which operation naturally tracks odd/even parity?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "model_parity_with_xor_toggle",
        "role": "primary"
      }
    ],
    "title": "Model parity with XOR toggling",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to track whether each category has appeared an odd or even number of times. Which operation best models seeing the same category again?",
    "answerFeedback": "Correct. XOR toggles the category bit each time it appears, tracking odd/even parity.",
    "options": [
      {
        "id": "xor_toggle",
        "text": "Toggle its bit with XOR.",
        "isCorrect": true
      },
      {
        "id": "use_or",
        "text": "Set its bit with OR every time.",
        "isCorrect": false
      },
      {
        "id": "use_and",
        "text": "AND the category bit into the state every time.",
        "isCorrect": false
      },
      {
        "id": "exact_count_required",
        "text": "Store exact counts even though only parity matters.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "XOR and OR behave differently when both inputs have a 1 bit in the same position.",
      "mentalModelCorrection": "OR keeps a 1 when either side has 1. XOR keeps a 1 only when the two bits differ.",
      "mistakeTypes": [
        "xor_or_confused",
        "bitwise_operator_semantics_confused"
      ],
      "nextAction": "Compare one bit column at a time: same bits cancel under XOR, but stay set under OR.",
      "result": "diagnostic",
      "distractorExplanations": {
        "same_as_or": "XOR and OR differ when both bits are 1.",
        "addition": "Bitwise XOR is not arithmetic addition.",
        "always_zero": "XOR is zero only when the two values are identical bit-for-bit."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_xor_from_or",
    "prompt": "How are XOR and OR different?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "distinguish_xor_from_or",
        "role": "primary"
      }
    ],
    "title": "Distinguish XOR from OR",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which statement correctly distinguishes XOR from OR?",
    "answerFeedback": "Correct. When both input bits are 1, OR returns 1 but XOR returns 0.",
    "options": [
      {
        "id": "xor_differs_or_in_both_one_case",
        "text": "For a bit column with 1 and 1, OR gives 1 but XOR gives 0.",
        "isCorrect": true
      },
      {
        "id": "same_as_or",
        "text": "XOR and OR always produce the same result.",
        "isCorrect": false
      },
      {
        "id": "addition",
        "text": "XOR adds the two input numbers normally.",
        "isCorrect": false
      },
      {
        "id": "always_zero",
        "text": "XOR always returns zero.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The expression toggles the same value twice, so it returns to the original value.",
      "mentalModelCorrection": "XORing with the same value twice cancels the toggle: (x ^ y) ^ y = x.",
      "mistakeTypes": [
        "xor_toggle_reversibility_missed",
        "xor_identity_misunderstood"
      ],
      "nextAction": "Use self-cancellation to simplify repeated XOR with the same operand.",
      "result": "diagnostic",
      "distractorExplanations": {
        "returns_y": "The two y terms cancel, leaving x, not y.",
        "returns_zero": "The whole expression becomes zero only if x is also zero.",
        "returns_x_xor_y": "That would be after one XOR with y, not after two."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "understand_xor_toggle_reversibility",
    "prompt": "What happens when the same XOR toggle is applied twice?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "understand_xor_toggle_reversibility",
        "role": "primary"
      }
    ],
    "title": "Understand XOR toggle reversibility",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What does (x ^ y) ^ y simplify to?",
    "answerFeedback": "Correct. The two y values cancel, leaving x.",
    "options": [
      {
        "id": "returns_x",
        "text": "x.",
        "isCorrect": true
      },
      {
        "id": "returns_y",
        "text": "y.",
        "isCorrect": false
      },
      {
        "id": "returns_zero",
        "text": "0.",
        "isCorrect": false
      },
      {
        "id": "returns_x_xor_y",
        "text": "x ^ y.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The final result is the same because XOR cancellation can be regrouped.",
      "mentalModelCorrection": "For cancellation-style reasoning, XOR accumulation can process values in any order.",
      "mistakeTypes": [
        "xor_order_independence_missed",
        "xor_trace_error"
      ],
      "nextAction": "Group equal terms together even when the original order is different.",
      "result": "diagnostic",
      "distractorExplanations": {
        "different_result": "The order changes the intermediate accumulator states, not the final XOR result.",
        "only_sorted": "Sorting is not required for XOR cancellation.",
        "adjacent_pairs_only": "Equal values do not need to be adjacent to cancel."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_xor_order_independence",
    "prompt": "What explains the same XOR result for reordered values?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_xor_order_independence",
        "role": "primary"
      }
    ],
    "title": "Apply XOR order independence",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Why do [2, 7, 2, 9, 9] and [9, 2, 9, 2, 7] have the same XOR accumulation result?",
    "answerFeedback": "Correct. The values are the same multiset, and XOR cancellation is order-independent.",
    "options": [
      {
        "id": "same_multiset_order_irrelevant",
        "text": "They contain the same values, and XOR result does not depend on order.",
        "isCorrect": true
      },
      {
        "id": "different_result",
        "text": "They must produce different results because the order differs.",
        "isCorrect": false
      },
      {
        "id": "only_sorted",
        "text": "They match only if both arrays are sorted first.",
        "isCorrect": false
      },
      {
        "id": "adjacent_pairs_only",
        "text": "They match only when equal values are adjacent.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "If every value appears an even number of times, equal values can be paired and every pair cancels under XOR.",
      "mentalModelCorrection": "Even occurrence counts imply the total XOR is zero, but the reverse is not safe for arbitrary inputs. A zero XOR result alone does not prove every value appeared an even number of times.",
      "mistakeTypes": [
        "parity_model_missed",
        "xor_frequency_confused"
      ],
      "nextAction": "Use XOR cancellation as a consequence of a known parity guarantee, not as a complete proof of even frequency for arbitrary values.",
      "result": "diagnostic",
      "distractorExplanations": {
        "proves_even_counts": "A zero XOR result alone is not enough to prove every value has even frequency; different odd-occurring values can XOR to zero.",
        "needs_sorting": "Sorting is not required for the cancellation consequence. Equal pairs cancel regardless of order.",
        "stores_exact_counts": "XOR does not store exact counts. It only preserves parity-style cancellation effects."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "use_xor_for_even_odd_cancellation_check",
    "prompt": "What does a known even-occurrence guarantee imply about total XOR?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "use_xor_for_even_odd_cancellation_check",
        "role": "primary"
      }
    ],
    "title": "Use XOR as a consequence of even occurrence",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "If every value in a list appears an even number of times, what must be true about the XOR of all values?",
    "answerFeedback": "Correct. Every equal pair cancels under XOR, so known even occurrences imply a total XOR of zero.",
    "options": [
      {
        "id": "all_cancel_to_zero",
        "text": "The XOR of all values must be 0 because all equal pairs cancel.",
        "isCorrect": true
      },
      {
        "id": "proves_even_counts",
        "text": "A total XOR of 0 always proves every value appeared an even number of times in arbitrary input.",
        "isCorrect": false
      },
      {
        "id": "needs_sorting",
        "text": "The values must be sorted before this cancellation consequence can hold.",
        "isCorrect": false
      },
      {
        "id": "stores_exact_counts",
        "text": "The final XOR stores the exact count of each value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The problem asks for values appearing at least twice, which is not a parity-only question.",
      "mentalModelCorrection": "XOR is not a universal duplicate detector. It does not return all duplicated values or their counts.",
      "mistakeTypes": [
        "xor_overused_for_duplicates",
        "frequency_need_missed"
      ],
      "nextAction": "When the output is a set of duplicate values, consider hash set/map or sorting rather than XOR.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_xor": "XOR cancellation may erase duplicate pairs rather than report them.",
        "use_parity_only": "Parity cannot distinguish values appearing twice from values appearing zero times.",
        "use_mask_for_values": "A simple bit mask only works for a small fixed value universe and still would not store arbitrary counts."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_xor_for_arbitrary_duplicate_reporting",
    "prompt": "Why not use XOR to report all duplicates?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reject_xor_for_arbitrary_duplicate_reporting",
        "role": "primary"
      }
    ],
    "title": "Reject XOR for arbitrary duplicate reporting",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task asks you to return all values that appear at least twice. Why is XOR not the right default?",
    "answerFeedback": "Correct. XOR cancels parity patterns; it does not report all duplicated values.",
    "options": [
      {
        "id": "xor_does_not_report_duplicates",
        "text": "XOR does not preserve enough information to list all duplicated values.",
        "isCorrect": true
      },
      {
        "id": "use_xor",
        "text": "XOR is the default for every duplicate-reporting task.",
        "isCorrect": false
      },
      {
        "id": "use_parity_only",
        "text": "Parity alone tells exactly which values appeared at least twice.",
        "isCorrect": false
      },
      {
        "id": "use_mask_for_values",
        "text": "A single mask always stores arbitrary duplicate counts for all integers.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task asks for the one odd-occurring value while all others have even occurrence counts.",
      "mentalModelCorrection": "XOR can find the value with odd occurrence when every other value has even occurrence.",
      "mistakeTypes": [
        "odd_occurrence_signal_missed",
        "xor_assumption_invalid"
      ],
      "nextAction": "Verify that exactly one odd-occurring value is guaranteed.",
      "result": "diagnostic",
      "distractorExplanations": {
        "need_exact_counts": "Exact counts are not necessary if the only output is the one odd-occurring value.",
        "invalid_because_three": "A value appearing three times still has odd parity and remains under XOR.",
        "sorting_required": "Sorting is not required for order-independent XOR cancellation."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_one_odd_occurring_value_signal",
    "prompt": "Which signal fits one odd-occurring value?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_one_odd_occurring_value_signal",
        "role": "primary"
      }
    ],
    "title": "Recognize one odd-occurring value",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Every value appears an even number of times except one value that appears an odd number of times. Which approach is structurally appropriate?",
    "answerFeedback": "Correct. Even occurrences cancel and the one odd-occurring value remains.",
    "options": [
      {
        "id": "xor_all_values",
        "text": "XOR all values.",
        "isCorrect": true
      },
      {
        "id": "need_exact_counts",
        "text": "Exact frequency counts are required for this parity-only output.",
        "isCorrect": false
      },
      {
        "id": "invalid_because_three",
        "text": "XOR works only for values appearing once, never three or five times.",
        "isCorrect": false
      },
      {
        "id": "sorting_required",
        "text": "Sorting is required because XOR depends on adjacency.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The accumulator changes by XORing each value, so equal values eventually cancel.",
      "mentalModelCorrection": "Trace XOR accumulation as a running cancellation state, not as a sum.",
      "mistakeTypes": [
        "xor_trace_error",
        "xor_confused_with_addition"
      ],
      "nextAction": "After each step, simplify repeated equal values where possible.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_sum": "XOR accumulation is not arithmetic summation.",
        "result_zero": "The unpaired 5 remains after the two 3s cancel.",
        "result_last": "The result is not simply the last value unless previous values cancel appropriately."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_xor_accumulator",
    "prompt": "Trace XOR accumulator for [3, 5, 3].",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "trace_xor_accumulator",
        "role": "primary"
      }
    ],
    "title": "Trace a small XOR accumulator",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Starting with acc = 0, what is the final XOR accumulator after processing [3, 5, 3]?",
    "answerFeedback": "Correct. 3 cancels with 3, and 5 remains.",
    "options": [
      {
        "id": "result_five",
        "text": "5.",
        "isCorrect": true
      },
      {
        "id": "result_sum",
        "text": "11.",
        "isCorrect": false
      },
      {
        "id": "result_zero",
        "text": "0.",
        "isCorrect": false
      },
      {
        "id": "result_last",
        "text": "3.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The prompt says one value remains after pair cancellation, so XOR directly matches the guarantee.",
      "mentalModelCorrection": "Choose XOR when the problem statement gives a cancellation contract; choose frequency counting when it asks for counts or arbitrary duplicate reporting.",
      "mistakeTypes": [
        "pattern_choice_confused",
        "xor_assumption_invalid"
      ],
      "nextAction": "Compare the output requirement against what XOR preserves: parity/cancellation only.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_map_required": "A hash map is valid but not necessary when the cancellation guarantee directly identifies one value.",
        "sorting_required": "Sorting is unnecessary because XOR cancellation is order-independent.",
        "prefix_sums": "Prefix sums solve range aggregation, not global pair cancellation."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_xor_when_cancellation_contract_matches",
    "prompt": "Which method best uses the exact pair-cancellation contract?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_xor_when_cancellation_contract_matches",
        "role": "primary"
      }
    ],
    "title": "Choose XOR when the contract matches",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A prompt guarantees: every value appears exactly twice except one value that appears once. Which solution choice best uses the guarantee?",
    "answerFeedback": "Correct. The guarantee exactly matches XOR pair cancellation.",
    "options": [
      {
        "id": "xor_cancellation",
        "text": "XOR all values so pairs cancel and the single value remains.",
        "isCorrect": true
      },
      {
        "id": "hash_map_required",
        "text": "Use a hash map because XOR cannot use pair guarantees.",
        "isCorrect": false
      },
      {
        "id": "sorting_required",
        "text": "Sort first because equal values must be adjacent for XOR to work.",
        "isCorrect": false
      },
      {
        "id": "prefix_sums",
        "text": "Use prefix sums because the answer is accumulated.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The prompt does not guarantee that all non-answer values cancel in pairs.",
      "mentalModelCorrection": "XOR is unsafe when the input assumptions do not enforce a clean cancellation structure.",
      "mistakeTypes": [
        "xor_assumption_invalid",
        "xor_overused_for_duplicates"
      ],
      "nextAction": "Look for exact pair/odd-occurrence guarantees before choosing XOR.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_xor_anyway": "Without cancellation guarantees, the final XOR may be a meaningless mixture of values.",
        "sort_unneeded": "Sorting may help with duplicates, but the key issue is that XOR assumptions are absent.",
        "parity_enough": "Parity is not enough if the requested answer depends on exact values/counts."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-019-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_xor_without_cancellation_contract",
    "prompt": "Why is XOR invalid for arbitrary most-frequent-value tasks?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "reject_xor_without_cancellation_contract",
        "role": "primary"
      }
    ],
    "title": "Reject XOR without a cancellation contract",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "An array can contain values with arbitrary occurrence counts, and the task asks for the most frequent value. Why should you not use XOR as the main method?",
    "answerFeedback": "Correct. There is no pair/odd-occurrence guarantee, and the task needs frequency information.",
    "options": [
      {
        "id": "no_cancellation_contract",
        "text": "There is no cancellation guarantee, and frequency information is required.",
        "isCorrect": true
      },
      {
        "id": "use_xor_anyway",
        "text": "XOR always returns the most frequent value.",
        "isCorrect": false
      },
      {
        "id": "sort_unneeded",
        "text": "XOR fails only because the array is not sorted.",
        "isCorrect": false
      },
      {
        "id": "parity_enough",
        "text": "Odd/even parity is enough to identify the most frequent value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The output only needs parity state, so a bit can flip each time the condition appears.",
      "mentalModelCorrection": "Parity reasoning keeps odd/even state and intentionally discards exact counts.",
      "mistakeTypes": [
        "parity_model_missed",
        "frequency_need_overestimated"
      ],
      "nextAction": "If exact counts are unnecessary, look for a toggle-state representation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "exact_count_required": "Exact counts are more information than the prompt requires.",
        "xor_not_parity": "XOR toggling is a direct way to represent parity.",
        "sort_first": "Sorting is not required to toggle parity state."
      }
    },
    "id": "alg-bit-manipulation-xor-patterns-and-parity-020-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_parity_over_frequency_when_counts_not_needed",
    "prompt": "Which model fits odd/even category occurrence?",
    "roadmapNodeId": "bit_manipulation",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "bit_manipulation",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_parity_over_frequency_when_counts_not_needed",
        "role": "primary"
      }
    ],
    "title": "Choose parity when exact counts are unnecessary",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task only asks whether each small category appears an odd number of times, not how many times it appears. Which reasoning is best?",
    "answerFeedback": "Correct. Track odd/even parity, for example by toggling one bit per category.",
    "options": [
      {
        "id": "track_parity",
        "text": "Track parity by toggling category state.",
        "isCorrect": true
      },
      {
        "id": "exact_count_required",
        "text": "Store exact counts because parity cannot answer odd/even questions.",
        "isCorrect": false
      },
      {
        "id": "xor_not_parity",
        "text": "Avoid XOR because it cannot model toggling.",
        "isCorrect": false
      },
      {
        "id": "sort_first",
        "text": "Sort categories before any odd/even reasoning is possible.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
