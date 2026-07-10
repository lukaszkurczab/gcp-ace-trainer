export const recognizeTwoPointersVsSlidingWindowStrategySignalQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-001",
    learningStage: "foundations",
    primarySkillAtomId: "classify_two_pointers_vs_sliding_window",
    secondarySkillAtomIds: [
      "interpret_pointer_roles",
      "reject_variable_name_pattern_matching",
    ],
    type: "single_choice",
    prompt: `A loop contains variables named left and right.

What additional information is most important for deciding whether it is a sliding-window algorithm?`,
    options: [
      {
        id: "meaning_of_range_and_state",
        text: "Whether left and right bound one current contiguous range whose aggregate or validity state is maintained as the range changes.",
        isCorrect: true,
      },
      {
        id: "names_are_enough",
        text: "Nothing else; variables named left and right always indicate sliding window.",
        isCorrect: false,
      },
      {
        id: "both_are_numbers",
        text: "Whether both variables store numeric indexes rather than references.",
        isCorrect: false,
      },
      {
        id: "same_loop",
        text: "Whether both variables are updated inside the same loop body.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Pattern classification depends on what the pointers represent and what state the algorithm maintains.",
      mentalModelCorrection:
        "Names such as left and right are implementation details. Sliding window requires one meaningful contiguous range, not merely two indexes.",
      mistakeTypes: ["pointer_names_used_as_pattern_signal"],
      nextAction:
        "Describe the semantic role of each pointer before assigning a pattern name.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-002",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_opposite_ends_pair_signal",
    secondarySkillAtomIds: [
      "recognize_sorted_pair_elimination",
      "distinguish_pair_from_range",
    ],
    type: "strategy_choice",
    prompt:
      "A sorted array must be checked for two distinct values whose sum equals a target. Each comparison can eliminate one endpoint value from all remaining candidate pairs. Which strategy signal is present?",
    options: [
      {
        id: "opposite_end_two_pointers",
        text: "Opposite-direction two pointers evaluating one endpoint pair at a time.",
        isCorrect: true,
      },
      {
        id: "sliding_window",
        text: "A sliding window maintaining the sum of every value between the endpoints.",
        isCorrect: false,
      },
      {
        id: "read_write",
        text: "Read/write pointers compacting accepted values in place.",
        isCorrect: false,
      },
      {
        id: "fixed_window",
        text: "A fixed-size window whose width is determined by the target.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The current candidate consists of two values, and sorted order supports eliminating candidate pairs.",
      mentalModelCorrection:
        "The interior values are possible future candidates, not members of one maintained aggregate window.",
      mistakeTypes: ["pair_search_classified_as_window"],
      nextAction:
        "Ask whether the answer uses two selected positions or every element in the interval.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-003",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_fixed_window_signal",
    secondarySkillAtomIds: [
      "recognize_contiguous_range_optimization",
      "recognize_maintained_window_state",
    ],
    type: "strategy_choice",
    prompt:
      "A task asks for the largest total among all contiguous ranges containing exactly k elements. Which strategy best matches the problem structure?",
    options: [
      {
        id: "fixed_sliding_window",
        text: "A fixed-size sliding window maintaining the aggregate of the current contiguous range.",
        isCorrect: true,
      },
      {
        id: "endpoint_pair",
        text: "Opposite-end pointers comparing only the first and last value of each range.",
        isCorrect: false,
      },
      {
        id: "read_write",
        text: "Read/write pointers that overwrite rejected elements.",
        isCorrect: false,
      },
      {
        id: "independent_candidates",
        text: "Two independent candidate indexes selected according to endpoint values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Each candidate answer is one complete contiguous range, and adjacent candidates overlap heavily.",
      mentalModelCorrection:
        "Because every element in the range contributes to the result, the algorithm should maintain window state rather than evaluate only two endpoints.",
      mistakeTypes: ["contiguous_range_signal_missed"],
      nextAction:
        "Identify whether adjacent candidate ranges can reuse most of the same aggregate state.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-004",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_read_write_two_pointers",
    secondarySkillAtomIds: [
      "interpret_read_write_roles",
      "distinguish_compaction_from_window",
    ],
    type: "single_choice",
    prompt: `An in-place algorithm scans an array with read. When values[read] should be retained, it writes that value at values[write] and advances write.

How should this pattern be classified?`,
    options: [
      {
        id: "read_write_two_pointers",
        text: "A read/write two-pointer technique: one pointer scans input and the other marks the next output position.",
        isCorrect: true,
      },
      {
        id: "sliding_window",
        text: "A sliding window because the indexes define a range between write and read.",
        isCorrect: false,
      },
      {
        id: "opposite_ends",
        text: "Opposite-end pair elimination because two positions are being compared.",
        isCorrect: false,
      },
      {
        id: "fixed_window",
        text: "A fixed window whose size equals read - write + 1.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The pointers have different operational roles: scanning and writing.",
      mentalModelCorrection:
        "The indexes do not bound one candidate subarray whose aggregate is maintained. The distance between them is incidental.",
      mistakeTypes: ["read_write_pointers_called_window"],
      nextAction:
        "Name each pointer's job rather than interpreting the interval between them as a window.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-005",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_mirrored_two_pointer_signal",
    secondarySkillAtomIds: [
      "recognize_symmetry_comparison",
      "distinguish_mirrored_pair_from_window",
    ],
    type: "strategy_choice",
    prompt:
      "A string must be checked by comparing its first character with its last, its second with its second-last, and so on. Which strategy signal is strongest?",
    options: [
      {
        id: "mirrored_two_pointers",
        text: "Opposite-direction two pointers comparing required mirrored pairs.",
        isCorrect: true,
      },
      {
        id: "sliding_window",
        text: "A variable-size sliding window maintaining all characters between the boundaries.",
        isCorrect: false,
      },
      {
        id: "read_write",
        text: "Read/write pointers building a compacted version of the string.",
        isCorrect: false,
      },
      {
        id: "fixed_window",
        text: "A fixed-size window because two characters are examined at each step.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The property is defined by relationships between mirrored endpoint positions.",
      mentalModelCorrection:
        "The interior is not summarized as one changing aggregate. Each step verifies one pair of positions.",
      mistakeTypes: ["symmetry_check_classified_as_window"],
      nextAction:
        "Determine whether the property concerns endpoint relationships or the contents of a whole contiguous range.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-006",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_variable_window_signal",
    secondarySkillAtomIds: [
      "recognize_contiguous_subarray_constraint",
      "recognize_window_frequency_state",
    ],
    type: "strategy_choice",
    prompt:
      "A task asks for the longest contiguous substring containing at most two distinct character types. The current substring must be tracked as its boundaries move. Which strategy fits?",
    options: [
      {
        id: "variable_sliding_window",
        text: "A variable-size sliding window maintaining state for the current contiguous substring.",
        isCorrect: true,
      },
      {
        id: "opposite_pair",
        text: "Opposite-end pointers comparing only the two boundary characters.",
        isCorrect: false,
      },
      {
        id: "read_write",
        text: "Read/write pointers that overwrite characters outside the allowed set.",
        isCorrect: false,
      },
      {
        id: "independent_candidates",
        text: "Two independent indexes selecting the two character types.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The candidate answer is a contiguous substring whose internal composition determines whether it is valid.",
      mentalModelCorrection:
        "The algorithm needs state describing the entire current range, not merely its endpoint values.",
      mistakeTypes: ["window_signal_missed_for_contiguous_constraint"],
      nextAction:
        "Look for a contiguous-range objective combined with state that changes when elements enter or leave.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-recognize-two-pointers-vs-window-007",
    learningStage: "foundations",
    primarySkillAtomId: "reject_unjustified_opposite_end_search",
    secondarySkillAtomIds: [
      "require_pair_elimination_rule",
      "recognize_unsorted_pair_problem",
    ],
    type: "mistake_review",
    prompt: `A candidate searches an unsorted array for two values summing to a target. They place one pointer at each end and move one inward according to whether the endpoint sum is too low or too high.

What is the central problem?`,
    options: [
      {
        id: "no_ordered_elimination",
        text: "Without an ordering relationship, moving an index inward does not reliably make its value larger or smaller, so the endpoint elimination rule is unsupported.",
        isCorrect: true,
      },
      {
        id: "must_be_window",
        text: "Any unsorted array requires treating the entire interval as a sliding window.",
        isCorrect: false,
      },
      {
        id: "two_pointers_need_contiguous_answer",
        text: "Two pointers can only be used when the requested answer is a contiguous subarray.",
        isCorrect: false,
      },
      {
        id: "endpoint_sum_is_aggregate",
        text: "The algorithm is correct because the two endpoint values form the aggregate state of the active window.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The proposed movement assumes a predictable value change when an index moves.",
      mentalModelCorrection:
        "Opposite-end convergence is useful only when a comparison proves that discarded candidates cannot be valid.",
      mistakeTypes: ["opposite_ends_without_elimination_rule"],
      nextAction:
        "State the ordering or monotonic relationship that justifies each endpoint elimination.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-008",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_endpoint_pair_from_window",
    secondarySkillAtomIds: [
      "interpret_current_candidate",
      "recognize_pair_elimination",
    ],
    type: "mistake_review",
    prompt: `A reviewer describes a sorted pair-sum scan as follows:

"The active sliding window is everything between left and right, and the algorithm checks whether that window reaches the target."

What is the best correction?`,
    options: [
      {
        id: "endpoint_pair_only",
        text: "The current candidate is values[left] and values[right]. The interior contains remaining possible partners but is not one summed or validated window.",
        isCorrect: true,
      },
      {
        id: "review_is_correct",
        text: "The description is correct because every pair of indexes defines a sliding window.",
        isCorrect: false,
      },
      {
        id: "only_interior_matters",
        text: "The endpoint values are excluded; only the values strictly between them form the candidate.",
        isCorrect: false,
      },
      {
        id: "window_without_state",
        text: "It is a sliding window even though no property of the complete interval is maintained.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The comparison reads two endpoint values rather than an aggregate of the full interval.",
      mentalModelCorrection:
        "A remaining search region is not automatically an active window. Sliding-window state must describe the represented contiguous range.",
      mistakeTypes: ["remaining_search_region_called_window"],
      nextAction:
        "List which elements directly contribute to the current comparison.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-009",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_maintained_window_state",
    secondarySkillAtomIds: [
      "interpret_window_boundaries",
      "distinguish_range_state_from_endpoint_pair",
    ],
    type: "single_choice",
    prompt: `An algorithm maintains:

- left and right boundaries,
- a sum representing every element from left through right,
- and a best result based on that contiguous range.

Which classification is most accurate?`,
    options: [
      {
        id: "sliding_window",
        text: "Sliding window, because the boundaries represent one current contiguous range and the algorithm maintains state for that range.",
        isCorrect: true,
      },
      {
        id: "endpoint_pair",
        text: "Independent endpoint candidates, because only left and right determine the pattern.",
        isCorrect: false,
      },
      {
        id: "read_write",
        text: "Read/write pointers, because right reads new values while left identifies output positions.",
        isCorrect: false,
      },
      {
        id: "generic_loop",
        text: "It cannot be classified without knowing the variable names used for the sum.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The stored sum corresponds to all elements inside one contiguous range.",
      mentalModelCorrection:
        "Maintained range state is the defining sliding-window signal; the pointer names are secondary.",
      mistakeTypes: ["maintained_window_state_not_recognized"],
      nextAction:
        "Check whether the auxiliary state can be described as the state of exactly the current interval.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-010",
    learningStage: "foundations",
    primarySkillAtomId: "choose_pair_or_window_strategy",
    secondarySkillAtomIds: [
      "distinguish_selected_elements_from_range",
      "recognize_contiguous_answer_contract",
    ],
    type: "solution_comparison",
    prompt: `Compare two objectives:

A. Find two values that satisfy a relationship.
B. Find one contiguous range whose combined contents satisfy a relationship.

Which classification is generally the better starting point?`,
    options: [
      {
        id: "pair_vs_window",
        text: "A suggests candidate-position two pointers or another pair-search method; B suggests a sliding window when the range state can be maintained incrementally.",
        isCorrect: true,
      },
      {
        id: "both_windows",
        text: "Both suggest sliding window because every pair of indexes encloses a contiguous range.",
        isCorrect: false,
      },
      {
        id: "both_opposite_ends",
        text: "Both suggest opposite-end pointers because every range has two endpoints.",
        isCorrect: false,
      },
      {
        id: "names_decide",
        text: "The correct classification depends mainly on whether the implementation uses left and right as variable names.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The distinction is between selecting positions and evaluating all contents of one contiguous range.",
      mentalModelCorrection:
        "Endpoints alone do not make a range the semantic candidate. The problem's answer contract determines the useful abstraction.",
      mistakeTypes: ["pair_and_range_objectives_conflated"],
      nextAction:
        "Rewrite the candidate answer as either selected indexes or an inclusive contiguous interval.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-011",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_fast_slow_two_pointers",
    secondarySkillAtomIds: [
      "interpret_pointer_speed_roles",
      "distinguish_structural_two_pointers_from_window",
    ],
    type: "single_choice",
    prompt:
      "A linked-list algorithm advances one pointer by one node and another by two nodes to detect whether they meet. How should it be classified?",
    options: [
      {
        id: "fast_slow_two_pointers",
        text: "A fast/slow two-pointer technique; the pointers have different movement rates and do not bound a contiguous window.",
        isCorrect: true,
      },
      {
        id: "variable_window",
        text: "A variable sliding window because the distance between the pointers changes.",
        isCorrect: false,
      },
      {
        id: "fixed_window",
        text: "A fixed sliding window because both pointers move through the same structure.",
        isCorrect: false,
      },
      {
        id: "endpoint_pair",
        text: "An opposite-end pair search because the pointers are candidate values.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The pointers represent traversal roles and movement rates, not boundaries of one maintained range.",
      mentalModelCorrection:
        "A changing distance between pointers does not by itself create a sliding window.",
      mistakeTypes: ["fast_slow_pointers_called_window"],
      nextAction:
        "Check whether the interval between pointers has any semantic state used by the algorithm.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-contrast-recognize-two-pointers-vs-window-012",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_contiguous_range_optimization_signal",
    secondarySkillAtomIds: [
      "recognize_window_state_requirement",
      "reject_endpoint_only_reasoning",
    ],
    type: "strategy_choice",
    prompt:
      "A task asks for the longest contiguous sequence whose total cost stays within a budget. The total depends on every item currently included. Which high-level signal should guide the strategy choice?",
    options: [
      {
        id: "maintained_contiguous_range",
        text: "Maintain one contiguous range and its current total as the boundaries move: a sliding-window signal.",
        isCorrect: true,
      },
      {
        id: "compare_endpoints",
        text: "Compare only the two endpoint costs as independent candidates.",
        isCorrect: false,
      },
      {
        id: "palindrome_signal",
        text: "Use mirrored comparisons because the answer has two boundaries.",
        isCorrect: false,
      },
      {
        id: "read_write_signal",
        text: "Use one pointer to read costs and another to overwrite rejected costs.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The answer is a contiguous range, and its validity depends on a combined property of all included elements.",
      mentalModelCorrection:
        "When the interior contributes to validity, endpoint-only comparisons cannot represent the current candidate.",
      mistakeTypes: ["contiguous_aggregate_signal_ignored"],
      nextAction:
        "Identify the aggregate that must correspond to the complete candidate range.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-recognize-two-pointers-vs-window-013",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_pair_elimination_signal",
    secondarySkillAtomIds: [
      "require_ordered_candidate_relationship",
      "distinguish_elimination_from_window_validity",
    ],
    type: "single_choice",
    prompt:
      "Which observation most strongly supports an opposite-end two-pointer strategy for a pair problem?",
    options: [
      {
        id: "comparison_eliminates_endpoint",
        text: "The data has an ordering relationship that lets one comparison prove that one endpoint cannot participate in any valid remaining pair.",
        isCorrect: true,
      },
      {
        id: "two_variables_possible",
        text: "The implementation can store two variables called left and right.",
        isCorrect: false,
      },
      {
        id: "answer_has_two_values",
        text: "The answer contains two values, even though no comparison can eliminate other pairs.",
        isCorrect: false,
      },
      {
        id: "range_shrinks",
        text: "Moving either pointer makes the interval smaller, regardless of which candidates are discarded.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A useful pointer movement must eliminate a class of candidate pairs without losing a possible answer.",
      mentalModelCorrection:
        "Convergence alone is not the strategy signal. The key is a valid elimination rule derived from problem structure.",
      mistakeTypes: ["pair_elimination_signal_not_required"],
      nextAction:
        "Explain what becomes impossible after each possible comparison outcome.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-contrast-recognize-two-pointers-vs-window-014",
    learningStage: "foundations",
    primarySkillAtomId: "understand_sliding_window_taxonomy",
    secondarySkillAtomIds: [
      "classify_two_boundary_algorithms",
      "reject_overbroad_window_classification",
    ],
    type: "mistake_review",
    prompt: `A learner states:

"Sliding window and two pointers are identical. Any algorithm that moves two indexes through an input belongs to both categories."

Which correction is most precise?`,
    options: [
      {
        id: "window_is_semantic_specialization",
        text: "Sliding window commonly uses two boundaries, but specifically represents one current contiguous range with maintained state. Other two-pointer techniques may represent a pair, read/write roles, mirrored positions, or different traversal speeds.",
        isCorrect: true,
      },
      {
        id: "fully_identical",
        text: "The statement is correct because implementation syntax is the only meaningful basis for classifying patterns.",
        isCorrect: false,
      },
      {
        id: "fully_unrelated",
        text: "Sliding window never uses two pointers and should be treated as completely unrelated.",
        isCorrect: false,
      },
      {
        id: "window_requires_left_right_names",
        text: "They differ only because sliding-window variables must be named left and right.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Several algorithms use two moving positions but assign fundamentally different meanings to them.",
      mentalModelCorrection:
        "Sliding window is defined by the represented contiguous range and its maintained state, not by the raw number of indexes.",
      mistakeTypes: ["all_two_pointer_algorithms_called_window"],
      nextAction:
        "Classify an algorithm from its state invariant and pointer roles rather than its surface syntax.",
      result: "diagnostic",
    },
  },
];
