import { ContentError } from "../content/errors";
import { CorruptStoredRecordError, JournalMaterializationError, JournalVerificationError, JournalWriteError, StorageDeleteError, StorageReadError, StorageWriteError, UnsupportedStoredRecordError } from "../storage/errors";
import { ContentIdentityV2Error } from "../storage/contracts/contentIdentityV2";
import { CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER, CanonicalRepositoryBootstrapStep, type CanonicalRepositoryBootstrapStep as CanonicalRepositoryBootstrapStepCode } from "../storage/repositories/canonicalRepositories";
import { ContentIdentityMigrationError, type ContentIdentityMigrationErrorCode } from "../storage/repositories/contentIdentityMigration";
import {
  CONTENT_IDENTITY_V2_PLANNER_OWNER_CODES,
  CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_ITEM_IDENTITY_CODES,
  CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_PROVENANCE_CODES,
  CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_ROLE_CODES,
  CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_STATUS_CODES,
  CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_TOP_IDENTITY_CODES,
  ContentIdentityV2PlannerError,
  type ContentIdentityV2PlannerErrorCode,
  type ContentIdentityV2PlannerOwnerCode,
  type ContentIdentityV2PlannerTrainingSessionItemIdentityCode,
  type ContentIdentityV2PlannerTrainingSessionProvenanceCode,
  type ContentIdentityV2PlannerTrainingSessionRoleCode,
  type ContentIdentityV2PlannerTrainingSessionStatusCode,
  type ContentIdentityV2PlannerTrainingSessionTopIdentityCode,
} from "../storage/repositories/contentIdentityV2Planner";
import { CONTENT_IDENTITY_LEGACY_TRAINING_SESSION_GUARD_CODES, type LegacyTrainingSessionGuardCode } from "../storage/repositories/contentIdentityInventory";
import { CONTENT_IDENTITY_MIGRATION_BOOTSTRAP_STEP_ORDER, type ContentIdentityMigrationBootstrapStep } from "../storage/repositories/contentIdentityMigrationBootstrap";
import { StorageMetadataError, type StorageMetadataErrorCode } from "../storage/repositories/storageMetadataRepository";

export type OperationalDiagnosticCode = "CONTENT_UNAVAILABLE" | "CONTENT_INVALID" | "STORAGE_READ_FAILED" | "STORAGE_WRITE_FAILED" | "STORAGE_DELETE_FAILED" | "STORAGE_RECORD_INVALID" | "JOURNAL_WRITE_FAILED" | "JOURNAL_MATERIALIZATION_FAILED" | "JOURNAL_VERIFICATION_FAILED" | "LOCAL_OPERATION_FAILED";

/**
 * The ordered application bootstrap stages.  Values intentionally match the
 * user-facing preparation phases where a phase exists, while keeping the
 * active-session invariant checks observable as their own bounded stage.
 */
export enum ApplicationBootstrapStage {
  OpeningStorage = "opening-storage",
  RecoveringLearningState = "recovering-learning-state",
  VerifyingContent = "verifying-content",
  ValidatingActiveSession = "validating-active-session",
  ResumingSession = "resuming-session",
}

/** Closed classification for the existing explicit bootstrap invariants. */
export type BootstrapInvariantCode =
  | "active_session_records_without_reference"
  | "active_session_reference_inconsistent"
  | "active_session_draft_missing"
  | "active_session_draft_mismatch";

export class BootstrapInvariantError extends Error {
  readonly code: BootstrapInvariantCode;

  constructor(code: BootstrapInvariantCode, message: string) {
    super(message);
    this.name = "BootstrapInvariantError";
    this.code = code;
  }
}

export type OperationalDiagnosticErrorKind = "error" | "string" | "object" | "null" | "undefined" | "number" | "boolean" | "symbol" | "bigint" | "function";

