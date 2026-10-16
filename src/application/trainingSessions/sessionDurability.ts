import { resolvedContentRefsEqual, type TrainingAttempt, type TrainingSession } from "../../domain";

export class TrainingSessionProgressError extends Error {}

export type TrainingSessionProgress<Response = unknown> = Readonly<{
  attempts: readonly TrainingAttempt<Response>[];
  currentAttempt: TrainingAttempt<Response> | null;
}>;

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

function equalItemRef(left: TrainingAttempt["item"], right: TrainingAttempt["item"]): boolean {
  return resolvedContentRefsEqual(left, right);
}
