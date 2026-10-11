import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";
import { createForegroundTimerState, createTrainingSession, createTrainingSessionDraft, getTrackRegistration, initialForegroundTimerForSession, type TrainingSession } from "../../domain";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { STORAGE_KEYS } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import { addReviewQueueItems } from "./reviewQueueRepository";

import { installMemoryStorage, attempt, journal, review, session, timestamp } from "../../testing/journalTestSupport";
import { captureLearningStateResetTargetPlan } from "./learningStateResetRepository";
import {
  createMutationPlanFingerprint,
  captureMutationPhysicalWrites,
  captureMutationExpectedRevisions,
  hasValidMutationJournalIntegrity,
  isMutationJournalRecord,
  persistMutationJournal,
} from "./mutationJournalRepository";
import { createMutationPlanFingerprint as fingerprint } from "./mutationJournalRepository";

function refingerprint(record: ReturnType<typeof journal>, physicalWrites: ReturnType<typeof captureMutationPhysicalWrites>) {
  const plan = { operation: record.operation, status: "journal_durable" as const, createdAt: record.createdAt, sessionId: record.sessionId, trackId: record.trackId,
    artifactSha256: record.artifactSha256, commandIdentity: record.commandIdentity, expectedRevisions: record.expectedRevisions, physicalWrites, writes: record.writes };
  return { ...record, physicalWrites, planFingerprint: fingerprint(plan) };
}

function timedSession(trackId = "coding-interview-dsa-problem-solving", id = "session-1"): TrainingSession {
  const base = session("active", id);
  return createTrainingSession({ ...base, trackId, configurationSnapshot: { kind: "practice", timer: "elapsedForeground" },
    itemOrder: base.itemOrder.map((occurrence) => ({ ...occurrence, item: { ...occurrence.item, trackId } })) });
}

function replanWithWrites(record: ReturnType<typeof journal>, writes: ReturnType<typeof journal>["writes"]) {
  const expectedRevisions = captureMutationExpectedRevisions(writes);
  const physicalWrites = captureMutationPhysicalWrites(writes);
  const plan = { operation: record.operation, status: "journal_durable" as const, createdAt: record.createdAt, sessionId: record.sessionId, trackId: record.trackId,
    artifactSha256: record.artifactSha256, commandIdentity: record.commandIdentity, expectedRevisions, physicalWrites, writes };
  return { ...record, expectedRevisions, physicalWrites, writes, planFingerprint: fingerprint(plan) };
}

beforeEach(() => installMemoryStorage());

test("start plan derives one exact initial timer only for foreground-timed sessions", () => {
  const timed = timedSession();
  const timer = initialForegroundTimerForSession(timed, getTrackRegistration(timed.trackId).familyId)!;
  const start = journal([{ kind: "put_session", record: timed }, { kind: "put_active_foreground_timer", record: timer }], "start_training_session");
  assert.equal(hasValidMutationJournalIntegrity(start), true);
  assert.equal(isMutationJournalRecord(start), true);
  assert.deepEqual(start.physicalWrites.find((step) => step.target === "active_foreground_timer")?.before, { kind: "absent" });
  assert.deepEqual(start.physicalWrites.find((step) => step.target === "active_foreground_timer")?.after, {
    kind: "present",
    envelope: { schemaIdentity: "patternly:canonical:v1", revision: 1, payload: timer },
    digest: sha256Utf8(JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision: 1, payload: timer })),
  });

  const families = [
    ["coding-interview-dsa-problem-solving", "coding_interview"],
    ["google-cloud-associate-cloud-engineer", "certification"],
    ["backend-system-design-interview", "design_interview"],
  ] as const;
  for (const [trackId, familyId] of families) {
    const candidate = timedSession(trackId, `start-${familyId}`);
    const derived = initialForegroundTimerForSession(candidate, getTrackRegistration(candidate.trackId).familyId)!;
    assert.equal(derived.familyId, familyId);
    assert.equal(derived.checkpointRevision, 1);
    assert.equal(derived.accumulatedForegroundMs, candidate.activeForegroundMs);
    assert.equal(derived.lastCheckpointAt, candidate.startedAt);
    assert.equal(derived.running, false);
    assert.equal(isMutationJournalRecord(journal([{ kind: "put_session", record: candidate }, { kind: "put_active_foreground_timer", record: derived }], "start_training_session")), true);
  }
  for (const [trackId, kind] of [["google-cloud-associate-cloud-engineer", "certificationSimulation"], ["backend-system-design-interview", "designInterviewSimulation"]] as const) {
    const absolute = createTrainingSession({ ...timedSession(trackId, `deadline-${kind}`), configurationSnapshot: { kind, timer: "absoluteDeadline", timerDeadlineAt: timestamp } });
    assert.equal(initialForegroundTimerForSession(absolute, getTrackRegistration(absolute.trackId).familyId), null);
    assert.equal(isMutationJournalRecord(journal([{ kind: "put_session", record: absolute }], "start_training_session")), true);
  }
});

