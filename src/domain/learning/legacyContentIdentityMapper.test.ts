import assert from "node:assert/strict";
import test from "node:test";

import { buildCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import {
  LegacyContentIdentityError,
  mapLegacyContentIdentity,
  type ActiveContentArtifactDescriptor,
  type LegacyContentTombstoneContext,
} from "./legacyContentIdentityMapper";
import { CONTENT_IDENTITY_MIGRATION_VERSION, type ResolvedContentRef } from "./resolvedContentRef";

async function activeArtifacts(): Promise<readonly ActiveContentArtifactDescriptor[]> {
  const catalog = await buildCanonicalRuntimeCatalog();
  assert.equal(catalog.tracks.length, 9);
  return Object.freeze(catalog.tracks.map((trackId) => {
    const track = catalog.getTrack(trackId);
    return Object.freeze({
      trackId: track.trackId,
      contentVersion: track.contentVersion,
      artifactSha256: track.artifactSha256,
      contentReleaseId: track.packagePin.contentReleaseId,
      questionIds: Object.freeze(track.questions.map((question) => question.questionId)),
    });
  }));
}

function legacyIdentity(artifact: ActiveContentArtifactDescriptor, overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  return {
    trackId: artifact.trackId,
    itemId: artifact.questionIds[0] ?? "question-1",
    contentVersion: artifact.contentVersion,
    packagePin: {
      packageIdentity: artifact.artifactSha256,
      packageVersion: artifact.contentVersion,
      contentReleaseId: artifact.contentReleaseId ?? "canonical-content-v1",
    },
    ...overrides,
  };
}

function context(kind: LegacyContentTombstoneContext["kind"]): LegacyContentTombstoneContext {
  return kind === "unavailable_review"
    ? { kind, reviewId: "review-legacy-1" }
    : { kind, sessionId: kind === "archival_history" ? "session-history-1" : "session-active-1" };
}

function assertTombstoneResult(result: ReturnType<typeof mapLegacyContentIdentity>, reason: string): asserts result is Extract<ReturnType<typeof mapLegacyContentIdentity>, { kind: "tombstone" }> {
  assert.equal(result.kind, "tombstone");
  if (result.kind !== "tombstone") throw new Error("Expected a tombstone result.");
  assert.equal(result.tombstone.reason, reason);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.tombstone), true);
  const serialized = JSON.stringify(result.tombstone);
  assert.equal(serialized.includes("packagePin"), false);
  assert.equal(serialized.includes("itemId"), false);
}

test("exact legacy identity maps against all nine active artifacts and question membership", async () => {
  const artifacts = await activeArtifacts();
  for (const [index, artifact] of artifacts.entries()) {
    const result = mapLegacyContentIdentity(legacyIdentity(artifact), artifacts, { kind: "archival_history", sessionId: `session-${index}` });
    assert.equal(result.kind, "resolved");
    if (result.kind !== "resolved") throw new Error("Expected an exact resolved ref.");
    const expected: ResolvedContentRef = {
      trackId: artifact.trackId,
      questionId: artifact.questionIds[0]!,
      contentVersion: artifact.contentVersion,
      artifactSha256: artifact.artifactSha256,
    };
    assert.deepEqual(result.ref, expected);
    assert.equal(Object.isFrozen(result.ref), true);
  }
});

test("unknown hash, stale version/release, track mismatch, and missing question become typed tombstones", async () => {
  const artifacts = await activeArtifacts();
  const artifact = artifacts[0]!;
  const cases: readonly Readonly<{ identity: Record<string, unknown>; reason: string; context: LegacyContentTombstoneContext }>[] = [
    { identity: legacyIdentity(artifact, { packagePin: { ...legacyIdentity(artifact).packagePin as Record<string, unknown>, packageIdentity: "b".repeat(64) } }), reason: "unknown_artifact_hash", context: context("archival_history") },
    { identity: legacyIdentity(artifact, { contentVersion: "old-content-v0", packagePin: { ...legacyIdentity(artifact).packagePin as Record<string, unknown>, packageVersion: "old-content-v0" } }), reason: "stale_content_version", context: context("unavailable_active") },
    { identity: legacyIdentity(artifact, { packagePin: { ...legacyIdentity(artifact).packagePin as Record<string, unknown>, contentReleaseId: "old-release" } }), reason: "stale_content_release", context: context("unavailable_review") },
    { identity: legacyIdentity(artifact, { trackId: artifacts[1]!.trackId }), reason: "track_mismatch", context: context("archival_history") },
    { identity: legacyIdentity(artifact, { itemId: "question-not-in-active-artifact" }), reason: "question_not_in_active_artifact", context: context("unavailable_review") },
  ];
  for (const entry of cases) assertTombstoneResult(mapLegacyContentIdentity(entry.identity, artifacts, entry.context), entry.reason);
});

