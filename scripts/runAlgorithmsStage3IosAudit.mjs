import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

import {
  canonicalIosCaptureEntries,
  collectUxUiAuditConfigErrors,
  readAuditConfig,
} from "./validateUxUiAuditConfig.mjs";
import {
  canonicalAuditProvenancePaths,
  computeCanonicalAuditSourceSha256,
} from "./auditRenderProvenance.mjs";

const UDID_PATTERN = /^[0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12}$/i;
const MANIFEST_PATH = "audit/algorithms-ui/s3-ios-capture-manifest.json";
const CANONICAL_RUNNER_PATH = "scripts/runAlgorithmsStage3IosAudit.mjs";
const CANONICAL_VALIDATOR_PATH = "scripts/validateUxUiAuditConfig.mjs";
const PACKAGE_PATH = "package.json";
function iosPlatformSourcePaths(config, entries) {
  return Object.freeze([
    CANONICAL_RUNNER_PATH,
    CANONICAL_VALIDATOR_PATH,
    PACKAGE_PATH,
    ".audit/ux-ui/audit.config.json",
    config.iosBootstrapFlow,
    ...entries.map((entry) => entry.flowPath),
  ]);
}

export function canonicalAuditSourcePaths(root, config, entries) {
  return canonicalAuditProvenancePaths(root, iosPlatformSourcePaths(config, entries));
}

export function computeAuditSourceSha256(root, config, entries) {
  return computeCanonicalAuditSourceSha256(root, iosPlatformSourcePaths(config, entries));
}

export function parseGitStatusPorcelainZ(rawStatus) {
  if (typeof rawStatus !== "string") throw new Error("git status --porcelain=v1 -z output must be a string");
  return Object.freeze(rawStatus.split("\0").filter((entry) => entry.length > 0));
}

export function parseRunnerArgs(args) {
  if (args.length !== 2 || args[0] !== "--udid") throw new Error("Usage: npm run audit:ux-ui -- --udid <IOS_SIMULATOR_UDID>");
  const udid = args[1];
  if (!UDID_PATTERN.test(udid)) throw new Error(`Invalid iOS simulator UDID: ${udid}`);
  return Object.freeze({ udid: udid.toUpperCase() });
}

export function findAvailableIosSimulator(udid, spawn = spawnSync) {
  const result = spawn("xcrun", ["simctl", "list", "devices", "available", "--json"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`Could not enumerate available iOS simulators: ${(result.stderr || result.stdout || "unknown simctl error").trim()}`);
  let payload;
  try {
    payload = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`simctl returned invalid JSON: ${error.message}`);
  }
  for (const [runtime, devices] of Object.entries(payload.devices ?? {})) {
    const device = devices.find((entry) => entry.udid?.toUpperCase() === udid.toUpperCase());
    if (device) {
      if (device.state !== "Booted") throw new Error(`iOS simulator ${udid} is ${device.state}; boot it before capture`);
      return Object.freeze({ name: device.name, osRuntime: runtime, state: device.state, udid: device.udid.toUpperCase() });
    }
  }
  throw new Error(`iOS simulator ${udid} is not available`);
}

export function pngDimensions(bytes) {
  const signature = "89504e470d0a1a0a";
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== signature || bytes.subarray(12, 16).toString("ascii") !== "IHDR") throw new Error("Screenshot is not a valid PNG with an IHDR header");
  return Object.freeze({ width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) });
}

