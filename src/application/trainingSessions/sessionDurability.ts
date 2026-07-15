import {
  accumulateTrainingSessionForegroundTime,
  advanceTrainingSession,
  areTrainingSessionConfigurationsEqual,
  type TrainingAttempt,
  type TrainingSession,
} from "../../domain";
import { getActiveTrainingSession, saveTrainingSession } from "../../storage/repositories";

export type TrainingSessionPersistenceBoundary = Readonly<{
  getActive(): Promise<TrainingSession | null>;
  save(session: TrainingSession): Promise<void>;
}>;

const canonicalPersistence: TrainingSessionPersistenceBoundary = {
  getActive: getActiveTrainingSession,
  save: saveTrainingSession,
};

export class TrainingSessionStartError extends Error {}
export class TrainingSessionProgressError extends Error {}
export class TrainingSessionOptionPlanError extends Error {}

export type TrainingSessionProgress<Response = unknown> = Readonly<{
  attempts: readonly TrainingAttempt<Response>[];
  currentAttempt: TrainingAttempt<Response> | null;
}>;

export function assertTrainingSessionOptionPlan(
  session: TrainingSession,
  expectedOptionIdsByOccurrence: Readonly<Record<string, readonly string[]>>,
): void {
  for (const [occurrenceId, expectedIds] of Object.entries(expectedOptionIdsByOccurrence)) {
    const durableIds = session.optionOrderByOccurrence[occurrenceId];
    if (!durableIds || durableIds.length !== expectedIds.length || new Set(durableIds).size !== durableIds.length ||
      durableIds.some((id) => !expectedIds.includes(id)) || expectedIds.some((id) => !durableIds.includes(id))) {
      throw new TrainingSessionOptionPlanError(`Durable option plan for ${occurrenceId} does not match the active content item occurrence.`);
    }
  }
}

export function getTrainingSessionProgress<Response>(
  session: TrainingSession,
  attempts: readonly TrainingAttempt<Response>[],
): TrainingSessionProgress<Response> {
  const occurrencePosition = new Map(session.itemOrder.map((occurrence, index) => [occurrence.occurrenceId, index]));
  const plannedOccurrences = new Map(session.itemOrder.map((occurrence) => [occurrence.occurrenceId, occurrence]));
  const sessionAttempts = attempts
    .filter((attempt) => attempt.sessionId === session.id)
    .sort((left, right) => (occurrencePosition.get(left.occurrenceId) ?? Number.MAX_SAFE_INTEGER) - (occurrencePosition.get(right.occurrenceId) ?? Number.MAX_SAFE_INTEGER));
  for (const attempt of sessionAttempts) {
    const plannedOccurrence = plannedOccurrences.get(attempt.occurrenceId);
    if (!plannedOccurrence || !equalItemRef(plannedOccurrence.item, attempt.item) || attempt.trackId !== session.trackId || attempt.modeId !== session.modeId) {
      throw new TrainingSessionProgressError(`Attempt ${attempt.id} does not belong to the durable session plan.`);
    }
  }
  const occurrenceAttemptCounts = new Map<string, number>();
  for (const attempt of sessionAttempts) occurrenceAttemptCounts.set(attempt.occurrenceId, (occurrenceAttemptCounts.get(attempt.occurrenceId) ?? 0) + 1);
  const duplicateOccurrenceId = [...occurrenceAttemptCounts].find(([, count]) => count > 1)?.[0];
  if (duplicateOccurrenceId) throw new TrainingSessionProgressError(`Durable session occurrence ${duplicateOccurrenceId} has multiple committed attempts.`);
  const currentOccurrenceId = session.itemOrder[session.currentItemIndex]?.occurrenceId;
  return {
    attempts: sessionAttempts,
    currentAttempt: sessionAttempts.find((attempt) => attempt.occurrenceId === currentOccurrenceId) ?? null,
  };
}

export async function startOrResumeTrainingSession(
  candidate: TrainingSession,
  persistence: TrainingSessionPersistenceBoundary = canonicalPersistence,
): Promise<TrainingSession> {
  const active = await persistence.getActive();
  if (active) {
    if (active.trackId !== candidate.trackId) throw new TrainingSessionStartError(`Active ${active.trackId} session must be completed or abandoned first.`);
    if (active.modeId !== candidate.modeId) throw new TrainingSessionStartError("The active session mode does not match this practice setup.");
    if (active.contentVersion !== candidate.contentVersion) throw new TrainingSessionStartError("The active session content version no longer matches the active content bank.");
    if (!areTrainingSessionConfigurationsEqual(active.configurationSnapshot, candidate.configurationSnapshot)) {
      throw new TrainingSessionStartError("The active session configuration does not match this practice setup.");
    }
    if (!areItemPlansEqual(active, candidate)) {
      throw new TrainingSessionStartError("The active session item and option plan does not match this practice setup.");
    }
    return active;
  }
  await persistence.save(candidate);
  return candidate;
}

function areItemPlansEqual(left: TrainingSession, right: TrainingSession): boolean {
  return JSON.stringify(left.itemOrder) === JSON.stringify(right.itemOrder) &&
    JSON.stringify(left.optionOrderByOccurrence) === JSON.stringify(right.optionOrderByOccurrence);
}

function equalItemRef(left: TrainingAttempt["item"], right: TrainingAttempt["item"]): boolean {
  return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion;
}

export async function advanceTrainingSessionDurably(
  session: TrainingSession,
  foregroundElapsedMs: number,
  persistence: Pick<TrainingSessionPersistenceBoundary, "save"> = canonicalPersistence,
): Promise<TrainingSession> {
  const next = advanceTrainingSession(accumulateTrainingSessionForegroundTime(session, foregroundElapsedMs));
  await persistence.save(next);
  return next;
}

export async function persistTrainingSessionForegroundTime(
  session: TrainingSession,
  foregroundElapsedMs: number,
  persistence: Pick<TrainingSessionPersistenceBoundary, "save"> = canonicalPersistence,
): Promise<TrainingSession> {
  const next = accumulateTrainingSessionForegroundTime(session, foregroundElapsedMs);
  await persistence.save(next);
  return next;
}
