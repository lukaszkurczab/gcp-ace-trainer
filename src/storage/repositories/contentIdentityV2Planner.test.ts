import assert from "node:assert/strict";
import test from "node:test";
import { canonicalJsonV1, canonicalSerialize } from "../../infrastructure/identity/canonicalSerialization";
import { sha256Utf8 } from "../../infrastructure/identity/sha256";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import { CANONICAL_RECORD_SCHEMA } from "./canonicalRecordCodec";
import {
  CONTENT_IDENTITY_V2_PLANNER_OWNER_CODES,
  ContentIdentityV2PlannerError,
  isContentIdentityV2PlanBundle,
  migrateContentIdentityV2,
  planContentIdentityV2,
} from "./contentIdentityV2Planner";
import { classifyLegacyTrainingSession, CONTENT_IDENTITY_INVENTORY_REGISTRY } from "./contentIdentityInventory";
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

function legacyTrainingSessionPayload(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  const record = baseSource().find((entry) => entry.key === STORAGE_KEYS.trainingSession("session-1"));
  assert.ok(record);
  const payload = (JSON.parse(record.raw) as { payload: Record<string, unknown> }).payload;
  return { ...payload, ...overrides };
}

function plannerOwnerGuardFailure(key: string, payload: unknown): ContentIdentityV2PlannerError {
  try {
    planContentIdentityV2({ source: [{ key, raw: envelope(payload) }], artifacts: ARTIFACTS });
  } catch (error) {
    assert.ok(error instanceof ContentIdentityV2PlannerError);
    return error;
  }
  assert.fail("expected a planner owner guard failure");
}

function trainingSessionShape(error: ContentIdentityV2PlannerError): Readonly<Record<string, unknown>> {
  return {
    role: error.trainingSessionRoleCode,
    topIdentity: error.trainingSessionTopIdentityCode,
    itemIdentity: error.trainingSessionItemIdentityCode,
    provenance: error.trainingSessionProvenanceCode,
    status: error.trainingSessionStatusCode,
  };
}

function assertHiddenTrainingSessionShape(error: ContentIdentityV2PlannerError): void {
  for (const field of ["trainingSessionRoleCode", "trainingSessionTopIdentityCode", "trainingSessionItemIdentityCode", "trainingSessionProvenanceCode", "trainingSessionStatusCode"]) {
    const descriptor = Object.getOwnPropertyDescriptor(error, field);
    assert.equal(descriptor?.enumerable, false, field);
    assert.equal(descriptor?.writable, false, field);
    assert.equal(descriptor?.configurable, false, field);
    assert.equal(Object.prototype.propertyIsEnumerable.call(error, field), false, field);
  }
  assert.equal(error.message, "owner_guard_failed");
  assert.doesNotMatch(JSON.stringify(error), /trainingSession|session-1|question-1|packagePin|artifactSha256/);
}

function assertHiddenLegacyTrainingSessionGuardCode(error: ContentIdentityV2PlannerError, expected: string): void {
  assert.equal(error.legacyTrainingSessionGuardCode, expected);
  const descriptor = Object.getOwnPropertyDescriptor(error, "legacyTrainingSessionGuardCode");
  assert.equal(descriptor?.enumerable, false);
  assert.equal(descriptor?.writable, false);
  assert.equal(descriptor?.configurable, false);
  assert.equal(Object.prototype.propertyIsEnumerable.call(error, "legacyTrainingSessionGuardCode"), false);
  assert.doesNotMatch(JSON.stringify(error), /legacyTrainingSessionGuardCode|raw payload|session-1|question-1|packagePin/);
}

test("owner dispatch maps sessions, attempts, reviews and preserves facts without legacy identity", () => {
  const bundle = planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS });
  assert.equal(isContentIdentityV2PlanBundle(bundle), true);
  const session = bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.trainingSession("session-1"));
  assert.ok(session);
  const target = (JSON.parse(session.raw) as { payload: Record<string, unknown> }).payload;
  assert.equal(target.artifactSha256, SHA);
  assert.equal("packagePin" in target, false);
  assert.equal(target.itemOrder !== undefined, true);
  assert.equal(bundle.preservation.find((entry) => entry.sourceKey === session.key)?.answersDigest.length, 64);
  assert.equal(JSON.stringify(target).includes("itemId"), false);
});

