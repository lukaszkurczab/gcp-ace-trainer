import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  createTrainingSession,
  type ResolvedContentRef,
  type TrainingAttempt,
  type TrainingSession,
} from "../../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests } from "../../infrastructure/storage/mmkvClient";
import {
  CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER,
  CanonicalRepositoryBootstrapStep,
  addTrainingAttempt,
  getActiveTrackId,
  getActiveTrainingSession,
  getTrainingAttempts,
  getTrainingSessions,
  openCanonicalRepositories,
  saveActiveTrackId,
  saveTrainingSession,
} from "..";
import { STORAGE_KEYS } from "../keys";
import { writeCanonicalJson } from "./canonicalRecordCodec";
import { UnsupportedStoredRecordError } from "../errors";
import { isReviewQueueEntry, isTrainingAttempt, isTrainingSession } from "./trainingModelGuards";

const TRACK_ID = "coding-interview-dsa-problem-solving" as const;
const ARTIFACT_SHA256 = "a".repeat(64);
const STARTED_AT = "2026-01-01T00:00:00.000Z";

function ref(questionId = "i", overrides: Partial<ResolvedContentRef> = {}): ResolvedContentRef {
  return {
    trackId: TRACK_ID,
    questionId,
    contentVersion: "v",
    artifactSha256: ARTIFACT_SHA256,
    ...overrides,
  };
}

function session(overrides: Partial<TrainingSession> = {}): TrainingSession {
  const itemOrder = overrides.itemOrder ?? [{ occurrenceId: "occurrence-1", item: ref() }];
  return createTrainingSession({
    id: "s",
    trackId: TRACK_ID,
    modeId: "m",
    configurationSnapshot: { kind: "practice" },
    requestedLength: itemOrder.length,
    actualLength: itemOrder.length,
    currentItemIndex: 0,
    itemOrder,
    optionOrderByOccurrence: {},
    activeForegroundMs: 0,
    contentVersion: "v",
    artifactSha256: ARTIFACT_SHA256,
    status: "active",
    startedAt: STARTED_AT,
    ...overrides,
  });
}

function attempt(overrides: Partial<TrainingAttempt<unknown>> = {}): TrainingAttempt<unknown> {
  const item = overrides.item ?? ref();
  return {
    id: "a",
    sessionId: "s",
    trackId: TRACK_ID,
    modeId: "m",
    occurrenceId: "occurrence-1",
    item,
    response: {},
    result: { kind: "correct", earnedPoints: 1, maxPoints: 1 },
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
    answeredAt: STARTED_AT,
    committedAt: STARTED_AT,
    ...overrides,
  };
}

beforeEach(() => installKeyValueStorageForTests(new MemoryKeyValueStorage()));

test("canonical repositories use individual immutable records and one active session", async () => {
  const active = session();
  const durableAttempt = attempt({ item: active.itemOrder[0]!.item });

  await saveActiveTrackId(TRACK_ID);
  await saveTrainingSession(active);
  await addTrainingAttempt(durableAttempt);
  await addTrainingAttempt(durableAttempt);

  assert.equal(await getActiveTrackId(), TRACK_ID);
  assert.deepEqual((await getTrainingSessions()).value.map((value) => value.id), [active.id]);
  assert.deepEqual((await getTrainingAttempts()).value.map((value) => value.id), [durableAttempt.id]);
  await assert.rejects(addTrainingAttempt({ ...durableAttempt, response: { changed: true } }), /immutable/);
});

test("training sessions permit free navigation while rejecting regressing foreground time and missing active records", async () => {
  const active = session({
    currentItemIndex: 1,
    itemOrder: [
      { occurrenceId: "occurrence-1", item: ref("i") },
      { occurrenceId: "occurrence-2", item: ref("j") },
    ],
    requestedLength: 2,
    actualLength: 2,
    activeForegroundMs: 500,
  });
  await saveTrainingSession(active);

  await assert.doesNotReject(() => saveTrainingSession({ ...active, currentItemIndex: 0 }));
  await saveTrainingSession({ ...active, currentItemIndex: 0 });
  await assert.rejects(() => saveTrainingSession({ ...active, activeForegroundMs: 499 }), /cannot decrease/);

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, active.id);
  await assert.rejects(() => getActiveTrainingSession(), /references missing session/);
});

test("terminal sessions are immutable except for identical recovery replay", async () => {
  const completed = session({
    id: "done",
    status: "completed",
    currentItemIndex: 0,
    activeForegroundMs: 500,
    completedAt: "2026-01-01T00:01:00.000Z",
  });
  await saveTrainingSession(completed);
  await assert.doesNotReject(() => saveTrainingSession(completed));
  await assert.rejects(() => saveTrainingSession({ ...completed, activeForegroundMs: 501 }), /immutable/);
  await assert.rejects(() => saveTrainingSession({ ...completed, completedAt: "2026-01-01T00:02:00.000Z" }), /immutable/);
});

