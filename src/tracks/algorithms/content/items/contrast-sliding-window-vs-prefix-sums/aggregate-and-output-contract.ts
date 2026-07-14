import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const aggregateAndOutputContractQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_range_aggregation_strategy",
    "secondarySkillAtomIds": [
      "fixed_window_rolling_state",
      "static_range_query_preprocessing"
    ],
    "type": "single_choice",
    "prompt": "You receive an array of numbers and a fixed integer k. You need the maximum sum among all contiguous subarrays of length k. Which approach best matches the contract?",
    "feedbackModel": {
      "decisionSignal": "The task asks for one best value over neighboring fixed-size ranges, and the sum supports removing the outgoing contribution.",
      "mentalModelCorrection": "Prefix sums can answer each range correctly, but a rolling window directly maintains the only range currently needed and avoids storing all prefixes.",
      "mistakeTypes": [
        "strategy_mismatch"
      ],
      "nextAction": "Separate a moving optimization over neighboring windows from a batch of independently requested range queries.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "rolling_window",
        "text": "Build the first length-k sum, then slide the window by adding the incoming value and removing the outgoing value.",
        "isCorrect": true
      },
      {
        "id": "prefix_query_per_window",
        "text": "Build prefix sums and use one subtraction for every possible length-k range.",
        "isCorrect": false
      },
      {
        "id": "nested_recompute",
        "text": "Recompute the sum of every length-k range from scratch.",
        "isCorrect": false
      },
      {
        "id": "scalar_prefix_minimum",
        "text": "Store the minimum prefix sum and subtract it from each later prefix.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_static_range_query_strategy",
    "secondarySkillAtomIds": [
      "prefix_sum_preprocessing",
      "output_contract_analysis"
    ],
    "type": "single_choice",
    "prompt": "You receive an immutable array and 100,000 independent queries. Each query asks for the sum of values from index left through index right. Which strategy best matches the required output?",
    "feedbackModel": {
      "decisionSignal": "The output requires many arbitrary range answers over immutable data.",
      "mentalModelCorrection": "A sliding window maintains one current range, while prefix sums support independent queries whose boundaries may move in any direction.",
      "mistakeTypes": [
        "output_contract_mismatch"
      ],
      "nextAction": "Check whether the output asks for one moving optimum or a separate answer for every supplied range.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "prefix_sums",
        "text": "Build one prefix-sum array and answer each query from two prefix states.",
        "isCorrect": true
      },
      {
        "id": "single_sliding_window",
        "text": "Maintain one window and move it from the previous query range to the next.",
        "isCorrect": false
      },
      {
        "id": "recompute_each_query",
        "text": "Scan every requested range separately.",
        "isCorrect": false
      },
      {
        "id": "best_window_only",
        "text": "Track only the largest sum encountered while scanning the array once.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_prefix_aggregate_compatibility",
    "secondarySkillAtomIds": [
      "range_minimum_reasoning",
      "aggregate_inverse_requirement"
    ],
    "type": "single_choice",
    "prompt": "You need to answer many queries asking for the minimum value in an arbitrary immutable range. A teammate proposes storing one scalar prefix minimum and subtracting two prefix entries. What is the main flaw?",
    "feedbackModel": {
      "decisionSignal": "The proposed prefix state must support reconstructing an arbitrary range result from two stored prefixes.",
      "mentalModelCorrection": "Sums have an inverse operation through subtraction. Minimum and maximum do not: a value excluded from the range may still determine a prefix minimum.",
      "mistakeTypes": [
        "invalid_aggregate_operation"
      ],
      "nextAction": "Before choosing prefix subtraction, verify that the aggregate supports removing an earlier prefix contribution.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "minimum_not_subtractable",
        "text": "A range minimum cannot generally be recovered by subtracting two scalar prefix minima.",
        "isCorrect": true
      },
      {
        "id": "prefix_requires_positive_values",
        "text": "Prefix preprocessing works only when every array value is positive.",
        "isCorrect": false
      },
      {
        "id": "minimum_requires_fixed_ranges",
        "text": "Minimum queries can only be answered for ranges of one fixed length.",
        "isCorrect": false
      },
      {
        "id": "subtraction_too_slow",
        "text": "Subtracting two prefix entries makes each query linear.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_window_state_representation",
    "secondarySkillAtomIds": [
      "frequency_window_state",
      "distinct_count_tracking"
    ],
    "type": "single_choice",
    "prompt": "You need the longest substring containing at most k distinct characters. Which maintained state is sufficient for a variable sliding window?",
    "feedbackModel": {
      "decisionSignal": "Window validity depends on multiplicities inside the current range, not on one additive scalar.",
      "mentalModelCorrection": "Sliding window does not imply scalar state. The maintained state must contain enough information to remove a character and determine whether its last occurrence left the window.",
      "mistakeTypes": [
        "insufficient_state"
      ],
      "nextAction": "Derive window state from the validity predicate rather than assuming every window can be represented by a sum.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "frequency_map",
        "text": "A frequency map for characters in the current window, together with the number of distinct characters.",
        "isCorrect": true
      },
      {
        "id": "scalar_sum",
        "text": "One scalar equal to the sum of character codes in the current window.",
        "isCorrect": false
      },
      {
        "id": "prefix_length",
        "text": "A prefix array storing only the number of processed characters.",
        "isCorrect": false
      },
      {
        "id": "global_set",
        "text": "A Set containing every character that appears anywhere in the full string.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_online_and_batch_range_outputs",
    "secondarySkillAtomIds": [
      "rolling_window_output",
      "prefix_sum_output_contract"
    ],
    "type": "solution_comparison",
    "prompt": "Values arrive one at a time. After each new value, you must immediately output the sum of the latest k values. Which solution better matches the online output contract?",
    "feedbackModel": {
      "decisionSignal": "The result must be emitted online for one moving suffix of fixed length.",
      "mentalModelCorrection": "Prefix sums can represent cumulative history, but rebuilding them is unnecessary. A rolling state directly supports adding the new value and removing the expired one.",
      "mistakeTypes": [
        "online_contract_mismatch"
      ],
      "nextAction": "Check whether answers must be available incrementally before the complete input exists.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "rolling_window",
        "text": "Maintain a queue or circular buffer of the latest k values and update one rolling sum on every arrival.",
        "isCorrect": true
      },
      {
        "id": "rebuild_prefixes",
        "text": "Rebuild a complete prefix-sum array after each arrival, then subtract the last two relevant prefixes.",
        "isCorrect": false
      },
      {
        "id": "store_only_total",
        "text": "Maintain only the sum of every value received so far.",
        "isCorrect": false
      },
      {
        "id": "wait_until_end",
        "text": "Store all values and produce every output only after the stream ends.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_range_output_strategy",
    "secondarySkillAtomIds": [
      "all_query_results",
      "best_window_optimization"
    ],
    "type": "single_choice",
    "prompt": "The input contains an array and a list of arbitrary ranges. The function must return one sum for every range in the same order as the queries. Why is tracking only the best sliding-window sum insufficient?",
    "feedbackModel": {
      "decisionSignal": "The required output cardinality is one answer per input query.",
      "mentalModelCorrection": "A strategy that computes one global best range does not satisfy a batch-query contract, even if its aggregate calculations are correct.",
      "mistakeTypes": [
        "output_contract_mismatch"
      ],
      "nextAction": "Compare the number and order of required outputs before comparing implementation costs.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "wrong_output_shape",
        "text": "It produces one optimum, while the contract requires an ordered result for every query.",
        "isCorrect": true
      },
      {
        "id": "sliding_window_cannot_sum",
        "text": "Sliding windows cannot maintain sums.",
        "isCorrect": false
      },
      {
        "id": "queries_require_sorting",
        "text": "All range queries must first be sorted by their right endpoint.",
        "isCorrect": false
      },
      {
        "id": "prefix_sums_change_order",
        "text": "Prefix sums cannot preserve the original query order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_fixed_window_state",
    "secondarySkillAtomIds": [
      "rolling_count",
      "removable_contribution"
    ],
    "type": "single_choice",
    "prompt": "For every contiguous block of exactly k values, you need to know how many values are even and return the largest such count. Which state is sufficient?",
    "feedbackModel": {
      "decisionSignal": "The per-element contribution is binary and can be added when entering and removed when leaving.",
      "mentalModelCorrection": "Counts are additive when each element contributes zero or one, so a scalar rolling count is sufficient for this fixed-window objective.",
      "mistakeTypes": [
        "state_representation_mismatch"
      ],
      "nextAction": "Translate a property count into per-element contributions before deciding how much state the window needs.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "rolling_even_count",
        "text": "Maintain the count of even values in the current window, incrementing for the incoming value and decrementing for the outgoing value.",
        "isCorrect": true
      },
      {
        "id": "all_window_values",
        "text": "Copy every complete window into a new array and count its even values from scratch.",
        "isCorrect": false
      },
      {
        "id": "prefix_minimum",
        "text": "Maintain the minimum number of even values seen in any prefix.",
        "isCorrect": false
      },
      {
        "id": "total_even_count",
        "text": "Count all even values in the entire array once and use that count for every window.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "preserve_range_indexes",
    "secondarySkillAtomIds": [
      "best_window_boundaries",
      "output_contract_analysis"
    ],
    "type": "single_choice",
    "prompt": "You need to return the start and end indexes of the length-k subarray with the largest sum, choosing the earliest range on ties. What additional state is required beyond the rolling sum?",
    "feedbackModel": {
      "decisionSignal": "The output requires one concrete range and specifies an earliest-on-tie rule.",
      "mentalModelCorrection": "The aggregate identifies the best value, but the output contract requires preserving the range that produced it. Updating on equality would incorrectly prefer a later range.",
      "mistakeTypes": [
        "lost_output_metadata"
      ],
      "nextAction": "Track the metadata required by the return type at the moment a candidate becomes optimal.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "best_boundaries",
        "text": "Store the best sum and the corresponding start and end indexes, updating them only on a strictly larger sum.",
        "isCorrect": true
      },
      {
        "id": "all_prefix_values_only",
        "text": "Store only the prefix-sum array because indexes can never be recovered from it.",
        "isCorrect": false
      },
      {
        "id": "current_sum_only",
        "text": "Store only the current window sum and derive the best indexes after the scan without revisiting input.",
        "isCorrect": false
      },
      {
        "id": "latest_boundaries",
        "text": "Replace the stored indexes whenever the current sum is equal to or greater than the best sum.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "validate_prefix_subtraction",
    "secondarySkillAtomIds": [
      "range_count_query",
      "predicate_contribution_transform"
    ],
    "type": "single_choice",
    "prompt": "An immutable array receives many queries asking how many negative values occur in each range. Which preprocessing supports constant-time query answers?",
    "feedbackModel": {
      "decisionSignal": "The query aggregate is an additive count over a static array.",
      "mentalModelCorrection": "A property count becomes prefix-compatible by mapping each element to a numeric contribution and subtracting cumulative counts at the boundaries.",
      "mistakeTypes": [
        "aggregate_encoding_mismatch"
      ],
      "nextAction": "Check whether the requested aggregate can be encoded as a sum of independent per-element contributions.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "prefix_negative_counts",
        "text": "Build a prefix count where each negative value contributes 1 and every other value contributes 0.",
        "isCorrect": true
      },
      {
        "id": "prefix_minimum_values",
        "text": "Build a prefix minimum and subtract two entries.",
        "isCorrect": false
      },
      {
        "id": "one_global_negative_count",
        "text": "Count all negative values once and return the same result for every query.",
        "isCorrect": false
      },
      {
        "id": "single_moving_window",
        "text": "Maintain one variable window across queries regardless of their order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_window_and_prefix_state",
    "secondarySkillAtomIds": [
      "range_sum_query",
      "fixed_window_optimization"
    ],
    "type": "solution_comparison",
    "prompt": "Two implementations solve the maximum sum of any length-k subarray. Solution A uses a rolling sum in O(n) time and O(1) auxiliary space. Solution B builds prefix sums in O(n) time and O(n) auxiliary space, then checks every length-k range in O(1). Which assessment is most accurate?",
    "feedbackModel": {
      "decisionSignal": "Both methods inspect all candidate windows, but only one needs cumulative state for every boundary.",
      "mentalModelCorrection": "Constant-time per-window work still occurs across O(n) candidate windows. Prefix preprocessing does not improve the total asymptotic time for this one sequential optimization.",
      "mistakeTypes": [
        "complexity_mismatch",
        "tradeoff_mismatch"
      ],
      "nextAction": "Add preprocessing and all candidate checks when comparing total complexity, then compare memory and output needs.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "both_correct_window_better_space",
        "text": "Both are correct and O(n) overall, but the rolling window matches the sequential objective with less auxiliary space.",
        "isCorrect": true
      },
      {
        "id": "prefix_asymptotically_faster",
        "text": "Prefix sums are asymptotically faster because each range lookup is O(1).",
        "isCorrect": false
      },
      {
        "id": "window_incorrect",
        "text": "A rolling sum is invalid because removing an outgoing value loses historical information.",
        "isCorrect": false
      },
      {
        "id": "both_constant_time",
        "text": "Both algorithms run in O(1) because each individual update or query is constant time.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-011",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_insufficient_scalar_aggregate",
    "secondarySkillAtomIds": [
      "anagram_window_state",
      "frequency_state_selection"
    ],
    "type": "single_choice",
    "prompt": "You must return every starting index where a length-k substring is an anagram of a target string. Why is maintaining only the sum of character codes in the current window insufficient?",
    "feedbackModel": {
      "decisionSignal": "The validity contract depends on the complete frequency distribution, not on one additive checksum.",
      "mentalModelCorrection": "A rolling state must uniquely preserve the information needed by the predicate. Equal scalar sums do not imply equal character counts.",
      "mistakeTypes": [
        "insufficient_state"
      ],
      "nextAction": "Test whether two different validities can map to the same proposed scalar state.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "different_multisets_same_sum",
        "text": "Different character multisets can produce the same scalar sum, so the state does not determine whether frequencies match.",
        "isCorrect": true
      },
      {
        "id": "window_cannot_remove_chars",
        "text": "A sliding window cannot remove a character once it has been added.",
        "isCorrect": false
      },
      {
        "id": "indexes_require_prefix_sums",
        "text": "Returning indexes always requires a prefix-sum array.",
        "isCorrect": false
      },
      {
        "id": "anagrams_require_sorting_each_window",
        "text": "Every candidate window must be sorted independently.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-aggregate-output-012",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_aggregate_strategy_from_output_contract",
    "secondarySkillAtomIds": [
      "online_window_processing",
      "arbitrary_range_query_processing"
    ],
    "type": "solution_comparison",
    "prompt": "Compare two requirements over the same numeric array: Requirement A asks for the average of every consecutive block of length k in left-to-right order. Requirement B asks for the average of each arbitrary range listed in a separate query array. Which pairing is most appropriate?",
    "feedbackModel": {
      "decisionSignal": "The aggregate is the same, but one output follows neighboring fixed-size ranges while the other contains independent arbitrary queries.",
      "mentalModelCorrection": "Strategy selection depends on access and output structure, not only on the aggregate name. Sequential neighboring windows favor rolling state; arbitrary static queries favor reusable prefixes.",
      "mistakeTypes": [
        "strategy_mismatch",
        "output_contract_mismatch"
      ],
      "nextAction": "When two tasks use the same aggregate, compare how their requested ranges are generated and how many answers must be returned.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "window_then_prefix",
        "text": "Use a rolling fixed-size window for A and prefix sums for B.",
        "isCorrect": true
      },
      {
        "id": "prefix_then_window",
        "text": "Use prefix sums for A and one continuously moving window for B.",
        "isCorrect": false
      },
      {
        "id": "window_for_both",
        "text": "Use one sliding window for both because both outputs are averages.",
        "isCorrect": false
      },
      {
        "id": "prefix_min_for_both",
        "text": "Use prefix minima for both and divide the difference by the range length.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
