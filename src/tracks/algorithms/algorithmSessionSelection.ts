import { shuffleArray } from "../../utils";
import {
  getAlgorithmTrainingItemsForRoadmapNode,
} from "./algorithmItems";
import type { AlgorithmRoadmapNodeId } from "./algorithmRoadmap";
import type { AlgorithmTrainingItem } from "./algorithmContentTypes";

export function selectAlgorithmSessionItemsForRoadmapNode(input: {
  nodeId: AlgorithmRoadmapNodeId;
  sessionLength: number;
}): readonly AlgorithmTrainingItem[] {
  return shuffleArray(getAlgorithmTrainingItemsForRoadmapNode(input.nodeId))
    .slice(0, input.sessionLength);
}
