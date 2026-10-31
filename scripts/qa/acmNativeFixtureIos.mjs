#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import {
  chmodSync,
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveCocoaPodsRuntime } from "./acmNativeFixtureCocoaPods.mjs";
import { assertRemotePodLockUnchanged, canonicalJson } from "./acmNativeFixturePodLock.mjs";
import { applyExpoDebugSocketPatch } from "./acmNativeFixtureExpoDebugSocketPatch.mjs";
import {
  PINNED_NATIVE_BASE,
  assertArtifactPairApproval,
  canRestoreModifiedPairCandidate,
  pairCandidateInstallProofForRestore,
  pairCandidateOperationForRestore,
  prepareArtifactVariant,
  validateExistingArtifactPair,
  verifyPairCandidateMetadata,
} from "./acmNativeFixtureIosArtifact.mjs";

const require = createRequire(import.meta.url);
const APP_ID = "com.lkurczab.patternly";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PRIVATE_ROOT = path.resolve(ROOT, "../.agent/private/acm-native-fixture-ios");
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const DEVICE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;
const PREFLIGHT_OUTPUTS = new Set([
  "Patternly/AppDelegate.swift",
  "Patternly/Info.plist",
  "Patternly/PrivacyInfo.xcprivacy",
  "Patternly/Supporting/Expo.plist",
  "Patternly/Patternly.entitlements",
  "Patternly.xcodeproj/project.pbxproj",
]);
const LOCAL_POD = "PatternlyForegroundClock";
const MIN_REMAINING_BYTES = 4 * 1024 ** 3;
const IOS_BUILD_OUTPUT_DIRECTORIES = new Set(["Pods", "build", "Build", "DerivedData", "Index.noindex", "Logs", "xcuserdata"]);
const REQUIRED_IOS_INPUTS = [
  "ios/Podfile",
  "ios/Podfile.lock",
  "ios/Podfile.properties.json",
  "ios/Patternly.xcodeproj/project.pbxproj",
  "ios/Patternly.xcworkspace/contents.xcworkspacedata",
  "ios/Patternly/AppDelegate.swift",
  "ios/Patternly/Info.plist",
  "ios/Patternly/GoogleService-Info.plist",
  "ios/.xcode.env",
  "ios/.xcode.env.local",
];
const FIXTURE_FLOWS = [
  ".maestro/acm-native-fixture-create.yaml",
  ".maestro/acm-native-fixture-resume.yaml",
];
const PAIR_PREEXECUTION_SIDECARS = Object.freeze([
  "cache-cleanup-receipt.json",
  "create-plan-output-receipt.json",
  "create-plan-output.json",
  "create-plan-output.txt",
  "execute-predevice-block.json",
  "historical-sidecar-cache-cleanup-receipt.json",
  "post-cleanup-plan-validation.json",
  "pre-execute-stop-note.json",
]);

const parsed = parseArguments(process.argv.slice(2));
if (parsed.help) {
  printHelp();
  process.exit(0);
}
if (parsed.fingerprint) {
  const fingerprint = sourceFingerprint();
  process.stdout.write(`${JSON.stringify({ schema: "patternly.acm-native-fixture-source-fingerprint.v1", ...fingerprint })}\n`);
  process.exit(0);
}
if (parsed.inputProbe) {
  validateInvocation(parsed);
  await createInputProbe(parsed);
  process.exit(0);
}
if (parsed.plan) {
  validateInvocation(parsed);
  printPlan(parsed);
  process.exit(0);
}
if (parsed.restore) {
  validateInvocation(parsed);
  const approvalReceipt = readCoordinatorApproval(parsed.approval, parsed, { allowSourceDrift: true });
  await restoreOriginalApp(parsed, approvalReceipt);
  process.exit(0);
}
  if (!parsed.execute) throw new Error("Choose --help, --fingerprint, --input-probe, --plan, --execute, or --restore.");
validateInvocation(parsed);
const approval = readCoordinatorApproval(parsed.approval, parsed);
await executePhase(parsed, approval);

function parseArguments(args) {
  const result = { help: false, fingerprint: false, inputProbe: false, plan: false, execute: false, restore: false };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (["--help", "-h"].includes(argument)) result.help = true;
    else if (argument === "--fingerprint") result.fingerprint = true;
    else if (argument === "--input-probe") result.inputProbe = true;
    else if (argument === "--plan") result.plan = true;
    else if (argument === "--execute") result.execute = true;
    else if (argument === "--restore") result.restore = true;
    else if (["--phase", "--run-id", "--udid", "--approval", "--artifact-pair"].includes(argument)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--")) throw new Error(`${argument} requires a value.`);
      result[({ "--phase": "phase", "--run-id": "runId", "--udid": "udid", "--approval": "approval", "--artifact-pair": "artifactPair" })[argument]] = value;
      index += 1;
    } else throw new Error(`Unknown argument: ${argument}`);
  }
  if (Number([result.help, result.fingerprint, result.inputProbe, result.plan, result.execute, result.restore].filter(Boolean).length) !== 1) {
    throw new Error("Choose exactly one of --help, --fingerprint, --input-probe, --plan, --execute, or --restore.");
  }
  if (result.artifactPair && !(result.inputProbe || result.plan || result.execute)) {
    throw new Error("--artifact-pair is only accepted for pair probe, plan, or execute.");
  }
  return result;
}

function printHelp() {
  process.stdout.write(`ACM native fixture iOS runner (source-stage only until an approval receipt is issued)

Commands:
  node scripts/qa/acmNativeFixtureIos.mjs --help
  node scripts/qa/acmNativeFixtureIos.mjs --fingerprint
  node scripts/qa/acmNativeFixtureIos.mjs --input-probe --run-id <UUIDv4> [--artifact-pair <private-pair-directory>]
  node scripts/qa/acmNativeFixtureIos.mjs --plan --phase create|resume --run-id <UUIDv4> --udid <iPhone-17-UDID> [--artifact-pair <private-pair-directory>]
  PATTERNLY_ACM_NATIVE_FIXTURE_COORDINATOR_TOKEN=<token> node scripts/qa/acmNativeFixtureIos.mjs --execute --phase create|resume --run-id <UUIDv4> --udid <iPhone-17-UDID> --approval <private-json>
  PATTERNLY_ACM_NATIVE_FIXTURE_COORDINATOR_TOKEN=<same-token> node scripts/qa/acmNativeFixtureIos.mjs --restore --run-id <UUIDv4> --udid <same-iPhone-17-UDID> --approval <private-json>

--plan and --fingerprint are read-only. --input-probe creates a private source/input copy and hash manifest only; it does not access a simulator or app data. --execute and --restore require Q source and fixture acceptance plus a matching coordinator token receipt. The runner never erases or uninstalls a simulator. It stages the current source and actual ignored iOS inputs in a private workspace and retains logs and candidates for review. --restore reinstalls only the saved original .app code bundle in place, without touching app data or Keychain, then restores the simulator's initial boot state.
`);
}

function validateInvocation(options) {
  if (options.inputProbe) {
    if (!UUID_V4.test(options.runId ?? "")) throw new Error("--input-probe requires --run-id with a UUIDv4.");
    if (options.phase || options.udid || options.approval) throw new Error("--input-probe accepts only --run-id and optional --artifact-pair.");
    if (options.artifactPair && !options.inputProbe) throw new Error("--artifact-pair is only accepted for pair probe, plan, or execute.");
    return;
  }
  if (!options.restore && !["create", "resume"].includes(options.phase ?? "")) throw new Error("--phase must be create or resume.");
  if (options.restore && options.phase) throw new Error("--restore cannot be combined with --phase.");
  if (!UUID_V4.test(options.runId ?? "")) throw new Error("--run-id must be a lowercase or uppercase UUIDv4.");
  if (!DEVICE_UUID.test(options.udid ?? "")) throw new Error("--udid must be a simulator UDID.");
  if ((options.execute || options.restore) && !options.approval) throw new Error("--execute or --restore requires a coordinator approval receipt path.");
  if (options.restore && options.artifactPair) throw new Error("--restore discovers pair run state by UUID; omit --artifact-pair.");
  if (options.artifactPair && !(options.plan || options.execute)) throw new Error("--artifact-pair is only accepted for pair probe, plan, or execute.");
}

