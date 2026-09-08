export type AccountForegroundRefreshIntent = Readonly<{
  generation: number;
  uid: string;
}>;

export type AccountForegroundRefreshScheduler<TIntent extends AccountForegroundRefreshIntent> = Readonly<{
  dispose: () => void;
  request: (intent: TIntent | null) => void;
}>;

/**
 * Coalesces one foreground refresh at a time and drops work whose account
 * intent is no longer current. The refresh callback owns its command lane and
 * reports failures through the account context.
 */
export function createAccountForegroundRefreshScheduler<TIntent extends AccountForegroundRefreshIntent>(input: Readonly<{
  isCurrent: (intent: TIntent) => boolean;
  refresh: (intent: TIntent) => Promise<unknown>;
}>): AccountForegroundRefreshScheduler<TIntent> {
  let disposed = false;
  let active: Readonly<{ intent: TIntent; promise: Promise<void> }> | null = null;
  let queued: TIntent | null = null;

  const sameIntent = (left: TIntent, right: TIntent): boolean => left.uid === right.uid && left.generation === right.generation;
  const start = (intent: TIntent): void => {
    const promise = Promise.resolve()
      .then(() => {
        if (disposed || !input.isCurrent(intent)) return;
        return input.refresh(intent).then(() => undefined, () => undefined);
      })
      .then(() => undefined, () => undefined)
      .finally(() => {
        if (active?.promise !== promise) return;
        active = null;
        const next = queued;
        queued = null;
        if (!disposed && next && !sameIntent(next, intent)) start(next);
      });
    active = Object.freeze({ intent, promise });
  };

  const request = (intent: TIntent | null): void => {
    if (disposed || !intent) return;
    if (!active) {
      start(intent);
      return;
    }
    if (sameIntent(active.intent, intent) || (queued && sameIntent(queued, intent))) return;
    if (queued && queued.generation > intent.generation) return;
    queued = intent;
  };

  return Object.freeze({
    dispose: (): void => {
      disposed = true;
      queued = null;
    },
    request,
  });
}
