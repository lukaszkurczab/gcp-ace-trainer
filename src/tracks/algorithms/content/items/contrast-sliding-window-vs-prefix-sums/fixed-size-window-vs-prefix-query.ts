// Planning target: this file should contain questions contrasting a rolling fixed-size window with prefix sums:
// computing every length-k window sum or count; removing the outgoing contribution and adding the incoming contribution;
// computing one exact range; answering selected fixed-length ranges; and deciding whether storing all prefix states is necessary.
// It should teach that a rolling window can evaluate all consecutive length-k windows in O(n) time with constant aggregate state,
// while prefix sums can answer arbitrary requested ranges after preprocessing.
// It should diagnose mistakes such as recomputing each length-k window from scratch,
// forgetting to remove the outgoing value,
// using prefix sums when only one streaming pass and the best length-k window are needed,
// or claiming a fixed-size sliding window and a prefix array have identical memory contracts.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, and small trace-style items.
// Avoid variable-size shrink logic, negative-number monotonicity, and full range-query batches.
export const fixedSizeWindowVsPrefixQueryQuestions = [];
