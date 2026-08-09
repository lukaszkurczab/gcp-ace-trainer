import type { TrackId } from "./trackIdentity";
import { createContentPackagePin, type ContentPackagePin } from "./contentPackagePin";

export const JOURNAL_OPERATIONS = [
  "start_training_session",
  "advance_training_session",
  "submit_training_outcome",
  "complete_training_session",
  "abandon_training_session",
  "finalize_training_session",
  "set_review_entry",
  "remove_review_entry",
  "reset_learning_state",
] as const;

export type JournalOperation = (typeof JOURNAL_OPERATIONS)[number];

/** A family-neutral identity for an immutable, recoverable mutation plan. */
export type JournalOperationContract = Readonly<{
  operation: JournalOperation;
  sessionId: string;
  trackId: TrackId;
  packagePin: ContentPackagePin;
  commandIdentity: Readonly<{ version: 1; fingerprint: string }>;
  planFingerprint: string;
  createdAt: string;
}>;

export function createJournalOperationContract(input: JournalOperationContract): JournalOperationContract {
  if (!(JOURNAL_OPERATIONS as readonly string[]).includes(input.operation) || !input.sessionId.trim() || !input.trackId.trim() || input.commandIdentity.version !== 1 || !input.commandIdentity.fingerprint.trim() || !input.planFingerprint.trim()) {
    throw new Error("A journal operation contract is incomplete.");
  }
  return Object.freeze({ ...input, packagePin: createContentPackagePin(input.packagePin) });
}
