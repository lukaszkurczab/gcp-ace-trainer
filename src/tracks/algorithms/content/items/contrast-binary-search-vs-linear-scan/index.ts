import { recognizeContrastSignalQuestions } from "./recognize-contrast-signal";
import { sortedLookupVsLinearScanQuestions } from "./sorted-lookup-vs-linear-scan";
import { invalidBinarySearchRejectionsQuestions } from "./invalid-binary-search-rejections";
import { monotonicBoundaryVsLinearScanQuestions } from "./monotonic-boundary-vs-linear-scan";
import { preprocessingAndQueryVolumeQuestions } from "./preprocessing-and-query-volume";
import { costExplanationAndMistakeReviewQuestions } from "./cost-explanation-and-mistake-review";

export const contrastBinarySearchVsLinearScanQuestions = [
  ...recognizeContrastSignalQuestions,
  ...sortedLookupVsLinearScanQuestions,
  ...invalidBinarySearchRejectionsQuestions,
  ...monotonicBoundaryVsLinearScanQuestions,
  ...preprocessingAndQueryVolumeQuestions,
  ...costExplanationAndMistakeReviewQuestions,
];
