// Planning target: this file should contain questions about recognizing the high-level strategy contrast between sliding window and prefix sums:
// maintaining one evolving contiguous range; incrementally adding and removing boundary elements;
// versus preprocessing cumulative state to answer arbitrary static range queries.
// It should teach the learner to identify whether the task asks to optimize over many candidate windows,
// process one current window online, or answer independently specified ranges.
// It should diagnose mistakes such as choosing sliding window only because the prompt mentions a subarray,
// choosing prefix sums only because the task mentions sums,
// confusing one moving range with many unrelated range queries,
// or comparing Big-O before identifying the required query and update contract.
// Target question count: 14.
// Prefer single_choice, strategy_choice, solution_comparison, and mistake-review style items.
// Avoid detailed pointer mechanics, prefix-index formulas, negative-number edge cases, and full complexity accounting; those belong in later files.
export const recognizeSlidingWindowVsPrefixSumsStrategySignalQuestions = [];
