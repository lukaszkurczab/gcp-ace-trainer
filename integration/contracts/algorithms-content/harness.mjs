import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { tmpdir } from "node:os";
import { promisify } from "node:util";

const exec = promisify(execFile);
const APP_ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const CONTENT_ROOT = process.env.PATTERNLY_CONTENT_ROOT ?? resolve(APP_ROOT, "../patternly-content");
const LOCK_PATH = join(APP_ROOT, "integration/contracts/algorithms-content/content.lock.json");
const MODES = ["algorithms-learn-approach", "algorithms-guided-practice", "algorithms-recognize-patterns", "algorithms-contrast-practice", "algorithms-weak-area-review", "algorithms-independent-practice", "algorithms-interview-simulation"];

export class CrossRepositoryContractError extends Error { constructor(code, message) { super(`${code}: ${message}`); this.code = code; } }
const sha = (value) => typeof value === "string" && /^[a-f0-9]{40}$/.test(value);
async function git(root, ...args) { return exec("git", args, { cwd: root }); }
async function gitHead(root, unavailableCode) { try { return (await git(root, "rev-parse", "HEAD")).stdout.trim(); } catch { throw new CrossRepositoryContractError(unavailableCode, `Git checkout is unavailable: ${root}`); } }
async function assertClean(root, label) { try { const status = (await git(root, "status", "--porcelain", "--untracked-files=all")).stdout.trim(); if (status) throw new CrossRepositoryContractError("DIRTY_INTEGRATION_INPUT", `${label} checkout is dirty: ${status}`); } catch (error) { if (error instanceof CrossRepositoryContractError) throw error; throw new CrossRepositoryContractError("CONTENT_CHECKOUT_UNAVAILABLE", `${label} checkout is unavailable: ${root}`); } }
async function readLock() { try { const lock = JSON.parse(await readFile(LOCK_PATH, "utf8")); if (lock?.schemaVersion !== 1 || lock.repository !== "lukaszkurczab/patternly-content" || !sha(lock.commit) || lock.taxonomyVersion !== "algorithms-taxonomy-v2" || !/^[a-f0-9]{64}$/.test(lock.taxonomyFingerprint) || lock.applicationContractSnapshot?.bankContract !== "PublishedAlgorithmsBank" || lock.applicationContractSnapshot?.artifactSchema !== "published-bank-v1") throw new Error("invalid"); return lock; } catch { throw new CrossRepositoryContractError("MISSING_CONTENT_LOCK", `Missing or invalid immutable content lock: ${LOCK_PATH}`); } }
function equalSnapshot(left, right) { return JSON.stringify(left) === JSON.stringify(right); }
export async function verifyCrossRepositoryInputs({ appRoot = APP_ROOT, contentRoot = CONTENT_ROOT } = {}) {
  const lock = await readLock(); const applicationCommit = await gitHead(appRoot, "CONTENT_CHECKOUT_UNAVAILABLE"); await assertClean(appRoot, "Application"); await assertClean(contentRoot, "Content"); const contentCommit = await gitHead(contentRoot, "CONTENT_CHECKOUT_UNAVAILABLE");
  if (contentCommit !== lock.commit) throw new CrossRepositoryContractError("INPUT_SHA_MISMATCH", `expectedContentCommit=${lock.commit}\nactualContentCommit=${contentCommit}`);
  const [producer, producerFixtures, producerSnapshot, appDescriptor, taxonomyExporter, appTaxonomy, taxonomyText] = await Promise.all([
    import(pathToFileURL(join(contentRoot, "scripts/publishing/pipeline.mjs")).href),
    import(pathToFileURL(join(contentRoot, "tests/fixtures/manualPublishingFixture.mjs")).href),
    import(pathToFileURL(join(contentRoot, "tests/fixtures/applicationContractSnapshot.mjs")).href),
    import(pathToFileURL(join(appRoot, "integration/contracts/algorithms-content/applicationContractDescriptor.ts")).href),
    import(pathToFileURL(join(contentRoot, "scripts/taxonomy/export-algorithms-taxonomy.mjs")).href),
    import(pathToFileURL(join(appRoot, "src/tracks/algorithms/generated/algorithmTaxonomyStructure.generated.ts")).href),
    readFile(join(contentRoot, "config/taxonomy/algorithms.json"), "utf8"),
  ]);
  const app = appDescriptor.APPLICATION_ALGORITHMS_CONTRACT_DESCRIPTOR;
  const producerContract = { artifactSchema: lock.applicationContractSnapshot.artifactSchema, bankContract: lock.applicationContractSnapshot.bankContract, bankRequiredKeys: [...producerSnapshot.APPLICATION_ALGORITHMS_BANK_KEYS].sort(), canonicalModeIds: [...producerSnapshot.APPLICATION_ALGORITHM_MODE_IDS].sort(), itemOptionalKeys: [...producerSnapshot.APPLICATION_ALGORITHMS_ITEM_OPTIONAL_KEYS].sort(), itemRequiredKeys: [...producerSnapshot.APPLICATION_ALGORITHMS_ITEM_KEYS].sort() };
  if (!equalSnapshot(app, producerContract)) throw new CrossRepositoryContractError("CONTRACT_SNAPSHOT_MISMATCH", "Producer snapshot differs from the current application contract descriptor.");
  const taxonomy = JSON.parse(taxonomyText);
  const contentStructuralPayload = taxonomyExporter.structuralPayload(taxonomy);
  const contentTaxonomyFingerprint = taxonomyExporter.taxonomyFingerprint(contentStructuralPayload);
  if (lock.taxonomyVersion !== taxonomy.taxonomyVersion || lock.taxonomyFingerprint !== contentTaxonomyFingerprint || appTaxonomy.taxonomyVersion !== lock.taxonomyVersion || appTaxonomy.taxonomyFingerprint !== lock.taxonomyFingerprint || !equalSnapshot(appTaxonomy.algorithmTaxonomyStructure, contentStructuralPayload)) throw new CrossRepositoryContractError("TAXONOMY_SNAPSHOT_MISMATCH", "Locked content taxonomy and generated application taxonomy differ.");
  return { applicationCommit, contentCommit, lock, producer, producerFixtures, producerImplementationCommit: lock.commit, taxonomyFingerprint: contentTaxonomyFingerprint, taxonomyVersion: taxonomy.taxonomyVersion };
}

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
  const binarySearch = index <= 20;
  return { ...base, taxonomy: { primarySkillAtomId: binarySearch ? "identify_legal_half_discard_rule" : "track_index_boundary", secondarySkillAtomIds: [], learningStage: binarySearch ? "pattern_mechanics" : "foundations" } };
}

