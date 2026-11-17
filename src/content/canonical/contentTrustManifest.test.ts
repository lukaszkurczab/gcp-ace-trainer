import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { buildCanonicalRuntimeCatalog, buildFullyVerifiedCanonicalRuntimeCatalog, deriveBundledContentTrustManifest } from "./runtimeCatalog";
import { matchContentTrustManifest } from "./contentTrustManifest";
import lockFile from "../generated/canonical-content/content-lock.json";
import ledgerFile from "../generated/canonical-content/content-successor-ledger.json";
import bundledManifest from "../generated/content-trust-manifest.json";
import type { CanonicalContentLockRecord } from "./questionTypes";

const hashCounter = () => {
  const inputs: number[] = [];
  return { inputs, sha256Utf8: async (value: string) => { inputs.push(value.length); return createHash("sha256").update(value, "utf8").digest("hex"); } };
};
const locks = new Map((lockFile.tracks as CanonicalContentLockRecord[]).map((entry) => [entry.trackId, entry]));

test("the committed trust manifest equals a fresh full verification of the bundled bank", async () => {
  assert.deepEqual(await deriveBundledContentTrustManifest(), bundledManifest);
});

test("a matching manifest skips per-start artifact hashing but yields the same catalog as full verification", async () => {
  const trusted = hashCounter();
  const fast = await buildCanonicalRuntimeCatalog({ sha256Utf8: trusted.sha256Utf8 });
  // T2.4: only the lock and the ledger bindings; asset bytes are hashed by the asset source, and no multi-megabyte artifact or predecessor serialization is hashed.
  assert.equal(trusted.inputs.length, 2);
  assert.ok(Math.max(...trusted.inputs) < 64 * 1024);
  const full = hashCounter();
  const verified = await buildFullyVerifiedCanonicalRuntimeCatalog({ sha256Utf8: full.sha256Utf8 });
  assert.ok(full.inputs.length >= 9 + 9);
  assert.deepEqual(fast.tracks, verified.tracks);
  for (const trackId of verified.tracks) {
    const a = fast.getTrack(trackId), b = verified.getTrack(trackId);
    assert.deepEqual([a.contentVersion, a.artifactSha256, a.questions.length, a.trainingIdentity, a.planningPolicyIdentity], [b.contentVersion, b.artifactSha256, b.questions.length, b.trainingIdentity, b.planningPolicyIdentity]);
    assert.deepEqual(a.completionSources?.map((s) => [s.contentVersion, s.artifactSha256]), b.completionSources?.map((s) => [s.contentVersion, s.artifactSha256]));
    assert.deepEqual(a.modes.map((mode) => [mode.modeId, a.getPool(mode.modeId).map((q) => q.questionId)]), b.modes.map((mode) => [mode.modeId, b.getPool(mode.modeId).map((q) => q.questionId)]));
    assert.ok(Object.isFrozen(a.questions) && Object.isFrozen(a.questions[0]));
  }
});

test("injected content is never covered by the bundled manifest", async () => {
  const counter = hashCounter();
  await buildCanonicalRuntimeCatalog({ locks: [...locks.values()], sha256Utf8: counter.sha256Utf8 });
  assert.ok(counter.inputs.length >= 9 + 9);
  assert.ok(counter.inputs.some((length) => length > 64 * 1024));
});

test("a stale, foreign or malformed manifest is rejected so the runtime falls back to full verification", async () => {
  const { sha256Utf8 } = hashCounter();
  const trackIds = (bundledManifest.artifacts as { trackId: string }[]).map(({ trackId }) => trackId);
  const inputs = { lockFile, ledgerFile, trackIds, locks, sha256Utf8 };
  assert.ok(await matchContentTrustManifest(bundledManifest, inputs));
  const changedLock = structuredClone(lockFile);
  changedLock.tracks[0]!.questionCount += 1;
  assert.equal(await matchContentTrustManifest(bundledManifest, { ...inputs, lockFile: changedLock }), undefined);
  const changedLedger = structuredClone(ledgerFile);
  changedLedger.tracks[0]!.training.questionCount += 1;
  assert.equal(await matchContentTrustManifest(bundledManifest, { ...inputs, ledgerFile: changedLedger }), undefined);
  assert.equal(await matchContentTrustManifest(bundledManifest, { ...inputs, trackIds: [...trackIds].reverse() }), undefined);
  assert.equal(await matchContentTrustManifest({ ...bundledManifest, schemaVersion: "v0" }, inputs), undefined);
  assert.equal(await matchContentTrustManifest({}, inputs), undefined);
  const trust = await matchContentTrustManifest(bundledManifest, inputs);
  assert.equal(trust?.artifactSha(trackIds[0]!), locks.get(trackIds[0]!)?.sha256);
  assert.equal(trust?.artifactSha("unknown-track"), undefined);
  assert.equal(trust?.retainedFileSha(bundledManifest.retained[0]!.id), bundledManifest.retained[0]!.fileSha);
  assert.equal(trust?.retainedFileSha("retained:unknown.json"), undefined);
  const withoutFileSha = { ...bundledManifest, retained: bundledManifest.retained.map(({ id, sha }) => ({ id, sha })) };
  assert.equal(await matchContentTrustManifest(withoutFileSha, inputs), undefined);
});

test("T2.4: a trusted track is built from its asset only when the asset bytes match the manifest", async () => {
  const { bundledContentAssetSource } = await import("./contentAssetSource");
  const trackId = "coding-interview-dsa-problem-solving";
  const tampered = {
    read: async (directory: "canonical-content" | "retained-content", file: string) => tamper(await bundledContentAssetSource.read(directory, file), file),
    readSync: (directory: "canonical-content" | "retained-content", file: string) => tamper(bundledContentAssetSource.readSync(directory, file), file),
  };
  function tamper(asset: { text: string; sha256: string }, file: string) { return file === `${trackId}.json` ? { text: asset.text.replace("\"questions\"", "\"questions\" "), sha256: "0".repeat(64) } : asset; }
  const catalog = await buildCanonicalRuntimeCatalog({ assets: tampered });
  assert.deepEqual(catalog.tracks.length, 9);
  assert.equal(catalog.isTrackLoaded(trackId), false);
  await assert.rejects(() => catalog.loadTrack(trackId), /does not match its trust manifest/);
  assert.throws(() => catalog.getTrack(trackId), /does not match its trust manifest/);
  assert.equal(catalog.isTrackLoaded(trackId), false);
  // Other tracks are unaffected; each is built once, asynchronously or synchronously.
  const gcp = await catalog.loadTrack("google-cloud-associate-cloud-engineer");
  assert.equal(catalog.getTrack("google-cloud-associate-cloud-engineer"), gcp);
  assert.equal(catalog.isTrackLoaded("google-cloud-associate-cloud-engineer"), true);
  assert.equal(catalog.isTrackLoaded("aws-certified-solutions-architect-associate"), false);
});
