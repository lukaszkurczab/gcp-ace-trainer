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
import successorLedger from "../generated/canonical-content/content-successor-ledger.json";
import { verifyRetainedCompletionCatalogs, type VerificationWorkPlan } from "./runtimeCatalog";

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
    assert.ok(track.trainingIdentity);
    assert.ok(track.planningPolicyIdentity);
    assert.ok(
      track.trainingIdentity.contentVersion !== track.contentVersion
        || track.trainingIdentity.artifactSha256 !== track.artifactSha256,
      "the training identity must remain pinned to its exact projection, even when its version label is shared",
    );
    assert.equal(track.planningPolicyIdentity.contentVersion, track.contentVersion);
    assert.equal(track.planningPolicyIdentity.artifactSha256, track.artifactSha256);
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
  const gcp = catalog.getTrack("google-cloud-associate-cloud-engineer");
  assert.equal(gcp.simulationProfiles?.[0]?.profileId, "google-cloud-associate-cloud-engineer-certification-exam-v1");
  assert.equal(gcp.simulationProfiles?.[0]?.familyId, "certification");
  assert.equal(gcp.simulationProfiles?.[0]?.modeId, "certification-exam-simulation");
  const currentProfile = gcp.simulationProfiles?.[0];
  assert.ok(currentProfile?.familyId === "certification");
  if (currentProfile?.familyId === "certification") {
    assert.equal(currentProfile.familyConfig.nodeDomainMapEvidence, undefined);
    assert.deepEqual(Object.keys(currentProfile.familyConfig.nodeDomainMap).sort(), [...new Set(gcp.questions.map((question) => question.nodeId))].sort());
    assert.ok(gcp.questions.every((question) => currentProfile.familyConfig.nodeDomainMap[question.nodeId] === question.contentDomainId));
  }
  assert.equal(Object.isFrozen(gcp.simulationProfiles?.[0]?.familyConfig.nodeDomainMap), true);
  assert.equal(catalog.getTrack("aws-certified-solutions-architect-associate").simulationProfiles, undefined);
});

test("all nine predecessor projections preserve exact deep-copy bytes and leave source JSON unchanged", async () => {
  const sources = [aws, backend, claude, coding, frontend, gcp, az104, ai901, objectDesign];
  const fingerprint = (value: unknown) => createHash("sha256").update(JSON.stringify(value), "utf8").digest("hex");
  const before = sources.map((source) => ({
    root: fingerprint(source), questions: source.questions, nested: fingerprint(source.questions),
    schemaVersion: source.schemaVersion, contentVersion: source.contentVersion, planningPolicy: source.planningPolicy,
  }));
  const reconstructed: string[] = [];
  const catalog = await buildCanonicalRuntimeCatalog({
    artifacts: sources, locks: lockFile.tracks, successorLedger,
    sha256Utf8: async (serialized) => {
      const input = JSON.parse(serialized) as { trackId: string; schemaVersion: string };
      const source = sources.find((candidate) => candidate.trackId === input.trackId)!;
      const entry = successorLedger.tracks.find((candidate) => candidate.trackId === input.trackId)!;
      if (input.schemaVersion === "patternly-content-artifact-v1") {
        // Independent reference for the old algorithm; production only edits the root.
        const reference = structuredClone(source) as unknown as Record<string, unknown>;
        delete reference.planningPolicy;
        reference.schemaVersion = "patternly-content-artifact-v1";
        reference.contentVersion = entry.training.contentVersion;
        assert.equal(serialized, JSON.stringify(reference));
        reconstructed.push(input.trackId);
      } else {
        assert.equal(serialized, JSON.stringify(source));
      }
      return createHash("sha256").update(serialized, "utf8").digest("hex");
    },
  });
  assert.deepEqual(reconstructed, sources.map((source) => source.trackId));
  for (const [index, source] of sources.entries()) {
    assert.equal(fingerprint(source), before[index]!.root);
    assert.equal(source.questions, before[index]!.questions);
    assert.equal(fingerprint(source.questions), before[index]!.nested);
    assert.equal(source.schemaVersion, before[index]!.schemaVersion);
    assert.equal(source.contentVersion, before[index]!.contentVersion);
    assert.equal(source.planningPolicy, before[index]!.planningPolicy);
    assert.equal(catalog.getTrack(source.trackId).trainingIdentity?.artifactSha256,
      successorLedger.tracks.find((entry) => entry.trackId === source.trackId)!.training.artifactSha256);
  }
});

