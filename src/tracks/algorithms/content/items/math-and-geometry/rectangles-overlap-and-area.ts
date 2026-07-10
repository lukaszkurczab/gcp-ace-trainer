// Planning target: this file should contain questions about axis-aligned rectangle reasoning:
// rectangle representation; positive-width and positive-height overlap;
// touching edges or corners; intersection bounds;
// intersection area; union area for two rectangles;
// containment; and closed versus geometric-area semantics.
// It should teach that positive-area overlap requires overlap on both axes.
// It should diagnose mistakes such as checking overlap on only one axis,
// treating edge touching as positive-area intersection,
// using min for lower intersection bounds or max for upper bounds,
// multiplying a negative width or height,
// summing areas without subtracting the intersection,
// or assuming corner coordinates are already normalized.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, formula selection, and small rectangle traces.
// Avoid rectangle-union for many rectangles and advanced computational geometry.
export const rectanglesOverlapAndAreaQuestions = [];
