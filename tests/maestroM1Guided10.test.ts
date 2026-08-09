import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { GENERATED_BUNDLED_CONTENT_RELEASE } from "../src/content/bundled/generatedArtifacts";
import { AlgorithmContentCatalog, buildAlgorithmProgressFacts, selectAlgorithmSessionPlan } from "../src/tracks/coding-interview";
import { runtimeSelectors } from "../src/testing/runtimeSelectors";

type M1Manifest = Readonly<{
  release: Readonly<{ checksumSha256: string; releaseId: string; sourceRepositoryCommit: string }>;
  session: Readonly<{ feedbackTiming: "afterEachAnswer"; length: 10; modeId: "coding-interview-custom-practice"; roadmapNodeId: "complexity_and_constraints"; sessionId: string }>;
  detailsOnOrdinals: readonly number[];
  items: readonly Readonly<{ ordinal: number; itemId: string; selectedOptionIds: readonly string[]; expectedResult: "correct" | "incorrect" }>[];
}>;

const manifest = JSON.parse(readFileSync(".maestro/m1-guided-10.expected-session.json", "utf8")) as M1Manifest;
const flow = readFileSync(".maestro/m1-guided-10.yaml", "utf8");

test("M1 Custom 10 derives real item and option identities from the pinned Algorithms artifact", () => {
  const reference = GENERATED_BUNDLED_CONTENT_RELEASE.artifacts.find((artifact) => artifact.trackId === "coding-interview-dsa-problem-solving");
  assert.ok(reference, "Algorithms artifact must be bundled");
  const catalog = new AlgorithmContentCatalog(JSON.parse(reference.artifactBytes).bank);
  assert.equal(buildAlgorithmProgressFacts({
    attempts: [],
    content: {
      contentVersion: catalog.getContentVersion(),
      items: catalog.getItems(),
    },
  }).activeRoadmapNode.id, manifest.session.roadmapNodeId);
  const plan = selectAlgorithmSessionPlan({
    contentCatalog: catalog,
    mode: manifest.session.modeId,
    scope: { roadmapNodeId: manifest.session.roadmapNodeId },
    sessionLength: manifest.session.length,
  });

  assert.deepEqual(manifest.release, {
    checksumSha256: reference.checksumSha256,
    releaseId: reference.releaseId,
    sourceRepositoryCommit: reference.sourceRepositoryCommit,
  });
  assert.equal(plan.actualLength, 10);
  assert.deepEqual(manifest.items.map((item) => item.itemId), plan.items.map((item) => item.id));
  assert.deepEqual(manifest.items.map((item) => item.ordinal), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  assert.deepEqual(manifest.detailsOnOrdinals, [1, 4, 7]);

  for (const planned of manifest.items) {
    const item = catalog.getItemById(planned.itemId);
    if (item.interaction.type !== "choice") {
      assert.fail(`M1 item ${planned.itemId} must retain its declared choice interaction.`);
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

test("M1 flow uses only runtime selectors for the complete deterministic session", () => {
  for (const item of manifest.items) {
    for (const optionId of item.selectedOptionIds) {
      assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.option(item.itemId, optionId)}"`)));
    }
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.submit(item.itemId)}"`)));
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.feedback(item.itemId)}"`)));
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.result(item.itemId, item.expectedResult)}"`)));
  }
  for (const ordinal of manifest.detailsOnOrdinals) {
    const itemId = manifest.items[ordinal - 1]!.itemId;
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.detailsToggle(itemId)}"`)));
    assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.details(itemId)}"`)));
    assert.match(flow, new RegExp(`scrollUntilVisible:\\n\\s+element:\\n\\s+id: "${escapeForRegExp(runtimeSelectors.session.detailsToggle(itemId))}"\\n\\s+direction: DOWN\\n\\s+centerElement: true`));
  }

  const sessionId = manifest.session.sessionId;
  assert.equal(count(flow, runtimeSelectors.practice.startSession()), 1, "M1 must open Custom settings and start its configured session once.");
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practice.openSetup()}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.practice.sessionLength(10)}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.session.configuration(sessionId, 10, "afterEachAnswer")}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.root(sessionId)}"`)));
  assert.match(flow, new RegExp(escapeForRegExp(`id: "${runtimeSelectors.summary.backToPractice(sessionId)}"`)));
  assert.match(flow, /assertNotVisible:\n\s+id: "patternly:session:question:alg-complexity-amortized-011"/);
  assert.doesNotMatch(flow, /point:|text:/);
});

function escapeForRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function count(value: string, needle: string): number {
  return value.split(needle).length - 1;
}