test("strict guards accept resolved identities and reject mismatches, tombstones, and legacy identity fields", () => {
  const canonicalSession = session();
  const canonicalAttempt = attempt();
  const canonicalReview = {
    id: "review-a",
    trackId: TRACK_ID,
    sourceAttemptId: canonicalAttempt.id,
    sourceSessionId: canonicalAttempt.sessionId,
    sourceItem: canonicalAttempt.item,
    taxonomyOrSkillRefs: [],
    reasons: ["incorrect" as const],
    dueAt: "2026-01-02T00:00:00.000Z",
    createdAt: STARTED_AT,
    consecutiveAfterDueSuccesses: 0,
    persistent: true,
  };

  assert.equal(isTrainingSession(canonicalSession), true);
  assert.equal(isTrainingSession({ ...canonicalSession, artifactSha256: ARTIFACT_SHA256.toUpperCase() }), false);
  assert.equal(isTrainingAttempt(canonicalAttempt), true);
  assert.equal(isTrainingAttempt({ ...canonicalAttempt, item: ref("i", { contentVersion: "other" }) }), false);
  assert.equal(isReviewQueueEntry(canonicalReview), true);
  assert.equal(isReviewQueueEntry({ ...canonicalReview, sourceItem: { ...canonicalReview.sourceItem, artifactSha256: "b".repeat(64) } }), true);
  assert.equal(isReviewQueueEntry({
    ...canonicalReview,
    sourceItem: {
      kind: "unavailable_review",
      trackId: TRACK_ID,
      questionId: "i",
      contentVersion: "v",
      reason: "unknown_artifact_hash",
      migrationVersion: 1,
      legacyIdentityDigest: ARTIFACT_SHA256,
      reviewId: canonicalReview.id,
    },
  }), false);

  const legacyRef = {
    trackId: TRACK_ID,
    itemId: "i",
    contentVersion: "v",
    packagePin: { packageIdentity: ARTIFACT_SHA256, packageVersion: "v", contentReleaseId: "release" },
  };
  assert.equal(isTrainingSession({
    ...canonicalSession,
    artifactSha256: undefined,
    packagePin: legacyRef.packagePin,
    itemOrder: [{ occurrenceId: "occurrence-1", item: legacyRef }],
  }), false);
  assert.equal(isTrainingAttempt({ ...canonicalAttempt, item: legacyRef }), false);
  assert.equal(isReviewQueueEntry({ ...canonicalReview, sourceItem: legacyRef }), false);
});

test("strict session reads reject a legacy-shaped stored record without inference", async () => {
  const canonical = session({ id: "legacy-session" });
  const legacyRef = {
    trackId: TRACK_ID,
    itemId: "i",
    contentVersion: "v",
    packagePin: { packageIdentity: ARTIFACT_SHA256, packageVersion: "v", contentReleaseId: "release" },
  };
  const { artifactSha256: _artifactSha256, ...withoutArtifact } = canonical;
  const legacyRecord = {
    ...withoutArtifact,
    packagePin: legacyRef.packagePin,
    itemOrder: [{ occurrenceId: "occurrence-1", item: legacyRef }],
  };
  writeCanonicalJson(STORAGE_KEYS.TRAINING_SESSION_INDEX, [canonical.id]);
  writeCanonicalJson(STORAGE_KEYS.trainingSession(canonical.id), legacyRecord);

  await assert.rejects(() => getTrainingSessions(), UnsupportedStoredRecordError);
});

test("canonical repository bootstrap reports the exact six steps in order", async () => {
  const steps: CanonicalRepositoryBootstrapStep[] = [];

  await openCanonicalRepositories({ onStep: (step) => { steps.push(step); } });

  assert.deepEqual(steps, CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER);
  assert.deepEqual(steps, [
    CanonicalRepositoryBootstrapStep.ContentIdentityMigration,
    CanonicalRepositoryBootstrapStep.StorageMetadataValidation,
    CanonicalRepositoryBootstrapStep.AcceptedReportOutboxPurge,
    CanonicalRepositoryBootstrapStep.ExpiredReportOutboxPurge,
    CanonicalRepositoryBootstrapStep.GuestAccessRead,
    CanonicalRepositoryBootstrapStep.GuestInstallationProvisioning,
  ]);
});

test("canonical repository bootstrap isolates a throwing step observer without wrapping failures", async () => {
  const error = new Error("guest payload=session-123");
  const steps: CanonicalRepositoryBootstrapStep[] = [];

  await assert.rejects(
    () => openCanonicalRepositories({
      onStep: (step) => {
        steps.push(step);
        throw new Error("observer payload=question-456");
      },
      guestInstallationIdentity: { async create() { throw error; } },
    }),
    (cause: unknown) => cause === error,
  );
  assert.deepEqual(steps, [...CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER]);
});
