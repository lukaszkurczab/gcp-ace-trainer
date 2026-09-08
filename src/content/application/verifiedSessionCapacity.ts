import type { ContentPackagePin } from "../../domain/learning/contentPackagePin";
import { contentPackagePinsEqual } from "../../domain/learning/contentPackagePin";
import type { VerifiedContentPackage } from "../contracts";
import { assertResolvedContentPackage } from "./verifiedPackageIdentity.internal";

const VERIFIED_CAPACITY = new WeakSet<object>();

export type VerifiedSessionCapacity = Readonly<{
  packagePin: ContentPackagePin;
  modeId: string;
  requestedLength: number;
  minimumActualLength: number;
  eligibleItemCount: number;
  shorteningPolicy: "allowed" | "prohibited";
}>;

export type SessionCapacityResolution =
  | Readonly<{ kind: "exact"; actualLength: number }>
  | Readonly<{ kind: "shortened"; actualLength: number; requestedLength: number }>
  | Readonly<{ kind: "shortfall"; requestedLength: number; eligibleItemCount: number; missingItemCount: number }>;

/** Creates capacity only from a resolved package configuration, never a caller policy. */
export function createVerifiedSessionCapacity(pkg: VerifiedContentPackage, modeId: string, requestedLength: number, eligibleItemCount: number): VerifiedSessionCapacity {
  if (!positiveInteger(requestedLength) || !nonNegativeInteger(eligibleItemCount)) throw new Error("Session capacity inputs are invalid.");
  assertResolvedContentPackage(pkg);
  const configuration = pkg.profile.configurations.find((entry) => entry.modeId === modeId);
  if (!configuration || !configuration.requestedLengths.includes(requestedLength)) throw new Error(`Mode ${modeId} does not support requested length ${requestedLength} in this verified package.`);
  const shorteningPolicy = configuration.selection.shortening === "truthful_to_eligible_count" ? "allowed" : "prohibited";
  const minimumActualLength = shorteningPolicy === "allowed" ? configuration.minimumActualLength : requestedLength;
  const capacity: VerifiedSessionCapacity = Object.freeze({ packagePin: pkg.packagePin, modeId, requestedLength, minimumActualLength, eligibleItemCount, shorteningPolicy });
  VERIFIED_CAPACITY.add(capacity);
  return capacity;
}

export function resolveVerifiedSessionCapacity(capacity: VerifiedSessionCapacity, expectedPackagePin: ContentPackagePin): SessionCapacityResolution {
  if (!VERIFIED_CAPACITY.has(capacity as object)) throw new Error("Session capacity was not created from a verified package.");
  if (!contentPackagePinsEqual(capacity.packagePin, expectedPackagePin)) throw new Error("Session capacity package pin does not match the expected package.");
  if (capacity.eligibleItemCount >= capacity.requestedLength) return Object.freeze({ kind: "exact", actualLength: capacity.requestedLength });
  if (capacity.shorteningPolicy === "allowed" && capacity.eligibleItemCount >= capacity.minimumActualLength) return Object.freeze({ kind: "shortened", actualLength: capacity.eligibleItemCount, requestedLength: capacity.requestedLength });
  return Object.freeze({ kind: "shortfall", requestedLength: capacity.requestedLength, eligibleItemCount: capacity.eligibleItemCount, missingItemCount: capacity.requestedLength - capacity.eligibleItemCount });
}

function positiveInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value > 0; }
function nonNegativeInteger(value: unknown): value is number { return typeof value === "number" && Number.isSafeInteger(value) && value >= 0; }
