import type { TrainingSession } from "../../domain";
import { assertSessionMatchesBundledTrack } from "./contentSessionIdentity";
import { getBundledContentAvailability, requireBundledTrackMode } from "./validateBundledContent";

/** Canonical lifecycle adapter for the validated in-memory track projection. */
export const bundledContentAvailabilityPort = Object.freeze({
  async requireAvailable(trackId: string, modeId: string): Promise<void> {
    requireBundledTrackMode(trackId, modeId);
  },
  async assertPreparedSession(session: TrainingSession): Promise<void> {
    await assertSession(session);
  },
  async assertActiveSession(session: TrainingSession): Promise<void> {
    await assertSession(session);
  },
});

async function assertSession(session: TrainingSession): Promise<void> {
    const track = getBundledContentAvailability(session.trackId);
    if (track.kind !== "available") throw new Error(`Session content unavailable: ${track.reason}.`);
    await assertSessionMatchesBundledTrack(session, track);
}
