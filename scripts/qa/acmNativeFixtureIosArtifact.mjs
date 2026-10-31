#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  writeFileSync,
} from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRIVATE_ROOT = path.resolve(ROOT, "../.agent/private/acm-native-fixture-ios");
export const ARTIFACT_SCHEMA = "patternly.acm-native-fixture-ios-artifact.v1";
export const ARTIFACT_PAIR_REVIEW_SCHEMA = "patternly.acm-native-fixture-ios-independent-artifact-review.v1";
export const ARTIFACT_PAIR_BINDING_SCHEMA = "patternly.acm-native-fixture-ios-reviewed-pair-binding.v1";
export const MIN_FREE_BYTES = 4 * 1024 ** 3;
export const EMERGENCY_FREE_BYTES = 2.5 * 1024 ** 3;
export const APP_ALLOWED_CHANGED_PATHS = Object.freeze([
  "EXConstants.bundle/app.config",
  "Info.plist",
  "Patternly",
  "_CodeSignature/CodeResources",
  "main.jsbundle",
]);
export const QA_TOOLING_PATHS = Object.freeze([
  "scripts/qa/acmNativeFixtureIos.mjs",
  "scripts/qa/acmNativeFixtureIosArtifact.mjs",
  "scripts/qa/acmNativeFixtureIosArtifact.test.mjs",
]);
export const REVIEWED_SOURCE_DELTAS = Object.freeze({
  "src/application/runtimeAuditability/ACMNativeFixtureRoot.tsx": Object.freeze({
    baselineSha256: "157611d6bb741c1ecb07097406014f28ef094b1f242cd8e3308d1f2e7c041cd5",
    currentSha256: "27a81b08c5fa183122d369d5b1e7e360ae53f5d6b55205885aa6612f565de2da",
  }),
  ".maestro/acm-native-fixture-create.yaml": Object.freeze({
    baselineSha256: "ca65fb78e2875df1924b0944c4bec8742e4eaf538b5596afc441e780b5318998",
    currentSha256: "5ad44fe1178375ae498f2c4ec28826db25a4b5a2e7cf8b3e81a73050aacc0a06",
  }),
});
export const PINNED_NATIVE_BASE = Object.freeze({
  sourceRunUUID: "896706ca-1af6-4b70-a591-6615c69f5d06",
  appPath: path.join(PRIVATE_ROOT, "896706ca-1af6-4b70-a591-6615c69f5d06/DerivedData/Build/Products/Debug-iphonesimulator/Patternly.app"),
  contentTreeSha256: "64b365fdfebc1d86dc39d44df7dc8c642f869f0d3570943bfa4d6db6fd20a74e",
  modeManifestSha256: "597f434c2ca18f7c17d126a82f881560425c2c2ed39be59d94887ded41d14cec",
  embeddedBundleSha256: "a2f76299d6f7b865d68eb9cd9e7ce63c620e26b6264dd51dbff79193a0945189",
});
export const EXPO_DEBUG_SOCKET_PATCH = Object.freeze({
  path: "node_modules/expo/src/async-require/messageSocket.native.ts",
  sha256: "472dbe19a44dcbf51ce1579c54f4139a0aa2e2cdd9032b92d79cc878762c0848",
});

const IOS_OUTPUT_DIRECTORIES = new Set(["Pods", "build", "Build", "DerivedData", "Index.noindex", "Logs", "xcuserdata"]);
const PREBUILD_OUTPUT_PATHS = new Set([
  "ios/Patternly/AppDelegate.swift",
  "ios/Patternly/Info.plist",
  "ios/Patternly/PrivacyInfo.xcprivacy",
  "ios/Patternly/Supporting/Expo.plist",
  "ios/Patternly/Patternly.entitlements",
  "ios/Patternly.xcodeproj/project.pbxproj",
]);
const EXPECTED_FIXTURE_SOURCES = Object.freeze({
  "src/application/runtimeAuditability/ACMNativeFixtureRoot.tsx": "27a81b08c5fa183122d369d5b1e7e360ae53f5d6b55205885aa6612f565de2da",
  ".maestro/acm-native-fixture-create.yaml": "5ad44fe1178375ae498f2c4ec28826db25a4b5a2e7cf8b3e81a73050aacc0a06",
});
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const FIXTURE_OPERATIONS = ["create", "resume"];
const PRIVATE_COMMAND_ENV_KEYS = ["PATH", "HOME", "LANG", "DEVELOPER_DIR"];

export function createTreeManifest(root) {
  const absolute = path.resolve(root);
  const entries = [];
  const visit = (directory, relative = "") => {
    for (const name of readdirSync(directory).sort()) {
      const filename = path.join(directory, name);
      const entryPath = relative ? `${relative}/${name}` : name;
      const stat = lstatSync(filename);
      const mode = (stat.mode & 0o7777).toString(8).padStart(4, "0");
      if (stat.isDirectory()) {
        entries.push(Object.freeze({ path: entryPath, type: "directory", mode, sha256: "" }));
        visit(filename, entryPath);
      } else if (stat.isFile()) {
        entries.push(Object.freeze({ path: entryPath, type: "file", mode, sha256: sha256File(filename) }));
      } else if (stat.isSymbolicLink()) {
        entries.push(Object.freeze({ path: entryPath, type: "symlink", mode, target: readlinkSync(filename) }));
      } else {
        throw new Error(`artifact_tree_unsupported_entry:${entryPath}`);
      }
    }
  };
  if (!lstatSync(absolute).isDirectory()) throw new Error("artifact_tree_root_not_directory");
  visit(absolute);
  return Object.freeze(entries);
}

export function manifestSha256(entries) {
  const hash = createHash("sha256");
  for (const entry of entries) {
    hash.update(entry.path).update("\0").update(entry.type).update("\0").update(entry.mode).update("\0");
    hash.update(entry.type === "symlink" ? entry.target : entry.sha256).update("\0");
  }
  return hash.digest("hex");
}

export function contentTreeSha256(entries) {
  const hash = createHash("sha256");
  for (const entry of entries.filter((candidate) => candidate.type !== "directory").sort((a, b) => a.path.localeCompare(b.path))) {
    const contentDigest = entry.type === "symlink" ? `symlink:${entry.target}` : entry.sha256;
    hash.update(entry.path).update("\0").update(contentDigest).update("\0");
  }
  return hash.digest("hex");
}

export function assertAllowedAppDelta(beforeEntries, afterEntries) {
  const before = new Map(beforeEntries.map((entry) => [entry.path, entry]));
  const after = new Map(afterEntries.map((entry) => [entry.path, entry]));
  const paths = [...new Set([...before.keys(), ...after.keys()])].sort();
  const changed = paths.filter((entryPath) => !sameEntry(before.get(entryPath), after.get(entryPath)));
  if (changed.join("\0") !== [...APP_ALLOWED_CHANGED_PATHS].sort().join("\0")) {
    throw new Error(`artifact_app_allowlist_mismatch:${changed.join(",") || "none"}`);
  }
  for (const entryPath of changed) {
    const oldEntry = before.get(entryPath);
    const newEntry = after.get(entryPath);
    if (!oldEntry || !newEntry || oldEntry.type !== newEntry.type || oldEntry.mode !== newEntry.mode) {
      throw new Error(`artifact_app_mode_or_type_changed:${entryPath}`);
    }
  }
  return Object.freeze(changed);
}

export function assertSourceDeltaAllowed(entryPath, baseline, current) {
  if (!baseline || !current || baseline.type !== current.type || baseline.mode !== current.mode) {
    throw new Error(`artifact_source_mode_or_type_changed:${entryPath}`);
  }
  if (baseline.sha256 === current.sha256) return null;
  const allowed = REVIEWED_SOURCE_DELTAS[entryPath];
  if (!allowed || baseline.sha256 !== allowed.baselineSha256 || current.sha256 !== allowed.currentSha256) {
    throw new Error(`artifact_source_content_drift:${entryPath}`);
  }
  return Object.freeze({ path: entryPath, baselineSha256: baseline.sha256, currentSha256: current.sha256 });
}

