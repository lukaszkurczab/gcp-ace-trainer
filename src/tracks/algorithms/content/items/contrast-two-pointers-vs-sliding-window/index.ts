import { recognizeTwoPointersVsSlidingWindowStrategySignalQuestions } from "./recognize-strategy-signal";
import { taxonomyAndPointerRoleSemanticsQuestions } from "./taxonomy-and-pointer-role-semantics";
import { oppositeEndsPairSearchQuestions } from "./opposite-ends-pair-search";
import { sameDirectionReadWriteAndCompactionQuestions } from "./same-direction-read-write-and-compaction";
import { fixedSizeWindowContractQuestions } from "./fixed-size-window-contract";
import { variableWindowValidityAndShrinkQuestions } from "./variable-window-validity-and-shrink";
import { sortingContiguityAndOutputContractQuestions } from "./sorting-contiguity-and-output-contract";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const contrastTwoPointersVsSlidingWindowQuestions = [
  ...recognizeTwoPointersVsSlidingWindowStrategySignalQuestions,
  ...taxonomyAndPointerRoleSemanticsQuestions,
  ...oppositeEndsPairSearchQuestions,
  ...sameDirectionReadWriteAndCompactionQuestions,
  ...fixedSizeWindowContractQuestions,
  ...variableWindowValidityAndShrinkQuestions,
  ...sortingContiguityAndOutputContractQuestions,
  ...complexityAndMistakeReviewQuestions,
];
