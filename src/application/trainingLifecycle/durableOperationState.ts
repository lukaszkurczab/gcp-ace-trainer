/** Application-owned facts. Presentation may render them but never infer them. */
export type DurableOperationError = Readonly<{
  operation: "practice_submit" | "practice_advance" | "practice_complete" | "practice_abandon" | "practice_resume" | "simulation_save" | "simulation_navigation" | "simulation_save_and_continue" | "simulation_finalization" | "simulation_abandon" | "simulation_resume";
  durableState: "not_durable" | "journal_durable" | "materialized" | "verified_pending_clear" | "verified";
  retrySafety: "safe_retry" | "recovery_only" | "retry_forbidden";
  allowedAction: "submit_again" | "recover" | "retry_same_command" | "return_to_summary" | "none";
  prohibitedFallback: string;
}>;

export type PracticeDurableOperationState =
  | Readonly<{ family: "practice"; kind: "unanswered" }>
  | Readonly<{ family: "practice"; kind: "submitting_before_journal" }>
  | Readonly<{ family: "practice"; kind: "submit_journal_failed"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "commit_pending"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "commit_materialization_failed"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "commit_verification_failed"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "verified_pending_clear"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "recovery_required"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "feedback" }>
  | Readonly<{ family: "practice"; kind: "advancing" }>
  | Readonly<{ family: "practice"; kind: "advance_failed"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "completing" }>
  | Readonly<{ family: "practice"; kind: "completion_failed"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "completed" }>
  | Readonly<{ family: "practice"; kind: "abandoning" }>
  | Readonly<{ family: "practice"; kind: "abandonment_failed_before_journal"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "abandonment_recovery_required"; error: DurableOperationError }>
  | Readonly<{ family: "practice"; kind: "abandoned" }>;

export type SimulationDurableOperationState =
  | Readonly<{ family: "simulation"; kind: "editable" }>
  | Readonly<{ family: "simulation"; kind: "saving" }>
  | Readonly<{ family: "simulation"; kind: "save_failed"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "stale_revision"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "navigating" }>
  | Readonly<{ family: "simulation"; kind: "navigation_failed"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "save_and_continue_advance_recovery"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "frozen" }>
  | Readonly<{ family: "simulation"; kind: "finalization_journal_pending"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "finalization_journal_failed"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "materializing" }>
  | Readonly<{ family: "simulation"; kind: "materialization_failed"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "verifying" }>
  | Readonly<{ family: "simulation"; kind: "verification_failed"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "verified_pending_clear"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "recovery_required"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "timer_recovery_failed"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "missing_draft"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "version_mismatch"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "corrupt_state"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "abandoning" }>
  | Readonly<{ family: "simulation"; kind: "abandonment_failed_before_journal"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "abandonment_recovery_required"; error: DurableOperationError }>
  | Readonly<{ family: "simulation"; kind: "abandoned" }>
  | Readonly<{ family: "simulation"; kind: "completed" }>;

export type DurableOperationState = PracticeDurableOperationState | SimulationDurableOperationState;
