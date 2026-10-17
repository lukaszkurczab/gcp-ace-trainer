import { parseContentPackageDescriptor } from "./contentPackageDescriptor";
import { isAccountWireState } from "../../domain/account/accountWireState";
import { normalizeLegacyTerminalSessionRead } from "../../domain/account/terminalSessionWire";
/**
 * Synchronized with patternly-backend/openapi/patternly-v1.json.
 * Backend CI verifies that every versioned API path is represented here.
 */

import { developmentLoopbackHost } from "../developmentEndpoints";
import { getPatternlyAppCheckToken } from "./patternlyAppCheckToken";
import { isContentIdentityResolution, isContentIdentityTombstone, isResolvedContentRef } from "../../domain";

const MAX_SERIALIZED_JSON_UTF16_CODE_UNITS = 128 * 1024;
const MAX_SYNC_ENVELOPE_UTF8_BYTES = 512 * 1024;
const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const MUTATION_ID_PATTERN = /^[A-Za-z0-9_-]{16,128}$/u;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const RECOVERY_CODE_PATTERN = /^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/u;
const DELETION_PROOF_ID_PATTERN = /^proof_[A-Za-z0-9_-]{20,128}$/u;
const RECOVERY_OPERATION_PROGRESS_STATUSES = new Set(["in_progress", "acknowledged", "delivery_unconfirmed", "superseded", "expired_or_invalid", "provider_retryable"]);
const PROGRESS_RECORD_TYPES = new Set(["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry", "goal", "learning_plan"]);
const ADOPTION_CASES = new Set(["emptyLocalEmptyRemote", "populatedLocalEmptyRemote", "emptyLocalPopulatedRemote", "populatedLocalPopulatedRemote", "divergentRecord", "blocked"]);
const BLOCKING_REASONS = new Set(["active_session", "journal_recovery"]);
const SYNC_CONFLICT_CODES = new Set(["version_conflict", "content_identity_schema_conflict", "mutation_id_reuse", "progress_generation_conflict", "authorization_generation_conflict"]);

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

function isFinitePositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isBoundedString(value: unknown, min: number, max: number): value is string {
  return typeof value === "string" && value.length >= min && value.length <= max;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
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

function isDeletionProofId(value: unknown): value is string {
  return typeof value === "string" && DELETION_PROOF_ID_PATTERN.test(value);
}

function isEmailAddress(value: unknown): value is string {
  if (typeof value !== "string" || value.length === 0 || value.trim() !== value) return false;
  const [local, domain, extra] = value.split("@");
  if (!local || !domain || extra !== undefined || local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/u.test(local)) return false;
  const labels = domain.split(".");
  return labels.length >= 2 && labels.every((label) => /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/u.test(label));
}

function isAccountDateTime(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?([Zz]|([+-])(\d{2}):(\d{2}))$/u.exec(value);
  if (!match || !Number.isFinite(Date.parse(value))) return false;
  const [, year, month, day, hour, minute, second, , , offsetHour, offsetMinute] = match;
  if (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59) return false;
  if (offsetHour !== undefined && (Number(offsetHour) > 23 || Number(offsetMinute) > 59)) return false;
  const calendarDate = new Date(0);
  calendarDate.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  return calendarDate.getUTCFullYear() === Number(year)
    && calendarDate.getUTCMonth() + 1 === Number(month)
    && calendarDate.getUTCDate() === Number(day);
}

function isDeletionOperationSecret(value: unknown): value is string {
  return typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
}

function assertCanonicalIdentityState(value: unknown): void {
  const seen = new Set<unknown>();
  const visit = (candidate: unknown): void => {
    if (candidate === null || typeof candidate !== "object") return;
    if (seen.has(candidate)) return invalidResponse();
    seen.add(candidate);
    if (Array.isArray(candidate)) { candidate.forEach(visit); return; }
    if (!isPlainRecord(candidate)) return invalidResponse();
    const keys = Object.keys(candidate);
    if (keys.some((key) => key === "protocolVersion" || key === "contentIdentitySchema" || key === "packagePin" || key === "contentPackagePin" || key === "migrationVersion" || key === "legacyIdentityDigest")) return contentIdentitySchemaConflict();
    if (candidate.kind === "resolved" || candidate.kind === "tombstone") {
      if (!isContentIdentityResolution(candidate)) return contentIdentitySchemaConflict();
      return;
    }
    if (isResolvedContentRef(candidate) || isContentIdentityTombstone(candidate)) return;
    if (keys.includes("questionId") && (keys.includes("contentVersion") || keys.includes("artifactSha256"))) return contentIdentitySchemaConflict();
    Object.values(candidate).forEach(visit);
  };
  visit(value);
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

function validateState(value: unknown): StateValidation {
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
  try { assertCanonicalIdentityState(value); } catch { return "schema"; }
  return "ok";
}

function assertState(value: unknown): void {
  const result = validateState(value);
  if (result === "schema") return contentIdentitySchemaConflict();
  if (result === "invalid") return invalidResponse();
}

function assertStringArray(value: unknown, max: number): value is string[] {
  return Array.isArray(value) && value.length <= max && value.every(isNonEmptyString);
}

function validateProgressRecordEnvelope(value: unknown): asserts value is ProgressRecordDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["kind", "recordType", "trackId", "targetId", "version", "fingerprint", "state", "lastMutationId", "updatedAt"])) return invalidResponse();
  if (value.kind !== "node" && value.kind !== "item") return invalidResponse();
  if (typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)) return invalidResponse();
  if (value.kind === "item" && value.recordType !== "training_attempt" && value.recordType !== "review_queue_entry") return invalidResponse();
  if (value.kind === "node" && (value.recordType === "training_attempt" || value.recordType === "review_queue_entry")) return invalidResponse();
  if (!isNonEmptyString(value.trackId) || !isNonEmptyString(value.targetId) || !isFiniteNonNegativeInteger(value.version)
    || !isSha256(value.fingerprint) || !isBoundedString(value.lastMutationId, 16, 128) || !isIsoDate(value.updatedAt)) return invalidResponse();
  assertState(value.state);
}

export function validateProgressRecord(value: unknown): value is ProgressRecordDto {
  validateProgressRecordEnvelope(value);
  if (!isAccountWireState(value.recordType, value.targetId, value.trackId, value.state)) return invalidResponse();
  return true;
}

function validateGuestMergeRecord(value: unknown): value is GuestMergeRecordDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["fingerprint", "recordId", "recordType", "state", "trackId", "version"])) return invalidResponse();
  if (!isSha256(value.fingerprint) || !isNonEmptyString(value.recordId) || typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)
    || !isNonEmptyString(value.trackId) || !isFiniteNonNegativeInteger(value.version)) return invalidResponse();
  assertState(value.state);
  if (!isAccountWireState(value.recordType, value.recordId, value.trackId, value.state)) return invalidResponse();
  return true;
}

function validateMutation(value: unknown): value is ProgressMutationDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["mutationId", "kind", "recordType", "trackId", "targetId", "expectedVersion", "fingerprint", "state"])) return invalidResponse();
  if (!isMutationId(value.mutationId) || (value.kind !== "node" && value.kind !== "item")
    || typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)
    || (value.kind === "item" && value.recordType !== "training_attempt" && value.recordType !== "review_queue_entry")
    || (value.kind === "node" && (value.recordType === "training_attempt" || value.recordType === "review_queue_entry"))
    || !isNonEmptyString(value.trackId) || !isNonEmptyString(value.targetId)
    || !(value.expectedVersion === null || isFiniteNonNegativeInteger(value.expectedVersion)) || !isSha256(value.fingerprint)) return invalidResponse();
  assertState(value.state);
  if (!isAccountWireState(value.recordType, value.targetId, value.trackId, value.state)) return invalidResponse();
  return true;
}

