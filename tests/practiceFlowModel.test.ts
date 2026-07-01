import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinition,
} from "../src/domain";
import {
  buildPracticeModes,
  buildTopicRoadmapNodes,
} from "../src/features/practice/practiceFlowModel";

test("Practice modes stay aligned while disabling algorithm mock practice", () => {
  const cloudModes = buildPracticeModes(getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID));
  const algorithmModes = buildPracticeModes(getTrackDefinition(ALGORITHMS_TRACK_ID));

  assert.deepEqual(
    cloudModes.map((mode) => mode.mode),
    ["learn", "drill", "review", "weakArea", "practice"],
  );
  assert.deepEqual(
    algorithmModes.map((mode) => mode.mode),
    ["learn", "drill", "review", "weakArea", "practice"],
  );
  assert.equal(cloudModes.find((mode) => mode.mode === "practice")?.enabled, true);
  assert.equal(algorithmModes.find((mode) => mode.mode === "practice")?.enabled, false);
});

test("Topic roadmap model does not expose development status copy", () => {
  const nodes = buildTopicRoadmapNodes({
    activeTrackId: ALGORITHMS_TRACK_ID,
    trainingAttempts: [],
  });
  const copy = JSON.stringify(nodes).toLowerCase();

  assert.equal(copy.includes("draft"), false);
  assert.equal(nodes.some((node) => node.status === "locked" || node.status === "later"), true);
});
