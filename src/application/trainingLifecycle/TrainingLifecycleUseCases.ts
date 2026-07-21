import {
  abandonTrainingSession,
  advanceTrainingSession,
  moveTrainingSessionToIndex,
  createTrainingSession,
  type TrackId,
  type TrainingSession,
  type TrainingSessionDraft,
  StaleDraftRevisionError,
} from "../../domain";
import {
  TrainingApplicationFailure,
  type ApplicationFailureCode,
  type PreparedSession,
  type PracticeFinalization,
  type TrainingFamilyRuntime,
  type TrainingLifecyclePorts,
  type PendingMutationProjection,
} from "./contracts";
import { MutationCommitFailure } from "../mutationBoundary";
import type { DurableOperationError, DurableOperationState, PracticeDurableOperationState, SimulationDurableOperationState } from "./durableOperationState";
import { OperationProjectionStore } from "./operationProjectionStore";

export class TrainingLifecycleUseCases {
  private readonly operationStates: OperationProjectionStore;

  constructor(private readonly ports: TrainingLifecyclePorts, operationStore = new OperationProjectionStore()) { this.operationStates = operationStore; }
  getOperationProjection(sessionId: string) { return this.operationStates.getOperationProjection(sessionId); }
  subscribeOperationProjection(sessionId: string, listener: (value: DurableOperationState) => void) { return this.operationStates.subscribeOperationProjection(sessionId, listener); }
  async getPendingMutationProjection(sessionId: string): Promise<PendingMutationProjection | null> { return this.pendingFor(sessionId); }

  /** Rebuilds the observable state from canonical records before any recovery retry. */
  async reconstructOperationProjection(session: TrainingSession): Promise<DurableOperationState> {
    const pending = await this.pendingFor(session.id);
    const simulationSession = session.configurationSnapshot.submission === "manualOrForegroundTimeout";
    const currentOccurrence = session.itemOrder[session.currentItemIndex];
    const hasMaterializedCurrentPracticeAttempt = !pending && !simulationSession && currentOccurrence
      ? (await this.ports.repositories.getAttempts()).some((attempt) => attempt.sessionId === session.id && attempt.occurrenceId === currentOccurrence.occurrenceId)
      : false;
    const state = pending
      ? simulationSession ? simulationPendingFor(pending.status) : pending.operation === "submit_training_outcome" ? practicePendingFor(pending.status) : simulationSession ? simulation("recovery_required", operationError("simulation_resume", "journal_durable", "recover")) : practice("commit_pending", operationError("practice_submit", "journal_durable", "recover"))
      : simulationSession ? simulation("editable") : hasMaterializedCurrentPracticeAttempt ? practice("feedback") : practice("unanswered");
    return this.operationStates.reconstruct({ sessionId: session.id, state });
  }

  /** The only recovery retry replays the exact existing immutable journal plan. */
  async recoverActiveTrainingOperation(): Promise<void> {
    const active = await this.requireActive();
    const pending = await this.pendingFor(active.id);
    await this.reconstructOperationProjection(active);
    await this.ports.mutations.recover();
    const verified = await this.ports.repositories.getActiveSession();
    if (!verified) {
      this.operationStates.clear(active.id);
      return;
    }
    const simulationSession = verified.configurationSnapshot.submission === "manualOrForegroundTimeout";
    this.operationStates.publish(verified.id, simulationSession ? simulation("editable") : pending?.operation === "submit_training_outcome" ? practice("feedback") : practice("unanswered"));
  }

  async getPracticeOperationState(session: TrainingSession, hasCommittedAttempt: boolean): Promise<PracticeDurableOperationState> {
    const pending = await this.pendingFor(session.id);
    if (pending?.operation === "submit_training_outcome") return practicePendingFor(pending.status);
    if (pending) return practice("recovery_required", operationError("practice_resume", pending.status, "recover"));
    const current = this.operationStates.get(session.id);
    if (current && isPracticeOperation(current)) return current;
    return hasCommittedAttempt ? practice("feedback") : practice("unanswered");
  }

  async getSimulationOperationState(session: TrainingSession): Promise<SimulationDurableOperationState> {
    const pending = await this.pendingFor(session.id);
    if (pending?.operation === "finalize_training_session") return simulationPendingFor(pending.status);
    const current = this.operationStates.get(session.id);
    if (current && isSimulationOperation(current)) return current;
    return simulation("editable");
  }