function validateSyncRequest(value: unknown): value is SyncRequestDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["canonicalVersion", "expectedAccountRevision", "deviceId", "sessionId", "batchId", "highWatermark", "mutations"]) || value.canonicalVersion !== "canonical-json-v1") return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.expectedAccountRevision) || !isUuid(value.deviceId) || !isBoundedString(value.sessionId, 1, 128) || !isBoundedString(value.batchId, 1, 128) || !isFiniteNonNegativeInteger(value.highWatermark) || !Array.isArray(value.mutations) || value.mutations.length < 1 || value.mutations.length > 100) return invalidResponse();
  value.mutations.forEach((mutation) => validateMutation(mutation));
  let serialized: string;
  try { serialized = canonicalJson({ schema: "canonical-json-v1", payload: value }); } catch { return invalidResponse(); }
  if (utf8ByteLength(serialized) > MAX_SYNC_ENVELOPE_UTF8_BYTES) return invalidResponse();
  return true;
}

function parseProgressPage(value: unknown): ProgressResponseDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["accountRevision", "generation", "records", "nextPageToken"])) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.accountRevision) || !isFiniteNonNegativeInteger(value.generation) || !Array.isArray(value.records) || value.records.length > 100) return invalidResponse();
  if (!(value.nextPageToken === null || (typeof value.nextPageToken === "string" && value.nextPageToken.length > 0))) return invalidResponse();
  const records = value.records.map((record) => {
    validateProgressRecordEnvelope(record);
    let normalized: ProgressRecordDto;
    try { normalized = normalizeLegacyTerminalSessionRead(record); } catch { return invalidResponse(); }
    validateProgressRecord(normalized);
    return normalized;
  });
  return { accountRevision: value.accountRevision as number, generation: value.generation as number,
    nextPageToken: value.nextPageToken as string | null, records };
}

/** Sync conflicts are errors. Resolution reads fresh progress rather than a stale record in the rejection. */
function parseSyncConflictError(value: unknown): Readonly<{ code: string; details?: SyncConflictDetails }> {
  if (!hasExactKeys(value, ["error"]) || !isPlainRecord(value.error)) return invalidResponse();
  const error = value.error;
  if (error.code === "account_revision_conflict") {
    if (!hasExactKeys(error, ["code", "currentAccountRevision"]) || !isFiniteNonNegativeInteger(error.currentAccountRevision)) return invalidResponse();
    return { code: error.code, details: { currentAccountRevision: error.currentAccountRevision } };
  }
  if (typeof error.code !== "string" || !SYNC_CONFLICT_CODES.has(error.code)) return invalidResponse();
  if (error.code === "content_identity_schema_conflict" && hasExactKeys(error, ["code", "issues"])) {
    if (!Array.isArray(error.issues) || !error.issues.every((issue) => typeof issue === "string")) return invalidResponse();
    return { code: error.code, details: { issues: Object.freeze(error.issues.slice()) } };
  }
  if (!hasExactKeys(error, ["code"])) return invalidResponse();
  return { code: error.code };
}

function parseSyncResponse(value: unknown): SyncResponseDto {
  if (!hasExactKeys(value, ["accountRevision", "applied", "duplicates", "conflicts"])) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.accountRevision) || !Array.isArray(value.applied) || value.applied.length > 100
    || !Array.isArray(value.duplicates) || value.duplicates.length > 100 || !Array.isArray(value.conflicts) || value.conflicts.length !== 0) return invalidResponse();
  value.applied.forEach((record) => validateProgressRecord(record));
  if (!value.duplicates.every(isMutationId)) return invalidResponse();
  return value as SyncResponseDto;
}

function validateGuestSnapshot(value: unknown): value is GuestMergeSnapshotRequestDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["guestSnapshotVersion", "guestUserId", "records", "activeSession", "pendingJournal"])) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.guestSnapshotVersion) || !isUuid(value.guestUserId) || !Array.isArray(value.records) || value.records.length > 1000 || typeof value.activeSession !== "boolean" || typeof value.pendingJournal !== "boolean") return invalidResponse();
  value.records.forEach((record) => validateGuestMergeRecord(record));
  return true;
}

function validatePreview(value: unknown): value is GuestMergePreviewDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["accountSnapshotVersion", "accountUserId", "conflicts", "fingerprint", "guestSnapshotVersion", "guestUserId", "operationId", "goalPlanConflictGroups"])) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.accountSnapshotVersion) || !isUuid(value.accountUserId) || !Array.isArray(value.conflicts) || value.conflicts.length > 1000
    || !isSha256(value.fingerprint) || !isFiniteNonNegativeInteger(value.guestSnapshotVersion) || !isUuid(value.guestUserId) || !isUuid(value.operationId)
    || value.accountUserId === value.guestUserId) return invalidResponse();
  value.conflicts.forEach((conflict) => {
    if (!isPlainRecord(conflict) || !hasExactKeys(conflict, ["accountVersion", "conflictId", "guestVersion", "recordId", "recordType"]) || !isFiniteNonNegativeInteger(conflict.accountVersion) || !isNonEmptyString(conflict.conflictId) || !isFiniteNonNegativeInteger(conflict.guestVersion) || !isNonEmptyString(conflict.recordId) || typeof conflict.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(conflict.recordType)) return invalidResponse();
  });
  if (!Array.isArray(value.goalPlanConflictGroups) || value.goalPlanConflictGroups.length > 1000) return invalidResponse();
  value.goalPlanConflictGroups.forEach((group) => {
    if (!isPlainRecord(group) || !hasExactKeys(group, ["groupId", "trackId", "localRecordIds", "accountRecordIds"]) || !/^track:.+$/u.test(String(group.groupId)) || !isNonEmptyString(group.trackId) || !assertStringArray(group.localRecordIds, 2) || !assertStringArray(group.accountRecordIds, 2)) return invalidResponse();
  });
  return true;
}

function parseAdoptionPreviewResponse(value: unknown): AdoptionPreviewResponseDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["preview", "plan", "remoteRecords"])) return invalidResponse();
  validatePreview(value.preview);
  if (!isPlainRecord(value.plan) || !hasExactKeys(value.plan, ["caseId", "localRecordCount", "remoteRecordCount", "uploadRecordIds", "restoreRecordIds", "deduplicatedRecordIds", "conflictRecordIds", "blockingReason"])) return invalidResponse();
  if (typeof value.plan.caseId !== "string" || !ADOPTION_CASES.has(value.plan.caseId) || !isFiniteNonNegativeInteger(value.plan.localRecordCount) || !isFiniteNonNegativeInteger(value.plan.remoteRecordCount) || !assertStringArray(value.plan.uploadRecordIds, 1000) || !assertStringArray(value.plan.restoreRecordIds, 1000) || !assertStringArray(value.plan.deduplicatedRecordIds, 1000) || !assertStringArray(value.plan.conflictRecordIds, 1000) || !(value.plan.blockingReason === null || (typeof value.plan.blockingReason === "string" && BLOCKING_REASONS.has(value.plan.blockingReason)))) return invalidResponse();
  if (!Array.isArray(value.remoteRecords) || value.remoteRecords.length > 1000) return invalidResponse();
  value.remoteRecords.forEach((record) => validateGuestMergeRecord(record));
  return value as AdoptionPreviewResponseDto;
}

function validateAdoptionConfirmation(value: unknown): value is AdoptionConfirmationDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["operationId", "previewFingerprint", "resolutions", "groupChoices"]) || !isUuid(value.operationId) || !isSha256(value.previewFingerprint) || !Array.isArray(value.resolutions) || value.resolutions.length > 1000 || !Array.isArray(value.groupChoices) || value.groupChoices.length > 1000) return invalidResponse();
  value.resolutions.forEach((resolution) => {
    if (!isPlainRecord(resolution) || !hasExactKeys(resolution, ["conflictId", "resolution"]) || !isNonEmptyString(resolution.conflictId) || !["keep_guest", "keep_account", "manual_required"].includes(String(resolution.resolution))) return invalidResponse();
  });
  value.groupChoices.forEach((choice) => {
    if (!isPlainRecord(choice) || !hasExactKeys(choice, ["groupId", "resolution"]) || !/^track:.+$/u.test(String(choice.groupId)) || !["keep_guest", "keep_account"].includes(String(choice.resolution))) return invalidResponse();
  });
  return true;
}

