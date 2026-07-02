import assert from "node:assert/strict";
import test from "node:test";

import * as algorithmsModel from "../src/tracks/algorithms";
import {
  ALGORITHMS_TRACK_ID,
  getEnabledSessionModes,
  getTrackDefinition,
} from "../src/domain";
import type { TrainingItem } from "../src/domain/training";
import {
  ALGORITHM_APPROACH_TEMPLATES,
  ALGORITHM_CONTENT_VERSION,
  ALGORITHM_EVIDENCE_LEVELS,
  ALGORITHM_FORBIDDEN_MODEL_TERMS,
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
  ALGORITHM_TRAINING_ITEMS,
  createAlgorithmsContentAdapter,
  getAlgorithmTrainingItemsForRoadmapNode,
  getFirstUsableAlgorithmRoadmapNode,
  getSelectableAlgorithmTrainingItems,
  isAlgorithmRoadmapNodeSelectable,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapTrack,
  type AlgorithmTrainingItem,
  validateAlgorithmCurriculum,
  validateAlgorithmRoadmap,
  validateAlgorithmTrainingItem,
} from "../src/tracks/algorithms";

const requiredFamilyIds = [
  "complexity_and_constraints",
  "arrays_and_strings",
  "hash_map_and_set",
  "two_pointers",
  "sliding_window",
  "prefix_sums",
  "sorting_based",
  "stack",
  "monotonic_stack",
  "binary_search",
  "linked_list",
  "recursion_basics",
  "tree_traversal",
  "heap_priority_queue",
  "intervals",
  "backtracking",
  "graph_traversal",
  "greedy_intro",
  "dynamic_programming_intro",
  "bit_manipulation",
  "math_and_geometry",
] as const;

const requiredVariantsByFamily = {
  arrays_and_strings: ["indexed_scan", "frequency_counting", "in_place_update", "string_normalization", "duplicate_handling"],
  backtracking: ["choice_tree", "constraints_and_pruning", "combinations", "permutations", "subsets"],
  binary_search: ["classic_index_search", "lower_upper_bound", "rotated_array_search", "binary_search_on_answer", "monotonic_predicate_recognition"],
  bit_manipulation: ["bitmask_basics", "xor_properties", "set_clear_check_bit", "subset_bitmask_intro"],
  complexity_and_constraints: ["big_o_basics", "input_size_constraints", "time_vs_space_tradeoff", "brute_force_as_baseline", "operations_cost"],
  dynamic_programming_intro: ["one_dimensional_dp", "take_or_skip", "grid_dp", "subsequence_dp", "knapsack_intro", "state_definition", "transition_choice"],
  graph_traversal: ["adjacency_representation", "bfs_unweighted_shortest_path", "dfs_connected_components", "visited_state", "topological_sort_intro", "union_find_intro"],
  greedy_intro: ["local_choice_signal", "sorting_plus_greedy", "interval_greedy", "greedy_vs_dp_contrast"],
  hash_map_and_set: ["lookup_by_value", "frequency_map", "complement_lookup", "seen_set", "grouping_by_key"],
  heap_priority_queue: ["top_k", "running_extreme", "merge_k_sorted", "scheduling_by_priority"],
  intervals: ["merge_overlaps", "insert_interval", "meeting_rooms", "sweep_line_intro"],
  linked_list: ["pointer_rewiring", "fast_slow_pointers", "cycle_detection", "reverse_list", "merge_lists"],
  math_and_geometry: ["modulo_reasoning", "counting_formula", "gcd_lcm", "coordinate_reasoning", "rectangle_overlap"],
  monotonic_stack: ["next_greater_element", "next_smaller_element", "histogram_boundary_reasoning", "monotonic_invariant"],
  prefix_sums: ["range_sum_query", "subarray_sum_with_hash_map", "difference_array_intro", "prefix_counting", "when_prefix_beats_window"],
  recursion_basics: ["base_case_recognition", "recursive_decomposition", "call_stack_trace", "recursion_vs_iteration"],
  sliding_window: ["fixed_size_window", "variable_size_positive_numbers", "frequency_constraint", "at_most_k_distinct", "minimum_covering_window", "when_sliding_window_fails"],
  sorting_based: ["sort_then_scan", "sort_then_two_pointers", "custom_ordering", "sorting_to_reveal_structure", "sorting_cost_recognition"],
  stack: ["nested_structure_validation", "expression_like_processing", "undo_or_previous_state", "stack_for_dfs_simulation"],
  tree_traversal: ["dfs_preorder_inorder_postorder", "bfs_level_order", "recursive_tree_reasoning", "path_accumulation", "tree_height_depth"],
  two_pointers: ["opposite_ends", "same_direction", "pair_scan_sorted_input", "partitioning", "duplicate_skipping"],
} as const;

