import {
  isContentIdentityResolution,
  isContentIdentityTombstone,
  isResolvedContentRef,
  type ContentIdentityResolution,
  type ContentIdentityTombstone,
  type ResolvedContentRef,
} from "../../domain/learning/resolvedContentRef";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";

/**
 * The persisted target contract for the dormant C1a planner.  It is kept out
 * of the storage barrel on purpose: C1b is the first slice allowed to bind it
 * to public repositories or bootstrap.
 */
export const CONTENT_IDENTITY_V2_SCHEMA = "patternly:content-identity:v2" as const;
export const CONTENT_IDENTITY_V2_PROTOCOL_VERSION = 1 as const;
export const CONTENT_IDENTITY_V2_MIGRATION_VERSION = 1 as const;

export type ContentIdentityV2Resolution = ContentIdentityResolution;
export type ContentIdentityV2IdentityBinding = Readonly<{
  path: string;
  resolution: ContentIdentityV2Resolution;
}>;

/**
 * Digests preserve facts without copying a legacy envelope into a tombstone.
 * The owner handler supplies the paths; this contract never recursively
 * searches arbitrary payloads.
 */
export type ContentIdentityV2Preservation = Readonly<{
  sourceKey: string;
  sourceRevision: number;
  recordId: string | null;
  idsDigest: string;
  revisionsDigest: string;
  orderingDigest: string;
  resultsDigest: string;
  timestampsDigest: string;
  answersDigest: string;
  fingerprintDigest: string;
}>;

export type ContentIdentityV2Record = Readonly<{
  schemaIdentity: typeof CONTENT_IDENTITY_V2_SCHEMA;
  owner: string;
  key: string;
  sourceRevision: number;
  value: unknown;
  identity: readonly ContentIdentityV2IdentityBinding[];
  preservation: ContentIdentityV2Preservation;
}>;

export type ContentIdentityV2Certificate = Readonly<{
  schemaIdentity: typeof CONTENT_IDENTITY_V2_SCHEMA;
  protocolVersion: typeof CONTENT_IDENTITY_V2_PROTOCOL_VERSION;
  migrationVersion: typeof CONTENT_IDENTITY_V2_MIGRATION_VERSION;
  planId: string;
  sourceManifestDigest: string;
  targetManifestDigest: string;
  preservationDigest: string;
}>;

export class ContentIdentityV2Error extends Error {
  readonly code:
    | "invalid_v2_record"
    | "invalid_v2_resolution"
    | "invalid_preservation"
    | "forbidden_legacy_identity";

  constructor(code: ContentIdentityV2Error["code"], message: string = code) {
    super(message);
    this.name = "ContentIdentityV2Error";
    this.code = code;
  }
}

const DIGEST = /^[a-f0-9]{64}$/u;
const IDENTITY_KEYS = ["path", "resolution"] as const;
const PRESERVATION_KEYS = [
  "answersDigest", "fingerprintDigest", "idsDigest", "orderingDigest", "recordId",
  "resultsDigest", "revisionsDigest", "sourceKey", "sourceRevision", "timestampsDigest",
] as const;
const RECORD_KEYS = ["identity", "key", "owner", "preservation", "schemaIdentity", "sourceRevision", "value"] as const;
const CERTIFICATE_KEYS = [
  "migrationVersion", "planId", "preservationDigest",
  "protocolVersion", "schemaIdentity", "sourceManifestDigest", "targetManifestDigest",
] as const;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value).sort();
  return keys.length === expected.length && [...expected].sort().every((key, index) => keys[index] === key);
}

function nonEmpty(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isSafePath(value: unknown): value is string {
  return nonEmpty(value) && !value.includes("..") && !value.includes("\0");
}

function freezeJson(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(freezeJson));
  if (isPlainRecord(value)) return Object.freeze(Object.fromEntries(Object.entries(value).map(([key, child]) => [key, freezeJson(child)])));
  return value;
}

function hasForbiddenLegacyField(value: unknown, owner: string, path = "value", seen = new Set<unknown>()): boolean {
  if (value === null || typeof value !== "object") return false;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value)) return value.some((child, index) => hasForbiddenLegacyField(child, owner, `${path}[${index}]`, seen));
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (key === "packagePin") return true;
    if (key === "itemId" && !(owner === "contentReportOutboxRepository" && /\.input\.itemId$/u.test(childPath))) return true;
    if (hasForbiddenLegacyField(child, owner, childPath, seen)) return true;
  }
  return false;
}

function assertResolution(value: unknown): asserts value is ContentIdentityV2Resolution {
  if (!isContentIdentityResolution(value)) throw new ContentIdentityV2Error("invalid_v2_resolution");
}

