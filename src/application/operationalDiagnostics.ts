import { markStartup } from "../infrastructure/diagnostics/startupTrace";
import { ContentError } from "../content/errors";
import { CorruptStoredRecordError, JournalMaterializationError, JournalVerificationError, JournalWriteError, StorageDeleteError, StorageReadError, StorageWriteError, UnsupportedStoredRecordError } from "../storage/errors";
import { CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER, type CanonicalRepositoryBootstrapStep as CanonicalRepositoryBootstrapStepCode } from "../storage/repositories/canonicalRepositories";
import { isPatternlySmokeRuntime } from "../infrastructure/runtime/runtimeMode";
import { encryptedStorageFailureCode, type EncryptedStorageFailureCode } from "../infrastructure/storage/encryptedStorageBootstrap";
import type { LocalLogoutControlError } from "../infrastructure/storage/localLogoutControl";
import type { ProfileStorageError } from "../infrastructure/storage/profileStorageRouter";
import { NodePackageStorageIntegrityError, NodePackageStorageUnavailableError } from "../content/runtime/nodeContentPackage";

export type OperationalDiagnosticCode = "CONTENT_UNAVAILABLE" | "CONTENT_INVALID" | "NODE_PACKAGE_STORAGE_CORRUPT" | "NODE_PACKAGE_STORAGE_UNSUPPORTED" | "NODE_PACKAGE_IDENTITY_MISMATCH" | "NODE_PACKAGE_STORAGE_UNAVAILABLE" | "STORAGE_READ_FAILED" | "STORAGE_WRITE_FAILED" | "STORAGE_DELETE_FAILED" | "STORAGE_RECORD_INVALID" | "JOURNAL_WRITE_FAILED" | "JOURNAL_MATERIALIZATION_FAILED" | "JOURNAL_VERIFICATION_FAILED" | "LOCAL_OPERATION_FAILED";

/** Ordered application bootstrap stages exposed to the diagnostic boundary. */
export enum ApplicationBootstrapStage {
  OpeningStorage = "opening-storage",
  RecoveringLearningState = "recovering-learning-state",
  VerifyingContent = "verifying-content",
  ValidatingActiveSession = "validating-active-session",
  ResumingSession = "resuming-session",
}

export type BootstrapInvariantCode =
  | "active_session_records_without_reference"
  | "active_session_reference_inconsistent"
  | "active_session_draft_missing"
  | "active_session_draft_mismatch"
  | "active_session_changed_during_resume";

export class BootstrapInvariantError extends Error {
  readonly code: BootstrapInvariantCode;

  constructor(code: BootstrapInvariantCode, message: string) {
    super(message);
    this.name = "BootstrapInvariantError";
    this.code = code;
  }
}

export type OperationalDiagnosticErrorKind = "error" | "string" | "object" | "null" | "undefined" | "number" | "boolean" | "symbol" | "bigint" | "function";

export type BootstrapDiagnosticEvent = Readonly<{
  stage: ApplicationBootstrapStage;
  operationalCode: OperationalDiagnosticCode;
  invariantCode?: BootstrapInvariantCode;
  repositoryStepCode?: CanonicalRepositoryBootstrapStepCode;
  errorKind: OperationalDiagnosticErrorKind;
}>;

export type BootstrapDiagnosticObserver = (event: BootstrapDiagnosticEvent) => void | PromiseLike<void>;

/** Only the bounded recovery awaits that can keep ContentPreparationGate in its recovery phase. */
export type BootstrapRecoveryPendingStep =
  | "profile_completion"
  | "lifecycle_composition"
  | "actor_anchor_capture"
  | "auditability_command"
  | "pending_journal_recovery"
  | "active_session_read"
  | "operation_projection_reconstruction";

export type BootstrapRecoveryStepObserver = (step: BootstrapRecoveryPendingStep | null) => void;

export type ProfileStoragePreparationDiagnosticStage = "logout_control_create" | "logout_control_read" | "profile_storage_prepare" | "profile_state_inspect" | "complete";
export type ProfileStoragePreparationErrorCategory = OperationalDiagnosticCode | EncryptedStorageFailureCode
  | LocalLogoutControlError["code"] | ProfileStorageError["code"] | "unknown";
export type ProfileStoragePreparationDiagnostic = Readonly<{
  schema: "patternly.profile-storage-preparation-diagnostic.v1";
  status: "pending" | "ready" | "failed";
  stage: ProfileStoragePreparationDiagnosticStage;
  errorCategory?: ProfileStoragePreparationErrorCategory;
}>;

