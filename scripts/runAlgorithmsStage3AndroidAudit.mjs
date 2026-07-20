import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import net from "node:net";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import {
  canonicalAuditProvenancePaths,
  computeCanonicalAuditSourceSha256,
} from "./auditRenderProvenance.mjs";

const CONFIG_PATH = ".audit/ux-ui/android.audit.config.json";
const RUNNER_PATH = "scripts/runAlgorithmsStage3AndroidAudit.mjs";
const STATE_SLUGS = Object.freeze([
  ["P-01", "preparing"],
  ["P-02", "unanswered"],
  ["P-03", "submitting-before-journal"],
  ["P-04", "submit-journal-failed"],
  ["P-05", "commit-pending"],
  ["P-06", "commit-materialization-failed"],
  ["P-07", "feedback-correct"],
  ["P-08", "feedback-partial-long-details"],
  ["P-09", "advancing"],
  ["P-10", "advance-failed"],
  ["P-11", "completed"],
  ["P-12", "leave-confirmation"],
  ["P-13", "abandon-confirmation"],
  ["P-14", "abandoning"],
  ["P-15", "abandonment-failed"],
  ["S-01", "preparing"],
  ["S-02", "insufficient-content"],
  ["S-03", "editable-choice"],
  ["S-04", "editable-unsaved"],
  ["S-05", "saving"],
  ["S-06", "editable-saved"],
  ["S-07", "save-failed"],
  ["S-08", "stale-revision"],
  ["S-09", "navigator-inventory"],
  ["S-10", "navigator-mixed"],
  ["S-11", "finish-confirmation"],
  ["S-12", "leave-confirmation"],
  ["S-13", "abandon-confirmation"],
  ["S-14", "abandoning"],
  ["S-15", "abandonment-failed"],
  ["S-16", "expired"],
  ["S-17", "frozen"],
  ["S-18", "finalization-journal-pending"],
  ["S-19", "finalization-journal-failed"],
  ["S-20", "materializing"],
  ["S-21", "materialization-failed"],
  ["S-22", "verification-failed"],
  ["S-23", "recovery-required"],
  ["S-24", "recovered-finalizing"],
  ["S-25", "timer-recovery-failed"],
  ["S-26", "missing-draft"],
  ["S-27", "version-mismatch"],
  ["S-28", "corrupt-state"],
  ["S-29", "completed"],
].map((entry) => Object.freeze(entry)));

export const EXPECTED_ANDROID_STATES = Object.freeze(STATE_SLUGS.map(([stateId, slug]) => Object.freeze({
  stateId,
  stateUri: `exp+patternly-algorithms-audit://audit?auditState=${stateId}`,
  flowPath: `.audit/ux-ui/maestro/flows/algorithms-stage3-android-states/${stateId.toLowerCase()}.yaml`,
  screenshotName: `algorithms-stage3__${stateId.toLowerCase()}__${slug}__android-regular`,
})));

export function parseRunnerArgs(args) {
  if (args.length !== 2 || args[0] !== "--serial") {
    throw new Error("Usage: node scripts/runAlgorithmsStage3AndroidAudit.mjs --serial <ANDROID_EMULATOR_SERIAL>");
  }
  if (!/^emulator-[0-9]+$/.test(args[1])) throw new Error(`Invalid Android emulator serial: ${args[1]}`);
  return Object.freeze({ serial: args[1] });
}

export function parseGitStatusPorcelainZ(rawStatus) {
  if (typeof rawStatus !== "string") throw new Error("git status --porcelain=v1 -z output must be a string");
  return Object.freeze(rawStatus.split("\0").filter((entry) => entry.length > 0));
}

export function parseAdbDevices(raw) {
  if (typeof raw !== "string") throw new Error("adb devices output must be a string");
  return Object.freeze(raw.split(/\r?\n/).slice(1).filter(Boolean).map((line) => {
    const [serial, state] = line.trim().split(/\s+/, 3);
    return Object.freeze({ serial, state });
  }));
}

export function selectOnlineDevice(raw, serial) {
  const device = parseAdbDevices(raw).find((entry) => entry.serial === serial);
  if (!device) throw new Error(`Android serial ${serial} is not attached`);
  if (device.state !== "device") throw new Error(`Android serial ${serial} is ${device.state}; expected device`);
  return device;
}

