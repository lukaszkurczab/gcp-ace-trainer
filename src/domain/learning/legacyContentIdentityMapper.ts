import { isCanonicalSafeIdentity } from "../../content/canonical/questionValidation";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import {
  CONTENT_IDENTITY_MIGRATION_VERSION,
  createContentIdentityResolution,
  createContentIdentityTombstone,
  createResolvedContentRef,
  isContentIdentityResolution,
  isContentIdentityTombstone,
  isResolvedContentRef,
  type ContentIdentityResolution,
  type ContentIdentityTombstoneReason,
} from "./resolvedContentRef";

/**
 * This descriptor is supplied by the already-loaded canonical catalog. The
 * mapper deliberately receives data, not a catalog owner, so mapping never
 * performs a runtime lookup or silently substitutes a current artifact.
 */
export type ActiveContentArtifactDescriptor = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  contentReleaseId: string;
  questionIds: readonly string[];
}>;

export type LegacyContentTombstoneContext =
  | Readonly<{ kind: "archival_history"; sessionId: string }>
  | Readonly<{ kind: "unavailable_active"; sessionId: string }>
  | Readonly<{ kind: "unavailable_review"; reviewId: string }>;

export type LegacyContentIdentityErrorCode =
  | "malformed_legacy_identity"
  | "invalid_active_artifact_set"
  | "invalid_tombstone_context"
  | "tombstone_context_required";

export class LegacyContentIdentityError extends Error {
  readonly code: LegacyContentIdentityErrorCode;

  constructor(code: LegacyContentIdentityErrorCode, message: string) {
    super(message);
    this.name = "LegacyContentIdentityError";
    this.code = code;
  }
}

type LegacyContentIdentity = Readonly<{
  trackId: string;
  itemId: string;
  contentVersion: string;
  packagePin: Readonly<{
    packageIdentity: string;
    packageVersion: string;
    contentReleaseId: string;
  }>;
}>;

const LEGACY_IDENTITY_KEYS = ["trackId", "itemId", "contentVersion", "packagePin"] as const;
const LEGACY_PACKAGE_PIN_KEYS = ["packageIdentity", "packageVersion", "contentReleaseId"] as const;
const SHA_256 = /^[a-f0-9]{64}$/u;

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function hasExactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Reflect.ownKeys(value);
  return actual.length === keys.length && actual.every((key) => typeof key === "string" && keys.includes(key)) && keys.every((key) => Object.hasOwn(value, key));
}

function assertSafeIdentity(value: unknown, path: string): asserts value is string {
  if (!isCanonicalSafeIdentity(value)) throw new LegacyContentIdentityError("malformed_legacy_identity", `${path} is not a canonical-safe identity.`);
}

function decodeLegacyContentIdentity(value: unknown): LegacyContentIdentity {
  if (!isPlainRecord(value) || !hasExactKeys(value, LEGACY_IDENTITY_KEYS) || !isPlainRecord(value.packagePin) || !hasExactKeys(value.packagePin, LEGACY_PACKAGE_PIN_KEYS)) {
    throw new LegacyContentIdentityError("malformed_legacy_identity", "Legacy content identity must be one exact identity object.");
  }
  assertSafeIdentity(value.trackId, "trackId");
  assertSafeIdentity(value.itemId, "itemId");
  assertSafeIdentity(value.contentVersion, "contentVersion");
  assertSafeIdentity(value.packagePin.packageIdentity, "packagePin.packageIdentity");
  assertSafeIdentity(value.packagePin.packageVersion, "packagePin.packageVersion");
  assertSafeIdentity(value.packagePin.contentReleaseId, "packagePin.contentReleaseId");
  if (!SHA_256.test(value.packagePin.packageIdentity)) {
    throw new LegacyContentIdentityError("malformed_legacy_identity", "Legacy package identity must be a lowercase 64-hex SHA-256.");
  }
  return Object.freeze({
    trackId: value.trackId,
    itemId: value.itemId,
    contentVersion: value.contentVersion,
    packagePin: Object.freeze({
      packageIdentity: value.packagePin.packageIdentity,
      packageVersion: value.packagePin.packageVersion,
      contentReleaseId: value.packagePin.contentReleaseId,
    }),
  });
}

function validateActiveArtifactSet(value: readonly ActiveContentArtifactDescriptor[]): readonly ActiveContentArtifactDescriptor[] {
  if (!Array.isArray(value)) throw new LegacyContentIdentityError("invalid_active_artifact_set", "Active content artifacts must be an array.");
  const seen = new Set<string>();
  for (const artifact of value) {
    if (!isPlainRecord(artifact)) throw new LegacyContentIdentityError("invalid_active_artifact_set", "Active content artifact descriptor is malformed.");
    const keys = ["trackId", "contentVersion", "artifactSha256", "contentReleaseId", "questionIds"];
    if (!hasExactKeys(artifact, keys)) throw new LegacyContentIdentityError("invalid_active_artifact_set", "Active content artifact descriptor has an invalid exact shape.");
    assertSafeIdentity(artifact.trackId, "activeArtifact.trackId");
    assertSafeIdentity(artifact.contentVersion, "activeArtifact.contentVersion");
    if (typeof artifact.artifactSha256 !== "string" || !SHA_256.test(artifact.artifactSha256)) throw new LegacyContentIdentityError("invalid_active_artifact_set", "Active content artifact SHA-256 is malformed.");
    assertSafeIdentity(artifact.contentReleaseId, "activeArtifact.contentReleaseId");
    if (!Array.isArray(artifact.questionIds) || artifact.questionIds.some((questionId) => !isCanonicalSafeIdentity(questionId)) || new Set(artifact.questionIds).size !== artifact.questionIds.length) {
      throw new LegacyContentIdentityError("invalid_active_artifact_set", "Active content artifact question membership is malformed.");
    }
    const key = canonicalSerialize({ trackId: artifact.trackId, contentVersion: artifact.contentVersion, artifactSha256: artifact.artifactSha256, contentReleaseId: artifact.contentReleaseId });
    if (seen.has(key)) throw new LegacyContentIdentityError("invalid_active_artifact_set", "Active content artifacts contain a duplicate identity.");
    seen.add(key);
  }
  return Object.freeze(value.map((artifact) => Object.freeze({ ...artifact, questionIds: Object.freeze([...artifact.questionIds]) })));
}

