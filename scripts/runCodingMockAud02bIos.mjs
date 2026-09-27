import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { parseDotenv } from "./runLocalProfile.mjs";
import { waitForContentPreparationState } from "./waitForContentPreparationState.mjs";

const APP_ID = "com.lkurczab.patternly";
const EXPECTED_UDID = "7F315654-3175-4F3C-BB24-B0263F59360C";
const RESET_URL = "com.lkurczab.patternly://audit/reset-learning-state";
const EXPIRE_URL = "com.lkurczab.patternly://audit/coding-mock/expire";
const RESET_COMPLETE_FLOW = ".maestro/rc-runtime-audit-reset-complete.yaml";
const AUTH_PREFLIGHT_FLOW = ".maestro/rc-auth-preflight.yaml";
const FREE_FLOW = ".maestro/aud02b-coding-mock-free.yaml";
const PREMIUM_FLOW = ".maestro/aud02b-coding-mock-premium.yaml";
const EXPIRY_FLOW = ".maestro/aud02b-coding-mock-expiry.yaml";
const EXPIRY_RESULT_FLOW = ".maestro/aud02b-coding-mock-expiry-result.yaml";
const CREDENTIAL_KEYS = Object.freeze(["EXPO_PUBLIC_PATTERNLY_E2E_EMAIL", "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD"]);
const BACKEND_ORIGIN = "http://127.0.0.1:8080";
const BACKEND_DIRECTORY = "../patternly-backend";
const BACKEND_ENVIRONMENT = Object.freeze({
  FIREBASE_PROJECT_ID: "patternly-app-sandbox",
  FIREBASE_AUTH_EMULATOR_HOST: "127.0.0.1:19099",
  FIRESTORE_EMULATOR_HOST: "127.0.0.1:18081",
});
const BACKEND_READY_TIMEOUT_MS = 60_000;

const [flag, udid] = process.argv.slice(2);
if (flag !== "--udid" || udid?.toUpperCase() !== EXPECTED_UDID) {
  throw new Error(`Usage: PATTERNLY_DEV_CLIENT_URL=<local dev-client URL> MAESTRO_TEST_OUTPUT_DIR=<evidence directory> node scripts/runCodingMockAud02bIos.mjs --udid ${EXPECTED_UDID}`);
}

await assertPortAvailable();

const devClientUrl = required("PATTERNLY_DEV_CLIENT_URL");
validateDevClientUrl(devClientUrl);
const outputDirectory = required("MAESTRO_TEST_OUTPUT_DIR");
mkdirSync(outputDirectory, { recursive: true });
const simulator = availableBootedSimulator(udid);
if (!simulator || simulator.name !== "iPhone 17" || simulator.deviceTypeIdentifier !== "com.apple.CoreSimulator.SimDeviceType.iPhone-17") {
  throw new Error(`Required iPhone 17 simulator ${EXPECTED_UDID} must be available and booted.`);
}
run("xcrun", ["simctl", "get_app_container", udid, APP_ID, "app"]);
for (const flow of [AUTH_PREFLIGHT_FLOW, RESET_COMPLETE_FLOW, FREE_FLOW, PREMIUM_FLOW, EXPIRY_FLOW, EXPIRY_RESULT_FLOW]) {
  if (!existsSync(flow)) throw new Error(`AUD-02B flow is missing: ${flow}`);
}
const credentials = loadSmokeCredentials();

let backendProcess;
try {
  backendProcess = startBackend("expired");
  await waitForBackendReady(backendProcess);

  runOptional("xcrun", ["simctl", "terminate", udid, APP_ID]);
  run("xcrun", ["simctl", "openurl", udid, devClientUrl]);
  runMaestro(AUTH_PREFLIGHT_FLOW, credentials);
  run("xcrun", ["simctl", "launch", udid, APP_ID]);
  await waitForContentPreparationState();

  await resetLearningState();
  runMaestro(AUTH_PREFLIGHT_FLOW, credentials);
  runMaestro(FREE_FLOW, credentials);

  await stopBackend(backendProcess);
  backendProcess = undefined;
  await waitForPortAvailable();

  backendProcess = startBackend("active");
  await waitForBackendReady(backendProcess);
  await resetLearningState();
  runMaestro(AUTH_PREFLIGHT_FLOW, credentials);
  runMaestro(PREMIUM_FLOW);

  await resetLearningState();
  runMaestro(AUTH_PREFLIGHT_FLOW, credentials);
  runMaestro(EXPIRY_FLOW);
  run("xcrun", ["simctl", "openurl", udid, EXPIRE_URL]);
  runMaestro(EXPIRY_RESULT_FLOW);
} finally {
  if (backendProcess) {
    await stopBackend(backendProcess);
    await waitForPortAvailable();
  }
}

async function assertPortAvailable() {
  try { await probePort(); }
  catch { throw new Error("AUD-02B requires 127.0.0.1:8080 to be free at startup; no existing process was stopped."); }
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
  do {
    try { await probePort(); return; } catch { await delay(100); }
  } while (Date.now() < deadline);
  throw new Error("AUD-02B backend stopped, but 127.0.0.1:8080 did not become available.");
}

