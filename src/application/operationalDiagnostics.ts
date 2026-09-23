import { ContentError } from "../content/errors";
import { CorruptStoredRecordError, JournalMaterializationError, JournalVerificationError, JournalWriteError, StorageDeleteError, StorageReadError, StorageWriteError, UnsupportedStoredRecordError } from "../storage/errors";
import { CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER, type CanonicalRepositoryBootstrapStep as CanonicalRepositoryBootstrapStepCode } from "../storage/repositories/canonicalRepositories";

export type OperationalDiagnosticCode = "CONTENT_UNAVAILABLE" | "CONTENT_INVALID" | "STORAGE_READ_FAILED" | "STORAGE_WRITE_FAILED" | "STORAGE_DELETE_FAILED" | "STORAGE_RECORD_INVALID" | "JOURNAL_WRITE_FAILED" | "JOURNAL_MATERIALIZATION_FAILED" | "JOURNAL_VERIFICATION_FAILED" | "LOCAL_OPERATION_FAILED";

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

export type BootstrapDiagnosticEvent = Readonly<{
  stage: ApplicationBootstrapStage;
  operationalCode: OperationalDiagnosticCode;
  invariantCode?: BootstrapInvariantCode;
  repositoryStepCode?: CanonicalRepositoryBootstrapStepCode;
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
  return fallback + " [" + operationalDiagnosticCode(error) + "]";
}
