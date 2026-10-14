import assert from "node:assert/strict";
import test, { before } from "node:test";

import { getTrackDisplay } from "../../../domain";
import type { AnalyticsData } from "../../analytics/analyticsService";
import { contentPackageRuntimeOwner } from "../../../application/contentPackageRuntimeOwner";
import { hasClaudeDueReview, homePlanPlacement, buildHomeTabModel, type HomeRecommendationModel } from "./homeTabModel";

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
  const model = buildHomeTabModel({ ...base, algorithmsDashboard: { trackId, attemptCount: 0, dueReviewCount: 0, manualReviewCount: 0 } });
  assert.deepEqual(model.recommendations[0]?.action, { kind: "start_supported_mode", trackId, modeId: "coding-interview-guided-practice", nodeId: model.topicId });
  assert.equal(model.recommendations[0]?.enabled, true);
});

test("Coding Interview Home recommends due review from canonical counts", () => {
  const model = buildHomeTabModel({ ...base, algorithmsDashboard: { trackId, attemptCount: 2, dueReviewCount: 1, manualReviewCount: 0 } });
  assert.deepEqual(model.recommendations[0]?.action, { kind: "start_supported_mode", trackId, modeId: "coding-interview-weak-area-review", evidenceSources: ["due_queue"] });
  assert.equal(model.recommendations[0]?.enabled, true);
});

test("Coding Interview Home routes an immediate manual request only when automatic work is not due", () => {
  const model = buildHomeTabModel({ ...base, algorithmsDashboard: { trackId, attemptCount: 2, dueReviewCount: 0, manualReviewCount: 1 } });
  assert.deepEqual(model.recommendations[0]?.action, { kind: "start_supported_mode", trackId, modeId: "coding-interview-weak-area-review", evidenceSources: ["due_queue"], reviewSource: "manual_request" });
  const dueWins = buildHomeTabModel({ ...base, algorithmsDashboard: { trackId, attemptCount: 2, dueReviewCount: 1, manualReviewCount: 1 } });
  assert.deepEqual(dueWins.recommendations[0]?.action, { kind: "start_supported_mode", trackId, modeId: "coding-interview-weak-area-review", evidenceSources: ["due_queue"] });
});

test("a short case keeps ready and unavailable plans visible below it", () => {
  for (const planKind of ["ready", "unavailable"] as const) {
    assert.equal(homePlanPlacement({hasActiveSession:false,hasPracticeRecommendation:true,planKind}), "secondary");
    assert.equal(homePlanPlacement({hasActiveSession:false,hasPracticeRecommendation:false,planKind}), "primary");
    assert.equal(homePlanPlacement({hasActiveSession:true,hasPracticeRecommendation:true,planKind}), "hidden");
  }
});
test("legal due review, including a contrast obligation, outranks whole-case work", () => {
  const common = {enabled:true,icon:"practice",label:"Start",primaryLabel:"Start",tone:"primary",detail:"",title:""} as const;
  const singleCaseRecommendation: HomeRecommendationModel = {...common,action:{kind:"start_single_case",caseId:"case",nodeId:"node",decisionCount:3}};
  const dueReviewRecommendation: HomeRecommendationModel = {...common,action:{kind:"start_certification_due_review",trackId:"claude-certified-architect-professional-certification"}};
  const model = buildHomeTabModel({...base,activeTrack:getTrackDisplay("claude-certified-architect-professional-certification"),algorithmsDashboard:null,singleCaseRecommendation,dueReviewRecommendation});
  assert.equal(model.recommendations[0]?.action.kind,"start_certification_due_review");
});


test("Claude Home due action recognizes historical pins and timestamp offsets", () => {
  const claude = "claude-certified-architect-professional-certification";
  const entry = {trackId:claude,status:"active",dueAt:"2026-10-14T10:00:00+02:00",sourceItem:{trackId:claude,contentVersion:"historical",artifactSha256:"a".repeat(64)}} as import("../../../domain").ReviewQueueEntry;
  assert.equal(hasClaudeDueReview([entry],"2026-10-14T08:01:00.000Z"),true);
  assert.equal(hasClaudeDueReview([entry],"2026-10-14T07:59:00.000Z"),false);
  assert.equal(hasClaudeDueReview([{...entry,status:"completed"}],"2026-10-14T08:01:00.000Z"),false);
  assert.equal(hasClaudeDueReview([{...entry,trackId}],"2026-10-14T08:01:00.000Z"),false);
});
