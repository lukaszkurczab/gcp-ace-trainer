import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parseDotenv, validateLocalProfile, localProfilePath } from "./runLocalProfile.mjs";
import { isObservation as isPersist13PracticeUiNextObservation, outputPathForRun } from "./qa/readPersist13UiNextState.mjs";

const SCENARIOS = Object.freeze(["start_cutpoint", "reset", "journal", "journal_materialized", "verify_clear", "submit_clear_next", "advance_materialized", "practice_ui_probe", "practice_ui_next", "draft"]);
const MODES = Object.freeze(["seed", "recover"]);
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export const PERSIST13_FIXTURE_PORT = "8082";

export function parsePersist13FixtureArgs(argv) {
  const [scenario, mode, runId, ...extra] = argv;
  const startStage = extra.length === 2 && extra[0] === "--start-stage" ? extra[1] : undefined;
  const observationPath = extra.length === 2 && extra[0] === "--ui-observation" ? extra[1] : undefined;
  if ((extra.length !== 0 && observationPath === undefined && startStage === undefined) || !SCENARIOS.includes(scenario) || !MODES.includes(mode) || typeof runId !== "string" || !UUID_V4.test(runId)
    || (scenario === "start_cutpoint" ? !["before_start_journal_write", "after_start_journal_durable_before_materialization"].includes(startStage) : startStage !== undefined)
    || (observationPath !== undefined && (scenario !== "practice_ui_next" || mode !== "recover"))) {
    throw new Error("Usage: runPersist13Fixture.mjs <start_cutpoint|reset|journal|journal_materialized|verify_clear|submit_clear_next|advance_materialized|practice_ui_probe|practice_ui_next|draft> <seed|recover> <run-uuid-v4> [--ui-observation <private-receipt-path> | --start-stage <before_start_journal_write|after_start_journal_durable_before_materialization>]");
  }
  return Object.freeze({ scenario, mode, runId: runId.toLowerCase(), ...(observationPath === undefined ? {} : { observationPath }), ...(startStage === undefined ? {} : { startStage }) });
}

export function createPersist13FixtureEnvironment(invocation, parentEnvironment, dotenvSource, observation) {
  if (observation !== undefined && (invocation.scenario !== "practice_ui_next" || invocation.mode !== "recover" || invocation.observationPath === undefined)) {
    throw new Error("PERSIST-13 UI observation input is valid only for practice_ui_next recover.");
  }
  if (invocation.observationPath !== undefined && observation === undefined) throw new Error("PERSIST-13 UI observation receipt is required before Expo starts.");
  const parsed = parseDotenv(dotenvSource);
  const environment = { ...validateLocalProfile("smoke", { ...parentEnvironment, ...parsed }) };
  delete environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_UI_OBSERVATION;
  delete environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE;
  if (invocation.startStage !== undefined) environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_START_STAGE = invocation.startStage;
  Object.assign(environment, {
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: invocation.mode,
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID: invocation.runId,
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO: invocation.scenario,
  });
  if (observation !== undefined) environment.EXPO_PUBLIC_PATTERNLY_PERSIST13_UI_OBSERVATION = JSON.stringify(observation);
  return Object.freeze(environment);
}

export function readPracticeUiNextObservationInput(repositoryRoot, invocation) {
  if (invocation.scenario !== "practice_ui_next" || invocation.mode !== "recover" || typeof invocation.observationPath !== "string") {
    throw new Error("PERSIST-13 UI observation input is valid only for practice_ui_next recover.");
  }
  const expectedPath = outputPathForRun(repositoryRoot, invocation.runId);
  const candidate = resolve(repositoryRoot, invocation.observationPath);
  if (candidate !== expectedPath) throw new Error("PERSIST-13 UI observation path is outside its run-scoped private receipt.");
  let metadata;
  try { metadata = lstatSync(candidate); } catch { throw new Error("PERSIST-13 UI observation receipt is unavailable."); }
  let realPath;
  try { realPath = realpathSync(candidate); } catch { throw new Error("PERSIST-13 UI observation receipt failed its private-file checks."); }
  if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.uid !== process.getuid() || (metadata.mode & 0o777) !== 0o600
    || metadata.size > 128 * 1024 || realPath !== candidate) {
    throw new Error("PERSIST-13 UI observation receipt failed its private-file checks.");
  }
  let parsed;
  try { parsed = JSON.parse(readFileSync(candidate, "utf8")); } catch { throw new Error("PERSIST-13 UI observation receipt is malformed."); }
  if (!isPersist13PracticeUiNextObservation(parsed, invocation.runId)) throw new Error("PERSIST-13 UI observation receipt failed its closed schema.");
  return parsed;
}

export async function runPersist13Fixture(argv = process.argv.slice(2), options = {}) {
  const invocation = parsePersist13FixtureArgs(argv);
  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  let dotenvSource;
  try { dotenvSource = readFileSync(localProfilePath("smoke", repositoryRoot), "utf8"); }
  catch { throw new Error("PERSIST-13 fixture requires a readable local smoke profile before Expo starts."); }
  const observation = invocation.observationPath === undefined ? undefined : readPracticeUiNextObservationInput(repositoryRoot, invocation);
  const environment = createPersist13FixtureEnvironment(invocation, options.parentEnvironment ?? process.env, dotenvSource, observation);
  const child = (options.spawn ?? spawn)(options.command ?? "npx", ["expo", "start", "--localhost", "--port", PERSIST13_FIXTURE_PORT], {
    cwd: repositoryRoot,
    env: environment,
    stdio: "inherit",
  });
  return await new Promise((resolveProcess, reject) => {
    child.once("error", reject);
    child.once("exit", (code, signal) => resolveProcess({ code: code ?? 1, signal }));
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPersist13Fixture().then(({ code }) => process.exitCode = code).catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : "PERSIST-13 fixture launch failed."}\n`);
    process.exitCode = 1;
  });
}