export function pngDimensions(bytes) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" || bytes.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error("Screenshot is not a valid PNG with an IHDR header");
  }
  return Object.freeze({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
}

export function validateAndroidConfig(root, config) {
  const errors = [];
  const expectedScalars = {
    schemaVersion: 1,
    auditId: "algorithms-stage3-visual-harness-v1",
    platform: "android",
    appId: "com.lkurczab.gcpacetrainer",
    requiredAvdName: "Medium_Phone",
    metroPort: 8082,
    appActivity: "com.lkurczab.gcpacetrainer/.MainActivity",
    hostLaunchUri: "exp+patternly-algorithms-audit://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8082",
    debugApk: "android/app/build/outputs/apk/debug/app-debug.apk",
    bootstrapFlow: ".audit/ux-ui/maestro/flows/algorithms-stage3-android-bootstrap.yaml",
    statesDirectory: ".audit/ux-ui/maestro/flows/algorithms-stage3-android-states",
    manifestPath: "audit/algorithms-ui/s3-android-capture-manifest.json",
    outputDirectory: "docs/audits/ux-ui/algorithms-stage3-visual-harness-v1/maestro/android",
  };
  for (const [key, value] of Object.entries(expectedScalars)) if (config[key] !== value) errors.push(`${key} must be ${value}`);
  for (const retiredKey of ["stateLaunchUri", "captureFlow", "screenshotName"]) {
    if (Object.hasOwn(config, retiredKey)) errors.push(`retired single-state key ${retiredKey} must not exist`);
  }
  const bootstrapPath = path.join(root, config.bootstrapFlow ?? "");
  if (!existsSync(bootstrapPath)) {
    errors.push(`required file is missing: ${config.bootstrapFlow}`);
  } else {
    const bootstrapBody = readFileSync(bootstrapPath, "utf8").split(/^---$/m)[1]?.trim();
    const expectedBootstrapBody = [
      "- extendedWaitUntil:",
      "    visible: { id: \"algorithms-audit-current-P-01\" }",
      "    timeout: 30000",
    ].join("\n");
    if (bootstrapBody !== expectedBootstrapBody) errors.push("Android bootstrap must contain only the exact P-01 readiness selector");
  }

  if (!Array.isArray(config.states)) {
    errors.push("states must be an array");
  } else {
    if (config.states.length !== EXPECTED_ANDROID_STATES.length) errors.push(`config must contain exactly 44 Android states; got ${config.states.length}`);
    const stateIds = config.states.map((entry) => entry?.stateId);
    const flowPaths = config.states.map((entry) => entry?.flowPath);
    const screenshotNames = config.states.map((entry) => entry?.screenshotName);
    if (new Set(stateIds).size !== EXPECTED_ANDROID_STATES.length) errors.push("Android state IDs must be unique");
    if (new Set(flowPaths).size !== EXPECTED_ANDROID_STATES.length) errors.push("Android flow paths must be unique");
    if (new Set(screenshotNames).size !== EXPECTED_ANDROID_STATES.length) errors.push("Android screenshot names must be unique");
    for (const [index, expected] of EXPECTED_ANDROID_STATES.entries()) {
      const actual = config.states[index];
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        errors.push(`states[${index}] must be the exact canonical entry for ${expected.stateId}`);
        continue;
      }
      const absoluteFlow = path.join(root, actual.flowPath);
      if (!existsSync(absoluteFlow)) {
        errors.push(`required Android state flow is missing: ${actual.flowPath}`);
        continue;
      }
      const expectedSource = [
        "appId: com.lkurczab.gcpacetrainer",
        `name: Algorithms Stage 3 Android state ${actual.stateId}`,
        "tags: [ux-ui-audit, algorithms-stage3, android-state]",
        "---",
        "- extendedWaitUntil:",
        `    visible: { id: "algorithms-audit-current-${actual.stateId}" }`,
        "    timeout: 20000",
        `- takeScreenshot: "${actual.screenshotName}"`,
        "",
      ].join("\n");
      if (readFileSync(absoluteFlow, "utf8") !== expectedSource) errors.push(`${actual.flowPath} has non-canonical commands or metadata`);
    }
  }

  const statesDirectory = path.join(root, config.statesDirectory ?? "");
  if (!existsSync(statesDirectory)) {
    errors.push(`Android states directory is missing: ${config.statesDirectory}`);
  } else {
    const actualInventory = readdirSync(statesDirectory).filter((name) => name.endsWith(".yaml")).sort();
    const expectedInventory = EXPECTED_ANDROID_STATES.map((entry) => path.basename(entry.flowPath)).sort();
    if (JSON.stringify(actualInventory) !== JSON.stringify(expectedInventory)) errors.push("Android state-flow directory must contain exactly the 44 canonical YAML files");
  }
  if (existsSync(path.join(root, ".audit/ux-ui/maestro/flows/algorithms-stage3-harness.android.yaml"))) errors.push("obsolete single-state Android harness still exists");
  if (existsSync(path.join(root, "audit/algorithms-ui/s3-android-p01-capture-manifest.json"))) errors.push("obsolete single-state Android manifest still exists");
  if (errors.length) throw new Error(`Invalid Android audit config:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  return config;
}

export function readAndroidConfig(root) {
  let config;
  try {
    config = JSON.parse(readFileSync(path.join(root, CONFIG_PATH), "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${CONFIG_PATH}: ${error.message}`);
  }
  return validateAndroidConfig(root, config);
}

