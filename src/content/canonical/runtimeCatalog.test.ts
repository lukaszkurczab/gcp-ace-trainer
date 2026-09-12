import assert from "node:assert/strict";
import test from "node:test";
import { buildCanonicalRuntimeCatalog, createCanonicalRuntimeCatalogOwner, loadCanonicalRuntimeCatalog } from ".";
import coding from "../generated/canonical-content/coding-interview-dsa-problem-solving.json";
import lockFile from "../generated/canonical-content/content-lock.json";

test("canonical runtime catalog exposes all locked tracks, modes, pools, and one-way pins", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
  assert.equal(new Set(catalog.tracks).size, 9);
  assert.equal(catalog.tracks.reduce((count, trackId) => count + catalog.getTrack(trackId).modes.length, 0), 29);
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId);
    assert.equal(track.trackId, trackId);
    assert.equal(track.packagePin.contentReleaseId, "canonical-content-v1");
    assert.equal(track.packagePin.packageIdentity, track.artifactSha256);
    assert.equal(track.packagePin.packageVersion, track.contentVersion);
    assert.ok(Object.isFrozen(track.questions));
    assert.ok(track.modes.length > 0);
    for (const mode of track.modes) {
      const pool = track.getPool(mode.modeId);
      assert.ok(pool.length > 0, `${trackId}/${mode.modeId}`);
      assert.deepEqual(pool, catalog.getPool(trackId, mode.modeId));
      assert.deepEqual(track.getMode(mode.modeId), mode);
    }
    const first = track.questions[0]!;
    assert.equal(catalog.getQuestion(trackId, first.questionId), first);
    assert.ok(catalog.getNode(trackId, first.nodeId).includes(first));
    assert.ok(catalog.getMentalUnit(trackId, first.mentalUnitId).includes(first));
  }
  assert.throws(() => catalog.getTrack("legacy-track"), /unavailable; restart/);
  assert.throws(() => catalog.getMode(catalog.tracks[0]!, "legacy-mode"), /unavailable; restart/);
  assert.equal(catalog.getTrackByPin(catalog.getTrack(catalog.tracks[0]!).packagePin).trackId, catalog.tracks[0]);
  assert.throws(() => catalog.getTrackByPin({ ...catalog.getTrack(catalog.tracks[0]!).packagePin, packageVersion: "legacy" }), /unavailable; restart/);
});

test("injected loader failures are visible and do not poison the active cache", async () => {
  const badSha = async () => "0".repeat(64);
  await assert.rejects(() => buildCanonicalRuntimeCatalog({ artifacts: [coding], locks: [lockFile.tracks.find((entry) => entry.trackId === coding.trackId)!], sha256Utf8: badSha }), /SHA-256/);
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
});

test("public owner retries after a failed cached load and then preserves cache identity", async () => {
  let fail = true;
  const owner = createCanonicalRuntimeCatalogOwner({ sha256Utf8: async (value) => {
    if (fail) return "0".repeat(64);
    const { sha256Utf8 } = await import("../../infrastructure/identity/sha256");
    return sha256Utf8(value);
  } });
  await assert.rejects(() => owner.load(), /SHA-256/);
  fail = false;
  const recovered = await owner.load();
  assert.equal(await owner.load(), recovered);
});

test("canonical runtime catalog caches only a validated active catalog", async () => {
  assert.equal(await loadCanonicalRuntimeCatalog(), await loadCanonicalRuntimeCatalog());
});
