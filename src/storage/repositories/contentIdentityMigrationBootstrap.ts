import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import type { ActiveContentArtifactDescriptor } from "../../domain/learning/legacyContentIdentityMapper";
import { initializeKeyValueStorage, type KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import {
  captureContentIdentityMigrationSnapshot,
  cleanupContentIdentityMigration,
  readContentIdentityMigrationState,
  recoverContentIdentityMigration,
} from "./contentIdentityMigration";
import { migrateContentIdentityV2, planContentIdentityV2 } from "./contentIdentityV2Planner";
import { repairCommittedUnavailableActiveIndex } from "./contentIdentityUnavailableRepository";
import {
  decodeStorageMetadataEnvelope,
  isCanonicalStorageMetadataV1,
  isCommittedStorageMetadataV2,
  StorageMetadataError,
  validateStorageMetadata,
} from "./storageMetadataRepository";

export enum ContentIdentityMigrationBootstrapStep {
  MigrationStateRead = "migration_state_read",
  MigrationRecovery = "migration_recovery",
  MetadataRead = "metadata_read",
  MetadataInitialization = "metadata_initialization",
  MetadataDecode = "metadata_decode",
  CommittedCleanup = "committed_cleanup",
  SnapshotCapture = "snapshot_capture",
  RuntimeArtifactsLoad = "runtime_artifacts_load",
  MigrationPlan = "migration_plan",
  MigrationApply = "migration_apply",
  PostMigrationCleanup = "post_migration_cleanup",
}

export const CONTENT_IDENTITY_MIGRATION_BOOTSTRAP_STEP_ORDER: readonly ContentIdentityMigrationBootstrapStep[] = Object.freeze([
  ContentIdentityMigrationBootstrapStep.MigrationStateRead,
  ContentIdentityMigrationBootstrapStep.MigrationRecovery,
  ContentIdentityMigrationBootstrapStep.MetadataRead,
  ContentIdentityMigrationBootstrapStep.MetadataInitialization,
  ContentIdentityMigrationBootstrapStep.MetadataDecode,
  ContentIdentityMigrationBootstrapStep.CommittedCleanup,
  ContentIdentityMigrationBootstrapStep.SnapshotCapture,
  ContentIdentityMigrationBootstrapStep.RuntimeArtifactsLoad,
  ContentIdentityMigrationBootstrapStep.MigrationPlan,
  ContentIdentityMigrationBootstrapStep.MigrationApply,
  ContentIdentityMigrationBootstrapStep.PostMigrationCleanup,
]);

export type ContentIdentityMigrationBootstrapStepObserver = (step: ContentIdentityMigrationBootstrapStep) => void;

export type ContentIdentityMigrationBootstrapDependencies = Readonly<{
  artifacts?: readonly ActiveContentArtifactDescriptor[];
  onStep?: ContentIdentityMigrationBootstrapStepObserver;
}>;

function notifyStep(observer: ContentIdentityMigrationBootstrapStepObserver | undefined, step: ContentIdentityMigrationBootstrapStep): void {
  if (!observer) return;
  try { observer(step); } catch { /* diagnostic observers are best-effort */ }
}

async function runtimeArtifacts(): Promise<readonly ActiveContentArtifactDescriptor[]> {
  const catalog = await loadCanonicalRuntimeCatalog();
  return Object.freeze(catalog.tracks.map((trackId) => {
    const track = catalog.getTrack(trackId);
    return Object.freeze({
      trackId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
      contentReleaseId: track.contentReleaseId,
      questionIds: Object.freeze(track.questions.map((question) => question.questionId)),
    });
  }));
}

/**
 * Runs before any public repository read/write. A pre-commit restart restores
 * the exact v1 snapshot; a committed restart verifies the target manifest and
 * performs cleanup only.
 */
export async function migrateContentIdentityBeforeRepositoryOpen(
  storage: KeyValueStorage,
  dependencies: ContentIdentityMigrationBootstrapDependencies = {},
): Promise<void> {
  notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.MigrationStateRead);
  const state = readContentIdentityMigrationState(storage);
  if (state) {
    notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.MigrationRecovery);
    if (state.phase === "committed") notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.CommittedCleanup);
    const recovered = recoverContentIdentityMigration({ storage });
    if (recovered.kind === "already_committed") {
      if (recovered.cleanup.status === "error") throw new Error(recovered.cleanup.code);
      repairCommittedUnavailableActiveIndex(storage);
      return;
    }
  }

  notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.MetadataRead);
  if (storage.getString(STORAGE_KEYS.METADATA) === undefined) {
    notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.MetadataInitialization);
    await validateStorageMetadata();
  }
  const rawMetadata = storage.getString(STORAGE_KEYS.METADATA);
  if (rawMetadata === undefined) throw new Error("content_identity_metadata_missing");
  notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.MetadataDecode);
  const metadata = decodeStorageMetadataEnvelope(rawMetadata).metadata;
  if (isCommittedStorageMetadataV2(metadata)) {
    notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.CommittedCleanup);
    const cleanup = cleanupContentIdentityMigration(storage);
    if (cleanup.status === "error") throw new Error(cleanup.code);
    repairCommittedUnavailableActiveIndex(storage);
    return;
  }
  if (!isCanonicalStorageMetadataV1(metadata)) throw new StorageMetadataError("storage_migration_pending");

  notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.SnapshotCapture);
  const source = captureContentIdentityMigrationSnapshot(storage);
  let artifacts = dependencies.artifacts;
  if (artifacts === undefined) {
    notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.RuntimeArtifactsLoad);
    artifacts = await runtimeArtifacts();
  }
  notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.MigrationPlan);
  const bundle = planContentIdentityV2({
    source,
    artifacts,
  });
  notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.MigrationApply);
  const result = migrateContentIdentityV2({ storage, bundle });
  notifyStep(dependencies.onStep, ContentIdentityMigrationBootstrapStep.PostMigrationCleanup);
  if (result.cleanup.status === "error") throw new Error(result.cleanup.code);
}

export async function initializeAndMigrateContentIdentity(
  dependencies: ContentIdentityMigrationBootstrapDependencies = {},
): Promise<void> {
  const storage = await initializeKeyValueStorage();
  await migrateContentIdentityBeforeRepositoryOpen(storage, dependencies);
}