function parseAdoptionExecutionResponse(value: unknown): AdoptionExecutionResponseDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["accountRevision", "operationId", "mutationIds", "records"]) || !isFiniteNonNegativeInteger(value.accountRevision) || !isUuid(value.operationId) || !Array.isArray(value.mutationIds) || !value.mutationIds.every((id) => isBoundedString(id, 1, 128)) || !Array.isArray(value.records) || value.records.length > 1000) return invalidResponse();
  value.records.forEach((record) => validateGuestMergeRecord(record));
  return value as AdoptionExecutionResponseDto;
}

export type RecoveryOperationStatusDto = "in_progress" | "result_available" | "acknowledged" | "delivery_unconfirmed" | "superseded" | "expired_or_invalid" | "provider_retryable";
export type RecoveryOperationProgressDto = Readonly<{
  operationId: string;
  status: Exclude<RecoveryOperationStatusDto, "result_available">;
  authorizationGeneration?: number;
}>;
export type RecoveryCodeIssueResultDto = RecoveryOperationProgressDto | Readonly<{
  operationId: string;
  status: "result_available";
  generationId: string;
  authorizationGeneration: number;
  codes: readonly string[];
}>;
export type RecoveryConsumeResultDto = RecoveryOperationProgressDto | Readonly<{
  operationId: string;
  status: "result_available";
  firebaseUid: string;
  authorizationGeneration: number;
  customToken: string;
}>;
export type RecoveryOperationAcknowledgementDto = Readonly<{
  operationId: string;
  status: "acknowledged";
  authorizationGeneration: number;
}>;

function parseRecoveryOperationProgress(value: unknown, expectedOperationId: string): RecoveryOperationProgressDto {
  if (!isPlainRecord(value)
    || !hasOneOfExactKeys(value, [["operationId", "status"], ["operationId", "status", "authorizationGeneration"]])
    || value.operationId !== expectedOperationId || !isUuid(value.operationId)
    || typeof value.status !== "string" || !RECOVERY_OPERATION_PROGRESS_STATUSES.has(value.status)
    || (value.authorizationGeneration !== undefined && !isFinitePositiveInteger(value.authorizationGeneration))) return invalidResponse();
  return Object.freeze({
    operationId: value.operationId,
    status: value.status as RecoveryOperationProgressDto["status"],
    ...(value.authorizationGeneration === undefined ? {} : { authorizationGeneration: value.authorizationGeneration }),
  });
}

function parseRecoveryCodeIssueResult(value: unknown, expectedOperationId: string): RecoveryCodeIssueResultDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (value.status !== "result_available") return parseRecoveryOperationProgress(value, expectedOperationId);
  if (!hasExactKeys(value, ["operationId", "status", "generationId", "authorizationGeneration", "codes"])
    || value.operationId !== expectedOperationId || !isUuid(value.operationId)
    || !isNonEmptyString(value.generationId) || !isFinitePositiveInteger(value.authorizationGeneration)
    || !Array.isArray(value.codes) || value.codes.length !== 10 || !value.codes.every((code) => typeof code === "string" && RECOVERY_CODE_PATTERN.test(code))) return invalidResponse();
  return Object.freeze({
    operationId: value.operationId,
    status: "result_available",
    generationId: value.generationId,
    authorizationGeneration: value.authorizationGeneration,
    codes: Object.freeze([...value.codes]),
  });
}

function parseRecoveryConsumeResult(value: unknown, expectedOperationId: string): RecoveryConsumeResultDto {
  if (!isPlainRecord(value)) return invalidResponse();
  if (value.status !== "result_available") return parseRecoveryOperationProgress(value, expectedOperationId);
  if (!hasExactKeys(value, ["operationId", "status", "firebaseUid", "authorizationGeneration", "customToken"])
    || value.operationId !== expectedOperationId || !isUuid(value.operationId)
    || !isNonEmptyString(value.firebaseUid) || !isFinitePositiveInteger(value.authorizationGeneration)
    || !isNonEmptyString(value.customToken)) return invalidResponse();
  return Object.freeze({
    operationId: value.operationId,
    status: "result_available",
    firebaseUid: value.firebaseUid,
    authorizationGeneration: value.authorizationGeneration,
    customToken: value.customToken,
  });
}

function parseRecoveryOperationAcknowledgement(value: unknown, expectedOperationId: string): RecoveryOperationAcknowledgementDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["operationId", "status", "authorizationGeneration"])
    || value.operationId !== expectedOperationId || !isUuid(value.operationId)
    || value.status !== "acknowledged" || !isFinitePositiveInteger(value.authorizationGeneration)) return invalidResponse();
  return Object.freeze({ operationId: value.operationId, status: "acknowledged", authorizationGeneration: value.authorizationGeneration });
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

export type SyncRequestDto = Readonly<{
  canonicalVersion: "canonical-json-v1";
  expectedAccountRevision: number;
  deviceId: string;
  sessionId: string;
  batchId: string;
  highWatermark: number;
  mutations: readonly ProgressMutationDto[];
}>;

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
}>;

