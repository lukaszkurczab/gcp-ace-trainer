// Planning target: this file should contain questions about cases where a plain stack's LIFO contract is sufficient:
// matching nested delimiters; undoing the most recent action; reversing processing order;
// tracking the most recent unresolved opener; and restoring earlier state in reverse order.
// It should contrast retaining every unresolved item with a monotonic stack that deliberately removes dominated candidates.
// It should diagnose mistakes such as imposing a value-order invariant on a nesting problem,
// popping items because their numeric values are not monotonic,
// reading from the bottom instead of the top,
// confusing stack behavior with queue behavior,
// or removing an unresolved item before its matching event arrives.
// Target question count: 12.
// Prefer single_choice, solution_comparison, edge_case_drill, and small LIFO trace items.
// Avoid full expression parsing, DFS traversal, recursion call-stack internals, and advanced monotonic-stack problems.
export const plainStackLifoContractQuestions = [];
