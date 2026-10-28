export type Persist13FixtureMode = "seed" | "recover";
export type Persist13FixtureScenario = "start_cutpoint" | "reset" | "journal" | "journal_materialized" | "verify_clear" | "submit_clear_next" | "advance_materialized" | "practice_ui_probe" | "practice_ui_next" | "draft";
export type Persist13Entry = Readonly<{ kind: "regular" } | { kind: "fixture_invalid"; reason: "invalid_mode" | "invalid_run_id" | "run_id_without_mode" | "scenario_without_mode" | "invalid_scenario" | "observation_unexpected" | "start_stage_invalid" } | { kind: "fixture"; mode: Persist13FixtureMode; scenario: Persist13FixtureScenario; runId: string; observation?: string; startStage?: "before_start_journal_write" | "after_start_journal_durable_before_materialization" }>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** Only an entirely absent fixture configuration selects the ordinary app. */
export function resolvePersist13Entry(environment: Readonly<{ mode?: string; runId?: string; scenario?: string; observation?: string; startStage?: string }>): Persist13Entry {
  const mode = environment.mode;
  const runId = environment.runId;
  const scenario = environment.scenario;
  const observation = environment.observation;
  if (mode === undefined && runId === undefined && scenario === undefined && observation === undefined && environment.startStage === undefined) return Object.freeze({ kind: "regular" });
  if (mode === undefined && scenario !== undefined) return Object.freeze({ kind: "fixture_invalid", reason: "scenario_without_mode" });
  if (mode === undefined) return Object.freeze({ kind: "fixture_invalid", reason: "run_id_without_mode" });
  if (mode !== "seed" && mode !== "recover") return Object.freeze({ kind: "fixture_invalid", reason: "invalid_mode" });
  if (typeof runId !== "string" || !UUID_V4.test(runId)) return Object.freeze({ kind: "fixture_invalid", reason: "invalid_run_id" });
  if (scenario !== undefined && scenario !== "start_cutpoint" && scenario !== "reset" && scenario !== "journal" && scenario !== "journal_materialized" && scenario !== "verify_clear" && scenario !== "submit_clear_next" && scenario !== "advance_materialized" && scenario !== "practice_ui_probe" && scenario !== "practice_ui_next" && scenario !== "draft") return Object.freeze({ kind: "fixture_invalid", reason: "invalid_scenario" });
  const resolvedScenario = scenario ?? "reset";
  const startStage = environment.startStage;
  if (resolvedScenario === "start_cutpoint" ? (startStage !== "before_start_journal_write" && startStage !== "after_start_journal_durable_before_materialization") : startStage !== undefined) return Object.freeze({ kind: "fixture_invalid", reason: "start_stage_invalid" });
  if (observation !== undefined && (typeof observation !== "string" || !observation || mode !== "recover" || resolvedScenario !== "practice_ui_next")) return Object.freeze({ kind: "fixture_invalid", reason: "observation_unexpected" });
  return Object.freeze({ kind: "fixture", mode, scenario: resolvedScenario, runId: runId.toLowerCase(), ...(observation === undefined ? {} : { observation }), ...(startStage === "before_start_journal_write" || startStage === "after_start_journal_durable_before_materialization" ? { startStage } : {}) });
}

export function isPersist13RunId(value: unknown): value is string {
  return typeof value === "string" && UUID_V4.test(value);
}
