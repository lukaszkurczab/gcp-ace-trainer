import assert from "node:assert/strict";
import test from "node:test";

import * as domain from "..";
import {
  CONTENT_IDENTITY_MIGRATION_VERSION,
  createContentIdentityResolution,
  createContentIdentityTombstone,
  createResolvedContentRef,
  isContentIdentityResolution,
  isContentIdentityTombstone,
  isResolvedContentRef,
  resolvedContentRefKey,
  resolvedContentRefsEqual,
  type ContentIdentityTombstone,
} from "./resolvedContentRef";

const VALID_REF = {
  trackId: "backend-system-design-interview",
  questionId: "question-1",
  contentVersion: "content-v1",
  artifactSha256: "a".repeat(64),
} as const;

test("ResolvedContentRef has exactly four canonical-safe fields and is frozen", () => {
  const ref = createResolvedContentRef(VALID_REF);
  assert.deepEqual(ref, VALID_REF);
  assert.equal(Object.isFrozen(ref), true);
  assert.equal(isResolvedContentRef(ref), true);
  assert.equal(Object.keys(ref).sort().join(","), "artifactSha256,contentVersion,questionId,trackId");
});

test("ResolvedContentRef rejects null, extra fields, unsafe identities, and SHA casing without normalization", () => {
  const malformed = [
    null,
    { ...VALID_REF, extra: true },
    { ...VALID_REF, trackId: "../backend" },
    { ...VALID_REF, questionId: "" },
    { ...VALID_REF, contentVersion: "content/v1" },
    { ...VALID_REF, artifactSha256: "A".repeat(64) },
    { ...VALID_REF, artifactSha256: "a".repeat(63) },
  ];
  for (const value of malformed) assert.throws(() => createResolvedContentRef(value), /ResolvedContentRefError|canonical-safe|SHA-256/);
});

test("ResolvedContentRef key is versioned, deterministic, and field-boundary safe", () => {
  const first = createResolvedContentRef(VALID_REF);
  const reordered = createResolvedContentRef({ artifactSha256: VALID_REF.artifactSha256, contentVersion: VALID_REF.contentVersion, questionId: VALID_REF.questionId, trackId: VALID_REF.trackId });
  const changedQuestion = createResolvedContentRef({ ...VALID_REF, questionId: "question-2" });
  assert.equal(resolvedContentRefsEqual(first, reordered), true);
  assert.equal(resolvedContentRefKey(first), resolvedContentRefKey(reordered));
  assert.notEqual(resolvedContentRefKey(first), resolvedContentRefKey(changedQuestion));
  assert.match(resolvedContentRefKey(first), /^resolved-content-ref:v1:/u);
  assert.equal(resolvedContentRefsEqual(first, { ...first, itemId: first.questionId }), false);
});

test("tombstones are immutable, tagged, minimal, and contain no recursive legacy fields", () => {
  const tombstone = createContentIdentityTombstone({
    kind: "unavailable_review",
    trackId: VALID_REF.trackId,
    questionId: VALID_REF.questionId,
    contentVersion: VALID_REF.contentVersion,
    reviewId: "review-1",
    reason: "unknown_artifact_hash",
    migrationVersion: CONTENT_IDENTITY_MIGRATION_VERSION,
    legacyIdentityDigest: "b".repeat(64),
  });
  assert.equal(Object.isFrozen(tombstone), true);
  assert.equal(isContentIdentityTombstone(tombstone), true);
  assert.equal(JSON.stringify(tombstone).includes("packagePin"), false);
  assert.equal(JSON.stringify(tombstone).includes("itemId"), false);
  assert.throws(() => createContentIdentityTombstone({
    ...tombstone,
    metadata: { packagePin: { packageIdentity: "secret" } },
  }), /exact shape|forbidden/);
});

test("resolution result is exact, frozen, and distinguishes resolved from tombstone", () => {
  const ref = createResolvedContentRef(VALID_REF);
  const resolved = createContentIdentityResolution({ kind: "resolved", ref });
  const tombstone: ContentIdentityTombstone = createContentIdentityTombstone({
    kind: "archival_history",
    trackId: VALID_REF.trackId,
    questionId: VALID_REF.questionId,
    contentVersion: VALID_REF.contentVersion,
    sessionId: "session-1",
    reason: "stale_content_version",
    migrationVersion: CONTENT_IDENTITY_MIGRATION_VERSION,
    legacyIdentityDigest: "c".repeat(64),
  });
  const unavailable = createContentIdentityResolution({ kind: "tombstone", tombstone });
  assert.equal(Object.isFrozen(resolved), true);
  assert.equal(Object.isFrozen(unavailable), true);
  assert.equal(isContentIdentityResolution(resolved), true);
  assert.equal(isContentIdentityResolution(unavailable), true);
  assert.deepEqual(resolved, { kind: "resolved", ref });
  assert.deepEqual(unavailable, { kind: "tombstone", tombstone });
});

test("public domain barrel exposes strict contracts but not the legacy decoder/mapper", () => {
  assert.equal(typeof domain.createResolvedContentRef, "function");
  assert.equal(typeof domain.createContentIdentityTombstone, "function");
  assert.equal(typeof domain.createContentIdentityResolution, "function");
  assert.equal("mapLegacyContentIdentity" in domain, false);
  assert.equal("decodeLegacyContentIdentity" in domain, false);
});
