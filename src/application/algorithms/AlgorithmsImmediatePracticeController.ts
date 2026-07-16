import type { ContentItemRef } from "../../domain";
import {
  ALGORITHM_MODE_IDS,
  type AlgorithmModeId,
  type AlgorithmResponse,
  type AlgorithmRoadmapNodeId,
  type AlgorithmReviewSource,
} from "../../tracks/algorithms";
import {
  AlgorithmsFamilyRuntime,
  type AlgorithmsRuntimeState,
} from "./AlgorithmsFamilyRuntime";

/**
 * The application boundary for all immediate-feedback Algorithms profiles.
 *
 * Presentation can hold transient answer controls, but it cannot choose items,
 * score an answer, create an attempt, update review, or persist a transition.
 * Those actions remain one runtime command behind this controller.
 */
export type AlgorithmsImmediatePracticeControllerDependencies = Readonly<{
  createRuntime(): AlgorithmsFamilyRuntime;
  recoverPendingMutation(): Promise<void>;
}>;

export type AlgorithmsImmediatePracticeOperationKind =
  | "recovering"
  | "starting"
  | "submitting"
  | "continuing"
  | "recording_foreground";

export type AlgorithmsImmediatePracticeOperation =
  | Readonly<{ kind: "idle" }>
  | Readonly<{ kind: AlgorithmsImmediatePracticeOperationKind; status: "pending" }>
  | Readonly<{ kind: AlgorithmsImmediatePracticeOperationKind; status: "failed"; message: string }>;

export type AlgorithmsImmediatePracticeControllerState = Readonly<{
  error: string | null;
  operation: AlgorithmsImmediatePracticeOperation;
  runtime: AlgorithmsRuntimeState | null;
  status: "preparing" | "active" | "completed" | "error";
}>;

export type AlgorithmsImmediatePracticeStartInput = Readonly<{
  modeId: Exclude<AlgorithmModeId, typeof ALGORITHM_MODE_IDS.interviewSimulation>;
  nodeId: AlgorithmRoadmapNodeId;
  reviewItemRefs?: readonly ContentItemRef[];
  reviewSource?: AlgorithmReviewSource;
}>;

const IDLE_OPERATION: AlgorithmsImmediatePracticeOperation = Object.freeze({ kind: "idle" });

function initialState(): AlgorithmsImmediatePracticeControllerState {
  return Object.freeze({
    error: null,
    operation: IDLE_OPERATION,
    runtime: null,
    status: "preparing",
  });
}

/**
 * Coordinates a single immediate-feedback Algorithms session. It is deliberately
 * framework-free so durability ordering is independently testable and screens
 * can be limited to rendering controller state and forwarding user intent.
 */
export class AlgorithmsImmediatePracticeController {
  private runtime: AlgorithmsFamilyRuntime | null = null;
  private state = initialState();
  private readonly listeners = new Set<(state: AlgorithmsImmediatePracticeControllerState) => void>();

  constructor(private readonly dependencies: AlgorithmsImmediatePracticeControllerDependencies) {}

  getState(): AlgorithmsImmediatePracticeControllerState {
    return this.state;
  }

  subscribe(listener: (state: AlgorithmsImmediatePracticeControllerState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  async start(input: AlgorithmsImmediatePracticeStartInput): Promise<AlgorithmsImmediatePracticeControllerState> {
    if ((input.modeId as AlgorithmModeId) === ALGORITHM_MODE_IDS.interviewSimulation) {
      return this.fail("starting", new Error("Interview Simulation has its own session controller."));
    }
    if (this.runtime) return this.state;
    this.setPending("recovering");
    try {
      await this.dependencies.recoverPendingMutation();
    } catch (error) {
      return this.fail("recovering", error);
    }
    this.setPending("starting");
    try {
      const runtime = this.dependencies.createRuntime();
      const runtimeState = await runtime.start(input);
      if (runtimeState.mode.profile.feedbackMode !== "afterEachAnswer") {
        throw new Error(`Algorithms mode ${runtimeState.mode.id} is not an immediate-feedback profile.`);
      }
      this.runtime = runtime;
      return this.setRuntime(runtimeState);
    } catch (error) {
      return this.fail("starting", error);
    }
  }

  /** Stores only view-local answer selection; no durable write happens before submit. */
  setResponse(response: AlgorithmResponse | null): AlgorithmsImmediatePracticeControllerState {
    const runtime = this.requireRuntime();
    try {
      runtime.setTransientResponse(response);
      return this.setRuntime(runtime.getState());
    } catch (error) {
      return this.fail("submitting", error);
    }
  }

  async submit(foregroundElapsedMs = 0): Promise<AlgorithmsImmediatePracticeControllerState> {
    return this.run("submitting", (runtime) => runtime.submitCurrent(foregroundElapsedMs));
  }

  async continue(foregroundElapsedMs = 0): Promise<AlgorithmsImmediatePracticeControllerState> {
    return this.run("continuing", (runtime) => runtime.continueAfterFeedback(foregroundElapsedMs));
  }

  async recordForegroundTime(elapsedMs: number): Promise<AlgorithmsImmediatePracticeControllerState> {
    return this.run("recording_foreground", (runtime) => runtime.recordPracticeForegroundTime(elapsedMs));
  }

  private async run(
    operation: Exclude<AlgorithmsImmediatePracticeOperationKind, "recovering" | "starting">,
    command: (runtime: AlgorithmsFamilyRuntime) => Promise<AlgorithmsRuntimeState>,
  ): Promise<AlgorithmsImmediatePracticeControllerState> {
    const runtime = this.runtime;
    if (!runtime) return this.fail(operation, new Error("Algorithms practice session is not active."));
    this.setPending(operation);
    try {
      return this.setRuntime(await command(runtime));
    } catch (error) {
      return this.fail(operation, error);
    }
  }

  private requireRuntime(): AlgorithmsFamilyRuntime {
    if (!this.runtime) throw new Error("Algorithms practice session is not active.");
    return this.runtime;
  }

  private setPending(kind: AlgorithmsImmediatePracticeOperationKind): AlgorithmsImmediatePracticeControllerState {
    return this.setState({ ...this.state, error: null, operation: Object.freeze({ kind, status: "pending" }) });
  }

  private setRuntime(runtime: AlgorithmsRuntimeState): AlgorithmsImmediatePracticeControllerState {
    return this.setState({
      error: null,
      operation: IDLE_OPERATION,
      runtime,
      status: runtime.session.status === "completed" ? "completed" : "active",
    });
  }

  private fail(
    kind: AlgorithmsImmediatePracticeOperationKind,
    error: unknown,
  ): AlgorithmsImmediatePracticeControllerState {
    const message = error instanceof Error ? error.message : "Algorithms practice could not complete the requested operation.";
    return this.setState({
      error: message,
      operation: Object.freeze({ kind, status: "failed", message }),
      runtime: this.state.runtime,
      status: this.state.runtime ? this.state.runtime.session.status === "completed" ? "completed" : "active" : "error",
    });
  }

  private setState(next: AlgorithmsImmediatePracticeControllerState): AlgorithmsImmediatePracticeControllerState {
    this.state = Object.freeze(next);
    for (const listener of this.listeners) listener(this.state);
    return this.state;
  }
}
