import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { GENERATED_FREE_NODE_PACKAGES } from "../../content/bundled/generatedFreeNodePackages";
import { buildAlgorithmProgressFacts, selectAlgorithmSessionPlan } from "./";
import { runtimeSelectors } from "../../testing/runtimeSelectors";
import { getCodingPackageTestCatalog, prepareBundledTestPackages } from "../../testing/contentPackageRuntimeTestSupport";

type M2Manifest = Readonly<{
  release: Readonly<{ checksumSha256: string; releaseId: string; sourceRepositoryCommit: string }>;
  session: Readonly<{
    feedbackTiming: "atSessionEnd";
    length: 10;
    modeId: "coding-interview-custom-practice";
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
const flow = readFileSync(".maestro/m2-custom-10-at-session-end.yaml", "utf8").replace(
  "- runFlow: completed-practice-result-review.yaml",
  readFileSync(".maestro/completed-practice-result-review.yaml", "utf8"),
);
const reviewFlow = [
  readFileSync(".maestro/coding-practice-result-review.yaml", "utf8"),
  readFileSync(".maestro/coding-practice-answer-review-details.yaml", "utf8"),
].join("\n");

test("M2 Custom 10 at session end derives real item, option, and outcome identities from the pinned Algorithms package", async () => {
  await prepareBundledTestPackages();
  const reference = GENERATED_FREE_NODE_PACKAGES.find((artifact) => artifact.trackId === "coding-interview-dsa-problem-solving")!;
  const catalog = getCodingPackageTestCatalog();
  assert.equal(buildAlgorithmProgressFacts({
    attempts: [],
    content: {
      contentVersion: catalog.getContentVersion(),
      items: catalog.getItems(),
      packagePin: catalog.getPackagePin(),
    },
  }).activeRoadmapNode.id, manifest.session.roadmapNodeId);
  const plan = selectAlgorithmSessionPlan({
    contentCatalog: catalog,
    mode: manifest.session.modeId,
    scope: { roadmapNodeId: manifest.session.roadmapNodeId },
    sessionLength: manifest.session.length,
  });

  assert.deepEqual(manifest.release, {
    checksumSha256: reference.manifest.provenance.sourceArtifactChecksumSha256,
    releaseId: reference.manifest.provenance.releaseId,
    sourceRepositoryCommit: reference.manifest.provenance.sourceRepositoryCommit,
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
  assert.match(readFileSync(".gitignore", "utf8"), /^!\.maestro\/coding-practice-result-review\.yaml$/m);
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
  assert.equal(count(flow, "- runFlow: coding-practice-result-review.yaml"), 1);
  assert.equal(count(flow, "- runFlow: coding-practice-answer-review-details.yaml"), 1);
  assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.root(sessionId)}"`)));
  assert.equal(count(reviewFlow, runtimeSelectors.practice.startSession()), 0);

  for (const item of manifest.items) {
    for (const optionId of item.selectedOptionIds) {
      assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.option(item.itemId, optionId)}"`)));
    }
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.submit(item.itemId)}"`)));
    assert.doesNotMatch(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.continue(item.itemId)}"`)));
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
    assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.feedbackItem(sessionId, feedbackItemId)}"`)));
    assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practiceReview.root(sessionId, feedbackItemId)}"`)));
    assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.reason(feedbackItemId)}"`)));
    assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.detailsToggle(feedbackItemId)}"`)));
    assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.details(feedbackItemId)}"`)));
  }

  for (const ordinal of [1, 10]) {
    const feedbackItemId = `${sessionId}:occurrence:${ordinal - 1}`;
    assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.feedbackItem(sessionId, feedbackItemId)}"`)));
  }
  assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practiceReview.previous()}"\n    enabled: false`)));
  assert.match(reviewFlow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practiceReview.next()}"\n    enabled: false`)));
  assert.doesNotMatch(reviewFlow, /- tapOn:\n    id: "patternly:session:submit:/);

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

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
