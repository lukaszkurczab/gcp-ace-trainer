import { createProfileScopedStorage } from "../storage/profileStorageRouter";
import type { KeyValueStorage } from "../storage/mmkvClient";
import type { ProfileStorageRouter, StorageProfile } from "../storage/profileStorageRouter";
import type { OwnerPreservationScope } from "./ownerPreservationSourceRuntime.disabled";

let source: Readonly<{ base: KeyValueStorage; router: ProfileStorageRouter }> | null = null;

export function installOwnerPreservationSource(base: KeyValueStorage | null, router: ProfileStorageRouter | null): void {
  source = base && router ? Object.freeze({ base, router }) : null;
}

export function getLegacyOwnerReadOnlyScope(): OwnerPreservationScope | null {
  if (!source) return null;
  const profile: StorageProfile | undefined = source.router.registry.profiles.find((candidate) => candidate.kind === "legacy_owner");
  if (!profile) return null;
  const scoped = createProfileScopedStorage(source.base, profile);
  const storage: KeyValueStorage = Object.freeze({
    getString(key: string) { return scoped.getString(key); },
    getAllKeys() { return scoped.getAllKeys(); },
    contains(key: string) { return scoped.contains(key); },
    setString() { throw new Error("owner_preservation_scope_is_read_only"); },
    remove() { throw new Error("owner_preservation_scope_is_read_only"); },
  });
  return Object.freeze({
    profile,
    selectedProfile: source.router.profile,
    storage,
  });
}
