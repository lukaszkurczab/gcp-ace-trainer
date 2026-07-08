import { recognizeBinarySearchSignalQuestions } from "./recognize-binary-search-signal";
import { classicIndexSearchQuestions } from "./classic-index-search";
import { boundariesAndLoopInvariantsQuestions } from "./boundaries-and-loop-invariants";
import { lowerUpperBoundQuestions } from "./lower-upper-bound";
import { binarySearchOnAnswerQuestions } from "./binary-search-on-answer";
import { monotonicPredicateSearchQuestions } from "./monotonic-predicate-search";
import { rotatedArraySearchQuestions } from "./rotated-array-search";

export const binarySearchQuestions = [
  ...recognizeBinarySearchSignalQuestions,
  ...classicIndexSearchQuestions,
  ...boundariesAndLoopInvariantsQuestions,
  ...lowerUpperBoundQuestions,
  ...binarySearchOnAnswerQuestions,
  ...monotonicPredicateSearchQuestions,
  ...rotatedArraySearchQuestions,
];