function printPlan({ phase, runId, udid, artifactPair }) {
  const runDirectory = artifactPair ? pairRunDirectory(runId) : standardRunDirectory(runId);
  const stageRoot = path.join(runDirectory, "workspace", phase);
  const inputSnapshot = path.join(runDirectory, "input-snapshot");
  const operation = phase;
  const env = [
    "EXPO_NO_DOTENV=1",
    "PATTERNLY_RUNTIME_MODE=smoke",
    "EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE=smoke",
    "EAS_BUILD_PLATFORM=ios",
    "EXPO_PUBLIC_PATTERNLY_BACKEND_E2E=true",
    "EXPO_PUBLIC_PATTERNLY_API_ORIGIN=http://127.0.0.1:1",
    "EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN=http://127.0.0.1:1",
    "EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE=1",
    `EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID=${runId.toLowerCase()}`,
    `EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION=${operation}`,
  ];
  const flow = `.maestro/acm-native-fixture-${phase}.yaml`;
  let pair = null;
  if (artifactPair) pair = validatePair(artifactPair, runId);
  if (pair) {
    process.stdout.write([
      `phase: ${phase}`, `run id: ${runId.toLowerCase()}`, `existing iPhone 17 UDID: ${udid}`,
      `pair run directory: ${runDirectory}`, `reviewed artifact pair: ${pair.pairRoot}`,
      `artifact pair SHA-256: ${pair.pairSha256}`,
      `candidate app: ${pair.variants[phase].appPath}`,
      `candidate receipt SHA-256: ${pair.variants[phase].receiptSha256}`,
      `current full source fingerprint: ${pair.binding.currentSourceFingerprint}`,
      `current full source file count: ${pair.binding.currentSourceFileCount}`,
      `current runtime source SHA-256: ${pair.binding.runtimeSourceSha256}`,
      `current native input SHA-256: ${pair.binding.nativeInputSha256}`,
      `current Pods manifest SHA-256: ${pair.binding.podsManifestSha256}`,
      `historical producer SHA-256: ${pair.variants[phase].producerSha256}`,
      `restore command discovers pair run state by UUID and omits --artifact-pair`,
      `Maestro flow: ${flow}`,
      "plan is read-only; no device, build, export, Xcode, or Pods operation was performed.",
    ].join("\n") + "\n");
    return;
  }
  process.stdout.write([
    `phase: ${phase}`,
    `run id: ${runId.toLowerCase()}`,
    `existing iPhone 17 UDID: ${udid}`,
    `private run directory: ${runDirectory}`,
    ...(pair ? [`reviewed artifact pair: ${pair.pairRoot}`, `artifact pair SHA-256: ${pair.pairSha256}`, `create receipt SHA-256: ${pair.variants.create.receiptSha256}`, `resume receipt SHA-256: ${pair.variants.resume.receiptSha256}`] : []),
    `immutable approved input snapshot: ${inputSnapshot}`,
    `staged workspace: ${stageRoot}`,
    `pinned native Debug base: ${PINNED_NATIVE_BASE.appPath}`,
    `native base content tree SHA-256: ${PINNED_NATIVE_BASE.contentTreeSha256}`,
    `native base mode manifest SHA-256: ${PINNED_NATIVE_BASE.modeManifestSha256}`,
    `flow: ${flow}`,
    `input probe (private source only, before any device action): node scripts/qa/acmNativeFixtureIos.mjs --input-probe --run-id ${runId.toLowerCase()}`,
    "environment (explicit inert smoke configuration):",
    ...env.map((value) => `  ${value}`),
    "candidate producer: Expo export:embed --dev true and the pinned Hermes compiler; no Xcode native build fallback.",
    "execute command (only after approval receipt and coordinator token are issued):",
    `  PATTERNLY_ACM_NATIVE_FIXTURE_COORDINATOR_TOKEN=<fresh-token> node scripts/qa/acmNativeFixtureIos.mjs --execute --phase ${phase} --run-id ${runId.toLowerCase()} --udid ${udid} --approval <private-approval.json>`,
    `restore original app after evidence: PATTERNLY_ACM_NATIVE_FIXTURE_COORDINATOR_TOKEN=<same-token> node scripts/qa/acmNativeFixtureIos.mjs --restore --run-id ${runId.toLowerCase()} --udid ${udid} --approval <private-approval.json>`,
    "execution is still gated by Q source/fixture acceptance and a coordinator token receipt.",
  ].join("\n") + "\n");
}

function sourceFingerprint() {
  const files = sourceInputFiles(ROOT);
  return sourceFingerprintAt(ROOT, files);
}

function sourceFingerprintAt(workspaceRoot, files) {
  const podsInventory = inventoryTree(path.join(workspaceRoot, "ios/Pods"));
  const hash = createHash("sha256");
  let byteCount = 0;
  for (const relative of files) {
    hash.update(relative).update("\0");
    const entry = inputEntry(path.join(workspaceRoot, relative));
    hash.update(entry.sha256).update("\0");
    byteCount += entry.bytes;
  }
  for (const [relative, digest] of [...podsInventory].sort(([a], [b]) => a.localeCompare(b))) {
    hash.update(`ios/Pods/${relative}`).update("\0").update(digest).update("\0");
    if (!digest.startsWith("symlink:")) byteCount += statSync(path.join(workspaceRoot, "ios/Pods", relative)).size;
  }
  return { sha256: hash.digest("hex"), fileCount: files.length + podsInventory.size, byteCount, podsFileCount: podsInventory.size };
}

function sourceInputFiles(workspaceRoot = ROOT) {
  const files = new Set(versionedAndUnignoredFiles(workspaceRoot));
  for (const relative of discoverIosInputs(workspaceRoot)) files.add(relative);
  for (const relative of FIXTURE_FLOWS) {
    if (!existsSync(path.join(workspaceRoot, relative))) throw new Error(`Required fixture flow is missing: ${relative}`);
    files.add(relative);
  }
  return [...files].sort();
}

function versionedAndUnignoredFiles(workspaceRoot = ROOT) {
  const output = runCapture("git", ["ls-files", "-co", "--exclude-standard", "-z"], workspaceRoot);
  return output.split("\0").filter(Boolean).filter((relative) => !isPrivateInput(relative));
}

function discoverIosInputs(workspaceRoot) {
  const iosRoot = path.join(workspaceRoot, "ios");
  if (!existsSync(iosRoot)) throw new Error("The actual iOS project directory is missing.");
  const files = [];
  const walk = (directory, relativeDirectory = "ios") => {
    for (const name of readdirSync(directory).sort()) {
      if (IOS_BUILD_OUTPUT_DIRECTORIES.has(name)) continue;
      const absolute = path.join(directory, name);
      const relative = `${relativeDirectory}/${name}`;
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) walk(absolute, relative);
      else if (stat.isFile() || stat.isSymbolicLink()) files.push(relative);
    }
  };
  walk(iosRoot);
  return files;
}

function inputEntry(filename) {
  const stat = lstatSync(filename);
  if (stat.isSymbolicLink()) {
    const target = readlinkSync(filename);
    return { sha256: createHash("sha256").update(`symlink\0${target}`).digest("hex"), bytes: Buffer.byteLength(target), kind: "symlink" };
  }
  if (!stat.isFile()) throw new Error(`Source input is not a regular file or symlink: ${path.basename(filename)}`);
  return { sha256: createHash("sha256").update(readFileSync(filename)).digest("hex"), bytes: stat.size, kind: "file" };
}

function inputManifest(workspaceRoot, fingerprint, files) {
  const fileEntries = files.map((relative) => ({ path: relative, ...inputEntry(path.join(workspaceRoot, relative)) }));
  const pods = inventoryTree(path.join(workspaceRoot, "ios/Pods"));
  const requiredFiles = Object.fromEntries(REQUIRED_IOS_INPUTS.map((relative) => [relative, existsSync(path.join(workspaceRoot, relative))]));
  if (Object.values(requiredFiles).some((present) => !present)) {
    const missing = Object.entries(requiredFiles).filter(([, present]) => !present).map(([relative]) => relative);
    throw new Error(`Required actual iOS input(s) are missing from the staged workspace: ${missing.join(", ")}`);
  }
  return {
    schema: "patternly.acm-native-fixture-ios-input-manifest.v1",
    sourceFingerprint: fingerprint.sha256,
    sourceFileCount: fingerprint.fileCount,
    sourceByteCount: fingerprint.byteCount,
    iosPodsFileCount: pods.size,
    files: fileEntries,
    requiredFiles,
  };
}

async function createInputProbe(options) {
  const runId = options.runId.toLowerCase();
  const runDirectory = options.artifactPair ? pairRunDirectory(runId) : standardRunDirectory(runId);
  const inputSnapshot = path.join(runDirectory, "input-snapshot");
  if (existsSync(PRIVATE_ROOT)) assertPrivateDirectory(PRIVATE_ROOT);
  else mkdirPrivate(PRIVATE_ROOT);
  const refreshExistingProbe = existsSync(runDirectory);
  if (refreshExistingProbe && (!options.artifactPair || !isRefreshablePairProbe(runDirectory))) {
    throw new Error("This UUID has execution or unrecognized private state; refusing to replace it.");
  }
  const activeProbeExists = existsSync(path.join(runDirectory, "input-snapshot"))
    && existsSync(path.join(runDirectory, "input-manifest.json"));
  for (const relative of REQUIRED_IOS_INPUTS) {
    if (!existsSync(path.join(ROOT, relative))) throw new Error(`Required actual iOS input is missing: ${relative}`);
  }
  if (!existsSync(path.join(ROOT, "ios/Pods")) || !existsSync(path.join(ROOT, "node_modules"))) {
    throw new Error("Input probe requires existing ios/Pods and node_modules; it will not create either baseline.");
  }
  const before = sourceFingerprint();
  const pair = options.artifactPair ? validatePair(options.artifactPair, runId) : null;
  if (refreshExistingProbe && activeProbeExists) {
    const oldManifest = readPrivateJson(path.join(runDirectory, "input-manifest.json"));
    if (oldManifest.artifactPair.path !== path.resolve(ROOT, options.artifactPair)) {
      throw new Error("The stale probe is bound to a different reviewed pair path; refusing to switch pair identity.");
    }
    if (oldManifest.sourceFingerprint === before.sha256 && oldManifest.artifactPair?.pairSha256 === pair.pairSha256) {
      throw new Error("The retained pair input probe already matches current source and pair bindings; refusing to replace it.");
    }
    archiveStalePairProbe(runDirectory, oldManifest, before, pair);
  }
  const requiredBudget = MIN_REMAINING_BYTES + before.byteCount + 128 * 1024 ** 2;
  const freeBefore = availableBytes(ROOT);
  if (freeBefore < requiredBudget) {
    throw new Error(`Input-probe disk gate: require 4 GiB free after a worst-case ${Math.ceil((before.byteCount + 128 * 1024 ** 2) / 1024 ** 2)} MiB source copy; currently ${Math.floor(freeBefore / 1024 ** 3)} GiB free.`);
  }
  if (!refreshExistingProbe) mkdirPrivate(runDirectory);
  const cloneProbe = path.join(runDirectory, "copy-capability");
  mkdirPrivate(cloneProbe);
  runCapture("cp", ["-c", path.join(ROOT, "ios/Pods/Manifest.lock"), path.join(cloneProbe, "Manifest.lock")], ROOT);
  const originalProbe = inputEntry(path.join(ROOT, "ios/Pods/Manifest.lock"));
  const copiedProbe = inputEntry(path.join(cloneProbe, "Manifest.lock"));
  if (originalProbe.sha256 !== copiedProbe.sha256 || originalProbe.bytes !== copiedProbe.bytes) {
    throw new Error("macOS copy-on-write probe did not reproduce the existing Pods manifest; private stage is blocked.");
  }
  rmSync(cloneProbe, { recursive: true, force: true });
  stageWorkspace(inputSnapshot);
  const paths = sourceInputFiles(ROOT);
  const staged = sourceFingerprintAt(inputSnapshot, paths);
  if (staged.sha256 !== before.sha256 || staged.fileCount !== before.fileCount) {
    throw new Error("Private stage source/input hashes do not match the current workspace; retained stage for review.");
  }
  const manifest = inputManifest(inputSnapshot, staged, paths);
  if (options.artifactPair) {
    const after = validatePair(options.artifactPair, runId);
    if (pair.pairSha256 !== after.pairSha256) throw new Error("Reviewed artifact pair changed during input probe; retained stage for review.");
  } else {
    const phaseWorkspace = path.join(runDirectory, "workspace/create");
    stageBuildWorkspace(inputSnapshot, phaseWorkspace, staged.sha256);
  }
  const freeAfter = availableBytes(ROOT);
  if (freeAfter < MIN_REMAINING_BYTES) throw new Error("Private input staging consumed the disk reserve; retained stage and stopped.");
  writePrivateJson(path.join(runDirectory, "input-manifest.json"), {
    ...manifest,
    ...(pair ? { artifactPair: { path: path.resolve(options.artifactPair), pairSha256: pair.pairSha256, binding: pair.binding } }
      : { phaseWorkspacePath: "workspace/create", phaseWorkspaceFingerprint: staged.sha256 }),
    copyStrategy: "macOS cp -cR for private APP inputs and node_modules; byte and hash equality verified",
    sourceFreeBytesBefore: freeBefore,
    sourceFreeBytesAfter: freeAfter,
    podsLogicalBytes: staged.byteCount - manifest.files.reduce((sum, entry) => sum + entry.bytes, 0),
  });
  process.stdout.write(`Private iOS ${pair ? "reviewed-pair " : ""}source/input probe passed for ${runId}. ${manifest.files.length} source files plus ${manifest.iosPodsFileCount} Pods entries are hash-bound; required inputs are present.${pair ? ` Pair SHA-256: ${pair.pairSha256}.` : ""} No simulator, build, prebuild, Pod install, or app data was accessed.\n`);
}

