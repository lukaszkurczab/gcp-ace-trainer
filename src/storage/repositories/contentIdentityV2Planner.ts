import {
  CONTENT_IDENTITY_INVENTORY_REGISTRY,
  isLegacyAccountSyncState,
  isLegacyNotificationSettings,
  type ContentIdentityInventoryKeyKind,
  type ContentIdentityInventoryRegistryEntry,
} from "./contentIdentityInventory";
import {
  CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION,
  createContentIdentityMigrationActivation,
  createContentIdentityMigrationVerifier,
  migrateContentIdentityStorage,
  planContentIdentityMigration,
  type ContentIdentityMigrationActivation,
  type ContentIdentityMigrationManifest,
  type ContentIdentityMigrationMetadataSnapshot,
  type ContentIdentityMigrationPlan,
  type ContentIdentityMigrationRawRecord,
  type ContentIdentityMigrationVerifier,
} from "./contentIdentityMigration";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { CANONICAL_RECORD_SCHEMA } from "./canonicalRecordCodec";
import {
  CONTENT_IDENTITY_V2_MIGRATION_VERSION,
  CONTENT_IDENTITY_V2_PROTOCOL_VERSION,
  CONTENT_IDENTITY_V2_SCHEMA,
  ContentIdentityV2Error,
  createContentIdentityV2Certificate,
  createContentIdentityV2Record,
  contentIdentityV2Digest,
  type ContentIdentityV2Certificate,
  type ContentIdentityV2IdentityBinding,
  type ContentIdentityV2Preservation,
  type ContentIdentityV2Record,
} from "../contracts/contentIdentityV2";
import { canonicalJsonV1, canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { isRegisteredTrackId } from "../../domain";
import { isGoalRecordShapeForTrack } from "../../domain/goals/goalContracts";
import { isLearningPlanV1ForTrack } from "../../domain/learning/learningPlan";
import {
  mapLegacyContentIdentity,
  type ActiveContentArtifactDescriptor,
  type LegacyContentTombstoneContext,
} from "../../domain/learning/legacyContentIdentityMapper";
import { isContentIdentityTombstone, isResolvedContentRef } from "../../domain/learning/resolvedContentRef";
import { isCanonicalSafeIdentity } from "../../content/canonical/questionValidation";
import { accountDataRecordFingerprint, accountDataRecordKey, isCanonicalAccountSyncState, isGuestOwnedLearningKey, type SyncableRecordType } from "./accountDataRepository";
import { isCanonicalNotificationSettings, isCanonicalNotificationSettingsJournal } from "./notificationSettingsRepository";
import { isMutationJournalRecord } from "./mutationJournalRepository";
import { isContentReportOutboxEntries } from "./contentReportOutboxRepository";
import { isCanonicalStorageMetadataV1 } from "./storageMetadataRepository";
import {
  isForegroundTimerState,
  isReviewQueueEntry,
  isTrainingAttempt,
  isTrainingSession,
  isTrainingSessionDraft,
  isTrainingSessionResult,
} from "./trainingModelGuards";

/**
 * C1a is a dormant owner-specific planner.  It produces the exact target
 * bytes and a sealed C0 plan, but it is intentionally not reachable from the
 * public storage barrel or bootstrap.
 */
export const CONTENT_IDENTITY_V2_PLANNER_VERSION = 1 as const;

export type ContentIdentityV2PlannerErrorCode =
  | "unregistered_key"
  | "malformed_envelope"
  | "owner_guard_failed"
  | "unmapped_package_identity"
  | "relationship_invalid"
  | "invalid_artifact_set"
  | "invalid_source"
  | "cloud_protocol_upgrade_required";

export class ContentIdentityV2PlannerError extends Error {
  readonly code: ContentIdentityV2PlannerErrorCode;

  constructor(code: ContentIdentityV2PlannerErrorCode, message = code) {
    super(message);
    this.name = "ContentIdentityV2PlannerError";
    this.code = code;
  }
}

export type ContentIdentityV2PlanBundle = Readonly<{
  plan: ContentIdentityMigrationPlan;
  verifier: ContentIdentityMigrationVerifier;
  activation: ContentIdentityMigrationActivation;
  certificate: ContentIdentityV2Certificate;
  targetRecords: readonly ContentIdentityMigrationRawRecord[];
  preservation: readonly ContentIdentityV2Preservation[];
  cloudProtocolUpgradeRequired: true;
}>;

type JsonRecord = Record<string, unknown>;
type CanonicalEnvelope = Readonly<{ schemaIdentity: typeof CANONICAL_RECORD_SCHEMA; revision: number; payload: unknown }>;
type TransformContext = Readonly<{
  key: string;
  entry: ContentIdentityInventoryRegistryEntry;
  kind: ContentIdentityInventoryKeyKind;
  artifacts: readonly ActiveContentArtifactDescriptor[];
  sessionPreflight: ReadonlyMap<string, LegacySessionPreflight>;
}>;
type TransformResult = Readonly<{
  value: unknown;
  identity: readonly ContentIdentityV2IdentityBinding[];
}>;
type LegacySessionPreflight = Readonly<{
  kind: "active" | "history";
  trackId: string;
  contentVersion: string;
  packagePin: unknown;
  mapped: boolean;
}>;
type LegacyIdentityOverride = Readonly<{ trackId: string; contentVersion: string; packagePin: unknown }>;

const DIGEST = /^[a-f0-9]{64}$/u;
const LEGACY_PACKAGE_KEYS = ["packageIdentity", "packageVersion", "contentReleaseId"] as const;
const V2_OWNER_NAMES = Object.freeze([
  "storageMetadataRepository", "guestInstallationRepository", "guestAccessRepository", "activeTrackRepository",
  "trainingSessionRepository", "trainingSessionDraftRepository", "foregroundTimerRepository", "settingsRepository",
  "trainingAttemptRepository",
  "goalOnboardingPreferenceRepository", "notificationSettingsRepository", "mutationJournalRepository", "accountDataRepository",
  "accountLifecycleRepository", "contentReportOutboxRepository", "trainingSessionResultRepository", "reviewQueueRepository",
  "goalRepository", "learningPlanRepository",
] as const);

const PRESERVATION_PATHS: Readonly<Record<string, Readonly<{
  ids: readonly string[];
  revisions: readonly string[];
  ordering: readonly string[];
  results: readonly string[];
  timestamps: readonly string[];
  answers: readonly string[];
  fingerprints: readonly string[];
}>>> = Object.freeze({
  trainingSessionRepository: Object.freeze({ ids: ["id", "itemOrder[*].occurrenceId"], revisions: ["planFingerprint", "taxonomyVersion"], ordering: ["itemOrder[*].occurrenceId", "currentItemIndex", "optionOrderByOccurrence"], results: [], timestamps: ["startedAt", "completedAt"], answers: [], fingerprints: ["planFingerprint"] }),
  trainingAttemptRepository: Object.freeze({ ids: ["id", "sessionId", "occurrenceId"], revisions: [], ordering: ["occurrenceId"], results: ["result"], timestamps: ["answeredAt", "committedAt"], answers: ["response"], fingerprints: [] }),
  reviewQueueRepository: Object.freeze({ ids: ["id", "sourceAttemptId", "sourceSessionId"], revisions: [], ordering: [], results: ["reasons", "persistent"], timestamps: ["dueAt", "createdAt", "lastReviewedAt"], answers: [], fingerprints: [] }),
  learningPlanRepository: Object.freeze({ ids: ["planId", "trackId"], revisions: ["planRevision", "goalRevision"], ordering: ["slots[*].slotId", "slots[*].day"], results: ["status", "acceptedTarget"], timestamps: ["createdAt", "updatedAt"], answers: [], fingerprints: ["commandId"] }),
  notificationSettingsRepository: Object.freeze({ ids: ["identity.planId", "identity.commandId", "pending.expectedIdentity.planId"], revisions: ["identity.planRevision", "identity.storageRevision", "pending.expectedIdentity.planRevision"], ordering: ["schedules[*].slotId", "pending.slots[*].slotId"], results: ["enabled"], timestamps: [], answers: [], fingerprints: ["identity.commandId", "pending.expectedIdentity.commandId"] }),
  mutationJournalRepository: Object.freeze({ ids: ["journalId", "sessionId"], revisions: ["expectedRevisions", "status"], ordering: ["writes[*].kind", "expectedRevisions[*].target"], results: ["operation", "status"], timestamps: ["createdAt"], answers: ["writes[*].record.response", "writes[*].record.itemOrder"], fingerprints: ["planFingerprint", "commandIdentity.fingerprint"] }),
  accountDataRepository: Object.freeze({ ids: ["recordId", "recordType", "trackId"], revisions: ["version", "state.version", "syncPlan.items[*].sequence"], ordering: ["outbox[*].sequence", "syncPlan.items[*].sequence"], results: ["state.result", "state.status", "status"], timestamps: ["lastSuccessfulSyncAt", "outbox[*].lastErrorCode"], answers: ["state.response", "outbox[*].state.response", "syncPlan.items[*].payload.state.response"], fingerprints: ["fingerprint", "localDatasetFingerprint", "outbox[*].fingerprint", "syncPlan.items[*].payload.fingerprint"] }),
  contentReportOutboxRepository: Object.freeze({ ids: ["[*].input.clientSubmissionId"], revisions: [], ordering: ["[*].input.clientSubmissionId"], results: ["[*].status"], timestamps: ["[*].createdAt", "[*].updatedAt", "[*].input.context.occurredAt"], answers: ["[*].input.description"], fingerprints: [] }),
});

const PRESERVATION_FALLBACK = Object.freeze({ ids: [], revisions: [], ordering: [], results: [], timestamps: [], answers: [], fingerprints: [] });

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value) && Object.getPrototypeOf(value) === Object.prototype;
}

function nonEmpty(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }

