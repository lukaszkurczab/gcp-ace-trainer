import { recognizeLinkedListSignalQuestions } from "./recognize-linked-list-signal";
import { nodeIdentityAndReferenceSemanticsQuestions } from "./node-identity-and-reference-semantics";
import { traversalHeadTailAndNullContractQuestions } from "./traversal-head-tail-and-null-contract";
import { dummyNodeInsertionAndDeletionQuestions } from "./dummy-node-insertion-and-deletion";
import { reverseEntireListQuestions } from "./reverse-entire-list";
import { reverseSublistAndSegmentRewiringQuestions } from "./reverse-sublist-and-segment-rewiring";
import { mergeSplitAndStableRelinkingQuestions } from "./merge-split-and-stable-relinking";
import { fastSlowMiddleAndKthFromEndQuestions } from "./fast-slow-middle-and-kth-from-end";
import { cycleDetectionAndEntryQuestions } from "./cycle-detection-and-entry";
import { intersectionAndSharedNodeIdentityQuestions } from "./intersection-and-shared-node-identity";
import { mutationOutputAndNodeReuseContractQuestions } from "./mutation-output-and-node-reuse-contract";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const linkedListQuestions = [
  ...recognizeLinkedListSignalQuestions,
  ...nodeIdentityAndReferenceSemanticsQuestions,
  ...traversalHeadTailAndNullContractQuestions,
  ...dummyNodeInsertionAndDeletionQuestions,
  ...reverseEntireListQuestions,
  ...reverseSublistAndSegmentRewiringQuestions,
  ...mergeSplitAndStableRelinkingQuestions,
  ...fastSlowMiddleAndKthFromEndQuestions,
  ...cycleDetectionAndEntryQuestions,
  ...intersectionAndSharedNodeIdentityQuestions,
  ...mutationOutputAndNodeReuseContractQuestions,
  ...complexityAndMistakeReviewQuestions,
];
