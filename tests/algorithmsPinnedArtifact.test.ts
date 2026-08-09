import assert from "node:assert/strict";
import test from "node:test";

import { validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { prepareAlgorithmsInterviewSimulation, selectAlgorithmSessionPlan } from "../src/tracks/coding-interview";

function required<T>(value: T | undefined, label: string): T {
  if (value === undefined) throw new Error(`Pinned Algorithms artifact lacks ${label}.`);
  return value;
}

test("prepares every Algorithms mode from the active pinned artifact without substitutions or shortening", async () => {
  const validation = await validateBundledContent();
  const algorithms = required(validation.tracks.find((track) => track.trackId === "coding-interview-dsa-problem-solving"), "Algorithms availability");
  const certification = required(validation.tracks.find((track) => track.trackId === "google-cloud-associate-cloud-engineer"), "Certification availability");
  assert.equal(algorithms.kind, "available");
  assert.equal(certification.kind, "available");

  const catalog = getAlgorithmContentCatalog();
  const contentVersion = catalog.getContentVersion();
  assert.match(contentVersion, /^coding-interview-dsa-problem-solving-\d{4}$/);
  const mentalUnitId = required(
    [...new Map(catalog.getItems().map((item) => [item.taxonomy.primaryMentalUnitId, catalog.getItems().filter((candidate) => candidate.taxonomy.primaryMentalUnitId === item.taxonomy.primaryMentalUnitId).length])).entries()].find(([, count]) => count >= 20)?.[0],
    "a 20-item mental unit",
  );
  const recognition = required(catalog.bank.recognitionSets.find((set) => set.itemIds.length >= 20), "a 20-item recognition set");
  const contrast = required(catalog.bank.contrastSets.find((set) => set.itemIds.length >= 20), "a 20-item contrast set");
  const contrastRoadmapNodeId = catalog.getItemById(contrast.itemIds[0]!).taxonomy.roadmapNodeId;
  const interleaved = required(catalog.bank.interleavedScopes.find((scope) => scope.itemIds.length >= 20), "a 20-item interleaved scope");
  const simulationProfile = required(catalog.bank.simulationProfiles.find((profile) => profile.totalOccurrences === 40), "the canonical 40-item simulation profile");

  const selections = [
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "coding-interview-learn-approach", sessionLength: 10, scope: { mentalUnitId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "coding-interview-guided-practice", sessionLength: 20, scope: { mentalUnitId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "coding-interview-recognize-patterns", sessionLength: 20, scope: { recognitionSetId: recognition.setId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "coding-interview-contrast-practice", sessionLength: 20, scope: { contrastRoadmapNodeId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "coding-interview-weak-area-review", sessionLength: 10, reviewSource: "session_misses", reviewItemRefs: catalog.getItems().slice(0, 10).map((item) => catalog.toContentItemRef(item)) }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "coding-interview-independent-practice", sessionLength: 20, scope: { interleavedScopeId: interleaved.scopeId } }),
    selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "coding-interview-simulation", sessionLength: 40, scope: { simulationProfileId: simulationProfile.profileId } }),
  ];
  assert.deepEqual(selections.map((selection) => selection.actualLength), [10, 20, 20, 20, 10, 20, 40]);
  for (const selection of selections) {
    assert.equal(selection.shorteningReason, undefined);
    assert.equal(new Set(selection.items.map((item) => item.id)).size, selection.actualLength);
  }

  const simulation = await prepareAlgorithmsInterviewSimulation({ catalog, contentVersion, taxonomyVersion: algorithms.kind === "available" ? algorithms.taxonomyVersion : "", profileId: simulationProfile.profileId, sessionId: `${contentVersion}-simulation`, startedAt: "2026-07-18T00:00:00.000Z" });
  assert.equal(simulation.session.actualLength, 40);
  assert.equal(new Set(simulation.session.itemOrder.map((occurrence) => occurrence.item.itemId)).size, 40);
  assert.ok(simulation.session.itemOrder.every((occurrence) => occurrence.item.contentVersion === contentVersion));
  assert.match(simulation.session.planFingerprint ?? "", /^[a-f0-9]{64}$/);
});