function validateTombstoneContext(value: LegacyContentTombstoneContext | undefined): LegacyContentTombstoneContext {
  if (value === undefined) throw new LegacyContentIdentityError("tombstone_context_required", "An unmapped identity requires an explicit history or unavailable record context.");
  const expectedKeys = value.kind === "unavailable_review" ? ["kind", "reviewId"] : value.kind === "archival_history" || value.kind === "unavailable_active" ? ["kind", "sessionId"] : [];
  if (expectedKeys.length === 0 || !isPlainRecord(value) || !hasExactKeys(value, expectedKeys)) throw new LegacyContentIdentityError("invalid_tombstone_context", "Tombstone context has an invalid exact shape.");
  const id = value.kind === "unavailable_review" ? value.reviewId : value.sessionId;
  if (!isCanonicalSafeIdentity(id)) throw new LegacyContentIdentityError("invalid_tombstone_context", "Tombstone context identifier is not canonical-safe.");
  return value;
}

function unmappedReason(identity: LegacyContentIdentity, artifacts: readonly ActiveContentArtifactDescriptor[]): ContentIdentityTombstoneReason | null {
  const candidates = artifacts.filter((artifact) => artifact.artifactSha256 === identity.packagePin.packageIdentity);
  if (candidates.length === 0) return "unknown_artifact_hash";
  const trackCandidates = candidates.filter((candidate) => candidate.trackId === identity.trackId);
  if (trackCandidates.length === 0) return "track_mismatch";
  const versionCandidates = trackCandidates.filter((candidate) => candidate.contentVersion === identity.contentVersion && candidate.contentVersion === identity.packagePin.packageVersion);
  if (versionCandidates.length === 0) return "stale_content_version";
  const releaseCandidates = versionCandidates.filter((candidate) => candidate.contentReleaseId === identity.packagePin.contentReleaseId);
  if (releaseCandidates.length === 0) return "stale_content_release";
  if (!releaseCandidates.some((candidate) => candidate.questionIds.includes(identity.itemId))) return "question_not_in_active_artifact";
  return null;
}

function buildTombstone(identity: LegacyContentIdentity, reason: ContentIdentityTombstoneReason, context: LegacyContentTombstoneContext | undefined): ContentIdentityResolution {
  const tombstoneContext = validateTombstoneContext(context);
  const common = {
    trackId: identity.trackId,
    questionId: identity.itemId,
    contentVersion: identity.contentVersion,
    reason,
    migrationVersion: CONTENT_IDENTITY_MIGRATION_VERSION,
    legacyIdentityDigest: sha256Utf8(canonicalSerialize(identity)),
  };
  const tombstone = tombstoneContext.kind === "unavailable_review"
    ? { ...common, kind: tombstoneContext.kind, reviewId: tombstoneContext.reviewId }
    : { ...common, kind: tombstoneContext.kind, sessionId: tombstoneContext.sessionId };
  return createContentIdentityResolution({ kind: "tombstone", tombstone: createContentIdentityTombstone(tombstone) });
}

/**
 * Private migration boundary. It is intentionally omitted from the domain
 * barrel; only the strict ref and immutable result contracts are public.
 */
export function mapLegacyContentIdentity(
  value: unknown,
  activeArtifacts: readonly ActiveContentArtifactDescriptor[],
  tombstoneContext?: LegacyContentTombstoneContext,
): ContentIdentityResolution {
  if (isContentIdentityResolution(value)) return createContentIdentityResolution(value);
  if (isResolvedContentRef(value)) return createContentIdentityResolution({ kind: "resolved", ref: value });
  if (isContentIdentityTombstone(value)) return createContentIdentityResolution({ kind: "tombstone", tombstone: value });
  if (isPlainRecord(value) && (value.kind === "resolved" || value.kind === "tombstone")) throw new LegacyContentIdentityError("malformed_legacy_identity", "Tagged content identity result is malformed.");

  const identity = decodeLegacyContentIdentity(value);
  const artifacts = validateActiveArtifactSet(activeArtifacts);
  const reason = unmappedReason(identity, artifacts);
  if (reason === null) {
    const artifact = artifacts.find((candidate) => candidate.artifactSha256 === identity.packagePin.packageIdentity && candidate.trackId === identity.trackId && candidate.contentVersion === identity.contentVersion && candidate.contentVersion === identity.packagePin.packageVersion && candidate.contentReleaseId === identity.packagePin.contentReleaseId && candidate.questionIds.includes(identity.itemId))!;
    return createContentIdentityResolution({ kind: "resolved", ref: createResolvedContentRef({ trackId: identity.trackId, questionId: identity.itemId, contentVersion: identity.contentVersion, artifactSha256: artifact.artifactSha256 }) });
  }
  return buildTombstone(identity, reason, tombstoneContext);
}
