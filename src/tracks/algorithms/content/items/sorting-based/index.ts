import { recognizeSortingBasedSignalQuestions } from "./recognize-sorting-based-signal";
import { chooseSortKeyDirectionAndTiesQuestions } from "./choose-sort-key-direction-and-ties";
import { adjacencyAndNeighborRelationsAfterSortQuestions } from "./adjacency-and-neighbor-relations-after-sort";
import { groupingDuplicatesAndCanonicalizationQuestions } from "./grouping-duplicates-and-canonicalization";
import { sortAndScanInvariantsQuestions } from "./sort-and-scan-invariants";
import { sortingBeforeTwoPointersQuestions } from "./sorting-before-two-pointers";
import { sortingBeforeGreedyAndSchedulingQuestions } from "./sorting-before-greedy-and-scheduling";
import { eventsRanksAndOrderBasedCountingQuestions } from "./events-ranks-and-order-based-counting";
import { stabilityOriginalIndexAndOutputOrderQuestions } from "./stability-original-index-and-output-order";
import { sortingVsHashHeapAndLinearAlternativesQuestions } from "./sorting-vs-hash-heap-and-linear-alternatives";
import { complexityMutationAndMistakeReviewQuestions } from "./complexity-mutation-and-mistake-review";

export const sortingBasedQuestions = [
  ...recognizeSortingBasedSignalQuestions,
  ...chooseSortKeyDirectionAndTiesQuestions,
  ...adjacencyAndNeighborRelationsAfterSortQuestions,
  ...groupingDuplicatesAndCanonicalizationQuestions,
  ...sortAndScanInvariantsQuestions,
  ...sortingBeforeTwoPointersQuestions,
  ...sortingBeforeGreedyAndSchedulingQuestions,
  ...eventsRanksAndOrderBasedCountingQuestions,
  ...stabilityOriginalIndexAndOutputOrderQuestions,
  ...sortingVsHashHeapAndLinearAlternativesQuestions,
  ...complexityMutationAndMistakeReviewQuestions,
];
