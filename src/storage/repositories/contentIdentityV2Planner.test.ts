import assert from "node:assert/strict";
import test from "node:test";
import { canonicalJsonV1, canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { CANONICAL_RECORD_SCHEMA } from "./canonicalRecordCodec";
import {
  CONTENT_IDENTITY_V2_SCHEMA,
  createContentIdentityV2Record,
  isContentIdentityV2Record,
  type ContentIdentityV2Record,
} from "../contracts/contentIdentityV2";
import {
  ContentIdentityV2PlannerError,
  assertCloudProtocolUpgradeComplete,
  isContentIdentityV2PlanBundle,
  migrateContentIdentityV2,
  planContentIdentityV2,
} from "./contentIdentityV2Planner";
import { CONTENT_IDENTITY_MIGRATION_NAMESPACE } from "./contentIdentityMigration";
import { accountDataRecordFingerprint, accountDataRecordKey, isCanonicalAccountSyncState } from "./accountDataRepository";
import { createMutationPlanFingerprint } from "./mutationJournalRepository";

const SHA = "a".repeat(64);
const UNKNOWN_SHA = "b".repeat(64);
const TRACK = "coding-interview-dsa-problem-solving";
const VERSION = "content-v1";
const RELEASE = "canonical-content-v1";
const ARTIFACT_SHAS = ["a", "b", "c", "d", "e", "f", "0", "1", "2"] as const;
const ARTIFACTS = Object.freeze(Array.from({ length: 9 }, (_, index) => Object.freeze({
  trackId: index === 0 ? TRACK : `track-${index + 1}`,
  contentVersion: index === 0 ? VERSION : `content-v${index + 1}`,
  artifactSha256: `${ARTIFACT_SHAS[index]}${ARTIFACT_SHAS[index]}`.repeat(32),
  contentReleaseId: RELEASE,
  questionIds: Object.freeze(index === 0 ? ["question-1", "question-2"] : [`question-${index + 1}`]),
})));

function envelope(payload: unknown, revision = 1): string {
  return canonicalSerialize({ schemaIdentity: CANONICAL_RECORD_SCHEMA, revision, payload });
}

function pin(sha = SHA, version = VERSION): Record<string, string> {
  return { packageIdentity: sha, packageVersion: version, contentReleaseId: RELEASE };
}

function ref(questionId = "question-1", packagePin = pin()): Record<string, unknown> {
  return { trackId: TRACK, itemId: questionId, contentVersion: VERSION, packagePin };
}

function isAccountDataRecordShapeForTrack(value: unknown, trackId: string): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  const requiredKeys = ["fingerprint", "recordId", "recordType", "state", "trackId", "version"];
  const outboxKeys = ["mutationId", "expectedVersion", "attemptCount", "lastErrorCode", "status", "sequence"];
  return requiredKeys.every((key) => Object.hasOwn(record, key)) &&
    Object.keys(record).every((key) => requiredKeys.includes(key) || outboxKeys.includes(key)) &&
    record.trackId === trackId && typeof record.recordId === "string" && record.recordId.length > 0 &&
    typeof record.recordType === "string" && typeof record.state === "object" && record.state !== null &&
    typeof record.fingerprint === "string" && /^[a-f0-9]{64}$/u.test(record.fingerprint) &&
    typeof record.version === "number" && Number.isSafeInteger(record.version) && record.version >= 0;
}

function expectedAccountMutationId(accountId: string, record: Readonly<Record<string, unknown>>, expectedVersion: number | null): string {
  return `mutation_${sha256Utf8(canonicalSerialize({
    accountId,
    key: accountDataRecordKey({ recordId: record.recordId as string, recordType: record.recordType as "active_track", trackId: record.trackId as string }),
    expectedVersion,
    fingerprint: record.fingerprint,
  }))}`;
}

