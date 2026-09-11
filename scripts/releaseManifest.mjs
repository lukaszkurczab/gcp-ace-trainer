import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, isAbsolute, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath, pathToFileURL } from "node:url";

/**
 * GATE-03 portable release manifest contract.
 *
 * This module deliberately contains no repository-specific validators. Content
 * acceptance is delegated to the ACC-02 modules in patternly-content and the
 * OpenAPI check is delegated to patternly-backend's `openapi:check` script.
 */

export const RELEASE_MANIFEST_SCHEMA_VERSION = "patternly-release-manifest-v1";

export const REPOSITORY_DEFINITIONS = Object.freeze([
  Object.freeze({ role: "application", slug: "patternly" }),
  Object.freeze({ role: "backend", slug: "patternly-backend" }),
  Object.freeze({ role: "content", slug: "patternly-content" }),
  Object.freeze({ role: "web", slug: "patternly-web" }),
]);

export const REPOSITORY_ROLES = Object.freeze(REPOSITORY_DEFINITIONS.map(({ role }) => role));
export const REPOSITORY_SLUGS = Object.freeze(REPOSITORY_DEFINITIONS.map(({ slug }) => slug));

export const CANDIDATE_TRACK_IDS = Object.freeze([
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

export const RELEASE_MANIFEST_REFERENCES = Object.freeze([
  Object.freeze({ repositoryRole: "application", path: "integration/contracts/content-release/release.lock.json" }),
  Object.freeze({ repositoryRole: "backend", path: "openapi/patternly-v1.json" }),
  Object.freeze({ repositoryRole: "content", path: "evidence/content-acceptance/candidate-manifest-v1.json" }),
  Object.freeze({ repositoryRole: "content", path: "evidence/readiness/candidate-readiness.json" }),
]);

const SHA256_PATTERN = /^[a-f0-9]{64}$/u;
const COMMIT_PATTERN = /^[a-f0-9]{40}$/u;
const WINDOWS_ABSOLUTE_PATTERN = /^[a-zA-Z]:[\\/]/u;

function compare(left, right) {
  return left === right ? 0 : left < right ? -1 : 1;
}

/** Stable JSON serialization used for manifest identity. */
export function canonicalJson(value) {
  if (value === null) return "null";
  if (["boolean", "string"].includes(typeof value)) return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError("Canonical JSON does not accept non-finite numbers.");
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (!value || typeof value !== "object") throw new TypeError("Canonical JSON accepts JSON values only.");
  return `{${Object.keys(value).sort(compare).map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(",")}}`;
}

export function canonicalJsonBytes(value) {
  return `${canonicalJson(value)}\n`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function manifestIdentityPayload(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("Release manifest must be an object.");
  }
  const { manifestId: _manifestId, ...identity } = manifest;
  return identity;
}

export function manifestIdFor(manifest) {
  return sha256(canonicalJson(manifestIdentityPayload(manifest)));
}

function exactKeys(value, expectedKeys, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  const actual = Object.keys(value).sort(compare);
  const expected = [...expectedKeys].sort(compare);
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} has unsupported or missing fields.`);
}

function exactArray(actual, expected, label) {
  if (canonicalJson(actual) !== canonicalJson(expected)) throw new Error(`${label} is not the exact canonical set.`);
}

function commit(value, label) {
  if (!COMMIT_PATTERN.test(value ?? "")) throw new Error(`${label} must be a full lowercase commit SHA.`);
}

function sha(value, label) {
  if (!SHA256_PATTERN.test(value ?? "")) throw new Error(`${label} must be a lowercase SHA-256 hash.`);
}

function nonEmpty(value, label) {
  if (typeof value !== "string" || value.trim().length === 0) throw new Error(`${label} must be a non-empty string.`);
}

/**
 * Validate only the serialized contract. Filesystem and cross-repository
 * checks are performed by verifyReleaseManifest.
 */
export function validateReleaseManifest(manifest) {
  exactKeys(manifest, ["schemaVersion", "manifestId", "candidateId", "trackIds", "repositories", "references"], "Release manifest");
  if (manifest.schemaVersion !== RELEASE_MANIFEST_SCHEMA_VERSION) throw new Error("Release manifest schema version is invalid.");
  sha(manifest.manifestId, "Release manifest manifestId");
  sha(manifest.candidateId, "Release manifest candidateId");

  if (!Array.isArray(manifest.trackIds) || manifest.trackIds.length !== CANDIDATE_TRACK_IDS.length) {
    throw new Error("Release manifest must contain exactly nine track IDs.");
  }
  exactArray(manifest.trackIds, CANDIDATE_TRACK_IDS, "Release manifest trackIds");

  if (!Array.isArray(manifest.repositories) || manifest.repositories.length !== REPOSITORY_DEFINITIONS.length) {
    throw new Error("Release manifest must contain exactly four repositories.");
  }
  const repositoryRoles = [];
  const repositorySlugs = [];
  for (const [index, repository] of manifest.repositories.entries()) {
    exactKeys(repository, ["role", "slug", "commit"], `Release manifest repository ${index}`);
    const definition = REPOSITORY_DEFINITIONS.find((candidate) => candidate.role === repository.role);
    if (!definition) throw new Error(`Release manifest repository role is unknown: ${repository.role ?? "missing"}.`);
    if (repositoryRoles.includes(repository.role)) throw new Error(`Release manifest repository role is duplicated: ${repository.role}.`);
    if (repository.slug !== definition.slug) throw new Error(`Release manifest repository slug mismatch for ${repository.role}.`);
    if (repositorySlugs.includes(repository.slug)) throw new Error(`Release manifest repository slug is duplicated: ${repository.slug}.`);
    commit(repository.commit, `Release manifest repository ${repository.role} commit`);
    repositoryRoles.push(repository.role);
    repositorySlugs.push(repository.slug);
  }
  exactArray(repositoryRoles, REPOSITORY_ROLES, "Release manifest repository roles");
  exactArray(repositorySlugs, REPOSITORY_SLUGS, "Release manifest repository slugs");

  if (!Array.isArray(manifest.references) || manifest.references.length !== RELEASE_MANIFEST_REFERENCES.length) {
    throw new Error("Release manifest must contain exactly four contract references.");
  }
  const referenceKeys = [];
  for (const [index, reference] of manifest.references.entries()) {
    exactKeys(reference, ["repositoryRole", "path", "sha256"], `Release manifest reference ${index}`);
    nonEmpty(reference.repositoryRole, `Release manifest reference ${index} repositoryRole`);
    validatePortableRelativePath(reference.path, `Release manifest reference ${index} path`);
    sha(reference.sha256, `Release manifest reference ${index} sha256`);
    const key = `${reference.repositoryRole}:${reference.path}`;
    if (referenceKeys.includes(key)) throw new Error(`Release manifest reference is duplicated: ${key}.`);
    referenceKeys.push(key);
  }
  exactArray(
    referenceKeys,
    RELEASE_MANIFEST_REFERENCES.map((reference) => `${reference.repositoryRole}:${reference.path}`),
    "Release manifest references",
  );

  if (manifestIdFor(manifest) !== manifest.manifestId) throw new Error("Release manifest manifestId does not match its canonical identity.");
  return manifest;
}

export function validatePortableRelativePath(value, label = "Reference path") {
  nonEmpty(value, label);
  if (value.includes("\\") || value.includes("\0") || isAbsolute(value) || WINDOWS_ABSOLUTE_PATTERN.test(value)) {
    throw new Error(`${label} must be a portable relative path.`);
  }
  const segments = value.split("/");
  if (segments.some((segment) => segment.length === 0 || segment === "." || segment === "..")) {
    throw new Error(`${label} must not contain absolute, traversal, or empty path segments.`);
  }
  if (value !== segments.join("/")) throw new Error(`${label} is not normalized.`);
  return value;
}

function isWithin(parent, child) {
  const parentPath = parent.endsWith(sep) ? parent.slice(0, -1) : parent;
  return child === parentPath || child.startsWith(`${parentPath}${sep}`);
}

function throwPathError(label, reason) {
  throw new Error(`${label} ${reason}.`);
}

/** Reject symlinks in every existing component of an absolute path. */
function rejectSymlinkComponents(path, label, includeFinal = true) {
  const absolutePath = resolve(path);
  // macOS exposes the process temp directory as the conventional `/tmp`
  // symlink to `/private/tmp`. It is a trusted system alias used by the test
  // runner and is not an output-directory alias supplied by the caller.
  const trustedTempAlias = resolve(tmpdir());
  const components = absolutePath.split(sep);
  let current = sep;
  for (let index = 1; index < components.length; index += 1) {
    if (!components[index]) continue;
    current = join(current, components[index]);
    let info;
    try {
      info = lstatSync(current);
    } catch (error) {
      if (error?.code === "ENOENT") break;
      throw error;
    }
    if (info.isSymbolicLink() && current !== trustedTempAlias && (includeFinal || index < components.length - 1)) {
      throwPathError(label, "must not contain symbolic-link components");
    }
  }
}

function requireExistingDirectory(path, label) {
  rejectSymlinkComponents(resolve(path), label, true);
  let physical;
  try {
    physical = realpathSync(resolve(path));
  } catch {
    throwPathError(label, "must be an existing directory");
  }
  try {
    if (!statSync(physical).isDirectory()) throwPathError(label, "must be an existing directory");
  } catch (error) {
    if (error?.message?.startsWith(`${label} `)) throw error;
    throwPathError(label, "must be an existing directory");
  }
  return physical;
}

function repositoryHead(repositoryRoot, label) {
  let head;
  try {
    head = execFileSync("git", ["-C", repositoryRoot, "rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    throwPathError(label, "must be a Git checkout with a committed HEAD");
  }
  commit(head, `${label} HEAD`);
  try {
    const top = realpathSync(execFileSync("git", ["-C", repositoryRoot, "rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim());
    if (top !== repositoryRoot) throwPathError(label, "must point to the checkout root");
  } catch (error) {
    if (error?.message?.startsWith(`${label} `)) throw error;
    throwPathError(label, "must point to the checkout root");
  }
  return head;
}

function ensureCleanRepository(repositoryRoot, label) {
  try {
    const porcelain = execFileSync("git", ["-C", repositoryRoot, "status", "--porcelain", "--untracked-files=all"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    if (porcelain.trim()) throwPathError(label, "worktree must be clean");
  } catch (error) {
    if (error?.message?.startsWith(`${label} `)) throw error;
    throwPathError(label, "worktree status is unavailable");
  }
}

function normalizeRepositoryRoots(options = {}) {
  const supplied = options.roots ?? options.repositoryRoots ?? {
    application: options.applicationRoot,
    backend: options.backendRoot,
    content: options.contentRoot,
    web: options.webRoot,
  };
  if (!supplied || typeof supplied !== "object" || Array.isArray(supplied)) throw new Error("Exactly four repository roots are required.");
  exactArray(Object.keys(supplied).sort(compare), [...REPOSITORY_ROLES].sort(compare), "Repository roots");
  const roots = {};
  for (const role of REPOSITORY_ROLES) {
    nonEmpty(supplied[role], `${role} repository root`);
    roots[role] = requireExistingDirectory(supplied[role], `${role} repository root`);
  }
  for (let left = 0; left < REPOSITORY_ROLES.length; left += 1) {
    for (let right = left + 1; right < REPOSITORY_ROLES.length; right += 1) {
      const first = roots[REPOSITORY_ROLES[left]];
      const second = roots[REPOSITORY_ROLES[right]];
      if (first === second || isWithin(first, second) || isWithin(second, first)) {
        throw new Error("Repository roots must be four distinct, non-overlapping physical checkouts.");
      }
    }
  }
  return roots;
}

function inspectRepositories(roots, expectedRepositories = undefined) {
  const commits = {};
  for (const definition of REPOSITORY_DEFINITIONS) {
    const root = roots[definition.role];
    const label = `${definition.role} repository`;
    ensureCleanRepository(root, label);
    const head = repositoryHead(root, label);
    const expected = expectedRepositories?.find((repository) => repository.role === definition.role)?.commit;
    if (expected && head !== expected) throw new Error(`${label} HEAD is stale: declared commit does not match checkout HEAD.`);
    commits[definition.role] = head;
  }
  return commits;
}

function validateStandalonePath(path, label, roots) {
  nonEmpty(path, label);
  const requested = resolve(path);
  const parent = dirname(requested);
  rejectSymlinkComponents(parent, `${label} parent`, true);
  let physicalParent;
  try {
    physicalParent = realpathSync(parent);
  } catch {
    throwPathError(label, "parent directory must already exist");
  }
  let finalInfo;
  try {
    finalInfo = lstatSync(requested);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  if (finalInfo?.isSymbolicLink()) throwPathError(label, "final path must not be a symbolic link");
  const physicalPath = resolve(physicalParent, basename(requested));
  if (roots.some((root) => isWithin(root, physicalPath))) throwPathError(label, "must be outside all repository worktrees");
  return physicalPath;
}

function validateOutputPath(path, roots) {
  const outputPath = validateStandalonePath(path, "Manifest output", roots);
  if (existsSync(outputPath) && !statSync(outputPath).isFile()) throwPathError("Manifest output", "must be a regular file or a missing path");
  return outputPath;
}

function readRegularReference(root, reference) {
  validatePortableRelativePath(reference.path, `Reference ${reference.repositoryRole}:${reference.path}`);
  const candidate = resolve(root, reference.path);
  if (!isWithin(root, candidate)) throwPathError(`Reference ${reference.repositoryRole}:${reference.path}`, "escapes its repository root");
  rejectSymlinkComponents(candidate, `Reference ${reference.repositoryRole}:${reference.path}`, true);
  let physical;
  try {
    physical = realpathSync(candidate);
    if (!isWithin(root, physical)) throwPathError(`Reference ${reference.repositoryRole}:${reference.path}`, "escapes its repository root");
    if (!statSync(physical).isFile()) throwPathError(`Reference ${reference.repositoryRole}:${reference.path}`, "must resolve to a regular file");
  } catch (error) {
    if (error?.message?.startsWith("Reference ")) throw error;
    throwPathError(`Reference ${reference.repositoryRole}:${reference.path}`, "must resolve to a regular file");
  }
  const bytes = readFileSync(physical);
  if (reference.sha256 !== undefined && sha256(bytes) !== reference.sha256) throw new Error(`Reference hash mismatch for ${reference.repositoryRole}:${reference.path}.`);
  return { reference, path: physical, bytes };
}

function resolveReferences(manifest, roots) {
  const files = new Map();
  for (const reference of manifest.references) {
    const root = roots[reference.repositoryRole];
    const key = `${reference.repositoryRole}:${reference.path}`;
    files.set(key, readRegularReference(root, reference));
  }
  return files;
}

function referenceFile(files, repositoryRole, path) {
  const value = files.get(`${repositoryRole}:${path}`);
  if (!value) throw new Error(`Release manifest is missing required reference ${repositoryRole}:${path}.`);
  return value;
}

function parseJson(bytes, label) {
  try {
    return JSON.parse(bytes.toString("utf8"));
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}

function validateReleaseLock(lock, { candidate, readiness, trackIds }) {
  if (!lock || typeof lock !== "object" || Array.isArray(lock)) throw new Error("Application release lock must be an object.");
  if (lock.schemaVersion !== 2 || lock.repository !== "lukaszkurczab/patternly-content") throw new Error("Application release lock identity is invalid.");
  if (typeof lock.bundleId !== "string" || lock.bundleId.length === 0 || !Array.isArray(lock.artifacts)) throw new Error("Application release lock is incomplete.");
  if (lock.artifacts.length !== trackIds.length) throw new Error("Application release lock must cover exactly nine tracks.");
  const lockTrackIds = lock.artifacts.map((artifact) => artifact?.trackId).sort(compare);
  exactArray(lockTrackIds, [...trackIds].sort(compare), "Application release lock track scope");
  const candidateByTrack = new Map(candidate.tracks.map((track) => [track.trackId, track]));
  const readinessByTrack = new Map(readiness.tracks.map((track) => [track.trackId, track]));
  for (const artifact of lock.artifacts) {
    const trackId = artifact.trackId;
    for (const field of ["releaseId", "trackId", "contentVersion", "producerCommit", "sourceRepositoryCommit", "checksumSha256"]) {
      if (typeof artifact[field] !== "string" || artifact[field].length === 0) throw new Error(`Application release lock ${trackId} is missing ${field}.`);
    }
    commit(artifact.producerCommit, `Application release lock ${trackId} producerCommit`);
    commit(artifact.sourceRepositoryCommit, `Application release lock ${trackId} sourceRepositoryCommit`);
    sha(artifact.checksumSha256, `Application release lock ${trackId} checksumSha256`);
    const candidateArtifact = candidateByTrack.get(trackId)?.artifact;
    const readinessArtifact = readinessByTrack.get(trackId)?.artifact;
    for (const field of ["releaseId", "trackId", "contentVersion", "sourceRepositoryCommit", "checksumSha256"]) {
      if (artifact[field] !== candidateArtifact?.[field] || artifact[field] !== readinessArtifact?.[field]) {
        throw new Error(`Application release lock ${trackId} is incoherent with the accepted candidate.`);
      }
    }
  }
  return lock;
}

async function loadAndValidateContentContracts(contentRoot, candidateBytes, readinessBytes) {
  const candidateModulePath = join(contentRoot, "scripts/review/candidate-manifest.mjs");
  const approvalModulePath = join(contentRoot, "scripts/review/content-approval.mjs");
  try {
    const candidateContract = await import(pathToFileURL(candidateModulePath).href);
    const approvalContract = await import(pathToFileURL(approvalModulePath).href);
    const expectedTracks = candidateContract.CANDIDATE_TRACK_IDS;
    if (canonicalJson(expectedTracks) !== canonicalJson(CANDIDATE_TRACK_IDS)) throw new Error("ACC-02 owning validator track scope differs from the pinned nine-track scope.");
    const candidateFromReference = parseJson(candidateBytes, "Candidate Manifest");
    const candidate = await candidateContract.loadCandidateManifest(contentRoot);
    if (canonicalJson(candidate) !== canonicalJson(candidateFromReference)) throw new Error("Candidate Manifest reference does not name the owning candidate bytes.");
    if (typeof candidateContract.verifyCandidateManifest !== "function" || typeof candidateContract.verifyCandidateCurrentSource !== "function") {
      throw new Error("ACC-02 owning candidate verification functions are unavailable.");
    }
    await candidateContract.verifyCandidateManifest({ root: contentRoot, candidate });
    await candidateContract.verifyCandidateCurrentSource({ root: contentRoot, candidate });
    const approval = await approvalContract.loadHumanApprovalManifest({ root: contentRoot, candidate, trackIds: expectedTracks });
    const readiness = parseJson(readinessBytes, "Candidate Readiness");
    candidateContract.validateCandidateReadiness(readiness, { candidate, approval });
    return { candidate, readiness, approval };
  } catch (error) {
    if (error?.message?.startsWith("ACC-02") || error?.message?.startsWith("Candidate") || error?.message?.startsWith("Release")) throw error;
    throw new Error(`ACC-02 owning validator rejected content evidence: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function runOwningOpenApiCheck(backendRoot) {
  try {
    execFileSync("npm", ["run", "openapi:check", "--silent"], {
      cwd: backendRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch {
    throw new Error("Owning backend OpenAPI check failed.");
  }
}

function buildManifest({ commits, candidate, files }) {
  const manifest = {
    schemaVersion: RELEASE_MANIFEST_SCHEMA_VERSION,
    manifestId: "0".repeat(64),
    candidateId: candidate.candidateId,
    trackIds: [...CANDIDATE_TRACK_IDS],
    repositories: REPOSITORY_DEFINITIONS.map((definition) => ({ ...definition, commit: commits[definition.role] })),
    references: RELEASE_MANIFEST_REFERENCES.map((reference) => ({
      ...reference,
      sha256: files.get(`${reference.repositoryRole}:${reference.path}`).sha256,
    })),
  };
  manifest.manifestId = manifestIdFor(manifest);
  validateReleaseManifest(manifest);
  return manifest;
}

async function collectContracts(roots, candidatePathFiles) {
  const candidateReference = candidatePathFiles
    ? referenceFile(candidatePathFiles, "content", "evidence/content-acceptance/candidate-manifest-v1.json")
    : readRegularReference(roots.content, { repositoryRole: "content", path: "evidence/content-acceptance/candidate-manifest-v1.json" });
  const readinessReference = candidatePathFiles
    ? referenceFile(candidatePathFiles, "content", "evidence/readiness/candidate-readiness.json")
    : readRegularReference(roots.content, { repositoryRole: "content", path: "evidence/readiness/candidate-readiness.json" });
  return loadAndValidateContentContracts(roots.content, candidateReference.bytes, readinessReference.bytes);
}

function currentReferenceHashes(roots) {
  const references = [];
  for (const reference of RELEASE_MANIFEST_REFERENCES) {
    const file = readRegularReference(roots[reference.repositoryRole], reference);
    references.push({ ...reference, sha256: sha256(file.bytes) });
  }
  return references;
}

function manifestSummary(manifest, status = "verified") {
  return {
    status,
    manifestId: manifest.manifestId,
    candidateId: manifest.candidateId,
    trackIds: [...manifest.trackIds],
    repositories: manifest.repositories.map(({ role, slug, commit }) => ({ role, slug, commit })),
  };
}

export async function createReleaseManifest({
  outputPath,
  roots,
  applicationRoot,
  backendRoot,
  contentRoot,
  webRoot,
} = {}) {
  const repositoryRoots = normalizeRepositoryRoots({ roots, applicationRoot, backendRoot, contentRoot, webRoot });
  const output = validateOutputPath(outputPath, Object.values(repositoryRoots));
  const commits = inspectRepositories(repositoryRoots);
  const contractState = await collectContracts(repositoryRoots);
  const references = currentReferenceHashes(repositoryRoots);
  const referenceMap = new Map(references.map((reference) => [`${reference.repositoryRole}:${reference.path}`, reference]));
  const lockReference = readRegularReference(repositoryRoots.application, RELEASE_MANIFEST_REFERENCES[0]);
  const lock = parseJson(lockReference.bytes, "Application release lock");
  validateReleaseLock(lock, { ...contractState, trackIds: CANDIDATE_TRACK_IDS });
  runOwningOpenApiCheck(repositoryRoots.backend);
  const manifest = buildManifest({ commits, candidate: contractState.candidate, files: referenceMap });
  writeFileSync(output, canonicalJsonBytes(manifest), { encoding: "utf8" });
  return { ...manifestSummary(manifest, "created"), path: output };
}

export async function verifyReleaseManifest({
  manifestPath,
  roots,
  applicationRoot,
  backendRoot,
  contentRoot,
  webRoot,
} = {}) {
  const repositoryRoots = normalizeRepositoryRoots({ roots, applicationRoot, backendRoot, contentRoot, webRoot });
  const manifestFilePath = validateStandalonePath(manifestPath, "Manifest input", Object.values(repositoryRoots));
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestFilePath, "utf8"));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("Manifest input is not valid JSON.");
    throw new Error("Manifest input is unavailable.");
  }
  validateReleaseManifest(manifest);
  const commits = inspectRepositories(repositoryRoots, manifest.repositories);
  for (const repository of manifest.repositories) if (commits[repository.role] !== repository.commit) throw new Error(`Release manifest ${repository.role} commit is stale.`);
  const files = resolveReferences(manifest, repositoryRoots);
  const contractState = await collectContracts(repositoryRoots, files);
  if (contractState.candidate.candidateId !== manifest.candidateId) throw new Error("Release manifest candidateId is stale.");
  exactArray(contractState.readiness.trackIds, manifest.trackIds, "Candidate Readiness track scope");
  if (contractState.readiness.candidateId !== manifest.candidateId) throw new Error("Candidate Readiness candidateId is stale.");
  const lockReference = referenceFile(files, "application", "integration/contracts/content-release/release.lock.json");
  const lock = parseJson(lockReference.bytes, "Application release lock");
  validateReleaseLock(lock, { ...contractState, trackIds: manifest.trackIds });
  const openApiReference = referenceFile(files, "backend", "openapi/patternly-v1.json");
  if (sha256(readFileSync(openApiReference.path)) !== openApiReference.reference.sha256) throw new Error("Backend OpenAPI hash changed during verification.");
  runOwningOpenApiCheck(repositoryRoots.backend);
  if (sha256(readFileSync(openApiReference.path)) !== openApiReference.reference.sha256) throw new Error("Backend OpenAPI changed while its owning check ran.");
  return manifestSummary(manifest);
}

// Short aliases keep the contract convenient for programmatic callers while
// the explicit names above remain the canonical API used by releaseGate.
export const createManifest = createReleaseManifest;
export const verifyManifest = verifyReleaseManifest;
export const validateManifest = validateReleaseManifest;

function cliOption(options, key, value, argument) {
  if (Object.hasOwn(options, key)) throw new Error(`Unknown or duplicate argument: ${argument}`);
  if (!value || value.startsWith("--")) throw new Error(`${argument} requires a path`);
  options[key] = value;
}

function parseCli(argv) {
  const [mode, ...argumentsList] = argv;
  if (!mode || !["create", "verify"].includes(mode)) throw new Error("Usage: releaseManifest.mjs <create|verify> --application-root <path> --backend-root <path> --content-root <path> --web-root <path> --output|--manifest <path>");
  const options = { mode };
  const aliases = {
    "--application-root": "applicationRoot",
    "--backend-root": "backendRoot",
    "--content-root": "contentRoot",
    "--web-root": "webRoot",
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    const key = aliases[argument];
    if (key) {
      cliOption(options, key, argumentsList[index + 1], argument);
      index += 1;
    } else if (argument === "--output" && mode === "create") {
      cliOption(options, "outputPath", argumentsList[index + 1], argument);
      index += 1;
    } else if (argument === "--manifest" && mode === "verify") {
      cliOption(options, "manifestPath", argumentsList[index + 1], argument);
      index += 1;
    } else {
      throw new Error(`Unknown or duplicate argument: ${argument}`);
    }
  }
  for (const key of ["applicationRoot", "backendRoot", "contentRoot", "webRoot"]) if (!options[key]) throw new Error(`--${key.replace(/[A-Z]/g, (value) => `-${value.toLowerCase()}`)} is required`);
  if (mode === "create" && !options.outputPath) throw new Error("--output is required");
  if (mode === "verify" && !options.manifestPath) throw new Error("--manifest is required");
  return options;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  try {
    const options = parseCli(process.argv.slice(2));
    const result = options.mode === "create" ? await createReleaseManifest(options) : await verifyReleaseManifest(options);
    const { path: _path, ...portableResult } = result;
    process.stdout.write(`${JSON.stringify(portableResult, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