test("v2 records are exact, deeply frozen, deterministic, and reject forged legacy fields", () => {
  const first = planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS });
  const second = planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS });
  assert.deepEqual(first.targetRecords, second.targetRecords);
  assert.equal(first.certificate.planId, second.certificate.planId);
  const session = first.targetRecords.find((record) => record.key === STORAGE_KEYS.trainingSession("session-1"));
  assert.ok(session);
  const payload = (JSON.parse(session.raw) as { payload: Record<string, unknown> }).payload;
  assert.equal(payload.artifactSha256, SHA);
  assert.equal(Object.isFrozen(first.preservation), true);
  assert.equal(Object.isFrozen(first.preservation[0]), true);
  assert.equal(JSON.stringify(payload).includes("packagePin"), false);
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
  const session = bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.unavailableActive("session-1"));
  assert.ok(session);
  const payload = (JSON.parse(session.raw) as { payload: { session: { itemOrder: readonly { item: { kind: string } }[] } } }).payload;
  assert.equal(payload.session.itemOrder.length, 2);
  assert.equal(payload.session.itemOrder.every((entry) => entry.item.kind === "unavailable_active"), true);
  assert.equal(bundle.targetRecords.some((record) => record.key === STORAGE_KEYS.trainingSession("session-1")), false);
  assert.deepEqual(JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX)!.raw).payload, ["session-1"]);
  assert.equal(bundle.targetRecords.some((record) => record.key === STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
});

test("mixed tombstoned session statuses dispatch to exact private targets and clean every public relationship", () => {
  const statuses = [
    ["session-active", "active"],
    ["session-completed", "completed"],
    ["session-abandoned", "abandoned"],
  ] as const;
  const sessionPayload = (id: string, status: (typeof statuses)[number][1]): Record<string, unknown> => ({
    id,
    trackId: TRACK,
    modeId: "guided",
    configurationSnapshot: { requestedLength: 1 },
    activeForegroundMs: 0,
    contentVersion: VERSION,
    packagePin: pin(UNKNOWN_SHA),
    status,
    itemOrder: [{ occurrenceId: `${id}:occurrence`, item: ref("question-1", pin(UNKNOWN_SHA)) }],
    currentItemIndex: 0,
    requestedLength: 1,
    actualLength: 1,
    optionOrderByOccurrence: {},
    conditionalReinsertSlots: [],
    startedAt: "2026-01-01T00:00:00.000Z",
    ...(status === "active" ? {} : { completedAt: "2026-01-01T00:01:00.000Z" }),
  });
  const attemptPayload = (id: string, sessionId: string): Record<string, unknown> => ({
    id,
    sessionId,
    trackId: TRACK,
    modeId: "guided",
    occurrenceId: `${sessionId}:occurrence`,
    item: ref("question-1", pin(UNKNOWN_SHA)),
    reviewEvidence: { sourceItem: ref("question-1", pin(UNKNOWN_SHA)), taxonomyOrSkillRefs: [] },
    response: { answer: "user-answer" },
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    answeredAt: "2026-01-01T00:00:00.000Z",
    committedAt: "2026-01-01T00:00:01.000Z",
  });
  const sessionIds = statuses.map(([id]) => id);
  const attemptIds = statuses.map(([id]) => `${id}:attempt`);
  const base = baseSource({
    [STORAGE_KEYS.TRAINING_SESSION_INDEX]: sessionIds,
    [STORAGE_KEYS.TRAINING_ATTEMPT_INDEX]: attemptIds,
    [STORAGE_KEYS.REVIEW_INDEX]: [],
  }).filter((record) => ![
    STORAGE_KEYS.trainingSession("session-1"),
    STORAGE_KEYS.trainingAttempt("attempt-1"),
    STORAGE_KEYS.reviewEntry("review-1"),
    STORAGE_KEYS.trainingSessionResult("session-1"),
  ].includes(record.key));
  const source = [
    ...base,
    ...statuses.map(([id, status]) => ({ key: STORAGE_KEYS.trainingSession(id), raw: envelope(sessionPayload(id, status)) })),
    ...statuses.map(([id]) => ({ key: STORAGE_KEYS.trainingAttempt(`${id}:attempt`), raw: envelope(attemptPayload(`${id}:attempt`, id)) })),
  ];

  const bundle = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const targetKeys = new Set(bundle.targetRecords.map((record) => record.key));
  assert.equal(targetKeys.has(STORAGE_KEYS.trainingSession("session-active")), false);
  assert.equal(targetKeys.has(STORAGE_KEYS.trainingSession("session-completed")), false);
  assert.equal(targetKeys.has(STORAGE_KEYS.trainingSession("session-abandoned")), false);
  assert.equal(targetKeys.has(STORAGE_KEYS.trainingAttempt("session-active:attempt")), false);
  assert.equal(targetKeys.has(STORAGE_KEYS.trainingAttempt("session-completed:attempt")), false);
  assert.equal(targetKeys.has(STORAGE_KEYS.trainingAttempt("session-abandoned:attempt")), false);
  const sessionIndex = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.TRAINING_SESSION_INDEX)!.raw) as { payload: unknown };
  const attemptIndex = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)!.raw) as { payload: unknown };
  const activeIndex = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.UNAVAILABLE_ACTIVE_INDEX)!.raw) as { payload: unknown };
  const archiveIndex = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX)!.raw) as { payload: unknown };
  assert.deepEqual(sessionIndex.payload, []);
  assert.deepEqual(attemptIndex.payload, []);
  assert.deepEqual(activeIndex.payload, ["session-active"]);
  assert.deepEqual(archiveIndex.payload, ["session-abandoned", "session-completed"]);
  for (const id of ["session-active", "session-completed", "session-abandoned"]) {
    const targetKey = id === "session-active" ? STORAGE_KEYS.unavailableActive(id) : STORAGE_KEYS.archivalHistory(id);
    const target = bundle.targetRecords.find((record) => record.key === targetKey);
    assert.ok(target, id);
    const payload = JSON.parse(target.raw) as { payload: { attempts: readonly unknown[] } };
    assert.equal(payload.payload.attempts.length, 1, id);
  }
});

