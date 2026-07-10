import { ambiguityClarifyingQuestionsAndAssumptionsQuestions } from "./ambiguity-clarifying-questions-and-assumptions";
import { chooseStateAndDataRepresentationQuestions } from "./choose-state-and-data-representation";
import { constraintsAndTargetComplexityQuestions } from "./constraints-and-target-complexity";
import { correctnessBeforeComplexityQuestions } from "./correctness-before-complexity";
import { generateAndCompareCandidateStrategiesQuestions } from "./generate-and-compare-candidate-strategies";
import { inputPropertiesAndStructuralSignalsQuestions } from "./input-properties-and-structural-signals";
import { invariantsAndProgressMeasuresQuestions } from "./invariants-and-progress-measures";
import { preconditionsAndInvalidApproachEliminationQuestions } from "./preconditions-and-invalid-approach-elimination";
import { problemContractAndOutputShapeQuestions } from "./problem-contract-and-output-shape";
import { strategyJustificationAndMistakeReviewQuestions } from "./strategy-justification-and-mistake-review";
import { timeSpacePreprocessingAndMutationTradeoffsQuestions } from "./time-space-preprocessing-and-mutation-tradeoffs";

export const strategySelectionCoreQuestions = [
  ...problemContractAndOutputShapeQuestions,
  ...constraintsAndTargetComplexityQuestions,
  ...inputPropertiesAndStructuralSignalsQuestions,
  ...generateAndCompareCandidateStrategiesQuestions,
  ...preconditionsAndInvalidApproachEliminationQuestions,
  ...chooseStateAndDataRepresentationQuestions,
  ...invariantsAndProgressMeasuresQuestions,
  ...correctnessBeforeComplexityQuestions,
  ...timeSpacePreprocessingAndMutationTradeoffsQuestions,
  ...ambiguityClarifyingQuestionsAndAssumptionsQuestions,
  ...strategyJustificationAndMistakeReviewQuestions,
];
