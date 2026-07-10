import { recognizeSlidingWindowSignalQuestions } from "./recognize-sliding-window-signal";
import { windowBoundariesLengthAndStateQuestions } from "./window-boundaries-length-and-state";
import { fixedSizeWindowAndRollingUpdateQuestions } from "./fixed-size-window-and-rolling-update";
import { variableWindowExpandAndShrinkQuestions } from "./variable-window-expand-and-shrink";
import { validityInvariantAndAnswerTimingQuestions } from "./validity-invariant-and-answer-timing";
import { frequencyMapAndDistinctStateQuestions } from "./frequency-map-and-distinct-state";
import { longestShortestAndExactConstraintQuestions } from "./longest-shortest-and-exact-constraint";
import { monotonicDequeWindowExtremesQuestions } from "./monotonic-deque-window-extremes";
import { edgeCasesTiesAndOutputContractQuestions } from "./edge-cases-ties-and-output-contract";
import { prefixSumsTwoPointersAndInvalidCasesQuestions } from "./prefix-sums-two-pointers-and-invalid-cases";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const slidingWindowQuestions = [
  ...recognizeSlidingWindowSignalQuestions,
  ...windowBoundariesLengthAndStateQuestions,
  ...fixedSizeWindowAndRollingUpdateQuestions,
  ...variableWindowExpandAndShrinkQuestions,
  ...validityInvariantAndAnswerTimingQuestions,
  ...frequencyMapAndDistinctStateQuestions,
  ...longestShortestAndExactConstraintQuestions,
  ...monotonicDequeWindowExtremesQuestions,
  ...edgeCasesTiesAndOutputContractQuestions,
  ...prefixSumsTwoPointersAndInvalidCasesQuestions,
  ...complexityAndMistakeReviewQuestions,
];
