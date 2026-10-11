export type Persist13FixtureMode = "seed" | "recover";
export type Persist13FixtureScenario = "reset" | "journal" | "draft";
export type Persist13Entry = Readonly<{ kind: "regular" } | { kind: "fixture_invalid"; reason: "invalid_mode" | "invalid_run_id" | "run_id_without_mode" | "scenario_without_mode" | "invalid_scenario" } | { kind: "fixture"; mode: Persist13FixtureMode; scenario: Persist13FixtureScenario; runId: string }>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** Only an entirely absent fixture configuration selects the ordinary app. */
export function resolvePersist13Entry(environment: Readonly<{ mode?: string; runId?: string; scenario?: string }>): Persist13Entry {
  const mode = environment.mode;
  const runId = environment.runId;
  const scenario = environment.scenario;
  if (mode === undefined && runId === undefined && scenario === undefined) return Object.freeze({ kind: "regular" });
  if (mode === undefined && scenario !== undefined) return Object.freeze({ kind: "fixture_invalid", reason: "scenario_without_mode" });
  if (mode === undefined) return Object.freeze({ kind: "fixture_invalid", reason: "run_id_without_mode" });
  if (mode !== "seed" && mode !== "recover") return Object.freeze({ kind: "fixture_invalid", reason: "invalid_mode" });
  if (typeof runId !== "string" || !UUID_V4.test(runId)) return Object.freeze({ kind: "fixture_invalid", reason: "invalid_run_id" });
  if (scenario !== undefined && scenario !== "reset" && scenario !== "journal" && scenario !== "draft") return Object.freeze({ kind: "fixture_invalid", reason: "invalid_scenario" });
  return Object.freeze({ kind: "fixture", mode, scenario: scenario ?? "reset", runId: runId.toLowerCase() });
}

export function isPersist13RunId(value: unknown): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}