export function canonicalAndroidCaptureEntries(root, config) {
  validateAndroidConfig(root, config);
  return Object.freeze(config.states.map((entry) => Object.freeze({ ...entry })));
}

function androidPlatformSourcePaths(config) {
  return Object.freeze([
    CONFIG_PATH,
    RUNNER_PATH,
    "package.json",
    config.bootstrapFlow,
    ...config.states.map((entry) => entry.flowPath),
  ]);
}

export function canonicalAndroidSourcePaths(root, config) {
  return canonicalAuditProvenancePaths(root, androidPlatformSourcePaths(config));
}

export function computeAndroidSourceSha256(root, config) {
  return computeCanonicalAuditSourceSha256(root, androidPlatformSourcePaths(config));
}

export function captureAndroidStates(root, adb, serial, config, stagingRoot, dependencies = {}) {
  const launch = dependencies.launch ?? launchExplicitActivity;
  const capture = dependencies.capture ?? runMaestro;
  for (const [index, entry] of config.states.entries()) {
    console.log(`[${index + 1}/${config.states.length}] ${entry.stateId} via ${entry.flowPath}`);
    launch(adb, serial, config.appActivity, entry.stateUri);
    capture(root, serial, entry.flowPath, stagingRoot);
  }
}

export async function run(args, root = process.cwd()) {
  const { serial } = parseRunnerArgs(args);
  const config = readAndroidConfig(root);
  const adb = resolveAdbPath();
  const device = readDevice(root, adb, serial, config);
  await assertPortUnused(config.metroPort);
  const metro = startMetro(root, config.metroPort);
  try {
    await waitForMetro(metro, config.metroPort);
    launchExplicitActivity(adb, serial, config.appActivity, config.hostLaunchUri);
    runMaestro(root, serial, config.bootstrapFlow, null);
    const outputRoot = path.join(root, config.outputDirectory);
    mkdirSync(outputRoot, { recursive: true });
    const stagingRoot = mkdtempSync(path.join(outputRoot, ".capture-"));
    try {
      const startedAt = new Date();
      captureAndroidStates(root, adb, serial, config, stagingRoot);
      const completedAt = new Date();
      const stagedScreenshots = path.join(stagingRoot, "screenshots");
      const manifest = buildAndroidManifest({
        root,
        config,
        device,
        screenshotDirectory: stagedScreenshots,
        startedAt,
        completedAt,
      });
      publishAndroidEvidence(root, config, stagedScreenshots, manifest);
      console.log(`Android packet captured ${config.states.length}/${config.states.length} on ${serial}; visual review remains pending`);
      console.log(`Manifest: ${config.manifestPath}`);
      return 0;
    } finally {
      rmSync(stagingRoot, { force: true, recursive: true });
    }
  } finally {
    metro.kill("SIGTERM");
  }
}

function resolveAdbPath() {
  const sdkRoot = process.env.ANDROID_HOME;
  if (!sdkRoot) throw new Error("ANDROID_HOME is required; no SDK path fallback is allowed");
  const adb = path.join(sdkRoot, "platform-tools", "adb");
  if (!existsSync(adb)) throw new Error(`ADB does not exist at ANDROID_HOME path: ${adb}`);
  return adb;
}

