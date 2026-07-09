import assert from "node:assert/strict";
import test from "node:test";

import * as algorithmsModel from "../src/tracks/algorithms";
import {
  ALGORITHMS_TRACK_ID,
  getEnabledSessionModes,
  getTrackDefinition,
} from "../src/domain";
import type { ReviewQueueItem, TrainingAttempt, TrainingItem } from "../src/domain/training";
import {
  algorithmContentGroups,
  algorithmContentManifest,
  algorithmContentItems,
} from "../src/tracks/algorithms/content";
import {
  ALGORITHM_APPROACH_TEMPLATES,
  ALGORITHM_COMPLEXITY_CLASSES,
  ALGORITHM_CONTENT_VERSION,
  ALGORITHM_EVIDENCE_LEVELS,
  ALGORITHM_FORBIDDEN_MODEL_TERMS,
  ALGORITHM_MISTAKE_TYPES,
  ALGORITHM_PATTERN_FAMILIES,
  ALGORITHM_PATTERN_VARIANTS,
  ALGORITHM_PROBLEM_ARCHETYPES,
  ALGORITHM_ROADMAP,
  ALGORITHM_SKILL_ATOMS,
  ALGORITHM_STATIC_MICRO_CHECK_TYPES,
  ALGORITHM_TRAINING_ITEM_TYPES,
  ALGORITHM_TRAINING_ITEMS,
  buildAlgorithmWeakAreaRecommendation,
  createAlgorithmsContentAdapter,
  getAlgorithmTrainingItemsForRoadmapNode,
  getFirstUsableAlgorithmRoadmapNode,
  getSelectableAlgorithmTrainingItems,
  isAlgorithmRoadmapNodeSelectable,
  selectAlgorithmSessionItems,
  selectAlgorithmSessionItemsForRoadmapNode,
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

const requiredSkillAtomIds = [
  "derive_time_complexity",
  "derive_space_complexity",
  "compare_complexity_tradeoffs",
  "track_index_boundary",
  "recognize_adjacent_scan",
  "diagnose_off_by_one",
  "trace_scan_index",
  "choose_frequency_state",
  "distinguish_presence_from_count",
  "diagnose_data_structure_mismatch",
  "reason_about_frequency_counting_complexity",
  "fixed_alphabet_complexity",
  "apply_string_normalization",
  "normalization_before_comparison",
  "streaming_normalization_tradeoff",
  "preserve_relative_order",
  "use_read_write_boundary",
  "reason_about_order_constraint",
  "trace_write_boundary",
  "distinguish_output_space",
  "distinguish_output_contract",
  "diagnose_duplicate_collapse",
  "initialize_duplicate_collapse",
  "avoid_unnecessary_state",
  "choose_lookup_key",
  "move_decisive_pointer",
  "maintain_window_invariant",
  "detect_window_failure_signal",
  "recognize_sorting_tradeoff",
  "use_last_unresolved_state",
  "maintain_monotonic_stack_invariant",
  "identify_monotonic_predicate",
  "reason_linked_list_rewiring",
  "trace_recursive_base_case",
  "carry_tree_traversal_state",
  "choose_priority_queue_state",
  "reason_about_interval_overlap",
  "prune_backtracking_choice",
  "track_graph_visited_state",
  "justify_greedy_choice",
  "define_dynamic_programming_state",
  "apply_bitmask_state",
  "reason_about_numeric_structure",
] as const;

const expectedArrayStringPrimarySkills = {
  "alg-array-string-naming-001": "track_index_boundary",
  "alg-array-string-trace-index-001": "trace_scan_index",
  "alg-array-string-edge-neighbor-001": "track_index_boundary",
  "alg-array-string-frequency-signal-001": "choose_frequency_state",
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

const expectedActiveAlgorithmItemCount = 847;

const requiredActiveAlgorithmItemTypes = [
  "approach_naming",
  "approach_primer",
  "worked_example",
  "trace_next_step",
  "strategy_choice",
  "complexity_check",
  "solution_comparison",
  "edge_case_drill",
  "subgoal_ordering",
  "pseudocode_ordering",
] as const;

const expectedRoadmapNodeIds = [
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
  "mixed_pattern_practice",
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

    if ("problemArchetypeIds" in atom) {
      for (const problemArchetypeId of atom.problemArchetypeIds ?? []) {
        assert.ok(problemArchetypeIds.has(problemArchetypeId));
      }
    }
  }

  for (const skillAtomId of requiredSkillAtomIds) {
    assert.ok(skillAtomIds.has(skillAtomId), skillAtomId);
  }
});

