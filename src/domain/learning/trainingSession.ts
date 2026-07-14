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
  currentItemIndex: number;
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
  if (!Number.isInteger(session.currentItemIndex) || session.currentItemIndex < 0 || session.currentItemIndex >= session.actualLength) {
    throw new InvalidTrainingSessionError("currentItemIndex must identify an item in itemOrder.");
  }
  if (session.status === "completed" && session.currentItemIndex !== session.actualLength - 1) {
    throw new InvalidTrainingSessionError("A completed session must remain positioned at its final item.");
  }
  if (session.itemOrder.some((item) => item.trackId !== session.trackId || item.contentVersion !== session.contentVersion)) {
    throw new InvalidTrainingSessionError("Every item reference must match the session track and content version.");
  }
  const itemIds = new Set(session.itemOrder.map((item) => item.itemId));
  if (itemIds.size !== session.itemOrder.length) {
    throw new InvalidTrainingSessionError("Session item references must be unique.");
  }
  if (Object.keys(session.optionOrderByItem).some((itemId) => !itemIds.has(itemId))) {
    throw new InvalidTrainingSessionError("Option order cannot reference an item outside the session.");
  }
  return Object.freeze({ ...session, itemOrder: Object.freeze([...session.itemOrder]), optionOrderByItem: Object.freeze({ ...session.optionOrderByItem }) });
}

export function getCurrentSessionItem(session: TrainingSession): ContentItemRef {
  const item = session.itemOrder[session.currentItemIndex];
  if (!item) throw new InvalidTrainingSessionError("The current session item is unavailable.");
  return item;
}

export function moveTrainingSessionToIndex(session: TrainingSession, currentItemIndex: number): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can change position.");
  return createTrainingSession({ ...session, currentItemIndex });
}

export function advanceTrainingSession(session: TrainingSession): TrainingSession {
  if (session.currentItemIndex >= session.actualLength - 1) {
    throw new InvalidTrainingSessionError("The session is already positioned at its final item.");
  }
  return moveTrainingSessionToIndex(session, session.currentItemIndex + 1);
}

export function completeTrainingSession(session: TrainingSession, completedAt: string): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can be completed.");
  return createTrainingSession({ ...session, currentItemIndex: session.actualLength - 1, status: "completed", completedAt });
}

export function abandonTrainingSession(session: TrainingSession, completedAt?: string): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can be abandoned.");
  return createTrainingSession({ ...session, status: "abandoned", completedAt });
}
