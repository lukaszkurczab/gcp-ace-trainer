import type { TrainingItem } from "../../domain/training";
import { ALGORITHM_APPROACH_TEMPLATES } from "./algorithmApproaches";
import {
  ALGORITHM_CONTENT_VERSION,
  resolveAlgorithmCurriculumAlias,
  type AlgorithmApproachId,
  type AlgorithmApproachTemplate,
  type AlgorithmMistakeType,
  type AlgorithmPatternFamilyId,
  type AlgorithmTrainingItem,
} from "./algorithmContentTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";

export const ALGORITHMS_SESSION_MODE_ID = "algorithms-roadmap-basics";

const hashMapComplementLookup = getApproachTemplate("hash_map_complement_lookup");
const sortedTwoPointersPairScan = getApproachTemplate("sorted_two_pointers_pair_scan");

export const ALGORITHM_TRAINING_ITEMS = [
  {
    complexityExplanation:
      "A single scan visits each input value once. The lookup state can grow with the number of values seen so far.",
    contentVersion: ALGORITHM_CONTENT_VERSION,
    expectedSpaceComplexity: "O(n)",
    expectedTimeComplexity: "O(n)",
    feedbackModel: {
      decisionSignal: "The input limit makes checking every pair too expensive.",
      mentalModelCorrection:
        "Use the constraint first, then choose mechanics that avoid nested pair enumeration.",
      mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
      nextAction: "Compare the cost of one scan with lookup state against checking every pair.",
      result: "diagnostic",
    },
    id: "alg-complexity-constraint-pair-001",
    learningStage: "foundations",
    primarySkillAtomId: "derive_time_complexity",
    prompt:
      "n can be 100000. You scan once and keep a lookup of values seen so far. What time and space cost should you expect?",
    roadmapNodeId: "complexity_and_constraints",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: {
          space: "O(n)",
          time: "O(n)",
        },
        feedback:
          "One pass is linear, and the lookup can store up to n values from the scan.",
        id: "alg-check-complexity-pair-001",
        mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
        prompt: "Choose the time and space pair for a one-pass lookup scan.",
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
        axisId: "mistake_type",
        nodeId: "complexity_mismatch",
        role: "mistake_type",
      },
    ],
    title: "Constraint-first cost check",
    trackId: "algorithms",
    type: "complexity_check",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "The mechanics are a left-to-right scan with index boundaries.",
      mentalModelCorrection:
        "Name the movement and state before choosing a larger strategy.",
      mistakeTypes: ["constraint_ignored", "edge_case_missed"],
      nextAction: "Separate scan mechanics from nested enumeration.",
      result: "diagnostic",
    },
    id: "alg-array-string-naming-001",
    learningStage: "foundations",
    primarySkillAtomId: "track_index_boundary",
    prompt:
      "A string task compares each character with its neighbor in one left-to-right pass. Which mechanics describe the work?",
    roadmapNodeId: "arrays_and_strings",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: ["linear_scan", "index_boundary"],
        feedback:
          "This is one pass over adjacent positions, so the useful names are scan and boundary tracking.",
        id: "alg-check-array-naming-001",
        mistakeTypes: ["constraint_ignored", "edge_case_missed"],
        options: [
          { id: "linear_scan", text: "Linear scan" },
          { id: "index_boundary", text: "Index boundary tracking" },
          { id: "nested_pair_enumeration", text: "Nested pair enumeration" },
          { id: "global_sorting", text: "Sorting before scanning" },
        ],
        prompt: "Select the mechanics that match the one-pass neighbor comparison.",
        status: "active",
        testedSkillAtomIds: ["track_index_boundary"],
        type: "multi_select",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "arrays_and_strings",
        role: "primary",
      },
    ],
    title: "Name basic array and string mechanics",
    trackId: "algorithms",
    type: "approach_naming",
  },
  {
    approachId: "hash_map_complement_lookup",
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "A complement can be checked against values already scanned.",
      mentalModelCorrection:
        "Check prior state before storing the current value when one element cannot be reused.",
      mistakeTypes: ["duplicate_handling_error", "data_structure_mismatch"],
      nextAction: "Trace the check-before-store order on a small pair example.",
      result: "diagnostic",
    },
    id: "alg-hash-map-primer-001",
    invariant: requiredFirst(hashMapComplementLookup.invariants, "hash map invariant"),
    learningStage: "pattern_mechanics",
    mechanicsSummary:
      "For each value, derive the needed complement, check prior lookup state, then store the current value for later positions.",
    pitfalls: hashMapComplementLookup.pitfalls,
    primarySkillAtomId: "choose_lookup_key",
    prompt:
      "For target pair lookup, which action order prevents reusing the same input element?",
    pseudocodeTemplate: hashMapComplementLookup.pseudocodeTemplate,
    roadmapNodeId: "hash_map_and_set",
    secondarySkillAtomIds: ["derive_time_complexity"],
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "check_complement_first",
        feedback:
          "Check the complement against prior values first, then store the current value.",
        id: "alg-check-hash-primer-001",
        mistakeTypes: ["duplicate_handling_error"],
        options: [
          { id: "check_complement_first", text: "Check the complement before storing the current value." },
          { id: "store_current_first", text: "Store the current value before checking the complement." },
          { id: "sort_then_lookup", text: "Sort the input before every lookup." },
        ],
        prompt: "Choose the safe order for one-pass complement lookup.",
        status: "active",
        testedSkillAtomIds: ["choose_lookup_key"],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "hash_map_and_set",
        role: "primary",
      },
      {
        axisId: "problem_archetype",
        nodeId: "find_pair_with_condition",
        role: "secondary",
      },
    ],
    title: "Hash map complement lookup primer",
    trackId: "algorithms",
    type: "approach_primer",
    whenNotToUseSignals: hashMapComplementLookup.whenNotToUseSignals,
    whenToUseSignals: hashMapComplementLookup.whenToUseSignals,
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "Complement lookup needs a fixed order of state updates.",
      mentalModelCorrection:
        "Write the mechanics as ordered steps before translating them into code.",
      mistakeTypes: ["subgoal_order_wrong", "duplicate_handling_error"],
      nextAction: "Place lookup before storing the current value.",
      result: "diagnostic",
    },
    id: "alg-hash-map-pseudocode-order-001",
    learningStage: "pattern_mechanics",
    primarySkillAtomId: "choose_lookup_key",
    prompt:
      "Order the pseudocode for one-pass complement lookup.",
    pseudocodeTemplate: hashMapComplementLookup.pseudocodeTemplate,
    roadmapNodeId: "hash_map_and_set",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: [
          "create_lookup",
          "scan_values",
          "derive_complement",
          "check_lookup",
          "store_current",
          "return_none",
        ],
        feedback:
          "The lookup must exist before scanning, and the current value is stored only after its complement is checked.",
        id: "alg-check-hash-pseudocode-order-001",
        mistakeTypes: ["subgoal_order_wrong", "duplicate_handling_error"],
        options: [
          { id: "create_lookup", text: "Create an empty lookup." },
          { id: "scan_values", text: "Scan each value in the input." },
          { id: "derive_complement", text: "Compute the needed complement." },
          { id: "check_lookup", text: "Check whether the complement was seen earlier." },
          { id: "store_current", text: "Store the current value for later checks." },
          { id: "return_none", text: "Return no pair if the scan finishes." },
        ],
        prompt: "Tap the steps in the correct order.",
        status: "active",
        testedSkillAtomIds: ["choose_lookup_key"],
        type: "order_steps",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "hash_map_and_set",
        role: "primary",
      },
      {
        axisId: "mistake_type",
        nodeId: "subgoal_order_wrong",
        role: "mistake_type",
      },
    ],
    title: "Order complement lookup pseudocode",
    trackId: "algorithms",
    type: "pseudocode_ordering",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "The needed complement is already present in prior lookup state.",
      mentalModelCorrection:
        "At each value, inspect the lookup before changing it.",
      mistakeTypes: ["cannot_trace_algorithm", "duplicate_handling_error"],
      nextAction: "Trace one more value and name the lookup state before the update.",
      result: "diagnostic",
    },
    id: "alg-hash-map-trace-next-001",
    learningStage: "pattern_mechanics",
    primarySkillAtomId: "choose_lookup_key",
    prompt:
      "Target is 9. Seen values are {2}. The current value is 7. What happens next?",
    roadmapNodeId: "hash_map_and_set",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "return_pair",
        feedback:
          "The complement for 7 is 2, and 2 is already in the lookup, so the pair is found.",
        id: "alg-check-hash-trace-next-001",
        mistakeTypes: ["cannot_trace_algorithm"],
        options: [
          { id: "return_pair", text: "Return or record the pair because 2 was already seen." },
          { id: "store_7", text: "Store 7 and continue without checking 2." },
          { id: "move_right_pointer", text: "Move a right boundary inward." },
        ],
        prompt: "Choose the next trace step.",
        status: "active",
        testedSkillAtomIds: ["choose_lookup_key"],
        type: "trace_next_step",
      },
    ],
    stepByStepTrace: [
      {
        description: "The scan has stored 2 from an earlier position.",
        id: "hash-trace-seen-2",
        order: 1,
        state: ["seen = {2}", "current = 7", "target = 9"],
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "hash_map_and_set",
        role: "primary",
      },
      {
        axisId: "mistake_type",
        nodeId: "cannot_trace_algorithm",
        role: "mistake_type",
      },
    ],
    title: "Trace the next complement lookup step",
    trackId: "algorithms",
    type: "trace_next_step",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "Sorted pair comparison decides which boundary can move.",
      mentalModelCorrection:
        "Establish the sorted-boundary invariant before choosing pointer movement.",
      mistakeTypes: ["subgoal_order_wrong", "off_by_one"],
      nextAction: "Order the setup, comparison, and boundary movement steps.",
      result: "diagnostic",
    },
    id: "alg-two-pointers-subgoal-order-001",
    learningStage: "pattern_mechanics",
    primarySkillAtomId: "move_decisive_pointer",
    prompt:
      "Order the subgoals for finding a target pair in a sorted array with two boundaries.",
    roadmapNodeId: "two_pointers",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: [
          "confirm_sorted",
          "set_boundaries",
          "compare_pair",
          "move_left_if_small",
          "move_right_if_large",
        ],
        feedback:
          "Confirm ordered input, set boundaries, compare the pair, then move the boundary ruled out by the comparison.",
        id: "alg-check-two-pointers-subgoal-order-001",
        mistakeTypes: ["subgoal_order_wrong", "off_by_one"],
        options: [
          { id: "confirm_sorted", text: "Confirm the input is sorted or can be ordered safely." },
          { id: "set_boundaries", text: "Set left to the first value and right to the last value." },
          { id: "compare_pair", text: "Compare the pair sum with the target." },
          { id: "move_left_if_small", text: "If the sum is too small, move left forward." },
          { id: "move_right_if_large", text: "If the sum is too large, move right backward." },
        ],
        prompt: "Tap the subgoals in order.",
        status: "active",
        testedSkillAtomIds: ["move_decisive_pointer"],
        type: "order_steps",
      },
    ],
    subgoals: sortedTwoPointersPairScan.steps,
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "two_pointers",
        role: "primary",
      },
      {
        axisId: "problem_archetype",
        nodeId: "find_pair_with_condition",
        role: "secondary",
      },
    ],
    title: "Order sorted pair scan subgoals",
    trackId: "algorithms",
    type: "subgoal_ordering",
  },
  {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: "When the pair is too small, the smaller boundary is the one that can improve the sum.",
      mentalModelCorrection:
        "Use the comparison result to pick the next pseudocode line.",
      mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
      nextAction: "Trace the same comparison with a sum that is too large.",
      result: "diagnostic",
    },
    id: "alg-two-pointers-pseudocode-line-001",
    learningStage: "pattern_mechanics",
    primarySkillAtomId: "move_decisive_pointer",
    prompt:
      "In a sorted array, left + right is less than target. Which pseudocode line runs next?",
    pseudocodeTemplate: sortedTwoPointersPairScan.pseudocodeTemplate,
    roadmapNodeId: "two_pointers",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "line-5",
        feedback:
          "A sum that is too small rules out the current left value, so left moves forward.",
        id: "alg-check-two-pointers-line-001",
        mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
        options: sortedTwoPointersPairScan.pseudocodeTemplate.lines.map((line) => ({
          id: line.id,
          text: line.text,
        })),
        prompt: "Select the pseudocode line that matches the next move.",
        status: "active",
        testedSkillAtomIds: ["move_decisive_pointer"],
        type: "select_pseudocode_line",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "two_pointers",
        role: "primary",
      },
      {
        axisId: "mistake_type",
        nodeId: "off_by_one",
        role: "mistake_type",
      },
    ],
    title: "Select the next two-pointer line",
    trackId: "algorithms",
    type: "pseudocode_ordering",
  },
  makeSingleChoiceDemoItem({
    correctText: "Keep a range state and move boundaries only when the invariant says to shrink.",
    familyId: "sliding_window",
    id: "alg-demo-sliding-window-invariant-001",
    mistakeTypes: ["invariant_missing", "invariant_broken"],
    nodeId: "sliding_window",
    prompt: "A contiguous positive-number range grows past its allowed sum. Which reasoning should guide the next move?",
    skillAtomId: "maintain_window_invariant",
    title: "Identify the window invariant",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior.",
    familyId: "prefix_sums",
    id: "alg-demo-prefix-window-failure-001",
    mistakeTypes: ["negative_numbers_assumption_error", "wrong_approach"],
    nodeId: "prefix_sums",
    prompt: "A subarray-sum task allows negative values. Which signal should make you question a simple sum window?",
    skillAtomId: "detect_window_failure_signal",
    title: "Detect when a window fails",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Sorting may reveal structure, but its cost and any lost original-position requirement must be checked.",
    familyId: "sorting_based",
    id: "alg-demo-sorting-tradeoff-001",
    mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
    nodeId: "sorting_based",
    prompt: "Before sorting an input to simplify comparisons, what tradeoff should you check first?",
    skillAtomId: "recognize_sorting_tradeoff",
    title: "Recognize sorting tradeoff",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Use the most recent unresolved opening state to decide whether the next closing token is valid.",
    familyId: "stack",
    id: "alg-demo-stack-unresolved-state-001",
    mistakeTypes: ["data_structure_mismatch", "cannot_trace_algorithm"],
    nodeId: "stack",
    prompt: "A nested-structure scan sees a closing token. Which state should control the next decision?",
    skillAtomId: "use_last_unresolved_state",
    title: "Use last unresolved state",
  }),
  makeSingleChoiceDemoItem({
    correctText: "A repeated yes/no boundary lets each check discard part of the ordered search space.",
    familyId: "binary_search",
    id: "alg-demo-binary-search-predicate-001",
    mistakeTypes: ["wrong_approach", "off_by_one"],
    nodeId: "binary_search",
    prompt: "Which signal makes binary search more appropriate than scanning each position?",
    skillAtomId: "identify_monotonic_predicate",
    title: "Identify a monotonic predicate",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Choose the approach by matching problem signals to required state, then justify the tradeoff.",
    familyId: "hash_map_and_set",
    id: "alg-demo-strategy-core-001",
    mistakeTypes: ["wrong_approach", "cannot_explain_why"],
    nodeId: "strategy_selection_core",
    prompt: "When several familiar approaches could fit, what should decide the strategy?",
    skillAtomId: "choose_lookup_key",
    title: "Choose from core approaches",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Use lookup when preserving original relationships matters more than ordering the whole input.",
    familyId: "hash_map_and_set",
    id: "alg-demo-contrast-hash-sorting-001",
    mistakeTypes: ["wrong_approach", "data_structure_mismatch"],
    nodeId: "contrast_hash_map_vs_sorting",
    prompt: "A pair task needs fast membership checks and original positions still matter. Which contrast signal is strongest?",
    skillAtomId: "choose_lookup_key",
    title: "Contrast lookup with sorting",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Use window reasoning only when the answer is a contiguous range with maintainable state.",
    familyId: "sliding_window",
    id: "alg-demo-contrast-pointers-window-001",
    mistakeTypes: ["wrong_approach", "invariant_missing"],
    nodeId: "contrast_two_pointers_vs_sliding_window",
    prompt: "What separates a sliding-window problem from a two-boundary pair scan?",
    skillAtomId: "maintain_window_invariant",
    title: "Contrast pointers with window",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Prefix sums handle range totals when window movement no longer gives a safe invariant.",
    familyId: "prefix_sums",
    id: "alg-demo-contrast-window-prefix-001",
    mistakeTypes: ["negative_numbers_assumption_error", "invariant_broken"],
    nodeId: "contrast_sliding_window_vs_prefix_sums",
    prompt: "Which signal should push a range-sum problem away from sliding window and toward prefix state?",
    skillAtomId: "detect_window_failure_signal",
    title: "Contrast window with prefix sums",
  }),
  makeSingleChoiceDemoItem({
    correctText: "A monotonic stack keeps unresolved elements ordered so future values can resolve boundaries.",
    familyId: "monotonic_stack",
    id: "alg-demo-contrast-stack-monotonic-001",
    mistakeTypes: ["invariant_missing", "cannot_trace_algorithm"],
    nodeId: "contrast_stack_vs_monotonic_stack_intro",
    prompt: "What makes a monotonic stack different from a basic last-in-first-out stack?",
    skillAtomId: "maintain_monotonic_stack_invariant",
    title: "Contrast stack variants",
  }),
  makeSingleChoiceDemoItem({
    correctText: "Binary search needs ordered elimination; a plain scan is safer when no boundary can be discarded.",
    familyId: "binary_search",
    id: "alg-demo-contrast-binary-linear-001",
    mistakeTypes: ["wrong_approach", "constraint_ignored"],
    nodeId: "contrast_binary_search_vs_linear_scan",
    prompt: "What must be true before replacing a linear scan with binary search?",
    skillAtomId: "identify_monotonic_predicate",
    title: "Contrast binary search with scan",
  }),
] as const satisfies readonly (AlgorithmTrainingItem & TrainingItem)[];

