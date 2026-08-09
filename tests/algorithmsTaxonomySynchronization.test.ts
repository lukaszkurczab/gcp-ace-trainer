import assert from "node:assert/strict";
import test from "node:test";

import { ALGORITHM_MENTAL_UNIT_BY_ID } from "../src/tracks/coding-interview/algorithmMentalUnits";
import { ALGORITHM_ROADMAP, validateAlgorithmRoadmap } from "../src/tracks/coding-interview/algorithmRoadmap";
import { ALGORITHM_ROADMAP_PRESENTATION } from "../src/tracks/coding-interview/algorithmRoadmapPresentation";
import { algorithmTaxonomyStructure, taxonomyFingerprint, taxonomyVersion } from "../src/tracks/coding-interview/generated/algorithmTaxonomyStructure.generated";

test("Algorithms presentation metadata covers exactly the generated structural roadmap", () => {
  const structuralNodeIds = algorithmTaxonomyStructure.roadmapNodes.map((node) => node.id).sort();
  assert.deepEqual(Object.keys(ALGORITHM_ROADMAP_PRESENTATION).sort(), structuralNodeIds);
  assert.equal(validateAlgorithmRoadmap(ALGORITHM_ROADMAP).valid, true);
  assert.equal(algorithmTaxonomyStructure.roadmapNodes.length, 26);
  assert.equal(algorithmTaxonomyStructure.patternFamilies.length, 21);
  assert.equal(taxonomyVersion, "algorithms-taxonomy-v2");
  assert.equal(taxonomyFingerprint, "ec4a6874714e907299366412613dd1725a777964855be44d59769824bcccc046");
});

test("Algorithms runtime derives roadmap parent relationships and mental units from the generated SOT", () => {
  assert.deepEqual(
    ALGORITHM_ROADMAP.nodes.map((node) => ({
      id: node.id,
      learningStage: node.learningStage,
      order: node.order,
      prerequisiteNodeIds: node.prerequisiteNodeIds,
      primaryPatternFamilyId: node.primaryPatternFamilyId,
    })),
    algorithmTaxonomyStructure.roadmapNodes.map((node) => ({
      id: node.id,
      learningStage: node.defaultLearningStage,
      order: node.order,
      prerequisiteNodeIds: node.prerequisiteNodeIds,
      primaryPatternFamilyId: "primaryPatternFamilyId" in node ? node.primaryPatternFamilyId : undefined,
    })),
  );
  assert.equal(ALGORITHM_MENTAL_UNIT_BY_ID.has("arrays_and_strings"), false);
  assert.equal(ALGORITHM_MENTAL_UNIT_BY_ID.get("reason_about_indexed_scans")?.roadmapNodeId, "arrays_and_strings");
});
