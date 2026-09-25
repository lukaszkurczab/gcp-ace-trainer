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
const PROGRESS_RECORD_TYPES = new Set(["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry", "goal", "learning_plan"]);
const ADOPTION_CASES = new Set(["emptyLocalEmptyRemote", "populatedLocalEmptyRemote", "emptyLocalPopulatedRemote", "populatedLocalPopulatedRemote", "divergentRecord", "blocked"]);
const BLOCKING_REASONS = new Set(["active_session", "journal_recovery"]);
const CONFLICT_CODES = new Set(["version_conflict", "content_identity_schema_conflict"]);

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

function validateProgressRecord(value: unknown): value is ProgressRecordDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["kind", "recordType", "trackId", "targetId", "version", "fingerprint", "state", "lastMutationId", "updatedAt"])) return invalidResponse();
  if (value.kind !== "node" && value.kind !== "item") return invalidResponse();
  if (typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)) return invalidResponse();
  if (value.kind === "item" && value.recordType !== "training_attempt" && value.recordType !== "review_queue_entry") return invalidResponse();
  if (value.kind === "node" && (value.recordType === "training_attempt" || value.recordType === "review_queue_entry")) return invalidResponse();
  if (!isNonEmptyString(value.trackId) || !isNonEmptyString(value.targetId) || !isFiniteNonNegativeInteger(value.version)
    || !isSha256(value.fingerprint) || !isBoundedString(value.lastMutationId, 16, 128) || !isIsoDate(value.updatedAt)) return invalidResponse();
  assertState(value.state);
  return true;
}

function validateGuestMergeRecord(value: unknown): value is GuestMergeRecordDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["fingerprint", "recordId", "recordType", "state", "trackId", "version"])) return invalidResponse();
  if (!isSha256(value.fingerprint) || !isNonEmptyString(value.recordId) || typeof value.recordType !== "string" || !PROGRESS_RECORD_TYPES.has(value.recordType)
    || !isNonEmptyString(value.trackId) || !isFiniteNonNegativeInteger(value.version)) return invalidResponse();
  assertState(value.state);
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
  value.records.forEach((record) => validateProgressRecord(record));
  return value as ProgressResponseDto;
}

function parseSyncConflict(value: unknown): SyncConflictDto {
  if (!isPlainRecord(value) || !hasExactKeys(value, ["mutationId", "code", "current"]) || !isMutationId(value.mutationId) || typeof value.code !== "string" || !CONFLICT_CODES.has(value.code) || !(value.current === null || isPlainRecord(value.current))) return invalidResponse();
  if (value.current !== null) validateProgressRecord(value.current);
  return value as SyncConflictDto;
}

