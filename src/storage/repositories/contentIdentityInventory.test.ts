import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import { CONTENT_REPORT_REASONS, createTrainingSession, createTrainingSessionResult, type ContentPackagePin } from "../../domain";
import { createMutationPlanFingerprint } from "./mutationJournalRepository";
import { canonicalJsonV1 } from "../../infrastructure/identity/canonicalSerialization";
import { accountDataRecordFingerprint, accountDataRecordKey } from "./accountDataRepository";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import { STORAGE_KEYS, STORAGE_NAMESPACE } from "../keys";
import {
  CONTENT_IDENTITY_INVENTORY_REGISTRY,
  describeBackendProtocolForContentIdentity,
  scanContentIdentityInventory,
  type ActiveContentArtifact,
} from "./contentIdentityInventory";

const trackId = "backend-system-design-interview";
const artifactSha256 = "a".repeat(64);
const unknownArtifactSha256 = "b".repeat(64);
const contentVersion = "test-v1";
const artifact: ActiveContentArtifact = { trackId, contentVersion, artifactSha256, questionIds: ["question-1"] };

let storage: MemoryKeyValueStorage;

beforeEach(() => {
  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
});

function envelope(payload: unknown, revision = 1): string {
  return JSON.stringify({ schemaIdentity: "patternly:canonical:v1", revision, payload });
}

function seed(key: string, payload: unknown, revision = 1): void {
  storage.setString(key, envelope(payload, revision));
}

function pin(overrides: Partial<ContentPackagePin> = {}): ContentPackagePin {
  return {
    packageIdentity: overrides.packageIdentity ?? artifactSha256,
    packageVersion: overrides.packageVersion ?? contentVersion,
    contentReleaseId: overrides.contentReleaseId ?? "canonical-content-v1",
  };
}

function mappedIdentity(): Readonly<Record<string, unknown>> {
  return { trackId, itemId: "question-1", contentVersion, packagePin: pin() };
}

function mappedIdentityFor(identityTrackId: string, identitySha: string, identityVersion: string): Readonly<Record<string, unknown>> {
  return { trackId: identityTrackId, itemId: "question-1", contentVersion: identityVersion, packagePin: pin({ packageIdentity: identitySha, packageVersion: identityVersion }) };
}

