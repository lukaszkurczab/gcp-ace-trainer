import assert from "node:assert/strict";
import test from "node:test";
import { TrackRegistry, UnknownTrackError, UnknownTrackFamilyError, getTrackFamilyRegistration, getTrackRegistration, getTracks } from "../src/domain";

test("registry resolves current tracks without a default", () => {
  assert.deepEqual(getTracks().map((track) => track.id).sort(), ["coding-interview-dsa-problem-solving", "google-cloud-associate-cloud-engineer"]);
  assert.equal(getTrackRegistration("coding-interview-dsa-problem-solving").familyId, "coding_interview");
  assert.equal(getTrackRegistration("google-cloud-associate-cloud-engineer").familyId, "certification");
  assert.deepEqual(
    {
      shortTitle: getTrackRegistration("google-cloud-associate-cloud-engineer").metadata.shortTitle,
      title: getTrackRegistration("google-cloud-associate-cloud-engineer").metadata.title,
    },
    {
      shortTitle: "Google Cloud ACE",
      title: "Google Cloud Associate Cloud Engineer",
    },
  );
  assert.deepEqual(
    {
      shortTitle: getTrackRegistration("coding-interview-dsa-problem-solving").metadata.shortTitle,
      title: getTrackRegistration("coding-interview-dsa-problem-solving").metadata.title,
    },
    {
      shortTitle: "Coding Interview",
      title: "Coding Interview: DSA & Problem Solving",
    },
  );
  assert.throws(() => getTrackRegistration("missing"), UnknownTrackError);
  assert.throws(() => getTrackFamilyRegistration("missing"), UnknownTrackFamilyError);
});

test("a new track and family register without modifying the learning kernel", () => {
  const registry = new TrackRegistry([{ id: "future-track", familyId: "future-family", metadata: { title: "Future", shortTitle: "Future", description: "Test registration", status: "active", accentColor: "#000", accentMutedColor: "#fff" } }]);
  assert.equal(registry.getTrackRegistration("future-track").familyId, "future-family");
  assert.equal(registry.getTrackFamilyRegistration("future-family")[0]?.id, "future-track");
  assert.equal(Object.isFrozen(registry.getTrackRegistration("future-track")), true);
  assert.throws(() => new TrackRegistry([registry.getTrackRegistration("future-track"), registry.getTrackRegistration("future-track")]));
});
