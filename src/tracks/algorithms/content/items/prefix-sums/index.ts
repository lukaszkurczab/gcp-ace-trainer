import { recognizePrefixSumSignalQuestions } from "./recognize-prefix-sum-signal";
import { prefixDefinitionAndIndexingContractQuestions } from "./prefix-definition-and-indexing-contract";
import { oneDimensionalRangeQueriesQuestions } from "./one-dimensional-range-queries";
import { prefixCountsBalancesAndTransformsQuestions } from "./prefix-counts-balances-and-transforms";
import { subarrayEquationsAndTargetDifferenceQuestions } from "./subarray-equations-and-target-difference";
import { frequencyMapCountingWithPrefixStateQuestions } from "./frequency-map-counting-with-prefix-state";
import { earliestOccurrenceAndLongestRangeQuestions } from "./earliest-occurrence-and-longest-range";
import { multipleQueriesStaticVsDynamicInputQuestions } from "./multiple-queries-static-vs-dynamic-input";
import { twoDimensionalPrefixSumsQuestions } from "./two-dimensional-prefix-sums";
import { differenceArraysAndSlidingWindowBoundaryQuestions } from "./difference-arrays-and-sliding-window-boundary";
import { complexityOverflowAndMistakeReviewQuestions } from "./complexity-overflow-and-mistake-review";

export const prefixSumsQuestions = [
  ...recognizePrefixSumSignalQuestions,
  ...prefixDefinitionAndIndexingContractQuestions,
  ...oneDimensionalRangeQueriesQuestions,
  ...prefixCountsBalancesAndTransformsQuestions,
  ...subarrayEquationsAndTargetDifferenceQuestions,
  ...frequencyMapCountingWithPrefixStateQuestions,
  ...earliestOccurrenceAndLongestRangeQuestions,
  ...multipleQueriesStaticVsDynamicInputQuestions,
  ...twoDimensionalPrefixSumsQuestions,
  ...differenceArraysAndSlidingWindowBoundaryQuestions,
  ...complexityOverflowAndMistakeReviewQuestions,
];
