import type { TrackId } from "../../domain";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function formatTrainingSessionIdentity(input: Readonly<{ trackId: TrackId; modeId: string; uuid: string }>): string {
  if (!input.trackId.trim() || input.trackId.includes(":")) throw new Error("Training session identity requires a valid track ID.");
  if (!input.modeId.trim() || input.modeId.includes(":")) throw new Error("Training session identity requires a valid mode ID.");
  if (!UUID_V4.test(input.uuid)) throw new Error("Training session identity requires a UUIDv4 value.");
  return `${input.trackId}:${input.modeId}:${input.uuid.toLowerCase()}`;
}
