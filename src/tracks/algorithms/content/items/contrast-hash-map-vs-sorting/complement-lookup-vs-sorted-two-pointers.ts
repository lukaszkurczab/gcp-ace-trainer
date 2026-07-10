// Planning target: this file should contain questions contrasting hash-based complement lookup with sorting plus two pointers:
// one-pass complement lookup; lookup-before-insert ordering; preventing reuse of the same element;
// duplicate values; multiplicity; returning pair existence; returning values; returning original indexes;
// sorting value-index pairs; and the different contracts produced by the two strategies.
// It should diagnose mistakes such as inserting the current value before checking its complement and then reusing the same element,
// using a Set when the task requires original indexes,
// sorting raw values and losing index identity,
// assuming two pointers work before sorting,
// or claiming both strategies preserve the same output semantics.
// Target question count: 18.
// Prefer single_choice, solution_comparison, edge_case_drill, mistake-review, and small trace-style items.
// Avoid broad two-pointer curriculum and avoid pair problems where hash state and sorting are not genuine competing approaches.
export const complementLookupVsSortedTwoPointersQuestions = [];
