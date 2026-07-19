/**
 * Application-owned durable-operation projections. React may render these
 * facts, but it must never infer them from an error message or local phase.
 */
export type DurableOperationError = Readonly<{
  operation: "practice_submit" | "practice_advance" | "practice_complete" | "simulation_save" | "simulation_finalization" | "simulation_resume";
  durableState: "not_durable" | "journal_durable" | "materialized" | "verified";
  retrySafety: "safe_retry" | "recovery_only" | "retry_forbidden";
  allowedAction: "submit_again" | "recover" | "retry_same_command" | "return_to_summary" | "none";
  prohibitedFallback: string;
}>;

export type PracticeDurableOperationState =
  | Readonly<{ kind: "unanswered" }>
  | Readonly<{ kind: "submitting_before_journal" }>
  | Readonly<{ kind: "submit_journal_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "commit_pending"; error: DurableOperationError }>
  | Readonly<{ kind: "commit_materialization_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "commit_verification_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "feedback" }>
  | Readonly<{ kind: "advancing" }>
  | Readonly<{ kind: "advance_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "completed" }>;

export type SimulationDurableOperationState =
  | Readonly<{ kind: "editable" }>
  | Readonly<{ kind: "saving" }>
  | Readonly<{ kind: "save_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "stale_revision"; error: DurableOperationError }>
  | Readonly<{ kind: "frozen" }>
  | Readonly<{ kind: "finalization_journal_pending"; error: DurableOperationError }>
  | Readonly<{ kind: "finalization_journal_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "materializing" }>
  | Readonly<{ kind: "materialization_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "verifying" }>
  | Readonly<{ kind: "verification_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "recovery_required"; error: DurableOperationError }>
  | Readonly<{ kind: "timer_recovery_failed"; error: DurableOperationError }>
  | Readonly<{ kind: "missing_draft"; error: DurableOperationError }>
  | Readonly<{ kind: "version_mismatch"; error: DurableOperationError }>
  | Readonly<{ kind: "corrupt_state"; error: DurableOperationError }>
  | Readonly<{ kind: "completed" }>;

export type DurableOperationState = PracticeDurableOperationState | SimulationDurableOperationState;
