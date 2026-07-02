import type { TrainingItem } from "../../domain/training";
import { ALGORITHM_APPROACH_TEMPLATES } from "./algorithmApproaches";
import {
  ALGORITHM_CONTENT_VERSION,
  type AlgorithmApproachId,
  type AlgorithmApproachTemplate,
  type AlgorithmComplexityClass,
  type AlgorithmMistakeType,
  type AlgorithmPatternFamilyId,
  type AlgorithmStaticMicroCheck,
  type AlgorithmTrainingItem,
} from "./algorithmContentTypes";
import {
  ALGORITHM_ROADMAP,
  type AlgorithmRoadmapNode,
  type AlgorithmRoadmapNodeId,
} from "./algorithmRoadmap";

export const ALGORITHMS_SESSION_MODE_ID = "algorithms-roadmap-basics";

const hashMapComplementLookup = getApproachTemplate("hash_map_complement_lookup");
const pairScanSortedInput = getApproachTemplate("pair_scan_sorted_input");

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
      {
        axisId: "skill_atom",
        nodeId: "derive_time_complexity",
        role: "primary",
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
      {
        axisId: "skill_atom",
        nodeId: "track_index_boundary",
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
      {
        axisId: "skill_atom",
        nodeId: "choose_lookup_key",
        role: "primary",
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
      {
        axisId: "skill_atom",
        nodeId: "choose_lookup_key",
        role: "primary",
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
      {
        axisId: "skill_atom",
        nodeId: "choose_lookup_key",
        role: "primary",
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
    subgoals: pairScanSortedInput.steps,
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
      {
        axisId: "skill_atom",
        nodeId: "move_decisive_pointer",
        role: "primary",
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
    pseudocodeTemplate: pairScanSortedInput.pseudocodeTemplate,
    roadmapNodeId: "two_pointers",
    status: "active",
    staticMicroChecks: [
      {
        correctAnswer: "line-5",
        feedback:
          "A sum that is too small rules out the current left value, so left moves forward.",
        id: "alg-check-two-pointers-line-001",
        mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
        options: pairScanSortedInput.pseudocodeTemplate.lines.map((line) => ({
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
      {
        axisId: "skill_atom",
        nodeId: "move_decisive_pointer",
        role: "primary",
      },
    ],
    title: "Select the next two-pointer line",
    trackId: "algorithms",
    type: "pseudocode_ordering",
  },
  ...makeCoreContentItems([
    {
      correctText: "For n near 100000, any plan that checks every pair performs far too many operations.",
      familyId: "complexity_and_constraints",
      id: "alg-complexity-reject-quadratic-001",
      itemType: "approach_naming",
      mistakeTypes: ["brute_force_when_optimized_required", "constraint_ignored"],
      nodeId: "complexity_and_constraints",
      prompt: "An input can contain 100000 numbers, and a candidate plan compares each number with every later number. What signal matters first?",
      skillAtomId: "derive_time_complexity",
      title: "Reject an infeasible pair scan",
      variantId: "input_size_constraints",
      wrongTexts: [
        "The pair checks are acceptable because the code is short.",
        "The input values matter more than the number of pair checks.",
      ],
    },
    {
      checkType: "complexity_pair",
      complexityAnswer: { space: "O(1)", time: "O(n^2)" },
      complexityExplanation: "The outer position can pair with many later positions, so the total comparisons grow quadratically while only counters are stored.",
      correctText: "Nested pair enumeration takes quadratic time and constant extra space.",
      expectedSpaceComplexity: "O(1)",
      expectedTimeComplexity: "O(n^2)",
      familyId: "complexity_and_constraints",
      id: "alg-complexity-nested-pairs-001",
      itemType: "complexity_check",
      mistakeTypes: ["complexity_mismatch"],
      nodeId: "complexity_and_constraints",
      prompt: "A routine checks every unordered pair in an array and stores only the best score. What are the time and extra space costs?",
      skillAtomId: "derive_time_complexity",
      title: "Cost a nested pair routine",
      variantId: "big_o_basics",
    },
    {
      correctText: "A set trades extra memory for one pass when membership checks are the repeated operation.",
      familyId: "complexity_and_constraints",
      id: "alg-complexity-space-tradeoff-001",
      itemType: "solution_comparison",
      mistakeTypes: ["complexity_mismatch", "cannot_explain_why"],
      nodeId: "complexity_and_constraints",
      prompt: "One plan scans with a set of seen values; another repeats a scan for each value. What comparison explains the better scaling plan?",
      skillAtomId: "derive_time_complexity",
      title: "Compare time and space tradeoff",
      variantId: "time_vs_space_tradeoff",
      wrongTexts: [
        "Avoid all extra memory even if repeated scans dominate runtime.",
        "Choose the plan with fewer lines before estimating operation count.",
      ],
    },
    {
      correctText: "Count the loop body cost too; an expensive helper inside a scan can change the total cost.",
      familyId: "complexity_and_constraints",
      id: "alg-complexity-hidden-cost-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
      nodeId: "complexity_and_constraints",
      prompt: "A single loop over n strings calls a helper that scans the current string. What should you check before calling it linear in n?",
      skillAtomId: "derive_time_complexity",
      title: "Notice hidden operation cost",
      variantId: "operations_cost",
      wrongTexts: [
        "A single outer loop is always O(n) regardless of the work inside.",
        "String length does not matter once the loop count is known.",
      ],
    },
    {
      correctText: "Start from the input limit, estimate the repeated work, then choose a plan with acceptable growth.",
      familyId: "complexity_and_constraints",
      id: "alg-complexity-subgoal-order-001",
      itemType: "subgoal_ordering",
      mistakeTypes: ["subgoal_order_wrong", "constraint_ignored"],
      nodeId: "complexity_and_constraints",
      orderedOptions: [
        { id: "read_limit", text: "Read the largest input size." },
        { id: "count_repeated_work", text: "Count how often the repeated operation can run." },
        { id: "estimate_growth", text: "Translate the count into time and space growth." },
        { id: "choose_viable_plan", text: "Keep only plans whose growth fits the limit." },
      ],
      prompt: "Order the reasoning steps for using constraints before choosing a strategy.",
      skillAtomId: "derive_time_complexity",
      title: "Order constraint reasoning",
      variantId: "input_size_constraints",
    },
    {
      correctIds: ["index_boundary", "duplicate_state"],
      correctText: "Indexed scans should name boundary movement and duplicate-sensitive state before choosing larger mechanics.",
      familyId: "arrays_and_strings",
      id: "alg-array-string-scan-signals-001",
      itemType: "approach_naming",
      mistakeTypes: ["edge_case_missed", "off_by_one"],
      nodeId: "arrays_and_strings",
      options: [
        { id: "index_boundary", text: "Track the valid index boundary." },
        { id: "duplicate_state", text: "Track whether duplicates change the result." },
        { id: "discard_order", text: "Discard original order before scanning." },
        { id: "skip_empty", text: "Assume empty input cannot occur." },
      ],
      prompt: "A string scan compares each character with nearby characters and must handle repeated characters. Which mechanics should be named first?",
      skillAtomId: "track_index_boundary",
      title: "Name indexed scan signals",
      variantId: "indexed_scan",
    },
    {
      checkType: "trace_next_step",
      correctText: "Move to index 3 because index 2 was processed and the boundary remains within the string.",
      familyId: "arrays_and_strings",
      id: "alg-array-string-trace-index-001",
      itemType: "trace_next_step",
      mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
      nodeId: "arrays_and_strings",
      prompt: "A scan has just compared s[2] with s[1] in a five-character string. What is the next safe index move?",
      skillAtomId: "track_index_boundary",
      title: "Trace the next index",
      variantId: "indexed_scan",
      wrongTexts: [
        "Jump to index 4 because only the last character matters.",
        "Move back to index 1 because it was used in the comparison.",
      ],
    },
    {
      correctText: "Check empty and length-one inputs before reading a neighbor index.",
      familyId: "arrays_and_strings",
      id: "alg-array-string-edge-neighbor-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["empty_input_error", "off_by_one"],
      nodeId: "arrays_and_strings",
      prompt: "A neighbor-comparison routine reads s[i - 1]. Which edge case must be handled before the loop body runs?",
      skillAtomId: "track_index_boundary",
      title: "Guard neighbor access",
      variantId: "indexed_scan",
      wrongTexts: [
        "Only duplicate characters need a guard.",
        "The first index can always read the previous character.",
      ],
    },
    {
      correctText: "Keep counts when the question depends on how many times each value appears.",
      familyId: "arrays_and_strings",
      id: "alg-array-string-frequency-signal-001",
      itemType: "strategy_choice",
      mistakeTypes: ["data_structure_mismatch", "edge_case_missed"],
      nodeId: "arrays_and_strings",
      prompt: "A task asks whether two short strings use the same characters with the same frequencies. Which state best matches the signal?",
      skillAtomId: "track_index_boundary",
      title: "Choose frequency state",
      variantId: "frequency_counting",
      wrongTexts: [
        "Track only the first and last characters.",
        "Sort positions by index distance before counting.",
      ],
    },
    {
      familyId: "hash_map_and_set",
      id: "alg-hash-map-worked-badge-pair-001",
      itemType: "worked_example",
      mistakeTypes: ["duplicate_handling_error", "cannot_explain_why"],
      nodeId: "hash_map_and_set",
      problemStatement: "Given badge values and a target, identify whether two different badges can sum to the target.",
      prompt: "Worked example: badges are [4, 11, 6, 2], target is 8. Which step proves the pair is found without reusing one badge?",
      skillAtomId: "choose_lookup_key",
      title: "Worked example: badge pair lookup",
      variantId: "complement_lookup",
      correctText: "At value 2, the needed value 6 is already in seen state from an earlier position.",
      wrongTexts: [
        "Store 2 first and pair it with itself.",
        "Sort the badges before checking whether original positions still matter.",
      ],
      workedExample: {
        approachChoiceReason: "Each badge needs a fast check for the value that completes the target while preserving different positions.",
        approachId: "hash_map_complement_lookup",
        complexityExplanation: "Each badge is scanned once, and seen state can store every earlier badge.",
        constraints: ["Badge count can be large.", "A badge cannot pair with itself."],
        expectedSpaceComplexity: "O(n)",
        expectedTimeComplexity: "O(n)",
      },
    },
    {
      correctText: "Store the normalized key as the map key and append the original word to that key's group.",
      familyId: "hash_map_and_set",
      id: "alg-hash-map-group-key-001",
      itemType: "approach_naming",
      mistakeTypes: ["data_structure_mismatch", "cannot_explain_why"],
      nodeId: "hash_map_and_set",
      prompt: "Words need to be grouped when their sorted letters match. What should the lookup key represent?",
      skillAtomId: "choose_lookup_key",
      title: "Choose a grouping key",
      variantId: "grouping_by_key",
      wrongTexts: [
        "Use the current index as the key because each word has one position.",
        "Use the first character only because it is quick to read.",
      ],
    },
    {
      checkType: "trace_next_step",
      correctText: "Record that 5 has now been seen, because the current value did not complete the condition.",
      familyId: "hash_map_and_set",
      id: "alg-hash-map-trace-store-001",
      itemType: "trace_next_step",
      mistakeTypes: ["cannot_trace_algorithm", "duplicate_handling_error"],
      nodeId: "hash_map_and_set",
      prompt: "Target is 12. Seen values are {3, 8}. Current value is 5. The needed value is 7, which is not seen. What happens next?",
      skillAtomId: "choose_lookup_key",
      title: "Trace a non-match lookup update",
      variantId: "seen_set",
      wrongTexts: [
        "Return a pair because 5 is now available.",
        "Clear the seen state because this value did not match.",
      ],
    },
    {
      familyId: "two_pointers",
      id: "alg-two-pointers-primer-001",
      itemType: "approach_primer",
      mistakeTypes: ["wrong_approach", "off_by_one"],
      nodeId: "two_pointers",
      prompt: "For a sorted pair-sum task, which comparison result tells the left boundary to move forward?",
      skillAtomId: "move_decisive_pointer",
      title: "Sorted pair scan primer",
      variantId: "pair_scan_sorted_input",
      correctText: "When the pair sum is too small, the smaller boundary must move forward.",
      wrongTexts: [
        "When the pair sum is too small, move the larger boundary backward.",
        "Move both boundaries after every comparison.",
      ],
      approachPrimer: {
        approachId: "pair_scan_sorted_input",
      },
    },
    {
      familyId: "two_pointers",
      id: "alg-two-pointers-worked-shelf-gap-001",
      itemType: "worked_example",
      mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
      nodeId: "two_pointers",
      problemStatement: "Given sorted shelf widths and a target width, find whether two different shelves fit exactly together.",
      prompt: "Worked example: sorted widths are [1, 3, 4, 8, 10], target is 11. Which move follows the first comparison?",
      skillAtomId: "move_decisive_pointer",
      title: "Worked example: shelf pair scan",
      variantId: "opposite_ends",
      correctText: "1 + 10 equals 11, so the pair is found before either boundary moves.",
      wrongTexts: [
        "Move left because the first value is the smallest.",
        "Move right because the last value was used.",
      ],
      workedExample: {
        approachChoiceReason: "Sorted order lets each pair comparison decide whether a boundary can be discarded.",
        approachId: "pair_scan_sorted_input",
        complexityExplanation: "Each boundary moves inward at most n total steps, with constant extra state.",
        constraints: ["Widths are already sorted.", "Two different shelves must be used."],
        expectedSpaceComplexity: "O(1)",
        expectedTimeComplexity: "O(n)",
      },
    },
    {
      checkType: "trace_next_step",
      correctText: "Move the right boundary backward because the current pair sum is too large.",
      familyId: "two_pointers",
      id: "alg-two-pointers-trace-large-001",
      itemType: "trace_next_step",
      mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
      nodeId: "two_pointers",
      prompt: "Sorted values are [2, 5, 9, 14], target is 12. left is 2 and right is 14. What happens next?",
      skillAtomId: "move_decisive_pointer",
      title: "Trace a too-large pair",
      variantId: "opposite_ends",
      wrongTexts: [
        "Move left forward because the left value is smaller.",
        "Return the pair because both values are valid numbers.",
      ],
    },
    {
      correctText: "Sorting can enable two pointers only if the answer does not require original order to remain untouched.",
      familyId: "two_pointers",
      id: "alg-two-pointers-sorting-precondition-001",
      itemType: "strategy_choice",
      mistakeTypes: ["wrong_approach", "constraint_ignored"],
      nodeId: "two_pointers",
      prompt: "A pair task is not sorted, but the answer only asks for the values, not original positions. What precondition makes a two-boundary scan plausible?",
      secondarySkillAtomIds: ["recognize_sorting_tradeoff"],
      skillAtomId: "move_decisive_pointer",
      title: "Check two-pointer preconditions",
      variantId: "sort_then_two_pointers",
      wrongTexts: [
        "Two pointers require the original input to be unsorted.",
        "A two-boundary scan works on any order if both ends are checked.",
      ],
    },
    {
      correctText: "Skip repeated boundary values only after the current value has been processed.",
      familyId: "two_pointers",
      id: "alg-two-pointers-duplicate-edge-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["duplicate_handling_error", "off_by_one"],
      nodeId: "two_pointers",
      prompt: "A sorted pair scan must report unique value pairs. When is duplicate skipping safe?",
      skillAtomId: "move_decisive_pointer",
      title: "Handle duplicate pointer values",
      variantId: "duplicate_skipping",
      wrongTexts: [
        "Skip every duplicate before checking the first occurrence.",
        "Never skip duplicates, even after recording a pair.",
      ],
    },
    {
      familyId: "sliding_window",
      id: "alg-sliding-window-primer-001",
      itemType: "approach_primer",
      mistakeTypes: ["invariant_missing", "invariant_broken"],
      nodeId: "sliding_window",
      prompt: "A positive-number range sum is over the limit after adding the right value. Which invariant action comes next?",
      skillAtomId: "maintain_window_invariant",
      title: "Positive window primer",
      variantId: "variable_size_positive_numbers",
      correctText: "Remove left-side values until the current range satisfies the required condition again.",
      wrongTexts: [
        "Record the current range before restoring the condition.",
        "Move both boundaries to the next index immediately.",
      ],
      approachPrimer: {
        approachId: "positive_sliding_window",
      },
    },
    {
      familyId: "sliding_window",
      id: "alg-sliding-window-worked-sensor-range-001",
      itemType: "worked_example",
      mistakeTypes: ["invariant_missing", "cannot_trace_algorithm"],
      nodeId: "sliding_window",
      problemStatement: "Given positive sensor readings, find the shortest contiguous range whose total reaches at least a limit.",
      prompt: "Worked example: readings are [2, 1, 5, 2], limit is 6. After adding 5, which range should be considered?",
      skillAtomId: "maintain_window_invariant",
      title: "Worked example: sensor window",
      variantId: "variable_size_positive_numbers",
      correctText: "The range [2, 1, 5] reaches the limit, then the left side can shrink while the condition remains true.",
      wrongTexts: [
        "Discard 5 because adding it crossed the limit.",
        "Reset the range after every reading.",
      ],
      workedExample: {
        approachChoiceReason: "Positive readings make expansion and shrinkage predictable for the range total.",
        approachId: "positive_sliding_window",
        complexityExplanation: "Each boundary moves forward through the readings at most once.",
        constraints: ["All readings are positive.", "The answer must be contiguous."],
        expectedSpaceComplexity: "O(1)",
        expectedTimeComplexity: "O(n)",
      },
    },
    {
      correctText: "Keep a range state and move boundaries only when the invariant says to shrink.",
      familyId: "sliding_window",
      id: "alg-sliding-window-invariant-001",
      itemType: "approach_naming",
      mistakeTypes: ["invariant_missing", "invariant_broken"],
      nodeId: "sliding_window",
      prompt: "A contiguous positive-number range grows past its allowed sum. Which reasoning should guide the next move?",
      skillAtomId: "maintain_window_invariant",
      title: "Identify the window invariant",
      variantId: "variable_size_positive_numbers",
      wrongTexts: [
        "Move the right boundary only; left never changes in a range task.",
        "Ignore the current range state and restart from the next index.",
      ],
    },
    {
      checkType: "trace_next_step",
      correctText: "Remove the left value from the tracked sum and move left forward.",
      familyId: "sliding_window",
      id: "alg-sliding-window-trace-shrink-001",
      itemType: "trace_next_step",
      mistakeTypes: ["cannot_trace_algorithm", "invariant_broken"],
      nodeId: "sliding_window",
      prompt: "Window values are [3, 4, 2], tracked sum is 9, and the allowed sum is at most 7. What is the next trace step?",
      skillAtomId: "maintain_window_invariant",
      title: "Trace a window shrink",
      variantId: "variable_size_positive_numbers",
      wrongTexts: [
        "Add another right value before changing the invalid window.",
        "Record the invalid window as the best answer.",
      ],
    },
    {
      correctText: "For fixed size k, remove the outgoing value exactly when the new value enters.",
      familyId: "sliding_window",
      id: "alg-sliding-window-fixed-size-001",
      itemType: "pseudocode_ordering",
      mistakeTypes: ["off_by_one", "invariant_broken"],
      nodeId: "sliding_window",
      orderedOptions: [
        { id: "add_right", text: "Add the new right value to the window state." },
        { id: "check_size", text: "Check whether the window is now larger than k." },
        { id: "remove_left", text: "Remove the outgoing left value when size exceeds k." },
        { id: "record_size_k", text: "Record an answer only when the window size is k." },
      ],
      prompt: "Order the update steps for a fixed-size contiguous window.",
      skillAtomId: "maintain_window_invariant",
      title: "Order fixed-window updates",
      variantId: "fixed_size_window",
    },
    {
      correctText: "Use a frequency map inside the window when validity depends on counts of values in the current range.",
      familyId: "sliding_window",
      id: "alg-sliding-window-frequency-001",
      itemType: "strategy_choice",
      mistakeTypes: ["data_structure_mismatch", "invariant_missing"],
      nodeId: "sliding_window",
      prompt: "A contiguous substring is valid only while it contains at most two distinct characters. What state should the window maintain?",
      secondarySkillAtomIds: ["choose_lookup_key"],
      skillAtomId: "maintain_window_invariant",
      title: "Choose window frequency state",
      variantId: "frequency_constraint",
      wrongTexts: [
        "Only track the left and right indices; counts cannot affect validity.",
        "Sort the substring every time the right boundary moves.",
      ],
    },
    {
      correctText: "Use accumulated sums when a simple window cannot rely on predictable growth and shrink behavior.",
      familyId: "prefix_sums",
      id: "alg-prefix-window-failure-001",
      itemType: "strategy_choice",
      mistakeTypes: ["negative_numbers_assumption_error", "wrong_approach"],
      nodeId: "prefix_sums",
      prompt: "A subarray-sum task allows negative values. Which signal should make you question a simple sum window?",
      secondarySkillAtomIds: ["maintain_window_invariant"],
      skillAtomId: "detect_window_failure_signal",
      title: "Detect when a window fails",
      variantId: "when_prefix_beats_window",
      wrongTexts: [
        "Negative values make shrinking the left boundary always increase the sum.",
        "A window is always valid for any contiguous sum task.",
      ],
    },
    {
      correctText: "Store each prefix total so a range total can be computed from two accumulated values.",
      familyId: "prefix_sums",
      id: "alg-prefix-range-query-001",
      itemType: "approach_naming",
      mistakeTypes: ["data_structure_mismatch", "cannot_explain_why"],
      nodeId: "prefix_sums",
      prompt: "Many queries ask for the total between two indexes in the same array. What state should be prepared?",
      skillAtomId: "detect_window_failure_signal",
      title: "Name range-sum state",
      variantId: "range_sum_query",
      wrongTexts: [
        "Recompute each queried range from scratch without considering query count.",
        "Keep only the largest element seen so far.",
      ],
    },
    {
      checkType: "trace_next_step",
      correctText: "Look for an earlier prefix total of 4, because 11 minus target 7 equals 4.",
      familyId: "prefix_sums",
      id: "alg-prefix-trace-needed-total-001",
      itemType: "trace_next_step",
      mistakeTypes: ["cannot_trace_algorithm", "negative_numbers_assumption_error"],
      nodeId: "prefix_sums",
      prompt: "Current prefix total is 11 and target subarray sum is 7. Which earlier prefix total would prove a matching range exists?",
      skillAtomId: "detect_window_failure_signal",
      title: "Trace needed prefix total",
      variantId: "subarray_sum_with_hash_map",
      wrongTexts: [
        "Look for prefix total 18 because target should be added.",
        "Ignore earlier totals and only inspect the current element.",
      ],
    },
    {
      correctText: "A prefix-sum plan handles negative values because it does not depend on shrink movement being predictable.",
      familyId: "prefix_sums",
      id: "alg-prefix-vs-window-comparison-001",
      itemType: "solution_comparison",
      mistakeTypes: ["negative_numbers_assumption_error", "invariant_broken"],
      nodeId: "prefix_sums",
      prompt: "Two range-sum plans are proposed for data that may rise and fall: moving sum window or prefix totals with lookup. Which comparison is decisive?",
      secondarySkillAtomIds: ["maintain_window_invariant"],
      skillAtomId: "detect_window_failure_signal",
      title: "Compare prefix with window",
      variantId: "when_prefix_beats_window",
      wrongTexts: [
        "The moving window is safer because it stores less state.",
        "Negative values do not affect any contiguous range method.",
      ],
    },
    {
      correctText: "The empty prefix before index 0 must be represented so a valid range can start at the first element.",
      familyId: "prefix_sums",
      id: "alg-prefix-empty-prefix-edge-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["empty_input_error", "off_by_one"],
      nodeId: "prefix_sums",
      prompt: "A prefix-total lookup should detect a target range that begins at index 0. Which edge state is needed?",
      skillAtomId: "detect_window_failure_signal",
      title: "Handle range starting at zero",
      variantId: "prefix_counting",
      wrongTexts: [
        "Only store prefixes after two elements have been scanned.",
        "Ranges starting at index 0 cannot be found by prefix state.",
      ],
    },
    {
      correctText: "Sorting may reveal structure, but its cost and any lost original-position requirement must be checked.",
      familyId: "sorting_based",
      id: "alg-sorting-tradeoff-001",
      itemType: "strategy_choice",
      mistakeTypes: ["complexity_mismatch", "constraint_ignored"],
      nodeId: "sorting_based",
      prompt: "Before sorting an input to simplify comparisons, what tradeoff should you check first?",
      skillAtomId: "recognize_sorting_tradeoff",
      title: "Recognize sorting tradeoff",
      variantId: "sorting_cost_recognition",
      wrongTexts: [
        "Sort whenever a comparison appears, regardless of required output.",
        "Sorting has no cost compared with scanning.",
      ],
    },
    {
      checkType: "complexity_pair",
      complexityAnswer: { space: "O(1)", time: "O(n log n)" },
      complexityExplanation: "The ordering step dominates the following linear scan when sorting in place is acceptable.",
      correctText: "Sort-then-scan is O(n log n) time with constant extra space when the sort is in place.",
      expectedSpaceComplexity: "O(1)",
      expectedTimeComplexity: "O(n log n)",
      familyId: "sorting_based",
      id: "alg-sorting-complexity-001",
      itemType: "complexity_check",
      mistakeTypes: ["complexity_mismatch"],
      nodeId: "sorting_based",
      prompt: "A plan sorts records in place, then scans once to compare neighbors. What cost should be expected?",
      skillAtomId: "recognize_sorting_tradeoff",
      title: "Cost sort then scan",
      variantId: "sort_then_scan",
    },
    {
      correctText: "Sort by the field that makes equal or overlapping records adjacent.",
      familyId: "sorting_based",
      id: "alg-sorting-key-choice-001",
      itemType: "approach_naming",
      mistakeTypes: ["data_structure_mismatch", "cannot_explain_why"],
      nodeId: "sorting_based",
      prompt: "Records should be grouped when their account id matches. What should the ordering key be?",
      skillAtomId: "recognize_sorting_tradeoff",
      title: "Choose the sorting key",
      variantId: "custom_ordering",
      wrongTexts: [
        "Sort by the original row number because it is already available.",
        "Sort by a random stable label unrelated to grouping.",
      ],
    },
    {
      correctText: "If original indexes are required, keep them with the values before sorting.",
      familyId: "sorting_based",
      id: "alg-sorting-original-index-edge-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["constraint_ignored", "edge_case_missed"],
      nodeId: "sorting_based",
      prompt: "A sorted-value plan must return original positions. What must be preserved before ordering changes?",
      skillAtomId: "recognize_sorting_tradeoff",
      title: "Preserve original positions",
      variantId: "sorting_to_reveal_structure",
      wrongTexts: [
        "Original positions can be recovered from sorted order alone.",
        "Return sorted positions because they are easier to compute.",
      ],
    },
    {
      correctText: "Order the data, scan adjacent records, then combine only records whose ordered fields overlap.",
      familyId: "sorting_based",
      id: "alg-sorting-subgoal-order-001",
      itemType: "subgoal_ordering",
      mistakeTypes: ["subgoal_order_wrong", "constraint_ignored"],
      nodeId: "sorting_based",
      orderedOptions: [
        { id: "choose_key", text: "Choose the field that reveals adjacency." },
        { id: "sort_records", text: "Sort records by that field." },
        { id: "scan_neighbors", text: "Scan neighboring records in order." },
        { id: "merge_or_compare", text: "Merge or compare records when the ordered condition holds." },
      ],
      prompt: "Order the subgoals for using sorting to reveal neighboring structure.",
      skillAtomId: "recognize_sorting_tradeoff",
      title: "Order sort-then-scan subgoals",
      variantId: "sort_then_scan",
    },
    {
      correctText: "Use the most recent unresolved opening state to decide whether the next closing token is valid.",
      familyId: "stack",
      id: "alg-stack-unresolved-state-001",
      itemType: "approach_naming",
      mistakeTypes: ["data_structure_mismatch", "cannot_trace_algorithm"],
      nodeId: "stack",
      prompt: "A nested-structure scan sees a closing token. Which state should control the next decision?",
      skillAtomId: "use_last_unresolved_state",
      title: "Use last unresolved state",
      variantId: "nested_structure_validation",
      wrongTexts: [
        "Use the earliest unresolved opening token.",
        "Use a count only and ignore token type.",
      ],
    },
    {
      checkType: "trace_next_step",
      correctText: "Pop the most recent opening token because it matches the closing token.",
      familyId: "stack",
      id: "alg-stack-trace-match-001",
      itemType: "trace_next_step",
      mistakeTypes: ["cannot_trace_algorithm"],
      nodeId: "stack",
      prompt: "Stack top is '[' and the next token is ']'. What is the next step?",
      skillAtomId: "use_last_unresolved_state",
      title: "Trace a matching close",
      variantId: "nested_structure_validation",
      wrongTexts: [
        "Push the closing token onto the stack.",
        "Compare the closing token with the bottom of the stack.",
      ],
    },
    {
      correctText: "An empty stack before a closing token means there is no unresolved opener to match.",
      familyId: "stack",
      id: "alg-stack-empty-close-edge-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["empty_input_error", "edge_case_missed"],
      nodeId: "stack",
      prompt: "A nested-token scan reads a closing token while the stack is empty. What should be diagnosed?",
      skillAtomId: "use_last_unresolved_state",
      title: "Handle empty stack close",
      variantId: "nested_structure_validation",
      wrongTexts: [
        "Treat the close as a new opener.",
        "Skip the close because empty stack means valid so far.",
      ],
    },
    {
      correctText: "Push openers, compare each closer with the top, then require the stack to be empty at the end.",
      familyId: "stack",
      id: "alg-stack-pseudocode-order-001",
      itemType: "pseudocode_ordering",
      mistakeTypes: ["subgoal_order_wrong", "cannot_trace_algorithm"],
      nodeId: "stack",
      orderedOptions: [
        { id: "create_stack", text: "Create an empty stack." },
        { id: "scan_tokens", text: "Scan tokens from left to right." },
        { id: "push_open", text: "Push each opening token." },
        { id: "match_close", text: "For a closing token, compare with the top opener and pop if it matches." },
        { id: "check_empty", text: "After scanning, accept only if no opener remains." },
      ],
      prompt: "Order the pseudocode for nested-token validation.",
      skillAtomId: "use_last_unresolved_state",
      title: "Order stack validation steps",
      variantId: "nested_structure_validation",
    },
    {
      correctText: "A stack is appropriate when the newest unresolved state is the first state that must be resolved.",
      familyId: "stack",
      id: "alg-stack-strategy-signal-001",
      itemType: "strategy_choice",
      mistakeTypes: ["data_structure_mismatch", "cannot_explain_why"],
      nodeId: "stack",
      prompt: "Which signal points to stack state rather than queue-like state?",
      skillAtomId: "use_last_unresolved_state",
      title: "Choose stack state",
      variantId: "undo_or_previous_state",
      wrongTexts: [
        "The oldest unresolved item must always be resolved first.",
        "The input contains numbers, so stack state cannot apply.",
      ],
    },
    {
      correctText: "A repeated yes/no boundary lets each check discard part of the ordered search space.",
      familyId: "binary_search",
      id: "alg-binary-search-predicate-001",
      itemType: "approach_naming",
      mistakeTypes: ["wrong_approach", "off_by_one"],
      nodeId: "binary_search",
      prompt: "Which signal makes binary search more appropriate than scanning each position?",
      skillAtomId: "identify_monotonic_predicate",
      title: "Identify a monotonic predicate",
      variantId: "monotonic_predicate_recognition",
      wrongTexts: [
        "Any array can be halved even when checks give no ordered boundary.",
        "Binary search is chosen because the input is short.",
      ],
    },
    {
      checkType: "trace_next_step",
      correctText: "Search the right half because all earlier values are too small after this comparison.",
      familyId: "binary_search",
      id: "alg-binary-search-trace-right-001",
      itemType: "trace_next_step",
      mistakeTypes: ["cannot_trace_algorithm", "off_by_one"],
      nodeId: "binary_search",
      prompt: "Sorted values are [2, 4, 7, 9, 13]. The middle value 7 is less than target 9. What happens next?",
      skillAtomId: "identify_monotonic_predicate",
      title: "Trace a right-half move",
      variantId: "classic_index_search",
      wrongTexts: [
        "Search the left half because smaller values come first.",
        "Stop because the middle value was checked.",
      ],
    },
    {
      correctText: "The loop must preserve the candidate boundary, so the update rules must match inclusive or exclusive bounds.",
      familyId: "binary_search",
      id: "alg-binary-search-boundary-edge-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["off_by_one", "invariant_broken"],
      nodeId: "binary_search",
      prompt: "A lower-bound search sometimes skips the first valid index. Which risk should be checked?",
      skillAtomId: "identify_monotonic_predicate",
      title: "Check binary boundary updates",
      variantId: "lower_upper_bound",
      wrongTexts: [
        "Only the middle calculation can be wrong.",
        "Boundary inclusiveness does not affect lower-bound searches.",
      ],
    },
    {
      correctText: "Check the condition at the middle, keep the half that can still contain the first true answer, then return the boundary.",
      familyId: "binary_search",
      id: "alg-binary-search-subgoal-order-001",
      itemType: "subgoal_ordering",
      mistakeTypes: ["subgoal_order_wrong", "off_by_one"],
      nodeId: "binary_search",
      orderedOptions: [
        { id: "define_predicate", text: "Define what true means for a candidate." },
        { id: "set_bounds", text: "Set the searchable low and high bounds." },
        { id: "check_middle", text: "Check the middle candidate." },
        { id: "keep_valid_half", text: "Keep the half that can still contain the boundary answer." },
        { id: "return_boundary", text: "Return the final boundary candidate." },
      ],
      prompt: "Order the subgoals for binary search over a monotonic condition.",
      skillAtomId: "identify_monotonic_predicate",
      title: "Order predicate-search subgoals",
      variantId: "monotonic_predicate_recognition",
    },
    {
      checkType: "complexity_pair",
      complexityAnswer: { space: "O(1)", time: "O(log n)" },
      complexityExplanation: "Each comparison discards about half of the remaining ordered search space while storing only bounds.",
      correctText: "Binary search over an ordered boundary is logarithmic time and constant extra space.",
      expectedSpaceComplexity: "O(1)",
      expectedTimeComplexity: "O(log n)",
      familyId: "binary_search",
      id: "alg-binary-search-complexity-001",
      itemType: "complexity_check",
      mistakeTypes: ["complexity_mismatch"],
      nodeId: "binary_search",
      prompt: "A search halves the remaining ordered candidate range after each check. What time and extra space costs should you expect?",
      skillAtomId: "identify_monotonic_predicate",
      title: "Cost ordered halving",
      variantId: "classic_index_search",
    },
    {
      correctText: "Choose the approach by matching problem signals to required state, then justify the tradeoff.",
      familyId: "hash_map_and_set",
      id: "alg-strategy-core-001",
      itemType: "strategy_choice",
      mistakeTypes: ["wrong_approach", "cannot_explain_why"],
      nodeId: "strategy_selection_core",
      prompt: "When several familiar approaches could fit, what should decide the strategy?",
      skillAtomId: "choose_lookup_key",
      title: "Choose from core approaches",
      variantId: "lookup_by_value",
      wrongTexts: [
        "Choose the most recently practiced pattern.",
        "Choose the approach with the shortest pseudocode label.",
      ],
    },
    {
      correctText: "Fast membership points to lookup state; ordered elimination points to binary search.",
      familyId: "hash_map_and_set",
      id: "alg-strategy-membership-vs-ordered-001",
      itemType: "solution_comparison",
      mistakeTypes: ["wrong_approach", "data_structure_mismatch"],
      nodeId: "strategy_selection_core",
      prompt: "One task repeatedly asks whether a value has appeared; another asks for the first position where a sorted condition becomes true. Which contrast is decisive?",
      secondarySkillAtomIds: ["identify_monotonic_predicate"],
      skillAtomId: "choose_lookup_key",
      title: "Compare lookup with ordered search",
      variantId: "lookup_by_value",
      wrongTexts: [
        "Both tasks should use the same scan because they mention values.",
        "Both tasks should sort first because sorting is a familiar setup.",
      ],
    },
    {
      correctText: "Use a window only for contiguous state; use pair pointers when two coordinated positions define the candidate.",
      familyId: "sliding_window",
      id: "alg-strategy-window-vs-pair-001",
      itemType: "strategy_choice",
      mistakeTypes: ["wrong_approach", "invariant_missing"],
      nodeId: "strategy_selection_core",
      prompt: "A problem asks for a contiguous segment in one case and a pair of values in another. What should separate the strategies?",
      secondarySkillAtomIds: ["move_decisive_pointer"],
      skillAtomId: "maintain_window_invariant",
      title: "Separate window from pair scan",
      variantId: "variable_size_positive_numbers",
      wrongTexts: [
        "Both use two indexes, so the same invariant always applies.",
        "Contiguity does not affect strategy choice.",
      ],
    },
    {
      correctText: "If sorting changes required output semantics, prefer state that preserves the needed relationship.",
      familyId: "sorting_based",
      id: "alg-strategy-sort-side-effect-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["constraint_ignored", "wrong_approach"],
      nodeId: "strategy_selection_core",
      prompt: "A proposed sort would make comparisons easier but the answer must report original neighbors. What should happen before accepting the strategy?",
      secondarySkillAtomIds: ["track_index_boundary"],
      skillAtomId: "recognize_sorting_tradeoff",
      title: "Check strategy side effects",
      variantId: "sorting_cost_recognition",
      wrongTexts: [
        "Sort anyway because original neighbors can be inferred from sorted order.",
        "Ignore the output requirement until implementation.",
      ],
    },
    {
      correctText: "First identify the state signal, then choose the structure, then verify complexity and edge cases.",
      familyId: "arrays_and_strings",
      id: "alg-strategy-subgoal-order-001",
      itemType: "subgoal_ordering",
      mistakeTypes: ["subgoal_order_wrong", "cannot_explain_why"],
      nodeId: "strategy_selection_core",
      orderedOptions: [
        { id: "name_signal", text: "Name the decision signal in the prompt." },
        { id: "choose_state", text: "Choose the state or boundary mechanics that match the signal." },
        { id: "check_complexity", text: "Check time and space against constraints." },
        { id: "check_edges", text: "Check edge cases created by the chosen mechanics." },
      ],
      prompt: "Order the reasoning steps for selecting a core strategy.",
      secondarySkillAtomIds: ["derive_time_complexity"],
      skillAtomId: "track_index_boundary",
      title: "Order strategy selection reasoning",
      variantId: "indexed_scan",
    },
    {
      correctIds: ["lookup", "window", "binary"],
      correctText: "Membership lookup, contiguous-window state, and monotonic boundaries are decision signals; labels alone are not enough.",
      familyId: "binary_search",
      id: "alg-strategy-name-signals-001",
      itemType: "approach_naming",
      mistakeTypes: ["wrong_approach", "cannot_explain_why"],
      nodeId: "strategy_selection_core",
      options: [
        { id: "lookup", text: "Membership or complement checks suggest lookup state." },
        { id: "window", text: "Contiguous valid ranges suggest window state." },
        { id: "binary", text: "A monotonic boundary suggests binary search." },
        { id: "label", text: "A familiar pattern label is enough without a signal." },
      ],
      prompt: "Select the statements that name real decision signals.",
      secondarySkillAtomIds: ["choose_lookup_key", "maintain_window_invariant"],
      skillAtomId: "identify_monotonic_predicate",
      title: "Name core strategy signals",
      variantId: "monotonic_predicate_recognition",
    },
    {
      correctText: "Use lookup when preserving original relationships matters more than ordering the whole input.",
      familyId: "hash_map_and_set",
      id: "alg-contrast-hash-sorting-001",
      itemType: "strategy_choice",
      mistakeTypes: ["wrong_approach", "data_structure_mismatch"],
      nodeId: "contrast_hash_map_vs_sorting",
      prompt: "A pair task needs fast membership checks and original positions still matter. Which contrast signal is strongest?",
      secondarySkillAtomIds: ["recognize_sorting_tradeoff"],
      skillAtomId: "choose_lookup_key",
      title: "Contrast lookup with sorting",
      variantId: "lookup_by_value",
      wrongTexts: [
        "Sorting is always preferable when pairs are involved.",
        "Original positions never affect pair tasks.",
      ],
    },
    {
      correctText: "Sorting is stronger when adjacency after ordering directly reveals the needed relationship and original order is irrelevant.",
      familyId: "sorting_based",
      id: "alg-contrast-sorting-hash-001",
      itemType: "solution_comparison",
      mistakeTypes: ["wrong_approach", "constraint_ignored"],
      nodeId: "contrast_hash_map_vs_sorting",
      prompt: "Values only need to be grouped by closeness after ordering; original positions are irrelevant. Which side of the contrast is stronger?",
      secondarySkillAtomIds: ["choose_lookup_key"],
      skillAtomId: "recognize_sorting_tradeoff",
      title: "Contrast sorting with lookup",
      variantId: "sort_then_scan",
      wrongTexts: [
        "Use lookup only because lookup can store values.",
        "Avoid ordering even when adjacency is the actual signal.",
      ],
    },
    {
      correctText: "Use window reasoning only when the answer is a contiguous range with maintainable state.",
      familyId: "sliding_window",
      id: "alg-contrast-pointers-window-001",
      itemType: "strategy_choice",
      mistakeTypes: ["wrong_approach", "invariant_missing"],
      nodeId: "contrast_two_pointers_vs_sliding_window",
      prompt: "What separates a sliding-window problem from a two-boundary pair scan?",
      secondarySkillAtomIds: ["move_decisive_pointer"],
      skillAtomId: "maintain_window_invariant",
      title: "Contrast pointers with window",
      variantId: "variable_size_positive_numbers",
      wrongTexts: [
        "Any solution with two indexes is a sliding window.",
        "Contiguous range state and pair boundary state are equivalent.",
      ],
    },
    {
      correctText: "Two pointers are stronger when a pair comparison rules out one boundary without maintaining a whole range.",
      familyId: "two_pointers",
      id: "alg-contrast-window-pointers-001",
      itemType: "solution_comparison",
      mistakeTypes: ["wrong_approach", "invariant_missing"],
      nodeId: "contrast_two_pointers_vs_sliding_window",
      prompt: "A sorted pair task asks for two values, not a contiguous range. Why is a window signal weak?",
      secondarySkillAtomIds: ["maintain_window_invariant"],
      skillAtomId: "move_decisive_pointer",
      title: "Contrast window with pointers",
      variantId: "pair_scan_sorted_input",
      wrongTexts: [
        "A contiguous range is implied by any sorted input.",
        "A window is better because it also has left and right boundaries.",
      ],
    },
    {
      correctText: "Prefix sums handle range totals when window movement no longer gives a safe invariant.",
      familyId: "prefix_sums",
      id: "alg-contrast-window-prefix-001",
      itemType: "strategy_choice",
      mistakeTypes: ["negative_numbers_assumption_error", "invariant_broken"],
      nodeId: "contrast_sliding_window_vs_prefix_sums",
      prompt: "Which signal should push a range-sum problem away from sliding window and toward prefix state?",
      secondarySkillAtomIds: ["maintain_window_invariant"],
      skillAtomId: "detect_window_failure_signal",
      title: "Contrast window with prefix sums",
      variantId: "when_prefix_beats_window",
      wrongTexts: [
        "A moving window is always safe for every range sum.",
        "Prefix state cannot represent ranges that start later than index 0.",
      ],
    },
    {
      correctText: "A positive-only range with predictable expansion and shrink movement keeps the window invariant valid.",
      familyId: "sliding_window",
      id: "alg-contrast-prefix-window-001",
      itemType: "solution_comparison",
      mistakeTypes: ["wrong_approach", "invariant_missing"],
      nodeId: "contrast_sliding_window_vs_prefix_sums",
      prompt: "All values are positive and the task asks for the shortest range with enough total. Why can window reasoning be stronger than prefix lookup?",
      secondarySkillAtomIds: ["detect_window_failure_signal"],
      skillAtomId: "maintain_window_invariant",
      title: "Contrast prefix with window",
      variantId: "variable_size_positive_numbers",
      wrongTexts: [
        "Prefix lookup is always required for every range total.",
        "Positive values make boundary movement unpredictable.",
      ],
    },
    {
      correctText: "When values may lower the range total, prefix state avoids assuming shrink direction is predictable.",
      familyId: "prefix_sums",
      id: "alg-contrast-window-prefix-negative-001",
      itemType: "edge_case_drill",
      mistakeTypes: ["negative_numbers_assumption_error", "wrong_approach"],
      nodeId: "contrast_sliding_window_vs_prefix_sums",
      prompt: "A range-sum task includes readings that can be below zero. Which contrast edge case matters?",
      secondarySkillAtomIds: ["maintain_window_invariant"],
      skillAtomId: "detect_window_failure_signal",
      title: "Contrast negative range values",
      variantId: "when_prefix_beats_window",
      wrongTexts: [
        "Negative values make a positive-window invariant safer.",
        "Range totals do not depend on value signs.",
      ],
    },
    {
      correctText: "A monotonic stack keeps unresolved elements ordered so future values can resolve boundaries.",
      familyId: "monotonic_stack",
      id: "alg-contrast-stack-monotonic-001",
      itemType: "strategy_choice",
      mistakeTypes: ["invariant_missing", "cannot_trace_algorithm"],
      nodeId: "contrast_stack_vs_monotonic_stack_intro",
      prompt: "What makes a monotonic stack different from a basic last-in-first-out stack?",
      secondarySkillAtomIds: ["use_last_unresolved_state"],
      skillAtomId: "maintain_monotonic_stack_invariant",
      title: "Contrast stack variants",
      variantId: "monotonic_invariant",
      wrongTexts: [
        "A monotonic stack ignores order among unresolved values.",
        "A basic stack and monotonic stack always store identical state.",
      ],
    },
    {
      correctText: "Use a basic stack when only nesting order matters; add monotonic ordering when future larger or smaller values resolve waiting elements.",
      familyId: "stack",
      id: "alg-contrast-monotonic-basic-stack-001",
      itemType: "solution_comparison",
      mistakeTypes: ["wrong_approach", "invariant_missing"],
      nodeId: "contrast_stack_vs_monotonic_stack_intro",
      prompt: "One task validates brackets; another asks for each value's next greater value. What separates the stack variants?",
      secondarySkillAtomIds: ["maintain_monotonic_stack_invariant"],
      skillAtomId: "use_last_unresolved_state",
      title: "Contrast basic and ordered stack state",
      variantId: "nested_structure_validation",
      wrongTexts: [
        "Both tasks only need the newest unresolved token type.",
        "Next greater value does not need an ordering invariant.",
      ],
    },
    {
      correctText: "Binary search needs ordered elimination; a plain scan is safer when no boundary can be discarded.",
      familyId: "binary_search",
      id: "alg-contrast-binary-linear-001",
      itemType: "strategy_choice",
      mistakeTypes: ["wrong_approach", "constraint_ignored"],
      nodeId: "contrast_binary_search_vs_linear_scan",
      prompt: "What must be true before replacing a linear scan with binary search?",
      secondarySkillAtomIds: ["track_index_boundary"],
      skillAtomId: "identify_monotonic_predicate",
      title: "Contrast binary search with scan",
      variantId: "monotonic_predicate_recognition",
      wrongTexts: [
        "Binary search is valid whenever the input is an array.",
        "A scan is always worse even if no ordered boundary exists.",
      ],
    },
    {
      correctText: "Linear scan is appropriate when each position must be inspected or no comparison can discard a region.",
      familyId: "arrays_and_strings",
      id: "alg-contrast-linear-binary-001",
      itemType: "solution_comparison",
      mistakeTypes: ["wrong_approach", "constraint_ignored"],
      nodeId: "contrast_binary_search_vs_linear_scan",
      prompt: "A task asks whether any character is uppercase in an unsorted string. Why is binary search not the deciding strategy?",
      secondarySkillAtomIds: ["identify_monotonic_predicate"],
      skillAtomId: "track_index_boundary",
      title: "Contrast scan with binary search",
      variantId: "indexed_scan",
      wrongTexts: [
        "Uppercase checks create an ordered true/false boundary automatically.",
        "Binary search can discard half of any string without a predicate.",
      ],
    },
  ]),
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
  return getActiveAlgorithmTrainingItems().filter((item) => item.roadmapNodeId === nodeId);
}

export function getRoadmapNodesWithActiveItems(): readonly AlgorithmRoadmapNode[] {
  const nodeIdsWithActiveItems = new Set<string>(
    getActiveAlgorithmTrainingItems()
      .map((item) => item.roadmapNodeId)
      .filter((nodeId): nodeId is string => typeof nodeId === "string"),
  );
  return ALGORITHM_ROADMAP.nodes.filter((node) => nodeIdsWithActiveItems.has(node.id));
}

export function isAlgorithmRoadmapNodeSelectable(node: AlgorithmRoadmapNode): boolean {
  return (
    node.status === "available" &&
    getAlgorithmTrainingItemsForRoadmapNode(node.id).length >= node.minimumActiveItemCount
  );
}

export function isAlgorithmTrainingItemSelectable(item: AlgorithmTrainingItem): boolean {
  if (item.status !== "active") return false;
  if (!item.roadmapNodeId) return false;

  const node = ALGORITHM_ROADMAP.nodes.find((candidate) => candidate.id === item.roadmapNodeId);
  if (!node) return false;

  return isAlgorithmRoadmapNodeSelectable(node);
}

export function getSelectableAlgorithmTrainingItems(): readonly AlgorithmTrainingItem[] {
  return ALGORITHM_TRAINING_ITEMS.filter(isAlgorithmTrainingItemSelectable);
}

export function getFirstUsableAlgorithmRoadmapNode(): AlgorithmRoadmapNode {
  const node = ALGORITHM_ROADMAP.nodes.find(isAlgorithmRoadmapNodeSelectable);

  if (!node) {
    throw new Error("No selectable Algorithms roadmap node has active items.");
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

type CoreContentItemInput = {
  approachPrimer?: {
    approachId: AlgorithmApproachId;
  };
  checkType?: AlgorithmStaticMicroCheck["type"];
  complexityAnswer?: {
    space: AlgorithmComplexityClass;
    time: AlgorithmComplexityClass;
  };
  complexityExplanation?: string;
  correctText: string;
  correctIds?: readonly string[];
  expectedSpaceComplexity?: AlgorithmComplexityClass;
  expectedTimeComplexity?: AlgorithmComplexityClass;
  familyId: AlgorithmPatternFamilyId;
  id: string;
  itemType: AlgorithmTrainingItem["type"];
  mistakeTypes: readonly AlgorithmMistakeType[];
  nodeId: AlgorithmRoadmapNodeId;
  options?: readonly { id: string; text: string }[];
  orderedOptions?: readonly { id: string; text: string }[];
  problemStatement?: string;
  prompt: string;
  secondarySkillAtomIds?: readonly string[];
  skillAtomId: string;
  title: string;
  variantId?: string;
  workedExample?: {
    approachChoiceReason: string;
    approachId: AlgorithmApproachId;
    complexityExplanation: string;
    constraints: readonly string[];
    expectedSpaceComplexity: AlgorithmComplexityClass;
    expectedTimeComplexity: AlgorithmComplexityClass;
  };
  wrongTexts?: readonly string[];
};

function makeCoreContentItems(
  inputs: readonly CoreContentItemInput[],
): readonly (AlgorithmTrainingItem & TrainingItem)[] {
  return inputs.map(makeCoreContentItem);
}

function makeCoreContentItem(input: CoreContentItemInput): AlgorithmTrainingItem & TrainingItem {
  const check = makeStaticMicroCheckForCoreItem(input);
  const approachTemplate =
    input.approachPrimer?.approachId || input.workedExample?.approachId
      ? getApproachTemplate((input.approachPrimer?.approachId ?? input.workedExample?.approachId) as AlgorithmApproachId)
      : undefined;
  const learningStage = getLearningStageForCoreItem(input);
  const baseItem: AlgorithmTrainingItem = {
    contentVersion: ALGORITHM_CONTENT_VERSION,
    feedbackModel: {
      decisionSignal: input.prompt,
      mentalModelCorrection: input.correctText,
      mistakeTypes: input.mistakeTypes,
      nextAction: "Practice one adjacent item that asks for the deciding signal before code mechanics.",
      result: "diagnostic",
    },
    id: input.id,
    learningStage,
    primarySkillAtomId: input.skillAtomId,
    prompt: input.prompt,
    roadmapNodeId: input.nodeId,
    secondarySkillAtomIds: input.secondarySkillAtomIds,
    status: "active",
    staticMicroChecks: [check],
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
      ...(input.variantId
        ? [
            {
              axisId: "pattern_variant" as const,
              nodeId: input.variantId,
              role: "secondary" as const,
            },
          ]
        : []),
      {
        axisId: "mistake_type",
        nodeId: input.mistakeTypes[0] ?? "wrong_approach",
        role: "mistake_type",
      },
    ],
    title: input.title,
    trackId: "algorithms",
    type: input.itemType,
  };

  if (input.itemType === "approach_primer") {
    if (!input.approachPrimer || !approachTemplate) {
      throw new Error(`Core approach primer is missing an approach template: ${input.id}`);
    }

    return {
      ...baseItem,
      approachId: input.approachPrimer.approachId,
      invariant: requiredFirst(approachTemplate.invariants, `${input.id} invariant`),
      mechanicsSummary: approachTemplate.description,
      pitfalls: approachTemplate.pitfalls,
      pseudocodeTemplate: approachTemplate.pseudocodeTemplate,
      whenNotToUseSignals: approachTemplate.whenNotToUseSignals,
      whenToUseSignals: approachTemplate.whenToUseSignals,
    } as AlgorithmTrainingItem & TrainingItem;
  }

  if (input.itemType === "complexity_check") {
    return {
      ...baseItem,
      complexityExplanation: requiredString(input.complexityExplanation, `${input.id} complexity explanation`),
      expectedSpaceComplexity: requiredValue(input.expectedSpaceComplexity, `${input.id} expected space complexity`),
      expectedTimeComplexity: requiredValue(input.expectedTimeComplexity, `${input.id} expected time complexity`),
    } as AlgorithmTrainingItem & TrainingItem;
  }

  if (input.itemType === "strategy_choice") {
    return {
      ...baseItem,
      acceptableApproachIds: getAcceptableApproachIds(input),
      constraintSignal: input.prompt,
      expectedApproachIds: getExpectedApproachIds(input),
      reasonSignal: input.correctText,
      rejectedApproachIds: ["label_only", "implementation_first"],
      responseSpec: {
        kind: "strategy_selection",
        strategies: getResponseOptionsForCoreItem(input),
      },
    } as AlgorithmTrainingItem & TrainingItem;
  }

  if (input.itemType === "solution_comparison") {
    return {
      ...baseItem,
      responseSpec: {
        comparisonCriteria: ["decision signal", "constraint fit", "state needed"],
        kind: "solution_comparison",
        solutions: getResponseOptionsForCoreItem(input),
      },
    } as AlgorithmTrainingItem & TrainingItem;
  }

  if (input.itemType === "worked_example") {
    if (!input.workedExample || !approachTemplate) {
      throw new Error(`Core worked example is missing approach details: ${input.id}`);
    }

    return {
      ...baseItem,
      approachChoiceReason: input.workedExample.approachChoiceReason,
      approachId: input.workedExample.approachId,
      commonMistakes: input.mistakeTypes,
      complexityExplanation: input.workedExample.complexityExplanation,
      constraints: input.workedExample.constraints,
      expectedSpaceComplexity: input.workedExample.expectedSpaceComplexity,
      expectedTimeComplexity: input.workedExample.expectedTimeComplexity,
      problemStatement: requiredString(input.problemStatement, `${input.id} problem statement`),
      pseudocodeTemplate: approachTemplate.pseudocodeTemplate,
      solution: {
        approachId: input.workedExample.approachId,
        complexityExplanation: input.workedExample.complexityExplanation,
        id: `${input.id}-solution`,
        pseudocode: approachTemplate.pseudocodeTemplate.lines.map((line) => line.text),
        spaceComplexity: input.workedExample.expectedSpaceComplexity,
        subgoalIds: approachTemplate.steps.map((step) => step.id),
        summary: input.correctText,
        timeComplexity: input.workedExample.expectedTimeComplexity,
        title: `${input.title} solution`,
      },
      stepByStepTrace: [
        {
          description: input.correctText,
          id: `${input.id}-trace-001`,
          order: 1,
          state: [input.prompt],
        },
      ],
      subgoals: approachTemplate.steps,
      whyNotAlternatives: [
        {
          approachId: "label_only",
          reason: "A pattern label without the decision signal does not justify the mechanics.",
        },
      ],
    } as AlgorithmTrainingItem & TrainingItem;
  }

  return {
    ...baseItem,
    ...(input.itemType === "trace_next_step"
      ? {
          stepByStepTrace: [
            {
              description: input.correctText,
              id: `${input.id}-trace-001`,
              order: 1,
              state: [input.prompt],
            },
          ],
        }
      : {}),
  } as AlgorithmTrainingItem & TrainingItem;
}

function makeStaticMicroCheckForCoreItem(input: CoreContentItemInput): AlgorithmStaticMicroCheck {
  const checkType = input.checkType ?? (input.orderedOptions ? "order_steps" : input.options ? "multi_select" : "single_choice");

  if (checkType === "complexity_pair") {
    return {
      correctAnswer: requiredValue(input.complexityAnswer, `${input.id} complexity answer`),
      feedback: input.correctText,
      id: `${input.id}-check`,
      mistakeTypes: input.mistakeTypes,
      prompt: "Choose the expected time and space cost.",
      status: "active",
      testedSkillAtomIds: [input.skillAtomId],
      type: "complexity_pair",
    };
  }

  if (checkType === "order_steps") {
    const orderedOptions = requiredValue(input.orderedOptions, `${input.id} ordered options`);
    return {
      correctAnswer: orderedOptions.map((option) => option.id),
      feedback: input.correctText,
      id: `${input.id}-check`,
      mistakeTypes: input.mistakeTypes,
      options: orderedOptions,
      prompt: "Tap the steps in the correct order.",
      status: "active",
      testedSkillAtomIds: [input.skillAtomId],
      type: "order_steps",
    };
  }

  if (checkType === "multi_select") {
    return {
      correctAnswer: requiredValue(input.correctIds, `${input.id} correct ids`),
      feedback: input.correctText,
      id: `${input.id}-check`,
      mistakeTypes: input.mistakeTypes,
      options: requiredValue(input.options, `${input.id} options`),
      prompt: "Select every reasoning signal that applies.",
      status: "active",
      testedSkillAtomIds: [input.skillAtomId],
      type: "multi_select",
    };
  }

  return {
    correctAnswer: "expected_signal",
    feedback: input.correctText,
    id: `${input.id}-check`,
    mistakeTypes: input.mistakeTypes,
    options: [
      { id: "expected_signal", text: input.correctText },
      ...(input.wrongTexts ?? [
        "Choose by matching the nearest pattern label only.",
        "Start coding first and infer the strategy later.",
      ]).map((text, index) => ({
        id: `wrong_${index + 1}`,
        text,
      })),
    ],
    prompt: input.itemType === "trace_next_step"
      ? "Choose the next trace step."
      : "Choose the reasoning signal that should guide the strategy.",
    status: "active",
    testedSkillAtomIds: [input.skillAtomId],
    type: checkType === "trace_next_step" ? "trace_next_step" : "single_choice",
  };
}

function getLearningStageForCoreItem(input: CoreContentItemInput): AlgorithmTrainingItem["learningStage"] {
  if (input.nodeId.startsWith("contrast_")) return "contrast_practice";
  if (input.nodeId === "strategy_selection_core") return "strategy_selection";
  if (input.familyId === "complexity_and_constraints" || input.familyId === "arrays_and_strings") return "foundations";
  if (input.itemType === "worked_example") return "guided_application";
  return "pattern_mechanics";
}

function getExpectedApproachIds(input: CoreContentItemInput): readonly string[] {
  if (input.approachPrimer?.approachId) return [input.approachPrimer.approachId];
  if (input.workedExample?.approachId) return [input.workedExample.approachId];
  return [input.skillAtomId];
}

function getAcceptableApproachIds(input: CoreContentItemInput): readonly string[] {
  return input.secondarySkillAtomIds ?? [];
}

function getResponseOptionsForCoreItem(input: CoreContentItemInput): { id: string; text: string }[] {
  return [
    { id: "expected_signal", text: input.correctText },
    ...(input.wrongTexts ?? [
      "Choose by matching the nearest pattern label only.",
      "Start coding first and infer the strategy later.",
    ]).map((text, index) => ({
      id: `wrong_${index + 1}`,
      text,
    })),
  ];
}

function requiredString(value: string | undefined, label: string): string {
  if (!value) {
    throw new Error(`Missing ${label}.`);
  }

  return value;
}

function requiredValue<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`Missing ${label}.`);
  }

  return value;
}
