import { createTrainingSessionResult, type TrainingSessionResult } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { readCanonicalJson, removeCanonicalValue, writeCanonicalJson } from "./canonicalRecordCodec";
import { isTrainingSessionResult } from "./trainingModelGuards";

export async function getTrainingSessionResult(sessionId: string): Promise<TrainingSessionResult | null> {
  const value = readCanonicalJson(STORAGE_KEYS.trainingSessionResult(sessionId), isTrainingSessionResult);
  return value ? createTrainingSessionResult(value) : null;
}

export async function saveTrainingSessionResult(result: TrainingSessionResult): Promise<void> {
  if (!isTrainingSessionResult(result)) throw new Error("Training session result is invalid.");
  const existing = await getTrainingSessionResult(result.sessionId);
  if (existing && JSON.stringify(existing) !== JSON.stringify(result)) throw new Error(`Training session result ${result.sessionId} is immutable.`);
  if (!existing) writeCanonicalJson(STORAGE_KEYS.trainingSessionResult(result.sessionId), result);
}

export async function clearTrainingSessionResults(sessionIds: readonly string[]): Promise<void> {
  sessionIds.forEach((sessionId) => removeCanonicalValue(STORAGE_KEYS.trainingSessionResult(sessionId)));
}
