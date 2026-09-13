/**
 * Synchronized with patternly-backend/openapi/patternly-v1.json.
 * Backend CI verifies that every versioned API path is represented here.
 */

import { developmentLoopbackHost } from "../developmentEndpoints";
import { CONTENT_IDENTITY_V2_SCHEMA } from "../../storage/contracts/contentIdentityV2";

/** Exact schema identifier shared with the backend protocol-v4 contract. */
export const CONTENT_IDENTITY_SCHEMA = CONTENT_IDENTITY_V2_SCHEMA;
export type ContentIdentitySchemaDto = typeof CONTENT_IDENTITY_SCHEMA;

/**
 * The default remains the pre-marker protocol.  Bootstrap may explicitly
 * select v4 after the committed_v2 storage marker is durable; the adapter
 * never downgrades a selected v4 client after a schema error.
 */
export type AccountDataProtocolMode = "v3" | "v4";
export type AccountDataProtocolModeInput = AccountDataProtocolMode | "legacy-v3" | "content-identity-v4";

export const ACCOUNT_DATA_PROTOCOL_V3: AccountDataProtocolMode = "v3";
export const ACCOUNT_DATA_PROTOCOL_V4: AccountDataProtocolMode = "v4";

function normalizeAccountDataProtocolMode(value: AccountDataProtocolModeInput | undefined): AccountDataProtocolMode {
  return value === "v4" || value === "content-identity-v4" ? "v4" : "v3";
}

const MAX_SERIALIZED_JSON_UTF16_CODE_UNITS = 128 * 1024;
const MAX_SYNC_ENVELOPE_UTF8_BYTES = 512 * 1024;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const MUTATION_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const CONTENT_IDENTITY_LEGACY_KEYS = new Set(["packagePin", "contentPackagePin", "itemId"]);
const PROGRESS_RECORD_TYPES = new Set(["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry", "goal", "learning_plan"]);
const LEGACY_PROGRESS_RECORD_TYPES = new Set(["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry"]);
const CONTENT_IDENTITY_TOMBSTONE_REASONS = new Set(["unknown_artifact_hash", "stale_content_version", "stale_content_release", "track_mismatch", "question_not_in_active_artifact"]);
const ADOPTION_CASES = new Set(["emptyLocalEmptyRemote", "populatedLocalEmptyRemote", "emptyLocalPopulatedRemote", "populatedLocalPopulatedRemote", "divergentRecord", "blocked"]);
const BLOCKING_REASONS = new Set(["active_session", "journal_recovery"]);
const CONFLICT_CODES = new Set(["version_conflict", "content_identity_schema_conflict"]);

type CodecMode = AccountDataProtocolMode;

function contentIdentitySchemaConflict(): never {
  throw new PatternlyApiClientError("server_error", 409, "content_identity_schema_conflict");
}

function invalidResponse(): never {
  throw new PatternlyApiClientError("invalid_response");
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype;
}

