import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const bitCountingAndIterationQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The task asks how many 1 bits are present, so each bit position must be inspected or each set bit must be removed one by one.",
      "mentalModelCorrection": "Counting set bits is about the binary representation of one value, not about scanning input elements.",
      "mistakeTypes": [
        "bit_counting_model_confused",
        "input_size_confused_with_bit_width"
      ],
      "nextAction": "Name whether the loop is over bit positions or over set bits before reasoning about complexity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "count_decimal_digits": "Decimal digits do not tell you how many binary bits are set.",
        "scan_array_items": "There is no array to scan here. The relevant units are bit positions inside the integer.",
        "compare_to_power_of_two": "A power-of-two check only tells you whether exactly one bit is set, not the total count in general."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_set_bit_counting",
    "prompt": "What does set-bit counting iterate over?",
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
        "nodeId": "recognize_set_bit_counting",
        "role": "primary"
      }
    ],
    "title": "Identify the unit in set-bit counting",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to count how many 1 bits appear in the binary representation of a small non-negative integer. What is the core unit you need to reason over?",
    "answerFeedback": "Correct. Set-bit counting reasons over bit positions or directly over the set bits.",
    "options": [
      {
        "id": "bit_positions_or_set_bits",
        "text": "Bit positions, or only the positions whose bits are set.",
        "isCorrect": true
      },
      {
        "id": "count_decimal_digits",
        "text": "Decimal digits in the written number.",
        "isCorrect": false
      },
      {
        "id": "scan_array_items",
        "text": "Array elements, because every counting task scans an array.",
        "isCorrect": false
      },
      {
        "id": "compare_to_power_of_two",
        "text": "Only whether the number is a power of two.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The binary value 10110 has 1s at positions 1, 2, and 4.",
      "mentalModelCorrection": "To count set bits by scanning positions, check each position with a single-bit mask and increment only when the result is nonzero.",
      "mistakeTypes": [
        "binary_representation_misread",
        "bit_counting_trace_error"
      ],
      "nextAction": "Write the bit positions from right to left, then count only the positions containing 1.",
      "result": "diagnostic",
      "distractorExplanations": {
        "count_two": "This misses one of the set bits. 10110 contains three 1 bits.",
        "count_four": "This counts bit positions or width incorrectly, not only the 1 bits.",
        "count_decimal_digits": "The decimal value is not relevant here; count 1s in the binary representation."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "count_set_bits_by_scanning_positions",
    "prompt": "Count the 1 bits in 0b10110.",
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
        "nodeId": "count_set_bits_by_scanning_positions",
        "role": "primary"
      }
    ],
    "title": "Count set bits in a small binary value",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "How many set bits are in 0b10110?",
    "answerFeedback": "Correct. 0b10110 has set bits at positions 1, 2, and 4, so the count is 3.",
    "options": [
      {
        "id": "count_three",
        "text": "3.",
        "isCorrect": true
      },
      {
        "id": "count_two",
        "text": "2.",
        "isCorrect": false
      },
      {
        "id": "count_four",
        "text": "4.",
        "isCorrect": false
      },
      {
        "id": "count_decimal_digits",
        "text": "22, because 0b10110 is decimal 22.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A position scan needs a mask that moves from bit 0 to bit 1 to bit 2 and so on.",
      "mentalModelCorrection": "When scanning bit positions, build the mask as 1 << i and test n & mask for each position.",
      "mistakeTypes": [
        "mask_construction_missing",
        "bit_iteration_wrong_unit"
      ],
      "nextAction": "Use the loop index as a bit position, not as a value to AND directly.",
      "result": "diagnostic",
      "distractorExplanations": {
        "and_i_directly": "i is the position number, not the mask. The mask is 1 << i.",
        "shift_n_by_i_only": "Shifting n may help in some variants, but the described mask scan checks n with 1 << i.",
        "use_or": "OR sets bits. It does not check whether the current bit position is set."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "count_set_bits_by_scanning_positions",
    "prompt": "How do you check bit position i while scanning positions?",
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
        "nodeId": "count_set_bits_by_scanning_positions",
        "role": "primary"
      }
    ],
    "title": "Check each position with a shifting mask",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "In a loop over bit positions i, which expression checks whether position i is set in n?",
    "answerFeedback": "Correct. 1 << i creates the mask for bit position i, and n & mask checks that bit.",
    "options": [
      {
        "id": "and_shift_mask",
        "text": "(n & (1 << i)) !== 0.",
        "isCorrect": true
      },
      {
        "id": "and_i_directly",
        "text": "(n & i) !== 0.",
        "isCorrect": false
      },
      {
        "id": "shift_n_by_i_only",
        "text": "(n << i) !== 0.",
        "isCorrect": false
      },
      {
        "id": "use_or",
        "text": "(n | (1 << i)) !== 0.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The algorithm scans a fixed number of bit positions, even if only a few are set.",
      "mentalModelCorrection": "A fixed-width bit scan is O(w), where w is the number of bit positions considered. It is only O(1) when w is treated as a fixed machine-word constant.",
      "mistakeTypes": [
        "complexity_mismatch",
        "word_size_assumption_missing"
      ],
      "nextAction": "State the word-size assumption explicitly before calling a bit-position scan constant time.",
      "result": "diagnostic",
      "distractorExplanations": {
        "always_o1": "This hides the word-size assumption. The loop still scans w positions.",
        "o_set_bits": "A full position scan does not skip unset bits, so it depends on word width, not only set-bit count.",
        "o_n_array": "There is no input array length n in this operation unless the problem has many numbers."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_bit_scan_complexity",
    "prompt": "What is the time complexity of scanning all w bit positions?",
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
        "nodeId": "reason_about_bit_scan_complexity",
        "role": "primary"
      }
    ],
    "title": "State complexity of a full bit-position scan",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "An algorithm scans all w bit positions of one integer and checks each position. What is the most precise time complexity?",
    "answerFeedback": "Correct. The scan checks w bit positions. It can be treated as O(1) only when w is a fixed machine-word size.",
    "options": [
      {
        "id": "o_w",
        "text": "O(w), where w is the number of bit positions considered.",
        "isCorrect": true
      },
      {
        "id": "always_o1",
        "text": "Always O(1), with no assumptions needed.",
        "isCorrect": false
      },
      {
        "id": "o_set_bits",
        "text": "O(number of set bits), because unset bits are skipped.",
        "isCorrect": false
      },
      {
        "id": "o_n_array",
        "text": "O(n), where n is the number of array elements.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The expression n & (n - 1) clears exactly the lowest set bit of positive n.",
      "mentalModelCorrection": "Brian Kernighan's algorithm works because each iteration removes one set bit, so the loop count equals the number of set bits.",
      "mistakeTypes": [
        "kernighan_step_misunderstood",
        "lowbit_operation_confused"
      ],
      "nextAction": "Trace the lowest set bit before and after n & (n - 1).",
      "result": "diagnostic",
      "distractorExplanations": {
        "isolates_lowest": "n & (n - 1) removes the lowest set bit. Isolating the lowest set bit is n & -n.",
        "clears_all_bits": "Only one set bit is removed per application.",
        "sets_lowest_zero": "The operation does not set a bit. It removes one existing set bit."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_kernighan_set_bit_counting",
    "prompt": "What is the effect of n & (n - 1)?",
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
        "nodeId": "apply_kernighan_set_bit_counting",
        "role": "primary"
      }
    ],
    "title": "Understand the Kernighan step",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "In Brian Kernighan's set-bit counting algorithm, what does n & (n - 1) do?",
    "answerFeedback": "Correct. n & (n - 1) removes the lowest set bit from n.",
    "options": [
      {
        "id": "removes_lowest_set_bit",
        "text": "It removes the lowest set bit.",
        "isCorrect": true
      },
      {
        "id": "isolates_lowest",
        "text": "It isolates only the lowest set bit.",
        "isCorrect": false
      },
      {
        "id": "clears_all_bits",
        "text": "It clears all set bits at once.",
        "isCorrect": false
      },
      {
        "id": "sets_lowest_zero",
        "text": "It sets the lowest zero bit to 1.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "0b10100 has set bits at positions 2 and 4. The lowest set bit is position 2, so that bit is removed.",
      "mentalModelCorrection": "Applying n & (n - 1) once should produce the same number with exactly the lowest set bit cleared.",
      "mistakeTypes": [
        "kernighan_trace_error",
        "lowbit_operation_confused"
      ],
      "nextAction": "Identify the lowest 1 before applying the expression.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_00100": "That isolates the lowest set bit; it does not remove it from n.",
        "result_00000": "Only one set bit is removed per step, not all set bits.",
        "result_10101": "The operation does not set a new low bit."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_kernighan_set_bit_counting",
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
        "nodeId": "apply_kernighan_set_bit_counting",
        "role": "primary"
      }
    ],
    "title": "Trace one Kernighan step",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the result of one Brian Kernighan step on n = 0b10100?",
    "answerFeedback": "Correct. 0b10100 & 0b10011 equals 0b10000, removing the lowest set bit.",
    "options": [
      {
        "id": "result_10000",
        "text": "0b10000.",
        "isCorrect": true
      },
      {
        "id": "result_00100",
        "text": "0b00100.",
        "isCorrect": false
      },
      {
        "id": "result_00000",
        "text": "0b00000.",
        "isCorrect": false
      },
      {
        "id": "result_10101",
        "text": "0b10101.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Each iteration removes exactly one set bit, so the number of loop iterations equals the number of 1 bits.",
      "mentalModelCorrection": "Kernighan's loop does not run once per bit position. It runs once per set bit until n becomes 0.",
      "mistakeTypes": [
        "kernighan_iteration_count_wrong",
        "bit_iteration_wrong_unit"
      ],
      "nextAction": "Count the 1 bits to predict the number of iterations.",
      "result": "diagnostic",
      "distractorExplanations": {
        "five_iterations": "That counts displayed bit width or positions, but Kernighan skips unset bits.",
        "one_iteration": "One iteration removes one set bit, not all set bits.",
        "until_fixed_width": "The loop stops when n becomes 0, not when a fixed index reaches the word width."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_kernighan_set_bit_counting",
    "prompt": "How many times does Kernighan's loop run for 0b10110?",
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
        "nodeId": "apply_kernighan_set_bit_counting",
        "role": "primary"
      }
    ],
    "title": "Predict Kernighan loop iterations",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "How many iterations does this loop run for n = 0b10110?\n\nwhile (n !== 0) {\n  count++;\n  n = n & (n - 1);\n}",
    "answerFeedback": "Correct. 0b10110 has three set bits, and each iteration removes one.",
    "options": [
      {
        "id": "three_iterations",
        "text": "3 iterations.",
        "isCorrect": true
      },
      {
        "id": "five_iterations",
        "text": "5 iterations.",
        "isCorrect": false
      },
      {
        "id": "one_iteration",
        "text": "1 iteration.",
        "isCorrect": false
      },
      {
        "id": "until_fixed_width",
        "text": "It always runs once for every bit in the machine word.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The loop repeatedly removes one set bit, so runtime depends on how many set bits exist.",
      "mentalModelCorrection": "Brian Kernighan's algorithm is O(s), where s is the number of set bits, not O(w) for all bit positions.",
      "mistakeTypes": [
        "complexity_mismatch",
        "set_bit_iteration_complexity_missed"
      ],
      "nextAction": "Distinguish full-width scans from loops that remove one set bit per iteration.",
      "result": "diagnostic",
      "distractorExplanations": {
        "o_w": "O(w) describes scanning all bit positions. Kernighan skips unset bits.",
        "always_o1": "This hides the number of set bits unless a fixed word-size assumption is explicitly stated.",
        "o_n_array": "This loop operates on one integer, not an array of n elements."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_set_bit_iteration_complexity",
    "prompt": "What does Kernighan loop complexity depend on?",
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
        "nodeId": "reason_about_set_bit_iteration_complexity",
        "role": "primary"
      }
    ],
    "title": "State complexity of set-bit iteration",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the most precise time complexity of Brian Kernighan's set-bit counting loop for one non-negative integer mask?",
    "answerFeedback": "Correct. The loop runs once per set bit, so it is O(s), where s is the number of set bits.",
    "options": [
      {
        "id": "o_s",
        "text": "O(s), where s is the number of set bits.",
        "isCorrect": true
      },
      {
        "id": "o_w",
        "text": "Always O(w), because every bit position is checked.",
        "isCorrect": false
      },
      {
        "id": "always_o1",
        "text": "Always O(1), with no assumptions needed.",
        "isCorrect": false
      },
      {
        "id": "o_n_array",
        "text": "O(n), where n is the number of array elements.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The value has very few set bits compared with the number of possible bit positions.",
      "mentalModelCorrection": "When set bits are sparse, iterating only set bits avoids scanning many zero positions.",
      "mistakeTypes": [
        "wrong_iteration_strategy",
        "sparse_bits_not_recognized"
      ],
      "nextAction": "Compare word width with the expected number of set bits before choosing the iteration method.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_all_positions": "This is correct but may do unnecessary work when only a few bits are set.",
        "use_sorting": "Sorting is unrelated to iterating set bits inside one integer.",
        "use_binary_search": "Binary search does not help when the task is to enumerate set bits in a representation."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_set_bit_iteration_for_sparse_bits",
    "prompt": "Which iteration style fits sparse set bits?",
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
        "nodeId": "choose_set_bit_iteration_for_sparse_bits",
        "role": "primary"
      }
    ],
    "title": "Choose set-bit iteration for sparse masks",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A 32-bit mask usually has only 2 or 3 bits set. You need to process only enabled positions. Which approach best matches the structure?",
    "answerFeedback": "Correct. If only a few bits are set, iterating set bits avoids checking many zero positions.",
    "options": [
      {
        "id": "iterate_set_bits",
        "text": "Repeatedly process one set bit and remove it with mask &= mask - 1.",
        "isCorrect": true
      },
      {
        "id": "scan_all_positions",
        "text": "Always scan all 32 positions even when only a few are enabled.",
        "isCorrect": false
      },
      {
        "id": "use_sorting",
        "text": "Sort the integer bits before scanning them.",
        "isCorrect": false
      },
      {
        "id": "use_binary_search",
        "text": "Use binary search to find the next set bit.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The value is dense, so the benefit of skipping zero bits is small or nonexistent.",
      "mentalModelCorrection": "Set-bit iteration is most useful when there are far fewer set bits than total bit positions. Dense masks can make it similar to a full scan.",
      "mistakeTypes": [
        "sparse_bits_assumption_overgeneralized",
        "wrong_iteration_strategy"
      ],
      "nextAction": "Estimate whether the number of set bits is small relative to word width.",
      "result": "diagnostic",
      "distractorExplanations": {
        "always_better": "Set-bit iteration is not always better. Its loop count is the number of set bits.",
        "sorting_bits": "Sorting bits is not part of either counting strategy.",
        "depends_on_decimal_digits": "Decimal digit count is irrelevant to bit iteration."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_set_bit_iteration_for_sparse_bits",
    "prompt": "How does a dense mask affect the value of set-bit iteration?",
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
        "nodeId": "choose_set_bit_iteration_for_sparse_bits",
        "role": "primary"
      }
    ],
    "title": "Do not overgeneralize sparse-bit iteration",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A mask has almost every bit set across the fixed width. What should you remember when choosing between full bit scan and set-bit iteration?",
    "answerFeedback": "Correct. Set-bit iteration runs once per set bit, so it gives the biggest advantage when set bits are sparse.",
    "options": [
      {
        "id": "dense_reduces_benefit",
        "text": "Set-bit iteration may approach a full scan because many bits are set.",
        "isCorrect": true
      },
      {
        "id": "always_better",
        "text": "Set-bit iteration is always strictly better regardless of density.",
        "isCorrect": false
      },
      {
        "id": "sorting_bits",
        "text": "The dense mask should be sorted before counting.",
        "isCorrect": false
      },
      {
        "id": "depends_on_decimal_digits",
        "text": "The best method depends on how many decimal digits the number has.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The loop condition must stop after all set bits are removed.",
      "mentalModelCorrection": "A Kernighan-style loop terminates when n becomes 0. Each step must update n to n & (n - 1).",
      "mistakeTypes": [
        "missing_loop_termination",
        "kernighan_update_missing"
      ],
      "nextAction": "Verify that every iteration removes one set bit and that zero is the stopping condition.",
      "result": "diagnostic",
      "distractorExplanations": {
        "no_update": "Without updating n, the loop can fail to make progress.",
        "stop_at_one": "Stopping at 1 misses the final set bit. The loop should run while n is nonzero.",
        "loop_fixed_width": "A fixed-width loop is a different strategy. Kernighan's loop is driven by n becoming 0."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "terminate_set_bit_iteration",
    "prompt": "Which Kernighan loop has the correct progress and stopping condition?",
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
        "nodeId": "terminate_set_bit_iteration",
        "role": "primary"
      }
    ],
    "title": "Terminate when no set bits remain",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which loop structure correctly counts set bits for a non-negative integer mask using Brian Kernighan's idea?",
    "answerFeedback": "Correct. The loop runs while n is nonzero and removes one set bit each iteration.",
    "options": [
      {
        "id": "while_nonzero_remove_one",
        "text": "while (n !== 0) { count++; n = n & (n - 1); }",
        "isCorrect": true
      },
      {
        "id": "no_update",
        "text": "while (n !== 0) { count++; }",
        "isCorrect": false
      },
      {
        "id": "stop_at_one",
        "text": "while (n > 1) { count++; n = n & (n - 1); }",
        "isCorrect": false
      },
      {
        "id": "loop_fixed_width",
        "text": "while (i < 32) { count++; n = n & (n - 1); }",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "n = 0 has no set bits, so a while (n !== 0) loop should not run.",
      "mentalModelCorrection": "Zero is the natural termination state for set-bit iteration because there are no remaining 1 bits.",
      "mistakeTypes": [
        "zero_case_mishandled",
        "missing_loop_termination"
      ],
      "nextAction": "Check the zero case before reasoning about the first iteration.",
      "result": "diagnostic",
      "distractorExplanations": {
        "one_iteration": "There is no set bit to remove, so the loop should not run.",
        "infinite_loop": "With the correct condition while (n !== 0), zero stops immediately.",
        "depends_on_width": "Kernighan's loop does not scan a fixed width for zero; it stops because n is zero."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_zero_in_set_bit_counting",
    "prompt": "What happens to the Kernighan loop for n = 0?",
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
        "nodeId": "handle_zero_in_set_bit_counting",
        "role": "primary"
      }
    ],
    "title": "Handle zero in set-bit counting",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "How many iterations should Brian Kernighan's loop run when n = 0?",
    "answerFeedback": "Correct. n = 0 has no set bits, so the loop body should not execute.",
    "options": [
      {
        "id": "zero_iterations",
        "text": "0 iterations.",
        "isCorrect": true
      },
      {
        "id": "one_iteration",
        "text": "1 iteration, because every number has at least one bit position.",
        "isCorrect": false
      },
      {
        "id": "infinite_loop",
        "text": "It loops forever because n & (n - 1) is undefined for zero.",
        "isCorrect": false
      },
      {
        "id": "depends_on_width",
        "text": "It runs once for every bit position in the machine word.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The algorithm processes many integers, and each integer requires a bit-counting operation.",
      "mentalModelCorrection": "When counting bits for an array, separate outer input size from inner bit work: O(n * w) for full scans or O(total set bits) for Kernighan-style counting.",
      "mistakeTypes": [
        "complexity_mismatch",
        "input_size_confused_with_bit_width"
      ],
      "nextAction": "Name both dimensions: number of values and bit work per value.",
      "result": "diagnostic",
      "distractorExplanations": {
        "only_o_n": "This ignores the work needed to count bits inside each integer.",
        "only_o_w": "This ignores the number of integers being processed.",
        "always_o1": "This hides both the array length and the word-size assumption."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_bit_counting_across_inputs",
    "prompt": "What is the complexity of scanning w bits for each of n integers?",
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
        "nodeId": "reason_about_bit_counting_across_inputs",
        "role": "primary"
      }
    ],
    "title": "Separate array length from bit width",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You count set bits for each of n integers by scanning w bit positions per integer. What is the most precise time complexity?",
    "answerFeedback": "Correct. There are n integers, and each scan checks w bit positions.",
    "options": [
      {
        "id": "o_n_times_w",
        "text": "O(n * w).",
        "isCorrect": true
      },
      {
        "id": "only_o_n",
        "text": "O(n), with no other assumption.",
        "isCorrect": false
      },
      {
        "id": "only_o_w",
        "text": "O(w), because only bit width matters.",
        "isCorrect": false
      },
      {
        "id": "always_o1",
        "text": "O(1), because bit operations are constant time.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Kernighan-style counting across many integers runs once per set bit across all values.",
      "mentalModelCorrection": "For multiple numbers, set-bit iteration cost can be described by the total number of set bits processed.",
      "mistakeTypes": [
        "complexity_mismatch",
        "set_bit_iteration_complexity_missed"
      ],
      "nextAction": "When the algorithm removes one set bit per step, sum set bits across all processed values.",
      "result": "diagnostic",
      "distractorExplanations": {
        "o_n_times_w": "That describes full scanning of all positions. Kernighan does not check every zero bit.",
        "only_o_n": "This ignores that each value may contain multiple set bits.",
        "always_o1": "This ignores both the number of values and the number of set bits."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "reason_about_bit_counting_across_inputs",
    "prompt": "What determines total work for Kernighan counting across many integers?",
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
        "nodeId": "reason_about_bit_counting_across_inputs",
        "role": "primary"
      }
    ],
    "title": "Use total set bits for many values",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You count set bits for many non-negative integer masks using n &= n - 1. What does the total runtime primarily depend on?",
    "answerFeedback": "Correct. Each iteration removes one set bit, so total work follows the total number of set bits across all integers.",
    "options": [
      {
        "id": "total_set_bits",
        "text": "The total number of set bits across the processed integers.",
        "isCorrect": true
      },
      {
        "id": "o_n_times_w",
        "text": "Always n times the full bit width, even when bits are sparse.",
        "isCorrect": false
      },
      {
        "id": "only_o_n",
        "text": "Only the number of integers, regardless of their bit patterns.",
        "isCorrect": false
      },
      {
        "id": "always_o1",
        "text": "Always constant time.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The expression n & (n - 1) removes a set bit, so it should be used as an update step, not as the counted bit itself.",
      "mentalModelCorrection": "In Kernighan's algorithm, increment count first, then replace n with n & (n - 1) to remove one set bit.",
      "mistakeTypes": [
        "kernighan_update_missing",
        "bit_counting_trace_error"
      ],
      "nextAction": "Treat n & (n - 1) as progress toward zero, not as a direct 0/1 answer.",
      "result": "diagnostic",
      "distractorExplanations": {
        "add_expression_value": "The expression returns the new n, not one count unit. Adding it to count is wrong.",
        "compare_once_only": "A single comparison does not count all set bits.",
        "use_or_update": "OR can set bits and may prevent progress toward zero."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "apply_kernighan_set_bit_counting",
    "prompt": "What role does n & (n - 1) play in Kernighan counting?",
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
        "nodeId": "apply_kernighan_set_bit_counting",
        "role": "primary"
      }
    ],
    "title": "Use Kernighan as an update step",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "In a set-bit counting loop for a non-negative integer mask, how should n & (n - 1) be used?",
    "answerFeedback": "Correct. Each iteration counts one set bit and updates n to n & (n - 1).",
    "options": [
      {
        "id": "update_n_after_increment",
        "text": "Increment count once, then update n = n & (n - 1).",
        "isCorrect": true
      },
      {
        "id": "add_expression_value",
        "text": "Add n & (n - 1) directly to count.",
        "isCorrect": false
      },
      {
        "id": "compare_once_only",
        "text": "Use it once to decide whether the total count is 0 or 1.",
        "isCorrect": false
      },
      {
        "id": "use_or_update",
        "text": "Replace it with n = n | (n - 1) to move toward zero.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A full scan is simpler and predictable when every bit position must be considered anyway.",
      "mentalModelCorrection": "Full position scanning is appropriate when the task needs every position or when fixed-width clarity matters more than skipping zeros.",
      "mistakeTypes": [
        "wrong_iteration_strategy",
        "set_bit_iteration_overused"
      ],
      "nextAction": "Ask whether the task needs positions that are zero. If yes, set-bit-only iteration may not be enough.",
      "result": "diagnostic",
      "distractorExplanations": {
        "kernighan_only": "Kernighan only visits set bits. It skips zero positions, which may be needed by the task.",
        "sorting_positions": "Sorting does not help inspect fixed bit positions.",
        "hash_set_positions": "A hash set adds unnecessary structure when positions are already implicit in the bit representation."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_bit_position_scan_when_needed",
    "prompt": "Which strategy is best when both zero and one positions must be reported?",
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
        "nodeId": "choose_bit_position_scan_when_needed",
        "role": "primary"
      }
    ],
    "title": "Scan positions when zero bits matter",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to report for every one of 8 positions whether the bit is 0 or 1. Which approach best fits?",
    "answerFeedback": "Correct. Since zero positions matter too, scan all 8 positions with masks.",
    "options": [
      {
        "id": "scan_all_positions",
        "text": "Scan all 8 positions using 1 << i masks.",
        "isCorrect": true
      },
      {
        "id": "kernighan_only",
        "text": "Use n &= n - 1 because only set positions need to be visited.",
        "isCorrect": false
      },
      {
        "id": "sorting_positions",
        "text": "Sort the bit positions before reading them.",
        "isCorrect": false
      },
      {
        "id": "hash_set_positions",
        "text": "Convert every bit into a hash set entry first.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The phrase O(1) is only valid if the integer width is treated as a fixed constant.",
      "mentalModelCorrection": "Bit operations are often constant on fixed machine words, but algorithms that loop over bits still have a loop dimension that should be named.",
      "mistakeTypes": [
        "word_size_assumption_missing",
        "complexity_mismatch"
      ],
      "nextAction": "Write O(w) first, then state when w can be treated as a constant.",
      "result": "diagnostic",
      "distractorExplanations": {
        "unconditional_o1": "This hides the fixed-width assumption and can mislead when width is variable or conceptual.",
        "o_digits": "Decimal digits are not the relevant width for a bit loop.",
        "o_set_bits": "A full-width scan does not depend only on set bits."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_unqualified_constant_time_claims",
    "prompt": "How should you state complexity for a 32-position bit scan?",
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
        "nodeId": "avoid_unqualified_constant_time_claims",
        "role": "primary"
      }
    ],
    "title": "Qualify constant-time bit scans",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A solution loops over 32 bit positions of a JavaScript/TypeScript bitwise integer. Which complexity explanation is safest?",
    "answerFeedback": "Correct. The loop is O(w) in bit width; for JS/TS bitwise integers, w is fixed at 32, so it can be treated as constant with that assumption stated.",
    "options": [
      {
        "id": "o_w_fixed_32_constant",
        "text": "O(w) in bit width; with fixed 32-bit JS/TS bitwise integers, this is treated as O(1).",
        "isCorrect": true
      },
      {
        "id": "unconditional_o1",
        "text": "O(1), and no explanation is needed because bit manipulation is always constant time.",
        "isCorrect": false
      },
      {
        "id": "o_digits",
        "text": "O(number of decimal digits).",
        "isCorrect": false
      },
      {
        "id": "o_set_bits",
        "text": "O(number of set bits), because every zero bit is skipped.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The loop wants to enumerate set positions, but n & (n - 1) only removes a set bit; it does not directly name its index.",
      "mentalModelCorrection": "Kernighan-style removal is enough for counting. If you need the actual position, you also need a way to identify the removed bit or scan/derive its index.",
      "mistakeTypes": [
        "counting_confused_with_enumeration",
        "set_bit_position_not_extracted"
      ],
      "nextAction": "Separate count-only loops from loops that must output the position of each set bit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "count_is_position": "The count value is not the bit position. It only says how many set bits have been seen so far.",
        "removed_value_is_index": "n & (n - 1) gives the updated number, not the index of the removed bit.",
        "decimal_index": "Decimal digit positions are unrelated to binary set-bit positions."
      }
    },
    "id": "alg-bit-manipulation-bit-counting-and-iteration-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_counting_from_set_bit_enumeration",
    "prompt": "What extra reasoning is needed when enumerating set-bit positions?",
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
        "nodeId": "distinguish_counting_from_set_bit_enumeration",
        "role": "primary"
      }
    ],
    "title": "Distinguish counting from enumerating set bits",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to output the positions of all set bits, not just their count. What is the key caution when using n = n & (n - 1)?",
    "answerFeedback": "Correct. n & (n - 1) removes one set bit, but you still need a way to identify which position was removed if positions must be output.",
    "options": [
      {
        "id": "needs_position_extraction",
        "text": "It removes a set bit, but does not by itself report that bit's position.",
        "isCorrect": true
      },
      {
        "id": "count_is_position",
        "text": "The current count is always the position of the removed bit.",
        "isCorrect": false
      },
      {
        "id": "removed_value_is_index",
        "text": "The value n & (n - 1) is directly the removed bit's index.",
        "isCorrect": false
      },
      {
        "id": "decimal_index",
        "text": "The removed position can be read from the decimal digit that changed.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
