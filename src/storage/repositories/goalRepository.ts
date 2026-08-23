import type { GoalRecord, TrackId } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";
import { isGoalRecordForTrack } from "../../domain/goals/goalContracts";

export async function getGoal(trackId: TrackId): Promise<GoalRecord | null> {
  return readCanonicalJson(STORAGE_KEYS.goal(trackId), (value): value is GoalRecord => isGoalRecordForTrack(value, trackId));
}

export async function saveGoal(goal: GoalRecord): Promise<void> {
  const trackId = goal.trackId;
  if (!isGoalRecordForTrack(goal, trackId)) throw new Error(`Goal record for ${trackId} is invalid.`);
  writeCanonicalJson(STORAGE_KEYS.goal(trackId), goal);
}
