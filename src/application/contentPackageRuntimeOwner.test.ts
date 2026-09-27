import assert from "node:assert/strict";
import test, { before } from "node:test";
import { getProductSimulationModeConfig } from "../content/canonical/productModeConfig";
import { contentPackageRuntimeOwner } from "./contentPackageRuntimeOwner";

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
    /does not match the verified catalog/,
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
    /does not match the verified catalog/,
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
