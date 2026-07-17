import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { requireBundledTrackMode, validateBundledContent } from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import { AlgorithmContentCatalog, prepareAlgorithmsInterviewSimulation, selectAlgorithmSessionPlan } from "../src/tracks/algorithms";

const harnessUrl = new URL("../integration/contracts/algorithms-content/harness.mjs", import.meta.url);

function files(root: string): readonly string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]);
}

test("round-trips a production-pipeline test artifact through the exact Algorithms consumer and every declared mode", async () => {
  const harness = await import(harnessUrl.href) as typeof import("../integration/contracts/algorithms-content/harness.mjs");
  const built = await harness.buildCrossRepositoryAlgorithmsRelease();
  try {
    assert.deepEqual(built.artifact.declaredModes, harness.CROSS_REPOSITORY_ALGORITHMS_MODES);
    assert.equal(built.integration.taxonomyVersion, "algorithms-taxonomy-v2");
    assert.equal(built.integration.taxonomyFingerprint, "ec4a6874714e907299366412613dd1725a777964855be44d59769824bcccc046");
    assert.match(built.artifact.checksumSha256, /^[a-f0-9]{64}$/);
    assert.equal(built.artifact.sourceRepositoryCommit, built.integration.finalReleaseCommit);
    assert.equal(built.release.manifest.sourceRepositoryCommit, built.integration.finalReleaseCommit);
    assert.equal(built.evidence.evidence[0]!.validatedAtSourceCommit, built.integration.technicalInputCommit);
    assert.equal(built.evidence.evidence[0]!.technicalInputFingerprint, built.inspection.source.technicalInputFingerprint);
    assert.notEqual(built.integration.technicalInputCommit, built.integration.technicalEvidenceCommit);
    assert.notEqual(built.integration.technicalEvidenceCommit, built.integration.approvalsActivationCommit);
    assert.deepEqual(Object.keys(JSON.parse(built.artifact.artifactBytes).bank).sort(), ["approvalActivationIdentity", "compatibilitySets", "contentVersion", "contrastSets", "familyId", "formatVersion", "interleavedScopes", "items", "practiceBlueprints", "recognitionSets", "simulationPools", "simulationProfiles", "trackId"].sort());
    assert.doesNotMatch(built.artifact.artifactBytes, /relationMetadata|authoringProvenance|sourceOverrides|technicalValidationEvidence|resolvedModeDeclarations/);

    const result = await validateBundledContent(built.release); const availability = result.tracks.find((track) => track.trackId === "algorithms");
    assert.equal(availability?.kind, "available"); assert.equal(result.tracks.find((track) => track.trackId === "cloud-certification")?.kind, "unavailable");
    const catalog = getAlgorithmContentCatalog(); assert.equal(catalog.getItems().length, 40);
    for (const mode of harness.CROSS_REPOSITORY_ALGORITHMS_MODES) assert.equal(requireBundledTrackMode("algorithms", mode).trackId, "algorithms");

    const selected = [
      selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "algorithms-learn-approach", sessionLength: 10, scope: { mentalUnitId: "recognize_binary_search_signal" } }),
      selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "algorithms-guided-practice", sessionLength: 20, scope: { mentalUnitId: "recognize_binary_search_signal" } }),
      selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "algorithms-recognize-patterns", sessionLength: 20, scope: { recognitionSetId: "cross-recognition" } }),
      selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "algorithms-contrast-practice", sessionLength: 20, scope: { contrastSetId: "cross-contrast" } }),
      selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "algorithms-weak-area-review", sessionLength: 10, reviewSource: "session_misses", reviewItemRefs: catalog.getItems().slice(0, 10).map((item) => catalog.toContentItemRef(item)) }),
      selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "algorithms-independent-practice", sessionLength: 20, scope: { interleavedScopeId: "cross-interleaved" } }),
      selectAlgorithmSessionPlan({ contentCatalog: catalog, mode: "algorithms-interview-simulation", sessionLength: 40, scope: { simulationProfileId: "cross-simulation-profile" } }),
    ];
    assert.deepEqual(selected.map((entry) => entry.actualLength), [10, 20, 20, 20, 10, 20, 40]);
    for (const entry of selected) assert.equal(new Set(entry.items.map((item) => item.id)).size, entry.actualLength);
    assert.deepEqual(new Set(selected[0]!.items.map((item) => item.taxonomy.primaryMentalUnitId)), new Set(["recognize_binary_search_signal"]));
    assert.deepEqual(new Set(catalog.getItemsForRoadmapNode("binary_search").map((item) => item.taxonomy.primaryMentalUnitId)), new Set(["recognize_binary_search_signal"]));
    const twoUnitsBank = { ...catalog.bank, items: catalog.bank.items.map((item) => { const ordinal = Number(item.id.split("-").at(-1)); return ordinal > 10 && ordinal <= 20 ? { ...item, taxonomy: { ...item.taxonomy, primaryMentalUnitId: "boundaries_and_loop_invariants", primarySkillAtomId: "identify_legal_half_discard_rule" } } : item; }) };
    const twoUnitsCatalog = new AlgorithmContentCatalog(twoUnitsBank);
    const byMentalUnit = selectAlgorithmSessionPlan({ contentCatalog: twoUnitsCatalog, mode: "algorithms-guided-practice", sessionLength: 10, scope: { mentalUnitId: "boundaries_and_loop_invariants" } });
    const byRoadmapNode = selectAlgorithmSessionPlan({ contentCatalog: twoUnitsCatalog, mode: "algorithms-guided-practice", sessionLength: 20, scope: { roadmapNodeId: "binary_search" } });
    assert.equal(byMentalUnit.actualLength, 10);
    assert.equal(byRoadmapNode.actualLength, 20);
    assert.deepEqual(new Set(byMentalUnit.items.map((item) => item.taxonomy.primaryMentalUnitId)), new Set(["boundaries_and_loop_invariants"]));
    assert.deepEqual(new Set(byRoadmapNode.items.map((item) => item.taxonomy.primaryMentalUnitId)), new Set(["recognize_binary_search_signal", "boundaries_and_loop_invariants"]));
    assert.deepEqual(new Set(catalog.getItems().map((item) => item.interaction.type)), new Set(["choice", "ordering", "complexity"]));

    const simulation = await prepareAlgorithmsInterviewSimulation({ catalog, contentVersion: "cross-repo-fixture-v1", taxonomyVersion: "algorithms-taxonomy-v2", profileId: "cross-simulation-profile", sessionId: "cross-repo-simulation", startedAt: "2026-07-17T00:00:00.000Z" });
    assert.equal(simulation.session.actualLength, 40); assert.equal(new Set(simulation.session.itemOrder.map((entry) => entry.item.itemId)).size, 40); assert.match(simulation.session.planFingerprint ?? "", /^[a-f0-9]{64}$/);
    const profile = catalog.getSimulationProfile("cross-simulation-profile")!; assert.equal(profile.distributions.length, 2);
    for (const distribution of profile.distributions) for (const bucket of distribution.buckets) { const actual = simulation.session.itemOrder.map(({ item }) => catalog.getItemById(item.itemId)).filter((item) => distribution.dimension === "primaryMentalUnitId" ? item.taxonomy.primaryMentalUnitId === bucket.valueId : item.interaction.type === bucket.valueId).length; assert.ok(actual >= bucket.minimum && actual <= bucket.maximum); assert.equal(actual, bucket.target); }
    console.info(`APPLICATION_COMMIT=${built.integration.applicationCommit}`); console.info(`CONTENT_COMMIT=${built.integration.contentCommit}`); console.info(`FIXTURE_SOURCE_COMMIT=${built.integration.fixtureSourceCommit}`);
  } finally { await built.cleanup(); }
});

test("production source cannot import the cross-repository harness or its generated test artifacts", () => {
  const runtime = files("src").filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(runtime, /integration\/contracts|algorithms-content\/harness|cross-repo-fixture|tests\/fixtures/);
  const harness = readFileSync("integration/contracts/algorithms-content/harness.mjs", "utf8"); assert.doesNotMatch(harness, /sourceRepositoryCommit:\s*["']a{40}["']/);
});
