// Planning target: this file should contain questions about same-direction two pointers whose roles are not sliding-window boundaries:
// read and write positions; fast and slow traversal; in-place filtering; duplicate collapse;
// stable compaction; partitioning a processed prefix; and deciding which pointer advances after each observation.
// It should teach that the range between read and write is not automatically a candidate window.
// It should diagnose mistakes such as interpreting write/read distance as window length, removing an outgoing element even though no window state exists,
// advancing the write pointer for rejected values, losing stable order, or using a variable-window shrink loop for an in-place compaction contract.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, subgoal_ordering, and small trace-style items.
// Avoid linked-list cycle detection, general partition algorithms, and full arrays-and-strings compaction curriculum.
export const sameDirectionReadWriteAndCompactionQuestions = [];
