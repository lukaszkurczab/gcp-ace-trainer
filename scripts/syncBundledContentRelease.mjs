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
export const EXPECTED_INVENTORY = Object.freeze({ trackCount: 9, nodeCount: 117, mentalUnitCount: 943, questionCount: 16_077 });
export const GENERATED_DIRECTORY = "src/content/generated/canonical-content";
export const LOCK_FILE_NAME = "content-lock.json";
const LOCK_SCHEMA_VERSION = "patternly-content-lock-v1";
const ARTIFACT_SCHEMA_VERSION = "patternly-content-artifact-v1";
const HASH = /^[a-f0-9]{64}$/u;
const TRACK_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const CODING_TRACK_ID = "coding-interview-dsa-problem-solving";
const CODING_PROFILE_ID = "algorithms-interview-simulation-v1";
const CODING_SELECTION_POLICY_KEYS = Object.freeze([
  "requireUniqueItemIds", "requireDeclaredSimulationEligibility", "requireMultipleMentalUnits",
  "requireMultiplePatternFamilies", "requireEveryActiveInteractionTypeRepresented",
  "prohibitConsecutiveSameMentalUnitWhenAlternativeExists", "prohibitDuplicateContentIdentity",
  "prohibitTaxonomyWidening", "prohibitFallbackItems",
]);
const execFileAsync = promisify(execFile);
const scriptRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));

