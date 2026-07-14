// Planning target: this file should contain questions about contrasting binary search and linear scan for sorted indexed lookup:
// finding whether a target exists; returning any matching index; sorted ascending precondition;
// linear scan being correct but slower; and binary search using sorted order to discard half.
// It should diagnose mistakes such as scanning linearly after noticing sorted order,
// claiming linear scan and binary search have the same growth,
// using binary search without checking that the array is sorted,
// or confusing "correct" with "asymptotically best".
// Target question count: 12.
// Prefer single_choice, solution_comparison, complexity_check, and small trace-style items.
// Avoid lower_bound/upper_bound duplicate-boundary tasks; those belong elsewhere.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const sortedLookupVsLinearScanQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A sorted array [3, 8, 12, 19, 27] is searched for 19. Which lookup strategy best uses the stated structure?",
      "mentalModelCorrection": "Sorted indexed values let each comparison discard all values on one side of the midpoint.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "Use sorted order as the reason for choosing binary search, not just as a descriptive detail.",
      "result": "diagnostic",
      "distractorExplanations": {
        "linear_default": "A scan is correct, but it ignores the sorted structure that can reduce the lookup growth.",
        "random_half": "Only the midpoint comparison combined with sorted order identifies an impossible side."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-001-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Choose binary search for sorted membership\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "monotonic_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Choose binary search for sorted membership",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A sorted array [3, 8, 12, 19, 27] is searched for 19. Which lookup strategy best uses the stated structure?",
    "answerFeedback": "Sorted indexed values let each comparison discard all values on one side of the midpoint.",
    "options": [
      {
        "id": "binary_sorted_lookup",
        "text": "Use binary search because sorted indexed order supports safe half-discarding.",
        "isCorrect": true
      },
      {
        "id": "linear_default",
        "text": "Use a left-to-right scan because scans work on every array.",
        "explanation": "A scan is correct, but it ignores the sorted structure that can reduce the lookup growth.",
        "isCorrect": false
      },
      {
        "id": "random_half",
        "text": "Inspect an arbitrary half because any half is equally informative.",
        "explanation": "Only the midpoint comparison combined with sorted order identifies an impossible side.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A sorted array does not contain target after the active interval is exhausted. What does this say about binary search versus a linear scan?",
      "mentalModelCorrection": "Binary search can correctly report absence after every candidate has been eliminated; not-found is part of the lookup contract.",
      "mistakeTypes": [
        "output_contract_misread"
      ],
      "nextAction": "Keep the absence result explicit rather than treating an exhausted interval as an algorithm failure.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_required_absence": "Sorted elimination can prove that no remaining index contains the target.",
        "last_mid_answer": "The output contract must represent absence rather than inventing a matching index."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-002-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "classic_binary_search_found_not_found_contract",
    "prompt": "For \"Treat not-found as a valid binary-search result\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "classic_binary_search_found_not_found_contract",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Treat not-found as a valid binary-search result",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "A sorted array does not contain target after the active interval is exhausted. What does this say about binary search versus a linear scan?",
    "answerFeedback": "Binary search can correctly report absence after every candidate has been eliminated; not-found is part of the lookup contract.",
    "options": [
      {
        "id": "not_found_valid",
        "text": "Binary search is correct when the interval is exhausted and the target is absent.",
        "isCorrect": true
      },
      {
        "id": "scan_required_absence",
        "text": "A linear scan is required because only a scan can prove absence.",
        "explanation": "Sorted elimination can prove that no remaining index contains the target.",
        "isCorrect": false
      },
      {
        "id": "last_mid_answer",
        "text": "Return the last midpoint because a lookup must always return an index.",
        "explanation": "The output contract must represent absence rather than inventing a matching index.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "A candidate writes binary search for [4, 1, 9, 3, 7] without checking the input contract. What review point matters first?",
      "mentalModelCorrection": "Classic binary search needs sorted ascending or descending order; an arbitrary permutation cannot justify a half discard.",
      "mistakeTypes": [
        "precondition_missed"
      ],
      "nextAction": "Check the ordering precondition before reviewing midpoint arithmetic or loop boundaries.",
      "result": "diagnostic",
      "distractorExplanations": {
        "midpoint_code": "Correct midpoint arithmetic cannot make an unsorted input searchable by halves.",
        "target_present": "Presence of a target does not identify which half contains it."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-004-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Verify sorted precondition\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "precondition_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Verify sorted precondition",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A candidate writes binary search for [4, 1, 9, 3, 7] without checking the input contract. What review point matters first?",
    "answerFeedback": "Classic binary search needs sorted ascending or descending order; an arbitrary permutation cannot justify a half discard.",
    "options": [
      {
        "id": "verify_sorted",
        "text": "Reject the direct binary-search assumption until the input is guaranteed to be sorted.",
        "isCorrect": true
      },
      {
        "id": "midpoint_code",
        "text": "Review midpoint arithmetic first; sortedness is an implementation detail.",
        "explanation": "Correct midpoint arithmetic cannot make an unsorted input searchable by halves.",
        "isCorrect": false
      },
      {
        "id": "target_present",
        "text": "Accept it if the target exists somewhere in the array.",
        "explanation": "Presence of a target does not identify which half contains it.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A sorted array contains duplicate target values, and the task asks for any index where target occurs. What is the relevant contrast?",
      "mentalModelCorrection": "Classic binary search may return any matching midpoint; locating the first or last duplicate is a different boundary contract.",
      "mistakeTypes": [
        "output_contract_misread"
      ],
      "nextAction": "Read whether the output asks for any match or a specific duplicate boundary before selecting the variant.",
      "result": "diagnostic",
      "distractorExplanations": {
        "linear_duplicates": "Duplicates do not invalidate finding any match in a sorted array.",
        "boundary_required": "Extra boundary work is not required by an any-match output contract."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-005-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Return any matching index\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "output_contract_misread",
        "role": "mistake_type"
      }
    ],
    "title": "Return any matching index",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A sorted array contains duplicate target values, and the task asks for any index where target occurs. What is the relevant contrast?",
    "answerFeedback": "Classic binary search may return any matching midpoint; locating the first or last duplicate is a different boundary contract.",
    "options": [
      {
        "id": "any_match_classic",
        "text": "Classic binary search is sufficient because any matching index satisfies the contract.",
        "isCorrect": true
      },
      {
        "id": "linear_duplicates",
        "text": "Use a scan because duplicates make binary search invalid.",
        "explanation": "Duplicates do not invalidate finding any match in a sorted array.",
        "isCorrect": false
      },
      {
        "id": "boundary_required",
        "text": "Always search for the first occurrence even when any index is accepted.",
        "explanation": "Extra boundary work is not required by an any-match output contract.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "In [1, 4, 7, 9, 13], mid points to 7 and target is 9. Which reasoning step is legal next?",
      "mentalModelCorrection": "Because the array is sorted and 7 is below 9, the indexes at and left of mid cannot contain 9.",
      "mistakeTypes": [
        "subgoal_order_wrong"
      ],
      "nextAction": "Connect the midpoint comparison to the exact impossible side before moving the boundary.",
      "result": "diagnostic",
      "distractorExplanations": {
        "discard_right": "Sorted ascending order places larger possible values to the right, not the left.",
        "scan_left": "Sorted order makes the left-side elimination safe in this case."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-006-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "classic_binary_search_discard_rule",
    "prompt": "For \"Trace a legal half discard\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "classic_binary_search_discard_rule",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "subgoal_order_wrong",
        "role": "mistake_type"
      }
    ],
    "title": "Trace a legal half discard",
    "trackId": "algorithms",
    "type": "edge_case_drill",
    "instruction": "In [1, 4, 7, 9, 13], mid points to 7 and target is 9. Which reasoning step is legal next?",
    "answerFeedback": "Because the array is sorted and 7 is below 9, the indexes at and left of mid cannot contain 9.",
    "options": [
      {
        "id": "discard_left",
        "text": "Discard mid and the left side; only the right side can contain 9.",
        "isCorrect": true
      },
      {
        "id": "discard_right",
        "text": "Discard the right side because mid is smaller than target.",
        "explanation": "Sorted ascending order places larger possible values to the right, not the left.",
        "isCorrect": false
      },
      {
        "id": "scan_left",
        "text": "Scan left linearly because a midpoint comparison is not enough.",
        "explanation": "Sorted order makes the left-side elimination safe in this case.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A learner scans every element of a sorted indexed array even though the constraints make a full scan expensive. What mistake should be diagnosed?",
      "mentalModelCorrection": "The scan remains correct, but it ignores the sorted half-discard signal that improves worst-case lookup time.",
      "mistakeTypes": [
        "monotonic_signal_missed"
      ],
      "nextAction": "When a scan is correct, still ask whether the input structure supports a more efficient legal strategy.",
      "result": "diagnostic",
      "distractorExplanations": {
        "scan_incorrect": "Scanning is correct; it is simply slower in the worst case.",
        "same_complexity": "Binary search can inspect logarithmically many positions when its precondition holds."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-007-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Diagnose scanning after seeing sorted order\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "monotonic_signal_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose scanning after seeing sorted order",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A learner scans every element of a sorted indexed array even though the constraints make a full scan expensive. What mistake should be diagnosed?",
    "answerFeedback": "The scan remains correct, but it ignores the sorted half-discard signal that improves worst-case lookup time.",
    "options": [
      {
        "id": "ignored_sorted_signal",
        "text": "They missed the opportunity to use sorted order for O(log n) lookup.",
        "isCorrect": true
      },
      {
        "id": "scan_incorrect",
        "text": "The scan is incorrect because sorted input cannot be scanned.",
        "explanation": "Scanning is correct; it is simply slower in the worst case.",
        "isCorrect": false
      },
      {
        "id": "same_complexity",
        "text": "There is no performance difference because both inspect an array.",
        "explanation": "Binary search can inspect logarithmically many positions when its precondition holds.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A sorted sequence is exposed only through an iterator that advances from the beginning. Why is the usual O(log n) indexed binary-search contrast not automatic?",
      "mentalModelCorrection": "The value order is useful, but reaching a midpoint may itself require linear traversal when random access is unavailable.",
      "mistakeTypes": [
        "data_structure_mismatch"
      ],
      "nextAction": "Include midpoint access cost when deciding whether sorted order gives the intended binary-search benefit.",
      "result": "diagnostic",
      "distractorExplanations": {
        "order_always_enough": "Without efficient midpoint access, the repeated traversal can erase the expected benefit.",
        "iterator_unsorted": "Access capability and value order are separate properties."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-009-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Require random access for logarithmic lookup\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "data_structure_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Require random access for logarithmic lookup",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "A sorted sequence is exposed only through an iterator that advances from the beginning. Why is the usual O(log n) indexed binary-search contrast not automatic?",
    "answerFeedback": "The value order is useful, but reaching a midpoint may itself require linear traversal when random access is unavailable.",
    "options": [
      {
        "id": "access_cost_matters",
        "text": "Check midpoint access; sorted values alone do not guarantee logarithmic indexed lookup.",
        "isCorrect": true
      },
      {
        "id": "order_always_enough",
        "text": "Use binary search automatically because the sequence is sorted.",
        "explanation": "Without efficient midpoint access, the repeated traversal can erase the expected benefit.",
        "isCorrect": false
      },
      {
        "id": "iterator_unsorted",
        "text": "Assume the iterator is unsorted because it cannot jump by index.",
        "explanation": "Access capability and value order are separate properties.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "Which statement is accurate for a target lookup in a sorted array?",
      "mentalModelCorrection": "A linear scan can be correct, while binary search is asymptotically preferable when sorted indexed order is guaranteed.",
      "mistakeTypes": [
        "concept_boundary_confused"
      ],
      "nextAction": "State both whether a strategy is correct and whether another legal strategy has better growth.",
      "result": "diagnostic",
      "distractorExplanations": {
        "only_binary_correct": "A scan still checks values directly and can return a correct result.",
        "same_growth": "One can inspect all n positions while the other legally halves the active interval."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-010-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Keep correctness separate from best growth\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "concept_boundary_confused",
        "role": "mistake_type"
      }
    ],
    "title": "Keep correctness separate from best growth",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "Which statement is accurate for a target lookup in a sorted array?",
    "answerFeedback": "A linear scan can be correct, while binary search is asymptotically preferable when sorted indexed order is guaranteed.",
    "options": [
      {
        "id": "both_correct_binary_faster",
        "text": "Both can be correct, but binary search has better worst-case growth on sorted indexed input.",
        "isCorrect": true
      },
      {
        "id": "only_binary_correct",
        "text": "Only binary search can return the correct target result.",
        "explanation": "A scan still checks values directly and can return a correct result.",
        "isCorrect": false
      },
      {
        "id": "same_growth",
        "text": "Both have the same worst-case growth because they inspect the same array.",
        "explanation": "One can inspect all n positions while the other legally halves the active interval.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An array was sorted earlier, then values were reordered in place before the lookup. Can the old sortedness assumption still justify binary search?",
      "mentalModelCorrection": "Binary search requires the current lookup view to preserve the sorted order; historical preprocessing does not repair a reordered array.",
      "mistakeTypes": [
        "precondition_missed"
      ],
      "nextAction": "Check the structure at the moment of lookup, not only how it was initialized.",
      "result": "diagnostic",
      "distractorExplanations": {
        "history_enough": "Reordering can place smaller and larger values on either side of mid.",
        "target_numeric": "Target type does not change the current array arrangement."
      }
    },
    "id": "alg-contrast-binary-linear-sorted-011-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Reject binary search after order is lost\", choose the correct lookup reasoning.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "classic_index_search",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "precondition_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Reject binary search after order is lost",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "An array was sorted earlier, then values were reordered in place before the lookup. Can the old sortedness assumption still justify binary search?",
    "answerFeedback": "Binary search requires the current lookup view to preserve the sorted order; historical preprocessing does not repair a reordered array.",
    "options": [
      {
        "id": "current_order_required",
        "text": "No; binary search is justified only if the current array remains sorted.",
        "isCorrect": true
      },
      {
        "id": "history_enough",
        "text": "Yes; it was sorted once, so its values remain searchable by halves.",
        "explanation": "Reordering can place smaller and larger values on either side of mid.",
        "isCorrect": false
      },
      {
        "id": "target_numeric",
        "text": "Yes; numeric targets restore the lost order automatically.",
        "explanation": "Target type does not change the current array arrangement.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
