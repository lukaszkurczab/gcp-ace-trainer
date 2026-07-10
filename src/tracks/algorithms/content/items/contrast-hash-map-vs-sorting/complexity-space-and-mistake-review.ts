// Planning target: this file should contain questions about complexity and code-review reasoning in the hash-map-versus-sorting contrast:
// expected O(n) hash-based passes; O(n) auxiliary keyed state;
// O(n log n) sorting followed by O(n) scanning; copied versus in-place sorting assumptions;
// expected versus worst-case hash operations; key construction cost; comparator cost;
// preprocessing reuse; and correctness before asymptotic optimization.
// It should diagnose mistakes such as treating hash lookup as unconditional worst-case O(1),
// ignoring O(n) memory,
// describing sort plus scan as O(n),
// claiming sorting uses O(1) auxiliary space without stating an implementation assumption,
// ignoring copied input,
// or choosing hashing solely because expected O(n) is numerically smaller than O(n log n).
// Target question count: 12.
// Prefer single_choice, solution_comparison, complexity_check, and common-mistake-diagnosis style items.
// Avoid repeating domain scenarios already covered in previous files unless the item specifically tests complexity reasoning.
export const complexitySpaceAndMistakeReviewQuestions = [];