export function assertNativeInputsMatch(baselineEntries, currentEntries, stagedEntries, expectedFileCount) {
  const baselineDigest = manifestSha256(baselineEntries);
  const currentDigest = manifestSha256(currentEntries);
  const stagedDigest = manifestSha256(stagedEntries);
  if (baselineDigest !== currentDigest || currentDigest !== stagedDigest
    || baselineEntries.filter((entry) => entry.type !== "directory").length !== expectedFileCount) {
    throw new Error("artifact_native_input_fingerprint_mismatch");
  }
  return Object.freeze({
    fileCount: baselineEntries.filter((entry) => entry.type !== "directory").length,
    manifestEntryCount: baselineEntries.length,
    manifestSha256: baselineDigest,
  });
}

export function assertPrivateNodeModules(workspaceRoot) {
  const workspaceReal = realpathSync(workspaceRoot);
  const modulesPath = path.join(workspaceReal, "node_modules");
  const stat = lstatSync(modulesPath);
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error("artifact_private_node_modules_required");
  const modulesReal = realpathSync(modulesPath);
  if (modulesReal !== modulesPath || !modulesReal.startsWith(`${workspaceReal}${path.sep}`)) {
    throw new Error("artifact_private_node_modules_required");
  }
  return Object.freeze({ path: "node_modules", mode: (stat.mode & 0o7777).toString(8).padStart(4, "0") });
}

export function parseCodesignEntitlementsOutput(output, expectedExecutablePath, diagnostics = "") {
  if (typeof output !== "string" || !path.isAbsolute(expectedExecutablePath)) {
    throw new Error("artifact_entitlements_output_invalid");
  }
  const start = output.indexOf("<?xml");
  const closingTag = "</plist>";
  const end = start < 0 ? -1 : output.indexOf(closingTag, start);
  const xmlEnd = end + closingTag.length;
  if (start < 0 || end < 0 || output.indexOf("<?xml", start + 5) >= 0
    || output.indexOf(closingTag, end + closingTag.length) >= 0
    || (output.match(/<plist(?:\s|>)/gu) ?? []).length !== 1
    || output.slice(0, start).trim() || output.slice(xmlEnd).trim()) {
    throw new Error("artifact_entitlements_xml_invalid");
  }
  const xml = output.slice(start, xmlEnd);
  const trailerLines = diagnostics.trim() ? diagnostics.trim().split(/\r?\n/u) : [];
  const executableLines = trailerLines.filter((line) => line.startsWith("Executable="));
  const nonExecutableLines = trailerLines.filter((line) => !line.startsWith("Executable="));
  if (executableLines.length !== 1 || executableLines[0] !== `Executable=${expectedExecutablePath}`
    || nonExecutableLines.some((line) => line !== "warning: Specifying ':' in the path is deprecated and will not work in a future release")) {
    throw new Error("artifact_entitlements_output_trailer_invalid");
  }
  const plistPackage = require(path.join(ROOT, "node_modules/@expo/plist"));
  const plist = plistPackage.default ?? plistPackage;
  let entitlements;
  try { entitlements = plist.parse(xml); }
  catch { throw new Error("artifact_entitlements_xml_invalid"); }
  if (!entitlements || Array.isArray(entitlements) || typeof entitlements !== "object") {
    throw new Error("artifact_entitlements_xml_invalid");
  }
  return Object.freeze({ xml, entitlements, entitlementsCanonical: canonicalJson(entitlements) });
}

export function parseCodesignStableIdentity(output, expectedExecutablePath) {
  if (typeof output !== "string" || !path.isAbsolute(expectedExecutablePath)) {
    throw new Error("artifact_signature_identity_invalid");
  }
  const lines = output.trim().split(/\r?\n/u);
  const values = new Map();
  let executableSeen = false;
  const add = (key, value) => {
    if (values.has(key)) throw new Error(`artifact_signature_identity_duplicate:${key}`);
    values.set(key, value);
  };
  for (const line of lines) {
    let match;
    if ((match = /^Executable=(.*)$/u.exec(line))) {
      if (executableSeen) throw new Error("artifact_signature_identity_duplicate:executable");
      executableSeen = true;
      if (match[1] !== expectedExecutablePath) throw new Error("artifact_signature_executable_path_mismatch");
    } else if ((match = /^Identifier=(.+)$/u.exec(line))) add("identifier", match[1]);
    else if ((match = /^Format=(.+)$/u.exec(line))) add("format", match[1]);
    else if ((match = /^CodeDirectory v=(\d+) size=\d+ flags=(0x[0-9a-f]+)(?:\(([^)]*)\))? hashes=\d+\+\d+ location=([a-z]+)$/iu.exec(line))) {
      add("codeDirectory", Object.freeze({ version: match[1], flags: match[2].toLowerCase(), flagNames: match[3] ?? "", location: match[4] }));
    } else if ((match = /^VersionPlatform=(\d+)$/u.exec(line))) add("platform", match[1]);
    else if ((match = /^VersionMin=(\d+)$/u.exec(line))) add("minimumOS", match[1]);
    else if ((match = /^VersionSDK=(\d+)$/u.exec(line))) add("sdk", match[1]);
    else if ((match = /^Hash type=(\w+) size=\d+$/u.exec(line))) add("hashType", match[1]);
    else if ((match = /^Hash choices=(.+)$/u.exec(line))) add("hashChoices", match[1]);
    else if ((match = /^CMSDigestType=(\d+)$/u.exec(line))) add("cmsDigestType", match[1]);
    else if ((match = /^Executable Segment base=(\d+)$/u.exec(line))) add("executableSegmentBase", match[1]);
    else if ((match = /^Executable Segment limit=(\d+)$/u.exec(line))) add("executableSegmentLimit", match[1]);
    else if ((match = /^Executable Segment flags=(0x[0-9a-f]+)$/iu.exec(line))) add("executableSegmentFlags", match[1].toLowerCase());
    else if ((match = /^Page size=(\d+)$/u.exec(line))) add("pageSize", match[1]);
    else if ((match = /^Internal requirements count=(\d+) size=(\d+)$/u.exec(line))) {
      add("internalRequirements", Object.freeze({ count: match[1], size: match[2] }));
    }
    else if ((match = /^Signature=(.+)$/u.exec(line))) add("signature", match[1]);
    else if ((match = /^TeamIdentifier=(.*)$/u.exec(line))) add("teamIdentifier", match[1]);
    else if (/^(?:CandidateCDHash(?:Full)? sha256=|CDHash=|CMSDigest=|Info\.plist entries=|Sealed Resources version=)/u.test(line)) {
      // These fields bind the signature to mutable contents or report non-identity diagnostics.
    } else {
      throw new Error("artifact_signature_identity_field_unrecognized");
    }
  }
  const required = ["identifier", "format", "codeDirectory", "platform", "minimumOS", "sdk", "hashType",
    "hashChoices", "cmsDigestType", "executableSegmentBase", "executableSegmentLimit", "executableSegmentFlags",
    "pageSize", "signature", "teamIdentifier", "internalRequirements"];
  if (!executableSeen || required.some((key) => !values.has(key))) throw new Error("artifact_signature_identity_incomplete");
  return Object.freeze(Object.fromEntries(values));
}

export function assertSameAppIdentity(expected, actual) {
  if (canonicalJson(expected) !== canonicalJson(actual)) throw new Error("artifact_simulated_rights_or_identity_changed");
  return true;
}

