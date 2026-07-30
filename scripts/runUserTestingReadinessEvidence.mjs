import {
  existsSync,
  mkdirSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { spawnSync } from "node:child_process";
import { relative, resolve } from "node:path";

import { buildParticipantBuildIdentity } from "./participantBuildIdentity.mjs";

const FLOW = ".maestro/user-testing/algorithms-core-journey.yaml";
const IOS_RUNNER = "scripts/runRcAlgorithmsIos.mjs";
const ANDROID_RUNNER = "scripts/runRcAlgorithmsAndroid.mjs";
const REPO_ROOT = process.cwd();

const argumentsByName = parseArguments(process.argv.slice(2));
const iosUdid = requireMatch(argumentsByName, "ios-udid", /^[0-9A-F-]{36}$/i);
const androidSerial = requireMatch(argumentsByName, "android-serial", /^emulator-[0-9]+$/);
const outputRoot = resolveOutputRoot(requireArgument(argumentsByName, "output"));
const devClientUrl = requireEnvironment("PATTERNLY_DEV_CLIENT_URL");
const androidHome = requireEnvironment("ANDROID_HOME");

if (existsSync(outputRoot) && readdirSync(outputRoot).length > 0) {
  throw new Error(`Evidence output must be new or empty: ${outputRoot}`);
}
mkdirSync(outputRoot, { recursive: true });

const startedAt = new Date().toISOString();
const sourceIdentity = buildParticipantBuildIdentity(REPO_ROOT);
const runs = [];

for (const platform of ["ios", "android"]) {
  for (const sequence of [1, 2]) {
    const runId = `${platform}-${sequence}`;
    const testOutputDirectory = resolve(outputRoot, runId, "maestro");
    mkdirSync(testOutputDirectory, { recursive: true });
    const command = platform === "ios"
      ? [
        "node",
        IOS_RUNNER,
        "--udid",
        iosUdid,
        "--flow",
        FLOW,
      ]
      : [
        "node",
        ANDROID_RUNNER,
        "--serial",
        androidSerial,
        "--flow",
        FLOW,
      ];
    const runStartedAt = new Date().toISOString();
    const result = spawnSync(command[0], command.slice(1), {
      cwd: REPO_ROOT,
      encoding: "utf8",
      env: {
        ...process.env,
        ANDROID_HOME: androidHome,
        MAESTRO_TEST_OUTPUT_DIR: testOutputDirectory,
        PATTERNLY_DEV_CLIENT_URL: devClientUrl,
      },
      maxBuffer: 64 * 1024 * 1024,
    });
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n");
    writeFileSync(resolve(outputRoot, runId, "run.log"), output, "utf8");
    const run = {
      id: runId,
      platform,
      sequence,
      started_at: runStartedAt,
      completed_at: new Date().toISOString(),
      exit_code: result.status,
      signal: result.signal,
      result: result.status === 0 ? "PASS" : "FAIL",
      maestro_output: relative(outputRoot, testOutputDirectory),
      log: relative(outputRoot, resolve(outputRoot, runId, "run.log")),
    };
    runs.push(run);
    writeSummary();
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`${runId} failed. See ${resolve(outputRoot, run.log)}.`);
    }
  }
}

writeSummary();
console.log(`USER_TESTING_READINESS_EVIDENCE=passed`);
console.log(`USER_TESTING_READINESS_RUNS=${runs.length}`);
console.log(`USER_TESTING_READINESS_OUTPUT=${outputRoot}`);

function writeSummary() {
  const complete = runs.length === 4 && runs.every((run) => run.result === "PASS");
  writeFileSync(
    resolve(outputRoot, "summary.json"),
    `${JSON.stringify({
      schema_version: 2,
      purpose: "Two consecutive Patternly Algorithms core-journey runs on each participant platform",
      started_at: startedAt,
      updated_at: new Date().toISOString(),
      result: complete ? "PASS" : runs.some((run) => run.result === "FAIL") ? "FAIL" : "IN_PROGRESS",
      source: sourceIdentity,
      environment: {
        flow: FLOW,
        ios_udid: iosUdid,
        android_serial: androidSerial,
        dev_client_url: devClientUrl,
      },
      acceptance: {
        required_runs_per_platform: 2,
        consecutive: true,
        reset_before_every_run: true,
        exact_content_contract_test: "tests/userTestingCoreJourneyMaestro.test.ts",
      },
      runs,
    }, null, 2)}\n`,
    "utf8",
  );
}

function parseArguments(values) {
  const parsed = new Map();
  for (let index = 0; index < values.length; index += 2) {
    const key = values[index];
    const value = values[index + 1];
    if (!key?.startsWith("--") || !value || value.startsWith("--")) {
      throw new Error("Usage: --ios-udid <UDID> --android-serial <serial> --output <artifacts/user-testing-readiness/run-id>");
    }
    parsed.set(key.slice(2), value);
  }
  return parsed;
}

function requireArgument(values, name) {
  const value = values.get(name);
  if (!value) throw new Error(`Missing required --${name}.`);
  return value;
}

function requireMatch(values, name, pattern) {
  const value = requireArgument(values, name);
  if (!pattern.test(value)) throw new Error(`Invalid --${name}: ${value}`);
  return value;
}

function requireEnvironment(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function resolveOutputRoot(value) {
  const root = resolve(REPO_ROOT, "artifacts", "user-testing-readiness");
  const candidate = resolve(REPO_ROOT, value);
  if (candidate === root || !candidate.startsWith(`${root}/`)) {
    throw new Error("Evidence output must be a run directory under artifacts/user-testing-readiness.");
  }
  return candidate;
}
