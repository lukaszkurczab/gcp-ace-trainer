import { createTrainingSessionResult, type TrainingSessionResult } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, removeCanonicalValue, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { isTrainingSessionResult } from "./trainingModelGuards";
import { readTrainingSessionResultById } from "./trainingEvidenceIntegrityRepository";

export function readTrainingSessionResult(sessionId: string): TrainingSessionResult | null {
  const value = readTrainingSessionResultById(sessionId);
  return value ? createTrainingSessionResult(value) : null;
}

export async function getTrainingSessionResult(sessionId: string): Promise<TrainingSessionResult | null> { return readTrainingSessionResult(sessionId); }

export async function saveTrainingSessionResult(result: TrainingSessionResult): Promise<void> {
  if (!isTrainingSessionResult(result)) throw new Error("Training session result is invalid.");
  const existing = await getTrainingSessionResult(result.sessionId);
  if (existing && JSON.stringify(existing) !== JSON.stringify(result)) throw new Error(`Training session result ${result.sessionId} is immutable.`);
  if (!existing) writeCanonicalJson(STORAGE_KEYS.trainingSessionResult(result.sessionId), result);
}

/** Read-only check used before an immutable journal batch is applied. */
export async function assertTrainingSessionResultJournalWrite(result: TrainingSessionResult): Promise<void> {
  if (!isTrainingSessionResult(result)) throw new Error("Training session result is invalid.");
  const existing = await getTrainingSessionResult(result.sessionId);
  if (existing && JSON.stringify(existing) !== JSON.stringify(result)) throw new Error(`Training session result ${result.sessionId} is immutable.`);
}

export function materializeTrainingSessionResultJournalSteps(results: readonly TrainingSessionResult[], steps: readonly CanonicalPhysicalWrite[]): void {
  const expected = results.map((result) => `result:${result.sessionId}`);
  if (steps.length !== 1 || !expected.includes(steps[0]!.target)) throw new Error("Training session result step does not match its exact journal plan.");
  for (const step of steps) applyCanonicalPhysicalWrite(step);
}

export async function clearTrainingSessionResults(sessionIds: readonly string[]): Promise<void> {
  sessionIds.forEach((sessionId) => removeCanonicalValue(STORAGE_KEYS.trainingSessionResult(sessionId)));
}