test("runtime refuses a successor ledger that no longer reconstructs the exact training artifact", async () => {
  const altered = structuredClone(successorLedger) as unknown as { tracks: Array<{ training: { artifactSha256: string } }> };
  altered.tracks[0]!.training.artifactSha256 = "0".repeat(64);
  const owner = createCanonicalRuntimeCatalogOwner({ successorLedger: altered });
  const proofs: string[] = [];
  owner.subscribeVerification({ onWorkPlan() {}, onVerifiedUnit: (proof) => { proofs.push(proof.unitId); } });
  await assert.rejects(() => owner.load(), /does not reconstruct the exact training predecessor/u);
  assert.deepEqual(proofs, [], "a valid current artifact alone is not a successor-ledger proof");
});

test("injected loader failures are visible and do not poison the active cache", async () => {
  const badSha = async () => "0".repeat(64);
  await assert.rejects(() => buildCanonicalRuntimeCatalog({ artifacts: [coding], locks: [lockFile.tracks.find((entry) => entry.trackId === coding.trackId)!], sha256Utf8: badSha }), /SHA-256/);
  const catalog = await loadCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
});

test("canonical runtime rejects a malformed chapter completion rule before product-mode projection", async () => {
  const malformed = structuredClone(coding) as unknown as Record<string, unknown>;
  const rule = malformed.completionRule as { chapters: Array<{ rollingWindowSize: number }> };
  rule.chapters[0]!.rollingWindowSize = 19;
  await assert.rejects(
    () => buildCanonicalRuntimeCatalog({ artifacts: [malformed], locks: [lockFile.tracks.find((entry) => entry.trackId === coding.trackId)!] }),
    (error: unknown) => error instanceof Error
      && "errors" in error
      && Array.isArray(error.errors)
      && error.errors.includes("artifact.completionRule: invalid versioned completion rule"),
  );
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
  const plans: VerificationWorkPlan[] = [], proofs: string[] = [];
  owner.subscribeVerification({ onWorkPlan: (plan) => { plans.push(plan); }, onVerifiedUnit: (proof) => { proofs.push(proof.unitId); } });
  await assert.rejects(() => owner.load(), /SHA-256/);
  assert.equal(plans.length, 1); assert.equal(proofs.length, 0);
  fail = false;
  const loading = owner.load();
  assert.equal(owner.load(), loading);
  const recovered = await loading;
  assert.equal(await owner.load(), recovered);
  assert.equal(plans.length, 2);
  assert.notEqual(plans[0]!.build, plans[1]!.build);
  assert.equal(plans[1]!.units.length, 13);
  assert.equal(plans[1]!.units.filter((unit) => unit.kind === "retained_pair").length, 4);
  assert.equal(Object.isFrozen(plans[1]!.units), true);
  assert.equal(Object.isFrozen(plans[1]!.units[0]), true);
  assert.deepEqual(proofs, plans[1]!.units.map((unit) => unit.id));
  const replay: string[] = [];
  const off = owner.subscribeVerification({ onWorkPlan: (plan) => { assert.equal(plan, plans[1]); }, onVerifiedUnit: (proof) => { replay.push(proof.unitId); } });
  off();
  assert.deepEqual(replay, proofs, "fulfilled cache replays only its own completed finite plan");
});

