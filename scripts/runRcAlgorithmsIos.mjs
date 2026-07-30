import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";

const APP_ID = "com.lkurczab.patternly";
const RESET_URL = "com.lkurczab.patternly://audit/reset-learning-state";
const LISTENER_FLOW = ".maestro/rc-runtime-audit-listener-ready.yaml";
const RESET_COMPLETE_FLOW = ".maestro/rc-runtime-audit-reset-complete.yaml";
const BOOTSTRAP_FLOW = ".maestro/rc-algorithms-bootstrap.yaml";
const UDID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;

const [udidFlag, udid, flowFlag, flow] = process.argv.slice(2);
if (udidFlag !== "--udid" || !UDID_PATTERN.test(udid ?? "") || flowFlag !== "--flow" || !validFlow(flow)) {
  throw new Error("Usage: PATTERNLY_DEV_CLIENT_URL=<local dev-client URL> node scripts/runRcAlgorithmsIos.mjs --udid <IOS_SIMULATOR_UDID> --flow <.maestro/flow.yaml>");
}

const devClientUrl = required("PATTERNLY_DEV_CLIENT_URL");
assertLocalDevClientUrl(devClientUrl);
const outputDirectory = required("MAESTRO_TEST_OUTPUT_DIR");
mkdirSync(outputDirectory, { recursive: true });
if (!availableBootedSimulator(udid)) throw new Error(`iOS simulator ${udid} is not available and booted.`);
for (const requiredFlow of [LISTENER_FLOW, RESET_COMPLETE_FLOW, BOOTSTRAP_FLOW, flow]) if (!existsSync(requiredFlow)) throw new Error(`RC flow is missing: ${requiredFlow}`);

runOptional("xcrun", ["simctl", "terminate", udid, APP_ID]);
run("xcrun", ["simctl", "openurl", udid, devClientUrl]);
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, LISTENER_FLOW], { stdio: "inherit" });
run("xcrun", ["simctl", "openurl", udid, RESET_URL]);
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, RESET_COMPLETE_FLOW], { stdio: "inherit" });
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, BOOTSTRAP_FLOW], { stdio: "inherit" });
run("maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, flow], { stdio: "inherit" });

function validFlow(value) { return typeof value === "string" && /^\.maestro\/[A-Za-z0-9][A-Za-z0-9._/-]*\.ya?ml$/.test(value) && !value.includes(".."); }
function required(name) { const value = process.env[name]; if (!value) throw new Error(`${name} is required; RC capture does not guess runtime inputs.`); return value; }
function availableBootedSimulator(targetUdid) { const payload = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "--json"])); return Object.values(payload.devices ?? {}).flat().some((device) => device.udid?.toUpperCase() === targetUdid.toUpperCase() && device.state === "Booted"); }
function assertLocalDevClientUrl(value) { let launch; try { launch = new URL(value); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must be an absolute dev-client URL."); } if (launch.protocol !== "exp+patternly:" || launch.host !== "expo-development-client") throw new Error("PATTERNLY_DEV_CLIENT_URL must target the current Patternly Expo development client."); const bundle = launch.searchParams.get("url"); let metro; try { metro = new URL(bundle ?? ""); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must include a valid Metro bundle URL."); } if (metro.protocol !== "http:" || metro.hostname !== "127.0.0.1" || !/^[0-9]+$/.test(metro.port)) throw new Error("PATTERNLY_DEV_CLIENT_URL must use the explicit local 127.0.0.1 Metro endpoint for simulator capture."); }
function run(command, args, options = {}) { const result = spawnSync(command, args, { encoding: "utf8", ...options }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`); return result.stdout; }
function runOptional(command, args) { const result = spawnSync(command, args, { encoding: "utf8" }); if (result.error) throw result.error; }