function isRefreshablePairProbe(runDirectory) {
  if (existsSync(path.join(runDirectory, "run.json"))) return false;
  const allowed = new Set(["input-snapshot", "input-manifest.json", "probe-archive", "authorization", ...PAIR_PREEXECUTION_SIDECARS]);
  if (readdirSync(runDirectory).some((name) => !allowed.has(name))) return false;
  const snapshotPath = path.join(runDirectory, "input-snapshot");
  const manifestPath = path.join(runDirectory, "input-manifest.json");
  const hasSnapshot = existsSync(snapshotPath);
  const hasManifest = existsSync(manifestPath);
  if (hasSnapshot !== hasManifest) return false;
  try {
    const authorizationDirectory = path.join(runDirectory, "authorization");
    assertPrivateDirectory(authorizationDirectory);
    const authorizationFiles = readdirSync(authorizationDirectory).sort();
    const tokenPath = path.join(authorizationDirectory, "coordinator-token.private");
    const tokenStat = lstatSync(tokenPath);
    const tokenPrivate = tokenStat.isFile() && !tokenStat.isSymbolicLink()
      && (tokenStat.mode & 0o077) === 0 && (!process.getuid || tokenStat.uid === process.getuid());
    if (!hasSnapshot && !hasManifest) {
      const archiveRoot = path.join(runDirectory, "probe-archive");
      assertPrivateDirectory(archiveRoot);
      return readdirSync(runDirectory).sort().join(",") === "authorization,probe-archive"
        && authorizationFiles.join(",") === "coordinator-token.private" && tokenPrivate;
    }
    assertPrivateDirectory(snapshotPath);
    const manifest = readPrivateJson(manifestPath);
    const stopNote = readPrivateJson(path.join(runDirectory, "pre-execute-stop-note.json"));
    const executionBlock = readPrivateJson(path.join(runDirectory, "execute-predevice-block.json"));
    const hasApproval = authorizationFiles.includes("coordinator-approval.json");
    const hasGeneration = authorizationFiles.includes("authorization-generation-receipt.json");
    const allowedAuthorizationSets = [
      "authorization-generation-receipt.json,coordinator-approval.json,coordinator-token.private",
      "coordinator-token.private",
    ];
    let approval = null;
    let generation = null;
    let approvalSha256 = null;
    let approvalManifestBindingsMatch = !hasApproval && !hasGeneration;
    if (hasApproval && hasGeneration) {
      approval = readPrivateJson(path.join(authorizationDirectory, "coordinator-approval.json"));
      generation = readPrivateJson(path.join(authorizationDirectory, "authorization-generation-receipt.json"));
      approvalSha256 = createHash("sha256").update(readFileSync(path.join(authorizationDirectory, "coordinator-approval.json"))).digest("hex");
      approvalManifestBindingsMatch = approval.schema === "patternly.acm-native-fixture-reviewed-pair-authorization.v1"
        && approval.status === "APPROVED" && approval.runUUID === manifest.artifactPair.binding.runUUID
        && approval.sourceFingerprint === manifest.sourceFingerprint && approval.sourceFileCount === manifest.sourceFileCount
        && approval.artifactPairSha256 === manifest.artifactPair.pairSha256
        && generation.schema === "patternly.acm-native-fixture-pair-authorization-generation.v1"
        && generation.approvalSha256 === approvalSha256
        && generation.inputManifestSha256 === createHash("sha256").update(readFileSync(manifestPath)).digest("hex")
        && generation.artifactPairSha256 === manifest.artifactPair.pairSha256
        && generation.sourceFingerprint === manifest.sourceFingerprint && generation.sourceFileCount === manifest.sourceFileCount;
    }
    const effects = executionBlock.deviceEffects;
    return manifest.schema === "patternly.acm-native-fixture-ios-input-manifest.v1"
      && Boolean(manifest.artifactPair?.pairSha256)
      && !manifest.phaseWorkspacePath
      && allowedAuthorizationSets.includes(authorizationFiles.join(",")) && tokenPrivate
      && approvalManifestBindingsMatch
      && stopNote.schema === "patternly.acm-native-fixture-ios-pre-execute-stop.v1"
      && stopNote.decision === "STOP_BEFORE_DEVICE_AND_APPROVAL"
      && stopNote.deviceActionStarted === false && stopNote.runStateCreated === false
      && stopNote.restoreRequired === false
      && executionBlock.schema === "patternly.acm-native-fixture-execute-predevice-block.v1"
      && executionBlock.status === "PENDING_TOOL_REVIEW_NO_DEVICE_ACTION"
      && effects?.runStateCreated === false && effects?.simulatorReadOrMutated === false
      && effects?.appInstalled === false && effects?.buildExportXcodePodsOrMaestroStarted === false
      && effects?.restoreRequired === false;
  } catch {
    return false;
  }
}

function archiveStalePairProbe(runDirectory, oldManifest, currentFingerprint, pair) {
  const archiveRoot = path.join(runDirectory, "probe-archive");
  mkdirPrivate(archiveRoot);
  const oldManifestPath = path.join(runDirectory, "input-manifest.json");
  const oldManifestSha256 = createHash("sha256").update(readFileSync(oldManifestPath)).digest("hex");
  const archiveName = `${Date.now()}-${oldManifestSha256.slice(0, 12)}`;
  const archiveDirectory = path.join(archiveRoot, archiveName);
  mkdirPrivate(archiveDirectory);
  const priorSidecars = path.join(archiveDirectory, "prior-sidecars");
  mkdirPrivate(priorSidecars);
  const authorizationPath = path.join(runDirectory, "authorization");
  const approvalPath = path.join(authorizationPath, "coordinator-approval.json");
  const generationPath = path.join(authorizationPath, "authorization-generation-receipt.json");
  let approvalSha256 = null;
  let generationSha256 = null;
  const hasApproval = existsSync(approvalPath);
  const hasGeneration = existsSync(generationPath);
  if (hasApproval !== hasGeneration) throw new Error("Stale probe approval evidence is incomplete; refusing to archive it.");
  renameSync(path.join(runDirectory, "input-snapshot"), path.join(archiveDirectory, "input-snapshot"));
  renameSync(oldManifestPath, path.join(archiveDirectory, "input-manifest.json"));
  if (hasApproval) {
    const priorAuthorization = path.join(priorSidecars, "authorization");
    mkdirPrivate(priorAuthorization);
    approvalSha256 = createHash("sha256").update(readFileSync(approvalPath)).digest("hex");
    generationSha256 = createHash("sha256").update(readFileSync(generationPath)).digest("hex");
    renameSync(approvalPath, path.join(priorAuthorization, "coordinator-approval.json"));
    renameSync(generationPath, path.join(priorAuthorization, "authorization-generation-receipt.json"));
  }
  for (const name of PAIR_PREEXECUTION_SIDECARS) {
    const source = path.join(runDirectory, name);
    if (existsSync(source)) renameSync(source, path.join(priorSidecars, name));
  }
  writePrivateJson(path.join(archiveDirectory, "refresh-receipt.json"), {
    schema: "patternly.acm-native-fixture-ios-pair-probe-refresh.v1",
    runUUID: oldManifest.artifactPair.binding?.runUUID ?? null,
    previousSourceFingerprint: oldManifest.sourceFingerprint,
    previousPairSha256: oldManifest.artifactPair.pairSha256,
    previousManifestSha256: oldManifestSha256,
    previousApprovalSha256: approvalSha256,
    previousAuthorizationGenerationSha256: generationSha256,
    refreshedSourceFingerprint: currentFingerprint.sha256,
    refreshedPairSha256: pair.pairSha256,
    reason: "stale pre-execution probe; run.json, backup, logs and execution evidence absent",
  });
}

