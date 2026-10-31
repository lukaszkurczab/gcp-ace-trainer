import type { TrackId } from "../../domain";
import type { PreparedSession } from "./contracts";
import type { TrainingLifecycleUseCases } from "./TrainingLifecycleUseCases";
import type { DurableOperationState } from "./durableOperationState";
import type { ExactArtifactIdentity } from "./contracts";

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

/** Read-only startup assertion for the isolated PERSIST-13 fixture entry point. */
export function isPersist13LifecycleOwnerCold(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__ && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"
    && process.env.EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE !== undefined && lifecycle === null;
}

/** Read-only ACM native fixture guard before the canonical lifecycle is installed. */
export function isACMNativeFixtureLifecycleOwnerCold(runUUID: string): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__
    && process.env.EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE === "smoke"
    && process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE === "1"
    && process.env.EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID === runUUID
    && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(runUUID)
    && lifecycle === null;
}

export function installTrainingLifecycleUseCases(value: TrainingLifecycleUseCases): void {
  lifecycle = value;
}

export function getTrainingLifecycleUseCases(): TrainingLifecycleUseCases {
  if (!lifecycle) throw new Error("Training lifecycle is unavailable until application bootstrap has completed.");
  return lifecycle;
}

export function getApplicationCurrentTime(): string {
  return getTrainingLifecycleUseCases().currentTime();
}

export async function startTrainingSession(command: StartTrainingSessionCommand): Promise<PreparedSession> {
  return getTrainingLifecycleUseCases().startSession(command);
}

export async function resumeActiveTrainingSession() {
  return getTrainingLifecycleUseCases().resumeActiveSession();
}

export async function abandonUnavailableExactActiveTrainingSession(input: Readonly<{ sessionId: string; identity: ExactArtifactIdentity; isCurrent(): boolean | Promise<boolean> }>) {
  return getTrainingLifecycleUseCases().abandonUnavailableExactActiveSession(input);
}

/** Presentation-facing observable application read model. */
export function getTrainingOperationProjection(sessionId: string): DurableOperationState | null {
  return getTrainingLifecycleUseCases().getOperationProjection(sessionId);
}

export function subscribeTrainingOperationProjection(sessionId: string, listener: (value: DurableOperationState) => void): () => void {
  return getTrainingLifecycleUseCases().subscribeOperationProjection(sessionId, listener);
}
