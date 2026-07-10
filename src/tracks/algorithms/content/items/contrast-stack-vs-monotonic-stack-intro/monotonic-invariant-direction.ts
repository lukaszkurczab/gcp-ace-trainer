// Planning target: this file should contain questions about defining and maintaining a monotonic stack invariant:
// values increasing or decreasing from bottom to top; choosing the pop condition;
// identifying which candidates remain useful; and connecting the desired greater/smaller relationship to the maintained order.
// It should require the invariant to be stated explicitly instead of relying only on labels such as "increasing stack" or "decreasing stack".
// It should diagnose mistakes such as reversing the inequality,
// describing the input as monotonic instead of the stack,
// checking only the current top without restoring the full invariant,
// keeping a dominated candidate,
// or naming an increasing stack without saying whether the order is bottom-to-top or top-to-bottom.
// Target question count: 14.
// Prefer single_choice, solution_comparison, invariant-selection, edge_case_drill, and small trace-style items.
// Avoid full next-greater answer assignment, duplicate strictness, and advanced applications.
export const monotonicInvariantDirectionQuestions = [];
