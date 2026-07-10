import { recognizeSlidingWindowVsPrefixSumsStrategySignalQuestions } from "./recognize-strategy-signal";
import { fixedSizeWindowVsPrefixQueryQuestions } from "./fixed-size-window-vs-prefix-query";
import { variableWindowMonotonicityAndShrinkQuestions } from "./variable-window-monotonicity-and-shrink";
import { repeatedRangeQueriesAndPreprocessingQuestions } from "./repeated-range-queries-and-preprocessing";
import { negativeValuesAndInvalidWindowAssumptionsQuestions } from "./negative-values-and-invalid-window-assumptions";
import { streamingOnlineAndDynamicUpdatesQuestions } from "./streaming-online-and-dynamic-updates";
import { aggregateAndOutputContractQuestions } from "./aggregate-and-output-contract";
import { complexitySpaceAndMistakeReviewQuestions } from "./complexity-space-and-mistake-review";

export const contrastSlidingWindowVsPrefixSumsQuestions = [
  ...recognizeSlidingWindowVsPrefixSumsStrategySignalQuestions,
  ...fixedSizeWindowVsPrefixQueryQuestions,
  ...variableWindowMonotonicityAndShrinkQuestions,
  ...repeatedRangeQueriesAndPreprocessingQuestions,
  ...negativeValuesAndInvalidWindowAssumptionsQuestions,
  ...streamingOnlineAndDynamicUpdatesQuestions,
  ...aggregateAndOutputContractQuestions,
  ...complexitySpaceAndMistakeReviewQuestions,
];
