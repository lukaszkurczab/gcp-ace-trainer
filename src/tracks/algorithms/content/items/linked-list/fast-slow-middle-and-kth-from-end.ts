// Planning target: this file should contain questions about offset and speed-based pointer relationships:
// finding middle nodes; first versus second middle in even-length lists;
// keeping a fixed gap for kth-from-end queries; advancing a lead pointer before moving both pointers;
// and defining behavior when k is invalid or the list is too short.
// It should teach that pointer initialization and stopping conditions determine the exact returned node.
// It should diagnose mistakes such as moving both pointers before creating the required gap,
// returning the wrong middle in an even-length list, dereferencing fast.next without checking fast,
// mixing zero-based and one-based k, or assuming slow always moves exactly half as many iterations without considering initialization.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, invariant reasoning, and small pointer traces.
// Avoid cycle detection except as a contrast in pointer semantics.
export const fastSlowMiddleAndKthFromEndQuestions = [];
