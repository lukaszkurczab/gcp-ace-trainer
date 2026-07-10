export const setAlgebraAndDistinctRelationsQuestions = [
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_set_intersection_contract",
    secondarySkillAtomIds: [
      "distinguish_set_operations",
      "produce_distinct_set_result",
    ],
    type: "single_choice",
    prompt:
      "A result should contain each distinct value that appears in both collection A and collection B. Which set relation matches this contract?",
    options: [
      {
        id: "intersection",
        text: "The intersection A ∩ B.",
        isCorrect: true,
      },
      {
        id: "union",
        text: "The union A ∪ B.",
        isCorrect: false,
      },
      {
        id: "difference",
        text: "The difference A \\ B.",
        isCorrect: false,
      },
      {
        id: "disjointness",
        text: "A boolean test that A and B are disjoint.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A value belongs in the result only when it is a member of both input sets.",
      mentalModelCorrection:
        "Intersection keeps shared distinct members; it does not keep every member or return only a boolean relation.",
      mistakeTypes: ["set_intersection_contract_mismatch"],
      nextAction:
        'Translate the phrase "present in both" directly into intersection.',
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-002",
    learningStage: "foundations",
    primarySkillAtomId: "trace_set_union",
    secondarySkillAtomIds: [
      "combine_distinct_members",
      "reason_about_duplicate_elimination",
    ],
    type: "edge_case_drill",
    prompt: `What is the set union of:

A = [1, 2, 2, 4]
B = [2, 3, 4, 4]`,
    options: [
      {
        id: "one_two_three_four",
        text: "{1, 2, 3, 4}",
        isCorrect: true,
      },
      {
        id: "two_four",
        text: "{2, 4}",
        isCorrect: false,
      },
      {
        id: "one_three",
        text: "{1, 3}",
        isCorrect: false,
      },
      {
        id: "all_occurrences",
        text: "[1, 2, 2, 4, 2, 3, 4, 4]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Union includes members appearing in either input and represents each value once.",
      mentalModelCorrection:
        "Set union combines distinct membership; duplicate occurrences do not create additional result members.",
      mistakeTypes: ["set_union_trace_mismatch"],
      nextAction:
        "Insert every input value into one distinct-membership state.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-003",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_directional_set_difference",
    secondarySkillAtomIds: [
      "distinguish_a_minus_b_from_b_minus_a",
      "select_set_relation",
    ],
    type: "single_choice",
    prompt:
      "The result must contain values present in A but absent from B. Which operation is required?",
    options: [
      {
        id: "a_minus_b",
        text: "A \\ B",
        isCorrect: true,
      },
      {
        id: "b_minus_a",
        text: "B \\ A",
        isCorrect: false,
      },
      {
        id: "intersection",
        text: "A ∩ B",
        isCorrect: false,
      },
      {
        id: "union",
        text: "A ∪ B",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Membership in A is required, while membership in B excludes the value.",
      mentalModelCorrection:
        "Set difference is directional. Reversing the operands generally changes the result.",
      mistakeTypes: ["set_difference_direction_reversed"],
      nextAction:
        'Read A \\ B as "start with A and remove members found in B."',
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-004",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_subset_contract",
    secondarySkillAtomIds: [
      "test_all_membership_requirements",
      "distinguish_subset_from_overlap",
    ],
    type: "single_choice",
    prompt: "Which condition precisely means that A is a subset of B?",
    options: [
      {
        id: "every_a_in_b",
        text: "Every distinct member of A is also a member of B.",
        isCorrect: true,
      },
      {
        id: "some_shared_member",
        text: "At least one member of A also appears in B.",
        isCorrect: false,
      },
      {
        id: "same_size",
        text: "A and B contain the same number of distinct members.",
        isCorrect: false,
      },
      {
        id: "every_b_in_a",
        text: "Every member of B is also a member of A.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Subset is a universal membership condition over the members of A.",
      mentalModelCorrection:
        "Any overlap is weaker than subset. Every member of the candidate subset must be covered.",
      mistakeTypes: ["subset_confused_with_nonempty_intersection"],
      nextAction:
        "Test each member of A against B and reject on the first missing value.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-005",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_disjointness_contract",
    secondarySkillAtomIds: [
      "detect_empty_intersection",
      "distinguish_disjointness_from_difference",
    ],
    type: "single_choice",
    prompt: "Two sets are disjoint when which statement is true?",
    options: [
      {
        id: "no_shared_members",
        text: "They have no member in common.",
        isCorrect: true,
      },
      {
        id: "different_sizes",
        text: "They contain different numbers of members.",
        isCorrect: false,
      },
      {
        id: "not_equal",
        text: "They are not exactly equal.",
        isCorrect: false,
      },
      {
        id: "one_not_subset",
        text: "Neither set is a subset of the other.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Disjointness is equivalent to the intersection being empty.",
      mentalModelCorrection:
        "Unequal sets may still overlap, and equal empty sets are disjoint despite being equal.",
      mistakeTypes: ["disjointness_definition_mismatch"],
      nextAction: "Ask whether any value belongs to both sets.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-006",
    learningStage: "foundations",
    primarySkillAtomId: "produce_distinct_intersection",
    secondarySkillAtomIds: [
      "remove_duplicate_result_members",
      "trace_set_intersection",
    ],
    type: "edge_case_drill",
    prompt: `The contract is a distinct set intersection.

A = [2, 2, 2, 5]
B = [2, 2, 7]

What should the result contain?`,
    options: [
      {
        id: "one_two",
        text: "{2}",
        isCorrect: true,
      },
      {
        id: "two_twice",
        text: "[2, 2]",
        isCorrect: false,
      },
      {
        id: "two_three_times",
        text: "[2, 2, 2]",
        isCorrect: false,
      },
      {
        id: "two_five_seven",
        text: "{2, 5, 7}",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The value 2 belongs to both sets, but a set result contains it only once.",
      mentalModelCorrection:
        "Set intersection tracks shared membership, not the number of matching duplicate occurrences.",
      mistakeTypes: ["distinct_intersection_returns_duplicates"],
      nextAction:
        'Separate the question "is shared?" from "how many shared copies?"',
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-007",
    learningStage: "foundations",
    primarySkillAtomId: "trace_set_difference",
    secondarySkillAtomIds: [
      "apply_directional_membership_filter",
      "produce_distinct_set_result",
    ],
    type: "edge_case_drill",
    prompt: `What is A \\ B under set semantics?

A = [1, 1, 2, 3, 5]
B = [2, 4, 5]`,
    options: [
      {
        id: "one_three",
        text: "{1, 3}",
        isCorrect: true,
      },
      {
        id: "two_five",
        text: "{2, 5}",
        isCorrect: false,
      },
      {
        id: "four",
        text: "{4}",
        isCorrect: false,
      },
      {
        id: "one_one_three",
        text: "[1, 1, 3]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Values 2 and 5 are excluded because they occur in B; duplicate 1s collapse to one set member.",
      mentalModelCorrection:
        "Set difference removes shared values completely and returns distinct remaining membership.",
      mistakeTypes: ["set_difference_trace_mismatch"],
      nextAction:
        "For each distinct member of A, retain it only when B lacks it.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-set-algebra-distinct-relations-008",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_set_from_multiset_subset",
    secondarySkillAtomIds: [
      "interpret_duplicate_multiplicity",
      "select_relation_semantics",
    ],
    type: "solution_comparison",
    prompt: `Compare:

A = [4, 4]
B = [4]

Which statement is correct?`,
    options: [
      {
        id: "set_yes_multiset_no",
        text: "A is a subset of B under set semantics, but not under multiset semantics.",
        isCorrect: true,
      },
      {
        id: "neither",
        text: "A is not a subset of B under either interpretation.",
        isCorrect: false,
      },
      {
        id: "both",
        text: "A is a subset of B under both interpretations because 4 appears in B.",
        isCorrect: false,
      },
      {
        id: "set_no_multiset_yes",
        text: "A is not a set subset but is a multiset subset.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Set semantics ignore repeated occurrences, while multiset containment requires enough copies of each value.",
      mentalModelCorrection:
        "The word subset is ambiguous when inputs contain duplicates unless set or multiset semantics are stated.",
      mistakeTypes: ["set_and_multiset_subset_conflated"],
      nextAction:
        "Determine whether the contract compares membership or occurrence counts.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-set-algebra-distinct-relations-009",
    learningStage: "foundations",
    primarySkillAtomId: "compute_multiset_intersection_counts",
    secondarySkillAtomIds: [
      "use_minimum_occurrence_count",
      "distinguish_multiset_from_set_intersection",
    ],
    type: "edge_case_drill",
    prompt: `The contract is multiset intersection rather than distinct set intersection.

A = [2, 2, 2, 5]
B = [2, 2, 7]

What result should be produced?`,
    options: [
      {
        id: "two_twice",
        text: "[2, 2], because the shared multiplicity is min(3, 2).",
        isCorrect: true,
      },
      {
        id: "one_two",
        text: "[2], because intersections always contain distinct values only.",
        isCorrect: false,
      },
      {
        id: "two_three_times",
        text: "[2, 2, 2], because A contains three occurrences.",
        isCorrect: false,
      },
      {
        id: "all_values",
        text: "[2, 2, 2, 5, 7]",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "A shared occurrence needs one available copy in each input.",
      mentalModelCorrection:
        "Multiset intersection retains each value the minimum number of times it occurs in the two inputs.",
      mistakeTypes: ["multiset_intersection_count_mismatch"],
      nextAction:
        "For each value, compare its two frequencies and keep the smaller count.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-set-algebra-distinct-relations-010",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_duplicate_intersection_output",
    secondarySkillAtomIds: [
      "enforce_distinct_result_contract",
      "review_set_intersection_code",
    ],
    type: "mistake_review",
    prompt: `The required result is a distinct intersection:

const membersOfB = new Set(b);
const result: number[] = [];

for (const value of a) {
  if (membersOfB.has(value)) {
    result.push(value);
  }
}

What is missing?`,
    options: [
      {
        id: "deduplicate_output",
        text: "Repeated occurrences in a can be pushed repeatedly, so the implementation needs distinct-result state or must iterate distinct values.",
        isCorrect: true,
      },
      {
        id: "convert_b_to_array",
        text: "membersOfB must be converted back into an array before membership checks.",
        isCorrect: false,
      },
      {
        id: "push_nonmembers",
        text: "The condition should push values absent from B.",
        isCorrect: false,
      },
      {
        id: "sort_required",
        text: "The only missing operation is sorting, even though no output-order contract was specified.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Membership in B is checked per occurrence of A, while the output contract allows one result per distinct value.",
      mentalModelCorrection:
        "A Set on one input does not automatically make an array result distinct.",
      mistakeTypes: ["intersection_output_not_deduplicated"],
      nextAction: "Track emitted values or iterate a Set constructed from A.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-set-algebra-distinct-relations-011",
    learningStage: "foundations",
    primarySkillAtomId: "distinguish_difference_from_symmetric_difference",
    secondarySkillAtomIds: [
      "recognize_one_sided_difference",
      "recognize_exclusive_membership",
    ],
    type: "solution_comparison",
    prompt:
      "A result must contain distinct values that appear in exactly one of A or B, but not both. Which operation matches the contract?",
    options: [
      {
        id: "symmetric_difference",
        text: "The symmetric difference: (A \\ B) ∪ (B \\ A).",
        isCorrect: true,
      },
      {
        id: "a_minus_b_only",
        text: "Only A \\ B.",
        isCorrect: false,
      },
      {
        id: "intersection",
        text: "A ∩ B.",
        isCorrect: false,
      },
      {
        id: "ordinary_union",
        text: "A ∪ B without removing shared members.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Membership in either set is accepted only when membership in the other set is absent.",
      mentalModelCorrection:
        "One-sided difference omits exclusive members from the other operand; symmetric difference includes both directions.",
      mistakeTypes: ["exclusive_membership_relation_misclassified"],
      nextAction:
        "Split the contract into values unique to A and values unique to B, then combine them.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intro",
    id: "alg-set-algebra-distinct-relations-012",
    learningStage: "foundations",
    primarySkillAtomId: "reason_about_empty_set_relations",
    secondarySkillAtomIds: [
      "handle_subset_edge_cases",
      "handle_disjointness_edge_cases",
    ],
    type: "edge_case_drill",
    prompt:
      "Which statement about the empty set ∅ and an arbitrary set B is correct?",
    options: [
      {
        id: "empty_subset_and_disjoint",
        text: "∅ is a subset of B, and ∅ is disjoint from B.",
        isCorrect: true,
      },
      {
        id: "not_subset",
        text: "∅ is not a subset of B because it contains no matching values.",
        isCorrect: false,
      },
      {
        id: "not_disjoint",
        text: "∅ is not disjoint from B because it has no members to compare.",
        isCorrect: false,
      },
      {
        id: "only_if_b_empty",
        text: "Both relations hold only when B is also empty.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "There is no member of ∅ that violates subset membership and no member shared with B.",
      mentalModelCorrection:
        "Universal conditions over an empty candidate set hold vacuously, and its intersection with every set is empty.",
      mistakeTypes: ["empty_set_relation_mismatch"],
      nextAction:
        "Apply the formal membership conditions rather than looking for a witness element.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-set-algebra-distinct-relations-013",
    learningStage: "foundations",
    primarySkillAtomId: "diagnose_subset_length_shortcut",
    secondarySkillAtomIds: [
      "distinguish_size_check_from_membership_proof",
      "review_subset_logic",
    ],
    type: "mistake_review",
    prompt: `A candidate claims:

"A is a subset of B whenever A.size <= B.size."

What is the best correction?`,
    options: [
      {
        id: "size_only_necessary_not_sufficient",
        text: "The size comparison may reject some impossible cases, but every member of A must still be checked for membership in B.",
        isCorrect: true,
      },
      {
        id: "size_proves_subset",
        text: "The claim is correct because a smaller set always fits inside a larger one.",
        isCorrect: false,
      },
      {
        id: "sizes_must_be_equal",
        text: "Subset requires A.size === B.size.",
        isCorrect: false,
      },
      {
        id: "a_must_be_larger",
        text: "A can be a subset only when A.size >= B.size.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "Cardinality does not identify which values the sets contain.",
      mentalModelCorrection:
        "Subset is a membership relation; compatible sizes alone do not prove containment.",
      mistakeTypes: ["subset_inferred_from_size_only"],
      nextAction:
        "Use size only as an optional early rejection, then verify all members.",
      result: "diagnostic",
    },
  },
  {
    contentVersion: "algorithms-core",
    difficulty: "intermediate",
    id: "alg-set-algebra-distinct-relations-014",
    learningStage: "foundations",
    primarySkillAtomId: "select_set_relation_from_output_contract",
    secondarySkillAtomIds: [
      "distinguish_boolean_relation_from_materialized_result",
      "distinguish_set_from_multiset_semantics",
    ],
    type: "solution_comparison",
    prompt: `Match each requirement to its intended relation:

A. Return every distinct value shared by both inputs.
B. Return whether the inputs share no value.
C. Verify that every required distinct value appears in the available collection.
D. Return shared values as many times as copies are available in both inputs.

Which mapping is correct?`,
    options: [
      {
        id: "intersection_disjoint_subset_multiset",
        text: "A: set intersection; B: disjointness; C: subset; D: multiset intersection.",
        isCorrect: true,
      },
      {
        id: "union_subset_difference_set",
        text: "A: union; B: subset; C: difference; D: set intersection.",
        isCorrect: false,
      },
      {
        id: "difference_union_disjoint_subset",
        text: "A: difference; B: union; C: disjointness; D: subset.",
        isCorrect: false,
      },
      {
        id: "all_membership",
        text: "All four are the same membership operation because they can use a Set.",
        isCorrect: false,
      },
    ],
    feedbackModel: {
      decisionSignal:
        "The contracts differ by whether they materialize members, return a boolean relation, require universal containment, or preserve multiplicity.",
      mentalModelCorrection:
        "Using similar keyed state does not make intersection, subset, disjointness, and multiset matching semantically interchangeable.",
      mistakeTypes: ["set_relation_contracts_conflated"],
      nextAction:
        "Identify the output shape and whether duplicate counts are relevant before selecting the relation.",
      result: "diagnostic",
    },
  },
];
