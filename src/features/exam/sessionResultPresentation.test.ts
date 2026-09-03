import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSessionResultDetails } from "./sessionResultPresentation";

test("opaque result evidence preserves all answered outcomes including partial credit", () => {
  assert.deepEqual(normalizeSessionResultDetails({ correctCount: 2, partialCount: 1, incorrectCount: 1, pointsEarned: 5, maxPoints: 8 }, 4), {
    score: { correctCount: 2, partialCount: 1, incorrectCount: 1 }, points: { earned: 5, max: 8 },
  });
});

test("missing, malformed and inconsistent evidence does not invent zero scores", () => {
  for (const value of [null, undefined, [], {}, { correctCount: 1, partialCount: 0, incorrectCount: 0 }, { correctCount: -1, partialCount: 1, incorrectCount: 2 }, { correctCount: 0.5, partialCount: 0.5, incorrectCount: 1 }, { correctCount: NaN, partialCount: 0, incorrectCount: 2 }]) {
    assert.equal(normalizeSessionResultDetails(value, 2).score, null);
  }
});

test("a real zero and an absent abandoned score remain distinct", () => {
  assert.deepEqual(normalizeSessionResultDetails({ correctCount: 0, partialCount: 0, incorrectCount: 2 }, 2).score, { correctCount: 0, partialCount: 0, incorrectCount: 2 });
  assert.equal(normalizeSessionResultDetails(null, 2).score, null);
  assert.deepEqual(normalizeSessionResultDetails({ correctCount: 0, partialCount: 0, incorrectCount: 0 }, 0).score, { correctCount: 0, partialCount: 0, incorrectCount: 0 });
});

test("invalid points stay unavailable without clamping", () => {
  for (const [pointsEarned, maxPoints] of [[-1, 2], [3, 2], [0, 0], [NaN, 2], [1, Infinity]]) {
    assert.equal(normalizeSessionResultDetails({ pointsEarned, maxPoints }, 0).points, null);
  }
});

test("exact historical maximum corrects display without mutating durable evidence", () => {
  const historical = Object.freeze({ correctCount: 1, partialCount: 1, incorrectCount: 0, pointsEarned: 3, maxPoints: 2 });
  const before = JSON.stringify(historical);
  assert.deepEqual(normalizeSessionResultDetails(historical, 2, 6).points, { earned: 3, max: 6 });
  assert.equal(JSON.stringify(historical), before);
  assert.equal(normalizeSessionResultDetails(historical, 2).points, null);
});
