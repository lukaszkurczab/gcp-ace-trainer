import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import type { ResolvedContentRef, ReviewQueueEntry } from "../../domain";
import { getKeyValueStorage, MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS } from "../keys";
import { UnsupportedStoredRecordError } from "../errors";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import {
  addReviewQueueItems,
  clearReviewQueueItems,
  getDueReviewQueueItems,
  getReviewQueueItems,
  materializeReviewQueueItems,
  removeReviewQueueEntry,
} from "./reviewQueueRepository";
import { productionTrackAdmissionContext } from "../../application/tracks/trackAdmissionContext";


const TRACK_ID = "google-cloud-associate-cloud-engineer" as const;
const QUESTION_ID = "gcp-ace-gcpace-n01-b02-002";
const OLD_SHA256 = "a".repeat(64);
const CURRENT_SHA256 = "b".repeat(64);
const TIMESTAMP = "2026-09-03T08:00:00.000Z";

function item(artifactSha256: string, contentVersion = "gcp-core-0006"): ResolvedContentRef {
  return { trackId: TRACK_ID, questionId: QUESTION_ID, contentVersion, artifactSha256 };
}

function review(id: string, sourceAttemptId: string, sourceSessionId: string, sourceItem: ResolvedContentRef): ReviewQueueEntry {
  return {
    id,
    trackId: TRACK_ID,
    sourceAttemptId,
    sourceSessionId,
    sourceItem,
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: TIMESTAMP,
    createdAt: TIMESTAMP,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("keeps the same question distinct across immutable artifact SHA-256 values", async () => {
  const oldReview = review("review:gcp:0004", "attempt:gcp:0004", "session:gcp:0004", item(OLD_SHA256, "gcp-core-0004"));
  const currentReview = review("review:gcp:0006", "attempt:gcp:0006", "session:gcp:0006", item(CURRENT_SHA256));

  await addReviewQueueItems([oldReview], productionTrackAdmissionContext);
  await addReviewQueueItems([currentReview], productionTrackAdmissionContext);

  const stored = (await getReviewQueueItems(productionTrackAdmissionContext)).value;
  assert.deepEqual(stored.map((entry) => entry.id), [oldReview.id, currentReview.id]);
  assert.deepEqual(stored.map((entry) => entry.sourceItem.artifactSha256), [OLD_SHA256, CURRENT_SHA256]);
});

test("preserves durable identity conflicts for one resolved content reference", async () => {
  const first = review("review:gcp:current", "attempt:gcp:current", "session:gcp:current", item(CURRENT_SHA256));
  await addReviewQueueItems([first], productionTrackAdmissionContext);

  await assert.rejects(
    () => addReviewQueueItems([{ ...first, id: "review:gcp:replacement", sourceAttemptId: "attempt:gcp:replacement" }], productionTrackAdmissionContext),
    /would create a second active cycle for its exact content reference/,
  );
  await assert.rejects(
    () => addReviewQueueItems([{ ...first, sourceAttemptId: "attempt:gcp:changed" }], productionTrackAdmissionContext),
    /conflicting immutable evidence/,
  );
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [first]);
});

test("rejects a durable ID rewrite across artifact identities before writing either entry", async () => {
  const oldReview = review("review:gcp:batch", "attempt:gcp:0004", "session:gcp:0004", item(OLD_SHA256, "gcp-core-0004"));
  const currentReview = review("review:gcp:batch", "attempt:gcp:0006", "session:gcp:0006", item(CURRENT_SHA256));

  await assert.rejects(
    () => addReviewQueueItems([oldReview, currentReview], productionTrackAdmissionContext),
    /conflicting immutable evidence/,
  );
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, []);
});

test("preserves index order while updating and removing canonical entries", async () => {
  const first = review("review:first", "attempt:first", "session:first", item(OLD_SHA256, "gcp-core-0004"));
  const second = review("review:second", "attempt:second", "session:second", item(CURRENT_SHA256));
  await addReviewQueueItems([first, second], productionTrackAdmissionContext);

  await addReviewQueueItems([{ ...first, dueAt: "2026-09-04T08:00:00.000Z" }], productionTrackAdmissionContext);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value.map((entry) => entry.id), [first.id, second.id]);
  assert.deepEqual((await getDueReviewQueueItems(TRACK_ID, "2026-09-05T09:00:00.000Z", productionTrackAdmissionContext)).value.map((entry) => entry.id), [second.id, first.id]);

  await removeReviewQueueEntry(first.id, productionTrackAdmissionContext);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value.map((entry) => entry.id), [second.id]);
});