function hasExactKeys(value: JsonRecord, keys: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  return actual.length === keys.length && [...keys].sort().every((key, index) => actual[index] === key);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function parseEnvelope(raw: string, key: string): CanonicalEnvelope {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new ContentIdentityV2PlannerError("malformed_envelope"); }
  if (!isRecord(value) || !hasExactKeys(value, ["schemaIdentity", "revision", "payload"]) || value.schemaIdentity !== CANONICAL_RECORD_SCHEMA || !Number.isSafeInteger(value.revision) || Number(value.revision) < 1) {
    throw new ContentIdentityV2PlannerError("malformed_envelope");
  }
  return Object.freeze({ schemaIdentity: CANONICAL_RECORD_SCHEMA, revision: value.revision as number, payload: value.payload });
}

function ownerForKey(key: string): Readonly<{ entry: ContentIdentityInventoryRegistryEntry; kind: ContentIdentityInventoryKeyKind }> {
  const exact = CONTENT_IDENTITY_INVENTORY_REGISTRY.find((entry) => entry.kind === "fixed" && entry.selector === key);
  if (exact) return { entry: exact, kind: "fixed" };
  const candidates = CONTENT_IDENTITY_INVENTORY_REGISTRY
    .filter((entry) => (entry.kind === "dynamic_prefix" || entry.kind === "index") && key.startsWith(entry.selector))
    .sort((left, right) => right.selector.length - left.selector.length);
  const selected = candidates[0];
  if (!selected) throw new ContentIdentityV2PlannerError("unregistered_key");
  if (selected.kind === "index" && key !== selected.selector) throw new ContentIdentityV2PlannerError("unregistered_key");
  if (selected.kind === "dynamic_prefix" && !nonEmpty(key.slice(selected.selector.length))) throw new ContentIdentityV2PlannerError("unregistered_key");
  return { entry: selected, kind: selected.kind };
}

function assertLegacyOwnerPayload(key: string, owner: string, payload: unknown): void {
  const ownerInfo = ownerForKey(key);
  if (ownerInfo.entry.owner !== owner) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const suffix = ownerInfo.kind === "dynamic_prefix" ? key.slice(ownerInfo.entry.selector.length) : null;
  if (ownerInfo.kind === "dynamic_prefix" && !nonEmpty(suffix)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  if (ownerInfo.kind === "index" && key !== ownerInfo.entry.selector) throw new ContentIdentityV2PlannerError("owner_guard_failed");

  const invalid = (): never => { throw new ContentIdentityV2PlannerError("owner_guard_failed"); };
  if (owner === "storageMetadataRepository") {
    if (!isCanonicalStorageMetadataV1(payload)) invalid();
    return;
  }
  if (owner === "guestInstallationRepository") {
    if (!isGuestInstallationPayload(payload)) invalid();
    return;
  }
  if (owner === "guestAccessRepository") {
    if (!isGuestAccessPayload(payload)) invalid();
    return;
  }
  if (owner === "activeTrackRepository") {
    if (typeof payload !== "string" || !isRegisteredTrackId(payload)) invalid();
    return;
  }
  if (owner === "accountLifecycleRepository") {
    if (key === STORAGE_KEYS.ACCOUNT_SIGN_OUT ? !isAccountSignOutPayload(payload) : key === STORAGE_KEYS.ACCOUNT_DELETION ? !isAccountDeletionPayload(payload) : true) invalid();
    return;
  }
  if (owner === "settingsRepository") {
    if (!isSettingsPayload(payload)) invalid();
    return;
  }
  if (owner === "goalOnboardingPreferenceRepository") {
    if (!isGoalOnboardingPayload(payload)) invalid();
    return;
  }
  if (owner === "accountDataRepository") {
    if (!isCanonicalAccountSyncState(payload) && !isLegacyAccountSyncState(payload)) invalid();
    return;
  }
  if (owner === "contentReportOutboxRepository") {
    if (!isContentReportOutboxEntries(payload)) invalid();
    return;
  }
  if (owner === "notificationSettingsRepository") {
    const valid = key === STORAGE_KEYS.NOTIFICATION_SETTINGS
      ? isCanonicalNotificationSettings(payload) || isLegacyNotificationSettings(payload)
      : key === STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL ? isCanonicalNotificationSettingsJournal(payload) : false;
    if (!valid) invalid();
    return;
  }
  if (owner === "mutationJournalRepository") {
    if (!isLegacyMutationJournalRecord(payload)) invalid();
    return;
  }
  if (owner === "trainingSessionRepository") {
    if (ownerInfo.kind === "index") {
      if (!isStringArray(payload)) invalid();
    } else if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION) {
      if (!nonEmpty(payload)) invalid();
    } else if (!isLegacyTrainingSession(payload)) {
      invalid();
    }
    return;
  }
  if (owner === "trainingSessionDraftRepository") {
    if (!isTrainingSessionDraft(payload)) invalid();
    return;
  }
  if (owner === "foregroundTimerRepository") {
    if (!isForegroundTimerState(payload)) invalid();
    return;
  }
  if (owner === "trainingAttemptRepository") {
    if (ownerInfo.kind === "index" ? !isStringArray(payload) : !isLegacyTrainingAttempt(payload)) invalid();
    if (ownerInfo.kind === "dynamic_prefix" && isRecord(payload) && payload.id !== suffix) invalid();
    return;
  }
  if (owner === "reviewQueueRepository") {
    if (ownerInfo.kind === "index" ? !isStringArray(payload) : !isLegacyReviewQueueEntry(payload)) invalid();
    if (ownerInfo.kind === "dynamic_prefix" && isRecord(payload) && payload.id !== suffix) invalid();
    return;
  }
  if (owner === "trainingSessionResultRepository") {
    if (!isTrainingSessionResult(payload) || (ownerInfo.kind === "dynamic_prefix" && isRecord(payload) && payload.sessionId !== suffix)) invalid();
    return;
  }
  if (owner === "goalRepository") {
    if (ownerInfo.kind !== "dynamic_prefix" || !isGoalRecordShapeForTrack(payload, suffix ?? "")) invalid();
    return;
  }
  if (owner === "learningPlanRepository") {
    if (ownerInfo.kind !== "dynamic_prefix" || (!isLearningPlanV1ForTrack(payload, suffix ?? "") && !isLegacyLearningPlanForTrack(payload, suffix ?? ""))) invalid();
    return;
  }
  invalid();
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const SETTINGS_LANGUAGES = ["system", "en", "pl"] as const;
const SETTINGS_APPEARANCES = ["system", "light", "dark"] as const;

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(nonEmpty);
}

/*
 * The C1 runtime guards intentionally accept only ResolvedContentRef.  This
 * planner is the private pre-marker migrator, so its owner fence must retain a
 * separate legacy reader instead of weakening the public repository guards or
 * silently accepting arbitrary opaque records.
 */
function hasNoUnexpectedKeys(value: JsonRecord, allowed: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isLegacyPackagePin(value: unknown): value is JsonRecord & { packageIdentity: string; packageVersion: string; contentReleaseId: string } {
  return isRecord(value) && hasExactKeys(value, [...LEGACY_PACKAGE_KEYS]) && DIGEST.test(String(value.packageIdentity)) && nonEmpty(value.packageVersion) && nonEmpty(value.contentReleaseId);
}

function isLegacyLearningPlanForTrack(value: unknown, trackId: string): boolean {
  if (!isRecord(value) || !isLegacyPackagePin(value.contentPackagePin) || "artifactSha256" in value) return false;
  const { contentPackagePin, ...rest } = value;
  return isLearningPlanV1ForTrack({ ...rest, artifactSha256: contentPackagePin.packageIdentity }, trackId);
}

function isLegacyContentItemRef(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["trackId", "itemId", "contentVersion", "packagePin"]) &&
    typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) && nonEmpty(value.itemId) && nonEmpty(value.contentVersion) && isLegacyPackagePin(value.packagePin);
}

function isLegacyConfigurationSnapshot(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length > 0 && Object.values(value).every((entry) =>
    typeof entry === "string" || typeof entry === "boolean" || (typeof entry === "number" && Number.isFinite(entry)) ||
    (Array.isArray(entry) && entry.every((item) => typeof item === "string")));
}

function isLegacyOptionOrder(value: unknown): boolean {
  return isRecord(value) && Object.values(value).every((options) => Array.isArray(options) && options.every(nonEmpty) && new Set(options).size === options.length);
}

function isLegacyOccurrence(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["occurrenceId", "item"]) && nonEmpty(value.occurrenceId) && isLegacyContentItemRef(value.item);
}

function isLegacyBranch(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["occurrence", "optionOrder"]) && isLegacyOccurrence(value.occurrence) && isStringArray(value.optionOrder) && new Set(value.optionOrder).size === value.optionOrder.length;
}

function isLegacyConditionalSlot(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["slotId", "sourceOccurrenceId", "ordinaryBranch", "reviewedVariantBranch", "exactSourceBranch", "resolutionRule"]) &&
    nonEmpty(value.slotId) && nonEmpty(value.sourceOccurrenceId) && isLegacyBranch(value.ordinaryBranch) &&
    (value.reviewedVariantBranch === undefined || isLegacyBranch(value.reviewedVariantBranch)) &&
    (value.exactSourceBranch === undefined || isLegacyBranch(value.exactSourceBranch)) &&
    value.resolutionRule === "incorrect_or_partial_after_three_materialized_submissions";
}

