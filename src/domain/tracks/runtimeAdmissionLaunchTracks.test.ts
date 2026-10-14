import assert from "node:assert/strict";
import { createHash as createSha256 } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { LAUNCH_TRACK_IDS } from "..";

type CandidateReleaseLock = Readonly<{
  schemaVersion: number;
  candidateId: string;
  bundledContentLockSha256: string;
  artifacts: readonly Readonly<{
    trackId: string;
    checksumSha256: string;
    contentVersion: string;
  }>[];
}>;

test("canonical launch catalog preserves the exact training identity beside candidate-v2 artifact identity", async () => {
  const releaseLock = JSON.parse(await readFile(path.resolve("integration/contracts/content-release/release.lock.json"), "utf8")) as {
    schemaVersion: number; candidateId: string; bundledContentLockSha256: string;
    artifacts: { trackId: string; checksumSha256: string; contentVersion: string }[];
  };
  const appRoot = process.cwd();
  const contentRoot = path.resolve(process.env.PATTERNLY_CONTENT_CURRENT_ROOT ?? path.resolve(appRoot, "../patternly-content"));
  const candidateLockBuilder = await import("../../../scripts/candidateContentReleaseLock.mjs") as unknown as {
    createCandidateContentReleaseLock(options?: Readonly<{ appRoot?: string; contentRoot?: string }>): Promise<CandidateReleaseLock>;
  };
  await assert.rejects(candidateLockBuilder.createCandidateContentReleaseLock({ appRoot, contentRoot }), /[Ii]nventory mismatch|differs from release artifact/u);
  const candidateLock = releaseLock;
  const qle = JSON.parse(await readFile(path.resolve("integration/contracts/content-release/local-claude/qle-v2-acceptance.json"), "utf8"));
  assert.equal(releaseLock.schemaVersion, 3);
  assert.deepEqual(releaseLock, candidateLock, "the immutable release lock must match the canonical current v2 candidate");

  const contentLock = JSON.parse(await readFile(path.resolve("src/content/generated/canonical-content/content-lock.json"), "utf8")) as {
    tracks: { trackId: string; sha256: string; contentVersion: string }[];
  };
  const successorLedger = JSON.parse(await readFile(path.resolve("src/content/generated/canonical-content/content-successor-ledger.json"), "utf8")) as {
    tracks: readonly Readonly<{
      trackId: string;
      training: Readonly<{ contentVersion: string; artifactSha256: string; questionCount: number }>;
      planningPolicy: Readonly<{ contentVersion: string; artifactSha256: string; policyVersion: string }>;
    }>[];
  };
  const candidateByTrack = new Map(candidateLock.artifacts.map((item) => [item.trackId, item]));
  const bundledByTrack = new Map(contentLock.tracks.map((item) => [item.trackId, item]));
  const successorByTrack = new Map(successorLedger.tracks.map((item) => [item.trackId, item]));
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.deepEqual([...catalog.tracks].sort(), [...LAUNCH_TRACK_IDS].sort());
  const lockBytes = await readFile(path.resolve("src/content/generated/canonical-content/content-lock.json"));
  assert.notEqual(createHash(lockBytes), releaseLock.bundledContentLockSha256, "local QLE is not silently promoted into the frozen public release");
  assert.equal(qle.publication, "not_granted");
  for (const id of LAUNCH_TRACK_IDS) {
    const track = catalog.getTrack(id);
    const candidate = candidateByTrack.get(id);
    const bundled = bundledByTrack.get(id);
    const successor = successorByTrack.get(id);
    assert.ok(candidate && bundled && successor, `all exact identities must exist for ${id}`);
    assert.deepEqual(track.trainingIdentity, {
      contentVersion: successor.training.contentVersion,
      artifactSha256: successor.training.artifactSha256,
    }, "session identity remains the exact training projection pinned by the successor ledger");
    if (id === "claude-certified-architect-professional-certification") {
      assert.equal(bundled.contentVersion, qle.candidate.artifact.contentVersion); assert.equal(bundled.sha256, qle.candidate.artifact.artifactSha256);
    } else {
      assert.equal(candidate.contentVersion, bundled.contentVersion, "frozen release binds the unchanged artifact version");
      assert.equal(candidate.checksumSha256, bundled.sha256, "frozen release binds the unchanged artifact bytes");
    }
    assert.equal(track.contentVersion, bundled.contentVersion, "the raw bundle identity is the planning-policy successor");
    assert.equal(track.artifactSha256, bundled.sha256);
    assert.deepEqual(track.planningPolicyIdentity, successor.planningPolicy);
    assert.ok(track.questions.length > 0);
    assert.ok(track.modes.length > 0);
    assert.ok(track.getPool(track.modes[0]!.modeId).length > 0);
  }
});

function createHash(bytes: Buffer): string {
  return createSha256("sha256").update(bytes).digest("hex");
}