function structures(ids) {
  const binarySearch = ids.slice(0, 20); const arrays = ids.slice(20); const all = [...ids];
  return {
    practiceBlueprints: [
      { blueprintId: "cross-learn", blueprintVersion: "v1", modeId: MODES[0], requestedLengths: [10], defaultRequestedLength: 10, shortening: "allowed", minimumActualLength: 5, composition: { kind: "item_ids", ids: binarySearch.slice(0, 10) } },
      { blueprintId: "cross-guided", blueprintVersion: "v1", modeId: MODES[1], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "allowed", minimumActualLength: 10, composition: { kind: "item_ids", ids: binarySearch } },
      { blueprintId: "cross-recognize", blueprintVersion: "v1", modeId: MODES[2], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "allowed", minimumActualLength: 10, composition: { kind: "recognition_sets", ids: ["cross-recognition"] } },
      { blueprintId: "cross-contrast", blueprintVersion: "v1", modeId: MODES[3], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "allowed", minimumActualLength: 10, composition: { kind: "contrast_sets", ids: ["cross-contrast"] } },
      { blueprintId: "cross-review", blueprintVersion: "v1", modeId: MODES[4], requestedLengths: [10, 20], defaultRequestedLength: 10, shortening: "allowed", minimumActualLength: 1, composition: { kind: "item_ids", ids: binarySearch.slice(0, 10) } },
      { blueprintId: "cross-independent", blueprintVersion: "v1", modeId: MODES[5], requestedLengths: [10, 20, 40], defaultRequestedLength: 20, shortening: "blueprint_controlled", minimumActualLength: 10, composition: { kind: "interleaved_scope", ids: ["cross-interleaved"] } },
      { blueprintId: "cross-simulation", blueprintVersion: "v1", modeId: MODES[6], requestedLengths: [40], defaultRequestedLength: 40, shortening: "prohibited", minimumActualLength: 40, composition: { kind: "simulation_pool", ids: ["cross-simulation-pool"] } },
    ],
    recognitionSets: [{ setId: "cross-recognition", setVersion: "v1", taxonomyScope: { roadmapNodeIds: ["binary_search"] }, legalLearningStages: ["pattern_mechanics"], itemIds: binarySearch }],
    contrastSets: [{ setId: "cross-contrast", setVersion: "v1", primaryMentalUnitId: "legal_half_discard_rule", contrastedMentalUnitIds: ["recognize_binary_search_signal", "reason_about_indexed_scans"], falseHeuristicId: "sorted_input_always_requires_binary_search", transferBoundary: "cross-fixture-boundary", itemIds: all }],
    interleavedScopes: [{ scopeId: "cross-interleaved", scopeVersion: "v1", mentalUnitIds: ["recognize_binary_search_signal", "reason_about_indexed_scans"], itemIds: all, legalLearningStages: ["foundations", "pattern_mechanics"], minimumDiversity: 2 }],
    compatibilitySets: [
      { id: "cross-symmetric", version: "v1", relation: "same_mechanism", direction: "symmetric", sourceItemIds: [ids[0], ids[1]], targetItemIds: [ids[1], ids[0]], relationMetadata: { mechanismBoundary: "binary_search" } },
      { id: "cross-directed", version: "v1", relation: "reviewed_variant", direction: "directed", sourceItemIds: [ids[2]], targetItemIds: [ids[3]], relationMetadata: { mechanismBoundary: "binary_search" } },
      { id: "cross-compatible-contrast", version: "v1", relation: "compatible_contrast", direction: "directed", sourceItemIds: [ids[0]], targetItemIds: [ids[20]], relationMetadata: { contrastSetId: "cross-contrast" } },
    ],
    simulationPools: [{ poolId: "cross-simulation-pool", poolVersion: "v1", itemIds: all }],
    simulationProfiles: [{ profileId: "cross-simulation-profile", profileVersion: "v1", profileKind: "internal_learning_profile", totalOccurrences: 40, foregroundDurationMs: 2700000, poolId: "cross-simulation-pool", distributions: [{ dimension: "primaryMentalUnitId", buckets: [{ valueId: "recognize_binary_search_signal", minimum: 20, target: 20, maximum: 20 }, { valueId: "reason_about_indexed_scans", minimum: 20, target: 20, maximum: 20 }] }, { dimension: "interactionType", buckets: [{ valueId: "choice", minimum: 38, target: 38, maximum: 38 }, { valueId: "ordering", minimum: 1, target: 1, maximum: 1 }, { valueId: "complexity", minimum: 1, target: 1, maximum: 1 }] }], selectionPolicy: { uniqueItems: true, replacement: false, deterministic: true, algorithmVersion: "sha256-ranked-constraints-v1" }, provenance: { authority: "patternly_product", approvedBy: "cross-repo-test", approvedAt: "2026-07-17T00:00:00.000Z", rationale: "Test-only contract fixture." } }],
  };
}

