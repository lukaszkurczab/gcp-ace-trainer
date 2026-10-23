import type { TrackId } from "../../domain";

export function isPracticeReadOwnerCurrent(input: Readonly<{
  loadedScope: object | null;
  currentScope: object | null;
  loadedTrackId: TrackId | null;
  currentTrackId: TrackId | null;
  requestedTrackId?: TrackId;
}>): boolean {
  if (input.loadedScope === null || input.loadedScope !== input.currentScope) return false;
  return input.requestedTrackId !== undefined
    ? input.loadedTrackId === input.requestedTrackId
    : input.loadedTrackId === input.currentTrackId;
}
