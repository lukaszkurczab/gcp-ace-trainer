import type { ContentItemRef } from "./contentItemRef";
import { InvalidTrainingSessionError } from "./errors";
import type { TrackId } from "./trackIdentity";

export type TrainingSessionStatus = "active" | "completed" | "abandoned";
export type TrainingSessionConfigurationValue = string | number | boolean | readonly string[];
export type TrainingSessionConfigurationSnapshot = Readonly<Record<string, TrainingSessionConfigurationValue>>;

export type TrainingSession = Readonly<{
  id: string;
  trackId: TrackId;
  modeId: string;
  configurationSnapshot: TrainingSessionConfigurationSnapshot;
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
  if (!isConfigurationSnapshot(session.configurationSnapshot)) {
    throw new InvalidTrainingSessionError("configurationSnapshot must be a non-empty canonical configuration object.");
  }
  if (!Number.isFinite(session.activeForegroundMs) || session.activeForegroundMs < 0) {
    throw new InvalidTrainingSessionError("activeForegroundMs must be a non-negative finite number.");
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
  if (Object.values(session.optionOrderByItem).some((optionIds) => new Set(optionIds).size !== optionIds.length)) {
    throw new InvalidTrainingSessionError("Option order cannot contain duplicate option IDs.");
  }
  return Object.freeze({
    ...session,
    configurationSnapshot: freezeConfigurationSnapshot(session.configurationSnapshot),
    itemOrder: Object.freeze([...session.itemOrder]),
    optionOrderByItem: Object.freeze(Object.fromEntries(Object.entries(session.optionOrderByItem).map(([itemId, optionIds]) => [itemId, Object.freeze([...optionIds])]))),
  });
}

export function accumulateTrainingSessionForegroundTime(session: TrainingSession, elapsedMs: number): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can accumulate foreground time.");
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) throw new InvalidTrainingSessionError("Foreground elapsed time must be non-negative and finite.");
  return createTrainingSession({ ...session, activeForegroundMs: session.activeForegroundMs + elapsedMs });
}

export function areTrainingSessionConfigurationsEqual(left: TrainingSessionConfigurationSnapshot, right: TrainingSessionConfigurationSnapshot): boolean {
  const keys = new Set([...Object.keys(left), ...Object.keys(right)]);
  return [...keys].every((key) => JSON.stringify(left[key]) === JSON.stringify(right[key]));
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

function isConfigurationSnapshot(value: unknown): value is TrainingSessionConfigurationSnapshot {
  if (typeof value !== "object" || value === null || Array.isArray(value) || Object.keys(value).length === 0) return false;
  return Object.entries(value).every(([key, entry]) => key.length > 0 && (
    typeof entry === "string" || typeof entry === "boolean" ||
    (typeof entry === "number" && Number.isFinite(entry)) ||
    (Array.isArray(entry) && entry.every((item) => typeof item === "string"))
  ));
}

function freezeConfigurationSnapshot(snapshot: TrainingSessionConfigurationSnapshot): TrainingSessionConfigurationSnapshot {
  return Object.freeze(Object.fromEntries(Object.entries(snapshot).map(([key, value]) => [key, Array.isArray(value) ? Object.freeze([...value]) : value])));
}
