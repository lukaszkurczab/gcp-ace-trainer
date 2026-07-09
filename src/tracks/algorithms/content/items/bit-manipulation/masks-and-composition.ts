export const masksAndCompositionQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The problem names a bit position, so the mask must be derived as one set bit at that position.",
      mentalModelCorrection:
        "A single-bit mask for position k is 1 << k. The position number itself is not the mask.",
      mistakeTypes: ["mask_construction_missing", "bit_index_off_by_one"],
      nextAction:
        "Convert the named position into a mask before using it in any bitwise operation.",
      result: "diagnostic",
      distractorExplanations: {
        use_position_directly:
          "The position number is not the mask value. Position 3 corresponds to 1 << 3.",
        one_based_position:
          "This treats bit positions as one-based. Bit positions start at 0.",
        multiple_bits: "A single-bit mask should contain exactly one 1 bit.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-001",
    learningStage: "foundations",
    primarySkillAtomId: "build_single_bit_mask_from_position",
    prompt: "Which expression builds a single-bit mask for bit position 3?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "shift_one_by_three",
        feedback:
          "Correct. 1 << 3 creates 0b1000, a mask with only bit position 3 set.",
        id: "alg-bit-manipulation-masks-and-composition-001-check",
        mistakeTypes: ["mask_construction_missing", "bit_index_off_by_one"],
        options: [
          {
            id: "shift_one_by_three",
            text: "1 << 3.",
          },
          {
            id: "use_position_directly",
            text: "3.",
          },
          {
            id: "one_based_position",
            text: "1 << 4.",
          },
          {
            id: "multiple_bits",
            text: "0b111.",
          },
        ],
        prompt: "How do you build the mask for bit position 3?",
        status: "active",
        testedSkillAtomIds: ["build_single_bit_mask_from_position"],
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
        nodeId: "build_single_bit_mask_from_position",
        role: "primary",
      },
    ],
    title: "Build a single-bit mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "Bit position 5 means the 32s place, not the decimal value 5.",
      mentalModelCorrection:
        "A mask value is a power of two. For position k, the mask is 2^k, written as 1 << k.",
      mistakeTypes: [
        "position_confused_with_mask_value",
        "bit_index_off_by_one",
      ],
      nextAction:
        "Translate bit position into power-of-two value before choosing a decimal mask.",
      result: "diagnostic",
      distractorExplanations: {
        mask_5:
          "5 is the position number, not the mask. It also has multiple bits set in binary.",
        mask_16: "16 is 1 << 4, so it targets position 4, not position 5.",
        mask_6:
          "The mask is not position plus one. It must have exactly one bit set at the target position.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-002",
    learningStage: "foundations",
    primarySkillAtomId: "build_single_bit_mask_from_position",
    prompt: "Which decimal value is the single-bit mask for bit position 5?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "mask_32",
        feedback: "Correct. 1 << 5 is binary 100000, which is decimal 32.",
        id: "alg-bit-manipulation-masks-and-composition-002-check",
        mistakeTypes: [
          "position_confused_with_mask_value",
          "bit_index_off_by_one",
        ],
        options: [
          {
            id: "mask_32",
            text: "32.",
          },
          {
            id: "mask_5",
            text: "5.",
          },
          {
            id: "mask_16",
            text: "16.",
          },
          {
            id: "mask_6",
            text: "6.",
          },
        ],
        prompt: "What is the mask value for bit position 5?",
        status: "active",
        testedSkillAtomIds: ["build_single_bit_mask_from_position"],
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
        nodeId: "build_single_bit_mask_from_position",
        role: "primary",
      },
    ],
    title: "Convert position to mask value",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The requirement is to combine enabled flags into one mask, so each enabled flag should contribute its set bit.",
      mentalModelCorrection:
        "Combine independent flags with OR. OR creates a mask where any selected flag bit is set.",
      mistakeTypes: [
        "union_intersection_confused",
        "flag_composition_operation_confused",
      ],
      nextAction: "Use OR when the final mask should include any enabled flag.",
      result: "diagnostic",
      distractorExplanations: {
        use_and:
          "AND finds common bits. It would keep only flags present in every operand.",
        use_xor:
          "XOR toggles/cancels bits and is not the normal operation for composing selected flags.",
        use_last_flag: "Keeping only one flag loses the other enabled flags.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-003",
    learningStage: "foundations",
    primarySkillAtomId: "combine_flags_with_or",
    prompt:
      "Given READ = 0b001, WRITE = 0b010, and EXECUTE = 0b100, how should you build a mask with READ and EXECUTE enabled?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "or_read_execute",
        feedback:
          "Correct. READ | EXECUTE produces 0b101, enabling both selected flags.",
        id: "alg-bit-manipulation-masks-and-composition-003-check",
        mistakeTypes: [
          "union_intersection_confused",
          "flag_composition_operation_confused",
        ],
        options: [
          {
            id: "or_read_execute",
            text: "READ | EXECUTE.",
          },
          {
            id: "use_and",
            text: "READ & EXECUTE.",
          },
          {
            id: "use_xor",
            text: "READ ^ EXECUTE as the default composition rule.",
          },
          {
            id: "use_last_flag",
            text: "EXECUTE only.",
          },
        ],
        prompt: "Which operation composes READ and EXECUTE into one flag mask?",
        status: "active",
        testedSkillAtomIds: ["combine_flags_with_or"],
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
        nodeId: "combine_flags_with_or",
        role: "primary",
      },
    ],
    title: "Combine flags with OR",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The flags are named independent bits, so the combined mask should be derived from the names, not memorized as a decimal constant.",
      mentalModelCorrection:
        "A decimal mask is acceptable only when you can explain which named flags create it. Prefer READ | EXECUTE over unexplained 5.",
      mistakeTypes: ["magic_mask_constant", "mask_shape_unexplained"],
      nextAction:
        "Write masks from named flags first; derive the decimal value only as a consequence.",
      result: "diagnostic",
      distractorExplanations: {
        use_magic_5_only:
          "5 may be the same value here, but using it without derivation hides which flags are enabled.",
        use_addition_as_default:
          "Addition can coincide for disjoint flags, but OR expresses flag composition directly and avoids the wrong mental model.",
        use_binary_without_names:
          "Binary helps, but the mask should still be tied back to the named flags.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-004",
    learningStage: "foundations",
    primarySkillAtomId: "derive_mask_from_named_flags",
    prompt:
      "READ is 0b001 and EXECUTE is 0b100. Which expression is the clearest way to define a mask containing both permissions?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "named_or",
        feedback:
          "Correct. READ | EXECUTE explains the mask through named flags instead of an unexplained constant.",
        id: "alg-bit-manipulation-masks-and-composition-004-check",
        mistakeTypes: ["magic_mask_constant", "mask_shape_unexplained"],
        options: [
          {
            id: "named_or",
            text: "READ | EXECUTE.",
          },
          {
            id: "use_magic_5_only",
            text: "5, with no explanation.",
          },
          {
            id: "use_addition_as_default",
            text: "READ + EXECUTE as the default way to compose flags.",
          },
          {
            id: "use_binary_without_names",
            text: "0b101, without referencing READ or EXECUTE.",
          },
        ],
        prompt: "Which definition best avoids a magic mask constant?",
        status: "active",
        testedSkillAtomIds: ["derive_mask_from_named_flags"],
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
        nodeId: "derive_mask_from_named_flags",
        role: "primary",
      },
    ],
    title: "Avoid magic flag constants",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The question asks whether two masks share at least one enabled flag, which is an overlap/intersection check.",
      mentalModelCorrection:
        "Use maskA & maskB to test overlap. If the result is nonzero, they share at least one set bit.",
      mistakeTypes: ["union_intersection_confused", "overlap_check_confused"],
      nextAction:
        "For overlap, think intersection: keep only bits that are 1 in both masks.",
      result: "diagnostic",
      distractorExplanations: {
        use_or:
          "OR combines flags. It does not tell you whether the original masks overlapped.",
        use_xor: "XOR highlights differences, not shared enabled bits.",
        compare_sum: "The sum does not directly express shared bit positions.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-005",
    learningStage: "foundations",
    primarySkillAtomId: "test_mask_overlap_with_and",
    prompt:
      "Which operation checks whether two flag masks share at least one enabled flag?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "and_nonzero",
        feedback:
          "Correct. (maskA & maskB) !== 0 means the two masks share at least one set bit.",
        id: "alg-bit-manipulation-masks-and-composition-005-check",
        mistakeTypes: ["union_intersection_confused", "overlap_check_confused"],
        options: [
          {
            id: "and_nonzero",
            text: "(maskA & maskB) !== 0.",
          },
          {
            id: "use_or",
            text: "(maskA | maskB) !== 0.",
          },
          {
            id: "use_xor",
            text: "(maskA ^ maskB) !== 0.",
          },
          {
            id: "compare_sum",
            text: "maskA + maskB > 0.",
          },
        ],
        prompt: "How do you test overlap between two masks?",
        status: "active",
        testedSkillAtomIds: ["test_mask_overlap_with_and"],
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
        nodeId: "test_mask_overlap_with_and",
        role: "primary",
      },
    ],
    title: "Test mask overlap with AND",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "0b1010 and 0b0101 have no position where both masks contain 1.",
      mentalModelCorrection:
        "AND keeps only shared set bits. A zero result means no overlap.",
      mistakeTypes: ["overlap_trace_error", "union_intersection_confused"],
      nextAction: "Align the masks and check each column for 1 in both values.",
      result: "diagnostic",
      distractorExplanations: {
        has_overlap: "There is no bit position where both masks have 1.",
        use_or_result:
          "0b1111 is the union result from OR, not the overlap result from AND.",
        compare_visible_ones:
          "Both masks having some 1s does not mean they share the same 1 positions.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-006",
    learningStage: "foundations",
    primarySkillAtomId: "test_mask_overlap_with_and",
    prompt: "What does 0b1010 & 0b0101 tell you about overlap?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "no_overlap",
        feedback:
          "Correct. The AND result is 0b0000, so the masks have no shared set bit.",
        id: "alg-bit-manipulation-masks-and-composition-006-check",
        mistakeTypes: ["overlap_trace_error", "union_intersection_confused"],
        options: [
          {
            id: "no_overlap",
            text: "There is no overlap because the AND result is 0.",
          },
          {
            id: "has_overlap",
            text: "There is overlap because both masks contain some 1 bits.",
          },
          {
            id: "use_or_result",
            text: "The overlap is 0b1111.",
          },
          {
            id: "compare_visible_ones",
            text: "They overlap because each mask has two visible 1s.",
          },
        ],
        prompt: "Interpret 0b1010 & 0b0101.",
        status: "active",
        testedSkillAtomIds: ["test_mask_overlap_with_and"],
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
        nodeId: "test_mask_overlap_with_and",
        role: "primary",
      },
    ],
    title: "Trace a no-overlap AND",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "Both masks have bit position 2 set, so the AND result is nonzero.",
      mentalModelCorrection:
        "A nonzero AND result means at least one flag is present in both masks.",
      mistakeTypes: ["overlap_trace_error", "binary_representation_misread"],
      nextAction:
        "Identify shared bit positions before deciding whether masks overlap.",
      result: "diagnostic",
      distractorExplanations: {
        no_overlap:
          "Both values have bit position 2 set, so the overlap is not zero.",
        use_or_result: "OR gives the union of flags, not the shared portion.",
        exact_equality_required:
          "Masks do not need to be identical to overlap; they need at least one shared set bit.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-007",
    learningStage: "foundations",
    primarySkillAtomId: "test_mask_overlap_with_and",
    prompt: "What does 0b1100 & 0b0101 tell you about overlap?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "overlap_at_position_2",
        feedback:
          "Correct. The AND result is 0b0100, so the masks overlap at bit position 2.",
        id: "alg-bit-manipulation-masks-and-composition-007-check",
        mistakeTypes: ["overlap_trace_error", "binary_representation_misread"],
        options: [
          {
            id: "overlap_at_position_2",
            text: "They overlap because the AND result is 0b0100.",
          },
          {
            id: "no_overlap",
            text: "They do not overlap because the masks are not equal.",
          },
          {
            id: "use_or_result",
            text: "Their overlap is 0b1101.",
          },
          {
            id: "exact_equality_required",
            text: "Overlap requires both masks to be exactly the same.",
          },
        ],
        prompt: "Interpret 0b1100 & 0b0101.",
        status: "active",
        testedSkillAtomIds: ["test_mask_overlap_with_and"],
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
        nodeId: "test_mask_overlap_with_and",
        role: "primary",
      },
    ],
    title: "Trace a nonzero overlap AND",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The operation should include all flags that appear in either mask.",
      mentalModelCorrection:
        "Union of masks uses OR. Intersection of masks uses AND.",
      mistakeTypes: [
        "union_intersection_confused",
        "flag_composition_operation_confused",
      ],
      nextAction:
        "Name whether the task asks for any selected flag or only shared flags.",
      result: "diagnostic",
      distractorExplanations: {
        use_and:
          "AND keeps only shared flags. It loses flags that appear in only one mask.",
        use_xor:
          "XOR keeps differing flags and drops shared flags, so it is not normal union.",
        use_second_mask:
          "Keeping only one mask loses flags from the other mask.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-008",
    learningStage: "foundations",
    primarySkillAtomId: "combine_flags_with_or",
    prompt:
      "You have two masks and want a combined mask containing every flag enabled in either one. Which operation fits?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "use_or_union",
        feedback: "Correct. maskA | maskB creates the union of enabled flags.",
        id: "alg-bit-manipulation-masks-and-composition-008-check",
        mistakeTypes: [
          "union_intersection_confused",
          "flag_composition_operation_confused",
        ],
        options: [
          {
            id: "use_or_union",
            text: "maskA | maskB.",
          },
          {
            id: "use_and",
            text: "maskA & maskB.",
          },
          {
            id: "use_xor",
            text: "maskA ^ maskB as the default union operation.",
          },
          {
            id: "use_second_mask",
            text: "maskB only.",
          },
        ],
        prompt: "Which operation creates the union of two masks?",
        status: "active",
        testedSkillAtomIds: ["combine_flags_with_or"],
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
        nodeId: "combine_flags_with_or",
        role: "primary",
      },
    ],
    title: "Use OR for mask union",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The operation should keep only flags that appear in both masks.",
      mentalModelCorrection:
        "Intersection of masks uses AND because AND keeps only positions where both inputs have 1.",
      mistakeTypes: ["union_intersection_confused", "overlap_check_confused"],
      nextAction:
        "Use AND when the question says shared, common, or present in both.",
      result: "diagnostic",
      distractorExplanations: {
        use_or: "OR keeps flags from either mask, not only common flags.",
        use_xor: "XOR removes common flags and keeps differences.",
        compare_only_nonzero:
          "A nonzero check tells whether any overlap exists, but it does not give the intersection mask itself.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-009",
    learningStage: "foundations",
    primarySkillAtomId: "intersect_masks_with_and",
    prompt:
      "You need a mask containing only the flags that are enabled in both maskA and maskB. Which operation fits?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "use_and_intersection",
        feedback: "Correct. maskA & maskB keeps only shared enabled flags.",
        id: "alg-bit-manipulation-masks-and-composition-009-check",
        mistakeTypes: ["union_intersection_confused", "overlap_check_confused"],
        options: [
          {
            id: "use_and_intersection",
            text: "maskA & maskB.",
          },
          {
            id: "use_or",
            text: "maskA | maskB.",
          },
          {
            id: "use_xor",
            text: "maskA ^ maskB.",
          },
          {
            id: "compare_only_nonzero",
            text: "(maskA & maskB) !== 0 as the full resulting mask.",
          },
        ],
        prompt: "Which operation creates the intersection of two masks?",
        status: "active",
        testedSkillAtomIds: ["intersect_masks_with_and"],
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
        nodeId: "intersect_masks_with_and",
        role: "primary",
      },
    ],
    title: "Use AND for mask intersection",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "0b1000 has exactly one set bit, while 0b0111 has three adjacent set bits.",
      mentalModelCorrection:
        "A single-bit mask targets one position. A multi-bit or range mask targets a group of positions.",
      mistakeTypes: [
        "single_multi_bit_mask_confused",
        "mask_shape_unexplained",
      ],
      nextAction:
        "Count how many 1 bits the mask contains and whether they form the intended target.",
      result: "diagnostic",
      distractorExplanations: {
        both_single:
          "0b0111 contains three set bits, so it is not a single-bit mask.",
        both_range: "0b1000 has only one set bit, so it is not a range mask.",
        decimal_size_decides:
          "The decimal value does not decide mask category; the binary shape does.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-010",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_single_bit_from_multi_bit_mask",
    prompt: "Which statement correctly distinguishes 0b1000 from 0b0111?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "single_vs_range",
        feedback:
          "Correct. 0b1000 targets one bit position; 0b0111 targets a group of three low positions.",
        id: "alg-bit-manipulation-masks-and-composition-010-check",
        mistakeTypes: [
          "single_multi_bit_mask_confused",
          "mask_shape_unexplained",
        ],
        options: [
          {
            id: "single_vs_range",
            text: "0b1000 is a single-bit mask; 0b0111 is a multi-bit/range mask.",
          },
          {
            id: "both_single",
            text: "Both are single-bit masks.",
          },
          {
            id: "both_range",
            text: "Both are range masks.",
          },
          {
            id: "decimal_size_decides",
            text: "0b1000 is a range mask because its decimal value is larger.",
          },
        ],
        prompt: "How should you classify 0b1000 and 0b0111?",
        status: "active",
        testedSkillAtomIds: ["distinguish_single_bit_from_multi_bit_mask"],
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
        nodeId: "distinguish_single_bit_from_multi_bit_mask",
        role: "primary",
      },
    ],
    title: "Distinguish single-bit and range masks",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "A mask for the lowest three positions needs bits 0, 1, and 2 set.",
      mentalModelCorrection:
        "A low-k-bits mask can be built as (1 << k) - 1 because subtracting 1 fills the lower k bits with 1s.",
      mistakeTypes: ["range_mask_construction_error", "bit_index_off_by_one"],
      nextAction:
        "For a low-range mask, verify the number of 1s matches the number of positions requested.",
      result: "diagnostic",
      distractorExplanations: {
        single_bit_position_3:
          "1 << 3 creates 0b1000, a single-bit mask, not the lowest three bits.",
        only_position_2:
          "1 << 2 targets only position 2 and misses positions 0 and 1.",
        four_low_bits: "0b1111 covers four positions, not three.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-011",
    learningStage: "foundations",
    primarySkillAtomId: "build_multi_bit_range_mask",
    prompt: "Which mask selects the lowest three bit positions, 0 through 2?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "lowest_three_bits",
        feedback:
          "Correct. (1 << 3) - 1 equals 0b0111, selecting positions 0, 1, and 2.",
        id: "alg-bit-manipulation-masks-and-composition-011-check",
        mistakeTypes: ["range_mask_construction_error", "bit_index_off_by_one"],
        options: [
          {
            id: "lowest_three_bits",
            text: "(1 << 3) - 1, which is 0b0111.",
          },
          {
            id: "single_bit_position_3",
            text: "1 << 3, which is 0b1000.",
          },
          {
            id: "only_position_2",
            text: "1 << 2, which is 0b0100.",
          },
          {
            id: "four_low_bits",
            text: "0b1111.",
          },
        ],
        prompt: "How do you build a mask for the lowest three bits?",
        status: "active",
        testedSkillAtomIds: ["build_multi_bit_range_mask"],
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
        nodeId: "build_multi_bit_range_mask",
        role: "primary",
      },
    ],
    title: "Build a low-range mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The target is a group of adjacent bits, so one single-bit mask is insufficient.",
      mentalModelCorrection:
        "Use a multi-bit mask when the task targets a field or range. Use a single-bit mask only when the task targets one position.",
      mistakeTypes: [
        "single_multi_bit_mask_confused",
        "range_mask_construction_error",
      ],
      nextAction:
        "Ask whether the target is one flag or a group of bit positions.",
      result: "diagnostic",
      distractorExplanations: {
        use_single_bit:
          "A single-bit mask can only select one position, not the full field.",
        use_all_bits: "Selecting all bits is broader than the requested field.",
        use_decimal_position:
          "The field is defined by bit positions, not by a decimal number.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-012",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_single_bit_from_multi_bit_mask",
    prompt:
      "A small encoded value stores a 3-bit field in positions 0, 1, and 2. What kind of mask should you use to extract just that field?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "multi_bit_field_mask",
        feedback:
          "Correct. You need a multi-bit mask such as 0b0111 to select the whole field.",
        id: "alg-bit-manipulation-masks-and-composition-012-check",
        mistakeTypes: [
          "single_multi_bit_mask_confused",
          "range_mask_construction_error",
        ],
        options: [
          {
            id: "multi_bit_field_mask",
            text: "A multi-bit mask covering positions 0 through 2.",
          },
          {
            id: "use_single_bit",
            text: "A single-bit mask for only position 0.",
          },
          {
            id: "use_all_bits",
            text: "A mask that selects every bit in the integer.",
          },
          {
            id: "use_decimal_position",
            text: "The decimal number 3 because the field has three bits.",
          },
        ],
        prompt: "Which mask shape fits a 3-bit field?",
        status: "active",
        testedSkillAtomIds: ["distinguish_single_bit_from_multi_bit_mask"],
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
        nodeId: "distinguish_single_bit_from_multi_bit_mask",
        role: "primary",
      },
    ],
    title: "Choose a field mask over a single-bit mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A small group of enabled flags can be represented by one integer whose set bits correspond to those flags.",
      mentalModelCorrection:
        "A flag mask represents a set of enabled boolean states. Each selected flag contributes one set bit.",
      mistakeTypes: [
        "flag_mask_representation_confused",
        "mask_shape_unexplained",
      ],
      nextAction:
        "Map each named flag to a bit and list which enabled flags contribute to the final mask.",
      result: "diagnostic",
      distractorExplanations: {
        list_only:
          "A list can represent the flags, but the bit-mask representation stores them compactly in one integer.",
        decimal_count:
          "The mask is not the number of enabled flags. It encodes which flags are enabled.",
        order_storage:
          "A mask stores membership of flags, not the order in which they were enabled.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-013",
    learningStage: "foundations",
    primarySkillAtomId: "represent_enabled_flags_as_mask",
    prompt:
      "What does a flag mask primarily represent when READ, WRITE, and EXECUTE are each assigned one bit?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "enabled_flag_set",
        feedback:
          "Correct. The mask compactly represents which named flags are enabled.",
        id: "alg-bit-manipulation-masks-and-composition-013-check",
        mistakeTypes: [
          "flag_mask_representation_confused",
          "mask_shape_unexplained",
        ],
        options: [
          {
            id: "enabled_flag_set",
            text: "The set of enabled flags.",
          },
          {
            id: "list_only",
            text: "Only a list of strings stored inside the number.",
          },
          {
            id: "decimal_count",
            text: "The count of enabled flags, but not which ones.",
          },
          {
            id: "order_storage",
            text: "The order in which flags were enabled.",
          },
        ],
        prompt: "What information does a flag mask encode?",
        status: "active",
        testedSkillAtomIds: ["represent_enabled_flags_as_mask"],
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
        nodeId: "represent_enabled_flags_as_mask",
        role: "primary",
      },
    ],
    title: "Represent enabled flags as a mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The existing mask already contains enabled flags, and the new flag should be added without losing them.",
      mentalModelCorrection:
        "Apply a mask with OR when adding a flag. Assigning the new flag mask alone overwrites unrelated flags.",
      mistakeTypes: ["unrelated_bits_modified", "mask_overwrite_error"],
      nextAction:
        "After applying a mask, compare unrelated bits against the original value.",
      result: "diagnostic",
      distractorExplanations: {
        assign_only_new_flag:
          "This overwrites the existing mask and loses already-enabled flags.",
        use_and:
          "AND with the new flag keeps only overlap and usually removes unrelated flags.",
        use_xor:
          "XOR toggles the new flag, which can remove it if it was already present.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-014",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_unrelated_bits_when_applying_mask",
    prompt:
      "A mask already has READ enabled. You want to add WRITE while preserving READ. Which update is correct?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "or_write",
        feedback:
          "Correct. mask | WRITE adds WRITE while preserving existing enabled flags.",
        id: "alg-bit-manipulation-masks-and-composition-014-check",
        mistakeTypes: ["unrelated_bits_modified", "mask_overwrite_error"],
        options: [
          {
            id: "or_write",
            text: "mask | WRITE.",
          },
          {
            id: "assign_only_new_flag",
            text: "WRITE.",
          },
          {
            id: "use_and",
            text: "mask & WRITE.",
          },
          {
            id: "use_xor",
            text: "mask ^ WRITE as the default add operation.",
          },
        ],
        prompt: "How do you add WRITE without losing existing flags?",
        status: "active",
        testedSkillAtomIds: ["preserve_unrelated_bits_when_applying_mask"],
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
        nodeId: "preserve_unrelated_bits_when_applying_mask",
        role: "primary",
      },
    ],
    title: "Add a flag without overwriting the mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The update must remove WRITE while preserving every unrelated enabled flag.",
      mentalModelCorrection:
        "To remove a named flag from a composite mask, use mask & ~FLAG. The negated flag mask has 0 at that flag and 1 everywhere else.",
      mistakeTypes: ["unrelated_bits_modified", "clear_mask_missing_negation"],
      nextAction:
        "When removing a flag, verify that only the target flag is cleared and all other enabled flags remain unchanged.",
      result: "diagnostic",
      distractorExplanations: {
        keep_only_write:
          "mask & WRITE keeps only the WRITE bit instead of removing WRITE from the full mask.",
        add_write:
          "mask | WRITE adds or preserves WRITE, which is the opposite of removing it.",
        toggle_write:
          "XOR toggles WRITE. It removes WRITE only if it was present, but it would add WRITE if it was absent, so it is not the default remove operation.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-015",
    learningStage: "foundations",
    primarySkillAtomId: "preserve_unrelated_bits_when_applying_mask",
    prompt:
      "A current permission mask has READ, WRITE, and EXECUTE enabled. You want to remove WRITE while preserving READ and EXECUTE. Which update is correct?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "remove_write_with_and_not",
        feedback:
          "Correct. mask & ~WRITE clears WRITE and preserves unrelated enabled flags such as READ and EXECUTE.",
        id: "alg-bit-manipulation-masks-and-composition-015-check",
        mistakeTypes: ["unrelated_bits_modified", "clear_mask_missing_negation"],
        options: [
          {
            id: "remove_write_with_and_not",
            text: "mask & ~WRITE.",
          },
          {
            id: "keep_only_write",
            text: "mask & WRITE.",
          },
          {
            id: "add_write",
            text: "mask | WRITE.",
          },
          {
            id: "toggle_write",
            text: "mask ^ WRITE as the default remove operation.",
          },
        ],
        prompt: "How do you remove WRITE without losing other flags?",
        status: "active",
        testedSkillAtomIds: ["preserve_unrelated_bits_when_applying_mask"],
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
        nodeId: "preserve_unrelated_bits_when_applying_mask",
        role: "primary",
      },
    ],
    title: "Remove a flag without losing unrelated flags",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The mask is meant to filter a value down to selected positions, so unrelated positions should be removed from the temporary result.",
      mentalModelCorrection:
        "AND with a mask is filtering/intersection. It is different from updating stored state to add flags.",
      mistakeTypes: [
        "mask_filtering_confused_with_update",
        "union_intersection_confused",
      ],
      nextAction:
        "Ask whether the result is a temporary extracted subset or a persisted updated flag set.",
      result: "diagnostic",
      distractorExplanations: {
        use_or:
          "OR would add selected bits instead of filtering to the selected positions.",
        use_xor: "XOR flips selected bits; it does not extract them.",
        preserve_all_bits:
          "Filtering intentionally removes unselected positions from the temporary result.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-016",
    learningStage: "foundations",
    primarySkillAtomId: "filter_bits_with_mask",
    prompt:
      "You have a value and want a temporary result containing only the bits selected by mask. Which operation fits?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "and_filter",
        feedback:
          "Correct. value & mask keeps only the selected bit positions.",
        id: "alg-bit-manipulation-masks-and-composition-016-check",
        mistakeTypes: [
          "mask_filtering_confused_with_update",
          "union_intersection_confused",
        ],
        options: [
          {
            id: "and_filter",
            text: "value & mask.",
          },
          {
            id: "use_or",
            text: "value | mask.",
          },
          {
            id: "use_xor",
            text: "value ^ mask.",
          },
          {
            id: "preserve_all_bits",
            text: "Return value unchanged because masks should never remove bits.",
          },
        ],
        prompt: "Which operation filters a value to selected mask positions?",
        status: "active",
        testedSkillAtomIds: ["filter_bits_with_mask"],
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
        nodeId: "filter_bits_with_mask",
        role: "primary",
      },
    ],
    title: "Filter selected bits with AND",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The mask is explained by named flags, so changing names or positions should not require reinterpreting a magic decimal value.",
      mentalModelCorrection:
        "Named flag expressions make the mask's intent explicit and reduce mistakes when bit assignments change.",
      mistakeTypes: ["magic_mask_constant", "mask_shape_unexplained"],
      nextAction:
        "Prefer named constants plus OR composition over bare decimal masks.",
      result: "diagnostic",
      distractorExplanations: {
        bare_decimal: "A bare decimal value hides which bits are intended.",
        decimal_comment_only:
          "A comment helps, but deriving the value from named flags is safer and clearer.",
        use_count:
          "The number of flags selected is not enough to identify which flags are selected.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-017",
    learningStage: "foundations",
    primarySkillAtomId: "derive_mask_from_named_flags",
    prompt:
      "Which style best communicates that a permission mask enables READ, WRITE, and EXECUTE?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "named_or_all_flags",
        feedback:
          "Correct. READ | WRITE | EXECUTE states the mask in terms of its intended flags.",
        id: "alg-bit-manipulation-masks-and-composition-017-check",
        mistakeTypes: ["magic_mask_constant", "mask_shape_unexplained"],
        options: [
          {
            id: "named_or_all_flags",
            text: "READ | WRITE | EXECUTE.",
          },
          {
            id: "bare_decimal",
            text: "7, with no explanation.",
          },
          {
            id: "decimal_comment_only",
            text: "7, with a vague comment saying 'permissions'.",
          },
          {
            id: "use_count",
            text: "3, because three permissions are enabled.",
          },
        ],
        prompt: "Which mask definition best avoids hidden intent?",
        status: "active",
        testedSkillAtomIds: ["derive_mask_from_named_flags"],
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
        nodeId: "derive_mask_from_named_flags",
        role: "primary",
      },
    ],
    title: "Express mask intent with named flags",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The requirement asks whether all required flags are present, not merely whether there is any overlap.",
      mentalModelCorrection:
        "To check that all required flags are included, use (mask & required) === required. A nonzero result only proves at least one overlap.",
      mistakeTypes: [
        "overlap_confused_with_containment",
        "mask_subset_check_confused",
      ],
      nextAction:
        "Distinguish any overlap from full containment of a required mask.",
      result: "diagnostic",
      distractorExplanations: {
        any_overlap:
          "This only checks whether at least one required flag is present, not all of them.",
        use_or:
          "OR creates a combined mask; it does not test whether the original mask already contained all required flags.",
        compare_to_mask:
          "Requiring equality to mask would reject masks that contain extra allowed flags.",
      },
    },
    id: "alg-bit-manipulation-masks-and-composition-018",
    learningStage: "foundations",
    primarySkillAtomId: "test_required_flags_with_mask",
    prompt:
      "You need to check whether mask contains every flag in required, while allowing mask to contain extra flags. Which expression is correct?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "and_equals_required",
        feedback:
          "Correct. (mask & required) === required means every required bit is present in mask.",
        id: "alg-bit-manipulation-masks-and-composition-018-check",
        mistakeTypes: [
          "overlap_confused_with_containment",
          "mask_subset_check_confused",
        ],
        options: [
          {
            id: "and_equals_required",
            text: "(mask & required) === required.",
          },
          {
            id: "any_overlap",
            text: "(mask & required) !== 0.",
          },
          {
            id: "use_or",
            text: "(mask | required) !== 0.",
          },
          {
            id: "compare_to_mask",
            text: "(mask & required) === mask.",
          },
        ],
        prompt: "How do you check that all required flags are present?",
        status: "active",
        testedSkillAtomIds: ["test_required_flags_with_mask"],
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
        nodeId: "test_required_flags_with_mask",
        role: "primary",
      },
    ],
    title: "Distinguish overlap from required-flag containment",
    trackId: "algorithms",
    type: "single_choice",
  },
];
