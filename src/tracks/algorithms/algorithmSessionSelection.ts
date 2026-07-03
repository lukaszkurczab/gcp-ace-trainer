import { shuffleArray } from "../../utils";
import type { TrainingSessionModeId } from "../../domain/training";
import type { TrackContentAdapter } from "../types";
import { ALGORITHMS_SESSION_MODE_ID } from "./algorithmItems";
import type { AlgorithmRoadmapNodeId } from "./algorithmRoadmap";
import type { AlgorithmTrainingItem } from "./algorithmContentTypes";
import { algorithmsContentAdapter } from "./algorithmsContentAdapter";

export function selectAlgorithmSessionItemsForRoadmapNode(input: {
  contentAdapter?: TrackContentAdapter;
  modeId?: TrainingSessionModeId;
  nodeId: AlgorithmRoadmapNodeId;
  sessionLength: number;
}): readonly AlgorithmTrainingItem[] {
  const adapter = input.contentAdapter ?? algorithmsContentAdapter;
  const modeId = input.modeId ?? ALGORITHMS_SESSION_MODE_ID;

  return shuffleArray(
    adapter.getItemsForMode(modeId)
      .filter((item) => (
        item.trackId === "algorithms" &&
        "roadmapNodeId" in item &&
        item.roadmapNodeId === input.nodeId
      ))
      .map((item) => item as unknown as AlgorithmTrainingItem),
  )
    .slice(0, input.sessionLength);
}
