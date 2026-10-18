/** Owns one bootstrap result across the timeout UI and a possible manual retry.
 * Timeout reports slow work; it does not cancel validation already in progress. */
export function createContentPreparationAttempt(isCurrent: () => boolean, canAcceptLateSuccess: () => boolean) {
  let phase: "running" | "timed_out" | "finished" = "running";
  return {
    pending: () => phase === "running" && isCurrent(),
    timeout() {
      if (phase !== "running" || !isCurrent()) return false;
      phase = "timed_out";
      return true;
    },
    complete(successful: boolean) {
      if (phase === "finished" || !isCurrent()) return false;
      if (phase === "timed_out" && (!successful || !canAcceptLateSuccess())) return false;
      phase = "finished";
      return true;
    },
    cancel() { phase = "finished"; },
  };
}
