import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const releasesRoot = resolve(root, "../patternly-content/artifacts/releases");
const releaseId = readdirSync(releasesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^patternly-core-\d{4}$/.test(entry.name))
  .map((entry) => entry.name)
  .sort()
  .at(-1);
if (!releaseId) throw new Error("No canonical Patternly multi-track release is available to sync.");
const source = resolve(releasesRoot, releaseId, "generated-bundled-content.mjs");
const target = resolve(root, "src/content/bundled/generatedArtifacts.ts");
const assetsTarget = resolve(root, "src/content/bundled/generatedAlgorithmFeedbackAssets.ts");
const module = await import(pathToFileURL(source).href);
const release = module.GENERATED_BUNDLED_CONTENT_RELEASE;

if (!release || release.manifest?.releaseId !== releaseId || !Array.isArray(release.artifacts)) {
  throw new Error("The canonical Patternly release is not a readable immutable release envelope.");
}
const tracks = [...release.artifacts].map((artifact) => artifact.trackId).sort();
if (JSON.stringify(tracks) !== JSON.stringify(["algorithms", "cloud-certification"])) {
  throw new Error("The canonical Patternly release must pin exactly Algorithms and Cloud Certification artifacts.");
}
for (const artifact of release.artifacts) {
  if (typeof artifact.artifactBytes !== "string" || !/^[a-f0-9]{64}$/.test(artifact.checksumSha256) || !/^[a-f0-9]{40}$/.test(artifact.sourceRepositoryCommit)) {
    throw new Error(`Pinned artifact ${artifact.trackId} is not an immutable artifact reference.`);
  }
}

const checksums = Object.fromEntries(release.artifacts.map((artifact) => [artifact.trackId, artifact.checksumSha256]));
const output = `import type { BundledContentRelease } from "../contracts";\n\n/** Generated from the canonical Patternly multi-track release; do not edit artifact bytes. */\nexport const BUNDLED_CONTENT_RELEASE_ID = ${JSON.stringify(release.manifest.releaseId)};\nexport const BUNDLED_CONTENT_RELEASE_SOURCE_COMMIT = ${JSON.stringify(release.manifest.sourceRepositoryCommit)};\nexport const BUNDLED_CONTENT_ARTIFACT_CHECKSUMS = Object.freeze(${JSON.stringify(checksums)});\nexport const GENERATED_BUNDLED_CONTENT_RELEASE: BundledContentRelease = Object.freeze(${JSON.stringify(release)});\n`;
const algorithmsArtifact = release.artifacts.find((artifact) => artifact.trackId === "algorithms");
const algorithmsEnvelope = algorithmsArtifact && JSON.parse(algorithmsArtifact.artifactBytes);
const feedbackAssets = algorithmsEnvelope?.bank?.feedbackAssets;
if (!Array.isArray(feedbackAssets)) throw new Error("Pinned Algorithms artifact does not declare feedback assets.");
const localAssets = feedbackAssets.map((asset) => {
  if (!asset || typeof asset !== "object" || !/^[a-z0-9][a-z0-9/_-]*$/.test(asset.id) || !/^manual\/assets\/algorithms\/.+\.svg$/.test(asset.sourcePath) || !/^[a-f0-9]{64}$/.test(asset.sha256)) throw new Error("Pinned Algorithms feedback asset identity is invalid.");
  const contentPath = resolve(root, "../patternly-content", asset.sourcePath);
  const xml = readFileSync(contentPath, "utf8");
  const actual = createHash("sha256").update(xml).digest("hex");
  if (actual !== asset.sha256) throw new Error(`Algorithms feedback asset hash mismatch: ${asset.id}.`);
  return { id: asset.id, sha256: asset.sha256, xml };
});
const assetsOutput = `/** Generated from the pinned Algorithms artifact and its hash-verified local SVG files; do not edit. */\nexport const GENERATED_ALGORITHM_FEEDBACK_ASSETS = Object.freeze(${JSON.stringify(localAssets)});\n`;
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, output, "utf8");
writeFileSync(assetsTarget, assetsOutput, "utf8");
console.log(`BUNDLED_RELEASE_SYNCED=${release.manifest.releaseId}`);
