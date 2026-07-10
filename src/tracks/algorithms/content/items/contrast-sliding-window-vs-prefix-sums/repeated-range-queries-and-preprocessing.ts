// Planning target: this file should contain questions about choosing prefix sums for repeated static range queries:
// one O(n) preprocessing pass; O(1) sum or count queries; arbitrary [left, right] ranges;
// many query reuse; inclusive and half-open contracts; and comparing preprocessing once with rescanning each requested range.
// It should teach that prefix sums are valuable when the same static input serves many independently specified range queries,
// not merely whenever a task contains contiguous ranges.
// It should diagnose mistakes such as treating preprocessing as free,
// rebuilding the prefix array for every query,
// applying one sliding window to unrelated query ranges,
// omitting the preprocessing cost,
// or using the wrong prefix boundary for an inclusive range.
// Target question count: 14.
// Prefer single_choice, solution_comparison, complexity_check, edge_case_drill, and small range-query traces.
// Avoid turning this file into a complete prefix-sum implementation tutorial or a general database-query topic.
export const repeatedRangeQueriesAndPreprocessingQuestions = [];
