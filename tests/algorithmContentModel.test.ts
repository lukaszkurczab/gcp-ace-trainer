import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHM_CONTENT_VERSION,
  ALGORITHM_EVIDENCE_LEVELS,
  ALGORITHM_LATER_TRAINING_ITEM_TYPES,
  ALGORITHM_MISTAKE_TYPES,
  ALGORITHM_MVP_TRAINING_ITEM_TYPES,
  ALGORITHM_PATTERN_FAMILIES,
  ALGORITHM_PATTERN_VARIANTS,
  ALGORITHM_PROBLEM_ARCHETYPES,
  ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
  ALGORITHM_SKILL_ATOMS,
  type AlgorithmTrainingItem,
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

test("Algorithms worked example requires subgoals, solution, and an active micro prompt", () => {
  const invalidWorkedExample = makeBaseAlgorithmItem({
    type: "worked_example",
  });

  assert.deepEqual(
    issueCodes(invalidWorkedExample).filter((code) => code.includes("worked_example")),
    [
      "missing_worked_example_active_prompt",
      "missing_worked_example_solution",
      "missing_worked_example_subgoals",
    ],
  );

  const validWorkedExample = makeBaseAlgorithmItem({
    microPrompts: [
      {
        expectedSignal: "n is too large for checking every pair.",
        id: "micro-001",
        prompt: "What constraint makes the nested-loop approach fail?",
        status: "active",
      },
    ],
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
    type: "worked_example",
  });

  assert.deepEqual(issueCodes(validWorkedExample), []);
});

test("Algorithms model values avoid disallowed progress, gamification, and platform naming", () => {
  const exposedModelValues = [
    ...ALGORITHM_PATTERN_FAMILIES,
    ...ALGORITHM_PATTERN_VARIANTS,
    ...ALGORITHM_PROBLEM_ARCHETYPES,
    ...ALGORITHM_SKILL_ATOMS,
    ...ALGORITHM_MISTAKE_TYPES,
    ...ALGORITHM_MVP_TRAINING_ITEM_TYPES,
    ...ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
    ...ALGORITHM_LATER_TRAINING_ITEM_TYPES,
    ...ALGORITHM_EVIDENCE_LEVELS,
  ];
  const serializedModel = JSON.stringify(exposedModelValues).toLowerCase();

  for (const forbiddenTerm of [
    "readiness",
    "retention",
    "mastery",
    "streak",
    "level",
    "badge",
    "leaderboard",
    "leetcode",
  ]) {
    assert.equal(serializedModel.includes(forbiddenTerm), false, forbiddenTerm);
  }
});

function issueCodes(item: unknown): string[] {
  return validateAlgorithmTrainingItem(item)
    .issues.map((issue) => issue.code)
    .sort();
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