function isLegacyTrainingSession(value: unknown): boolean {
  if (!isRecord(value) || !hasNoUnexpectedKeys(value, ["id", "trackId", "modeId", "configurationSnapshot", "requestedLength", "actualLength", "currentItemIndex", "itemOrder", "optionOrderByOccurrence", "conditionalReinsertSlots", "activeForegroundMs", "contentVersion", "packagePin", "taxonomyVersion", "planFingerprint", "status", "startedAt", "completedAt"]) || "itemRefs" in value || value.status === "expired") return false;
  return nonEmpty(value.id) && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) && nonEmpty(value.modeId) &&
    isLegacyConfigurationSnapshot(value.configurationSnapshot) && Number.isFinite(value.requestedLength) && Number.isFinite(value.actualLength) && Number.isFinite(value.currentItemIndex) &&
    Array.isArray(value.itemOrder) && value.itemOrder.every(isLegacyOccurrence) && isLegacyOptionOrder(value.optionOrderByOccurrence) &&
    Array.isArray(value.conditionalReinsertSlots) && value.conditionalReinsertSlots.every(isLegacyConditionalSlot) && Number.isFinite(value.activeForegroundMs) &&
    nonEmpty(value.contentVersion) && isLegacyPackagePin(value.packagePin) &&
    (value.taxonomyVersion === undefined || nonEmpty(value.taxonomyVersion)) &&
    (value.planFingerprint === undefined || (typeof value.planFingerprint === "string" && DIGEST.test(value.planFingerprint))) &&
    (value.status === "active" || value.status === "completed" || value.status === "abandoned") && nonEmpty(value.startedAt) && !Number.isNaN(Date.parse(value.startedAt)) &&
    (value.completedAt === undefined || (nonEmpty(value.completedAt) && !Number.isNaN(Date.parse(value.completedAt))));
}

function isLegacyEvidence(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["sourceItem", "taxonomyOrSkillRefs"]) && isLegacyContentItemRef(value.sourceItem) && Array.isArray(value.taxonomyOrSkillRefs);
}

function isLegacyAttemptResult(value: unknown): boolean {
  return isRecord(value) && hasNoUnexpectedKeys(value, ["kind", "earnedPoints", "maxPoints", "components"]) &&
    ["correct", "partial", "incorrect"].includes(value.kind as string) && typeof value.earnedPoints === "number" && typeof value.maxPoints === "number" &&
    (value.components === undefined || Array.isArray(value.components));
}

function isLegacyJsonValue(value: unknown): boolean {
  if (value === null || typeof value === "string" || typeof value === "boolean") return true;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.every(isLegacyJsonValue);
  return isRecord(value) && Object.values(value).every(isLegacyJsonValue);
}

function isLegacyTrainingAttempt(value: unknown): boolean {
  if (!isRecord(value) || "confidence" in value || "itemType" in value || !hasNoUnexpectedKeys(value, ["id", "sessionId", "trackId", "modeId", "occurrenceId", "item", "response", "result", "reviewEvidence", "answeredAt", "committedAt", "durationMs"])) return false;
  return nonEmpty(value.id) && nonEmpty(value.sessionId) && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) && nonEmpty(value.modeId) && nonEmpty(value.occurrenceId) &&
    isLegacyContentItemRef(value.item) && isLegacyEvidence(value.reviewEvidence) && isLegacyJsonValue(value.response) && isLegacyAttemptResult(value.result) &&
    nonEmpty(value.answeredAt) && !Number.isNaN(Date.parse(value.answeredAt)) && nonEmpty(value.committedAt) && !Number.isNaN(Date.parse(value.committedAt)) &&
    (value.durationMs === undefined || (typeof value.durationMs === "number" && Number.isFinite(value.durationMs)));
}

function isLegacyReviewQueueEntry(value: unknown): boolean {
  return isRecord(value) && !(("kind" in value) || ("priority" in value) || ("retentionPassedAt" in value)) && hasNoUnexpectedKeys(value, ["id", "trackId", "sourceAttemptId", "sourceSessionId", "sourceItem", "taxonomyOrSkillRefs", "reasons", "dueAt", "createdAt", "consecutiveAfterDueSuccesses", "persistent", "lastReviewedAt"]) &&
    nonEmpty(value.id) && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) && nonEmpty(value.sourceAttemptId) && nonEmpty(value.sourceSessionId) &&
    isLegacyContentItemRef(value.sourceItem) && Array.isArray(value.taxonomyOrSkillRefs) && Array.isArray(value.reasons) && value.reasons.every((reason) => typeof reason === "string") &&
    nonEmpty(value.dueAt) && !Number.isNaN(Date.parse(value.dueAt)) && nonEmpty(value.createdAt) && !Number.isNaN(Date.parse(value.createdAt)) &&
    Number.isInteger(value.consecutiveAfterDueSuccesses) && Number(value.consecutiveAfterDueSuccesses) >= 0 && typeof value.persistent === "boolean" &&
    (value.lastReviewedAt === undefined || (nonEmpty(value.lastReviewedAt) && !Number.isNaN(Date.parse(value.lastReviewedAt))));
}

function isLegacyJournalWrite(value: unknown): boolean {
  if (!isRecord(value) || !nonEmpty(value.kind)) return false;
  switch (value.kind) {
    case "put_session": return isLegacyTrainingSession(value.record);
    case "put_attempt": return isLegacyTrainingAttempt(value.record);
    case "put_review_entry":
    case "delete_review_entry": return isLegacyReviewQueueEntry(value.record);
    case "put_review_entry_for_attempt":
    case "update_review_entry":
    case "delete_review_entry_for_attempt": return isLegacyReviewQueueEntry(value.record) && nonEmpty(value.transitionId);
    case "put_session_result": return isTrainingSessionResult(value.record);
    case "put_active_session_draft": return isTrainingSessionDraft(value.record);
    case "delete_active_session_draft": return isTrainingSessionDraft(value.record) && isStringArray(value.submittedOccurrenceIds);
    case "clear_active_session":
    case "clear_active_session_draft": return nonEmpty(value.sessionId);
    case "clear_learning_state": return hasExactKeys(value, ["kind"]);
    default: return false;
  }
}

function isLegacyMutationJournalRecord(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ["journalId", "operation", "status", "createdAt", "sessionId", "trackId", "packagePin", "commandIdentity", "expectedRevisions", "planFingerprint", "writes"])) return false;
  return nonEmpty(value.journalId) && ["start_training_session", "advance_training_session", "submit_training_outcome", "complete_training_session", "abandon_training_session", "finalize_training_session", "set_review_entry", "remove_review_entry", "reset_learning_state"].includes(value.operation as string) &&
    ["journal_durable", "materialized", "verified_pending_clear"].includes(value.status as string) && nonEmpty(value.createdAt) && !Number.isNaN(Date.parse(value.createdAt)) && nonEmpty(value.sessionId) && typeof value.trackId === "string" && isRegisteredTrackId(value.trackId) &&
    (value.packagePin === null || isLegacyPackagePin(value.packagePin)) && isRecord(value.commandIdentity) && hasExactKeys(value.commandIdentity, ["version", "fingerprint"]) && value.commandIdentity.version === 1 && DIGEST.test(String(value.commandIdentity.fingerprint)) &&
    value.journalId === `journal:${value.commandIdentity.fingerprint}` && DIGEST.test(String(value.planFingerprint)) && Array.isArray(value.expectedRevisions) && value.expectedRevisions.every((entry) => isRecord(entry) && hasExactKeys(entry, ["target", "revision"]) && nonEmpty(entry.target) && (entry.revision === null || Number.isSafeInteger(entry.revision))) &&
    Array.isArray(value.writes) && value.writes.length > 0 && value.writes.every(isLegacyJournalWrite);
}

function isGuestInstallationPayload(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ["accountId", "bindingState", "installationId", "localDatasetId"]) || typeof value.installationId !== "string" || typeof value.localDatasetId !== "string" || !UUID_V4.test(value.installationId) || !UUID_V4.test(value.localDatasetId) || value.installationId === value.localDatasetId) return false;
  if (value.bindingState === "account_bound") return typeof value.accountId === "string" && nonEmpty(value.accountId);
  return (value.bindingState === "guest" || value.bindingState === "adoption_pending") && value.accountId === null;
}

function isGuestAccessPayload(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["mode"]) && value.mode === "guest";
}

function isSettingsPayload(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["appearance", "language"]) && SETTINGS_APPEARANCES.includes(value.appearance as (typeof SETTINGS_APPEARANCES)[number]) && SETTINGS_LANGUAGES.includes(value.language as (typeof SETTINGS_LANGUAGES)[number]);
}

function isGoalOnboardingPayload(value: unknown): boolean {
  if (!isRecord(value) || !hasExactKeys(value, ["dismissedTrackIds"]) || !Array.isArray(value.dismissedTrackIds) || !value.dismissedTrackIds.every((trackId) => typeof trackId === "string" && isRegisteredTrackId(trackId))) return false;
  return new Set(value.dismissedTrackIds).size === value.dismissedTrackIds.length;
}

function isAccountSignOutPayload(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["accountId", "lastFailureCode", "operationId", "status"]) && nonEmpty(value.accountId) && typeof value.operationId === "string" && UUID_V4.test(value.operationId) && ["pending", "remoteRevoked", "localCleanupPending"].includes(value.status as string) && (value.lastFailureCode === null || typeof value.lastFailureCode === "string");
}

function isAccountDeletionPayload(value: unknown): boolean {
  return isRecord(value) && hasExactKeys(value, ["accountId", "accountUidHash", "lastFailureCode", "operationId", "operationSecret", "proofId", "status"]) && nonEmpty(value.accountId) && typeof value.accountUidHash === "string" && UUID_V4.test(value.operationId as string) && typeof value.operationSecret === "string" && DIGEST.test(value.operationSecret) && ["remotePending", "remoteDeleted", "localCleanupPending", "complete", "failed"].includes(value.status as string) && (value.proofId === null || typeof value.proofId === "string") && (value.lastFailureCode === null || typeof value.lastFailureCode === "string");
}

