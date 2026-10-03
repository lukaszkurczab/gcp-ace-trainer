import assert from "node:assert/strict";
import test from "node:test";

import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";
import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import { scoreCanonicalQuestion } from "../../content/canonical/questionScoring";
import type { CanonicalQuestionResponse, Question } from "../../content/canonical/questionTypes";
import { createTrainingAttempt, type ReviewQueueEntry, type TrackId } from "../../domain";
import { composeTrainingLifecycleUseCases } from "../bootstrap/trainingLifecycleComposition";
import { contentPackageRuntimeOwner } from "../contentPackageRuntimeOwner";
import { addReviewQueueItems, addTrainingAttempt, getActiveTrainingSession, getReviewQueueItems, getTrainingAttempts, getTrainingSessions } from "../../storage/repositories";
import { installMemoryStorage } from "../../testing/journalTestSupport";
import { STORAGE_KEYS } from "../../storage/keys";
import { TrainingApplicationFailure } from "../trainingLifecycle";

const TRACK_ID = "coding-interview-dsa-problem-solving";
const NOW = "2026-10-03T12:00:00.000Z";
const catalogPromise = loadCanonicalRuntimeCatalog();

function wrongResponse(question: Question): CanonicalQuestionResponse {
  if (question.interaction.type === "choice_single") {
    const q = question as Extract<Question, { interaction: { type: "choice_single" } }>;
    return { type: "choice_single", optionId: q.interaction.options.find((option) => option.optionId !== q.answer.optionId)!.optionId };
  }
  if (question.interaction.type === "choice_multiple") {
    const q = question as Extract<Question, { interaction: { type: "choice_multiple" } }>;
    return { type: "choice_multiple", optionIds: [q.interaction.options.find((option) => !q.answer.optionIds.includes(option.optionId))!.optionId] };
  }
  if (question.interaction.type === "ordering") {
    const q = question as Extract<Question, { interaction: { type: "ordering" } }>;
    return { type: "ordering", orderedElementIds: [...q.answer.orderedElementIds].reverse() };
  }
  return { type: question.interaction.type, selectedValueIdsByDimension: Object.fromEntries(question.interaction.dimensions.map((dimension) => [dimension.dimensionId, [dimension.values[0]!.valueId]])) };
}

function historicalMiss(track: CanonicalTrackRuntime, question: Question, suffix: string, attemptId = `historical-miss-${suffix}`) {
  const item = { trackId: track.trackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  const response = wrongResponse(question);
  const result = scoreCanonicalQuestion(question, response);
  assert.notEqual(result.kind, "correct", "historical fixture must be a real canonical miss");
  return createTrainingAttempt({
    id: attemptId, sessionId: `historical-session-${suffix}`, trackId: track.trackId,
    modeId: "coding-interview-learn-approach", occurrenceId: `historical-occurrence-${suffix}`,
    item, response, result,
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }] },
    answeredAt: "2026-10-01T12:00:00.000Z", committedAt: "2026-10-01T12:00:00.000Z",
  });
}

function dueReview(track: { trackId: string; contentVersion: string; artifactSha256: string }, question: Question, suffix: string, dueAt = "2026-10-03T11:00:00.000Z"): ReviewQueueEntry {
  const sourceItem = { trackId: track.trackId as TrackId, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  return {
    id: `review:${suffix}`, trackId: track.trackId as TrackId, sourceAttemptId: `review-attempt:${suffix}`, sourceSessionId: `review-session:${suffix}`,
    sourceItem, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }], reasons: ["incorrect"],
    dueAt, createdAt: "2026-10-01T12:00:00.000Z", consecutiveAfterDueSuccesses: 0, persistent: true,
  };
}

async function actualLifecycle(sessionId: string) {
  await contentPackageRuntimeOwner.verifyBundledPackages();
  return composeTrainingLifecycleUseCases({
    wallClock: { now: () => NOW },
    sessionIds: { create: async () => sessionId },
    premiumSessionAdmission: { authorize: async () => "allowed" },
  });
}

