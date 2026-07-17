import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  assertSessionMatchesBundledTrack,
  createContentSessionPlanFingerprint,
  validateBundledContent,
} from "../src/content/application";
import { getAlgorithmContentCatalog } from "../src/content/catalogRepository";
import type { BundledContentRelease, PublishedAlgorithmsBank } from "../src/content/contracts";
import { validateAlgorithmsBank } from "../src/content/validation";
import { createTrainingSession } from "../src/domain";
import { contentHasher } from "../src/infrastructure/identity/contentHasher";
import { prepareAlgorithmsInterviewSimulation } from "../src/tracks/algorithms";

const commit = "1".repeat(40);
const itemIds = Array.from({ length: 40 }, (_, index) => `contract-item-${index + 1}`);

function bank(input: Readonly<{ itemCount?: number; interaction?: "choice" | "unsupported"; taxonomyId?: string; taxonomy?: Readonly<Record<string, unknown>>; approval?: string; duplicateId?: boolean; poolCount?: number }> = {}): PublishedAlgorithmsBank {
  const count = input.itemCount ?? 40;
  const items = Array.from({ length: count }, (_, index) => ({
    id: input.duplicateId && index === 1 ? "contract-item-1" : `contract-item-${index + 1}`,
    prompt: `Mechanical contract assertion ${index + 1}`,
    feedback: { reason: "Declared evidence supports the answer.", details: "This payload exists only to exercise the consumer contract.", wrongOptionExplanationsByOptionId: { wrong: "It contradicts the declared evidence." } },
    taxonomy: { roadmapNodeId: input.taxonomyId ?? "arrays_and_strings", primaryMentalUnitId: "reason_about_indexed_scans", patternFamilyId: "arrays_and_strings", primarySkillAtomId: "track_index_boundary", secondarySkillAtomIds: [], learningStage: "foundations", ...input.taxonomy },
    provenance: { author: "contract-test", createdAt: "2026-07-17T00:00:00.000Z", contentBatchId: "contract-test", authoringMethod: "independently_authored" as const, externalSources: [] },
    compatibilityMemberships: [],
    itemFingerprint: `${index + 1}`.padStart(64, "0"),
    interaction: input.interaction === "unsupported" ? { type: "unsupported" } : { type: "choice" as const, selectionMode: "single" as const, options: [{ id: "correct", text: "Correct" }, { id: "wrong", text: "Wrong" }], acceptedOptionIds: ["correct"] },
    scoringContract: { type: "choice" as const, resultSemantics: "exact_selected_set_with_partial_v1" as const },
  }));
  const resolvedItemIds = items.map((item) => item.id);
  const poolItemIds = resolvedItemIds.slice(0, input.poolCount ?? count);
  return {
    formatVersion: 1, trackId: "algorithms", familyId: "algorithms", contentVersion: "algorithms-contract-v1", items: items as PublishedAlgorithmsBank["items"], approvalActivationIdentity: input.approval ?? "approval:contract-v1",
    practiceBlueprints: [{ blueprintId: "interview", blueprintVersion: "1", modeId: "algorithms-interview-simulation", requestedLengths: [40], defaultRequestedLength: 40, shortening: "prohibited", minimumActualLength: 40, composition: { kind: "simulation_pool", ids: ["interview-pool"] }, resolvedItemIds }],
    recognitionSets: [], contrastSets: [], interleavedScopes: [], compatibilitySets: [],
    simulationPools: [{ poolId: "interview-pool", poolVersion: "1", itemIds: poolItemIds }],
    simulationProfiles: [{ profileId: "interview-profile", profileVersion: "1", profileKind: "internal_learning_profile", totalOccurrences: 40, foregroundDurationMs: 2_700_000, poolId: "interview-pool", distributions: [], selectionPolicy: { uniqueItems: true, replacement: false, deterministic: true, algorithmVersion: "sha256-ranked-constraints-v1" } }],
  };
}

const taxonomyManifest = { formatVersion: 1 as const, trackId: "algorithms", familyId: "algorithms", contentVersion: "algorithms-contract-v1", itemCount: 40, bankPath: "algorithms.json", sha256: "0".repeat(64) };