test("owner installs its run before notifications and replays in-flight proofs without another build", async () => {
  let release!: () => void;
  let reachedSecondHash!: () => void;
  let hashes = 0;
  const pause = new Promise<void>((resolve) => { release = resolve; });
  const secondHash = new Promise<void>((resolve) => { reachedSecondHash = resolve; });
  const events: string[] = [], replay: string[] = [];
  let reentrant: Promise<unknown> | undefined;
  const owner = createCanonicalRuntimeCatalogOwner({ artifacts: [aws, backend, claude, coding, frontend, gcp, az104, ai901, objectDesign], locks: lockFile.tracks,
    sha256Utf8: async (value) => {
      hashes++;
      if (hashes === 2) { reachedSecondHash(); await pause; }
      return createHash("sha256").update(value).digest("hex");
    } });
  const off = owner.subscribeVerification({
    onWorkPlan() { reentrant = owner.load(); },
    onVerifiedUnit(proof) {
      events.push(proof.unitId);
      if (events.length === 1) owner.subscribeVerification({ onWorkPlan() {}, onVerifiedUnit: (next) => { replay.push(next.unitId); } });
    },
  });
  assert.equal(hashes, 0, "subscribing never starts work");
  const loading = owner.load(); assert.equal(loading, reentrant);
  // Let the first validated proof publish and the second real SHA wait.
  await Promise.race([secondHash, loading.then(() => { assert.fail("catalog finished before the second hash pause"); })]);
  assert.equal(events.length, 1); assert.deepEqual(replay, events, "proof is recorded before reentrant replay");
  off();
  const stopThrowing = owner.subscribeVerification({ onWorkPlan() { throw new Error("observer"); }, onVerifiedUnit() { throw new Error("observer"); } });
  release();
  const result = await loading;
  stopThrowing();
  assert.equal(result.tracks.length, 9); assert.equal(hashes, 9);
  assert.equal(events.length, 1, "unsubscribed observer receives no future proofs");
  assert.equal(replay.length, 9);
  assert.equal(new Set(replay).size, 9);
});

test("partial verified work never hides a later mode failure or invalid inventory", async () => {
  const source = [coding];
  const owner = createCanonicalRuntimeCatalogOwner({ artifacts: source, locks: lockFile.tracks,
    sha256Utf8: async (value) => createHash("sha256").update(value).digest("hex") });
  const proofs: string[] = [];
  owner.subscribeVerification({ onWorkPlan: (plan) => { assert.equal(plan.units.length, 1); }, onVerifiedUnit: (proof) => { proofs.push(proof.unitId); } });
  await assert.rejects(() => owner.load());
  assert.deepEqual(proofs, [`current:0:${coding.trackId}`], "mode validation still fails after a real valid artifact proof");
  const invalid = createCanonicalRuntimeCatalogOwner({ artifacts: Array(10).fill(coding), locks: lockFile.tracks, sha256Utf8: async () => "0".repeat(64) });
  let plans = 0;
  invalid.subscribeVerification({ onWorkPlan() { plans++; }, onVerifiedUnit() { assert.fail("invalid inventory proof"); } });
  await assert.rejects(() => invalid.load(), /SHA-256/);
  assert.equal(plans, 0);
});

test("retained pair earns no proof when predecessor fails after valid v2 verification", async () => {
  const retained = (await import("../generated/retained-content/claude-qle-v2-before-identity.json")).default;
  const corrupt = structuredClone(retained);
  corrupt.ledger.training.artifactSha256 = "0".repeat(64);
  const pairs: number[] = [];
  const result = await verifyRetainedCompletionCatalogs([corrupt], undefined, (index) => { pairs.push(index); });
  assert.deepEqual(result, []); assert.deepEqual(pairs, []);
  assert.deepEqual(await verifyRetainedCompletionCatalogs([], undefined, () => assert.fail("unavailable pair")), []);
});

test("canonical runtime catalog caches only a validated active catalog", async () => {
  assert.equal(await loadCanonicalRuntimeCatalog(), await loadCanonicalRuntimeCatalog());
});
