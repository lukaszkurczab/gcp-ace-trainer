import {
  abandonTrainingSession,
  advanceTrainingSession,
  type TrackId,
  type TrainingSession,
  type TrainingSessionDraft,
} from "../../domain";
import {
  TrainingApplicationFailure,
  type ApplicationFailureCode,
  type PreparedSession,
  type TrainingFamilyRuntime,
  type TrainingLifecyclePorts,
} from "./contracts";

export class TrainingLifecycleUseCases {
  constructor(private readonly ports: TrainingLifecyclePorts) {}

  async prepareSession(input: Readonly<{ trackId: TrackId; modeId: string; source?: string; request: unknown }>): Promise<PreparedSession> {
    const runtime = this.resolveRuntime(input.trackId);
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    return this.run("unknown_mode", () => runtime.prepare({ ...input, attempts, reviews, now: this.ports.clock.now() }));
  }

  async startSession(input: Readonly<{ trackId: TrackId; modeId: string; source?: string; request: unknown }>): Promise<PreparedSession> {
    const existing = await this.run("persistence_failure", () => this.ports.repositories.getActiveSession());
    if (existing) throw new TrainingApplicationFailure("active_session_conflict", `Active session ${existing.id} must be resumed or abandoned first.`);
    const runtime = this.resolveRuntime(input.trackId);
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    const prepared = await this.run("unknown_mode", () => runtime.prepare({ ...input, attempts, reviews, now: this.ports.clock.now() }));
    if (prepared.session.trackId !== input.trackId || prepared.firstOccurrence.trackId !== input.trackId) throw new TrainingApplicationFailure("persistence_failure", "Family runtime prepared a session outside the requested track.");
    await this.run("persistence_failure", () => this.ports.mutations.start(prepared));
    const verified = await this.run("verification_failure", () => this.ports.repositories.getActiveSession());
    if (!verified || verified.id !== prepared.session.id || verified.status !== "active") throw new TrainingApplicationFailure("verification_failure", "The active session was not verified before its first occurrence could be exposed.");
    return { ...prepared, session: verified };
  }

  async submitPracticeResponse(response: unknown): Promise<void> {
    const session = await this.requireActive();
    const runtime = this.resolveRuntime(session.trackId);
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    const outcome = await this.run("invalid_response", () => runtime.submitPractice({ session, response, attempts, reviews, now: this.ports.clock.now() }));
    if (outcome.session.id !== session.id) throw new TrainingApplicationFailure("persistence_failure", "Practice outcome changed its active session identity.");
    await this.run("persistence_failure", () => this.ports.mutations.submitPractice(outcome));
  }

  async advancePracticeSession(): Promise<TrainingSession> {
    const session = await this.requireActive();
    const next = this.runSync("persistence_failure", () => advanceTrainingSession(session));
    await this.run("persistence_failure", () => this.ports.mutations.advance(next));
    const verified = await this.run("verification_failure", () => this.ports.repositories.getActiveSession());
    if (!verified || verified.id !== next.id || verified.currentItemIndex !== next.currentItemIndex) throw new TrainingApplicationFailure("verification_failure", "The next practice occurrence was not durably verified.");
    return verified;
  }

  async completeOrdinarySession(session: TrainingSession): Promise<void> {
    if (session.status !== "completed") throw new TrainingApplicationFailure("persistence_failure", "Only a completed session can be materialized as ordinary completion.");
    await this.run("persistence_failure", () => this.ports.mutations.complete(session));
    await this.requireVerifiedSummary(session.id);
  }

  async saveSimulationDraft(input: Readonly<{ draft: TrainingSessionDraft; expectedPreviousRevision: number }>): Promise<void> {
    const session = await this.requireActive();
    if (session.id !== input.draft.sessionId) throw new TrainingApplicationFailure("no_active_session", "The simulation draft does not belong to the active session.");
    const runtime = this.resolveRuntime(session.trackId);
    await this.run("invalid_response", () => runtime.validateDraftCommand({ session, ...input }));
    await this.run("persistence_failure", () => this.ports.repositories.saveDraft(input));
  }

  async finalizeSimulation(): Promise<void> {
    const session = await this.requireActive();
    const runtime = this.resolveRuntime(session.trackId);
    const draft = await this.run("resume_unavailable", () => this.ports.repositories.getDraft(session.id));
    if (!draft) throw new TrainingApplicationFailure("resume_unavailable", "Simulation finalization requires the exact active draft.");
    const [attempts, reviews] = await Promise.all([this.ports.repositories.getAttempts(), this.ports.repositories.getReviews()]);
    const outcome = await this.run("persistence_failure", () => runtime.finalizeSimulation({ session, draft, attempts, reviews, now: this.ports.clock.now() }));
    if (outcome.session.id !== session.id) throw new TrainingApplicationFailure("persistence_failure", "Simulation finalization changed session identity.");
    await this.run("persistence_failure", () => this.ports.mutations.finalize(outcome));
    await this.requireVerifiedSummary(session.id);
  }

  async resumeActiveSession(): Promise<TrainingSession> {
    const session = await this.requireActive();
    const runtime = this.resolveRuntime(session.trackId);
    const draft = await this.run("persistence_failure", () => this.ports.repositories.getDraft(session.id));
    await this.run("resume_unavailable", () => runtime.validateResume({ session, draft }));
    return session;
  }

  async abandonActiveSession(): Promise<TrainingSession> {
    const active = await this.requireActive();
    const abandoned = this.runSync("persistence_failure", () => abandonTrainingSession(active, this.ports.clock.now()));
    await this.run("persistence_failure", () => this.ports.mutations.abandon(abandoned));
    const verified = await this.run("verification_failure", () => this.ports.repositories.getActiveSession());
    if (verified) throw new TrainingApplicationFailure("verification_failure", "Abandoned session remains resumable.");
    return abandoned;
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
    return this.run("persistence_failure", () => runtime[method]({ trackId, attempts: attempts.filter((attempt) => attempt.trackId === trackId), reviews: reviews.filter((review) => review.trackId === trackId), now: this.ports.clock.now() }));
  }

  private async requireVerifiedSummary(sessionId: string) {
    const result = await this.run("summary_unavailable", () => this.ports.repositories.getResult(sessionId));
    if (!result) throw new TrainingApplicationFailure("summary_unavailable", "Completed-session result has not been verified.");
    return result;
  }

  private async requireActive(): Promise<TrainingSession> {
    const session = await this.run("no_active_session", () => this.ports.repositories.getActiveSession());
    if (!session || session.status !== "active") throw new TrainingApplicationFailure("no_active_session", "No active session is available.");
    return session;
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
