import { STORAGE_NAMESPACE, STORAGE_KEYS } from "../keys";
import { CANONICAL_RECORD_SCHEMA, readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { CorruptStoredRecordError, UnsupportedStoredRecordError } from "../errors";

export const CANONICAL_STORAGE_SCHEMA_VERSION = 1 as const;
export const PENDING_STORAGE_SCHEMA_VERSION = "pending_v2" as const;
export const COMMITTED_STORAGE_SCHEMA_VERSION = "committed_v2" as const;
export const STORAGE_IDENTITY_MIGRATION_PROTOCOL = "patternly:migration:content-identity:v2" as const;

export type CanonicalStorageMetadataV1 = Readonly<{
  namespace: typeof STORAGE_NAMESPACE;
  schemaVersion: typeof CANONICAL_STORAGE_SCHEMA_VERSION;
}>;

export type StorageMetadataV2Binding = Readonly<{
  sourceManifestDigest: string;
  targetManifestDigest: string;
  targetKeySetDigest: string;
}>;

export type PendingStorageMetadataV2 = Readonly<StorageMetadataV2Binding & {
  namespace: typeof STORAGE_NAMESPACE;
  schemaVersion: typeof PENDING_STORAGE_SCHEMA_VERSION;
  migrationProtocol: typeof STORAGE_IDENTITY_MIGRATION_PROTOCOL;
}>;

export type CommittedStorageMetadataV2 = Readonly<StorageMetadataV2Binding & {
  namespace: typeof STORAGE_NAMESPACE;
  schemaVersion: typeof COMMITTED_STORAGE_SCHEMA_VERSION;
  migrationProtocol: typeof STORAGE_IDENTITY_MIGRATION_PROTOCOL;
}>;

export type CanonicalStorageMetadata = CanonicalStorageMetadataV1 | PendingStorageMetadataV2 | CommittedStorageMetadataV2;

export type StorageMetadataErrorCode =
  | "storage_metadata_invalid"
  | "storage_migration_pending"
  | "unsupported_newer_storage_schema";

export class StorageMetadataError extends Error {
  readonly code: StorageMetadataErrorCode;

  constructor(code: StorageMetadataErrorCode) {
    super(code === "storage_metadata_invalid" ? "Unsupported canonical storage schema." : code);
    this.name = "StorageMetadataError";
    this.code = code;
  }
}

const DIGEST_PATTERN = /^[0-9a-f]{64}$/u;
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
const hasExactKeys = (value: Record<string, unknown>, expected: readonly string[]): boolean => {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && keys.every((key, index) => key === expected[index]);
};

export const isCanonicalStorageMetadataV1 = (value: unknown): value is CanonicalStorageMetadataV1 =>
  isRecord(value) && hasExactKeys(value, ["namespace", "schemaVersion"]) && value.namespace === STORAGE_NAMESPACE && value.schemaVersion === CANONICAL_STORAGE_SCHEMA_VERSION;

const isStorageMetadataV2Binding = (value: Record<string, unknown>): value is StorageMetadataV2Binding =>
  typeof value.sourceManifestDigest === "string" && DIGEST_PATTERN.test(value.sourceManifestDigest) &&
  typeof value.targetManifestDigest === "string" && DIGEST_PATTERN.test(value.targetManifestDigest) &&
  typeof value.targetKeySetDigest === "string" && DIGEST_PATTERN.test(value.targetKeySetDigest);

export const isPendingStorageMetadataV2 = (value: unknown): value is PendingStorageMetadataV2 =>
  isRecord(value) && hasExactKeys(value, ["migrationProtocol", "namespace", "schemaVersion", "sourceManifestDigest", "targetKeySetDigest", "targetManifestDigest"]) &&
  value.namespace === STORAGE_NAMESPACE && value.schemaVersion === PENDING_STORAGE_SCHEMA_VERSION && value.migrationProtocol === STORAGE_IDENTITY_MIGRATION_PROTOCOL && isStorageMetadataV2Binding(value);

export const isCommittedStorageMetadataV2 = (value: unknown): value is CommittedStorageMetadataV2 =>
  isRecord(value) && hasExactKeys(value, ["migrationProtocol", "namespace", "schemaVersion", "sourceManifestDigest", "targetKeySetDigest", "targetManifestDigest"]) &&
  value.namespace === STORAGE_NAMESPACE && value.schemaVersion === COMMITTED_STORAGE_SCHEMA_VERSION && value.migrationProtocol === STORAGE_IDENTITY_MIGRATION_PROTOCOL && isStorageMetadataV2Binding(value);

export const isCanonicalStorageMetadata = (value: unknown): value is CanonicalStorageMetadata =>
  isCanonicalStorageMetadataV1(value) || isPendingStorageMetadataV2(value) || isCommittedStorageMetadataV2(value);

export type StorageMetadataEnvelope = Readonly<{
  raw: string;
  revision: number;
  metadata: CanonicalStorageMetadata;
}>;

/** Pure strict decoder shared by migration and the public metadata owner. */
export function decodeStorageMetadataEnvelope(raw: string): StorageMetadataEnvelope {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new StorageMetadataError("storage_metadata_invalid"); }
  if (!isRecord(value) || !hasExactKeys(value, ["payload", "revision", "schemaIdentity"]) || value.schemaIdentity !== CANONICAL_RECORD_SCHEMA || typeof value.revision !== "number" || !Number.isSafeInteger(value.revision) || value.revision < 1 || !isCanonicalStorageMetadata(value.payload)) {
    throw new StorageMetadataError("storage_metadata_invalid");
  }
  return Object.freeze({ raw, revision: value.revision, metadata: value.payload });
}

