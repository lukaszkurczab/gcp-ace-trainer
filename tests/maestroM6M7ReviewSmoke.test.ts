import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../src/content/bundled/generatedArtifacts";
import { AlgorithmContentCatalog, selectAlgorithmSessionPlan } from "../src/tracks/algorithms";
import { runtimeSelectors } from "../src/testing/runtimeSelectors";

const itemId = "alg-complexity-amortized-001";
const customSessionId = "algorithms:algorithms-custom-practice:1";
const weakReviewSessionId = "algorithms:algorithms-weak-area-review:2";
const nodeId = "complexity_and_constraints";
const m6 = readFileSync(".maestro/m6-due-smoke.yaml", "utf8");
const m7 = readFileSync(".maestro/m7-remediation-smoke.yaml", "utf8");

test("M6 and M7 seed their real first Custom Practice item from the pinned Guided blueprint", () => {
  const reference = GENERATED_BUNDLED_CONTENT_RELEASE.artifacts.find((artifact) => artifact.trackId === "algorithms");
  assert.ok(reference, "Algorithms artifact must be bundled");
  const catalog = new AlgorithmContentCatalog(JSON.parse(reference.artifactBytes).bank);
  const plan = selectAlgorithmSessionPlan({
    contentCatalog: catalog,
    mode: "algorithms-custom-practice",
    scope: { roadmapNodeId: nodeId },
    sessionLength: 10,
  });
  const item = catalog.getItemById(plan.items[0]!.id);

  assert.equal(plan.items[0]?.id, itemId);
  assert.equal(item.interaction.type, "choice");
  if (item.interaction.type !== "choice") assert.fail("M6/M7 seed item must retain its declared choice interaction.");
  assert.deepEqual(item.interaction.acceptedOptionIds, ["sequence_average"]);
  assert.ok(item.interaction.options.some((option) => option.id === "each_worst_constant"));
});

test("M6 performs a real scheduled due review after the canonical audit clock advance", () => {
  assertCanonicalPreparation(m6, "m6");
  assert.match(m6, new RegExp(escapeForRegExp("com.lkurczab.gcpacetrainer://audit/clock/advance?milliseconds=604800000")));
  assertReviewInteraction(m6, "correct");
  assert.ok(m6.indexOf("sequence_average") < m6.indexOf("clock/advance"));
  assert.ok(m6.indexOf("clock/advance") < m6.indexOf(runtimeSelectors.practice.modeCard("algorithms-weak-area-review")));
});

test("M7 materializes remediation through the canonical weak-area review session", () => {
  assertCanonicalPreparation(m7, "m7");
  assert.match(m7, new RegExp(escapeForRegExp(runtimeSelectors.session.option(itemId, "each_worst_constant"))));
  assert.match(m7, new RegExp(escapeForRegExp(runtimeSelectors.session.result(itemId, "incorrect"))));
  assert.match(m7, new RegExp(escapeForRegExp("com.lkurczab.gcpacetrainer://audit/clock/advance?milliseconds=86400000")));
  assertReviewInteraction(m7, "correct");
  assert.ok(m7.indexOf("each_worst_constant") < m7.indexOf("clock/advance"));
  assert.ok(m7.indexOf("clock/advance") < m7.indexOf(runtimeSelectors.practice.modeCard("algorithms-weak-area-review")));
});

function assertCanonicalPreparation(flow: string, tag: string): void {
  assert.match(flow, new RegExp(`- ${escapeForRegExp(tag)}`));
  assert.match(flow, new RegExp(escapeForRegExp("com.lkurczab.gcpacetrainer://audit/reset-learning-state")));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.practice.openSetup())));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.practice.sessionLength(10))));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.practice.startSession())));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.session.configuration(customSessionId, 10, "afterEachAnswer"))));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.session.question(itemId))));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.session.abandon(customSessionId))));
  assert.doesNotMatch(flow, /(?:point:|text:)/);
}

function assertReviewInteraction(flow: string, expectedResult: "correct"): void {
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.practice.modeCard("algorithms-weak-area-review"))));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.session.mode("algorithms-weak-area-review"))));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.session.option(itemId, "sequence_average"))));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.session.result(itemId, expectedResult))));
  assert.match(flow, new RegExp(escapeForRegExp(runtimeSelectors.session.abandon(weakReviewSessionId))));
  assert.equal(count(flow, runtimeSelectors.progress.root()), 2, "Progress must be observed before and after relaunch.");
  assert.equal(count(flow, runtimeSelectors.progress.node(nodeId)), 2, "The affected roadmap node must be observed before and after relaunch.");
  assert.match(flow, /- killApp\n- launchApp/);
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