function validJournal(overrides: Readonly<{ packagePin?: ContentPackagePin; trackId?: string }> = {}): Record<string, unknown> {
  const journalTrackId = overrides.trackId ?? trackId;
  const packagePin = overrides.packagePin ?? pin();
  const review = {
    id: "review-1",
    trackId: journalTrackId,
    sourceAttemptId: "attempt-1",
    sourceSessionId: "session-1",
    sourceItem: { trackId: journalTrackId, itemId: "question-1", contentVersion: packagePin.packageVersion, packagePin },
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect" as const],
    dueAt: "2026-01-01T10:00:00.000Z",
    createdAt: "2026-01-01T09:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };
  const plan = {
    operation: "set_review_entry" as const,
    status: "journal_durable" as const,
    createdAt: "2026-01-01T09:00:00.000Z",
    sessionId: "session-1",
    trackId: journalTrackId,
    packagePin,
    commandIdentity: { version: 1 as const, fingerprint: "c".repeat(64) },
    expectedRevisions: [{ target: "review:review-1", revision: null }, { target: "review_index", revision: null }],
    writes: [{ kind: "put_review_entry" as const, record: review }],
  };
  return { ...plan, journalId: `journal:${plan.commandIdentity.fingerprint}`, planFingerprint: createMutationPlanFingerprint(plan) };
}

function validSession(overrides: Readonly<{ id?: string; trackId?: string }> = {}): Record<string, unknown> {
  const sessionTrackId = overrides.trackId ?? trackId;
  return createTrainingSession({
    id: overrides.id ?? "session-1",
    trackId: sessionTrackId as never,
    modeId: "practice",
    configurationSnapshot: { kind: "practice" },
    requestedLength: 1,
    actualLength: 1,
    currentItemIndex: 0,
    itemOrder: [{ occurrenceId: "occurrence-1", item: { trackId: sessionTrackId, itemId: "question-1", contentVersion, packagePin: pin() } }],
    optionOrderByOccurrence: {},
    conditionalReinsertSlots: [],
    activeForegroundMs: 0,
    contentVersion,
    packagePin: pin(),
    status: "active",
    startedAt: "2026-01-01T09:00:00.000Z",
  }) as unknown as Record<string, unknown>;
}

function validAttemptState(): Record<string, unknown> {
  const item = mappedIdentity();
  return {
    id: "attempt-1",
    sessionId: "session-1",
    trackId,
    modeId: "practice",
    occurrenceId: "occurrence-1",
    item,
    response: { answer: "a" },
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: "2026-01-01T09:00:00.000Z",
    committedAt: "2026-01-01T09:01:00.000Z",
  };
}

function validAccountState(overrides: Readonly<Record<string, unknown>> = {}): Record<string, unknown> {
  const recordPayload = { recordId: "attempt-1", recordType: "training_attempt" as const, trackId, state: validAttemptState(), version: 0 };
  const accountRecord = { ...recordPayload, fingerprint: accountDataRecordFingerprint(recordPayload) };
  return {
    protocolVersion: 2,
    accountId: null,
    status: "offlinePending",
    localDatasetVersion: 1,
    localDatasetFingerprint: null,
    remoteAccountRevision: 0,
    lastSuccessfulSyncAt: null,
    pendingMutationCount: 1,
    blockingConflictCode: null,
    lastFailureCode: null,
    acknowledged: {},
    outbox: [{ ...accountRecord, mutationId: "mutation_1234567890123456", expectedVersion: null, attemptCount: 0, lastErrorCode: null, status: "pending", sequence: 1 }],
    materialization: null,
    pendingConfirmation: null,
    syncPlan: { version: 3, planId: "plan-1", snapshotVersion: 1, expectedAccountRevision: 0, highWatermark: 1, items: [{ sequence: 1, recordKey: canonicalJsonV1({ recordId: recordPayload.recordId, recordType: recordPayload.recordType, trackId: recordPayload.trackId }), mutationId: "mutation_1234567890123456", expectedVersion: null, payload: accountRecord, groupId: null, status: "pending" }] },
    outboxSequence: 1,
    highWatermark: 1,
    ...overrides,
  };
}

function validReport(clientSubmissionId = "report-1"): Record<string, unknown> {
  return {
    input: {
      clientSubmissionId,
      trackId,
      contentVersion,
      itemId: "question-1",
      reason: CONTENT_REPORT_REASONS[0],
      description: "The explanation needs a correction.",
      context: {
        releasePackageId: "canonical-content-v1",
        trackNode: "node-1",
        modeRoute: "practice_feedback_details",
        locale: "en",
        appBuild: "0.1.0",
        platform: "ios",
        occurredAt: "2026-01-01T09:00:00.000Z",
      },
    },
    status: "queued",
    attemptCount: 0,
    createdAt: "2026-01-01T09:00:00.000Z",
    updatedAt: "2026-01-01T09:00:00.000Z",
    lastErrorCode: null,
  };
}

test("empty namespace produces a stable empty report", () => {
  const first = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  const second = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(first.counts.totalKeys, 0);
  assert.equal(first.findings.length, 0);
  assert.equal(first.digest, second.digest);
  assert.equal(first.counts.blockingKeys, 0);
});

test("registry covers every fixed key and dynamic namespace family", () => {
  const selectors = new Set(CONTENT_IDENTITY_INVENTORY_REGISTRY.map((entry) => entry.selector));
  const fixedKeys = [
    STORAGE_KEYS.METADATA, STORAGE_KEYS.GUEST_INSTALLATION, STORAGE_KEYS.GUEST_ACCESS,
    STORAGE_KEYS.ACTIVE_TRACK, STORAGE_KEYS.ACTIVE_TRAINING_SESSION, STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT,
    STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, STORAGE_KEYS.TRAINING_SESSION_INDEX, STORAGE_KEYS.TRAINING_ATTEMPT_INDEX,
    STORAGE_KEYS.REVIEW_INDEX, STORAGE_KEYS.SETTINGS, STORAGE_KEYS.GOAL_ONBOARDING_PREFERENCES,
    STORAGE_KEYS.NOTIFICATION_SETTINGS, STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, STORAGE_KEYS.ACTIVE_JOURNAL,
    STORAGE_KEYS.ACCOUNT_SYNC, STORAGE_KEYS.ACCOUNT_SIGN_OUT, STORAGE_KEYS.ACCOUNT_DELETION, STORAGE_KEYS.CONTENT_REPORT_OUTBOX,
  ];
  const dynamicPrefixes = [
    `${STORAGE_NAMESPACE}training-session:`, `${STORAGE_NAMESPACE}training-session-result:`,
    `${STORAGE_NAMESPACE}training-attempt:`, `${STORAGE_NAMESPACE}review-entry:`,
    `${STORAGE_NAMESPACE}goal:`, `${STORAGE_NAMESPACE}learning-plan:`,
  ];
  assert.deepEqual([...fixedKeys, ...dynamicPrefixes].filter((key) => !selectors.has(key)), []);
});

test("backend audit records the opaque state contract and required follow-up", () => {
  const audit = describeBackendProtocolForContentIdentity();
  assert.equal(audit.stateContract, "opaque_object");
  assert.equal(audit.requiresBackendChange, true);
  assert.equal(audit.protocolVersions.includes(3), true);
  assert.ok(audit.evidence.some((entry) => entry.path.includes("progress/contracts.ts")));
});

test("exact package pin is mapped without exposing payload data", () => {
  seed(STORAGE_KEYS.ACTIVE_JOURNAL, validJournal());
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(report.counts.mapped, 1);
  assert.equal(report.findings[0]?.classification, "mapped");
  assert.equal(JSON.stringify(report).includes("question-1"), false);
  assert.equal(JSON.stringify(report).includes(artifactSha256), false);
});

test("unknown package hash and known hash with a stale version are distinct", () => {
  seed(STORAGE_KEYS.ACTIVE_JOURNAL, validJournal({ packagePin: pin({ packageIdentity: unknownArtifactSha256 }) }));
  const unknownHash = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(unknownHash.findings[0]?.classification, "unmapped_unknown_hash");

  seed(STORAGE_KEYS.ACTIVE_JOURNAL, validJournal({ packagePin: pin({ packageVersion: "old-v0" }) }));
  const staleVersion = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(staleVersion.findings[0]?.classification, "unmapped_version");
});

test("malformed envelope is reported and blocks identity-bearing migration", () => {
  storage.setString(STORAGE_KEYS.ACTIVE_JOURNAL, "{");
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(report.findings[0]?.classification, "malformed");
  assert.equal(report.findings[0]?.reason, "invalid_json");
  assert.equal(report.findings[0]?.identityBearing, true);
  assert.equal(report.counts.blockingKeys, 1);
});

test("orphan index entries and duplicate index identities are both visible", () => {
  seed(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["missing-session"]);
  seed(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, ["duplicate-attempt", "duplicate-attempt"]);
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  const byKey = new Map(report.findings.map((finding) => [finding.key, finding]));
  assert.equal(byKey.get(STORAGE_KEYS.TRAINING_SESSION_INDEX)?.classification, "orphan");
  assert.equal(byKey.get(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX)?.classification, "duplicate");
  assert.equal(report.counts.blockingKeys, 2);
});

test("known passthrough and unknown namespace keys are explicit", () => {
  seed(STORAGE_KEYS.SETTINGS, { appearance: "system", language: "en" });
  seed(`${STORAGE_NAMESPACE}future-record:one`, { itemId: "legacy-item", contentVersion: "legacy-v1" });
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  const byKey = new Map(report.findings.map((finding) => [finding.key, finding]));
  assert.equal(byKey.get(STORAGE_KEYS.SETTINGS)?.classification, "passthrough");
  assert.equal(byKey.get(`${STORAGE_NAMESPACE}future-record:one`)?.classification, "unsupported");
  assert.equal(byKey.get(`${STORAGE_NAMESPACE}future-record:one`)?.identityBearing, true);
});

test("account sync nested outbox, plan and materialization backup refs are scanned", () => {
  const recordPayload = { recordId: "attempt-1", recordType: "training_attempt" as const, trackId, state: validAttemptState(), version: 0 };
  const fingerprint = accountDataRecordFingerprint(recordPayload);
  const accountRecord = { ...recordPayload, fingerprint };
  const accountState = {
    protocolVersion: 2,
    accountId: null,
    status: "offlinePending",
    localDatasetVersion: 1,
    localDatasetFingerprint: null,
    remoteAccountRevision: 0,
    lastSuccessfulSyncAt: null,
    pendingMutationCount: 1,
    blockingConflictCode: null,
    lastFailureCode: null,
    acknowledged: {},
    outbox: [{ ...accountRecord, mutationId: "mutation_1234567890123456", expectedVersion: null, attemptCount: 0, lastErrorCode: null, status: "pending", sequence: 1 }],
    pendingConfirmation: null,
    outboxSequence: 1,
    highWatermark: 1,
    syncPlan: { version: 3, planId: "plan-1", snapshotVersion: 1, expectedAccountRevision: 0, highWatermark: 1, items: [{ sequence: 1, recordKey: canonicalJsonV1({ recordId: recordPayload.recordId, recordType: recordPayload.recordType, trackId: recordPayload.trackId }), mutationId: "mutation_1234567890123456", expectedVersion: null, payload: accountRecord, groupId: null, status: "pending" }] },
    materialization: { kind: "discardGuest", accountId: "account-1", installationId: "install-1", phase: "prepared", guestBackup: [{ key: STORAGE_KEYS.ACTIVE_TRACK, value: envelope(trackId) }] },
  };
  seed(STORAGE_KEYS.ACCOUNT_SYNC, accountState);
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(report.findings[0]?.key, STORAGE_KEYS.ACCOUNT_SYNC);
  assert.equal(report.findings[0]?.classification, "mapped");
  assert.equal(report.counts.blockingKeys, 0);
});

test("account sync durable outbox identity collisions are duplicates", () => {
  const state = validAccountState();
  const entry = (state.outbox as readonly Record<string, unknown>[])[0]!;
  seed(STORAGE_KEYS.ACCOUNT_SYNC, { ...state, outbox: [entry, { ...entry, mutationId: "mutation_other" }] });
  const finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "duplicate");
  assert.equal(finding.reason, "duplicate_account_outbox_identity");
  assert.equal(finding.identityBearing, true);
});

