export type MutationCommitPhase = "journal_write" | "materialization" | "verification" | "journal_clear";
export type MutationDurableState = "not_durable" | "journal_durable" | "materialized" | "verified_pending_clear";
export class MutationCommitFailure extends Error {
  constructor(readonly phase: MutationCommitPhase, readonly durableState: MutationDurableState, readonly cause?: unknown) { super(`Canonical mutation failed during ${phase}.`); this.name = "MutationCommitFailure"; }
}
