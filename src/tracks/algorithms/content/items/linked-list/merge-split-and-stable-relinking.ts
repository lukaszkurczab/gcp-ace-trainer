// Planning target: this file should contain questions about merging, splitting, and stable relinking:
// merging two sorted linked lists by reusing nodes; maintaining a tail pointer;
// appending the remaining suffix; preserving stable order for equal values when required;
// splitting a list at a known boundary; detaching segments; and relinking nodes without creating copies or cycles.
// It should diagnose mistakes such as advancing the wrong input pointer, forgetting to advance the output tail,
// dropping the unconsumed remainder, comparing node identities instead of values for sorted merge,
// failing to detach the first half, or allocating copied nodes when the contract requires reuse.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, subgoal-ordering, and small merge or split traces.
// Avoid k-way merge, merge sort as a full curriculum, and heap-based merging.
export const mergeSplitAndStableRelinkingQuestions = [];