function assertArtifacts(value: readonly ActiveContentArtifactDescriptor[]): readonly ActiveContentArtifactDescriptor[] {
  if (!Array.isArray(value) || value.length !== 9) throw new ContentIdentityV2PlannerError("invalid_artifact_set");
  const seen = new Set<string>();
  const bySha = new Map<string, string>();
  const byTrackVersion = new Map<string, string>();
  for (const artifact of value) {
    if (!isRecord(artifact) || !hasExactKeys(artifact, ["trackId", "contentVersion", "artifactSha256", "contentReleaseId", "questionIds"]) || !isCanonicalSafeIdentity(artifact.trackId) || !isCanonicalSafeIdentity(artifact.contentVersion) || !isCanonicalSafeIdentity(artifact.contentReleaseId) || !DIGEST.test(String(artifact.artifactSha256)) || !Array.isArray(artifact.questionIds) || artifact.questionIds.some((id) => !isCanonicalSafeIdentity(id)) || new Set(artifact.questionIds).size !== artifact.questionIds.length) throw new ContentIdentityV2PlannerError("invalid_artifact_set");
    const key = canonicalSerialize({ trackId: artifact.trackId, contentVersion: artifact.contentVersion, artifactSha256: artifact.artifactSha256, contentReleaseId: artifact.contentReleaseId });
    if (seen.has(key)) throw new ContentIdentityV2PlannerError("invalid_artifact_set");
    const descriptor = canonicalSerialize({ trackId: artifact.trackId, contentVersion: artifact.contentVersion, artifactSha256: artifact.artifactSha256, contentReleaseId: artifact.contentReleaseId });
    const existingSha = bySha.get(String(artifact.artifactSha256));
    if (existingSha !== undefined && existingSha !== descriptor) throw new ContentIdentityV2PlannerError("invalid_artifact_set");
    const trackVersion = canonicalSerialize({ trackId: artifact.trackId, contentVersion: artifact.contentVersion });
    const existingTrackVersion = byTrackVersion.get(trackVersion);
    if (existingTrackVersion !== undefined && existingTrackVersion !== descriptor) throw new ContentIdentityV2PlannerError("invalid_artifact_set");
    bySha.set(String(artifact.artifactSha256), descriptor);
    byTrackVersion.set(trackVersion, descriptor);
    seen.add(key);
  }
  return Object.freeze(value.map((artifact) => Object.freeze({ ...artifact, questionIds: Object.freeze([...artifact.questionIds]) })));
}

