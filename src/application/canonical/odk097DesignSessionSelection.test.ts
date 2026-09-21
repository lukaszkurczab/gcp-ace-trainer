import assert from "node:assert/strict";
import test from "node:test";

import { loadCanonicalRuntimeCatalog, type CanonicalTrackRuntime } from "../../content/canonical/runtimeCatalog";
import type { ReviewQueueEntry, TrainingAttempt } from "../../domain";
import { CanonicalTrainingRuntime } from "./CanonicalTrainingRuntime";

const NOW = "2026-01-01T00:00:00.000Z";
const DESIGN_TRACKS = [
  { trackId: "backend-system-design-interview", freeNodeId: "requirements_capacity_and_architecture_decomposition" },
  { trackId: "object-oriented-design-interview", freeNodeId: "requirements_use_cases_domain_vocabulary_and_model_boundaries" },
  { trackId: "frontend-system-design-interview", freeNodeId: "requirements_user_journeys_constraints_and_frontend_decomposition" },
] as const;
const TRADEOFF_MODE = "design-interview-tradeoff-practice";
const REVIEW_MODE = "design-interview-weak-area-review";
const catalogPromise = loadCanonicalRuntimeCatalog();

const itemRef = (track: CanonicalTrackRuntime, questionId: string) => ({
  trackId: track.trackId,
  questionId,
  contentVersion: track.contentVersion,
  artifactSha256: track.artifactSha256,
});

const reviewFor = (item: TrainingAttempt<unknown>["item"], id: string, dueAt = NOW): ReviewQueueEntry => ({
  id: `review:${id}`,
  trackId: item.trackId,
  sourceAttemptId: `attempt:${id}`,
  sourceSessionId: `session:${id}`,
  sourceItem: item,
  taxonomyOrSkillRefs: [],
  reasons: ["scheduled_retrieval"],
  dueAt,
  createdAt: NOW,
  consecutiveAfterDueSuccesses: 0,
  persistent: false,
});

const incorrectAttemptFor = (item: TrainingAttempt<unknown>["item"], id: string): TrainingAttempt<unknown> => ({
  id: `attempt:${id}`,
  sessionId: `session:${id}`,
  trackId: item.trackId,
  modeId: "prior-mode",
  occurrenceId: `occurrence:${id}`,
  item,
  response: {},
  result: { kind: "incorrect", earnedPoints: 0, maxPoints: 1 },
  reviewEvidence: { sourceItem: item, taxonomyOrSkillRefs: [] },
  answeredAt: NOW,
  committedAt: NOW,
});

test("ODK-097 Design Tradeoff sessions use the exact free node and unique 10/20/40 items", async () => {
  const catalog = await catalogPromise;

  for (const expected of DESIGN_TRACKS) {
    const track = catalog.getTrack(expected.trackId);
    const runtime = new CanonicalTrainingRuntime(track);
    const mode = track.getMode(TRADEOFF_MODE);
    assert.deepEqual(mode.requestedLengths, [10, 20, 40]);
    assert.equal(mode.minimumActualLength, 10);
    assert.equal(mode.defaultRequestedLength, 10);

    for (const requestedLength of mode.requestedLengths) {
      const prepared = await runtime.prepare({
        trackId: track.trackId,
        modeId: TRADEOFF_MODE,
        request: { sessionId: `${track.trackId}:tradeoff:${requestedLength}`, requestedLength },
        attempts: [],
        reviews: [],
        now: NOW,
      });
      const questionIds = prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId);
      assert.equal(prepared.session.actualLength, requestedLength);
      assert.equal(new Set(questionIds).size, requestedLength);
      assert.ok(prepared.session.itemOrder.every((occurrence) => {
        const question = track.getQuestion(occurrence.item.questionId);
        return question?.trackId === track.trackId && question.nodeId === expected.freeNodeId;
      }));
    }
  }
});

