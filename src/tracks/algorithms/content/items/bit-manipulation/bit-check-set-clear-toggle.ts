import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const bitCheckSetClearToggleQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The task asks whether a bit is already set, so the operation should isolate that bit without changing the number.",
      "mentalModelCorrection": "Use n & mask to check a bit. AND keeps only the masked bit and clears the rest in the temporary result.",
      "mistakeTypes": [
        "bit_operation_confused",
        "uses_mutating_operation_for_check"
      ],
      "nextAction": "Separate read operations from write operations: checking uses AND, not OR, XOR, or assignment.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_or": "OR forces the masked bit to 1. Checking whether n | mask is nonzero does not tell you whether the bit was already set.",
        "use_xor": "XOR toggles the bit. It changes the bit state instead of checking it.",
        "use_shift_only": "A shift can create the mask, but it does not check the bit by itself."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "check_bit_with_and_mask",
    "prompt": "Which operation checks whether a masked bit is set?",
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
        "nodeId": "check_bit_with_and_mask",
        "role": "primary"
      }
    ],
    "title": "Check a bit with AND",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You have a number n and a mask with exactly one bit set. Which operation checks whether that bit is set in n?",
    "answerFeedback": "Correct. n & mask isolates the target bit; if the result is nonzero, the bit is set.",
    "options": [
      {
        "id": "use_and",
        "text": "Use n & mask and check whether the result is nonzero.",
        "isCorrect": true
      },
      {
        "id": "use_or",
        "text": "Use n | mask and check whether the result is nonzero.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "Use n ^ mask and check whether the result is smaller.",
        "isCorrect": false
      },
      {
        "id": "use_shift_only",
        "text": "Use 1 << mask and check whether it equals n.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The target bit is position 2, so the mask is 0b0100. ANDing with the mask isolates only that bit.",
      "mentalModelCorrection": "A bit is set when n & mask is nonzero. The temporary result may equal the mask when the mask has one bit set.",
      "mistakeTypes": [
        "bit_check_result_misread",
        "binary_trace_error"
      ],
      "nextAction": "Write the mask under n and keep only positions where both have 1.",
      "result": "diagnostic",
      "distractorExplanations": {
        "zero_result": "0b1101 has bit position 2 set, so AND with 0b0100 is not zero.",
        "use_full_number": "AND with a single-bit mask cannot return all of n. It keeps only the masked bit.",
        "wrong_position": "Position 2 is the 4s bit, not the 2s bit."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "check_bit_with_and_mask",
    "prompt": "How should you interpret 0b1101 & 0b0100?",
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
        "nodeId": "check_bit_with_and_mask",
        "role": "primary"
      }
    ],
    "title": "Interpret a nonzero bit check",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "For n = 0b1101, what does n & 0b0100 tell you?",
    "answerFeedback": "Correct. 0b1101 & 0b0100 equals 0b0100, so bit position 2 is set.",
    "options": [
      {
        "id": "bit_is_set",
        "text": "The result is nonzero, so bit position 2 is set.",
        "isCorrect": true
      },
      {
        "id": "zero_result",
        "text": "The result is zero, so bit position 2 is not set.",
        "isCorrect": false
      },
      {
        "id": "use_full_number",
        "text": "The result is 0b1101 because the mask only checks the number.",
        "isCorrect": false
      },
      {
        "id": "wrong_position",
        "text": "The result checks bit position 1 because 0b0100 is the second visible 1 slot.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The desired result must force the target bit to 1 while leaving all other bits unchanged.",
      "mentalModelCorrection": "Use n | mask to set a bit. OR with 1 forces the target bit to 1; OR with 0 preserves other bits.",
      "mistakeTypes": [
        "bit_operation_confused",
        "toggle_used_for_set"
      ],
      "nextAction": "For each bit operation, name the desired effect first: force to 1, force to 0, flip, or read.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_and": "AND is used to check or keep selected bits. It does not force the target bit to 1.",
        "use_xor": "XOR toggles the bit. If the bit was already 1, XOR would clear it.",
        "use_and_not": "AND with a negated mask clears the bit, which is the opposite of setting it."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "set_bit_with_or_mask",
    "prompt": "Which expression sets the masked bit?",
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
        "nodeId": "set_bit_with_or_mask",
        "role": "primary"
      }
    ],
    "title": "Set a bit with OR",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which operation should you use to set a target bit to 1 while preserving all other bits?",
    "answerFeedback": "Correct. n | mask sets the target bit to 1 and preserves unrelated bits.",
    "options": [
      {
        "id": "use_or",
        "text": "n | mask.",
        "isCorrect": true
      },
      {
        "id": "use_and",
        "text": "n & mask.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "n ^ mask.",
        "isCorrect": false
      },
      {
        "id": "use_and_not",
        "text": "n & ~mask.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The target bit is currently 0 and must become 1, while existing 1s must stay unchanged.",
      "mentalModelCorrection": "OR with a single-bit mask only forces that bit to 1. It does not disturb positions where the mask has 0.",
      "mistakeTypes": [
        "binary_trace_error",
        "unrelated_bits_modified"
      ],
      "nextAction": "Trace OR column by column: 1 in the mask forces 1; 0 in the mask preserves n.",
      "result": "diagnostic",
      "distractorExplanations": {
        "unchanged": "Bit position 0 is 0 in n but 1 in the mask, so OR sets it.",
        "clears_other_bits": "OR with 0 preserves other bits. It does not clear them.",
        "toggles_bit": "That is XOR behavior. OR sets the bit and leaves it set."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "set_bit_with_or_mask",
    "prompt": "Compute 0b1010 | 0b0001.",
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
        "nodeId": "set_bit_with_or_mask",
        "role": "primary"
      }
    ],
    "title": "Trace setting a low bit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the result of setting bit position 0 in n = 0b1010?",
    "answerFeedback": "Correct. 0b1010 | 0b0001 equals 0b1011.",
    "options": [
      {
        "id": "result_1011",
        "text": "0b1011.",
        "isCorrect": true
      },
      {
        "id": "unchanged",
        "text": "0b1010.",
        "isCorrect": false
      },
      {
        "id": "clears_other_bits",
        "text": "0b0001.",
        "isCorrect": false
      },
      {
        "id": "toggles_bit",
        "text": "0b1000.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The bit is already 1, and setting should keep it 1 rather than flipping it.",
      "mentalModelCorrection": "Setting is idempotent: applying n | mask again keeps the bit set. XOR is not setting because it flips 1 to 0.",
      "mistakeTypes": [
        "toggle_used_for_set",
        "idempotence_missed"
      ],
      "nextAction": "Ask whether repeating the operation should keep the same result. If yes, it is not toggle.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_xor": "XOR would clear an already-set bit, so it is not a safe set operation.",
        "use_and_not": "AND with a negated mask clears the bit.",
        "use_and": "AND with the mask isolates the bit; it does not preserve the full number with the bit set."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "set_bit_with_or_mask",
    "prompt": "Which expression forces bit position 2 to 1?",
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
        "nodeId": "set_bit_with_or_mask",
        "role": "primary"
      }
    ],
    "title": "Do not use toggle as set",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need an operation that makes bit position 2 equal to 1 even if it is already 1. Which operation has that behavior?",
    "answerFeedback": "Correct. n | (1 << 2) ensures bit position 2 is 1 and stays 1 if it was already set.",
    "options": [
      {
        "id": "use_or",
        "text": "n | (1 << 2).",
        "isCorrect": true
      },
      {
        "id": "use_xor",
        "text": "n ^ (1 << 2).",
        "isCorrect": false
      },
      {
        "id": "use_and_not",
        "text": "n & ~(1 << 2).",
        "isCorrect": false
      },
      {
        "id": "use_and",
        "text": "n & (1 << 2).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The desired result must force the target bit to 0 while preserving all other bits.",
      "mentalModelCorrection": "Use n & ~mask to clear a bit. The negated mask has 0 at the target bit and 1 everywhere else.",
      "mistakeTypes": [
        "bit_operation_confused",
        "clear_mask_missing_negation"
      ],
      "nextAction": "For clearing, build the target mask first, negate it, then AND with n.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_and_mask": "n & mask keeps only the target bit and clears unrelated bits. It does not clear only the target bit.",
        "use_or": "OR sets a bit to 1. It cannot force the target bit to 0.",
        "use_xor": "XOR flips the bit. If the bit is already 0, XOR would set it to 1."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "clear_bit_with_and_not_mask",
    "prompt": "Which expression clears the masked bit?",
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
        "nodeId": "clear_bit_with_and_not_mask",
        "role": "primary"
      }
    ],
    "title": "Clear a bit with AND-not",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which operation clears a target bit while preserving all other bits?",
    "answerFeedback": "Correct. n & ~mask clears the target bit and preserves unrelated bits.",
    "options": [
      {
        "id": "use_and_not",
        "text": "n & ~mask.",
        "isCorrect": true
      },
      {
        "id": "use_and_mask",
        "text": "n & mask.",
        "isCorrect": false
      },
      {
        "id": "use_or",
        "text": "n | mask.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "n ^ mask.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The target bit is position 1, so the mask is 0b0010 and the clearing mask preserves everything except that bit.",
      "mentalModelCorrection": "Clearing a bit should only change that one bit to 0. Other 1s in n must remain 1.",
      "mistakeTypes": [
        "clear_mask_missing_negation",
        "unrelated_bits_modified"
      ],
      "nextAction": "Check the result by verifying that only the target bit changed.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_0010": "That is n & mask, which keeps only the target bit. It destroys unrelated bits.",
        "result_1011": "That leaves the target bit unchanged instead of clearing it.",
        "result_1000": "That clears more than the target bit. Bit position 0 should be preserved."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "clear_bit_with_and_not_mask",
    "prompt": "Clear bit position 1 in 0b1011.",
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
        "nodeId": "clear_bit_with_and_not_mask",
        "role": "primary"
      }
    ],
    "title": "Trace clearing a bit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the result of clearing bit position 1 in n = 0b1011?",
    "answerFeedback": "Correct. Clearing bit position 1 changes 0b1011 to 0b1001.",
    "options": [
      {
        "id": "result_1001",
        "text": "0b1001.",
        "isCorrect": true
      },
      {
        "id": "result_0010",
        "text": "0b0010.",
        "isCorrect": false
      },
      {
        "id": "result_1011",
        "text": "0b1011.",
        "isCorrect": false
      },
      {
        "id": "result_1000",
        "text": "0b1000.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The bit should be 0 after the operation whether it starts as 0 or 1.",
      "mentalModelCorrection": "Clear is also idempotent: n & ~mask keeps the target bit at 0 if it was already 0.",
      "mistakeTypes": [
        "toggle_used_for_clear",
        "idempotence_missed"
      ],
      "nextAction": "Use clear when the final state must be 0; use toggle only when the final state should depend on the original state.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_xor": "XOR would set the bit to 1 if it was originally 0, so it is not a clear operation.",
        "use_or": "OR forces the bit to 1, which is the opposite of clearing.",
        "use_and_mask": "AND with the mask keeps only the target bit and removes unrelated bits."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "clear_bit_with_and_not_mask",
    "prompt": "Which expression forces bit position 3 to 0?",
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
        "nodeId": "clear_bit_with_and_not_mask",
        "role": "primary"
      }
    ],
    "title": "Do not use toggle as clear",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need bit position 3 to be 0 after the operation, regardless of its previous value. Which expression is correct?",
    "answerFeedback": "Correct. n & ~(1 << 3) guarantees bit position 3 is cleared.",
    "options": [
      {
        "id": "use_and_not",
        "text": "n & ~(1 << 3).",
        "isCorrect": true
      },
      {
        "id": "use_xor",
        "text": "n ^ (1 << 3).",
        "isCorrect": false
      },
      {
        "id": "use_or",
        "text": "n | (1 << 3).",
        "isCorrect": false
      },
      {
        "id": "use_and_mask",
        "text": "n & (1 << 3).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The desired result is to flip the target bit: 1 becomes 0 and 0 becomes 1.",
      "mentalModelCorrection": "Use n ^ mask to toggle a bit. XOR with 1 flips the bit; XOR with 0 preserves unrelated bits.",
      "mistakeTypes": [
        "bit_operation_confused",
        "set_clear_confused_with_toggle"
      ],
      "nextAction": "Use toggle only when the desired final bit depends on the original bit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_or": "OR only forces the bit to 1. It does not flip 1 back to 0.",
        "use_and_not": "AND with a negated mask only clears the bit. It does not flip 0 to 1.",
        "use_and": "AND checks or isolates a bit. It does not toggle the bit in the original number."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "toggle_bit_with_xor_mask",
    "prompt": "Which expression flips the masked bit?",
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
        "nodeId": "toggle_bit_with_xor_mask",
        "role": "primary"
      }
    ],
    "title": "Toggle a bit with XOR",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which operation toggles a target bit while preserving all other bits?",
    "answerFeedback": "Correct. n ^ mask flips the target bit and preserves unrelated bits.",
    "options": [
      {
        "id": "use_xor",
        "text": "n ^ mask.",
        "isCorrect": true
      },
      {
        "id": "use_or",
        "text": "n | mask.",
        "isCorrect": false
      },
      {
        "id": "use_and_not",
        "text": "n & ~mask.",
        "isCorrect": false
      },
      {
        "id": "use_and",
        "text": "n & mask.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Bit position 3 is currently 1, and toggle should flip it to 0 while leaving position 0 set.",
      "mentalModelCorrection": "XOR with the mask flips only the target bit. Other positions are preserved because XOR with 0 leaves them unchanged.",
      "mistakeTypes": [
        "binary_trace_error",
        "unrelated_bits_modified"
      ],
      "nextAction": "Trace XOR column by column: mask 1 flips, mask 0 preserves.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_1001": "That leaves bit position 3 unchanged. Toggle must flip it.",
        "result_0000": "Toggle should not clear unrelated bit position 0.",
        "result_1011": "That would set another bit rather than flipping only bit position 3."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "toggle_bit_with_xor_mask",
    "prompt": "Compute 0b1001 ^ 0b1000.",
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
        "nodeId": "toggle_bit_with_xor_mask",
        "role": "primary"
      }
    ],
    "title": "Trace toggling a set bit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the result of toggling bit position 3 in n = 0b1001?",
    "answerFeedback": "Correct. 0b1001 ^ 0b1000 equals 0b0001.",
    "options": [
      {
        "id": "result_0001",
        "text": "0b0001.",
        "isCorrect": true
      },
      {
        "id": "result_1001",
        "text": "0b1001.",
        "isCorrect": false
      },
      {
        "id": "result_0000",
        "text": "0b0000.",
        "isCorrect": false
      },
      {
        "id": "result_1011",
        "text": "0b1011.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Bit position 2 is currently 0, so toggling it should turn it into 1.",
      "mentalModelCorrection": "Toggle is not the same as clear. XOR flips the target bit in either direction.",
      "mistakeTypes": [
        "toggle_confused_with_clear",
        "binary_trace_error"
      ],
      "nextAction": "Before toggling, identify whether the current target bit is 0 or 1.",
      "result": "diagnostic",
      "distractorExplanations": {
        "unchanged": "XOR with a 1 in the mask flips the target bit, so the number changes.",
        "clear_result": "The target bit is already 0; clearing would leave it 0, but toggling sets it to 1.",
        "set_wrong_bit": "The mask 0b0100 targets position 2, not position 1."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "toggle_bit_with_xor_mask",
    "prompt": "Compute 0b1011 ^ 0b0100.",
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
        "nodeId": "toggle_bit_with_xor_mask",
        "role": "primary"
      }
    ],
    "title": "Trace toggling an unset bit",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What is the result of toggling bit position 2 in n = 0b1011?",
    "answerFeedback": "Correct. Bit position 2 is 0 in 0b1011, so toggling it produces 0b1111.",
    "options": [
      {
        "id": "result_1111",
        "text": "0b1111.",
        "isCorrect": true
      },
      {
        "id": "unchanged",
        "text": "0b1011.",
        "isCorrect": false
      },
      {
        "id": "clear_result",
        "text": "0b1011 because toggling only clears bits.",
        "isCorrect": false
      },
      {
        "id": "set_wrong_bit",
        "text": "0b1001.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Toggling the same bit twice flips it once and then flips it back.",
      "mentalModelCorrection": "XOR toggle is reversible: applying the same mask twice returns the original value.",
      "mistakeTypes": [
        "toggle_semantics_misunderstood",
        "idempotence_missed"
      ],
      "nextAction": "Do not treat toggle like set or clear; repeated toggle changes state each time.",
      "result": "diagnostic",
      "distractorExplanations": {
        "stays_toggled": "That would be true for setting, not toggling. A second toggle flips the bit back.",
        "always_zero": "XOR with a mask twice cancels the mask, but it does not erase the whole number.",
        "always_mask": "The result depends on the original n; the mask is not the final value."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "toggle_bit_with_xor_mask",
    "prompt": "What is (n ^ mask) ^ mask?",
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
        "nodeId": "toggle_bit_with_xor_mask",
        "role": "primary"
      }
    ],
    "title": "Understand repeated toggle",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "What happens if you apply n ^ mask and then apply ^ mask again with the same mask?",
    "answerFeedback": "Correct. Toggling the same bit twice returns the original value.",
    "options": [
      {
        "id": "returns_original",
        "text": "The value returns to the original n.",
        "isCorrect": true
      },
      {
        "id": "stays_toggled",
        "text": "The bit stays toggled after the second operation.",
        "isCorrect": false
      },
      {
        "id": "always_zero",
        "text": "The whole value always becomes 0.",
        "isCorrect": false
      },
      {
        "id": "always_mask",
        "text": "The whole value always becomes mask.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The requirement says force to 1, not flip. The final state should not depend on the original bit.",
      "mentalModelCorrection": "Choose OR for force-to-1 and XOR for flip. The distinction is whether the final bit is fixed or depends on its prior state.",
      "mistakeTypes": [
        "set_clear_confused_with_toggle",
        "operation_goal_misread"
      ],
      "nextAction": "Rewrite the goal as one of: read, force 1, force 0, or flip.",
      "result": "diagnostic",
      "distractorExplanations": {
        "flip_with_xor": "XOR makes the final value depend on the previous bit. That violates the force-to-1 requirement.",
        "clear_with_and_not": "This forces the bit to 0, not 1.",
        "check_with_and": "AND only reads or isolates the bit. It does not preserve n while forcing the bit to 1."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_bit_operation_by_goal",
    "prompt": "Which operation enables a flag regardless of its previous value?",
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
        "nodeId": "choose_bit_operation_by_goal",
        "role": "primary"
      }
    ],
    "title": "Choose set over toggle",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A feature flag must be enabled after the operation regardless of whether it was already enabled. Which operation matches the goal?",
    "answerFeedback": "Correct. Enabling a flag is a force-to-1 operation, so use OR with that flag's mask.",
    "options": [
      {
        "id": "force_one_with_or",
        "text": "Use n | flagMask.",
        "isCorrect": true
      },
      {
        "id": "flip_with_xor",
        "text": "Use n ^ flagMask.",
        "isCorrect": false
      },
      {
        "id": "clear_with_and_not",
        "text": "Use n & ~flagMask.",
        "isCorrect": false
      },
      {
        "id": "check_with_and",
        "text": "Use n & flagMask as the new stored value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The requirement says disable the flag, so the final bit must be 0 independent of its previous value.",
      "mentalModelCorrection": "Choose AND with a negated mask for force-to-0. Toggle is wrong when the final disabled state is required.",
      "mistakeTypes": [
        "toggle_used_for_clear",
        "operation_goal_misread"
      ],
      "nextAction": "If the required final bit is known, do not use toggle.",
      "result": "diagnostic",
      "distractorExplanations": {
        "flip_with_xor": "XOR would enable the flag if it was previously disabled.",
        "set_with_or": "OR enables the flag, which is the opposite of the requirement.",
        "check_with_and": "AND with the mask isolates the flag but loses unrelated state."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_bit_operation_by_goal",
    "prompt": "Which operation disables a flag regardless of its previous value?",
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
        "nodeId": "choose_bit_operation_by_goal",
        "role": "primary"
      }
    ],
    "title": "Choose clear over toggle",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A feature flag must be disabled after the operation regardless of whether it was already disabled. Which operation matches the goal?",
    "answerFeedback": "Correct. Disabling a flag is a force-to-0 operation, so use n & ~flagMask.",
    "options": [
      {
        "id": "force_zero_with_and_not",
        "text": "Use n & ~flagMask.",
        "isCorrect": true
      },
      {
        "id": "flip_with_xor",
        "text": "Use n ^ flagMask.",
        "isCorrect": false
      },
      {
        "id": "set_with_or",
        "text": "Use n | flagMask.",
        "isCorrect": false
      },
      {
        "id": "check_with_and",
        "text": "Use n & flagMask as the new stored value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The requirement says switch the current state, so enabled should become disabled and disabled should become enabled.",
      "mentalModelCorrection": "Choose XOR for flip behavior. OR and clear force fixed final states instead of switching.",
      "mistakeTypes": [
        "set_clear_confused_with_toggle",
        "operation_goal_misread"
      ],
      "nextAction": "Use toggle when the desired final state is the opposite of the current state.",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_with_or": "OR only enables the flag. It does not turn an enabled flag off.",
        "clear_with_and_not": "AND with a negated mask only disables the flag. It does not turn a disabled flag on.",
        "check_with_and": "AND checks or isolates. It does not switch the stored flag."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_bit_operation_by_goal",
    "prompt": "Which operation switches a flag to the opposite state?",
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
        "nodeId": "choose_bit_operation_by_goal",
        "role": "primary"
      }
    ],
    "title": "Choose toggle for switching state",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A setting should switch from on to off or from off to on whenever the user taps it. Which operation matches that behavior?",
    "answerFeedback": "Correct. Switching state is toggle behavior, so use XOR with the flag mask.",
    "options": [
      {
        "id": "flip_with_xor",
        "text": "Use n ^ flagMask.",
        "isCorrect": true
      },
      {
        "id": "set_with_or",
        "text": "Use n | flagMask.",
        "isCorrect": false
      },
      {
        "id": "clear_with_and_not",
        "text": "Use n & ~flagMask.",
        "isCorrect": false
      },
      {
        "id": "check_with_and",
        "text": "Use n & flagMask as the new stored value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The result should answer a question, not become the new stored flags value.",
      "mentalModelCorrection": "Checking with n & mask is a read. Do not assign that isolated value back unless you intentionally want to discard unrelated bits.",
      "mistakeTypes": [
        "uses_check_as_update",
        "unrelated_bits_modified"
      ],
      "nextAction": "Distinguish temporary check results from persisted updated state.",
      "result": "diagnostic",
      "distractorExplanations": {
        "assign_and_result": "Assigning n & mask would erase every unrelated bit.",
        "use_or": "OR would enable the flag instead of only checking it.",
        "use_xor": "XOR would toggle the flag instead of only checking it."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "check_bit_with_and_mask",
    "prompt": "What is the key caution when using n & mask as a check?",
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
        "nodeId": "check_bit_with_and_mask",
        "role": "primary"
      }
    ],
    "title": "Do not store a check result as state",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You only need to know whether a permission flag is present in n. What should you avoid doing?",
    "answerFeedback": "Correct. n & mask is a temporary check result; assigning it back would discard unrelated flags.",
    "options": [
      {
        "id": "avoid_assigning_and_result",
        "text": "Avoid replacing n with n & mask unless you intend to discard all other flags.",
        "isCorrect": true
      },
      {
        "id": "assign_and_result",
        "text": "Always replace n with n & mask after checking.",
        "isCorrect": false
      },
      {
        "id": "use_or",
        "text": "Use n | mask because checking should enable the flag first.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "Use n ^ mask because checking should flip the flag first.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The mask has 0s in unrelated positions, so OR preserves those positions from n.",
      "mentalModelCorrection": "Set operations should preserve unrelated bits. If unrelated bits disappear, you probably used AND with the mask instead of OR.",
      "mistakeTypes": [
        "unrelated_bits_modified",
        "bit_operation_confused"
      ],
      "nextAction": "After setting a bit, compare all unrelated positions with the original n.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_0100": "That keeps only the target bit and loses unrelated bits. It looks like n & mask, not setting.",
        "result_1000": "That clears too much. Setting bit position 2 should not remove bit position 3.",
        "result_1100": "The target bit is already set in this result, but the original low bit was lost."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-017-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_unrelated_bits",
    "prompt": "What is 0b1001 | 0b0100?",
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
        "nodeId": "preserve_unrelated_bits",
        "role": "primary"
      }
    ],
    "title": "Preserve unrelated bits when setting",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Set bit position 2 in n = 0b1001. Which result preserves unrelated bits?",
    "answerFeedback": "Correct. 0b1001 | 0b0100 equals 0b1101; unrelated bits remain unchanged.",
    "options": [
      {
        "id": "result_1101",
        "text": "0b1101.",
        "isCorrect": true
      },
      {
        "id": "result_0100",
        "text": "0b0100.",
        "isCorrect": false
      },
      {
        "id": "result_1000",
        "text": "0b1000.",
        "isCorrect": false
      },
      {
        "id": "result_1100",
        "text": "0b1100.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "Clearing one bit should only change the target bit to 0; other 1s should remain.",
      "mentalModelCorrection": "The negated mask is what preserves unrelated bits during clear. ANDing with the unnegated mask keeps the wrong part.",
      "mistakeTypes": [
        "clear_mask_missing_negation",
        "unrelated_bits_modified"
      ],
      "nextAction": "For clear operations, verify that the target bit changed and unrelated bits did not.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_0010": "That is the isolated cleared target bit, not the updated full value.",
        "result_0000": "That clears unrelated bits too.",
        "result_1110": "That clears bit position 0, not bit position 1."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-018-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_unrelated_bits",
    "prompt": "What is the result of clearing bit position 1 in 0b1111?",
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
        "nodeId": "preserve_unrelated_bits",
        "role": "primary"
      }
    ],
    "title": "Preserve unrelated bits when clearing",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Clear bit position 1 in n = 0b1111. Which result preserves unrelated bits?",
    "answerFeedback": "Correct. Clearing bit position 1 changes 0b1111 to 0b1101.",
    "options": [
      {
        "id": "result_1101",
        "text": "0b1101.",
        "isCorrect": true
      },
      {
        "id": "result_0010",
        "text": "0b0010.",
        "isCorrect": false
      },
      {
        "id": "result_0000",
        "text": "0b0000.",
        "isCorrect": false
      },
      {
        "id": "result_1110",
        "text": "0b1110.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The target bit is named by position, so the first step is to build the single-bit mask with 1 << position.",
      "mentalModelCorrection": "Named bit-position operations usually have two steps: create the mask with 1 << k, then apply AND, OR, AND-not, or XOR based on the goal.",
      "mistakeTypes": [
        "mask_construction_missing",
        "operation_goal_misread"
      ],
      "nextAction": "Write the operation as goal + mask: set means OR with 1 << k.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_position_directly": "The position number is not the mask. Position 3 must become 1 << 3.",
        "use_xor": "XOR toggles the bit instead of forcing it to 1.",
        "use_and_not": "AND-not clears the bit instead of setting it."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-019-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "build_mask_then_apply_operation",
    "prompt": "Which expression sets bit position k?",
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
        "nodeId": "build_mask_then_apply_operation",
        "role": "primary"
      }
    ],
    "title": "Build a mask before setting",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to set bit position k in n. Which expression correctly combines mask construction and the set operation?",
    "answerFeedback": "Correct. 1 << k builds the mask, and OR sets that bit.",
    "options": [
      {
        "id": "or_shift_mask",
        "text": "n | (1 << k).",
        "isCorrect": true
      },
      {
        "id": "use_position_directly",
        "text": "n | k.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "n ^ (1 << k).",
        "isCorrect": false
      },
      {
        "id": "use_and_not",
        "text": "n & ~(1 << k).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The goal is a read, and the bit is named by position k, so build 1 << k and use AND.",
      "mentalModelCorrection": "Checking a bit from a position uses (n & (1 << k)) !== 0. Do not confuse the position number k with the mask.",
      "mistakeTypes": [
        "mask_construction_missing",
        "bit_operation_confused"
      ],
      "nextAction": "Turn the position into a mask first, then use the read operation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "compare_to_k": "k is the position, not the mask value. The mask is 1 << k.",
        "use_or": "OR would set the bit before checking, which destroys the original signal.",
        "use_xor": "XOR would flip the bit before checking, which changes the state."
      }
    },
    "id": "alg-bit-manipulation-bit-check-set-clear-toggle-020-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "build_mask_then_apply_operation",
    "prompt": "How do you check bit position k?",
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
        "nodeId": "build_mask_then_apply_operation",
        "role": "primary"
      }
    ],
    "title": "Build a mask before checking",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "Which expression correctly checks whether bit position k is set in n?",
    "answerFeedback": "Correct. 1 << k builds the target mask, and AND checks whether that bit is present.",
    "options": [
      {
        "id": "and_shift_mask_nonzero",
        "text": "(n & (1 << k)) !== 0.",
        "isCorrect": true
      },
      {
        "id": "compare_to_k",
        "text": "(n & k) !== 0.",
        "isCorrect": false
      },
      {
        "id": "use_or",
        "text": "(n | (1 << k)) !== 0.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "(n ^ (1 << k)) !== 0.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
