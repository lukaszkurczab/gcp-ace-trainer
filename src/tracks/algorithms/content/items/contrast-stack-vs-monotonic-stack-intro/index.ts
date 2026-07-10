import { recognizeStackVsMonotonicStackStrategySignalQuestions } from "./recognize-strategy-signal";
import { plainStackLifoContractQuestions } from "./plain-stack-lifo-contract";
import { monotonicInvariantDirectionQuestions } from "./monotonic-invariant-direction";
import { nextGreaterSmallerResolutionQuestions } from "./next-greater-smaller-resolution";
import { previousBoundaryAndAnswerOwnershipQuestions } from "./previous-boundary-and-answer-ownership";
import { indicesValuesAndDistanceContractQuestions } from "./indices-values-and-distance-contract";
import { duplicatesStrictnessAndUnresolvedStateQuestions } from "./duplicates-strictness-and-unresolved-state";
import { amortizedComplexityAndMistakeReviewQuestions } from "./amortized-complexity-and-mistake-review";

export const contrastStackVsMonotonicStackIntroQuestions = [
  ...recognizeStackVsMonotonicStackStrategySignalQuestions,
  ...plainStackLifoContractQuestions,
  ...monotonicInvariantDirectionQuestions,
  ...nextGreaterSmallerResolutionQuestions,
  ...previousBoundaryAndAnswerOwnershipQuestions,
  ...indicesValuesAndDistanceContractQuestions,
  ...duplicatesStrictnessAndUnresolvedStateQuestions,
  ...amortizedComplexityAndMistakeReviewQuestions,
];
