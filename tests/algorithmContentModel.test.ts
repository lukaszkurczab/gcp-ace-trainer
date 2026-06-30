import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHM_APPROACH_TEMPLATES,
  ALGORITHM_CONTENT_VERSION,
  ALGORITHM_EVIDENCE_LEVELS,
  ALGORITHM_LATER_TRAINING_ITEM_TYPES,
  ALGORITHM_MISTAKE_TYPES,
  ALGORITHM_MVP_TRAINING_ITEM_TYPES,
  ALGORITHM_PATTERN_FAMILIES,
  ALGORITHM_PATTERN_VARIANTS,
  ALGORITHM_PROBLEM_ARCHETYPES,
  ALGORITHM_ROADMAP,
  ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
  ALGORITHM_SKILL_ATOMS,
  ALGORITHM_STATIC_MICRO_CHECK_TYPES,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapTrack,
  type AlgorithmTrainingItem,
  validateAlgorithmRoadmap,
  validateAlgorithmTrainingItem,
} from "../src/tracks/algorithms";

test("Algorithms MVP pattern taxonomy includes the approved initial pattern families", () => {
  assert.deepEqual(
    ALGORITHM_PATTERN_FAMILIES.map((family) => family.id),
    [
      "complexity_basics",
      "hash_map_and_set",
      "two_pointers",
      "sliding_window",
      "prefix_sums",
      "sorting_based",
      "stack",
      "binary_search",
    ],
  );

  for (const family of ALGORITHM_PATTERN_FAMILIES) {
    assert.equal(family.contentVersion, ALGORITHM_CONTENT_VERSION);
    assert.ok(family.label.length > 0);
    assert.ok(family.description.length > 0);
    assert.ok(family.coreDecisionSignals.length > 0);
    assert.ok(family.commonMistakeTypes.length > 0);
    assert.equal("itemCount" in family, false);
  }
});

test("Algorithms skill atoms have one primary pattern family and valid mistake types", () => {
  const familyIds = new Set(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id));
  const mistakeTypes = new Set<string>(ALGORITHM_MISTAKE_TYPES);
  const skillAtomIds = new Set(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id));
  const patternVariantIds = new Set(ALGORITHM_PATTERN_VARIANTS.map((variant) => variant.id));
  const problemArchetypeIds = new Set(ALGORITHM_PROBLEM_ARCHETYPES.map((archetype) => archetype.id));

  for (const atom of ALGORITHM_SKILL_ATOMS) {
    assert.equal(atom.contentVersion, ALGORITHM_CONTENT_VERSION);
    assert.equal(typeof atom.primaryPatternFamilyId, "string");
    assert.equal("primaryPatternFamilyIds" in atom, false);
    assert.ok(familyIds.has(atom.primaryPatternFamilyId));
    assert.ok(atom.mistakeTypes.length > 0);
    assert.ok(atom.evidenceRequiredForProgression.length > 0);

    for (const mistakeType of atom.mistakeTypes) {
      assert.ok(mistakeTypes.has(mistakeType));
    }

    for (const prerequisiteSkillAtomId of atom.prerequisiteSkillAtomIds) {
      assert.ok(skillAtomIds.has(prerequisiteSkillAtomId));
    }

    const atomPatternVariantIds = "patternVariantIds" in atom ? atom.patternVariantIds : [];
    const atomProblemArchetypeIds = "problemArchetypeIds" in atom ? atom.problemArchetypeIds : [];

    for (const patternVariantId of atomPatternVariantIds) {
      assert.ok(patternVariantIds.has(patternVariantId));
    }

    for (const problemArchetypeId of atomProblemArchetypeIds) {
      assert.ok(problemArchetypeIds.has(problemArchetypeId));
    }
  }
});

test("Algorithms training item quality rejects multiple primary skills and missing feedback model", () => {
  const multiplePrimarySkills = {
    ...makeBaseAlgorithmItem(),
    primarySkillAtomId: ["recognize_n2_too_slow_for_large_n", "explain_hash_map_average_lookup"],
  };
  const missingFeedbackModel = {
    ...makeBaseAlgorithmItem(),
    feedbackModel: undefined,
  };

  assert.ok(issueCodes(multiplePrimarySkills).includes("multiple_primary_skills"));
  assert.ok(issueCodes(missingFeedbackModel).includes("missing_feedback_model"));
});