export type MeResponseDto = Readonly<{ user: Readonly<{ id: string; createdAt: string; acceptedTermsVersion: string | null; identity: Readonly<{ provider: string; subject: string; email: string | null; emailVerified: boolean }> }> }>;
export type AccountDeletionResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type PublicDeletionProofResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type DeletionOperationStatusDto = Readonly<{ status: "pending" | "remote_deleted" | "complete"; operationId: string; proofId: string | null }>;
export type PremiumSourceDto = Readonly<{
  platform: "ios" | "android";
  store: "APP_STORE" | "PLAY_STORE";
  appId: string;
  rcProductId: string;
  storeProductId: string;
  basePlanId: string | null;
  state: "active" | "grace" | "hold" | "paused" | "expired" | "refunded";
  reason: null | "paused" | "account_hold";
  managementURL: string | null;
  providerExpiresAt: string | null;
  providerGraceExpiresAt: string | null;
}>;
export type EntitlementsResponseDto = Readonly<{
  serverObservedAt: string;
  entitlements: readonly Readonly<{
    accountId: string;
    entitlement: string;
    productId: string;
    state: "active" | "grace" | "hold" | "expired" | "refunded";
    source: "revenuecat";
    mapVersion: string;
    projectId: string;
    environment: "SANDBOX" | "PRODUCTION";
    reason: null | "paused" | "identity_conflict" | "promotional";
    sources: readonly PremiumSourceDto[];
    providerExpiresAt: string | null;
    providerGraceExpiresAt: string | null;
    providerObservedAt: string;
  }>[];
}>;
export type ProgressResponseDto = Readonly<{ accountRevision: number; records: readonly ProgressRecordDto[]; nextPageToken?: string | null; generation?: number }>;
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
    purchaseHistory?: readonly Readonly<Record<string, unknown>>[];
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
export type SyncConflictDetails = Readonly<{ currentAccountRevision?: number; issues?: readonly string[] }>;
export type SyncResponseDto = Readonly<{ accountRevision: number; applied: readonly ProgressRecordDto[]; duplicates: readonly string[]; conflicts: readonly never[] }>;
export type GuestMergeRecordDto = Readonly<{ fingerprint: string; recordId: string; recordType: ProgressMutationDto["recordType"]; state: Readonly<Record<string, unknown>>; trackId: string; version: number }>;
export type GuestMergeSnapshotRequestDto = Readonly<{ guestSnapshotVersion: number; guestUserId: string; records: readonly GuestMergeRecordDto[]; activeSession: boolean; pendingJournal: boolean }>;
export type GoalPlanConflictGroupDto = Readonly<{ groupId: string; trackId: string; localRecordIds: readonly string[]; accountRecordIds: readonly string[] }>;
export type GuestMergePreviewDto = Readonly<{ accountSnapshotVersion: number; accountUserId: string; conflicts: readonly Readonly<{ accountVersion: number; conflictId: string; guestVersion: number; recordId: string; recordType: GuestMergeRecordDto["recordType"] }>[]; fingerprint: string; guestSnapshotVersion: number; guestUserId: string; operationId: string; goalPlanConflictGroups: readonly GoalPlanConflictGroupDto[] }>;
export type AdoptionPlanDto = Readonly<{ caseId: "emptyLocalEmptyRemote" | "populatedLocalEmptyRemote" | "emptyLocalPopulatedRemote" | "populatedLocalPopulatedRemote" | "divergentRecord" | "blocked"; localRecordCount: number; remoteRecordCount: number; uploadRecordIds: readonly string[]; restoreRecordIds: readonly string[]; deduplicatedRecordIds: readonly string[]; conflictRecordIds: readonly string[]; blockingReason: "active_session" | "journal_recovery" | null }>;
export type AdoptionPreviewResponseDto = Readonly<{ preview: GuestMergePreviewDto; plan: AdoptionPlanDto; remoteRecords: readonly GuestMergeRecordDto[] }>;
export type AdoptionConfirmationDto = Readonly<{ operationId: string; previewFingerprint: string; resolutions: readonly Readonly<{ conflictId: string; resolution: "keep_guest" | "keep_account" | "manual_required" }>[]; groupChoices: readonly Readonly<{ groupId: string; resolution: "keep_guest" | "keep_account" }>[] }>;
export type AdoptionExecutionResponseDto = Readonly<{ accountRevision: number; operationId: string; mutationIds: readonly string[]; records: readonly GuestMergeRecordDto[] }>;
export type TracksResponseDto = Readonly<{ tracks: readonly Readonly<{ trackId: string; source: string; status: string; updatedAt: string }>[] }>;
export type ContentVersionsResponseDto = Readonly<{ versions: readonly Readonly<{ trackId: string; version: string; checksumSha256: string; packageUri: string; publishedAt: string }>[] }>;
export type ContentReportReasonDto = "incorrect_answer" | "unclear_explanation" | "outdated_content" | "technical_issue" | "other";
export type ContentReportContextDto = Readonly<{ releasePackageId: string; trackNode: string | null; modeRoute: "practice_feedback_details" | "answer_review"; locale: "en" | "pl"; appBuild: string; platform: "ios" | "android"; occurredAt: string }>;
export type ContentReportStatusDto = "open" | "in_review" | "resolved" | "closed";
export type CreateContentReportDto = Readonly<{ clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto }>;
export type ContentReportDto = Readonly<{ id: string; clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto; linkage: "unlinked" | "account" | "contact" | "account_and_contact"; status: ContentReportStatusDto; createdAt: string; updatedAt: string }>;
export type CreateContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type AdminContentReportsResponseDto = Readonly<{ reports: readonly ContentReportDto[] }>;
export type TransitionContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type HealthResponseDto = Readonly<{ status: "ok"; service: "patternly-backend" }>;
export type ReadyResponseDto = Readonly<{ status: "ready" | "not_ready"; checks: Readonly<{ database: boolean; authentication: boolean; providerReader: boolean; contentPackages: boolean }> }>;
export type OpenApiResponseDto = Readonly<{ openapi: string; paths: Readonly<Record<string, unknown>> }>;

export type PatternlyApiClientErrorCode = "profile_changed" | "client_unconfigured" | "authentication_required" | "app_check_unavailable" | "transport_failed" | "invalid_response" | "server_error" | "request_timeout";
export type AccountRegistrationInputDto = Readonly<{
  termsVersion: string;
  termsLocale: "en" | "pl";
  privacyPolicyVersion: string;
  privacyPolicyLocale: "en" | "pl";
  privacyPolicyAcknowledged: true;
}>;
export type AccountRegistrationAcceptanceDto = AccountRegistrationInputDto & Readonly<{ acceptedAt: string }>;
export type AccountRegistrationResponseDto = Readonly<{ registration: Readonly<{ created: boolean; user: MeResponseDto["user"]; acceptance: AccountRegistrationAcceptanceDto | null }> }>;

function parseAccountRegistrationResponse(value: unknown): AccountRegistrationResponseDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["registration"]) || !isPlainRecord(value.registration)
    || !hasExactKeys(value.registration, ["created", "user", "acceptance"])) return invalidResponse();
  const registration = value.registration;
  if (typeof registration.created !== "boolean" || !isPlainRecord(registration.user)
    || !hasExactKeys(registration.user, ["id", "createdAt", "acceptedTermsVersion", "identity"])) return invalidResponse();
  const user = registration.user;
  if (!isNonEmptyString(user.id) || !isNonEmptyString(user.createdAt)
    || !(user.acceptedTermsVersion === null || isNonEmptyString(user.acceptedTermsVersion))
    || !isPlainRecord(user.identity) || !hasExactKeys(user.identity, ["provider", "subject", "email", "emailVerified"])
    || !isNonEmptyString(user.identity.provider) || !isNonEmptyString(user.identity.subject)
    || !(user.identity.email === null || typeof user.identity.email === "string")
    || typeof user.identity.emailVerified !== "boolean") return invalidResponse();

  let acceptance: AccountRegistrationAcceptanceDto | null = null;
  if (registration.acceptance !== null) {
    const candidate = registration.acceptance;
    if (!isPlainRecord(candidate) || !hasExactKeys(candidate, ["termsVersion", "termsLocale", "privacyPolicyVersion", "privacyPolicyLocale", "privacyPolicyAcknowledged", "acceptedAt"])
      || !isNonEmptyString(candidate.termsVersion) || (candidate.termsLocale !== "en" && candidate.termsLocale !== "pl")
      || !isNonEmptyString(candidate.privacyPolicyVersion) || (candidate.privacyPolicyLocale !== "en" && candidate.privacyPolicyLocale !== "pl")
      || candidate.privacyPolicyAcknowledged !== true || !isNonEmptyString(candidate.acceptedAt)) return invalidResponse();
    acceptance = Object.freeze({
      termsVersion: candidate.termsVersion,
      termsLocale: candidate.termsLocale,
      privacyPolicyVersion: candidate.privacyPolicyVersion,
      privacyPolicyLocale: candidate.privacyPolicyLocale,
      privacyPolicyAcknowledged: true,
      acceptedAt: candidate.acceptedAt,
    });
  }
  if (registration.created !== (acceptance !== null)) return invalidResponse();
  return Object.freeze({
    registration: Object.freeze({
      created: registration.created,
      user: Object.freeze({
        id: user.id,
        createdAt: user.createdAt,
        acceptedTermsVersion: user.acceptedTermsVersion,
        identity: Object.freeze({
          provider: user.identity.provider,
          subject: user.identity.subject,
          email: user.identity.email,
          emailVerified: user.identity.emailVerified,
        }),
      }),
      acceptance,
    }),
  });
}

function parseMeResponse(value: unknown): MeResponseDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["user"]) || !isPlainRecord(value.user)
    || !hasExactKeys(value.user, ["id", "createdAt", "acceptedTermsVersion", "identity"])) return invalidResponse();
  const user = value.user;
  const identity = user.identity;
  if (!isUuid(user.id) || !isAccountDateTime(user.createdAt)
    || !(user.acceptedTermsVersion === null || typeof user.acceptedTermsVersion === "string")
    || !isPlainRecord(identity) || !hasExactKeys(identity, ["provider", "subject", "email", "emailVerified"])
    || !isNonEmptyString(identity.provider) || !isNonEmptyString(identity.subject)
    || !(identity.email === null || isEmailAddress(identity.email))
    || typeof identity.emailVerified !== "boolean") return invalidResponse();
  return Object.freeze({
    user: Object.freeze({
      id: user.id,
      createdAt: user.createdAt,
      acceptedTermsVersion: user.acceptedTermsVersion,
      identity: Object.freeze({
        provider: identity.provider,
        subject: identity.subject,
        email: identity.email,
        emailVerified: identity.emailVerified,
      }),
    }),
  });
}