test("materializing the middle of three reviews writes only its changed envelope", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  const first = review("review:first", "attempt:first", "session:first", item(OLD_SHA256, "gcp-core-0004"));
  const middle = review("review:middle", "attempt:middle", "session:middle", item(CURRENT_SHA256));
  const last = review("review:last", "attempt:last", "session:last", item("c".repeat(64), "gcp-core-0007"));
  await addReviewQueueItems([first, middle, last], productionTrackAdmissionContext);

  const before = storage.snapshot();
  const beforeFirst = before.get(STORAGE_KEYS.reviewEntry(first.id));
  const beforeMiddle = JSON.parse(before.get(STORAGE_KEYS.reviewEntry(middle.id))!);
  const beforeLast = before.get(STORAGE_KEYS.reviewEntry(last.id));
  const beforeIndex = before.get(STORAGE_KEYS.REVIEW_INDEX);
  storage.resetCounters();

  await materializeReviewQueueItems([{ ...middle, dueAt: "2026-09-04T08:00:00.000Z" }], productionTrackAdmissionContext);

  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write").map((operation) => operation.key), [STORAGE_KEYS.reviewEntry(middle.id)]);
  const after = storage.snapshot();
  assert.equal(after.get(STORAGE_KEYS.reviewEntry(first.id)), beforeFirst);
  assert.equal(JSON.parse(after.get(STORAGE_KEYS.reviewEntry(middle.id))!).revision, beforeMiddle.revision + 1);
  assert.equal(after.get(STORAGE_KEYS.reviewEntry(last.id)), beforeLast);
  assert.equal(after.get(STORAGE_KEYS.REVIEW_INDEX), beforeIndex);
});

test("rejects legacy identity fields, mixed records, tombstones, and non-lowercase artifact hashes", async () => {
  const canonical = review("review:canonical", "attempt:canonical", "session:canonical", item(CURRENT_SHA256));
  const legacy = {
    ...canonical,
    sourceItem: {
      trackId: TRACK_ID,
      itemId: QUESTION_ID,
      contentVersion: "gcp-core-0006",
      packagePin: { packageIdentity: CURRENT_SHA256, packageVersion: "gcp-core-0006", contentReleaseId: "release" },
    },
  };
  const mixed = { ...canonical, sourceItem: { ...canonical.sourceItem, itemId: QUESTION_ID } };
  const tombstone = {
    ...canonical,
    sourceItem: {
      kind: "unavailable_review",
      trackId: TRACK_ID,
      questionId: QUESTION_ID,
      contentVersion: "gcp-core-0006",
      reason: "unknown_artifact_hash",
      reviewId: canonical.id,
    },
  };
  const uppercase = { ...canonical, sourceItem: { ...canonical.sourceItem, artifactSha256: CURRENT_SHA256.toUpperCase() } };

  await assert.rejects(() => addReviewQueueItems([legacy as unknown as ReviewQueueEntry], productionTrackAdmissionContext), /invalid/);
  await assert.rejects(() => addReviewQueueItems([mixed as unknown as ReviewQueueEntry], productionTrackAdmissionContext), /invalid/);
  await assert.rejects(() => addReviewQueueItems([tombstone as unknown as ReviewQueueEntry], productionTrackAdmissionContext), /invalid/);
  await assert.rejects(() => addReviewQueueItems([uppercase as unknown as ReviewQueueEntry], productionTrackAdmissionContext), /invalid/);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, []);
});

test("accepts only explicitly identified new manual overlays on false-persistent schedules", async () => {
  const scheduled = review("review:manual-scheduled", "attempt:manual-scheduled", "session:manual-scheduled", item(CURRENT_SHA256));
  const falseScheduledManual = {
    ...scheduled,
    reasons: ["scheduled_retrieval", "manual_mark"],
    persistent: false,
    manualRequestId: `manual:${"c".repeat(64)}`,
  } satisfies ReviewQueueEntry;

  await addReviewQueueItems([falseScheduledManual], productionTrackAdmissionContext);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [falseScheduledManual]);

  await clearReviewQueueItems(productionTrackAdmissionContext);
  const ambiguousLegacy = { ...falseScheduledManual } as Record<string, unknown>;
  delete ambiguousLegacy.manualRequestId;
  await assert.rejects(() => addReviewQueueItems([ambiguousLegacy as unknown as ReviewQueueEntry], productionTrackAdmissionContext), /invalid/);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, []);
});