function verifyInputProbe(runDirectory, expectedFingerprint) {
  const workspace = path.join(runDirectory, "input-snapshot");
  const manifestPath = path.join(runDirectory, "input-manifest.json");
  if (!existsSync(workspace) || !existsSync(manifestPath)) throw new Error("Private input probe is incomplete; no simulator access is allowed.");
  assertPrivateDirectory(workspace);
  const manifest = readPrivateJson(manifestPath);
  if (manifest.schema !== "patternly.acm-native-fixture-ios-input-manifest.v1") throw new Error("Private input manifest schema is invalid.");
  const files = sourceInputFiles(ROOT);
  const current = sourceFingerprintAt(ROOT, files);
  const staged = sourceFingerprintAt(workspace, files);
  if (manifest.sourceFingerprint !== expectedFingerprint || current.sha256 !== expectedFingerprint
    || staged.sha256 !== expectedFingerprint || current.fileCount !== manifest.sourceFileCount
    || staged.fileCount !== manifest.sourceFileCount || current.byteCount !== manifest.sourceByteCount
    || staged.byteCount !== manifest.sourceByteCount) {
    throw new Error("Private input manifest, approved source hash, and staged workspace do not match.");
  }
  const expectedManifest = inputManifest(workspace, staged, files);
  if (canonicalJson(expectedManifest.files) !== canonicalJson(manifest.files)
    || canonicalJson(expectedManifest.requiredFiles) !== canonicalJson(manifest.requiredFiles)
    || expectedManifest.iosPodsFileCount !== manifest.iosPodsFileCount) {
    throw new Error("Private input manifest entries or actual iOS required-input presence changed.");
  }
  return Object.freeze({
    sourceFingerprint: current.sha256,
    sourceFileCount: current.fileCount,
    podsFingerprint: hashDirectory(path.join(ROOT, "ios/Pods")),
    manifestSha256: createHash("sha256").update(readFileSync(manifestPath)).digest("hex"),
    artifactPair: manifest.artifactPair ?? null,
  });
}

function standardRunDirectory(runId) { return path.join(PRIVATE_ROOT, runId.toLowerCase()); }
function pairRunDirectory(runId) { return path.join(PRIVATE_ROOT, "pair-runs", runId.toLowerCase()); }

function validatePair(pairPath, runId) {
  const sourceRoot = ROOT;
  const fingerprint = sourceFingerprintAt(sourceRoot, sourceInputFiles(sourceRoot));
  return validateExistingArtifactPair({
    pairRoot: path.resolve(ROOT, pairPath),
    runUUID: runId,
    sourceRoot,
    currentSourceFingerprint: fingerprint.sha256,
    currentSourceFileCount: fingerprint.fileCount,
  });
}

function stageBuildWorkspace(inputSnapshot, workspace, expectedFingerprint, { reuseIfVerified = false } = {}) {
  const paths = sourceInputFiles(ROOT);
  if (existsSync(workspace)) {
    if (!reuseIfVerified) throw new Error("This phase already has a private build workspace; refusing to overwrite retained evidence.");
    const snapshot = sourceFingerprintAt(inputSnapshot, paths);
    const existing = sourceFingerprintAt(workspace, paths);
    if (existing.sha256 !== expectedFingerprint || snapshot.sha256 !== expectedFingerprint
      || existing.fileCount !== snapshot.fileCount || existing.byteCount !== snapshot.byteCount) {
      throw new Error("Existing pre-staged create workspace does not match its private input snapshot.");
    }
    ensurePrivateNodeModulesCopy(workspace);
    return;
  }
  const budget = sourceFingerprintAt(inputSnapshot, sourceInputFiles(ROOT));
  const nodeModulesBytes = directoryLogicalBytes(path.join(ROOT, "node_modules"));
  const requiredBudget = MIN_REMAINING_BYTES + budget.byteCount + nodeModulesBytes + 64 * 1024 ** 2;
  if (availableBytes(ROOT) < requiredBudget) throw new Error("Disk gate stopped phase workspace copy; the 4 GiB reserve would not remain available.");
  mkdirPrivate(path.dirname(workspace));
  runCapture("cp", ["-cR", inputSnapshot, workspace], ROOT);
  const staged = sourceFingerprintAt(workspace, paths);
  if (staged.sha256 !== expectedFingerprint || staged.fileCount !== budget.fileCount || staged.byteCount !== budget.byteCount) {
    throw new Error("Phase workspace copy differs from the approved private input snapshot; retained for review.");
  }
  ensurePrivateNodeModulesCopy(workspace);
  if (availableBytes(ROOT) < MIN_REMAINING_BYTES) throw new Error("Phase workspace copy consumed the disk reserve; retained stage and stopped.");
}

function ensurePrivateNodeModulesCopy(workspace) {
  const source = path.join(ROOT, "node_modules");
  const staged = path.join(workspace, "node_modules");
  if (!existsSync(source) || !lstatSync(source).isDirectory()) throw new Error("Existing APP node_modules directory is required for a private COW stage.");
  const sourceSha256 = hashDirectory(source);
  const sourceBytes = directoryLogicalBytes(source);
  const stagedStat = lstatSync(staged);
  if (!stagedStat.isSymbolicLink()) {
    if (!stagedStat.isDirectory() || realpathSync(staged) === realpathSync(source)
      || hashDirectory(staged) !== sourceSha256 || directoryLogicalBytes(staged) !== sourceBytes) {
      throw new Error("Private node_modules directory does not match the canonical source; refusing to run build tools.");
    }
    return;
  }
  if (realpathSync(staged) !== realpathSync(source)) throw new Error("Pre-staged node_modules link does not point to the canonical APP dependencies.");
  if (availableBytes(ROOT) < MIN_REMAINING_BYTES + sourceBytes + 64 * 1024 ** 2) {
    throw new Error("Disk gate stopped private node_modules copy; the 4 GiB reserve would not remain available.");
  }
  rmSync(staged);
  runCapture("cp", ["-cR", source, staged], ROOT);
  const copiedStat = lstatSync(staged);
  if (!copiedStat.isDirectory() || copiedStat.isSymbolicLink() || realpathSync(staged) === realpathSync(source)
    || hashDirectory(staged) !== sourceSha256 || directoryLogicalBytes(staged) !== sourceBytes
    || availableBytes(ROOT) < MIN_REMAINING_BYTES) {
    throw new Error("Private copy-on-write node_modules verification failed; retained stage and stopped.");
  }
}

function isPrivateInput(relative) {
  const normalized = relative.replaceAll("\\", "/");
  return normalized.split("/").some((part) => part === ".git" || part === ".agent" || part === ".aws" || part.startsWith(".env"));
}

function readCoordinatorApproval(filename, options, { allowSourceDrift = false } = {}) {
  const token = process.env.PATTERNLY_ACM_NATIVE_FIXTURE_COORDINATOR_TOKEN;
  if (typeof token !== "string" || token.length < 32) throw new Error("A fresh coordinator token of at least 32 characters is required in PATTERNLY_ACM_NATIVE_FIXTURE_COORDINATOR_TOKEN.");
  const absolute = path.resolve(ROOT, filename);
  const stat = statSync(absolute);
  const parentStat = statSync(path.dirname(absolute));
  if (process.getuid && stat.uid !== process.getuid()) throw new Error("Coordinator approval receipt must be owned by the current user.");
  if ((stat.mode & 0o077) !== 0) throw new Error("Coordinator approval receipt must have mode 0600 or stricter.");
  if ((parentStat.mode & 0o077) !== 0 || (process.getuid && parentStat.uid !== process.getuid())) throw new Error("Coordinator approval directory must be current-user-owned and mode 0700 or stricter.");
  let receipt;
  try { receipt = JSON.parse(readFileSync(absolute, "utf8")); }
  catch { throw new Error("Coordinator approval receipt is not valid JSON."); }
  const current = allowSourceDrift ? null : sourceFingerprint();
  const pairMode = Boolean(options.artifactPair) || (options.restore && receipt.schema === "patternly.acm-native-fixture-reviewed-pair-authorization.v1");
  const pair = options.artifactPair ? validatePair(options.artifactPair, options.runId) : null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const standardKeys = "coordinatorTokenSha256,identityContract,qFixtureAcceptance,qSourceReview,runUUID,schema,sourceFileCount,sourceFingerprint,status,udid";
  const pairKeys = "artifactPairSha256,coordinatorTokenSha256,identityContract,nativeInputSha256,podsManifestSha256,qFixtureAcceptance,qSourceReview,runUUID,runtimeSourceSha256,schema,sourceFileCount,sourceFingerprint,status,udid";
  if (Object.keys(receipt).sort().join(",") !== (pairMode ? pairKeys : standardKeys)
    || receipt.schema !== (pairMode ? "patternly.acm-native-fixture-reviewed-pair-authorization.v1" : "patternly.acm-native-fixture-authorization.v1") || receipt.status !== "APPROVED"
    || receipt.qSourceReview !== "PASS" || receipt.qFixtureAcceptance !== "PASS" || receipt.identityContract !== "PASS"
    || !/^[a-f0-9]{64}$/u.test(receipt.sourceFingerprint ?? "") || !Number.isInteger(receipt.sourceFileCount)
    || (!allowSourceDrift && (receipt.sourceFingerprint !== current.sha256 || receipt.sourceFileCount !== current.fileCount))
    || receipt.runUUID !== options.runId.toLowerCase() || receipt.udid !== options.udid
    || receipt.coordinatorTokenSha256 !== tokenHash) {
    throw new Error("Coordinator receipt does not approve this frozen source, fixture identity, run UUID, and UDID.");
  }
  const receiptSha256 = createHash("sha256").update(readFileSync(absolute)).digest("hex");
  if (pair) assertArtifactPairApproval(receipt, pair);
  if (pairMode && options.restore) {
    const runDirectory = resolveRestoreRunDirectory(options.runId);
    const state = readPrivateJson(path.join(runDirectory, "run.json"));
    if (state.pairMode !== true || !state.artifactPairBinding || receipt.artifactPairSha256 !== state.artifactPairBinding.pairSha256
      || receipt.runtimeSourceSha256 !== state.artifactPairBinding.binding.runtimeSourceSha256
      || receipt.nativeInputSha256 !== state.artifactPairBinding.binding.nativeInputSha256
      || receipt.podsManifestSha256 !== state.artifactPairBinding.binding.podsManifestSha256
      || receipt.sourceFingerprint !== state.sourceFingerprint || receipt.sourceFileCount !== state.sourceFileCount) {
      throw new Error("Pair restore approval does not match the run's token, UUID, source and reviewed pair binding.");
    }
  }
  return Object.freeze({ receiptPath: absolute, receiptSha256, sourceFingerprint: current?.sha256 ?? receipt.sourceFingerprint,
    sourceFileCount: current?.fileCount ?? receipt.sourceFileCount, artifactPair: pair, pairMode, receipt });
}

