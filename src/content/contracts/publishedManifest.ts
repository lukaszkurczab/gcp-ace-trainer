export type PublishedRootManifest = {
  formatVersion: 1;
  publishedAt: string;
  tracks: readonly PublishedRootTrack[];
};

export type PublishedRootTrack = {
  trackId: string;
  familyId: string;
  contentVersion: string;
  manifestPath: string;
};

export type PublishedTrackManifest = {
  formatVersion: 1;
  trackId: string;
  familyId: string;
  contentVersion: string;
  itemCount: number;
  bankPath: string;
  sha256: string;
};
