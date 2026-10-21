import { beginAccountSignOut, getAccountSignOutState, beginAccountDeletion, getAccountDeletionState } from "./accountLifecycleRepository";
import assert from "node:assert/strict";
import test, { beforeEach } from "node:test";

import {
  createTrainingSession,
  type ResolvedContentRef,
  type TrainingAttempt,
  type TrainingSession,
} from "../../domain";
import { MemoryKeyValueStorage, installKeyValueStorageForTests, setProfileStoragePreparationFactoryForTests } from "../../infrastructure/storage/mmkvClient";
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
import { createContentSessionPlanFingerprint } from "../../content/application/contentSessionIdentity";
import { productionTrackAdmissionContext } from "../../application/tracks/trackAdmissionContext";


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

test("canonical repository bootstrap requires an already active storage scope", async () => {
  let preparationCalls = 0;
  const steps: CanonicalRepositoryBootstrapStep[] = [];
  setProfileStoragePreparationFactoryForTests(async () => {
    preparationCalls += 1;
    throw new Error("bootstrap must not prepare storage");
  });

  await assert.rejects(
    () => openCanonicalRepositories({ onStep: (step) => { steps.push(step); } }),
    /encrypted_storage_not_initialized/u,
  );

  assert.equal(preparationCalls, 0);
  assert.deepEqual(steps, []);
  setProfileStoragePreparationFactoryForTests(null);
});

test("session repository read and write fail closed when the required track admission denies the record", async () => {
  const storage = new MemoryKeyValueStorage();
  installKeyValueStorageForTests(storage);
  const active = session();
  const deniedAdmission = Object.freeze({ isAdmittedTrackId: () => false });
  const malformedAdmission = Object.freeze({});
  const emptyBefore = storage.snapshot();

  await assert.rejects(saveTrainingSession(active, deniedAdmission));
  await assert.rejects(Reflect.apply(saveTrainingSession, undefined, [active, malformedAdmission]));
  await assert.rejects(Reflect.apply(saveTrainingSession, undefined, [active]));
  assert.deepEqual(storage.snapshot(), emptyBefore, "a denied write must not create a canonical record or index");

  await saveTrainingSession(active, productionTrackAdmissionContext);
  const persisted = storage.snapshot();
  await assert.rejects(getTrainingSessions(deniedAdmission));
  await assert.rejects(Reflect.apply(getTrainingSessions, undefined, [malformedAdmission]));
  await assert.rejects(Reflect.apply(getTrainingSessions, undefined, []));
  assert.deepEqual(storage.snapshot(), persisted, "a denied read must retain the exact record and index bytes");
});

test("canonical repositories use individual immutable records and one active session", async () => {
  const active = session();
  const durableAttempt = attempt({ item: active.itemOrder[0]!.item });

  await saveActiveTrackId(TRACK_ID);
  await saveTrainingSession(active, productionTrackAdmissionContext);
  await addTrainingAttempt(durableAttempt, productionTrackAdmissionContext);
  await addTrainingAttempt(durableAttempt, productionTrackAdmissionContext);

  assert.equal(await getActiveTrackId(), TRACK_ID);
  assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value.map((value) => value.id), [active.id]);
  assert.deepEqual((await getTrainingAttempts(productionTrackAdmissionContext)).value.map((value) => value.id), [durableAttempt.id]);
  await assert.rejects(addTrainingAttempt({ ...durableAttempt, response: { changed: true } }, productionTrackAdmissionContext), /immutable/);
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
  await saveTrainingSession(active, productionTrackAdmissionContext);

  await assert.doesNotReject(() => saveTrainingSession({ ...active, currentItemIndex: 0 }, productionTrackAdmissionContext));
  await saveTrainingSession({ ...active, currentItemIndex: 0 }, productionTrackAdmissionContext);
  await assert.rejects(() => saveTrainingSession({ ...active, activeForegroundMs: 499 }, productionTrackAdmissionContext), /cannot decrease/);

  installKeyValueStorageForTests(new MemoryKeyValueStorage());
  writeCanonicalJson(STORAGE_KEYS.ACTIVE_TRAINING_SESSION, active.id);
  await assert.rejects(() => getActiveTrainingSession(productionTrackAdmissionContext), /references missing session/);
});

