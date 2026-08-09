/** Immutable identity persisted by sessions and used for exact package lookup. */
export type ContentPackagePin = Readonly<{
  packageIdentity: string;
  packageVersion: string;
  contentReleaseId: string;
}>;

export type ContentPackageErrorCode =
  | "package_record_invalid"
  | "package_outer_integrity_failed"
  | "package_schema_invalid"
  | "package_compressed_integrity_failed"
  | "package_payload_integrity_failed"
  | "package_payload_invalid"
  | "package_identity_mismatch"
  | "package_profile_invalid"
  | "package_mode_unavailable"
  | "package_pin_not_found"
  | "package_pin_mismatch"
  | "package_minimum_app_version";

export type ContentPackageRuntime = Readonly<{
  sha256Utf8(value: string): Promise<string>;
  sha256Bytes(value: Uint8Array): Promise<string>;
  decodeBase64(value: string): Uint8Array;
  gunzip(value: Uint8Array): Promise<Uint8Array>;
  decodeUtf8(value: Uint8Array): string;
}>;

export type ContentPackageSource = Readonly<{
  trackId: string;
  packageVersion: string;
  packageBytes: string;
  packageSha256: string;
  packageSize: number;
  profileModes: readonly string[];
}>;

/** Authority for bundled bytes. A record is trusted only when its exact outer bytes match this index. */
export type ContentPackageTrustRecord = Readonly<{ packageIdentity: string; packageBytes: string }>;

export type ContentPackageRequest = Readonly<{
  trackId: string;
  familyId: "coding_interview" | "certification";
  freeNodeId: string;
  modeId: string;
  appVersion: string;
}>;

export type VerifiedPackageMode = Readonly<{
  modeId: string;
  blueprintModeId: string;
  availability: "immediate" | "evidence_conditioned";
  requestedLengths: readonly number[];
  defaultRequestedLength: number;
}>;

export type VerifiedContentPackageBase = Readonly<{
  packagePin: ContentPackagePin;
  trackId: string;
  freeNodeId: string;
  contentVersion: string;
  taxonomyVersion: string;
  minimumAppVersion: string;
  catalog: Readonly<{
    itemIds: readonly string[];
    items: readonly unknown[];
    assets: readonly Readonly<{ id: string; mediaType: string; bytesBase64: string; sha256: string }>[];
  }>;
  profile: Readonly<{
    profileId: string;
    profileVersion: string;
    primaryEntry: Readonly<{ modeId: string; requestedLength: number }>;
    modes: readonly VerifiedPackageMode[];
  }>;
}>;

export type VerifiedContentPackage =
  | (VerifiedContentPackageBase & Readonly<{ familyId: "coding_interview" }>)
  | (VerifiedContentPackageBase & Readonly<{ familyId: "certification" }>);