export type ProfileStoragePreparationDiagnosticWriter = Readonly<{
  pending: (stage: Exclude<ProfileStoragePreparationDiagnosticStage, "complete">) => void;
  ready: () => void;
  failed: (stage: Exclude<ProfileStoragePreparationDiagnosticStage, "complete">, error: unknown) => void;
  dispose: () => void;
}>;

export type AccountStartupDiagnosticStage = "auth_client_setup" | "auth_observer_wait" | "auth_event" | "recovery_guard" | "guest_storage_prepare" | "guest_state_inspect" | "guest_scope_prepare" | "account_profile_prepare" | "profile_preparing" | "profile_completion" | "complete";
export type AccountStartupDiagnosticStateKind = "loading" | "profilePreparing" | "unavailable" | "signedOut" | "guest" | "guestAccessBlocked" | "recoveryPending" | "providerRegistrationRequired" | "verificationPending" | "authenticated" | "localOffline" | "deletionPending" | "signingOut" | "signOutPending" | "deleting" | "backendUnavailable" | "reauthenticationRequired" | "revokedSession";
export type AccountStartupDiagnostic = Readonly<{
  schema: "patternly.account-startup-diagnostic.v1";
  status: "pending" | "ready" | "failed";
  stage: AccountStartupDiagnosticStage;
  accountStateKind?: AccountStartupDiagnosticStateKind;
  errorCategory?: ProfileStoragePreparationErrorCategory;
}>;
export type AccountStartupDiagnosticWriter = Readonly<{
  pending: (stage: Exclude<AccountStartupDiagnosticStage, "complete">, accountStateKind?: AccountStartupDiagnosticStateKind) => void;
  ready: (accountStateKind?: AccountStartupDiagnosticStateKind) => void;
  failed: (stage: Exclude<AccountStartupDiagnosticStage, "complete">, error: unknown, accountStateKind?: AccountStartupDiagnosticStateKind) => void;
  dispose: () => void;
}>;

const BOOTSTRAP_PENDING_STEP_SYMBOL = Symbol.for("patternly.bootstrap.pending-step.v1");
const BOOTSTRAP_PENDING_OWNER_SYMBOL = Symbol.for("patternly.bootstrap.pending-step-owner.v1");
const PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_SYMBOL = Symbol.for("patternly.profile-storage-preparation-diagnostic.v1");
const PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_OWNER_SYMBOL = Symbol.for("patternly.profile-storage-preparation-diagnostic-owner.v1");
const ACCOUNT_STARTUP_DIAGNOSTIC_SYMBOL = Symbol.for("patternly.account-startup-diagnostic.v1");
const ACCOUNT_STARTUP_DIAGNOSTIC_OWNER_SYMBOL = Symbol.for("patternly.account-startup-diagnostic-owner.v1");
type BootstrapProgressHost = typeof globalThis & { [key: symbol]: unknown };
const bootstrapProgressHost = (): BootstrapProgressHost => globalThis as BootstrapProgressHost;
const BOOTSTRAP_RECOVERY_PENDING_STEPS: readonly BootstrapRecoveryPendingStep[] = Object.freeze([
  "profile_completion",
  "lifecycle_composition",
  "actor_anchor_capture",
  "auditability_command",
  "pending_journal_recovery",
  "active_session_read",
  "operation_projection_reconstruction",
]);

function developmentSmokeDiagnosticsEnabled(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && isPatternlySmokeRuntime();
}

const PROFILE_STORAGE_PREPARATION_STAGES: readonly ProfileStoragePreparationDiagnosticStage[] = ["logout_control_create", "logout_control_read", "profile_storage_prepare", "profile_state_inspect", "complete"];
const ACCOUNT_STARTUP_STAGES: readonly AccountStartupDiagnosticStage[] = ["auth_client_setup", "auth_observer_wait", "auth_event", "recovery_guard", "guest_storage_prepare", "guest_state_inspect", "guest_scope_prepare", "account_profile_prepare", "profile_preparing", "profile_completion", "complete"];
const ACCOUNT_STATE_KINDS: readonly AccountStartupDiagnosticStateKind[] = ["loading", "profilePreparing", "unavailable", "signedOut", "guest", "guestAccessBlocked", "recoveryPending", "providerRegistrationRequired", "verificationPending", "authenticated", "localOffline", "deletionPending", "signingOut", "signOutPending", "deleting", "backendUnavailable", "reauthenticationRequired", "revokedSession"];
const ENCRYPTED_STORAGE_CATEGORIES: readonly EncryptedStorageFailureCode[] = ["secure_store_temporarily_unavailable", "encrypted_storage_key_missing", "encrypted_storage_unavailable", "storage_manifest_corrupt", "storage_migration_incomplete", "legacy_cleanup_failed"];
const LOCAL_LOGOUT_CATEGORIES: readonly LocalLogoutControlError["code"][] = ["local_logout_control_corrupt", "local_logout_control_unavailable", "local_logout_control_verification_failed"];
const PROFILE_STORAGE_CATEGORIES: readonly ProfileStorageError["code"][] = ["profile_registry_corrupt", "legacy_profile_unidentified", "profile_scope_unavailable", "profile_transition_cancelled", "prepared_guest_choice_required", "profile_removal_recovery_required", "account_binding_corrupt", "account_binding_ambiguous", "account_binding_conflict", "account_binding_commit_unverified"];

