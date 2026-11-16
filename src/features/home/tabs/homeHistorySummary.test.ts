import assert from "node:assert/strict";
import test from "node:test";
import type { ReviewQueueEntry, TrainingAttempt } from "../../../domain";
import { buildHomeOverviewMetrics } from "./homeOverviewPresentation";
import { projectHomeHistorySummary } from "./homeHistorySummary";

const TRACK = "coding-interview-dsa-problem-solving";
const NOW = "2026-10-02T12:00:00.000Z";
const attempt = (id: string, answeredAt: string, extra: Partial<{ trackId: string; sessionId: string; modeId: string }> = {}) =>
  ({ id, trackId: extra.trackId ?? TRACK, sessionId: extra.sessionId ?? id, modeId: extra.modeId ?? `mode-${id}`, answeredAt }) as unknown as TrainingAttempt;

// The pre-T27 HomeTab render computations, kept here as the reference.
function former(attempts: readonly TrainingAttempt[], reviews: readonly ReviewQueueEntry[], activeSessionId?: string) {
  const recent = attempts.filter((a) => a.trackId === TRACK && a.sessionId !== activeSessionId).sort((l, r) => r.answeredAt.localeCompare(l.answeredAt))[0];
  return {
    hasTrackAttempts: attempts.some((a) => a.trackId === TRACK),
    isEmpty: attempts.length === 0 && reviews.length === 0,
    recentAttemptModeId: recent?.modeId ?? null,
  };
}

test("T27: the Home history summary matches the former HomeTab render projections", () => {
  const cases: Array<[TrainingAttempt[], string | undefined]> = [
    [[], undefined],
    [[attempt("a", "2026-10-01T10:00:00.000Z", { trackId: "other-track" })], undefined],
    [[attempt("a", "2026-10-01T10:00:00.000Z"), attempt("b", "2026-10-01T11:00:00.000Z"), attempt("c", "2026-09-30T10:00:00.000Z")], undefined],
    // The latest attempt belongs to the active session: the one before it is shown.
    [[attempt("a", "2026-10-01T10:00:00.000Z"), attempt("b", "2026-10-01T11:00:00.000Z", { sessionId: "active" })], "active"],
    // Only active-session attempts: the track has progress but no recent attempt.
    [[attempt("a", "2026-10-01T10:00:00.000Z", { sessionId: "active" })], "active"],
    // Equal timestamps: the first one wins, as with the stable sort.
    [[attempt("a", "2026-10-01T10:00:00.000Z"), attempt("b", "2026-10-01T10:00:00.000Z")], undefined],
  ];
  for (const [attempts, activeSessionId] of cases) {
    const summary = projectHomeHistorySummary({ trackId: TRACK, trainingAttempts: attempts, reviewQueueItems: [], activeSessionId, now: NOW });
    const { trackId, overview, ...facts } = summary;
    assert.equal(trackId, TRACK);
    assert.deepEqual(facts, former(attempts, [], activeSessionId));
    assert.deepEqual(overview, buildHomeOverviewMetrics({ trackId: TRACK, trainingAttempts: attempts, reviewQueueItems: [], activeSessionId, now: NOW }));
  }
  const withReviewOnly = projectHomeHistorySummary({ trackId: TRACK, trainingAttempts: [], reviewQueueItems: [{} as ReviewQueueEntry], now: NOW });
  assert.equal(withReviewOnly.isEmpty, false);
});

test("T27: the summary is plain JSON (it is persisted in the Today snapshot)", () => {
  const summary = projectHomeHistorySummary({ trackId: TRACK, trainingAttempts: [attempt("a", "2026-10-01T10:00:00.000Z")], reviewQueueItems: [], now: NOW });
  assert.deepEqual(JSON.parse(JSON.stringify(summary)), summary);
});
