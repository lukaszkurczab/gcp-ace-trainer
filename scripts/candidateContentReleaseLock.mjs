import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EXPECTED_TRACK_IDS, validateBuiltContent } from "./syncBundledContentRelease.mjs";

const APP_ROOT = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const DEFAULT_CONTENT_ROOT = path.resolve(APP_ROOT, "../patternly-content");
const CANDIDATE_PATH = "reports/candidate-reconciliation/AWS-02-DRAFT/candidate/manifest.json";
const RELEASE_PATH = "reports/candidate-reconciliation/AWS-02-DRAFT/release/release.json";
const BUNDLED_LOCK_PATH = "src/content/generated/canonical-content/content-lock.json";
const OUTPUT_PATH = "integration/contracts/content-release/release.lock.json";
const HISTORICAL_PATH = "integration/contracts/content-release/release.lock.historical-0024.json";
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const canonical = (value) => value === null || ["boolean", "number", "string"].includes(typeof value)
  ? JSON.stringify(value)
  : Array.isArray(value)
    ? `[${value.map(canonical).join(",")}]`
    : `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
const bytes = (value) => Buffer.from(`${canonical(value)}\n`);

async function json(root, relativePath) {
  return JSON.parse(await readFile(path.join(root, relativePath), "utf8"));
}

// Bootstrap only: bind the checkout pin to the app's current immutable bytes.
// The existing candidate check after checkout still owns source/release proof.
export async function readCandidateContentProducerPin({ appRoot = APP_ROOT } = {}) {
  const lock = await json(appRoot, OUTPUT_PATH);
  const keys = (value, expected) => value !== null && typeof value === "object" && !Array.isArray(value) && JSON.stringify(Object.keys(value).sort()) === JSON.stringify([...expected].sort());
  const hash = value => typeof value === "string" && /^[a-f0-9]{64}$/u.test(value);
  const commit = value => typeof value === "string" && /^[a-f0-9]{40}$/u.test(value);
  if (!keys(lock, ["schemaVersion", "repository", "bundleId", "candidateId", "candidateManifestPath", "releaseManifestPath", "releaseManifestSha256", "bundledContentLockSha256", "artifacts"]) || lock.schemaVersion !== 3 || lock.repository !== "lukaszkurczab/patternly-content" || !hash(lock.candidateId) || lock.bundleId !== `patternly-app-candidate-${lock.candidateId.slice(0, 12)}` || lock.candidateManifestPath !== CANDIDATE_PATH || lock.releaseManifestPath !== RELEASE_PATH || !hash(lock.releaseManifestSha256) || !hash(lock.bundledContentLockSha256) || !Array.isArray(lock.artifacts) || lock.artifacts.length !== EXPECTED_TRACK_IDS.length) {
    throw new Error("Candidate release lock bootstrap metadata is invalid.");
  }
  const ids = lock.artifacts.map(artifact => artifact?.trackId);
  if (JSON.stringify([...ids].sort()) !== JSON.stringify(EXPECTED_TRACK_IDS) || new Set(ids).size !== EXPECTED_TRACK_IDS.length) throw new Error("Candidate release lock bootstrap track identity is invalid.");
  const pin = lock.artifacts[0].producerCommit;
  for (const artifact of lock.artifacts) {
    if (!keys(artifact, ["releaseId", "producerCommit", "sourceRepositoryCommit", "trackId", "contentVersion", "checksumSha256"]) || !commit(pin) || artifact.producerCommit !== pin || artifact.sourceRepositoryCommit !== pin || artifact.releaseId !== lock.artifacts[0].releaseId || typeof artifact.releaseId !== "string" || !/^[a-z][a-z0-9-]*$/u.test(artifact.releaseId) || typeof artifact.contentVersion !== "string" || !artifact.contentVersion.trim() || artifact.contentVersion.trim() !== artifact.contentVersion || !hash(artifact.checksumSha256)) throw new Error("Candidate release lock bootstrap artifact metadata is invalid.");
  }
  const bundledBytes = await readFile(path.join(appRoot, BUNDLED_LOCK_PATH));
  if (sha256(bundledBytes) !== lock.bundledContentLockSha256) throw new Error("Candidate release lock bootstrap bundled lock hash differs.");
  const built = await validateBuiltContent(path.join(appRoot, path.dirname(BUNDLED_LOCK_PATH)));
  for (const artifact of lock.artifacts) {
    const track = built.lock.tracks.find(entry => entry.trackId === artifact.trackId);
    if (!track || track.sha256 !== artifact.checksumSha256 || track.contentVersion !== artifact.contentVersion) throw new Error("Candidate release lock bootstrap bundled artifact differs.");
  }
  return pin;
}

// Frozen history is a separate input, never an active schema-v2 fallback.
export async function readHistoricalContentProducerPin({ appRoot = APP_ROOT } = {}) {
  const frozenBytes = await readFile(path.join(appRoot, HISTORICAL_PATH));
  if (sha256(frozenBytes) !== "d5058e8678ceab38fbdb3fc6ea423b80e21571885549df9b42dd6e3916312195") throw new Error("Frozen historical release lock hash differs.");
  const pin = JSON.parse(frozenBytes).artifacts.at(-1)?.producerCommit;
  if (typeof pin !== "string" || !/^[a-f0-9]{40}$/u.test(pin)) throw new Error("Frozen historical producer pin is invalid.");
  return pin;
}

export async function createCandidateContentReleaseLock({ appRoot = APP_ROOT, contentRoot = DEFAULT_CONTENT_ROOT } = {}) {
  const [candidate, release, bundled] = await Promise.all([
    json(contentRoot, CANDIDATE_PATH),
    json(contentRoot, RELEASE_PATH),
    json(appRoot, BUNDLED_LOCK_PATH),
  ]);
  if (candidate.status !== "draft_not_admitted" || candidate.release.releaseId !== release.manifest.releaseId) throw new Error("Candidate release identity is invalid.");
  if (candidate.release.checksumSha256 !== sha256(bytes(release))) throw new Error("Candidate release checksum is stale.");
  const bundledByTrack = new Map(bundled.tracks.map((track) => [track.trackId, track]));
  const artifacts = release.artifacts.map((artifact) => {
    const track = bundledByTrack.get(artifact.trackId);
    if (!track || track.sha256 !== artifact.checksumSha256 || track.contentVersion !== artifact.contentVersion || track.questionCount !== artifact.questionCount) {
      throw new Error(`Bundled content differs from candidate artifact ${artifact.trackId}.`);
    }
    return {
      releaseId: release.manifest.releaseId,
      producerCommit: release.manifest.sourceRepositoryCommit,
      sourceRepositoryCommit: release.manifest.sourceRepositoryCommit,
      trackId: artifact.trackId,
      contentVersion: artifact.contentVersion,
      checksumSha256: artifact.checksumSha256,
    };
  });
  if (artifacts.length !== 9 || bundledByTrack.size !== 9) throw new Error("Candidate release lock must bind exactly nine tracks.");
  return {
    schemaVersion: 3,
    repository: "lukaszkurczab/patternly-content",
    bundleId: `patternly-app-candidate-${candidate.candidateId.slice(0, 12)}`,
    candidateId: candidate.candidateId,
    candidateManifestPath: CANDIDATE_PATH,
    releaseManifestPath: RELEASE_PATH,
    releaseManifestSha256: sha256(bytes(release)),
    bundledContentLockSha256: sha256(await readFile(path.join(appRoot, BUNDLED_LOCK_PATH))),
    artifacts,
  };
}

export async function updateCandidateContentReleaseLock({ mode = "check", appRoot = APP_ROOT, contentRoot = DEFAULT_CONTENT_ROOT } = {}) {
  const expected = bytes(await createCandidateContentReleaseLock({ appRoot, contentRoot }));
  const output = path.join(appRoot, OUTPUT_PATH);
  if (mode === "write") {
    try { await readFile(path.join(appRoot, HISTORICAL_PATH)); }
    catch { await writeFile(path.join(appRoot, HISTORICAL_PATH), await readFile(output)); }
    await writeFile(output, expected);
    return;
  }
  const actual = await readFile(output);
  if (!actual.equals(expected)) throw new Error(`Candidate release lock is stale; run node scripts/candidateContentReleaseLock.mjs write.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? "check";
  if (!new Set(["check", "write", "producer-pin", "historical-producer-pin"]).has(mode)) throw new Error("Usage: node scripts/candidateContentReleaseLock.mjs [check|write|producer-pin|historical-producer-pin]");
  const readPin = mode === "producer-pin" ? readCandidateContentProducerPin : mode === "historical-producer-pin" ? readHistoricalContentProducerPin : null;
  const run = readPin ? readPin().then(pin => process.stdout.write(`${pin}\n`)) : updateCandidateContentReleaseLock({ mode }).then(() => process.stdout.write(`candidate content release lock ${mode} passed\n`));
  run.catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
