import lockFile from "../../content/generated/canonical-content/content-lock.json";
import { isRegisteredTrackId } from "../../domain";
import { isGoalRecordShapeForTrack } from "../../domain/goals/goalContracts";
import { isLearningPlanV1ForTrack } from "../../domain/learning/learningPlan";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { getKeyValueStorage, type KeyValueStorage } from "../../infrastructure/storage/mmkvClient";
import type { CanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { accountDataRecordKey, isCanonicalAccountSyncState, isGuestOwnedLearningKey, SYNCABLE_RECORD_TYPES, type SyncableRecordType } from "./accountDataRepository";
import { isContentReportOutboxEntries } from "./contentReportOutboxRepository";
import { isMutationJournalRecord } from "./mutationJournalRepository";
import { isCanonicalNotificationSettings, isCanonicalNotificationSettingsJournal } from "./notificationSettingsRepository";
import {
  isForegroundTimerState,
  isReviewQueueEntry,
  isTrainingAttempt,
  isTrainingSession,
  isTrainingSessionDraft,
  isTrainingSessionResult,
} from "./trainingModelGuards";

/** The inventory contract is intentionally independent from the later writer/migrator. */
export const CONTENT_IDENTITY_INVENTORY_VERSION = 1 as const;

export const CONTENT_IDENTITY_INVENTORY_CLASSIFICATIONS = Object.freeze([
  "mapped",
  "unmapped_unknown_hash",
  "unmapped_version",
  "malformed",
  "orphan",
  "duplicate",
  "passthrough",
  "unsupported",
] as const);

export type ContentIdentityInventoryClassification = typeof CONTENT_IDENTITY_INVENTORY_CLASSIFICATIONS[number];
export type ContentIdentityInventoryKeyKind = "fixed" | "dynamic_prefix" | "index" | "unknown";
export type ContentIdentityInventoryScope = "learning" | "account_sync" | "passthrough" | "unsupported";

export type ContentIdentityInventoryRegistryEntry = Readonly<{
  selector: string;
  kind: Exclude<ContentIdentityInventoryKeyKind, "unknown">;
  owner: string;
  scope: ContentIdentityInventoryScope;
  identityPaths: readonly string[];
}>;

export type ActiveContentArtifact = Readonly<{
  trackId: string;
  contentVersion: string;
  artifactSha256: string;
  /** Optional in the static lock projection; supplied by the runtime catalog when available. */
  questionIds?: readonly string[];
}>;

export type ContentIdentityInventoryFinding = Readonly<{
  key: string;
  kind: ContentIdentityInventoryKeyKind;
  owner: string;
  classification: ContentIdentityInventoryClassification;
  identityBearing: boolean;
  /** A stable code, never a raw payload or secret. */
  reason: string;
  /** Stable paths inside the envelope payload where relevant. */
  paths: readonly string[];
}>;

export type ContentIdentityInventoryCounts = Readonly<{
  totalKeys: number;
  identityBearingKeys: number;
  blockingKeys: number;
  mapped: number;
  unmapped_unknown_hash: number;
  unmapped_version: number;
  malformed: number;
  orphan: number;
  duplicate: number;
  passthrough: number;
  unsupported: number;
}>;

export type BackendProtocolInventoryAudit = Readonly<{
  protocolVersions: readonly number[];
  stateContract: "opaque_object";
  requiresBackendChange: boolean;
  reason: string;
  evidence: readonly Readonly<{ path: string; fact: string; consequence: string }>[];
}>;

export type ContentIdentityInventoryReport = Readonly<{
  inventoryVersion: typeof CONTENT_IDENTITY_INVENTORY_VERSION;
  namespace: typeof STORAGE_NAMESPACE;
  counts: ContentIdentityInventoryCounts;
  findings: readonly ContentIdentityInventoryFinding[];
  digest: string;
  backendAudit: BackendProtocolInventoryAudit;
}>;

export type ContentIdentityInventoryInput = Readonly<{
  storage?: KeyValueStorage;
  activeArtifacts?: readonly ActiveContentArtifact[];
}>;

type RegistryEntry = ContentIdentityInventoryRegistryEntry;
type ParsedEnvelope = Readonly<{ payload: unknown }>;
type ScanIssue = Readonly<{ classification: ContentIdentityInventoryClassification; reason: string; path?: string; identityBearing?: boolean }>;
type IdentityRef = Readonly<{
  path: string;
  packagePin: unknown;
  trackId: unknown;
  itemId: unknown;
  contentVersion: unknown;
}>;
type IdentityCollection = Readonly<{ refs: readonly IdentityRef[]; issues: readonly ScanIssue[]; identityBearing: boolean }>;
type DuplicateSource = Readonly<{ key: string; payload: unknown; entry: RegistryEntry; malformed: boolean }>;

const SHA_256 = /^[a-f0-9]{64}$/u;
const EMPTY_PIN_RELEASE = "canonical-content-v1";

const lockArtifacts: readonly ActiveContentArtifact[] = Object.freeze(
  (lockFile.tracks as readonly Readonly<{ trackId: string; contentVersion: string; sha256: string }>[]) // eslint-disable-line @typescript-eslint/no-unnecessary-type-assertion
    .map((entry) => Object.freeze({ trackId: entry.trackId, contentVersion: entry.contentVersion, artifactSha256: entry.sha256 })),
);

const fixed = (
  selector: string,
  owner: string,
  scope: ContentIdentityInventoryScope,
  identityPaths: readonly string[],
): RegistryEntry => Object.freeze({ selector, kind: "fixed", owner, scope, identityPaths: Object.freeze([...identityPaths]) });
const dynamic = (
  selector: string,
  owner: string,
  scope: ContentIdentityInventoryScope,
  identityPaths: readonly string[],
): RegistryEntry => Object.freeze({ selector, kind: "dynamic_prefix", owner, scope, identityPaths: Object.freeze([...identityPaths]) });
const index = (
  selector: string,
  owner: string,
  scope: ContentIdentityInventoryScope,
  identityPaths: readonly string[],
): RegistryEntry => Object.freeze({ selector, kind: "index", owner, scope, identityPaths: Object.freeze([...identityPaths]) });

/**
 * Static owner/reader registry for every key shape in the canonical namespace.
 * It is data-only so a dry run cannot accidentally invoke a repository writer.
 */
export const CONTENT_IDENTITY_INVENTORY_REGISTRY: readonly RegistryEntry[] = Object.freeze([
  fixed(STORAGE_KEYS.METADATA, "storageMetadataRepository", "passthrough", []),
  fixed(STORAGE_KEYS.GUEST_INSTALLATION, "guestInstallationRepository", "passthrough", []),
  fixed(STORAGE_KEYS.GUEST_ACCESS, "guestAccessRepository", "passthrough", []),
  fixed(STORAGE_KEYS.ACTIVE_TRACK, "activeTrackRepository", "passthrough", ["payload"]),
  fixed(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, "trainingSessionRepository", "learning", ["payload"]),
  fixed(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, "trainingSessionDraftRepository", "learning", ["payload.sessionId", "payload.trackId"]),
  fixed(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, "foregroundTimerRepository", "learning", ["payload.sessionId", "payload.trackId"]),
  index(STORAGE_KEYS.TRAINING_SESSION_INDEX, "trainingSessionRepository", "learning", ["payload[]"]),
  index(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, "trainingAttemptRepository", "learning", ["payload[]"]),
  index(STORAGE_KEYS.REVIEW_INDEX, "reviewQueueRepository", "learning", ["payload[]"]),
  fixed(STORAGE_KEYS.SETTINGS, "settingsRepository", "passthrough", []),
  fixed(STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES, "goalOnboardingPreferenceRepository", "passthrough", []),
  fixed(STORAGE_KEYS.NOTIFICATION_SETTINGS, "notificationSettingsRepository", "passthrough", [
    "payload.practiceReminder.trackId",
    "payload.practiceReminder.schedules[*].notificationId",
    "payload.practiceReminder.transactionId",
    "payload.identity.trackId",
    "payload.identity.contentVersion",
    "payload.identity.contentPackagePin",
    "payload.pending.expectedIdentity.trackId",
    "payload.pending.expectedIdentity.contentVersion",
    "payload.pending.expectedIdentity.contentPackagePin",
  ]),
  fixed(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, "notificationSettingsRepository", "passthrough", [
    "payload.desired.trackId",
    "payload.created[*].notificationId",
    "payload.expectedIdentity.trackId",
    "payload.expectedIdentity.contentVersion",
    "payload.expectedIdentity.contentPackagePin",
    "payload.transactionId",
  ]),
  fixed(STORAGE_KEYS.ACTIVE_JOURNAL, "mutationJournalRepository", "learning", [
    "payload.trackId",
    "payload.packagePin",
    "payload.writes[*].record.packagePin",
    "payload.writes[*].record.item",
    "payload.writes[*].record.reviewEvidence.sourceItem",
    "payload.writes[*].record.sourceItem",
    "payload.writes[*].record.itemOrder[*].item",
    "payload.writes[*].record.conditionalReinsertSlots[*].ordinaryBranch.occurrence.item",
    "payload.writes[*].record.conditionalReinsertSlots[*].reviewedVariantBranch.occurrence.item",
    "payload.writes[*].record.conditionalReinsertSlots[*].exactSourceBranch.occurrence.item",
  ]),
  fixed(STORAGE_KEYS.ACCOUNT_SYNC, "accountDataRepository", "account_sync", []),
  fixed(STORAGE_KEYS.ACCOUNT_SIGN_OUT, "accountLifecycleRepository", "passthrough", []),
  fixed(STORAGE_KEYS.ACCOUNT_DELETION, "accountLifecycleRepository", "passthrough", []),
  fixed(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, "contentReportOutboxRepository", "passthrough", [
    "payload[].input.clientSubmissionId",
    "payload[].input.trackId",
    "payload[].input.itemId",
    "payload[].input.contentVersion",
    "payload[].input.context.releasePackageId",
    "payload[].input.context.trackNode",
  ]),
  dynamic(`${STORAGE_NAMESPACE}training-session:`, "trainingSessionRepository", "learning", [
    "payload.trackId",
    "payload.packagePin",
    "payload.itemOrder[*].item",
    "payload.conditionalReinsertSlots[*].ordinaryBranch.occurrence.item",
    "payload.conditionalReinsertSlots[*].reviewedVariantBranch.occurrence.item",
    "payload.conditionalReinsertSlots[*].exactSourceBranch.occurrence.item",
  ]),
  dynamic(`${STORAGE_NAMESPACE}training-session-result:`, "trainingSessionResultRepository", "learning", []),
  dynamic(`${STORAGE_NAMESPACE}training-attempt:`, "trainingAttemptRepository", "learning", ["payload.trackId", "payload.item", "payload.reviewEvidence.sourceItem"]),
  dynamic(`${STORAGE_NAMESPACE}review-entry:`, "reviewQueueRepository", "learning", ["payload.trackId", "payload.sourceItem"]),
  dynamic(`${STORAGE_NAMESPACE}goal:`, "goalRepository", "passthrough", ["payload.trackId"]),
  dynamic(`${STORAGE_NAMESPACE}learning-plan:`, "learningPlanRepository", "learning", ["payload.contentVersion", "payload.contentPackagePin"]),
]);

const fixedRegistry = new Map(CONTENT_IDENTITY_INVENTORY_REGISTRY.filter((entry) => entry.kind === "fixed").map((entry) => [entry.selector, entry]));
const dynamicRegistry = CONTENT_IDENTITY_INVENTORY_REGISTRY.filter((entry) => entry.kind === "dynamic_prefix" || entry.kind === "index").sort((left, right) => right.selector.length - left.selector.length);

export function describeBackendProtocolForContentIdentity(): BackendProtocolInventoryAudit {
  return backendAudit();
}

function backendAudit(): BackendProtocolInventoryAudit {
  return Object.freeze({
    protocolVersions: Object.freeze([1, 2, 3]),
    stateContract: "opaque_object",
    requiresBackendChange: true,
    reason: "The current account-sync backend authenticates and fingerprints opaque state but does not require or transform the new resolved content identity.",
    evidence: Object.freeze([
      Object.freeze({ path: "../patternly-backend/src/modules/progress/contracts.ts:progressState", fact: "ProgressMutation.state is z.record(z.unknown()) with size limits only.", consequence: "A legacy packagePin/itemId payload is accepted without an identity migration boundary." }),
      Object.freeze({ path: "../patternly-backend/src/modules/users/merge.ts:stateSchema", fact: "GuestMergeRecord.state is also an opaque bounded object; merge fingerprints hash the complete state.", consequence: "Account adoption can preserve legacy identity unchanged and cannot produce a typed tombstone/resolved ref itself." }),
      Object.freeze({ path: "../patternly-backend/src/modules/progress/store.ts:toView/applyBatch", fact: "The store validates record envelope fields and fingerprint, then persists state as supplied.", consequence: "A versioned B2 transformation or backend contract change is required after local cutover." }),
      Object.freeze({ path: "../patternly-backend/src/modules/users/adoptionTransfer.ts:adoptionTransferRecordSchema", fact: "The v3 adoption record schema permits an opaque state object.", consequence: "The v3 transport is retry-safe infrastructure, not a content-identity migration contract." }),
    ]),
  });
}

function registryEntryForKey(key: string): RegistryEntry | null {
  const exact = fixedRegistry.get(key);
  if (exact) return exact;
  return dynamicRegistry.find((entry) => key.startsWith(entry.selector)) ?? null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function parseEnvelope(raw: string | undefined): ParsedEnvelope | ScanIssue {
  if (raw === undefined) return { classification: "malformed", reason: "missing_value", identityBearing: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { classification: "malformed", reason: "invalid_json", identityBearing: false };
  }
  if (!isRecord(parsed) || parsed.schemaIdentity !== "patternly:canonical:v1" || !Number.isSafeInteger(parsed.revision) || Number(parsed.revision) < 1 || Object.keys(parsed).length !== 3 || !("payload" in parsed)) {
    return { classification: "malformed", reason: "invalid_canonical_envelope", identityBearing: false };
  }
  return { payload: parsed.payload };
}

function keyParts(key: string): Readonly<{ entry: RegistryEntry | null; kind: ContentIdentityInventoryKeyKind; suffix: string | null }> {
  const entry = registryEntryForKey(key);
  if (!entry) return { entry: null, kind: "unknown", suffix: null };
  if (entry.kind === "fixed") return { entry, kind: "fixed", suffix: null };
  return { entry, kind: entry.kind, suffix: key.slice(entry.selector.length) };
}

function hasUnsupportedGuestBackupKey(payload: unknown): boolean {
  if (!isRecord(payload) || !isRecord(payload.materialization) || !Array.isArray(payload.materialization.guestBackup)) return false;
  return payload.materialization.guestBackup.some((entry) => isRecord(entry) && isNonEmptyString(entry.key) && !isGuestOwnedLearningKey(entry.key));
}

function hasLegacySyncPlanRecordKey(payload: unknown): boolean {
  if (!isRecord(payload) || !isRecord(payload.syncPlan) || !Array.isArray(payload.syncPlan.items)) return false;
  return payload.syncPlan.items.some((item) => {
    if (!isRecord(item) || typeof item.recordKey !== "string" || !isRecord(item.payload)) return false;
    if (!isNonEmptyString(item.payload.recordId) || !isNonEmptyString(item.payload.recordType) || !(SYNCABLE_RECORD_TYPES as readonly string[]).includes(item.payload.recordType) || !isNonEmptyString(item.payload.trackId) || !isRegisteredTrackId(item.payload.trackId)) return false;
    return item.recordKey !== accountDataRecordKey(item.payload as { recordId: string; recordType: SyncableRecordType; trackId: string });
  });
}

function hasLegacyPendingConfirmation(payload: unknown): boolean {
  if (!isRecord(payload) || !isRecord(payload.pendingConfirmation)) return false;
  const pending = payload.pendingConfirmation;
  if (typeof pending.operationId !== "string" || typeof pending.previewFingerprint !== "string" || !Array.isArray(pending.resolutions) || !pending.resolutions.every((entry) => isRecord(entry) && typeof entry.conflictId === "string" && (entry.resolution === "keep_guest" || entry.resolution === "keep_account"))) return false;
  return pending.protocolVersion === undefined || pending.groupChoices === undefined;
}

function payloadShapeIssue(key: string, payload: unknown, entry: RegistryEntry, suffix: string | null): ScanIssue | null {
  const malformed = (reason: string, identityBearing = entry.scope === "learning" || entry.scope === "account_sync"): ScanIssue => ({ classification: "malformed", reason, identityBearing });
  if (entry.kind === "index") {
    return isStringArray(payload) ? null : malformed("invalid_index_payload");
  }
  if (entry.kind === "dynamic_prefix" && (!suffix || !suffix.trim())) return malformed("empty_dynamic_identity");
  if (entry.selector === STORAGE_KEYS.ACTIVE_TRACK) return typeof payload === "string" && isRegisteredTrackId(payload) ? null : malformed("invalid_active_track", false);
  if (entry.selector === STORAGE_KEYS.ACTIVE_TRAINING_SESSION) return isNonEmptyString(payload) ? null : malformed("invalid_active_session_pointer");
  if (entry.selector === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT) return isTrainingSessionDraft(payload) ? null : malformed("invalid_session_draft");
  if (entry.selector === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER) return isForegroundTimerState(payload) ? null : malformed("invalid_foreground_timer");
  if (entry.selector === STORAGE_KEYS.NOTIFICATION_SETTINGS) return isCanonicalNotificationSettings(payload) ? null : malformed("invalid_notification_settings", false);
  if (entry.selector === STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL) return isCanonicalNotificationSettingsJournal(payload) ? null : malformed("invalid_notification_settings_journal", false);
  if (entry.selector === STORAGE_KEYS.ACCOUNT_SYNC) {
    if (hasLegacyPendingConfirmation(payload)) return { classification: "unsupported", reason: "legacy_account_pending_confirmation", identityBearing: true };
    // Owner validation remains fail-closed, while inventory-specific legacy
    // identity diagnostics retain their more actionable classification.
    if (hasUnsupportedGuestBackupKey(payload) || hasLegacySyncPlanRecordKey(payload)) return null;
    return isCanonicalAccountSyncState(payload) ? null : malformed("invalid_account_sync_state", true);
  }
  if (entry.selector === STORAGE_KEYS.ACTIVE_JOURNAL) return isMutationJournalRecord(payload) ? null : malformed("invalid_mutation_journal", true);
  if (entry.selector === STORAGE_KEYS.CONTENT_REPORT_OUTBOX) return isContentReportOutboxEntries(payload) ? null : malformed("invalid_content_report_outbox", true);
  if (entry.selector === STORAGE_KEYS.TRAINING_SESSION_INDEX || entry.selector === STORAGE_KEYS.TRAINING_ATTEMPT_INDEX || entry.selector === STORAGE_KEYS.REVIEW_INDEX) return null;
  if (entry.kind === "dynamic_prefix") {
    if (entry.selector === `${STORAGE_NAMESPACE}training-session:`) return isTrainingSession(payload) ? null : malformed("invalid_training_session", true);
    if (entry.selector === `${STORAGE_NAMESPACE}training-session-result:`) return isTrainingSessionResult(payload) ? null : malformed("invalid_training_session_result", false);
    if (entry.selector === `${STORAGE_NAMESPACE}training-attempt:`) return isTrainingAttempt(payload) ? null : malformed("invalid_training_attempt", true);
    if (entry.selector === `${STORAGE_NAMESPACE}review-entry:`) return isReviewQueueEntry(payload) ? null : malformed("invalid_review_entry", true);
    if (entry.selector === `${STORAGE_NAMESPACE}goal:`) return typeof suffix === "string" && isRegisteredTrackId(suffix) && isGoalRecordShapeForTrack(payload, suffix) ? null : malformed("invalid_goal", false);
    if (entry.selector === `${STORAGE_NAMESPACE}learning-plan:`) return typeof suffix === "string" && isRegisteredTrackId(suffix) && isLearningPlanV1ForTrack(payload, suffix) ? null : malformed("invalid_learning_plan", true);
  }
  // Passthrough records are intentionally not decoded by this migration slice;
  // their envelope is still checked, while their owner remains responsible for
  // any schema-specific validation.
  return null;
}

function pathFor(parent: string, key: string): string {
  return parent.length === 0 ? key : `${parent}.${key}`;
}

function isPackagePinShape(value: unknown): value is Readonly<{ packageIdentity: string; packageVersion: string; contentReleaseId: string }> {
  return isRecord(value) && Object.keys(value).length === 3 && typeof value.packageIdentity === "string" && typeof value.packageVersion === "string" && typeof value.contentReleaseId === "string";
}

type IdentityContext = Readonly<{ trackId?: unknown; itemId?: unknown; contentVersion?: unknown }>;
type IdentityRoot = Readonly<{ value: unknown; path: string; parent: unknown; property: string | null }>;

function identityPathRoots(value: unknown, descriptor: string, rootPath: string): readonly IdentityRoot[] {
  const tokens = descriptor.split(".");
  const first = tokens.shift();
  if (first !== "payload" && first !== "payload[]") return Object.freeze([]);
  let nodes: IdentityRoot[] = [{ value, path: rootPath, parent: null, property: null }];
  if (first === "payload[]") {
    if (!Array.isArray(value)) return Object.freeze([]);
    nodes = value.map((child, index) => ({ value: child, path: `${rootPath}[${index}]`, parent: value, property: null }));
  }
  for (const token of tokens) {
    const wildcard = token.endsWith("[*]");
    const property = wildcard ? token.slice(0, -3) : token;
    nodes = nodes.flatMap((node) => {
      if (!isRecord(node.value) || !(property in node.value)) return [];
      const child = node.value[property];
      if (!wildcard) return [{ value: child, path: pathFor(node.path, property), parent: node.value, property }];
      if (!Array.isArray(child)) return [];
      return child.map((entry, index) => ({ value: entry, path: `${pathFor(node.path, property)}[${index}]`, parent: node.value, property }));
    });
  }
  return Object.freeze(nodes);
}

function accountSyncIdentityRoots(payload: unknown, rootPath: string): readonly IdentityRoot[] {
  if (!isRecord(payload)) return Object.freeze([]);
  const roots: IdentityRoot[] = [];
  const add = (state: Record<string, unknown>, key: string, path: string): void => {
    if (key in state) roots.push({ value: state[key], path, parent: state, property: key });
  };
  const addRecord = (record: unknown, path: string): void => {
    if (!isRecord(record) || !isRecord(record.state) || record.state.deleted === true) return;
    const state = record.state;
    switch (record.recordType) {
      case "training_session_summary":
        add(state, "packagePin", `${path}.state.packagePin`);
        add(state, "itemOrder", `${path}.state.itemOrder`);
        add(state, "conditionalReinsertSlots", `${path}.state.conditionalReinsertSlots`);
        break;
      case "training_attempt":
        add(state, "item", `${path}.state.item`);
        if (isRecord(state.reviewEvidence)) add(state.reviewEvidence, "sourceItem", `${path}.state.reviewEvidence.sourceItem`);
        break;
      case "review_queue_entry":
        add(state, "sourceItem", `${path}.state.sourceItem`);
        break;
      case "learning_plan":
        if (isRecord(state.plan)) add(state.plan, "contentPackagePin", `${path}.state.plan.contentPackagePin`);
        break;
      default:
        break;
    }
  };
  if (Array.isArray(payload.outbox)) payload.outbox.forEach((record, index) => addRecord(record, `${rootPath}.outbox[${index}]`));
  if (isRecord(payload.syncPlan) && Array.isArray(payload.syncPlan.items)) payload.syncPlan.items.forEach((item, index) => {
    if (isRecord(item)) addRecord(item.payload, `${rootPath}.syncPlan.items[${index}].payload`);
  });
  return Object.freeze(roots);
}

function identityContext(value: unknown, inherited: IdentityContext): IdentityContext {
  if (!isRecord(value)) return inherited;
  return {
    trackId: value.trackId ?? inherited.trackId,
    itemId: value.itemId ?? inherited.itemId,
    contentVersion: value.contentVersion ?? inherited.contentVersion,
  };
}

function extractIdentityRefs(payload: unknown, entry: RegistryEntry, suffix: string | null, rootPath = "payload", allowNullPin = false): IdentityCollection {
  const refs: IdentityRef[] = [];
  const issues: ScanIssue[] = [];
  let identityBearing = false;
  const seenRefs = new Set<string>();
  const seenIssues = new Set<string>();
  const baseContext: IdentityContext = entry.selector === `${STORAGE_NAMESPACE}learning-plan:` && suffix ? { trackId: suffix } : {};
  const addIssue = (issue: ScanIssue): void => {
    const identity = `${issue.classification}:${issue.reason}:${issue.path ?? ""}`;
    if (seenIssues.has(identity)) return;
    seenIssues.add(identity);
    issues.push(issue);
  };
  const addRef = (path: string, packagePin: unknown, context: IdentityContext): void => {
    if (packagePin === null && allowNullPin) {
      identityBearing = true;
      return;
    }
    if (seenRefs.has(path)) return;
    seenRefs.add(path);
    identityBearing = true;
    refs.push(Object.freeze({ path, packagePin, trackId: context.trackId, itemId: context.itemId, contentVersion: context.contentVersion }));
    if (!isPackagePinShape(packagePin)) addIssue({ classification: "malformed", reason: "invalid_package_pin", path, identityBearing: true });
  };
  const visit = (candidate: unknown, path: string, inheritedContext: IdentityContext): void => {
    if (Array.isArray(candidate)) {
      candidate.forEach((item, index) => visit(item, `${path}[${index}]`, inheritedContext));
      return;
    }
    if (!isRecord(candidate)) return;
    const context = identityContext(candidate, inheritedContext);
    if ("itemId" in candidate || "contentVersion" in candidate) identityBearing = true;
    for (const pinKey of ["packagePin", "contentPackagePin"] as const) {
      if (pinKey in candidate) addRef(pathFor(path, pinKey), candidate[pinKey], context);
    }
    for (const [key, child] of Object.entries(candidate)) {
      if (key === "packagePin" || key === "contentPackagePin") continue;
      visit(child, pathFor(path, key), context);
    }
  };
  const roots = entry.selector === STORAGE_KEYS.ACCOUNT_SYNC
    ? accountSyncIdentityRoots(payload, rootPath)
    : entry.identityPaths.flatMap((descriptor) => identityPathRoots(payload, descriptor, rootPath));
  for (const root of roots) {
      if (root.property === "itemId" || root.property === "contentVersion") identityBearing = true;
      if (root.property === "packagePin" || root.property === "contentPackagePin") {
        addRef(root.path, root.value, identityContext(root.parent, baseContext));
      } else {
        visit(root.value, root.path, identityContext(root.parent, baseContext));
      }
  }
  return Object.freeze({ refs: Object.freeze(refs), issues: Object.freeze(issues), identityBearing });
}

function findArtifact(value: unknown, artifacts: readonly ActiveContentArtifact[]): ActiveContentArtifact | null {
  if (!isRecord(value) || typeof value.packageIdentity !== "string") return null;
  return artifacts.find((artifact) => artifact.artifactSha256 === value.packageIdentity) ?? null;
}

function classifyIdentityRef(ref: IdentityRef, artifacts: readonly ActiveContentArtifact[]): ScanIssue {
  if (!isPackagePinShape(ref.packagePin)) return { classification: "malformed", reason: "invalid_package_pin", path: ref.path, identityBearing: true };
  const pin = ref.packagePin;
  if (!SHA_256.test(pin.packageIdentity) || !isNonEmptyString(pin.packageVersion) || !isNonEmptyString(pin.contentReleaseId)) return { classification: "malformed", reason: "invalid_package_pin", path: ref.path, identityBearing: true };
  if (typeof ref.trackId !== "string" || !isRegisteredTrackId(ref.trackId)) return { classification: "malformed", reason: "missing_or_invalid_identity_track", path: ref.path, identityBearing: true };
  const artifact = findArtifact(pin, artifacts);
  if (!artifact) return { classification: "unmapped_unknown_hash", reason: "package_hash_not_in_active_lock", path: ref.path, identityBearing: true };
  if (ref.trackId !== artifact.trackId) return { classification: "malformed", reason: "package_track_mismatch", path: ref.path, identityBearing: true };
  if (ref.contentVersion !== undefined && (typeof ref.contentVersion !== "string" || ref.contentVersion !== pin.packageVersion)) return { classification: "malformed", reason: "package_version_field_mismatch", path: ref.path, identityBearing: true };
  if (pin.packageVersion !== artifact.contentVersion || pin.contentReleaseId !== EMPTY_PIN_RELEASE) return { classification: "unmapped_version", reason: "package_version_or_release_not_active", path: ref.path, identityBearing: true };
  if (ref.itemId !== undefined && ref.itemId !== null && !isNonEmptyString(ref.itemId)) return { classification: "malformed", reason: "invalid_item_identity", path: ref.path, identityBearing: true };
  if (isNonEmptyString(ref.itemId) && artifact.questionIds && !artifact.questionIds.includes(ref.itemId)) return { classification: "orphan", reason: "item_not_in_active_artifact", path: ref.path, identityBearing: true };
  return { classification: "mapped", reason: "exact_active_artifact_match", path: ref.path, identityBearing: true };
}

function parseNestedBackupPayloads(value: unknown, path: string): Readonly<{ collections: readonly IdentityCollection[]; issues: readonly ScanIssue[] }> {
  if (!isRecord(value) || !isRecord(value.materialization) || !Array.isArray(value.materialization.guestBackup)) return { collections: Object.freeze([]), issues: Object.freeze([]) };
  const collections: IdentityCollection[] = [];
  const issues: ScanIssue[] = [];
  const nestedKeys = new Set<string>();
  const nestedPayloads = new Map<string, unknown>();
  const nestedIndexIds = new Map<string, readonly string[]>();
  const seenKeys = new Set<string>();
  const duplicateSources: DuplicateSource[] = [];
  value.materialization.guestBackup.forEach((entry, index) => {
    const entryPath = `${path}.materialization.guestBackup[${index}]`;
    if (!isRecord(entry) || Object.keys(entry).length !== 2 || !("key" in entry) || !("value" in entry) || !isNonEmptyString(entry.key) || typeof entry.value !== "string") {
      issues.push({ classification: "malformed", reason: "invalid_account_guest_backup_entry", path: entryPath, identityBearing: true });
      return;
    }
    if (seenKeys.has(entry.key)) {
      issues.push({ classification: "duplicate", reason: "duplicate_guest_backup_key", path: `${entryPath}.key`, identityBearing: true });
    }
    seenKeys.add(entry.key);
    nestedKeys.add(entry.key);
    const parts = keyParts(entry.key);
    if (!entry.key.startsWith(STORAGE_NAMESPACE) || registryEntryForKey(entry.key) === null) {
      issues.push({ classification: "unsupported", reason: "backup_key_unregistered", path: `${entryPath}.key`, identityBearing: true });
    } else if (!isGuestOwnedLearningKey(entry.key)) {
      issues.push({ classification: "unsupported", reason: "backup_key_not_learning", path: `${entryPath}.key`, identityBearing: true });
    }
    const parsed = parseEnvelope(entry.value);
    if (!("payload" in parsed)) {
      issues.push({ ...parsed, path: `${entryPath}.value`, identityBearing: true });
      return;
    }
    nestedPayloads.set(entry.key, parsed.payload);
    if (parts.kind === "index" && isStringArray(parsed.payload)) nestedIndexIds.set(entry.key, parsed.payload);
    let malformed = false;
    if (parts.entry && isGuestOwnedLearningKey(entry.key)) {
      const shape = payloadShapeIssue(entry.key, parsed.payload, parts.entry, parts.suffix);
      if (shape) {
        malformed = true;
        issues.push({ ...shape, path: `${entryPath}.value.payload${shape.path ? `.${shape.path}` : ""}`, identityBearing: true });
      }
    }
    if (parts.entry) {
      collections.push(extractIdentityRefs(parsed.payload, parts.entry, parts.suffix, `${entryPath}.value.payload`));
      duplicateSources.push({ key: entry.key, payload: parsed.payload, entry: parts.entry, malformed });
      if (parts.entry.selector === STORAGE_KEYS.CONTENT_REPORT_OUTBOX) issues.push(...contentReportDuplicateIssues(parsed.payload, `${entryPath}.value.payload`));
    }
  });
  for (const [nestedKey, payload] of nestedPayloads) {
    if (!isGuestOwnedLearningKey(nestedKey)) continue;
    issues.push(...addRelationshipIssues(nestedKey, payload, nestedKeys, nestedIndexIds, nestedPayloads).map((issue) => ({ ...issue, path: issue.path ? `${path}.materialization.guestBackup.${issue.path}` : `${path}.materialization.guestBackup` })));
  }
  for (const nestedIssues of duplicateIdentityIssues(duplicateSources).values()) issues.push(...nestedIssues);
  return { collections: Object.freeze(collections), issues: Object.freeze(issues) };
}

function contentReportDuplicateIssues(value: unknown, pathRoot = "payload"): readonly ScanIssue[] {
  if (!isContentReportOutboxEntries(value)) return Object.freeze([]);
  const bySubmission = new Map<string, string[]>();
  value.forEach((entry, index) => {
    const paths = bySubmission.get(entry.input.clientSubmissionId) ?? [];
    paths.push(`${pathRoot}[${index}].input.clientSubmissionId`);
    bySubmission.set(entry.input.clientSubmissionId, paths);
  });
  const issues: ScanIssue[] = [];
  for (const paths of bySubmission.values()) {
    if (paths.length < 2) continue;
    paths.forEach((path) => issues.push({ classification: "duplicate", reason: "duplicate_client_submission_id", path, identityBearing: true }));
  }
  return Object.freeze(issues);
}

function accountIdentityKey(value: unknown): string | null {
  if (!isRecord(value) || !isNonEmptyString(value.recordId) || !isNonEmptyString(value.recordType) || !isNonEmptyString(value.trackId)) return null;
  return accountDataRecordKey({ recordId: value.recordId, recordType: value.recordType as SyncableRecordType, trackId: value.trackId });
}

function accountDuplicateIssues(payload: unknown): readonly ScanIssue[] {
  if (!isRecord(payload) || !isCanonicalAccountSyncState(payload)) return Object.freeze([]);
  const issues: ScanIssue[] = [];
  const inspect = (entries: readonly unknown[], pathPrefix: string, identityReason: string, mutationReason: string, identityValue: (entry: unknown) => unknown = (entry) => entry): void => {
    const identities = new Set<string>();
    const mutations = new Set<string>();
    entries.forEach((entry, index) => {
      const itemPath = `${pathPrefix}[${index}]`;
      const identity = accountIdentityKey(identityValue(entry));
      if (identity && identities.has(identity)) issues.push({ classification: "duplicate", reason: identityReason, path: itemPath, identityBearing: true });
      if (identity) identities.add(identity);
      if (isRecord(entry) && isNonEmptyString(entry.mutationId) && mutations.has(entry.mutationId)) issues.push({ classification: "duplicate", reason: mutationReason, path: `${itemPath}.mutationId`, identityBearing: true });
      if (isRecord(entry) && isNonEmptyString(entry.mutationId)) mutations.add(entry.mutationId);
    });
  };
  if (Array.isArray(payload.outbox)) inspect(payload.outbox, "payload.outbox", "duplicate_account_outbox_identity", "duplicate_account_mutation_id");
  if (isRecord(payload.acknowledged)) {
    const identities = new Set<string>();
    Object.entries(payload.acknowledged).forEach(([key, entry], index) => {
      const itemPath = `payload.acknowledged[${index}]`;
      const identity = accountIdentityKey(entry);
      if (identity && key !== identity) issues.push({ classification: "unsupported", reason: "legacy_account_acknowledged_record_key", path: itemPath, identityBearing: true });
      if (identity && identities.has(identity)) issues.push({ classification: "duplicate", reason: "duplicate_account_acknowledged_identity", path: itemPath, identityBearing: true });
      if (identity) identities.add(identity);
    });
  }
  if (isRecord(payload.syncPlan) && Array.isArray(payload.syncPlan.items)) inspect(payload.syncPlan.items, "payload.syncPlan.items", "duplicate_account_sync_plan_identity", "duplicate_account_mutation_id", (entry) => isRecord(entry) ? entry.payload : null);
  return Object.freeze(issues);
}

function accountSyncIssues(payload: unknown): Readonly<{ issues: readonly ScanIssue[]; collections: readonly IdentityCollection[] }> {
  if (!isRecord(payload)) return { issues: Object.freeze([]), collections: Object.freeze([]) };
  const issues: ScanIssue[] = [];
  const collections: IdentityCollection[] = [];
  if (payload.protocolVersion === 1) issues.push({ classification: "unsupported", reason: "legacy_account_sync_protocol", path: "payload.protocolVersion", identityBearing: true });
  if (isRecord(payload.syncPlan) && Array.isArray(payload.syncPlan.items)) {
    payload.syncPlan.items.forEach((item, index) => {
      if (!isRecord(item) || !isRecord(item.payload)) return;
      if (!isNonEmptyString(item.recordKey) || !isNonEmptyString(item.payload.recordId) || !isNonEmptyString(item.payload.recordType) || !(SYNCABLE_RECORD_TYPES as readonly string[]).includes(item.payload.recordType) || !isNonEmptyString(item.payload.trackId) || !isRegisteredTrackId(item.payload.trackId)) return;
      const expected = accountDataRecordKey(item.payload as { recordId: string; recordType: SyncableRecordType; trackId: string });
      if (item.recordKey !== expected) issues.push({ classification: "unsupported", reason: "legacy_account_sync_plan_record_key", path: `payload.syncPlan.items[${index}].recordKey`, identityBearing: true });
    });
  }
  issues.push(...accountDuplicateIssues(payload));
  const backups = parseNestedBackupPayloads(payload, "payload");
  issues.push(...backups.issues);
  collections.push(...backups.collections);
  return Object.freeze({ issues: Object.freeze(issues), collections: Object.freeze(collections) });
}

function issueRank(classification: ContentIdentityInventoryClassification): number {
  return {
    malformed: 100,
    duplicate: 99,
    orphan: 95,
    unsupported: 85,
    unmapped_unknown_hash: 70,
    unmapped_version: 60,
    mapped: 20,
    passthrough: 10,
  }[classification];
}

function chooseClassification(issues: readonly ScanIssue[], fallback: ContentIdentityInventoryClassification): ContentIdentityInventoryClassification {
  if (issues.length === 0) return fallback;
  return [...issues].sort((left, right) => issueRank(right.classification) - issueRank(left.classification) || left.reason.localeCompare(right.reason))[0]!.classification;
}

function classifyFinding(input: Readonly<{
  key: string;
  kind: ContentIdentityInventoryKeyKind;
  entry: RegistryEntry | null;
  payload: unknown;
  baseIssue?: ScanIssue;
  extraIssues?: readonly ScanIssue[];
  artifacts: readonly ActiveContentArtifact[];
  paths?: readonly string[];
}>): ContentIdentityInventoryFinding {
  const { key, kind, entry, payload, artifacts } = input;
  if (!entry) {
    // A namespace key without a registry owner is never eligible for an
    // identity migration, even when its opaque payload contains a valid pin.
    return Object.freeze({ key, kind, owner: "unregistered", classification: "unsupported", identityBearing: true, reason: "namespace_key_unregistered", paths: Object.freeze(input.paths ?? []) });
  }
  const collections: IdentityCollection[] = [];
  const collected = extractIdentityRefs(payload, entry, keyParts(key).suffix, "payload", key === STORAGE_KEYS.ACTIVE_JOURNAL);
  collections.push(collected);
  if (key === STORAGE_KEYS.ACCOUNT_SYNC) collections.push(...accountSyncIssues(payload).collections);
  const issues: ScanIssue[] = [
    ...(input.baseIssue ? [input.baseIssue] : []),
    ...(input.extraIssues ?? []),
    ...collections.flatMap((collection) => [...collection.issues, ...(entry.scope === "learning" || entry.scope === "account_sync" ? collection.refs.map((ref) => classifyIdentityRef(ref, artifacts)) : [])]),
  ];
  const identityBearing = entry?.scope === "learning" || entry?.scope === "account_sync"
    || collected.identityBearing
    || input.baseIssue?.identityBearing === true
    || input.extraIssues?.some((issue) => issue.identityBearing) === true;
  // Identity-bearing metadata such as a report itemId is not itself a
  // package mapping. Only a validated packagePin/contentPackagePin reference
  // can produce the mapped/unmapped identity classifications.
  const hasIdentityRefs = (entry.scope === "learning" || entry.scope === "account_sync") && collections.some((collection) => collection.refs.length > 0);
  const fallback = entry.scope === "unsupported" ? "unsupported" : hasIdentityRefs ? "mapped" : "passthrough";
  const classification = chooseClassification(issues, fallback);
  const paths = [...new Set([
    ...(input.paths ?? []),
    ...issues.map((issue) => issue.path).filter((path): path is string => typeof path === "string"),
    ...collections.flatMap((collection) => collection.refs.map((ref) => ref.path)),
  ])].sort();
  const reason = [...issues].sort((left, right) => issueRank(right.classification) - issueRank(left.classification) || left.reason.localeCompare(right.reason))[0]?.reason
    ?? (classification === "unsupported" ? "namespace_key_unregistered" : classification === "passthrough" ? "no_content_identity_to_migrate" : classification);
  return Object.freeze({ key, kind, owner: entry.owner, classification, identityBearing, reason, paths: Object.freeze(paths) });
}

function sameContentIdentity(left: unknown, right: unknown): boolean {
  if (!isRecord(left) || !isRecord(right)) return false;
  try {
    return left.trackId === right.trackId && left.itemId === right.itemId && left.contentVersion === right.contentVersion && canonicalSerialize(left.packagePin) === canonicalSerialize(right.packagePin);
  } catch {
    return false;
  }
}

function addRelationshipIssues(
  key: string,
  payload: unknown,
  knownKeys: ReadonlySet<string>,
  indexIds: ReadonlyMap<string, readonly string[]>,
  payloadByKey: ReadonlyMap<string, unknown>,
): readonly ScanIssue[] {
  const parts = keyParts(key);
  const issues: ScanIssue[] = [];
  const orphan = (reason: string, path?: string): void => { issues.push({ classification: "orphan", reason, path, identityBearing: true }); };
  if (parts.kind === "index" && parts.entry && isStringArray(payload)) {
    if (new Set(payload).size !== payload.length) issues.push({ classification: "duplicate", reason: "duplicate_index_identity", path: "payload", identityBearing: true });
    const dynamicPrefix = parts.entry.selector === STORAGE_KEYS.TRAINING_SESSION_INDEX ? `${STORAGE_NAMESPACE}training-session:` : parts.entry.selector === STORAGE_KEYS.TRAINING_ATTEMPT_INDEX ? `${STORAGE_NAMESPACE}training-attempt:` : `${STORAGE_NAMESPACE}review-entry:`;
    payload.forEach((id) => { if (!knownKeys.has(`${dynamicPrefix}${id}`)) orphan("index_references_missing_record", `payload[${payload.indexOf(id)}]`); });
  }
  if (parts.kind === "dynamic_prefix" && parts.entry) {
    const suffix = key.slice(parts.entry.selector.length);
    if (parts.entry.selector === `${STORAGE_NAMESPACE}training-session:`) {
      const ids = indexIds.get(STORAGE_KEYS.TRAINING_SESSION_INDEX) ?? [];
      if (!ids.includes(suffix)) orphan("record_missing_from_index");
      if (isRecord(payload) && payload.id !== suffix) issues.push({ classification: "malformed", reason: "record_key_identity_mismatch", identityBearing: true });
    } else if (parts.entry.selector === `${STORAGE_NAMESPACE}training-attempt:`) {
      const ids = indexIds.get(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX) ?? [];
      if (!ids.includes(suffix)) orphan("record_missing_from_index");
      if (isRecord(payload) && payload.id !== suffix) issues.push({ classification: "malformed", reason: "record_key_identity_mismatch", identityBearing: true });
      if (isTrainingAttempt(payload)) {
        const sessionKey = `${STORAGE_NAMESPACE}training-session:${payload.sessionId}`;
        const session = payloadByKey.get(sessionKey);
        if (!knownKeys.has(sessionKey) || !isTrainingSession(session)) orphan("attempt_references_missing_session", "payload.sessionId");
        else {
          if (payload.trackId !== session.trackId) issues.push({ classification: "malformed", reason: "attempt_session_scope_mismatch", path: "payload.trackId", identityBearing: true });
          const occurrence = session.itemOrder.find((candidate) => candidate.occurrenceId === payload.occurrenceId);
          if (!occurrence) orphan("attempt_references_missing_occurrence", "payload.occurrenceId");
          else if (!sameContentIdentity(payload.item, occurrence.item)) issues.push({ classification: "malformed", reason: "attempt_item_identity_mismatch", path: "payload.item", identityBearing: true });
        }
      }
    } else if (parts.entry.selector === `${STORAGE_NAMESPACE}review-entry:`) {
      const ids = indexIds.get(STORAGE_KEYS.REVIEW_INDEX) ?? [];
      if (!ids.includes(suffix)) orphan("record_missing_from_index");
      if (isRecord(payload) && payload.id !== suffix) issues.push({ classification: "malformed", reason: "record_key_identity_mismatch", identityBearing: true });
      if (isReviewQueueEntry(payload)) {
        const sessionKey = `${STORAGE_NAMESPACE}training-session:${payload.sourceSessionId}`;
        const attemptKey = `${STORAGE_NAMESPACE}training-attempt:${payload.sourceAttemptId}`;
        const session = payloadByKey.get(sessionKey);
        const attempt = payloadByKey.get(attemptKey);
        if (!knownKeys.has(sessionKey) || !isTrainingSession(session)) orphan("review_references_missing_session", "payload.sourceSessionId");
        else {
          if (payload.trackId !== session.trackId) issues.push({ classification: "malformed", reason: "review_session_scope_mismatch", path: "payload.trackId", identityBearing: true });
        }
        if (!knownKeys.has(attemptKey) || !isTrainingAttempt(attempt)) orphan("review_references_missing_attempt", "payload.sourceAttemptId");
        else {
          if (attempt.sessionId !== payload.sourceSessionId) issues.push({ classification: "malformed", reason: "review_attempt_session_mismatch", path: "payload.sourceAttemptId", identityBearing: true });
          if (attempt.trackId !== payload.trackId || !sameContentIdentity(payload.sourceItem, attempt.item)) issues.push({ classification: "malformed", reason: "review_attempt_identity_mismatch", path: "payload.sourceItem", identityBearing: true });
        }
      }
    } else if (parts.entry.selector === `${STORAGE_NAMESPACE}training-session-result:`) {
      if (isRecord(payload) && payload.sessionId !== suffix) issues.push({ classification: "malformed", reason: "result_key_identity_mismatch", identityBearing: false });
      if (isTrainingSessionResult(payload)) {
        const sessionKey = `${STORAGE_NAMESPACE}training-session:${payload.sessionId}`;
        const session = payloadByKey.get(sessionKey);
        if (!knownKeys.has(sessionKey) || !isTrainingSession(session)) orphan("result_references_missing_session", "payload.sessionId");
        else {
          if (payload.trackId !== session.trackId) issues.push({ classification: "malformed", reason: "result_session_scope_mismatch", path: "payload.trackId", identityBearing: true });
          if (session.status !== "completed") orphan("result_references_non_completed_session", "payload.sessionId");
        }
      }
    }
  }
  if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION && isNonEmptyString(payload)) {
    const sessionKey = `${STORAGE_NAMESPACE}training-session:${payload}`;
    const session = payloadByKey.get(sessionKey);
    if (!knownKeys.has(sessionKey) || !isTrainingSession(session)) orphan("active_pointer_references_missing_session", "payload");
    else if (session.status !== "active") orphan("active_pointer_references_non_active_session", "payload");
  }
  if (key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT && isRecord(payload) && isNonEmptyString(payload.sessionId)) {
    const sessionKey = `${STORAGE_NAMESPACE}training-session:${payload.sessionId}`;
    const session = payloadByKey.get(sessionKey);
    if (!knownKeys.has(sessionKey) || !isTrainingSession(session)) orphan("draft_references_missing_session", "payload.sessionId");
    else if (session.trackId !== payload.trackId) issues.push({ classification: "malformed", reason: "draft_session_scope_mismatch", path: "payload.trackId", identityBearing: true });
    else if (session.status !== "active") orphan("draft_references_non_active_session", "payload.sessionId");
  }
  if (key === STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER && isForegroundTimerState(payload)) {
    const sessionKey = `${STORAGE_NAMESPACE}training-session:${payload.sessionId}`;
    const session = payloadByKey.get(sessionKey);
    if (!knownKeys.has(sessionKey) || !isTrainingSession(session)) orphan("timer_references_missing_session", "payload.sessionId");
    else {
      if (session.trackId !== payload.trackId) issues.push({ classification: "malformed", reason: "timer_session_scope_mismatch", path: "payload.trackId", identityBearing: true });
      if (session.status !== "active") orphan("timer_references_non_active_session", "payload.sessionId");
    }
  }
  return Object.freeze(issues);
}

function duplicateIdentityIssues(sources: readonly DuplicateSource[]): ReadonlyMap<string, readonly ScanIssue[]> {
  const byIdentity = new Map<string, Array<Readonly<{ key: string; path: string }>>>();
  for (const source of sources) {
    if (source.malformed || source.entry.selector !== `${STORAGE_NAMESPACE}review-entry:`) continue;
    const collection = extractIdentityRefs(source.payload, source.entry, keyParts(source.key).suffix);
    for (const ref of collection.refs) {
      if (!isRecord(ref.packagePin) || typeof ref.packagePin.packageIdentity !== "string" || !isNonEmptyString(ref.itemId)) continue;
      const identity = canonicalSerialize({ trackId: ref.trackId, itemId: ref.itemId, contentVersion: ref.contentVersion, packagePin: ref.packagePin });
      const list = byIdentity.get(identity) ?? [];
      list.push({ key: source.key, path: ref.path });
      byIdentity.set(identity, list);
    }
  }
  const result = new Map<string, ScanIssue[]>();
  for (const occurrences of byIdentity.values()) {
    if (occurrences.length < 2) continue;
    for (const occurrence of occurrences) {
      const issues = result.get(occurrence.key) ?? [];
      issues.push({ classification: "duplicate", reason: "duplicate_durable_review_identity", path: occurrence.path, identityBearing: true });
      result.set(occurrence.key, issues);
    }
  }
  return result;
}

/** Synchronous, storage-only scanner. It performs reads but never writes or removes. */
export function scanContentIdentityInventory(input: ContentIdentityInventoryInput = {}): ContentIdentityInventoryReport {
  const storage = input.storage ?? getKeyValueStorage();
  const artifacts = input.activeArtifacts ?? lockArtifacts;
  const keys = [...storage.getAllKeys()].filter((key) => key.startsWith(STORAGE_NAMESPACE)).sort();
  const knownKeys = new Set(keys);
  const indexIds = new Map<string, readonly string[]>();
  const payloadByKey = new Map<string, unknown>();
  const baseIssues = new Map<string, ScanIssue>();
  const keyDetails = new Map<string, Readonly<{ entry: RegistryEntry | null; kind: ContentIdentityInventoryKeyKind; payload: unknown; extraIssues: readonly ScanIssue[] }>>();
  for (const key of keys) {
    const parts = keyParts(key);
    let parsed: ParsedEnvelope | ScanIssue;
    try { parsed = parseEnvelope(storage.getString(key)); } catch { parsed = { classification: "malformed", reason: "storage_read_failed", identityBearing: parts.entry?.scope === "learning" || parts.entry?.scope === "account_sync" }; }
    if (!("payload" in parsed)) {
      baseIssues.set(key, Object.freeze({ ...parsed, identityBearing: parsed.identityBearing || parts.entry?.scope === "learning" || parts.entry?.scope === "account_sync" }));
      keyDetails.set(key, Object.freeze({ entry: parts.entry, kind: parts.kind, payload: null, extraIssues: Object.freeze([]) }));
      continue;
    }
    payloadByKey.set(key, parsed.payload);
    if (parts.kind === "index" && isStringArray(parsed.payload)) indexIds.set(key, parsed.payload);
    const shapeIssue = parts.entry ? payloadShapeIssue(key, parsed.payload, parts.entry, parts.suffix) : null;
    const extra = key === STORAGE_KEYS.ACCOUNT_SYNC
      ? accountSyncIssues(parsed.payload).issues
      : key === STORAGE_KEYS.CONTENT_REPORT_OUTBOX
        ? contentReportDuplicateIssues(parsed.payload)
        : [];
    if (shapeIssue) baseIssues.set(key, shapeIssue);
    keyDetails.set(key, Object.freeze({ entry: parts.entry, kind: parts.kind, payload: parsed.payload, extraIssues: Object.freeze(extra) }));
  }
  const preliminary: ContentIdentityInventoryFinding[] = [];
  for (const key of keys) {
    const details = keyDetails.get(key)!;
    const relationshipIssues = details.payload === null ? [] : addRelationshipIssues(key, details.payload, knownKeys, indexIds, payloadByKey);
    preliminary.push(classifyFinding({ key, kind: details.kind, entry: details.entry, payload: details.payload, baseIssue: baseIssues.get(key), extraIssues: [...details.extraIssues, ...relationshipIssues], artifacts }));
  }
  const duplicateSources = preliminary.flatMap((finding) => {
    const entry = registryEntryForKey(finding.key);
    const payload = payloadByKey.get(finding.key);
    return entry && payload !== undefined ? [{ key: finding.key, payload, entry, malformed: finding.classification === "malformed" }] : [];
  });
  const duplicateIssues = duplicateIdentityIssues(duplicateSources);
  const findings = preliminary.map((finding) => {
    const extras = duplicateIssues.get(finding.key);
    if (!extras) return finding;
    return classifyFinding({ key: finding.key, kind: finding.kind, entry: registryEntryForKey(finding.key), payload: payloadByKey.get(finding.key), baseIssue: { classification: finding.classification, reason: finding.reason, identityBearing: finding.identityBearing }, extraIssues: extras, artifacts, paths: finding.paths });
  }).sort((left, right) => left.key.localeCompare(right.key));
  const counts = countFindings(findings);
  const digest = sha256Utf8(canonicalSerialize({ inventoryVersion: CONTENT_IDENTITY_INVENTORY_VERSION, namespace: STORAGE_NAMESPACE, counts, findings, backendAudit: backendAudit() }));
  return Object.freeze({ inventoryVersion: CONTENT_IDENTITY_INVENTORY_VERSION, namespace: STORAGE_NAMESPACE, counts, findings: Object.freeze(findings), digest, backendAudit: backendAudit() });
}

export const runContentIdentityInventory = async (input: ContentIdentityInventoryInput = {}): Promise<ContentIdentityInventoryReport> => {
  if (input.activeArtifacts) return scanContentIdentityInventory(input);
  // Runtime catalog adds question membership checks to the static lock. A
  // caller may still inject lock-only artifacts for small deterministic tests.
  const { loadCanonicalRuntimeCatalog } = await import("../../content/canonical/runtimeCatalog");
  const catalog = await loadCanonicalRuntimeCatalog();
  return scanContentIdentityInventory({ ...input, activeArtifacts: runtimeArtifacts(catalog) });
};

function runtimeArtifacts(catalog: CanonicalRuntimeCatalog): readonly ActiveContentArtifact[] {
  return Object.freeze(catalog.tracks.map((trackId) => {
    const track = catalog.getTrack(trackId);
    return Object.freeze({ trackId: track.trackId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256, questionIds: Object.freeze(track.questions.map((question) => question.questionId)) });
  }));
}

function countFindings(findings: readonly ContentIdentityInventoryFinding[]): ContentIdentityInventoryCounts {
  const counts = {
    totalKeys: findings.length,
    identityBearingKeys: findings.filter((finding) => finding.identityBearing).length,
    blockingKeys: findings.filter((finding) => finding.identityBearing && ["malformed", "orphan", "duplicate", "unsupported"].includes(finding.classification)).length,
    mapped: 0,
    unmapped_unknown_hash: 0,
    unmapped_version: 0,
    malformed: 0,
    orphan: 0,
    duplicate: 0,
    passthrough: 0,
    unsupported: 0,
  };
  for (const finding of findings) counts[finding.classification] += 1;
  return Object.freeze(counts);
}
