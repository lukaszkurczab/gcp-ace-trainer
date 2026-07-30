import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const APP_ID = "com.lkurczab.patternly";
const RESET_URL = "com.lkurczab.patternly://audit/reset-learning-state";
const LISTENER_FLOW = ".maestro/rc-runtime-audit-listener-ready.yaml";
const RESET_COMPLETE_FLOW = ".maestro/rc-runtime-audit-reset-complete.yaml";
const FLOW_PATH = ".maestro/rc-certification-exam-smoke.yaml";
const UDID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

const [flag, udid] = process.argv.slice(2);
if (flag !== "--udid" || !UDID_PATTERN.test(udid ?? "")) {
  throw new Error("Usage: PATTERNLY_DEV_CLIENT_URL=<local dev-client URL> node scripts/runCertificationExamRcIos.mjs --udid <IOS_SIMULATOR_UDID>");
}

const devClientUrl = process.env.PATTERNLY_DEV_CLIENT_URL;
if (!devClientUrl) throw new Error("PATTERNLY_DEV_CLIENT_URL is required; the RC iOS runner does not guess a Metro endpoint.");
parseLocalMetroUrl(devClientUrl);
const outputDirectory = process.env.MAESTRO_TEST_OUTPUT_DIR;
if (!outputDirectory) throw new Error("MAESTRO_TEST_OUTPUT_DIR is required; RC screenshots must have an explicit evidence destination.");
mkdirSync(outputDirectory, { recursive: true });

const simulator = availableBootedSimulator(udid);
if (!simulator) throw new Error(`iOS simulator ${udid} is not available and booted.`);
for (const requiredFlow of [LISTENER_FLOW, RESET_COMPLETE_FLOW, FLOW_PATH]) if (!existsSync(requiredFlow)) throw new Error(`RC flow is missing: ${requiredFlow}`);

runOptional("xcrun", ["simctl", "terminate", udid, APP_ID]);
run("xcrun", ["simctl", "openurl", udid, devClientUrl]);
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, LISTENER_FLOW], { stdio: "inherit" });
run("xcrun", ["simctl", "openurl", udid, RESET_URL]);
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, RESET_COMPLETE_FLOW], { stdio: "inherit" });
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, FLOW_PATH], { stdio: "inherit" });

function availableBootedSimulator(targetUdid) {
  const payload = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "--json"]));
  return Object.values(payload.devices ?? {}).flat().find((device) => device.udid?.toUpperCase() === targetUdid.toUpperCase() && device.state === "Booted");
}

function parseLocalMetroUrl(value) {
  let launchUrl;
  try { launchUrl = new URL(value); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must be an absolute dev-client URL."); }
  if (launchUrl.protocol !== "exp+patternly:" || launchUrl.host !== "expo-development-client") {
    throw new Error("PATTERNLY_DEV_CLIENT_URL must target the current Patternly Expo development client.");
  }
  const bundleUrl = launchUrl.searchParams.get("url");
  if (!bundleUrl) throw new Error("PATTERNLY_DEV_CLIENT_URL must include the Metro bundle URL.");
  let metroUrl;
  try { metroUrl = new URL(bundleUrl); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL contains an invalid Metro bundle URL."); }
  if (metroUrl.protocol !== "http:" || metroUrl.hostname !== "127.0.0.1" || !/^[0-9]+$/.test(metroUrl.port)) {
    throw new Error("PATTERNLY_DEV_CLIENT_URL must use the explicit local 127.0.0.1 Metro endpoint for simulator capture.");
  }
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