test("active sessions persist only preallocated conditional reinsert resolutions", async () => {
  const itemOrder = Array.from({ length: 10 }, (_, index) => ({ occurrenceId: `occurrence-${index + 1}`, item: ref(`i-${index + 1}`) }));
  const makeSlot = (sourceIndex: number) => {
    const targetIndex = sourceIndex + 4;
    const alternative = { occurrence: { occurrenceId: `${itemOrder[sourceIndex]!.occurrenceId}:conditional:${targetIndex}:exact`, item: itemOrder[sourceIndex]!.item }, optionOrder: ["a", "b"] };
    return {
      slot: {
        slotId: `${itemOrder[sourceIndex]!.occurrenceId}:conditional:${targetIndex}`,
        sourceOccurrenceId: itemOrder[sourceIndex]!.occurrenceId,
        ordinaryBranch: { occurrence: itemOrder[targetIndex]!, optionOrder: ["a", "b"] },
        exactSourceBranch: alternative,
        resolutionRule: "incorrect_or_partial_after_three_materialized_submissions" as const,
      },
      alternative,
      targetIndex,
    };
  };
  const first = makeSlot(0);
  const cascaded = makeSlot(4);
  const initial = session({
    id: "conditional",
    requestedLength: 10,
    actualLength: 10,
    itemOrder,
    optionOrderByOccurrence: Object.fromEntries(itemOrder.map(({ occurrenceId }) => [occurrenceId, ["a", "b"]])),
    conditionalReinsertSlots: [first.slot, cascaded.slot],
    taxonomyVersion: "test-taxonomy-v1",
    planFingerprint: "a".repeat(64),
  });
  const initialFingerprint = await createContentSessionPlanFingerprint(initial as TrainingSession & { taxonomyVersion: string });
  const prepared = createTrainingSession({ ...initial, planFingerprint: initialFingerprint });

  const resolvedOrder = [...prepared.itemOrder];
  resolvedOrder[first.targetIndex] = first.alternative.occurrence;
  const resolvedOptions = { ...prepared.optionOrderByOccurrence };
  delete (resolvedOptions as Record<string, readonly string[]>)[itemOrder[first.targetIndex]!.occurrenceId];
  (resolvedOptions as Record<string, readonly string[]>)[first.alternative.occurrence.occurrenceId] = first.alternative.optionOrder;
  const remainingSlots = [first.slot, cascaded.slot].filter((slot) =>
    new Set(resolvedOrder.map((occurrence) => occurrence.occurrenceId)).has(slot.sourceOccurrenceId) &&
    new Set(resolvedOrder.map((occurrence) => occurrence.occurrenceId)).has(slot.ordinaryBranch.occurrence.occurrenceId),
  );
  const resolvedWithoutFingerprint = createTrainingSession({ ...prepared, itemOrder: resolvedOrder, optionOrderByOccurrence: resolvedOptions, conditionalReinsertSlots: remainingSlots, planFingerprint: "b".repeat(64) });
  const resolvedFingerprint = await createContentSessionPlanFingerprint(resolvedWithoutFingerprint as TrainingSession & { taxonomyVersion: string });
  const resolved = createTrainingSession({ ...resolvedWithoutFingerprint, planFingerprint: resolvedFingerprint });

  await saveTrainingSession(prepared, productionTrackAdmissionContext);
  await assert.doesNotReject(() => saveTrainingSession(resolved, productionTrackAdmissionContext));
  assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value, [resolved]);
  assert.equal(resolved.itemOrder[cascaded.targetIndex]?.occurrenceId, prepared.itemOrder[cascaded.targetIndex]?.occurrenceId);
  assert.deepEqual(resolved.conditionalReinsertSlots, remainingSlots);
  await assert.doesNotReject(() => saveTrainingSession(resolved, productionTrackAdmissionContext));

  const arbitraryOrder = [...prepared.itemOrder];
  arbitraryOrder[2] = { ...arbitraryOrder[2]!, item: ref("unreserved-change") };
  await assert.rejects(() => saveTrainingSession({ ...prepared, itemOrder: arbitraryOrder }, productionTrackAdmissionContext), /conditional reinsert plan/);
  await assert.rejects(() => saveTrainingSession({ ...prepared, conditionalReinsertSlots: [first.slot] }, productionTrackAdmissionContext), /conditional reinsert plan/);
  await assert.rejects(() => saveTrainingSession({
    ...prepared,
    optionOrderByOccurrence: { ...prepared.optionOrderByOccurrence, [itemOrder[2]!.occurrenceId]: ["b", "a"] },
  }, productionTrackAdmissionContext), /conditional reinsert plan/);
});