test("Coding weak-area review with explicit due_queue does not use a historical miss as fallback evidence", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const mode = track.getMode("coding-interview-weak-area-review");
  assert.equal(mode.selection.kind, "evidence_conditioned");
  const question = track.getPool(mode.modeId)[0]!;
  const item = { trackId: TRACK_ID, questionId: question.questionId, contentVersion: track.contentVersion, artifactSha256: track.artifactSha256 };
  const response = wrongResponse(question);
  const result = scoreCanonicalQuestion(question, response);
  assert.notEqual(result.kind, "correct", "historical fixture must be a real canonical miss");
  const historicalMiss = createTrainingAttempt({
    id: "historical-coding-weak-review-miss",
    sessionId: "historical-coding-session",
    trackId: TRACK_ID,
    modeId: "coding-interview-learn-approach",
    occurrenceId: "historical-coding-occurrence",
    item,
    response,
    result,
    reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [{ axisId: "node", nodeId: question.nodeId, role: "primary" }] },
    answeredAt: "2026-10-01T12:00:00.000Z",
    committedAt: "2026-10-01T12:00:00.000Z",
  });

  const outcome = await new CanonicalTrainingRuntime(track).prepare({
    trackId: TRACK_ID,
    modeId: mode.modeId,
    source: "practiceHub",
    request: { sessionId: "coding-due-queue-no-fallback", requestedLength: 10, reviewSource: "due_queue" },
    attempts: [historicalMiss],
    reviews: [],
    now: NOW,
  }).then(
    (prepared) => ({ kind: "prepared" as const, actualLength: prepared.session.actualLength, questionIds: prepared.session.itemOrder.map((entry) => entry.item.questionId) }),
    (error: unknown) => ({ kind: "rejected" as const, error }),
  );

  assert.equal(outcome.kind, "rejected", outcome.kind === "prepared"
    ? `due_queue has no current evidence but runtime prepared ${outcome.actualLength} item(s): ${outcome.questionIds.join(",")}`
    : "due_queue without due evidence must be rejected");
  if (outcome.kind === "rejected") assert.match(String(outcome.error), /insufficient eligible content/u);
});

test("actual lifecycle persists only due current refs, shortens to available due content, and does not append miss fallback", async () => {
  const storage = installMemoryStorage();
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const mode = track.getMode("coding-interview-weak-area-review");
  const pool = track.getPool(mode.modeId);
  assert.ok(pool.length >= 4, "fixture needs distinct due and historical-miss questions");
  const due = pool.slice(0, 3);
  const miss = historicalMiss(track, pool[3]!, "lifecycle-mixed");
  await addTrainingAttempt(miss);
  for (const [index, question] of due.entries()) {
    await addTrainingAttempt(historicalMiss(track, question, `lifecycle-due-${index}`, `review-attempt:lifecycle-${index}`));
  }
  const reviews = due.map((question, index) => dueReview(track, question, `lifecycle-${index}`));
  await addReviewQueueItems(reviews);

  const lifecycle = await actualLifecycle("coding-due-review-start");
  const prepared = await lifecycle.startSession({
    trackId: TRACK_ID,
    modeId: mode.modeId,
    source: "practiceHub",
    request: { requestedLength: 10, reviewSource: "due_queue" },
  });
  const selected = prepared.session.itemOrder.map((entry) => entry.item.questionId);
  assert.equal(prepared.session.requestedLength, 10);
  assert.equal(prepared.session.actualLength, 3, "available due evidence may shorten the requested review length");
  assert.deepEqual(selected, due.map((question) => question.questionId));
  assert.equal(new Set(selected).size, selected.length);
  assert.equal(selected.includes(pool[3]!.questionId), false, "an unrelated persisted miss cannot expand due_queue");
  assert.deepEqual((await getReviewQueueItems()).value, reviews);
  assert.equal((await getTrainingAttempts()).value.length, 4, "preparation does not rewrite historical attempts");
  assert.equal((await getActiveTrainingSession())?.id, "coding-due-review-start");
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_JOURNAL), false, "the real journal-backed start mutation has completed");
});