test("Algorithms approach templates include mechanics, invariant, pseudocode, complexity, pitfalls, and static status", () => {
  assert.deepEqual(
    ALGORITHM_APPROACH_TEMPLATES.map((approach) => approach.id),
    [
      "hash_map_complement_lookup",
      "sorted_two_pointers_pair_scan",
      "positive_sliding_window",
    ],
  );

  for (const approach of ALGORITHM_APPROACH_TEMPLATES) {
    assert.equal(approach.contentVersion, ALGORITHM_CONTENT_VERSION);
    assert.equal(approach.status, "draft");
    assert.ok(approach.whenToUseSignals.length > 0);
    assert.ok(approach.whenNotToUseSignals.length > 0);
    assert.ok(approach.invariants.length > 0);
    assert.ok(approach.steps.length > 0);
    assert.ok(approach.pseudocodeTemplate.lines.length > 0);
    assert.ok(approach.typicalTimeComplexity.length > 0);
    assert.ok(approach.typicalSpaceComplexity.length > 0);
    assert.ok(approach.commonMistakeTypes.length > 0);
    assert.ok(approach.pitfalls.length > 0);
  }
});

test("Algorithms static micro-check model does not expose dynamic evaluation fields", () => {
  const staticCheck = makeStaticMicroCheck();
  const exposedKeys = new Set(Object.keys(staticCheck));

  for (const forbiddenField of [
    "ai",
    "llm",
    "chat",
    "generatedFeedback",
    "semanticEvaluator",
    "model",
    "promptTemplate",
  ]) {
    assert.equal(exposedKeys.has(forbiddenField), false, forbiddenField);
  }

  assert.deepEqual(
    [...ALGORITHM_STATIC_MICRO_CHECK_TYPES],
    [
      "single_choice",
      "multi_select",
      "order_steps",
      "fill_blank",
      "trace_next_step",
      "select_pseudocode_line",
    ],
  );
});

test("Algorithms approach primer validation rejects missing mechanics fields", () => {
  const invalidApproachPrimer = makeBaseAlgorithmItem({
    type: "approach_primer",
  });

  assert.deepEqual(
    issueCodes(invalidApproachPrimer).filter((code) =>
      [
        "missing_approach_id",
        "missing_mechanics_summary",
        "missing_when_to_use_signals",
        "missing_invariant",
        "missing_pseudocode",
        "missing_pitfalls",
        "missing_static_micro_check",
      ].includes(code),
    ),
    [
      "missing_approach_id",
      "missing_invariant",
      "missing_mechanics_summary",
      "missing_pitfalls",
      "missing_pseudocode",
      "missing_static_micro_check",
      "missing_when_to_use_signals",
    ],
  );

  const validApproachPrimer = makeBaseAlgorithmItem({
    approachId: "hash_map_complement_lookup",
    invariant: makeInvariant(),
    mechanicsSummary: "For each value, check whether the needed complement was already seen, then store this value.",
    pitfalls: [makePitfall()],
    pseudocodeTemplate: makePseudocodeTemplate(),
    staticMicroChecks: [makeStaticMicroCheck()],
    type: "approach_primer",
    whenToUseSignals: ["Need fast complement lookup while scanning once."],
  });

  assert.deepEqual(issueCodes(validApproachPrimer), []);
});

test("Algorithms strategy choice requires strategy data plus reason and constraint signals", () => {
  const invalidStrategyChoice = makeBaseAlgorithmItem({
    type: "strategy_choice",
  });

  assert.deepEqual(
    issueCodes(invalidStrategyChoice).filter((code) => code.includes("approach") || code.includes("signal")),
    [
      "missing_acceptable_approaches",
      "missing_constraint_signal",
      "missing_expected_approaches",
      "missing_reason_signal",
      "missing_rejected_approaches",
    ],
  );

  const validStrategyChoice = makeBaseAlgorithmItem({
    acceptableApproachIds: [],
    constraintSignal: "n can be 100000, so pair enumeration is too expensive.",
    expectedApproachIds: ["hash_map_and_set"],
    reasonSignal: "Need complement lookup during one scan.",
    rejectedApproachIds: ["nested_loop"],
    type: "strategy_choice",
  });

  assert.deepEqual(issueCodes(validStrategyChoice), []);
});