const oldAlgorithmIds = [
  oldId("complexity", "basics"),
  oldId("array", "string", "basics"),
  oldId("hash", "map", "lookup"),
  oldId("two", "pointers", "pair", "scan"),
  oldId("sliding", "window", "positive"),
  oldId("prefix", "sums", "range", "reasoning"),
  oldId("stack", "nested", "structure"),
  oldId("binary", "search", "sorted", "input"),
  oldId("strategy", "selection", "basics"),
  oldId("hash", "map", "average", "lookup"),
  oldId("variable", "size", "positive", "window"),
  oldId("sorted", "pair", "two", "pointers"),
  oldId("sorted", "two", "pointers", "pair", "scan"),
] as const;

test("Algorithms curriculum taxonomy exposes the target real pattern families", () => {
  assert.deepEqual(
    ALGORITHM_PATTERN_FAMILIES.map((family) => family.id),
    [...requiredFamilyIds],
  );
  assert.equal(new Set<string>(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id)).has("mixed_pattern_practice"), false);

  for (const family of ALGORITHM_PATTERN_FAMILIES) {
    assert.equal(family.contentVersion, ALGORITHM_CONTENT_VERSION);
    assert.equal("kind" in family, false);
    assert.ok(family.label.length > 0);
    assert.ok(family.description.length > 0);
    assert.ok(family.coreDecisionSignals.length > 0);
    assert.equal("itemCount" in family, false);
  }
});

test("Algorithms curriculum taxonomy exposes required variants by family", () => {
  const variantsByFamily = new Map<string, Set<string>>();

  for (const variant of ALGORITHM_PATTERN_VARIANTS) {
    const variants = variantsByFamily.get(variant.patternFamilyId) ?? new Set<string>();
    variants.add(variant.id);
    variantsByFamily.set(variant.patternFamilyId, variants);
    assert.equal(variant.contentVersion, ALGORITHM_CONTENT_VERSION);
  }

  for (const [familyId, variantIds] of Object.entries(requiredVariantsByFamily)) {
    const actualVariantIds = variantsByFamily.get(familyId) ?? new Set<string>();
    for (const variantId of variantIds) {
      assert.equal(actualVariantIds.has(variantId), true, `${familyId}:${variantId}`);
    }
  }
});

test("Algorithms curriculum exports canonical ids only", () => {
  assert.equal(exportName("resolveAlgorithm", "Curriculum", "Alias") in algorithmsModel, false);
  assert.equal(exportName("ALGORITHM", "CURRICULUM", "ID", "ALIASES") in algorithmsModel, false);
  assert.equal(exportName("Algorithm", "Curriculum", "Alias") in algorithmsModel, false);

  const serializedModel = JSON.stringify([
    ALGORITHM_APPROACH_TEMPLATES,
    ALGORITHM_PATTERN_FAMILIES,
    ALGORITHM_PATTERN_VARIANTS,
    ALGORITHM_PROBLEM_ARCHETYPES,
    ALGORITHM_SKILL_ATOMS,
    ALGORITHM_ROADMAP,
    ALGORITHM_TRAINING_ITEMS,
  ]);

  for (const oldId of oldAlgorithmIds) {
    assert.equal(serializedModel.includes(oldId), false, oldId);
  }
});

