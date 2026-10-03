import type { TrackId } from "../domain";
import { canonicalSerialize } from "../infrastructure/identity/canonicalSerialization";
import { readHomeShellInputSnapshot } from "../storage/repositories/learningPlanInputSnapshot";

/** Opaque profile lease plus validated persisted sources, checked synchronously before publication. */
export function captureHomeShellReadFence(trackId: TrackId | null): () => void {
  const first = readHomeShellInputSnapshot(trackId);
  const expectedFacts = canonicalSerialize(first.facts);
  return () => {
    const current = readHomeShellInputSnapshot(trackId);
    if (current.storageScope !== first.storageScope || canonicalSerialize(current.facts) !== expectedFacts) {
      throw new Error("Home learning sources changed during read.");
    }
  };
}
