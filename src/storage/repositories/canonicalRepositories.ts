import type { GuestInstallationIdentityPort } from "../../infrastructure/identity/installationIdentity";
import { hasGuestAccess } from "./guestAccessRepository";
import { provisionGuestInstallation } from "./guestInstallationRepository";
import { validateStorageMetadata } from "./storageMetadataRepository";
import { purgeAcceptedContentReportOutboxEntries, purgeExpiredContentReportOutboxEntries } from "./contentReportOutboxRepository";
import { initializeAndMigrateContentIdentity, type ContentIdentityMigrationBootstrapDependencies } from "./contentIdentityMigrationBootstrap";

export type CanonicalRepositoryBootstrapDependencies = Readonly<{
  guestInstallationIdentity?: GuestInstallationIdentityPort;
  contentIdentityMigration?: ContentIdentityMigrationBootstrapDependencies;
}>;

/** Opens the only canonical repository set after the one MMKV client exists. */
export async function openCanonicalRepositories(dependencies: CanonicalRepositoryBootstrapDependencies = {}): Promise<void> {
  await initializeAndMigrateContentIdentity(dependencies.contentIdentityMigration);
  await validateStorageMetadata();
  purgeAcceptedContentReportOutboxEntries();
  purgeExpiredContentReportOutboxEntries();
  hasGuestAccess();
  await provisionGuestInstallation(dependencies.guestInstallationIdentity);
}
