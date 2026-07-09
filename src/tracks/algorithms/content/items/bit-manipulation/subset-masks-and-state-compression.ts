export const subsetMasksAndStateCompressionQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The item has an index in a small fixed set, so that index can map directly to a bit position.",
      mentalModelCorrection:
        "Subset masks use one bit per item: item i maps to bit position i.",
      mistakeTypes: [
        "item_bit_mapping_off_by_one",
        "subset_mask_representation_confused",
      ],
      nextAction:
        "Write the item indexes first, then assign each index to the same zero-indexed bit position.",
      result: "diagnostic",
      distractorExplanations: {
        one_based_mapping:
          "This shifts every item by one position. Bit positions are zero-indexed.",
        order_value_mapping:
          "The bit stores membership, not the item's value or label.",
        all_items_one_bit:
          "One bit cannot distinguish multiple independent items.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-001",
    learningStage: "foundations",
    primarySkillAtomId: "map_items_to_bit_positions",
    prompt:
      "You have items indexed 0, 1, and 2. In a subset mask, which bit should represent item 2?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bit_position_2",
        feedback:
          "Correct. In the standard mapping, item i maps to bit position i.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-001-check",
        mistakeTypes: [
          "item_bit_mapping_off_by_one",
          "subset_mask_representation_confused",
        ],
        options: [
          {
            id: "bit_position_2",
            text: "Bit position 2.",
          },
          {
            id: "one_based_mapping",
            text: "Bit position 3.",
          },
          {
            id: "order_value_mapping",
            text: "The bit whose decimal value is 2.",
          },
          {
            id: "all_items_one_bit",
            text: "The same bit used for every item.",
          },
        ],
        prompt: "How should item 2 map into a subset mask?",
        status: "active",
        testedSkillAtomIds: ["map_items_to_bit_positions"],
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
        nodeId: "map_items_to_bit_positions",
        role: "primary",
      },
    ],
    title: "Map an item to its bit position",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The subset contains items 0 and 2, so the mask needs bits 0 and 2 set.",
      mentalModelCorrection:
        "A subset mask is built by OR-ing the single-bit masks for all included items.",
      mistakeTypes: [
        "subset_mask_construction_error",
        "item_bit_mapping_off_by_one",
      ],
      nextAction: "For each included item i, add 1 << i to the mask via OR.",
      result: "diagnostic",
      distractorExplanations: {
        mask_011: "0b011 represents items 0 and 1, not items 0 and 2.",
        mask_110: "0b110 represents items 1 and 2, not items 0 and 2.",
        mask_010: "0b010 represents only item 1.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-002",
    learningStage: "foundations",
    primarySkillAtomId: "construct_subset_mask_from_items",
    prompt:
      "For items indexed 0, 1, and 2, which mask represents the subset {0, 2}?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "mask_101",
        feedback: "Correct. Items 0 and 2 set bits 0 and 2, producing 0b101.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-002-check",
        mistakeTypes: [
          "subset_mask_construction_error",
          "item_bit_mapping_off_by_one",
        ],
        options: [
          {
            id: "mask_101",
            text: "0b101.",
          },
          {
            id: "mask_011",
            text: "0b011.",
          },
          {
            id: "mask_110",
            text: "0b110.",
          },
          {
            id: "mask_010",
            text: "0b010.",
          },
        ],
        prompt: "Which mask encodes subset {0, 2}?",
        status: "active",
        testedSkillAtomIds: ["construct_subset_mask_from_items"],
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
        nodeId: "construct_subset_mask_from_items",
        role: "primary",
      },
    ],
    title: "Construct a subset mask",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The question asks whether item i is present, so the mask must be tested at bit position i.",
      mentalModelCorrection:
        "Membership in a subset mask is checked with mask & (1 << i). A nonzero result means item i is included.",
      mistakeTypes: [
        "membership_check_operation_confused",
        "mask_construction_missing",
      ],
      nextAction:
        "Build the item mask with 1 << i, then AND it with the subset mask.",
      result: "diagnostic",
      distractorExplanations: {
        use_or:
          "OR would add the item before checking, destroying the original membership signal.",
        use_xor: "XOR would toggle membership, not test it.",
        compare_to_i:
          "i is the item index, not the single-bit mask for that item.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-003",
    learningStage: "foundations",
    primarySkillAtomId: "test_subset_membership_with_and",
    prompt:
      "Which expression checks whether item i is included in subset mask?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "and_shift_mask",
        feedback:
          "Correct. mask & (1 << i) isolates the membership bit for item i.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-003-check",
        mistakeTypes: [
          "membership_check_operation_confused",
          "mask_construction_missing",
        ],
        options: [
          {
            id: "and_shift_mask",
            text: "(mask & (1 << i)) !== 0.",
          },
          {
            id: "use_or",
            text: "(mask | (1 << i)) !== 0.",
          },
          {
            id: "use_xor",
            text: "(mask ^ (1 << i)) !== 0.",
          },
          {
            id: "compare_to_i",
            text: "(mask & i) !== 0.",
          },
        ],
        prompt: "How do you test membership of item i?",
        status: "active",
        testedSkillAtomIds: ["test_subset_membership_with_and"],
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
        nodeId: "test_subset_membership_with_and",
        role: "primary",
      },
    ],
    title: "Check subset membership",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal: "0b101 has bits 0 and 2 set, so item 2 is present.",
      mentalModelCorrection:
        "A membership check returns nonzero when the target item's bit is set in the mask.",
      mistakeTypes: ["membership_check_result_misread", "binary_trace_error"],
      nextAction:
        "Align the item mask under the subset mask and check whether the AND result is zero.",
      result: "diagnostic",
      distractorExplanations: {
        item_absent:
          "Item 2 is present because bit position 2 is set in 0b101.",
        checks_item_1: "0b100 targets item 2, not item 1.",
        requires_exact_equal_subset:
          "Membership does not require the subset to contain only that item; extra items are allowed.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-004",
    learningStage: "foundations",
    primarySkillAtomId: "test_subset_membership_with_and",
    prompt:
      "For subset mask 0b101, what does (mask & (1 << 2)) !== 0 tell you?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "item_present",
        feedback:
          "Correct. Bit position 2 is set, so item 2 is included in the subset.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-004-check",
        mistakeTypes: ["membership_check_result_misread", "binary_trace_error"],
        options: [
          {
            id: "item_present",
            text: "Item 2 is present.",
          },
          {
            id: "item_absent",
            text: "Item 2 is absent.",
          },
          {
            id: "checks_item_1",
            text: "The expression checks item 1.",
          },
          {
            id: "requires_exact_equal_subset",
            text: "The expression is false because the subset also contains item 0.",
          },
        ],
        prompt: "Interpret membership check for item 2 in 0b101.",
        status: "active",
        testedSkillAtomIds: ["test_subset_membership_with_and"],
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
        nodeId: "test_subset_membership_with_and",
        role: "primary",
      },
    ],
    title: "Interpret a membership check",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "Adding an item means forcing its membership bit to 1 while preserving existing members.",
      mentalModelCorrection:
        "Add an item to a subset mask with mask | (1 << i). OR preserves existing set bits and sets the target bit.",
      mistakeTypes: [
        "membership_add_operation_confused",
        "toggle_used_for_add",
      ],
      nextAction:
        "Use OR when the item must be present after the operation regardless of prior membership.",
      result: "diagnostic",
      distractorExplanations: {
        use_and: "AND checks or filters; it does not add the item.",
        use_xor:
          "XOR toggles membership and would remove the item if it was already present.",
        use_and_not: "AND with a negated mask removes the item.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-005",
    learningStage: "foundations",
    primarySkillAtomId: "add_item_to_subset_mask_with_or",
    prompt:
      "Which expression adds item i to subset mask while preserving existing items?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "or_shift_mask",
        feedback: "Correct. mask | (1 << i) ensures item i is present.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-005-check",
        mistakeTypes: [
          "membership_add_operation_confused",
          "toggle_used_for_add",
        ],
        options: [
          {
            id: "or_shift_mask",
            text: "mask | (1 << i).",
          },
          {
            id: "use_and",
            text: "mask & (1 << i).",
          },
          {
            id: "use_xor",
            text: "mask ^ (1 << i).",
          },
          {
            id: "use_and_not",
            text: "mask & ~(1 << i).",
          },
        ],
        prompt: "How do you add item i to a subset mask?",
        status: "active",
        testedSkillAtomIds: ["add_item_to_subset_mask_with_or"],
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
        nodeId: "add_item_to_subset_mask_with_or",
        role: "primary",
      },
    ],
    title: "Add an item with OR",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "Removing an item means forcing its membership bit to 0 while preserving all other membership bits.",
      mentalModelCorrection:
        "Remove an item from a subset mask with mask & ~(1 << i). The negated item mask clears only that bit.",
      mistakeTypes: [
        "membership_remove_operation_confused",
        "clear_mask_missing_negation",
      ],
      nextAction:
        "Build the item mask, negate it, then AND to preserve every other item.",
      result: "diagnostic",
      distractorExplanations: {
        use_and: "mask & (1 << i) keeps only item i instead of removing it.",
        use_or: "OR adds item i instead of removing it.",
        use_xor: "XOR toggles membership and can add the item if it is absent.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-006",
    learningStage: "foundations",
    primarySkillAtomId: "remove_item_from_subset_mask_with_and_not",
    prompt:
      "Which expression removes item i from subset mask while preserving other items?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "and_not_shift_mask",
        feedback:
          "Correct. mask & ~(1 << i) clears item i's bit and preserves other bits.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-006-check",
        mistakeTypes: [
          "membership_remove_operation_confused",
          "clear_mask_missing_negation",
        ],
        options: [
          {
            id: "and_not_shift_mask",
            text: "mask & ~(1 << i).",
          },
          {
            id: "use_and",
            text: "mask & (1 << i).",
          },
          {
            id: "use_or",
            text: "mask | (1 << i).",
          },
          {
            id: "use_xor",
            text: "mask ^ (1 << i).",
          },
        ],
        prompt: "How do you remove item i from a subset mask?",
        status: "active",
        testedSkillAtomIds: ["remove_item_from_subset_mask_with_and_not"],
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
        nodeId: "remove_item_from_subset_mask_with_and_not",
        role: "primary",
      },
    ],
    title: "Remove an item with AND-not",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "Toggling membership means present becomes absent and absent becomes present.",
      mentalModelCorrection:
        "Use mask ^ (1 << i) only when flipping membership is intended. It is not a safe replacement for add or remove.",
      mistakeTypes: [
        "toggle_confused_with_add_remove",
        "operation_goal_misread",
      ],
      nextAction:
        "Use toggle only when the desired final membership is the opposite of the current membership.",
      result: "diagnostic",
      distractorExplanations: {
        use_or:
          "OR only adds the item; it does not remove the item if already present.",
        use_and_not:
          "AND-not only removes the item; it does not add the item if absent.",
        use_and:
          "AND checks or filters membership; it does not flip membership in the subset.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-007",
    learningStage: "foundations",
    primarySkillAtomId: "toggle_item_membership_with_xor",
    prompt: "Which expression flips whether item i is included in subset mask?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "xor_shift_mask",
        feedback: "Correct. mask ^ (1 << i) toggles item i's membership.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-007-check",
        mistakeTypes: [
          "toggle_confused_with_add_remove",
          "operation_goal_misread",
        ],
        options: [
          {
            id: "xor_shift_mask",
            text: "mask ^ (1 << i).",
          },
          {
            id: "use_or",
            text: "mask | (1 << i).",
          },
          {
            id: "use_and_not",
            text: "mask & ~(1 << i).",
          },
          {
            id: "use_and",
            text: "mask & (1 << i).",
          },
        ],
        prompt: "How do you toggle item i in a subset mask?",
        status: "active",
        testedSkillAtomIds: ["toggle_item_membership_with_xor"],
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
        nodeId: "toggle_item_membership_with_xor",
        role: "primary",
      },
    ],
    title: "Toggle item membership with XOR",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The requirement says the item must be present after the operation, so toggle is unsafe.",
      mentalModelCorrection:
        "Adding is force-to-present; toggling is flip-to-opposite. Use OR for add, not XOR.",
      mistakeTypes: ["toggle_used_for_add", "operation_goal_misread"],
      nextAction:
        "Ask whether the final state is fixed or depends on the previous state.",
      result: "diagnostic",
      distractorExplanations: {
        use_xor:
          "XOR removes the item if it was already present, so it does not guarantee presence.",
        use_and_not: "AND-not guarantees absence, not presence.",
        use_and:
          "AND checks membership and discards unrelated items if stored as the new mask.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-008",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_add_remove_toggle_membership",
    prompt:
      "You need item i to be included after the update, regardless of whether it was already included. Which operation is correct?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "add_with_or",
        feedback: "Correct. OR forces item i to be present.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-008-check",
        mistakeTypes: ["toggle_used_for_add", "operation_goal_misread"],
        options: [
          {
            id: "add_with_or",
            text: "mask | (1 << i).",
          },
          {
            id: "use_xor",
            text: "mask ^ (1 << i).",
          },
          {
            id: "use_and_not",
            text: "mask & ~(1 << i).",
          },
          {
            id: "use_and",
            text: "mask & (1 << i).",
          },
        ],
        prompt: "Which operation guarantees item i is present?",
        status: "active",
        testedSkillAtomIds: ["distinguish_add_remove_toggle_membership"],
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
        nodeId: "distinguish_add_remove_toggle_membership",
        role: "primary",
      },
    ],
    title: "Do not use toggle as add",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The requirement says the item must be absent after the operation, so toggle is unsafe.",
      mentalModelCorrection:
        "Removing is force-to-absent; toggling is flip-to-opposite. Use AND-not for remove, not XOR.",
      mistakeTypes: ["toggle_used_for_remove", "operation_goal_misread"],
      nextAction:
        "Use remove when the final state must be absent independent of the previous state.",
      result: "diagnostic",
      distractorExplanations: {
        use_xor:
          "XOR adds the item if it was absent, so it does not guarantee removal.",
        use_or: "OR guarantees presence, not absence.",
        use_and:
          "AND with the item mask isolates the item instead of removing it from the subset.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-009",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_add_remove_toggle_membership",
    prompt:
      "You need item i to be absent after the update, regardless of whether it was present before. Which operation is correct?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "remove_with_and_not",
        feedback:
          "Correct. AND with the negated item mask guarantees item i is absent.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-009-check",
        mistakeTypes: ["toggle_used_for_remove", "operation_goal_misread"],
        options: [
          {
            id: "remove_with_and_not",
            text: "mask & ~(1 << i).",
          },
          {
            id: "use_xor",
            text: "mask ^ (1 << i).",
          },
          {
            id: "use_or",
            text: "mask | (1 << i).",
          },
          {
            id: "use_and",
            text: "mask & (1 << i).",
          },
        ],
        prompt: "Which operation guarantees item i is absent?",
        status: "active",
        testedSkillAtomIds: ["distinguish_add_remove_toggle_membership"],
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
        nodeId: "distinguish_add_remove_toggle_membership",
        role: "primary",
      },
    ],
    title: "Do not use toggle as remove",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "Each of n items can be either absent or present, creating two choices per item.",
      mentalModelCorrection:
        "A set of n items has 2^n possible subset masks because each bit independently chooses 0 or 1.",
      mistakeTypes: ["subset_count_undercounted", "state_space_model_confused"],
      nextAction:
        "For subset masks, count binary choices: two states per item.",
      result: "diagnostic",
      distractorExplanations: {
        n_masks:
          "n counts items, not subsets. Each item has two membership choices.",
        n_squared_masks: "Subset count is not pair count. It grows as 2^n.",
        factorial_masks:
          "Factorial counts orderings/permutations; subset masks do not store order.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-010",
    learningStage: "foundations",
    primarySkillAtomId: "count_subset_masks_as_two_power_n",
    prompt: "How many subset masks are possible for n distinct items?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "two_power_n",
        feedback:
          "Correct. Each of n items can be absent or present, so there are 2^n subset masks.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-010-check",
        mistakeTypes: [
          "subset_count_undercounted",
          "state_space_model_confused",
        ],
        options: [
          {
            id: "two_power_n",
            text: "2^n.",
          },
          {
            id: "n_masks",
            text: "n.",
          },
          {
            id: "n_squared_masks",
            text: "n^2.",
          },
          {
            id: "factorial_masks",
            text: "n!.",
          },
        ],
        prompt: "What is the number of possible subset masks for n items?",
        status: "active",
        testedSkillAtomIds: ["count_subset_masks_as_two_power_n"],
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
        nodeId: "count_subset_masks_as_two_power_n",
        role: "primary",
      },
    ],
    title: "Count subset masks as 2^n",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "Four independent items each have two membership choices.",
      mentalModelCorrection:
        "For a concrete small set, enumerate subset-mask count as 2^n, not n or n + 1.",
      mistakeTypes: ["subset_count_undercounted", "state_space_model_confused"],
      nextAction: "Raise 2 to the number of independent items.",
      result: "diagnostic",
      distractorExplanations: {
        four_masks: "That counts items, not subsets.",
        eight_masks: "That would be 2^3, so it misses one item.",
        five_masks:
          "The empty subset adds one, but every combination of items also counts.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-011",
    learningStage: "foundations",
    primarySkillAtomId: "count_subset_masks_as_two_power_n",
    prompt: "How many subset masks are possible for 4 items?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "sixteen_masks",
        feedback: "Correct. 2^4 = 16 possible subset masks.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-011-check",
        mistakeTypes: [
          "subset_count_undercounted",
          "state_space_model_confused",
        ],
        options: [
          {
            id: "sixteen_masks",
            text: "16.",
          },
          {
            id: "four_masks",
            text: "4.",
          },
          {
            id: "eight_masks",
            text: "8.",
          },
          {
            id: "five_masks",
            text: "5.",
          },
        ],
        prompt: "Count possible subset masks for 4 items.",
        status: "active",
        testedSkillAtomIds: ["count_subset_masks_as_two_power_n"],
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
        nodeId: "count_subset_masks_as_two_power_n",
        role: "primary",
      },
    ],
    title: "Compute a concrete subset-mask count",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "A subset mask only tracks whether an item is present, not how many times it appears.",
      mentalModelCorrection:
        "Subset masks represent membership. They do not store multiplicity unless extra encoding is explicitly designed.",
      mistakeTypes: [
        "subset_mask_multiplicity_confused",
        "membership_model_confused",
      ],
      nextAction:
        "Ask whether each item is only present/absent or whether counts are required.",
      result: "diagnostic",
      distractorExplanations: {
        stores_counts:
          "A single membership bit cannot distinguish one copy from multiple copies.",
        stores_order:
          "A subset mask does not encode insertion or traversal order.",
        stores_sorted_values:
          "The mask encodes membership positions, not sorted item values.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-012",
    learningStage: "foundations",
    primarySkillAtomId: "understand_subset_mask_information_limits",
    prompt: "What information does a basic subset mask store about each item?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "presence_absence",
        feedback:
          "Correct. A basic subset mask stores whether each item is present or absent.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-012-check",
        mistakeTypes: [
          "subset_mask_multiplicity_confused",
          "membership_model_confused",
        ],
        options: [
          {
            id: "presence_absence",
            text: "Presence or absence.",
          },
          {
            id: "stores_counts",
            text: "The exact number of times each item appears.",
          },
          {
            id: "stores_order",
            text: "The order in which items were added.",
          },
          {
            id: "stores_sorted_values",
            text: "The sorted numeric values of the items.",
          },
        ],
        prompt: "What does one bit per item represent?",
        status: "active",
        testedSkillAtomIds: ["understand_subset_mask_information_limits"],
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
        nodeId: "understand_subset_mask_information_limits",
        role: "primary",
      },
    ],
    title: "Know what subset masks do not store",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The subsets {A, B} and {B, A} contain the same items, so they have the same membership mask.",
      mentalModelCorrection:
        "Subset masks encode membership, not order. Different orders of the same items map to the same mask.",
      mistakeTypes: ["subset_mask_order_confused", "membership_model_confused"],
      nextAction:
        "If order matters, a basic subset mask is not sufficient by itself.",
      result: "diagnostic",
      distractorExplanations: {
        different_masks:
          "Changing the order does not change which item bits are set.",
        stores_sequence:
          "A mask has no sequence positions for insertion order.",
        depends_on_add_order: "OR-ing item bits is order-independent.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-013",
    learningStage: "foundations",
    primarySkillAtomId: "understand_subset_mask_information_limits",
    prompt:
      "Items A and B map to fixed bit positions. How do the subsets {A, B} and {B, A} compare as masks?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "same_mask",
        feedback:
          "Correct. The same item bits are set, so the masks are identical.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-013-check",
        mistakeTypes: [
          "subset_mask_order_confused",
          "membership_model_confused",
        ],
        options: [
          {
            id: "same_mask",
            text: "They have the same mask.",
          },
          {
            id: "different_masks",
            text: "They have different masks because the order is different.",
          },
          {
            id: "stores_sequence",
            text: "The mask stores both membership and sequence order.",
          },
          {
            id: "depends_on_add_order",
            text: "The mask depends on which item was added first.",
          },
        ],
        prompt: "Does a subset mask encode order?",
        status: "active",
        testedSkillAtomIds: ["understand_subset_mask_information_limits"],
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
        nodeId: "understand_subset_mask_information_limits",
        role: "primary",
      },
    ],
    title: "Do not treat subset masks as ordered sequences",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The question only asks how to represent completed tasks, not how to optimize over all task orders.",
      mentalModelCorrection:
        "Subset-mask representation is a building block. Full DP over masks is a separate algorithmic layer.",
      mistakeTypes: [
        "bitmask_dp_overintroduced",
        "representation_vs_algorithm_confused",
      ],
      nextAction:
        "Separate the representation question from any later recurrence or optimization logic.",
      result: "diagnostic",
      distractorExplanations: {
        jump_to_dp:
          "A DP recurrence is not required just to represent a subset.",
        use_graph_search:
          "Graph traversal may use visited state, but this prompt only asks for subset representation.",
        use_sorting:
          "Sorting does not encode arbitrary completed-task membership.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-014",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_subset_mask_representation_from_dp",
    prompt:
      "A prompt asks: 'Represent which of 8 tasks are completed as a compact state.' What should you focus on first?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "subset_representation",
        feedback:
          "Correct. First map each task to a bit and represent completed tasks as a subset mask.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-014-check",
        mistakeTypes: [
          "bitmask_dp_overintroduced",
          "representation_vs_algorithm_confused",
        ],
        options: [
          {
            id: "subset_representation",
            text: "Map each task to a bit and store completed tasks as a mask.",
          },
          {
            id: "jump_to_dp",
            text: "Immediately design a full DP recurrence over all masks.",
          },
          {
            id: "use_graph_search",
            text: "Run graph traversal because every state representation is a graph.",
          },
          {
            id: "use_sorting",
            text: "Sort the tasks and store only the first completed task.",
          },
        ],
        prompt:
          "What is the first focus when only representation is requested?",
        status: "active",
        testedSkillAtomIds: ["distinguish_subset_mask_representation_from_dp"],
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
        nodeId: "distinguish_subset_mask_representation_from_dp",
        role: "primary",
      },
    ],
    title: "Keep representation separate from DP",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The state consists of several independent boolean choices, so it can be compressed into one integer mask.",
      mentalModelCorrection:
        "State compression with bit masks is useful when a small fixed set of boolean conditions can be represented as bits.",
      mistakeTypes: [
        "state_compression_signal_missed",
        "representation_choice_error",
      ],
      nextAction:
        "Check whether the state dimensions are boolean and small enough to map to bit positions.",
      result: "diagnostic",
      distractorExplanations: {
        use_hash_map_only:
          "A hash map may work, but the compact boolean-state structure is a direct bit-mask fit.",
        use_prefix_sum:
          "Prefix sums are for cumulative range values, not compact boolean state.",
        use_binary_search:
          "Binary search needs a monotonic search space, not just several boolean state flags.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-015",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_state_compression_with_bitmask",
    prompt:
      "A state has 6 independent yes/no switches. You need to store and compare states compactly. Which representation is most natural?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bitmask_state",
        feedback:
          "Correct. Six independent boolean switches can be represented as a 6-bit mask.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-015-check",
        mistakeTypes: [
          "state_compression_signal_missed",
          "representation_choice_error",
        ],
        options: [
          {
            id: "bitmask_state",
            text: "A bit mask with one bit per switch.",
          },
          {
            id: "use_hash_map_only",
            text: "A hash map is the only possible representation.",
          },
          {
            id: "use_prefix_sum",
            text: "A prefix sum array over the switches.",
          },
          {
            id: "use_binary_search",
            text: "Binary search over the switch labels.",
          },
        ],
        prompt: "Which representation fits small boolean state compression?",
        status: "active",
        testedSkillAtomIds: ["recognize_state_compression_with_bitmask"],
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
        nodeId: "recognize_state_compression_with_bitmask",
        role: "primary",
      },
    ],
    title: "Recognize bitmask state compression",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The operation should check whether all required items are present, while allowing extra items in the subset.",
      mentalModelCorrection:
        "To test whether required is contained in mask, check (mask & required) === required.",
      mistakeTypes: [
        "subset_containment_confused_with_overlap",
        "membership_check_operation_confused",
      ],
      nextAction:
        "Distinguish 'any shared item' from 'every required item is present'.",
      result: "diagnostic",
      distractorExplanations: {
        any_overlap:
          "This only proves at least one required item is present, not all of them.",
        exact_equal:
          "Exact equality rejects masks that contain all required items plus extra items.",
        use_or:
          "OR builds a combined mask; it does not prove the original mask already contained required.",
      },
    },
    id: "alg-bit-manipulation-subset-masks-and-state-compression-016",
    learningStage: "foundations",
    primarySkillAtomId: "test_subset_containment_with_mask",
    prompt:
      "You need to check whether subset mask contains every item in required, while allowing extra items. Which expression is correct?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "and_equals_required",
        feedback:
          "Correct. (mask & required) === required means every required bit is present in mask.",
        id: "alg-bit-manipulation-subset-masks-and-state-compression-016-check",
        mistakeTypes: [
          "subset_containment_confused_with_overlap",
          "membership_check_operation_confused",
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
            id: "exact_equal",
            text: "mask === required.",
          },
          {
            id: "use_or",
            text: "(mask | required) === required.",
          },
        ],
        prompt: "How do you check that all required items are present?",
        status: "active",
        testedSkillAtomIds: ["test_subset_containment_with_mask"],
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
        nodeId: "test_subset_containment_with_mask",
        role: "primary",
      },
    ],
    title: "Check required subset containment",
    trackId: "algorithms",
    type: "single_choice",
  },
];
