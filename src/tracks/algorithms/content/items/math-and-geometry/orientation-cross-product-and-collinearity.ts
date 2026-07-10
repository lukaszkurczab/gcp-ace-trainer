// Planning target: this file should contain questions about orientation and signed area using the two-dimensional cross product:
// constructing vectors from a shared origin; cross-product sign;
// clockwise, counterclockwise, and collinear cases;
// determinant order; triangle doubled area;
// testing whether multiple points lie on one line;
// and avoiding slope division.
// It should teach that reversing vector order reverses the sign while preserving zero/nonzero collinearity.
// It should diagnose mistakes such as using vectors with different origins,
// reversing the sign interpretation without documenting it,
// dividing slopes and introducing zero-division or precision problems,
// taking an absolute value before orientation is determined,
// confusing collinearity with point-on-segment,
// or forgetting that large coordinate products may overflow fixed-width integer types.
// Target question count: 18.
// Prefer single_choice, solution_comparison, sign analysis, edge_case_drill, code-review, and small determinant traces.
// Avoid convex hull and general polygon algorithms.
export const orientationCrossProductAndCollinearityQuestions = [];