function expectedAccountSyncPlanId(accountId: string, plan: Readonly<Record<string, unknown>>): string {
  const items = plan.items as readonly Readonly<Record<string, unknown>>[];
  return `plan_${sha256Utf8(canonicalJsonV1({
    accountId,
    snapshotVersion: plan.snapshotVersion,
    expectedAccountRevision: plan.expectedAccountRevision,
    highWatermark: plan.highWatermark,
    items: items.map((item) => ({
      sequence: item.sequence,
      recordKey: item.recordKey,
      mutationId: item.mutationId,
      fingerprint: (item.payload as Record<string, unknown>).fingerprint,
    })),
  }))}`;
}

function baseSource(overrides: Readonly<Record<string, unknown>> = {}): readonly { key: string; raw: string }[] {
  const session = {
    id: "session-1",
    trackId: TRACK,
    modeId: "guided",
    configurationSnapshot: { requestedLength: 1 },
    activeForegroundMs: 0,
    contentVersion: VERSION,
    packagePin: pin(),
    status: "completed",
    itemOrder: [{ occurrenceId: "occurrence-1", item: ref() }],
    currentItemIndex: 0,
    requestedLength: 1,
    actualLength: 1,
    optionOrderByOccurrence: {},
    conditionalReinsertSlots: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    completedAt: "2026-01-01T00:01:00.000Z",
  };
  const attempt = {
    id: "attempt-1",
    sessionId: "session-1",
    trackId: TRACK,
    modeId: "guided",
    occurrenceId: "occurrence-1",
    item: ref(),
    reviewEvidence: { sourceItem: ref(), taxonomyOrSkillRefs: [] },
    response: { answer: "user-answer" },
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    answeredAt: "2026-01-01T00:00:00.000Z",
    committedAt: "2026-01-01T00:00:01.000Z",
  };
  const review = {
    id: "review-1",
    trackId: TRACK,
    sourceAttemptId: "attempt-1",
    sourceSessionId: "session-1",
    sourceItem: ref(),
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: "2026-01-02T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
  const records = [
    { key: STORAGE_KEYS.METADATA, payload: { namespace: STORAGE_NAMESPACE, schemaVersion: 1 } },
    { key: STORAGE_KEYS.TRAINING_SESSION_INDEX, payload: ["session-1"] },
    { key: STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, payload: ["attempt-1"] },
    { key: STORAGE_KEYS.REVIEW_INDEX, payload: ["review-1"] },
    { key: STORAGE_KEYS.trainingSession("session-1"), payload: session },
    { key: STORAGE_KEYS.trainingAttempt("attempt-1"), payload: attempt },
    { key: STORAGE_KEYS.reviewEntry("review-1"), payload: review },
    { key: STORAGE_KEYS.trainingSessionResult("session-1"), payload: { id: "result-1", sessionId: "session-1", trackId: TRACK, totalOccurrences: 1, answeredOccurrenceIds: ["occurrence-1"], unansweredOccurrenceIds: [], completedAt: "2026-01-01T00:01:00.000Z", evidence: { familyId: "future-family", details: { total: 1 } } } },
    { key: `${STORAGE_NAMESPACE}settings`, payload: { appearance: "system", language: "en" } },
  ];
  const merged = records.map((record) => ({ ...record, payload: overrides[record.key] ?? record.payload }));
  return Object.freeze(merged.map((record) => Object.freeze({ key: record.key, raw: envelope(record.payload) })));
}

test("owner dispatch maps sessions, attempts, reviews and preserves facts without legacy identity", () => {
  const bundle = planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS });
  assert.equal(bundle.cloudProtocolUpgradeRequired, true);
  assert.equal(isContentIdentityV2PlanBundle(bundle), true);
  assert.equal(bundle.certificate.cloudProtocolUpgradeRequired, true);
  const session = bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.trainingSession("session-1"));
  assert.ok(session);
  const parsed = JSON.parse(session.raw) as { payload: unknown };
  assert.equal(isContentIdentityV2Record(parsed.payload), true);
  const target = createContentIdentityV2Record(parsed.payload);
  assert.equal((target.value as Record<string, unknown>).artifactSha256, SHA);
  assert.equal("packagePin" in (target.value as Record<string, unknown>), false);
  assert.equal((target.value as Record<string, unknown>).itemOrder !== undefined, true);
  assert.equal(target.preservation.answersDigest.length, 64);
  assert.equal(JSON.stringify(target).includes("itemId"), false);
});