function preparationErrorCategory(error: unknown): ProfileStoragePreparationErrorCategory {
  const encrypted = encryptedStorageFailureCode(error);
  if (encrypted && ENCRYPTED_STORAGE_CATEGORIES.includes(encrypted)) return encrypted;
  if (typeof error === "object" && error !== null) {
    const record = error as Readonly<{ name?: unknown; code?: unknown }>;
    if (record.name === "LocalLogoutControlError" && typeof record.code === "string" && LOCAL_LOGOUT_CATEGORIES.includes(record.code as LocalLogoutControlError["code"])) return record.code as LocalLogoutControlError["code"];
    if (record.name === "ProfileStorageError" && typeof record.code === "string" && PROFILE_STORAGE_CATEGORIES.includes(record.code as ProfileStorageError["code"])) return record.code as ProfileStorageError["code"];
  }
  if (!(error instanceof Error)) return "unknown";
  const operational = operationalDiagnosticCode(error);
  return OPERATIONAL_DIAGNOSTIC_CODES.includes(operational) ? operational : "unknown";
}

function isProfileStoragePreparationDiagnostic(value: unknown): value is ProfileStoragePreparationDiagnostic {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const record = value as Record<string, unknown>;
  const expectedKeys = ["schema", "stage", "status", ...(record.errorCategory === undefined ? [] : ["errorCategory"])].sort();
  const categories = [...OPERATIONAL_DIAGNOSTIC_CODES, ...ENCRYPTED_STORAGE_CATEGORIES, ...LOCAL_LOGOUT_CATEGORIES, ...PROFILE_STORAGE_CATEGORIES, "unknown"];
  return Object.keys(record).sort().join("\u0000") === expectedKeys.join("\u0000")
    && record.schema === "patternly.profile-storage-preparation-diagnostic.v1"
    && ["pending", "ready", "failed"].includes(record.status as string)
    && PROFILE_STORAGE_PREPARATION_STAGES.includes(record.stage as ProfileStoragePreparationDiagnosticStage)
    && (record.errorCategory === undefined || categories.includes(record.errorCategory as string));
}

/** Latest in-memory dev-smoke receipt only; this observes the existing gate awaits without starting work. */
export function readDevelopmentProfileStoragePreparationDiagnostic(): ProfileStoragePreparationDiagnostic | null {
  if (!developmentSmokeDiagnosticsEnabled()) return null;
  try {
    const value = bootstrapProgressHost()[PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_SYMBOL];
    if (!isProfileStoragePreparationDiagnostic(value)) return null;
    return Object.freeze({ ...value });
  } catch { return null; }
}

function isAccountStartupDiagnostic(value: unknown): value is AccountStartupDiagnostic {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const record = value as Record<string, unknown>;
  const expectedKeys = ["schema", "stage", "status", ...(record.accountStateKind === undefined ? [] : ["accountStateKind"]), ...(record.errorCategory === undefined ? [] : ["errorCategory"])].sort();
  const categories = [...OPERATIONAL_DIAGNOSTIC_CODES, ...ENCRYPTED_STORAGE_CATEGORIES, ...LOCAL_LOGOUT_CATEGORIES, ...PROFILE_STORAGE_CATEGORIES, "unknown"];
  return Object.keys(record).sort().join("\u0000") === expectedKeys.join("\u0000")
    && record.schema === "patternly.account-startup-diagnostic.v1"
    && ["pending", "ready", "failed"].includes(record.status as string)
    && ACCOUNT_STARTUP_STAGES.includes(record.stage as AccountStartupDiagnosticStage)
    && (record.accountStateKind === undefined || ACCOUNT_STATE_KINDS.includes(record.accountStateKind as AccountStartupDiagnosticStateKind))
    && (record.errorCategory === undefined || categories.includes(record.errorCategory as string));
}