export function createAppIdentity(info, signatureIdentity, parsedEntitlements) {
  const bundleIdentifier = info.CFBundleIdentifier ?? "";
  if (!bundleIdentifier || bundleIdentifier !== signatureIdentity.identifier) {
    throw new Error("artifact_bundle_identifier_signature_mismatch");
  }
  const entitlements = parsedEntitlements.entitlements;
  return Object.freeze({
    bundleIdentifier,
    teamIdentifier: signatureIdentity.teamIdentifier,
    applicationIdentifier: entitlements["application-identifier"] ?? "",
    keychainAccessGroups: entitlements["keychain-access-groups"] ?? [],
    entitlementsCanonical: parsedEntitlements.entitlementsCanonical,
    signatureIdentity: Object.freeze({ ...signatureIdentity }),
  });
}

export function assertSourceSnapshot({ currentRoot, snapshotRoot, manifestPath, workspaceRoot }) {
  const manifest = readJson(manifestPath);
  if (manifest.schema !== "patternly.acm-native-fixture-ios-input-manifest.v1" || !Array.isArray(manifest.files)) {
    throw new Error("artifact_source_manifest_invalid");
  }
  if (manifest.sourceFileCount !== manifest.files.length + manifest.iosPodsFileCount) {
    throw new Error("artifact_source_manifest_count_mismatch");
  }
  const baselinePaths = manifest.files.map((entry) => entry.path).filter((entryPath) => !QA_TOOLING_PATHS.includes(entryPath)).sort();
  const currentPaths = collectSourcePaths(currentRoot).filter((entryPath) => !QA_TOOLING_PATHS.includes(entryPath)).sort();
  if (baselinePaths.join("\0") !== currentPaths.join("\0")) throw new Error("artifact_source_path_set_changed");
  const manifestByPath = new Map(manifest.files.map((entry) => [entry.path, entry]));
  const deltas = [];
  const generatedOutputPaths = [];
  const sourceEntries = [];
  for (const entryPath of currentPaths) {
    const baseline = sourceEntry(path.join(snapshotRoot, entryPath));
    const current = sourceEntry(path.join(currentRoot, entryPath));
    const expected = manifestByPath.get(entryPath);
    if (!expected || baseline.sha256 !== expected.sha256 || baseline.type !== expected.kind) {
      throw new Error(`artifact_source_snapshot_manifest_mismatch:${entryPath}`);
    }
    const delta = assertSourceDeltaAllowed(entryPath, baseline, current);
    if (delta) deltas.push(delta);
    const staged = sourceEntry(path.join(workspaceRoot, entryPath));
    if (staged.type !== current.type || staged.mode !== current.mode || staged.sha256 !== current.sha256) {
      const baselineStage = sourceEntry(path.join(snapshotRoot, entryPath));
      if (!PREBUILD_OUTPUT_PATHS.has(entryPath) || staged.type !== baselineStage.type || staged.mode !== baselineStage.mode) {
        throw new Error(`artifact_workspace_source_mismatch:${entryPath}`);
      }
      generatedOutputPaths.push(Object.freeze({ path: entryPath, baselineSha256: baselineStage.sha256, stagedSha256: staged.sha256 }));
    }
    sourceEntries.push(Object.freeze({ path: entryPath, ...current }));
  }
  const expectedDeltas = Object.keys(REVIEWED_SOURCE_DELTAS).filter((entryPath) => {
    const current = sourceEntry(path.join(currentRoot, entryPath));
    const baseline = sourceEntry(path.join(snapshotRoot, entryPath));
    return current.sha256 !== baseline.sha256;
  }).sort();
  if (deltas.map((entry) => entry.path).sort().join("\0") !== expectedDeltas.join("\0")) {
    throw new Error("artifact_reviewed_source_delta_set_mismatch");
  }

  const baselinePods = createTreeManifest(path.join(snapshotRoot, "ios/Pods"));
  const currentPods = createTreeManifest(path.join(currentRoot, "ios/Pods"));
  const stagedPods = createTreeManifest(path.join(workspaceRoot, "ios/Pods"));
  const pods = assertNativeInputsMatch(baselinePods, currentPods, stagedPods, manifest.iosPodsFileCount);

  for (const [entryPath, expectedSha256] of Object.entries(EXPECTED_FIXTURE_SOURCES)) {
    if (sourceEntry(path.join(currentRoot, entryPath)).sha256 !== expectedSha256) {
      throw new Error(`artifact_fixture_source_pin_mismatch:${entryPath}`);
    }
  }
  const sourceDigest = manifestSha256(sourceEntries);
  const nativeEntries = sourceEntries.filter(({ path: entryPath }) => entryPath.startsWith("ios/")
    || entryPath.startsWith("native/") || entryPath.startsWith("plugins/") || entryPath === "app.config.js");
  const tooling = QA_TOOLING_PATHS.map((entryPath) => Object.freeze({ path: entryPath, sha256: sha256File(path.join(currentRoot, entryPath)) }));
  return Object.freeze({
    sourceManifestSha256: sha256File(manifestPath),
    runtimeInputFileCount: sourceEntries.length,
    runtimeSourceSha256: sourceDigest,
    nativeInputSha256: manifestSha256(nativeEntries),
    podsEntryCount: pods.fileCount,
    podsManifestEntryCount: pods.manifestEntryCount,
    podsManifestSha256: pods.manifestSha256,
    acceptedSourceDeltas: Object.freeze(deltas),
    generatedOutputPaths: Object.freeze(generatedOutputPaths),
    producerTooling: Object.freeze(tooling),
  });
}