export type ContentIdentityMigrationFailureCode =
  | `planner:${ContentIdentityV2PlannerErrorCode}`
  | `migration:${ContentIdentityMigrationErrorCode}`
  | `v2:${ContentIdentityV2Error["code"]}`
  | `metadata:${StorageMetadataErrorCode}`;

export type BootstrapDiagnosticEvent = Readonly<{
  stage: ApplicationBootstrapStage;
  operationalCode: OperationalDiagnosticCode;
  invariantCode?: BootstrapInvariantCode;
  repositoryStepCode?: CanonicalRepositoryBootstrapStepCode;
  contentIdentityMigrationStepCode?: ContentIdentityMigrationBootstrapStep;
  contentIdentityMigrationFailureCode?: ContentIdentityMigrationFailureCode;
  contentIdentityMigrationPlannerOwnerCode?: ContentIdentityV2PlannerOwnerCode;
  contentIdentityMigrationLegacyTrainingSessionGuardCode?: LegacyTrainingSessionGuardCode;
  contentIdentityMigrationTrainingSessionRoleCode?: ContentIdentityV2PlannerTrainingSessionRoleCode;
  contentIdentityMigrationTrainingSessionTopIdentityCode?: ContentIdentityV2PlannerTrainingSessionTopIdentityCode;
  contentIdentityMigrationTrainingSessionItemIdentityCode?: ContentIdentityV2PlannerTrainingSessionItemIdentityCode;
  contentIdentityMigrationTrainingSessionProvenanceCode?: ContentIdentityV2PlannerTrainingSessionProvenanceCode;
  contentIdentityMigrationTrainingSessionStatusCode?: ContentIdentityV2PlannerTrainingSessionStatusCode;
  errorKind: OperationalDiagnosticErrorKind;
}>;

export type BootstrapDiagnosticObserver = (event: BootstrapDiagnosticEvent) => void | PromiseLike<void>;

/** Development-only bridge key; the bridge never exists on the production path. */
export const BOOTSTRAP_DIAGNOSTIC_SYMBOL = Symbol.for("patternly.bootstrap-diagnostic.v1");

type BootstrapDiagnosticHost = typeof globalThis & { [key: symbol]: unknown };
const bootstrapDiagnosticHost = (): BootstrapDiagnosticHost => globalThis as BootstrapDiagnosticHost;

const OPERATIONAL_DIAGNOSTIC_CODES: readonly OperationalDiagnosticCode[] = [
  "CONTENT_UNAVAILABLE",
  "CONTENT_INVALID",
  "STORAGE_READ_FAILED",
  "STORAGE_WRITE_FAILED",
  "STORAGE_DELETE_FAILED",
  "STORAGE_RECORD_INVALID",
  "JOURNAL_WRITE_FAILED",
  "JOURNAL_MATERIALIZATION_FAILED",
  "JOURNAL_VERIFICATION_FAILED",
  "LOCAL_OPERATION_FAILED",
];

const BOOTSTRAP_STAGES: readonly ApplicationBootstrapStage[] = Object.values(ApplicationBootstrapStage);
const BOOTSTRAP_INVARIANT_CODES: readonly BootstrapInvariantCode[] = [
  "active_session_records_without_reference",
  "active_session_reference_inconsistent",
  "active_session_draft_missing",
  "active_session_draft_mismatch",
];
const CONTENT_IDENTITY_MIGRATION_FAILURE_CODES: readonly ContentIdentityMigrationFailureCode[] = [
  "planner:unregistered_key",
  "planner:malformed_envelope",
  "planner:owner_guard_failed",
  "planner:unmapped_package_identity",
  "planner:relationship_invalid",
  "planner:invalid_artifact_set",
  "planner:invalid_source",
  "migration:activation_required",
  "migration:invalid_plan",
  "migration:invalid_verifier",
  "migration:unsupported_protocol",
  "migration:stale_source",
  "migration:source_snapshot_invalid",
  "migration:protocol_state_invalid",
  "migration:backup_incomplete",
  "migration:blocked_recovery",
  "migration:target_verification_failed",
  "migration:manual_recovery_required",
  "migration:storage_read_failed",
  "migration:storage_write_failed",
  "migration:storage_remove_failed",
  "migration:cleanup_error",
  "v2:invalid_v2_record",
  "v2:invalid_v2_resolution",
  "v2:invalid_preservation",
  "v2:forbidden_legacy_identity",
  "metadata:storage_metadata_invalid",
  "metadata:storage_migration_pending",
  "metadata:unsupported_newer_storage_schema",
];
const ERROR_KINDS: readonly OperationalDiagnosticErrorKind[] = ["error", "string", "object", "null", "undefined", "number", "boolean", "symbol", "bigint", "function"];

