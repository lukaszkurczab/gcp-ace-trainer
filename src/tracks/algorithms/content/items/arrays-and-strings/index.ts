import { filteringOutputContractQuestions } from "./filtering-output-contract";
import { frequencyCountingQuestions } from "./frequency-counting";
import { indexedScanBoundaryQuestions } from "./indexed-scan-boundary";
import { presenceTrackingQuestions } from "./presence-tracking";
import { sortedDuplicateCollapseQuestions } from "./sorted-duplicate-collapse";
import { stringNormalizationQuestions } from "./string-normalization";

const arraysAndStringsQuestions = [
  ...indexedScanBoundaryQuestions,
  ...frequencyCountingQuestions,
  ...presenceTrackingQuestions,
  ...stringNormalizationQuestions,
  ...filteringOutputContractQuestions,
  ...sortedDuplicateCollapseQuestions,
];

export { arraysAndStringsQuestions };
export default arraysAndStringsQuestions;
