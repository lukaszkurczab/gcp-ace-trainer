import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { parseDotenv } from "./runLocalProfile.mjs";
import { waitForContentPreparationState } from "./waitForContentPreparationState.mjs";

const APP_ID = "com.lkurczab.patternly";
const UDID = "7F315654-3175-4F3C-BB24-B0263F59360C";
const RESET_URL = "com.lkurczab.patternly://audit/reset-learning-state";
const TRACKS = Object.freeze([
  "backend-system-design-interview",
  "frontend-system-design-interview",
  "object-oriented-design-interview",
]);
const AUTH_FLOW = ".maestro/rc-auth-preflight.yaml";
const RESET_FLOW = ".maestro/rc-runtime-audit-reset-complete.yaml";
const FREE_FLOW = ".maestro/aud02c-design-simulation-free.yaml";
const PREMIUM_FLOW = ".maestro/aud02c-design-simulation-premium.yaml";
const TIMEOUT_PREPARE_FLOW = ".maestro/aud02c-design-simulation-timeout.yaml";
const TIMEOUT_RESULT_FLOW = ".maestro/aud02c-design-simulation-timeout-result.yaml";
const CREDENTIAL_KEYS = Object.freeze(["EXPO_PUBLIC_PATTERNLY_E2E_EMAIL", "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD"]);
const BACKEND_ORIGIN = "http://127.0.0.1:8080";
const BACKEND_DIRECTORY = "../patternly-backend";
const BACKEND_ENVIRONMENT = Object.freeze({
  FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:19099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:18081",
});

const [flag, suppliedUdid] = process.argv.slice(2);
if (flag !== "--udid" || suppliedUdid?.toUpperCase() !== UDID) {
  throw new Error(`Usage: PATTERNLY_DEV_CLIENT_URL=<local dev-client URL> MAESTRO_TEST_OUTPUT_DIR=<evidence directory> node scripts/runDesignInterviewAud02cIos.mjs --udid ${UDID}`);
}
await assertPortAvailable();
const devClientUrl = required("PATTERNLY_DEV_CLIENT_URL");
validateDevClientUrl(devClientUrl);
const outputDirectory = required("MAESTRO_TEST_OUTPUT_DIR");
mkdirSync(outputDirectory, { recursive: true });
const simulator = availableBootedSimulator();
if (!simulator || simulator.name !== "iPhone 17" || simulator.deviceTypeIdentifier !== "com.apple.CoreSimulator.SimDeviceType.iPhone-17") {
  throw new Error(`Required iPhone 17 simulator ${UDID} must be available and booted.`);
}
run("xcrun", ["simctl", "get_app_container", UDID, APP_ID, "app"]);
for (const flow of [AUTH_FLOW, RESET_FLOW, FREE_FLOW, PREMIUM_FLOW, TIMEOUT_PREPARE_FLOW, TIMEOUT_RESULT_FLOW]) {
  if (!existsSync(flow)) throw new Error(`AUD-02C flow is missing: ${flow}`);
}
const credentials = loadCredentials();

let backend;
try {
  backend = startBackend("expired");
  await waitForBackendReady(backend);
  runOptional("xcrun", ["simctl", "terminate", UDID, APP_ID]);
  run("xcrun", ["simctl", "openurl", UDID, devClientUrl]);
  await preflight();
  await waitForContentPreparationState();
  for (const trackId of TRACKS) {
    await resetAndAuthenticate();
    runMaestro(FREE_FLOW, credentials, trackId);
  }

  await stopBackend(backend);
  backend = undefined;
  await waitForPortAvailable();
  backend = startBackend("active");
  await waitForBackendReady(backend);
  for (const trackId of TRACKS) {
    await resetAndAuthenticate();
    runMaestro(PREMIUM_FLOW, credentials, trackId);
    await resetAndAuthenticate();
    runMaestro(TIMEOUT_PREPARE_FLOW, credentials, trackId);
    run("xcrun", ["simctl", "openurl", UDID, "com.lkurczab.patternly://audit/clock/advance?milliseconds=2700001"]);
    runMaestro(TIMEOUT_RESULT_FLOW, credentials, trackId);
  }
} finally {
  if (backend) {
    await stopBackend(backend);
    await waitForPortAvailable();
  }
}

async function preflight() {
  runMaestro(AUTH_FLOW, credentials);
  run("xcrun", ["simctl", "launch", UDID, APP_ID]);
}

async function resetAndAuthenticate() {
  run("xcrun", ["simctl", "openurl", UDID, RESET_URL]);
  runMaestro(RESET_FLOW);
  runMaestro(AUTH_FLOW, credentials);
}

async function assertPortAvailable() {
  try { await probePort(); }
  catch { throw new Error("AUD-02C requires 127.0.0.1:8080 to be free at startup; no existing process was stopped."); }
}

function probePort() {
  return new Promise((resolveProbe, rejectProbe) => {
    const server = createServer();
    server.once("error", rejectProbe);
    server.listen(8080, "127.0.0.1", () => server.close((error) => error ? rejectProbe(error) : resolveProbe()));
  });
}