function batch(batchId, indexes, taxonomy, modeStructures) {
  return { schemaVersion: "algorithms-manual-source-v2", batchId, trackId: "algorithms", familyId: "algorithms", contentVersion: "cross-repo-fixture-v1", taxonomyVersion: "algorithms-taxonomy-v2", declaredModes: MODES, taxonomy, batchKind: "standard", authoringProvenance: { author: "cross-repo-test", createdAt: "2026-07-17T00:00:00.000Z", contentBatchId: batchId, authoringMethod: "independently_authored" }, items: indexes.map(item), modeStructures };
}

async function writeApprovalsAndActivation(root, inspected) {
  const approvalsByBatch = new Map();
  for (const evidence of inspected.source.technicalEvidence) {
    const approvalId = `cross-approval-${evidence.batchId}`; approvalsByBatch.set(evidence.batchId, approvalId);
    await writeJson(root, `manual/approvals/algorithms/${evidence.batchId}.json`, { approvalSchemaVersion: 1, approvalId, reviewKind: "editorial", batchId: evidence.batchId, familyId: "algorithms", trackId: "algorithms", primaryTaxonomyReference: "cross-repo", includedItems: Object.entries(evidence.itemFingerprints).sort(([a], [b]) => a === b ? 0 : a < b ? -1 : 1).map(([itemId, itemFingerprint]) => ({ itemId, itemFingerprint })), reviewer: "cross-repo-test", reviewDate: "2026-07-17", technicalValidationEvidenceId: evidence.evidenceId, factualAndEditorialDefectsFound: [], requiredCorrections: [], finalDisposition: "approved" });
  }
  const itemCoverage = inspected.source.items.map((entry) => {
    const owner = inspected.source.batches.find((candidate) => candidate.items.some((item) => item.id === entry.id));
    return { itemId: entry.id, itemFingerprint: entry.itemFingerprint, approvalId: approvalsByBatch.get(owner.batchId) };
  });
  await writeJson(root, "manual/activations/algorithms/cross-activation.json", { activationSchemaVersion: 1, activationId: "cross-activation", trackId: "algorithms", familyId: "algorithms", contentVersion: inspected.source.contentVersion, taxonomyVersion: inspected.source.taxonomyVersion, itemCoverage });
}

