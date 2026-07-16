import { createFamilyEnvelope, deepFreeze, type FamilyEnvelope } from "./familyEnvelope";
import type { TrackId } from "./trackIdentity";

/** The immutable, family-neutral summary record for a completed session. */
export type TrainingSessionResult = Readonly<{
  id: string;
  sessionId: string;
  trackId: TrackId;
  totalOccurrences: number;
  answeredOccurrenceIds: readonly string[];
  unansweredOccurrenceIds: readonly string[];
  completedAt: string;
  evidence: FamilyEnvelope;
}>;

export function createTrainingSessionResult(input: TrainingSessionResult): TrainingSessionResult {
  if (!input.id.trim() || !input.sessionId.trim() || !input.trackId.trim()) throw new Error("A completed-session result requires stable identities.");
  if (!Number.isInteger(input.totalOccurrences) || input.totalOccurrences <= 0) throw new Error("A completed-session result requires a positive occurrence count.");
  const answered = new Set(input.answeredOccurrenceIds);
  const unanswered = new Set(input.unansweredOccurrenceIds);
  if (answered.size !== input.answeredOccurrenceIds.length || unanswered.size !== input.unansweredOccurrenceIds.length || [...answered].some((id) => unanswered.has(id))) {
    throw new Error("Completed-session answered and unanswered occurrence identities must be distinct.");
  }
  if (answered.size + unanswered.size !== input.totalOccurrences) throw new Error("Completed-session result coverage must equal the session occurrence count.");
  return deepFreeze({ ...input, answeredOccurrenceIds: [...input.answeredOccurrenceIds], unansweredOccurrenceIds: [...input.unansweredOccurrenceIds], evidence: createFamilyEnvelope(input.evidence) });
}
