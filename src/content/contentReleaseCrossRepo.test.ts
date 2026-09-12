import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "./canonical";

test("bundled canonical release matches the producer repository lock", async () => {
  const appRoot = process.cwd();
  const contentRoot = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(appRoot, "../patternly-content");
  const lock = JSON.parse(readFileSync(join(appRoot, "src/content/generated/canonical-content/content-lock.json"), "utf8")) as { schemaVersion: number; tracks: readonly { trackId: string; sha256: string; contentVersion: string; questionCount: number }[] };
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.deepEqual([...catalog.tracks].sort(), [...lock.tracks.map((track) => track.trackId)].sort());
  for (const entry of lock.tracks) {
    const track = catalog.getTrack(entry.trackId);
    const producerPath = join(contentRoot, "artifacts/tracks", entry.trackId, entry.contentVersion, "track-artifact.json");
    const producer = JSON.parse(readFileSync(producerPath, "utf8")) as { trackId?: string; contentVersion?: string };
    assert.equal(producer.trackId, entry.trackId);
    assert.equal(producer.contentVersion, entry.contentVersion);
    assert.equal(track.artifactSha256, entry.sha256);
    assert.equal(track.contentVersion, entry.contentVersion);
    assert.equal(track.packagePin.packageIdentity, entry.sha256);
    assert.equal(track.packagePin.packageVersion, entry.contentVersion);
    assert.equal(track.packagePin.contentReleaseId, "canonical-content-v1");
  }
});
