import assert from "node:assert/strict";
import test from "node:test";
import { getTrackDisplay } from "../src/domain";
import { buildAnalyticsData } from "../src/features/analytics/analyticsService";
import { buildHomeTabModel } from "../src/features/home/tabs/homeTabModel";
import { buildProgressTabModel } from "../src/features/home/tabs/progressTabModel";
import { buildCloudCertificationProgressViewModel } from "../src/tracks/cloud-certification";

test("Home projection exposes a stable empty-state focus without inventing evidence", () => {
  const model = buildHomeTabModel({ activeTrack: getTrackDisplay("cloud-certification"), analytics: buildAnalyticsData([], []), trainingAttempts: [] });
  assert.equal(model.focusTitle, "Cloud Certification");
  assert.equal(model.primaryLabel, "Start learning");
});

test("Progress tab projects Certification empty state and due review availability", () => {
  const analytics = buildAnalyticsData([], []);
  const empty = buildProgressTabModel({ activeTrackId: "cloud-certification", analytics, attempts: [], practiceHistory: [], cloudProgress: buildCloudCertificationProgressViewModel({ attempts: [] }) });
  assert.equal(empty.hasData, false);
  assert.equal(empty.reviewActionEnabled, false);
  const due = buildProgressTabModel({ activeTrackId: "cloud-certification", analytics, attempts: [], practiceHistory: [], cloudProgress: { ...buildCloudCertificationProgressViewModel({ attempts: [] }), dueReviewCount: 2, scheduledReviewCount: 2 } });
  assert.equal(due.reviewQueueCount, 2);
  assert.deepEqual(due.reviewAction, { kind: "canonicalReviewQueue" });
});

test("Progress projection rejects an unknown track instead of selecting a default", () => {
  assert.throws(() => buildProgressTabModel({ activeTrackId: "unknown", analytics: buildAnalyticsData([], []), attempts: [], practiceHistory: [] }));
});
