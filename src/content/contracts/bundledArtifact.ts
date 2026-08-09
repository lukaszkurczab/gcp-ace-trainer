/** The application-owned immutable set of independently published track releases. */
export type BundledReleaseManifest = Readonly<{
  envelopeVersion: 1;
  bundleId: string;
}>;

/**
 * The checksum covers `artifactBytes` exactly.  It is deliberately a string
 * rather than an imported object so validation cannot be bypassed by a build
 * transform or a parsed-object substitute.
 */
export type BundledTrackArtifactReference = Readonly<{
  releaseId: string;
  trackId: string;
  familyId: string;
  contentVersion: string;
  taxonomyVersion: string;
  schemaVersion: "published-bank-v1";
  checksumSha256: string;
  sourceRepositoryCommit: string;
  declaredModes: readonly string[];
  artifactBytes: string;
}>;

export type BundledContentRelease = Readonly<{
  manifest: BundledReleaseManifest;
  artifacts: readonly BundledTrackArtifactReference[];
}>;

/** The envelope encoded in each pinned artifact byte string. */
export type PublishedArtifactEnvelope = Readonly<{
  envelopeVersion: 1;
  schemaVersion: "published-bank-v1";
  contentVersion: string;
  taxonomyVersion: string;
  bank: unknown;
}>;