test("v2 records are exact, deeply frozen, deterministic, and reject forged legacy fields", () => {
  const first = planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS });
  const second = planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS });
  assert.deepEqual(first.targetRecords, second.targetRecords);
  assert.equal(first.certificate.planId, second.certificate.planId);
  const session = first.targetRecords.find((record) => record.key === STORAGE_KEYS.trainingSession("session-1"));
  assert.ok(session);
  const payload = JSON.parse(session.raw) as { payload: ContentIdentityV2Record };
  const frozen = createContentIdentityV2Record(payload.payload);
  assert.equal(Object.isFrozen(frozen), true);
  assert.equal(Object.isFrozen(frozen.value), true);
  assert.equal(Object.isFrozen(frozen.preservation), true);
  assert.throws(() => createContentIdentityV2Record({ ...payload.payload, extra: true }), /invalid_v2_record/);
  assert.throws(() => createContentIdentityV2Record({ ...payload.payload, value: { packagePin: pin() } }), /forbidden_legacy_identity/);
  assert.equal(isContentIdentityV2PlanBundle({ ...first }), false);
});

test("one legacy record can yield multiple typed tombstone bindings and no active pointer", () => {
  const source = baseSource({
    [STORAGE_KEYS.trainingSession("session-1")]: {
      id: "session-1", trackId: TRACK, modeId: "guided", configurationSnapshot: { requestedLength: 2 }, activeForegroundMs: 0,
      contentVersion: VERSION, packagePin: pin(UNKNOWN_SHA), status: "active",
      itemOrder: [{ occurrenceId: "occurrence-1", item: ref("question-1", pin(UNKNOWN_SHA)) }, { occurrenceId: "occurrence-2", item: ref("question-2", pin(UNKNOWN_SHA)) }],
      currentItemIndex: 0, requestedLength: 2, actualLength: 2, optionOrderByOccurrence: {}, conditionalReinsertSlots: [], startedAt: "2026-01-01T00:00:00.000Z",
    },
    [STORAGE_KEYS.ACTIVE_TRAINING_SESSION]: "session-1",
  }).filter((record) => record.key !== STORAGE_KEYS.trainingSessionResult("session-1"));
  const withPointer = [...source, { key: STORAGE_KEYS.ACTIVE_TRAINING_SESSION, raw: envelope("session-1") }];
  const bundle = planContentIdentityV2({ source: withPointer, artifacts: ARTIFACTS });
  const session = bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.trainingSession("session-1"));
  assert.ok(session);
  const payload = JSON.parse(session.raw) as { payload: { identity: readonly { resolution: { kind: string } }[]; value: Record<string, unknown> } };
  assert.equal(payload.payload.identity.length, 2);
  assert.equal(payload.payload.identity.some((binding) => binding.resolution.kind === "tombstone"), true);
  assert.equal(bundle.targetRecords.some((record) => record.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
});

test("unknown keys and malformed envelopes fail closed before a C0 plan exists", () => {
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: `${STORAGE_NAMESPACE}unknown`, raw: envelope({ packagePin: pin() }) }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "unregistered_key");
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: `${STORAGE_NAMESPACE}settings:bad`, raw: "not-json" }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "unregistered_key");
});