test("Algorithms complexity check requires time, space, and explanation", () => {
  const invalidComplexityCheck = makeBaseAlgorithmItem({
    type: "complexity_check",
  });

  assert.deepEqual(
    issueCodes(invalidComplexityCheck).filter((code) => code.includes("complexity")),
    [
      "missing_complexity_explanation",
      "missing_expected_space_complexity",
      "missing_expected_time_complexity",
    ],
  );

  const validComplexityCheck = makeBaseAlgorithmItem({
    complexityExplanation: "The scan is linear and the map can hold up to n values.",
    expectedSpaceComplexity: "O(n)",
    expectedTimeComplexity: "O(n)",
    type: "complexity_check",
  });

  assert.deepEqual(issueCodes(validComplexityCheck), []);
});

test("Algorithms worked example requires trace, pseudocode, alternatives, complexity, and static micro-check", () => {
  const invalidWorkedExample = makeBaseAlgorithmItem({
    type: "worked_example",
  });

  assert.deepEqual(
    issueCodes(invalidWorkedExample).filter((code) =>
      [
        "missing_problem_statement",
        "missing_constraints",
        "missing_approach_id",
        "missing_approach_choice_reason",
        "missing_worked_example_subgoals",
        "missing_step_by_step_trace",
        "missing_pseudocode",
        "missing_expected_time_complexity",
        "missing_expected_space_complexity",
        "missing_complexity_explanation",
        "missing_why_not_alternatives",
        "missing_common_mistakes",
        "missing_worked_example_static_micro_check",
      ].includes(code),
    ),
    [
      "missing_approach_choice_reason",
      "missing_approach_id",
      "missing_common_mistakes",
      "missing_complexity_explanation",
      "missing_constraints",
      "missing_expected_space_complexity",
      "missing_expected_time_complexity",
      "missing_problem_statement",
      "missing_pseudocode",
      "missing_step_by_step_trace",
      "missing_why_not_alternatives",
      "missing_worked_example_static_micro_check",
      "missing_worked_example_subgoals",
    ],
  );

  const validWorkedExample = makeBaseAlgorithmItem({
    approachChoiceReason: "A one-pass lookup avoids checking every pair for a large input.",
    approachId: "hash_map_complement_lookup",
    commonMistakes: ["duplicate_handling_error"],
    complexityExplanation: "Each input value is scanned once and the lookup can hold up to n values.",
    constraints: ["n can be 100000"],
    expectedSpaceComplexity: "O(n)",
    expectedTimeComplexity: "O(n)",
    problemStatement: "Find whether any pair sums to the target.",
    pseudocodeTemplate: makePseudocodeTemplate(),
    solution: {
      approachId: "hash_map_and_set",
      id: "solution-001",
      spaceComplexity: "O(n)",
      summary: "Scan once while remembering seen complements.",
      timeComplexity: "O(n)",
      title: "One-pass complement lookup",
    },
    subgoals: [
      {
        description: "Keep enough state to answer complement lookup during the scan.",
        id: "subgoal-001",
        label: "Track seen values",
        order: 1,
      },
    ],
    staticMicroChecks: [makeStaticMicroCheck()],
    stepByStepTrace: [
      {
        description: "First value is stored because no complement has been seen yet.",
        id: "trace-001",
        order: 1,
        state: ["seen = {first value}"],
      },
    ],
    type: "worked_example",
    whyNotAlternatives: [
      {
        approachId: "nested_loop",
        reason: "Checking every pair is too slow for the input limit.",
      },
    ],
  });

  assert.deepEqual(issueCodes(validWorkedExample), []);
});

test("Algorithms mechanics-first item types exist before draft item seeding", () => {
  const itemTypes = new Set<string>([
    ...ALGORITHM_MVP_TRAINING_ITEM_TYPES,
    ...ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
    ...ALGORITHM_LATER_TRAINING_ITEM_TYPES,
  ]);

  for (const itemType of [
    "approach_naming",
    "subgoal_identification",
    "subgoal_ordering",
    "pseudocode_ordering",
    "fill_missing_step",
    "trace_next_step",
  ]) {
    assert.equal(itemTypes.has(itemType), true, itemType);
  }
});

test("Algorithms roadmap contains the required first sequence in order", () => {
  assert.deepEqual(
    ALGORITHM_ROADMAP.nodes.map((node) => node.id),
    [
      "complexity_basics",
      "array_string_basics",
      "hash_map_lookup",
      "two_pointers_pair_scan",
      "sliding_window_positive",
      "prefix_sums_range_reasoning",
      "stack_nested_structure",
      "binary_search_sorted_input",
      "strategy_selection_basics",
      "mixed_pattern_practice",
    ],
  );
  assert.deepEqual(
    ALGORITHM_ROADMAP.nodes.map((node) => node.order),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  );
  assert.deepEqual(validateAlgorithmRoadmap(ALGORITHM_ROADMAP).issues, []);
});

