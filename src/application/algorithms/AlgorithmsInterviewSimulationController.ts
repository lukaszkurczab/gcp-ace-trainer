import type {
  TrainingAttempt,
  TrainingSession,
  TrainingSessionDraft,
} from "../../domain";
import type { AlgorithmContentCatalog } from "../../tracks/algorithms/algorithmContentCatalog";
import {
  ALGORITHM_MODE_IDS,
  type AlgorithmResponse,
  type AlgorithmRoadmapNodeId,
} from "../../tracks/algorithms";
import {
  AlgorithmsFamilyRuntime,
  type AlgorithmsRuntimeState,
} from "./AlgorithmsFamilyRuntime";
import {
  buildAlgorithmsInterviewSimulationTerminalProjection,
  classifyAlgorithmsRuntimeFailure,
  filterAlgorithmsInterviewSimulationReview,
  getAlgorithmsInterviewSimulationReviewDetail,
  inspectActiveAlgorithmsInterviewSimulation,
  type AlgorithmsInterviewSimulationActiveInspection,
  type AlgorithmsInterviewSimulationReviewDetail,
  type AlgorithmsInterviewSimulationReviewFilter,
  type AlgorithmsInterviewSimulationReviewRow,
  type AlgorithmsInterviewSimulationTerminalProjection,
  type AlgorithmsRuntimeFailure,
} from "./AlgorithmsInterviewSimulationProjections";

/**
 * The application boundary consumed by Interview Simulation presentation.
 *
 * It deliberately knows only the runtime and injected canonical queries.  React
 * components receive controller state and invoke these commands; they never need
 * a repository, catalog, scoring service, mutation builder, or journal API.
 */
export type AlgorithmsInterviewSimulationControllerDependencies = Readonly<{
  catalog(): AlgorithmContentCatalog;
  createRuntime(): AlgorithmsFamilyRuntime;
  getActiveDraft(): Promise<TrainingSessionDraft | null>;
  getActiveSession(): Promise<TrainingSession | null>;
  getAttempts(): Promise<readonly TrainingAttempt<unknown>[]>;
  getSessionById(sessionId: string): Promise<TrainingSession | null>;
  recoverPendingMutation(): Promise<void>;
}>;

export type AlgorithmsInterviewSimulationOperationKind =
  | "recovering"
  | "discovering"
  | "starting"
  | "resuming"
  | "saving_draft"
  | "saving_flag"
  | "moving"
  | "timer_enter"
  | "timer_exit"
  | "timer_checkpoint"
  | "finalizing"
  | "abandoning"
  | "loading_terminal";

export type AlgorithmsInterviewSimulationOperation =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: AlgorithmsInterviewSimulationOperationKind; status: "pending" }>
  | Readonly<{ kind: AlgorithmsInterviewSimulationOperationKind; status: "failed"; failure: AlgorithmsRuntimeFailure }>;

export type AlgorithmsInterviewSimulationControllerStatus = "setup" | "active" | "terminal" | "abandoned" | "error";

export type AlgorithmsInterviewSimulationControllerState = Readonly<{
  status: AlgorithmsInterviewSimulationControllerStatus;
  activeInspection: AlgorithmsInterviewSimulationActiveInspection | null;
  failure: AlgorithmsRuntimeFailure | null;
  operation: AlgorithmsInterviewSimulationOperation;
  runtime: AlgorithmsRuntimeState | null;
  terminal: AlgorithmsInterviewSimulationTerminalProjection | null;
}>;

const IDLE_OPERATION: AlgorithmsInterviewSimulationOperation = Object.freeze({ kind: "idle" });

function initialState(): AlgorithmsInterviewSimulationControllerState {
  return Object.freeze({
    status: "setup",
    activeInspection: null,
    failure: null,
    operation: IDLE_OPERATION,
    runtime: null,
    terminal: null,
  });
}

/**
 * Coordinates durable runtime commands for one Interview Simulation surface.
 * This class intentionally has no presentation dependency, so lifecycle behavior
 * is testable without React and a screen cannot bypass the runtime contract.
 */
export class AlgorithmsInterviewSimulationController {
  private activeRuntime: AlgorithmsFamilyRuntime | null = null;
  private state = initialState();
  private readonly listeners = new Set<(state: AlgorithmsInterviewSimulationControllerState) => void>();

  constructor(private readonly dependencies: AlgorithmsInterviewSimulationControllerDependencies) {}

  getState(): AlgorithmsInterviewSimulationControllerState {
    return this.state;
  }

