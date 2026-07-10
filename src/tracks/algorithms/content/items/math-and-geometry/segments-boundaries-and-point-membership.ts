// Planning target: this file should contain questions about line-segment boundaries and membership:
// distinguishing an infinite line from a finite segment;
// combining collinearity with coordinate bounds;
// inclusive versus exclusive segment endpoints;
// overlapping collinear segments; bounding boxes;
// and identifying degenerate zero-length segments.
// It should diagnose mistakes such as using collinearity alone for point-on-segment,
// checking only x bounds on a vertical or arbitrary segment,
// applying strict inequalities when endpoints count,
// treating parallel non-collinear segments as overlapping,
// or assuming every zero-length segment is invalid.
// Target question count: 14.
// Prefer single_choice, solution_comparison, boundary reasoning, edge_case_drill, and small coordinate traces.
// Avoid full general segment-intersection algorithms and sweep-line geometry.
export const segmentsBoundariesAndPointMembershipQuestions = [];