function resolveRestoreRunDirectory(runId) {
  const candidates = [standardRunDirectory(runId), pairRunDirectory(runId)].filter((directory) => existsSync(path.join(directory, "run.json")));
  if (candidates.length !== 1) throw new Error("Restore run UUID must resolve to exactly one retained run state.");
  return candidates[0];
}

async function executePhase(options, approval) {
  if (!options.artifactPair) requireMacBuildTools();
  const runId = options.runId.toLowerCase();
  const runDirectory = options.artifactPair ? pairRunDirectory(runId) : standardRunDirectory(runId);
  const inputSnapshot = path.join(runDirectory, "input-snapshot");
  const workspace = path.join(runDirectory, "workspace", options.phase);
  const stageMarker = path.join(runDirectory, "run.json");
  const logDirectory = path.join(runDirectory, "logs");
  const evidenceDirectory = path.join(runDirectory, "evidence", options.phase);
  if (existsSync(PRIVATE_ROOT)) assertPrivateDirectory(PRIVATE_ROOT);
  else mkdirPrivate(PRIVATE_ROOT);
  if (!existsSync(runDirectory)) throw new Error("Run UUID has no successful private input probe; run --input-probe before any simulator access.");
  assertPrivateDirectory(runDirectory);
  const stagedInputs = verifyInputProbe(runDirectory, approval.sourceFingerprint);
  const pair = options.artifactPair ? validatePair(options.artifactPair, runId) : null;
  if (pair && (!stagedInputs.artifactPair || stagedInputs.artifactPair.pairSha256 !== pair.pairSha256
    || approval.artifactPair?.pairSha256 !== pair.pairSha256)) throw new Error("Reviewed pair does not match the probed and approved pair binding.");
  if (options.phase === "create") {
    if (existsSync(stageMarker)) throw new Error("This run UUID already has an execution receipt; refusing to replace it.");
  } else {
    if (!existsSync(stageMarker)) throw new Error("Resume execution receipt is missing.");
  }
  if (!pair) stageBuildWorkspace(inputSnapshot, workspace, stagedInputs.sourceFingerprint, { reuseIfVerified: options.phase === "create" });
  const expoPatch = pair ? null : applyExpoDebugSocketPatch({
    workspace,
    privateRoot: PRIVATE_ROOT,
    canonicalNodeModules: path.join(ROOT, "node_modules"),
    runUUID: runId,
    operation: options.phase,
  });
  if (!pair) writePrivateJson(path.join(runDirectory, "snapshots", `expo-debug-socket-patch-${options.phase}.json`), expoPatch);
  mkdirPrivate(logDirectory);
  mkdirPrivate(path.dirname(evidenceDirectory));
  mkdirPrivate(evidenceDirectory);
  if (!existsSync(path.join(ROOT, "ios/Pods"))) throw new Error("The existing pinned local Pods checkout is required; the runner will not create a new Pods baseline.");
  const environment = pair ? null : smokeBuildEnvironment(runId, options.phase, workspace);
  const smokeConfig = pair ? null : verifySmokeExpoConfig(workspace, environment, runId, options.phase);

  let runState;
  if (options.phase === "create") {
    const initialDeviceState = readExistingIPhone17(options.udid).state;
    runState = {
      schema: "patternly.acm-native-fixture-ios-run.v1",
      runUUID: runId,
      udid: options.udid,
      appId: APP_ID,
      phase: "preflight",
      approvalSha256: approval.receiptSha256,
      inputManifestSha256: stagedInputs.manifestSha256,
      sourceFingerprint: stagedInputs.sourceFingerprint,
      sourceFileCount: stagedInputs.sourceFileCount,
      podsFingerprint: stagedInputs.podsFingerprint,
      initialDeviceState,
      ...(pair ? { pairMode: true, artifactPairBinding: { pairSha256: pair.pairSha256, binding: pair.binding } } : {}),
    };
    writePrivateJson(stageMarker, runState);
    ensureDeviceBooted(options.udid, initialDeviceState, logDirectory);
    requireInstalledApp(options.udid);
    assertFreeSpace(4 * 1024 ** 3, "before private workspace staging");
    const originalApp = captureOriginalApp(runDirectory, options.udid);
    Object.assign(runState, {
      originalAppPath: originalApp.path,
      originalAppIdentity: originalApp.identity,
      originalAppSha256: originalApp.sha256,
    });
    writePrivateJson(stageMarker, runState);
    Object.assign(runState, {
      phase: "staged",
      createAppIdentity: null,
      createAppSha256: null,
    });
    writePrivateJson(stageMarker, runState);
  } else {
    if (!pair && !existsSync(workspace)) throw new Error("Resume needs the retained create-stage workspace.");
    runState = readPrivateJson(stageMarker);
    if (!runState.initialDeviceState || !runState.originalAppSha256 || !runState.originalAppIdentity) throw new Error("Run receipt lacks the hash-bound original app needed for safe teardown.");
    if (runState.schema !== "patternly.acm-native-fixture-ios-run.v1" || runState.runUUID !== runId || runState.udid !== options.udid
      || runState.phase !== "create-session-active" || runState.sourceFingerprint !== stagedInputs.sourceFingerprint
      || runState.sourceFileCount !== stagedInputs.sourceFileCount || runState.podsFingerprint !== stagedInputs.podsFingerprint
      || runState.inputManifestSha256 !== stagedInputs.manifestSha256
      || runState.approvalSha256 !== approval.receiptSha256) {
      throw new Error("Resume approval or source/run/device state does not match the accepted create stage.");
    }
    if (pair && (runState.pairMode !== true || runState.artifactPairBinding?.pairSha256 !== pair.pairSha256)) {
      throw new Error("Resume reviewed pair does not match the retained create run binding.");
    }
    ensureDeviceBooted(options.udid, runState.initialDeviceState, logDirectory);
    requireInstalledApp(options.udid);
  }

  if (sourceFingerprint().sha256 !== stagedInputs.sourceFingerprint) throw new Error("APP source or iOS inputs changed after the private input probe.");
  let artifact;
  if (pair) {
    artifact = pair.variants[options.phase];
  } else {
  const generatedBefore = inventoryTree(path.join(workspace, "ios"));
  writePrivateJson(path.join(runDirectory, "snapshots", `ios-before-${options.phase}.json`), inventoryRecord(generatedBefore));
  runLogged("expo prebuild", "node", ["./node_modules/expo/bin/cli", "prebuild", "--platform", "ios", "--no-clean", "--no-install"], {
    cwd: workspace,
    env: environment,
    logPath: path.join(logDirectory, `prebuild-${options.phase}.log`),
  });
  const generatedAfter = inventoryTree(path.join(workspace, "ios"));
  writePrivateJson(path.join(runDirectory, "snapshots", `ios-after-${options.phase}.json`), inventoryRecord(generatedAfter));
  const changed = changedPaths(generatedBefore, generatedAfter);
  writePrivateJson(path.join(runDirectory, "snapshots", `ios-changed-${options.phase}.json`), { changedPaths: changed });
  const unexpected = changed.filter((file) => !PREFLIGHT_OUTPUTS.has(file));
  if (unexpected.length) throw new Error(`iOS prebuild changed unexpected staged paths; retained stage for review: ${unexpected.join(", ")}`);
  validateGeneratedFixtureMetadata(workspace, runId, options.phase, smokeConfig.version);

  const lockPath = path.join(workspace, "ios/Podfile.lock");
  const lockBefore = readFileSync(lockPath, "utf8");
  const cocoaPods = resolveCocoaPodsRuntime(ROOT);
  runLogged("pod install", cocoaPods.command, [...cocoaPods.args, "install", "--no-repo-update"], {
    cwd: path.join(workspace, "ios"),
    env: cocoaPods.env,
    logPath: path.join(logDirectory, `pods-${options.phase}.log`),
  });
  assertRemotePodLockUnchanged(lockBefore, readFileSync(lockPath, "utf8"));
  artifact = await prepareArtifactVariant({
    workspaceRoot: workspace,
    sourceRoot: ROOT,
    sourceSnapshotRoot: inputSnapshot,
    sourceManifestPath: path.join(runDirectory, "input-manifest.json"),
    nativeBaseApp: PINNED_NATIVE_BASE.appPath,
    nativeBasePin: PINNED_NATIVE_BASE,
    privateRunDirectory: runDirectory,
    operation: options.phase,
    runUUID: runId,
    smokeConfig,
    buildEnvironment: environment,
  });
  }
  runState.lastArtifactProof = {
    runUUID: runId,
    operation: options.phase,
    fixtureMode: "smoke",
    debug: pair ? artifact.debug : artifact.toolchain?.dev === true,
    platform: pair ? artifact.platform : artifact.toolchain?.platform,
    manifestPath: pair ? path.relative(pair.pairRoot, artifact.receiptPath) : path.relative(runDirectory, artifact.receiptPath),
    manifestSha256: pair ? artifact.receiptSha256 : createHash("sha256").update(readFileSync(artifact.receiptPath)).digest("hex"),
    nativeBaseContentTreeSha256: pair ? pair.binding.nativeBaseContentTreeSha256 : artifact.nativeBase.contentTreeSha256,
    nativeBaseModeManifestSha256: pair ? pair.binding.nativeBaseModeManifestSha256 : artifact.nativeBase.modeManifestSha256,
    runtimeSourceSha256: pair ? pair.binding.runtimeSourceSha256 : artifact.sourceBinding.runtimeSourceSha256,
    nativeInputSha256: pair ? pair.binding.nativeInputSha256 : artifact.sourceBinding.nativeInputSha256,
    producerSha256: pair ? artifact.producerSha256 : artifact.producer.sha256,
    ...(pair ? { artifactPairSha256: pair.pairSha256 } : {}),
  };
  writePrivateJson(stageMarker, runState);
  {
    const candidatePath = artifact.appPath;
    const embeddedBundleSha256 = embeddedMainBundleSha256(candidatePath);
    const candidateIdentity = appIdentity(candidatePath);
    if (options.phase === "create") {
      const installedIdentity = appIdentity(installedAppPath(options.udid));
      assertSameAppIdentity(installedIdentity, candidateIdentity, "create candidate versus installed baseline");
      runState.phase = "create-install-in-flight";
      runState.createAppIdentity = candidateIdentity;
      runState.createAppSha256 = hashDirectory(candidatePath);
      runState.createEmbeddedBundleSha256 = embeddedBundleSha256;
      writePrivateJson(stageMarker, runState);
      installInPlace(options.udid, candidatePath, path.join(logDirectory, "simctl-install-create.log"));
      assertInstalledEmbeddedBundleSha256(options.udid, embeddedBundleSha256);
      runState.phase = "create-installed";
      writePrivateJson(stageMarker, runState);
      runMaestro(options.udid, pair ? path.join(ROOT, `.maestro/acm-native-fixture-create.yaml`) : path.join(workspace, `.maestro/acm-native-fixture-create.yaml`), evidenceDirectory);
      runState.phase = "create-session-active";
    } else {
      const installedIdentity = appIdentity(installedAppPath(options.udid));
      assertSameAppIdentity(runState.createAppIdentity, candidateIdentity, "resume candidate versus create binary");
      assertSameAppIdentity(installedIdentity, candidateIdentity, "resume candidate versus currently installed create binary");
      runState.phase = "resume-install-in-flight";
      runState.resumeAppIdentity = candidateIdentity;
      runState.resumeAppSha256 = hashDirectory(candidatePath);
      runState.resumeEmbeddedBundleSha256 = embeddedBundleSha256;
      writePrivateJson(stageMarker, runState);
      installInPlace(options.udid, candidatePath, path.join(logDirectory, "simctl-install-resume.log"));
      assertInstalledEmbeddedBundleSha256(options.udid, embeddedBundleSha256);
      runState.phase = "resume-installed";
      writePrivateJson(stageMarker, runState);
      runMaestro(options.udid, pair ? path.join(ROOT, `.maestro/acm-native-fixture-resume.yaml`) : path.join(workspace, `.maestro/acm-native-fixture-resume.yaml`), evidenceDirectory);
      runState.phase = "resume-session-restored";
    }
  }
  runState.lastOperation = options.phase;
  runState.lastApprovalSha256 = approval.receiptSha256;
  runState.lastUpdatedAt = new Date().toISOString();
  writePrivateJson(stageMarker, runState);
  process.stdout.write(`ACM native fixture ${options.phase} phase completed; private logs and candidates retained at ${runDirectory}.\n`);
}

