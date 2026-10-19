import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { LAUNCH_TRACK_IDS } from "..";

test("launch catalog binds the exact current source artifacts and training projections", async () => {
  const appRoot = process.cwd();
  const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"));
  const verifier = await import("../../../scripts/candidateContentReleaseLock.mjs") as unknown as {
    verifyCandidateContentAdmission(options?: Readonly<{ appRoot?: string; contentRoot?: string }>): Promise<{ sourceInputFingerprint: string; trackIds: readonly string[] }>;
  };
  const current = await verifier.verifyCandidateContentAdmission({ appRoot, contentRoot });
  const releaseLock = JSON.parse(await readFile(path.resolve("integration/contracts/content-release/release.lock.json"), "utf8"));
  assert.equal(releaseLock.schemaVersion, 4);
  assert.equal(current.sourceInputFingerprint, releaseLock.sourceInputFingerprint);
  assert.deepEqual([...current.trackIds].sort(), [...LAUNCH_TRACK_IDS].sort());

  const contentLock = JSON.parse(await readFile(path.resolve("src/content/generated/canonical-content/content-lock.json"), "utf8"));
  const releaseLockHash = createHash("sha256").update(await readFile(path.resolve("src/content/generated/canonical-content/content-lock.json"))).digest("hex");
  assert.equal(releaseLockHash, releaseLock.bundledContentLockSha256);
  const successorLedger = JSON.parse(await readFile(path.resolve("src/content/generated/canonical-content/content-successor-ledger.json"), "utf8"));
  const contentByTrack = new Map(contentLock.tracks.map((item: { trackId: string }) => [item.trackId, item]));
  const releaseByTrack = new Map(releaseLock.artifacts.map((item: { trackId: string }) => [item.trackId, item]));
  const successorByTrack = new Map(successorLedger.tracks.map((item: { trackId: string }) => [item.trackId, item]));
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.deepEqual([...catalog.tracks].sort(), [...LAUNCH_TRACK_IDS].sort());
  for (const id of LAUNCH_TRACK_IDS) {
    const track = catalog.getTrack(id);
    const currentContent = contentByTrack.get(id) as { sha256: string; contentVersion: string } | undefined;
    const currentRelease = releaseByTrack.get(id) as { checksumSha256: string; contentVersion: string } | undefined;
    const successor = successorByTrack.get(id) as { training: { contentVersion: string; artifactSha256: string }; planningPolicy: unknown } | undefined;
    assert.ok(currentContent && currentRelease && successor, `identities exist for ${id}`);
    assert.equal(track.artifactSha256, currentContent.sha256);
    assert.equal(track.contentVersion, currentContent.contentVersion);
    assert.equal(currentRelease.checksumSha256, currentContent.sha256);
    assert.equal(currentRelease.contentVersion, currentContent.contentVersion);
    assert.deepEqual(track.trainingIdentity, { contentVersion: successor.training.contentVersion, artifactSha256: successor.training.artifactSha256 });
    assert.deepEqual(track.planningPolicyIdentity, successor.planningPolicy);
    assert.ok(track.questions.length > 0);
    assert.ok(track.modes.length > 0);
    assert.ok(track.getPool(track.modes[0]!.modeId).length > 0);
  }
});
