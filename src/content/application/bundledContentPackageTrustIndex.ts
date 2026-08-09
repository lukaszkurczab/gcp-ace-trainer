import { GENERATED_FREE_NODE_PACKAGES } from "../bundled/generatedFreeNodePackages";
import type { ContentPackageTrustRecord } from "../contracts";

/** Pinned build inputs, kept separate from caller-provided package sources. */
export const BUNDLED_CONTENT_PACKAGE_TRUST_INDEX: readonly ContentPackageTrustRecord[] = Object.freeze(
  GENERATED_FREE_NODE_PACKAGES.map((entry) => Object.freeze({ packageIdentity: entry.packageSha256, packageBytes: entry.packageBytes })),
);