/** Latest closed account-startup receipt in RAM for dev-smoke diagnosis. */
export function readDevelopmentAccountStartupDiagnostic(): AccountStartupDiagnostic | null {
  if (!developmentSmokeDiagnosticsEnabled()) return null;
  try {
    const value = bootstrapProgressHost()[ACCOUNT_STARTUP_DIAGNOSTIC_SYMBOL];
    if (!isAccountStartupDiagnostic(value)) return null;
    return Object.freeze({ ...value });
  } catch { return null; }
}

/** Attempt owner is replaced on every new startup event; cleanup removes only its own pending receipt. */
export function createAccountStartupDiagnosticWriter(): AccountStartupDiagnosticWriter {
  const inert = Object.freeze({ pending: () => undefined, ready: () => undefined, failed: () => undefined, dispose: () => undefined });
  if (!developmentSmokeDiagnosticsEnabled()) return inert;
  const host = bootstrapProgressHost();
  const owner = Object.freeze({});
  try {
    Object.defineProperty(host, ACCOUNT_STARTUP_DIAGNOSTIC_OWNER_SYMBOL, { configurable: true, enumerable: false, value: owner, writable: false });
  } catch { return inert; }
  const write = (status: AccountStartupDiagnostic["status"], stage: AccountStartupDiagnosticStage, accountStateKind?: AccountStartupDiagnosticStateKind, error?: unknown) => {
    try {
      if (host[ACCOUNT_STARTUP_DIAGNOSTIC_OWNER_SYMBOL] !== owner) return;
      markStartup(`account:${stage}`);
      const receipt: AccountStartupDiagnostic = Object.freeze({
        schema: "patternly.account-startup-diagnostic.v1",
        status,
        stage,
        ...(accountStateKind ? { accountStateKind } : {}),
        ...(status === "failed" ? { errorCategory: preparationErrorCategory(error) } : {}),
      });
      Object.defineProperty(host, ACCOUNT_STARTUP_DIAGNOSTIC_SYMBOL, { configurable: true, enumerable: false, value: receipt, writable: false });
    } catch { /* diagnostics never alter account startup */ }
  };
  return Object.freeze({
    pending: (stage, accountStateKind) => write("pending", stage, accountStateKind),
    ready: (accountStateKind) => write("ready", "complete", accountStateKind),
    failed: (stage, error, accountStateKind) => write("failed", stage, accountStateKind, error),
    dispose: () => {
      try {
        if (host[ACCOUNT_STARTUP_DIAGNOSTIC_OWNER_SYMBOL] !== owner) return;
        const receipt = host[ACCOUNT_STARTUP_DIAGNOSTIC_SYMBOL];
        if (isAccountStartupDiagnostic(receipt) && receipt.status === "pending") Reflect.deleteProperty(host, ACCOUNT_STARTUP_DIAGNOSTIC_SYMBOL);
        Reflect.deleteProperty(host, ACCOUNT_STARTUP_DIAGNOSTIC_OWNER_SYMBOL);
      } catch { /* stale or non-configurable bridge is harmless */ }
    },
  });
}

/** Per-gate writer fenced across retries and HMR; disposal clears only its own pending receipt. */
export function createProfileStoragePreparationDiagnosticWriter(): ProfileStoragePreparationDiagnosticWriter {
  const inert = Object.freeze({ pending: () => undefined, ready: () => undefined, failed: () => undefined, dispose: () => undefined });
  if (!developmentSmokeDiagnosticsEnabled()) return inert;
  const host = bootstrapProgressHost();
  const owner = Object.freeze({});
  try {
    Object.defineProperty(host, PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_OWNER_SYMBOL, { configurable: true, enumerable: false, value: owner, writable: false });
  } catch { return inert; }
  const write = (status: ProfileStoragePreparationDiagnostic["status"], stage: ProfileStoragePreparationDiagnosticStage, error?: unknown) => {
    try {
      if (host[PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_OWNER_SYMBOL] !== owner) return;
      markStartup(`profile_storage:${stage}`);
      const receipt: ProfileStoragePreparationDiagnostic = Object.freeze({
        schema: "patternly.profile-storage-preparation-diagnostic.v1",
        status,
        stage,
        ...(status === "failed" ? { errorCategory: preparationErrorCategory(error) } : {}),
      });
      Object.defineProperty(host, PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_SYMBOL, { configurable: true, enumerable: false, value: receipt, writable: false });
    } catch { /* diagnostic bridge is best-effort */ }
  };
  return Object.freeze({
    pending: (stage) => write("pending", stage),
    ready: () => write("ready", "complete"),
    failed: (stage, error) => write("failed", stage, error),
    dispose: () => {
      try {
        if (host[PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_OWNER_SYMBOL] !== owner) return;
        const receipt = host[PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_SYMBOL];
        if (isProfileStoragePreparationDiagnostic(receipt) && receipt.status === "pending") Reflect.deleteProperty(host, PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_SYMBOL);
        Reflect.deleteProperty(host, PROFILE_STORAGE_PREPARATION_DIAGNOSTIC_OWNER_SYMBOL);
      } catch { /* stale or non-configurable bridge is harmless */ }
    },
  });
}