test("enforces the versioned review-cycle stage tuple without rewriting malformed records", async () => {
  const base = review("review:tuple", "attempt:tuple", "session:tuple", item(CURRENT_SHA256));
  const manualRequestId = `manual:${"d".repeat(64)}`;
  const valid: ReviewQueueEntry[] = [
    { ...base, reasons: ["incorrect"], persistent: true, consecutiveAfterDueSuccesses: 0, policyVersion: "bizq04-v1", stage: "repair24", status: "active" },
    { ...base, reasons: ["partial", "manual_mark"], persistent: true, consecutiveAfterDueSuccesses: 1, manualRequestId, policyVersion: "bizq04-v1", stage: "repair7", status: "active" },
    { ...base, reasons: ["manual_mark"], persistent: true, consecutiveAfterDueSuccesses: 0, manualRequestId, policyVersion: "bizq04-v1", stage: "manual_requested", status: "active" },
    ...(["retention7", "retention14", "retention28"] as const).map((stage, index) => ({
      ...base,
      id: `review:retention:${stage}`,
      sourceAttemptId: `attempt:retention:${stage}`,
      reasons: index === 0 ? ["scheduled_retrieval", "manual_mark"] as const : ["scheduled_retrieval"] as const,
      ...(index === 0 ? { manualRequestId } : {}),
      persistent: false,
      consecutiveAfterDueSuccesses: 0,
      policyVersion: "bizq04-v1",
      stage,
      status: "active" as const,
    })),
  ];
  for (const entry of valid) {
    await addReviewQueueItems([entry], productionTrackAdmissionContext);
    assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [entry]);
    await clearReviewQueueItems(productionTrackAdmissionContext);
  }
  const terminal: ReviewQueueEntry = {
    ...base,
    reasons: ["scheduled_retrieval"],
    dueAt: undefined,
    persistent: false,
    consecutiveAfterDueSuccesses: 0,
    policyVersion: "bizq04-v1",
    stage: "retention28",
    status: "completed",
    completedAt: TIMESTAMP,
    completedByAttemptId: "attempt:completed",
  };
  const { dueAt: _omittedDueAt, ...validTerminal } = terminal;
  await addReviewQueueItems([validTerminal], productionTrackAdmissionContext);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, [validTerminal]);
  await clearReviewQueueItems(productionTrackAdmissionContext);

  const malformed: ReviewQueueEntry[] = [
    { ...valid[0]!, reasons: ["scheduled_retrieval"] },
    { ...valid[0]!, stage: "repair7" },
    { ...valid[1]!, consecutiveAfterDueSuccesses: 0 },
    { ...valid[2]!, manualRequestId: undefined },
    { ...valid[2]!, reasons: ["incorrect", "manual_mark"] },
    { ...valid[3]!, reasons: ["scheduled_retrieval"], manualRequestId: undefined },
    { ...valid[4]!, persistent: true },
    { ...valid[4]!, reasons: ["scheduled_retrieval", "manual_mark"], manualRequestId: undefined },
    { ...validTerminal, reasons: ["scheduled_retrieval", "manual_mark"], manualRequestId },
    { ...validTerminal, consecutiveAfterDueSuccesses: 1 },
  ];
  for (const [index, entry] of malformed.entries()) {
    const malformedEntry = { ...entry, id: `review:malformed:${index}`, sourceAttemptId: `attempt:malformed:${index}` };
    await assert.rejects(() => addReviewQueueItems([malformedEntry], productionTrackAdmissionContext), /invalid/u);
    assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, []);
  }
});

test("reads only strict canonical entries from durable storage", async () => {
  const canonical = review("review:stored", "attempt:stored", "session:stored", item(CURRENT_SHA256));
  const { sourceItem: _sourceItem, ...withoutSourceItem } = canonical;
  writeCanonicalJson(STORAGE_KEYS.REVIEW_INDEX, [canonical.id]);
  writeCanonicalJson(STORAGE_KEYS.reviewEntry(canonical.id), {
    ...withoutSourceItem,
    sourceItem: { ...canonical.sourceItem, artifactSha256: CURRENT_SHA256.toUpperCase() },
  });

  await assert.rejects(() => getReviewQueueItems(productionTrackAdmissionContext), UnsupportedStoredRecordError);
  assert.equal(getKeyValueStorage().getString(STORAGE_KEYS.REVIEW_INDEX) !== undefined, true);
});

test("clears all canonical review records and the index", async () => {
  await addReviewQueueItems([review("review:one", "attempt:one", "session:one", item(CURRENT_SHA256))], productionTrackAdmissionContext);
  await clearReviewQueueItems(productionTrackAdmissionContext);
  assert.deepEqual((await getReviewQueueItems(productionTrackAdmissionContext)).value, []);
  assert.equal(getKeyValueStorage().getString(STORAGE_KEYS.REVIEW_INDEX), undefined);
});