test("unknown keys and malformed envelopes fail closed before a C0 plan exists", () => {
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: `${STORAGE_NAMESPACE}unknown`, raw: envelope({ packagePin: pin() }) }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "unregistered_key" && error.ownerCode === undefined);
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: `${STORAGE_NAMESPACE}settings:bad`, raw: "not-json" }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "unregistered_key" && error.ownerCode === undefined);
});

test("owner guard failures attach only the registry owner as a hidden bounded field", () => {
  const entriesByOwner = new Map(CONTENT_IDENTITY_INVENTORY_REGISTRY.map((entry) => [entry.owner, entry]));
  assert.deepEqual([...CONTENT_IDENTITY_V2_PLANNER_OWNER_CODES].sort(), [...entriesByOwner.keys()].sort());

  for (const [owner, entry] of entriesByOwner) {
    const key = entry.kind === "dynamic_prefix" ? `${entry.selector}owner-test` : entry.selector;
    let caught: unknown;
    try {
      planContentIdentityV2({ source: [{ key, raw: envelope({}) }], artifacts: ARTIFACTS });
    } catch (error) {
      caught = error;
    }
    assert.ok(caught instanceof ContentIdentityV2PlannerError, owner);
    assert.equal(caught.code, "owner_guard_failed", owner);
    assert.equal(caught.ownerCode, owner, owner);
    assert.equal(Object.prototype.propertyIsEnumerable.call(caught, "ownerCode"), false, owner);
    const descriptor = Object.getOwnPropertyDescriptor(caught, "ownerCode");
    assert.equal(descriptor?.enumerable, false, owner);
    assert.equal(descriptor?.writable, false, owner);
    assert.equal(descriptor?.configurable, false, owner);
    assert.equal(JSON.stringify(caught).includes("ownerCode"), false, owner);
  }
});

