import { existsSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const APP_ID = "com.lkurczab.patternly";
const APP_ACTIVITY = `${APP_ID}/.MainActivity`;
const DEV_MENU_FLOW = ".maestro/rc-runtime-dev-menu-continue.yaml";
const CONTENT_READY_FLOW = ".maestro/rc-runtime-content-ready.yaml";
const BOOTSTRAP_FLOW = ".maestro/rc-algorithms-bootstrap.yaml";

const [serialFlag, serial, flowFlag, flow] = process.argv.slice(2);
if (serialFlag !== "--serial" || !/^emulator-[0-9]+$/.test(serial ?? "") || flowFlag !== "--flow" || !validFlow(flow)) throw new Error("Usage: ANDROID_HOME=<sdk> PATTERNLY_DEV_CLIENT_URL=<local dev-client URL> node scripts/runRcAlgorithmsAndroid.mjs --serial <ANDROID_EMULATOR_SERIAL> --flow <.maestro/flow.yaml>");
const sdkRoot = required("ANDROID_HOME"); const adb = resolve(sdkRoot, "platform-tools", "adb"); if (!existsSync(adb)) throw new Error(`ADB does not exist at ${adb}`);
const devClientUrl = required("PATTERNLY_DEV_CLIENT_URL"); const metroPort = assertLocalDevClientUrl(devClientUrl); const outputDirectory = required("MAESTRO_TEST_OUTPUT_DIR"); mkdirSync(outputDirectory, { recursive: true });
const capturePlatform = required("PLATFORM"); if (capturePlatform !== "android") throw new Error('PLATFORM must be "android" for the RC Algorithms Android runner.');
const captureTheme = required("THEME"); if (!["light", "dark"].includes(captureTheme)) throw new Error('THEME must be "light" or "dark".');
const captureThemeLabel = required("THEME_LABEL");
const captureDeviceProfile = required("DEVICE_PROFILE");
const screenshotRoot = resolve(required("SCREENSHOT_ROOT")); mkdirSync(screenshotRoot, { recursive: true });
const captureEnvironmentArgs = ["-e", `SCREENSHOT_ROOT=${screenshotRoot}`, "-e", `THEME=${captureTheme}`, "-e", `THEME_LABEL=${captureThemeLabel}`, "-e", `DEVICE_PROFILE=${captureDeviceProfile}`, "-e", `PLATFORM=${capturePlatform}`, "-e", `PATTERNLY_DEV_CLIENT_URL=${devClientUrl}`];
for (const requiredFlow of [DEV_MENU_FLOW, CONTENT_READY_FLOW, BOOTSTRAP_FLOW, flow]) if (!existsSync(requiredFlow)) throw new Error(`RC flow is missing: ${requiredFlow}`);
if (run(adb, ["-s", serial, "get-state"]).trim() !== "device") throw new Error(`Android serial ${serial} is not online.`);
run(adb, ["-s", serial, "reverse", `tcp:${metroPort}`, `tcp:${metroPort}`]); run(adb, ["-s", serial, "shell", "pm", "clear", APP_ID]); run(adb, ["-s", serial, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", devClientUrl, "-n", APP_ACTIVITY]);
run("maestro", ["test", "--device", serial, "--test-output-dir", outputDirectory, DEV_MENU_FLOW], { stdio: "inherit" });
run(adb, ["-s", serial, "shell", "am", "start", "-a", "android.intent.action.VIEW", "-d", devClientUrl, "-n", APP_ACTIVITY]);
run("maestro", ["test", "--device", serial, "--test-output-dir", outputDirectory, CONTENT_READY_FLOW], { stdio: "inherit" });
run("maestro", ["test", "--device", serial, "--test-output-dir", outputDirectory, BOOTSTRAP_FLOW], { stdio: "inherit" }); run("maestro", ["test", "--device", serial, "--test-output-dir", outputDirectory, ...captureEnvironmentArgs, flow], { stdio: "inherit" });

function validFlow(value) { return typeof value === "string" && /^\.maestro\/[A-Za-z0-9][A-Za-z0-9._/-]*\.ya?ml$/.test(value) && !value.includes(".."); }
function required(name) { const value = process.env[name]; if (!value) throw new Error(`${name} is required; RC capture does not guess runtime inputs.`); return value; }
function assertLocalDevClientUrl(value) { let launch; try { launch = new URL(value); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must be an absolute dev-client URL."); } if (launch.protocol !== "exp+patternly:" || launch.host !== "expo-development-client") throw new Error("PATTERNLY_DEV_CLIENT_URL must target the current Patternly Expo development client."); const bundle = launch.searchParams.get("url"); let metro; try { metro = new URL(bundle ?? ""); } catch { throw new Error("PATTERNLY_DEV_CLIENT_URL must include a valid Metro bundle URL."); } if (metro.protocol !== "http:" || metro.hostname !== "127.0.0.1" || !/^[0-9]+$/.test(metro.port)) throw new Error("PATTERNLY_DEV_CLIENT_URL must use the explicit local 127.0.0.1 Metro endpoint for emulator capture."); return metro.port; }
function run(command, args, options = {}) { const result = spawnSync(command, args, { encoding: "utf8", ...options }); if (result.error) throw result.error; if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`); return result.stdout; }
