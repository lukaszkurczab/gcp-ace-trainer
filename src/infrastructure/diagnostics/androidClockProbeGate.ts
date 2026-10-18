const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** Shared gate for the private Android clock host and its RAM-only trace. */
export function androidClockProbeEnabled(runId: string | undefined, runtime: string | undefined, os: string): runId is string {
  return os === "android" && runtime === "sandbox" && UUID.test(runId ?? "");
}
