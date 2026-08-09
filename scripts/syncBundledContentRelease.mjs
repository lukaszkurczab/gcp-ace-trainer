import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const contentRoot = resolve(root, "../patternly-content");
const releasesRoot = resolve(contentRoot, "artifacts/releases");
const lock = JSON.parse(readFileSync(resolve(root, "integration/contracts/content-release/release.lock.json"), "utf8"));
const target = resolve(root, "src/content/bundled/generatedArtifacts.ts");
const assetsTarget = resolve(root, "src/content/bundled/generatedAlgorithmFeedbackAssets.ts");
const expectedTracks = ["coding-interview-dsa-problem-solving", "google-cloud-associate-cloud-engineer"];

if (lock?.schemaVersion !== 2 || lock.repository !== "lukaszkurczab/patternly-content" || typeof lock.bundleId !== "string" || !Array.isArray(lock.artifacts)) {
  throw new Error("The application content lock is invalid.");
}
const lockedTracks = lock.artifacts.map((artifact) => artifact.trackId).sort();
if (JSON.stringify(lockedTracks) !== JSON.stringify(expectedTracks)) {
  throw new Error("The application content lock must pin exactly the two registered track artifacts.");
}

const artifacts = lock.artifacts.map((pin) => {
  if (!/^[a-f0-9]{40}$/.test(pin.producerCommit) || !/^[a-f0-9]{40}$/.test(pin.sourceRepositoryCommit) || !/^[a-f0-9]{64}$/.test(pin.checksumSha256)) {
    throw new Error(`Pinned artifact ${pin.trackId} has invalid immutable provenance.`);
  }
  const relativeReleasePath = `artifacts/releases/${pin.releaseId}/release.json`;
  const publishedBytes = execFileSync("git", ["-C", contentRoot, "show", `${pin.producerCommit}:${relativeReleasePath}`], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
  const localBytes = readFileSync(resolve(releasesRoot, pin.releaseId, "release.json"), "utf8");
  if (publishedBytes !== localBytes) throw new Error(`Pinned release ${pin.releaseId} does not match producer commit ${pin.producerCommit}.`);
  const release = JSON.parse(localBytes);
  if (release?.manifest?.envelopeVersion !== 1 || release.manifest.releaseId !== pin.releaseId || release.manifest.sourceRepositoryCommit !== pin.sourceRepositoryCommit || !Array.isArray(release.artifacts)) {
    throw new Error(`Pinned release manifest ${pin.releaseId} is invalid.`);
  }
  const artifact = release.artifacts.find((candidate) => candidate.trackId === pin.trackId);
  if (!artifact || artifact.contentVersion !== pin.contentVersion || artifact.checksumSha256 !== pin.checksumSha256 || artifact.sourceRepositoryCommit !== pin.sourceRepositoryCommit) {
    throw new Error(`Pinned artifact ${pin.trackId} does not match release ${pin.releaseId}.`);
  }
  if (createHash("sha256").update(artifact.artifactBytes).digest("hex") !== artifact.checksumSha256) {
    throw new Error(`Pinned artifact ${pin.trackId} bytes do not match their checksum.`);
  }
  return { ...artifact, releaseId: pin.releaseId };
});

const bundle = { manifest: { envelopeVersion: 1, bundleId: lock.bundleId }, artifacts };
const checksums = Object.fromEntries(artifacts.map((artifact) => [artifact.trackId, artifact.checksumSha256]));
const releaseIds = Object.fromEntries(artifacts.map((artifact) => [artifact.trackId, artifact.releaseId]));
const output = `import type { BundledContentRelease } from "../contracts";\n\n/** Generated from the exact producer releases pinned by the application content lock; do not edit artifact bytes. */\nexport const BUNDLED_CONTENT_BUNDLE_ID = ${JSON.stringify(lock.bundleId)};\nexport const BUNDLED_CONTENT_RELEASE_IDS = Object.freeze(${JSON.stringify(releaseIds)});\nexport const BUNDLED_CONTENT_ARTIFACT_CHECKSUMS = Object.freeze(${JSON.stringify(checksums)});\nexport const GENERATED_BUNDLED_CONTENT_RELEASE: BundledContentRelease = Object.freeze(${JSON.stringify(bundle)});\n`;
const codingInterviewArtifact = artifacts.find((artifact) => artifact.trackId === "coding-interview-dsa-problem-solving");
const codingInterviewEnvelope = codingInterviewArtifact && JSON.parse(codingInterviewArtifact.artifactBytes);
const feedbackAssets = codingInterviewEnvelope?.bank?.feedbackAssets;
if (!Array.isArray(feedbackAssets)) throw new Error("Pinned Coding Interview artifact does not declare feedback assets.");
const localAssets = feedbackAssets.map((asset) => {
  if (!asset || typeof asset !== "object" || !/^[a-z0-9][a-z0-9/_-]*$/.test(asset.id) || !/^manual\/assets\/coding-interview-dsa-problem-solving\/.+\.svg$/.test(asset.sourcePath) || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error("Pinned Coding Interview feedback asset identity is invalid.");
  const contentPath = resolve(contentRoot, asset.sourcePath);
  const xml = readFileSync(contentPath, "utf8");
  const actual = createHash("sha256").update(xml).digest("hex");
  if (actual !== asset.sha256) throw new Error(`Coding Interview feedback asset hash mismatch: ${asset.id}.`);
  return { id: asset.id, sha256: asset.sha256, xml };
});
const assetsOutput = `/** Generated from the pinned Coding Interview artifact and its hash-verified local SVG files; do not edit. */\nexport const GENERATED_ALGORITHM_FEEDBACK_ASSETS = Object.freeze(${JSON.stringify(localAssets)});\n`;
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, output, "utf8");
writeFileSync(assetsTarget, assetsOutput, "utf8");
console.log(`BUNDLED_CONTENT_SYNCED=${lock.bundleId}`);
