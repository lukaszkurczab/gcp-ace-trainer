import type { KeyValueStorage } from "../storage/mmkvClient";
import type { ProfileStorageRouter, StorageProfile } from "../storage/profileStorageRouter";

export type OwnerPreservationScope = Readonly<{
  profile: StorageProfile;
  selectedProfile: StorageProfile;
  storage: KeyValueStorage;
}>;

export function installOwnerPreservationSource(_base: KeyValueStorage | null, _router: ProfileStorageRouter | null): void {
  // The source is intentionally unavailable outside a smoke bundle.
}

export function getLegacyOwnerReadOnlyScope(): OwnerPreservationScope | null {
  return null;
}
