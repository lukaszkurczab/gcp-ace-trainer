import assert from "node:assert/strict";
import test from "node:test";

import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { setQuestionNeedsReview } from "./certificationReviewCommands";
import { loadCanonicalRuntimeCatalog } from "../../content/canonical/runtimeCatalog";
import { createResolvedContentRef, GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID, type ReviewQueueEntry } from "../../domain";
import { installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { addReviewQueueItems, getActiveMutationJournal, getReviewQueueItems } from "../../storage/repositories";
import { recoverPendingMutation } from "../learningMutations/recoverPendingMutation";
import { STORAGE_KEYS } from "../../storage/keys";
import { setIdentityNonceGeneratorForTests } from "../../infrastructure/identity/identityNonceShared";
import { writeCanonicalJson } from "../../storage/repositories/canonicalRecordCodec";
import { installMemoryStorage } from "../../testing/journalTestSupport";

async function fixture() {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  const track = (await loadCanonicalRuntimeCatalog()).getTrack(GOOGLE_CLOUD_ASSOCIATE_CLOUD_ENGINEER_TRACK_ID);
  const question = track.getPool("certification-focus-practice")[0]!;
  const sourceItem = createResolvedContentRef({
    trackId: track.trackId,
    questionId: question.questionId,
    contentVersion: track.contentVersion,
    artifactSha256: track.artifactSha256,
  });
  return { question, sourceItem };
}

function existingCycle(sourceItem: ReviewQueueEntry["sourceItem"], fields: Partial<ReviewQueueEntry> = {}): ReviewQueueEntry {
  return {
    id: "review:manual-command-fixture",
    trackId: sourceItem.trackId,
    sourceAttemptId: "attempt:manual-command-fixture",
    sourceSessionId: "session:manual-command-fixture",
    sourceItem,
    taxonomyOrSkillRefs: [{ axisId: "node", nodeId: "fixture-node", role: "primary" }],
    reasons: ["incorrect"],
    dueAt: "2026-10-04T12:00:00.000Z",
    createdAt: "2026-10-01T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 1,
    persistent: true,
    policyVersion: "bizq04-v1",
    stage: "repair7",
    status: "active",
    ...fields,
  };
}

test("manual request creates one due-now cycle and repeated marking is idempotent", async () => {
  installMemoryStorage();
  const { question, sourceItem } = await fixture();
  const input = { sourceItem, sourceSessionId: "session:manual-command", sourceAttemptId: "attempt:manual-command" };

  await setQuestionNeedsReview(input, true);
  const first = (await getReviewQueueItems()).value;
  assert.equal(first.length, 1);
  assert.deepEqual(first[0]?.reasons, ["manual_mark"]);
  assert.equal(first[0]?.stage, "manual_requested");
  assert.equal(first[0]?.status, "active");
  assert.equal(first[0]?.dueAt, first[0]?.createdAt);
  assert.equal(first[0]?.persistent, true);
  assert.match(first[0]?.manualRequestId ?? "", /^manual:[a-f0-9]{64}$/u);

  await setQuestionNeedsReview(input, true);
  const repeated = (await getReviewQueueItems()).value;
  assert.equal(repeated.length, 1);
  assert.equal(repeated[0]?.id, first[0]?.id);
  assert.deepEqual(repeated[0]?.reasons, ["manual_mark"]);
  assert.equal(repeated[0]?.manualRequestId, first[0]?.manualRequestId);

  await setQuestionNeedsReview(input, false);
  assert.deepEqual((await getReviewQueueItems()).value, []);
});

test("marking and unmarking a scheduled automatic cycle preserves its due date and qualification state", async () => {
  installMemoryStorage();
  const { question, sourceItem } = await fixture();
  const original = existingCycle(sourceItem, {
    reasons: ["scheduled_retrieval"], dueAt: "2099-10-20T12:00:00.000Z", persistent: false,
    consecutiveAfterDueSuccesses: 0, stage: "retention7",
  });
  await addReviewQueueItems([original]);
  const input = { sourceItem, sourceSessionId: "session:manual-command", sourceAttemptId: "attempt:manual-command" };

  await setQuestionNeedsReview(input, true);
  const marked = (await getReviewQueueItems()).value[0]!;
  assert.equal(marked.id, original.id);
  assert.equal(marked.stage, original.stage);
  assert.equal(marked.dueAt, original.dueAt);
  assert.equal(marked.consecutiveAfterDueSuccesses, original.consecutiveAfterDueSuccesses);
  assert.equal(marked.persistent, original.persistent);
  assert.deepEqual(marked.reasons, ["scheduled_retrieval", "manual_mark"]);

  await setQuestionNeedsReview(input, false);
  assert.deepEqual((await getReviewQueueItems()).value[0], original);

  await setQuestionNeedsReview(input, true);
  const secondMark = (await getReviewQueueItems()).value[0]!;
  assert.notEqual(secondMark.manualRequestId, marked.manualRequestId, "a new off→on request has fresh identity");
  assert.equal(secondMark.dueAt, original.dueAt);
  assert.equal(secondMark.stage, original.stage);
});

test("same-millisecond mark/off/on produces a new request and transition identity each time", async () => {
  installMemoryStorage();
  const { sourceItem } = await fixture();
  const originalDate = globalThis.Date;
  const fixedTime = "2026-10-08T12:34:56.789Z";
  globalThis.Date = class extends originalDate {
    constructor(value?: string | number) { value === undefined ? super(fixedTime) : super(value); }
    static now(): number { return originalDate.parse(fixedTime); }
  } as DateConstructor;
  const uuids = ["123e4567-e89b-42d3-a456-426614174001", "123e4567-e89b-42d3-a456-426614174002", "123e4567-e89b-42d3-a456-426614174003"];
  let generated = 0;
  setIdentityNonceGeneratorForTests(() => uuids[generated++]!);
  const capturedJournals: string[] = [];
  const storage = installMemoryStorage();
  const setString = storage.setString.bind(storage);
  storage.setString = (key, value) => {
    if (key === STORAGE_KEYS.ACTIVE_JOURNAL) capturedJournals.push(value);
    setString(key, value);
  };
  try {
    const input = { sourceItem, sourceSessionId: "session:same-ms", sourceAttemptId: "attempt:same-ms" };
    await setQuestionNeedsReview(input, true);
    const first = (await getReviewQueueItems()).value[0]!;
    await setQuestionNeedsReview(input, false);
    await setQuestionNeedsReview(input, true);
    const second = (await getReviewQueueItems()).value[0]!;
    assert.equal(first.createdAt, fixedTime);
    assert.equal(second.createdAt, fixedTime);
    assert.notEqual(first.manualRequestId, second.manualRequestId);
    assert.notEqual(first.id, second.id);
    assert.equal(generated, 3);
    const durablePayloads = capturedJournals.map((raw) => JSON.parse(raw).payload).filter((record) => record.status === "journal_durable");
    assert.equal(durablePayloads.length, 3);
    assert.equal(new Set(durablePayloads.map((record) => record.commandIdentity.fingerprint)).size, 3,
      "the journal command identity includes the same fresh nonce as its transition/request identity");
  } finally {
    setIdentityNonceGeneratorForTests(null);
    globalThis.Date = originalDate;
  }
});

test("manual no-ops do not consume entropy and entropy failure occurs before any journal write", async () => {
  const storage = installMemoryStorage();
  const { sourceItem } = await fixture();
  const input = { sourceItem, sourceSessionId: "session:no-op", sourceAttemptId: "attempt:no-op" };
  let generated = 0;
  setIdentityNonceGeneratorForTests(() => { generated += 1; return "123e4567-e89b-42d3-a456-426614174003"; });
  try {
    await setQuestionNeedsReview(input, false);
    assert.equal(generated, 0);
    await setQuestionNeedsReview(input, true);
    await setQuestionNeedsReview(input, true);
    assert.equal(generated, 1);
    await setQuestionNeedsReview(input, false);
    storage.resetCounters();
    setIdentityNonceGeneratorForTests(() => { throw new Error("injected entropy failure"); });
    await assert.rejects(() => setQuestionNeedsReview(input, true), /Identity nonce generation failed/u);
    assert.deepEqual(storage.operations.filter((operation) => operation.kind !== "read"), []);
    assert.equal(await getActiveMutationJournal(), null);
    assert.deepEqual((await getReviewQueueItems()).value, []);
  } finally {
    setIdentityNonceGeneratorForTests(null);
  }
});

test("a durable manual command recovers twice with the exact stored identities and no entropy retry", async () => {
  const storage = installMemoryStorage();
  const { sourceItem } = await fixture();
  const original = existingCycle(sourceItem, { reasons: ["scheduled_retrieval"], stage: "retention7", persistent: false, consecutiveAfterDueSuccesses: 0 });
  await addReviewQueueItems([original]);
  const nonce = "123e4567-e89b-42d3-a456-426614174004";
  let generated = 0;
  setIdentityNonceGeneratorForTests(() => { generated += 1; return nonce; });
  storage.setFailurePlan({ kind: "fail_on_key_write", key: STORAGE_KEYS.reviewEntry(original.id) });
  try {
    await assert.rejects(() => setQuestionNeedsReview({ sourceItem, sourceSessionId: "session:journal", sourceAttemptId: "attempt:journal" }, true));
    const journal = await getActiveMutationJournal();
    assert.ok(journal);
    const journalEntry = journal.writes.find((write) => write.kind === "update_review_entry");
    assert.ok(journalEntry && journalEntry.kind === "update_review_entry");
    assert.equal(journalEntry.record.id, original.id);
    assert.equal(journalEntry.transitionId, `manual-review:${nonce}`);
    assert.match(journalEntry.record.manualRequestId ?? "", /^manual:[a-f0-9]{64}$/u);
    const storedRequestId = journalEntry.record.manualRequestId;
    storage.setFailurePlan(null);
    await recoverPendingMutation();
    await recoverPendingMutation();
    assert.equal(generated, 1);
    assert.equal(await getActiveMutationJournal(), null);
    assert.deepEqual((await getReviewQueueItems()).value.map((entry) => [entry.id, entry.manualRequestId]), [[original.id, storedRequestId]]);
  } finally {
    setIdentityNonceGeneratorForTests(null);
    storage.setFailurePlan(null);
  }
});

test("a stale review snapshot conflicts before consuming its queued intent", async () => {
  const storage = installMemoryStorage();
  const { sourceItem } = await fixture();
  const original = existingCycle(sourceItem, { reasons: ["scheduled_retrieval"], stage: "retention7", persistent: false, consecutiveAfterDueSuccesses: 0 });
  await addReviewQueueItems([original]);
  let generated = 0;
  setIdentityNonceGeneratorForTests(() => { generated += 1; return "123e4567-e89b-42d3-a456-426614174005"; });
  const getString = storage.getString.bind(storage);
  let raced = false;
  storage.getString = (key) => {
    if (!raced && key === STORAGE_KEYS.ACTIVE_JOURNAL) {
      raced = true;
      writeCanonicalJson(STORAGE_KEYS.reviewEntry(original.id), { ...original, dueAt: "2099-12-20T12:00:00.000Z" });
    }
    return getString(key);
  };
  try {
    await assert.rejects(() => setQuestionNeedsReview({ sourceItem, sourceSessionId: "session:stale", sourceAttemptId: "attempt:stale" }, true));
    const current = (await getReviewQueueItems()).value[0]!;
    assert.equal(raced, true);
    assert.equal(generated, 1);
    assert.equal(current.dueAt, "2099-12-20T12:00:00.000Z");
    assert.equal(current.manualRequestId, undefined);
    assert.deepEqual(current.reasons, ["scheduled_retrieval"]);
    assert.equal(await getActiveMutationJournal(), null);
  } finally {
    setIdentityNonceGeneratorForTests(null);
  }
});

test("a profile change during the fresh in-lane snapshot is fenced before nonce generation", async () => {
  const originalStorage = installMemoryStorage();
  const { sourceItem } = await fixture();
  const replacementStorage = installMemoryStorage();
  installKeyValueStorageForTests(originalStorage);
  let generated = 0;
  setIdentityNonceGeneratorForTests(() => { generated += 1; return "123e4567-e89b-42d3-a456-426614174007"; });
  const getString = originalStorage.getString.bind(originalStorage);
  let transitioned = false;
  originalStorage.getString = (key) => {
    if (!transitioned && key === STORAGE_KEYS.REVIEW_INDEX) {
      transitioned = true;
      installKeyValueStorageForTests(replacementStorage);
    }
    return getString(key);
  };
  try {
    await assert.rejects(() => setQuestionNeedsReview({ sourceItem, sourceSessionId: "session:snapshot-fence", sourceAttemptId: "attempt:snapshot-fence" }, true), /Profile changed during read/u);
    assert.equal(transitioned, true);
    assert.equal(generated, 0);
    assert.equal(originalStorage.operations.some((operation) => operation.kind !== "read"), false);
    assert.equal(replacementStorage.operations.some((operation) => operation.kind !== "read"), false);
  } finally {
    setIdentityNonceGeneratorForTests(null);
    installKeyValueStorageForTests(originalStorage);
  }
});

test("new manual mark on known persistent=false legacy schedule writes an explicit ID without changing its cycle", async () => {
  installMemoryStorage();
  const { question, sourceItem } = await fixture();
  const { policyVersion: _policyVersion, stage: _stage, status: _status, ...legacyFields } = existingCycle(sourceItem);
  const legacy: ReviewQueueEntry = {
    ...legacyFields,
    reasons: ["scheduled_retrieval"],
    dueAt: "2099-10-20T12:00:00.000Z",
    persistent: false,
    consecutiveAfterDueSuccesses: 0,
  };
  await addReviewQueueItems([legacy]);
  const input = { sourceItem, sourceSessionId: "session:legacy-manual", sourceAttemptId: "attempt:legacy-manual" };
  await setQuestionNeedsReview(input, true);
  const marked = (await getReviewQueueItems()).value[0]!;
  assert.deepEqual(marked.reasons, ["scheduled_retrieval", "manual_mark"]);
  assert.match(marked.manualRequestId ?? "", /^manual:[a-f0-9]{64}$/u);
  assert.equal(marked.persistent, false);
  assert.equal(marked.dueAt, legacy.dueAt);
  assert.equal(marked.consecutiveAfterDueSuccesses, legacy.consecutiveAfterDueSuccesses);
  assert.equal(marked.policyVersion, undefined);
  await setQuestionNeedsReview(input, false);
  const unmarked = (await getReviewQueueItems()).value[0]!;
  assert.deepEqual(unmarked.reasons, ["scheduled_retrieval"]);
  assert.equal(unmarked.manualRequestId, undefined);
  assert.equal(unmarked.persistent, false);
  assert.equal(unmarked.dueAt, legacy.dueAt);
});

test("unmarking a recognized historical manual scheduled item preserves its due cycle", async () => {
  installMemoryStorage();
  const { question, sourceItem } = await fixture();
  const { policyVersion: _policyVersion, stage: _stage, status: _status, ...legacyFields } = existingCycle(sourceItem);
  const legacy: ReviewQueueEntry = {
    ...legacyFields,
    reasons: ["manual_mark", "scheduled_retrieval"],
    dueAt: "2026-10-12T12:00:00.000Z",
    createdAt: "2026-09-01T12:00:00.000Z",
    lastReviewedAt: "2026-10-05T12:00:00.000Z",
    consecutiveAfterDueSuccesses: 1,
    persistent: true,
  };
  await addReviewQueueItems([legacy]);

  await setQuestionNeedsReview({ sourceItem, sourceSessionId: "session:manual-command" }, false);
  const result = (await getReviewQueueItems()).value[0]!;
  assert.equal(result.id, legacy.id);
  assert.deepEqual(result.reasons, ["scheduled_retrieval"]);
  assert.equal(result.persistent, false);
  assert.equal(result.dueAt, legacy.dueAt);
  assert.equal(result.lastReviewedAt, legacy.lastReviewedAt);
  assert.equal(result.consecutiveAfterDueSuccesses, legacy.consecutiveAfterDueSuccesses);
  assert.equal(result.sourceAttemptId, legacy.sourceAttemptId);
  assert.equal(result.sourceSessionId, legacy.sourceSessionId);
  assert.equal(result.policyVersion, undefined);
});

test("a manual request after a terminal cycle receives a fresh ID and retains history", async () => {
  installMemoryStorage();
  const { question, sourceItem } = await fixture();
  const { dueAt: _dueAt, ...terminalFields } = existingCycle(sourceItem);
  const completed: ReviewQueueEntry = {
    ...terminalFields,
    reasons: ["scheduled_retrieval"],
    persistent: false,
    consecutiveAfterDueSuccesses: 0,
    policyVersion: "bizq04-v1",
    stage: "retention28",
    status: "completed",
    completedAt: "2026-10-07T12:00:00.000Z",
    completedByAttemptId: "attempt:retention28",
  };
  await addReviewQueueItems([completed]);

  await setQuestionNeedsReview({ sourceItem, sourceSessionId: "session:new-manual", sourceAttemptId: "attempt:new-manual" }, true);
  const entries = (await getReviewQueueItems()).value;
  assert.equal(entries.length, 2);
  assert.equal(entries.find((entry) => entry.id === completed.id)?.status, "completed");
  const active = entries.find((entry) => entry.status === "active");
  assert.ok(active);
  assert.notEqual(active.id, completed.id);
  assert.equal(active.stage, "manual_requested");
});

test("a profile change while exact content resolves prevents a manual review write", async () => {
  const originalStorage = installMemoryStorage();
  const { question, sourceItem } = await fixture();
  let generated = 0;
  setIdentityNonceGeneratorForTests(() => { generated += 1; return "123e4567-e89b-42d3-a456-426614174006"; });
  const originalResolve = contentPackageRuntimeOwner.resolveItem;
  let signalStarted!: () => void;
  let release!: () => void;
  const started = new Promise<void>((resolve) => { signalStarted = resolve; });
  const gate = new Promise<void>((resolve) => { release = resolve; });
  contentPackageRuntimeOwner.resolveItem = async (ref) => {
    signalStarted();
    await gate;
    return originalResolve.call(contentPackageRuntimeOwner, ref);
  };

  try {
    const pending = setQuestionNeedsReview({ sourceItem, sourceSessionId: "session:profile-fence" }, true);
    await started;
    const nextStorage = installMemoryStorage();
    release();
    await assert.rejects(pending, /Profile changed during read/u);
    assert.equal(generated, 0, "profile-fenced commands fail before acquiring command entropy");
    assert.equal(originalStorage.getAllKeys().length, 0);
    assert.equal(nextStorage.getAllKeys().length, 0);
  } finally {
    release();
    contentPackageRuntimeOwner.resolveItem = originalResolve;
    installKeyValueStorageForTests(originalStorage);
    setIdentityNonceGeneratorForTests(null);
  }
});
