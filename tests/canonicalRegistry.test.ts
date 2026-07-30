import assert from "node:assert/strict";
import test from "node:test";
import { TrackRegistry, UnknownTrackError, UnknownTrackFamilyError, getTrackFamilyRegistration, getTrackRegistration, getTracks } from "../src/domain";

test("registry resolves current tracks without a default", () => {
  assert.deepEqual(getTracks().map((track) => track.id).sort(), ["algorithms", "cloud-certification"]);
  assert.equal(getTrackRegistration("algorithms").familyId, "algorithms");
  assert.equal(getTrackRegistration("cloud-certification").familyId, "certification");
  assert.deepEqual(
    {
      categoryLabel: getTrackRegistration("cloud-certification").metadata.categoryLabel,
      shortTitle: getTrackRegistration("cloud-certification").metadata.shortTitle,
      title: getTrackRegistration("cloud-certification").metadata.title,
    },
    {
      categoryLabel: "Certification",
      shortTitle: "Google Cloud ACE",
      title: "Google Cloud Associate Cloud Engineer",
    },
  );
  assert.deepEqual(
    {
      categoryLabel: getTrackRegistration("algorithms").metadata.categoryLabel,
      shortTitle: getTrackRegistration("algorithms").metadata.shortTitle,
      title: getTrackRegistration("algorithms").metadata.title,
    },
    {
      categoryLabel: "Algorithmic problem solving",
      shortTitle: "Algorithms",
      title: "Algorithms",
    },
  );
  assert.throws(() => getTrackRegistration("missing"), UnknownTrackError);
  assert.throws(() => getTrackFamilyRegistration("missing"), UnknownTrackFamilyError);
});

test("a new track and family register without modifying the learning kernel", () => {
  const registry = new TrackRegistry([{ id: "future-track", familyId: "future-family", metadata: { title: "Future", shortTitle: "Future", categoryLabel: "Test", description: "Test registration", status: "active", accentColor: "#000", accentMutedColor: "#fff" } }]);
  assert.equal(registry.getTrackRegistration("future-track").familyId, "future-family");
  assert.equal(registry.getTrackFamilyRegistration("future-family")[0]?.id, "future-track");
  assert.equal(Object.isFrozen(registry.getTrackRegistration("future-track")), true);
  assert.throws(() => new TrackRegistry([registry.getTrackRegistration("future-track"), registry.getTrackRegistration("future-track")]));
});
