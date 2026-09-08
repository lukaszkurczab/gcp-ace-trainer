import type { GoalRecord, GoalSnapshot, TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, writeCanonicalJson } from "./canonicalRecordCodec";
import { isGoalRecordForTrack, isGoalRecordShapeForTrack, normalizeGoalRecord } from "../../domain/goals/goalContracts";
import { normalizeGoalForExplicitSave } from "../../domain/goals/goalTargetDateSemantics";
import { CanonicalWriteConflictError, UnsupportedStoredRecordError } from "../errors";

export class StaleGoalRevisionError extends Error {
  constructor(readonly expectedRevision: number | null, readonly actualRevision: number | null) {
    super("Goal expected revision is stale.");
    this.name = "StaleGoalRevisionError";
  }
}

export async function getGoalSnapshot(trackId: TrackId): Promise<GoalSnapshot | null> {
  const saved = readCanonicalEnvelope(STORAGE_KEYS.goal(trackId), (value): value is GoalRecord => isGoalRecordShapeForTrack(value, trackId));
  return saved ? Object.freeze({ record: normalizeGoalRecord(saved.payload), revision: saved.revision }) : null;
}

export async function getGoal(trackId: TrackId): Promise<GoalRecord | null> {
  return (await getGoalSnapshot(trackId))?.record ?? null;
}

export async function saveGoal(goal: GoalRecord): Promise<void> {
  const normalized = normalizeGoalForSave(goal);
  const trackId = normalized.trackId;
  writeCanonicalJson(STORAGE_KEYS.goal(trackId), normalized);
}

export async function saveGoalSnapshot(goal: GoalRecord, expectedRevision: number | null): Promise<GoalSnapshot> {
  const normalized = normalizeGoalForSave(goal);
  const key = STORAGE_KEYS.goal(normalized.trackId);
  const actualRevision = readCanonicalEnvelope(key, (_value): _value is unknown => true)?.revision ?? null;
  if (actualRevision !== expectedRevision) throw new StaleGoalRevisionError(expectedRevision, actualRevision);

  try {
    const saved = writeCanonicalJson(key, normalized, expectedRevision);
    return Object.freeze({ record: normalized, revision: saved.revision });
  } catch (error) {
    if (!(error instanceof UnsupportedStoredRecordError) && !(error instanceof CanonicalWriteConflictError)) throw error;
    const racedRevision = readCanonicalEnvelope(key, (_value): _value is unknown => true)?.revision ?? null;
    throw new StaleGoalRevisionError(expectedRevision, racedRevision);
  }
}

function normalizeGoalForSave(goal: GoalRecord): GoalRecord {
  const normalized = normalizeGoalRecord(normalizeGoalForExplicitSave(goal));
  if (!isGoalRecordForTrack(normalized, goal.trackId)) throw new Error(`Goal record for ${goal.trackId} requires at least one preferred day.`);
  return normalized;
}