function currentBootstrapProgressOwner(host: BootstrapProgressHost): object | null {
  try {
    const value = host[BOOTSTRAP_PENDING_OWNER_SYMBOL];
    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}

/** A private attempt owner for a single dev-smoke bootstrap. No user data is stored or exposed. */
export function createBootstrapProgressObserver(): Readonly<{
  observeStep: BootstrapRecoveryStepObserver;
  observeFailure: BootstrapDiagnosticObserver;
  dispose: () => void;
}> {
  const inert = Object.freeze({ observeStep: () => undefined, observeFailure: () => undefined, dispose: () => undefined });
  if (!developmentSmokeDiagnosticsEnabled()) {
    return inert;
  }
  const host = bootstrapProgressHost();
  const owner = Object.freeze({});
  try {
    Object.defineProperty(host, BOOTSTRAP_PENDING_OWNER_SYMBOL, { configurable: true, enumerable: false, value: owner, writable: false });
    Reflect.deleteProperty(host, BOOTSTRAP_PENDING_STEP_SYMBOL);
  } catch {
    return inert;
  }
  const ownsCurrentAttempt = () => currentBootstrapProgressOwner(host) === owner;
  const observeStep: BootstrapRecoveryStepObserver = (step) => {
    if (!ownsCurrentAttempt()) return;
    markStartup(`recovery:${step ?? "idle"}`);
    try {
      if (step === null) {
        Reflect.deleteProperty(host, BOOTSTRAP_PENDING_STEP_SYMBOL);
        return;
      }
      if (!BOOTSTRAP_RECOVERY_PENDING_STEPS.includes(step)) return;
      Object.defineProperty(host, BOOTSTRAP_PENDING_STEP_SYMBOL, {
        configurable: true,
        enumerable: false,
        value: Object.freeze({ step }),
        writable: false,
      });
    } catch { /* Diagnostics never change recovery behavior. */ }
  };
  const observeFailure: BootstrapDiagnosticObserver = (event) => {
    if (!ownsCurrentAttempt()) return;
    recordDevelopmentBootstrapDiagnostic(event);
    try { Reflect.deleteProperty(host, BOOTSTRAP_PENDING_STEP_SYMBOL); } catch { /* Diagnostics are best-effort. */ }
  };
  const dispose = () => {
    if (!ownsCurrentAttempt()) return;
    try {
      Reflect.deleteProperty(host, BOOTSTRAP_PENDING_STEP_SYMBOL);
      Reflect.deleteProperty(host, BOOTSTRAP_PENDING_OWNER_SYMBOL);
    } catch { /* Diagnostics are best-effort. */ }
  };
  return Object.freeze({ observeStep, observeFailure, dispose });
}

/** Read only the current recovery-step enum from the dev-smoke bridge. */
export function readDevelopmentBootstrapPendingStep(): BootstrapRecoveryPendingStep | null {
  if (!developmentSmokeDiagnosticsEnabled()) return null;
  try {
    const host = bootstrapProgressHost();
    if (!currentBootstrapProgressOwner(host)) return null;
    const value = host[BOOTSTRAP_PENDING_STEP_SYMBOL];
    if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return null;
    const record = value as Record<string, unknown>;
    return Object.keys(record).length === 1 && Object.keys(record)[0] === "step"
      && typeof record.step === "string" && BOOTSTRAP_RECOVERY_PENDING_STEPS.includes(record.step as BootstrapRecoveryPendingStep)
      ? record.step as BootstrapRecoveryPendingStep
      : null;
  } catch {
    return null;
  }
}

/** Development-only bridge key; the bridge never exists on the production path. */
export const BOOTSTRAP_DIAGNOSTIC_SYMBOL = Symbol.for("patternly.bootstrap-diagnostic.v1");

type BootstrapDiagnosticHost = typeof globalThis & { [key: symbol]: unknown };
const bootstrapDiagnosticHost = (): BootstrapDiagnosticHost => globalThis as BootstrapDiagnosticHost;

const OPERATIONAL_DIAGNOSTIC_CODES: readonly OperationalDiagnosticCode[] = [
  "CONTENT_UNAVAILABLE",
  "CONTENT_INVALID",
  "NODE_PACKAGE_STORAGE_CORRUPT",
  "NODE_PACKAGE_STORAGE_UNSUPPORTED",
  "NODE_PACKAGE_IDENTITY_MISMATCH",
  "NODE_PACKAGE_STORAGE_UNAVAILABLE",
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
  "active_session_changed_during_resume",
];
const ERROR_KINDS: readonly OperationalDiagnosticErrorKind[] = ["error", "string", "object", "null", "undefined", "number", "boolean", "symbol", "bigint", "function"];

function isBootstrapDiagnosticEvent(value: unknown): value is BootstrapDiagnosticEvent {
  if (value === null || typeof value !== "object" || !Object.isFrozen(value)) return false;
  const record = value as Record<string, unknown>;
  const expectedKeys = [
    "errorKind",
    ...(record.invariantCode === undefined ? [] : ["invariantCode"]),
    "operationalCode",
    ...(record.repositoryStepCode === undefined ? [] : ["repositoryStepCode"]),
    "stage",
  ].sort();
  const keys = Object.keys(record).sort();
  return keys.length === expectedKeys.length
    && keys.every((key, index) => key === expectedKeys[index])
    && BOOTSTRAP_STAGES.includes(record.stage as ApplicationBootstrapStage)
    && OPERATIONAL_DIAGNOSTIC_CODES.includes(record.operationalCode as OperationalDiagnosticCode)
    && (record.invariantCode === undefined || BOOTSTRAP_INVARIANT_CODES.includes(record.invariantCode as BootstrapInvariantCode))
    && (record.repositoryStepCode === undefined || CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER.includes(record.repositoryStepCode as CanonicalRepositoryBootstrapStepCode))
    && ERROR_KINDS.includes(record.errorKind as OperationalDiagnosticErrorKind);
}

export function recordDevelopmentBootstrapDiagnostic(event: BootstrapDiagnosticEvent): void {
  if (typeof __DEV__ === "undefined" || !__DEV__) return;
  const boundedEvent = Object.freeze({
    stage: event.stage,
    operationalCode: event.operationalCode,
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

/** Notify a diagnostic observer without exposing raw errors or record payloads. */
export function observeBootstrapFailure(
  observer: BootstrapDiagnosticObserver | undefined,
  stage: ApplicationBootstrapStage,
  error: unknown,
  repositoryStepCode?: CanonicalRepositoryBootstrapStepCode,
): void {
  if (!observer) return;
  try {
    const event: BootstrapDiagnosticEvent = Object.freeze({
      stage,
      operationalCode: operationalDiagnosticCode(error),
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
  if (error instanceof NodePackageStorageIntegrityError) {
    if (error.code === "unsupported") return "NODE_PACKAGE_STORAGE_UNSUPPORTED";
    if (error.code === "identity_mismatch") return "NODE_PACKAGE_IDENTITY_MISMATCH";
    return "NODE_PACKAGE_STORAGE_CORRUPT";
  }
  if (error instanceof NodePackageStorageUnavailableError) return "NODE_PACKAGE_STORAGE_UNAVAILABLE";
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
  if (error instanceof NodePackageStorageIntegrityError) {
    if (error.code === "unsupported") return "This app version can't read the saved Premium package format. The data was left in place. Update Patternly to continue.";
    if (error.code === "identity_mismatch") return "Saved Premium content doesn't match this topic. The operation is blocked and the stored files were left in place.";
    return "Patternly couldn't verify saved Premium content on this device. The operation is blocked and the stored files were left in place.";
  }
  if (error instanceof NodePackageStorageUnavailableError) return error.requiresReadOnlyReconciliation
    ? "Patternly couldn't confirm the saved Premium content state. This operation is blocked; try again later."
    : "Patternly couldn't read saved Premium content. Try again later.";
  return fallback + " [" + operationalDiagnosticCode(error) + "]";
}
