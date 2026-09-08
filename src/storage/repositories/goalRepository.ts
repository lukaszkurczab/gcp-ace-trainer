import type { GoalRecord, TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";
import { isGoalRecordForTrack, isGoalRecordShapeForTrack, normalizeGoalRecord } from "../../domain/goals/goalContracts";
import { normalizeGoalForExplicitSave } from "../../domain/goals/goalTargetDateSemantics";

export async function getGoal(trackId: TrackId): Promise<GoalRecord | null> {
  const saved = readCanonicalJson(STORAGE_KEYS.goal(trackId), (value): value is GoalRecord => isGoalRecordShapeForTrack(value, trackId));
  return saved ? normalizeGoalRecord(saved) : null;
}

export async function saveGoal(goal: GoalRecord): Promise<void> {
  const normalized = normalizeGoalRecord(normalizeGoalForExplicitSave(goal));
  const trackId = normalized.trackId;
  if (!isGoalRecordForTrack(normalized, trackId)) throw new Error(`Goal record for ${trackId} requires at least one preferred day.`);
  writeCanonicalJson(STORAGE_KEYS.goal(trackId), normalized);
}