function parseAccountDeletionResponse(value: unknown, expectedOperationId: string): AccountDeletionResponseDto {
  if (!isUuid(expectedOperationId) || !isPlainRecord(value) || !hasExactKeys(value, ["status", "operationId", "proofId"])
    || value.status !== "deleted" || value.operationId !== expectedOperationId || !isUuid(value.operationId)
    || !isDeletionProofId(value.proofId)) return invalidResponse();
  return Object.freeze({ status: "deleted", operationId: value.operationId, proofId: value.proofId });
}

function parsePublicDeletionProofResponse(value: unknown, expectedProofId: string): PublicDeletionProofResponseDto {
  if (!isDeletionProofId(expectedProofId) || !isPlainRecord(value) || !hasExactKeys(value, ["status", "operationId", "proofId"])
    || value.status !== "deleted" || !isUuid(value.operationId) || value.proofId !== expectedProofId
    || !isDeletionProofId(value.proofId)) return invalidResponse();
  return Object.freeze({ status: "deleted", operationId: value.operationId, proofId: value.proofId });
}

function parseDeletionOperationStatus(value: unknown, expectedOperationId: string): DeletionOperationStatusDto {
  if (!isUuid(expectedOperationId) || !isPlainRecord(value) || !hasExactKeys(value, ["status", "operationId", "proofId"])
    || value.operationId !== expectedOperationId || !isUuid(value.operationId)
    || (value.status !== "pending" && value.status !== "remote_deleted" && value.status !== "complete")
    || !(value.proofId === null || isDeletionProofId(value.proofId))
    || ((value.status === "remote_deleted" || value.status === "complete") && value.proofId === null)) return invalidResponse();
  return Object.freeze({ status: value.status as DeletionOperationStatusDto["status"], operationId: value.operationId, proofId: value.proofId });
}

export type PurchaseAttemptDto = Readonly<{ attemptId: string; outcome: "accepted" | "initiated" | "pending" | "reconciliation_required" | "bound" | "cancelled" | "closed_unresolved" | "expired_unresolved"; acceptedAt: string; startExpiresAt: string; initiatedAt: string | null; transactionKey: string | null; resolutionReason: string | null; dispatchAllowed?: boolean }>;
export type PurchaseCaseDto = Readonly<{ transactionKey: string; revision: number; status: "bound" | "reconciliation_required" | "closed_unresolved" | "expired_unresolved"; resolutionReason: string | null; confirmationId: string | null; receiptId: string | null }>;
export type PurchaseAttemptCommandDto = Readonly<{ action: "claim" | "pending" }> | Readonly<{ action: "candidate"; transactionId: string }> | Readonly<{ action: "cancelled"; source: "original_sdk_operation" }>;

export function parsePurchaseAttempt(value: unknown, expectedId: string): Readonly<{ attempt: PurchaseAttemptDto }> {
  if (!isRecord(value) || !isRecord(value.attempt)) return invalidResponse();
  const a = value.attempt;
  if (a.attemptId !== expectedId || !isUuid(a.attemptId) || !["accepted", "initiated", "pending", "reconciliation_required", "bound", "cancelled", "closed_unresolved", "expired_unresolved"].includes(String(a.outcome))
    || !isIsoDate(a.acceptedAt) || !isIsoDate(a.startExpiresAt) || Date.parse(a.startExpiresAt) <= Date.parse(a.acceptedAt)
    || !(a.initiatedAt === null || isIsoDate(a.initiatedAt)) || !(a.transactionKey === null || (typeof a.transactionKey === "string" && SHA256_PATTERN.test(a.transactionKey)))
    || !(a.resolutionReason === null || typeof a.resolutionReason === "string") || !(a.dispatchAllowed === undefined || typeof a.dispatchAllowed === "boolean")
    || (a.dispatchAllowed === true && (a.outcome !== "initiated" || a.initiatedAt === null || Date.parse(String(a.initiatedAt)) < Date.parse(a.acceptedAt) || Date.parse(String(a.initiatedAt)) >= Date.parse(a.startExpiresAt)))
    || (a.outcome === "bound" && a.transactionKey === null)) return invalidResponse();
  return Object.freeze({ attempt: Object.freeze({ attemptId: a.attemptId, outcome: a.outcome as PurchaseAttemptDto["outcome"], acceptedAt: a.acceptedAt, startExpiresAt: a.startExpiresAt, initiatedAt: a.initiatedAt as string | null, transactionKey: a.transactionKey as string | null, resolutionReason: a.resolutionReason as string | null, ...(a.dispatchAllowed === undefined ? {} : { dispatchAllowed: a.dispatchAllowed }) }) });
}
function parsePurchaseCases(value: unknown): Readonly<{ items: readonly PurchaseCaseDto[]; truncated: boolean }> {
  if (!isRecord(value) || !Array.isArray(value.items) || value.items.length > 100 || typeof value.truncated !== "boolean") return invalidResponse();
  const items = value.items.map((item: unknown) => {
    if (!isRecord(item) || typeof item.transactionKey !== "string" || !/^(event-|attempt-)?[a-f0-9]{64}$/u.test(item.transactionKey) || !isFiniteNonNegativeInteger(item.revision)
      || !["bound", "reconciliation_required", "closed_unresolved", "expired_unresolved"].includes(String(item.status)) || !(item.resolutionReason === null || typeof item.resolutionReason === "string")
      || !(item.confirmationId === null || isUuid(item.confirmationId)) || !(item.receiptId === null || (typeof item.receiptId === "string" && SHA256_PATTERN.test(item.receiptId)))) return invalidResponse();
    return Object.freeze({ transactionKey: item.transactionKey, revision: item.revision, status: item.status as PurchaseCaseDto["status"], resolutionReason: item.resolutionReason as string | null, confirmationId: item.confirmationId as string | null, receiptId: item.receiptId as string | null });
  });
  return Object.freeze({ items: Object.freeze(items), truncated: value.truncated });
}

export class PatternlyApiClientError extends Error {
  public constructor(readonly code: PatternlyApiClientErrorCode, readonly status?: number, readonly serverCode?: string, readonly retryAfterSeconds?: number, readonly details?: SyncConflictDetails) {
    super(code);
    this.name = "PatternlyApiClientError";
  }
}

