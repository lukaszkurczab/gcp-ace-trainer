/** Current account-sync identity kinds; persistence consumes this neutral contract. */
export const SYNCABLE_RECORD_TYPES = ["active_track", "training_session_summary", "training_session_result", "training_attempt", "review_queue_entry", "goal", "learning_plan"] as const;
export type SyncableRecordType = (typeof SYNCABLE_RECORD_TYPES)[number];

export type AccountDataRecordFingerprintInput = Readonly<{
  recordId: string;
  recordType: SyncableRecordType;
  state: Readonly<Record<string, unknown>>;
  trackId: string;
}>;
