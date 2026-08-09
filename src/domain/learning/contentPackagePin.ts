import { deepFreeze } from "./familyEnvelope";

/** Exact immutable package bytes and release identity owned by every durable learning record. */
export type ContentPackagePin = Readonly<{
  packageIdentity: string;
  packageVersion: string;
  contentReleaseId: string;
}>;

const SHA_256 = /^[a-f0-9]{64}$/;

export function createContentPackagePin(pin: ContentPackagePin): ContentPackagePin {
  if (!SHA_256.test(pin.packageIdentity) || !pin.packageVersion.trim() || !pin.contentReleaseId.trim()) {
    throw new Error("A content package pin requires an exact SHA-256 identity, version, and release.");
  }
  return deepFreeze({ ...pin });
}

export function contentPackagePinsEqual(left: ContentPackagePin, right: ContentPackagePin): boolean {
  return left.packageIdentity === right.packageIdentity &&
    left.packageVersion === right.packageVersion &&
    left.contentReleaseId === right.contentReleaseId;
}
