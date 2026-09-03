export class StorageReadError extends Error { constructor(key: string, cause?: unknown) { super(`Unable to read ${key}.`); this.name = "StorageReadError"; this.cause = cause; } }
export class StorageWriteError extends Error { constructor(key: string, cause?: unknown) { super(`Unable to write ${key}.`); this.name = "StorageWriteError"; this.cause = cause; } }
export class StorageDeleteError extends Error { constructor(key: string, cause?: unknown) { super(`Unable to delete ${key}.`); this.name = "StorageDeleteError"; this.cause = cause; } }
export class CorruptStoredRecordError extends Error { constructor(key: string) { super(`Stored record at ${key} is corrupt.`); this.name = "CorruptStoredRecordError"; } }
export class UnsupportedStoredRecordError extends Error { constructor(key: string) { super(`Stored record at ${key} is unsupported.`); this.name = "UnsupportedStoredRecordError"; } }
export class JournalWriteError extends Error { constructor(cause?: unknown, message = "Unable to persist the pending mutation.") { super(message); this.name = "JournalWriteError"; this.cause = cause; } }
export class JournalMaterializationError extends Error { constructor(cause?: unknown) { super("Unable to materialize the pending mutation."); this.name = "JournalMaterializationError"; this.cause = cause; } }
export class JournalVerificationError extends Error { constructor() { super("The pending mutation could not be verified."); this.name = "JournalVerificationError"; } }

export type AccountDataFailureCode =
  | "account_sync_state_invalid"
  | "account_id_required"
  | "guest_installation_required"
  | "account_binding_mismatch"
  | "guest_binding_write_unverified"
  | "account_adoption_pending"
  | "account_materialization_in_progress"
  | "account_materialization_target_required"
  | "account_outbox_pending"
  | "active_session_adoption_blocked"
  | "journal_recovery_required"
  | "remote_deletion_pending"
  | "account_data_records_invalid"
  | "account_data_record_invalid"
  | "account_data_fingerprint_invalid"
  | "account_data_track_invalid"
  | "account_data_session_invalid"
  | "account_data_result_invalid"
  | "account_data_attempt_invalid"
  | "account_data_review_invalid";

/** Typed local account-data failure; callers classify its code without reading a raw message. */
export class AccountDataFailure extends Error {
  constructor(readonly code: AccountDataFailureCode) {
    super(code);
    this.name = "AccountDataFailure";
  }
}