test("Algorithms skill atoms model trainable reasoning actions", () => {
  const familyIds = new Set(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id));
  const mistakeTypes = new Set<string>(ALGORITHM_MISTAKE_TYPES);
  const skillAtomIds = new Set(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id));
  const patternVariantIds = new Set(ALGORITHM_PATTERN_VARIANTS.map((variant) => variant.id));
  const problemArchetypeIds = new Set(ALGORITHM_PROBLEM_ARCHETYPES.map((archetype) => archetype.id));

  for (const atom of ALGORITHM_SKILL_ATOMS) {
    assert.equal(atom.contentVersion, ALGORITHM_CONTENT_VERSION);
    assert.ok(familyIds.has(atom.primaryPatternFamilyId));
    assert.ok(atom.mistakeTypes.length > 0);
    assert.ok(atom.evidenceRequiredForProgression.length > 0);
    assert.equal(atom.id.endsWith("_skill"), false, atom.id);

    for (const mistakeType of atom.mistakeTypes) {
      assert.ok(mistakeTypes.has(mistakeType));
    }

    for (const prerequisiteSkillAtomId of atom.prerequisiteSkillAtomIds) {
      assert.ok(skillAtomIds.has(prerequisiteSkillAtomId));
    }

    for (const patternVariantId of atom.patternVariantIds ?? []) {
      assert.ok(patternVariantIds.has(patternVariantId));
    }

    for (const problemArchetypeId of atom.problemArchetypeIds ?? []) {
      assert.ok(problemArchetypeIds.has(problemArchetypeId));
    }
  }
});

test("Algorithms roadmap separates available, planned, future, and mixed practice", () => {
  const availableNodeIds = ALGORITHM_ROADMAP.nodes
    .filter((node) => node.status === "available")
    .map((node) => node.id);

  for (const nodeId of [
    "complexity_and_constraints",
    "arrays_and_strings",
    "hash_map_and_set",
    "two_pointers",
    "sliding_window",
    "prefix_sums",
    "sorting_based",
    "stack",
    "binary_search",
    "strategy_selection_core",
    "contrast_hash_map_vs_sorting",
    "contrast_two_pointers_vs_sliding_window",
    "contrast_sliding_window_vs_prefix_sums",
    "contrast_stack_vs_monotonic_stack_intro",
    "contrast_binary_search_vs_linear_scan",
  ]) {
    assert.equal(availableNodeIds.includes(nodeId), true, nodeId);
  }

  const mixedPractice = getRoadmapNode("mixed_pattern_practice");
  assert.equal(mixedPractice.kind, "mixed_practice");
  assert.equal(mixedPractice.learningStage, "mixed_interview_practice");
  assert.notEqual(mixedPractice.status, "available");
  assert.equal(mixedPractice.minimumActiveItemCount, 0);

  for (const node of ALGORITHM_ROADMAP.nodes.filter((item) => item.status !== "available")) {
    assert.notEqual(node.status, "available", node.id);
    assert.equal(node.minimumActiveItemCount, 0, node.id);
  }

  assert.deepEqual(validateAlgorithmRoadmap(ALGORITHM_ROADMAP).issues, []);
});

test("Algorithms roadmap references and prerequisites resolve", () => {
  const nodesById = new Map(getRoadmapNodes().map((node) => [node.id, node]));
  const approachIds = new Set<string>(ALGORITHM_APPROACH_TEMPLATES.map((approach) => approach.id));
  const familyIds = new Set(ALGORITHM_PATTERN_FAMILIES.map((family) => family.id));
  const variantIds = new Set(ALGORITHM_PATTERN_VARIANTS.map((variant) => variant.id));
  const archetypeIds = new Set(ALGORITHM_PROBLEM_ARCHETYPES.map((archetype) => archetype.id));
  const skillAtomIds = new Set<string>(ALGORITHM_SKILL_ATOMS.map((atom) => atom.id));

  for (const node of getRoadmapNodes()) {
    for (const prerequisiteNodeId of node.prerequisiteNodeIds) {
      const prerequisite = nodesById.get(prerequisiteNodeId);
      assert.ok(prerequisite, `${node.id}:${prerequisiteNodeId}`);
      assert.ok(prerequisite.order < node.order, `${prerequisiteNodeId} should come before ${node.id}`);
    }
    for (const approachId of node.approachIds ?? []) assert.ok(approachIds.has(approachId), approachId);
    if (node.primaryPatternFamilyId) assert.ok(familyIds.has(node.primaryPatternFamilyId), node.primaryPatternFamilyId);
    for (const variantId of node.patternVariantIds ?? []) assert.ok(variantIds.has(variantId), variantId);
    for (const archetypeId of node.problemArchetypeIds ?? []) assert.ok(archetypeIds.has(archetypeId), archetypeId);
    for (const skillAtomId of node.skillAtomIds ?? []) assert.ok(skillAtomIds.has(skillAtomId), skillAtomId);
  }
});

