import { isCanonicalSafeIdentity } from "../../content/canonical/questionValidation";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { deepFreeze } from "./familyEnvelope";

/** The only content identity that may cross the post-migration runtime boundary. */
export type ResolvedContentRef = Readonly<{
  trackId: string;
  questionId: string;
  contentVersion: string;
  artifactSha256: string;
}>;

export const RESOLVED_CONTENT_REF_VERSION = 1 as const;
export const CONTENT_IDENTITY_MIGRATION_VERSION = 1 as const;

const RESOLVED_CONTENT_REF_KEYS = ["trackId", "questionId", "contentVersion", "artifactSha256"] as const;
const SHA_256 = /^[a-f0-9]{64}$/u;

export class ResolvedContentRefError extends Error {
  readonly code: "invalid_shape" | "invalid_identity" | "invalid_artifact_sha256";

  constructor(code: ResolvedContentRefError["code"], message: string) {
    super(message);
    this.name = "ResolvedContentRefError";
    this.code = code;
  }
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Reflect.ownKeys(value);
  return actual.length === keys.length && actual.every((key) => typeof key === "string" && keys.includes(key)) && keys.every((key) => Object.hasOwn(value, key));
}

function assertIdentity(value: unknown, field: string): asserts value is string {
  if (!isCanonicalSafeIdentity(value)) {
    throw new ResolvedContentRefError("invalid_identity", `${field} must be a non-empty canonical-safe identity.`);
  }
}

function assertResolvedContentRef(value: unknown): asserts value is ResolvedContentRef {
  if (!isPlainRecord(value) || !hasExactKeys(value, RESOLVED_CONTENT_REF_KEYS)) {
    throw new ResolvedContentRefError("invalid_shape", "Resolved content ref must contain exactly its four identity fields.");
  }
  assertIdentity(value.trackId, "trackId");
  assertIdentity(value.questionId, "questionId");
  assertIdentity(value.contentVersion, "contentVersion");
  if (typeof value.artifactSha256 !== "string" || !SHA_256.test(value.artifactSha256)) {
    throw new ResolvedContentRefError("invalid_artifact_sha256", "artifactSha256 must be a lowercase 64-hex SHA-256 without normalization.");
  }
}

/** Creates a frozen, exact-shape runtime identity. */
export function createResolvedContentRef(value: unknown): ResolvedContentRef {
  assertResolvedContentRef(value);
  return Object.freeze({
    trackId: value.trackId,
    questionId: value.questionId,
    contentVersion: value.contentVersion,
    artifactSha256: value.artifactSha256,
  });
}

export function isResolvedContentRef(value: unknown): value is ResolvedContentRef {
  try {
    assertResolvedContentRef(value);
    return true;
  } catch {
    return false;
  }
}

/** Versioned structural key; field names and canonical serialization prevent delimiter collisions. */
export function resolvedContentRefKey(value: ResolvedContentRef): string {
  const ref = createResolvedContentRef(value);
  return `resolved-content-ref:v${RESOLVED_CONTENT_REF_VERSION}:${canonicalSerialize(ref)}`;
}

export function resolvedContentRefsEqual(left: unknown, right: unknown): boolean {
  return isResolvedContentRef(left) && isResolvedContentRef(right) &&
    left.trackId === right.trackId &&
    left.questionId === right.questionId &&
    left.contentVersion === right.contentVersion &&
    left.artifactSha256 === right.artifactSha256;
}

export type ContentIdentityTombstoneKind = "archival_history" | "unavailable_active" | "unavailable_review";

export type ContentIdentityTombstoneReason =
  | "unknown_artifact_hash"
  | "stale_content_version"
  | "stale_content_release"
  | "track_mismatch"
  | "question_not_in_active_artifact";

type ContentIdentityTombstoneBase = Readonly<{
  trackId: string;
  questionId: string;
  contentVersion: string;
  reason: ContentIdentityTombstoneReason;
  migrationVersion: typeof CONTENT_IDENTITY_MIGRATION_VERSION;
  legacyIdentityDigest: string;
}>;

export type ArchivalHistoryContentIdentityTombstone = ContentIdentityTombstoneBase & Readonly<{
  kind: "archival_history";
  sessionId: string;
}>;

export type UnavailableActiveContentIdentityTombstone = ContentIdentityTombstoneBase & Readonly<{
  kind: "unavailable_active";
  sessionId: string;
}>;