test("known malformed owners, orphan/duplicate indices, and terminal history fail closed deterministically", () => {
  const malformedSettings = baseSource().map((record) => record.key === STORAGE_KEYS.SETTINGS ? { ...record, raw: "not-json" } : record);
  assert.throws(() => planContentIdentityV2({ source: malformedSettings, artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "malformed_envelope");
  const settingsWithForeignPin = baseSource().map((record) => record.key === STORAGE_KEYS.SETTINGS ? { ...record, raw: envelope({ packagePin: pin() }) } : record);
  assert.throws(() => planContentIdentityV2({ source: settingsWithForeignPin, artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "owner_guard_failed");
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope({}) }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "owner_guard_failed");
  for (const ids of [["missing-session"], ["session-1", "session-1"]]) {
    assert.throws(() => planContentIdentityV2({ source: baseSource({ [STORAGE_KEYS.TRAINING_SESSION_INDEX]: ids }), artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "relationship_invalid");
  }
  const abandoned = baseSource({ [STORAGE_KEYS.trainingSession("session-1")]: {
    id: "session-1", trackId: TRACK, modeId: "guided", configurationSnapshot: { requestedLength: 1 }, activeForegroundMs: 0,
    contentVersion: VERSION, packagePin: pin(), status: "abandoned",
    itemOrder: [{ occurrenceId: "occurrence-1", item: ref() }],
    currentItemIndex: 0, requestedLength: 1, actualLength: 1, optionOrderByOccurrence: {}, conditionalReinsertSlots: [], startedAt: "2026-01-01T00:00:00.000Z",
  } }).filter((record) => record.key !== STORAGE_KEYS.trainingSessionResult("session-1"));
  assert.ok(planContentIdentityV2({ source: abandoned, artifacts: ARTIFACTS }).targetRecords.some((record) => record.key === STORAGE_KEYS.trainingAttempt("attempt-1")));
});

test("version and hash mismatches become typed tombstones without fallback artifact assignment", () => {
  const source = baseSource({
    [STORAGE_KEYS.TRAINING_SESSION_INDEX]: ["session-1"],
    [STORAGE_KEYS.TRAINING_ATTEMPT_INDEX]: [],
    [STORAGE_KEYS.REVIEW_INDEX]: [],
    [STORAGE_KEYS.trainingSession("session-1")]: {
      id: "session-1", trackId: TRACK, modeId: "guided", configurationSnapshot: { requestedLength: 1 }, activeForegroundMs: 0,
      contentVersion: VERSION, packagePin: { ...pin(), packageVersion: "stale-version" }, status: "completed",
      itemOrder: [{ occurrenceId: "occurrence-1", item: ref("question-1", { ...pin(), packageVersion: "stale-version" }) }],
      currentItemIndex: 0, requestedLength: 1, actualLength: 1, optionOrderByOccurrence: {}, conditionalReinsertSlots: [], startedAt: "2026-01-01T00:00:00.000Z", completedAt: "2026-01-01T00:01:00.000Z",
    },
  }).filter((record) => ![STORAGE_KEYS.trainingAttempt("attempt-1"), STORAGE_KEYS.reviewEntry("review-1"), STORAGE_KEYS.trainingSessionResult("session-1")].includes(record.key));
  const bundle = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const session = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.trainingSession("session-1"))!.raw) as { payload: ContentIdentityV2Record };
  const binding = session.payload.identity[0]!;
  assert.equal(binding.resolution.kind, "tombstone");
  if (binding.resolution.kind === "tombstone") assert.equal(binding.resolution.tombstone.reason, "stale_content_version");
  assert.equal(JSON.stringify(session.payload.value).includes("packagePin"), false);
  // The top-level session preflight failed, so no resolved artifact may leak
  // into the value or any child binding.
  assert.equal(JSON.stringify(session.payload.value).includes("artifactSha256"), false);
  assert.equal(session.payload.identity.every((entry) => entry.resolution.kind === "tombstone"), true);
});

test("content report keeps itemId only inside its named transport owner", () => {
  const report = [{
    input: {
      clientSubmissionId: "submission-1", trackId: TRACK, contentVersion: VERSION, itemId: "question-1", reason: "incorrect_answer",
      description: "The answer is unclear.", linkAccount: false, context: {
        releasePackageId: RELEASE, trackNode: null, modeRoute: "answer_review", locale: "en", appBuild: "test", platform: "ios", occurredAt: "2026-01-01T00:00:00.000Z",
      },
    },
    status: "queued", attemptCount: 0, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", lastErrorCode: null,
  }];
  const source = [...baseSource(), { key: STORAGE_KEYS.CONTENT_REPORT_OUTBOX, raw: envelope(report) }];
  const bundle = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const target = bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.CONTENT_REPORT_OUTBOX);
  assert.ok(target);
  const parsed = JSON.parse(target.raw) as { payload: ContentIdentityV2Record };
  assert.equal(isContentIdentityV2Record(parsed.payload), true);
  assert.equal(JSON.stringify(parsed.payload.value).includes('"itemId"'), true);
  assert.equal(parsed.payload.identity.length, 0);
});

test("report durable identity collisions block the plan while preserving the named itemId adapter", () => {
  const reportEntry = {
    input: {
      clientSubmissionId: "duplicate-submission", trackId: TRACK, contentVersion: VERSION, itemId: "question-1", reason: "incorrect_answer",
      description: "The answer is unclear.", context: {
        releasePackageId: RELEASE, trackNode: null, modeRoute: "answer_review", locale: "en", appBuild: "test", platform: "ios", occurredAt: "2026-01-01T00:00:00.000Z",
      },
    },
    status: "queued", attemptCount: 0, createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z", lastErrorCode: null,
  };
  const source = [...baseSource(), { key: STORAGE_KEYS.CONTENT_REPORT_OUTBOX, raw: envelope([reportEntry, reportEntry]) }];
  assert.throws(() => planContentIdentityV2({ source, artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "relationship_invalid");
});

test("explicit plan, notification, and active-journal handlers remove package pins without recursive passthrough", () => {
  const notification = {
    schemaVersion: 1, enabled: true,
    identity: { trackId: TRACK, goalRevision: 1, planId: "plan-one", planRevision: 1, storageRevision: 1, commandId: "command-one", timezone: "Europe/Warsaw", contentVersion: VERSION, contentPackagePin: pin() },
    schedules: [{ slotId: "slot:mon", day: "mon", localTime: "18:00", notificationId: "native-mon" }],
    legacyNotificationIds: [], pending: null,
  };
  const journalPlan = {
    operation: "reset_learning_state" as const, status: "journal_durable" as const, createdAt: "2026-01-01T00:00:00.000Z", sessionId: "session-1", trackId: TRACK,
    packagePin: null, commandIdentity: { version: 1 as const, fingerprint: SHA }, expectedRevisions: [
      "active_session", "active_session_draft", "active_foreground_timer", "session_index", "attempt_index", "review_index",
    ].map((target) => ({ target, revision: null as number | null })), writes: [{ kind: "clear_learning_state" as const }],
  };
  const journal = { journalId: `journal:${SHA}`, ...journalPlan, planFingerprint: createMutationPlanFingerprint(journalPlan) };
  const source = [
    ...baseSource(),
    { key: STORAGE_KEYS.NOTIFICATION_SETTINGS, raw: envelope(notification) },
    { key: STORAGE_KEYS.learningPlan(TRACK), raw: envelope({
      schemaVersion: 1,
      planId: "plan-one",
      trackId: TRACK,
      goalRevision: 1,
      status: "accepted",
      timezone: "Europe/Warsaw",
      contentVersion: VERSION,
      contentPackagePin: pin(),
      acceptedTarget: { meaning: "event", targetDate: null },
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      planRevision: 1,
      commandId: "command-one",
      slots: [{ slotId: "slot:mon", day: "mon", localTime: "18:00", sessionLength: 10 }],
    }) },
    { key: STORAGE_KEYS.ACTIVE_JOURNAL, raw: envelope(journal) },
  ];
  const bundle = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const notificationRecord = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.NOTIFICATION_SETTINGS)!.raw) as { payload: ContentIdentityV2Record };
  const planRecord = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.learningPlan(TRACK))!.raw) as { payload: ContentIdentityV2Record };
  const journalRecord = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.ACTIVE_JOURNAL)!.raw) as { payload: ContentIdentityV2Record };
  assert.equal((notificationRecord.payload.value as { identity: { artifactSha256: string } }).identity.artifactSha256, SHA);
  assert.equal((planRecord.payload.value as { artifactSha256: string }).artifactSha256, SHA);
  assert.equal((journalRecord.payload.value as { artifactSha256: null }).artifactSha256, null);
  assert.equal(JSON.stringify(notificationRecord.payload.value).includes("packagePin"), false);
  assert.equal(JSON.stringify(planRecord.payload.value).includes("contentPackagePin"), false);
  assert.equal(JSON.stringify(journalRecord.payload.value).includes("packagePin"), false);
});

