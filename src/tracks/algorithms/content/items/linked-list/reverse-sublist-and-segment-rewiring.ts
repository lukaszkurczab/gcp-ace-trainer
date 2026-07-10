// Planning target: this file should contain questions about reversing only a linked-list segment:
// locating the node before the segment; preserving the segment successor;
// reversing exactly the requested nodes; reconnecting the prefix, reversed segment, and suffix;
// handling a segment beginning at head or ending at tail;
// and distinguishing position-based from node-based boundaries.
// It should diagnose mistakes such as reversing one node too many, losing the suffix,
// failing to reconnect the old segment head as the new segment tail,
// returning the wrong head when the segment begins at position one,
// using stale references after rewiring, or confusing inclusive and exclusive segment boundaries.
// Target question count: 18.
// Prefer single_choice, solution_comparison, edge_case_drill, subgoal-ordering, code-review, and small segment traces.
// Avoid full k-group reversal and recursive segment algorithms.
export const reverseSublistAndSegmentRewiringQuestions = [];
