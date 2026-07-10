// Planning target: this file should contain questions about the legality and mechanics of variable-size sliding windows:
// expanding the right boundary; updating window state; shrinking while a constraint is violated;
// preserving a valid candidate; longest or shortest valid contiguous range; and proving that discarded left boundaries never need to return.
// It should teach that variable sliding window requires a condition whose validity changes predictably as the window expands or shrinks.
// It should diagnose mistakes such as shrinking only once when the window may still be invalid,
// recording the answer before restoring validity,
// moving left for a condition that is not monotonic under removal,
// resetting the window instead of incrementally shrinking it,
// or using prefix sums as if they directly select the optimal variable-length range.
// Target question count: 18.
// Prefer single_choice, solution_comparison, edge_case_drill, subgoal_ordering, and small trace-style items.
// Avoid full negative-number treatment, prefix-sum-plus-hash-map mechanics, and monotonic-deque solutions; those belong elsewhere.
export const variableWindowMonotonicityAndShrinkQuestions = [];