test("terminal sessions are immutable except for identical recovery replay", async () => {
  const completed = session({
    id: "done",
    status: "completed",
    currentItemIndex: 0,
    activeForegroundMs: 500,
    completedAt: "2026-01-01T00:01:00.000Z",
  });
  await saveTrainingSession(completed, productionTrackAdmissionContext);
  await assert.doesNotReject(() => saveTrainingSession(completed, productionTrackAdmissionContext));
  await assert.rejects(() => saveTrainingSession({ ...completed, activeForegroundMs: 501 }, productionTrackAdmissionContext), /immutable/);
  await assert.rejects(() => saveTrainingSession({ ...completed, completedAt: "2026-01-01T00:02:00.000Z" }, productionTrackAdmissionContext), /immutable/);
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

  assert.equal(isTrainingSession(canonicalSession, productionTrackAdmissionContext), true);
  assert.equal(isTrainingSession({ ...canonicalSession, artifactSha256: ARTIFACT_SHA256.toUpperCase() }, productionTrackAdmissionContext), false);
  assert.equal(isTrainingAttempt(canonicalAttempt, productionTrackAdmissionContext), true);
  assert.equal(isTrainingAttempt({ ...canonicalAttempt, item: ref("i", { contentVersion: "other" }) }, productionTrackAdmissionContext), false);
  assert.equal(isReviewQueueEntry(canonicalReview, productionTrackAdmissionContext), true);
  assert.equal(isReviewQueueEntry({ ...canonicalReview, sourceItem: { ...canonicalReview.sourceItem, artifactSha256: "b".repeat(64) } }, productionTrackAdmissionContext), true);
  assert.equal(isReviewQueueEntry({
    ...canonicalReview,
    sourceItem: {
      kind: "unavailable_review",
      trackId: TRACK_ID,
      questionId: "i",
      contentVersion: "v",
      reason: "unknown_artifact_hash",
      reviewId: canonicalReview.id,
    },
  }, productionTrackAdmissionContext), false);

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
  }, productionTrackAdmissionContext), false);
  assert.equal(isTrainingAttempt({ ...canonicalAttempt, item: legacyRef }, productionTrackAdmissionContext), false);
  assert.equal(isReviewQueueEntry({ ...canonicalReview, sourceItem: legacyRef }, productionTrackAdmissionContext), false);
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

  await assert.rejects(() => getTrainingSessions(productionTrackAdmissionContext), UnsupportedStoredRecordError);
});