test("Algorithms existing content preserves valid item ids on canonical refs", () => {
  const itemIds = new Set(ALGORITHM_TRAINING_ITEMS.map((item) => item.id));

  for (const itemId of [
    "alg-complexity-constraint-pair-001",
    "alg-array-string-naming-001",
    "alg-hash-map-primer-001",
    "alg-hash-map-pseudocode-order-001",
    "alg-hash-map-trace-next-001",
    "alg-two-pointers-subgoal-order-001",
    "alg-two-pointers-pseudocode-line-001",
  ]) {
    assert.equal(itemIds.has(itemId), true, itemId);
  }

  assert.equal(getItem("alg-complexity-constraint-pair-001").roadmapNodeId, "complexity_and_constraints");
  assert.equal(getItem("alg-array-string-naming-001").roadmapNodeId, "arrays_and_strings");
  assert.equal(getItem("alg-hash-map-primer-001").primarySkillAtomId, "choose_lookup_key");
  assert.equal(getItem("alg-two-pointers-subgoal-order-001").primarySkillAtomId, "move_decisive_pointer");
});

test("Algorithms active items and curriculum pass validation", () => {
  const track = getTrackDefinition(ALGORITHMS_TRACK_ID);
  const result = validateAlgorithmCurriculum({
    enabledSessionModes: getEnabledSessionModes(ALGORITHMS_TRACK_ID),
    items: ALGORITHM_TRAINING_ITEMS,
    roadmap: ALGORITHM_ROADMAP,
  });

  assert.deepEqual(result.issues, []);
  assert.equal(track.contentManifest.itemCount, ALGORITHM_TRAINING_ITEMS.filter((item) => item.status === "active").length);

  for (const item of ALGORITHM_TRAINING_ITEMS) {
    assert.deepEqual(validateAlgorithmTrainingItem(item).issues, [], item.id);
    assert.equal(item.status, "active");
    assert.ok(item.staticMicroChecks?.some((check) => check.status === "active"), item.id);
  }
});

test("Algorithms content uses production status and version naming", () => {
  const track = getTrackDefinition(ALGORITHMS_TRACK_ID);

  assert.equal(ALGORITHM_CONTENT_VERSION, "algorithms-core");
  assert.equal(ALGORITHM_CONTENT_VERSION.includes(blockedTerm("draft")), false);
  assert.equal(track.status, "active");
  assert.equal(track.contentManifest.version, ALGORITHM_CONTENT_VERSION);

  for (const approach of ALGORITHM_APPROACH_TEMPLATES) {
    assert.equal(approach.status, "active", approach.id);
  }
});

test("Algorithms session selection excludes planned and future roadmap nodes", () => {
  assert.equal(getFirstUsableAlgorithmRoadmapNode().id, "complexity_and_constraints");

  for (const node of ALGORITHM_ROADMAP.nodes) {
    const activeItemCount = getAlgorithmTrainingItemsForRoadmapNode(node.id).length;

    if (node.status === "available") {
      assert.equal(isAlgorithmRoadmapNodeSelectable(node), activeItemCount >= node.minimumActiveItemCount, node.id);
      continue;
    }

    assert.equal(isAlgorithmRoadmapNodeSelectable(node), false, node.id);
  }
});

test("Algorithms adapter mode selection excludes active items on unavailable roadmap nodes", () => {
  const plannedItem = {
    ...makeBaseAlgorithmItem({
      id: "algorithm-planned-node-fixture-001",
      roadmapNodeId: "mixed_pattern_practice",
      status: "active",
      staticMicroChecks: [makeStaticMicroCheck()],
      type: "approach_naming",
    }),
  };
  const adapter = createAlgorithmsContentAdapter([
    ...ALGORITHM_TRAINING_ITEMS,
    plannedItem as AlgorithmTrainingItem & TrainingItem,
  ]);
  const modeItems = adapter.getItemsForMode("algorithms-roadmap-basics");

  assert.equal(modeItems.some((item) => item.id === plannedItem.id), false);
  assert.equal(getSelectableAlgorithmTrainingItems().every((item) => item.status === "active"), true);
});