test("training-session owner guards classify each role without exposing payload details", () => {
  const cases: readonly [string, string, unknown][] = [
    ["index", STORAGE_KEYS.TRAINING_SESSION_INDEX, {}],
    ["active_pointer", STORAGE_KEYS.ACTIVE_TRAINING_SESSION, {}],
    ["record", STORAGE_KEYS.trainingSession("shape-record"), {}],
  ];
  for (const [expectedRole, key, payload] of cases) {
    const error = plannerOwnerGuardFailure(key, payload);
    assert.equal(error.ownerCode, "trainingSessionRepository");
    assert.equal(error.trainingSessionRoleCode, expectedRole);
    assertHiddenTrainingSessionShape(error);
  }
});

test("training-session owner guards classify every top-level identity shape independently", () => {
  const cases: readonly [string, (payload: Record<string, unknown>) => void][] = [
    ["artifact_sha", (payload) => { delete payload.packagePin; payload.artifactSha256 = SHA; }],
    ["package_pin", (payload) => { delete payload.artifactSha256; }],
    ["both", (payload) => { payload.artifactSha256 = SHA; }],
    ["neither", (payload) => { delete payload.packagePin; delete payload.artifactSha256; }],
  ];
  for (const [expectedTopIdentity, shape] of cases) {
    const payload = legacyTrainingSessionPayload({ id: "" });
    shape(payload);
    const error = plannerOwnerGuardFailure(STORAGE_KEYS.trainingSession("shape-top"), payload);
    assert.equal(error.trainingSessionTopIdentityCode, expectedTopIdentity);
    assertHiddenTrainingSessionShape(error);
  }
});

test("training-session owner guards classify every item identity shape independently", () => {
  const resolved = { trackId: TRACK, questionId: "question-1", contentVersion: VERSION, artifactSha256: SHA };
  const legacy = (legacyTrainingSessionPayload().itemOrder as Array<Record<string, unknown>>)[0]!;
  const cases: readonly [string, Readonly<Record<string, unknown>>][] = [
    ["resolved", { id: "", itemOrder: [{ occurrenceId: "occurrence-1", item: resolved }] }],
    ["legacy", { id: "", itemOrder: [legacy] }],
    ["mixed", { id: "", itemOrder: [legacy, { occurrenceId: "occurrence-2", item: resolved }] }],
    ["empty", { id: "", itemOrder: [] }],
    ["other", { id: "", itemOrder: [{ occurrenceId: "occurrence-1", item: {} }] }],
  ];
  for (const [expectedItemIdentity, overrides] of cases) {
    const error = plannerOwnerGuardFailure(STORAGE_KEYS.trainingSession("shape-item"), legacyTrainingSessionPayload(overrides));
    assert.equal(error.trainingSessionItemIdentityCode, expectedItemIdentity);
    assertHiddenTrainingSessionShape(error);
  }
});

test("training-session owner guards classify every provenance shape independently", () => {
  const cases: readonly [string, Readonly<Record<string, unknown>>][] = [
    ["both", { id: "", taxonomyVersion: "taxonomy-v1", planFingerprint: SHA }],
    ["taxonomy_only", { id: "", taxonomyVersion: "taxonomy-v1" }],
    ["fingerprint_only", { id: "", planFingerprint: SHA }],
    ["neither", { id: "" }],
  ];
  for (const [expectedProvenance, overrides] of cases) {
    const error = plannerOwnerGuardFailure(STORAGE_KEYS.trainingSession("shape-provenance"), legacyTrainingSessionPayload(overrides));
    assert.equal(error.trainingSessionProvenanceCode, expectedProvenance);
    assertHiddenTrainingSessionShape(error);
  }
});