export function buildCaptureManifest({ root, config, entries, screenshotDirectory, device, startedAt, completedAt, simulatorPreferences, worktreeStatus }) {
  const contentIdentity = readPinnedContentIdentity(root);
  const appRepositoryCommit = commandText("git", ["rev-parse", "HEAD"], root);
  const auditSourceSha256 = computeAuditSourceSha256(root, config, entries);
  const screenshots = entries.map((entry) => {
    const filename = `${entry.screenshotName}.png`;
    const absolutePath = path.join(screenshotDirectory, filename);
    if (!statSync(absolutePath).isFile()) throw new Error(`Expected screenshot is missing: ${absolutePath}`);
    const bytes = readFileSync(absolutePath);
    const dimensions = pngDimensions(bytes);
    return Object.freeze({
      stateId: entry.stateId,
      flowId: entry.flowId,
      flowPath: entry.flowPath,
      screenshotPath: `${config.outputDir}/maestro/screenshots/${filename}`,
      sha256: createHash("sha256").update(bytes).digest("hex"),
      ...dimensions,
    });
  });
  if (new Set(screenshots.map((entry) => entry.sha256)).size !== screenshots.length) throw new Error("Capture produced duplicate screenshot bytes for different states");
  return Object.freeze({
    schemaVersion: 1,
    auditId: config.auditId,
    status: "captured_visual_review_pending",
    visualReview: Object.freeze({ approvedPacketComparison: "pending", accepted: false }),
    capture: Object.freeze({
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      runner: CANONICAL_RUNNER_PATH,
      commandContract: "npm run audit:ux-ui -- --udid <IOS_SIMULATOR_UDID>",
      serialProcessCount: entries.length,
      bootstrapProcessCount: 1,
      appId: config.app.appId,
      device,
      theme: "dark",
      contentLanguage: "en",
      simulatorPreferences,
    }),
    source: Object.freeze({
      appRepositoryCommit,
      auditSourceSha256,
      worktreeStatusFormat: "git status --porcelain=v1 -z",
      worktreeStatus,
      ...contentIdentity,
    }),
    screenshots,
  });
}

export function run(args, root = process.cwd(), spawn = spawnSync) {
  const { udid } = parseRunnerArgs(args);
  const device = findAvailableIosSimulator(udid, spawn);
  const config = readAuditConfig(root);
  const errors = collectUxUiAuditConfigErrors(root, config);
  if (errors.length > 0) throw new Error(`UX/UI audit config validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}`);
  const entries = canonicalIosCaptureEntries(root, config);
  const outputRoot = path.join(root, config.outputDir, "maestro");
  mkdirSync(outputRoot, { recursive: true });
  const startedAt = new Date();
  console.log(`Bootstrapping isolated audit host via ${config.iosBootstrapFlow}`);
  const bootstrap = spawn("maestro", [
    "test",
    "--udid", udid,
    "--flatten-debug-output",
    "--no-ansi",
    config.iosBootstrapFlow,
  ], { cwd: root, stdio: "inherit", timeout: 120000, killSignal: "SIGTERM" });
  if (bootstrap.status !== 0) throw new Error(`Audit host bootstrap failed with exit ${bootstrap.status ?? bootstrap.signal ?? "timeout"}; capture did not start`);
  const stagingRoot = mkdtempSync(path.join(outputRoot, ".ios-capture-"));
  try {
    for (const [index, entry] of entries.entries()) {
      console.log(`[${index + 1}/${entries.length}] ${entry.stateId} via ${entry.flowPath}`);
      const result = spawn("maestro", [
        "test",
        "--udid", udid,
        "--test-output-dir", stagingRoot,
        "--flatten-debug-output",
        "--no-ansi",
        entry.flowPath,
      ], { cwd: root, stdio: "inherit", timeout: 120000, killSignal: "SIGTERM" });
      if (result.status !== 0) throw new Error(`Capture failed for ${entry.stateId} with exit ${result.status ?? "signal"}; success manifest was not published`);
    }

    const stagedScreenshots = path.join(stagingRoot, "screenshots");
    const completedAt = new Date();
    const simulatorPreferences = readSimulatorPreferences(udid, spawn);
    const worktreeStatus = readWorktreeStatus(root);
    const manifest = buildCaptureManifest({ root, config, entries, screenshotDirectory: stagedScreenshots, device, startedAt, completedAt, simulatorPreferences, worktreeStatus });
    publishCapture(root, outputRoot, stagedScreenshots, manifest);
    console.log(`Captured ${entries.length}/${entries.length}; visual review remains pending.`);
    console.log(`Manifest: ${path.join(root, MANIFEST_PATH)}`);
    return 0;
  } finally {
    rmSync(stagingRoot, { force: true, recursive: true });
  }
}

