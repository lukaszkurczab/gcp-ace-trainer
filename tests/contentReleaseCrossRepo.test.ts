import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";

import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../src/content/bundled/generatedArtifacts";
import { validateBundledContent } from "../src/content/application";

const appRoot = process.cwd();
const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(appRoot, "../patternly-content");
const lock = JSON.parse(readFileSync(join(appRoot, "integration/contracts/content-release/release.lock.json"), "utf8"));

test("the pinned multi-track release exactly matches the producer manifest and application bundle", async () => {
  assert.equal(lock.schemaVersion, 1); assert.equal(lock.repository, "lukaszkurczab/patternly-content"); assert.match(lock.producerCommit, /^[a-f0-9]{40}$/); assert.match(lock.sourceRepositoryCommit, /^[a-f0-9]{40}$/);
  const release = JSON.parse(readFileSync(join(contentRoot, "artifacts/releases", lock.releaseId, "release.json"), "utf8"));
  assert.deepEqual(release.manifest, { envelopeVersion: 1, releaseId: lock.releaseId, sourceRepositoryCommit: lock.sourceRepositoryCommit });
  const identity = (artifact: { trackId: string; contentVersion: string; checksumSha256: string }) => ({ trackId: artifact.trackId, contentVersion: artifact.contentVersion, checksumSha256: artifact.checksumSha256 });
  assert.deepEqual(release.artifacts.map(identity), lock.artifacts);
  assert.deepEqual(GENERATED_BUNDLED_CONTENT_RELEASE.manifest, release.manifest);
  assert.deepEqual(GENERATED_BUNDLED_CONTENT_RELEASE.artifacts.map(identity), lock.artifacts);
  for (const artifact of release.artifacts) assert.equal(createHash("sha256").update(artifact.artifactBytes).digest("hex"), artifact.checksumSha256);
  const availability = await validateBundledContent(GENERATED_BUNDLED_CONTENT_RELEASE);
  assert.deepEqual(Object.fromEntries(availability.tracks.map((track) => [track.trackId, track.kind])), { algorithms: "available", "cloud-certification": "available" });
});
