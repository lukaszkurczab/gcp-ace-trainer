import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import {
  assertSessionMatchesBundledTrack,
  createContentSessionPlanFingerprint,
  validateBundledContent,
} from "../src/content/application";
import { getAlgorithmContentCatalog, getCertificationContentCatalog } from "../src/content/catalogRepository";
import type { BundledContentRelease } from "../src/content/contracts";
import { createTrainingSession } from "../src/domain";
import { contentHasher } from "../src/infrastructure/identity/contentHasher";

function algorithmBank(itemCount = 40, interaction = "single_choice", taxonomyNodeId = "arrays_and_strings") {
  const items = Array.from({ length: itemCount }, (_, index) => ({
    id: `mechanical-item-${index + 1}`,
    contentVersion: "algorithms-test-v1",
    difficulty: "core",
    learningStage: "foundations",
    primarySkillAtomId: "arrays_and_strings",
    prompt: `Mechanical contract item ${index + 1}`,
    type: interaction,
    feedbackModel: {
      decisionSignal: "Use the declared invariant.", details: "The declared answer follows from the invariant.", mentalModelCorrection: "Check the invariant.", mistakeTypes: [], nextAction: "Continue.", result: "correct",
      distractorExplanations: { wrong: "This contradicts the invariant." },
    },
    options: [{ id: "correct", text: "Correct", isCorrect: true }, { id: "wrong", text: "Wrong", isCorrect: false }],
  }));
  return { formatVersion: 1, trackId: "algorithms", familyId: "algorithms", contentVersion: "algorithms-test-v1", groups: [{ roadmapNodeId: taxonomyNodeId, itemIds: items.map((item) => item.id) }], items };
}

async function algorithmsRelease(input: Readonly<{ itemCount?: number; interaction?: string; taxonomyNodeId?: string; declaredModes?: readonly string[]; artifactContentVersion?: string; artifactTaxonomyVersion?: string; referenceContentVersion?: string; approvalIdentity?: string; approvedItemIds?: readonly string[]; schemaVersion?: string }> = {}): Promise<BundledContentRelease> {
  const bank = algorithmBank(input.itemCount, input.interaction, input.taxonomyNodeId);
  const bytes = JSON.stringify({
    envelopeVersion: 1,
    schemaVersion: input.schemaVersion ?? "published-bank-v1",
    contentVersion: input.artifactContentVersion ?? "algorithms-test-v1",
    taxonomyVersion: input.artifactTaxonomyVersion ?? "algorithms-taxonomy-v1",
    bank,
  });
  const checksumSha256 = await contentHasher.sha256(bytes);
  return {
    manifest: { envelopeVersion: 1, releaseId: "mechanical-contract-release", sourceRepositoryCommit: "1".repeat(40) },
    artifacts: [{
      trackId: "algorithms", familyId: "algorithms", contentVersion: input.referenceContentVersion ?? "algorithms-test-v1", taxonomyVersion: "algorithms-taxonomy-v1", schemaVersion: "published-bank-v1", checksumSha256,
      sourceRepositoryCommit: "1".repeat(40), approvalCoverage: { identity: input.approvalIdentity ?? "approval:mechanical-contract", itemIds: input.approvedItemIds ?? bank.items.map((item) => item.id) },
      declaredModes: input.declaredModes ?? ["algorithms-interview-simulation"], artifactBytes: bytes,
    }],
  };
}

function track(result: Awaited<ReturnType<typeof validateBundledContent>>, trackId: string) {
  const value = result.tracks.find((candidate) => candidate.trackId === trackId);
  assert.ok(value, `Expected ${trackId} projection.`);
  return value;
}

test("consumes a valid pinned Algorithms artifact without requiring Certification", async () => {
  const result = await validateBundledContent(await algorithmsRelease());
  const algorithms = track(result, "algorithms");
  const certification = track(result, "cloud-certification");
  assert.equal(algorithms.kind, "available");
  assert.equal(certification.kind, "unavailable");
  if (certification.kind === "unavailable") assert.equal(certification.reason, "missing_artifact");
  assert.equal(getAlgorithmContentCatalog().getItems().length, 40);
  assert.throws(() => getCertificationContentCatalog());
});

test("the committed release remains explicitly unavailable until a manually prepared artifact is pinned", async () => {
  const result = await validateBundledContent();
  for (const projection of result.tracks) {
    assert.equal(projection.kind, "unavailable");
    if (projection.kind === "unavailable") assert.equal(projection.reason, "missing_artifact");
  }
});

