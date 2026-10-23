import type { TrackId } from "../../domain";

export type HomeSnapshotOwner = Readonly<{ scope: object; trackId: TrackId | null }>;

export function isHomeSnapshotOwnerCurrent(
  snapshot: HomeSnapshotOwner | null,
  currentScope: object,
  currentTrackId: TrackId | null,
): boolean {
  return snapshot !== null && snapshot.scope === currentScope && snapshot.trackId === currentTrackId;
}
