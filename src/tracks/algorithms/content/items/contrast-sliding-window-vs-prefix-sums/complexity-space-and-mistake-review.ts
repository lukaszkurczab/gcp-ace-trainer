// Planning target: this file should contain questions about complexity and code-review reasoning in the sliding-window-versus-prefix-sums contrast:
// O(n) fixed or valid variable sliding-window passes; O(1) or window-dependent state;
// O(n) prefix preprocessing; O(n) prefix storage; O(1) static range-sum queries;
// total O(n + q); repeated naive range scans; and correctness before asymptotic comparison.
// It should diagnose mistakes such as calling every two-pointer loop O(n) without proving each boundary moves monotonically,
// describing q prefix queries as O(q) while omitting preprocessing,
// claiming prefix sums use O(1) extra space without an explicit in-place assumption,
// claiming sliding window is always more memory-efficient regardless of required state,
// or choosing the lower Big-O approach despite an invalid invariant.
// Target question count: 10.
// Prefer single_choice, solution_comparison, complexity_check, and common-mistake-diagnosis style items.
// Avoid repeating domain scenarios from earlier files unless the question specifically tests complexity reasoning.
export const complexitySpaceAndMistakeReviewQuestions = [];
