import assert from "node:assert/strict";
import test, { before } from "node:test";
import { getProductSimulationModeConfig } from "../content/canonical/productModeConfig";
import { ContentPackageRuntimeOwner, contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";
import { ExactContentArtifactUnavailableError } from "./trainingLifecycle/contracts";

const TRACK_ID = "coding-interview-dsa-problem-solving";

before(async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
});

test("resolves an exact canonical artifact by track, content version, and SHA", async () => {
  const prepared = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID);
  const resolved = await contentPackageRuntimeOwner.resolveExactArtifact({
    trackId: prepared.track.trackId,
    contentVersion: prepared.track.contentVersion,
    artifactSha256: prepared.track.artifactSha256,
  });
  assert.equal(resolved.track.trackId, prepared.track.trackId);
  assert.equal(resolved.track.artifactSha256, prepared.track.artifactSha256);
  await assert.rejects(
    contentPackageRuntimeOwner.resolveExactArtifact({
      trackId: prepared.track.trackId,
      contentVersion: prepared.track.contentVersion,
      artifactSha256: "f".repeat(64),
    }),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError,
  );
  await assert.rejects(
    contentPackageRuntimeOwner.resolveExactArtifact({
      trackId: prepared.track.trackId,
      contentVersion: prepared.track.contentVersion,
      artifactSha256: "not-a-sha",
    }),
    /identity is invalid/,
  );
});

test("verified current OOD v24 does not resolve an absent exact OOD v23 pin when retained packages are empty", async () => {
  let retainedPackageLoads = 0;
  const owner = new ContentPackageRuntimeOwner(
    () => "test-profile",
    async () => { retainedPackageLoads += 1; return []; },
  );
  await owner.verifyBundledPackages();
  const current = owner.getPreparedDiscovery("object-oriented-design-interview").track;
  assert.equal(current.contentVersion, "object-oriented-design-interview-authoring-v2026.10.05-bizq01-24-bizq02-v2");
  assert.equal(current.artifactSha256, "015e21db498465602857d1461aa84ddd26546e665cd9225997e121eca790efe0");

  await assert.rejects(
    owner.resolveExactArtifact({
      trackId: "object-oriented-design-interview",
      contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
      artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
    }),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError
      && error.identity.trackId === "object-oriented-design-interview"
      && error.identity.contentVersion === "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
  );
  assert.equal(retainedPackageLoads, 1);
});

test("malformed runtime identities never become typed exact-artifact absence", async () => {
  const owner = new ContentPackageRuntimeOwner(() => null, async () => []);
  await owner.verifyBundledPackages();
  for (const identity of [
    { trackId: "not-a-registered-track" as never, contentVersion: "old-v1", artifactSha256: "a".repeat(64) },
    { trackId: TRACK_ID, contentVersion: "../old-v1", artifactSha256: "a".repeat(64) },
    { trackId: TRACK_ID, contentVersion: "old-v1", artifactSha256: "not-a-sha" },
  ]) {
    await assert.rejects(owner.resolveExactArtifact(identity), (error: unknown) => !(error instanceof ExactContentArtifactUnavailableError));
  }
});

test("retained inventory failures and profile-scope changes remain blocking, never typed missing", async () => {
  let scope = "profile-a";
  const unreadable = new ContentPackageRuntimeOwner(() => scope, async () => { throw new Error("retained package read failed"); });
  await unreadable.verifyBundledPackages();
  await assert.rejects(unreadable.resolveExactArtifact({
    trackId: "object-oriented-design-interview",
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
  }), (error: unknown) => !(error instanceof ExactContentArtifactUnavailableError));

  const transitioning = new ContentPackageRuntimeOwner(() => scope, async () => { scope = "profile-b"; return []; });
  await transitioning.verifyBundledPackages();
  await assert.rejects(transitioning.resolveExactArtifact({
    trackId: "object-oriented-design-interview",
    contentVersion: "object-oriented-design-interview-authoring-v2026.10.05-bizq01-23",
    artifactSha256: "932b7370d7be44bb5274ad8bc5a31b45f0479b3ff4251160af1ed2b170ca80d7",
  }), (error: unknown) => !(error instanceof ExactContentArtifactUnavailableError));
});