test("legacy decoder validates only the identity object exact shape and fails closed", async () => {
  const artifacts = await activeArtifacts();
  const identity = legacyIdentity(artifacts[0]!);
  const malformed: readonly unknown[] = [
    null,
    { record: identity },
    { ...identity, extra: true },
    { ...identity, itemId: null },
    { ...identity, packagePin: { ...(identity.packagePin as Record<string, unknown>), extra: true } },
    { ...identity, packagePin: { ...(identity.packagePin as Record<string, unknown>), packageIdentity: "A".repeat(64) } },
  ];
  for (const value of malformed) {
    assert.throws(() => mapLegacyContentIdentity(value, artifacts, context("archival_history")), (error: unknown) => {
      return error instanceof LegacyContentIdentityError && error.code === "malformed_legacy_identity";
    });
  }
  assert.throws(() => mapLegacyContentIdentity({ ...identity, itemId: "missing-question" }, artifacts), (error: unknown) => {
    return error instanceof LegacyContentIdentityError && error.code === "tombstone_context_required";
  });
  for (const invalidContext of [null, [], "context", { kind: "unknown", sessionId: "session-1" }] as const) {
    assert.throws(() => mapLegacyContentIdentity({ ...identity, itemId: "missing-question" }, artifacts, invalidContext as never), (error: unknown) => {
      return error instanceof LegacyContentIdentityError && error.code === "invalid_tombstone_context";
    });
  }
});

test("mapper produces deterministic legacy digests and is idempotent for resolved/tombstone values", async () => {
  const artifacts = await activeArtifacts();
  const artifact = artifacts[0]!;
  const first = legacyIdentity(artifact);
  const second = {
    packagePin: { ...(first.packagePin as Record<string, unknown>) },
    contentVersion: first.contentVersion,
    itemId: first.itemId,
    trackId: first.trackId,
  };
  const firstResult = mapLegacyContentIdentity(first, artifacts, context("archival_history"));
  const secondResult = mapLegacyContentIdentity(second, artifacts, context("archival_history"));
  assert.equal(firstResult.kind, "resolved");
  assert.equal(secondResult.kind, "resolved");
  if (firstResult.kind !== "resolved" || secondResult.kind !== "resolved") throw new Error("Expected resolved refs.");
  assert.deepEqual(firstResult.ref, secondResult.ref);

  const unmappedIdentity = legacyIdentity(artifact, { itemId: "missing-question" });
  const reorderedUnmappedIdentity = {
    packagePin: { ...(unmappedIdentity.packagePin as Record<string, unknown>) },
    contentVersion: unmappedIdentity.contentVersion,
    itemId: unmappedIdentity.itemId,
    trackId: unmappedIdentity.trackId,
  };
  const unmapped = mapLegacyContentIdentity(unmappedIdentity, artifacts, context("unavailable_review"));
  const reorderedUnmapped = mapLegacyContentIdentity(reorderedUnmappedIdentity, artifacts, context("unavailable_review"));
  const repeatedUnmapped = mapLegacyContentIdentity(unmappedIdentity, artifacts, context("unavailable_review"));
  assertTombstoneResult(unmapped, "question_not_in_active_artifact");
  assertTombstoneResult(reorderedUnmapped, "question_not_in_active_artifact");
  assertTombstoneResult(repeatedUnmapped, "question_not_in_active_artifact");
  assert.equal(unmapped.tombstone.legacyIdentityDigest, reorderedUnmapped.tombstone.legacyIdentityDigest);
  assert.equal(unmapped.tombstone.legacyIdentityDigest, repeatedUnmapped.tombstone.legacyIdentityDigest);
  assert.notEqual(unmapped.tombstone.legacyIdentityDigest, sha256Utf8(canonicalSerialize(unmappedIdentity)));
  assert.deepEqual(mapLegacyContentIdentity(unmapped, [], undefined), unmapped);
  assert.deepEqual(mapLegacyContentIdentity(unmapped.tombstone, [], undefined), unmapped);
  assert.deepEqual(mapLegacyContentIdentity(firstResult, [], undefined), firstResult);
  assert.equal(mapLegacyContentIdentity(firstResult.ref, [], undefined).kind, "resolved");
  assert.equal(unmapped.tombstone.migrationVersion, CONTENT_IDENTITY_MIGRATION_VERSION);
});