test("account guestBackup is allowlisted, nested through the same owner dispatch, and rejects non-learning keys", () => {
  const nestedKey = STORAGE_KEYS.trainingSession("session-1");
  const nestedRaw = baseSource().find((record) => record.key === nestedKey)!.raw;
  const accountState = {
    protocolVersion: 2, accountId: "account-1", status: "syncing", localDatasetVersion: 1, localDatasetFingerprint: null,
    remoteAccountRevision: 1, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null,
    acknowledged: {}, outbox: [], materialization: { kind: "discardGuest" as const, accountId: "account-1", installationId: "installation-1", phase: "prepared" as const, guestBackup: [{ key: nestedKey, value: nestedRaw }] },
    pendingConfirmation: null, syncPlan: null, outboxSequence: 0, highWatermark: 0,
  };
  const source = [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope(accountState) }];
  const bundle = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const target = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.ACCOUNT_SYNC)!.raw) as { payload: ContentIdentityV2Record };
  const backup = (target.payload.value as { materialization: { guestBackup: readonly [{ value: string }] } }).materialization.guestBackup[0]!;
  assert.equal(backup.value.includes(CONTENT_IDENTITY_V2_SCHEMA), true);
  assert.equal(JSON.stringify(target.payload).includes("packagePin"), false);
  const forbidden = { ...accountState, materialization: { ...accountState.materialization, guestBackup: [{ key: STORAGE_KEYS.ACCOUNT_SYNC, value: envelope({}) }] } };
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope(forbidden) }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "owner_guard_failed");
});