function hasBoundedLegacyTrainingSessionGuardCode(value: object): boolean {
  try {
    if (!Object.hasOwn(value, "contentIdentityMigrationLegacyTrainingSessionGuardCode")) return true;
    return Reflect.get(value, "repositoryStepCode") === CanonicalRepositoryBootstrapStep.ContentIdentityMigration &&
      Reflect.get(value, "contentIdentityMigrationFailureCode") === "planner:owner_guard_failed" &&
      Reflect.get(value, "contentIdentityMigrationPlannerOwnerCode") === "trainingSessionRepository" &&
      CONTENT_IDENTITY_LEGACY_TRAINING_SESSION_GUARD_CODES.includes(Reflect.get(value, "contentIdentityMigrationLegacyTrainingSessionGuardCode") as LegacyTrainingSessionGuardCode);
  } catch {
    return false;
  }
}

function hasBoundedTrainingSessionShape(value: object): boolean {
  try {
    const fields = [
      "contentIdentityMigrationTrainingSessionRoleCode",
      "contentIdentityMigrationTrainingSessionTopIdentityCode",
      "contentIdentityMigrationTrainingSessionItemIdentityCode",
      "contentIdentityMigrationTrainingSessionProvenanceCode",
      "contentIdentityMigrationTrainingSessionStatusCode",
    ] as const;
    const hasAny = fields.some((field) => Object.hasOwn(value, field));
    if (!hasAny) return true;
    return fields.every((field) => Object.hasOwn(value, field)) &&
      Reflect.get(value, "repositoryStepCode") === CanonicalRepositoryBootstrapStep.ContentIdentityMigration &&
      Reflect.get(value, "contentIdentityMigrationFailureCode") === "planner:owner_guard_failed" &&
      Reflect.get(value, "contentIdentityMigrationPlannerOwnerCode") === "trainingSessionRepository" &&
      CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_ROLE_CODES.includes(Reflect.get(value, "contentIdentityMigrationTrainingSessionRoleCode") as ContentIdentityV2PlannerTrainingSessionRoleCode) &&
      CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_TOP_IDENTITY_CODES.includes(Reflect.get(value, "contentIdentityMigrationTrainingSessionTopIdentityCode") as ContentIdentityV2PlannerTrainingSessionTopIdentityCode) &&
      CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_ITEM_IDENTITY_CODES.includes(Reflect.get(value, "contentIdentityMigrationTrainingSessionItemIdentityCode") as ContentIdentityV2PlannerTrainingSessionItemIdentityCode) &&
      CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_PROVENANCE_CODES.includes(Reflect.get(value, "contentIdentityMigrationTrainingSessionProvenanceCode") as ContentIdentityV2PlannerTrainingSessionProvenanceCode) &&
      CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_STATUS_CODES.includes(Reflect.get(value, "contentIdentityMigrationTrainingSessionStatusCode") as ContentIdentityV2PlannerTrainingSessionStatusCode);
  } catch {
    return false;
  }
}

