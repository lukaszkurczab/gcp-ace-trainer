export type SimulationDraftOverlayEntry<T> = Readonly<{
  response: T;
  revision: number;
}>;

type DraftIntentQueueOptions<T> = Readonly<{
  onChange: () => void;
  onLatestFailure: (occurrenceId: string, response: T) => void;
}>;

/**
 * Serializes presentation-owned draft intents while retaining the newest local
 * response until the controller confirms its durability. A failed superseded
 * write is intentionally not retried: the later intent replaces it.
 */
export class SimulationDraftIntentQueue<T> {
  private readonly overlay = new Map<string, SimulationDraftOverlayEntry<T>>();
  private tail: Promise<void> = Promise.resolve();

  constructor(private readonly options: DraftIntentQueueOptions<T>) {}

  clear(): void {
    if (!this.overlay.size) return;
    this.overlay.clear();
    this.options.onChange();
  }

  get(occurrenceId: string): SimulationDraftOverlayEntry<T> | undefined {
    return this.overlay.get(occurrenceId);
  }

  has(occurrenceId: string): boolean {
    return this.overlay.has(occurrenceId);
  }

  /** Test/support boundary: resolves after every enqueued persistence intent settles. */
  async whenIdle(): Promise<void> {
    await this.tail;
  }

  enqueue(
    occurrenceId: string,
    response: T,
    persist: () => Promise<boolean>,
  ): void {
    const revision = (this.overlay.get(occurrenceId)?.revision ?? 0) + 1;
    this.overlay.set(occurrenceId, Object.freeze({ response, revision }));
    this.options.onChange();
    const persistIntent = async () => {
      let saved = false;
      try {
        saved = await persist();
      } catch {
        saved = false;
      }
      const latest = this.overlay.get(occurrenceId);
      if (latest?.revision !== revision) return;
      if (!saved) {
        this.options.onLatestFailure(occurrenceId, latest.response);
        return;
      }
      this.overlay.delete(occurrenceId);
      this.options.onChange();
    };
    this.tail = this.tail.then(persistIntent, persistIntent);
  }
}