  async prepareSession(input: Readonly<{ trackId: TrackId; modeId: string; source?: string; request: unknown }>): Promise<PreparedSession> {
    await this.run("missing_content", () => this.ports.content.requireAvailable(input.trackId, input.modeId));
    const runtime = this.resolveRuntime(input.trackId);
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    const prepared = await this.run("unknown_mode", () => runtime.prepare({ ...input, attempts, reviews, now: this.ports.clock.now() }));
    await this.run("missing_content", () => this.ports.content.assertPreparedSession(prepared.session));
    return prepared;
  }

  async startSession(input: Readonly<{ trackId: TrackId; modeId: string; source?: string; request: unknown }>): Promise<PreparedSession> {
    const existing = await this.run("persistence_failure", () => this.ports.repositories.getActiveSession());
    if (existing) throw new TrainingApplicationFailure("active_session_conflict", `Active session ${existing.id} must be resumed or abandoned first.`);
    await this.run("missing_content", () => this.ports.content.requireAvailable(input.trackId, input.modeId));
    const runtime = this.resolveRuntime(input.trackId);
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    const prepared = await this.run("unknown_mode", () => runtime.prepare({ ...input, attempts, reviews, now: this.ports.clock.now() }));
    if (prepared.session.trackId !== input.trackId || prepared.firstOccurrence.trackId !== input.trackId) throw new TrainingApplicationFailure("persistence_failure", "Family runtime prepared a session outside the requested track.");
    await this.run("missing_content", () => this.ports.content.assertPreparedSession(prepared.session));
    await this.run("persistence_failure", () => this.ports.mutations.start(prepared));
    const verified = await this.run("verification_failure", () => this.ports.repositories.getActiveSession());
    if (!verified || verified.id !== prepared.session.id || verified.status !== "active") throw new TrainingApplicationFailure("verification_failure", "The active session was not verified before its first occurrence could be exposed.");
    return { ...prepared, session: verified };
  }

  async submitPracticeResponse(response: unknown): Promise<void> {
    const session = await this.requireActive();
    const prior = await this.getPracticeOperationState(session, false);
    if (prior.kind === "commit_pending" || prior.kind === "commit_materialization_failed" || prior.kind === "commit_verification_failed") {
      throw new TrainingApplicationFailure("commit_verification_failed", "A durable practice command must recover before another response can be submitted.");
    }
    this.operationStates.set(session.id, practice("submitting_before_journal"));
    const runtime = this.resolveRuntime(session.trackId);
    let outcome;
    try {
      const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
      outcome = await this.run("invalid_response", () => runtime.submitPractice({ session, response, attempts, reviews, now: this.ports.clock.now() }));
    } catch (error) {
      this.operationStates.set(session.id, error instanceof TrainingApplicationFailure && error.code === "invalid_response" ? practice("unanswered") : practiceRecovery("submit_journal_failed"));
      throw error;
    }
    if (outcome.session.id !== session.id) throw new TrainingApplicationFailure("persistence_failure", "Practice outcome changed its active session identity.");
    try {
      await this.ports.mutations.submitPractice(outcome);
      this.operationStates.set(session.id, practice("feedback"));
    } catch (error) {
      const state = practiceStateForMutationFailure(error);
      this.operationStates.set(session.id, state);
      throw applicationFailureForPracticeMutation(error);
    }
  }

  async advancePracticeSession(): Promise<TrainingSession> {
    const session = await this.requireActive();
    this.operationStates.set(session.id, practice("advancing"));
    const next = this.runSync("persistence_failure", () => advanceTrainingSession(session));
    try {
      await this.ports.mutations.advance(next);
      const verified = await this.ports.repositories.getActiveSession();
      if (!verified || verified.id !== next.id || verified.currentItemIndex !== next.currentItemIndex) throw new TrainingApplicationFailure("verification_failure", "The next practice occurrence was not durably verified.");
      this.operationStates.set(session.id, practice("unanswered"));
      return verified;
    } catch (error) {
      this.operationStates.set(session.id, practice("advance_failed", operationError("practice_advance", "journal_durable", "retry_same_command")));
      throw error instanceof TrainingApplicationFailure ? error : new TrainingApplicationFailure("advance_failed", "The committed answer remains immutable, but the next occurrence could not be opened.", error);
    }
  }