test("Algorithms roadmap exposes only active canonical nodes", () => {
  assert.deepEqual(ALGORITHM_ROADMAP.nodes.map((node) => node.id), [...expectedRoadmapNodeIds]);
  assert.equal(ALGORITHM_ROADMAP.status, "available");

  for (const node of ALGORITHM_ROADMAP.nodes) {
    assert.equal(node.status, "available", node.id);
    assert.notEqual(node.kind, "later", node.id);
    assert.ok(node.minimumActiveItemCount > 0, node.id);
  }

  const mixedPractice = getRoadmapNode("mixed_pattern_practice");
  assert.equal(mixedPractice.kind, "mixed_practice");
  assert.equal(mixedPractice.learningStage, "mixed_interview_practice");
  assert.equal(mixedPractice.status, "available");
  assert.equal(mixedPractice.minimumActiveItemCount, 35);

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

  for (const [itemId, skillAtomId] of Object.entries(expectedArrayStringPrimarySkills)) {
    assert.equal(getItem(itemId).primarySkillAtomId, skillAtomId, itemId);
  }
});

test("Algorithms JSON content groups preserve the public item collection", () => {
  assert.equal(algorithmContentItems.length, expectedActiveAlgorithmItemCount);
  assert.equal(ALGORITHM_TRAINING_ITEMS.length, expectedActiveAlgorithmItemCount);
  assert.deepEqual(
    ALGORITHM_TRAINING_ITEMS.map((item) => item.id),
    algorithmContentItems.map((item) => item.id),
  );

  const itemIds = new Set<string>();
  const availableNodeIds = new Set(
    ALGORITHM_ROADMAP.nodes.filter((node) => node.status === "available").map((node) => node.id),
  );

  for (const group of algorithmContentGroups) {
    assert.equal(group.items.length, group.itemCount, group.roadmapNodeId);
    assert.equal(availableNodeIds.has(group.roadmapNodeId), true, group.roadmapNodeId);

    for (const item of group.items) {
      assert.equal(item.trackId, "algorithms", item.id);
      assert.equal(item.roadmapNodeId, group.roadmapNodeId, item.id);
      assert.equal(itemIds.has(item.id), false, item.id);
      itemIds.add(item.id);
    }
  }

  assert.equal(itemIds.size, ALGORITHM_TRAINING_ITEMS.length);
});

test("Algorithms content manifest stays synchronized with imported JSON groups", () => {
  assert.equal(algorithmContentManifest.trackId, "algorithms");
  assert.equal(algorithmContentManifest.contentVersion, ALGORITHM_CONTENT_VERSION);
  assert.equal(algorithmContentManifest.itemCount, expectedActiveAlgorithmItemCount);

  const groupsByRoadmapNodeId = new Map(
    algorithmContentGroups.map((group) => [group.roadmapNodeId, group]),
  );
  const questionFiles = new Set<string>();
  const folderNames = new Set<string>();

  for (const manifestGroup of algorithmContentManifest.groups) {
    const importedGroup = groupsByRoadmapNodeId.get(manifestGroup.roadmapNodeId);

    assert.ok(importedGroup, manifestGroup.roadmapNodeId);
    assert.equal(importedGroup.folderName, manifestGroup.folderName, manifestGroup.roadmapNodeId);
    assert.equal(importedGroup.questionFile, manifestGroup.questionFile, manifestGroup.roadmapNodeId);
    assert.equal(importedGroup.itemCount, manifestGroup.itemCount, manifestGroup.roadmapNodeId);
    assert.equal(importedGroup.items.length, manifestGroup.itemCount, manifestGroup.roadmapNodeId);
    assert.equal(questionFiles.has(manifestGroup.questionFile), false, manifestGroup.questionFile);
    assert.equal(folderNames.has(manifestGroup.folderName), false, manifestGroup.folderName);
    assert.equal(
      manifestGroup.questionFile,
      `items/${manifestGroup.folderName}/questions.json`,
      manifestGroup.roadmapNodeId,
    );

    questionFiles.add(manifestGroup.questionFile);
    folderNames.add(manifestGroup.folderName);
  }

  assert.equal(groupsByRoadmapNodeId.size, algorithmContentManifest.groups.length);
});

test("Algorithms manifest itemOrder exactly preserves the public item order", () => {
  const orderedItemIds = algorithmContentManifest.itemOrder ?? [];
  const uniqueOrderedItemIds = new Set(orderedItemIds);

  assert.equal(orderedItemIds.length, expectedActiveAlgorithmItemCount);
  assert.equal(uniqueOrderedItemIds.size, orderedItemIds.length);
  assert.deepEqual(
    orderedItemIds,
    ALGORITHM_TRAINING_ITEMS.map((item) => item.id),
  );

  for (const item of ALGORITHM_TRAINING_ITEMS) {
    assert.equal(uniqueOrderedItemIds.has(item.id), true, item.id);
  }
});

test("Algorithms adapter reads the migrated content through the existing API", () => {
  const adapter = createAlgorithmsContentAdapter();
  const adapterItems = adapter.getItems();
  const modeItems = adapter.getItemsForMode("algorithms-roadmap-basics");

  assert.deepEqual(
    adapterItems.map((item) => item.id),
    ALGORITHM_TRAINING_ITEMS.map((item) => item.id),
  );
  assert.deepEqual(
    modeItems.map((item) => item.id),
    getSelectableAlgorithmTrainingItems().map((item) => item.id),
  );
});

