// Planning target: this file should contain questions about numeric correctness:
// integer overflow; multiplication before division; safe rearrangement;
// floating-point representation; epsilon comparisons;
// exact equality for integer-derived quantities; squared comparisons;
// rational cross multiplication; and choosing number versus bigint or wider integer types.
// It should teach that tolerance is not universal and must match the numeric contract and scale.
// It should diagnose mistakes such as comparing computed floating-point values with exact equality,
// adding epsilon to an exact integer predicate,
// cross-multiplying without considering overflow,
// taking square roots and introducing avoidable rounding,
// assuming JavaScript number represents every integer exactly,
// or mixing bigint and number operations without an explicit conversion contract.
// Target question count: 12.
// Prefer single_choice, solution_comparison, edge_case_drill, code-review, and numeric-contract analysis.
// Avoid arbitrary-precision arithmetic implementation and advanced numerical analysis.
export const numericPrecisionOverflowAndExactnessQuestions = [];
