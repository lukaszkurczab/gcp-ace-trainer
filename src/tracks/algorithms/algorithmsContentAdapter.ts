import { ALGORITHMS_TRACK_ID, getTrackDefinition } from "../../domain";
import type { TrainingItem, TrainingItemId, TrainingSessionModeId } from "../../domain/training";
import type { TrackContentAdapter } from "../types";
import { ALGORITHM_TRAINING_ITEMS } from "./algorithmItems";

const algorithmsTrack = getTrackDefinition(ALGORITHMS_TRACK_ID);

export function createAlgorithmsContentAdapter(
  items: readonly TrainingItem[] = ALGORITHM_TRAINING_ITEMS,
): TrackContentAdapter {
  const algorithmsItems = items.filter((item) => item.trackId === ALGORITHMS_TRACK_ID);
  const itemsById = new Map(algorithmsItems.map((item) => [item.id, item]));

  return {
    getContentVersion: () => algorithmsTrack.contentManifest.version,
    getItemById: (itemId: TrainingItemId) => itemsById.get(itemId),
    getItems: () => algorithmsItems,
    getItemsForMode: (modeId: TrainingSessionModeId) => {
      const mode = algorithmsTrack.sessionModes.find((item) => item.id === modeId);

      if (!mode) {
        throw new Error(`Unknown Algorithms mode id: ${modeId}`);
      }

      return algorithmsItems.filter((item) => mode.supportedItemTypes.includes(item.type));
    },
    trackId: ALGORITHMS_TRACK_ID,
  };
}

export const algorithmsContentAdapter = createAlgorithmsContentAdapter();
