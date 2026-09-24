import type { GuestInstallationIdentityPort } from "../../infrastructure/identity/installationIdentity";
import { getKeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { hasGuestAccess } from "./guestAccessRepository";
import { provisionGuestInstallation } from "./guestInstallationRepository";
import { validateStorageMetadata } from "./storageMetadataRepository";
import { purgeAcceptedContentReportOutboxEntries, purgeExpiredContentReportOutboxEntries } from "./contentReportOutboxRepository";

export enum CanonicalRepositoryBootstrapStep {
  StorageMetadataValidation = "storage_metadata_validation",
  AcceptedReportOutboxPurge = "accepted_report_outbox_purge",
  ExpiredReportOutboxPurge = "expired_report_outbox_purge",
  GuestAccessRead = "guest_access_read",
  GuestInstallationProvisioning = "guest_installation_provisioning",
}

export const CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER: readonly CanonicalRepositoryBootstrapStep[] = Object.freeze([
  CanonicalRepositoryBootstrapStep.StorageMetadataValidation,
  CanonicalRepositoryBootstrapStep.AcceptedReportOutboxPurge,
  CanonicalRepositoryBootstrapStep.ExpiredReportOutboxPurge,
  CanonicalRepositoryBootstrapStep.GuestAccessRead,
  CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning,
]);

export type CanonicalRepositoryBootstrapStepObserver = (step: CanonicalRepositoryBootstrapStep) => void;

export type CanonicalRepositoryBootstrapDependencies = Readonly<{
  guestInstallationIdentity?: GuestInstallationIdentityPort;
  onStep?: CanonicalRepositoryBootstrapStepObserver;
}>;

function notifyStep(observer: CanonicalRepositoryBootstrapStepObserver | undefined, step: CanonicalRepositoryBootstrapStep): void {
  if (!observer) return;
  try { observer(step); } catch { /* diagnostic observers are best-effort */ }
}

/** Opens the canonical repository set only after the profile storage scope is active. */
export async function openCanonicalRepositories(dependencies: CanonicalRepositoryBootstrapDependencies = {}): Promise<void> {
  getKeyValueStorage();
  notifyStep(dependencies.onStep, CanonicalRepositoryBootstrapStep.StorageMetadataValidation);
  await validateStorageMetadata();
  notifyStep(dependencies.onStep, CanonicalRepositoryBootstrapStep.AcceptedReportOutboxPurge);
  purgeAcceptedContentReportOutboxEntries();
  notifyStep(dependencies.onStep, CanonicalRepositoryBootstrapStep.ExpiredReportOutboxPurge);
  purgeExpiredContentReportOutboxEntries();
  notifyStep(dependencies.onStep, CanonicalRepositoryBootstrapStep.GuestAccessRead);
  hasGuestAccess();
  notifyStep(dependencies.onStep, CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning);
  await provisionGuestInstallation(dependencies.guestInstallationIdentity);
}
