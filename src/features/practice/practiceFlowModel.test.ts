import assert from "node:assert/strict";
import test from "node:test";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { getTrackDisplay } from "../../domain";
import { contentPackageRuntimeOwner } from "../../application/contentPackageRuntimeOwner";
import { buildPracticeModes, buildTopicRoadmapNodes, getCurrentPracticeTopic } from "./practiceFlowModel";
test("practice selects a canonical pool",async()=>{const c=await loadCanonicalRuntimeCatalog();for(const id of c.tracks){const m=c.getTrack(id).modes[0]!;assert.ok(c.getPool(id,m.modeId).length>0);}});

test("GCP practice topic comes from its node mode after the diagnostic-first mode", async () => {
  const catalog = await loadCanonicalRuntimeCatalog();
  const trackId = "google-cloud-associate-cloud-engineer";
  const track = catalog.getTrack(trackId);
  assert.equal(track.modes[0]?.modeId, "certification-diagnostic-baseline");
  assert.notEqual(track.modes[0]?.selection.kind, "node");
  const nodeMode = track.modes.find((mode) => mode.modeId === "certification-focus-practice");
  assert.ok(nodeMode && nodeMode.selection.kind === "node");
  const freeNodeId = nodeMode.selection.nodeId;

  await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "certification");
  assert.equal(getCurrentPracticeTopic(getTrackDisplay(trackId)).id, freeNodeId);
  const topics = buildTopicRoadmapNodes({ activeTrackId: trackId, trainingAttempts: [] });
  assert.equal(topics.filter((topic) => topic.status === "current").length, 1);
  assert.equal(topics.find((topic) => topic.status === "current")?.id, freeNodeId);
  assert.ok(topics.filter((topic) => topic.id !== freeNodeId).every((topic) => topic.status === "locked"));
});

test("Certification Exam Simulation is offered only for a validated prepared profile", async () => {
  const gcpTrackId = "google-cloud-associate-cloud-engineer";
  const awsTrackId = "aws-certified-solutions-architect-associate";
  await contentPackageRuntimeOwner.resolveForDiscovery(gcpTrackId, "certification");
  await contentPackageRuntimeOwner.resolveForDiscovery(awsTrackId, "certification");

  const gcpModes = buildPracticeModes(getTrackDisplay(gcpTrackId), false);
  assert.deepEqual(
    gcpModes.find((mode) => mode.mode === "certification-exam-simulation"),
    {
      enabled: true,
      icon: "clipboard",
      mode: "certification-exam-simulation",
      title: "Certification Exam Simulation",
      tone: "info",
    },
  );
  assert.equal(
    buildPracticeModes(getTrackDisplay(awsTrackId), false).some((mode) => mode.mode === "certification-exam-simulation"),
    false,
  );
});

test("Coding Mock is offered only for the validated Coding simulation profile without changing practice modes", async () => {
  const trackId = "coding-interview-dsa-problem-solving";
  await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "coding_interview");
  const modes = buildPracticeModes(getTrackDisplay(trackId), false);
  assert.deepEqual(modes.find((mode) => mode.mode === "coding-interview-simulation"), {
    enabled: true,
    icon: "clipboard",
    mode: "coding-interview-simulation",
    title: "Coding Mock Interview",
    tone: "info",
  });
  assert.ok(modes.some((mode) => mode.mode === "coding-interview-guided-practice"));
  assert.ok(modes.some((mode) => mode.mode === "coding-interview-custom-practice"));
});

test("Design Weak Area Review stays unavailable without review evidence", async () => {
  const trackId = "object-oriented-design-interview";
  await contentPackageRuntimeOwner.resolveForDiscovery(trackId, "design_interview");
  const mode = buildPracticeModes(getTrackDisplay(trackId), false).find((candidate) => candidate.mode === "design-interview-weak-area-review");
  assert.equal(mode?.enabled, false);
  assert.equal(mode?.unavailableReason, "There are no questions to review right now.");
});