type FetchImplementation = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
export type PatternlyApiClient = Readonly<{
  availability: "available";
  getHealth: () => Promise<HealthResponseDto>;
  getReady: () => Promise<ReadyResponseDto>;
  getOpenApi: () => Promise<OpenApiResponseDto>;
  getMe: () => Promise<MeResponseDto>;
  exchangeAccountSession: () => Promise<Readonly<{ customToken: string }>>;
  registerAccount: (input: AccountRegistrationInputDto) => Promise<AccountRegistrationResponseDto>;
  recordLegalAcceptance: (termsVersion: string) => Promise<Readonly<{ acceptance: Readonly<{ termsVersion: string; acceptedAt: string }> }>>;
  recordPurchaseConfirmation: (input: Readonly<{ confirmationId: string; termsVersion: string; productIdentifier: string; storefrontPrice: string; store?: "APP_STORE" | "PLAY_STORE"; locale: "en" | "pl"; immediateStartRequested: true }>, isCurrent?: () => boolean) => Promise<Readonly<{ confirmation: Readonly<{ confirmationId: string; acceptedAt: string; attemptExpiresAt: string }> }>>;
  getPurchaseAttempt: (attemptId: string, isCurrent?: () => boolean) => Promise<Readonly<{ attempt: PurchaseAttemptDto }>>;
  commandPurchaseAttempt: (attemptId: string, command: PurchaseAttemptCommandDto, isCurrent?: () => boolean) => Promise<Readonly<{ attempt: PurchaseAttemptDto }>>;
  getPurchaseCases: (isCurrent?: () => boolean) => Promise<Readonly<{ items: readonly PurchaseCaseDto[]; truncated: boolean }>>;
  getEntitlements: (isCurrent?: () => boolean) => Promise<EntitlementsResponseDto>;
  getProgress: () => Promise<ProgressResponseDto>;
  exportAccountData: () => Promise<AccountDataExportDto>;
  createPrivacyRequest: (right: PrivacyRequestRightDto, narrative?: string) => Promise<Readonly<{ request: PrivacyRequestListItemDto }>>;
  getPrivacyRequests: () => Promise<Readonly<{ requests: readonly PrivacyRequestListItemDto[] }>>;
  getPrivacyRequest: (requestId: string) => Promise<PrivacyRequestResponseDto>;
  createGuestPrivacyRequest: (input: Readonly<{ clientRequestId: string; email: string; right: PrivacyRequestRightDto; narrative?: string; reportSubmissionIds: readonly string[] }>) => Promise<Readonly<{ status: "pending_verification"; requestId: string }>>;
  resendGuestPrivacyCode: (requestId: string, email: string) => Promise<Readonly<{ status: "pending_verification" }>>;
  verifyGuestPrivacyCode: (code: string) => Promise<Readonly<{ requestId: string; sessionToken: string }>>;
  readGuestPrivacyResponse: (requestId: string, sessionToken: string) => Promise<PrivacyRequestResponseDto>;
  createLegalRequest: (input: Readonly<{ kind: LegalRequestKindDto; narrative?: string; transactionId?: string }>) => Promise<Readonly<{ request: LegalRequestDto }>>;
  createPublicLegalRequest: (input: Readonly<{ email: string; kind: LegalRequestKindDto; narrative?: string; transactionId?: string }>, appCheckToken: string) => Promise<Readonly<{ request: LegalRequestDto }>>;
  getLegalRequests: () => Promise<Readonly<{ requests: readonly LegalRequestDto[] }>>;
  getLegalRequest: (requestId: string) => Promise<Readonly<{ request: LegalRequestDto }>>;
  syncProgress: (input: SyncRequestDto) => Promise<SyncResponseDto>;
  previewAccountAdoption: (input: GuestMergeSnapshotRequestDto) => Promise<AdoptionPreviewResponseDto>;
  confirmAccountAdoption: (input: Readonly<{ deviceId: string; snapshot: GuestMergeSnapshotRequestDto; confirmation: AdoptionConfirmationDto }>) => Promise<AdoptionExecutionResponseDto>;
  issueRecoveryCodes: (operationId: string) => Promise<RecoveryCodeIssueResultDto>;
  getRecoveryCodeIssueStatus: (operationId: string) => Promise<RecoveryCodeIssueResultDto>;
  acknowledgeRecoveryCodesSaved: (operationId: string) => Promise<RecoveryOperationAcknowledgementDto>;
  consumeRecoveryCode: (operationId: string, code: string) => Promise<RecoveryConsumeResultDto>;
  getRecoveryCodeConsumeStatus: (operationId: string, code: string) => Promise<RecoveryConsumeResultDto>;
  acknowledgeRecoveryCodeConsumption: (operationId: string) => Promise<RecoveryOperationAcknowledgementDto>;
  revokeSessions: (operationId: string) => Promise<Readonly<{ status: "revoked"; operationId: string; customToken: string }>>;
  deleteAccount: (operationId: string, operationSecret: string) => Promise<AccountDeletionResponseDto>;
  getDeletionProof: (proofId: string) => Promise<PublicDeletionProofResponseDto>;
  getDeletionOperationStatus: (operationId: string, operationSecret: string) => Promise<DeletionOperationStatusDto>;
  getTracks: () => Promise<TracksResponseDto>;
  getContentVersions: () => Promise<ContentVersionsResponseDto>;
  getContentPackage: (trackId: string, nodeId: string, isCurrent?: () => boolean) => Promise<Readonly<{ status: number; headers: Headers; bytes: Uint8Array; serverCode?: string }>>;
  createContentReport: (input: CreateContentReportDto, appCheckToken: string) => Promise<CreateContentReportResponseDto>;
  getAdminContentReports: () => Promise<AdminContentReportsResponseDto>;
  transitionAdminContentReport: (clientSubmissionId: string, status: ContentReportStatusDto) => Promise<TransitionContentReportResponseDto>;
}>;