export function encodeStorageMetadataEnvelope(metadata: CanonicalStorageMetadata, revision: number): string {
  if (!Number.isSafeInteger(revision) || revision < 1 || !isCanonicalStorageMetadata(metadata)) throw new StorageMetadataError("storage_metadata_invalid");
  return canonicalSerialize({ schemaIdentity: CANONICAL_RECORD_SCHEMA, revision, payload: metadata });
}

export function createPendingStorageMetadataV2(binding: StorageMetadataV2Binding): PendingStorageMetadataV2 {
  const metadata = { namespace: STORAGE_NAMESPACE, schemaVersion: PENDING_STORAGE_SCHEMA_VERSION, migrationProtocol: STORAGE_IDENTITY_MIGRATION_PROTOCOL, ...binding };
  if (!isPendingStorageMetadataV2(metadata)) throw new StorageMetadataError("storage_metadata_invalid");
  return Object.freeze(metadata);
}

export function createCommittedStorageMetadataV2(binding: StorageMetadataV2Binding): CommittedStorageMetadataV2 {
  const metadata = { namespace: STORAGE_NAMESPACE, schemaVersion: COMMITTED_STORAGE_SCHEMA_VERSION, migrationProtocol: STORAGE_IDENTITY_MIGRATION_PROTOCOL, ...binding };
  if (!isCommittedStorageMetadataV2(metadata)) throw new StorageMetadataError("storage_metadata_invalid");
  return Object.freeze(metadata);
}

/** Opens only the current namespace. Old metadata is neither read nor translated. */
export async function validateStorageMetadata(): Promise<CanonicalStorageMetadataV1> {
  let metadata: CanonicalStorageMetadata | null;
  try {
    // Keep the codec's envelope validation, then classify the payload here so
    // malformed historical metadata has the owner-specific typed failure.
    metadata = readCanonicalJson(STORAGE_KEYS.METADATA, (value): value is CanonicalStorageMetadata => isRecord(value));
  } catch (error) {
    if (error instanceof StorageMetadataError) throw error;
    if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStoredRecordError) {
      throw new StorageMetadataError("storage_metadata_invalid");
    }
    throw error;
  }
  if (metadata === null) {
    const canonical: CanonicalStorageMetadataV1 = { namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION };
    writeCanonicalJson(STORAGE_KEYS.METADATA, canonical);
    return canonical;
  }
  if (isPendingStorageMetadataV2(metadata)) throw new StorageMetadataError("storage_migration_pending");
  if (isCommittedStorageMetadataV2(metadata)) throw new StorageMetadataError("unsupported_newer_storage_schema");
  if (!isCanonicalStorageMetadataV1(metadata)) throw new StorageMetadataError("storage_metadata_invalid");
  return metadata;
}
