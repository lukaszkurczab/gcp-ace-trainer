import type { TrackId, TrainingItemType } from "../tracks";
import type { TrainingItemId } from "./trainingItem";

export type TrainingSessionId = string;
export type TrainingSessionModeId = string;

export type TrainingSessionStatus =
  | "active"
  | "completed"
  | "abandoned"
  | "expired";

export type TrainingSessionItemRef = {
  itemId: TrainingItemId;
  itemType?: TrainingItemType;
  trackId?: TrackId;
};

export type TrainingSession = {
  completedAt?: string;
  currentItemIndex: number;
  id: TrainingSessionId;
  itemRefs: TrainingSessionItemRef[];
  modeId: TrainingSessionModeId;
  startedAt: string;
  status: TrainingSessionStatus;
  trackId: TrackId;
};
