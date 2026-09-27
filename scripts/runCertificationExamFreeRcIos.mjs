import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { parseDotenv } from "./runLocalProfile.mjs";
import { waitForContentPreparationState } from "./waitForContentPreparationState.mjs";

const APP_ID = "com.lkurczab.patternly";
const RESET_URL = "com.lkurczab.patternly://audit/reset-learning-state";
const RESET_COMPLETE_FLOW = ".maestro/rc-runtime-audit-reset-complete.yaml";
const AUTH_PREFLIGHT_FLOW = ".maestro/rc-auth-preflight.yaml";
const FLOW_PATH = ".maestro/rc-certification-exam-free.yaml";
const CREDENTIAL_KEYS = Object.freeze(["EXPO_PUBLIC_PATTERNLY_E2E_EMAIL", "EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD"]);
const UDID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

const [flag, udid] = process.argv.slice(2);
if (flag !== "--udid" || !UDID_PATTERN.test(udid ?? "")) {
  throw new Error("Usage: PATTERNLY_DEV_CLIENT_URL=<local dev-client URL> node scripts/runCertificationExamFreeRcIos.mjs --udid <IOS_SIMULATOR_UDID>");
}

const devClientUrl = process.env.PATTERNLY_DEV_CLIENT_URL;
if (!devClientUrl) throw new Error("PATTERNLY_DEV_CLIENT_URL is required; the Free RC iOS runner does not guess a Metro endpoint.");
validateDevClientUrl(devClientUrl);
const outputDirectory = process.env.MAESTRO_TEST_OUTPUT_DIR;
if (!outputDirectory) throw new Error("MAESTRO_TEST_OUTPUT_DIR is required; Free RC screenshots need an explicit evidence destination.");
mkdirSync(outputDirectory, { recursive: true });

const simulator = availableBootedSimulator(udid);
if (!simulator) throw new Error(`iOS simulator ${udid} is not available and booted.`);
for (const flow of [AUTH_PREFLIGHT_FLOW, RESET_COMPLETE_FLOW, FLOW_PATH]) if (!existsSync(flow)) throw new Error(`Free RC flow is missing: ${flow}`);
const credentials = loadFreeSmokeCredentials();

runOptional("xcrun", ["simctl", "terminate", udid, APP_ID]);
run("xcrun", ["simctl", "openurl", udid, devClientUrl]);
runMaestro(AUTH_PREFLIGHT_FLOW, credentials);
await waitForContentPreparationState();
run("xcrun", ["simctl", "openurl", udid, RESET_URL]);
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, RESET_COMPLETE_FLOW], { stdio: "inherit" });
runMaestro(FLOW_PATH, credentials);

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

function loadFreeSmokeCredentials() {
  let profile;
  try { profile = parseDotenv(readFileSync(".env.smoke.local", "utf8")); }
  catch { throw new Error("Cannot load the local smoke account from .env.smoke.local."); }
  const credentials = Object.fromEntries(CREDENTIAL_KEYS.map((key) => [key, profile[key]]));
  if (CREDENTIAL_KEYS.some((key) => typeof credentials[key] !== "string" || credentials[key].trim() === "")) {
    throw new Error(".env.smoke.local must define EXPO_PUBLIC_PATTERNLY_E2E_EMAIL and EXPO_PUBLIC_PATTERNLY_E2E_PASSWORD for the local account.");
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
  const credentialArgs = CREDENTIAL_KEYS.flatMap((key) => ["-e", `${key}=${smokeCredentials[key]}`]);
  const result = spawnSync("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, ...credentialArgs, flowPath], {
    encoding: "utf8",
    env: { ...process.env, ...smokeCredentials },
  });
  if (result.error) throw new Error("Maestro could not start the Free RC flow.");
  const redact = (output) => CREDENTIAL_KEYS.reduce((sanitized, key) => sanitized.split(smokeCredentials[key]).join("[redacted]"), output ?? "");
  process.stdout.write(redact(result.stdout));
  process.stderr.write(redact(result.stderr));
  if (result.status !== 0) throw new Error(`maestro test ${flowPath} failed with exit code ${result.status ?? 1}.`);
}