  /** Simulation navigation changes only the durable active occurrence, never its immutable item plan. */
  async moveSimulationSessionTo(index: number): Promise<TrainingSession> {
    const session = await this.requireActive();
    if (session.configurationSnapshot.navigation !== "free" || session.configurationSnapshot.submission !== "manualOrForegroundTimeout") {
      throw new TrainingApplicationFailure("invalid_response", "Only a free-navigation simulation can change its active occurrence.");
    }
    const next = this.runSync("invalid_response", () => moveTrainingSessionToIndex(session, index));
    this.operationStates.set(session.id, simulation("navigating"));
    try {
      await this.run("persistence_failure", () => this.ports.mutations.advance(next));
      const verified = await this.run("verification_failure", () => this.ports.repositories.getActiveSession());
      if (!verified || verified.id !== next.id || verified.currentItemIndex !== next.currentItemIndex) throw new TrainingApplicationFailure("verification_failure", "The simulation navigator position was not durably verified.");
      this.operationStates.set(session.id, simulation("editable"));
      return verified;
    } catch (error) {
      this.operationStates.set(session.id, simulation("navigation_failed", operationError("simulation_navigation", error instanceof MutationCommitFailure ? error.durableState : "not_durable", error instanceof MutationCommitFailure && error.durableState !== "not_durable" ? "recover" : "retry_same_command")));
      throw error;
    }
  }

  async checkpointSimulationForegroundTime(activeForegroundMs: number): Promise<TrainingSession> {
    const session = await this.requireActive();
    if (session.configurationSnapshot.timer !== "countdownForeground" || !Number.isSafeInteger(activeForegroundMs) || activeForegroundMs < session.activeForegroundMs) {
      throw new TrainingApplicationFailure("invalid_response", "Simulation foreground timer checkpoint is invalid.");
    }
    const next = createTrainingSession({ ...session, activeForegroundMs });
    await this.run("persistence_failure", () => this.ports.mutations.advance(next));
    const verified = await this.run("verification_failure", () => this.ports.repositories.getActiveSession());
    if (!verified || verified.id !== next.id || verified.activeForegroundMs !== activeForegroundMs) {
      throw new TrainingApplicationFailure("verification_failure", "Simulation foreground time was not durably verified.");
    }
    return verified;
  }

  async completeOrdinarySession(session: TrainingSession): Promise<void> {
    if (session.status !== "completed") throw new TrainingApplicationFailure("persistence_failure", "Only a completed session can be materialized as ordinary completion.");
    await this.run("persistence_failure", () => this.ports.mutations.complete(session));
    await this.requireVerifiedSummary(session.id);
  }

  async completeActivePracticeSession(): Promise<PracticeFinalization> {
    const session = await this.requireActive();
    if (session.configurationSnapshot.submission !== "perItem" || session.currentItemIndex !== session.actualLength - 1) {
      throw new TrainingApplicationFailure("invalid_response", "Only a durably submitted final practice occurrence can complete this session.");
    }
    const attempts = await this.run("persistence_failure", () => this.ports.repositories.getAttempts());
    const runtime = this.resolveRuntime(session.trackId);
    const finalized = await this.run("persistence_failure", () => runtime.finalizePractice({ session, attempts, now: this.ports.clock.now() }));
    await this.run("persistence_failure", () => this.ports.mutations.completeWithResult(finalized));
    await this.requireVerifiedSummary(session.id);
    return finalized;
  }