test("Algorithms roadmap prerequisites point backward only", () => {
  const nodesById = new Map(getRoadmapNodes().map((node) => [node.id, node]));

  for (const node of getRoadmapNodes()) {
    for (const prerequisiteNodeId of node.prerequisiteNodeIds) {
      const prerequisite = nodesById.get(prerequisiteNodeId);

      assert.ok(prerequisite);
      assert.ok(prerequisite.order < node.order, `${prerequisiteNodeId} should come before ${node.id}`);
    }
  }
});

test("Algorithms roadmap approach refs resolve to existing approach templates", () => {
  const approachIds = new Set<string>(ALGORITHM_APPROACH_TEMPLATES.map((approach) => approach.id));

  assert.deepEqual(getRoadmapNode("hash_map_lookup").approachIds, ["hash_map_complement_lookup"]);
  assert.deepEqual(getRoadmapNode("two_pointers_pair_scan").approachIds, ["sorted_two_pointers_pair_scan"]);
  assert.deepEqual(getRoadmapNode("sliding_window_positive").approachIds, ["positive_sliding_window"]);

  for (const node of getRoadmapNodes()) {
    for (const approachId of node.approachIds ?? []) {
      assert.equal(approachIds.has(approachId), true, approachId);
    }
  }
});

test("Algorithms roadmap pattern family refs resolve to existing taxonomy", () => {
  const familyIds = new Set(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id));

  for (const node of getRoadmapNodes()) {
    if (node.primaryPatternFamilyId) {
      assert.equal(familyIds.has(node.primaryPatternFamilyId), true, node.primaryPatternFamilyId);
    }
  }
});

test("Algorithms roadmap skill atom refs resolve to existing skill atoms", () => {
  const skillAtomIds = new Set<string>(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id));

  for (const node of getRoadmapNodes()) {
    for (const skillAtomId of node.skillAtomIds ?? []) {
      assert.equal(skillAtomIds.has(skillAtomId), true, skillAtomId);
    }
  }
});

test("Algorithms roadmap recommended item types exist", () => {
  const itemTypes = new Set<string>([
    ...ALGORITHM_MVP_TRAINING_ITEM_TYPES,
    ...ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
    ...ALGORITHM_LATER_TRAINING_ITEM_TYPES,
  ]);

  for (const node of getRoadmapNodes()) {
    for (const itemType of node.recommendedItemTypes) {
      assert.equal(itemTypes.has(itemType), true, `${node.id}:${itemType}`);
    }
  }
});

test("Algorithms roadmap validation rejects duplicate ids and forward prerequisites", () => {
  const duplicateNode = {
    ...ALGORITHM_ROADMAP.nodes[2],
    id: ALGORITHM_ROADMAP.nodes[1].id,
    order: ALGORITHM_ROADMAP.nodes[1].order,
  };
  const forwardPrerequisiteNode = {
    ...ALGORITHM_ROADMAP.nodes[0],
    prerequisiteNodeIds: [ALGORITHM_ROADMAP.nodes[1].id],
  };
  const invalidRoadmap: AlgorithmRoadmapTrack = {
    ...ALGORITHM_ROADMAP,
    nodes: [
      ALGORITHM_ROADMAP.nodes[0],
      duplicateNode,
      forwardPrerequisiteNode,
      ...ALGORITHM_ROADMAP.nodes.slice(2),
    ],
  };

  const issueCodes = validateAlgorithmRoadmap(invalidRoadmap).issues.map((issue) => issue.code);

  assert.ok(issueCodes.includes("duplicate_node_id"));
  assert.ok(issueCodes.includes("duplicate_order"));
  assert.ok(issueCodes.includes("forward_prerequisite"));
});

test("Algorithms roadmap visible values avoid forbidden progress and platform terms", () => {
  const serializedRoadmap = JSON.stringify(ALGORITHM_ROADMAP).toLowerCase();
  const roadmapTokens = new Set(serializedRoadmap.split(/[^a-z0-9]+/).filter(Boolean));

  for (const forbiddenTerm of [
    "readiness",
    "retention",
    "mastery",
    "mastered",
    "strong",
    "weak",
    "streak",
    "level",
    "badge",
    "leaderboard",
    "leetcode",
    "ai",
    "llm",
    "chat",
    "generated",
  ]) {
    assert.equal(roadmapTokens.has(forbiddenTerm), false, forbiddenTerm);
  }
});

