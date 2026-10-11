import { readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parseDotenv, validateLocalProfile, localProfilePath } from "./runLocalProfile.mjs";

const SCENARIOS = Object.freeze(["reset", "journal", "draft"]);
const MODES = Object.freeze(["seed", "recover"]);
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
export const PERSIST13_FIXTURE_PORT = "8082";

export function parsePersist13FixtureArgs(argv) {
  const [scenario, mode, runId, ...extra] = argv;
  if (extra.length || !SCENARIOS.includes(scenario) || !MODES.includes(mode) || typeof runId !== "string" || !UUID_V4.test(runId)) {
    throw new Error("Usage: runPersist13Fixture.mjs <reset|journal|draft> <seed|recover> <run-uuid-v4>");
  }
  return Object.freeze({ scenario, mode, runId: runId.toLowerCase() });
}

export function createPersist13FixtureEnvironment(invocation, parentEnvironment, dotenvSource) {
  const parsed = parseDotenv(dotenvSource);
  const environment = validateLocalProfile("smoke", { ...parentEnvironment, ...parsed });
  return Object.freeze({
    ...environment,
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE: invocation.mode,
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_RUN_ID: invocation.runId,
    EXPO_PUBLIC_PATTERNLY_PERSIST13_FIXTURE_SCENARIO: invocation.scenario,
  });
}

export async function runPersist13Fixture(argv = process.argv.slice(2), options = {}) {
  const invocation = parsePersist13FixtureArgs(argv);
  const repositoryRoot = options.repositoryRoot ?? process.cwd();
  let dotenvSource;
  try { dotenvSource = readFileSync(localProfilePath("smoke", repositoryRoot), "utf8"); }
  catch { throw new Error("PERSIST-13 fixture requires a readable local smoke profile before Expo starts."); }
  const environment = createPersist13FixtureEnvironment(invocation, options.parentEnvironment ?? process.env, dotenvSource);
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