function assertPreservation(value: unknown): asserts value is ContentIdentityV2Preservation {
  const sourceRevision = isPlainRecord(value) ? value.sourceRevision : undefined;
  if (!isPlainRecord(value) || !hasExactKeys(value, PRESERVATION_KEYS) ||
    !isSafePath(value.sourceKey) || !Number.isSafeInteger(sourceRevision) || Number(sourceRevision) < 1 ||
    (value.recordId !== null && !nonEmpty(value.recordId)) ||
    ![value.idsDigest, value.revisionsDigest, value.orderingDigest, value.resultsDigest, value.timestampsDigest, value.answersDigest, value.fingerprintDigest].every((digest) => DIGEST.test(String(digest)))) {
    throw new ContentIdentityV2Error("invalid_preservation");
  }
}

export function createContentIdentityV2Record(value: unknown): ContentIdentityV2Record {
  const sourceRevision = isPlainRecord(value) ? value.sourceRevision : undefined;
  if (!isPlainRecord(value) || !hasExactKeys(value, RECORD_KEYS) || value.schemaIdentity !== CONTENT_IDENTITY_V2_SCHEMA ||
    !nonEmpty(value.owner) || !isSafePath(value.key) || !Number.isSafeInteger(sourceRevision) || Number(sourceRevision) < 1 ||
    !Array.isArray(value.identity) || value.identity.some((binding) => !isPlainRecord(binding) || !hasExactKeys(binding, IDENTITY_KEYS) || !isSafePath(binding.path)) || new Set(value.identity.map((binding) => isPlainRecord(binding) ? binding.path : "")).size !== value.identity.length) {
    throw new ContentIdentityV2Error("invalid_v2_record");
  }
  for (const binding of value.identity) assertResolution(binding.resolution);
  assertPreservation(value.preservation);
  if (value.preservation.sourceKey !== value.key || value.preservation.sourceRevision !== Number(sourceRevision)) {
    throw new ContentIdentityV2Error("invalid_preservation");
  }
  if (hasForbiddenLegacyField(value.value, value.owner)) throw new ContentIdentityV2Error("forbidden_legacy_identity");
  return Object.freeze({
    schemaIdentity: CONTENT_IDENTITY_V2_SCHEMA,
    owner: value.owner,
    key: value.key,
    sourceRevision: Number(sourceRevision),
    value: freezeJson(value.value),
    identity: Object.freeze(value.identity.map((binding) => Object.freeze({ path: binding.path, resolution: freezeJson(binding.resolution) as ContentIdentityV2Resolution }))),
    preservation: Object.freeze({ ...value.preservation }),
  });
}

export function isContentIdentityV2Record(value: unknown): value is ContentIdentityV2Record {
  try {
    createContentIdentityV2Record(value);
    return true;
  } catch {
    return false;
  }
}

export function createContentIdentityV2Certificate(value: unknown): ContentIdentityV2Certificate {
  if (!isPlainRecord(value) || !hasExactKeys(value, CERTIFICATE_KEYS) || value.schemaIdentity !== CONTENT_IDENTITY_V2_SCHEMA ||
    value.protocolVersion !== CONTENT_IDENTITY_V2_PROTOCOL_VERSION || value.migrationVersion !== CONTENT_IDENTITY_V2_MIGRATION_VERSION ||
    !DIGEST.test(String(value.planId)) || !DIGEST.test(String(value.sourceManifestDigest)) || !DIGEST.test(String(value.targetManifestDigest)) ||
    !DIGEST.test(String(value.preservationDigest))) {
    throw new ContentIdentityV2Error("invalid_v2_record", "Invalid content identity v2 certificate.");
  }
  return Object.freeze({
    schemaIdentity: CONTENT_IDENTITY_V2_SCHEMA,
    protocolVersion: CONTENT_IDENTITY_V2_PROTOCOL_VERSION,
    migrationVersion: CONTENT_IDENTITY_V2_MIGRATION_VERSION,
    planId: String(value.planId),
    sourceManifestDigest: String(value.sourceManifestDigest),
    targetManifestDigest: String(value.targetManifestDigest),
    preservationDigest: String(value.preservationDigest),
  });
}

export function isContentIdentityV2Certificate(value: unknown): value is ContentIdentityV2Certificate {
  try {
    createContentIdentityV2Certificate(value);
    return true;
  } catch {
    return false;
  }
}

export function contentIdentityV2Digest(value: unknown): string {
  return sha256Utf8(canonicalSerialize(value));
}

export function contentIdentityV2ResolutionDigest(value: ContentIdentityV2Resolution): string {
  assertResolution(value);
  return contentIdentityV2Digest(value);
}

export type { ContentIdentityTombstone, ResolvedContentRef };
export const isContentIdentityV2ResolvedRef = isResolvedContentRef;
export const isContentIdentityV2Tombstone = isContentIdentityTombstone;
