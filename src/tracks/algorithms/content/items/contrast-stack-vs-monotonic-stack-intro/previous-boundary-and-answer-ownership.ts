// Planning target: this file should contain questions about previous greater/smaller boundaries and answer ownership:
// removing invalid candidates before reading the stack top;
// using the remaining top as the nearest previous qualifying position;
// distinguishing when the current item resolves popped elements from when the current item reads its own answer from the remaining top;
// scan direction; nearest-boundary reasoning; and introductory span-style distances.
// It should diagnose mistakes such as using the popped element as the current item's previous boundary,
// reading the top before removing invalid candidates,
// confusing next-greater resolution with previous-greater lookup,
// scanning in the wrong direction without changing the invariant,
// or treating every popped candidate as an answer for the current element.
// Target question count: 14.
// Prefer single_choice, solution_comparison, edge_case_drill, and small trace-style items.
// Avoid advanced stock-span optimization variants, histogram widths, contribution counting, and circular scans.
export const previousBoundaryAndAnswerOwnershipQuestions = [];
