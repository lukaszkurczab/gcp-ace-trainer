import { recognizeHashStateSignalQuestions } from "./recognize-hash-state-signal";
import { chooseMapVsSetStateQuestions } from "./choose-map-vs-set-state";
import { membershipSeenAndDuplicatesQuestions } from "./membership-seen-and-duplicates";
import { setAlgebraAndDistinctRelationsQuestions } from "./set-algebra-and-distinct-relations";
import { frequencyCountingAndMultisetsQuestions } from "./frequency-counting-and-multisets";
import { complementLookupAndIndexRecoveryQuestions } from "./complement-lookup-and-index-recovery";
import { groupingAndCanonicalKeysQuestions } from "./grouping-and-canonical-keys";
import { stateUpdateLifecycleAndInvariantsQuestions } from "./state-update-lifecycle-and-invariants";
import { keyIdentityAndCompositeKeysQuestions } from "./key-identity-and-composite-keys";
import { outputOrderAndOccurrenceContractQuestions } from "./output-order-and-occurrence-contract";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const hashMapAndSetQuestions = [
  ...recognizeHashStateSignalQuestions,
  ...chooseMapVsSetStateQuestions,
  ...membershipSeenAndDuplicatesQuestions,
  ...setAlgebraAndDistinctRelationsQuestions,
  ...frequencyCountingAndMultisetsQuestions,
  ...complementLookupAndIndexRecoveryQuestions,
  ...groupingAndCanonicalKeysQuestions,
  ...stateUpdateLifecycleAndInvariantsQuestions,
  ...keyIdentityAndCompositeKeysQuestions,
  ...outputOrderAndOccurrenceContractQuestions,
  ...complexityAndMistakeReviewQuestions,
];