export async function prepareArtifactVariant({
  workspaceRoot,
  sourceRoot = ROOT,
  sourceSnapshotRoot,
  sourceManifestPath,
  nativeBaseApp = PINNED_NATIVE_BASE.appPath,
  nativeBasePin = PINNED_NATIVE_BASE,
  privateRunDirectory,
  operation,
  runUUID,
  smokeConfig,
  buildEnvironment,
}) {
  validateIdentity(operation, runUUID);
  assertPrivateDirectory(privateRunDirectory);
  assertWithin(workspaceRoot, privateRunDirectory, "workspace");
  const privateNodeModules = assertPrivateNodeModules(workspaceRoot);
  assertWithin(sourceSnapshotRoot, PRIVATE_ROOT, "source_snapshot");
  assertWithin(nativeBaseApp, PRIVATE_ROOT, "native_base");
  const freeBefore = availableBytes(privateRunDirectory);
  if (freeBefore < MIN_FREE_BYTES) throw new Error("artifact_disk_reserve_before_start");

  const baseEntries = createTreeManifest(nativeBaseApp);
  const baseContentSha256 = contentTreeSha256(baseEntries);
  const baseModeManifestSha256 = manifestSha256(baseEntries);
  if (baseContentSha256 !== nativeBasePin.contentTreeSha256
    || baseModeManifestSha256 !== nativeBasePin.modeManifestSha256) {
    throw new Error("artifact_native_base_pin_mismatch");
  }
  if (embeddedBundleSha256(nativeBaseApp) !== nativeBasePin.embeddedBundleSha256) {
    throw new Error("artifact_native_base_embedded_bundle_pin_mismatch");
  }
  const sourceBinding = assertSourceSnapshot({
    currentRoot: sourceRoot,
    snapshotRoot: sourceSnapshotRoot,
    manifestPath: sourceManifestPath,
    workspaceRoot,
  });
  const identity = readAppIdentity(nativeBaseApp);
  if (identity.bundleIdentifier !== "com.lkurczab.patternly") throw new Error("artifact_native_base_bundle_id_mismatch");
  const expoPatchPath = path.join(workspaceRoot, EXPO_DEBUG_SOCKET_PATCH.path);
  if (sha256File(expoPatchPath) !== EXPO_DEBUG_SOCKET_PATCH.sha256) throw new Error("artifact_expo_sdk_patch_pin_mismatch");
  const operationRoot = path.join(privateRunDirectory, "artifacts", operation);
  ensurePrivateDirectory(operationRoot);
  const appPath = path.join(operationRoot, "Patternly.app");
  if (existsSync(appPath)) throw new Error("artifact_candidate_already_exists");
  const pairBudget = estimateOperationBudget(baseEntries, nativeBaseApp);
  if (freeBefore < MIN_FREE_BYTES + pairBudget) throw new Error("artifact_disk_budget_would_break_reserve");
  runCapture("cp", ["-cR", nativeBaseApp, appPath], { cwd: sourceRoot });
  const copiedEntries = createTreeManifest(appPath);
  if (manifestSha256(copiedEntries) !== baseModeManifestSha256) throw new Error("artifact_native_base_copy_mode_or_content_mismatch");

  const operationTemp = path.join(operationRoot, "tmp");
  ensurePrivateDirectory(operationTemp);
  const environment = makeBuildEnvironment(buildEnvironment, operationTemp, runUUID, operation);
  const firebase = readSmokeFirebaseConfig(workspaceRoot);
  if (firebase.PROJECT_ID !== environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID
    || firebase.GOOGLE_APP_ID !== environment.EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID) {
    throw new Error("artifact_smoke_firebase_environment_mismatch");
  }
  const configResult = runCapture(process.execPath, ["./node_modules/expo/bin/cli", "config", "--type", "public", "--json"], {
    cwd: workspaceRoot,
    env: environment,
  });
  const resolvedConfig = JSON.parse(configResult.stdout);
  if (smokeConfig) assertEquivalentFixtureConfig(resolvedConfig, smokeConfig, runUUID, operation);
  else assertResolvedFixtureConfig(resolvedConfig, runUUID, operation);
  applyAppMetadata(appPath, resolvedConfig, runUUID, operation);

  const outputPath = path.join(operationRoot, "main.jsbundle.js");
  const assetLog = path.join(operationRoot, "expo-export.log");
  const expoArgs = ["./node_modules/expo/bin/cli", "export:embed", "--entry-file", "./node_modules/expo/AppEntry.js",
    "--platform", "ios", "--dev", "true", "--reset-cache", "--bundle-output", outputPath, "--assets-dest", appPath,
    "--config-cmd", `node ${path.join(workspaceRoot, "node_modules/react-native/cli.js")} config`];
  const expoVersion = packageVersion(path.join(workspaceRoot, "node_modules/expo/package.json"));
  const expoCliVersion = packageVersion(path.join(workspaceRoot, "node_modules/expo/node_modules/@expo/cli/package.json"));
  if (expoVersion !== "57.0.17" || expoCliVersion !== "57.0.19") throw new Error("artifact_expo_toolchain_pin_mismatch");
  if (availableBytes(privateRunDirectory) < MIN_FREE_BYTES + pairBudget) throw new Error("artifact_disk_budget_before_export");
  await runMonitored(process.execPath, expoArgs, { cwd: workspaceRoot, env: environment, logPath: assetLog });
  if (!existsSync(outputPath)) throw new Error("artifact_expo_export_missing_bundle");

  const hermes = path.join(workspaceRoot, "node_modules/hermes-compiler/hermesc/osx-bin/hermesc");
  const hermesVersion = runCapture(hermes, ["--version"], { cwd: workspaceRoot }).stdout.trim();
  if (!hermesVersion.includes("250829098.0.17")) throw new Error("artifact_hermes_toolchain_pin_mismatch");
  const hermesLog = path.join(operationRoot, "hermes.log");
  await runMonitored(hermes, ["-emit-binary", "-max-diagnostic-width=80", "-Og", "-out", path.join(appPath, "main.jsbundle"), outputPath], {
    cwd: workspaceRoot,
    env: environment,
    logPath: hermesLog,
  });
  chmodSync(path.join(appPath, "main.jsbundle"), Number.parseInt(copiedEntries.find((entry) => entry.path === "main.jsbundle").mode, 8));
  if (!isHermesBytecode(path.join(appPath, "main.jsbundle"))) throw new Error("artifact_hermes_bytecode_invalid");

  const sourceStringPath = path.join(operationRoot, "bundle-strings.txt");
  runCapture("strings", ["-a", path.join(appPath, "main.jsbundle")], { cwd: sourceRoot, stdoutPath: sourceStringPath });
  const bundleStrings = readFileSync(sourceStringPath, "utf8");
  if (!bundleStrings.includes(runUUID.toLowerCase()) || !bundleStrings.includes("ACMNativeFixtureRoot")) {
    throw new Error("artifact_bundle_source_binding_missing");
  }
  signPreservingIdentity(appPath, nativeBaseApp, identity, operationRoot);
  const afterEntries = createTreeManifest(appPath);
  const changedPaths = assertAllowedAppDelta(copiedEntries, afterEntries);
  const afterIdentity = readAppIdentity(appPath);
  if (canonicalJson(identity) !== canonicalJson(afterIdentity)) throw new Error("artifact_simulated_rights_or_identity_changed");
  verifyEmbeddedMetadata(appPath, runUUID, operation);
  const nativePayload = verifyMachOPayload(nativeBaseApp, appPath, operationRoot);
  verifyStrictSignature(appPath);

  const producer = producerDigest(sourceRoot, workspaceRoot, expoVersion, expoCliVersion, hermesVersion, expoArgs);
  const finalAppManifestSha256 = manifestSha256(afterEntries);
  const candidate = Object.freeze({
    appPath,
    appContentTreeSha256: contentTreeSha256(afterEntries),
    appManifestSha256: finalAppManifestSha256,
    embeddedBundleSha256: embeddedBundleSha256(appPath),
    changedPaths,
    nativeBase: Object.freeze({
      sourceRunUUID: nativeBasePin.sourceRunUUID,
      path: path.relative(PRIVATE_ROOT, nativeBaseApp),
      contentTreeSha256: baseContentSha256,
      modeManifestSha256: baseModeManifestSha256,
      identity,
      configuration: "Debug-iphonesimulator",
      expoDebugSocketPatch: Object.freeze({ ...EXPO_DEBUG_SOCKET_PATCH }),
    }),
    sourceBinding,
    nativePayload,
    producer,
    toolchain: Object.freeze({ expoVersion, expoCliVersion, hermesVersion, dev: true, platform: "ios" }),
    privateNodeModules,
    operation,
    runUUID: runUUID.toLowerCase(),
    outputManifest: afterEntries,
  });
  const receiptPath = path.join(operationRoot, "artifact-manifest.json");
  writePrivateJson(receiptPath, { schema: ARTIFACT_SCHEMA, ...candidate, outputManifest: afterEntries });
  if (availableBytes(privateRunDirectory) < EMERGENCY_FREE_BYTES) throw new Error("artifact_emergency_disk_guard_after_build");
  return Object.freeze({ ...candidate, receiptPath });
}

export async function prepareArtifactPair(options) {
  const results = [];
  for (const operation of FIXTURE_OPERATIONS) {
    results.push(await prepareArtifactVariant({ ...options, operation }));
  }
  return Object.freeze(results);
}