test("validates explicit Algorithms hierarchy links and rejects every broken child relation", () => {
  assert.doesNotThrow(() => validateAlgorithmsBank(bank(), taxonomyManifest));
  const cases: readonly [string, Readonly<Record<string, unknown>>, string][] = [
    ["mental node", { primaryMentalUnitId: "recognize_binary_search_signal" }, "mental_unit_outside_roadmap_node"],
    ["family", { patternFamilyId: "binary_search", primarySkillAtomId: "identify_monotonic_predicate", learningStage: "foundations" }, "pattern_family_outside_mental_unit"],
    ["variant", { patternVariantId: "fixed_size_window" }, "variant_outside_pattern_family"],
    ["archetype", { problemArchetypeId: "find_index_in_sorted_input" }, "archetype_outside_mental_unit"],
    ["primary skill", { primarySkillAtomId: "identify_monotonic_predicate" }, "primary_skill_outside_mental_unit"],
    ["secondary skill", { secondarySkillAtomIds: ["identify_monotonic_predicate"] }, "secondary_skill_outside_mental_unit"],
  ];
  for (const [label, taxonomy, code] of cases) assert.throws(() => validateAlgorithmsBank(bank({ taxonomy }), taxonomyManifest), new RegExp(code), label);
  const contrast = bank();
  const legalContrast = { ...contrast, contrastSets: [{ setId: "binary-vs-scan", setVersion: "1", primaryMentalUnitId: "contrast_binary_search_vs_linear_scan", contrastedMentalUnitIds: ["reason_about_indexed_scans"], falseHeuristicId: "fixture", transferBoundary: "fixture", itemIds: contrast.items.map((item) => item.id) }] };
  assert.doesNotThrow(() => validateAlgorithmsBank(legalContrast, taxonomyManifest));
  const illegalContrast = { ...legalContrast, contrastSets: [{ ...legalContrast.contrastSets[0]!, primaryMentalUnitId: "reason_about_indexed_scans" }] };
  assert.throws(() => validateAlgorithmsBank(illegalContrast, taxonomyManifest), /illegal_contrast_mapping/);
});

async function release(input: Readonly<{ artifactBank?: unknown; declaredModes?: readonly string[]; checksum?: string; schemaVersion?: string; contentVersion?: string; taxonomyVersion?: string; approvalItemIds?: readonly string[] }> = {}): Promise<BundledContentRelease> {
  const payload = input.artifactBank ?? bank();
  const bytes = JSON.stringify({ envelopeVersion: 1, schemaVersion: input.schemaVersion ?? "published-bank-v1", contentVersion: input.contentVersion ?? "algorithms-contract-v1", taxonomyVersion: input.taxonomyVersion ?? "algorithms-taxonomy-v1", bank: payload });
  const actualChecksum = await contentHasher.sha256(bytes);
  const ids = (payload as PublishedAlgorithmsBank).items?.map((item) => item.id) ?? [];
  return {
    manifest: { envelopeVersion: 1, releaseId: "contract-cutover", sourceRepositoryCommit: commit },
    artifacts: [{ trackId: "algorithms", familyId: "algorithms", contentVersion: "algorithms-contract-v1", taxonomyVersion: "algorithms-taxonomy-v1", schemaVersion: "published-bank-v1", checksumSha256: input.checksum ?? actualChecksum, sourceRepositoryCommit: commit, approvalCoverage: { identity: "approval:contract-v1", itemIds: input.approvalItemIds ?? ids }, declaredModes: input.declaredModes ?? ["algorithms-interview-simulation"], artifactBytes: bytes }],
  };
}

function track(result: Awaited<ReturnType<typeof validateBundledContent>>, id: string) {
  const projection = result.tracks.find((candidate) => candidate.trackId === id);
  assert.ok(projection, `missing ${id} projection`);
  return projection;
}

test("consumes a canonical, track-scoped Algorithms artifact while Certification remains unavailable", async () => {
  const result = await validateBundledContent(await release());
  assert.equal(track(result, "algorithms").kind, "available");
  const certification = track(result, "cloud-certification");
  assert.equal(certification.kind, "unavailable");
  if (certification.kind === "unavailable") assert.equal(certification.reason, "missing_artifact");
  assert.equal(getAlgorithmContentCatalog().getItems().length, 40);
  const prepared = await prepareAlgorithmsInterviewSimulation({ catalog: getAlgorithmContentCatalog(), contentVersion: "algorithms-contract-v1", taxonomyVersion: "algorithms-taxonomy-v1", profileId: "interview-profile", sessionId: "identity-bound-simulation", startedAt: "2026-07-17T00:00:00.000Z" });
  assert.equal(prepared.session.taxonomyVersion, "algorithms-taxonomy-v1");
  assert.match(prepared.session.planFingerprint ?? "", /^[a-f0-9]{64}$/);
});

