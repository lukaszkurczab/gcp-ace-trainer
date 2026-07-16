/** The only production representation of a content release consumed at runtime. */
export type BundledReleaseManifest = Readonly<{
  envelopeVersion: 1;
  releaseId: string;
  sourceRepositoryCommit: string;
}>;

export type ApprovalCoverageReference = Readonly<{
  identity: string;
  itemIds: readonly string[];
}>;

/**
 * The checksum covers `artifactBytes` exactly.  It is deliberately a string
 * rather than an imported object so validation cannot be bypassed by a build
 * transform or a parsed-object substitute.
 */
export type BundledTrackArtifactReference = Readonly<{
  trackId: string;
  familyId: string;
  contentVersion: string;
  taxonomyVersion: string;
  schemaVersion: "published-bank-v1";
  checksumSha256: string;
  sourceRepositoryCommit: string;
  approvalCoverage: ApprovalCoverageReference;
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
