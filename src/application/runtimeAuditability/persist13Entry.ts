export type Persist13FixtureMode = "seed" | "recover";
export type Persist13Entry = Readonly<{ kind: "regular" } | { kind: "fixture_invalid"; reason: "invalid_mode" | "invalid_run_id" | "run_id_without_mode" } | { kind: "fixture"; mode: Persist13FixtureMode; runId: string }>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** Only an entirely absent fixture configuration selects the ordinary app. */
export function resolvePersist13Entry(environment: Readonly<{ mode?: string; runId?: string }>): Persist13Entry {
  const mode = environment.mode;
  const runId = environment.runId;
  if (mode === undefined && runId === undefined) return Object.freeze({ kind: "regular" });
  if (mode === undefined) return Object.freeze({ kind: "fixture_invalid", reason: "run_id_without_mode" });
  if (mode !== "seed" && mode !== "recover") return Object.freeze({ kind: "fixture_invalid", reason: "invalid_mode" });
  if (typeof runId !== "string" || !UUID_V4.test(runId)) return Object.freeze({ kind: "fixture_invalid", reason: "invalid_run_id" });
  return Object.freeze({ kind: "fixture", mode, runId: runId.toLowerCase() });
}

export function isPersist13RunId(value: unknown): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}