async function restoreOriginalApp(options, approval) {
  if (process.platform !== "darwin") throw new Error("Original iOS app restoration requires macOS.");
  const runId = options.runId.toLowerCase();
  const runDirectory = resolveRestoreRunDirectory(runId);
  const stageMarker = path.join(runDirectory, "run.json");
  const logDirectory = path.join(runDirectory, "logs");
  assertPrivateDirectory(PRIVATE_ROOT);
  assertPrivateDirectory(runDirectory);
  const runState = readPrivateJson(stageMarker);
  if (runState.schema !== "patternly.acm-native-fixture-ios-run.v1" || runState.runUUID !== runId
    || runState.udid !== options.udid || runState.appId !== APP_ID || runState.approvalSha256 !== approval.receiptSha256) {
    throw new Error("Restore approval does not match this run's original device, app, and receipt.");
  }
  const initialDeviceState = runState.initialDeviceState;
  ensureDeviceBooted(options.udid, initialDeviceState, logDirectory);

  if (!runState.originalAppSha256 || !runState.originalAppIdentity || !runState.originalAppPath) {
    if (runState.phase !== "preflight") throw new Error("Original app backup is missing after an install could have started; refusing to guess a restore binary.");
    await restoreInitialDeviceState(options.udid, initialDeviceState, logDirectory);
    runState.phase = "no-install-original-state-restored";
    runState.restoredAt = new Date().toISOString();
    writePrivateJson(stageMarker, runState);
    process.stdout.write("No app install started and no baseline bundle was captured; restored the simulator's initial boot state.\n");
    return;
  }

  const backupPath = path.resolve(runDirectory, runState.originalAppPath);
  if (!backupPath.startsWith(`${runDirectory}${path.sep}`) || !existsSync(backupPath)) throw new Error("Hash-bound original app backup is missing or outside the private run directory.");
  const backupStat = lstatSync(backupPath);
  const backupRealPath = realpathSync(backupPath);
  const runRealPath = realpathSync(runDirectory);
  if (!backupStat.isDirectory() || backupStat.isSymbolicLink() || !backupRealPath.startsWith(`${runRealPath}${path.sep}`)) {
    throw new Error("Hash-bound original app backup is not a private directory owned by this run.");
  }
  const backupSha256 = hashDirectory(backupPath);
  const backupIdentity = appIdentity(backupPath);
  if (backupSha256 !== runState.originalAppSha256 || canonicalJson(backupIdentity) !== canonicalJson(runState.originalAppIdentity)) {
    throw new Error("Saved original app bundle hash or identity changed; refusing to install it.");
  }

  const installedPath = installedAppPath(options.udid);
  let installedSha256;
  let installedIdentity = null;
  try {
    installedSha256 = hashDirectory(installedPath);
    installedIdentity = appIdentity(installedPath);
    assertSameAppIdentity(runState.originalAppIdentity, installedIdentity, "currently installed app versus original baseline");
  } catch (error) {
    if (!installedSha256) installedSha256 = "unreadable";
    installedIdentity = null;
  }
  const knownHashes = new Set([runState.originalAppSha256, runState.createAppSha256, runState.resumeAppSha256].filter(Boolean));
  const unknownInstalledCandidate = !knownHashes.has(installedSha256);
  if (unknownInstalledCandidate) writePrivateJson(path.join(runDirectory, "recovery-evidence.json"), {
    schema: "patternly.acm-native-fixture-restore-recovery.v1", runUUID: runId,
    installedBundleHash: installedSha256, installedIdentity,
    identityReadable: installedIdentity !== null, category: "installed_bundle_not_matching_retained_hashes",
  });
  const approvalBound = approval.pairMode === true && approval.receipt?.artifactPairSha256 === runState.artifactPairBinding?.pairSha256
    && approval.receiptSha256 === runState.approvalSha256;
  const expectedInstalledOperation = pairCandidateOperationForRestore(runState);
  let installedMetadataVerified = false;
  if (expectedInstalledOperation && installedIdentity) {
    try {
      verifyPairCandidateMetadata(installedPath, runId, expectedInstalledOperation);
      installedMetadataVerified = true;
    } catch {
      installedMetadataVerified = false;
    }
  }
  const installedFixtureIdentityVerified = pairCandidateInstallProofForRestore({
    runState,
    expectedOperation: expectedInstalledOperation,
    installedIdentityMatches: Boolean(installedIdentity)
      && canonicalJson(installedIdentity) === canonicalJson(runState.originalAppIdentity),
    installedMetadataVerified,
  });
  const canRestoreUnknown = canRestoreModifiedPairCandidate({
    ownedRunState: runState.pairMode === true && runState.runUUID === runId && runState.udid === options.udid,
    approvalBound,
    originalBackupVerified: backupSha256 === runState.originalAppSha256
      && canonicalJson(backupIdentity) === canonicalJson(runState.originalAppIdentity),
    installMayHaveStarted: expectedInstalledOperation !== null,
    installedFixtureIdentityVerified,
  });
  if (unknownInstalledCandidate && !canRestoreUnknown) throw new Error("Installed app bundle is not a retained original or candidate; recovery evidence was retained and restore is blocked.");

  if (installedSha256 !== runState.originalAppSha256) {
    terminateAppIfRunning(options.udid, logDirectory);
    runLogged("restore original app in place", "xcrun", ["simctl", "install", options.udid, backupPath], {
      cwd: ROOT,
      env: minimalProcessEnvironment(),
      logPath: path.join(logDirectory, "simctl-restore-original-app.log"),
    });
  }
  const restoredPath = installedAppPath(options.udid);
  if (hashDirectory(restoredPath) !== runState.originalAppSha256
    || canonicalJson(appIdentity(restoredPath)) !== canonicalJson(runState.originalAppIdentity)) {
    throw new Error("Restored app bundle did not match its saved original hash and identity; simulator shutdown is withheld.");
  }
  await restoreInitialDeviceState(options.udid, initialDeviceState, logDirectory);
  runState.phase = "original-app-restored";
  runState.restoredAt = new Date().toISOString();
  runState.restoredAppSha256 = runState.originalAppSha256;
  writePrivateJson(stageMarker, runState);
  process.stdout.write(`Original ${APP_ID} app bundle restored in place and verified. App data and Keychain were not copied, erased, or uninstalled.\nInitial simulator state restored to ${initialDeviceState}. Candidates and logs remain at ${runDirectory}.\n`);
}

function terminateAppIfRunning(udid, logDirectory) {
  const logPath = path.join(logDirectory, "simctl-terminate-before-restore.log");
  const result = spawnSync("xcrun", ["simctl", "terminate", udid, APP_ID], { cwd: ROOT, env: minimalProcessEnvironment(), encoding: "utf8" });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  writeFileSync(logPath, output, { mode: 0o600 });
  if (result.error) throw new Error("Could not stop Patternly before restoring the saved app bundle.");
  if (result.status !== 0 && !/not running|no such process/iu.test(output)) throw new Error("Patternly termination failed; original app installation is blocked.");
}

async function restoreInitialDeviceState(udid, initialDeviceState, logDirectory) {
  const device = readExistingIPhone17(udid);
  if (initialDeviceState === "Shutdown" && device.state === "Booted") {
    runLogged("restore initial simulator shutdown state", "xcrun", ["simctl", "shutdown", udid], {
      cwd: ROOT,
      env: minimalProcessEnvironment(),
      logPath: path.join(logDirectory, "simctl-restore-shutdown-state.log"),
    });
    return;
  }
  if (initialDeviceState === "Booted" && device.state !== "Booted") throw new Error("Initial booted simulator state could not be restored.");
  if (!["Booted", "Shutdown"].includes(initialDeviceState)) throw new Error("Saved initial simulator state is invalid.");
}

