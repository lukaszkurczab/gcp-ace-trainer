import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../src/content/bundled/generatedArtifacts";
import { validateBundledContent } from "../src/content/application";

const appRoot = process.cwd();
const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(appRoot, "../patternly-content");
const lock = JSON.parse(readFileSync(join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));

test("every bundled track exactly matches its independently published producer release", async () => {
  assert.equal(lock.schemaVersion, 2); assert.equal(lock.repository, "lukaszkurczab/patternly-content"); assert.match(lock.bundleId, /^patternly-app-content-/);
  assert.deepEqual(lock.artifacts.map((pin: { trackId: string }) => pin.trackId).sort(), ["coding-interview-dsa-problem-solving", "google-cloud-associate-cloud-engineer"]);
  assert.deepEqual(GENERATED_BUNDLED_CONTENT_RELEASE.manifest, { envelopeVersion: 1, bundleId: lock.bundleId });
  for (const pin of lock.artifacts) {
    assert.match(pin.producerCommit, /^[a-f0-9]{40}$/); assert.match(pin.sourceRepositoryCommit, /^[a-f0-9]{40}$/);
    const relativePath = `artifacts/releases/${pin.releaseId}/release.json`;
    const localBytes = readFileSync(join(contentRoot, relativePath), "utf8");
    const publishedBytes = execFileSync("git", ["-C", contentRoot, "show", `${pin.producerCommit}:${relativePath}`], { encoding: "utf8", maxBuffer: 20 * 1024 * 1024 });
    assert.equal(localBytes, publishedBytes);
    const release = JSON.parse(localBytes);
    assert.deepEqual(release.manifest, { envelopeVersion: 1, releaseId: pin.releaseId, sourceRepositoryCommit: pin.sourceRepositoryCommit });
    const producerArtifact = release.artifacts.find((artifact: { trackId: string }) => artifact.trackId === pin.trackId);
    assert.ok(producerArtifact);
    assert.equal(producerArtifact.contentVersion, pin.contentVersion);
    assert.equal(producerArtifact.checksumSha256, pin.checksumSha256);
    assert.equal(createHash("sha256").update(producerArtifact.artifactBytes).digest("hex"), pin.checksumSha256);
    const bundledArtifact = GENERATED_BUNDLED_CONTENT_RELEASE.artifacts.find((artifact) => artifact.trackId === pin.trackId);
    assert.deepEqual(bundledArtifact, { ...producerArtifact, releaseId: pin.releaseId });
  }
  const availability = await validateBundledContent(GENERATED_BUNDLED_CONTENT_RELEASE);
  assert.deepEqual(Object.fromEntries(availability.tracks.map((track) => [track.trackId, track.kind])), { "coding-interview-dsa-problem-solving": "available", "google-cloud-associate-cloud-engineer": "available" });
});

test("CI reads the current per-artifact content lock instead of retired aggregate lock fields", () => {
  const workflow = readFileSync(join(appRoot, ".github", "workflows", "qa.yml"), "utf8");
  assert.match(workflow, /lock\.schemaVersion !== 2/u);
  assert.match(workflow, /coding-interview-dsa-problem-solving,google-cloud-associate-cloud-engineer/u);
  assert.doesNotMatch(workflow, /algorithms,cloud-certification/u);
  assert.doesNotMatch(workflow, /lock\.producerCommit/u);
  assert.doesNotMatch(workflow, /lock\.sourceRepositoryCommit/u);
});
