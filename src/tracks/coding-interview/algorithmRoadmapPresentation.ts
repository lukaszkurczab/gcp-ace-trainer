import type { AlgorithmQuestionType } from "./algorithmQuestionTypes";

type AlgorithmRoadmapPresentation = Readonly<{
  label: string;
  learningObjectives: readonly string[];
  minimumActiveItemCount: number;
  recommendedItemTypes?: readonly AlgorithmQuestionType[];
  shortDescription: string;
}>;

/** Learner-facing copy only. Structural relationships come from the generated SOT mirror. */
export const ALGORITHM_ROADMAP_PRESENTATION: Readonly<Record<string, AlgorithmRoadmapPresentation>> = {
  complexity_and_constraints: { label: "Complexity and constraints", learningObjectives: ["Reject infeasible work from input constraints.", "Explain time and space cost before selecting a strategy."], minimumActiveItemCount: 35, shortDescription: "Start with limits, operation cost, and the contract the solution must satisfy." },
  arrays_and_strings: { label: "Arrays and strings", learningObjectives: ["Track indexed input shape, boundaries, and duplicates.", "Separate scan mechanics from higher-level strategies."], minimumActiveItemCount: 30, shortDescription: "Practice sequence reasoning, boundaries, and local scan state." },
  hash_map_and_set: { label: "Hash map and set", learningObjectives: ["Recognize lookup, count, grouping, and complement signals."], minimumActiveItemCount: 30, shortDescription: "Use remembered state for fast membership and grouping decisions." },
  two_pointers: { label: "Two pointers", learningObjectives: ["Move positions according to a defensible boundary rule."], minimumActiveItemCount: 30, shortDescription: "Coordinate positions without enumerating every pair." },
  sliding_window: { label: "Sliding window", learningObjectives: ["Maintain contiguous state while expanding and shrinking legally."], minimumActiveItemCount: 30, shortDescription: "Practice moving-range invariants and update rules." },
  prefix_sums: { label: "Prefix sums", learningObjectives: ["Reuse accumulated state for range and subarray reasoning."], minimumActiveItemCount: 30, shortDescription: "Answer repeated range questions without recomputing them." },
  sorting_based: { label: "Sorting based", learningObjectives: ["Use ordering when it reveals a simpler scan or grouping."], minimumActiveItemCount: 30, shortDescription: "Evaluate when preprocessing by order changes the problem." },
  stack: { label: "Stack", learningObjectives: ["Use last-in-first-out state for unresolved structure."], minimumActiveItemCount: 30, shortDescription: "Practice nested state, previous values, and explicit traversal." },
  binary_search: { label: "Binary search", learningObjectives: ["Prove that each check can discard an ordered region."], minimumActiveItemCount: 30, shortDescription: "Use order or a monotonic predicate to shrink a search space." },
  strategy_selection_core: { label: "Strategy selection", learningObjectives: ["Compare viable strategies against constraints and invariants."], minimumActiveItemCount: 20, shortDescription: "Choose and justify a strategy before optimizing its implementation." },
  contrast_hash_map_vs_sorting: { label: "Hash map vs sorting", learningObjectives: ["Separate lookup needs from ordering needs."], minimumActiveItemCount: 20, shortDescription: "Contrast memory, ordering, and repeated-query tradeoffs." },
  contrast_two_pointers_vs_sliding_window: { label: "Two pointers vs sliding window", learningObjectives: ["Separate pair relations from contiguous-range state."], minimumActiveItemCount: 20, shortDescription: "Contrast movement rules with window-validity rules." },
  contrast_sliding_window_vs_prefix_sums: { label: "Sliding window vs prefix sums", learningObjectives: ["Choose moving state or precomputed state from the query contract."], minimumActiveItemCount: 20, shortDescription: "Contrast monotonic window conditions with prefix-based reasoning." },
  contrast_stack_vs_monotonic_stack_intro: { label: "Stack vs monotonic stack", learningObjectives: ["Separate ordinary LIFO use from ordered candidate maintenance."], minimumActiveItemCount: 20, shortDescription: "Contrast nested state with nearest-boundary reasoning." },
  contrast_binary_search_vs_linear_scan: { label: "Binary search vs linear scan", learningObjectives: ["Require a legal discard rule before choosing binary search."], minimumActiveItemCount: 20, shortDescription: "Contrast asymptotic cost with correctness preconditions." },
  linked_list: { label: "Linked list", learningObjectives: ["Reason about identity, traversal, and safe rewiring."], minimumActiveItemCount: 20, shortDescription: "Practice reference movement and node-link contracts." },
  recursion_basics: { label: "Recursion basics", learningObjectives: ["Define base cases and a smaller-call contract."], minimumActiveItemCount: 20, shortDescription: "Decompose work while tracking call-stack behavior." },
  tree_traversal: { label: "Tree traversal", learningObjectives: ["Carry path, depth, and subtree state through a hierarchy."], minimumActiveItemCount: 20, shortDescription: "Practice recursive and iterative hierarchy traversal." },
  heap_priority_queue: { label: "Heap and priority queue", learningObjectives: ["Maintain the changing extreme without repeated full sorting."], minimumActiveItemCount: 20, shortDescription: "Use priority order when the next extreme matters repeatedly." },
  intervals: { label: "Intervals", learningObjectives: ["Reason precisely about endpoints, overlap, and active ranges."], minimumActiveItemCount: 20, shortDescription: "Use ordering to reason about ranges and spans." },
  backtracking: { label: "Backtracking", learningObjectives: ["Explore reversible choices and prune invalid partial states."], minimumActiveItemCount: 20, shortDescription: "Practice choice trees, restoration, and safe pruning." },
  graph_traversal: { label: "Graph traversal", learningObjectives: ["Maintain visited state while reasoning about reachability."], minimumActiveItemCount: 20, shortDescription: "Traverse relationship structures with explicit state." },
  greedy_intro: { label: "Greedy", learningObjectives: ["Justify a local choice with an ordering or exchange argument."], minimumActiveItemCount: 20, shortDescription: "Identify when locally optimal decisions are safe." },
  dynamic_programming_intro: { label: "Dynamic programming", learningObjectives: ["Define state and transitions for overlapping subproblems."], minimumActiveItemCount: 20, shortDescription: "Reuse subproblem results through an explicit recurrence." },
  bit_manipulation: { label: "Bit manipulation", learningObjectives: ["Use representation, masks, and bit operations deliberately."], minimumActiveItemCount: 20, shortDescription: "Reason about compact state, flags, and parity." },
  math_and_geometry: { label: "Math and geometry", learningObjectives: ["Use numeric structure and coordinates without losing edge cases."], minimumActiveItemCount: 20, shortDescription: "Apply formulas, modular reasoning, and geometric constraints." },
};
