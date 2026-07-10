// Planning target: this file should contain questions about reversing an entire singly linked list:
// prev, current, and saved next references; preserving the unprocessed suffix;
// redirecting current.next; advancing both traversal references;
// returning the final prev as the new head; and handling empty or single-node lists.
// It should teach the invariant that prev is the reversed processed prefix and current begins the untouched suffix.
// It should diagnose mistakes such as overwriting current.next before saving the original next,
// advancing current through the already reversed link, returning the original head,
// forgetting to terminate the new tail, updating prev in the wrong order,
// or assuming values must be swapped instead of links.
// Target question count: 18.
// Prefer single_choice, solution_comparison, subgoal-ordering, edge_case_drill, code-review, and detailed pointer traces.
// Avoid reverse-between boundaries and recursive reversal as a dominant approach.
export const reverseEntireListQuestions = [];
