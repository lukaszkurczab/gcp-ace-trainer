import { getActiveStorageProfileOrNull, getKeyValueStorage, isProfileTransitionActive } from "../../infrastructure/storage/mmkvClient";
import { createExpoNodePackageFilePort, createNodePackageStore, type NodePackageStorageIds } from "../runtime/nodePackageStorage";
import type { NodePackageStore, VerifiedNodePackage } from "../runtime/nodeContentPackage";

let stageIdSequence = 0;

/** Profile-scoped composition for the single installed-node package store. */
export function createProfileNodePackageStore(ids: NodePackageStorageIds = { createId: () => `${Date.now().toString(36)}-${(++stageIdSequence).toString(36)}` }): NodePackageStore {
  return createNodePackageStore({ files: createExpoNodePackageFilePort(), pointers: getKeyValueStorage(), ids });
}

/** Cheap in-memory profile scope check; null means profile storage is closed. */
export function getActiveNodePackageScopeKey(): string | null {
  return resolveNodePackageScopeKey(isProfileTransitionActive, () => getActiveStorageProfileOrNull()?.id ?? null);
}

/** Checks transition before reading the profile to invalidate runtime caches fail-closed. */
export function resolveNodePackageScopeKey(isTransitionActive: () => boolean, getProfileId: () => string | null): string | null {
  if (isTransitionActive()) return null;
  return getProfileId();
}

/** Lazy loader rejects a profile transition that races with disk hydration. */
export async function loadActiveProfileNodePackages(scopeKey: string): Promise<readonly VerifiedNodePackage[]> {
  if (getActiveNodePackageScopeKey() !== scopeKey) throw new Error("node_package_profile_scope_changed");
  const records = await createProfileNodePackageStore().listActive();
  if (getActiveNodePackageScopeKey() !== scopeKey) throw new Error("node_package_profile_scope_changed");
  return records;
}
