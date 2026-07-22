import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../src/content/bundled/generatedArtifacts";
import { AlgorithmContentCatalog, buildAlgorithmProgressFacts, selectAlgorithmSessionPlan } from "../src/tracks/algorithms";
import { runtimeSelectors } from "../src/testing/runtimeSelectors";

type M2Manifest = Readonly<{
  release: Readonly<{ checksumSha256: string; releaseId: string; sourceRepositoryCommit: string }>;
  session: Readonly<{
    feedbackTiming: "atSessionEnd";
    length: 10;
    modeId: "algorithms-custom-practice";
    roadmapNodeId: "complexity_and_constraints";
    sessionId: string;
  }>;
  summaryReviewOrdinals: readonly number[];
  items: readonly Readonly<{
    expectedResult: "correct" | "incorrect";
    itemId: string;
    ordinal: number;
    selectedOptionIds: readonly string[];
  }>[];
}>;

const manifest = JSON.parse(readFileSync(".maestro/m2-custom-10-at-session-end.expected-session.json", "utf8")) as M2Manifest;
const flow = readFileSync(".maestro/m2-custom-10-at-session-end.yaml", "utf8");

test("M2 Custom 10 at session end derives real item, option, and outcome identities from the pinned Algorithms artifact", () => {
  const reference = GENERATED_BUNDLED_CONTENT_RELEASE.artifacts.find((artifact) => artifact.trackId === "algorithms");
  assert.ok(reference, "Algorithms artifact must be bundled");
  const catalog = new AlgorithmContentCatalog(JSON.parse(reference.artifactBytes).bank);
  assert.equal(buildAlgorithmProgressFacts([], catalog.getItems()).activeRoadmapNode.id, manifest.session.roadmapNodeId);
  const plan = selectAlgorithmSessionPlan({
    contentCatalog: catalog,
    mode: manifest.session.modeId,
    scope: { roadmapNodeId: manifest.session.roadmapNodeId },
    sessionLength: manifest.session.length,
  });

  assert.deepEqual(manifest.release, {
    checksumSha256: reference.checksumSha256,
    releaseId: GENERATED_BUNDLED_CONTENT_RELEASE.manifest.releaseId,
    sourceRepositoryCommit: reference.sourceRepositoryCommit,
  });
  assert.equal(plan.actualLength, 10);
  assert.deepEqual(manifest.items.map((item) => item.itemId), plan.items.map((item) => item.id));
  assert.deepEqual(manifest.items.map((item) => item.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(manifest.summaryReviewOrdinals, [1, 4, 7]);

  for (const planned of manifest.items) {
    const item = catalog.getItemById(planned.itemId);
    if (item.interaction.type !== "choice") {
      assert.fail(`M2 item ${planned.itemId} must retain its declared choice interaction.`);
    }
    const choice = item.interaction;
    const accepted = choice.acceptedOptionIds;
    assert.ok(planned.selectedOptionIds.every((optionId) => choice.options.some((option) => option.id === optionId)));
    const outcome = planned.selectedOptionIds.length === accepted.length && planned.selectedOptionIds.every((optionId) => accepted.includes(optionId))
      ? "correct"
      : "incorrect";
    assert.equal(planned.expectedResult, outcome);
  }

  assert.equal(manifest.items.filter((item) => item.expectedResult === "correct").length, 5);
  assert.equal(manifest.items.filter((item) => item.expectedResult === "incorrect").length, 5);
});

test("M2 flow uses stable selectors for Custom setup, deferred feedback, summary review, progress, and completed-session relaunch", () => {
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practice.customEntry()}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practice.openSetup()}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practice.customSetupTitle()}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practice.feedbackTiming("atSessionEnd")}"`)));

  const sessionId = manifest.session.sessionId;
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.configuration(sessionId, 10, "atSessionEnd")}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.root(sessionId)}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.configuration(sessionId, 10, "atSessionEnd")}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.backToPractice(sessionId)}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.progress.root()}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.resume.card(sessionId)}"`)));

  for (const item of manifest.items) {
    for (const optionId of item.selectedOptionIds) {
      assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.option(item.itemId, optionId)}"`)));
    }
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.submit(item.itemId)}"`)));
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.continue(item.itemId)}"`)));
  }

  for (const item of manifest.items.slice(0, -1)) {
    for (const selector of [
      runtimeSelectors.session.feedback(item.itemId),
      runtimeSelectors.session.reason(item.itemId),
      runtimeSelectors.session.details(item.itemId),
    ]) {
      assert.match(flow, new RegExp(`assertNotVisible:\\n\\s+id: "${escapeForRegExp(selector)}"`));
    }
  }

  for (const ordinal of manifest.summaryReviewOrdinals) {
    const feedbackItemId = `${sessionId}:occurrence:${ordinal - 1}`;
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.reason(feedbackItemId)}"`)));
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.detailsToggle(feedbackItemId)}"`)));
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.details(feedbackItemId)}"`)));
  }

  const hub = readFileSync("src/features/practice/PracticeHubScreen.tsx", "utf8");
  const setup = readFileSync("src/features/practice/PracticeSetupScreen.tsx", "utf8");
  const progress = readFileSync("src/features/home/tabs/ProgressTab.tsx", "utf8");
  assert.match(hub, /runtimeSelectors\.practice\.customEntry\(\)/);
  assert.match(setup, /runtimeSelectors\.practice\.customSetupTitle\(\)/);
  assert.match(progress, /runtimeSelectors\.progress\.root\(\)/);
  assert.match(flow, /assertNotVisible:\n\s+id: "patternly:session:question:alg-complexity-amortized-011"/);
  assert.doesNotMatch(flow, /point:|text:/);
});

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
