import { chooseRecursionStateQuestions } from "./choose-recursion-state";
import { enumerateChoicesQuestions } from "./enumerate-choices";
import { baseCaseAndResultContractQuestions } from "./base-case-and-result-contract";
import { pathStateAndUndoQuestions } from "./path-state-and-undo";
import { constraintPruningQuestions } from "./constraint-pruning";
import { duplicateControlQuestions } from "./duplicate-control";
import { gridSearchBacktrackingQuestions } from "./grid-search-backtracking";
import { partitioningAndSegmentationQuestions } from "./partitioning-and-segmentation";
import { backtrackingVsOtherPatternsQuestions } from "./backtracking-vs-other-patterns";
import { placementBacktrackingQuestions } from "./placement-backtracking";
import { backtrackingVsMemoizedSearchQuestions } from "./backtracking-vs-memoized-search";
import { backtrackingComplexityQuestions } from "./backtracking-complexity";
export const backtrackingQuestions = [
  ...chooseRecursionStateQuestions,
  ...enumerateChoicesQuestions,
  ...baseCaseAndResultContractQuestions,
  ...pathStateAndUndoQuestions,
  ...constraintPruningQuestions,
  ...duplicateControlQuestions,
  ...gridSearchBacktrackingQuestions,
  ...partitioningAndSegmentationQuestions,
  ...backtrackingVsOtherPatternsQuestions,
  ...placementBacktrackingQuestions,
  ...backtrackingVsMemoizedSearchQuestions,
  ...backtrackingComplexityQuestions,
] as const;

export default backtrackingQuestions;
