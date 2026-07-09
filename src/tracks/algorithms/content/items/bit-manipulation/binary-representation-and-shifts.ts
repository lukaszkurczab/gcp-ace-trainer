export const binaryRepresentationAndShiftsQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The binary form 1101 has 1s in the rightmost bit, the 4s place, and the 8s place.",
      mentalModelCorrection:
        "Bit positions are zero-indexed from the right: position 0 is the 1s bit, position 1 is the 2s bit, position 2 is the 4s bit, and so on.",
      mistakeTypes: ["bit_index_off_by_one", "binary_representation_misread"],
      nextAction:
        "Label binary positions from right to left before naming which bits are set.",
      result: "diagnostic",
      distractorExplanations: {
        one_based_positions:
          "This is the common one-based indexing mistake. Bit positions start at 0, not 1.",
        decimal_digits:
          "Binary digits are not decimal digits. You need to map each 1 to its power-of-two position.",
        left_indexed_positions:
          "The leftmost digit is not position 0. Position 0 is the rightmost bit.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-001",
    learningStage: "foundations",
    primarySkillAtomId: "read_binary_representation",
    prompt:
      "The number 13 is written in binary as 1101. Which bit positions are set?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "positions_0_2_3",
        feedback:
          "Correct. Reading 1101 from right to left gives set bits at positions 0, 2, and 3.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-001-check",
        mistakeTypes: ["bit_index_off_by_one", "binary_representation_misread"],
        options: [
          {
            id: "positions_0_2_3",
            text: "Positions 0, 2, and 3.",
          },
          {
            id: "one_based_positions",
            text: "Positions 1, 3, and 4.",
          },
          {
            id: "decimal_digits",
            text: "Positions 1 and 3 because the decimal number is 13.",
          },
          {
            id: "left_indexed_positions",
            text: "Positions 0, 1, and 3 because the leftmost digit is position 0.",
          },
        ],
        prompt: "For binary 1101, which zero-indexed bit positions contain 1?",
        status: "active",
        testedSkillAtomIds: ["read_binary_representation"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "read_binary_representation",
        role: "primary",
      },
    ],
    title: "Read set bit positions from binary",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The expression 1 << k starts with only bit 0 set, then moves that 1 to position k.",
      mentalModelCorrection:
        "A single-bit mask for position k is created with 1 << k. The position number is zero-indexed.",
      mistakeTypes: ["bit_index_off_by_one", "shift_direction_confused"],
      nextAction:
        "Translate 1 << k as: create a mask whose only set bit is at position k.",
      result: "diagnostic",
      distractorExplanations: {
        position_2:
          "That would be 1 << 2. The shift count is the target bit position.",
        position_4:
          "This treats bit positions as one-based. 1 << 3 targets position 3, not the fourth index after adjustment.",
        three_set_bits:
          "The shift does not create three 1s. It moves one existing 1 into a new position.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-002",
    learningStage: "foundations",
    primarySkillAtomId: "create_single_bit_mask_with_shift",
    prompt: "What does the expression 1 << 3 represent in bit-position terms?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "position_3_mask",
        feedback:
          "Correct. 1 << 3 creates binary 1000, a mask with only bit position 3 set.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-002-check",
        mistakeTypes: ["bit_index_off_by_one", "shift_direction_confused"],
        options: [
          {
            id: "position_3_mask",
            text: "A mask with bit position 3 set.",
          },
          {
            id: "position_2",
            text: "A mask with bit position 2 set.",
          },
          {
            id: "position_4",
            text: "A mask with bit position 4 set.",
          },
          {
            id: "three_set_bits",
            text: "A mask with three bits set.",
          },
        ],
        prompt: "Which bit does 1 << 3 set?",
        status: "active",
        testedSkillAtomIds: ["create_single_bit_mask_with_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "create_single_bit_mask_with_shift",
        role: "primary",
      },
    ],
    title: "Interpret a single-bit shift mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The rightmost bit is already position 0, so shifting by 0 keeps the 1 in place.",
      mentalModelCorrection:
        "1 << 0 is still 1. Position 0 is a valid bit position and means the 1s bit.",
      mistakeTypes: ["bit_index_off_by_one"],
      nextAction:
        "Always include position 0 when reasoning about bit positions.",
      result: "diagnostic",
      distractorExplanations: {
        zero_mask:
          "Shifting by 0 does not remove the bit. It leaves the value unchanged.",
        position_1_mask: "That would be 1 << 1, not 1 << 0.",
        invalid_position: "Position 0 is valid. Bit indexing starts at zero.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-003",
    learningStage: "foundations",
    primarySkillAtomId: "create_single_bit_mask_with_shift",
    prompt: "What is the meaning of 1 << 0?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "position_0_mask",
        feedback:
          "Correct. 1 << 0 creates a mask with the rightmost bit, position 0, set.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-003-check",
        mistakeTypes: ["bit_index_off_by_one"],
        options: [
          {
            id: "position_0_mask",
            text: "A mask with bit position 0 set.",
          },
          {
            id: "zero_mask",
            text: "A mask with no bits set.",
          },
          {
            id: "position_1_mask",
            text: "A mask with bit position 1 set.",
          },
          {
            id: "invalid_position",
            text: "An invalid mask because bit positions start at 1.",
          },
        ],
        prompt: "Which statement correctly describes 1 << 0?",
        status: "active",
        testedSkillAtomIds: ["create_single_bit_mask_with_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "create_single_bit_mask_with_shift",
        role: "primary",
      },
    ],
    title: "Handle bit position zero",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A left shift moves every bit toward a higher position by the shift amount.",
      mentalModelCorrection:
        "For binary reasoning, read n << k as moving set bits k positions to the left, not as editing decimal digits.",
      mistakeTypes: [
        "shift_direction_confused",
        "binary_representation_misread",
      ],
      nextAction: "Track where each set bit moves after the shift.",
      result: "diagnostic",
      distractorExplanations: {
        right_shift_result:
          "That moves bits in the wrong direction. Left shift moves bits toward higher positions.",
        append_decimal_zero:
          "Binary left shift is not decimal string manipulation.",
        unchanged_value:
          "A nonzero left shift changes the bit positions unless shifted bits overflow the fixed width.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-004",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_left_shift",
    prompt:
      "What happens to the set bits in 0b0011 when you compute 0b0011 << 2?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bits_move_two_left",
        feedback:
          "Correct. The set bits at positions 0 and 1 move to positions 2 and 3, producing 0b1100.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-004-check",
        mistakeTypes: [
          "shift_direction_confused",
          "binary_representation_misread",
        ],
        options: [
          {
            id: "bits_move_two_left",
            text: "The set bits move from positions 0 and 1 to positions 2 and 3.",
          },
          {
            id: "right_shift_result",
            text: "The set bits move from positions 0 and 1 down to negative positions and disappear.",
          },
          {
            id: "append_decimal_zero",
            text: "The decimal number gets two zeros appended.",
          },
          {
            id: "unchanged_value",
            text: "The bit positions stay the same because the number of set bits is unchanged.",
          },
        ],
        prompt: "How should you reason about 0b0011 << 2?",
        status: "active",
        testedSkillAtomIds: ["reason_about_left_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "reason_about_left_shift",
        role: "primary",
      },
    ],
    title: "Trace a left shift by positions",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A right shift moves bits toward lower positions, and bits shifted past position 0 are dropped.",
      mentalModelCorrection:
        "Right shift is position movement to the right. For non-negative small values it resembles division by powers of two, but the bit-level model is movement and dropping low bits.",
      mistakeTypes: [
        "shift_direction_confused",
        "arithmetic_shortcut_overgeneralized",
      ],
      nextAction:
        "Before using arithmetic intuition, trace which low bits are discarded.",
      result: "diagnostic",
      distractorExplanations: {
        left_shift_result:
          "That reverses the direction. Right shift moves bits toward lower positions.",
        no_bits_dropped:
          "Right shift can drop low bits that move past position 0.",
        decimal_digit_shift:
          "This is not decimal digit movement. It operates on binary bit positions.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-005",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_right_shift",
    prompt: "How should you interpret 0b1100 >> 2?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bits_move_two_right",
        feedback:
          "Correct. The set bits at positions 2 and 3 move to positions 0 and 1, producing 0b0011.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-005-check",
        mistakeTypes: [
          "shift_direction_confused",
          "arithmetic_shortcut_overgeneralized",
        ],
        options: [
          {
            id: "bits_move_two_right",
            text: "The set bits move two positions toward lower bit positions.",
          },
          {
            id: "left_shift_result",
            text: "The set bits move two positions toward higher bit positions.",
          },
          {
            id: "no_bits_dropped",
            text: "The value keeps all original bit positions and only changes its label.",
          },
          {
            id: "decimal_digit_shift",
            text: "The decimal digits shift two places to the right.",
          },
        ],
        prompt: "What is the correct bit-level interpretation of 0b1100 >> 2?",
        status: "active",
        testedSkillAtomIds: ["reason_about_right_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "reason_about_right_shift",
        role: "primary",
      },
    ],
    title: "Trace a right shift by positions",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A mask for bit position 4 must have the 1 in the 16s place.",
      mentalModelCorrection:
        "The mask for position k is 1 << k. For k = 4, that is binary 10000, decimal 16.",
      mistakeTypes: ["bit_index_off_by_one", "shift_direction_confused"],
      nextAction:
        "Convert the target position into 1 << position before choosing the mask value.",
      result: "diagnostic",
      distractorExplanations: {
        mask_8: "8 is 1 << 3, so it targets position 3, not position 4.",
        mask_4:
          "4 is the position number, not the mask. A bit position must be converted into a power-of-two mask.",
        mask_5:
          "The mask is not the position plus one. It is a single set bit at that position.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-006",
    learningStage: "foundations",
    primarySkillAtomId: "map_bit_position_zero_indexed",
    prompt: "Which decimal mask represents bit position 4?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "mask_16",
        feedback:
          "Correct. Bit position 4 corresponds to 1 << 4, which is binary 10000 and decimal 16.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-006-check",
        mistakeTypes: ["bit_index_off_by_one", "shift_direction_confused"],
        options: [
          {
            id: "mask_16",
            text: "16.",
          },
          {
            id: "mask_8",
            text: "8.",
          },
          {
            id: "mask_4",
            text: "4.",
          },
          {
            id: "mask_5",
            text: "5.",
          },
        ],
        prompt: "What is 1 << 4 as a decimal mask?",
        status: "active",
        testedSkillAtomIds: ["map_bit_position_zero_indexed"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "map_bit_position_zero_indexed",
        role: "primary",
      },
    ],
    title: "Convert a bit position to a mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The binary value 101000 has 1s in the 8s and 32s places.",
      mentalModelCorrection:
        "Read binary from right to left. The rightmost digit is position 0 even when it is 0.",
      mistakeTypes: ["binary_representation_misread", "bit_index_off_by_one"],
      nextAction:
        "Write the positions under the bits before deciding which positions are set.",
      result: "diagnostic",
      distractorExplanations: {
        positions_0_2:
          "Those are the digit indexes if read from the left, not zero-indexed bit positions from the right.",
        positions_2_4:
          "This is one position too low for each set bit in 101000.",
        positions_4_6:
          "This is one-based indexing from the right. Bit positions are zero-indexed.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-007",
    learningStage: "foundations",
    primarySkillAtomId: "read_binary_representation",
    prompt: "In binary 101000, which zero-indexed bit positions are set?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "positions_3_5",
        feedback: "Correct. In 101000, the set bits are at positions 3 and 5.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-007-check",
        mistakeTypes: ["binary_representation_misread", "bit_index_off_by_one"],
        options: [
          {
            id: "positions_3_5",
            text: "Positions 3 and 5.",
          },
          {
            id: "positions_0_2",
            text: "Positions 0 and 2.",
          },
          {
            id: "positions_2_4",
            text: "Positions 2 and 4.",
          },
          {
            id: "positions_4_6",
            text: "Positions 4 and 6.",
          },
        ],
        prompt: "Which positions contain 1 in 0b101000?",
        status: "active",
        testedSkillAtomIds: ["read_binary_representation"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "read_binary_representation",
        role: "primary",
      },
    ],
    title: "Read sparse set bits",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "For small non-negative integers, a left shift by 1 doubles the value because each set bit moves to the next power-of-two place.",
      mentalModelCorrection:
        "The useful model is bit movement. Arithmetic doubling is a consequence for small non-negative values, not the definition of the operator.",
      mistakeTypes: [
        "arithmetic_shortcut_overgeneralized",
        "shift_direction_confused",
      ],
      nextAction:
        "Explain the arithmetic result by showing how bit positions move.",
      result: "diagnostic",
      distractorExplanations: {
        decimal_append:
          "Left shift does not append a decimal zero. It moves binary bits.",
        always_safe_multiply:
          "This overgeneralizes the shortcut. Runtime width and signed conversion can matter.",
        divide_by_two:
          "That describes the usual intuition for right shift on non-negative values, not left shift.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-008",
    learningStage: "foundations",
    primarySkillAtomId: "separate_shift_from_arithmetic_shortcut",
    prompt:
      "For a small non-negative integer like 5, why does 5 << 1 evaluate to 10?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bits_move_one_higher",
        feedback:
          "Correct. 5 is 0b0101; shifting left by 1 moves its set bits to higher positions, giving 0b1010, which is 10.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-008-check",
        mistakeTypes: [
          "arithmetic_shortcut_overgeneralized",
          "shift_direction_confused",
        ],
        options: [
          {
            id: "bits_move_one_higher",
            text: "Each set bit moves one position higher, so the represented value doubles in this small non-negative case.",
          },
          {
            id: "decimal_append",
            text: "The decimal number gets a zero appended.",
          },
          {
            id: "always_safe_multiply",
            text: "Left shift is always identical to multiplication by 2 in every runtime and for every number.",
          },
          {
            id: "divide_by_two",
            text: "The bits move to lower positions, so the value is halved.",
          },
        ],
        prompt: "What is the safest explanation for 5 << 1 becoming 10?",
        status: "active",
        testedSkillAtomIds: ["separate_shift_from_arithmetic_shortcut"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "separate_shift_from_arithmetic_shortcut",
        role: "primary",
      },
    ],
    title: "Explain left shift without decimal shortcuts",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A right shift by 1 drops the original lowest bit and moves all remaining bits one position lower.",
      mentalModelCorrection:
        "Right shift is not only division intuition. It explicitly discards low bits that fall off the right side.",
      mistakeTypes: [
        "arithmetic_shortcut_overgeneralized",
        "shift_direction_confused",
      ],
      nextAction:
        "Trace the low bit first; if it is 1, right shift will discard information.",
      result: "diagnostic",
      distractorExplanations: {
        keeps_fraction:
          "Bit shifts do not keep fractional halves. The low bit is dropped.",
        moves_left: "That is the direction for left shift, not right shift.",
        unchanged_set_count:
          "The number of set bits can change because low bits can be dropped.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-009",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_right_shift",
    prompt: "What happens to 0b1011 when shifted right by 1?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "drops_low_bit",
        feedback:
          "Correct. 0b1011 >> 1 becomes 0b0101. The original lowest 1 is dropped.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-009-check",
        mistakeTypes: [
          "arithmetic_shortcut_overgeneralized",
          "shift_direction_confused",
        ],
        options: [
          {
            id: "drops_low_bit",
            text: "It becomes 0b0101 because the lowest bit is dropped and the others move right.",
          },
          {
            id: "keeps_fraction",
            text: "It becomes 5.5 because 11 divided by 2 is 5.5.",
          },
          {
            id: "moves_left",
            text: "It becomes 0b10110 because bits move to higher positions.",
          },
          {
            id: "unchanged_set_count",
            text: "It must keep all three set bits because shifting only changes positions.",
          },
        ],
        prompt: "Which statement correctly describes 0b1011 >> 1?",
        status: "active",
        testedSkillAtomIds: ["reason_about_right_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "reason_about_right_shift",
        role: "primary",
      },
    ],
    title: "Account for dropped low bits",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "For a non-negative small integer, n >> 1 often matches floor(n / 2), but the bit-level reason is that the lowest bit is discarded.",
      mentalModelCorrection:
        "Use arithmetic intuition only after checking the binary operation. Right shift moves bits right and drops low bits.",
      mistakeTypes: ["arithmetic_shortcut_overgeneralized"],
      nextAction:
        "Describe the bit movement first, then mention the arithmetic consequence if the assumptions are safe.",
      result: "diagnostic",
      distractorExplanations: {
        exact_division:
          "Right shift does not preserve fractions. It drops the low bit, so odd numbers are rounded down in this small non-negative case.",
        unrelated_operation:
          "Right shift is directly related to binary place values; it is not an arbitrary transformation.",
        decimal_digits: "The operation is on binary bits, not decimal digits.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-010",
    learningStage: "foundations",
    primarySkillAtomId: "separate_shift_from_arithmetic_shortcut",
    prompt:
      "For small non-negative integers, what is the safest way to explain why n >> 1 often behaves like floor(n / 2)?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bit_movement_then_arithmetic",
        feedback:
          "Correct. The primary model is that bits move one position lower and the lowest bit is dropped; floor division is the consequence under safe assumptions.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-010-check",
        mistakeTypes: ["arithmetic_shortcut_overgeneralized"],
        options: [
          {
            id: "bit_movement_then_arithmetic",
            text: "Bits move one position lower, the lowest bit is dropped, and that matches floor division by 2 for small non-negative integers.",
          },
          {
            id: "exact_division",
            text: "The operator performs exact division by 2 and keeps fractional information.",
          },
          {
            id: "unrelated_operation",
            text: "The match is accidental and has no relation to binary place values.",
          },
          {
            id: "decimal_digits",
            text: "The decimal digits move right, like dividing a written decimal number by 10.",
          },
        ],
        prompt: "Which explanation avoids overgeneralizing right shift?",
        status: "active",
        testedSkillAtomIds: ["separate_shift_from_arithmetic_shortcut"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "separate_shift_from_arithmetic_shortcut",
        role: "primary",
      },
    ],
    title: "Avoid overgeneralizing right shift arithmetic",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "In JavaScript and TypeScript, bitwise operators first coerce numbers into a 32-bit signed integer representation.",
      mentalModelCorrection:
        "Do not assume JS bitwise operators behave like arbitrary-precision integer operations. Keep examples small and safe unless the 32-bit behavior is the point.",
      mistakeTypes: ["js_bitwise_model_ignored"],
      nextAction:
        "When a JS/TS question uses bitwise operators, check whether the values are small safe 32-bit integers.",
      result: "diagnostic",
      distractorExplanations: {
        arbitrary_precision:
          "JS numbers are floating-point values generally, but bitwise operators coerce to 32-bit signed integers.",
        string_bits:
          "Bitwise operators do not operate on the written string form of the number.",
        no_conversion:
          "There is a conversion step. Ignoring it can create wrong conclusions for large or non-integer values.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-011",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_js_bitwise_32bit_model",
    prompt:
      "In JavaScript/TypeScript, what caution matters when using operators like <<, >>, &, |, and ^?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "coerces_to_32_bit_signed",
        feedback:
          "Correct. JS/TS bitwise operators operate on 32-bit signed integer representations, so large or non-integer values need explicit caution.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-011-check",
        mistakeTypes: ["js_bitwise_model_ignored"],
        options: [
          {
            id: "coerces_to_32_bit_signed",
            text: "They operate on 32-bit signed integer representations.",
          },
          {
            id: "arbitrary_precision",
            text: "They operate on arbitrary-precision integers with no fixed-width behavior.",
          },
          {
            id: "string_bits",
            text: "They operate on the decimal string representation of the number.",
          },
          {
            id: "no_conversion",
            text: "They never convert the value before applying the operation.",
          },
        ],
        prompt: "What is the JS/TS runtime caution for bitwise operators?",
        status: "active",
        testedSkillAtomIds: ["recognize_js_bitwise_32bit_model"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_js_bitwise_32bit_model",
        role: "primary",
      },
    ],
    title: "Respect the JS bitwise integer model",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "18 is 16 + 2, so its binary representation has set bits at positions 4 and 1.",
      mentalModelCorrection:
        "A decimal digit is not a bit position. Convert the value to powers of two before naming set bits.",
      mistakeTypes: [
        "binary_representation_misread",
        "decimal_digit_confused_with_bit",
      ],
      nextAction:
        "Decompose the number into powers of two, then map each power to a bit position.",
      result: "diagnostic",
      distractorExplanations: {
        decimal_digit_positions:
          "The decimal digits 1 and 8 are not bit positions.",
        positions_0_4: "18 does not include the 1s bit. It is 16 + 2.",
        positions_2_4: "Position 2 represents 4, but 18 does not include 4.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-012",
    learningStage: "foundations",
    primarySkillAtomId: "read_binary_representation",
    prompt:
      "The decimal number 18 is binary 10010. Which bit positions are set?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "positions_1_4",
        feedback:
          "Correct. 10010 has set bits at positions 1 and 4, representing 2 and 16.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-012-check",
        mistakeTypes: [
          "binary_representation_misread",
          "decimal_digit_confused_with_bit",
        ],
        options: [
          {
            id: "positions_1_4",
            text: "Positions 1 and 4.",
          },
          {
            id: "decimal_digit_positions",
            text: "Positions 1 and 8.",
          },
          {
            id: "positions_0_4",
            text: "Positions 0 and 4.",
          },
          {
            id: "positions_2_4",
            text: "Positions 2 and 4.",
          },
        ],
        prompt: "Which positions are set in 0b10010?",
        status: "active",
        testedSkillAtomIds: ["read_binary_representation"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "read_binary_representation",
        role: "primary",
      },
    ],
    title: "Separate decimal digits from bit positions",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "A bit at position 1 shifted left by 3 lands at position 4.",
      mentalModelCorrection:
        "Left shift adds the shift amount to each set bit position, as long as the value stays within the relevant fixed-width representation.",
      mistakeTypes: ["shift_direction_confused", "bit_index_off_by_one"],
      nextAction: "Track the original position and add the left-shift amount.",
      result: "diagnostic",
      distractorExplanations: {
        position_3:
          "This ignores the original bit position. A bit already at position 1 moves three positions higher.",
        position_negative_2:
          "That is the wrong direction. Left shift moves toward higher positions.",
        position_1:
          "A left shift by 3 does not leave the bit in the same position.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-013",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_left_shift",
    prompt:
      "A number has exactly one set bit at position 1. After shifting it left by 3, where does that bit go?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "position_4",
        feedback:
          "Correct. Left shift by 3 moves a set bit from position 1 to position 4.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-013-check",
        mistakeTypes: ["shift_direction_confused", "bit_index_off_by_one"],
        options: [
          {
            id: "position_4",
            text: "Position 4.",
          },
          {
            id: "position_3",
            text: "Position 3.",
          },
          {
            id: "position_negative_2",
            text: "Position -2.",
          },
          {
            id: "position_1",
            text: "Position 1.",
          },
        ],
        prompt: "Where does a set bit at position 1 move after << 3?",
        status: "active",
        testedSkillAtomIds: ["reason_about_left_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "reason_about_left_shift",
        role: "primary",
      },
    ],
    title: "Move a single bit left",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "A right shift subtracts the shift amount from each bit position; bits that would go below 0 are dropped.",
      mentalModelCorrection:
        "Right shift moves set bits toward lower positions. Only bits with enough position value survive the shift.",
      mistakeTypes: [
        "shift_direction_confused",
        "binary_representation_misread",
      ],
      nextAction:
        "Subtract the shift amount from each set bit position and drop any result below 0.",
      result: "diagnostic",
      distractorExplanations: {
        position_7: "That is a left-shift result, not a right-shift result.",
        disappears:
          "A bit at position 5 shifted right by 2 still has position 3, so it does not disappear.",
        position_2:
          "This confuses the shift amount with the resulting position.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-014",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_right_shift",
    prompt:
      "A number has exactly one set bit at position 5. After shifting it right by 2, where does that bit go?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "position_3",
        feedback:
          "Correct. Right shift by 2 moves a bit from position 5 to position 3.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-014-check",
        mistakeTypes: [
          "shift_direction_confused",
          "binary_representation_misread",
        ],
        options: [
          {
            id: "position_3",
            text: "Position 3.",
          },
          {
            id: "position_7",
            text: "Position 7.",
          },
          {
            id: "disappears",
            text: "It disappears because right shift always drops set bits.",
          },
          {
            id: "position_2",
            text: "Position 2.",
          },
        ],
        prompt: "Where does a set bit at position 5 move after >> 2?",
        status: "active",
        testedSkillAtomIds: ["reason_about_right_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "reason_about_right_shift",
        role: "primary",
      },
    ],
    title: "Move a single bit right",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "A bit at position 1 shifted right by 2 would move below position 0, so it is discarded.",
      mentalModelCorrection:
        "Right shift can remove information. Bits shifted past the right edge do not remain as fractional bits.",
      mistakeTypes: [
        "shift_direction_confused",
        "arithmetic_shortcut_overgeneralized",
      ],
      nextAction:
        "When right-shifting, check which set bits have positions lower than the shift amount.",
      result: "diagnostic",
      distractorExplanations: {
        position_0:
          "A bit at position 1 shifted right by 2 would land below 0, not clamp to 0.",
        position_3:
          "That is the wrong direction. Right shift does not increase positions.",
        fractional_bit:
          "Bit positions are discrete. A shifted-out bit is dropped, not stored as a fraction.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-015",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_right_shift",
    prompt:
      "A number has exactly one set bit at position 1. What happens to that bit after shifting right by 2?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bit_dropped",
        feedback:
          "Correct. Position 1 minus 2 is below 0, so the bit is shifted out and dropped.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-015-check",
        mistakeTypes: [
          "shift_direction_confused",
          "arithmetic_shortcut_overgeneralized",
        ],
        options: [
          {
            id: "bit_dropped",
            text: "It is dropped because it moves past position 0.",
          },
          {
            id: "position_0",
            text: "It stays at position 0 because right shift clamps bits at the edge.",
          },
          {
            id: "position_3",
            text: "It moves to position 3.",
          },
          {
            id: "fractional_bit",
            text: "It becomes a fractional bit representing one half.",
          },
        ],
        prompt: "What happens to a bit at position 1 after >> 2?",
        status: "active",
        testedSkillAtomIds: ["reason_about_right_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "reason_about_right_shift",
        role: "primary",
      },
    ],
    title: "Detect a shifted-out bit",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "1 << 5 creates a single 1 in bit position 5, which is the 32s place.",
      mentalModelCorrection:
        "The shift count names the bit position. It does not count from the left side of a displayed binary string.",
      mistakeTypes: ["bit_index_off_by_one", "binary_representation_misread"],
      nextAction:
        "Translate the shift count directly into a zero-indexed position from the right.",
      result: "diagnostic",
      distractorExplanations: {
        fifth_from_left:
          "Displayed binary strings can have different widths. Bit positions are counted from the right.",
        mask_16: "16 is 1 << 4. That is one position too low.",
        five_bits: "The expression creates one set bit, not five set bits.",
      },
    },
    id: "alg-bit-manipulation-binary-representation-and-shifts-016",
    learningStage: "foundations",
    primarySkillAtomId: "create_single_bit_mask_with_shift",
    prompt: "Which interpretation of 1 << 5 is correct?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "position_5_decimal_32",
        feedback:
          "Correct. 1 << 5 creates a mask with bit position 5 set, which is decimal 32.",
        id: "alg-bit-manipulation-binary-representation-and-shifts-016-check",
        mistakeTypes: ["bit_index_off_by_one", "binary_representation_misread"],
        options: [
          {
            id: "position_5_decimal_32",
            text: "It creates a mask with bit position 5 set, equal to decimal 32.",
          },
          {
            id: "fifth_from_left",
            text: "It sets the fifth bit from the left in whatever binary string is displayed.",
          },
          {
            id: "mask_16",
            text: "It creates decimal 16 because position 5 is the fifth power-of-two slot.",
          },
          {
            id: "five_bits",
            text: "It creates a mask with five bits set.",
          },
        ],
        prompt: "What does 1 << 5 mean?",
        status: "active",
        testedSkillAtomIds: ["create_single_bit_mask_with_shift"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "bit_manipulation",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "create_single_bit_mask_with_shift",
        role: "primary",
      },
    ],
    title: "Interpret a higher-position shift mask",
    trackId: "algorithms",
    type: "single_choice",
  },
];
