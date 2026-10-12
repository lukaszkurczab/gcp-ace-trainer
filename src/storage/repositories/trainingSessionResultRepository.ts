import { createTrainingSessionResult, type TrainingSessionResult } from "../../domain";
import { STORAGE_KEYS } from "../keys";
import { applyCanonicalPhysicalWrite, removeCanonicalValue, writeCanonicalJson, type CanonicalPhysicalWrite } from "./canonicalRecordCodec";
import { isTrainingSessionResult } from "./trainingModelGuards";
import { readTrainingSessionResultById } from "./trainingEvidenceIntegrityRepository";
import type { TrackAdmissionContext } from "../../domain/tracks/trackAdmissionContext";

export function readTrainingSessionResult(sessionId: string, admission: TrackAdmissionContext): TrainingSessionResult | null {
  const value = readTrainingSessionResultById(sessionId, admission);
  return value ? createTrainingSessionResult(value) : null;
}

export async function getTrainingSessionResult(sessionId: string, admission: TrackAdmissionContext): Promise<TrainingSessionResult | null> { return readTrainingSessionResult(sessionId, admission); }

export async function saveTrainingSessionResult(result: TrainingSessionResult, admission: TrackAdmissionContext): Promise<void> {
  if (!isTrainingSessionResult(result, admission)) throw new Error("Training session result is invalid.");
  const existing = await getTrainingSessionResult(result.sessionId, admission);
  if (existing && JSON.stringify(existing) !== JSON.stringify(result)) throw new Error(`Training session result ${result.sessionId} is immutable.`);
  if (!existing) writeCanonicalJson(STORAGE_KEYS.trainingSessionResult(result.sessionId), result);
}

/** Read-only check used before an immutable journal batch is applied. */
export async function assertTrainingSessionResultJournalWrite(result: TrainingSessionResult, admission: TrackAdmissionContext): Promise<void> {
  if (!isTrainingSessionResult(result, admission)) throw new Error("Training session result is invalid.");
  const existing = await getTrainingSessionResult(result.sessionId, admission);
  if (existing && JSON.stringify(existing) !== JSON.stringify(result)) throw new Error(`Training session result ${result.sessionId} is immutable.`);
}

export function materializeTrainingSessionResultJournalSteps(results: readonly TrainingSessionResult[], steps: readonly CanonicalPhysicalWrite[], admission: TrackAdmissionContext): void {
  if (!results.every((result) => isTrainingSessionResult(result, admission))) throw new Error("Training session result batch has an unadmitted track.");
  const expected = results.map((result) => `result:${result.sessionId}`);
  if (steps.length !== 1 || !expected.includes(steps[0]!.target)) throw new Error("Training session result step does not match its exact journal plan.");
  for (const step of steps) applyCanonicalPhysicalWrite(step);
}

export async function clearTrainingSessionResults(sessionIds: readonly string[], admission: TrackAdmissionContext): Promise<void> {
  for (const sessionId of sessionIds) {
    const result = readTrainingSessionResultById(sessionId, admission);
    if (result) removeCanonicalValue(STORAGE_KEYS.trainingSessionResult(sessionId));
  }
}
