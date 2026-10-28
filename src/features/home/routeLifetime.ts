import { useRef } from "react";

/** Tracks actual component lifetime. Focus changes do not end a route lifetime. */
export type RouteLifetime = Readonly<{
  isCurrent(): boolean;
  beginAction(): () => void;
  remove(dispose?: () => void): void;
}>;

export function createRouteLifetime(): RouteLifetime {
  let removed = false;
  let pendingActions = 0;
  const disposers: Array<() => void> = [];
  let disposed = false;

  function flushDisposers(): void {
    if (!removed || pendingActions !== 0 || disposed) return;
    disposed = true;
    for (const dispose of disposers.splice(0)) dispose();
  }

  return Object.freeze({
    isCurrent: () => !removed,
    beginAction() {
      pendingActions += 1;
      let finished = false;
      return () => {
        if (finished) return;
        finished = true;
        pendingActions = Math.max(0, pendingActions - 1);
        flushDisposers();
      };
    },
    remove(dispose) {
      if (disposed) return;
      if (!removed) removed = true;
      if (dispose) disposers.push(dispose);
      flushDisposers();
    },
  });
}

/** A new route key gets a new lifetime; rerenders and focus changes keep it. */
export function useRouteLifetime(routeIdentity: string): RouteLifetime {
  const current = useRef<Readonly<{ identity: string; lifetime: RouteLifetime }> | null>(null);
  if (current.current?.identity !== routeIdentity) {
    current.current = Object.freeze({ identity: routeIdentity, lifetime: createRouteLifetime() });
  }
  return current.current.lifetime;
}