test("projects missing, malformed, checksum, schema/version, approval, pool, interaction, and taxonomy failures per track", async () => {
  const missing = await validateBundledContent({ manifest: { envelopeVersion: 1, releaseId: "missing", sourceRepositoryCommit: commit }, artifacts: [] });
  assert.equal(track(missing, "algorithms").kind, "unavailable");
  const malformed = await validateBundledContent({ manifest: { envelopeVersion: 2, releaseId: "malformed", sourceRepositoryCommit: commit }, artifacts: [] });
  const malformedAlgorithms = track(malformed, "algorithms");
  if (malformedAlgorithms.kind === "unavailable") assert.equal(malformedAlgorithms.reason, "invalid_envelope");
  const cases: readonly [string, Promise<BundledContentRelease>, string][] = [
    ["checksum", release({ checksum: "0".repeat(64) }), "checksum_mismatch"],
    ["schema", release({ schemaVersion: "published-bank-v2" }), "schema_mismatch"],
    ["version", release({ contentVersion: "algorithms-contract-v2" }), "version_mismatch"],
    ["approval", release({ approvalItemIds: [] }), "missing_approval_coverage"],
    ["activation", release({ artifactBank: bank({ approval: "approval:other" }) }), "missing_approval_coverage"],
    ["pool", release({ artifactBank: bank({ poolCount: 39 }) }), "insufficient_fixed_pool"],
    ["interaction", release({ artifactBank: bank({ interaction: "unsupported" }) }), "unsupported_interaction"],
    ["taxonomy", release({ artifactBank: bank({ taxonomyId: "unknown-node" }) }), "invalid_taxonomy_reference"],
  ];
  for (const [label, candidate, reason] of cases) {
    const projection = track(await validateBundledContent(await candidate), "algorithms");
    assert.equal(projection.kind, "unavailable", label);
    if (projection.kind === "unavailable") assert.equal(projection.reason, reason, label);
  }
});

test("rejects duplicate identity, unsupported modes, and a session whose immutable content plan changed", async () => {
  const duplicate = track(await validateBundledContent(await release({ artifactBank: bank({ duplicateId: true }) })), "algorithms");
  assert.equal(duplicate.kind, "unavailable");
  const mode = track(await validateBundledContent(await release({ declaredModes: ["not-a-mode"] })), "algorithms");
  if (mode.kind === "unavailable") assert.equal(mode.reason, "declared_mode_unsupported");
  const available = track(await validateBundledContent(await release()), "algorithms");
  assert.equal(available.kind, "available");
  if (available.kind !== "available") return;
  const base = { id: "immutable-plan", trackId: "algorithms", modeId: "algorithms-interview-simulation", configurationSnapshot: { kind: "simulation" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "one", item: { trackId: "algorithms", contentVersion: "algorithms-contract-v1", itemId: "contract-item-1" } }], optionOrderByOccurrence: { one: ["correct", "wrong"] }, activeForegroundMs: 0, contentVersion: "algorithms-contract-v1", taxonomyVersion: "algorithms-taxonomy-v1", status: "active" as const, startedAt: "2026-07-17T00:00:00.000Z" };
  const session = createTrainingSession({ ...base, planFingerprint: await createContentSessionPlanFingerprint(base) });
  await assert.doesNotReject(() => assertSessionMatchesBundledTrack(session, available));
  await assert.rejects(() => assertSessionMatchesBundledTrack(createTrainingSession({ ...session, itemOrder: [{ ...session.itemOrder[0]!, item: { ...session.itemOrder[0]!.item, itemId: "contract-item-2" } }] }), available), /fingerprint/);
});

function files(root: string): readonly string[] { return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]); }

test("runtime has no network or test-fixture ingress and Algorithms has no legacy group/item contract", () => {
  const runtime = files("src").filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(runtime, /from\s+["'][^"']*(?:tests\/|fixtures)[^"']*["']/);
  assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|axios|HttpContentSource|loadTrackContent)\b/);
  const algorithms = files("src/tracks/algorithms").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(algorithms, /\bAlgorithmContentGroup\b|\bfeedbackModel\b|\bisCorrect\b|\bcorrectOrder\b|\bsubgoals\b|\bcorrectComplexity\b/);
  assert.doesNotMatch(algorithms, /ALGORITHMS_PRACTICE_BLUEPRINT|createAlgorithmsInterviewSimulationProfile/);
});
