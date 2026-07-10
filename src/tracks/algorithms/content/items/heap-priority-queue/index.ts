import { recognizePriorityQueueSignalQuestions } from "./recognize-priority-queue-signal";
import { priorityQueueContractAndPartialOrderQuestions } from "./priority-queue-contract-and-partial-order";
import { minMaxOrientationAndComparatorQuestions } from "./min-max-orientation-and-comparator";
import { pushPopPeekAndReplacementQuestions } from "./push-pop-peek-and-replacement";
import { topKAndBoundedHeapQuestions } from "./top-k-and-bounded-heap";
import { streamingKthAndOnlineSelectionQuestions } from "./streaming-kth-and-online-selection";
import { kWayMergeAndFrontierExpansionQuestions } from "./k-way-merge-and-frontier-expansion";
import { schedulingAndNextEventSelectionQuestions } from "./scheduling-and-next-event-selection";
import { duplicatesTieBreakingAndOutputOrderQuestions } from "./duplicates-tie-breaking-and-output-order";
import { staleEntriesLazyDeletionAndUpdatesQuestions } from "./stale-entries-lazy-deletion-and-updates";
import { heapifyBuildAndRepeatedInsertionQuestions } from "./heapify-build-and-repeated-insertion";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const heapPriorityQueueQuestions = [
  ...recognizePriorityQueueSignalQuestions,
  ...priorityQueueContractAndPartialOrderQuestions,
  ...minMaxOrientationAndComparatorQuestions,
  ...pushPopPeekAndReplacementQuestions,
  ...topKAndBoundedHeapQuestions,
  ...streamingKthAndOnlineSelectionQuestions,
  ...kWayMergeAndFrontierExpansionQuestions,
  ...schedulingAndNextEventSelectionQuestions,
  ...duplicatesTieBreakingAndOutputOrderQuestions,
  ...staleEntriesLazyDeletionAndUpdatesQuestions,
  ...heapifyBuildAndRepeatedInsertionQuestions,
  ...complexityAndMistakeReviewQuestions,
];
