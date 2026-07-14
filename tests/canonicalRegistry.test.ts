import assert from "node:assert/strict";
import test from "node:test";
import { UnknownTrackError, UnknownTrackFamilyError, getTrackFamilyRegistration, getTrackRegistration, getTracks } from "../src/domain";

test("registry resolves current tracks without a default", () => {
  assert.deepEqual(getTracks().map((track) => track.id).sort(), ["algorithms", "cloud-certification"]);
  assert.equal(getTrackRegistration("algorithms").familyId, "algorithms");
  assert.equal(getTrackRegistration("cloud-certification").familyId, "certification");
  assert.throws(() => getTrackRegistration("missing"), UnknownTrackError);
  assert.throws(() => getTrackFamilyRegistration("missing"), UnknownTrackFamilyError);
});