function hasExactKeys(value: unknown, keys: readonly string[]): value is Record<string, unknown> {
  if (!isPlainRecord(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return actual.length === expected.length && actual.every((key, index) => key === expected[index]);
}

function hasOneOfExactKeys(value: unknown, alternatives: readonly (readonly string[])[]): boolean {
  return alternatives.some((keys) => hasExactKeys(value, keys));
}

function isFiniteNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

function isBoundedString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.length >= min && value.length <= max;
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isSha256(value: unknown): value is string {
  return typeof value === "string" && SHA256_PATTERN.test(value);
}

function isMutationId(value: unknown): value is string {
  return typeof value === "string" && MUTATION_ID_PATTERN.test(value);
}

function isContentIdentitySchema(value: unknown): value is ContentIdentitySchemaDto {
  return value === CONTENT_IDENTITY_SCHEMA;
}

function hasContentIdentitySchema(value: unknown): value is Readonly<{ contentIdentitySchema: ContentIdentitySchemaDto }> {
  return isPlainRecord(value) && isContentIdentitySchema(value.contentIdentitySchema);
}

function hasWrongContentIdentitySchema(value: unknown): boolean {
  return isPlainRecord(value) && value.contentIdentitySchema !== undefined && !isContentIdentitySchema(value.contentIdentitySchema);
}

/** The v3 wire contract is deliberately marker-free, including nested state. */
function containsContentIdentitySchema(value: unknown, seen = new Set<unknown>()): boolean {
  if (typeof value !== "object" || value === null) return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((child) => containsContentIdentitySchema(child, seen));
  if (!isPlainRecord(value)) return false;
  if (Object.prototype.hasOwnProperty.call(value, "contentIdentitySchema")) return true;
  return Object.values(value).some((child) => containsContentIdentitySchema(child, seen));
}

function utf8ByteLength(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.codePointAt(index) ?? 0;
    if (codePoint > 0xffff) index += 1;
    bytes += codePoint <= 0x7f ? 1 : codePoint <= 0x7ff ? 2 : codePoint <= 0xffff ? 3 : 4;
  }
  return bytes;
}

function isJsonTree(value: unknown, seen = new Set<unknown>()): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (typeof value !== "object") return false;
  if (seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.every((child) => isJsonTree(child, seen));
  return isPlainRecord(value) && Object.values(value).every((child) => isJsonTree(child, seen));
}

function canonicalJson(value: unknown): string {
  if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map((child) => canonicalJson(child)).join(",")}]`;
  if (!isPlainRecord(value)) throw new Error("not-json");
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

type StateValidation = "ok" | "invalid" | "schema";

function validateState(value: unknown, mode: CodecMode): StateValidation {
  if (!isPlainRecord(value) || !isJsonTree(value)) return "invalid";
  let serialized: string;
  let canonical: string;
  try {
    serialized = JSON.stringify(value);
    canonical = canonicalJson(value);
  } catch {
    return "invalid";
  }
  if (serialized.length > MAX_SERIALIZED_JSON_UTF16_CODE_UNITS || utf8ByteLength(canonical) > MAX_SYNC_ENVELOPE_UTF8_BYTES) return "invalid";
  if (mode === "v3" && containsContentIdentitySchema(value)) return "schema";
  if (mode === "v4") {
    try {
      assertV4ContentIdentityState(value);
    } catch {
      return "schema";
    }
  }
  return "ok";
}

function assertState(value: unknown, mode: CodecMode): void {
  const result = validateState(value, mode);
  if (result === "schema") return contentIdentitySchemaConflict();
  if (result === "invalid") return invalidResponse();
}

function assertV4ContentIdentityState(value: unknown): void {
  const seen = new Set<unknown>();
  const visit = (candidate: unknown): void => {
    if (candidate === null || typeof candidate !== "object") return;
    if (seen.has(candidate)) throw new Error("content_identity_schema_conflict");
    seen.add(candidate);
    if (Array.isArray(candidate)) {
      candidate.forEach(visit);
      return;
    }
    if (!isPlainRecord(candidate)) throw new Error("content_identity_schema_conflict");
    const keys = Object.keys(candidate);
    if (keys.some((key) => CONTENT_IDENTITY_LEGACY_KEYS.has(key))) throw new Error("content_identity_schema_conflict");
    const isResolutionWrapper = candidate.kind === "resolved" || candidate.kind === "tombstone";
    if (isResolutionWrapper) {
      if (candidate.kind === "resolved") {
        if (!hasExactKeys(candidate, ["kind", "ref"]) || !isResolvedContentIdentityLeaf(candidate.ref)) throw new Error("content_identity_schema_conflict");
      } else if (!hasExactKeys(candidate, ["kind", "tombstone"]) || !isTombstoneContentIdentityLeaf(candidate.tombstone)) {
        throw new Error("content_identity_schema_conflict");
      }
      return;
    }
    const isPlanPayload = keys.some((key) => key === "planId" || key === "goalRevision" || key === "slots" || key === "acceptedTarget" || key === "planRevision");
    const isResolvedLeaf = keys.length > 0 && (keys.includes("questionId") || (keys.includes("artifactSha256") && !isPlanPayload));
    const hasTombstoneMarker = candidate.kind === "archival_history"
      || candidate.kind === "unavailable_active"
      || candidate.kind === "unavailable_review"
      || keys.includes("legacyIdentityDigest")
      || (keys.includes("migrationVersion") && keys.includes("reason"));
    if (isResolvedLeaf) {
      if (!isResolvedContentIdentityLeaf(candidate)) throw new Error("content_identity_schema_conflict");
      return;
    }
    if (hasTombstoneMarker) {
      if (!isTombstoneContentIdentityLeaf(candidate)) throw new Error("content_identity_schema_conflict");
      return;
    }
    Object.values(candidate).forEach(visit);
  };
  visit(value);
}

function isResolvedContentIdentityLeaf(value: unknown): boolean {
  return hasExactKeys(value, ["trackId", "questionId", "contentVersion", "artifactSha256"])
    && isBoundedString(value.trackId, 1, 256)
    && isBoundedString(value.questionId, 1, 256)
    && isBoundedString(value.contentVersion, 1, 256)
    && isSha256(value.artifactSha256);
}

function isTombstoneContentIdentityLeaf(value: unknown): boolean {
  if (!isPlainRecord(value) || !isBoundedString(value.trackId, 1, 256) || !isBoundedString(value.questionId, 1, 256)
    || !isBoundedString(value.contentVersion, 1, 256) || value.migrationVersion !== 1 || !isSha256(value.legacyIdentityDigest)
    || typeof value.reason !== "string" || !CONTENT_IDENTITY_TOMBSTONE_REASONS.has(value.reason)) return false;
  const tail = value.kind === "archival_history" ? "sessionId" : value.kind === "unavailable_active" ? "sessionId" : "reviewId";
  if (!(["archival_history", "unavailable_active", "unavailable_review"] as readonly unknown[]).includes(value.kind)) return false;
  return hasExactKeys(value, ["trackId", "questionId", "contentVersion", "reason", "migrationVersion", "legacyIdentityDigest", "kind", tail])
    && isBoundedString(value[tail], 1, 256);
}

function assertNoV3Schema(value: unknown): void {
  if (containsContentIdentitySchema(value)) return contentIdentitySchemaConflict();
}

function assertSchemaField(value: unknown, mode: CodecMode): void {
  if (mode === "v3") return assertNoV3Schema(value);
  if (!isPlainRecord(value) || !isContentIdentitySchema(value.contentIdentitySchema)) return contentIdentitySchemaConflict();
}

function assertStringArray(value: unknown, max: number): value is string[] {
  return Array.isArray(value) && value.length <= max && value.every((item) => isBoundedString(item, 1, 768));
}

function validateProgressRecord(value: unknown, mode: CodecMode): value is ProgressRecordDto | ProgressRecordV4Dto {
  if (!isPlainRecord(value)) return invalidResponse();
  const expected = mode === "v4"
    ? ["kind", "recordType", "trackId", "targetId", "version", "fingerprint", "state", "lastMutationId", "updatedAt", "contentIdentitySchema"]
    : ["kind", "recordType", "trackId", "targetId", "version", "fingerprint", "state", "lastMutationId", "updatedAt"];
  if (mode === "v3") assertNoV3Schema(value);
  else assertSchemaField(value, mode);
  if (!hasExactKeys(value, expected)) return invalidResponse();
  if (value.kind !== "node" && value.kind !== "item") return invalidResponse();
  if (typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)) return invalidResponse();
  if (value.kind === "item" && value.recordType !== "training_attempt" && value.recordType !== "review_queue_entry") return invalidResponse();
  if (value.kind === "node" && (value.recordType === "training_attempt" || value.recordType === "review_queue_entry")) return invalidResponse();
  if (!isBoundedString(value.trackId, 1, 128) || !isBoundedString(value.targetId, 1, 256) || !isFiniteNonNegativeInteger(value.version)
    || !isSha256(value.fingerprint) || !isBoundedString(value.lastMutationId, 16, 128) || !isIsoDate(value.updatedAt)) return invalidResponse();
  assertState(value.state, mode);
  return true;
}

function validateGuestMergeRecord(value: unknown, mode: CodecMode): value is GuestMergeRecordDto | GuestMergeRecordV4Dto {
  if (!isPlainRecord(value)) return invalidResponse();
  const expected = mode === "v4"
    ? ["fingerprint", "recordId", "recordType", "state", "trackId", "version", "contentIdentitySchema"]
    : ["fingerprint", "recordId", "recordType", "state", "trackId", "version"];
  if (mode === "v3") assertNoV3Schema(value);
  else assertSchemaField(value, mode);
  if (!hasExactKeys(value, expected)) return invalidResponse();
  if (!isSha256(value.fingerprint) || !isBoundedString(value.recordId, 1, 256) || typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)
    || !isBoundedString(value.trackId, 1, 128) || !isFiniteNonNegativeInteger(value.version)) return invalidResponse();
  assertState(value.state, mode);
  return true;
}

function validateMutation(value: unknown, mode: CodecMode): value is ProgressMutationDto | ProgressMutationV4Dto {
  if (!isPlainRecord(value)) return invalidResponse();
  const expected = mode === "v4"
    ? ["mutationId", "kind", "recordType", "trackId", "targetId", "expectedVersion", "fingerprint", "state", "contentIdentitySchema"]
    : ["mutationId", "kind", "recordType", "trackId", "targetId", "expectedVersion", "fingerprint", "state"];
  if (mode === "v3") assertNoV3Schema(value);
  else assertSchemaField(value, mode);
  if (!hasExactKeys(value, expected)) return invalidResponse();
  if (!isMutationId(value.mutationId) || (value.kind !== "node" && value.kind !== "item")
    || typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)
    || (value.kind === "item" && value.recordType !== "training_attempt" && value.recordType !== "review_queue_entry")
    || (value.kind === "node" && (value.recordType === "training_attempt" || value.recordType === "review_queue_entry"))
    || !isBoundedString(value.trackId, 1, 128) || !isBoundedString(value.targetId, 1, 256)
    || !(value.expectedVersion === null || isFiniteNonNegativeInteger(value.expectedVersion)) || !isSha256(value.fingerprint)) return invalidResponse();
  assertState(value.state, mode);
  return true;
}

function validateSyncRequest(value: unknown, mode: CodecMode): value is SyncRequestDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  if (mode === "v4") assertSchemaField(value, mode);
  if (mode === "v3" && value.protocolVersion === 4) return contentIdentitySchemaConflict();
  if (mode === "v4" && !hasExactKeys(value, ["protocolVersion", "canonicalVersion", "contentIdentitySchema", "expectedAccountRevision", "deviceId", "sessionId", "batchId", "planVersion", "highWatermark", "mutations"])) return invalidResponse();
  if (mode === "v3" && value.protocolVersion === 2 && !hasOneOfExactKeys(value, [["protocolVersion", "expectedAccountRevision", "mutations"], ["protocolVersion", "expectedAccountRevision", "deviceId", "mutations"]])) return invalidResponse();
  if (mode === "v3" && value.protocolVersion !== 2 && !hasExactKeys(value, ["protocolVersion", "canonicalVersion", "expectedAccountRevision", "deviceId", "sessionId", "batchId", "planVersion", "highWatermark", "mutations"])) return invalidResponse();
  if (mode === "v4" && value.protocolVersion !== 4) return invalidResponse();
  if (mode === "v3" && value.protocolVersion !== 2 && value.protocolVersion !== 3) return invalidResponse();
  if (mode === "v3" && value.protocolVersion === 3 && (value.canonicalVersion !== "canonical-json-v1" || value.planVersion !== 3)) return invalidResponse();
  if (mode === "v4" && (value.canonicalVersion !== "canonical-json-v1" || value.planVersion !== 4)) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.expectedAccountRevision) || !Array.isArray(value.mutations) || value.mutations.length < 1 || value.mutations.length > 100) return invalidResponse();
  if (value.protocolVersion === 2 && value.deviceId !== undefined && value.deviceId !== null && !isUuid(value.deviceId)) return invalidResponse();
  if (value.protocolVersion !== 2 && (!isUuid(value.deviceId) || !isBoundedString(value.sessionId, 1, 128) || !isBoundedString(value.batchId, 1, 128) || !isFiniteNonNegativeInteger(value.highWatermark))) return invalidResponse();
  value.mutations.forEach((mutation) => validateMutation(mutation, mode));
  let serialized: string;
  try { serialized = canonicalJson({ schema: "canonical-json-v1", payload: value }); } catch { return invalidResponse(); }
  if (utf8ByteLength(serialized) > MAX_SYNC_ENVELOPE_UTF8_BYTES) return invalidResponse();
  return true;
}

function parseProgressPage(value: unknown, mode: CodecMode): ProgressResponseDto | ProgressResponseV4Dto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  const expected = ["accountRevision", "generation", "records", "nextPageToken"];
  if (!hasExactKeys(value, expected)) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.accountRevision) || !isFiniteNonNegativeInteger(value.generation) || !Array.isArray(value.records) || value.records.length > 100) return invalidResponse();
  if (!(value.nextPageToken === null || (typeof value.nextPageToken === "string" && value.nextPageToken.length > 0))) return invalidResponse();
  value.records.forEach((record) => validateProgressRecord(record, mode));
  return value as ProgressResponseDto | ProgressResponseV4Dto;
}

function parseSyncConflict(value: unknown, mode: CodecMode): SyncConflictDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  if (!hasExactKeys(value, ["mutationId", "code", "current"]) || !isMutationId(value.mutationId) || typeof value.code !== "string" || !CONFLICT_CODES.has(value.code) || !(value.current === null || isPlainRecord(value.current))) return invalidResponse();
  if (value.current === null) return value as SyncConflictDto;
  const currentHasSchema = isPlainRecord(value.current) && Object.prototype.hasOwnProperty.call(value.current, "contentIdentitySchema");
  if (mode === "v3" && currentHasSchema) return contentIdentitySchemaConflict();
  if (mode === "v4" && value.code === "version_conflict" && !currentHasSchema) return contentIdentitySchemaConflict();
  validateProgressRecord(value.current, currentHasSchema ? "v4" : "v3");
  return value as SyncConflictDto;
}

function parseSyncResponse(value: unknown, mode: CodecMode): SyncResponseDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  if (!hasOneOfExactKeys(value, [["accountRevision", "applied", "duplicates", "conflicts"], ["accountRevision", "applied", "duplicates", "conflicts", "accountRevisionConflict"]])) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.accountRevision) || !Array.isArray(value.applied) || value.applied.length > 100
    || !Array.isArray(value.duplicates) || value.duplicates.length > 100 || !Array.isArray(value.conflicts) || value.conflicts.length > 100) return invalidResponse();
  value.applied.forEach((record) => validateProgressRecord(record, mode));
  if (!value.duplicates.every(isMutationId)) return invalidResponse();
  value.conflicts.forEach((conflict) => parseSyncConflict(conflict, mode));
  if (value.accountRevisionConflict !== undefined && value.accountRevisionConflict !== null) {
    if (!isPlainRecord(value.accountRevisionConflict) || !hasExactKeys(value.accountRevisionConflict, ["code", "currentAccountRevision"])
      || value.accountRevisionConflict.code !== "account_revision_conflict" || !isFiniteNonNegativeInteger(value.accountRevisionConflict.currentAccountRevision)) return invalidResponse();
  }
  return value as SyncResponseDto;
}

function validateGuestSnapshot(value: unknown, mode: CodecMode): value is GuestMergeSnapshotRequestDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  else assertSchemaField(value, mode);
  const expected = mode === "v4"
    ? ["protocolVersion", "contentIdentitySchema", "guestSnapshotVersion", "guestUserId", "records", "activeSession", "pendingJournal"]
    : ["protocolVersion", "guestSnapshotVersion", "guestUserId", "records", "activeSession", "pendingJournal"];
  if (!hasExactKeys(value, expected)) return invalidResponse();
  if (mode === "v4" && value.protocolVersion !== 4) return contentIdentitySchemaConflict();
  if (mode === "v3" && value.protocolVersion !== 1 && value.protocolVersion !== 2) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.guestSnapshotVersion) || !isUuid(value.guestUserId) || !Array.isArray(value.records) || value.records.length > 1000
    || typeof value.activeSession !== "boolean" || typeof value.pendingJournal !== "boolean") return invalidResponse();
  value.records.forEach((record) => {
    validateGuestMergeRecord(record, mode);
    if (value.protocolVersion === 1 && (!isPlainRecord(record) || typeof record.recordType !== "string" || !LEGACY_PROGRESS_RECORD_TYPES.has(record.recordType))) return invalidResponse();
  });
  return true;
}

function validatePreview(value: unknown, mode: CodecMode): value is GuestMergePreviewDto | GuestMergePreviewV4Dto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  else assertSchemaField(value, mode);
  const expected = mode === "v4"
    ? ["accountSnapshotVersion", "accountUserId", "conflicts", "fingerprint", "guestSnapshotVersion", "guestUserId", "operationId", "protocolVersion", "contentIdentitySchema", "goalPlanConflictGroups"]
    : value.protocolVersion === 1
      ? ["accountSnapshotVersion", "accountUserId", "conflicts", "fingerprint", "guestSnapshotVersion", "guestUserId", "operationId", "protocolVersion"]
      : ["accountSnapshotVersion", "accountUserId", "conflicts", "fingerprint", "guestSnapshotVersion", "guestUserId", "operationId", "protocolVersion", "goalPlanConflictGroups"];
  if (!hasExactKeys(value, expected)) return invalidResponse();
  if (mode === "v4" && value.protocolVersion !== 4) return contentIdentitySchemaConflict();
  if (mode === "v3" && value.protocolVersion !== 1 && value.protocolVersion !== 2) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.accountSnapshotVersion) || !isUuid(value.accountUserId) || !Array.isArray(value.conflicts) || value.conflicts.length > 1000
    || !isSha256(value.fingerprint) || !isFiniteNonNegativeInteger(value.guestSnapshotVersion) || !isUuid(value.guestUserId) || !isUuid(value.operationId)
    || value.accountUserId === value.guestUserId) return invalidResponse();
  value.conflicts.forEach((conflict) => {
    if (!isPlainRecord(conflict) || !hasExactKeys(conflict, ["accountVersion", "conflictId", "guestVersion", "recordId", "recordType"])
      || !isFiniteNonNegativeInteger(conflict.accountVersion) || !isBoundedString(conflict.conflictId, 1, 768) || !isFiniteNonNegativeInteger(conflict.guestVersion)
      || !isBoundedString(conflict.recordId, 1, 256) || typeof conflict.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(conflict.recordType)) return invalidResponse();
  });
  if (value.protocolVersion !== 1) {
    if (!Array.isArray(value.goalPlanConflictGroups) || value.goalPlanConflictGroups.length > 1000) return invalidResponse();
    value.goalPlanConflictGroups.forEach((group) => {
      if (!isPlainRecord(group) || !hasExactKeys(group, ["groupId", "trackId", "localRecordIds", "accountRecordIds"])
        || !/^track:.+$/u.test(String(group.groupId)) || !isBoundedString(group.groupId, 1, 192) || !isBoundedString(group.trackId, 1, 128)
        || !assertStringArray(group.localRecordIds, 2) || !assertStringArray(group.accountRecordIds, 2)) return invalidResponse();
    });
  }
  return true;
}

function parseAdoptionPreviewResponse(value: unknown, mode: CodecMode): AdoptionPreviewResponseDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  if (!hasExactKeys(value, ["preview", "plan", "remoteRecords"])) return invalidResponse();
  validatePreview(value.preview, mode);
  if (!isPlainRecord(value.plan) || !hasExactKeys(value.plan, ["caseId", "localRecordCount", "remoteRecordCount", "uploadRecordIds", "restoreRecordIds", "deduplicatedRecordIds", "conflictRecordIds", "blockingReason"])) return invalidResponse();
  if (typeof value.plan.caseId !== "string" || !ADOPTION_CASES.has(value.plan.caseId) || !isFiniteNonNegativeInteger(value.plan.localRecordCount) || !isFiniteNonNegativeInteger(value.plan.remoteRecordCount)
    || !assertStringArray(value.plan.uploadRecordIds, 1000) || !assertStringArray(value.plan.restoreRecordIds, 1000) || !assertStringArray(value.plan.deduplicatedRecordIds, 1000)
    || !assertStringArray(value.plan.conflictRecordIds, 1000) || !(value.plan.blockingReason === null || (typeof value.plan.blockingReason === "string" && BLOCKING_REASONS.has(value.plan.blockingReason)))) return invalidResponse();
  if (!Array.isArray(value.remoteRecords) || value.remoteRecords.length > 1000) return invalidResponse();
  value.remoteRecords.forEach((record) => validateGuestMergeRecord(record, mode));
  const preview = isPlainRecord(value.preview) && value.preview.protocolVersion === 1
    ? { ...value.preview, goalPlanConflictGroups: [] }
    : value.preview;
  return { ...value, preview } as AdoptionPreviewResponseDto;
}

function validateAdoptionConfirmation(value: unknown, mode: CodecMode): value is AdoptionConfirmationDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  else assertSchemaField(value, mode);
  const expected = mode === "v4"
    ? ["operationId", "previewFingerprint", "protocolVersion", "contentIdentitySchema", "resolutions", "groupChoices"]
    : value.protocolVersion === 1
      ? ["operationId", "previewFingerprint", "protocolVersion", "resolutions"]
      : ["operationId", "previewFingerprint", "protocolVersion", "resolutions", "groupChoices"];
  if (!hasExactKeys(value, expected)) return invalidResponse();
  if (mode === "v4" && value.protocolVersion !== 4) return contentIdentitySchemaConflict();
  if (mode === "v3" && (value.protocolVersion !== 1 && value.protocolVersion !== 2)) return invalidResponse();
  if (!isUuid(value.operationId) || !isSha256(value.previewFingerprint) || !Array.isArray(value.resolutions) || value.resolutions.length > 1000) return invalidResponse();
  value.resolutions.forEach((resolution) => {
    if (!isPlainRecord(resolution) || !hasExactKeys(resolution, ["conflictId", "resolution"]) || !isBoundedString(resolution.conflictId, 1, 768)
      || !["keep_guest", "keep_account", "manual_required"].includes(String(resolution.resolution))) return invalidResponse();
  });
  if (value.protocolVersion !== 1) {
    if (!Array.isArray(value.groupChoices) || value.groupChoices.length > 1000) return invalidResponse();
    value.groupChoices.forEach((choice) => {
      if (!isPlainRecord(choice) || !hasExactKeys(choice, ["groupId", "resolution"]) || !/^track:.+$/u.test(String(choice.groupId)) || !isBoundedString(choice.groupId, 1, 192)
        || !["keep_guest", "keep_account"].includes(String(choice.resolution))) return invalidResponse();
    });
  }
  return true;
}

function parseAdoptionExecutionResponse(value: unknown, mode: CodecMode): AdoptionExecutionResponseDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (mode === "v3") assertNoV3Schema(value);
  if (!hasExactKeys(value, ["accountRevision", "operationId", "mutationIds", "records"]) || !isFiniteNonNegativeInteger(value.accountRevision) || !isUuid(value.operationId)
    || !Array.isArray(value.mutationIds) || !value.mutationIds.every((id) => isBoundedString(id, 1, 128)) || !Array.isArray(value.records) || value.records.length > 1000) return invalidResponse();
  value.records.forEach((record) => validateGuestMergeRecord(record, mode));
  return value as AdoptionExecutionResponseDto;
}

export type ProgressMutationDto = Readonly<{
  mutationId: string;
  kind: "node" | "item";
  recordType: "active_track" | "training_session_summary" | "training_session_result" | "training_attempt" | "review_queue_entry" | "goal" | "learning_plan";
  trackId: string;
  targetId: string;
  expectedVersion: number | null;
  fingerprint: string;
  state: Readonly<Record<string, unknown>>;
}>;

export type ProgressMutationV4Dto = Readonly<ProgressMutationDto & {
  contentIdentitySchema: ContentIdentitySchemaDto;
}>;

export type SyncRequestV2Dto = Readonly<{
  protocolVersion: 2;
  expectedAccountRevision: number;
  deviceId?: string | null;
  mutations: readonly ProgressMutationDto[];
}>;

export type SyncRequestV3Dto = Readonly<{
  protocolVersion: 3;
  canonicalVersion: "canonical-json-v1";
  expectedAccountRevision: number;
  deviceId: string;
  sessionId: string;
  batchId: string;
  planVersion: 3;
  highWatermark: number;
  mutations: readonly ProgressMutationDto[];
}>;

export type SyncRequestV4Dto = Readonly<{
  protocolVersion: 4;
  canonicalVersion: "canonical-json-v1";
  contentIdentitySchema: ContentIdentitySchemaDto;
  expectedAccountRevision: number;
  deviceId: string;
  sessionId: string;
  batchId: string;
  planVersion: 4;
  highWatermark: number;
  mutations: readonly ProgressMutationV4Dto[];
}>;

export type SyncRequestDto = SyncRequestV2Dto | SyncRequestV3Dto | SyncRequestV4Dto;

export type ProgressRecordDto = Readonly<{
  kind: "node" | "item";
  recordType: ProgressMutationDto["recordType"];
  trackId: string;
  targetId: string;
  version: number;
  fingerprint: string;
  state: Readonly<Record<string, unknown>>;
  lastMutationId: string;
  updatedAt: string;
  contentIdentitySchema?: ContentIdentitySchemaDto;
}>;

export type ProgressRecordV4Dto = Readonly<Omit<ProgressRecordDto, "contentIdentitySchema"> & {
  contentIdentitySchema: ContentIdentitySchemaDto;
}>;

export type MeResponseDto = Readonly<{ user: Readonly<{ id: string; createdAt: string; acceptedTermsVersion: string | null; identity: Readonly<{ provider: string; subject: string; email: string | null; emailVerified: boolean }> }> }>;
export type RecoveryCodesResponseDto = Readonly<{ generationId: string; codes: readonly string[] }>;
export type AccountDeletionResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type PublicDeletionProofResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type DeletionOperationStatusDto = Readonly<{ status: "pending" | "remote_deleted" | "complete"; operationId: string; proofId: string | null }>;
export type EntitlementsResponseDto = Readonly<{ entitlements: readonly Readonly<{ entitlement: string; status: string; source: string; expiresAt: string | null; updatedAt: string }>[] }>;
export type ProgressResponseDto = Readonly<{ accountRevision: number; records: readonly ProgressRecordDto[]; nextPageToken?: string | null; generation?: number }>;
export type ProgressResponseV4Dto = Readonly<{ accountRevision: number; records: readonly ProgressRecordV4Dto[]; nextPageToken?: string | null; generation?: number }>;
export type AccountDataExportDto = Readonly<{
  schemaVersion: "account-data-export-v1";
  exportId: string;
  exportedAt: string;
  scope: Readonly<{ portable: "user_data_and_activity"; accountContext: "user_visible_account_context" }>;
  article15Information: Readonly<{ purposes: readonly string[]; dataCategories: readonly string[]; recipientCategories: readonly string[]; retentionCriteria: readonly string[]; dataSources: readonly string[]; internationalTransfers: string; automatedDecisionMaking: string; rightsAndComplaint: string }>;
  portable: Readonly<{
    profile: Readonly<{ createdAt: string; identity: Readonly<{ provider: string; email: string | null; emailVerified: boolean }> }>;
    progress: readonly ProgressRecordDto[];
    linkedContentReports: readonly Readonly<Record<string, unknown>>[];
  }>;
  accountContext: Readonly<{
    trackAccess: readonly Readonly<Record<string, unknown>>[];
    entitlements: readonly Readonly<Record<string, unknown>>[];
    legalAcceptances: readonly Readonly<Record<string, unknown>>[];
    purchaseConfirmations: readonly Readonly<Record<string, unknown>>[];
    devices: readonly Readonly<Record<string, unknown>>[];
    syncMetadata: Readonly<Record<string, unknown>>;
    exportHistory: readonly Readonly<Record<string, unknown>>[];
  }>;
  manifest: Readonly<{
    included: readonly string[];
    omitted: readonly Readonly<{ category: string; reason: string }>[];
  }>;
}>;
export type PrivacyRequestRightDto = "access" | "rectification" | "erasure" | "restriction" | "objection" | "portability" | "consent_withdrawal";
export type PrivacyRequestStatusDto = "received" | "identity_verification_required" | "in_review" | "response_ready" | "fulfilled" | "partially_fulfilled" | "refused" | "closed";
export type PrivacyRequestListItemDto = Readonly<{ requestId: string; right: PrivacyRequestRightDto; channel: "account" | "public"; status: PrivacyRequestStatusDto; outcome: "fulfilled" | "partially_fulfilled" | "refused" | null; receivedAt: string; deadlineAt: string; deliveredAt: string | null; extendedAt: string | null; revision: number }>;
export type PrivacyRequestResponseDto = Readonly<{ request: PrivacyRequestListItemDto; response: string | null; responseAvailableUntil: string | null; extensionReason: string | null; complaintInformationIncluded: boolean }>;
export type LegalRequestKindDto = "complaint" | "withdrawal" | "data_recovery" | "suspension_appeal";
export type LegalRequestStatusDto = "received" | "in_review" | "answered" | "closed";
export type LegalRequestDto = Readonly<{ requestId: string; kind: LegalRequestKindDto; status: LegalRequestStatusDto; receivedAt: string; responseDueAt: string | null; answeredAt: string | null; retentionUntil: string | null; response: string | null }>;
export type SyncConflictDto = Readonly<{ mutationId: string; code: "version_conflict" | "content_identity_schema_conflict"; current: ProgressRecordDto | null }>;
export type SyncResponseDto = Readonly<{ accountRevision: number; applied: readonly ProgressRecordDto[]; duplicates: readonly string[]; conflicts: readonly SyncConflictDto[]; accountRevisionConflict?: Readonly<{ code: "account_revision_conflict"; currentAccountRevision: number }> }>;
export type GuestMergeRecordDto = Readonly<{ fingerprint: string; recordId: string; recordType: ProgressMutationDto["recordType"]; state: Readonly<Record<string, unknown>>; trackId: string; version: number; contentIdentitySchema?: ContentIdentitySchemaDto }>;
export type GuestMergeRecordV4Dto = Readonly<Omit<GuestMergeRecordDto, "contentIdentitySchema"> & { contentIdentitySchema: ContentIdentitySchemaDto }>;
export type GuestMergeSnapshotDto = Readonly<{ protocolVersion: 1 | 2; guestSnapshotVersion: number; guestUserId: string; records: readonly GuestMergeRecordDto[]; activeSession: boolean; pendingJournal: boolean }>;
export type GuestMergeSnapshotV4Dto = Readonly<{ protocolVersion: 4; contentIdentitySchema: ContentIdentitySchemaDto; guestSnapshotVersion: number; guestUserId: string; records: readonly GuestMergeRecordV4Dto[]; activeSession: boolean; pendingJournal: boolean }>;
export type GuestMergeSnapshotRequestDto = GuestMergeSnapshotDto | GuestMergeSnapshotV4Dto;
export type GoalPlanConflictGroupDto = Readonly<{ groupId: string; trackId: string; localRecordIds: readonly string[]; accountRecordIds: readonly string[] }>;
export type GuestMergePreviewDto = Readonly<{ accountSnapshotVersion: number; accountUserId: string; conflicts: readonly Readonly<{ accountVersion: number; conflictId: string; guestVersion: number; recordId: string; recordType: GuestMergeRecordDto["recordType"] }>[]; fingerprint: string; guestSnapshotVersion: number; guestUserId: string; operationId: string; protocolVersion: 1 | 2; goalPlanConflictGroups: readonly GoalPlanConflictGroupDto[] }>;
export type GuestMergePreviewV4Dto = Readonly<Omit<GuestMergePreviewDto, "protocolVersion"> & { protocolVersion: 4; contentIdentitySchema: ContentIdentitySchemaDto }>;
export type AdoptionPlanDto = Readonly<{ caseId: "emptyLocalEmptyRemote" | "populatedLocalEmptyRemote" | "emptyLocalPopulatedRemote" | "populatedLocalPopulatedRemote" | "divergentRecord" | "blocked"; localRecordCount: number; remoteRecordCount: number; uploadRecordIds: readonly string[]; restoreRecordIds: readonly string[]; deduplicatedRecordIds: readonly string[]; conflictRecordIds: readonly string[]; blockingReason: "active_session" | "journal_recovery" | null }>;
export type AdoptionPreviewResponseDto = Readonly<{ preview: GuestMergePreviewDto | GuestMergePreviewV4Dto; plan: AdoptionPlanDto; remoteRecords: readonly GuestMergeRecordDto[] }>;
export type AdoptionPreviewV4ResponseDto = Readonly<{ preview: GuestMergePreviewV4Dto; plan: AdoptionPlanDto; remoteRecords: readonly GuestMergeRecordV4Dto[] }>;
export type AdoptionConfirmationDto =
  | Readonly<{ operationId: string; previewFingerprint: string; protocolVersion: 1; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" | "manual_required" }>[] }>
  | Readonly<{ operationId: string; previewFingerprint: string; protocolVersion: 2; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" | "manual_required" }>[]; groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[] }>
  | Readonly<{ operationId: string; previewFingerprint: string; protocolVersion: 4; contentIdentitySchema: ContentIdentitySchemaDto; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" | "manual_required" }>[]; groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[] }>;
export type AdoptionPreviewDto = AdoptionPreviewResponseDto;
export type AdoptionExecutionResponseDto = Readonly<{ accountRevision: number; operationId: string; mutationIds: readonly string[]; records: readonly GuestMergeRecordDto[] }>;
export type TracksResponseDto = Readonly<{ tracks: readonly Readonly<{ trackId: string; source: string; status: string; updatedAt: string }>[] }>;
export type ContentVersionsResponseDto = Readonly<{ versions: readonly Readonly<{ trackId: string; version: string; checksumSha256: string; packageUri: string; publishedAt: string }>[] }>;
export type ContentReportReasonDto = "incorrect_answer" | "unclear_explanation" | "outdated_content" | "technical_issue" | "other";
export type ContentReportContextDto = Readonly<{ releasePackageId: string; trackNode: string | null; modeRoute: "practice_feedback_details" | "answer_review"; locale: "en" | "pl"; appBuild: string; platform: "ios" | "android"; occurredAt: string }>;
export type ContentReportStatusDto = "open" | "in_review" | "resolved" | "closed";
export type CreateContentReportDto = Readonly<{ clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto; linkAccount?: boolean; contactEmail?: string }>;
export type ContentReportDto = Readonly<{ id: string; clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto; linkage: "unlinked" | "account" | "contact" | "account_and_contact"; status: ContentReportStatusDto; createdAt: string; updatedAt: string }>;
export type CreateContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type AdminContentReportsResponseDto = Readonly<{ reports: readonly ContentReportDto[] }>;
export type TransitionContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type HealthResponseDto = Readonly<{ status: "ok"; service: "patternly-backend" }>;
export type ReadyResponseDto = Readonly<{ status: "ready" | "not_ready"; checks: Readonly<{ database: boolean; authentication: boolean }> }>;
export type OpenApiResponseDto = Readonly<{ openapi: string; paths: Readonly<Record<string, unknown>> }>;

export type PatternlyApiClientErrorCode = "client_unconfigured" | "authentication_required" | "transport_failed" | "invalid_response" | "server_error" | "request_timeout";
export type AccountRegistrationInputDto = Readonly<{
  termsVersion: string;
  termsLocale: "en" | "pl";
  privacyPolicyVersion: string;
  privacyPolicyLocale: "en" | "pl";
  privacyPolicyAcknowledged: true;
}>;
export type AccountRegistrationResponseDto = Readonly<{ registration: Readonly<{ created: boolean; user: MeResponseDto["user"]; acceptance: Readonly<{ termsVersion: string; acceptedAt: string }> | null }> }>;

export class PatternlyApiClientError extends Error {
  public constructor(readonly code: PatternlyApiClientErrorCode, readonly status?: number, readonly serverCode?: string, readonly retryAfterSeconds?: number) {
    super(code);
    this.name = "PatternlyApiClientError";
  }
}

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type PatternlyApiClient = Readonly<{
  availability: "available";
  /** Explicitly selected by bootstrap after committed_v2; defaults to pre-marker v3. */
  accountDataProtocolMode?: AccountDataProtocolMode;
  getHealth: () => Promise<HealthResponseDto>;
  getReady: () => Promise<ReadyResponseDto>;
  getOpenApi: () => Promise<OpenApiResponseDto>;
  getMe: () => Promise<MeResponseDto>;
  registerAccount: (input: AccountRegistrationInputDto) => Promise<AccountRegistrationResponseDto>;
  recordLegalAcceptance: (termsVersion: string) => Promise<Readonly<{ acceptance: Readonly<{ termsVersion: string; acceptedAt: string }> }>>;
  recordPurchaseConfirmation: (input: Readonly<{ confirmationId: string; termsVersion: string; productIdentifier: string; storefrontPrice: string; locale: "en" | "pl"; immediateStartRequested: true }>) => Promise<Readonly<{ confirmation: Readonly<{ confirmationId: string; acceptedAt: string }> }>>;
  getEntitlements: () => Promise<EntitlementsResponseDto>;
  getProgress: () => Promise<ProgressResponseDto>;
  exportAccountData: () => Promise<AccountDataExportDto>;
  createPrivacyRequest: (right: PrivacyRequestRightDto, narrative?: string) => Promise<Readonly<{ request: PrivacyRequestListItemDto }>>;
  getPrivacyRequests: () => Promise<Readonly<{ requests: readonly PrivacyRequestListItemDto[] }>>;
  getPrivacyRequest: (requestId: string) => Promise<PrivacyRequestResponseDto>;
  createLegalRequest: (input: Readonly<{ kind: LegalRequestKindDto; narrative?: string; transactionId?: string }>) => Promise<Readonly<{ request: LegalRequestDto }>>;
  createPublicLegalRequest: (input: Readonly<{ email: string; kind: LegalRequestKindDto; narrative?: string; transactionId?: string }>, appCheckToken: string) => Promise<Readonly<{ request: LegalRequestDto }>>;
  getLegalRequests: () => Promise<Readonly<{ requests: readonly LegalRequestDto[] }>>;
  getLegalRequest: (requestId: string) => Promise<Readonly<{ request: LegalRequestDto }>>;
  syncProgress: (input: SyncRequestDto) => Promise<SyncResponseDto>;
  previewAccountAdoption: (input: GuestMergeSnapshotRequestDto) => Promise<AdoptionPreviewResponseDto>;
  confirmAccountAdoption: (input: Readonly<{ deviceId: string; snapshot: GuestMergeSnapshotRequestDto; confirmation: AdoptionConfirmationDto }>) => Promise<AdoptionExecutionResponseDto>;
  issueRecoveryCodes: () => Promise<RecoveryCodesResponseDto>;
  consumeRecoveryCode: (code: string) => Promise<Readonly<{ customToken: string }>>;
  revokeSessions: (operationId: string) => Promise<Readonly<{ status: "revoked"; operationId: string }>>;
  deleteAccount: (operationId: string, operationSecret: string) => Promise<AccountDeletionResponseDto>;
  getDeletionProof: (proofId: string) => Promise<PublicDeletionProofResponseDto>;
  getDeletionOperationStatus: (operationId: string, operationSecret: string) => Promise<DeletionOperationStatusDto>;
  getTracks: () => Promise<TracksResponseDto>;
  getContentVersions: () => Promise<ContentVersionsResponseDto>;
  createContentReport: (input: CreateContentReportDto, appCheckToken: string) => Promise<CreateContentReportResponseDto>;
  getAdminContentReports: () => Promise<AdminContentReportsResponseDto>;
  transitionAdminContentReport: (clientSubmissionId: string, status: ContentReportStatusDto) => Promise<TransitionContentReportResponseDto>;
}>;

export function createPatternlyApiClient(input: Readonly<{
  apiOrigin: string;
  allowLocalHttpForSimulator?: boolean;
  getIdToken: () => Promise<string | null>;
  fetchImplementation?: FetchImplementation;
  timeoutMs?: number;
  /** Defaults to v3 while the local committed_v2 marker is absent. */
  accountDataProtocolMode?: AccountDataProtocolModeInput;
  /** Explicit dependency hook for the later bootstrap cutover. */
  getAccountDataProtocolMode?: () => AccountDataProtocolModeInput;
}>): PatternlyApiClient {
  const origin = new URL(input.apiOrigin);
  const localSimulatorOrigin = input.allowLocalHttpForSimulator === true
    && origin.protocol === "http:"
    && origin.hostname === developmentLoopbackHost
    && origin.pathname === "/"
    && origin.search === ""
    && origin.hash === "";
  if (origin.protocol !== "https:" && !localSimulatorOrigin) throw new PatternlyApiClientError("client_unconfigured");
  const fetchImplementation = input.fetchImplementation ?? fetch;
  const timeoutMs = input.timeoutMs ?? 10_000;
  const configuredProtocolMode = normalizeAccountDataProtocolMode(input.accountDataProtocolMode);
  const accountDataProtocolMode = normalizeAccountDataProtocolMode(input.getAccountDataProtocolMode?.() ?? input.accountDataProtocolMode);

  function selectedProtocolMode(): AccountDataProtocolMode {
    // A resolver is sampled once at client construction.  This keeps one
    // client instance from switching wire formats halfway through a retry.
    return input.getAccountDataProtocolMode ? accountDataProtocolMode : configuredProtocolMode;
  }

  type AuthenticationMode = "none" | "optional" | "required";
  async function requestJson<T>(path: string, method: "GET" | "POST" | "PATCH", body?: unknown, authentication: AuthenticationMode = "required", extraHeaders: Readonly<Record<string, string>> = {}): Promise<T> {
    const url = new URL(path, origin);
    const publicPath = path === "/health" || path === "/ready" || path === "/openapi.json";
    if (url.origin !== origin.origin || (!path.startsWith("/v1/") && !publicPath)) throw new PatternlyApiClientError("client_unconfigured");
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        controller.abort();
        reject(new PatternlyApiClientError("request_timeout"));
      }, timeoutMs);
    });
    const withinDeadline = <TValue>(promise: Promise<TValue>): Promise<TValue> => Promise.race([promise, timedOut]);
    try {
      let token: string | null;
      try {
        token = authentication === "none" ? null : await withinDeadline(input.getIdToken());
      } catch (error) {
        if (error instanceof PatternlyApiClientError) throw error;
        if (error instanceof Error && error.name === "AbortError") throw new PatternlyApiClientError("request_timeout");
        throw error;
      }
      if (authentication === "required" && !token) throw new PatternlyApiClientError("authentication_required");
      let response: Response;
      try {
        response = await withinDeadline(fetchImplementation(url, {
          method,
          signal: controller.signal,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          headers: { ...extraHeaders, ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
        }));
      } catch (error) {
        if (error instanceof PatternlyApiClientError) throw error;
        if (error instanceof Error && error.name === "AbortError") throw new PatternlyApiClientError("request_timeout");
        throw new PatternlyApiClientError("transport_failed");
      }
      let payload: unknown;
      try {
        payload = await withinDeadline(response.json());
      } catch (error) {
        if (error instanceof PatternlyApiClientError) throw error;
        if (error instanceof Error && error.name === "AbortError") throw new PatternlyApiClientError("request_timeout");
        if (response.status >= 500) throw new PatternlyApiClientError("server_error", response.status);
        throw new PatternlyApiClientError("invalid_response", response.status);
      }
      if (!response.ok) {
        const serverCode = isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string"
          ? payload.error.code
          : isRecord(payload) && Array.isArray(payload.conflicts) && isRecord(payload.conflicts[0]) && typeof payload.conflicts[0].code === "string"
            ? payload.conflicts[0].code
            : undefined;
        const retryAfterHeader = response.headers.get("retry-after");
        const parsedRetryAfter = retryAfterHeader !== null && /^[1-9][0-9]*$/u.test(retryAfterHeader)
          ? Number.parseInt(retryAfterHeader, 10)
          : undefined;
        const retryAfterSeconds = parsedRetryAfter !== undefined && Number.isSafeInteger(parsedRetryAfter)
          ? parsedRetryAfter
          : undefined;
        throw new PatternlyApiClientError("server_error", response.status, serverCode, retryAfterSeconds);
      }
      return payload as T;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  return Object.freeze({
    availability: "available" as const,
    accountDataProtocolMode: selectedProtocolMode(),
    getHealth: () => requestJson<HealthResponseDto>("/health", "GET", undefined, "none"),
    getReady: () => requestJson<ReadyResponseDto>("/ready", "GET", undefined, "none"),
    getOpenApi: () => requestJson<OpenApiResponseDto>("/openapi.json", "GET", undefined, "none"),
    getMe: () => requestJson<MeResponseDto>("/v1/me", "GET"),
    registerAccount: (body) => requestJson<AccountRegistrationResponseDto>("/v1/account/registration", "POST", body),
    recordLegalAcceptance: (termsVersion) => requestJson("/v1/legal-acceptances", "POST", { termsVersion, minimumAgeConfirmed: 18 }),
    recordPurchaseConfirmation: (body) => requestJson("/v1/purchase-confirmations", "POST", body),
    getEntitlements: () => requestJson<EntitlementsResponseDto>("/v1/entitlements", "GET"),
    getProgress: async () => {
      const protocolMode = selectedProtocolMode();
      const readProtocolVersion = protocolMode === "v4" ? 4 : 2;
      const records: ProgressRecordDto[] = [];
      let pageToken: string | null = null;
      let accountRevision: number | null = null;
      let generation: number | undefined;
      for (let page = 0; page < 1_001; page += 1) {
        const query: string = pageToken === null
          ? `/v1/progress?protocolVersion=${readProtocolVersion}&pageSize=100`
          : `/v1/progress?protocolVersion=${readProtocolVersion}&pageSize=100&pageToken=${encodeURIComponent(pageToken)}`;
        const response = parseProgressPage(await requestJson<unknown>(query, "GET"), protocolMode);
        if (accountRevision === null) {
          accountRevision = response.accountRevision;
          generation = response.generation;
        } else if (response.accountRevision !== accountRevision || response.generation !== generation) {
          throw new PatternlyApiClientError("server_error", 409, "progress_generation_conflict");
        }
        records.push(...response.records);
        pageToken = response.nextPageToken ?? null;
        if (pageToken === null) return { accountRevision: accountRevision ?? 0, records: Object.freeze(records), generation, nextPageToken: null };
      }
      throw new PatternlyApiClientError("invalid_response");
    },
    exportAccountData: () => requestJson<AccountDataExportDto>("/v1/account-data/export", "GET"),
    createPrivacyRequest: async (right, narrative) => parsePrivacyRequestEnvelope(await requestJson<unknown>("/v1/privacy-requests", "POST", { right, ...(narrative === undefined ? {} : { narrative }) })),
    getPrivacyRequests: async () => parsePrivacyRequestList(await requestJson<unknown>("/v1/privacy-requests", "GET")),
    getPrivacyRequest: async (requestId) => parsePrivacyRequestResponse(await requestJson<unknown>(`/v1/privacy-requests/${encodeURIComponent(requestId)}`, "GET")),
    createLegalRequest: async (body) => parseLegalRequestEnvelope(await requestJson<unknown>("/v1/legal-requests", "POST", body)),
    createPublicLegalRequest: async (body, appCheckToken) => parseLegalRequestEnvelope(await requestJson<unknown>("/v1/public/legal-requests", "POST", body, "optional", { "x-firebase-appcheck": appCheckToken })),
    getLegalRequests: async () => parseLegalRequestList(await requestJson<unknown>("/v1/legal-requests", "GET")),
    getLegalRequest: async (requestId) => parseLegalRequestEnvelope(await requestJson<unknown>(`/v1/legal-requests/${encodeURIComponent(requestId)}`, "GET")),
    syncProgress: async (body: SyncRequestDto) => {
      const protocolMode = selectedProtocolMode();
      validateSyncRequest(body, protocolMode);
      const response = await requestJson<unknown>("/v1/progress/sync", "POST", body);
      return parseSyncResponse(response, protocolMode);
    },
    previewAccountAdoption: async (body: GuestMergeSnapshotRequestDto) => {
      const protocolMode = selectedProtocolMode();
      validateGuestSnapshot(body, protocolMode);
      const response = await requestJson<unknown>("/v1/account-data/adoption/preview", "POST", body);
      return parseAdoptionPreviewResponse(response, protocolMode);
    },
    confirmAccountAdoption: async (body: Readonly<{ deviceId: string; snapshot: GuestMergeSnapshotRequestDto; confirmation: AdoptionConfirmationDto }>) => {
      const protocolMode = selectedProtocolMode();
      if (!hasExactKeys(body, ["deviceId", "snapshot", "confirmation"]) || !isUuid(body.deviceId)) return invalidResponse();
      if (protocolMode === "v3") assertNoV3Schema(body);
      validateGuestSnapshot(body.snapshot, protocolMode);
      validateAdoptionConfirmation(body.confirmation, protocolMode);
      const response = await requestJson<unknown>("/v1/account-data/adoption/confirm", "POST", body);
      return parseAdoptionExecutionResponse(response, protocolMode);
    },
    issueRecoveryCodes: () => requestJson<RecoveryCodesResponseDto>("/v1/account/recovery-codes", "POST", {}),
    consumeRecoveryCode: (code) => requestJson<Readonly<{ customToken: string }>>("/v1/public/recovery-codes/consume", "POST", { code }, "none"),
    revokeSessions: (operationId) => requestJson<Readonly<{ status: "revoked"; operationId: string }>>("/v1/account/session/revoke", "POST", { operationId }),
    deleteAccount: (operationId, operationSecret) => requestJson<AccountDeletionResponseDto>("/v1/account/deletion", "POST", { operationId, operationSecret }),
    getDeletionProof: (proofId) => requestJson<PublicDeletionProofResponseDto>(`/v1/public/deletion-proofs/${proofId}`, "GET", undefined, "none"),
    getDeletionOperationStatus: (operationId, operationSecret) => requestJson<DeletionOperationStatusDto>("/v1/public/deletion-operations/status", "POST", { operationId, operationSecret }, "none"),
    getTracks: () => requestJson<TracksResponseDto>("/v1/tracks", "GET"),
    getContentVersions: () => requestJson<ContentVersionsResponseDto>("/v1/content/versions", "GET"),
    createContentReport: (body, appCheckToken) => requestJson<CreateContentReportResponseDto>("/v1/content/reports", "POST", body, "optional", { "x-firebase-appcheck": appCheckToken }),
    getAdminContentReports: () => requestJson<AdminContentReportsResponseDto>("/v1/admin/content-reports", "GET"),
    transitionAdminContentReport: (clientSubmissionId, status) => requestJson<TransitionContentReportResponseDto>(`/v1/admin/content-reports/${clientSubmissionId}`, "PATCH", { status }),
  });
}

export function createFirebaseEmulatorIdTokenProvider(input: Readonly<{
  authEmulatorOrigin: string;
  email: string;
  password: string;
}>): () => Promise<string | null> {
  let cachedToken: string | null = null;
  return async () => {
    if (cachedToken) return cachedToken;
    const origin = new URL(input.authEmulatorOrigin);
    if (origin.protocol !== "http:" || origin.hostname !== developmentLoopbackHost) throw new PatternlyApiClientError("client_unconfigured");
    let response: Response;
    try {
      response = await fetch(`${origin.origin}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=patternly-ios-simulator`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: input.email, password: input.password, returnSecureToken: true }),
      });
    } catch {
      throw new PatternlyApiClientError("transport_failed");
    }
    if (!response.ok) throw new PatternlyApiClientError("authentication_required", response.status);
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new PatternlyApiClientError("invalid_response", response.status); }
    if (!isRecord(payload) || typeof payload.idToken !== "string") throw new PatternlyApiClientError("authentication_required", response.status);
    cachedToken = payload.idToken;
    return cachedToken;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const privacyRights = new Set<PrivacyRequestRightDto>(["access", "rectification", "erasure", "restriction", "objection", "portability", "consent_withdrawal"]);
const privacyStatuses = new Set<PrivacyRequestStatusDto>(["received", "identity_verification_required", "in_review", "response_ready", "fulfilled", "partially_fulfilled", "refused", "closed"]);
const privacyOutcomes = new Set(["fulfilled", "partially_fulfilled", "refused"]);

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/u.test(value)) return false;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) && Date.parse(new Date(timestamp).toISOString()) === timestamp;
}

function isPrivacyRequestListItem(value: unknown): value is PrivacyRequestListItemDto {
  return isRecord(value)
    && typeof value.requestId === "string" && value.requestId.length > 0
    && typeof value.right === "string" && privacyRights.has(value.right as PrivacyRequestRightDto)
    && (value.channel === "account" || value.channel === "public")
    && typeof value.status === "string" && privacyStatuses.has(value.status as PrivacyRequestStatusDto)
    && (value.outcome === null || (typeof value.outcome === "string" && privacyOutcomes.has(value.outcome)))
    && isIsoDate(value.receivedAt) && isIsoDate(value.deadlineAt)
    && (value.deliveredAt === null || isIsoDate(value.deliveredAt))
    && (value.extendedAt === null || isIsoDate(value.extendedAt))
    && Number.isSafeInteger(value.revision) && Number(value.revision) >= 0;
}

function invalidPrivacyResponse(): never {
  throw new PatternlyApiClientError("invalid_response");
}

function parsePrivacyRequestEnvelope(value: unknown): Readonly<{ request: PrivacyRequestListItemDto }> {
  if (!isRecord(value) || !isPrivacyRequestListItem(value.request)) return invalidPrivacyResponse();
  return { request: value.request };
}

function parsePrivacyRequestList(value: unknown): Readonly<{ requests: readonly PrivacyRequestListItemDto[] }> {
  if (!isRecord(value) || !Array.isArray(value.requests) || !value.requests.every(isPrivacyRequestListItem)) return invalidPrivacyResponse();
  return { requests: value.requests };
}

function parsePrivacyRequestResponse(value: unknown): PrivacyRequestResponseDto {
  if (!isRecord(value) || !isPrivacyRequestListItem(value.request)
    || (value.response !== null && typeof value.response !== "string")
    || (value.responseAvailableUntil !== null && !isIsoDate(value.responseAvailableUntil))
    || (value.extensionReason !== null && typeof value.extensionReason !== "string")
    || typeof value.complaintInformationIncluded !== "boolean") return invalidPrivacyResponse();
  return value as PrivacyRequestResponseDto;
}

const legalRequestKinds = new Set<LegalRequestKindDto>(["complaint", "withdrawal", "data_recovery", "suspension_appeal"]);
const legalRequestStatuses = new Set<LegalRequestStatusDto>(["received", "in_review", "answered", "closed"]);

function isLegalRequest(value: unknown): value is LegalRequestDto {
  return isRecord(value)
    && typeof value.requestId === "string" && value.requestId.length > 0
    && typeof value.kind === "string" && legalRequestKinds.has(value.kind as LegalRequestKindDto)
    && typeof value.status === "string" && legalRequestStatuses.has(value.status as LegalRequestStatusDto)
    && isIsoDate(value.receivedAt)
    && (value.responseDueAt === null || isIsoDate(value.responseDueAt))
    && (value.answeredAt === null || isIsoDate(value.answeredAt))
    && (value.retentionUntil === null || isIsoDate(value.retentionUntil))
    && (value.response === null || typeof value.response === "string");
}

function parseLegalRequestEnvelope(value: unknown): Readonly<{ request: LegalRequestDto }> {
  if (!isRecord(value) || !isLegalRequest(value.request)) throw new PatternlyApiClientError("invalid_response");
  return { request: value.request };
}

function parseLegalRequestList(value: unknown): Readonly<{ requests: readonly LegalRequestDto[] }> {
  if (!isRecord(value) || !Array.isArray(value.requests) || !value.requests.every(isLegalRequest)) throw new PatternlyApiClientError("invalid_response");
  return { requests: value.requests };
}
