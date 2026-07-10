import { recognizeTreeTraversalSignalQuestions } from "./recognize-tree-traversal-signal";
import { treeNodeSubtreeAndBaseContractQuestions } from "./tree-node-subtree-and-base-contract";
import { preorderInorderAndPostorderQuestions } from "./preorder-inorder-and-postorder";
import { recursiveDfsCallFlowQuestions } from "./recursive-dfs-call-flow";
import { iterativeDfsAndStackEntryDesignQuestions } from "./iterative-dfs-and-stack-entry-design";
import { levelOrderBfsAndLevelBoundariesQuestions } from "./level-order-bfs-and-level-boundaries";
import { depthHeightAndSubtreeAggregationQuestions } from "./depth-height-and-subtree-aggregation";
import { pathStateAndRootToLeafTraversalQuestions } from "./path-state-and-root-to-leaf-traversal";
import { returnValuesGlobalStateAndShortCircuitQuestions } from "./return-values-global-state-and-short-circuit";
import { binaryVsNaryAndChildOrderQuestions } from "./binary-vs-nary-and-child-order";
import { treeVsBstAndGraphTraversalQuestions } from "./tree-vs-bst-and-graph-traversal";
import { complexityStackWidthAndMistakeReviewQuestions } from "./complexity-stack-width-and-mistake-review";

export const treeTraversalQuestions = [
  ...recognizeTreeTraversalSignalQuestions,
  ...treeNodeSubtreeAndBaseContractQuestions,
  ...preorderInorderAndPostorderQuestions,
  ...recursiveDfsCallFlowQuestions,
  ...iterativeDfsAndStackEntryDesignQuestions,
  ...levelOrderBfsAndLevelBoundariesQuestions,
  ...depthHeightAndSubtreeAggregationQuestions,
  ...pathStateAndRootToLeafTraversalQuestions,
  ...returnValuesGlobalStateAndShortCircuitQuestions,
  ...binaryVsNaryAndChildOrderQuestions,
  ...treeVsBstAndGraphTraversalQuestions,
  ...complexityStackWidthAndMistakeReviewQuestions,
];
