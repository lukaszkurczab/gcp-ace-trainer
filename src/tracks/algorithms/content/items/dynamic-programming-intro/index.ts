import { recognizeDpSignalQuestions } from "./recognize-dp-signal";
import { defineStateAndSubproblemQuestions } from "./define-state-and-subproblem";
import { baseCasesAndImpossibleStatesQuestions } from "./base-cases-and-impossible-states";
import { transitionsAndChoiceModelQuestions } from "./transitions-and-choice-model";
import { topDownMemoizationQuestions } from "./top-down-memoization";
import { bottomUpTabulationAndDependencyOrderQuestions } from "./bottom-up-tabulation-and-dependency-order";
import { objectiveAggregationAndStateValuesQuestions } from "./objective-aggregation-and-state-values";
import { topDownVsBottomUpTradeoffsQuestions } from "./top-down-vs-bottom-up-tradeoffs";
import { stateSpaceAndTransitionComplexityQuestions } from "./state-space-and-transition-complexity";
import { spaceOptimizationAndOutputContractQuestions } from "./space-optimization-and-output-contract";

export const dynamicProgrammingIntroQuestions = [
  ...recognizeDpSignalQuestions,
  ...defineStateAndSubproblemQuestions,
  ...baseCasesAndImpossibleStatesQuestions,
  ...transitionsAndChoiceModelQuestions,
  ...topDownMemoizationQuestions,
  ...bottomUpTabulationAndDependencyOrderQuestions,
  ...objectiveAggregationAndStateValuesQuestions,
  ...topDownVsBottomUpTradeoffsQuestions,
  ...stateSpaceAndTransitionComplexityQuestions,
  ...spaceOptimizationAndOutputContractQuestions,
];