export function getAlgorithmTrainingItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS;
}

export function getActiveAlgorithmTrainingItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS.filter((item) => item.status === "active");
}

export function getAlgorithmTrainingItemById(itemId: string): AlgorithmTrainingItem | undefined {
  return ALGORITHM_TRAINING_ITEMS.find((item) => item.id === itemId);
}

export function getAlgorithmTrainingItemsForRoadmapNode(
  nodeId: AlgorithmRoadmapNodeId,
): readonly AlgorithmTrainingItem[] {
  const canonicalNodeId = resolveAlgorithmCurriculumAlias("roadmap_node", nodeId);
  return getActiveAlgorithmTrainingItems().filter((item) => item.roadmapNodeId === canonicalNodeId);
}

export function getSeededAlgorithmRoadmapNodes(): readonly AlgorithmRoadmapNode[] {
  const seededNodeIds = new Set<string>(
    getActiveAlgorithmTrainingItems()
      .map((item) => item.roadmapNodeId)
      .filter((nodeId): nodeId is string => typeof nodeId === "string"),
  );
  return ALGORITHM_ROADMAP.nodes.filter((node) => seededNodeIds.has(node.id));
}

export function isAlgorithmRoadmapNodeSelectable(node: AlgorithmRoadmapNode): boolean {
  return (
    node.status === "available" &&
    getAlgorithmTrainingItemsForRoadmapNode(node.id).length >= node.minimumDemoItemCount
  );
}

