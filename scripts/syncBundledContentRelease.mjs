import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { lstat, mkdtemp, readFile, readdir, realpath, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath, pathToFileURL } from "node:url";

export const EXPECTED_TRACK_IDS = Object.freeze([
  "aws-certified-solutions-architect-associate",
  "backend-system-design-interview",
  "claude-certified-architect-professional-certification",
  "coding-interview-dsa-problem-solving",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
  "object-oriented-design-interview",
]);
export const EXPECTED_INVENTORY = Object.freeze({ trackCount: 9, nodeCount: 117, mentalUnitCount: 932, questionCount: 16_041 });
export const GENERATED_DIRECTORY = "src/content/generated/canonical-content";
export const LOCK_FILE_NAME = "content-lock.json";
const LOCK_SCHEMA_VERSION = "patternly-content-lock-v1";
const ARTIFACT_SCHEMA_VERSION = "patternly-content-artifact-v1";
const HASH = /^[a-f0-9]{64}$/u;
const TRACK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const execFileAsync = promisify(execFile);
const scriptRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

export class CanonicalContentSyncError extends Error {
  constructor(message) { super(message); this.name = "CanonicalContentSyncError"; }
}
function fail(message) { throw new CanonicalContentSyncError(message); }
function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, expected) { return isRecord(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()); }
function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function equalStringSets(actual, expected) { return JSON.stringify([...actual].sort()) === JSON.stringify([...expected].sort()); }
function isWithin(base, candidate) {
  const relative = path.relative(base, candidate);
  return relative === "" || (!path.isAbsolute(relative) && relative !== ".." && !relative.startsWith(`..${path.sep}`));
}

async function inspectRegularFile(filePath, allowedRoot, label) {
  const resolvedRoot = path.resolve(allowedRoot);
  const resolvedFile = path.resolve(filePath);
  if (!isWithin(resolvedRoot, resolvedFile)) fail(`${label} escapes its allowed root: ${filePath}`);
  let current = resolvedRoot;
  for (const segment of path.relative(resolvedRoot, resolvedFile).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let info;
    try { info = await lstat(current); } catch (error) { fail(`Cannot inspect ${label} ${current}: ${error.message}`); }
    if (info.isSymbolicLink()) fail(`Symbolic links are not allowed in ${label}: ${current}`);
  }
  const rootReal = await realpath(resolvedRoot);
  const fileReal = await realpath(resolvedFile);
  if (!isWithin(rootReal, fileReal)) fail(`${label} escapes its real root: ${filePath}`);
  const info = await lstat(resolvedFile);
  if (!info.isFile()) fail(`${label} is not a regular file: ${filePath}`);
  return readFile(resolvedFile);
}

async function inspectDirectory(directory, allowedRoot, label) {
  const resolvedRoot = path.resolve(allowedRoot);
  const resolvedDirectory = path.resolve(directory);
  if (!isWithin(resolvedRoot, resolvedDirectory)) fail(`${label} escapes its allowed root: ${directory}`);
  const info = await lstat(resolvedDirectory);
  if (info.isSymbolicLink() || !info.isDirectory()) fail(`${label} must be a real directory: ${directory}`);
  const rootReal = await realpath(resolvedRoot);
  const directoryReal = await realpath(resolvedDirectory);
  if (!isWithin(rootReal, directoryReal)) fail(`${label} escapes its real root: ${directory}`);
}

async function assertSafeTargetBoundary(appRoot, targetDirectory) {
  const resolvedAppRoot = path.resolve(appRoot);
  const targetParent = path.dirname(path.resolve(targetDirectory));
  const appInfo = await lstat(resolvedAppRoot);
  if (appInfo.isSymbolicLink() || !appInfo.isDirectory()) fail(`Application root must be a real directory: ${resolvedAppRoot}`);
  const appReal = await realpath(resolvedAppRoot);
  let current = resolvedAppRoot;
  for (const segment of path.relative(resolvedAppRoot, targetParent).split(path.sep).filter(Boolean)) {
    current = path.join(current, segment);
    let info;
    try { info = await lstat(current); } catch (error) { fail(`Canonical content target parent is missing or inaccessible: ${current}: ${error.message}`); }
    if (info.isSymbolicLink() || !info.isDirectory()) fail(`Canonical content target ancestor must be a real directory: ${current}`);
  }
  const parentReal = await realpath(targetParent);
  if (!isWithin(appReal, parentReal)) fail(`Canonical content target parent escapes the real application root: ${targetParent}`);
}