function requireMacBuildTools() {
  if (process.platform !== "darwin") throw new Error("Native iOS fixture execution requires macOS.");
  for (const [command, args] of [["xcodebuild", ["-version"]], ["pod", ["--version"]], ["maestro", ["--version"]]]) {
    const result = spawnSync(command, args, { encoding: "utf8", env: minimalProcessEnvironment() });
    if (result.error || result.status !== 0) throw new Error(`${command} preflight failed; no build or device action was started.`);
  }
  require("yaml");
  require("@expo/plist");
}

function readExistingIPhone17(udid) {
  const devices = JSON.parse(runCapture("xcrun", ["simctl", "list", "devices", "available", "--json"], ROOT));
  const device = Object.values(devices.devices ?? {}).flat().find((entry) => entry.udid?.toLowerCase() === udid.toLowerCase());
  if (!device || device.name !== "iPhone 17" || !["Booted", "Shutdown"].includes(device.state)) {
    throw new Error("The supplied UDID must name the existing iPhone 17 in Booted or Shutdown state; this runner never creates a simulator.");
  }
  return device;
}

function ensureDeviceBooted(udid, initialDeviceState, logDirectory) {
  if (!["Booted", "Shutdown"].includes(initialDeviceState)) throw new Error("The recorded initial simulator state is unsupported.");
  const device = readExistingIPhone17(udid);
  if (device.state === "Booted") return;
  runLogged("boot existing iPhone 17", "xcrun", ["simctl", "boot", udid], {
    cwd: ROOT,
    env: minimalProcessEnvironment(),
    logPath: path.join(logDirectory, "simctl-boot.log"),
  });
  runLogged("wait for iPhone 17 boot", "xcrun", ["simctl", "bootstatus", udid, "-b"], {
    cwd: ROOT,
    env: minimalProcessEnvironment(),
    logPath: path.join(logDirectory, "simctl-bootstatus.log"),
  });
}

function requireInstalledApp(udid) {
  installedAppPath(udid);
}

function installedAppPath(udid) {
  const app = runCapture("xcrun", ["simctl", "get_app_container", udid, APP_ID, "app"], ROOT).trim();
  if (!app.endsWith(".app") || !existsSync(app)) throw new Error("The current Patternly app is not installed on the selected iPhone 17.");
  return app;
}

function captureOriginalApp(runDirectory, udid) {
  const installedPath = installedAppPath(udid);
  const beforeIdentity = appIdentity(installedPath);
  if (beforeIdentity.bundleIdentifier !== APP_ID) throw new Error("Installed baseline bundle ID does not match Patternly; no install will run.");
  const beforeSha256 = hashDirectory(installedPath);
  const appBytes = directoryLogicalBytes(installedPath);
  if (availableBytes(ROOT) < MIN_REMAINING_BYTES + appBytes + 64 * 1024 ** 2) {
    throw new Error("Disk gate stopped baseline app backup; the restore copy plus 4 GiB reserve would not fit.");
  }
  const backupRelativePath = path.join("original", "Patternly.app");
  const backupPath = path.join(runDirectory, backupRelativePath);
  mkdirPrivate(path.dirname(backupPath));
  runCapture("cp", ["-cR", installedPath, backupPath], ROOT);
  const backupSha256 = hashDirectory(backupPath);
  const afterIdentity = appIdentity(backupPath);
  if (beforeSha256 !== backupSha256 || canonicalJson(beforeIdentity) !== canonicalJson(afterIdentity)) {
    throw new Error("Hash-bound copy of the installed app bundle did not verify; install is blocked.");
  }
  return Object.freeze({ path: backupRelativePath, identity: afterIdentity, sha256: backupSha256 });
}

function stageWorkspace(destination) {
  const resolvedRoot = realpathSync(ROOT);
  mkdirPrivate(path.dirname(destination));
  mkdirPrivate(destination);
  const paths = sourceInputFiles(ROOT);
  for (const relative of paths) {
    const source = path.resolve(ROOT, relative);
    if (!source.startsWith(`${resolvedRoot}${path.sep}`)) throw new Error("Source manifest contains a path outside the APP root.");
    const target = path.join(destination, relative);
    mkdirSync(path.dirname(target), { recursive: true, mode: 0o700 });
    const stat = lstatSync(source);
    if (stat.isSymbolicLink()) {
      const link = readlinkSync(source);
      const linked = path.resolve(path.dirname(source), link);
      if (path.isAbsolute(link) || (linked !== resolvedRoot && !linked.startsWith(`${resolvedRoot}${path.sep}`))) {
        throw new Error(`Source symlink is absolute or escapes APP root: ${relative}`);
      }
      symlinkSync(link, target);
    } else if (stat.isFile()) {
      copyFileSync(source, target);
      chmodSync(target, stat.mode & 0o777);
    }
  }
  const pods = path.join(ROOT, "ios/Pods");
  if (!existsSync(pods)) throw new Error("The existing ignored ios/Pods input tree is required; no clean Pods tree will be generated.");
  runCapture("cp", ["-cR", pods, path.join(destination, "ios/Pods")], ROOT);
  const nodeModules = path.join(ROOT, "node_modules");
  if (!existsSync(nodeModules)) throw new Error("Install the existing APP dependencies before a future approved run.");
  symlinkSync(nodeModules, path.join(destination, "node_modules"), "dir");
  const project = path.join(destination, "ios/Patternly.xcworkspace/contents.xcworkspacedata");
  if (!existsSync(project)) throw new Error("Staged iOS workspace is missing; refusing to regenerate from a clean project.");
  for (const relative of REQUIRED_IOS_INPUTS) {
    if (!existsSync(path.join(destination, relative))) throw new Error(`Staged workspace is missing actual iOS input: ${relative}`);
  }
}

function inventoryTree(root) {
  const result = new Map();
  const walk = (directory, prefix = "") => {
    for (const name of readdirSync(directory).sort()) {
      const absolute = path.join(directory, name);
      const relative = prefix ? `${prefix}/${name}` : name;
      const stat = lstatSync(absolute);
      if (stat.isDirectory()) walk(absolute, relative);
      else if (stat.isFile()) result.set(relative, createHash("sha256").update(readFileSync(absolute)).digest("hex"));
      else if (stat.isSymbolicLink()) result.set(relative, `symlink:${readlinkSync(absolute)}`);
      else result.set(relative, `other:${stat.mode}`);
    }
  };
  walk(root);
  return result;
}

function changedPaths(before, after) {
  return [...new Set([...before.keys(), ...after.keys()])].filter((file) => before.get(file) !== after.get(file)).sort();
}

function inventoryRecord(inventory) {
  return Object.fromEntries([...inventory].sort(([left], [right]) => left.localeCompare(right)));
}

function validateGeneratedFixtureMetadata(workspace, runUUID, operation, expectedRuntimeVersion) {
  const plistModule = require("@expo/plist");
  const plist = plistModule.default ?? plistModule;
  const infoPath = path.join(workspace, "ios/Patternly/Info.plist");
  const info = plist.parse(readFileSync(infoPath, "utf8"));
  if (info.PatternlyACMNativeFixture !== true || info.PatternlyACMNativeFixtureRunUUID?.toLowerCase() !== runUUID
    || info.PatternlyACMNativeFixtureOperation !== operation || info.PatternlyRuntimeMode !== "smoke") {
    throw new Error("Generated Info.plist does not contain the exact fixture identity requested.");
  }
  const expoPlistPath = path.join(workspace, "ios/Patternly/Supporting/Expo.plist");
  const expoPlist = plist.parse(readFileSync(expoPlistPath, "utf8"));
  if (expoPlist.EXUpdatesEnabled !== false || expoPlist.EXUpdatesCheckOnLaunch !== "NEVER"
    || expoPlist.EXUpdatesRuntimeVersion !== expectedRuntimeVersion || Object.hasOwn(expoPlist, "EXUpdatesURL")) {
    throw new Error("Generated Expo.plist does not match the resolved fixture OTA settings and runtime version.");
  }
  const appDelegate = readFileSync(path.join(workspace, "ios/Patternly/AppDelegate.swift"), "utf8");
  for (const marker of ["PatternlyACMNativeFixture", "PatternlyACMNativeFixtureRunUUID", "PatternlyACMNativeFixtureOperation",
    "@patternly-acm-native-firebase-guard-begin", "RNFBAppCheckModule.sharedInstance()", "FirebaseApp.configure()"]) {
    if (!appDelegate.includes(marker)) throw new Error("Generated AppDelegate is missing required fixture setup or privacy guard.");
  }
  const project = readFileSync(path.join(workspace, "ios/Patternly.xcodeproj/project.pbxproj"), "utf8");
  if (!project.includes("PrivacyInfo.xcprivacy")) throw new Error("Generated Xcode project does not include the privacy manifest resource.");
  const podspec = JSON.parse(readFileSync(path.join(workspace, "native/foreground-clock/PatternlyForegroundClock.podspec.json"), "utf8"));
  if (!existsSync(path.join(workspace, "native/foreground-clock/ACMNativeFixtureIdentity.mm"))
    || !String(podspec.source_files).includes("mm")) throw new Error("Staged local podspec does not include the native fixture identity implementation.");
}