test("rejects recomputed start journals with a missing or forged initial timer", () => {
  const timed = timedSession();
  const valid = journal([{ kind: "put_session", record: timed }, { kind: "put_active_foreground_timer", record: initialForegroundTimerForSession(timed, getTrackRegistration(timed.trackId).familyId)! }], "start_training_session");
  const timerWrite = valid.writes.find((write) => write.kind === "put_active_foreground_timer");
  assert.ok(timerWrite?.kind === "put_active_foreground_timer");
  const forgeries = [
    valid.writes.filter((write) => write.kind !== "put_active_foreground_timer"),
    [...valid.writes, timerWrite],
    valid.writes.map((write) => write.kind === "put_active_foreground_timer" ? { ...write, record: { ...write.record, familyId: "certification" } } : write),
    valid.writes.map((write) => write.kind === "put_active_foreground_timer" ? { ...write, record: { ...write.record, accumulatedForegroundMs: 10 } } : write),
    valid.writes.map((write) => write.kind === "put_active_foreground_timer" ? { ...write, record: { ...write.record, lastCheckpointAt: "2026-10-10T12:00:00.000Z" } } : write),
    valid.writes.map((write) => write.kind === "put_active_foreground_timer" ? { ...write, record: { ...write.record, checkpointRevision: 2 } } : write),
    valid.writes.map((write) => write.kind === "put_active_foreground_timer" ? { ...write, record: { ...write.record, running: true } } : write),
  ];
  for (const writes of forgeries) assert.equal(isMutationJournalRecord(replanWithWrites(valid, writes as typeof valid.writes)), false);
});

test("rejects recomputed start journals whose timer is ordered before session or draft", () => {
  const timed = timedSession();
  const timerWrite = { kind: "put_active_foreground_timer" as const, record: initialForegroundTimerForSession(timed, getTrackRegistration(timed.trackId).familyId)! };
  const sessionWrite = { kind: "put_session" as const, record: timed };
  const noDraft = journal([sessionWrite, timerWrite], "start_training_session");
  const timerBeforeSessionAccepted = isMutationJournalRecord(replanWithWrites(noDraft, [timerWrite, sessionWrite]));

  const simulation = createTrainingSession({ ...timed, modeId: "coding-interview-simulation", configurationSnapshot: {
    kind: "algorithmsInterviewSimulation", feedbackMode: "atSessionEnd", answerChanges: "untilFinalSubmission",
    navigation: "free", submission: "manualOrForegroundTimeout", timer: "countdownForeground", timerDurationMs: 2_700_000,
    simulationProfileId: "algorithms-interview-simulation-v1", simulationProfileVersion: "1",
    simulationBlueprintId: "coding-interview-interview-simulation-v1", simulationBlueprintVersion: "1",
    simulationPoolId: "algorithms-interview-simulation-v1", simulationPoolVersion: "1",
  } });
  const draftWrite = { kind: "put_active_session_draft" as const, record: createTrainingSessionDraft({
    sessionId: simulation.id, trackId: simulation.trackId, familyId: "coding_interview",
    responsesByOccurrenceId: {}, flaggedOccurrenceIds: [], updatedAt: simulation.startedAt,
  }) };
  const simulationTimerWrite = { kind: "put_active_foreground_timer" as const, record: initialForegroundTimerForSession(simulation, getTrackRegistration(simulation.trackId).familyId)! };
  const withDraft = journal([{ kind: "put_session", record: simulation }, draftWrite, simulationTimerWrite], "start_training_session");
  const timerBeforeDraftAccepted = isMutationJournalRecord(replanWithWrites(withDraft, [
    { kind: "put_session", record: simulation }, simulationTimerWrite, draftWrite,
  ]));
  assert.deepEqual([timerBeforeSessionAccepted, timerBeforeDraftAccepted], [false, false]);
});