test("actual lifecycle rejects empty due evidence with no session write and preserves the historical attempt", async () => {
  const storage = installMemoryStorage();
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const mode = track.getMode("coding-interview-weak-area-review");
  const miss = historicalMiss(track, track.getPool(mode.modeId)[0]!, "lifecycle-empty");
  await addTrainingAttempt(miss);
  storage.resetCounters();

  const lifecycle = await actualLifecycle("coding-due-review-empty");
  await assert.rejects(
    lifecycle.startSession({ trackId: TRACK_ID, modeId: mode.modeId, source: "practiceHub", request: { requestedLength: 10, reviewSource: "due_queue" } }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_mode" && /insufficient eligible content/u.test(String(error.cause)),
  );
  assert.equal((await getActiveTrainingSession()), null);
  assert.deepEqual((await getTrainingSessions()).value, []);
  assert.equal(JSON.stringify((await getTrainingAttempts()).value), JSON.stringify([miss]));
  assert.deepEqual((await getReviewQueueItems()).value, []);
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
  assert.equal(storage.contains(STORAGE_KEYS.TRAINING_SESSION_INDEX), false);
  assert.equal(storage.operations.some((operation) => operation.kind !== "read"), false, "rejected preparation performs no durable write or removal");
});

test("explicit session_misses is unavailable before lifecycle persistence", async () => {
  const storage = installMemoryStorage();
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const mode = track.getMode("coding-interview-weak-area-review");
  storage.resetCounters();
  const lifecycle = await actualLifecycle("coding-session-misses-unsupported");

  await assert.rejects(
    lifecycle.startSession({ trackId: TRACK_ID, modeId: mode.modeId, source: "practiceHub", request: { requestedLength: 10, reviewSource: "session_misses", reviewItemRefs: [] } }),
    (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_mode" && /session_misses is unavailable without verified completed-session evidence/u.test(String(error.cause)),
  );
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
  assert.equal(storage.contains(STORAGE_KEYS.TRAINING_SESSION_INDEX), false);
  assert.equal(storage.operations.some((operation) => operation.kind !== "read"), false);
});

test("a single-source Design weak-area review keeps its existing due-only default without reviewSource", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("backend-system-design-interview");
  const mode = track.getMode("design-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const prepared = await new CanonicalTrainingRuntime(track).prepare({
    trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "design-review-default", requestedLength: 10 },
    attempts: [], reviews: [dueReview(track, question, "design-default")], now: NOW,
  });
  assert.equal(prepared.session.actualLength, 1);
  assert.deepEqual(prepared.session.itemOrder.map((entry) => entry.item.questionId), [question.questionId]);
});

test("single-source Certification weak-area review also keeps its due-only default without reviewSource", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("google-cloud-associate-cloud-engineer");
  const mode = track.getMode("certification-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const prepared = await new CanonicalTrainingRuntime(track).prepare({
    trackId: track.trackId, modeId: mode.modeId, request: { sessionId: "certification-review-default", requestedLength: mode.defaultRequestedLength },
    attempts: [], reviews: [dueReview(track, question, "certification-default")], now: NOW,
  });
  assert.equal(prepared.session.actualLength, 1);
  assert.deepEqual(prepared.session.itemOrder.map((entry) => entry.item.questionId), [question.questionId]);
});