function adbText(adb, serial, args, allowEmpty = false) {
  const result = spawnSync(adb, ["-s", serial, ...args], { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`adb -s ${serial} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  const value = result.stdout.trim();
  if (!allowEmpty && !value) throw new Error(`adb -s ${serial} ${args.join(" ")} returned empty output`);
  return value;
}

function readDevice(root, adb, serial, config) {
  const localApkPath = path.join(root, config.debugApk);
  if (!existsSync(localApkPath)) {
    throw new Error(`Canonical Android debug APK is missing: ${config.debugApk}; build it before native capture`);
  }
  const devices = spawnSync(adb, ["devices", "-l"], { encoding: "utf8" });
  if (devices.status !== 0) throw new Error(`Could not enumerate ADB devices: ${(devices.stderr || devices.stdout || "unknown error").trim()}`);
  selectOnlineDevice(devices.stdout, serial);
  const bootCompleted = adbText(adb, serial, ["shell", "getprop", "sys.boot_completed"], true);
  if (bootCompleted !== "1") throw new Error(`Android serial ${serial} has sys.boot_completed=${JSON.stringify(bootCompleted)}; expected 1`);
  const avdName = adbText(adb, serial, ["shell", "getprop", "ro.boot.qemu.avd_name"]);
  if (avdName !== config.requiredAvdName) throw new Error(`Android serial ${serial} is AVD ${avdName}; expected ${config.requiredAvdName}`);
  const installedPathOutput = adbText(adb, serial, ["shell", "pm", "path", config.appId]);
  const installedApkPath = installedPathOutput.match(/^package:(.+)$/)?.[1];
  if (!installedApkPath) throw new Error(`Installed package path is invalid for ${config.appId}: ${installedPathOutput}`);
  const packageDump = adbText(adb, serial, ["shell", "dumpsys", "package", config.appId]);
  const versionName = packageDump.match(/versionName=([^\s]+)/)?.[1];
  const versionCode = packageDump.match(/versionCode=([0-9]+)/)?.[1];
  if (!versionName || !versionCode) throw new Error(`Could not read exact installed package identity for ${config.appId}`);
  const screenSize = adbText(adb, serial, ["shell", "wm", "size"]).match(/Physical size: ([0-9]+x[0-9]+)/)?.[1];
  const density = adbText(adb, serial, ["shell", "wm", "density"]).match(/Physical density: ([0-9]+)/)?.[1];
  if (!screenSize || !density) throw new Error("Could not read physical Android resolution and density");
  const installedApkSha256 = adbText(adb, serial, ["shell", "sha256sum", installedApkPath]).match(/^([0-9a-f]{64})\s/)?.[1];
  if (!installedApkSha256) throw new Error("Could not read installed APK SHA-256 for identity verification");
  const localApkSha256 = sha256(readFileSync(localApkPath));
  if (installedApkSha256 !== localApkSha256) throw new Error("Installed APK does not match the canonical local debug APK; rebuild/install it before capture");
  return Object.freeze({
    serial,
    state: "device",
    avdName,
    apiLevel: adbText(adb, serial, ["shell", "getprop", "ro.build.version.sdk"]),
    model: adbText(adb, serial, ["shell", "getprop", "ro.product.model"]),
    screenSize,
    density: Number(density),
    locale: setting(adbText(adb, serial, ["shell", "getprop", "persist.sys.locale"], true)),
    fontScale: setting(adbText(adb, serial, ["shell", "settings", "get", "system", "font_scale"], true)),
    animatorDurationScale: setting(adbText(adb, serial, ["shell", "settings", "get", "global", "animator_duration_scale"], true)),
    transitionAnimationScale: setting(adbText(adb, serial, ["shell", "settings", "get", "global", "transition_animation_scale"], true)),
    windowAnimationScale: setting(adbText(adb, serial, ["shell", "settings", "get", "global", "window_animation_scale"], true)),
    enabledAccessibilityServices: setting(adbText(adb, serial, ["shell", "settings", "get", "secure", "enabled_accessibility_services"], true)),
    app: Object.freeze({ appId: config.appId, versionName, versionCode: Number(versionCode), installedApkPath, installedApkSha256 }),
  });
}

function launchExplicitActivity(adb, serial, component, uri) {
  const result = adbText(adb, serial, ["shell", "am", "start", "-W", "-n", component, "-a", "android.intent.action.VIEW", "-d", uri]);
  if (!result.includes("Status: ok") || !result.includes(`Activity: ${component}`)) {
    throw new Error(`Explicit Android audit launch did not start ${component}: ${result}`);
  }
}

function setting(value) {
  return value && value !== "null" ? Object.freeze({ status: "recorded", rawValue: value }) : Object.freeze({ status: "not_set", rawValue: null });
}

function startMetro(root, port) {
  const cli = path.join(root, "node_modules/expo/bin/cli");
  const child = spawn(process.execPath, [cli, "start", "--dev-client", "--port", String(port), "--scheme", "exp+patternly-algorithms-audit"], {
    cwd: path.join(root, "audit/algorithms-ui"),
    env: { ...process.env, CI: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", (chunk) => process.stdout.write(chunk));
  child.stderr.on("data", (chunk) => process.stderr.write(chunk));
  return child;
}

async function waitForMetro(child, port) {
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Metro audit host exited before readiness with code ${child.exitCode}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}/status`);
      if (response.ok && (await response.text()).trim() === "packager-status:running") return;
    } catch {
      // The single owned host has not reached readiness yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Metro audit host did not become ready on exact port ${port}`);
}

async function assertPortUnused(port) {
  const listening = await new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port });
    socket.once("connect", () => { socket.destroy(); resolve(true); });
    socket.once("error", () => resolve(false));
  });
  if (listening) throw new Error(`Port ${port} is already in use; refusing an unowned Metro host`);
}

