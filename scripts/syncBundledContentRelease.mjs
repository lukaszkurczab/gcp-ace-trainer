import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { execFileSync } from "node:child_process";
import { dirname, resolve } from "node:path";

const root = process.cwd();
const contentRoot = resolve(root, "../patternly-content");
const lock = JSON.parse(readFileSync(resolve(root, "integration/contracts/content-release/release.lock.json"), "utf8"));
const freeNodeTarget = resolve(root, "src/content/bundled/generatedFreeNodePackages.ts");
const expectedTracks = ["coding-interview-dsa-problem-solving", "google-cloud-associate-cloud-engineer", "microsoft-azure-administrator-associate-az-104"];

if (lock?.schemaVersion !== 2 || lock.repository !== "lukaszkurczab/patternly-content" || typeof lock.bundleId !== "string" || !Array.isArray(lock.artifacts)) {
  throw new Error("The application content lock is invalid.");
}
const lockedTracks = lock.artifacts.map((artifact) => artifact.trackId).sort();
if (JSON.stringify(lockedTracks) !== JSON.stringify(expectedTracks)) {
  throw new Error("The application content lock must pin exactly the registered content artifacts.");
}

for (const pin of lock.artifacts) {
  if (!/^[a-f0-9]{40}$/.test(pin.producerCommit) || !/^[a-f0-9]{40}$/.test(pin.sourceRepositoryCommit) || !/^[a-f0-9]{64}$/.test(pin.checksumSha256)) {
    throw new Error(`Pinned artifact ${pin.trackId} has invalid immutable provenance.`);
  }
}
const freeNodePackages = expectedTracks.map((trackId) => {
  const releasePin = lock.artifacts.find((entry) => entry.trackId === trackId);
  if (!releasePin) throw new Error(`Missing release lock pin for ${trackId}.`);
  const configBytes = execFileSync("git", ["-C", contentRoot, "show", `${releasePin.producerCommit}:config/bundled-free-node-packages.json`], { encoding: "utf8" });
  const config = JSON.parse(configBytes);
  const pin = config.packages.find((entry) => entry.trackId === trackId);
  const packageVersion = pin?.packageVersion ?? (trackId === "google-cloud-associate-cloud-engineer" ? "google-cloud-associate-cloud-engineer-free-node-0001" : undefined);
  const minimumAppVersion = pin?.minimumAppVersion ?? "0.1.0";
  if (!packageVersion) throw new Error(`Missing bundled Free-node package pin for ${trackId}.`);
  const packagePath = `artifacts/bundled-free-nodes/${trackId}/${packageVersion}/package.json`;
  const bytes = execFileSync("git", ["-C", contentRoot, "show", `${releasePin.producerCommit}:${packagePath}`], { encoding: "utf8" });
  const record = JSON.parse(bytes);
  if (record?.schemaVersion !== "bundled-free-node-v2" || record?.manifest?.trackId !== trackId || record.manifest.packageVersion !== packageVersion || record.manifest.minimumAppVersion !== minimumAppVersion || record.manifest.contentVersion !== releasePin.contentVersion || record.manifest.provenance.releaseId !== releasePin.releaseId || record.manifest.provenance.sourceArtifactChecksumSha256 !== releasePin.checksumSha256) throw new Error(`Invalid immutable bundled Free-node package for ${trackId}.`);
  const payload = JSON.parse(gunzipSync(Buffer.from(record.payloadGzipBase64, "base64")).toString("utf8"));
  if (!Array.isArray(payload?.freeNodeExperienceProfile?.modes)) throw new Error(`Free-node profile payload is invalid for ${trackId}.`);
  return { trackId, packageVersion, packageBytes: bytes, packageSha256: createHash("sha256").update(bytes).digest("hex"), packageSize: Buffer.byteLength(bytes), profileModes: payload.freeNodeExperienceProfile.modes.map((mode) => mode.modeId), manifest: record.manifest };
});
writeFileSync(freeNodeTarget, `/** Generated from immutable bundled Free-node package bytes; do not edit. */\nexport const GENERATED_FREE_NODE_PACKAGES = Object.freeze(${JSON.stringify(freeNodePackages)});\n`, "utf8");
console.log(`BUNDLED_FREE_NODE_PACKAGES_SYNCED=${lock.bundleId}`);