function isBootstrapDiagnosticEvent(value: unknown): value is BootstrapDiagnosticEvent {
  try {
    if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
    const record = value as Record<string, unknown>;
    const keys = Object.keys(record).sort();
    const expectedKeys = [
      "errorKind",
      ...(record.contentIdentityMigrationFailureCode === undefined ? [] : ["contentIdentityMigrationFailureCode"]),
      ...(record.contentIdentityMigrationLegacyTrainingSessionGuardCode === undefined ? [] : ["contentIdentityMigrationLegacyTrainingSessionGuardCode"]),
      ...(record.contentIdentityMigrationPlannerOwnerCode === undefined ? [] : ["contentIdentityMigrationPlannerOwnerCode"]),
      ...(record.contentIdentityMigrationStepCode === undefined ? [] : ["contentIdentityMigrationStepCode"]),
      ...(record.contentIdentityMigrationTrainingSessionItemIdentityCode === undefined ? [] : ["contentIdentityMigrationTrainingSessionItemIdentityCode"]),
      ...(record.contentIdentityMigrationTrainingSessionProvenanceCode === undefined ? [] : ["contentIdentityMigrationTrainingSessionProvenanceCode"]),
      ...(record.contentIdentityMigrationTrainingSessionRoleCode === undefined ? [] : ["contentIdentityMigrationTrainingSessionRoleCode"]),
      ...(record.contentIdentityMigrationTrainingSessionStatusCode === undefined ? [] : ["contentIdentityMigrationTrainingSessionStatusCode"]),
      ...(record.contentIdentityMigrationTrainingSessionTopIdentityCode === undefined ? [] : ["contentIdentityMigrationTrainingSessionTopIdentityCode"]),
      ...(record.invariantCode === undefined ? [] : ["invariantCode"]),
      "operationalCode",
      ...(record.repositoryStepCode === undefined ? [] : ["repositoryStepCode"]),
      "stage",
    ].sort();
    return keys.length === expectedKeys.length && keys.every((key, index) => key === expectedKeys[index]) &&
      BOOTSTRAP_STAGES.includes(record.stage as ApplicationBootstrapStage) &&
      OPERATIONAL_DIAGNOSTIC_CODES.includes(record.operationalCode as OperationalDiagnosticCode) &&
      (record.contentIdentityMigrationFailureCode === undefined || (
        record.repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration &&
        CONTENT_IDENTITY_MIGRATION_FAILURE_CODES.includes(record.contentIdentityMigrationFailureCode as ContentIdentityMigrationFailureCode)
      )) &&
      hasBoundedLegacyTrainingSessionGuardCode(record) &&
      (record.contentIdentityMigrationPlannerOwnerCode === undefined || (
        record.repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration &&
        typeof record.contentIdentityMigrationFailureCode === "string" &&
        record.contentIdentityMigrationFailureCode.startsWith("planner:") &&
        record.contentIdentityMigrationFailureCode !== "planner:unregistered_key" &&
        record.contentIdentityMigrationFailureCode !== "planner:relationship_invalid" &&
        CONTENT_IDENTITY_V2_PLANNER_OWNER_CODES.includes(record.contentIdentityMigrationPlannerOwnerCode as ContentIdentityV2PlannerOwnerCode)
      )) &&
      (record.contentIdentityMigrationStepCode === undefined || (
        record.repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration &&
        CONTENT_IDENTITY_MIGRATION_BOOTSTRAP_STEP_ORDER.includes(record.contentIdentityMigrationStepCode as ContentIdentityMigrationBootstrapStep)
      )) &&
      hasBoundedTrainingSessionShape(record) &&
      (record.invariantCode === undefined || BOOTSTRAP_INVARIANT_CODES.includes(record.invariantCode as BootstrapInvariantCode)) &&
      (record.repositoryStepCode === undefined || CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER.includes(record.repositoryStepCode as CanonicalRepositoryBootstrapStepCode)) &&
      ERROR_KINDS.includes(record.errorKind as OperationalDiagnosticErrorKind);
  } catch {
    return false;
  }
}

/**
 * Development-only global sink used by the preparation gate.  It carries no
 * raw error data and is not persistence or a production logging path.
 */

