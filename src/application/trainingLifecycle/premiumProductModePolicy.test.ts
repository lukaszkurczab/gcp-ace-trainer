import assert from "node:assert/strict";
import test from "node:test";

import { requiresPremiumForSessionContinuation, requiresPremiumProductMode } from "./premiumProductModePolicy";

test("declared Premium product modes bypass node-based admission", () => {
  assert.equal(requiresPremiumProductMode("coding-interview-approach-challenge"), true);
  assert.equal(requiresPremiumProductMode("certification-exam-simulation"), true);
  assert.equal(requiresPremiumProductMode("coding-interview-simulation"), true);
  assert.equal(requiresPremiumProductMode("coding-interview-guided-practice"), false);
  assert.equal(requiresPremiumProductMode("design-interview-learn-framework"), false);
  assert.equal(requiresPremiumProductMode("design-interview-tradeoff-practice"), false);
  assert.equal(requiresPremiumProductMode("design-interview-weak-area-review"), false);
  assert.equal(requiresPremiumProductMode("design-interview-simulation"), true);
  assert.equal(requiresPremiumProductMode("design-interview-unknown"), false);
});

test("ACM admission belongs to session start while simulation commands still require current Premium", () => {
  assert.equal(requiresPremiumForSessionContinuation("coding-interview-approach-challenge"), false);
  for (const mode of ["certification-exam-simulation", "coding-interview-simulation", "design-interview-simulation"]) assert.equal(requiresPremiumForSessionContinuation(mode), true);
  assert.equal(requiresPremiumForSessionContinuation("coding-interview-guided-practice"), false);
});
