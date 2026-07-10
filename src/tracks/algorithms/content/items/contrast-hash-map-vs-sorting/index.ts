import { recognizeHashMapVsSortingStrategySignalQuestions } from "./recognize-strategy-signal";
import { membershipDuplicatesAndFrequencyQuestions } from "./membership-duplicates-and-frequency";
import { complementLookupVsSortedTwoPointersQuestions } from "./complement-lookup-vs-sorted-two-pointers";
import { groupingAndCanonicalizationQuestions } from "./grouping-and-canonicalization";
import { sortedAdjacencyRunsAndOrderQuestions } from "./sorted-adjacency-runs-and-order";
import { outputContractMutationAndIndexesQuestions } from "./output-contract-mutation-and-indexes";
import { onlineProcessingAndRepeatedQueriesQuestions } from "./online-processing-and-repeated-queries";
import { complexitySpaceAndMistakeReviewQuestions } from "./complexity-space-and-mistake-review";

export const contrastHashMapVsSortingQuestions = [
  ...recognizeHashMapVsSortingStrategySignalQuestions,
  ...membershipDuplicatesAndFrequencyQuestions,
  ...complementLookupVsSortedTwoPointersQuestions,
  ...groupingAndCanonicalizationQuestions,
  ...sortedAdjacencyRunsAndOrderQuestions,
  ...outputContractMutationAndIndexesQuestions,
  ...onlineProcessingAndRepeatedQueriesQuestions,
  ...complexitySpaceAndMistakeReviewQuestions,
];