export function validateExistingArtifactPair({
  pairRoot,
  runUUID,
  sourceRoot = ROOT,
  currentSourceFingerprint,
  currentSourceFileCount,
  sourceSnapshotRoot = path.join(PRIVATE_ROOT, PINNED_NATIVE_BASE.sourceRunUUID, "input-snapshot"),
  sourceManifestPath = path.join(PRIVATE_ROOT, PINNED_NATIVE_BASE.sourceRunUUID, "input-manifest.json"),
}) {
  validateIdentity("create", runUUID);
  if (!/^[a-f0-9]{64}$/u.test(currentSourceFingerprint ?? "") || !Number.isInteger(currentSourceFileCount)) {
    throw new Error("artifact_pair_current_source_fingerprint_invalid");
  }
  const absolutePairRoot = path.resolve(pairRoot);
  assertWithin(absolutePairRoot, PRIVATE_ROOT, "pair_root");
  if (path.basename(absolutePairRoot) !== `artifact-pair-${runUUID.toLowerCase()}`) {
    throw new Error("artifact_pair_directory_uuid_mismatch");
  }
  assertPrivateDirectory(absolutePairRoot);
  const pairRunUUID = readFileSync(path.join(absolutePairRoot, "run-id.txt"), "utf8").trim().toLowerCase();
  if (pairRunUUID !== runUUID.toLowerCase()) throw new Error("artifact_pair_run_id_mismatch");

  const sourceBinding = assertSourceSnapshot({
    currentRoot: sourceRoot,
    snapshotRoot: sourceSnapshotRoot,
    manifestPath: sourceManifestPath,
    workspaceRoot: sourceRoot,
  });
  const workspaceRoot = path.join(absolutePairRoot, "workspace");
  assertWithin(workspaceRoot, absolutePairRoot, "pair_workspace");
  assertPrivateNodeModules(workspaceRoot);
  const nativeBaseEntries = createTreeManifest(PINNED_NATIVE_BASE.appPath);
  const nativeBaseIdentity = readAppIdentity(PINNED_NATIVE_BASE.appPath);
  const nativeBaseSha256 = contentTreeSha256(nativeBaseEntries);
  const nativeBaseModeManifestSha256 = manifestSha256(nativeBaseEntries);
  if (nativeBaseSha256 !== PINNED_NATIVE_BASE.contentTreeSha256
    || nativeBaseModeManifestSha256 !== PINNED_NATIVE_BASE.modeManifestSha256
    || embeddedBundleSha256(PINNED_NATIVE_BASE.appPath) !== PINNED_NATIVE_BASE.embeddedBundleSha256) {
    throw new Error("artifact_pair_native_base_pin_mismatch");
  }

  const reviewPath = path.join(absolutePairRoot, "independent-artifact-review.json");
  const review = readJson(reviewPath);
  const reviewReceiptSha256 = sha256File(reviewPath);
  if (review.schema !== ARTIFACT_PAIR_REVIEW_SCHEMA || review.decision !== "OFFLINE_ARTIFACT_PAIR_ACCEPTED"
    || review.runUUID !== runUUID.toLowerCase() || review.sourceBinding?.targetedCurrentSourceAndStageHashesMatch !== true
    || review.sourceBinding?.currentProducerToolingHashesMatchReceipts !== true) {
    throw new Error("artifact_pair_independent_review_invalid");
  }
  const requiredReviewChecks = [
    "actualAppTreesMatchModeAwareOutputManifests",
    "changedPathTypesAndModesPreserved",
    "baseAppPinsMatchActualBaseTree",
    "strictCodesignVerificationBaseCreateResume",
    "baseCreateResumeStableSignatureAndEntitlementIdentityEqual",
    "fixtureRunUuidAndOperationEmbeddedInInfoAndExpoConfig",
    "nonMainMachOFilesMatchBase",
    "unsignedMainExecutableMatchesBaseAndCandidateForBothOperations",
  ];
  if (requiredReviewChecks.some((key) => review.checks?.[key] !== true)) {
    throw new Error("artifact_pair_independent_review_checks_incomplete");
  }

  const validationRoot = mkdtempSync(path.join(PRIVATE_ROOT, "pair-validation-"));
  chmodSync(validationRoot, 0o700);
  try {
    const variants = {};
    for (const operation of FIXTURE_OPERATIONS) {
      const operationRoot = path.join(absolutePairRoot, "artifacts", operation);
      const appPath = path.join(operationRoot, "Patternly.app");
      const appRootStat = lstatSync(appPath);
      if (!appRootStat.isDirectory() || appRootStat.isSymbolicLink()) throw new Error(`artifact_pair_app_root_invalid:${operation}`);
      const receiptPath = path.join(operationRoot, "artifact-manifest.json");
      const receipt = readJson(receiptPath);
      const receiptSha256 = sha256File(receiptPath);
      const reviewArtifact = review.artifacts?.[operation];
      if (receipt.schema !== ARTIFACT_SCHEMA || receipt.operation !== operation
        || receipt.runUUID !== runUUID.toLowerCase() || receipt.appPath !== appPath
        || receipt.toolchain?.dev !== true || receipt.toolchain?.platform !== "ios"
        || !reviewArtifact || reviewArtifact.operation !== operation || reviewArtifact.runUUID !== runUUID.toLowerCase()
        || reviewArtifact.manifestPath !== `artifacts/${operation}/artifact-manifest.json`
        || reviewArtifact.manifestSha256 !== receiptSha256) {
        throw new Error(`artifact_pair_receipt_identity_mismatch:${operation}`);
      }
      const actualEntries = createTreeManifest(appPath);
      const actualManifestSha256 = manifestSha256(actualEntries);
      const actualContentTreeSha256 = contentTreeSha256(actualEntries);
      if (actualManifestSha256 !== receipt.appManifestSha256
        || actualContentTreeSha256 !== receipt.appContentTreeSha256
        || manifestSha256(receipt.outputManifest) !== receipt.appManifestSha256
        || contentTreeSha256(receipt.outputManifest) !== receipt.appContentTreeSha256
        || reviewArtifact.appManifestSha256 !== receipt.appManifestSha256
        || reviewArtifact.appContentTreeSha256 !== receipt.appContentTreeSha256) {
        throw new Error(`artifact_pair_app_manifest_mismatch:${operation}`);
      }
      const changedPaths = assertAllowedAppDelta(nativeBaseEntries, actualEntries);
      if (canonicalJson(changedPaths) !== canonicalJson([...receipt.changedPaths].sort())) {
        throw new Error(`artifact_pair_changed_paths_mismatch:${operation}`);
      }
      if (receipt.nativeBase?.sourceRunUUID !== PINNED_NATIVE_BASE.sourceRunUUID
        || receipt.nativeBase?.contentTreeSha256 !== nativeBaseSha256
        || receipt.nativeBase?.modeManifestSha256 !== nativeBaseModeManifestSha256
        || canonicalJson(receipt.nativeBase?.identity) !== canonicalJson(nativeBaseIdentity)
        || receipt.embeddedBundleSha256 !== embeddedBundleSha256(appPath)) {
        throw new Error(`artifact_pair_native_base_receipt_mismatch:${operation}`);
      }
      const identity = readAppIdentity(appPath);
      if (canonicalJson(identity) !== canonicalJson(nativeBaseIdentity)) {
        throw new Error(`artifact_pair_identity_mismatch:${operation}`);
      }
      verifyEmbeddedMetadata(appPath, runUUID.toLowerCase(), operation);
      const payload = verifyMachOPayload(PINNED_NATIVE_BASE.appPath, appPath, validationRoot);
      if (canonicalJson(payload) !== canonicalJson(receipt.nativePayload)
        || receipt.nativePayload.unsignedMainExecutableIdentical !== true
        || review.checks.unsignedMainExecutableMatchesBaseAndCandidateForBothOperations !== true) {
        throw new Error(`artifact_pair_native_payload_mismatch:${operation}`);
      }
      verifyStrictSignature(appPath);

      const recordedSource = receipt.sourceBinding;
      if (recordedSource.runtimeInputFileCount !== sourceBinding.runtimeInputFileCount
        || recordedSource.runtimeSourceSha256 !== sourceBinding.runtimeSourceSha256
        || recordedSource.nativeInputSha256 !== sourceBinding.nativeInputSha256
        || recordedSource.podsEntryCount !== sourceBinding.podsEntryCount
        || recordedSource.podsManifestEntryCount !== sourceBinding.podsManifestEntryCount
        || recordedSource.podsManifestSha256 !== sourceBinding.podsManifestSha256) {
        throw new Error(`artifact_pair_current_source_projection_mismatch:${operation}`);
      }
      verifyHistoricalProducer(receipt, operation, absolutePairRoot, workspaceRoot);
      variants[operation] = Object.freeze({
        operation,
        appPath,
        receiptPath,
        receiptSha256,
        appManifestSha256: actualManifestSha256,
        appContentTreeSha256: actualContentTreeSha256,
        embeddedBundleSha256: receipt.embeddedBundleSha256,
        producerSha256: receipt.producer.sha256,
        debug: receipt.toolchain.dev,
        platform: receipt.toolchain.platform,
        changedPaths,
      });
    }

    const reviewSource = review.sourceBinding;
    if (reviewSource.recordedRuntimeInputFileCount !== sourceBinding.runtimeInputFileCount
      || reviewSource.recordedRuntimeSourceSha256 !== sourceBinding.runtimeSourceSha256
      || reviewSource.recordedNativeInputSha256 !== sourceBinding.nativeInputSha256
      || reviewSource.recordedPodsManifestEntryCount !== sourceBinding.podsManifestEntryCount
      || reviewSource.recordedPodsManifestSha256 !== sourceBinding.podsManifestSha256) {
      throw new Error("artifact_pair_review_current_source_projection_mismatch");
    }
    const pairBinding = Object.freeze({
      schema: ARTIFACT_PAIR_BINDING_SCHEMA,
      runUUID: runUUID.toLowerCase(),
      currentSourceFingerprint,
      currentSourceFileCount,
      runtimeSourceSha256: sourceBinding.runtimeSourceSha256,
      nativeInputSha256: sourceBinding.nativeInputSha256,
      podsEntryCount: sourceBinding.podsEntryCount,
      podsManifestEntryCount: sourceBinding.podsManifestEntryCount,
      podsManifestSha256: sourceBinding.podsManifestSha256,
      sourceManifestSha256: sourceBinding.sourceManifestSha256,
      producerSha256: Object.freeze({ create: variants.create.producerSha256, resume: variants.resume.producerSha256 }),
      receiptSha256: Object.freeze({ create: variants.create.receiptSha256, resume: variants.resume.receiptSha256 }),
      independentReviewSha256: reviewReceiptSha256,
      nativeBaseContentTreeSha256: nativeBaseSha256,
      nativeBaseModeManifestSha256,
    });
    const pairSha256 = sha256Text(canonicalJson(pairBinding));
    return Object.freeze({ pairRoot: absolutePairRoot, runUUID: runUUID.toLowerCase(), pairSha256, binding: pairBinding, variants: Object.freeze(variants) });
  } finally {
    rmSync(validationRoot, { recursive: true, force: true });
  }
}