test("account active-track metadata packagePin is not mapped and cloud certificate blocks rollout", () => {
  const accountRecord = {
    fingerprint: "",
    recordId: "current",
    recordType: "active_track" as const,
    state: { trackId: TRACK, packagePin: pin() },
    trackId: TRACK,
    version: 1,
  };
  accountRecord.fingerprint = accountDataRecordFingerprint(accountRecord);
  const accountState = {
    protocolVersion: 2, accountId: "account-1", status: "synced", localDatasetVersion: 1, localDatasetFingerprint: null,
    remoteAccountRevision: 1, lastSuccessfulSyncAt: null, pendingMutationCount: 0, blockingConflictCode: null, lastFailureCode: null,
    acknowledged: {}, outbox: [{ ...accountRecord, mutationId: "m1", expectedVersion: null, attemptCount: 0, lastErrorCode: null, status: "pending", sequence: 1 }],
    materialization: null, pendingConfirmation: null, syncPlan: null, outboxSequence: 1, highWatermark: 1,
  };
  const bundle = planContentIdentityV2({ source: [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope(accountState) }], artifacts: ARTIFACTS });
  const target = bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.ACCOUNT_SYNC);
  assert.ok(target);
  const parsed = JSON.parse(target.raw) as { payload: ContentIdentityV2Record };
  const value = parsed.payload.value as { outbox: readonly [{ state: Record<string, unknown> }] };
  assert.equal("packagePin" in value.outbox[0].state, false);
  assert.throws(() => assertCloudProtocolUpgradeComplete(bundle), (error: unknown) => error instanceof Error && error.message === "cloud_protocol_upgrade_required");
});