test("determinism and zero writes/removes hold for repeated scans", () => {
  seed(STORAGE_KEYS.ACTIVE_JOURNAL, validJournal());
  storage.resetCounters();
  const first = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  const operationsAfterFirst = [...storage.operations];
  const second = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(first.digest, second.digest);
  assert.deepEqual(storage.operations.filter((operation) => operation.kind === "write" || operation.kind === "remove"), []);
  assert.equal(operationsAfterFirst.some((operation) => operation.kind === "write" || operation.kind === "remove"), false);
});

test("an unregistered namespace key is unsupported and blocking even with a valid package pin", () => {
  const key = `${STORAGE_NAMESPACE}future-record:with-pin`;
  seed(key, mappedIdentity());
  const finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "unsupported");
  assert.equal(finding.reason, "namespace_key_unregistered");
  assert.equal(finding.identityBearing, true);
  assert.equal(scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).counts.blockingKeys, 1);
});

test("an identity pin without an explicit valid track never becomes exact mapped", () => {
  const missingTrack = { ...validJournal() };
  delete missingTrack.trackId;
  seed(STORAGE_KEYS.ACTIVE_JOURNAL, missingTrack);
  let finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");
  assert.notEqual(finding.classification, "mapped");

  seed(STORAGE_KEYS.ACTIVE_JOURNAL, validJournal({ trackId: "coding-interview-dsa-problem-solving" }));
  finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");
  assert.equal(finding.reason, "package_track_mismatch");
});