test("training-session owner guards classify every status and non-record fallback", () => {
  const statuses: readonly [string, string][] = [["active", "active"], ["completed", "completed"], ["abandoned", "abandoned"], ["other", "expired"]];
  for (const [expectedStatus, status] of statuses) {
    const error = plannerOwnerGuardFailure(STORAGE_KEYS.trainingSession("shape-status"), legacyTrainingSessionPayload({ id: "", status }));
    assert.equal(error.trainingSessionStatusCode, expectedStatus);
    assertHiddenTrainingSessionShape(error);
  }
  const nonRecord = plannerOwnerGuardFailure(STORAGE_KEYS.trainingSession("shape-non-record"), "malformed-session-payload");
  assert.deepEqual(trainingSessionShape(nonRecord), {
    role: "record",
    topIdentity: "neither",
    itemIdentity: "other",
    provenance: "neither",
    status: "other",
  });
  assertHiddenTrainingSessionShape(nonRecord);
});

test("completed legacy sessions without conditional slots normalize to an empty target array through migration", () => {
  const sessionKey = STORAGE_KEYS.trainingSession("session-1");
  const source = baseSource().map((record) => {
    if (record.key !== sessionKey) return record;
    const payload = (JSON.parse(record.raw) as { payload: Record<string, unknown> }).payload;
    delete payload.conditionalReinsertSlots;
    return { ...record, raw: envelope(payload) };
  });
  const sourceSessionRaw = source.find((record) => record.key === sessionKey)!.raw;
  const bundle = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const targetRecord = bundle.targetRecords.find((record) => record.key === sessionKey);
  assert.ok(targetRecord);
  const targetPayload = (JSON.parse(targetRecord.raw) as { payload: Record<string, unknown> }).payload;
  assert.deepEqual(targetPayload.conditionalReinsertSlots, []);
  assert.equal(source.find((record) => record.key === sessionKey)!.raw, sourceSessionRaw);

  const storage = new MemoryKeyValueStorage();
  for (const record of source) storage.setString(record.key, record.raw);
  const migration = migrateContentIdentityV2({ storage, bundle });
  assert.equal(migration.kind, "committed");
  const migratedPayload = JSON.parse(storage.getString(sessionKey)!) as { payload: Record<string, unknown> };
  assert.deepEqual(migratedPayload.payload.conditionalReinsertSlots, []);
});

