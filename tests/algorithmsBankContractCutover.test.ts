import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import type { PublishedAlgorithmsBank } from "../src/content/contracts";
import { validateAlgorithmsBank } from "../src/content/validation";
import { submitAlgorithmInteraction } from "../src/tracks/coding-interview";

function bank(input: Readonly<{ itemCount?: number; interaction?: "choice" | "unsupported"; taxonomyId?: string; taxonomy?: Readonly<Record<string, unknown>>; duplicateId?: boolean; poolCount?: number }> = {}): PublishedAlgorithmsBank {
  const count = input.itemCount ?? 40;
  const items = Array.from({ length: count }, (_, index) => ({
    id: input.duplicateId && index === 1 ? "contract-item-1" : `contract-item-${index + 1}`,
    prompt: `Mechanical contract assertion ${index + 1}`,
    feedback: { reason: "Declared evidence supports the answer.", details: { blocks: [{ type: "paragraph", text: "This payload exists only to exercise the consumer contract." }] }, wrongOptionExplanationsByOptionId: { wrong: "It contradicts the declared evidence." } },
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
    formatVersion: 1, trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", contentVersion: "algorithms-contract-v1", feedbackAssets: [], items: items as PublishedAlgorithmsBank["items"],
    practiceBlueprints: [{ blueprintId: "interview", blueprintVersion: "1", modeId: "coding-interview-simulation", requestedLengths: [40], defaultRequestedLength: 40, shortening: "prohibited", minimumActualLength: 40, composition: { kind: "simulation_pool", ids: ["interview-pool"] }, resolvedItemIds }],
    recognitionSets: [], contrastSets: [], interleavedScopes: [], compatibilitySets: [],
    simulationPools: [{ poolId: "interview-pool", poolVersion: "1", itemIds: poolItemIds }],
    simulationProfiles: [{ profileId: "interview-profile", profileVersion: "1", profileKind: "internal_learning_profile", totalOccurrences: 40, foregroundDurationMs: 2_700_000, poolId: "interview-pool", distributions: [], selectionPolicy: { uniqueItems: true, replacement: false, deterministic: true, algorithmVersion: "sha256-ranked-constraints-v1" } }],
  };
}

const taxonomyManifest = { formatVersion: 1 as const, trackId: "coding-interview-dsa-problem-solving", familyId: "coding_interview", contentVersion: "algorithms-contract-v1", itemCount: 40, bankPath: "algorithms.json", sha256: "0".repeat(64) };

test("validates explicit Algorithms hierarchy links and rejects every broken child relation", () => {
  assert.doesNotThrow(() => validateAlgorithmsBank(bank(), taxonomyManifest));
  const cases: readonly [string, Readonly<Record<string, unknown>>, string][] = [
    ["mental node", { primaryMentalUnitId: "recognize_binary_search_signal" }, "mental_unit_outside_roadmap_node"],
    ["family", { patternFamilyId: "binary_search", primarySkillAtomId: "identify_monotonic_predicate", learningStage: "foundations" }, "pattern_family_outside_mental_unit"],
    ["variant", { patternVariantId: "fixed_size_window" }, "variant_outside_mental_unit_or_pattern_family"],
    ["archetype", { problemArchetypeId: "find_index_in_sorted_input" }, "archetype_outside_mental_unit_or_pattern_family"],
    ["primary skill", { primarySkillAtomId: "identify_monotonic_predicate" }, "primary_skill_outside_mental_unit"],
    ["secondary skill", { secondarySkillAtomIds: ["identify_monotonic_predicate"] }, "secondary_skill_outside_mental_unit"],
  ];
  for (const [label, taxonomy, code] of cases) assert.throws(() => validateAlgorithmsBank(bank({ taxonomy }), taxonomyManifest), new RegExp(code), label);
  const contrast = bank();
  const legalContrast = { ...contrast, contrastSets: [{ setId: "binary-vs-scan", setVersion: "1", primaryMentalUnitId: "legal_half_discard_rule", contrastedMentalUnitIds: ["reason_about_indexed_scans"], falseHeuristicId: "sorted_input_always_requires_binary_search", transferBoundary: "fixture", itemIds: contrast.items.map((item) => item.id) }] };
  assert.doesNotThrow(() => validateAlgorithmsBank(legalContrast, taxonomyManifest));
  const illegalContrast = { ...legalContrast, contrastSets: [{ ...legalContrast.contrastSets[0]!, primaryMentalUnitId: "reason_about_indexed_scans" }] };
  assert.throws(() => validateAlgorithmsBank(illegalContrast, taxonomyManifest), /illegal_contrast_mapping/);
});

test("rejects former string Details, unsupported rich blocks, and unregistered image assets", () => {
  const details = bank().items[0]!.feedback.details;
  const cases: readonly [string, unknown][] = [
    ["former string", "Details as a plain string"],
    ["raw HTML", { blocks: [{ type: "html", html: "<p>Unsafe</p>" }] }],
    ["unknown code language", { blocks: [{ type: "code", language: "javascript", code: "return 1" }] }],
    ["external image", { blocks: [{ type: "image", assetId: "https://example.test/image.png", alt: "Remote" }] }],
    ["unregistered local image", { blocks: [{ type: "image", assetId: "algorithms/example", alt: "Missing local asset" }] }],
  ];
  for (const [label, invalid] of cases) {
    const candidate = bank();
    const item = candidate.items[0]!;
    assert.throws(() => validateAlgorithmsBank({ ...candidate, items: [{ ...item, feedback: { ...item.feedback, details: invalid as typeof details } }, ...candidate.items.slice(1)] }, taxonomyManifest), /feedback|unsupported|asset/i, label);
  }
});

test("uses mandatory Details when a single-choice response omits the correct option without an optional specific explanation", () => {
  const item = bank({ itemCount: 1 }).items[0]!;
  const submitted = submitAlgorithmInteraction({ question: item, response: { kind: "choice", selectedOptionIds: ["wrong"] } });
  assert.deepEqual(submitted.feedback.omittedCorrectOptionExplanations, [{ optionId: "correct", text: "This payload exists only to exercise the consumer contract." }]);
});

function files(root: string): readonly string[] { return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? files(join(root, entry.name)) : [join(root, entry.name)]); }

test("runtime has no network or test-fixture ingress and Algorithms has no legacy group/item contract", () => {
  const runtime = files("src").filter((path) => /\.(ts|tsx)$/.test(path)
    && !path.endsWith("content/bundled/generatedFreeNodePackages.ts")
    && !path.endsWith("infrastructure/clients/AccountAuthClientAdapter.ts"))
    .map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(runtime, /from\s+["'][^"']*(?:tests\/|fixtures)[^"']*["']/);
  assert.doesNotMatch(runtime, /\b(?:fetch|XMLHttpRequest|axios|HttpContentSource|loadTrackContent)\b/);
  const algorithms = files("src/tracks/coding-interview").map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(algorithms, /\bAlgorithmContentGroup\b|\bfeedbackModel\b|\bisCorrect\b|\bcorrectOrder\b|\bsubgoals\b|\bcorrectComplexity\b/);
  assert.doesNotMatch(algorithms, /ALGORITHMS_PRACTICE_BLUEPRINT|createAlgorithmsInterviewSimulationProfile/);
});
