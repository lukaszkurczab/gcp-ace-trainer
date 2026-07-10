// Planning target: this file should contain questions about divisibility, greatest common divisor, and least common multiple:
// Euclidean algorithm; repeated remainder; zero cases; signs;
// simplifying ratios; common step sizes; periodic alignment;
// computing lcm through gcd; and avoiding unnecessary factor enumeration.
// It should teach that gcd captures the largest shared unit and lcm captures the smallest positive shared multiple.
// It should diagnose mistakes such as stopping Euclid before the remainder reaches zero,
// returning the final zero remainder instead of the previous divisor,
// dividing before reducing overflow risk in lcm,
// treating gcd(0, x) as zero for nonzero x,
// confusing factors with multiples,
// or assuming coprime values must both be prime.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, invariant reasoning, and small Euclidean traces.
// Avoid extended Euclid and modular inverse.
export const gcdLcmAndDivisibilityQuestions = [];
