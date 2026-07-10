import { recognizeRecursiveStructureQuestions } from "./recognize-recursive-structure";
import { defineSubproblemAndProgressQuestions } from "./define-subproblem-and-progress";
import { baseCasesAndTerminationQuestions } from "./base-cases-and-termination";
import { callStackFramesAndLocalStateQuestions } from "./call-stack-frames-and-local-state";
import { workBeforeVsAfterRecursiveCallQuestions } from "./work-before-vs-after-recursive-call";
import { returnValuesAndResultCompositionQuestions } from "./return-values-and-result-composition";
import { statePassingAccumulatorsAndSideEffectsQuestions } from "./state-passing-accumulators-and-side-effects";
import { multipleCallsAndRecursionTreesQuestions } from "./multiple-calls-and-recursion-trees";
import { recursionVsIterationAndTailPositionQuestions } from "./recursion-vs-iteration-and-tail-position";
import { backtrackingAndDpBoundaryQuestions } from "./backtracking-and-dp-boundary";
import { complexityStackDepthAndMistakeReviewQuestions } from "./complexity-stack-depth-and-mistake-review";

export const recursionBasicsQuestions = [
  ...recognizeRecursiveStructureQuestions,
  ...defineSubproblemAndProgressQuestions,
  ...baseCasesAndTerminationQuestions,
  ...callStackFramesAndLocalStateQuestions,
  ...workBeforeVsAfterRecursiveCallQuestions,
  ...returnValuesAndResultCompositionQuestions,
  ...statePassingAccumulatorsAndSideEffectsQuestions,
  ...multipleCallsAndRecursionTreesQuestions,
  ...recursionVsIterationAndTailPositionQuestions,
  ...backtrackingAndDpBoundaryQuestions,
  ...complexityStackDepthAndMistakeReviewQuestions,
];
