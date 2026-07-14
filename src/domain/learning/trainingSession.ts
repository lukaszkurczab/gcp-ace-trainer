import type { ContentItemRef } from "./contentItemRef";
import { InvalidTrainingSessionError } from "./errors";
import type { TrackId } from "./trackIdentity";

export type TrainingSessionStatus = "active" | "completed" | "abandoned";

export type TrainingSession = Readonly<{
  id: string;
  trackId: TrackId;
  modeId: string;
  requestedLength: number;
  actualLength: number;
  itemOrder: readonly ContentItemRef[];
  optionOrderByItem: Readonly<Record<string, readonly string[]>>;
  activeForegroundMs: number;
  contentVersion: string;
  status: TrainingSessionStatus;
  startedAt: string;
  completedAt?: string;
}>;

export function createTrainingSession(session: TrainingSession): TrainingSession {
  if (session.status !== "active" && session.status !== "completed" && session.status !== "abandoned") {
    throw new InvalidTrainingSessionError("Training session status is unsupported.");
  }
  if (!Number.isInteger(session.requestedLength) || session.requestedLength < 0) {
    throw new InvalidTrainingSessionError("requestedLength must be a non-negative integer.");
  }
  if (!Number.isInteger(session.actualLength) || session.actualLength <= 0) {
    throw new InvalidTrainingSessionError("actualLength must be a positive integer.");
  }
  if (session.requestedLength < session.actualLength) {
    throw new InvalidTrainingSessionError("requestedLength cannot be smaller than actualLength.");
  }
  if (session.actualLength !== session.itemOrder.length) {
    throw new InvalidTrainingSessionError("actualLength must equal itemOrder length.");
  }
  if (session.itemOrder.some((item) => item.trackId !== session.trackId || item.contentVersion !== session.contentVersion)) {
    throw new InvalidTrainingSessionError("Every item reference must match the session track and content version.");
  }
  const itemIds = new Set(session.itemOrder.map((item) => item.itemId));
  if (Object.keys(session.optionOrderByItem).some((itemId) => !itemIds.has(itemId))) {
    throw new InvalidTrainingSessionError("Option order cannot reference an item outside the session.");
  }
  return Object.freeze({ ...session, itemOrder: Object.freeze([...session.itemOrder]), optionOrderByItem: Object.freeze({ ...session.optionOrderByItem }) });
}