test("reports each required unavailable reason from actual artifact bytes and metadata", async () => {
  const missing = await validateBundledContent({ manifest: { envelopeVersion: 1, releaseId: "missing", sourceRepositoryCommit: "1".repeat(40) }, artifacts: [] });
  assert.equal(track(missing, "algorithms").kind, "unavailable");

  const invalid = await validateBundledContent({ manifest: { envelopeVersion: 2, releaseId: "invalid", sourceRepositoryCommit: "1".repeat(40) }, artifacts: [] });
  const invalidAlgorithms = track(invalid, "algorithms");
  if (invalidAlgorithms.kind === "unavailable") assert.equal(invalidAlgorithms.reason, "invalid_envelope");

  const checksum = await algorithmsRelease();
  const checksumBroken = { ...checksum, artifacts: [{ ...checksum.artifacts[0]!, checksumSha256: "0".repeat(64) }] };
  const checksumAlgorithms = track(await validateBundledContent(checksumBroken), "algorithms");
  if (checksumAlgorithms.kind === "unavailable") assert.equal(checksumAlgorithms.reason, "checksum_mismatch");

  const schemaAlgorithms = track(await validateBundledContent(await algorithmsRelease({ schemaVersion: "published-bank-v2" })), "algorithms");
  if (schemaAlgorithms.kind === "unavailable") assert.equal(schemaAlgorithms.reason, "schema_mismatch");

  const versionAlgorithms = track(await validateBundledContent(await algorithmsRelease({ artifactContentVersion: "algorithms-test-v2" })), "algorithms");
  if (versionAlgorithms.kind === "unavailable") assert.equal(versionAlgorithms.reason, "version_mismatch");

  const approvalsAlgorithms = track(await validateBundledContent(await algorithmsRelease({ approvalIdentity: "", approvedItemIds: [] })), "algorithms");
  if (approvalsAlgorithms.kind === "unavailable") assert.equal(approvalsAlgorithms.reason, "missing_approval_coverage");

  const smallPool = track(await validateBundledContent(await algorithmsRelease({ itemCount: 39 })), "algorithms");
  if (smallPool.kind === "unavailable") assert.equal(smallPool.reason, "insufficient_fixed_pool");

  const unsupported = track(await validateBundledContent(await algorithmsRelease({ interaction: "unsupported_interaction" })), "algorithms");
  if (unsupported.kind === "unavailable") assert.equal(unsupported.reason, "unsupported_interaction");
});

test("rejects unsupported declared modes and invalid canonical taxonomy references", async () => {
  const mode = track(await validateBundledContent(await algorithmsRelease({ declaredModes: ["not-a-mode"] })), "algorithms");
  if (mode.kind === "unavailable") assert.equal(mode.reason, "declared_mode_unsupported");
  const taxonomy = track(await validateBundledContent(await algorithmsRelease({ taxonomyNodeId: "not-a-taxonomy-node" })), "algorithms");
  if (taxonomy.kind === "unavailable") assert.equal(taxonomy.reason, "invalid_taxonomy_reference");
});

test("active sessions reject a newer artifact identity or a changed immutable plan", async () => {
  const result = await validateBundledContent(await algorithmsRelease());
  const algorithms = track(result, "algorithms");
  assert.equal(algorithms.kind, "available");
  if (algorithms.kind !== "available") return;
  const base = createTrainingSession({
    id: "content-bound-session", trackId: "algorithms", modeId: "algorithms-interview-simulation", configurationSnapshot: { kind: "simulation" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId: "algorithms", contentVersion: "algorithms-test-v1", itemId: "mechanical-item-1" } }], optionOrderByOccurrence: { "occurrence-1": ["correct", "wrong"] }, activeForegroundMs: 0, contentVersion: "algorithms-test-v1", status: "active", startedAt: "2026-07-16T10:00:00.000Z",
  });
  const planFingerprint = await createContentSessionPlanFingerprint({ ...base, taxonomyVersion: "algorithms-taxonomy-v1" });
  const bound = createTrainingSession({ ...base, taxonomyVersion: "algorithms-taxonomy-v1", planFingerprint });
  await assert.doesNotReject(() => assertSessionMatchesBundledTrack(bound, algorithms));
  await assert.rejects(() => assertSessionMatchesBundledTrack(createTrainingSession({ ...bound, contentVersion: "algorithms-test-v2", itemOrder: [{ ...bound.itemOrder[0]!, item: { ...bound.itemOrder[0]!.item, contentVersion: "algorithms-test-v2" } }] }), algorithms), /content identity/);
  await assert.rejects(() => assertSessionMatchesBundledTrack(createTrainingSession({ ...bound, itemOrder: [{ ...bound.itemOrder[0]!, item: { ...bound.itemOrder[0]!.item, itemId: "mechanical-item-2" } }] }), algorithms), /fingerprint/);
});

function sourceFiles(root: string): string[] {
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? sourceFiles(join(root, entry.name)) : [join(root, entry.name)]);
}

test("production imports only the generated artifact boundary, never fixtures or a runtime network client", () => {
  const source = sourceFiles("src").filter((path) => /\.(ts|tsx)$/.test(path)).map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(source, /from\s+["'][^"']*(?:tests\/|fixtures)[^"']*["']/);
  assert.doesNotMatch(source, /\b(?:fetch|XMLHttpRequest|axios|HttpContentSource|loadTrackContent)\b/);
  const consumer = readFileSync("src/content/application/validateBundledContent.ts", "utf8");
  assert.match(consumer, /from\s+["']\.\.\/bundled["']/);
});
