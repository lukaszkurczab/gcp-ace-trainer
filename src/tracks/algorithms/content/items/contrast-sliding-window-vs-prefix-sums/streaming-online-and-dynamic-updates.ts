import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const streamingOnlineAndDynamicUpdatesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-streaming-001",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_online_fixed_window_contract",
    "secondarySkillAtomIds": [
      "streaming_input_processing",
      "rolling_window_state"
    ],
    "type": "single_choice",
    "prompt": "Values arrive one at a time. After every arrival starting with the kth value, you must immediately output the sum of the latest k values. Which strategy best matches the contract?",
    "feedbackModel": {
      "decisionSignal": "The required answer concerns one evolving suffix of fixed length and must be produced online.",
      "mentalModelCorrection": "A rolling window directly models incoming and expiring contributions. Delaying work until the stream ends violates the output contract.",
      "mistakeTypes": [
        "online_contract_mismatch"
      ],
      "nextAction": "Check whether each answer must be available before the complete input exists.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "rolling_window",
        "text": "Maintain the latest k values or an equivalent expiration structure together with one rolling sum.",
        "isCorrect": true
      },
      {
        "id": "final_prefix_array",
        "text": "Wait until the stream ends, build a complete prefix array, and then produce the outputs.",
        "isCorrect": false
      },
      {
        "id": "global_total",
        "text": "Maintain only the sum of every value received so far.",
        "isCorrect": false
      },
      {
        "id": "recompute_history",
        "text": "Store the full stream and rescan all received values after every arrival.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-streaming-002",
    "learningStage": "foundations",
    "primarySkillAtomId": "avoid_unbounded_prefix_storage",
    "secondarySkillAtomIds": [
      "unbounded_stream_reasoning",
      "bounded_active_state"
    ],
    "type": "single_choice",
    "prompt": "An input stream may continue indefinitely, and the system only needs the average of the latest 100 values. What is the main drawback of retaining one prefix value for every arrival?",
    "feedbackModel": {
      "decisionSignal": "The output depends only on a bounded recent suffix, while cumulative history grows with all arrivals.",
      "mentalModelCorrection": "Prefix history can represent the answer, but it retains more state than the contract requires for an unbounded stream.",
      "mistakeTypes": [
        "unnecessary_history_storage"
      ],
      "nextAction": "Compare required retention with total input history, not only whether a representation is mathematically sufficient.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "history_grows_without_bound",
        "text": "Stored prefix history grows with the total stream length even though only the active 100-value window matters.",
        "isCorrect": true
      },
      {
        "id": "prefix_cannot_represent_average",
        "text": "Prefix values cannot be used to calculate averages.",
        "isCorrect": false
      },
      {
        "id": "prefix_requires_positive_values",
        "text": "Prefix values are valid only when all arrivals are positive.",
        "isCorrect": false
      },
      {
        "id": "window_requires_full_history",
        "text": "A rolling window also requires retaining every earlier stream value.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "id": "alg-contrast-sliding-window-prefix-streaming-003",
    "learningStage": "foundations",
    "primarySkillAtomId": "identify_stale_prefix_state",
    "secondarySkillAtomIds": [
      "point_update_effect",
      "preprocessed_state_validity"
    ],
    "type": "single_choice",
    "prompt": "A prefix-sum array is built for a static array. Later, values[3] changes before another range query is answered. Why may the old prefix array be incorrect?",
    "feedbackModel": {
      "decisionSignal": "A point update changes every cumulative state whose covered prefix includes the updated position.",
      "mentalModelCorrection": "Plain prefix preprocessing represents one version of the array. Without maintenance or rebuilding, later queries use stale cumulative values.",
      "mistakeTypes": [
        "stale_preprocessed_state"
      ],
      "nextAction": "Identify which stored cumulative states include the updated index.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "later_prefixes_are_stale",
        "text": "Every stored prefix covering index 3 still contains the previous value.",
        "isCorrect": true
      },
      {
        "id": "only_prefix_three_changes",
        "text": "Only prefix[3] can be affected by an update at index 3.",
        "isCorrect": false
      },
      {
        "id": "queries_become_windows",
        "text": "Any point update converts all future queries into sliding-window problems.",
        "isCorrect": false
      },
      {
        "id": "prefix_values_ignore_data",
        "text": "Prefix values do not depend on the underlying array values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-streaming-004",
    "learningStage": "foundations",
    "primarySkillAtomId": "distinguish_append_and_point_update_effects",
    "secondarySkillAtomIds": [
      "append_only_prefix_extension",
      "dynamic_update_analysis"
    ],
    "type": "solution_comparison",
    "prompt": "How do append-only changes differ from point updates for a stored prefix-sum sequence?",
    "feedbackModel": {
      "decisionSignal": "Appending does not alter any previously covered prefix, while editing the past changes cumulative states after that position.",
      "mentalModelCorrection": "Prefix sums can be extended incrementally for append-only data. Their static weakness concerns modifications to already represented positions.",
      "mistakeTypes": [
        "dynamic_update_misclassification"
      ],
      "nextAction": "Ask whether the change extends the data or modifies history already included in stored cumulative states.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "append_extends_update_invalidates_suffix",
        "text": "An append can extend the prefix sequence with one new cumulative value, while changing an earlier element invalidates all later affected prefixes.",
        "isCorrect": true
      },
      {
        "id": "both_require_full_rebuild",
        "text": "Every append and every point update require rebuilding all existing prefix values.",
        "isCorrect": false
      },
      {
        "id": "point_update_local_only",
        "text": "A point update changes only one prefix entry, while an append changes every prefix.",
        "isCorrect": false
      },
      {
        "id": "neither_supported",
        "text": "Prefix state cannot be maintained under either appends or point updates.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-streaming-005",
    "learningStage": "foundations",
    "primarySkillAtomId": "limit_stream_retention_to_active_window",
    "secondarySkillAtomIds": [
      "fixed_window_expiration",
      "memory_contract_analysis"
    ],
    "type": "single_choice",
    "prompt": "A stream processor reports the count of errors among the latest 1,000 events. No historical query is ever allowed. Which retention policy best matches the contract?",
    "feedbackModel": {
      "decisionSignal": "Only the active bounded suffix can affect current or future outputs.",
      "mentalModelCorrection": "Once an event expires and no historical query can request it, keeping its full history is unnecessary.",
      "mistakeTypes": [
        "retention_contract_mismatch"
      ],
      "nextAction": "Determine when past data can no longer influence any permitted output.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "retain_active_window",
        "text": "Retain only enough information to remove events when they leave the latest-1,000 window.",
        "isCorrect": true
      },
      {
        "id": "retain_all_events",
        "text": "Store every event permanently because future windows may refer to them.",
        "isCorrect": false
      },
      {
        "id": "retain_total_only",
        "text": "Keep only the total number of errors ever observed.",
        "isCorrect": false
      },
      {
        "id": "retain_prefix_and_events",
        "text": "Store every event and every cumulative error count even though historical ranges are forbidden.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-streaming-006",
    "learningStage": "foundations",
    "primarySkillAtomId": "reject_window_for_historical_queries",
    "secondarySkillAtomIds": [
      "historical_range_access",
      "active_window_state_limit"
    ],
    "type": "solution_comparison",
    "prompt": "A system retains only the latest k values in a rolling window. A new requirement asks for the sum of an arbitrary historical range that expired long ago. Can the current window state answer it?",
    "feedbackModel": {
      "decisionSignal": "Rolling state intentionally forgets contributions outside the active range.",
      "mentalModelCorrection": "A bounded window supports current rolling outputs, not arbitrary historical reconstruction after the source values have been discarded.",
      "mistakeTypes": [
        "state_capability_overclaim"
      ],
      "nextAction": "Verify that the retained state contains all information required by every permitted query.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "no_history_discarded",
        "text": "No. The required historical contributions are no longer represented in the retained state.",
        "isCorrect": true
      },
      {
        "id": "yes_move_window_back",
        "text": "Yes. The window can move backward even though expired values were discarded.",
        "isCorrect": false
      },
      {
        "id": "yes_current_sum",
        "text": "Yes. The current rolling sum also represents every earlier range.",
        "isCorrect": false
      },
      {
        "id": "yes_if_same_length",
        "text": "Yes, as long as the historical range also has length k.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "core",
    "id": "alg-contrast-sliding-window-prefix-streaming-007",
    "learningStage": "foundations",
    "primarySkillAtomId": "compare_local_and_global_state_updates",
    "secondarySkillAtomIds": [
      "rolling_window_local_update",
      "prefix_suffix_invalidation"
    ],
    "type": "single_choice",
    "prompt": "Which statement correctly contrasts changing one active-window boundary with editing an earlier element represented by prefix sums?",
    "feedbackModel": {
      "decisionSignal": "The representations encode different scopes: one current range versus cumulative history at many boundaries.",
      "mentalModelCorrection": "Local rolling state changes with the active boundary. Prefix state after an edited position contains globally stale cumulative information.",
      "mistakeTypes": [
        "state_update_scope_mismatch"
      ],
      "nextAction": "Identify how many stored states include the changed contribution.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "local_vs_global_effect",
        "text": "A window boundary change updates the current local state, while an earlier point edit affects every later cumulative prefix state.",
        "isCorrect": true
      },
      {
        "id": "both_local",
        "text": "Both changes affect exactly one stored scalar.",
        "isCorrect": false
      },
      {
        "id": "window_global_prefix_local",
        "text": "Moving a window boundary changes all previous windows, while a point edit changes only one prefix.",
        "isCorrect": false
      },
      {
        "id": "neither_changes_state",
        "text": "Both representations remain correct without any update.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-streaming-008",
    "learningStage": "foundations",
    "primarySkillAtomId": "evaluate_append_only_prefix_strategy",
    "secondarySkillAtomIds": [
      "online_prefix_extension",
      "historical_query_support"
    ],
    "type": "solution_comparison",
    "prompt": "Values are appended over time, and the system must support arbitrary range-sum queries over all values received so far. No existing value is ever modified. Which assessment is most accurate?",
    "feedbackModel": {
      "decisionSignal": "Appends preserve all earlier cumulative boundaries, and historical queries require retaining those boundaries.",
      "mentalModelCorrection": "Prefix sums are not inherently offline. They can grow incrementally for append-only data, but their memory usage grows with retained history.",
      "mistakeTypes": [
        "online_prefix_misconception"
      ],
      "nextAction": "Separate whether input is complete from whether earlier cumulative states remain valid.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "extend_prefix_history",
        "text": "A prefix sequence can be extended on each append and retained to answer historical ranges, with storage growing alongside the stream.",
        "isCorrect": true
      },
      {
        "id": "latest_window_only",
        "text": "A bounded rolling window is sufficient even for ranges that refer to discarded history.",
        "isCorrect": false
      },
      {
        "id": "prefix_impossible_online",
        "text": "Prefix state cannot be constructed until the stream is permanently closed.",
        "isCorrect": false
      },
      {
        "id": "rebuild_after_append",
        "text": "Every append requires recomputing all earlier prefix values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-streaming-009",
    "learningStage": "foundations",
    "primarySkillAtomId": "review_dynamic_prefix_correctness",
    "secondarySkillAtomIds": [
      "point_update_contract",
      "correctness_before_complexity"
    ],
    "type": "solution_comparison",
    "prompt": "A developer builds prefix sums once, then supports point updates to the array while continuing to answer queries from the unchanged prefix array. The query operation is still O(1). Which review is correct?",
    "feedbackModel": {
      "decisionSignal": "Complexity says nothing about whether stored state reflects the current data version.",
      "mentalModelCorrection": "An O(1) query over stale preprocessing is still wrong. Correctness must be restored through maintenance, rebuilding, or a different representation.",
      "mistakeTypes": [
        "correctness_before_complexity",
        "stale_preprocessed_state"
      ],
      "nextAction": "Validate preprocessed-state freshness before evaluating operation complexity.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "fast_but_incorrect",
        "text": "The query may be fast but incorrect because the preprocessed state no longer matches the current array.",
        "isCorrect": true
      },
      {
        "id": "correct_due_to_constant_query",
        "text": "The solution remains correct because each query still uses constant time.",
        "isCorrect": false
      },
      {
        "id": "correct_if_few_updates",
        "text": "The solution is correct as long as updates are less frequent than queries.",
        "isCorrect": false
      },
      {
        "id": "window_fixes_prefix",
        "text": "Adding two sliding-window pointers automatically updates the stale prefix values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "advanced",
    "id": "alg-contrast-sliding-window-prefix-streaming-010",
    "learningStage": "foundations",
    "primarySkillAtomId": "justify_streaming_state_choice",
    "secondarySkillAtomIds": [
      "state_retention_contract",
      "online_strategy_justification"
    ],
    "type": "solution_comparison",
    "prompt": "Which explanation best distinguishes rolling-window state from prefix state under streaming and changing-data constraints?",
    "feedbackModel": {
      "decisionSignal": "The correct comparison covers retained history, update scope, append behavior, expiration, and supported query contracts.",
      "mentalModelCorrection": "The strategies are not separated simply into online and offline. Their key difference is what historical state they preserve and how changes affect that state.",
      "mistakeTypes": [
        "weak_strategy_justification"
      ],
      "nextAction": "Justify the strategy through retention, update behavior, output timing, and historical-query requirements.",
      "result": "diagnostic"
    },
    "options": [
      {
        "id": "complete_contrast",
        "text": "Rolling state retains the currently relevant range and updates locally as values enter or expire; prefix state retains cumulative historical boundaries, can extend under appends, but becomes stale after unmaintained edits to earlier values.",
        "isCorrect": true
      },
      {
        "id": "window_for_stream_prefix_offline",
        "text": "Sliding windows work for every stream, while prefix sums can never be used until all future input is known.",
        "isCorrect": false
      },
      {
        "id": "prefix_for_every_change",
        "text": "Prefix sums automatically handle appends and point updates without changing stored state.",
        "isCorrect": false
      },
      {
        "id": "same_retention",
        "text": "Both strategies retain exactly the same historical information and support identical queries.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
