import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinition,
} from "../src/domain";
import {
  buildAlgorithmsPracticeModel,
  isAlgorithmsPracticeTrack,
  isCloudPracticeTrack,
} from "../src/features/home/tabs/practiceTabModel";

test("Algorithms Practice model exposes draft learning modes without active sessions", () => {
  const model = buildAlgorithmsPracticeModel(getTrackDefinition(ALGORITHMS_TRACK_ID));

  assert.equal(model.title, "Algorithms");
  assert.equal(model.statusLabel, "Draft");
  assert.deepEqual(
    model.modes.map((mode) => [mode.title, mode.enabled, mode.label]),
    [
      ["Pattern fundamentals", false, "Draft"],
      ["Strategy recognition", false, "Planned"],
      ["Complexity reasoning", false, "Planned"],
      ["Implementation drills", false, "Planned"],
      ["Mistake review", false, "Planned"],
    ],
  );
});

test("Algorithms Practice model does not expose Cloud practice setup language", () => {
  const model = buildAlgorithmsPracticeModel(getTrackDefinition(ALGORITHMS_TRACK_ID));
  const copy = [
    model.title,
    model.description,
    ...model.modes.flatMap((mode) => [mode.title, mode.detail]),
  ].join(" ");

  assert.equal(copy.includes("Cloud Certification"), false);
  assert.equal(copy.includes("Practice by Domain"), false);
  assert.equal(copy.includes("IAM"), false);
  assert.equal(copy.includes("Start session"), false);
  assert.equal(copy.includes("Start quiz"), false);
});

test("Practice track guards identify Cloud and Algorithms separately", () => {
  const cloud = getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID);
  const algorithms = getTrackDefinition(ALGORITHMS_TRACK_ID);

  assert.equal(isCloudPracticeTrack(cloud), true);
  assert.equal(isAlgorithmsPracticeTrack(cloud), false);
  assert.equal(isCloudPracticeTrack(algorithms), false);
  assert.equal(isAlgorithmsPracticeTrack(algorithms), true);
});
