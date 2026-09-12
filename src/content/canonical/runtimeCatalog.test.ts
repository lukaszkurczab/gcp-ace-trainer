import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildCanonicalRuntimeCatalog, createCanonicalRuntimeCatalogOwner, loadCanonicalRuntimeCatalog } from ".";
import aws from "../generated/canonical-content/aws-certified-solutions-architect-associate.json";
import backend from "../generated/canonical-content/backend-system-design-interview.json";
import claude from "../generated/canonical-content/claude-certified-architect-professional-certification.json";
import coding from "../generated/canonical-content/coding-interview-dsa-problem-solving.json";
import frontend from "../generated/canonical-content/frontend-system-design-interview.json";
import gcp from "../generated/canonical-content/google-cloud-associate-cloud-engineer.json";
import az104 from "../generated/canonical-content/microsoft-azure-administrator-associate-az-104.json";
import ai901 from "../generated/canonical-content/microsoft-azure-ai-fundamentals-ai-901.json";
import lockFile from "../generated/canonical-content/content-lock.json";
import objectDesign from "../generated/canonical-content/object-oriented-design-interview.json";

test("canonical runtime catalog exposes all locked tracks, modes, pools, and exact artifact identities", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
  assert.equal(new Set(catalog.tracks).size, 9);
  assert.equal(catalog.tracks.reduce((count, trackId) => count + catalog.getTrack(trackId).modes.length, 0), 29);
  for (const trackId of catalog.tracks) {
    const track = catalog.getTrack(trackId);
    assert.equal(track.trackId, trackId);
    assert.equal(track.contentReleaseId, "canonical-content-v1");
    assert.match(track.artifactSha256, /^[a-f0-9]{64}$/u);
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
  assert.equal("getTrackByPin" in catalog, false);
});

test("injected loader failures are visible and do not poison the active cache", async () => {
  const badSha = async () => "0".repeat(64);
  await assert.rejects(() => buildCanonicalRuntimeCatalog({ artifacts: [coding], locks: [lockFile.tracks.find((entry) => entry.trackId === coding.trackId)!], sha256Utf8: badSha }), /SHA-256/);
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
});

test("canonical runtime catalog hashes artifacts sequentially and preserves artifact order", async () => {
  const sourceArtifacts = [aws, backend, claude, coding, frontend, gcp, az104, ai901, objectDesign];
  const expectedTrackIds = sourceArtifacts.map((artifact) => artifact.trackId);
  const hashedTrackIds: string[] = [];
  let activeHashers = 0;
  let maxConcurrentHashers = 0;
  const sha256Utf8 = async (canonicalUtf8: string): Promise<string> => {
    const artifact = JSON.parse(canonicalUtf8) as { trackId?: unknown };
    assert.equal(typeof artifact.trackId, "string");
    hashedTrackIds.push(artifact.trackId as string);
    activeHashers += 1;
    maxConcurrentHashers = Math.max(maxConcurrentHashers, activeHashers);
    await new Promise<void>((resolve) => setTimeout(resolve, 0));
    activeHashers -= 1;
    return createHash("sha256").update(canonicalUtf8, "utf8").digest("hex");
  };

  const catalog = await buildCanonicalRuntimeCatalog({ artifacts: sourceArtifacts, locks: lockFile.tracks, sha256Utf8 });

  assert.equal(maxConcurrentHashers, 1);
  assert.deepEqual(hashedTrackIds, expectedTrackIds);
  assert.deepEqual(catalog.tracks, expectedTrackIds);
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
