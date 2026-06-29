import assert from "node:assert/strict";
import test from "node:test";

import {
  ALGORITHMS_TRACK_ID,
  CLOUD_CERTIFICATION_TRACK_ID,
  DEFAULT_TRACK_ID,
  getEnabledSessionModes,
  getTrackDefinition,
  getTrackDefinitions,
  isTrackId,
} from "../src/domain";

test("track registry exposes the commercial MVP track set", () => {
  const tracks = getTrackDefinitions();

  assert.equal(DEFAULT_TRACK_ID, CLOUD_CERTIFICATION_TRACK_ID);
  assert.deepEqual(
    tracks.map((track) => track.id),
    [CLOUD_CERTIFICATION_TRACK_ID, ALGORITHMS_TRACK_ID],
  );
});

test("cloud certification is active and algorithms is explicit draft", () => {
  const cloud = getTrackDefinition(CLOUD_CERTIFICATION_TRACK_ID);
  const algorithms = getTrackDefinition(ALGORITHMS_TRACK_ID);

  assert.equal(cloud.status, "active");
  assert.equal(algorithms.status, "draft");
  assert.ok(getEnabledSessionModes(cloud.id).length > 0);
  assert.equal(getEnabledSessionModes(algorithms.id).length, 0);
});

test("track id guard rejects unknown values", () => {
  assert.equal(isTrackId("cloud-certification"), true);
  assert.equal(isTrackId("algorithms"), true);
  assert.equal(isTrackId("gcp-ace-trainer"), false);
});
