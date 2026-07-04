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
import { getPracticeReviewBehaviorCopy } from "../src/features/practice/practiceSetupModel";

test("Practice modes stay aligned while keeping Algorithms practice active", () => {
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
  assert.equal(algorithmModes.find((mode) => mode.mode === "practice")?.enabled, true);

  const algorithmCopy = JSON.stringify(algorithmModes).toLowerCase();
  assert.equal(algorithmCopy.includes(blockedTerm("mock")), false);
  assert.equal(algorithmCopy.includes(blockedTerm("readiness")), false);
  assert.equal(algorithmCopy.includes(blockedTerm("draft")), false);
  assert.equal(algorithmCopy.includes("certification"), false);
});

test("Topic roadmap model does not expose development status copy", () => {
  const nodes = buildTopicRoadmapNodes({
    activeTrackId: ALGORITHMS_TRACK_ID,
    trainingAttempts: [],
  });
  const copy = JSON.stringify(nodes).toLowerCase();

  assert.equal(copy.includes(blockedTerm("draft")), false);
  assert.equal(nodes.some((node) => node.status === "locked" || node.status === "later"), true);
});

test("Practice setup review behavior copy matches track runtime contract", () => {
  const algorithmsCopy = getPracticeReviewBehaviorCopy(ALGORITHMS_TRACK_ID);
  const cloudCopy = getPracticeReviewBehaviorCopy(CLOUD_CERTIFICATION_TRACK_ID);

  assert.equal(algorithmsCopy.showToggle, false);
  assert.match(algorithmsCopy.detail, /Review queue automatically/);
  assert.equal(cloudCopy.showToggle, true);
  assert.match(cloudCopy.detail, /end-of-session correction pass/);
});

function blockedTerm(value: string): string {
  return value;
}
