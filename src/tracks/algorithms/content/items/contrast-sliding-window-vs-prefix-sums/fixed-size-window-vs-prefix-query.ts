import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const fixedSizeWindowVsPrefixQueryQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-fixed-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_fixed_window_strategy",
    "secondarySkillAtomIds": [
      "rolling_window_update",
      "fixed_length_range_optimization"
    ],
    "type": "single_choice",
    "prompt": "You need the largest sum among all contiguous subarrays of exactly length k. The array is processed once from left to right. Which approach best matches the task?",
    "feedbackModel": {
      "decisionSignal": "The task examines every consecutive range of one fixed length, and the sum supports adding and removing individual contributions.",
      "mentalModelCorrection": "Neighboring fixed-size windows differ by exactly one outgoing and one incoming element, so their sums do not need to be rebuilt.",
      "mistakeTypes": [
        "strategy_mismatch"
      ],
      "nextAction": "Look for reusable state between consecutive ranges of the same fixed length.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "rolling_sum",
        "text": "Compute the first length-k sum, then add the incoming value and remove the outgoing value for each next window.",
        "isCorrect": true
      },
      {
        "id": "recompute_every_window",
        "text": "For every starting index, scan the next k values and recompute the sum.",
        "isCorrect": false
      },
      {
        "id": "prefix_minimum",
        "text": "Store the smallest prefix sum and subtract it from every later prefix.",
        "isCorrect": false
      },
      {
        "id": "global_sum",
        "text": "Compute the total array sum and divide it among the possible windows.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-fixed-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "build_first_fixed_window",
    "secondarySkillAtomIds": [
      "fixed_window_initialization",
      "complete_window_detection"
    ],
    "type": "single_choice",
    "prompt": "A fixed-size sliding-window algorithm needs sums for windows of length k. When should it record its first candidate sum?",
    "feedbackModel": {
      "decisionSignal": "A candidate is valid only when the active range contains exactly k elements.",
      "mentalModelCorrection": "Partial prefixes shorter than k are not complete windows and must not participate in the fixed-length result.",
      "mistakeTypes": [
        "incomplete_window_recorded"
      ],
      "nextAction": "Define the exact moment at which the first valid fixed-size range exists.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "after_k_elements",
        "text": "After exactly k elements have been included in the current window.",
        "isCorrect": true
      },
      {
        "id": "after_first_element",
        "text": "Immediately after the first element is read.",
        "isCorrect": false
      },
      {
        "id": "after_k_plus_one",
        "text": "Only after k + 1 elements have been added so that one value can be removed.",
        "isCorrect": false
      },
      {
        "id": "after_full_scan",
        "text": "Only after the entire array has been processed.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-fixed-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "update_fixed_window_state",
    "secondarySkillAtomIds": [
      "remove_outgoing_contribution",
      "add_incoming_contribution"
    ],
    "type": "single_choice",
    "prompt": "The current window covers indexes left through right and has length k. The next value is at right + 1. Which update produces the next length-k window sum?",
    "feedbackModel": {
      "decisionSignal": "The next neighboring window keeps k - 1 old elements, drops the former leftmost value, and adds one new rightmost value.",
      "mentalModelCorrection": "Adding without removing creates a range of length k + 1. The outgoing contribution is the value at the old left boundary.",
      "mistakeTypes": [
        "forgot_outgoing_contribution"
      ],
      "nextAction": "Identify which element leaves and which element enters before updating the aggregate.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "add_new_remove_left",
        "text": "Add values[right + 1], subtract values[left], then advance both boundaries.",
        "isCorrect": true
      },
      {
        "id": "add_new_only",
        "text": "Add values[right + 1] and leave every existing contribution in the sum.",
        "isCorrect": false
      },
      {
        "id": "remove_right",
        "text": "Subtract values[right], add values[right + 1], and keep left unchanged.",
        "isCorrect": false
      },
      {
        "id": "reset_sum",
        "text": "Set the sum to zero and rebuild it from the new right boundary backward.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-fixed-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_exact_range_strategy",
    "secondarySkillAtomIds": [
      "single_range_query",
      "avoid_unnecessary_preprocessing"
    ],
    "type": "single_choice",
    "prompt": "You receive one immutable array and exactly one query asking for the sum from index left through right. No later queries will be made. Which approach is the most direct?",
    "feedbackModel": {
      "decisionSignal": "Only one exact range answer is required, so reusable preprocessing has no future workload to amortize.",
      "mentalModelCorrection": "Prefix sums are useful when their preprocessing supports repeated queries. They are not automatically the best choice for one isolated range.",
      "mistakeTypes": [
        "unnecessary_preprocessing"
      ],
      "nextAction": "Compare one-time preprocessing cost with the number of answers that will reuse it.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "scan_requested_range",
        "text": "Scan the requested range once and accumulate its values.",
        "isCorrect": true
      },
      {
        "id": "build_full_prefix_array",
        "text": "Build prefix sums for the entire array before answering the one query.",
        "isCorrect": false
      },
      {
        "id": "slide_all_equal_windows",
        "text": "Evaluate every range having the same length as the requested range.",
        "isCorrect": false
      },
      {
        "id": "sort_then_sum",
        "text": "Sort the array and sum the values now located between left and right.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-fixed-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "trace_fixed_window_update",
    "secondarySkillAtomIds": [
      "rolling_sum_trace",
      "outgoing_index_selection"
    ],
    "type": "single_choice",
    "prompt": "For values = [4, 2, 7, 1] and k = 3, the first window sum is 13. What is the sum of the next window?",
    "feedbackModel": {
      "decisionSignal": "The old leftmost value leaves, while the value immediately after the old right boundary enters.",
      "mentalModelCorrection": "The windows [4, 2, 7] and [2, 7, 1] overlap in two elements. Only 4 leaves and 1 enters.",
      "mistakeTypes": [
        "wrong_outgoing_index"
      ],
      "nextAction": "Write the old and new window boundaries before changing the rolling aggregate.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "ten",
        "text": "10, because the update is 13 - 4 + 1.",
        "isCorrect": true
      },
      {
        "id": "twelve",
        "text": "12, because the update is 13 - 2 + 1.",
        "isCorrect": false
      },
      {
        "id": "fourteen",
        "text": "14, because only the incoming value is added.",
        "isCorrect": false
      },
      {
        "id": "eight",
        "text": "8, because the entire next window must be recomputed from indexes 2 and 3.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-fixed-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_fixed_window_and_prefix_space",
    "secondarySkillAtomIds": [
      "auxiliary_space_analysis",
      "prefix_array_storage"
    ],
    "type": "solution_comparison",
    "prompt": "Two correct solutions compute the maximum sum among all length-k subarrays. Solution A maintains one rolling sum. Solution B builds a separate prefix array and evaluates each candidate range by subtraction. Which comparison is correct?",
    "feedbackModel": {
      "decisionSignal": "Both solutions examine O(n) candidate windows, but only one stores cumulative state for every array boundary.",
      "mentalModelCorrection": "Logical membership in a window is not additional storage when values remain in the input array. A separate prefix array grows with n.",
      "mistakeTypes": [
        "space_complexity_mismatch"
      ],
      "nextAction": "Separate referenced input values from newly allocated state.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "same_time_different_space",
        "text": "Both are O(n) time, but A can use O(1) auxiliary aggregate state while B stores O(n) prefix values.",
        "isCorrect": true
      },
      {
        "id": "prefix_faster",
        "text": "B is O(1) total time because every candidate range is answered by one subtraction.",
        "isCorrect": false
      },
      {
        "id": "same_memory",
        "text": "Both use O(1) auxiliary space because each calculation uses only two values.",
        "isCorrect": false
      },
      {
        "id": "window_k_space",
        "text": "A always requires O(k) auxiliary space because the active range contains k elements.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-fixed-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_selected_range_query_strategy",
    "secondarySkillAtomIds": [
      "prefix_sum_reuse",
      "fixed_length_query_contract"
    ],
    "type": "single_choice",
    "prompt": "An immutable array will receive many selected queries. Every query asks for the sum of a length-k range, but query starts may arrive in arbitrary order and ranges do not need to be consecutive. Which approach best supports the contract?",
    "feedbackModel": {
      "decisionSignal": "The requested ranges are independent and may jump backward or forward instead of forming one consecutive scan.",
      "mentalModelCorrection": "A rolling window is efficient when neighboring ranges are consumed in order. Prefix states allow arbitrary fixed-length ranges to be answered independently.",
      "mistakeTypes": [
        "query_access_pattern_mismatch"
      ],
      "nextAction": "Check whether requested boundaries follow one monotonic traversal or arrive independently.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "prefix_sums",
        "text": "Build prefix sums once and answer each requested range independently.",
        "isCorrect": true
      },
      {
        "id": "one_direction_window",
        "text": "Maintain one rolling window that can only move from left to right.",
        "isCorrect": false
      },
      {
        "id": "best_window_only",
        "text": "Compute only the largest length-k sum and reuse it for every query.",
        "isCorrect": false
      },
      {
        "id": "global_sum",
        "text": "Use the total sum of the array for every requested range.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-fixed-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_fixed_window_k_one",
    "secondarySkillAtomIds": [
      "fixed_window_edge_case",
      "window_length_contract"
    ],
    "type": "single_choice",
    "prompt": "A correct fixed-size rolling-window implementation is run with k = 1. What should each candidate window contain?",
    "feedbackModel": {
      "decisionSignal": "The window-length contract remains exactly k, even at the smallest positive size.",
      "mentalModelCorrection": "Two boundary variables do not imply two included elements. For inclusive boundaries, left equals right when the window length is one.",
      "mistakeTypes": [
        "window_length_mismatch"
      ],
      "nextAction": "Verify boundary formulas using k = 1 before trusting the general implementation.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "one_value",
        "text": "Exactly one array value, so each element forms its own complete window.",
        "isCorrect": true
      },
      {
        "id": "empty_then_one",
        "text": "An empty range followed by the next array value.",
        "isCorrect": false
      },
      {
        "id": "two_values",
        "text": "The current value and the previous value because both boundaries are used.",
        "isCorrect": false
      },
      {
        "id": "whole_suffix",
        "text": "Every value from the current index to the end of the array.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-fixed-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_fixed_window_full_length",
    "secondarySkillAtomIds": [
      "fixed_window_edge_case",
      "candidate_count_reasoning"
    ],
    "type": "single_choice",
    "prompt": "For an array of length n and k = n, how many complete length-k windows exist?",
    "feedbackModel": {
      "decisionSignal": "A complete length-n range can start only at index zero.",
      "mentalModelCorrection": "The number of length-k windows in an array of length n is n - k + 1 when 1 <= k <= n.",
      "mistakeTypes": [
        "candidate_count_mismatch"
      ],
      "nextAction": "Use n - k + 1 to verify loop boundaries for fixed-size windows.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "one",
        "text": "Exactly one.",
        "isCorrect": true
      },
      {
        "id": "n",
        "text": "Exactly n, one starting at every index.",
        "isCorrect": false
      },
      {
        "id": "zero",
        "text": "None, because a window must be smaller than the input.",
        "isCorrect": false
      },
      {
        "id": "n_plus_one",
        "text": "Exactly n + 1, including empty boundary states.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-fixed-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "handle_invalid_fixed_window_size",
    "secondarySkillAtomIds": [
      "fixed_window_edge_case",
      "input_contract_validation"
    ],
    "type": "single_choice",
    "prompt": "The array has length 5, but k = 7. The function contract says to return null when no complete length-k range exists. What should the algorithm do?",
    "feedbackModel": {
      "decisionSignal": "No contiguous range of the required length exists, and the output contract explicitly defines the failure result.",
      "mentalModelCorrection": "Neither rolling state nor prefix sums can make an invalid range exist. Strategy choice does not override the input contract.",
      "mistakeTypes": [
        "invalid_window_contract"
      ],
      "nextAction": "Validate k against the input length before initializing the first window.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "return_null",
        "text": "Reject the request before scanning and return null.",
        "isCorrect": true
      },
      {
        "id": "use_whole_array",
        "text": "Treat the entire array as a shorter replacement window.",
        "isCorrect": false
      },
      {
        "id": "pad_with_zero",
        "text": "Append two implicit zero values and evaluate one window.",
        "isCorrect": false
      },
      {
        "id": "build_prefixes",
        "text": "Build prefix sums because preprocessing makes oversized ranges valid.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-fixed-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "maintain_fixed_window_count",
    "secondarySkillAtomIds": [
      "rolling_property_count",
      "removable_contribution"
    ],
    "type": "single_choice",
    "prompt": "You must output the number of odd values in every consecutive length-k window. Which rolling update is correct when the window moves by one position?",
    "feedbackModel": {
      "decisionSignal": "The aggregate is a sum of independent zero-or-one contributions attached to each active element.",
      "mentalModelCorrection": "A property count is removable in the same way as a numeric sum: remove the outgoing element's contribution and add the incoming contribution.",
      "mistakeTypes": [
        "forgot_outgoing_contribution"
      ],
      "nextAction": "Encode each element's contribution before deriving the rolling update.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "subtract_outgoing_add_incoming_predicates",
        "text": "Subtract 1 if the outgoing value is odd, then add 1 if the incoming value is odd.",
        "isCorrect": true
      },
      {
        "id": "add_incoming_only",
        "text": "Add 1 for an odd incoming value and never change the count for outgoing values.",
        "isCorrect": false
      },
      {
        "id": "reset_on_even",
        "text": "Reset the count to zero whenever the incoming value is even.",
        "isCorrect": false
      },
      {
        "id": "count_global_odds",
        "text": "Count all odd values in the full array once and emit that value for every window.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-fixed-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "record_all_fixed_window_outputs",
    "secondarySkillAtomIds": [
      "fixed_window_output_contract",
      "complete_window_iteration"
    ],
    "type": "single_choice",
    "prompt": "The function must return the sum of every consecutive length-k window, not only the largest one. What must the rolling-window implementation do?",
    "feedbackModel": {
      "decisionSignal": "The output cardinality is one value per complete consecutive window.",
      "mentalModelCorrection": "The rolling aggregate can support either one optimum or all window results. The output contract determines whether every candidate must be preserved.",
      "mistakeTypes": [
        "output_contract_mismatch"
      ],
      "nextAction": "Separate the maintained aggregate from the collection policy required by the return value.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "append_each_complete_sum",
        "text": "Append the sum whenever a complete length-k window is formed, including the first window.",
        "isCorrect": true
      },
      {
        "id": "store_only_best",
        "text": "Keep only the largest sum because all other windows are intermediate state.",
        "isCorrect": false
      },
      {
        "id": "append_partial_prefixes",
        "text": "Append every running sum before the first length-k window is complete.",
        "isCorrect": false
      },
      {
        "id": "append_after_removal_only",
        "text": "Skip the first window and append results only after an outgoing value has been removed.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-fixed-013",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_fixed_window_off_by_one",
    "secondarySkillAtomIds": [
      "outgoing_index_selection",
      "fixed_window_boundary_reasoning"
    ],
    "type": "single_choice",
    "prompt": "A loop processes values[right] and, whenever right >= k, subtracts values[right - k]. It records a candidate whenever right >= k - 1. What does values[right - k] represent?",
    "feedbackModel": {
      "decisionSignal": "After adding values[right], the desired window starts at right - k + 1, so index right - k lies one position before it.",
      "mentalModelCorrection": "The outgoing index is derived from the new right boundary and the required length. Removing right - k leaves exactly k active elements.",
      "mistakeTypes": [
        "off_by_one_error"
      ],
      "nextAction": "Derive the new inclusive start as right - k + 1, then identify the element immediately before it.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "outgoing_previous_window_value",
        "text": "The element immediately before the new length-k window, which must be removed from the rolling sum.",
        "isCorrect": true
      },
      {
        "id": "new_window_first_value",
        "text": "The first element that should remain inside the new window.",
        "isCorrect": false
      },
      {
        "id": "incoming_value",
        "text": "The value that has just entered at the right boundary.",
        "isCorrect": false
      },
      {
        "id": "best_window_start",
        "text": "The start of the globally best window found so far.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-fixed-014",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_streaming_window_and_prefix_storage",
    "secondarySkillAtomIds": [
      "streaming_fixed_window",
      "prefix_state_requirement"
    ],
    "type": "solution_comparison",
    "prompt": "Values arrive as a stream, and after each arrival starting with the kth value, the system must emit the sum of the latest k values. The complete stream length is not known in advance. Which design is more appropriate?",
    "feedbackModel": {
      "decisionSignal": "The output is online and always concerns the latest fixed-size suffix.",
      "mentalModelCorrection": "A final prefix array assumes stored completed input and delays outputs. A rolling design supports immediate expiration and emission.",
      "mistakeTypes": [
        "online_contract_mismatch"
      ],
      "nextAction": "Check whether the strategy can produce each answer at the moment the contract requires it.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "rolling_buffer_and_sum",
        "text": "Maintain the latest k values or an equivalent expiration structure together with one rolling sum.",
        "isCorrect": true
      },
      {
        "id": "final_prefix_array",
        "text": "Wait for the stream to end, build a prefix array, and then generate all outputs.",
        "isCorrect": false
      },
      {
        "id": "store_total_only",
        "text": "Maintain only the sum of all values ever received.",
        "isCorrect": false
      },
      {
        "id": "sort_received_values",
        "text": "Keep all received values sorted and subtract the smallest when more than k values exist.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-fixed-015",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_selected_ranges_and_consecutive_windows",
    "secondarySkillAtomIds": [
      "range_access_pattern",
      "rolling_state_reuse"
    ],
    "type": "solution_comparison",
    "prompt": "Requirement A asks for every consecutive length-k range sum in left-to-right order. Requirement B asks for three specific length-k range sums whose start indexes are supplied in arbitrary order. Which comparison is most accurate?",
    "feedbackModel": {
      "decisionSignal": "The decisive difference is whether ranges form one consecutive traversal or are isolated requested positions.",
      "mentalModelCorrection": "Equal range length does not force one strategy. Rolling reuse depends on neighboring access, while prefix preprocessing depends on query reuse.",
      "mistakeTypes": [
        "access_pattern_mismatch"
      ],
      "nextAction": "Separate range shape from the order and frequency in which ranges are requested.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "window_for_a_direct_or_prefix_for_b",
        "text": "A naturally reuses one rolling window; B may use direct scans for only three queries or prefix sums when preprocessing is justified by the surrounding workload.",
        "isCorrect": true
      },
      {
        "id": "window_for_b_only",
        "text": "B requires a sliding window because every requested range has the same length.",
        "isCorrect": false
      },
      {
        "id": "prefix_for_a_only",
        "text": "A requires prefix sums because it returns more than one answer.",
        "isCorrect": false
      },
      {
        "id": "same_strategy_required",
        "text": "Both requirements must use the same strategy because their range lengths are equal.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-fixed-016",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_fixed_window_implementation_plan",
    "secondarySkillAtomIds": [
      "fixed_window_initialization",
      "rolling_update_order"
    ],
    "type": "solution_comparison",
    "prompt": "Which implementation plan correctly finds the maximum sum of a length-k subarray?",
    "feedbackModel": {
      "decisionSignal": "The algorithm needs one valid initial candidate and must preserve exactly k active contributions during every later update.",
      "mentalModelCorrection": "A fixed-window plan has two distinct phases: construct the first complete range, then roll it while maintaining constant length.",
      "mistakeTypes": [
        "implementation_order_mismatch"
      ],
      "nextAction": "State initialization and rolling phases separately before writing the loop.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "build_record_then_slide",
        "text": "Validate k, build the first complete window, record it as the initial best, then repeatedly remove the outgoing value, add the incoming value, and update the best.",
        "isCorrect": true
      },
      {
        "id": "record_partials_then_expand",
        "text": "Record every partial running sum as a candidate, stop adding values after k elements, and never remove outgoing values.",
        "isCorrect": false
      },
      {
        "id": "slide_before_first_window",
        "text": "Remove values from the left before the first k values have been included, then initialize the best after the scan.",
        "isCorrect": false
      },
      {
        "id": "prefix_without_queries",
        "text": "Build prefix sums, return the final prefix value, and treat it as the best length-k result.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
