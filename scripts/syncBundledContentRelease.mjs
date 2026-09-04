import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { resolve } from "node:path";

const root = process.cwd();
const contentRoot = resolve(root, "../patternly-content");
const lock = JSON.parse(readFileSync(resolve(root, "integration/contracts/content-release/release.lock.json"), "utf8"));
const freeNodeTarget = resolve(root, "src/content/bundled/generatedFreeNodePackages.ts");
const expectedTracks = [
  "coding-interview-dsa-problem-solving",
  "backend-system-design-interview",
  "object-oriented-design-interview",
  "frontend-system-design-interview",
  "google-cloud-associate-cloud-engineer",
  "aws-certified-solutions-architect-associate",
  "microsoft-azure-administrator-associate-az-104",
  "microsoft-azure-ai-fundamentals-ai-901",
  "claude-certified-architect-professional-certification",
];

if (lock?.schemaVersion !== 2 || lock.repository !== "lukaszkurczab/patternly-content" || typeof lock.bundleId !== "string" || !Array.isArray(lock.artifacts)) {
  throw new Error("The application content lock is invalid.");
}
if (lock.retainedArtifacts !== undefined && !Array.isArray(lock.retainedArtifacts)) {
  throw new Error("The retained application content lock is invalid.");
}
const lockedTracks = lock.artifacts.map((artifact) => artifact.trackId).sort();
if (JSON.stringify(lockedTracks) !== JSON.stringify([...expectedTracks].sort())) {
  throw new Error("The application content lock must pin exactly the registered content artifacts.");
}

for (const pin of [...lock.artifacts, ...(lock.retainedArtifacts ?? [])]) {
  if (!/^[a-f0-9]{40}$/.test(pin.producerCommit) || !/^[a-f0-9]{40}$/.test(pin.sourceRepositoryCommit) || !/^[a-f0-9]{64}$/.test(pin.checksumSha256)) {
    throw new Error(`Pinned artifact ${pin.trackId} has invalid immutable provenance.`);
  }
}
const readPackage = (releasePin) => {
  const configBytes = execFileSync("git", ["-C", contentRoot, "show", `${releasePin.producerCommit}:config/bundled-free-node-packages.json`], { encoding: "utf8" });
  const config = JSON.parse(configBytes);
  const pin = config.packages.find((entry) => entry.trackId === releasePin.trackId);
  const packageVersion = releasePin.packageVersion ?? pin?.packageVersion;
  const minimumAppVersion = releasePin.minimumAppVersion ?? pin?.minimumAppVersion;
  if (!packageVersion || !minimumAppVersion) throw new Error(`Missing immutable bundled Free-node package pin for ${releasePin.trackId}.`);
  const packagePath = `artifacts/bundled-free-nodes/${releasePin.trackId}/${packageVersion}/package.json`;
  const bytes = execFileSync("git", ["-C", contentRoot, "show", `${releasePin.producerCommit}:${packagePath}`], { encoding: "utf8" });
  const record = JSON.parse(bytes);
  const packageSha256 = createHash("sha256").update(bytes).digest("hex");
  if (record?.schemaVersion !== "bundled-free-node-v2" || record?.manifest?.trackId !== releasePin.trackId || record.manifest.packageVersion !== packageVersion || record.manifest.minimumAppVersion !== minimumAppVersion || record.manifest.contentVersion !== releasePin.contentVersion || record.manifest.provenance.releaseId !== releasePin.releaseId || record.manifest.provenance.sourceArtifactChecksumSha256 !== releasePin.checksumSha256 || releasePin.packageSha256 !== undefined && releasePin.packageSha256 !== packageSha256) throw new Error(`Invalid immutable bundled Free-node package for ${releasePin.trackId}.`);
  const payload = JSON.parse(gunzipSync(Buffer.from(record.payloadGzipBase64, "base64")).toString("utf8"));
  if (!Array.isArray(payload?.freeNodeExperienceProfile?.modes)) throw new Error(`Free-node profile payload is invalid for ${releasePin.trackId}.`);
  return { trackId: releasePin.trackId, packageVersion, packageBytes: bytes, packageSha256, packageSize: Buffer.byteLength(bytes), profileModes: payload.freeNodeExperienceProfile.modes.map((mode) => mode.modeId), manifest: record.manifest };
};
const freeNodePackages = expectedTracks.map((trackId) => {
  const releasePin = lock.artifacts.find((entry) => entry.trackId === trackId);
  if (!releasePin) throw new Error(`Missing release lock pin for ${trackId}.`);
  return readPackage(releasePin);
});
const retainedFreeNodePackages = (lock.retainedArtifacts ?? []).map(readPackage);
writeFileSync(freeNodeTarget, `/** Generated from immutable bundled Free-node package bytes; do not edit. */\nexport const GENERATED_FREE_NODE_PACKAGES = Object.freeze(${JSON.stringify(freeNodePackages)});\nexport const GENERATED_RETAINED_FREE_NODE_PACKAGES = Object.freeze(${JSON.stringify(retainedFreeNodePackages)});\n`, "utf8");
console.log(`BUNDLED_FREE_NODE_PACKAGES_SYNCED=${lock.bundleId}`);
