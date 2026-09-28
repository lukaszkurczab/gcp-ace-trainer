import type { DesignSimulationStage } from "../../application/design-interview";

export type DesignSimulationResponses = Partial<Record<DesignSimulationStage, string>>;

export class DesignSimulationDraftDrain {
  private readonly dirty = new Map<DesignSimulationStage, string>();
  private readonly durable = new Map<DesignSimulationStage, string>();
  private running: Promise<void> | null = null;
  private scheduled: { promise: Promise<void>; resolve: () => void; reject: (cause: unknown) => void } | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly save: (stage: DesignSimulationStage, value: string) => Promise<void>,
    private readonly onCommitted: () => Promise<void>,
    private readonly onStateChange: () => void,
    private readonly debounceMs = 180,
  ) {}

  seedDurable(values: DesignSimulationResponses): void {
    this.durable.clear();
    for (const [stage, value] of Object.entries(values)) {
      if (value !== undefined) this.durable.set(stage as DesignSimulationStage, value);
    }
    this.emit();
  }

  request(stage: DesignSimulationStage, value: string): Promise<void> {
    this.dirty.set(stage, value);
    this.emit();
    if (this.running) return this.running;
    if (this.scheduled) return this.scheduled.promise;
    let resolve!: () => void;
    let reject!: (cause: unknown) => void;
    const promise = new Promise<void>((res, rej) => { resolve = res; reject = rej; });
    this.scheduled = { promise, resolve, reject };
    this.timer = setTimeout(() => { void this.startScheduledDrain(); }, this.debounceMs);
    return promise;
  }

  flush(): Promise<void> {
    if (this.scheduled) {
      if (this.timer) clearTimeout(this.timer);
      this.timer = null;
      return this.startScheduledDrain();
    }
    return this.ensureDrain();
  }

  isSaving(): boolean { return this.running !== null; }
  hasDirty(): boolean { return this.dirty.size > 0; }

  isSaved(values: DesignSimulationResponses): boolean {
    if (this.running || this.dirty.size) return false;
    for (const [stage, value] of Object.entries(values)) {
      if (value !== undefined && this.durable.get(stage as DesignSimulationStage) !== value) return false;
    }
    return true;
  }

  private ensureDrain(): Promise<void> {
    if (this.running) return this.running;
    if (this.dirty.size === 0) return Promise.resolve();
    const run = this.drain().finally(() => {
      this.running = null;
      this.emit();
    });
    this.running = run;
    this.emit();
    return run;
  }

  private startScheduledDrain(): Promise<void> {
    const scheduled = this.scheduled;
    if (!scheduled) return this.ensureDrain();
    this.scheduled = null;
    this.timer = null;
    void this.ensureDrain().then(scheduled.resolve, scheduled.reject);
    return scheduled.promise;
  }

  private async drain(): Promise<void> {
    while (this.dirty.size) {
      const batch = [...this.dirty.entries()];
      for (const [stage, value] of batch) {
        await this.save(stage, value);
        this.durable.set(stage, value);
        if (this.dirty.get(stage) === value) this.dirty.delete(stage);
        this.emit();
      }
    }
    await this.onCommitted();
  }

  private emit(): void { this.onStateChange(); }
}
