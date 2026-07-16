import { STORAGE_NAMESPACE, STORAGE_KEYS } from "../keys";
import { readCanonicalJson, writeCanonicalJson } from "./canonicalRecordCodec";

export const CANONICAL_STORAGE_SCHEMA_VERSION = 1 as const;
export type CanonicalStorageMetadata = Readonly<{
  namespace: typeof STORAGE_NAMESPACE;
  schemaVersion: typeof CANONICAL_STORAGE_SCHEMA_VERSION;
}>;

const isMetadata = (value: unknown): value is CanonicalStorageMetadata =>
  typeof value === "object" && value !== null && !Array.isArray(value) &&
  (value as Record<string, unknown>).namespace === STORAGE_NAMESPACE &&
  (value as Record<string, unknown>).schemaVersion === CANONICAL_STORAGE_SCHEMA_VERSION &&
  Object.keys(value).length === 2;

/** Opens only the current namespace. Old metadata is neither read nor translated. */
export async function validateStorageMetadata(): Promise<CanonicalStorageMetadata> {
  const metadata = readCanonicalJson(STORAGE_KEYS.METADATA, (value): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value));
  if (metadata === null) {
    const canonical: CanonicalStorageMetadata = { namespace: STORAGE_NAMESPACE, schemaVersion: CANONICAL_STORAGE_SCHEMA_VERSION };
    writeCanonicalJson(STORAGE_KEYS.METADATA, canonical);
    return canonical;
  }
  if (!isMetadata(metadata)) throw new Error("Unsupported canonical storage schema.");
  return metadata;
}
