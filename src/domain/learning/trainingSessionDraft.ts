import type { TrackId } from "./trackIdentity";
import type { TrainingSession } from "./trainingSession";

export type TrainingSessionDraftResponse =
  | null
  | boolean
  | number
  | string
  | readonly TrainingSessionDraftResponse[]
  | Readonly<{ [key: string]: TrainingSessionDraftResponse }>;

export type TrainingSessionDraft = Readonly<{
  schemaVersion: 1;
  familyId: string;
  draftVersion: 1;
  revision: number;
  sessionId: string;
  trackId: TrackId;
  responsesByOccurrenceId: Readonly<Record<string, TrainingSessionDraftResponse>>;
  flaggedOccurrenceIds: readonly string[];
  updatedAt: string;
}>;

export function createTrainingSessionDraft(
  draft: Omit<TrainingSessionDraft, "schemaVersion" | "familyId" | "draftVersion" | "revision" | "flaggedOccurrenceIds"> &
    Partial<Pick<TrainingSessionDraft, "schemaVersion" | "familyId" | "draftVersion" | "revision" | "flaggedOccurrenceIds">>,
): TrainingSessionDraft {
  const schemaVersion = draft.schemaVersion ?? 1;
  const familyId = draft.familyId ?? "algorithms";
  const draftVersion = draft.draftVersion ?? 1;
  const revision = draft.revision ?? 1;
  if (schemaVersion !== 1 || draftVersion !== 1) throw new Error("Training session draft schema is unsupported.");
  if (!familyId.trim()) throw new Error("Training session draft family identity is required.");
  if (!Number.isSafeInteger(revision) || revision < 0) throw new Error("Training session draft revision is invalid.");
  if (!draft.sessionId.trim()) throw new Error("Training session draft session identity is required.");
  if (!draft.trackId.trim()) throw new Error("Training session draft track identity is required.");
  if (!isTimestamp(draft.updatedAt)) throw new Error("Training session draft update time is invalid.");
  if (!isPlainRecord(draft.responsesByOccurrenceId)) throw new Error("Training session draft responses must be a canonical response record.");
  if (Object.keys(draft.responsesByOccurrenceId).some((occurrenceId) => !occurrenceId.trim())) {
    throw new Error("Training session draft response occurrence identities must be non-empty.");
  }
  if (!Object.values(draft.responsesByOccurrenceId).every(isJsonValue)) {
    throw new Error("Training session draft responses must contain only canonical JSON values.");
  }
  const flaggedOccurrenceIds = draft.flaggedOccurrenceIds ?? [];
  if (!Array.isArray(flaggedOccurrenceIds) || flaggedOccurrenceIds.some((occurrenceId) => typeof occurrenceId !== "string" || !occurrenceId.trim()) || new Set(flaggedOccurrenceIds).size !== flaggedOccurrenceIds.length) {
    throw new Error("Training session draft flags must be unique non-empty occurrence identities.");
  }
  return Object.freeze({
    ...draft,
    schemaVersion,
    familyId,
    draftVersion,
    revision,
    responsesByOccurrenceId: Object.freeze(Object.fromEntries(
      Object.entries(draft.responsesByOccurrenceId).map(([occurrenceId, response]) => [occurrenceId, freezeJsonValue(response)]),
    )),
    flaggedOccurrenceIds: Object.freeze([...flaggedOccurrenceIds]),
  });
}

export function canPersistTrainingSessionDraft(session: TrainingSession): boolean {
  return session.configurationSnapshot.feedbackMode === "atSessionEnd" &&
    session.configurationSnapshot.answerChanges === "untilFinalSubmission" &&
    session.configurationSnapshot.submission === "manualOrForegroundTimeout";
}

export function getTrainingSessionFinalizationCleanupKind(session: TrainingSession): "active_exam" | "session_draft" | null {
  if (canPersistTrainingSessionDraft(session)) return "session_draft";
  if (session.configurationSnapshot.kind === "certificationSimulation" && session.configurationSnapshot.timer === "absoluteDeadline") return "active_exam";
  return null;
}

function isTimestamp(value: string): boolean {
  return value.trim().length > 0 && !Number.isNaN(Date.parse(value));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function isJsonValue(value: unknown): value is TrainingSessionDraftResponse {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isJsonValue);
  return isPlainRecord(value) && Object.values(value).every(isJsonValue);
}

function freezeJsonValue(value: TrainingSessionDraftResponse): TrainingSessionDraftResponse {
  if (Array.isArray(value)) return Object.freeze(value.map(freezeJsonValue));
  if (isPlainRecord(value)) {
    return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, freezeJsonValue(entry as TrainingSessionDraftResponse)])));
  }
  return value;
}