async function assertSafeCheckTemporaryRoot(appRoot, temporaryRoot) {
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedTemporaryRoot = path.resolve(temporaryRoot);
  if (isWithin(resolvedAppRoot, resolvedTemporaryRoot)) fail("Check temporary root must be outside the application root");
  const [appReal, temporaryReal] = await Promise.all([realpath(resolvedAppRoot), realpath(resolvedTemporaryRoot)]);
  if (isWithin(appReal, temporaryReal)) fail("Check temporary root resolves inside the real application root");
  const info = await lstat(temporaryReal);
  if (!info.isDirectory()) fail(`Check temporary root must resolve to a directory: ${resolvedTemporaryRoot}`);
  return temporaryReal;
}

function parseJson(bytes, filePath) {
  try { return JSON.parse(bytes.toString("utf8")); } catch (error) { fail(`Invalid JSON in ${filePath}: ${error.message}`); }
}

export async function validateBuiltContent(directory, { expectedInventory = EXPECTED_INVENTORY } = {}) {
  await inspectDirectory(directory, directory, "built content directory");
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) if (entry.isSymbolicLink() || !entry.isFile()) fail(`Built content contains a non-regular entry: ${entry.name}`);
  const expectedNames = [...EXPECTED_TRACK_IDS.map((id) => `${id}.json`), LOCK_FILE_NAME];
  const names = entries.map((entry) => entry.name);
  if (!equalStringSets(names, expectedNames) || names.length !== expectedNames.length) fail(`Built content must contain exactly the nine registered artifacts and ${LOCK_FILE_NAME}`);

  const lockPath = path.join(directory, LOCK_FILE_NAME);
  const lockBytes = await inspectRegularFile(lockPath, directory, "content lock");
  const lock = parseJson(lockBytes, lockPath);
  if (!exactKeys(lock, ["schemaVersion", "tracks"]) || lock.schemaVersion !== LOCK_SCHEMA_VERSION || !Array.isArray(lock.tracks)) fail("Content lock has an invalid shape or schemaVersion");
  if (lock.tracks.length !== EXPECTED_TRACK_IDS.length) fail("Content lock must contain exactly nine track entries");
  const lockedIds = lock.tracks.map((entry) => entry?.trackId);
  if (!equalStringSets(lockedIds, EXPECTED_TRACK_IDS) || new Set(lockedIds).size !== EXPECTED_TRACK_IDS.length) fail("Content lock has missing, extra, or duplicate track IDs");
  if (JSON.stringify(lockedIds) !== JSON.stringify([...lockedIds].sort())) fail("Content lock track entries must be sorted by trackId");

  const nodeIds = new Set();
  const mentalUnitIds = new Set();
  const questionIds = new Set();
  const files = new Map();
  for (const entry of lock.tracks) {
    if (!exactKeys(entry, ["trackId", "contentVersion", "questionCount", "sha256"])) fail(`Invalid lock entry for ${entry?.trackId ?? "unknown"}`);
    if (!TRACK_ID.test(entry.trackId) || !EXPECTED_TRACK_IDS.includes(entry.trackId)) fail(`Unsafe or unknown trackId in lock: ${entry.trackId}`);
    if (typeof entry.contentVersion !== "string" || !entry.contentVersion || entry.contentVersion.trim() !== entry.contentVersion) fail(`Invalid contentVersion for ${entry.trackId}`);
    if (!Number.isInteger(entry.questionCount) || entry.questionCount < 1 || !HASH.test(entry.sha256)) fail(`Invalid count or SHA-256 for ${entry.trackId}`);
    const artifactPath = path.join(directory, `${entry.trackId}.json`);
    const artifactBytes = await inspectRegularFile(artifactPath, directory, "content artifact");
    if (sha256(artifactBytes) !== entry.sha256) fail(`SHA-256 mismatch for ${entry.trackId}`);
    const artifact = parseJson(artifactBytes, artifactPath);
    if (!exactKeys(artifact, ["schemaVersion", "trackId", "contentVersion", "questions"])) fail(`Invalid artifact shape for ${entry.trackId}`);
    if (artifact.schemaVersion !== ARTIFACT_SCHEMA_VERSION || artifact.trackId !== entry.trackId || artifact.contentVersion !== entry.contentVersion) fail(`Artifact identity mismatch for ${entry.trackId}`);
    if (!Array.isArray(artifact.questions) || artifact.questions.length !== entry.questionCount) fail(`Question count mismatch for ${entry.trackId}`);
    for (const question of artifact.questions) {
      if (!isRecord(question) || question.trackId !== entry.trackId) fail(`Foreign or malformed question in ${entry.trackId}`);
      for (const key of ["questionId", "nodeId", "mentalUnitId"]) if (typeof question[key] !== "string" || !question[key]) fail(`Question in ${entry.trackId} has invalid ${key}`);
      if (questionIds.has(question.questionId)) fail(`Duplicate questionId: ${question.questionId}`);
      questionIds.add(question.questionId);
      nodeIds.add(`${entry.trackId}\0${question.nodeId}`);
      mentalUnitIds.add(`${entry.trackId}\0${question.nodeId}\0${question.mentalUnitId}`);
    }
    files.set(`${entry.trackId}.json`, artifactBytes);
  }
  files.set(LOCK_FILE_NAME, lockBytes);
  const inventory = { trackCount: lock.tracks.length, nodeCount: nodeIds.size, mentalUnitCount: mentalUnitIds.size, questionCount: questionIds.size };
  if (JSON.stringify(inventory) !== JSON.stringify(expectedInventory)) fail(`Inventory mismatch: expected ${JSON.stringify(expectedInventory)}, received ${JSON.stringify(inventory)}`);
  return { lock, inventory, files };
}

