// Planning target: this file should contain questions about preprocessing tradeoffs between linear scan and binary search:
// one query versus many queries; sorting before binary search; counting sort cost;
// order-sensitive tasks where sorting is not allowed; and when O(n log n + q log n) beats O(qn).
// It should diagnose mistakes such as treating sorting as free,
// sorting even when original order matters,
// saying binary search is always better than linear scan without considering query volume,
// or ignoring that preprocessing only pays off when reused.
// Target question count: 14.
// Prefer solution_comparison, complexity_check, single_choice, and mistake-review style items.
// Avoid generic sorting questions; every item must stay focused on the scan-vs-binary-search contrast.
import type { AlgorithmQuestion } from "../../../algorithmQuestionTypes";

export const preprocessingAndQueryVolumeQuestions = [
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "An unsorted array has n values and exactly one membership query. A candidate sorts first and then performs binary search. What comparison should reject that plan?",
      "mentalModelCorrection": "Sorting adds O(n log n) preprocessing for a single query, while a direct scan answers it in O(n) without that setup cost.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Count preprocessing and query work together instead of comparing only the final lookup step.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_free": "The total work includes sorting whenever the algorithm performs it.",
        "binary_always": "Binary search is only beneficial after its setup cost is justified by reuse or existing order."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-001-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Do not sort for one unsorted query\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Do not sort for one unsorted query",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "An unsorted array has n values and exactly one membership query. A candidate sorts first and then performs binary search. What comparison should reject that plan?",
    "answerFeedback": "Sorting adds O(n log n) preprocessing for a single query, while a direct scan answers it in O(n) without that setup cost.",
    "options": [
      {
        "id": "scan_one_query",
        "text": "Use a direct scan; sorting is not paid back by one query.",
        "isCorrect": true
      },
      {
        "id": "sort_free",
        "text": "Sort first because preprocessing does not count toward lookup complexity.",
        "explanation": "The total work includes sorting whenever the algorithm performs it.",
        "isCorrect": false
      },
      {
        "id": "binary_always",
        "text": "Sort first because binary search is always better than a scan.",
        "explanation": "Binary search is only beneficial after its setup cost is justified by reuse or existing order.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The same unsorted array of n values receives q = 100000 membership queries. Why can sorting once and using binary search be better than scanning for every query?",
      "mentalModelCorrection": "The one-time O(n log n) sort can be amortized across q lookups, replacing q full scans with q logarithmic lookups after preprocessing.",
      "mistakeTypes": [
        "constraint_reasoning_missed"
      ],
      "nextAction": "Compare total costs as sort plus q binary searches versus q linear scans.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_never_pays": "Repeated queries can make one-time preprocessing cheaper than repeating full scans.",
        "query_count_irrelevant": "The query count multiplies the per-query cost and is central to the tradeoff."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-002-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Amortize sorting across many queries\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_reasoning_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Amortize sorting across many queries",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "The same unsorted array of n values receives q = 100000 membership queries. Why can sorting once and using binary search be better than scanning for every query?",
    "answerFeedback": "The one-time O(n log n) sort can be amortized across q lookups, replacing q full scans with q logarithmic lookups after preprocessing.",
    "options": [
      {
        "id": "reuse_pays_sort",
        "text": "Many queries can amortize sorting: O(n log n + q log n) beats O(qn) at large q.",
        "isCorrect": true
      },
      {
        "id": "sort_never_pays",
        "text": "Sorting can never pay off because it always adds work.",
        "explanation": "Repeated queries can make one-time preprocessing cheaper than repeating full scans.",
        "isCorrect": false
      },
      {
        "id": "query_count_irrelevant",
        "text": "Query volume does not affect the choice between scan and binary search.",
        "explanation": "The query count multiplies the per-query cost and is central to the tradeoff.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task asks for the first occurrence in original input order, and sorting the values is forbidden by the contract. Why is sort-then-binary-search not a valid replacement?",
      "mentalModelCorrection": "Sorting changes the order that defines the requested result and violates the explicit constraint, even if membership would be preserved.",
      "mistakeTypes": [
        "order_constraint_missed"
      ],
      "nextAction": "Check whether the output depends on original order before proposing sorting as preprocessing.",
      "result": "diagnostic",
      "distractorExplanations": {
        "membership_preserved": "Preserving membership does not preserve the first original occurrence.",
        "binary_priority": "An optimization cannot override an output or input-order constraint."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-004-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Respect order-sensitive output\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "order_constraint_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Respect order-sensitive output",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "The task asks for the first occurrence in original input order, and sorting the values is forbidden by the contract. Why is sort-then-binary-search not a valid replacement?",
    "answerFeedback": "Sorting changes the order that defines the requested result and violates the explicit constraint, even if membership would be preserved.",
    "options": [
      {
        "id": "order_must_survive",
        "text": "Reject sorting because it destroys the order-sensitive contract and is explicitly disallowed.",
        "isCorrect": true
      },
      {
        "id": "membership_preserved",
        "text": "Sort anyway because sorting preserves which values exist.",
        "explanation": "Preserving membership does not preserve the first original occurrence.",
        "isCorrect": false
      },
      {
        "id": "binary_priority",
        "text": "Sort anyway because binary search has better asymptotic lookup time.",
        "explanation": "An optimization cannot override an output or input-order constraint.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "intro",
    "feedbackModel": {
      "decisionSignal": "An array is already sorted and receives one target lookup. What preprocessing decision is appropriate before binary search?",
      "mentalModelCorrection": "No sorting preprocessing is needed because the required order already exists; the lookup can begin directly.",
      "mistakeTypes": [
        "unnecessary_state"
      ],
      "nextAction": "Distinguish creating order from reusing an order guarantee already present in the input.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_again": "Re-sorting an input that already satisfies the order precondition adds unnecessary work.",
        "scan_once": "An explicit input contract can provide sortedness without a verification scan."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-006-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Use existing sorted order immediately\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_state",
        "role": "mistake_type"
      }
    ],
    "title": "Use existing sorted order immediately",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "An array is already sorted and receives one target lookup. What preprocessing decision is appropriate before binary search?",
    "answerFeedback": "No sorting preprocessing is needed because the required order already exists; the lookup can begin directly.",
    "options": [
      {
        "id": "no_sort_needed",
        "text": "Skip preprocessing and binary-search the already sorted array directly.",
        "isCorrect": true
      },
      {
        "id": "sort_again",
        "text": "Sort again to make binary search safe.",
        "explanation": "Re-sorting an input that already satisfies the order precondition adds unnecessary work.",
        "isCorrect": false
      },
      {
        "id": "scan_once",
        "text": "Scan first to verify sortedness before every lookup.",
        "explanation": "An explicit input contract can provide sortedness without a verification scan.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A service sorts a fresh unsorted batch before answering one query, then discards the batch. What tradeoff mistake is present?",
      "mentalModelCorrection": "Preprocessing is useful when its cost is reused; sorting a batch for one query can cost more than directly inspecting it.",
      "mistakeTypes": [
        "unnecessary_search_space"
      ],
      "nextAction": "Ask how many queries reuse the prepared data before accepting a sort-first plan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sort_always_better": "A faster query does not pay back preprocessing when it is used only once.",
        "batch_size_only": "Total cost depends on both preprocessing size and the number of queries served."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-007-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Reject preprocessing that is never reused\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "unnecessary_search_space",
        "role": "mistake_type"
      }
    ],
    "title": "Reject preprocessing that is never reused",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A service sorts a fresh unsorted batch before answering one query, then discards the batch. What tradeoff mistake is present?",
    "answerFeedback": "Preprocessing is useful when its cost is reused; sorting a batch for one query can cost more than directly inspecting it.",
    "options": [
      {
        "id": "no_reuse_no_payback",
        "text": "The sort has no reuse opportunity, so a direct scan may be the lower-cost plan.",
        "isCorrect": true
      },
      {
        "id": "sort_always_better",
        "text": "Sorting is always worthwhile because it creates a faster query.",
        "explanation": "A faster query does not pay back preprocessing when it is used only once.",
        "isCorrect": false
      },
      {
        "id": "batch_size_only",
        "text": "Only n matters; query reuse does not affect the tradeoff.",
        "explanation": "Total cost depends on both preprocessing size and the number of queries served.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "For one query on an unsorted array, which total-cost comparison is correct?",
      "mentalModelCorrection": "A direct scan costs O(n), while sorting first and then searching costs O(n log n + log n), dominated by preprocessing.",
      "mistakeTypes": [
        "constraint_reasoning_missed"
      ],
      "nextAction": "Substitute q = 1 into both total-cost expressions before choosing a preprocessing plan.",
      "result": "diagnostic",
      "distractorExplanations": {
        "binary_log_only": "The sorting work remains part of the total cost.",
        "equal_cost": "Sorting introduces an O(n log n) term even for one query."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-008-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Compare one query at small volume\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_reasoning_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Compare one query at small volume",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "For one query on an unsorted array, which total-cost comparison is correct?",
    "answerFeedback": "A direct scan costs O(n), while sorting first and then searching costs O(n log n + log n), dominated by preprocessing.",
    "options": [
      {
        "id": "scan_wins_one",
        "text": "The scan is O(n); sort plus one binary search is O(n log n + log n), so preprocessing is not justified.",
        "isCorrect": true
      },
      {
        "id": "binary_log_only",
        "text": "Sort plus binary search is O(log n) because the query itself is logarithmic.",
        "explanation": "The sorting work remains part of the total cost.",
        "isCorrect": false
      },
      {
        "id": "equal_cost",
        "text": "Both plans are O(n) because one query is small.",
        "explanation": "Sorting introduces an O(n log n) term even for one query.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "For q repeated queries over the same unsorted array, which total-cost statement captures when sorting can beat scanning?",
      "mentalModelCorrection": "Sorting can win when O(n log n + q log n) is smaller than O(qn), because the setup is paid once and lookup savings repeat.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Keep q symbolic long enough to see whether repeated query savings amortize preprocessing.",
      "result": "diagnostic",
      "distractorExplanations": {
        "sorting_free": "The sort is part of the total work and contributes O(n log n).",
        "scan_always": "The setup can be amortized when q repeated lookups avoid q full scans."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-009-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Explain the many-query crossover\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Explain the many-query crossover",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "For q repeated queries over the same unsorted array, which total-cost statement captures when sorting can beat scanning?",
    "answerFeedback": "Sorting can win when O(n log n + q log n) is smaller than O(qn), because the setup is paid once and lookup savings repeat.",
    "options": [
      {
        "id": "reuse_formula",
        "text": "Compare O(n log n + q log n) with O(qn); the first can win as q grows.",
        "isCorrect": true
      },
      {
        "id": "sorting_free",
        "text": "Sort once plus q binary searches costs O(q log n), because the one-time sort is free.",
        "explanation": "The sort is part of the total work and contributes O(n log n).",
        "isCorrect": false
      },
      {
        "id": "scan_always",
        "text": "Repeated scans always win because preprocessing adds a separate phase.",
        "explanation": "The setup can be amortized when q repeated lookups avoid q full scans.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "An array changes after every query, so a sorted copy would need to be rebuilt before the next query. Why does this weaken sort-then-binary-search?",
      "mentalModelCorrection": "Sorting is valuable when one prepared order serves many queries; rebuilding it after every mutation repeats the preprocessing cost.",
      "mistakeTypes": [
        "constraint_state_missing"
      ],
      "nextAction": "Check whether the prepared structure survives long enough to serve multiple lookups.",
      "result": "diagnostic",
      "distractorExplanations": {
        "binary_survives": "The repeated sorting cost can dominate every cheap lookup.",
        "one_sort_enough": "Mutations can invalidate the prepared order and its mapping to current data."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-010-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Do not ignore changing data\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_state_missing",
        "role": "mistake_type"
      }
    ],
    "title": "Do not ignore changing data",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "An array changes after every query, so a sorted copy would need to be rebuilt before the next query. Why does this weaken sort-then-binary-search?",
    "answerFeedback": "Sorting is valuable when one prepared order serves many queries; rebuilding it after every mutation repeats the preprocessing cost.",
    "options": [
      {
        "id": "preprocessing_not_reusable",
        "text": "Repeated rebuilding removes the amortization benefit and can make direct inspection preferable.",
        "isCorrect": true
      },
      {
        "id": "binary_survives",
        "text": "Binary search remains cheap, so rebuilding order does not matter.",
        "explanation": "The repeated sorting cost can dominate every cheap lookup.",
        "isCorrect": false
      },
      {
        "id": "one_sort_enough",
        "text": "Sort once because the original data values are conceptually the same.",
        "explanation": "Mutations can invalidate the prepared order and its mapping to current data.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "There are n values but the possible integer key range K is vastly larger than n. A candidate proposes counting-sort preprocessing before binary-search queries. What should be checked?",
      "mentalModelCorrection": "Counting sort pays O(n + K), so a huge sparse key range can make its preprocessing and storage cost impractical.",
      "mistakeTypes": [
        "complexity_mismatch"
      ],
      "nextAction": "Compare K with n before treating integer values as a free counting-sort opportunity.",
      "result": "diagnostic",
      "distractorExplanations": {
        "integer_free": "Integer keys are not enough when the key range is enormous.",
        "queries_hide_k": "Reuse can amortize time but cannot erase an infeasible range-sized representation."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-011-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "identify_hidden_operation_cost",
    "prompt": "For \"Reject counting sort for a huge sparse range\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "identify_hidden_operation_cost",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "complexity_mismatch",
        "role": "mistake_type"
      }
    ],
    "title": "Reject counting sort for a huge sparse range",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "There are n values but the possible integer key range K is vastly larger than n. A candidate proposes counting-sort preprocessing before binary-search queries. What should be checked?",
    "answerFeedback": "Counting sort pays O(n + K), so a huge sparse key range can make its preprocessing and storage cost impractical.",
    "options": [
      {
        "id": "range_can_dominate",
        "text": "Reject the assumption that counting sort is cheap; K may dominate both time and space.",
        "isCorrect": true
      },
      {
        "id": "integer_free",
        "text": "Use counting sort automatically because all keys are integers.",
        "explanation": "Integer keys are not enough when the key range is enormous.",
        "isCorrect": false
      },
      {
        "id": "queries_hide_k",
        "text": "Ignore K because many queries make any preprocessing worthwhile.",
        "explanation": "Reuse can amortize time but cannot erase an infeasible range-sized representation.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "easy",
    "feedbackModel": {
      "decisionSignal": "A plan sorts n unsorted values to answer q = 2 membership queries. Which reasoning is strongest?",
      "mentalModelCorrection": "With only two queries, the O(n log n) setup is often larger than two O(n) scans; query volume is too small to assume preprocessing pays off.",
      "mistakeTypes": [
        "constraint_reasoning_missed"
      ],
      "nextAction": "Use the actual query count instead of applying a many-query rule unconditionally.",
      "result": "diagnostic",
      "distractorExplanations": {
        "binary_always": "The crossover depends on n, q, and preprocessing cost, not merely q > 1.",
        "sort_never": "Larger repeated query volumes can justify preprocessing."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-012-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Compare a small query count\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "constraint_reasoning_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Compare a small query count",
    "trackId": "algorithms",
    "type": "solution_comparison",
    "instruction": "A plan sorts n unsorted values to answer q = 2 membership queries. Which reasoning is strongest?",
    "answerFeedback": "With only two queries, the O(n log n) setup is often larger than two O(n) scans; query volume is too small to assume preprocessing pays off.",
    "options": [
      {
        "id": "small_q_scan_candidate",
        "text": "Treat direct scans as the strong baseline; two queries may not amortize sorting.",
        "isCorrect": true
      },
      {
        "id": "binary_always",
        "text": "Sort because any q greater than one makes binary search preferable.",
        "explanation": "The crossover depends on n, q, and preprocessing cost, not merely q > 1.",
        "isCorrect": false
      },
      {
        "id": "sort_never",
        "text": "Reject sorting categorically because scans are always better.",
        "explanation": "Larger repeated query volumes can justify preprocessing.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "The task asks whether the earliest original index containing target is before a cutoff. Why can sorting values before binary search change the problem?",
      "mentalModelCorrection": "Sorting groups values by magnitude and destroys the original positional order that defines ‘earliest’.",
      "mistakeTypes": [
        "order_constraint_missed"
      ],
      "nextAction": "Identify whether the output is about value membership or the original sequence order before preprocessing.",
      "result": "diagnostic",
      "distractorExplanations": {
        "membership_same": "The earliest original index is not preserved by value order alone.",
        "binary_faster": "Performance does not override the output contract."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-013-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "recognize_binary_search_signal",
    "prompt": "For \"Keep original positions when order matters\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "recognize_binary_search_signal",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "order_constraint_missed",
        "role": "mistake_type"
      }
    ],
    "title": "Keep original positions when order matters",
    "trackId": "algorithms",
    "type": "single_choice",
    "instruction": "The task asks whether the earliest original index containing target is before a cutoff. Why can sorting values before binary search change the problem?",
    "answerFeedback": "Sorting groups values by magnitude and destroys the original positional order that defines ‘earliest’.",
    "options": [
      {
        "id": "position_semantics_change",
        "text": "Sorting changes positional semantics, so it cannot replace an order-sensitive scan without an approved structure.",
        "isCorrect": true
      },
      {
        "id": "membership_same",
        "text": "Sorting is safe because the same target values remain present.",
        "explanation": "The earliest original index is not preserved by value order alone.",
        "isCorrect": false
      },
      {
        "id": "binary_faster",
        "text": "Sorting is required because binary search must always be used for target lookup.",
        "explanation": "Performance does not override the output contract.",
        "isCorrect": false
      }
    ]
  },
  {
    "contentVersion": "algorithms-core",
    "difficulty": "medium",
    "feedbackModel": {
      "decisionSignal": "A review comment says ‘always sort and binary-search; O(log n) is always better than O(n)’. What is the central mistake?",
      "mentalModelCorrection": "The comparison ignores preprocessing cost, query volume, input-order constraints, and whether the sorted representation can be reused.",
      "mistakeTypes": [
        "wrong_approach"
      ],
      "nextAction": "Review total cost and output constraints before declaring binary search universally preferable.",
      "result": "diagnostic",
      "distractorExplanations": {
        "log_not_better": "Binary search can be better when its preconditions and preprocessing tradeoff fit.",
        "sort_free": "One-time work still contributes to total cost and may not be amortized."
      }
    },
    "id": "alg-contrast-binary-linear-preprocess-014-check",
    "learningStage": "contrast_practice",
    "primarySkillAtomId": "combine_preprocessing_and_query_costs",
    "prompt": "For \"Diagnose binary-search absolutism\", choose the preprocessing decision.",
    "roadmapNodeId": "contrast_binary_search_vs_linear_scan",
    "status": "active",
    "taxonomyRefs": [
      {
        "axisId": "pattern_family",
        "nodeId": "binary_search",
        "role": "primary"
      },
      {
        "axisId": "pattern_family",
        "nodeId": "complexity_and_constraints",
        "role": "secondary"
      },
      {
        "axisId": "skill_atom",
        "nodeId": "combine_preprocessing_and_query_costs",
        "role": "primary"
      },
      {
        "axisId": "pattern_variant",
        "nodeId": "preprocessing_and_queries",
        "role": "secondary"
      },
      {
        "axisId": "mistake_type",
        "nodeId": "wrong_approach",
        "role": "mistake_type"
      }
    ],
    "title": "Diagnose binary-search absolutism",
    "trackId": "algorithms",
    "type": "common_mistake_diagnosis",
    "instruction": "A review comment says ‘always sort and binary-search; O(log n) is always better than O(n)’. What is the central mistake?",
    "answerFeedback": "The comparison ignores preprocessing cost, query volume, input-order constraints, and whether the sorted representation can be reused.",
    "options": [
      {
        "id": "tradeoff_ignored",
        "text": "The reviewer ignores setup cost, reuse, query volume, and order-sensitive contracts.",
        "isCorrect": true
      },
      {
        "id": "log_not_better",
        "text": "The mistake is that O(log n) is never better than O(n).",
        "explanation": "Binary search can be better when its preconditions and preprocessing tradeoff fit.",
        "isCorrect": false
      },
      {
        "id": "sort_free",
        "text": "The comment is correct because sorting happens outside the query loop.",
        "explanation": "One-time work still contributes to total cost and may not be amortized.",
        "isCorrect": false
      }
    ]
  }
] as const satisfies readonly AlgorithmQuestion[];
