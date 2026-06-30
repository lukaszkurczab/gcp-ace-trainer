import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  getTrackDefinition,
} from "../src/domain";
import { ROUTES } from "../src/constants/routes";
import {
  buildAlgorithmsPracticeModel,
  isAlgorithmsPracticeTrack,
  isCloudPracticeTrack,
} from "../src/features/home/tabs/practiceTabModel";

test("Algorithms Practice model exposes roadmap nodes with a usable first CTA", () => {
  const model = buildAlgorithmsPracticeModel(getTrackDefinition(ALGORITHMS_TRACK_ID));

  assert.equal(model.title, "Algorithms");
  assert.equal(model.statusLabel, "Draft");
  assert.deepEqual(model.primaryAction, {
    label: "Start Complexity basics",
    route: ROUTES.ALGORITHMS_SESSION,
    routeParams: {
      nodeId: "complexity_basics",
    },
  });
  assert.deepEqual(
    model.nodes.slice(0, 4).map((node) => [node.title, node.enabled, node.label, node.itemCount]),
    [
      ["Complexity basics", true, "Available", 1],
      ["Array and string basics", true, "Available", 1],
      ["Hash map lookup", true, "Available", 3],
      ["Two pointers pair scan", true, "Available", 2],
    ],
  );
});

test("Algorithms Practice model does not expose Cloud practice setup language", () => {
  const model = buildAlgorithmsPracticeModel(getTrackDefinition(ALGORITHMS_TRACK_ID));
  const copy = [
    model.title,
    model.description,
    model.primaryAction.route,
    ...model.nodes.flatMap((node) => [node.title, node.detail, node.route]),
  ].join(" ");

  assert.equal(copy.includes("Cloud Certification"), false);
  assert.equal(copy.includes("Practice by Domain"), false);
  assert.equal(copy.includes("IAM"), false);
  assert.equal(copy.includes("Start quiz"), false);
  assert.equal(model.primaryAction.route, ROUTES.ALGORITHMS_SESSION);
});

test("Practice track guards identify Cloud and Algorithms separately", () => {
  const cloud = getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID);
  const algorithms = getTrackDefinition(ALGORITHMS_TRACK_ID);

  assert.equal(isCloudPracticeTrack(cloud), true);
  assert.equal(isAlgorithmsPracticeTrack(cloud), false);
  assert.equal(isCloudPracticeTrack(algorithms), false);
  assert.equal(isAlgorithmsPracticeTrack(algorithms), true);
});