test("ODK-097 Design Review is due-only, truthfully shortens, and fails closed without eligible evidence", async () => {
  const catalog = await catalogPromise;

  for (const expected of DESIGN_TRACKS) {
    const track = catalog.getTrack(expected.trackId);
    const runtime = new CanonicalTrainingRuntime(track);
    const mode = track.getMode(REVIEW_MODE);
    const pool = track.getPool(REVIEW_MODE);
    const dueReviews = pool.slice(0, 20).map((question, index) => reviewFor(itemRef(track, question.questionId), `${track.trackId}:due:${index}`));

    assert.deepEqual(mode.requestedLengths, [1, 10, 20]);
    assert.equal(mode.defaultRequestedLength, 10);
    for (const requestedLength of mode.requestedLengths) {
      const prepared = await runtime.prepare({
        trackId: track.trackId,
        modeId: REVIEW_MODE,
        request: { sessionId: `${track.trackId}:review:${requestedLength}`, requestedLength },
        attempts: [],
        reviews: dueReviews,
        now: NOW,
      });
      assert.equal(prepared.session.actualLength, requestedLength);
      assert.equal(new Set(prepared.session.itemOrder.map((occurrence) => occurrence.item.questionId)).size, requestedLength);
      assert.ok(prepared.session.itemOrder.every((occurrence) => track.getQuestion(occurrence.item.questionId)?.nodeId === expected.freeNodeId));
    }

    const shortened = await runtime.prepare({
      trackId: track.trackId,
      modeId: REVIEW_MODE,
      request: { sessionId: `${track.trackId}:review:shortened`, requestedLength: 20 },
      attempts: [],
      reviews: dueReviews.slice(0, 3),
      now: NOW,
    });
    assert.equal(shortened.session.requestedLength, 20);
    assert.equal(shortened.session.actualLength, 3);

    const future = reviewFor(itemRef(track, pool[0]!.questionId), `${track.trackId}:future`, "2026-01-02T00:00:00.000Z");
    await assert.rejects(runtime.prepare({
      trackId: track.trackId,
      modeId: REVIEW_MODE,
      request: { sessionId: `${track.trackId}:review:future`, requestedLength: 20 },
      attempts: [],
      reviews: [future],
      now: NOW,
    }), /insufficient eligible content/u);

    await assert.rejects(runtime.prepare({
      trackId: track.trackId,
      modeId: REVIEW_MODE,
      request: { sessionId: `${track.trackId}:review:empty`, requestedLength: 20 },
      attempts: [],
      reviews: [],
      now: NOW,
    }), /insufficient eligible content/u);
  }
});

test("ODK-097 Review evidence rejects stale, wrong-artifact, and cross-track entries", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack(DESIGN_TRACKS[0]!.trackId);
  const runtime = new CanonicalTrainingRuntime(track);
  const question = track.getPool(REVIEW_MODE)[0]!;
  const current = itemRef(track, question.questionId);
  const stale = { ...current, contentVersion: "backend-system-design-interview-stale-v0" };
  const wrongArtifact = { ...current, artifactSha256: "f".repeat(64) };
  const foreignTrack = catalog.getTrack(DESIGN_TRACKS[1]!.trackId);
  const foreign = itemRef(foreignTrack, foreignTrack.getPool(REVIEW_MODE)[0]!.questionId);

  for (const [label, review] of [
    ["stale", reviewFor(stale, "stale")],
    ["wrong-artifact", reviewFor(wrongArtifact, "wrong-artifact")],
    ["cross-track", reviewFor(foreign, "cross-track")],
  ] as const) {
    await assert.rejects(runtime.prepare({
      trackId: track.trackId,
      modeId: REVIEW_MODE,
      request: { sessionId: `review:${label}`, requestedLength: 1 },
      attempts: [],
      reviews: [review],
      now: NOW,
    }), /insufficient eligible content/u);
  }
});

test("ODK-097 committed misses remain identity-scoped for modes that explicitly consume them", async () => {
  const catalog = await catalogPromise;
  const track = catalog.getTrack("coding-interview-dsa-problem-solving");
  const modeId = "coding-interview-weak-area-review";
  const runtime = new CanonicalTrainingRuntime(track);
  const question = track.getPool(modeId)[0]!;
  const current = itemRef(track, question.questionId);
  const validMiss = incorrectAttemptFor(current, "valid");
  const staleMiss = incorrectAttemptFor({ ...current, artifactSha256: "e".repeat(64) }, "stale");
  const foreignTrack = catalog.getTrack("backend-system-design-interview");
  const crossTrackMiss = incorrectAttemptFor(itemRef(foreignTrack, foreignTrack.getPool("design-interview-learn-framework")[0]!.questionId), "cross-track");

  const prepared = await runtime.prepare({
    trackId: track.trackId,
    modeId,
    request: { sessionId: "coding-review-valid-miss", requestedLength: 20 },
    attempts: [validMiss],
    reviews: [],
    now: NOW,
  });
  assert.equal(prepared.session.actualLength, 1);
  assert.equal(prepared.session.itemOrder[0]!.item.questionId, question.questionId);

  for (const [label, attempt] of [["stale", staleMiss], ["cross-track", crossTrackMiss]] as const) {
    await assert.rejects(runtime.prepare({
      trackId: track.trackId,
      modeId,
      request: { sessionId: `coding-review-${label}`, requestedLength: 20 },
      attempts: [attempt],
      reviews: [],
      now: NOW,
    }), /insufficient eligible content/u);
  }
});
