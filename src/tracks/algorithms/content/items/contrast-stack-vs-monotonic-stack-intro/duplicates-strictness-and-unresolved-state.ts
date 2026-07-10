// Planning target: this file should contain questions about equality, strictness, and unresolved candidates in introductory monotonic-stack tasks:
// greater versus greater-or-equal; smaller versus smaller-or-equal;
// whether equal values should pop or remain; duplicate plateaus; preserving the nearest valid occurrence;
// and assigning the required default when no qualifying next or previous element exists.
// It should teach that the pop condition must follow the exact output contract rather than a memorized inequality.
// It should diagnose mistakes such as using >= for a strictly-greater query without considering equal values,
// keeping equal values when the contract requires greater-or-equal resolution,
// treating an unresolved element as an algorithm failure,
// assigning zero when the specified sentinel is -1 or another contract value,
// or flushing the stack with an invented value that changes the comparison semantics.
// Target question count: 12.
// Prefer single_choice, solution_comparison, edge_case_drill, counterexample reasoning, and mistake-review style items.
// Avoid advanced sentinel techniques, histogram equal-height policies, and circular-array resolution.
export const duplicatesStrictnessAndUnresolvedStateQuestions = [];
