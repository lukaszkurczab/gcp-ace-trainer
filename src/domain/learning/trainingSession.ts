import type { ContentItemRef } from "./contentItemRef";
import { InvalidTrainingSessionError } from "./errors";
import type { TrackId } from "./trackIdentity";

export type TrainingSessionStatus = "active" | "completed" | "abandoned";
export type TrainingSessionConfigurationValue = string | number | boolean | readonly string[];
export type TrainingSessionConfigurationSnapshot = Readonly<Record<string, TrainingSessionConfigurationValue>>;
export type TrainingSessionItemOccurrence = Readonly<{
  occurrenceId: string;
  item: ContentItemRef;
}>;

export type TrainingSession = Readonly<{
  id: string;
  trackId: TrackId;
  modeId: string;
  configurationSnapshot: TrainingSessionConfigurationSnapshot;
  requestedLength: number;
  actualLength: number;
  currentItemIndex: number;
  itemOrder: readonly TrainingSessionItemOccurrence[];
  optionOrderByOccurrence: Readonly<Record<string, readonly string[]>>;
  flaggedOccurrenceIds: readonly string[];
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
  if (session.itemOrder.some((occurrence) => !occurrence.occurrenceId.trim() || occurrence.item.trackId !== session.trackId || occurrence.item.contentVersion !== session.contentVersion)) {
    throw new InvalidTrainingSessionError("Every item reference must match the session track and content version.");
  }
  const occurrenceIds = new Set(session.itemOrder.map((occurrence) => occurrence.occurrenceId));
  if (occurrenceIds.size !== session.itemOrder.length) {
    throw new InvalidTrainingSessionError("Session occurrence identities must be unique.");
  }
  if (Object.keys(session.optionOrderByOccurrence).some((occurrenceId) => !occurrenceIds.has(occurrenceId))) {
    throw new InvalidTrainingSessionError("Option order cannot reference an occurrence outside the session.");
  }
  if (Object.values(session.optionOrderByOccurrence).some((optionIds) => new Set(optionIds).size !== optionIds.length)) {
    throw new InvalidTrainingSessionError("Option order cannot contain duplicate option IDs.");
  }
  if (new Set(session.flaggedOccurrenceIds).size !== session.flaggedOccurrenceIds.length ||
    session.flaggedOccurrenceIds.some((occurrenceId) => !occurrenceIds.has(occurrenceId))) {
    throw new InvalidTrainingSessionError("Flagged occurrences must be unique members of the immutable session plan.");
  }
  return Object.freeze({
    ...session,
    configurationSnapshot: freezeConfigurationSnapshot(session.configurationSnapshot),
    itemOrder: Object.freeze(session.itemOrder.map((occurrence) => Object.freeze({ ...occurrence, item: Object.freeze({ ...occurrence.item }) }))),
    optionOrderByOccurrence: Object.freeze(Object.fromEntries(Object.entries(session.optionOrderByOccurrence).map(([occurrenceId, optionIds]) => [occurrenceId, Object.freeze([...optionIds])]))),
    flaggedOccurrenceIds: Object.freeze([...session.flaggedOccurrenceIds]),
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
  const occurrence = session.itemOrder[session.currentItemIndex];
  if (!occurrence) throw new InvalidTrainingSessionError("The current session item is unavailable.");
  return occurrence.item;
}

export function moveTrainingSessionToIndex(session: TrainingSession, currentItemIndex: number): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can change position.");
  return createTrainingSession({ ...session, currentItemIndex });
}

export function setTrainingSessionOccurrenceFlagged(session: TrainingSession, occurrenceId: string, flagged: boolean): TrainingSession {
  if (session.status !== "active") throw new InvalidTrainingSessionError("Only an active session can change flags.");
  if (!session.itemOrder.some((occurrence) => occurrence.occurrenceId === occurrenceId)) {
    throw new InvalidTrainingSessionError("A session flag must identify an occurrence in the immutable session plan.");
  }
  const flags = new Set(session.flaggedOccurrenceIds);
  if (flagged) flags.add(occurrenceId);
  else flags.delete(occurrenceId);
  return createTrainingSession({ ...session, flaggedOccurrenceIds: [...flags] });
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
