import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
  if (!new Set(["check", "write"]).has(mode)) throw new Error("Usage: node scripts/candidateContentReleaseLock.mjs [check|write]");
  updateCandidateContentReleaseLock({ mode }).then(() => process.stdout.write(`candidate content release lock ${mode} passed\n`)).catch((error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
}
