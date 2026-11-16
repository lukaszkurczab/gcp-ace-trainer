import type { TrackId } from "../domain";
import { requireGoalPolicy } from "../domain/tracks/trackGoalPolicies";
import { canonicalSerialize } from "../domain/identity/canonicalSerialization";
import { readHomeShellInputSnapshot, readLearningPlanStorageScope } from "../storage/repositories/learningPlanInputSnapshot";
import { captureFirstScreenInputEpoch } from "./bootstrap/firstScreenRecord";
import { productionTrackAdmissionContext } from "./tracks/trackAdmissionContext";

/** Opaque profile lease plus validated persisted sources, checked synchronously before publication. */
export function captureHomeShellReadFence(trackId: TrackId | null): () => void {
  const policy = trackId === null ? null : requireGoalPolicy(trackId);
  const first = readHomeShellInputSnapshot(trackId, policy, productionTrackAdmissionContext);
  const expectedFacts = canonicalSerialize(first.facts);
  return () => {
    const current = readHomeShellInputSnapshot(trackId, policy, productionTrackAdmissionContext);
    if (current.storageScope !== first.storageScope || canonicalSerialize(current.facts) !== expectedFacts) {
      throw new Error("Home learning sources changed during read.");
    }
  };
}

/** A Today input was written (or the profile changed) while a reused Today snapshot was being read. */
export class HomeShellSourcesChangedError extends Error {
  constructor() {
    super("Home learning sources changed during read.");
    this.name = "HomeShellSourcesChangedError";
  }
}

/**
 * T27: fence for a read that reuses a Today snapshot. The snapshot matched the store's revision
 * token, so no Today input was written since it was computed under the full fence above; this
 * fence only has to catch a write or a profile change during this read. O(1): the input-write
 * epoch (bumped by the profile-scoped store before every Today input write) and the profile lease.
 * `epoch` must be captured before the revision token was read.
 */
export function captureHomeShellEpochFence(epoch: number): () => void {
  const scope = readLearningPlanStorageScope();
  return () => {
    if (captureFirstScreenInputEpoch() !== epoch || readLearningPlanStorageScope() !== scope) throw new HomeShellSourcesChangedError();
  };
}