test("resolves only the question identified by a canonical ResolvedContentRef", async () => {
  const prepared = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID);
  const question = prepared.track.questions[0]!;
  const ref = {
    trackId: prepared.track.trackId,
    questionId: question.questionId,
    contentVersion: prepared.track.contentVersion,
    artifactSha256: prepared.track.artifactSha256,
  } as const;
  const resolved = await contentPackageRuntimeOwner.resolveItem(ref);
  assert.equal(resolved.questionId, question.questionId);
  await assert.rejects(
    contentPackageRuntimeOwner.resolveItem({ ...ref, artifactSha256: "f".repeat(64) }),
    (error: unknown) => error instanceof ExactContentArtifactUnavailableError,
  );
  await assert.rejects(
    contentPackageRuntimeOwner.resolveItem({ ...ref, questionId: "missing-question" }),
    /exact canonical question/,
  );
});

test("prepares Certification Exam Simulation from the exact canonical artifact profile", async () => {
  const trackId = "google-cloud-associate-cloud-engineer";
  const canonical = contentPackageRuntimeOwner.getPreparedDiscovery(trackId).track;
  const validated = getProductSimulationModeConfig(canonical.trackId, canonical.simulationProfiles);
  assert.equal(canonical.modes.some((mode) => mode.modeId === "certification-exam-simulation"), false);
  assert.equal(validated.profile.profileId, "google-cloud-associate-cloud-engineer-certification-exam-v1");

  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({
    trackId,
    familyId: "certification",
    modeId: "certification-exam-simulation",
  });
  assert.equal(resolved.track.trackId, canonical.trackId);
  assert.equal(resolved.track.contentVersion, canonical.contentVersion);
  assert.equal(resolved.track.artifactSha256, canonical.artifactSha256);
  assert.equal(resolved.track.simulationProfiles?.[0]?.profileId, validated.profile.profileId);
  const prepared = await resolved.runtime.prepare({
    trackId,
    modeId: "certification-exam-simulation",
    request: { sessionId: "owner-gcp-simulation" },
    attempts: [],
    reviews: [],
    now: "2026-09-27T00:00:00.000Z",
  });
  assert.equal(prepared.session.actualLength, 50);
  await assert.rejects(
    contentPackageRuntimeOwner.resolveForPreparation({
      trackId,
      familyId: "certification",
      modeId: "certification-exam-simulation",
      nodeId: "organization_projects_policies_services_quotas_and_assets",
    }),
    /do not accept a nodeId/u,
  );
});

test("prepares Coding Mock from the exact canonical artifact profile and ordered 40-question pool", async () => {
  const canonical = contentPackageRuntimeOwner.getPreparedDiscovery(TRACK_ID).track;
  const validated = getProductSimulationModeConfig(canonical.trackId, canonical.simulationProfiles);
  assert.equal(validated.profile.profileId, "algorithms-interview-simulation-v1");
  assert.equal(validated.config.modeId, "coding-interview-simulation");
  assert.equal(validated.config.familyId, "coding_interview");
  if (validated.profile.familyId !== "coding_interview") throw new Error("Expected the canonical Coding Mock profile.");

  const resolved = await contentPackageRuntimeOwner.resolveForPreparation({
    trackId: TRACK_ID,
    familyId: "coding_interview",
    modeId: "coding-interview-simulation",
  });
  assert.equal(resolved.track.artifactSha256, canonical.artifactSha256);
  assert.deepEqual(resolved.track.simulationProfiles?.[0]?.familyConfig, validated.profile.familyConfig);
  const prepared = await resolved.runtime.prepare({
    trackId: TRACK_ID,
    modeId: "coding-interview-simulation",
    request: { sessionId: "owner-coding-simulation", scope: { simulationProfileId: validated.profile.profileId } },
    attempts: [],
    reviews: [],
    now: "2026-09-27T00:00:00.000Z",
  });
  assert.equal(prepared.session.actualLength, 40);
  assert.deepEqual(prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId), validated.profile.familyConfig.eligibleQuestionIds);
});