async function waitForPortAvailable(timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  do { try { await probePort(); return; } catch { await delay(100); } } while (Date.now() < deadline);
  throw new Error("AUD-02C backend stopped, but 127.0.0.1:8080 did not become available.");
}

function startBackend(entitlementState) {
  const child = spawn("npm", ["run", "dev:smoke"], {
    cwd: BACKEND_DIRECTORY, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"],
    env: { PATH: process.env.PATH, HOME: process.env.HOME, ...BACKEND_ENVIRONMENT, PATTERNLY_LOCAL_SMOKE_ENTITLEMENT_STATE: entitlementState },
  });
  for (const stream of [child.stdout, child.stderr]) stream.setEncoding("utf8").on("data", (chunk) => process.stdout.write(redact(chunk)));
  child.once("error", (error) => { child.spawnError = error; });
  return child;
}

async function waitForBackendReady(child) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (child.spawnError) throw new Error("Could not start the local AUD-02C backend with npm.");
    if (child.exitCode !== null || child.signalCode !== null) throw new Error("Local AUD-02C backend exited before readiness.");
    try {
      const response = await fetch(new URL("/ready", BACKEND_ORIGIN), { signal: AbortSignal.timeout(1_000) });
      const body = await response.json();
      if (response.ok && body?.status === "ready" && ["database", "authentication", "providerReader"].every((key) => body.checks?.[key] === true)) return;
    } catch { /* Retry while the local service starts. */ }
    await delay(200);
  }
  throw new Error("Local AUD-02C backend did not become ready within 60000ms.");
}

async function stopBackend(child) {
  if (process.platform === "win32") { if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM"); }
  else if (child.pid !== undefined) { try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error?.code !== "ESRCH") throw error; } }
  if (child.exitCode === null && child.signalCode === null) await Promise.race([new Promise((resolveExit) => child.once("exit", resolveExit)), delay(5_000)]);
  try {
    if (process.platform === "win32") { if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL"); }
    else if (child.pid !== undefined) { process.kill(-child.pid, 0); process.kill(-child.pid, "SIGKILL"); }
  } catch (error) { if (error?.code !== "ESRCH") throw error; }
}

function availableBootedSimulator() {
  const payload = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "--json"]));
  return Object.values(payload.devices ?? {}).flat().find((device) => device.udid?.toUpperCase() === UDID && device.state === "Booted");
}

function validateDevClientUrl(value) {
  let launchUrl;
  try { launchUrl = new URL(value); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must be an absolute dev-client URL."); }
  if (launchUrl.protocol !== "exp+patternly:" || launchUrl.host !== "expo-development-client") throw new Error("PATTERNLY_DEV_CLIENT_URL must target the current Patternly Expo development client.");
  let metroUrl;
  try { metroUrl = new URL(launchUrl.searchParams.get("url") ?? ""); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must include a valid Metro bundle URL."); }
  if (metroUrl.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(metroUrl.hostname) || !/^[0-9]+$/.test(metroUrl.port)) throw new Error("PATTERNLY_DEV_CLIENT_URL must use an explicit local Metro endpoint.");
}

function required(name) { const value = process.env[name]; if (!value) throw new Error(`${name} is required; AUD-02C does not guess runtime inputs.`); return value; }

function loadCredentials() {
  let profile;
  try { profile = parseDotenv(readFileSync(".env.smoke.local", "utf8")); } catch { throw new Error("Cannot load the local smoke account from .env.smoke.local."); }
  const result = Object.fromEntries(CREDENTIAL_KEYS.map((key) => [key, profile[key]]));
  if (CREDENTIAL_KEYS.some((key) => typeof result[key] !== "string" || !result[key].trim())) throw new Error(".env.smoke.local must define the E2E email and password.");
  return Object.freeze(result);
}

function redact(output) { return CREDENTIAL_KEYS.reduce((value, key) => credentials[key] ? value.split(credentials[key]).join("[redacted]") : value, output ?? ""); }

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return result.stdout;
}

function runOptional(command, args) { const result = spawnSync(command, args, { encoding: "utf8" }); if (result.error) throw result.error; }

function runMaestro(flow, smokeCredentials, trackId) {
  const vars = trackId ? ["-e", `TRACK_ID=${trackId}`] : [];
  const credentialArgs = smokeCredentials ? CREDENTIAL_KEYS.flatMap((key) => ["-e", `${key}=${smokeCredentials[key]}`]) : [];
  const result = spawnSync("maestro", ["test", "--udid", UDID, "--test-output-dir", outputDirectory, ...credentialArgs, ...vars, flow], { encoding: "utf8", env: { ...process.env, ...smokeCredentials } });
  if (result.error) throw new Error("Maestro could not start an AUD-02C flow.");
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  if (result.status !== 0) throw new Error(`maestro test ${flow} failed with exit code ${result.status ?? 1}.`);
}