test("active journal and every account-sync element fail closed without throwing", () => {
  seed(STORAGE_KEYS.ACTIVE_JOURNAL, { ...validJournal(), writes: [{ kind: "put_session", record: {} }] });
  let finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");
  assert.equal(finding.identityBearing, true);

  const cases: readonly Readonly<Record<string, unknown>>[] = [
    validAccountState({ outbox: [{}] }),
    validAccountState({ acknowledged: { bad: {} } }),
    validAccountState({ syncPlan: { version: 3, planId: "plan-1", snapshotVersion: 1, expectedAccountRevision: 0, highWatermark: 1, items: [{}] } }),
    validAccountState({ materialization: { kind: "discardGuest", accountId: "account-1", installationId: "install-1", phase: "prepared", guestBackup: [{ key: STORAGE_KEYS.ACTIVE_TRACK, value: "{" }] } }),
  ];
  for (const value of cases) {
    seed(STORAGE_KEYS.ACCOUNT_SYNC, value);
    finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
    assert.equal(finding.classification, "malformed");
    assert.equal(finding.identityBearing, true);
  }
});

test("content reports remain passthrough without artifact SHA and duplicate client submissions block", () => {
  seed(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, [validReport()]);
  let finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "passthrough");
  assert.equal(finding.identityBearing, true);
  assert.equal(scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).counts.mapped, 0);
  assert.equal(CONTENT_IDENTITY_INVENTORY_REGISTRY.find((entry) => entry.selector === STORAGE_KEYS.CONTENT_REPORT_OUTBOX)?.identityPaths.includes("payload[].input.context.releasePackageId"), true);

  seed(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, [validReport("duplicate"), validReport("duplicate")]);
  finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "duplicate");
  assert.equal(finding.reason, "duplicate_client_submission_id");
  assert.equal(scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).counts.blockingKeys, 1);

  seed(STORAGE_KEYS.CONTENT_REPORT_OUTBOX, [{ ...validReport(), input: { ...validReport().input as Record<string, unknown>, context: { ...(validReport().input as Record<string, unknown>).context as Record<string, unknown>, releasePackageId: "" } } }]);
  finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");
});