async function defaultRunBuild({ producerRoot, outputRoot }) {
  await execFileAsync(process.execPath, [path.join(producerRoot, "scripts", "build.mjs"), "build-all", "--root", producerRoot, "--output-root", outputRoot], { cwd: producerRoot, maxBuffer: 32 * 1024 * 1024 });
}
async function producerHead(producerRoot) {
  const { stdout } = await execFileAsync("git", ["-C", producerRoot, "rev-parse", "HEAD"], { encoding: "utf8" });
  const head = stdout.trim();
  if (!/^[a-f0-9]{40}$/u.test(head)) fail("Cannot resolve the current patternly-content HEAD");
  return head;
}
async function verifyProducerState(producerRoot) {
  const { stdout } = await execFileAsync("git", [
    "-C", producerRoot, "status", "--porcelain", "--untracked-files=all", "--",
    "content", "schemas", "scripts/build.mjs", "scripts/content",
  ], { encoding: "utf8" });
  if (stdout.trim()) fail("Canonical producer inputs differ from patternly-content HEAD");
}
async function assertProducerRoot(producerRoot) {
  await inspectDirectory(producerRoot, path.dirname(producerRoot), "patternly-content checkout");
  await inspectRegularFile(path.join(producerRoot, "scripts", "build.mjs"), producerRoot, "canonical producer build script");
}
async function compareDirectories(actualDirectory, expectedDirectory, options) {
  const [actual, expected] = await Promise.all([validateBuiltContent(actualDirectory, options), validateBuiltContent(expectedDirectory, options)]);
  for (const fileName of [...EXPECTED_TRACK_IDS.map((id) => `${id}.json`), LOCK_FILE_NAME]) if (!actual.files.get(fileName)?.equals(expected.files.get(fileName))) fail(`Canonical content parity mismatch: ${fileName}`);
  return expected;
}

async function pathKind(candidate) {
  try {
    const info = await lstat(candidate);
    if (info.isSymbolicLink()) fail(`Symbolic link is not allowed at transaction path: ${candidate}`);
    return info.isDirectory() ? "directory" : "other";
  } catch (error) { if (error?.code === "ENOENT") return "missing"; throw error; }
}
async function recoverTransaction({ targetDirectory, backupDirectory, expectedInventory, remove = rm, move = rename }) {
  const [targetKind, backupKind] = await Promise.all([pathKind(targetDirectory), pathKind(backupDirectory)]);
  if (targetKind === "other" || backupKind === "other") fail("Canonical content transaction paths must be directories");
  if (targetKind === "missing" && backupKind === "directory") await move(backupDirectory, targetDirectory);
  else if (targetKind === "directory" && backupKind === "directory") {
    await validateBuiltContent(targetDirectory, { expectedInventory });
    await remove(backupDirectory, { recursive: true, force: false });
  }
}
async function replaceDirectory({ stagedDirectory, targetDirectory, expectedInventory, remove = rm, move = rename }) {
  const backupDirectory = `${targetDirectory}.backup`;
  await recoverTransaction({ targetDirectory, backupDirectory, expectedInventory, remove, move });
  const targetKind = await pathKind(targetDirectory);
  let movedOld = false;
  let installedNew = false;
  try {
    if (targetKind === "directory") { await move(targetDirectory, backupDirectory); movedOld = true; }
    await move(stagedDirectory, targetDirectory);
    installedNew = true;
    await validateBuiltContent(targetDirectory, { expectedInventory });
  } catch (error) {
    const failedDirectory = `${targetDirectory}.failed-${randomUUID()}`;
    try {
      if (installedNew && await pathKind(targetDirectory) === "directory") await move(targetDirectory, failedDirectory);
      if (movedOld && await pathKind(backupDirectory) === "directory") await move(backupDirectory, targetDirectory);
      if (await pathKind(failedDirectory) === "directory") await remove(failedDirectory, { recursive: true, force: false });
    } catch (rollbackError) { fail(`Canonical content replacement failed (${error.message}) and rollback failed: ${rollbackError.message}`); }
    fail(`Canonical content replacement failed; previous directory restored: ${error.message}`);
  }
  if (movedOld) await remove(backupDirectory, { recursive: true, force: false });
}