  async saveSimulationDraft(input: Readonly<{ draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    const session = await this.requireActive();
    this.operationStates.set(session.id, simulation("saving"));
    if (session.id !== input.draft.sessionId) throw new TrainingApplicationFailure("no_active_session", "The simulation draft does not belong to the active session.");
    const runtime = this.resolveRuntime(session.trackId);
    try {
      await this.run("invalid_response", () => runtime.validateDraftCommand({ session, ...input }));
      await this.ports.repositories.saveDraft(input);
      this.operationStates.set(session.id, simulation("editable"));
    } catch (error) {
      const stale = error instanceof StaleDraftRevisionError;
      this.operationStates.set(session.id, stale
        ? simulation("stale_revision", operationError("simulation_save", "not_durable", "retry_same_command"))
        : simulation("save_failed", operationError("simulation_save", "not_durable", "retry_same_command")));
      throw error instanceof TrainingApplicationFailure ? error : new TrainingApplicationFailure(stale ? "stale_revision" : "persistence_failure", stale ? "The simulation draft revision is stale." : "Simulation draft save failed without changing the durable draft.", error);
    }
  }

  async finalizeSimulation(): Promise<void> {
    const session = await this.requireActive();
    this.operationStates.set(session.id, simulation("frozen"));
    const runtime = this.resolveRuntime(session.trackId);
    const draft = await this.run("resume_unavailable", () => this.ports.repositories.getDraft(session.id));
    if (!draft) throw new TrainingApplicationFailure("resume_unavailable", "Simulation finalization requires the exact active draft.");
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    const outcome = await this.run("persistence_failure", () => runtime.finalizeSimulation({ session, draft, attempts, reviews, now: this.ports.clock.now() }));
    if (outcome.session.id !== session.id) throw new TrainingApplicationFailure("persistence_failure", "Simulation finalization changed session identity.");
    try {
      this.operationStates.set(session.id, simulation("finalization_journal_pending", operationError("simulation_finalization", "not_durable", "retry_same_command")));
      await this.ports.mutations.finalize(outcome);
      await this.requireVerifiedSummary(session.id);
      this.operationStates.set(session.id, simulation("completed"));
    } catch (error) {
      const state = simulationStateForMutationFailure(error);
      this.operationStates.set(session.id, state);
      throw applicationFailureForSimulationMutation(error);
    }
  }

  async resumeActiveSession(): Promise<TrainingSession> {
    let session: TrainingSession;
    try { session = await this.requireActive(); }
    catch (error) { throw error; }
    const runtime = this.resolveRuntime(session.trackId);
    const draft = await this.run("persistence_failure", () => this.ports.repositories.getDraft(session.id));
    try { await this.run("resume_unavailable", () => runtime.validateResume({ session, draft })); }
    catch (error) {
      if (session.configurationSnapshot.submission === "manualOrForegroundTimeout") {
        const kind = !draft ? "missing_draft" : "corrupt_state";
        this.operationStates.set(session.id, simulation(kind, operationError("simulation_resume", "not_durable", "none")));
      }
      throw error;
    }
    return session;
  }

  async abandonActiveSession(): Promise<TrainingSession> {
    const active = await this.requireActive();
    const abandoned = this.runSync("persistence_failure", () => abandonTrainingSession(active, this.ports.clock.now()));
    const isSimulation = active.configurationSnapshot.submission === "manualOrForegroundTimeout";
    this.operationStates.set(active.id, isSimulation ? simulation("abandoning") : practice("abandoning"));
    try {
      await this.run("persistence_failure", () => this.ports.mutations.abandon(abandoned));
      const verified = await this.run("verification_failure", () => this.ports.repositories.getActiveSession());
      if (verified) throw new TrainingApplicationFailure("verification_failure", "Abandoned session remains resumable.");
      this.operationStates.set(active.id, isSimulation ? simulation("abandoned") : practice("abandoned"));
      this.operationStates.clear(active.id);
      return abandoned;
    } catch (error) {
      const afterJournal = error instanceof MutationCommitFailure && error.durableState !== "not_durable";
      const operation = isSimulation ? "simulation_abandon" : "practice_abandon";
      const state = afterJournal ? "abandonment_recovery_required" : "abandonment_failed_before_journal";
      const detail = operationError(operation, error instanceof MutationCommitFailure ? error.durableState : "not_durable", afterJournal ? "recover" : "retry_same_command");
      this.operationStates.set(active.id, isSimulation ? simulation(state, detail) : practice(state, detail));
      throw error;
    }
  }

  async recoverPendingJournal(): Promise<void> { await this.run("persistence_failure", () => this.ports.mutations.recover()); }
  async resetLearningState(): Promise<void> { await this.run("persistence_failure", () => this.ports.mutations.reset()); }

  async loadSummary(sessionId: string) {
    const session = await this.run("summary_unavailable", () => this.ports.repositories.getSession(sessionId));
    if (!session || session.status !== "completed") throw new TrainingApplicationFailure("summary_unavailable", "A verified completed session is required for summary.");
    return this.requireVerifiedSummary(sessionId);
  }

  async queryDashboard(trackId: TrackId): Promise<unknown> { return this.query(trackId, "queryDashboard"); }
  async queryProgress(trackId: TrackId): Promise<unknown> { return this.query(trackId, "queryProgress"); }
  async queryReview(trackId: TrackId): Promise<unknown> { return this.query(trackId, "queryReview"); }
  async queryHistory(): Promise<readonly TrainingSession[]> { return (await this.run("persistence_failure", () => this.ports.repositories.getHistory())).filter((session) => session.status === "completed"); }

  private async query(trackId: TrackId, method: "queryDashboard" | "queryProgress" | "queryReview"): Promise<unknown> {
    const runtime = this.resolveRuntime(trackId);
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    const input = { trackId, attempts: attempts.filter((attempt) => attempt.trackId === trackId), reviews: reviews.filter((review) => review.trackId === trackId), now: this.ports.clock.now() };
    if (method === "queryDashboard") {
      const activeSession = await this.run("persistence_failure", () => this.ports.repositories.getActiveSession());
      return this.run("persistence_failure", () => runtime.queryDashboard({ ...input, activeSession: activeSession?.trackId === trackId && activeSession.status === "active" ? activeSession : null }));
    }
    return this.run("persistence_failure", () => runtime[method](input));
  }

  private async requireVerifiedSummary(sessionId: string) {
    const result = await this.run("summary_unavailable", () => this.ports.repositories.getResult(sessionId));
    if (!result) throw new TrainingApplicationFailure("summary_unavailable", "Completed-session result has not been verified.");
    return result;
  }

  private async requireActive(): Promise<TrainingSession> {
    const session = await this.run("no_active_session", () => this.ports.repositories.getActiveSession());
    if (!session || session.status !== "active") throw new TrainingApplicationFailure("no_active_session", "No active session is available.");
    await this.run("resume_unavailable", () => this.ports.content.assertActiveSession(session));
    return session;
  }

  private async pendingFor(sessionId: string): Promise<PendingMutationProjection | null> {
    const pending = await this.ports.repositories.getPendingMutation?.();
    return pending?.sessionId === sessionId ? pending : null;
  }

  private resolveRuntime(trackId: TrackId): TrainingFamilyRuntime {
    let registration;
    try {
      registration = this.ports.tracks.getTrackRegistration(trackId);
    } catch (error) {
      if (error instanceof TrainingApplicationFailure) throw error;
      throw new TrainingApplicationFailure("unknown_track", `Unknown track ${trackId}.`, error);
    }
    try {
      const runtime = this.ports.runtimes.resolve(registration.familyId);
      if (runtime.familyId !== registration.familyId) throw new TrainingApplicationFailure("unknown_family", `Resolved runtime ${runtime.familyId} does not own family ${registration.familyId}.`);
      return runtime;
    } catch (error) {
      if (error instanceof TrainingApplicationFailure) throw error;
      throw new TrainingApplicationFailure("unknown_family", `Unable to resolve family runtime ${registration.familyId}.`, error);
    }
  }

  private async run<T>(code: ApplicationFailureCode, operation: () => Promise<T>): Promise<T> { try { return await operation(); } catch (error) { if (error instanceof TrainingApplicationFailure) throw error; throw new TrainingApplicationFailure(code, "Canonical training operation failed.", error); } }
  private runSync<T>(code: ApplicationFailureCode, operation: () => T): T { try { return operation(); } catch (error) { if (error instanceof TrainingApplicationFailure) throw error; throw new TrainingApplicationFailure(code, "Canonical training operation failed.", error); } }
}

function isPracticeOperation(value: DurableOperationState): value is PracticeDurableOperationState { return value.family === "practice"; }
function isSimulationOperation(value: DurableOperationState): value is SimulationDurableOperationState { return value.family === "simulation"; }

function practice<K extends PracticeDurableOperationState["kind"]>(kind: K, error?: DurableOperationError): Extract<PracticeDurableOperationState, { kind: K }> {
  return Object.freeze(error ? { family: "practice", kind, error } : { family: "practice", kind }) as Extract<PracticeDurableOperationState, { kind: K }>;
}
function simulation<K extends SimulationDurableOperationState["kind"]>(kind: K, error?: DurableOperationError): Extract<SimulationDurableOperationState, { kind: K }> {
  return Object.freeze(error ? { family: "simulation", kind, error } : { family: "simulation", kind }) as Extract<SimulationDurableOperationState, { kind: K }>;
}

function operationError(operation: DurableOperationError["operation"], durableState: DurableOperationError["durableState"], allowedAction: DurableOperationError["allowedAction"]): DurableOperationError {
  return Object.freeze({ operation, durableState, retrySafety: durableState === "not_durable" ? "safe_retry" : allowedAction === "recover" ? "recovery_only" : "retry_forbidden", allowedAction, prohibitedFallback: "The application will not recreate a response, draft, outcome, or result from UI state." });
}

function practiceRecovery(kind: "submit_journal_failed" | "commit_pending" | "commit_materialization_failed" | "commit_verification_failed"): Extract<PracticeDurableOperationState, { kind: typeof kind }> {
  const durableState = kind === "submit_journal_failed" ? "not_durable" : kind === "commit_materialization_failed" ? "journal_durable" : "materialized";
  return practice(kind, operationError("practice_submit", durableState, kind === "submit_journal_failed" ? "submit_again" : "recover"));
}

function practicePendingFor(status: "journal_durable" | "materialized" | "verified_pending_clear"): PracticeDurableOperationState {
  if (status === "journal_durable") return practiceRecovery("commit_materialization_failed");
  if (status === "materialized") return practiceRecovery("commit_verification_failed");
  return practice("verified_pending_clear", operationError("practice_submit", "verified_pending_clear", "recover"));
}

function simulationRecovery(kind: "finalization_journal_pending" | "finalization_journal_failed" | "materialization_failed" | "verification_failed"): Extract<SimulationDurableOperationState, { kind: typeof kind }> {
  const durableState = kind === "finalization_journal_failed" ? "not_durable" : kind === "materialization_failed" ? "journal_durable" : "materialized";
  return simulation(kind, operationError("simulation_finalization", durableState, kind === "finalization_journal_failed" ? "retry_same_command" : "recover"));
}

function simulationPendingFor(status: "journal_durable" | "materialized" | "verified_pending_clear"): SimulationDurableOperationState {
  if (status === "journal_durable") return simulation("materializing");
  if (status === "materialized") return simulation("verifying");
  return simulation("verified_pending_clear", operationError("simulation_finalization", "verified_pending_clear", "recover"));
}

function practiceStateForMutationFailure(error: unknown): PracticeDurableOperationState {
  if (!(error instanceof MutationCommitFailure)) return practiceRecovery("submit_journal_failed");
  if (error.phase === "journal_write") return practiceRecovery("submit_journal_failed");
  if (error.phase === "materialization") return practiceRecovery("commit_materialization_failed");
  return practiceRecovery("commit_verification_failed");
}

function simulationStateForMutationFailure(error: unknown): SimulationDurableOperationState {
  if (!(error instanceof MutationCommitFailure) || error.phase === "journal_write") return simulationRecovery("finalization_journal_failed");
  if (error.phase === "materialization") return simulationRecovery("materialization_failed");
  return simulationRecovery("verification_failed");
}

function applicationFailureForPracticeMutation(error: unknown): TrainingApplicationFailure {
  if (error instanceof MutationCommitFailure) {
    const code = error.phase === "journal_write" ? "submit_journal_failed" : error.phase === "materialization" ? "commit_materialization_failed" : "commit_verification_failed";
    return new TrainingApplicationFailure(code, "Practice command did not reach a verified canonical outcome.", error);
  }
  return new TrainingApplicationFailure("submit_journal_failed", "Practice response was not durably submitted.", error);
}

function applicationFailureForSimulationMutation(error: unknown): TrainingApplicationFailure {
  if (error instanceof MutationCommitFailure) {
    const code = error.phase === "journal_write" ? "finalization_journal_failed" : error.phase === "materialization" ? "finalization_materialization_failed" : "finalization_verification_failed";
    return new TrainingApplicationFailure(code, "Simulation finalization did not reach a verified canonical outcome.", error);
  }
  return new TrainingApplicationFailure("finalization_journal_failed", "Simulation finalization did not create a durable journal.", error);
}
