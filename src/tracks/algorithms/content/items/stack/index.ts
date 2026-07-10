import { recognizeStackSignalQuestions } from "./recognize-stack-signal";
import { lifoContractPushPopAndPeekQuestions } from "./lifo-contract-push-pop-and-peek";
import { stackEntryDesignAndStateInvariantQuestions } from "./stack-entry-design-and-state-invariant";
import { balancedDelimitersAndNestingQuestions } from "./balanced-delimiters-and-nesting";
import { postfixPrefixAndOperandOrderQuestions } from "./postfix-prefix-and-operand-order";
import { infixPrecedenceAndAssociativityQuestions } from "./infix-precedence-and-associativity";
import { simulationUndoAndPathProcessingQuestions } from "./simulation-undo-and-path-processing";
import { adjacentCancellationAndStackReductionQuestions } from "./adjacent-cancellation-and-stack-reduction";
import { stackVsRecursionQueueAndMonotonicStackQuestions } from "./stack-vs-recursion-queue-and-monotonic-stack";
import { edgeCasesOutputAndMutationContractQuestions } from "./edge-cases-output-and-mutation-contract";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const stackQuestions = [
  ...recognizeStackSignalQuestions,
  ...lifoContractPushPopAndPeekQuestions,
  ...stackEntryDesignAndStateInvariantQuestions,
  ...balancedDelimitersAndNestingQuestions,
  ...postfixPrefixAndOperandOrderQuestions,
  ...infixPrecedenceAndAssociativityQuestions,
  ...simulationUndoAndPathProcessingQuestions,
  ...adjacentCancellationAndStackReductionQuestions,
  ...stackVsRecursionQueueAndMonotonicStackQuestions,
  ...edgeCasesOutputAndMutationContractQuestions,
  ...complexityAndMistakeReviewQuestions,
];
