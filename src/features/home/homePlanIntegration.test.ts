import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import type { HomePlanReady } from "../../application/homePlanSnapshotReader";
import type { TrackId } from "../../domain";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { GENERATED_FREE_NODE_PACKAGES } from "../../content/bundled/generatedFreeNodePackages";
import { buildHomePlanPracticeSetupParams, localizeHomePlanArea } from "./homePlanUiContract";

const TRACK_ID = "coding-interview-dsa-problem-solving" as TrackId;

function readyPlan(): HomePlanReady {
  return {
    kind: "ready",
    trackId: TRACK_ID,
    identity: {
      trackId: TRACK_ID,
      goalRevision: 1,
      planId: "plan:1",
      planRevision: 2,
      planStorageRevision: 3,
      contentVersion: "content-v1",
      contentPackagePin: { packageIdentity: "package", packageVersion: "1", contentReleaseId: "release" },
      timezone: "Europe/Warsaw",
    },
    session: {
      modeId: "coding-interview-learn-approach",
      topicId: "complexity_and_constraints",
      sessionLength: 10,
      areaLabel: "Complexity and constraints",
    },
  } as HomePlanReady;
}

test("Home plan Practice handoff preserves the exact package identity and session facts", () => {
  const plan = readyPlan();
  const params = buildHomePlanPracticeSetupParams(plan, TRACK_ID);
  assert.deepEqual(params.expectedContentPackagePin, plan.identity.contentPackagePin);
  assert.equal(params.expectedContentVersion, plan.identity.contentVersion);
  assert.equal(params.mode, plan.session.modeId);
  assert.equal(params.topicId, plan.session.topicId);
  assert.equal(params.sessionLength, 10);
  assert.equal(params.trackId, TRACK_ID);
});

test("Home plan card localizes the exact-package area instead of substituting the track", () => {
  const translated = localizeHomePlanArea(readyPlan(), (key) => key === "Complexity and constraints" ? "Złożoność i ograniczenia" : key);
  assert.equal(translated, "Złożoność i ograniczenia");
});

test("every bundled exact-package area has matching EN and PL localization entries", () => {
  const en = JSON.parse(readFileSync("src/locales/en/common.json", "utf8")) as Record<string, string>;
  const pl = JSON.parse(readFileSync("src/locales/pl/common.json", "utf8")) as Record<string, string>;
  const labels = new Set(GENERATED_FREE_NODE_PACKAGES.map(({ manifest }) => {
    const label = manifest.freeNodeId.replaceAll("_", " ").replaceAll("-", " ").trim();
    return label.charAt(0).toUpperCase() + label.slice(1);
  }));

  assert.equal(labels.size, 9);
  for (const label of labels) {
    assert.equal(typeof en[label], "string", `missing EN area: ${label}`);
    assert.equal(typeof pl[label], "string", `missing PL area: ${label}`);
    assert.ok(en[label]!.length > 0);
    assert.ok(pl[label]!.length > 0);
  }
});

test("Home plan unavailable selectors preserve concrete reasons and the canonical retry", () => {
  assert.equal(runtimeSelectors.homePlan.reason("storage_error"), "patternly:home-plan:reason:storage-error");
  assert.equal(runtimeSelectors.homePlan.reason("identity_mismatch"), "patternly:home-plan:reason:identity-mismatch");
  assert.equal(runtimeSelectors.targetDateGuidance.primary("home"), "patternly:target-date-guidance:primary:home");
});
