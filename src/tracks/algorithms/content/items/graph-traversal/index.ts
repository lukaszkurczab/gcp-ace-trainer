import { recognizeGraphTraversalSignalQuestions } from "./recognize-graph-traversal-signal";
import { graphRepresentationAndNeighborIterationQuestions } from "./graph-representation-and-neighbor-iteration";
import { visitedStateAndMarkingTimingQuestions } from "./visited-state-and-marking-timing";
import { bfsQueueAndLevelOrderQuestions } from "./bfs-queue-and-level-order";
import { recursiveDfsAndCallStateQuestions } from "./recursive-dfs-and-call-state";
import { iterativeDfsStackAndOrderQuestions } from "./iterative-dfs-stack-and-order";
import { disconnectedComponentsAndRestartsQuestions } from "./disconnected-components-and-restarts";
import { gridAsGraphAndBoundariesQuestions } from "./grid-as-graph-and-boundaries";
import { directedUndirectedAndParentEdgeQuestions } from "./directed-undirected-and-parent-edge";
import { unweightedShortestPathAndMultiSourceBfsQuestions } from "./unweighted-shortest-path-and-multi-source-bfs";
import { outputContractParentAndPathReconstructionQuestions } from "./output-contract-parent-and-path-reconstruction";
import { complexityAndMistakeReviewQuestions } from "./complexity-and-mistake-review";

export const graphTraversalQuestions = [
  ...recognizeGraphTraversalSignalQuestions,
  ...graphRepresentationAndNeighborIterationQuestions,
  ...visitedStateAndMarkingTimingQuestions,
  ...bfsQueueAndLevelOrderQuestions,
  ...recursiveDfsAndCallStateQuestions,
  ...iterativeDfsStackAndOrderQuestions,
  ...disconnectedComponentsAndRestartsQuestions,
  ...gridAsGraphAndBoundariesQuestions,
  ...directedUndirectedAndParentEdgeQuestions,
  ...unweightedShortestPathAndMultiSourceBfsQuestions,
  ...outputContractParentAndPathReconstructionQuestions,
  ...complexityAndMistakeReviewQuestions,
];
