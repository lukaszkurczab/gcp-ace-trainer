// Planning target: this file should contain questions about negative values and other cases that invalidate standard sum-based variable sliding-window reasoning:
// sums decreasing when the right boundary expands; sums increasing when the left boundary is removed;
// non-monotonic validity; target-sum and at-most/at-least constraints; and recognizing when prefix-based state or another pattern is needed.
// It should teach that contiguous input and a numeric threshold are not enough to justify a variable sliding window.
// It should diagnose mistakes such as assuming shrinking always decreases the sum,
// applying a non-negative-window proof to mixed-sign data,
// replacing an invalid window with plain prefix sums without explaining how the desired range is selected,
// or claiming prefix sums alone solve every subarray-target problem.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, counterexample reasoning, and mistake-review style items.
// Avoid fully teaching prefix-sum-plus-hash-map, monotonic deque, balanced trees, or other advanced replacement algorithms; identify the invalid assumption and the required kind of alternative state.
export const negativeValuesAndInvalidWindowAssumptionsQuestions = [];
