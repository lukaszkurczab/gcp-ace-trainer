import assert from "node:assert/strict";
import test from "node:test";

import { ROUTES } from "../src/constants/routes";
import {
  buildShellSafetyModel,
  HOME_CHANGE_FOCUS_CTA,
  HOME_PRIMARY_CTA,
  HOME_RECOMMENDATIONS,
  MAIN_TAB_ITEMS,
  PRACTICE_PRIMARY_CTA,
  PRACTICE_REVIEW_CTA,
} from "../src/features/home/shellModel";
import { canCheckAnswer } from "../src/features/practice/practiceSessionModel";

test("bottom navigation labels stay canonical", () => {
  const labels: readonly string[] = MAIN_TAB_ITEMS.map((item) => item.label);

  assert.deepEqual(labels, ["Home", "Practice", "Progress", "Settings"]);
  assert.equal(labels.includes("Stats"), false);
});

test("primary Home and Practice CTAs route to Cloud practice setup", () => {
  assert.deepEqual(HOME_PRIMARY_CTA, {
    label: "Start learning",
    route: ROUTES.PRACTICE_SETUP,
  });
  assert.deepEqual(PRACTICE_PRIMARY_CTA, {
    label: "Start session",
    route: ROUTES.PRACTICE_SETUP,
  });
});

test("Home change focus CTA routes to track selection", () => {
  assert.deepEqual(HOME_CHANGE_FOCUS_CTA, {
    label: "Change focus",
    route: ROUTES.SELECT_TRACK,
  });
});

test("shell safety model exposes no gamified status fields", () => {
  const model = buildShellSafetyModel();

  assert.deepEqual(model.gamifiedFields, []);
  assert.equal("streak" in model, false);
  assert.equal("level" in model, false);
  assert.equal("readinessPercent" in model, false);
  assert.equal("retentionPercent" in model, false);
  assert.equal("examPassPrediction" in model, false);
});

test("Home recommendations are static unless explicitly wired", () => {
  assert.deepEqual(
    HOME_RECOMMENDATIONS.map((item) => item.route ?? null),
    [null, null, null],
  );
  assert.deepEqual(buildShellSafetyModel().homeRecommendationRoutes, []);
});

test("Practice review weak items is static until review queue is verified", () => {
  assert.deepEqual(PRACTICE_REVIEW_CTA, {
    enabled: false,
    label: "Review weak items",
  });
  assert.equal(buildShellSafetyModel().practiceReviewRoute, null);
});

test("selecting an answer enables the Check Answer action", () => {
  assert.equal(canCheckAnswer([], false), false);
  assert.equal(canCheckAnswer(["a"], false), true);
  assert.equal(canCheckAnswer(["a"], true), false);
});
