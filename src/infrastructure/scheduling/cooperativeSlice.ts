/** Work since the last yield that is allowed before a slice yields to the event loop. */
export const COOPERATIVE_SLICE_BUDGET_MS = 50;

const now = (): number => (typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now());

/**
 * Returns a yield point for one long operation. It yields to the event loop
 * (timers, rendering, input) only when the operation has run for at least
 * `budgetMs` since its start or its last yield, so short operations (small
 * histories) never pay the cost of a macrotask hop.
 */
export function createCooperativeSlice(budgetMs: number = COOPERATIVE_SLICE_BUDGET_MS): () => Promise<void> {
  let sliceStart = now();
  return async () => {
    if (now() - sliceStart < budgetMs) return;
    await new Promise<void>((resolve) => { setTimeout(resolve, 0); });
    sliceStart = now();
  };
}