test("legacy conditional slot null, non-array, and malformed entries fail closed before planning", () => {
  const sessionKey = STORAGE_KEYS.trainingSession("session-1");
  for (const invalidSlots of [null, {}, [null], [{ ordinaryBranch: {} }]]) {
    const source = baseSource().map((record) => record.key === sessionKey
      ? { ...record, raw: envelope(legacyTrainingSessionPayload({ conditionalReinsertSlots: invalidSlots })) }
      : record);
    assert.throws(
      () => planContentIdentityV2({ source, artifacts: ARTIFACTS }),
      (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "owner_guard_failed",
    );
  }
});

test("planner legacy-session guard code matches the canonical classifier at every first-failing rule", () => {
  const valid = legacyTrainingSessionPayload();
  assert.equal(classifyLegacyTrainingSession(valid), null);
  assert.doesNotThrow(() => planContentIdentityV2({ source: baseSource(), artifacts: ARTIFACTS }));
  const cases: readonly [string, unknown][] = [
    ["not_record", null],
    ["unexpected_keys", { ...valid, unexpected: true }],
    ["unexpected_keys", { ...valid, itemRefs: [] }],
    ["expired_status", { ...valid, status: "expired" }],
    ["id", { ...valid, id: "" }],
    ["track_id", { ...valid, trackId: "unregistered-track" }],
    ["mode_id", { ...valid, modeId: "" }],
    ["configuration_snapshot", { ...valid, configurationSnapshot: {} }],
    ["requested_length", { ...valid, requestedLength: null }],
    ["actual_length", { ...valid, actualLength: null }],
    ["current_item_index", { ...valid, currentItemIndex: null }],
    ["item_order", { ...valid, itemOrder: "not-an-array" }],
    ["item_order_entry", { ...valid, itemOrder: [{}] }],
    ["option_order_by_occurrence", { ...valid, optionOrderByOccurrence: { occurrence: "not-an-array" } }],
    ["conditional_reinsert_slots", { ...valid, conditionalReinsertSlots: null }],
    ["active_foreground_ms", { ...valid, activeForegroundMs: null }],
    ["content_version", { ...valid, contentVersion: "" }],
    ["package_pin", { ...valid, packagePin: {} }],
    ["taxonomy_version", { ...valid, taxonomyVersion: "" }],
    ["plan_fingerprint", { ...valid, planFingerprint: "not-a-sha" }],
    ["status", { ...valid, status: "paused" }],
    ["started_at", { ...valid, startedAt: "" }],
    ["completed_at", { ...valid, completedAt: "not-a-date" }],
  ];
  for (const [expectedCode, payload] of cases) {
    assert.equal(classifyLegacyTrainingSession(payload), expectedCode, expectedCode);
    const error = plannerOwnerGuardFailure(STORAGE_KEYS.trainingSession("guard-invalid"), payload);
    assert.equal(error.ownerCode, "trainingSessionRepository");
    assertHiddenLegacyTrainingSessionGuardCode(error, expectedCode);
  }
});

test("dispatch and make-v2 failures retain their planner error and attach the source owner", () => {
  const source = baseSource({
    [STORAGE_KEYS.trainingSessionResult("session-1")]: {
      id: "result-1", sessionId: "session-1", trackId: TRACK, totalOccurrences: 1,
      answeredOccurrenceIds: ["occurrence-1"], unansweredOccurrenceIds: [], completedAt: "2026-01-01T00:01:00.000Z",
      evidence: { familyId: "future-family", details: { total: 1, itemId: "question-raw" } },
    },
  });
  let caught: unknown;
  try {
    planContentIdentityV2({ source, artifacts: ARTIFACTS });
  } catch (error) {
    caught = error;
  }
  assert.ok(caught instanceof ContentIdentityV2PlannerError);
  assert.equal(caught.code, "owner_guard_failed");
  assert.equal(caught.ownerCode, "trainingSessionResultRepository");
  assert.equal(caught.message, "owner_guard_failed");
  assert.doesNotMatch(JSON.stringify(caught), /question-raw|itemId|ownerCode/);
});

test("known malformed owners, orphan/duplicate indices, and terminal history fail closed deterministically", () => {
  const malformedSettings = baseSource().map((record) => record.key === STORAGE_KEYS.SETTINGS ? { ...record, raw: "not-json" } : record);
  assert.throws(() => planContentIdentityV2({ source: malformedSettings, artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "malformed_envelope" && error.ownerCode === undefined);
  const settingsWithForeignPin = baseSource().map((record) => record.key === STORAGE_KEYS.SETTINGS ? { ...record, raw: envelope({ packagePin: pin() }) } : record);
  assert.throws(() => planContentIdentityV2({ source: settingsWithForeignPin, artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "owner_guard_failed");
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope({}) }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "owner_guard_failed");
  for (const ids of [["missing-session"], ["session-1", "session-1"]]) {
    assert.throws(() => planContentIdentityV2({ source: baseSource({ [STORAGE_KEYS.TRAINING_SESSION_INDEX]: ids }), artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "relationship_invalid" && error.ownerCode === undefined);
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
  const session = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.archivalHistory("session-1"))!.raw) as { payload: { session: { itemOrder: readonly { item: { reason: string } }[] } } };
  assert.equal(session.payload.session.itemOrder[0]?.item.reason, "stale_content_version");
  assert.equal(JSON.stringify(session.payload).includes("packagePin"), false);
  // The top-level session preflight failed, so no resolved artifact may leak
  // into the value or any child binding.
  assert.equal(JSON.stringify(session.payload.session).includes("artifactSha256"), false);
  assert.equal(session.payload.session.itemOrder.every((entry) => entry.item.reason === "stale_content_version"), true);
  assert.equal(bundle.targetRecords.some((record) => record.key === STORAGE_KEYS.trainingSession("session-1")), false);
  assert.deepEqual(JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.ARCHIVAL_HISTORY_INDEX)!.raw).payload, ["session-1"]);
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
  const parsed = JSON.parse(target.raw) as { payload: unknown };
  assert.equal(JSON.stringify(parsed.payload).includes('"itemId"'), true);
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
  const journal = { journalId: `journal:${SHA}`, ...journalPlan, planFingerprint: createMutationPlanFingerprint(journalPlan as unknown as Parameters<typeof createMutationPlanFingerprint>[0]) };
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
  const notificationRecord = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.NOTIFICATION_SETTINGS)!.raw) as { payload: { identity: { artifactSha256: string } } };
  const planRecord = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.learningPlan(TRACK))!.raw) as { payload: { artifactSha256: string } };
  const journalRecord = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.ACTIVE_JOURNAL)!.raw) as { payload: { artifactSha256: null } };
  assert.equal(notificationRecord.payload.identity.artifactSha256, SHA);
  assert.equal(planRecord.payload.artifactSha256, SHA);
  assert.equal(journalRecord.payload.artifactSha256, null);
  assert.equal(JSON.stringify(notificationRecord.payload).includes("packagePin"), false);
  assert.equal(JSON.stringify(planRecord.payload).includes("contentPackagePin"), false);
  assert.equal(JSON.stringify(journalRecord.payload).includes("packagePin"), false);
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
  const target = JSON.parse(bundle.targetRecords.find((record) => record.key === STORAGE_KEYS.ACCOUNT_SYNC)!.raw) as { payload: { materialization: { guestBackup: readonly [{ value: string }] } } };
  const backup = target.payload.materialization.guestBackup[0]!;
  assert.equal(backup.value.includes("packagePin"), false);
  assert.equal(JSON.stringify(target.payload).includes("packagePin"), false);
  const forbidden = { ...accountState, materialization: { ...accountState.materialization, guestBackup: [{ key: STORAGE_KEYS.ACCOUNT_SYNC, value: envelope({}) }] } };
  assert.throws(() => planContentIdentityV2({ source: [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope(forbidden) }], artifacts: ARTIFACTS }), (error: unknown) => error instanceof ContentIdentityV2PlannerError && error.code === "owner_guard_failed");
});