export function getFirstUsableAlgorithmRoadmapNode(): AlgorithmRoadmapNode {
  const node = ALGORITHM_ROADMAP.nodes.find(isAlgorithmRoadmapNodeSelectable);

  if (!node) {
    throw new Error("No usable Algorithms roadmap node has seeded items.");
  }

  return node;
}

function getApproachTemplate(approachId: AlgorithmApproachId): AlgorithmApproachTemplate {
  const template = ALGORITHM_APPROACH_TEMPLATES.find((approach) => approach.id === approachId);

  if (!template) {
    throw new Error(`Missing Algorithms approach template: ${approachId}`);
  }

  return template;
}

function requiredFirst<T>(items: readonly T[], label: string): T {
  const item = items[0];

  if (!item) {
    throw new Error(`Missing ${label}.`);
  }

  return item;
}

function makeSingleChoiceDemoItem(input: {
  correctText: string;
  familyId: AlgorithmPatternFamilyId;
  id: string;
  mistakeTypes: readonly AlgorithmMistakeType[];
  nodeId: AlgorithmRoadmapNodeId;
  prompt: string;
  skillAtomId: string;
  title: string;
}): AlgorithmTrainingItem & TrainingItem {
  return {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: input.prompt,
      mentalModelCorrection: input.correctText,
      mistakeTypes: input.mistakeTypes,
      nextAction: "Practice one more item that asks for the deciding signal before implementation details.",
      result: "diagnostic",
    },
    id: input.id,
    learningStage: "strategy_selection",
    primarySkillAtomId: input.skillAtomId,
    prompt: input.prompt,
    roadmapNodeId: input.nodeId,
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "expected_signal",
        feedback: input.correctText,
        id: `${input.id}-check`,
        mistakeTypes: input.mistakeTypes,
        options: [
          { id: "expected_signal", text: input.correctText },
          { id: "label_only", text: "Choose by matching the nearest pattern label only." },
          { id: "implementation_first", text: "Start coding first and infer the strategy later." },
        ],
        prompt: "Choose the reasoning signal that should guide the strategy.",
        status: "active",
        testedSkillAtomIds: [input.skillAtomId],
        type: "single_choice",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: input.familyId,
        role: "primary",
      },
      {
        axisId: "skill_atom",
        nodeId: input.skillAtomId,
        role: "primary",
      },
    ],
    title: input.title,
    trackId: "algorithms",
    type: "approach_naming",
  };
}
