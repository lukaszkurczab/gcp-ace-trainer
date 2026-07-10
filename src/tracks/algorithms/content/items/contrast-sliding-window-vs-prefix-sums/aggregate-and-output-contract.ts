// Planning target: this file should contain questions about how the aggregate operation and output contract affect the sliding-window-versus-prefix-sums choice:
// sums and counts that support adding and removing contributions; exact range answers;
// best value over all windows; returning one range or many query results; original indexes;
// simple prefix subtraction; and aggregates such as min or max that cannot be recovered by subtracting two scalar prefixes.
// It should teach that both patterns require compatible state and that the word aggregate does not guarantee either approach.
// It should diagnose mistakes such as using prefix subtraction for minimum or maximum,
// maintaining only a scalar window sum when the task needs richer frequency state,
// returning only a best window when all query answers are required,
// or building prefix sums when the output requires online rolling results.
// Target question count: 12.
// Prefer single_choice, solution_comparison, state-selection, edge_case_drill, and mistake-review style items.
// Avoid fully teaching monotonic queues, frequency-map sliding windows, or multidimensional prefix structures.
export const aggregateAndOutputContractQuestions = [];
