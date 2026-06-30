import type { TrainingItem } from "../../domain/training";
import { ALGORITHM_APPROACH_TEMPLATES } from "./algorithmApproaches";
import {
  ALGORITHM_CONTENT_VERSION,
  type AlgorithmApproachId,
  type AlgorithmApproachTemplate,
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
    primarySkillAtomId: "recognize_n2_too_slow_for_large_n",
    prompt:
      "n can be 100000. You scan once and keep a lookup of values seen so far. What time and space cost should you expect?",
    roadmapNodeId: "complexity_basics",
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
        testedSkillAtomIds: ["recognize_n2_too_slow_for_large_n"],
        type: "complexity_pair",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_basics",
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
    primarySkillAtomId: "recognize_n2_too_slow_for_large_n",
    prompt:
      "A string task compares each character with its neighbor in one left-to-right pass. Which mechanics describe the work?",
    roadmapNodeId: "array_string_basics",
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
        testedSkillAtomIds: ["recognize_n2_too_slow_for_large_n"],
        type: "multi_select",
      },
    ],
    taxonomyRefs: [
      {
        axisId: "pattern_family",
        nodeId: "complexity_basics",
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
    primarySkillAtomId: "explain_hash_map_average_lookup",
    prompt:
      "For target pair lookup, which action order prevents reusing the same input element?",
    pseudocodeTemplate: hashMapComplementLookup.pseudocodeTemplate,
    roadmapNodeId: "hash_map_lookup",
    secondarySkillAtomIds: ["recognize_n2_too_slow_for_large_n"],
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
        testedSkillAtomIds: ["explain_hash_map_average_lookup"],
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
    primarySkillAtomId: "explain_hash_map_average_lookup",
    prompt:
      "Order the pseudocode for one-pass complement lookup.",
    pseudocodeTemplate: hashMapComplementLookup.pseudocodeTemplate,
    roadmapNodeId: "hash_map_lookup",
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
        testedSkillAtomIds: ["explain_hash_map_average_lookup"],
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
    primarySkillAtomId: "explain_hash_map_average_lookup",
    prompt:
      "Target is 9. Seen values are {2}. The current value is 7. What happens next?",
    roadmapNodeId: "hash_map_lookup",
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
        testedSkillAtomIds: ["explain_hash_map_average_lookup"],
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
    primarySkillAtomId: "choose_two_pointers_for_sorted_pair_condition",
    prompt:
      "Order the subgoals for finding a target pair in a sorted array with two boundaries.",
    roadmapNodeId: "two_pointers_pair_scan",
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
        testedSkillAtomIds: ["choose_two_pointers_for_sorted_pair_condition"],
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
    primarySkillAtomId: "choose_two_pointers_for_sorted_pair_condition",
    prompt:
      "In a sorted array, left + right is less than target. Which pseudocode line runs next?",
    pseudocodeTemplate: sortedTwoPointersPairScan.pseudocodeTemplate,
    roadmapNodeId: "two_pointers_pair_scan",
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
        testedSkillAtomIds: ["choose_two_pointers_for_sorted_pair_condition"],
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
] as const satisfies readonly (AlgorithmTrainingItem & TrainingItem)[];

export function getAlgorithmTrainingItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS;
}

export function getAlgorithmTrainingItemById(itemId: string): AlgorithmTrainingItem | undefined {
  return ALGORITHM_TRAINING_ITEMS.find((item) => item.id === itemId);
}

export function getAlgorithmTrainingItemsForRoadmapNode(
  nodeId: AlgorithmRoadmapNodeId,
): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS.filter((item) => item.roadmapNodeId === nodeId);
}

export function getSeededAlgorithmRoadmapNodes(): readonly AlgorithmRoadmapNode[] {
  const seededNodeIds = new Set<string>(ALGORITHM_TRAINING_ITEMS.map((item) => item.roadmapNodeId));
  return ALGORITHM_ROADMAP.nodes.filter((node) => seededNodeIds.has(node.id));
}

export function getFirstUsableAlgorithmRoadmapNode(): AlgorithmRoadmapNode {
  const node = ALGORITHM_ROADMAP.nodes.find(
    (candidate) =>
      candidate.status === "available" &&
      getAlgorithmTrainingItemsForRoadmapNode(candidate.id).length > 0,
  );

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