test("Algorithms model values avoid disallowed progress, gamification, and platform naming", () => {
  const exposedModelValues = [
    ...ALGORITHM_APPROACH_TEMPLATES,
    ...ALGORITHM_PATTERN_FAMILIES,
    ...ALGORITHM_PATTERN_VARIANTS,
    ...ALGORITHM_PROBLEM_ARCHETYPES,
    ...ALGORITHM_SKILL_ATOMS,
    ...ALGORITHM_MISTAKE_TYPES,
    ...ALGORITHM_MVP_TRAINING_ITEM_TYPES,
    ...ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
    ...ALGORITHM_LATER_TRAINING_ITEM_TYPES,
    ...ALGORITHM_EVIDENCE_LEVELS,
    ...ALGORITHM_STATIC_MICRO_CHECK_TYPES,
    ALGORITHM_ROADMAP,
  ];
  const serializedModel = JSON.stringify(exposedModelValues).toLowerCase();
  const modelTokens = new Set(serializedModel.split(/[^a-z0-9]+/).filter(Boolean));

  for (const forbiddenTerm of [
    "readiness",
    "retention",
    "mastery",
    "streak",
    "level",
    "badge",
    "leaderboard",
    "leetcode",
    "ai",
    "llm",
    "chat",
    "generated",
  ]) {
    assert.equal(modelTokens.has(forbiddenTerm), false, forbiddenTerm);
  }
});

function issueCodes(item: unknown): string[] {
  return validateAlgorithmTrainingItem(item)
    .issues.map((issue) => issue.code)
    .sort();
}

function getRoadmapNodes(): readonly AlgorithmRoadmapNode[] {
  return ALGORITHM_ROADMAP.nodes;
}

function getRoadmapNode(nodeId: string): AlgorithmRoadmapNode {
  const node = getRoadmapNodes().find((item) => item.id === nodeId);

  assert.ok(node);
  return node;
}

function makeBaseAlgorithmItem(overrides: Partial<AlgorithmTrainingItem> = {}): AlgorithmTrainingItem {
  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "Large input means the approach must avoid nested pair enumeration.",
      mentalModelCorrection: "Use the constraint to reject direct enumeration before choosing a data structure.",
      mistakeTypes: ["complexity_mismatch"],
      nextAction: "Practice one complement-lookup item.",
      result: "diagnostic",
    },
    id: "algorithm-item-fixture-001",
    learningStage: "foundations",
    primarySkillAtomId: "recognize_n2_too_slow_for_large_n",
    prompt: "n can be 100000. What approach scale should you reject first?",
    status: "draft",
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_basics",
        role: "primary",
      },
    ],
    title: "Reject quadratic pair enumeration",
    trackId: "algorithms",
    type: "trace_drill",
    ...overrides,
  };
}

function makeInvariant() {
  return {
    description: "The lookup contains values scanned before the current value.",
    id: "fixture-invariant",
    label: "Prior values are available",
  };
}

function makePitfall() {
  return {
    description: "Storing the current value before lookup can reuse the same element.",
    id: "fixture-pitfall",
    mistakeTypes: ["duplicate_handling_error"] as const,
  };
}

function makePseudocodeTemplate() {
  return {
    id: "fixture-pseudocode",
    language: "pseudocode" as const,
    lines: [
      {
        id: "line-001",
        indentationLevel: 0,
        order: 1,
        text: "for each value, check needed complement before storing current value",
      },
    ],
  };
}

function makeStaticMicroCheck() {
  return {
    correctAnswer: "check_before_store",
    expectedAnswer: "check_before_store",
    feedback: "Check before storing when one input element cannot be reused.",
    id: "static-check-001",
    mistakeTypes: ["duplicate_handling_error"] as const,
    options: [
      { id: "check_before_store", text: "Check complement before storing the current value." },
      { id: "store_before_check", text: "Store the current value before checking complement." },
    ],
    prompt: "Which order avoids reusing the current element?",
    status: "active" as const,
    testedSkillAtomIds: ["explain_hash_map_average_lookup"],
    type: "single_choice" as const,
  };
}
