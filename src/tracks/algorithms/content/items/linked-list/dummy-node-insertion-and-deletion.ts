// Planning target: this file should contain questions about dummy nodes and local insertion/deletion:
// using a sentinel predecessor before the real head; deleting the first matching node;
// inserting before the original head; removing nodes while scanning;
// maintaining previous and current references; returning dummy.next;
// and distinguishing deleted-node identity from the predecessor that bypasses it.
// It should teach that dummy nodes remove special-case control flow around head replacement without changing the logical output list.
// It should diagnose mistakes such as returning the dummy itself, advancing previous after deleting current,
// losing the new head, bypassing the wrong node, dereferencing current after it becomes null,
// or using a dummy node without connecting it to the original head.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, code-review, subgoal-ordering, and small rewiring traces.
// Avoid full partitioning and advanced deletion-by-reference tricks.
export const dummyNodeInsertionAndDeletionQuestions = [];