test("guest backup accepts only the account repository learning allow-list and validates nested envelopes", () => {
  seed(STORAGE_KEYS.ACCOUNT_SYNC, validAccountState({
    materialization: {
      kind: "discardGuest",
      accountId: "account-1",
      installationId: "install-1",
      phase: "prepared",
      guestBackup: [{ key: STORAGE_KEYS.ACTIVE_JOURNAL, value: envelope(validJournal()) }],
    },
  }));
  let finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "unsupported");
  assert.equal(finding.reason, "backup_key_not_learning");
  assert.equal(finding.identityBearing, true);

  seed(STORAGE_KEYS.ACCOUNT_SYNC, validAccountState({
    materialization: {
      kind: "discardGuest",
      accountId: "account-1",
      installationId: "install-1",
      phase: "prepared",
      guestBackup: [{ key: STORAGE_KEYS.ACTIVE_TRACK, value: envelope({ invalid: true }) }],
    },
  }));
  finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");
});

test("draft scope is compared with the existing active session", () => {
  const session = validSession();
  seed(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["session-1"]);
  seed(STORAGE_KEYS.trainingSession("session-1"), session);
  seed(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT, {
    schemaVersion: 1,
    familyId: "family-1",
    draftVersion: 1,
    revision: 1,
    sessionId: "session-1",
    trackId: "coding-interview-dsa-problem-solving",
    responsesByOccurrenceId: {},
    flaggedOccurrenceIds: [],
    updatedAt: "2026-01-01T09:00:00.000Z",
  });
  const byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT)?.classification, "malformed");
  assert.equal(byKey.get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION_DRAFT)?.reason, "draft_session_scope_mismatch");
});

test("conditional identity paths are registered and repeated attempts do not become duplicate identities", () => {
  const session = validSession();
  seed(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["session-1"]);
  seed(STORAGE_KEYS.trainingSession("session-1"), session);
  const attempt = (id: string, occurrenceId: string) => ({
    id,
    sessionId: "session-1",
    trackId,
    modeId: "practice",
    occurrenceId,
    item: mappedIdentity(),
    response: { answer: "a" },
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: mappedIdentity(), taxonomyOrSkillRefs: [] },
    answeredAt: "2026-01-01T09:00:00.000Z",
    committedAt: "2026-01-01T09:01:00.000Z",
  });
  seed(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, ["attempt-1", "attempt-2"]);
  seed(STORAGE_KEYS.trainingAttempt("attempt-1"), attempt("attempt-1", "occurrence-1"));
  seed(STORAGE_KEYS.trainingAttempt("attempt-2"), attempt("attempt-2", "occurrence-2"));
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(report.findings.some((entry) => entry.classification === "duplicate" && entry.key.includes("training-attempt")), false);
  const sessionPaths = CONTENT_IDENTITY_INVENTORY_REGISTRY.find((entry) => entry.selector === `${STORAGE_NAMESPACE}training-session:`)?.identityPaths ?? [];
  assert.equal(sessionPaths.includes("payload.conditionalReinsertSlots[*].ordinaryBranch.occurrence.item"), true);
  assert.equal(sessionPaths.includes("payload.conditionalReinsertSlots[*].reviewedVariantBranch.occurrence.item"), true);
  assert.equal(sessionPaths.includes("payload.conditionalReinsertSlots[*].exactSourceBranch.occurrence.item"), true);
  const notificationPaths = CONTENT_IDENTITY_INVENTORY_REGISTRY.find((entry) => entry.selector === STORAGE_KEYS.NOTIFICATION_SETTINGS)?.identityPaths ?? [];
  assert.equal(notificationPaths.includes("payload.pending.expectedIdentity.contentPackagePin"), true);
  const learningPlanPaths = CONTENT_IDENTITY_INVENTORY_REGISTRY.find((entry) => entry.selector === `${STORAGE_NAMESPACE}learning-plan:`)?.identityPaths ?? [];
  assert.deepEqual(learningPlanPaths, ["payload.contentVersion", "payload.contentPackagePin"]);
});

