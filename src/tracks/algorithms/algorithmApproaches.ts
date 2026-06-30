import {
  ALGORITHM_CONTENT_VERSION,
  type AlgorithmApproachTemplate,
} from "./algorithmContentTypes";

export const ALGORITHM_APPROACH_TEMPLATES = [
  {
    commonMistakeTypes: [
      "data_structure_mismatch",
      "duplicate_handling_error",
      "cannot_explain_why",
    ],
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Scan once while storing values needed to answer a complement or membership question.",
    id: "hash_map_complement_lookup",
    invariants: [
      {
        description: "The remembered values represent only the part of the input already scanned.",
        id: "seen-values-invariant",
        label: "Seen values are available for lookup",
      },
    ],
    label: "Hash map complement lookup",
    patternFamilyId: "hash_map_and_set",
    pitfalls: [
      {
        description: "Checking the current value after storing it can accidentally reuse the same element.",
        id: "reuse-current-element",
        mistakeTypes: ["duplicate_handling_error", "edge_case_missed"],
      },
      {
        description: "Using lookup without explaining why average lookup changes the complexity.",
        id: "lookup-without-complexity-reasoning",
        mistakeTypes: ["cannot_explain_why", "complexity_mismatch"],
      },
    ],
    pseudocodeTemplate: {
      id: "hash-map-complement-lookup-pseudocode",
      language: "pseudocode",
      lines: [
        { id: "line-1", indentationLevel: 0, order: 1, text: "create empty lookup structure" },
        { id: "line-2", indentationLevel: 0, order: 2, text: "for each value and position in input" },
        { id: "line-3", indentationLevel: 1, order: 3, text: "derive the value needed to satisfy the condition" },
        { id: "line-4", indentationLevel: 1, order: 4, text: "if needed value exists in lookup, return or record answer" },
        { id: "line-5", indentationLevel: 1, order: 5, text: "store current value for later checks" },
        { id: "line-6", indentationLevel: 0, order: 6, text: "return no-answer result if no match is found" },
      ],
    },
    status: "draft",
    steps: [
      {
        description: "Identify what value or fact must be found quickly for each scanned value.",
        id: "derive-needed-value",
        label: "Derive lookup target",
        order: 1,
      },
      {
        description: "Check previously scanned values before storing the current value when reuse is not allowed.",
        id: "check-before-store",
        label: "Check prior state",
        order: 2,
      },
      {
        description: "Store the current value, count, or position for later checks.",
        id: "store-current-value",
        label: "Update lookup state",
        order: 3,
      },
    ],
    typicalSpaceComplexity: "O(n)",
    typicalTimeComplexity: "O(n)",
    whenNotToUseSignals: [
      "The input is already sorted and only a pair boundary needs to move.",
      "The task requires contiguous range state rather than membership or complement lookup.",
    ],
    whenToUseSignals: [
      "The task needs fast membership, count, or complement checks.",
      "A nested pair scan would be too slow for the input limit.",
    ],
  },
  {
    commonMistakeTypes: [
      "wrong_approach",
      "constraint_ignored",
      "off_by_one",
      "duplicate_handling_error",
    ],
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Move inward over sorted input while comparison to the target decides which side can advance.",
    id: "sorted_two_pointers_pair_scan",
    invariants: [
      {
        description: "Pairs outside the current left and right boundary have already been ruled out.",
        id: "ruled-out-boundaries-invariant",
        label: "Discarded boundaries stay impossible",
      },
    ],
    label: "Sorted two pointers pair scan",
    patternFamilyId: "two_pointers",
    pitfalls: [
      {
        description: "Applying the scan to unsorted input without sorting or preserving the answer condition.",
        id: "unsorted-input-pointer-scan",
        mistakeTypes: ["constraint_ignored", "wrong_approach"],
      },
      {
        description: "Moving the wrong pointer after comparing the pair value to the target.",
        id: "wrong-pointer-move",
        mistakeTypes: ["invariant_broken", "off_by_one"],
      },
    ],
    pseudocodeTemplate: {
      id: "sorted-two-pointers-pair-scan-pseudocode",
      language: "pseudocode",
      lines: [
        { id: "line-1", indentationLevel: 0, order: 1, text: "set left to first index and right to last index" },
        { id: "line-2", indentationLevel: 0, order: 2, text: "while left is before right" },
        { id: "line-3", indentationLevel: 1, order: 3, text: "evaluate the pair at left and right" },
        { id: "line-4", indentationLevel: 1, order: 4, text: "if pair satisfies the condition, return or record answer" },
        { id: "line-5", indentationLevel: 1, order: 5, text: "if pair is too small, move left forward" },
        { id: "line-6", indentationLevel: 1, order: 6, text: "otherwise move right backward" },
      ],
    },
    status: "draft",
    steps: [
      {
        description: "Confirm sorted order is available or can be introduced without breaking the required answer.",
        id: "confirm-ordering",
        label: "Confirm ordered input",
        order: 1,
      },
      {
        description: "Start from opposite boundaries so each comparison can remove one side.",
        id: "initialize-boundaries",
        label: "Initialize boundaries",
        order: 2,
      },
      {
        description: "Move the boundary that can no longer participate in a valid pair.",
        id: "advance-decisive-boundary",
        label: "Advance decisive boundary",
        order: 3,
      },
    ],
    typicalSpaceComplexity: "O(1)",
    typicalTimeComplexity: "O(n)",
    whenNotToUseSignals: [
      "The pair relationship does not become easier after sorting.",
      "The answer depends on original positions that sorting would destroy.",
    ],
    whenToUseSignals: [
      "The input is sorted or can be sorted without losing the needed relationship.",
      "A pair condition can decide whether the left or right boundary should move.",
    ],
  },
  {
    commonMistakeTypes: [
      "invariant_missing",
      "invariant_broken",
      "negative_numbers_assumption_error",
      "cannot_trace_algorithm",
    ],
    contentVersion: ALGORITHM_CONTENT_VERSION,
    description: "Maintain a contiguous range over positive values while expanding and shrinking by a rule.",
    id: "positive_sliding_window",
    invariants: [
      {
        description: "The current window state equals the values between the left and right boundaries.",
        id: "window-state-matches-boundaries",
        label: "Window state matches boundaries",
      },
      {
        description: "With positive values, expanding increases the tracked sum and shrinking decreases it.",
        id: "positive-values-monotonic-sum",
        label: "Positive values make sum movement predictable",
      },
    ],
    label: "Positive sliding window",
    patternFamilyId: "sliding_window",
    pitfalls: [
      {
        description: "Using the same sum-window reasoning when negative values are allowed.",
        id: "negative-values-break-sum-window",
        mistakeTypes: ["negative_numbers_assumption_error", "wrong_approach"],
      },
      {
        description: "Updating the best answer before restoring the required window condition.",
        id: "recording-invalid-window",
        mistakeTypes: ["invariant_broken", "edge_case_missed"],
      },
    ],
    pseudocodeTemplate: {
      id: "positive-sliding-window-pseudocode",
      language: "pseudocode",
      lines: [
        { id: "line-1", indentationLevel: 0, order: 1, text: "initialize left boundary, tracked state, and best answer" },
        { id: "line-2", indentationLevel: 0, order: 2, text: "for each right boundary in input" },
        { id: "line-3", indentationLevel: 1, order: 3, text: "add the right value to window state" },
        { id: "line-4", indentationLevel: 1, order: 4, text: "while window violates the condition" },
        { id: "line-5", indentationLevel: 2, order: 5, text: "remove the left value from window state and move left forward" },
        { id: "line-6", indentationLevel: 1, order: 6, text: "update best answer from the valid window" },
      ],
    },
    status: "draft",
    steps: [
      {
        description: "Define the state that represents the current contiguous range.",
        id: "define-window-state",
        label: "Define window state",
        order: 1,
      },
      {
        description: "Expand the right boundary and update the state for the new value.",
        id: "expand-right-boundary",
        label: "Expand right boundary",
        order: 2,
      },
      {
        description: "Shrink the left boundary until the required invariant is restored.",
        id: "shrink-left-boundary",
        label: "Restore invariant",
        order: 3,
      },
      {
        description: "Record the answer only from a window that currently satisfies the condition.",
        id: "record-valid-window",
        label: "Record valid window",
        order: 4,
      },
    ],
    typicalSpaceComplexity: "O(1)",
    typicalTimeComplexity: "O(n)",
    whenNotToUseSignals: [
      "The range values may be negative and the sum is no longer monotonic.",
      "The task is about arbitrary pairs or non-contiguous elements.",
    ],
    whenToUseSignals: [
      "The task asks for a contiguous range.",
      "All range values are positive, so expanding and shrinking changes the tracked sum predictably.",
    ],
  },
] as const satisfies readonly AlgorithmApproachTemplate[];