test("canonical repository bootstrap reports the exact six steps in order", async () => {
  const steps: CanonicalRepositoryBootstrapStep[] = [];

  await openCanonicalRepositories({ onStep: (step) => { steps.push(step); } });

  assert.deepEqual(steps, CANONICAL_REPOSITORY_BOOTSTRAP_STEP_ORDER);
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


test("session revoke sign-out repository creates v7 and reads legacy v4 while deletion remains v4", () => {
  const before = Date.now();
  const fresh = beginAccountSignOut("account-sec07");
  assert.match(fresh.operationId, /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  const issuedAt = Number.parseInt(fresh.operationId.replaceAll("-", "").slice(0, 12), 16);
  assert.ok(issuedAt >= before && issuedAt <= Date.now());
  assert.deepEqual(getAccountSignOutState(), fresh);
  const legacy = { ...fresh, operationId: "00000000-0000-4000-8000-000000000001" };
  writeCanonicalJson(STORAGE_KEYS.ACCOUNT_SIGN_OUT, legacy);
  assert.deepEqual(getAccountSignOutState(), legacy);
  const deletion = beginAccountDeletion("account-sec07", "uid-sec07");
  assert.match(deletion.operationId, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u);
  assert.deepEqual(getAccountDeletionState(), deletion);
});

test("legacy unit proof is strict, pinned and deeply frozen in ordinary and conditional occurrences", async () => {
  const proof = { sourceItem: ref("source-a"), nodeId: "node", mentalUnitId: "unit" };
  const snapshot = { source: "due_queue" as const, reviewEntryId: "legacy-review", sourceAttemptId: "legacy-attempt", dueAt: STARTED_AT, policyVersion: "legacy-unqualified", stage: "legacy_active_unqualified" as const, legacyUnitProof: proof };
  const occurrences = Array.from({ length: 5 }, (_, index) => ({ occurrenceId: `occurrence-${index}`, item: ref(`b-${index}`), reviewSourceSnapshot: snapshot }));
  const canonical = session({ itemOrder: occurrences, conditionalReinsertSlots: [{ slotId: "slot", sourceOccurrenceId: occurrences[0]!.occurrenceId,
    ordinaryBranch: { occurrence: occurrences[4]!, optionOrder: [] }, reviewedVariantBranch: { occurrence: { occurrenceId: "variant", item: ref("variant"), reviewSourceSnapshot: snapshot }, optionOrder: [] },
    resolutionRule: "incorrect_or_partial_after_three_materialized_submissions" }] });
  await saveTrainingSession(canonical, productionTrackAdmissionContext);
  assert.deepEqual((await getTrainingSessions(productionTrackAdmissionContext)).value[0]!.itemOrder, canonical.itemOrder);
  for (const occurrence of [...canonical.itemOrder, canonical.conditionalReinsertSlots![0]!.ordinaryBranch.occurrence, canonical.conditionalReinsertSlots![0]!.reviewedVariantBranch!.occurrence]) {
    assert.ok(Object.isFrozen(occurrence.reviewSourceSnapshot));
    assert.ok(Object.isFrozen(occurrence.reviewSourceSnapshot!.legacyUnitProof));
    assert.ok(Object.isFrozen(occurrence.reviewSourceSnapshot!.legacyUnitProof!.sourceItem));
  }
  proof.nodeId = "changed-outside";
  assert.equal(canonical.itemOrder[0]!.reviewSourceSnapshot!.legacyUnitProof!.nodeId, "node");
  const validProof = canonical.itemOrder[0]!.reviewSourceSnapshot!.legacyUnitProof!;
  for (const invalid of [undefined, null, { ...validProof, extra: true }, { ...validProof, mentalUnitId: "" }, { nodeId: "node", mentalUnitId: "unit" }, ...["trackId", "contentVersion", "artifactSha256"].map(key => ({ ...validProof, sourceItem: { ...validProof.sourceItem, [key]: key === "artifactSha256" ? "f".repeat(64) : "foreign" } }))]) {
    const changed = { ...canonical, itemOrder: [{ ...canonical.itemOrder[0]!, reviewSourceSnapshot: { ...snapshot, legacyUnitProof: invalid } }, ...canonical.itemOrder.slice(1)] };
    assert.equal(isTrainingSession(changed, productionTrackAdmissionContext), false);
    assert.throws(() => createTrainingSession(changed as TrainingSession));
  }
});
