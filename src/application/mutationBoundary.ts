export type MutationCommitPhase = "journal_write" | "materialization" | "verification" | "journal_clear";
export type MutationDurableState = "not_durable" | "unknown" | "journal_durable" | "materialized" | "verified_pending_clear";
export type RetryableMutationOperation = "submit_training_outcome" | "abandon_training_session";
export type RetryMutationCommandHandle = Readonly<{ kind: "retry_mutation_command" }>;
export type MutationCommandProof = Readonly<{
  operation?: RetryableMutationOperation;
  commandFingerprint: string;
  planFingerprint: string;
  attempt?: unknown;
  retryCommand?: RetryMutationCommandHandle;
}>;
export class MutationCommitFailure extends Error {
  constructor(readonly phase: MutationCommitPhase, readonly durableState: MutationDurableState, readonly cause?: unknown, readonly commandProof?: MutationCommandProof, readonly retrySeed?: unknown) { super(`Canonical mutation could not ${phase === "materialization" ? "materialize" : phase.replaceAll("_", " ")}.`); this.name = "MutationCommitFailure"; }
}
