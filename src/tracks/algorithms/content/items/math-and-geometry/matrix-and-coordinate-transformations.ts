// Planning target: this file should contain questions about matrix and coordinate transformations:
// transpose; horizontal and vertical reflection;
// 90-degree rotations; mapping old coordinates to new coordinates;
// square versus rectangular matrix constraints;
// in-place layer swaps; and distinguishing transformed coordinates from transformed values.
// It should teach that a rotation can be reasoned about either as a coordinate mapping or as a sequence such as transpose plus reflection.
// It should diagnose mistakes such as using the clockwise mapping for counterclockwise rotation,
// assuming an in-place square-matrix technique works unchanged for rectangular matrices,
// overwriting values before their cycle is preserved,
// reflecting across the wrong axis,
// mixing row and column dimensions,
// or returning a view with the expected values but wrong shape.
// Target question count: 14.
// Prefer single_choice, solution_comparison, coordinate-mapping selection, edge_case_drill, and small matrix traces.
// Avoid full linear-transformation theory and arbitrary-angle rotation.
export const matrixAndCoordinateTransformationsQuestions = [];