test("Algorithms active items and curriculum pass validation", () => {
  const track = getTrackDefinition(ALGORITHMS_TRACK_ID);
  const activeItems = getActiveAlgorithmItems();
  const result = validateAlgorithmCurriculum({
    enabledSessionModes: getEnabledSessionModes(ALGORITHMS_TRACK_ID),
    items: ALGORITHM_TRAINING_ITEMS,
    roadmap: ALGORITHM_ROADMAP,
  });

  assert.deepEqual(result.issues, []);
  assert.equal(activeItems.length, expectedActiveAlgorithmItemCount);
  assert.ok(activeItems.length >= 360);
  assert.ok(activeItems.length <= 900);
  assert.equal(track.contentManifest.itemCount, activeItems.length);

  for (const item of ALGORITHM_TRAINING_ITEMS) {
    assert.deepEqual(validateAlgorithmTrainingItem(item).issues, [], item.id);
    assert.equal(item.status, "active");
    assert.ok(item.staticMicroChecks?.some((check) => check.status === "active"), item.id);
  }
});

test("Algorithms active item count covers every available roadmap node minimum", () => {
  const countsByNode = getActiveItemCountsByRoadmapNode();

  for (const node of ALGORITHM_ROADMAP.nodes) {
    const activeItemCount = countsByNode.get(node.id) ?? 0;

    if (node.status !== "available") {
      assert.equal(activeItemCount, 0, node.id);
      continue;
    }

    assert.ok(
      activeItemCount >= node.minimumActiveItemCount,
      `${node.id} has ${activeItemCount}; expected at least ${node.minimumActiveItemCount}`,
    );
  }
});

test("Algorithms active items expose canonical roadmap, taxonomy, feedback, and check contracts", () => {
  const availableNodeIds = new Set(
    ALGORITHM_ROADMAP.nodes.filter((node) => node.status === "available").map((node) => node.id),
  );

  for (const item of getActiveAlgorithmItems()) {
    assert.equal(typeof item.primarySkillAtomId, "string", item.id);
    assert.ok(item.primarySkillAtomId.length > 0, item.id);
    assert.ok((item.secondarySkillAtomIds?.length ?? 0) <= 3, item.id);
    assert.ok(item.roadmapNodeId, item.id);
    assert.ok(availableNodeIds.has(item.roadmapNodeId), item.id);
    assert.ok(
      item.taxonomyRefs.some((ref) => ref.axisId === "pattern_family" && ref.role === "primary"),
      item.id,
    );
    assert.ok(
      item.taxonomyRefs.some(
        (ref) => ref.axisId === "skill_atom" && ref.nodeId === item.primarySkillAtomId && ref.role === "primary",
      ),
      item.id,
    );
    assert.ok(item.staticMicroChecks?.some((check) => check.status === "active"), item.id);
    assert.ok(item.feedbackModel.decisionSignal.length > 0, item.id);
    assert.ok(item.feedbackModel.mistakeTypes.length > 0, item.id);
    assert.ok(item.feedbackModel.nextAction.length > 0, item.id);
  }
});

test("Algorithms complexity model supports target classes and variable explanations", () => {
  const complexityClasses = ALGORITHM_COMPLEXITY_CLASSES as readonly string[];

  assert.deepEqual(
    ["O(n + m)", "O(k)", "O(n log n + m log m)"].filter(
      (complexityClass) => !complexityClasses.includes(complexityClass),
    ),
    [],
  );
  assert.equal(complexityClasses.includes("other"), false);

  const item = makeBaseAlgorithmItem({
    complexityExplanation: "Compare both inputs once and store one bucket for each distinct character.",
    complexityVariables: {
      k: "number of distinct characters",
      m: "length of the second input",
      n: "length of the first input",
    },
    expectedSpaceComplexity: "O(k)",
    expectedTimeComplexity: "O(n + m)",
    staticMicroChecks: [
      {
        correctAnswer: {
          space: "O(k)",
          time: "O(n + m)",
        },
        feedback: "The scan touches both inputs once and the table grows with distinct characters.",
        id: "complexity-target-check-001",
        mistakeTypes: ["complexity_mismatch"] as const,
        prompt: "Choose the expected time and space cost.",
        status: "active",
        testedSkillAtomIds: ["derive_time_complexity"],
        type: "complexity_pair",
      },
    ],
    type: "complexity_check",
  });

  assert.deepEqual(issueCodes(item), []);
  assert.ok(issueCodes({
    ...item,
    expectedTimeComplexity: "O(n+m)" as never,
  }).includes("invalid_complexity_class"));
  assert.ok(issueCodes({
    ...item,
    complexityVariables: {
      n: "",
    },
  }).includes("invalid_complexity_variables"));
  assert.ok(issueCodes({
    ...item,
    staticMicroChecks: [
      {
        ...item.staticMicroChecks?.[0],
        correctAnswer: {
          space: "other",
          time: "O(n)",
        },
      },
    ],
  }).includes("invalid_static_micro_check"));
});

