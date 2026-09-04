import { initializeKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import type { GuestInstallationIdentityPort } from "../../infrastructure/identity/installationIdentity";
import { hasGuestAccess } from "./guestAccessRepository";
import { provisionGuestInstallation } from "./guestInstallationRepository";
import { validateStorageMetadata } from "./storageMetadataRepository";

export type CanonicalRepositoryBootstrapDependencies = Readonly<{ guestInstallationIdentity?: GuestInstallationIdentityPort }>;

/** Opens the only canonical repository set after the one MMKV client exists. */
export async function openCanonicalRepositories(dependencies: CanonicalRepositoryBootstrapDependencies = {}): Promise<void> {
  initializeKeyValueStorage();
  await validateStorageMetadata();
  hasGuestAccess();
  await provisionGuestInstallation(dependencies.guestInstallationIdentity);
}
