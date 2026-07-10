import { recognizeIntervalSignalQuestions } from "./recognize-interval-signal";
import { representationAndEndpointSemanticsQuestions } from "./representation-and-endpoint-semantics";
import { sortingKeysAndCanonicalOrderQuestions } from "./sorting-keys-and-canonical-order";
import { mergeOverlapAndContainmentQuestions } from "./merge-overlap-and-containment";
import { insertIntervalIntoSortedDisjointListQuestions } from "./insert-interval-into-sorted-disjoint-list";
import { intersectTwoSortedIntervalListsQuestions } from "./intersect-two-sorted-interval-lists";
import { coverageUnionLengthAndGapsQuestions } from "./coverage-union-length-and-gaps";
import { sweepEventsAndMaximumOverlapQuestions } from "./sweep-events-and-maximum-overlap";
import { concurrentResourcesAndMeetingRoomsQuestions } from "./concurrent-resources-and-meeting-rooms";
import { intervalSelectionAndRemovalQuestions } from "./interval-selection-and-removal";
import { weightedIntervalsAndGreedyBoundaryQuestions } from "./weighted-intervals-and-greedy-boundary";
import { outputMutationAndComplexityReviewQuestions } from "./output-mutation-and-complexity-review";

export const intervalsQuestions = [
  ...recognizeIntervalSignalQuestions,
  ...representationAndEndpointSemanticsQuestions,
  ...sortingKeysAndCanonicalOrderQuestions,
  ...mergeOverlapAndContainmentQuestions,
  ...insertIntervalIntoSortedDisjointListQuestions,
  ...intersectTwoSortedIntervalListsQuestions,
  ...coverageUnionLengthAndGapsQuestions,
  ...sweepEventsAndMaximumOverlapQuestions,
  ...concurrentResourcesAndMeetingRoomsQuestions,
  ...intervalSelectionAndRemovalQuestions,
  ...weightedIntervalsAndGreedyBoundaryQuestions,
  ...outputMutationAndComplexityReviewQuestions,
];
