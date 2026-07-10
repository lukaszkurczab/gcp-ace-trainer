// Planning target: this file should contain questions about how the required output contract and mutation constraints determine the choice between hash-based state and sorting:
// preserving original indexes; preserving encounter order; returning the first valid result;
// returning any valid result; returning sorted output; deterministic output;
// mutating the input; copying before sorting; duplicate identity; and value-versus-index contracts.
// It should teach that an asymptotically attractive solution can still be invalid if it destroys required information.
// It should diagnose mistakes such as sorting raw values when original indexes must be returned,
// ignoring that sorting may mutate the input,
// assuming a hash map guarantees sorted iteration,
// returning a different valid pair when the contract requires the earliest one,
// or comparing complexity before checking correctness of the output contract.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, and mistake-review style items.
// Avoid generic JavaScript API trivia unless mutation or iteration semantics directly change the algorithmic contract.
export const outputContractMutationAndIndexesQuestions = [];