function parseSyncResponse(value: unknown): SyncResponseDto {
  if (!isPlainRecord(value) || !hasOneOfExactKeys(value, [["accountRevision", "applied", "duplicates", "conflicts"], ["accountRevision", "applied", "duplicates", "conflicts", "accountRevisionConflict"]])) return invalidResponse();
  if (!isFiniteNonNegativeInteger(value.accountRevision) || !Array.isArray(value.applied) || value.applied.length > 100
    || !Array.isArray(value.duplicates) || value.duplicates.length > 100 || !Array.isArray(value.conflicts) || value.conflicts.length > 100) return invalidResponse();
  value.applied.forEach((record) => validateProgressRecord(record));
  if (!value.duplicates.every(isMutationId)) return invalidResponse();
  value.conflicts.forEach((conflict) => parseSyncConflict(conflict));
  if (value.accountRevisionConflict !== undefined && value.accountRevisionConflict !== null) {
    if (!isPlainRecord(value.accountRevisionConflict) || !hasExactKeys(value.accountRevisionConflict, ["code", "currentAccountRevision"]) || value.accountRevisionConflict.code !== "account_revision_conflict" || !isFiniteNonNegativeInteger(value.accountRevisionConflict.currentAccountRevision)) return invalidResponse();
  }
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
export type RecoveryCodesResponseDto = Readonly<{ generationId: string; codes: readonly string[] }>;
export type AccountDeletionResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type PublicDeletionProofResponseDto = Readonly<{ status: "deleted"; operationId: string; proofId: string }>;
export type DeletionOperationStatusDto = Readonly<{ status: "pending" | "remote_deleted" | "complete"; operationId: string; proofId: string | null }>;
export type EntitlementsResponseDto = Readonly<{
  serverObservedAt: string;
  entitlements: readonly Readonly<{
    accountId: string;
    entitlement: string;
    productId: string;
    state: "active" | "grace" | "hold" | "expired" | "refunded";
    source: "revenuecat";
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
export type CreateContentReportDto = Readonly<{ clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto; linkAccount?: boolean; contactEmail?: string }>;
export type ContentReportDto = Readonly<{ id: string; clientSubmissionId: string; trackId: string; contentVersion: string; itemId: string; reason: ContentReportReasonDto; description: string; context: ContentReportContextDto; linkage: "unlinked" | "account" | "contact" | "account_and_contact"; status: ContentReportStatusDto; createdAt: string; updatedAt: string }>;
export type CreateContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type AdminContentReportsResponseDto = Readonly<{ reports: readonly ContentReportDto[] }>;
export type TransitionContentReportResponseDto = Readonly<{ report: ContentReportDto; duplicate: boolean }>;
export type HealthResponseDto = Readonly<{ status: "ok"; service: "patternly-backend" }>;
export type ReadyResponseDto = Readonly<{ status: "ready" | "not_ready"; checks: Readonly<{ database: boolean; authentication: boolean; providerReader: boolean }> }>;
export type OpenApiResponseDto = Readonly<{ openapi: string; paths: Readonly<Record<string, unknown>> }>;

export type PatternlyApiClientErrorCode = "client_unconfigured" | "authentication_required" | "app_check_unavailable" | "transport_failed" | "invalid_response" | "server_error" | "request_timeout";
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
  getHealth: () => Promise<HealthResponseDto>;
  getReady: () => Promise<ReadyResponseDto>;
  getOpenApi: () => Promise<OpenApiResponseDto>;
  getMe: () => Promise<MeResponseDto>;
  exchangeAccountSession: () => Promise<Readonly<{ customToken: string }>>;
  registerAccount: (input: AccountRegistrationInputDto) => Promise<AccountRegistrationResponseDto>;
  recordLegalAcceptance: (termsVersion: string) => Promise<Readonly<{ acceptance: Readonly<{ termsVersion: string; acceptedAt: string }> }>>;
  recordPurchaseConfirmation: (input: Readonly<{ confirmationId: string; termsVersion: string; productIdentifier: string; storefrontPrice: string; locale: "en" | "pl"; immediateStartRequested: true }>) => Promise<Readonly<{ confirmation: Readonly<{ confirmationId: string; acceptedAt: string }> }>>;
  getEntitlements: () => Promise<EntitlementsResponseDto>;
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
  issueRecoveryCodes: () => Promise<RecoveryCodesResponseDto>;
  consumeRecoveryCode: (code: string) => Promise<Readonly<{ customToken: string }>>;
  revokeSessions: (operationId: string) => Promise<Readonly<{ status: "revoked"; operationId: string }>>;
  deleteAccount: (operationId: string, operationSecret: string) => Promise<AccountDeletionResponseDto>;
  getDeletionProof: (proofId: string) => Promise<PublicDeletionProofResponseDto>;
  getDeletionOperationStatus: (operationId: string, operationSecret: string) => Promise<DeletionOperationStatusDto>;
  getTracks: () => Promise<TracksResponseDto>;
  getContentVersions: () => Promise<ContentVersionsResponseDto>;
  getContentPackage: (trackId: string, nodeId: string) => Promise<Readonly<{ status: number; headers: Headers; bytes: Uint8Array; serverCode?: string }>>;
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
  async function requestJson<T>(path: string, method: "GET" | "POST" | "PATCH", body?: unknown, authentication: AuthenticationMode = "required", extraHeaders: Readonly<Record<string, string>> = {}): Promise<T> {
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

  async function requestContentPackage(trackId: string, nodeId: string): Promise<Readonly<{ status: number; headers: Headers; bytes: Uint8Array; serverCode?: string }>> {
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
      catch (error) { if (error instanceof PatternlyApiClientError) throw error; throw new PatternlyApiClientError("transport_failed"); }
      if (!token) throw new PatternlyApiClientError("authentication_required");
      let appCheckToken: string | null;
      try { appCheckToken = await withinDeadline(getAppCheckToken()); }
      catch { throw new PatternlyApiClientError("app_check_unavailable"); }
      if (!appCheckToken?.trim()) throw new PatternlyApiClientError("app_check_unavailable");
      let response: Response;
      try { response = await withinDeadline(fetchImplementation(url, { method: "GET", signal: controller.signal, headers: { authorization: `Bearer ${token}`, "x-firebase-appcheck": appCheckToken } })); }
      catch (error) { if (error instanceof PatternlyApiClientError) throw error; throw new PatternlyApiClientError("transport_failed"); }
      let bytes: Uint8Array;
      try { bytes = await withinDeadline(readBoundedBytes(response, 2 * 1024 * 1024)); }
      catch (error) {
        if (error instanceof PatternlyApiClientError) throw error;
        if (error instanceof Error && error.name === "AbortError") throw new PatternlyApiClientError("request_timeout");
        throw new PatternlyApiClientError("transport_failed");
      }
      if (!response.ok) {
        let serverCode: string | undefined;
        try {
          const payload = JSON.parse(new TextDecoder().decode(bytes)) as unknown;
          if (isRecord(payload) && isRecord(payload.error) && typeof payload.error.code === "string") serverCode = payload.error.code;
        } catch { /* The status remains actionable even when the server error body is malformed. */ }
        throw new PatternlyApiClientError("server_error", response.status, serverCode);
      }
      return Object.freeze({ status: response.status, headers: response.headers, bytes });
    } finally { if (timeoutId !== undefined) clearTimeout(timeoutId); }
  }

  return Object.freeze({
    availability: "available" as const,
    getHealth: () => requestJson<HealthResponseDto>("/health", "GET", undefined, "none"),
    getReady: () => requestJson<ReadyResponseDto>("/ready", "GET", undefined, "none"),
    getOpenApi: () => requestJson<OpenApiResponseDto>("/openapi.json", "GET", undefined, "none"),
    getMe: () => requestJson<MeResponseDto>("/v1/me", "GET"),
    exchangeAccountSession: async () => {
      const response = await requestJson<unknown>("/v1/account/session/exchange", "POST");
      if (!isRecord(response) || typeof response.customToken !== "string" || response.customToken.trim().length === 0) {
        throw new PatternlyApiClientError("invalid_response");
      }
      return Object.freeze({ customToken: response.customToken });
    },
    registerAccount: (body) => requestJson<AccountRegistrationResponseDto>("/v1/account/registration", "POST", body),
    recordLegalAcceptance: (termsVersion) => requestJson("/v1/legal-acceptances", "POST", { termsVersion, minimumAgeConfirmed: 18 }),
    recordPurchaseConfirmation: (body) => requestJson("/v1/purchase-confirmations", "POST", body),
    getEntitlements: () => requestJson<EntitlementsResponseDto>("/v1/entitlements", "GET"),
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
    issueRecoveryCodes: () => requestJson<RecoveryCodesResponseDto>("/v1/account/recovery-codes", "POST", {}),
    consumeRecoveryCode: (code) => requestJson<Readonly<{ customToken: string }>>("/v1/public/recovery-codes/consume", "POST", { code }, "none"),
    revokeSessions: (operationId) => requestJson<Readonly<{ status: "revoked"; operationId: string }>>("/v1/account/session/revoke", "POST", { operationId }),
    deleteAccount: (operationId, operationSecret) => requestJson<AccountDeletionResponseDto>("/v1/account/deletion", "POST", { operationId, operationSecret }),
    getDeletionProof: (proofId) => requestJson<PublicDeletionProofResponseDto>(`/v1/public/deletion-proofs/${proofId}`, "GET", undefined, "none"),
    getDeletionOperationStatus: (operationId, operationSecret) => requestJson<DeletionOperationStatusDto>("/v1/public/deletion-operations/status", "POST", { operationId, operationSecret }, "none"),
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
