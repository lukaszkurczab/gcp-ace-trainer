import { recognizeGreedySignalQuestions } from "./recognize-greedy-signal";
import { defineLocalChoiceAndObjectiveQuestions } from "./define-local-choice-and-objective";
import { orderingAndTieBreakingQuestions } from "./ordering-and-tie-breaking";
import { feasibilityAndPrefixInvariantQuestions } from "./feasibility-and-prefix-invariant";
import { exchangeAndStaysAheadProofQuestions } from "./exchange-and-stays-ahead-proof";
import { counterexamplesAndInvalidGreedyRulesQuestions } from "./counterexamples-and-invalid-greedy-rules";
import { intervalSelectionAndBoundarySemanticsQuestions } from "./interval-selection-and-boundary-semantics";
import { coverageReachAndResourceBalanceQuestions } from "./coverage-reach-and-resource-balance";
import { greedyVsDpAndBacktrackingQuestions } from "./greedy-vs-dp-and-backtracking";
import { outputContractAndReconstructionQuestions } from "./output-contract-and-reconstruction";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const greedyIntroQuestions = [
  ...recognizeGreedySignalQuestions,
  ...defineLocalChoiceAndObjectiveQuestions,
  ...orderingAndTieBreakingQuestions,
  ...feasibilityAndPrefixInvariantQuestions,
  ...exchangeAndStaysAheadProofQuestions,
  ...counterexamplesAndInvalidGreedyRulesQuestions,
  ...intervalSelectionAndBoundarySemanticsQuestions,
  ...coverageReachAndResourceBalanceQuestions,
  ...greedyVsDpAndBacktrackingQuestions,
  ...outputContractAndReconstructionQuestions,
  ...complexityAndMistakeReviewQuestions,
];