test("account target recomputes direct, outbox, and sync-plan identities deterministically", () => {
  const accountId = "account-1";
  const accountRecord = {
    fingerprint: "",
    recordId: "current",
    recordType: "active_track" as const,
    state: { trackId: TRACK, packagePin: pin() },
    trackId: TRACK,
    version: 1,
  };
  accountRecord.fingerprint = accountDataRecordFingerprint(accountRecord);
  const syncPlanPayload = { ...accountRecord };
  const syncPlan = {
    version: 3 as const,
    planId: "legacy-plan-id",
    snapshotVersion: 1,
    expectedAccountRevision: 1,
    highWatermark: 1,
    items: [{
      sequence: 1,
      recordKey: accountDataRecordKey(accountRecord),
      mutationId: "legacy-plan-mutation",
      expectedVersion: null,
      payload: syncPlanPayload,
      groupId: null,
      status: "pending" as const,
    }],
  };
  const accountState = {
    protocolVersion: 2 as const,
    accountId,
    status: "synced" as const,
    localDatasetVersion: 1,
    localDatasetFingerprint: null,
    remoteAccountRevision: 1,
    lastSuccessfulSyncAt: null,
    pendingMutationCount: 1,
    blockingConflictCode: null,
    lastFailureCode: null,
    acknowledged: {},
    outbox: [{ ...accountRecord, mutationId: "legacy-outbox-mutation", expectedVersion: null, attemptCount: 0, lastErrorCode: null, status: "pending" as const, sequence: 1 }],
    materialization: null,
    pendingConfirmation: null,
    syncPlan,
    outboxSequence: 1,
    highWatermark: 1,
  };
  assert.equal(isCanonicalAccountSyncState(accountState), true);

  const source = [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope(accountState) }];
  const first = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const retry = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  assert.deepEqual(first.targetRecords, retry.targetRecords);

  const target = JSON.parse(first.targetRecords.find((record) => record.key === STORAGE_KEYS.ACCOUNT_SYNC)!.raw) as { payload: ContentIdentityV2Record };
  const value = target.payload.value as {
    outbox: readonly [Record<string, unknown>];
    syncPlan: Record<string, unknown> & { items: readonly [Record<string, unknown>] };
  };
  const targetEntry = value.outbox[0]!;
  const targetState = targetEntry.state as Record<string, unknown>;
  assert.equal(isAccountDataRecordShapeForTrack(targetEntry, TRACK), true);
  assert.equal(targetEntry.fingerprint, accountDataRecordFingerprint({ recordId: "current", recordType: "active_track", state: targetState, trackId: TRACK }));
  assert.equal(targetEntry.mutationId, expectedAccountMutationId(accountId, targetEntry, null));
  assert.equal(targetState.packagePin, undefined);

  const targetPlan = value.syncPlan;
  const targetItem = targetPlan.items[0]!;
  const targetPlanPayload = targetItem.payload as Record<string, unknown>;
  assert.equal(isAccountDataRecordShapeForTrack(targetPlanPayload, TRACK), true);
  assert.equal(targetPlanPayload.fingerprint, targetEntry.fingerprint);
  assert.equal(targetItem.mutationId, expectedAccountMutationId(accountId, targetPlanPayload, null));
  assert.equal(targetPlan.planId, expectedAccountSyncPlanId(accountId, targetPlan));
  assert.equal(isCanonicalAccountSyncState(value), true);
});

test("sealed bundle runs through the C0 fence and leaves no writes in planning", () => {
  const storage = new MemoryKeyValueStorage();
  for (const record of baseSource()) storage.setString(record.key, record.raw);
  storage.resetCounters();
  const bundle = planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS });
  assert.equal(storage.operations.length, 0);
  const result = migrateContentIdentityV2({ storage, bundle });
  assert.equal(result.kind, "committed");
  assert.equal(storage.getString(STORAGE_KEYS.trainingSession("session-1"))?.includes(CONTENT_IDENTITY_V2_SCHEMA), true);
  installKeyValueStorageForTests(storage);
});