test("current practice-reminder settings and journal shapes are not treated as malformed", () => {
  seed(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
    practiceReminder: {
      mode: "same-time",
      commonTime: { hour: 20, minute: 0 },
      schedules: [{ day: "mon", time: { hour: 20, minute: 0 }, notificationId: "notification-1" }],
      trackId,
      transactionId: "transaction-1",
    },
  });
  let byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get(STORAGE_KEYS.NOTIFICATION_SETTINGS)?.classification, "passthrough");

  seed(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL, {
    version: 2,
    created: [{ day: "mon", time: { hour: 20, minute: 0 }, notificationId: "notification-1" }],
    desired: { mode: "same-time", commonTime: { hour: 20, minute: 0 }, days: [{ day: "mon", time: { hour: 20, minute: 0 } }], trackId },
    remainingOldIds: [],
    transactionId: "transaction-1",
  });
  byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get(STORAGE_KEYS.NOTIFICATION_SETTINGS_JOURNAL)?.classification, "passthrough");
});

test("settings with a foreign package pin stay owner-validated passthrough", () => {
  seed(STORAGE_KEYS.NOTIFICATION_SETTINGS, {
    schemaVersion: 1,
    enabled: true,
    identity: {
      trackId,
      goalRevision: 1,
      planId: "plan:one",
      planRevision: 1,
      storageRevision: 1,
      commandId: "command:one",
      timezone: "UTC",
      contentVersion: "foreign-v1",
      contentPackagePin: pin({ packageIdentity: unknownArtifactSha256, packageVersion: "foreign-v1" }),
    },
    schedules: [{ slotId: "slot:mon", day: "mon", localTime: "20:00", notificationId: "native-mon" }],
    legacyNotificationIds: [],
    pending: null,
  });
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  const finding = report.findings[0]!;
  assert.equal(finding.classification, "passthrough");
  assert.equal(report.counts.mapped, 0);
  assert.equal(report.counts.blockingKeys, 0);
});

test("nested guest backup reports use the same owner and duplicate pipeline", () => {
  seed(STORAGE_KEYS.ACCOUNT_SYNC, validAccountState({
    materialization: {
      kind: "discardGuest",
      accountId: "account-1",
      installationId: "install-1",
      phase: "prepared",
      guestBackup: [{ key: STORAGE_KEYS.CONTENT_REPORT_OUTBOX, value: envelope([validReport("nested"), validReport("nested")]) }],
    },
  }));
  const finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "duplicate");
  assert.equal(finding.reason, "duplicate_client_submission_id");
  assert.ok(finding.paths.some((path) => path.includes("guestBackup[0]")));
});

