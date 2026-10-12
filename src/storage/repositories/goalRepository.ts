import type { GoalRecord, GoalSnapshot, TrackId } from "../../domain";
import type { GoalPolicy } from "../../domain/goals/goalPolicy";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalEnvelope, writeCanonicalJson } from "./canonicalRecordCodec";
import { isGoalRecordForPolicy, isGoalRecordForTrack, normalizeGoalRecord } from "../../domain/goals/goalContracts";
import { normalizeGoalForExplicitSave } from "../../domain/goals/goalTargetDateSemantics";
import { CanonicalWriteConflictError, UnsupportedStoredRecordError } from "../errors";
import { assertGoalPlanPairReadable } from "./mutationJournalRepository";

export class StaleGoalRevisionError extends Error {
  constructor(readonly expectedRevision: number | null, readonly actualRevision: number | null) {
    super("Goal expected revision is stale.");
    this.name = "StaleGoalRevisionError";
  }
}

export function readGoalSnapshot(trackId: TrackId, policy: GoalPolicy): GoalSnapshot | null {
  assertGoalPlanPairReadable();
  const saved = readCanonicalEnvelope(STORAGE_KEYS.goal(trackId), (value): value is GoalRecord => isGoalRecordForPolicy(value, policy));
  return saved ? Object.freeze({ record: normalizeGoalRecord(saved.payload, policy), revision: saved.revision }) : null;
}

export async function getGoalSnapshot(trackId: TrackId, policy: GoalPolicy): Promise<GoalSnapshot | null> { return readGoalSnapshot(trackId, policy); }

export async function getGoal(trackId: TrackId, policy: GoalPolicy): Promise<GoalRecord | null> {
  return (await getGoalSnapshot(trackId, policy))?.record ?? null;
}

export async function saveGoal(goal: GoalRecord, policy: GoalPolicy): Promise<void> {
  assertGoalPlanPairReadable();
  const normalized = normalizeGoalForSave(goal, policy);
  const trackId = normalized.trackId;
  writeCanonicalJson(STORAGE_KEYS.goal(trackId), normalized);
}

export async function saveGoalSnapshot(goal: GoalRecord, expectedRevision: number | null, policy: GoalPolicy): Promise<GoalSnapshot> {
  assertGoalPlanPairReadable();
  const normalized = normalizeGoalForSave(goal, policy);
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

function normalizeGoalForSave(goal: GoalRecord, policy: GoalPolicy): GoalRecord {
  const normalized = normalizeGoalRecord(normalizeGoalForExplicitSave(goal), policy);
  if (!isGoalRecordForTrack(normalized, policy)) throw new Error(`Goal record for ${goal.trackId} requires at least one preferred day.`);
  return normalized;
}
