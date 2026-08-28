import { TEST_CONTENT_PACKAGE_PIN } from "../../testing/contentPackagePinFixture";
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { createTrainingSession } from "../../domain";
import { clearMutationJournal, getActiveMutationJournal, getReviewQueueItems, getTrainingAttempts, getTrainingSessions, persistMutationJournal, saveTrainingSession, updateMutationJournalPhase } from "../../storage";
import { STORAGE_KEYS } from "../../storage/keys";
import { buildMutationJournal, commitTrainingOutcome, recoverPendingMutation } from "./";
beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));
const session = createTrainingSession({ id: "s", trackId: "coding-interview-dsa-problem-solving", modeId: "m", configurationSnapshot: { kind: "practice" }, requestedLength: 1, actualLength: 1, currentItemIndex: 0, itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId: "coding-interview-dsa-problem-solving", itemId: "i", contentVersion: "v" , packagePin: TEST_CONTENT_PACKAGE_PIN} }], optionOrderByOccurrence: {}, activeForegroundMs: 0, contentVersion: "v", packagePin: TEST_CONTENT_PACKAGE_PIN, status: "active" as const, startedAt: "2026-01-01T00:00:00.000Z" });
const attempt = { id: "a", sessionId: "s", trackId: "coding-interview-dsa-problem-solving", modeId: "m", occurrenceId: "occurrence-1", item: session.itemOrder[0]!.item, response: { ids: ["x"] }, result: { kind: "correct" as const, earnedPoints: 1, maxPoints: 1 }, reviewEvidence: { sourceItem: session.itemOrder[0]!.item, taxonomyOrSkillRefs: [] }, answeredAt: session.startedAt, committedAt: session.startedAt };
test("journal durability precedes idempotent materialization and recovery", async () => { const record = await buildMutationJournal({ operation: "submit_training_outcome", sessionId: "s", trackId: "coding-interview-dsa-problem-solving", identity: attempt.response, writes: [{ kind: "put_attempt", record: attempt }, { kind: "put_session", record: session }], createdAt: session.startedAt }); await persistMutationJournal(record); assert.equal((await getTrainingAttempts()).value.length, 0); await recoverPendingMutation(); assert.equal((await getActiveMutationJournal()), null); assert.equal((await getTrainingAttempts()).value.length, 1); assert.equal((await getTrainingSessions()).value.length, 1); await recoverPendingMutation(); assert.equal((await getTrainingAttempts()).value.length, 1); });
test("journal phase advances only one immutable step at a time", async () => {
  const record = await buildMutationJournal({ operation: "submit_training_outcome", sessionId: "s", trackId: "coding-interview-dsa-problem-solving", identity: attempt.response, writes: [{ kind: "put_attempt", record: attempt }, { kind: "put_session", record: session }], createdAt: session.startedAt });
  const initial = await persistMutationJournal(record);
  await assert.rejects(updateMutationJournalPhase(initial, "verified_pending_clear"));
  const materialized = await updateMutationJournalPhase(initial, "materialized");
  assert.equal(materialized.status, "materialized");
  await assert.rejects(updateMutationJournalPhase(materialized, "journal_durable"));
  const changedPlan = { ...materialized, planFingerprint: "0".repeat(64) };
  await assert.rejects(updateMutationJournalPhase(changedPlan, "verified_pending_clear"));
  assert.equal((await getActiveMutationJournal())?.status, "materialized");
});
test("journaled command rejects a conflicting pending command", async () => { const record = await buildMutationJournal({ operation: "submit_training_outcome", sessionId: "s", trackId: "coding-interview-dsa-problem-solving", identity: "other", writes: [{ kind: "put_attempt", record: attempt }, { kind: "put_session", record: session }], createdAt: session.startedAt }); await persistMutationJournal(record); await assert.rejects(commitTrainingOutcome({ attempt, session, reviews: [], createdAt: session.startedAt })); });
test("journal has a versioned SHA-256 command identity and rejects stale expected revisions", async () => {
  const record = await buildMutationJournal({ operation: "submit_training_outcome", sessionId: "s", trackId: "coding-interview-dsa-problem-solving", identity: "stale", writes: [{ kind: "put_attempt", record: attempt }, { kind: "put_session", record: session }], createdAt: session.startedAt });
  assert.deepEqual(record.commandIdentity.version, 1);
  assert.match(record.commandIdentity.fingerprint, /^[a-f0-9]{64}$/);
  assert.ok(record.expectedRevisions.some((condition) => condition.target === "session:s" && condition.revision === null));
  await saveTrainingSession(session);
  await assert.rejects(persistMutationJournal(record), (error: Error & { cause?: unknown }) => error.cause instanceof Error && /expected revisions are stale/.test(error.cause.message));
});
test("journal construction rejects writes that cross exact content package pins", async () => {
  const otherPin = { ...TEST_CONTENT_PACKAGE_PIN, contentReleaseId: "different-release" };
  const crossPinAttempt = {
    ...attempt,
    item: { ...attempt.item, packagePin: otherPin },
    reviewEvidence: { ...attempt.reviewEvidence, sourceItem: { ...attempt.reviewEvidence.sourceItem, packagePin: otherPin } },
  };
  await assert.rejects(
    () => buildMutationJournal({ operation: "submit_training_outcome", sessionId: session.id, trackId: session.trackId, identity: "cross-pin", writes: [{ kind: "put_attempt", record: crossPinAttempt }, { kind: "put_session", record: session }], createdAt: session.startedAt }),
    /cannot cross content package pins/u,
  );
});
test("practice submission recovers identically after every durable write boundary", async () => {
  const submittedAttempt = { ...attempt, id: "practice-failure-attempt", result: { kind: "incorrect" as const, earnedPoints: 0, maxPoints: 1 } };
  const review = {
    id: "practice-failure-review", trackId: "coding-interview-dsa-problem-solving", sourceAttemptId: submittedAttempt.id, sourceSessionId: "s",
    sourceItem: submittedAttempt.item, taxonomyOrSkillRefs: submittedAttempt.reviewEvidence.taxonomyOrSkillRefs,
    reasons: ["incorrect"] as const, dueAt: session.startedAt, createdAt: session.startedAt,
    consecutiveAfterDueSuccesses: 0, persistent: true,
  };
  const boundaries = [
    { kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_JOURNAL },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.trainingAttempt(submittedAttempt.id) },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.TRAINING_ATTEMPT_INDEX },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.reviewEntry(review.id) },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.REVIEW_INDEX },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.trainingSession(session.id) },
    { kind: "fail_on_key_write", key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION },
    { kind: "fail_on_key_remove", key: STORAGE_KEYS.ACTIVE_JOURNAL },
  ] as const;
  for (const boundary of boundaries) {
    const storage = new MemoryKeyValueStorage();
    installKeyValueStorageForTests(storage);
    await saveTrainingSession(session);
    storage.setFailurePlan(boundary);
    const submit = () => commitTrainingOutcome({ attempt: submittedAttempt, session, reviews: [review], createdAt: session.startedAt });
    await assert.rejects(submit(), boundary.key);
    storage.setFailurePlan(null);
    if (boundary.key === STORAGE_KEYS.ACTIVE_JOURNAL && boundary.kind === "fail_on_key_write") await submit();
    else await recoverPendingMutation();
    assert.equal(await getActiveMutationJournal(), null, boundary.key);
    assert.deepEqual((await getTrainingAttempts()).value, [submittedAttempt], boundary.key);
    assert.deepEqual((await getReviewQueueItems()).value, [review], boundary.key);
    assert.deepEqual((await getTrainingSessions()).value, [session], boundary.key);
  }
});
test("concurrent conflicting journal persists use one CAS winner and ownership-checked clear", async () => {
  const make = (identity: string) => buildMutationJournal({ operation: "submit_training_outcome" as const, sessionId: "s", trackId: "coding-interview-dsa-problem-solving", identity, writes: [{ kind: "put_attempt" as const, record: attempt }, { kind: "put_session" as const, record: session }], createdAt: session.startedAt });
  const [left, right] = await Promise.all([make("left"), make("right")]);
  const outcomes = await Promise.allSettled([persistMutationJournal(left), persistMutationJournal(right)]);
  assert.equal(outcomes.filter((outcome) => outcome.status === "fulfilled").length, 1);
  assert.equal(outcomes.filter((outcome) => outcome.status === "rejected").length, 1);
  const durable = await getActiveMutationJournal();
  assert.ok(durable);
  const loser = durable.commandIdentity.fingerprint === left.commandIdentity.fingerprint ? right : left;
  await assert.rejects(clearMutationJournal(loser.commandIdentity.fingerprint), /ownership/);
  assert.equal((await getActiveMutationJournal())?.commandIdentity.fingerprint, durable.commandIdentity.fingerprint);
  await clearMutationJournal(durable.commandIdentity.fingerprint);
  assert.equal(await getActiveMutationJournal(), null);
});