test("cross-record session scope and lifecycle mismatches are blocking", () => {
  const otherTrack = "coding-interview-dsa-problem-solving";
  const otherSha = "c".repeat(64);
  const otherArtifact: ActiveContentArtifact = { trackId: otherTrack, contentVersion: "other-v1", artifactSha256: otherSha, questionIds: ["question-1"] };
  const artifacts = [artifact, otherArtifact];
  const seedActiveSession = (): void => {
    seed(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["session-1"]);
    seed(STORAGE_KEYS.trainingSession("session-1"), validSession());
  };
  seedActiveSession();
  seed(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, ["attempt-1"]);
  const otherItem = mappedIdentityFor(otherTrack, otherSha, "other-v1");
  seed(STORAGE_KEYS.trainingAttempt("attempt-1"), { ...validAttemptState(), trackId: otherTrack, item: otherItem, reviewEvidence: { sourceItem: otherItem, taxonomyOrSkillRefs: [] } });
  let byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: artifacts }).findings.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get(STORAGE_KEYS.trainingAttempt("attempt-1"))?.classification, "malformed");
  assert.ok(byKey.get(STORAGE_KEYS.trainingAttempt("attempt-1"))?.paths.includes("payload.trackId"));

  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  seedActiveSession();
  seed(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, ["attempt-1"]);
  seed(STORAGE_KEYS.trainingAttempt("attempt-1"), validAttemptState());
  seed(STORAGE_KEYS.REVIEW_INDEX, ["review-1"]);
  seed(STORAGE_KEYS.reviewEntry("review-1"), {
    id: "review-1",
    trackId: otherTrack,
    sourceAttemptId: "attempt-1",
    sourceSessionId: "session-1",
    sourceItem: otherItem,
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: "2026-01-01T10:00:00.000Z",
    createdAt: "2026-01-01T09:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  });
  byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: artifacts }).findings.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get(STORAGE_KEYS.reviewEntry("review-1"))?.classification, "malformed");
  assert.ok(byKey.get(STORAGE_KEYS.reviewEntry("review-1"))?.paths.includes("payload.sourceItem"));

  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  seedActiveSession();
  seed(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER, {
    schemaVersion: 1,
    timerVersion: 1,
    familyId: "practice",
    sessionId: "session-1",
    trackId: otherTrack,
    accumulatedForegroundMs: 0,
    checkpointRevision: 1,
    lastCheckpointAt: "2026-01-01T09:00:00.000Z",
    running: true,
  });
  byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: artifacts }).findings.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get(STORAGE_KEYS.ACTIVE_FOREGROUND_TIMER)?.reason, "timer_session_scope_mismatch");

  storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  const completed = { ...validSession(), status: "completed" as const, completedAt: "2026-01-01T10:00:00.000Z" };
  seed(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["session-1"]);
  seed(STORAGE_KEYS.trainingSession("session-1"), completed);
  seed(STORAGE_KEYS.trainingSessionResult("session-1"), createTrainingSessionResult({ id: "result-1", sessionId: "session-1", trackId, totalOccurrences: 1, answeredOccurrenceIds: ["occurrence-1"], unansweredOccurrenceIds: [], completedAt: "2026-01-01T10:00:00.000Z", evidence: { familyId: "practice", details: {} } }));
  seed(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, "session-1");
  byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: artifacts }).findings.map((entry) => [entry.key, entry]));
  assert.equal(byKey.get(STORAGE_KEYS.trainingSessionResult("session-1"))?.classification, "passthrough");
  assert.equal(byKey.get(STORAGE_KEYS.ACTIVE_TRAINING_SESSION)?.reason, "active_pointer_references_non_active_session");
});

test("account sync top-level and record identity keys are exact and fail closed", () => {
  const missingTopLevel = validAccountState();
  delete missingTopLevel.highWatermark;
  seed(STORAGE_KEYS.ACCOUNT_SYNC, missingTopLevel);
  let finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");

  const entry = validAccountState().outbox as readonly Record<string, unknown>[];
  seed(STORAGE_KEYS.ACCOUNT_SYNC, validAccountState({ outbox: [{ ...entry[0], recordId: "" }] }));
  finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");

  seed(STORAGE_KEYS.ACCOUNT_SYNC, { ...validAccountState(), unexpected: true });
  finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "malformed");
});