function startBackend(entitlementState) {
  const child = spawn("npm", ["run", "dev:smoke"], {
    cwd: BACKEND_DIRECTORY,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      PATH: process.env.PATH,
      HOME: process.env.HOME,
      ...BACKEND_ENVIRONMENT,
      PATTERNLY_LOCAL_SMOKE_ENTITLEMENT_STATE: entitlementState,
    },
  });
  const redact = (output) => CREDENTIAL_KEYS.reduce((sanitized, key) => {
    const secret = credentials[key];
    return secret ? sanitized.split(secret).join("[redacted]") : sanitized;
  }, output);
  for (const stream of [child.stdout, child.stderr]) stream.setEncoding("utf8").on("data", (chunk) => process.stdout.write(redact(chunk)));
  child.once("error", (error) => { child.spawnError = error; });
  return child;
}

async function waitForBackendReady(child) {
  const deadline = Date.now() + BACKEND_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.spawnError) throw new Error("Could not start the local AUD-02B backend with npm.");
    if (child.exitCode !== null || child.signalCode !== null) throw new Error("Local AUD-02B backend exited before readiness.");
    try {
      const response = await fetch(new URL("/ready", BACKEND_ORIGIN), { signal: AbortSignal.timeout(1_000) });
      const body = await response.json();
      if (response.ok && body?.status === "ready" && ["database", "authentication", "providerReader"].every((key) => body.checks?.[key] === true)) return;
    } catch { /* Retry while the local service starts. */ }
    await delay(200);
  }
  throw new Error(`Local AUD-02B backend did not become ready within ${BACKEND_READY_TIMEOUT_MS}ms.`);
}

async function stopBackend(child) {
  if (process.platform === "win32") {
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  } else if (child.pid !== undefined) {
    try { process.kill(-child.pid, "SIGTERM"); }
    catch (error) { if (error?.code !== "ESRCH") throw error; }
  }
  if (child.exitCode === null && child.signalCode === null) {
    await Promise.race([
      new Promise((resolveExit) => child.once("exit", resolveExit)),
      delay(5_000),
    ]);
  }
  try {
    if (process.platform === "win32") {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    } else if (child.pid !== undefined) {
      process.kill(-child.pid, 0);
      process.kill(-child.pid, "SIGKILL");
    }
  } catch (error) { if (error?.code !== "ESRCH") throw error; }
}

async function resetLearningState() {
  run("xcrun", ["simctl", "openurl", udid, RESET_URL]);
  runMaestro(RESET_COMPLETE_FLOW);
}

function availableBootedSimulator(targetUdid) {
  const payload = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "--json"]));
  return Object.values(payload.devices ?? {}).flat().find((device) => device.udid?.toUpperCase() === targetUdid.toUpperCase() && device.state === "Booted");
}

function validateDevClientUrl(value) {
  let launchUrl;
  try { launchUrl = new URL(value); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must be an absolute dev-client URL."); }
  if (launchUrl.protocol !== "exp+patternly:" || launchUrl.host !== "expo-development-client") throw new Error("PATTERNLY_DEV_CLIENT_URL must target the current Patternly Expo development client.");
  let metroUrl;
  try { metroUrl = new URL(launchUrl.searchParams.get("url") ?? ""); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must include a valid Metro bundle URL."); }
  if (metroUrl.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(metroUrl.hostname) || !/^[0-9]+$/.test(metroUrl.port)) {
    throw new Error("PATTERNLY_DEV_CLIENT_URL must use an explicit local 127.0.0.1 or [::1] Metro endpoint.");
  }
}

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required; AUD-02B does not guess runtime inputs.`);
  return value;
}

function loadSmokeCredentials() {
  let profile;
  try { profile = parseDotenv(readFileSync(".env.smoke.local", "utf8")); }
  catch { throw new Error("Cannot load the local smoke account from .env.smoke.local."); }
  const credentials = Object.fromEntries(CREDENTIAL_KEYS.map((key) => [key, profile[key]]));
  if (CREDENTIAL_KEYS.some((key) => typeof credentials[key] !== "string" || credentials[key].trim() === "")) {
    throw new Error(".env.smoke.local must define EXPO_PUBLIC_PATTERNLY_E2E_EMAIL and EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD.");
  }
  return Object.freeze(credentials);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return result.stdout;
}

function runOptional(command, args) {
  const result = spawnSync(command, args, { encoding: "utf8" });
  if (result.error) throw result.error;
}

function runMaestro(flowPath, smokeCredentials) {
  const credentialArgs = smokeCredentials ? CREDENTIAL_KEYS.flatMap((key) => ["-e", `${key}=${smokeCredentials[key]}`]) : [];
  const result = spawnSync("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, ...credentialArgs, flowPath], {
    encoding: "utf8",
    env: { ...process.env, ...smokeCredentials },
  });
  if (result.error) throw new Error("Maestro could not start an AUD-02B flow.");
  const redact = (output) => CREDENTIAL_KEYS.reduce((sanitized, key) => sanitized.split(credentials[key]).join("[redacted]"), output ?? "");
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  if (result.status !== 0) throw new Error(`maestro test ${flowPath} failed with exit code ${result.status ?? 1}.`);
}
