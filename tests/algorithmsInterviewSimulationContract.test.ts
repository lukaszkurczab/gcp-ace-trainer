import assert from "node:assert/strict";
import test from "node:test";

import { validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { prepareAlgorithmsInterviewSimulation, selectAlgorithmSessionPlan } from "../src/tracks/algorithms";
import { ALGORITHM_MODE_IDS, getAlgorithmMode } from "../src/tracks/algorithms/domain/algorithmModes";
import { readFileSync } from "node:fs";

const profileId = "algorithms-interview-simulation-v1";

test("Interview Simulation is the fixed, profile-owned forty-item contract and not Custom Practice 40", async () => {
  await validateBundledContent();
  const catalog = getAlgorithmContentCatalog();
  const mode = getAlgorithmMode(ALGORITHM_MODE_IDS.interviewSimulation);
  const custom = getAlgorithmMode(ALGORITHM_MODE_IDS.customPractice);
  const profile = catalog.getSimulationProfile(profileId);
  const pool = catalog.getSimulationPool(profileId);
  const blueprint = catalog.bank.practiceBlueprints.find((candidate) => candidate.modeId === ALGORITHM_MODE_IDS.interviewSimulation);
  assert.ok(profile);
  assert.ok(pool);
  assert.ok(blueprint);
  assert.notEqual(mode.id, custom.id);
  assert.equal(mode.profile.sessionLength, 40);
  assert.deepEqual(mode.profile.supportedLengths, [40]);
  assert.deepEqual(mode.profile.supportedFeedbackModes, ["atSessionEnd"]);
  assert.equal(profile.totalOccurrences, 40);
  assert.equal(profile.poolId, pool.poolId);
  assert.equal(profile.selectionPolicy.algorithmVersion, "sha256-ranked-constraints-v1");
  assert.match(readFileSync("src/tracks/algorithms/algorithmSessionSelection.ts", "utf8"), /selectionPolicy\.algorithmVersion !== "sha256-ranked-constraints-v1"/);
  assert.equal(profile.selectionPolicy.deterministic, true);
  assert.equal(profile.selectionPolicy.uniqueItems, true);
  assert.equal(profile.selectionPolicy.replacement, false);
  assert.equal(pool.itemIds.length, 40);
  assert.equal(new Set(pool.itemIds).size, 40);
  assert.deepEqual([...blueprint.resolvedItemIds].sort(), [...pool.itemIds].sort());

  const plan = selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: mode.id, sessionLength: 40, scope: { simulationProfileId: profileId } });
  assert.equal(plan.actualLength, 40);
  assert.deepEqual(plan.items.map((item) => item.id), blueprint.resolvedItemIds);

  const [first, second] = await Promise.all(["simulation-contract-one", "simulation-contract-two"].map((sessionId) => prepareAlgorithmsInterviewSimulation({ catalog, contentVersion: catalog.getContentVersion(), taxonomyVersion: "algorithms-taxonomy-v2", profileId, sessionId, startedAt: "2026-07-22T00:00:00.000Z" })));
  assert.ok(first);
  assert.ok(second);
  assert.deepEqual(first.session.itemOrder.map((item) => item.item.itemId), blueprint.resolvedItemIds);
  assert.deepEqual(second.session.itemOrder.map((item) => item.item.itemId), blueprint.resolvedItemIds);
  assert.equal(new Set(first.session.itemOrder.map((item) => item.item.itemId)).size, 40);
  assert.equal(first.session.configurationSnapshot.feedbackMode, "atSessionEnd");
  assert.equal(first.session.configurationSnapshot.navigation, "free");
  assert.equal(first.session.configurationSnapshot.simulationProfileId, profileId);
});
