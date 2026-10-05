import assert from "node:assert/strict";
import test from "node:test";

import { overallScoreCredit } from "./overallScoreCredit";

test("overall score credits correct attempts while preserving zero credit for partial and incorrect outcomes", () => {
  assert.equal(overallScoreCredit({ kind: "correct", earnedPoints: 1 }), 1);
  assert.equal(overallScoreCredit({ kind: "partial", earnedPoints: 0.5 }), 0);
  assert.equal(overallScoreCredit({ kind: "incorrect", earnedPoints: 0 }), 0);
});
