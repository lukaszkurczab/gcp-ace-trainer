/** Unknown reachability never establishes either side of a reconnect transition. */
export function observeReachability(previous: boolean | null, current: boolean | null): Readonly<{ next: boolean | null; reconnected: boolean }> {
  return { next: current, reconnected: previous === false && current === true };
}