export function recordDevelopmentBootstrapDiagnostic(event: BootstrapDiagnosticEvent): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;
  const boundedEvent = Object.freeze({
    stage: event.stage,
    operationalCode: event.operationalCode,
    ...(event.repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration && event.contentIdentityMigrationFailureCode !== undefined ? { contentIdentityMigrationFailureCode: event.contentIdentityMigrationFailureCode } : {}),
    ...(hasBoundedLegacyTrainingSessionGuardCode(event) && Object.hasOwn(event, "contentIdentityMigrationLegacyTrainingSessionGuardCode") ? { contentIdentityMigrationLegacyTrainingSessionGuardCode: event.contentIdentityMigrationLegacyTrainingSessionGuardCode } : {}),
    ...(event.repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration && event.contentIdentityMigrationPlannerOwnerCode !== undefined ? { contentIdentityMigrationPlannerOwnerCode: event.contentIdentityMigrationPlannerOwnerCode } : {}),
    ...(event.repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration && event.contentIdentityMigrationStepCode !== undefined ? { contentIdentityMigrationStepCode: event.contentIdentityMigrationStepCode } : {}),
    ...(hasBoundedTrainingSessionShape(event) && Object.hasOwn(event, "contentIdentityMigrationTrainingSessionRoleCode") ? {
      contentIdentityMigrationTrainingSessionRoleCode: event.contentIdentityMigrationTrainingSessionRoleCode,
      contentIdentityMigrationTrainingSessionTopIdentityCode: event.contentIdentityMigrationTrainingSessionTopIdentityCode,
      contentIdentityMigrationTrainingSessionItemIdentityCode: event.contentIdentityMigrationTrainingSessionItemIdentityCode,
      contentIdentityMigrationTrainingSessionProvenanceCode: event.contentIdentityMigrationTrainingSessionProvenanceCode,
      contentIdentityMigrationTrainingSessionStatusCode: event.contentIdentityMigrationTrainingSessionStatusCode,
    } : {}),
    ...(event.invariantCode === undefined ? {} : { invariantCode: event.invariantCode }),
    ...(event.repositoryStepCode === undefined ? {} : { repositoryStepCode: event.repositoryStepCode }),
    errorKind: event.errorKind,
  });
  try {
    Object.defineProperty(bootstrapDiagnosticHost(), BOOTSTRAP_DIAGNOSTIC_SYMBOL, {
      configurable: true,
      enumerable: false,
      value: boundedEvent,
      writable: false,
    });
  } catch {
    // A hostile or incompatible host must not alter the bootstrap result.
  }
}

export function readDevelopmentBootstrapDiagnostic(): BootstrapDiagnosticEvent | null {
  if (typeof __DEV__ === "undefined" || !__DEV__) return null;
  const value = bootstrapDiagnosticHost()[BOOTSTRAP_DIAGNOSTIC_SYMBOL];
  return isBootstrapDiagnosticEvent(value) ? value : null;
}

export function clearDevelopmentBootstrapDiagnostic(): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;
  try {
    Reflect.deleteProperty(bootstrapDiagnosticHost(), BOOTSTRAP_DIAGNOSTIC_SYMBOL);
  } catch {
    // Clearing an unavailable dev bridge is best-effort and has no product effect.
  }
}

function operationalDiagnosticErrorKind(error: unknown): OperationalDiagnosticErrorKind {
  if (error instanceof Error) return "error";
  if (error === null) return "null";
  return typeof error;
}

function isContentIdentityMigrationFailureCode(value: string): value is ContentIdentityMigrationFailureCode {
  return CONTENT_IDENTITY_MIGRATION_FAILURE_CODES.includes(value as ContentIdentityMigrationFailureCode);
}