export function assertArtifactPairApproval(approval, validatedPair) {
  const binding = validatedPair?.binding;
  const pairSha256 = validatedPair?.pairSha256;
  if (!binding || !/^[a-f0-9]{64}$/u.test(pairSha256 ?? "")
    || validatedPair.runUUID !== binding.runUUID) {
    throw new Error("artifact_pair_validation_result_invalid");
  }
  const expected = {
    sourceFingerprint: binding.currentSourceFingerprint,
    sourceFileCount: binding.currentSourceFileCount,
    runtimeSourceSha256: binding.runtimeSourceSha256,
    nativeInputSha256: binding.nativeInputSha256,
    podsManifestSha256: binding.podsManifestSha256,
    artifactPairSha256: pairSha256,
  };
  if (Object.entries(expected).some(([key, value]) => approval?.[key] !== value)) {
    throw new Error("artifact_pair_approval_binding_mismatch");
  }
  return true;
}

export function pairCandidateOperationForRestore(runState) {
  if (runState?.pairMode !== true) return null;
  if (["create-install-in-flight", "create-installed", "create-session-active"].includes(runState.phase)) return "create";
  if (["resume-install-in-flight", "resume-installed", "resume-session-restored"].includes(runState.phase)) return "resume";
  return null;
}

export function pairCandidateInstallProofForRestore({
  runState,
  expectedOperation,
  installedIdentityMatches,
  installedMetadataVerified,
}) {
  if (pairCandidateOperationForRestore(runState) !== expectedOperation
    || typeof expectedOperation !== "string" || !runState?.artifactPairBinding?.binding) return false;
  const { pairSha256, binding } = runState.artifactPairBinding;
  const proof = runState.lastArtifactProof;
  return runState.runUUID === binding.runUUID
    && proof?.runUUID === runState.runUUID
    && proof?.operation === expectedOperation
    && proof?.manifestSha256 === binding.receiptSha256?.[expectedOperation]
    && proof?.producerSha256 === binding.producerSha256?.[expectedOperation]
    && proof?.artifactPairSha256 === pairSha256
    && proof?.fixtureMode === "smoke"
    && proof?.debug === true
    && proof?.platform === "ios"
    && installedIdentityMatches === true
    && installedMetadataVerified === true;
}

export function canRestoreModifiedPairCandidate({
  ownedRunState,
  approvalBound,
  originalBackupVerified,
  installMayHaveStarted,
  installedFixtureIdentityVerified,
}) {
  return ownedRunState === true && approvalBound === true && originalBackupVerified === true
    && installMayHaveStarted === true && installedFixtureIdentityVerified === true;
}

