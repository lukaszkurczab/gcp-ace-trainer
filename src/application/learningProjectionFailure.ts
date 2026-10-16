import type { HomePlanSnapshot } from "./homePlanSnapshotReader";
import { ProfileReadFenceChangedError } from "./profileReadFence";
import { TrainingApplicationFailure } from "./trainingLifecycle/contracts";
import { CanonicalEvidenceIntegrityError, CorruptStoredRecordError, StorageReadError, UnsupportedStoredRecordError } from "../storage/errors";

/** Only a failure raised after verified inputs reached a pure optional projection. */
export class LearningProjectionUnavailableError extends Error {
  constructor(readonly projection: "progress" | "coding_dashboard" | "home_practice", cause?: unknown) {
    super("The learning projection is unavailable.", { cause });
    this.name = "LearningProjectionUnavailableError";
  }
}

export function isLocalLearningProjectionFailure(error: unknown): error is LearningProjectionUnavailableError {
  if (!(error instanceof LearningProjectionUnavailableError)) return false;
  const seen = new Set<unknown>();
  let cause: unknown = error.cause;
  while (cause instanceof Error && !seen.has(cause)) {
    if (cause instanceof ProfileReadFenceChangedError || cause instanceof TrainingApplicationFailure || cause instanceof CanonicalEvidenceIntegrityError || cause instanceof CorruptStoredRecordError || cause instanceof StorageReadError || cause instanceof UnsupportedStoredRecordError) return false;
    seen.add(cause);
    cause = cause.cause;
  }
  return true;
}

/** The snapshot reader reports these failures as values; the shell must still block. */
export function requireHomePlanReadIntegrity(snapshot: HomePlanSnapshot | null): void {
  if (snapshot?.kind === "unavailable" && ["storage_error", "corrupt_record", "identity_mismatch", "concurrent_change"].includes(snapshot.reason)) {
    throw new Error("Home learning inputs could not be verified.");
  }
}