test("start rejects every existing timer and a timer that races the pre-journal absence fence", async () => {
  const storage = installMemoryStorage();
  const timed = timedSession();
  const existing = createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: getTrackRegistration(timed.trackId).familyId,
    sessionId: timed.id, trackId: timed.trackId, accumulatedForegroundMs: 0, checkpointRevision: 1, lastCheckpointAt: timed.startedAt, running: false });
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, existing);
  assert.throws(() => journal([{ kind: "put_session", record: timed }, { kind: "put_active_foreground_timer", record: existing }], "start_training_session"));
  const priorTimer = storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), undefined);

  storage.remove(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
  const absentPlan = journal([{ kind: "put_session", record: timed }, { kind: "put_active_foreground_timer", record: existing }], "start_training_session");
  storage.setFailurePlan({ kind: "fail_on_key_read", key: STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER });
  await assert.rejects(() => persistMutationJournal(absentPlan));
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), undefined, "a failed fresh timer read cannot durably claim the start journal");
  storage.setFailurePlan(null);
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, { ...existing, sessionId: "foreign-session" });
  const racedTimer = storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER);
  await assert.rejects(() => persistMutationJournal(absentPlan));
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_JOURNAL), undefined);
  assert.equal(storage.getString(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER), racedTimer);
  assert.notEqual(priorTimer, undefined);
});

test("accepts a journal whose scope and writes use one exact resolved artifact", () => {
  const record = journal([
    { kind: "put_attempt", record: attempt() },
    { kind: "put_session", record: session() },
  ]);

  assert.equal(hasValidMutationJournalIntegrity(record), true);
  assert.equal(isMutationJournalRecord(record), true);
  assert.equal(createMutationPlanFingerprint({
    operation: record.operation,
    status: "journal_durable",
    createdAt: record.createdAt,
    sessionId: record.sessionId,
    trackId: record.trackId,
    artifactSha256: record.artifactSha256,
    commandIdentity: record.commandIdentity,
    expectedRevisions: record.expectedRevisions,
    physicalWrites: record.physicalWrites,
    writes: record.writes,
  }), record.planFingerprint);
});

test("uses the complete resolved reference when validating attempt and session relationships", () => {
  const base = journal([
    { kind: "put_attempt", record: attempt() },
    { kind: "put_session", record: session() },
  ]);
  const changedAttempt = {
    ...attempt(),
    item: { ...attempt().item, questionId: "different-question" },
    reviewEvidence: { ...attempt().reviewEvidence, sourceItem: { ...attempt().item, questionId: "different-question" } },
  };
  const candidate = {
    ...base,
    writes: [
      { kind: "put_attempt" as const, record: changedAttempt },
      { kind: "put_session" as const, record: session() },
    ],
  };
  const withFingerprint = {
    ...candidate,
    physicalWrites: captureMutationPhysicalWrites(candidate.writes),
    planFingerprint: createMutationPlanFingerprint({
      operation: candidate.operation,
      status: "journal_durable" as const,
      createdAt: candidate.createdAt,
      sessionId: candidate.sessionId,
      trackId: candidate.trackId,
      artifactSha256: candidate.artifactSha256,
      commandIdentity: candidate.commandIdentity,
      expectedRevisions: candidate.expectedRevisions,
      physicalWrites: captureMutationPhysicalWrites(candidate.writes),
      writes: candidate.writes,
    }),
  };

  assert.equal(hasValidMutationJournalIntegrity(withFingerprint), true);
  assert.equal(isMutationJournalRecord(withFingerprint), false);
});

test("requires an exact lowercase artifact SHA and rejects legacy top-level identity fields", () => {
  const record = journal([
    { kind: "put_attempt", record: attempt() },
    { kind: "put_session", record: session() },
  ]);
  const uppercase = {
    ...record,
    artifactSha256: record.artifactSha256!.toUpperCase(),
  };
  const { artifactSha256: _artifactSha256, ...withoutCanonicalIdentity } = record;
  const legacy = {
    ...withoutCanonicalIdentity,
    packagePin: { packageIdentity: "a".repeat(64), packageVersion: "v1", contentReleaseId: "release" },
  };

  assert.equal(hasValidMutationJournalIntegrity(uppercase), false);
  assert.equal(hasValidMutationJournalIntegrity(legacy), false);
});