function collectSourcePaths(root) {
  const listed = runCapture("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root }).stdout;
  const files = new Set(listed.split("\0").filter(Boolean).filter((entryPath) => !entryPath.split("/").some((part) =>
    part === ".git" || part === ".agent" || part === ".aws" || part.startsWith(".env"))));
  const iosRoot = path.join(root, "ios");
  const visit = (directory, prefix) => {
    for (const name of readdirSync(directory).sort()) {
      if (IOS_OUTPUT_DIRECTORIES.has(name)) continue;
      const filename = path.join(directory, name);
      const relative = `${prefix}/${name}`;
      const stat = lstatSync(filename);
      if (stat.isDirectory()) visit(filename, relative);
      else if (stat.isFile() || stat.isSymbolicLink()) files.add(relative);
    }
  };
  visit(iosRoot, "ios");
  for (const fixturePath of [".maestro/acm-native-fixture-create.yaml", ".maestro/acm-native-fixture-resume.yaml"]) {
    if (!existsSync(path.join(root, fixturePath))) throw new Error(`artifact_fixture_source_missing:${fixturePath}`);
    files.add(fixturePath);
  }
  return [...files].sort();
}

function sourceEntry(filename) {
  const stat = lstatSync(filename);
  const mode = (stat.mode & 0o7777).toString(8).padStart(4, "0");
  if (stat.isSymbolicLink()) {
    const target = readlinkSync(filename);
    return Object.freeze({ type: "symlink", mode, sha256: sha256Text(`symlink\0${target}`) });
  }
  if (!stat.isFile()) throw new Error("artifact_source_entry_not_file");
  return Object.freeze({ type: "file", mode, sha256: sha256File(filename) });
}

function applyAppMetadata(appPath, config, runUUID, operation) {
  const configPath = path.join(appPath, "EXConstants.bundle/app.config");
  const configMode = lstatSync(configPath).mode & 0o7777;
  writeFileSync(configPath, `${JSON.stringify(config)}\n`);
  chmodSync(configPath, configMode);
  const info = path.join(appPath, "Info.plist");
  const plistBuddy = "/usr/libexec/PlistBuddy";
  for (const [key, value] of [
    ["PatternlyRuntimeMode", "smoke"],
    ["PatternlyACMNativeFixture", "true"],
    ["PatternlyACMNativeFixtureRunUUID", runUUID.toLowerCase()],
    ["PatternlyACMNativeFixtureOperation", operation],
  ]) {
    const present = runCapture(plistBuddy, ["-c", `Print :${key}`, info], { cwd: ROOT, allowNonzero: true });
    if (present.status !== 0) throw new Error(`artifact_base_info_plist_missing_key:${key}`);
    runCapture(plistBuddy, ["-c", `Set :${key} ${value}`, info], { cwd: ROOT });
  }
}

function verifyEmbeddedMetadata(appPath, runUUID, operation) {
  const plistPackage = require(path.join(ROOT, "node_modules/@expo/plist"));
  const plist = plistPackage.default ?? plistPackage;
  const info = plist.parse(readFileSync(path.join(appPath, "Info.plist"), "utf8"));
  const config = readJson(path.join(appPath, "EXConstants.bundle/app.config"));
  if (info.PatternlyRuntimeMode !== "smoke" || info.PatternlyACMNativeFixture !== true
    || info.PatternlyACMNativeFixtureRunUUID?.toLowerCase() !== runUUID.toLowerCase()
    || info.PatternlyACMNativeFixtureOperation !== operation
    || config.extra?.patternlyRuntime !== "smoke" || config.updates?.enabled !== false
    || config.updates?.checkAutomatically !== "NEVER" || Object.hasOwn(config.updates, "url")
    || config.extra?.patternlyACMNativeFixture?.enabled !== true
    || config.extra?.patternlyACMNativeFixture?.runUUID?.toLowerCase() !== runUUID.toLowerCase()
    || config.extra?.patternlyACMNativeFixture?.operation !== operation
    || config.ios?.infoPlist?.PatternlyACMNativeFixture !== true
    || config.ios?.infoPlist?.PatternlyACMNativeFixtureRunUUID?.toLowerCase() !== runUUID.toLowerCase()
    || config.ios?.infoPlist?.PatternlyACMNativeFixtureOperation !== operation) {
    throw new Error("artifact_embedded_metadata_mismatch");
  }
}

export function verifyPairCandidateMetadata(appPath, runUUID, operation) {
  validateIdentity(operation, runUUID);
  verifyEmbeddedMetadata(appPath, runUUID.toLowerCase(), operation);
  return true;
}

function assertEquivalentFixtureConfig(actual, expected, runUUID, operation) {
  assertResolvedFixtureConfig(actual, runUUID, operation);
  assertResolvedFixtureConfig(expected, runUUID, operation);
  const ignore = (value) => {
    const clone = structuredClone(value);
    clone.extra.patternlyACMNativeFixture.runUUID = "<run-id>";
    clone.extra.patternlyACMNativeFixture.operation = "<operation>";
    clone.ios.infoPlist.PatternlyACMNativeFixtureRunUUID = "<run-id>";
    clone.ios.infoPlist.PatternlyACMNativeFixtureOperation = "<operation>";
    return clone;
  };
  if (canonicalJson(ignore(actual)) !== canonicalJson(ignore(expected))) throw new Error("artifact_resolved_expo_config_drift");
}

function assertResolvedFixtureConfig(config, runUUID, operation) {
  if (config.extra?.patternlyRuntime !== "smoke" || config.updates?.enabled !== false
    || config.updates?.checkAutomatically !== "NEVER" || Object.hasOwn(config.updates, "url")
    || config.extra?.patternlyACMNativeFixture?.runUUID?.toLowerCase() !== runUUID.toLowerCase()
    || config.extra?.patternlyACMNativeFixture?.operation !== operation
    || config.ios?.infoPlist?.PatternlyACMNativeFixtureRunUUID?.toLowerCase() !== runUUID.toLowerCase()
    || config.ios?.infoPlist?.PatternlyACMNativeFixtureOperation !== operation
    || config.ios?.infoPlist?.PatternlyACMNativeFixture !== true) {
    throw new Error("artifact_resolved_expo_config_invalid");
  }
}

function readSmokeFirebaseConfig(workspaceRoot) {
  const plistPackage = require(path.join(workspaceRoot, "node_modules/@expo/plist"));
  const plist = plistPackage.default ?? plistPackage;
  const firebase = plist.parse(readFileSync(path.join(workspaceRoot, "ios/Patternly/GoogleService-Info.plist"), "utf8"));
  if (typeof firebase.PROJECT_ID !== "string" || !firebase.PROJECT_ID.trim()
    || typeof firebase.GOOGLE_APP_ID !== "string" || !firebase.GOOGLE_APP_ID.trim()) {
    throw new Error("artifact_smoke_firebase_identity_missing");
  }
  return firebase;
}

function makeBuildEnvironment(base, temporaryDirectory, runUUID, operation) {
  const result = {};
  for (const key of PRIVATE_COMMAND_ENV_KEYS) if (typeof base?.[key] === "string") result[key] = base[key];
  result.PATH ??= process.env.PATH ?? "/usr/bin:/bin";
  result.HOME ??= os.homedir();
  result.TMPDIR = temporaryDirectory;
  Object.assign(result, {
    EXPO_NO_DOTENV: "1",
    EXPO_OFFLINE: "1",
    NODE_ENV: "development",
    BABEL_ENV: "development",
    PATTERNLY_RUNTIME_MODE: "smoke",
    EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
    EAS_BUILD_PLATFORM: "ios",
    EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
    EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:1",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:1",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: base.EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: base.EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: base.EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE: "1",
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID: runUUID.toLowerCase(),
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION: operation,
  });
  for (const key of ["EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID", "EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID", "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN"]) {
    if (typeof result[key] !== "string" || !result[key].trim()) throw new Error("artifact_smoke_build_identity_missing");
  }
  return result;
}

function signPreservingIdentity(appPath, baseApp, identity, operationRoot) {
  const entitlementsPath = path.join(operationRoot, "base-entitlements.plist");
  const result = spawnSync("/usr/bin/codesign", ["-d", "--entitlements", ":-", baseApp], { encoding: "utf8" });
  const xml = result.stdout ?? "";
  if (result.status !== 0) throw new Error("artifact_base_entitlements_unreadable");
  const parsed = parseCodesignEntitlementsOutput(xml, path.join(baseApp, "Patternly"), result.stderr ?? "");
  if (parsed.entitlementsCanonical !== identity.entitlementsCanonical) throw new Error("artifact_base_entitlements_identity_mismatch");
  writeFileSync(entitlementsPath, `${parsed.xml}\n`, { mode: 0o600, flag: "wx" });
  runCapture("/usr/bin/codesign", ["--force", "--sign", "-", "--entitlements", entitlementsPath,
    "--preserve-metadata=identifier,flags,runtime", appPath], { cwd: ROOT });
}

function readAppIdentity(appPath) {
  const plistPackage = require(path.join(ROOT, "node_modules/@expo/plist"));
  const plist = plistPackage.default ?? plistPackage;
  const info = plist.parse(runCapture("/usr/bin/plutil", ["-convert", "xml1", "-o", "-", path.join(appPath, "Info.plist")], { cwd: ROOT }).stdout);
  const signatureResult = spawnSync("/usr/bin/codesign", ["-dv", "--verbose=4", appPath], { encoding: "utf8" });
  const signature = `${signatureResult.stdout ?? ""}${signatureResult.stderr ?? ""}`;
  if (signatureResult.status !== 0) throw new Error("artifact_signature_identity_unreadable");
  const signatureIdentity = parseCodesignStableIdentity(signature, path.join(appPath, "Patternly"));
  const entitlementsResult = spawnSync("/usr/bin/codesign", ["-d", "--entitlements", ":-", appPath], { encoding: "utf8" });
  const entitlementsXml = entitlementsResult.stdout ?? "";
  if (entitlementsResult.status !== 0) throw new Error("artifact_entitlements_unreadable");
  const parsedEntitlements = parseCodesignEntitlementsOutput(entitlementsXml, path.join(appPath, "Patternly"), entitlementsResult.stderr ?? "");
  return createAppIdentity(info, signatureIdentity, parsedEntitlements);
}

function verifyMachOPayload(baseApp, candidateApp, operationRoot) {
  const base = machOManifest(baseApp);
  const candidate = machOManifest(candidateApp);
  if (canonicalJson(Object.keys(base).sort()) !== canonicalJson(Object.keys(candidate).sort())) {
    throw new Error("artifact_macho_path_set_changed");
  }
  for (const [relative, entry] of Object.entries(base)) {
    if (relative !== "Patternly" && entry.sha256 !== candidate[relative].sha256) {
      throw new Error(`artifact_native_payload_changed:${relative}`);
    }
  }
  const before = path.join(operationRoot, "unsigned-base-executable");
  const after = path.join(operationRoot, "unsigned-candidate-executable");
  copyFileSync(path.join(baseApp, "Patternly"), before);
  copyFileSync(path.join(candidateApp, "Patternly"), after);
  runCapture("/usr/bin/codesign", ["--remove-signature", before], { cwd: ROOT });
  runCapture("/usr/bin/codesign", ["--remove-signature", after], { cwd: ROOT });
  if (sha256File(before) !== sha256File(after)) throw new Error("artifact_native_executable_payload_changed");
  return Object.freeze({
    machoPathSet: Object.keys(base).sort(),
    fullMachOHashes: base,
    unsignedMainExecutableSha256: sha256File(before),
    unsignedMainExecutableIdentical: true,
  });
}

function machOManifest(root) {
  const result = {};
  for (const entry of createTreeManifest(root)) {
    if (entry.type !== "file") continue;
    const fullPath = path.join(root, entry.path);
    const fileType = runCapture("/usr/bin/file", ["-b", fullPath], { cwd: ROOT }).stdout;
    if (fileType.includes("Mach-O")) result[entry.path] = Object.freeze({ sha256: entry.sha256, type: fileType.trim() });
  }
  return result;
}

function estimateOperationBudget(baseEntries, baseApp) {
  const baseBytes = baseEntries.reduce((sum, entry) => entry.type === "file" ? sum + lstatSync(path.join(baseApp, entry.path)).size : sum, 0);
  const bundleBytes = lstatSync(path.join(baseApp, "main.jsbundle")).size;
  return (2 * baseBytes) + (4 * bundleBytes) + (512 * 1024 ** 2) + (64 * 1024 ** 2);
}

async function runMonitored(command, args, { cwd, env, logPath }) {
  const log = await import("node:fs").then(({ createWriteStream }) => createWriteStream(logPath, { flags: "wx", mode: 0o600 }));
  const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.pipe(log);
  child.stderr.pipe(log);
  let lowSpace = false;
  const monitor = setInterval(() => {
    try {
      if (availableBytes(cwd) <= EMERGENCY_FREE_BYTES && child.exitCode === null && child.signalCode === null) {
        lowSpace = true;
        child.kill("SIGINT");
      }
    } catch {
      lowSpace = true;
      child.kill("SIGINT");
    }
  }, 1000);
  const outcome = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolve({ code, signal }));
  }).finally(() => clearInterval(monitor));
  await new Promise((resolve) => log.end(resolve));
  if (lowSpace) throw new Error("artifact_emergency_disk_guard_during_build");
  if (outcome.code !== 0) throw new Error(`artifact_command_failed:${path.basename(command)}:${outcome.code ?? outcome.signal}`);
}