function runMaestro(root, serial, flowPath, outputDirectory) {
  const args = ["test", "--udid", serial, "--flatten-debug-output", "--no-ansi"];
  if (outputDirectory) args.push("--test-output-dir", outputDirectory);
  args.push(flowPath);
  const result = spawnSync("maestro", args, { cwd: root, stdio: "inherit", timeout: 120000, killSignal: "SIGTERM" });
  if (result.status !== 0) throw new Error(`Maestro flow ${flowPath} failed with ${result.status ?? result.signal ?? "timeout"}; no evidence was published`);
}

export function buildAndroidManifest({ root, config, device, screenshotDirectory, startedAt, completedAt }) {
  const screenshots = config.states.map((entry) => {
    const screenshotPath = path.join(screenshotDirectory, `${entry.screenshotName}.png`);
    if (!statSync(screenshotPath).isFile()) throw new Error(`Expected Android screenshot is missing: ${screenshotPath}`);
    const bytes = readFileSync(screenshotPath);
    return Object.freeze({
      stateId: entry.stateId,
      stateUri: entry.stateUri,
      flowPath: entry.flowPath,
      screenshotPath: `${config.outputDirectory}/screenshots/${entry.screenshotName}.png`,
      sha256: sha256(bytes),
      ...pngDimensions(bytes),
    });
  });
  if (new Set(screenshots.map((entry) => entry.sha256)).size !== screenshots.length) {
    throw new Error("Android capture produced duplicate screenshot bytes for different states");
  }
  return Object.freeze({
    schemaVersion: 1,
    auditId: config.auditId,
    status: "captured_visual_review_pending",
    visualReview: Object.freeze({ approvedPacketComparison: "pending", accepted: false }),
    capture: Object.freeze({
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      runner: RUNNER_PATH,
      commandContract: "ANDROID_HOME=<ANDROID_SDK_ROOT> npm run audit:ux-ui:android -- --serial <ANDROID_EMULATOR_SERIAL>",
      bootstrapFlow: config.bootstrapFlow,
      bootstrapProcessCount: 1,
      serialProcessCount: config.states.length,
      explicitComponent: config.appActivity,
      device,
      theme: "dark",
      contentLanguage: "en",
    }),
    source: Object.freeze({
      appRepositoryCommit: commandText("git", ["rev-parse", "HEAD"], root),
      androidAuditSourceSha256: computeAndroidSourceSha256(root, config),
      worktreeStatusFormat: "git status --porcelain=v1 -z",
      worktreeStatus: readWorktreeStatus(root),
      ...readPinnedContentIdentity(root),
    }),
    screenshots: Object.freeze(screenshots),
  });
}

