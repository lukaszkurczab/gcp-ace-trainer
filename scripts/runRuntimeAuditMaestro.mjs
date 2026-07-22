import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

const [flowArgument] = process.argv.slice(2);
if (!flowArgument) throw new Error("Usage: MAESTRO_DEVICE_UDID=<simulator-udid> node scripts/runRuntimeAuditMaestro.mjs <flow.yaml>");

const flow = resolve(flowArgument);
if (!existsSync(flow)) throw new Error(`Maestro flow does not exist: ${flow}`);

const device = process.env.MAESTRO_DEVICE_UDID;
if (!device) throw new Error("MAESTRO_DEVICE_UDID is required; the runtime audit must name its iOS target explicitly.");

const appId = "com.lkurczab.gcpacetrainer";
const devClientUrl = process.env.MAESTRO_DEV_CLIENT_URL ?? "com.lkurczab.gcpacetrainer://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081";
const resetUrl = "com.lkurczab.gcpacetrainer://audit/reset-learning-state";
const listenerId = "patternly:content:audit-command-listener:ready";
const resetReadyId = "patternly:content:ready:1";

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}: ${result.stderr}`);
  return result.stdout;
}

function hierarchyResourceIds() {
  const output = run("maestro", ["hierarchy"]);
  const root = JSON.parse(output);
  const ids = new Set();
  const visit = (node) => {
    const id = node?.attributes?.["resource-id"];
    if (typeof id === "string" && id) ids.add(id);
    for (const child of node?.children ?? []) visit(child);
  };
  visit(root);
  return ids;
}

async function waitForResourceId(resourceId) {
  const deadline = Date.now() + 30_000;
  let lastError = "resource id was absent";
  while (Date.now() < deadline) {
    try {
      if (hierarchyResourceIds().has(resourceId)) return;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
  }
  throw new Error(`Timed out waiting for ${resourceId}: ${lastError}`);
}

const termination = spawnSync("xcrun", ["simctl", "terminate", device, appId], { encoding: "utf8", stdio: "ignore" });
if (termination.error) throw termination.error;
run("xcrun", ["simctl", "openurl", device, devClientUrl]);
await waitForResourceId(listenerId);
run("xcrun", ["simctl", "openurl", device, resetUrl]);
await waitForResourceId(resetReadyId);

const maestroArgs = ["test", "--device", device];
if (process.env.MAESTRO_DEBUG_OUTPUT) maestroArgs.push("--debug-output", process.env.MAESTRO_DEBUG_OUTPUT);
if (process.env.MAESTRO_TEST_OUTPUT_DIR) maestroArgs.push("--test-output-dir", process.env.MAESTRO_TEST_OUTPUT_DIR);
maestroArgs.push(flow);
run("maestro", maestroArgs, { stdio: "inherit" });
