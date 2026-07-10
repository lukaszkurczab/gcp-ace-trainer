// Planning target: this file should contain questions about cases where sorting creates useful global structure:
// equal values becoming adjacent; scanning maximal equal-value runs; ordered deduplication;
// deterministic sorted output; neighboring-value comparisons; gaps; ranges; and traversing values in rank order.
// It should contrast this with hash-based state, which supports keyed lookup but does not directly create sorted adjacency or rank order.
// It should diagnose mistakes such as checking only adjacent original elements for global duplicates,
// assuming Map or Set iteration always provides the required sorted order,
// using frequency state when the output itself must be ordered,
// or sorting when order is irrelevant and direct keyed lookup fully satisfies the contract.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, and small trace-style items.
// Avoid specific sorting algorithm mechanics, broad interval algorithms, and questions where ordering is not relevant to the hash-versus-sort decision.
export const sortedAdjacencyRunsAndOrderQuestions = [];
