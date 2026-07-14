import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const powersOfTwoAndLowbitQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A positive power of two has exactly one set bit in binary.",
      "mentalModelCorrection": "Power-of-two reasoning is binary-structure reasoning: 1, 2, 4, 8, 16 each have one 1 bit and all other bits are 0.",
      "mistakeTypes": [
        "power_of_two_model_confused",
        "binary_representation_misread"
      ],
      "nextAction": "Write the number in binary and count whether exactly one bit is set.",
      "result": "diagnostic",
      "distractorExplanations": {
        "even_number": "Many even numbers are not powers of two. For example, 6 is 0b110 and has two set bits.",
        "decimal_ends_zero": "Decimal notation does not determine power-of-two status.",
        "any_single_digit": "A decimal digit is not the same as a binary set bit."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_power_of_two_binary_shape",
    "prompt": "What binary property identifies a positive power of two?",
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
        "nodeId": "recognize_power_of_two_binary_shape",
        "role": "primary"
      }
    ],
    "title": "Recognize the binary shape of a power of two",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which statement best describes the binary shape of a positive power of two?",
    "answerFeedback": "Correct. A positive power of two has exactly one set bit.",
    "options": [
      {
        "id": "exactly_one_set_bit",
        "text": "It has exactly one set bit.",
        "isCorrect": true
      },
      {
        "id": "even_number",
        "text": "It is any even number.",
        "isCorrect": false
      },
      {
        "id": "decimal_ends_zero",
        "text": "It is any decimal number ending in 0.",
        "isCorrect": false
      },
      {
        "id": "any_single_digit",
        "text": "It is any one-digit decimal number.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "8 is binary 1000, so it has exactly one set bit.",
      "mentalModelCorrection": "To classify powers of two, count set bits in the binary representation, not decimal factors or digits.",
      "mistakeTypes": [
        "binary_representation_misread",
        "power_of_two_model_confused"
      ],
      "nextAction": "Convert the value to binary and check whether exactly one bit is 1.",
      "result": "diagnostic",
      "distractorExplanations": {
        "not_power_even_only": "Being even is not the reason, but 8 is still a power of two because it has one set bit.",
        "not_power_many_zeros": "Zeros do not disqualify it. Powers of two have one 1 and the rest 0s.",
        "depends_on_decimal": "Decimal appearance is not the deciding signal."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_power_of_two_binary_shape",
    "prompt": "What makes 0b1000 a power-of-two shape?",
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
        "nodeId": "recognize_power_of_two_binary_shape",
        "role": "primary"
      }
    ],
    "title": "Classify a simple power of two",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "8 is binary 0b1000. Why is it a power of two?",
    "answerFeedback": "Correct. 0b1000 has exactly one set bit, so 8 is a power of two.",
    "options": [
      {
        "id": "one_set_bit",
        "text": "It has exactly one set bit.",
        "isCorrect": true
      },
      {
        "id": "not_power_even_only",
        "text": "It is not a power of two; it is only even.",
        "isCorrect": false
      },
      {
        "id": "not_power_many_zeros",
        "text": "It is not a power of two because it has several zeros.",
        "isCorrect": false
      },
      {
        "id": "depends_on_decimal",
        "text": "It depends on how the decimal digit 8 is written.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "12 is binary 1100, so it has two set bits, not one.",
      "mentalModelCorrection": "A positive number with more than one set bit is not a power of two.",
      "mistakeTypes": [
        "power_of_two_model_confused",
        "binary_representation_misread"
      ],
      "nextAction": "Count set bits before relying on evenness or divisibility.",
      "result": "diagnostic",
      "distractorExplanations": {
        "power_because_even": "Evenness is not enough. 12 is even but has two set bits.",
        "power_because_divisible_by_four": "Divisibility by 4 is not enough. 12 is divisible by 4 but not a power of two.",
        "decimal_reason": "Decimal appearance does not define power-of-two structure."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_power_of_two_binary_shape",
    "prompt": "What disqualifies 0b1100 from being a power of two?",
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
        "nodeId": "recognize_power_of_two_binary_shape",
        "role": "primary"
      }
    ],
    "title": "Reject a non-power with multiple set bits",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "12 is binary 0b1100. Why is it not a power of two?",
    "answerFeedback": "Correct. 0b1100 has two set bits, so 12 is not a power of two.",
    "options": [
      {
        "id": "two_set_bits",
        "text": "It has more than one set bit.",
        "isCorrect": true
      },
      {
        "id": "power_because_even",
        "text": "It is a power of two because it is even.",
        "isCorrect": false
      },
      {
        "id": "power_because_divisible_by_four",
        "text": "It is a power of two because it is divisible by 4.",
        "isCorrect": false
      },
      {
        "id": "decimal_reason",
        "text": "It depends only on the decimal digits 1 and 2.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The expression n & (n - 1) removes the lowest set bit; a power of two has only one set bit, so the result becomes zero.",
      "mentalModelCorrection": "For positive n, (n & (n - 1)) === 0 checks whether n had exactly one set bit.",
      "mistakeTypes": [
        "power_of_two_check_incomplete",
        "kernighan_step_misunderstood"
      ],
      "nextAction": "Connect the expression to removing one set bit rather than memorizing the formula.",
      "result": "diagnostic",
      "distractorExplanations": {
        "checks_even": "The expression is not an evenness check. It tests whether removing the lowest set bit leaves nothing.",
        "isolates_lowbit": "n & (n - 1) removes the lowest set bit. It does not isolate it.",
        "works_without_positive_condition": "The expression alone misclassifies zero unless n > 0 is also checked."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "test_power_of_two_with_and_n_minus_one",
    "prompt": "What does n & (n - 1) reveal for a positive power of two?",
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
        "nodeId": "test_power_of_two_with_and_n_minus_one",
        "role": "primary"
      }
    ],
    "title": "Explain the power-of-two bit test",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "For positive n, why does (n & (n - 1)) === 0 indicate that n is a power of two?",
    "answerFeedback": "Correct. A positive power of two has one set bit, so removing the lowest set bit leaves 0.",
    "options": [
      {
        "id": "removing_only_set_bit_leaves_zero",
        "text": "Removing its only set bit leaves zero.",
        "isCorrect": true
      },
      {
        "id": "checks_even",
        "text": "It checks whether n is even.",
        "isCorrect": false
      },
      {
        "id": "isolates_lowbit",
        "text": "It isolates the lowest set bit and checks whether that bit is zero.",
        "isCorrect": false
      },
      {
        "id": "works_without_positive_condition",
        "text": "It proves every n, including 0, is a valid power of two.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The expression (n & (n - 1)) === 0 is also true for n = 0, but zero is not a power of two.",
      "mentalModelCorrection": "A correct power-of-two check needs n > 0 and (n & (n - 1)) === 0.",
      "mistakeTypes": [
        "zero_case_mishandled",
        "power_of_two_check_incomplete"
      ],
      "nextAction": "Always include the positive-number guard before accepting the n & (n - 1) result.",
      "result": "diagnostic",
      "distractorExplanations": {
        "expression_only": "This misclassifies zero because the bit expression is also zero for n = 0.",
        "n_nonnegative": "n >= 0 still allows zero, which is not a power of two.",
        "count_even": "Evenness is not enough to classify powers of two."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "require_positive_for_power_of_two_check",
    "prompt": "Which power-of-two condition handles zero correctly?",
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
        "nodeId": "require_positive_for_power_of_two_check",
        "role": "primary"
      }
    ],
    "title": "Guard the power-of-two check with n > 0",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which condition correctly checks whether n is a power of two for small non-negative integers?",
    "answerFeedback": "Correct. n > 0 excludes zero, and the bit expression checks for exactly one set bit.",
    "options": [
      {
        "id": "positive_and_expression",
        "text": "n > 0 && (n & (n - 1)) === 0.",
        "isCorrect": true
      },
      {
        "id": "expression_only",
        "text": "(n & (n - 1)) === 0.",
        "isCorrect": false
      },
      {
        "id": "n_nonnegative",
        "text": "n >= 0 && (n & (n - 1)) === 0.",
        "isCorrect": false
      },
      {
        "id": "count_even",
        "text": "n % 2 === 0.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The value zero has no set bits, but powers of two require exactly one set bit.",
      "mentalModelCorrection": "Zero is not a power of two. The bit trick must be paired with n > 0.",
      "mistakeTypes": [
        "zero_case_mishandled",
        "power_of_two_model_confused"
      ],
      "nextAction": "Check the conceptual definition before applying the formula.",
      "result": "diagnostic",
      "distractorExplanations": {
        "yes_expression_zero": "The expression becoming zero is not enough; zero has no set bits.",
        "yes_even": "Zero being even does not make it a power of two.",
        "depends_on_runtime": "For this conceptual check, zero is not a power of two regardless of runtime."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_zero_in_power_of_two_check",
    "prompt": "How should the zero case be handled?",
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
        "nodeId": "handle_zero_in_power_of_two_check",
        "role": "primary"
      }
    ],
    "title": "Do not classify zero as a power of two",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Should n = 0 be classified as a power of two?",
    "answerFeedback": "Correct. Zero has no set bits, so it is not a power of two.",
    "options": [
      {
        "id": "no_zero_has_no_set_bits",
        "text": "No. Zero has no set bits.",
        "isCorrect": true
      },
      {
        "id": "yes_expression_zero",
        "text": "Yes, because (0 & (0 - 1)) is zero.",
        "isCorrect": false
      },
      {
        "id": "yes_even",
        "text": "Yes, because zero is even.",
        "isCorrect": false
      },
      {
        "id": "depends_on_runtime",
        "text": "It depends on whether the language supports bitwise operators.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The lowest set bit in 0b10100 is at position 2, so removing it leaves only the bit at position 4.",
      "mentalModelCorrection": "n & (n - 1) removes the lowest set bit and preserves higher set bits.",
      "mistakeTypes": [
        "kernighan_trace_error",
        "lowbit_operation_confused"
      ],
      "nextAction": "Locate the lowest 1 bit first, then clear only that bit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "isolate_lowbit": "0b00100 is the isolated lowest set bit, not the result of removing it.",
        "clear_all": "The operation removes one set bit, not all set bits.",
        "no_change": "The lowest set bit should be removed, so the value changes."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "remove_lowest_set_bit_with_n_and_n_minus_one",
    "prompt": "Compute 0b10100 & (0b10100 - 1).",
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
        "nodeId": "remove_lowest_set_bit_with_n_and_n_minus_one",
        "role": "primary"
      }
    ],
    "title": "Remove the lowest set bit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the result of applying n & (n - 1) to n = 0b10100?",
    "answerFeedback": "Correct. The lowest set bit is removed, so 0b10100 becomes 0b10000.",
    "options": [
      {
        "id": "result_10000",
        "text": "0b10000.",
        "isCorrect": true
      },
      {
        "id": "isolate_lowbit",
        "text": "0b00100.",
        "isCorrect": false
      },
      {
        "id": "clear_all",
        "text": "0b00000.",
        "isCorrect": false
      },
      {
        "id": "no_change",
        "text": "0b10100.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The expression removes one set bit per application, specifically the lowest set bit.",
      "mentalModelCorrection": "n & (n - 1) is a remove-lowest-set-bit operation, not a clear-all operation.",
      "mistakeTypes": [
        "kernighan_step_misunderstood",
        "lowbit_operation_confused"
      ],
      "nextAction": "After one step, check that exactly one 1 bit disappeared.",
      "result": "diagnostic",
      "distractorExplanations": {
        "removes_highest": "The lowest set bit is removed, not the highest set bit.",
        "removes_all": "Only one set bit is removed per application.",
        "isolates_lowest": "That describes n & -n, not n & (n - 1)."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "remove_lowest_set_bit_with_n_and_n_minus_one",
    "prompt": "How should you describe n & (n - 1)?",
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
        "nodeId": "remove_lowest_set_bit_with_n_and_n_minus_one",
        "role": "primary"
      }
    ],
    "title": "Name the remove-lowest-set-bit identity",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the precise effect of n & (n - 1) for positive n?",
    "answerFeedback": "Correct. n & (n - 1) removes the lowest set bit.",
    "options": [
      {
        "id": "removes_lowest_set_bit",
        "text": "It removes the lowest set bit.",
        "isCorrect": true
      },
      {
        "id": "removes_highest",
        "text": "It removes the highest set bit.",
        "isCorrect": false
      },
      {
        "id": "removes_all",
        "text": "It removes all set bits at once.",
        "isCorrect": false
      },
      {
        "id": "isolates_lowest",
        "text": "It isolates only the lowest set bit.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "0b1000 has only one set bit, so removing the lowest set bit removes the only set bit.",
      "mentalModelCorrection": "When n is a positive power of two, n & (n - 1) becomes zero because there are no other set bits left.",
      "mistakeTypes": [
        "power_of_two_check_incomplete",
        "kernighan_trace_error"
      ],
      "nextAction": "Trace a power of two as a special case of removing the only set bit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_1000": "The set bit is removed, so the value cannot remain unchanged.",
        "result_0100": "The operation does not shift the set bit down; it removes it.",
        "result_1111": "Subtracting 1 may create lower 1s, but the final AND with n removes them."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "test_power_of_two_with_and_n_minus_one",
    "prompt": "Trace n & (n - 1) for n = 0b1000.",
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
        "nodeId": "test_power_of_two_with_and_n_minus_one",
        "role": "primary"
      }
    ],
    "title": "Trace the identity on a power of two",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is 0b1000 & (0b1000 - 1)?",
    "answerFeedback": "Correct. 0b1000 & 0b0111 equals 0b0000.",
    "options": [
      {
        "id": "result_zero",
        "text": "0b0000.",
        "isCorrect": true
      },
      {
        "id": "result_1000",
        "text": "0b1000.",
        "isCorrect": false
      },
      {
        "id": "result_0100",
        "text": "0b0100.",
        "isCorrect": false
      },
      {
        "id": "result_1111",
        "text": "0b1111.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "0b1100 has two set bits. Removing the lowest one leaves another set bit, so the result is nonzero.",
      "mentalModelCorrection": "A non-power of two with multiple set bits remains nonzero after one lowest-set-bit removal.",
      "mistakeTypes": [
        "power_of_two_check_incomplete",
        "kernighan_trace_error"
      ],
      "nextAction": "Check whether any set bit remains after removing the lowest set bit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_zero": "That would happen for a positive power of two, not for 0b1100.",
        "isolate_lowbit": "0b0100 is the isolated lowbit, not the remove-lowest result.",
        "result_1111": "The final AND does not create all lower bits."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "test_power_of_two_with_and_n_minus_one",
    "prompt": "Trace n & (n - 1) for n = 0b1100.",
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
        "nodeId": "test_power_of_two_with_and_n_minus_one",
        "role": "primary"
      }
    ],
    "title": "Trace the identity on a non-power",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is 0b1100 & (0b1100 - 1)?",
    "answerFeedback": "Correct. 0b1100 & 0b1011 equals 0b1000, so another set bit remains.",
    "options": [
      {
        "id": "result_1000",
        "text": "0b1000.",
        "isCorrect": true
      },
      {
        "id": "result_zero",
        "text": "0b0000.",
        "isCorrect": false
      },
      {
        "id": "isolate_lowbit",
        "text": "0b0100.",
        "isCorrect": false
      },
      {
        "id": "result_1111",
        "text": "0b1111.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The question asks to isolate the lowest set bit, not remove it.",
      "mentalModelCorrection": "For small positive n, n & -n isolates the lowest set bit. n & (n - 1) removes it.",
      "mistakeTypes": [
        "lowbit_operation_confused",
        "remove_vs_isolate_confused"
      ],
      "nextAction": "Name whether the desired result should keep only the lowbit or remove it from n.",
      "result": "diagnostic",
      "distractorExplanations": {
        "remove_lowbit": "n & (n - 1) removes the lowest set bit; it does not return the bit itself.",
        "use_or": "OR does not isolate the lowest set bit.",
        "use_xor": "XOR with n - 1 is not the introduced lowbit identity."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "isolate_lowbit_with_n_and_negative_n",
    "prompt": "Which expression isolates lowbit?",
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
        "nodeId": "isolate_lowbit_with_n_and_negative_n",
        "role": "primary"
      }
    ],
    "title": "Use n & -n to isolate lowbit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "For small positive n, which expression isolates the lowest set bit when the identity has been introduced?",
    "answerFeedback": "Correct. n & -n keeps only the lowest set bit.",
    "options": [
      {
        "id": "n_and_negative_n",
        "text": "n & -n.",
        "isCorrect": true
      },
      {
        "id": "remove_lowbit",
        "text": "n & (n - 1).",
        "isCorrect": false
      },
      {
        "id": "use_or",
        "text": "n | (n - 1).",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "n ^ (n - 1).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The lowest set bit in 0b10100 is 0b00100.",
      "mentalModelCorrection": "n & -n returns a mask containing only the lowest set bit.",
      "mistakeTypes": [
        "lowbit_trace_error",
        "remove_vs_isolate_confused"
      ],
      "nextAction": "Find the rightmost 1 bit and keep only that bit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "remove_lowbit_result": "0b10000 is the result of removing the lowest set bit, not isolating it.",
        "full_value": "Lowbit isolation should not keep all set bits.",
        "zero_result": "The number has a set bit, so isolating the lowest one should not produce zero."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "isolate_lowbit_with_n_and_negative_n",
    "prompt": "Trace lowbit isolation for 0b10100.",
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
        "nodeId": "isolate_lowbit_with_n_and_negative_n",
        "role": "primary"
      }
    ],
    "title": "Trace lowbit isolation",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "For small positive n, what does n & -n produce for n = 0b10100?",
    "answerFeedback": "Correct. The lowest set bit is 0b00100, so n & -n returns 0b00100.",
    "options": [
      {
        "id": "result_00100",
        "text": "0b00100.",
        "isCorrect": true
      },
      {
        "id": "remove_lowbit_result",
        "text": "0b10000.",
        "isCorrect": false
      },
      {
        "id": "full_value",
        "text": "0b10100.",
        "isCorrect": false
      },
      {
        "id": "zero_result",
        "text": "0b00000.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "One expression removes the lowest set bit; the other keeps only the lowest set bit.",
      "mentalModelCorrection": "Do not merge the two identities: n & (n - 1) removes lowbit, while n & -n isolates lowbit.",
      "mistakeTypes": [
        "lowbit_operation_confused",
        "remove_vs_isolate_confused"
      ],
      "nextAction": "State the desired output shape: original number minus lowbit, or only lowbit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "both_remove": "n & -n does not remove lowbit; it returns lowbit.",
        "both_isolate": "n & (n - 1) does not isolate lowbit; it removes it.",
        "both_power_test_only": "The remove identity can support a power-of-two check, but the two expressions have different direct effects."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_remove_lowbit_from_isolate_lowbit",
    "prompt": "How do the two lowbit identities differ?",
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
        "nodeId": "distinguish_remove_lowbit_from_isolate_lowbit",
        "role": "primary"
      }
    ],
    "title": "Distinguish removing and isolating lowbit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which distinction between n & (n - 1) and n & -n is correct for small positive n?",
    "answerFeedback": "Correct. n & (n - 1) removes the lowest set bit; n & -n isolates it.",
    "options": [
      {
        "id": "remove_vs_isolate",
        "text": "n & (n - 1) removes lowbit; n & -n isolates lowbit.",
        "isCorrect": true
      },
      {
        "id": "both_remove",
        "text": "Both expressions remove the lowest set bit.",
        "isCorrect": false
      },
      {
        "id": "both_isolate",
        "text": "Both expressions isolate the lowest set bit.",
        "isCorrect": false
      },
      {
        "id": "both_power_test_only",
        "text": "Both expressions only test whether n is a power of two.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The algorithm wants to repeatedly remove set bits until none remain.",
      "mentalModelCorrection": "Use n = n & (n - 1) when each step should delete one set bit and make progress toward zero.",
      "mistakeTypes": [
        "lowbit_operation_confused",
        "missing_loop_termination"
      ],
      "nextAction": "For loops, check whether the update reduces the number of set bits.",
      "result": "diagnostic",
      "distractorExplanations": {
        "isolate_lowbit_update": "n = n & -n keeps only the lowest set bit and may stop making the intended progress.",
        "use_or_update": "OR can add bits and does not remove set bits.",
        "use_same_n": "Leaving n unchanged prevents progress toward zero."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "remove_lowest_set_bit_with_n_and_n_minus_one",
    "prompt": "Which update removes one set bit?",
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
        "nodeId": "remove_lowest_set_bit_with_n_and_n_minus_one",
        "role": "primary"
      }
    ],
    "title": "Use the remove-lowbit identity as loop progress",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "In a loop that must remove one set bit from n on each iteration, which update is correct?",
    "answerFeedback": "Correct. n = n & (n - 1) removes one set bit per iteration.",
    "options": [
      {
        "id": "remove_lowbit_update",
        "text": "n = n & (n - 1).",
        "isCorrect": true
      },
      {
        "id": "isolate_lowbit_update",
        "text": "n = n & -n.",
        "isCorrect": false
      },
      {
        "id": "use_or_update",
        "text": "n = n | (n - 1).",
        "isCorrect": false
      },
      {
        "id": "use_same_n",
        "text": "n = n.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task asks for the value of the lowest set bit as its own mask.",
      "mentalModelCorrection": "Use lowbit isolation when you need the bit itself. Use removal when you need to discard it.",
      "mistakeTypes": [
        "remove_vs_isolate_confused",
        "operation_goal_misread"
      ],
      "nextAction": "Before choosing the identity, decide whether the output should include or exclude the lowbit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "remove_identity": "n & (n - 1) excludes the lowbit instead of returning it.",
        "power_check": "The power-of-two check answers a boolean question, not the value of the lowbit.",
        "scan_decimal": "Decimal digits do not identify the binary lowest set bit."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lowbit_operation_by_goal",
    "prompt": "Which identity matches the goal of returning only lowbit?",
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
        "nodeId": "choose_lowbit_operation_by_goal",
        "role": "primary"
      }
    ],
    "title": "Choose isolate when the output is lowbit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need a mask containing only the lowest set bit of n. Which goal-operation pairing is correct?",
    "answerFeedback": "Correct. If the goal is to return the lowest set bit itself, use n & -n.",
    "options": [
      {
        "id": "isolate_goal",
        "text": "Use n & -n because the goal is to isolate lowbit.",
        "isCorrect": true
      },
      {
        "id": "remove_identity",
        "text": "Use n & (n - 1) because the goal is to return lowbit.",
        "isCorrect": false
      },
      {
        "id": "power_check",
        "text": "Use n > 0 && (n & (n - 1)) === 0 because it returns the lowbit value.",
        "isCorrect": false
      },
      {
        "id": "scan_decimal",
        "text": "Use the last decimal digit because it identifies the lowest set bit.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The expression must be explained through binary transition, not used as a memorized spell.",
      "mentalModelCorrection": "n - 1 flips the lowest set bit to 0 and turns lower bits to 1; ANDing with n clears that lowest set bit and preserves higher bits.",
      "mistakeTypes": [
        "formula_memorized_without_model",
        "kernighan_step_misunderstood"
      ],
      "nextAction": "Trace n, n - 1, and their AND on a small binary example.",
      "result": "diagnostic",
      "distractorExplanations": {
        "arithmetic_only": "The subtraction matters because of how it changes binary bits, not because subtraction alone detects powers.",
        "random_trick": "The identity has a specific binary reason; it is not arbitrary.",
        "isolates_lowbit": "This again confuses removal with isolation."
      }
    },
    "id": "alg-bit-manipulation-powers-of-two-and-lowbit-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "explain_lowbit_identity_with_binary_transition",
    "prompt": "What is the binary reason behind n & (n - 1)?",
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
        "nodeId": "explain_lowbit_identity_with_binary_transition",
        "role": "primary"
      }
    ],
    "title": "Explain the binary transition behind n & (n - 1)",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Why does n & (n - 1) remove the lowest set bit?",
    "answerFeedback": "Correct. Subtracting 1 changes the lowest set bit to 0 and makes lower bits 1; ANDing clears that bit while preserving higher bits.",
    "options": [
      {
        "id": "binary_transition_explanation",
        "text": "Because n - 1 flips the lowest set bit to 0 and sets lower bits to 1, then AND clears that lowest set bit.",
        "isCorrect": true
      },
      {
        "id": "arithmetic_only",
        "text": "Because subtracting 1 always divides the number by two.",
        "isCorrect": false
      },
      {
        "id": "random_trick",
        "text": "It is a memorized trick with no useful binary explanation.",
        "isCorrect": false
      },
      {
        "id": "isolates_lowbit",
        "text": "Because ANDing with n - 1 keeps only the lowest set bit.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
