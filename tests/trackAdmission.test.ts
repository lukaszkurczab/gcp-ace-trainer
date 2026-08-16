import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import test from "node:test";

import {
  CANONICAL_TRACK_BRIEF_SOURCE,
  CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE,
  LAUNCH_TRACK_IDS,
  TRACK_DENSITY_DESCRIPTORS,
  evaluateProductionTrackAdmissions,
  assertTrackDensityDescriptors,
  getTracks,
} from "../src/domain";
import { GENERATED_FREE_NODE_PACKAGES } from "../src/content/bundled/generatedFreeNodePackages";
import { contentPackageRuntimeOwner } from "../src/application/contentPackageRuntimeOwner";
import { prepareBundledTestPackages } from "./contentPackageRuntimeTestSupport";

test("internal density harness pins exactly eight complete canonical launch content-brief descriptors", () => {
  const descriptors = assertTrackDensityDescriptors(TRACK_DENSITY_DESCRIPTORS);

  assert.equal(CANONICAL_TRACK_BRIEF_SOURCE.repository, "patternly-content");
  assert.match(CANONICAL_TRACK_BRIEF_SOURCE.commit, /^[a-f0-9]{40}$/u);
  assert.deepEqual(LAUNCH_TRACK_IDS, ["coding-interview-dsa-problem-solving", "backend-system-design-interview", "object-oriented-design-interview", "frontend-system-design-interview", "google-cloud-associate-cloud-engineer", "aws-certified-solutions-architect-associate", "microsoft-azure-administrator-associate-az-104", "microsoft-azure-ai-fundamentals-ai-901"]);
  assert.equal(descriptors.length, 8);
  assert.equal(new Set(descriptors.map((descriptor) => descriptor.trackId)).size, 8);
  assert.equal(new Set(descriptors.map((descriptor) => descriptor.freeNodeId)).size, 8);
  assert.deepEqual(new Set(descriptors.map((descriptor) => descriptor.internalFamily)), new Set(["certification", "coding_interview", "design_interview"]));

  for (const descriptor of descriptors) {
    const briefPath = `docs/track-briefs/${descriptor.trackId}.json`;
    const briefBytes = execFileSync(
      "git",
      ["-C", "../patternly-content", "show", `${CANONICAL_TRACK_BRIEF_SOURCE.commit}:${briefPath}`],
      { encoding: "buffer" },
    );
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
  assert.throws(() => assertTrackDensityDescriptors(TRACK_DENSITY_DESCRIPTORS.slice(1)), /exactly the eight canonical/u);
  assert.throws(
    () => assertTrackDensityDescriptors([...TRACK_DENSITY_DESCRIPTORS.slice(0, 7), { ...TRACK_DENSITY_DESCRIPTORS[0]! }]),
    /unique track IDs/u,
  );
  assert.throws(
    () => assertTrackDensityDescriptors([...TRACK_DENSITY_DESCRIPTORS.slice(0, 7), { ...TRACK_DENSITY_DESCRIPTORS[0]!, trackId: "hashicorp-terraform-associate-004" }]),
    /not canonical launch scope/u,
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

test("production admission remains closed until exact immutable Free-node package evidence exists", async () => {
  const registrations = getTracks();
  const evaluations = await evaluateProductionTrackAdmissions(registrations);
  await prepareBundledTestPackages();

  assert.deepEqual(registrations.map((registration) => registration.id).sort(), CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE.map((fact) => fact.trackId).sort());
  assert.deepEqual(evaluations.map((evaluation) => evaluation.kind), ["package_evidence_verified_catalogue_gate_pending", "unverified_free_node_package", "package_evidence_verified_catalogue_gate_pending"]);
  for (const fact of CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE) {
    const descriptor = TRACK_DENSITY_DESCRIPTORS.find((candidate) => candidate.trackId === fact.trackId);
    const source = GENERATED_FREE_NODE_PACKAGES.find((candidate) => candidate.trackId === fact.trackId);
    const available = contentPackageRuntimeOwner.getPreparedDiscovery(fact.trackId);
    assert.ok(descriptor);
    assert.ok(source);
    assert.equal(available.package.packagePin.contentReleaseId, fact.bundledReleaseId);
    assert.equal(available.package.trackId, fact.trackId);
  }
});

test("admission evaluator rejects missing and orphan artifact evidence instead of admitting it", async () => {
  const candidate = TRACK_DENSITY_DESCRIPTORS.find((descriptor) => descriptor.trackId === "backend-system-design-interview")!;
  const registration = {
    id: candidate.trackId,
    familyId: candidate.internalFamily,
    metadata: { title: "Backend System Design", shortTitle: "Backend Design", description: "Test-only candidate.", status: "active" as const, accentColor: "#000000", accentMutedColor: "#FFFFFF" },
  };

  assert.deepEqual(await evaluateProductionTrackAdmissions([registration], []), [{ trackId: candidate.trackId, kind: "missing_artifact_evidence" }]);
  await assert.rejects(() => evaluateProductionTrackAdmissions(getTracks(), [...CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE, { trackId: candidate.trackId, bundledReleaseId: "patternly-core-unknown" }]), /orphaned/u);
  await assert.rejects(() => evaluateProductionTrackAdmissions(getTracks(), [CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE[0]!, CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE[0]!]), /unique track IDs/u);
});

test("package admission rejects tampered bytes or extracted profile modes without affecting the other track", async () => {
  const coding = GENERATED_FREE_NODE_PACKAGES[0]!;
  const bytesTampered = GENERATED_FREE_NODE_PACKAGES.map((entry) => entry.trackId === coding.trackId ? { ...entry, packageBytes: `${entry.packageBytes} ` } : entry);
  const profileTampered = GENERATED_FREE_NODE_PACKAGES.map((entry) => entry.trackId === coding.trackId ? { ...entry, profileModes: [...entry.profileModes, "coding-interview-simulation"] } : entry);
  for (const packages of [bytesTampered, profileTampered]) {
    const results = await evaluateProductionTrackAdmissions(getTracks(), CURRENT_PRODUCTION_TRACK_ARTIFACT_EVIDENCE, TRACK_DENSITY_DESCRIPTORS, packages);
    assert.deepEqual(results.map((result) => result.kind), ["unverified_free_node_package", "unverified_free_node_package", "package_evidence_verified_catalogue_gate_pending"]);
  }
});
