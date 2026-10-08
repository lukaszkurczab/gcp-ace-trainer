import { readLearningPlanStorageScope } from "../storage/repositories/learningPlanInputSnapshot";

export class ProfileReadFenceChangedError extends Error {
  constructor() {
    super("Profile changed during read.");
    this.name = "ProfileReadFenceChangedError";
  }
}

/** Existing opaque published lease; no raw data, persistent revision or retry. */
export function captureProfileReadFence(): () => void {
  const expected = readLearningPlanStorageScope();
  return () => {
    if (readLearningPlanStorageScope() !== expected) throw new ProfileReadFenceChangedError();
  };
}
