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
import {
  decodeStorageMetadataEnvelope,
  isCanonicalStorageMetadataV1,
  isCommittedStorageMetadataV2,
  StorageMetadataError,
  validateStorageMetadata,
} from "./storageMetadataRepository";

export type ContentIdentityMigrationBootstrapDependencies = Readonly<{
  artifacts?: readonly ActiveContentArtifactDescriptor[];
}>;

async function runtimeArtifacts(): Promise<readonly ActiveContentArtifactDescriptor[]> {
  const catalog = await loadCanonicalRuntimeCatalog();
  return Object.freeze(catalog.tracks.map((trackId) => {
    const track = catalog.getTrack(trackId);
    return Object.freeze({
      trackId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
      contentReleaseId: track.packagePin.contentReleaseId,
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
  const state = readContentIdentityMigrationState(storage);
  if (state) {
    const recovered = recoverContentIdentityMigration({ storage });
    if (recovered.kind === "already_committed") {
      if (recovered.cleanup.status === "error") throw new Error(recovered.cleanup.code);
      return;
    }
  }

  if (storage.getString(STORAGE_KEYS.METADATA) === undefined) await validateStorageMetadata();
  const rawMetadata = storage.getString(STORAGE_KEYS.METADATA);
  if (rawMetadata === undefined) throw new Error("content_identity_metadata_missing");
  const metadata = decodeStorageMetadataEnvelope(rawMetadata).metadata;
  if (isCommittedStorageMetadataV2(metadata)) {
    const cleanup = cleanupContentIdentityMigration(storage);
    if (cleanup.status === "error") throw new Error(cleanup.code);
    return;
  }
  if (!isCanonicalStorageMetadataV1(metadata)) throw new StorageMetadataError("storage_migration_pending");

  const source = captureContentIdentityMigrationSnapshot(storage);
  const bundle = planContentIdentityV2({
    source,
    artifacts: dependencies.artifacts ?? await runtimeArtifacts(),
  });
  const result = migrateContentIdentityV2({ storage, bundle });
  if (result.cleanup.status === "error") throw new Error(result.cleanup.code);
}

export async function initializeAndMigrateContentIdentity(
  dependencies: ContentIdentityMigrationBootstrapDependencies = {},
): Promise<void> {
  const storage = await initializeKeyValueStorage();
  await migrateContentIdentityBeforeRepositoryOpen(storage, dependencies);
}
