import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { tmpdir } from "node:os";

const CONTENT_ROOT = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(process.cwd(), "../patternly-content");
const PRODUCER_COMMIT = "a".repeat(40);
const MODES = ["algorithms-learn-approach", "algorithms-guided-practice", "algorithms-recognize-patterns", "algorithms-contrast-practice", "algorithms-weak-area-review", "algorithms-independent-practice", "algorithms-interview-simulation"];
const producer = await import(pathToFileURL(join(CONTENT_ROOT, "scripts/publishing/pipeline.mjs")).href);
const producerFixtures = await import(pathToFileURL(join(CONTENT_ROOT, "tests/fixtures/manualPublishingFixture.mjs")).href);

async function writeJson(root, relativePath, value) {
  const path = join(root, relativePath);
  await mkdir(resolve(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

function choice(index, multiple = false) {
  const acceptedOptionIds = multiple ? ["keep", "also-keep"] : ["keep"];
  return {
    id: `cross-repo-item-${index}`, prompt: multiple ? "Choose all valid fixture invariants." : "Choose the valid fixture invariant.",
    interaction: { type: "choice", selectionMode: multiple ? "multiple" : "single", options: multiple ? [{ id: "keep", text: "Keep invariant" }, { id: "also-keep", text: "Keep supporting invariant" }, { id: "discard", text: "Discard invariant" }] : [{ id: "keep", text: "Keep invariant" }, { id: "discard", text: "Discard invariant" }], acceptedOptionIds },
    scoringContract: { type: "choice", resultSemantics: "exact_selected_set_with_partial_v1" },
    feedback: { reason: "Fixture reason.", details: "Fixture details.", wrongOptionExplanationsByOptionId: { discard: "The invariant must be preserved." }, ...(multiple ? { omittedCorrectExplanationsByOptionId: { keep: "Keep the primary invariant.", "also-keep": "Keep the supporting invariant." } } : {}) },
  };
}

function ordering(index) {
  return { id: `cross-repo-item-${index}`, prompt: "Order the fixture steps.", interaction: { type: "ordering", elements: [{ id: "first", text: "First" }, { id: "second", text: "Second" }], canonicalOrder: ["first", "second"], scoringMethod: "adjacent_relations" }, scoringContract: { type: "ordering", maxPoints: 1 }, feedback: { reason: "Fixture reason.", details: "Fixture details." } };
}

function complexity(index) {
  return { id: `cross-repo-item-${index}`, prompt: "Select the fixture time complexity.", interaction: { type: "complexity", checkedDimensions: ["time"], availableValuesByDimension: { time: ["O(n)", "O(n2)"] }, acceptedValuesByDimension: { time: ["O(n)"] }, normalizedAliasesByDimension: { time: {} }, maxPoints: 1 }, scoringContract: { type: "complexity", maxPoints: 1 }, feedback: { reason: "Fixture reason.", details: "Fixture details." } };
}

function item(index) {
  const base = index === 3 ? ordering(index) : index === 4 ? complexity(index) : choice(index, index === 2);
  const arrays = index <= 20;
  return { ...base, taxonomy: { primarySkillAtomId: arrays ? "track_index_boundary" : "derive_time_complexity", secondarySkillAtomIds: [], learningStage: "foundations" } };
}

function structures(ids) {
  const arrays = ids.slice(0, 20); const complexity = ids.slice(20); const all = [...ids];
  return {
    practiceBlueprints: [
      { blueprintId: "cross-learn", blueprintVersion: "v1", modeId: MODES[0], requestedLengths: [10], defaultRequestedLength: 10, shortening: "allowed", minimumActualLength: 5, composition: { kind: "item_ids", ids: arrays.slice(0, 10) } },
      { blueprintId: "cross-guided", blueprintVersion: "v1", modeId: MODES[1], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "allowed", minimumActualLength: 10, composition: { kind: "item_ids", ids: arrays } },
      { blueprintId: "cross-recognize", blueprintVersion: "v1", modeId: MODES[2], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "allowed", minimumActualLength: 10, composition: { kind: "recognition_sets", ids: ["cross-recognition"] } },
      { blueprintId: "cross-contrast", blueprintVersion: "v1", modeId: MODES[3], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "allowed", minimumActualLength: 10, composition: { kind: "contrast_sets", ids: ["cross-contrast"] } },
      { blueprintId: "cross-review", blueprintVersion: "v1", modeId: MODES[4], requestedLengths: [10, 20], defaultRequestedLength: 10, shortening: "allowed", minimumActualLength: 1, composition: { kind: "item_ids", ids: arrays.slice(0, 10) } },
      { blueprintId: "cross-independent", blueprintVersion: "v1", modeId: MODES[5], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "blueprint_controlled", minimumActualLength: 10, composition: { kind: "interleaved_scope", ids: ["cross-interleaved"] } },
      { blueprintId: "cross-simulation", blueprintVersion: "v1", modeId: MODES[6], requestedLengths: [40], defaultRequestedLength: 40, shortening: "prohibited", minimumActualLength: 40, composition: { kind: "simulation_pool", ids: ["cross-simulation-pool"] } },
    ],
    recognitionSets: [{ setId: "cross-recognition", setVersion: "v1", taxonomyScope: { roadmapNodeIds: ["arrays_and_strings"] }, legalLearningStages: ["foundations"], itemIds: arrays }],
    contrastSets: [{ setId: "cross-contrast", setVersion: "v1", primaryMentalUnitId: "arrays_and_strings", contrastedMentalUnitIds: ["complexity_and_constraints"], falseHeuristicId: "cross-false-heuristic", transferBoundary: "cross-fixture-boundary", itemIds: all }],
    interleavedScopes: [{ scopeId: "cross-interleaved", scopeVersion: "v1", mentalUnitIds: ["arrays_and_strings", "complexity_and_constraints"], itemIds: all, legalLearningStages: ["foundations"], minimumDiversity: 2 }],
    compatibilitySets: [
      { id: "cross-symmetric", version: "v1", relation: "same_mechanism", direction: "symmetric", sourceItemIds: [ids[0], ids[1]], targetItemIds: [ids[1], ids[0]], relationMetadata: { mechanismBoundary: "arrays_and_strings" } },
      { id: "cross-directed", version: "v1", relation: "reviewed_variant", direction: "directed", sourceItemIds: [ids[2]], targetItemIds: [ids[3]], relationMetadata: { mechanismBoundary: "arrays_and_strings" } },
      { id: "cross-compatible-contrast", version: "v1", relation: "compatible_contrast", direction: "directed", sourceItemIds: [ids[0]], targetItemIds: [ids[20]], relationMetadata: { contrastSetId: "cross-contrast" } },
    ],
    simulationPools: [{ poolId: "cross-simulation-pool", poolVersion: "v1", itemIds: all }],
    simulationProfiles: [{ profileId: "cross-simulation-profile", profileVersion: "v1", profileKind: "internal_learning_profile", totalOccurrences: 40, foregroundDurationMs: 2700000, poolId: "cross-simulation-pool", distributions: [], selectionPolicy: { uniqueItems: true, replacement: false, deterministic: true, algorithmVersion: "sha256-ranked-constraints-v1" }, provenance: { authority: "patternly_product", approvedBy: "cross-repo-test", approvedAt: "2026-07-17T00:00:00.000Z", rationale: "Test-only contract fixture." } }],
  };
}

function batch(batchId, indexes, taxonomy, modeStructures) {
  return { schemaVersion: "algorithms-manual-source-v2", batchId, trackId: "algorithms", familyId: "algorithms", contentVersion: "cross-repo-fixture-v1", taxonomyVersion: "algorithms-taxonomy-v2", declaredModes: MODES, taxonomy, batchKind: "standard", authoringProvenance: { author: "cross-repo-test", createdAt: "2026-07-17T00:00:00.000Z", contentBatchId: batchId, authoringMethod: "independently_authored" }, items: indexes.map(item), modeStructures };
}

async function writeApprovalsAndActivation(root, inspected) {
  const approvalsByBatch = new Map();
  for (const evidence of inspected.source.technicalEvidence) {
    const approvalId = `cross-approval-${evidence.batchId}`; approvalsByBatch.set(evidence.batchId, approvalId);
    await writeJson(root, `manual/approvals/algorithms/${evidence.batchId}.json`, { approvalSchemaVersion: 1, approvalId, reviewKind: "editorial", batchId: evidence.batchId, familyId: "algorithms", trackId: "algorithms", primaryTaxonomyReference: "cross-repo", includedItems: Object.entries(evidence.itemFingerprints).sort(([a], [b]) => a.localeCompare(b)).map(([itemId, itemFingerprint]) => ({ itemId, itemFingerprint })), reviewer: "cross-repo-test", reviewDate: "2026-07-17", technicalValidationEvidenceId: evidence.evidenceId, factualAndEditorialDefectsFound: [], requiredCorrections: [], finalDisposition: "approved" });
  }
  const itemCoverage = inspected.source.items.map((entry) => {
    const owner = inspected.source.batches.find((candidate) => candidate.items.some((item) => item.id === entry.id));
    return { itemId: entry.id, itemFingerprint: entry.itemFingerprint, approvalId: approvalsByBatch.get(owner.batchId) };
  });
  await writeJson(root, "manual/activations/algorithms/cross-activation.json", { activationSchemaVersion: 1, activationId: "cross-activation", trackId: "algorithms", familyId: "algorithms", contentVersion: inspected.source.contentVersion, taxonomyVersion: inspected.source.taxonomyVersion, itemCoverage });
}

export async function buildCrossRepositoryAlgorithmsRelease() {
  const root = await mkdtemp(join(tmpdir(), "algorithms-cross-repo-"));
  await producerFixtures.fixtureRoot(root, { approvals: false });
  try {
    await writeJson(root, "config/families/algorithms.json", { schemaVersion: "algorithms-family-config-v2", familyId: "algorithms", supportedInteractions: ["choice", "ordering", "complexity"], modeBlueprintRequirements: [{ modeId: MODES[0], defaultRequestedLength: 10, supportedRequestedLengths: [10], shortening: "allowed", minimumActualLength: 5, compositionKind: "item_ids" }, { modeId: MODES[1], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "allowed", minimumActualLength: 10, compositionKind: "item_ids" }, { modeId: MODES[2], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "allowed", minimumActualLength: 10, compositionKind: "recognition_sets" }, { modeId: MODES[3], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "allowed", minimumActualLength: 10, compositionKind: "contrast_sets" }, { modeId: MODES[4], defaultRequestedLength: 10, supportedRequestedLengths: [10, 20], shortening: "allowed", minimumActualLength: 1, compositionKind: "item_ids" }, { modeId: MODES[5], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "blueprint_controlled", minimumActualLength: 10, compositionKind: "interleaved_scope" }, { modeId: MODES[6], defaultRequestedLength: 40, supportedRequestedLengths: [40], shortening: "prohibited", minimumActualLength: 40, compositionKind: "simulation_pool" }] });
    await writeJson(root, "config/taxonomy/algorithms.json", { schemaVersion: "algorithms-taxonomy-v2", trackId: "algorithms", taxonomyVersion: "algorithms-taxonomy-v2", roadmapNodes: [{ id: "arrays_and_strings" }, { id: "complexity_and_constraints" }], mentalUnits: [{ id: "arrays_and_strings", roadmapNodeId: "arrays_and_strings" }, { id: "complexity_and_constraints", roadmapNodeId: "complexity_and_constraints" }], patternFamilies: [{ id: "arrays_and_strings", primaryMentalUnitId: "arrays_and_strings" }, { id: "complexity_and_constraints", primaryMentalUnitId: "complexity_and_constraints" }], patternVariants: [], problemArchetypes: [], skillAtoms: [{ id: "track_index_boundary", primaryMentalUnitId: "arrays_and_strings" }, { id: "derive_time_complexity", primaryMentalUnitId: "complexity_and_constraints" }], falseHeuristics: [{ id: "cross-false-heuristic" }] });
    const ids = Array.from({ length: 40 }, (_, index) => `cross-repo-item-${index + 1}`); const modeStructures = structures(ids);
    await writeJson(root, "manual/source/algorithms/arrays.json", batch("cross-arrays", Array.from({ length: 20 }, (_, index) => index + 1), { roadmapNodeId: "arrays_and_strings", primaryMentalUnitId: "arrays_and_strings", patternFamilyId: "arrays_and_strings" }, modeStructures));
    await writeJson(root, "manual/source/algorithms/complexity.json", batch("cross-complexity", Array.from({ length: 20 }, (_, index) => index + 21), { roadmapNodeId: "complexity_and_constraints", primaryMentalUnitId: "complexity_and_constraints", patternFamilyId: "complexity_and_constraints" }, { practiceBlueprints: [], recognitionSets: [], contrastSets: [], interleavedScopes: [], compatibilitySets: [], simulationPools: [], simulationProfiles: [] }));
    const inspection = await producer.inspectTrack({ root, trackId: "algorithms", sourceRepositoryCommit: PRODUCER_COMMIT });
    const evidence = await producer.emitTechnicalEvidence({ root, trackId: "algorithms", sourceRepositoryCommit: PRODUCER_COMMIT });
    const approvedInspection = await producer.inspectTrack({ root, trackId: "algorithms", sourceRepositoryCommit: PRODUCER_COMMIT }); await writeApprovalsAndActivation(root, approvedInspection);
    const validated = await producer.validateTrack({ root, trackId: "algorithms", sourceRepositoryCommit: PRODUCER_COMMIT });
    const built = await producer.buildTrack({ root, trackId: "algorithms", outputRoot: join(root, "out"), sourceRepositoryCommit: PRODUCER_COMMIT }); const verified = await producer.verifyArtifact(built.path);
    return { root, inspection, evidence, validated, artifact: verified, release: { manifest: { envelopeVersion: 1, releaseId: "cross-repo-fixture-release", sourceRepositoryCommit: PRODUCER_COMMIT }, artifacts: [verified] }, cleanup: () => rm(root, { recursive: true, force: true }) };
  } catch (error) { await rm(root, { recursive: true, force: true }); throw error; }
}

export const CROSS_REPOSITORY_ALGORITHMS_MODES = Object.freeze([...MODES]);
