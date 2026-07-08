import { bigOBasicsQuestions } from "./big-o-basics";
import { constraintFirstRejectionQuestions } from "./constraint-first-rejection";
import { timeSpaceTradeoffsQuestions } from "./time-space-tradeoffs";
import { hiddenOperationCostQuestions } from "./hidden-operation-cost";
import { preprocessingAndQueriesQuestions } from "./preprocessing-and-queries";
import { spaceComplexityPrecisionQuestions } from "./space-complexity-precision";
import { reasoningOrderAndMistakesQuestions } from "./reasoning-order-and-mistakes";

export const complexityAndConstraintsQuestions = [
  ...bigOBasicsQuestions,
  ...constraintFirstRejectionQuestions,
  ...timeSpaceTradeoffsQuestions,
  ...hiddenOperationCostQuestions,
  ...preprocessingAndQueriesQuestions,
  ...spaceComplexityPrecisionQuestions,
  ...reasoningOrderAndMistakesQuestions,
];

export default complexityAndConstraintsQuestions;
