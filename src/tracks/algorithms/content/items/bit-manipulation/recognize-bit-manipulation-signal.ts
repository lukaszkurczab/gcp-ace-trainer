export const recognizeBitManipulationSignalQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The state is a compact group of independent on/off flags, so each flag can map to one bit.",
      mentalModelCorrection:
        "Bit manipulation is a good fit when boolean states can be represented as bits and updated with masks.",
      mistakeTypes: ["pattern_signal_missed", "flag_state_not_recognized"],
      nextAction:
        "When you see many independent yes/no states, ask whether each state can map to one bit position.",
      result: "diagnostic",
      distractorExplanations: {
        use_boolean_array:
          "A boolean array can represent the states, but the prompt asks for a compact permission value where each independent flag can map to one bit.",
        use_string_set:
          "A set of permission strings can work at a higher level, but it does not use the compact encoded flag structure described by the prompt.",
        use_count:
          "A count of enabled permissions loses which specific permissions are enabled.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_flag_mask_signal",
    prompt:
      "A permission value stores READ, WRITE, and EXECUTE as independent on/off states. Which pattern signal is strongest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bit_flags",
        feedback:
          "Correct. Independent boolean permissions are a strong signal for bit flags and masks.",
        id: "alg-bit-manipulation-recognize-signal-001-check",
        mistakeTypes: ["pattern_signal_missed", "flag_state_not_recognized"],
        options: [
          {
            id: "bit_flags",
            text: "Use bit manipulation because each permission can map to one bit.",
          },
          {
            id: "use_boolean_array",
            text: "Use only a boolean array because compact encoding is irrelevant.",
          },
          {
            id: "use_string_set",
            text: "Use only a set of permission strings because independent flags cannot be encoded as bits.",
          },
          {
            id: "use_count",
            text: "Store only the number of enabled permissions.",
          },
        ],
        prompt: "Which pattern best matches compact independent on/off flags?",
        status: "active",
        testedSkillAtomIds: ["recognize_flag_mask_signal"],
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
        nodeId: "recognize_flag_mask_signal",
        role: "primary",
      },
    ],
    title: "Recognize independent flags as a bit-mask signal",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    feedbackModel: {
      decisionSignal:
        "The problem only asks for arithmetic on numbers, with no binary representation, flags, parity, or bit positions.",
      mentalModelCorrection:
        "Not every numeric problem is a bit manipulation problem. Use bits only when the binary representation simplifies the task.",
      mistakeTypes: [
        "numeric_problem_overclassified_as_bits",
        "pattern_overfit",
      ],
      nextAction:
        "Look for a bit-level signal before choosing bit manipulation.",
      result: "diagnostic",
      distractorExplanations: {
        use_bits_for_all_numbers:
          "Numbers alone are not enough. The task must benefit from binary structure.",
        use_xor: "XOR has no clear role when the task is ordinary arithmetic.",
        use_mask:
          "A mask is useful for bit positions or flags, not generic addition.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-002",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_numeric_problem_overclassification",
    prompt:
      "A task asks you to compute the sum and average of an array of integers. There are no flags, parity rules, powers of two, or binary-position constraints. What should you conclude?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "not_bit_signal",
        feedback:
          "Correct. Ordinary numeric aggregation is not automatically a bit manipulation problem.",
        id: "alg-bit-manipulation-recognize-signal-002-check",
        mistakeTypes: [
          "numeric_problem_overclassified_as_bits",
          "pattern_overfit",
        ],
        options: [
          {
            id: "not_bit_signal",
            text: "This is normal arithmetic/aggregation, not a bit manipulation signal.",
          },
          {
            id: "use_bits_for_all_numbers",
            text: "Use bit manipulation because the input contains integers.",
          },
          {
            id: "use_xor",
            text: "Use XOR because XOR is the default for numeric arrays.",
          },
          {
            id: "use_mask",
            text: "Build a mask from every number before summing.",
          },
        ],
        prompt: "Does a generic integer sum imply bit manipulation?",
        status: "active",
        testedSkillAtomIds: ["avoid_numeric_problem_overclassification"],
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
        nodeId: "avoid_numeric_problem_overclassification",
        role: "primary",
      },
    ],
    title: "Do not treat all numeric tasks as bit tasks",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The task needs exact frequencies, not only odd/even cancellation.",
      mentalModelCorrection:
        "XOR is useful for parity/cancellation assumptions. If exact counts matter, hash map counting is usually the right model.",
      mistakeTypes: ["xor_overused_for_duplicates", "frequency_need_missed"],
      nextAction:
        "Ask whether the problem needs exact counts or only pair cancellation/parity.",
      result: "diagnostic",
      distractorExplanations: {
        use_xor:
          "XOR loses exact frequency information. It only preserves parity-style cancellation.",
        use_sorting_only:
          "Sorting can group equal values, but the key signal here is exact frequency counting.",
        use_mask:
          "A bit mask does not store arbitrary counts for repeated values.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-003",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_xor_from_frequency_counting",
    prompt:
      "You need to return every value that appears at least three times in an array. Which reasoning is safest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "hash_map_counts",
        feedback:
          "Correct. Exact occurrence counts point to hash map/set counting, not XOR cancellation.",
        id: "alg-bit-manipulation-recognize-signal-003-check",
        mistakeTypes: ["xor_overused_for_duplicates", "frequency_need_missed"],
        options: [
          {
            id: "hash_map_counts",
            text: "Use frequency counting because exact counts matter.",
          },
          {
            id: "use_xor",
            text: "Use XOR because the problem mentions duplicates.",
          },
          {
            id: "use_sorting_only",
            text: "Always sort first because all duplicate problems are sorting problems.",
          },
          {
            id: "use_mask",
            text: "Use one bit per value to store how many times it appears.",
          },
        ],
        prompt: "Should arbitrary duplicate-count problems default to XOR?",
        status: "active",
        testedSkillAtomIds: ["distinguish_xor_from_frequency_counting"],
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
        nodeId: "distinguish_xor_from_frequency_counting",
        role: "primary",
      },
    ],
    title: "Reject XOR when exact counts matter",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "All values cancel in pairs except one value, so parity/cancellation is the central structure.",
      mentalModelCorrection:
        "XOR is a bit manipulation signal when pair cancellation leaves one odd-occurring value.",
      mistakeTypes: ["xor_signal_missed", "parity_signal_missed"],
      nextAction:
        "When duplicates appear exactly twice except one value, test whether XOR cancellation fits.",
      result: "diagnostic",
      distractorExplanations: {
        use_hash_map_required:
          "A hash map works, but the stronger pattern signal is XOR pair cancellation.",
        use_sorting_required:
          "Sorting can solve it, but it does not use the cancellation structure directly.",
        use_sliding_window:
          "Sliding window is for contiguous ranges, not global pair cancellation.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-004",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_xor_cancellation_signal",
    prompt:
      "An array contains integers where every value appears exactly twice except one value that appears once. Which pattern signal is strongest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "xor_cancellation",
        feedback:
          "Correct. Pair cancellation is a strong XOR/bit manipulation signal.",
        id: "alg-bit-manipulation-recognize-signal-004-check",
        mistakeTypes: ["xor_signal_missed", "parity_signal_missed"],
        options: [
          {
            id: "xor_cancellation",
            text: "Use XOR cancellation because pairs cancel and one value remains.",
          },
          {
            id: "use_hash_map_required",
            text: "Use a hash map because XOR cannot use duplicate structure.",
          },
          {
            id: "use_sorting_required",
            text: "Use sorting because the array must be ordered before any reasoning.",
          },
          {
            id: "use_sliding_window",
            text: "Use sliding window because the answer is one value.",
          },
        ],
        prompt: "Which signal points to bit manipulation here?",
        status: "active",
        testedSkillAtomIds: ["recognize_xor_cancellation_signal"],
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
        nodeId: "recognize_xor_cancellation_signal",
        role: "primary",
      },
    ],
    title: "Recognize pair cancellation as XOR signal",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A subset of a small fixed item set can be encoded by one bit per item.",
      mentalModelCorrection:
        "Bit masks are a good representation when a small set of boolean membership decisions must be stored or enumerated compactly.",
      mistakeTypes: [
        "subset_mask_signal_missed",
        "state_representation_confused",
      ],
      nextAction:
        "When the problem has a small fixed universe of items, consider mapping item i to bit i.",
      result: "diagnostic",
      distractorExplanations: {
        use_large_hash_set:
          "A hash set can represent membership, but the fixed small universe is a strong bit-mask signal.",
        use_two_pointers: "Two pointers does not represent arbitrary subsets.",
        use_prefix_sums:
          "Prefix sums aggregate ranges; they do not encode subset membership.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-005",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_subset_mask_signal",
    prompt:
      "You have at most 12 features, and each state is a subset of enabled features. Which representation signal is strongest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "subset_bitmask",
        feedback:
          "Correct. A small fixed universe of enabled/disabled items is a strong subset-mask signal.",
        id: "alg-bit-manipulation-recognize-signal-005-check",
        mistakeTypes: [
          "subset_mask_signal_missed",
          "state_representation_confused",
        ],
        options: [
          {
            id: "subset_bitmask",
            text: "Represent each subset as a bit mask.",
          },
          {
            id: "use_large_hash_set",
            text: "Always use a hash set because masks cannot represent membership.",
          },
          {
            id: "use_two_pointers",
            text: "Use two pointers because features can be listed in order.",
          },
          {
            id: "use_prefix_sums",
            text: "Use prefix sums because enabled features should be accumulated.",
          },
        ],
        prompt: "Which pattern fits small fixed subset states?",
        status: "active",
        testedSkillAtomIds: ["recognize_subset_mask_signal"],
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
        nodeId: "recognize_subset_mask_signal",
        role: "primary",
      },
    ],
    title: "Recognize subset state as a bit-mask signal",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The set universe is large and not naturally bounded by a small number of bit positions.",
      mentalModelCorrection:
        "Bit masks are best for small fixed universes. Large or dynamic membership usually points to a hash set or map.",
      mistakeTypes: [
        "bitmask_overused_for_large_universe",
        "representation_choice_error",
      ],
      nextAction:
        "Check whether the universe size is small and fixed before choosing a bit mask.",
      result: "diagnostic",
      distractorExplanations: {
        force_bitmask:
          "A mask becomes awkward or impossible when the universe is large and dynamic.",
        use_sliding_window:
          "Sliding window is about contiguous windows, not arbitrary dynamic membership.",
        use_binary_search:
          "Binary search needs ordered monotonic/search structure, not just dynamic membership.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-006",
    learningStage: "foundations",
    primarySkillAtomId: "avoid_bitmask_for_large_dynamic_sets",
    prompt:
      "You need to track membership of arbitrary user IDs, and the ID range is large and dynamic. Which conclusion is safest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "hash_set_better",
        feedback:
          "Correct. Large dynamic membership points to a hash set/map, not a compact bit mask.",
        id: "alg-bit-manipulation-recognize-signal-006-check",
        mistakeTypes: [
          "bitmask_overused_for_large_universe",
          "representation_choice_error",
        ],
        options: [
          {
            id: "hash_set_better",
            text: "Use a hash set/map unless there is a small fixed ID universe.",
          },
          {
            id: "force_bitmask",
            text: "Always use one integer bit mask for any membership problem.",
          },
          {
            id: "use_sliding_window",
            text: "Use sliding window because IDs arrive over time.",
          },
          {
            id: "use_binary_search",
            text: "Use binary search because IDs are numbers.",
          },
        ],
        prompt: "Should arbitrary large ID membership default to bit masks?",
        status: "active",
        testedSkillAtomIds: ["avoid_bitmask_for_large_dynamic_sets"],
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
        nodeId: "avoid_bitmask_for_large_dynamic_sets",
        role: "primary",
      },
    ],
    title: "Avoid bit masks for large dynamic membership",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The task only needs odd/even state changes, so parity is the central signal.",
      mentalModelCorrection:
        "Bit manipulation often fits parity toggling: a bit can flip each time an event is seen.",
      mistakeTypes: ["parity_signal_missed", "state_toggle_model_missed"],
      nextAction:
        "When only odd/even occurrence matters, consider whether toggling a bit captures the state.",
      result: "diagnostic",
      distractorExplanations: {
        exact_count_map:
          "Exact counts are unnecessary if only odd/even parity is needed.",
        sorting_required: "Sorting does not directly express parity toggling.",
        prefix_sum_required:
          "Prefix sums are for cumulative numeric aggregates, not toggled parity state.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-007",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_parity_toggle_signal",
    prompt:
      "A task only needs to know whether each of several small categories has appeared an odd or even number of times. Which signal does this suggest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "parity_bit_toggle",
        feedback:
          "Correct. Odd/even state can often be represented by toggling bits.",
        id: "alg-bit-manipulation-recognize-signal-007-check",
        mistakeTypes: ["parity_signal_missed", "state_toggle_model_missed"],
        options: [
          {
            id: "parity_bit_toggle",
            text: "A parity/toggle bit-mask signal.",
          },
          {
            id: "exact_count_map",
            text: "Exact frequency counting is required even though only parity matters.",
          },
          {
            id: "sorting_required",
            text: "Sorting is required before parity can be represented.",
          },
          {
            id: "prefix_sum_required",
            text: "Prefix sums are the direct pattern because the state changes over time.",
          },
        ],
        prompt:
          "Which pattern signal appears when only odd/even state matters?",
        status: "active",
        testedSkillAtomIds: ["recognize_parity_toggle_signal"],
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
        nodeId: "recognize_parity_toggle_signal",
        role: "primary",
      },
    ],
    title: "Recognize odd/even parity as a bit signal",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The task asks whether a number has exactly one set bit, which is a power-of-two binary structure.",
      mentalModelCorrection:
        "Power-of-two checks are bit manipulation candidates when the binary shape matters.",
      mistakeTypes: ["power_of_two_signal_missed", "arithmetic_only_reasoning"],
      nextAction:
        "For power-of-two questions, look for the exactly-one-set-bit property.",
      result: "diagnostic",
      distractorExplanations: {
        repeated_division_only:
          "Repeated division can test the property, but the strongest bit-manipulation signal is the exactly-one-set-bit binary shape.",
        evenness_only:
          "Evenness is not enough. Many even numbers are not powers of two.",
        decimal_digits:
          "Decimal appearance does not determine whether the binary representation has exactly one set bit.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-008",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_power_of_two_signal",
    prompt:
      "A task asks whether n is a power of two. Which algorithmic signal is most relevant?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bit_shape",
        feedback:
          "Correct. Powers of two have a distinctive binary shape: exactly one set bit.",
        id: "alg-bit-manipulation-recognize-signal-008-check",
        mistakeTypes: [
          "power_of_two_signal_missed",
          "arithmetic_only_reasoning",
        ],
        options: [
          {
            id: "bit_shape",
            text: "Bit manipulation, because powers of two have exactly one set bit.",
          },
          {
            id: "repeated_division_only",
            text: "Only repeated division by 2 matters; the binary shape is irrelevant.",
          },
          {
            id: "evenness_only",
            text: "Only check whether n is even.",
          },
          {
            id: "decimal_digits",
            text: "Inspect the decimal digits of n.",
          },
        ],
        prompt: "Which signal appears in a power-of-two check?",
        status: "active",
        testedSkillAtomIds: ["recognize_power_of_two_signal"],
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
        nodeId: "recognize_power_of_two_signal",
        role: "primary",
      },
    ],
    title: "Recognize power-of-two structure",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The problem's core state fits inside a fixed-width integer, with each bit carrying a meaning.",
      mentalModelCorrection:
        "Fixed-width encoded state is a bit manipulation signal when operations depend on extracting, checking, or modifying bit fields.",
      mistakeTypes: [
        "fixed_width_state_signal_missed",
        "bit_field_model_missed",
      ],
      nextAction:
        "Ask whether parts of the integer are meaningful fields or flags rather than ordinary numeric magnitude.",
      result: "diagnostic",
      distractorExplanations: {
        ordinary_arithmetic:
          "The integer is not just a magnitude; its individual bits encode state.",
        use_hash_map:
          "A hash map can store fields, but the encoded fixed-width state is already structured as bits.",
        use_binary_search:
          "Binary search needs a monotonic search space, not merely a fixed-width encoding.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-009",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_fixed_width_state_signal",
    prompt:
      "An integer encodes several small fields, and the task asks you to extract or update specific bit positions. Which pattern signal is strongest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "encoded_bit_state",
        feedback:
          "Correct. Specific bit positions carrying meaning is a direct bit manipulation signal.",
        id: "alg-bit-manipulation-recognize-signal-009-check",
        mistakeTypes: [
          "fixed_width_state_signal_missed",
          "bit_field_model_missed",
        ],
        options: [
          {
            id: "encoded_bit_state",
            text: "Bit manipulation because the integer is an encoded bit-level state.",
          },
          {
            id: "ordinary_arithmetic",
            text: "Normal arithmetic because all integers should be treated only as magnitudes.",
          },
          {
            id: "use_hash_map",
            text: "Hash map because fields always require key-value storage.",
          },
          {
            id: "use_binary_search",
            text: "Binary search because the value is numeric.",
          },
        ],
        prompt:
          "What signal appears when bit positions carry specific meaning?",
        status: "active",
        testedSkillAtomIds: ["recognize_fixed_width_state_signal"],
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
        nodeId: "recognize_fixed_width_state_signal",
        role: "primary",
      },
    ],
    title: "Recognize fixed-width encoded bit state",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The task is about finding a target in a sorted array, not about binary representation.",
      mentalModelCorrection:
        "The word binary in binary search does not mean bit manipulation. Use binary search for ordered monotonic search spaces.",
      mistakeTypes: [
        "binary_search_confused_with_bits",
        "pattern_name_confusion",
      ],
      nextAction:
        "Separate 'binary' as halving a search space from binary representation of integers.",
      result: "diagnostic",
      distractorExplanations: {
        use_bit_manipulation:
          "Sorted-array search uses order and halving, not bit-level integer structure.",
        use_xor:
          "XOR cancellation has no role in locating a target in a sorted array.",
        use_mask:
          "Masks operate on bit positions or flags, not sorted array indices by default.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-010",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_binary_search_from_bit_manipulation",
    prompt:
      "A sorted array is searched by repeatedly cutting the search interval in half. Which pattern does this describe?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "binary_search",
        feedback: "Correct. This is binary search, not bit manipulation.",
        id: "alg-bit-manipulation-recognize-signal-010-check",
        mistakeTypes: [
          "binary_search_confused_with_bits",
          "pattern_name_confusion",
        ],
        options: [
          {
            id: "binary_search",
            text: "Binary search, because the ordered search space is halved.",
          },
          {
            id: "use_bit_manipulation",
            text: "Bit manipulation, because the word binary appears.",
          },
          {
            id: "use_xor",
            text: "XOR cancellation, because a target value must remain.",
          },
          {
            id: "use_mask",
            text: "Bit masks, because indices can be numbers.",
          },
        ],
        prompt: "Does binary search imply bit manipulation?",
        status: "active",
        testedSkillAtomIds: ["distinguish_binary_search_from_bit_manipulation"],
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
        nodeId: "distinguish_binary_search_from_bit_manipulation",
        role: "primary",
      },
    ],
    title: "Do not confuse binary search with bit manipulation",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The problem asks many range-sum queries over an array, which points to cumulative aggregation.",
      mentalModelCorrection:
        "Range aggregation over arrays is a prefix-sum signal unless the values themselves require bit-level reasoning.",
      mistakeTypes: ["range_query_misclassified_as_bits", "pattern_overfit"],
      nextAction:
        "When queries ask for sums over intervals, check prefix sums before considering bits.",
      result: "diagnostic",
      distractorExplanations: {
        use_bit_manipulation:
          "The task is about range sums, not binary representation or masks.",
        use_xor: "XOR is not a replacement for numeric sum queries.",
        use_flags:
          "Flags represent boolean state, not general range-sum aggregation.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-011",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_prefix_sums_from_bit_manipulation",
    prompt:
      "You need to answer many sum queries over subarrays. There is no parity or bit-position constraint. Which pattern signal is strongest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "prefix_sums",
        feedback:
          "Correct. Repeated subarray sum queries point to prefix sums, not bit manipulation.",
        id: "alg-bit-manipulation-recognize-signal-011-check",
        mistakeTypes: ["range_query_misclassified_as_bits", "pattern_overfit"],
        options: [
          {
            id: "prefix_sums",
            text: "Prefix sums, because the task is repeated range aggregation.",
          },
          {
            id: "use_bit_manipulation",
            text: "Bit manipulation, because array values are integers.",
          },
          {
            id: "use_xor",
            text: "XOR, because all range queries can use cancellation.",
          },
          {
            id: "use_flags",
            text: "Bit flags, because a range has a start and end.",
          },
        ],
        prompt: "Which pattern fits many subarray sum queries?",
        status: "active",
        testedSkillAtomIds: ["distinguish_prefix_sums_from_bit_manipulation"],
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
        nodeId: "distinguish_prefix_sums_from_bit_manipulation",
        role: "primary",
      },
    ],
    title: "Prefer prefix sums for range sums",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The task is about a contiguous window whose boundaries move through a sequence.",
      mentalModelCorrection:
        "Sliding window is the natural signal when the problem asks for a best or valid contiguous segment. Bit manipulation is only relevant if the window state itself has a bit-level representation.",
      mistakeTypes: [
        "sliding_window_misclassified_as_bits",
        "contiguity_signal_missed",
      ],
      nextAction:
        "If the word contiguous or substring/subarray appears, test sliding-window structure first.",
      result: "diagnostic",
      distractorExplanations: {
        use_bitmask_by_default:
          "A bit mask is not the primary pattern when the core decision is moving a contiguous window.",
        use_sorting: "Sorting destroys contiguity of the original sequence.",
        use_binary_search:
          "There is no monotonic answer search described here.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-012",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_sliding_window_from_bit_manipulation",
    prompt:
      "A problem asks for the longest contiguous substring satisfying a character constraint. There is no small fixed bit-state requirement. Which pattern signal is strongest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "sliding_window",
        feedback:
          "Correct. Longest valid contiguous substring is primarily a sliding-window signal.",
        id: "alg-bit-manipulation-recognize-signal-012-check",
        mistakeTypes: [
          "sliding_window_misclassified_as_bits",
          "contiguity_signal_missed",
        ],
        options: [
          {
            id: "sliding_window",
            text: "Sliding window, because the core object is a contiguous moving segment.",
          },
          {
            id: "use_bitmask_by_default",
            text: "Bit manipulation, because characters can be encoded as bits.",
          },
          {
            id: "use_sorting",
            text: "Sorting, because characters can be reordered.",
          },
          {
            id: "use_binary_search",
            text: "Binary search, because the substring has a length.",
          },
        ],
        prompt: "Which pattern fits longest valid contiguous substring?",
        status: "active",
        testedSkillAtomIds: [
          "distinguish_sliding_window_from_bit_manipulation",
        ],
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
        nodeId: "distinguish_sliding_window_from_bit_manipulation",
        role: "primary",
      },
    ],
    title: "Do not replace sliding window with bit manipulation",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The state has two dimensions: a current position and a subset of completed tasks.",
      mentalModelCorrection:
        "A subset mask can be a useful state component when a small fixed set of tasks/items must be represented compactly.",
      mistakeTypes: [
        "subset_state_signal_missed",
        "dp_bitmask_boundary_confused",
      ],
      nextAction:
        "Identify the subset representation separately from the higher-level algorithm that may use it.",
      result: "diagnostic",
      distractorExplanations: {
        pure_dp_only:
          "Dynamic programming may be involved later, but the subset component itself is a bit-mask representation signal.",
        hash_set_only:
          "A hash set can store membership, but a small fixed subset state can be encoded more compactly as bits.",
        sorting_only:
          "Sorting does not encode which tasks have already been completed.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-013",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_bitmask_as_state_component",
    prompt:
      "A state needs to remember which of 10 tasks have already been completed. What is the bit manipulation signal?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "subset_state_component",
        feedback:
          "Correct. The completed-task subset can be represented as a bit mask.",
        id: "alg-bit-manipulation-recognize-signal-013-check",
        mistakeTypes: [
          "subset_state_signal_missed",
          "dp_bitmask_boundary_confused",
        ],
        options: [
          {
            id: "subset_state_component",
            text: "The completed-task subset can be encoded as one bit per task.",
          },
          {
            id: "pure_dp_only",
            text: "Only dynamic programming matters; there is no bit-level representation signal.",
          },
          {
            id: "hash_set_only",
            text: "Only a hash set can represent completed tasks.",
          },
          {
            id: "sorting_only",
            text: "Sort tasks to know which ones are completed.",
          },
        ],
        prompt: "Which part of the state points to bit manipulation?",
        status: "active",
        testedSkillAtomIds: ["recognize_bitmask_as_state_component"],
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
        nodeId: "recognize_bitmask_as_state_component",
        role: "primary",
      },
    ],
    title: "Recognize bit masks as state components",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "The task asks for repeated minimum/maximum priority retrieval, not bit-level state.",
      mentalModelCorrection:
        "Use heap/priority queue signals for repeated priority extraction. Bit manipulation is not the default just because priorities are numeric.",
      mistakeTypes: [
        "numeric_problem_overclassified_as_bits",
        "heap_signal_missed",
      ],
      nextAction:
        "If the operation repeatedly asks for smallest/largest active item, consider heap/priority queue.",
      result: "diagnostic",
      distractorExplanations: {
        use_bits:
          "Numeric priorities do not imply binary representation is relevant.",
        use_xor: "XOR cancellation does not maintain priority order.",
        use_mask:
          "A mask does not directly provide repeated min/max extraction.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-014",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_heap_from_bit_manipulation",
    prompt:
      "A task repeatedly asks you to extract the smallest currently available value. The values are integers, but no bit-level property is used. Which signal is strongest?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "heap_priority_queue",
        feedback:
          "Correct. Repeated smallest/largest extraction points to heap/priority queue, not bit manipulation.",
        id: "alg-bit-manipulation-recognize-signal-014-check",
        mistakeTypes: [
          "numeric_problem_overclassified_as_bits",
          "heap_signal_missed",
        ],
        options: [
          {
            id: "heap_priority_queue",
            text: "Heap/priority queue.",
          },
          {
            id: "use_bits",
            text: "Bit manipulation, because priorities are integers.",
          },
          {
            id: "use_xor",
            text: "XOR, because the smallest value should cancel out.",
          },
          {
            id: "use_mask",
            text: "A bit mask, because a priority can be stored in binary.",
          },
        ],
        prompt: "Which pattern fits repeated min extraction?",
        status: "active",
        testedSkillAtomIds: ["distinguish_heap_from_bit_manipulation"],
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
        nodeId: "distinguish_heap_from_bit_manipulation",
        role: "primary",
      },
    ],
    title: "Do not use bits for priority extraction",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The core structure is nodes and edges, so traversal over graph connectivity is the main issue.",
      mentalModelCorrection:
        "Graph traversal is the primary pattern for reachability/connectivity. Bit masks may represent visited state in small cases, but they do not replace graph reasoning.",
      mistakeTypes: [
        "graph_signal_missed",
        "bitmask_overused_for_connectivity",
      ],
      nextAction:
        "When relationships are edges between nodes, identify traversal needs before optimizing state representation.",
      result: "diagnostic",
      distractorExplanations: {
        use_bitmask_primary:
          "A visited mask may be a representation detail, but connectivity is still a graph traversal problem.",
        use_sorting: "Sorting does not reveal reachability through edges.",
        use_prefix_sums:
          "Prefix sums aggregate linear ranges, not graph connectivity.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-015",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_graph_traversal_from_bit_manipulation",
    prompt:
      "A problem asks whether every node is reachable from a start node in an adjacency-list graph. What is the primary pattern signal?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "graph_traversal",
        feedback:
          "Correct. Reachability through edges is primarily a graph traversal signal.",
        id: "alg-bit-manipulation-recognize-signal-015-check",
        mistakeTypes: [
          "graph_signal_missed",
          "bitmask_overused_for_connectivity",
        ],
        options: [
          {
            id: "graph_traversal",
            text: "Graph traversal, because reachability depends on edges.",
          },
          {
            id: "use_bitmask_primary",
            text: "Bit manipulation is the primary pattern because visited nodes could be encoded as bits.",
          },
          {
            id: "use_sorting",
            text: "Sorting, because nodes can be ordered.",
          },
          {
            id: "use_prefix_sums",
            text: "Prefix sums, because reachability accumulates.",
          },
        ],
        prompt: "Which pattern is primary for graph reachability?",
        status: "active",
        testedSkillAtomIds: [
          "distinguish_graph_traversal_from_bit_manipulation",
        ],
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
        nodeId: "distinguish_graph_traversal_from_bit_manipulation",
        role: "primary",
      },
    ],
    title: "Keep graph traversal primary for reachability",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "The problem asks for compactly storing and combining up to 32 boolean options.",
      mentalModelCorrection:
        "Bit manipulation is appropriate when the bit-level representation directly simplifies storage, combination, or checks.",
      mistakeTypes: [
        "bit_pattern_signal_missed",
        "representation_choice_error",
      ],
      nextAction:
        "Choose bit manipulation when the operation becomes simpler as check/set/clear/combine on bits.",
      result: "diagnostic",
      distractorExplanations: {
        use_array_booleans_only:
          "An array of booleans can work, but the compact fixed-size flag requirement strongly supports a bit mask.",
        use_sorting:
          "Sorting does not simplify checking or combining boolean flags.",
        use_binary_search:
          "There is no ordered monotonic search space to halve.",
      },
    },
    id: "alg-bit-manipulation-recognize-signal-016",
    learningStage: "foundations",
    primarySkillAtomId:
      "choose_bit_manipulation_when_representation_simplifies_operations",
    prompt:
      "You need to store up to 32 independent feature toggles, quickly combine two feature sets, and check whether a feature is enabled. Which pattern choice is most justified?",
    roadmapNodeId: "bit_manipulation",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "bit_mask_flags",
        feedback:
          "Correct. Fixed independent toggles with combine/check operations are a strong bit-mask fit.",
        id: "alg-bit-manipulation-recognize-signal-016-check",
        mistakeTypes: [
          "bit_pattern_signal_missed",
          "representation_choice_error",
        ],
        options: [
          {
            id: "bit_mask_flags",
            text: "Use bit manipulation with one bit per feature.",
          },
          {
            id: "use_array_booleans_only",
            text: "Never use bit masks; only arrays of booleans can represent toggles.",
          },
          {
            id: "use_sorting",
            text: "Sort enabled features before every check.",
          },
          {
            id: "use_binary_search",
            text: "Use binary search because there are up to 32 options.",
          },
        ],
        prompt: "When is bit manipulation justified by representation?",
        status: "active",
        testedSkillAtomIds: [
          "choose_bit_manipulation_when_representation_simplifies_operations",
        ],
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
        nodeId:
          "choose_bit_manipulation_when_representation_simplifies_operations",
        role: "primary",
      },
    ],
    title: "Choose bits when representation simplifies operations",
    trackId: "algorithms",
    type: "single_choice",
  },
];
