import { GENERATED_FREE_NODE_PACKAGES, GENERATED_RETAINED_FREE_NODE_PACKAGES } from "../bundled/generatedFreeNodePackages";
import type { ContentPackageTrustRecord } from "../contracts";

/** Pinned build inputs, kept separate from caller-provided package sources. */
export const BUNDLED_CONTENT_PACKAGE_TRUST_INDEX: readonly ContentPackageTrustRecord[] = Object.freeze(
  [...GENERATED_FREE_NODE_PACKAGES, ...GENERATED_RETAINED_FREE_NODE_PACKAGES]
    .reduce<ContentPackageTrustRecord[]>((records, entry) => {
      const existing = records.find((record) => record.packageIdentity === entry.packageSha256);
      if (existing) {
        if (existing.packageBytes !== entry.packageBytes) throw new Error(`Conflicting trusted bytes for package ${entry.packageSha256}.`);
        return records;
      }
      records.push(Object.freeze({ packageIdentity: entry.packageSha256, packageBytes: entry.packageBytes }));
      return records;
    }, []),
);