test("Algorithms active content uses every supported core item type and enabled modes support selectable types", () => {
  const activeItemTypes = new Set(getActiveAlgorithmItems().map((item) => item.type));
  const enabledModeItemTypes = new Set(
    getEnabledSessionModes(ALGORITHMS_TRACK_ID).flatMap((mode) => mode.supportedItemTypes),
  );

  for (const itemType of requiredActiveAlgorithmItemTypes) {
    assert.ok(activeItemTypes.has(itemType), itemType);
  }

  for (const itemType of activeItemTypes) {
    assert.ok(enabledModeItemTypes.has(itemType), itemType);
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

test("Algorithms session selection uses active roadmap content thresholds", () => {
  assert.equal(getFirstUsableAlgorithmRoadmapNode().id, "complexity_and_constraints");

  for (const node of ALGORITHM_ROADMAP.nodes) {
    const activeItemCount = getAlgorithmTrainingItemsForRoadmapNode(node.id).length;
    assert.equal(isAlgorithmRoadmapNodeSelectable(node), activeItemCount >= node.minimumActiveItemCount, node.id);
  }
});

test("Algorithms adapter mode selection excludes active items on unknown roadmap nodes", () => {
  const unknownNodeItem = {
    ...makeBaseAlgorithmItem({
      id: "algorithm-unknown-node-fixture-001",
      roadmapNodeId: "missing_node",
      status: "active",
      staticMicroChecks: [makeStaticMicroCheck()],
      type: "approach_naming",
    }),
  };
  const adapter = createAlgorithmsContentAdapter([
    ...ALGORITHM_TRAINING_ITEMS,
    unknownNodeItem as AlgorithmTrainingItem & TrainingItem,
  ]);
  const modeItems = adapter.getItemsForMode("algorithms-roadmap-basics");

  assert.equal(modeItems.some((item) => item.id === unknownNodeItem.id), false);
  assert.equal(getSelectableAlgorithmTrainingItems().every((item) => item.status === "active"), true);
});

test("Algorithms session selection uses mode-scoped adapter items", () => {
  const item = getItem("alg-complexity-constraint-pair-001");
  const selected = selectAlgorithmSessionItemsForRoadmapNode({
    contentAdapter: {
      getContentVersion: () => "algorithms-core",
      getItemById: (itemId) => (itemId === item.id ? item as TrainingItem : undefined),
      getItems: () => {
        throw new Error("Session selection must not read the full content pool.");
      },
      getItemsForMode: (modeId) => {
        assert.equal(modeId, "algorithms-roadmap-basics");
        return [item as TrainingItem];
      },
      trackId: ALGORITHMS_TRACK_ID,
    },
    nodeId: "complexity_and_constraints",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((selectedItem) => selectedItem.id), [item.id]);
});

test("Algorithms learn mode selects introductory items from the current roadmap node first", () => {
  const learnItems = [
    makeSelectableAlgorithmItem("learn-drill", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("learn-worked", "hash_map_and_set", "worked_example"),
    makeSelectableAlgorithmItem("learn-naming", "hash_map_and_set", "approach_naming"),
    makeSelectableAlgorithmItem("learn-primer", "hash_map_and_set", "approach_primer"),
    makeSelectableAlgorithmItem("learn-other-node", "two_pointers", "approach_primer"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(learnItems),
    mode: "learn",
    nodeId: "hash_map_and_set",
    sessionLength: 10,
  });

  assert.deepEqual(
    selected.map((item) => item.id),
    ["learn-primer", "learn-naming", "learn-worked"],
  );
});

test("Algorithms drill mode selects active practice items from the current roadmap node", () => {
  const drillItems = [
    makeSelectableAlgorithmItem("drill-primer", "hash_map_and_set", "approach_primer"),
    makeSelectableAlgorithmItem("drill-trace", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("drill-complexity", "hash_map_and_set", "complexity_check"),
    makeSelectableAlgorithmItem("drill-edge", "hash_map_and_set", "edge_case_drill"),
    makeSelectableAlgorithmItem("drill-pseudocode", "hash_map_and_set", "pseudocode_ordering"),
    makeSelectableAlgorithmItem("drill-subgoal", "hash_map_and_set", "subgoal_ordering"),
    makeSelectableAlgorithmItem("drill-other-node", "two_pointers", "trace_next_step"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(drillItems),
    mode: "drill",
    nodeId: "hash_map_and_set",
    sessionLength: 10,
  });

  assert.deepEqual(
    selected.map((item) => item.id),
    ["drill-trace", "drill-complexity", "drill-edge", "drill-pseudocode", "drill-subgoal"],
  );
});

test("Algorithms learn mode uses selectable current-node items when no learn items exist", () => {
  const alternateItems = [
    makeSelectableAlgorithmItem("learn-alternate-strategy", "contrast_hash_map_vs_sorting", "solution_comparison"),
    makeSelectableAlgorithmItem("learn-alternate-complexity", "contrast_hash_map_vs_sorting", "strategy_choice"),
    makeSelectableAlgorithmItem("learn-alternate-other-node", "hash_map_and_set", "approach_primer"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(alternateItems),
    mode: "learn",
    nodeId: "contrast_hash_map_vs_sorting",
    sessionLength: 10,
  });

  assert.deepEqual(
    selected.map((item) => item.id),
    ["learn-alternate-strategy", "learn-alternate-complexity"],
  );
});

test("Algorithms drill mode uses selectable current-node items when no drill items exist", () => {
  const alternateItems = [
    makeSelectableAlgorithmItem("drill-alternate-comparison", "contrast_two_pointers_vs_sliding_window", "solution_comparison"),
    makeSelectableAlgorithmItem("drill-alternate-strategy", "contrast_two_pointers_vs_sliding_window", "strategy_choice"),
    makeSelectableAlgorithmItem("drill-alternate-other-node", "hash_map_and_set", "trace_next_step"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(alternateItems),
    mode: "drill",
    nodeId: "contrast_two_pointers_vs_sliding_window",
    sessionLength: 10,
  });

  assert.deepEqual(
    selected.map((item) => item.id),
    ["drill-alternate-comparison", "drill-alternate-strategy"],
  );
});

test("Algorithms review mode selects due Algorithms review queue items", () => {
  const reviewItems = [
    makeSelectableAlgorithmItem("review-normal", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("review-high", "hash_map_and_set", "complexity_check"),
    makeSelectableAlgorithmItem("review-not-yet-due", "hash_map_and_set", "edge_case_drill"),
    makeSelectableAlgorithmItem("review-cloud", "hash_map_and_set", "subgoal_ordering"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(reviewItems),
    mode: "review",
    nodeId: "hash_map_and_set",
    now: "2026-07-03T10:00:00.000Z",
    reviewQueueItems: [
      makeReviewQueueItem("queue-normal", "review-normal", {
        dueAt: "2026-07-03T09:00:00.000Z",
        priority: "normal",
      }),
      makeReviewQueueItem("queue-high", "review-high", {
        dueAt: "2026-07-03T09:30:00.000Z",
        priority: "high",
      }),
      makeReviewQueueItem("queue-not-yet-due", "review-not-yet-due", {
        dueAt: "2026-07-04T09:00:00.000Z",
        priority: "urgent",
      }),
      makeReviewQueueItem("queue-cloud", "review-cloud", {
        trackId: "cloud-certification",
      }),
    ],
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), ["review-high", "review-normal"]);
});

test("Algorithms session-miss review selects requested missed items before dueAt", () => {
  const reviewItems = [
    makeSelectableAlgorithmItem("review-session-miss", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("review-due-other", "hash_map_and_set", "complexity_check"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(reviewItems),
    mode: "review",
    nodeId: "hash_map_and_set",
    now: "2026-07-03T10:00:00.000Z",
    reviewItemIds: ["review-session-miss"],
    reviewQueueItems: [
      makeReviewQueueItem("queue-session-miss", "review-session-miss", {
        dueAt: "2026-07-04T09:00:00.000Z",
        priority: "normal",
      }),
      makeReviewQueueItem("queue-due-other", "review-due-other", {
        dueAt: "2026-07-03T09:00:00.000Z",
        priority: "urgent",
      }),
    ],
    reviewSource: "sessionMisses",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), ["review-session-miss"]);
});

test("Algorithms due review does not fall back to session missed ids before dueAt", () => {
  const reviewItems = [
    makeSelectableAlgorithmItem("review-not-yet-due-requested", "hash_map_and_set", "trace_next_step"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(reviewItems),
    mode: "review",
    nodeId: "hash_map_and_set",
    now: "2026-07-03T10:00:00.000Z",
    reviewItemIds: ["review-not-yet-due-requested"],
    reviewQueueItems: [
      makeReviewQueueItem("queue-not-yet-due-requested", "review-not-yet-due-requested", {
        dueAt: "2026-07-04T09:00:00.000Z",
      }),
    ],
    reviewSource: "dueQueue",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), []);
});

test("Algorithms session-miss review empty state reflects only the selected review source", () => {
  const reviewItems = [
    makeSelectableAlgorithmItem("review-due-other", "hash_map_and_set", "trace_next_step"),
  ];
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter(reviewItems),
    mode: "review",
    nodeId: "hash_map_and_set",
    now: "2026-07-03T10:00:00.000Z",
    reviewItemIds: [],
    reviewQueueItems: [
      makeReviewQueueItem("queue-due-other", "review-due-other", {
        dueAt: "2026-07-03T09:00:00.000Z",
      }),
    ],
    reviewSource: "sessionMisses",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), []);
});

test("Algorithms weak area mode selects the weakest evidenced roadmap node", () => {
  const weakItems = [
    makeSelectableAlgorithmItem("weak-current", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("weak-arrays", "arrays_and_strings", "trace_next_step"),
    makeSelectableAlgorithmItem("weak-arrays-extra", "arrays_and_strings", "complexity_check"),
  ];
  const selected = selectAlgorithmSessionItems({
    attempts: [
      makeSelectionAttempt("attempt-weak-001", "weak-arrays", false),
      makeSelectionAttempt("attempt-weak-002", "weak-arrays-extra", false),
      makeSelectionAttempt("attempt-strong-001", "weak-current", true),
      makeSelectionAttempt("attempt-strong-002", "weak-current", true),
    ],
    contentAdapter: makeSelectionAdapter(weakItems),
    mode: "weakArea",
    nodeId: "hash_map_and_set",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), ["weak-arrays", "weak-arrays-extra"]);
});

test("Algorithms weak area mode weights incorrect attempts above partial attempts", () => {
  const weakItems = [
    makeSelectableAlgorithmItem("weak-partial-a", "arrays_and_strings", "trace_next_step"),
    makeSelectableAlgorithmItem("weak-partial-b", "arrays_and_strings", "complexity_check"),
    makeSelectableAlgorithmItem("weak-incorrect", "hash_map_and_set", "trace_next_step"),
  ];
  const recommendation = buildAlgorithmWeakAreaRecommendation(
    [
      makeSelectionAttempt("attempt-partial-001", "weak-partial-a", "partial"),
      makeSelectionAttempt("attempt-partial-002", "weak-partial-b", "partial"),
      makeSelectionAttempt("attempt-incorrect-001", "weak-incorrect", "incorrect"),
    ],
    weakItems,
    ALGORITHM_ROADMAP.nodes,
    "arrays_and_strings",
  );

  assert.equal(recommendation.selectedRoadmapNodeId, "hash_map_and_set");
  assert.deepEqual(recommendation.candidateItemIds, ["weak-incorrect"]);
});

test("Algorithms weak area mode uses current roadmap node without attempts", () => {
  const weakItems = [
    makeSelectableAlgorithmItem("weak-default-current", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("weak-default-arrays", "arrays_and_strings", "trace_next_step"),
  ];
  const selected = selectAlgorithmSessionItems({
    attempts: [],
    contentAdapter: makeSelectionAdapter(weakItems),
    mode: "weakArea",
    nodeId: "hash_map_and_set",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), ["weak-default-current"]);
});

test("Algorithms weak area mode selects active implemented items only", () => {
  const weakItems = [
    makeSelectableAlgorithmItem("weak-active", "arrays_and_strings", "trace_next_step"),
    makeAlgorithmSelectionItem("weak-disabled", "arrays_and_strings", "trace_next_step", "disabled"),
    makeSelectableAlgorithmItem("weak-implemented-linked", "linked_list", "trace_next_step"),
    makeSelectableAlgorithmItem("weak-current", "hash_map_and_set", "trace_next_step"),
  ];
  const selected = selectAlgorithmSessionItems({
    attempts: [
      makeSelectionAttempt("attempt-disabled-001", "weak-disabled", "incorrect"),
      makeSelectionAttempt("attempt-linked-001", "weak-implemented-linked", "incorrect"),
      makeSelectionAttempt("attempt-active-001", "weak-active", "incorrect"),
    ],
    contentAdapter: makeSelectionAdapter(weakItems),
    mode: "weakArea",
    nodeId: "hash_map_and_set",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), ["weak-active"]);
});

test("Algorithms practice mode respects progress-unlocked roadmap nodes", () => {
  const practiceItems = [
    makeSelectableAlgorithmItem("practice-complexity", "complexity_and_constraints", "complexity_check"),
    makeSelectableAlgorithmItem("practice-linked-locked-by-progress", "linked_list", "trace_next_step"),
  ];
  const selected = selectAlgorithmSessionItems({
    attempts: [],
    contentAdapter: makeSelectionAdapter(practiceItems),
    mode: "practice",
    nodeId: "complexity_and_constraints",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), ["practice-complexity"]);
});

test("Algorithms practice mode does not unlock multiple nodes from one attempt per prerequisite", () => {
  const practiceItems = [
    makeSelectableAlgorithmItem("practice-complexity", "complexity_and_constraints", "complexity_check"),
    makeSelectableAlgorithmItem("practice-arrays-trace", "arrays_and_strings", "trace_next_step"),
    makeSelectableAlgorithmItem("practice-arrays-edge", "arrays_and_strings", "edge_case_drill"),
    makeSelectableAlgorithmItem("practice-hash-trace", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("practice-hash-primer", "hash_map_and_set", "approach_primer"),
  ];
  const selected = selectAlgorithmSessionItems({
    attempts: [
      makeSelectionAttempt("attempt-complexity-complete-001", "practice-complexity", "correct"),
      makeSelectionAttempt("attempt-arrays-complete-001", "practice-arrays-trace", "correct"),
    ],
    contentAdapter: makeSelectionAdapter(practiceItems),
    mode: "practice",
    nodeId: "complexity_and_constraints",
    sessionLength: 5,
  });

  assert.deepEqual(selected.map((item) => item.id), ["practice-complexity"]);
});

test("Algorithms practice mode excludes weak nodes that are still locked", () => {
  const practiceItems = [
    makeSelectableAlgorithmItem("practice-complexity", "complexity_and_constraints", "complexity_check"),
    makeSelectableAlgorithmItem("practice-arrays", "arrays_and_strings", "trace_next_step"),
    makeSelectableAlgorithmItem("practice-hash-weak", "hash_map_and_set", "trace_next_step"),
    makeSelectableAlgorithmItem("practice-hash-extra", "hash_map_and_set", "approach_primer"),
  ];
  const selected = selectAlgorithmSessionItems({
    attempts: [
      makeSelectionAttempt("attempt-complexity-complete-001", "practice-complexity", "correct"),
      makeSelectionAttempt("attempt-arrays-complete-001", "practice-arrays", "correct"),
      makeSelectionAttempt("attempt-hash-missed-001", "practice-hash-weak", "incorrect"),
    ],
    contentAdapter: makeSelectionAdapter(practiceItems),
    mode: "practice",
    nodeId: "complexity_and_constraints",
    sessionLength: 3,
  });

  assert.deepEqual(selected.map((item) => item.id), ["practice-complexity"]);
});

test("Algorithms practice mode respects evidence-gated availability before session length", () => {
  const practiceItems = [
    makeSelectableAlgorithmItem("practice-complexity", "complexity_and_constraints", "complexity_check"),
    makeSelectableAlgorithmItem("practice-arrays-trace", "arrays_and_strings", "trace_next_step"),
    makeSelectableAlgorithmItem("practice-arrays-edge", "arrays_and_strings", "edge_case_drill"),
    makeSelectableAlgorithmItem("practice-hash", "hash_map_and_set", "approach_primer"),
  ];
  const selected = selectAlgorithmSessionItems({
    attempts: [
      makeSelectionAttempt("attempt-complexity-complete-001", "practice-complexity", "correct"),
      makeSelectionAttempt("attempt-arrays-complete-001", "practice-arrays-trace", "correct"),
    ],
    contentAdapter: makeSelectionAdapter(practiceItems),
    mode: "practice",
    nodeId: "complexity_and_constraints",
    sessionLength: 2,
  });

  assert.deepEqual(selected.map((item) => item.id), ["practice-complexity"]);
});

test("Algorithms default mode keeps current roadmap node selection", () => {
  const selected = selectAlgorithmSessionItems({
    contentAdapter: makeSelectionAdapter([
      makeSelectableAlgorithmItem("default-current", "hash_map_and_set", "trace_next_step"),
      makeSelectableAlgorithmItem("default-other", "two_pointers", "trace_next_step"),
    ]),
    mode: "default",
    nodeId: "hash_map_and_set",
    sessionLength: 10,
  });

  assert.deepEqual(selected.map((item) => item.id), ["default-current"]);
});

test("Algorithms curriculum validation rejects active items on unknown roadmap nodes", () => {
  const track = getTrackDefinition(ALGORITHMS_TRACK_ID);
  const unknownNodeItem = makeBaseAlgorithmItem({
    id: "algorithm-unknown-node-fixture-001",
    roadmapNodeId: "missing_node",
    status: "active",
    staticMicroChecks: [makeStaticMicroCheck()],
  });

  const issueCodes = validateAlgorithmCurriculum({
    enabledSessionModes: track.sessionModes.filter((mode) => mode.enabled),
    items: [...ALGORITHM_TRAINING_ITEMS, unknownNodeItem],
    roadmap: ALGORITHM_ROADMAP,
  }).issues.map((issue) => issue.code);

  assert.ok(issueCodes.includes("active_item_references_unknown_roadmap_node"));
});

test("Algorithms session mode supported item types are canonical and known", () => {
  const track = getTrackDefinition(ALGORITHMS_TRACK_ID);
  const knownItemTypes = new Set<string>(ALGORITHM_TRAINING_ITEM_TYPES);

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
    ...ALGORITHM_TRAINING_ITEM_TYPES,
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
  assert.ok(issueCodes({
    ...makeBaseAlgorithmItem(),
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_and_constraints",
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: "choose_lookup_key",
        role: "primary",
      },
    ],
  }).includes("primary_skill_taxonomy_mismatch"));
  assert.ok(issueCodes({ ...makeBaseAlgorithmItem(), feedbackModel: undefined }).includes("missing_feedback_model"));
  assert.ok(issueCodes({ ...makeBaseAlgorithmItem(), difficulty: undefined }).includes("missing_difficulty"));
  assert.ok(issueCodes({ ...makeBaseAlgorithmItem(), difficulty: "basic" as never }).includes("invalid_difficulty"));
  assert.ok(issueCodes({
    ...makeBaseAlgorithmItem(),
    feedbackModel: {
      ...makeBaseAlgorithmItem().feedbackModel,
      result: "almost_correct" as never,
    },
  }).includes("invalid_feedback_result"));
  assert.ok(issueCodes({
    ...makeBaseAlgorithmItem(),
    feedbackModel: {
      ...makeBaseAlgorithmItem().feedbackModel,
      distractorExplanations: {},
    },
    staticMicroChecks: [makeStaticMicroCheck()],
  }).includes("missing_feedback_distractor_explanation"));
  assert.ok(issueCodes({
    ...makeBaseAlgorithmItem(),
    feedbackModel: {
      ...makeBaseAlgorithmItem().feedbackModel,
      mentalModelCorrection: "Correct because this is correct",
    },
  }).includes("generic_feedback_text"));
  assert.ok(issueCodes({
    ...makeBaseAlgorithmItem(),
    feedbackModel: {
      ...makeBaseAlgorithmItem().feedbackModel,
      distractorExplanations: {
        sort_first: "Use the lookup invariant instead.",
        store_before_check: "Use the lookup invariant instead.",
      },
    },
    staticMicroChecks: [
      {
        ...makeStaticMicroCheck(),
        options: [
          { id: "check_before_store", text: "Check complement before storing the current value." },
          { id: "store_before_check", text: "Store the current value before checking complement." },
          { id: "sort_first", text: "Sort the input before checking complements." },
        ],
      },
    ],
  }).includes("duplicate_feedback_distractor_explanation"));

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

function getActiveAlgorithmItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS.filter((item) => item.status === "active");
}

function getActiveItemCountsByRoadmapNode(): ReadonlyMap<string, number> {
  const counts = new Map<string, number>();

  for (const item of getActiveAlgorithmItems()) {
    assert.ok(item.roadmapNodeId, item.id);
    counts.set(item.roadmapNodeId, (counts.get(item.roadmapNodeId) ?? 0) + 1);
  }

  return counts;
}

function makeBaseAlgorithmItem(overrides: Partial<AlgorithmTrainingItem> = {}): AlgorithmTrainingItem {
  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "Large input means the approach must avoid nested pair enumeration.",
      distractorExplanations: {
        store_before_check: "Use the core rule instead: Check before storing when one input element cannot be reused.",
      },
      mentalModelCorrection: "Use the constraint to reject direct enumeration before choosing a data structure.",
      mistakeTypes: ["complexity_mismatch"],
      nextAction: "Practice one complement-lookup item.",
      result: "diagnostic",
    },
    difficulty: "intro",
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
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
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

function makeSelectableAlgorithmItem(
  id: string,
  roadmapNodeId: string,
  type: AlgorithmTrainingItem["type"],
): AlgorithmTrainingItem {
  return makeAlgorithmSelectionItem(id, roadmapNodeId, type, "active");
}

function makeAlgorithmSelectionItem(
  id: string,
  roadmapNodeId: string,
  type: AlgorithmTrainingItem["type"],
  status: AlgorithmTrainingItem["status"],
): AlgorithmTrainingItem {
  return makeBaseAlgorithmItem({
    id,
    roadmapNodeId,
    status,
    staticMicroChecks: [makeStaticMicroCheck()],
    type,
  });
}

function makeSelectionAdapter(items: readonly AlgorithmTrainingItem[]) {
  const itemsById = new Map(items.map((item) => [item.id, item as TrainingItem]));

  return {
    getContentVersion: () => ALGORITHM_CONTENT_VERSION,
    getItemById: (itemId: string) => itemsById.get(itemId),
    getItems: () => items as readonly TrainingItem[],
    getItemsForMode: (modeId: string) => {
      assert.equal(modeId, "algorithms-roadmap-basics");
      return items as readonly TrainingItem[];
    },
    trackId: ALGORITHMS_TRACK_ID,
  };
}

function makeSelectionAttempt(
  id: string,
  itemId: string,
  result: boolean | "correct" | "partial" | "incorrect",
): TrainingAttempt {
  const status = typeof result === "boolean"
    ? result ? "correct" : "incorrect"
    : result;

  return {
    answeredAt: "2026-07-03T08:00:00.000Z",
    id,
    itemId,
    itemType: "trace_next_step",
    modeId: "algorithms-roadmap-basics",
    response: {
      kind: "option_selection",
      selectedOptionIds: ["check_before_store"],
    },
    result: status === "partial"
      ? {
          earnedPoints: 1,
          isCorrect: false,
          kind: "partial_credit",
          maxPoints: 2,
        }
      : {
          isCorrect: status === "correct",
          kind: "correctness",
        },
    mistakeTypeRefs: status === "correct"
      ? undefined
      : [
          {
            axisId: "mistake_type",
            nodeId: "duplicate_handling_error",
            role: "mistake_type",
            trackId: ALGORITHMS_TRACK_ID,
          },
        ],
    trackId: ALGORITHMS_TRACK_ID,
  };
}

function makeReviewQueueItem(
  id: string,
  itemId: string,
  overrides: Partial<ReviewQueueItem> = {},
): ReviewQueueItem {
  return {
    createdAt: "2026-07-02T08:00:00.000Z",
    dueAt: "2026-07-03T08:00:00.000Z",
    id,
    itemId,
    priority: "normal",
    reasons: ["incorrect_attempt"],
    sourceAttemptId: `attempt:${id}`,
    trackId: ALGORITHMS_TRACK_ID,
    ...overrides,
  };
}
