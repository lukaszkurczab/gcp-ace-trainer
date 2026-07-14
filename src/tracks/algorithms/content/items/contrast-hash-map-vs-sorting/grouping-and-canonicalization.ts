import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const groupingAndCanonicalizationQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The algorithm groups values by equivalence rather than by their original object identity or input position.",
      "mentalModelCorrection": "Two non-equivalent inputs sharing a serialized key is an encoding error. This differs from an internal hash collision between distinct keys, which a correct hash table still distinguishes.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use the exact output and implementation contract before committing to this strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "preserve_input_order": "This alternative misses a stated part of the contract: The key must preserve every element in its original position, even when order is irrelevant to equivalence.",
        "unique_every_input": "This alternative misses a stated part of the contract: Every input occurrence must receive a different key, including equivalent inputs.",
        "constant_length": "This alternative misses a stated part of the contract: Every key must have O(1) length regardless of the input domain."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-001-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A grouping algorithm stores canonical encoded keys in a Map. What representation property is essential?",
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
    "title": "Hash map versus sorting: grouping 001",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "Two non-equivalent inputs sharing a serialized key is an encoding error. This differs from an internal hash collision between distinct keys, which a correct hash table still distinguishes.",
    "options": [
      {
        "id": "same_equivalence_same_key",
        "text": "Equivalent collections must deterministically produce the same key, and non-equivalent collections must not produce the same application-level encoded key.",
        "isCorrect": true
      },
      {
        "id": "preserve_input_order",
        "text": "The key must preserve every element in its original position, even when order is irrelevant to equivalence.",
        "isCorrect": false
      },
      {
        "id": "unique_every_input",
        "text": "Every input occurrence must receive a different key, including equivalent inputs.",
        "isCorrect": false
      },
      {
        "id": "constant_length",
        "text": "Every key must have O(1) length regardless of the input domain.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "One operation normalizes the representation, while another indexes groups by that representation.",
      "mentalModelCorrection": "Hashing and sorting may compete as complete solutions, but they can also cooperate within different phases of one solution.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Identify separately how the key is constructed and how the resulting equivalence class is stored.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_only": "This alternative misses a stated part of the contract: It is purely a sorting solution because using a Map after sorting has no algorithmic role.",
        "hashing_only": "This alternative misses a stated part of the contract: It is purely a hash solution because the Map automatically sorts every key.",
        "redundant_combination": "This alternative misses a stated part of the contract: The two strategies cannot be combined correctly because hashing and sorting are mutually exclusive alternatives."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-002-check",
    "learningStage": "foundations",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A solution sorts each collection into a canonical representation and then uses that representation as a key in a Map of groups. How should this strategy be classified?",
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
    "title": "Hash map versus sorting: grouping 002",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "Sorting and hashing solve different subproblems. Sorting removes irrelevant order differences by producing a canonical key; the Map then collects all items with that key into one group.",
    "options": [
      {
        "id": "cooperating_strategies",
        "text": "Sorting constructs the canonical key, while hashing stores and retrieves the group associated with that key.",
        "isCorrect": true
      },
      {
        "id": "sorting_only",
        "text": "It is purely a sorting solution because using a Map after sorting has no algorithmic role.",
        "isCorrect": false
      },
      {
        "id": "hashing_only",
        "text": "It is purely a hash solution because the Map automatically sorts every key.",
        "isCorrect": false
      },
      {
        "id": "redundant_combination",
        "text": "The two strategies cannot be combined correctly because hashing and sorting are mutually exclusive alternatives.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Equivalence depends on occurrence counts, and the possible value domain is bounded and known.",
      "mentalModelCorrection": "Multiset equality requires multiplicity. Membership alone cannot distinguish one occurrence from several occurrences.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Match every equality condition in the contract to information retained in the signature.",
      "result": "diagnostic",
      "distractorExplanations": {
        "set_membership": "This alternative misses a stated part of the contract: A Set containing each value that appears at least once.",
        "first_element": "This alternative misses a stated part of the contract: The first value in the collection.",
        "collection_length": "This alternative misses a stated part of the contract: Only the total number of elements."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-003-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Collections contain values from a small fixed domain of 20 possible values. Two collections are equivalent when every value occurs the same number of times, regardless of order. Which key representation directly captures that contract?",
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
    "title": "Hash map versus sorting: grouping 003",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "A frequency vector preserves both value identity and multiplicity. Because the domain is fixed, each value has a deterministic count position in the signature.",
    "options": [
      {
        "id": "frequency_vector",
        "text": "A fixed-length vector of 20 occurrence counts.",
        "isCorrect": true
      },
      {
        "id": "set_membership",
        "text": "A Set containing each value that appears at least once.",
        "isCorrect": false
      },
      {
        "id": "first_element",
        "text": "The first value in the collection.",
        "isCorrect": false
      },
      {
        "id": "collection_length",
        "text": "Only the total number of elements.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The key intentionally treats different permutations as equivalent.",
      "mentalModelCorrection": "Canonicalization preserves information relevant to equivalence, not necessarily every property of the original input.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Keep the original item in the group when later logic still needs its original order.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_preserves_everything": "This alternative misses a stated part of the contract: The statement is correct because sorting only changes how the values are displayed.",
        "sorting_removes_duplicates": "This alternative misses a stated part of the contract: Sorting loses original order only because it removes duplicate values.",
        "map_restores_order": "This alternative misses a stated part of the contract: A Map automatically reconstructs the original order from the sorted key."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-004-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A developer says: \"The sorted key contains all the values, so it also preserves their original order.\" What is the correct review response?",
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
    "title": "Hash map versus sorting: grouping 004",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "A sorted representation is useful precisely because it normalizes different input orders. That normalization means the original ordering cannot be recovered unless it is stored separately.",
    "options": [
      {
        "id": "sorting_discards_original_order",
        "text": "Sorting preserves the values and their multiplicities but generally discards their original ordering.",
        "isCorrect": true
      },
      {
        "id": "sorting_preserves_everything",
        "text": "The statement is correct because sorting only changes how the values are displayed.",
        "isCorrect": false
      },
      {
        "id": "sorting_removes_duplicates",
        "text": "Sorting loses original order only because it removes duplicate values.",
        "isCorrect": false
      },
      {
        "id": "map_restores_order",
        "text": "A Map automatically reconstructs the original order from the sorted key.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Equivalent inputs still arrive at the Map with different order-dependent keys.",
      "mentalModelCorrection": "Hash storage groups equal keys. It does not automatically decide which distinct raw representations should count as equal.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Construct the equivalence-aware key before calling Map.get or Map.set.",
      "result": "diagnostic",
      "distractorExplanations": {
        "larger_map": "This alternative misses a stated part of the contract: A larger Map capacity so equivalent keys can be merged.",
        "second_map": "This alternative misses a stated part of the contract: A separate Map for every possible input order.",
        "random_hash": "This alternative misses a stated part of the contract: A random hash function so different permutations occasionally receive the same key."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-005-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A developer inserts each collection into a Map using its unchanged serialized order and expects equivalent permutations to enter the same group. What is missing?",
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
    "title": "Hash map versus sorting: grouping 005",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "A Map compares the keys it receives; it does not infer the application's equivalence relation. If order is irrelevant, the key must first be normalized through sorting, counting, or another deterministic representation.",
    "options": [
      {
        "id": "canonicalization_step",
        "text": "A canonicalization step that makes equivalent permutations produce the same key.",
        "isCorrect": true
      },
      {
        "id": "larger_map",
        "text": "A larger Map capacity so equivalent keys can be merged.",
        "isCorrect": false
      },
      {
        "id": "second_map",
        "text": "A separate Map for every possible input order.",
        "isCorrect": false
      },
      {
        "id": "random_hash",
        "text": "A random hash function so different permutations occasionally receive the same key.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Two distinct canonical sequences serialize to the same textual representation.",
      "mentalModelCorrection": "A canonical sequence still needs an unambiguous encoding. Hash-table collision handling cannot repair information already lost during key construction.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use an encoding that preserves element boundaries and types.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_failure": "This alternative misses a stated part of the contract: Sorting cannot be used with multi-digit numbers.",
        "map_collision_handled": "This alternative misses a stated part of the contract: There is no defect because the Map will inspect the original arrays after the keys match.",
        "multiplicity_removed": "This alternative misses a stated part of the contract: Concatenation automatically removes repeated values."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-006-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A developer builds keys by sorting numeric values and concatenating them without separators:\n\n[1, 23]  -> \"123\"\n[12, 3]  -> \"123\"\n\nWhat is the defect?",
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
    "title": "Hash map versus sorting: grouping 006",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "answerFeedback": "The string does not preserve where one value ends and another begins. Therefore non-equivalent inputs can be assigned the same application-level key before the hash table even processes it.",
    "options": [
      {
        "id": "ambiguous_encoding",
        "text": "Different multisets can produce the same serialized key because element boundaries are not encoded.",
        "isCorrect": true
      },
      {
        "id": "sorting_failure",
        "text": "Sorting cannot be used with multi-digit numbers.",
        "isCorrect": false
      },
      {
        "id": "map_collision_handled",
        "text": "There is no defect because the Map will inspect the original arrays after the keys match.",
        "isCorrect": false
      },
      {
        "id": "multiplicity_removed",
        "text": "Concatenation automatically removes repeated values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The values may contain multiple digits, negative signs, or repeated occurrences.",
      "mentalModelCorrection": "A canonical key must be both normalized and injective over the distinctions required by the equivalence contract.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Test the encoding with multi-digit, negative, empty, and repeated values.",
      "result": "diagnostic",
      "distractorExplanations": {
        "plain_concatenation": "This alternative misses a stated part of the contract: Concatenate all decimal values without separators.",
        "sum_only": "This alternative misses a stated part of the contract: Use the sum of all values as the key.",
        "first_last": "This alternative misses a stated part of the contract: Use only the smallest and largest values."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-007-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Which key construction is safest for a sorted sequence of arbitrary integers when the key must distinguish element boundaries?",
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
    "title": "Hash map versus sorting: grouping 007",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "Structured serialization retains sequence boundaries, signs, and multiplicity. The other choices allow distinct multisets to collapse into the same application-level key.",
    "options": [
      {
        "id": "structured_serialization",
        "text": "Use an unambiguous structured encoding such as JSON serialization of the sorted numeric array.",
        "isCorrect": true
      },
      {
        "id": "plain_concatenation",
        "text": "Concatenate all decimal values without separators.",
        "isCorrect": false
      },
      {
        "id": "sum_only",
        "text": "Use the sum of all values as the key.",
        "isCorrect": false
      },
      {
        "id": "first_last",
        "text": "Use only the smallest and largest values.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "The same distinct values are present, but their frequencies are different.",
      "mentalModelCorrection": "A Set signature represents membership equality, not multiset equality.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Include occurrence counts whenever repeated values affect equivalence.",
      "result": "diagnostic",
      "distractorExplanations": {
        "same_multiset_different_order": "This alternative misses a stated part of the contract: [2, 5, 2] and [5, 2, 2], because their order differs.",
        "same_singleton": "This alternative misses a stated part of the contract: [7] and [7], because they are separate objects.",
        "same_empty": "This alternative misses a stated part of the contract: [] and [], because empty collections cannot be equivalent."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-008-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The grouping contract uses multiset equality. Which pair must not receive the same key?",
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
    "title": "Hash map versus sorting: grouping 008",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "answerFeedback": "Multiset equality ignores order but preserves multiplicity. The first pair contains different counts of 2 and 5, so it represents two different equivalence classes.",
    "options": [
      {
        "id": "different_counts",
        "text": "[2, 2, 5] and [2, 5, 5], because their occurrence counts differ.",
        "isCorrect": true
      },
      {
        "id": "same_multiset_different_order",
        "text": "[2, 5, 2] and [5, 2, 2], because their order differs.",
        "isCorrect": false
      },
      {
        "id": "same_singleton",
        "text": "[7] and [7], because they are separate objects.",
        "isCorrect": false
      },
      {
        "id": "same_empty",
        "text": "[] and [], because empty collections cannot be equivalent.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Equivalent count maps are serialized differently because their insertion histories differ.",
      "mentalModelCorrection": "Correct information is not enough; the representation of that information must also be deterministic.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Normalize both the data and the order in which the data is encoded.",
      "result": "diagnostic",
      "distractorExplanations": {
        "use_larger_counts": "This alternative misses a stated part of the contract: Multiply every count by the input length before serialization.",
        "reverse_second_input": "This alternative misses a stated part of the contract: Reverse every input whose first value is smaller.",
        "map_auto_merge": "This alternative misses a stated part of the contract: No repair is needed because the outer grouping Map will treat the two strings as equivalent."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-009-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A frequency Map is built by scanning each input in its original order. The developer then serializes its entries in iteration order:\n\nInput A: [4, 2, 4] -> \"4:2|2:1\"\nInput B: [2, 4, 4] -> \"2:1|4:2\"\n\nThe inputs are multiset-equivalent, but the keys differ. What repair is required?",
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
    "title": "Hash map versus sorting: grouping 009",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "The frequency data is correct, but its serialization remains dependent on first-seen order. Canonicalization requires a deterministic order for the frequency entries themselves.",
    "options": [
      {
        "id": "sort_frequency_entries",
        "text": "Serialize entries in a deterministic key order, or use a fixed-position frequency vector when the domain permits it.",
        "isCorrect": true
      },
      {
        "id": "use_larger_counts",
        "text": "Multiply every count by the input length before serialization.",
        "isCorrect": false
      },
      {
        "id": "reverse_second_input",
        "text": "Reverse every input whose first value is smaller.",
        "isCorrect": false
      },
      {
        "id": "map_auto_merge",
        "text": "No repair is needed because the outer grouping Map will treat the two strings as equivalent.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Canonicalization performs a separate comparison sort for every input collection.",
      "mentalModelCorrection": "Expected O(1) Map access does not erase the work required to construct each key.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Analyze the canonicalization cost per item, then multiply it by the number of items.",
      "result": "diagnostic",
      "distractorExplanations": {
        "n_log_n": "This alternative misses a stated part of the contract: O(n log n), because the outer Map contains n groups.",
        "n_m": "This alternative misses a stated part of the contract: O(nm), because the final Map operation is expected O(1).",
        "m_log_m": "This alternative misses a stated part of the contract: O(m log m), because every collection is sorted at the same time."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-010-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "There are n collections, each containing m constant-size comparable values. A solution copies and comparison-sorts every collection to construct its canonical key, then inserts the key into a Map. What is the dominant key-construction time?",
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
    "title": "Hash map versus sorting: grouping 010",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "Sorting one m-element collection costs O(m log m). Repeating that work for n collections costs O(nm log m), before accounting for serialization and hashing of the resulting keys.",
    "options": [
      {
        "id": "n_m_log_m",
        "text": "O(nm log m).",
        "isCorrect": true
      },
      {
        "id": "n_log_n",
        "text": "O(n log n), because the outer Map contains n groups.",
        "isCorrect": false
      },
      {
        "id": "n_m",
        "text": "O(nm), because the final Map operation is expected O(1).",
        "isCorrect": false
      },
      {
        "id": "m_log_m",
        "text": "O(m log m), because every collection is sorted at the same time.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The representation uses one counter per domain value rather than sorting the input.",
      "mentalModelCorrection": "A fixed-size output structure does not eliminate the time required to scan a variable-length input.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Keep σ explicit until the problem states that the domain size is a fixed constant.",
      "result": "diagnostic",
      "distractorExplanations": {
        "m_log_m": "This alternative misses a stated part of the contract: Always O(m log m), because frequency counting internally sorts the values.",
        "sigma_only": "This alternative misses a stated part of the contract: O(σ), because reading the input values does not count.",
        "constant": "This alternative misses a stated part of the contract: O(1), because the resulting vector has a fixed shape."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-011-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Each input has length m and uses values from a fixed alphabet of size σ. A frequency-vector key is built by scanning the input and then encoding all σ counts. What is the key-construction time per input?",
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
    "title": "Hash map versus sorting: grouping 011",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "The algorithm must read all m values and then construct or encode a σ-position signature. With a truly fixed alphabet, σ is constant and the bound simplifies to O(m).",
    "options": [
      {
        "id": "m_plus_sigma",
        "text": "O(m + σ), which becomes O(m) when σ is treated as a fixed constant.",
        "isCorrect": true
      },
      {
        "id": "m_log_m",
        "text": "Always O(m log m), because frequency counting internally sorts the values.",
        "isCorrect": false
      },
      {
        "id": "sigma_only",
        "text": "O(σ), because reading the input values does not count.",
        "isCorrect": false
      },
      {
        "id": "constant",
        "text": "O(1), because the resulting vector has a fixed shape.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The two representations construct keys through different operations and may encode different-sized domains.",
      "mentalModelCorrection": "Using both results as Map keys does not make their preprocessing or storage costs equivalent.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Compare the representations using explicit parameters such as m, σ, and the number of distinct values.",
      "result": "diagnostic",
      "distractorExplanations": {
        "always_identical": "This alternative misses a stated part of the contract: The claim is correct because all Map keys have constant size internally.",
        "frequency_always_constant": "This alternative misses a stated part of the contract: Frequency signatures always use O(1) time and space, regardless of the value domain.",
        "sorted_always_no_space": "This alternative misses a stated part of the contract: Sorted keys always use O(1) space because sorting can always mutate the original collection."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-012-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A reviewer claims: \"Frequency signatures and sorted canonical keys always have identical runtime and space because both eventually become Map keys.\" Which response is accurate?",
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
    "title": "Hash map versus sorting: grouping 012",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "answerFeedback": "A sorted key commonly costs O(m log m) time and O(m) key or copy space. A frequency signature may cost O(m + σ) time and O(σ) key space, but those bounds depend on whether the domain is fixed, large, or sparse.",
    "options": [
      {
        "id": "behavior_depends_on_representation",
        "text": "Their costs depend on input length, domain size, key encoding, copying, and retained key size; sorting and counting do not have universally identical behavior.",
        "isCorrect": true
      },
      {
        "id": "always_identical",
        "text": "The claim is correct because all Map keys have constant size internally.",
        "isCorrect": false
      },
      {
        "id": "frequency_always_constant",
        "text": "Frequency signatures always use O(1) time and space, regardless of the value domain.",
        "isCorrect": false
      },
      {
        "id": "sorted_always_no_space",
        "text": "Sorted keys always use O(1) space because sorting can always mutate the original collection.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Canonical contents are stored in newly allocated object keys.",
      "mentalModelCorrection": "Canonicalization of contents does not change the equality semantics of the key type used by the Map.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Confirm whether the map compares keys structurally or by object identity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_is_random": "This alternative misses a stated part of the contract: Numeric sorting produces a random order for equal values.",
        "map_ignores_arrays": "This alternative misses a stated part of the contract: Map cannot use arrays as keys under any circumstances.",
        "duplicates_change_reference": "This alternative misses a stated part of the contract: Only collections containing duplicates receive different references."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-013-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "In JavaScript, a developer sorts each collection into a new array and uses that array directly as a Map key:\n\nconst key = [...values].sort((a, b) => a - b);\n\nif (!groups.has(key)) {\n  groups.set(key, []);\n}\n\nWhy can two equivalent collections still enter different groups?",
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
    "title": "Hash map versus sorting: grouping 013",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "answerFeedback": "The arrays have canonical contents but remain separate object references. A primitive value-based encoding, such as an unambiguous string, is needed unless the environment provides structural key equality.",
    "options": [
      {
        "id": "array_reference_identity",
        "text": "Map compares array objects by reference identity, so two separately created arrays are different keys even when their contents are equal.",
        "isCorrect": true
      },
      {
        "id": "sort_is_random",
        "text": "Numeric sorting produces a random order for equal values.",
        "isCorrect": false
      },
      {
        "id": "map_ignores_arrays",
        "text": "Map cannot use arrays as keys under any circumstances.",
        "isCorrect": false
      },
      {
        "id": "duplicates_change_reference",
        "text": "Only collections containing duplicates receive different references.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Canonicalization discards original order, but downstream behavior still requires it.",
      "mentalModelCorrection": "The key and the stored group serve different purposes: identity of the equivalence class versus preservation of its members.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Store canonical data in the key and presentation or source data in the group value.",
      "result": "diagnostic",
      "distractorExplanations": {
        "canonical_key_only": "This alternative misses a stated part of the contract: Only the sorted key, because it can always reconstruct every original ordering.",
        "group_count_only": "This alternative misses a stated part of the contract: Only the group size, because original values are irrelevant after hashing.",
        "last_item_only": "This alternative misses a stated part of the contract: Only the most recently encountered collection for that key."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-014-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "A sorted canonical key is used only to identify an equivalence class, but later code must display every collection in its original order. What should the Map store as its value?",
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
    "title": "Hash map versus sorting: grouping 014",
    "trackId": "algorithms",
    "type": "single_choice",
    "answerFeedback": "The canonical key determines group membership, while the Map value retains the original objects or collections. This preserves information intentionally removed from the key.",
    "options": [
      {
        "id": "original_items_bucket",
        "text": "A bucket containing the original collections associated with that canonical key.",
        "isCorrect": true
      },
      {
        "id": "canonical_key_only",
        "text": "Only the sorted key, because it can always reconstruct every original ordering.",
        "isCorrect": false
      },
      {
        "id": "group_count_only",
        "text": "Only the group size, because original values are irrelevant after hashing.",
        "isCorrect": false
      },
      {
        "id": "last_item_only",
        "text": "Only the most recently encountered collection for that key.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "All inputs share the same distinct-value Set, but one has different occurrence counts.",
      "mentalModelCorrection": "Sorted keys and correct frequency signatures both preserve multiplicity; plain membership signatures do not.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Use duplicate-heavy cases to verify that the key represents a multiset rather than a Set.",
      "result": "diagnostic",
      "distractorExplanations": {
        "all_together": "This alternative misses a stated part of the contract: All three belong together because they contain the same distinct values.",
        "all_separate": "This alternative misses a stated part of the contract: All three are separate because their original orders differ.",
        "a_c_together": "This alternative misses a stated part of the contract: A and C belong together because they have the same length and endpoints."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-015-check",
    "learningStage": "guided_application",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "The inputs are:\n\nA = [1, 1, 2, 3]\nB = [3, 1, 2, 1]\nC = [1, 2, 2, 3]\n\nThe equivalence contract is multiset equality. Which grouping is correct?",
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
    "title": "Hash map versus sorting: grouping 015",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "answerFeedback": "A and B both contain two 1s, one 2, and one 3. C contains one 1 and two 2s, so its multiplicity signature differs.",
    "options": [
      {
        "id": "a_b_together",
        "text": "A and B belong together; C belongs in a different group.",
        "isCorrect": true
      },
      {
        "id": "all_together",
        "text": "All three belong together because they contain the same distinct values.",
        "isCorrect": false
      },
      {
        "id": "all_separate",
        "text": "All three are separate because their original orders differ.",
        "isCorrect": false
      },
      {
        "id": "a_c_together",
        "text": "A and C belong together because they have the same length and endpoints.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "Multiple correct representations exist, but their costs and information requirements differ.",
      "mentalModelCorrection": "Canonicalization strategy is chosen from the equivalence relation and data model, not from a universal rule that hashing or sorting is always superior.",
      "mistakeTypes": [
        "wrong_approach",
        "data_structure_mismatch"
      ],
      "nextAction": "Verify correctness and encoding safety first, then compare construction time, retained key size, and implementation constraints.",
      "result": "diagnostic",
      "distractorExplanations": {
        "frequency_always_best": "This alternative misses a stated part of the contract: Always use a frequency signature because hashing is necessarily O(1) for every possible key domain.",
        "sorting_always_best": "This alternative misses a stated part of the contract: Always sort because a sorted representation preserves original order and requires no auxiliary memory.",
        "map_makes_choice_irrelevant": "This alternative misses a stated part of the contract: The representation does not matter because the outer Map automatically canonicalizes all keys."
      }
    },
    "id": "alg-contrast-hash-map-vs-sorting-grouping-016-check",
    "learningStage": "independent_attempt",
    "primarySkillAtomId": "recognize_sorting_tradeoff",
    "prompt": "Which statement gives the most accurate basis for choosing between a frequency signature and a sorted canonical key?",
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
    "title": "Hash map versus sorting: grouping 016",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "answerFeedback": "Both representations can be correct, but under different assumptions. Frequency signatures are attractive for bounded or efficiently countable domains; sorted keys are more general but usually require comparison sorting, copying, and sequence encoding.",
    "options": [
      {
        "id": "evaluate_domain_and_contract",
        "text": "Choose based on the equivalence contract, value domain, multiplicity requirements, comparator cost, key size, mutation constraints, and whether the encoding is deterministic and unambiguous.",
        "isCorrect": true
      },
      {
        "id": "frequency_always_best",
        "text": "Always use a frequency signature because hashing is necessarily O(1) for every possible key domain.",
        "isCorrect": false
      },
      {
        "id": "sorting_always_best",
        "text": "Always sort because a sorted representation preserves original order and requires no auxiliary memory.",
        "isCorrect": false
      },
      {
        "id": "map_makes_choice_irrelevant",
        "text": "The representation does not matter because the outer Map automatically canonicalizes all keys.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