export function publishCapture(root, outputRoot, stagedScreenshots, manifest, fsOverrides = {}) {
  const fs = {
    exists: existsSync,
    rename: renameSync,
    remove: rmSync,
    write: writeFileSync,
    ...fsOverrides,
  };
  const canonicalScreenshots = path.join(outputRoot, "screenshots");
  const backupScreenshots = path.join(outputRoot, `.screenshots-backup-${process.pid}`);
  const manifestPath = path.join(root, MANIFEST_PATH);
  const backupManifest = `${manifestPath}.backup-${process.pid}`;
  const manifestTempPath = `${manifestPath}.tmp-${process.pid}`;
  const hasCanonicalScreenshots = fs.exists(canonicalScreenshots);
  const hasCanonicalManifest = fs.exists(manifestPath);
  if (hasCanonicalScreenshots !== hasCanonicalManifest) {
    throw new Error("Refusing capture publication because the canonical manifest and screenshot directory are already mismatched");
  }
  if (fs.exists(backupScreenshots) || fs.exists(backupManifest) || fs.exists(manifestTempPath)) {
    throw new Error("Refusing capture publication because transaction residue already exists");
  }
  fs.write(manifestTempPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: "wx" });

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
    removePath(fs, manifestTempPath, rollbackErrors);
    throw publicationError("Could not prepare capture publication", error, rollbackErrors);
  }

  let newScreenshotsPublished = false;
  try {
    fs.rename(stagedScreenshots, canonicalScreenshots);
    newScreenshotsPublished = true;
    fs.rename(manifestTempPath, manifestPath);
  } catch (error) {
    const rollbackErrors = [];
    removePath(fs, newScreenshotsPublished ? canonicalScreenshots : null, rollbackErrors);
    restoreRenamedPath(fs, manifestBackedUp, backupManifest, manifestPath, rollbackErrors);
    restoreRenamedPath(fs, screensBackedUp, backupScreenshots, canonicalScreenshots, rollbackErrors);
    removePath(fs, manifestTempPath, rollbackErrors);
    throw publicationError("Could not publish capture manifest and screenshots", error, rollbackErrors);
  }

  const cleanupErrors = [];
  removePath(fs, screensBackedUp ? backupScreenshots : null, cleanupErrors);
  removePath(fs, manifestBackedUp ? backupManifest : null, cleanupErrors);
  if (cleanupErrors.length > 0) {
    throw new Error(`Capture pair was committed, but backup cleanup failed; canonical artifacts were not rolled back: ${cleanupErrors.join("; ")}`);
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

function readSimulatorPreferences(udid, spawn) {
  return Object.freeze({
    appleLanguages: simulatorDefault(udid, ["-g", "AppleLanguages"], spawn),
    appleLocale: simulatorDefault(udid, ["-g", "AppleLocale"], spawn),
    contentSizeCategory: simulatorDefault(udid, ["-g", "UICTContentSizeCategory"], spawn),
    reduceMotionEnabled: simulatorDefault(udid, ["com.apple.Accessibility", "ReduceMotionEnabled"], spawn),
  });
}

function simulatorDefault(udid, defaultsArgs, spawn) {
  const result = spawn("xcrun", ["simctl", "spawn", udid, "defaults", "read", ...defaultsArgs], { encoding: "utf8" });
  if (result.status === 0) return Object.freeze({ status: "recorded", rawValue: result.stdout.trim() });
  const diagnostic = `${result.stderr ?? ""}\n${result.stdout ?? ""}`;
  if (diagnostic.includes("does not exist")) return Object.freeze({ status: "not_set", rawValue: null });
  throw new Error(`Could not read simulator preference ${defaultsArgs.join(" ")}: ${diagnostic.trim() || "unknown simctl error"}`);
}

function readPinnedContentIdentity(root) {
  const source = readFileSync(path.join(root, "src/content/bundled/generatedArtifacts.ts"), "utf8");
  const manifestMatch = source.match(/manifest: Object\.freeze\(\{ envelopeVersion: 1, releaseId: "([^"]+)", sourceRepositoryCommit: "([0-9a-f]{40})" \}\)/);
  const checksumMatches = [...source.matchAll(/"checksumSha256":"([0-9a-f]{64})"/g)];
  if (!manifestMatch || checksumMatches.length !== 1) throw new Error("Pinned bundled content identity is not exact or contains multiple artifacts");
  return Object.freeze({
    contentReleaseId: manifestMatch[1],
    contentSourceRepositoryCommit: manifestMatch[2],
    contentArtifactSha256: checksumMatches[0][1],
  });
}

function readWorktreeStatus(root) {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z"], { cwd: root, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git status --porcelain=v1 -z failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  return parseGitStatusPorcelainZ(result.stdout);
}

function commandText(command, args, cwd, allowEmpty = false) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed: ${(result.stderr || result.stdout || "unknown error").trim()}`);
  const value = result.stdout.trim();
  if (!allowEmpty && value.length === 0) throw new Error(`${command} ${args.join(" ")} returned empty output`);
  return value;
}

export function main() {
  try {
    return run(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main();
