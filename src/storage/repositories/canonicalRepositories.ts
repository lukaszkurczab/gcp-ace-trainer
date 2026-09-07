import { initializeKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import type { GuestInstallationIdentityPort } from "../../infrastructure/identity/installationIdentity";
import { hasGuestAccess } from "./guestAccessRepository";
import { provisionGuestInstallation } from "./guestInstallationRepository";
import { validateStorageMetadata } from "./storageMetadataRepository";
import { purgeAcceptedContentReportOutboxEntries, purgeExpiredContentReportOutboxEntries } from "./contentReportOutboxRepository";

export type CanonicalRepositoryBootstrapDependencies = Readonly<{ guestInstallationIdentity?: GuestInstallationIdentityPort }>;

/** Opens the only canonical repository set after the one MMKV client exists. */
export async function openCanonicalRepositories(dependencies: CanonicalRepositoryBootstrapDependencies = {}): Promise<void> {
  await initializeKeyValueStorage();
  await validateStorageMetadata();
  purgeAcceptedContentReportOutboxEntries();
  purgeExpiredContentReportOutboxEntries();
  hasGuestAccess();
  await provisionGuestInstallation(dependencies.guestInstallationIdentity);
}