  subscribe(listener: (state: AlgorithmsInterviewSimulationControllerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  /** Recovers the canonical journal before inspecting the one active-session slot. */
  async discover(): Promise<AlgorithmsInterviewSimulationControllerState> {
    this.setPending("recovering");
    try {
      await this.dependencies.recoverPendingMutation();
    } catch (error) {
      return this.fail("recovering", error);
    }

    this.setPending("discovering");
    try {
      const [activeSession, activeDraft] = await Promise.all([
        this.dependencies.getActiveSession(),
        this.dependencies.getActiveDraft(),
      ]);
      const inspection = inspectActiveAlgorithmsInterviewSimulation({
        activeSession,
        activeDraft,
        catalog: this.dependencies.catalog(),
      });
      if (inspection.kind === "unavailable") {
        return this.setState({
          ...this.state,
          status: "error",
          activeInspection: inspection,
          failure: inspection.failure,
          operation: Object.freeze({ kind: "discovering", status: "failed", failure: inspection.failure }),
          runtime: null,
          terminal: null,
        });
      }
      return this.setState({
        status: "setup",
        activeInspection: inspection,
        failure: null,
        operation: IDLE_OPERATION,
        runtime: null,
        terminal: null,
      });
    } catch (error) {
      return this.fail("discovering", error);
    }
  }

  /** Starts only when the canonical active slot is empty; it never replaces it. */
  async start(nodeId: AlgorithmRoadmapNodeId): Promise<AlgorithmsInterviewSimulationControllerState> {
    const discovered = await this.discover();
    if (discovered.status === "error") return discovered;
    if (discovered.activeInspection?.kind !== "none") {
      return this.fail("starting", new Error("An active session must be resumed or abandoned before starting Interview Simulation."));
    }
    this.setPending("starting");
    try {
      const runtime = this.dependencies.createRuntime();
      const runtimeState = await runtime.start({
        modeId: ALGORITHM_MODE_IDS.interviewSimulation,
        nodeId,
      });
      this.activeRuntime = runtime;
      return this.setActive(runtimeState, null);
    } catch (error) {
      return this.fail("starting", error);
    }
  }

  /** Resumes exactly the durable session found by discovery; it never starts a replacement. */
  async resume(): Promise<AlgorithmsInterviewSimulationControllerState> {
    const discovered = await this.discover();
    if (discovered.status === "error") return discovered;
    const inspection = discovered.activeInspection;
    if (!inspection || inspection.kind !== "resumable") {
      return this.fail("resuming", new Error("No resumable Interview Simulation is active."));
    }
    this.setPending("resuming");
    try {
      const runtime = this.dependencies.createRuntime();
      const runtimeState = await runtime.start(inspection.resumeInput);
      if (runtimeState.session.id !== inspection.session.id) {
        throw new Error("The active Interview Simulation changed while it was being resumed.");
      }
      this.activeRuntime = runtime;
      return this.setActive(runtimeState, inspection);
    } catch (error) {
      return this.fail("resuming", error);
    }
  }

  async saveDraftResponse(occurrenceId: string, response: AlgorithmResponse | null): Promise<AlgorithmsInterviewSimulationControllerState> {
    return this.runActive("saving_draft", (runtime) => runtime.saveSimulationResponse(occurrenceId, response));
  }

  async setFlag(occurrenceId: string, flagged?: boolean): Promise<AlgorithmsInterviewSimulationControllerState> {
    return this.runActive("saving_flag", (runtime) => runtime.setSimulationFlag(occurrenceId, flagged));
  }

  async moveToIndex(index: number): Promise<AlgorithmsInterviewSimulationControllerState> {
    return this.runActive("moving", (runtime) => runtime.moveSimulationToIndex(index));
  }

  async enterForeground(): Promise<AlgorithmsInterviewSimulationControllerState> { return this.runActive("timer_enter", (runtime) => runtime.enterSimulationForeground()); }
  async leaveForeground(): Promise<AlgorithmsInterviewSimulationControllerState> { return this.runActive("timer_exit", (runtime) => runtime.leaveSimulationForeground()); }
  async checkpointForegroundTimer(): Promise<AlgorithmsInterviewSimulationControllerState> { return this.runActive("timer_checkpoint", (runtime) => runtime.checkpointSimulationForegroundTimer()); }

  /** Finalizes once through the runtime, then loads only durable terminal records. */
  async finalize(): Promise<AlgorithmsInterviewSimulationControllerState> {
    const runtime = this.activeRuntime;
    if (!runtime) return this.fail("finalizing", new Error("Interview Simulation is not active."));
    this.setPending("finalizing");
    try {
      const terminalRuntimeState = await runtime.finalizeSimulation();
      return await this.loadTerminalProjection(terminalRuntimeState.session.id, terminalRuntimeState, "finalizing");
    } catch (error) {
      return this.fail("finalizing", error);
    }
  }

  /** Abandonment is exposed only after the runtime's durable command succeeds. */
  async abandon(): Promise<AlgorithmsInterviewSimulationControllerState> {
    return this.runActive("abandoning", async (runtime) => {
      const runtimeState = await runtime.abandonSimulation();
      this.activeRuntime = null;
      return runtimeState;
    }, "abandoned");
  }

  /** Loads a completed session's summary and review from immutable terminal records. */
  async loadTerminal(sessionId: string): Promise<AlgorithmsInterviewSimulationControllerState> {
    this.setPending("loading_terminal");
    return this.loadTerminalProjection(sessionId, null, "loading_terminal");
  }

  getReviewRows(filter: AlgorithmsInterviewSimulationReviewFilter = "all"): readonly AlgorithmsInterviewSimulationReviewRow[] {
    const terminal = this.requireTerminal();
    return filterAlgorithmsInterviewSimulationReview(terminal, filter);
  }

  getReviewDetail(occurrenceId: string): AlgorithmsInterviewSimulationReviewDetail {
    const terminal = this.requireTerminal();
    return getAlgorithmsInterviewSimulationReviewDetail(terminal, occurrenceId);
  }

  private async runActive(
    operation: Exclude<AlgorithmsInterviewSimulationOperationKind, "recovering" | "discovering" | "starting" | "resuming" | "finalizing" | "loading_terminal">,
    command: (runtime: AlgorithmsFamilyRuntime) => Promise<AlgorithmsRuntimeState>,
    completionStatus: AlgorithmsInterviewSimulationControllerStatus = "active",
  ): Promise<AlgorithmsInterviewSimulationControllerState> {
    const runtime = this.activeRuntime;
    if (!runtime) return this.fail(operation, new Error("Interview Simulation is not active."));
    this.setPending(operation);
    try {
      const runtimeState = await command(runtime);
      if (completionStatus === "abandoned") {
        return this.setState({
          status: "abandoned",
          activeInspection: null,
          failure: null,
          operation: IDLE_OPERATION,
          runtime: runtimeState,
          terminal: null,
        });
      }
      if (runtimeState.session.status === "completed") {
        return this.loadTerminalProjection(runtimeState.session.id, runtimeState, operation);
      }
      return this.setActive(runtimeState, null);
    } catch (error) {
      return this.fail(operation, error);
    }
  }

  private async loadTerminalProjection(
    sessionId: string,
    runtimeState: AlgorithmsRuntimeState | null,
    operation: AlgorithmsInterviewSimulationOperationKind,
  ): Promise<AlgorithmsInterviewSimulationControllerState> {
    try {
      const [session, attempts] = await Promise.all([
        this.dependencies.getSessionById(sessionId),
        this.dependencies.getAttempts(),
      ]);
      if (!session) throw new Error(`Interview Simulation session ${sessionId} is unavailable.`);
      const terminal = buildAlgorithmsInterviewSimulationTerminalProjection({
        session,
        attempts,
        catalog: this.dependencies.catalog(),
      });
      return this.setState({
        status: "terminal",
        activeInspection: null,
        failure: null,
        operation: IDLE_OPERATION,
        runtime: runtimeState,
        terminal,
      });
    } catch (error) {
      // A failed terminal query must never leave an older summary visible as a
      // substitute for the requested immutable session.
      return this.fail(operation, error, runtimeState, null);
    }
  }

  private setActive(
    runtime: AlgorithmsRuntimeState,
    activeInspection: AlgorithmsInterviewSimulationActiveInspection | null,
  ): AlgorithmsInterviewSimulationControllerState {
    if (runtime.session.status !== "active") {
      throw new Error("Only an active Interview Simulation may be presented as an active session.");
    }
    return this.setState({
      status: "active",
      activeInspection,
      failure: null,
      operation: IDLE_OPERATION,
      runtime,
      terminal: null,
    });
  }

  private fail(
    operation: AlgorithmsInterviewSimulationOperationKind,
    error: unknown,
    runtime: AlgorithmsRuntimeState | null = this.state.runtime,
    terminal: AlgorithmsInterviewSimulationTerminalProjection | null = this.state.terminal,
  ): AlgorithmsInterviewSimulationControllerState {
    const failure = classifyAlgorithmsRuntimeFailure(error);
    return this.setState({
      status: runtime?.session.status === "completed" ? "terminal" : runtime?.session.status === "abandoned" ? "abandoned" : runtime ? "active" : "error",
      activeInspection: this.state.activeInspection,
      failure,
      operation: Object.freeze({ kind: operation, status: "failed", failure }),
      runtime,
      terminal,
    });
  }

  private requireTerminal(): AlgorithmsInterviewSimulationTerminalProjection {
    if (!this.state.terminal) throw new Error("Interview Simulation terminal projection is unavailable.");
    return this.state.terminal;
  }

  private setPending(kind: AlgorithmsInterviewSimulationOperationKind): void {
    this.setState({ ...this.state, operation: Object.freeze({ kind, status: "pending" }), failure: null });
  }

  private setState(next: AlgorithmsInterviewSimulationControllerState): AlgorithmsInterviewSimulationControllerState {
    this.state = Object.freeze(next);
    for (const listener of this.listeners) listener(this.state);
    return this.state;
  }
}
