import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { LAUNCH_TRACK_IDS } from "..";

test("runtime admission resolves the exact candidate lock for every canonical launch track", async () => {
  const releaseLock = JSON.parse(await readFile(path.resolve("integration/contracts/content-release/release.lock.json"), "utf8")) as {
    schemaVersion: number; candidateId: string; bundledContentLockSha256: string;
    artifacts: { trackId: string; checksumSha256: string; contentVersion: string }[];
  };
  const contentLockBytes = await readFile(path.resolve("src/content/generated/canonical-content/content-lock.json"));
  const contentLock = JSON.parse(contentLockBytes.toString("utf8")) as { tracks: { trackId: string; sha256: string; contentVersion: string }[] };
  assert.equal(releaseLock.schemaVersion, 3);
  assert.equal(releaseLock.candidateId, "22b98e6c929f187e3afcd94183685b702cff6c72110d0882ea3e9b267c9c3f0f");
  assert.equal(releaseLock.bundledContentLockSha256, createHash("sha256").update(contentLockBytes).digest("hex"));
  assert.deepEqual(releaseLock.artifacts.map((item) => item.trackId), contentLock.tracks.map((item) => item.trackId));
  for (const [index, item] of releaseLock.artifacts.entries()) {
    assert.equal(item.checksumSha256, contentLock.tracks[index]!.sha256);
    assert.equal(item.contentVersion, contentLock.tracks[index]!.contentVersion);
  }
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.deepEqual([...catalog.tracks].sort(), [...LAUNCH_TRACK_IDS].sort());
  for (const id of LAUNCH_TRACK_IDS) {
    const track = catalog.getTrack(id);
    assert.ok(track.questions.length > 0);
    assert.ok(track.modes.length > 0);
    assert.ok(track.getPool(track.modes[0]!.modeId).length > 0);
  }
});
