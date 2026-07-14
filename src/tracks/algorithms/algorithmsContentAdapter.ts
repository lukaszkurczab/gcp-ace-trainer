import { ALGORITHMS_TRACK_ID, getTrackDefinition } from "../../domain";
import type { TrainingItemId, TrainingSessionModeId } from "../../domain/training";
import type { TrackContentAdapter } from "../types";
import { ALGORITHM_CONTENT_VERSION } from "./algorithmContentTypes";
import { algorithmContentGroups, type AlgorithmContentGroup } from "./content";
import type { AlgorithmQuestion } from "./algorithmQuestionTypes";
import type { AlgorithmRoadmapNodeId } from "./algorithmRoadmap";

const algorithmsTrack = getTrackDefinition(ALGORITHMS_TRACK_ID);

export type AlgorithmsContentAdapter = TrackContentAdapter<AlgorithmQuestion> & {
  getGroupForItemId(itemId: TrainingItemId): AlgorithmContentGroup | undefined;
  getGroups(): readonly AlgorithmContentGroup[];
  getItemsForRoadmapNode(nodeId: AlgorithmRoadmapNodeId): readonly AlgorithmQuestion[];
};

export function createAlgorithmsContentAdapter(
  groups: readonly AlgorithmContentGroup[] = algorithmContentGroups,
): AlgorithmsContentAdapter {
  const questions = groups.flatMap((group) => group.questions);
  const questionsById = new Map<string, AlgorithmQuestion>();
  const groupsByItemId = new Map<string, AlgorithmContentGroup>();
  const groupsByRoadmapNodeId = new Map<AlgorithmRoadmapNodeId, AlgorithmContentGroup>();

  for (const group of groups) {
    groupsByRoadmapNodeId.set(group.roadmapNodeId, group);

    for (const question of group.questions) {
      questionsById.set(question.id, question);
      groupsByItemId.set(question.id, group);
    }
  }

  return {
    getContentVersion: () => ALGORITHM_CONTENT_VERSION,
    getGroupForItemId: (itemId) => groupsByItemId.get(itemId),
    getGroups: () => groups,
    getItemById: (itemId) => questionsById.get(itemId),
    getItems: () => questions,
    getItemsForMode: (modeId: TrainingSessionModeId) => {
      const mode = algorithmsTrack.sessionModes.find((candidate) => candidate.id === modeId);

      if (!mode) {
        throw new Error(`Unknown Algorithms mode id: ${modeId}`);
      }

      return questions.filter((question) => mode.supportedItemTypes.includes(question.type));
    },
    getReviewContent: (itemId) => {
      const question = questionsById.get(itemId);
      return question ? { prompt: question.prompt, taxonomyRefs: [] } : undefined;
    },
    getItemsForRoadmapNode: (nodeId) =>
      groupsByRoadmapNodeId.get(nodeId)?.questions ?? [],
    trackId: ALGORITHMS_TRACK_ID,
  };
}

export const algorithmsContentAdapter = createAlgorithmsContentAdapter();
