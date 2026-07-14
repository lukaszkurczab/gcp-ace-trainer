import type { PublishedRootManifest, PublishedRootTrack, PublishedTrackManifest } from "../contracts";

export type RawContentBank = { bytes: ArrayBuffer; json: unknown; text: string };
export interface ContentSource {
  getRootManifest(): Promise<PublishedRootManifest>;
  getTrackManifest(entry: PublishedRootTrack): Promise<PublishedTrackManifest>;
  getTrackBank(manifest: PublishedTrackManifest): Promise<RawContentBank>;
}
