import { readLearningPlanStorageScope } from "../storage/repositories/learningPlanInputSnapshot";

/** Existing opaque published lease; no raw data, persistent revision or retry. */
export function captureProfileReadFence(): () => void {
  const expected = readLearningPlanStorageScope();
  return () => {
    if (readLearningPlanStorageScope() !== expected) throw new Error("Profile changed during read.");
  };
}