test("account active-track metadata packagePin is removed after the versioned cloud protocol upgrade", () => {
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
  const parsed = JSON.parse(target.raw) as { payload: { outbox: readonly [{ state: Record<string, unknown> }] } };
  const value = parsed.payload;
  assert.equal("packagePin" in value.outbox[0].state, false);
});

test("legacy account fixtures without sync-plan counters normalize before planning and migration", () => {
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
    remoteAccountRevision: 0, lastSuccessfulSyncAt: null, pendingMutationCount: 1, blockingConflictCode: null, lastFailureCode: null,
    acknowledged: {}, outbox: [{ ...accountRecord, mutationId: "m1", expectedVersion: null, attemptCount: 0, lastErrorCode: null, status: "pending", sequence: 1 }],
    materialization: null, pendingConfirmation: null,
  };
  const source = [...baseSource(), { key: STORAGE_KEYS.ACCOUNT_SYNC, raw: envelope(accountState) }];
  const bundle = planContentIdentityV2({ source, artifacts: ARTIFACTS });
  const storage = new MemoryKeyValueStorage();
  for (const record of source) storage.setString(record.key, record.raw);

  const result = migrateContentIdentityV2({ storage, bundle });
  assert.equal(result.kind, "committed");
  const migrated = JSON.parse(storage.getString(STORAGE_KEYS.ACCOUNT_SYNC)!) as { payload: { syncPlan: unknown; outboxSequence: number; highWatermark: number } };
  assert.equal(migrated.payload.syncPlan, null);
  assert.equal(migrated.payload.outboxSequence, 1);
  assert.equal(migrated.payload.highWatermark, 1);
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

  const target = JSON.parse(first.targetRecords.find((record) => record.key === STORAGE_KEYS.ACCOUNT_SYNC)!.raw) as { payload: {
    outbox: readonly [Record<string, unknown>];
    syncPlan: Record<string, unknown> & { items: readonly [Record<string, unknown>] };
  } };
  const value = target.payload;
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
  assert.equal(storage.getString(STORAGE_KEYS.trainingSession("session-1"))?.includes('"artifactSha256"'), true);
  assert.equal(storage.getString(STORAGE_KEYS.trainingSession("session-1"))?.includes("packagePin"), false);
  installKeyValueStorageForTests(storage);
});
