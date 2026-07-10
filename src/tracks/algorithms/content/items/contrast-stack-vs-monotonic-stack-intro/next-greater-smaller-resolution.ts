// Planning target: this file should contain questions about next greater and next smaller resolution during a forward scan:
// unresolved indexes waiting on the stack; the current value resolving one or more earlier candidates;
// repeated popping with while rather than one conditional pop; assigning answers to popped elements;
// pushing the current position after resolution; and leaving unresolved candidates for later.
// It should cover both next-greater and next-smaller reasoning without turning into separate memorized templates.
// It should diagnose mistakes such as assigning the answer to the current element instead of the popped element,
// popping only once when several candidates are resolved,
// using the wrong comparison direction,
// returning the largest later value instead of the nearest qualifying value,
// or discarding an unresolved candidate before a valid resolver appears.
// Target question count: 16.
// Prefer single_choice, solution_comparison, edge_case_drill, subgoal_ordering, and small trace-style items.
// Avoid circular arrays, histogram problems, contribution counting, and full previous-boundary reasoning.
export const nextGreaterSmallerResolutionQuestions = [];
