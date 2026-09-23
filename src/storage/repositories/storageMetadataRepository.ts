import { STORAGE_NAMESPACE, STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";
import { CorruptStoredRecordError, UnsupportedStoredRecordError } from "../errors";

/** The only storage metadata contract supported by the current application. */
export const CANONICAL_STORAGE_SCHEMA_VERSION = 1 as const;

export type CanonicalStorageMetadata = Readonly<{
  namespace: typeof STORAGE_NAMESPACE;
  schemaVersion: typeof CANONICAL_STORAGE_SCHEMA_VERSION;
}>;

export type StorageMetadataErrorCode =
  | "storage_metadata_invalid"
  | "unsupported_newer_storage_schema";

export class StorageMetadataError extends Error {
  readonly code: StorageMetadataErrorCode;

  constructor(code: StorageMetadataErrorCode) {
    super(code === "storage_metadata_invalid" ? "Unsupported canonical storage schema." : code);
    this.name = "StorageMetadataError";
    this.code = code;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  const expectedKeys = [...expected].sort();
  return keys.length === expectedKeys.length && keys.every((key, index) => key === expectedKeys[index]);
}

export const isCanonicalStorageMetadata = (value: unknown): value is CanonicalStorageMetadata =>
  isRecord(value)
  && hasExactKeys(value, ["namespace", "schemaVersion"])
  && value.namespace === STORAGE_NAMESPACE
  && value.schemaVersion === CANONICAL_STORAGE_SCHEMA_VERSION;

/** Opens only the current namespace. Unsupported historical metadata fails closed. */
export async function validateStorageMetadata(): Promise<CanonicalStorageMetadata> {
  let metadata: CanonicalStorageMetadata | null;
  try {
    metadata = readCanonicalJson(STORAGE_KEYS.METADATA, isCanonicalStorageMetadata);
  } catch (error) {
    if (error instanceof StorageMetadataError) throw error;
    if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStoredRecordError) {
      throw new StorageMetadataError("storage_metadata_invalid");
    }
    throw error;
  }
  if (metadata !== null) return metadata;
  const canonical: CanonicalStorageMetadata = { namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION };
  writeCanonicalJson(STORAGE_KEYS.METADATA, canonical);
  return canonical;
}