function classifyContentIdentityMigrationFailure(error: unknown): ContentIdentityMigrationFailureCode | undefined {
  if (error instanceof ContentIdentityV2PlannerError) {
    const code = `planner:${error.code}`;
    return isContentIdentityMigrationFailureCode(code) ? code : undefined;
  }
  if (error instanceof ContentIdentityMigrationError) {
    const code = `migration:${error.code}`;
    return isContentIdentityMigrationFailureCode(code) ? code : undefined;
  }
  if (error instanceof ContentIdentityV2Error) {
    const code = `v2:${error.code}`;
    return isContentIdentityMigrationFailureCode(code) ? code : undefined;
  }
  if (error instanceof StorageMetadataError) {
    const code = `metadata:${error.code}`;
    return isContentIdentityMigrationFailureCode(code) ? code : undefined;
  }
  return undefined;
}

function boundedTrainingSessionShape(
  error: unknown,
  repositoryStepCode: CanonicalRepositoryBootstrapStep | undefined,
  failureCode: ContentIdentityMigrationFailureCode | undefined,
): Pick<BootstrapDiagnosticEvent, "contentIdentityMigrationTrainingSessionRoleCode" | "contentIdentityMigrationTrainingSessionTopIdentityCode" | "contentIdentityMigrationTrainingSessionItemIdentityCode" | "contentIdentityMigrationTrainingSessionProvenanceCode" | "contentIdentityMigrationTrainingSessionStatusCode"> | undefined {
  if (repositoryStepCode !== CanonicalRepositoryBootstrapStep.ContentIdentityMigration || failureCode !== "planner:owner_guard_failed" || !(error instanceof ContentIdentityV2PlannerError) || error.ownerCode !== "trainingSessionRepository") return undefined;
  const roleCode = error.trainingSessionRoleCode;
  const topIdentityCode = error.trainingSessionTopIdentityCode;
  const itemIdentityCode = error.trainingSessionItemIdentityCode;
  const provenanceCode = error.trainingSessionProvenanceCode;
  const statusCode = error.trainingSessionStatusCode;
  if (!CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_ROLE_CODES.includes(roleCode as ContentIdentityV2PlannerTrainingSessionRoleCode) ||
      !CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_TOP_IDENTITY_CODES.includes(topIdentityCode as ContentIdentityV2PlannerTrainingSessionTopIdentityCode) ||
      !CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_ITEM_IDENTITY_CODES.includes(itemIdentityCode as ContentIdentityV2PlannerTrainingSessionItemIdentityCode) ||
      !CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_PROVENANCE_CODES.includes(provenanceCode as ContentIdentityV2PlannerTrainingSessionProvenanceCode) ||
      !CONTENT_IDENTITY_V2_PLANNER_TRAINING_SESSION_STATUS_CODES.includes(statusCode as ContentIdentityV2PlannerTrainingSessionStatusCode)) return undefined;
  return {
    contentIdentityMigrationTrainingSessionRoleCode: roleCode,
    contentIdentityMigrationTrainingSessionTopIdentityCode: topIdentityCode,
    contentIdentityMigrationTrainingSessionItemIdentityCode: itemIdentityCode,
    contentIdentityMigrationTrainingSessionProvenanceCode: provenanceCode,
    contentIdentityMigrationTrainingSessionStatusCode: statusCode,
  };
}

/**
 * Notify a diagnostic observer without allowing diagnostics to alter the
 * bootstrap result.  The observer receives a closed structural projection;
 * message, stack, identifiers and payloads never cross this boundary.
 */