test("due review selection rejects future and stale artifact/version/track references without fallback", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const mode = track.getMode("coding-interview-weak-area-review");
  const question = track.getPool(mode.modeId)[0]!;
  const current = dueReview(track, question, "matrix-current");
  const miss = historicalMiss(track, question, "matrix-fallback");
  const stale = [
    { ...current, id: "review:future", sourceAttemptId: "attempt:future", dueAt: "2026-10-03T13:00:00.000Z" },
    { ...current, id: "review:version", sourceAttemptId: "attempt:version", sourceItem: { ...current.sourceItem, contentVersion: "stale-version" } },
    { ...current, id: "review:hash", sourceAttemptId: "attempt:hash", sourceItem: { ...current.sourceItem, artifactSha256: "a".repeat(64) } },
    { ...current, id: "review:foreign", sourceAttemptId: "attempt:foreign", trackId: "backend-system-design-interview" as TrackId, sourceItem: { ...current.sourceItem, trackId: "backend-system-design-interview" as TrackId } },
  ];
  for (const evidence of stale) {
    await assert.rejects(new CanonicalTrainingRuntime(track).prepare({
      trackId: TRACK_ID, modeId: mode.modeId, request: { sessionId: evidence.id, requestedLength: 10, reviewSource: "due_queue" },
      attempts: [miss], reviews: [evidence], now: NOW,
    }), /insufficient eligible content/u, `${evidence.id} must not authorize content`);
  }
  const prepared = await new CanonicalTrainingRuntime(track).prepare({
    trackId: TRACK_ID, modeId: mode.modeId, request: { sessionId: "dedupe-current", requestedLength: 10, reviewSource: "due_queue" },
    attempts: [], reviews: [current, { ...current, id: "review:duplicate", sourceAttemptId: "attempt:duplicate" }], now: NOW,
  });
  assert.deepEqual(prepared.session.itemOrder.map((entry) => entry.item.questionId), [question.questionId], "duplicate review identity does not duplicate the question");
});

test("invalid review sources and refs are rejected on practice and simulation before selection", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  const runtime = new CanonicalTrainingRuntime(track);
  const modeId = "coding-interview-weak-area-review";
  const question = track.getPool(modeId)[0]!;
  const currentDue = dueReview(track, question, "invalid-request-proof");
  const prepare = (request: unknown, selectedMode = modeId, reviews: readonly ReviewQueueEntry[] = []) => runtime.prepare({ trackId: TRACK_ID, modeId: selectedMode, request: { sessionId: "invalid-source", requestedLength: 10, ...request as object }, attempts: [], reviews, now: NOW });
  await assert.rejects(prepare({ reviewSource: "invented" }), /reviewSource is invalid/u);
  await assert.rejects(prepare({ reviewSource: "due_queue", reviewItemRefs: [] }, modeId, [currentDue]), /require session_misses source/u);
  await assert.rejects(prepare({ reviewSource: "due_queue" }, "coding-interview-learn-approach", [currentDue]), /requires an evidence-conditioned mode/u);
  await assert.rejects(prepare({}), /requires an explicit reviewSource/u);
  await assert.rejects(prepare({ reviewItemRefs: [] }, "coding-interview-simulation"), /requires an evidence-conditioned mode/u);
  await assert.rejects(prepare({ reviewSource: "due_queue" }, "coding-interview-simulation"), /requires an evidence-conditioned mode/u);
});

test("actual lifecycle rejects review source on a simulation before any durable session write", async () => {
  const storage = installMemoryStorage();
  const catalog = await catalogPromise;
  const track = catalog.getTrack(TRACK_ID);
  storage.resetCounters();
  const lifecycle = await actualLifecycle("coding-simulation-review-source-invalid");

  await assert.rejects(lifecycle.startSession({
    trackId: TRACK_ID,
    modeId: "coding-interview-simulation",
    source: "practiceHub",
    request: { scope: { simulationProfileId: "algorithms-interview-simulation-v1" }, reviewSource: "due_queue" },
  }), (error: unknown) => error instanceof TrainingApplicationFailure && error.code === "unknown_mode" && /reviewSource requires an evidence-conditioned mode/u.test(String(error.cause)));
  assert.equal(storage.contains(STORAGE_KEYS.ACTIVE_TRAINING_SESSION), false);
  assert.equal(storage.contains(STORAGE_KEYS.TRAINING_SESSION_INDEX), false);
  assert.equal(storage.operations.some((operation) => operation.kind !== "read"), false);
  assert.ok(track.simulationProfiles?.some((profile) => profile.profileId === "algorithms-interview-simulation-v1"));
});