test("Algorithms curriculum validation rejects active items on unknown or unavailable roadmap nodes", () => {
  const track = getTrackDefinition(ALGORITHMS_TRACK_ID);
  const unknownNodeItem = makeBaseAlgorithmItem({
    id: "algorithm-unknown-node-fixture-001",
    roadmapNodeId: "missing_node",
    status: "active",
    staticMicroChecks: [makeStaticMicroCheck()],
  });
  const unavailableNodeItem = makeBaseAlgorithmItem({
    id: "algorithm-unavailable-node-fixture-001",
    roadmapNodeId: "mixed_pattern_practice",
    status: "active",
    staticMicroChecks: [makeStaticMicroCheck()],
  });

  const issueCodes = validateAlgorithmCurriculum({
    enabledSessionModes: track.sessionModes.filter((mode) => mode.enabled),
    items: [...ALGORITHM_TRAINING_ITEMS, unknownNodeItem, unavailableNodeItem],
    roadmap: ALGORITHM_ROADMAP,
  }).issues.map((issue) => issue.code);

  assert.ok(issueCodes.includes("active_item_references_unknown_roadmap_node"));
  assert.ok(issueCodes.includes("active_item_on_unavailable_roadmap_node"));
});

test("Algorithms session mode supported item types are canonical and known", () => {
  const track = getTrackDefinition(ALGORITHMS_TRACK_ID);
  const knownItemTypes = new Set<string>([
    ...ALGORITHM_MVP_TRAINING_ITEM_TYPES,
    ...ALGORITHM_SECOND_STAGE_TRAINING_ITEM_TYPES,
    ...ALGORITHM_LATER_TRAINING_ITEM_TYPES,
  ]);

  for (const mode of track.sessionModes) {
    for (const itemType of mode.supportedItemTypes) {
      assert.ok(knownItemTypes.has(itemType), `${mode.id}:${itemType}`);
      assert.notEqual(itemType, oldId("complexity", "analysis"));
    }
  }
});

test("Algorithms static micro-check model supports all active check types", () => {
  const checkTypes = new Set(
    ALGORITHM_TRAINING_ITEMS.flatMap((item) =>
      (item.staticMicroChecks ?? []).map((check) => check.type),
    ),
  );

  for (const checkType of checkTypes) {
    assert.ok(ALGORITHM_STATIC_MICRO_CHECK_TYPES.includes(checkType), checkType);
  }
});

test("Algorithms model values avoid forbidden progress and platform terms", () => {
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
    ALGORITHM_TRAINING_ITEMS,
  ];
  const serializedModel = JSON.stringify(exposedModelValues).toLowerCase();

  for (const forbiddenTerm of ALGORITHM_FORBIDDEN_MODEL_TERMS) {
    assert.equal(serializedModel.includes(forbiddenTerm), false, forbiddenTerm);
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

test("Algorithms item validators retain specific content-type contracts", () => {
  assert.ok(issueCodes({ ...makeBaseAlgorithmItem(), primarySkillAtomId: ["derive_time_complexity", "choose_lookup_key"] }).includes("multiple_primary_skills"));
  assert.ok(issueCodes({ ...makeBaseAlgorithmItem(), feedbackModel: undefined }).includes("missing_feedback_model"));

  assert.deepEqual(
    issueCodes(makeBaseAlgorithmItem({ type: "complexity_check" })).filter((code) => code.includes("complexity")),
    [
      "missing_complexity_explanation",
      "missing_expected_space_complexity",
      "missing_expected_time_complexity",
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

function issueCodes(item: unknown): string[] {
  return validateAlgorithmTrainingItem(item)
    .issues.map((issue) => issue.code)
    .sort();
}

function oldId(...parts: string[]): string {
  return parts.join("_");
}

function exportName(...parts: string[]): string {
  return parts.join("");
}

function blockedTerm(value: string): string {
  return value;
}

function getRoadmapNodes(): readonly AlgorithmRoadmapNode[] {
  return ALGORITHM_ROADMAP.nodes;
}

function getRoadmapNode(nodeId: string): AlgorithmRoadmapNode {
  const node = getRoadmapNodes().find((item) => item.id === nodeId);

  assert.ok(node);
  return node;
}

function getItem(itemId: string): AlgorithmTrainingItem {
  const item = ALGORITHM_TRAINING_ITEMS.find((candidate) => candidate.id === itemId);

  assert.ok(item);
  return item;
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
    primarySkillAtomId: "derive_time_complexity",
    prompt: "n can be 100000. What approach scale should you reject first?",
    status: "disabled",
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
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
    testedSkillAtomIds: ["choose_lookup_key"],
    type: "single_choice" as const,
  };
}
