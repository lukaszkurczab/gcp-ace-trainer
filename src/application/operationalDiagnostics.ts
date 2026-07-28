import { ContentError } from "../content/errors";
import { CorruptStoredRecordError, JournalMaterializationError, JournalVerificationError, JournalWriteError, StorageDeleteError, StorageReadError, StorageWriteError, UnsupportedStoredRecordError } from "../storage/errors";

export type OperationalDiagnosticCode = "CONTENT_UNAVAILABLE" | "CONTENT_INVALID" | "STORAGE_READ_FAILED" | "STORAGE_WRITE_FAILED" | "STORAGE_DELETE_FAILED" | "STORAGE_RECORD_INVALID" | "JOURNAL_WRITE_FAILED" | "JOURNAL_MATERIALIZATION_FAILED" | "JOURNAL_VERIFICATION_FAILED" | "LOCAL_OPERATION_FAILED";

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
