import type { TrackId } from "../tracks";
import type {
  TrainingItem,
  TrainingSession,
  TrainingSessionId,
  TrainingSessionItemRef,
  TrainingSessionModeId,
} from "../training";

export type CreateTrainingSessionInput = {
  id?: TrainingSessionId;
  itemRefs?: readonly TrainingSessionItemRef[];
  items?: readonly TrainingItem[];
  modeId: TrainingSessionModeId;
  startedAt: string;
  trackId: TrackId;
};

export function createTrainingSession(input: CreateTrainingSessionInput): TrainingSession {
  const itemRefs = input.items
    ? input.items.map((item) => ({
        itemId: item.id,
        itemType: item.type,
        trackId: item.trackId,
      }))
    : [...(input.itemRefs ?? [])];

  if (itemRefs.length === 0) {
    throw new Error("Cannot create a training session without items.");
  }

  const mismatchedRef = itemRefs.find((itemRef) => itemRef.trackId !== undefined && itemRef.trackId !== input.trackId);

  if (mismatchedRef) {
    throw new Error(`Training session item ${mismatchedRef.itemId} does not belong to track ${input.trackId}.`);
  }

  return {
    currentItemIndex: 0,
    id: input.id ?? buildTrainingSessionId(input.trackId, input.modeId, input.startedAt),
    itemRefs,
    modeId: input.modeId,
    startedAt: input.startedAt,
    status: "active",
    trackId: input.trackId,
  };
}

function buildTrainingSessionId(
  trackId: TrackId,
  modeId: TrainingSessionModeId,
  startedAt: string,
): TrainingSessionId {
  return `session:${trackId}:${modeId}:${startedAt}`;
}