export type UnavailableReviewContentIdentityTombstone = ContentIdentityTombstoneBase & Readonly<{
  kind: "unavailable_review";
  reviewId: string;
}>;

export type ContentIdentityTombstone =
  | ArchivalHistoryContentIdentityTombstone
  | UnavailableActiveContentIdentityTombstone
  | UnavailableReviewContentIdentityTombstone;

const TOMBSTONE_REASONS: readonly ContentIdentityTombstoneReason[] = [
  "unknown_artifact_hash",
  "stale_content_version",
  "stale_content_release",
  "track_mismatch",
  "question_not_in_active_artifact",
];

function hasForbiddenLegacyField(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === null || typeof value !== "object") return false;
  if (seen.has(value)) return true;
  seen.add(value);
  if (Array.isArray(value)) return value.some((entry) => hasForbiddenLegacyField(entry, seen));
  return Object.entries(value).some(([key, child]) => key === "packagePin" || key === "itemId" || hasForbiddenLegacyField(child, seen));
}

function assertTombstone(value: unknown): asserts value is ContentIdentityTombstone {
  if (!isPlainRecord(value) || hasForbiddenLegacyField(value)) throw new TypeError("Content identity tombstone contains forbidden legacy identity fields.");
  const common = ["trackId", "questionId", "contentVersion", "reason", "migrationVersion", "legacyIdentityDigest"];
  const kind = value.kind;
  const ids = kind === "archival_history" || kind === "unavailable_active" ? [...common, "kind", "sessionId"] : kind === "unavailable_review" ? [...common, "kind", "reviewId"] : [];
  if (ids.length === 0 || !hasExactKeys(value, ids)) throw new TypeError("Content identity tombstone has an invalid exact shape.");
  assertIdentity(value.trackId, "trackId");
  assertIdentity(value.questionId, "questionId");
  assertIdentity(value.contentVersion, "contentVersion");
  if (!TOMBSTONE_REASONS.includes(value.reason as ContentIdentityTombstoneReason)) throw new TypeError("Content identity tombstone has an invalid reason.");
  if (value.migrationVersion !== CONTENT_IDENTITY_MIGRATION_VERSION) throw new TypeError("Content identity tombstone has an unsupported migration version.");
  if (typeof value.legacyIdentityDigest !== "string" || !SHA_256.test(value.legacyIdentityDigest)) throw new TypeError("Content identity tombstone has an invalid legacy identity digest.");
  assertIdentity(kind === "unavailable_review" ? value.reviewId : value.sessionId, kind === "unavailable_review" ? "reviewId" : "sessionId");
}

export function createContentIdentityTombstone(value: unknown): ContentIdentityTombstone {
  assertTombstone(value);
  return deepFreeze({ ...value });
}

export function isContentIdentityTombstone(value: unknown): value is ContentIdentityTombstone {
  try {
    assertTombstone(value);
    return true;
  } catch {
    return false;
  }
}

export type ContentIdentityResolution =
  | Readonly<{ kind: "resolved"; ref: ResolvedContentRef }>
  | Readonly<{ kind: "tombstone"; tombstone: ContentIdentityTombstone }>;

function assertContentIdentityResolution(value: unknown): asserts value is ContentIdentityResolution {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["kind", value.kind === "resolved" ? "ref" : "tombstone"])) throw new TypeError("Content identity resolution has an invalid exact shape.");
  if (value.kind === "resolved") {
    if (!isResolvedContentRef(value.ref)) throw new TypeError("Resolved content identity result contains an invalid ref.");
    return;
  }
  if (value.kind !== "tombstone" || !isContentIdentityTombstone(value.tombstone)) throw new TypeError("Content identity resolution contains an invalid tombstone.");
}

export function createContentIdentityResolution(value: unknown): ContentIdentityResolution {
  assertContentIdentityResolution(value);
  if (value.kind === "resolved") return deepFreeze({ kind: "resolved", ref: createResolvedContentRef(value.ref) });
  return deepFreeze({ kind: "tombstone", tombstone: createContentIdentityTombstone(value.tombstone) });
}

export function isContentIdentityResolution(value: unknown): value is ContentIdentityResolution {
  try {
    assertContentIdentityResolution(value);
    return true;
  } catch {
    return false;
  }
}