test("attempts and reviews may reference completed or abandoned terminal history", () => {
  const completedSession = { ...validSession({ id: "completed-session" }), status: "completed" as const, completedAt: "2026-01-01T10:00:00.000Z" };
  const abandonedSession = { ...validSession({ id: "abandoned-session" }), status: "abandoned" as const };
  const attemptFor = (id: string, sessionId: string) => ({ ...validAttemptState(), id, sessionId });
  const reviewFor = (id: string, attemptId: string, sessionId: string) => ({
    id,
    trackId,
    sourceAttemptId: attemptId,
    sourceSessionId: sessionId,
    sourceItem: mappedIdentity(),
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: "2026-01-01T10:00:00.000Z",
    createdAt: "2026-01-01T09:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  });
  seed(STORAGE_KEYS.TRAINING_SESSION_INDEX, ["completed-session", "abandoned-session"]);
  seed(STORAGE_KEYS.trainingSession("completed-session"), completedSession);
  seed(STORAGE_KEYS.trainingSession("abandoned-session"), abandonedSession);
  seed(STORAGE_KEYS.TRAINING_ATTEMPT_INDEX, ["completed-attempt", "abandoned-attempt"]);
  seed(STORAGE_KEYS.trainingAttempt("completed-attempt"), attemptFor("completed-attempt", "completed-session"));
  seed(STORAGE_KEYS.trainingAttempt("abandoned-attempt"), attemptFor("abandoned-attempt", "abandoned-session"));
  seed(STORAGE_KEYS.REVIEW_INDEX, ["completed-review", "abandoned-review"]);
  seed(STORAGE_KEYS.reviewEntry("completed-review"), reviewFor("completed-review", "completed-attempt", "completed-session"));
  seed(STORAGE_KEYS.reviewEntry("abandoned-review"), reviewFor("abandoned-review", "abandoned-attempt", "abandoned-session"));
  const byKey = new Map(scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings.map((entry) => [entry.key, entry]));
  for (const key of [
    STORAGE_KEYS.trainingAttempt("completed-attempt"),
    STORAGE_KEYS.trainingAttempt("abandoned-attempt"),
    STORAGE_KEYS.reviewEntry("completed-review"),
    STORAGE_KEYS.reviewEntry("abandoned-review"),
  ]) {
    assert.notEqual(byKey.get(key)?.classification, "orphan");
  }
});

test("durable review identity duplicates are detected inside one guest backup", () => {
  const review = (id: string) => ({
    id,
    trackId,
    sourceAttemptId: `${id}-attempt`,
    sourceSessionId: `${id}-session`,
    sourceItem: mappedIdentity(),
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect"],
    dueAt: "2026-01-01T10:00:00.000Z",
    createdAt: "2026-01-01T09:00:00.000Z",
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  });
  seed(STORAGE_KEYS.ACCOUNT_SYNC, validAccountState({
    materialization: {
      kind: "discardGuest",
      accountId: "account-1",
      installationId: "install-1",
      phase: "prepared",
      guestBackup: [
        { key: STORAGE_KEYS.reviewEntry("review-a"), value: envelope(review("review-a")) },
        { key: STORAGE_KEYS.reviewEntry("review-b"), value: envelope(review("review-b")) },
      ],
    },
  }));
  const finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "duplicate");
  assert.equal(finding.reason, "duplicate_durable_review_identity");
  assert.ok(finding.paths.some((path) => path.includes("guestBackup[0]")));
  assert.ok(finding.paths.some((path) => path.includes("guestBackup[1]")));
});

test("account sync active-track metadata pins are not content mappings", () => {
  const recordPayload = { recordId: "current", recordType: "active_track" as const, trackId, state: { trackId, packagePin: pin() }, version: 0 };
  const record = { ...recordPayload, fingerprint: accountDataRecordFingerprint(recordPayload) };
  const mutationId = "mutation_1234567890123456";
  const outboxEntry = { ...record, mutationId, expectedVersion: null, attemptCount: 0, lastErrorCode: null, status: "pending" as const, sequence: 1 };
  const state = validAccountState({
    outbox: [outboxEntry],
    syncPlan: {
      version: 3,
      planId: "plan-1",
      snapshotVersion: 1,
      expectedAccountRevision: 0,
      highWatermark: 1,
      items: [{ sequence: 1, recordKey: accountDataRecordKey(record), mutationId, expectedVersion: null, payload: record, groupId: null, status: "pending" as const }],
    },
  });
  seed(STORAGE_KEYS.ACCOUNT_SYNC, state);
  const report = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] });
  assert.equal(report.findings[0]?.classification, "passthrough");
  assert.equal(report.counts.mapped, 0);
});

test("legacy readable pending confirmation is explicit unsupported, not generic malformed", () => {
  seed(STORAGE_KEYS.ACCOUNT_SYNC, validAccountState({
    pendingConfirmation: {
      operationId: "operation-1",
      previewFingerprint: "f".repeat(64),
      resolutions: [{ conflictId: "conflict-1", resolution: "keep_guest" }],
    },
  }));
  const finding = scanContentIdentityInventory({ storage, activeArtifacts: [artifact] }).findings[0]!;
  assert.equal(finding.classification, "unsupported");
  assert.equal(finding.reason, "legacy_account_pending_confirmation");
});
