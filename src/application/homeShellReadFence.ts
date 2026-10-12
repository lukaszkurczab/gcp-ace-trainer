import type { TrackId } from "../domain";
import { requireGoalPolicy } from "../domain/tracks/trackGoalPolicies";
import { canonicalSerialize } from "../domain/identity/canonicalSerialization";
import { readHomeShellInputSnapshot } from "../storage/repositories/learningPlanInputSnapshot";
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