export function publishAndroidEvidence(root, config, stagedScreenshots, manifest, fsOverrides = {}) {
  const fs = {
    exists: existsSync,
    rename: renameSync,
    remove: rmSync,
    write: writeFileSync,
    ...fsOverrides,
  };
  const outputRoot = path.join(root, config.outputDirectory);
  const canonicalScreenshots = path.join(outputRoot, "screenshots");
  const backupScreenshots = path.join(outputRoot, `.screenshots-backup-${process.pid}`);
  const manifestPath = path.join(root, config.manifestPath);
  const backupManifest = `${manifestPath}.backup-${process.pid}`;
  const tempManifest = `${manifestPath}.tmp-${process.pid}`;
  const hasCanonicalScreenshots = fs.exists(canonicalScreenshots);
  const hasCanonicalManifest = fs.exists(manifestPath);
  if (hasCanonicalScreenshots !== hasCanonicalManifest) {
    throw new Error("Refusing Android evidence publication because the canonical manifest and screenshot directory are already mismatched");
  }
  if (fs.exists(backupScreenshots) || fs.exists(backupManifest) || fs.exists(tempManifest)) {
    throw new Error("Refusing Android evidence publication because transaction residue already exists");
  }
  fs.write(tempManifest, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });

  let screensBackedUp = false;
  let manifestBackedUp = false;
  try {
    if (hasCanonicalScreenshots) {
      fs.rename(canonicalScreenshots, backupScreenshots);
      screensBackedUp = true;
      fs.rename(manifestPath, backupManifest);
      manifestBackedUp = true;
    }
  } catch (error) {
    const rollbackErrors = [];
    restoreRenamedPath(fs, manifestBackedUp, backupManifest, manifestPath, rollbackErrors);
    restoreRenamedPath(fs, screensBackedUp, backupScreenshots, canonicalScreenshots, rollbackErrors);
    removePath(fs, tempManifest, rollbackErrors);
    throw publicationError("Could not prepare Android evidence publication", error, rollbackErrors);
  }

  let newScreenshotsPublished = false;
  try {
    fs.rename(stagedScreenshots, canonicalScreenshots);
    newScreenshotsPublished = true;
    fs.rename(tempManifest, manifestPath);
  } catch (error) {
    const rollbackErrors = [];
    removePath(fs, newScreenshotsPublished ? canonicalScreenshots : null, rollbackErrors);
    restoreRenamedPath(fs, manifestBackedUp, backupManifest, manifestPath, rollbackErrors);
    restoreRenamedPath(fs, screensBackedUp, backupScreenshots, canonicalScreenshots, rollbackErrors);
    removePath(fs, tempManifest, rollbackErrors);
    throw publicationError("Could not publish Android evidence pair", error, rollbackErrors);
  }

  const cleanupErrors = [];
  removePath(fs, screensBackedUp ? backupScreenshots : null, cleanupErrors);
  removePath(fs, manifestBackedUp ? backupManifest : null, cleanupErrors);
  if (cleanupErrors.length > 0) {
    throw new Error(`Android evidence pair was committed, but backup cleanup failed; canonical artifacts were not rolled back; transaction residue remains: ${cleanupErrors.join("; ")}`);
  }
}

function restoreRenamedPath(fs, shouldRestore, backupPath, canonicalPath, errors) {
  if (!shouldRestore) return;
  try {
    fs.rename(backupPath, canonicalPath);
  } catch (error) {
    errors.push(`restore ${backupPath} -> ${canonicalPath}: ${error.message}`);
  }
}

function removePath(fs, targetPath, errors) {
  if (!targetPath) return;
  try {
    fs.remove(targetPath, { force: true, recursive: true });
  } catch (error) {
    errors.push(`remove ${targetPath}: ${error.message}`);
  }
}

function publicationError(prefix, cause, rollbackErrors) {
  const rollback = rollbackErrors.length === 0 ? "prior canonical pair restored" : `rollback errors: ${rollbackErrors.join("; ")}`;
  return new Error(`${prefix}: ${cause.message}; ${rollback}`);
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function readWorktreeStatus(root) {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git status --porcelain=v1 -z failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return parseGitStatusPorcelainZ(result.stdout);
}

function readPinnedContentIdentity(root) {
  const source = readFileSync(path.join(root, "src/content/bundled/generatedArtifacts.ts"), "utf8");
  const manifest = source.match(/manifest: Object\.freeze\(\{ envelopeVersion: 1, releaseId: "([^"]+)", sourceRepositoryCommit: "([0-9a-f]{40})" \}\)/);
  const checksums = [...source.matchAll(/"checksumSha256":"([0-9a-f]{64})"/g)];
  if (!manifest || checksums.length !== 1) throw new Error("Pinned bundled content identity is not exact");
  return Object.freeze({ contentReleaseId: manifest[1], contentSourceRepositoryCommit: manifest[2], contentArtifactSha256: checksums[0][1] });
}

function commandText(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  const value = result.stdout.trim();
  if (!value) throw new Error(`${command} ${args.join(" ")} returned empty output`);
  return value;
}

export async function main() {
  try {
    return await run(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = await main();