async function commitFixture(root, message) { await git(root, "add", "-A"); await git(root, "commit", "-m", message); return (await git(root, "rev-parse", "HEAD")).stdout.trim(); }
export async function buildCrossRepositoryAlgorithmsRelease() {
  const verifiedInputs = await verifyCrossRepositoryInputs(); const { producer, producerFixtures } = verifiedInputs;
  const root = await mkdtemp(join(tmpdir(), "algorithms-cross-repo-"));
  await producerFixtures.fixtureRoot(root, { approvals: false });
  try {
    await writeJson(root, "config/families/algorithms.json", { schemaVersion: "algorithms-family-config-v2", familyId: "algorithms", supportedInteractions: ["choice", "ordering", "complexity"], modeBlueprintRequirements: [{ modeId: MODES[0], defaultRequestedLength: 10, supportedRequestedLengths: [10], shortening: "allowed", minimumActualLength: 5, compositionKind: "item_ids" }, { modeId: MODES[1], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "allowed", minimumActualLength: 10, compositionKind: "item_ids" }, { modeId: MODES[2], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "allowed", minimumActualLength: 10, compositionKind: "recognition_sets" }, { modeId: MODES[3], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "allowed", minimumActualLength: 10, compositionKind: "contrast_sets" }, { modeId: MODES[4], defaultRequestedLength: 10, supportedRequestedLengths: [10, 20], shortening: "allowed", minimumActualLength: 1, compositionKind: "item_ids" }, { modeId: MODES[5], defaultRequestedLength: 20, supportedRequestedLengths: [10, 20, 40], shortening: "blueprint_controlled", minimumActualLength: 10, compositionKind: "interleaved_scope" }, { modeId: MODES[6], defaultRequestedLength: 40, supportedRequestedLengths: [40], shortening: "prohibited", minimumActualLength: 40, compositionKind: "simulation_pool" }] });
    await writeJson(root, "config/taxonomy/algorithms.json", JSON.parse(await readFile(join(CONTENT_ROOT, "config/taxonomy/algorithms.json"), "utf8")));
    const ids = Array.from({ length: 40 }, (_, index) => `cross-repo-item-${index + 1}`); const modeStructures = structures(ids);
    await writeJson(root, "manual/source/algorithms/binary-search.json", batch("cross-binary-search", Array.from({ length: 20 }, (_, index) => index + 1), { roadmapNodeId: "binary_search", primaryMentalUnitId: "recognize_binary_search_signal", patternFamilyId: "binary_search" }, modeStructures));
    await writeJson(root, "manual/source/algorithms/arrays.json", batch("cross-arrays", Array.from({ length: 20 }, (_, index) => index + 21), { roadmapNodeId: "arrays_and_strings", primaryMentalUnitId: "reason_about_indexed_scans", patternFamilyId: "arrays_and_strings" }, { practiceBlueprints: [], recognitionSets: [], contrastSets: [], interleavedScopes: [], compatibilitySets: [], simulationPools: [], simulationProfiles: [] }));
    await git(root, "init"); await git(root, "config", "user.email", "cross-repo@example.test"); await git(root, "config", "user.name", "Cross Repository Fixture");
    const technicalInputCommit = await commitFixture(root, "technical inputs"); const inspection = await producer.inspectTrack({ root, trackId: "algorithms" }); const evidence = await producer.emitTechnicalEvidence({ root, trackId: "algorithms" }); const technicalEvidenceCommit = await commitFixture(root, "technical evidence");
    const approvedInspection = await producer.inspectTrack({ root, trackId: "algorithms" }); await writeApprovalsAndActivation(root, approvedInspection); const approvalsActivationCommit = await commitFixture(root, "approvals and activation");
    const validated = await producer.validateTrack({ root, trackId: "algorithms" }); const built = await producer.buildTrack({ root, trackId: "algorithms", outputRoot: join(root, "out") }); const verified = await producer.verifyArtifact(built.path); const finalReleaseCommit = await gitHead(root, "CROSS_REPO_ROUND_TRIP_FAILED");
    if (verified.sourceRepositoryCommit !== finalReleaseCommit) throw new CrossRepositoryContractError("CROSS_REPO_ROUND_TRIP_FAILED", "Artifact does not bind the final clean fixture commit.");
    return { root, inspection, evidence, validated, artifact: verified, release: { manifest: { envelopeVersion: 1, releaseId: "cross-repo-fixture-release", sourceRepositoryCommit: finalReleaseCommit }, artifacts: [verified] }, integration: { ...verifiedInputs, technicalInputCommit, technicalEvidenceCommit, approvalsActivationCommit, finalReleaseCommit, fixtureSourceCommit: finalReleaseCommit }, cleanup: () => rm(root, { recursive: true, force: true }) };
  } catch (error) { await rm(root, { recursive: true, force: true }); throw error; }
}

export const CROSS_REPOSITORY_ALGORITHMS_MODES = Object.freeze([...MODES]);
