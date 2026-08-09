import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  CANONICAL_TRACK_BRIEF_SOURCE,
  CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE,
  TRACK_DENSITY_DESCRIPTORS,
  evaluateProductionTrackAdmissions,
  assertTrackDensityDescriptors,
  getTracks,
} from "../src/domain";
import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../src/content/bundled";
import { validateBundledContent } from "../src/content/application/validateBundledContent";

test("internal density harness pins exactly ten complete canonical content-brief descriptors", () => {
  const descriptors = assertTrackDensityDescriptors(TRACK_DENSITY_DESCRIPTORS);

  assert.equal(CANONICAL_TRACK_BRIEF_SOURCE.repository, "patternly-content");
  assert.match(CANONICAL_TRACK_BRIEF_SOURCE.commit, /^[a-f0-9]{40}$/u);
  assert.equal(descriptors.length, 10);
  assert.equal(new Set(descriptors.map((descriptor) => descriptor.trackId)).size, 10);
  assert.equal(new Set(descriptors.map((descriptor) => descriptor.freeNodeId)).size, 10);
  assert.deepEqual(new Set(descriptors.map((descriptor) => descriptor.internalFamily)), new Set(["certification", "coding_interview", "design_interview"]));

  for (const descriptor of descriptors) {
    const briefPath = join("..", "patternly-content", "docs", "track-briefs", `${descriptor.trackId}.json`);
    const briefBytes = readFileSync(briefPath);
    const brief = JSON.parse(briefBytes.toString()) as Record<string, unknown>;
    assert.equal(createHash("sha256").update(briefBytes).digest("hex"), descriptor.sourceBriefSha256);
    assert.equal(brief.trackId, descriptor.trackId);
    assert.equal(brief.schemaVersion, descriptor.schemaVersion);
    assert.equal(brief.internalFamily, descriptor.internalFamily);
    assert.equal(brief.jobToBeDone, descriptor.jobToBeDone);
    assert.equal(brief.targetLearner, descriptor.targetLearner);
    assert.deepEqual(brief.taxonomyOutline, descriptor.taxonomyOutline);
    assert.equal(brief.freeNodeId, descriptor.freeNodeId);
    assert.deepEqual(brief.validModes, descriptor.validModes);
    assert.deepEqual(brief.goalTemplates, descriptor.goalTemplates);
    assert.deepEqual(brief.progressDimensions, descriptor.progressDimensions);
    assert.deepEqual(brief.packageContentPlan, descriptor.packageContentPlan);
    assert.deepEqual(brief.launchCommercialGate, { productionRegistryAdmission: descriptor.launchCommercialGate });
  }
});

test("density harness rejects missing, duplicate, and incomplete descriptors", () => {
  assert.throws(() => assertTrackDensityDescriptors(TRACK_DENSITY_DESCRIPTORS.slice(1)), /exactly the ten canonical/u);
  assert.throws(
    () => assertTrackDensityDescriptors([...TRACK_DENSITY_DESCRIPTORS.slice(0, 9), { ...TRACK_DENSITY_DESCRIPTORS[0]! }]),
    /unique track IDs/u,
  );
  assert.throws(
    () => assertTrackDensityDescriptors(TRACK_DENSITY_DESCRIPTORS.map((descriptor, index) => index === 0 ? { ...descriptor, jobToBeDone: "" } : descriptor)),
    /incomplete/u,
  );
  assert.throws(
    () => assertTrackDensityDescriptors(TRACK_DENSITY_DESCRIPTORS.map((descriptor, index) => index === 0 ? { ...descriptor, validModes: [] } : descriptor)),
    /incomplete collections/u,
  );
});

test("current production tracks have pinned artifacts but remain explicitly unverified without free-node package proof", async () => {
  const registrations = getTracks();
  const evaluations = evaluateProductionTrackAdmissions(registrations);
  const availability = await validateBundledContent();

  assert.deepEqual(registrations.map((registration) => registration.id).sort(), CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE.map((fact) => fact.trackId).sort());
  assert.deepEqual(evaluations.map((evaluation) => evaluation.kind), ["unverified_free_node_package", "unverified_free_node_package"]);
  for (const fact of CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE) {
    const descriptor = TRACK_DENSITY_DESCRIPTORS.find((candidate) => candidate.trackId === fact.trackId);
    const artifact = GENERATED_BUNDLED_CONTENT_RELEASE.artifacts.find((candidate) => candidate.trackId === fact.trackId);
    const available = availability.tracks.find((candidate) => candidate.trackId === fact.trackId);
    assert.ok(descriptor);
    assert.ok(artifact);
    assert.equal(artifact.releaseId, fact.bundledReleaseId);
    assert.equal(available?.kind, "available");
  }
});

test("admission evaluator rejects missing and orphan artifact evidence instead of admitting it", () => {
  const candidate = TRACK_DENSITY_DESCRIPTORS.find((descriptor) => descriptor.trackId === "backend-system-design-interview")!;
  const registration = {
    id: candidate.trackId,
    familyId: candidate.internalFamily,
    metadata: { title: "Backend System Design", shortTitle: "Backend Design", description: "Test-only candidate.", status: "active" as const, accentColor: "#000000", accentMutedColor: "#FFFFFF" },
  };

  assert.deepEqual(evaluateProductionTrackAdmissions([registration], []), [{ trackId: candidate.trackId, kind: "missing_artifact_evidence" }]);
  assert.throws(() => evaluateProductionTrackAdmissions(getTracks(), [...CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE, { trackId: candidate.trackId, bundledReleaseId: "patternly-core-unknown" }]), /orphaned/u);
  assert.throws(() => evaluateProductionTrackAdmissions(getTracks(), [CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE[0]!, CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE[0]!]), /unique track IDs/u);
});
