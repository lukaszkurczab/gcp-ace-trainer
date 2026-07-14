import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const recognizeBitManipulationSignalQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The state is a compact group of independent on/off flags, so each flag can map to one bit.",
      "mentalModelCorrection": "Bit manipulation is a good fit when boolean states can be represented as bits and updated with masks.",
      "mistakeTypes": [
        "pattern_signal_missed",
        "flag_state_not_recognized"
      ],
      "nextAction": "When you see many independent yes/no states, ask whether each state can map to one bit position.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_boolean_array": "A boolean array can represent the states, but the prompt asks for a compact permission value where each independent flag can map to one bit.",
        "use_string_set": "A set of permission strings can work at a higher level, but it does not use the compact encoded flag structure described by the prompt.",
        "use_count": "A count of enabled permissions loses which specific permissions are enabled."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_flag_mask_signal",
    "prompt": "Which pattern best matches compact independent on/off flags?",
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
        "nodeId": "recognize_flag_mask_signal",
        "role": "primary"
      }
    ],
    "title": "Recognize independent flags as a bit-mask signal",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A permission value stores READ, WRITE, and EXECUTE as independent on/off states. Which pattern signal is strongest?",
    "answerFeedback": "Correct. Independent boolean permissions are a strong signal for bit flags and masks.",
    "options": [
      {
        "id": "bit_flags",
        "text": "Use bit manipulation because each permission can map to one bit.",
        "isCorrect": true
      },
      {
        "id": "use_boolean_array",
        "text": "Use only a boolean array because compact encoding is irrelevant.",
        "isCorrect": false
      },
      {
        "id": "use_string_set",
        "text": "Use only a set of permission strings because independent flags cannot be encoded as bits.",
        "isCorrect": false
      },
      {
        "id": "use_count",
        "text": "Store only the number of enabled permissions.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The problem only asks for arithmetic on numbers, with no binary representation, flags, parity, or bit positions.",
      "mentalModelCorrection": "Not every numeric problem is a bit manipulation problem. Use bits only when the binary representation simplifies the task.",
      "mistakeTypes": [
        "numeric_problem_overclassified_as_bits",
        "pattern_overfit"
      ],
      "nextAction": "Look for a bit-level signal before choosing bit manipulation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_bits_for_all_numbers": "Numbers alone are not enough. The task must benefit from binary structure.",
        "use_xor": "XOR has no clear role when the task is ordinary arithmetic.",
        "use_mask": "A mask is useful for bit positions or flags, not generic addition."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_numeric_problem_overclassification",
    "prompt": "Does a generic integer sum imply bit manipulation?",
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
        "nodeId": "avoid_numeric_problem_overclassification",
        "role": "primary"
      }
    ],
    "title": "Do not treat all numeric tasks as bit tasks",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task asks you to compute the sum and average of an array of integers. There are no flags, parity rules, powers of two, or binary-position constraints. What should you conclude?",
    "answerFeedback": "Correct. Ordinary numeric aggregation is not automatically a bit manipulation problem.",
    "options": [
      {
        "id": "not_bit_signal",
        "text": "This is normal arithmetic/aggregation, not a bit manipulation signal.",
        "isCorrect": true
      },
      {
        "id": "use_bits_for_all_numbers",
        "text": "Use bit manipulation because the input contains integers.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "Use XOR because XOR is the default for numeric arrays.",
        "isCorrect": false
      },
      {
        "id": "use_mask",
        "text": "Build a mask from every number before summing.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The task needs exact frequencies, not only odd/even cancellation.",
      "mentalModelCorrection": "XOR is useful for parity/cancellation assumptions. If exact counts matter, hash map counting is usually the right model.",
      "mistakeTypes": [
        "xor_overused_for_duplicates",
        "frequency_need_missed"
      ],
      "nextAction": "Ask whether the problem needs exact counts or only pair cancellation/parity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_xor": "XOR loses exact frequency information. It only preserves parity-style cancellation.",
        "use_sorting_only": "Sorting can group equal values, but the key signal here is exact frequency counting.",
        "use_mask": "A bit mask does not store arbitrary counts for repeated values."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_xor_from_frequency_counting",
    "prompt": "Should arbitrary duplicate-count problems default to XOR?",
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
        "nodeId": "distinguish_xor_from_frequency_counting",
        "role": "primary"
      }
    ],
    "title": "Reject XOR when exact counts matter",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to return every value that appears at least three times in an array. Which reasoning is safest?",
    "answerFeedback": "Correct. Exact occurrence counts point to hash map/set counting, not XOR cancellation.",
    "options": [
      {
        "id": "hash_map_counts",
        "text": "Use frequency counting because exact counts matter.",
        "isCorrect": true
      },
      {
        "id": "use_xor",
        "text": "Use XOR because the problem mentions duplicates.",
        "isCorrect": false
      },
      {
        "id": "use_sorting_only",
        "text": "Always sort first because all duplicate problems are sorting problems.",
        "isCorrect": false
      },
      {
        "id": "use_mask",
        "text": "Use one bit per value to store how many times it appears.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "All values cancel in pairs except one value, so parity/cancellation is the central structure.",
      "mentalModelCorrection": "XOR is a bit manipulation signal when pair cancellation leaves one odd-occurring value.",
      "mistakeTypes": [
        "xor_signal_missed",
        "parity_signal_missed"
      ],
      "nextAction": "When duplicates appear exactly twice except one value, test whether XOR cancellation fits.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_hash_map_required": "A hash map works, but the stronger pattern signal is XOR pair cancellation.",
        "use_sorting_required": "Sorting can solve it, but it does not use the cancellation structure directly.",
        "use_sliding_window": "Sliding window is for contiguous ranges, not global pair cancellation."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-004-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_xor_cancellation_signal",
    "prompt": "Which signal points to bit manipulation here?",
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
        "nodeId": "recognize_xor_cancellation_signal",
        "role": "primary"
      }
    ],
    "title": "Recognize pair cancellation as XOR signal",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "An array contains integers where every value appears exactly twice except one value that appears once. Which pattern signal is strongest?",
    "answerFeedback": "Correct. Pair cancellation is a strong XOR/bit manipulation signal.",
    "options": [
      {
        "id": "xor_cancellation",
        "text": "Use XOR cancellation because pairs cancel and one value remains.",
        "isCorrect": true
      },
      {
        "id": "use_hash_map_required",
        "text": "Use a hash map because XOR cannot use duplicate structure.",
        "isCorrect": false
      },
      {
        "id": "use_sorting_required",
        "text": "Use sorting because the array must be ordered before any reasoning.",
        "isCorrect": false
      },
      {
        "id": "use_sliding_window",
        "text": "Use sliding window because the answer is one value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A subset of a small fixed item set can be encoded by one bit per item.",
      "mentalModelCorrection": "Bit masks are a good representation when a small set of boolean membership decisions must be stored or enumerated compactly.",
      "mistakeTypes": [
        "subset_mask_signal_missed",
        "state_representation_confused"
      ],
      "nextAction": "When the problem has a small fixed universe of items, consider mapping item i to bit i.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_large_hash_set": "A hash set can represent membership, but the fixed small universe is a strong bit-mask signal.",
        "use_two_pointers": "Two pointers does not represent arbitrary subsets.",
        "use_prefix_sums": "Prefix sums aggregate ranges; they do not encode subset membership."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-005-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_subset_mask_signal",
    "prompt": "Which pattern fits small fixed subset states?",
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
        "nodeId": "recognize_subset_mask_signal",
        "role": "primary"
      }
    ],
    "title": "Recognize subset state as a bit-mask signal",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You have at most 12 features, and each state is a subset of enabled features. Which representation signal is strongest?",
    "answerFeedback": "Correct. A small fixed universe of enabled/disabled items is a strong subset-mask signal.",
    "options": [
      {
        "id": "subset_bitmask",
        "text": "Represent each subset as a bit mask.",
        "isCorrect": true
      },
      {
        "id": "use_large_hash_set",
        "text": "Always use a hash set because masks cannot represent membership.",
        "isCorrect": false
      },
      {
        "id": "use_two_pointers",
        "text": "Use two pointers because features can be listed in order.",
        "isCorrect": false
      },
      {
        "id": "use_prefix_sums",
        "text": "Use prefix sums because enabled features should be accumulated.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The set universe is large and not naturally bounded by a small number of bit positions.",
      "mentalModelCorrection": "Bit masks are best for small fixed universes. Large or dynamic membership usually points to a hash set or map.",
      "mistakeTypes": [
        "bitmask_overused_for_large_universe",
        "representation_choice_error"
      ],
      "nextAction": "Check whether the universe size is small and fixed before choosing a bit mask.",
      "result": "diagnostic",
      "distractorExplanations": {
        "force_bitmask": "A mask becomes awkward or impossible when the universe is large and dynamic.",
        "use_sliding_window": "Sliding window is about contiguous windows, not arbitrary dynamic membership.",
        "use_binary_search": "Binary search needs ordered monotonic/search structure, not just dynamic membership."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-006-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_bitmask_for_large_dynamic_sets",
    "prompt": "Should arbitrary large ID membership default to bit masks?",
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
        "nodeId": "avoid_bitmask_for_large_dynamic_sets",
        "role": "primary"
      }
    ],
    "title": "Avoid bit masks for large dynamic membership",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to track membership of arbitrary user IDs, and the ID range is large and dynamic. Which conclusion is safest?",
    "answerFeedback": "Correct. Large dynamic membership points to a hash set/map, not a compact bit mask.",
    "options": [
      {
        "id": "hash_set_better",
        "text": "Use a hash set/map unless there is a small fixed ID universe.",
        "isCorrect": true
      },
      {
        "id": "force_bitmask",
        "text": "Always use one integer bit mask for any membership problem.",
        "isCorrect": false
      },
      {
        "id": "use_sliding_window",
        "text": "Use sliding window because IDs arrive over time.",
        "isCorrect": false
      },
      {
        "id": "use_binary_search",
        "text": "Use binary search because IDs are numbers.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The task only needs odd/even state changes, so parity is the central signal.",
      "mentalModelCorrection": "Bit manipulation often fits parity toggling: a bit can flip each time an event is seen.",
      "mistakeTypes": [
        "parity_signal_missed",
        "state_toggle_model_missed"
      ],
      "nextAction": "When only odd/even occurrence matters, consider whether toggling a bit captures the state.",
      "result": "diagnostic",
      "distractorExplanations": {
        "exact_count_map": "Exact counts are unnecessary if only odd/even parity is needed.",
        "sorting_required": "Sorting does not directly express parity toggling.",
        "prefix_sum_required": "Prefix sums are for cumulative numeric aggregates, not toggled parity state."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-007-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_parity_toggle_signal",
    "prompt": "Which pattern signal appears when only odd/even state matters?",
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
        "nodeId": "recognize_parity_toggle_signal",
        "role": "primary"
      }
    ],
    "title": "Recognize odd/even parity as a bit signal",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task only needs to know whether each of several small categories has appeared an odd or even number of times. Which signal does this suggest?",
    "answerFeedback": "Correct. Odd/even state can often be represented by toggling bits.",
    "options": [
      {
        "id": "parity_bit_toggle",
        "text": "A parity/toggle bit-mask signal.",
        "isCorrect": true
      },
      {
        "id": "exact_count_map",
        "text": "Exact frequency counting is required even though only parity matters.",
        "isCorrect": false
      },
      {
        "id": "sorting_required",
        "text": "Sorting is required before parity can be represented.",
        "isCorrect": false
      },
      {
        "id": "prefix_sum_required",
        "text": "Prefix sums are the direct pattern because the state changes over time.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The task asks whether a number has exactly one set bit, which is a power-of-two binary structure.",
      "mentalModelCorrection": "Power-of-two checks are bit manipulation candidates when the binary shape matters.",
      "mistakeTypes": [
        "power_of_two_signal_missed",
        "arithmetic_only_reasoning"
      ],
      "nextAction": "For power-of-two questions, look for the exactly-one-set-bit property.",
      "result": "diagnostic",
      "distractorExplanations": {
        "repeated_division_only": "Repeated division can test the property, but the strongest bit-manipulation signal is the exactly-one-set-bit binary shape.",
        "evenness_only": "Evenness is not enough. Many even numbers are not powers of two.",
        "decimal_digits": "Decimal appearance does not determine whether the binary representation has exactly one set bit."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-008-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_power_of_two_signal",
    "prompt": "Which signal appears in a power-of-two check?",
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
        "nodeId": "recognize_power_of_two_signal",
        "role": "primary"
      }
    ],
    "title": "Recognize power-of-two structure",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task asks whether n is a power of two. Which algorithmic signal is most relevant?",
    "answerFeedback": "Correct. Powers of two have a distinctive binary shape: exactly one set bit.",
    "options": [
      {
        "id": "bit_shape",
        "text": "Bit manipulation, because powers of two have exactly one set bit.",
        "isCorrect": true
      },
      {
        "id": "repeated_division_only",
        "text": "Only repeated division by 2 matters; the binary shape is irrelevant.",
        "isCorrect": false
      },
      {
        "id": "evenness_only",
        "text": "Only check whether n is even.",
        "isCorrect": false
      },
      {
        "id": "decimal_digits",
        "text": "Inspect the decimal digits of n.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The problem's core state fits inside a fixed-width integer, with each bit carrying a meaning.",
      "mentalModelCorrection": "Fixed-width encoded state is a bit manipulation signal when operations depend on extracting, checking, or modifying bit fields.",
      "mistakeTypes": [
        "fixed_width_state_signal_missed",
        "bit_field_model_missed"
      ],
      "nextAction": "Ask whether parts of the integer are meaningful fields or flags rather than ordinary numeric magnitude.",
      "result": "diagnostic",
      "distractorExplanations": {
        "ordinary_arithmetic": "The integer is not just a magnitude; its individual bits encode state.",
        "use_hash_map": "A hash map can store fields, but the encoded fixed-width state is already structured as bits.",
        "use_binary_search": "Binary search needs a monotonic search space, not merely a fixed-width encoding."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-009-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_fixed_width_state_signal",
    "prompt": "What signal appears when bit positions carry specific meaning?",
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
        "nodeId": "recognize_fixed_width_state_signal",
        "role": "primary"
      }
    ],
    "title": "Recognize fixed-width encoded bit state",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "An integer encodes several small fields, and the task asks you to extract or update specific bit positions. Which pattern signal is strongest?",
    "answerFeedback": "Correct. Specific bit positions carrying meaning is a direct bit manipulation signal.",
    "options": [
      {
        "id": "encoded_bit_state",
        "text": "Bit manipulation because the integer is an encoded bit-level state.",
        "isCorrect": true
      },
      {
        "id": "ordinary_arithmetic",
        "text": "Normal arithmetic because all integers should be treated only as magnitudes.",
        "isCorrect": false
      },
      {
        "id": "use_hash_map",
        "text": "Hash map because fields always require key-value storage.",
        "isCorrect": false
      },
      {
        "id": "use_binary_search",
        "text": "Binary search because the value is numeric.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The task is about finding a target in a sorted array, not about binary representation.",
      "mentalModelCorrection": "The word binary in binary search does not mean bit manipulation. Use binary search for ordered monotonic search spaces.",
      "mistakeTypes": [
        "binary_search_confused_with_bits",
        "pattern_name_confusion"
      ],
      "nextAction": "Separate 'binary' as halving a search space from binary representation of integers.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_bit_manipulation": "Sorted-array search uses order and halving, not bit-level integer structure.",
        "use_xor": "XOR cancellation has no role in locating a target in a sorted array.",
        "use_mask": "Masks operate on bit positions or flags, not sorted array indices by default."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-010-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_binary_search_from_bit_manipulation",
    "prompt": "Does binary search imply bit manipulation?",
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
        "nodeId": "distinguish_binary_search_from_bit_manipulation",
        "role": "primary"
      }
    ],
    "title": "Do not confuse binary search with bit manipulation",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A sorted array is searched by repeatedly cutting the search interval in half. Which pattern does this describe?",
    "answerFeedback": "Correct. This is binary search, not bit manipulation.",
    "options": [
      {
        "id": "binary_search",
        "text": "Binary search, because the ordered search space is halved.",
        "isCorrect": true
      },
      {
        "id": "use_bit_manipulation",
        "text": "Bit manipulation, because the word binary appears.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "XOR cancellation, because a target value must remain.",
        "isCorrect": false
      },
      {
        "id": "use_mask",
        "text": "Bit masks, because indices can be numbers.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The problem asks many range-sum queries over an array, which points to cumulative aggregation.",
      "mentalModelCorrection": "Range aggregation over arrays is a prefix-sum signal unless the values themselves require bit-level reasoning.",
      "mistakeTypes": [
        "range_query_misclassified_as_bits",
        "pattern_overfit"
      ],
      "nextAction": "When queries ask for sums over intervals, check prefix sums before considering bits.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_bit_manipulation": "The task is about range sums, not binary representation or masks.",
        "use_xor": "XOR is not a replacement for numeric sum queries.",
        "use_flags": "Flags represent boolean state, not general range-sum aggregation."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-011-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_prefix_sums_from_bit_manipulation",
    "prompt": "Which pattern fits many subarray sum queries?",
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
        "nodeId": "distinguish_prefix_sums_from_bit_manipulation",
        "role": "primary"
      }
    ],
    "title": "Prefer prefix sums for range sums",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to answer many sum queries over subarrays. There is no parity or bit-position constraint. Which pattern signal is strongest?",
    "answerFeedback": "Correct. Repeated subarray sum queries point to prefix sums, not bit manipulation.",
    "options": [
      {
        "id": "prefix_sums",
        "text": "Prefix sums, because the task is repeated range aggregation.",
        "isCorrect": true
      },
      {
        "id": "use_bit_manipulation",
        "text": "Bit manipulation, because array values are integers.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "XOR, because all range queries can use cancellation.",
        "isCorrect": false
      },
      {
        "id": "use_flags",
        "text": "Bit flags, because a range has a start and end.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task is about a contiguous window whose boundaries move through a sequence.",
      "mentalModelCorrection": "Sliding window is the natural signal when the problem asks for a best or valid contiguous segment. Bit manipulation is only relevant if the window state itself has a bit-level representation.",
      "mistakeTypes": [
        "sliding_window_misclassified_as_bits",
        "contiguity_signal_missed"
      ],
      "nextAction": "If the word contiguous or substring/subarray appears, test sliding-window structure first.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_bitmask_by_default": "A bit mask is not the primary pattern when the core decision is moving a contiguous window.",
        "use_sorting": "Sorting destroys contiguity of the original sequence.",
        "use_binary_search": "There is no monotonic answer search described here."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-012-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_sliding_window_from_bit_manipulation",
    "prompt": "Which pattern fits longest valid contiguous substring?",
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
        "nodeId": "distinguish_sliding_window_from_bit_manipulation",
        "role": "primary"
      }
    ],
    "title": "Do not replace sliding window with bit manipulation",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A problem asks for the longest contiguous substring satisfying a character constraint. There is no small fixed bit-state requirement. Which pattern signal is strongest?",
    "answerFeedback": "Correct. Longest valid contiguous substring is primarily a sliding-window signal.",
    "options": [
      {
        "id": "sliding_window",
        "text": "Sliding window, because the core object is a contiguous moving segment.",
        "isCorrect": true
      },
      {
        "id": "use_bitmask_by_default",
        "text": "Bit manipulation, because characters can be encoded as bits.",
        "isCorrect": false
      },
      {
        "id": "use_sorting",
        "text": "Sorting, because characters can be reordered.",
        "isCorrect": false
      },
      {
        "id": "use_binary_search",
        "text": "Binary search, because the substring has a length.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The state has two dimensions: a current position and a subset of completed tasks.",
      "mentalModelCorrection": "A subset mask can be a useful state component when a small fixed set of tasks/items must be represented compactly.",
      "mistakeTypes": [
        "subset_state_signal_missed",
        "dp_bitmask_boundary_confused"
      ],
      "nextAction": "Identify the subset representation separately from the higher-level algorithm that may use it.",
      "result": "diagnostic",
      "distractorExplanations": {
        "pure_dp_only": "Dynamic programming may be involved later, but the subset component itself is a bit-mask representation signal.",
        "hash_set_only": "A hash set can store membership, but a small fixed subset state can be encoded more compactly as bits.",
        "sorting_only": "Sorting does not encode which tasks have already been completed."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-013-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_bitmask_as_state_component",
    "prompt": "Which part of the state points to bit manipulation?",
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
        "nodeId": "recognize_bitmask_as_state_component",
        "role": "primary"
      }
    ],
    "title": "Recognize bit masks as state components",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A state needs to remember which of 10 tasks have already been completed. What is the bit manipulation signal?",
    "answerFeedback": "Correct. The completed-task subset can be represented as a bit mask.",
    "options": [
      {
        "id": "subset_state_component",
        "text": "The completed-task subset can be encoded as one bit per task.",
        "isCorrect": true
      },
      {
        "id": "pure_dp_only",
        "text": "Only dynamic programming matters; there is no bit-level representation signal.",
        "isCorrect": false
      },
      {
        "id": "hash_set_only",
        "text": "Only a hash set can represent completed tasks.",
        "isCorrect": false
      },
      {
        "id": "sorting_only",
        "text": "Sort tasks to know which ones are completed.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "The task asks for repeated minimum/maximum priority retrieval, not bit-level state.",
      "mentalModelCorrection": "Use heap/priority queue signals for repeated priority extraction. Bit manipulation is not the default just because priorities are numeric.",
      "mistakeTypes": [
        "numeric_problem_overclassified_as_bits",
        "heap_signal_missed"
      ],
      "nextAction": "If the operation repeatedly asks for smallest/largest active item, consider heap/priority queue.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_bits": "Numeric priorities do not imply binary representation is relevant.",
        "use_xor": "XOR cancellation does not maintain priority order.",
        "use_mask": "A mask does not directly provide repeated min/max extraction."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-014-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_heap_from_bit_manipulation",
    "prompt": "Which pattern fits repeated min extraction?",
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
        "nodeId": "distinguish_heap_from_bit_manipulation",
        "role": "primary"
      }
    ],
    "title": "Do not use bits for priority extraction",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A task repeatedly asks you to extract the smallest currently available value. The values are integers, but no bit-level property is used. Which signal is strongest?",
    "answerFeedback": "Correct. Repeated smallest/largest extraction points to heap/priority queue, not bit manipulation.",
    "options": [
      {
        "id": "heap_priority_queue",
        "text": "Heap/priority queue.",
        "isCorrect": true
      },
      {
        "id": "use_bits",
        "text": "Bit manipulation, because priorities are integers.",
        "isCorrect": false
      },
      {
        "id": "use_xor",
        "text": "XOR, because the smallest value should cancel out.",
        "isCorrect": false
      },
      {
        "id": "use_mask",
        "text": "A bit mask, because a priority can be stored in binary.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The core structure is nodes and edges, so traversal over graph connectivity is the main issue.",
      "mentalModelCorrection": "Graph traversal is the primary pattern for reachability/connectivity. Bit masks may represent visited state in small cases, but they do not replace graph reasoning.",
      "mistakeTypes": [
        "graph_signal_missed",
        "bitmask_overused_for_connectivity"
      ],
      "nextAction": "When relationships are edges between nodes, identify traversal needs before optimizing state representation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_bitmask_primary": "A visited mask may be a representation detail, but connectivity is still a graph traversal problem.",
        "use_sorting": "Sorting does not reveal reachability through edges.",
        "use_prefix_sums": "Prefix sums aggregate linear ranges, not graph connectivity."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-015-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_graph_traversal_from_bit_manipulation",
    "prompt": "Which pattern is primary for graph reachability?",
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
        "nodeId": "distinguish_graph_traversal_from_bit_manipulation",
        "role": "primary"
      }
    ],
    "title": "Keep graph traversal primary for reachability",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A problem asks whether every node is reachable from a start node in an adjacency-list graph. What is the primary pattern signal?",
    "answerFeedback": "Correct. Reachability through edges is primarily a graph traversal signal.",
    "options": [
      {
        "id": "graph_traversal",
        "text": "Graph traversal, because reachability depends on edges.",
        "isCorrect": true
      },
      {
        "id": "use_bitmask_primary",
        "text": "Bit manipulation is the primary pattern because visited nodes could be encoded as bits.",
        "isCorrect": false
      },
      {
        "id": "use_sorting",
        "text": "Sorting, because nodes can be ordered.",
        "isCorrect": false
      },
      {
        "id": "use_prefix_sums",
        "text": "Prefix sums, because reachability accumulates.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The problem asks for compactly storing and combining up to 32 boolean options.",
      "mentalModelCorrection": "Bit manipulation is appropriate when the bit-level representation directly simplifies storage, combination, or checks.",
      "mistakeTypes": [
        "bit_pattern_signal_missed",
        "representation_choice_error"
      ],
      "nextAction": "Choose bit manipulation when the operation becomes simpler as check/set/clear/combine on bits.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_array_booleans_only": "An array of booleans can work, but the compact fixed-size flag requirement strongly supports a bit mask.",
        "use_sorting": "Sorting does not simplify checking or combining boolean flags.",
        "use_binary_search": "There is no ordered monotonic search space to halve."
      }
    },
    "id": "alg-bit-manipulation-recognize-signal-016-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_bit_manipulation_when_representation_simplifies_operations",
    "prompt": "When is bit manipulation justified by representation?",
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
        "nodeId": "choose_bit_manipulation_when_representation_simplifies_operations",
        "role": "primary"
      }
    ],
    "title": "Choose bits when representation simplifies operations",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "You need to store up to 32 independent feature toggles, quickly combine two feature sets, and check whether a feature is enabled. Which pattern choice is most justified?",
    "answerFeedback": "Correct. Fixed independent toggles with combine/check operations are a strong bit-mask fit.",
    "options": [
      {
        "id": "bit_mask_flags",
        "text": "Use bit manipulation with one bit per feature.",
        "isCorrect": true
      },
      {
        "id": "use_array_booleans_only",
        "text": "Never use bit masks; only arrays of booleans can represent toggles.",
        "isCorrect": false
      },
      {
        "id": "use_sorting",
        "text": "Sort enabled features before every check.",
        "isCorrect": false
      },
      {
        "id": "use_binary_search",
        "text": "Use binary search because there are up to 32 options.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