function smokeBuildEnvironment(runUUID, operation, workspace) {
  const plistModule = require("@expo/plist");
  const plist = plistModule.default ?? plistModule;
  const firebaseConfig = plist.parse(readFileSync(path.join(workspace, "ios/Patternly/GoogleService-Info.plist"), "utf8"));
  const firebaseProjectId = firebaseConfig.PROJECT_ID;
  const firebaseAppId = firebaseConfig.GOOGLE_APP_ID;
  if (typeof firebaseProjectId !== "string" || !firebaseProjectId.trim() || firebaseProjectId.trim() !== firebaseProjectId
    || typeof firebaseAppId !== "string" || !firebaseAppId.trim() || firebaseAppId.trim() !== firebaseAppId) {
    throw new Error("smoke_build_identity_input_invalid");
  }
  return {
    ...minimalProcessEnvironment(),
    EXPO_NO_DOTENV: "1",
    PATTERNLY_RUNTIME_MODE: "smoke",
    EXPO_PUBLIC_PATTERNLY_RUNTIME_MODE: "smoke",
    EAS_BUILD_PLATFORM: "ios",
    EXPO_PUBLIC_PATTERNLY_BACKEND_E2E: "true",
    EXPO_PUBLIC_PATTERNLY_API_ORIGIN: "http://127.0.0.1:1",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_EMULATOR_ORIGIN: "http://127.0.0.1:1",
    EXPO_PUBLIC_PATTERNLY_FIREBASE_PROJECT_ID: firebaseProjectId,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_APP_ID: firebaseAppId,
    EXPO_PUBLIC_PATTERNLY_FIREBASE_AUTH_DOMAIN: `${firebaseProjectId}.firebaseapp.com`,
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE: "1",
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_RUN_UUID: runUUID,
    EXPO_PUBLIC_PATTERNLY_ACM_NATIVE_FIXTURE_OPERATION: operation,
  };
}

function verifySmokeExpoConfig(workspace, environment, runUUID, operation) {
  const result = spawnSync(process.execPath, ["./node_modules/expo/bin/cli", "config", "--type", "public", "--json"], {
    cwd: workspace,
    env: environment,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    const diagnostics = `${result.stderr ?? ""}\n${result.stdout ?? ""}`;
    const missingKey = diagnostics.match(/requires (EXPO_PUBLIC_PATTERNLY_[A-Z0-9_]+)\./u)?.[1];
    const category = diagnostics.includes("environment_identity_configuration_invalid")
      ? "environment_identity_configuration_invalid"
      : diagnostics.includes("smoke_build_identity_input_invalid")
        ? "smoke_build_identity_input_invalid"
        : missingKey ?? "expo_config_resolution_failed";
    throw new Error(`Read-only Expo config preflight failed (${category}); no simulator state action was started.`);
  }
  let config;
  try {
    config = JSON.parse(result.stdout);
  } catch {
    throw new Error("Read-only Expo config preflight returned invalid JSON; no simulator state action was started.");
  }
  const fixture = config.extra?.patternlyACMNativeFixture;
  const fingerprint = config.extra?.patternlyEnvironmentFingerprint;
  const updates = config.updates;
  if (config.extra?.patternlyRuntime !== "smoke" || !/^[a-f0-9]{64}$/u.test(fingerprint ?? "")
    || fixture?.enabled !== true || fixture.runUUID?.toLowerCase() !== runUUID || fixture.operation !== operation
    || config.ios?.infoPlist?.PatternlyACMNativeFixture !== true
    || config.ios?.infoPlist?.PatternlyACMNativeFixtureRunUUID?.toLowerCase() !== runUUID
    || config.ios?.infoPlist?.PatternlyACMNativeFixtureOperation !== operation
    || config.ios?.infoPlist?.PatternlyRuntimeMode !== "smoke"
    || config.runtimeVersion?.policy !== "appVersion" || typeof config.version !== "string" || !config.version.trim()
    || updates?.enabled !== false || updates.checkAutomatically !== "NEVER" || Object.hasOwn(updates, "url")) {
    throw new Error("Read-only Expo config preflight did not resolve the exact smoke fixture identity; no simulator state action was started.");
  }
  return config;
}

function minimalProcessEnvironment() {
  const result = {};
  for (const key of ["PATH", "HOME", "TMPDIR", "LANG", "DEVELOPER_DIR"]) {
    if (typeof process.env[key] === "string") result[key] = process.env[key];
  }
  return result;
}

function installInPlace(udid, candidate, logPath) {
  runLogged("simctl install", "xcrun", ["simctl", "install", udid, candidate], { cwd: ROOT, env: minimalProcessEnvironment(), logPath });
}

function runMaestro(udid, flow, outputDirectory) {
  runLogged("Maestro flow", "maestro", ["test", "--udid", udid, "--test-output-dir", outputDirectory, flow], {
    cwd: ROOT,
    env: minimalProcessEnvironment(),
    logPath: path.join(outputDirectory, "maestro.log"),
    inheritOutput: true,
  });
}

function appIdentity(appPath) {
  const plistModule = require("@expo/plist");
  const plist = plistModule.default ?? plistModule;
  const info = plist.parse(runCapture("/usr/bin/plutil", ["-convert", "xml1", "-o", "-", path.join(appPath, "Info.plist")], ROOT));
  const signature = runCapture("/usr/bin/codesign", ["-dv", "--verbose=4", appPath], ROOT, { allowNonzero: true });
  const team = signature.match(/^TeamIdentifier=(.*)$/mu)?.[1] ?? "";
  const entitlementsResult = spawnSync("/usr/bin/codesign", ["-d", "--entitlements", ":-", appPath], { encoding: "utf8", env: minimalProcessEnvironment() });
  if (entitlementsResult.error || entitlementsResult.status !== 0) throw new Error("Could not inspect app entitlements; install is blocked.");
  const xml = `${entitlementsResult.stdout ?? ""}${entitlementsResult.stderr ?? ""}`;
  const start = xml.indexOf("<?xml");
  const entitlements = start < 0 ? {} : plist.parse(xml.slice(start));
  const keychainGroups = entitlements["keychain-access-groups"] ?? [];
  return Object.freeze({
    bundleIdentifier: info.CFBundleIdentifier ?? "",
    teamIdentifier: team,
    applicationIdentifier: entitlements["application-identifier"] ?? "",
    keychainAccessGroups: keychainGroups,
    entitlements: canonicalJson(entitlements),
  });
}

function embeddedMainBundleSha256(appPath) {
  const bundlePath = path.join(appPath, "main.jsbundle");
  if (!existsSync(bundlePath) || !lstatSync(bundlePath).isFile()) {
    throw new Error("Built candidate is missing its embedded main.jsbundle; install is blocked.");
  }
  const bytes = readFileSync(bundlePath);
  if (bytes.length === 0) throw new Error("Built candidate's embedded main.jsbundle is empty; install is blocked.");
  return createHash("sha256").update(bytes).digest("hex");
}

function assertInstalledEmbeddedBundleSha256(udid, expectedSha256) {
  const actualSha256 = embeddedMainBundleSha256(installedAppPath(udid));
  if (actualSha256 !== expectedSha256) {
    throw new Error("Installed app's embedded main.jsbundle hash differs from the phase candidate; Maestro launch is blocked.");
  }
}

function assertSameAppIdentity(expected, actual, label) {
  if (!expected || !actual || expected.bundleIdentifier !== APP_ID || actual.bundleIdentifier !== APP_ID
    || expected.bundleIdentifier !== actual.bundleIdentifier || expected.teamIdentifier !== actual.teamIdentifier
    || expected.applicationIdentifier !== actual.applicationIdentifier
    || canonicalJson(expected.keychainAccessGroups) !== canonicalJson(actual.keychainAccessGroups)
    || expected.entitlements !== actual.entitlements) {
    throw new Error(`${label} identity/entitlement comparison failed; update install is blocked.`);
  }
}

function runLogged(label, command, args, { cwd, env, logPath, inheritOutput = false }) {
  mkdirPrivate(path.dirname(logPath));
  const result = spawnSync(command, args, { cwd, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  writeFileSync(logPath, output, { mode: 0o600 });
  if (inheritOutput) process.stdout.write(output);
  if (result.error) throw new Error(`${label} could not start; log retained at ${logPath}.`);
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status}; log retained at ${logPath}.`);
}

function runCapture(command, args, cwd, { allowNonzero = false } = {}) {
  const result = spawnSync(command, args, { cwd, env: minimalProcessEnvironment(), encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (result.error || (!allowNonzero && result.status !== 0)) throw new Error(`${command} read-only preflight failed.`);
  return `${result.stdout ?? ""}${result.stderr ?? ""}`;
}

function availableBytes(directory) {
  const output = runCapture("df", ["-Pk", directory], ROOT);
  const line = output.trim().split("\n").at(-1);
  const availableKib = Number(line?.trim().split(/\s+/u)[3]);
  if (!Number.isFinite(availableKib)) throw new Error("Cannot read free disk space.");
  return availableKib * 1024;
}

function assertFreeSpace(minimum, stage) {
  if (availableBytes(ROOT) < minimum) throw new Error(`Disk gate stopped ${stage}; require at least ${Math.round(minimum / 1024 ** 3)} GiB free.`);
}

function hashDirectory(directory) {
  const inventory = inventoryTree(directory);
  const hash = createHash("sha256");
  for (const [relative, digest] of [...inventory].sort(([a], [b]) => a.localeCompare(b))) hash.update(relative).update("\0").update(digest).update("\0");
  return hash.digest("hex");
}

function directoryLogicalBytes(directory) {
  let bytes = 0;
  for (const [relative, digest] of inventoryTree(directory)) {
    if (!digest.startsWith("symlink:")) bytes += statSync(path.join(directory, relative)).size;
  }
  return bytes;
}

function writePrivateJson(filename, value) {
  mkdirPrivate(path.dirname(filename));
  writeFileSync(filename, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  chmodSync(filename, 0o600);
}

function readPrivateJson(filename) {
  const stat = statSync(filename);
  if (process.getuid && stat.uid !== process.getuid()) throw new Error("Private run receipt is owned by another user.");
  if ((stat.mode & 0o077) !== 0) throw new Error("Private run receipt must have mode 0600 or stricter.");
  return JSON.parse(readFileSync(filename, "utf8"));
}

function mkdirPrivate(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  chmodSync(directory, 0o700);
}

function assertPrivateDirectory(directory) {
  const stat = statSync(directory);
  if (!stat.isDirectory() || (process.getuid && stat.uid !== process.getuid()) || (stat.mode & 0o077) !== 0) {
    throw new Error("Private run directory must be current-user-owned and mode 0700 or stricter.");
  }
}