test("rejects additional, missing, duplicate, and reordered physical targets even with a recomputed fingerprint", () => {
  const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]);
  const steps = [...record.physicalWrites];
  const variants = [
    [...steps, steps[0]!],
    steps.slice(1),
    [...steps.slice(0, 1), steps[0]!, ...steps.slice(1)],
    [steps[1]!, steps[0]!, ...steps.slice(2)],
  ];
  for (const physicalWrites of variants) assert.equal(hasValidMutationJournalIntegrity(refingerprint(record, physicalWrites)), false);
});

test("derives the final attempt index from its captured prior envelope, retaining unrelated ids", () => {
  installMemoryStorage();
  writeCanonicalJson(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, ["unrelated-attempt"]);
  const record = journal([{ kind: "put_attempt", record: attempt() }, { kind: "put_session", record: session() }]);
  const physicalWrites = record.physicalWrites.map((step) => {
    if (step.target !== "attempt_index" || step.after.kind !== "present") return step;
    const envelope = { ...step.after.envelope, payload: [] };
    return { ...step, after: { ...step.after, envelope, digest: sha256Utf8(JSON.stringify(envelope)) } };
  });
  assert.equal(hasValidMutationJournalIntegrity(refingerprint(record, physicalWrites)), false);
});

test("rejects a recomputed same-revision forged before payload digest for a mutable review without changing bytes", async () => {
  const storage = installMemoryStorage();
  const prior = review();
  await addReviewQueueItems([prior]);
  const next = { ...prior, dueAt: "2026-07-16T00:00:00.000Z" };
  const record = journal([{ kind: "update_review_entry", record: next, transitionId: "attempt-1" }], "set_review_entry");
  const physicalWrites = record.physicalWrites.map((step) => {
    if (step.target !== `review:${prior.id}` || step.before.kind !== "present" || step.after.kind !== "present") return step;
    const forgedPayloadDigest = sha256Utf8(JSON.stringify(step.after.envelope.payload));
    const envelope = { ...step.after.envelope, revision: step.before.revision };
    return { ...step, before: { ...step.before, payloadDigest: forgedPayloadDigest }, after: { ...step.after, envelope, digest: step.before.digest } };
  });
  const forged = refingerprint(record, physicalWrites);
  assert.equal(hasValidMutationJournalIntegrity(forged), true, "the persisted shape and derived operation are internally consistent");
  const beforePersist = storage.snapshot();

  await assert.rejects(() => persistMutationJournal(forged));
  assert.deepEqual(storage.snapshot(), beforePersist);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
});

test("rejects standalone review removal when the journal session differs from the source session", async () => {
  const storage = installMemoryStorage();
  const valid = journal([{ kind: "delete_review_entry", record: review() }], "remove_review_entry");
  const writes = [{ kind: "delete_review_entry" as const, record: { ...review(), sourceSessionId: "another-session" } }];
  const physicalWrites = captureMutationPhysicalWrites(writes);
  const plan = { operation: valid.operation, status: "journal_durable" as const, createdAt: valid.createdAt, sessionId: valid.sessionId, trackId: valid.trackId,
    artifactSha256: valid.artifactSha256, commandIdentity: valid.commandIdentity, expectedRevisions: valid.expectedRevisions, physicalWrites, writes };
  const forged = { ...valid, writes, physicalWrites, planFingerprint: fingerprint(plan) };
  const before = storage.snapshot();

  await assert.rejects(() => persistMutationJournal(forged));
  assert.deepEqual(storage.snapshot(), before);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
});

test("permits a reset journal only with a null artifact scope", () => {
  const reset = journal([{ kind: "clear_learning_state", targetPlan: captureLearningStateResetTargetPlan() }], "reset_learning_state");
  assert.equal(isMutationJournalRecord(reset), true);
  const nonReset = { ...reset, operation: "submit_training_outcome" as const };
  assert.equal(hasValidMutationJournalIntegrity(nonReset), false);
});

test("refuses to journal terminal cleanup when the foreground timer belongs to another session", () => {
  const storage = installMemoryStorage();
  const foreignTimer = createForegroundTimerState({ schemaVersion: 1, timerVersion: 1, familyId: "coding-interview", sessionId: "foreign-session",
    trackId: "coding-interview-dsa-problem-solving", accumulatedForegroundMs: 5, checkpointRevision: 1, lastCheckpointAt: "2026-07-15T10:00:00.000Z", running: false });
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, foreignTimer);
  const before = storage.snapshot();

  assert.throws(() => journal([
    { kind: "put_session", record: session("abandoned") },
    { kind: "clear_active_session", sessionId: "session-1" },
  ], "abandon_training_session"));
  assert.deepEqual(storage.snapshot(), before);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false);
});
