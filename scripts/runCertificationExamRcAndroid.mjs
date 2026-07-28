import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const APP_ID = "com.lkurczab.gcpacetrainer";
const APP_ACTIVITY = `${APP_ID}/.MainActivity`;
const DEV_MENU_FLOW = ".maestro/rc-runtime-dev-menu-continue.yaml";
const CONTENT_READY_FLOW = ".maestro/rc-runtime-content-ready.yaml";
const FLOW_PATH = ".maestro/rc-certification-exam-smoke.yaml";

const [flag, serial] = process.argv.slice(2);
if (flag !== "--serial" || !/^emulator-[0-9]+$/.test(serial ?? "")) {
  throw new Error("Usage: PATTERNLY_DEV_CLIENT_URL=<local dev-client URL> node scripts/runCertificationExamRcAndroid.mjs --serial <ANDROID_EMULATOR_SERIAL>");
}

const sdkRoot = process.env.ANDROID_HOME;
if (!sdkRoot) throw new Error("ANDROID_HOME is required; the RC Android runner does not guess an SDK path.");
const adb = resolve(sdkRoot, "platform-tools", "adb");
if (!existsSync(adb)) throw new Error(`ADB does not exist at ${adb}`);

const devClientUrl = process.env.PATTERNLY_DEV_CLIENT_URL;
if (!devClientUrl) throw new Error("PATTERNLY_DEV_CLIENT_URL is required; the RC Android runner does not guess a Metro endpoint.");
const metroPort = parseLocalMetroPort(devClientUrl);
const outputDirectory = process.env.MAESTRO_TEST_OUTPUT_DIR;
if (!outputDirectory) throw new Error("MAESTRO_TEST_OUTPUT_DIR is required; RC screenshots must have an explicit evidence destination.");
mkdirSync(outputDirectory, { recursive: true });
for (const requiredFlow of [DEV_MENU_FLOW, CONTENT_READY_FLOW, FLOW_PATH]) if (!existsSync(requiredFlow)) throw new Error(`RC flow is missing: ${requiredFlow}`);

run(adb, ["devices", "-l"]);
const state = run(adb, ["-s", serial, "get-state"]).trim();
if (state !== "device") throw new Error(`Android serial ${serial} is ${state}; expected device.`);
run(adb, ["-s", serial, "reverse", `tcp:${metroPort}`, `tcp:${metroPort}`]);
run(adb, ["-s", serial, "shell", "pm", "clear", APP_ID]);
run(adb, ["-s", serial, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", devClientUrl, "-n", APP_ACTIVITY]);
run("maestro", ["test", "--device", serial, "--test-output-dir", outputDirectory, DEV_MENU_FLOW], { stdio: "inherit" });
run(adb, ["-s", serial, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", devClientUrl, "-n", APP_ACTIVITY]);
run("maestro", ["test", "--device", serial, "--test-output-dir", outputDirectory, CONTENT_READY_FLOW], { stdio: "inherit" });
run("maestro", ["test", "--device", serial, "--test-output-dir", outputDirectory, FLOW_PATH], { stdio: "inherit" });

function parseLocalMetroPort(value) {
  let launchUrl;
  try { launchUrl = new URL(value); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must be an absolute dev-client URL."); }
  if (launchUrl.protocol !== "exp+gcp-ace-trainer:" || launchUrl.host !== "expo-development-client") {
    throw new Error("PATTERNLY_DEV_CLIENT_URL must target the current Patternly Expo development client.");
  }
  const bundleUrl = launchUrl.searchParams.get("url");
  if (!bundleUrl) throw new Error("PATTERNLY_DEV_CLIENT_URL must include the Metro bundle URL.");
  let metroUrl;
  try { metroUrl = new URL(bundleUrl); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL contains an invalid Metro bundle URL."); }
  if (metroUrl.protocol !== "http:" || metroUrl.hostname !== "127.0.0.1" || !/^[0-9]+$/.test(metroUrl.port)) {
    throw new Error("PATTERNLY_DEV_CLIENT_URL must use the explicit local 127.0.0.1 Metro endpoint for emulator capture.");
  }
  return metroUrl.port;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return result.stdout;
}