export async function syncCanonicalContent({ mode = "sync", appRoot = scriptRoot, producerRoot = path.resolve(scriptRoot, "../patternly-content"), targetDirectory = path.join(appRoot, GENERATED_DIRECTORY), temporaryRoot = tmpdir(), runBuild = defaultRunBuild, getProducerHead = producerHead, verifyProducer = verifyProducerState, expectedInventory = EXPECTED_INVENTORY, remove = rm, move = rename } = {}) {
  if (mode !== "sync" && mode !== "check") fail(`Unknown mode: ${mode}`);
  const resolvedAppRoot = path.resolve(appRoot);
  const resolvedProducerRoot = path.resolve(producerRoot);
  const resolvedTarget = path.resolve(targetDirectory);
  if (!isWithin(resolvedAppRoot, resolvedTarget) || resolvedTarget !== path.join(resolvedAppRoot, GENERATED_DIRECTORY)) fail(`Target must be exactly ${GENERATED_DIRECTORY} within the application root`);
  await assertSafeTargetBoundary(resolvedAppRoot, resolvedTarget);
  const safeCheckTemporaryRoot = mode === "check" ? await assertSafeCheckTemporaryRoot(resolvedAppRoot, temporaryRoot) : undefined;
  await assertProducerRoot(resolvedProducerRoot);
  const head = await getProducerHead(resolvedProducerRoot);
  await verifyProducer(resolvedProducerRoot);
  const temporaryParent = mode === "sync" ? path.dirname(resolvedTarget) : safeCheckTemporaryRoot;
  const temporaryDirectory = await mkdtemp(path.join(temporaryParent, `.canonical-content-build-${process.pid}-`));
  try {
    await runBuild({ producerRoot: resolvedProducerRoot, outputRoot: temporaryDirectory });
    const built = await validateBuiltContent(temporaryDirectory, { expectedInventory });
    if (mode === "check") {
      await compareDirectories(resolvedTarget, temporaryDirectory, { expectedInventory });
      return { mode, head, ...built };
    }
    await replaceDirectory({ stagedDirectory: temporaryDirectory, targetDirectory: resolvedTarget, expectedInventory, remove, move });
    const installed = await validateBuiltContent(resolvedTarget, { expectedInventory });
    for (const [fileName, bytes] of built.files) if (!installed.files.get(fileName)?.equals(bytes)) fail(`Installed canonical content differs from producer bytes: ${fileName}`);
    return { mode, head, ...built };
  } finally {
    if (await pathKind(temporaryDirectory) === "directory") await remove(temporaryDirectory, { recursive: true, force: false });
  }
}

function usage() { return "Usage: node scripts/syncBundledContentRelease.mjs [sync|check] [--content-root <patternly-content checkout>]"; }
export function parseArgs(argv = process.argv.slice(2)) {
  const options = { mode: "sync" };
  let index = 0;
  if (argv[0] === "sync" || argv[0] === "check") options.mode = argv[index++];
  while (index < argv.length) {
    if (argv[index] !== "--content-root" || index + 1 >= argv.length) fail(usage());
    options.producerRoot = path.resolve(argv[index + 1]);
    index += 2;
  }
  return options;
}
async function runCli() {
  const result = await syncCanonicalContent(parseArgs());
  console.log(`CANONICAL_CONTENT_${result.mode.toUpperCase()}=passed`);
  console.log(`PATTERNLY_CONTENT_HEAD=${result.head}`);
  console.log(`CONTENT_INVENTORY=${result.inventory.trackCount}/${result.inventory.nodeCount}/${result.inventory.mentalUnitCount}/${result.inventory.questionCount}`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) runCli().catch((error) => { console.error(error?.stack ?? error?.message ?? error); process.exitCode = 1; });
