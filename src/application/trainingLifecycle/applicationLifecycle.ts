import type { TrackId } from "../../domain";
import type { PreparedSession } from "./contracts";
import type { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import type { DurableOperationState } from "./durableOperationState";

export type StartTrainingSessionCommand = Readonly<{
  trackId: TrackId;
  modeId: string;
  source?: string;
  request: unknown;
}>;

/**
 * Presentation imports this facade only. The bootstrap composition installs the
 * canonical lifecycle after repositories and the bundled content are verified.
 */
let lifecycle: TrainingLifecycleUseCases | null = null;

export function installTrainingLifecycleUseCases(value: TrainingLifecycleUseCases): void {
  lifecycle = value;
}

export function getTrainingLifecycleUseCases(): TrainingLifecycleUseCases {
  if (!lifecycle) throw new Error("Training lifecycle is unavailable until application bootstrap has completed.");
  return lifecycle;
}

export async function startTrainingSession(command: StartTrainingSessionCommand): Promise<PreparedSession> {
  return getTrainingLifecycleUseCases().startSession(command);
}

export async function resumeActiveTrainingSession() {
  return getTrainingLifecycleUseCases().resumeActiveSession();
}

/** Presentation-facing observable application read model. */
export function getTrainingOperationProjection(sessionId: string): DurableOperationState | null {
  return getTrainingLifecycleUseCases().getOperationProjection(sessionId);
}

export function subscribeTrainingOperationProjection(sessionId: string, listener: (value: DurableOperationState) => void): () => void {
  return getTrainingLifecycleUseCases().subscribeOperationProjection(sessionId, listener);
}
