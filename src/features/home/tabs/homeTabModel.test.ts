import assert from "node:assert/strict";
import test, { before } from "node:test";

import { getTrackDisplay } from "../../../domain";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import { buildHomeTabModel } from "./homeTabModel";

const trackId = "coding-interview-dsa-problem-solving" as const;
const base = {
  activeTrack: getTrackDisplay(trackId),
  analytics: {} as AnalyticsData,
  dashboardError: null,
  trainingAttempts: [],
};

before(async () => {
  await contentPackageRuntimeOwner.verifyBundledPackages();
});

test("Coding Interview Home uses the canonical dashboard projection for guided practice", () => {
  const model = buildHomeTabModel({ ...base, algorithmsDashboard: { trackId, attemptCount: 0, dueReviewCount: 0 } });
  assert.deepEqual(model.recommendations[0]?.action, { kind: "start_supported_mode", trackId, modeId: "coding-interview-guided-practice", nodeId: model.topicId });
  assert.equal(model.recommendations[0]?.enabled, true);
});

test("Coding Interview Home recommends due review from canonical counts", () => {
  const model = buildHomeTabModel({ ...base, algorithmsDashboard: { trackId, attemptCount: 2, dueReviewCount: 1 } });
  assert.deepEqual(model.recommendations[0]?.action, { kind: "start_supported_mode", trackId, modeId: "coding-interview-weak-area-review", evidenceSources: ["due_queue"] });
  assert.equal(model.recommendations[0]?.enabled, true);
});
