import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const complexitySpaceAndMistakeReviewQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The loop performs a constant expected amount of hash work per input element and retains previously observed keys.",
      "mentalModelCorrection": "Constant expected cost per iteration produces linear total time, not constant total time. Stored keyed state must also be included in the space analysis.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Multiply the expected work per iteration by the number of processed elements, then count the maximum retained state.",
      "result": "diagnostic",
      "distractorExplanations": {
        "worst_n_space_one": "This alternative misses a stated part of the contract: Guaranteed O(n) time and O(1) auxiliary space.",
        "expected_nlogn_space_n": "This alternative misses a stated part of the contract: Expected O(n log n) time and O(n) auxiliary space.",
        "expected_one_space_n": "This alternative misses a stated part of the contract: Expected O(1) time and O(n) auxiliary space."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A solution scans n elements once. For each element, it performs one expected O(1) hash lookup and at most one expected O(1) insertion. In the worst case, the map stores one entry for every element. What is the appropriate complexity description under standard hash-table assumptions?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 001",
    "trackId": "algorithms",
    "type": "complexity_check",
    "expectedTimeComplexity": "O(n)",
    "expectedSpaceComplexity": "O(n)",
    "complexityExplanation": "There are n expected constant-time hash operations, so the total expected time is O(n). The keyed state may contain n distinct entries, giving O(n) auxiliary space.",
    "answerFeedback": "There are n expected constant-time hash operations, so the total expected time is O(n). The keyed state may contain n distinct entries, giving O(n) auxiliary space.",
    "options": [
      {
        "id": "expected_n_space_n",
        "text": "Expected O(n) time and O(n) auxiliary space.",
        "isCorrect": true
      },
      {
        "id": "worst_n_space_one",
        "text": "Guaranteed O(n) time and O(1) auxiliary space.",
        "isCorrect": false
      },
      {
        "id": "expected_nlogn_space_n",
        "text": "Expected O(n log n) time and O(n) auxiliary space.",
        "isCorrect": false
      },
      {
        "id": "expected_one_space_n",
        "text": "Expected O(1) time and O(n) auxiliary space.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The second loop begins only after the first loop ends rather than running once for every first-loop iteration.",
      "mentalModelCorrection": "Multiply costs for nested or repeated-per-item work. Add costs for sequential phases.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Write the phases as a sum before simplifying the asymptotic expression.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_pass_constant": "This alternative misses a stated part of the contract: Building a hash map is O(1), so only the second pass matters.",
        "two_passes_logarithmic": "This alternative misses a stated part of the contract: Any algorithm with exactly two passes is O(log n).",
        "frequency_map_sort": "This alternative misses a stated part of the contract: A frequency map automatically sorts its keys, reducing the total to O(log n)."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-002-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A reviewer says that an algorithm is O(n²) because it first makes one O(n) pass to build a frequency map and then makes a separate O(n) pass to inspect the input. What is wrong with that reasoning?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 002",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "Sequential phases are added, not multiplied. A constant number of O(n) passes remains O(n), assuming expected constant-time hash operations and constant-cost keys.",
    "options": [
      {
        "id": "sequential_add",
        "text": "The passes are sequential, so their costs add to O(n + n) = O(n). They are not nested.",
        "isCorrect": true
      },
      {
        "id": "hash_pass_constant",
        "text": "Building a hash map is O(1), so only the second pass matters.",
        "isCorrect": false
      },
      {
        "id": "two_passes_logarithmic",
        "text": "Any algorithm with exactly two passes is O(log n).",
        "isCorrect": false
      },
      {
        "id": "frequency_map_sort",
        "text": "A frequency map automatically sorts its keys, reducing the total to O(log n).",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The two-pointer phase depends on an earlier comparison sort.",
      "mentalModelCorrection": "Analyze every required phase. A linear final scan does not make the entire algorithm linear when preprocessing is more expensive.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Add sorting and scanning costs before selecting the dominant asymptotic term.",
      "result": "diagnostic",
      "distractorExplanations": {
        "n": "This alternative misses a stated part of the contract: O(n), because each pointer moves at most n times.",
        "n_squared": "This alternative misses a stated part of the contract: O(n²), because sorting and scanning are two separate phases.",
        "logn": "This alternative misses a stated part of the contract: O(log n), because the values become ordered."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-003-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A solution sorts n values using a comparison sort and then performs one O(n) two-pointer scan. What is the total time complexity when comparisons are O(1)?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 003",
    "trackId": "algorithms",
    "type": "complexity_check",
    "expectedTimeComplexity": "O(n)",
    "expectedSpaceComplexity": "O(n)",
    "complexityExplanation": "The total is O(n log n + n), which simplifies to O(n log n). The linear scan does not remove the cost of establishing sorted order.",
    "answerFeedback": "The total is O(n log n + n), which simplifies to O(n log n). The linear scan does not remove the cost of establishing sorted order.",
    "options": [
      {
        "id": "nlogn",
        "text": "O(n log n), because O(n log n) sorting dominates the following O(n) scan.",
        "isCorrect": true
      },
      {
        "id": "n",
        "text": "O(n), because each pointer moves at most n times.",
        "isCorrect": false
      },
      {
        "id": "n_squared",
        "text": "O(n²), because sorting and scanning are two separate phases.",
        "isCorrect": false
      },
      {
        "id": "logn",
        "text": "O(log n), because the values become ordered.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The claim uses absolute language about hash operations without stating assumptions.",
      "mentalModelCorrection": "Expected lookup and amortized insertion describe different assumptions. Without stronger guarantees, neither proves a worst-case linear pass.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "lookup_always_logn": "This alternative misses a stated part of the contract: Every hash lookup is guaranteed O(log n), so the algorithm is always O(n log n).",
        "map_lookup_linear_normally": "This alternative misses a stated part of the contract: Hash lookup is normally O(n), so the entire algorithm is normally O(n²).",
        "worst_case_irrelevant": "This alternative misses a stated part of the contract: Expected and worst-case complexity mean the same thing for hash tables."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-004-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A review says Map lookup is always O(1), so a whole pass is guaranteed worst-case O(n). Which correction is precise?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 004",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "Expected lookup and amortized insertion describe different assumptions. Without stronger guarantees, neither proves a worst-case linear pass.",
    "options": [
      {
        "id": "expected_not_unconditional",
        "text": "Lookup is commonly expected or average O(1); insertion can be expected and amortized O(1) because resize work is spread across insertions. Neither guarantees every operation is worst-case O(1).",
        "isCorrect": true
      },
      {
        "id": "lookup_always_logn",
        "text": "Every hash lookup is guaranteed O(log n), so the algorithm is always O(n log n).",
        "isCorrect": false
      },
      {
        "id": "map_lookup_linear_normally",
        "text": "Hash lookup is normally O(n), so the entire algorithm is normally O(n²).",
        "isCorrect": false
      },
      {
        "id": "worst_case_irrelevant",
        "text": "Expected and worst-case complexity mean the same thing for hash tables.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The algorithm retains keyed state whose size grows with the number of distinct input values.",
      "mentalModelCorrection": "Measure peak live auxiliary memory, not merely the size of the returned value.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Count the maximum number of entries simultaneously stored in every auxiliary structure.",
      "result": "diagnostic",
      "distractorExplanations": {
        "result_determines_space": "This alternative misses a stated part of the contract: The auxiliary space is O(1) because only the return value remains after the function finishes.",
        "set_is_input_space": "This alternative misses a stated part of the contract: Set storage is not counted because it contains values copied from the input.",
        "set_is_logarithmic": "This alternative misses a stated part of the contract: The auxiliary space is O(log n) because hash tables organize values into buckets."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-005-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A function returns only a boolean, but during its scan it may store every distinct input value in a Set. A reviewer calls its auxiliary space O(1) because the returned result has constant size. What is the correct diagnosis?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 005",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "Space complexity counts working data retained while the algorithm runs. A constant-sized result does not cancel an O(n)-sized Set or Map.",
    "options": [
      {
        "id": "state_is_linear",
        "text": "The auxiliary space is O(n) in the worst case because the Set may retain n distinct keys.",
        "isCorrect": true
      },
      {
        "id": "result_determines_space",
        "text": "The auxiliary space is O(1) because only the return value remains after the function finishes.",
        "isCorrect": false
      },
      {
        "id": "set_is_input_space",
        "text": "Set storage is not counted because it contains values copied from the input.",
        "isCorrect": false
      },
      {
        "id": "set_is_logarithmic",
        "text": "The auxiliary space is O(log n) because hash tables organize values into buckets.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Input immutability is achieved by materializing another array proportional to the input size.",
      "mentalModelCorrection": "An in-place sort of the copy is not an O(1)-space solution relative to the original input because the copy itself is auxiliary storage.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Separate the memory used to copy or decorate the input from the sorting algorithm's internal workspace.",
      "result": "diagnostic",
      "distractorExplanations": {
        "copy_constant": "This alternative misses a stated part of the contract: The copy requires O(1) auxiliary space because it contains primitive values.",
        "sort_erases_copy": "This alternative misses a stated part of the contract: The sort immediately reuses nums, so the copied array does not count.",
        "scan_log_space": "This alternative misses a stated part of the contract: The pointer scan requires O(log n) auxiliary space."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-006-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A solution must not mutate nums, so it begins with:\n\nconst sorted = [...nums].sort((a, b) => a - b);\n\nIt then scans sorted with two pointers.\n\nWhich auxiliary-space statement is necessarily true before considering the sort implementation's own workspace?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 006",
    "trackId": "algorithms",
    "type": "complexity_check",
    "expectedTimeComplexity": "O(n)",
    "expectedSpaceComplexity": "O(n)",
    "complexityExplanation": "Creating a separate n-element array costs O(n) auxiliary space regardless of how much additional workspace the sorting implementation uses.",
    "answerFeedback": "Creating a separate n-element array costs O(n) auxiliary space regardless of how much additional workspace the sorting implementation uses.",
    "options": [
      {
        "id": "copy_linear",
        "text": "The copied array already requires O(n) auxiliary space.",
        "isCorrect": true
      },
      {
        "id": "copy_constant",
        "text": "The copy requires O(1) auxiliary space because it contains primitive values.",
        "isCorrect": false
      },
      {
        "id": "sort_erases_copy",
        "text": "The sort immediately reuses nums, so the copied array does not count.",
        "isCorrect": false
      },
      {
        "id": "scan_log_space",
        "text": "The pointer scan requires O(log n) auxiliary space.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The complexity claim depends on unspecified implementation details.",
      "mentalModelCorrection": "Do not infer internal memory behavior solely from an API that mutates the supplied array.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Name the sorting algorithm or runtime guarantee before asserting a precise auxiliary-space bound.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_always_linear_space": "This alternative misses a stated part of the contract: Every possible sorting algorithm necessarily allocates a second O(n) array.",
        "sorting_never_uses_stack": "This alternative misses a stated part of the contract: Sorting space depends only on the comparator, never on the sorting algorithm.",
        "input_counts_as_auxiliary": "This alternative misses a stated part of the contract: The input array itself always counts as O(n) auxiliary space."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-007-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A reviewer writes: \"Sorting uses O(1) auxiliary space.\" No sorting algorithm or runtime implementation is identified. Why is this claim incomplete?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 007",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "An in-place interface does not prove O(1) auxiliary memory. Implementations may use O(log n) stack space, O(n) workspace buffers, or other workspace. The assumption must be stated and supported.",
    "options": [
      {
        "id": "implementation_assumption_needed",
        "text": "Auxiliary space depends on the sorting implementation; some algorithms sort in place but use recursion or workspace buffers, and built-in sort behavior must not be assumed without evidence.",
        "isCorrect": true
      },
      {
        "id": "sorting_always_linear_space",
        "text": "Every possible sorting algorithm necessarily allocates a second O(n) array.",
        "isCorrect": false
      },
      {
        "id": "sorting_never_uses_stack",
        "text": "Sorting space depends only on the comparator, never on the sorting algorithm.",
        "isCorrect": false
      },
      {
        "id": "input_counts_as_auxiliary",
        "text": "The input array itself always counts as O(n) auxiliary space.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The operation described as one lookup includes preprocessing proportional to the key size.",
      "mentalModelCorrection": "O(1) hash-table access assumes a ready, constant-cost key. Include construction, normalization, serialization, equality, and hashing costs when they scale with the input.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Identify all independent size parameters and account for the work needed before the table operation begins.",
      "result": "diagnostic",
      "distractorExplanations": {
        "n": "This alternative misses a stated part of the contract: Expected O(n), because map operations are expected O(1).",
        "k": "This alternative misses a stated part of the contract: O(k), because every generated key has the same number of fields.",
        "nlogn": "This alternative misses a stated part of the contract: O(n log n), because string keys cause the map to sort its entries."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-008-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "An algorithm processes n records. For every record, it serializes k fields into a new string key in O(k) time and then performs an expected O(1) map operation on that key. Assuming k is not a constant, what time bound should be reported for the pass?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 008",
    "trackId": "algorithms",
    "type": "complexity_check",
    "expectedTimeComplexity": "O(n)",
    "expectedSpaceComplexity": "O(n)",
    "complexityExplanation": "Expected constant-time table access does not make key creation free. Constructing n keys at O(k) each contributes O(nk) work. Hashing long keys may add similar representation-dependent cost.",
    "answerFeedback": "Expected constant-time table access does not make key creation free. Constructing n keys at O(k) each contributes O(nk) work. Hashing long keys may add similar representation-dependent cost.",
    "options": [
      {
        "id": "nk",
        "text": "Expected O(nk), because key construction is performed for every record.",
        "isCorrect": true
      },
      {
        "id": "n",
        "text": "Expected O(n), because map operations are expected O(1).",
        "isCorrect": false
      },
      {
        "id": "k",
        "text": "O(k), because every generated key has the same number of fields.",
        "isCorrect": false
      },
      {
        "id": "nlogn",
        "text": "O(n log n), because string keys cause the map to sort its entries.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The comparator performs non-constant work each time the sorting algorithm invokes it.",
      "mentalModelCorrection": "The standard O(n log n) comparison-sort bound assumes O(1)-cost comparisons.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Multiply the comparison count by the cost of one comparator call, or analyze a key-precomputation alternative.",
      "result": "diagnostic",
      "distractorExplanations": {
        "nlogn": "This alternative misses a stated part of the contract: O(n log n), because comparator work is never included in sorting complexity.",
        "nk": "This alternative misses a stated part of the contract: O(nk), because every element appears in only one comparison.",
        "klogn": "This alternative misses a stated part of the contract: O(k log n), because n elements are processed in parallel."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-009-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A comparison sort performs O(n log n) comparisons. Each comparator call derives and compares data in O(k) time. What is the resulting sorting time if the derived data is not precomputed?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 009",
    "trackId": "algorithms",
    "type": "complexity_check",
    "expectedTimeComplexity": "O(n)",
    "expectedSpaceComplexity": "O(n)",
    "complexityExplanation": "The number of comparisons is O(n log n), and each comparison costs O(k), producing O(k n log n). Precomputing comparison keys may change the tradeoff to O(nk + n log n) time with additional storage.",
    "answerFeedback": "The number of comparisons is O(n log n), and each comparison costs O(k), producing O(k n log n). Precomputing comparison keys may change the tradeoff to O(nk + n log n) time with additional storage.",
    "options": [
      {
        "id": "nlogn_times_k",
        "text": "O(k n log n).",
        "isCorrect": true
      },
      {
        "id": "nlogn",
        "text": "O(n log n), because comparator work is never included in sorting complexity.",
        "isCorrect": false
      },
      {
        "id": "nk",
        "text": "O(nk), because every element appears in only one comparison.",
        "isCorrect": false
      },
      {
        "id": "klogn",
        "text": "O(k log n), because n elements are processed in parallel.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The ordered representation survives across queries, but the pair search is repeated for each target.",
      "mentalModelCorrection": "Reusable preprocessing should be charged once, while per-query work must still be multiplied by the number of queries.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Separate one-time preprocessing from repeated query work before simplifying the total cost.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_every_query": "This alternative misses a stated part of the contract: O(qn log n), because the sorting cost must be charged again for every query even when the sorted copy is reused.",
        "one_sort_only": "This alternative misses a stated part of the contract: O(n log n), because querying a sorted array is automatically O(1).",
        "qlogn": "This alternative misses a stated part of the contract: O(q log n), because two pointers halve the search range on every step."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-010-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The same n-element array is queried for q different target sums. A sorted copy is built once and reused. Each query performs a fresh O(n) two-pointer scan. What is the total time complexity?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 010",
    "trackId": "algorithms",
    "type": "complexity_check",
    "expectedTimeComplexity": "O(n)",
    "expectedSpaceComplexity": "O(n)",
    "complexityExplanation": "The O(n log n) preprocessing cost is paid once. Each target still requires an O(n) two-pointer traversal, giving O(n log n + qn) overall.",
    "answerFeedback": "The O(n log n) preprocessing cost is paid once. Each target still requires an O(n) two-pointer traversal, giving O(n log n + qn) overall.",
    "options": [
      {
        "id": "sort_once_q_scans",
        "text": "O(n log n + qn).",
        "isCorrect": true
      },
      {
        "id": "sort_every_query",
        "text": "O(qn log n), because the sorting cost must be charged again for every query even when the sorted copy is reused.",
        "isCorrect": false
      },
      {
        "id": "one_sort_only",
        "text": "O(n log n), because querying a sorted array is automatically O(1).",
        "isCorrect": false
      },
      {
        "id": "qlogn",
        "text": "O(q log n), because two pointers halve the search range on every step.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "One strategy has a better asymptotic bound but fails a required correctness condition.",
      "mentalModelCorrection": "First establish correctness, representation sufficiency, and contract compliance. Optimize only among valid alternatives.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Reject or repair incorrect candidates before comparing their performance characteristics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "a_better_asymptotic": "This alternative misses a stated part of the contract: Solution A should be accepted because expected O(n) is asymptotically faster than O(n log n).",
        "both_equivalent": "This alternative misses a stated part of the contract: Both are equally correct because membership proves that some indexes must exist.",
        "b_invalid_due_sort": "This alternative misses a stated part of the contract: Solution B is invalid because any use of sorting loses original indexes."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-011-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The task requires returning original indexes.\n\nSolution A uses a Map in expected O(n) time but stores only boolean membership, so it cannot reconstruct the indexes.\n\nSolution B sorts { value, originalIndex } records and returns a correct index pair in O(n log n) time.\n\nWhich review conclusion is valid?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 011",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "Complexity comparisons apply only among solutions that meet the contract. A faster algorithm that cannot construct the required result is not a valid implementation.",
    "options": [
      {
        "id": "b_only_currently_valid",
        "text": "Solution B is the only currently valid solution. Solution A's better expected complexity is irrelevant until its state is changed to satisfy the output contract.",
        "isCorrect": true
      },
      {
        "id": "a_better_asymptotic",
        "text": "Solution A should be accepted because expected O(n) is asymptotically faster than O(n log n).",
        "isCorrect": false
      },
      {
        "id": "both_equivalent",
        "text": "Both are equally correct because membership proves that some indexes must exist.",
        "isCorrect": false
      },
      {
        "id": "b_invalid_due_sort",
        "text": "Solution B is invalid because any use of sorting loses original indexes.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The proposed decision uses one asymptotic number while ignoring the assumptions and constraints behind both alternatives.",
      "mentalModelCorrection": "Big-O is a decision input, not an automatic ranking system detached from correctness, resources, and workload shape.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Compare valid strategies across time model, peak memory, guarantees, preprocessing lifecycle, and output semantics.",
      "result": "diagnostic",
      "distractorExplanations": {
        "hash_always_best": "This alternative misses a stated part of the contract: The choice is always correct because a lower asymptotic expression overrides every other requirement.",
        "sorting_always_best": "This alternative misses a stated part of the contract: The choice is always wrong because sorting has deterministic ordering and therefore always runs faster.",
        "big_o_irrelevant": "This alternative misses a stated part of the contract: The two strategies should be chosen randomly because asymptotic complexity has no practical meaning."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-complexity-012-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A developer chooses hashing solely because \"O(n) is smaller than O(n log n).\" Which review response is most complete?",
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
        "nodeId": "sorting_based",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_sorting_tradeoff",
        "role": "primary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Hash map versus sorting: complexity 012",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "Expected O(n) hashing can be the best option, but the asymptotic time expression is not the entire decision. Memory limits, guarantees, key behavior, repeated use, data representation, mutation rules, and correctness can justify another strategy.",
    "options": [
      {
        "id": "evaluate_full_contract",
        "text": "Expected time matters, but the decision must also consider correctness, O(n) keyed memory, worst-case requirements, key cost, mutation constraints, preprocessing reuse, and actual implementation guarantees.",
        "isCorrect": true
      },
      {
        "id": "hash_always_best",
        "text": "The choice is always correct because a lower asymptotic expression overrides every other requirement.",
        "isCorrect": false
      },
      {
        "id": "sorting_always_best",
        "text": "The choice is always wrong because sorting has deterministic ordering and therefore always runs faster.",
        "isCorrect": false
      },
      {
        "id": "big_o_irrelevant",
        "text": "The two strategies should be chosen randomly because asymptotic complexity has no practical meaning.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