export class CanonicalContentSyncError extends Error {
  constructor(message) { super(message); this.name = "CanonicalContentSyncError"; }
}
function fail(message) { throw new CanonicalContentSyncError(message); }
function isRecord(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function exactKeys(value, expected) { return isRecord(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort()); }
function requireExactKeys(value, expected, label) { if (!exactKeys(value, expected)) fail(`${label} has an invalid shape`); }
function validateCertificationSimulationConfig(config, { trackId, contentVersion, questions, nodeIds }) {
  const path = `simulationProfiles.certification.familyConfig`;
  const configKeys = ["schemaVersion", "source", "durationMinutes", "questionCount", "blueprint", "interactionPolicy", "nodeDomainMap", "nodeDomainMapEvidence"];
  requireExactKeys(config, configKeys, path);
  if (config.schemaVersion !== "patternly-certification-simulation-config-v1") fail(`${path}.schemaVersion is unsupported`);
  requireExactKeys(config.source, ["url", "checkedDate", "guideVersion"], `${path}.source`);
  if ([config.source.url, config.source.checkedDate, config.source.guideVersion].some((value) => typeof value !== "string" || !value.trim())) fail(`${path}.source is invalid`);
  if (config.durationMinutes !== 120) fail(`${path}.durationMinutes is invalid`);
  requireExactKeys(config.questionCount, ["kind", "minimum", "maximum"], `${path}.questionCount`);
  if (config.questionCount.kind !== "range" || config.questionCount.minimum !== 50 || config.questionCount.maximum !== 60) fail(`${path}.questionCount is unsupported`);
  requireExactKeys(config.blueprint, ["kind", "sections"], `${path}.blueprint`);
  if (config.blueprint.kind !== "weighted_sections" || !Array.isArray(config.blueprint.sections) || config.blueprint.sections.length !== 4) fail(`${path}.blueprint is invalid`);
  const expectedWeights = new Map([["gcp-ace-standard-domain-1", 20], ["gcp-ace-standard-domain-2", 30], ["gcp-ace-standard-domain-3", 30], ["gcp-ace-standard-domain-4", 20]]);
  const weights = new Map(); const sectionIds = new Set();
  config.blueprint.sections.forEach((section, index) => {
    requireExactKeys(section, ["id", "contentDomainId", "weightPercent"], `${path}.blueprint.sections[${index}]`);
    if (typeof section.id !== "string" || !section.id.trim() || sectionIds.has(section.id)) fail(`${path}.blueprint.sections[${index}].id is invalid`);
    if (!expectedWeights.has(section.contentDomainId) || weights.has(section.contentDomainId) || section.weightPercent !== expectedWeights.get(section.contentDomainId)) fail(`${path}.blueprint.sections[${index}] has an unknown or invalid domain weight`);
    sectionIds.add(section.id); weights.set(section.contentDomainId, section.weightPercent);
  });
  if (weights.size !== expectedWeights.size) fail(`${path}.blueprint does not cover the certification domains`);
  const policy = config.interactionPolicy;
  const policyKeys = ["schemaVersion", "policyId", "policyVersion", "owner", "navigation", "answerChanges", "flagging", "navigator", "sections", "timeout", "feedbackTiming"];
  requireExactKeys(policy, policyKeys, `${path}.interactionPolicy`);
  if (policy.schemaVersion !== "patternly-certification-simulation-policy-v1" || typeof policy.policyId !== "string" || !policy.policyId.trim() || policy.policyVersion !== "1" || policy.owner !== "patternly_product" || policy.navigation !== "free" || policy.answerChanges !== "until_final_submission" || policy.flagging !== "available" || policy.navigator !== "available" || policy.sections !== "blueprint_visible" || policy.timeout !== "absolute_deadline" || policy.feedbackTiming !== "after_verified_finalization") fail(`${path}.interactionPolicy is unsupported`);
  requireExactKeys(config.nodeDomainMap, nodeIds, `${path}.nodeDomainMap`);
  const domains = new Set(expectedWeights.keys());
  for (const [nodeId, domainId] of Object.entries(config.nodeDomainMap)) if (!domains.has(domainId)) fail(`${path}.nodeDomainMap.${nodeId} has an unknown domain`);
  const sourceDomainsByNode = new Map();
  for (const question of questions) {
    if (!domains.has(question.contentDomainId)) fail(`${path}: question is missing source-derived contentDomainId`);
    const nodeDomains = sourceDomainsByNode.get(question.nodeId) ?? new Set();
    nodeDomains.add(question.contentDomainId);
    sourceDomainsByNode.set(question.nodeId, nodeDomains);
  }
  if (sourceDomainsByNode.size !== nodeIds.length || [...sourceDomainsByNode.values()].some((nodeDomains) => nodeDomains.size !== 1)) fail(`${path}: source-derived per-question domains are incomplete or ambiguous`);
  const sourceNodeDomainMap = Object.fromEntries([...sourceDomainsByNode].map(([nodeId, nodeDomains]) => [nodeId, [...nodeDomains][0]]));
  if (JSON.stringify(Object.entries(config.nodeDomainMap).sort()) !== JSON.stringify(Object.entries(sourceNodeDomainMap).sort())) fail(`${path}.nodeDomainMap differs from source-derived per-question domains`);
  const evidence = config.nodeDomainMapEvidence;
  requireExactKeys(evidence, ["artifactPath", "contentVersion", "itemCount", "nodeCount", "ambiguousNodeCount"], `${path}.nodeDomainMapEvidence`);
  if (evidence.artifactPath !== `artifacts/tracks/${trackId}/${contentVersion}/track-artifact.json` || evidence.contentVersion !== contentVersion || evidence.itemCount !== questions.length || evidence.nodeCount !== nodeIds.length || evidence.ambiguousNodeCount !== 0) fail(`${path}.nodeDomainMapEvidence does not match the artifact identity or node coverage`);
}
function validateCodingSimulationConfig(config, { questions }) {
  const label = "simulationProfiles.coding_interview.familyConfig";
  const configKeys = ["schemaVersion", "blueprintId", "blueprintVersion", "requestedLength", "actualLength", "shorteningPolicy", "uniqueItemsRequired", "timerKind", "durationMinutes", "navigationPolicy", "answerChangePolicy", "reinsertPolicy", "feedbackTiming", "learningStages", "selectionPolicy", "poolId", "poolVersion", "eligibleQuestionIds"];
  requireExactKeys(config, configKeys, label);
  if (config.schemaVersion !== "patternly-coding-interview-simulation-config-v1" || config.blueprintId !== "coding-interview-interview-simulation-v1" || config.blueprintVersion !== "1") fail(`${label} blueprint identity is unsupported`);
  if (config.requestedLength !== 40 || config.actualLength !== 40 || config.shorteningPolicy !== "prohibited" || config.uniqueItemsRequired !== 40) fail(`${label} must require exactly 40 unique questions`);
  if (config.timerKind !== "foreground_countdown" || config.durationMinutes !== 45 || config.navigationPolicy !== "free_navigation" || config.answerChangePolicy !== "editable_until_finalization" || config.reinsertPolicy !== "disabled" || config.feedbackTiming !== "after_verified_finalization") fail(`${label} interaction or timer policy is unsupported`);
  if (!Array.isArray(config.learningStages) || JSON.stringify(config.learningStages) !== JSON.stringify(["simulation"])) fail(`${label}.learningStages is unsupported`);
  requireExactKeys(config.selectionPolicy, CODING_SELECTION_POLICY_KEYS, `${label}.selectionPolicy`);
  if (CODING_SELECTION_POLICY_KEYS.some((key) => config.selectionPolicy[key] !== true)) fail(`${label}.selectionPolicy must keep every declared constraint enabled`);
  if (config.poolId !== CODING_PROFILE_ID || config.poolVersion !== "1") fail(`${label} pool identity is unsupported`);
  if (!Array.isArray(config.eligibleQuestionIds) || config.eligibleQuestionIds.length !== 40 || config.eligibleQuestionIds.some((id) => typeof id !== "string" || !id.trim()) || new Set(config.eligibleQuestionIds).size !== 40) fail(`${label}.eligibleQuestionIds must contain 40 unique identities`);
  const questionIds = new Set(questions.map((question) => question.questionId));
  if (config.eligibleQuestionIds.some((id) => !questionIds.has(id))) fail(`${label}.eligibleQuestionIds contains an identity outside the canonical artifact`);
}
function validateSimulationProfiles(profiles, { trackId, contentVersion, questions }) {
  if (!Array.isArray(profiles) || profiles.length === 0) fail(`Simulation profile metadata is malformed for ${trackId}`);
  if (!["google-cloud-associate-cloud-engineer", CODING_TRACK_ID].includes(trackId) || profiles.length !== 1) fail(`Simulation profile family is unsupported for ${trackId}`);
  const profile = profiles[0];
  requireExactKeys(profile, ["schemaVersion", "profileId", "profileVersion", "familyId", "modeId", "familyConfig"], "simulationProfiles[0]");
  if (trackId === CODING_TRACK_ID) {
    if (profile.schemaVersion !== "patternly-simulation-profile-envelope-v1" || profile.profileId !== CODING_PROFILE_ID || profile.profileVersion !== "1") fail("Coding Interview simulation profile envelope or profile version is unsupported");
    if (profile.familyId !== "coding_interview" || profile.modeId !== "coding-interview-simulation") fail("Coding Interview simulation profile is not bound to Coding Mock");
    validateCodingSimulationConfig(profile.familyConfig, { questions });
    return;
  }
  if (profile.schemaVersion !== "patternly-simulation-profile-envelope-v1" || profile.profileId !== "google-cloud-associate-cloud-engineer-certification-exam-v1" || profile.profileVersion !== "1") fail("GCP simulation profile envelope or profile version is unsupported");
  if (profile.familyId !== "certification") fail("GCP simulation profile family is unsupported");
  if (profile.modeId !== "certification-exam-simulation") fail("GCP simulation profile mode is not bound to Exam Simulation");
  const nodeIds = [...new Set(questions.map((question) => question.nodeId))].sort();
  validateCertificationSimulationConfig(profile.familyConfig, { trackId, contentVersion, questions, nodeIds });
}
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
    if (!isRecord(artifact) || (!exactKeys(artifact, ["schemaVersion", "trackId", "contentVersion", "questions"]) && !exactKeys(artifact, ["schemaVersion", "trackId", "contentVersion", "questions", "simulationProfiles"]))) fail(`Invalid artifact shape for ${entry.trackId}`);
    if (artifact.schemaVersion !== ARTIFACT_SCHEMA_VERSION || artifact.trackId !== entry.trackId || artifact.contentVersion !== entry.contentVersion) fail(`Artifact identity mismatch for ${entry.trackId}`);
    if (!Array.isArray(artifact.questions) || artifact.questions.length !== entry.questionCount) fail(`Question count mismatch for ${entry.trackId}`);
    const hasSimulationProfiles = Object.hasOwn(artifact, "simulationProfiles");
    const knownGcpDomains = new Set(["gcp-ace-standard-domain-1", "gcp-ace-standard-domain-2", "gcp-ace-standard-domain-3", "gcp-ace-standard-domain-4"]);
    for (const question of artifact.questions) {
      if (!isRecord(question) || question.trackId !== entry.trackId) fail(`Foreign or malformed question in ${entry.trackId}`);
      for (const key of ["questionId", "nodeId", "mentalUnitId"]) if (typeof question[key] !== "string" || !question[key]) fail(`Question in ${entry.trackId} has invalid ${key}`);
      if (questionIds.has(question.questionId)) fail(`Duplicate questionId: ${question.questionId}`);
      if (question.contentDomainId !== undefined && (entry.trackId !== "google-cloud-associate-cloud-engineer" || !knownGcpDomains.has(question.contentDomainId))) fail(`Unexpected contentDomainId on question ${question.questionId}`);
      if (hasSimulationProfiles && entry.trackId === "google-cloud-associate-cloud-engineer" && !knownGcpDomains.has(question.contentDomainId)) fail(`Missing source-derived contentDomainId on question ${question.questionId}`);
      questionIds.add(question.questionId);
      nodeIds.add(`${entry.trackId}\0${question.nodeId}`);
      mentalUnitIds.add(`${entry.trackId}\0${question.nodeId}\0${question.mentalUnitId}`);
    }
    if (Object.hasOwn(artifact, "simulationProfiles")) validateSimulationProfiles(artifact.simulationProfiles, { trackId: entry.trackId, contentVersion: entry.contentVersion, questions: artifact.questions });
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
