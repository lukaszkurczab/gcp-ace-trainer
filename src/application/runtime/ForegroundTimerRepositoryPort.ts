import type { ForegroundTimerState } from "../../domain";

/**
 * Application boundary for the single active foreground timer record. Concrete
 * storage bindings belong exclusively to the application composition root.
 */
export type ForegroundTimerRepositoryPort = Readonly<{
  getActive(): Promise<ForegroundTimerState | null>;
  save(timer: ForegroundTimerState, expectedPreviousCheckpointRevision: number | null): Promise<ForegroundTimerState>;
}>;
