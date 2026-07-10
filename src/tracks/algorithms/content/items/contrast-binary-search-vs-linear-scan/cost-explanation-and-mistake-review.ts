export const costExplanationAndMistakeReviewQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n)",
    complexityExplanation:
      "In the worst case, the scan inspects all n values one at a time and stores only a fixed amount of loop state.",
    feedbackModel: {
      decisionSignal:
        "An unsorted array contains n values. A correct lookup checks values from left to right until it finds the target or reaches the end. What worst-case time and extra space should you expect?",
      mentalModelCorrection:
        "Checking one additional array position per step gives linear worst-case time; a fixed index and comparison state use constant extra space.",
      mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
      nextAction:
        "When reviewing a scan, count how many input positions may be inspected in the worst case and separate that count from stored state.",
      result: "diagnostic",
    },
    id: "alg-contrast-binary-linear-cost-001",
    learningStage: "contrast_practice",
    primarySkillAtomId: "derive_time_complexity",
    prompt:
      "An unsorted array contains n values. A correct lookup checks values from left to right until it finds the target or reaches the end. What worst-case time and extra space should you expect?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: {
          time: "O(n)",
          space: "O(1)",
        },
        feedback:
          "The scan may inspect all n values, while its loop state remains constant in size.",
        id: "alg-contrast-binary-linear-cost-001-check",
        mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
        prompt: "Choose the worst-case time and extra-space cost.",
        status: "active",
        testedSkillAtomIds: ["derive_time_complexity"],
        type: "complexity_pair",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "arrays_and_strings",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
        role: "primary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "operations_cost",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "complexity_mismatch",
        role: "mistake_type",
      },
    ],
    title: "Cost one full linear scan",
    trackId: "algorithms",
    type: "complexity_check",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A reviewer says a target scan is O(n) because its loop variable is named i. Which explanation identifies the actual source of the growth rate?",
      mentalModelCorrection:
        "Big-O follows the amount of work as input grows. A worst-case scan is linear because it may inspect every one of the n positions.",
      mistakeTypes: ["cannot_explain_why", "complexity_misread"],
      nextAction:
        "Replace name-based explanations with an explicit statement about how many input positions the algorithm may visit.",
      result: "diagnostic",
      distractorExplanations: {
        variable_name:
          "The identifier i is conventional but has no effect on how many iterations execute.",
        equality_operator:
          "Using an equality comparison does not determine the number of values that must be checked.",
        numeric_target:
          "A numeric target does not reduce the work when the input has no order that supports elimination.",
      },
    },
    id: "alg-contrast-binary-linear-cost-002",
    learningStage: "contrast_practice",
    primarySkillAtomId: "derive_time_complexity",
    secondarySkillAtomIds: ["identify_repeated_work"],
    prompt:
      "A reviewer says a target scan is O(n) because its loop variable is named i. Which explanation identifies the actual source of the growth rate?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "inspect_all_positions",
        feedback:
          "Linear time comes from potentially inspecting all n positions, not from syntax or variable names.",
        id: "alg-contrast-binary-linear-cost-002-check",
        mistakeTypes: ["cannot_explain_why", "complexity_misread"],
        options: [
          {
            id: "inspect_all_positions",
            text: "In the worst case, the scan visits each of the n positions once.",
          },
          {
            id: "variable_name",
            text: "The loop is O(n) because the index variable is named i.",
          },
          {
            id: "equality_operator",
            text: "The loop is O(n) because it uses === inside the condition.",
          },
          {
            id: "numeric_target",
            text: "The loop is O(n) because the target happens to be a number.",
          },
        ],
        prompt: "Choose the valid cost explanation.",
        status: "active",
        testedSkillAtomIds: [
          "derive_time_complexity",
          "identify_repeated_work",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "identify_repeated_work",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "operations_cost",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "cannot_explain_why",
        role: "mistake_type",
      },
    ],
    title: "Explain why scanning is linear",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(log n)",
    complexityExplanation:
      "Each comparison removes about half of the remaining sorted index range, so only logarithmically many comparisons are needed; three index variables use constant extra space.",
    feedbackModel: {
      decisionSignal:
        "A sorted indexed array contains n values. A correct binary search compares the middle value and discards the half that cannot contain the target. What time and extra space should you expect?",
      mentalModelCorrection:
        "The logarithmic cost comes from repeatedly halving a legally ordered candidate range, not merely from reading a middle element.",
      mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
      nextAction:
        "For every O(log n) claim, name both the shrinking factor and the property that makes the discarded region impossible.",
      result: "diagnostic",
    },
    id: "alg-contrast-binary-linear-cost-003",
    learningStage: "contrast_practice",
    primarySkillAtomId: "derive_time_complexity",
    secondarySkillAtomIds: ["recognize_binary_search_signal"],
    prompt:
      "A sorted indexed array contains n values. A correct binary search compares the middle value and discards the half that cannot contain the target. What time and extra space should you expect?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: {
          time: "O(log n)",
          space: "O(1)",
        },
        feedback:
          "Legal halving gives O(log n) time, and fixed boundary state gives O(1) extra space.",
        id: "alg-contrast-binary-linear-cost-003-check",
        mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
        prompt: "Choose the expected time and extra-space cost.",
        status: "active",
        testedSkillAtomIds: [
          "derive_time_complexity",
          "recognize_binary_search_signal",
        ],
        type: "complexity_pair",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_binary_search_signal",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "classic_index_search",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "complexity_mismatch",
        role: "mistake_type",
      },
    ],
    title: "Cost legal binary search",
    trackId: "algorithms",
    type: "complexity_check",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "A function uses variables named left, right, and mid on an unsorted array, then discards one side after each comparison. Its author calls it a correct O(log n) search. What is the strongest review?",
      mentalModelCorrection:
        "Names and shrinking indexes do not prove binary search is valid. A half may be discarded only when sorted order or a monotonic predicate proves that half impossible.",
      mistakeTypes: [
        "cannot_explain_why",
        "precondition_missed",
        "complexity_misread",
      ],
      nextAction:
        "Before accepting a logarithmic-search claim, require an explicit ordered or monotonic half-discard argument.",
      result: "diagnostic",
      distractorExplanations: {
        names_prove_logarithmic:
          "Conventional boundary names describe code shape, not the legality or correctness of discarding data.",
        shrinking_is_enough:
          "A range can shrink quickly while removing the target; progress alone does not establish a valid search rule.",
        numeric_target_is_enough:
          "The target's numeric type does not impose order on the array or monotonicity on the decision rule.",
      },
    },
    id: "alg-contrast-binary-linear-cost-004",
    learningStage: "contrast_practice",
    primarySkillAtomId: "recognize_binary_search_signal",
    secondarySkillAtomIds: ["derive_time_complexity"],
    prompt:
      "A function uses variables named left, right, and mid on an unsorted array, then discards one side after each comparison. Its author calls it a correct O(log n) search. What is the strongest review?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "require_discard_proof",
        feedback:
          "A logarithmic search needs a correct rule that proves one ordered region cannot contain the answer.",
        id: "alg-contrast-binary-linear-cost-004-check",
        mistakeTypes: [
          "cannot_explain_why",
          "precondition_missed",
          "complexity_misread",
        ],
        options: [
          {
            id: "require_discard_proof",
            text: "Reject the claim until sorted order or a monotonic predicate justifies every discarded half.",
          },
          {
            id: "names_prove_logarithmic",
            text: "Accept it because left, right, and mid are the standard binary-search variable names.",
          },
          {
            id: "shrinking_is_enough",
            text: "Accept it because any loop that shrinks an interval is both correct and O(log n).",
          },
          {
            id: "numeric_target_is_enough",
            text: "Accept it because comparing numeric targets always creates a searchable order.",
          },
        ],
        prompt: "Choose the correct code-review conclusion.",
        status: "active",
        testedSkillAtomIds: [
          "recognize_binary_search_signal",
          "derive_time_complexity",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_binary_search_signal",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "classic_index_search",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "precondition_missed",
        role: "mistake_type",
      },
    ],
    title: "Diagnose a name-based logarithmic claim",
    trackId: "algorithms",
    type: "common_mistake_diagnosis",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "You must answer one membership query on an unsorted array, and preprocessing is not allowed. Compare a full linear scan with a middle-based routine that discards one side without any ordering proof.",
      mentalModelCorrection:
        "A slower correct method beats a faster-looking invalid method. The middle-based routine is not a valid O(log n) solution when no half-discard rule exists.",
      mistakeTypes: ["wrong_approach", "precondition_missed"],
      nextAction:
        "Eliminate approaches that cannot prove correctness before comparing their asymptotic costs.",
      result: "diagnostic",
      distractorExplanations: {
        claimed_binary:
          "The routine may perform few comparisons, but it can discard the side containing the target because the array is unsorted.",
        choose_by_label:
          "The word binary does not establish either correctness or logarithmic behavior for this input.",
      },
    },
    id: "alg-contrast-binary-linear-cost-005",
    learningStage: "contrast_practice",
    primarySkillAtomId: "recognize_binary_search_signal",
    secondarySkillAtomIds: ["compare_complexity_tradeoffs"],
    prompt:
      "You must answer one membership query on an unsorted array, and preprocessing is not allowed. Which comparison is correct?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "linear_correct",
        feedback:
          "The linear scan is correct in O(n); the middle-based routine has no legal discard rule and is not a valid competitor.",
        id: "alg-contrast-binary-linear-cost-005-check",
        mistakeTypes: ["wrong_approach", "precondition_missed"],
        options: [
          {
            id: "linear_correct",
            text: "Choose the O(n) linear scan because it checks every still-possible position and is correct on unsorted input.",
          },
          {
            id: "claimed_binary",
            text: "Choose the claimed O(log n) routine because fewer comparisons matter more than whether a discarded side can contain the target.",
          },
          {
            id: "choose_by_label",
            text: "Choose whichever implementation is named binarySearch because the name determines the strategy and cost.",
          },
        ],
        prompt: "Choose the defensible solution comparison.",
        status: "active",
        testedSkillAtomIds: [
          "recognize_binary_search_signal",
          "compare_complexity_tradeoffs",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "arrays_and_strings",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_binary_search_signal",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "compare_complexity_tradeoffs",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "classic_index_search",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "wrong_approach",
        role: "mistake_type",
      },
    ],
    title: "Reject a faster-looking invalid search",
    trackId: "algorithms",
    type: "solution_comparison",
    responseSpec: {
      comparisonCriteria: [
        "correctness precondition",
        "half-discard proof",
        "worst-case cost",
      ],
      kind: "solution_comparison",
      solutions: [
        {
          id: "linear_correct",
          text: "Choose the O(n) linear scan because it checks every still-possible position and is correct on unsorted input.",
        },
        {
          id: "claimed_binary",
          text: "Choose the claimed O(log n) routine because fewer comparisons matter more than whether a discarded side can contain the target.",
        },
        {
          id: "choose_by_label",
          text: "Choose whichever implementation is named binarySearch because the name determines the strategy and cost.",
        },
      ],
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "A task asks for the earliest original index whose value satisfies an arbitrary condition. The input is unsorted, and original order is part of the result. Which cost review is accurate?",
      mentalModelCorrection:
        "Linear scan is not automatically inferior. Here it preserves the required order and directly proves the earliest match; sorting would change the evidence the output depends on.",
      mistakeTypes: ["wrong_approach", "order_constraint_missed"],
      nextAction:
        "Before ranking asymptotic costs, check whether preprocessing changes the order or output contract the task requires.",
      result: "diagnostic",
      distractorExplanations: {
        sort_then_binary:
          "Sorting may enable binary lookup, but it destroys the original-index order needed to identify the earliest matching position.",
        numeric_index:
          "Indexes being numeric does not make the arbitrary condition monotonic across positions.",
        linear_always_bad:
          "An O(n) method can be the correct and appropriate method when every earlier position must be ruled out.",
      },
    },
    id: "alg-contrast-binary-linear-cost-006",
    learningStage: "contrast_practice",
    primarySkillAtomId: "diagnose_order_destroying_transform",
    secondarySkillAtomIds: ["compare_complexity_tradeoffs"],
    prompt:
      "A task asks for the earliest original index whose value satisfies an arbitrary condition. The input is unsorted, and original order is part of the result. Which cost review is accurate?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "linear_preserves_contract",
        feedback:
          "A left-to-right scan correctly preserves original order and may need O(n) checks to prove the earliest match.",
        id: "alg-contrast-binary-linear-cost-006-check",
        mistakeTypes: ["wrong_approach", "order_constraint_missed"],
        options: [
          {
            id: "linear_preserves_contract",
            text: "Use a linear scan: O(n) is appropriate because earlier original positions must be checked and order cannot be changed.",
          },
          {
            id: "sort_then_binary",
            text: "Sort first and use binary search because O(log n) lookup is always better, even if the original index changes.",
          },
          {
            id: "numeric_index",
            text: "Binary-search the indexes because indexes are numeric, regardless of how the condition behaves.",
          },
          {
            id: "linear_always_bad",
            text: "Reject the linear scan solely because any O(n) method is unacceptable when binary search exists.",
          },
        ],
        prompt:
          "Choose the review that respects both cost and output contract.",
        status: "active",
        testedSkillAtomIds: [
          "diagnose_order_destroying_transform",
          "compare_complexity_tradeoffs",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "arrays_and_strings",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "diagnose_order_destroying_transform",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "compare_complexity_tradeoffs",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "indexed_scan",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "order_constraint_missed",
        role: "mistake_type",
      },
    ],
    title: "Recognize when linear scan is appropriate",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    complexityVariables: {
      n: "number of values in the array",
      q: "number of membership queries",
    },
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "An unsorted array of n values will answer q membership queries. Original order is irrelevant, and the sorted result can be reused. Which total-cost comparison is correct?",
      mentalModelCorrection:
        "Repeated scans cost O(qn). Sorting once and reusing that work costs O(n log n + q log n), because preprocessing and query phases are sequential and each query halves the sorted range.",
      mistakeTypes: ["complexity_mismatch", "reuse_contract_misread"],
      nextAction:
        "Write preprocessing cost once, then add q times the per-query cost; do not erase or multiply sequential phases.",
      result: "diagnostic",
      distractorExplanations: {
        sorting_is_free:
          "The q binary searches cost O(q log n), but producing the sorted array still costs O(n log n).",
        multiply_phases:
          "Sorting and querying happen sequentially, so their costs are added rather than multiplied into O(qn log n).",
        binary_unsorted:
          "Without sorting or another ordered structure, binary search cannot legally discard half of the original unsorted array.",
      },
    },
    id: "alg-contrast-binary-linear-cost-007",
    learningStage: "contrast_practice",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    secondarySkillAtomIds: [
      "compare_complexity_tradeoffs",
      "recognize_binary_search_signal",
    ],
    prompt:
      "An unsorted array of n values will answer q membership queries. Original order is irrelevant, and the sorted result can be reused. Which total-cost comparison is correct?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "correct_totals",
        feedback:
          "Repeated scans cost O(qn), while reusable sorting plus binary searches costs O(n log n + q log n).",
        id: "alg-contrast-binary-linear-cost-007-check",
        mistakeTypes: ["complexity_mismatch", "reuse_contract_misread"],
        options: [
          {
            id: "correct_totals",
            text: "Repeated scans: O(qn). Sort once plus q binary searches: O(n log n + q log n).",
          },
          {
            id: "sorting_is_free",
            text: "Repeated scans: O(qn). Sort once plus q binary searches: O(q log n), because one-time sorting is free.",
          },
          {
            id: "multiply_phases",
            text: "Repeated scans: O(qn). Sort once plus q binary searches: O(qn log n), because sorting and queries must be multiplied.",
          },
          {
            id: "binary_unsorted",
            text: "Repeated scans: O(qn). Binary-search the unsorted array q times in O(q log n) without preprocessing.",
          },
        ],
        prompt: "Choose the correct total-cost comparison.",
        status: "active",
        testedSkillAtomIds: [
          "combine_preprocessing_and_query_costs",
          "compare_complexity_tradeoffs",
          "recognize_binary_search_signal",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "combine_preprocessing_and_query_costs",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "compare_complexity_tradeoffs",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_binary_search_signal",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "preprocessing_and_queries",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "reuse_contract_misread",
        role: "mistake_type",
      },
    ],
    title: "Compare repeated-query totals",
    trackId: "algorithms",
    type: "solution_comparison",
    responseSpec: {
      comparisonCriteria: [
        "preprocessing cost",
        "per-query cost",
        "reuse across queries",
      ],
      kind: "solution_comparison",
      solutions: [
        {
          id: "correct_totals",
          text: "Repeated scans: O(qn). Sort once plus q binary searches: O(n log n + q log n).",
        },
        {
          id: "sorting_is_free",
          text: "Repeated scans: O(qn). Sort once plus q binary searches: O(q log n), because one-time sorting is free.",
        },
        {
          id: "multiply_phases",
          text: "Repeated scans: O(qn). Sort once plus q binary searches: O(qn log n), because sorting and queries must be multiplied.",
        },
        {
          id: "binary_unsorted",
          text: "Repeated scans: O(qn). Binary-search the unsorted array q times in O(q log n) without preprocessing.",
        },
      ],
    },
  },
  {
    contentVersion: "algorithms-core",
    complexityVariables: {
      n: "number of values sorted once",
      q: "number of later membership queries",
    },
    difficulty: "easy",
    feedbackModel: {
      decisionSignal:
        "An engineer sorts n values once, then answers q membership queries with binary search. The review states the entire plan is O(q log n). What cost was omitted?",
      mentalModelCorrection:
        "Sorting is preprocessing work, not free setup. The complete total is O(n log n + q log n).",
      mistakeTypes: ["complexity_mismatch", "reuse_contract_misread"],
      nextAction:
        "List every sequential phase before simplifying: build or preprocess once, then multiply only the per-query work by q.",
      result: "diagnostic",
      distractorExplanations: {
        sorting_constant:
          "A comparison sort over n values is not O(1); its cost grows as O(n log n).",
        multiply_sequential:
          "The sort finishes before the queries begin, so sequential costs are added instead of multiplied.",
        no_order_needed:
          "The sorted structure is exactly what makes the later half-discard rule legal for ordinary value lookup.",
      },
    },
    id: "alg-contrast-binary-linear-cost-008",
    learningStage: "contrast_practice",
    primarySkillAtomId: "combine_preprocessing_and_query_costs",
    secondarySkillAtomIds: ["recognize_sorting_tradeoff"],
    prompt:
      "An engineer sorts n values once, then answers q membership queries with binary search. The review states the entire plan is O(q log n). What cost was omitted?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "include_sorting",
        feedback:
          "The omitted O(n log n) sorting phase makes the total O(n log n + q log n).",
        id: "alg-contrast-binary-linear-cost-008-check",
        mistakeTypes: ["complexity_mismatch", "reuse_contract_misread"],
        options: [
          {
            id: "include_sorting",
            text: "Include the one-time O(n log n) sort, giving O(n log n + q log n) total time.",
          },
          {
            id: "sorting_constant",
            text: "No cost was omitted because sorting once is O(1) regardless of n.",
          },
          {
            id: "multiply_sequential",
            text: "Replace the total with O(qn log n) because every query multiplies the completed sort.",
          },
          {
            id: "no_order_needed",
            text: "Remove the sort entirely and keep O(q log n), because binary search does not need ordered data.",
          },
        ],
        prompt: "Choose the correct review correction.",
        status: "active",
        testedSkillAtomIds: [
          "combine_preprocessing_and_query_costs",
          "recognize_sorting_tradeoff",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "sorting_based",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "combine_preprocessing_and_query_costs",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_sorting_tradeoff",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "preprocessing_and_queries",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "complexity_mismatch",
        role: "mistake_type",
      },
    ],
    title: "Account for one-time sorting",
    trackId: "algorithms",
    type: "common_mistake_diagnosis",
  },
  {
    contentVersion: "algorithms-core",
    complexityVariables: {
      n: "number of input items inspected by one feasibility check",
      V: "number of candidate values in the searched answer range",
    },
    difficulty: "medium",
    expectedSpaceComplexity: "O(1)",
    expectedTimeComplexity: "O(n log V)",
    complexityExplanation:
      "Binary search performs O(log V) candidate checks, and each check scans n input items in O(n), so the total is O(n log V). The check and search keep only fixed scalar state.",
    feedbackModel: {
      decisionSignal:
        "A monotonic answer-space search considers V candidate values. Testing one candidate scans all n input items in O(n). What total time and extra space should you expect?",
      mentalModelCorrection:
        "Binary search reduces the number of candidate checks to O(log V), but it does not erase the O(n) work inside each feasibility check.",
      mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
      nextAction:
        "For search-on-answer cost, multiply the number of candidate checks by the work performed inside one check.",
      result: "diagnostic",
    },
    id: "alg-contrast-binary-linear-cost-009",
    learningStage: "contrast_practice",
    primarySkillAtomId: "identify_hidden_operation_cost",
    secondarySkillAtomIds: [
      "binary_search_answer_feasibility_predicate",
      "derive_time_complexity",
    ],
    prompt:
      "A monotonic answer-space search considers V candidate values. Testing one candidate scans all n input items in O(n). What total time and extra space should you expect?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: {
          time: "O(n log V)",
          space: "O(1)",
        },
        feedback:
          "There are O(log V) candidate checks, each costing O(n), for O(n log V) total time.",
        id: "alg-contrast-binary-linear-cost-009-check",
        mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
        prompt: "Choose the total time and extra-space cost.",
        status: "active",
        testedSkillAtomIds: [
          "identify_hidden_operation_cost",
          "binary_search_answer_feasibility_predicate",
          "derive_time_complexity",
        ],
        type: "complexity_pair",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "identify_hidden_operation_cost",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "binary_search_answer_feasibility_predicate",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "binary_search_on_answer",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "complexity_mismatch",
        role: "mistake_type",
      },
    ],
    title: "Include feasibility-check cost",
    trackId: "algorithms",
    type: "complexity_check",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "For increasing numeric candidates x, a predicate returns true, false, true, false. A developer proposes binary search because x is numeric. What is wrong with the reasoning?",
      mentalModelCorrection:
        "Numeric candidates do not guarantee a searchable boundary. Binary search needs a monotonic true/false transition so one side can be discarded safely.",
      mistakeTypes: ["monotonic_assumption_invalid", "wrong_approach"],
      nextAction:
        "Write the predicate outcomes in candidate order and verify that they change direction at most once before choosing binary search.",
      result: "diagnostic",
      distractorExplanations: {
        numeric_implies_order:
          "The candidate values are ordered numerically, but the predicate outcomes are not monotonic across that order.",
        boolean_implies_boundary:
          "Returning booleans is insufficient; the sequence of booleans must form a single searchable transition.",
        fewer_checks_wins:
          "Performing fewer checks is useful only when those checks preserve correctness and cannot skip a valid answer.",
      },
    },
    id: "alg-contrast-binary-linear-cost-010",
    learningStage: "contrast_practice",
    primarySkillAtomId: "binary_search_answer_feasibility_predicate",
    secondarySkillAtomIds: ["recognize_binary_search_signal"],
    prompt:
      "For increasing numeric candidates x, a predicate returns true, false, true, false. A developer proposes binary search because x is numeric. What is wrong with the reasoning?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "predicate_not_monotonic",
        feedback:
          "The alternating outcomes provide no single boundary, so a half cannot be discarded safely.",
        id: "alg-contrast-binary-linear-cost-010-check",
        mistakeTypes: ["monotonic_assumption_invalid", "wrong_approach"],
        options: [
          {
            id: "predicate_not_monotonic",
            text: "The predicate is non-monotonic, so numeric order does not justify discarding either half.",
          },
          {
            id: "numeric_implies_order",
            text: "The reasoning is valid because every numeric domain automatically supports binary search.",
          },
          {
            id: "boolean_implies_boundary",
            text: "The reasoning is valid because any boolean predicate has a first-true or last-true boundary.",
          },
          {
            id: "fewer_checks_wins",
            text: "The reasoning is valid because an approach that checks fewer candidates is preferable even when it can skip answers.",
          },
        ],
        prompt: "Choose the precise diagnosis.",
        status: "active",
        testedSkillAtomIds: [
          "binary_search_answer_feasibility_predicate",
          "recognize_binary_search_signal",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "binary_search_answer_feasibility_predicate",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_binary_search_signal",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "monotonic_predicate_recognition",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "monotonic_assumption_invalid",
        role: "mistake_type",
      },
    ],
    title: "Reject numeric-only binary-search reasoning",
    trackId: "algorithms",
    type: "common_mistake_diagnosis",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "foundational",
    feedbackModel: {
      decisionSignal:
        "Two functions are both named searchTarget. One may inspect all n items; the other legally halves a sorted candidate range. Which statement about their Big-O is correct?",
      mentalModelCorrection:
        "Keywords and function names do not determine complexity. The scan is O(n) because it may visit every item; the halving search is O(log n) because each legal step removes about half the candidates.",
      mistakeTypes: ["complexity_misread", "cannot_explain_why"],
      nextAction:
        "Describe the repeated operation and how the remaining work shrinks instead of inferring cost from names or problem wording.",
      result: "diagnostic",
      distractorExplanations: {
        both_log_search_word:
          "The word search describes the goal, not the number of operations performed as n grows.",
        both_linear_array:
          "Using an array does not force a full traversal when sorted order supports legal halving.",
        target_value_controls:
          "Big-O is measured against input dimensions and performed work, not the magnitude of the target value by itself.",
      },
    },
    id: "alg-contrast-binary-linear-cost-011",
    learningStage: "contrast_practice",
    primarySkillAtomId: "derive_time_complexity",
    secondarySkillAtomIds: ["recognize_binary_search_signal"],
    prompt:
      "Two functions are both named searchTarget. One may inspect all n items; the other legally halves a sorted candidate range. Which statement about their Big-O is correct?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "work_pattern_controls",
        feedback:
          "The scan is O(n), while legal repeated halving is O(log n); the shared name is irrelevant.",
        id: "alg-contrast-binary-linear-cost-011-check",
        mistakeTypes: ["complexity_misread", "cannot_explain_why"],
        options: [
          {
            id: "work_pattern_controls",
            text: "Complexity follows the work pattern: visiting up to n items is O(n), while legal halving is O(log n).",
          },
          {
            id: "both_log_search_word",
            text: "Both are O(log n) because their names contain the word search.",
          },
          {
            id: "both_linear_array",
            text: "Both are O(n) because both receive an array.",
          },
          {
            id: "target_value_controls",
            text: "Their complexity is determined by the numeric size of target rather than by n or the performed operations.",
          },
        ],
        prompt: "Choose the valid complexity statement.",
        status: "active",
        testedSkillAtomIds: [
          "derive_time_complexity",
          "recognize_binary_search_signal",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_binary_search_signal",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "operations_cost",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "complexity_misread",
        role: "mistake_type",
      },
    ],
    title: "Ignore search keywords when deriving cost",
    trackId: "algorithms",
    type: "single_choice",
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "medium",
    feedbackModel: {
      decisionSignal:
        "Solution A linearly checks an arbitrary boolean sequence and always finds an existing true value. Solution B probes logarithmically but assumes a false-false-true-true boundary that the input does not guarantee. Which comparison is sound?",
      mentalModelCorrection:
        "Asymptotic ranking starts after correctness and preconditions are established. An invalid logarithmic routine is not better than a correct linear scan.",
      mistakeTypes: [
        "wrong_approach",
        "monotonic_assumption_invalid",
        "cannot_explain_why",
      ],
      nextAction:
        "When comparing solutions, first state each correctness precondition; only then compare time and space among the approaches that remain valid.",
      result: "diagnostic",
      distractorExplanations: {
        logarithmic_always_wins:
          "Fewer probes do not compensate for discarding regions under a false monotonicity assumption.",
        call_it_log_anyway:
          "A loop can execute logarithmically and still be an incorrect solution; runtime alone does not validate the result.",
        linear_always_preferred:
          "Linear scan is appropriate in this scenario, but legal binary search remains preferable when the required ordered boundary actually exists.",
      },
    },
    id: "alg-contrast-binary-linear-cost-012",
    learningStage: "contrast_practice",
    primarySkillAtomId: "compare_complexity_tradeoffs",
    secondarySkillAtomIds: [
      "recognize_binary_search_signal",
      "binary_search_answer_feasibility_predicate",
    ],
    prompt:
      "Solution A linearly checks an arbitrary boolean sequence and always finds an existing true value. Solution B probes logarithmically but assumes a false-false-true-true boundary that the input does not guarantee. Which comparison is sound?",
    roadmapNodeId: "contrast_binary_search_vs_linear_scan",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "correctness_first",
        feedback:
          "Solution A is valid in O(n); Solution B cannot be ranked as a solution until monotonicity is guaranteed.",
        id: "alg-contrast-binary-linear-cost-012-check",
        mistakeTypes: [
          "wrong_approach",
          "monotonic_assumption_invalid",
          "cannot_explain_why",
        ],
        options: [
          {
            id: "correctness_first",
            text: "Choose A for this input; compare asymptotic costs only after B's monotonic-boundary precondition is satisfied.",
          },
          {
            id: "logarithmic_always_wins",
            text: "Choose B because O(log n) is always preferable to O(n), even when the assumed boundary may not exist.",
          },
          {
            id: "call_it_log_anyway",
            text: "Call B the better solution as long as its loop performs O(log n) probes, regardless of whether it can miss true values.",
          },
          {
            id: "linear_always_preferred",
            text: "Choose A because linear scan is always better than binary search, including on guaranteed monotonic input.",
          },
        ],
        prompt: "Choose the sound solution review.",
        status: "active",
        testedSkillAtomIds: [
          "compare_complexity_tradeoffs",
          "recognize_binary_search_signal",
          "binary_search_answer_feasibility_predicate",
        ],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "pattern_family",
        nodeId: "binary_search",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "compare_complexity_tradeoffs",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "recognize_binary_search_signal",
        role: "secondary",
      },
      {
        axisId: "skill_atom",
        nodeId: "binary_search_answer_feasibility_predicate",
        role: "secondary",
      },
      {
        axisId: "pattern_variant",
        nodeId: "monotonic_predicate_recognition",
        role: "secondary",
      },
      {
        axisId: "mistake_type",
        nodeId: "wrong_approach",
        role: "mistake_type",
      },
    ],
    title: "Rank correctness before asymptotic speed",
    trackId: "algorithms",
    type: "solution_comparison",
    responseSpec: {
      comparisonCriteria: [
        "correctness precondition",
        "monotonicity guarantee",
        "asymptotic cost",
      ],
      kind: "solution_comparison",
      solutions: [
        {
          id: "correctness_first",
          text: "Choose A for this input; compare asymptotic costs only after B's monotonic-boundary precondition is satisfied.",
        },
        {
          id: "logarithmic_always_wins",
          text: "Choose B because O(log n) is always preferable to O(n), even when the assumed boundary may not exist.",
        },
        {
          id: "call_it_log_anyway",
          text: "Call B the better solution as long as its loop performs O(log n) probes, regardless of whether it can miss true values.",
        },
        {
          id: "linear_always_preferred",
          text: "Choose A because linear scan is always better than binary search, including on guaranteed monotonic input.",
        },
      ],
    },
  },
];
