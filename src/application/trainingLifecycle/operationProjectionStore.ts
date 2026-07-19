import type { DurableOperationState } from "./durableOperationState";

export type OperationProjectionReconstruction = Readonly<{
  sessionId: string;
  state: DurableOperationState;
}>;

/** Application-owned observable state; presentation only subscribes and renders. */
export class OperationProjectionStore {
  private readonly values = new Map<string, DurableOperationState>();
  private readonly listeners = new Map<string, Set<(value: DurableOperationState) => void>>();
  getOperationProjection(sessionId: string): DurableOperationState | null { return this.values.get(sessionId) ?? null; }
  subscribeOperationProjection(sessionId: string, listener: (value: DurableOperationState) => void): () => void {
    const listeners = this.listeners.get(sessionId) ?? new Set(); listeners.add(listener); this.listeners.set(sessionId, listeners);
    const current = this.values.get(sessionId); if (current) listener(current);
    return () => { listeners.delete(listener); if (!listeners.size) this.listeners.delete(sessionId); };
  }
  publish(sessionId: string, value: DurableOperationState): void { this.values.set(sessionId, value); for (const listener of this.listeners.get(sessionId) ?? []) listener(value); }
  set(sessionId: string, value: DurableOperationState): this { this.publish(sessionId, value); return this; }
  get(sessionId: string): DurableOperationState | undefined { return this.values.get(sessionId); }
  clear(sessionId: string): void { this.values.delete(sessionId); }
  /** Durable reconstruction wins over an older transient in-memory publication. */
  reconstruct(input: OperationProjectionReconstruction): DurableOperationState {
    this.publish(input.sessionId, input.state);
    return input.state;
  }
}