export function createPatternlyApiClient(input: Readonly<{
  apiOrigin: string;
  allowLocalHttpForSimulator?: boolean;
  getIdToken: () => Promise<string | null>;
  getAppCheckToken?: () => Promise<string | null>;
  fetchImplementation?: FetchImplementation;
  timeoutMs?: number;
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
  const getAppCheckToken = input.getAppCheckToken ?? getPatternlyAppCheckToken;
  const timeoutMs = input.timeoutMs ?? 10_000;

  type AuthenticationMode = "none" | "optional" | "required";
  async function requestJson<T>(path: string, method: "GET" | "POST" | "PATCH", body?: unknown, authentication: AuthenticationMode = "required", extraHeaders: Readonly<Record<string, string>> = {}, isCurrent: () => boolean = () => true): Promise<T> {
    if (!isCurrent()) throw new PatternlyApiClientError("authentication_required");
    const url = new URL(path, origin);
    const publicPath = path === "/health" || path === "/ready" || path === "/openapi.json";
    if (url.origin !== origin.origin || (!path.startsWith("/v1/") && !publicPath)) throw new PatternlyApiClientError("client_unconfigured");
    // This adapter is the mobile client. Local admin and infrastructure calls
    // have their own trust boundaries; every other versioned call needs App Check.
    const needsAppCheck = url.pathname.startsWith("/v1/") && url.pathname.split("/")[2] !== "admin";
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
      let appCheckToken: string | null = null;
      if (needsAppCheck) {
        const supplied = Object.entries(extraHeaders).find(([name]) => name.toLowerCase() === "x-firebase-appcheck")?.[1];
        if (supplied !== undefined) appCheckToken = supplied;
        else {
          try { appCheckToken = await withinDeadline(getAppCheckToken()); }
          catch { throw new PatternlyApiClientError("app_check_unavailable"); }
        }
        if (!appCheckToken?.trim()) throw new PatternlyApiClientError("app_check_unavailable");
      }
      let response: Response;
      try {
        // Token/App Check awaits must not dispatch an old actor’s command with a new account token.
        if (!isCurrent()) throw new PatternlyApiClientError("authentication_required");
        response = await withinDeadline(fetchImplementation(url, {
          method,
          signal: controller.signal,
          ...(body === undefined ? {} : { body: JSON.stringify(body) }),
          headers: { ...extraHeaders, ...(needsAppCheck && !Object.keys(extraHeaders).some((name) => name.toLowerCase() === "x-firebase-appcheck") ? { "x-firebase-appcheck": appCheckToken! } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...(body === undefined ? {} : { "content-type": "application/json" }) },
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
        // Cloud Run can return a plain-text error before a container receives
        // the request. Once headers arrive, retain that HTTP failure even if
        // its body is malformed or exceeds the remaining deadline.
        if (response.ok) {
          if (error instanceof PatternlyApiClientError) throw error;
          if (error instanceof Error && error.name === "AbortError") throw new PatternlyApiClientError("request_timeout");
          throw new PatternlyApiClientError("invalid_response", response.status);
        }
      }
      if (!response.ok) {
        const syncConflict = path === "/v1/progress/sync" && response.status === 409 ? parseSyncConflictError(payload) : undefined;
        const serverCode = syncConflict?.code ?? (isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string" ? payload.error.code : undefined);
        const retryAfterHeader = response.headers.get("retry-after");
        const parsedRetryAfter = retryAfterHeader !== null && /^[1-9][0-9]*$/u.test(retryAfterHeader)
          ? Number.parseInt(retryAfterHeader, 10)
          : undefined;
        const retryAfterSeconds = parsedRetryAfter !== undefined && Number.isSafeInteger(parsedRetryAfter)
          ? parsedRetryAfter
          : undefined;
        throw new PatternlyApiClientError("server_error", response.status, serverCode, retryAfterSeconds, syncConflict?.details);
      }
      return payload as T;
    } finally {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    }
  }

  async function requestContentPackage(trackId: string, nodeId: string, isCurrent: () => boolean = () => true): Promise<Readonly<{ status: number; headers: Headers; bytes: Uint8Array; serverCode?: string }>> {
    const assertCurrent = () => { if (!isCurrent()) throw new PatternlyApiClientError("profile_changed"); };
    assertCurrent();
    if (!isSafePathIdentity(trackId) || !isSafePathIdentity(nodeId)) throw new PatternlyApiClientError("invalid_response");
    const path = `/v1/content/packages/${encodeURIComponent(trackId)}/${encodeURIComponent(nodeId)}`;
    const url = new URL(path, origin);
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timedOut = new Promise<never>((_, reject) => { timeoutId = setTimeout(() => { controller.abort(); reject(new PatternlyApiClientError("request_timeout")); }, timeoutMs); });
    const withinDeadline = <TValue>(promise: Promise<TValue>): Promise<TValue> => Promise.race([promise, timedOut]);
    try {
      let token: string | null;
      try { token = await withinDeadline(input.getIdToken()); }
      catch (error) { assertCurrent(); if (error instanceof PatternlyApiClientError) throw error; throw new PatternlyApiClientError("transport_failed"); }
      assertCurrent();
      if (!token) throw new PatternlyApiClientError("authentication_required");
      let appCheckToken: string | null;
      try { appCheckToken = await withinDeadline(getAppCheckToken()); }
      catch (error) { assertCurrent(); if (error instanceof PatternlyApiClientError) throw error; throw new PatternlyApiClientError("app_check_unavailable"); }
      assertCurrent();
      if (!appCheckToken?.trim()) throw new PatternlyApiClientError("app_check_unavailable");
      let response: Response;
      try { response = await withinDeadline(fetchImplementation(url, { method: "GET", signal: controller.signal, redirect: "error", credentials: "omit", headers: { authorization: `Bearer ${token}`, "x-firebase-appcheck": appCheckToken } })); }
      catch (error) { assertCurrent(); if (error instanceof PatternlyApiClientError) throw error; throw new PatternlyApiClientError("transport_failed"); }
      assertCurrent();
      if (response.redirected) throw new PatternlyApiClientError("invalid_response");
      let bytes: Uint8Array;
      try { bytes = await withinDeadline(readBoundedBytes(response, 16 * 1024)); }
      catch (error) {
        assertCurrent();
        if (error instanceof PatternlyApiClientError) throw error;
        if (error instanceof Error && error.name === "AbortError") throw new PatternlyApiClientError("request_timeout");
        throw new PatternlyApiClientError("transport_failed");
      }
      assertCurrent();
      if (!response.ok) {
        let serverCode: string | undefined;
        try {
          const payload = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
          if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string") serverCode = payload.error.code;
        } catch { /* The status remains actionable even when the server error body is malformed. */ }
        throw new PatternlyApiClientError("server_error", response.status, serverCode);
      }
      if (response.status !== 200 || response.headers.get("content-type")?.split(";", 1)[0]?.trim() !== "application/json") throw new PatternlyApiClientError("invalid_response");
      let descriptor: ReturnType<typeof parseContentPackageDescriptor>;
      try { descriptor = parseContentPackageDescriptor(JSON.parse(new TextDecoder().decode(bytes)), trackId, nodeId); }
      catch { throw new PatternlyApiClientError("invalid_response"); }
      assertCurrent();
      let download: Response;
      try { download = await withinDeadline(fetchImplementation(descriptor.url, { method: "GET", signal: controller.signal, redirect: "error", credentials: "omit" })); }
      catch (error) { assertCurrent(); if (error instanceof PatternlyApiClientError) throw error; throw new PatternlyApiClientError("transport_failed"); }
      assertCurrent();
      if (!download.ok) throw new PatternlyApiClientError("transport_failed");
      if (download.redirected || download.status !== 200 || download.headers.get("content-type") !== "application/gzip" || download.headers.get("content-encoding")) throw new PatternlyApiClientError("invalid_response");
      try { bytes = await withinDeadline(readBoundedBytes(download, 2 * 1024 * 1024)); }
      catch (error) { assertCurrent(); if (error instanceof PatternlyApiClientError) throw error; throw new PatternlyApiClientError("transport_failed"); }
      assertCurrent();
      return Object.freeze({ status: 200, headers: descriptor.headers, bytes });
    } finally { if (timeoutId !== undefined) clearTimeout(timeoutId); }
  }

  return Object.freeze({
    availability: "available" as const,
    getHealth: () => requestJson<HealthResponseDto>("/health", "GET", undefined, "none"),
    getReady: () => requestJson<ReadyResponseDto>("/ready", "GET", undefined, "none"),
    getOpenApi: () => requestJson<OpenApiResponseDto>("/openapi.json", "GET", undefined, "none"),
    getMe: async () => parseMeResponse(await requestJson<unknown>("/v1/me", "GET")),
    exchangeAccountSession: async () => {
      const response = await requestJson<unknown>("/v1/account/session/exchange", "POST");
      if (!isRecord(response) || typeof response.customToken !== "string" || response.customToken.trim().length === 0) {
        throw new PatternlyApiClientError("invalid_response");
      }
      return Object.freeze({ customToken: response.customToken });
    },
    registerAccount: async (body) => parseAccountRegistrationResponse(await requestJson<unknown>("/v1/account/registration", "POST", body)),
    recordLegalAcceptance: (termsVersion) => requestJson("/v1/legal-acceptances", "POST", { termsVersion, minimumAgeConfirmed: 18 }),
    recordPurchaseConfirmation: async (body, isCurrent) => {
      const response = await requestJson<unknown>("/v1/purchase-confirmations", "POST", body, "required", {}, isCurrent);
      if (!isRecord(response) || !isRecord(response.confirmation) || response.confirmation.confirmationId !== body.confirmationId || !isIsoDate(response.confirmation.acceptedAt) || !isIsoDate(response.confirmation.attemptExpiresAt) || Date.parse(response.confirmation.attemptExpiresAt) <= Date.parse(response.confirmation.acceptedAt)) return invalidResponse();
      return Object.freeze({ confirmation: Object.freeze({ confirmationId: body.confirmationId, acceptedAt: response.confirmation.acceptedAt, attemptExpiresAt: response.confirmation.attemptExpiresAt }) });
    },
    getPurchaseAttempt: async (attemptId, isCurrent) => { if (!isUuid(attemptId)) return invalidResponse(); return parsePurchaseAttempt(await requestJson<unknown>(`/v1/purchase-attempts/${encodeURIComponent(attemptId)}`, "GET", undefined, "required", {}, isCurrent), attemptId); },
    commandPurchaseAttempt: async (attemptId, body, isCurrent) => { if (!isUuid(attemptId)) return invalidResponse(); return parsePurchaseAttempt(await requestJson<unknown>(`/v1/purchase-attempts/${encodeURIComponent(attemptId)}`, "POST", body, "required", {}, isCurrent), attemptId); },
    getPurchaseCases: async (isCurrent) => parsePurchaseCases(await requestJson<unknown>("/v1/purchase-cases", "GET", undefined, "required", {}, isCurrent)),
    getEntitlements: (isCurrent) => requestJson<EntitlementsResponseDto>("/v1/entitlements", "GET", undefined, "required", {}, isCurrent),
    getProgress: async () => {
      const records: ProgressRecordDto[] = [];
      let pageToken: string | null = null;
      let accountRevision: number | null = null;
      let generation: number | undefined;
      for (let page = 0; page < 1_001; page += 1) {
        const query: string = pageToken === null
          ? "/v1/progress?pageSize=100"
          : `/v1/progress?pageSize=100&pageToken=${encodeURIComponent(pageToken)}`;
        const response = parseProgressPage(await requestJson<unknown>(query, "GET"));
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
    createGuestPrivacyRequest: async (body) => parseGuestPrivacyCreate(await requestJson<unknown>("/v1/guest/privacy-requests", "POST", body, "none")),
    resendGuestPrivacyCode: async (requestId, email) => parseGuestPrivacyPending(await requestJson<unknown>(`/v1/guest/privacy-requests/${encodeURIComponent(requestId)}/resend`, "POST", { email }, "none")),
    verifyGuestPrivacyCode: async (code) => parseGuestPrivacySession(await requestJson<unknown>("/v1/guest/privacy-requests/verify", "POST", { code }, "none")),
    readGuestPrivacyResponse: async (requestId, sessionToken) => parsePrivacyRequestResponse(await requestJson<unknown>(`/v1/guest/privacy-requests/${encodeURIComponent(requestId)}/response`, "POST", { sessionToken }, "none")),
    createLegalRequest: async (body) => parseLegalRequestEnvelope(await requestJson<unknown>("/v1/legal-requests", "POST", body)),
    createPublicLegalRequest: async (body, appCheckToken) => parseLegalRequestEnvelope(await requestJson<unknown>("/v1/public/legal-requests", "POST", body, "optional", { "x-firebase-appcheck": appCheckToken })),
    getLegalRequests: async () => parseLegalRequestList(await requestJson<unknown>("/v1/legal-requests", "GET")),
    getLegalRequest: async (requestId) => parseLegalRequestEnvelope(await requestJson<unknown>(`/v1/legal-requests/${encodeURIComponent(requestId)}`, "GET")),
    syncProgress: async (body: SyncRequestDto) => {
      validateSyncRequest(body);
      const response = await requestJson<unknown>("/v1/progress/sync", "POST", body);
      return parseSyncResponse(response);
    },
    previewAccountAdoption: async (body: GuestMergeSnapshotRequestDto) => {
      validateGuestSnapshot(body);
      const response = await requestJson<unknown>("/v1/account-data/adoption/preview", "POST", body);
      return parseAdoptionPreviewResponse(response);
    },
    confirmAccountAdoption: async (body: Readonly<{ deviceId: string; snapshot: GuestMergeSnapshotRequestDto; confirmation: AdoptionConfirmationDto }>) => {
      if (!hasExactKeys(body, ["deviceId", "snapshot", "confirmation"]) || !isUuid(body.deviceId)) return invalidResponse();
      validateGuestSnapshot(body.snapshot);
      validateAdoptionConfirmation(body.confirmation);
      const response = await requestJson<unknown>("/v1/account-data/adoption/confirm", "POST", body);
      return parseAdoptionExecutionResponse(response);
    },
    issueRecoveryCodes: async (operationId) => {
      if (!isUuid(operationId)) return invalidResponse();
      return parseRecoveryCodeIssueResult(await requestJson<unknown>("/v1/account/recovery-codes", "POST", { operationId }), operationId);
    },
    getRecoveryCodeIssueStatus: async (operationId) => {
      if (!isUuid(operationId)) return invalidResponse();
      return parseRecoveryCodeIssueResult(await requestJson<unknown>(`/v1/account/recovery-codes/issue/status?operationId=${encodeURIComponent(operationId)}`, "GET"), operationId);
    },
    acknowledgeRecoveryCodesSaved: async (operationId) => {
      if (!isUuid(operationId)) return invalidResponse();
      return parseRecoveryOperationAcknowledgement(await requestJson<unknown>("/v1/account/recovery-codes/issue/saved-ack", "POST", { operationId }), operationId);
    },
    consumeRecoveryCode: async (operationId, code) => {
      if (!isUuid(operationId) || !RECOVERY_CODE_PATTERN.test(code)) return invalidResponse();
      return parseRecoveryConsumeResult(await requestJson<unknown>("/v1/public/recovery-codes/consume", "POST", { operationId, code }, "none"), operationId);
    },
    getRecoveryCodeConsumeStatus: async (operationId, code) => {
      if (!isUuid(operationId) || !RECOVERY_CODE_PATTERN.test(code)) return invalidResponse();
      return parseRecoveryConsumeResult(await requestJson<unknown>("/v1/public/recovery-codes/consume/status", "POST", { operationId, code }, "none"), operationId);
    },
    acknowledgeRecoveryCodeConsumption: async (operationId) => {
      if (!isUuid(operationId)) return invalidResponse();
      return parseRecoveryOperationAcknowledgement(await requestJson<unknown>("/v1/account/recovery-codes/consume/ack", "POST", { operationId }), operationId);
    },
    revokeSessions: async (operationId) => {
      const response = await requestJson<unknown>("/v1/account/session/revoke", "POST", { operationId });
      if (!isRecord(response) || response.status !== "revoked" || response.operationId !== operationId || typeof response.customToken !== "string" || !response.customToken.trim()) {
        throw new PatternlyApiClientError("invalid_response");
      }
      return Object.freeze({ status: "revoked" as const, operationId: response.operationId, customToken: response.customToken });
    },
    deleteAccount: async (operationId, operationSecret) => {
      if (!isUuid(operationId) || !isDeletionOperationSecret(operationSecret)) return invalidResponse();
      return parseAccountDeletionResponse(await requestJson<unknown>("/v1/account/deletion", "POST", { operationId, operationSecret }), operationId);
    },
    getDeletionProof: async (proofId) => {
      if (!isDeletionProofId(proofId)) return invalidResponse();
      return parsePublicDeletionProofResponse(await requestJson<unknown>(`/v1/public/deletion-proofs/${encodeURIComponent(proofId)}`, "GET", undefined, "none"), proofId);
    },
    getDeletionOperationStatus: async (operationId, operationSecret) => {
      if (!isUuid(operationId) || !isDeletionOperationSecret(operationSecret)) return invalidResponse();
      return parseDeletionOperationStatus(await requestJson<unknown>("/v1/public/deletion-operations/status", "POST", { operationId, operationSecret }, "none"), operationId);
    },
    getTracks: () => requestJson<TracksResponseDto>("/v1/tracks", "GET"),
    getContentVersions: () => requestJson<ContentVersionsResponseDto>("/v1/content/versions", "GET"),
    getContentPackage: requestContentPackage,
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
function isSafePathIdentity(value: string): boolean { return value.length > 0 && value === value.trim() && value !== "." && value !== ".." && !/[\\/\u0000]/u.test(value); }

async function readBoundedBytes(response: Response, maximum: number): Promise<Uint8Array> {
  if (!response.body) return new Uint8Array();
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) { await reader.cancel(); throw new PatternlyApiClientError("invalid_response", response.status); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.byteLength; }
  return result;
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

function parseGuestPrivacyPending(value: unknown): Readonly<{ status: "pending_verification" }> {
  if (!isRecord(value) || value.status !== "pending_verification") return invalidPrivacyResponse();
  return { status: "pending_verification" };
}

function parseGuestPrivacyCreate(value: unknown): Readonly<{ status: "pending_verification"; requestId: string }> {
  parseGuestPrivacyPending(value);
  if (!isRecord(value) || typeof value.requestId !== "string" || !/^pr_[0-9a-f-]{36}$/u.test(value.requestId)) return invalidPrivacyResponse();
  return { status: "pending_verification", requestId: value.requestId };
}

function parseGuestPrivacySession(value: unknown): Readonly<{ requestId: string; sessionToken: string }> {
  if (!isRecord(value) || typeof value.requestId !== "string" || !/^pr_[0-9a-f-]{36}$/u.test(value.requestId) || typeof value.sessionToken !== "string" || value.sessionToken.length < 32) return invalidPrivacyResponse();
  return { requestId: value.requestId, sessionToken: value.sessionToken };
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
