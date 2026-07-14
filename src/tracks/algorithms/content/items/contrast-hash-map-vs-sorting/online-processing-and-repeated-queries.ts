import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const onlineProcessingAndRepeatedQueriesQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The result must be produced immediately for each arriving value without waiting for the stream to finish.",
      "mentalModelCorrection": "Online processing requires state that can be queried and updated incrementally. A batch transformation over the final dataset may not satisfy the timing contract.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Check whether the algorithm must answer before the complete input is available.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_complete_stream": "This alternative misses a stated part of the contract: Sort the complete stream and compare adjacent values after all future values have arrived.",
        "repeated_full_sort": "This alternative misses a stated part of the contract: After every new value, sort every value received so far and scan the full sorted sequence.",
        "store_last_only": "This alternative misses a stated part of the contract: Store only the most recently received value and compare the next value with it."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Values arrive one at a time from a stream, and the system must report a duplicate as soon as the new value has appeared before. Which strategy directly supports this contract?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "foundations",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 001",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "A seen Set can be updated incrementally and can identify a repeated value at its arrival time. Sorting is naturally batch-oriented because it requires a collection of available values and usually delays the result.",
    "options": [
      {
        "id": "incremental_seen_set",
        "text": "Maintain a Set of previously received values and check each new value before inserting it.",
        "isCorrect": true
      },
      {
        "id": "sort_complete_stream",
        "text": "Sort the complete stream and compare adjacent values after all future values have arrived.",
        "isCorrect": false
      },
      {
        "id": "repeated_full_sort",
        "text": "After every new value, sort every value received so far and scan the full sorted sequence.",
        "isCorrect": false
      },
      {
        "id": "store_last_only",
        "text": "Store only the most recently received value and compare the next value with it.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The required state changes after every event and distinguishes one occurrence from multiple occurrences.",
      "mentalModelCorrection": "Incremental frequency maintenance requires count-valued keyed state, not only membership.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Store only the persistent information that must change when one new item arrives.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_all_events": "This alternative misses a stated part of the contract: Sort the complete event history every time a new event arrives.",
        "seen_set": "This alternative misses a stated part of the contract: Maintain only a Set of event types that have appeared.",
        "final_run_scan": "This alternative misses a stated part of the contract: Wait until the stream permanently ends and then count sorted runs."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-002-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A service receives events continuously and must keep the current occurrence count for every event type. Which state best supports each new event?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 002",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "A frequency Map preserves exact multiplicity and updates only the key affected by the new event. A Set cannot distinguish counts, while repeated sorting adds unnecessary batch work.",
    "options": [
      {
        "id": "incremental_frequency_map",
        "text": "Maintain a Map from event type to count and increment one entry per event.",
        "isCorrect": true
      },
      {
        "id": "sort_all_events",
        "text": "Sort the complete event history every time a new event arrives.",
        "isCorrect": false
      },
      {
        "id": "seen_set",
        "text": "Maintain only a Set of event types that have appeared.",
        "isCorrect": false
      },
      {
        "id": "final_run_scan",
        "text": "Wait until the stream permanently ends and then count sorted runs.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The proposed preprocessing phase requires a completion point that the input does not have.",
      "mentalModelCorrection": "A valid algorithm must respect when data becomes available, not only what result could be computed from a completed snapshot.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Distinguish finite batch inputs from open-ended streams before selecting preprocessing.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_cannot_find_duplicates": "This alternative misses a stated part of the contract: Sorting cannot expose duplicate values.",
        "hashing_required_for_streams": "This alternative misses a stated part of the contract: Streaming systems are technically unable to execute comparison operations.",
        "duplicates_removed": "This alternative misses a stated part of the contract: Sorting automatically removes duplicates from the stream."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-003-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A developer proposes: \"For the infinite stream, we will first sort all values and then answer duplicate queries.\" What is the fundamental problem?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 003",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "Sorting the complete input assumes that the dataset is available as a finite batch. An infinite or open-ended stream never reaches that prerequisite.",
    "options": [
      {
        "id": "stream_never_complete",
        "text": "An infinite stream has no final complete collection to sort before answers are required.",
        "isCorrect": true
      },
      {
        "id": "sorting_cannot_find_duplicates",
        "text": "Sorting cannot expose duplicate values.",
        "isCorrect": false
      },
      {
        "id": "hashing_required_for_streams",
        "text": "Streaming systems are technically unable to execute comparison operations.",
        "isCorrect": false
      },
      {
        "id": "duplicates_removed",
        "text": "Sorting automatically removes duplicates from the stream.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The input collection is fixed and the constructed index survives across all queries.",
      "mentalModelCorrection": "Reusable preprocessing should be charged once, not once per query.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Separate one-time index construction from repeated query costs.",
      "result": "diagnostic",
      "distractorExplanations": {
        "qn": "This alternative misses a stated part of the contract: Expected O(qn), because the Set must be rebuilt for every query.",
        "nlogn_plus_q": "This alternative misses a stated part of the contract: O(n log n + q), because every hash index requires sorting first.",
        "q_only": "This alternative misses a stated part of the contract: Expected O(q), because preprocessing is never included in total complexity."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-004-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A fixed collection of n values receives q membership queries. A Set is built once in expected O(n) time, and each query is expected O(1). What is the expected total time?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 004",
    "trackId": "algorithms",
    "type": "complexity_check",
    "expectedTimeComplexity": "O(n)",
    "expectedSpaceComplexity": "O(n)",
    "complexityExplanation": "The O(n) preprocessing cost is paid once. Reusing the Set gives q expected constant-time queries, so the total is expected O(n + q).",
    "answerFeedback": "The O(n) preprocessing cost is paid once. Reusing the Set gives q expected constant-time queries, so the total is expected O(n + q).",
    "options": [
      {
        "id": "n_plus_q",
        "text": "Expected O(n + q).",
        "isCorrect": true
      },
      {
        "id": "qn",
        "text": "Expected O(qn), because the Set must be rebuilt for every query.",
        "isCorrect": false
      },
      {
        "id": "nlogn_plus_q",
        "text": "O(n log n + q), because every hash index requires sorting first.",
        "isCorrect": false
      },
      {
        "id": "q_only",
        "text": "Expected O(q), because preprocessing is never included in total complexity.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The same unchanged input is indexed repeatedly for independent queries.",
      "mentalModelCorrection": "An efficient data structure can still be used inefficiently when its preprocessing is placed inside the per-query path.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Move reusable index construction outside the query function or cache it with the dataset.",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_lookup_linear": "This alternative misses a stated part of the contract: Set.has always scans all n values.",
        "array_must_sort": "This alternative misses a stated part of the contract: A Set cannot answer membership unless nums is sorted first.",
        "target_not_stored": "This alternative misses a stated part of the contract: The query target must be inserted into the Set before lookup."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-005-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A fixed array receives many membership queries:\n\nfunction contains(nums: number[], target: number): boolean {\n  const values = new Set(nums);\n  return values.has(target);\n}\n\nThe function is called q times with the same nums. What is the main performance mistake?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 005",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "Repeated construction changes the workload from expected O(n + q) to expected O(qn). The index lifecycle should match the lifecycle of the fixed underlying data.",
    "options": [
      {
        "id": "map_rebuilt_each_query",
        "text": "The Set is rebuilt in O(n) expected time for every query instead of being constructed once and reused.",
        "isCorrect": true
      },
      {
        "id": "set_lookup_linear",
        "text": "Set.has always scans all n values.",
        "isCorrect": false
      },
      {
        "id": "array_must_sort",
        "text": "A Set cannot answer membership unless nums is sorted first.",
        "isCorrect": false
      },
      {
        "id": "target_not_stored",
        "text": "The query target must be inserted into the Set before lookup.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The queries depend on relative order rather than only exact-key membership.",
      "mentalModelCorrection": "Repeated-query strategy depends on the query family. Expected constant-time exact lookup does not make hashing universally superior.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Classify repeated queries as exact-key, frequency-based, or order-dependent before selecting the reusable index.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_always_superior": "This alternative misses a stated part of the contract: A hash index is always superior for repeated queries because expected O(1) lookup solves every ordered query.",
        "sort_each_query": "This alternative misses a stated part of the contract: The dataset should be sorted separately for every query to preserve query independence.",
        "ordering_no_reuse": "This alternative misses a stated part of the contract: Sorted order helps only during the first query and provides no reusable information."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-006-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A fixed dataset will serve many queries involving ordered relationships, such as minimum values above thresholds, value ranges, and neighboring values. Which observation is most accurate?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 006",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "Hashing is strong for key-based membership and lookup, but it does not inherently provide ordering. A reusable sorted representation can support a broader family of order-dependent queries.",
    "options": [
      {
        "id": "sorted_order_reusable",
        "text": "A sorted representation may justify its one-time O(n log n) cost because the ordering can support many later queries.",
        "isCorrect": true
      },
      {
        "id": "hash_always_superior",
        "text": "A hash index is always superior for repeated queries because expected O(1) lookup solves every ordered query.",
        "isCorrect": false
      },
      {
        "id": "sort_each_query",
        "text": "The dataset should be sorted separately for every query to preserve query independence.",
        "isCorrect": false
      },
      {
        "id": "ordering_no_reuse",
        "text": "Sorted order helps only during the first query and provides no reusable information.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The system serves multiple query contracts with different access requirements.",
      "mentalModelCorrection": "An unchanged reusable index is stale and can report membership, counts, or ordered data that no longer exists.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_replaces_sorting": "This alternative misses a stated part of the contract: A hash index makes every sorted representation redundant.",
        "sorting_replaces_hashing": "This alternative misses a stated part of the contract: A sorted representation guarantees expected O(1) exact membership and therefore makes hashing redundant.",
        "no_preprocessing": "This alternative misses a stated part of the contract: Repeated queries should always rescan the raw input to avoid maintaining more than one representation."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-007-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A mutable collection has reusable Set/Map and sorted indexes. What is wrong with using indexes unchanged after deletions?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "independent_attempt",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 007",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "An unchanged reusable index is stale and can report membership, counts, or ordered data that no longer exists.",
    "options": [
      {
        "id": "query_mix_determines_indexes",
        "text": "Every index must be synchronized: update Set/Map counts, remove a zero-count key, and remove the sorted occurrence or rebuild the sorted array.",
        "isCorrect": true
      },
      {
        "id": "hash_replaces_sorting",
        "text": "A hash index makes every sorted representation redundant.",
        "isCorrect": false
      },
      {
        "id": "sorting_replaces_hashing",
        "text": "A sorted representation guarantees expected O(1) exact membership and therefore makes hashing redundant.",
        "isCorrect": false
      },
      {
        "id": "no_preprocessing",
        "text": "Repeated queries should always rescan the raw input to avoid maintaining more than one representation.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Updates occur often, and the representation stores values contiguously in sorted order.",
      "mentalModelCorrection": "Query efficiency and update efficiency are separate concerns. Cheap searches do not imply cheap maintenance.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Include the frequency and cost of updates when evaluating a preprocessed representation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_forbids_queries": "This alternative misses a stated part of the contract: A sorted array cannot be queried after the first insertion.",
        "duplicates_break_sorting": "This alternative misses a stated part of the contract: Any duplicate insertion permanently destroys sorted order.",
        "hashing_updates_sorted_array": "This alternative misses a stated part of the contract: Every sorted-array insertion also requires rebuilding a hash table."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-008-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A collection receives frequent insertions between queries. Why can a permanently sorted array become expensive to maintain?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 008",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "Even when the correct position can be located efficiently, an array representation may need linear data movement to preserve sorted order after an insertion.",
    "options": [
      {
        "id": "insertion_shifts",
        "text": "Finding an insertion position is not enough; inserting into the middle of an array may require shifting O(n) elements.",
        "isCorrect": true
      },
      {
        "id": "sorting_forbids_queries",
        "text": "A sorted array cannot be queried after the first insertion.",
        "isCorrect": false
      },
      {
        "id": "duplicates_break_sorting",
        "text": "Any duplicate insertion permanently destroys sorted order.",
        "isCorrect": false
      },
      {
        "id": "hashing_updates_sorted_array",
        "text": "Every sorted-array insertion also requires rebuilding a hash table.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The representation is reconstructed globally after each local update.",
      "mentalModelCorrection": "Decrementing preserves multiplicity; deleting B at zero preserves has(key) membership semantics. A Set cannot represent counts.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "membership_requires_sorting": "This alternative misses a stated part of the contract: The approach is required because membership cannot be maintained incrementally.",
        "copies_are_constant": "This alternative misses a stated part of the contract: There is no concern because copying and sorting are O(1) for primitive values.",
        "sorting_invalid_after_insert": "This alternative misses a stated part of the contract: Sorting is incorrect whenever the collection has been updated."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-009-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "counts = new Map([[\"A\", 2], [\"B\", 1]]). Delete one A and one B. What state preserves has(key) as presence?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "guided_application",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 009",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "Decrementing preserves multiplicity; deleting B at zero preserves has(key) membership semantics. A Set cannot represent counts.",
    "options": [
      {
        "id": "full_rebuild_per_update",
        "text": "A maps to 1 and B is removed from the Map.",
        "isCorrect": true
      },
      {
        "id": "membership_requires_sorting",
        "text": "The approach is required because membership cannot be maintained incrementally.",
        "isCorrect": false
      },
      {
        "id": "copies_are_constant",
        "text": "There is no concern because copying and sorting are O(1) for primitive values.",
        "isCorrect": false
      },
      {
        "id": "sorting_invalid_after_insert",
        "text": "Sorting is incorrect whenever the collection has been updated.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A relatively expensive preprocessing step can be reused across a large read-heavy workload.",
      "mentalModelCorrection": "The value of preprocessing depends on how long the representation remains valid and how often it is reused.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Compare the number of queries served per rebuild rather than evaluating preprocessing in isolation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "continuous_updates_one_membership": "This alternative misses a stated part of the contract: Values arrive continuously, and each value receives only one exact-membership check.",
        "single_early_duplicate": "This alternative misses a stated part of the contract: The system stops immediately after detecting the first duplicate in a stream.",
        "frequent_rebuilds_no_reuse": "This alternative misses a stated part of the contract: The data changes before almost every query, and the sorted representation is discarded afterward."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-010-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which workload most strongly supports paying for a reusable sorted representation?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "independent_attempt",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 010",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "Sorting is easier to amortize when the data is stable and the resulting order serves many queries. Frequent changes and little reuse make repeated preprocessing less attractive.",
    "options": [
      {
        "id": "stable_many_ordered_queries",
        "text": "The data changes rarely, while many later queries depend on value order.",
        "isCorrect": true
      },
      {
        "id": "continuous_updates_one_membership",
        "text": "Values arrive continuously, and each value receives only one exact-membership check.",
        "isCorrect": false
      },
      {
        "id": "single_early_duplicate",
        "text": "The system stops immediately after detecting the first duplicate in a stream.",
        "isCorrect": false
      },
      {
        "id": "frequent_rebuilds_no_reuse",
        "text": "The data changes before almost every query, and the sorted representation is discarded afterward.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The workload uses exact-key operations and applies local updates frequently.",
      "mentalModelCorrection": "Mutable data does not imply rebuilding an index from scratch. The relevant question is whether the structure supports incremental maintenance.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Keep the index synchronized with updates rather than reconstructing it in the query path.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_before_every_query": "This alternative misses a stated part of the contract: Copy and sort the entire collection before every membership query.",
        "rebuild_set_every_query": "This alternative misses a stated part of the contract: Discard and rebuild a new Set from the entire collection before every query.",
        "no_state_linear_scan": "This alternative misses a stated part of the contract: Always rescan the complete collection because reusable state is never beneficial for mutable data."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-011-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "A mutable collection receives frequent insertions and exact membership queries. Original order does not matter, and no ordered-range queries are required. Which strategy is generally the better operational fit?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "independent_attempt",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 011",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "A maintained Set supports expected constant-time inserts and membership queries under standard assumptions. Rebuilding either representation wastes the opportunity to update persistent state incrementally.",
    "options": [
      {
        "id": "maintained_hash_set",
        "text": "Maintain a Set incrementally, updating it when values are inserted and reusing it for membership queries.",
        "isCorrect": true
      },
      {
        "id": "sort_before_every_query",
        "text": "Copy and sort the entire collection before every membership query.",
        "isCorrect": false
      },
      {
        "id": "rebuild_set_every_query",
        "text": "Discard and rebuild a new Set from the entire collection before every query.",
        "isCorrect": false
      },
      {
        "id": "no_state_linear_scan",
        "text": "Always rescan the complete collection because reusable state is never beneficial for mutable data.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The problem includes both operation semantics and the lifecycle of the underlying data.",
      "mentalModelCorrection": "Algorithm selection is not based only on one query's Big-O. It must account for preprocessing, reuse, invalidation, updates, and when answers are required.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Model the full sequence of data arrival, preprocessing, queries, and updates before choosing the representation.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_always_repeated": "This alternative misses a stated part of the contract: Use hashing for every repeated-query workload because expected O(1) lookup makes query type and update cost irrelevant.",
        "sorting_always_preprocess": "This alternative misses a stated part of the contract: Always sort once because every dataset remains unchanged after preprocessing.",
        "rebuild_every_operation": "This alternative misses a stated part of the contract: Rebuild the chosen structure before every operation so stale state is impossible."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-online-012-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "choose_lookup_key",
    "prompt": "Which decision rule best captures the operational contrast between hash-based state and sorting?",
    "roadmapNodeId": "contrast_hash_map_vs_sorting",
    "secondarySkillAtomIds": [],
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "learning_stage",
        "nodeId": "independent_attempt",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "hash_map_and_set",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "choose_lookup_key",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: online 012",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "The choice depends on data availability, response timing, query types, representation reuse, and update frequency. Hashing is naturally incremental; sorting is often attractive for stable batches and reusable ordered access.",
    "options": [
      {
        "id": "lifecycle_driven_choice",
        "text": "Use online hash state when answers and updates must be incremental; consider sorted preprocessing when a stable batch can serve many order-dependent queries, while accounting for rebuild costs after updates.",
        "isCorrect": true
      },
      {
        "id": "hash_always_repeated",
        "text": "Use hashing for every repeated-query workload because expected O(1) lookup makes query type and update cost irrelevant.",
        "isCorrect": false
      },
      {
        "id": "sorting_always_preprocess",
        "text": "Always sort once because every dataset remains unchanged after preprocessing.",
        "isCorrect": false
      },
      {
        "id": "rebuild_every_operation",
        "text": "Rebuild the chosen structure before every operation so stale state is impossible.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
