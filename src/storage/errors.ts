export class StorageReadError extends Error { constructor(key: string, cause?: unknown) { super(`Unable to read ${key}.`); this.name = "StorageReadError"; this.cause = cause; } }
export class StorageWriteError extends Error { constructor(key: string, cause?: unknown) { super(`Unable to write ${key}.`); this.name = "StorageWriteError"; this.cause = cause; } }
export class StorageDeleteError extends Error { constructor(key: string, cause?: unknown) { super(`Unable to delete ${key}.`); this.name = "StorageDeleteError"; this.cause = cause; } }
export class CorruptStoredRecordError extends Error { constructor(key: string) { super(`Stored record at ${key} is corrupt.`); this.name = "CorruptStoredRecordError"; } }
export class UnsupportedStoredRecordError extends Error { constructor(key: string) { super(`Stored record at ${key} is unsupported.`); this.name = "UnsupportedStoredRecordError"; } }
export class JournalWriteError extends Error { constructor(cause?: unknown, message = "Unable to persist the pending mutation.") { super(message); this.name = "JournalWriteError"; this.cause = cause; } }
export class JournalMaterializationError extends Error { constructor(cause?: unknown) { super("Unable to materialize the pending mutation."); this.name = "JournalMaterializationError"; this.cause = cause; } }
export class JournalVerificationError extends Error { constructor() { super("The pending mutation could not be verified."); this.name = "JournalVerificationError"; } }
