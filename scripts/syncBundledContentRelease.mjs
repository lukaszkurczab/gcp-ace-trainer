import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = process.cwd();
const source = resolve(root, "../patternly-content/artifacts/releases/patternly-core-0008/generated-bundled-content.mjs");
const target = resolve(root, "src/content/bundled/generatedArtifacts.ts");
const module = await import(pathToFileURL(source).href);
const release = module.GENERATED_BUNDLED_CONTENT_RELEASE;

if (!release || release.manifest?.releaseId !== "patternly-core-0008" || !Array.isArray(release.artifacts)) {
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
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, output, "utf8");
console.log(`BUNDLED_RELEASE_SYNCED=${release.manifest.releaseId}`);