export function observeBootstrapFailure(
  observer: BootstrapDiagnosticObserver | undefined,
  stage: ApplicationBootstrapStage,
  error: unknown,
  repositoryStepCode?: CanonicalRepositoryBootstrapStepCode,
  contentIdentityMigrationStepCode?: ContentIdentityMigrationBootstrapStep,
): void {
  if (!observer) return;
  try {
    const contentIdentityMigrationFailureCode = repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration
      ? classifyContentIdentityMigrationFailure(error)
      : undefined;
    const contentIdentityMigrationPlannerOwnerCode = repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration &&
      error instanceof ContentIdentityV2PlannerError &&
      contentIdentityMigrationFailureCode !== undefined &&
      contentIdentityMigrationFailureCode !== "planner:relationship_invalid" &&
      contentIdentityMigrationFailureCode !== "planner:unregistered_key" &&
      error.ownerCode !== undefined &&
      CONTENT_IDENTITY_V2_PLANNER_OWNER_CODES.includes(error.ownerCode)
      ? error.ownerCode
      : undefined;
    const contentIdentityMigrationLegacyTrainingSessionGuardCode = repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration &&
      error instanceof ContentIdentityV2PlannerError &&
      contentIdentityMigrationFailureCode === "planner:owner_guard_failed" &&
      error.ownerCode === "trainingSessionRepository" &&
      error.legacyTrainingSessionGuardCode !== undefined &&
      CONTENT_IDENTITY_LEGACY_TRAINING_SESSION_GUARD_CODES.includes(error.legacyTrainingSessionGuardCode)
      ? error.legacyTrainingSessionGuardCode
      : undefined;
    const contentIdentityMigrationTrainingSessionShape = boundedTrainingSessionShape(error, repositoryStepCode, contentIdentityMigrationFailureCode);
    const event: BootstrapDiagnosticEvent = Object.freeze({
      stage,
      operationalCode: operationalDiagnosticCode(error),
      ...(contentIdentityMigrationFailureCode === undefined ? {} : { contentIdentityMigrationFailureCode }),
      ...(contentIdentityMigrationLegacyTrainingSessionGuardCode === undefined ? {} : { contentIdentityMigrationLegacyTrainingSessionGuardCode }),
      ...(contentIdentityMigrationPlannerOwnerCode === undefined ? {} : { contentIdentityMigrationPlannerOwnerCode }),
      ...(contentIdentityMigrationTrainingSessionShape === undefined ? {} : contentIdentityMigrationTrainingSessionShape),
      ...(repositoryStepCode === CanonicalRepositoryBootstrapStep.ContentIdentityMigration && contentIdentityMigrationStepCode !== undefined ? { contentIdentityMigrationStepCode } : {}),
      ...(error instanceof BootstrapInvariantError ? { invariantCode: error.code } : {}),
      ...(repositoryStepCode === undefined ? {} : { repositoryStepCode }),
      errorKind: operationalDiagnosticErrorKind(error),
    });
    const observation = observer(event);
    if (observation && typeof observation === "object" && typeof observation.then === "function") {
      void Promise.resolve(observation).catch(() => undefined);
    }
  } catch {
    // Diagnostics are strictly best-effort and must never change bootstrap.
  }
}

/** The sole learner-visible projection of an operational failure. */
export function operationalDiagnosticCode(error: unknown): OperationalDiagnosticCode {
  if (error instanceof ContentError) return error.code === "unavailable" ? "CONTENT_UNAVAILABLE" : "CONTENT_INVALID";
  if (error instanceof StorageReadError) return "STORAGE_READ_FAILED";
  if (error instanceof StorageWriteError) return "STORAGE_WRITE_FAILED";
  if (error instanceof StorageDeleteError) return "STORAGE_DELETE_FAILED";
  if (error instanceof CorruptStoredRecordError || error instanceof UnsupportedStoredRecordError) return "STORAGE_RECORD_INVALID";
  if (error instanceof JournalWriteError) return "JOURNAL_WRITE_FAILED";
  if (error instanceof JournalMaterializationError) return "JOURNAL_MATERIALIZATION_FAILED";
  if (error instanceof JournalVerificationError) return "JOURNAL_VERIFICATION_FAILED";
  return "LOCAL_OPERATION_FAILED";
}

export function describeOperationalFailure(error: unknown, fallback: string): string {
  return `${fallback} [${operationalDiagnosticCode(error)}]`;
}