function packageArtifact(pin: unknown, trackId: unknown, contentVersion: unknown, artifacts: readonly ActiveContentArtifactDescriptor[]): string {
  if (!isRecord(pin) || !hasExactKeys(pin, LEGACY_PACKAGE_KEYS) || !isCanonicalSafeIdentity(trackId) || !isCanonicalSafeIdentity(contentVersion) || !DIGEST.test(String(pin.packageIdentity)) || !isCanonicalSafeIdentity(pin.packageVersion) || !isCanonicalSafeIdentity(pin.contentReleaseId)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const found = artifacts.find((artifact) => artifact.artifactSha256 === pin.packageIdentity && artifact.trackId === trackId && artifact.contentVersion === contentVersion && artifact.contentVersion === pin.packageVersion && artifact.contentReleaseId === pin.contentReleaseId);
  if (!found) throw new ContentIdentityV2PlannerError("unmapped_package_identity");
  return found.artifactSha256;
}

function contextFor(kind: "history" | "active" | "review", payload: JsonRecord, fallback: string): LegacyContentTombstoneContext {
  const sessionId = nonEmpty(payload.sessionId) ? payload.sessionId : nonEmpty(payload.id) ? payload.id : fallback;
  if (kind === "review") return { kind: "unavailable_review", reviewId: nonEmpty(payload.id) ? payload.id : fallback };
  return { kind: kind === "active" ? "unavailable_active" : "archival_history", sessionId };
}

function mapRef(value: unknown, context: LegacyContentTombstoneContext, artifacts: readonly ActiveContentArtifactDescriptor[], path: string): { value: unknown; binding: ContentIdentityV2IdentityBinding } {
  try {
    const resolution = mapLegacyContentIdentity(value, artifacts, context);
    return { value: resolution.kind === "resolved" ? resolution.ref : resolution.tombstone, binding: Object.freeze({ path, resolution }) };
  } catch (error) {
    if (error instanceof ContentIdentityV2PlannerError) throw error;
    throw new ContentIdentityV2PlannerError("owner_guard_failed");
  }
}

function mapOptionalRef(value: unknown, context: LegacyContentTombstoneContext, artifacts: readonly ActiveContentArtifactDescriptor[], path: string, identities: ContentIdentityV2IdentityBinding[], identityOverride?: LegacyIdentityOverride): unknown {
  const mapped = mapRef(identityOverride && isRecord(value) ? { ...value, ...identityOverride } : value, context, artifacts, path);
  identities.push(mapped.binding);
  return mapped.value;
}

function mapOccurrence(value: unknown, context: LegacyContentTombstoneContext, artifacts: readonly ActiveContentArtifactDescriptor[], path: string, identities: ContentIdentityV2IdentityBinding[], identityOverride?: LegacyIdentityOverride): unknown {
  if (!isRecord(value) || !nonEmpty(value.occurrenceId)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  return { ...value, item: mapOptionalRef(value.item, context, artifacts, `${path}.item`, identities, identityOverride) };
}

function mapBranch(value: unknown, context: LegacyContentTombstoneContext, artifacts: readonly ActiveContentArtifactDescriptor[], path: string, identities: ContentIdentityV2IdentityBinding[], identityOverride?: LegacyIdentityOverride): unknown {
  if (!isRecord(value) || !isRecord(value.occurrence)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  return { ...value, occurrence: mapOccurrence(value.occurrence, context, artifacts, `${path}.occurrence`, identities, identityOverride) };
}

function transformSession(payload: unknown, context: TransformContext): TransformResult {
  if (!isRecord(payload) || !nonEmpty(payload.id) || !nonEmpty(payload.trackId) || !nonEmpty(payload.contentVersion) || !Array.isArray(payload.itemOrder) || !nonEmpty(payload.status) || !["active", "completed", "abandoned"].includes(payload.status)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const identities: ContentIdentityV2IdentityBinding[] = [];
  const contextKind = payload.status === "active" ? "active" : "history";
  const tombstoneContext = contextFor(contextKind, payload, `${context.key}:session`);
  let artifactSha256: string | undefined;
  let topLevelIdentityOverride: LegacyIdentityOverride | undefined;
  try {
    artifactSha256 = packageArtifact(payload.packagePin, payload.trackId, payload.contentVersion, context.artifacts);
  } catch (error) {
    if (!(error instanceof ContentIdentityV2PlannerError) || error.code !== "unmapped_package_identity") throw error;
    topLevelIdentityOverride = { trackId: payload.trackId, contentVersion: payload.contentVersion, packagePin: payload.packagePin };
  }
  const itemOrder = payload.itemOrder.map((occurrence, index) => mapOccurrence(occurrence, tombstoneContext, context.artifacts, `payload.itemOrder[${index}]`, identities, topLevelIdentityOverride));
  if (new Set(itemOrder.map((occurrence) => isRecord(occurrence) ? occurrence.occurrenceId : null)).size !== itemOrder.length) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const slots = Array.isArray(payload.conditionalReinsertSlots)
    ? payload.conditionalReinsertSlots.map((slot, index) => {
      if (!isRecord(slot)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
      return {
        ...slot,
        ordinaryBranch: mapBranch(slot.ordinaryBranch, tombstoneContext, context.artifacts, `payload.conditionalReinsertSlots[${index}].ordinaryBranch`, identities, topLevelIdentityOverride),
        ...(slot.reviewedVariantBranch ? { reviewedVariantBranch: mapBranch(slot.reviewedVariantBranch, tombstoneContext, context.artifacts, `payload.conditionalReinsertSlots[${index}].reviewedVariantBranch`, identities, topLevelIdentityOverride) } : {}),
        ...(slot.exactSourceBranch ? { exactSourceBranch: mapBranch(slot.exactSourceBranch, tombstoneContext, context.artifacts, `payload.conditionalReinsertSlots[${index}].exactSourceBranch`, identities, topLevelIdentityOverride) } : {}),
      };
    })
    : payload.conditionalReinsertSlots;
  const { packagePin: _packagePin, ...withoutPin } = cloneJson(payload);
  // The session-level package identity is the provenance boundary for every
  // occurrence and preallocated branch.  A stale/unknown top-level pin must
  // never leave a mixture of resolved children and tombstones behind.
  if (artifactSha256 === undefined && identities.some((binding) => binding.resolution.kind === "resolved")) {
    throw new ContentIdentityV2PlannerError("owner_guard_failed");
  }
  return { value: { ...withoutPin, ...(artifactSha256 === undefined ? {} : { artifactSha256 }), itemOrder, ...(slots === undefined ? {} : { conditionalReinsertSlots: slots }) }, identity: identities };
}

function transformAttempt(payload: unknown, context: TransformContext): TransformResult {
  if (!isRecord(payload) || !nonEmpty(payload.id) || !nonEmpty(payload.sessionId) || !nonEmpty(payload.trackId) || !nonEmpty(payload.occurrenceId) || !isRecord(payload.item) || !isRecord(payload.reviewEvidence) || !Array.isArray(payload.reviewEvidence.taxonomyOrSkillRefs) || !isRecord(payload.result)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const identities: ContentIdentityV2IdentityBinding[] = [];
  const session = context.sessionPreflight.get(payload.sessionId);
  const tombstoneContext = session && !session.mapped ? contextFor(session.kind, { ...payload, sessionId: payload.sessionId }, `${context.key}:attempt`) : contextFor("history", payload, `${context.key}:attempt`);
  const identityOverride = session && !session.mapped ? { trackId: session.trackId, contentVersion: session.contentVersion, packagePin: session.packagePin } : undefined;
  const item = mapOptionalRef(payload.item, tombstoneContext, context.artifacts, "payload.item", identities, identityOverride);
  const evidence = payload.reviewEvidence;
  const sourceItem = mapOptionalRef(evidence.sourceItem, tombstoneContext, context.artifacts, "payload.reviewEvidence.sourceItem", identities, identityOverride);
  return { value: { ...cloneJson(payload), item, reviewEvidence: { ...cloneJson(evidence), sourceItem } }, identity: identities };
}

function transformReview(payload: unknown, context: TransformContext): TransformResult {
  if (!isRecord(payload) || !nonEmpty(payload.id) || !nonEmpty(payload.trackId) || !nonEmpty(payload.sourceAttemptId) || !nonEmpty(payload.sourceSessionId) || !isRecord(payload.sourceItem) || !Array.isArray(payload.taxonomyOrSkillRefs) || !Array.isArray(payload.reasons) || !nonEmpty(payload.dueAt) || !nonEmpty(payload.createdAt) || typeof payload.persistent !== "boolean") throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const identities: ContentIdentityV2IdentityBinding[] = [];
  const session = context.sessionPreflight.get(payload.sourceSessionId);
  const reviewContext = contextFor("review", payload, `${context.key}:review`);
  const identityOverride = session && !session.mapped ? { trackId: session.trackId, contentVersion: session.contentVersion, packagePin: session.packagePin } : undefined;
  const sourceItem = mapOptionalRef(payload.sourceItem, reviewContext, context.artifacts, "payload.sourceItem", identities, identityOverride);
  return { value: { ...cloneJson(payload), sourceItem }, identity: identities };
}

function transformPlan(payload: unknown, context: TransformContext): TransformResult {
  if (!isRecord(payload) || !nonEmpty(payload.trackId) || !nonEmpty(payload.contentVersion)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const artifactSha256 = packageArtifact(payload.contentPackagePin, payload.trackId, payload.contentVersion, context.artifacts);
  const { contentPackagePin: _contentPackagePin, ...withoutPin } = cloneJson(payload);
  return { value: { ...withoutPin, artifactSha256 }, identity: [] };
}

function transformNotificationIdentity(value: unknown, context: TransformContext): unknown {
  if (value === null) return null;
  if (!isRecord(value) || !nonEmpty(value.trackId) || !nonEmpty(value.contentVersion)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const artifactSha256 = packageArtifact(value.contentPackagePin, value.trackId, value.contentVersion, context.artifacts);
  const { contentPackagePin: _contentPackagePin, ...withoutPin } = cloneJson(value);
  return { ...withoutPin, artifactSha256 };
}

function transformNotification(payload: unknown, context: TransformContext): TransformResult {
  if (!isRecord(payload)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const value = cloneJson(payload) as JsonRecord;
  if ("identity" in value) value.identity = transformNotificationIdentity(value.identity, context);
  if (isRecord(value.pending) && "expectedIdentity" in value.pending) value.pending = { ...value.pending, expectedIdentity: transformNotificationIdentity(value.pending.expectedIdentity, context) };
  if ("expectedIdentity" in value) value.expectedIdentity = transformNotificationIdentity(value.expectedIdentity, context);
  return { value, identity: [] };
}

function transformJournalWrite(value: unknown, context: TransformContext, path: string, identities: ContentIdentityV2IdentityBinding[]): unknown {
  if (!isRecord(value) || !nonEmpty(value.kind)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  if (value.kind === "put_session") {
    const transformed = transformSession(value.record, context);
    identities.push(...transformed.identity.map((binding) => Object.freeze({ ...binding, path: `${path}.record.${binding.path.replace(/^payload\./u, "")}` })));
    return { ...cloneJson(value), record: transformed.value };
  }
  if (value.kind === "put_attempt") {
    const transformed = transformAttempt(value.record, context);
    identities.push(...transformed.identity.map((binding) => Object.freeze({ ...binding, path: `${path}.record.${binding.path.replace(/^payload\./u, "")}` })));
    return { ...cloneJson(value), record: transformed.value };
  }
  if (["put_review_entry", "put_review_entry_for_attempt", "update_review_entry", "delete_review_entry", "delete_review_entry_for_attempt"].includes(value.kind)) {
    const transformed = transformReview(value.record, context);
    identities.push(...transformed.identity.map((binding) => Object.freeze({ ...binding, path: `${path}.record.${binding.path.replace(/^payload\./u, "")}` })));
    return { ...cloneJson(value), record: transformed.value };
  }
  return cloneJson(value);
}

function transformJournal(payload: unknown, context: TransformContext): TransformResult {
  if (!isRecord(payload) || !nonEmpty(payload.trackId) || !Array.isArray(payload.writes)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const identities: ContentIdentityV2IdentityBinding[] = [];
  let artifactSha256: string | null | undefined;
  if (payload.packagePin === null) artifactSha256 = null;
  else {
    try {
      artifactSha256 = packageArtifact(payload.packagePin, payload.trackId, inferContentVersion(payload), context.artifacts);
    } catch (error) {
      if (!(error instanceof ContentIdentityV2PlannerError) || error.code !== "unmapped_package_identity") throw error;
    }
  }
  const writes = payload.writes.map((write, index) => transformJournalWrite(write, context, `payload.writes[${index}]`, identities));
  const { packagePin: _packagePin, ...withoutPin } = cloneJson(payload);
  return { value: { ...withoutPin, ...(artifactSha256 === undefined ? {} : { artifactSha256 }), writes }, identity: identities };
}

function inferContentVersion(payload: JsonRecord): string {
  if (nonEmpty(payload.contentVersion)) return payload.contentVersion;
  const write = Array.isArray(payload.writes) ? payload.writes.find((candidate): candidate is JsonRecord => isRecord(candidate) && isRecord(candidate.record) && nonEmpty(candidate.record.contentVersion)) : undefined;
  if (write && isRecord(write.record) && nonEmpty(write.record.contentVersion)) return write.record.contentVersion;
  const item = Array.isArray(payload.writes) ? payload.writes.find((candidate): candidate is JsonRecord => isRecord(candidate) && isRecord(candidate.record) && isRecord(candidate.record.item)) : undefined;
  if (item && isRecord(item.record) && isRecord(item.record.item) && nonEmpty(item.record.item.contentVersion)) return item.record.item.contentVersion;
  const sourceItem = Array.isArray(payload.writes) ? payload.writes.find((candidate): candidate is JsonRecord => isRecord(candidate) && isRecord(candidate.record) && isRecord(candidate.record.sourceItem)) : undefined;
  if (sourceItem && isRecord(sourceItem.record) && isRecord(sourceItem.record.sourceItem) && nonEmpty(sourceItem.record.sourceItem.contentVersion)) return sourceItem.record.sourceItem.contentVersion;
  const evidenceItem = Array.isArray(payload.writes) ? payload.writes.find((candidate): candidate is JsonRecord => isRecord(candidate) && isRecord(candidate.record) && isRecord(candidate.record.reviewEvidence) && isRecord(candidate.record.reviewEvidence.sourceItem)) : undefined;
  if (evidenceItem && isRecord(evidenceItem.record) && isRecord(evidenceItem.record.reviewEvidence) && isRecord(evidenceItem.record.reviewEvidence.sourceItem) && nonEmpty(evidenceItem.record.reviewEvidence.sourceItem.contentVersion)) return evidenceItem.record.reviewEvidence.sourceItem.contentVersion;
  throw new ContentIdentityV2PlannerError("owner_guard_failed");
}

const ACCOUNT_RECORD_TYPES: readonly SyncableRecordType[] = [
  "active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry", "goal", "learning_plan",
];

function isSyncableAccountRecordType(value: unknown): value is SyncableRecordType {
  return typeof value === "string" && ACCOUNT_RECORD_TYPES.includes(value as SyncableRecordType);
}

function accountMutationId(accountId: string, record: Readonly<{ recordType: SyncableRecordType; recordId: string; trackId: string; fingerprint: string }>, expectedVersion: number | null): string {
  return `mutation_${sha256Utf8(canonicalSerialize({ accountId, key: accountDataRecordKey(record), expectedVersion, fingerprint: record.fingerprint }))}`;
}

function recalculateAccountRecord(value: JsonRecord, state: JsonRecord, accountId: string | null): JsonRecord {
  if (!isSyncableAccountRecordType(value.recordType) || !nonEmpty(value.recordId) || !nonEmpty(value.trackId)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const fingerprint = accountDataRecordFingerprint({ recordId: value.recordId, recordType: value.recordType, state, trackId: value.trackId });
  const result: JsonRecord = { ...value, fingerprint, state };
  // The current account protocol binds an outbox mutation to the canonical
  // record key, expected version, and record fingerprint.  A sync-plan
  // payload has no mutationId of its own; its enclosing item is handled below.
  if (Object.hasOwn(value, "mutationId") && nonEmpty(accountId)) {
    if (value.expectedVersion !== null && (!Number.isSafeInteger(value.expectedVersion) || Number(value.expectedVersion) < 0)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
    result.mutationId = accountMutationId(accountId, { recordType: value.recordType, recordId: value.recordId, trackId: value.trackId, fingerprint }, value.expectedVersion as number | null);
  }
  return result;
}

function recalculateSyncPlan(value: JsonRecord, accountId: string | null): JsonRecord {
  if (!nonEmpty(accountId)) return value;
  if (!Array.isArray(value.items) || !Number.isSafeInteger(value.snapshotVersion) || !Number.isSafeInteger(value.expectedAccountRevision) || !Number.isSafeInteger(value.highWatermark)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const planItems = value.items.map((item) => {
    if (!isRecord(item) || !nonEmpty(item.recordKey) || !nonEmpty(item.mutationId) || !isRecord(item.payload) || !nonEmpty(item.payload.recordId) || !isSyncableAccountRecordType(item.payload.recordType) || !nonEmpty(item.payload.trackId) || typeof item.payload.fingerprint !== "string") throw new ContentIdentityV2PlannerError("owner_guard_failed");
    return { sequence: item.sequence, recordKey: item.recordKey, mutationId: item.mutationId, fingerprint: item.payload.fingerprint };
  });
  const planId = `plan_${sha256Utf8(canonicalJsonV1({ accountId, snapshotVersion: value.snapshotVersion, expectedAccountRevision: value.expectedAccountRevision, highWatermark: value.highWatermark, items: planItems }))}`;
  return { ...value, planId };
}

function transformAccountRecord(record: unknown, context: TransformContext, path: string, identities: ContentIdentityV2IdentityBinding[], accountId: string | null): unknown {
  if (!isRecord(record) || !nonEmpty(record.recordType) || !isRecord(record.state)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const state = record.state;
  if (state.deleted === true) {
    const { packagePin: _packagePin, ...withoutPin } = cloneJson(state);
    return recalculateAccountRecord(cloneJson(record) as JsonRecord, withoutPin, accountId);
  }
  if (record.recordType === "active_track") {
    const { packagePin: _packagePin, ...metadata } = cloneJson(state);
    return recalculateAccountRecord(cloneJson(record) as JsonRecord, metadata, accountId);
  }
  if (record.recordType === "training_session_summary") {
    const transformed = transformSession(state, context);
    identities.push(...transformed.identity.map((binding) => Object.freeze({ ...binding, path: `${path}.state.${binding.path.replace(/^payload\./u, "")}` })));
    if (!isRecord(transformed.value)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
    return recalculateAccountRecord(cloneJson(record) as JsonRecord, transformed.value, accountId);
  }
  if (record.recordType === "training_session_result") return recalculateAccountRecord(cloneJson(record) as JsonRecord, cloneJson(state), accountId);
  if (record.recordType === "training_attempt") {
    const transformed = transformAttempt(state, context);
    identities.push(...transformed.identity.map((binding) => Object.freeze({ ...binding, path: `${path}.state.${binding.path.replace(/^payload\./u, "")}` })));
    if (!isRecord(transformed.value)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
    return recalculateAccountRecord(cloneJson(record) as JsonRecord, transformed.value, accountId);
  }
  if (record.recordType === "review_queue_entry") {
    const transformed = transformReview(state, context);
    identities.push(...transformed.identity.map((binding) => Object.freeze({ ...binding, path: `${path}.state.${binding.path.replace(/^payload\./u, "")}` })));
    if (!isRecord(transformed.value)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
    return recalculateAccountRecord(cloneJson(record) as JsonRecord, transformed.value, accountId);
  }
  if (record.recordType === "learning_plan") {
    const transformed = transformPlan(isRecord(state.plan) ? state.plan : state, context).value;
    const nextState = isRecord(state.plan) ? { ...cloneJson(state), plan: transformed } : transformed;
    if (!isRecord(nextState)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
    return recalculateAccountRecord(cloneJson(record) as JsonRecord, nextState, accountId);
  }
  // Goal and unknown metadata are not content owners.  They pass through only
  // after the explicit account record guard above; no package pin is mapped.
  return recalculateAccountRecord(cloneJson(record) as JsonRecord, cloneJson(state), accountId);
}

function transformAccountSync(payload: unknown, context: TransformContext): TransformResult {
  if (!isRecord(payload) || !Array.isArray(payload.outbox) || !isRecord(payload.acknowledged)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const identities: ContentIdentityV2IdentityBinding[] = [];
  const value = cloneJson(payload) as JsonRecord;
  const accountId = nonEmpty(value.accountId) ? value.accountId : null;
  const outbox = value.outbox as unknown[];
  value.outbox = outbox.map((entry: unknown, index: number) => transformAccountRecord(entry, context, `payload.outbox[${index}]`, identities, accountId));
  if (isRecord(value.syncPlan) && Array.isArray(value.syncPlan.items)) {
    const syncPlan = value.syncPlan;
    const syncPlanItems = syncPlan.items as unknown[];
    value.syncPlan = recalculateSyncPlan({ ...syncPlan, items: syncPlanItems.map((item: unknown, index: number) => {
      if (!isRecord(item)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
      const transformedPayload = transformAccountRecord(item.payload, context, `payload.syncPlan.items[${index}].payload`, identities, accountId);
      if (!isRecord(transformedPayload) || !isRecord(item.payload)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
      const nextItem: JsonRecord = { ...item, payload: transformedPayload };
      if (nonEmpty(accountId) && isSyncableAccountRecordType(transformedPayload.recordType) && nonEmpty(transformedPayload.recordId) && nonEmpty(transformedPayload.trackId) && typeof transformedPayload.fingerprint === "string") {
        if (nextItem.expectedVersion !== null && (!Number.isSafeInteger(nextItem.expectedVersion) || Number(nextItem.expectedVersion) < 0)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
        nextItem.mutationId = accountMutationId(accountId, { recordType: transformedPayload.recordType, recordId: transformedPayload.recordId, trackId: transformedPayload.trackId, fingerprint: transformedPayload.fingerprint }, nextItem.expectedVersion as number | null);
      }
      return nextItem;
    }) }, accountId);
  }
  if (isRecord(value.materialization) && Array.isArray(value.materialization.guestBackup)) {
    value.materialization = { ...value.materialization, guestBackup: value.materialization.guestBackup.map((entry, index) => transformGuestBackup(entry, context, `payload.materialization.guestBackup[${index}]`, identities)) };
  }
  return { value, identity: identities };
}

function transformGuestBackup(value: unknown, context: TransformContext, path: string, identities: ContentIdentityV2IdentityBinding[]): unknown {
  if (!isRecord(value) || !hasExactKeys(value, ["key", "value"]) || !nonEmpty(value.key) || typeof value.value !== "string" || !isGuestOwnedLearningKey(value.key)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const nestedKey = value.key;
  const nestedOwner = ownerForKey(nestedKey);
  if (nestedKey === STORAGE_KEYS.METADATA) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const nestedEnvelope = parseEnvelope(value.value, nestedKey);
  assertLegacyOwnerPayload(nestedKey, nestedOwner.entry.owner, nestedEnvelope.payload);
  const nestedContext: TransformContext = Object.freeze({ ...context, key: nestedKey, entry: nestedOwner.entry, kind: nestedOwner.kind });
  const result = dispatchOwner(nestedEnvelope.payload, nestedContext);
  const nestedPayload = makeV2Payload(nestedKey, nestedOwner.entry.owner, nestedEnvelope.revision, result.value, result.identity, preservationFor(nestedOwner.entry.owner, nestedKey, nestedEnvelope.revision, nestedEnvelope.payload));
  identities.push(...result.identity.map((binding) => Object.freeze({ ...binding, path: `${path}.value.payload.${binding.path}` })));
  return { ...cloneJson(value), value: canonicalSerialize({ schemaIdentity: CANONICAL_RECORD_SCHEMA, revision: nestedEnvelope.revision, payload: nestedPayload }) };
}

function transformReport(payload: unknown): TransformResult {
  if (!Array.isArray(payload)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
  const seen = new Set<string>();
  for (const entry of payload) {
    if (!isRecord(entry) || !isRecord(entry.input) || !nonEmpty(entry.input.clientSubmissionId)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
    if (seen.has(entry.input.clientSubmissionId)) throw new ContentIdentityV2PlannerError("relationship_invalid");
    seen.add(entry.input.clientSubmissionId);
  }
  // `itemId` remains only in this named transport owner. It is never added to
  // an identity binding and is rejected everywhere else by the v2 contract.
  return { value: cloneJson(payload), identity: [] };
}

function dispatchOwner(payload: unknown, context: TransformContext): TransformResult {
  const owner = context.entry.owner;
  if (owner === "storageMetadataRepository") throw new ContentIdentityV2PlannerError("owner_guard_failed");
  if (owner === "guestInstallationRepository" || owner === "guestAccessRepository" || owner === "settingsRepository" || owner === "goalOnboardingPreferenceRepository" || owner === "accountLifecycleRepository") return { value: cloneJson(payload), identity: [] };
  if (owner === "contentReportOutboxRepository") return transformReport(payload);
  if (owner === "notificationSettingsRepository") return transformNotification(payload, context);
  if (owner === "mutationJournalRepository") return transformJournal(payload, context);
  if (owner === "accountDataRepository") return transformAccountSync(payload, context);
  if (owner === "activeTrackRepository") {
    if (typeof payload !== "string" || !isRegisteredTrackId(payload)) throw new ContentIdentityV2PlannerError("owner_guard_failed");
    return { value: payload, identity: [] };
  }
  if (owner === "trainingSessionRepository") {
    if (context.kind === "index" || context.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION) return { value: cloneJson(payload), identity: [] };
    return transformSession(payload, context);
  }
  if (owner === "trainingAttemptRepository") return context.kind === "index" ? { value: cloneJson(payload), identity: [] } : transformAttempt(payload, context);
  if (owner === "reviewQueueRepository") return context.kind === "index" ? { value: cloneJson(payload), identity: [] } : transformReview(payload, context);
  if (owner === "trainingSessionDraftRepository" || owner === "foregroundTimerRepository") return { value: cloneJson(payload), identity: [] };
  if (owner === "learningPlanRepository") return transformPlan(payload, context);
  if (owner === "trainingSessionResultRepository") return { value: cloneJson(payload), identity: [] };
  if (owner === "goalRepository") return { value: cloneJson(payload), identity: [] };
  throw new ContentIdentityV2PlannerError("unregistered_key");
}

function readPath(value: unknown, segments: readonly string[]): readonly unknown[] {
  if (segments.length === 0) return [value];
  if (segments[0] === "[*]") {
    if (!Array.isArray(value)) return [];
    return value.flatMap((child) => readPath(child, segments.slice(1)));
  }
  if (segments[0]?.endsWith("[*]")) {
    const property = segments[0].slice(0, -3);
    if (!isRecord(value) || !Array.isArray(value[property])) return [];
    return value[property].flatMap((child) => readPath(child, segments.slice(1)));
  }
  if (!isRecord(value) || !(segments[0] as string in value)) return [];
  return readPath(value[segments[0] as string], segments.slice(1));
}

function pathValues(value: unknown, path: string): readonly unknown[] {
  return readPath(value, path.split("."));
}

function digestPaths(value: unknown, paths: readonly string[]): string {
  return contentIdentityV2Digest(paths.map((path) => ({ path, values: pathValues(value, path) })));
}

function recordIdFor(owner: string, value: unknown): string | null {
  if (!isRecord(value)) return null;
  if (nonEmpty(value.id)) return value.id;
  if (nonEmpty(value.recordId)) return value.recordId;
  if (owner === "contentReportOutboxRepository") return null;
  if (isRecord(value.identity) && nonEmpty(value.identity.planId)) return value.identity.planId;
  if (nonEmpty(value.planId)) return value.planId;
  return null;
}

function preservationFor(owner: string, key: string, revision: number, payload: unknown): ContentIdentityV2Preservation {
  const paths = PRESERVATION_PATHS[owner] ?? PRESERVATION_FALLBACK;
  return Object.freeze({
    sourceKey: key,
    sourceRevision: revision,
    recordId: recordIdFor(owner, payload),
    idsDigest: digestPaths(payload, paths.ids),
    revisionsDigest: digestPaths(payload, paths.revisions),
    orderingDigest: digestPaths(payload, paths.ordering),
    resultsDigest: digestPaths(payload, paths.results),
    timestampsDigest: digestPaths(payload, paths.timestamps),
    answersDigest: digestPaths(payload, paths.answers),
    fingerprintDigest: digestPaths(payload, paths.fingerprints),
  });
}

function makeV2Payload(key: string, owner: string, revision: number, value: unknown, identity: readonly ContentIdentityV2IdentityBinding[], preservation: ContentIdentityV2Preservation): ContentIdentityV2Record {
  try {
    return createContentIdentityV2Record({ schemaIdentity: CONTENT_IDENTITY_V2_SCHEMA, owner, key, sourceRevision: revision, value, identity, preservation });
  } catch (error) {
    if (error instanceof ContentIdentityV2PlannerError) throw error;
    throw new ContentIdentityV2PlannerError("owner_guard_failed");
  }
}

function makeEnvelope(revision: number, payload: ContentIdentityV2Record): string {
  return canonicalSerialize({ schemaIdentity: CANONICAL_RECORD_SCHEMA, revision, payload });
}

function targetHasTombstone(record: ContentIdentityV2Record | undefined): boolean {
  return Boolean(record?.identity.some((binding) => binding.resolution.kind === "tombstone"));
}

function sourceSessionIsUnavailable(key: string, transformed: ReadonlyMap<string, ContentIdentityV2Record>): boolean {
  const record = transformed.get(key);
  return targetHasTombstone(record) || (isRecord(record?.value) && record.value.status === "active" && !DIGEST.test(String(record.value.artifactSha256)));
}

function buildTargets(source: readonly ContentIdentityMigrationRawRecord[], artifacts: readonly ActiveContentArtifactDescriptor[]): Readonly<{ records: readonly ContentIdentityMigrationRawRecord[]; preservation: readonly ContentIdentityV2Preservation[] }> {
  const sourceMeta = new Map<string, { envelope: CanonicalEnvelope; owner: Readonly<{ entry: ContentIdentityInventoryRegistryEntry; kind: ContentIdentityInventoryKeyKind }> }>();
  for (const record of source) {
    const owner = ownerForKey(record.key);
    const envelope = parseEnvelope(record.raw, record.key);
    assertLegacyOwnerPayload(record.key, owner.entry.owner, envelope.payload);
    sourceMeta.set(record.key, { envelope, owner });
  }
  const sessionPreflight = new Map<string, LegacySessionPreflight>();
  for (const [key, meta] of sourceMeta) {
    if (meta.owner.entry.owner !== "trainingSessionRepository" || meta.owner.kind !== "dynamic_prefix" || !isRecord(meta.envelope.payload)) continue;
    const payload = meta.envelope.payload;
    let mapped = false;
    try {
      packageArtifact(payload.packagePin, payload.trackId, payload.contentVersion, artifacts);
      mapped = true;
    } catch (error) {
      if (!(error instanceof ContentIdentityV2PlannerError) || error.code !== "unmapped_package_identity") throw error;
    }
    sessionPreflight.set(payload.id as string, Object.freeze({
      kind: payload.status === "active" ? "active" : "history",
      trackId: payload.trackId as string,
      contentVersion: payload.contentVersion as string,
      packagePin: payload.packagePin,
      mapped,
    }));
  }
  const transformed = new Map<string, ContentIdentityV2Record>();
  const preservation: ContentIdentityV2Preservation[] = [];
  const ordered = [...source].filter((record) => record.key !== STORAGE_KEYS.METADATA).sort((left, right) => left.key.localeCompare(right.key));
  // First pass transforms owner records. Pointer cleanup in the second pass
  // is explicit and only depends on transformed session records.
  for (const record of ordered) {
    const meta = sourceMeta.get(record.key)!;
    const context: TransformContext = Object.freeze({ key: record.key, entry: meta.owner.entry, kind: meta.owner.kind, artifacts, sessionPreflight });
    const result = dispatchOwner(meta.envelope.payload, context);
    const preservationEntry = preservationFor(meta.owner.entry.owner, record.key, meta.envelope.revision, meta.envelope.payload);
    preservation.push(preservationEntry);
    const target = makeV2Payload(record.key, meta.owner.entry.owner, meta.envelope.revision, result.value, result.identity, preservationEntry);
    transformed.set(record.key, target);
  }
  for (const record of ordered) {
    if (record.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION || record.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT || record.key === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) {
      const envelope = sourceMeta.get(record.key)!.envelope;
      const sessionId = record.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION ? envelope.payload : isRecord(envelope.payload) ? envelope.payload.sessionId : null;
      if (nonEmpty(sessionId)) {
        const sessionKey = `${STORAGE_NAMESPACE}training-session:${sessionId}`;
        if (sourceSessionIsUnavailable(sessionKey, transformed)) {
          transformed.delete(record.key);
        }
      }
    }
    if (record.key === STORAGE_KEYS.ACTIVE_JOURNAL) {
      const journal = transformed.get(record.key);
      const unavailable = targetHasTombstone(journal) || (isRecord(journal?.value) && journal.value.artifactSha256 !== null && !DIGEST.test(String(journal.value.artifactSha256)));
      if (unavailable) transformed.delete(record.key);
    }
  }
  return Object.freeze({
    records: Object.freeze([...transformed.entries()].sort(([left], [right]) => left.localeCompare(right)).map(([key, payload]) => Object.freeze({ key, raw: makeEnvelope(payload.sourceRevision, payload) }))),
    preservation: Object.freeze(preservation.sort((left, right) => left.sourceKey.localeCompare(right.sourceKey))),
  });
}

function unwrapTarget(raw: string, key: string): ContentIdentityV2Record {
  const envelope = parseEnvelope(raw, key);
  if (!createContentIdentityV2Record || !isRecord(envelope.payload)) throw new ContentIdentityV2PlannerError("malformed_envelope");
  try { return createContentIdentityV2Record(envelope.payload); } catch { throw new ContentIdentityV2PlannerError("owner_guard_failed"); }
}

function comparableIdentity(value: unknown): string | null {
  if (isResolvedContentRef(value)) return canonicalSerialize(value);
  if (isContentIdentityTombstone(value)) {
    // A single legacy source item can be materialized by more than one owner
    // (session, attempt, review). The owner-specific tombstone kind is
    // intentionally different, but relationship verification compares the
    // immutable content identity and provenance rather than that context.
    return canonicalSerialize({
      trackId: value.trackId,
      questionId: value.questionId,
      contentVersion: value.contentVersion,
      reason: value.reason,
      legacyIdentityDigest: value.legacyIdentityDigest,
      migrationVersion: value.migrationVersion,
    });
  }
  return null;
}

function identityParts(value: unknown): Readonly<{ trackId: string; contentVersion: string; artifactSha256?: string }> | null {
  if (isResolvedContentRef(value)) return { trackId: value.trackId, contentVersion: value.contentVersion, artifactSha256: value.artifactSha256 };
  if (isContentIdentityTombstone(value)) return { trackId: value.trackId, contentVersion: value.contentVersion };
  return null;
}

function assertSessionReference(value: unknown, session: JsonRecord): void {
  if (!nonEmpty(session.trackId) || !nonEmpty(session.contentVersion)) throw new ContentIdentityV2PlannerError("relationship_invalid");
  const identity = identityParts(value);
  if (!identity || identity.trackId !== session.trackId || identity.contentVersion !== session.contentVersion || (identity.artifactSha256 !== undefined && (!DIGEST.test(String(session.artifactSha256)) || identity.artifactSha256 !== session.artifactSha256))) {
    throw new ContentIdentityV2PlannerError("relationship_invalid");
  }
}

function verifyRelationships(records: ReadonlyMap<string, ContentIdentityV2Record>): void {
  const valueFor = (key: string): unknown => records.get(key)?.value;
  const indexCheck = (indexKey: string, prefix: string): void => {
    if (!records.has(indexKey)) return;
    const value = valueFor(indexKey);
    if (!Array.isArray(value)) throw new ContentIdentityV2PlannerError("relationship_invalid");
    const seen = new Set<string>();
    for (const id of value) {
      if (!nonEmpty(id) || seen.has(id) || !records.has(`${prefix}${id}`)) throw new ContentIdentityV2PlannerError("relationship_invalid");
      seen.add(id);
    }
  };
  indexCheck(STORAGE_KEYS.TRAINING_SESSION_INDEX, `${STORAGE_NAMESPACE}training-session:`);
  indexCheck(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, `${STORAGE_NAMESPACE}training-attempt:`);
  indexCheck(STORAGE_KEYS.REVIEW_INDEX, `${STORAGE_NAMESPACE}review-entry:`);
  for (const [key, record] of records) {
    const value = record.value;
    if (key.startsWith(`${STORAGE_NAMESPACE}goal:`)) {
      const suffix = key.slice(`${STORAGE_NAMESPACE}goal:`.length);
      if (!isRecord(value) || value.trackId !== suffix) throw new ContentIdentityV2PlannerError("relationship_invalid");
    }
    if (key.startsWith(`${STORAGE_NAMESPACE}learning-plan:`)) {
      const suffix = key.slice(`${STORAGE_NAMESPACE}learning-plan:`.length);
      if (!isRecord(value) || value.trackId !== suffix) throw new ContentIdentityV2PlannerError("relationship_invalid");
    }
    if (key.startsWith(`${STORAGE_NAMESPACE}training-session:`)) {
      if (!isRecord(value) || value.id !== key.slice(`${STORAGE_NAMESPACE}training-session:`.length)) throw new ContentIdentityV2PlannerError("relationship_invalid");
    }
    if (key.startsWith(`${STORAGE_NAMESPACE}training-attempt:`)) {
      if (!isRecord(value) || value.id !== key.slice(`${STORAGE_NAMESPACE}training-attempt:`.length) || !nonEmpty(value.sessionId)) throw new ContentIdentityV2PlannerError("relationship_invalid");
      const session = valueFor(`${STORAGE_NAMESPACE}training-session:${value.sessionId}`);
      if (!isRecord(session) || !Array.isArray(session.itemOrder) || value.trackId !== session.trackId) throw new ContentIdentityV2PlannerError("relationship_invalid");
      const occurrence = session.itemOrder.find((entry) => isRecord(entry) && entry.occurrenceId === value.occurrenceId);
      if (!isRecord(occurrence) || comparableIdentity(value.item) === null || comparableIdentity(occurrence.item) === null || comparableIdentity(value.item) !== comparableIdentity(occurrence.item)) throw new ContentIdentityV2PlannerError("relationship_invalid");
      assertSessionReference(value.item, session);
    }
    if (key.startsWith(`${STORAGE_NAMESPACE}review-entry:`)) {
      if (!isRecord(value) || value.id !== key.slice(`${STORAGE_NAMESPACE}review-entry:`.length) || !nonEmpty(value.sourceSessionId) || !nonEmpty(value.sourceAttemptId)) throw new ContentIdentityV2PlannerError("relationship_invalid");
      const session = valueFor(`${STORAGE_NAMESPACE}training-session:${value.sourceSessionId}`);
      const attempt = valueFor(`${STORAGE_NAMESPACE}training-attempt:${value.sourceAttemptId}`);
      if (!isRecord(session) || !isRecord(attempt) || value.trackId !== session.trackId || attempt.sessionId !== value.sourceSessionId || attempt.trackId !== value.trackId || comparableIdentity(value.sourceItem) === null || comparableIdentity(attempt.item) === null || comparableIdentity(value.sourceItem) !== comparableIdentity(attempt.item)) throw new ContentIdentityV2PlannerError("relationship_invalid");
      assertSessionReference(value.sourceItem, session);
    }
    if (key.startsWith(`${STORAGE_NAMESPACE}training-session-result:`)) {
      if (!isRecord(value) || value.sessionId !== key.slice(`${STORAGE_NAMESPACE}training-session-result:`.length)) throw new ContentIdentityV2PlannerError("relationship_invalid");
      const session = valueFor(`${STORAGE_NAMESPACE}training-session:${value.sessionId}`);
      if (!isRecord(session) || session.status !== "completed" || value.trackId !== session.trackId) throw new ContentIdentityV2PlannerError("relationship_invalid");
    }
  }
  for (const key of [STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER] as const) {
    const record = records.get(key);
    if (!record) continue;
    if (!isRecord(record.value) || !nonEmpty(record.value.sessionId) || !nonEmpty(record.value.trackId)) throw new ContentIdentityV2PlannerError("relationship_invalid");
    const session = valueFor(`${STORAGE_NAMESPACE}training-session:${record.value.sessionId}`);
    if (!isRecord(session) || session.status !== "active" || session.trackId !== record.value.trackId || targetHasTombstone(records.get(`${STORAGE_NAMESPACE}training-session:${record.value.sessionId}`))) throw new ContentIdentityV2PlannerError("relationship_invalid");
  }
  const active = valueFor(STORAGE_KEYS.ACTIVE_TRAINING_SESSION);
  if (active !== undefined) {
    if (!nonEmpty(active)) throw new ContentIdentityV2PlannerError("relationship_invalid");
    const session = records.get(`${STORAGE_NAMESPACE}training-session:${active}`);
    if (!session || !isRecord(session.value) || session.value.status !== "active" || !DIGEST.test(String(session.value.artifactSha256)) || targetHasTombstone(session)) throw new ContentIdentityV2PlannerError("relationship_invalid");
  }
}

function verifyTargetRecords(expected: ReadonlyMap<string, string>, contextStorage: { getString(key: string): string | undefined }): boolean {
  const records = new Map<string, ContentIdentityV2Record>();
  for (const [key, raw] of expected) {
    if (contextStorage.getString(key) !== raw) return false;
    const record = unwrapTarget(raw, key);
    const owner = ownerForKey(key);
    if (record.owner !== owner.entry.owner || record.key !== key) return false;
    records.set(key, record);
  }
  try { verifyRelationships(records); } catch { return false; }
  return true;
}

function assertTargetOwnerCoverage(): void {
  const owners = new Set(CONTENT_IDENTITY_INVENTORY_REGISTRY.map((entry) => entry.owner));
  for (const owner of owners) if (!V2_OWNER_NAMES.includes(owner as (typeof V2_OWNER_NAMES)[number])) throw new ContentIdentityV2PlannerError("unregistered_key");
}

function freezeBundle(bundle: ContentIdentityV2PlanBundle): ContentIdentityV2PlanBundle {
  return Object.freeze({ ...bundle, targetRecords: Object.freeze([...bundle.targetRecords]), preservation: Object.freeze([...bundle.preservation]) });
}

const sealedBundles = new WeakSet<object>();

/** Creates an owner-dispatched target and seals it into the C0 raw engine. */
export function planContentIdentityV2(input: Readonly<{
  source: readonly ContentIdentityMigrationRawRecord[];
  artifacts: readonly ActiveContentArtifactDescriptor[];
  sourceMetadata?: ContentIdentityMigrationMetadataSnapshot;
}>): ContentIdentityV2PlanBundle {
  assertTargetOwnerCoverage();
  const artifacts = assertArtifacts(input.artifacts);
  if (!Array.isArray(input.source) || input.source.length === 0) throw new ContentIdentityV2PlannerError("invalid_source");
  const sourceKeys = new Set<string>();
  for (const record of input.source) {
    if (!isRecord(record) || !hasExactKeys(record, ["key", "raw"]) || !nonEmpty(record.key) || typeof record.raw !== "string" || sourceKeys.has(record.key)) throw new ContentIdentityV2PlannerError("invalid_source");
    sourceKeys.add(record.key);
  }
  const targets = buildTargets(input.source, artifacts);
  const targetRecords = new Map(targets.records.map((record) => [record.key, unwrapTarget(record.raw, record.key)]));
  try { verifyRelationships(targetRecords); } catch (error) { if (error instanceof ContentIdentityV2PlannerError) throw error; throw new ContentIdentityV2PlannerError("relationship_invalid"); }
  const targetMap = new Map(targets.records.map((record) => [record.key, record.raw]));
  const verifier = createContentIdentityMigrationVerifier({
    name: `content-identity-v2-owner-dispatch:${CONTENT_IDENTITY_V2_PLANNER_VERSION}`,
    verify: (context) => verifyTargetRecords(targetMap, context.storage),
  });
  const plan = planContentIdentityMigration({
    source: input.source,
    target: targets.records,
    verifier,
    targetRuntimeSchemaVersion: CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION,
    sourceMetadata: input.sourceMetadata,
  });
  const preservationDigest = contentIdentityV2Digest(targets.preservation);
  const certificate = createContentIdentityV2Certificate({
    schemaIdentity: CONTENT_IDENTITY_V2_SCHEMA,
    protocolVersion: CONTENT_IDENTITY_V2_PROTOCOL_VERSION,
    migrationVersion: CONTENT_IDENTITY_V2_MIGRATION_VERSION,
    planId: plan.planId,
    sourceManifestDigest: plan.sourceManifest.aggregateDigest,
    targetManifestDigest: plan.targetManifest.aggregateDigest,
    preservationDigest,
    cloudProtocolUpgradeRequired: true,
  });
  const bundle = freezeBundle({ plan, verifier, activation: createContentIdentityMigrationActivation(CONTENT_IDENTITY_MIGRATION_TARGET_RUNTIME_SCHEMA_VERSION), certificate, targetRecords: targets.records, preservation: targets.preservation, cloudProtocolUpgradeRequired: true });
  sealedBundles.add(bundle);
  return bundle;
}

/** Runs a sealed local plan through the C0 fence; there is no cloud token. */
export function migrateContentIdentityV2(input: Readonly<{
  storage: Parameters<typeof migrateContentIdentityStorage>[0]["storage"];
  bundle: ContentIdentityV2PlanBundle;
}>): ReturnType<typeof migrateContentIdentityStorage> {
  if (!isContentIdentityV2PlanBundle(input.bundle) || input.bundle.cloudProtocolUpgradeRequired !== true || input.bundle.certificate.cloudProtocolUpgradeRequired !== true) {
    throw new ContentIdentityV2PlannerError("invalid_source");
  }
  return migrateContentIdentityStorage({ storage: input.storage, plan: input.bundle.plan, verifier: input.bundle.verifier, activation: input.bundle.activation });
}

export function isContentIdentityV2PlanBundle(value: unknown): value is ContentIdentityV2PlanBundle {
  return typeof value === "object" && value !== null && sealedBundles.has(value);
}

/** Explicit B2 gate: C1a can never authorize cloud rollout. */
export function assertCloudProtocolUpgradeComplete(bundle: ContentIdentityV2PlanBundle): never {
  if (!sealedBundles.has(bundle)) throw new ContentIdentityV2Error("invalid_v2_record");
  throw new ContentIdentityV2Error("cloud_protocol_upgrade_required");
}