function runCapture(command, args, { cwd, env = process.env, allowNonzero = false, stdoutPath } = {}) {
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  if (result.error || (!allowNonzero && result.status !== 0)) throw new Error(`artifact_command_failed:${path.basename(command)}:${result.status ?? "start"}`);
  if (stdoutPath) writeFileSync(stdoutPath, result.stdout ?? "", { mode: 0o600, flag: "wx" });
  return Object.freeze({ status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" });
}

function verifyStrictSignature(appPath) {
  runCapture("/usr/bin/codesign", ["--verify", "--deep", "--strict", appPath], { cwd: ROOT });
}

function isHermesBytecode(filename) {
  const description = runCapture("/usr/bin/file", ["-b", filename], { cwd: ROOT }).stdout;
  return /Hermes JavaScript bytecode, version 98/u.test(description);
}

function embeddedBundleSha256(appPath) {
  return sha256File(path.join(appPath, "main.jsbundle"));
}

function packageVersion(filename) {
  return readJson(filename).version;
}

function producerDigest(sourceRoot, workspaceRoot, expoVersion, expoCliVersion, hermesVersion, args) {
  const tooling = QA_TOOLING_PATHS.map((entryPath) => ({ path: entryPath, sha256: sha256File(path.join(sourceRoot, entryPath)) }));
  const hermes = path.join(workspaceRoot, "node_modules/hermes-compiler/hermesc/osx-bin/hermesc");
  const expoCli = path.join(workspaceRoot, "node_modules/expo/node_modules/@expo/cli/build/bin/cli");
  const payload = {
    tooling,
    expoVersion,
    expoCliVersion,
    expoCliSha256: sha256File(expoCli),
    hermesVersion,
    hermesExecutableSha256: sha256File(hermes),
    args,
  };
  return Object.freeze({ ...payload, sha256: sha256Text(canonicalJson(payload)) });
}

function verifyHistoricalProducer(receipt, operation, pairRoot, workspaceRoot) {
  const producer = receipt.producer;
  if (!producer || !/^[a-f0-9]{64}$/u.test(producer.sha256 ?? "") || !Array.isArray(producer.tooling)) {
    throw new Error(`artifact_pair_historical_producer_invalid:${operation}`);
  }
  const tooling = producer.tooling;
  if (tooling.length !== QA_TOOLING_PATHS.length
    || canonicalJson(tooling.map(({ path: entryPath }) => entryPath).sort()) !== canonicalJson([...QA_TOOLING_PATHS].sort())
    || tooling.some(({ sha256 }) => !/^[a-f0-9]{64}$/u.test(sha256 ?? ""))) {
    throw new Error(`artifact_pair_historical_tooling_mismatch:${operation}`);
  }
  const hermes = path.join(workspaceRoot, "node_modules/hermes-compiler/hermesc/osx-bin/hermesc");
  const expoCli = path.join(workspaceRoot, "node_modules/expo/node_modules/@expo/cli/build/bin/cli");
  const payload = {
    tooling,
    expoVersion: producer.expoVersion,
    expoCliVersion: producer.expoCliVersion,
    expoCliSha256: sha256File(expoCli),
    hermesVersion: producer.hermesVersion,
    hermesExecutableSha256: sha256File(hermes),
    args: producer.args,
  };
  if (sha256Text(canonicalJson(payload)) !== producer.sha256
    || payload.expoCliSha256 !== producer.expoCliSha256
    || payload.hermesExecutableSha256 !== producer.hermesExecutableSha256) {
    throw new Error(`artifact_pair_historical_producer_digest_mismatch:${operation}`);
  }
}

function validateIdentity(operation, runUUID) {
  if (!FIXTURE_OPERATIONS.includes(operation) || !UUID_V4.test(runUUID ?? "")) throw new Error("artifact_fixture_identity_invalid");
}

function assertPrivateDirectory(directory) {
  const stat = lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink() || (stat.mode & 0o077) !== 0) throw new Error("artifact_private_parent_must_be_mode_0700");
}

function ensurePrivateDirectory(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
  assertPrivateDirectory(directory);
}

function assertWithin(target, parent, label) {
  const targetReal = realpathSync(target);
  const parentReal = realpathSync(parent);
  if (targetReal !== parentReal && !targetReal.startsWith(`${parentReal}${path.sep}`)) throw new Error(`artifact_${label}_outside_private_root`);
}

function availableBytes(directory) {
  const output = runCapture("df", ["-Pk", directory], { cwd: ROOT }).stdout.trim().split("\n").at(-1);
  const kib = Number(output?.trim().split(/\s+/u)[3]);
  if (!Number.isFinite(kib)) throw new Error("artifact_disk_space_unreadable");
  return kib * 1024;
}

function readJson(filename) {
  try { return JSON.parse(readFileSync(filename, "utf8")); }
  catch { throw new Error(`artifact_json_invalid:${path.basename(filename)}`); }
}

function writePrivateJson(filename, value) {
  writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600, flag: "wx" });
  chmodSync(filename, 0o600);
}

function sameEntry(a, b) {
  if (!a || !b || a.path !== b.path || a.type !== b.type || a.mode !== b.mode) return false;
  return a.type === "symlink" ? a.target === b.target : a.sha256 === b.sha256;
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

function sha256File(filename) {
  return createHash("sha256").update(readFileSync(filename)).digest("hex");
}

function sha256Text(text) {
  return createHash("sha256").update(text).digest("hex");
}
